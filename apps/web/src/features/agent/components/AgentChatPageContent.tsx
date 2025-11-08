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
}

export function AgentChatPageContent({
  userName = 'there',
}: AgentChatPageContentProps) {
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

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
      {/* Messages area or Welcome screen - with bottom padding for fixed input */}
      <div className='flex-1 overflow-hidden pb-20'>
        {hasStarted ? (
          <AgentChatMessages messages={messages} />
        ) : (
          <AgentWelcome onPromptClick={handleSendMessage} userName={userName} />
        )}
      </div>

      {/* Input area - now fixed at bottom */}
      <AgentChatInput onSend={handleSendMessage} isLoading={isLoading} />
    </div>
  );
}
