/**
 * TypeScript types for AgentConversation Mongoose documents
 *
 * These interfaces provide full type safety for Mongoose documents,
 * eliminating the need for `any` types in service layer functions.
 */

import { Document, Types } from 'mongoose';

import {
  ConversationStatus,
  MessageSender,
} from '../schemas/agent-conversation.schema';

/**
 * AgentMessage subdocument interface
 * Represents a single message in the conversation
 */
export interface AgentMessageDocument {
  _id: Types.ObjectId;
  sender: MessageSender;
  content: string;
  createdAt: Date;
  metadata?: Record<string, unknown>; // Optional metadata for future use
}

/**
 * AgentConversation document interface
 * Extends Mongoose Document to include all schema fields with proper types
 */
export interface AgentConversationDocument extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  title: string;
  status: ConversationStatus;
  messages: AgentMessageDocument[];
  lastMessagePreview?: string;
  lastMessageAt: Date;
  createdAt: Date;
  updatedAt: Date;
}
