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

import type { AgentMessage } from '@/domain/entities';
import { AgentActionType, AgentMessageRole } from '@/domain/entities';
import type { AgentConversationSummary } from '@/features/agent/types';
import * as cartService from '@/features/cart';
import * as catalogService from '@/features/catalog';
import * as checkoutService from '@/features/checkout';
import { chatCompletion } from '@/lib/ai/langchainClient';
import { AgentConversationModel } from '@/lib/db/models';
import connectDB from '@/lib/db/mongoose';

// ============================================================================
// Types
// ============================================================================

export interface HandleAgentMessageParams {
  /** User ID (optional for demo, recommended for production) */
  userId?: string;

  /** User's message */
  message: string;

  /** Existing conversation ID (optional, creates new if not provided) */
  conversationId?: string;
}

export interface AgentResponse {
  conversationId: string;
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
  await connectDB();

  const { userId, message, conversationId } = params;

  // Validate message
  if (!message || message.trim().length === 0) {
    throw new ValidationError('Message cannot be empty');
  }

  try {
    // Find or create conversation
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let conversation: any;

    if (conversationId) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      conversation = await (AgentConversationModel as any)
        .findById(conversationId)
        .exec();

      if (!conversation) {
        throw new ValidationError('Conversation not found');
      }
    } else {
      // Create new conversation
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      conversation = new (AgentConversationModel as any)({
        userId: userId || null,
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

    // Generate agent response using LangChain
    const agentReply = await generateAgentResponse(
      message,
      conversation.messages,
      userId
    );

    // Add agent message to conversation
    conversation.messages.push({
      sender: 'agent',
      content: agentReply,
      createdAt: new Date(),
    });

    // Save conversation
    await conversation.save();

    // Map to DTO
    return {
      conversationId: conversation._id.toString(),
      messages: conversation.messages.map(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (msg: any) => ({
          role: msg.sender as AgentMessageRole,
          content: msg.content,
          timestamp: msg.createdAt,
        })
      ),
    };
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    console.error('Error handling agent message:', error);
    throw new Error('Failed to process agent message');
  }
}

// ============================================================================
// Agent Logic
// ============================================================================

/**
 * Generate agent response using LangChain
 *
 * This is a simplified implementation. In production, this would:
 * - Use structured tool calling with LangChain
 * - Maintain conversation state properly
 * - Implement robust error handling for tool calls
 *
 * For the tech case, we'll use a basic LLM call with manual tool orchestration.
 */
async function generateAgentResponse(
  userMessage: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  conversationHistory: any[],
  _userId?: string
): Promise<string> {
  try {
    // Build conversation context
    const messages = conversationHistory
      .slice(-10)
      .map(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (msg: any) => `${msg.sender}: ${msg.content}`
      )
      .join('\n');

    // System prompt with instructions and available tools
    const systemPrompt = `You are a helpful procurement assistant for ProcureFlow.

You can help users:
- Search for items in the catalog
- Register new items
- Add items to their cart
- View their cart
- Complete checkout

Available tools (you can describe these to the user, but cannot execute them automatically):
- search_catalog: Search for items by keyword
- register_item: Add a new item to the catalog
- add_to_cart: Add an item to the user's cart
- view_cart: View current cart contents
- checkout: Complete purchase request

IMPORTANT: Always confirm with the user before taking actions like adding to cart or checkout.
Ask clarifying questions if the user's intent is unclear.
Be conversational and helpful.`;

    // Build user prompt with context
    const userPrompt = `${messages ? `Previous conversation:\n${messages}\n\n` : ''}User: ${userMessage}

Please provide a helpful response. If the user wants to perform an action (search, add to cart, checkout), explain what you would do and ask for confirmation. For this tech case demo, you cannot actually execute the tools yet.`;

    // Call LangChain LLM
    const response = await chatCompletion(userPrompt, {
      systemMessage: systemPrompt,
    });

    return (
      response.content ||
      'I apologize, but I encountered an issue processing your request. Could you please rephrase that?'
    );
  } catch (error) {
    console.error('Error generating agent response:', error);
    return 'I apologize, but I encountered a technical issue. Please try again or contact support if the problem persists.';
  }
}

/**
 * Execute agent tool (placeholder for future tool integration)
 *
 * This function would be called by LangChain's structured tool framework
 * in a production implementation.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function executeTool(
  toolName: AgentActionType,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  parameters: Record<string, any>,
  userId?: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any> {
  switch (toolName) {
    case AgentActionType.SearchCatalog:
      return await catalogService.searchItems({ q: parameters.keyword });

    case AgentActionType.RegisterItem:
      return await catalogService.createItem({
        name: parameters.name,
        category: parameters.category,
        description: parameters.description,
        estimatedPrice: parameters.price,
        createdByUserId: userId,
      });

    case AgentActionType.AddToCart:
      if (!userId) {
        throw new Error('User must be authenticated to add items to cart');
      }
      return await cartService.addItemToCart(userId, {
        itemId: parameters.itemId,
        quantity: parameters.quantity || 1,
      });

    case AgentActionType.ViewCart:
      if (!userId) {
        throw new Error('User must be authenticated to view cart');
      }
      return await cartService.getCartForUser(userId);

    case AgentActionType.Checkout:
      if (!userId) {
        throw new Error('User must be authenticated to checkout');
      }
      return await checkoutService.checkoutCart(userId, parameters.notes);

    default:
      throw new Error(`Unknown tool: ${toolName}`);
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const conversations = await (AgentConversationModel as any)
      .find({ userId })
      .sort({ updatedAt: -1 })
      .limit(limit)
      .lean()
      .exec();

    return conversations.map(mapToConversationSummary);
  } catch (error) {
    console.error('Error listing conversations:', error);
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const conversation = new (AgentConversationModel as any)({
      userId,
      title: params.title.substring(0, 120), // Enforce max length
      lastMessagePreview: params.lastMessagePreview.substring(0, 120),
      messages: [],
      status: 'in_progress',
    });

    await conversation.save();

    return mapToConversationSummary(conversation);
  } catch (error) {
    console.error('Error creating conversation:', error);
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const conversation = await (AgentConversationModel as any)
      .findOne({ _id: id, userId })
      .lean()
      .exec();

    if (!conversation) {
      return null;
    }

    return mapToConversationSummary(conversation);
  } catch (error) {
    console.error('Error getting conversation:', error);
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (AgentConversationModel as any)
      .findOneAndUpdate(
        { _id: id, userId },
        {
          lastMessagePreview: lastMessagePreview.substring(0, 120),
          updatedAt: new Date(),
        }
      )
      .exec();
  } catch (error) {
    console.error('Error touching conversation:', error);
    throw new Error('Failed to update conversation');
  }
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Map Mongoose document to AgentConversationSummary
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapToConversationSummary(doc: any): AgentConversationSummary {
  return {
    id: doc._id.toString(),
    title: doc.title || 'Untitled conversation',
    lastMessagePreview: doc.lastMessagePreview || 'No messages yet',
    updatedAt: doc.updatedAt?.toISOString() || new Date().toISOString(),
  };
}
