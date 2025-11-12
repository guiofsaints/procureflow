/**
 * AgentChatMessages Component
 *
 * Displays the list of chat messages between user and assistant.
 */

'use client';

import { Bot, User } from 'lucide-react';
import { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { cn } from '@/lib/utils';

import type { AgentMessage } from '../types';

import { AgentCartView } from './AgentCartView';
import { AgentProductCarousel } from './AgentProductCarousel';
import { AgentPurchaseRequestCard } from './AgentPurchaseRequestCard';

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
    <div className='h-full px-3 py-4 sm:px-4'>
      <div className='mx-auto max-w-4xl space-y-6'>
        {messages.map((message) => {
          const isUser = message.role === 'user';

          return (
            <div
              key={message.id}
              className={cn(
                'flex gap-2 sm:gap-3',
                isUser && 'flex-row-reverse'
              )}
            >
              {/* Avatar */}
              <div
                className={cn(
                  'shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center',
                  isUser
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-black text-white'
                )}
              >
                {isUser ? (
                  <User className='h-4 w-4 sm:h-5 sm:w-5' />
                ) : (
                  <Bot className='h-4 w-4 sm:h-5 sm:w-5' />
                )}
              </div>

              {/* Message Content */}
              <div
                className={cn(
                  'flex-1 min-w-0 max-w-[calc(100%-2.5rem)] sm:max-w-2xl md:max-w-3xl',
                  isUser && 'flex flex-col items-end'
                )}
              >
                {/* Sender Label */}
                <div
                  className={cn(
                    'flex items-center gap-2 mb-1',
                    isUser && 'flex-row-reverse'
                  )}
                >
                  <span className='text-xs font-semibold text-foreground'>
                    {isUser ? '' : 'Assistent'}
                  </span>
                </div>

                {/* Message Bubble */}
                <div
                  className={cn(
                    'rounded-lg px-3 py-2 sm:px-4 sm:py-3 shadow-sm wrap-break-word',
                    isUser
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-card text-card-foreground border border-border'
                  )}
                >
                  {isUser ? (
                    <p className='text-sm whitespace-pre-wrap'>
                      {message.content}
                    </p>
                  ) : (
                    <div className='prose prose-sm dark:prose-invert max-w-none prose-p:my-2 prose-headings:my-3 prose-ul:my-2 prose-li:my-1'>
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          // Custom paragraph styling
                          p: ({ children }) => (
                            <p className='text-sm leading-relaxed mb-2 last:mb-0'>
                              {children}
                            </p>
                          ),
                          // Custom heading styling
                          h1: ({ children }) => (
                            <h1 className='text-lg font-semibold mt-4 mb-2 first:mt-0'>
                              {children}
                            </h1>
                          ),
                          h2: ({ children }) => (
                            <h2 className='text-base font-semibold mt-3 mb-2 first:mt-0'>
                              {children}
                            </h2>
                          ),
                          h3: ({ children }) => (
                            <h3 className='text-sm font-semibold mt-2 mb-1.5 first:mt-0'>
                              {children}
                            </h3>
                          ),
                          // Custom list styling
                          ul: ({ children }) => (
                            <ul className='list-disc list-outside ml-4 space-y-1 my-2'>
                              {children}
                            </ul>
                          ),
                          ol: ({ children }) => (
                            <ol className='list-decimal list-outside ml-4 space-y-1 my-2'>
                              {children}
                            </ol>
                          ),
                          li: ({ children }) => (
                            <li className='text-sm leading-relaxed pl-1'>
                              {children}
                            </li>
                          ),
                          // Custom code styling
                          code: ({ className, children }) => {
                            const isInline = !className;
                            return isInline ? (
                              <code className='bg-muted px-1.5 py-0.5 rounded text-xs font-mono border border-border'>
                                {children}
                              </code>
                            ) : (
                              <code className={className}>{children}</code>
                            );
                          },
                          // Custom table styling
                          table: ({ children }) => (
                            <div className='overflow-x-auto my-3 rounded-md'>
                              <table className='min-w-full border-collapse'>
                                {children}
                              </table>
                            </div>
                          ),
                          thead: ({ children }) => (
                            <thead className='bg-muted/50'>{children}</thead>
                          ),
                          th: ({ children }) => (
                            <th className='border-b border-border px-4 py-2 text-left text-xs font-semibold'>
                              {children}
                            </th>
                          ),
                          tr: ({ children }) => (
                            <tr className='border-b border-border last:border-0'>
                              {children}
                            </tr>
                          ),
                          td: ({ children }) => (
                            <td className='px-4 py-2 text-sm'>{children}</td>
                          ),
                          // Custom blockquote styling
                          blockquote: ({ children }) => (
                            <blockquote className='border-l-4 border-primary/50 pl-4 italic text-muted-foreground my-3 py-1'>
                              {children}
                            </blockquote>
                          ),
                          // Custom link styling
                          a: ({ href, children }) => (
                            <a
                              href={href}
                              className='text-primary underline underline-offset-2 hover:opacity-80 font-medium'
                              target='_blank'
                              rel='noopener noreferrer'
                            >
                              {children}
                            </a>
                          ),
                          // Custom strong/bold styling
                          strong: ({ children }) => (
                            <strong className='font-semibold text-foreground'>
                              {children}
                            </strong>
                          ),
                          // Custom em/italic styling
                          em: ({ children }) => (
                            <em className='italic text-foreground/90'>
                              {children}
                            </em>
                          ),
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>

                {/* Product cards (if any) */}
                {message.items && message.items.length > 0 && (
                  <div className='w-full mt-3'>
                    <AgentProductCarousel items={message.items} />
                  </div>
                )}

                {/* Cart view (if any) */}
                {message.cart && (
                  <div className='w-full mt-3'>
                    <AgentCartView
                      cart={message.cart}
                      onSendMessage={onSendMessage}
                    />
                  </div>
                )}

                {/* Purchase Request (if any) */}
                {message.purchaseRequest && (
                  <div className='w-full mt-3'>
                    <AgentPurchaseRequestCard
                      purchaseRequest={message.purchaseRequest}
                    />
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Loading indicator - "Thinking..." */}
        {isLoading && (
          <div className='flex gap-3'>
            <div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-black text-white'>
              <Bot className='h-5 w-5' />
            </div>
            <div className='flex-1'>
              <div className='flex items-center gap-2 mb-1'>
                <span className='text-xs font-semibold text-foreground'>
                  Assistent
                </span>
              </div>
              <div className='rounded-lg px-4 py-3 bg-card border border-border shadow-sm'>
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
