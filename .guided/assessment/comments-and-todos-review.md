# TODO/FIXME/HACK Comments Review

**Generated:** 2025-01-08  
**Purpose:** Catalog all technical debt markers (TODO, FIXME, HACK) to inform cleanup priorities.

---

## Executive Summary

The codebase contains **6 active TODO comments** in production code, all of which represent **missing integrations or temporary implementations**. There are no FIXME or HACK markers, indicating good code quality discipline.

### Classification Summary

| Classification       | Count | Priority  |
| -------------------- | ----- | --------- |
| Missing Integration  | 3     | 🔴 High   |
| Temporary Workaround | 2     | 🟡 Medium |
| Future Enhancement   | 1     | 🟢 Low    |
| Total                | **6** | -         |

---

## TODOs by Feature/Module

### 1. Authentication (`src/lib/auth/config.ts`)

#### TODO #1: Implement Real User Authentication

**Location:** `apps/web/src/lib/auth/config.ts:33`

**Comment:**

```typescript
// TODO: Remove this and implement real user authentication
if (
  credentials.email === 'demo@procureflow.com' &&
  credentials.password === 'demo123'
) {
  return {
    id: '507f1f77bcf86cd799439011', // Valid MongoDB ObjectId format
    email: 'demo@procureflow.com',
    name: 'Demo User',
    role: 'admin',
  };
}
```

**Classification:** 🔴 **Missing Integration**

**Impact:**

- **HIGH** - Security risk for production deployment
- Currently uses hardcoded credentials
- No password hashing
- No database lookup

**Required Actions:**

1. Implement bcrypt password hashing
2. Query `UserModel` for user lookup
3. Compare hashed passwords
4. Remove demo credentials

**Effort Estimate:** 2-4 hours

**Dependencies:**

- `UserModel` schema (already exists)
- `bcryptjs` package (needs installation)

**Priority:** 🔴 **High** (blocker for production)

---

### 2. Catalog Feature (`src/features/catalog/components/`)

#### TODO #2: Implement Update API Endpoint

**Location:** `apps/web/src/features/catalog/components/item-mutate-drawer.tsx:86`

**Comment:**

```typescript
// TODO: Implement update API endpoint
console.log('Update item:', id, formData);
toast.success('Item updated successfully (mock)');
```

**Classification:** 🔴 **Missing Integration**

**Impact:**

- **MEDIUM** - Feature gap in catalog management
- Users cannot edit existing items
- Only creation is supported

**Required Actions:**

1. Implement `PUT /api/items/[id]` endpoint
2. Add `updateItem()` service function
3. Wire up form submission to API call

**Effort Estimate:** 3-5 hours

**Dependencies:**

- None - straightforward CRUD operation

**Priority:** 🟡 **Medium** (feature completeness)

---

#### TODO #3: Implement Force Create with Confirmation

**Location:** `apps/web/src/features/catalog/components/item-mutate-drawer.tsx:117`

**Comment:**

```typescript
// TODO: Implement force create with confirmation
console.log('Force create despite duplicates');
```

**Classification:** 🟡 **Temporary Workaround**

**Impact:**

- **LOW** - Edge case handling for duplicate detection
- Currently no way to override duplicate warnings
- Users blocked from creating similar items

**Required Actions:**

1. Add `force: boolean` parameter to `createItem()` API
2. Show confirmation dialog when duplicates detected
3. Allow override on user confirmation

**Effort Estimate:** 2-3 hours

**Dependencies:**

- Existing duplicate detection logic (already implemented)

**Priority:** 🟢 **Low** (edge case improvement)

---

#### TODO #4: Implement PUT /api/items/{id} Endpoint

**Location:** `apps/web/src/features/catalog/components/item-mutate-dialog.tsx:86`

**Comment:**

```typescript
// TODO: Implement PUT /api/items/{id} when endpoint is ready
console.log('Update item via API (not implemented yet):', id, formData);
toast.success('Item updated (mock - endpoint pending)');
```

**Classification:** 🔴 **Missing Integration** (duplicate of TODO #2)

**Impact:**

- Same as TODO #2 - duplicate marker in different component

**Required Actions:**

- Same as TODO #2

**Note:** This is the **same missing feature** marked in two places:

- `item-mutate-drawer.tsx` (drawer UI)
- `item-mutate-dialog.tsx` (dialog UI)

**Recommendation:** Resolve both with single `PUT /api/items/[id]` implementation

**Priority:** 🟡 **Medium** (same as TODO #2)

---

### 3. Infrastructure (`infra/pulumi/gcp/index.ts`)

#### TODO #5: Add Production Resources

**Location:** `infra/pulumi/gcp/index.ts:139`

**Comment:**

```typescript
// TODO: Add the following resources when ready for production:
// - Cloud SQL instance for PostgreSQL
// - Cloud Storage buckets
// - Load balancer
// - Auto-scaling configuration
// - Monitoring and alerting
```

**Classification:** 🟢 **Future Enhancement**

**Impact:**

- **N/A for MVP** - Infrastructure planning marker
- Not blocking development or testing
- Reminder for production deployment phase

**Required Actions:**

- Not needed for bootstrap/demo phase
- Implement when deploying to production GCP environment

**Effort Estimate:** 1-2 weeks (full production infrastructure)

**Priority:** 🟢 **Low** (future work, not MVP blocker)

---

### 4. Documentation (`guided/product/api-and-db-runbook.md`)

#### TODO #6: Implement Proper User Registration

**Location:** `.guided/product/api-and-db-runbook.md:377`

**Comment:**

```markdown
**TODO**: Implement proper user registration in production.
```

**Classification:** 🔴 **Missing Integration** (related to TODO #1)

**Impact:**

- Same as TODO #1 - part of authentication system
- Documentation marker, not code marker

**Required Actions:**

- Same as TODO #1 (real user auth)
- Add user registration endpoint
- Implement email verification (optional)

**Priority:** 🔴 **High** (same as TODO #1)

---

## Summary by Priority

### 🔴 High Priority (Blockers for Production)

| TODO | Location                                | Description                        | Effort |
| ---- | --------------------------------------- | ---------------------------------- | ------ |
| #1   | `lib/auth/config.ts:33`                 | Implement real user authentication | 2-4h   |
| #6   | `.guided/.../api-and-db-runbook.md:377` | User registration endpoint         | 2-4h   |

**Combined Effort:** 4-8 hours  
**Rationale:** Security-critical - cannot deploy with demo credentials

---

### 🟡 Medium Priority (Feature Completeness)

| TODO | Location                                | Description                     | Effort |
| ---- | --------------------------------------- | ------------------------------- | ------ |
| #2   | `catalog/.../item-mutate-drawer.tsx:86` | Implement `PUT /api/items/[id]` | 3-5h   |
| #4   | `catalog/.../item-mutate-dialog.tsx:86` | Same as #2 (duplicate marker)   | -      |

**Combined Effort:** 3-5 hours (single implementation covers both)  
**Rationale:** Users cannot edit items - feature gap

---

### 🟢 Low Priority (Future/Optional)

| TODO | Location                                 | Description                    | Effort |
| ---- | ---------------------------------------- | ------------------------------ | ------ |
| #3   | `catalog/.../item-mutate-drawer.tsx:117` | Force create with confirmation | 2-3h   |
| #5   | `infra/pulumi/gcp/index.ts:139`          | Production infrastructure      | 1-2w   |

**Combined Effort:** 2-3 hours (excluding infrastructure)  
**Rationale:** Edge cases and future deployment concerns

---

## Cleanup Recommendations

### Phase 1: Authentication (🔴 High Priority)

**Scope:** TODOs #1 and #6

**Tasks:**

1. Install `bcryptjs` package
2. Create `POST /api/auth/register` endpoint
3. Implement password hashing in `authorize()` function
4. Add user lookup from `UserModel`
5. Remove demo credentials
6. Update documentation

**Quality Gates:**

- Auth tests pass (`pnpm test`)
- Type checking passes (`pnpm type-check`)
- Can register and log in with real user

**Risk:** ⚡ **Medium** - affects auth flow, requires careful testing

---

### Phase 2: Catalog CRUD (🟡 Medium Priority)

**Scope:** TODOs #2 and #4

**Tasks:**

1. Create `PUT /api/items/[id]` route
2. Implement `updateItem()` service function
3. Wire up both UI components (drawer + dialog)
4. Add validation and error handling
5. Write tests for update endpoint

**Quality Gates:**

- Catalog update works in UI
- API tests pass
- Duplicate detection still works on update

**Risk:** ⚡ **Low** - isolated feature, no dependencies

---

### Phase 3: Edge Cases (🟢 Low Priority)

**Scope:** TODO #3

**Tasks:**

1. Add `force` parameter to create API
2. Implement confirmation dialog
3. Add override logic in service layer

**Quality Gates:**

- Users can override duplicate warnings
- Tests cover force-create scenario

**Risk:** ⚡ **Very Low** - optional UX improvement

---

## No FIXME or HACK Markers Found ✅

**Observation:**  
The codebase has **no FIXME or HACK comments**, which indicates:

- ✅ Code quality is good
- ✅ No known bugs marked for later fixing
- ✅ No temporary hacks requiring cleanup

This is a **positive indicator** for a bootstrap codebase.

---

## Comment Hygiene Score

| Metric                  | Score  | Status               |
| ----------------------- | ------ | -------------------- |
| Total TODO markers      | 6      | ✅ Low count         |
| FIXME markers           | 0      | ✅ Excellent         |
| HACK markers            | 0      | ✅ Excellent         |
| Duplicated TODOs        | 1 pair | ⚠️ Minor issue       |
| Stale TODOs (>6 months) | 0      | ✅ N/A (new project) |
| **Overall Score**       | **A-** | ✅ Very Good         |

**Improvement Opportunity:**  
Consolidate duplicate TODOs (#2 and #4) - both point to same missing `PUT /api/items/[id]` endpoint.

---

## Action Plan Summary

1. **Immediate (Week 1):** Implement real authentication (#1, #6)
2. **Short-term (Week 2):** Add catalog update endpoint (#2, #4)
3. **Future:** Force-create override (#3), production infra (#5)

**Total Effort:** ~7-12 hours of dev work (excluding infrastructure)

---

_End of Report_
