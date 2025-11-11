# React Audit (Hooks, Components, Performance)

**Project**: ProcureFlow  
**Framework**: React 19.2.0  
**Audit Date**: November 10, 2025

---

## Executive Summary

**React Health**: GOOD with 3 HIGH-PRIORITY issues  
**Hooks Violations**: 4 instances (missing dependencies)  
**Component Architecture**: ✅ Well-structured (Server Components by default)  
**Performance**: ✅ Minimal unnecessary re-renders detected

---

## 1. Rules of Hooks Violations 🔴 HIGH

### Issue 1.1: Missing Dependencies in useEffect

**File**: `features/agent/hooks/useAgentConversations.ts:69`  
**Severity**: 🔴 Critical

```typescript
export function useAgentConversations() {
  const [conversations, setConversations] = useState<
    AgentConversationSummary[]
  >([]);

  const fetchConversations = async () => {
    // ... fetch logic using setConversations, setError, setIsLoading
  };

  useEffect(() => {
    fetchConversations();

    const handleConversationUpdate = () => {
      fetchConversations(); // ❌ Closure captures initial fetchConversations
    };

    window.addEventListener('conversationUpdated', handleConversationUpdate);
    return () => {
      window.removeEventListener(
        'conversationUpdated',
        handleConversationUpdate
      );
    };
  }, []); // ❌ Missing fetchConversations dependency

  return { conversations, isLoading, error, refetch: fetchConversations };
}
```

**Problem**: `fetchConversations` is defined in component scope but not in deps array. Works by accident (function stable), but violates Rules of Hooks.

**Fix**:

```typescript
const fetchConversations = useCallback(async () => {
  // ... same logic
}, []); // No external dependencies

useEffect(() => {
  fetchConversations();

  const handleConversationUpdate = () => {
    fetchConversations();
  };

  window.addEventListener('conversationUpdated', handleConversationUpdate);
  return () => {
    window.removeEventListener('conversationUpdated', handleConversationUpdate);
  };
}, [fetchConversations]); // ✅ Proper dependency
```

---

### Issue 1.2: Intentional setState in useEffect (Hydration Workaround)

**File**: `components/layout/ThemeToggle.tsx:28`  
**Severity**: 🟡 Medium (acceptable with justification)

```typescript
export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (!mounted) {
    return <SkeletonButton />;  // Prevent hydration mismatch
  }
  // ...
}
```

**Analysis**: Intentional pattern to avoid hydration mismatch with theme. ESLint suppression justified.

**Recommendation**: Keep as-is, document pattern in component JSDoc.

---

### Issue 1.3: Exhaustive-deps Disabled

**Files**:

- `features/checkout/components/PurchaseRequestDetailPageContent.tsx:50`
- `features/checkout/components/PurchaseHistoryPageContent.tsx:69`

**Pattern**:

```typescript
useEffect(() => {
  fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []); // Missing dependencies
```

**Recommendation**: Review each case, likely needs `useCallback` wrapper.

---

## 2. Component Architecture ✅ GOOD

### Server vs Client Components

**Pattern**: Server Components by default, `'use client'` only when needed

**Examples**:

```typescript
// app/(app)/catalog/page.tsx - Server Component
export default async function CatalogPage() {
  const items = await searchItems({ limit: 50 });  // Direct DB query
  return <CatalogPageContent items={items} />;
}

// features/catalog/components/CatalogPageContent.tsx - Client Component
'use client';
export function CatalogPageContent({ items }: { items: Item[] }) {
  const [filteredItems, setFilteredItems] = useState(items);
  // Interactive logic
}
```

**Assessment**: ✅ Excellent separation of concerns (React Server Components best practice)

---

### Component Boundaries

**Observation**: Components are well-scoped

**Examples**:

- `AgentChatPageContent` (270 LOC) - Reasonable size, single responsibility
- `SettingsPageContent` (422 LOC) - ⚠️ Could split into tabs
- `PurchaseRequestDetailPageContent` (180 LOC) - ✅ Good size

**Recommendation**: Split `SettingsPageContent` into separate tab components

---

## 3. Hooks Usage Patterns

### useCallback Usage ✅ GOOD

**File**: `contexts/BreadcrumbContext.tsx`

```typescript
const setDynamicLabel = useCallback((path: string, label: string) => {
  setDynamicLabels((prev) => ({ ...prev, [path]: label }));
}, []); // ✅ Correctly memoized with no deps

const clearDynamicLabel = useCallback((path: string) => {
  setDynamicLabels((prev) => {
    const { [path]: _, ...rest } = prev;
    return rest;
  });
}, []); // ✅ Correctly memoized
```

**Assessment**: Proper use of `useCallback` for context value stability

---

### useMemo Usage

**Pattern**: Not detected in codebase

**Observation**: No premature memoization (good). Consider for expensive computations:

- Filtering large lists in catalog
- Computing cart totals

**Recommendation**: Add useMemo only if performance profiling shows benefit

---

### Custom Hooks

**Files**:

- `hooks/use-mobile.ts` - ✅ Simple responsive breakpoint hook
- `features/agent/hooks/useAgentConversations.ts` - ⚠️ Needs dependency fix

**Assessment**: Minimal custom hooks (good - not over-abstracted)

---

## 4. Context Usage

### Current Contexts

1. **CartContext** (`contexts/CartContext.tsx`)
   - State: `itemCount: number`
   - ⚠️ Overkill for single primitive

2. **LayoutContext** (`contexts/LayoutContext.tsx`)
   - State: `variant`, `collapsible`, `layout`
   - ⚠️ Could be URL params or Zustand

3. **BreadcrumbContext** (`contexts/BreadcrumbContext.tsx`)
   - State: `dynamicLabels: Record<string, string>`
   - ✅ Justified (cross-route breadcrumb state)

**Recommendation**:

- Remove CartContext (fetch count in layout)
- Convert LayoutContext to URL params
- Keep BreadcrumbContext

---

## 5. Prop Drilling

**Observation**: Minimal prop drilling detected

**Example**: Cart actions passed from `CatalogProvider` → `CatalogDataTable` → `ItemMutateDialog`

**Depth**: 2-3 levels (acceptable)

**Recommendation**: Current structure is fine, no action needed

---

## 6. ErrorBoundary Usage

**Detection**: No ErrorBoundary components found

**Next.js Pattern**: Uses `error.tsx` files instead

**Files Found**:

- ❌ No `error.tsx` in `app/(app)/`
- ❌ No global error boundary

**Recommendation**: Add error.tsx files:

```typescript
// app/(app)/error.tsx
'use client';
export default function Error({ error, reset }: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div>
      <h2>Something went wrong!</h2>
      <button onClick={reset}>Try again</button>
    </div>
  );
}
```

---

## 7. Suspense Usage

**Detection**: No Suspense boundaries found

**Recommendation**: Add Suspense for async Server Components:

```typescript
// app/(app)/catalog/page.tsx
import { Suspense } from 'react';

export default function CatalogPage() {
  return (
    <Suspense fallback={<CatalogSkeleton />}>
      <CatalogContent />
    </Suspense>
  );
}
```

---

## 8. Memoization Strategy

### React.memo Usage

**Detection**: None found

**Assessment**: ✅ Good - avoid premature optimization

**When to Add**:

- Large lists that re-render frequently
- Expensive pure components in render tree

**Example candidate**: `AgentProductCard` (rendered in lists)

```typescript
export const AgentProductCard = React.memo(function AgentProductCard({
  item,
}: Props) {
  // ... component logic
});
```

---

## 9. Key Prop Usage in Lists

**Search Pattern**: `.map(` in components

**Examples Found**:

```typescript
// features/agent/components/AgentChatMessages.tsx
{messages.map((message, index) => (
  <MessageBubble key={index} message={message} />  // ⚠️ Using index as key
))}
```

**Issue**: Using index as key is anti-pattern if list can reorder

**Fix**:

```typescript
{messages.map((message) => (
  <MessageBubble key={message.id} message={message} />  // ✅ Stable ID
))}
```

---

## 10. Effect Cleanup Patterns ✅ GOOD

**Examples**:

```typescript
// components/layout/Header.tsx
useEffect(() => {
  const onScroll = () => {
    /* ... */
  };
  document.addEventListener('scroll', onScroll, { passive: true });

  return () => document.removeEventListener('scroll', onScroll); // ✅ Cleanup
}, []);
```

**Assessment**: All event listeners properly cleaned up

---

## 11. Form Handling

**Library**: react-hook-form + Zod  
**Pattern**: ✅ Excellent type-safe form handling

**Example**:

```typescript
// features/settings/components/SettingsPageContent.tsx
const form = useForm<ProfileForm>({
  resolver: zodResolver(profileSchema), // ✅ Type-safe validation
  defaultValues: { name: session?.user?.name || '' },
});
```

**Assessment**: Best practice implementation

---

## 12. Hydration Issues

**Pattern Detection**: Manual SSR/CSR sync checks

**Example**:

```typescript
// components/layout/ThemeToggle.tsx
const [mounted, setMounted] = useState(false);

useEffect(() => {
  setMounted(true);
}, []);

if (!mounted) {
  return <SkeletonButton />;  // ✅ Prevent hydration mismatch
}
```

**Assessment**: Proper hydration mismatch prevention

---

## Summary & Recommendations

### Critical (Week 1)

1. ✅ Fix `useAgentConversations` missing dependency
2. ✅ Add `error.tsx` boundaries for better error UX
3. ✅ Replace index keys with stable IDs in message lists

### High Priority (Month 1)

4. ✅ Audit all `exhaustive-deps` suppressions
5. ✅ Split `SettingsPageContent` into tab components
6. ✅ Remove CartContext (replace with server-fetched count)

### Medium Priority (Quarter 1)

7. ✅ Add Suspense boundaries for async Server Components
8. ✅ Profile and add `React.memo` if needed (catalog cards)
9. ✅ Convert LayoutContext to URL params

---

## Metrics & Goals

### Current State

- Hooks violations: 4
- ErrorBoundary coverage: 0%
- Suspense usage: 0%
- Memoization: Minimal (good)

### Target State (8 weeks)

- Hooks violations: 0
- ErrorBoundary coverage: 100% (error.tsx in all routes)
- Suspense usage: 100% (all async Server Components)
- Memoization: Only where profiled benefits exist

---

**Next**: `nextjs.audit.md`, `typescript.audit.md`, `api-rest.audit.md`
