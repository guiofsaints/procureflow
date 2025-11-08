# Dead Code and Junk Report

**Generated:** 2025-01-08  
**Purpose:** Identify unused files, exports, mock data, and legacy code that can be safely removed.

---

## Executive Summary

The codebase is relatively clean for a bootstrap project, but there are **several redundant mock files and duplicate test files** that should be consolidated or removed. The primary issue is **unnecessary duplication** rather than truly "dead" code.

### Key Findings

- ✅ **No major dead code detected** - all services and API routes are in use
- ⚠️ **Duplicate test file** - `tests/agent-mock.test.ts` duplicates `tests/api/agent-mock.test.ts`
- ⚠️ **Mock data exported but rarely used** - `mockItems`, `mockCartItems`, `mockMessages` are exported but not actively used in production code
- ✅ **Feature exports are clean** - all service functions are properly used by API routes

---

## Detailed Findings by Area

### 1. Mock Files (`src/features/**/mock*.ts`)

#### 📂 `src/features/catalog/mock.ts`

**Status:** ⚠️ Likely obsolete  
**Location:** `apps/web/src/features/catalog/mock.ts`

**Evidence:**

- Exported via `src/features/catalog/index.ts` as `mockItems`
- **Not imported anywhere** in production code (API routes or components)
- Used only in documentation and old tests (likely deprecated)

**Content:** Array of 10 hardcoded catalog items (Laptop, Office Chair, Mouse, etc.)

**Recommendation:**

- **Safe candidate for removal** - No active imports found
- Alternative: Keep for manual testing but remove from public exports

---

#### 📂 `src/features/cart/mock.ts`

**Status:** ⚠️ Likely obsolete  
**Location:** `apps/web/src/features/cart/mock.ts`

**Evidence:**

- Exported via `src/features/cart/index.ts` as `mockCartItems`
- **Not imported anywhere** in production code
- CartPageContent uses real API (`GET /api/cart`)

**Content:** Array of 3 hardcoded cart items

**Recommendation:**

- **Safe candidate for removal** - Cart feature is fully DB-integrated
- Can remove from `src/features/cart/index.ts` exports

---

#### 📂 `src/features/agent/mock.ts`

**Status:** ⚠️ Likely obsolete  
**Location:** `apps/web/src/features/agent/mock.ts`

**Evidence:**

- Exported via `src/features/agent/index.ts` as `mockMessages`
- **Not imported anywhere** in production code
- Agent feature uses real API (`POST /api/agent/chat`)

**Content:** Array of 5 sample conversation messages (system, user, assistant)

**Recommendation:**

- **Safe candidate for removal** - Agent conversation is DB-integrated
- Keep in `index.ts` marked as "legacy export for backward compatibility"

---

#### 📂 `src/features/agent/mocks/mockAgent.ts`

**Status:** ✅ **Actively used in tests**  
**Location:** `apps/web/src/features/agent/mocks/mockAgent.ts`

**Evidence:**

- Imported by:
  - `tests/api/agent-mock.test.ts`
  - `tests/agent-mock.test.ts` (duplicate)
- Contains: `parseUserMessage()`, `findMockItems()`, `generateMockAgentResponse()`

**Recommendation:**

- **KEEP** - Used for unit testing mock agent logic
- Not junk - provides testable agent parsing logic

---

#### 📂 `src/features/agent/mocks/mockItems.ts`

**Status:** ✅ **Used by mockAgent.ts**  
**Location:** `apps/web/src/features/agent/mocks/mockItems.ts`

**Evidence:**

- Imported by `mockAgent.ts` (line 10)
- Contains: 10 agent-specific mock items (different from catalog mocks)

**Recommendation:**

- **KEEP** - Required by `mockAgent.ts` for testing
- Not junk - part of test infrastructure

---

### 2. Duplicate Test Files

#### 📂 `tests/agent-mock.test.ts` (DUPLICATE)

**Status:** ❌ **Duplicate file - safe to remove**  
**Location:** `apps/web/tests/agent-mock.test.ts`

**Evidence:**

- **Exact duplicate** of `tests/api/agent-mock.test.ts`
- Both files have identical content (191 lines)
- Tests same functions: `parseUserMessage`, `findMockItems`, `generateMockAgentResponse`

**Recommendation:**

- **Safe candidate for removal** - keep only `tests/api/agent-mock.test.ts`
- Canonical location should be `tests/api/` to match other test structure

---

### 3. Unused Exports (Feature Modules)

#### 📂 `src/features/catalog/index.ts`

```typescript
export { mockItems } from './mock';
```

**Status:** ⚠️ Exported but unused  
**Usage:** No imports found in codebase (except `index.ts` re-export)

**Recommendation:**

- Remove this line from `index.ts`
- Keep the file `mock.ts` if desired for manual reference, but don't export

---

#### 📂 `src/features/cart/index.ts`

```typescript
export { mockCartItems } from './mock';
```

**Status:** ⚠️ Exported but unused  
**Usage:** No imports found in codebase

**Recommendation:**

- Remove this line from `index.ts`

---

#### 📂 `src/features/agent/index.ts`

```typescript
// Legacy exports (keeping for backward compatibility)
export { mockMessages } from './mock';
```

**Status:** ⚠️ Marked as legacy, but no active use detected

**Recommendation:**

- **Safe to remove** if truly legacy
- Alternatively: add deprecation comment with removal date

---

### 4. Database Layer - No Dead Code Detected

#### ✅ `src/lib/db/models.ts`

All model exports are actively used:

- `UserModel` - used in auth
- `ItemModel` - used in catalog, cart, checkout
- `CartModel` - used in cart, checkout
- `PurchaseRequestModel` - used in checkout
- `AgentConversationModel` - used in agent service

**Recommendation:**

- No cleanup needed

---

#### ✅ `src/lib/db/schemas/*.ts`

All schemas are referenced by models:

- `user.schema.ts` → `UserModel`
- `item.schema.ts` → `ItemModel`
- `cart.schema.ts` → `CartModel`
- `purchase-request.schema.ts` → `PurchaseRequestModel`
- `agent-conversation.schema.ts` → `AgentConversationModel`

**Recommendation:**

- No cleanup needed

---

### 5. API Routes - All Active

Checked all routes in `app/(app)/api/`:

- ✅ `health/route.ts` - health check endpoint
- ✅ `items/route.ts` - catalog search and create
- ✅ `cart/route.ts` - get cart
- ✅ `checkout/route.ts` - submit purchase request
- ✅ `agent/chat/route.ts` - agent message handling
- ✅ `purchase-requests/route.ts` - list purchase requests
- ✅ `openapi/route.ts` - API documentation

**Recommendation:**

- No cleanup needed - all routes are part of active feature set

---

### 6. Components - No Dead UI Detected

All components in `src/features/*/components/` are used:

- Catalog: `CatalogPageContent.tsx`, `catalog-table.tsx`, `item-mutate-drawer.tsx`, etc.
- Cart: `CartPageContent.tsx`
- Checkout: `PurchaseHistoryPageContent.tsx`, `PurchaseRequestDetailPageContent.tsx`
- Agent: `AgentChatPageContent.tsx`, `AgentProductCard.tsx`, `MessageBubble.tsx`, etc.

**Recommendation:**

- No cleanup needed

---

## Summary Table

| File/Export                             | Type           | Status    | Recommendation                                           |
| --------------------------------------- | -------------- | --------- | -------------------------------------------------------- |
| `tests/agent-mock.test.ts`              | Duplicate test | ❌ Remove | Safe - exact duplicate of `tests/api/agent-mock.test.ts` |
| `src/features/catalog/mock.ts` export   | Mock data      | ⚠️ Unused | Remove from `index.ts` exports                           |
| `src/features/cart/mock.ts` export      | Mock data      | ⚠️ Unused | Remove from `index.ts` exports                           |
| `src/features/agent/mock.ts` export     | Mock data      | ⚠️ Unused | Remove or document as deprecated                         |
| `src/features/agent/mocks/mockAgent.ts` | Test utility   | ✅ Keep   | Used in tests                                            |
| `src/features/agent/mocks/mockItems.ts` | Test data      | ✅ Keep   | Used by mockAgent.ts                                     |
| All service layer files                 | Business logic | ✅ Keep   | All actively used                                        |
| All API routes                          | HTTP endpoints | ✅ Keep   | All part of active features                              |
| All DB models/schemas                   | Data layer     | ✅ Keep   | All referenced                                           |

---

## Cleanup Checklist

### High Priority (Safe Removal)

- [ ] **Delete** `apps/web/tests/agent-mock.test.ts` (duplicate)
- [ ] **Remove** `export { mockItems }` from `src/features/catalog/index.ts`
- [ ] **Remove** `export { mockCartItems }` from `src/features/cart/index.ts`

### Medium Priority (Review First)

- [ ] **Review and remove** `export { mockMessages }` from `src/features/agent/index.ts`
  - Check if any external consumers exist before removal
  - If not, safe to delete

### Low Priority (Optional)

- [ ] **Consider removing** actual mock files (`mock.ts`) if not needed for reference:
  - `src/features/catalog/mock.ts`
  - `src/features/cart/mock.ts`
  - `src/features/agent/mock.ts`
  - These are not imported anywhere but may serve as documentation

---

## Conclusion

Overall, the codebase is **lean and well-maintained**. The only true dead code is:

1. **Duplicate test file** (immediate removal safe)
2. **Unused mock exports** (can be cleaned up without risk)

No service layer code, API routes, or database schemas are unused. This indicates good discipline during the bootstrap phase.

**Estimated Impact:**

- **Files to delete:** 1 (duplicate test)
- **Lines of code reduction:** ~50 lines (removing unused exports)
- **Risk level:** ⚡ **LOW** - all removals are non-breaking

---

_End of Report_
