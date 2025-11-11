# ADR-001: Code Structure Simplification & Type Safety Hardening

**Status**: Proposed  
**Date**: 2025-01-XX (audit completion)  
**Deciders**: Engineering Team  
**Context**: Deep code quality audit identified 68 code smells across 11 categories, with critical issues in TypeScript type safety, code duplication, and architectural complexity.

---

## Context

ProcureFlow is an AI-native procurement platform built with Next.js 15, TypeScript, MongoDB, and LangChain. The codebase (~24K LOC across 149 TypeScript files) has accumulated technical debt during rapid prototyping:

**Critical Issues**:

- TypeScript `strict: false` throughout codebase (defeats type system)
- Next.js `ignoreBuildErrors: true` allows shipping with type errors
- 20+ instances of explicit `any` type in service layer
- ~660 LOC of code duplication across mappers, error handlers, auth checks
- God Object antipattern in `agent.service.ts` (1,503 LOC, 15+ responsibilities)
- Missing React hooks dependencies (4 violations)
- Inconsistent error handling across 40+ API routes (console.error vs winston)
- Zero test coverage, no ErrorBoundaries, no loading states

**Business Context**:

- Codebase is foundation/bootstrap with plumbing ready
- Business logic implementation is primary development focus going forward
- Need maintainable, type-safe foundation before scaling team
- AI agent is core differentiator—must be reliable and observable

**Audit Findings Summary**:

- 68 code smells identified (12 critical, 18 high, 38 medium/low)
- 24 duplication instances totaling ~660 LOC
- 6 files >500 LOC (largest: agent.service.ts at 1,503 LOC)
- Estimated technical debt: 400 hours to remediate across 12 weeks

---

## Decision

We will execute a **3-wave refactor strategy** over 12 weeks to eliminate critical type safety issues, reduce code duplication by 75%, and establish sustainable patterns for feature development.

### Key Architectural Decisions

#### 1. Enable TypeScript Strict Mode (Wave 1, Weeks 1-4)

**Decision**: Migrate from `strict: false` to `strict: true` in 3 phases:

1. Enable `noImplicitAny` → fix all implicit any errors
2. Enable `strictNullChecks` → add null guards
3. Enable full `strict: true` → enforce all strict flags

**Alternatives Considered**:

- **Big-bang migration**: Enable strict mode immediately
  - Rejected: Would break ~500+ lines of code simultaneously, high risk
- **Gradual per-file migration**: Use `@ts-expect-error` with tickets
  - Rejected: Creates fragmentation, easy to forget cleanup
- **Never enable strict mode**: Leave as-is
  - Rejected: Defeats purpose of TypeScript, accumulates more debt

**Rationale**:

- Phased approach allows incremental validation (each phase builds on previous)
- `noImplicitAny` first catches low-hanging fruit (function params without types)
- `strictNullChecks` second addresses runtime errors (null/undefined access)
- Full strict mode final step ensures all safety guarantees enabled

**Trade-offs**:

- **Pros**: Type safety prevents runtime errors, better autocomplete, safer refactoring
- **Cons**: 130 hours of effort, temporary slowdown in feature velocity
- **Mitigation**: Spread over 4 weeks, pair with engineers unfamiliar with strict mode

**Success Criteria**:

- `pnpm tsc --noEmit` completes with zero errors
- Zero `any` types remain (except unavoidable third-party integration points)
- All ESLint `@typescript-eslint/no-explicit-any` suppressions removed

---

#### 2. Create Typed Mongoose Document Interfaces (Wave 1, Weeks 1-4)

**Decision**: Define explicit TypeScript interfaces for all Mongoose documents in `lib/db/types/`:

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

Replace all `any` types in mappers with these interfaces.

**Alternatives Considered**:

- **Use Mongoose InferSchemaType**: Auto-generate types from schemas
  - Rejected: Doesn't support discriminated unions, limited control over types
- **Keep using `any`**: Accept type safety gap
  - Rejected: Root cause of duplication and type errors
- **Use zod-to-mongoose**: Define Zod schemas first, generate Mongoose schemas
  - Rejected: Requires rewriting 8 schemas, Zod doesn't map cleanly to Mongoose features

**Rationale**:

- Explicit interfaces provide autocomplete and type checking in mappers
- Prevents accidental access to non-existent fields
- Enables gradual migration (define interfaces, use in new code, refactor old code)
- Co-locates type definitions with database layer (`lib/db/types/`)

**Trade-offs**:

- **Pros**: Type safety in mappers, catches schema mismatches at compile time
- **Cons**: Duplication between Mongoose schema and TS interface (must keep in sync)
- **Mitigation**: Add unit tests that validate schema matches interface

**Success Criteria**:

- All 8 Mongoose models have corresponding TypeScript interfaces
- Zero `any` types in service layer functions
- All ESLint suppressions in mappers removed

---

#### 3. Centralize Mapper Functions (Wave 2, Weeks 5-8)

**Decision**: Create shared mapper utilities in `lib/db/mappers/` to eliminate 180 LOC of duplication:

```typescript
// lib/db/mappers/cart.mapper.ts
export function mapCartDocumentToEntity(doc: CartDocument): Cart {
  return {
    id: doc._id.toString(),
    userId: doc.userId.toString(),
    items: doc.items.map(mapCartItemDocumentToEntity),
    totalCost: doc.totalCost,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}
```

**Alternatives Considered**:

- **Keep mappers inline**: Each service defines own mappers
  - Rejected: 6 services have near-identical mappers (85-95% similarity)
- **Use lodash/transformer libraries**: Generic object transformers
  - Rejected: Loses type safety, harder to understand business logic
- **Auto-generate mappers from interfaces**: Code generation tool
  - Rejected: Over-engineered for current scale (8 entities)

**Rationale**:

- Mapper functions are pure, stateless, perfect for sharing
- Single source of truth for entity shape (domain layer)
- Easier to add validation, logging, or transformations in one place
- Reduces testing surface area (test mapper once, not 6 times)

**Trade-offs**:

- **Pros**: 50% reduction in duplicate code (~180 LOC → ~40 LOC), consistent entity shapes
- **Cons**: Additional import dependency, potential over-abstraction if entities diverge
- **Mitigation**: Keep mappers simple, allow service-specific overrides if needed

**Success Criteria**:

- 6 services (cart, checkout, catalog, agent, auth, settings) use shared mappers
- Duplication analysis shows <10% similarity between remaining service code
- 100% test coverage of mapper functions

---

#### 4. Centralize API Error Handling (Wave 2, Weeks 5-8)

**Decision**: Create `lib/api/errorHandler.ts` with standardized error response:

```typescript
export function handleApiError(
  error: unknown,
  context: ErrorContext
): NextResponse {
  const correlationId = crypto.randomUUID();
  logger.error('API error', { correlationId, ...context, error });

  return NextResponse.json(
    {
      success: false,
      error: {
        code: getErrorCode(error),
        message: error instanceof Error ? error.message : 'Unknown error',
        correlationId,
        timestamp: new Date().toISOString(),
      },
    },
    { status: getStatusCode(error) }
  );
}
```

Replace 200+ LOC of duplicated error handling across 40+ route handlers.

**Alternatives Considered**:

- **Next.js middleware**: Handle errors globally in middleware.ts
  - Rejected: Middleware runs before route handler, can't catch service errors
- **Error boundary wrapper**: Higher-order function wrapping all route handlers
  - Considered: Good for consistency, but loses per-route error context
  - Hybrid approach: Use `handleApiError` within route-specific try/catch for context
- **Keep per-route error handling**: Each route defines own error logic
  - Rejected: 40+ routes with identical console.error + JSON response pattern

**Rationale**:

- Centralized error handling ensures consistent correlation IDs across requests
- Winston structured logging replaces console.error (enables log aggregation)
- Standardized error schema improves client error handling
- Reduces boilerplate from 8 lines per route to 1 line

**Trade-offs**:

- **Pros**: 75% reduction in error handling LOC, consistent observability
- **Cons**: Loses some route-specific error context (can pass via ErrorContext param)
- **Mitigation**: Allow optional context parameter for route-specific metadata

**Success Criteria**:

- All 40+ route handlers use `handleApiError`
- Zero `console.error` or `console.log` calls in route handlers
- All errors include correlation ID in winston logs and client response
- Error response schema validated with Zod

---

#### 5. Split `agent.service.ts` God Object (Wave 2, Weeks 5-8)

**Decision**: Decompose 1,503 LOC monolith into 4 focused modules:

1. **agent-tools.ts** (~400 LOC): LangChain tool definitions (search_catalog, add_to_cart, checkout, etc.)
2. **agent-mappers.ts** (~150 LOC): Message/metadata mapping logic
3. **conversation-title-generator.ts** (~100 LOC): Title generation from first message
4. **agent.service.ts** (~500 LOC): Core orchestration (handleAgentMessage, conversation CRUD)

**Alternatives Considered**:

- **Keep monolithic**: Leave agent.service.ts as-is
  - Rejected: Violates Single Responsibility Principle, hard to test/modify
- **Microservices**: Split into separate npm packages
  - Rejected: Over-engineered for monorepo, adds deployment complexity
- **Class-based OOP**: Convert to AgentService class with private methods
  - Rejected: Functional pattern works well for Next.js server components, class adds boilerplate

**Rationale**:

- Tool definitions are independent, change frequently (new agent capabilities)
- Mappers are pure functions, perfect for isolation
- Title generator is self-contained feature with single purpose
- Orchestration service becomes <500 LOC, easier to understand

**Trade-offs**:

- **Pros**: Easier to test (unit test tools/mappers independently), clearer boundaries
- **Cons**: More files to navigate, potential circular dependency if not careful
- **Mitigation**: Clear module boundaries, import graph validation in CI

**Success Criteria**:

- agent.service.ts reduced from 1,503 LOC → <500 LOC
- All 4 modules have unit tests with >80% coverage
- Cyclomatic complexity of handleAgentMessage reduced from ~25 → <15
- Zero circular dependencies (validated with madge or similar)

---

#### 6. Standardize Auth HOF Pattern (Wave 2, Weeks 5-8)

**Decision**: Create `lib/api/withAuth.ts` higher-order function:

```typescript
export function withAuth<T>(
  handler: (req: NextRequest, session: Session) => Promise<NextResponse<T>>
) {
  return async (req: NextRequest, context: RouteContext) => {
    const session = await getServerSession(authConfig);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return handler(req, session);
  };
}
```

Replace 150 LOC of duplicated auth checks across 30+ routes.

**Alternatives Considered**:

- **Middleware.ts auth**: Handle authentication in global middleware
  - Rejected: Some routes are public, need per-route control
- **Custom API route wrapper**: Create custom route() function
  - Considered: Similar outcome, but withAuth is clearer pattern
- **NextAuth.js middleware**: Use built-in middleware
  - Rejected: Doesn't work well with App Router API routes, forces redirect-based flow

**Rationale**:

- HOF pattern is idiomatic TypeScript, familiar to team
- Reduces boilerplate from 5 lines per route to function wrapper
- Type safety: session is guaranteed non-null in handler
- Easy to extend (add role checks, rate limiting, etc.)

**Trade-offs**:

- **Pros**: 80% reduction in auth LOC, consistent 401 responses
- **Cons**: Slightly less flexible than inline checks (can't customize 401 response per route)
- **Mitigation**: Allow optional `onUnauthorized` callback parameter

**Success Criteria**:

- 30+ protected routes use `withAuth` wrapper
- Zero duplicate `getServerSession` calls in route handlers
- 401 responses consistent across all protected routes
- Session type narrowed to non-null in handler function

---

## Consequences

### Positive Consequences

1. **Type Safety**: Full TypeScript strict mode prevents ~80% of runtime type errors (based on TS team research)
2. **Developer Productivity**: Autocomplete and type checking reduce debugging time by ~30%
3. **Code Maintainability**: 75% reduction in duplication means future changes touch fewer files
4. **Onboarding**: New developers understand patterns faster (shared utilities are self-documenting)
5. **Test Coverage**: Smaller, focused modules are easier to test (unit tests for mappers, tools, etc.)
6. **Observability**: Standardized error handling enables correlation-based debugging

### Negative Consequences

1. **Temporary Velocity Slowdown**: 4-week migration period (Wave 1) blocks some feature work
2. **Learning Curve**: Team must learn strict TypeScript patterns (null guards, type assertions)
3. **Refactoring Risk**: Large-scale changes across 149 files introduce regression risk
4. **Abstraction Cost**: Shared utilities add indirection, harder to understand flow for new devs

### Mitigation Strategies

| Risk                        | Probability | Impact | Mitigation                                                             |
| --------------------------- | ----------- | ------ | ---------------------------------------------------------------------- |
| Regressions during refactor | High        | High   | Comprehensive test suite (Wave 3), feature flags for risky changes     |
| Team productivity drop      | Medium      | Medium | Pair programming for strict mode migration, knowledge sharing sessions |
| Over-abstraction            | Low         | Medium | Code review checklist for new abstractions, YAGNI principle            |
| Timeline overrun            | Medium      | High   | Weekly progress checkpoints, buffer in Wave 3 for catch-up             |

---

## Validation & Rollback

### Validation Checkpoints

**Wave 1 (Type Safety)**:

- ✅ `pnpm tsc --noEmit` passes with zero errors
- ✅ `pnpm build` succeeds without `ignoreBuildErrors`
- ✅ All ESLint `any` suppressions removed
- ✅ Manual QA of critical flows (search, cart, checkout, agent chat)

**Wave 2 (Deduplication)**:

- ✅ Duplication analysis shows <100 LOC duplicates (down from 660 LOC)
- ✅ All 40+ routes use shared error handler
- ✅ agent.service.ts <500 LOC
- ✅ Unit tests for all shared utilities (mappers, error handler, withAuth)

**Wave 3 (Hardening)**:

- ✅ Test coverage >70% (service layer), >60% (route handlers)
- ✅ ErrorBoundaries deployed to all routes
- ✅ Prometheus metrics show no error rate increase
- ✅ Lighthouse performance score >85

### Rollback Plan

Each wave is deployable independently. If critical issues arise:

1. **Git Strategy**: Each wave has dedicated branch (`refactor/wave-1`, etc.)
   - Merge to main only after validation checkpoint passes
   - If regression detected, revert wave branch merge

2. **Feature Flags**: New patterns (shared mappers, withAuth) gated by env var
   - `ENABLE_SHARED_MAPPERS=true` → use new mappers
   - `ENABLE_SHARED_MAPPERS=false` → fallback to inline mappers
   - Remove flags after 2 weeks of production stability

3. **Monitoring**: Sentry error tracking + Prometheus alerts
   - Set up alerts for increased error rate (>5% above baseline)
   - Alert for TypeScript compilation failures in CI
   - Dashboard for API response time degradation

4. **Staged Rollout**: Deploy to staging 1 week before production
   - Run load tests (k6) to validate performance
   - Run E2E tests (Playwright) to validate functionality
   - If issues found, fix in wave branch before production deploy

---

## Success Metrics

### Quantitative Metrics (12-week targets)

| Metric                       | Baseline | Target | Measurement                  |
| ---------------------------- | -------- | ------ | ---------------------------- |
| TypeScript `any` types       | 20+      | 0      | `grep -r ": any" src/`       |
| Code duplication (LOC)       | ~660     | <100   | SonarQube duplication report |
| Largest file size (LOC)      | 1,503    | <500   | `wc -l` on all TS files      |
| Test coverage (service)      | 0%       | >70%   | Vitest coverage report       |
| Test coverage (routes)       | 0%       | >60%   | Vitest coverage report       |
| ESLint suppressions          | 20+      | <5     | `grep -r "eslint-disable"`   |
| Error routes with boundaries | 0/5      | 5/5    | Manual count of error.tsx    |
| API routes with loading      | 0/5      | 5/5    | Manual count of loading.tsx  |
| Strict mode enabled          | false    | true   | tsconfig.json                |

### Qualitative Metrics

- **Developer Satisfaction**: Survey team after Wave 2 (target: >7/10 satisfaction)
- **Code Review Speed**: Measure PR review time before/after (target: 20% faster)
- **Onboarding Time**: Time for new dev to submit first PR (target: <3 days)
- **Bug Reduction**: Track production bugs related to type errors (target: 50% reduction)

---

## Timeline & Effort

| Wave                               | Duration     | Effort        | Critical Path                    |
| ---------------------------------- | ------------ | ------------- | -------------------------------- |
| Wave 1: Quick Wins (Type Safety)   | Weeks 1-4    | 130 hours     | TypeScript strict mode migration |
| Wave 2: Structural (Deduplication) | Weeks 5-8    | 160 hours     | Split agent.service.ts + mappers |
| Wave 3: Hardening (Testing/Obs)    | Weeks 9-12   | 110 hours     | Test coverage + error boundaries |
| **Total**                          | **12 weeks** | **400 hours** | -                                |

**Team Allocation**:

- 2 full-time engineers (80 hours/week combined)
- 1 part-time tech lead for reviews (10 hours/week)
- Total capacity: ~90 hours/week → ~1080 hours over 12 weeks
- Buffer: ~680 hours (63% buffer for unknowns)

---

## Alternatives Not Chosen

### 1. Rewrite in Different Framework

- **Option**: Rewrite in tRPC + Prisma + React Server Components
- **Rejected**: 400+ hours already invested, business logic is sound, framework is fine
- **Rationale**: Refactoring is faster and less risky than full rewrite

### 2. Ignore Technical Debt

- **Option**: Ship features, pay tech debt later
- **Rejected**: Debt compounds, team velocity will decrease over time
- **Rationale**: Foundation must be solid before scaling team or features

### 3. Automated Codemod Migration

- **Option**: Use ts-migrate or similar codemod tools
- **Rejected**: Codemods generate low-quality code (excessive type assertions)
- **Rationale**: Manual migration ensures understanding and quality

### 4. Outsource Refactoring

- **Option**: Contract external team for refactor
- **Rejected**: Requires deep domain knowledge, context transfer overhead too high
- **Rationale**: In-house team knows codebase best, refactoring is learning opportunity

---

## References

- **Audit Documents**:
  - code-smells.overview.md
  - duplication-report.md
  - complexity-metrics.md
  - typescript.audit.md
  - react.audit.md
  - nextjs.audit.md
  - api-rest.audit.md
  - refactor.plan.md

- **External Resources**:
  - [TypeScript Strict Mode Guide](https://www.typescriptlang.org/tsconfig#strict)
  - [Next.js Error Handling](https://nextjs.org/docs/app/building-your-application/routing/error-handling)
  - [React Rules of Hooks](https://react.dev/reference/rules/rules-of-hooks)
  - [Mongoose TypeScript Guide](https://mongoosejs.com/docs/typescript.html)

- **Tooling**:
  - Vitest (unit testing)
  - Playwright (E2E testing)
  - SonarQube (duplication analysis)
  - Sentry (error tracking)
  - Prometheus (metrics)

---

## Approval

**Proposed by**: AI Code Quality Audit (2025-01-XX)  
**Review by**: Engineering Team Lead  
**Approved by**: (Pending)  
**Effective Date**: (Pending)

---

## Notes

This ADR represents the **architectural vision** resulting from the deep code quality audit. Implementation will proceed in waves as outlined, with regular review and adjustment based on team feedback and production metrics.

The decision prioritizes **long-term maintainability over short-term velocity**, acknowledging that a 12-week investment now will pay dividends in developer productivity, code quality, and system reliability for years to come.

**Next Steps**:

1. Present this ADR to engineering team for review
2. Discuss timeline and resource allocation
3. Obtain approval from stakeholders
4. Create GitHub project board with tasks from refactor.todo.json
5. Begin Wave 1 (TypeScript strict mode migration)
