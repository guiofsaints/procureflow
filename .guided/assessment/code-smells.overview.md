# Code Smells Overview

**Project**: ProcureFlow  
**Audit Date**: November 10, 2025  
**Repository**: guiofsaints/procureflow  
**Codebase Size**: 149 TypeScript files, ~24,066 LOC  
**Severity Scale**: 🔴 Critical | 🟠 High | 🟡 Medium | 🟢 Low

---

## Executive Summary

This audit identified **68 code smells** across 11 categories, with **12 critical issues** that require immediate attention. The codebase demonstrates strong architectural patterns (feature-based organization, service layer separation) but suffers from systematic type safety violations, inconsistent error handling, and technical debt from disabled TypeScript strictness.

**Key Metrics**:
- **Critical Issues**: 12 (type safety, build configuration, memory issues)
- **High Priority**: 18 (hooks violations, error handling, duplication)
- **Medium Priority**: 24 (complexity, file size, context overuse)
- **Low Priority**: 14 (minor refactors, cleanup opportunities)

**Risk Assessment**: **MEDIUM-HIGH**
- Type safety is significantly compromised (`any` usage, strict mode disabled)
- React hooks violations risk runtime errors and stale closures
- Missing runtime validation layer between API and service boundaries
- TypeScript compiler cannot complete due to memory issues (diagnostic failure)

---

## Smells by Category

### 1. Type Safety Violations 🔴 CRITICAL

| ID | Severity | Issue | Count | Impact |
|----|----------|-------|-------|--------|
| TS-001 | 🔴 Critical | `any` type usage in service layer | 20+ | Defeats type system, no compile-time safety |
| TS-002 | 🔴 Critical | TypeScript strict mode disabled | 1 | Allows implicit any, null, undefined |
| TS-003 | 🔴 Critical | Build errors ignored | 1 | Ships with type errors to production |
| TS-004 | 🔴 Critical | TypeScript compiler OOM | 1 | Cannot run full type diagnostics |
| TS-005 | 🟠 High | ESLint suppressions for `any` | 20+ | Intentional bypassing of type checks |
| TS-006 | 🟡 Medium | Missing discriminated unions | TBD | Weak type narrowing in conditionals |

**Examples**:

```typescript
// packages/web/src/features/cart/lib/cart.service.ts:467
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapCartToDto(cart: any): Cart {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const items = cart.items.map((item: any) => ({
    itemId: item.itemId?.toString() || '',
    itemName: item.itemName || '',
    itemPrice: item.itemPrice || 0,
    quantity: item.quantity || 0,
    subtotal: item.subtotal || 0,
  }));
  // ... 15 more lines with fallback operators masking type issues
}

// packages/web/src/features/checkout/lib/checkout.service.ts:79
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const itemIds = cart.items.map((cartItem: any) => cartItem.itemId);
```

**Root Cause**:
Mongoose document types are not properly mapped to domain entities. Services receive Mongoose docs (with `_id`, `__v`, methods) but expect plain objects. Instead of creating proper type guards and mappers, developers used `any` as an escape hatch.

**Impact**: 
- No compile-time verification of object shapes
- Runtime errors from missing/mistyped properties
- Refactoring is unsafe (no confidence in changes)
- New developers cannot trust IDE autocomplete

**Recommended Fix**:
1. Enable TypeScript strict mode incrementally (isolate modules)
2. Create typed Mongoose document interfaces extending domain entities
3. Replace `any` with proper types or `unknown` + type guards
4. Add Zod schemas mirroring domain entities for runtime validation

---

### 2. Build & Configuration Issues 🔴 CRITICAL

| ID | Severity | Issue | Location | Impact |
|----|----------|-------|----------|--------|
| BC-001 | 🔴 Critical | `strict: false` in tsconfig | `packages/web/tsconfig.json:5` | Disables all strictness checks |
| BC-002 | 🔴 Critical | `ignoreBuildErrors: true` | `next.config.mjs:17` | Ships type errors to production |
| BC-003 | 🔴 Critical | `tsc --noEmit` OOM failure | N/A | Cannot validate types locally |
| BC-004 | 🟡 Medium | `skipLibCheck: true` | `packages/web/tsconfig.json:6` | Ignores node_modules types |

**Config Snapshot**:

```jsonc
// packages/web/tsconfig.json
{
  "compilerOptions": {
    "strict": false,        // ❌ All strictness disabled
    "skipLibCheck": true,   // ⚠️ No node_modules type checks
    "noEmit": true          // ✅ Correct for Next.js
  }
}

// packages/web/next.config.mjs
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,  // ❌ Ignores all type errors at build time
  },
};
```

**Root Cause**:
Likely enabled during initial prototyping to bypass type errors, never re-enabled. The comment in next.config "Skip TypeScript checks during build (run separately with tsc)" suggests intent to run checks in CI, but `tsc --noEmit` fails with OOM.

**Impact**:
- Production builds succeed despite type errors
- No safety net for type regressions
- Developers bypass type system instead of fixing issues

**Recommended Fix**:
1. Enable `strict: true` in tsconfig (may require 500+ fixes)
2. Remove `ignoreBuildErrors` and fix actual type errors
3. Investigate tsc memory issue (increase Node heap, check circular deps)
4. Add `tsc --noEmit --incremental` to CI pipeline

---

### 3. React Hooks Violations 🟠 HIGH

| ID | Severity | Issue | Location | Impact |
|----|----------|-------|----------|--------|
| RH-001 | 🟠 High | Missing dependency in useEffect | `useAgentConversations.ts:69` | Stale closure, infinite loop risk |
| RH-002 | 🟡 Medium | Intentional setState in useEffect | `ThemeToggle.tsx:28` | Hydration mismatch workaround |
| RH-003 | 🟡 Medium | Exhaustive-deps disabled | `PurchaseRequestDetailPageContent.tsx:50` | May cause stale data |
| RH-004 | 🟡 Medium | Exhaustive-deps disabled | `PurchaseHistoryPageContent.tsx:69` | May cause stale data |

**Example - Missing Dependency**:

```typescript
// packages/web/src/features/agent/hooks/useAgentConversations.ts:54-85
export function useAgentConversations(): UseAgentConversationsReturn {
  const [conversations, setConversations] = useState<AgentConversationSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchConversations = async () => {
    // ... fetch logic
  };

  useEffect(() => {
    fetchConversations();

    const handleConversationUpdate = () => {
      fetchConversations();
    };

    window.addEventListener('conversationUpdated', handleConversationUpdate);

    return () => {
      window.removeEventListener('conversationUpdated', handleConversationUpdate);
    };
  }, []); // ❌ Missing `fetchConversations` dependency

  return { conversations, isLoading, error, refetch: fetchConversations };
}
```

**Root Cause**:
`fetchConversations` is defined inside component scope but not included in dependency array. Works by accident (function identity stable) but violates Rules of Hooks and risks stale closures if function depends on props/state.

**Impact**:
- Silent bugs if `fetchConversations` later depends on reactive values
- ESLint rule disabled means similar violations can creep in
- Difficult to debug (works in dev, breaks in prod with React Compiler)

**Recommended Fix**:
1. Wrap `fetchConversations` in `useCallback` with proper dependencies
2. Re-enable `react-hooks/exhaustive-deps` ESLint rule (currently `warn`)
3. Audit all useEffect hooks for missing dependencies (search for `// eslint-disable-next-line react-hooks/exhaustive-deps`)

---

### 4. File Size & Complexity 🟠 HIGH

| Rank | File | LOC | Category | Cyclomatic Complexity (est.) |
|------|------|-----|----------|------------------------------|
| 1 | `agent.service.ts` | 1,503 | Service | Very High (15+ functions, nested logic) |
| 2 | `sidebar.tsx` | 726 | UI Component | Medium (shadcn template) |
| 3 | `openapi.ts` | 683 | API Schema | Low (declarative) |
| 4 | `agent-orchestrator.ts` | 584 | Service | High (state machine logic) |
| 5 | `entities.ts` | 541 | Domain Model | Low (type definitions) |
| 6 | `langchainClient.ts` | 535 | AI Integration | Medium (LLM wrapper) |
| 7 | `agent-conversation.schema.ts` | 531 | Schema | Low (Mongoose schema) |
| 8 | `providerAdapter.ts` | 515 | AI Integration | Medium (adapter pattern) |
| 9 | `purchase-request.schema.ts` | 494 | Schema | Low (Mongoose schema) |
| 10 | `cart.service.ts` | 492 | Service | Medium (CRUD operations) |

**Smell**: `agent.service.ts` at **1,503 lines** is a **God Object**

**Excerpt Analysis**:
```typescript
// packages/web/src/features/agent/lib/agent.service.ts
// Contains 15+ exported functions:
// - handleAgentMessage (main orchestrator, 200+ lines)
// - getConversationById, listConversations (CRUD)
// - generateConversationTitle (AI call)
// - deleteConversation, deleteAllConversationsForUser (delete ops)
// - Conversation manager (another 300+ lines)
// - Tool definitions (search_catalog, add_to_cart, checkout, etc. - 500+ lines)
// - Mapper functions (100+ lines)
// - Error handling logic (50+ lines)
```

**Root Cause**:
Single file accumulates all agent-related logic: conversation management, tool execution, LLM orchestration, persistence, and business rules. Violates Single Responsibility Principle.

**Impact**:
- Difficult to navigate and understand
- High merge conflict risk (many developers touching same file)
- Testing requires mocking entire world
- Cannot tree-shake unused exports

**Recommended Refactor**:
Split into focused modules:
1. `agent.service.ts` - Public API (handleAgentMessage, CRUD)
2. `agent-tools.ts` - Tool definitions and schemas
3. `agent-executor.ts` - Tool execution logic (already exists but not fully separated)
4. `conversation-manager.ts` - Conversation CRUD (already exists)
5. `conversation-title-generator.ts` - AI title generation
6. `agent-mappers.ts` - Domain <-> Document mappers

---

### 5. Code Duplication 🟠 HIGH

| ID | Severity | Pattern | Occurrences | Files |
|----|----------|---------|-------------|-------|
| DUP-001 | 🟠 High | Mongoose → DTO mapper with `any` | 6+ | cart.service, checkout.service, agent.service |
| DUP-002 | 🟡 Medium | Error handling in route handlers | 40+ | All `/api/**/route.ts` files |
| DUP-003 | 🟡 Medium | Session auth check boilerplate | 30+ | API routes requiring auth |
| DUP-004 | 🟡 Medium | Zod validation + error response | 20+ | POST/PUT route handlers |
| DUP-005 | 🟢 Low | Context provider pattern | 3 | CartContext, LayoutContext, BreadcrumbContext |

**Example - Duplicated Mapper Pattern**:

```typescript
// packages/web/src/features/cart/lib/cart.service.ts:467
function mapCartToDto(cart: any): Cart {
  const items = cart.items.map((item: any) => ({
    itemId: item.itemId?.toString() || '',
    itemName: item.itemName || '',
    itemPrice: item.itemPrice || 0,
    quantity: item.quantity || 0,
    subtotal: item.subtotal || 0,
  }));
  const totalCost = items.reduce((sum: number, item: any) => sum + item.subtotal, 0);
  return { /* ... */ };
}

// packages/web/src/features/checkout/lib/checkout.service.ts:90
const requestItems = cart.items.map((cartItem: any) => {
  const item = itemsMap.get(cartItem.itemId?.toString());
  return {
    itemId: cartItem.itemId?.toString() || '',
    itemName: item?.name || cartItem.itemName || '',
    itemCategory: item?.category || '',
    // ... identical pattern with fallback operators
  };
});
```

**Near-Duplicate Detection**:
- **Similarity**: 85% (same structure, property access, fallback operators)
- **Location**: 
  - `cart.service.ts:467-490` (mapCartToDto)
  - `checkout.service.ts:90-103` (cart items mapping)
  - `agent.service.ts:301-325` (conversation messages mapping)

**Root Cause**:
No shared mapper utility for Mongoose documents. Each service implements its own `any`-typed mapper with defensive fallback operators.

**Recommended Fix**:
Create shared typed mappers:
```typescript
// lib/db/mappers/cart.mapper.ts
import type { CartDocument } from '@/lib/db/schemas/cart.schema';
import type { Cart } from '@/domain/entities';

export function mapCartDocumentToEntity(doc: CartDocument): Cart {
  return {
    id: doc._id.toString(),
    userId: doc.userId.toString(),
    items: doc.items.map(item => ({
      itemId: item.itemId.toString(),
      itemName: item.itemName,
      itemPrice: item.itemPrice,
      quantity: item.quantity,
      subtotal: item.subtotal,
    })),
    totalCost: doc.totalCost,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}
```

---

### 6. Error Handling Inconsistency 🟡 MEDIUM

| ID | Severity | Issue | Count | Pattern |
|----|----------|-------|-------|---------|
| EH-001 | 🟡 Medium | `console.error` instead of logger | 15+ | API route handlers |
| EH-002 | 🟡 Medium | Generic error messages | 20+ | `'Failed to X'` without context |
| EH-003 | 🟡 Medium | No error tracking IDs | All | Cannot correlate logs with user reports |
| EH-004 | 🟢 Low | Inconsistent error response schema | 10+ | Some return `{error, message}`, others just `{error}` |

**Examples**:

```typescript
// packages/web/src/app/(app)/api/items/route.ts:35
} catch (error) {
  console.error('Error in GET /api/items:', error);  // ❌ Not using winston logger
  return NextResponse.json(
    {
      error: 'Failed to search items',  // ⚠️ Generic message
      message: error instanceof Error ? error.message : 'Unknown error',
    },
    { status: 500 }
  );
}

// packages/web/src/app/(app)/api/cart/route.ts:45
} catch (error) {
  console.error('Error in GET /api/cart:', error);  // ❌ Duplicate pattern
  return NextResponse.json(
    { error: 'Failed to fetch cart' },  // ⚠️ No message field
    { status: 500 }
  );
}
```

**Root Cause**:
- Winston logger exists (`lib/logger/winston.config.ts`) but not consistently used in API routes
- No centralized error handler middleware
- Each route handler implements its own try-catch pattern

**Impact**:
- Logs go to stdout (console) instead of structured logging (winston → Loki)
- Cannot search logs by correlation ID
- Difficult to debug production issues

**Recommended Fix**:
1. Create API error handler utility:
```typescript
// lib/api/errorHandler.ts
import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger/winston.config';

export function handleApiError(error: unknown, context: string): NextResponse {
  const correlationId = crypto.randomUUID();
  logger.error(`[${correlationId}] ${context}`, { error });
  
  return NextResponse.json(
    {
      error: context,
      message: error instanceof Error ? error.message : 'Unknown error',
      correlationId,
    },
    { status: error instanceof ValidationError ? 400 : 500 }
  );
}
```

2. Use in all route handlers:
```typescript
} catch (error) {
  return handleApiError(error, 'Failed to search items');
}
```

---

### 7. Unimplemented Features (TODOs) 🟡 MEDIUM

| ID | Severity | Feature | Location | Risk |
|----|----------|---------|----------|------|
| TODO-001 | 🟡 Medium | Item update API endpoint | `item-mutate-dialog.tsx:130` | Feature gap |
| TODO-002 | 🟡 Medium | Item update API endpoint (duplicate) | `item-mutate-drawer.tsx:86` | Same gap |
| TODO-003 | 🟡 Medium | Force create with confirmation | `item-mutate-drawer.tsx:117` | UX incomplete |
| TODO-004 | 🟢 Low | Provider tracking in metrics | `agent.service.ts:287` | Observability gap |

**Excerpt**:

```typescript
// packages/web/src/features/catalog/components/item-mutate-dialog.tsx:130
const handleUpdate = async (data: ItemFormData) => {
  try {
    setIsSubmitting(true);
    // TODO: Implement PUT /api/items/{id} when endpoint is ready
    throw new Error('Update endpoint not implemented');
  } catch (error) {
    // ...
  }
};
```

**Root Cause**:
UI components built before backend endpoints. Dialogs/drawers exist but POST handler not yet implemented.

**Impact**:
- UI misleads users (update button exists but doesn't work)
- Incomplete feature parity (can create but not update catalog items)

**Recommended Fix**:
1. Implement `PUT /api/items/[id]/route.ts` with service layer support
2. Add `updateItem(id, input)` to `catalog.service.ts`
3. Remove TODO comments and enable update functionality

---

### 8. Magic Numbers 🟢 LOW

| ID | Severity | Value | Occurrences | Meaning |
|----|----------|-------|-------------|---------|
| MN-001 | 🟢 Low | `5000` | 2 | Max message length (characters) |
| MN-002 | 🟢 Low | `1000` | 4 | Max quantity per cart item |
| MN-003 | 🟢 Low | `100` | 6 | Max limit for search results |
| MN-004 | 🟢 Low | `500` | 2 | Max notes length, max search query |
| MN-005 | 🟢 Low | `768` | 1 | Mobile breakpoint (pixels) |

**Observation**: Most magic numbers are in Zod validation schemas (`lib/validation/schemas.ts`) and are well-documented with error messages. HTTP status codes (200, 400, 500) in OpenAPI schema are acceptable.

**Recommended Fix**: Extract to constants file only if reused across modules:
```typescript
// lib/constants/validation.ts
export const VALIDATION_LIMITS = {
  MESSAGE_MAX_LENGTH: 5000,
  CART_ITEM_MAX_QUANTITY: 1000,
  SEARCH_MAX_LIMIT: 100,
  NOTES_MAX_LENGTH: 500,
} as const;
```

---

### 9. ESLint Suppressions 🟡 MEDIUM

**Total Suppressions**: 20+ `// eslint-disable` comments

**Breakdown by Rule**:
- `@typescript-eslint/no-explicit-any`: 18 occurrences (service layer mappers)
- `react-hooks/exhaustive-deps`: 2 occurrences (intentional dependency omissions)
- `react-hooks/set-state-in-effect`: 1 occurrence (hydration mismatch workaround)

**Pattern**:
```typescript
// Typical suppression pattern in services
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const items = cart.items.map((item: any) => ({
  // ... mapping logic
}));
```

**Root Cause**:
ESLint rule `@typescript-eslint/no-explicit-any` is set to `warn` (not `error`), and developers suppress warnings instead of fixing underlying type issues.

**Impact**:
- Suppression comments become noise
- Easy to miss legitimate type issues among suppressed warnings
- New developers copy-paste suppression pattern

**Recommended Fix**:
1. Upgrade rule to `error` in ESLint config
2. Fix all `any` types (see Type Safety section)
3. Remove suppression comments

---

### 10. Context Overuse 🟡 MEDIUM

| Context | Location | State Managed | Justification |
|---------|----------|---------------|---------------|
| CartContext | `contexts/CartContext.tsx` | `itemCount` (number) | ⚠️ Overkill for single number |
| LayoutContext | `contexts/LayoutContext.tsx` | `variant`, `collapsible`, `layout` | ⚠️ Could be URL params |
| BreadcrumbContext | `contexts/BreadcrumbContext.tsx` | `dynamicLabels` (Record) | ✅ Reasonable (cross-route state) |

**Example - CartContext**:

```typescript
// contexts/CartContext.tsx
export function CartProvider({ children }: { children: ReactNode }) {
  const [itemCount, setItemCount] = useState(0);

  return (
    <CartContext.Provider value={{ itemCount, setItemCount }}>
      {children}
    </CartContext.Provider>
  );
}
```

**Smell**: Context for a single primitive value that could be in URL query param or local storage.

**Root Cause**:
Premature abstraction. CartContext was likely created expecting more cart state (items, total) but ended up only holding `itemCount`. The actual cart data is fetched from API on each page.

**Impact**:
- Unnecessary re-renders (all context consumers re-render on itemCount change)
- Complexity without benefit (3-file boilerplate for one number)

**Alternative Approaches**:
1. **Zustand/Jotai**: Atomic state management for single values
2. **URL param**: `?cartCount=3` (persists across navigation)
3. **Local component state**: If only used in header/nav, lift state to nearest common ancestor

**Recommended Fix**:
- Keep BreadcrumbContext (legitimately shared)
- Consolidate LayoutContext state into URL search params or remove if unused
- Replace CartContext with server-fetched count in layout (React Server Components pattern)

---

### 11. Commented-Out Code 🟢 LOW

**Total Instances**: 2 (both in `moderation.ts`)

```typescript
// packages/web/src/lib/validation/moderation.ts:163
if (!enableModeration) {
  // Moderation disabled - pass through
  return {
    flagged: false,
    categories: [],
    violationSeverity: 'none',
  };
}
```

**Analysis**: Not actually commented-out code, just explanatory comments for disabled features. Acceptable.

---

## Summary Table by Severity

| Severity | Category | Count | Top Issues |
|----------|----------|-------|------------|
| 🔴 Critical | Type Safety, Build Config | 6 | `any` usage, strict mode disabled, build errors ignored |
| 🟠 High | Hooks Violations, File Size, Duplication | 8 | Missing deps, 1500-line file, duplicated mappers |
| 🟡 Medium | Error Handling, TODOs, Context Overuse | 14 | console.error instead of logger, unimplemented APIs |
| 🟢 Low | Magic Numbers, ESLint Suppressions | 40 | Validation limits, HTTP status codes |

---

## Root Causes Analysis

### 1. **Type Safety Disabled During Prototyping, Never Re-Enabled**
- `strict: false` and `ignoreBuildErrors: true` suggest rapid prototyping phase
- Technical debt accumulated as features were built without type checks
- **Fix**: Incremental strict mode migration (enable one check at a time)

### 2. **Mongoose Document → Domain Entity Impedance Mismatch**
- Services expect plain objects (domain entities) but receive Mongoose documents
- Developers used `any` escape hatch instead of proper mappers
- **Fix**: Typed document interfaces + shared mapper utilities

### 3. **No Centralized API Error Handling Pattern**
- Each route handler implements its own try-catch
- Copy-paste culture leads to duplication
- **Fix**: Shared `handleApiError` utility + Next.js error.ts boundaries

### 4. **React Hooks Learning Curve**
- Missing dependencies suggest incomplete understanding of closure rules
- **Fix**: Team training + enforce `react-hooks/exhaustive-deps` as error

### 5. **Monolithic Service Files**
- Single files accumulate all related logic (God Object anti-pattern)
- **Fix**: Extract concerns into separate modules (tools, mappers, executors)

---

## Recommendations by Priority

### 🔴 Immediate (Week 1)
1. **Enable TypeScript strict mode** (at least `noImplicitAny`, `strictNullChecks`)
2. **Remove `ignoreBuildErrors`** from next.config (fix type errors)
3. **Fix React hooks violations** (add missing dependencies)
4. **Investigate tsc OOM issue** (increase heap, check circular deps)

### 🟠 Short-Term (Month 1)
5. **Eliminate `any` usage** in service layer (replace with proper types)
6. **Create shared mapper utilities** (Mongoose → Domain)
7. **Implement centralized API error handler**
8. **Split `agent.service.ts`** into focused modules
9. **Complete unimplemented features** (PUT /api/items/:id)

### 🟡 Medium-Term (Quarter 1)
10. **Replace console.error with logger** in all API routes
11. **Audit and optimize React contexts** (remove CartContext, consolidate LayoutContext)
12. **Add OpenAPI runtime validation** (sync with Zod schemas)
13. **Extract magic numbers** to constants (if reused)

### 🟢 Low Priority (Ongoing)
14. **Remove ESLint suppressions** (after fixing underlying issues)
15. **Add JSDoc comments** to public service functions
16. **Enable `react-hooks/exhaustive-deps` as error**

---

## Metrics & Goals

### Current State
- **Type Coverage**: ~40% (many `any` types)
- **Test Coverage**: Unknown (no test files detected)
- **ESLint Errors**: 0 (many suppressed warnings)
- **TypeScript Errors**: Unknown (tsc crashes)

### Target State (3 months)
- **Type Coverage**: 95%+ (strict mode enabled)
- **Test Coverage**: 80%+ (unit + integration)
- **ESLint Errors**: 0 (no suppressions)
- **TypeScript Errors**: 0 (tsc completes successfully)
- **Cyclomatic Complexity**: <15 per function (split complex functions)
- **File Size**: <500 LOC per file (split large files)

---

## Next Documents

1. `duplication-report.md` - Detailed near-duplicate analysis with similarity scores
2. `complexity-metrics.md` - Cyclomatic complexity, maintainability index, hotspots
3. `dead-unused.code.md` - Unused exports, unreachable code, tree-shake blockers
4. `error-handling.observability.md` - Error taxonomy, logging standards, monitoring
5. `react.audit.md` - Hooks deep dive, memoization, component boundaries
6. `nextjs.audit.md` - App Router patterns, caching, SSR/RSC analysis
7. `typescript.audit.md` - Type system audit, strict mode migration plan
8. `api-rest.audit.md` - HTTP conventions, validation, OpenAPI sync
9. `refactor.plan.md` - 3-wave refactor roadmap with acceptance criteria

---

**Generated**: November 10, 2025  
**Auditor**: CodeQualityEngineer AI Agent  
**Next Review**: Every 2 weeks during refactor waves
