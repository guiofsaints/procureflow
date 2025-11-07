'use client';

import { Bot, User } from 'lucide-react';

import { AgentMessageRole } from '@/domain/entities';
import { cn } from '@/lib/utils';

interface MessageBubbleProps {
  message: string;
  role: AgentMessageRole;
  timestamp: Date;
}

/**
 * MessageBubble - Presentational component for chat messages
 * Displays different styling based on message role (user vs assistant vs system)
 */
export function MessageBubble({
  message,
  role,
  timestamp,
}: MessageBubbleProps) {
  const isUser = role === AgentMessageRole.User;
  const isSystem = role === AgentMessageRole.System;

  const formattedTime = timestamp.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  if (isSystem) {
    return (
      <div className='flex justify-center my-4'>
        <div className='bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-4 py-2 rounded-lg text-sm text-center max-w-2xl'>
          {message}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('flex gap-3 mb-4', isUser && 'flex-row-reverse')}>
      {/* Avatar */}
      <div
        className={cn(
          'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
          isUser
            ? 'bg-blue-600 text-white'
            : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
        )}
      >
        {isUser ? <User className='h-5 w-5' /> : <Bot className='h-5 w-5' />}
      </div>

      {/* Message Content */}
      <div
        className={cn('flex-1 max-w-2xl', isUser && 'flex flex-col items-end')}
      >
        <div
          className={cn(
            'rounded-lg px-4 py-2',
            isUser
              ? 'bg-blue-600 text-white'
              : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700'
          )}
        >
          <p className='text-sm whitespace-pre-wrap'>{message}</p>
        </div>
        <span className='text-xs text-gray-500 dark:text-gray-400 mt-1'>
          {formattedTime}
        </span>
      </div>
    </div>
  );
}
