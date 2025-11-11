# ProcureFlow Logging Improvement Plan

**Created**: 2025-11-11  
**Assessment**: logging.nextjs-winston-ecs.audit-and-hardening  
**Owner**: Backend Team  
**Priority**: High - Observability Foundation

## Executive Summary

This plan implements ECS-compliant structured logging across ProcureFlow's Next.js application, replacing console.\* usage with Winston-based logging that supports request correlation, performance monitoring, and security compliance.

**Timeline**: 72 hours for quick wins → 2-4 weeks for full implementation → 1-3 months for optimization  
**Effort**: 4-6 developer weeks across 2-3 months  
**ROI**: 50% reduction in debugging time, proactive issue detection, audit compliance

---

## Quick Wins (72 Hours)

**Effort**: 1-2 developers, 8-16 hours  
**Risk**: Low - Additive changes only

### QW-1: Enable ECS Format in Development

**Owner**: Backend Team  
**Effort**: 1 hour

**Tasks**:

1. Create `.env.local` with ECS configuration:
   ```bash
   LOG_ENABLED=true
   LOG_LEVEL=debug
   LOG_FORMAT=ecs
   LOG_SAMPLING=1.0
   LOG_REDACT_KEYS=password,token,authorization,secret,cookie
   ```
2. Test locally and verify ECS JSON output in console
3. Validate JSON structure with sample requests

**Acceptance Criteria**:

- [ ] Environment variables configured
- [ ] Logs output valid ECS JSON format
- [ ] All required fields present (@timestamp, log.level, message, service._, process._, host.\*)
- [ ] PII redaction working (test with mock PII data)

**Rollback**: Remove `.env.local` variables to restore default human-readable format

---

### QW-2: Replace High-Priority Console.error Calls

**Owner**: Backend Team  
**Effort**: 4-6 hours

**Target Files** (11 high-impact instances):

1. `features/cart/lib/cart.service.ts` - 8 console.error calls
2. `features/catalog/lib/catalog.service.ts` - 3 console.error calls

**Example Migration**:

```typescript
// BEFORE
console.error('[addItemToCart] Error adding item to cart:', {
  userId: input.userId,
  itemId: input.itemId,
  error: error.message,
});

// AFTER
import { logger } from '@/lib/logger';

logger.error('Failed to add item to cart', {
  event: { dataset: 'domain', action: 'cart.add_item.error' },
  cart: { userId: input.userId, itemId: input.itemId },
  error: { type: error.name, message: error.message },
});
```

**Acceptance Criteria**:

- [ ] All 11 console.error calls replaced in service files
- [ ] Structured context includes relevant business data
- [ ] Error messages remain actionable for debugging
- [ ] No behavioral changes (errors still propagate correctly)

**Rollback**: Git revert individual file commits

---

### QW-3: Instrument Top 3 API Routes

**Owner**: Backend Team  
**Effort**: 2-3 hours

**Target Routes**:

1. `app/(app)/api/cart/items/route.ts` (POST/DELETE)
2. `app/(app)/api/items/route.ts` (GET/POST)
3. `app/(app)/api/agent/chat/route.ts` (POST)

**Implementation**:

```typescript
// BEFORE
export async function POST(req: NextRequest) {
  // handler logic
}

// AFTER
import { withLogging } from '@/app/api/_logging/withLogging';

export const POST = withLogging(async (req: NextRequest) => {
  // handler logic - no changes needed
});
```

**Acceptance Criteria**:

- [ ] Routes wrapped with `withLogging` higher-order function
- [ ] Request start/end logged with timing
- [ ] HTTP method, path, status code captured
- [ ] Request IDs propagated through logs
- [ ] Error handling maintains existing behavior

**Rollback**: Remove `withLogging` wrapper, restore original handler export

---

## Short Term (2-4 Weeks)

**Effort**: 2-3 developers, 3-5 days  
**Risk**: Medium - Requires testing and coordination

### ST-1: Complete Console.\* Replacement in Services

**Owner**: Backend Team + Product Team  
**Effort**: 2 days

**Scope**: All `features/*/lib/*.service.ts` files

**Remaining Files** (14+ instances):

- `features/auth/` - auth service errors
- `features/checkout/` - checkout flow errors
- `features/agent/` - LLM interaction logging
- Component error boundaries (React)

**Strategy**:

1. Create feature-specific logger contexts:
   ```typescript
   const logger = createChildLogger({ feature: 'cart' });
   ```
2. Replace console.error → logger.error with structured metadata
3. Replace console.warn → logger.warn (keep informational)
4. Remove debug console.log calls (use logger.debug if valuable)

**Acceptance Criteria**:

- [ ] Zero console.\* usage in service layer files
- [ ] Consistent error format across all services
- [ ] Domain events logged for business actions (cart ops, purchases, etc.)
- [ ] Performance warnings for slow operations (>300ms)

**Rollback**: Feature flag `LOG_LEGACY_MODE=true` to bypass new logging

---

### ST-2: Full API Route Coverage

**Owner**: Backend Team  
**Effort**: 1-2 days

**Scope**: All routes in `app/(app)/api/**/route.ts` (~20 routes)

**Route Categories**:

- **Critical** (use `withRequiredLogging`): auth, checkout, payments
- **Standard** (use `withLogging`): catalog, cart, settings
- **Low-priority** (use `withLogging` with sampling): health, metrics

**Acceptance Criteria**:

- [ ] 100% API route coverage with request/response logging
- [ ] Critical routes always logged (no sampling)
- [ ] Health/metrics routes respect LOG_SAMPLING config
- [ ] Error responses include correlation IDs in headers

**Rollback**: Remove wrappers from routes experiencing issues, monitor individually

---

### ST-3: Domain Event Logging

**Owner**: Product Team + Backend Team  
**Effort**: 1-2 days

**Business Events to Log**:

```typescript
// Cart operations
logDomainEvent('cart.item_added', { itemId, userId, quantity });
logDomainEvent('cart.item_removed', { itemId, userId });
logDomainEvent('cart.cleared', { userId, itemCount });

// Catalog operations
logDomainEvent('catalog.item_created', { itemId, category });
logDomainEvent('catalog.search_performed', { query, resultCount });

// Purchase operations
logDomainEvent('purchase.completed', { purchaseId, userId, totalAmount });
logDomainEvent('purchase.failed', { reason, userId, attemptedAmount });

// User operations
logDomainEvent('user.registered', { userId: hashUserId(userId) });
logDomainEvent('user.login', { userId: hashUserId(userId), method });
```

**Acceptance Criteria**:

- [ ] Key business actions logged with event.dataset='domain'
- [ ] User IDs hashed for privacy (SHA256)
- [ ] Event metadata includes relevant business context
- [ ] Events queryable for analytics and debugging

**Rollback**: Remove `logDomainEvent` calls, no impact on functionality

---

### ST-4: External API Monitoring

**Owner**: Backend Team  
**Effort**: 1 day

**Integration Points**:

- OpenAI API calls (features/agent/)
- MongoDB operations (lib/db/)
- Future: Payment gateways, email services

**Implementation**:

```typescript
// Wrap OpenAI calls
const startTime = Date.now();
try {
  const response = await openai.chat.completions.create(params);
  await logExternalApiCall(
    'openai',
    'chat.completion',
    Date.now() - startTime,
    response.status
  );
} catch (error) {
  await logExternalApiCall(
    'openai',
    'chat.completion',
    Date.now() - startTime,
    undefined,
    error
  );
  throw error;
}
```

**Acceptance Criteria**:

- [ ] All OpenAI API calls logged with timing and status
- [ ] Database queries >300ms logged as slow queries
- [ ] External errors include retry/backoff context
- [ ] Network timeouts captured with diagnostic metadata

**Rollback**: Remove logging wrappers, external APIs function normally

---

## Medium Term (1-3 Months)

**Effort**: 2-3 developers, 1-2 weeks  
**Risk**: Low-Medium - Infrastructure and process changes

### MT-1: ESLint No-Console Enforcement

**Owner**: Platform Team  
**Effort**: 1-2 days

**Tasks**:

1. Update `eslint.config.mjs`:
   ```javascript
   {
     rules: {
       'no-console': ['error', {
         allow: [] // No exceptions in production code
       }]
     },
     overrides: [
       {
         files: ['src/lib/logger/**'],
         rules: { 'no-console': 'off' } // Logger modules allowed
       },
       {
         files: ['src/test/**', '**/*.test.ts'],
         rules: { 'no-console': 'off' } // Test files allowed
       }
     ]
   }
   ```
2. Add pre-commit hook with lint-staged
3. Update CI/CD to fail on console violations
4. Document logging guidelines in README

**Acceptance Criteria**:

- [ ] ESLint rule enabled with proper allowlists
- [ ] Pre-commit hooks prevent new console.\* additions
- [ ] CI pipeline fails on violations
- [ ] Developer documentation includes logging examples

**Rollback**: Set rule to 'warn' instead of 'error'

---

### MT-2: Log Volume Optimization

**Owner**: Platform Team + SRE  
**Effort**: 2-3 days

**Tasks**:

1. Analyze production log volume and costs
2. Tune LOG_SAMPLING for different route categories:
   ```bash
   # Health checks: 5% sampling
   # Standard APIs: 20% sampling
   # Critical APIs: 100% sampling
   # Errors: Always logged (no sampling)
   ```
3. Implement log level filtering by environment
4. Set up log retention policies (30 days standard, 90 days errors)

**Acceptance Criteria**:

- [ ] Production sampling configured for cost efficiency
- [ ] Debug logs filtered in production (LOG_LEVEL=info)
- [ ] Retention policies defined and implemented
- [ ] Cost monitoring dashboard shows log volume trends

**Rollback**: Increase sampling rate if losing visibility

---

### MT-3: Observability Integration

**Owner**: Platform Team + SRE  
**Effort**: 3-5 days

**Tasks**:

1. Configure log aggregation system (if using Loki/CloudWatch/etc.)
2. Set up error rate alerting based on log patterns
3. Create performance dashboards using log-derived metrics
4. Document investigation playbooks using correlation IDs

**Example Alerts**:

- Error rate >1% over 5 minutes
- P95 latency >500ms for critical APIs
- External API failures >10% over 10 minutes
- Domain event anomalies (unexpected patterns)

**Acceptance Criteria**:

- [ ] Logs aggregated in centralized system
- [ ] Automated alerts configured for errors and performance
- [ ] Dashboards visualize key metrics from logs
- [ ] Runbooks reference log queries for debugging

**Rollback**: Alerts to monitoring-only mode if false positives

---

### MT-4: Performance Monitoring Enhancements

**Owner**: Backend Team  
**Effort**: 2-3 days

**Tasks**:

1. Add slow query detection (>300ms threshold):

   ```typescript
   const startTime = Date.now();
   const result = await dbQuery();
   const duration = Date.now() - startTime;

   if (duration > 300) {
     logger.warn('Slow database query detected', {
       event: {
         dataset: 'database',
         action: 'slow_query',
         duration_ms: duration,
       },
       database: { query: sanitizedQuery, collection: 'items' },
     });
   }
   ```

2. Track API response time percentiles (p50, p95, p99)
3. Monitor memory usage in long-running operations
4. Log background job execution times

**Acceptance Criteria**:

- [ ] Slow operations automatically flagged in logs
- [ ] Percentile metrics calculable from log data
- [ ] Memory spikes correlated with log events
- [ ] Background jobs tracked end-to-end

**Rollback**: Remove performance instrumentation if overhead detected

---

## Rollback Strategy

### Emergency Rollback (Complete Disable)

```bash
# Disable all new logging immediately
LOG_ENABLED=false
# Or revert to legacy console logging
LOG_FORMAT=human
```

### Partial Rollback (Feature-Level)

```bash
# Disable sampling (log everything for debugging)
LOG_SAMPLING=1.0

# Increase log level to reduce volume
LOG_LEVEL=warn

# Use feature flags for specific services
LOG_LEGACY_MODE=true  # Falls back to console.*
```

### Git-Based Rollback

- All changes committed in small, revertable chunks
- Each phase (QW/ST/MT) has clear commit boundaries
- Can cherry-pick fixes without reverting entire features

---

## Success Metrics

### Technical Metrics

- **Console usage**: 0 instances in production code (excluding logger modules)
- **API coverage**: 100% of routes with request/response logging
- **ECS compliance**: All logs include required fields
- **Error correlation**: Request IDs tracked end-to-end
- **Performance visibility**: Slow operations (>300ms) flagged automatically

### Operational Metrics

- **Investigation time**: 50% reduction (target: <10 min for common issues)
- **Production debugging**: Zero emergency deployments for log additions
- **Performance regression detection**: <1 hour from occurrence to alert
- **External dependency visibility**: Failures surfaced within 5 minutes

### Security/Compliance Metrics

- **PII redaction**: 100% coverage for sensitive fields
- **Audit trail**: Critical operations logged and retained
- **Log retention**: Meets compliance requirements (30-90 days)
- **Access control**: Logs accessible only to authorized personnel

---

## Risk Assessment

### High Risk: Performance Impact

- **Mitigation**: Sampling, async logging, performance testing before production
- **Monitoring**: Request latency P95/P99 before and after changes
- **Trigger**: >10ms P95 latency increase → reduce sampling

### Medium Risk: Log Volume Explosion

- **Mitigation**: Conservative sampling (5-20%), volume alerts, retention limits
- **Monitoring**: Daily log volume, storage costs, query performance
- **Trigger**: >2x expected volume → adjust sampling or retention

### Low Risk: Winston Dependency Failure

- **Mitigation**: Console fallback built-in, dependency pinning, health checks
- **Monitoring**: Logger initialization success rate, transport errors
- **Trigger**: Winston errors → fallback to console logging automatically

---

## Timeline and Ownership

| Phase           | Duration   | Owner             | Key Deliverables                                                                           |
| --------------- | ---------- | ----------------- | ------------------------------------------------------------------------------------------ |
| **Quick Wins**  | 72 hours   | Backend Team      | ECS enabled, critical console.\* replaced, top 3 routes instrumented                       |
| **Short Term**  | 2-4 weeks  | Backend + Product | Service layer standardized, full API coverage, domain events, external monitoring          |
| **Medium Term** | 1-3 months | Platform + SRE    | ESLint enforcement, volume optimization, observability integration, performance monitoring |

**Total Estimated Effort**: 4-6 developer weeks  
**Expected ROI**: 50% reduction in debugging time, proactive issue detection  
**Go-Live Target**: Quick wins in development, full rollout to production over 2 months

---

## Appendix: Environment Configuration

### Development

```bash
LOG_ENABLED=true
LOG_LEVEL=debug
LOG_FORMAT=ecs
LOG_SAMPLING=1.0  # Log everything for local debugging
LOG_REDACT_KEYS=password,token,authorization,secret,cookie
```

### Staging

```bash
LOG_ENABLED=true
LOG_LEVEL=info
LOG_FORMAT=ecs
LOG_SAMPLING=0.2  # 20% sampling
LOG_REDACT_KEYS=password,token,authorization,secret,cookie,api_key
```

### Production

```bash
LOG_ENABLED=true
LOG_LEVEL=info
LOG_FORMAT=ecs
LOG_SAMPLING=0.05  # 5% base sampling (errors always logged)
LOG_REDACT_KEYS=password,token,authorization,secret,cookie,api_key,ssn,credit_card
LOKI_HOST=https://loki.procureflow.com  # Optional: centralized logging
```
