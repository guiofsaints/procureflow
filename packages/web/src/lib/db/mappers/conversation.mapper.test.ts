import { Types } from 'mongoose';
import { describe, expect, it } from 'vitest';

import type { AgentConversationDocument } from '@/domain/documents';
import { AgentActionType } from '@/domain/entities';

import { mapConversationToSummary } from './conversation.mapper';

describe('conversation.mapper', () => {
  describe('mapConversationToSummary', () => {
    it('should map conversation document to summary correctly', () => {
      const mockConversation: AgentConversationDocument = {
        _id: new Types.ObjectId('507f1f77bcf86cd799439011'),
        userId: new Types.ObjectId('507f1f77bcf86cd799439012'),
        title: 'Office Supplies Order',
        lastMessagePreview: 'I need 10 notebooks and 5 pens',
        messages: [],
        actions: [],
        isActive: true,
        createdAt: new Date('2024-01-15T10:00:00Z'),
        updatedAt: new Date('2024-01-15T14:30:00Z'),
      };

      const result = mapConversationToSummary(mockConversation);

      expect(result).toEqual({
        id: '507f1f77bcf86cd799439011',
        title: 'Office Supplies Order',
        lastMessagePreview: 'I need 10 notebooks and 5 pens',
        updatedAt: '2024-01-15T14:30:00.000Z',
      });
    });

    it('should convert ObjectId to string', () => {
      const mockConversation: AgentConversationDocument = {
        _id: new Types.ObjectId('507f1f77bcf86cd799439011'),
        userId: new Types.ObjectId('507f1f77bcf86cd799439012'),
        title: 'Quick Chat',
        lastMessagePreview: 'Hello',
        messages: [],
        actions: [],
        isActive: true,
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15'),
      };

      const result = mapConversationToSummary(mockConversation);

      expect(typeof result.id).toBe('string');
      expect(result.id).toBe('507f1f77bcf86cd799439011');
    });

    it('should default to "Untitled conversation" when title is missing', () => {
      const mockConversation: AgentConversationDocument = {
        _id: new Types.ObjectId('507f1f77bcf86cd799439011'),
        userId: new Types.ObjectId('507f1f77bcf86cd799439012'),
        title: '',
        lastMessagePreview: 'Some message',
        messages: [],
        actions: [],
        isActive: true,
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15'),
      };

      const result = mapConversationToSummary(mockConversation);

      expect(result.title).toBe('Untitled conversation');
    });

    it('should default to "No messages yet" when lastMessagePreview is missing', () => {
      const mockConversation: AgentConversationDocument = {
        _id: new Types.ObjectId('507f1f77bcf86cd799439011'),
        userId: new Types.ObjectId('507f1f77bcf86cd799439012'),
        title: 'New Conversation',
        lastMessagePreview: '',
        messages: [],
        actions: [],
        isActive: true,
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15'),
      };

      const result = mapConversationToSummary(mockConversation);

      expect(result.lastMessagePreview).toBe('No messages yet');
    });

    it('should convert updatedAt to ISO string', () => {
      const updatedDate = new Date('2024-01-15T14:30:00Z');
      const mockConversation: AgentConversationDocument = {
        _id: new Types.ObjectId('507f1f77bcf86cd799439011'),
        userId: new Types.ObjectId('507f1f77bcf86cd799439012'),
        title: 'Test Conversation',
        lastMessagePreview: 'Test message',
        messages: [],
        actions: [],
        isActive: true,
        createdAt: new Date('2024-01-15'),
        updatedAt: updatedDate,
      };

      const result = mapConversationToSummary(mockConversation);

      expect(result.updatedAt).toBe('2024-01-15T14:30:00.000Z');
      expect(typeof result.updatedAt).toBe('string');
    });

    it('should handle missing updatedAt by using current date', () => {
      const beforeCall = new Date();
      const mockConversation: AgentConversationDocument = {
        _id: new Types.ObjectId('507f1f77bcf86cd799439011'),
        userId: new Types.ObjectId('507f1f77bcf86cd799439012'),
        title: 'Old Conversation',
        lastMessagePreview: 'Old message',
        messages: [],
        actions: [],
        isActive: false,
        createdAt: new Date('2024-01-15'),
        updatedAt: undefined as unknown as Date,
      };

      const result = mapConversationToSummary(mockConversation);

      const afterCall = new Date();
      const resultDate = new Date(result.updatedAt);

      expect(resultDate.getTime()).toBeGreaterThanOrEqual(beforeCall.getTime());
      expect(resultDate.getTime()).toBeLessThanOrEqual(afterCall.getTime());
    });

    it('should handle string _id (legacy compatibility)', () => {
      const mockConversation: AgentConversationDocument = {
        _id: '507f1f77bcf86cd799439011',
        userId: new Types.ObjectId('507f1f77bcf86cd799439012'),
        title: 'Conversation',
        lastMessagePreview: 'Message',
        messages: [],
        actions: [],
        isActive: true,
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15'),
      };

      const result = mapConversationToSummary(mockConversation);

      expect(result.id).toBe('507f1f77bcf86cd799439011');
    });

    it('should only include summary fields (not full conversation data)', () => {
      const mockConversation: AgentConversationDocument = {
        _id: new Types.ObjectId('507f1f77bcf86cd799439011'),
        userId: new Types.ObjectId('507f1f77bcf86cd799439012'),
        title: 'Full Conversation',
        lastMessagePreview: 'Last message',
        messages: [
          {
            sender: 'user',
            content: 'Hello',
            createdAt: new Date('2024-01-15T10:00:00Z'),
          },
          {
            sender: 'agent',
            content: 'Hi! How can I help?',
            createdAt: new Date('2024-01-15T10:01:00Z'),
          },
        ],
        actions: [
          {
            actionType: AgentActionType.SearchCatalog,
            parameters: { query: 'notebooks' },
            result: { items: [] },
            timestamp: new Date('2024-01-15T10:02:00Z'),
          },
        ],
        isActive: true,
        summary: 'User requested office supplies',
        createdAt: new Date('2024-01-15T10:00:00Z'),
        updatedAt: new Date('2024-01-15T10:05:00Z'),
      };

      const result = mapConversationToSummary(mockConversation);

      // Should only have summary fields
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('title');
      expect(result).toHaveProperty('lastMessagePreview');
      expect(result).toHaveProperty('updatedAt');

      // Should NOT have full conversation data
      expect(result).not.toHaveProperty('userId');
      expect(result).not.toHaveProperty('messages');
      expect(result).not.toHaveProperty('actions');
      expect(result).not.toHaveProperty('isActive');
      expect(result).not.toHaveProperty('summary');
      expect(result).not.toHaveProperty('createdAt');
    });

    it('should handle conversation with long title and preview', () => {
      const longTitle =
        'Very Long Conversation Title About Multiple Office Supply Purchases and Requests';
      const longPreview =
        'This is a very long message preview that contains details about the purchase request including multiple items and quantities';

      const mockConversation: AgentConversationDocument = {
        _id: new Types.ObjectId('507f1f77bcf86cd799439011'),
        userId: new Types.ObjectId('507f1f77bcf86cd799439012'),
        title: longTitle,
        lastMessagePreview: longPreview,
        messages: [],
        actions: [],
        isActive: true,
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15'),
      };

      const result = mapConversationToSummary(mockConversation);

      expect(result.title).toBe(longTitle);
      expect(result.lastMessagePreview).toBe(longPreview);
    });
  });
});
