# Code Quality Improvement Plan

**Generated:** 2025-01-08  
**Project:** ProcureFlow - AI-Native Procurement Platform  
**Purpose:** Prioritized, phased plan to improve code quality based on comprehensive assessment.

---

## Executive Summary

This plan addresses the **technical debt and quality issues** identified in the codebase assessment. Work is organized into **4 phases** over **3-4 weeks**, totaling **~29-48 hours** of development effort.

### Plan Overview

| Phase       | Focus                        | Duration | Effort | Priority    |
| ----------- | ---------------------------- | -------- | ------ | ----------- |
| **Phase 1** | Dead code cleanup & security | Week 1   | 8-12h  | 🔴 Critical |
| **Phase 2** | Type safety & architecture   | Week 2   | 10-16h | 🔴 High     |
| **Phase 3** | Feature completeness         | Week 3   | 6-10h  | 🟡 Medium   |
| **Phase 4** | Refinement & testing         | Week 4   | 5-10h  | 🟡 Medium   |

**Total Effort:** 29-48 hours

### Success Criteria

After all phases:

- ✅ Zero `as any` type casts in production code
- ✅ No hardcoded credentials (production-ready auth)
- ✅ Complete CRUD operations for all entities
- ✅ All quality gates pass (`lint`, `test`, `type-check`, `build`)
- ✅ Agent service split into manageable modules
- ✅ No duplicate code or test files

---

## Phase 1: Dead Code Cleanup & Security Fixes

**Duration:** Week 1 (Monday-Friday)  
**Effort:** 8-12 hours  
**Priority:** 🔴 **Critical** - Production blockers

### Scope

Remove dead code and fix critical security issues that block production deployment.

### Tasks

#### Task 1.1: Remove Dead Code and Duplicates

**Effort:** 30 minutes

**Actions:**

1. Delete duplicate test file:

   ```bash
   rm apps/web/tests/agent-mock.test.ts
   ```

2. Remove unused mock exports from feature `index.ts` files:
   - `src/features/catalog/index.ts` - Remove `export { mockItems }`
   - `src/features/cart/index.ts` - Remove `export { mockCartItems }`
   - `src/features/agent/index.ts` - Remove `export { mockMessages }` (or mark as deprecated)

3. Update tests to ensure no imports break:
   ```bash
   pnpm test
   ```

**Files Modified:**

- `apps/web/tests/agent-mock.test.ts` (DELETE)
- `apps/web/src/features/catalog/index.ts`
- `apps/web/src/features/cart/index.ts`
- `apps/web/src/features/agent/index.ts`

**Quality Gates:**

- ✅ `pnpm test` - All tests pass
- ✅ `pnpm type-check` - No new type errors
- ✅ `pnpm build` - Production build succeeds

---

#### Task 1.2: Implement Real User Authentication

**Effort:** 4-6 hours

**Actions:**

1. Install bcrypt package:

   ```bash
   pnpm add bcryptjs
   pnpm add -D @types/bcryptjs
   ```

2. Update `src/lib/auth/config.ts`:

   ```typescript
   import bcrypt from 'bcryptjs';
   import { UserModel } from '@/lib/db/models';
   import connectDB from '@/lib/db/mongoose';

   async authorize(credentials) {
     if (!credentials?.email || !credentials?.password) {
       return null;
     }

     await connectDB();

     // Lookup user in database
     const user = await UserModel.findOne({ email: credentials.email })
       .lean()
       .exec();

     if (!user) return null;

     // Compare hashed password
     const isValid = await bcrypt.compare(
       credentials.password,
       user.password
     );

     if (!isValid) return null;

     return {
       id: user._id.toString(),
       email: user.email,
       name: user.name,
       role: user.role || 'user',
     };
   }
   ```

3. Remove demo credentials (lines 33-45)

4. Create user registration endpoint:
   - File: `app/(app)/api/auth/register/route.ts`
   - Hash password with bcrypt before storing
   - Validate email format and password strength

5. Update documentation:
   - `.guided/product/api-and-db-runbook.md` - Mark TODO as resolved
   - `README.md` - Update auth instructions

**Files Modified:**

- `apps/web/src/lib/auth/config.ts`
- `apps/web/app/(app)/api/auth/register/route.ts` (NEW)
- `.guided/product/api-and-db-runbook.md`
- `README.md`

**Quality Gates:**

- ✅ Can register new user via `/api/auth/register`
- ✅ Can log in with real credentials (not demo)
- ✅ Passwords stored as bcrypt hashes in database
- ✅ `pnpm test` - All tests pass (may need to update auth tests)
- ✅ `pnpm type-check` - No type errors

**Risk:** ⚡ **Medium** - Affects authentication flow, requires careful testing

---

#### Task 1.3: Add Basic Security Headers

**Effort:** 1-2 hours

**Actions:**

1. Create `middleware.ts` at root of `apps/web/`:

   ```typescript
   import { NextResponse } from 'next/server';
   import type { NextRequest } from 'next/server';

   export function middleware(request: NextRequest) {
     const response = NextResponse.next();

     // Security headers
     response.headers.set('X-Frame-Options', 'DENY');
     response.headers.set('X-Content-Type-Options', 'nosniff');
     response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

     return response;
   }

   export const config = {
     matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
   };
   ```

2. Test headers are applied:
   ```bash
   curl -I http://localhost:3000
   ```

**Files Modified:**

- `apps/web/middleware.ts` (NEW)

**Quality Gates:**

- ✅ Security headers present in HTTP responses
- ✅ Application still functions normally

**Risk:** ⚡ **Low** - Non-breaking change

---

### Phase 1 Deliverables

- ✅ No duplicate test files
- ✅ No unused mock exports
- ✅ Real user authentication (bcrypt)
- ✅ User registration endpoint
- ✅ Basic security headers
- ✅ All quality gates pass

**Completion Criteria:**

- Demo credentials removed
- Production-ready authentication implemented
- All tests pass
- Documentation updated

---

## Phase 2: Type Safety & Architecture Fixes

**Duration:** Week 2 (Monday-Friday)  
**Effort:** 10-16 hours  
**Priority:** 🔴 **High** - Type safety and maintainability

### Scope

Fix Mongoose type definitions to eliminate all `as any` casts, improving type safety and maintainability.

### Tasks

#### Task 2.1: Define Proper Mongoose Types

**Effort:** 2-3 hours

**Actions:**

1. Update `src/domain/mongo-schemas.d.ts`:

   ```typescript
   import type { Model, Document, Types } from 'mongoose';

   // User
   export interface UserDocument extends Document {
     _id: Types.ObjectId;
     email: string;
     name: string;
     password: string;
     role?: string;
     createdAt: Date;
     updatedAt: Date;
   }
   export type UserModelType = Model<UserDocument>;

   // Item
   export interface ItemDocument extends Document {
     _id: Types.ObjectId;
     name: string;
     category: string;
     description: string;
     estimatedPrice: number;
     unit?: string;
     preferredSupplier?: string;
     status: string;
     createdByUserId?: Types.ObjectId;
     createdAt: Date;
     updatedAt: Date;
   }
   export type ItemModelType = Model<ItemDocument>;

   // Cart
   export interface CartDocument extends Document {
     _id: Types.ObjectId;
     userId: Types.ObjectId;
     items: Array<{
       itemId: Types.ObjectId;
       itemName: string;
       itemPrice: number;
       quantity: number;
       subtotal: number;
       addedAt: Date;
     }>;
     createdAt: Date;
     updatedAt: Date;
   }
   export type CartModelType = Model<CartDocument>;

   // PurchaseRequest
   export interface PurchaseRequestDocument extends Document {
     _id: Types.ObjectId;
     userId: Types.ObjectId;
     items: Array<{
       itemId: Types.ObjectId;
       itemName: string;
       unitPrice: number;
       quantity: number;
       subtotal: number;
     }>;
     totalAmount: number;
     justification: string;
     status: string;
     requestNumber: string;
     submittedAt: Date;
     createdAt: Date;
     updatedAt: Date;
   }
   export type PurchaseRequestModelType = Model<PurchaseRequestDocument>;

   // AgentConversation
   export interface AgentConversationDocument extends Document {
     _id: Types.ObjectId;
     userId: Types.ObjectId;
     messages: Array<{
       role: string;
       content: string;
       timestamp: Date;
       metadata?: any;
     }>;
     title?: string;
     lastMessagePreview?: string;
     createdAt: Date;
     updatedAt: Date;
   }
   export type AgentConversationModelType = Model<AgentConversationDocument>;
   ```

2. Update `src/lib/db/models.ts`:

   ```typescript
   import type {
     UserModelType,
     ItemModelType,
     CartModelType,
     PurchaseRequestModelType,
     AgentConversationModelType,
   } from '@/domain/mongo-schemas';

   export const UserModel = getOrCreateModel(
     USER_COLLECTION_NAME,
     UserSchema
   ) as UserModelType;

   export const ItemModel = getOrCreateModel(
     ITEM_COLLECTION_NAME,
     ItemSchema
   ) as ItemModelType;

   export const CartModel = getOrCreateModel(
     CART_COLLECTION_NAME,
     CartSchema
   ) as CartModelType;

   export const PurchaseRequestModel = getOrCreateModel(
     PURCHASE_REQUEST_COLLECTION_NAME,
     PurchaseRequestSchema
   ) as PurchaseRequestModelType;

   export const AgentConversationModel = getOrCreateModel(
     AGENT_CONVERSATION_COLLECTION_NAME,
     AgentConversationSchema
   ) as AgentConversationModelType;
   ```

**Files Modified:**

- `apps/web/src/domain/mongo-schemas.d.ts`
- `apps/web/src/lib/db/models.ts`

**Quality Gates:**

- ✅ `pnpm type-check` - No type errors
- ✅ Intellisense works for Mongoose methods

**Risk:** ⚡ **Low** - Type definitions only, no runtime changes

---

#### Task 2.2: Remove `as any` from Catalog Service

**Effort:** 1-2 hours

**Actions:**

1. Update `src/features/catalog/lib/catalog.service.ts`:
   - Replace `(ItemModel as any)` with `ItemModel`
   - Replace `let item: any` with `let item: ItemDocument | null`
   - Replace `const items: any[]` with `const items: ItemDocument[]`

2. Example change:

   ```typescript
   // Before:
   items = await (ItemModel as any)
     .find({ $text: { $search: q } })
     .sort({ score: { $meta: 'textScore' } })
     .limit(limit)
     .lean()
     .exec();

   // After:
   const items: ItemDocument[] = await ItemModel.find({ $text: { $search: q } })
     .sort({ score: { $meta: 'textScore' } })
     .limit(limit)
     .lean()
     .exec();
   ```

**Files Modified:**

- `apps/web/src/features/catalog/lib/catalog.service.ts`

**Quality Gates:**

- ✅ `pnpm type-check` - No type errors
- ✅ `pnpm test -- items.test.ts` - Catalog tests pass

---

#### Task 2.3: Remove `as any` from Cart Service

**Effort:** 1-2 hours

**Actions:**

1. Update `src/features/cart/lib/cart.service.ts`:
   - Replace `(CartModel as any)` with `CartModel`
   - Replace `(ItemModel as any)` with `ItemModel`
   - Replace `let cart: any` with `let cart: CartDocument | null`

**Files Modified:**

- `apps/web/src/features/cart/lib/cart.service.ts`

**Quality Gates:**

- ✅ `pnpm type-check` - No type errors
- ✅ `pnpm test -- cart-and-checkout.test.ts` - Cart tests pass

---

#### Task 2.4: Remove `as any` from Checkout Service

**Effort:** 1-2 hours

**Actions:**

1. Update `src/features/checkout/lib/checkout.service.ts`:
   - Replace `(CartModel as any)` with `CartModel`
   - Replace `(ItemModel as any)` with `ItemModel`
   - Replace `(PurchaseRequestModel as any)` with `PurchaseRequestModel`
   - Type all variables properly

**Files Modified:**

- `apps/web/src/features/checkout/lib/checkout.service.ts`

**Quality Gates:**

- ✅ `pnpm type-check` - No type errors
- ✅ `pnpm test -- cart-and-checkout.test.ts` - Checkout tests pass

---

#### Task 2.5: Remove `as any` from Agent Service

**Effort:** 2-3 hours

**Actions:**

1. Update `src/features/agent/lib/agent.service.ts`:
   - Replace `(AgentConversationModel as any)` with `AgentConversationModel`
   - Type all conversation variables

2. This is the largest service, so take extra care with typing

**Files Modified:**

- `apps/web/src/features/agent/lib/agent.service.ts`

**Quality Gates:**

- ✅ `pnpm type-check` - No type errors
- ✅ `pnpm test -- agent.test.ts` - Agent tests pass

---

#### Task 2.6: Refactor Agent Service (Split into Sub-Services)

**Effort:** 3-5 hours

**Actions:**

1. Create new service files:
   - `src/features/agent/lib/agent-conversation.service.ts` - Conversation CRUD
   - `src/features/agent/lib/agent-tools.service.ts` - Tool execution logic
   - `src/features/agent/lib/agent-llm.service.ts` - LangChain/AI calls

2. Extract functions from `agent.service.ts`:

   ```typescript
   // agent-conversation.service.ts
   export async function getOrCreateConversation(userId, conversationId?) { ... }
   export async function saveConversationMessage(conversationId, message) { ... }
   export async function listUserConversations(userId) { ... }

   // agent-tools.service.ts
   export async function executeToolCall(toolName, args) { ... }
   export async function searchCatalogTool(query) { ... }
   export async function addToCartTool(itemId, quantity) { ... }

   // agent-llm.service.ts
   export async function callLLMWithTools(messages, tools) { ... }
   export async function generateAgentResponse(conversation, userMessage) { ... }
   ```

3. Update `agent.service.ts` to orchestrate sub-services:

   ```typescript
   import * as conversationService from './agent-conversation.service';
   import * as toolService from './agent-tools.service';
   import * as llmService from './agent-llm.service';

   export async function handleAgentMessage(params) {
     const conversation = await conversationService.getOrCreateConversation(...);
     const llmResponse = await llmService.generateAgentResponse(...);
     const toolResults = await toolService.executeToolCall(...);
     await conversationService.saveConversationMessage(...);
     return formatResponse(...);
   }
   ```

4. Update exports in `src/features/agent/index.ts`

**Files Modified:**

- `apps/web/src/features/agent/lib/agent-conversation.service.ts` (NEW)
- `apps/web/src/features/agent/lib/agent-tools.service.ts` (NEW)
- `apps/web/src/features/agent/lib/agent-llm.service.ts` (NEW)
- `apps/web/src/features/agent/lib/agent.service.ts` (REFACTOR)
- `apps/web/src/features/agent/index.ts`

**Quality Gates:**

- ✅ `pnpm type-check` - No type errors
- ✅ `pnpm test -- agent.test.ts` - All agent tests pass
- ✅ Agent chat UI still works
- ✅ Each service file < 300 lines

**Risk:** ⚡ **Medium** - Large refactor, thorough testing required

---

### Phase 2 Deliverables

- ✅ Zero `as any` type casts in production code
- ✅ Proper Mongoose type definitions
- ✅ Agent service split into manageable modules
- ✅ All quality gates pass

**Completion Criteria:**

- `pnpm type-check` passes with no errors
- All tests pass
- Each service file < 400 lines
- Type safety improved throughout codebase

---

## Phase 3: Feature Completeness

**Duration:** Week 3 (Monday-Friday)  
**Effort:** 6-10 hours  
**Priority:** 🟡 **Medium** - Complete CRUD operations

### Scope

Add missing update endpoints and complete CRUD operations for all entities.

### Tasks

#### Task 3.1: Implement Catalog Item Update

**Effort:** 3-4 hours

**Actions:**

1. Add `updateItem()` service function in `catalog.service.ts`:

   ```typescript
   export async function updateItem(
     itemId: string,
     updates: Partial<CreateItemInput>
   ): Promise<Item> {
     await connectDB();

     // Validate input
     if (updates.estimatedPrice && updates.estimatedPrice <= 0) {
       throw new ValidationError('Price must be positive');
     }

     // Update item
     const item = await ItemModel.findByIdAndUpdate(
       itemId,
       { $set: updates },
       { new: true, runValidators: true }
     )
       .lean()
       .exec();

     if (!item) {
       throw new ValidationError('Item not found');
     }

     return mapToEntity(item);
   }
   ```

2. Create API route `app/(app)/api/items/[id]/route.ts`:

   ```typescript
   export async function PUT(
     request: NextRequest,
     { params }: { params: { id: string } }
   ) {
     const session = await getServerSession(authConfig);
     if (!session?.user) {
       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
     }

     const body = await request.json();
     const item = await catalogService.updateItem(params.id, body);

     return NextResponse.json({ item });
   }
   ```

3. Wire up UI components:
   - Update `item-mutate-drawer.tsx` (line 86) - Remove TODO
   - Update `item-mutate-dialog.tsx` (line 86) - Remove TODO

4. Add tests:
   - `tests/api/items.test.ts` - Add test for `PUT /api/items/[id]`

**Files Modified:**

- `apps/web/src/features/catalog/lib/catalog.service.ts`
- `apps/web/app/(app)/api/items/[id]/route.ts` (NEW)
- `apps/web/src/features/catalog/components/item-mutate-drawer.tsx`
- `apps/web/src/features/catalog/components/item-mutate-dialog.tsx`
- `apps/web/tests/api/items.test.ts`

**Quality Gates:**

- ✅ Can update item name, price, description via API
- ✅ UI components can edit items
- ✅ Tests cover update scenarios
- ✅ `pnpm test -- items.test.ts` passes

**Risk:** ⚡ **Low** - Straightforward CRUD operation

---

#### Task 3.2: Implement Cart Item Quantity Update

**Effort:** 1-2 hours

**Actions:**

1. Service function already exists: `updateCartItemQuantity()`

2. Create API route `app/(app)/api/cart/items/[itemId]/route.ts`:

   ```typescript
   export async function PATCH(
     request: NextRequest,
     { params }: { params: { itemId: string } }
   ) {
     const session = await getServerSession(authConfig);
     if (!session?.user) {
       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
     }

     const { quantity } = await request.json();
     const cart = await cartService.updateCartItemQuantity(
       session.user.id,
       params.itemId,
       quantity
     );

     return NextResponse.json({ cart });
   }
   ```

3. Add tests:
   - `tests/api/cart-and-checkout.test.ts` - Add test for `PATCH /api/cart/items/[itemId]`

**Files Modified:**

- `apps/web/app/(app)/api/cart/items/[itemId]/route.ts` (NEW)
- `apps/web/tests/api/cart-and-checkout.test.ts`

**Quality Gates:**

- ✅ Can update cart item quantity via API
- ✅ Tests pass
- ✅ UI can call new endpoint

**Risk:** ⚡ **Very Low** - Service already exists

---

#### Task 3.3: DRY Cart Service (Extract Helpers)

**Effort:** 2-3 hours

**Actions:**

1. Extract `getOrCreateCart()` helper:

   ```typescript
   async function getOrCreateCart(userId: string): Promise<CartDocument> {
     let cart = await CartModel.findOne({ userId }).exec();
     if (!cart) {
       cart = new CartModel({ userId, items: [] });
     }
     return cart;
   }
   ```

2. Refactor functions to use helper:
   - `addItemToCart()` - Use `getOrCreateCart()`
   - `updateCartItemQuantity()` - Use `getOrCreateCart()`
   - `removeFromCart()` - Use `getOrCreateCart()`

3. Remove duplicated boilerplate

**Files Modified:**

- `apps/web/src/features/cart/lib/cart.service.ts`

**Quality Gates:**

- ✅ `pnpm test -- cart-and-checkout.test.ts` - All cart tests pass
- ✅ Less code duplication
- ✅ Type safety maintained

**Risk:** ⚡ **Low** - Refactoring with existing test coverage

---

#### Task 3.4: Add Force-Create Override (Optional)

**Effort:** 1-2 hours (if time permits)

**Actions:**

1. Add `force` parameter to `createItem()` API:

   ```typescript
   export async function POST(request: NextRequest) {
     const { force, ...itemData } = await request.json();

     if (!force) {
       const duplicates = await catalogService.checkDuplicates(itemData);
       if (duplicates.length > 0) {
         return NextResponse.json(
           { error: 'Duplicates found', duplicates },
           { status: 409 }
         );
       }
     }

     const item = await catalogService.createItem(itemData);
     return NextResponse.json({ item }, { status: 201 });
   }
   ```

2. Update UI to show confirmation dialog on duplicates

3. Resolve TODOs in `item-mutate-drawer.tsx` and `item-mutate-dialog.tsx`

**Files Modified:**

- `apps/web/app/(app)/api/items/route.ts`
- `apps/web/src/features/catalog/components/item-mutate-drawer.tsx`
- `apps/web/src/features/catalog/components/item-mutate-dialog.tsx`

**Priority:** 🟢 **Low** - Optional UX improvement

---

### Phase 3 Deliverables

- ✅ Complete CRUD for catalog items (including update)
- ✅ Cart quantity update endpoint
- ✅ DRY cart service (no duplication)
- ✅ (Optional) Force-create override
- ✅ All quality gates pass

**Completion Criteria:**

- All CRUD operations available via API
- UI components can call update endpoints
- Tests cover new functionality

---

## Phase 4: Testing & Refinement

**Duration:** Week 4 (Monday-Wednesday)  
**Effort:** 5-10 hours  
**Priority:** 🟡 **Medium** - Polish and test coverage

### Scope

Improve test coverage and add missing quality-of-life improvements.

### Tasks

#### Task 4.1: Add Unit Tests for Services

**Effort:** 3-4 hours

**Actions:**

1. Create unit test files:
   - `tests/unit/catalog.service.test.ts`
   - `tests/unit/cart.service.test.ts`
   - `tests/unit/checkout.service.test.ts`

2. Use mocks for database calls:

   ```typescript
   import { vi } from 'vitest';
   import * as catalogService from '@/features/catalog';

   vi.mock('@/lib/db/models', () => ({
     ItemModel: {
       find: vi.fn(),
       create: vi.fn(),
       findById: vi.fn(),
     },
   }));
   ```

3. Test business logic in isolation

**Files Created:**

- `apps/web/tests/unit/catalog.service.test.ts` (NEW)
- `apps/web/tests/unit/cart.service.test.ts` (NEW)
- `apps/web/tests/unit/checkout.service.test.ts` (NEW)

**Quality Gates:**

- ✅ Unit test coverage > 70%
- ✅ Tests run faster (no DB required for unit tests)

**Risk:** ⚡ **Low** - Non-breaking additions

---

#### Task 4.2: Add Test Fixtures

**Effort:** 1-2 hours

**Actions:**

1. Create test fixture utilities:

   ```typescript
   // tests/fixtures/item.fixtures.ts
   export function createMockItem(overrides?: Partial<Item>): Item {
     return {
       id: 'mock-item-1',
       name: 'Test Item',
       category: 'Electronics',
       description: 'Test description',
       estimatedPrice: 100,
       status: ItemStatus.Active,
       createdAt: new Date(),
       updatedAt: new Date(),
       ...overrides,
     };
   }
   ```

2. Use fixtures in tests to reduce boilerplate

**Files Created:**

- `apps/web/tests/fixtures/item.fixtures.ts` (NEW)
- `apps/web/tests/fixtures/cart.fixtures.ts` (NEW)
- `apps/web/tests/fixtures/user.fixtures.ts` (NEW)

**Quality Gates:**

- ✅ Tests are more readable
- ✅ Less duplicate test data

**Risk:** ⚡ **Very Low** - Test-only changes

---

#### Task 4.3: Add Rate Limiting (Optional)

**Effort:** 2-3 hours

**Actions:**

1. Install rate limiting package:

   ```bash
   pnpm add express-rate-limit
   ```

2. Create rate limiting middleware:

   ```typescript
   // src/lib/rate-limit.ts
   import rateLimit from 'express-rate-limit';

   export const apiRateLimiter = rateLimit({
     windowMs: 15 * 60 * 1000, // 15 minutes
     max: 100, // Limit each IP to 100 requests per windowMs
     message: 'Too many requests from this IP',
   });
   ```

3. Apply to API routes in middleware

**Files Modified:**

- `apps/web/middleware.ts`
- `package.json` (add dependency)

**Priority:** 🟢 **Low** - Future security improvement

---

### Phase 4 Deliverables

- ✅ Improved test coverage (unit tests)
- ✅ Reusable test fixtures
- ✅ (Optional) Rate limiting
- ✅ All quality gates pass

**Completion Criteria:**

- Test coverage > 70%
- Tests run efficiently
- Production-ready codebase

---

## Quality Gates (All Phases)

All tasks must pass these gates before merging:

### 1. Type Check

```bash
pnpm type-check
```

**Requirement:** ✅ Zero TypeScript errors

---

### 2. Linting

```bash
pnpm lint
```

**Requirement:** ✅ No linting violations

---

### 3. Formatting

```bash
pnpm format
```

**Requirement:** ✅ Code properly formatted

---

### 4. Testing

```bash
pnpm test
```

**Requirement:** ✅ All tests pass

---

### 5. Build

```bash
pnpm build
```

**Requirement:** ✅ Production build succeeds

---

### 6. Manual Testing

**Requirement:** ✅ Key features verified manually:

- User can register and log in
- Catalog items can be created, read, updated, deleted
- Cart operations work (add, update, remove)
- Purchase requests can be submitted
- Agent chat functions properly

---

## Risk Management

### Risk Matrix

| Risk                                   | Likelihood | Impact    | Mitigation                                 |
| -------------------------------------- | ---------- | --------- | ------------------------------------------ |
| Breaking auth changes                  | 🟡 Medium  | 🔴 High   | Comprehensive auth testing                 |
| Type definition errors                 | 🟢 Low     | 🟡 Medium | Gradual rollout, extensive type-checking   |
| Agent service refactor breaks features | 🟡 Medium  | 🔴 High   | Keep existing tests, add integration tests |
| Missing edge cases                     | 🟡 Medium  | 🟡 Medium | Add unit tests, manual QA                  |

### Rollback Plan

If issues arise:

1. **Revert via git** - All work in feature branches
2. **Incremental merge** - Merge phase by phase, not all at once
3. **Feature flags** - Hide incomplete features behind flags (if needed)

---

## Success Metrics

### Code Quality Metrics

| Metric             | Before | After | Target  |
| ------------------ | ------ | ----- | ------- |
| `as any` count     | 30+    | 0     | ✅ 0    |
| TODO markers       | 6      | 0-1   | ✅ ≤1   |
| Duplicate code     | ~5%    | <1%   | ✅ <1%  |
| Test coverage      | 60%    | 75%+  | ✅ 75%  |
| TypeScript errors  | 0      | 0     | ✅ 0    |
| Largest file (LOC) | 1000+  | <400  | ✅ <400 |

### Business Metrics

| Metric                    | Status |
| ------------------------- | ------ |
| Production-ready auth     | ✅     |
| Complete CRUD operations  | ✅     |
| Type-safe codebase        | ✅     |
| Maintainable architecture | ✅     |
| Security best practices   | ✅     |

---

## Timeline Overview

```
Week 1: Phase 1 - Dead Code & Security
├── Mon: Task 1.1 (Dead code cleanup)
├── Tue-Wed: Task 1.2 (Real auth)
└── Thu: Task 1.3 (Security headers)

Week 2: Phase 2 - Type Safety
├── Mon: Task 2.1 (Mongoose types)
├── Tue: Tasks 2.2-2.4 (Remove `as any` from services)
└── Wed-Fri: Tasks 2.5-2.6 (Agent service refactor)

Week 3: Phase 3 - Feature Completeness
├── Mon-Tue: Task 3.1 (Catalog update)
├── Wed: Task 3.2 (Cart update endpoint)
└── Thu: Task 3.3 (DRY cart service)

Week 4: Phase 4 - Testing & Refinement
├── Mon-Tue: Task 4.1 (Unit tests)
├── Wed: Task 4.2 (Test fixtures)
└── Thu: Final QA & documentation
```

---

## Post-Completion Actions

After all phases complete:

1. **Update documentation:**
   - Mark all TODOs as resolved in `AGENTS.md`
   - Update `README.md` with new features
   - Document new API endpoints in OpenAPI spec

2. **Create deployment checklist:**
   - Verify environment variables
   - Test production build
   - Run security audit (`npm audit`)

3. **Archive assessment documents:**
   - Move to `.guided/archive/` for historical reference
   - Update `.guided/README.md` with completion status

4. **Celebrate!** 🎉
   - Production-ready codebase achieved
   - Technical debt eliminated
   - Type-safe and maintainable

---

## Conclusion

This plan addresses all identified code quality issues in a **systematic, low-risk manner**. By following the phased approach:

✅ **Critical issues** (auth, security) addressed first  
✅ **Type safety** improved across the entire codebase  
✅ **Features completed** with full CRUD operations  
✅ **Code maintainability** enhanced through refactoring  
✅ **Test coverage** increased for confidence

**Total Effort:** 29-48 hours over 3-4 weeks

**Expected Outcome:** Production-ready, type-safe, maintainable codebase with complete feature set.

---

## Related Documents

- [Code Quality Overview](../assessment/code-quality-overview.md)
- [Dead Code and Junk Report](../assessment/dead-code-and-junk-report.md)
- [TODO/FIXME/HACK Review](../assessment/comments-and-todos-review.md)
- [Patterns and Architecture Issues](../assessment/patterns-and-architecture-issues.md)
- [Code Quality Hotspots](../assessment/code-quality-hotspots.md)

---

_End of Plan_
