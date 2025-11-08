'use client';

import { useEffect, useState } from 'react';

import { mockItems } from '../mock';

import { CatalogDialogs } from './catalog-dialogs';
import { CatalogPrimaryButtons } from './catalog-primary-buttons';
import { CatalogProvider } from './catalog-provider';
import { CatalogTable } from './catalog-table';

/**
 * CatalogPageContent - Client component for catalog UI
 * Features:
 * - Search items by name/description
 * - Display items in a table with TanStack Table
 * - Add items to cart (with visual feedback)
 * - Create/Edit items via drawer (Sheet)
 */
export function CatalogPageContent() {
  const [isLoading, setIsLoading] = useState(true);

  // Simulate initial data loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <CatalogProvider>
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
        <CatalogTable data={mockItems} isLoading={isLoading} />
      </div>

      <CatalogDialogs />
    </CatalogProvider>
  );
}
