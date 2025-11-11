/**
 * AgentCheckoutPrompt Component
 *
 * Displays when agent suggests checkout with interactive confirmation button.
 * Integrates with AgentCheckoutButton for hold-to-confirm functionality.
 */

'use client';

import { ShoppingCart } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

import { AgentCheckoutButton } from './AgentCheckoutButton';

// Re-export the CheckoutResult type from AgentCheckoutButton
type CheckoutResult = {
  id: string;
  items: Array<{
    itemName: string;
    itemCategory: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
  }>;
  total: number;
  status: string;
};

interface AgentCheckoutPromptProps {
  message: string;
  cartItemCount?: number;
  cartTotal?: number;
  onCheckout: () => Promise<CheckoutResult>;
}

export function AgentCheckoutPrompt({
  message,
  cartItemCount = 0,
  cartTotal = 0,
  onCheckout,
}: AgentCheckoutPromptProps) {
  return (
    <div className='space-y-4'>
      {/* Agent message */}
      <Alert>
        <ShoppingCart className='h-4 w-4' />
        <AlertTitle>Ready to Checkout?</AlertTitle>
        <AlertDescription>{message}</AlertDescription>
      </Alert>

      {/* Cart summary */}
      {cartItemCount > 0 && (
        <div className='rounded-lg border bg-muted/50 p-4'>
          <div className='flex items-center justify-between text-sm'>
            <div>
              <span className='text-muted-foreground'>Cart Summary: </span>
              <span className='font-medium'>
                {cartItemCount} item{cartItemCount === 1 ? '' : 's'}
              </span>
            </div>
            <div className='text-lg font-bold'>${cartTotal.toFixed(2)}</div>
          </div>
        </div>
      )}

      {/* Checkout button */}
      <div className='flex justify-center pt-2'>
        <AgentCheckoutButton onCheckout={onCheckout} />
      </div>

      {/* Instructions */}
      <p className='text-center text-xs text-muted-foreground'>
        Hold the button for 2 seconds to confirm your purchase request
      </p>
    </div>
  );
}
