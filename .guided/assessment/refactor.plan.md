# Refactor Plan: 3-Wave Code Quality Improvement

**Project**: ProcureFlow  
**Timeline**: 12 weeks (3 waves of 4 weeks each)  
**Team Size**: 2-3 developers  
**Audit Date**: November 10, 2025

---

## Overview

This refactor plan addresses **68 code smells** across 11 categories identified in the audit. The plan is structured in 3 waves prioritized by risk and impact:

1. **Wave 1 (Quick Wins)** - Weeks 1-4: Type safety, build config, critical bugs
2. **Wave 2 (Structural)** - Weeks 5-8: Deduplication, architecture, API improvements
3. **Wave 3 (Hardening)** - Weeks 9-12: Testing, observability, performance

---

## Wave 1: Quick Wins (Weeks 1-4)

**Goal**: Fix critical issues blocking type safety and CI/CD  
**Risk**: HIGH → MEDIUM  
**Effort**: 120-160 hours  
**Impact**: Restore type safety, enable strict mode, fix build

---

### W1.1: TypeScript Strict Mode Migration 🔴 CRITICAL

**Acceptance Criteria**:
- [ ] `strict: true` enabled in tsconfig
- [ ] `ignoreBuildErrors: false` in next.config
- [ ] Zero TypeScript compilation errors
- [ ] tsc completes without OOM

**Tasks**:
1. **Enable noImplicitAny** (Week 1)
   - Add `noImplicitAny: true` to tsconfig
   - Fix ~50-100 implicit any errors in services
   - Create typed Mongoose document interfaces
   - Run: `pnpm tsc --noEmit --incremental`

2. **Enable strictNullChecks** (Week 2)
   - Add `strictNullChecks: true` to tsconfig
   - Add optional chaining (`?.`) where needed
   - Fix ~100-200 null/undefined errors
   - Run: `pnpm tsc --noEmit`

3. **Enable Full Strict Mode** (Week 3)
   - Set `strict: true` in tsconfig
   - Fix remaining errors (~50-100)
   - Remove `ignoreBuildErrors` from next.config
   - Verify production build succeeds

4. **Fix tsc OOM Issue** (Week 4)
   - Investigate circular dependencies
   - Add `--max-old-space-size=4096` to package.json scripts
   - Consider splitting large type definitions
   - Run: `pnpm type-check` in CI

**Estimated Effort**: 60 hours  
**Risk**: MEDIUM (may uncover hidden bugs)  
**Dependencies**: None

**Metrics**:
- Before: `strict: false`, type coverage ~40%
- After: `strict: true`, type coverage 95%+

---

### W1.2: Eliminate any Types in Service Layer 🔴 CRITICAL

**Acceptance Criteria**:
- [ ] Zero explicit `any` types in service files
- [ ] All Mongoose documents properly typed
- [ ] All ESLint suppressions removed (`@typescript-eslint/no-explicit-any`)

**Tasks**:
1. **Create Typed Document Interfaces** (Week 1)
   ```typescript
   // lib/db/types/cart.types.ts
   export interface CartDocument extends Document {
     _id: Types.ObjectId;
     userId: Types.ObjectId;
     items: CartItemDocument[];
     totalCost: number;
     createdAt: Date;
     updatedAt: Date;
   }
   ```

2. **Create Shared Mapper Utilities** (Week 2)
   ```typescript
   // lib/db/mappers/cart.mapper.ts
   export function mapCartDocumentToEntity(doc: CartDocument): Cart {
     return {
       id: doc._id.toString(),
       userId: doc.userId.toString(),
       items: doc.items.map(mapCartItemToEntity),
       totalCost: doc.totalCost,
       createdAt: doc.createdAt,
       updatedAt: doc.updatedAt,
     };
   }
   ```

3. **Refactor Services** (Weeks 3-4)
   - Replace `any` in cart.service.ts (8 instances)
   - Replace `any` in checkout.service.ts (7 instances)
   - Replace `any` in agent.service.ts (5 instances)
   - Remove all ESLint suppressions

**Estimated Effort**: 40 hours  
**Risk**: LOW  
**Dependencies**: W1.1 (TypeScript interfaces)

**Files Changed**: 6 service files, 3 new mapper files, 3 new type files

**Metrics**:
- Before: 20+ `any` types, 18 ESLint suppressions
- After: 0 `any` types, 0 suppressions

---

### W1.3: React Hooks Violations 🟠 HIGH

**Acceptance Criteria**:
- [ ] All useEffect hooks have correct dependencies
- [ ] Zero `exhaustive-deps` ESLint suppressions
- [ ] No stale closure bugs

**Tasks**:
1. **Fix useAgentConversations** (Week 1)
   - Wrap `fetchConversations` in `useCallback`
   - Add to useEffect dependency array
   - Test: Verify event listener doesn't leak

2. **Audit Exhaustive-Deps Suppressions** (Week 1)
   - Review PurchaseRequestDetailPageContent.tsx:50
   - Review PurchaseHistoryPageContent.tsx:69
   - Add missing dependencies or justify suppression with comment

3. **Enable Strict Hooks Linting** (Week 2)
   - Change `react-hooks/exhaustive-deps` from `warn` to `error`
   - Fix any new violations discovered
   - Add pre-commit hook to enforce

**Estimated Effort**: 10 hours  
**Risk**: LOW  
**Dependencies**: None

**Metrics**:
- Before: 4 hooks violations
- After: 0 violations

---

### W1.4: Add Error Boundaries 🟠 HIGH

**Acceptance Criteria**:
- [ ] `error.tsx` in all route segments
- [ ] Global error boundary in root layout
- [ ] Error telemetry logging

**Tasks**:
1. **Create Error Templates** (Week 2)
   ```typescript
   // app/(app)/error.tsx
   'use client';
   export default function Error({ error, reset }: {
     error: Error & { digest?: string };
     reset: () => void;
   }) {
     useEffect(() => {
       logger.error('Route error', { error, digest: error.digest });
     }, [error]);

     return <ErrorDisplay error={error} onRetry={reset} />;
   }
   ```

2. **Add to All Routes** (Week 2)
   - app/(app)/catalog/error.tsx
   - app/(app)/cart/error.tsx
   - app/(app)/purchase/error.tsx
   - app/(app)/settings/error.tsx
   - app/(app)/agent/error.tsx

**Estimated Effort**: 8 hours  
**Risk**: LOW  
**Dependencies**: None

**Metrics**:
- Before: 0% error boundary coverage
- After: 100% coverage

---

### W1.5: Add Loading States 🟡 MEDIUM

**Acceptance Criteria**:
- [ ] `loading.tsx` in all data-fetching routes
- [ ] Skeleton components for all major views
- [ ] No blank screen during navigation

**Tasks**:
1. **Create Skeleton Components** (Week 3)
   - CatalogSkeleton
   - CartSkeleton
   - PurchaseHistorySkeleton

2. **Add loading.tsx Files** (Week 3)
   - app/(app)/catalog/loading.tsx
   - app/(app)/purchase/loading.tsx
   - app/(app)/cart/loading.tsx

**Estimated Effort**: 12 hours  
**Risk**: LOW  
**Dependencies**: None

**Metrics**:
- Before: 0% loading state coverage
- After: 100% coverage

---

## Wave 2: Structural Improvements (Weeks 5-8)

**Goal**: Reduce duplication, improve architecture, enhance API  
**Risk**: MEDIUM → LOW  
**Effort**: 140-180 hours  
**Impact**: 50% LOC reduction in duplicated code, better maintainability

---

### W2.1: Deduplication - Mongoose Mappers 🔴 CRITICAL

**Acceptance Criteria**:
- [ ] Shared mapper utilities for all models
- [ ] ~180 duplicate LOC removed
- [ ] 100% test coverage for mappers

**Tasks**:
1. **Create Mapper Library** (Week 5)
   - lib/db/mappers/cart.mapper.ts
   - lib/db/mappers/item.mapper.ts
   - lib/db/mappers/purchase-request.mapper.ts
   - lib/db/mappers/conversation.mapper.ts

2. **Refactor Services** (Week 5-6)
   - Update cart.service.ts to use mappers
   - Update checkout.service.ts to use mappers
   - Update agent.service.ts to use mappers
   - Update catalog.service.ts to use mappers

3. **Add Tests** (Week 6)
   - Unit tests for all mappers (edge cases, nulls)
   - Integration tests for service layer

**Estimated Effort**: 40 hours  
**Risk**: LOW  
**Dependencies**: W1.2 (typed documents)

**Metrics**:
- Before: 180 duplicate LOC across 6 files
- After: 0 duplication, ~30 LOC in mappers

---

### W2.2: Deduplication - API Error Handling 🟠 HIGH

**Acceptance Criteria**:
- [ ] Centralized `handleApiError()` utility
- [ ] All routes use winston logger (zero console.error)
- [ ] Correlation IDs in all error responses
- [ ] ~200 duplicate LOC removed

**Tasks**:
1. **Create Error Handler** (Week 5)
   ```typescript
   // lib/api/errorHandler.ts
   export function handleApiError(error: unknown, context: ErrorContext): NextResponse {
     const correlationId = crypto.randomUUID();
     logger.error('API error', { correlationId, ...context, error });

     return NextResponse.json({
       success: false,
       error: {
         code: getErrorCode(error),
         message: error instanceof Error ? error.message : 'Unknown error',
         correlationId,
         timestamp: new Date().toISOString(),
       },
     }, { status: getStatusCode(error) });
   }
   ```

2. **Refactor Route Handlers** (Weeks 5-6)
   - Update all 40+ route handlers
   - Replace console.error with handleApiError()
   - Test error scenarios

**Estimated Effort**: 30 hours  
**Risk**: LOW  
**Dependencies**: None

**Metrics**:
- Before: 200 duplicate LOC, console.error in 40 files
- After: 0 duplication, winston logger everywhere

---

### W2.3: Deduplication - Auth Boilerplate 🟡 MEDIUM

**Acceptance Criteria**:
- [ ] `withAuth()` HOF or middleware
- [ ] ~150 duplicate LOC removed
- [ ] Consistent 401 responses

**Tasks**:
1. **Create Auth Wrapper** (Week 6)
   ```typescript
   // lib/api/withAuth.ts
   export function withAuth(handler: AuthenticatedHandler) {
     return async (request: NextRequest, context?: { params: any }) => {
       const session = await getServerSession(authConfig);

       if (!session || !session.user?.id) {
         return NextResponse.json(
           { error: 'Unauthorized' },
           { status: 401 }
         );
       }

       return handler(request, { userId: session.user.id, params: context?.params });
     };
   }
   ```

2. **Refactor Protected Routes** (Week 6-7)
   - Update 30+ POST/PUT/DELETE handlers
   - Remove getServerSession() boilerplate
   - Test auth flow

**Estimated Effort**: 25 hours  
**Risk**: LOW  
**Dependencies**: W2.2 (error handling)

**Metrics**:
- Before: 150 duplicate LOC
- After: 1 shared implementation

---

### W2.4: Split agent.service.ts 🟠 HIGH

**Acceptance Criteria**:
- [ ] agent.service.ts < 500 LOC
- [ ] 6 focused modules created
- [ ] Cyclomatic complexity < 15 per function

**Tasks**:
1. **Extract Modules** (Week 7)
   - agent-tools.ts (400 LOC) - Tool definitions
   - agent-executor.ts (enhance existing, 200 LOC)
   - agent-mappers.ts (150 LOC) - DTO mappers
   - conversation-title-generator.ts (100 LOC)

2. **Refactor Main Service** (Week 7)
   - Keep only public API in agent.service.ts
   - Import from extracted modules
   - Update all callers

3. **Test** (Week 8)
   - Unit tests for each module
   - Integration tests for orchestration

**Estimated Effort**: 35 hours  
**Risk**: MEDIUM (complex logic)  
**Dependencies**: W2.1 (mappers)

**Metrics**:
- Before: 1,503 LOC, CC ~80
- After: 6 files <500 LOC each, CC <15

---

### W2.5: API Improvements 🟡 MEDIUM

**Acceptance Criteria**:
- [ ] Standardized error responses
- [ ] Pagination with cursor
- [ ] Filtering & sorting
- [ ] Missing update endpoints implemented

**Tasks**:
1. **Implement PUT /api/items/:id** (Week 7)
   - Add updateItem() to catalog.service
   - Create PUT handler
   - Enable update UI (remove TODO)

2. **Add Pagination** (Week 7)
   - Cursor-based pagination in searchItems()
   - Update API responses with pagination metadata

3. **Add Filtering** (Week 8)
   - Category, price range filters
   - Sort by name, price, date
   - Update catalog service and API

**Estimated Effort**: 30 hours  
**Risk**: LOW  
**Dependencies**: W2.2 (error handling)

**Metrics**:
- Before: No update endpoint, basic search only
- After: Full CRUD, advanced filtering

---

## Wave 3: Hardening & Observability (Weeks 9-12)

**Goal**: Add tests, monitoring, performance optimization  
**Risk**: LOW  
**Effort**: 100-120 hours  
**Impact**: Production readiness

---

### W3.1: Testing Infrastructure 🟡 MEDIUM

**Acceptance Criteria**:
- [ ] 80%+ test coverage (unit + integration)
- [ ] CI runs tests on every PR
- [ ] E2E tests for critical flows

**Tasks**:
1. **Setup Testing Framework** (Week 9)
   - Install Vitest + Testing Library
   - Configure coverage reporting
   - Add `pnpm test` script

2. **Unit Tests** (Weeks 9-10)
   - Service layer: 80% coverage
   - Mappers: 100% coverage
   - Utilities: 100% coverage

3. **Integration Tests** (Week 10)
   - API routes: 60% coverage
   - DB operations: Mock MongoDB

4. **E2E Tests** (Week 11)
   - Catalog search → add to cart → checkout flow
   - Agent chat flow
   - User authentication flow

**Estimated Effort**: 50 hours  
**Risk**: LOW  
**Dependencies**: W2.1, W2.2 (refactored code easier to test)

**Metrics**:
- Before: 0% test coverage
- After: 80%+ coverage

---

### W3.2: Observability & Monitoring 🟡 MEDIUM

**Acceptance Criteria**:
- [ ] Structured logging to Loki (already configured)
- [ ] Prometheus metrics exposed
- [ ] Error tracking with correlation IDs
- [ ] Dashboard for key metrics

**Tasks**:
1. **Audit Logging** (Week 9)
   - Ensure all API routes use winston logger
   - Add request ID middleware
   - Log latency, status codes

2. **Enhance Metrics** (Week 10)
   - Add business metrics (carts created, checkouts completed)
   - Add performance metrics (DB query time)
   - Expose /api/metrics endpoint (already exists)

3. **Error Tracking** (Week 11)
   - Integrate Sentry or similar
   - Add source maps for production
   - Test error reporting

**Estimated Effort**: 25 hours  
**Risk**: LOW  
**Dependencies**: W2.2 (error handling with correlation IDs)

**Metrics**:
- Before: Basic Prometheus metrics, console.error
- After: Full observability stack

---

### W3.3: Performance Optimization 🟢 LOW

**Acceptance Criteria**:
- [ ] Lighthouse score >90
- [ ] API response time <200ms (p95)
- [ ] Client bundle <500KB

**Tasks**:
1. **React Optimization** (Week 11)
   - Add React.memo to expensive components (AgentProductCard)
   - Profile with React DevTools
   - Lazy load heavy components

2. **API Optimization** (Week 11)
   - Add database indexes
   - Cache catalog items (Redis or in-memory)
   - Add Cache-Control headers

3. **Bundle Optimization** (Week 12)
   - Analyze bundle with @next/bundle-analyzer
   - Code-split heavy dependencies
   - Lazy load admin features

**Estimated Effort**: 20 hours  
**Risk**: LOW  
**Dependencies**: W3.1 (performance tests)

**Metrics**:
- Before: Lighthouse ~75, bundle ~600KB
- After: Lighthouse >90, bundle <500KB

---

### W3.4: Documentation & Developer Experience 🟢 LOW

**Acceptance Criteria**:
- [ ] JSDoc comments on all public service functions
- [ ] OpenAPI schema auto-generated from Zod
- [ ] README with setup instructions updated
- [ ] ADR documents for all major decisions

**Tasks**:
1. **Add JSDoc** (Week 12)
   - All service functions
   - All mappers
   - All API routes

2. **OpenAPI Generation** (Week 12)
   - Use @anatine/zod-openapi
   - Auto-generate from Zod schemas
   - Serve Swagger UI at /api/docs

3. **Update Documentation** (Week 12)
   - README: setup, architecture, conventions
   - CONTRIBUTING.md: PR guidelines, testing
   - CHANGELOG.md: migration notes for Wave 1-3

**Estimated Effort**: 15 hours  
**Risk**: LOW  
**Dependencies**: W2.5 (API improvements)

---

## Summary: Effort & Impact

| Wave | Duration | Effort (hours) | Risk | Impact | ROI |
|------|----------|----------------|------|--------|-----|
| Wave 1 | Weeks 1-4 | 130 | HIGH→MEDIUM | Restore type safety, fix builds | CRITICAL |
| Wave 2 | Weeks 5-8 | 160 | MEDIUM→LOW | Remove 500+ duplicate LOC | HIGH |
| Wave 3 | Weeks 9-12 | 110 | LOW | Production readiness | MEDIUM |
| **Total** | **12 weeks** | **400 hours** | | | |

---

## Risk Mitigation

1. **TypeScript Strict Mode** (W1.1)
   - **Risk**: Uncovers hidden bugs
   - **Mitigation**: Fix incrementally (noImplicitAny → strictNullChecks → full strict)
   - **Rollback**: Revert tsconfig change, fix bugs separately

2. **Service Refactoring** (W2.4)
   - **Risk**: Breaking changes in agent.service.ts
   - **Mitigation**: Write integration tests first, refactor behind feature flag
   - **Rollback**: Keep old agent.service.ts until new modules tested

3. **API Changes** (W2.5)
   - **Risk**: Breaking changes to API contracts
   - **Mitigation**: Version API (/api/v1), maintain backward compatibility
   - **Rollback**: Keep old endpoints, deprecate gradually

---

## Success Metrics

### Wave 1 Completion
- ✅ `pnpm build` succeeds with zero TypeScript errors
- ✅ `pnpm tsc --noEmit` completes without OOM
- ✅ Zero `any` types in service layer
- ✅ 100% error boundary coverage

### Wave 2 Completion
- ✅ ~500 duplicate LOC removed
- ✅ All route handlers use shared utilities
- ✅ agent.service.ts split into 6 modules
- ✅ Full CRUD API for catalog items

### Wave 3 Completion
- ✅ 80%+ test coverage
- ✅ Lighthouse score >90
- ✅ API p95 latency <200ms
- ✅ OpenAPI docs auto-generated

---

## Next Steps

1. **Review this plan** with team (1 week)
2. **Create GitHub project** with all tasks (1 day)
3. **Assign Wave 1 tasks** to developers (1 day)
4. **Kick off W1.1** (TypeScript strict mode migration)

---

**See Also**:
- `refactor.todo.json` - Backlog of all 68 tasks
- `ADR-001-code-structure-simplification.md` - Architectural decision record
- Individual audit reports - Detailed findings per domain
