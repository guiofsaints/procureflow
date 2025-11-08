/**
 * useAgentConversations Hook
 *
 * React hook for fetching and managing agent conversation history on the client.
 * Uses SWR for data fetching with automatic revalidation.
 */

'use client';

import { useEffect, useState } from 'react';

import type { AgentConversationSummary } from '../types';

interface UseAgentConversationsReturn {
  conversations: AgentConversationSummary[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useAgentConversations(): UseAgentConversationsReturn {
  const [conversations, setConversations] = useState<
    AgentConversationSummary[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchConversations = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/agent/conversations');

      if (!response.ok) {
        throw new Error('Failed to fetch conversations');
      }

      const data = await response.json();

      if (data.success) {
        setConversations(data.data || []);
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (err) {
      console.error('Error fetching conversations:', err);
      setError(
        err instanceof Error ? err : new Error('Failed to fetch conversations')
      );
      setConversations([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  return {
    conversations,
    isLoading,
    error,
    refetch: fetchConversations,
  };
}
