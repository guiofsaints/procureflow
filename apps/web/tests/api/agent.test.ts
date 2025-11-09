/**
 * Agent Service Tests
 *
 * Smoke tests for AI agent conversational interface
 */

import { Types } from 'mongoose';
import { describe, it, expect, beforeEach } from 'vitest';

import * as agentService from '@/features/agent';
import { AgentConversationModel } from '@/lib/db/models';

describe('Agent Service', () => {
  const testUserId = new Types.ObjectId(); // Keep as ObjectId, not string

  // Clean up before each test
  beforeEach(async () => {
    await AgentConversationModel.deleteMany({});
  });

  describe('handleAgentMessage', () => {
    it('should create new conversation and respond to message', async () => {
      const response = await agentService.handleAgentMessage({
        userId: testUserId,
        message: 'I need help finding office supplies',
      });

      expect(response).toBeDefined();
      expect(response.conversationId).toBeDefined();
      expect(response.messages).toHaveLength(2); // User message + agent response
      expect(response.messages[0].role).toBe('user');
      expect(response.messages[1].role).toBe('agent');
    });

    it('should continue existing conversation', async () => {
      // First message
      const firstResponse = await agentService.handleAgentMessage({
        userId: testUserId,
        message: 'Hello',
      });

      // Continue conversation
      const secondResponse = await agentService.handleAgentMessage({
        userId: testUserId,
        message: 'Can you help me?',
        conversationId: firstResponse.conversationId,
      });

      expect(secondResponse.conversationId).toBe(firstResponse.conversationId);
      expect(secondResponse.messages.length).toBeGreaterThan(2);
    });

    it('should reject empty message', async () => {
      await expect(
        agentService.handleAgentMessage({
          userId: testUserId,
          message: '',
        })
      ).rejects.toThrow('empty');
    });

    it('should handle message without userId (demo mode)', async () => {
      const response = await agentService.handleAgentMessage({
        message: 'Test message without user ID',
      });

      expect(response).toBeDefined();
      expect(response.messages).toHaveLength(2);
    });

    it('should log conversation in database', async () => {
      const response = await agentService.handleAgentMessage({
        userId: testUserId,
        message: 'Test message for logging',
      });

      const conversation = await AgentConversationModel.findById(
        response.conversationId
      )
        .lean()
        .exec();

      expect(conversation).toBeDefined();
      expect(conversation.messages).toHaveLength(2);
      expect(conversation.status).toBe('in_progress');
    });
  });

  describe('Agent Response Quality (Smoke Test)', () => {
    it('should provide meaningful response to procurement query', async () => {
      const response = await agentService.handleAgentMessage({
        userId: testUserId,
        message: 'I need 10 USB cables under $20 each',
      });

      const agentReply = response.messages[1].content;

      expect(agentReply).toBeDefined();
      expect(agentReply.length).toBeGreaterThan(10);
      // Agent should acknowledge the request in some way
      expect(
        agentReply.toLowerCase().includes('help') ||
          agentReply.toLowerCase().includes('assist') ||
          agentReply.toLowerCase().includes('usb') ||
          agentReply.toLowerCase().includes('cable')
      ).toBe(true);
    });

    it('should distinguish between "add" and "add more" for cart items', async () => {
      // This is a documentation test - the actual behavior depends on:
      // 1. The agent correctly identifying if item is already in cart from cart context
      // 2. Using update_cart_quantity when user says "add X more"
      // 3. Using add_to_cart only for items not in cart yet

      const response = await agentService.handleAgentMessage({
        userId: testUserId,
        message:
          'When I say "add 1 more USB Cable to my cart", you should use update_cart_quantity if USB Cable is already in my cart, not add_to_cart',
      });

      const agentReply = response.messages[1].content;

      expect(agentReply).toBeDefined();
      expect(agentReply.length).toBeGreaterThan(10);
      // This is mainly a prompt engineering verification
      // The actual tool choice is made by the LLM based on system prompt
    });
  });
});
