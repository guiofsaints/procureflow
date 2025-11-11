/**
 * AI Provider Adapter
 *
 * Unified interface for multiple LLM providers:
 * - OpenAI (GPT-4o-mini, GPT-4)
 * - Google Gemini (gemini-2.0-flash)
 * - Ollama (local LLMs)
 *
 * Selection priority (if AI_PROVIDER not set):
 * 1. Ollama (if OLLAMA_BASE_URL present)
 * 2. OpenAI (if OPENAI_API_KEY present)
 * 3. Gemini (if GOOGLE_API_KEY present)
 * 4. Fail fast with actionable error
 */

import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import type { BaseMessage } from '@langchain/core/messages';
import { AIMessage } from '@langchain/core/messages';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { ChatOpenAI } from '@langchain/openai';

import { estimateCost } from '@/lib/ai/tokenCounter';
import { TokenUsageModel } from '@/lib/db/models';
import { connectDB } from '@/lib/db/mongoose';
import { logger } from '@/lib/logger/winston.config';
import { llmCostUSD, llmTokensTotal } from '@/lib/metrics/prometheus.config';
import { withRateLimit } from '@/lib/reliability/rateLimiter';
import { withRetry } from '@/lib/reliability/retry';

// ============================================================================
// Types
// ============================================================================

export type AIProvider = 'openai' | 'gemini';

export interface ProviderConfig {
  provider: AIProvider;
  model: string;
  temperature?: number;
  maxTokens?: number;
  tools?: ToolDefinition[];
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

export interface AIResponse {
  content: string;
  toolCalls?: ToolCall[];
  usage?: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: string; // JSON string
}

export interface ProviderCapabilities {
  toolCalling: boolean;
  streaming: boolean;
  vision: boolean;
}

export interface ProviderInfo {
  provider: AIProvider;
  model: string;
  available: boolean;
  capabilities: ProviderCapabilities;
}

// ============================================================================
// Environment Variables
// ============================================================================

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const FORCED_PROVIDER = process.env.AI_PROVIDER as AIProvider | undefined;

// ============================================================================
// Provider Models Configuration
// ============================================================================

const PROVIDER_MODELS = {
  openai: {
    default: 'gpt-4o-mini',
    name: 'OpenAI',
    capabilities: {
      toolCalling: true,
      streaming: true,
      vision: false,
    },
  },
  gemini: {
    default: 'gemini-2.0-flash',
    name: 'Google Gemini',
    capabilities: {
      toolCalling: true,
      streaming: true,
      vision: false,
    },
  },
};

// ============================================================================
// Provider Selection Logic
// ============================================================================

/**
 * Detect available provider based on environment variables
 * Priority: env var override > OpenAI > Gemini
 */
function detectProvider(): AIProvider {
  // 1. Check for forced provider override
  if (FORCED_PROVIDER) {
    if (!['openai', 'gemini'].includes(FORCED_PROVIDER)) {
      throw new Error(
        `Invalid AI_PROVIDER: ${FORCED_PROVIDER}. Must be one of: openai, gemini`
      );
    }
    logger.info('Provider forced via AI_PROVIDER env var', {
      provider: FORCED_PROVIDER,
    });
    return FORCED_PROVIDER;
  }

  // 2. Check OpenAI (most reliable for production)
  if (OPENAI_API_KEY) {
    logger.info('OpenAI API key detected');
    return 'openai';
  }

  // 3. Check Gemini (free tier fallback)
  if (GOOGLE_API_KEY) {
    logger.info('Google API key detected');
    return 'gemini';
  }

  // 4. Fail fast with actionable error
  throw new Error(
    'No AI provider configured. Please set one of:\n' +
      '  - OPENAI_API_KEY for OpenAI (recommended)\n' +
      '  - GOOGLE_API_KEY for Google Gemini (free tier)\n' +
      'Or force a provider with AI_PROVIDER=openai|gemini'
  );
}

// Detect provider on module load
const ACTIVE_PROVIDER = detectProvider();
logger.info('AI Provider selected', {
  provider: ACTIVE_PROVIDER,
  model: PROVIDER_MODELS[ACTIVE_PROVIDER].default,
  name: PROVIDER_MODELS[ACTIVE_PROVIDER].name,
});

// ============================================================================
// Provider Factory
// ============================================================================

/**
 * Create chat model instance for the active provider
 */
function createChatModel(config?: Partial<ProviderConfig>): BaseChatModel {
  const provider = config?.provider || ACTIVE_PROVIDER;
  const model = config?.model || PROVIDER_MODELS[provider].default;
  const temperature = config?.temperature ?? 0.7;
  const maxTokens = config?.maxTokens ?? 1000;

  switch (provider) {
    case 'openai':
      if (!OPENAI_API_KEY) {
        throw new Error(
          'OpenAI API key required. Set OPENAI_API_KEY environment variable.'
        );
      }
      return new ChatOpenAI({
        apiKey: OPENAI_API_KEY,
        model,
        temperature,
        maxTokens,
        timeout: 30000, // 30s timeout
      });

    case 'gemini':
      if (!GOOGLE_API_KEY) {
        throw new Error(
          'Google API key required. Set GOOGLE_API_KEY environment variable.'
        );
      }
      return new ChatGoogleGenerativeAI({
        apiKey: GOOGLE_API_KEY,
        model,
        temperature,
        maxOutputTokens: maxTokens,
      });

    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
}

/**
 * Helper function to invoke ChatOpenAI with tools using LangChain
 * Returns a LangChain AIMessage compatible response
 */
async function invokeOpenAIWithTools(
  messages: BaseMessage[],
  tools: unknown[],
  config?: Partial<ProviderConfig>
): Promise<AIMessage> {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key required for tool calling');
  }

  const model = config?.model || PROVIDER_MODELS.openai.default;
  const temperature = config?.temperature ?? 0.7;
  const maxTokens = config?.maxTokens ?? 1000;

  // Format tools in OpenAI function calling format
  const formattedTools = (tools as ToolDefinition[]).map((tool) => ({
    type: 'function' as const,
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters,
    },
  }));

  logger.debug('Formatted tools for OpenAI', {
    toolCount: formattedTools.length,
    toolNames: formattedTools.map((t) => t.function.name),
  });

  // Create ChatOpenAI instance
  const chatModel = new ChatOpenAI({
    apiKey: OPENAI_API_KEY,
    model,
    temperature,
    maxTokens,
    timeout: 30000,
  });

  logger.debug('Invoking ChatOpenAI with tools', {
    messageCount: messages.length,
    toolCount: formattedTools.length,
  });

  // Invoke with tools as call options (LangChain 1.0 approach)
  const response = await chatModel.invoke(messages, {
    tools: formattedTools,
  });

  logger.debug('ChatOpenAI response received', {
    hasContent: !!response.content,
    contentLength: response.content?.toString().length || 0,
    hasToolCalls: !!response.additional_kwargs?.tool_calls,
    toolCallsCount: Array.isArray(response.additional_kwargs?.tool_calls)
      ? response.additional_kwargs.tool_calls.length
      : 0,
  });

  return response;
}

// ============================================================================
// Adapter API
// ============================================================================

/**
 * Invoke chat model with messages and optional tools
 */
export async function invokeChat(params: {
  messages: BaseMessage[];
  tools?: unknown[];
  config?: Partial<ProviderConfig>;
  userId?: string;
  conversationId?: string;
  endpoint?: string;
}): Promise<AIResponse> {
  const { messages, tools, config, userId, conversationId, endpoint } = params;
  const chatModel = createChatModel(config);

  const startTime = Date.now();
  const provider = config?.provider || ACTIVE_PROVIDER;

  logger.info('Invoking LLM', {
    provider,
    model: config?.model || PROVIDER_MODELS[provider].default,
    messageCount: messages.length,
    toolCount: tools?.length || 0,
  });

  try {
    // Apply reliability layers:
    // 1. Rate limiting (prevent overwhelming API)
    // 2. Retry logic (handle transient failures)
    const response = await withRateLimit(provider, async () => {
      return withRetry(provider, async () => {
        // Use dedicated function for OpenAI with tools
        if (tools && tools.length > 0 && provider === 'openai') {
          return await invokeOpenAIWithTools(messages, tools, config);
        }

        // Invoke LLM without tools or for other providers
        return await chatModel.invoke(messages);
      });
    });

    const elapsed = Date.now() - startTime;

    logger.info('LLM response received', {
      provider,
      latencyMs: elapsed,
      contentLength: response.content?.toString().length || 0,
    });

    // Extract tool calls if present
    const toolCalls: ToolCall[] = [];
    if (response.additional_kwargs?.function_call) {
      // OpenAI format (single function call)
      const fc = response.additional_kwargs.function_call as {
        name: string;
        arguments: string;
      };
      toolCalls.push({
        id: 'call_0',
        name: fc.name,
        arguments: fc.arguments,
      });
    } else if (response.additional_kwargs?.tool_calls) {
      // OpenAI format (multiple tool calls)
      const tcs = response.additional_kwargs.tool_calls as Array<{
        id?: string;
        function?: { name: string; arguments: string };
        name?: string;
        arguments?: string;
      }>;
      tcs.forEach((tc, idx: number) => {
        toolCalls.push({
          id: tc.id || `call_${idx}`,
          name: tc.function?.name || tc.name || '',
          arguments: tc.function?.arguments || tc.arguments || '{}',
        });
      });
    }

    // Extract usage information if available
    const usageMeta = response.usage_metadata as
      | {
          input_tokens?: number;
          output_tokens?: number;
          total_tokens?: number;
        }
      | undefined;

    const usage = usageMeta
      ? {
          inputTokens: usageMeta.input_tokens || 0,
          outputTokens: usageMeta.output_tokens || 0,
          totalTokens: usageMeta.total_tokens || 0,
        }
      : undefined;

    // Track token usage and cost
    if (usage) {
      const modelName = config?.model || PROVIDER_MODELS[provider].default;
      const cost = estimateCost(
        modelName,
        usage.inputTokens,
        usage.outputTokens
      );

      // Update Prometheus metrics
      llmTokensTotal.inc(
        { provider, model: modelName, type: 'input' },
        usage.inputTokens
      );
      llmTokensTotal.inc(
        { provider, model: modelName, type: 'output' },
        usage.outputTokens
      );
      llmCostUSD.inc({ provider, model: modelName }, cost);

      // Persist to database (async, don't block response)
      saveTokenUsage({
        provider,
        modelName,
        promptTokens: usage.inputTokens,
        completionTokens: usage.outputTokens,
        totalTokens: usage.totalTokens,
        costUSD: cost,
        toolCalls: toolCalls.length,
        userId,
        conversationId,
        endpoint,
      }).catch((err) => {
        logger.error('Failed to save token usage', {
          error: err instanceof Error ? err.message : String(err),
        });
      });

      logger.info('Token usage tracked', {
        provider,
        model: modelName,
        inputTokens: usage.inputTokens,
        outputTokens: usage.outputTokens,
        totalTokens: usage.totalTokens,
        costUSD: cost,
      });
    }

    return {
      content: response.content?.toString() || '',
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      usage,
    };
  } catch (error) {
    const elapsed = Date.now() - startTime;
    logger.error('LLM invocation failed', {
      provider,
      error: error instanceof Error ? error.message : 'Unknown error',
      latencyMs: elapsed,
    });
    throw error;
  }
}

/**
 * Save token usage to database
 */
async function saveTokenUsage(data: {
  provider: AIProvider;
  modelName: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  costUSD: number;
  toolCalls?: number;
  userId?: string;
  conversationId?: string;
  endpoint?: string;
}) {
  try {
    await connectDB();

    const usage = new TokenUsageModel({
      provider: data.provider,
      modelName: data.modelName,
      promptTokens: data.promptTokens,
      completionTokens: data.completionTokens,
      totalTokens: data.totalTokens,
      costUSD: data.costUSD,
      toolCalls: data.toolCalls,
      userId: data.userId,
      conversationId: data.conversationId,
      endpoint: data.endpoint,
      cached: false,
    });

    await usage.save();
  } catch (error) {
    // Log but don't throw - token tracking shouldn't block responses
    logger.error('Failed to save token usage to database', {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Get provider capabilities
 */
export function getCapabilities(provider?: AIProvider): ProviderCapabilities {
  const p = provider || ACTIVE_PROVIDER;
  return PROVIDER_MODELS[p].capabilities;
}

/**
 * Get active provider info
 */
export function getProviderInfo(): ProviderInfo {
  return {
    provider: ACTIVE_PROVIDER,
    model: PROVIDER_MODELS[ACTIVE_PROVIDER].default,
    available: true,
    capabilities: PROVIDER_MODELS[ACTIVE_PROVIDER].capabilities,
  };
}

/**
 * Get all available providers
 */
export function getAllProviders(): ProviderInfo[] {
  const providers: ProviderInfo[] = [];

  if (OPENAI_API_KEY) {
    providers.push({
      provider: 'openai',
      model: PROVIDER_MODELS.openai.default,
      available: true,
      capabilities: PROVIDER_MODELS.openai.capabilities,
    });
  }

  if (GOOGLE_API_KEY) {
    providers.push({
      provider: 'gemini',
      model: PROVIDER_MODELS.gemini.default,
      available: true,
      capabilities: PROVIDER_MODELS.gemini.capabilities,
    });
  }

  return providers;
}
