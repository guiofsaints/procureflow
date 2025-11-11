# Edge Runtime Logging Strategy for ProcureFlow

**Date**: 2025-11-11  
**Context**: Next.js Edge Runtime logging limitations and fallback strategies

## Overview

The Edge Runtime in Next.js/Vercel has significant limitations compared to Node.js runtime:

- **No Winston**: Winston depends on Node.js-specific APIs (fs, crypto, etc.)
- **No AsyncLocalStorage**: Request context tracking not available
- **Limited APIs**: Restricted to Web APIs only
- **Size Constraints**: Code bundles must be small for edge deployment

## Current ProcureFlow Edge Usage

Based on workspace analysis:

✅ **Minimal Edge Usage**: Most API routes are currently Node.js runtime  
✅ **Middleware Safe**: Uses standard Next.js middleware patterns  
⚠️ **Future Consideration**: May need Edge functions for performance-critical paths

## Edge Logging Strategy

### 1. Environment-Driven Fallback

When `LOG_ENABLED=true` in Edge runtime, use minimal JSON console logging:

```typescript
// Edge runtime helper (lightweight)
function edgeLog(
  level: string,
  message: string,
  metadata: Record<string, any> = {}
) {
  if (process.env.LOG_ENABLED !== 'true') {
    return;
  }

  const logEntry = {
    '@timestamp': new Date().toISOString(),
    'log.level': level,
    message,
    'service.name': 'procureflow-web',
    'labels.runtime': 'edge',
    ...metadata,
  };

  console.log(JSON.stringify(logEntry));
}

// Usage in Edge middleware or API routes
export function middleware(request: NextRequest) {
  edgeLog('info', 'Middleware request started', {
    'http.method': request.method,
    'url.path': request.nextUrl.pathname,
    'http.request.id':
      request.headers.get('x-request-id') || crypto.randomUUID(),
  });

  // ... middleware logic
}
```

### 2. Minimal ECS Compliance

Edge logs should include essential ECS fields only:

```json
{
  "@timestamp": "2025-11-11T12:34:56.789Z",
  "log.level": "info",
  "message": "Edge middleware executed",
  "service.name": "procureflow-web",
  "labels.runtime": "edge",
  "http.method": "GET",
  "url.path": "/api/health",
  "http.request.id": "edge-req-123"
}
```

### 3. Redaction in Edge Runtime

Simple string-based redaction (no complex regex):

```typescript
function simpleRedact(text: string): string {
  if (process.env.NODE_ENV === 'production') {
    return text
      .replace(/password=\w+/gi, 'password=[REDACTED]')
      .replace(/token=\w+/gi, 'token=[REDACTED]')
      .replace(/authorization:\s*\w+/gi, 'authorization: [REDACTED]');
  }
  return text;
}
```

## Edge Runtime Detection

Detect runtime environment and use appropriate logger:

```typescript
// lib/logger/edge.ts
const isEdgeRuntime = () => {
  return (
    typeof EdgeRuntime !== 'undefined' ||
    process.env.NEXT_RUNTIME === 'edge' ||
    (typeof window === 'undefined' && typeof global.EdgeRuntime !== 'undefined')
  );
};

export const logger = isEdgeRuntime() ? edgeLogger : nodeLogger;
```

## Middleware Logging Example

```typescript
// middleware.ts
import { NextRequest, NextResponse } from 'next/server';

function edgeLog(
  level: string,
  message: string,
  meta: Record<string, any> = {}
) {
  if (process.env.LOG_ENABLED === 'true') {
    console.log(
      JSON.stringify({
        '@timestamp': new Date().toISOString(),
        'log.level': level,
        message,
        'service.name': 'procureflow-web',
        'labels.runtime': 'edge',
        ...meta,
      })
    );
  }
}

export function middleware(request: NextRequest) {
  const startTime = Date.now();
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();

  // Add request ID to headers for downstream services
  const response = NextResponse.next();
  response.headers.set('x-request-id', requestId);

  // Log middleware execution
  edgeLog('info', 'Middleware executed', {
    'http.method': request.method,
    'url.path': request.nextUrl.pathname,
    'http.request.id': requestId,
    'event.duration_ms': Date.now() - startTime,
  });

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
```

## Performance Considerations

### Bundle Size Impact

Edge functions have strict size limits:

- **Keep logging minimal**: Only essential functionality
- **Avoid heavy dependencies**: No Winston, moment.js, etc.
- **Tree-shake aggressively**: Import only what's needed

### Runtime Performance

- **Lazy evaluation**: Check `LOG_ENABLED` early
- **Minimal JSON**: Avoid complex object construction
- **String operations**: Prefer simple concatenation over templates

## Migration Strategy

### Current State

- All logging uses Node.js runtime (Winston)
- No Edge runtime logging in place

### Recommended Approach

1. **Phase 1**: Continue using Node.js runtime for API routes
2. **Phase 2**: Add Edge logging helpers for future middleware needs
3. **Phase 3**: Evaluate Edge runtime for specific performance-critical endpoints

### When to Choose Edge vs Node

**Use Edge Runtime for**:

- ✅ Lightweight middleware (auth checks, redirects)
- ✅ Simple API transformations
- ✅ Geographic edge distribution needs

**Use Node.js Runtime for**:

- ✅ Complex business logic
- ✅ Database operations
- ✅ File system access
- ✅ Rich logging and observability
- ✅ External API integrations

## Implementation Checklist

### Immediate Actions (if needed)

- [ ] Detect Edge runtime in logger selection
- [ ] Implement minimal ECS JSON console fallback
- [ ] Add simple string-based redaction
- [ ] Test middleware logging with Edge runtime

### Future Considerations

- [ ] Evaluate edge deployment benefits for ProcureFlow
- [ ] Consider log shipping from Edge to centralized system
- [ ] Monitor bundle size impact of logging code

## Testing Edge Logging

```bash
# Force Edge runtime (if supported by route)
export NEXT_RUNTIME=edge

# Test with logging enabled
LOG_ENABLED=true pnpm dev

# Verify JSON output in console
curl -H "x-request-id: test-123" http://localhost:3000/api/health
```

## Limitations and Trade-offs

### Edge Runtime Limitations

- ❌ No request context propagation (AsyncLocalStorage)
- ❌ No Winston transports (file, Loki, etc.)
- ❌ Limited error stack trace capture
- ❌ Reduced metadata richness

### Acceptable Trade-offs

- ✅ Faster cold starts
- ✅ Better geographic distribution
- ✅ Lower resource usage
- ✅ Simplified deployment

## Conclusion

For ProcureFlow's current needs, **Node.js runtime remains the optimal choice** for API routes requiring rich observability. Edge runtime should be considered only for:

1. Performance-critical middleware
2. Simple request/response transformations
3. Geographic distribution requirements

The fallback logging strategy provides a safety net if Edge runtime becomes necessary, while maintaining basic observability through minimal ECS-compliant JSON logs via console.
