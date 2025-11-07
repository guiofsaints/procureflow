/**
 * Agent Service Tests
 *
 * Smoke tests for AI agent conversational interface
 */

import { Types } from 'mongoose';
import { describe, it, expect, beforeEach } from 'vitest';

import { AgentConversationModel } from '@/lib/db/models';
import * as agentService from '@/server/agent.service';

describe('Agent Service', () => {
  const testUserId = new Types.ObjectId().toString();

  // Clean up before each test
  beforeEach(async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (AgentConversationModel as any).deleteMany({});
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

      expect(secondResponse.conversationId).toBe(
        firstResponse.conversationId
      );
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

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const conversation = await (AgentConversationModel as any)
        .findById(response.conversationId)
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
  });
});
