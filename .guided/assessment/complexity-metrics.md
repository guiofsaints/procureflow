# Complexity Metrics & Hotspot Analysis

**Project**: ProcureFlow  
**Audit Date**: November 10, 2025  
**Analysis Method**: Static analysis + manual review (tsc OOM prevented automated metrics)

---

## Executive Summary

**Complexity Risk**: MEDIUM-HIGH  
**Primary Hotspot**: `agent.service.ts` (1,503 LOC, est. cyclomatic complexity 80+)  
**Files >500 LOC**: 6 files requiring immediate attention  
**Recommended Action**: Split large files, extract helper functions, reduce nesting depth

---

## File Size Metrics (Top 15 by LOC)

| Rank | File                           | LOC   | Type           | Complexity Est.   | Priority    |
| ---- | ------------------------------ | ----- | -------------- | ----------------- | ----------- |
| 1    | `agent.service.ts`             | 1,503 | Service        | Very High (80+)   | 🔴 Critical |
| 2    | `sidebar.tsx`                  | 726   | UI Component   | Medium (template) | 🟢 Low      |
| 3    | `openapi.ts`                   | 683   | API Schema     | Low (declarative) | 🟢 Low      |
| 4    | `agent-orchestrator.ts`        | 584   | Service        | High (40+)        | 🟠 High     |
| 5    | `entities.ts`                  | 541   | Types          | Low (definitions) | 🟢 Low      |
| 6    | `langchainClient.ts`           | 535   | AI Integration | Medium (25+)      | 🟡 Medium   |
| 7    | `agent-conversation.schema.ts` | 531   | Schema         | Low (declarative) | 🟢 Low      |
| 8    | `providerAdapter.ts`           | 515   | Adapter        | Medium (20+)      | 🟡 Medium   |
| 9    | `purchase-request.schema.ts`   | 494   | Schema         | Low (declarative) | 🟢 Low      |
| 10   | `cart.service.ts`              | 492   | Service        | Medium (30+)      | 🟡 Medium   |

**Target**: All files <500 LOC (current: 6 violations)

---

## Cyclomatic Complexity Hotspots (Estimated)

### 1. agent.service.ts - handleAgentMessage()

- **Estimated CC**: 25-30
- **LOC**: ~250 lines
- **Branches**: 15+ conditionals (tool selection, error handling, conversation creation)
- **Nesting Depth**: 4 levels (try-catch → if → switch → nested if)

**Excerpt**:

```typescript
export async function handleAgentMessage(params: HandleAgentMessageParams) {
  // Validation (3 branches)
  if (!params.message?.trim()) throw ValidationError
  if (params.message.length > MAX_MESSAGE_LENGTH) throw ValidationError
  if (!params.userId && !params.conversationId) throw ValidationError

  // Conversation lookup/creation (5 branches)
  if (params.conversationId) {
    conversation = await findById(...)
    if (!conversation) throw Error
    if (conversation.userId !== userId) throw Error
  } else {
    conversation = new Conversation(...)
  }

  // Tool execution loop (8+ branches)
  for (const toolCall of toolCalls) {
    switch (toolCall.name) {
      case 'search_catalog': // nested logic
      case 'add_to_cart': // nested logic
      case 'checkout': // nested logic
      // ...12 more cases
    }
  }

  // Error handling (3 branches)
  if (error instanceof ValidationError) ...
  else if (error instanceof SomeOtherError) ...
  else ...
}
```

**Recommendation**: Extract tool execution to separate orchestrator (already exists but not fully utilized).

---

### 2. agent-orchestrator.ts - orchestrateAgentTurn()

- **Estimated CC**: 18-20
- **LOC**: ~200 lines
- **Branches**: 10+ (tool validation, retry logic, error boundaries)

**Recommendation**: Extract retry logic to separate utility, use strategy pattern for tool handlers.

---

### 3. cart.service.ts - addItemToCart()

- **Estimated CC**: 12-15
- **LOC**: ~80 lines
- **Branches**: Validation (3) + cart lookup (2) + item exists check (2) + quantity limits (3)

**Recommendation**: Extract validation to separate function, use early returns.

---

## Function Length Analysis

| Function                 | File                   | LOC  | Parameters         | Return Complexity |
| ------------------------ | ---------------------- | ---- | ------------------ | ----------------- |
| `handleAgentMessage()`   | agent.service.ts       | ~250 | 1 object (3 props) | Complex object    |
| `orchestrateAgentTurn()` | agent-orchestrator.ts  | ~200 | 5+ params          | Complex object    |
| `executeTool()`          | agent-tool-executor.ts | ~150 | 2 params           | Promise<any>      |
| `checkout()`             | checkout.service.ts    | ~100 | 2 params           | PurchaseRequest   |
| `addItemToCart()`        | cart.service.ts        | ~80  | 2 params           | Cart              |

**Target**: All functions <50 LOC (current: 5 violations)

---

## Module Dependency Analysis (Estimated)

### High Fan-Out (Imports Many Modules)

1. `agent.service.ts`: Imports from cart, catalog, checkout, auth, logger, metrics, LangChain
2. `app/(app)/layout.tsx`: Imports multiple contexts, components, providers
3. `openapi.ts`: Imports from all feature domains

**Risk**: Changes in dependencies cascade to these modules.

### High Fan-In (Imported By Many)

1. `domain/entities.ts`: Imported by all services and components
2. `lib/db/models.ts`: Imported by all services
3. `lib/utils/index.ts`: Imported by all components

**Risk**: Changes here affect entire codebase.

---

## Nesting Depth Hotspots

| File               | Max Depth | Location            | Pattern                                  |
| ------------------ | --------- | ------------------- | ---------------------------------------- |
| `agent.service.ts` | 5 levels  | Tool execution loop | try → if → switch → if → nested if       |
| `cart.service.ts`  | 4 levels  | Add item logic      | try → if → if → ternary                  |
| `Aurora.tsx`       | 4 levels  | Animation loop      | useEffect → function → if → nested loops |

**Target**: Max 3 levels (current: 3 violations)

**Recommendation**: Use early returns, extract nested logic to helper functions.

---

## Maintainability Index (Estimated)

Formula: `MI = 171 - 5.2 * ln(HalsteadVolume) - 0.23 * CyclomaticComplexity - 16.2 * ln(LOC)`

| File                  | MI (est.) | Rating    | Recommendation          |
| --------------------- | --------- | --------- | ----------------------- |
| agent.service.ts      | 45        | ⚠️ Low    | Split into 4+ modules   |
| agent-orchestrator.ts | 55        | ⚠️ Low    | Extract retry logic     |
| cart.service.ts       | 68        | 🟡 Medium | Extract validators      |
| catalog.service.ts    | 70        | ✅ Good   | Keep as-is              |
| openapi.ts            | 85        | ✅ Good   | Declarative, acceptable |

**Scale**: <50 = Low (refactor needed), 50-75 = Medium, 75+ = Good

---

## Refactoring Recommendations

### Priority 1: Split agent.service.ts

```
Current: agent.service.ts (1,503 LOC)

Proposed Structure:
├── agent.service.ts (300 LOC) - Public API
├── agent-tools.ts (400 LOC) - Tool definitions
├── agent-executor.ts (200 LOC) - Tool execution (already exists, enhance)
├── agent-mappers.ts (150 LOC) - DTO mappers
├── conversation-manager.ts (300 LOC) - Already exists
└── conversation-title.ts (100 LOC) - AI title generation
```

### Priority 2: Extract cart.service validators

```typescript
// cart.validation.ts (new file)
export function validateQuantity(qty: number): void {
  if (
    !Number.isInteger(qty) ||
    qty < MIN_ITEM_QUANTITY ||
    qty > MAX_ITEM_QUANTITY
  ) {
    throw new ValidationError(
      `Quantity must be between ${MIN_ITEM_QUANTITY} and ${MAX_ITEM_QUANTITY}`
    );
  }
}

export function validateCartLimit(
  cart: CartDocument,
  addingNew: boolean
): void {
  if (addingNew && cart.items.length >= MAX_CART_ITEMS) {
    throw new CartLimitError(
      `Cart cannot contain more than ${MAX_CART_ITEMS} different items`
    );
  }
}
```

### Priority 3: Reduce nesting in agent tool execution

```typescript
// Before (5 levels)
try {
  if (toolCalls.length > 0) {
    for (const tool of toolCalls) {
      switch (tool.name) {
        case 'search':
          if (params.valid) {
            // nested logic
          }
      }
    }
  }
} catch (e) {}

// After (3 levels)
if (!toolCalls.length) return defaultResponse;

const results = await Promise.all(
  toolCalls.map((tool) => executeSingleTool(tool))
);

return aggregateResults(results);
```

---

## Metrics & Goals

### Current State

- Files >500 LOC: 6
- Functions >50 LOC: 5
- Max nesting depth: 5 levels
- Avg cyclomatic complexity: ~15 (high)

### Target State (8 weeks)

- Files >500 LOC: 0 (split large files)
- Functions >50 LOC: 0 (extract helpers)
- Max nesting depth: 3 levels (use early returns)
- Avg cyclomatic complexity: <10 (medium)

---

**Next**: `dead-unused.code.md`, `react.audit.md`, `typescript.audit.md`, `nextjs.audit.md`, `api-rest.audit.md`
