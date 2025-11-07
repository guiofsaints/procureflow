'use client';

import { MessageSquare, Send } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { Button } from '@/components';
import type { AgentMessage } from '@/domain/entities';
import { AgentMessageRole } from '@/domain/entities';
import { cn } from '@/lib/utils';

import { mockMessages } from '../mock';

import { MessageBubble } from './MessageBubble';

/**
 * AgentChatPageContent - Client component for AI agent chat UI
 * Features:
 * - Display conversation history
 * - Send messages
 * - Mock agent responses
 * - Auto-scroll to latest message
 */
export function AgentChatPageContent() {
  const [messages, setMessages] = useState<AgentMessage[]>(mockMessages);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!inputValue.trim()) {
      return;
    }

    const userMessage: AgentMessage = {
      role: AgentMessageRole.User,
      content: inputValue.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Mock agent response after a delay
    setTimeout(() => {
      const agentResponse: AgentMessage = {
        role: AgentMessageRole.Assistant,
        content: `I understand you said: "${userMessage.content}". This is a mock response. In a production environment, this would be powered by AI to help with procurement tasks like searching the catalog, adding items to cart, or providing recommendations.`,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, agentResponse]);
      setIsTyping(false);
    }, 1500);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e as unknown as React.FormEvent);
    }
  };

  return (
    <div className='h-[calc(100vh-8rem)] flex flex-col'>
      {/* Header */}
      <div className='mb-4'>
        <h1 className='text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3'>
          <MessageSquare className='h-8 w-8' />
          AI Procurement Assistant
        </h1>
        <p className='mt-2 text-gray-600 dark:text-gray-400'>
          Ask questions, search the catalog, or get help with your procurement
          needs
        </p>
      </div>

      {/* Chat Container */}
      <div className='flex-1 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden'>
        {/* Messages Area */}
        <div className='flex-1 overflow-y-auto p-6 space-y-4'>
          {messages.map((msg, index) => (
            <MessageBubble
              key={index}
              message={msg.content}
              role={msg.role}
              timestamp={msg.timestamp}
            />
          ))}

          {/* Typing Indicator */}
          {isTyping && (
            <div className='flex gap-3 mb-4'>
              <div className='flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center'>
                <MessageSquare className='h-5 w-5 text-gray-600 dark:text-gray-400' />
              </div>
              <div className='flex-1 max-w-2xl'>
                <div className='bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2'>
                  <div className='flex gap-1'>
                    <span
                      className='w-2 h-2 bg-gray-400 rounded-full animate-bounce'
                      style={{ animationDelay: '0ms' }}
                    />
                    <span
                      className='w-2 h-2 bg-gray-400 rounded-full animate-bounce'
                      style={{ animationDelay: '150ms' }}
                    />
                    <span
                      className='w-2 h-2 bg-gray-400 rounded-full animate-bounce'
                      style={{ animationDelay: '300ms' }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className='border-t border-gray-200 dark:border-gray-700 p-4'>
          <form onSubmit={handleSendMessage} className='flex gap-2'>
            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder='Type your message... (Press Enter to send, Shift+Enter for new line)'
              rows={1}
              className={cn(
                'flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700',
                'rounded-lg bg-white dark:bg-gray-900',
                'text-gray-900 dark:text-white placeholder-gray-400',
                'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                'resize-none max-h-32'
              )}
              disabled={isTyping}
            />
            <Button
              type='submit'
              variant='primary'
              disabled={!inputValue.trim() || isTyping}
              className='flex items-center gap-2 px-4'
            >
              <Send className='h-4 w-4' />
              Send
            </Button>
          </form>
          <p className='text-xs text-gray-500 dark:text-gray-400 mt-2'>
            Mock AI responses • No real AI integration yet
          </p>
        </div>
      </div>
    </div>
  );
}
