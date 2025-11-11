# Testing Strategy

> **Status**: Planned - Not Yet Implemented  
> **Last Updated**: 2025-11-10

## Current State

**No automated tests currently implemented.**

The project has excellent infrastructure and code organization but lacks test coverage. This is acceptable for a bootstrap/MVP codebase but should be addressed before production deployment.

## Planned Testing Strategy

### Test Pyramid

```
       E2E Tests (Playwright)
      ────────────────────
         Integration Tests (API)
    ──────────────────────────────
               Unit Tests (Vitest)
    ──────────────────────────────────────
```

### Unit Tests (Bottom Layer)

**Tool**: Vitest  
**Scope**: Service layer functions  
**Coverage Target**: 80%

**Test Files**:
- `features/catalog/lib/catalog.service.test.ts`
- `features/cart/lib/cart.service.test.ts`
- `features/checkout/lib/checkout.service.test.ts`
- `features/agent/lib/agent.service.test.ts`

**Mocking Strategy**:
- Mock MongoDB with in-memory database or fixtures
- Mock AI provider responses
- Mock external services

### Integration Tests (Middle Layer)

**Tool**: Vitest or Jest with supertest  
**Scope**: API route handlers  
**Coverage Target**: Critical flows

**Test Scenarios**:
- POST /api/catalog/search → Returns items
- POST /api/cart/add → Adds item to cart
- POST /api/checkout → Creates purchase request
- POST /api/agent/chat → Agent responds correctly

**Test Database**: Separate test MongoDB instance

### E2E Tests (Top Layer)

**Tool**: Playwright  
**Scope**: Critical user journeys  
**Coverage Target**: Happy paths + key error scenarios

**Test Scenarios**:
1. **User Journey: Search and Checkout**
   - Login → Search "keyboards" → Add to cart → Checkout → Verify purchase request

2. **Agent Journey: Conversational Procurement**
   - Login → Open agent → "I need 5 ergonomic mice" → Agent searches → Confirm add to cart → Checkout

3. **Error Scenarios**:
   - Invalid credentials
   - Empty cart checkout
   - Duplicate item detection

## Test Environment Setup

### Development

```bash
pnpm test               # Run all tests
pnpm test:unit          # Unit tests only
pnpm test:integration   # Integration tests
pnpm test:e2e           # End-to-end tests
pnpm test:coverage      # Generate coverage report
```

### CI/CD

- Run tests on every PR
- Block merge if tests fail
- Coverage report uploaded to codecov (future)

## Test Data Strategy

### Fixtures

Create test fixtures in `features/<name>/mock.ts`:
```typescript
export const mockItem = {
  id: 'test-item-1',
  name: 'Test Keyboard',
  // ...
}
```

### Seeding

Use scripts for consistent test data:
- `db:seed-test-data` script (future)

## Mocking Dependencies

### Database

Use in-memory MongoDB or mock Mongoose models:
```typescript
vi.mock('@/lib/db/models', () => ({
  ItemModel: {
    find: vi.fn().mockResolvedValue([mockItem])
  }
}))
```

### AI Provider

Mock LangChain responses:
```typescript
vi.mock('@/lib/ai/langchainClient', () => ({
  chatCompletionWithTools: vi.fn().mockResolvedValue(mockResponse)
}))
```

## Non-Functional Tests

### Performance Tests

- Load testing with k6 or Artillery (future)
- Target: 100 concurrent users
- Measure: Response time, throughput

### Security Tests

- OWASP ZAP scans (future)
- Dependency vulnerability checks: `pnpm audit`

## Test Coverage Goals

| Layer | Target Coverage | Priority |
|-------|----------------|----------|
| Services | 80% | High |
| API Routes | 70% | High |
| Components | 60% | Medium |
| Utils | 90% | Medium |

## Related Documentation

- Testing risks: `.guided/testing/risks.md`
- Coverage report: `.guided/testing/coverage.md` (future)
