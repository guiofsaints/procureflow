/**
 * AgentConversationHistoryList Component
 *
 * Displays agent conversation history in the sidebar.
 * Shows recent conversations with title, preview, and timestamp.
 */

'use client';

import { MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

import { useAgentConversations } from '../hooks/useAgentConversations';

interface AgentConversationHistoryListProps {
  collapsed: boolean;
}

export function AgentConversationHistoryList({
  collapsed,
}: AgentConversationHistoryListProps) {
  const { conversations, isLoading, error } = useAgentConversations();
  const pathname = usePathname();

  // If collapsed, show just an icon
  if (collapsed) {
    return (
      <div className='flex items-center justify-center p-2'>
        <Button variant='ghost' size='icon' title='Conversations'>
          <MessageSquare className='h-5 w-5' />
        </Button>
      </div>
    );
  }

  // If loading, show skeleton
  if (isLoading) {
    return (
      <div className='space-y-2 p-2'>
        <div className='px-2 py-1.5 text-xs font-semibold text-sidebar-foreground/70'>
          Conversations
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className='space-y-2 rounded-lg p-2'>
            <Skeleton className='h-4 w-full' />
            <Skeleton className='h-3 w-3/4' />
          </div>
        ))}
      </div>
    );
  }

  // If error, show minimal message
  if (error) {
    return (
      <div className='p-2'>
        <div className='px-2 py-1.5 text-xs font-semibold text-sidebar-foreground/70'>
          Conversations
        </div>
        <div className='rounded-lg p-3 text-xs text-muted-foreground'>
          Unable to load conversations
        </div>
      </div>
    );
  }

  // If no conversations, show empty state
  if (conversations.length === 0) {
    return (
      <div className='p-2'>
        <div className='px-2 py-1.5 text-xs font-semibold text-sidebar-foreground/70'>
          Conversations
        </div>
        <div className='rounded-lg p-3 text-xs text-muted-foreground'>
          No conversations yet
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-2 p-2'>
      <div className='px-2 py-1.5 text-xs font-semibold text-sidebar-foreground/70'>
        Conversations
      </div>
      <div className='h-[300px] overflow-y-auto'>
        <div className='space-y-1'>
          {conversations.map((conversation) => {
            const isActive = pathname.includes(conversation.id);

            return (
              <Link
                key={conversation.id}
                href={`/agent/${conversation.id}`}
                className={cn(
                  'block rounded-lg p-2 transition-colors hover:bg-sidebar-accent',
                  isActive && 'bg-sidebar-accent'
                )}
              >
                <div className='space-y-1'>
                  <div className='flex items-start justify-between gap-2'>
                    <div className='flex-1 truncate text-sm font-medium text-sidebar-foreground'>
                      {conversation.title}
                    </div>
                    <div className='text-[10px] text-muted-foreground'>
                      {formatRelativeTime(conversation.updatedAt)}
                    </div>
                  </div>
                  <div className='truncate text-xs text-muted-foreground'>
                    {conversation.lastMessagePreview}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/**
 * Format a date as relative time (e.g., "5 min ago", "2 hours ago")
 */
function formatRelativeTime(isoDate: string): string {
  const date = new Date(isoDate);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) {
    return 'now';
  }
  if (diffMins < 60) {
    return `${diffMins}m ago`;
  }

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) {
    return `${diffDays}d ago`;
  }

  // Format as date for older conversations
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
