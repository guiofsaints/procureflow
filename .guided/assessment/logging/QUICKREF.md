# Logging Quick Reference - ProcureFlow

**TL;DR**: Use `logger` from `@/lib/logger` instead of `console.*`. ECS-compliant structured logging with automatic request correlation.

---

## 🚀 Quick Start

### 1. Basic Logging

```typescript
import { logger } from '@/lib/logger';

// Instead of console.log/error/warn
logger.info('User action completed', { userId, action: 'purchase' });
logger.warn('Slow operation detected', { duration_ms: 450 });
logger.error('Operation failed', { error: err.message });
logger.debug('Debug information', { debugData });
```

### 2. API Route Logging

```typescript
import { withLogging } from '@/app/api/_logging/withLogging';
import { NextRequest, NextResponse } from 'next/server';

// Wrap your handler - that's it!
export const POST = withLogging(async (req: NextRequest) => {
  // Your existing code - no changes needed
  const data = await req.json();
  return NextResponse.json({ success: true });
});

// Automatically logs:
// - Request start (method, path, headers)
// - Response end (status, duration)
// - Errors (with stack trace)
```

### 3. Feature-Scoped Logger

```typescript
import { createChildLogger } from '@/lib/logger';

const cartLogger = createChildLogger({ feature: 'cart' });

// All logs include feature: 'cart' automatically
cartLogger.info('Item added to cart', { itemId, quantity });
cartLogger.error('Cart operation failed', { userId, error: err.message });
```

### 4. Domain Events

```typescript
import { logDomainEvent } from '@/app/api/_logging/withLogging';

// Log important business events
await logDomainEvent('cart.item_added', {
  itemId: 'item-123',
  userId: 'user-456',
  quantity: 2,
});

await logDomainEvent('purchase.completed', {
  purchaseId: 'purchase-789',
  totalAmount: 99.99,
});
```

### 5. External API Calls

```typescript
import { logExternalApiCall } from '@/app/api/_logging/withLogging';

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
}
```

---

## ⚙️ Environment Configuration

Add to `.env.local`:

```bash
# Development (verbose, all logs)
LOG_ENABLED=true
LOG_LEVEL=debug
LOG_FORMAT=ecs
LOG_SAMPLING=1.0

# Production (optimized, sampled)
LOG_ENABLED=true
LOG_LEVEL=info
LOG_FORMAT=ecs
LOG_SAMPLING=0.05  # 5% sampling, errors always logged
LOG_REDACT_KEYS=password,token,authorization,secret,cookie
```

---

## ✅ Migration Checklist

### Before (❌ Don't do this)

```typescript
console.log('User logged in');
console.error('Failed to process:', error);
console.warn('Deprecated feature used');
```

### After (✅ Do this)

```typescript
import { logger } from '@/lib/logger';

logger.info('User logged in', { userId, timestamp });
logger.error('Failed to process request', {
  error: { type: error.name, message: error.message },
  context: { userId, action: 'process_payment' },
});
logger.warn('Deprecated feature used', { feature: 'old-api', userId });
```

---

## 📋 Common Patterns

### Service Layer Error Handling

```typescript
// cart.service.ts
import { logger } from '@/lib/logger';

export async function addItemToCart(input: AddItemInput) {
  try {
    // Business logic
    logger.info('Item added to cart', {
      event: { dataset: 'domain', action: 'cart.item_added' },
      cart: { userId: input.userId, itemId: input.itemId },
    });
    return result;
  } catch (error) {
    logger.error('Failed to add item to cart', {
      event: { dataset: 'domain', action: 'cart.add_item.error' },
      cart: { userId: input.userId, itemId: input.itemId },
      error: { type: error.name, message: error.message },
    });
    throw error;
  }
}
```

### API Route with Critical Logging

```typescript
import { withRequiredLogging } from '@/app/api/_logging/withLogging';

// Always logged, never sampled (for auth, payments, etc.)
export const POST = withRequiredLogging(async (req: NextRequest) => {
  // Critical operation
});
```

### Client Component Error Boundary

```typescript
import { clientLogger } from '@/lib/logger';

export function ErrorBoundary({ error }: { error: Error }) {
  clientLogger.error('React error boundary triggered', {
    error: { type: error.name, message: error.message },
    component: 'CartPageContent'
  });

  return <div>Something went wrong</div>;
}
```

---

## 🔍 Log Structure (ECS Format)

Every log includes:

```json
{
  "@timestamp": "2025-11-11T12:34:56.789Z",
  "log.level": "info",
  "message": "Operation completed",
  "service": {
    "name": "procureflow-web",
    "version": "0.1.0"
  },
  "process": { "pid": 12345 },
  "host": { "hostname": "dev-machine" },
  "labels": { "env": "development" },
  "procureflow": {
    "requestId": "uuid-abc123",
    "feature": "cart"
  }
}
```

---

## 🚫 What NOT to Do

❌ **Don't use console.\***

```typescript
console.log('Debug info'); // Use logger.debug()
console.error('Error:', err); // Use logger.error()
console.warn('Warning'); // Use logger.warn()
```

❌ **Don't log PII directly**

```typescript
logger.info('User email', { email }); // Email will be redacted
// User IDs are automatically hashed in request context
```

❌ **Don't log sensitive data**

```typescript
logger.info('Payment', {
  creditCard: '1234-5678-9012-3456', // Automatically redacted
});
```

❌ **Don't create custom log formats**

```typescript
const customLog = `[${new Date()}] ERROR: ${msg}`; // Use logger
```

---

## 🎯 Performance Tips

### Use Sampling for High-Volume Routes

```typescript
// Health checks don't need 100% logging
// Automatically sampled based on LOG_SAMPLING
export const GET = withLogging(async (req) => {
  return NextResponse.json({ status: 'ok' });
});
```

### Lazy Evaluation for Debug Logs

```typescript
// Only evaluated if LOG_LEVEL=debug
logger.debug('Expensive operation', () => ({
  data: computeExpensiveData(), // Only runs if debug enabled
}));
```

### Avoid Logging in Tight Loops

```typescript
// ❌ Don't do this
items.forEach((item) => {
  logger.debug('Processing item', { item }); // Too many logs
});

// ✅ Do this instead
logger.debug('Processing batch', { itemCount: items.length });
```

---

## 📚 More Information

- **Full Assessment**: `.guided/assessment/logging/scan.report.md`
- **Implementation Plan**: `.guided/assessment/logging/improvement.plan.md`
- **Edge Runtime**: `packages/web/src/middleware-logging-edge.md`
- **Examples**: `packages/web/src/app/api/_logging/withLogging.ts`

---

## 🆘 Troubleshooting

**Logs not appearing?**

- Check `LOG_ENABLED=true` in `.env.local`
- Verify no syntax errors in logger imports
- Check console for Winston initialization errors

**Invalid JSON in logs?**

- Ensure LOG_FORMAT=ecs
- Check for circular references in metadata
- Verify Winston formatter is working

**Missing request context?**

- Ensure route wrapped with `withLogging` or `withRequestContext`
- Check running in Node runtime (not Edge)
- Verify AsyncLocalStorage available

**Performance issues?**

- Reduce LOG_SAMPLING (e.g., 0.05 for 5%)
- Increase LOG_LEVEL to info/warn in production
- Check for excessive metadata in logs
