'use client';

import {
  ArrowLeft,
  Loader2,
  Minus,
  Package,
  Plus,
  ShoppingCart,
  Tag,
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  Input,
} from '@/components';
import { useBreadcrumb } from '@/contexts/BreadcrumbContext';
import { useCart } from '@/contexts/CartContext';
import type { Item } from '@/domain/entities';
import { ItemStatus } from '@/domain/entities';

/**
 * ProductDetailPageContent - Client component for product detail UI
 * Features:
 * - Display full product information (loaded from API)
 * - Add to cart with quantity selector
 * - Back to catalog navigation
 * - Responsive layout
 */
export function ProductDetailPageContent() {
  const params = useParams();
  const router = useRouter();
  const { setItemCount } = useCart();
  const { setDynamicLabel, clearDynamicLabel } = useBreadcrumb();
  const [quantity, setQuantity] = useState(1);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [item, setItem] = useState<Item | null>(null);
  const [isLoadingItem, setIsLoadingItem] = useState(true);

  const itemId = params?.itemId as string;

  // Load item from API
  useEffect(() => {
    async function loadItem() {
      if (!itemId) {
        return;
      }

      setIsLoadingItem(true);
      try {
        const response = await fetch(`/api/items/${itemId}`);

        if (response.status === 404) {
          setItem(null);
          return;
        }

        if (!response.ok) {
          throw new Error(`Failed to fetch item: ${response.statusText}`);
        }

        const data = await response.json();
        setItem(data);
      } catch (error) {
        console.error('Error loading item:', error);
        toast.error('Failed to load item details', {
          description:
            error instanceof Error
              ? error.message
              : 'Please try refreshing the page',
        });
        setItem(null);
      } finally {
        setIsLoadingItem(false);
      }
    }

    loadItem();
  }, [itemId]);

  // Set breadcrumb label with item name
  useEffect(() => {
    if (item) {
      setDynamicLabel(`/catalog/${itemId}`, item.name);
    }
    return () => {
      clearDynamicLabel(`/catalog/${itemId}`);
    };
  }, [item, itemId, setDynamicLabel, clearDynamicLabel]);

  const handleAddToCart = async () => {
    if (!item) {
      return;
    }

    setIsAddingToCart(true);

    try {
      // Call API to add item to cart
      const response = await fetch('/api/cart/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId: item.id,
          quantity,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add item to cart');
      }

      const data = await response.json();

      // Update cart counter with actual number of distinct items
      const itemCount = data.cart.items?.length || 0;
      setItemCount(itemCount);

      // Show success toast
      toast.success('Added to cart!', {
        description: `${quantity} ${quantity === 1 ? 'item' : 'items'} of ${item?.name} added to your cart.`,
      });
    } catch (error) {
      console.error('Error adding item to cart:', error);
      toast.error('Failed to add item to cart', {
        description:
          error instanceof Error ? error.message : 'Please try again later.',
      });
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleQuantityChange = (delta: number) => {
    setQuantity((prev) => Math.max(1, Math.min(999, prev + delta)));
  };

  // Show loading skeleton while fetching item
  if (isLoadingItem) {
    return (
      <div className='flex-1 p-6 lg:p-8'>
        <div className='max-w-4xl mx-auto'>
          <div className='h-4 w-32 bg-muted rounded animate-pulse mb-6' />
          <Card className='py-6'>
            <CardHeader className='border-b'>
              <div className='space-y-3'>
                <div className='h-6 w-20 bg-muted rounded animate-pulse' />
                <div className='h-8 w-3/4 bg-muted rounded animate-pulse' />
              </div>
            </CardHeader>
            <CardContent className='space-y-6'>
              <div className='space-y-2'>
                <div className='h-5 w-24 bg-muted rounded animate-pulse' />
                <div className='h-4 w-full bg-muted rounded animate-pulse' />
                <div className='h-4 w-5/6 bg-muted rounded animate-pulse' />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className='flex-1 p-6 lg:p-8'>
        <div className='max-w-4xl mx-auto'>
          <div className='border border-border rounded-lg p-6 text-center'>
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
    <div className='flex-1 p-6 lg:p-8 '>
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
        <Card className='py-6'>
          {/* Product Header */}
          <CardHeader className='border-b'>
            <div className='flex items-start justify-between gap-4'>
              <div className='flex-1'>
                <div className='flex items-center gap-2 mb-2'>
                  <Badge variant='secondary' className='gap-1'>
                    <Tag className='h-3 w-3' />
                    {item.category}
                  </Badge>
                  <Badge
                    variant={
                      item.status === ItemStatus.Active ? 'default' : 'outline'
                    }
                  >
                    {item.status === ItemStatus.Active
                      ? 'Available'
                      : 'Inactive'}
                  </Badge>
                </div>
                <h1 className='text-2xl lg:text-3xl font-bold text-foreground'>
                  {item.name}
                </h1>
              </div>
              <div className='text-right'>
                <div className='text-sm text-muted-foreground mb-1'>Price</div>
                <div className='text-3xl font-bold text-primary'>
                  ${item.price.toFixed(2)}
                </div>
              </div>
            </div>
          </CardHeader>

          {/* Product Details */}
          <CardContent className='space-y-6'>
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
