/**
 * Agent Chat Type Definitions
 *
 * Types for the Agent chat feature, including messages, items, and roles.
 * These types extend or adapt domain entities for agent-specific use cases.
 */

import type { Item, PurchaseRequest } from '@/domain/entities';

export type AgentRole = 'user' | 'agent' | 'system';

/**
 * Agent-specific view of an Item entity
 * Extends Item with agent-specific availability mapping
 */
export interface AgentItem extends Pick<Item, 'id' | 'name' | 'category' | 'description' | 'estimatedPrice'> {
  availability: 'in_stock' | 'out_of_stock' | 'limited';
}

/**
 * Agent-specific view of Cart entities
 * Adapts Cart and CartItem for agent UI
 */
export interface AgentCartItem {
  itemId: string;
  itemName: string;
  itemPrice: number;
  quantity: number;
}

export interface AgentCart {
  items: AgentCartItem[];
  totalCost: number;
  itemCount: number;
}

/**
 * Agent-specific view of PurchaseRequest entity
 * Adapts PurchaseRequest for agent UI display
 */
export interface AgentPurchaseRequest extends Pick<PurchaseRequest, 'id' | 'total' | 'status'> {
  items: Array<{
    itemName: string;
    itemCategory: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
  }>;
}

/**
 * Agent checkout confirmation (represents cart data before purchase)
 */
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

export interface AgentMessage {
  id: string;
  role: AgentRole;
  content: string;
  timestamp: Date;
  items?: AgentItem[];
  cart?: AgentCart;
  checkoutConfirmation?: AgentCheckoutConfirmation;
  purchaseRequest?: AgentPurchaseRequest;
}

export interface AgentConversationSummary {
  id: string;
  title: string;
  lastMessagePreview: string;
  updatedAt: string; // ISO date
}
