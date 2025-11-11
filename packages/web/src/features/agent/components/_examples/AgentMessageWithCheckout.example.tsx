/**
 * Example: Integration with Agent Chat Messages
 *
 * This shows how to integrate the checkout button into agent messages
 */

'use client';

import { AgentCheckoutPrompt } from '@/features/agent';

interface AgentMessageWithCheckoutProps {
  message: {
    id: string;
    content: string;
    role: 'user' | 'assistant';
    metadata?: {
      cart?: {
        items: Array<{
          itemName: string;
          quantity: number;
          itemPrice: number;
        }>;
        total: number;
      };
      suggestCheckout?: boolean;
    };
  };
  conversationId: string;
}

export function AgentMessageWithCheckoutExample({
  message,
  conversationId,
}: AgentMessageWithCheckoutProps) {
  // Only show checkout for assistant messages that suggest it
  const shouldShowCheckout =
    message.role === 'assistant' &&
    message.metadata?.suggestCheckout &&
    message.metadata?.cart &&
    message.metadata.cart.items.length > 0;

  const handleCheckout = async () => {
    try {
      const response = await fetch('/api/agent/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          notes: 'Purchase request via AI agent',
        }),
      });

      if (!response.ok) {
        throw new Error('Checkout failed');
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Checkout error:', error);
      throw error;
    }
  };

  return (
    <div className='space-y-4'>
      {/* Regular message content */}
      <div className='prose prose-sm dark:prose-invert max-w-none'>
        <p>{message.content}</p>
      </div>

      {/* Checkout UI (conditionally rendered) */}
      {shouldShowCheckout && message.metadata?.cart && (
        <AgentCheckoutPrompt
          message='Your items are ready. Submit a purchase request?'
          cartItemCount={message.metadata.cart.items.length}
          cartTotal={message.metadata.cart.total}
          onCheckout={handleCheckout}
        />
      )}
    </div>
  );
}
