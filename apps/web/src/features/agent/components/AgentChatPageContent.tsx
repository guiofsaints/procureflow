/**
 * AgentChatPageContent Component
 *
 * Main chat page component that manages chat state and orchestrates
 * message display and input handling.
 */

'use client';

import { useState } from 'react';

import { generateMockAgentResponse } from '../mocks/mockAgent';
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
  conversationId: _conversationId,
}: AgentChatPageContentProps) {
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  // TODO: Load conversation messages from API when conversationId is provided
  // This will be implemented in a follow-up when the full message loading is needed
  // For now, we just accept the conversationId to enable navigation

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

    // Add user message to chat
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Generate mock agent response
      const agentResponse = await generateMockAgentResponse(content);

      // Add agent response to chat
      setMessages((prev) => [...prev, agentResponse]);
    } catch (error) {
      console.error('Error generating agent response:', error);

      // Add error message
      const errorMessage: AgentMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content:
          'I apologize, but I encountered an error processing your request. Please try again.',
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='flex h-full flex-col'>
      {/* Messages area or Welcome screen - scrollable */}
      <div className='flex-1 overflow-y-auto'>
        {hasStarted ? (
          <AgentChatMessages messages={messages} />
        ) : (
          <AgentWelcome onPromptClick={handleSendMessage} userName={userName} />
        )}
      </div>

      {/* Input area - sticky at bottom */}
      <div className='shrink-0'>
        <AgentChatInput onSend={handleSendMessage} isLoading={isLoading} />
      </div>
    </div>
  );
}
