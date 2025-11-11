# Risks Assessment

> **Assessment Date**: 2025-11-10  
> **Status**: Completed

## Critical Risks

### 1. No Automated Testing ⚠️ CRITICAL

**Risk**: Production bugs, regressions, difficult refactoring  
**Likelihood**: High (100% - tests don't exist)  
**Impact**: Critical (could block production deployment)

**Mitigation**:
- Implement service layer tests immediately (Phase 1)
- Add integration tests for API routes (Phase 2)
- Add E2E tests for critical flows (Phase 3)

**Status**: Documented in `.guided/testing/risks.md`

---

## High Risks

### 2. AI API Rate Limits ⚠️ HIGH

**Risk**: OpenAI rate limit (60 req/min tier 1) blocks users  
**Likelihood**: Medium (depends on usage patterns)  
**Impact**: High (agent becomes unusable)

**Mitigation**:
- ✅ Bottleneck rate limiting implemented
- ✅ Gemini fallback available
- ✅ Circuit breaker prevents cascading failures
- Consider: Upgrade OpenAI tier or implement request queuing

**Status**: Mitigated

### 3. MongoDB Text Search Dependency ⚠️ MEDIUM-HIGH

**Risk**: Forgot to create text index → search doesn't work  
**Likelihood**: Medium (manual step, easy to forget)  
**Impact**: High (core feature broken)

**Mitigation**:
- ✅ Documented in README and setup instructions
- ✅ Script provided (`db:create-text-index`)
- Consider: Auto-create index on first run or startup

**Status**: Partially mitigated (documentation)

---

## Medium Risks

### 4. Environment Variable Misconfiguration ⚠️ MEDIUM

**Risk**: Missing or incorrect env vars → app fails to start  
**Likelihood**: Medium (common during deployment)  
**Impact**: Medium (app won't start, clear error)

**Mitigation**:
- ✅ Documented in `.guided/context/env.md`
- Consider: Add startup validation and clear error messages

**Status**: Partially mitigated (documentation)

### 5. AI Provider Outages ⚠️ MEDIUM

**Risk**: OpenAI or Gemini API unavailable  
**Likelihood**: Low (high SLA providers)  
**Impact**: High (agent feature unusable)

**Mitigation**:
- ✅ Dual provider support (OpenAI ↔ Gemini)
- ✅ Circuit breaker prevents retry storms
- Consider: Fallback to manual catalog browse if both fail

**Status**: Well mitigated

### 6. Database Connection Pool Exhaustion ⚠️ MEDIUM

**Risk**: Too many concurrent connections → MongoDB rejects new connections  
**Likelihood**: Low (unless high traffic)  
**Impact**: Medium (requests fail)

**Mitigation**:
- ✅ Mongoose connection pooling configured
- ✅ Singleton pattern prevents multiple connections
- Consider: Monitor connection pool usage

**Status**: Mitigated

---

## Low Risks

### 7. TypeScript Strict Mode Disabled ⚠️ LOW

**Risk**: Type errors not caught at compile time  
**Likelihood**: Low (TypeScript still provides value)  
**Impact**: Low (caught in testing or production)

**Mitigation**:
- Consider: Gradually enable strict mode

**Status**: Acceptable for MVP

### 8. No Distributed Tracing ⚠️ LOW

**Risk**: Difficult to debug issues across service boundaries  
**Likelihood**: Low (monolith architecture)  
**Impact**: Low (can debug with logs)

**Mitigation**:
- Consider: Add request ID logging

**Status**: Acceptable for MVP

### 9. JWT Session Invalidation ⚠️ LOW

**Risk**: Cannot invalidate sessions server-side  
**Likelihood**: Low (rarely needed)  
**Impact**: Low (sessions expire naturally)

**Mitigation**:
- Consider: Move to database sessions if needed

**Status**: Acceptable for MVP

---

## Security Risks

### 10. Input Validation ⚠️ MEDIUM

**Risk**: Insufficient input validation → injection attacks, crashes  
**Likelihood**: Medium (some validation exists, not comprehensive)  
**Impact**: Medium (security vulnerability)

**Mitigation**:
- ✅ Zod schemas defined
- ⚠️ Not used consistently across all routes
- Consider: Enforce validation middleware

**Status**: Partially mitigated

### 11. Secrets in Environment Variables ⚠️ LOW-MEDIUM

**Risk**: Secrets leaked via logs or error messages  
**Likelihood**: Low (good practices in place)  
**Impact**: Medium (API keys compromised)

**Mitigation**:
- ✅ `.env.local` in .gitignore
- ✅ Documented to use secret managers in production
- Consider: Add secret scanning in CI

**Status**: Well mitigated

---

## Operational Risks

### 12. No APM/Error Tracking ⚠️ MEDIUM

**Risk**: Production issues not detected proactively  
**Likelihood**: Medium (issues will occur)  
**Impact**: Medium (slow incident response)

**Mitigation**:
- ✅ Prometheus metrics defined
- ⚠️ No alerting configured
- Consider: Add Sentry for error tracking

**Status**: Partially mitigated

### 13. Single MongoDB Instance ⚠️ MEDIUM

**Risk**: Database failure → complete outage  
**Likelihood**: Low (use managed service)  
**Impact**: High (app unusable)

**Mitigation**:
- Recommendation: Use MongoDB Atlas with automated backups
- Recommendation: Configure replica set for high availability

**Status**: Deployment-dependent

---

## Risk Summary

| Category | Critical | High | Medium | Low |
|----------|----------|------|--------|-----|
| **Testing** | 1 | 0 | 0 | 0 |
| **AI/External** | 0 | 1 | 2 | 0 |
| **Infrastructure** | 0 | 1 | 3 | 1 |
| **Security** | 0 | 0 | 2 | 0 |
| **Operational** | 0 | 0 | 2 | 2 |
| **Total** | **1** | **2** | **9** | **3** |

---

## Prioritized Mitigation Plan

### Phase 1: Critical (Before Production)

1. ✅ **Implement automated tests** (service layer minimum)
2. ✅ **Add startup environment validation**
3. ✅ **Configure MongoDB Atlas** (or equivalent managed service)

### Phase 2: High (First Month)

4. ✅ **Standardize input validation** across all routes
5. ✅ **Add Sentry** for error tracking and APM
6. ✅ **Implement request ID logging** for traceability

### Phase 3: Medium (First Quarter)

7. Consider feature flags for gradual rollouts
8. Add health checks for all external dependencies
9. Configure alerting on Prometheus metrics

---

## Related Documentation

- Testing risks: `.guided/testing/risks.md`
- Troubleshooting: `.guided/operation/troubleshooting.md`
- Environment setup: `.guided/context/env.md`
