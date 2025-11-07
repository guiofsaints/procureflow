import type { ReactNode } from 'react';

/**
 * Layout for public routes (landing, docs, etc.)
 * Inherits from root layout.tsx for global styles and metadata
 */
export default function PublicLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
