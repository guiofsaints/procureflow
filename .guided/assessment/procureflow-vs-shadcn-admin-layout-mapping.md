# ProcureFlow vs shadcn-admin Layout Mapping

**Date**: November 7, 2025  
**Purpose**: De-para mapping for layout migration strategy

---

## Executive Summary

This document maps ProcureFlow's current layout implementation to shadcn-admin's patterns, identifying:

- ✅ **What to keep** from ProcureFlow (working patterns)
- 🔄 **What to refactor** (align with shadcn-admin)
- ➕ **What to add** (missing features)
- ❌ **What to remove/deprecate** (redundant code)

**Migration Philosophy**: Preserve ProcureFlow's visual identity and business logic while adopting shadcn-admin's structural patterns for maintainability and modern UX.

---

## De-Para Mapping Table

| Area                | ProcureFlow Current                            | shadcn-admin Reference                         | Migration Strategy                                              |
| ------------------- | ---------------------------------------------- | ---------------------------------------------- | --------------------------------------------------------------- |
| **Layout Shell**    | `AppShell.tsx` (simple wrapper)                | `AuthenticatedLayout.tsx` (full providers)     | 🔄 **Refactor**: Add LayoutProvider, preserve Next.js patterns  |
| **Sidebar**         | `Sidebar.tsx` (basic w/ header/content/footer) | `AppSidebar.tsx` + `NavGroup.tsx`              | 🔄 **Refactor**: Add nav groups, collapsible logic, SidebarRail |
| **Header/Topbar**   | Inline in `AppShell.tsx` (minimal)             | `Header.tsx` (scroll effects, glassmorphism)   | ➕ **Add**: Extract to `Header.tsx` with scroll detection       |
| **Theme Toggle**    | `ThemeToggle.tsx` (button with icon swap)      | `ThemeSwitch.tsx` (dropdown with 3 options)    | 🔄 **Refactor**: Add dropdown, keep next-themes integration     |
| **User Menu**       | `UserMenu.tsx` (dropdown in sidebar footer)    | `NavUser.tsx` (enhanced dropdown)              | 🔄 **Refactor**: Improve structure, add menu groups             |
| **Theme CSS**       | `globals.css` (Tailwind palette, @theme block) | `theme.css` (OKLCH, sidebar tokens)            | 🔄 **Enhance**: Add sidebar tokens, keep color values           |
| **Global Styles**   | `globals.css` (animations, overflow fixes)     | `index.css` (utilities, scrollbar, animations) | 🔄 **Merge**: Add utilities, collapsible animations             |
| **Navigation Data** | Inline in `Sidebar.tsx`                        | `data/sidebar-data.ts` (external)              | 🔄 **Extract**: Create data file for nav items                  |
| **Page Container**  | Inline `<div className="container mx-auto">`   | `Main.tsx` (with data-layout)                  | ➕ **Add**: Dedicated Main component                            |
| **Layout Provider** | ❌ Not implemented                             | `LayoutProvider` (variant, collapsible)        | ➕ **Add**: For sidebar variant management                      |
| **Skip to Main**    | ❌ Not implemented                             | `SkipToMain.tsx`                               | ➕ **Add**: Accessibility feature                               |

---

## Detailed Area-by-Area Comparison

### 1. Layout Shell

#### ProcureFlow: `AppShell.tsx`

**Current Structure**:

```tsx
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
```

**Characteristics**:

- ✅ Uses SidebarProvider correctly
- ✅ Sidebar + SidebarInset pattern
- ⚠️ Header is inline (not extractable)
- ⚠️ No LayoutProvider for variant management
- ⚠️ No skip link for accessibility

---

#### shadcn-admin: `AuthenticatedLayout.tsx`

**Current Structure**:

```tsx
<SearchProvider>
  <LayoutProvider>
    <SidebarProvider defaultOpen={cookieState}>
      <SkipToMain />
      <AppSidebar />
      <SidebarInset className='@container/content ...'>{children}</SidebarInset>
    </SidebarProvider>
  </LayoutProvider>
</SearchProvider>
```

**Characteristics**:

- ✅ Full provider stack (Search, Layout, Sidebar)
- ✅ Skip link for keyboard navigation
- ✅ Container queries (`@container/content`)
- ✅ Cookie persistence for sidebar state
- ✅ Data attributes for conditional styling

---

#### Migration Notes

**Keep from ProcureFlow**:

- SidebarProvider usage
- Next.js `children` prop (no `<Outlet />`)
- Basic structure

**Adopt from shadcn-admin**:

- Add `LayoutProvider` wrapper
- Add `<SkipToMain />` component
- Add `@container/content` class to SidebarInset
- Extract header to separate component
- Add cookie-based `defaultOpen` state

**Implementation**:

```tsx
// New AppShell.tsx
<LayoutProvider>
  <SidebarProvider defaultOpen={getCookie('sidebar_state') !== 'false'}>
    <SkipToMain />
    <AppSidebar />
    <SidebarInset className='@container/content ...'>{children}</SidebarInset>
  </SidebarProvider>
</LayoutProvider>
```

**Note**: SearchProvider is optional (only if command-K search is implemented).

---

### 2. Sidebar

#### ProcureFlow: `Sidebar.tsx`

**Current Structure**:

```tsx
<Sidebar>
  <SidebarHeader>
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton size='lg' asChild>
          <Link href='/catalog'>
            {/* Logo + "ProcureFlow" */}
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  </SidebarHeader>

  <SidebarContent>
    <SidebarGroup>
      <SidebarGroupContent>
        <SidebarMenu>
          {navItems.map(item => (
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={...}>
                <Link href={item.href}>
                  <Icon />
                  <span>{item.label}</span>
                  {/* Badge */}
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  </SidebarContent>

  <SidebarFooter>
    <SidebarMenu>
      <ThemeToggle />
      <UserMenu />
    </SidebarMenu>
  </SidebarFooter>
</Sidebar>
```

**Characteristics**:

- ✅ Correct three-part structure (Header/Content/Footer)
- ✅ Logo in header
- ✅ Theme toggle and user menu in footer
- ✅ Badge support for cart count
- ⚠️ Nav items inline (not in external data file)
- ⚠️ No nav groups (flat list)
- ⚠️ No collapsible sub-nav support
- ⚠️ No SidebarRail

---

#### shadcn-admin: `AppSidebar.tsx`

**Current Structure**:

```tsx
<Sidebar collapsible={collapsible} variant={variant}>
  <SidebarHeader>
    <TeamSwitcher teams={teams} />
  </SidebarHeader>

  <SidebarContent>
    {navGroups.map((group) => (
      <NavGroup key={group.title} {...group} />
    ))}
  </SidebarContent>

  <SidebarFooter>
    <NavUser user={user} />
  </SidebarFooter>

  <SidebarRail />
</Sidebar>
```

**Characteristics**:

- ✅ Uses LayoutProvider for `collapsible` and `variant` props
- ✅ Navigation data from external file
- ✅ NavGroup component for grouped navigation
- ✅ SidebarRail for hover-to-expand interaction
- ✅ Adaptive rendering (collapsed dropdown vs expanded collapsible)

---

#### Migration Notes

**Keep from ProcureFlow**:

- Logo in header (replace TeamSwitcher if not needed)
- Cart badge logic
- Theme toggle in footer (or move to header)
- Next.js Link components

**Adopt from shadcn-admin**:

- `collapsible` and `variant` props from LayoutProvider
- NavGroup component for organizing navigation
- External navigation data file (`sidebar-data.ts`)
- SidebarRail component
- Collapsible sub-navigation support

**Implementation**:

1. Create `src/components/layout/data/sidebar-data.ts`:

   ```ts
   export const sidebarData = {
     navGroups: [
       {
         title: 'General',
         items: [
           { title: 'Catalog', url: '/catalog', icon: Package },
           {
             title: 'Cart',
             url: '/cart',
             icon: ShoppingCart,
             badge: itemCount,
           },
           { title: 'Agent', url: '/agent', icon: MessageSquare },
         ],
       },
     ],
     user: { name: '...', email: '...', avatar: '...' },
   };
   ```

2. Create `src/components/layout/NavGroup.tsx` (adapt from shadcn-admin)

3. Update `Sidebar.tsx`:

   ```tsx
   <Sidebar collapsible={collapsible} variant={variant}>
     <SidebarHeader>{/* Keep ProcureFlow logo */}</SidebarHeader>

     <SidebarContent>
       {sidebarData.navGroups.map((group) => (
         <NavGroup key={group.title} {...group} />
       ))}
     </SidebarContent>

     <SidebarFooter>
       <UserMenu user={sidebarData.user} />
     </SidebarFooter>

     <SidebarRail />
   </Sidebar>
   ```

**Decision**: Keep ThemeToggle in header (not footer) to match modern patterns.

---

### 3. Header/Topbar

#### ProcureFlow: Inline in `AppShell.tsx`

**Current Structure**:

```tsx
<header className='flex h-14 shrink-0 items-center gap-2 border-b px-4'>
  <SidebarTrigger />
</header>
```

**Characteristics**:

- ⚠️ Minimal implementation (trigger only)
- ⚠️ No page title or breadcrumb
- ⚠️ No scroll effects
- ⚠️ No glassmorphism
- ⚠️ No actions area (theme toggle, user menu)

---

#### shadcn-admin: `Header.tsx`

**Current Structure**:

```tsx
<Header fixed>
  <div className='flex-1'>
    <h1 className='text-lg font-semibold'>Dashboard</h1>
  </div>

  <div className='flex items-center gap-2'>
    <ThemeSwitch />
    <ProfileDropdown />
  </div>
</Header>
```

**Internal Structure**:

```tsx
<header
  className={cn('z-50 h-16', fixed && 'sticky top-0', offset > 10 && 'shadow')}
>
  <div
    className={cn(
      'flex h-full items-center gap-3 p-4',
      offset > 10 && 'after:bg-background/20 after:backdrop-blur-lg'
    )}
  >
    <SidebarTrigger />
    <Separator />
    {children}
  </div>
</header>
```

**Characteristics**:

- ✅ Scroll detection (shadow + blur after 10px)
- ✅ Glassmorphism effect
- ✅ Flexible children for page title + actions
- ✅ Separator after trigger
- ✅ Fixed/sticky positioning

---

#### Migration Notes

**Action**: Extract header to dedicated component

**Implementation**:

1. Create `src/components/layout/Header.tsx` (copy from shadcn-admin)
2. Update `AppShell.tsx` to use `<Header>` component
3. Pages can pass title/actions as children:
   ```tsx
   <Header fixed>
     <div className='flex-1'>
       <h1>Catalog</h1>
     </div>
     <div className='flex items-center gap-2'>
       <ThemeToggle />
       <UserMenu />
     </div>
   </Header>
   ```

**Alternative Pattern** (Simpler):

- Keep header in AppShell but add scroll detection + blur
- Pass title via prop or context
- Place theme toggle + user menu in header right section

**Recommendation**: Extract to `Header.tsx` for maximum flexibility (pages can customize header content).

---

### 4. Theme Toggle

#### ProcureFlow: `ThemeToggle.tsx`

**Current Pattern**:

```tsx
<button onClick={() => setTheme(isDark ? 'light' : 'dark')}>
  {isDark ? <Moon /> : <Sun />}
  {!collapsed && <span>{isDark ? 'Dark' : 'Light'}</span>}
</button>
```

**Characteristics**:

- ✅ Uses next-themes correctly
- ✅ Icon swap based on theme
- ✅ Shows label when sidebar expanded
- ⚠️ Two-state toggle (light ↔ dark) - no "system" option
- ⚠️ Button style (not dropdown)

---

#### shadcn-admin: `ThemeSwitch.tsx`

**Current Pattern**:

```tsx
<DropdownMenu modal={false}>
  <DropdownMenuTrigger asChild>
    <Button variant='ghost' size='icon' className='rounded-full'>
      <Sun className='scale-100 dark:scale-0 transition-all' />
      <Moon className='scale-0 dark:scale-100 transition-all' />
    </Button>
  </DropdownMenuTrigger>

  <DropdownMenuContent align='end'>
    <DropdownMenuItem onClick={() => setTheme('light')}>
      Light <Check className={theme !== 'light' && 'hidden'} />
    </DropdownMenuItem>
    <DropdownMenuItem onClick={() => setTheme('dark')}>
      Dark <Check className={theme !== 'dark' && 'hidden'} />
    </DropdownMenuItem>
    <DropdownMenuItem onClick={() => setTheme('system')}>
      System <Check className={theme !== 'system' && 'hidden'} />
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

**Characteristics**:

- ✅ Dropdown menu with 3 options
- ✅ Animated icon transition (scale + rotate)
- ✅ Checkmark for active selection
- ✅ "System" option respects OS preference
- ✅ Updates `<meta name='theme-color'>` tag

---

#### Migration Notes

**Keep from ProcureFlow**:

- next-themes integration
- Collapsed state awareness (if used in sidebar)

**Adopt from shadcn-admin**:

- Dropdown pattern (instead of toggle button)
- Three options (light/dark/system)
- Animated icon transition
- Checkmark indicator
- Meta tag update

**Implementation**:

```tsx
// Updated ThemeToggle.tsx
'use client';

import { Check, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect } from 'react';

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

  useEffect(() => {
    const themeColor = theme === 'dark' ? '#212121' : '#fff';
    const metaThemeColor = document.querySelector("meta[name='theme-color']");
    if (metaThemeColor) metaThemeColor.setAttribute('content', themeColor);
  }, [theme]);

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

**Placement**: Move to Header (right section) instead of sidebar footer.

---

### 5. User Menu

#### ProcureFlow: `UserMenu.tsx`

**Current Pattern**:

```tsx
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <button className='flex items-center gap-3 p-2 ...'>
      <Avatar className='h-8 w-8'>
        <AvatarFallback>{user.initials}</AvatarFallback>
      </Avatar>

      {!collapsed && (
        <>
          <div className='flex-1 text-left'>
            <p className='text-sm font-medium'>{user.name}</p>
            <p className='text-xs text-muted-foreground'>{user.email}</p>
          </div>
          <ChevronUp className='h-4 w-4' />
        </>
      )}
    </button>
  </DropdownMenuTrigger>

  <DropdownMenuContent side={collapsed ? 'right' : 'top'} align='start'>
    <DropdownMenuLabel>
      {/* User info */}
    </DropdownMenuLabel>
    <DropdownMenuSeparator />
    <DropdownMenuItem onClick={...}>
      <User className='mr-2 h-4 w-4' />
      Profile
    </DropdownMenuItem>
    <DropdownMenuItem onClick={...}>
      <Settings className='mr-2 h-4 w-4' />
      Settings
    </DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem onClick={...} className='text-destructive'>
      <LogOut className='mr-2 h-4 w-4' />
      Logout
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

**Characteristics**:

- ✅ Correct dropdown structure
- ✅ Avatar with fallback
- ✅ User info (name + email)
- ✅ Adaptive positioning (collapsed sidebar)
- ⚠️ Flat menu items (no groups)
- ⚠️ Mock data (not integrated with NextAuth)

---

#### shadcn-admin: `NavUser.tsx`

**Current Pattern**:

```tsx
<SidebarMenu>
  <SidebarMenuItem>
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <SidebarMenuButton
          size='lg'
          className='data-[state=open]:bg-sidebar-accent'
        >
          <Avatar className='h-8 w-8 rounded-lg'>
            <AvatarImage src={user.avatar} />
            <AvatarFallback>SN</AvatarFallback>
          </Avatar>

          <div className='grid flex-1 text-start text-sm leading-tight'>
            <span className='truncate font-semibold'>{user.name}</span>
            <span className='truncate text-xs'>{user.email}</span>
          </div>

          <ChevronsUpDown className='ms-auto size-4' />
        </SidebarMenuButton>
      </DropdownMenuTrigger>

      <DropdownMenuContent side={isMobile ? 'bottom' : 'right'} align='end'>
        <DropdownMenuLabel className='p-0 font-normal'>
          {/* Repeat user info */}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuItem>
            <Sparkles /> Upgrade to Pro
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link to='/settings/account'>
              <BadgeCheck /> Account
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link to='/settings'>
              <CreditCard /> Billing
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link to='/settings/notifications'>
              <Bell /> Notifications
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuItem variant='destructive' onClick={() => setOpen(true)}>
          <LogOut /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </SidebarMenuItem>
</SidebarMenu>
```

**Characteristics**:

- ✅ Wrapped in SidebarMenu/SidebarMenuItem
- ✅ Uses SidebarMenuButton with `bg-sidebar-accent` on open
- ✅ Grouped menu items with separators
- ✅ Link components for navigation
- ✅ Dialog integration for sign-out confirmation
- ✅ ChevronsUpDown icon (visual cue for dropdown)

---

#### Migration Notes

**Keep from ProcureFlow**:

- Basic structure
- Collapsed state awareness
- Avatar with fallback

**Adopt from shadcn-admin**:

- SidebarMenu/SidebarMenuItem wrapper
- SidebarMenuButton with active state styling
- DropdownMenuGroup for organizing items
- Link components for menu items (not onClick alerts)
- Sign-out confirmation dialog
- ChevronsUpDown icon

**Implementation**:

```tsx
// Updated UserMenu.tsx
export function UserMenu() {
  const session = useSession(); // NextAuth
  const { isMobile } = useSidebar();
  const [signOutDialogOpen, setSignOutDialogOpen] = useState(false);

  const user = {
    name: session?.user?.name || 'Guest',
    email: session?.user?.email || '',
    initials:
      session?.user?.name
        ?.split(' ')
        .map((n) => n[0])
        .join('') || 'GU',
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
                  <AvatarFallback className='bg-primary text-primary-foreground'>
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
                <div className='flex items-center gap-2 px-1 py-1.5'>
                  <Avatar className='h-8 w-8 rounded-lg'>
                    <AvatarFallback>{user.initials}</AvatarFallback>
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
                    <User className='mr-2 h-4 w-4' />
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

**Additional**: Create `SignOutDialog.tsx` component for confirmation.

---

### 6. Theme CSS

#### ProcureFlow: `globals.css`

**Current Tokens** (Light Mode):

- Uses Tailwind's default palette (`--color-white`, `--color-neutral-*`, `--color-rose-*`)
- Radius: `0.5rem` (conservative)
- No sidebar-specific tokens

**Dark Mode**:

- Custom background: `#212121`
- References Tailwind palette for other values

---

#### shadcn-admin: `theme.css`

**Current Tokens** (Light Mode):

- Uses OKLCH color space
- Radius: `0.625rem` (slightly larger)
- Sidebar-specific tokens (inherit from base)

**Dark Mode**:

- Full OKLCH definitions
- Transparent borders (`oklch(1 0 0 / 10%)`)

---

#### Migration Notes

See detailed comparison in `shadcn-admin-theme-comparison.md`.

**Summary**:

- ✅ Keep ProcureFlow's color values (no visual disruption)
- ➕ Add sidebar tokens (8 new tokens)
- ➕ Add `--radius-xl` token
- ➕ Add scrollbar styling
- ➕ Add collapsible animations
- ➕ Add custom utilities (`no-scrollbar`, `faded-bottom`)

---

### 7. Global Styles

#### ProcureFlow: `globals.css`

**Current Features**:

- `@import 'tailwindcss'`
- `@custom-variant dark` and `@variant dark` (two variants)
- `@theme` block with tokens
- `@layer base` with border color, overflow clipping
- Animations for landing page (fadeInUp, slideInUp, etc.)
- Rainbow animation tokens

---

#### shadcn-admin: `index.css`

**Current Features**:

- `@import 'tailwindcss'` + `'tw-animate-css'`
- `@custom-variant dark` (single variant)
- `@layer base` with scrollbar styling, button cursors, mobile input zoom fix
- `@utility` definitions (container, no-scrollbar, faded-bottom)
- Collapsible animations (slideDown, slideUp)

---

#### Migration Notes

**Keep from ProcureFlow**:

- Two dark variants (for compatibility)
- Landing page animations
- Rainbow animation tokens
- Overflow clipping

**Adopt from shadcn-admin**:

- Scrollbar styling (thin, themed)
- Button cursor pointer
- Mobile input zoom prevention
- Custom utilities
- Collapsible animations

**Implementation**: See `shadcn-admin-theme-comparison.md` for merged CSS.

---

### 8. Navigation Data

#### ProcureFlow: Inline in `Sidebar.tsx`

**Current Pattern**:

```tsx
const navItems: NavItem[] = [
  { label: 'Catalog', href: '/catalog', icon: Package },
  { label: 'Cart', href: '/cart', icon: ShoppingCart, badge: itemCount },
  { label: 'Agent', href: '/agent', icon: MessageSquare },
];
```

---

#### shadcn-admin: `data/sidebar-data.ts`

**Current Pattern**:

```ts
export const sidebarData = {
  teams: [...],
  navGroups: [
    {
      title: 'General',
      items: [
        { title: 'Dashboard', url: '/', icon: LayoutDashboard },
        {
          title: 'Tasks',
          url: '/tasks',
          icon: CheckSquare,
          badge: 3,
          items: [
            { title: 'List', url: '/tasks', icon: CheckSquare },
            { title: 'Kanban', url: '/tasks/kanban', icon: Kanban },
          ]
        },
        // ...
      ]
    },
    // More groups...
  ],
  user: { name, email, avatar }
}
```

---

#### Migration Notes

**Action**: Extract to external data file

**Implementation**:

```ts
// src/components/layout/data/sidebar-data.ts
import { MessageSquare, Package, ShoppingCart } from 'lucide-react';

export const sidebarData = {
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
          badge: 0, // Will be updated dynamically
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

**Dynamic Badge**: Update cart badge using CartContext in Sidebar component.

---

### 9. Page Container

#### ProcureFlow: Inline in `AppShell.tsx`

**Current Pattern**:

```tsx
<main className='flex-1 overflow-y-auto'>
  <div className='container mx-auto p-6 max-w-7xl'>{children}</div>
</main>
```

---

#### shadcn-admin: `Main.tsx`

**Current Pattern**:

```tsx
<main
  id='main-content'
  data-layout={fixed ? 'fixed' : 'scroll'}
  className='flex flex-1 flex-col overflow-auto'
  {...props}
>
  {children}
</main>
```

---

#### Migration Notes

**Action**: Extract to dedicated component

**Implementation**:

```tsx
// src/components/layout/Main.tsx
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

**Usage in AppShell**:

```tsx
<SidebarInset className='@container/content'>
  <Header fixed>{/* Page-specific header content */}</Header>
  <Main>{children}</Main>
</SidebarInset>
```

**Note**: Pages can override with `<Main fixed>` if needed.

---

### 10. Layout Provider

#### ProcureFlow: ❌ Not Implemented

---

#### shadcn-admin: `LayoutProvider`

**Current Pattern**:

```tsx
type LayoutContextType = {
  variant: 'sidebar' | 'floating' | 'inset';
  setVariant: (variant) => void;
  collapsible: 'offcanvas' | 'icon' | 'none';
  setCollapsible: (collapsible) => void;
  layout: 'fixed' | 'scroll';
  setLayout: (layout) => void;
};

export function LayoutProvider({ children }) {
  const [variant, setVariant] = useState<'sidebar' | 'floating' | 'inset'>(
    'sidebar'
  );
  const [collapsible, setCollapsible] = useState<'offcanvas' | 'icon' | 'none'>(
    'icon'
  );
  const [layout, setLayout] = useState<'fixed' | 'scroll'>('scroll');

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
```

---

#### Migration Notes

**Action**: Create LayoutProvider for ProcureFlow

**Implementation**:

```tsx
// src/contexts/LayoutContext.tsx
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

**Usage**: Wrap AppShell with LayoutProvider.

**Future**: Add UI for variant/layout switching (demo feature in shadcn-admin).

---

### 11. Skip to Main

#### ProcureFlow: ❌ Not Implemented

---

#### shadcn-admin: `SkipToMain.tsx`

**Current Pattern**:

```tsx
export function SkipToMain() {
  return (
    <a
      href='#main-content'
      className='sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:bg-background focus:border'
    >
      Skip to main content
    </a>
  );
}
```

---

#### Migration Notes

**Action**: Add SkipToMain component

**Implementation**:

```tsx
// src/components/layout/SkipToMain.tsx
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

**Usage**: Add to AppShell before AppSidebar.

---

## Migration Priority Matrix

| Area                     | Priority  | Effort | Impact                           |
| ------------------------ | --------- | ------ | -------------------------------- |
| **Theme tokens**         | 🔴 High   | Low    | High (enables Sidebar component) |
| **Global styles**        | 🔴 High   | Low    | High (animations, utilities)     |
| **Header component**     | 🔴 High   | Medium | High (scroll effects, structure) |
| **NavGroup component**   | 🟡 Medium | Medium | Medium (better organization)     |
| **Navigation data**      | 🟡 Medium | Low    | Medium (maintainability)         |
| **UserMenu refactor**    | 🟡 Medium | Medium | Medium (UX improvement)          |
| **ThemeToggle refactor** | 🟡 Medium | Low    | Medium (3-option dropdown)       |
| **LayoutProvider**       | 🟡 Medium | Low    | Low (enables variant switching)  |
| **SkipToMain**           | 🟢 Low    | Low    | Low (accessibility)              |
| **Main component**       | 🟢 Low    | Low    | Low (structure)                  |
| **SidebarRail**          | 🟢 Low    | Low    | Low (UX nicety)                  |

---

## Summary

**High Alignment**: ProcureFlow already uses shadcn/ui Sidebar correctly - migration is structural, not conceptual.

**Key Changes**:

1. ➕ Add theme tokens for Sidebar component
2. ➕ Add global styles (utilities, animations)
3. 🔄 Extract Header to dedicated component
4. 🔄 Add NavGroup for organized navigation
5. 🔄 Enhance ThemeToggle with dropdown
6. 🔄 Enhance UserMenu with grouped items
7. ➕ Add LayoutProvider for variant management
8. ➕ Add SkipToMain for accessibility

**Migration Path**: Incremental - each change can be applied and tested independently.

---

_Next: Design detailed migration plan (see `shadcn-admin-layout-migration-plan.md`)._
