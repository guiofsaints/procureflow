/**
 * CheckoutConfirmationDialog Component
 *
 * Displays a confirmation dialog before completing checkout.
 * Shows cart summary and allows user to add notes.
 */

'use client';

import { AlertCircle, ShoppingCart } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

import type { AgentCart } from '../types';

interface CheckoutConfirmationDialogProps {
  isOpen: boolean;
  cart: AgentCart;
  onConfirm: (notes?: string) => void;
  onCancel: () => void;
}

export function CheckoutConfirmationDialog({
  isOpen,
  cart,
  onConfirm,
  onCancel,
}: CheckoutConfirmationDialogProps) {
  const [notes, setNotes] = useState('');

  const handleConfirm = () => {
    onConfirm(notes.trim() || undefined);
    setNotes(''); // Reset notes
  };

  const handleCancel = () => {
    onCancel();
    setNotes(''); // Reset notes
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleCancel()}>
      <DialogContent className='max-w-2xl'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <ShoppingCart className='h-5 w-5' />
            Confirm Purchase Request
          </DialogTitle>
          <DialogDescription>
            Review your cart items before submitting the purchase request.
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4'>
          {/* Cart Summary */}
          <div className='rounded-lg border bg-muted/50'>
            <div className='border-b px-4 py-3'>
              <div className='flex items-center justify-between text-sm'>
                <span className='font-medium'>Cart Items</span>
                <span className='text-muted-foreground'>
                  {cart.itemCount} item{cart.itemCount === 1 ? '' : 's'}
                </span>
              </div>
            </div>

            <div className='divide-y'>
              {cart.items.map((item) => (
                <div
                  key={item.itemId}
                  className='flex items-center justify-between px-4 py-3'
                >
                  <div className='flex-1 min-w-0'>
                    <div className='font-medium text-sm truncate'>
                      {item.itemName}
                    </div>
                    <div className='text-xs text-muted-foreground'>
                      ${item.itemPrice.toFixed(2)} × {item.quantity}
                    </div>
                  </div>
                  <div className='ml-4 font-medium text-sm'>
                    ${(item.itemPrice * item.quantity).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>

            <div className='border-t bg-background px-4 py-3'>
              <div className='flex items-center justify-between'>
                <span className='font-semibold'>Total</span>
                <span className='text-lg font-bold'>
                  ${cart.total.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Notes Input */}
          <div className='space-y-2'>
            <Label htmlFor='checkout-notes'>
              Purchase Justification (Optional)
            </Label>
            <Textarea
              id='checkout-notes'
              placeholder='Add any notes or justification for this purchase request...'
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className='resize-none'
            />
            <p className='text-xs text-muted-foreground'>
              These notes will be included in the purchase request for approval.
            </p>
          </div>

          {/* Warning Message */}
          <div className='flex gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950'>
            <AlertCircle className='h-5 w-5 text-amber-600 dark:text-amber-500 shrink-0' />
            <div className='text-sm'>
              <p className='font-medium text-amber-900 dark:text-amber-100'>
                This will create a purchase request
              </p>
              <p className='mt-1 text-amber-800 dark:text-amber-200'>
                Your cart will be cleared and a purchase request will be
                submitted for approval. You can track the status in Purchase
                Requests.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className='gap-2 sm:gap-0'>
          <Button variant='outline' onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleConfirm}>Confirm Purchase Request</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
