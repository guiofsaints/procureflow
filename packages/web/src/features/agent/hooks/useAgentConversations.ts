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
        // Handle 401 Unauthorized - session expired or invalid
        if (response.status === 401) {
          setConversations([]);
          setIsLoading(false);
          return; // Don't throw error, just clear conversations
        }

        // Try to get error details from response for other errors
        const errorData = await response.json().catch(() => ({}));
        const errorMessage =
          errorData.error ||
          `Failed to fetch conversations (${response.status})`;
        throw new Error(errorMessage);
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

    // Listen for conversation updates
    const handleConversationUpdate = () => {
      fetchConversations();
    };

    window.addEventListener('conversationUpdated', handleConversationUpdate);

    return () => {
      window.removeEventListener(
        'conversationUpdated',
        handleConversationUpdate
      );
    };
  }, []);

  return {
    conversations,
    isLoading,
    error,
    refetch: fetchConversations,
  };
}
