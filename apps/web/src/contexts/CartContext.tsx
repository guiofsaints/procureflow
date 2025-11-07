'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';

interface CartContextType {
  itemCount: number;
  addItem: () => void;
  removeItem: () => void;
  setItemCount: (count: number) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [itemCount, setItemCount] = useState(0);

  const addItem = () => {
    setItemCount((prev) => prev + 1);
  };

  const removeItem = () => {
    setItemCount((prev) => Math.max(0, prev - 1));
  };

  return (
    <CartContext.Provider
      value={{ itemCount, addItem, removeItem, setItemCount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
