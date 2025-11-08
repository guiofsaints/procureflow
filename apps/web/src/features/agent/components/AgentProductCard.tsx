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
  const { addItem } = useCart();

  const handleAddToCart = () => {
    // Add items to cart context (updates sidebar counter)
    for (let i = 0; i < quantity; i++) {
      addItem();
    }

    toast.success(
      `Added ${quantity} ${quantity === 1 ? 'unit' : 'units'} of "${item.name}" to cart`,
      {
        description: `Total: $${(item.price * quantity).toFixed(2)}`,
      }
    );

    // Reset quantity after adding
    setQuantity(1);
  };

  const incrementQuantity = () => {
    setQuantity((prev) => Math.min(prev + 1, 99));
  };

  const decrementQuantity = () => {
    setQuantity((prev) => Math.max(prev - 1, 1));
  };

  const getAvailabilityBadge = () => {
    switch (item.availability) {
      case 'in_stock':
        return (
          <Badge variant='default' className='bg-green-500'>
            In Stock
          </Badge>
        );
      case 'limited':
        return <Badge variant='secondary'>Limited Stock</Badge>;
      case 'out_of_stock':
        return <Badge variant='destructive'>Out of Stock</Badge>;
      default:
        return null;
    }
  };

  return (
    <Card className='w-full'>
      <CardHeader>
        <div className='flex items-start justify-between gap-2'>
          <div className='flex-1'>
            <CardTitle className='text-lg'>{item.name}</CardTitle>
            <CardDescription className='mt-1'>
              <Badge variant='outline' className='font-normal'>
                {item.category}
              </Badge>
            </CardDescription>
          </div>
          <div className='flex flex-col items-end gap-1'>
            <div className='text-xl font-bold'>${item.price.toFixed(2)}</div>
            {getAvailabilityBadge()}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className='text-sm text-muted-foreground'>{item.description}</p>
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
              disabled={quantity <= 1 || item.availability === 'out_of_stock'}
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
              disabled={quantity >= 99 || item.availability === 'out_of_stock'}
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
              ${(item.price * quantity).toFixed(2)}
            </span>
          </div>
        )}

        {/* Add to Cart Button */}
        <Button
          onClick={handleAddToCart}
          disabled={item.availability === 'out_of_stock'}
          className='w-full'
          size='sm'
        >
          <ShoppingCart className='mr-2 h-4 w-4' />
          Add {quantity > 1 ? `${quantity} ` : ''}to Cart
        </Button>
      </CardFooter>
    </Card>
  );
}
