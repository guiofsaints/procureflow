# shadcn-admin Layout Analysis

**Repository**: https://github.com/satnaing/shadcn-admin  
**Analysis Date**: November 7, 2025  
**Purpose**: Extract layout and theming patterns for ProcureFlow refactoring

---

## Executive Summary

shadcn-admin is a modern admin dashboard template built with:

- **Vite + React** (uses TanStack Router)
- **Tailwind CSS v4** with `@theme inline` directive
- **shadcn/ui** components (especially the new `Sidebar` primitive)
- **OKLCH color space** for smooth color transitions
- **Context-based** theme, layout, and search providers
- **Floating sidebar** with multiple variants (sidebar, floating, inset)

The project demonstrates production-ready patterns for:

- ✅ Responsive, accessible sidebar navigation
- ✅ Structured theme tokens with light/dark modes
- ✅ Clean separation of layout shell from page content
- ✅ Dropdown-based user menu and theme switcher
- ✅ Keyboard shortcuts and skip-to-main accessibility

---

## Project Structure Analysis

### Key Directories

```
shadcn-admin/src/
├── components/
│   ├── layout/                  # Layout shell components
│   │   ├── authenticated-layout.tsx  # Main layout wrapper
│   │   ├── app-sidebar.tsx           # Sidebar with navigation
│   │   ├── header.tsx                # Topbar/header component
│   │   ├── main.tsx                  # Main content wrapper
│   │   ├── nav-group.tsx             # Sidebar nav group
│   │   ├── nav-user.tsx              # User widget in sidebar
│   │   ├── team-switcher.tsx         # Team/workspace switcher
│   │   ├── top-nav.tsx               # Alternative top navigation
│   │   ├── app-title.tsx             # App branding component
│   │   └── data/sidebar-data.ts      # Navigation data structure
│   ├── ui/                      # shadcn/ui primitives
│   │   ├── sidebar.tsx               # Sidebar primitive (NEW)
│   │   ├── dropdown-menu.tsx
│   │   ├── avatar.tsx
│   │   ├── button.tsx
│   │   └── ... (20+ components)
│   ├── theme-switch.tsx         # Theme toggle dropdown
│   ├── profile-dropdown.tsx     # User menu dropdown
│   ├── config-drawer.tsx        # Layout config (demo feature)
│   └── ... (utility components)
├── context/
│   ├── theme-provider.tsx       # Theme state management
│   ├── layout-provider.tsx      # Layout variant state
│   ├── font-provider.tsx        # Font family switching
│   └── search-provider.tsx      # Command-K search state
├── styles/
│   ├── theme.css                # CSS variable definitions
│   └── index.css                # Global styles + Tailwind directives
└── features/
    └── ... (page-level features)
```

---

## Layout Patterns

### 1. **AuthenticatedLayout** (Main Shell)

**File**: `src/components/layout/authenticated-layout.tsx`

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

- **SidebarProvider**: Manages sidebar state (open/closed), persists to cookies
- **SidebarInset**: Content area that responds to sidebar state
- **@container/content**: Container queries for responsive content
- **SkipToMain**: Accessibility feature for keyboard navigation
- **LayoutProvider**: Manages layout variants (sidebar, floating, inset) and collapsible behavior

**Class Patterns**:

```tsx
('@container/content',
  'has-data-[layout=fixed]:h-svh',
  'peer-data-[variant=inset]:has-data-[layout=fixed]:h-[calc(100svh-(var(--spacing)*4))]');
```

---

### 2. **AppSidebar** (Navigation Sidebar)

**File**: `src/components/layout/app-sidebar.tsx`

**Structure**:

```tsx
<Sidebar collapsible={collapsible} variant={variant}>
  <SidebarHeader>
    <TeamSwitcher teams={teams} />
  </SidebarHeader>
  <SidebarContent>
    {navGroups.map((group) => (
      <NavGroup {...group} />
    ))}
  </SidebarContent>
  <SidebarFooter>
    <NavUser user={user} />
  </SidebarFooter>
  <SidebarRail />
</Sidebar>
```

**Behavior**:

- **Variants**: `sidebar` (default), `floating`, `inset`
- **Collapsible**: `offcanvas` (mobile), `icon` (desktop), `none`
- **Responsive**: Sheet/overlay on mobile, pinned on desktop
- **SidebarRail**: Hover/drag handle for expanding collapsed sidebar

**Navigation Data Structure**:

```typescript
// src/components/layout/data/sidebar-data.ts
export const sidebarData = {
  teams: [...],
  navGroups: [
    {
      title: 'General',
      items: [
        { title: 'Dashboard', url: '/', icon: LayoutDashboard },
        // ...
      ]
    },
    // ...
  ],
  user: { name, email, avatar }
}
```

---

### 3. **Header** (Topbar)

**File**: `src/components/layout/header.tsx`

**Features**:

- **Sticky positioning**: `sticky top-0` when `fixed` prop is true
- **Scroll-based shadow**: Adds shadow when scrolled > 10px
- **Glassmorphism effect**: Backdrop blur on scroll
  ```tsx
  'after:bg-background/20 after:backdrop-blur-lg';
  ```
- **SidebarTrigger**: Hamburger menu button
- **Separator**: Visual divider after trigger

**Layout**:

```tsx
<header className='z-50 h-16 sticky top-0'>
  <div className='flex h-full items-center gap-3 p-4'>
    <SidebarTrigger variant='outline' />
    <Separator orientation='vertical' className='h-6' />
    {children} {/* Page title, breadcrumbs, actions */}
  </div>
</header>
```

---

### 4. **Sidebar Behavior** (Floating/Compact)

The sidebar supports three variants controlled by `LayoutProvider`:

| Variant    | Desktop Behavior                         | Mobile Behavior |
| ---------- | ---------------------------------------- | --------------- |
| `sidebar`  | Pinned to left, collapsible to icon-only | Sheet overlay   |
| `floating` | Floating panel with backdrop             | Sheet overlay   |
| `inset`    | Inset within content area                | Sheet overlay   |

**Collapsible Options**:

- `offcanvas`: Mobile-style overlay (mobile default)
- `icon`: Collapses to icon-only strip (desktop default)
- `none`: Cannot collapse

**State Persistence**:

- Sidebar open/closed state saved to cookies (`sidebar_state`)
- Layout variant and collapsible mode stored in `LayoutProvider` context

---

## Dropdown/User Menu Patterns

### 1. **ThemeSwitch**

**File**: `src/components/theme-switch.tsx`

**Pattern**: Dropdown menu with icon toggle

```tsx
<DropdownMenu modal={false}>
  <DropdownMenuTrigger asChild>
    <Button variant='ghost' size='icon'>
      <Sun className='scale-100 dark:scale-0' />
      <Moon className='scale-0 dark:scale-100' />
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

**Key Details**:

- `modal={false}`: Prevents focus trap (better UX for quick actions)
- Animated icon transition using Tailwind scale/rotate utilities
- Checkmark indicator for active theme
- Updates `meta[name='theme-color']` on theme change

---

### 2. **ProfileDropdown** (User Menu)

**File**: `src/components/profile-dropdown.tsx`

**Pattern**: Avatar trigger with grouped menu items

```tsx
<DropdownMenu modal={false}>
  <DropdownMenuTrigger asChild>
    <Button variant='ghost' className='rounded-full'>
      <Avatar>
        <AvatarImage src={avatar} />
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent className='w-56' align='end'>
    <DropdownMenuLabel>
      <div className='flex flex-col gap-1.5'>
        <p className='text-sm font-medium'>{name}</p>
        <p className='text-xs text-muted-foreground'>{email}</p>
      </div>
    </DropdownMenuLabel>
    <DropdownMenuSeparator />
    <DropdownMenuGroup>
      <DropdownMenuItem>Profile</DropdownMenuItem>
      <DropdownMenuItem>Settings</DropdownMenuItem>
    </DropdownMenuGroup>
    <DropdownMenuSeparator />
    <DropdownMenuItem variant='destructive'>Sign out</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

**Features**:

- User info in label section (name + email)
- Grouped menu items with separators
- Keyboard shortcuts displayed with `DropdownMenuShortcut`
- Destructive styling for logout action
- Dialog integration for sign-out confirmation

---

### 3. **NavUser** (Sidebar Footer User Widget)

**File**: `src/components/layout/nav-user.tsx`

**Pattern**: Similar to ProfileDropdown but integrated into sidebar footer

- Shows avatar + name/email when sidebar expanded
- Shows only avatar when sidebar collapsed
- Dropdown opens to the side when sidebar is collapsed, top when expanded

---

## Theme & Global Styles

### theme.css Structure

**File**: `src/styles/theme.css`

**Color System**:

- **OKLCH color space**: Better perceptual uniformity than HSL
- **Semantic tokens**: `background`, `foreground`, `primary`, `secondary`, etc.
- **Sidebar-specific tokens**: `--sidebar`, `--sidebar-foreground`, etc.
- **Chart colors**: `--chart-1` through `--chart-5`

**Token Inheritance**:

```css
:root {
  --sidebar: var(--background);
  --sidebar-foreground: var(--foreground);
  --sidebar-primary: var(--primary);
  /* Sidebar inherits from base tokens by default */
}
```

**Tailwind v4 Integration**:

```css
@theme inline {
  --font-inter: 'Inter', 'sans-serif';
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);

  /* Map to Tailwind color system */
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  /* ... */
}
```

---

### index.css Structure

**File**: `src/styles/index.css`

**Imports**:

```css
@import 'tailwindcss';
@import 'tw-animate-css'; /* Animation library */
@import './theme.css';
```

**Custom Variant**:

```css
@custom-variant dark (&:is(.dark *));
```

**Base Layer**:

```css
@layer base {
  * {
    @apply border-border outline-ring/50;
    scrollbar-width: thin;
    scrollbar-color: var(--border) transparent;
  }

  body {
    @apply bg-background text-foreground 
           has-[div[data-variant='inset']]:bg-sidebar 
           min-h-svh w-full;
  }

  /* Cursor pointer for buttons */
  button:not(:disabled) {
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

**Utilities**:

```css
@utility container {
  margin-inline: auto;
  padding-inline: 2rem;
}

@utility no-scrollbar {
  &::-webkit-scrollbar {
    display: none;
  }
  -ms-overflow-style: none;
  scrollbar-width: none;
}

@utility faded-bottom {
  @apply after:absolute after:bottom-0 
         after:bg-[linear-gradient(...)];
}
```

**Animations**:

- `CollapsibleContent` slide animations (slideDown/slideUp)
- Keyframe definitions for smooth expand/collapse

---

## Directly Reusable Patterns for ProcureFlow

### ✅ Immediately Applicable

1. **Sidebar Structure**
   - Three-part layout: `<SidebarHeader>`, `<SidebarContent>`, `<SidebarFooter>`
   - `SidebarRail` for hover-to-expand interaction
   - Navigation data structure with groups

2. **Header Component**
   - Scroll-based shadow effect
   - Glassmorphism backdrop blur
   - `SidebarTrigger` + `Separator` pattern

3. **Theme Toggle Dropdown**
   - Icon animation pattern (scale/rotate transitions)
   - Three-option menu (light/dark/system)
   - Checkmark for active selection

4. **User Menu Structure**
   - User info in label (name + email)
   - Grouped items with separators
   - Destructive styling for logout

5. **Layout Provider Pattern**
   - Context for sidebar variant/collapsible state
   - Cookie persistence for sidebar state

### ⚠️ Needs Adaptation

1. **Router Integration**
   - shadcn-admin uses TanStack Router
   - ProcureFlow uses Next.js App Router
   - Adapt `<Link>` and `<Outlet>` to Next.js equivalents

2. **Color Space**
   - shadcn-admin uses OKLCH
   - ProcureFlow currently uses Tailwind's default palette
   - Can keep existing colors but consider OKLCH for future

3. **Font System**
   - shadcn-admin has font switcher (Inter, Manrope)
   - ProcureFlow doesn't need this unless desired

4. **Layout Variants**
   - Multiple sidebar variants (sidebar/floating/inset) may be overkill
   - Focus on `sidebar` (default) and `floating` (modern aesthetic)

---

## Key Takeaways

### Design Philosophy

- **Composition over configuration**: Small, focused components
- **Context-driven state**: Providers for cross-cutting concerns
- **Accessibility first**: Skip links, keyboard shortcuts, ARIA labels
- **Performance-conscious**: Cookie persistence, container queries

### Technical Excellence

- **Type-safe**: Full TypeScript with strict mode
- **Responsive**: Mobile-first with progressive enhancement
- **Modern CSS**: Tailwind v4 with `@theme inline`, OKLCH colors
- **Animation**: Smooth transitions with respect for `prefers-reduced-motion`

### Recommended Adoption

1. **Sidebar structure** → Direct copy with Next.js Link adaptation
2. **Header scroll effects** → Copy exactly, works universally
3. **Theme toggle pattern** → Adopt dropdown style, keep next-themes
4. **User menu pattern** → Adapt structure, integrate with NextAuth session
5. **Layout provider** → Implement for sidebar variant management
6. **CSS tokens** → Align structure, keep existing color values initially

---

## References

- **shadcn-admin repo**: https://github.com/satnaing/shadcn-admin
- **shadcn/ui Sidebar docs**: https://ui.shadcn.com/docs/components/sidebar
- **Tailwind CSS v4**: https://tailwindcss.com/docs/v4-beta
- **OKLCH colors**: https://oklch.com/

---

_Next Steps_: Compare with ProcureFlow's current implementation in detail (see `procureflow-vs-shadcn-admin-layout-mapping.md`).
