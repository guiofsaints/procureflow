/**
 * @fileoverview Token counting and cost estimation for LLM usage.
 *
 * Uses tiktoken to count tokens for different models and estimate costs
 * based on provider pricing.
 *
 * @module lib/ai/tokenCounter
 */

import { encoding_for_model } from 'tiktoken';
import type { TiktokenModel } from 'tiktoken';

import type { AIProvider } from '@/lib/ai/providerAdapter';
import { logger } from '@/lib/logger/winston.config';

/**
 * Model pricing per 1M tokens (input/output)
 * Updated as of November 2025
 *
 * Sources:
 * - OpenAI: https://openai.com/api/pricing/
 * - Google Gemini: https://ai.google.dev/pricing
 */
const MODEL_PRICING: Record<
  string,
  { inputPer1M: number; outputPer1M: number; provider: AIProvider }
> = {
  // OpenAI GPT-4o models
  'gpt-4o': { inputPer1M: 2.5, outputPer1M: 10.0, provider: 'openai' },
  'gpt-4o-mini': { inputPer1M: 0.15, outputPer1M: 0.6, provider: 'openai' },
  'gpt-4o-2024-11-20': {
    inputPer1M: 2.5,
    outputPer1M: 10.0,
    provider: 'openai',
  },

  // OpenAI GPT-4 Turbo
  'gpt-4-turbo': { inputPer1M: 10.0, outputPer1M: 30.0, provider: 'openai' },
  'gpt-4-turbo-preview': {
    inputPer1M: 10.0,
    outputPer1M: 30.0,
    provider: 'openai',
  },

  // OpenAI GPT-3.5
  'gpt-3.5-turbo': { inputPer1M: 0.5, outputPer1M: 1.5, provider: 'openai' },
  'gpt-3.5-turbo-16k': {
    inputPer1M: 3.0,
    outputPer1M: 4.0,
    provider: 'openai',
  },

  // Google Gemini models
  'gemini-2.0-flash': { inputPer1M: 0.0, outputPer1M: 0.0, provider: 'gemini' }, // Free tier
  'gemini-1.5-flash': {
    inputPer1M: 0.075,
    outputPer1M: 0.3,
    provider: 'gemini',
  },
  'gemini-1.5-pro': { inputPer1M: 1.25, outputPer1M: 5.0, provider: 'gemini' },
};

/**
 * Map model names to tiktoken encoding names.
 * Some models share encodings.
 */
const MODEL_TO_ENCODING: Record<string, TiktokenModel> = {
  // GPT-4o uses o200k_base encoding
  'gpt-4o': 'gpt-4o',
  'gpt-4o-mini': 'gpt-4o-mini',
  'gpt-4o-2024-11-20': 'gpt-4o',

  // GPT-4 Turbo uses cl100k_base
  'gpt-4-turbo': 'gpt-4-turbo',
  'gpt-4-turbo-preview': 'gpt-4-turbo',

  // GPT-3.5 uses cl100k_base
  'gpt-3.5-turbo': 'gpt-3.5-turbo',
  'gpt-3.5-turbo-16k': 'gpt-3.5-turbo-16k',
};

/**
 * Count tokens in text using tiktoken.
 *
 * @param text - Text to count tokens for
 * @param model - Model name (affects encoding)
 * @returns Number of tokens
 *
 * @example
 * ```typescript
 * const tokens = countTokens('Hello, world!', 'gpt-4o-mini');
 * console.log(tokens); // 4
 * ```
 */
export function countTokens(
  text: string,
  model: string = 'gpt-4o-mini'
): number {
  try {
    // Get encoding for model
    const encodingModel =
      MODEL_TO_ENCODING[model] || ('gpt-4o-mini' as TiktokenModel);
    const encoding = encoding_for_model(encodingModel);

    // Encode and count
    const tokens = encoding.encode(text);
    const count = tokens.length;

    // Free encoding to prevent memory leaks
    encoding.free();

    return count;
  } catch (error) {
    logger.error('Token counting error', {
      error: error instanceof Error ? error.message : String(error),
      model,
      textLength: text.length,
    });

    // Fallback: Rough estimate (1 token ≈ 4 characters)
    return Math.ceil(text.length / 4);
  }
}

/**
 * Count tokens in array of messages.
 * Accounts for message formatting overhead.
 *
 * @param messages - Array of messages
 * @param model - Model name
 * @returns Total token count
 *
 * @example
 * ```typescript
 * const tokens = countMessageTokens([
 *   { role: 'user', content: 'Hello!' },
 *   { role: 'assistant', content: 'Hi there!' }
 * ], 'gpt-4o-mini');
 * ```
 */
export function countMessageTokens(
  messages: Array<{ role: string; content: string; name?: string }>,
  model: string = 'gpt-4o-mini'
): number {
  try {
    const encodingModel =
      MODEL_TO_ENCODING[model] || ('gpt-4o-mini' as TiktokenModel);
    const encoding = encoding_for_model(encodingModel);

    let totalTokens = 0;

    for (const message of messages) {
      // Message formatting overhead
      // Format: <|im_start|>{role}\n{content}<|im_end|>\n
      totalTokens += 4; // Base overhead per message

      // Role tokens
      totalTokens += encoding.encode(message.role).length;

      // Content tokens
      totalTokens += encoding.encode(message.content).length;

      // Name tokens (if present)
      if (message.name) {
        totalTokens += encoding.encode(message.name).length;
        totalTokens += 1; // Name formatting overhead
      }
    }

    // Conversation formatting overhead
    totalTokens += 2; // <|im_start|>assistant

    encoding.free();

    return totalTokens;
  } catch (error) {
    logger.error('Message token counting error', {
      error: error instanceof Error ? error.message : String(error),
      model,
      messageCount: messages.length,
    });

    // Fallback: Sum all content lengths and estimate
    const totalChars = messages.reduce(
      (sum, msg) => sum + msg.content.length,
      0
    );
    return Math.ceil(totalChars / 4) + messages.length * 4; // Add overhead
  }
}

/**
 * Estimate cost for token usage.
 *
 * @param model - Model name
 * @param inputTokens - Number of input tokens
 * @param outputTokens - Number of output tokens
 * @returns Cost in USD
 *
 * @example
 * ```typescript
 * const cost = estimateCost('gpt-4o-mini', 1000, 500);
 * console.log(cost); // 0.00045 (in USD)
 * ```
 */
export function estimateCost(
  model: string,
  inputTokens: number,
  outputTokens: number
): number {
  const pricing = MODEL_PRICING[model];

  if (!pricing) {
    logger.warn('Unknown model pricing', { model });
    return 0;
  }

  // Cost = (input tokens / 1M) * input price + (output tokens / 1M) * output price
  const inputCost = (inputTokens / 1_000_000) * pricing.inputPer1M;
  const outputCost = (outputTokens / 1_000_000) * pricing.outputPer1M;

  return inputCost + outputCost;
}

/**
 * Get pricing information for a model.
 *
 * @param model - Model name
 * @returns Pricing details or null if unknown
 */
export function getModelPricing(model: string) {
  const pricing = MODEL_PRICING[model];

  if (!pricing) {
    return null;
  }

  return {
    model,
    provider: pricing.provider,
    inputPer1M: pricing.inputPer1M,
    outputPer1M: pricing.outputPer1M,
    inputPer1K: pricing.inputPer1M / 1000,
    outputPer1K: pricing.outputPer1M / 1000,
  };
}

/**
 * Get all supported models with pricing.
 *
 * @returns Array of model pricing info
 */
export function getAllModelPricing() {
  return Object.keys(MODEL_PRICING).map((model) => ({
    model,
    ...MODEL_PRICING[model],
  }));
}

/**
 * Format cost as human-readable string.
 *
 * @param cost - Cost in USD
 * @returns Formatted string (e.g., "$0.0045" or "$0.45")
 */
export function formatCost(cost: number): string {
  if (cost === 0) {
    return '$0.00';
  }

  if (cost < 0.01) {
    // Show 4 decimal places for very small amounts
    return `$${cost.toFixed(4)}`;
  }

  // Show 2 decimal places for normal amounts
  return `$${cost.toFixed(2)}`;
}

/**
 * Calculate cost savings compared to a baseline model.
 *
 * @param actualModel - Model used
 * @param baselineModel - Model to compare against (default: gpt-4o)
 * @param inputTokens - Input tokens
 * @param outputTokens - Output tokens
 * @returns Savings info
 */
export function calculateSavings(
  actualModel: string,
  baselineModel: string = 'gpt-4o',
  inputTokens: number,
  outputTokens: number
) {
  const actualCost = estimateCost(actualModel, inputTokens, outputTokens);
  const baselineCost = estimateCost(baselineModel, inputTokens, outputTokens);

  const savings = baselineCost - actualCost;
  const savingsPercent = baselineCost > 0 ? (savings / baselineCost) * 100 : 0;

  return {
    actualCost,
    baselineCost,
    savings,
    savingsPercent,
    actualModel,
    baselineModel,
  };
}
