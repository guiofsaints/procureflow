# OpenAPI Status and Consolidation Plan

**Executive Summary**: ProcureFlow has a programmatic OpenAPI 3.0 specification in `packages/web/src/lib/openapi.ts` documenting 13 REST endpoints, served at `/api/openapi` endpoint but not statically exported. Current gaps include no API versioning (/api/v1/), no rate limiting documentation, no pagination spec, and no automated validation in CI. Consolidation plan involves automating OpenAPI generation from route handlers with Zod schema reflection, adding CI validation gates, exporting static `openapi.yaml` for external tools (Postman, Swagger UI), and implementing API versioning strategy for v2.0.

---

## Table of Contents

- [Current State](#current-state)
- [OpenAPI Coverage](#openapi-coverage)
- [Generation and Build Process](#generation-and-build-process)
- [Coverage Gaps](#coverage-gaps)
- [Consolidation Plan](#consolidation-plan)
- [Assumptions and Limitations](#assumptions-and-limitations)
- [References](#references)

---

## Current State

### OpenAPI Specification Location

**Primary Source**: `packages/web/src/lib/openapi.ts`  
**Type**: Programmatic OpenAPI 3.0 document (TypeScript object)  
**Served At**: `/api/openapi` (GET endpoint)  
**Format**: JSON (runtime-generated)  
**Version**: OpenAPI 3.0.0  
**API Version**: 1.0.0

**Access**:

```bash
# Development
curl http://localhost:3000/api/openapi | jq

# Production
curl https://procureflow-web-*.run.app/api/openapi | jq
```

---

### OpenAPI Document Structure

```typescript
// packages/web/src/lib/openapi.ts
export function getOpenApiDocument(): OpenAPIDocument {
  return {
    openapi: '3.0.0',
    info: {
      title: 'ProcureFlow API',
      version: '1.0.0',
      description: 'REST API for ProcureFlow - AI-native procurement platform',
    },
    servers: [{ url: '/api', description: 'API base path' }],
    paths: {
      // 13 endpoints documented
    },
    components: {
      schemas: {
        // 15 schemas defined
      },
    },
  };
}
```

**Endpoints Served**:

- `GET /api/openapi` → Returns full OpenAPI spec (JSON)
- No static file generation (no `openapi.yaml` or `openapi.json` file)

---

## OpenAPI Coverage

### Documented Endpoints (13 Total)

| Endpoint                   | Method | Tags     | Auth Required | Request Body Schema   | Response Schema              | Status        |
| -------------------------- | ------ | -------- | ------------- | --------------------- | ---------------------------- | ------------- |
| `/api/health`              | GET    | System   | No            | N/A                   | HealthResponse               | ✅ Documented |
| `/api/items`               | GET    | Catalog  | No            | N/A                   | ItemsListResponse            | ✅ Documented |
| `/api/items`               | POST   | Catalog  | Yes           | CreateItemRequest     | Item                         | ✅ Documented |
| `/api/items/{id}`          | GET    | Catalog  | No            | N/A                   | Item                         | ✅ Documented |
| `/api/cart`                | GET    | Cart     | Yes           | N/A                   | Cart                         | ✅ Documented |
| `/api/cart/items`          | POST   | Cart     | Yes           | AddToCartRequest      | Cart                         | ✅ Documented |
| `/api/cart/items/{itemId}` | DELETE | Cart     | Yes           | N/A                   | Cart                         | ✅ Documented |
| `/api/cart/items/{itemId}` | PUT    | Cart     | Yes           | UpdateCartItemRequest | Cart                         | ✅ Documented |
| `/api/checkout`            | POST   | Checkout | Yes           | N/A                   | PurchaseRequest              | ✅ Documented |
| `/api/purchases`           | GET    | Checkout | Yes           | N/A                   | PurchaseRequestsListResponse | ✅ Documented |
| `/api/purchases/{id}`      | GET    | Checkout | Yes           | N/A                   | PurchaseRequest              | ✅ Documented |
| `/api/agent/chat`          | POST   | Agent    | Yes           | AgentChatRequest      | AgentChatResponse            | ✅ Documented |
| `/api/auth/register`       | POST   | Auth     | No            | RegisterRequest       | RegisterResponse             | ✅ Documented |

**Coverage**: 13/13 API routes documented (100%)

---

### Documented Schemas (15 Total)

| Schema Name                      | Purpose                   | Fields Count                                                                       | Validation Rules                                   | Status      |
| -------------------------------- | ------------------------- | ---------------------------------------------------------------------------------- | -------------------------------------------------- | ----------- |
| **HealthResponse**               | Health check response     | 3 (status, timestamp, checks)                                                      | status: enum(ok, degraded)                         | ✅ Complete |
| **Item**                         | Catalog item entity       | 9 (\_id, name, description, category, price, unit, supplier, createdBy, createdAt) | price: number > 0, name: 2-200 chars               | ✅ Complete |
| **CreateItemRequest**            | Item creation payload     | 6 (name, description, category, price, unit, supplier)                             | Required: name, description, category, price, unit | ✅ Complete |
| **ItemsListResponse**            | Search results            | 2 (items[], count)                                                                 | count: integer                                     | ✅ Complete |
| **Cart**                         | Shopping cart entity      | 4 (\_id, userId, items[], totalCost)                                               | items: array of CartItem                           | ✅ Complete |
| **CartItem**                     | Cart item nested object   | 5 (itemId, name, price, quantity, addedAt)                                         | quantity: 1-999                                    | ✅ Complete |
| **AddToCartRequest**             | Add to cart payload       | 2 (itemId, quantity)                                                               | quantity: 1-999, itemId: required                  | ✅ Complete |
| **UpdateCartItemRequest**        | Update cart item payload  | 1 (quantity)                                                                       | quantity: 1-999                                    | ✅ Complete |
| **PurchaseRequest**              | Purchase request entity   | 7 (\_id, userId, requestNumber, items[], totalCost, status, submittedAt)           | requestNumber: format PR-YYYY-NNNN                 | ✅ Complete |
| **PurchaseRequestItem**          | PR item nested object     | 8 (itemId, name, description, category, price, unit, quantity, notes)              | quantity: integer > 0                              | ✅ Complete |
| **PurchaseRequestsListResponse** | PR list response          | 2 (purchaseRequests[], count)                                                      | count: integer                                     | ✅ Complete |
| **AgentChatRequest**             | Agent chat payload        | 2 (message, conversationId)                                                        | message: required string                           | ✅ Complete |
| **AgentChatResponse**            | Agent response            | 3 (message, conversationId, metadata)                                              | metadata: optional object                          | ✅ Complete |
| **RegisterRequest**              | User registration payload | 3 (name, email, password)                                                          | email: format email, password: min 6 chars         | ✅ Complete |
| **RegisterResponse**             | Registration response     | 2 (message, userId)                                                                | userId: optional string                            | ✅ Complete |

**Coverage**: 15/15 schemas documented (100%)

---

### Authentication Documentation

**Security Scheme**: NextAuth.js session-based authentication

**OpenAPI Security Definition** (Future):

```yaml
components:
  securitySchemes:
    sessionCookie:
      type: apiKey
      in: cookie
      name: next-auth.session-token
      description: NextAuth.js HTTP-only session cookie
```

**Current State**: ⚠️ Not documented in OpenAPI spec (no `securitySchemes`, no `security` annotations on endpoints)

**Authentication Flow**:

1. User registers via `POST /api/auth/register`
2. User logs in via NextAuth.js credentials provider (not documented as API endpoint)
3. NextAuth.js sets HTTP-only cookie `next-auth.session-token`
4. Subsequent requests include cookie automatically (browser)
5. API routes validate session with `getServerSession(authConfig)`

---

## Generation and Build Process

### Current Process (Manual)

**Source of Truth**: `packages/web/src/lib/openapi.ts` (manually maintained)

**Workflow**:

1. Developer implements API route (e.g., `app/api/cart/items/route.ts`)
2. Developer adds endpoint to `openapi.ts` manually
3. Developer defines request/response schemas in `openapi.ts` manually
4. No automated validation (OpenAPI spec can drift from actual routes)

**Pros**:

- ✅ Full control over documentation structure
- ✅ Can document edge cases and business logic

**Cons**:

- ❌ Manual process error-prone (easy to forget updating spec)
- ❌ No validation that spec matches actual route implementation
- ❌ No automated schema generation from Zod validators
- ❌ No static file export (must run server to access spec)

---

### Build Integration (Future)

**Proposed Workflow** (Automated):

1. Developer implements API route with Zod schemas for request/response validation
2. Build script extracts route metadata and Zod schemas
3. OpenAPI spec auto-generated from route handlers and schemas
4. Static `openapi.yaml` and `openapi.json` exported to `public/` directory
5. CI validates spec against routes (fail build if drift detected)

**Tools Considered**:

| Tool                               | Approach                        | Pros                               | Cons                                | Status          |
| ---------------------------------- | ------------------------------- | ---------------------------------- | ----------------------------------- | --------------- |
| **Manual (current)**               | Hand-written TypeScript object  | Full control                       | Error-prone, no validation          | ✅ In use       |
| **@asteasolutions/zod-to-openapi** | Zod schemas → OpenAPI           | Type-safe, auto-generates from Zod | Requires route metadata extraction  | 📝 Recommended  |
| **swagger-jsdoc**                  | JSDoc comments → OpenAPI        | Simple, low overhead               | JSDoc not type-safe                 | ❌ Not suitable |
| **tsoa**                           | TypeScript decorators → OpenAPI | Auto-generates routes + spec       | Requires framework change, invasive | ❌ Too heavy    |

---

## Coverage Gaps

### Missing OpenAPI Features

| Gap                                                              | Impact                                                                             | Priority | Effort | Plan                                                                 |
| ---------------------------------------------------------------- | ---------------------------------------------------------------------------------- | -------- | ------ | -------------------------------------------------------------------- |
| **No API versioning** (all endpoints at `/api/*`, no `/api/v1/`) | Breaking changes require coordinated frontend/backend deployment                   | High     | Medium | Implement `/api/v1/` prefix in v2.0, deprecate unversioned endpoints |
| **No rate limiting documentation**                               | External clients don't know rate limits                                            | Medium   | Low    | Document rate limits in OpenAPI (future: 100 req/min per IP)         |
| **No pagination spec**                                           | `/api/items` and `/api/purchases` don't document pagination params (offset, limit) | Medium   | Low    | Add `offset` and `limit` query params to OpenAPI spec                |
| **No error response schemas**                                    | 400, 401, 409, 500 responses not fully documented                                  | Medium   | Low    | Define standard ErrorResponse schema                                 |
| **No authentication scheme**                                     | `securitySchemes` not defined, no `security` on protected endpoints                | High     | Low    | Add sessionCookie security scheme                                    |
| **No webhooks**                                                  | No webhook documentation (future: purchase request status updates)                 | Low      | N/A    | Not planned for v1.0                                                 |
| **No request examples**                                          | No `examples` in request/response schemas                                          | Low      | Medium | Add examples for each endpoint (future)                              |
| **No response headers documentation**                            | Pagination headers (X-Total-Count) not documented                                  | Low      | Low    | Document custom headers in responses                                 |
| **No static export**                                             | No `openapi.yaml` file for Postman/Swagger UI import                               | High     | Low    | Generate static file during build                                    |

---

### Validation Gaps

| Gap                               | Impact                                              | Priority | Effort | Plan                                                |
| --------------------------------- | --------------------------------------------------- | -------- | ------ | --------------------------------------------------- |
| **No CI validation**              | OpenAPI spec can drift from actual routes           | High     | Medium | Add CI step to validate spec against routes         |
| **No schema validation in tests** | API responses not validated against OpenAPI schemas | Medium   | High   | Add integration tests with OpenAPI validator        |
| **No breaking change detection**  | No automated check for breaking API changes         | Medium   | High   | Use `openapi-diff` in CI to detect breaking changes |
| **No Zod-to-OpenAPI sync**        | Zod schemas in route handlers not synced to OpenAPI | High     | High   | Implement automated schema extraction               |

---

## Consolidation Plan

### Phase 1: Foundation (v1.1 - Q1 2025)

**Goal**: Automate OpenAPI generation and export static files

**Tasks**:

1. **Install @asteasolutions/zod-to-openapi**

   ```powershell
   pnpm add @asteasolutions/zod-to-openapi
   ```

2. **Refactor route handlers to use Zod-to-OpenAPI**

   ```typescript
   // Example: app/api/cart/items/route.ts
   import { z } from 'zod';
   import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';

   extendZodWithOpenApi(z);

   const AddToCartRequestSchema = z
     .object({
       itemId: z.string().openapi({ description: 'Item ID from catalog' }),
       quantity: z
         .number()
         .int()
         .min(1)
         .max(999)
         .openapi({ description: 'Quantity (1-999)' }),
     })
     .openapi('AddToCartRequest');

   export async function POST(request: NextRequest) {
     const body = await request.json();
     const validated = AddToCartRequestSchema.parse(body); // Validates + generates OpenAPI
     // ... rest of handler
   }
   ```

3. **Create build script to generate static OpenAPI file**

   ```typescript
   // scripts/generate-openapi.ts
   import { getOpenApiDocument } from '@/lib/openapi';
   import fs from 'fs';
   import yaml from 'yaml';

   const spec = getOpenApiDocument();

   // Export JSON
   fs.writeFileSync('public/openapi.json', JSON.stringify(spec, null, 2));

   // Export YAML
   fs.writeFileSync('public/openapi.yaml', yaml.stringify(spec));

   console.log('✅ OpenAPI spec exported to public/');
   ```

4. **Add build script to package.json**

   ```json
   {
     "scripts": {
       "build": "npm run generate-openapi && next build",
       "generate-openapi": "tsx scripts/generate-openapi.ts"
     }
   }
   ```

5. **Add CI validation**
   ```yaml
   # .github/workflows/ci.yml
   - name: Validate OpenAPI spec
     run: |
       pnpm run generate-openapi
       npx openapi-lint public/openapi.yaml
   ```

**Deliverables**:

- ✅ Static `public/openapi.json` and `public/openapi.yaml` files
- ✅ Automated generation during build
- ✅ CI validation of spec syntax

**Effort**: 2-3 days

---

### Phase 2: API Versioning (v2.0 - Q2 2025)

**Goal**: Implement API versioning strategy to support breaking changes

**Tasks**:

1. **Create `/api/v1/` route structure**

   ```
   app/api/v1/
     items/route.ts
     cart/route.ts
     checkout/route.ts
     agent/route.ts
     auth/route.ts
   ```

2. **Maintain backward compatibility**
   - Keep unversioned endpoints (`/api/items`) as aliases to `/api/v1/items`
   - Add deprecation warnings in responses

   ```typescript
   // app/api/items/route.ts
   export async function GET(request: NextRequest) {
     const response = await fetch('/api/v1/items');
     response.headers.set(
       'X-API-Deprecated',
       'This endpoint is deprecated. Use /api/v1/items instead.'
     );
     return response;
   }
   ```

3. **Update OpenAPI spec for v1 and v2**

   ```typescript
   // lib/openapi-v1.ts
   export function getOpenApiV1Document() { ... }

   // lib/openapi-v2.ts
   export function getOpenApiV2Document() { ... }
   ```

4. **Document migration guide**

   ```markdown
   # API Migration Guide: v1 → v2

   ## Breaking Changes

   - `/api/items` → `/api/v1/items` (unversioned endpoints deprecated)
   - `/api/cart/items` → `/api/v1/cart` (simplified cart endpoint)
   - Pagination: Added required `limit` parameter (default 50 → no default)
   ```

**Deliverables**:

- ✅ `/api/v1/` versioned endpoints
- ✅ Deprecation warnings on unversioned endpoints
- ✅ Migration guide for external clients

**Effort**: 3-5 days

---

### Phase 3: Enhanced Documentation (v2.1 - Q3 2025)

**Goal**: Add comprehensive examples, error schemas, and interactive documentation

**Tasks**:

1. **Add request/response examples**

   ```typescript
   // openapi.ts
   paths: {
     '/v1/cart/items': {
       post: {
         requestBody: {
           content: {
             'application/json': {
               schema: { $ref: '#/components/schemas/AddToCartRequest' },
               examples: {
                 addPen: {
                   summary: 'Add 5 pens to cart',
                   value: { itemId: '507f1f77bcf86cd799439011', quantity: 5 }
                 }
               }
            }
          }
        }
      }
    }
   }
   ```

2. **Define standard error schemas**

   ```typescript
   components: {
     schemas: {
       ErrorResponse: {
         type: 'object',
         properties: {
           error: { type: 'string', description: 'Error message' },
           code: { type: 'string', description: 'Error code (e.g., VALIDATION_ERROR)' },
           details: { type: 'array', items: { type: 'string' } }
         }
       }
     }
   }
   ```

3. **Deploy Swagger UI**

   ```typescript
   // app/api/docs/page.tsx
   import SwaggerUI from 'swagger-ui-react';
   import 'swagger-ui-react/swagger-ui.css';

   export default function ApiDocs() {
     return <SwaggerUI url="/openapi.json" />;
   }
   ```

4. **Add Redoc alternative**

   ```typescript
   // app/api/redoc/page.tsx
   import { RedocStandalone } from 'redoc';

   export default function ApiRedoc() {
     return <RedocStandalone specUrl="/openapi.json" />;
   }
   ```

**Deliverables**:

- ✅ Comprehensive examples for all endpoints
- ✅ Standard error schemas
- ✅ Swagger UI at `/api/docs`
- ✅ Redoc at `/api/redoc`

**Effort**: 2-3 days

---

### Phase 4: External Client Support (v3.0 - Q4 2025)

**Goal**: Enable external API consumers (mobile apps, third-party integrations)

**Tasks**:

1. **Implement API key authentication**

   ```typescript
   // app/api/v1/auth/apikey/route.ts
   export async function POST(request: NextRequest) {
     const { name } = await request.json();
     const apiKey = generateApiKey();
     // Store in database
     return NextResponse.json({ apiKey });
   }
   ```

2. **Document rate limits**

   ```yaml
   paths:
     /v1/items:
       get:
         x-rate-limit:
           limit: 100
           window: 60 # 100 requests per minute
   ```

3. **Add webhooks support**

   ```yaml
   webhooks:
     purchaseRequestStatusChanged:
       post:
         summary: Purchase request status changed
         requestBody:
           content:
             application/json:
               schema:
                 type: object
                 properties:
                   purchaseRequestId: { type: string }
                   newStatus:
                     { type: string, enum: [pending, approved, rejected] }
   ```

4. **Create SDK generator configuration**
   ```bash
   # Generate TypeScript SDK
   npx @openapitools/openapi-generator-cli generate \
     -i public/openapi.yaml \
     -g typescript-fetch \
     -o packages/sdk-typescript
   ```

**Deliverables**:

- ✅ API key authentication
- ✅ Rate limiting documentation
- ✅ Webhooks support
- ✅ Auto-generated SDKs (TypeScript, Python)

**Effort**: 5-7 days

---

## Assumptions and Limitations

### Assumptions

1. **OpenAPI 3.0.0 sufficient**: No need for 3.1.0 features (webhooks, discriminators) in v1.0
2. **JSON only**: No XML, no Protocol Buffers, no GraphQL (REST API only)
3. **Session-based auth**: No JWT tokens, no OAuth2, no API keys in v1.0
4. **Internal API**: No external clients, no rate limiting, no SDK generation in v1.0
5. **Manual spec maintenance acceptable short-term**: Automated generation planned for v1.1
6. **No breaking changes in v1.x**: All v1.x releases backward compatible

### Limitations

1. **No automated schema validation**: OpenAPI spec not validated against actual API responses in tests
2. **No breaking change detection**: No automated check for breaking API changes between versions
3. **No versioning strategy**: All endpoints at `/api/*`, no `/api/v1/` prefix in v1.0
4. **No pagination documentation**: Endpoints returning lists don't document pagination (future: offset/limit params)
5. **No rate limiting**: No documented or enforced rate limits (future: 100 req/min per IP)
6. **No webhooks**: No webhook support or documentation (future: purchase request status updates)
7. **No SDK generation**: No auto-generated client SDKs (future: TypeScript, Python SDKs)
8. **No interactive docs**: No Swagger UI or Redoc deployment (served only as JSON at `/api/openapi`)

---

## References

### Internal Documents

- [C4 Container Diagram](../architecture/c4.container.md) - API layer architecture
- [PRD: Functional Requirements](../product/prd.functional-requirements.md) - API endpoint requirements
- [Testing Strategy](../testing/testing-strategy.md) - API testing approach (coming soon)
- [Infrastructure Documentation](../architecture/infrastructure.md) - API deployment and observability

### External Resources

- [OpenAPI 3.0 Specification](https://swagger.io/specification/) - Official OpenAPI spec
- [Swagger UI](https://swagger.io/tools/swagger-ui/) - Interactive API documentation
- [Redoc](https://redoc.ly/) - Alternative API documentation renderer
- [@asteasolutions/zod-to-openapi](https://github.com/asteasolutions/zod-to-openapi) - Generate OpenAPI from Zod schemas
- [openapi-diff](https://github.com/OpenAPITools/openapi-diff) - Detect breaking changes between spec versions
- [OpenAPI Generator](https://openapi-generator.tech/) - Generate client SDKs from OpenAPI spec

---

**Last Updated**: 2025-11-12  
**Owner**: API Team + Tech Lead  
**Reviewers**: Frontend Team, Mobile Team (future)  
**Next Review**: Quarterly (2026-02-01) or when implementing API versioning (v2.0)  
**Status**: ✅ Complete
