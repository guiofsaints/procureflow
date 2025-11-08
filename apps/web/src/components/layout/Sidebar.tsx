'use client';

import Image from 'next/image';
import Link from 'next/link';

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar';
import { useCart } from '@/contexts/CartContext';
import { useLayout } from '@/contexts/LayoutContext';

import { sidebarData } from './data/sidebar-data';
import { NavGroup } from './NavGroup';

/**
 * AppSidebar component using shadcn Sidebar
 *
 * Features:
 * - ProcureFlow logo at top
 * - Navigation groups in middle
 * - Collapsible with keyboard shortcut (Ctrl+B)
 * - Supports variants: sidebar (default), floating, inset
 * - Supports collapsible modes: icon (desktop), offcanvas (mobile), none
 */
export function AppSidebar() {
  const { itemCount } = useCart();
  const { variant, collapsible } = useLayout();

  // Update cart badge dynamically
  const navGroups = sidebarData.navGroups.map((group) => ({
    ...group,
    items: group.items.map((item) =>
      item.title === 'Cart' ? { ...item, badge: itemCount } : item
    ),
  }));

  return (
    <Sidebar collapsible={collapsible} variant={variant}>
      {/* Header with ProcureFlow Logo */}
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size='lg' asChild>
              <Link href='/catalog'>
                <div className='flex aspect-square size-8 items-center justify-center overflow-hidden rounded-lg'>
                  <Image
                    src='/procureflow.png'
                    alt='ProcureFlow'
                    width={32}
                    height={32}
                    className='h-full w-full object-contain'
                  />
                </div>
                <div className='grid flex-1 text-left text-sm leading-tight'>
                  <span className='truncate font-semibold'>ProcureFlow</span>
                  <span className='truncate text-xs text-muted-foreground'>
                    Procurement Platform
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* Navigation Groups */}
      <SidebarContent>
        {navGroups.map((group) => (
          <NavGroup key={group.title} {...group} />
        ))}
      </SidebarContent>

      {/* Rail for hover-to-expand */}
      <SidebarRail />
    </Sidebar>
  );
}
