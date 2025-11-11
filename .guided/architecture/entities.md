# Domain Entities and Relationships

> **Status**: Current State Documentation  
> **Last Updated**: 2025-11-10  
> **Source**: Extracted from `src/domain/entities.ts`

## Overview

ProcureFlow's domain model consists of 5 core entities representing the procurement workflow. Entities are defined as TypeScript interfaces and are framework-agnostic.

## Core Entities

### 1. User

**Purpose**: Represents an authenticated user

**Attributes**:

- `id`: UserId (string)
- `email`: string (unique)
- `name`: string (optional)
- `passwordHash`: string (optional, for credentials auth)
- `role`: 'requester' | 'buyer' | 'admin' (future)
- `createdAt`: Date
- `updatedAt`: Date

**Relationships**:

- One user has many carts
- One user has many purchase requests
- One user has many agent conversations

**Business Rules**:

- Email must be unique
- Password hashed with bcryptjs (10 rounds)

**Database**: `users` collection (Mongoose: `UserModel`)

---

### 2. Item (CatalogItem)

**Purpose**: Represents a requestable material or service

**Attributes**:

- `id`: ItemId (string)
- `name`: string (required, 2-200 chars)
- `category`: string (required)
- `description`: string (required, 10-2000 chars)
- `price`: number (estimatedPrice, > 0)
- `unit`: string (optional, e.g., "each", "box")
- `status`: ItemStatus ('Active' | 'PendingReview' | 'Inactive')
- `preferredSupplier`: string (optional, future)
- `registeredBy`: UserId (optional, if user-registered)
- `createdAt`: Date
- `updatedAt`: Date

**Relationships**:

- Referenced by CartItem
- Referenced by PurchaseRequestItem

**Business Rules**:

- Only "Active" items searchable by default
- User-registered items immediately active (MVP)
- Full-text search on name, category, description

**Database**: `items` collection (Mongoose: `ItemModel`)  
**Indexes**: Text index on (name, category, description)

---

### 3. Cart & CartItem

**Purpose**: Shopping cart for user

**Cart Attributes**:

- `id`: CartId (string)
- `userId`: UserId (owner)
- `items`: CartItem[]
- `totalCost`: number (calculated sum of item subtotals)
- `isDraft`: boolean (future)
- `createdAt`: Date
- `updatedAt`: Date

**CartItem Attributes**:

- `itemId`: ItemId (reference to catalog item)
- `itemName`: string (snapshot at add time)
- `itemPrice`: number (snapshot at add time)
- `quantity`: number (1-999)
- `subtotal`: number (itemPrice × quantity)
- `addedAt`: Date

**Relationships**:

- One cart per user (active)
- Many cart items per cart
- Cart items reference items (soft reference)

**Business Rules**:

- One active cart per user
- Quantity: 1-999 per item
- Max 100 line items per cart (soft limit)
- Item details snapshotted at add time
- Total cost = sum of subtotals

**Database**: `carts` collection (Mongoose: `CartModel`)

---

### 4. PurchaseRequest & PurchaseRequestItem

**Purpose**: Immutable record of submitted procurement request

**PurchaseRequest Attributes**:

- `id`: PurchaseRequestId (string)
- `userId`: UserId (requester)
- `items`: PurchaseRequestItem[]
- `totalCost`: number
- `notes`: string (optional justification)
- `status`: PurchaseRequestStatus ('Submitted' | 'PendingApproval' | 'Approved' | 'Rejected')
- `deliveryLocation`: string (future)
- `requestedDeliveryDate`: Date (future)
- `createdAt`: Date
- `updatedAt`: Date

**PurchaseRequestItem Attributes**:

- `itemId`: ItemId (reference to original catalog item)
- `itemName`: string (snapshot at checkout)
- `itemCategory`: string (snapshot)
- `itemDescription`: string (snapshot)
- `unitPrice`: number (snapshot)
- `quantity`: number
- `subtotal`: number (unitPrice × quantity)

**Relationships**:

- One purchase request per checkout
- Many purchase request items per request
- Items are immutable snapshots (not live references)

**Business Rules**:

- Purchase request immutable after creation
- Status defaults to "Submitted"
- Items snapshotted (price, details) at checkout time
- Cart cleared after successful creation

**Database**: `purchaseRequests` collection (Mongoose: `PurchaseRequestModel`)

---

### 5. AgentConversation, AgentMessage, AgentAction

**Purpose**: AI agent interaction logs

**AgentConversation Attributes**:

- `id`: AgentConversationId (string)
- `userId`: UserId
- `messages`: AgentMessage[]
- `actions`: AgentAction[]
- `isActive`: boolean
- `summary`: string (future)
- `createdAt`: Date
- `updatedAt`: Date

**AgentMessage Attributes**:

- `role`: 'user' | 'agent' | 'system'
- `content`: string
- `timestamp`: Date
- `items`: Item[] (optional, for rendering search results)
- `cart`: CartSummary (optional, for rendering cart)
- `purchaseRequest`: PurchaseRequestSummary (optional, for rendering confirmation)

**AgentAction Attributes**:

- `actionType`: AgentActionType (search_catalog, add_to_cart, checkout, etc.)
- `parameters`: Record<string, unknown>
- `result`: Record<string, unknown> (optional)
- `error`: string (optional)
- `timestamp`: Date

**Relationships**:

- One conversation per user session
- Many messages per conversation
- Many actions per conversation

**Business Rules**:

- Conversations tied to authenticated user
- Actions logged for debugging and traceability
- Messages include structured data for UI rendering

**Database**: `agentConversations` collection (Mongoose: `AgentConversationModel`)

## Entity Relationship Diagram

```
User
 │
 ├──< Cart (1:1 active)
 │     └──< CartItem (1:many)
 │           └──> Item (reference)
 │
 ├──< PurchaseRequest (1:many)
 │     └──< PurchaseRequestItem (1:many)
 │           └──> Item (snapshot, not live reference)
 │
 └──< AgentConversation (1:many)
       ├──< AgentMessage (1:many)
       └──< AgentAction (1:many)
```

## Domain Rules Summary

| Entity            | Key Rules                                       |
| ----------------- | ----------------------------------------------- |
| User              | Unique email, hashed password                   |
| Item              | Active items searchable, text index required    |
| Cart              | One per user, 1-999 qty per item, max 100 items |
| PurchaseRequest   | Immutable, snapshots item details               |
| AgentConversation | User-scoped, tracks actions for debugging       |

## Type Definitions

All entities defined in `src/domain/entities.ts`.  
Mongoose schemas in `src/lib/db/schemas/*.schema.ts`.  
Models exported from `src/lib/db/models.ts`.

**Import Pattern**:

```typescript
import type { Item, Cart, PurchaseRequest } from '@/domain/entities';
import { ItemModel, CartModel } from '@/lib/db/models';
```

## Future Entities (Out of Scope)

- **Category**: Hierarchical catalog organization
- **Supplier**: Vendor management
- **Approval**: Approval workflow records
- **Notification**: User notification logs

## Related Documentation

- Full entity definitions: `src/domain/entities.ts`
- Architecture context: `.guided/architecture/context.md`
- Database schemas: `src/lib/db/schemas/`
