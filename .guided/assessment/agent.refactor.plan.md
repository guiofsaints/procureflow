# Agent Refactor - Project Plan

**Project ID**: `agent.refactor-and-integration.plan-and-execute`  
**Version**: 1.0.1  
**Date**: 2025-11-10  
**Status**: 🟢 In Progress

---

## Executive Summary

**Goal**: Transform the current monolithic agent service into a production-ready, multi-provider AI orchestration system with reliability, observability, and safety controls.

**Scope**: Backend refactor of agent layer with provider switching (OpenAI/Gemini/Ollama), reliability patterns, observability stack, and safety guardrails.

**Timeline**: 12 steps (~40-50 hours of development)  
**Risk Level**: Medium (API contract preservation critical)

---

## Current State Assessment

### Architecture Overview

**Entry Point**: `src/app/(app)/api/agent/chat/route.ts`

- POST handler accepts `{ conversationId?, message, userId? }`
- Calls `agentService.handleAgentMessage()`
- Returns streaming SSE response or JSON

**Core Service**: `src/features/agent/lib/agent.service.ts` (1208 lines)

- **God Function**: Handles everything from validation → orchestration → tool execution → persistence
- **Tool Execution**: 7 tools (search_catalog, add_to_cart, update_cart_quantity, view_cart, analyze_cart, remove_from_cart, checkout)
- **Memory**: Manual array management, last 10 messages with cart context injected into content
- **Provider**: Calls `chatCompletionWithTools()` from langchainClient.ts

**AI Provider Layer**: `src/lib/ai/langchainClient.ts` (503 lines)

- **Current Providers**: OpenAI (GPT-4o-mini) OR Gemini (gemini-2.0-flash)
- **Selection Logic**: Environment variable `AI_PROVIDER` or auto-detect (OpenAI priority)
- **No Reliability Controls**: No rate limiting, retries, timeouts (30s OpenAI only), or circuit breakers
- **No Observability**: Only `console.error()` logging, no structured logs or metrics

**Database**: MongoDB with Mongoose

- `AgentConversationModel`: Stores conversation history, messages, actions, status
- No token usage tracking collection
- No cost metrics

### Dependencies Inventory

**Current LangChain Stack**:

```json
"@langchain/core": "1.0.3",
"@langchain/openai": "1.0.0",
"@langchain/google-genai": "^1.0.0"
```

**Missing Dependencies** (to be added):

- `@langchain/community` - For Ollama support
- `bottleneck` - Rate limiting
- `p-retry` - Retry with backoff
- `opossum` - Circuit breaker
- `winston` / `winston-loki` - Structured logging
- `prom-client` - Prometheus metrics
- `tiktoken` - Token counting
- `langsmith` - Tracing SDK (optional)

**Existing Validation**:

- `zod: ^4.1.12` ✅ Available

---

## Scope Definition

### In Scope

**✅ Provider Infrastructure**:

- Multi-provider adapter (OpenAI, Gemini, Ollama)
- Autodetect logic per environment variables
- Local Ollama support when `OLLAMA_BASE_URL` present

**✅ Reliability (P0)**:

- Rate limiting with Bottleneck (per-provider RPM limits)
- Retries with exponential backoff/jitter (p-retry)
- Timeouts (connection, read, overall)
- Circuit breaker (opossum)
- Per-tool 5s timeout wrapper

**✅ Observability**:

- Structured logging (Winston) with PII redaction
- Prometheus metrics (request count, latency, errors, token usage)
- LangSmith tracing with conversation tagging
- `/api/metrics` endpoint

**✅ Safety & Validation**:

- Zod validation for tool inputs and API payloads
- Prompt injection detection (heuristics + control-char stripping)
- Optional moderation gate (OpenAI Moderation API)

**✅ Token & Cost Tracking**:

- tiktoken-based token counting
- Persist usage metrics per request (userId, model, tokens, cost estimate)
- `/api/usage` read-only endpoint

**✅ Architecture Refactor**:

- File split: handler → orchestrator → tools → memory → provider adapter
- Centralized error handling
- Max tool-calls limit per turn
- Token-based truncation for history

**✅ Testing & Healthchecks**:

- Unit tests for provider selection and validation
- `/api/health` endpoint (DB + provider reachability)

**✅ Documentation**:

- Target architecture with C4 diagrams
- Sequence flows with failure branches
- Runbook (alerts, troubleshooting, rollback)
- `.env` examples for all providers

### Out of Scope (Future Work)

**❌ Multi-Step Planner**:

- Current: Single-turn agent (one LLM call per user message)
- Future: ReAct-style multi-turn planning with intermediate steps

**❌ Advanced Memory**:

- Current: Manual message array management
- Future: ConversationSummaryMemory, vector retrieval, RAG

**❌ Streaming Optimizations**:

- Current: SSE streaming exists but not optimized
- Future: Token-by-token streaming with tool call delimiters

**❌ Response Caching**:

- Optional enhancement if time permits
- Redis-based cache for idempotent read flows

**❌ UI Changes**:

- API contract preserved - no UI refactor required
- Settings UI for provider selection is optional

**❌ TypeScript Compilation**:

- No `tsc` step - rely on Next.js build and ESLint only

---

## Assumptions

1. **Environment Variables Available**:
   - At least one of: `OPENAI_API_KEY`, `GOOGLE_API_KEY`, or `OLLAMA_BASE_URL`
   - If none present, fail fast with actionable error message

2. **MongoDB Running**:
   - Local dev: `mongodb://localhost:27017/procureflow`
   - Docker: `docker-compose up -d`

3. **ESLint/Prettier Configured**:
   - `pnpm lint` and `pnpm lint:fix` commands work
   - Prettier config exists (`.prettierrc` or `package.json`)

4. **API Contract Stability**:
   - POST `/api/agent/chat` request/response format unchanged
   - UI continues to work without modifications

5. **Tool Execution Logic Preserved**:
   - All 7 tools (search_catalog, add_to_cart, etc.) maintain current behavior
   - Tool schemas and validation can be enhanced but not broken

6. **Mongoose Models Unchanged**:
   - `AgentConversationModel` structure preserved
   - New models can be added (e.g., `TokenUsageModel`)

---

## Risk Assessment

| Risk                                | Likelihood | Impact   | Mitigation                                                              |
| ----------------------------------- | ---------- | -------- | ----------------------------------------------------------------------- |
| **Breaking API Contract**           | Medium     | Critical | Comprehensive integration tests before merge                            |
| **Provider Selection Bugs**         | High       | High     | Unit tests for all selection paths (env vars, autodetect)               |
| **Rate Limit Config Errors**        | Medium     | High     | Conservative defaults (15 RPM Gemini, 60 RPM OpenAI), make configurable |
| **Circuit Breaker False Positives** | Low        | Medium   | Tunable thresholds (50% error rate, 30s reset)                          |
| **Token Counting Overhead**         | Low        | Low      | tiktoken adds ~20-50ms per request (acceptable)                         |
| **Rollback Complexity**             | Low        | High     | Feature flags for new provider logic, DB schema backward-compatible     |
| **Dependency Conflicts**            | Low        | Medium   | Lock file (`pnpm-lock.yaml`) ensures reproducibility                    |

---

## Success Criteria

### Functional Acceptance

- [ ] **Provider Switching**: OpenAI, Gemini, and Ollama (when `OLLAMA_BASE_URL` set) all functional
- [ ] **Autodetect**: Provider selection works in priority order (env var > Ollama > OpenAI > Gemini)
- [ ] **Rate Limiting**: Bottleneck enforces per-provider RPM limits (no 429 errors under normal load)
- [ ] **Retries**: 429/500/503/timeout errors trigger exponential backoff (max 3 retries)
- [ ] **Circuit Breaker**: Opens after 50% error rate, resets after 30s
- [ ] **Timeouts**: All LLM calls timeout after 30s (configurable)
- [ ] **Tool Timeout**: Individual tools timeout after 5s
- [ ] **Validation**: Zod rejects invalid payloads with 400 + descriptive error
- [ ] **Moderation**: Unsafe content blocked if moderation enabled
- [ ] **Token Tracking**: All requests logged with input/output token counts
- [ ] **Cost Estimation**: USD cost calculated per request (model-specific pricing)
- [ ] **Logs**: Winston emits structured JSON logs with PII redacted
- [ ] **Metrics**: Prometheus `/api/metrics` exposes request count, latency, errors, tokens
- [ ] **Tracing**: LangSmith traces visible if `LANGCHAIN_TRACING_V2=true`
- [ ] **Health Check**: `/api/health` returns 200 with DB + provider status
- [ ] **API Contract**: Existing `/api/agent/chat` request/response unchanged

### Code Quality

- [ ] **ESLint Clean**: Zero errors after `pnpm lint` at each step
- [ ] **Prettier**: All files formatted via `pnpm prettier --write .`
- [ ] **File Organization**: Handler → Orchestrator → Tools → Memory → Provider Adapter separation
- [ ] **Error Handling**: Centralized error boundary with typed exceptions
- [ ] **Max Tool Calls**: Configurable limit (default: 10 per turn)
- [ ] **Token Truncation**: History truncated by token count, not message count
- [ ] **Unit Tests**: Provider selection and validation logic covered
- [ ] **Integration Tests**: End-to-end flow tested with mock LLM

### Observability

- [ ] **Structured Logs**: All logs include `{ timestamp, level, conversationId, userId, ...metadata }`
- [ ] **Metrics Exposed**: `agent_requests_total`, `agent_request_duration_seconds`, `llm_tokens_total`, `llm_cost_usd_total`
- [ ] **Traces Tagged**: LangSmith runs tagged with `conversationId`, `userId`, `provider`, `model`
- [ ] **Alerting Ready**: Runbook defines thresholds (error rate >1%, p95 latency >3s)

### Documentation

- [ ] **Target Architecture**: C4 L1/L2 diagrams created
- [ ] **Sequence Flows**: Happy path + failure scenarios documented
- [ ] **Runbook**: Alerts, troubleshooting steps, rollback procedure
- [ ] **`.env` Examples**: OpenAI, Gemini, Ollama configurations documented
- [ ] **Change Log**: All changes logged with what/why/impact

---

## Rollout Plan

### Deployment Strategy

**Direct Rollout** (no feature flag required):

- All changes deployed together
- Backward-compatible with existing conversations
- API contract unchanged

### Monitoring (24-hour watch)

**Metrics to Watch**:

- Error rate (threshold: >1% → rollback)
- p95 latency (threshold: >3s → investigate)
- 429 rate limit errors (threshold: >10/min → increase limits)
- Circuit breaker opens (threshold: >5/hour → investigate provider)

**Rollback Triggers**:

- Error rate exceeds 1% for 10+ minutes
- p95 latency exceeds 3s consistently
- Multiple circuit breaker trips (>10 in 1 hour)
- Critical bugs in provider selection logic

### Rollback Procedure

1. **Immediate**: Revert to previous commit via `git revert`
2. **Deploy**: Push rollback commit to production
3. **Verify**: Monitor error rate drops below 1%
4. **Postmortem**: Document failure in `.guided/operation/agent.change-log.md`

---

## Step-by-Step Execution Plan

### Step 1: Read Inputs & Freeze Scope ✅ IN PROGRESS

- [x] Scan repository for agent entrypoints
- [x] Analyze current architecture
- [x] Document assumptions and out-of-scope items
- [ ] Update `.guided/assessment/agent.refactor.plan.md`

**Outputs**:

- This document (agent.refactor.plan.md)

**Estimated Time**: 2 hours

---

### Step 2: Baseline Observability (Pre-Refactor)

- [ ] Install Winston and winston-loki
- [ ] Create `lib/logger/winston.config.ts` with PII redaction
- [ ] Replace `console.log` calls in agent.service.ts with `logger.info()`
- [ ] Install prom-client
- [ ] Create `lib/metrics/prometheus.config.ts` with metrics definitions
- [ ] Add `/api/metrics` endpoint
- [ ] Enable LangSmith tracing in langchainClient.ts
- [ ] Tag runs with conversationId, userId

**Acceptance**:

- Structured JSON logs visible in console
- `/api/metrics` returns Prometheus format
- LangSmith traces appear in dashboard

**Estimated Time**: 4 hours

---

### Step 3: Provider Adapter Skeleton + Selection Logic

- [ ] Install `@langchain/community` for Ollama
- [ ] Create `lib/ai/providerAdapter.ts` with:
  - `invokeChat({ messages, tools, options }): Promise<AIResponse>`
  - `capabilities(): { toolCalling, streaming }`
  - `getProviderInfo(): { provider, model }`
- [ ] Implement selection logic per `providerSelectionRule`
- [ ] Add OpenAI adapter (wrap ChatOpenAI)
- [ ] Add Gemini adapter (wrap ChatGoogleGenerativeAI)
- [ ] Add Ollama adapter (wrap ChatOllama) - only if `OLLAMA_BASE_URL`
- [ ] Normalize tool-call result shape
- [ ] Unit tests for provider selection

**Acceptance**:

- All 3 providers functional
- Autodetect works in priority order
- Fails fast with actionable error if no keys

**Estimated Time**: 6 hours

---

### Step 4: Reliability P0 (Rate Limit, Retries, Timeouts, Circuit Breaker)

- [ ] Install bottleneck, p-retry, opossum
- [ ] Create `lib/reliability/rateLimiter.ts` with per-provider limits
- [ ] Create `lib/reliability/retry.ts` with exponential backoff
- [ ] Create `lib/reliability/circuitBreaker.ts` with opossum wrapper
- [ ] Wrap `invokeChat()` in providerAdapter with all reliability layers
- [ ] Add connection timeout (10s), read timeout (30s), overall timeout (30s)
- [ ] Add per-tool 5s timeout wrapper in orchestrator

**Acceptance**:

- Rate limiter blocks requests exceeding RPM
- Retries work for 429/500/503 errors
- Circuit breaker opens on 50% error rate
- Timeouts trigger after 30s

**Estimated Time**: 6 hours

---

### Step 5: Safety & Input Validation

- [ ] Create `lib/validation/schemas.ts` with Zod schemas for:
  - API payloads (handleAgentMessage params)
  - Tool inputs (search_catalog, add_to_cart, etc.)
- [ ] Add prompt injection detection heuristics
- [ ] Add control-char stripping utility
- [ ] Optional: Add OpenAI Moderation API wrapper
- [ ] Apply validation at API route handler boundary
- [ ] Apply validation at tool execution boundary

**Acceptance**:

- Invalid payloads rejected with 400 + error details
- Prompt injection attempts logged and blocked
- Moderation blocks unsafe content (if enabled)

**Estimated Time**: 4 hours

---

### Step 6: Token Usage & Cost Tracking

- [ ] Install tiktoken
- [ ] Create `lib/ai/tokenCounter.ts` with:
  - `countTokens(messages): number`
  - `estimateCost(provider, model, inputTokens, outputTokens): number`
- [ ] Create Mongoose schema `TokenUsageModel`:
  - `userId, conversationId, model, provider, promptTokens, completionTokens, totalTokens, costUSD, createdAt`
- [ ] Log token usage after each LLM call
- [ ] Create `/api/usage` endpoint (read-only, filtered by userId)

**Acceptance**:

- Token counts accurate (match OpenAI API response)
- Cost estimates calculated per model pricing
- `/api/usage` returns usage history

**Estimated Time**: 5 hours

---

### Step 7: Target Architecture Design

- [ ] Create C4 L1 (System Context) diagram
- [ ] Create C4 L2 (Container View) diagram
- [ ] Design file split:
  - `agent-message-handler.ts` (HTTP boundary)
  - `agent-orchestrator.ts` (loop, limits, error handling)
  - `agent-tool-executor.ts` (tool schema, validation, timeouts)
  - `conversation-manager.ts` (history, truncation)
- [ ] Create sequence diagrams:
  - Happy path: User message → LLM → Tool → Response
  - Failure: Rate limit exceeded
  - Failure: Tool timeout
  - Failure: Circuit breaker open

**Acceptance**:

- C4 diagrams render in Mermaid
- Sequence flows cover happy + failure paths
- File responsibilities clearly defined

**Estimated Time**: 4 hours

---

### Step 8: Refactor Orchestrator to Adapter-First

- [ ] Create `agent-orchestrator.ts` with:
  - `orchestrateAgentTurn(params): Promise<AgentResponse>`
  - Centralized error handling
  - Max tool-calls limit (default: 10)
  - Unified tool result formatting
- [ ] Create `agent-tool-executor.ts` with:
  - `executeTool(toolName, args, timeout): Promise<ToolResult>`
  - Per-tool timeout wrapper
  - Tool result validation
- [ ] Create `conversation-manager.ts` with:
  - `buildMessageHistory(conversation, maxTokens): Message[]`
  - Token-based truncation
  - Cart context injection (maintain current behavior)
- [ ] Refactor `agent.service.ts`:
  - Keep `handleAgentMessage()` as entry point
  - Delegate to orchestrator
  - Preserve API contract

**Acceptance**:

- Orchestrator handles all control flow
- Tool executor applies 5s timeout
- Conversation manager truncates by tokens
- API contract unchanged

**Estimated Time**: 8 hours

---

### Step 9: Memory & Truncation Safeguards

- [ ] Add config constants:
  - `MAX_HISTORY_MESSAGES = 50`
  - `MAX_INPUT_TOKENS = 3000`
  - `MAX_TOTAL_TOKENS = 4000`
- [ ] Implement token-based truncation in conversation-manager
- [ ] Add summarization hook (stub for future)
- [ ] Log when truncation occurs

**Acceptance**:

- History truncated when exceeding token limits
- Truncation logged with metadata
- No breaking changes to API

**Estimated Time**: 2 hours

---

### Step 10: Tests & Healthchecks

- [ ] Unit tests for provider selection logic
  - Test all env var combinations
  - Test autodetect priority order
  - Test fail-fast when no keys
- [ ] Unit tests for Zod validation
  - Test valid/invalid payloads
  - Test tool input schemas
- [ ] Create `/api/health` endpoint:
  - Check MongoDB connection
  - Check provider reachability (ping LLM API)
  - Return 200 + status details or 503 + error
- [ ] Integration test (optional):
  - Mock LLM responses
  - Test full flow: message → tool execution → response

**Acceptance**:

- All unit tests pass
- `/api/health` returns accurate status
- Integration test covers happy path

**Estimated Time**: 4 hours

---

### Step 11: Optional Enhancements

- [ ] Response cache (Redis):
  - Cache idempotent search results (TTL 5m)
  - Cache key: hash(query + filters)
- [ ] Prompt cache:
  - Cache static system prompt (invalidation on update)
- [ ] SSE streaming optimization:
  - Token-by-token streaming with tool call delimiters

**Acceptance**:

- Cache hit rate >30% for repeated queries
- Streaming UX improved (if implemented)

**Estimated Time**: 6 hours (optional)

---

### Step 12: Settings Surface & Docs

- [ ] Create Settings UI (optional):
  - Show detected provider
  - Allow manual override (if multi-provider)
  - Display provider status (reachable/unreachable)
- [ ] Update `.env.example`:
  - Add `OLLAMA_BASE_URL` example
  - Document all provider env vars
  - Add reliability config examples
- [ ] Create `.guided/operation/agent.runbook.md`:
  - Alert thresholds
  - Troubleshooting steps (429 errors, timeouts, circuit breaker)
  - Rollback procedure
- [ ] Update `.guided/operation/agent.change-log.md`:
  - Append dated entries for all changes

**Acceptance**:

- `.env.example` documents all providers
- Runbook covers common alerts
- Change log complete

**Estimated Time**: 3 hours

---

## Total Effort Estimate

| Step                           | Estimated Hours | Priority |
| ------------------------------ | --------------- | -------- |
| 1. Read inputs & freeze scope  | 2               | P0       |
| 2. Baseline observability      | 4               | P0       |
| 3. Provider adapter skeleton   | 6               | P0       |
| 4. Reliability P0              | 6               | P0       |
| 5. Safety & validation         | 4               | P0       |
| 6. Token usage & cost tracking | 5               | P0       |
| 7. Target architecture design  | 4               | P1       |
| 8. Refactor orchestrator       | 8               | P0       |
| 9. Memory & truncation         | 2               | P1       |
| 10. Tests & healthchecks       | 4               | P0       |
| 11. Optional enhancements      | 6               | P2       |
| 12. Settings & docs            | 3               | P1       |
| **Total**                      | **54 hours**    | -        |

**P0 (Critical)**: 39 hours  
**P1 (High)**: 9 hours  
**P2 (Optional)**: 6 hours

---

## Dependencies & Prerequisites

### Required Packages (to be installed)

```json
{
  "dependencies": {
    "@langchain/community": "latest",
    "bottleneck": "^2.19.5",
    "p-retry": "^6.2.0",
    "opossum": "^8.1.4",
    "winston": "^3.11.0",
    "winston-loki": "^6.0.8",
    "prom-client": "^15.1.0",
    "tiktoken": "^1.0.13"
  },
  "devDependencies": {
    "@types/opossum": "^8.1.4"
  }
}
```

### Environment Variables (new)

```bash
# AI Provider Selection
AI_PROVIDER=openai|gemini|ollama  # Optional override

# Ollama (local LLM)
OLLAMA_BASE_URL=http://localhost:11434

# LangSmith Tracing
LANGCHAIN_TRACING_V2=true
LANGCHAIN_API_KEY=<your-langsmith-key>

# Logging
LOG_LEVEL=info  # debug, info, warn, error

# Rate Limiting (optional overrides)
OPENAI_RPM_LIMIT=60
GEMINI_RPM_LIMIT=15
OLLAMA_RPM_LIMIT=100

# Circuit Breaker (optional overrides)
CIRCUIT_BREAKER_ERROR_THRESHOLD=0.5  # 50%
CIRCUIT_BREAKER_RESET_TIMEOUT=30000  # 30s
```

---

## Change Log Preview

All changes will be logged in `.guided/operation/agent.change-log.md`:

```markdown
## 2025-11-10: Baseline Observability

**What**: Added structured logging (Winston) and Prometheus metrics
**Why**: Enable production monitoring and debugging
**Impact**: All agent requests now logged with metadata; `/api/metrics` available

## 2025-11-10: Provider Adapter + Ollama Support

**What**: Created provider adapter with OpenAI/Gemini/Ollama support
**Why**: Enable local LLM usage and reduce vendor lock-in
**Impact**: Users can run agent on local Ollama (no API costs)

## 2025-11-10: Reliability Controls (Rate Limit, Retries, Circuit Breaker)

**What**: Wrapped LLM calls with Bottleneck, p-retry, opossum
**Why**: Prevent 429 errors and cascading failures
**Impact**: System resilient to provider outages and rate limits
```

---

## Next Steps

1. ✅ **Complete Step 1**: This planning document
2. 🔄 **Begin Step 2**: Install Winston, add structured logging
3. 📋 **Track Progress**: Update todo list after each step
4. 🧪 **Run Tests**: `pnpm lint:fix && pnpm prettier --write .` after each step

---

**Document Version**: 1.0  
**Last Updated**: 2025-11-10  
**Status**: ✅ Step 1 Complete - Ready for Implementation
