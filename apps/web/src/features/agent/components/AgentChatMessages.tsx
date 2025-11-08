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

import { AgentProductCard } from './AgentProductCard';

interface AgentChatMessagesProps {
  messages: AgentMessage[];
}

export function AgentChatMessages({ messages }: AgentChatMessagesProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
                'flex max-w-[80%] flex-col gap-3',
                message.role === 'user' && 'items-end'
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
                <p className='whitespace-pre-wrap text-sm'>{message.content}</p>
              </div>

              {/* Product cards (if any) */}
              {message.items && message.items.length > 0 && (
                <div className='w-full space-y-3'>
                  {message.items.map((item) => (
                    <AgentProductCard key={item.id} item={item} />
                  ))}
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
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
