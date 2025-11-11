/**
 * Agent Conversation Mapper
 *
 * Converts Mongoose documents to domain entities for agent conversations.
 * Eliminates code duplication across services.
 */

import type { AgentConversationDocument } from '@/domain/documents';
import type { AgentConversationSummary } from '@/features/agent/types';

/**
 * Maps an AgentConversationDocument from Mongoose to an AgentConversationSummary domain entity
 */
export function mapConversationToSummary(
  doc: AgentConversationDocument
): AgentConversationSummary {
  return {
    id: doc._id.toString(),
    title: doc.title || 'Untitled conversation',
    lastMessagePreview: doc.lastMessagePreview || 'No messages yet',
    updatedAt: doc.updatedAt?.toISOString() || new Date().toISOString(),
  };
}
