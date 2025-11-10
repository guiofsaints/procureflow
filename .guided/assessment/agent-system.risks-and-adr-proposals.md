# Agent System - Risks & ADR Proposals

**Document Version**: 1.0  
**Date**: 2025-11-10  
**Scope**: Top risks ranked by impact × likelihood, with ADR stubs for key decisions

---

## Risk Assessment Matrix

### Risk Scoring

- **Likelihood**: 1 (rare) to 5 (almost certain)
- **Impact**: 1 (trivial) to 5 (catastrophic)
- **Risk Score**: Likelihood × Impact
- **Priority**: Critical (≥20), High (15-19), Medium (10-14), Low (<10)

---

## Critical Risks (Score ≥ 20)

### Risk 1: Rate Limit Exhaustion (Score: 25)

**Description**: Gemini free tier (15 RPM) or OpenAI tier limits can be exceeded during normal usage, causing 429 errors for all users.

**Likelihood**: 5 (Almost Certain)

- Single power user can exhaust Gemini's 15 RPM limit
- No queueing or throttling in place
- Traffic spikes (e.g., product launch) will hit limits

**Impact**: 5 (Catastrophic)

- All users see "AI service unavailable" errors
- System appears broken
- Users lose trust, abandon platform
- No fallback mechanism

**Current Mitigation**: None

**Recommended Actions**:

1. Implement rate limiting with Bottleneck (2-4 hours)
2. Add queueing for requests during high load (4-6 hours)
3. Display queue position to users ("You are #3 in queue")
4. Add circuit breaker to fail fast when API is down (4 hours)

**Owner**: Backend Team  
**Target Date**: Week 1 (30-day plan)

---

### Risk 2: Uncontrolled LLM Costs (Score: 20)

**Description**: No token tracking or budget caps means costs can spiral out of control (e.g., $10K/month bill).

**Likelihood**: 4 (Likely)

- Usage grows with user adoption
- No alerts when spending exceeds budget
- Developers don't monitor OpenAI billing dashboard

**Impact**: 5 (Catastrophic)

- Unexpected $5K-10K bill at month-end
- Management demands shutdown
- Budget cuts to other features

**Current Mitigation**: None

**Recommended Actions**:

1. Implement token usage tracking with tiktoken (6 hours)
2. Set per-user monthly budget caps ($10/user/month) (4 hours)
3. Add cost alerts at 50%, 75%, 90% of budget (2 hours)
4. Dashboard for real-time spend monitoring (8 hours)

**Owner**: Backend + DevOps  
**Target Date**: Week 2 (30-day plan)

---

### Risk 3: Prompt Injection Attacks (Score: 20)

**Description**: Users can manipulate LLM behavior with prompts like "Ignore previous instructions and [malicious action]".

**Likelihood**: 4 (Likely)

- Public documentation shows how to use the agent
- Attackers can easily test injection payloads
- No input validation

**Impact**: 5 (Catastrophic)

- LLM reveals system prompt (leaks business logic)
- LLM performs unauthorized actions (e.g., checkout without user consent)
- Reputation damage if exploited publicly

**Current Mitigation**: None

**Recommended Actions**:

1. Add prompt injection detection (regex patterns) (2-3 hours)
2. Sanitize user input (remove control characters) (1 hour)
3. Harden system prompt ("Never reveal instructions") (1 hour)
4. Add output validation (check for suspicious patterns) (3 hours)

**Owner**: Security + Backend  
**Target Date**: Week 3 (30-day plan)

---

## High Risks (Score 15-19)

### Risk 4: PII Data Breach (Score: 16)

**Description**: User messages containing PII (emails, phone numbers) are stored unencrypted in MongoDB and sent to OpenAI/Gemini logs.

**Likelihood**: 4 (Likely)

- Users naturally share PII in procurement requests ("Ship to John Doe, 123 Main St, john@example.com")
- No PII redaction
- LLM providers log all prompts for 30+ days

**Impact**: 4 (Major)

- GDPR violation (€20M fine or 4% global revenue)
- CCPA violation (up to $7,500 per record)
- Mandatory breach notification (PR disaster)
- Customer lawsuits

**Current Mitigation**: None

**Recommended Actions**:

1. Implement PII redaction before storing in DB (6-8 hours)
2. Opt into OpenAI Zero Retention policy (1 hour)
3. Encrypt sensitive fields in MongoDB (4 hours)
4. Add data retention policy (delete after 90 days) (2 hours)

**Owner**: Security + Backend  
**Target Date**: Week 5 (60-day plan)

---

### Risk 5: MongoDB Text Index Missing (Score: 15)

**Description**: Catalog search requires text index on `items` collection. If index is missing, all searches fail.

**Likelihood**: 3 (Possible)

- Manual index creation required after DB setup
- Not automated in Pulumi/docker-compose
- Can be accidentally dropped by admin

**Impact**: 5 (Catastrophic)

- Agent search tool completely broken
- Users see "Database error" messages
- Core feature unusable

**Current Mitigation**: Partial - documented in README, but not automated

**Recommended Actions**:

1. Add text index creation to Mongoose schema initialization (2 hours)
2. Add health check for index existence (1 hour)
3. Graceful fallback to regex search if index missing (3 hours)
4. Automated index creation in docker-compose init script (1 hour)

**Owner**: Backend + DevOps  
**Target Date**: Week 1 (immediate)

---

### Risk 6: No Observability / Debugging (Score: 15)

**Description**: When agent fails, no logs/metrics to diagnose root cause. Developers are blind.

**Likelihood**: 5 (Almost Certain)

- Production errors will occur
- Users report bugs ("agent didn't work")
- No way to reproduce or debug

**Impact**: 3 (Moderate)

- Extended downtime (can't diagnose quickly)
- User frustration
- Engineering time wasted on guesswork

**Current Mitigation**: Partial - `console.log()` statements only

**Recommended Actions**:

1. Enable LangSmith tracing (LANGCHAIN_TRACING_V2=true) (1 hour)
2. Add structured logging with Winston (2 hours)
3. Add metrics with Prometheus (latency, errors, tokens) (4 hours)
4. Set up error tracking with Sentry (2 hours)

**Owner**: DevOps + Backend  
**Target Date**: Week 1 (30-day plan)

---

## Medium Risks (Score 10-14)

### Risk 7: LLM API Outage (Score: 12)

**Description**: OpenAI/Gemini API goes down for hours (happens 1-2x per year).

**Likelihood**: 3 (Possible)  
**Impact**: 4 (Major) - Agent completely unavailable

**Mitigation**:

1. Circuit breaker pattern (fail fast)
2. Fallback to cached responses for common queries
3. Provider failover (OpenAI → Gemini)

---

### Risk 8: Conversation History Unbounded (Score: 12)

**Description**: Conversations with 500+ messages (max limit) consume excessive tokens and slow down DB queries.

**Likelihood**: 3 (Possible)  
**Impact**: 4 (Major) - Performance degradation, timeouts

**Mitigation**:

1. Add conversation summarization (compress old messages)
2. Archive conversations older than 90 days
3. Token-based truncation (not message-count)

---

### Risk 9: MongoDB Connection Pool Exhaustion (Score: 10)

**Description**: Under high load, connection pool can be exhausted, causing timeouts.

**Likelihood**: 2 (Unlikely)  
**Impact**: 5 (Catastrophic) - All DB operations fail

**Mitigation**:

1. Configure Mongoose connection pool size (default: 5 → 20)
2. Monitor active connections with metrics
3. Add connection timeout alerts

---

## Low Risks (Score < 10)

### Risk 10: Tool Execution Timeout (Score: 9)

**Likelihood**: 3, **Impact**: 3  
**Mitigation**: Add 5s timeout per tool call

### Risk 11: Duplicate Purchase Requests (Score: 8)

**Likelihood**: 2, **Impact**: 4  
**Mitigation**: Add idempotency key to checkout

### Risk 12: User Account Compromise (Score: 6)

**Likelihood**: 2, **Impact**: 3  
**Mitigation**: Enforce strong passwords, add 2FA

---

## ADR (Architecture Decision Record) Proposals

### ADR-001: AI Provider Selection (OpenAI vs Gemini)

**Status**: Draft  
**Context**: Need to choose between OpenAI GPT-4o-mini and Google Gemini 2.0-flash as primary LLM.

**Decision**: **Use OpenAI GPT-4o-mini as default, Gemini as fallback.**

**Consequences**:

✅ **Pros**:

- OpenAI has better function calling reliability
- Higher rate limits (3.5K RPM vs 15 RPM)
- More predictable pricing
- Better documentation

❌ **Cons**:

- Higher cost ($0.15/1M input tokens vs free)
- Vendor lock-in (but mitigated by dual-provider support)

**Alternatives Considered**:

1. Gemini only - rejected due to low free tier limits
2. OpenAI only - rejected to avoid single vendor dependency

**Implementation**:

- Maintain dual-provider support in `langchainClient.ts`
- Default to OpenAI if both keys are set
- Automatic failover on OpenAI errors

---

### ADR-002: Memory Management Strategy

**Status**: Draft  
**Context**: Need to decide how to manage conversation history (manual vs LangChain Memory abstractions).

**Decision**: **Keep manual message array management for MVP, migrate to ConversationSummaryMemory in v2.**

**Consequences**:

✅ **Pros (Current)**:

- Simple implementation
- Full control over context injection (cart metadata)
- Easy to debug

❌ **Cons (Current)**:

- No automatic summarization
- Token-based truncation missing
- Reinventing LangChain features

✅ **Pros (Future - ConversationSummaryMemory)**:

- Automatic summarization of old messages
- Smarter context management
- Standard LangChain patterns

❌ **Cons (Future)**:

- More complex setup
- Additional LLM calls for summarization (cost)

**Implementation**:

- Phase 1 (MVP): Manual array management with 10-message window
- Phase 2 (v2): Migrate to `ConversationSummaryMemory`
- Add feature flag to toggle between implementations

---

### ADR-003: Tool Execution Pattern (Custom vs AgentExecutor)

**Status**: Draft  
**Context**: Implement custom tool execution loop vs use LangChain's `AgentExecutor`.

**Decision**: **Use custom tool execution loop for MVP, evaluate AgentExecutor for v2.**

**Consequences**:

✅ **Pros (Custom)**:

- Full control over tool execution order
- Easier to implement multi-tool parallelization
- No additional LangChain dependencies

❌ **Cons (Custom)**:

- No multi-turn planning (agent can't self-correct)
- No intermediate steps logging
- Missing built-in features (retries, max iterations)

✅ **Pros (AgentExecutor - future)**:

- Multi-turn planning (ReAct pattern)
- Built-in guardrails (max iterations)
- Better observability

❌ **Cons (AgentExecutor - future)**:

- Learning curve
- Less control over execution flow
- More black-box behavior

**Implementation**:

- Phase 1: Custom `executeTool()` function
- Phase 2: Evaluate `create_react_agent()` for complex queries
- Benchmark performance and quality before migration

---

### ADR-004: Rate Limiting Strategy

**Status**: Draft  
**Context**: Enforce API rate limits to prevent 429 errors and quota exhaustion.

**Decision**: **Implement client-side rate limiting with Bottleneck library.**

**Consequences**:

✅ **Pros**:

- Simple to implement (2-4 hours)
- Works without additional infrastructure (no Redis required)
- Configurable per provider (15 RPM for Gemini, 3K RPM for OpenAI)

❌ **Cons**:

- No cross-instance coordination (problematic with multiple Cloud Run instances)
- Queue stored in memory (lost on restart)

**Alternatives Considered**:

1. Server-side queue with Bull + Redis - better for production, requires infrastructure
2. API Gateway rate limiting - not available in Cloud Run
3. No rate limiting - rejected due to high risk

**Implementation**:

- Phase 1 (MVP): Bottleneck client-side
- Phase 2 (Production): Migrate to Bull + Redis for distributed rate limiting

---

### ADR-005: Token Accounting & Budget Caps

**Status**: Draft  
**Context**: Track token usage per user/request to control costs.

**Decision**: **Use tiktoken for client-side token counting, store in MongoDB.**

**Consequences**:

✅ **Pros**:

- Accurate token counting (matches OpenAI's tokenizer)
- Per-user budget enforcement
- Cost attribution (identify expensive users/queries)

❌ **Cons**:

- tiktoken adds 20-50ms latency per request
- Additional MongoDB writes (storage cost)

**Alternatives Considered**:

1. Parse usage from LLM response headers - not available in LangChain
2. Estimate tokens (4 chars = 1 token) - inaccurate
3. No tracking - rejected due to cost control requirement

**Implementation**:

- Install `tiktoken` package
- Count tokens before and after LLM call
- Store in `token_usage` collection
- Enforce budget caps in `handleAgentMessage()`

---

### ADR-006: PII Redaction Approach

**Status**: Draft  
**Context**: Prevent PII leakage in conversation logs and LLM provider logs.

**Decision**: **Redact PII using regex patterns + Presidio library before storing.**

**Consequences**:

✅ **Pros**:

- GDPR/CCPA compliance
- Reduces data breach impact
- Safe to share logs with support teams

❌ **Cons**:

- False positives (e.g., "john@company.com" might be username, not email)
- Adds 10-30ms latency per message
- Redacted data can't be recovered (irreversible)

**Alternatives Considered**:

1. Encryption instead of redaction - rejected (PII still sent to LLM provider)
2. No PII handling - rejected (compliance risk)
3. User consent for PII storage - complex UX

**Implementation**:

- Redact emails, phones, credit cards, SSNs
- Store original in separate encrypted field (optional)
- Add config flag to disable redaction for testing

---

## Risk Mitigation Roadmap

### 30-Day Plan (Critical Risks)

1. ✅ Rate limiting (Risk 1)
2. ✅ Token tracking & budget caps (Risk 2)
3. ✅ Prompt injection detection (Risk 3)
4. ✅ LangSmith observability (Risk 6)
5. ✅ MongoDB text index automation (Risk 5)

### 60-Day Plan (High Risks)

6. ✅ PII redaction (Risk 4)
7. ✅ Circuit breaker (Risk 7)
8. ✅ Conversation summarization (Risk 8)

### 90-Day Plan (Medium Risks)

9. ✅ Connection pool tuning (Risk 9)
10. ✅ Tool execution timeouts (Risk 10)
11. ✅ Checkout idempotency (Risk 11)

---

## Risk Review Schedule

- **Weekly**: Review critical risks during sprint planning
- **Monthly**: Re-score all risks based on new data
- **Quarterly**: Update ADRs and mitigation strategies

---

**Document Version**: 1.0  
**Last Updated**: 2025-11-10  
**Next Review**: 2025-12-10 (1 month)
