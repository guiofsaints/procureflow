# Product Requirements Document: Functional Requirements

## Executive Summary

Comprehensive functional requirements for ProcureFlow v1.0 covering catalog management (search, registration, duplicate detection), shopping cart operations (CRUD, analytics), checkout flow (PR generation, validation), AI agent capabilities (8 tools, conversation management), and authentication (NextAuth.js, session handling). Each requirement includes trigger conditions, happy path, edge cases, and measurable acceptance criteria. Requirements organized by domain: Catalog (FR-CAT), Cart (FR-CART), Checkout (FR-CHECK), Agent (FR-AGENT), Auth (FR-AUTH). Total: 28 functional requirements mapped to 12 must-have features from objectives document.

---

## Requirement Format

Each functional requirement follows this structure:

- **FR-ID**: Unique identifier (e.g., FR-CAT-001)
- **Feature**: Reference to feature in objectives document
- **Trigger**: User action or system event that initiates the flow
- **Happy Path**: Successful execution steps
- **Edge Cases**: Error conditions, boundary cases, invalid inputs
- **Acceptance Criteria**: Testable conditions for completion

---

## FR-CAT: Catalog Management Requirements

### FR-CAT-001: Full-Text Catalog Search

**Feature**: F-CAT-001 (Catalog Search)

**Trigger**: User enters search query in catalog search field or agent receives natural language search request

**Happy Path**:
1. User enters search term (e.g., "office chair")
2. System performs MongoDB text search across name, description, category fields
3. System applies text index field weights (name: 10, category: 5, description: 1)
4. System returns matching items sorted by relevance score (descending)
5. System limits results to 50 items (default) or user-specified limit
6. UI displays results with name, category, price, description preview

**Edge Cases**:
- **Empty Query**: Return all items (limit 50) sorted by createdAt descending
- **No Results**: Return empty array with count: 0, display "No items found" message
- **Special Characters**: Escape MongoDB special characters ($, ., etc.)
- **Very Long Query**: Truncate to 200 characters, proceed with search
- **Text Index Missing**: Return 500 error with message "Text index not configured, run db:create-text-index"

**Acceptance Criteria**:
- [ ] Search returns results in < 500ms for queries with < 100 matching items (p95)
- [ ] Relevance scoring prioritizes exact name matches over description matches
- [ ] Empty query returns first 50 items by creation date
- [ ] Search is case-insensitive ("Chair" matches "chair")
- [ ] Special characters are handled safely without MongoDB injection

---

### FR-CAT-002: Item Registration with Duplicate Detection

**Feature**: F-CAT-002 (Item Registration)

**Trigger**: User submits "Register New Item" form with name, category, description, estimated price

**Happy Path**:
1. User fills required fields: name, category, description, estimatedPrice
2. User optionally fills: unit, preferredSupplier
3. System validates input fields (see validation rules below)
4. System searches for potential duplicates (case-insensitive name + category match)
5. If duplicates found, system returns HTTP 409 with duplicate list and confirmation required flag
6. User reviews duplicates and explicitly confirms creation
7. System creates item with status "Active", createdByUserId = current user
8. System returns HTTP 201 with created item including generated MongoDB ObjectId

**Edge Cases**:
- **Missing Required Field**: Return 400 with field-specific error message
- **Price ≤ 0**: Return 400 "estimatedPrice must be greater than 0"
- **Name Too Short** (< 2 chars): Return 400 "name must be at least 2 characters"
- **Description Too Short** (< 10 chars): Return 400 "description must be at least 10 characters"
- **Exact Duplicate** (same name + category, case-insensitive): Return 409 with existing item in duplicates array
- **Duplicate Confirmation Without Flag**: Return 400 "Potential duplicates found, set confirmDuplicate=true to proceed"
- **Unauthenticated User**: Return 401 "Authentication required"

**Validation Rules**:
- `name`: String, 2-200 characters, required
- `category`: String, 2-100 characters, required
- `description`: String, 10-2000 characters, required
- `estimatedPrice`: Number, > 0, required
- `unit`: String, 1-50 characters, optional
- `preferredSupplier`: String, 2-200 characters, optional

**Acceptance Criteria**:
- [ ] Duplicate detection compares name + category in case-insensitive manner
- [ ] System prevents creation of exact duplicates without explicit confirmation
- [ ] Item creation completes in < 1 second (p95)
- [ ] createdByUserId is set to authenticated user's ID
- [ ] Item status defaults to "Active"
- [ ] createdAt and updatedAt timestamps are automatically set

---

### FR-CAT-003: Retrieve Single Catalog Item

**Feature**: F-CAT-001 (Catalog Search)

**Trigger**: User clicks on item in search results or agent retrieves item details by ID

**Happy Path**:
1. User requests item by MongoDB ObjectId (e.g., `/api/items/{id}`)
2. System validates ID is valid ObjectId format
3. System queries MongoDB for item by ID
4. System returns HTTP 200 with complete item details (all fields)

**Edge Cases**:
- **Invalid ObjectId Format**: Return 400 "Invalid item ID format"
- **Item Not Found**: Return 404 "Item not found"
- **Deleted Item**: Return 404 (no soft delete in v1.0)

**Acceptance Criteria**:
- [ ] Item retrieval completes in < 100ms (p95)
- [ ] All item fields are returned (id, name, category, description, price, unit, status, supplier, createdBy, timestamps)
- [ ] Invalid ObjectId format returns 400 before database query

---

## FR-CART: Shopping Cart Requirements

### FR-CART-001: Add Item to Cart

**Feature**: F-CART-001 (Shopping Cart)

**Trigger**: User clicks "Add to Cart" button or agent executes add_to_cart tool

**Happy Path**:
1. User specifies itemId and quantity (default: 1)
2. System validates user is authenticated
3. System validates itemId exists in catalog
4. System validates quantity is integer between 1 and 999 (BR-2.2)
5. System retrieves or creates user's cart
6. If item already in cart, system updates quantity (add to existing)
7. If item not in cart, system adds new cart item with snapshot (name, unitPrice from catalog)
8. System recalculates cart totalCost (sum of all item subtotals)
9. System saves cart to MongoDB
10. System returns HTTP 200 with updated cart

**Edge Cases**:
- **Item Not Found**: Return 404 "Item not found in catalog"
- **Quantity < 1**: Return 400 "Quantity must be at least 1"
- **Quantity > 999**: Return 400 "Quantity cannot exceed 999"
- **Non-Integer Quantity**: Return 400 "Quantity must be an integer"
- **Unauthenticated User**: Return 401 "Authentication required"
- **Cart Has 50+ Unique Items**: Return 400 "Cart item limit reached (50 unique items max)" (future limit)

**Acceptance Criteria**:
- [ ] Item price is captured from catalog at time of add (not referenced)
- [ ] Adding same item twice combines quantities
- [ ] Cart totalCost is accurately calculated as sum of (unitPrice × quantity) for all items
- [ ] addedAt timestamp is set to current UTC time
- [ ] Operation completes in < 500ms (p95)

---

### FR-CART-002: Update Cart Item Quantity

**Feature**: F-CART-001 (Shopping Cart)

**Trigger**: User changes quantity in cart UI or agent executes update_cart_item tool

**Happy Path**:
1. User specifies itemId and new quantity
2. System validates user is authenticated
3. System retrieves user's cart
4. System finds cart item by itemId
5. System validates new quantity is integer between 1 and 999
6. System updates cart item quantity
7. System recalculates item subtotal and cart totalCost
8. System saves cart to MongoDB
9. System returns HTTP 200 with updated cart

**Edge Cases**:
- **Item Not in Cart**: Return 404 "Item not found in cart"
- **Quantity < 1**: Return 400 "Quantity must be at least 1" (use remove instead)
- **Quantity > 999**: Return 400 "Quantity cannot exceed 999"
- **Empty Cart**: Return 404 "Cart is empty"
- **Unauthenticated User**: Return 401 "Authentication required"

**Acceptance Criteria**:
- [ ] Quantity update recalculates subtotal immediately
- [ ] totalCost reflects new quantity before response
- [ ] updatedAt timestamp is refreshed
- [ ] Operation completes in < 300ms (p95)

---

### FR-CART-003: Remove Item from Cart

**Feature**: F-CART-001 (Shopping Cart)

**Trigger**: User clicks "Remove" button or agent executes remove_from_cart tool

**Happy Path**:
1. User specifies itemId to remove
2. System validates user is authenticated
3. System retrieves user's cart
4. System removes item from cart.items array
5. System recalculates cart totalCost
6. System saves cart to MongoDB
7. System returns HTTP 200 with updated cart

**Edge Cases**:
- **Item Not in Cart**: Return 404 "Item not found in cart" (idempotent: no error if already removed)
- **Last Item Removed**: Cart remains with empty items array, totalCost = 0
- **Unauthenticated User**: Return 401 "Authentication required"

**Acceptance Criteria**:
- [ ] Removing last item results in empty cart, not cart deletion
- [ ] totalCost recalculates to 0 when last item removed
- [ ] Operation is idempotent (removing non-existent item returns success)
- [ ] Operation completes in < 300ms (p95)

---

### FR-CART-004: Retrieve User Cart

**Feature**: F-CART-001 (Shopping Cart)

**Trigger**: User navigates to cart page or agent executes view_cart tool

**Happy Path**:
1. User requests cart (GET /api/cart)
2. System validates user is authenticated
3. System retrieves user's cart from MongoDB (or creates empty cart if none exists)
4. System returns HTTP 200 with cart including all items, totalCost, item count

**Edge Cases**:
- **No Cart Exists**: Create and return empty cart with items: [], totalCost: 0
- **Unauthenticated User**: Return 401 "Authentication required"
- **Cart Items Reference Deleted Catalog Items**: Return cart as-is (snapshot preserves data)

**Acceptance Criteria**:
- [ ] Empty cart is created on first retrieval if none exists
- [ ] All cart item fields are returned (itemId, name, unitPrice, quantity, subtotal, addedAt)
- [ ] Cart totalCost matches sum of all item subtotals
- [ ] Operation completes in < 200ms (p95)

---

### FR-CART-005: Get Cart Analytics

**Feature**: F-CART-002 (Cart Analytics)

**Trigger**: User views cart summary or agent executes analyze_cart tool

**Happy Path**:
1. User requests cart analytics (or included in cart retrieval)
2. System calculates:
   - `itemCount`: Total quantity across all items (sum of quantities)
   - `uniqueItemCount`: Number of distinct items in cart
   - `totalCost`: Sum of all subtotals
   - `averageItemPrice`: totalCost / itemCount
3. System returns analytics object

**Edge Cases**:
- **Empty Cart**: itemCount = 0, uniqueItemCount = 0, totalCost = 0, averageItemPrice = 0
- **Single Item with Quantity 10**: itemCount = 10, uniqueItemCount = 1

**Acceptance Criteria**:
- [ ] itemCount sums quantities (not unique items)
- [ ] uniqueItemCount counts distinct itemIds
- [ ] averageItemPrice handles division by zero (return 0 for empty cart)
- [ ] Calculations are accurate to 2 decimal places

---

### FR-CART-006: Clear Cart After Checkout

**Feature**: F-CART-001 (Shopping Cart)

**Trigger**: Checkout completes successfully

**Happy Path**:
1. System completes checkout and creates purchase request
2. System retrieves user's cart
3. System sets cart.items = []
4. System sets cart.totalCost = 0
5. System saves empty cart to MongoDB

**Edge Cases**:
- **Checkout Fails**: Cart is NOT cleared (transaction rollback)
- **Cart Already Empty**: No-op, continue checkout flow

**Acceptance Criteria**:
- [ ] Cart is cleared atomically with purchase request creation
- [ ] Failed checkout does not clear cart
- [ ] User can immediately start new cart after checkout

---

## FR-CHECK: Checkout Requirements

### FR-CHECK-001: Validate Cart Before Checkout

**Feature**: F-CHECK-001 (Checkout Flow)

**Trigger**: User clicks "Checkout" button

**Happy Path**:
1. User initiates checkout
2. System validates user is authenticated
3. System retrieves user's cart
4. System validates cart has at least 1 item (BR-2.1)
5. System validates all cart items still exist in catalog (integrity check)
6. System proceeds to purchase request creation

**Edge Cases**:
- **Empty Cart**: Return 400 "Cart is empty, cannot checkout"
- **Cart Item References Deleted Catalog Item**: Proceed anyway (snapshot is valid)
- **Unauthenticated User**: Return 401 "Authentication required"

**Acceptance Criteria**:
- [ ] Empty cart is rejected with clear error message
- [ ] Validation completes in < 100ms (p95)
- [ ] Deleted catalog items do not block checkout (snapshot-based)

---

### FR-CHECK-002: Generate Purchase Request

**Feature**: F-CHECK-001 (Checkout Flow)

**Trigger**: Cart validation passes

**Happy Path**:
1. System generates unique purchase request ID (MongoDB ObjectId)
2. System generates sequential request number (format: PR-YYYY-NNNN, e.g., PR-2025-0042)
3. System creates immutable item snapshots from cart items:
   - itemId, itemName, itemCategory, itemDescription, unitPrice, quantity, subtotal
4. System captures optional user notes from request body
5. System sets PR status to "Submitted"
6. System sets source to "ui" or "agent" based on request origin
7. System saves purchase request to MongoDB
8. System clears user's cart (FR-CART-006)
9. System returns HTTP 201 with purchase request

**Edge Cases**:
- **Request Number Collision** (race condition): Retry with incremented number (max 3 retries)
- **MongoDB Insert Fails**: Return 500 "Failed to create purchase request", do NOT clear cart
- **Notes Exceed 2000 Characters**: Truncate to 2000 characters with warning

**Acceptance Criteria**:
- [ ] Request number is unique and sequential
- [ ] Item snapshots are immutable (changes to catalog do not affect PR)
- [ ] All cart item fields are copied to PR items (itemName, itemCategory, itemDescription, unitPrice, quantity)
- [ ] PR total matches cart totalCost at time of checkout
- [ ] Cart is cleared only after PR is successfully saved
- [ ] Operation completes in < 2 seconds (p95)

---

### FR-CHECK-003: Retrieve Purchase Request List

**Feature**: F-CHECK-002 (Purchase History)

**Trigger**: User navigates to purchase history page

**Happy Path**:
1. User requests purchase history (GET /api/purchase)
2. System validates user is authenticated
3. System queries MongoDB for all PRs where userId = current user
4. System sorts PRs by createdAt descending (newest first)
5. System returns HTTP 200 with PR list

**Edge Cases**:
- **No Purchase Requests**: Return empty array
- **Unauthenticated User**: Return 401 "Authentication required"
- **Pagination Not Implemented**: Return all PRs (future: add limit/offset)

**Acceptance Criteria**:
- [ ] Only user's own PRs are returned (no data leakage)
- [ ] PRs are sorted by creation date (newest first)
- [ ] All PR fields are returned (id, requestNumber, items, total, notes, status, source, timestamps)
- [ ] Operation completes in < 500ms for users with < 100 PRs (p95)

---

### FR-CHECK-004: Retrieve Single Purchase Request

**Feature**: F-CHECK-002 (Purchase History)

**Trigger**: User clicks on purchase request in history list

**Happy Path**:
1. User requests PR by ID (GET /api/purchase/{id})
2. System validates user is authenticated
3. System retrieves PR by MongoDB ObjectId
4. System validates PR belongs to current user
5. System returns HTTP 200 with complete PR details

**Edge Cases**:
- **Invalid ObjectId Format**: Return 400 "Invalid purchase request ID format"
- **PR Not Found**: Return 404 "Purchase request not found"
- **PR Belongs to Different User**: Return 403 "Access denied"
- **Unauthenticated User**: Return 401 "Authentication required"

**Acceptance Criteria**:
- [ ] Users can only view their own PRs (authorization check)
- [ ] All PR item snapshots are returned with full details
- [ ] Operation completes in < 200ms (p95)

---

## FR-AGENT: AI Agent Requirements

### FR-AGENT-001: Natural Language Search

**Feature**: F-AGENT-001 (Conversational Search)

**Trigger**: User sends message with intent to search (e.g., "Find office chairs under $200")

**Happy Path**:
1. User sends natural language message
2. Agent (LLM) extracts search intent, keywords, and constraints (price, quantity)
3. Agent calls `search_catalog` tool with extracted keywords
4. Tool executes FR-CAT-001 (catalog search)
5. Agent receives search results
6. Agent formats response with item count and brief explanation (BR-3.2)
7. Agent returns message with items metadata for UI rendering

**Edge Cases**:
- **Ambiguous Intent**: Agent asks clarifying question (e.g., "Did you mean office chairs or desk chairs?")
- **No Keywords Extracted**: Agent asks "What type of item are you looking for?"
- **Search Returns No Results**: Agent says "I couldn't find any items matching '{keywords}'. Would you like to search for something else?"
- **LLM API Failure**: Return fallback message "I'm having trouble processing your request. Please try searching using the catalog page."

**Acceptance Criteria**:
- [ ] Agent correctly extracts keywords from 90% of common search queries
- [ ] Agent provides brief explanation of search results (e.g., "I found 5 office chairs")
- [ ] Items are attached to message for UI rendering (product cards)
- [ ] Agent response latency < 5 seconds excluding LLM API time (p95)

---

### FR-AGENT-002: Conversational Item Registration

**Feature**: F-AGENT-002 (Item Registration via Agent)

**Trigger**: User sends message with intent to register item (e.g., "Add a new item: ergonomic mouse, $45")

**Happy Path**:
1. User expresses intent to register new item
2. Agent extracts item details (name, category, description, price)
3. If required fields missing, agent asks for them (e.g., "What category is the ergonomic mouse?")
4. Once all required fields collected, agent calls `register_item` tool
5. Tool executes FR-CAT-002 (item registration with duplicate detection)
6. If duplicates found (HTTP 409), agent shows duplicates and asks for confirmation
7. If user confirms, agent retries with confirmDuplicate flag
8. Agent confirms successful creation with item name and ID

**Edge Cases**:
- **Missing Required Fields**: Agent asks up to 3 follow-up questions to collect fields
- **User Abandons Registration**: After 3 unanswered questions, agent says "Item registration cancelled"
- **Duplicate Detected**: Agent shows duplicates and asks "These similar items exist. Do you still want to create '{name}'?"
- **User Declines After Duplicates**: Agent says "Item registration cancelled"
- **Price Validation Fails**: Agent asks "The price must be greater than $0. What's the correct price?"

**Acceptance Criteria**:
- [ ] Agent collects all required fields through conversation
- [ ] Agent presents duplicate warnings before creation
- [ ] Agent requires explicit user confirmation after showing duplicates
- [ ] Confirmation flow complies with BR-3.1 (explicit confirmation for critical actions)

---

### FR-AGENT-003: Conversational Add to Cart

**Feature**: F-AGENT-002 (Conversational Add to Cart)

**Trigger**: User sends message with intent to add item to cart (e.g., "Add 2 of those office chairs to my cart")

**Happy Path**:
1. User expresses intent to add item (by name, from recent search, or by ID)
2. Agent identifies item (from conversation context or by searching)
3. Agent extracts quantity (default: 1)
4. Agent asks for confirmation: "Add {quantity} × {itemName} ({price} each) to your cart?"
5. User confirms (e.g., "yes", "add it", "confirm")
6. Agent calls `add_to_cart` tool with itemId and quantity
7. Tool executes FR-CART-001 (add to cart)
8. Agent confirms success: "Added {quantity} × {itemName} to your cart. Your cart now has {cartItemCount} items totaling ${cartTotal}."

**Edge Cases**:
- **Ambiguous Item Reference**: Agent asks "I found 3 items matching 'chair'. Which one? (1) Office Chair - $120, (2) Executive Chair - $350, (3) Desk Chair - $95"
- **Item Not Found**: Agent says "I couldn't find '{itemName}' in the catalog. Would you like to search or register a new item?"
- **User Declines Confirmation**: Agent says "Item not added to cart"
- **Quantity Not Specified**: Agent defaults to quantity = 1
- **Invalid Quantity**: Agent asks "Quantity must be between 1 and 999. How many would you like?"

**Acceptance Criteria**:
- [ ] Agent requires explicit confirmation before adding to cart (BR-3.1)
- [ ] Confirmation prompt shows item name, quantity, price
- [ ] Agent confirms action with updated cart summary (BR-3.2)
- [ ] Agent handles ambiguous item references with clarifying questions (BR-3.3)

---

### FR-AGENT-004: Conversational Checkout

**Feature**: F-AGENT-003 (Conversational Checkout)

**Trigger**: User sends message with intent to checkout (e.g., "Checkout", "Complete my purchase")

**Happy Path**:
1. User expresses checkout intent
2. Agent calls `view_cart` tool to get current cart
3. Agent validates cart is not empty
4. Agent shows checkout summary with all items, quantities, prices, total
5. Agent asks for confirmation: "Proceed with checkout? Your purchase request will be submitted for {totalCost} ({itemCount} items)."
6. User confirms explicitly
7. Agent asks for optional notes: "Would you like to add any notes or justification for this purchase?"
8. User provides notes or declines
9. Agent calls `checkout` tool with notes
10. Tool executes FR-CHECK-001 and FR-CHECK-002
11. Agent confirms successful checkout: "Purchase request {requestNumber} submitted successfully! Your cart has been cleared."

**Edge Cases**:
- **Empty Cart**: Agent says "Your cart is empty. Add items before checking out."
- **User Declines Confirmation**: Agent says "Checkout cancelled"
- **Checkout Fails** (e.g., database error): Agent says "Checkout failed: {errorMessage}. Your cart was not cleared. Please try again."
- **Notes Too Long** (> 2000 chars): Agent truncates with warning

**Acceptance Criteria**:
- [ ] Agent requires two explicit confirmations: checkout intent + final confirmation after summary (BR-3.1)
- [ ] Checkout summary shows all cart items with prices and total
- [ ] Agent provides purchase request number after success (BR-3.2)
- [ ] Failed checkout preserves cart contents
- [ ] Agent attaches purchase request metadata to message for UI rendering

---

### FR-AGENT-005: Agent Memory and Context

**Feature**: F-AGENT-004 (Agent Memory)

**Trigger**: User sends any message in ongoing conversation

**Happy Path**:
1. User sends message in existing conversation
2. System retrieves conversation history from MongoDB
3. System includes last N messages in LLM context (N configurable, default: 10)
4. Agent uses conversation history to understand context and references
5. Agent responds with awareness of previous actions (e.g., "I previously added office chairs to your cart")

**Edge Cases**:
- **First Message in Conversation**: No history, agent starts fresh
- **Very Long Conversation** (> 50 messages): Truncate to last 50 messages to stay within token limits
- **Conversation Not Found**: Create new conversation
- **User References Out-of-Context Message**: Agent politely asks for clarification

**Acceptance Criteria**:
- [ ] Agent remembers cart contents from previous messages
- [ ] Agent can reference items from recent search results
- [ ] Conversation history is persisted to MongoDB after each exchange
- [ ] Token budget management prevents context window overflow

---

### FR-AGENT-006: Conversation Management

**Feature**: F-AGENT-004 (Agent Memory)

**Trigger**: User views conversation list in settings or starts new conversation

**Happy Path**:
1. **List Conversations**: User requests conversation history (GET /api/agent/conversations)
2. System returns all user's conversations sorted by updatedAt descending
3. **Create Conversation**: User sends first message, system creates conversation in MongoDB
4. **Retrieve Conversation**: User opens existing conversation, system loads messages
5. **Delete Conversation**: User deletes conversation, system soft-deletes or hard-deletes (TBD)

**Edge Cases**:
- **No Conversations**: Return empty array
- **Conversation Belongs to Different User**: Return 403 "Access denied"
- **Delete Active Conversation**: Mark as inactive, preserve for audit

**Acceptance Criteria**:
- [ ] Users can only access their own conversations
- [ ] Conversation list shows creation date, last update, message count
- [ ] Conversations persist across sessions

---

### FR-AGENT-007: Tool Execution Logging

**Feature**: F-AGENT-004 (Agent Memory)

**Trigger**: Agent executes any tool (search, register, add_to_cart, etc.)

**Happy Path**:
1. Agent decides to call tool (e.g., search_catalog)
2. System logs action to conversation.actions array:
   - actionType (e.g., "search_catalog")
   - parameters (e.g., {query: "office chairs", limit: 10})
   - timestamp
3. Tool executes and returns result
4. System logs result or error to action record
5. Agent uses result to formulate response

**Edge Cases**:
- **Tool Execution Fails**: Log error message, agent apologizes and suggests alternative
- **Tool Returns Unexpected Data**: Log warning, agent handles gracefully

**Acceptance Criteria**:
- [ ] All tool calls are logged with parameters and results
- [ ] Action logs are queryable for debugging
- [ ] Failed tool executions are logged with error details
- [ ] Action logs include execution timestamps

---

## FR-AUTH: Authentication Requirements

### FR-AUTH-001: User Registration

**Feature**: F-AUTH-001 (User Authentication)

**Trigger**: User submits registration form with email, password, name

**Happy Path**:
1. User provides email, password, name
2. System validates email format (RFC 5322 compliant)
3. System validates email is unique (no existing user)
4. System validates password is at least 6 characters
5. System hashes password with bcrypt (salt rounds: 10)
6. System creates user in MongoDB with hashed password
7. System returns HTTP 201 with user ID (password hash excluded)

**Edge Cases**:
- **Email Already Exists**: Return 400 "Email already registered"
- **Invalid Email Format**: Return 400 "Invalid email format"
- **Weak Password** (< 6 chars): Return 400 "Password must be at least 6 characters"
- **Password Exceeds 72 Bytes** (bcrypt limit): Return 400 "Password too long"

**Acceptance Criteria**:
- [ ] Password is hashed with bcrypt before storage
- [ ] Password hash is never returned in API responses
- [ ] Email uniqueness is enforced at database level
- [ ] User registration completes in < 1 second (p95)

---

### FR-AUTH-002: User Login

**Feature**: F-AUTH-001 (User Authentication)

**Trigger**: User submits login form with email and password

**Happy Path**:
1. User provides email and password
2. System queries MongoDB for user by email
3. System retrieves user's password hash
4. System compares provided password with hash using bcrypt.compare()
5. If match, system creates NextAuth.js session with JWT
6. System sets session cookie with 30-day expiration
7. System redirects to catalog page

**Edge Cases**:
- **User Not Found**: Return 401 "Invalid email or password" (do not reveal which)
- **Password Mismatch**: Return 401 "Invalid email or password"
- **Account Locked** (future): Return 403 "Account locked due to multiple failed login attempts"

**Acceptance Criteria**:
- [ ] Failed login does not reveal whether email exists (security best practice)
- [ ] Session cookie is HTTP-only and Secure (in production)
- [ ] Session expiration is configurable (default: 30 days)
- [ ] Login completes in < 500ms (p95)

---

### FR-AUTH-003: Session Validation

**Feature**: F-AUTH-002 (Session Management)

**Trigger**: User requests protected resource (cart, checkout, agent)

**Happy Path**:
1. User sends request to protected endpoint with session cookie
2. System validates session JWT signature
3. System checks session expiration
4. System extracts userId from session
5. System attaches userId to request context
6. Protected route handler accesses userId for authorization

**Edge Cases**:
- **Session Expired**: Return 401 "Session expired, please log in again"
- **Invalid JWT Signature**: Return 401 "Invalid session"
- **No Session Cookie**: Return 401 "Authentication required"
- **Session Tampered**: Return 401 "Invalid session"

**Acceptance Criteria**:
- [ ] All cart, checkout, and agent endpoints require valid session
- [ ] Session validation completes in < 50ms (p95)
- [ ] Expired sessions are automatically cleared from client

---

### FR-AUTH-004: Session Refresh

**Feature**: F-AUTH-002 (Session Management)

**Trigger**: User interacts with application within session expiration window

**Happy Path**:
1. User sends request with valid session (< 30 days old)
2. NextAuth.js automatically refreshes session if within refresh window
3. New session cookie is set with extended expiration
4. User remains logged in without re-entering credentials

**Edge Cases**:
- **Session Expired Beyond Refresh Window**: User must log in again
- **Refresh Token Revoked** (future): User must log in again

**Acceptance Criteria**:
- [ ] Sessions are refreshed automatically within expiration window
- [ ] Users are not logged out unexpectedly during active use
- [ ] Refresh happens transparently without user action

---

## Cross-Cutting Requirements

### Performance Requirements

Referenced in each FR acceptance criteria, summarized here:

| Operation | Target Latency (p95) |
|-----------|----------------------|
| Catalog search | < 500ms |
| Item registration | < 1 second |
| Add to cart | < 500ms |
| Update cart quantity | < 300ms |
| Remove from cart | < 300ms |
| Retrieve cart | < 200ms |
| Checkout | < 2 seconds |
| Agent response | < 5 seconds (excluding LLM API) |
| User login | < 500ms |
| Session validation | < 50ms |

### Data Integrity Requirements

1. **Immutable Purchase Requests**: Once created, PR items cannot be modified (enforce at application and database level)
2. **Cart Atomicity**: Cart operations (add, update, remove) must complete atomically or rollback
3. **Checkout Atomicity**: Purchase request creation and cart clearing must be atomic
4. **Price Snapshots**: Cart and PR items must snapshot catalog prices at time of operation

### Security Requirements

1. **Password Storage**: Bcrypt with salt rounds ≥ 10
2. **Session Security**: HTTP-only, Secure cookies in production
3. **Input Validation**: All user inputs validated before database operations
4. **Authorization**: Users can only access their own carts, PRs, and conversations
5. **NoSQL Injection Prevention**: Escape MongoDB special characters in search queries

---

## References

### Internal Documents

- [Objectives and Features](./prd.objective-and-features.md)
- [Non-Functional Requirements](./prd.non-functional-requirements.md)
- [C4 Container Diagram](../architecture/c4.container.md)
- [Testing Strategy](../testing/testing-strategy.md)

### External Standards

- [MongoDB Text Search](https://www.mongodb.com/docs/manual/text-search/)
- [NextAuth.js Documentation](https://next-auth.js.org/)
- [bcrypt Security Best Practices](https://github.com/kelektiv/node.bcrypt.js#security-issues-and-concerns)

---

**Document Version**: 1.0.0  
**Last Updated**: 2025-11-11  
**Owner**: Product + Engineering  
**Next Review**: 2026-02-11 (Per release)
