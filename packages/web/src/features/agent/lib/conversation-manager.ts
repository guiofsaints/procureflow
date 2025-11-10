/**
 * Conversation Manager
 *
 * Manages agent conversation history with token-based memory management:
 * - Build message history with token budget
 * - Token-based truncation (3000 tokens default)
 * - Cart context injection
 * - Truncation logging for observability
 *
 * Part of Step 8: Agent Orchestrator Refactor
 */

import {
  AIMessage,
  HumanMessage,
  SystemMessage,
  ToolMessage,
} from '@langchain/core/messages';
import type { BaseMessage } from '@langchain/core/messages';

import type { AgentConversationDocument } from '@/domain/mongo-schemas';
import { getCartForUser } from '@/features/cart';
import { countTokens } from '@/lib/ai/tokenCounter';
import { logger } from '@/lib/logger/winston.config';
import {
  conversationTruncations,
  conversationMessageCount,
  conversationTokenCount,
} from '@/lib/metrics/prometheus.config';

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_MAX_TOKENS = 3000; // Max tokens for message history (input budget)
const MAX_TOTAL_TOKENS = 4000; // Absolute max tokens (fail-safe)
const MAX_HISTORY_MESSAGES = 50; // Max number of history messages to include

const SYSTEM_PROMPT = `You are a helpful AI procurement assistant for ProcureFlow. Your role is to help users:

1. **Search and discover items** - Find materials and services in the catalog
2. **Manage shopping cart** - Add, remove, or update items
3. **Create purchase requests** - Submit procurement requests to ERP system

**Guidelines**:
- Be concise and friendly
- Confirm actions before executing (adding to cart, checkout)
- Ask clarifying questions for ambiguous requests
- Explain what you're doing at each step
- If items are out of stock or unavailable, suggest alternatives

**Tools Available**:
- search_catalog: Search for items by query, filter by price range
- add_to_cart: Add items to shopping cart
- remove_from_cart: Remove items from cart
- get_cart: View current cart contents
- checkout: Create purchase request from cart items

Always provide helpful context about items (price, availability, description) when suggesting them.`;

// ============================================================================
// Types
// ============================================================================

export interface BuildMessageHistoryParams {
  /** Conversation document from MongoDB */
  conversation: AgentConversationDocument;

  /** New user message to append */
  newUserMessage: string;

  /** User ID for cart context */
  userId?: string;

  /** Max tokens for message history (default 3000) */
  maxTokens?: number;

  /** Model for token counting (default gpt-4o-mini) */
  model?: string;
}

export interface BuildMessageHistoryResult {
  /** Message array for LLM (system + history + cart + user) */
  messages: BaseMessage[];

  /** Total tokens in message array */
  totalTokens: number;

  /** Number of history messages included */
  includedMessages: number;

  /** Number of history messages truncated */
  truncatedMessages: number;

  /** Whether truncation occurred */
  wasTruncated: boolean;
}

// ============================================================================
// Public Functions
// ============================================================================

/**
 * Build message history with token budget
 *
 * Strategy:
 * 1. Always include: system prompt, cart context, new user message
 * 2. Add conversation history from most recent, up to token budget
 * 3. Log truncation events for observability
 *
 * @param params - Build parameters
 * @returns Message array with token metadata
 */
export async function buildMessageHistory(
  params: BuildMessageHistoryParams
): Promise<BuildMessageHistoryResult> {
  const {
    conversation,
    newUserMessage,
    userId,
    maxTokens = DEFAULT_MAX_TOKENS,
    model = 'gpt-4o-mini',
  } = params;

  const messages: BaseMessage[] = [];
  let totalTokens = 0;

  // 1. Add system message (always included)
  const systemMessage = new SystemMessage(SYSTEM_PROMPT);
  const systemTokens = countTokens(SYSTEM_PROMPT, model);
  messages.push(systemMessage);
  totalTokens += systemTokens;

  logger.debug('System prompt added', {
    conversationId: conversation._id?.toString(),
    tokens: systemTokens,
  });

  // 2. Add cart context (always included if cart has items)
  let cartTokens = 0;
  if (userId) {
    try {
      const cart = await getCartForUser(userId);
      if (cart && cart.items.length > 0) {
        const cartContext = formatCartContext(cart);
        const cartMessage = new SystemMessage(cartContext);
        cartTokens = countTokens(cartContext, model);
        messages.push(cartMessage);
        totalTokens += cartTokens;

        logger.debug('Cart context added', {
          conversationId: conversation._id?.toString(),
          itemCount: cart.items.length,
          totalCost: cart.totalCost,
          tokens: cartTokens,
        });
      }
    } catch (error) {
      // Non-blocking: If cart fetch fails, continue without cart context
      logger.warn('Failed to fetch cart for context', {
        conversationId: conversation._id?.toString(),
        userId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  // 3. Calculate budget for history
  const newUserTokens = countTokens(newUserMessage, model);
  const reservedTokens = systemTokens + cartTokens + newUserTokens;
  const historyBudget = Math.max(0, maxTokens - reservedTokens);

  logger.debug('Token budget calculated', {
    conversationId: conversation._id?.toString(),
    maxTokens,
    systemTokens,
    cartTokens,
    newUserTokens,
    reservedTokens,
    historyBudget,
  });

  // 4. Add conversation history (token-budgeted and message-count limited)
  const historyMessages = conversation.messages || [];
  let historyTokens = 0;
  const includedHistory: BaseMessage[] = [];
  let truncatedCount = 0;
  let truncatedByCount = false;

  // Work backwards from most recent
  for (let i = historyMessages.length - 1; i >= 0; i--) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const msg = historyMessages[i] as any;
    const content = msg.content || '';
    const msgTokens = countTokens(content, model);

    // Check message count limit first
    if (includedHistory.length >= MAX_HISTORY_MESSAGES) {
      truncatedCount = i + 1; // All messages from 0 to i are truncated
      truncatedByCount = true;
      break;
    }

    // Check token budget
    if (historyTokens + msgTokens > historyBudget) {
      truncatedCount = i + 1; // All messages from 0 to i are truncated
      break;
    }

    historyTokens += msgTokens;
    includedHistory.unshift(convertToBaseMessage(msg));
  }

  messages.push(...includedHistory);
  totalTokens += historyTokens;

  // Log truncation if it occurred and emit metrics
  const wasTruncated = truncatedCount > 0;
  if (wasTruncated) {
    // Determine truncation reason
    const truncationReason = truncatedByCount ? 'message_count' : 'token_budget';

    // Emit metrics
    conversationTruncations.labels({ reason: truncationReason }).inc();

    logger.info('Message history truncated', {
      conversationId: conversation._id?.toString(),
      totalMessages: historyMessages.length,
      includedMessages: includedHistory.length,
      truncatedMessages: truncatedCount,
      truncatedByCount,
      truncationReason,
      maxHistoryMessages: MAX_HISTORY_MESSAGES,
      tokenBudget: maxTokens,
      tokensUsed: totalTokens,
      historyBudget,
      historyTokens,
    });
  }

  // 5. Add new user message
  const userMessage = new HumanMessage(newUserMessage);
  messages.push(userMessage);
  totalTokens += newUserTokens;

  // 6. Fail-fast if total tokens exceed absolute maximum
  if (totalTokens > MAX_TOTAL_TOKENS) {
    const errorMsg = `Total tokens (${totalTokens}) exceeds MAX_TOTAL_TOKENS (${MAX_TOTAL_TOKENS})`;

    // Emit metric for total token limit exceeded
    conversationTruncations.labels({ reason: 'total_tokens' }).inc();

    logger.error('Token limit exceeded', {
      conversationId: conversation._id?.toString(),
      totalTokens,
      maxTotalTokens: MAX_TOTAL_TOKENS,
      messageCount: messages.length,
    });
    throw new Error(errorMsg);
  }

  // Emit metrics for conversation size
  conversationMessageCount.observe(messages.length);
  conversationTokenCount.observe(totalTokens);

  // Final logging
  logger.debug('Message history built', {
    conversationId: conversation._id?.toString(),
    totalMessages: messages.length,
    totalTokens,
    maxTokens,
    maxTotalTokens: MAX_TOTAL_TOKENS,
    wasTruncated,
  });

  return {
    messages,
    totalTokens,
    includedMessages: includedHistory.length,
    truncatedMessages: truncatedCount,
    wasTruncated,
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Convert MongoDB conversation message to LangChain BaseMessage
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function convertToBaseMessage(msg: any): BaseMessage {
  const sender = msg.sender || 'user';
  const content = msg.content || '';

  switch (sender) {
    case 'user':
      return new HumanMessage(content);

    case 'agent':
      return new AIMessage(content);

    case 'system':
      return new SystemMessage(content);

    case 'tool':
      return new ToolMessage({
        content,
        tool_call_id: msg.toolCallId || 'unknown',
      });

    default:
      logger.warn('Unknown message sender type, defaulting to HumanMessage', {
        sender,
      });
      return new HumanMessage(content);
  }
}

/**
 * Format cart as context string for LLM
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function formatCartContext(cart: any): string {
  const itemList = cart.items
    .map(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (item: any) =>
        `- ${item.itemName} (x${item.quantity}) - $${(item.itemPrice * item.quantity).toFixed(2)}`
    )
    .join('\n');

  return `**Current Shopping Cart** (${cart.items.length} items, $${cart.totalCost.toFixed(2)} total):
${itemList}

The user can view their cart, add more items, or proceed to checkout.`;
}

// ============================================================================
// Future Enhancement Hooks
// ============================================================================

/**
 * Summarize conversation history (STUB - Future Implementation)
 *
 * When conversation history exceeds limits, generate a summary of key context:
 * - Items discussed/searched
 * - Items added/removed from cart
 * - User preferences mentioned
 * - Previous purchase requests
 *
 * Summary replaces old messages, preserving context while reducing tokens.
 *
 * @param messages - Messages to summarize
 * @param conversationId - Conversation ID for logging
 * @returns Summary text to inject as system message
 *
 * @future Implementation ideas:
 * - Use LLM to generate summary (e.g., "User searched for office supplies, added 3 items to cart")
 * - Store summary in conversation metadata
 * - Trigger when truncatedMessages > threshold (e.g., 20)
 * - Include timestamp range of summarized messages
 */
export async function summarizeConversationHistory(
  messages: BaseMessage[],
  conversationId?: string
): Promise<string> {
  // STUB: Return placeholder for now
  logger.debug('Conversation summarization called (stub)', {
    conversationId,
    messageCount: messages.length,
  });

  return 'Previous conversation context will be summarized here in future implementation.';
}
