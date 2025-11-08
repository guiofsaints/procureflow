# Mocks and Integrations Overview

**Date:** 2025-11-08  
**Purpose:** Global overview of mocks, TODOs, and DB integrations per feature in ProcureFlow

---

## Executive Summary

The ProcureFlow codebase demonstrates a **hybrid integration state**:

- ✅ **Backend is fully DB-backed**: All service layers and API routes use MongoDB via Mongoose
- ⚠️ **Frontend is fully mocked**: UI components use static mock data instead of API calls
- ⚠️ **Agent uses mock logic**: Agent chat uses mock response generation instead of LangChain + service orchestration

### Overall Integration Status

| Feature Area         | Backend (Services/API) | Frontend (UI) | Agent Integration |
| -------------------- | ---------------------- | ------------- | ----------------- |
| Catalog & Search     | ✅ DB-backed           | ❌ Mocked     | ⚠️ Mock responses |
| Item Registration    | ✅ DB-backed           | ❌ Mocked     | ⚠️ Mock responses |
| Cart Management      | ✅ DB-backed           | ❌ Mocked     | ⚠️ Mock responses |
| Checkout             | ✅ DB-backed           | ❌ Mocked     | ⚠️ Mock responses |
| Conversation History | ✅ DB-backed           | N/A           | ✅ Uses real API  |
| ERP Simulation       | ✅ DB-backed           | ❌ Mocked     | N/A               |

---

## Feature-by-Feature Analysis

### 1. Catalog & Search

#### ✅ Database Integration (Complete)

- **Schema**: `src/lib/db/schemas/item.schema.ts` ✓
- **Model**: Exported in `src/lib/db/models.ts` ✓
- **Service**: `src/features/catalog/lib/catalog.service.ts` ✓
  - `searchItems()` - Uses MongoDB text search with `$text` operator
  - `createItem()` - Includes duplicate detection
  - `getItemById()` - Fetch single item
- **API Routes**: ✓
  - `GET /api/items` - Fully implemented with service integration
  - `POST /api/items` - Fully implemented with authentication

#### ❌ Frontend Integration (Mocked)

- **Mock Data**: `src/features/catalog/mock.ts`
  - Exports `mockItems` array with 10 hard-coded items
- **Components Using Mocks**:
  - `src/features/catalog/components/CatalogPageContent.tsx`
    - Line 48: `<CatalogTable data={mockItems} isLoading={isLoading} />`
    - Should call `GET /api/items` instead
  - `src/features/catalog/components/ProductDetailPageContent.tsx`
    - Line 28: Imports `mockItems`
    - Line 47: `const item = mockItems.find((i) => i.id === itemId);`
    - Should call `GET /api/items/{id}` or use server component with service

#### 📌 TODO/FIXME References

- None found in code comments
- Documentation notes in `src/styles/ui-layout-notes.md`:
  - Line 135: "Uses mock data from `src/features/{feature}/mock.ts`"
  - Line 147: "Mock Data: `mockItems` from `src/features/catalog/mock.ts`"
  - Line 281: "Replace mock data with API calls"

#### Collections Used

- `items` collection (via `ItemModel`)
  - Text index on `name`, `description`, `category`
  - Status-based filtering (`active`, `pending_review`, `archived`)

---

### 2. Item Registration

#### ✅ Database Integration (Complete)

- **Service**: `src/features/catalog/lib/catalog.service.ts`
  - `createItem()` - Full validation and duplicate detection (BR-1.2, BR-1.3)
  - Validates name (2-200 chars), category (2-100 chars), description (10-2000 chars)
  - Validates price > 0 (BR-1.5)
  - Checks for duplicates with regex matching on name + category
- **API Route**: `POST /api/items` ✓
  - Authentication required
  - Full error handling with proper status codes (400, 409, 500)

#### ❌ Frontend Integration (Mocked)

- **Components**:
  - Item registration form exists in catalog feature (via Sheet/Dialog)
  - Currently shows mock success/error messages
  - No actual API integration in the form submission

#### 📌 TODO/FIXME References

- None found

#### Collections Used

- `items` collection (same as Catalog)

---

### 3. Cart & Checkout

#### ✅ Database Integration (Complete)

- **Schema**: `src/lib/db/schemas/cart.schema.ts` ✓
- **Model**: `CartModel` exported in `src/lib/db/models.ts` ✓
- **Service**: `src/features/cart/lib/cart.service.ts` ✓
  - `getCartForUser()` - Creates cart if doesn't exist
  - `addItemToCart()` - Validates item exists, enforces quantity limits (BR-2.2)
  - `updateCartItemQuantity()` - Validates 1-999 range
  - `removeCartItem()` - Removes item from cart
  - `clearCart()` - Used after checkout (BR-2.7)
- **API Routes**: ✓
  - `GET /api/cart` - Fetch user's cart
  - `POST /api/cart/items` - Add item to cart
  - `PATCH /api/cart/items/[itemId]` - Update quantity
  - `DELETE /api/cart/items/[itemId]` - Remove item
  - All routes require authentication

#### ✅ Checkout DB Integration (Complete)

- **Schema**: `src/lib/db/schemas/purchase-request.schema.ts` ✓
- **Service**: `src/features/checkout/lib/checkout.service.ts` ✓
  - `checkoutCart()` - Creates purchase request, clears cart
  - Generates unique request number (format: `PR-YYYY-####`)
  - Creates immutable item snapshots in purchase request
  - Validates cart not empty (BR-4.1)
- **API Route**: `POST /api/checkout` ✓
  - Authentication required
  - Accepts optional notes

#### ❌ Frontend Integration (Mocked)

- **Mock Data**: `src/features/cart/mock.ts`
  - Exports `mockCartItems` array with 3 hard-coded items
- **Components Using Mocks**:
  - `src/features/cart/components/CartPageContent.tsx`
    - Line 31: `const [cartItems, setCartItems] = useState<CartItem[]>(mockCartItems);`
    - Line 68: Mock comment: `// Mock: Simulate checkout process`
    - Line 248: "Checkout will create a purchase request (mock)"
    - Should call `GET /api/cart`, `POST /api/cart/items`, etc.

#### 📌 TODO/FIXME References

- None in code
- Documentation in `src/styles/ui-layout-notes.md`:
  - Line 146: "Add to cart button (shows alert - mock)"
  - Line 158: "Checkout button (shows alert - mock)"
  - Line 160: "Mock Data: `mockCartItems` from `src/features/cart/mock.ts`"

#### Collections Used

- `carts` collection (via `CartModel`)
- `purchaserequests` collection (via `PurchaseRequestModel`)
- Relationships: Cart items reference `items._id`, Purchase requests embed cart snapshots

---

### 4. Agent-First Interface

#### ✅ Database Integration (Partial)

- **Service**: `src/features/agent/lib/agent.service.ts` ✓
  - `handleAgentMessage()` - Persists conversation to DB
  - `generateAgentResponse()` - **Currently uses basic LLM call WITHOUT tool execution**
  - `executeTool()` - Defined but not wired to LangChain (placeholder)
  - Agent has access to all feature services (catalog, cart, checkout)
- **API Route**: `POST /api/agent/chat` ✓
  - Accepts message and optional conversationId
  - Authentication optional (for demo)
  - Saves messages to DB via service

#### ❌ Frontend Integration (Mocked)

- **Mock Data**: `src/features/agent/mocks/mockAgent.ts`
  - `parseUserMessage()` - Parses quantity, query, price from user input
  - `findMockItems()` - Searches `mockItems` array (not real catalog)
  - `generateMockAgentResponse()` - **This is what the frontend actually calls**
- **Mock Items**: `src/features/agent/mocks/mockItems.ts`
  - Separate mock catalog with 3 items (different from catalog mock)
  - IDs like `'mock-item-1'`, `'mock-item-2'`, etc.
- **Components Using Mocks**:
  - `src/features/agent/components/AgentChatPageContent.tsx`
    - Line 12: `import { generateMockAgentResponse } from '../mocks/mockAgent';`
    - Line 55: `const agentResponse = await generateMockAgentResponse(content);`
    - **Does NOT call** `POST /api/agent/chat` API

#### ⚠️ Integration Gap

The agent has a **complete disconnect** between:

1. **Frontend**: Uses `generateMockAgentResponse()` with static mock items
2. **Backend**: Has `handleAgentMessage()` with LangChain but doesn't use structured tools

**What's Missing:**

- Frontend should call `POST /api/agent/chat` API
- Backend `generateAgentResponse()` should use LangChain's structured tool calling
- Agent should orchestrate calls to:
  - `catalogService.searchItems()`
  - `cartService.addItemToCart()`
  - `checkoutService.checkoutCart()`

#### 📌 TODO/FIXME References

- `src/features/agent/components/AgentChatPageContent.tsx` line 34:
  ```typescript
  // TODO: Load conversation messages from API when conversationId is provided
  // This will be implemented in a follow-up when the full message loading is needed
  ```
- `src/features/agent/lib/agent.service.ts` comments:
  - "This is a simplified implementation. In production, this would:"
  - "Use structured tool calling with LangChain"
  - "For the tech case, we'll use a basic LLM call with manual tool orchestration."
- Documentation in `src/styles/ui-layout-notes.md`:
  - Line 173: "Mock AI responses (1.5s delay)"
  - Line 174: "Mock Data: `mockMessages` from `src/features/agent/mock.ts`"

#### Collections Used

- `agentconversations` collection (via `AgentConversationModel`)
  - Stores messages, actions, user association
  - Status tracking (`in_progress`, `completed`)

---

### 5. Conversation History

#### ✅ Database Integration (Complete)

- **Schema**: `src/lib/db/schemas/agent-conversation.schema.ts` ✓
- **Model**: `AgentConversationModel` ✓
- **Service**: `src/features/agent/lib/agent.service.ts` ✓
  - `listConversationsForUser()` - Fetches user's conversations
  - `createConversationForUser()` - Creates new conversation
  - `getConversationSummaryById()` - Fetch single conversation
  - `touchConversation()` - Update last message preview
- **API Route**: `GET /api/agent/conversations` ✓
  - Authentication required
  - Returns empty array if MongoDB not configured (graceful degradation)

#### ✅ Frontend Integration (Complete)

- **Components**:
  - `src/features/agent/components/AgentConversationHistoryList.tsx`
  - Uses real API call (no mocks found)
  - Displays sidebar conversation history

#### 📌 TODO/FIXME References

- None found

#### Collections Used

- `agentconversations` collection

---

### 6. ERP Simulation / Purchase Request Logging

#### ✅ Database Integration (Complete)

- **Schema**: `src/lib/db/schemas/purchase-request.schema.ts` ✓
- **Service**: `src/features/checkout/lib/checkout.service.ts` ✓
  - `checkoutCart()` creates purchase request with:
    - Unique request number (BR-4.2)
    - User ID, items, total, notes
    - Timestamp, source (`'ui'` or `'agent'`)
    - Status (`'submitted'`)
  - `generateRequestNumber()` - Sequential numbering per year
- **API Route**: `POST /api/checkout` ✓
  - Returns purchase request with note: "This is a simulated ERP submission for the tech case"

#### ❌ Frontend Integration (Mocked)

- Cart page checkout button shows mock success message
- No display of created purchase request details
- No purchase history view

#### 📌 TODO/FIXME References

- None found

#### Collections Used

- `purchaserequests` collection
  - Stores immutable snapshots of cart items at checkout time
  - Request number format: `PR-YYYY-####`

---

## Authentication

#### ✅ Database Integration (Partial)

- **Schema**: `src/lib/db/schemas/user.schema.ts` ✓
- **Model**: `UserModel` ✓
- **NextAuth Config**: `src/lib/auth/config.ts`
  - Credentials provider implemented
  - Demo user hard-coded: `demo@procureflow.com` / `demo123`

#### 📌 TODO/FIXME References

- `src/lib/auth/config.ts` line 33:
  ```typescript
  // TODO: Remove this and implement real user authentication
  ```

---

## Summary Table: Where DB Is/Isn't Used

| Component Type        | DB-Backed Examples          | Mocked Examples                             |
| --------------------- | --------------------------- | ------------------------------------------- |
| **Mongoose Schemas**  | ✅ All 5 schemas complete   | N/A                                         |
| **Service Functions** | ✅ All services use MongoDB | ❌ Agent uses basic LLM (no tool execution) |
| **API Routes**        | ✅ All routes use services  | N/A                                         |
| **Frontend Pages**    | ❌ None                     | ✅ All use static mocks                     |
| **Agent Chat**        | ⚠️ Saves conversations      | ❌ Uses `generateMockAgentResponse()`       |

---

## Integration Priorities (By Dependency)

### High Priority (Foundational)

1. **Catalog frontend** → API integration (enables all other features)
2. **Cart frontend** → API integration (needed for checkout and agent)

### Medium Priority (Core Features)

3. **Agent frontend** → API integration (switch from mocks to real service)
4. **Agent backend** → LangChain tool orchestration (connect LLM to services)

### Low Priority (Polish)

5. **Purchase request history view** (display submitted requests)
6. **Real user authentication** (replace demo credentials)

---

## Test Coverage

### ✅ Existing Tests

- `tests/api/items.test.ts` - Catalog service tests
- `tests/api/cart-and-checkout.test.ts` - Cart and checkout service tests
- `tests/api/agent.test.ts` - Agent service tests
- `tests/api/agent-conversations.test.ts` - Conversation history tests
- `tests/api/agent-mock.test.ts` - Mock agent logic tests
- `tests/agent-mock.test.ts` - Standalone mock tests

All service-layer tests use real MongoDB (via `MONGODB_URI_TEST`).

### ❌ Missing Tests

- No frontend component tests (e.g., React Testing Library)
- No E2E tests (e.g., Playwright)
- API tests cover services but not full request/response flow

---

## Next Steps

See companion documents:

- **`mocks-vs-db-mapping.md`** - Detailed mapping of each mock to DB target
- **`db-integration-by-feature.md`** - Phased integration plan with tasks
