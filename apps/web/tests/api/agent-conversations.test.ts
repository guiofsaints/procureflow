/**
 * Agent Conversations API Tests
 *
 * Tests for agent conversation history API endpoints and services.
 */

import { describe, expect, it } from 'vitest';

import {
  createConversationForUser,
  getConversationSummaryById,
  listConversationsForUser,
} from '@/features/agent';

describe('Agent Conversation Service', () => {
  const testUserId = 'test-user-123';

  describe('createConversationForUser', () => {
    it('should create a conversation with title and preview', async () => {
      const conversation = await createConversationForUser(testUserId, {
        title: 'Test Conversation',
        lastMessagePreview: 'Hello, this is a test message',
      });

      expect(conversation).toBeDefined();
      expect(conversation.id).toBeDefined();
      expect(conversation.title).toBe('Test Conversation');
      expect(conversation.lastMessagePreview).toBe(
        'Hello, this is a test message'
      );
      expect(conversation.updatedAt).toBeDefined();
    });

    it('should truncate title if longer than 120 characters', async () => {
      const longTitle = 'A'.repeat(150);
      const conversation = await createConversationForUser(testUserId, {
        title: longTitle,
        lastMessagePreview: 'Test',
      });

      expect(conversation.title.length).toBeLessThanOrEqual(120);
    });

    it('should truncate preview if longer than 120 characters', async () => {
      const longPreview = 'B'.repeat(150);
      const conversation = await createConversationForUser(testUserId, {
        title: 'Test',
        lastMessagePreview: longPreview,
      });

      expect(conversation.lastMessagePreview.length).toBeLessThanOrEqual(120);
    });
  });

  describe('listConversationsForUser', () => {
    it('should return empty array if user has no conversations', async () => {
      const conversations = await listConversationsForUser('nonexistent-user');

      expect(conversations).toEqual([]);
    });

    it('should return conversations sorted by most recent', async () => {
      // Create multiple conversations
      await createConversationForUser(testUserId, {
        title: 'First',
        lastMessagePreview: 'First message',
      });

      await new Promise((resolve) => setTimeout(resolve, 10)); // Small delay

      await createConversationForUser(testUserId, {
        title: 'Second',
        lastMessagePreview: 'Second message',
      });

      const conversations = await listConversationsForUser(testUserId);

      expect(conversations.length).toBeGreaterThanOrEqual(2);
      // Most recent should be first
      expect(conversations[0].title).toBe('Second');
    });

    it('should respect limit parameter', async () => {
      const conversations = await listConversationsForUser(testUserId, 1);

      expect(conversations.length).toBeLessThanOrEqual(1);
    });
  });

  describe('getConversationSummaryById', () => {
    it('should return null for nonexistent conversation', async () => {
      const conversation = await getConversationSummaryById(
        testUserId,
        'nonexistent-id'
      );

      expect(conversation).toBeNull();
    });

    it('should return null if conversation belongs to different user', async () => {
      // Create conversation for user A
      const conv = await createConversationForUser('user-a', {
        title: 'User A Conversation',
        lastMessagePreview: 'Test',
      });

      // Try to fetch as user B
      const result = await getConversationSummaryById('user-b', conv.id);

      expect(result).toBeNull();
    });

    it('should return conversation summary for valid id and user', async () => {
      const created = await createConversationForUser(testUserId, {
        title: 'My Conversation',
        lastMessagePreview: 'Test preview',
      });

      const fetched = await getConversationSummaryById(testUserId, created.id);

      expect(fetched).toBeDefined();
      expect(fetched?.id).toBe(created.id);
      expect(fetched?.title).toBe('My Conversation');
    });
  });
});

describe('Agent Conversations API', () => {
  describe('GET /api/agent/conversations', () => {
    it('should return 401 when unauthenticated', async () => {
      const response = await fetch('/api/agent/conversations');

      expect(response.status).toBe(401);

      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBe('Unauthorized');
    });

    // Note: Testing authenticated requests requires setting up session mocks
    // This is left for future implementation with proper test helpers
  });

  describe('GET /api/agent/conversations/[id]', () => {
    it('should return 401 when unauthenticated', async () => {
      const response = await fetch('/api/agent/conversations/test-id');

      expect(response.status).toBe(401);

      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBe('Unauthorized');
    });

    // Note: Testing authenticated requests and 404 scenarios requires session mocks
    // This is left for future implementation
  });
});
