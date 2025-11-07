import { ChatOpenAI } from 'langchain/chat_models/openai';
import { HumanMessage, SystemMessage } from 'langchain/schema';

// Configuration for LangChain OpenAI client
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const DEFAULT_MODEL = 'gpt-3.5-turbo';
const DEFAULT_TEMPERATURE = 0.7;
const DEFAULT_MAX_TOKENS = 1000;

// Validate API key on module initialization
if (!OPENAI_API_KEY) {
  console.warn(
    '⚠️  OPENAI_API_KEY not found in environment variables. AI features will be disabled.'
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
      openAIApiKey: OPENAI_API_KEY,
      modelName: DEFAULT_MODEL,
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
    const model = initializeChatModel();

    // Override model settings if provided
    if (options.model && options.model !== DEFAULT_MODEL) {
      model.modelName = options.model;
    }
    if (options.temperature !== undefined) {
      model.temperature = options.temperature;
    }
    if (options.maxTokens !== undefined) {
      model.maxTokens = options.maxTokens;
    }

    // Prepare messages
    const messages = [];

    if (options.systemMessage) {
      messages.push(new SystemMessage(options.systemMessage));
    }

    messages.push(new HumanMessage(prompt));

    // Call the model
    const response = await model.call(messages);

    return {
      content: response.content as string,
      model: model.modelName,
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

export { chatCompletion, isAIAvailable, getModelConfig, initializeChatModel };

export type { ChatCompletionOptions, ChatResponse };
