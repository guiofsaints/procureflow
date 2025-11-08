import type { ReactNode } from 'react';

import { AppShell } from '@/components';
import { BreadcrumbProvider } from '@/contexts/BreadcrumbContext';
import { CartProvider } from '@/contexts/CartContext';

/**
 * Layout for authenticated app routes
 * Uses AppShell component with Sidebar and main content area
 * CartProvider wraps the app to manage cart state globally
 * BreadcrumbProvider allows pages to set dynamic breadcrumb labels
 * Future: Add authentication checks here
 */
export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <BreadcrumbProvider>
      <CartProvider>
        <AppShell>{children}</AppShell>
      </CartProvider>
    </BreadcrumbProvider>
  );
}
