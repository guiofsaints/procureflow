/**
 * Token Usage Schema
 *
 * Tracks token consumption and costs for LLM API calls.
 */

import { Schema } from 'mongoose';

/**
 * Token usage tracking document
 */
export interface ITokenUsage {
  userId?: string; // User who made the request (optional for anonymous)
  conversationId?: string; // Associated conversation
  provider: 'openai' | 'gemini'; // AI provider used
  modelName: string; // Specific model (e.g., gpt-4o-mini)

  // Token counts
  promptTokens: number; // Input tokens
  completionTokens: number; // Output tokens
  totalTokens: number; // Sum of prompt + completion

  // Cost tracking
  costUSD: number; // Estimated cost in USD

  // Metadata
  endpoint?: string; // API endpoint called (e.g., /api/agent/chat)
  toolCalls?: number; // Number of tool calls in response
  cached?: boolean; // Whether response was from cache

  createdAt?: Date;
  updatedAt?: Date;
}

const TokenUsageSchema = new Schema<ITokenUsage>(
  {
    userId: {
      type: String,
      index: true,
      required: false,
    },
    conversationId: {
      type: String,
      required: false,
    },
    provider: {
      type: String,
      required: true,
      enum: ['openai', 'gemini'],
      index: true,
    },
    modelName: {
      type: String,
      required: true,
      index: true,
    },

    // Token counts
    promptTokens: {
      type: Number,
      required: true,
      min: 0,
    },
    completionTokens: {
      type: Number,
      required: true,
      min: 0,
    },
    totalTokens: {
      type: Number,
      required: true,
      min: 0,
    },

    // Cost
    costUSD: {
      type: Number,
      required: true,
      min: 0,
    },

    // Metadata
    endpoint: {
      type: String,
      required: false,
    },
    toolCalls: {
      type: Number,
      required: false,
      min: 0,
    },
    cached: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true, // Adds createdAt, updatedAt
    collection: 'token_usage',
  }
);

// Indexes for common queries
TokenUsageSchema.index({ userId: 1, createdAt: -1 }); // User usage over time
TokenUsageSchema.index({ conversationId: 1 }); // Conversation costs
TokenUsageSchema.index({ provider: 1, model: 1, createdAt: -1 }); // Model usage trends
TokenUsageSchema.index({ createdAt: -1 }); // Recent usage

// Collection name constant
export const TOKEN_USAGE_COLLECTION_NAME = 'token_usage';

// Default export for use in models.ts
export default TokenUsageSchema;
