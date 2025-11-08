# Mocks vs DB Mapping

**Date:** 2025-11-08  
**Purpose:** Detailed mapping from each mock/stub to DB-backed implementation by feature

---

## How to Read This Document

For each feature area, the table shows:

- **Area**: Specific UI component or functionality
- **Current Source**: Mock file, hard-coded data, or stub logic
- **Target Source**: Service + DB entity + API route that should be used
- **Notes**: Risks, missing pieces, relevant TODO/FIXME references

---

## 1. Catalog & Search

| Area                         | Current Source                                                              | Target Source                                                                                                               | Notes                                                                                                                                                     |
| ---------------------------- | --------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Catalog table items list** | `src/features/catalog/mock.ts`<br/>→ `mockItems` array (10 items)           | **Service**: `catalogService.searchItems()`<br/>**Entity**: `Item`<br/>**API**: `GET /api/items`                            | ✅ API fully implemented<br/>⚠️ Frontend imports mock instead of calling API<br/>📍 File: `CatalogPageContent.tsx` line 48                                |
| **Product detail page**      | `src/features/catalog/mock.ts`<br/>→ `mockItems.find(i => i.id === itemId)` | **Service**: `catalogService.getItemById()`<br/>**Entity**: `Item`<br/>**API**: `GET /api/items/{id}` (not implemented yet) | ❌ API route for single item doesn't exist<br/>⚠️ Could use Server Component with direct service call<br/>📍 File: `ProductDetailPageContent.tsx` line 47 |
| **Catalog search/filter**    | Client-side filter on `mockItems`                                           | **Service**: `catalogService.searchItems({ q })`<br/>**Entity**: `Item`<br/>**API**: `GET /api/items?q=keyword`             | ✅ API supports text search with `$text` operator<br/>⚠️ Frontend doesn't call it                                                                         |
| **Item registration form**   | Form submission shows mock toast                                            | **Service**: `catalogService.createItem()`<br/>**Entity**: `Item`<br/>**API**: `POST /api/items`                            | ✅ API fully implemented with duplicate detection<br/>⚠️ Frontend doesn't call it<br/>📍 BR-1.2, BR-1.3 validation in service                             |

**Collections**: `items`

**Key Integration Points**:

1. Replace `import { mockItems }` with API calls in `CatalogPageContent.tsx`
2. Implement `GET /api/items/{id}` route or use Server Component pattern
3. Connect item registration form to `POST /api/items`

---

## 2. Item Registration

| Area                         | Current Source              | Target Source                                                                                                                                      | Notes                                                                                                                                                  |
| ---------------------------- | --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **New item form validation** | Client-side validation only | **Service**: `catalogService.validateCreateItemInput()`<br/>**API**: `POST /api/items` validates before service call                               | ✅ Service has comprehensive validation:<br/>- Name: 2-200 chars<br/>- Category: 2-100 chars<br/>- Description: 10-2000 chars<br/>- Price > 0 (BR-1.5) |
| **Duplicate detection**      | Not implemented in frontend | **Service**: `catalogService.createItem()`<br/>→ Throws `DuplicateItemError` with duplicates array<br/>**API**: Returns 409 status with duplicates | ✅ Backend uses regex search on name + category<br/>⚠️ Frontend should show duplicate warning modal<br/>📍 Allows user to confirm if intentional       |
| **Success feedback**         | Mock toast message          | **API**: `POST /api/items` returns created item<br/>→ Frontend shows item details in toast/modal                                                   | ⚠️ Need to handle 201 response and show actual item data                                                                                               |

**Collections**: `items`

**Key Integration Points**:

1. Connect form `onSubmit` to `POST /api/items`
2. Handle 409 duplicate error with confirmation dialog
3. Refresh catalog list after successful creation

---

## 3. Cart Management

| Area                           | Current Source                                                    | Target Source                                                                                         | Notes                                                                                                                            |
| ------------------------------ | ----------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| **Cart items list**            | `src/features/cart/mock.ts`<br/>→ `mockCartItems` array (3 items) | **Service**: `cartService.getCartForUser(userId)`<br/>**Entity**: `Cart`<br/>**API**: `GET /api/cart` | ✅ API creates cart if doesn't exist<br/>⚠️ Frontend uses local state instead                                                    |
| **Add to cart (from catalog)** | `mockItems` → local state update                                  | **Service**: `cartService.addItemToCart()`<br/>**Entity**: `Cart`<br/>**API**: `POST /api/cart/items` | ✅ API validates item exists in catalog<br/>✅ Enforces quantity limits (1-999, BR-2.2)<br/>⚠️ Frontend shows mock success toast |
| **Add to cart (from agent)**   | Mock response with items                                          | **Service**: Same as above<br/>**API**: `POST /api/cart/items`                                        | ⚠️ Agent doesn't actually add to cart yet<br/>📍 `executeTool()` has logic but not wired                                         |
| **Update quantity**            | Local state update in `CartPageContent`                           | **Service**: `cartService.updateCartItemQuantity()`<br/>**API**: `PATCH /api/cart/items/{itemId}`     | ✅ API validates quantity range (1-999)<br/>⚠️ Frontend doesn't persist changes                                                  |
| **Remove item**                | Local state filter                                                | **Service**: `cartService.removeCartItem()`<br/>**API**: `DELETE /api/cart/items/{itemId}`            | ✅ API implemented<br/>⚠️ Frontend doesn't persist changes                                                                       |
| **Cart total calculation**     | Client-side reduce on `mockCartItems`                             | **Service**: `cartService.getCartForUser()`<br/>→ Returns cart with `totalCost` field                 | ✅ Service calculates total server-side<br/>⚠️ Frontend recalculates locally                                                     |

**Collections**: `carts`, `items` (referenced)

**Key Integration Points**:

1. Load cart on page mount with `GET /api/cart`
2. Sync CartContext with actual DB state
3. Call appropriate API for add/update/remove
4. Show loading states during API calls
5. Handle errors (item not found, cart limits)

---

## 4. Checkout

| Area                          | Current Source                                                        | Target Source                                                                                                         | Notes                                                                                                                                                     |
| ----------------------------- | --------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Checkout flow**             | `CartPageContent.tsx` line 68<br/>→ Mock simulation with `setTimeout` | **Service**: `checkoutService.checkoutCart()`<br/>**Entity**: `PurchaseRequest`<br/>**API**: `POST /api/checkout`     | ✅ API fully implemented<br/>✅ Generates unique request number (PR-YYYY-####)<br/>✅ Clears cart after success (BR-2.7)<br/>⚠️ Frontend doesn't call API |
| **Purchase request creation** | Mock success message                                                  | **Service**: `checkoutService.checkoutCart()`<br/>→ Returns `PurchaseRequest` with details                            | ✅ Service creates immutable item snapshots<br/>✅ Captures notes/justification<br/>⚠️ Frontend doesn't display created request                           |
| **ERP submission logging**    | Not visible to user                                                   | **Entity**: `PurchaseRequest` stored in DB<br/>**Fields**: requestNumber, userId, items, total, notes, source, status | ✅ Backend logs to `purchaserequests` collection<br/>❌ No UI to view submitted requests                                                                  |
| **Post-checkout state**       | Mock empty cart                                                       | **Service**: `checkoutService.checkoutCart()`<br/>→ Clears cart via `cartService.clearCart()`                         | ✅ Service clears cart atomically<br/>⚠️ Frontend should refetch cart after checkout                                                                      |

**Collections**: `purchaserequests`, `carts` (cleared)

**Key Integration Points**:

1. Connect checkout button to `POST /api/checkout`
2. Show purchase request confirmation (requestNumber, total)
3. Refetch cart (should be empty) after success
4. Optionally: Add purchase history page showing user's requests

---

## 5. Agent-First Interface

### Frontend Mock Logic

| Area                       | Current Source                                                              | Target Source                                                                                       | Notes                                                                                                            |
| -------------------------- | --------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| **Agent chat messages**    | `src/features/agent/mocks/mockAgent.ts`<br/>→ `generateMockAgentResponse()` | **Service**: `agentService.handleAgentMessage()`<br/>**API**: `POST /api/agent/chat`                | ❌ Frontend doesn't call real API<br/>📍 File: `AgentChatPageContent.tsx` line 55<br/>📍 TODO comment at line 34 |
| **Product search in chat** | `mockAgent.findMockItems()`<br/>→ Searches `mockItems` array                | **Service**: `agentService.executeTool()`<br/>→ Calls `catalogService.searchItems()`                | ⚠️ Mock items are different from catalog mocks<br/>⚠️ Agent can't find real catalog items                        |
| **Product suggestions**    | `mockItems` from `mocks/mockItems.ts` (3 items)                             | **Service**: `catalogService.searchItems({ q })`<br/>**Entity**: `Item[]`                           | ❌ Agent shows items that don't exist in catalog<br/>⚠️ IDs like `'mock-item-1'` instead of ObjectId             |
| **Message parsing**        | `mockAgent.parseUserMessage()`<br/>→ Extracts quantity, query, maxPrice     | **Service**: `agentService.generateAgentResponse()`<br/>→ LangChain structured tool with parameters | ✅ Parsing logic is good<br/>⚠️ Should be used by LangChain tool schema                                          |

### Backend Integration Gaps

| Area                       | Current Source  | Target Source                                                                                        | Notes                                                                                                                          |
| -------------------------- | --------------- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| **LangChain tool calling** | Not implemented | **Service**: `agentService.generateAgentResponse()`<br/>→ Use LangChain's structured tool framework  | 📍 Comment in service: "In production, this would use structured tool calling"<br/>❌ `executeTool()` defined but never called |
| **Catalog search tool**    | Not wired       | **Service**: `executeTool(AgentActionType.SearchCatalog)`<br/>→ Calls `catalogService.searchItems()` | ✅ Logic exists in `executeTool()`<br/>❌ LangChain doesn't invoke it                                                          |
| **Add to cart tool**       | Not wired       | **Service**: `executeTool(AgentActionType.AddToCart)`<br/>→ Calls `cartService.addItemToCart()`      | ✅ Logic exists in `executeTool()`<br/>❌ Agent can't actually add items to cart                                               |
| **Checkout tool**          | Not wired       | **Service**: `executeTool(AgentActionType.Checkout)`<br/>→ Calls `checkoutService.checkoutCart()`    | ✅ Logic exists in `executeTool()`<br/>❌ Agent can't complete checkout                                                        |
| **View cart tool**         | Not wired       | **Service**: `executeTool(AgentActionType.ViewCart)`<br/>→ Calls `cartService.getCartForUser()`      | ✅ Logic exists in `executeTool()`<br/>❌ Agent can't show cart contents                                                       |
| **Register item tool**     | Not wired       | **Service**: `executeTool(AgentActionType.RegisterItem)`<br/>→ Calls `catalogService.createItem()`   | ✅ Logic exists in `executeTool()`<br/>❌ Agent can't register new items                                                       |

**Collections**: `agentconversations`, `items` (via tools), `carts` (via tools)

**Key Integration Points**:

1. **Frontend**: Replace `generateMockAgentResponse()` with `POST /api/agent/chat`
2. **Backend**: Implement LangChain structured tool calling:
   - Define tool schemas (name, description, parameters)
   - Wire tools to `executeTool()` function
   - Enable LLM to call tools based on user intent
3. **Testing**: Ensure agent can search, add to cart, checkout via natural language

---

## 6. Conversation History

| Area                           | Current Source           | Target Source                                                                                          | Notes                                                                                                            |
| ------------------------------ | ------------------------ | ------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| **Sidebar conversation list**  | Real API call            | **Service**: `agentService.listConversationsForUser()`<br/>**API**: `GET /api/agent/conversations`     | ✅ Already integrated!<br/>✅ No mocks found<br/>⚠️ Returns empty array if MongoDB not configured                |
| **Load conversation messages** | Not implemented          | **Service**: `agentService.handleAgentMessage()`<br/>→ Loads messages from `conversationId`            | 📍 TODO in `AgentChatPageContent.tsx` line 34<br/>⚠️ Frontend accepts `conversationId` but doesn't load messages |
| **Conversation creation**      | Created on first message | **Service**: `agentService.handleAgentMessage()`<br/>→ Creates new conversation if no `conversationId` | ✅ Works when sending first message<br/>⚠️ Could add explicit create endpoint                                    |

**Collections**: `agentconversations`

**Key Integration Points**:

1. Load conversation messages when `conversationId` is provided
2. Update conversation preview when new message sent
3. Implement conversation deletion (optional)

---

## 7. ERP Simulation / Purchase Request Logging

| Area                        | Current Source                     | Target Source                                                                                                   | Notes                                                                                                                                       |
| --------------------------- | ---------------------------------- | --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| **Purchase request record** | Created in DB but not displayed    | **Service**: `checkoutService.checkoutCart()`<br/>**Entity**: `PurchaseRequest`                                 | ✅ Service creates record with:<br/>- Unique requestNumber<br/>- Immutable item snapshots<br/>- User, timestamp, notes<br/>❌ No UI to view |
| **Request numbering**       | Sequential per year (PR-2025-0001) | **Service**: `generateRequestNumber()`<br/>→ Finds last number and increments                                   | ✅ Implemented and tested<br/>⚠️ Could have race condition in high concurrency                                                              |
| **Purchase history view**   | Not implemented                    | **New Feature**<br/>**API**: `GET /api/purchase-requests`<br/>**Service**: New function to list user's requests | ❌ Not in current scope<br/>💡 Future enhancement                                                                                           |

**Collections**: `purchaserequests`

**Key Integration Points**:

1. Show purchase request details after checkout (requestNumber, items, total)
2. Optionally: Add purchase history page to view all submitted requests
3. Optionally: Add admin view to see all requests across users

---

## Authentication

| Area                 | Current Source        | Target Source                                                             | Notes                                                                                                                      |
| -------------------- | --------------------- | ------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| **User credentials** | Hard-coded demo user  | **Service**: Real user lookup in MongoDB<br/>**Schema**: `user.schema.ts` | 📍 TODO in `config.ts` line 33<br/>⚠️ Demo: `demo@procureflow.com` / `demo123`<br/>💡 Replace with bcrypt password hashing |
| **User session**     | JWT with demo user ID | **Service**: NextAuth with real user data                                 | ⚠️ Demo user has ID `'demo-user-123'`<br/>💡 Switch to ObjectId from DB                                                    |

**Collections**: `users`

**Key Integration Points**:

1. Implement user registration
2. Implement password hashing (bcrypt)
3. Update credentials provider to query DB
4. Remove hard-coded demo user

---

## Risk Assessment

### High Risk (Breaks Core Features)

1. ❌ **Catalog not connected to API** - Can't browse real items
2. ❌ **Cart not connected to API** - Can't persist cart across sessions
3. ❌ **Agent uses mock items** - Shows wrong products

### Medium Risk (Incomplete Features)

4. ⚠️ **Agent can't execute actions** - Can only respond with text, not add to cart
5. ⚠️ **No purchase history** - Users can't see submitted requests
6. ⚠️ **Conversation messages not loaded** - Can't resume past conversations

### Low Risk (Polish)

7. 💡 **Demo authentication** - Works but not production-ready
8. 💡 **No item detail API** - Can use Server Component instead

---

## Integration Sequence Recommendation

### Phase 1: Catalog & Cart (Foundation)

1. Connect `CatalogPageContent` to `GET /api/items`
2. Connect `CartPageContent` to `GET /api/cart`
3. Connect "Add to Cart" button to `POST /api/cart/items`
4. Connect quantity controls to `PATCH /api/cart/items/{itemId}`
5. Connect remove button to `DELETE /api/cart/items/{itemId}`

**Exit Criteria**: Can browse catalog, manage cart, see changes persist across page refreshes

### Phase 2: Checkout

6. Connect checkout button to `POST /api/checkout`
7. Show purchase request confirmation
8. Refetch empty cart after checkout

**Exit Criteria**: Can complete end-to-end purchase from catalog → cart → checkout

### Phase 3: Agent Frontend

9. Replace `generateMockAgentResponse()` with `POST /api/agent/chat`
10. Remove `mockItems` from agent
11. Load conversation messages when opening existing conversation

**Exit Criteria**: Agent shows DB-backed catalog items, conversation history works

### Phase 4: Agent Backend (LangChain Tools)

12. Implement LangChain structured tool framework
13. Wire `executeTool()` to LangChain
14. Test agent can search, add to cart, checkout

**Exit Criteria**: Agent can execute actions, not just respond with text

### Phase 5: Polish

15. Implement `GET /api/items/{id}` or use Server Component
16. Add purchase request history page
17. Improve error handling and loading states

**Exit Criteria**: All features polished, no remaining mocks

---

## Next Steps

Proceed to **`db-integration-by-feature.md`** for detailed implementation plan with step-by-step tasks.
