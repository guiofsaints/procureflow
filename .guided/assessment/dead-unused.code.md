# Dead & Unused Code Inventory

**Project**: ProcureFlow  
**Audit Date**: November 10, 2025  
**Detection Method**: Semantic search + manual review

---

## Executive Summary

**Dead Code Risk**: LOW-MEDIUM  
**Unused Exports Detected**: 8 instances (mostly in barrel files)  
**Unreachable Code**: 2 instances (feature flags, moderation disabled)  
**Tree-Shake Blockers**: 3 patterns identified

---

## Unused Exports

### 1. Barrel File Over-Exports

**File**: `components/index.ts`  
**Pattern**: Exports all UI components, some unused in app

**Examples**:

- `SheetTitle`, `SheetDescription` - Exported but not used
- `FormMessage` - Only used internally in forms
- `DropdownMenuShortcut`, `DropdownMenuRadioGroup` - Not used

**Impact**: LOW - Tree-shaking should remove, but adds noise to autocomplete

**Recommendation**: Audit barrel exports, remove unused

---

### 2. Placeholder Function Parameters

**Pattern**: Unused callback parameters in event handlers

**Examples**:

```typescript
// packages/web/src/components/layout/Header.tsx
useEffect(() => {
  const onScroll = () => {
    // No parameters used
    setOffset(document.body.scrollTop || document.documentElement.scrollTop);
  };
  document.addEventListener('scroll', onScroll, { passive: true });
  return () => document.removeEventListener('scroll', onScroll);
}, []);
```

**Impact**: NEGLIGIBLE - Normal pattern, not actual dead code

---

## Unreachable Code

### 1. Moderation Feature (Disabled)

**File**: `lib/validation/moderation.ts:163,191`  
**Pattern**: Early return when feature flag disabled

```typescript
if (!enableModeration) {
  // Moderation disabled - pass through
  return {
    flagged: false,
    categories: [],
    violationSeverity: 'none',
  };
}
// Rest of function unreachable when enableModeration=false
```

**Impact**: MEDIUM - Dead code in production if flag always false

**Recommendation**:

- If permanently disabled, remove dead code
- If temporary, add tests for enabled state

---

### 2. Unimplemented Update Handler

**File**: `features/catalog/components/item-mutate-dialog.tsx:130`

```typescript
const handleUpdate = async (data: ItemFormData) => {
  try {
    setIsSubmitting(true);
    // TODO: Implement PUT /api/items/{id} when endpoint is ready
    throw new Error('Update endpoint not implemented');

    // Everything below is unreachable
    const response = await fetch(`/api/items/${currentRow.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    // ...
  }
}
```

**Impact**: HIGH - Function exists but always throws

**Recommendation**: Implement endpoint or remove update UI

---

## Side-Effect Modules (Tree-Shake Blockers)

### 1. Metrics Registration

**File**: `lib/metrics/prometheus.config.ts`  
**Pattern**: Module-level side effects (register metrics on import)

```typescript
// Executed immediately on import
export const agentRequestTotal = new Counter({
  name: 'agent_requests_total',
  help: 'Total agent requests',
  registers: [register],
});
```

**Impact**: MEDIUM - Cannot tree-shake metrics module

**Recommendation**: Acceptable pattern for metrics, keep as-is

---

### 2. Database Connection Singleton

**File**: `lib/db/mongoose.ts`  
**Pattern**: Module-level cached connection

**Impact**: LOW - Intentional pattern for Next.js hot reload

---

### 3. Logger Initialization

**File**: `lib/logger/winston.config.ts`  
**Pattern**: Module-level logger instance

**Impact**: LOW - Standard logger pattern

---

## Unused Files/Assets

### Public Assets

```bash
find packages/web/public -type f
# Results: Empty directory (no static assets)
```

**Observation**: No unused assets detected

---

### Unused Scripts

**File**: `packages/web/scripts/seed-fruits.ts`  
**Usage**: Not referenced in package.json scripts

**Recommendation**: Remove if not needed, or add to npm scripts

---

## Import Analysis

### Never-Imported Modules

**Detection**: Search for files with no imports in other files

**Result**: All service files imported by route handlers ✅  
**Result**: All component files imported by pages/layouts ✅

---

### Circular Imports

**Pattern**: Not detected (tsc would fail to compile)

**Observation**: TypeScript compiler OOM prevents full check, but no obvious cycles found

---

## Recommendations

### High Priority

1. **Implement or remove update handler** - `item-mutate-dialog.tsx`
2. **Audit moderation feature** - Remove if permanently disabled
3. **Clean barrel exports** - Remove unused UI component exports

### Medium Priority

4. **Add script for unused export detection** - `npx ts-prune` or similar
5. **Document feature flags** - Create registry of disabled features
6. **Add tree-shake validation** - CI check for bundle size

### Low Priority

7. **Audit public assets** - Currently empty, no action needed
8. **Review seed scripts** - Add `seed-fruits.ts` to package.json or remove

---

## Metrics & Goals

### Current State

- Unused exports: ~8 (barrel files)
- Unreachable code: 2 blocks (feature flags)
- Tree-shake blockers: 3 (acceptable patterns)

### Target State (4 weeks)

- Unused exports: 0 (audit complete)
- Unreachable code: 0 (implement or remove)
- Tree-shake blockers: Document and accept

---

**Next**: `react.audit.md`, `nextjs.audit.md`, `typescript.audit.md`, `api-rest.audit.md`
