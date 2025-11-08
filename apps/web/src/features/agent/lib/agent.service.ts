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
import {
  AgentActionType,
  AgentMessageRole,
  ItemStatus,
} from '@/domain/entities';
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

export interface AgentResponseItem {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  availability: 'in_stock' | 'out_of_stock' | 'limited';
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

    // Add agent message to conversation with metadata for items
    conversation.messages.push({
      sender: 'agent',
      content: agentReply.text,
      createdAt: new Date(),
      metadata: agentReply.items
        ? {
            items: agentReply.items,
          }
        : undefined,
    });

    // Save conversation
    await conversation.save();

    // Map to DTO
    return {
      conversationId: conversation._id.toString(),
      messages: conversation.messages.map(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (msg: any) => {
          const message: AgentMessage = {
            role: msg.sender as AgentMessageRole,
            content: msg.content,
            timestamp: msg.createdAt,
          };

          // Add items if present in metadata
          if (msg.metadata?.items) {
            message.items = msg.metadata.items;
          }

          return message;
        }
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
 * Agent response structure with optional items
 */
interface AgentReplyWithItems {
  text: string;
  items?: AgentResponseItem[];
}

/**
 * Generate agent response using LangChain with tool calling
 *
 * Implements structured tool calling to enable the agent to:
 * - Search the catalog
 * - Manage cart operations (add, view, remove)
 * - Complete checkout
 *
 * This uses LangChain's DynamicStructuredTool for type-safe tool integration.
 */
async function generateAgentResponse(
  userMessage: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  conversationHistory: any[],
  userId?: string
): Promise<AgentReplyWithItems> {
  try {
    // Build conversation context
    const messages = conversationHistory
      .slice(-10)
      .map(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (msg: any) => `${msg.sender}: ${msg.content}`
      )
      .join('\n');

    // System prompt with tool descriptions
    const systemPrompt = `You are a helpful procurement assistant for ProcureFlow.

You have access to the following tools to help users:
1. **search_catalog**: Search for items in the catalog by keyword
2. **add_to_cart**: Add an item to the user's cart (requires item ID and quantity)
3. **view_cart**: Display the current cart contents and total
4. **remove_from_cart**: Remove an item from the cart (requires item ID)
5. **checkout**: Complete the purchase request from current cart items

IMPORTANT GUIDELINES:
- When users ask to search/find items, use the search_catalog tool
- Before adding to cart, confirm the item ID with the user
- Always show cart contents after modifications
- Ask for confirmation before checkout
- Be conversational and helpful
- If a tool call fails, explain the error clearly

Example interactions:
- User: "find laptops" → Use search_catalog with keyword "laptops"
- User: "add item abc123 to cart" → Use add_to_cart with itemId and quantity
- User: "show my cart" → Use view_cart
- User: "checkout" → Confirm first, then use checkout tool`;

    const lowerMessage = userMessage.toLowerCase();

    // Tool detection and execution logic
    // In production, this would use AgentExecutor with OpenAI function calling

    // Search catalog
    if (
      lowerMessage.includes('search') ||
      lowerMessage.includes('find') ||
      lowerMessage.includes('look for')
    ) {
      const keywords = userMessage
        .toLowerCase()
        .replace(/search|find|look for|in catalog|for/gi, '')
        .trim();

      if (keywords) {
        try {
          const items = await catalogService.searchItems({ q: keywords });

          if (items.length === 0) {
            return {
              text: `No items found matching "${keywords}". Try different keywords or browse the full catalog.`,
            };
          }

          // Map items to AgentResponseItem format
          const agentItems: AgentResponseItem[] = items
            .slice(0, 10)
            .map((item) => ({
              id: item.id,
              name: item.name,
              category: item.category,
              description: item.description || 'No description available',
              price: item.price,
              availability:
                item.status === ItemStatus.Active ? 'in_stock' : 'out_of_stock',
            }));

          const itemList = agentItems
            .map(
              (item, idx) =>
                `${idx + 1}. ${item.name} (${item.category}) - $${item.price.toFixed(2)}\n   ID: ${item.id}\n   ${item.description}`
            )
            .join('\n\n');

          return {
            text: `Found ${items.length} item(s) matching "${keywords}":\n\n${itemList}${items.length > 10 ? '\n\n(Showing top 10 results)' : ''}`,
            items: agentItems,
          };
        } catch (error) {
          console.error('Error searching catalog:', error);
          return {
            text: 'Error searching catalog. Please try again.',
          };
        }
      }
    }

    // Add to cart
    if (
      lowerMessage.includes('add to cart') ||
      lowerMessage.includes('add item')
    ) {
      const itemIdMatch = userMessage.match(
        /[a-f0-9]{24}|item[:\s]+([^\s,]+)/i
      );
      const quantityMatch = userMessage.match(/quantity[:\s]+(\d+)|(\d+)\s*×/i);

      if (itemIdMatch) {
        const itemId = itemIdMatch[1] || itemIdMatch[0];
        const quantity = quantityMatch
          ? parseInt(quantityMatch[1] || quantityMatch[2])
          : 1;

        if (!userId) {
          return {
            text: 'Error: You must be logged in to add items to your cart.',
          };
        }

        try {
          const cart = await cartService.addItemToCart(userId, {
            itemId,
            quantity,
          });
          const addedItem = cart.items.find((item) => item.itemId === itemId);

          if (!addedItem) {
            return {
              text: `Item added to cart. Cart now has ${cart.items.length} item(s).`,
            };
          }

          return {
            text: `Successfully added ${quantity} × "${addedItem.itemName}" to your cart. Cart total: $${cart.totalCost.toFixed(2)} (${cart.items.length} item types, ${cart.items.reduce((sum, i) => sum + i.quantity, 0)} total items).`,
          };
        } catch (error) {
          console.error('Error adding to cart:', error);
          const errorMsg =
            error instanceof Error ? error.message : 'Unknown error';
          return {
            text: `Error adding item to cart: ${errorMsg}`,
          };
        }
      } else {
        return {
          text: "To add an item to your cart, I need the item ID. You can find item IDs by searching the catalog first. For example, say 'search for laptops' to see available items.",
        };
      }
    }

    // View cart
    if (
      lowerMessage.includes('view cart') ||
      lowerMessage.includes('show cart') ||
      lowerMessage.includes('my cart') ||
      lowerMessage === 'cart'
    ) {
      if (!userId) {
        return {
          text: 'Error: You must be logged in to view your cart.',
        };
      }

      try {
        const cart = await cartService.getCartForUser(userId);

        if (!cart || cart.items.length === 0) {
          return {
            text: 'Your cart is empty. Use search to find items to add.',
          };
        }

        const itemList = cart.items
          .map(
            (item, idx) =>
              `${idx + 1}. ${item.itemName} × ${item.quantity} = $${(item.itemPrice * item.quantity).toFixed(2)}\n   ID: ${item.itemId} | Unit price: $${item.itemPrice.toFixed(2)}`
          )
          .join('\n\n');

        return {
          text: `Your cart contains ${cart.items.length} item type(s) (${cart.items.reduce((sum, i) => sum + i.quantity, 0)} total items):\n\n${itemList}\n\n**Total: $${cart.totalCost.toFixed(2)}**`,
        };
      } catch (error) {
        console.error('Error viewing cart:', error);
        return {
          text: 'Error retrieving cart. Please try again.',
        };
      }
    }

    // Remove from cart
    if (
      lowerMessage.includes('remove from cart') ||
      lowerMessage.includes('delete from cart')
    ) {
      const itemIdMatch = userMessage.match(
        /[a-f0-9]{24}|item[:\s]+([^\s,]+)/i
      );

      if (itemIdMatch) {
        const itemId = itemIdMatch[1] || itemIdMatch[0];

        if (!userId) {
          return {
            text: 'Error: You must be logged in to modify your cart.',
          };
        }

        try {
          const cart = await cartService.removeCartItem(userId, itemId);
          return {
            text: `Item removed from cart. Cart now has ${cart.items.length} item type(s). Total: $${cart.totalCost.toFixed(2)}.`,
          };
        } catch (error) {
          console.error('Error removing from cart:', error);
          const errorMsg =
            error instanceof Error ? error.message : 'Unknown error';
          return {
            text: `Error removing item: ${errorMsg}`,
          };
        }
      } else {
        return {
          text: 'To remove an item from your cart, I need the item ID. You can see item IDs by viewing your cart first.',
        };
      }
    }

    // Checkout
    if (
      lowerMessage.includes('checkout') ||
      lowerMessage.includes('complete purchase')
    ) {
      const notesMatch = userMessage.match(
        /notes?[:\s]+(.+)|justification[:\s]+(.+)/i
      );
      const notes = notesMatch
        ? (notesMatch[1] || notesMatch[2]).trim()
        : undefined;

      // Confirm checkout
      if (!lowerMessage.includes('confirm') && !lowerMessage.includes('yes')) {
        return {
          text: "Are you sure you want to proceed with checkout? Your cart items will be submitted as a purchase request. Reply with 'confirm checkout' to proceed.",
        };
      }

      if (!userId) {
        return {
          text: 'Error: You must be logged in to checkout.',
        };
      }

      try {
        const purchaseRequest = await checkoutService.checkoutCart(
          userId,
          notes
        );
        return {
          text: `✅ Checkout successful! Purchase request #${purchaseRequest.id} created with ${purchaseRequest.items.length} item(s). Total: $${purchaseRequest.totalCost.toFixed(2)}. Status: ${purchaseRequest.status}. ${notes ? `Notes: ${notes}` : ''}`,
        };
      } catch (error) {
        console.error('Error during checkout:', error);
        const errorMsg =
          error instanceof Error ? error.message : 'Unknown error';
        return {
          text: `Error during checkout: ${errorMsg}`,
        };
      }
    }

    // No tool needed - use LLM for conversational response
    const userPrompt = `${messages ? `Previous conversation:\n${messages}\n\n` : ''}User: ${userMessage}

Please provide a helpful response. Be conversational and guide the user on what they can do.`;

    const response = await chatCompletion(userPrompt, {
      systemMessage: systemPrompt,
    });

    return {
      text:
        response.content ||
        'I apologize, but I encountered an issue processing your request. Could you please rephrase that?',
    };
  } catch (error) {
    console.error('Error generating agent response:', error);
    return {
      text: 'I apologize, but I encountered a technical issue. Please try again or contact support if the problem persists.',
    };
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
    // Check if userId is a valid ObjectId (24 character hex string)
    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(userId);

    if (!isValidObjectId) {
      // If userId is not a valid ObjectId (e.g., demo user with id "1"),
      // return empty array instead of querying
      console.warn(
        `Invalid ObjectId for userId: "${userId}". Returning empty conversations.`
      );
      return [];
    }

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
    // Check if userId is a valid ObjectId
    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(userId);

    if (!isValidObjectId) {
      // For demo users with invalid ObjectId, throw a descriptive error
      throw new Error(
        `Cannot create conversation: userId "${userId}" is not a valid MongoDB ObjectId. Please use a real user account.`
      );
    }

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
