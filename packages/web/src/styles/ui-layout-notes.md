# ProcureFlow UI Architecture Notes

## Overview

This document describes the UI architecture and component composition for ProcureFlow, explaining how the layout components, feature pages, and theme system work together.

## Component Architecture

### Server vs Client Components

The application follows Next.js 15 App Router patterns with a clear separation between Server and Client Components:

**Server Components** (default):

- Page routes in `app/(app)/{feature}/page.tsx`
- Root and route group layouts
- Used for static rendering and data fetching (future)
- No interactivity or client-side state

**Client Components** (`'use client'` directive):

- All layout components (AppShell, Sidebar, ThemeToggle, UserMenu)
- All feature page content components (CatalogPageContent, CartPageContent, AgentChatPageContent)
- Components requiring hooks, event handlers, or browser APIs
- Theme-related components (ThemeProvider, ThemeToggle)

## Layout Hierarchy

```
Root Layout (app/layout.tsx)
├─ ThemeProvider (wraps entire app)
└─ Route Groups
    ├─ Public Routes (app/(public)/)
    │   └─ Public Layout (simple passthrough)
    │       └─ Landing Page
    │
    └─ App Routes (app/(app)/)
        └─ App Layout
            └─ AppShell (Client Component)
                ├─ Sidebar (Client Component)
                │   ├─ Logo/Header
                │   ├─ Navigation Items
                │   └─ Bottom Section
                │       ├─ ThemeToggle
                │       └─ UserMenu
                └─ Main Content Area
                    └─ Page Content (feature components)
```

## Theme System

### ThemeProvider

- **Location**: `src/components/theme-provider.tsx`
- **Type**: Client Component
- **Purpose**: Wraps the entire app in `next-themes` provider
- **Integration**: Added to root `app/layout.tsx`
- **Configuration**:
  - `attribute='class'` - Uses class-based dark mode
  - `defaultTheme='system'` - Respects system preference
  - `enableSystem` - Allows system theme detection
  - `disableTransitionOnChange` - Prevents flash on theme change

### ThemeToggle

- **Location**: `src/components/layout/ThemeToggle.tsx`
- **Type**: Client Component
- **Purpose**: Toggle between light and dark themes
- **Features**:
  - Shows sun/moon icon based on current theme
  - Handles hydration mismatch with `mounted` state
  - Collapses to icon-only when sidebar is collapsed
  - Accessible with proper ARIA labels and titles

### Dark Mode Classes

Tailwind CSS dark mode classes are used throughout:

```tsx
className = 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white';
```

## Layout Components

### AppShell

- **Location**: `src/components/layout/AppShell.tsx`
- **Type**: Client Component
- **Purpose**: Main authenticated app container
- **Structure**:
  - Flex container with full height
  - Sidebar on the left
  - Main content area on the right with scrolling
  - Container with max-width and padding for content
- **Responsive**: Works on desktop and mobile (sidebar collapsible)

### Sidebar

- **Location**: `src/components/layout/Sidebar.tsx`
- **Type**: Client Component
- **Purpose**: Navigation sidebar with collapsible behavior
- **Features**:
  - **Collapse/Expand**: Button in header toggles width
    - Expanded: 16rem (w-64)
    - Collapsed: 4rem (w-16)
  - **Sections**:
    1. Header: Logo + collapse button
    2. Navigation: Links to Catalog, Cart, Agent
    3. Bottom: ThemeToggle + UserMenu
  - **Active State**: Highlights current route
  - **Accessibility**: Proper ARIA labels, tooltips when collapsed

### UserMenu

- **Location**: `src/components/layout/UserMenu.tsx`
- **Type**: Client Component
- **Purpose**: User profile dropdown at bottom of sidebar
- **Features**:
  - Avatar with user initials (mock: "GS")
  - User name and email display (when sidebar expanded)
  - Dropdown menu with Profile, Settings, Logout options
  - Click-outside detection to close dropdown
  - Adapts position when sidebar is collapsed

## Feature Pages

All feature pages follow this pattern:

1. **Page Route** (Server Component): `app/(app)/{feature}/page.tsx`
   - Imports and renders the corresponding PageContent component
   - Can pass props or fetch data (not implemented yet)

2. **PageContent Component** (Client Component): `src/features/{feature}/components/{Feature}PageContent.tsx`
   - Contains all UI logic, state management, and interactivity
   - Uses mock data from `src/features/{feature}/mock.ts`
   - No API calls yet - ready for future integration

### Catalog Page

- **Route**: `/catalog`
- **Component**: `CatalogPageContent`
- **Features**:
  - Search bar with live filtering
  - Register new item form (inline, toggleable)
  - Items table with category badges
  - Add to cart button (shows alert - mock)
- **Mock Data**: `mockItems` from `src/features/catalog/mock.ts`

### Cart Page

- **Route**: `/cart`
- **Component**: `CartPageContent`
- **Features**:
  - Cart items list with quantity controls
  - Increment/decrement buttons (1-999 range)
  - Remove item button
  - Order summary with total calculation
  - Checkout button (shows alert - mock)
  - Empty cart state with link back to catalog
- **Mock Data**: `mockCartItems` from `src/features/cart/mock.ts`
- **State Management**: Local React state for cart operations

### Agent Chat Page

- **Route**: `/agent`
- **Component**: `AgentChatPageContent`
- **Features**:
  - Message history display with MessageBubble components
  - User vs Assistant message styling
  - Auto-scroll to latest message
  - Textarea input with send button
  - Typing indicator animation
  - Mock AI responses (1.5s delay)
- **Mock Data**: `mockMessages` from `src/features/agent/mock.ts`
- **State Management**: Local React state for messages

## How to Plug in API Calls

When ready to integrate with backend APIs:

### Option 1: Server Components + Server Actions (Recommended)

```tsx
// app/(app)/catalog/page.tsx (Server Component)
import { getItems } from '@/features/catalog';

export default async function CatalogPage() {
  const items = await getItems(); // Server-side API call
  return <CatalogPageContent initialItems={items} />;
}
```

### Option 2: Client-Side Fetching with SWR/React Query

```tsx
// src/features/catalog/components/CatalogPageContent.tsx
'use client';
import useSWR from 'swr';

export function CatalogPageContent() {
  const { data: items, error } = useSWR('/api/items', fetcher);
  // Render with real data
}
```

### Option 3: Route Handlers + Client Fetch

```tsx
// Keep existing route handlers in app/(app)/api/
// Fetch from client components using fetch() or axios
const items = await fetch('/api/items').then((r) => r.json());
```

## File Organization Summary

```
apps/web/
├── app/
│   ├── layout.tsx                    # Root layout with ThemeProvider
│   ├── (public)/
│   │   ├── layout.tsx                # Public routes layout
│   │   └── page.tsx                  # Landing page
│   └── (app)/
│       ├── layout.tsx                # App layout with AppShell
│       ├── catalog/page.tsx          # Catalog route
│       ├── cart/page.tsx             # Cart route
│       └── agent/page.tsx            # Agent route
│
└── src/
    ├── components/
    │   ├── theme-provider.tsx        # Theme provider
    │   ├── layout/
    │   │   ├── AppShell.tsx          # Main app container
    │   │   ├── Sidebar.tsx           # Collapsible sidebar
    │   │   ├── ThemeToggle.tsx       # Theme switcher
    │   │   └── UserMenu.tsx          # User dropdown
    │   └── ui/
    │       └── Button.tsx            # Reusable button
    │
    └── features/
        ├── catalog/
        │   ├── components/
        │   │   └── CatalogPageContent.tsx
        │   ├── lib/
        │   │   └── catalog.service.ts
        │   └── mock.ts
        ├── cart/
        │   ├── components/
        │   │   └── CartPageContent.tsx
        │   ├── lib/
        │   │   └── cart.service.ts
        │   └── mock.ts
        └── agent/
            ├── components/
            │   ├── AgentChatPageContent.tsx
            │   └── MessageBubble.tsx
            ├── lib/
            │   └── agent.service.ts
            └── mock.ts
```

## Key Design Decisions

1. **Route Groups**: Separates public and authenticated routes clearly
2. **Client Components for Interactivity**: All interactive UI uses client components
3. **Server Components for Pages**: Page routes are server components for future data fetching
4. **Mock Data Separation**: Mock data in separate files for easy replacement
5. **Theme Support**: Built-in dark mode with system preference detection
6. **Responsive Design**: Mobile-friendly with collapsible sidebar
7. **Accessibility**: ARIA labels, keyboard navigation, semantic HTML
8. **TypeScript Strict**: Full type safety across all components

## Next Steps for Integration

1. **Authentication**:
   - Add session check in `app/(app)/layout.tsx`
   - Redirect unauthenticated users to login
   - Update UserMenu with real user data

2. **API Integration**:
   - Replace mock data with API calls
   - Use Server Components for initial data
   - Use Client Components with SWR/React Query for mutations

3. **Form Validation**:
   - Add react-hook-form or similar
   - Implement proper validation rules
   - Show error messages

4. **Real-time Features**:
   - WebSocket for agent chat
   - Optimistic updates for cart operations
   - Loading states and error handling

5. **State Management**:
   - Consider Zustand/Redux if needed for global state
   - Keep local state where possible

## Conclusion

The UI is structured to be:

- **Maintainable**: Clear separation of concerns
- **Extensible**: Easy to add new features
- **Type-safe**: Full TypeScript coverage
- **Accessible**: ARIA attributes and semantic HTML
- **Responsive**: Works on all screen sizes
- **Theme-aware**: Light and dark modes supported

All components are ready to receive real data from services/APIs without major refactoring.
