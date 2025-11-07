'use client';

import type { ReactNode } from 'react';

import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';

import { AppSidebar } from './Sidebar';

interface AppShellProps {
  children: ReactNode;
}

/**
 * AppShell component - Main layout structure for authenticated app
 *
 * Composition:
 * - Sidebar on the left (collapsible with SidebarProvider)
 * - Main content area on the right (SidebarInset)
 *
 * Features:
 * - Responsive layout with mobile support
 * - Full height layout
 * - Keyboard shortcut (Ctrl+B) to toggle sidebar
 * - Persistent sidebar state (cookie-based)
 */
export function AppShell({ children }: AppShellProps) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className='flex h-14 shrink-0 items-center gap-2 border-b px-4'>
          <SidebarTrigger />
        </header>
        <main className='flex-1 overflow-y-auto'>
          <div className='container mx-auto p-6 max-w-7xl'>{children}</div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
