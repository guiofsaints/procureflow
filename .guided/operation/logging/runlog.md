# ProcureFlow Logging Assessment and Hardening - Run Log

**Assessment Date**: 2025-11-11  
**Assessor**: ObservabilityEngineer  
**Scope**: Next.js App Router logging audit with Winston + ECS hardening  

## Actions Taken

### 2025-11-11 12:00:00 - Initial Assessment Start

**Action**: Baseline current logging implementation
- Examined `packages/web/src/lib/logger/index.ts`
- Examined `packages/web/src/lib/logger/winston.config.ts`

**Findings**:
- **Current Logger API**: Dual implementation with client-safe `ClientLogger` and Winston-based server logger
- **Client Logger**: Uses console.* with timestamp formatting, safe for client components
- **Winston Config**: Supports console transport + optional Loki for production, includes PII redaction
- **Gap**: No ECS format support, missing request context, no env-flag control for LOG_ENABLED

**Evidence Snippets**:
```typescript
// Current client logger - no ECS format
console.log(`[${timestamp}] [INFO] ${message}${this.formatMeta(meta)}`);

// Winston config - basic JSON format, not ECS compliant
format: winston.format.combine(
  winston.format.timestamp(),
  redactPII(),
  winston.format.errors({ stack: true }),
  winston.format.json()
)
```

### 2025-11-11 12:15:00 - Console Usage Inventory

**Action**: Searched for console.* usage across packages/web/src
**Command**: `grep -r "console\.(log|warn|error|debug|info)" packages/web/src/`

**Results**: 50+ console.* occurrences found
**Categories**:
1. **Test files**: console mocking in testHelpers.ts (acceptable)
2. **Documentation**: examples in markdown files (acceptable)  
3. **Logger implementations**: legitimate console usage in logger modules
4. **Error handling**: 25+ console.error calls in services and components that should be replaced
5. **Debug prints**: console.log calls that should be removed or converted

**High Priority Replacements Needed**:
- `features/cart/lib/cart.service.ts`: 8 console.error calls
- `features/catalog/lib/catalog.service.ts`: 3 console.error calls  
- `app/api/**/route.ts`: 3 console.error calls in API routes
- Multiple React components with console.error in catch blocks

### 2025-11-11 12:30:00 - Server-side Code Path Analysis

**Action**: Analyzed API routes and server-side code for logging requirements

**API Routes Found**: 20+ routes across:
- `/api/agent/**` - Chat and conversations
- `/api/auth/**` - Authentication flows
- `/api/cart/**` - Shopping cart operations  
- `/api/checkout/**` - Purchase processing
- `/api/items/**` - Catalog CRUD
- `/api/settings/**` - User preferences
- `/api/health` - Health checks
- `/api/metrics` - Prometheus metrics

**Logging Requirements Identified**:
- **Request/Response**: Start/end timing, status codes, method, path
- **Error Handling**: Structured error logs with stack traces
- **Auth Events**: Login/logout outcomes (no PII)
- **Domain Events**: Cart operations, purchases, catalog changes
- **External APIs**: OpenAI calls, database operations
- **Performance**: Slow query detection (>300ms)

**Missing Log Sites**:
- No request/response logging middleware
- Inconsistent error handling across routes
- No structured logging in service layers
- Missing performance monitoring logs

## Next Actions

### Immediate (Started)
- Define ECS contract for ProcureFlow ✅
- Update Winston configuration for ECS compliance ✅
- Create request context module with AsyncLocalStorage ✅
- Implement API route logging wrapper ✅

### Planned
- Replace console.* usage systematically  
- Add ESLint no-console rule with allowlist
- Create Edge runtime fallback documentation ✅
- Validate with local testing

---

## Implementation Completed (2025-11-11 12:45-14:30)

### Winston ECS Configuration

**Action**: Updated `packages/web/src/lib/logger/winston.config.ts`

**Key Changes**:
1. Added environment variable support (LOG_ENABLED, LOG_FORMAT, LOG_LEVEL, LOG_SAMPLING, LOG_REDACT_KEYS)
2. Implemented ECS formatter with required fields
3. Enhanced PII redaction with deep object traversal
4. Added service metadata enrichment (name, version, pid, hostname)
5. Implemented no-op logger when LOG_ENABLED=false

**Code Snippet**:
```typescript
// Environment-driven configuration
const LOG_ENABLED = process.env.LOG_ENABLED !== 'false';
const LOG_FORMAT = process.env.LOG_FORMAT || (process.env.NODE_ENV === 'production' ? 'ecs' : 'human');

// ECS formatter adds required fields
const ecsFormat = winston.format((info) => {
  const ecsLog = {
    '@timestamp': info.timestamp,
    'log.level': info.level,
    message: info.message,
    service: { name: 'procureflow-web', version: packageVersion },
    process: { pid: process.pid },
    host: { hostname: os.hostname() },
    labels: { env: process.env.NODE_ENV || 'development' },
  };
  // ... merge metadata
  return info;
});
```

---

### Request Context Module

**Action**: Created `packages/web/src/lib/logger/context.ts`

**Key Features**:
1. AsyncLocalStorage for request correlation
2. Request ID propagation (x-request-id header or UUID)
3. Span ID generation for tracing
4. User ID hashing for privacy
5. Higher-order function `withRequestContext()` for route handlers

**Code Snippet**:
```typescript
export function withRequestContext<T extends unknown[]>(
  handler: (req: NextRequest, ...args: T) => Promise<NextResponse> | NextResponse
) {
  return async (req: NextRequest, ...args: T): Promise<NextResponse> => {
    const context = createRequestContext(req, userId);
    return asyncLocalStorage.run(context, () => handler(req, ...args));
  };
}
```

---

### API Route Logging Wrapper

**Action**: Created `packages/web/src/app/api/_logging/withLogging.ts`

**Key Features**:
1. Automatic request/response timing
2. HTTP metadata extraction (method, path, status, headers)
3. Error capture with structured context
4. Sampling support via LOG_SAMPLING
5. Utilities: `logDomainEvent()`, `logExternalApiCall()`

**Code Snippet**:
```typescript
export const POST = withLogging(async (req: NextRequest) => {
  // Handler automatically logs:
  // - Request start with HTTP metadata
  // - Response completion with duration and status
  // - Errors with full context and stack trace
  return NextResponse.json({ data });
});
```

---

### Logger Index Update

**Action**: Updated `packages/web/src/lib/logger/index.ts`

**Key Changes**:
1. Dual logger support (clientLogger for browser, serverLogger for Node)
2. Automatic request context enrichment
3. Universal `logger` export that picks appropriate implementation
4. Enhanced `createChildLogger()` with context propagation

**Code Snippet**:
```typescript
// Automatically uses Winston on server, console on client
export const logger: Logger = typeof window === 'undefined' ? serverLogger : clientLogger;

// Child logger includes request context automatically
export function createChildLogger(context: Record<string, unknown>): Logger {
  if (typeof window === 'undefined' && winstonLogger) {
    const requestContext = getContextForLogging?.() || {};
    const combinedContext = { ...requestContext, ...context };
    // Returns logger with enriched context
  }
}
```

---

### Edge Runtime Documentation

**Action**: Created `packages/web/src/middleware-logging-edge.md`

**Key Content**:
- Edge runtime limitations (no Winston, no AsyncLocalStorage)
- Minimal ECS JSON fallback strategy using console.log
- Runtime detection helpers
- Middleware logging example
- When to use Edge vs Node runtime guidance

---

## Validation Steps

### Local Testing Procedure

1. **Setup Environment**:
   ```bash
   # Create .env.local in packages/web/
   LOG_ENABLED=true
   LOG_FORMAT=ecs
   LOG_LEVEL=debug
   LOG_SAMPLING=1.0
   LOG_REDACT_KEYS=password,token,authorization
   ```

2. **Start Application**:
   ```bash
   cd c:\Workspace\procureflow
   pnpm dev
   ```

3. **Test Endpoints** (recommended):
   ```bash
   # Success case - GET request
   curl http://localhost:3000/api/items

   # Success case - POST request  
   curl -X POST http://localhost:3000/api/cart/items \
     -H "Content-Type: application/json" \
     -d '{"itemId":"test","quantity":1}'

   # Error case - invalid request
   curl -X POST http://localhost:3000/api/cart/items \
     -H "Content-Type: application/json" \
     -d '{}'

   # Health check (sampling test)
   curl http://localhost:3000/api/health

   # Agent endpoint (external API)
   curl -X POST http://localhost:3000/api/agent/chat \
     -H "Content-Type: application/json" \
     -d '{"message":"search for pens"}'
   ```

4. **Verify ECS Fields**:
   - Check console output for valid JSON
   - Confirm presence of: @timestamp, log.level, message, service.*, process.*, host.*
   - Verify requestId propagation across multiple log entries
   - Validate PII redaction (test with mock sensitive data)

### Expected Output Example

```json
{
  "@timestamp":"2025-11-11T14:30:15.789Z",
  "log.level":"info",
  "message":"HTTP request completed with status 200",
  "service":{"name":"procureflow-web","version":"0.1.0"},
  "process":{"pid":12345},
  "host":{"hostname":"dev-machine"},
  "labels":{"env":"development"},
  "http":{"method":"GET","status_code":200},
  "url":{"path":"/api/items"},
  "event":{"dataset":"http","action":"request.completed","duration_ms":42},
  "procureflow":{"requestId":"uuid-abc123","feature":"api"}
}
```

### Troubleshooting

**Issue**: Logs not appearing
- **Check**: LOG_ENABLED=true in environment
- **Check**: Console transport configured in winston.config.ts
- **Fix**: Verify no syntax errors in logger modules

**Issue**: Invalid JSON format
- **Check**: ECS formatter returning info object correctly
- **Check**: No circular references in metadata
- **Fix**: Use JSON.stringify test on log output

**Issue**: Missing request context
- **Check**: Route wrapped with withRequestContext or withLogging
- **Check**: AsyncLocalStorage available (Node runtime only)
- **Fix**: Ensure not running in Edge runtime

**Issue**: Performance degradation
- **Check**: LOG_SAMPLING set appropriately (0.05-0.2 for production)
- **Check**: No excessive metadata in logs
- **Fix**: Reduce sampling rate or log level

---

## Environment Setup Notes

**Required Environment Variables**:
```bash
LOG_ENABLED=true
LOG_LEVEL=info  
LOG_FORMAT=ecs
LOG_SAMPLING=0.05
LOG_REDACT_KEYS=password,token,authorization,secret,cookie
```

**Current Dependencies**:
- winston: ^3.18.3 (already installed)
- winston-loki: ^6.1.3 (already installed)

**Files Created/Modified**:
- ✅ `packages/web/src/lib/logger/winston.config.ts` (enhanced)
- ✅ `packages/web/src/lib/logger/index.ts` (enhanced)
- ✅ `packages/web/src/lib/logger/context.ts` (new)
- ✅ `packages/web/src/app/api/_logging/withLogging.ts` (new)
- ✅ `packages/web/src/middleware-logging-edge.md` (new)

**Assessment Deliverables**:
- ✅ `.guided/assessment/logging/scan.report.md`
- ✅ `.guided/assessment/logging/scan.findings.json`
- ✅ `.guided/assessment/logging/improvement.plan.md`
- ✅ `.guided/operation/logging/runlog.md` (this file)