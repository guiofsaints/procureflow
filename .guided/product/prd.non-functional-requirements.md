# Product Requirements Document: Non-Functional Requirements

## Executive Summary

Performance, security, reliability, and observability targets for ProcureFlow v1.0. Key targets: p95 API latency < 2s, 99.5 percent uptime, zero critical vulnerabilities, 60 percent test coverage. Security: bcrypt password hashing, NextAuth.js sessions, input validation, HTTPS in production. Reliability: MongoDB connection retry, graceful degradation on AI API failures, health checks. Observability: structured logging (Winston), Prometheus metrics, health endpoint. Constraints: Cloud Run free tier (2M req/month), MongoDB M0 (512 MB), < $50/month infrastructure cost. All targets measurable and testable.

---

## NFR-PERF: Performance Requirements

### NFR-PERF-001: API Response Latency

**Objective**: Ensure responsive user experience with fast API responses

**Targets**:

| Endpoint Category | p50 Latency | p95 Latency | p99 Latency |
|-------------------|-------------|-------------|-------------|
| Catalog search (< 100 results) | < 200ms | < 500ms | < 1s |
| Item registration | < 400ms | < 1s | < 2s |
| Cart operations (CRUD) | < 150ms | < 500ms | < 1s |
| Checkout | < 800ms | < 2s | < 4s |
| Purchase request retrieval | < 150ms | < 500ms | < 1s |
| Agent chat (excluding LLM API) | < 2s | < 5s | < 10s |
| Health check | < 50ms | < 100ms | < 200ms |

**Measurement Method**:
- Prometheus `http_request_duration_seconds` histogram
- p50/p95/p99 calculated from histogram buckets
- Monitored via Grafana dashboard (future)

**Acceptance Criteria**:
- [ ] 95% of catalog search requests complete in < 500ms under normal load
- [ ] 95% of checkout requests complete in < 2s
- [ ] Health check responds in < 100ms (p95)

---

### NFR-PERF-002: Database Query Performance

**Objective**: Optimize MongoDB queries for sub-second response times

**Targets**:

| Query Type | p95 Latency | Index Required |
|------------|-------------|----------------|
| Catalog search (text index) | < 300ms | Text index on name, description, category |
| Item retrieval by ID | < 50ms | _id index (default) |
| Cart retrieval by userId | < 100ms | Index on userId |
| Purchase request list by userId | < 200ms | Compound index on userId + createdAt |

**Optimization Strategies**:
- Text index with field weights: name (10), category (5), description (1)
- Projection to exclude unnecessary fields where possible
- Connection pooling with min: 5, max: 50 connections
- Query timeout: 10 seconds

**Acceptance Criteria**:
- [ ] Text index created on items collection before deployment
- [ ] All queries use appropriate indexes (verified with explain())
- [ ] No N+1 query patterns in cart or checkout flows

---

### NFR-PERF-003: Agent Response Time

**Objective**: Minimize agent latency while managing external LLM API dependencies

**Targets**:
- **System Processing** (excluding LLM API): < 2s (p95)
- **LLM API Call**: Accept up to 10s (not controllable, depends on OpenAI/Gemini)
- **Total Response Time**: < 12s (p95 including LLM API)

**Optimization Strategies**:
- Stream LLM responses to UI (reduce perceived latency)
- Implement request timeout: 30s total
- Circuit breaker for LLM API (open after 5 consecutive failures)
- Rate limiting: 60 requests per minute per user (prevent abuse)

**Acceptance Criteria**:
- [ ] Agent streaming enabled for incremental UI updates
- [ ] Circuit breaker prevents cascading failures
- [ ] Timeout returns user-friendly error after 30s

---

### NFR-PERF-004: Cold Start Performance

**Objective**: Minimize cold start latency for Cloud Run instances scaling from zero

**Constraints**:
- Cloud Run cold start: 2-3 seconds (inherent platform limitation)
- Next.js SSR build size: < 50 MB Docker image
- Node.js startup: < 1 second

**Mitigation Strategies**:
- Docker multi-stage build to minimize image size
- Accept 2-3s cold start as known limitation (documented in README)
- Keep min instances at 0 for cost optimization (trade-off accepted)
- Future: Implement min instances = 1 for production (increases cost)

**Acceptance Criteria**:
- [ ] Docker image size < 100 MB (compressed)
- [ ] Cold start documented in README as 2-3s limitation
- [ ] Health check passes within 5s of container start

---

### NFR-PERF-005: Concurrent Request Handling

**Objective**: Support multiple concurrent users without performance degradation

**Targets**:
- **Concurrent Users**: 50 simultaneous users (realistic for small org)
- **Throughput**: 100 requests per second (aggregate across all endpoints)
- **Resource Utilization**: < 80% CPU, < 90% memory under normal load

**Load Testing Baseline**:
- 50 concurrent users × 10 requests/min = 8.3 req/sec baseline
- Peak load (5× baseline): 500 concurrent users × 10 requests/min = 83 req/sec
- Stress test: 1000 concurrent users (find breaking point)

**Acceptance Criteria**:
- [ ] Load test with 50 concurrent users shows < 5% error rate
- [ ] p95 latency degrades by < 2× under 5× baseline load
- [ ] Cloud Run auto-scales to handle 500 concurrent users without manual intervention

---

## NFR-SEC: Security Requirements

### NFR-SEC-001: Authentication Security

**Objective**: Protect user credentials and session integrity

**Requirements**:

| Control | Implementation | Target |
|---------|----------------|--------|
| **Password Hashing** | bcrypt with salt rounds = 10 | 100% of passwords hashed |
| **Password Complexity** | Minimum 6 characters (lenient for demo) | Enforced at registration |
| **Session Security** | NextAuth.js JWT with HTTP-only cookies | 100% of sessions |
| **Session Expiration** | 30 days (configurable via NEXTAUTH_MAX_AGE) | Automatic enforcement |
| **HTTPS Enforcement** | Production only (HTTP allowed in dev) | 100% in prod |

**Future Enhancements** (out of scope for v1.0):
- Password strength meter (minimum 8 chars, require special chars)
- Multi-factor authentication (MFA)
- OAuth providers (Google, Microsoft)
- Password reset flow via email

**Acceptance Criteria**:
- [ ] No plaintext passwords in database (verified with spot check)
- [ ] Session cookies are HTTP-only and Secure (in production)
- [ ] Failed login attempts do not reveal whether email exists

---

### NFR-SEC-002: Input Validation and Sanitization

**Objective**: Prevent injection attacks and malformed data from corrupting system

**Requirements**:

| Attack Vector | Mitigation | Coverage |
|---------------|------------|----------|
| **NoSQL Injection** | Mongoose schema validation, escape $ and . in search | 100% of user inputs |
| **XSS** | React auto-escaping, no dangerouslySetInnerHTML | 100% of UI rendering |
| **CSRF** | NextAuth.js CSRF tokens | 100% of state-changing requests |
| **Path Traversal** | No file uploads in v1.0 | N/A |
| **Command Injection** | No shell execution of user input | N/A |

**Validation Strategy**:
- Zod schemas for all API request bodies
- Mongoose schemas for database writes
- Type checking with TypeScript strict mode
- Length limits: name (200 chars), description (2000 chars), notes (2000 chars)

**Acceptance Criteria**:
- [ ] All API endpoints validate request bodies with Zod
- [ ] MongoDB queries escape special characters in search strings
- [ ] No dangerouslySetInnerHTML usage in codebase (verified with grep)

---

### NFR-SEC-003: Authorization and Access Control

**Objective**: Ensure users can only access their own data

**Requirements**:

| Resource | Authorization Rule | Enforcement |
|----------|-------------------|-------------|
| **Cart** | userId === session.user.id | Middleware + query filter |
| **Purchase Requests** | userId === session.user.id | Middleware + query filter |
| **Agent Conversations** | userId === session.user.id | Middleware + query filter |
| **Catalog Items** | Read: Public, Write: Authenticated | Route-level check |
| **User Profile** | userId === session.user.id (future) | Not implemented in v1.0 |

**Access Control Pattern**:
1. Middleware validates session exists
2. Extract userId from session
3. Query database with userId filter
4. Return 403 if resource belongs to different user

**Acceptance Criteria**:
- [ ] Users cannot view other users' carts (tested with integration test)
- [ ] Users cannot view other users' purchase requests
- [ ] Users cannot view other users' conversations

---

### NFR-SEC-004: Secrets Management

**Objective**: Protect sensitive configuration from exposure

**Requirements**:

| Secret | Storage | Rotation |
|--------|---------|----------|
| **NEXTAUTH_SECRET** | Secret Manager (GCP) or .env.local (dev) | Manual (future: quarterly) |
| **OPENAI_API_KEY** | Secret Manager (GCP) or .env.local (dev) | Manual (user-provided) |
| **MONGODB_URI** | Secret Manager (GCP) or .env.local (dev) | Manual (Atlas rotation) |
| **GCP Service Account Key** | GitHub Secrets (CI/CD) | Manual (yearly) |

**Protection Measures**:
- `.env.local` excluded from Git via `.gitignore`
- `.env.example` contains placeholder values only
- GCP Secret Manager encrypts secrets at rest
- Pulumi marks secrets with `pulumi.secret()` to prevent console output
- GitHub Actions secrets are masked in logs

**Acceptance Criteria**:
- [ ] No secrets committed to Git repository (verified with git-secrets or similar)
- [ ] All production secrets stored in GCP Secret Manager
- [ ] Pulumi outputs mask secret values (not displayed in console)

---

### NFR-SEC-005: Dependency Vulnerability Management

**Objective**: Minimize security risks from third-party dependencies

**Requirements**:
- Zero critical vulnerabilities (CVSS ≥ 9.0)
- < 5 high vulnerabilities (CVSS 7.0-8.9)
- Acceptable: Medium and low vulnerabilities (addressed in future releases)

**Scanning Strategy**:
- `pnpm audit` run manually before releases
- Snyk or Dependabot enabled on GitHub repository (future)
- Update dependencies quarterly (minor and patch versions)
- Major version updates evaluated on case-by-case basis

**Acceptance Criteria**:
- [ ] pnpm audit shows zero critical vulnerabilities
- [ ] Known high vulnerabilities have mitigation plan or accepted risk
- [ ] Dependencies updated within 90 days of security patches

---

## NFR-REL: Reliability Requirements

### NFR-REL-001: Uptime and Availability

**Objective**: Maintain service availability for end users

**Targets**:
- **Uptime SLA**: 99.5% (approximately 3.6 hours downtime per month)
- **Planned Maintenance Window**: Sunday 2-4 AM UTC (2 hours monthly)
- **Unplanned Downtime Budget**: 1.6 hours per month

**Availability Calculation**:
```
Monthly uptime = (Total hours - Downtime hours) / Total hours × 100
              = (720h - 3.6h) / 720h × 100
              = 99.5%
```

**Dependencies**:
- **GCP Cloud Run SLA**: 99.95% (Google-provided)
- **MongoDB Atlas M0**: No SLA (free tier, best-effort)
- **OpenAI API**: No SLA (monitored, fallback to Gemini)

**Acceptance Criteria**:
- [ ] Health check endpoint returns 200 during normal operation
- [ ] Application recovers automatically from transient failures
- [ ] Downtime tracked and reported monthly

---

### NFR-REL-002: Error Rate and Fault Tolerance

**Objective**: Gracefully handle failures without user-facing errors

**Targets**:
- **Error Rate**: < 0.1% of requests (99.9% success rate)
- **Database Connection Failures**: Retry up to 3 times with exponential backoff
- **LLM API Failures**: Circuit breaker opens after 5 failures, fallback message to user
- **Third-Party API Timeouts**: 30s timeout, return user-friendly error

**Error Handling Patterns**:
- Try-catch blocks around all async operations
- Mongoose connection retry with `serverSelectionTimeoutMS: 5000`
- Circuit breaker for OpenAI/Gemini API (using `opossum` library)
- Graceful degradation: Agent unavailable → suggest using catalog UI

**Acceptance Criteria**:
- [ ] Database connection retries automatically on transient failures
- [ ] LLM API failures do not crash the application
- [ ] Users receive clear error messages (no stack traces exposed)

---

### NFR-REL-003: Data Durability and Backup

**Objective**: Prevent data loss from system failures

**Requirements**:

| Data Type | Backup Frequency | Retention | Recovery Time Objective (RTO) |
|-----------|------------------|-----------|--------------------------------|
| **User Accounts** | Continuous (MongoDB replication) | Indefinite | < 1 hour |
| **Catalog Items** | Continuous | Indefinite | < 1 hour |
| **Carts** | Continuous | 30 days | < 1 hour |
| **Purchase Requests** | Continuous | 7 years (compliance) | < 1 hour |
| **Agent Conversations** | Continuous | 90 days | < 4 hours |

**MongoDB Atlas M0 Limitations**:
- No point-in-time recovery (requires M10+ cluster)
- No automated backups (manual export recommended)
- Replication: 3-node replica set (automatic)

**Backup Strategy** (manual for M0):
- Monthly `mongodump` export to GCP Cloud Storage (future)
- Retention: Last 3 monthly backups
- Test restoration quarterly

**Acceptance Criteria**:
- [ ] MongoDB replica set confirmed with 3 nodes
- [ ] Backup procedure documented in runbook (future)
- [ ] Purchase requests retained for 7 years (compliance placeholder)

---

### NFR-REL-004: Disaster Recovery

**Objective**: Restore service after catastrophic failure

**Recovery Scenarios**:

| Scenario | Impact | RTO | RPO | Recovery Procedure |
|----------|--------|-----|-----|-------------------|
| **Cloud Run region outage** | Service unavailable | 4 hours | 0 (no data loss) | Redeploy to different GCP region |
| **MongoDB Atlas M0 cluster failure** | Data unavailable | 2 hours | 1 hour | Restore from backup |
| **GitHub repository deleted** | Source code lost | 24 hours | 0 | Restore from local clone |
| **Pulumi state corruption** | Cannot deploy | 2 hours | 0 | Restore from Pulumi Cloud backup |
| **Complete GCP project deletion** | Total loss | 48 hours | 24 hours | Rebuild from scratch using IaC |

**RTO/RPO Definitions**:
- **RTO (Recovery Time Objective)**: Maximum acceptable downtime
- **RPO (Recovery Point Objective)**: Maximum acceptable data loss

**Acceptance Criteria**:
- [ ] Disaster recovery procedures documented in runbook
- [ ] MongoDB backup tested with restoration exercise
- [ ] Pulumi IaC enables infrastructure rebuild in < 1 hour

---

## NFR-OBS: Observability Requirements

### NFR-OBS-001: Structured Logging

**Objective**: Enable debugging and troubleshooting with rich log context

**Requirements**:

| Log Level | Usage | Examples |
|-----------|-------|----------|
| **ERROR** | Unrecoverable failures | Database connection lost, LLM API timeout |
| **WARN** | Recoverable issues, degraded state | Circuit breaker opened, retry attempt 3/3 |
| **INFO** | Normal operations | User login, purchase request created |
| **DEBUG** | Detailed flow for troubleshooting | LLM tool call parameters, MongoDB query |

**Log Format** (Winston JSON):
```json
{
  "timestamp": "2025-11-11T10:30:45.123Z",
  "level": "info",
  "message": "Purchase request created",
  "userId": "507f1f77bcf86cd799439011",
  "requestNumber": "PR-2025-0042",
  "totalCost": 1250.00,
  "itemCount": 5,
  "correlationId": "req-abc123"
}
```

**Correlation IDs**:
- Generated per request to trace across services/logs
- Included in all log entries for that request
- Returned in response headers: `X-Correlation-ID`

**Acceptance Criteria**:
- [ ] All logs are structured JSON (not plain text)
- [ ] Correlation IDs enable request tracing
- [ ] Sensitive data (passwords, API keys) is redacted from logs

---

### NFR-OBS-002: Metrics Collection

**Objective**: Monitor system health and performance via Prometheus

**Metrics Categories**:

| Category | Metric Examples | Purpose |
|----------|----------------|---------|
| **HTTP Requests** | `http_requests_total`, `http_request_duration_seconds` | Latency, error rate |
| **Database** | `mongodb_connections_active`, `mongodb_query_duration_seconds` | Connection pool, query performance |
| **Agent** | `agent_requests_total`, `agent_tool_calls_total`, `llm_api_duration_seconds` | Agent usage, tool execution |
| **Business** | `purchase_requests_created_total`, `cart_items_added_total` | Feature adoption |

**Prometheus Endpoint**: `/api/metrics` (unauthenticated, internal only)

**Alerting Thresholds** (future):
- Error rate > 1% for 5 minutes → Page on-call
- p95 latency > 5s for 10 minutes → Alert
- Database connections > 45/50 → Warning

**Acceptance Criteria**:
- [ ] Prometheus metrics endpoint returns data in OpenMetrics format
- [ ] HTTP request duration histogram includes p50/p95/p99 buckets
- [ ] Metrics endpoint excluded from public access (firewall or auth)

---

### NFR-OBS-003: Health Checks

**Objective**: Enable automated health monitoring and load balancer integration

**Endpoints**:

| Endpoint | Checks | Response Time | Use Case |
|----------|--------|---------------|----------|
| `/api/health` | API up, MongoDB connected | < 100ms | Cloud Run health check, monitoring |

**Health Check Response**:
```json
{
  "status": "ok",
  "timestamp": "2025-11-11T10:30:45.123Z",
  "service": "procureflow-web",
  "version": "1.0.0",
  "environment": "production",
  "checks": {
    "api": "ok",
    "db": "ok"
  },
  "uptime": 86400
}
```

**Status Codes**:
- **200**: All checks passed, service healthy
- **503**: One or more checks failed, service degraded

**Acceptance Criteria**:
- [ ] Health check responds in < 100ms (p95)
- [ ] MongoDB connection failure returns 503 status
- [ ] Cloud Run uses health check for readiness/liveness probes

---

### NFR-OBS-004: Error Tracking and Alerting

**Objective**: Proactively detect and respond to production issues

**Error Tracking** (future):
- Sentry integration for error aggregation
- Stack traces captured with full context
- Group errors by type/message for deduplication

**Alerting Channels** (future):
- Email for non-urgent alerts
- Slack for urgent alerts (error rate spike)
- PagerDuty for critical failures (service down)

**Acceptance Criteria** (future):
- [ ] Unhandled exceptions are captured and reported
- [ ] Alerts trigger within 5 minutes of error threshold breach
- [ ] Error rate dashboard accessible to on-call engineer

---

## NFR-SCAL: Scalability Requirements

### NFR-SCAL-001: Horizontal Scaling

**Objective**: Support user growth through automatic instance scaling

**Scaling Targets**:

| Metric | Dev/Staging | Production (Future) |
|--------|-------------|---------------------|
| **Min Instances** | 0 (cost optimization) | 1 (reduce cold starts) |
| **Max Instances** | 10 (cost control) | 100 (high availability) |
| **Target Concurrency** | 80 requests per instance | 80 requests per instance |
| **Scale-Up Threshold** | 70% concurrency (56 req) | 70% concurrency |
| **Scale-Down Delay** | 15 minutes idle | 15 minutes idle |

**Autoscaling Behavior**:
- GCP Cloud Run auto-scales based on request concurrency
- New instances start within 2-3 seconds (cold start)
- Instances terminate after 15 minutes with zero requests
- No manual intervention required

**Acceptance Criteria**:
- [ ] Application scales from 0 to 5 instances under load test
- [ ] Instances scale down to 0 after 15 minutes idle (dev)
- [ ] No dropped requests during scale-up events

---

### NFR-SCAL-002: Database Connection Pooling

**Objective**: Prevent database connection exhaustion as instances scale

**Connection Pool Configuration**:
- **Min Connections**: 5 per instance
- **Max Connections**: 50 per instance
- **Connection Timeout**: 10 seconds
- **Idle Timeout**: 60 seconds

**MongoDB Atlas M0 Limit**: 500 total connections
- 10 Cloud Run instances × 50 connections = 500 (at limit)
- Risk: Connection exhaustion if > 10 instances scale up
- Mitigation: Set Cloud Run max instances = 10 (enforced)

**Acceptance Criteria**:
- [ ] Connection pool configuration tested with load test
- [ ] Application gracefully queues requests when pool exhausted (not crash)
- [ ] Idle connections released after 60 seconds

---

### NFR-SCAL-003: Stateless Architecture

**Objective**: Enable horizontal scaling without session affinity

**Statelessness Requirements**:
- No in-memory session storage (use JWT)
- No in-memory cache (all data from MongoDB or LRU cache with TTL)
- No file system writes (except temp files)
- No background jobs tied to specific instance

**Implications**:
- Cloud Run can route requests to any instance
- Instances can be terminated without data loss
- No need for sticky sessions or session replication

**Acceptance Criteria**:
- [ ] User session works across multiple Cloud Run instances
- [ ] Cart operations succeed regardless of which instance handles request
- [ ] No data loss when instance terminates

---

## NFR-COST: Cost Management Requirements

### NFR-COST-001: Infrastructure Cost Budget

**Objective**: Maintain infrastructure costs within free tier or < $50/month

**Cost Breakdown** (estimated):

| Service | Free Tier Limit | Estimated Usage | Estimated Cost |
|---------|----------------|-----------------|----------------|
| **GCP Cloud Run** | 2M requests/month, 360k GB-seconds | 100k requests/month | $0.00 |
| **GCP Artifact Registry** | 0.5 GB storage free | 0.2 GB | $0.10/month |
| **GCP Secret Manager** | 6 secrets free | 3 secrets | $0.00 |
| **MongoDB Atlas M0** | 512 MB, shared CPU | Full usage | $0.00 |
| **OpenAI API** | No free tier | 1M tokens/month | $2.00/month |
| **Pulumi Cloud** | 1 stack free | 1 stack | $0.00 |
| **GitHub Actions** | 2000 min/month | 200 min/month | $0.00 |
| **Total** | | | **~$2.10/month** |

**Cost Alerts** (future):
- GCP billing alert at $10/month
- OpenAI usage alert at $5/month

**Acceptance Criteria**:
- [ ] Monthly infrastructure cost < $5 (excluding OpenAI)
- [ ] OpenAI token usage tracked and reported
- [ ] Cost alerts configured in GCP console

---

### NFR-COST-002: OpenAI API Cost Control

**Objective**: Prevent runaway costs from LLM API usage

**Cost Management Strategies**:
- **Token Usage Analytics**: Track tokens per request, per user, per day
- **Rate Limiting**: 60 requests per minute per user
- **Context Window Management**: Limit conversation history to last 50 messages
- **Model Selection**: Use `gpt-3.5-turbo` (cheapest) instead of `gpt-4` for demo
- **Fallback**: Switch to Google Gemini if OpenAI budget exceeded (requires API key)

**Token Budgeting**:
- Average request: ~1000 tokens (500 input, 500 output) = $0.002
- Monthly budget: $5 = 2500 requests
- Daily budget: $0.17 = 85 requests

**Acceptance Criteria**:
- [ ] Token usage logged to MongoDB for analytics
- [ ] Rate limiting prevents single user from exhausting budget
- [ ] Cost dashboard shows daily/weekly/monthly OpenAI spend (future)

---

## NFR-MAINT: Maintainability Requirements

### NFR-MAINT-001: Code Quality Standards

**Objective**: Maintain readable, consistent codebase

**Standards**:
- **TypeScript**: Strict mode enabled (`strict: true` in tsconfig.json)
- **Linting**: ESLint with Next.js recommended rules
- **Formatting**: Prettier with 120-char line length
- **Commit Conventions**: Conventional Commits (enforced by commitlint)
- **Code Review**: All changes via pull request (enforced by branch protection)

**Acceptance Criteria**:
- [ ] `pnpm lint` passes with zero errors
- [ ] `pnpm format` produces zero file changes
- [ ] `pnpm build` completes without TypeScript errors
- [ ] All commits follow conventional commit format

---

### NFR-MAINT-002: Test Coverage

**Objective**: Ensure code changes are tested before deployment

**Coverage Thresholds** (Vitest):
- **Lines**: ≥ 60%
- **Functions**: ≥ 60%
- **Branches**: ≥ 60%
- **Statements**: ≥ 60%

**Testing Pyramid**:
- **Unit Tests**: 70% of tests (service layer, utilities)
- **Integration Tests**: 25% of tests (API routes, database)
- **E2E Tests**: 5% of tests (critical user flows) - future

**Acceptance Criteria**:
- [ ] `pnpm test:coverage` meets all thresholds
- [ ] New features include tests before merge
- [ ] Critical paths (checkout, agent) have integration tests

---

### NFR-MAINT-003: Documentation Coverage

**Objective**: Enable onboarding and troubleshooting with comprehensive docs

**Required Documentation**:
- [x] README with quick start (< 10 steps)
- [x] CONTRIBUTING with commit conventions
- [x] CHANGELOG with release notes
- [x] .env.example with all variables documented
- [x] OpenAPI spec for all API endpoints
- [ ] Runbooks for common operations (this deliverable)
- [ ] Architecture diagrams (C4) (this deliverable)

**Acceptance Criteria**:
- [ ] New developer can run app locally in < 15 minutes using README
- [ ] All API endpoints documented in OpenAPI spec
- [ ] Runbooks cover 80% of operational tasks

---

## Assumptions and Limitations

### Assumptions

1. **User Base**: 50-500 concurrent users (small to mid-size organizations)
2. **Geographic Distribution**: Users primarily in US (single GCP region acceptable)
3. **Internet Connectivity**: Reliable broadband (web-only, no offline mode)
4. **Browser Support**: Modern browsers (Chrome, Firefox, Safari, Edge) within last 2 versions
5. **Database Size**: < 10 GB data within first year (well within M0 512 MB limit for MVP)
6. **LLM Provider Stability**: OpenAI/Gemini APIs remain available and stable
7. **Deployment Frequency**: Weekly releases (not multiple times per day)

### Known Limitations

1. **Cold Start Latency**: 2-3 seconds when scaling from zero (Cloud Run inherent)
2. **MongoDB M0 Storage**: 512 MB limit (no auto-scaling)
3. **MongoDB M0 Connections**: 500 max connections (limits horizontal scaling)
4. **No Point-in-Time Recovery**: M0 does not support PITR (requires M10+)
5. **Single Region Deployment**: No multi-region redundancy
6. **No CDN**: Static assets served from Cloud Run (not edge-cached)
7. **No Rate Limiting**: Beyond agent (60 req/min), no API-wide rate limiting

### Out of Scope

1. **WCAG 2.1 AA Compliance**: No accessibility testing or remediation
2. **Localization**: English-only (no i18n)
3. **Mobile Native Apps**: Web-only (responsive design acceptable)
4. **Offline Mode**: Requires internet connectivity
5. **Real-Time Collaboration**: No WebSockets or real-time updates
6. **Advanced Analytics**: No business intelligence or reporting dashboards

---

## References

### Internal Documents

- [Objectives and Features](./prd.objective-and-features.md)
- [Functional Requirements](./prd.functional-requirements.md)
- [Infrastructure Documentation](../architecture/infrastructure.md)
- [Testing Strategy](../testing/testing-strategy.md)

### External Standards

- [Google Cloud Run SLA](https://cloud.google.com/run/sla)
- [MongoDB Atlas SLA](https://www.mongodb.com/cloud/atlas/sla)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Prometheus Best Practices](https://prometheus.io/docs/practices/)

---

**Document Version**: 1.0.0  
**Last Updated**: 2025-11-11  
**Owner**: Engineering + Product  
**Next Review**: 2026-05-11 (Quarterly)
