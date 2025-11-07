# shadcn/ui Usage Inventory

**Assessment Date:** November 7, 2025  
**Project:** ProcureFlow  
**Version:** 1.0.0

## Executive Summary

This document provides a comprehensive inventory of UI components and patterns currently used in the ProcureFlow frontend application. The inventory categorizes components by functional area and identifies their current implementation status (shadcn-based, custom Tailwind-only, or mixed).

### Current shadcn/ui Components

✅ **Already Installed:**
- Button (`@/components/ui/button.tsx`)
- DropdownMenu (`@/components/ui/dropdown-menu.tsx`)
- Toaster/Sonner (`@/components/ui/Toaster.tsx`)

### Key Findings

- **Total UI areas assessed:** 5 major sections
- **shadcn adoption:** ~15% (3 components out of many UI patterns)
- **Custom Tailwind patterns:** ~85% (forms, cards, tables, navigation, overlays)
- **Migration opportunity:** HIGH - significant custom UI that can be replaced with shadcn equivalents

---

## 1. Layout & Navigation

### 1.1 App Shell & Container

| Component | Location | Status | Description |
|-----------|----------|--------|-------------|
| AppShell | `src/components/layout/AppShell.tsx` | Custom (Tailwind-only) | Main layout wrapper with flex container |
| Root Layout | `app/layout.tsx` | Mixed (uses shadcn Toaster) | HTML structure with ThemeProvider |
| Public Layout | `app/(public)/layout.tsx` | Custom (minimal) | Fragment wrapper for public routes |
| App Layout | `app/(app)/layout.tsx` | Custom (uses AppShell) | Authenticated routes layout with CartProvider |

**Notes:**
- AppShell uses basic flex layout: `flex h-screen overflow-hidden bg-background`
- Container pattern: `container mx-auto p-6 max-w-7xl`
- Could benefit from shadcn's layout primitives or composition patterns

### 1.2 Sidebar Navigation

| Component | Location | Status | Description |
|-----------|----------|--------|-------------|
| Sidebar | `src/components/layout/Sidebar.tsx` | Custom (Tailwind-only) | Collapsible sidebar with nav items |
| Nav Items | Inside Sidebar component | Custom | Link-based navigation with active states |
| Collapse Button | Inside Sidebar component | Custom | Toggle button with ChevronLeft/Right icons |

**Notes:**
- Custom collapsible implementation: `w-64` → `w-16` with transition
- Active state: `bg-accent text-accent-foreground`
- Badge display for cart counter: absolute positioned span
- **Migration opportunity:** shadcn has a new `sidebar` component (v1+) that could replace this entire implementation

### 1.3 Theme & User Controls

| Component | Location | Status | Description |
|-----------|----------|--------|-------------|
| ThemeToggle | `src/components/layout/ThemeToggle.tsx` | Custom button (Tailwind-only) | Light/dark mode toggle with next-themes |
| UserMenu | `src/components/layout/UserMenu.tsx` | Custom dropdown | User avatar and menu with manual click-outside logic |

**Notes:**
- ThemeToggle: Custom button with icon swap (Sun/Moon)
- UserMenu: Manual dropdown implementation with `useState` and click-outside detection
- **Migration opportunity:** Replace UserMenu with shadcn DropdownMenu (already available)

---

## 2. Forms & Inputs

### 2.1 Text Inputs

| Component | Location | Status | Description |
|-----------|----------|--------|-------------|
| Search Input | `src/features/catalog/components/CatalogPageContent.tsx` | Custom (inline) | Search bar with icon |
| Login Email/Password | `app/(public)/page.tsx` | Custom (inline) | Login form inputs |
| Register Form Inputs | `src/features/catalog/components/CatalogPageContent.tsx` | Custom (inline) | Multi-field registration form |
| Quantity Input | `src/features/catalog/components/ProductDetailPageContent.tsx` | Custom number input | Quantity selector with +/- buttons |
| Chat Message Input | `src/features/agent/components/AgentChatPageContent.tsx` | Custom textarea | Auto-resizing message input |

**Pattern identified:**
```tsx
className={cn(
  'block w-full px-3/4 py-2 border border-input',
  'rounded-lg bg-background',
  'text-foreground placeholder:text-muted-foreground',
  'focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent'
)}
```

**Notes:**
- All inputs use consistent focus ring pattern
- No Input component from shadcn (should be added)
- No Select, Checkbox, Radio, or Switch components (all needed)
- **Migration opportunity:** HIGH - all form inputs should use shadcn Input, Textarea, Select primitives

### 2.2 Buttons

| Component | Location | Status | Description |
|-----------|----------|--------|-------------|
| Primary Buttons | Throughout app | ✅ shadcn Button | Already using `@/components/ui/button` |
| Secondary Buttons | Various | ✅ shadcn Button | Using `variant="secondary"` |
| Icon Buttons | Catalog, Cart | ✅ shadcn Button | Buttons with icons |
| Custom Action Buttons | Catalog table | Custom inline buttons | "Details" and "Add" buttons in table rows |

**Notes:**
- shadcn Button is well-adopted for primary actions
- Some inline buttons in tables bypass the Button component (should be migrated)
- Custom buttons in table cells: `inline-flex items-center gap-1 px-3 py-1.5 bg-secondary...`

### 2.3 Form Layouts

| Component | Location | Status | Description |
|-----------|----------|--------|-------------|
| Login Form | `app/(public)/page.tsx` | Custom (form + div grid) | Email/password with submit button |
| Register Form | `src/features/catalog/components/CatalogPageContent.tsx` | Custom grid layout | Inline registration form with grid-cols-2 |

**Notes:**
- Forms use basic HTML `<form>` with custom layouts
- No validation UI or error states implemented
- **Migration opportunity:** shadcn Form (react-hook-form integration) could add validation and better UX

---

## 3. Data Display

### 3.1 Cards

| Component | Location | Status | Description |
|-----------|----------|--------|-------------|
| Login Card | `app/(public)/page.tsx` | Custom card | White card with shadow and border |
| Catalog Item Cards (table) | `src/features/catalog/components/CatalogPageContent.tsx` | Custom table | Items displayed in table, not cards |
| Cart Item Cards | `src/features/cart/components/CartPageContent.tsx` | Custom cards | Each cart item in a card |
| Product Detail Card | `src/features/catalog/components/ProductDetailPageContent.tsx` | Custom card | Large product info card |
| Order Summary Card | `src/features/cart/components/CartPageContent.tsx` | Custom sticky card | Cart summary sidebar |
| Agent Chat Container | `src/features/agent/components/AgentChatPageContent.tsx` | Custom card | Chat interface container |
| Register Form Card | `src/features/catalog/components/CatalogPageContent.tsx` | Custom card | Inline form container |

**Pattern identified:**
```tsx
className="bg-card rounded-lg border border-border p-6"
```

**Notes:**
- MANY custom card implementations throughout the app
- All follow similar pattern: bg-card, rounded-lg, border, padding
- **Migration opportunity:** CRITICAL - shadcn Card (with CardHeader, CardContent, CardFooter) would standardize all cards

### 3.2 Tables

| Component | Location | Status | Description |
|-----------|----------|--------|-------------|
| Catalog Items Table | `src/features/catalog/components/CatalogPageContent.tsx` | Custom HTML table | Full-width responsive table |

**Pattern identified:**
```tsx
<table className='min-w-full divide-y divide-border'>
  <thead className='bg-muted'>
    <tr>
      <th className='px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider'>
```

**Notes:**
- Custom table with Tailwind classes
- Hover states: `hover:bg-accent/50` on rows
- Responsive with `overflow-x-auto` wrapper
- **Migration opportunity:** shadcn Table component would provide consistent styling and better accessibility

### 3.3 Lists & Item Display

| Component | Location | Status | Description |
|-----------|----------|--------|-------------|
| Navigation Items | `src/components/layout/Sidebar.tsx` | Custom list | Nav links with icons |
| Cart Items | `src/features/cart/components/CartPageContent.tsx` | Custom card list | Repeated card pattern |
| Chat Messages | `src/features/agent/components/AgentChatPageContent.tsx` | Custom list | Message bubble components |

**Notes:**
- No standardized list component
- Spacing handled with `space-y-4` utility classes
- **Migration opportunity:** Consider shadcn composition patterns for lists

### 3.4 Badges & Tags

| Component | Location | Status | Description |
|-----------|----------|--------|-------------|
| Category Badge | `src/features/catalog/components/CatalogPageContent.tsx` | Custom badge | `px-2 py-1 inline-flex text-xs rounded-full bg-primary/10 text-primary` |
| Cart Badge | `src/components/layout/Sidebar.tsx` | Custom badge | Absolute positioned badge on icon |
| Status Badge | `src/features/catalog/components/ProductDetailPageContent.tsx` | Custom badge | Rounded-full status indicator |

**Notes:**
- Multiple custom badge implementations with slight variations
- **Migration opportunity:** shadcn Badge component would standardize appearance

### 3.5 Empty States

| Component | Location | Status | Description |
|-----------|----------|--------|-------------|
| Empty Cart | `src/features/cart/components/CartPageContent.tsx` | Custom (card + centered content) | ShoppingCart icon + text + button |
| No Search Results | `src/features/catalog/components/CatalogPageContent.tsx` | Custom (table row) | Empty state in table |
| Product Not Found | `src/features/catalog/components/ProductDetailPageContent.tsx` | Custom (card + centered) | Package icon + text + button |

**Notes:**
- Consistent pattern: icon + heading + description + CTA button
- **Migration opportunity:** Could use shadcn Alert or Empty component patterns

---

## 4. Feedback

### 4.1 Toasts & Notifications

| Component | Location | Status | Description |
|-----------|----------|--------|-------------|
| Toaster | `src/components/ui/Toaster.tsx` | ✅ shadcn Sonner | Already using shadcn's Sonner toast |
| Toast Calls | Throughout features | ✅ Using `toast()` from sonner | Success, error, info toasts |

**Notes:**
- Toast implementation is already shadcn-based ✅
- Well-integrated with theme system
- No changes needed

### 4.2 Loading States

| Component | Location | Status | Description |
|-----------|----------|--------|-------------|
| Button Loading | Multiple locations | Custom (Loader2 icon) | `<Loader2 className='h-4 w-4 animate-spin' />` |
| Chat Typing Indicator | `src/features/agent/components/AgentChatPageContent.tsx` | Custom animated dots | Three bouncing dots |

**Notes:**
- Loading states use lucide-react Loader2 icon with Tailwind `animate-spin`
- Typing indicator: custom animation with `animate-bounce` and staggered delays
- **Migration opportunity:** shadcn Spinner or Skeleton could be added for consistency

### 4.3 Alerts & Banners

| Component | Location | Status | Description |
|-----------|----------|--------|-------------|
| Demo Credentials Info | `app/(public)/page.tsx` | Custom (text + button) | Helper text in login form |

**Notes:**
- No dedicated Alert component
- **Migration opportunity:** shadcn Alert for important messages

---

## 5. Overlays & Interactions

### 5.1 Dialogs & Modals

| Component | Location | Status | Description |
|-----------|----------|--------|-------------|
| None currently | N/A | N/A | No dialogs/modals implemented yet |

**Notes:**
- **Migration opportunity:** Add shadcn Dialog for future features (delete confirmations, item details, etc.)

### 5.2 Dropdown Menus

| Component | Location | Status | Description |
|-----------|----------|--------|-------------|
| DropdownMenu (installed) | `src/components/ui/dropdown-menu.tsx` | ✅ shadcn DropdownMenu | Already available |
| UserMenu (custom) | `src/components/layout/UserMenu.tsx` | Custom dropdown | Manual implementation instead of using shadcn |

**Notes:**
- DropdownMenu component exists but is NOT being used
- UserMenu reimplements dropdown with manual click-outside logic
- **Migration opportunity:** HIGH - replace UserMenu custom dropdown with shadcn DropdownMenu

### 5.3 Tooltips

| Component | Location | Status | Description |
|-----------|----------|--------|-------------|
| None | N/A | N/A | No tooltips implemented |

**Notes:**
- Using `title` attributes on some buttons (e.g., Sidebar collapse button)
- **Migration opportunity:** Add shadcn Tooltip for better UX

### 5.4 Popovers

| Component | Location | Status | Description |
|-----------|----------|--------|-------------|
| None | N/A | N/A | No popovers implemented |

**Notes:**
- **Migration opportunity:** Consider shadcn Popover for contextual help or filters

### 5.5 Sheets / Drawers

| Component | Location | Status | Description |
|-----------|----------|--------|-------------|
| None | N/A | N/A | No sheets/drawers implemented |

**Notes:**
- Sidebar is implemented as a fixed panel, not a Sheet
- **Migration opportunity:** Consider shadcn Sheet for mobile sidebar or additional drawers

---

## Summary by Implementation Type

### ✅ Already shadcn-based (3 components)

1. **Button** - Well-adopted across the app
2. **DropdownMenu** - Installed but NOT used (opportunity)
3. **Toaster (Sonner)** - Well-integrated

### 🟡 Custom (Tailwind-only) - High Migration Priority

**Layout & Navigation:**
- AppShell, Sidebar, Nav Items, ThemeToggle, UserMenu

**Forms & Inputs:**
- All text inputs, textarea, number inputs, search bars

**Data Display:**
- All cards (7+ instances), Tables, Lists, Badges (3+ types), Empty states

**Feedback:**
- Loading indicators (custom Loader2 usage), Typing indicator

### 🔴 Not Implemented - Should Add

**Forms:**
- Input, Textarea, Select, Checkbox, Radio, Switch, Label, Form (validation)

**Data Display:**
- Card (with Header/Content/Footer), Table, Badge, Alert

**Overlays:**
- Dialog, Tooltip, Popover, Sheet

**Layout:**
- Separator, Tabs, Accordion

---

## Recommendations

1. **Phase 1 - Core Primitives:** Migrate forms (Input, Textarea, Select, Label) and standardize Button usage
2. **Phase 2 - Layout & Structure:** Replace custom cards with shadcn Card, migrate Sidebar to shadcn Sidebar component
3. **Phase 3 - Data Display:** Migrate Table, Badge, add Alert component
4. **Phase 4 - Overlays:** Replace UserMenu with DropdownMenu, add Dialog, Tooltip, Sheet
5. **Phase 5 - Feature Refinements:** Clean up custom patterns, ensure consistency

---

**Next Steps:** See `shadcn-mapping-table.md` for detailed component-by-component mapping and `shadcn-redesign-migration-plan.md` for phased migration approach.
