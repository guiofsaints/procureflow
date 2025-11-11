/**
 * AgentCartView Component
 *
 * Displays the shopping cart with ability to modify quantities and remove items.
 */

'use client';

import { CreditCard, Minus, Plus, ShoppingCart, Trash2 } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

import type { AgentCart } from '../types';

import { CheckoutConfirmationDialog } from './CheckoutConfirmationDialog';

interface AgentCartViewProps {
  cart: AgentCart;
  onSendMessage?: (message: string) => void;
}

export function AgentCartView({ cart, onSendMessage }: AgentCartViewProps) {
  const [loadingItems, setLoadingItems] = useState<Set<string>>(new Set());
  const [showCheckoutDialog, setShowCheckoutDialog] = useState(false);

  const handleUpdateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      // If quantity is 0, remove the item
      handleRemoveItem(itemId);
      return;
    }

    // Find current item
    const currentItem = cart.items.find((item) => item.itemId === itemId);
    if (!currentItem) {
      return;
    }

    setLoadingItems((prev) => new Set(prev).add(itemId));

    const difference = newQuantity - currentItem.quantity;

    if (difference > 0) {
      // Send message to add more items
      const message = `Add ${difference} more ${currentItem.itemName} to my cart`;
      onSendMessage?.(message);
    } else {
      // Send message to decrease quantity
      const decreaseAmount = Math.abs(difference);
      const message = `Remove ${decreaseAmount} ${currentItem.itemName} from my cart`;
      onSendMessage?.(message);
    }

    // Clear loading state after a delay
    setTimeout(() => {
      setLoadingItems((prev) => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }, 500);
  };

  const handleRemoveItem = (itemId: string) => {
    const item = cart.items.find((i) => i.itemId === itemId);
    if (!item) {
      return;
    }

    setLoadingItems((prev) => new Set(prev).add(itemId));

    // Send message to remove item completely
    const message = `Remove all ${item.itemName} from my cart`;
    onSendMessage?.(message);

    // Clear loading state after a delay
    setTimeout(() => {
      setLoadingItems((prev) => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }, 500);
  };

  const handleCheckout = (notes?: string) => {
    setShowCheckoutDialog(false);

    // Send checkout message with notes
    const message = notes
      ? `Complete the checkout with notes: ${notes}`
      : 'Complete the checkout';

    onSendMessage?.(message);
  };

  if (cart.items.length === 0) {
    return (
      <Card className='p-6'>
        <div className='flex flex-col items-center justify-center gap-3 text-center'>
          <ShoppingCart className='h-12 w-12 text-muted-foreground' />
          <div>
            <p className='font-medium'>Your cart is empty</p>
            <p className='text-sm text-muted-foreground'>
              Search for products to add to your cart
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className='overflow-hidden'>
      {/* Cart Header */}
      <div className='border-b bg-muted/50 px-4 py-3'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <ShoppingCart className='h-5 w-5' />
            <h3 className='font-semibold'>Shopping Cart</h3>
          </div>
          <div className='text-sm text-muted-foreground'>
            {cart.itemCount} {cart.itemCount === 1 ? 'item' : 'items'}
          </div>
        </div>
      </div>

      {/* Cart Items */}
      <div className='divide-y'>
        {cart.items.map((item) => {
          const isLoading = loadingItems.has(item.itemId);

          return (
            <div
              key={item.itemId}
              className='flex items-center gap-4 p-4 transition-opacity'
              style={{ opacity: isLoading ? 0.5 : 1 }}
            >
              {/* Item Info */}
              <div className='min-w-0 flex-1'>
                <h4 className='truncate font-medium'>{item.itemName}</h4>
                <p className='text-sm text-muted-foreground'>
                  ${item.itemPrice.toFixed(2)} each
                </p>
              </div>

              {/* Quantity Controls */}
              <div className='flex items-center gap-2'>
                <Button
                  variant='outline'
                  size='icon'
                  className='h-8 w-8'
                  onClick={() =>
                    handleUpdateQuantity(item.itemId, item.quantity - 1)
                  }
                  disabled={isLoading}
                >
                  <Minus className='h-4 w-4' />
                </Button>

                <div className='w-12 text-center font-medium'>
                  {item.quantity}
                </div>

                <Button
                  variant='outline'
                  size='icon'
                  className='h-8 w-8'
                  onClick={() =>
                    handleUpdateQuantity(item.itemId, item.quantity + 1)
                  }
                  disabled={isLoading}
                >
                  <Plus className='h-4 w-4' />
                </Button>
              </div>

              {/* Subtotal */}
              <div className='w-24 text-right font-medium'>
                ${(item.itemPrice * item.quantity).toFixed(2)}
              </div>

              {/* Remove Button */}
              <Button
                variant='ghost'
                size='icon'
                className='h-8 w-8 text-destructive'
                onClick={() => handleRemoveItem(item.itemId)}
                disabled={isLoading}
              >
                <Trash2 className='h-4 w-4' />
              </Button>
            </div>
          );
        })}
      </div>

      {/* Cart Footer */}
      <div className='border-t bg-muted/50 px-4 py-4 space-y-3'>
        <div className='flex items-center justify-between'>
          <span className='font-semibold'>Total:</span>
          <span className='text-lg font-bold'>
            ${cart.totalCost.toFixed(2)}
          </span>
        </div>

        <Button
          className='w-full'
          size='lg'
          onClick={() => setShowCheckoutDialog(true)}
        >
          <CreditCard className='mr-2 h-5 w-5' />
          Proceed to Checkout
        </Button>
      </div>

      {/* Checkout Confirmation Dialog */}
      <CheckoutConfirmationDialog
        isOpen={showCheckoutDialog}
        cart={cart}
        onConfirm={handleCheckout}
        onCancel={() => setShowCheckoutDialog(false)}
      />
    </Card>
  );
}
