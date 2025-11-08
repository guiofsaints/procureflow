'use client';

import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

import type {
  NavCollapsible,
  NavGroup as NavGroupProps,
  NavItem,
  NavLink,
} from './types';

export function NavGroup({ title, items }: NavGroupProps) {
  const { state, isMobile, setOpenMobile } = useSidebar();
  const pathname = usePathname();

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{title}</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          const key = `${item.title}-${item.url}`;

          if (!('items' in item)) {
            return (
              <SidebarMenuLink
                key={key}
                item={item}
                pathname={pathname}
                setOpenMobile={setOpenMobile}
              />
            );
          }

          if (state === 'collapsed' && !isMobile) {
            return (
              <SidebarMenuCollapsedDropdown
                key={key}
                item={item}
                pathname={pathname}
              />
            );
          }

          return (
            <SidebarMenuCollapsible
              key={key}
              item={item}
              pathname={pathname}
              setOpenMobile={setOpenMobile}
            />
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}

function NavBadge({ children }: { children: ReactNode }) {
  return <Badge className='rounded-full px-1 py-0 text-xs'>{children}</Badge>;
}

function SidebarMenuLink({
  item,
  pathname,
  setOpenMobile,
}: {
  item: NavLink;
  pathname: string;
  setOpenMobile: (open: boolean) => void;
}) {
  const isActive = checkIsActive(pathname, item);
  const { state, isMobile } = useSidebar();
  const isCollapsed = state === 'collapsed' && !isMobile;
  const hasBadge = item.badge !== undefined && item.badge !== 0;

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
        <Link href={item.url} onClick={() => setOpenMobile(false)}>
          {item.icon && (
            <div className='relative'>
              <item.icon className='h-6 w-6' />
              {/* Show badge indicator when collapsed */}
              {isCollapsed && hasBadge && (
                <span className='absolute -right-1 -top-1 flex h-3 w-3'>
                  <span className='absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75'></span>
                  <span className='relative inline-flex h-3 w-3 rounded-full bg-red-500'></span>
                </span>
              )}
            </div>
          )}
          <span>{item.title}</span>
          {!isCollapsed && hasBadge && <NavBadge>{item.badge}</NavBadge>}
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

function SidebarMenuCollapsible({
  item,
  pathname,
  setOpenMobile,
}: {
  item: NavCollapsible;
  pathname: string;
  setOpenMobile: (open: boolean) => void;
}) {
  const isActive = checkIsActive(pathname, item, true);

  return (
    <Collapsible asChild defaultOpen={isActive} className='group/collapsible'>
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton tooltip={item.title}>
            {item.icon && <item.icon className='h-6 w-6' />}
            <span>{item.title}</span>
            {item.badge !== undefined && item.badge !== 0 && (
              <NavBadge>{item.badge}</NavBadge>
            )}
            <ChevronRight className='ms-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90' />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent className='CollapsibleContent'>
          <SidebarMenuSub>
            {item.items.map((subItem) => (
              <SidebarMenuSubItem key={subItem.title}>
                <SidebarMenuSubButton
                  asChild
                  isActive={checkIsActive(pathname, subItem)}
                >
                  <Link href={subItem.url} onClick={() => setOpenMobile(false)}>
                    {subItem.icon && <subItem.icon className='h-5 w-5' />}
                    <span>{subItem.title}</span>
                    {subItem.badge !== undefined && subItem.badge !== 0 && (
                      <NavBadge>{subItem.badge}</NavBadge>
                    )}
                  </Link>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  );
}

function SidebarMenuCollapsedDropdown({
  item,
  pathname,
}: {
  item: NavCollapsible;
  pathname: string;
}) {
  const isActive = checkIsActive(pathname, item);
  const hasBadge = item.badge !== undefined && item.badge !== 0;

  return (
    <SidebarMenuItem>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <SidebarMenuButton tooltip={item.title} isActive={isActive}>
            {item.icon && (
              <div className='relative'>
                <item.icon className='h-6 w-6' />
                {/* Show badge indicator when collapsed */}
                {hasBadge && (
                  <span className='absolute -right-1 -top-1 flex h-3 w-3'>
                    <span className='absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75'></span>
                    <span className='relative inline-flex h-3 w-3 rounded-full bg-red-500'></span>
                  </span>
                )}
              </div>
            )}
            <span>{item.title}</span>
          </SidebarMenuButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent side='right' align='start' sideOffset={4}>
          <DropdownMenuLabel>
            {item.title} {hasBadge ? `(${item.badge})` : ''}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {item.items.map((sub) => (
            <DropdownMenuItem key={`${sub.title}-${sub.url}`} asChild>
              <Link
                href={sub.url}
                className={cn(checkIsActive(pathname, sub) && 'bg-secondary')}
              >
                {sub.icon && <sub.icon className='mr-2 h-5 w-5' />}
                <span className='max-w-52 text-wrap'>{sub.title}</span>
                {sub.badge !== undefined && sub.badge !== 0 && (
                  <span className='ms-auto text-xs'>{sub.badge}</span>
                )}
              </Link>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  );
}

function checkIsActive(pathname: string, item: NavItem, mainNav = false) {
  // Exact match
  if (pathname === item.url) {
    return true;
  }

  // Match without query params
  if (pathname.split('?')[0] === item.url) {
    return true;
  }

  // Check if any child nav is active (for collapsible items)
  if ('items' in item) {
    if (item.items.some((i) => i.url === pathname)) {
      return true;
    }
  }

  // Main nav: check if first path segment matches
  if (mainNav) {
    const pathSegments = pathname.split('/').filter(Boolean);
    const itemSegments = item.url.split('/').filter(Boolean);
    if (pathSegments[0] && pathSegments[0] === itemSegments[0]) {
      return true;
    }
  }

  return false;
}
