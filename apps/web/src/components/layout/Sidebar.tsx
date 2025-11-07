'use client';

import {
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Package,
  ShoppingCart,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

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
 * Sidebar component with collapsible behavior
 * Features:
 * - Logo/title at top
 * - Navigation items in middle
 * - Theme toggle and user menu at bottom
 * - Collapsible: shows icons only when collapsed
 */
export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const { itemCount } = useCart();

  const navItems: NavItem[] = [
    { label: 'Catalog', href: '/catalog', icon: Package },
    { label: 'Cart', href: '/cart', icon: ShoppingCart, badge: itemCount },
    { label: 'Agent', href: '/agent', icon: MessageSquare },
  ];

  return (
    <aside
      className={cn(
        'flex flex-col h-screen bg-card border-r border-border transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Header with Logo and Collapse Button */}
      <div className='flex items-center justify-between p-4 border-b border-border'>
        {!collapsed && (
          <div className='flex items-center gap-2'>
            <div className='w-8 h-8 bg-primary rounded-lg flex items-center justify-center'>
              <span className='text-primary-foreground font-bold text-sm'>
                PF
              </span>
            </div>
            <span className='font-semibold text-foreground'>ProcureFlow</span>
          </div>
        )}

        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            'p-1.5 rounded-lg hover:bg-accent transition-colors',
            'text-muted-foreground',
            collapsed && 'mx-auto'
          )}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <ChevronRight className='h-5 w-5' />
          ) : (
            <ChevronLeft className='h-5 w-5' />
          )}
        </button>
      </div>

      {/* Navigation Items */}
      <nav className='flex-1 p-2 space-y-1'>
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors relative',
                'hover:bg-accent',
                isActive
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground',
                collapsed && 'justify-center'
              )}
              title={collapsed ? item.label : undefined}
              aria-label={item.label}
            >
              <div className='relative'>
                <Icon className='h-5 w-5 flex-shrink-0' />
                {item.badge !== undefined && item.badge > 0 && (
                  <span className='absolute -top-2 -right-2 bg-destructive text-destructive-foreground text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center'>
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </div>
              {!collapsed && (
                <span className='text-sm font-medium'>{item.label}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Section: Theme Toggle and User Menu */}
      <div className='p-2 border-t border-border space-y-2'>
        <ThemeToggle collapsed={collapsed} />
        <UserMenu collapsed={collapsed} />
      </div>
    </aside>
  );
}
