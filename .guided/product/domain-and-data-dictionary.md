# ProcureFlow Domain Model and Data Dictionary

**Version**: 1.0.0  
**Last Updated**: November 7, 2025  
**Status**: Active  
**Related Documents**: 
- PRD: `.guided/product/PRD.md`
- Domain Types: `apps/web/src/domain/entities.ts`
- Mongoose Schemas: `apps/web/src/domain/mongo-schemas.d.ts`

---

## 1. Overview of Domain Model

The ProcureFlow domain model defines the core business entities that support the three main user journeys outlined in the PRD:

1. **Search & Register**: Finding catalog items and registering new materials/services
2. **Cart & Checkout**: Building purchase requests with selected items
3. **Agent-first**: Conversational interface for procurement via AI orchestration

This domain model is designed for the **tech case scope** (MVP implementation) with clear markers for future enhancements. The model prioritizes:

- **Simplicity**: Minimal required fields to reduce friction
- **Extensibility**: Clear separation of MVP vs Future features
- **ERP Compatibility**: Structured data suitable for integration (simulated in tech case)
- **Traceability**: Immutable snapshots and conversation logs for auditability

### Design Principles

- **Snapshot Pattern**: Cart items and purchase request items capture point-in-time data to preserve historical accuracy
- **User Ownership**: All transactional entities (Cart, PurchaseRequest, AgentConversation) are owned by authenticated users
- **Status-driven Workflows**: Items and requests use status enums to enable future approval/review processes
- **Embedded Sub-documents**: Line items and messages are embedded for atomic operations and simpler queries

---

## 2. Entity List

### Core Entities (MVP)

| Entity | Description | Purpose |
|--------|-------------|---------|
| **User** | Authenticated user account | Ownership of carts, requests, and conversations |
| **Item (CatalogItem)** | Material or service in the procurement catalog | Searchable inventory for purchase requests |
| **Cart** | Shopping cart with line items | Temporary collection of items before checkout |
| **PurchaseRequest** | Submitted procurement request (simulated ERP submission) | Immutable record of what was requested |
| **AgentConversation** | AI agent interaction session | Conversational procurement and debugging logs |

### Future Entities (Out of Scope for MVP)

| Entity | Description | Purpose |
|--------|-------------|---------|
| **Category** | Hierarchical catalog category | Replace string-based categories with structured taxonomy |
| **AgentActionLog** | Detailed agent action logging | Separate collection for analytics and training data |

---

## 3. Entity Details and Data Dictionary

### 3.1 User

The User entity represents an authenticated user who can create carts, submit purchase requests, and interact with the AI agent.

| Field | Type | Required | Description | Notes |
|-------|------|----------|-------------|-------|
| `id` | `UserId` (string) | Yes | Unique user identifier | MongoDB ObjectId as string [MVP] |
| `email` | `string` | Yes | User's email address | Used for login, unique index [MVP] |
| `name` | `string` | No | User's display name | Optional [MVP] |
| `passwordHash` | `string` | No | Hashed password | Only for Credentials provider [MVP] |
| `provider` | `string` | No | OAuth provider (e.g., 'google') | [Future] Google OAuth support |
| `providerId` | `string` | No | OAuth provider user ID | [Future] Google OAuth support |
| `role` | `'requester' \| 'buyer' \| 'admin'` | No | User role | [Future] Role-based access control |
| `createdAt` | `Date` | Yes | Account creation timestamp | Auto-generated [MVP] |
| `updatedAt` | `Date` | Yes | Last update timestamp | Auto-updated [MVP] |

**Business Rules**:
- Email must be unique across all users
- Password must be hashed using a secure algorithm (e.g., bcrypt) before storage
- Default role (if implemented) should be 'requester'

**Relationships**:
- User → Cart (1:1 or 1:N if drafts are supported in future)
- User → PurchaseRequest (1:N)
- User → AgentConversation (1:N)
- User → Item (1:N for registered items)

---

### 3.2 Item (CatalogItem)

The Item entity represents a material or service available in the procurement catalog. Items can be seeded from existing data or registered by users.

| Field | Type | Required | Description | Notes |
|-------|------|----------|-------------|-------|
| `id` | `ItemId` (string) | Yes | Unique item identifier | MongoDB ObjectId as string [MVP] |
| `name` | `string` | Yes | Item name | Descriptive, indexed for search [MVP] |
| `category` | `string` | Yes | Item category | e.g., "Office Supplies", indexed [MVP] |
| `description` | `string` | Yes | Detailed description | Supports search and user understanding [MVP] |
| `price` | `number` | Yes | Estimated unit price | Must be positive, default currency (e.g., USD) [MVP] |
| `unit` | `string` | No | Unit of measure | e.g., "each", "box", "pack" [Future] |
| `status` | `ItemStatus` enum | Yes | Item status | Active, PendingReview, Inactive [MVP: Active only] |
| `preferredSupplier` | `string` | No | Preferred supplier name | [Future] Supplier relationship management |
| `registeredBy` | `UserId` (string) | No | User who registered this item | Reference to User, null for seeded items [MVP] |
| `createdAt` | `Date` | Yes | Item creation timestamp | Auto-generated [MVP] |
| `updatedAt` | `Date` | Yes | Last update timestamp | Auto-updated [MVP] |

**Business Rules**:
- **BR-1.3**: Item name should be unique within the same category (case-insensitive) or system warns of duplicates
- **BR-1.5**: Price must be a positive number (> 0)
- **BR-2.5**: Items referenced in active carts should validate existence before checkout
- Default status is `Active` for MVP; `PendingReview` requires approval workflow (Future)

**Relationships**:
- Item → User (N:1 via `registeredBy` for user-created items)
- Item ← CartItem (1:N, items can appear in multiple carts)
- Item ← PurchaseRequestItem (1:N, items can appear in multiple requests, with snapshots)

**Indexes**:
- `name` (text index for search)
- `category` (for filtering)
- `status` (for active item queries)

---

### 3.3 Cart

The Cart entity represents a user's shopping cart, containing line items with quantities and price snapshots.

| Field | Type | Required | Description | Notes |
|-------|------|----------|-------------|-------|
| `id` | `CartId` (string) | Yes | Unique cart identifier | MongoDB ObjectId as string [MVP] |
| `userId` | `UserId` (string) | Yes | User who owns this cart | Reference to User [MVP] |
| `items` | `CartItem[]` | Yes | Line items in the cart | Embedded sub-documents [MVP] |
| `totalCost` | `number` | Yes | Total estimated cost | Sum of all item subtotals [MVP] |
| `createdAt` | `Date` | Yes | Cart creation timestamp | Auto-generated [MVP] |
| `updatedAt` | `Date` | Yes | Last update timestamp | Updated when items added/removed [MVP] |
| `isDraft` | `boolean` | No | Indicates saved cart draft | [Future] Save cart without checkout |

**Business Rules**:
- **BR-2.1**: Cart must contain at least 1 item to allow checkout
- **BR-2.3**: Cart data must be associated with authenticated user (if auth is enabled)
- **BR-2.7**: Cart is cleared after successful checkout
- **BR-3.4**: Agent-initiated cart operations respect same rules as UI

**Relationships**:
- Cart → User (N:1, each cart belongs to one user)
- Cart → CartItem (1:N, embedded line items)

---

### 3.4 CartItem

CartItem is an embedded sub-document within Cart, representing a single line item.

| Field | Type | Required | Description | Notes |
|-------|------|----------|-------------|-------|
| `itemId` | `ItemId` (string) | Yes | Reference to catalog item | Link to Item entity [MVP] |
| `itemName` | `string` | Yes | Snapshot of item name | Captured at add-to-cart time [MVP] |
| `itemPrice` | `number` | Yes | Snapshot of item price | Captured at add-to-cart time [MVP] |
| `quantity` | `number` | Yes | Quantity of this item | Min: 1, Max: 999 per BR-2.2 [MVP] |
| `subtotal` | `number` | Yes | Subtotal for this line | `itemPrice * quantity` [MVP] |
| `addedAt` | `Date` | Yes | Timestamp when added to cart | For tracking [MVP] |

**Business Rules**:
- **BR-2.2**: Quantity per item: minimum 1, maximum 999
- Price and name are snapshots to preserve cart state even if catalog item changes

**Notes**:
- CartItem is not a separate collection; it's embedded in Cart documents
- Snapshot pattern ensures cart consistency even if Item entity is updated or deleted

---

### 3.5 PurchaseRequest

The PurchaseRequest entity represents a submitted procurement request. In the tech case, this is logged to MongoDB instead of being sent to a real ERP.

| Field | Type | Required | Description | Notes |
|-------|------|----------|-------------|-------|
| `id` | `PurchaseRequestId` (string) | Yes | Unique purchase request ID | MongoDB ObjectId as string [MVP] |
| `userId` | `UserId` (string) | Yes | User who created this request | Reference to User [MVP] |
| `items` | `PurchaseRequestItem[]` | Yes | List of requested items | Immutable snapshots [MVP] |
| `totalCost` | `number` | Yes | Total estimated cost | Sum of all item subtotals [MVP] |
| `notes` | `string` | No | Optional notes/justification | [MVP] |
| `status` | `PurchaseRequestStatus` enum | Yes | Request status | Submitted, PendingApproval, Approved, Rejected [MVP: Submitted only] |
| `deliveryLocation` | `string` | No | Delivery location | [Future] Advanced logistics |
| `requestedDeliveryDate` | `Date` | No | Requested delivery date | [Future] Scheduling |
| `createdAt` | `Date` | Yes | Request creation timestamp | Auto-generated [MVP] |
| `updatedAt` | `Date` | Yes | Last update timestamp | Auto-updated [MVP] |

**Business Rules**:
- **BR-4.1**: Purchase request requires at least 1 item (enforced at checkout)
- **BR-4.2**: Unique request ID generated upon creation
- **BR-4.3**: Request recorded with timestamp, user ID, items, quantities, total cost
- Items are immutable snapshots to preserve historical accuracy

**Relationships**:
- PurchaseRequest → User (N:1, each request belongs to one user)
- PurchaseRequest → PurchaseRequestItem (1:N, embedded line items)

---

### 3.6 PurchaseRequestItem

PurchaseRequestItem is an embedded sub-document within PurchaseRequest, representing an immutable snapshot of a catalog item at checkout time.

| Field | Type | Required | Description | Notes |
|-------|------|----------|-------------|-------|
| `itemId` | `ItemId` (string) | Yes | Reference to original catalog item | Link to Item entity [MVP] |
| `itemName` | `string` | Yes | Snapshot: item name at checkout | Immutable [MVP] |
| `itemCategory` | `string` | Yes | Snapshot: item category at checkout | Immutable [MVP] |
| `itemDescription` | `string` | Yes | Snapshot: item description at checkout | Immutable [MVP] |
| `unitPrice` | `number` | Yes | Snapshot: unit price at checkout | Immutable [MVP] |
| `quantity` | `number` | Yes | Quantity requested | Immutable [MVP] |
| `subtotal` | `number` | Yes | Subtotal for this line | `unitPrice * quantity` [MVP] |

**Business Rules**:
- All fields are immutable snapshots captured at checkout
- Even if the original Item is updated or deleted, the PurchaseRequest preserves historical data
- `itemId` provides traceability back to catalog (if item still exists)

**Notes**:
- PurchaseRequestItem is not a separate collection; it's embedded in PurchaseRequest documents
- Snapshot pattern is critical for auditability and ERP integration

---

### 3.7 AgentConversation

The AgentConversation entity represents a conversational session between a user and the AI agent, including message history and action logs.

| Field | Type | Required | Description | Notes |
|-------|------|----------|-------------|-------|
| `id` | `AgentConversationId` (string) | Yes | Unique conversation ID | MongoDB ObjectId as string [MVP] |
| `userId` | `UserId` (string) | Yes | User who initiated conversation | Reference to User [MVP] |
| `messages` | `AgentMessage[]` | Yes | Chronological message history | Embedded sub-documents [MVP] |
| `actions` | `AgentAction[]` | Yes | List of agent actions/tool calls | Embedded sub-documents [MVP] |
| `isActive` | `boolean` | Yes | Conversation active/completed flag | [MVP] |
| `summary` | `string` | No | Conversation summary | [Future] Generated by agent at end |
| `createdAt` | `Date` | Yes | Conversation start timestamp | Auto-generated [MVP] |
| `updatedAt` | `Date` | Yes | Last message/action timestamp | Auto-updated [MVP] |

**Business Rules**:
- **BR-3.5**: Agent logs conversation and actions for debugging
- Messages and actions are appended chronologically
- `isActive` set to false when user ends conversation or achieves goal

**Relationships**:
- AgentConversation → User (N:1, each conversation belongs to one user)
- AgentConversation → AgentMessage (1:N, embedded messages)
- AgentConversation → AgentAction (1:N, embedded actions)

---

### 3.8 AgentMessage

AgentMessage is an embedded sub-document within AgentConversation, representing a single message in the conversation.

| Field | Type | Required | Description | Notes |
|-------|------|----------|-------------|-------|
| `role` | `AgentMessageRole` enum | Yes | Message role | 'user', 'assistant', 'system' [MVP] |
| `content` | `string` | Yes | Message content (text) | [MVP] |
| `timestamp` | `Date` | Yes | Message creation timestamp | [MVP] |

**Business Rules**:
- `role`: 'user' for user input, 'assistant' for agent responses, 'system' for system messages (e.g., error notifications)
- Messages are immutable once added
- Chronological order is preserved

---

### 3.9 AgentAction

AgentAction is an embedded sub-document within AgentConversation, representing a tool/function call made by the agent.

| Field | Type | Required | Description | Notes |
|-------|------|----------|-------------|-------|
| `actionType` | `AgentActionType` enum | Yes | Type of action | search_catalog, register_item, add_to_cart, etc. [MVP] |
| `parameters` | `Record<string, unknown>` | Yes | Input parameters | JSON object [MVP] |
| `result` | `Record<string, unknown>` | No | Action result | JSON object [MVP] |
| `error` | `string` | No | Error message if failed | [MVP] |
| `timestamp` | `Date` | Yes | Action execution timestamp | [MVP] |

**Business Rules**:
- **BR-3.2**: Agent should explain actions when helpful (reflected in subsequent messages)
- **BR-3.1**: Agent confirms before critical actions (checkout)
- Actions are logged for debugging and understanding agent behavior

**Supported Action Types (MVP)**:
- `search_catalog`: Search for items
- `register_item`: Create new catalog item
- `add_to_cart`: Add item to user's cart
- `update_cart_item`: Update quantity in cart
- `remove_from_cart`: Remove item from cart
- `view_cart`: Retrieve current cart state
- `checkout`: Execute purchase request submission

---

## 4. Relationships

### Entity Relationship Diagram (Text Notation)

```
User (1) ──────< (N) Cart
  │                      │
  │                      └─ embeds ─> CartItem (N)
  │                                          │
  │                                          └─ references ─> Item
  │
  ├──────< (N) PurchaseRequest
  │                      │
  │                      └─ embeds ─> PurchaseRequestItem (N)
  │                                          │
  │                                          └─ references (snapshot) ─> Item
  │
  ├──────< (N) AgentConversation
  │                      │
  │                      ├─ embeds ─> AgentMessage (N)
  │                      └─ embeds ─> AgentAction (N)
  │
  └──────< (N) Item (registeredBy)
```

### Relationship Details

| Relationship | Type | Description | Implementation |
|--------------|------|-------------|----------------|
| User → Cart | 1:1 (MVP) / 1:N (Future) | Each user has one active cart; future: multiple saved drafts | Foreign key: `Cart.userId` → `User.id` |
| User → PurchaseRequest | 1:N | Users can create multiple purchase requests | Foreign key: `PurchaseRequest.userId` → `User.id` |
| User → AgentConversation | 1:N | Users can have multiple conversations | Foreign key: `AgentConversation.userId` → `User.id` |
| User → Item | 1:N | Users can register multiple catalog items | Foreign key: `Item.registeredBy` → `User.id` |
| Cart → CartItem | 1:N | Cart contains multiple line items | Embedded sub-documents in `Cart.items` |
| CartItem → Item | N:1 | Line item references catalog item | Foreign key: `CartItem.itemId` → `Item.id` |
| PurchaseRequest → PurchaseRequestItem | 1:N | Request contains multiple line items | Embedded sub-documents in `PurchaseRequest.items` |
| PurchaseRequestItem → Item | N:1 (snapshot) | Line item references original item (snapshot) | Foreign key: `PurchaseRequestItem.itemId` → `Item.id` |
| AgentConversation → AgentMessage | 1:N | Conversation contains multiple messages | Embedded sub-documents in `AgentConversation.messages` |
| AgentConversation → AgentAction | 1:N | Conversation logs multiple actions | Embedded sub-documents in `AgentConversation.actions` |

---

## 5. MVP vs Future Fields

### MVP Scope (Tech Case Implementation)

The following fields and features are **in scope** for the tech case:

#### User (MVP)
- ✅ Basic authentication with email/password (Credentials provider)
- ✅ User ownership of carts, requests, conversations

#### Item (MVP)
- ✅ Core catalog fields: name, category, description, price
- ✅ User registration capability
- ✅ Status field (defaults to `Active`, prepared for future workflows)
- ✅ Search via keyword (name, description, category)

#### Cart (MVP)
- ✅ Add/update/remove items with quantity
- ✅ Cart total calculation
- ✅ Clear cart after checkout
- ✅ Snapshot pattern for price/name consistency

#### PurchaseRequest (MVP)
- ✅ Simulated ERP submission (logged to MongoDB)
- ✅ Immutable snapshots of items at checkout
- ✅ Status field (defaults to `Submitted`)
- ✅ Optional notes field

#### AgentConversation (MVP)
- ✅ Text-based conversational interface
- ✅ Message history logging
- ✅ Action/tool call logging for debugging
- ✅ Agent confirmation before critical actions (checkout)

---

### Future Enhancements (Out of Scope for MVP)

The following fields and features are **out of scope** for the tech case but designed into the model for future iterations:

#### User (Future)
- 🔮 OAuth providers (Google, SSO)
- 🔮 Role-based access control (requester, buyer, admin)
- 🔮 Multi-role support

#### Item (Future)
- 🔮 `PendingReview` status with buyer approval workflow
- 🔮 Unit of measure (`unit` field)
- 🔮 Preferred supplier tracking
- 🔮 Category hierarchy (separate Category entity)
- 🔮 Advanced filtering (price range, availability)

#### Cart (Future)
- 🔮 Persist cart across sessions (session storage or DB flag)
- 🔮 Save cart drafts (`isDraft` field)
- 🔮 Multiple saved carts per user

#### PurchaseRequest (Future)
- 🔮 Approval workflows (`PendingApproval`, `Approved`, `Rejected` statuses)
- 🔮 Delivery location and requested delivery date
- 🔮 Real ERP integration (replace simulated submission)
- 🔮 Budget validation and enforcement

#### AgentConversation (Future)
- 🔮 Voice input/output (multimodal interface)
- 🔮 Conversation summary generation (AI-powered)
- 🔮 Detailed agent action logs (separate AgentActionLog entity)
- 🔮 Conversation analytics and insights

#### New Entities (Future)
- 🔮 **Category**: Structured category taxonomy with hierarchy
- 🔮 **AgentActionLog**: Separate collection for detailed action analytics

---

## 6. Design Patterns and Conventions

### 6.1 Snapshot Pattern

Used in `CartItem` and `PurchaseRequestItem` to preserve point-in-time data:

- **Purpose**: Ensure historical accuracy even if catalog items are updated/deleted
- **Implementation**: Copy `name`, `price`, `category`, `description` at the time of cart addition or checkout
- **Benefit**: Auditability, ERP compatibility, no broken references

### 6.2 Embedded Sub-documents

Used for line items (`CartItem`, `PurchaseRequestItem`) and conversation data (`AgentMessage`, `AgentAction`):

- **Purpose**: Atomic operations, simpler queries, parent-child co-location
- **Implementation**: MongoDB embedded arrays with Mongoose schemas
- **Trade-off**: Limited to 16MB BSON document size (not a concern at tech case scale)

### 6.3 Status Enums

Used for `Item`, `PurchaseRequest` to enable workflow state management:

- **Purpose**: Prepare for future approval/review workflows
- **MVP**: Defaults (e.g., `Active`, `Submitted`)
- **Future**: Additional states for richer processes

### 6.4 User Ownership

All transactional entities (`Cart`, `PurchaseRequest`, `AgentConversation`) reference `User`:

- **Purpose**: Multi-tenancy, access control, auditability
- **Implementation**: Foreign key `userId` (ObjectId reference)

### 6.5 Timestamps

All entities include `createdAt` and `updatedAt`:

- **Purpose**: Auditability, debugging, analytics
- **Implementation**: Auto-managed by Mongoose `timestamps: true` option

---

## 7. Validation Rules Summary

| Entity | Field | Validation Rule |
|--------|-------|-----------------|
| User | email | Unique, valid email format |
| User | passwordHash | Required for Credentials provider |
| Item | name | Non-empty string, max 200 chars |
| Item | category | Non-empty string |
| Item | price | Positive number (> 0) |
| Item | status | Valid ItemStatus enum |
| CartItem | quantity | Integer, min: 1, max: 999 |
| Cart | items | Non-empty array for checkout |
| PurchaseRequest | items | Non-empty array, min 1 item |
| PurchaseRequest | totalCost | Positive number (> 0) |
| AgentMessage | role | Valid AgentMessageRole enum |
| AgentAction | actionType | Valid AgentActionType enum |

---

## 8. Indexing Strategy

### Primary Indexes

- **User**: `email` (unique)
- **Item**: `_id` (default primary key)
- **Cart**: `userId` (for user cart lookups)
- **PurchaseRequest**: `userId` (for user request history)
- **AgentConversation**: `userId` (for user conversation history)

### Secondary Indexes (Performance)

- **Item**: 
  - Text index on `name` and `description` for search
  - Index on `category` for filtering
  - Index on `status` for active item queries
- **PurchaseRequest**: Compound index on `userId` + `createdAt` for recent requests
- **AgentConversation**: Compound index on `userId` + `isActive` for active conversations

---

## 9. Example Data Flows

### 9.1 Search & Register Flow

1. User searches for "USB-C cable"
2. System queries Item collection: `{ $text: { $search: "USB-C cable" }, status: "Active" }`
3. If no results: User registers new item with name, category, description, price
4. System creates Item document with `registeredBy: userId`, `status: Active`

### 9.2 Cart & Checkout Flow

1. User adds Item to Cart
2. System creates/updates Cart document with CartItem sub-document (snapshot of item name/price)
3. User clicks checkout
4. System validates Cart (at least 1 item), creates PurchaseRequest with PurchaseRequestItem snapshots
5. System clears Cart, sets PurchaseRequest.status to `Submitted`

### 9.3 Agent-first Flow

1. User sends message: "I need 10 USB-C cables"
2. System creates AgentConversation, adds AgentMessage (role: user)
3. Agent parses intent, executes AgentAction (type: search_catalog, parameters: { query: "USB-C cable" })
4. Agent logs action result, responds with AgentMessage (role: assistant)
5. Agent executes AgentAction (type: add_to_cart, parameters: { itemId, quantity: 10 })
6. Agent confirms checkout, executes AgentAction (type: checkout)
7. System creates PurchaseRequest, logs final AgentMessage

---

## 10. Appendix: Type Definitions Reference

For the complete TypeScript type definitions, see:

- **Domain Entities**: `apps/web/src/domain/entities.ts`
- **Mongoose Schemas**: `apps/web/src/domain/mongo-schemas.d.ts`

All types use strict TypeScript with proper null handling and enum validation.

---

**Document Status**: ✅ **Ready for Implementation**

This domain model and data dictionary are ready for use by development teams to implement Mongoose schemas, API routes, and frontend components for the ProcureFlow tech case.
