/**
 * Agent Tool Executor
 *
 * Executes agent tools with validation, timeout, and error handling:
 * - Tool argument validation (Zod schemas)
 * - Execution timeout (5s default)
 * - Graceful error handling
 * - Metrics tracking (duration, error rates)
 *
 * Part of Step 8: Agent Orchestrator Refactor
 */

import { ToolMessage } from '@langchain/core/messages';

import * as cartService from '@/features/cart';
import * as catalogService from '@/features/catalog';
import * as checkoutService from '@/features/checkout';
import { logger } from '@/lib/logger/winston.config';
import {
  toolExecutionDuration,
  toolExecutionTotal,
} from '@/lib/metrics/prometheus.config';
import { validateToolArgs } from '@/lib/validation/schemas';

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_TIMEOUT_MS = 5000; // 5 seconds

// ============================================================================
// Types
// ============================================================================

export interface ExecuteToolParams {
  /** Tool name (e.g., 'search_catalog', 'add_to_cart') */
  toolName: string;

  /** Tool arguments (unvalidated) */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  args: Record<string, any>;

  /** Tool call ID for LangChain */
  toolCallId: string;

  /** User ID for user-specific operations */
  userId?: string;

  /** Conversation ID for logging */
  conversationId?: string;

  /** Timeout in milliseconds (default 5000) */
  timeout?: number;
}

export interface ExecuteToolResult {
  /** Tool message for LangChain */
  message: ToolMessage;

  /** Execution duration in milliseconds */
  durationMs: number;

  /** Whether execution succeeded */
  success: boolean;

  /** Error message if failed */
  error?: string;
}

// ============================================================================
// Public Functions
// ============================================================================

/**
 * Execute agent tool with validation, timeout, and error handling
 *
 * Workflow:
 * 1. Validate tool arguments (Zod schemas)
 * 2. Execute tool with timeout protection
 * 3. Update metrics (duration, success/error)
 * 4. Return ToolMessage for LangChain
 *
 * @param params - Execution parameters
 * @returns Tool message and metadata
 */
export async function executeTool(
  params: ExecuteToolParams
): Promise<ExecuteToolResult> {
  const {
    toolName,
    args,
    toolCallId,
    userId,
    conversationId,
    timeout = DEFAULT_TIMEOUT_MS,
  } = params;

  const startTime = Date.now();

  logger.debug('Tool execution started', {
    toolName,
    args,
    toolCallId,
    userId,
    conversationId,
    timeout,
  });

  try {
    // 1. Validate tool arguments (Zod schemas)
    const validatedArgs = validateToolArgs(toolName as import('@/lib/validation/schemas').ToolName, args);

    logger.debug('Tool arguments validated', {
      toolName,
      validatedArgs,
    });

    // 2. Execute with timeout
    const result = await Promise.race([
      executeToolInternal(toolName, validatedArgs, userId, conversationId),
      timeoutPromise(timeout),
    ]);

    // 3. Update success metrics
    const durationMs = Date.now() - startTime;
    toolExecutionDuration.labels({ tool: toolName }).observe(durationMs / 1000);
    toolExecutionTotal.labels({ tool: toolName, status: 'success' }).inc();

    logger.info('Tool execution succeeded', {
      toolName,
      toolCallId,
      durationMs,
      userId,
      conversationId,
    });

    // 4. Return ToolMessage
    return {
      message: new ToolMessage({
        tool_call_id: toolCallId,
        content: JSON.stringify(result),
      }),
      durationMs,
      success: true,
    };
  } catch (error) {
    // Log error, update error metrics
    const durationMs = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorType = error instanceof Error ? error.name : 'UnknownError';

    toolExecutionDuration.labels({ tool: toolName }).observe(durationMs / 1000);
    toolExecutionTotal.labels({ tool: toolName, status: 'error' }).inc();

    logger.error('Tool execution failed', {
      toolName,
      toolCallId,
      error: errorMessage,
      errorType,
      durationMs,
      userId,
      conversationId,
    });

    // Return error message to LLM (non-throwing)
    return {
      message: new ToolMessage({
        tool_call_id: toolCallId,
        content: JSON.stringify({
          error: errorMessage,
          errorType,
          toolName,
        }),
      }),
      durationMs,
      success: false,
      error: errorMessage,
    };
  }
}

// ============================================================================
// Internal Functions
// ============================================================================

/**
 * Execute tool logic (after validation)
 */
async function executeToolInternal(
  toolName: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  args: Record<string, any>,
  userId?: string,
  conversationId?: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any> {
  logger.debug('Executing tool', { toolName, args, userId, conversationId });

  switch (toolName) {
    case 'search_catalog': {
      const items = await catalogService.searchItems({
        q: args.query,
        limit: args.limit,
        maxPrice: args.maxPrice,
      });

      logger.debug('Search catalog result', {
        query: args.query,
        resultCount: items.length,
      });

      return {
        items: items.map((item) => ({
          id: item.id,
          name: item.name,
          category: item.category,
          description: item.description,
          price: item.price,
          availability: item.status === 'Active' ? 'in_stock' : 'out_of_stock',
        })),
        count: items.length,
      };
    }

    case 'add_to_cart': {
      if (!userId) {
        throw new Error('User must be authenticated to add items to cart');
      }

      const result = await cartService.addItemToCart(userId, {
        itemId: args.itemId,
        quantity: args.quantity,
      });

      logger.info('Item added to cart', {
        userId,
        itemId: args.itemId,
        quantity: args.quantity,
      });

      return {
        success: true,
        cart: {
          items: result.items.map((item) => ({
            itemId: item.itemId,
            itemName: item.itemName,
            itemPrice: item.itemPrice,
            quantity: item.quantity,
          })),
          totalCost: result.totalCost,
          itemCount: result.items.length,
        },
      };
    }

    case 'remove_from_cart': {
      if (!userId) {
        throw new Error('User must be authenticated to remove items from cart');
      }

      const result = await cartService.removeCartItem(userId, args.itemId);

      logger.info('Item removed from cart', {
        userId,
        itemId: args.itemId,
      });

      return {
        success: true,
        cart: {
          items: result.items.map((item) => ({
            itemId: item.itemId,
            itemName: item.itemName,
            itemPrice: item.itemPrice,
            quantity: item.quantity,
          })),
          totalCost: result.totalCost,
          itemCount: result.items.length,
        },
      };
    }

    case 'get_cart': {
      if (!userId) {
        throw new Error('User must be authenticated to view cart');
      }

      const cart = await cartService.getCartForUser(userId);

      logger.debug('Get cart result', {
        userId,
        itemCount: cart?.items.length || 0,
      });

      if (!cart || cart.items.length === 0) {
        return {
          items: [],
          totalCost: 0,
          itemCount: 0,
          message: 'Your cart is empty',
        };
      }

      return {
        items: cart.items.map((item) => ({
          itemId: item.itemId,
          itemName: item.itemName,
          itemPrice: item.itemPrice,
          quantity: item.quantity,
        })),
        totalCost: cart.totalCost,
        itemCount: cart.items.length,
      };
    }

    case 'checkout': {
      if (!userId) {
        throw new Error('User must be authenticated to checkout');
      }

      const purchaseRequest = await checkoutService.checkoutCart(
        userId,
        args.notes
      );

      logger.info('Purchase request created', {
        userId,
        purchaseRequestId: purchaseRequest.id,
        totalCost: purchaseRequest.totalCost,
      });

      return {
        success: true,
        purchaseRequest: {
          id: purchaseRequest.id,
          totalCost: purchaseRequest.totalCost,
          itemCount: purchaseRequest.items.length,
          status: purchaseRequest.status,
          createdAt: purchaseRequest.createdAt,
        },
      };
    }

    default:
      throw new Error(`Unknown tool: ${toolName}`);
  }
}

/**
 * Create a promise that rejects after timeout
 */
function timeoutPromise(ms: number): Promise<never> {
  return new Promise((_, reject) =>
    setTimeout(() => reject(new Error(`Tool execution timeout (${ms}ms)`)), ms)
  );
}
