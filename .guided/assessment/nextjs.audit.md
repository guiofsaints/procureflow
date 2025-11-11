# Next.js Audit (App Router, SSR, Caching, Performance)

**Project**: ProcureFlow  
**Framework**: Next.js 16.0.1 (App Router)  
**Audit Date**: November 10, 2025

---

## Executive Summary

**Next.js Health**: GOOD with configuration improvements needed  
**App Router Usage**: ✅ Excellent (proper route organization)  
**Server/Client Separation**: ✅ Well-implemented  
**Critical Issue**: `ignoreBuildErrors: true` in config

---

## 1. next.config.mjs Audit 🔴 CRITICAL

**File**: `packages/web/next.config.mjs`

```javascript
const nextConfig = {
  output: 'standalone',  // ✅ Good for Docker
  compress: true,  // ✅ Good for production
  poweredByHeader: false,  // ✅ Security best practice

  typescript: {
    ignoreBuildErrors: true,  // ❌ CRITICAL: Type errors ignored
  },

  serverExternalPackages: ['winston-loki', 'snappy', 'tiktoken'],  // ✅ Correct

  async redirects() {
    return [];  // Empty, acceptable
  },

  async rewrites() {
    return [];  // Empty, acceptable
  },
};
```

### Issues
1. **`ignoreBuildErrors: true`** - Ships with type errors ❌
2. **No `images` domains** - Acceptable if no external images
3. **No `experimental` features** - Acceptable

### Recommendations
```javascript
const nextConfig = {
  output: 'standalone',
  compress: true,
  poweredByHeader: false,

  typescript: {
    ignoreBuildErrors: false,  // ✅ Enforce type safety
  },

  // Add if using external images
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',  // Or specific domains
      },
    ],
  },

  // Consider enabling
  experimental: {
    typedRoutes: true,  // Type-safe navigation
  },
};
```

---

## 2. App Router Structure ✅ EXCELLENT

**Directory Organization**:
```
app/
  (public)/              # Unauthenticated routes
    layout.tsx           # Public layout
    page.tsx             # Login page
    docs/
      page.tsx           # Documentation

  (app)/                 # Authenticated routes
    layout.tsx           # App layout with AppShell
    agent/
      page.tsx           # Agent chat
    api/                 # API routes
      items/
        route.ts         # GET/POST /api/items
        [id]/
          route.ts       # GET/DELETE /api/items/:id
    cart/
      page.tsx           # Cart view
    catalog/
      page.tsx           # Catalog listing
    purchase/
      page.tsx           # Purchase history
      [id]/
        page.tsx         # Purchase detail
    settings/
      page.tsx           # User settings

  api/
    metrics/
      route.ts           # Prometheus metrics (public)
```

**Assessment**: ✅ Excellent use of route groups and nested layouts

---

## 3. Server vs Client Components ✅ EXCELLENT

### Server Components (Default)
**Files**: All `page.tsx` files without `'use client'`

**Example**:
```typescript
// app/(app)/catalog/page.tsx
import { searchItems } from '@/features/catalog';

export default async function CatalogPage() {
  const items = await searchItems({ limit: 50 });  // ✅ Direct service call
  return <CatalogPageContent items={items} />;
}
```

**Assessment**: Proper use of Server Components for data fetching

---

### Client Components
**Pattern**: `'use client'` only for interactivity

**Examples**:
- `features/agent/components/AgentChatPageContent.tsx` - Form handling
- `features/catalog/components/CatalogPageContent.tsx` - Filtering
- `components/layout/ThemeToggle.tsx` - Theme switching

**Assessment**: Minimal client JS bundle (good)

---

## 4. Data Fetching Patterns

### Current Pattern: Direct Service Calls in Server Components
```typescript
// app/(app)/agent/page.tsx
import { getConversationById } from '@/features/agent';

export default async function AgentPage({ searchParams }: { searchParams: { id?: string } }) {
  const conversationId = searchParams.id;
  const conversation = conversationId
    ? await getConversationById(conversationId, 'demo-user-id')
    : null;

  return <AgentChatPageContent initialConversation={conversation} />;
}
```

**Assessment**: ✅ Excellent (avoids API roundtrip, direct DB query)

---

### Missing Patterns
1. **No `loading.tsx` files** - Users see blank page during data fetch
2. **No `error.tsx` boundaries** - Errors crash entire route
3. **No Suspense boundaries** - Cannot stream UI

**Recommendations**:
```typescript
// app/(app)/catalog/loading.tsx
export default function Loading() {
  return <CatalogSkeleton />;
}

// app/(app)/catalog/error.tsx
'use client';
export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return <ErrorDisplay error={error} onRetry={reset} />;
}
```

---

## 5. Caching Strategy

### Current State
**No explicit caching configuration detected**

**Next.js Default Behavior**:
- Static routes: Cached indefinitely
- Dynamic routes with DB calls: Not cached (correct for real-time data)

### Segment Config (Missing)
**Recommendation**: Add route segment config where appropriate

```typescript
// app/(app)/catalog/page.tsx
export const revalidate = 3600;  // ISR: Revalidate every hour
export const dynamic = 'force-static';  // Or 'force-dynamic' for real-time

export default async function CatalogPage() {
  const items = await searchItems({ limit: 50 });
  return <CatalogPageContent items={items} />;
}
```

**When to use**:
- `revalidate`: For semi-static data (catalog items)
- `dynamic = 'force-dynamic'`: For user-specific data (cart, purchases)
- `dynamic = 'force-static'`: For static pages (docs)

---

## 6. Route Handlers (API Routes)

### Pattern: Thin Wrappers ✅ GOOD
**Example**:
```typescript
// app/(app)/api/items/route.ts
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const items = await catalogService.searchItems({
      q: searchParams.get('q') || undefined,
      limit: parseInt(searchParams.get('limit') || '50'),
    });

    return NextResponse.json({ items, count: items.length });
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
```

**Assessment**: ✅ Proper separation (route handler → service layer)

---

### Issues
1. **No HTTP method validation** - Could add explicit 405 responses
2. **No rate limiting** - Consider Vercel Edge Config or Upstash
3. **No CORS headers** - Acceptable if same-origin only

**Recommendations**:
```typescript
// Unsupported methods return 405
export async function PUT() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405, headers: { Allow: 'GET, POST' } }
  );
}
```

---

## 7. Metadata & SEO

### Current State
**No `metadata` exports detected in page files**

**Recommendation**: Add metadata for SEO

```typescript
// app/(app)/catalog/page.tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Catalog - ProcureFlow',
  description: 'Browse procurement catalog',
};

export default async function CatalogPage() {
  // ...
}
```

---

## 8. Layouts & Templates

### Root Layout
**File**: `app/layout.tsx`

```typescript
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang='en' suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <Providers>
            {children}
          </Providers>
        </ThemeProvider>
        <Toaster />
      </body>
    </html>
  );
}
```

**Assessment**: ✅ Proper use of providers at root level

---

### Nested Layouts
**Files**:
- `app/(public)/layout.tsx` - Public layout (no auth)
- `app/(app)/layout.tsx` - App layout with AppShell

**Assessment**: ✅ Excellent separation of concerns

---

## 9. Image Optimization

**Pattern**: No `next/image` usage detected

**Recommendation**: Use `next/image` for static assets

```typescript
import Image from 'next/image';

<Image
  src="/logo.png"
  alt="ProcureFlow Logo"
  width={200}
  height={50}
  priority
/>
```

---

## 10. Font Optimization

**Detection**: No `next/font` usage found

**Recommendation**: Use `next/font` for Google Fonts

```typescript
// app/layout.tsx
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({ children }) {
  return (
    <html lang='en' className={inter.className}>
      <body>{children}</body>
    </html>
  );
}
```

---

## 11. Streaming & Suspense

**Current State**: No streaming detected

**Recommendation**: Wrap slow components in Suspense

```typescript
// app/(app)/purchase/page.tsx
import { Suspense } from 'react';

export default function PurchasePage() {
  return (
    <div>
      <h1>Purchase History</h1>
      <Suspense fallback={<PurchaseHistorySkeleton />}>
        <PurchaseHistory />
      </Suspense>
    </div>
  );
}
```

---

## 12. Middleware Usage

**File**: `middleware.ts` (not found)

**Recommendation**: Add middleware for auth checks (see duplication-report.md)

```typescript
// middleware.ts
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (pathname.startsWith('/api/cart') || pathname.startsWith('/api/checkout')) {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};
```

---

## 13. Anti-Patterns Detected

### ❌ Using Client Components for Static Content
**Observation**: Most components properly separated

### ❌ Over-Fetching in Client Components
**Example**: `useAgentConversations` fetches all conversations client-side

**Fix**: Move to Server Component with pagination

---

## Summary & Recommendations

### Critical (Week 1)
1. ❌ **Remove `ignoreBuildErrors: true`** from next.config.mjs
2. ✅ **Add `error.tsx` boundaries** to all route segments
3. ✅ **Add `loading.tsx` skeletons** for better UX

### High Priority (Month 1)
4. ✅ **Add metadata exports** for SEO
5. ✅ **Implement middleware** for auth (reduce duplication)
6. ✅ **Add Suspense boundaries** for streaming

### Medium Priority (Quarter 1)
7. ✅ **Configure caching** with `revalidate` where appropriate
8. ✅ **Add `next/font` optimization**
9. ✅ **Add `next/image` for assets**

---

## Metrics & Goals

### Current State
- TypeScript errors: Ignored in build ❌
- loading.tsx coverage: 0%
- error.tsx coverage: 0%
- Metadata coverage: 0%

### Target State (8 weeks)
- TypeScript errors: 0 (enforced)
- loading.tsx coverage: 100%
- error.tsx coverage: 100%
- Metadata coverage: 100%

---

**Next**: `typescript.audit.md`, `api-rest.audit.md`, `refactor.plan.md`
