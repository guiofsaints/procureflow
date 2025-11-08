# Database Integration Plan by Feature

**Date:** 2025-11-08  
**Purpose:** Phased integration plan with step-by-step tasks to replace mocks with DB-backed implementations

---

## Overview

This plan organizes the database integration work into 5 phases, ordered by dependency and risk:

1. **Phase 1**: Catalog & Search + Item Registration (Foundation)
2. **Phase 2**: Cart & Checkout (Core E2E Flow)
3. **Phase 3**: Agent Frontend Integration (Switch from Mocks)
4. **Phase 4**: Agent Backend LangChain Tools (Enable Actions)
5. **Phase 5**: ERP Simulation & Polish (Completeness)

Each phase includes:

- Features and flows covered
- Step-by-step tasks (schema, service, API, frontend, testing)
- Quality gates and exit criteria

---

## Phase 1: Catalog & Search + Item Registration

### Features Covered

- Browse catalog items (search, filter)
- View item details
- Register new items with duplicate detection

### Why First?

- **Foundation for all other features**: Cart, Checkout, and Agent all depend on catalog
- **Lowest risk**: No complex dependencies, straightforward CRUD
- **Quick wins**: Backend is complete, only frontend needs updates

### Tasks

#### 1.1 Schema/Model Verification

- [x] ✅ Verify `item.schema.ts` is complete
- [x] ✅ Verify `ItemModel` is exported in `models.ts`
- [x] ✅ Verify text index on `name`, `description`, `category`

**Status**: All schemas already complete ✓

#### 1.2 Service Layer Verification

- [x] ✅ `catalogService.searchItems()` works with keyword search
- [x] ✅ `catalogService.createItem()` validates and detects duplicates
- [x] ✅ `catalogService.getItemById()` fetches single item

**Status**: All services already complete ✓

#### 1.3 API Routes

**Existing Routes**:

- [x] ✅ `GET /api/items` - Search/list items
- [x] ✅ `POST /api/items` - Create item (with auth)

**New Routes Needed**:

- [ ] `GET /api/items/{id}` - Get single item by ID
  - **File**: `apps/web/app/(app)/api/items/[id]/route.ts`
  - **Handler**: Call `catalogService.getItemById()`
  - **Error handling**: 404 if not found

**Tasks**:

1. Create `apps/web/app/(app)/api/items/[id]/route.ts`
2. Implement `GET` handler with auth optional (public read)
3. Test with curl/Postman

#### 1.4 Frontend Integration

**File**: `apps/web/src/features/catalog/components/CatalogPageContent.tsx`

**Tasks**:

1. Add state for fetched items: `const [items, setItems] = useState<Item[]>([])`
2. Add `useEffect` to fetch items on mount:
   ```typescript
   useEffect(() => {
     async function loadItems() {
       setIsLoading(true);
       try {
         const response = await fetch('/api/items');
         const data = await response.json();
         setItems(data.items || []);
       } catch (error) {
         console.error('Error loading items:', error);
         toast.error('Failed to load catalog');
       } finally {
         setIsLoading(false);
       }
     }
     loadItems();
   }, []);
   ```
3. Replace `<CatalogTable data={mockItems} .../>` with `<CatalogTable data={items} .../>`
4. Remove `import { mockItems }` from file

**File**: `apps/web/src/features/catalog/components/ProductDetailPageContent.tsx`

**Option A (API Route)**:

1. Fetch item with `useEffect` calling `GET /api/items/{id}`
2. Show loading skeleton while fetching
3. Handle 404 with "Item not found" message

**Option B (Server Component - Recommended)**:

1. Convert to Server Component (remove `'use client'`)
2. Call `catalogService.getItemById()` directly
3. Return `notFound()` if item doesn't exist
4. Simpler and faster (no client fetch needed)

**Tasks for Item Registration Form**:

1. Locate form submission handler (likely in a Sheet/Dialog component)
2. Connect to `POST /api/items`:

   ```typescript
   async function handleSubmit(formData) {
     try {
       const response = await fetch('/api/items', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify(formData),
       });

       if (response.status === 409) {
         // Handle duplicate detection
         const { duplicates } = await response.json();
         showDuplicateWarning(duplicates);
         return;
       }

       if (!response.ok) {
         throw new Error('Failed to create item');
       }

       const item = await response.json();
       toast.success(`Item "${item.name}" created!`);
       refreshCatalog(); // Refetch catalog
     } catch (error) {
       console.error('Error creating item:', error);
       toast.error('Failed to create item');
     }
   }
   ```

3. Implement duplicate warning modal (show duplicates, ask for confirmation)
4. Refresh catalog list after successful creation

#### 1.5 Testing

**Service Tests** (Already Exist):

- [x] ✅ `tests/api/items.test.ts` covers catalog service

**New Tests Needed**:

- [ ] Test `GET /api/items/{id}` route
- [ ] Test frontend fetches items on mount
- [ ] Test frontend handles empty catalog
- [ ] Test frontend handles API errors
- [ ] Test item registration form submission
- [ ] Test duplicate warning modal

**Tasks**:

1. Add route test to `tests/api/items.test.ts`
2. Add frontend integration test (optional, if using React Testing Library)

#### 1.6 Quality Gates

**Commands**:

```bash
pnpm lint
pnpm format
pnpm type-check
pnpm test
pnpm build
```

**Manual Testing**:

1. Open catalog page, verify items load from DB
2. Search for items by keyword, verify results
3. Click item to view details
4. Create new item, verify appears in catalog
5. Try to create duplicate, verify warning shown
6. Refresh page, verify data persists

**Exit Criteria**:

- ✅ All quality commands pass
- ✅ Catalog loads real items from MongoDB
- ✅ Item registration works with duplicate detection
- ✅ No imports of `mockItems` remain in catalog components
- ✅ Data persists across page refreshes

---

## Phase 2: Cart & Checkout

### Features Covered

- Add items to cart (from catalog)
- View cart with items, quantities, total
- Update quantities, remove items
- Complete checkout, create purchase request
- Cart cleared after checkout

### Why Second?

- **Depends on Phase 1**: Need real catalog items to add to cart
- **Core E2E flow**: Enables full procurement workflow
- **Backend complete**: APIs all exist, only frontend needed

### Tasks

#### 2.1 Schema/Model Verification

- [x] ✅ Verify `cart.schema.ts` is complete
- [x] ✅ Verify `purchase-request.schema.ts` is complete
- [x] ✅ Verify `CartModel` and `PurchaseRequestModel` exported

**Status**: All schemas already complete ✓

#### 2.2 Service Layer Verification

- [x] ✅ `cartService.getCartForUser()` creates cart if needed
- [x] ✅ `cartService.addItemToCart()` validates item exists
- [x] ✅ `cartService.updateCartItemQuantity()` enforces limits
- [x] ✅ `cartService.removeCartItem()` removes item
- [x] ✅ `cartService.clearCart()` empties cart
- [x] ✅ `checkoutService.checkoutCart()` creates purchase request

**Status**: All services already complete ✓

#### 2.3 API Routes Verification

- [x] ✅ `GET /api/cart` - Fetch user's cart
- [x] ✅ `POST /api/cart/items` - Add item to cart
- [x] ✅ `PATCH /api/cart/items/{itemId}` - Update quantity
- [x] ✅ `DELETE /api/cart/items/{itemId}` - Remove item
- [x] ✅ `POST /api/checkout` - Complete checkout

**Status**: All APIs already complete ✓

#### 2.4 Frontend Integration

**File**: `apps/web/src/features/cart/components/CartPageContent.tsx`

**Tasks**:

1. **Load cart on mount**:

   ```typescript
   useEffect(() => {
     async function loadCart() {
       try {
         const response = await fetch('/api/cart');
         if (response.ok) {
           const cart = await response.json();
           setCartItems(cart.items || []);
         }
       } catch (error) {
         console.error('Error loading cart:', error);
         toast.error('Failed to load cart');
       }
     }
     loadCart();
   }, []);
   ```

2. **Add to cart from catalog** (in CatalogPageContent or product card):

   ```typescript
   async function handleAddToCart(itemId: string, quantity = 1) {
     try {
       const response = await fetch('/api/cart/items', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ itemId, quantity }),
       });

       if (!response.ok) {
         throw new Error('Failed to add to cart');
       }

       const cart = await response.json();
       toast.success('Added to cart!');
       updateCartContext(cart.items.length); // Update cart badge
     } catch (error) {
       console.error('Error adding to cart:', error);
       toast.error('Failed to add to cart');
     }
   }
   ```

3. **Update quantity**:

   ```typescript
   async function handleQuantityChange(itemId: string, newQuantity: number) {
     try {
       const response = await fetch(`/api/cart/items/${itemId}`, {
         method: 'PATCH',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ quantity: newQuantity }),
       });

       if (!response.ok) {
         throw new Error('Failed to update quantity');
       }

       const cart = await response.json();
       setCartItems(cart.items);
     } catch (error) {
       console.error('Error updating quantity:', error);
       toast.error('Failed to update quantity');
     }
   }
   ```

4. **Remove item**:

   ```typescript
   async function handleRemoveItem(itemId: string) {
     try {
       const response = await fetch(`/api/cart/items/${itemId}`, {
         method: 'DELETE',
       });

       if (!response.ok) {
         throw new Error('Failed to remove item');
       }

       const cart = await response.json();
       setCartItems(cart.items);
       toast.info('Item removed from cart');
     } catch (error) {
       console.error('Error removing item:', error);
       toast.error('Failed to remove item');
     }
   }
   ```

5. **Checkout**:

   ```typescript
   async function handleCheckout() {
     setIsCheckingOut(true);
     try {
       const response = await fetch('/api/checkout', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ notes: checkoutNotes }),
       });

       if (!response.ok) {
         throw new Error('Checkout failed');
       }

       const { purchaseRequest } = await response.json();

       // Show success with request number
       toast.success(
         `Purchase request ${purchaseRequest.requestNumber} submitted!`
       );

       // Clear cart and navigate
       setCartItems([]);
       router.push('/catalog');
     } catch (error) {
       console.error('Error during checkout:', error);
       toast.error('Checkout failed');
     } finally {
       setIsCheckingOut(false);
     }
   }
   ```

6. **Remove mock imports**:
   - Delete `import { mockCartItems }` from `CartPageContent.tsx`
   - Remove mock state initialization

**File**: `apps/web/src/contexts/CartContext.tsx`

**Tasks**:

1. Consider fetching cart count from API instead of local state
2. Or: Update count when cart operations complete

#### 2.5 Testing

**Service Tests** (Already Exist):

- [x] ✅ `tests/api/cart-and-checkout.test.ts` covers cart and checkout services

**New Tests Needed**:

- [ ] Test cart loads on page mount
- [ ] Test add to cart from catalog page
- [ ] Test quantity update persists
- [ ] Test remove item updates cart
- [ ] Test checkout creates purchase request
- [ ] Test cart is empty after checkout

**Tasks**:

1. Add frontend integration tests for cart workflows

#### 2.6 Quality Gates

**Commands**:

```bash
pnpm lint
pnpm format
pnpm type-check
pnpm test
pnpm build
```

**Manual Testing**:

1. Add item from catalog, verify appears in cart
2. Update quantity, verify persists after refresh
3. Remove item, verify removed from cart
4. Add multiple items, complete checkout
5. Verify purchase request created (check console/DB)
6. Verify cart is empty after checkout
7. Refresh page, verify cart remains empty

**Exit Criteria**:

- ✅ All quality commands pass
- ✅ Cart operations persist to MongoDB
- ✅ Checkout creates purchase request
- ✅ Cart cleared after successful checkout
- ✅ No imports of `mockCartItems` remain
- ✅ End-to-end flow works: Catalog → Cart → Checkout

---

## Phase 3: Agent Frontend Integration

### Features Covered

- Agent chat uses real API instead of mock responses
- Agent shows real catalog items (not mock items)
- Conversation history persists and can be resumed

### Why Third?

- **Depends on Phase 1 & 2**: Agent needs real catalog and cart APIs
- **User-facing improvement**: Makes agent functional with real data
- **Quick win**: Backend API exists, just need to switch frontend

### Tasks

#### 3.1 Service Layer Verification

- [x] ✅ `agentService.handleAgentMessage()` saves to DB
- [x] ✅ `agentService.listConversationsForUser()` works
- [x] ✅ Conversation history API exists

**Status**: Services complete, but `generateAgentResponse()` doesn't use tools yet (will address in Phase 4)

#### 3.2 API Routes Verification

- [x] ✅ `POST /api/agent/chat` - Send message to agent
- [x] ✅ `GET /api/agent/conversations` - List conversations

**Status**: APIs complete ✓

#### 3.3 Frontend Integration

**File**: `apps/web/src/features/agent/components/AgentChatPageContent.tsx`

**Tasks**:

1. **Replace mock response with API call**:

   ```typescript
   const handleSendMessage = async (content: string) => {
     if (!hasStarted) setHasStarted(true);

     const userMessage: AgentMessage = {
       id: `user-${Date.now()}`,
       role: 'user',
       content,
     };

     setMessages((prev) => [...prev, userMessage]);
     setIsLoading(true);

     try {
       const response = await fetch('/api/agent/chat', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({
           message: content,
           conversationId: conversationId, // Pass existing ID if resuming
         }),
       });

       if (!response.ok) {
         throw new Error('Agent request failed');
       }

       const { conversationId: newConversationId, messages: allMessages } =
         await response.json();

       // Update conversation ID if new
       if (!conversationId) {
         setConversationId(newConversationId);
       }

       // Extract agent's last message
       const agentMessage = allMessages[allMessages.length - 1];
       setMessages((prev) => [
         ...prev,
         {
           id: `agent-${Date.now()}`,
           role: 'assistant',
           content: agentMessage.content,
         },
       ]);
     } catch (error) {
       console.error('Error sending message:', error);
       const errorMessage: AgentMessage = {
         id: `error-${Date.now()}`,
         role: 'assistant',
         content: 'I apologize, but I encountered an error. Please try again.',
       };
       setMessages((prev) => [...prev, errorMessage]);
     } finally {
       setIsLoading(false);
     }
   };
   ```

2. **Load conversation messages when resuming**:

   ```typescript
   useEffect(() => {
     if (!conversationId) return;

     async function loadConversation() {
       try {
         // API to load full conversation would be: GET /api/agent/conversations/{id}
         // For now, we'll implement this in Phase 4 or rely on chat API returning all messages
       } catch (error) {
         console.error('Error loading conversation:', error);
       }
     }

     loadConversation();
   }, [conversationId]);
   ```

3. **Remove mock imports**:
   - Delete `import { generateMockAgentResponse } from '../mocks/mockAgent';`
   - Remove call to `generateMockAgentResponse(content)`

**File**: `apps/web/src/features/agent/mocks/mockAgent.ts`

**Tasks**:

1. Keep file for now (used in tests)
2. Add deprecation comment
3. Will be fully removed in Phase 4 after LangChain integration

#### 3.4 Testing

**Service Tests** (Already Exist):

- [x] ✅ `tests/api/agent.test.ts` covers agent service
- [x] ✅ `tests/api/agent-conversations.test.ts` covers conversation history

**New Tests Needed**:

- [ ] Test agent chat sends message to API
- [ ] Test agent response appears in chat
- [ ] Test conversation ID persists
- [ ] Test resuming conversation loads messages

**Tasks**:

1. Add frontend integration tests for agent chat

#### 3.5 Quality Gates

**Commands**:

```bash
pnpm lint
pnpm format
pnpm type-check
pnpm test
pnpm build
```

**Manual Testing**:

1. Send message in agent chat, verify response comes from API
2. Verify conversation appears in sidebar history
3. Refresh page, verify conversation still in sidebar
4. Click on past conversation, verify messages load (if implemented)
5. Verify agent mentions real items from catalog (though can't search yet - Phase 4)

**Exit Criteria**:

- ✅ All quality commands pass
- ✅ Agent chat uses `POST /api/agent/chat` API
- ✅ Conversations saved to MongoDB
- ✅ Conversation history works in sidebar
- ✅ No calls to `generateMockAgentResponse()` in production code
- ⚠️ Agent still can't execute actions (search, add to cart) - that's Phase 4

---

## Phase 4: Agent Backend LangChain Tools

### Features Covered

- Agent can search catalog via natural language
- Agent can add items to cart
- Agent can view cart
- Agent can complete checkout
- Agent can register new items
- Agent confirms actions before executing (BR-3.1)

### Why Fourth?

- **Depends on Phase 1-3**: Needs real catalog, cart, and agent frontend working
- **Complex integration**: Requires LangChain structured tool framework
- **High value**: Makes agent truly functional for procurement workflows

### Tasks

#### 4.1 LangChain Tool Setup

**File**: `apps/web/src/features/agent/lib/agent.service.ts`

**Tasks**:

1. **Install LangChain tools** (if not already):

   ```bash
   pnpm add @langchain/core
   ```

2. **Define tool schemas**:

   ```typescript
   import { DynamicStructuredTool } from '@langchain/core/tools';
   import { z } from 'zod';

   const searchCatalogTool = new DynamicStructuredTool({
     name: 'search_catalog',
     description:
       'Search for items in the procurement catalog by keyword. Returns matching items with name, description, price.',
     schema: z.object({
       keyword: z
         .string()
         .describe('Search keyword for item name, description, or category'),
       maxPrice: z
         .number()
         .optional()
         .describe('Maximum price filter (optional)'),
     }),
     func: async ({ keyword, maxPrice }) => {
       const items = await catalogService.searchItems({ q: keyword });
       const filtered = maxPrice
         ? items.filter((item) => item.price <= maxPrice)
         : items;
       return JSON.stringify(filtered.slice(0, 5)); // Limit to 5 results
     },
   });

   const addToCartTool = new DynamicStructuredTool({
     name: 'add_to_cart',
     description:
       "Add an item to the user's cart. Requires user confirmation before calling.",
     schema: z.object({
       itemId: z.string().describe('ID of the item to add'),
       quantity: z.number().default(1).describe('Quantity to add (default 1)'),
     }),
     func: async ({ itemId, quantity }, config) => {
       const userId = config?.userId; // Pass from context
       if (!userId) throw new Error('Authentication required');
       const cart = await cartService.addItemToCart(userId, {
         itemId,
         quantity,
       });
       return `Added ${quantity} item(s) to cart. Cart now has ${cart.items.length} items, total: $${cart.totalCost.toFixed(2)}`;
     },
   });

   const viewCartTool = new DynamicStructuredTool({
     name: 'view_cart',
     description: "View the user's current cart contents.",
     schema: z.object({}), // No parameters
     func: async (_, config) => {
       const userId = config?.userId;
       if (!userId) throw new Error('Authentication required');
       const cart = await cartService.getCartForUser(userId);
       return JSON.stringify({
         itemCount: cart.items.length,
         items: cart.items,
         totalCost: cart.totalCost,
       });
     },
   });

   const checkoutTool = new DynamicStructuredTool({
     name: 'checkout',
     description:
       'Complete checkout and create a purchase request. Requires user confirmation before calling.',
     schema: z.object({
       notes: z
         .string()
         .optional()
         .describe('Optional notes/justification for the purchase'),
     }),
     func: async ({ notes }, config) => {
       const userId = config?.userId;
       if (!userId) throw new Error('Authentication required');
       const purchaseRequest = await checkoutService.checkoutCart(
         userId,
         notes
       );
       return `Checkout complete! Purchase request ${purchaseRequest.id} created with ${purchaseRequest.items.length} items, total: $${purchaseRequest.totalCost.toFixed(2)}`;
     },
   });

   const registerItemTool = new DynamicStructuredTool({
     name: 'register_item',
     description:
       'Register a new item in the catalog. Requires user confirmation before calling.',
     schema: z.object({
       name: z.string().describe('Item name'),
       category: z.string().describe('Item category'),
       description: z.string().describe('Item description'),
       price: z.number().describe('Estimated price'),
     }),
     func: async ({ name, category, description, price }, config) => {
       const userId = config?.userId;
       try {
         const item = await catalogService.createItem({
           name,
           category,
           description,
           estimatedPrice: price,
           createdByUserId: userId,
         });
         return `Item "${item.name}" registered successfully with ID ${item.id}`;
       } catch (error) {
         if (error instanceof catalogService.DuplicateItemError) {
           return `Warning: Potential duplicates found. Please confirm if you want to proceed: ${JSON.stringify(error.duplicates)}`;
         }
         throw error;
       }
     },
   });

   const tools = [
     searchCatalogTool,
     addToCartTool,
     viewCartTool,
     checkoutTool,
     registerItemTool,
   ];
   ```

3. **Update `generateAgentResponse()` to use agent executor**:

   ```typescript
   import { ChatOpenAI } from '@langchain/openai';
   import { AgentExecutor, createOpenAIFunctionsAgent } from 'langchain/agents';
   import { ChatPromptTemplate } from '@langchain/core/prompts';

   async function generateAgentResponse(
     userMessage: string,
     conversationHistory: any[],
     userId?: string
   ): Promise<string> {
     try {
       // Build conversation context
       const history = conversationHistory
         .slice(-10)
         .map((msg: any) => `${msg.sender}: ${msg.content}`)
         .join('\n');

       // System prompt
       const systemPrompt = `You are a helpful procurement assistant for ProcureFlow.
   
   You can help users:
   - Search for items in the catalog
   - Register new items
   - Add items to their cart
   - View their cart
   - Complete checkout
   
   IMPORTANT:
   - Always confirm with the user before taking actions like adding to cart or checkout.
   - Ask clarifying questions if the user's intent is unclear.
   - Be conversational and helpful.
   - When suggesting items, show name, price, and brief description.`;

       const prompt = ChatPromptTemplate.fromMessages([
         ['system', systemPrompt],
         ['human', '{input}'],
       ]);

       const llm = new ChatOpenAI({
         modelName: 'gpt-4o-mini',
         temperature: 0.7,
       });

       const agent = await createOpenAIFunctionsAgent({
         llm,
         tools,
         prompt,
       });

       const executor = new AgentExecutor({
         agent,
         tools,
       });

       const result = await executor.invoke(
         {
           input: `${history ? `Previous conversation:\n${history}\n\n` : ''}User: ${userMessage}`,
         },
         {
           userId, // Pass userId to tools via config
         }
       );

       return (
         result.output ||
         'I apologize, but I encountered an issue processing your request.'
       );
     } catch (error) {
       console.error('Error generating agent response:', error);
       return 'I apologize, but I encountered a technical issue. Please try again.';
     }
   }
   ```

4. **Remove placeholder `executeTool()` function**:
   - Delete the unused `executeTool()` function
   - Tools are now called directly by LangChain

#### 4.2 Conversation Action Logging

**Tasks**:

1. Update conversation schema to log tool invocations
2. Save action records when tools are called:
   ```typescript
   conversation.actions.push({
     actionType: 'search_catalog',
     parameters: { keyword: 'laptop' },
     result: 'Found 5 items',
     createdAt: new Date(),
   });
   ```

#### 4.3 Testing

**New Tests Needed**:

- [ ] Test agent can search catalog
- [ ] Test agent can add items to cart
- [ ] Test agent can view cart
- [ ] Test agent can checkout
- [ ] Test agent can register items
- [ ] Test agent asks for confirmation before actions
- [ ] Test agent handles errors gracefully

**Tasks**:

1. Add integration tests in `tests/api/agent.test.ts`
2. Test each tool individually
3. Test multi-step workflows (search → add to cart → checkout)

#### 4.4 Quality Gates

**Commands**:

```bash
pnpm lint
pnpm format
pnpm type-check
pnpm test
pnpm build
```

**Manual Testing**:

1. Ask agent: "Find laptops under $1500" → Verify searches catalog
2. Ask agent: "Add the Dell laptop to my cart" → Verify adds to cart
3. Ask agent: "Show my cart" → Verify displays cart contents
4. Ask agent: "Checkout my cart" → Verify creates purchase request
5. Verify agent asks for confirmation before adding/checkout
6. Verify agent handles "no items found" gracefully
7. Verify agent explains what it's doing

**Exit Criteria**:

- ✅ All quality commands pass
- ✅ Agent can execute all tools via natural language
- ✅ Agent confirms actions before executing
- ✅ Agent logs actions to conversation record
- ✅ Mock agent logic deprecated (only used in tests)
- ✅ End-to-end agent flow works: Search → Add to cart → Checkout

---

## Phase 5: ERP Simulation & Polish

### Features Covered

- Purchase request history view
- Purchase request detail view
- Item detail page polish
- Error handling improvements
- Loading state improvements

### Why Last?

- **Depends on all previous phases**: Needs full E2E flow working
- **Polish and UX**: Not blocking core functionality
- **Nice-to-have features**: Improves user experience

### Tasks

#### 5.1 Purchase Request History

**New API Route**: `GET /api/purchase-requests`

**File**: `apps/web/app/(app)/api/purchase-requests/route.ts`

**Tasks**:

1. Create route handler
2. Call new service function: `purchaseRequestService.listForUser(userId)`
3. Return user's purchase requests sorted by most recent

**New Service Function**:

**File**: `apps/web/src/features/checkout/lib/checkout.service.ts`

**Tasks**:

1. Add `listPurchaseRequestsForUser()`:
   ```typescript
   export async function listPurchaseRequestsForUser(
     userId: string,
     limit = 20
   ): Promise<PurchaseRequest[]> {
     await connectDB();
     const requests = await PurchaseRequestModel.find({ userId })
       .sort({ createdAt: -1 })
       .limit(limit)
       .lean()
       .exec();
     return requests.map(mapToPurchaseRequest);
   }
   ```

**New Page**: `apps/web/app/(app)/purchases/page.tsx`

**Tasks**:

1. Create Server Component that fetches purchase requests
2. Display table with: request number, date, item count, total, status
3. Link to detail page

**New Detail Page**: `apps/web/app/(app)/purchases/[id]/page.tsx`

**Tasks**:

1. Create Server Component that fetches single purchase request
2. Display: request number, date, items with quantities and prices, total, notes

#### 5.2 Item Detail Page Polish

**File**: `apps/web/app/(app)/catalog/[itemId]/page.tsx`

**Tasks**:

1. Convert to Server Component (if not already)
2. Call `catalogService.getItemById()` directly
3. Use `notFound()` if item doesn't exist
4. Add breadcrumbs: Catalog → [Category] → [Item Name]
5. Show item details, price, description
6. Add "Add to Cart" button (with quantity selector)

#### 5.3 Error Handling Improvements

**Tasks**:

1. Add global error boundary for React errors
2. Add API error handler middleware (if applicable)
3. Improve error messages shown to users (less technical)
4. Add retry logic for transient failures
5. Add offline detection and messaging

#### 5.4 Loading State Improvements

**Tasks**:

1. Add skeleton loaders for catalog table
2. Add skeleton loaders for cart items
3. Add loading spinner for agent responses
4. Add progress indicator for checkout
5. Add optimistic updates for cart operations (optional)

#### 5.5 Deprecate Mock Files

**Tasks**:

1. Delete or deprecate unused mock files:
   - `src/features/catalog/mock.ts` (keep for tests if needed)
   - `src/features/cart/mock.ts` (keep for tests if needed)
   - `src/features/agent/mocks/mockItems.ts` (can delete)
2. Update `index.ts` exports to remove mock exports
3. Add deprecation warnings in comments if keeping for tests

#### 5.6 Quality Gates

**Commands**:

```bash
pnpm lint
pnpm format
pnpm type-check
pnpm test
pnpm build
```

**Manual Testing**:

1. Complete full workflow: Browse → Add to cart → Checkout
2. View purchase history, verify all requests shown
3. Click purchase request, verify details correct
4. Test error scenarios: network offline, invalid item ID, etc.
5. Verify loading states show correctly
6. Verify no mock data visible in any UI

**Exit Criteria**:

- ✅ All quality commands pass
- ✅ Purchase history page works
- ✅ All error scenarios handled gracefully
- ✅ All loading states polished
- ✅ No mock data in production flows
- ✅ All critical TODO comments resolved

---

## Summary of Deliverables

### Phase 1

- [x] Schemas verified
- [ ] `GET /api/items/{id}` route implemented
- [ ] Catalog page fetches from API
- [ ] Item detail page uses API or Server Component
- [ ] Item registration form uses API
- [ ] Tests updated

### Phase 2

- [x] Schemas verified
- [x] APIs verified
- [ ] Cart page fetches from API
- [ ] Add to cart uses API
- [ ] Quantity/remove uses API
- [ ] Checkout uses API
- [ ] Tests updated

### Phase 3

- [x] APIs verified
- [ ] Agent chat uses API instead of mocks
- [ ] Conversation loading implemented
- [ ] Tests updated

### Phase 4

- [ ] LangChain tools defined
- [ ] Agent executor implemented
- [ ] Tools wired to services
- [ ] Confirmation flow added
- [ ] Action logging added
- [ ] Tests updated

### Phase 5

- [ ] Purchase history page created
- [ ] Item detail page polished
- [ ] Error handling improved
- [ ] Loading states polished
- [ ] Mock files deprecated
- [ ] Final polish complete

---

## Risk Mitigation

### High-Risk Items

1. **LangChain tool integration** (Phase 4) - Complex, may need iteration
   - **Mitigation**: Start with 1-2 tools, expand incrementally
   - **Fallback**: Keep basic LLM responses if tools fail

2. **Cart state synchronization** (Phase 2) - Race conditions possible
   - **Mitigation**: Use optimistic updates with rollback on error
   - **Testing**: Test concurrent cart operations

3. **Agent confirmation flow** (Phase 4) - UX needs careful design
   - **Mitigation**: Follow BR-3.1, test with real users
   - **Iteration**: May need refinement based on feedback

### Medium-Risk Items

1. **Performance with large catalogs** - Search may be slow
   - **Mitigation**: Add pagination, limit results
   - **Future**: Add caching layer

2. **Mobile responsiveness** - Cart and catalog may need mobile optimization
   - **Mitigation**: Test on mobile devices, adjust layouts

---

## Timeline Estimate

| Phase     | Estimated Effort | Dependencies     |
| --------- | ---------------- | ---------------- |
| Phase 1   | 1-2 days         | None             |
| Phase 2   | 1-2 days         | Phase 1          |
| Phase 3   | 0.5-1 day        | Phase 1, 2       |
| Phase 4   | 2-3 days         | Phase 1, 2, 3    |
| Phase 5   | 1-2 days         | Phase 1, 2, 3, 4 |
| **Total** | **5.5-10 days**  | Sequential       |

**Assumptions**:

- 1 developer working full-time
- Includes testing and documentation
- Excludes major refactoring or new features

---

## Next Steps

1. **Review and approve** this plan
2. **Create implementation tasks** in project management tool
3. **Begin Phase 1** with catalog integration
4. **Iterate and refine** based on learnings

---

**End of Integration Plan**
