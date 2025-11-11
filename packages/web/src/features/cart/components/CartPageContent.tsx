'use client';

import { Loader2, Minus, Plus, ShoppingCart, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

import {
  Button,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components';
import { useCart } from '@/contexts/CartContext';
import type { CartItem } from '@/domain/entities';
import { cn } from '@/lib/utils';

/**
 * CartPageContent - Client component for cart UI
 * Features:
 * - Load cart from API on mount
 * - Display cart items with quantity controls
 * - Update quantities via API
 * - Remove items via API
 * - Calculate total
 * - Checkout via API (creates purchase request)
 */
export function CartPageContent() {
  const router = useRouter();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const { setItemCount } = useCart();

  // Load cart from API
  const loadCart = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/cart');

      if (!response.ok) {
        throw new Error(`Failed to fetch cart: ${response.statusText}`);
      }

      const data = await response.json();
      const items = data.cart?.items || [];
      setCartItems(items);
      setItemCount(items.length);
    } catch (error) {
      console.error('Error loading cart:', error);
      toast.error('Failed to load cart', {
        description:
          error instanceof Error
            ? error.message
            : 'Please try refreshing the page',
      });
      setCartItems([]);
    } finally {
      setIsLoading(false);
    }
  }, [setItemCount]);

  // Load cart on mount
  useEffect(() => {
    loadCart();
  }, [loadCart]);

  const handleQuantityChange = async (itemId: string, delta: number) => {
    const currentItem = cartItems.find((item) => item.itemId === itemId);
    if (!currentItem) {
      return;
    }

    const newQuantity = Math.max(
      1,
      Math.min(999, currentItem.quantity + delta)
    );

    // Optimistic update
    setCartItems((items) =>
      items.map((item) => {
        if (item.itemId === itemId) {
          return {
            ...item,
            quantity: newQuantity,
            subtotal: item.unitPrice * newQuantity,
          };
        }
        return item;
      })
    );

    try {
      const response = await fetch(`/api/cart/items/${itemId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ quantity: newQuantity }),
      });

      if (!response.ok) {
        // Try to get error details from response
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.message || response.statusText;
        throw new Error(`Failed to update quantity: ${errorMessage}`);
      }

      // Reload cart to ensure consistency
      await loadCart();
    } catch (error) {
      console.error('Error updating quantity:', error);
      toast.error('Failed to update quantity', {
        description:
          error instanceof Error
            ? error.message
            : 'Your cart has been refreshed with the latest data.',
      });
      // Reload cart on error to revert optimistic update
      await loadCart();
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    const removedItem = cartItems.find((item) => item.itemId === itemId);

    // Optimistic update
    setCartItems((items) => items.filter((item) => item.itemId !== itemId));
    setItemCount(cartItems.length - 1);

    try {
      const response = await fetch(`/api/cart/items/${itemId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        // Try to get error details from response
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.message || response.statusText;
        throw new Error(`Failed to remove item: ${errorMessage}`);
      }

      if (removedItem) {
        toast.info('Item removed', {
          description: `${removedItem.name} has been removed from your cart.`,
        });
      }

      // Reload cart to ensure consistency
      await loadCart();
    } catch (error) {
      console.error('Error removing item:', error);
      toast.error('Failed to remove item', {
        description:
          error instanceof Error
            ? error.message
            : 'Your cart has been refreshed.',
      });
      // Reload cart on error to revert optimistic update
      await loadCart();
    }
  };

  const handleCheckout = async () => {
    setIsCheckingOut(true);

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `Checkout failed: ${response.statusText}`
        );
      }

      const data = await response.json();
      const purchaseRequest = data.purchaseRequest;

      // Update cart count to 0 (cart is cleared on server)
      setItemCount(0);

      // Show success toast with purchase request details
      toast.success('Checkout successful!', {
        description: `Purchase request ${purchaseRequest.requestNumber} created with ${cartItems.length} ${cartItems.length === 1 ? 'item' : 'items'}. Total: $${purchaseRequest.totalCost.toFixed(2)}`,
        duration: 5000,
      });

      // Redirect immediately to purchase request detail page
      // Note: Cart will be cleared on server, no need to reload before redirect
      router.push(`/purchase/${purchaseRequest.id}`);
    } catch (error) {
      console.error('Error during checkout:', error);
      toast.error('Checkout failed', {
        description:
          error instanceof Error ? error.message : 'Please try again later.',
      });
    } finally {
      setIsCheckingOut(false);
    }
  };

  const totalCost = cartItems.reduce((sum, item) => sum + item.subtotal, 0);

  // Show loading state
  if (isLoading) {
    return (
      <div className='space-y-6'>
        <div>
          <h1 className='text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2 sm:gap-3'>
            <span>Shopping Cart</span>
          </h1>
          <p className='mt-2 text-sm sm:text-base text-muted-foreground'>
            Review your items and proceed to checkout
          </p>
        </div>
        <Card className='p-12 text-center'>
          <Loader2 className='h-16 w-16 mx-auto text-muted-foreground mb-4 animate-spin' />
          <p className='text-muted-foreground'>Loading your cart...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div>
        <h1 className='text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2 sm:gap-3'>
          <span>Shopping Cart</span>
        </h1>
        <p className='mt-2 text-sm sm:text-base text-muted-foreground'>
          Review your items and proceed to checkout
        </p>
      </div>

      {cartItems.length === 0 ? (
        /* Empty Cart State */
        <Card className='p-12 text-center'>
          <ShoppingCart className='h-16 w-16 mx-auto text-muted-foreground mb-4' />
          <h3 className='text-lg font-medium text-foreground mb-2'>
            Your cart is empty
          </h3>
          <p className='text-muted-foreground mb-6'>
            Add items from the catalog to get started
          </p>
          <Button onClick={() => (window.location.href = '/catalog')}>
            Browse Catalog
          </Button>
        </Card>
      ) : (
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
          {/* Cart Items */}
          <div className='lg:col-span-2 space-y-4'>
            {cartItems.map((item) => (
              <Card key={item.itemId} className='p-4 sm:p-6'>
                <div className='flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4'>
                  {/* Item Info */}
                  <div className='flex-1 min-w-0'>
                    <h3 className='text-base sm:text-lg font-medium text-foreground truncate'>
                      {item.name}
                    </h3>
                    <p className='text-sm text-muted-foreground mt-1'>
                      ${item.unitPrice.toFixed(2)} per unit
                    </p>
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={() => handleRemoveItem(item.itemId)}
                    className={cn(
                      'p-2 text-muted-foreground hover:text-destructive',
                      'hover:bg-accent rounded-lg transition-colors',
                      'self-start sm:self-auto'
                    )}
                    aria-label='Remove item'
                    title='Remove item'
                  >
                    <Trash2 className='h-5 w-5' />
                  </button>
                </div>

                {/* Quantity Controls and Subtotal */}
                <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mt-4'>
                  {/* Quantity Controls */}
                  <div className='flex items-center gap-2 sm:gap-3'>
                    <span className='text-sm text-muted-foreground whitespace-nowrap'>
                      Quantity:
                    </span>
                    <div className='flex items-center gap-2'>
                      <button
                        onClick={() => handleQuantityChange(item.itemId, -1)}
                        disabled={item.quantity <= 1}
                        className={cn(
                          'p-1.5 rounded-lg border border-input',
                          'hover:bg-accent transition-colors',
                          'disabled:opacity-50 disabled:cursor-not-allowed'
                        )}
                        aria-label='Decrease quantity'
                      >
                        <Minus className='h-4 w-4' />
                      </button>
                      <span className='w-10 sm:w-12 text-center font-medium text-foreground'>
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => handleQuantityChange(item.itemId, 1)}
                        disabled={item.quantity >= 999}
                        className={cn(
                          'p-1.5 rounded-lg border border-input',
                          'hover:bg-accent transition-colors',
                          'disabled:opacity-50 disabled:cursor-not-allowed'
                        )}
                        aria-label='Increase quantity'
                      >
                        <Plus className='h-4 w-4' />
                      </button>
                    </div>
                  </div>

                  {/* Subtotal */}
                  <div className='flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 sm:gap-0'>
                    <p className='text-sm text-muted-foreground'>Subtotal</p>
                    <p className='text-lg font-semibold text-foreground whitespace-nowrap'>
                      ${item.subtotal.toFixed(2)}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Order Summary */}
          <div className='lg:col-span-1'>
            <Card className='p-6 sticky top-6'>
              <CardHeader className='p-0 mb-4'>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>

              {/* Summary Details */}
              <CardContent className='p-0 space-y-3 mb-6'>
                <div className='flex justify-between text-sm'>
                  <span className='text-muted-foreground'>Items</span>
                  <span className='text-foreground'>
                    {cartItems.reduce((sum, item) => sum + item.quantity, 0)}
                  </span>
                </div>
                <div className='flex justify-between text-sm'>
                  <span className='text-muted-foreground'>Subtotal</span>
                  <span className='text-foreground'>
                    ${totalCost.toFixed(2)}
                  </span>
                </div>
                <div className='border-t border-border pt-3'>
                  <div className='flex justify-between'>
                    <span className='text-lg font-semibold text-foreground'>
                      Total
                    </span>
                    <span className='text-lg font-semibold text-foreground'>
                      ${totalCost.toFixed(2)}
                    </span>
                  </div>
                </div>
              </CardContent>

              <CardFooter className='p-0 flex-col gap-4'>
                {/* Checkout Button */}
                <Button
                  onClick={handleCheckout}
                  disabled={isCheckingOut || cartItems.length === 0}
                  className='w-full'
                >
                  {isCheckingOut ? (
                    <span className='flex items-center justify-center gap-2'>
                      <Loader2 className='h-4 w-4 animate-spin' />
                      Processing...
                    </span>
                  ) : (
                    'Proceed to Checkout'
                  )}
                </Button>

                {/* Additional Info */}
                <p className='text-xs text-muted-foreground text-center'>
                  Checkout will create a purchase request in the system
                </p>
              </CardFooter>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
