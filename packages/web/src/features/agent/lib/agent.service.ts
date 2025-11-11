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
import { chatCompletionWithTools } from '@/lib/ai/langchainClient';
import type { ToolDefinition } from '@/lib/ai/langchainClient';
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

export interface AgentCheckoutConfirmation {
  items: Array<{
    itemId: string;
    itemName: string;
    itemPrice: number;
    quantity: number;
    subtotal: number;
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
      metadataKeys: orchestrationResult.metadata ? Object.keys(orchestrationResult.metadata) : [],
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
      const lastMessage = conversation.messages[conversation.messages.length - 1];
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
          lastMessage.metadata.checkoutConfirmation = orchestrationResult.metadata.checkoutConfirmation;
        }
        
        // Add purchase request if present
        if (orchestrationResult.metadata.purchaseRequest) {
          lastMessage.metadata.purchaseRequest = orchestrationResult.metadata.purchaseRequest;
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
    const previewContent = orchestrationResult.content?.trim() || 'Processing...';
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
      messages: conversation.messages.map(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (msg: any) => {
          // Map MongoDB 'sender' to AgentMessageRole
          // sender: 'agent' → role: 'assistant'
          // sender: 'user' → role: 'user'
          // sender: 'system' → role: 'system'
          const role =
            msg.sender === 'agent'
              ? AgentMessageRole.Assistant
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
            message.items = msg.metadata.items;
          }

          // Add cart if present in metadata
          if (msg.metadata?.cart) {
            message.cart = msg.metadata.cart;
          }

          // Add checkout confirmation if present in metadata
          if (msg.metadata?.checkoutConfirmation) {
            message.checkoutConfirmation = msg.metadata.checkoutConfirmation;
          }

          // Add purchase request if present in metadata
          if (msg.metadata?.purchaseRequest) {
            message.purchaseRequest = msg.metadata.purchaseRequest;
          }

          return message;
        }
      ),
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
// Agent Logic
// ============================================================================

/**
 * Agent response structure with optional items
 */
interface AgentReplyWithItems {
  text: string;
  items?: AgentResponseItem[];
  cart?: AgentResponseCart;
  checkoutConfirmation?: AgentCheckoutConfirmation;
  purchaseRequest?: {
    id: string;
    items: Array<{
      itemId: string;
      itemName: string;
      itemCategory: string;
      unitPrice: number;
      quantity: number;
      subtotal: number;
    }>;
    totalCost: number;
    status: string;
  };
}

/**
 * @deprecated This function is replaced by orchestrateAgentTurn (Step 8 refactor)
 * Kept for reference during migration. Will be removed after testing.
 * 
 * Generate agent response using LangChain with function calling
 *
 * Uses OpenAI's function calling to let the model decide when to use tools
 */
async function _generateAgentResponse_DEPRECATED(
  userMessage: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  conversationHistory: any[],
  userId?: string | Types.ObjectId
): Promise<AgentReplyWithItems> {
  try {
    // Define available tools for function calling
    const tools: ToolDefinition[] = [
      {
        name: 'search_catalog',
        description:
          'Search for products in the catalog by a SINGLE keyword IN ENGLISH. Always translate user terms to English before searching. Returns product cards that will be displayed to the user. If user asks for multiple products, call this function multiple times with different keywords. Optimized to return concise results to minimize token usage.',
        parameters: {
          type: 'object',
          properties: {
            keyword: {
              type: 'string',
              description:
                'A SINGLE product name or category to search for IN ENGLISH (e.g., "pen", "fruits", "office supplies", "laptop"). If user provides Portuguese terms, translate to English first: "canetas"→"pen", "frutas"→"fruits", "papel"→"paper". Do NOT include multiple items in one keyword - call the function multiple times instead.',
            },
            maxPrice: {
              type: 'number',
              description:
                'Maximum price filter (optional). Only return items with price <= maxPrice. Extract from user requests like "under $30", "less than $50", "below $100".',
            },
            maxResults: {
              type: 'number',
              description:
                'Maximum number of results to return (default: 5, max: 10). Use lower values for exploratory searches to reduce token usage.',
            },
          },
          required: ['keyword'],
        },
      },
      {
        name: 'add_to_cart',
        description:
          'Add an item to the user cart. Use this when user wants to add products. You must use the item ID from previously shown products or search results.',
        parameters: {
          type: 'object',
          properties: {
            itemId: {
              type: 'string',
              description:
                'The unique identifier of the item to add (from search results or displayed products)',
            },
            quantity: {
              type: 'number',
              description: 'The quantity to add (default: 1)',
            },
          },
          required: ['itemId'],
        },
      },
      {
        name: 'update_cart_quantity',
        description:
          'Update the quantity of an item in the cart. Use this when user wants to change quantity (increase or decrease). If new quantity is 0, the item will be removed.',
        parameters: {
          type: 'object',
          properties: {
            itemId: {
              type: 'string',
              description:
                'The unique identifier of the item to update (from cart items)',
            },
            newQuantity: {
              type: 'number',
              description:
                'The new total quantity for this item (not the difference)',
            },
          },
          required: ['itemId', 'newQuantity'],
        },
      },
      {
        name: 'view_cart',
        description:
          'Display the current cart contents with full item details (names, prices, quantities). Use this when user asks to see their cart OR when user asks questions about specific items in the cart like "which fruits are in my cart?", "what items do I have?", "show me what\'s in my cart". This returns the complete list of items with their names, allowing you to identify and filter specific categories or types.',
        parameters: {
          type: 'object',
          properties: {},
          required: [],
        },
      },
      {
        name: 'analyze_cart',
        description:
          'Get analytics and statistics about the cart to answer numerical/statistical questions. Use this ONLY when user asks about statistics like "what is the most expensive item", "highest unit price", "lowest price", "average price", "total cost", etc. For questions about WHICH items are in the cart, use view_cart instead.',
        parameters: {
          type: 'object',
          properties: {},
          required: [],
        },
      },
      {
        name: 'remove_from_cart',
        description:
          'Remove an item completely from the cart (all quantities). Use the itemId from the cart display. Only use when user explicitly says "remove all" or clicks delete button.',
        parameters: {
          type: 'object',
          properties: {
            itemId: {
              type: 'string',
              description:
                'The unique identifier of the item to remove (from cart items)',
            },
          },
          required: ['itemId'],
        },
      },
      {
        name: 'checkout',
        description:
          'Complete the purchase request with current cart items. Should ask for confirmation first.',
        parameters: {
          type: 'object',
          properties: {
            notes: {
              type: 'string',
              description: 'Optional notes or justification for the purchase',
            },
          },
          required: [],
        },
      },
    ];

    // System prompt
    const systemPrompt = `You are a helpful procurement assistant for ProcureFlow.

You have access to these functions:
- search_catalog: Search for products by keyword with optional price filter
- add_to_cart: Add NEW items to cart (only for items NOT currently in cart - requires itemId from search results)
- update_cart_quantity: Change quantity of EXISTING cart items (use when user says "add X more", "remove X", or wants to change quantity of items already in cart)
- view_cart: Show current cart contents with item names, IDs, prices and quantities (use this to answer questions like "what's in my cart?", "which fruits are in my cart?", "show my cart items")
- analyze_cart: Get cart statistics like most expensive item, average price, totals (use this for analytical questions like "what's the most expensive item?", "average price?")
- remove_from_cart: Remove item COMPLETELY from cart (only when user says "remove all" or clicks delete button)
- checkout: Complete purchase

CRITICAL: LANGUAGE AND TRANSLATION RULES
1. INTERNAL COMMUNICATION: Always use English internally for tool calls and catalog searches
2. USER RESPONSE: Respond in the SAME language the user writes to you
   - If user writes in English → respond in English
   - If user writes in Portuguese → respond in Portuguese
   
3. SEARCH TRANSLATION: Always translate search terms to English before calling search_catalog
   - User: "show me fruits" → search_catalog(keyword: "fruits")
   - User: "mostre frutas" → search_catalog(keyword: "fruits") [translate frutas→fruits]
   - User: "preciso de canetas" → search_catalog(keyword: "pen") [translate canetas→pen]
   - User: "show me pens" → search_catalog(keyword: "pen")
   
Common translations (Portuguese → English) for catalog search:
- frutas → fruits, banana → banana, laranja → orange, maçã → apple
- morango → strawberry, abacaxi → pineapple, uva → grape, manga → mango
- canetas → pen, lápis → pencil, papel → paper
- escritório → office, computador → computer, mouse → mouse
- teclado → keyboard, monitor → monitor, notebook → laptop

4. The catalog is primarily in English, so always translate Portuguese terms to English for searching

CRITICAL: PRICE FILTERING
When user specifies a price constraint, you MUST extract it and pass as maxPrice parameter to search_catalog:
- "under $30" → maxPrice: 30
- "less than $50" → maxPrice: 50
- "below $100" → maxPrice: 100
- "no more than $25" → maxPrice: 25
- "$20 each" → maxPrice: 20

Examples:
- "Find USB cables under $30" → search_catalog(keyword: "USB cables", maxPrice: 30)
- "Show me laptops below $1000" → search_catalog(keyword: "laptops", maxPrice: 1000)
- "I need 10 pens less than $5 each" → search_catalog(keyword: "pens", maxPrice: 5)

IMPORTANT: When user asks for MULTIPLE products (e.g., "show me pen, pencil and laptop"), you MUST:
1. Identify ALL products mentioned in the request
2. Search for each product separately by calling search_catalog multiple times
3. Present all results together to the user

For example:
- User: "show me pen, pencil and laptop"
- You should: Call search_catalog("pen"), search_catalog("pencil"), search_catalog("laptop")
- Then combine and present all results

CRITICAL: ANSWERING QUESTIONS ABOUT CART CONTENTS
When user asks "which fruits are in my cart?" or "what fruits do I have?":
1. Call view_cart to get the full list of items with their names
2. Look at the item names and identify which ones match the category (e.g., "Banana", "Laranja", "Maçã" are fruits)
3. List those specific items in your response

Examples:
- User: "Which fruits are in my cart?" → call view_cart, check item names, respond with fruits found (e.g., "Banana, Laranja")
- User: "What office supplies do I have?" → call view_cart, check item names, respond with office items
- User: "Do I have any pens in my cart?" → call view_cart, check for items with "pen" in the name

CRITICAL RULES FOR CART OPERATIONS:
1. Cart context shows: {itemId: "abc123", itemName: "Laptop", quantity: 5}

2. ADDING TO CART:
   a) If item is NOT in cart yet:
      - User: "Add USB Cable to my cart"
      - USE add_to_cart(itemId: "found_from_search", quantity: 1)
   
   b) If item IS ALREADY in cart (check cart context):
      - User: "Add 3 more Monitor" (current quantity: 1)
      - New quantity should be 4 (1 + 3)
      - USE update_cart_quantity(itemId: "xyz789", newQuantity: 4)
      - DO NOT use add_to_cart for items already in cart
   
   c) Keywords that indicate updating existing items:
      - "more" (e.g., "add 2 more")
      - "additional" (e.g., "add 1 additional")
      - "another" (e.g., "add another one")

3. REMOVING FROM CART:
   a) Partial removal:
      - User: "Remove 2 Laptop from my cart" (current quantity: 5)
      - New quantity should be 3 (5 - 2)
      - USE update_cart_quantity(itemId: "abc123", newQuantity: 3)
   
   b) Complete removal:
      - User: "Remove all Keyboard" or clicks delete button
      - USE remove_from_cart(itemId: "def456")

4. BEFORE CALLING add_to_cart:
   - Check if item is already in cart from cart context
   - If yes, use update_cart_quantity instead
   - If no, then use add_to_cart

5. Match item names to itemIds from cart context in conversation history

Examples:
- "Add USB Cable" (not in cart) → add_to_cart(itemId, quantity: 1)
- "Add 1 more USB Cable" (already 1 in cart) → update_cart_quantity(itemId, newQuantity: 2)
- "Add 2 more Monitor" (already 1 in cart) → update_cart_quantity(itemId, newQuantity: 3)
- "Remove 1 Pen" (current quantity: 3) → update_cart_quantity(itemId, newQuantity: 2)
- "Remove all Laptop" → remove_from_cart(itemId)`;

    // Build conversation history for context (include metadata with cart info)
    const history = conversationHistory
      .slice(-10)
      .map(
        (msg: {
          sender: string;
          content: string;
          metadata?: { cart?: unknown };
        }) => {
          let content = msg.content;

          // If message has cart metadata, append it to content for context
          if (msg.metadata?.cart) {
            const cart = msg.metadata.cart as {
              items: Array<{
                itemId: string;
                itemName: string;
                quantity: number;
              }>;
            };
            if (cart.items && cart.items.length > 0) {
              const cartInfo = cart.items
                .map(
                  (item) =>
                    `{itemId: "${item.itemId}", itemName: "${item.itemName}", quantity: ${item.quantity}}`
                )
                .join(', ');
              content += `\n[Cart Context: ${cartInfo}]`;
            }
          }

          return {
            role: msg.sender === 'user' ? 'user' : 'assistant',
            content,
          };
        }
      );

    // Call LLM with function calling
    const response = await chatCompletionWithTools(userMessage, {
      systemMessage: systemPrompt,
      conversationHistory: history,
      tools,
      temperature: 0.7,
    });

    logger.debug('LLM Response received', {
      hasContent: !!response.content,
      contentLength: response.content?.length,
      contentPreview: response.content?.substring(0, 100),
      hasToolCalls: !!response.toolCalls,
      toolCallsCount: response.toolCalls?.length || 0,
      finishReason: response.finishReason,
    });

    // Check if model wants to call a tool
    if (response.toolCalls && response.toolCalls.length > 0) {
      // For search_catalog, we can handle multiple calls and combine results
      const searchCalls = response.toolCalls.filter(
        (tc) => tc.name === 'search_catalog'
      );

      if (searchCalls.length > 1) {
        try {
          // Execute all search calls in parallel
          const searchResults = await Promise.all(
            searchCalls.map(async (toolCall) => {
              const maxResults = Math.min(
                (toolCall.arguments.maxResults as number) || 3,
                5
              ); // Lower default for multiple searches
              const items = await catalogService.searchItems({
                q: toolCall.arguments.keyword as string,
                maxPrice: toolCall.arguments.maxPrice as number | undefined,
                limit: maxResults,
              });
              return {
                keyword: toolCall.arguments.keyword as string,
                items,
                maxResults,
              };
            })
          );

          // Combine all results
          const allItems: AgentResponseItem[] = [];
          const keywords: string[] = [];
          let totalFound = 0;
          const seenIds = new Set<string>(); // Track unique item IDs

          for (const result of searchResults) {
            keywords.push(result.keyword as string);
            totalFound += result.items.length;

            // Map and add items (already limited by maxResults in searchItems call)
            const mappedItems = result.items
              .map(
                (item) =>
                  ({
                    id: item.id,
                    name: item.name,
                    category: item.category,
                    description: truncateDescription(
                      item.description || 'No description available'
                    ),
                    price: item.price,
                    availability:
                      item.status === ItemStatus.Active
                        ? 'in_stock'
                        : 'out_of_stock',
                  }) as AgentResponseItem
              )
              .filter((item) => {
                // Deduplicate: only add if we haven't seen this ID before
                if (seenIds.has(item.id)) {
                  return false;
                }
                seenIds.add(item.id);
                return true;
              });

            allItems.push(...mappedItems);
          }

          if (allItems.length === 0) {
            return {
              text: `No items found matching your search for: ${keywords.join(', ')}. Try different keywords or browse the full catalog.`,
            };
          }

          const resultMessage = `Found ${totalFound} total products across ${keywords.length} searches (${keywords.join(', ')}). Showing ${allItems.length} results:`;

          return {
            text: resultMessage,
            items: allItems,
          };
        } catch (error) {
          logger.error('Error executing multiple search tools', { error });
          const errorMsg =
            error instanceof Error ? error.message : 'Unknown error';
          return {
            text: `Error performing searches: ${errorMsg}`,
          };
        }
      }

      // Handle single tool call (original behavior)
      const toolCall = response.toolCalls[0];

      try {
        // Execute the tool
        const toolResult = await executeTool(
          toolCall.name as AgentActionType,
          toolCall.arguments,
          userId
        );

        // Handle search_catalog tool result
        if (toolCall.name === 'search_catalog') {
          const items = toolResult as Awaited<
            ReturnType<typeof catalogService.searchItems>
          >;

          if (items.length === 0) {
            return {
              text: `No items found matching "${toolCall.arguments.keyword}". Try different keywords or browse the full catalog.`,
            };
          }

          // Map items to AgentResponseItem format (already limited by service)
          const agentItems: AgentResponseItem[] = items.map((item) => ({
            id: item.id,
            name: item.name,
            category: item.category,
            description: truncateDescription(
              item.description || 'No description available'
            ),
            price: item.price,
            availability:
              item.status === ItemStatus.Active ? 'in_stock' : 'out_of_stock',
          }));

          // Short message with item count only
          const resultMessage = `Found ${items.length} matching product${items.length === 1 ? '' : 's'} for "${toolCall.arguments.keyword}":`;

          return {
            text: resultMessage,
            items: agentItems,
          };
        }

        // Handle add_to_cart tool result
        if (toolCall.name === 'add_to_cart') {
          const cart = toolResult as Awaited<
            ReturnType<typeof cartService.addItemToCart>
          >;
          const addedItem = cart.items.find(
            (item) => item.itemId === toolCall.arguments.itemId
          );

          const itemCount = cart.items.reduce((sum, i) => sum + i.quantity, 0);

          if (!addedItem) {
            return {
              text: `Item added to cart. Cart now has ${cart.items.length} item(s).`,
              cart: {
                items: cart.items,
                totalCost: cart.totalCost,
                itemCount,
              },
            };
          }

          return {
            text: `Successfully added ${toolCall.arguments.quantity || 1} × "${addedItem.itemName}" to your cart. Cart total: $${cart.totalCost.toFixed(2)} (${cart.items.length} item types, ${itemCount} total items).`,
            cart: {
              items: cart.items,
              totalCost: cart.totalCost,
              itemCount,
            },
          };
        }

        // Handle update_cart_quantity tool result
        if (toolCall.name === 'update_cart_quantity') {
          const { itemId, newQuantity } = toolCall.arguments as {
            itemId: string;
            newQuantity: number;
          };

          // If new quantity is 0, remove the item
          if (newQuantity <= 0) {
            const cart = toolResult as Awaited<
              ReturnType<typeof cartService.removeCartItem>
            >;
            const itemCount = cart.items.reduce(
              (sum, i) => sum + i.quantity,
              0
            );

            return {
              text: `Item removed from cart (quantity set to 0). Cart now has ${cart.items.length} item type(s). Total: $${cart.totalCost.toFixed(2)}.`,
              cart: {
                items: cart.items,
                totalCost: cart.totalCost,
                itemCount,
              },
            };
          }

          // Otherwise, it's an update
          const cart = toolResult as Awaited<
            ReturnType<typeof cartService.addItemToCart>
          >;
          const updatedItem = cart.items.find((item) => item.itemId === itemId);
          const itemCount = cart.items.reduce((sum, i) => sum + i.quantity, 0);

          if (!updatedItem) {
            return {
              text: `Cart updated. Total: $${cart.totalCost.toFixed(2)}.`,
              cart: {
                items: cart.items,
                totalCost: cart.totalCost,
                itemCount,
              },
            };
          }

          return {
            text: `Updated "${updatedItem.itemName}" quantity to ${newQuantity}. Cart total: $${cart.totalCost.toFixed(2)} (${itemCount} total items).`,
            cart: {
              items: cart.items,
              totalCost: cart.totalCost,
              itemCount,
            },
          };
        }

        // Handle view_cart tool result
        if (toolCall.name === 'view_cart') {
          const cart = toolResult as Awaited<
            ReturnType<typeof cartService.getCartForUser>
          >;

          if (!cart || cart.items.length === 0) {
            return {
              text: 'Your cart is empty. Use search to find items to add.',
            };
          }

          const itemCount = cart.items.reduce((sum, i) => sum + i.quantity, 0);

          // Return cart data as context for LLM to interpret based on user's question
          // This allows intelligent filtering (e.g., "which fruits are in my cart?")
          const cartContext = JSON.stringify(
            {
              items: cart.items.map((item) => ({
                itemName: item.itemName,
                quantity: item.quantity,
                price: item.itemPrice,
                subtotal: item.subtotal,
              })),
              totalCost: cart.totalCost,
              itemCount,
            },
            null,
            2
          );

          // Make a second LLM call to answer the specific question about cart contents
          const interpretationPrompt = `Based on the user's question and the following cart data, provide a concise, direct answer:

Cart Contents:
${cartContext}

User's original question: "${userMessage}"

Instructions:
- If user asks about specific items/categories (e.g., "which fruits?", "what pens?"), list ONLY those items
- If user asks to see the whole cart, list all items
- Format prices with $ and 2 decimals
- Be conversational and natural
- Answer in the same language the user asked`;

          try {
            const interpretation = await chatCompletionWithTools(
              interpretationPrompt,
              {
                model: 'gpt-4o-mini',
                temperature: 0.3,
                systemMessage: 'You are a helpful shopping assistant.',
              }
            );

            return {
              text:
                interpretation.content ||
                `Your cart contains ${cart.items.length} item type(s). Total: $${cart.totalCost.toFixed(2)}`,
              cart: {
                items: cart.items,
                totalCost: cart.totalCost,
                itemCount,
              },
            };
          } catch (error) {
            logger.error('Error interpreting cart question', { error });
            // Fallback to generic response
            return {
              text: `Your cart contains ${cart.items.length} item type(s) (${itemCount} total items). Total: $${cart.totalCost.toFixed(2)}`,
              cart: {
                items: cart.items,
                totalCost: cart.totalCost,
                itemCount,
              },
            };
          }
        }

        // Handle analyze_cart tool result
        if (toolCall.name === 'analyze_cart') {
          const analytics = toolResult as Awaited<
            ReturnType<typeof cartService.analyzeCart>
          >;

          if (analytics.itemCount === 0) {
            return {
              text: 'Your cart is empty, so there are no statistics to analyze.',
            };
          }

          // Return raw analytics data as context and let LLM interpret
          // This allows the LLM to answer the specific question intelligently
          const analyticsContext = JSON.stringify(
            {
              highestUnitPrice: analytics.highestUnitPrice
                ? {
                  itemName: analytics.highestUnitPrice.itemName,
                  price: analytics.highestUnitPrice.price,
                }
                : null,
              lowestUnitPrice: analytics.lowestUnitPrice
                ? {
                  itemName: analytics.lowestUnitPrice.itemName,
                  price: analytics.lowestUnitPrice.price,
                }
                : null,
              averageUnitPrice: analytics.averageUnitPrice,
              mostExpensiveItem: analytics.mostExpensiveItem
                ? {
                  itemName: analytics.mostExpensiveItem.itemName,
                  subtotal: analytics.mostExpensiveItem.subtotal,
                  quantity: analytics.mostExpensiveItem.quantity,
                }
                : null,
              totalCost: analytics.totalCost,
              uniqueItems: analytics.uniqueItems,
              totalItems: analytics.itemCount,
            },
            null,
            2
          );

          // Make a second LLM call to interpret the analytics based on user's question
          const interpretationPrompt = `Based on the user's question and the following cart analytics data, provide a concise, direct answer:

Cart Analytics:
${analyticsContext}

User's original question: "${userMessage}"

Provide a natural, conversational answer that directly addresses what the user asked. Format prices as currency with $ symbol and 2 decimal places.`;

          const interpretation = await chatCompletionWithTools(
            interpretationPrompt,
            {
              systemMessage:
                "You are a helpful shopping assistant. Answer the user's specific question about their cart using the provided analytics data. Be concise and direct.",
              temperature: 0.3, // Lower temperature for more focused answers
            }
          );

          return {
            text: interpretation.content || 'Unable to analyze cart data.',
          };
        }

        // Handle remove_from_cart tool result
        if (toolCall.name === 'remove_from_cart') {
          const cart = toolResult as Awaited<
            ReturnType<typeof cartService.removeCartItem>
          >;

          const itemCount = cart.items.reduce((sum, i) => sum + i.quantity, 0);

          return {
            text: `Item removed from cart. Cart now has ${cart.items.length} item type(s). Total: $${cart.totalCost.toFixed(2)}.`,
            cart: {
              items: cart.items,
              totalCost: cart.totalCost,
              itemCount,
            },
          };
        }

        // Handle checkout tool result
        if (toolCall.name === 'checkout') {
          const purchaseRequest = toolResult as Awaited<
            ReturnType<typeof checkoutService.checkoutCart>
          >;

          return {
            text: `✅ Purchase request created successfully! Your request #${purchaseRequest.id.slice(0, 8)}... has been submitted for approval with ${purchaseRequest.items.length} item(s) totaling $${purchaseRequest.totalCost.toFixed(2)}.`,
            purchaseRequest: {
              id: purchaseRequest.id,
              items: purchaseRequest.items,
              totalCost: purchaseRequest.totalCost,
              status: purchaseRequest.status,
            },
          };
        }

        // If we reach here, it means a tool was called but not handled above
        // This should not happen, but provide a fallback
        logger.warn('Unhandled tool call', { toolName: toolCall.name, toolCall });
        return {
          text: `Tool ${toolCall.name} was executed successfully.`,
        };
      } catch (error) {
        logger.error('Error executing tool', { toolName: toolCall.name, error });
        const errorMsg =
          error instanceof Error ? error.message : 'Unknown error';
        return {
          text: `Error: ${errorMsg}`,
        };
      }
    }

    // No tool call - return conversational response
    return {
      text: response.content || 'How can I help you today?',
    };
  } catch (error) {
    logger.error('Error generating agent response', { error });

    // Provide user-friendly error messages based on error type
    if (error instanceof Error) {
      if (error.message.includes('rate limit')) {
        return {
          text: '⏳ I apologize, but the AI service is currently experiencing high demand. Please wait a moment and try again in a few seconds.',
        };
      }
      if (error.message.includes('quota')) {
        return {
          text: '⚠️ The AI service quota has been exceeded. Please contact the administrator to check the OpenAI billing status.',
        };
      }
      if (error.message.includes('timeout')) {
        return {
          text: '⏱️ The request took too long to process. Please try again with a simpler question.',
        };
      }
      if (error.message.includes('API key')) {
        return {
          text: '🔑 There is a configuration issue with the AI service. Please contact the administrator.',
        };
      }
    }

    return {
      text: 'I apologize, but I encountered a technical issue. Please try again or contact support if the problem persists.',
    };
  }
}

/**
 * Execute agent tool (now used by function calling)
 */
async function executeTool(
  toolName: AgentActionType | string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  parameters: Record<string, any>,
  userId?: string | Types.ObjectId
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any> {
  // Map function names to AgentActionType
  const toolMap: Record<string, AgentActionType> = {
    search_catalog: AgentActionType.SearchCatalog,
    add_to_cart: AgentActionType.AddToCart,
    update_cart_quantity: AgentActionType.UpdateCartItem,
    view_cart: AgentActionType.ViewCart,
    analyze_cart: AgentActionType.AnalyzeCart,
    remove_from_cart: AgentActionType.RemoveFromCart,
    checkout: AgentActionType.Checkout,
  };

  const actionType =
    typeof toolName === 'string' && toolName in toolMap
      ? toolMap[toolName]
      : (toolName as AgentActionType);

  switch (actionType) {
    case AgentActionType.SearchCatalog:
      return await catalogService.searchItems({
        q: parameters.keyword,
        maxPrice: parameters.maxPrice,
        limit: Math.min(parameters.maxResults || 5, 10), // Default 5, max 10
      });

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

    case AgentActionType.UpdateCartItem:
      if (!userId) {
        throw new Error('User must be authenticated to update cart');
      }
      // If new quantity is 0 or less, remove the item
      if (parameters.newQuantity <= 0) {
        return await cartService.removeCartItem(userId, parameters.itemId);
      }
      // Otherwise, use updateCartItemQuantity which sets the exact quantity
      return await cartService.updateCartItemQuantity(
        userId,
        parameters.itemId,
        parameters.newQuantity
      );

    case AgentActionType.ViewCart:
      if (!userId) {
        throw new Error('User must be authenticated to view cart');
      }
      return await cartService.getCartForUser(userId);

    case AgentActionType.AnalyzeCart:
      if (!userId) {
        throw new Error('User must be authenticated to analyze cart');
      }
      return await cartService.analyzeCart(userId);

    case AgentActionType.RemoveFromCart:
      if (!userId) {
        throw new Error('User must be authenticated to modify cart');
      }
      return await cartService.removeCartItem(userId, parameters.itemId);

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
      return [];
    }

    const conversations = await AgentConversationModel.find({ userId })
      .sort({ updatedAt: -1 })
      .limit(limit)
      .lean()
      .exec();

    return conversations.map(mapToConversationSummary);
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

    return mapToConversationSummary(conversation);
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

    return mapToConversationSummary(conversation);
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
      messages: conv.messages.map(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (msg: any) => {
          // Map MongoDB 'sender' to AgentMessageRole
          // sender: 'agent' → role: 'assistant'
          // sender: 'user' → role: 'user'
          // sender: 'system' → role: 'system'
          const role =
            msg.sender === 'agent'
              ? AgentMessageRole.Assistant
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
            message.items = msg.metadata.items;
          }

          // Add cart if present in metadata
          if (msg.metadata?.cart) {
            message.cart = msg.metadata.cart;
          }

          // Add checkout confirmation if present in metadata
          if (msg.metadata?.checkoutConfirmation) {
            message.checkoutConfirmation = msg.metadata.checkoutConfirmation;
          }

          // Add purchase request if present in metadata
          if (msg.metadata?.purchaseRequest) {
            message.purchaseRequest = msg.metadata.purchaseRequest;
          }

          return message;
        }
      ),
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

/**
 * Truncate description to reduce token usage
 * Limits description to max 150 characters with ellipsis
 */
function truncateDescription(description: string, maxLength = 150): string {
  if (description.length <= maxLength) {
    return description;
  }
  return description.substring(0, maxLength - 3) + '...';
}

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
