import type { ReactNode } from 'react';

/**
 * Layout for authenticated app routes (dashboard, API routes, etc.)
 * Inherits from root layout.tsx for global styles and metadata
 * Future: Add authentication checks here
 */
export default function AppLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
