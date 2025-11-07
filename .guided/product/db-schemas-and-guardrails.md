# MongoDB Schemas and Guardrails

**Version**: 1.0.0  
**Last Updated**: November 7, 2025  
**Status**: Active  
**Related Documents**:
- PRD: `.guided/product/PRD.md`
- Domain Model: `.guided/product/domain-and-data-dictionary.md`
- Domain Types: `apps/web/src/domain/entities.ts`
- Mongoose Document Types: `apps/web/src/domain/mongo-schemas.d.ts`

---

## 1. Overview

The ProcureFlow MongoDB persistence layer uses Mongoose schemas with comprehensive validations and guardrails to ensure data integrity and consistency. This document describes the schema isolation strategy, entity schemas, validation rules, and MVP vs Future scope.

### Design Goals

- **Isolation**: Schemas are completely isolated from React/Next.js components, business logic, and AI/LangChain code
- **Validation**: Strong type checking and data validation at the database level
- **Guardrails**: Built-in constraints to prevent invalid data and abuse
- **Extensibility**: Clear MVP vs Future separation for iterative development
- **Performance**: Proper indexing for search, filtering, and relationship queries

---

## 2. Schema Isolation and Folder Structure

### Folder Organization

```
apps/web/src/lib/db/
├── mongoose.ts                     # Connection helper (from bootstrap)
├── models.ts                       # Central model exports
└── schemas/                        # Schema definitions
    ├── user.schema.ts
    ├── item.schema.ts
    ├── cart.schema.ts
    ├── purchase-request.schema.ts
    └── agent-conversation.schema.ts
```

### Isolation Principles

**Schemas Must:**
- ✅ Only import from `mongoose` and local schema files
- ✅ Be TypeScript files with proper type definitions
- ✅ Export schemas, constants, and enums

**Schemas Must NOT:**
- ❌ Import React, Next.js, or any UI components
- ❌ Import LangChain or AI libraries
- ❌ Contain business logic or orchestration code
- ❌ Make API calls or external service connections

### Model Creation Pattern

To avoid model redefinition issues in Next.js development (hot reload), all models use the pattern:

```typescript
export const ModelName =
  mongoose.models[COLLECTION_NAME] ||
  mongoose.model(COLLECTION_NAME, Schema);
```

This ensures models are reused if they already exist in `mongoose.models`.

---

## 3. Entity Schemas Summary

### 3.1 User Schema

**File**: `apps/web/src/lib/db/schemas/user.schema.ts`  
**Collection**: `users`  
**Purpose**: Authenticated users who create carts, submit purchase requests, and interact with AI agent

#### Key Fields
| Field | Type | Required | Validation |
|-------|------|----------|------------|
| email | String | Yes | Unique, lowercase, trimmed, email format, max 255 chars |
| name | String | Yes | Trimmed, min 1 char, max 200 chars |
| passwordHash | String | Yes | Not included in queries by default (select: false) |
| provider | String | No | [Future] OAuth provider, max 50 chars |
| providerId | String | No | [Future] OAuth provider ID, max 255 chars |
| role | String enum | Yes | 'requester', 'buyer' [Future], 'admin' [Future], default: 'requester' |

#### Indexes
- `email` (unique)
- `role`

#### Guardrails
- Email format validation via regex: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
- Password hash never exposed in JSON output (via toJSON transform)
- Email automatically lowercased in pre-save hook

---

### 3.2 Item (CatalogItem) Schema

**File**: `apps/web/src/lib/db/schemas/item.schema.ts`  
**Collection**: `items`  
**Purpose**: Materials and services in the procurement catalog

#### Key Fields
| Field | Type | Required | Validation |
|-------|------|----------|------------|
| name | String | Yes | Trimmed, min 2 chars, max 200 chars |
| category | String | Yes | Trimmed, min 2 chars, max 100 chars |
| description | String | Yes | Trimmed, min 10 chars, max 2000 chars |
| estimatedPrice | Number | Yes | Min 0.01, max 1,000,000, max 2 decimal places |
| unit | String | No | [Future] Default: 'each', max 50 chars |
| status | String enum | Yes | 'active', 'archived', 'pending_review' [Future], default: 'active' |
| preferredSupplier | String | No | [Future] Max 200 chars |
| createdByUserId | ObjectId | No | Reference to User collection |

#### Indexes
- `name + category` (compound, for duplicate detection)
- `name, description` (text index for full-text search)
- `category`
- `status`
- `createdByUserId`

#### Guardrails
- **BR-1.5**: Price must be positive (> 0)
- **BR-1.3**: Compound index on name + category enables duplicate detection
- Strings auto-trimmed in pre-save hook
- Virtual property `isUserRegistered` to check if item was user-created

#### Instance Methods
- `isAvailable()`: Check if item is active
- `archive()`: Soft delete (set status to 'archived')

#### Static Methods
- `findActive()`: Find only active items
- `searchByKeyword(keyword)`: Full-text search
- `findPotentialDuplicates(name, category, excludeId?)`: Find similar items (BR-1.3)

---

### 3.3 Cart Schema

**File**: `apps/web/src/lib/db/schemas/cart.schema.ts`  
**Collection**: `carts`  
**Purpose**: User's shopping cart with line items

#### Key Fields
| Field | Type | Required | Validation |
|-------|------|----------|------------|
| userId | ObjectId | Yes | Reference to User collection |
| items | Array (CartItem[]) | Yes | Embedded sub-documents, max 50 items |
| isDraft | Boolean | No | [Future] Default: false |

#### CartItem Sub-document Fields
| Field | Type | Required | Validation |
|-------|------|----------|------------|
| itemId | ObjectId | Yes | Reference to Item collection |
| name | String | Yes | Snapshot, max 200 chars |
| unitPrice | Number | Yes | Snapshot, min 0.01 |
| quantity | Number | Yes | Min 1, max 999, must be integer |
| addedAt | Date | Yes | Auto-generated |

#### Indexes
- `userId` (unique - each user has one active cart)
- `updatedAt` (for stale cart cleanup)

#### Guardrails
- **BR-2.2**: Quantity per item: min 1, max 999
- **BR-2.3**: Cart associated with authenticated user
- **BR-2.1**: Cart can be empty, but checkout requires at least 1 item (enforced at app level)
- Max 50 items per cart to prevent abuse
- Snapshot pattern: name and price captured at add-to-cart time

#### Virtual Properties
- `totalCost`: Sum of all item subtotals
- `itemCount`: Number of items in cart
- `totalQuantity`: Sum of all item quantities

#### Instance Methods
- `isEmpty()`: Check if cart has no items
- `canCheckout()`: Check if cart has at least 1 item (BR-2.1)
- `addItem(itemId, name, unitPrice, quantity)`: Add or update item
- `updateItemQuantity(itemId, quantity)`: Update quantity with bounds checking
- `removeItem(itemId)`: Remove item from cart
- `clear()`: Clear all items (BR-2.7: cleared after checkout)

#### Static Methods
- `findByUserId(userId)`: Find cart for specific user
- `findOrCreateForUser(userId)`: Find or create cart for user

---

### 3.4 PurchaseRequest Schema

**File**: `apps/web/src/lib/db/schemas/purchase-request.schema.ts`  
**Collection**: `purchase_requests`  
**Purpose**: Simulated ERP submissions (logged to MongoDB in tech case)

#### Key Fields
| Field | Type | Required | Validation |
|-------|------|----------|------------|
| requestNumber | String | Yes | Unique, uppercase, format: "PR-YYYY-####", max 50 chars |
| userId | ObjectId | No | Reference to User collection (optional for test scenarios) |
| items | Array (PurchaseRequestItem[]) | Yes | Embedded sub-documents, min 1, max 100 items |
| total | Number | Yes | Min 0, validated against sum of item subtotals |
| notes | String | No | Trimmed, max 2000 chars |
| source | String enum | Yes | 'ui' or 'agent' |
| status | String enum | Yes | 'submitted' [MVP], 'pending_approval', 'approved', 'rejected' [Future], default: 'submitted' |
| deliveryLocation | String | No | [Future] Max 500 chars |
| requestedDeliveryDate | Date | No | [Future] |

#### PurchaseRequestItem Sub-document Fields
| Field | Type | Required | Validation |
|-------|------|----------|------------|
| itemId | ObjectId | No | Reference to Item (can be null for deleted items) |
| name | String | Yes | Snapshot, max 200 chars |
| category | String | Yes | Snapshot, max 100 chars |
| description | String | Yes | Snapshot, max 2000 chars |
| unitPrice | Number | Yes | Snapshot, min 0.01 |
| quantity | Number | Yes | Min 1, must be integer |
| subtotal | Number | Yes | Min 0, validated/auto-corrected to unitPrice * quantity |

#### Indexes
- `requestNumber` (unique)
- `userId`
- `createdAt` (descending)
- `userId + createdAt` (compound, for user's recent requests)
- `status`

#### Guardrails
- **BR-4.1**: Purchase request must have at least 1 item
- **BR-4.2**: Unique request number auto-generated (format: PR-2025-0001)
- **BR-4.3**: Request recorded with timestamp, user ID, items, total cost
- Request number auto-generated if not provided (pre-save hook)
- Total auto-recomputed from item subtotals (pre-save hook, allows 0.01 variance for floating point)
- Item subtotals auto-corrected to match unitPrice * quantity (pre-save hook)
- Immutable snapshot pattern: all item fields preserved even if catalog changes

#### Static Methods
- `generateRequestNumber()`: Generate next sequential request number for current year
- `findByUserId(userId)`: Find purchase requests for specific user

---

### 3.5 AgentConversation Schema

**File**: `apps/web/src/lib/db/schemas/agent-conversation.schema.ts`  
**Collection**: `agent_conversations`  
**Purpose**: Conversational sessions between user and AI agent

#### Key Fields
| Field | Type | Required | Validation |
|-------|------|----------|------------|
| userId | ObjectId | No | Reference to User collection (optional for test scenarios) |
| messages | Array (AgentMessage[]) | Yes | Embedded sub-documents, max 500 messages |
| status | String enum | Yes | 'in_progress', 'completed', 'aborted', default: 'in_progress' |
| summary | String | No | [Future] AI-generated summary, max 1000 chars |
| actions | Array | Yes | [MVP] Basic action logging, [Future] move to separate collection |

#### AgentMessage Sub-document Fields
| Field | Type | Required | Validation |
|-------|------|----------|------------|
| sender | String enum | Yes | 'user', 'agent', 'system' |
| content | String | Yes | Trimmed, max 10,000 chars |
| createdAt | Date | Yes | Auto-generated |
| metadata | Mixed | No | [Future] Structured data for tool calls |

#### Indexes
- `userId`
- `status`
- `createdAt` (descending)
- `userId + status` (compound, for active user conversations)

#### Guardrails
- **BR-3.5**: Agent logs conversation and actions for debugging
- Max 500 messages per conversation to prevent unbounded growth
- Max 10,000 chars per message to prevent abuse
- Messages auto-trimmed in pre-save hook
- Messages are immutable once added (append-only)

#### Virtual Properties
- `messageCount`: Number of messages in conversation
- `isActive`: Whether conversation status is 'in_progress'
- `lastMessage`: Most recent message in conversation

#### Instance Methods
- `addMessage(sender, content)`: Add message with validation
- `addUserMessage(content)`: Add user message
- `addAgentMessage(content)`: Add agent message
- `addSystemMessage(content)`: Add system message
- `complete()`: Mark conversation as completed
- `abort()`: Mark conversation as aborted
- `logAction(actionType, parameters, result?, error?)`: Log agent action

#### Static Methods
- `findByUserId(userId)`: Find conversations for specific user
- `findActiveByUserId(userId)`: Find active conversations for specific user
- `findOrCreateActiveForUser(userId)`: Find or create active conversation for user

---

## 4. Validations and Guardrails

### 4.1 Required Fields

All schemas enforce required fields at the database level:

| Schema | Required Fields |
|--------|----------------|
| User | email, name, passwordHash, role |
| Item | name, category, description, estimatedPrice, status |
| Cart | userId, items |
| PurchaseRequest | requestNumber, items, total, source, status |
| AgentConversation | messages, status |

### 4.2 Numeric Bounds

| Field | Min | Max | Notes |
|-------|-----|-----|-------|
| Item.estimatedPrice | 0.01 | 1,000,000 | 2 decimal places max |
| CartItem.quantity | 1 | 999 | Integer only (BR-2.2) |
| Cart.items.length | 0 | 50 | Max items to prevent abuse |
| PurchaseRequestItem.quantity | 1 | - | Integer only, no upper bound |
| PurchaseRequest.items.length | 1 | 100 | Min 1 for BR-4.1 |
| AgentConversation.messages.length | 0 | 500 | Prevent unbounded growth |

### 4.3 String Length Limits

| Field | Max Length | Notes |
|-------|-----------|-------|
| User.email | 255 | With email format validation |
| User.name | 200 | Min 1 char |
| Item.name | 200 | Min 2 chars |
| Item.category | 100 | Min 2 chars |
| Item.description | 2000 | Min 10 chars |
| PurchaseRequest.notes | 2000 | Optional |
| AgentMessage.content | 10,000 | To prevent abuse |

### 4.4 Enums

All enum fields use strict validation:

| Schema | Field | Values |
|--------|-------|--------|
| User | role | 'requester', 'buyer' [Future], 'admin' [Future] |
| Item | status | 'active', 'archived', 'pending_review' [Future] |
| PurchaseRequest | source | 'ui', 'agent' |
| PurchaseRequest | status | 'submitted', 'pending_approval' [Future], 'approved' [Future], 'rejected' [Future] |
| AgentMessage | sender | 'user', 'agent', 'system' |
| AgentConversation | status | 'in_progress', 'completed', 'aborted' |

### 4.5 Indexes

All schemas include indexes for performance:

**Unique Indexes** (prevent duplicates):
- User.email
- PurchaseRequest.requestNumber
- Cart.userId

**Search/Filter Indexes**:
- Item: text index on name + description
- Item: compound index on name + category (for duplicate detection)
- All: indexes on status fields for filtering

**Relationship Indexes**:
- Foreign key references (userId, itemId, etc.)
- Compound indexes for common query patterns

### 4.6 Pre-save Hooks

Schemas use pre-save hooks for:

1. **Auto-normalization**:
   - Email lowercasing (User)
   - String trimming (all schemas)

2. **Auto-generation**:
   - Request number generation (PurchaseRequest)

3. **Validation**:
   - Price positivity check (Item)
   - Total recomputation (PurchaseRequest)
   - Subtotal validation (PurchaseRequest)
   - Item count validation (Cart, PurchaseRequest, AgentConversation)

4. **Data integrity**:
   - Message count limits (AgentConversation)
   - Cart item limits (Cart)

---

## 5. MVP vs Future Fields

### 5.1 MVP Fields (Implemented Now)

**User**:
- ✅ email, name, passwordHash (Credentials auth)
- ✅ role (defaults to 'requester')

**Item**:
- ✅ name, category, description, estimatedPrice
- ✅ status (defaults to 'active')
- ✅ createdByUserId (user registration tracking)

**Cart**:
- ✅ userId, items (with snapshot pattern)
- ✅ All cart operations (add, update, remove, clear)

**PurchaseRequest**:
- ✅ requestNumber (auto-generated)
- ✅ userId, items (with immutable snapshots), total
- ✅ notes, source, status (defaults to 'submitted')

**AgentConversation**:
- ✅ userId, messages, status
- ✅ Basic action logging in actions array

### 5.2 Future Fields (Prepared but Not Required)

**User**:
- 🔮 provider, providerId (OAuth integration)
- 🔮 role: 'buyer', 'admin' (RBAC)

**Item**:
- 🔮 unit (unit of measure)
- 🔮 preferredSupplier (supplier management)
- 🔮 status: 'pending_review' (approval workflow)

**Cart**:
- 🔮 isDraft (save cart without checkout)
- 🔮 Session-based carts for unauthenticated users

**PurchaseRequest**:
- 🔮 status: 'pending_approval', 'approved', 'rejected' (approval workflow)
- 🔮 deliveryLocation, requestedDeliveryDate (logistics)

**AgentConversation**:
- 🔮 summary (AI-generated conversation summary)
- 🔮 AgentActionLog separate collection (detailed analytics)
- 🔮 metadata in messages (structured tool call data)

### 5.3 Future Entities (Not Implemented)

**Category** (separate collection):
- Hierarchical category structure
- Replace string-based categories in Item

**AgentActionLog** (separate collection):
- Detailed action logging for analytics
- Move from embedded actions array in AgentConversation

---

## 6. Common Patterns

### 6.1 Snapshot Pattern

Used in CartItem and PurchaseRequestItem to preserve point-in-time data:

```typescript
// When adding item to cart
CartItem {
  itemId: item._id,          // Reference
  name: item.name,           // Snapshot
  unitPrice: item.price,     // Snapshot
  quantity: requestedQty,
}
```

**Benefits**:
- Cart/request remains valid even if item is updated or deleted
- Historical accuracy for auditing
- No broken references

### 6.2 Embedded Sub-documents

Used for:
- CartItem in Cart
- PurchaseRequestItem in PurchaseRequest
- AgentMessage in AgentConversation

**Benefits**:
- Atomic operations (update parent and children together)
- Simpler queries (no joins needed)
- Co-located data for better performance

**Trade-offs**:
- 16MB BSON document size limit (not a concern at tech case scale)
- Harder to query sub-documents independently

### 6.3 Virtual Properties

Calculated fields that don't persist in database:

| Schema | Virtual Property | Calculation |
|--------|-----------------|-------------|
| Cart | totalCost | Sum of item subtotals |
| Cart | itemCount | Length of items array |
| Cart | totalQuantity | Sum of item quantities |
| Item | isUserRegistered | Boolean check on createdByUserId |
| AgentConversation | messageCount | Length of messages array |
| AgentConversation | isActive | status === 'in_progress' |
| AgentConversation | lastMessage | Last element of messages array |

### 6.4 Soft Delete

Items use soft delete pattern (archive instead of delete):

```typescript
item.status = 'archived';  // Instead of item.delete()
```

**Benefits**:
- Preserves historical data
- Allows unarchiving
- Cart/request references remain valid

---

## 7. Extending Schemas Safely

### 7.1 Adding New Fields

1. **Determine scope**: MVP or Future?
2. **Add field to schema** with proper validation
3. **Make optional** if not required for MVP
4. **Add to domain types** (`apps/web/src/domain/entities.ts`)
5. **Update documentation** (`domain-and-data-dictionary.md`)
6. **Test with existing data** (migration if needed)

### 7.2 Adding New Indexes

1. **Analyze query patterns** to identify slow queries
2. **Add index in schema**:
   ```typescript
   Schema.index({ field: 1 }); // Ascending
   Schema.index({ field: -1 }); // Descending
   Schema.index({ field1: 1, field2: -1 }); // Compound
   ```
3. **Test performance** impact
4. **Document** in this file

### 7.3 Adding New Validation

1. **Add validation in schema definition**:
   ```typescript
   field: {
     type: String,
     validate: {
       validator: (value) => /* logic */,
       message: 'Error message',
     },
   }
   ```
2. **Or add pre-save hook** for complex validation
3. **Test edge cases**
4. **Update guardrails documentation**

### 7.4 Migration Strategy

For schema changes requiring data migration:

1. **Make changes backwards-compatible** (add optional fields)
2. **Create migration script** in `apps/web/scripts/migrations/`
3. **Test on development data** first
4. **Run migration** before deploying new code
5. **Monitor** for errors after deployment

---

## 8. Testing Schemas

### 8.1 Unit Tests

Test schema validations:

```typescript
describe('ItemSchema', () => {
  it('should reject negative price', async () => {
    const item = new ItemModel({ estimatedPrice: -10, ... });
    await expect(item.save()).rejects.toThrow();
  });
  
  it('should trim item name', async () => {
    const item = new ItemModel({ name: '  USB Cable  ', ... });
    await item.save();
    expect(item.name).toBe('USB Cable');
  });
});
```

### 8.2 Integration Tests

Test with actual MongoDB:

```typescript
beforeAll(async () => {
  await connectDB();
});

afterAll(async () => {
  await disconnectDB();
});

test('should create cart and add items', async () => {
  const user = await UserModel.create({ ... });
  const item = await ItemModel.create({ ... });
  const cart = await CartModel.findOrCreateForUser(user._id);
  await cart.addItem(item._id, item.name, item.price, 5);
  expect(cart.items).toHaveLength(1);
  expect(cart.totalCost).toBe(item.price * 5);
});
```

### 8.3 Validation Tests

Test guardrails:

- Max item count in cart (50)
- Max quantity per item (999)
- Email format validation
- Positive price validation
- Request number uniqueness
- Total calculation accuracy

---

## 9. Performance Considerations

### 9.1 Index Usage

Monitor query performance:
- Use `.explain()` to check index usage
- Add indexes for frequently filtered/sorted fields
- Avoid too many indexes (slows down writes)

### 9.2 Document Size

Be aware of BSON 16MB limit:
- AgentConversation with 500 messages: ~5-10MB (safe)
- Cart with 50 items: <1MB (safe)
- PurchaseRequest with 100 items: ~1MB (safe)

### 9.3 Connection Pooling

Use existing connection helper (`mongoose.ts`) which:
- Caches connections
- Uses connection pooling (maxPoolSize: 10)
- Handles reconnection

---

## 10. Security Considerations

### 10.1 Sensitive Data

- **passwordHash**: Never exposed in JSON output (select: false, toJSON transform)
- **No plain passwords**: Only hashed passwords stored

### 10.2 Input Validation

- All string fields trimmed
- Email format validated
- Numeric bounds enforced
- Enum values restricted

### 10.3 Injection Prevention

Mongoose provides built-in protection:
- Query sanitization
- Type casting
- Parameterized queries

---

## Appendix: Schema Files Reference

| File | Collection | Lines | Exports |
|------|-----------|-------|---------|
| `user.schema.ts` | users | ~180 | UserSchema, UserRole, USER_COLLECTION_NAME |
| `item.schema.ts` | items | ~310 | ItemSchema, ItemStatus, ITEM_COLLECTION_NAME |
| `cart.schema.ts` | carts | ~430 | CartSchema, CART_COLLECTION_NAME, limits |
| `purchase-request.schema.ts` | purchase_requests | ~470 | PurchaseRequestSchema, enums, limits |
| `agent-conversation.schema.ts` | agent_conversations | ~390 | AgentConversationSchema, enums, limits |
| `models.ts` | - | ~200 | All models, constants, type guards |

**Total**: ~2,000 lines of schema definitions with comprehensive validations and documentation.

---

**Document Status**: ✅ **Ready for Use**

All MongoDB schemas are implemented with strong validations, guardrails, and clear MVP vs Future separation. The persistence layer is isolated, well-documented, and ready for integration with API routes and services.
