/**
 * AgentCheckoutButton Component
 *
 * Interactive checkout button with long-press confirmation.
 * Shows progress while holding and displays success modal after checkout.
 */

'use client';

import { Check, ExternalLink, Package } from 'lucide-react';
import Link from 'next/link';
import { useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface CheckoutResult {
  id: string;
  items: Array<{
    itemName: string;
    itemCategory: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
  }>;
  totalCost: number;
  status: string;
}

interface AgentCheckoutButtonProps {
  onCheckout: () => Promise<CheckoutResult>;
  disabled?: boolean;
}

export function AgentCheckoutButton({
  onCheckout,
  disabled = false,
}: AgentCheckoutButtonProps) {
  const [isPressed, setIsPressed] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [checkoutResult, setCheckoutResult] = useState<CheckoutResult | null>(
    null
  );
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const pressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const HOLD_DURATION = 2000; // 2 seconds to confirm
  const PROGRESS_INTERVAL = 20; // Update every 20ms

  const startPress = () => {
    if (disabled || isProcessing) {
      return;
    }

    setIsPressed(true);
    setProgress(0);

    // Progress animation
    progressIntervalRef.current = setInterval(() => {
      setProgress((prev) => {
        const increment = (PROGRESS_INTERVAL / HOLD_DURATION) * 100;
        return Math.min(prev + increment, 100);
      });
    }, PROGRESS_INTERVAL);

    // Trigger checkout after hold duration
    pressTimerRef.current = setTimeout(async () => {
      await handleCheckout();
    }, HOLD_DURATION);
  };

  const cancelPress = () => {
    setIsPressed(false);
    setProgress(0);

    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }

    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  };

  const handleCheckout = async () => {
    try {
      setIsProcessing(true);
      cancelPress();

      const result = await onCheckout();
      setCheckoutResult(result);
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Checkout failed:', error);
      // Error handling is done by parent component
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCloseModal = () => {
    setShowSuccessModal(false);
    setCheckoutResult(null);
  };

  return (
    <>
      {/* Hold-to-Confirm Button */}
      <div className='relative inline-block'>
        <Button
          size='lg'
          className='relative overflow-hidden min-w-[200px]'
          disabled={disabled || isProcessing}
          onMouseDown={startPress}
          onMouseUp={cancelPress}
          onMouseLeave={cancelPress}
          onTouchStart={startPress}
          onTouchEnd={cancelPress}
          onTouchCancel={cancelPress}
        >
          {/* Progress bar background */}
          <div
            className='absolute inset-0 bg-primary-foreground/20 transition-all duration-75 ease-linear'
            style={{
              width: `${progress}%`,
            }}
          />

          {/* Button content */}
          <span className='relative z-10 flex items-center gap-2'>
            {isProcessing ? (
              <>
                <div className='h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent' />
                Processing...
              </>
            ) : isPressed ? (
              <>
                <Package className='h-4 w-4' />
                Hold to Confirm...
              </>
            ) : (
              <>
                <Package className='h-4 w-4' />
                Press to Checkout
              </>
            )}
          </span>
        </Button>

        {/* Progress indicator */}
        {isPressed && !isProcessing && (
          <div className='absolute -bottom-1 left-0 right-0 h-1 bg-muted rounded-full overflow-hidden'>
            <div
              className='h-full bg-primary transition-all duration-75 ease-linear'
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>

      {/* Success Modal */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className='w-[calc(100vw-1.5rem)] max-w-2xl sm:w-full'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2 text-green-600'>
              <div className='flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900'>
                <Check className='h-6 w-6' />
              </div>
              Checkout Successful!
            </DialogTitle>
            <DialogDescription>
              Your purchase request has been created and submitted for approval.
            </DialogDescription>
          </DialogHeader>

          {checkoutResult && (
            <div className='space-y-4'>
              {/* Request Info */}
              <div className='rounded-lg border bg-muted/50 p-4'>
                <div className='space-y-2 text-sm'>
                  <div className='flex justify-between'>
                    <span className='text-muted-foreground'>Request ID:</span>
                    <span className='font-mono font-medium'>
                      {checkoutResult.id}
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-muted-foreground'>Status:</span>
                    <span className='font-medium capitalize'>
                      {checkoutResult.status}
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-muted-foreground'>Total Items:</span>
                    <span className='font-medium'>
                      {checkoutResult.items.length} type(s)
                    </span>
                  </div>
                </div>
              </div>

              {/* Items List */}
              <div className='rounded-lg border'>
                <div className='border-b bg-muted/30 px-4 py-2'>
                  <h4 className='font-semibold text-sm'>Order Items</h4>
                </div>
                <div className='divide-y max-h-[300px] overflow-y-auto'>
                  {checkoutResult.items.map((item, idx) => (
                    <div
                      key={idx}
                      className='flex items-center justify-between px-4 py-3'
                    >
                      <div className='flex-1 min-w-0 space-y-1'>
                        <div className='font-medium text-sm truncate'>
                          {item.itemName}
                        </div>
                        <div className='text-xs text-muted-foreground'>
                          {item.itemCategory} • Qty: {item.quantity} × $
                          {item.unitPrice.toFixed(2)}
                        </div>
                      </div>
                      <div className='ml-4 font-semibold text-sm'>
                        ${item.subtotal.toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
                <div className='border-t bg-muted/30 px-4 py-3'>
                  <div className='flex items-center justify-between'>
                    <span className='font-semibold'>Total</span>
                    <span className='text-lg font-bold'>
                      ${checkoutResult.totalCost.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className='gap-2 sm:gap-0'>
            <Button variant='outline' onClick={handleCloseModal}>
              Close
            </Button>
            {checkoutResult && (
              <Button asChild>
                <Link href={`/purchase/${checkoutResult.id}`}>
                  <ExternalLink className='mr-2 h-4 w-4' />
                  View Request Details
                </Link>
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
