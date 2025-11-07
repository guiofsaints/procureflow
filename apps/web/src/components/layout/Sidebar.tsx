'use client';

import { MessageSquare, Package, ShoppingCart } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { useCart } from '@/contexts/CartContext';
import { cn } from '@/lib/utils';

import { ThemeToggle } from './ThemeToggle';
import { UserMenu } from './UserMenu';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

/**
 * AppSidebar component using shadcn Sidebar
 * Features:
 * - Logo/title at top
 * - Navigation items in middle
 * - Theme toggle and user menu at bottom
 * - Collapsible with keyboard shortcut (Ctrl+B)
 */
export function AppSidebar() {
  const pathname = usePathname();
  const { itemCount } = useCart();
  const { state } = useSidebar();

  const navItems: NavItem[] = [
    { label: 'Catalog', href: '/catalog', icon: Package },
    { label: 'Cart', href: '/cart', icon: ShoppingCart, badge: itemCount },
    { label: 'Agent', href: '/agent', icon: MessageSquare },
  ];

  return (
    <Sidebar>
      {/* Header with Logo */}
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size='lg' asChild>
              <Link href='/catalog'>
                <div className='flex items-center gap-2'>
                  <div className='w-8 h-8 bg-primary rounded-lg flex items-center justify-center'>
                    <span className='text-primary-foreground font-bold text-sm'>
                      PF
                    </span>
                  </div>
                  <span className='font-semibold text-foreground'>
                    ProcureFlow
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* Navigation Items */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive = pathname.startsWith(item.href);
                const Icon = item.icon;

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.label}
                    >
                      <Link href={item.href}>
                        <div className='relative'>
                          <Icon className='h-5 w-5' />
                          {item.badge !== undefined && item.badge > 0 && (
                            <span
                              className={cn(
                                'absolute -top-2 -right-2 bg-destructive text-destructive-foreground',
                                'text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center',
                                state === 'collapsed' && 'hidden'
                              )}
                            >
                              {item.badge > 99 ? '99+' : item.badge}
                            </span>
                          )}
                        </div>
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Bottom Section: Theme Toggle and User Menu */}
      <SidebarFooter>
        <SidebarMenu>
          <ThemeToggle collapsed={state === 'collapsed'} />
          <UserMenu collapsed={state === 'collapsed'} />
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
