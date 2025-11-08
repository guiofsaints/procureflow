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
};

const CatalogContext = React.createContext<CatalogContextType | null>(null);

export function CatalogProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState<CatalogDialogType | null>(null);
  const [currentRow, setCurrentRow] = useState<Item | null>(null);
  const [addingToCart, setAddingToCart] = useState<string | null>(null);
  const { addItem } = useCart();

  const handleAddToCart = async (
    item: Omit<Item, 'createdAt' | 'updatedAt'>
  ) => {
    setAddingToCart(item.id);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 800));

    setAddingToCart(null);
    addItem();

    toast.success('Added to cart!', {
      description: `${item.name} has been added to your cart.`,
    });
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
