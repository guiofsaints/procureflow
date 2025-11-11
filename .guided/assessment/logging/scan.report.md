# ProcureFlow Logging Assessment Report

**Date**: 2025-11-11  
**Assessor**: ObservabilityEngineer  
**Scope**: Next.js App Router logging patterns audit and Winston + ECS hardening  

## Executive Summary

ProcureFlow currently implements a dual logging approach with a client-safe console-based logger and Winston for server-side logging. While the foundation exists, significant gaps remain in ECS compliance, request context propagation, and consistent structured logging across the application.

**Key Findings**: 50+ console.* usage instances need replacement, missing ECS format support, no request tracing, and inconsistent error handling across 20+ API routes.

## Current Logger Implementation

### Logger API Structure

**File**: `packages/web/src/lib/logger/index.ts`
- **Purpose**: Client-safe logger wrapper using console API
- **Interface**: Consistent `Logger` interface (info/warn/error/debug)
- **Client Safety**: Safe for 'use client' components
- **Format**: Timestamp + level + message + JSON metadata

**Current Implementation**:
```typescript
// Client logger output format
[2025-11-11T12:34:56.789Z] [INFO] User action completed {"userId": "abc123", "action": "purchase"}
```

**File**: `packages/web/src/lib/logger/winston.config.ts`  
- **Purpose**: Server-side structured logging with PII redaction
- **Transports**: Console (always) + Loki (production only)
- **Features**: PII redaction patterns, error stack traces, JSON format
- **Environment**: Uses `LOG_LEVEL` and `LOKI_HOST` variables

### Gaps Against ECS Requirements

| ECS Field Category | Current Support | Missing |
|-------------------|-----------------|---------|
| **@timestamp** | ✅ ISO format | - |
| **log.level** | ✅ Winston levels | - |
| **message** | ✅ String message | - |
| **event.*** | ❌ No event context | dataset, action, duration_ms |
| **http.*** | ❌ No HTTP context | method, status_code, request_id |
| **url.*** | ❌ No URL context | path, domain |
| **service.*** | ⚠️ Partial | name hardcoded, no version |
| **process.*** | ❌ No process info | pid, ppid |
| **host.*** | ❌ No host info | hostname, ip |
| **trace.*** | ❌ No tracing | id, span.id, transaction.id |

## Where We Log vs. Where We Should

### API Routes (app/api/**/route.ts)

| Route Category | Current Logging | Should Log |
|---------------|----------------|------------|
| **Authentication** | ❌ console.error only | ✅ Request start/end, auth outcomes |
| **Cart Operations** | ❌ No request logs | ✅ Cart mutations, timing, validation errors |
| **Catalog CRUD** | ❌ No request logs | ✅ Search queries, item mutations, performance |
| **Agent/Chat** | ❌ No request logs | ✅ Message processing, LLM calls, response timing |
| **Checkout** | ❌ No request logs | ✅ Purchase flows, payment validation, domain events |
| **Health Checks** | ⚠️ Basic error logs | ✅ Dependency status, response times |

### Service Layer (features/*/lib/*.service.ts)

| Service | Current Logging | Should Log | Priority |
|---------|----------------|------------|----------|
| **cart.service.ts** | ❌ 8x console.error | ✅ Domain events, validation, retries | HIGH |
| **catalog.service.ts** | ❌ 3x console.error | ✅ Search performance, mutations | HIGH |
| **agent.service.ts** | ❌ Unknown | ✅ LLM calls, tool usage, conversation flow | MEDIUM |
| **auth.service.ts** | ❌ Unknown | ✅ Login/logout outcomes (no PII) | MEDIUM |

### Missing Critical Log Sites

1. **Database Layer**: No slow query detection (>300ms threshold)
2. **External API Clients**: No OpenAI API call logging with request IDs
3. **Middleware**: No request/response timing or error boundary logs  
4. **Background Jobs**: No cron/migration lifecycle logging
5. **Cache Layer**: No Redis/memory cache miss/error differentiation

## Console.* Usage Hot-spots

### High Priority Replacements (25+ instances)

**Service Layer Errors**:
```typescript
// cart.service.ts:212 - REPLACE with logger.error
console.error('[addItemToCart] Error adding item to cart:', {
  userId: input.userId,
  itemId: input.itemId,
  error: error.message
});
```

**API Route Errors**:  
```typescript
// app/api/auth/register/route.ts:46 - REPLACE with logger.error + context
console.error('POST /api/auth/register error:', error);
```

**Component Error Boundaries**:
```typescript
// features/cart/components/CartPageContent.tsx:114 - REPLACE with logger.error
console.error('Error updating quantity:', error);
```

### Acceptable Console Usage (Keep)

- **Test files**: Console mocking in `testHelpers.ts`
- **Documentation**: Examples in `*.md` files
- **Logger modules**: Internal console usage within logger implementations

### Debug/Development Prints (Remove)

- No active debug console.log calls found
- Some JSDoc examples contain console references (acceptable)

## ECS Minimal Contract for ProcureFlow

### Required Fields (Always Present)

```typescript
interface ProcureFlowECSLog {
  "@timestamp": string;              // ISO 8601
  "log.level": "error"|"warn"|"info"|"debug";
  "message": string;
  
  // Event context
  "event": {
    "dataset": "http"|"domain"|"external"|"system";
    "action": string;                // e.g., "users.login", "cart.add_item"
    "duration_ms"?: number;          // Request/operation timing
  };
  
  // Service identification  
  "service": {
    "name": "procureflow-web";
    "version": string;               // From package.json
  };
  
  // Process context
  "process": {
    "pid": number;
  };
  
  // Host context
  "host": {
    "hostname": string;
  };
  
  // Environment
  "labels": {
    "env": "development"|"staging"|"production";
  };
}
```

### HTTP Request Context (When Available)

```typescript
interface HTTPContext {
  "http": {
    "method": "GET"|"POST"|"PUT"|"DELETE"|"PATCH";
    "status_code": number;
    "request": {
      "id": string;                  // UUID or x-request-id header
      "body_bytes"?: number;
    };
    "response": {
      "body_bytes"?: number;
    };
  };
  
  "url": {
    "path": string;                  // e.g., "/api/cart"
    "domain"?: string;
  };
  
  "trace": {
    "id": string;                    // Request correlation ID
    "span"?: {
      "id": string;                  // Operation span ID
    };
  };
}
```

### ProcureFlow-Specific Context

```typescript
interface ProcureFlowContext {
  "procureflow": {
    "requestId": string;             // Generated per request
    "userIdHash"?: string;           // SHA256(userId) for privacy
    "sessionId"?: string;            // Session correlation
    "feature"?: string;              // cart, catalog, agent, auth
  };
}
```

### Error Context (When Applicable)

```typescript
interface ErrorContext {
  "error": {
    "type": string;                  // Error.name or custom type
    "message": string;               // Error.message (redacted)
    "stack_trace"?: string;          // Full stack (development only)
  };
}
```

## Redaction and Sampling Configuration

### Default Redaction Keys
```typescript
const DEFAULT_REDACT_KEYS = [
  'password', 'token', 'authorization', 'secret', 'cookie',
  'apiKey', 'api_key', 'access_token', 'refresh_token',
  'sessionId', 'session_id', 'jwt', 'bearer'
];
```

### Sampling Semantics
- **LOG_SAMPLING**: Float [0..1], percentage of requests to log
- **Health/Static Routes**: Always excluded from sampling  
- **Error Logs**: Never sampled (always logged)
- **Debug Logs**: Respect LOG_LEVEL filtering first

### Environment Flag Control
- **LOG_ENABLED=false**: Disable all structured logging, emergency fallback only
- **LOG_FORMAT=ecs**: Force ECS JSON format (vs. human-readable for dev)
- **LOG_LEVEL**: Standard Winston levels (error, warn, info, debug, silly)

## Validation Examples (Redacted)

### Successful API Request
```json
{
  "@timestamp":"2025-11-11T12:34:56.789Z",
  "log.level":"info", 
  "message":"HTTP request completed",
  "event":{"dataset":"http","action":"cart.add_item","duration_ms":42},
  "http":{"method":"POST","status_code":201,"request":{"id":"req-abc123"}},
  "url":{"path":"/api/cart/items"},
  "service":{"name":"procureflow-web","version":"0.1.0"},
  "process":{"pid":12345},
  "host":{"hostname":"dev-machine"},
  "labels":{"env":"development"},
  "procureflow":{"requestId":"req-abc123","userIdHash":"sha256:def456","feature":"cart"}
}
```

### Service Error with Context  
```json
{
  "@timestamp":"2025-11-11T12:35:15.123Z",
  "log.level":"error",
  "message":"Failed to add item to cart",
  "event":{"dataset":"domain","action":"cart.add_item_error"},
  "error":{"type":"ValidationError","message":"Item not found in catalog"},
  "service":{"name":"procureflow-web","version":"0.1.0"},
  "process":{"pid":12345},
  "host":{"hostname":"dev-machine"},
  "labels":{"env":"development"},
  "procureflow":{"requestId":"req-abc123","userIdHash":"sha256:def456","feature":"cart"}
}
```

### External API Call
```json
{
  "@timestamp":"2025-11-11T12:36:00.456Z",
  "log.level":"info",
  "message":"OpenAI API call completed",
  "event":{"dataset":"external","action":"openai.chat_completion","duration_ms":1250},
  "http":{"method":"POST","status_code":200},
  "url":{"domain":"api.openai.com","path":"/v1/chat/completions"},
  "service":{"name":"procureflow-web","version":"0.1.0"},
  "procureflow":{"requestId":"req-abc123","feature":"agent"}
}
```

## Recommendations Summary

### Quick Wins (72 hours)
1. **Enable ECS format in Winston**: Update configuration for structured output
2. **Replace critical console.error**: Focus on service layer and API routes  
3. **Add request context**: Implement AsyncLocalStorage for request correlation

### Short Term (2-4 weeks)  
1. **API route logging wrapper**: Systematic request/response timing
2. **Service layer standardization**: Replace all console.* with structured logging
3. **Performance monitoring**: Add slow query and external API call logging

### Medium Term (>1 month)
1. **Edge runtime strategy**: Document minimal JSON fallback approach
2. **ESLint enforcement**: Add no-console rule with logger module allowlist
3. **Log volume optimization**: Fine-tune sampling and implement log aggregation

## Troubleshooting Notes

### Common Issues
- **Winston + Next.js bundling**: Use dynamic imports for winston-loki to avoid native dependency issues
- **AsyncLocalStorage**: Only available in Node runtime, not Edge
- **Environment variables**: Ensure LOG_* variables are available at runtime, not just build time
- **PII detection**: RegExp-based redaction may miss complex nested objects

### Verification Commands
```bash
# Test ECS format output
LOG_ENABLED=true LOG_FORMAT=ecs LOG_LEVEL=debug pnpm dev

# Validate JSON structure  
curl http://localhost:3000/api/health | jq '.' # Check logs in terminal

# Monitor log volume
LOG_SAMPLING=0.1 pnpm dev  # 10% sampling for volume testing
```