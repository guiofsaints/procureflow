import {
  AIMessage,
  HumanMessage,
  SystemMessage,
} from '@langchain/core/messages';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { ChatOpenAI } from '@langchain/openai';

import { logger } from '@/lib/logger/winston.config';

// Enable LangSmith tracing if configured
if (
  process.env.LANGCHAIN_TRACING_V2 === 'true' &&
  process.env.LANGCHAIN_API_KEY
) {
  // LangSmith environment variables are automatically picked up by LangChain
  logger.info('LangSmith tracing enabled', {
    project: process.env.LANGCHAIN_PROJECT || 'default',
  });
}

// AI Provider Configuration
type AIProvider = 'openai' | 'gemini';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

// Allow forcing a specific provider via environment variable
const FORCED_AI_PROVIDER = process.env.AI_PROVIDER as AIProvider | undefined;

// Determine which AI provider to use based on available API keys
// Priority: 1) Forced provider, 2) OpenAI (more reliable), 3) Gemini, 4) Default to OpenAI
const AI_PROVIDER: AIProvider =
  FORCED_AI_PROVIDER &&
  (FORCED_AI_PROVIDER === 'openai' || FORCED_AI_PROVIDER === 'gemini')
    ? FORCED_AI_PROVIDER
    : OPENAI_API_KEY
      ? 'openai'
      : GOOGLE_API_KEY
        ? 'gemini'
        : 'openai';

// Configuration for AI models
const DEFAULT_TEMPERATURE = 0.7;
const DEFAULT_MAX_TOKENS = 1000;

// Model configurations per provider
const MODEL_CONFIG = {
  openai: {
    defaultModel: 'gpt-4o-mini',
    name: 'OpenAI',
  },
  gemini: {
    // Using gemini-2.0-flash-exp which is free and supports function calling
    // Alternative free models: models/gemini-1.5-flash-latest, models/gemini-1.5-pro-latest
    defaultModel: 'gemini-2.0-flash',
    name: 'Google Gemini',
  },
};

// Validate API keys on module initialization
if (!OPENAI_API_KEY && !GOOGLE_API_KEY) {
  logger.warn(
    'Neither OPENAI_API_KEY nor GOOGLE_API_KEY found in environment variables. AI features will be disabled.'
  );
} else {
  logger.info('AI Provider initialized', {
    provider: AI_PROVIDER,
    name: MODEL_CONFIG[AI_PROVIDER].name,
  });
}

// Initialize the chat model cache
let chatModel: ChatOpenAI | ChatGoogleGenerativeAI | null = null;

/**
 * Create a chat model instance based on the configured provider
 */
function createChatModel(options: {
  model?: string;
  temperature?: number;
  maxTokens?: number;
}): ChatOpenAI | ChatGoogleGenerativeAI {
  const { model, temperature, maxTokens } = options;

  if (AI_PROVIDER === 'gemini') {
    if (!GOOGLE_API_KEY) {
      throw new Error(
        'Google API key is required. Please set GOOGLE_API_KEY in your environment variables.'
      );
    }

    // Try multiple model names for better compatibility
    const modelName = model || MODEL_CONFIG.gemini.defaultModel;

    return new ChatGoogleGenerativeAI({
      apiKey: GOOGLE_API_KEY,
      model: modelName,
      temperature: temperature ?? DEFAULT_TEMPERATURE,
      maxOutputTokens: maxTokens ?? DEFAULT_MAX_TOKENS,
    });
  } else {
    if (!OPENAI_API_KEY) {
      throw new Error(
        'OpenAI API key is required. Please set OPENAI_API_KEY in your environment variables.'
      );
    }

    return new ChatOpenAI({
      apiKey: OPENAI_API_KEY,
      model: model || MODEL_CONFIG.openai.defaultModel,
      temperature: temperature ?? DEFAULT_TEMPERATURE,
      maxTokens: maxTokens ?? DEFAULT_MAX_TOKENS,
      timeout: 30000, // 30 seconds timeout
    });
  }
}

/**
 * Get the default model name for the current provider
 */
function getDefaultModel(): string {
  return MODEL_CONFIG[AI_PROVIDER].defaultModel;
}

function initializeChatModel(): ChatOpenAI | ChatGoogleGenerativeAI {
  if (!OPENAI_API_KEY && !GOOGLE_API_KEY) {
    throw new Error(
      'AI API key is required. Please set OPENAI_API_KEY or GOOGLE_API_KEY in your environment variables.'
    );
  }

  if (!chatModel) {
    chatModel = createChatModel({
      model: getDefaultModel(),
      temperature: DEFAULT_TEMPERATURE,
      maxTokens: DEFAULT_MAX_TOKENS,
    });
  }

  return chatModel;
}

// Interface for chat completion options
interface ChatCompletionOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemMessage?: string;
}

// Interface for chat response
interface ChatResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model: string;
}

/**
 * Simple wrapper for OpenAI chat completions via LangChain
 *
 * @param prompt - The user prompt/message
 * @param options - Optional configuration for the request
 * @returns Promise<ChatResponse> - The AI response
 */
async function chatCompletion(
  prompt: string,
  options: ChatCompletionOptions = {}
): Promise<ChatResponse> {
  try {
    if (!OPENAI_API_KEY && !GOOGLE_API_KEY) {
      throw new Error(
        'AI API key is required. Please set OPENAI_API_KEY or GOOGLE_API_KEY in your environment variables.'
      );
    }

    // Create model with options (LangChain 1.0: create instance per request for different configs)
    const model = createChatModel({
      model: options.model,
      temperature: options.temperature,
      maxTokens: options.maxTokens,
    });

    // Prepare messages
    const messages = [];

    if (options.systemMessage) {
      messages.push(new SystemMessage(options.systemMessage));
    }

    messages.push(new HumanMessage(prompt));

    // Call the model using invoke() (LangChain 1.0 API)
    const response = await model.invoke(messages);

    return {
      content: response.content as string,
      model: options.model || getDefaultModel(),
      // Note: Usage information might not be available in all LangChain versions
      // You may need to implement token counting separately if needed
    };
  } catch (error) {
    logger.error('AI API error', { error });

    if (error instanceof Error) {
      // Handle specific error types
      if (error.message.includes('API key')) {
        throw new Error('Invalid or missing AI API key');
      }
      if (
        error.message.includes('rate limit') ||
        error.message.includes('429')
      ) {
        logger.error('Rate limit exceeded', { message: error.message });
        throw new Error(
          'AI API rate limit exceeded. Please wait a moment and try again.'
        );
      }
      if (
        error.message.includes('quota') ||
        error.message.includes('insufficient_quota')
      ) {
        logger.error('Quota exceeded', { message: error.message });
        throw new Error(
          `AI API quota exceeded. Please check your ${AI_PROVIDER === 'gemini' ? 'Google Cloud' : 'OpenAI'} billing and usage limits.`
        );
      }
      if (error.message.includes('timeout')) {
        throw new Error('AI API request timed out. Please try again.');
      }
    }

    throw new Error(
      `AI service error: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Predefined prompt templates for common procurement use cases
 * These are placeholder examples for the bootstrap codebase
 */
export const promptTemplates = {
  // Example: Analyze a procurement request
  analyzeRequest: (requestText: string) => ({
    prompt: `Analyze the following procurement request and extract key information:

Request: "${requestText}"

Please identify:
1. Category of goods/services
2. Estimated budget range (if mentioned)
3. Urgency level
4. Key requirements
5. Potential suppliers to consider

Provide a structured analysis.`,
    systemMessage:
      'You are a procurement analysis assistant. Provide clear, structured responses.',
  }),

  // Example: Generate supplier evaluation criteria
  generateCriteria: (category: string) => ({
    prompt: `Generate evaluation criteria for selecting suppliers in the "${category}" category.`,
    systemMessage:
      'You are a procurement expert. Create comprehensive but practical evaluation criteria.',
  }),

  // Example: Risk assessment
  assessRisk: (supplierInfo: string) => ({
    prompt: `Assess the procurement risks for this supplier information:

${supplierInfo}

Provide risk levels (high/medium/low) for different risk categories.`,
    systemMessage:
      'You are a risk assessment specialist focused on procurement and supply chain risks.',
  }),
};

/**
 * Check if AI features are available
 */
function isAIAvailable(): boolean {
  return !!(OPENAI_API_KEY || GOOGLE_API_KEY);
}

/**
 * Get the current model configuration
 */
function getModelConfig() {
  return {
    provider: AI_PROVIDER,
    providerName: MODEL_CONFIG[AI_PROVIDER].name,
    model: getDefaultModel(),
    temperature: DEFAULT_TEMPERATURE,
    maxTokens: DEFAULT_MAX_TOKENS,
    available: isAIAvailable(),
  };
}

/**
 * Chat completion with function/tool calling support
 *
 * @param prompt - The user prompt/message
 * @param options - Configuration options including tools
 * @returns Promise with response content and optional tool calls
 */
interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, unknown>;
    required: string[];
  };
}

interface ChatWithToolsOptions extends ChatCompletionOptions {
  tools?: ToolDefinition[];
  conversationHistory?: Array<{ role: string; content: string }>;
}

interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

interface ChatWithToolsResponse extends ChatResponse {
  toolCalls?: ToolCall[];
  finishReason?: 'stop' | 'tool_calls' | 'length';
}

async function chatCompletionWithTools(
  prompt: string,
  options: ChatWithToolsOptions = {}
): Promise<ChatWithToolsResponse> {
  try {
    if (!OPENAI_API_KEY && !GOOGLE_API_KEY) {
      throw new Error(
        'AI API key is required. Please set OPENAI_API_KEY or GOOGLE_API_KEY in your environment variables.'
      );
    }

    logger.debug('Starting chat completion', {
      provider: AI_PROVIDER,
      hasOpenAIKey: !!OPENAI_API_KEY,
      hasGoogleKey: !!GOOGLE_API_KEY,
      promptLength: prompt.length,
      hasTools: !!(options.tools && options.tools.length > 0),
      toolsCount: options.tools?.length || 0,
      hasHistory: !!(
        options.conversationHistory && options.conversationHistory.length > 0
      ),
      historyLength: options.conversationHistory?.length || 0,
    });

    // Create model with function calling support
    const model = createChatModel({
      model: options.model,
      temperature: options.temperature,
      maxTokens: options.maxTokens,
    });

    // Format tools for function calling
    let formattedTools: unknown[] | undefined;
    if (options.tools && options.tools.length > 0) {
      formattedTools = options.tools.map((tool) => ({
        type: 'function' as const,
        function: {
          name: tool.name,
          description: tool.description,
          parameters: tool.parameters,
        },
      }));
    }

    // Prepare messages with conversation history
    const messages = [];

    // System message must be first
    if (options.systemMessage) {
      messages.push(new SystemMessage(options.systemMessage));
    }

    // Add conversation history if provided
    if (options.conversationHistory && options.conversationHistory.length > 0) {
      for (const msg of options.conversationHistory) {
        if (msg.role === 'user') {
          messages.push(new HumanMessage(msg.content));
        } else if (msg.role === 'agent') {
          // Use AIMessage for agent responses, not SystemMessage
          messages.push(new AIMessage(msg.content));
        }
      }
    }

    messages.push(new HumanMessage(prompt));

    // Call the model with tools if provided
    const invokeOptions = formattedTools ? { tools: formattedTools } : {};
    const response = await model.invoke(messages, invokeOptions);

    logger.debug('Raw LLM response received', {
      contentType: typeof response.content,
      isArray: Array.isArray(response.content),
      contentValue: response.content,
      hasAdditionalKwargs: !!response.additional_kwargs,
      hasToolCalls: !!response.additional_kwargs?.tool_calls,
      toolCallsCount: response.additional_kwargs?.tool_calls?.length || 0,
    });

    // Extract tool calls if present
    const toolCalls: ToolCall[] = [];

    // Check if response has tool_calls (function calling format)
    if (response.additional_kwargs?.tool_calls) {
      for (const toolCall of response.additional_kwargs.tool_calls) {
        toolCalls.push({
          id: toolCall.id,
          name: toolCall.function.name,
          arguments: JSON.parse(toolCall.function.arguments),
        });
      }
    }

    // Ensure content is always a string
    let contentString = '';
    if (typeof response.content === 'string') {
      contentString = response.content;
    } else if (Array.isArray(response.content)) {
      // When LLM returns function calls, content might be an array
      // Extract text parts if any exist
      const textParts = response.content
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .filter((part: any) => {
          return (
            typeof part === 'object' &&
            part !== null &&
            'type' in part &&
            part.type === 'text' &&
            'text' in part
          );
        })
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((part: any) => part.text || '');
      contentString = textParts.join(' ').trim();
    } else if (response.content) {
      // Fallback: stringify if it's some other object
      contentString = String(response.content);
    }

    // Warn if we got an empty response with no tool calls
    if (!contentString && toolCalls.length === 0) {
      logger.warn('Empty response from LLM', {
        provider: AI_PROVIDER,
        suggestions: [
          'API key may be invalid or expired',
          'Model may not support function calling',
          'Rate limiting or quota issues',
          'Consider setting AI_PROVIDER=openai in .env.local',
        ],
      });
    }

    return {
      content: contentString,
      model: options.model || getDefaultModel(),
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      finishReason:
        (response.additional_kwargs?.finish_reason as
          | 'stop'
          | 'tool_calls'
          | 'length') || 'stop',
    };
  } catch (error) {
    logger.error('AI API error in chatCompletionWithTools', { error });

    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        throw new Error('Invalid or missing AI API key');
      }
      if (
        error.message.includes('rate limit') ||
        error.message.includes('429')
      ) {
        logger.error('Rate limit exceeded', { message: error.message });
        throw new Error(
          'AI API rate limit exceeded. Please wait a moment and try again.'
        );
      }
      if (
        error.message.includes('quota') ||
        error.message.includes('insufficient_quota')
      ) {
        logger.error('Quota exceeded', { message: error.message });
        throw new Error(
          `AI API quota exceeded. Please check your ${AI_PROVIDER === 'gemini' ? 'Google Cloud' : 'OpenAI'} billing and usage limits.`
        );
      }
      if (error.message.includes('timeout')) {
        throw new Error('AI API request timed out. Please try again.');
      }
    }

    throw new Error(
      `AI service error: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export {
  chatCompletion,
  chatCompletionWithTools,
  isAIAvailable,
  getModelConfig,
  initializeChatModel,
  AI_PROVIDER,
  MODEL_CONFIG,
};

export type {
  ChatCompletionOptions,
  ChatResponse,
  ChatWithToolsOptions,
  ChatWithToolsResponse,
  ToolDefinition,
  ToolCall,
  AIProvider,
};
