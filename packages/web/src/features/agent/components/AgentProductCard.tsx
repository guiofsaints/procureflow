/**
 * AgentProductCard Component
 *
 * Displays a product card within the agent chat interface.
 */

'use client';

import { Minus, Plus, ShoppingCart } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useCart } from '@/contexts/CartContext';

import type { AgentItem } from '../types';

interface AgentProductCardProps {
  item: AgentItem;
}

export function AgentProductCard({ item }: AgentProductCardProps) {
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const { setItemCount } = useCart();

  // Validate item data and provide defaults
  const safeItem = {
    ...item,
    estimatedPrice:
      typeof item.estimatedPrice === 'number' ? item.estimatedPrice : 0,
    availability: item.availability || 'in_stock',
    description: item.description || 'No description available',
  };

  // Log warning if estimatedPrice is missing or invalid
  if (typeof item.estimatedPrice !== 'number') {
    console.warn('AgentProductCard: Invalid estimatedPrice for item:', {
      itemId: item.id,
      estimatedPrice: item.estimatedPrice,
      item,
    });
  }

  const handleAddToCart = async () => {
    setIsAdding(true);

    try {
      // Call the cart API to add the item
      const response = await fetch('/api/cart/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          itemId: safeItem.id,
          quantity,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add item to cart');
      }

      const data = await response.json();

      // Update cart context with number of distinct items
      const itemCount = data.cart.items?.length || 0;
      setItemCount(itemCount);

      toast.success(
        `Added ${quantity} ${quantity === 1 ? 'unit' : 'units'} of "${safeItem.name}" to cart`,
        {
          description: `Cart total: $${data.cart.totalCost.toFixed(2)}`,
        }
      );

      // Reset quantity after adding
      setQuantity(1);
    } catch (error) {
      console.error('Error adding item to cart:', error);
      toast.error('Failed to add item to cart', {
        description:
          error instanceof Error ? error.message : 'Please try again later.',
      });
    } finally {
      setIsAdding(false);
    }
  };

  const incrementQuantity = () => {
    setQuantity((prev) => Math.min(prev + 1, 99));
  };

  const decrementQuantity = () => {
    setQuantity((prev) => Math.max(prev - 1, 1));
  };

  const getAvailabilityBadge = () => {
    switch (safeItem.availability) {
      case 'in_stock':
        return <Badge variant='default'>In Stock</Badge>;
      case 'limited':
        return <Badge variant='secondary'>Limited Stock</Badge>;
      case 'out_of_stock':
        return <Badge variant='destructive'>Out of Stock</Badge>;
      default:
        return null;
    }
  };

  return (
    <Card className='w-full py-6'>
      <CardHeader>
        <div className='flex items-start justify-between gap-2'>
          <div className='flex-1'>
            <CardTitle className='text-lg'>{safeItem.name}</CardTitle>
            <CardDescription className='mt-1'>
              <Badge variant='outline' className='font-normal'>
                {safeItem.category}
              </Badge>
            </CardDescription>
          </div>
          <div className='flex flex-col items-end gap-1'>
            <div className='text-xl font-bold'>
              ${safeItem.estimatedPrice.toFixed(2)}
            </div>
            {getAvailabilityBadge()}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className='text-sm text-muted-foreground'>{safeItem.description}</p>
      </CardContent>
      <CardFooter className='flex flex-col gap-3'>
        {/* Quantity Selector */}
        <div className='flex w-full items-center justify-between'>
          <span className='text-sm font-medium'>Quantity:</span>
          <div className='flex items-center gap-2'>
            <Button
              variant='outline'
              size='icon'
              className='h-8 w-8'
              onClick={decrementQuantity}
              disabled={
                quantity <= 1 || safeItem.availability === 'out_of_stock'
              }
            >
              <Minus className='h-4 w-4' />
            </Button>
            <span className='min-w-8 text-center font-semibold'>
              {quantity}
            </span>
            <Button
              variant='outline'
              size='icon'
              className='h-8 w-8'
              onClick={incrementQuantity}
              disabled={
                quantity >= 99 || safeItem.availability === 'out_of_stock'
              }
            >
              <Plus className='h-4 w-4' />
            </Button>
          </div>
        </div>

        {/* Total Price */}
        {quantity > 1 && (
          <div className='flex w-full items-center justify-between text-sm'>
            <span className='text-muted-foreground'>Total:</span>
            <span className='font-bold text-primary'>
              ${(safeItem.estimatedPrice * quantity).toFixed(2)}
            </span>
          </div>
        )}

        {/* Add to Cart Button */}
        <Button
          onClick={handleAddToCart}
          disabled={safeItem.availability === 'out_of_stock' || isAdding}
          className='w-full'
          size='sm'
        >
          <ShoppingCart className='mr-2 h-4 w-4' />
          {isAdding
            ? 'Adding...'
            : `Add ${quantity > 1 ? `${quantity} ` : ''}to Cart`}
        </Button>
      </CardFooter>
    </Card>
  );
}
