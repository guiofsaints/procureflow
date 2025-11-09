'use client';

import {
  createContext,
  useContext,
  useState,
  type ReactNode,
  useCallback,
} from 'react';

interface BreadcrumbContextType {
  dynamicLabels: Record<string, string>;
  setDynamicLabel: (path: string, label: string) => void;
  clearDynamicLabel: (path: string) => void;
}

const BreadcrumbContext = createContext<BreadcrumbContextType | undefined>(
  undefined
);

export function BreadcrumbProvider({ children }: { children: ReactNode }) {
  const [dynamicLabels, setDynamicLabels] = useState<Record<string, string>>(
    {}
  );

  const setDynamicLabel = useCallback((path: string, label: string) => {
    setDynamicLabels((prev) => ({ ...prev, [path]: label }));
  }, []);

  const clearDynamicLabel = useCallback((path: string) => {
    setDynamicLabels((prev) => {
      const { [path]: _, ...rest } = prev;
      return rest;
    });
  }, []);

  return (
    <BreadcrumbContext.Provider
      value={{ dynamicLabels, setDynamicLabel, clearDynamicLabel }}
    >
      {children}
    </BreadcrumbContext.Provider>
  );
}

export function useBreadcrumb() {
  const context = useContext(BreadcrumbContext);
  if (!context) {
    throw new Error('useBreadcrumb must be used within BreadcrumbProvider');
  }
  return context;
}
