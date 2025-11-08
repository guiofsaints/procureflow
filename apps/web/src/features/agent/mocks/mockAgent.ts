/**
 * Mock Agent Logic
 *
 * Simulates agent behavior for parsing user input, searching items,
 * and generating conversational responses.
 */

import type { AgentItem, AgentMessage } from '../types';

import { mockItems } from './mockItems';

interface ParsedUserMessage {
  quantity?: number;
  query: string;
  maxPrice?: number;
}

/**
 * Parse user message to extract quantity, query, and price constraints
 */
export function parseUserMessage(message: string): ParsedUserMessage {
  const result: ParsedUserMessage = {
    query: message,
  };

  // Extract quantity - look for numbers at the start or standalone
  const quantityMatch = message.match(/\b(\d+)\b/);
  if (quantityMatch) {
    result.quantity = parseInt(quantityMatch[1], 10);
  }

  // Extract max price - look for patterns like "under $X", "< $X", "less than $X"
  const pricePatterns = [
    /under\s*\$?\s*(\d+(?:\.\d+)?)/i,
    /less\s+than\s*\$?\s*(\d+(?:\.\d+)?)/i,
    /<\s*\$?\s*(\d+(?:\.\d+)?)/i,
    /below\s*\$?\s*(\d+(?:\.\d+)?)/i,
    /max(?:imum)?\s*\$?\s*(\d+(?:\.\d+)?)/i,
  ];

  for (const pattern of pricePatterns) {
    const match = message.match(pattern);
    if (match) {
      result.maxPrice = parseFloat(match[1]);
      break;
    }
  }

  // Clean up query - remove quantity and price patterns
  const cleanQuery = message
    .replace(/\b\d+\b/, '') // Remove quantity
    .replace(
      /(?:under|less\s+than|below|max(?:imum)?)\s*\$?\s*\d+(?:\.\d+)?/gi,
      ''
    ) // Remove price patterns
    .replace(/<\s*\$?\s*\d+(?:\.\d+)?/gi, '') // Remove < price pattern
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();

  result.query = cleanQuery || message;

  return result;
}

/**
 * Find mock items based on query and price constraints
 */
export function findMockItems(query: string, maxPrice?: number): AgentItem[] {
  const lowerQuery = query.toLowerCase();

  return mockItems.filter((item) => {
    // Check if query matches name, category, or description
    const matchesQuery =
      item.name.toLowerCase().includes(lowerQuery) ||
      item.category.toLowerCase().includes(lowerQuery) ||
      item.description.toLowerCase().includes(lowerQuery);

    // Check price constraint
    const matchesPrice = maxPrice === undefined || item.price <= maxPrice;

    return matchesQuery && matchesPrice;
  });
}

/**
 * Generate a mock agent response based on user message
 */
export async function generateMockAgentResponse(
  userMessage: string
): Promise<AgentMessage> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 800));

  const parsed = parseUserMessage(userMessage);
  const foundItems = findMockItems(parsed.query, parsed.maxPrice);

  let content = '';
  const messageId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  if (foundItems.length > 0) {
    // Generate response based on what was found
    const quantityText = parsed.quantity
      ? `${parsed.quantity} `
      : parsed.quantity === 1
        ? 'a '
        : '';
    const priceText = parsed.maxPrice
      ? ` under $${parsed.maxPrice.toFixed(2)}`
      : '';

    if (foundItems.length === 1) {
      content = `I found ${quantityText}${foundItems[0].category.toLowerCase()} that matches your criteria${priceText}. Here's what I have:`;
    } else {
      content = `I found ${foundItems.length} items that match your request${priceText}. Here are the options:`;
    }

    return {
      id: messageId,
      role: 'assistant',
      content,
      items: foundItems,
    };
  } else {
    // No items found
    const priceConstraint = parsed.maxPrice
      ? ` under $${parsed.maxPrice.toFixed(2)}`
      : '';

    content = `I couldn't find any items matching "${parsed.query}"${priceConstraint} in our current catalog. I can help you register a new item request if you'd like. Could you provide more details about what you need?`;

    return {
      id: messageId,
      role: 'assistant',
      content,
    };
  }
}
