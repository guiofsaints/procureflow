# shadcn-admin Layout Migration Plan

**Project**: ProcureFlow  
**Date**: November 7, 2025  
**Version**: 1.0  
**Status**: Ready for Implementation

---

## Executive Summary

This plan guides the migration of ProcureFlow's layout to shadcn-admin patterns in **7 incremental phases**, prioritizing non-breaking changes and continuous quality validation.

**Migration Philosophy**:

- ✅ **Incremental**: Each phase is independently testable
- ✅ **Non-breaking**: Preserve existing functionality
- ✅ **Quality-first**: Run checks after every phase
- ✅ **Documented**: Track changes and decisions

**Expected Outcome**:

- Modern, responsive layout with shadcn-admin patterns
- Enhanced UX (scroll effects, dropdowns, accessibility)
- Maintainable structure (separated concerns, external data)
- Zero visual breaking changes (same colors, similar feel)

---

## Phase Overview

| Phase | Scope                   | Effort | Risk   | Dependencies |
| ----- | ----------------------- | ------ | ------ | ------------ |
| **1** | Theme & Global Styles   | Low    | Low    | None         |
| **2** | Layout Shell Structure  | Medium | Low    | Phase 1      |
| **3** | Sidebar Enhancement     | High   | Medium | Phase 1, 2   |
| **4** | Header/Topbar           | Medium | Low    | Phase 2      |
| **5** | ThemeToggle Refactor    | Low    | Low    | None         |
| **6** | UserMenu & Navigation   | Medium | Low    | Phase 3      |
| **7** | Cleanup & Stabilization | Low    | Low    | All phases   |

**Total Estimated Time**: 2-3 days for experienced developer

---

## Phase 1: Theme & Global Styles Alignment

### 🎯 Objectives

- Add sidebar-specific CSS tokens
- Add missing radius token (`--radius-xl`)
- Integrate global style patterns (scrollbars, utilities, animations)
- Ensure Sidebar component has required theme variables

### 📦 Scope

**Files to modify**:

- `apps/web/src/styles/globals.css`

**Files to add**:

- None (all changes in existing file)

### 🔧 Implementation Steps

#### Step 1.1: Add Sidebar Tokens

**File**: `apps/web/src/styles/globals.css`

**Add to `@theme` block** (after existing tokens):

```css
@theme {
  /* ... existing tokens ... */

  /* Add radius-xl */
  --radius-xl: calc(var(--radius) + 4px);

  /* Add sidebar tokens (inherit from base) */
  --color-sidebar: var(--color-background);
  --color-sidebar-foreground: var(--color-foreground);
  --color-sidebar-primary: var(--color-primary);
  --color-sidebar-primary-foreground: var(--color-primary-foreground);
  --color-sidebar-accent: var(--color-accent);
  --color-sidebar-accent-foreground: var(--color-accent-foreground);
  --color-sidebar-border: var(--color-border);
  --color-sidebar-ring: var(--color-ring);
}
```

**Note**: Dark mode inherits automatically via `var()` references - no overrides needed.

---

#### Step 1.2: Add Scrollbar Styling

**Add to `@layer base` block** (after existing `*` selector):

```css
@layer base {
  * {
    @apply border-border outline-ring/50;
    scrollbar-width: thin;
    scrollbar-color: var(--color-border) transparent;
  }

  /* ... rest of base styles ... */
}
```

---

#### Step 1.3: Add Button Cursor & Mobile Input Fix

**Add to `@layer base` block** (after body styles):

```css
@layer base {
  /* ... existing base styles ... */

  /* Cursor pointer for buttons */
  button:not(:disabled),
  [role='button']:not(:disabled) {
    cursor: pointer;
  }

  /* Prevent focus zoom on mobile */
  @media screen and (max-width: 767px) {
    input,
    select,
    textarea {
      font-size: 16px !important;
    }
  }
}
```

---

#### Step 1.4: Add Custom Utilities

**Add after `@layer base` block**:

```css
/* Custom utilities */
@utility no-scrollbar {
  /* Hide scrollbar for Chrome, Safari and Opera */
  &::-webkit-scrollbar {
    display: none;
  }
  /* Hide scrollbar for IE, Edge and Firefox */
  -ms-overflow-style: none;
  scrollbar-width: none;
}

@utility faded-bottom {
  @apply after:pointer-events-none after:absolute after:start-0 
         after:bottom-0 after:hidden after:h-32 after:w-full 
         after:rounded-b-2xl 
         after:bg-[linear-gradient(180deg,_transparent_10%,_var(--color-background)_70%)] 
         md:after:block;
}
```

---

#### Step 1.5: Add Collapsible Animations

**Add after custom utilities**:

```css
/* Collapsible Content Animations */
.CollapsibleContent {
  overflow: hidden;
}
.CollapsibleContent[data-state='open'] {
  animation: slideDown 300ms ease-out;
}
.CollapsibleContent[data-state='closed'] {
  animation: slideUp 300ms ease-out;
}

@keyframes slideDown {
  from {
    height: 0;
  }
  to {
    height: var(--radix-collapsible-content-height);
  }
}

@keyframes slideUp {
  from {
    height: var(--radix-collapsible-content-height);
  }
  to {
    height: 0;
  }
}
```

---

### ✅ Quality Checks

Run these commands in sequence:

```bash
# Type check
pnpm type-check

# Lint
pnpm lint

# Build (verifies CSS is valid)
pnpm build
```

**Expected Results**:

- ✅ No TypeScript errors
- ✅ No linting errors
- ✅ Build succeeds
- ✅ No runtime CSS errors in browser console

---

### 🎯 Exit Criteria

- [ ] All sidebar tokens (`--color-sidebar-*`) are defined
- [ ] `--radius-xl` token is defined
- [ ] Scrollbar styling applies to all elements
- [ ] Button cursor changes on hover
- [ ] Mobile inputs don't zoom on focus
- [ ] Custom utilities (`no-scrollbar`, `faded-bottom`) are defined
- [ ] Collapsible animations are defined
- [ ] All quality checks pass
- [ ] No visual regressions in existing pages

---

## Phase 2: Layout Shell Structure

### 🎯 Objectives

- Create LayoutProvider context for variant management
- Extract Header to dedicated component
- Extract Main to dedicated component
- Add SkipToMain accessibility component
- Refactor AppShell to use new components

### 📦 Scope

**Files to add**:

- `apps/web/src/contexts/LayoutContext.tsx`
- `apps/web/src/components/layout/Header.tsx`
- `apps/web/src/components/layout/Main.tsx`
- `apps/web/src/components/layout/SkipToMain.tsx`

**Files to modify**:

- `apps/web/src/components/layout/AppShell.tsx`
- `apps/web/src/components/layout/index.ts` (exports)

### 🔧 Implementation Steps

#### Step 2.1: Create LayoutProvider

**File**: `apps/web/src/contexts/LayoutContext.tsx`

```typescript
'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';

type LayoutVariant = 'sidebar' | 'floating' | 'inset';
type CollapsibleMode = 'offcanvas' | 'icon' | 'none';
type LayoutMode = 'fixed' | 'scroll';

type LayoutContextType = {
  variant: LayoutVariant;
  setVariant: (variant: LayoutVariant) => void;
  collapsible: CollapsibleMode;
  setCollapsible: (collapsible: CollapsibleMode) => void;
  layout: LayoutMode;
  setLayout: (layout: LayoutMode) => void;
};

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

export function LayoutProvider({ children }: { children: ReactNode }) {
  const [variant, setVariant] = useState<LayoutVariant>('sidebar');
  const [collapsible, setCollapsible] = useState<CollapsibleMode>('icon');
  const [layout, setLayout] = useState<LayoutMode>('scroll');

  return (
    <LayoutContext.Provider
      value={{
        variant,
        setVariant,
        collapsible,
        setCollapsible,
        layout,
        setLayout,
      }}
    >
      {children}
    </LayoutContext.Provider>
  );
}

export function useLayout() {
  const context = useContext(LayoutContext);
  if (context === undefined) {
    throw new Error('useLayout must be used within a LayoutProvider');
  }
  return context;
}
```

---

#### Step 2.2: Create Header Component

**File**: `apps/web/src/components/layout/Header.tsx`

```typescript
'use client';

import { useEffect, useState } from 'react';

import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

type HeaderProps = React.HTMLAttributes<HTMLElement> & {
  fixed?: boolean;
};

export function Header({ className, fixed, children, ...props }: HeaderProps) {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      setOffset(document.body.scrollTop || document.documentElement.scrollTop);
    };

    // Add scroll listener to the document
    document.addEventListener('scroll', onScroll, { passive: true });

    // Clean up the event listener on unmount
    return () => document.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={cn(
        'z-50 h-16',
        fixed && 'header-fixed peer/header sticky top-0 w-[inherit]',
        offset > 10 && fixed ? 'shadow' : 'shadow-none',
        className
      )}
      {...props}
    >
      <div
        className={cn(
          'relative flex h-full items-center gap-3 p-4 sm:gap-4',
          offset > 10 &&
            fixed &&
            'after:bg-background/20 after:absolute after:inset-0 after:-z-10 after:backdrop-blur-lg'
        )}
      >
        <SidebarTrigger variant='outline' className='max-md:scale-125' />
        <Separator orientation='vertical' className='h-6' />
        {children}
      </div>
    </header>
  );
}
```

---

#### Step 2.3: Create Main Component

**File**: `apps/web/src/components/layout/Main.tsx`

```typescript
import { cn } from '@/lib/utils';

type MainProps = React.HTMLAttributes<HTMLElement> & {
  fixed?: boolean;
};

export function Main({ className, fixed, children, ...props }: MainProps) {
  return (
    <main
      id='main-content'
      data-layout={fixed ? 'fixed' : 'scroll'}
      className={cn(
        'flex flex-1 flex-col overflow-auto',
        fixed && '@lg/content:overflow-hidden',
        className
      )}
      {...props}
    >
      {children}
    </main>
  );
}
```

---

#### Step 2.4: Create SkipToMain Component

**File**: `apps/web/src/components/layout/SkipToMain.tsx`

```typescript
export function SkipToMain() {
  return (
    <a
      href='#main-content'
      className='sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-4 focus:left-4 focus:p-4 focus:bg-background focus:text-foreground focus:border focus:border-border focus:rounded-lg focus:shadow-lg'
    >
      Skip to main content
    </a>
  );
}
```

---

#### Step 2.5: Refactor AppShell

**File**: `apps/web/src/components/layout/AppShell.tsx`

```typescript
'use client';

import type { ReactNode } from 'react';

import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { LayoutProvider } from '@/contexts/LayoutContext';

import { AppSidebar } from './Sidebar';
import { Header } from './Header';
import { Main } from './Main';
import { SkipToMain } from './SkipToMain';

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
        <SidebarInset
          className='@container/content has-data-[layout=fixed]:h-svh peer-data-[variant=inset]:has-data-[layout=fixed]:h-[calc(100svh-(var(--spacing)*4))]'
        >
          <Header fixed>
            {/* Header content will be customizable per page */}
            <div className='flex-1'>
              {/* Page title placeholder */}
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
```

---

#### Step 2.6: Update Exports

**File**: `apps/web/src/components/layout/index.ts`

```typescript
export { AppShell } from './AppShell';
export { AppSidebar } from './Sidebar';
export { Header } from './Header';
export { Main } from './Main';
export { SkipToMain } from './SkipToMain';
export { ThemeToggle } from './ThemeToggle';
export { UserMenu } from './UserMenu';
```

---

### ✅ Quality Checks

```bash
# Type check
pnpm type-check

# Lint
pnpm lint

# Build
pnpm build

# Run dev server and test
pnpm dev
```

**Manual Testing**:

- [ ] Navigate to `/catalog`, `/cart`, `/agent`
- [ ] Verify header appears with scroll effects
- [ ] Tab to skip link (should appear on focus)
- [ ] Press Enter on skip link (should jump to main content)
- [ ] Check mobile responsiveness
- [ ] Toggle sidebar (Ctrl+B or trigger button)

---

### 🎯 Exit Criteria

- [ ] LayoutProvider context is created and working
- [ ] Header component renders with scroll effects
- [ ] Main component has correct ID and data-layout attribute
- [ ] SkipToMain appears on keyboard focus
- [ ] AppShell uses all new components correctly
- [ ] All quality checks pass
- [ ] No layout shifts or visual regressions
- [ ] Sidebar trigger works correctly

---

## Phase 3: Sidebar Enhancement

### 🎯 Objectives

- Extract navigation data to external file
- Create NavGroup component for organized navigation
- Add support for collapsible sub-navigation
- Add SidebarRail for hover interaction
- Integrate LayoutProvider for variant/collapsible props

### 📦 Scope

**Files to add**:

- `apps/web/src/components/layout/data/sidebar-data.ts`
- `apps/web/src/components/layout/NavGroup.tsx`
- `apps/web/src/components/layout/types.ts`

**Files to modify**:

- `apps/web/src/components/layout/Sidebar.tsx`

### 🔧 Implementation Steps

#### Step 3.1: Define Navigation Types

**File**: `apps/web/src/components/layout/types.ts`

```typescript
import type { LucideIcon } from 'lucide-react';

export type NavLink = {
  title: string;
  url: string;
  icon?: LucideIcon;
  badge?: number | string;
};

export type NavCollapsible = {
  title: string;
  url: string;
  icon?: LucideIcon;
  badge?: number | string;
  items: NavLink[];
};

export type NavItem = NavLink | NavCollapsible;

export type NavGroup = {
  title: string;
  items: NavItem[];
};

export type SidebarData = {
  navGroups: NavGroup[];
  user: {
    name: string;
    email: string;
    avatar?: string;
  };
};
```

---

#### Step 3.2: Create Navigation Data File

**File**: `apps/web/src/components/layout/data/sidebar-data.ts`

```typescript
import { MessageSquare, Package, ShoppingCart } from 'lucide-react';

import type { SidebarData } from '../types';

export const sidebarData: SidebarData = {
  navGroups: [
    {
      title: 'General',
      items: [
        {
          title: 'Catalog',
          url: '/catalog',
          icon: Package,
        },
        {
          title: 'Cart',
          url: '/cart',
          icon: ShoppingCart,
          badge: 0, // Will be updated dynamically from CartContext
        },
        {
          title: 'Agent',
          url: '/agent',
          icon: MessageSquare,
        },
      ],
    },
  ],
  user: {
    name: 'Demo User',
    email: 'demo@procureflow.com',
    avatar: '',
  },
};
```

---

#### Step 3.3: Create NavGroup Component

**File**: `apps/web/src/components/layout/NavGroup.tsx`

```typescript
'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight } from 'lucide-react';

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
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
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

import type {
  NavCollapsible,
  NavItem,
  NavLink,
  NavGroup as NavGroupProps,
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

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        isActive={isActive}
        tooltip={item.title}
      >
        <Link href={item.url} onClick={() => setOpenMobile(false)}>
          {item.icon && <item.icon className='h-5 w-5' />}
          <span>{item.title}</span>
          {item.badge !== undefined && item.badge !== 0 && (
            <NavBadge>{item.badge}</NavBadge>
          )}
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
    <Collapsible
      asChild
      defaultOpen={isActive}
      className='group/collapsible'
    >
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton tooltip={item.title}>
            {item.icon && <item.icon className='h-5 w-5' />}
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
                    {subItem.icon && <subItem.icon className='h-4 w-4' />}
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

  return (
    <SidebarMenuItem>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <SidebarMenuButton tooltip={item.title} isActive={isActive}>
            {item.icon && <item.icon className='h-5 w-5' />}
            <span>{item.title}</span>
            {item.badge !== undefined && item.badge !== 0 && (
              <NavBadge>{item.badge}</NavBadge>
            )}
          </SidebarMenuButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent side='right' align='start' sideOffset={4}>
          <DropdownMenuLabel>
            {item.title}{' '}
            {item.badge !== undefined && item.badge !== 0
              ? `(${item.badge})`
              : ''}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {item.items.map((sub) => (
            <DropdownMenuItem key={`${sub.title}-${sub.url}`} asChild>
              <Link
                href={sub.url}
                className={cn(checkIsActive(pathname, sub) && 'bg-secondary')}
              >
                {sub.icon && <sub.icon className='mr-2 h-4 w-4' />}
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
  if (pathname === item.url) return true;

  // Match without query params
  if (pathname.split('?')[0] === item.url) return true;

  // Check if any child nav is active (for collapsible items)
  if ('items' in item) {
    if (item.items.some((i) => i.url === pathname)) return true;
  }

  // Main nav: check if first path segment matches
  if (mainNav) {
    const pathSegments = pathname.split('/').filter(Boolean);
    const itemSegments = item.url.split('/').filter(Boolean);
    if (pathSegments[0] && pathSegments[0] === itemSegments[0]) return true;
  }

  return false;
}
```

---

#### Step 3.4: Update Sidebar Component

**File**: `apps/web/src/components/layout/Sidebar.tsx`

```typescript
'use client';

import Link from 'next/link';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
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
import { UserMenu } from './UserMenu';

/**
 * AppSidebar component using shadcn Sidebar
 *
 * Features:
 * - Logo/title at top
 * - Navigation groups in middle
 * - User menu at bottom
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

      {/* Navigation Groups */}
      <SidebarContent>
        {navGroups.map((group) => (
          <NavGroup key={group.title} {...group} />
        ))}
      </SidebarContent>

      {/* Bottom Section: User Menu */}
      <SidebarFooter>
        <UserMenu user={sidebarData.user} />
      </SidebarFooter>

      {/* Rail for hover-to-expand */}
      <SidebarRail />
    </Sidebar>
  );
}
```

---

### ✅ Quality Checks

```bash
pnpm type-check
pnpm lint
pnpm build
pnpm dev
```

**Manual Testing**:

- [ ] Navigation renders correctly
- [ ] Active state highlights current page
- [ ] Cart badge updates when items added/removed
- [ ] Collapsed sidebar shows dropdowns for nav groups
- [ ] Expanded sidebar shows collapsible sub-nav (if added)
- [ ] SidebarRail appears and allows hover-to-expand
- [ ] Mobile sidebar works (sheet overlay)

---

### 🎯 Exit Criteria

- [ ] Navigation data is external (`sidebar-data.ts`)
- [ ] NavGroup component handles flat and collapsible items
- [ ] Sidebar uses LayoutProvider props correctly
- [ ] SidebarRail is present and functional
- [ ] Cart badge updates dynamically
- [ ] Active states work correctly
- [ ] All quality checks pass
- [ ] No TypeScript errors

---

## Phase 4: Header/Topbar Enhancement

### 🎯 Objectives

- Move ThemeToggle to header
- Move UserMenu to header (create separate ProfileDropdown for header)
- Add page title support
- Verify scroll effects work correctly

### 📦 Scope

**Files to add**:

- `apps/web/src/components/layout/ProfileDropdown.tsx` (optional, or reuse UserMenu)

**Files to modify**:

- `apps/web/src/components/layout/AppShell.tsx`
- `apps/web/src/components/layout/Sidebar.tsx` (remove ThemeToggle)
- Page files (to customize header content)

### 🔧 Implementation Steps

#### Step 4.1: Update AppShell Header

**File**: `apps/web/src/components/layout/AppShell.tsx`

```typescript
// Update Header section in AppShell
<Header fixed>
  {/* Left: Empty for now (pages can add breadcrumbs) */}
  <div className='flex-1'>
    {/* Pages will insert title here via slots/props if needed */}
  </div>

  {/* Right: Actions */}
  <div className='flex items-center gap-2'>
    <ThemeToggle />
    <UserMenu user={sidebarData.user} />
  </div>
</Header>
```

---

#### Step 4.2: Remove ThemeToggle from Sidebar Footer

**File**: `apps/web/src/components/layout/Sidebar.tsx`

```typescript
// Remove ThemeToggle import and usage from SidebarFooter
// Footer now only has UserMenu
<SidebarFooter>
  <UserMenu user={sidebarData.user} />
</SidebarFooter>
```

---

#### Step 4.3: Update Page Files (Optional)

For pages that want custom headers, they can pass content via context or props (future enhancement).

For now, the header is static with ThemeToggle + UserMenu on the right.

---

### ✅ Quality Checks

```bash
pnpm type-check
pnpm lint
pnpm build
pnpm dev
```

**Manual Testing**:

- [ ] Header renders on all pages
- [ ] Scroll down - shadow and blur appear after 10px
- [ ] ThemeToggle is in header (not sidebar)
- [ ] UserMenu is in header (still in sidebar footer too for now)
- [ ] Both work correctly

---

### 🎯 Exit Criteria

- [ ] Header has ThemeToggle and UserMenu in right section
- [ ] Scroll effects (shadow, glassmorphism) work
- [ ] All pages show header correctly
- [ ] All quality checks pass

---

## Phase 5: ThemeToggle Refactor

### 🎯 Objectives

- Add dropdown pattern with 3 options (light/dark/system)
- Add animated icon transitions
- Add checkmark indicators
- Add meta tag theme-color updates

### 📦 Scope

**Files to modify**:

- `apps/web/src/components/layout/ThemeToggle.tsx`

### 🔧 Implementation Steps

#### Step 5.1: Refactor ThemeToggle

**File**: `apps/web/src/components/layout/ThemeToggle.tsx`

```typescript
'use client';

import { Check, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Update theme-color meta tag when theme changes
  useEffect(() => {
    if (!mounted) return;

    const themeColor = theme === 'dark' ? '#212121' : '#fff';
    const metaThemeColor = document.querySelector("meta[name='theme-color']");
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', themeColor);
    }
  }, [theme, mounted]);

  if (!mounted) {
    return (
      <Button variant='ghost' size='icon' className='rounded-full' disabled>
        <Sun className='h-5 w-5' />
        <span className='sr-only'>Toggle theme</span>
      </Button>
    );
  }

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant='ghost' size='icon' className='rounded-full'>
          <Sun className='h-5 w-5 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90' />
          <Moon className='absolute h-5 w-5 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0' />
          <span className='sr-only'>Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end'>
        <DropdownMenuItem onClick={() => setTheme('light')}>
          Light
          <Check
            size={14}
            className={cn('ms-auto', theme !== 'light' && 'hidden')}
          />
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('dark')}>
          Dark
          <Check
            size={14}
            className={cn('ms-auto', theme !== 'dark' && 'hidden')}
          />
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('system')}>
          System
          <Check
            size={14}
            className={cn('ms-auto', theme !== 'system' && 'hidden')}
          />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

---

### ✅ Quality Checks

```bash
pnpm type-check
pnpm lint
pnpm build
pnpm dev
```

**Manual Testing**:

- [ ] Click theme toggle - dropdown appears
- [ ] Select "Light" - theme changes, checkmark appears
- [ ] Select "Dark" - theme changes, checkmark appears
- [ ] Select "System" - theme matches OS preference, checkmark appears
- [ ] Icon animates smoothly (scale + rotate)
- [ ] Meta tag updates (inspect `<meta name='theme-color'>`)

---

### 🎯 Exit Criteria

- [ ] Dropdown has 3 options
- [ ] Icon transitions are smooth
- [ ] Checkmark shows for active theme
- [ ] Meta tag updates correctly
- [ ] System theme respects OS preference
- [ ] All quality checks pass

---

## Phase 6: UserMenu & Navigation Patterns

### 🎯 Objectives

- Refactor UserMenu with shadcn-admin patterns
- Add menu groups and separators
- Integrate with NextAuth session (if available)
- Add sign-out confirmation dialog

### 📦 Scope

**Files to add**:

- `apps/web/src/components/layout/SignOutDialog.tsx`

**Files to modify**:

- `apps/web/src/components/layout/UserMenu.tsx`

### 🔧 Implementation Steps

#### Step 6.1: Create SignOutDialog

**File**: `apps/web/src/components/layout/SignOutDialog.tsx`

```typescript
'use client';

import { signOut } from 'next-auth/react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

type SignOutDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function SignOutDialog({ open, onOpenChange }: SignOutDialogProps) {
  const handleSignOut = () => {
    signOut({ callbackUrl: '/' });
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Sign out</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to sign out? You'll need to sign in again to
            access your account.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleSignOut}>
            Sign out
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
```

---

#### Step 6.2: Refactor UserMenu

**File**: `apps/web/src/components/layout/UserMenu.tsx`

```typescript
'use client';

import { useState } from 'react';
import { BadgeCheck, ChevronsUpDown, LogOut, Settings, User } from 'lucide-react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';

import { SignOutDialog } from './SignOutDialog';

type UserMenuProps = {
  user?: {
    name: string;
    email: string;
    avatar?: string;
  };
};

/**
 * UserMenu component with dropdown functionality
 * Shows user avatar, name, and dropdown menu with options
 * Can be placed in sidebar footer or header
 */
export function UserMenu({ user: propUser }: UserMenuProps) {
  const { data: session } = useSession();
  const { isMobile } = useSidebar();
  const [signOutDialogOpen, setSignOutDialogOpen] = useState(false);

  // Use session data if available, fallback to prop user or defaults
  const user = {
    name: session?.user?.name || propUser?.name || 'Guest',
    email: session?.user?.email || propUser?.email || 'guest@procureflow.com',
    initials:
      session?.user?.name
        ?.split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase() ||
      propUser?.name
        ?.split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase() ||
      'GU',
  };

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size='lg'
                className='data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground'
              >
                <Avatar className='h-8 w-8 rounded-lg'>
                  <AvatarFallback className='bg-primary text-primary-foreground rounded-lg'>
                    {user.initials}
                  </AvatarFallback>
                </Avatar>

                <div className='grid flex-1 text-start text-sm leading-tight'>
                  <span className='truncate font-semibold'>{user.name}</span>
                  <span className='truncate text-xs'>{user.email}</span>
                </div>

                <ChevronsUpDown className='ms-auto size-4' />
              </SidebarMenuButton>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              className='w-56'
              side={isMobile ? 'bottom' : 'right'}
              align='end'
              sideOffset={4}
            >
              <DropdownMenuLabel className='p-0 font-normal'>
                <div className='flex items-center gap-2 px-1 py-1.5 text-start text-sm'>
                  <Avatar className='h-8 w-8 rounded-lg'>
                    <AvatarFallback className='bg-primary text-primary-foreground rounded-lg'>
                      {user.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className='grid flex-1 text-start text-sm leading-tight'>
                    <span className='truncate font-semibold'>{user.name}</span>
                    <span className='truncate text-xs'>{user.email}</span>
                  </div>
                </div>
              </DropdownMenuLabel>

              <DropdownMenuSeparator />

              <DropdownMenuGroup>
                <DropdownMenuItem asChild>
                  <Link href='/settings/profile'>
                    <BadgeCheck className='mr-2 h-4 w-4' />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href='/settings'>
                    <Settings className='mr-2 h-4 w-4' />
                    Settings
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuGroup>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                variant='destructive'
                onClick={() => setSignOutDialogOpen(true)}
              >
                <LogOut className='mr-2 h-4 w-4' />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>

      <SignOutDialog
        open={signOutDialogOpen}
        onOpenChange={setSignOutDialogOpen}
      />
    </>
  );
}
```

---

### ✅ Quality Checks

```bash
pnpm type-check
pnpm lint
pnpm build
pnpm dev
```

**Manual Testing**:

- [ ] UserMenu shows correct user info (from session or props)
- [ ] Dropdown opens correctly (bottom on mobile, right on desktop)
- [ ] Profile and Settings links navigate correctly
- [ ] Sign out button opens confirmation dialog
- [ ] Confirming sign out triggers NextAuth signOut
- [ ] User info displays correctly with avatar initials

---

### 🎯 Exit Criteria

- [ ] UserMenu uses SidebarMenu/SidebarMenuItem wrapper
- [ ] Dropdown has grouped menu items
- [ ] Sign-out confirmation dialog works
- [ ] NextAuth session integration works (if auth is configured)
- [ ] Links navigate correctly
- [ ] All quality checks pass

---

## Phase 7: Cleanup & Stabilization

### 🎯 Objectives

- Remove temporary shadcn-admin clone
- Create final documentation
- Run full quality suite
- Fix any remaining issues
- Verify all pages work correctly

### 📦 Scope

**Files to add**:

- `apps/web/src/styles/layout-from-shadcn-admin-notes.md`
- `.guided/assessment/shadcn-admin-layout-refactor-status.md`

**Files to clean**:

- Temp directory with shadcn-admin clone

### 🔧 Implementation Steps

#### Step 7.1: Remove Temp Clone

```bash
# PowerShell
Remove-Item -Recurse -Force (Join-Path $env:TEMP "shadcn-admin-temp")
```

---

#### Step 7.2: Create Layout Notes

**File**: `apps/web/src/styles/layout-from-shadcn-admin-notes.md`

```markdown
# Layout Patterns from shadcn-admin

**Migration Date**: November 7, 2025  
**Reference**: https://github.com/satnaing/shadcn-admin

## Adopted Patterns

### 1. Theme Tokens

- Added `--color-sidebar-*` tokens (8 total) in `globals.css`
- Added `--radius-xl` token
- Sidebar tokens inherit from base tokens for consistency

### 2. Global Styles

- Thin scrollbars with themed colors
- Button cursor pointer
- Mobile input zoom prevention
- Custom utilities (`no-scrollbar`, `faded-bottom`)
- Collapsible animations (slideDown, slideUp)

### 3. Layout Shell

- `LayoutProvider` context for variant management
- `Header` component with scroll effects (shadow, glassmorphism)
- `Main` component with data-layout attribute
- `SkipToMain` accessibility component

### 4. Sidebar Structure

- Three-part layout: `SidebarHeader`, `SidebarContent`, `SidebarFooter`
- `NavGroup` component for organized navigation
- External navigation data (`sidebar-data.ts`)
- `SidebarRail` for hover-to-expand
- Collapsible sub-navigation support
- Adaptive rendering (dropdown when collapsed, collapsible when expanded)

### 5. Header/Topbar

- Scroll detection for shadow + blur effects
- Glassmorphism backdrop (`backdrop-blur-lg`)
- `SidebarTrigger` + `Separator` pattern
- Flexible children for page title + actions

### 6. Theme Toggle

- Dropdown with 3 options (light/dark/system)
- Animated icon transitions (scale + rotate)
- Checkmark indicators for active selection
- Meta tag theme-color updates

### 7. User Menu

- `SidebarMenu`/`SidebarMenuItem` wrapper
- Grouped menu items with separators
- Sign-out confirmation dialog
- NextAuth session integration
- Adaptive positioning (mobile vs desktop)

## Component Mapping

| ProcureFlow         | shadcn-admin Equivalent        |
| ------------------- | ------------------------------ |
| `AppShell.tsx`      | `AuthenticatedLayout.tsx`      |
| `Sidebar.tsx`       | `AppSidebar.tsx`               |
| `Header.tsx`        | `Header.tsx` (added)           |
| `Main.tsx`          | `Main.tsx` (added)             |
| `NavGroup.tsx`      | `NavGroup.tsx` (added)         |
| `ThemeToggle.tsx`   | `ThemeSwitch.tsx` (refactored) |
| `UserMenu.tsx`      | `NavUser.tsx` (refactored)     |
| `LayoutContext.tsx` | `LayoutProvider` (added)       |
| `SkipToMain.tsx`    | `SkipToMain.tsx` (added)       |

## File Locations

| Component/Feature | File Path                                        |
| ----------------- | ------------------------------------------------ |
| Layout context    | `src/contexts/LayoutContext.tsx`                 |
| Navigation data   | `src/components/layout/data/sidebar-data.ts`     |
| Navigation types  | `src/components/layout/types.ts`                 |
| Theme tokens      | `src/styles/globals.css` (@theme block)          |
| Global styles     | `src/styles/globals.css` (@layer base, @utility) |

## Deliberate Deviations

1. **Color Space**: Kept Tailwind's default palette instead of OKLCH (for stability)
2. **Sidebar Variants**: Implemented variant support but default to `sidebar` variant
3. **TeamSwitcher**: Not implemented (not needed for ProcureFlow)
4. **SearchProvider**: Not implemented (command-K search is optional)
5. **Font Switcher**: Not implemented (not needed)

## Future Improvements

1. Add cookie persistence for sidebar state (`getCookie('sidebar_state')`)
2. Add UI for layout variant switching (demo feature)
3. Consider OKLCH color space for smoother dark mode transitions
4. Add chart colors if dashboard/analytics features are added
5. Add command-K search functionality

## Maintenance Tips

- **Theme tokens**: All in `globals.css` @theme block
- **Navigation**: Update `sidebar-data.ts` to add/remove nav items
- **Layout variants**: Adjust via `LayoutProvider` context
- **Scroll effects**: Configured in `Header.tsx` (threshold: 10px)
- **Animations**: Collapsible animations use `CollapsibleContent` class

---

_Last updated: November 7, 2025_
```

---

#### Step 7.3: Run Full Quality Suite

```bash
# Type check
pnpm type-check

# Lint
pnpm lint

# Format (if format script exists)
pnpm format

# Build
pnpm build

# Test (if test script exists)
pnpm test
```

---

#### Step 7.4: Create Status Document

**File**: `.guided/assessment/shadcn-admin-layout-refactor-status.md`

```markdown
# shadcn-admin Layout Refactor Status

**Date**: November 7, 2025  
**Migration Plan**: `shadcn-admin-layout-migration-plan.md`  
**Status**: ✅ Complete

---

## Phase Completion

| Phase                                | Status      | Notes                                          |
| ------------------------------------ | ----------- | ---------------------------------------------- |
| **Phase 1**: Theme & Global Styles   | ✅ Complete | All tokens and utilities added                 |
| **Phase 2**: Layout Shell Structure  | ✅ Complete | LayoutProvider, Header, Main, SkipToMain added |
| **Phase 3**: Sidebar Enhancement     | ✅ Complete | NavGroup, navigation data, SidebarRail added   |
| **Phase 4**: Header/Topbar           | ✅ Complete | ThemeToggle and UserMenu in header             |
| **Phase 5**: ThemeToggle Refactor    | ✅ Complete | Dropdown with 3 options, animations            |
| **Phase 6**: UserMenu & Navigation   | ✅ Complete | Groups, separators, sign-out dialog            |
| **Phase 7**: Cleanup & Stabilization | ✅ Complete | Docs, quality checks, temp cleanup             |

---

## Verification Checklist

### Layout & Navigation

- [x] Sidebar renders with logo, nav groups, user menu
- [x] Navigation items highlight active page correctly
- [x] Cart badge updates dynamically
- [x] Collapsed sidebar shows dropdowns
- [x] Expanded sidebar shows collapsible groups (if configured)
- [x] SidebarRail allows hover-to-expand
- [x] Mobile sidebar works (sheet overlay)

### Header & Scroll Effects

- [x] Header renders on all pages
- [x] Scroll down > 10px triggers shadow
- [x] Glassmorphism effect appears on scroll
- [x] SidebarTrigger button works
- [x] Separator shows after trigger

### Theme Toggle

- [x] Dropdown opens with 3 options (light/dark/system)
- [x] Icons animate smoothly (scale + rotate)
- [x] Checkmark appears for active theme
- [x] System theme respects OS preference
- [x] Meta tag theme-color updates

### User Menu

- [x] Shows correct user info (name, email, initials)
- [x] Dropdown opens correctly (adaptive positioning)
- [x] Profile and Settings links navigate
- [x] Sign out opens confirmation dialog
- [x] Confirming sign out triggers logout

### Accessibility

- [x] Skip to main link appears on Tab focus
- [x] Pressing Enter on skip link jumps to main content
- [x] Sidebar keyboard shortcuts work (Ctrl+B)
- [x] All interactive elements are keyboard-accessible

### Responsive Design

- [x] Desktop layout works correctly
- [x] Tablet layout works correctly
- [x] Mobile layout works correctly (sheet overlay)
- [x] Sidebar trigger scales on mobile

### Quality Checks

- [x] TypeScript compiles without errors
- [x] ESLint passes with zero warnings
- [x] Build succeeds
- [x] All pages load without errors
- [x] No console errors in browser
- [x] No visual regressions

---

## Known Issues

None at this time.

---

## Future TODOs

1. **Cookie Persistence**: Implement `getCookie('sidebar_state')` in AppShell
2. **Layout Variant Switcher**: Add UI to switch between sidebar/floating/inset (demo feature)
3. **Dynamic Header Content**: Allow pages to pass custom header content (title, breadcrumbs, actions)
4. **OKLCH Migration**: Consider migrating to OKLCH color space for smoother transitions
5. **Command-K Search**: Implement SearchProvider and command palette

---

## Maintenance Notes

- **Navigation**: Update `src/components/layout/data/sidebar-data.ts`
- **Theme**: Modify `src/styles/globals.css` @theme block
- **Layout Variants**: Adjust via `LayoutProvider` context
- **Scroll Effects**: Configured in `Header.tsx` (threshold: 10px)

---

_Refactor completed: November 7, 2025_
```

---

### ✅ Final Quality Checks

```bash
# Full suite
pnpm type-check
pnpm lint
pnpm build

# Manual testing
pnpm dev
```

**Manual Verification**:

- [ ] Navigate to all pages (catalog, cart, agent, landing)
- [ ] Toggle sidebar (Ctrl+B and trigger button)
- [ ] Change theme (light/dark/system)
- [ ] Open user menu, click links
- [ ] Test sign out flow
- [ ] Check mobile responsiveness
- [ ] Tab through page (test skip link)
- [ ] Verify scroll effects on all pages

---

### 🎯 Exit Criteria

- [ ] Temp clone removed
- [ ] Documentation complete (`layout-from-shadcn-admin-notes.md`, status doc)
- [ ] All quality checks pass
- [ ] All verification checklist items completed
- [ ] No known bugs or issues
- [ ] Layout matches shadcn-admin patterns
- [ ] No visual regressions
- [ ] Performance is acceptable

---

## Global Checklist

**Use this checklist to track overall progress:**

- [ ] **Phase 1**: Theme & global styles aligned and consistent
- [ ] **Phase 2**: Layout shell behaves as expected on desktop and mobile
- [ ] **Phase 3**: Sidebar is organized with nav groups and collapsible support
- [ ] **Phase 4**: Header has scroll effects and proper structure
- [ ] **Phase 5**: Theme toggle uses dropdown with 3 options
- [ ] **Phase 6**: User menu has grouped items and sign-out dialog
- [ ] **Phase 7**: All quality commands pass, documentation complete

- [ ] All components render correctly
- [ ] Navigation works correctly
- [ ] Theme switching works
- [ ] User menu works
- [ ] Responsive design works (mobile/tablet/desktop)
- [ ] Accessibility features work (skip link, keyboard navigation)
- [ ] No TypeScript errors
- [ ] No linting errors
- [ ] Build succeeds
- [ ] No runtime errors
- [ ] No visual regressions

---

## Rollback Plan

If issues arise during migration:

1. **Git**: Commit after each phase for easy rollback
2. **Feature flags**: Optionally wrap new components in feature flags
3. **Parallel paths**: Keep old components temporarily if needed
4. **Testing**: Test each phase independently before proceeding

**Recommended Git Strategy**:

```bash
git checkout -b feat/shadcn-admin-layout-refactor

# After each phase:
git add .
git commit -m "feat(layout): Phase N - <description>"

# After all phases:
git push origin feat/shadcn-admin-layout-refactor
# Create PR for review
```

---

## Success Criteria

Migration is successful when:

- ✅ All 7 phases complete
- ✅ All verification checklist items pass
- ✅ No regressions in existing features
- ✅ Layout matches shadcn-admin patterns
- ✅ Code is clean, typed, and documented
- ✅ Quality checks pass (type-check, lint, build)
- ✅ Team approves PR

---

_Migration plan ready. Begin with Phase 1._
