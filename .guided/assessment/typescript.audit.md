# TypeScript Audit (Type Safety, Strict Mode, Runtime Validation)

**Project**: ProcureFlow  
**TypeScript Version**: 5.9.3  
**Audit Date**: November 10, 2025

---

## Executive Summary

**Type Safety**: ❌ CRITICAL - Severely compromised  
**Strict Mode**: ❌ Disabled (`strict: false`)  
**any Usage**: 🔴 20+ instances (service layer)  
**Runtime Validation**: ✅ Good (Zod at API boundary)  
**Priority**: Immediate strict mode migration required

---

## 1. tsconfig.json Audit 🔴 CRITICAL

**File**: `packages/web/tsconfig.json`

```jsonc
{
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "es6"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": false,  // ❌ CRITICAL: All strictness disabled
    "noEmit": true,  // ✅ Correct for Next.js
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",  // ✅ Modern resolution
    "resolveJsonModule": true,
    "isolatedModules": true,  // ✅ Required for Next.js
    "jsx": "react-jsx",  // ✅ React 19 compatible
    "incremental": true,
    "target": "ES2017",  // ⚠️ Could be ES2020+
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@/app/*": ["./src/app/*"],
      "@/components/*": ["./src/components/*"],
      "@/lib/*": ["./src/lib/*"],
      "@/styles/*": ["./src/styles/*"]
    }
  },
  "include": [...],
  "exclude": ["node_modules"]
}
```

### strict: false Implications
When `strict: false`, TypeScript disables:
- `noImplicitAny` - Allows implicit `any` types
- `strictNullChecks` - Allows `null`/`undefined` without checks
- `strictFunctionTypes` - Allows unsafe function parameter types
- `strictBindCallApply` - Allows unsafe bind/call/apply
- `strictPropertyInitialization` - Allows uninitialized class properties
- `noImplicitThis` - Allows implicit `any` for `this`
- `alwaysStrict` - Doesn't emit `"use strict"` in JS

**Impact**: 💥 Complete loss of type safety

---

## 2. Explicit any Usage 🔴 CRITICAL

**Total Instances**: 20+ across service files

### Cart Service
**File**: `features/cart/lib/cart.service.ts`

```typescript
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapCartToDto(cart: any): Cart {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const items = cart.items.map((item: any) => ({
    itemId: item.itemId?.toString() || '',
    itemName: item.itemName || '',
    itemPrice: item.itemPrice || 0,
    quantity: item.quantity || 0,
    subtotal: item.subtotal || 0,
  }));
  // ...
}
```

**Pattern**: Mongoose document → DTO mapping with `any` escape hatch

**Occurrences**:
- `cart.service.ts`: 8 instances
- `checkout.service.ts`: 7 instances
- `agent.service.ts`: 5 instances

---

## 3. Mongoose Type Integration Issues

**Root Cause**: Mongoose documents not properly typed

**Current Pattern**:
```typescript
const cart = await CartModel.findOne({ userId }).exec();
// cart type is any (Mongoose Document with unknown structure)

function mapCartToDto(cart: any) {  // ❌ Give up on types
  // ...
}
```

**Recommended Pattern**:
```typescript
// lib/db/types/cart.types.ts
import type { Types, Document } from 'mongoose';

export interface CartItemDocument {
  itemId: Types.ObjectId;
  itemName: string;
  itemPrice: number;
  quantity: number;
  subtotal: number;
}

export interface CartDocument extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  items: CartItemDocument[];
  totalCost: number;
  createdAt: Date;
  updatedAt: Date;
}

// Usage
const cart = await CartModel.findOne({ userId })
  .lean<CartDocument>()
  .exec();

function mapCartToDto(cart: CartDocument): Cart {  // ✅ Type-safe
  return {
    id: cart._id.toString(),
    userId: cart.userId.toString(),
    items: cart.items.map(item => ({
      itemId: item.itemId.toString(),
      itemName: item.itemName,
      // ... all properties type-checked
    })),
    totalCost: cart.totalCost,
    createdAt: cart.createdAt,
    updatedAt: cart.updatedAt,
  };
}
```

---

## 4. Discriminated Unions (Missing)

**Pattern Not Used**: Type narrowing with discriminated unions

**Current Code**:
```typescript
// features/agent/lib/agent.service.ts
const role =
  msg.sender === 'agent'
    ? AgentMessageRole.Agent
    : msg.sender === 'user'
      ? AgentMessageRole.User
      : AgentMessageRole.System;  // ⚠️ No exhaustiveness check
```

**Recommended Pattern**:
```typescript
// Define discriminated union
type MessageSender = 
  | { type: 'agent'; agentId: string }
  | { type: 'user'; userId: string }
  | { type: 'system'; systemId: string };

// Use with exhaustive switch
function getSenderRole(sender: MessageSender): AgentMessageRole {
  switch (sender.type) {
    case 'agent':
      return AgentMessageRole.Agent;
    case 'user':
      return AgentMessageRole.User;
    case 'system':
      return AgentMessageRole.System;
    default:
      const _exhaustive: never = sender;  // ✅ Type error if case missing
      throw new Error(`Unhandled sender type: ${_exhaustive}`);
  }
}
```

---

## 5. Runtime Validation Alignment ✅ GOOD

**Pattern**: Zod schemas at API boundary

**Example**:
```typescript
// lib/validation/schemas.ts
export const createItemSchema = z.object({
  name: z.string().min(2).max(200),
  category: z.string().min(2).max(100),
  description: z.string().min(10).max(2000),
  estimatedPrice: z.number().positive(),
  unit: z.string().max(50).optional(),
  preferredSupplier: z.string().max(200).optional(),
});

export type CreateItemInput = z.infer<typeof createItemSchema>;

// Usage in route handler
const body = await request.json();
const result = createItemSchema.safeParse(body);  // ✅ Runtime validation

if (!result.success) {
  return NextResponse.json({ error: result.error }, { status: 400 });
}

const item = await createItem(result.data);  // ✅ Type-safe
```

**Assessment**: Excellent alignment between Zod schemas and domain types

---

## 6. Type vs Interface Usage

**Pattern**: Mixed usage (no clear convention)

**Observation**:
- `domain/entities.ts`: Uses `interface` for domain models
- Zod schemas: Uses `type` with `z.infer`

**Recommendation**: Choose consistent pattern

**Guideline**:
- Use `interface` for object shapes that may be extended
- Use `type` for unions, intersections, utility types

```typescript
// Domain entities (extendable)
export interface Item {
  id: string;
  name: string;
  // ...
}

// DTOs (fixed structure)
export type CreateItemInput = z.infer<typeof createItemSchema>;

// Union types
export type PurchaseRequestStatus = 'submitted' | 'approved' | 'rejected';
```

---

## 7. unknown vs any

**Current**: Excessive `any` usage

**Recommendation**: Use `unknown` for values of unknown type

```typescript
// ❌ Bad
function handleError(error: any) {
  console.error(error.message);  // No type safety
}

// ✅ Good
function handleError(error: unknown) {
  if (error instanceof Error) {
    console.error(error.message);  // Type-safe after narrowing
  } else {
    console.error(String(error));
  }
}
```

---

## 8. Branded Types (Missing)

**Use Case**: Prevent mixing similar primitive types

**Example**:
```typescript
// Without branded types
type UserId = string;
type ItemId = string;

function getUserCart(userId: UserId) { /* ... */ }

const itemId: ItemId = '123';
getUserCart(itemId);  // ❌ Bug: passing item ID as user ID (no type error)

// With branded types
type UserId = string & { readonly __brand: 'UserId' };
type ItemId = string & { readonly __brand: 'ItemId' };

function createUserId(id: string): UserId {
  return id as UserId;
}

function getUserCart(userId: UserId) { /* ... */ }

const itemId: ItemId = createItemId('123');
getUserCart(itemId);  // ✅ Type error: ItemId not assignable to UserId
```

**Recommendation**: Use for critical domain IDs (userId, itemId, conversationId)

---

## 9. Strict Mode Migration Plan

### Phase 1: Enable noImplicitAny (Week 1)
```jsonc
{
  "compilerOptions": {
    "strict": false,  // Still false
    "noImplicitAny": true  // ✅ Add explicitly
  }
}
```

**Expected Errors**: 50-100 (mostly in services)  
**Fix Pattern**: Add explicit types to mappers

---

### Phase 2: Enable strictNullChecks (Week 2-3)
```jsonc
{
  "compilerOptions": {
    "noImplicitAny": true,
    "strictNullChecks": true  // ✅ Add
  }
}
```

**Expected Errors**: 100-200 (optional chaining needed)  
**Fix Pattern**: Add `?` operators, null checks

---

### Phase 3: Enable Full Strict Mode (Week 4)
```jsonc
{
  "compilerOptions": {
    "strict": true  // ✅ Enable all checks
  }
}
```

**Expected Errors**: 50-100 (remaining edge cases)  
**Fix Pattern**: Fix class properties, function types

---

## 10. Generic Type Safety

**Current**: No unsafe generics detected

**Observation**: Services use concrete types (good)

**Recommendation**: Keep as-is, avoid over-abstraction

---

## Summary & Recommendations

### Critical (Week 1)
1. ❌ **Enable `noImplicitAny`** in tsconfig
2. ❌ **Create typed Mongoose document interfaces**
3. ❌ **Replace all `any` with proper types** in service layer
4. ❌ **Remove `ignoreBuildErrors`** from next.config

### High Priority (Month 1)
5. ✅ **Enable `strictNullChecks`** after fixing implicit any
6. ✅ **Add discriminated unions** for enums
7. ✅ **Use `unknown` instead of `any`** in error handlers
8. ✅ **Add branded types** for domain IDs

### Medium Priority (Quarter 1)
9. ✅ **Enable full strict mode**
10. ✅ **Increase target to ES2020+**
11. ✅ **Add exhaustiveness checks** with `never`

---

## Metrics & Goals

### Current State
- Strict mode: ❌ Disabled
- any usage: 20+ instances
- Type coverage: ~40% (estimate)
- tsc errors: Unknown (compiler OOM)

### Target State (8 weeks)
- Strict mode: ✅ Enabled
- any usage: 0 instances
- Type coverage: 95%+
- tsc errors: 0 (builds successfully)

---

**Next**: `api-rest.audit.md`, `refactor.plan.md`, `ADR-001-code-structure-simplification.md`
