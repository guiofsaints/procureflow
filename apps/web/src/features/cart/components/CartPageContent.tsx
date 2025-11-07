'use client';

import { Loader2, Minus, Plus, ShoppingCart, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
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

import { mockCartItems } from '../mock';

/**
 * CartPageContent - Client component for cart UI
 * Features:
 * - Display cart items with quantity controls
 * - Increment/decrement quantity
 * - Remove items
 * - Calculate total
 * - Checkout button (mock)
 */
export function CartPageContent() {
  const [cartItems, setCartItems] = useState<CartItem[]>(mockCartItems);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const { setItemCount } = useCart();

  // Sync cart counter with actual cart items
  useEffect(() => {
    setItemCount(cartItems.length);
  }, [cartItems, setItemCount]);

  const handleQuantityChange = (itemId: string, delta: number) => {
    setCartItems((items) =>
      items.map((item) => {
        if (item.itemId === itemId) {
          const newQuantity = Math.max(1, Math.min(999, item.quantity + delta));
          return {
            ...item,
            quantity: newQuantity,
            subtotal: item.itemPrice * newQuantity,
          };
        }
        return item;
      })
    );
  };

  const handleRemoveItem = (itemId: string) => {
    const removedItem = cartItems.find((item) => item.itemId === itemId);
    setCartItems((items) => items.filter((item) => item.itemId !== itemId));

    if (removedItem) {
      toast.info('Item removed', {
        description: `${removedItem.itemName} has been removed from your cart.`,
      });
    }
  };

  const handleCheckout = async () => {
    // Mock: Simulate checkout process
    setIsCheckingOut(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setIsCheckingOut(false);

    // Show success toast
    toast.success('Checkout successful!', {
      description: `Your order of ${cartItems.length} ${cartItems.length === 1 ? 'item' : 'items'} has been submitted.`,
    });

    // Clear cart
    setCartItems([]);
  };

  const totalCost = cartItems.reduce((sum, item) => sum + item.subtotal, 0);

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div>
        <h1 className='text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2 sm:gap-3'>
          <ShoppingCart className='h-6 w-6 sm:h-8 sm:w-8 flex-shrink-0' />
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
                      {item.itemName}
                    </h3>
                    <p className='text-sm text-muted-foreground mt-1'>
                      ${item.itemPrice.toFixed(2)} per unit
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
                  Checkout will create a purchase request (mock)
                </p>
              </CardFooter>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
