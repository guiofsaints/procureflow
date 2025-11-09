'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

import { useCart } from '@/contexts/CartContext';
import type { Item } from '@/domain/entities';

import { CatalogDialogs } from './catalog-dialogs';
import { CatalogPrimaryButtons } from './catalog-primary-buttons';
import { CatalogProvider } from './catalog-provider';
import { CatalogTable } from './catalog-table';

/**
 * CatalogPageContent - Client component for catalog UI
 * Features:
 * - Search items by name/description (via API)
 * - Display items in a table with TanStack Table
 * - Add items to cart (with visual feedback)
 * - Create/Edit items via drawer (Sheet)
 */
export function CatalogPageContent() {
  const [items, setItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { setItemCount } = useCart();

  // Load cart count from API
  const loadCartCount = useCallback(async () => {
    try {
      const response = await fetch('/api/cart');

      if (!response.ok) {
        // If unauthorized or error, silently fail (user may not be logged in)
        return;
      }

      const data = await response.json();
      const itemCount = data.cart?.items?.length || 0;
      setItemCount(itemCount);
    } catch (error) {
      // Silently fail - cart count is not critical for catalog browsing
      console.error('Error loading cart count:', error);
    }
  }, [setItemCount]);

  // Load items from API - memoized for refresh callback
  const loadItems = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/items');

      if (!response.ok) {
        throw new Error(`Failed to fetch items: ${response.statusText}`);
      }

      const data = await response.json();
      setItems(data.items || []);
    } catch (error) {
      console.error('Error loading catalog items:', error);
      toast.error('Failed to load catalog', {
        description:
          error instanceof Error
            ? error.message
            : 'Please try refreshing the page',
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load items on mount
  useEffect(() => {
    loadItems();
    loadCartCount();
  }, [loadItems, loadCartCount]);

  return (
    <CatalogProvider onRefreshCatalog={loadItems}>
      <div className='space-y-6'>
        {/* Header */}
        <div className='flex flex-wrap items-end justify-between gap-2'>
          <div>
            <h2 className='text-3xl font-bold tracking-tight text-foreground'>
              Catalog
            </h2>
            <p className='mt-2 text-muted-foreground'>
              Browse and search items from the procurement catalog
            </p>
          </div>
          <CatalogPrimaryButtons />
        </div>

        {/* Items Table */}
        <CatalogTable data={items} isLoading={isLoading} />
      </div>

      <CatalogDialogs />
    </CatalogProvider>
  );
}
