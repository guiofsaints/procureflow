import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { ChatOpenAI } from '@langchain/openai';

// Configuration for LangChain OpenAI client
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const DEFAULT_MODEL = 'gpt-4o-mini'; // Changed to gpt-4o-mini for function calling
const DEFAULT_TEMPERATURE = 0.7;
const DEFAULT_MAX_TOKENS = 1000;

// Validate API key on module initialization
if (!OPENAI_API_KEY) {
  console.warn(
    'OPENAI_API_KEY not found in environment variables. AI features will be disabled.'
  );
}

// Initialize the OpenAI chat model
let chatModel: ChatOpenAI | null = null;

function initializeChatModel(): ChatOpenAI {
  if (!OPENAI_API_KEY) {
    throw new Error(
      'OpenAI API key is required. Please set OPENAI_API_KEY in your environment variables.'
    );
  }

  if (!chatModel) {
    chatModel = new ChatOpenAI({
      apiKey: OPENAI_API_KEY,
      model: DEFAULT_MODEL,
      temperature: DEFAULT_TEMPERATURE,
      maxTokens: DEFAULT_MAX_TOKENS,
      timeout: 30000, // 30 seconds timeout
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
    if (!OPENAI_API_KEY) {
      throw new Error(
        'OpenAI API key is required. Please set OPENAI_API_KEY in your environment variables.'
      );
    }

    // Create model with options (LangChain 1.0: create instance per request for different configs)
    const model = new ChatOpenAI({
      apiKey: OPENAI_API_KEY,
      model: options.model || DEFAULT_MODEL,
      temperature: options.temperature ?? DEFAULT_TEMPERATURE,
      maxTokens: options.maxTokens ?? DEFAULT_MAX_TOKENS,
      timeout: 30000,
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
      model: options.model || DEFAULT_MODEL,
      // Note: Usage information might not be available in all LangChain versions
      // You may need to implement token counting separately if needed
    };
  } catch (error) {
    console.error('❌ OpenAI API error:', error);

    if (error instanceof Error) {
      // Handle specific error types
      if (error.message.includes('API key')) {
        throw new Error('Invalid or missing OpenAI API key');
      }
      if (error.message.includes('rate limit')) {
        throw new Error(
          'OpenAI API rate limit exceeded. Please try again later.'
        );
      }
      if (error.message.includes('quota')) {
        throw new Error(
          'OpenAI API quota exceeded. Please check your billing.'
        );
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
  return !!OPENAI_API_KEY;
}

/**
 * Get the current model configuration
 */
function getModelConfig() {
  return {
    model: DEFAULT_MODEL,
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
    if (!OPENAI_API_KEY) {
      throw new Error(
        'OpenAI API key is required. Please set OPENAI_API_KEY in your environment variables.'
      );
    }

    // Create model with function calling support
    const model = new ChatOpenAI({
      apiKey: OPENAI_API_KEY,
      model: options.model || DEFAULT_MODEL,
      temperature: options.temperature ?? DEFAULT_TEMPERATURE,
      maxTokens: options.maxTokens ?? DEFAULT_MAX_TOKENS,
      timeout: 30000,
    });

    // Format tools for OpenAI function calling
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

    if (options.systemMessage) {
      messages.push(new SystemMessage(options.systemMessage));
    }

    // Add conversation history if provided
    if (options.conversationHistory && options.conversationHistory.length > 0) {
      for (const msg of options.conversationHistory) {
        if (msg.role === 'user') {
          messages.push(new HumanMessage(msg.content));
        } else if (msg.role === 'assistant' || msg.role === 'agent') {
          messages.push(new SystemMessage(msg.content));
        }
      }
    }

    messages.push(new HumanMessage(prompt));

    // Call the model with tools if provided
    const invokeOptions = formattedTools ? { tools: formattedTools } : {};
    const response = await model.invoke(messages, invokeOptions);

    // Extract tool calls if present
    const toolCalls: ToolCall[] = [];

    // Check if response has tool_calls (OpenAI function calling format)
    if (response.additional_kwargs?.tool_calls) {
      for (const toolCall of response.additional_kwargs.tool_calls) {
        toolCalls.push({
          id: toolCall.id,
          name: toolCall.function.name,
          arguments: JSON.parse(toolCall.function.arguments),
        });
      }
    }

    return {
      content: response.content as string,
      model: options.model || DEFAULT_MODEL,
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      finishReason:
        (response.additional_kwargs?.finish_reason as
          | 'stop'
          | 'tool_calls'
          | 'length') || 'stop',
    };
  } catch (error) {
    console.error('❌ OpenAI API error:', error);

    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        throw new Error('Invalid or missing OpenAI API key');
      }
      if (error.message.includes('rate limit')) {
        throw new Error(
          'OpenAI API rate limit exceeded. Please try again later.'
        );
      }
      if (error.message.includes('quota')) {
        throw new Error(
          'OpenAI API quota exceeded. Please check your billing.'
        );
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
};

export type {
  ChatCompletionOptions,
  ChatResponse,
  ChatWithToolsOptions,
  ChatWithToolsResponse,
  ToolDefinition,
  ToolCall,
};
