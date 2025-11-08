/**
 * Agent Chat Type Definitions
 *
 * Types for the Agent chat feature, including messages, items, and roles.
 */

export type AgentRole = 'user' | 'assistant' | 'system';

export interface AgentItem {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  availability: 'in_stock' | 'out_of_stock' | 'limited';
}

export interface AgentMessage {
  id: string;
  role: AgentRole;
  content: string;
  items?: AgentItem[];
}
