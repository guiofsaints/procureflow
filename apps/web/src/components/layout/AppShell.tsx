'use client';

import type { ReactNode } from 'react';

import { Sidebar } from './Sidebar';

interface AppShellProps {
  children: ReactNode;
}

/**
 * AppShell component - Main layout structure for authenticated app
 *
 * Composition:
 * - Sidebar on the left (collapsible)
 * - Main content area on the right
 *
 * Features:
 * - Responsive layout
 * - Full height layout
 * - Flex-based structure
 */
export function AppShell({ children }: AppShellProps) {
  return (
    <div className='flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-950'>
      <Sidebar />

      <main className='flex-1 overflow-y-auto'>
        <div className='container mx-auto p-6 max-w-7xl'>{children}</div>
      </main>
    </div>
  );
}
