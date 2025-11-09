/**
 * AgentChatPageContent Component
 *
 * Main chat page component that manages chat state and orchestrates
 * message display and input handling.
 */

'use client';

import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Skeleton } from '@/components/ui/skeleton';
import { useBreadcrumb } from '@/contexts/BreadcrumbContext';

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
  const [conversationTitle, setConversationTitle] = useState<string>('');

  const { setDynamicLabel, clearDynamicLabel } = useBreadcrumb();
  const pathname = usePathname();

  // Reset state when conversationId changes (including when it becomes undefined)
  useEffect(() => {
    // If initialConversationId changes, reset the component state
    setConversationId(initialConversationId);

    // If no conversationId (new conversation), reset all state
    if (!initialConversationId) {
      setMessages([]);
      setHasStarted(false);
      setIsLoading(false);
      setConversationTitle('');
      setIsLoadingConversation(false);
    }
  }, [initialConversationId]);

  // Set loading placeholder in breadcrumb immediately when loading conversation
  useEffect(() => {
    if (initialConversationId && pathname) {
      // Set loading placeholder immediately
      setDynamicLabel(pathname, '...');
    }
  }, [initialConversationId, pathname, setDynamicLabel]);

  // Load conversation messages from API when conversationId is provided
  const loadConversation = useCallback(async (convId: string) => {
    setIsLoadingConversation(true);

    try {
      const response = await fetch(`/api/agent/conversations/${convId}`);

      if (!response.ok) {
        throw new Error('Failed to load conversation');
      }

      const data = await response.json();

      // Set conversation title from response
      if (data.conversation?.title) {
        setConversationTitle(data.conversation.title);
      }

      // Map API messages to AgentMessage format
      const loadedMessages: AgentMessage[] = data.conversation.messages.map(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (msg: any, index: number) => ({
          id: `${msg.role}-${index}`,
          role: msg.role,
          content: msg.content,
          items: msg.items, // Include items if available
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

  // Update breadcrumb when conversation title changes
  useEffect(() => {
    if (conversationTitle && pathname) {
      setDynamicLabel(pathname, conversationTitle);
    }

    return () => {
      if (pathname) {
        clearDynamicLabel(pathname);
      }
    };
  }, [conversationTitle, pathname, setDynamicLabel, clearDynamicLabel]);

  // Load conversation on mount if conversationId is provided
  useEffect(() => {
    if (initialConversationId) {
      loadConversation(initialConversationId);
    }
  }, [initialConversationId, loadConversation]);

  // Trigger custom event when conversation is updated (for sidebar refresh)
  const triggerConversationUpdate = useCallback(() => {
    window.dispatchEvent(new CustomEvent('conversationUpdated'));
  }, []);

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

        // Update URL without reload for new conversations
        window.history.replaceState(null, '', `/agent/${data.conversationId}`);
      }

      // Trigger sidebar update
      triggerConversationUpdate();

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
          cart: latestAgentMessage.cart, // Include cart if present
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
          <div className='mx-auto flex h-full max-w-4xl flex-col gap-6 p-6'>
            {/* Skeleton for loading messages */}
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className={`flex gap-3 ${i % 2 === 0 ? 'flex-row-reverse' : ''}`}
              >
                <Skeleton className='h-10 w-10 shrink-0 rounded-full' />
                <div className='flex max-w-[80%] flex-col gap-2'>
                  <Skeleton className='h-5 w-32' />
                  <Skeleton
                    className={`h-20 w-full ${i === 2 ? 'w-4/5' : ''}`}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : hasStarted ? (
          <AgentChatMessages
            messages={messages}
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
          />
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
