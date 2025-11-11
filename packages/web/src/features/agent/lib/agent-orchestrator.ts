/**
 * Agent Orchestrator
 *
 * Main orchestration loop for agent turns with tool execution:
 * - Manages LLM interaction loop (max 10 iterations)
 * - Coordinates conversation manager and tool executor
 * - Handles rate limiting, retries, circuit breaker
 * - Tracks metrics and logs for observability
 *
 * Part of Step 8: Agent Orchestrator Refactor
 */

import type { BaseMessage } from '@langchain/core/messages';
import { AIMessage, ToolMessage } from '@langchain/core/messages';

import type { AgentConversationDocument } from '@/domain/mongo-schemas';
import type { AIResponse } from '@/lib/ai/providerAdapter';
import { invokeChat } from '@/lib/ai/providerAdapter';
import { logger } from '@/lib/logger/winston.config';

import { executeTool } from './agent-tool-executor';
import { buildMessageHistory } from './conversation-manager';

// ============================================================================
// Constants
// ============================================================================

const MAX_ITERATIONS = 10; // Prevent infinite loops
const MAX_TOOL_CALLS_PER_TURN = 15; // Hard limit on tool calls

/**
 * Tool definitions for LLM function calling
 * These are passed to the LLM so it knows what tools are available
 */
const AGENT_TOOLS = [
  {
    name: 'search_catalog',
    description:
      'Search for products in the catalog by keyword. Returns matching items with details (id, name, price, category, description). Use this when user asks to find, search, or browse items.',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description:
            'Search query or keyword (e.g., "ergonomic keyboard", "office supplies", "laptops under $500")',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results to return (default: 10)',
        },
        maxPrice: {
          type: 'number',
          description: 'Maximum price filter (optional)',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'add_to_cart',
    description:
      'Add an item to the shopping cart. Use item ID from search results.',
    parameters: {
      type: 'object',
      properties: {
        itemId: {
          type: 'string',
          description: 'Item ID from search results',
        },
        quantity: {
          type: 'number',
          description: 'Quantity to add (default: 1)',
        },
      },
      required: ['itemId'],
    },
  },
  {
    name: 'remove_from_cart',
    description: 'Remove an item from the shopping cart.',
    parameters: {
      type: 'object',
      properties: {
        itemId: {
          type: 'string',
          description: 'Item ID to remove',
        },
      },
      required: ['itemId'],
    },
  },
  {
    name: 'get_cart',
    description: 'View current shopping cart contents.',
    parameters: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'checkout',
    description: 'Create purchase request from cart items.',
    parameters: {
      type: 'object',
      properties: {
        notes: {
          type: 'string',
          description: 'Optional purchase notes',
        },
      },
      required: [],
    },
  },
];

// ============================================================================
// Types
// ============================================================================

export interface OrchestrateParams {
  /** User message that triggered this turn */
  userMessage: string;

  /** Conversation document from MongoDB */
  conversation: AgentConversationDocument;

  /** User ID for user-specific operations */
  userId: string;

  /** Conversation ID for logging */
  conversationId: string;

  /** Max tokens for message history (default: 3000) */
  maxTokens?: number;
}

export interface OrchestrateResult {
  /** Final assistant message content */
  content: string;

  /** Total iterations used */
  iterations: number;

  /** Total tool calls executed */
  toolCallsCount: number;

  /** Messages generated during orchestration (for saving) */
  messages: BaseMessage[];

  /** Whether max iterations was reached */
  maxIterationsReached: boolean;

  /** Metadata from tool executions (items, cart, etc.) */
  metadata?: {
    items?: unknown[];
    cart?: unknown;
    checkoutConfirmation?: unknown;
    purchaseRequest?: unknown;
  };
}

// ============================================================================
// Main Orchestrator Function
// ============================================================================

/**
 * Orchestrate a single agent turn with tool execution loop
 *
 * Flow:
 * 1. Build message history with token budget
 * 2. Loop (max 10 iterations):
 *    a. Invoke LLM with current messages
 *    b. If AI responds with text only → done
 *    c. If AI calls tools → execute tools, add results, continue
 * 3. Save conversation with final messages
 * 4. Return final response
 *
 * @param params - Orchestration parameters
 * @returns Orchestration result with final message and metrics
 */
export async function orchestrateAgentTurn(
  params: OrchestrateParams
): Promise<OrchestrateResult> {
  const {
    userMessage,
    conversation,
    userId,
    conversationId,
    maxTokens = 3000,
  } = params;

  const startTime = Date.now();
  let iterations = 0;
  let toolCallsCount = 0;

  // Accumulate metadata from tool executions
  const accumulatedMetadata: {
    items?: unknown[];
    cart?: unknown;
    checkoutConfirmation?: unknown;
    purchaseRequest?: unknown;
  } = {};

  logger.info('[Orchestrator] Starting agent turn', {
    conversationId,
    userId,
    userMessage: userMessage.substring(0, 100),
  });

  try {
    // Step 1: Build message history with token budget
    const historyResult = await buildMessageHistory({
      conversation,
      newUserMessage: userMessage,
      userId,
      maxTokens,
    });

    // Extract the messages array from result
    const messageHistory = historyResult.messages;

    logger.debug('[Orchestrator] Message history built', {
      conversationId,
      messageCount: messageHistory.length,
      totalTokens: historyResult.totalTokens,
      wasTruncated: historyResult.wasTruncated,
    });

    // Track all new messages generated during this turn
    const newMessages: BaseMessage[] = [];

    // Step 2: Orchestration loop
    while (iterations < MAX_ITERATIONS) {
      iterations++;

      logger.debug('[Orchestrator] Iteration start', {
        conversationId,
        iteration: iterations,
        toolCallsCount,
      });

      // 2a. Invoke LLM with current message history and available tools
      const aiResponse: AIResponse = await invokeChat({
        messages: messageHistory,
        tools: AGENT_TOOLS,
      });

      logger.debug('[Orchestrator] LLM response received', {
        conversationId,
        iteration: iterations,
        hasToolCalls: !!(aiResponse.toolCalls && aiResponse.toolCalls.length > 0),
        toolCallCount: aiResponse.toolCalls?.length || 0,
      });

      // 2b. Check if AI responded with text only (no tool calls)
      if (!aiResponse.toolCalls || aiResponse.toolCalls.length === 0) {
        // Convert AIResponse to AIMessage (only when no tool calls)
        const finalContent =
          aiResponse.content.trim() ||
          'I have completed processing your request.';
        const aiMessage = new AIMessage(finalContent);

        // Add AI message to history
        messageHistory.push(aiMessage);
        newMessages.push(aiMessage);

        logger.info('[Orchestrator] Agent turn complete (no tool calls)', {
          conversationId,
          iterations,
          toolCallsCount,
          duration: Date.now() - startTime,
        });

        return {
          content: finalContent,
          iterations,
          toolCallsCount,
          messages: newMessages,
          maxIterationsReached: false,
          metadata: Object.keys(accumulatedMetadata).length > 0 ? accumulatedMetadata : undefined,
        };
      }

      // 2c. Extract tool calls from response
      const toolCalls = aiResponse.toolCalls;
      toolCallsCount += toolCalls.length;

      // 2d. Add AIMessage with tool_calls to history
      // CRITICAL: LangChain expects tool_calls directly in constructor (not in additional_kwargs)
      const aiMessageWithTools = new AIMessage({
        content: aiResponse.content || '',
        tool_calls: toolCalls.map((tc) => ({
          id: tc.id,
          name: tc.name,
          args:
            typeof tc.arguments === 'string'
              ? JSON.parse(tc.arguments)
              : tc.arguments,
        })),
      });

      messageHistory.push(aiMessageWithTools);
      // Don't add to newMessages - tool messages are not saved to conversation

      // 2e. Execute tool calls

      // Safety check: prevent excessive tool calls
      if (toolCallsCount > MAX_TOOL_CALLS_PER_TURN) {
        logger.warn('[Orchestrator] Max tool calls exceeded', {
          conversationId,
          toolCallsCount,
          maxAllowed: MAX_TOOL_CALLS_PER_TURN,
        });

        // Force completion with error message
        const errorMessage = new AIMessage({
          content:
            'I apologize, but I encountered an error while processing your request. Too many operations were attempted. Please try a simpler request.',
        });

        messageHistory.push(errorMessage);
        newMessages.push(errorMessage);

        return {
          content: errorMessage.content as string,
          iterations,
          toolCallsCount,
          messages: newMessages,
          maxIterationsReached: false,
          metadata: Object.keys(accumulatedMetadata).length > 0 ? accumulatedMetadata : undefined,
        };
      }

      // Execute all tool calls in parallel
      logger.debug('[Orchestrator] Executing tools', {
        conversationId,
        toolCount: toolCalls.length,
        tools: toolCalls.map((tc) => tc.name),
      });

      const toolResults: ToolMessage[] = await Promise.all(
        toolCalls.map(async (toolCall): Promise<ToolMessage> => {
          try {
            // Parse arguments from JSON string
            const args =
              typeof toolCall.arguments === 'string'
                ? JSON.parse(toolCall.arguments)
                : toolCall.arguments;

            const result = await executeTool({
              toolName: toolCall.name,
              args,
              toolCallId: toolCall.id,
              userId,
              conversationId,
            });

            logger.debug('[Orchestrator] Tool executed successfully', {
              conversationId,
              toolName: toolCall.name,
              toolCallId: toolCall.id,
              success: result.success,
            });

            // Extract and accumulate metadata from tool result
            try {
              const toolOutput = JSON.parse(result.message.content as string);
              
              logger.debug('[Orchestrator] Parsed tool output', {
                conversationId,
                toolName: toolCall.name,
                outputType: Array.isArray(toolOutput) ? 'array' : typeof toolOutput,
                isArray: Array.isArray(toolOutput),
                hasItems: !!toolOutput.items,
                hasTotalCost: toolOutput.totalCost !== undefined,
                hasId: !!toolOutput.id,
              });
              
              // Handle search_catalog results
              if (toolCall.name === 'search_catalog') {
                // search_catalog returns { items: [...], count: number }
                if (toolOutput.items && Array.isArray(toolOutput.items)) {
                  accumulatedMetadata.items = toolOutput.items;
                  logger.debug('[Orchestrator] Added items to metadata', {
                    conversationId,
                    itemCount: toolOutput.items.length,
                  });
                }
              }
              
              // Handle add_to_cart/remove_from_cart/get_cart results
              if (['add_to_cart', 'remove_from_cart', 'get_cart'].includes(toolCall.name)) {
                // These return { success: true, cart: { items: [...], totalCost: number } }
                if (toolOutput.cart?.items && toolOutput.cart.totalCost !== undefined) {
                  accumulatedMetadata.cart = {
                    items: toolOutput.cart.items,
                    totalCost: toolOutput.cart.totalCost,
                    itemCount: toolOutput.cart.items.reduce((sum: number, item: { quantity: number }) => sum + item.quantity, 0),
                  };
                  logger.debug('[Orchestrator] Added cart to metadata', {
                    conversationId,
                    cartItemCount: (accumulatedMetadata.cart as { itemCount?: number }).itemCount,
                    totalCost: (accumulatedMetadata.cart as { totalCost?: number }).totalCost,
                  });
                } else if (toolOutput.items && toolOutput.totalCost !== undefined) {
                  // Fallback for direct cart format
                  accumulatedMetadata.cart = {
                    items: toolOutput.items,
                    totalCost: toolOutput.totalCost,
                    itemCount: toolOutput.items.reduce((sum: number, item: { quantity: number }) => sum + item.quantity, 0),
                  };
                  logger.debug('[Orchestrator] Added cart to metadata (fallback)', {
                    conversationId,
                    cartItemCount: (accumulatedMetadata.cart as { itemCount?: number }).itemCount,
                    totalCost: (accumulatedMetadata.cart as { totalCost?: number }).totalCost,
                  });
                }
              }
              
              // Handle checkout results
              if (toolCall.name === 'checkout') {
                if (toolOutput.id) {
                  // Purchase request created
                  accumulatedMetadata.purchaseRequest = toolOutput;
                  logger.debug('[Orchestrator] Added purchase request to metadata', {
                    conversationId,
                    purchaseId: toolOutput.id,
                  });
                } else if (toolOutput.items && toolOutput.totalCost !== undefined) {
                  // Checkout confirmation (before creating purchase request)
                  accumulatedMetadata.checkoutConfirmation = toolOutput;
                  logger.debug('[Orchestrator] Added checkout confirmation to metadata', {
                    conversationId,
                    itemCount: toolOutput.items.length,
                  });
                }
              }
            } catch (parseError) {
              // If parsing fails, just log and continue
              logger.debug('[Orchestrator] Could not parse tool output for metadata', {
                toolName: toolCall.name,
                error: parseError instanceof Error ? parseError.message : String(parseError),
              });
            }

            // Return the ToolMessage from result
            return result.message;
          } catch (error) {
            logger.error('[Orchestrator] Tool execution failed', {
              conversationId,
              toolName: toolCall.name,
              toolCallId: toolCall.id,
              error: error instanceof Error ? error.message : String(error),
            });

            // Return error as tool result
            return new ToolMessage({
              tool_call_id: toolCall.id,
              content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            });
          }
        })
      );

      // Add tool results to history
      messageHistory.push(...toolResults);
      newMessages.push(...toolResults);

      logger.debug('[Orchestrator] Tool results added to history', {
        conversationId,
        resultCount: toolResults.length,
      });

      // Continue to next iteration
    }

    // Max iterations reached
    logger.warn('[Orchestrator] Max iterations reached', {
      conversationId,
      iterations: MAX_ITERATIONS,
      toolCallsCount,
    });

    // Force completion with partial response
    const lastAiMessage = newMessages
      .reverse()
      .find((msg) => msg instanceof AIMessage);

    const content =
      (lastAiMessage?.content as string) ||
      'I apologize, but I need more time to complete your request. Please try breaking it into smaller steps.';

    return {
      content,
      iterations,
      toolCallsCount,
      messages: newMessages,
      maxIterationsReached: true,
      metadata: Object.keys(accumulatedMetadata).length > 0 ? accumulatedMetadata : undefined,
    };
  } catch (error) {
    logger.error('[Orchestrator] Orchestration failed', {
      conversationId,
      userId,
      iterations,
      toolCallsCount,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    // Re-throw for upper layer to handle
    throw error;
  }
}
