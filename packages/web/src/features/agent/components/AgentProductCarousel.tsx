/**
 * AgentProductCarousel Component
 *
 * Displays a carousel of product cards when there are more than 2 items.
 * For 1-2 items, displays them in a simple grid.
 */

'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import type { AgentItem } from '../types';

import { AgentProductCard } from './AgentProductCard';

interface AgentProductCarouselProps {
  items: AgentItem[];
}

export function AgentProductCarousel({ items }: AgentProductCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // For 1-2 items, display in a simple grid
  if (items.length <= 2) {
    return (
      <div className='grid w-full gap-3 sm:grid-cols-2'>
        {items.map((item) => (
          <AgentProductCard key={item.id} item={item} />
        ))}
      </div>
    );
  }

  // For 3+ items, use carousel
  // Desktop (lg): 2 cards per view, Mobile: 1 card per view
  const cardsPerView = { mobile: 1, desktop: 2 };
  const totalPages = {
    mobile: items.length,
    desktop: Math.ceil(items.length / cardsPerView.desktop),
  };

  const canGoPrevMobile = currentIndex > 0;
  const canGoNextMobile = currentIndex < totalPages.mobile - 1;
  const canGoPrevDesktop = currentIndex > 0;
  const canGoNextDesktop = currentIndex < totalPages.desktop - 1;

  const goToPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const goToNext = () => {
    setCurrentIndex((prev) => prev + 1);
  };

  const goToIndex = (index: number) => {
    setCurrentIndex(index);
  };

  return (
    <div className='relative w-full'>
      {/* Carousel container */}
      <div className='overflow-hidden'>
        {/* Mobile: 1 card per view */}
        <div
          className='flex transition-transform duration-300 ease-in-out lg:hidden'
          style={{
            transform: `translateX(-${currentIndex * 100}%)`,
          }}
        >
          {items.map((item) => (
            <div key={item.id} className='min-w-full shrink-0 px-1'>
              <AgentProductCard item={item} />
            </div>
          ))}
        </div>

        {/* Desktop: 2 cards per view */}
        <div
          className='hidden transition-transform duration-300 ease-in-out lg:flex'
          style={{
            transform: `translateX(-${currentIndex * 100}%)`,
          }}
        >
          {items.map((item) => (
            <div key={item.id} className='w-1/2 shrink-0 px-1'>
              <AgentProductCard item={item} />
            </div>
          ))}
        </div>
      </div>

      {/* Navigation buttons - Mobile (1 card per view) */}
      <div className='mt-3 flex items-center justify-between lg:hidden'>
        <Button
          variant='outline'
          size='icon'
          onClick={goToPrev}
          disabled={!canGoPrevMobile}
          className='h-8 w-8'
        >
          <ChevronLeft className='h-4 w-4' />
        </Button>

        {/* Dots indicator - Mobile */}
        <div className='flex gap-1.5'>
          {items.map((_, index) => (
            <button
              key={index}
              onClick={() => goToIndex(index)}
              className={cn(
                'h-2 w-2 rounded-full transition-all',
                index === currentIndex
                  ? 'w-4 bg-primary'
                  : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
              )}
              aria-label={`Go to item ${index + 1}`}
            />
          ))}
        </div>

        <Button
          variant='outline'
          size='icon'
          onClick={goToNext}
          disabled={!canGoNextMobile}
          className='h-8 w-8'
        >
          <ChevronRight className='h-4 w-4' />
        </Button>
      </div>

      {/* Navigation buttons - Desktop (2 cards per view) */}
      <div className='mt-3 hidden items-center justify-between lg:flex'>
        <Button
          variant='outline'
          size='icon'
          onClick={goToPrev}
          disabled={!canGoPrevDesktop}
          className='h-8 w-8'
        >
          <ChevronLeft className='h-4 w-4' />
        </Button>

        {/* Dots indicator - Desktop */}
        <div className='flex gap-1.5'>
          {Array.from({ length: totalPages.desktop }).map((_, index) => (
            <button
              key={index}
              onClick={() => goToIndex(index)}
              className={cn(
                'h-2 w-2 rounded-full transition-all',
                index === currentIndex
                  ? 'w-4 bg-primary'
                  : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
              )}
              aria-label={`Go to page ${index + 1}`}
            />
          ))}
        </div>

        <Button
          variant='outline'
          size='icon'
          onClick={goToNext}
          disabled={!canGoNextDesktop}
          className='h-8 w-8'
        >
          <ChevronRight className='h-4 w-4' />
        </Button>
      </div>

      {/* Item counter - Mobile */}
      <div className='mt-2 text-center text-xs text-muted-foreground lg:hidden'>
        {currentIndex + 1} of {items.length}
      </div>

      {/* Page counter - Desktop */}
      <div className='mt-2 hidden text-center text-xs text-muted-foreground lg:block'>
        Page {currentIndex + 1} of {totalPages.desktop}
      </div>
    </div>
  );
}
