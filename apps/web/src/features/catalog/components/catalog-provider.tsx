'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';

import { useCart } from '@/contexts/CartContext';
import type { Item } from '@/domain/entities';

type CatalogDialogType = 'create' | 'update' | 'delete';

type CatalogContextType = {
  open: CatalogDialogType | null;
  setOpen: (str: CatalogDialogType | null) => void;
  currentRow: Item | null;
  setCurrentRow: React.Dispatch<React.SetStateAction<Item | null>>;
  handleAddToCart: (
    item: Omit<Item, 'createdAt' | 'updatedAt'>
  ) => Promise<void>;
  addingToCart: string | null;
  onRefreshCatalog?: () => void; // Callback to refresh catalog after mutations
};

const CatalogContext = React.createContext<CatalogContextType | null>(null);

export function CatalogProvider({
  children,
  onRefreshCatalog,
}: {
  children: React.ReactNode;
  onRefreshCatalog?: () => void;
}) {
  const [open, setOpen] = useState<CatalogDialogType | null>(null);
  const [currentRow, setCurrentRow] = useState<Item | null>(null);
  const [addingToCart, setAddingToCart] = useState<string | null>(null);
  const { addItem } = useCart();

  const handleAddToCart = async (
    item: Omit<Item, 'createdAt' | 'updatedAt'>
  ) => {
    setAddingToCart(item.id);

    try {
      // Call API to add item to cart with quantity 1
      const response = await fetch('/api/cart/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId: item.id,
          quantity: 1,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add item to cart');
      }

      // Increment cart counter
      addItem();

      toast.success('Added to cart!', {
        description: `${item.name} has been added to your cart.`,
      });
    } catch (error) {
      console.error('Error adding item to cart:', error);
      toast.error('Failed to add item to cart', {
        description:
          error instanceof Error ? error.message : 'Please try again later.',
      });
    } finally {
      setAddingToCart(null);
    }
  };

  return (
    <CatalogContext.Provider
      value={{
        open,
        setOpen,
        currentRow,
        setCurrentRow,
        handleAddToCart,
        addingToCart,
        onRefreshCatalog,
      }}
    >
      {children}
    </CatalogContext.Provider>
  );
}

export const useCatalog = () => {
  const catalogContext = React.useContext(CatalogContext);

  if (!catalogContext) {
    throw new Error('useCatalog has to be used within <CatalogProvider>');
  }

  return catalogContext;
};
