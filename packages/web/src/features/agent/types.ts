/**
 * Agent Chat Type Definitions
 *
 * Types for the Agent chat feature, including messages, items, and roles.
 */

export type AgentRole = 'user' | 'agent' | 'system';

export interface AgentItem {
  id: string;
  name: string;
  category: string;
  description: string;
  estimatedPrice: number;
  availability: 'in_stock' | 'out_of_stock' | 'limited';
}

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

export interface AgentPurchaseRequest {
  id: string;
  items: Array<{
    itemName: string;
    itemCategory: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
  }>;
  total: number;
  status: string;
}

export interface AgentCheckoutConfirmation {
  items: Array<{
    itemId: string;
    itemName: string;
    itemPrice: number;
    quantity: number;
    subtotal: number;
  }>;
  total: number;
  itemCount: number;
}

export interface AgentMessage {
  id: string;
  role: AgentRole;
  content: string;
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
