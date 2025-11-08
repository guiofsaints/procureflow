'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';

type LayoutVariant = 'sidebar' | 'floating' | 'inset';
type CollapsibleMode = 'offcanvas' | 'icon' | 'none';
type LayoutMode = 'fixed' | 'scroll';

type LayoutContextType = {
  variant: LayoutVariant;
  setVariant: (variant: LayoutVariant) => void;
  collapsible: CollapsibleMode;
  setCollapsible: (collapsible: CollapsibleMode) => void;
  layout: LayoutMode;
  setLayout: (layout: LayoutMode) => void;
};

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

export function LayoutProvider({ children }: { children: ReactNode }) {
  const [variant, setVariant] = useState<LayoutVariant>('floating');
  const [collapsible, setCollapsible] = useState<CollapsibleMode>('icon');
  const [layout, setLayout] = useState<LayoutMode>('scroll');

  return (
    <LayoutContext.Provider
      value={{
        variant,
        setVariant,
        collapsible,
        setCollapsible,
        layout,
        setLayout,
      }}
    >
      {/* Gradient Background */}
      <div className='gradient-background' aria-hidden='true' />
      <div className='bg-accent/60'>{children}</div>
    </LayoutContext.Provider>
  );
}

export function useLayout() {
  const context = useContext(LayoutContext);
  if (context === undefined) {
    throw new Error('useLayout must be used within a LayoutProvider');
  }
  return context;
}
