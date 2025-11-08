# shadcn-admin Components Analysis

**Date**: November 7, 2025  
**Purpose**: Map shadcn-admin's component structure for layout migration to ProcureFlow

---

## Overview

shadcn-admin's component architecture follows a **hierarchical composition** pattern:

```
AuthenticatedLayout (Shell)
├── SkipToMain (Accessibility)
├── AppSidebar (Navigation)
│   ├── SidebarHeader (TeamSwitcher / AppTitle)
│   ├── SidebarContent (NavGroups)
│   ├── SidebarFooter (NavUser)
│   └── SidebarRail (Hover handle)
└── SidebarInset (Content area)
    ├── Header (Topbar)
    │   ├── SidebarTrigger
    │   ├── Separator
    │   └── {children} (Page title, actions)
    └── Main (Page content)
```

All layout components leverage the **shadcn/ui Sidebar primitive** (`@/components/ui/sidebar`), which provides:

- State management (open/closed, mobile/desktop)
- Responsive behavior (sheet on mobile, pinned on desktop)
- Keyboard shortcuts (Ctrl+B to toggle)
- Accessibility features (ARIA labels, focus management)

---

## Component Categories

### 1. Layout Shell Components

#### 1.1 `AuthenticatedLayout` (Main Layout Wrapper)

**Path**: `src/components/layout/authenticated-layout.tsx`

**Purpose**: Root layout for authenticated pages

**Dependencies**:

- `SidebarProvider` (from shadcn/ui)
- `LayoutProvider` (custom context)
- `SearchProvider` (custom context)

**Composition**:

```tsx
<SearchProvider>
  <LayoutProvider>
    <SidebarProvider defaultOpen={cookieState}>
      <SkipToMain />
      <AppSidebar />
      <SidebarInset className='@container/content ...'>
        {children ?? <Outlet />}
      </SidebarInset>
    </SidebarProvider>
  </LayoutProvider>
</SearchProvider>
```

**Key Features**:

- **Cookie persistence**: Sidebar state saved to `sidebar_state` cookie
- **Container queries**: `@container/content` for responsive content
- **Data attributes**: `data-layout` and `data-variant` for conditional styling
- **Height management**: Adapts to fixed/scroll layouts

**Theme Integration**:

- No direct theme interaction (providers handle it)
- Responds to `has-data-[layout=fixed]` and `peer-data-[variant=inset]` classes

---

#### 1.2 `AppSidebar` (Navigation Sidebar)

**Path**: `src/components/layout/app-sidebar.tsx`

**Purpose**: Main navigation sidebar with header, content, footer

**Dependencies**:

- `Sidebar`, `SidebarHeader`, `SidebarContent`, `SidebarFooter`, `SidebarRail` (shadcn/ui)
- `LayoutProvider` (for variant and collapsible state)

**Structure**:

```tsx
<Sidebar collapsible={collapsible} variant={variant}>
  <SidebarHeader>
    <TeamSwitcher teams={teams} />
    {/* OR <AppTitle /> */}
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

**Props from LayoutProvider**:

- `collapsible`: `'offcanvas' | 'icon' | 'none'`
- `variant`: `'sidebar' | 'floating' | 'inset'`

**Theme Integration**:

- Uses `--sidebar`, `--sidebar-foreground`, `--sidebar-border` CSS variables
- Adapts background when variant is `inset` (see theme.css)

**Navigation Data**:

- Loaded from `src/components/layout/data/sidebar-data.ts`
- Structure: `{ teams: [], navGroups: [], user: {} }`

---

#### 1.3 `Header` (Topbar Component)

**Path**: `src/components/layout/header.tsx`

**Purpose**: Sticky header with trigger, separator, and dynamic content

**Props**:

- `fixed?: boolean` - Enable sticky positioning
- `children` - Page title, breadcrumbs, actions, etc.

**Structure**:

```tsx
<header
  className={cn(
    'z-50 h-16',
    fixed && 'sticky top-0 w-[inherit]',
    offset > 10 && fixed && 'shadow'
  )}
>
  <div
    className={cn(
      'flex h-full items-center gap-3 p-4',
      offset > 10 && fixed && 'after:bg-background/20 after:backdrop-blur-lg'
    )}
  >
    <SidebarTrigger variant='outline' />
    <Separator orientation='vertical' className='h-6' />
    {children}
  </div>
</header>
```

**Key Features**:

- **Scroll detection**: Adds shadow + blur effect when scrolled > 10px
- **Glassmorphism**: `backdrop-blur-lg` with semi-transparent background
- **Responsive spacing**: `gap-3` on mobile, `gap-4` on desktop

**Theme Integration**:

- Uses `bg-background/20` for glassmorphism overlay
- Separator uses `--border` color

---

#### 1.4 `Main` (Content Wrapper)

**Path**: `src/components/layout/main.tsx`

**Purpose**: Minimal wrapper for page content with optional fixed layout

**Props**:

- `fixed?: boolean` - Enable fixed height layout (no scroll)

**Structure**:

```tsx
<main
  id='main-content'
  data-layout={fixed ? 'fixed' : 'scroll'}
  className={cn(
    'flex flex-1 flex-col overflow-auto',
    fixed && '@lg/content:overflow-hidden'
  )}
  {...props}
>
  {children}
</main>
```

**Key Features**:

- **ID for accessibility**: `#main-content` (target of SkipToMain)
- **Data attribute**: `data-layout` for conditional styling
- **Container query responsive**: `@lg/content:overflow-hidden`

---

### 2. Navigation Components

#### 2.1 `NavGroup` (Sidebar Navigation Group)

**Path**: `src/components/layout/nav-group.tsx`

**Purpose**: Render a labeled group of navigation items

**Props**:

- `title: string` - Group label
- `items: NavItem[]` - Navigation items (links or collapsibles)

**Structure**:

```tsx
<SidebarGroup>
  <SidebarGroupLabel>{title}</SidebarGroupLabel>
  <SidebarMenu>
    {items.map((item) => {
      if (!item.items) return <SidebarMenuLink item={item} />;

      if (collapsed && !mobile)
        return <SidebarMenuCollapsedDropdown item={item} />;

      return <SidebarMenuCollapsible item={item} />;
    })}
  </SidebarMenu>
</SidebarGroup>
```

**Navigation Item Types**:

1. **NavLink**: Simple link with optional badge
2. **NavCollapsible**: Expandable group with sub-items

**Rendering Logic**:

- **Expanded sidebar**: Collapsible items render as `<Collapsible>` with chevron
- **Collapsed sidebar**: Collapsible items render as `<DropdownMenu>` (popover)
- **Mobile**: Always uses sheet overlay (no collapsed state)

**Key Features**:

- **Active state detection**: Matches URL, query params, and parent routes
- **Auto-expand**: Collapsible groups expand if child route is active
- **Badge support**: Renders `<Badge>` component for counts/notifications

**Theme Integration**:

- Uses `SidebarMenuButton` which applies `--sidebar-accent` on hover/active
- Dropdown menus use `bg-secondary` for active items

---

#### 2.2 `SidebarMenuLink` (Simple Navigation Link)

**Purpose**: Render a single navigation link

**Structure**:

```tsx
<SidebarMenuItem>
  <SidebarMenuButton
    asChild
    isActive={checkIsActive(href, item)}
    tooltip={item.title}
  >
    <Link to={item.url} onClick={() => setOpenMobile(false)}>
      {item.icon && <item.icon />}
      <span>{item.title}</span>
      {item.badge && <Badge>{item.badge}</Badge>}
    </Link>
  </SidebarMenuButton>
</SidebarMenuItem>
```

**Key Features**:

- **Tooltip**: Shows title when sidebar is collapsed
- **Auto-close mobile**: Closes mobile sheet on navigation
- **Icon + text**: Flexible composition with optional badge

---

#### 2.3 `SidebarMenuCollapsible` (Expandable Navigation Group)

**Purpose**: Render a navigation item with sub-items (expanded sidebar)

**Structure**:

```tsx
<Collapsible
  asChild
  defaultOpen={checkIsActive(href, item, true)}
  className='group/collapsible'
>
  <SidebarMenuItem>
    <CollapsibleTrigger asChild>
      <SidebarMenuButton tooltip={item.title}>
        {item.icon && <item.icon />}
        <span>{item.title}</span>
        {item.badge && <Badge>{item.badge}</Badge>}
        <ChevronRight className='group-data-[state=open]/collapsible:rotate-90' />
      </SidebarMenuButton>
    </CollapsibleTrigger>

    <CollapsibleContent className='CollapsibleContent'>
      <SidebarMenuSub>
        {item.items.map((subItem) => (
          <SidebarMenuSubItem>
            <SidebarMenuSubButton
              asChild
              isActive={checkIsActive(href, subItem)}
            >
              <Link to={subItem.url}>
                {subItem.icon && <subItem.icon />}
                <span>{subItem.title}</span>
                {subItem.badge && <Badge>{subItem.badge}</Badge>}
              </Link>
            </SidebarMenuSubButton>
          </SidebarMenuSubItem>
        ))}
      </SidebarMenuSub>
    </CollapsibleContent>
  </SidebarMenuItem>
</Collapsible>
```

**Key Features**:

- **Auto-expand**: Opens if any child route is active
- **Animated transition**: Uses `.CollapsibleContent` animations (see theme.css)
- **Chevron rotation**: Rotates 90° when open, respects RTL

**Theme Integration**:

- Relies on `.CollapsibleContent[data-state='open']` animation
- Sub-items have reduced indentation and smaller font

---

#### 2.4 `SidebarMenuCollapsedDropdown` (Collapsed Sidebar Popover)

**Purpose**: Render a navigation item with sub-items (collapsed sidebar)

**Structure**:

```tsx
<SidebarMenuItem>
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <SidebarMenuButton
        tooltip={item.title}
        isActive={checkIsActive(href, item)}
      >
        {item.icon && <item.icon />}
        <span>{item.title}</span>
        {item.badge && <Badge>{item.badge}</Badge>}
      </SidebarMenuButton>
    </DropdownMenuTrigger>

    <DropdownMenuContent side='right' align='start' sideOffset={4}>
      <DropdownMenuLabel>
        {item.title} {item.badge ? `(${item.badge})` : ''}
      </DropdownMenuLabel>
      <DropdownMenuSeparator />

      {item.items.map((sub) => (
        <DropdownMenuItem asChild>
          <Link
            to={sub.url}
            className={checkIsActive(href, sub) ? 'bg-secondary' : ''}
          >
            {sub.icon && <sub.icon />}
            <span>{sub.title}</span>
            {sub.badge && <span className='ms-auto text-xs'>{sub.badge}</span>}
          </Link>
        </DropdownMenuItem>
      ))}
    </DropdownMenuContent>
  </DropdownMenu>
</SidebarMenuItem>
```

**Key Features**:

- **Popover positioning**: Opens to the right of icon-only sidebar
- **Badge in label**: Shows group badge count in dropdown header
- **Active highlighting**: Uses `bg-secondary` for active sub-items

---

#### 2.5 `NavUser` (Sidebar User Widget)

**Path**: `src/components/layout/nav-user.tsx`

**Purpose**: User profile widget in sidebar footer with dropdown menu

**Props**:

- `user: { name, email, avatar }`

**Structure**:

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

      <DropdownMenuContent
        side={isMobile ? 'bottom' : 'right'}
        align='end'
        sideOffset={4}
      >
        <DropdownMenuLabel>{/* Repeat avatar + user info */}</DropdownMenuLabel>
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
          {/* More menu items... */}
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

**Key Features**:

- **Adaptive positioning**: Right-side on desktop, bottom on mobile
- **User info duplication**: Header shows avatar+name, label repeats it
- **Grouped menu items**: Separators divide upgrade, settings, logout
- **Dialog integration**: Sign out opens a confirmation dialog

**Theme Integration**:

- Uses `bg-sidebar-accent` when dropdown is open
- Avatar has `rounded-lg` to match sidebar aesthetic
- Destructive variant for logout action

---

#### 2.6 `TeamSwitcher` (Workspace/Team Selector)

**Path**: `src/components/layout/team-switcher.tsx`

**Purpose**: Dropdown to switch between teams/workspaces (in sidebar header)

**Structure**: Similar to NavUser but for teams

- Shows active team avatar + name
- Dropdown lists all teams with radio selection
- Includes "Add new team" action

**Note**: This is a demo feature - ProcureFlow may not need it unless multi-tenancy is required.

---

### 3. Shell Utility Components

#### 3.1 `ThemeSwitch` (Theme Toggle Dropdown)

**Path**: `src/components/theme-switch.tsx`

**Purpose**: Toggle between light/dark/system themes

**Structure**:

```tsx
<DropdownMenu modal={false}>
  <DropdownMenuTrigger asChild>
    <Button variant='ghost' size='icon' className='rounded-full'>
      <Sun className='scale-100 dark:scale-0 rotate-0 dark:-rotate-90 transition-all' />
      <Moon className='scale-0 dark:scale-100 rotate-90 dark:rotate-0 transition-all' />
      <span className='sr-only'>Toggle theme</span>
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

**Key Features**:

- **Animated icon swap**: Scale + rotate transitions between Sun/Moon
- **Checkmark indicator**: Shows active theme
- **System option**: Respects OS preference
- **Meta tag update**: Updates `theme-color` meta tag on change

**Theme Integration**:

- Uses `useTheme()` from theme provider
- Icons animate using `dark:` variant

---

#### 3.2 `ProfileDropdown` (Header User Menu)

**Path**: `src/components/profile-dropdown.tsx`

**Purpose**: User menu in header/topbar (alternative to NavUser)

**Structure**: Very similar to NavUser but:

- Trigger is smaller (icon-only button)
- Dropdown aligns to end (right side)
- Includes keyboard shortcuts in menu items

**Usage**: Typically placed in Header's right section

---

#### 3.3 `SkipToMain` (Accessibility Link)

**Path**: `src/components/skip-to-main.tsx`

**Purpose**: Skip navigation link for keyboard users

**Structure**:

```tsx
<a
  href='#main-content'
  className='sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:bg-background focus:border'
>
  Skip to main content
</a>
```

**Key Features**:

- Hidden by default (sr-only)
- Appears on keyboard focus
- Jumps to `#main-content` (Main component)

---

### 4. Context Providers

#### 4.1 `LayoutProvider`

**Path**: `src/context/layout-provider.tsx`

**Purpose**: Manage layout variant and collapsible behavior

**State**:

- `variant: 'sidebar' | 'floating' | 'inset'`
- `collapsible: 'offcanvas' | 'icon' | 'none'`
- `layout: 'fixed' | 'scroll'`

**Methods**:

- `setVariant(variant)`
- `setCollapsible(collapsible)`
- `setLayout(layout)`

**Usage**: Consumed by AppSidebar, Header, Main

---

#### 4.2 `ThemeProvider`

**Path**: `src/context/theme-provider.tsx`

**Purpose**: Manage theme state (light/dark/system)

**Dependencies**: Likely uses `next-themes` or similar

**Methods**:

- `theme: 'light' | 'dark' | 'system'`
- `setTheme(theme)`

---

#### 4.3 `SearchProvider`

**Path**: `src/context/search-provider.tsx`

**Purpose**: Manage command-K search dialog state

**Note**: Not critical for layout, but useful for full feature parity

---

## Interaction Patterns with Theme System

### CSS Variable Usage in Components

**SidebarMenuButton (Active State)**:

```css
.sidebar-menu-button[data-active='true'] {
  background-color: var(--sidebar-accent);
  color: var(--sidebar-accent-foreground);
}
```

**SidebarMenuButton (Hover State)**:

```css
.sidebar-menu-button:hover {
  background-color: var(--sidebar-accent);
  color: var(--sidebar-accent-foreground);
}
```

**Sidebar Border**:

```css
.sidebar {
  border-right: 1px solid var(--sidebar-border);
}
```

**Sidebar Background (Inset Variant)**:

```css
body:has([data-variant='inset']) {
  background-color: var(--sidebar);
}
```

---

## Component Summary Table

| Component               | Purpose            | Path                              | Key Props                | Theme Integration                 |
| ----------------------- | ------------------ | --------------------------------- | ------------------------ | --------------------------------- |
| **AuthenticatedLayout** | Root shell         | `layout/authenticated-layout.tsx` | `children`               | Providers, data attributes        |
| **AppSidebar**          | Main sidebar       | `layout/app-sidebar.tsx`          | `collapsible`, `variant` | `--sidebar-*` tokens              |
| **Header**              | Topbar             | `layout/header.tsx`               | `fixed`, `children`      | `bg-background/20`, backdrop blur |
| **Main**                | Content wrapper    | `layout/main.tsx`                 | `fixed`                  | `data-layout` attribute           |
| **NavGroup**            | Nav group          | `layout/nav-group.tsx`            | `title`, `items`         | `--sidebar-accent` for active     |
| **NavUser**             | User widget        | `layout/nav-user.tsx`             | `user`                   | `bg-sidebar-accent` on open       |
| **TeamSwitcher**        | Team selector      | `layout/team-switcher.tsx`        | `teams`                  | Similar to NavUser                |
| **ThemeSwitch**         | Theme toggle       | `theme-switch.tsx`                | None                     | Icon animations, checkmarks       |
| **ProfileDropdown**     | User menu (header) | `profile-dropdown.tsx`            | None                     | Standard dropdown theming         |
| **SkipToMain**          | A11y skip link     | `skip-to-main.tsx`                | None                     | `sr-only`, `focus:` states        |

---

## ProcureFlow Adaptation Notes

### Direct Copy Candidates

1. **Header** → Almost no changes needed (swap TanStack Router for Next.js Link)
2. **SkipToMain** → No changes needed
3. **NavGroup logic** → Adapt routing checks for Next.js

### Needs Adaptation

1. **AuthenticatedLayout** → Remove `<Outlet />`, use `children` only
2. **AppSidebar** → Replace TanStack Router `<Link>` with Next.js `<Link>`
3. **NavUser** → Integrate with NextAuth session data
4. **ThemeSwitch** → Already using next-themes, align UI only

### Can Skip

1. **TeamSwitcher** → Not needed unless multi-tenancy is implemented
2. **SearchProvider** → Optional (command-K search is a nice-to-have)

---

## Key Takeaways

### Design Patterns

- **Composition**: Small, single-purpose components
- **Conditional rendering**: Different components for expanded/collapsed states
- **Responsive**: Mobile sheet, desktop sidebar, tablet in-between
- **Accessibility**: Skip links, ARIA labels, keyboard shortcuts

### State Management

- **SidebarProvider**: Manages open/closed, mobile/desktop
- **LayoutProvider**: Manages variant, collapsible, layout mode
- **ThemeProvider**: Manages theme (light/dark/system)
- **Cookie persistence**: Sidebar state survives page reloads

### CSS Strategy

- **CSS variables**: All theming through `--sidebar-*` tokens
- **Data attributes**: `data-state`, `data-variant`, `data-layout` for styling
- **Tailwind classes**: Utility-first with conditional classes
- **Animations**: CSS keyframes for smooth transitions

---

_Next: Build de-para mapping between shadcn-admin and ProcureFlow (see `procureflow-vs-shadcn-admin-layout-mapping.md`)._
