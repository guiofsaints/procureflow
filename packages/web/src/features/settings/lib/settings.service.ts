/**
 * Settings Service
 *
 * Handles user settings operations including profile updates,
 * conversation history management
 */

import type { UserDocument } from '@/domain/documents';
import type { User } from '@/domain/entities';
import { UserModel, AgentConversationModel } from '@/lib/db/models';
import connectDB from '@/lib/db/mongoose';
import { logger } from '@/lib/logger/winston.config';

// ============================================================================
// Types
// ============================================================================

export interface UpdateUserNameInput {
  userId: string;
  name: string;
}

export interface ConversationSummary {
  id: string;
  title: string;
  lastMessagePreview: string;
  messageCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// Service Functions
// ============================================================================

/**
 * Map Mongoose user document to domain entity
 */
function mapUserToEntity(doc: Partial<UserDocument>): User {
  return {
    id: typeof doc._id === 'string' ? doc._id : doc._id?.toString() || '',
    email: doc.email || '',
    name: doc.name || '',
    role: doc.role || 'requester',
    createdAt: doc.createdAt || new Date(),
    updatedAt: doc.updatedAt || new Date(),
  };
}

/**
 * Map conversation document to summary
 */
function mapConversationToSummary(
  doc: Record<string, unknown>
): ConversationSummary {
  // Extract first user message as preview if available
  const messages = (doc.messages as Array<Record<string, unknown>>) || [];
  const firstUserMessage = messages.find(
    (m: Record<string, unknown>) => m.sender === 'user'
  )?.content as string | undefined;
  const preview = firstUserMessage?.substring(0, 100) || 'No messages yet...';

  return {
    id: (doc._id as { toString: () => string }).toString(),
    title: (doc.title as string) || 'Untitled Conversation',
    lastMessagePreview: preview,
    messageCount: messages.length,
    createdAt: doc.createdAt as Date,
    updatedAt: doc.updatedAt as Date,
  };
}

/**
 * Update user's name
 *
 * @param input - User ID and new name
 * @returns Updated user
 * @throws Error if user not found or validation fails
 */
export async function updateUserName(
  input: UpdateUserNameInput
): Promise<Omit<User, 'passwordHash'>> {
  await connectDB();

  // Validate input
  if (!input.name || input.name.trim().length === 0) {
    throw new Error('Name cannot be empty');
  }

  if (input.name.length > 100) {
    throw new Error('Name must be less than 100 characters');
  }

  // Update user
  const user = await UserModel.findByIdAndUpdate(
    input.userId,
    { name: input.name.trim() },
    { new: true, runValidators: true }
  )
    .lean()
    .exec();

  if (!user) {
    throw new Error('User not found');
  }

  return mapUserToEntity(user as Partial<UserDocument>);
}

/**
 * List all conversations for a user
 *
 * @param userId - User ID
 * @returns Array of conversation summaries
 */
export async function listUserConversations(
  userId: string
): Promise<ConversationSummary[]> {
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
      .lean()
      .exec();

    return conversations.map(mapConversationToSummary);
  } catch (error) {
    logger.error('Error listing conversations', { userId, error });
    throw new Error('Failed to list conversations');
  }
}

/**
 * Delete a single conversation
 *
 * @param userId - User ID (for authorization)
 * @param conversationId - Conversation ID to delete
 * @throws Error if conversation not found or doesn't belong to user
 */
export async function deleteConversation(
  userId: string,
  conversationId: string
): Promise<void> {
  await connectDB();

  try {
    const result = await AgentConversationModel.findOneAndDelete({
      _id: conversationId,
      userId, // Ensure user owns this conversation
    }).exec();

    if (!result) {
      throw new Error('Conversation not found or access denied');
    }
  } catch (error) {
    logger.error('Error deleting conversation', {
      userId,
      conversationId,
      error,
    });
    throw new Error('Failed to delete conversation');
  }
}

/**
 * Delete all conversations for a user
 *
 * @param userId - User ID
 * @returns Number of conversations deleted
 */
export async function deleteAllConversations(userId: string): Promise<number> {
  await connectDB();

  try {
    // Check if userId is a valid ObjectId
    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(userId);

    if (!isValidObjectId) {
      // For invalid ObjectIds, return 0 (nothing to delete)
      return 0;
    }

    const result = await AgentConversationModel.deleteMany({ userId }).exec();

    return result.deletedCount || 0;
  } catch (error) {
    logger.error('Error deleting all conversations', { userId, error });
    throw new Error('Failed to delete conversations');
  }
}
