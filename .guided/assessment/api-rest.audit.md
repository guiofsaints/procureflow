# REST API Audit (HTTP Conventions, Validation, OpenAPI)

**Project**: ProcureFlow  
**API Style**: RESTful (Next.js App Router route handlers)  
**Audit Date**: November 10, 2025

---

## Executive Summary

**API Health**: GOOD with consistency improvements needed  
**HTTP Conventions**: ✅ Mostly correct (GET/POST/DELETE)  
**Validation**: ✅ Zod schemas at boundaries  
**OpenAPI**: ⚠️ Static schema exists, needs runtime sync  
**Critical Issue**: Inconsistent error responses, no correlation IDs

---

## 1. HTTP Method Usage ✅ GOOD

### Correct Patterns Detected
```typescript
// GET /api/items - Search catalog
export async function GET(request: NextRequest) { /* ... */ }

// POST /api/items - Create new item
export async function POST(request: NextRequest) { /* ... */ }

// DELETE /api/items/:id - Delete item
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) { /* ... */ }
```

**Assessment**: Proper RESTful verb usage

---

### Missing Patterns
1. **No PUT/PATCH** - Update operations not implemented
2. **No OPTIONS** - CORS preflight not handled
3. **No HEAD** - Resource existence checks not supported

**Examples of Missing Endpoints**:
- `PUT /api/items/:id` - Update catalog item (TODO in codebase)
- `PATCH /api/cart/items/:id` - Update quantity
- `PUT /api/settings/profile` - Update user profile

**Recommendation**: Implement missing update endpoints

---

## 2. Resource Modeling ✅ GOOD

### Nouns vs Verbs
**Pattern**: All routes use nouns (correct)

**Examples**:
- ✅ `/api/items` (noun, good)
- ✅ `/api/cart` (noun, good)
- ✅ `/api/checkout` (noun, acceptable for process)
- ✅ `/api/purchase` (noun, good)

**No verb-based routes detected** (good)

---

### Nested Resources
**Pattern**: Proper nesting for relationships

```
GET /api/cart/items              # Cart items (collection)
POST /api/cart/items             # Add item to cart
DELETE /api/cart/items/:itemId   # Remove specific item
```

**Assessment**: ✅ Correct RESTful nesting

---

## 3. Status Code Usage

### Current Patterns
| Endpoint | Success | Error | Missing |
|----------|---------|-------|---------|
| GET /api/items | 200 | 500 | 404 (no items) |
| POST /api/items | 200 ⚠️ | 400, 401, 500 | 201 (created) |
| DELETE /api/items/:id | 200 | 500 | 404 (not found) |
| POST /api/checkout | 200 | 400, 500 | - |

**Issues**:
1. **POST should return 201** for created resources
2. **DELETE should return 204** (no content) or 200 with body
3. **No 404 handling** for missing resources
4. **No 409 handling** for conflicts (duplicate items)

**Recommended Fixes**:
```typescript
// POST /api/items (create)
return NextResponse.json(item, { status: 201 });  // ✅ Created

// DELETE /api/items/:id
if (!deletedItem) {
  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}
return NextResponse.json({ success: true }, { status: 200 });

// POST /api/items (duplicate)
if (error instanceof DuplicateItemError) {
  return NextResponse.json({
    error: 'Conflict',
    message: 'Item already exists',
    duplicates: error.duplicates,
  }, { status: 409 });
}
```

---

## 4. Idempotency

### GET Requests ✅ IDEMPOTENT
All GET endpoints are read-only (correct)

### POST Requests ⚠️ NON-IDEMPOTENT
**Current Behavior**: Multiple POST requests create multiple resources

**Example**:
```typescript
// POST /api/cart/items (multiple calls)
await addItemToCart({ itemId: '123', quantity: 1 });
await addItemToCart({ itemId: '123', quantity: 1 });
// Result: quantity = 2 (accumulated, not idempotent)
```

**Recommendation**: Add idempotency keys for critical operations

```typescript
// POST /api/checkout with idempotency key
const idempotencyKey = request.headers.get('Idempotency-Key');

if (idempotencyKey) {
  const cached = await getCachedCheckout(idempotencyKey);
  if (cached) {
    return NextResponse.json(cached);  // ✅ Return cached result
  }
}

const result = await checkout({ userId, notes });
await cacheCheckout(idempotencyKey, result, 86400);  // Cache 24h

return NextResponse.json(result, { status: 201 });
```

---

### DELETE Requests ✅ IDEMPOTENT
Deleting non-existent resource should return same result (currently returns 200)

---

## 5. Error Response Schema ⚠️ INCONSISTENT

### Current Patterns (Mixed)
```typescript
// Pattern 1: error + message
{ error: 'Failed to search items', message: 'Connection timeout' }

// Pattern 2: error only
{ error: 'Failed to fetch cart' }

// Pattern 3: success flag + error
{ success: false, error: 'Validation failed' }
```

**Issue**: Clients cannot rely on consistent structure

**Recommended Standard**:
```typescript
// Success response
{
  success: true,
  data: { /* ... */ }
}

// Error response
{
  success: false,
  error: {
    code: 'VALIDATION_ERROR',  // Machine-readable
    message: 'Invalid request body',  // Human-readable
    details: [  // Optional validation errors
      { field: 'name', message: 'Name is required' }
    ],
    correlationId: 'abc-123',  // For debugging
    timestamp: '2025-11-10T14:00:00Z'
  }
}
```

---

## 6. Pagination ⚠️ INCOMPLETE

### Current Pattern
```typescript
// GET /api/items?limit=50
export async function GET(request: NextRequest) {
  const limit = parseInt(searchParams.get('limit') || '50');
  const items = await catalogService.searchItems({ limit });
  return NextResponse.json({ items, count: items.length });
}
```

**Issues**:
1. **No offset/cursor** - Cannot paginate through results
2. **No total count** - Client doesn't know total items
3. **No next/prev links** - Client must construct URLs

**Recommended Pattern** (Cursor-based):
```typescript
// GET /api/items?limit=50&cursor=abc123
export async function GET(request: NextRequest) {
  const limit = parseInt(searchParams.get('limit') || '50');
  const cursor = searchParams.get('cursor') || undefined;

  const result = await catalogService.searchItems({ limit, cursor });

  return NextResponse.json({
    items: result.items,
    pagination: {
      limit,
      nextCursor: result.nextCursor || null,
      hasMore: result.hasMore,
    },
  });
}
```

---

## 7. Filtering & Sorting

### Current State
```typescript
// GET /api/items?q=laptop
// Only supports keyword search
```

**Missing Features**:
- Category filtering
- Price range filtering
- Sorting (price, name, date)

**Recommended Pattern**:
```typescript
// GET /api/items?category=electronics&minPrice=100&maxPrice=500&sort=-price
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const filters = {
    q: searchParams.get('q') || undefined,
    category: searchParams.get('category') || undefined,
    minPrice: parseFloat(searchParams.get('minPrice') || '0'),
    maxPrice: parseFloat(searchParams.get('maxPrice') || '999999'),
    sort: searchParams.get('sort') || 'name',  // name, -name, price, -price
  };

  const items = await catalogService.searchItems(filters);
  return NextResponse.json({ items });
}
```

---

## 8. Validation & Sanitization ✅ GOOD

### Current Pattern: Zod at Boundary
```typescript
// POST /api/items
const body = await request.json();
const result = createItemSchema.safeParse(body);

if (!result.success) {
  return NextResponse.json({
    error: 'Validation failed',
    message: result.error.errors.map(e => e.message).join(', '),
  }, { status: 400 });
}

const item = await createItem(result.data);
```

**Assessment**: ✅ Excellent validation at API boundary

**Recommendation**: Extract to utility (see duplication-report.md)

---

## 9. Versioning Strategy ⚠️ NONE

**Current State**: No API versioning

**Options**:
1. **URL versioning**: `/api/v1/items`
2. **Header versioning**: `Accept: application/vnd.procureflow.v1+json`
3. **Query param**: `/api/items?version=1`

**Recommendation** (for future):
```
/api/v1/items     # Version 1
/api/v2/items     # Version 2 (breaking changes)
```

---

## 10. Rate Limiting ⚠️ NONE

**Current State**: No rate limiting detected

**Recommendation**: Add middleware with Upstash or in-memory cache

```typescript
// middleware.ts (partial)
import { Ratelimit } from '@upstash/ratelimit';

const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, '1 m'),  // 100 requests per minute
});

export async function middleware(request: NextRequest) {
  const ip = request.ip ?? '127.0.0.1';
  const { success, remaining } = await ratelimit.limit(ip);

  if (!success) {
    return NextResponse.json(
      { error: 'Too many requests' },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': '100',
          'X-RateLimit-Remaining': remaining.toString(),
        },
      }
    );
  }

  return NextResponse.next();
}
```

---

## 11. Caching Headers ⚠️ MISSING

**Current State**: No cache headers set

**Recommendation**: Add Cache-Control headers

```typescript
// GET /api/items (semi-static catalog)
return NextResponse.json(items, {
  headers: {
    'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
  },
});

// GET /api/cart (user-specific)
return NextResponse.json(cart, {
  headers: {
    'Cache-Control': 'private, no-cache',
  },
});
```

---

## 12. ETags / Conditional Requests ⚠️ MISSING

**Use Case**: Avoid re-fetching unchanged resources

**Recommendation**:
```typescript
import crypto from 'crypto';

// GET /api/items/:id
const item = await getItemById(id);
const etag = crypto.createHash('md5').update(JSON.stringify(item)).digest('hex');

const clientEtag = request.headers.get('If-None-Match');

if (clientEtag === etag) {
  return new NextResponse(null, { status: 304 });  // Not Modified
}

return NextResponse.json(item, {
  headers: {
    'ETag': etag,
    'Cache-Control': 'max-age=3600',
  },
});
```

---

## 13. Security Headers ✅ PARTIALLY IMPLEMENTED

### Current State
```javascript
// next.config.mjs
poweredByHeader: false,  // ✅ Good (hides Next.js version)
```

**Missing Headers**:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Strict-Transport-Security` (HSTS)

**Recommendation**: Add in middleware
```typescript
export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');

  return response;
}
```

---

## 14. OpenAPI Schema ✅ PARTIALLY IMPLEMENTED

**File**: `lib/openapi.ts` (683 LOC)

**Current State**: Static schema definition

**Issues**:
1. **No runtime validation** against schema
2. **Manual sync** with Zod schemas (duplication)
3. **No auto-generation** from code

**Recommendation**: Generate from Zod schemas

```typescript
import { generateSchema } from '@anatine/zod-openapi';

export const itemSchema = generateSchema(createItemSchema);

// Auto-sync with runtime validation
export const openApiSpec = {
  openapi: '3.0.0',
  paths: {
    '/api/items': {
      post: {
        requestBody: {
          content: {
            'application/json': {
              schema: itemSchema,  // ✅ Generated from Zod
            },
          },
        },
      },
    },
  },
};
```

---

## Summary & Recommendations

### Critical (Week 1)
1. ✅ **Standardize error response schema** (correlationId, code, message)
2. ✅ **Fix status codes** (201 for POST, 404 for missing resources)
3. ✅ **Implement missing update endpoints** (PUT /api/items/:id)

### High Priority (Month 1)
4. ✅ **Add pagination** (cursor-based for scalability)
5. ✅ **Add filtering & sorting** to catalog search
6. ✅ **Add rate limiting** middleware
7. ✅ **Sync OpenAPI with Zod** schemas

### Medium Priority (Quarter 1)
8. ✅ **Add caching headers** (Cache-Control, ETag)
9. ✅ **Add security headers** in middleware
10. ✅ **Implement idempotency keys** for checkout
11. ✅ **Add API versioning** strategy (v1 prefix)

---

## Metrics & Goals

### Current State
- OpenAPI sync: Manual (duplication risk)
- Error schema: Inconsistent
- Pagination: Incomplete (no cursor)
- Rate limiting: None
- Caching: No headers

### Target State (8 weeks)
- OpenAPI sync: Auto-generated from Zod
- Error schema: 100% consistent
- Pagination: Cursor-based everywhere
- Rate limiting: 100 req/min per IP
- Caching: Proper headers on all GET routes

---

**Next**: `refactor.plan.md`, `ADR-001-code-structure-simplification.md`, `refactor.todo.json`
