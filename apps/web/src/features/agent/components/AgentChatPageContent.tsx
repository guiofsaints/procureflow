/**
 * AgentChatPageContent Component
 *
 * Main chat page component that manages chat state and orchestrates
 * message display and input handling.
 */

'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

import type { AgentMessage } from '../types';

import { AgentChatInput } from './AgentChatInput';
import { AgentChatMessages } from './AgentChatMessages';
import { AgentWelcome } from './AgentWelcome';

interface AgentChatPageContentProps {
  userName?: string;
  conversationId?: string;
}

export function AgentChatPageContent({
  userName = 'there',
  conversationId: initialConversationId,
}: AgentChatPageContentProps) {
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>(
    initialConversationId
  );
  const [isLoadingConversation, setIsLoadingConversation] = useState(false);

  // Load conversation messages from API when conversationId is provided
  const loadConversation = useCallback(async (convId: string) => {
    setIsLoadingConversation(true);

    try {
      const response = await fetch(`/api/agent/conversations/${convId}`);

      if (!response.ok) {
        throw new Error('Failed to load conversation');
      }

      const data = await response.json();

      // Map API messages to AgentMessage format
      const loadedMessages: AgentMessage[] = data.conversation.messages.map(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (msg: any, index: number) => ({
          id: `${msg.sender}-${index}`,
          role: msg.sender === 'user' ? 'user' : 'assistant',
          content: msg.content,
          items: msg.metadata?.items, // Include items from metadata if available
        })
      );

      setMessages(loadedMessages);
      setHasStarted(loadedMessages.length > 0);
    } catch (error) {
      console.error('Error loading conversation:', error);
      toast.error('Failed to load conversation', {
        description: 'Starting a new conversation instead.',
      });
    } finally {
      setIsLoadingConversation(false);
    }
  }, []);

  // Load conversation on mount if conversationId is provided
  useEffect(() => {
    if (initialConversationId) {
      loadConversation(initialConversationId);
    }
  }, [initialConversationId, loadConversation]);

  const handleSendMessage = async (content: string) => {
    // Mark chat as started
    if (!hasStarted) {
      setHasStarted(true);
    }

    // Create user message
    const userMessage: AgentMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content,
    };

    // Add user message to chat optimistically
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Call API to get agent response
      const response = await fetch('/api/agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content,
          conversationId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to get agent response');
      }

      const data = await response.json();

      // Update conversationId if this is a new conversation
      if (data.conversationId && !conversationId) {
        setConversationId(data.conversationId);
      }

      // Get the latest agent message from the response
      const apiMessages = data.messages || [];
      const latestAgentMessage = apiMessages
        .filter((msg: { role: string }) => msg.role === 'agent')
        .pop();

      if (latestAgentMessage) {
        const agentMessage: AgentMessage = {
          id: `agent-${Date.now()}`,
          role: 'assistant',
          content: latestAgentMessage.content,
          items: latestAgentMessage.items, // Include items if present
        };

        setMessages((prev) => [...prev, agentMessage]);
      }
    } catch (error) {
      console.error('Error sending message:', error);

      // Remove optimistic user message and add error message
      setMessages((prev) => {
        const withoutOptimistic = prev.slice(0, -1);
        return [
          ...withoutOptimistic,
          userMessage, // Re-add user message
          {
            id: `error-${Date.now()}`,
            role: 'assistant',
            content:
              'I apologize, but I encountered an error processing your request. Please try again.',
          },
        ];
      });

      toast.error('Failed to send message', {
        description:
          error instanceof Error ? error.message : 'Please try again later.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='flex h-full flex-col'>
      {/* Messages area or Welcome screen - scrollable */}
      <div className='flex-1 overflow-y-auto'>
        {isLoadingConversation ? (
          <div className='flex h-full items-center justify-center'>
            <div className='text-muted-foreground'>Loading conversation...</div>
          </div>
        ) : hasStarted ? (
          <AgentChatMessages messages={messages} />
        ) : (
          <AgentWelcome onPromptClick={handleSendMessage} userName={userName} />
        )}
      </div>

      {/* Input area - sticky at bottom */}
      <div className='shrink-0'>
        <AgentChatInput
          onSend={handleSendMessage}
          isLoading={isLoading || isLoadingConversation}
        />
      </div>
    </div>
  );
}
