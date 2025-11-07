'use client';

import { Loader2, Minus, Plus, ShoppingCart, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components';
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
        <h1 className='text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2 sm:gap-3'>
          <ShoppingCart className='h-6 w-6 sm:h-8 sm:w-8 flex-shrink-0' />
          <span>Shopping Cart</span>
        </h1>
        <p className='mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-400'>
          Review your items and proceed to checkout
        </p>
      </div>

      {cartItems.length === 0 ? (
        /* Empty Cart State */
        <div className='bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center'>
          <ShoppingCart className='h-16 w-16 mx-auto text-gray-400 mb-4' />
          <h3 className='text-lg font-medium text-gray-900 dark:text-white mb-2'>
            Your cart is empty
          </h3>
          <p className='text-gray-500 dark:text-gray-400 mb-6'>
            Add items from the catalog to get started
          </p>
          <Button
            variant='primary'
            onClick={() => (window.location.href = '/catalog')}
          >
            Browse Catalog
          </Button>
        </div>
      ) : (
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
          {/* Cart Items */}
          <div className='lg:col-span-2 space-y-4'>
            {cartItems.map((item) => (
              <div
                key={item.itemId}
                className='bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6'
              >
                <div className='flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4'>
                  {/* Item Info */}
                  <div className='flex-1 min-w-0'>
                    <h3 className='text-base sm:text-lg font-medium text-gray-900 dark:text-white truncate'>
                      {item.itemName}
                    </h3>
                    <p className='text-sm text-gray-500 dark:text-gray-400 mt-1'>
                      ${item.itemPrice.toFixed(2)} per unit
                    </p>
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={() => handleRemoveItem(item.itemId)}
                    className={cn(
                      'p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400',
                      'hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors',
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
                    <span className='text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap'>
                      Quantity:
                    </span>
                    <div className='flex items-center gap-2'>
                      <button
                        onClick={() => handleQuantityChange(item.itemId, -1)}
                        disabled={item.quantity <= 1}
                        className={cn(
                          'p-1.5 rounded-lg border border-gray-300 dark:border-gray-600',
                          'hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors',
                          'disabled:opacity-50 disabled:cursor-not-allowed'
                        )}
                        aria-label='Decrease quantity'
                      >
                        <Minus className='h-4 w-4' />
                      </button>
                      <span className='w-10 sm:w-12 text-center font-medium text-gray-900 dark:text-white'>
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => handleQuantityChange(item.itemId, 1)}
                        disabled={item.quantity >= 999}
                        className={cn(
                          'p-1.5 rounded-lg border border-gray-300 dark:border-gray-600',
                          'hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors',
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
                    <p className='text-sm text-gray-500 dark:text-gray-400'>
                      Subtotal
                    </p>
                    <p className='text-lg font-semibold text-gray-900 dark:text-white whitespace-nowrap'>
                      ${item.subtotal.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className='lg:col-span-1'>
            <div className='bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 sticky top-6'>
              <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-4'>
                Order Summary
              </h3>

              {/* Summary Details */}
              <div className='space-y-3 mb-6'>
                <div className='flex justify-between text-sm'>
                  <span className='text-gray-600 dark:text-gray-400'>
                    Items
                  </span>
                  <span className='text-gray-900 dark:text-white'>
                    {cartItems.reduce((sum, item) => sum + item.quantity, 0)}
                  </span>
                </div>
                <div className='flex justify-between text-sm'>
                  <span className='text-gray-600 dark:text-gray-400'>
                    Subtotal
                  </span>
                  <span className='text-gray-900 dark:text-white'>
                    ${totalCost.toFixed(2)}
                  </span>
                </div>
                <div className='border-t border-gray-200 dark:border-gray-700 pt-3'>
                  <div className='flex justify-between'>
                    <span className='text-lg font-semibold text-gray-900 dark:text-white'>
                      Total
                    </span>
                    <span className='text-lg font-semibold text-gray-900 dark:text-white'>
                      ${totalCost.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Checkout Button */}
              <Button
                variant='primary'
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
              <p className='text-xs text-gray-500 dark:text-gray-400 text-center mt-4'>
                Checkout will create a purchase request (mock)
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
