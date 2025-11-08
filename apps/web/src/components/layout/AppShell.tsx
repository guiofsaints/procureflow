'use client';

import type { ReactNode } from 'react';

import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { LayoutProvider } from '@/contexts/LayoutContext';

import { Header } from './Header';
import { Main } from './Main';
import { AppSidebar } from './Sidebar';
import { SkipToMain } from './SkipToMain';
import { ThemeToggle } from './ThemeToggle';
import { UserMenu } from './UserMenu';

interface AppShellProps {
  children: ReactNode;
}

/**
 * AppShell component - Main layout structure for authenticated app
 *
 * Composition:
 * - LayoutProvider: Manages layout variant, collapsible mode, fixed/scroll
 * - SidebarProvider: Manages sidebar state (open/closed), keyboard shortcuts
 * - SkipToMain: Accessibility skip link
 * - AppSidebar: Navigation sidebar
 * - Header: Topbar with scroll effects
 * - Main: Content area with optional fixed layout
 *
 * Features:
 * - Responsive layout with mobile support
 * - Container queries (@container/content)
 * - Keyboard shortcut (Ctrl+B) to toggle sidebar
 * - Persistent sidebar state (cookie-based)
 * - Scroll-based header effects (shadow, glassmorphism)
 */
export function AppShell({ children }: AppShellProps) {
  // Get sidebar state from cookie (will implement in next iteration)
  // const defaultOpen = getCookie('sidebar_state') !== 'false';
  const defaultOpen = true; // For now, default to open

  return (
    <LayoutProvider>
      <SidebarProvider defaultOpen={defaultOpen}>
        <SkipToMain />
        <AppSidebar />
        <SidebarInset className='@container/content has-data-[layout=fixed]:h-svh peer-data-[variant=inset]:has-data-[layout=fixed]:h-[calc(100svh-(var(--spacing)*4))]'>
          <Header fixed>
            {/* Left: Page title placeholder */}
            <div className='flex-1'>{/* Page title can be added here */}</div>

            {/* Right: Actions */}
            <div className='flex items-center gap-2'>
              <ThemeToggle />
              <UserMenu />
            </div>
          </Header>
          <Main>
            <div className='container mx-auto p-6 max-w-7xl'>{children}</div>
          </Main>
        </SidebarInset>
      </SidebarProvider>
    </LayoutProvider>
  );
}
