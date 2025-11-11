/**
 * Agent Service
 *
 * Business logic for AI agent conversational interface:
 * - Handle user messages
 * - Orchestrate LangChain agent with tools
 * - Persist conversation history
 * - Log actions for debugging
 *
 * Enforces business rules from PRD (BR-3.x).
 */

import type { Types } from 'mongoose';

import type { AgentMessageDocument } from '@/domain/documents';
import type { AgentMessage } from '@/domain/entities';
import { AgentMessageRole } from '@/domain/entities';
import type {
  AgentCart,
  AgentCheckoutConfirmation,
  AgentConversationSummary,
  AgentItem,
  AgentPurchaseRequest,
} from '@/features/agent/types';
import { mapConversationToSummary } from '@/lib/db/mappers';
import { AgentConversationModel } from '@/lib/db/models';
import connectDB from '@/lib/db/mongoose';
import { logger } from '@/lib/logger/winston.config';
import {
  agentRequestTotal,
  agentRequestDuration,
} from '@/lib/metrics/prometheus.config';

import { orchestrateAgentTurn } from './agent-orchestrator';

// ============================================================================
// Types
// ============================================================================

export interface HandleAgentMessageParams {
  /** User ID (optional for demo, recommended for production) */
  userId?: string | Types.ObjectId;

  /** User's message */
  message: string;

  /** Existing conversation ID (optional, creates new if not provided) */
  conversationId?: string;
}

export interface AgentResponseItem {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  availability: 'in_stock' | 'out_of_stock' | 'limited';
}

export interface AgentResponseCart {
  items: Array<{
    itemId: string;
    itemName: string;
    itemPrice: number;
    quantity: number;
  }>;
  totalCost: number;
  itemCount: number;
}

export interface AgentResponse {
  conversationId: string;
  title?: string;
  messages: AgentMessage[];
}

// ============================================================================
// Error Classes
// ============================================================================

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

// ============================================================================
// Service Functions
// ============================================================================

/**
 * Handle incoming message from user to agent
 *
 * Business Rules:
 * - BR-3.1: Agent confirms actions before executing
 * - BR-3.2: Agent explains actions
 * - BR-3.3: Agent asks clarifying questions for ambiguity
 * - BR-3.4: Agent respects cart and checkout rules
 * - BR-3.5: Agent logs conversation and actions
 *
 * @param params - Message parameters
 * @returns Updated conversation
 */
export async function handleAgentMessage(
  params: HandleAgentMessageParams
): Promise<AgentResponse> {
  const startTime = Date.now();
  const { userId, message, conversationId } = params;

  // Log incoming request
  logger.info('Agent request received', {
    conversationId: conversationId || 'new',
    userId: userId?.toString() || 'anonymous',
    messageLength: message.length,
  });

  await connectDB();

  // Validate message
  if (!message || message.trim().length === 0) {
    logger.warn('Empty message validation failed', {
      conversationId,
      userId: userId?.toString(),
    });
    throw new ValidationError('Message cannot be empty');
  }

  // Start metrics timer
  const endTimer = agentRequestDuration.startTimer({
    provider: 'unknown', // Will be updated with actual provider
    status: 'pending',
  });

  try {
    // Find or create conversation
    let conversation;

    if (conversationId) {
      conversation =
        await AgentConversationModel.findById(conversationId).exec();

      if (!conversation) {
        throw new ValidationError('Conversation not found');
      }
    } else {
      // Create new conversation with title from first message
      const title = message.trim().substring(0, 60); // First 60 chars as title
      const preview = message.trim().substring(0, 100); // First 100 chars as preview

      conversation = new AgentConversationModel({
        userId: userId || null,
        title: title || 'New conversation',
        lastMessagePreview: preview || 'No messages yet',
        messages: [],
        actions: [],
        status: 'in_progress',
      });
    }

    // Add user message to conversation
    conversation.messages.push({
      sender: 'user',
      content: message.trim(),
      createdAt: new Date(),
    });

    // Update lastMessagePreview with user's message
    conversation.lastMessagePreview = message.trim().substring(0, 100);

    // Use orchestrator for agent turn (Step 8 refactor)
    const orchestrationResult = await orchestrateAgentTurn({
      userMessage: message,
      conversation,
      userId: userId?.toString() || 'anonymous',
      conversationId: conversation._id?.toString() || 'new',
      maxTokens: 3000,
    });

    logger.info('Orchestration completed', {
      conversationId: conversation._id?.toString(),
      iterations: orchestrationResult.iterations,
      toolCallsCount: orchestrationResult.toolCallsCount,
      maxIterationsReached: orchestrationResult.maxIterationsReached,
      hasMetadata: !!orchestrationResult.metadata,
      metadataKeys: orchestrationResult.metadata
        ? Object.keys(orchestrationResult.metadata)
        : [],
    });

    // Add orchestrator messages to conversation
    // The orchestrator returns BaseMessage[] which we need to convert to conversation messages
    for (const msg of orchestrationResult.messages) {
      if (msg._getType() === 'ai') {
        const content = msg.content as string;
        // Only add AI messages with non-empty content
        if (content && content.trim().length > 0) {
          conversation.messages.push({
            sender: 'agent',
            content: content.trim(),
            createdAt: new Date(),
          });
        }
      } else if (msg._getType() === 'tool') {
        // Tool messages are internal, don't add to conversation
        continue;
      }
    }

    // Add metadata from orchestrator to the last agent message
    if (orchestrationResult.metadata && conversation.messages.length > 0) {
      const lastMessage =
        conversation.messages[conversation.messages.length - 1];
      if (lastMessage.sender === 'agent') {
        logger.debug('Adding metadata to last agent message', {
          conversationId: conversation._id?.toString(),
          metadataKeys: Object.keys(orchestrationResult.metadata),
          hasItems: !!orchestrationResult.metadata.items,
          hasCart: !!orchestrationResult.metadata.cart,
          hasCheckout: !!orchestrationResult.metadata.checkoutConfirmation,
          hasPurchaseRequest: !!orchestrationResult.metadata.purchaseRequest,
        });

        // Initialize metadata object if not present
        if (!lastMessage.metadata) {
          lastMessage.metadata = {};
        }

        // Add items if present
        if (orchestrationResult.metadata.items) {
          lastMessage.metadata.items = orchestrationResult.metadata.items;
        }

        // Add cart if present
        if (orchestrationResult.metadata.cart) {
          lastMessage.metadata.cart = orchestrationResult.metadata.cart;
        }

        // Add checkout confirmation if present
        if (orchestrationResult.metadata.checkoutConfirmation) {
          lastMessage.metadata.checkoutConfirmation =
            orchestrationResult.metadata.checkoutConfirmation;
        }

        // Add purchase request if present
        if (orchestrationResult.metadata.purchaseRequest) {
          lastMessage.metadata.purchaseRequest =
            orchestrationResult.metadata.purchaseRequest;
        }

        logger.debug('Metadata added to message', {
          conversationId: conversation._id?.toString(),
          messageMetadataKeys: Object.keys(lastMessage.metadata || {}),
        });

        // Mark the messages array as modified for Mongoose to detect changes
        // This is critical for Schema.Types.Mixed fields in subdocuments
        conversation.markModified('messages');
      }
    }

    // Update lastMessagePreview with agent's final response
    // Ensure it's not empty (fallback to orchestration result content)
    const previewContent =
      orchestrationResult.content?.trim() || 'Processing...';
    conversation.lastMessagePreview = previewContent.substring(0, 100);

    // Save conversation
    await conversation.save();

    // Record success metrics
    const elapsed = Date.now() - startTime;
    endTimer({ status: 'success' });
    agentRequestTotal.inc({ status: 'success', provider: 'openai' }); // TODO: Get actual provider

    logger.info('Agent request completed', {
      conversationId: conversation._id.toString(),
      userId: userId?.toString() || 'anonymous',
      latencyMs: elapsed,
      messageCount: conversation.messages.length,
    });

    // Map to DTO
    return {
      conversationId: conversation._id.toString(),
      messages: conversation.messages.map((msg: AgentMessageDocument) => {
        // Map MongoDB 'sender' to AgentMessageRole
        // sender: 'agent' → role: 'agent'
        // sender: 'user' → role: 'user'
        // sender: 'system' → role: 'system'
        const role =
          msg.sender === 'agent'
            ? AgentMessageRole.Agent
            : msg.sender === 'user'
              ? AgentMessageRole.User
              : AgentMessageRole.System;

        const message: AgentMessage = {
          role,
          content: msg.content,
          timestamp: msg.createdAt,
        };

        // Add items if present in metadata
        if (msg.metadata?.items) {
          message.items = msg.metadata.items as AgentItem[];
        }

        // Add cart if present in metadata
        if (msg.metadata?.cart) {
          message.cart = msg.metadata.cart as AgentCart;
        }

        // Add checkout confirmation if present in metadata
        if (msg.metadata?.checkoutConfirmation) {
          message.checkoutConfirmation = msg.metadata
            .checkoutConfirmation as AgentCheckoutConfirmation;
        }

        // Add purchase request if present in metadata
        if (msg.metadata?.purchaseRequest) {
          message.purchaseRequest = msg.metadata
            .purchaseRequest as AgentPurchaseRequest;
        }

        return message;
      }),
    };
  } catch (error) {
    // Record error metrics
    const elapsed = Date.now() - startTime;
    endTimer({ status: 'error' });
    agentRequestTotal.inc({ status: 'error', provider: 'unknown' });

    logger.error('Agent request failed', {
      conversationId: conversationId || 'new',
      userId: userId?.toString() || 'anonymous',
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      latencyMs: elapsed,
    });

    if (error instanceof ValidationError) {
      throw error;
    }
    throw new Error('Failed to process agent message');
  }
}

// ============================================================================
// Conversation History Functions
// ============================================================================

/**
 * List conversations for a user (sorted by most recent)
 *
 * @param userId - User ID
 * @param limit - Maximum number of conversations to return
 * @returns Array of conversation summaries
 */
export async function listConversationsForUser(
  userId: string,
  limit = 10
): Promise<AgentConversationSummary[]> {
  await connectDB();

  try {
    // Check if userId is a valid ObjectId (24 character hex string)
    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(userId);

    if (!isValidObjectId) {
      // If userId is not a valid ObjectId (e.g., demo user with id "1"),
      // return empty array instead of querying
      return [];
    }

    const conversations = await AgentConversationModel.find({ userId })
      .sort({ updatedAt: -1 })
      .limit(limit)
      .lean()
      .exec();

    return conversations.map(mapConversationToSummary);
  } catch (error) {
    logger.error('Error listing conversations', { userId, error });
    throw new Error('Failed to list conversations');
  }
}

/**
 * Create a new conversation for a user
 *
 * @param userId - User ID
 * @param params - Conversation parameters
 * @returns Created conversation summary
 */
export async function createConversationForUser(
  userId: string,
  params: { title: string; lastMessagePreview: string }
): Promise<AgentConversationSummary> {
  await connectDB();

  try {
    // Check if userId is a valid ObjectId
    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(userId);

    if (!isValidObjectId) {
      // For demo users with invalid ObjectId, throw a descriptive error
      throw new Error(
        `Cannot create conversation: userId "${userId}" is not a valid MongoDB ObjectId. Please use a real user account.`
      );
    }

    const conversation = new AgentConversationModel({
      userId,
      title: params.title.substring(0, 120), // Enforce max length
      lastMessagePreview: params.lastMessagePreview.substring(0, 120),
      messages: [],
      status: 'in_progress',
    });

    await conversation.save();

    return mapConversationToSummary(conversation);
  } catch (error) {
    logger.error('Error creating conversation', { userId, error });
    throw new Error('Failed to create conversation');
  }
}

/**
 * Get a conversation summary by ID (with user validation)
 *
 * @param userId - User ID (for authorization)
 * @param id - Conversation ID
 * @returns Conversation summary or null if not found
 */
export async function getConversationSummaryById(
  userId: string,
  id: string
): Promise<AgentConversationSummary | null> {
  await connectDB();

  try {
    const conversation = await AgentConversationModel.findOne({
      _id: id,
      userId,
    })
      .lean()
      .exec();

    if (!conversation) {
      return null;
    }

    return mapConversationToSummary(conversation);
  } catch (error) {
    logger.error('Error getting conversation summary', { userId, id, error });
    return null;
  }
}

/**
 * Get a complete conversation by ID (with user validation)
 * Includes all messages, unlike the summary version
 *
 * @param userId - User ID (for authorization)
 * @param id - Conversation ID
 * @returns Complete conversation with messages or null if not found
 */
export async function getConversationById(
  userId: string,
  id: string
): Promise<AgentResponse | null> {
  await connectDB();

  try {
    const conversation = await AgentConversationModel.findOne({
      _id: id,
      userId,
    })
      .lean()
      .exec();

    if (!conversation) {
      return null;
    }

    // Map to AgentResponse format with full messages
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const conv = conversation as any;
    return {
      conversationId: conv._id.toString(),
      title: conv.title || 'Untitled conversation',
      messages: conv.messages.map((msg: AgentMessageDocument) => {
        // Map MongoDB 'sender' to AgentMessageRole
        // sender: 'agent' → role: 'agent'
        // sender: 'user' → role: 'user'
        // sender: 'system' → role: 'system'
        const role =
          msg.sender === 'agent'
            ? AgentMessageRole.Agent
            : msg.sender === 'user'
              ? AgentMessageRole.User
              : AgentMessageRole.System;

        const message: AgentMessage = {
          role,
          content: msg.content,
          timestamp: msg.createdAt,
        };

        // Add items if present in metadata
        if (msg.metadata?.items) {
          message.items = msg.metadata.items as AgentItem[];
        }

        // Add cart if present in metadata
        if (msg.metadata?.cart) {
          message.cart = msg.metadata.cart as AgentCart;
        }

        // Add checkout confirmation if present in metadata
        if (msg.metadata?.checkoutConfirmation) {
          message.checkoutConfirmation = msg.metadata
            .checkoutConfirmation as AgentCheckoutConfirmation;
        }

        // Add purchase request if present in metadata
        if (msg.metadata?.purchaseRequest) {
          message.purchaseRequest = msg.metadata
            .purchaseRequest as AgentPurchaseRequest;
        }

        return message;
      }),
    };
  } catch (error) {
    logger.error('Error getting full conversation', { userId, id, error });
    return null;
  }
}

/**
 * Update conversation's last message preview and touch updatedAt
 *
 * @param userId - User ID (for authorization)
 * @param id - Conversation ID
 * @param lastMessagePreview - New preview text
 */
export async function touchConversation(
  userId: string,
  id: string,
  lastMessagePreview: string
): Promise<void> {
  await connectDB();

  try {
    await AgentConversationModel.findOneAndUpdate(
      { _id: id, userId },
      {
        lastMessagePreview: lastMessagePreview.substring(0, 120),
        updatedAt: new Date(),
      }
    ).exec();
  } catch (error) {
    logger.error('Error touching conversation', { userId, id, error });
    throw new Error('Failed to update conversation');
  }
}

// ============================================================================
// Helpers
// ============================================================================
// Moved to @/lib/db/mappers/conversation.mapper.ts for reusability
