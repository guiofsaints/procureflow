/**
 * AgentChatMessages Component
 *
 * Displays the list of chat messages between user and assistant.
 */

'use client';

import { Bot, User } from 'lucide-react';
import { useEffect, useRef } from 'react';

import { cn } from '@/lib/utils';

import type { AgentMessage } from '../types';

import { AgentCartView } from './AgentCartView';
import { AgentProductCarousel } from './AgentProductCarousel';
import { MarkdownText } from './MarkdownText';

interface AgentChatMessagesProps {
  messages: AgentMessage[];
  onSendMessage?: (message: string) => void;
  isLoading?: boolean;
}

export function AgentChatMessages({
  messages,
  onSendMessage,
  isLoading = false,
}: AgentChatMessagesProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive or loading state changes
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  if (messages.length === 0) {
    return (
      <div className='flex h-full items-center justify-center'>
        <div className='text-center'>
          <Bot className='mx-auto h-12 w-12 text-muted-foreground' />
          <p className='mt-4 text-sm text-muted-foreground'>
            Start a conversation with the procurement agent
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className='h-full px-4 py-4'>
      <div className='mx-auto max-w-4xl space-y-4'>
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              'flex gap-3',
              message.role === 'user' ? 'justify-end' : 'justify-start'
            )}
          >
            {message.role === 'assistant' && (
              <div className='flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary'>
                <Bot className='h-5 w-5 text-primary-foreground' />
              </div>
            )}

            <div
              className={cn(
                'flex flex-col gap-3',
                message.role === 'user' ? 'max-w-[80%] items-end' : 'w-full'
              )}
            >
              {/* Message content bubble */}
              <div
                className={cn(
                  'rounded-lg px-4 py-2',
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                {message.role === 'assistant' ? (
                  <MarkdownText
                    content={message.content}
                    className='whitespace-pre-wrap text-sm'
                  />
                ) : (
                  <p className='whitespace-pre-wrap text-sm'>
                    {message.content}
                  </p>
                )}
              </div>

              {/* Product cards (if any) */}
              {message.items && message.items.length > 0 && (
                <div className='w-full'>
                  <AgentProductCarousel items={message.items} />
                </div>
              )}

              {/* Cart view (if any) */}
              {message.cart && (
                <div className='w-full'>
                  <AgentCartView
                    cart={message.cart}
                    onSendMessage={onSendMessage}
                  />
                </div>
              )}
            </div>

            {message.role === 'user' && (
              <div className='flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted'>
                <User className='h-5 w-5 text-muted-foreground' />
              </div>
            )}
          </div>
        ))}

        {/* Loading indicator - "Thinking..." */}
        {isLoading && (
          <div className='flex gap-3 justify-start'>
            <div className='flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary'>
              <Bot className='h-5 w-5 text-primary-foreground' />
            </div>
            <div className='flex flex-col gap-3 w-full'>
              <div className='rounded-lg px-4 py-2 bg-muted text-muted-foreground'>
                <div className='flex items-center gap-2'>
                  <span className='text-sm'>Thinking</span>
                  <span className='flex gap-1'>
                    <span
                      className='animate-bounce'
                      style={{ animationDelay: '0ms' }}
                    >
                      .
                    </span>
                    <span
                      className='animate-bounce'
                      style={{ animationDelay: '150ms' }}
                    >
                      .
                    </span>
                    <span
                      className='animate-bounce'
                      style={{ animationDelay: '300ms' }}
                    >
                      .
                    </span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} className='pb-28' />
      </div>
    </div>
  );
}
