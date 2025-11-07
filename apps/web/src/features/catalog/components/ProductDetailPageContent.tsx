'use client';

import { ArrowLeft, Loader2, Minus, Package, Plus, ShoppingCart, Tag } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button, Input } from '@/components';
import { useCart } from '@/contexts/CartContext';
import { ItemStatus } from '@/domain/entities';
import { cn } from '@/lib/utils';

import { mockItems } from '../mock';

/**
 * ProductDetailPageContent - Client component for product detail UI
 * Features:
 * - Display full product information
 * - Add to cart with quantity selector
 * - Back to catalog navigation
 * - Responsive layout
 */
export function ProductDetailPageContent() {
  const params = useParams();
  const router = useRouter();
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  const itemId = params?.itemId as string;
  const item = mockItems.find((i) => i.id === itemId);

  const handleAddToCart = async () => {
    setIsAddingToCart(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 800));

    setIsAddingToCart(false);

    // Increment cart counter for each quantity
    for (let i = 0; i < quantity; i++) {
      addItem();
    }

    // Show success toast
    toast.success('Added to cart!', {
      description: `${quantity} ${quantity === 1 ? 'item' : 'items'} of ${item?.name} added to your cart.`,
    });
  };

  const handleQuantityChange = (delta: number) => {
    setQuantity((prev) => Math.max(1, Math.min(999, prev + delta)));
  };

  if (!item) {
    return (
      <div className='flex-1 p-6 lg:p-8'>
        <div className='max-w-4xl mx-auto'>
          <div className='bg-accent border border-border rounded-lg p-6 text-center'>
            <Package className='h-12 w-12 text-muted-foreground mx-auto mb-3' />
            <h2 className='text-lg font-semibold text-foreground mb-2'>
              Product Not Found
            </h2>
            <p className='text-sm text-muted-foreground mb-4'>
              The product you're looking for doesn't exist or has been removed.
            </p>
            <Button
              variant='secondary'
              onClick={() => router.push('/catalog')}
              className='inline-flex items-center gap-2'
            >
              <ArrowLeft className='h-4 w-4' />
              Back to Catalog
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='flex-1 p-6 lg:p-8 bg-background'>
      <div className='max-w-4xl mx-auto'>
        {/* Back Button */}
        <button
          onClick={() => router.push('/catalog')}
          className='inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6'
        >
          <ArrowLeft className='h-4 w-4' />
          <span className='text-sm font-medium'>Back to Catalog</span>
        </button>

        {/* Product Card */}
        <div className='bg-card rounded-xl shadow-sm border border-border'>
          {/* Product Header */}
          <div className='p-6 lg:p-8 border-b border-border'>
            <div className='flex items-start justify-between gap-4'>
              <div className='flex-1'>
                <div className='flex items-center gap-2 mb-2'>
                  <span className='inline-flex items-center gap-1 px-3 py-1 bg-accent text-accent-foreground rounded-full text-xs font-medium'>
                    <Tag className='h-3 w-3' />
                    {item.category}
                  </span>
                  <span
                    className={cn(
                      'px-3 py-1 rounded-full text-xs font-medium',
                      item.status === ItemStatus.Active
                        ? 'bg-accent text-accent-foreground'
                        : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {item.status === ItemStatus.Active
                      ? 'Available'
                      : 'Inactive'}
                  </span>
                </div>
                <h1 className='text-2xl lg:text-3xl font-bold text-foreground'>
                  {item.name}
                </h1>
              </div>
              <div className='text-right'>
                <div className='text-sm text-muted-foreground mb-1'>
                  Price
                </div>
                <div className='text-3xl font-bold text-primary'>
                  ${item.price.toFixed(2)}
                </div>
              </div>
            </div>
          </div>

          {/* Product Details */}
          <div className='p-6 lg:p-8 space-y-6'>
            {/* Description */}
            <div>
              <h2 className='text-lg font-semibold text-foreground mb-3'>
                Description
              </h2>
              <p className='text-muted-foreground leading-relaxed'>
                {item.description}
              </p>
            </div>

            {/* Product Info Grid */}
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
              <div className='bg-muted rounded-lg p-4'>
                <div className='text-sm text-muted-foreground mb-1'>
                  Product ID
                </div>
                <div className='font-mono text-sm text-foreground'>
                  #{item.id}
                </div>
              </div>
              <div className='bg-muted rounded-lg p-4'>
                <div className='text-sm text-muted-foreground mb-1'>
                  Category
                </div>
                <div className='font-medium text-foreground'>
                  {item.category}
                </div>
              </div>
            </div>

            {/* Add to Cart Section */}
            <div className='pt-6 border-t border-border'>
              <h2 className='text-lg font-semibold text-foreground mb-4'>
                Add to Cart
              </h2>

              <div className='flex flex-col sm:flex-row gap-4'>
                {/* Quantity Selector */}
                <div className='flex items-center gap-3'>
                  <span className='text-sm font-medium text-foreground'>
                    Quantity:
                  </span>
                  <div className='flex items-center gap-2'>
                    <Button
                      size='icon-sm'
                      variant='ghost'
                      onClick={() => handleQuantityChange(-1)}
                      disabled={quantity <= 1 || isAddingToCart}
                    >
                      <Minus className='h-4 w-4' />
                    </Button>
                    <Input
                      type='number'
                      value={quantity}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 1;
                        setQuantity(Math.max(1, Math.min(999, val)));
                      }}
                      disabled={isAddingToCart}
                      className='w-16 text-center'
                      min='1'
                      max='999'
                    />
                    <Button
                      size='icon-sm'
                      variant='ghost'
                      onClick={() => handleQuantityChange(1)}
                      disabled={quantity >= 999 || isAddingToCart}
                    >
                      <Plus className='h-4 w-4' />
                    </Button>
                  </div>
                </div>

                {/* Add to Cart Button */}
                <Button
                  onClick={handleAddToCart}
                  disabled={isAddingToCart}
                  className='flex-1 sm:flex-initial flex items-center justify-center gap-2'
                >
                  {isAddingToCart ? (
                    <>
                      <Loader2 className='h-5 w-5 animate-spin' />
                      Adding...
                    </>
                  ) : (
                    <>
                      <ShoppingCart className='h-5 w-5' />
                      Add to Cart
                    </>
                  )}
                </Button>
              </div>

              {/* Subtotal */}
              <div className='mt-4 p-4 bg-accent rounded-lg'>
                <div className='flex items-center justify-between'>
                  <span className='text-sm font-medium text-accent-foreground'>
                    Subtotal ({quantity} {quantity === 1 ? 'item' : 'items'}):
                  </span>
                  <span className='text-xl font-bold text-primary'>
                    ${(item.price * quantity).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
