# Architecture Context and Boundaries

> **Status**: Current State Documentation  
> **Last Updated**: 2025-11-10  
> **Persona**: DocumentationEngineer

## Overview

ProcureFlow follows a **feature-based architecture** organized around business capabilities. The system is structured as layers with clear separation of concerns, enabling modularity and testability.

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Client Layer                          │
│  (Browser - React Server/Client Components)             │
└────────────────────┬────────────────────────────────────┘
                     │ HTTP/HTTPS
┌────────────────────┴────────────────────────────────────┐
│              Next.js Application Layer                   │
│  ┌────────────────────────────────────────────────────┐ │
│  │  App Router (Route Handlers + Server Components)  │ │
│  └────────────────────┬───────────────────────────────┘ │
│                       │                                  │
│  ┌────────────────────┴───────────────────────────────┐ │
│  │          Service Layer (*.service.ts)              │ │
│  │  - catalog.service                                 │ │
│  │  - cart.service                                    │ │
│  │  - checkout.service                                │ │
│  │  - agent.service                                   │ │
│  │  - auth.service                                    │ │
│  └────────────────────┬───────────────────────────────┘ │
└─────────────────────┬─┴─────────────────────────────────┘
                      │
         ┌────────────┼────────────┐
         │            │            │
    ┌────┴───┐   ┌────┴───┐   ┌───┴──────┐
    │MongoDB │   │OpenAI  │   │  Logs    │
    │        │   │/Gemini │   │ (Loki)   │
    └────────┘   └────────┘   └──────────┘
```

## Bounded Contexts

### 1. Catalog Context

**Responsibility**: Manage inventory of requestable items

**Entities**:

- Item (CatalogItem)

**Operations**:

- Search items by keyword
- Create new catalog items
- Get item by ID
- List items by category

**Services**:

- `catalog.service.ts`

**Database Collections**:

- `items`

**Business Rules**:

- Only "Active" items are searchable by default
- User-registered items are immediately active (MVP)
- Full-text search requires text index

### 2. Cart Context

**Responsibility**: Manage user shopping carts

**Entities**:

- Cart
- CartItem

**Operations**:

- Get cart for user
- Add item to cart
- Update item quantity
- Remove item from cart
- Clear cart

**Services**:

- `cart.service.ts`

**Database Collections**:

- `carts`

**Business Rules**:

- One active cart per user
- Quantity per item: 1-999
- Cart stores item snapshots (name, price) at time of addition
- Cart total is calculated field

### 3. Checkout Context

**Responsibility**: Convert carts to purchase requests

**Entities**:

- PurchaseRequest
- PurchaseRequestItem

**Operations**:

- Create purchase request from cart
- Get purchase request by ID
- List purchase requests for user

**Services**:

- `checkout.service.ts`

**Database Collections**:

- `purchaseRequests`

**Business Rules**:

- Purchase request is immutable after creation
- Items are snapshotted (name, price, category, description)
- Status defaults to "Submitted"
- Cart is cleared after successful checkout

### 4. Agent Context

**Responsibility**: AI-driven conversational interface

**Entities**:

- AgentConversation
- AgentMessage
- AgentAction

**Operations**:

- Handle user message
- Execute tools (search, add to cart, checkout)
- Store conversation history
- Track agent actions

**Services**:

- `agent.service.ts`

**Database Collections**:

- `agentConversations`

**External Dependencies**:

- OpenAI or Google Gemini (LLM)
- LangChain (orchestration)

**Business Rules**:

- Conversations tied to authenticated user
- Agent can invoke any service layer function
- Tool calls logged for traceability

### 5. Auth Context

**Responsibility**: User authentication and session management

**Entities**:

- User

**Operations**:

- Authenticate credentials
- Create user
- Validate session

**Services**:

- `auth.service.ts`

**Database Collections**:

- `users`

**Business Rules**:

- Passwords hashed with bcryptjs
- JWT-based sessions (NextAuth.js)
- Demo credentials: `demo@procureflow.com` / `demo123`

## Layered Architecture

### Layer 1: Presentation (Client)

**Components**:

- React Server Components (default)
- Client Components (`'use client'`)
- UI primitives (`components/ui/`)
- Layout components (`components/layout/`)

**Responsibilities**:

- Render UI
- Handle user interactions
- Display data from Server Components or API
- Manage client state (React Context, useState)

**Constraints**:

- Cannot directly access database or services
- Interacts with server via Server Components or API routes

### Layer 2: Route Handlers (API Routes + Server Components)

**Location**: `app/**/route.ts`, `app/**/page.tsx` (Server Components)

**Responsibilities**:

- Extract and validate request data
- Get authenticated session
- Call service layer functions
- Format and return responses
- Handle errors and map to HTTP status codes

**Pattern** (API Route):

```typescript
export async function POST(request: Request) {
  const session = await getServerSession(authConfig);
  if (!session)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  // Validate input

  try {
    const result = await someService.doThing(params);
    return NextResponse.json(result);
  } catch (error) {
    // Map error types to status codes
  }
}
```

**Constraints**:

- **Thin wrappers** - no business logic
- Delegate to service layer
- Framework-specific (Next.js)

### Layer 3: Service Layer

**Location**: `features/<name>/lib/*.service.ts`

**Responsibilities**:

- Implement business logic
- Enforce business rules
- Validate inputs
- Coordinate database operations
- Return domain entities (not Mongoose documents)

**Pattern**:

```typescript
export async function searchItems(params: SearchItemsParams): Promise<Item[]> {
  await connectDB();
  // Validation
  // Business logic
  // Database queries
  // Map Mongoose docs to domain entities
  return items;
}
```

**Characteristics**:

- **Framework-agnostic**: No Next.js, no HTTP concepts
- **Database-agnostic interface**: Domain entities in, domain entities out
- **Reusable**: Can be called from API routes, Server Components, agent tools, background jobs
- **Testable**: Pure business logic, mockable dependencies

**Constraints**:

- Never return Mongoose documents directly
- Always validate inputs
- Throw typed errors (`ValidationError`, `DuplicateItemError`)

### Layer 4: Domain Layer

**Location**: `domain/entities.ts`, `domain/documents.ts`

**Responsibilities**:

- Define core business entities (TypeScript interfaces)
- Define document types (Mongoose schemas)
- Establish type contracts

**Entities**:

- `User`, `Item`, `Cart`, `CartItem`, `PurchaseRequest`, `PurchaseRequestItem`, `AgentConversation`, `AgentMessage`, `AgentAction`

**Characteristics**:

- **Framework-agnostic**: No dependencies on Mongoose, Next.js, etc.
- **Type-safe**: TypeScript interfaces
- **Business-focused**: Represents business concepts, not database structure

### Layer 5: Data Access Layer

**Location**: `lib/db/`

**Responsibilities**:

- MongoDB connection management
- Mongoose schema definitions
- Model exports
- Database utilities

**Components**:

- `mongoose.ts` - Cached connection singleton
- `models.ts` - Model exports
- `schemas/*.schema.ts` - Mongoose schemas

**Pattern** (Schema):

```typescript
const ItemSchema = new Schema({
  name: { type: String, required: true },
  // ...
});
export const ItemModel =
  mongoose.models.Item || mongoose.model('Item', ItemSchema);
```

**Constraints**:

- Connection must be established before queries (`await connectDB()`)
- Handle Next.js hot reload (cached connection)

## Cross-Cutting Concerns

### Authentication

**Implementation**: NextAuth.js with JWT strategy

**Flow**:

1. User submits credentials
2. `auth.service.ts` validates credentials
3. NextAuth generates JWT
4. JWT stored in HTTP-only cookie
5. Subsequent requests include JWT
6. Session extracted via `getServerSession(authConfig)`

**Integration Points**:

- All API routes check session
- All service functions accept `userId`
- Middleware can be added for route protection

### Logging

**Implementation**: Winston with structured logging

**Usage**:

```typescript
import { logger } from '@/lib/logger/winston.config';
logger.info('User searched catalog', { userId, query, resultCount });
logger.error('Failed to add to cart', { userId, itemId, error });
```

**Transports**:

- Console (development)
- Loki (production) via winston-loki

### Error Handling

**Custom Error Classes**:

- `ValidationError` - Input validation failures (400)
- `DuplicateItemError` - Duplicate detection (409)
- Generic `Error` - Unexpected failures (500)

**Pattern**:

```typescript
// Service layer
if (!isValid) throw new ValidationError('Invalid input');

// Route handler
try {
  const result = await service.method(params);
  return NextResponse.json(result);
} catch (error) {
  if (error instanceof ValidationError) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  // ...
}
```

### Metrics

**Implementation**: Prometheus with prom-client

**Metrics**:

- HTTP request duration (histogram)
- AI token usage (counter)
- Active sessions (gauge)
- Error count by type (counter)

**Endpoint**: `/api/metrics`

### Reliability

**Circuit Breaker** (Opossum):

- Wraps AI API calls
- Opens after 5 consecutive failures
- Half-open after 30 seconds

**Rate Limiting** (Bottleneck):

- OpenAI: 60 requests/minute
- Configured per provider

**Retry Logic** (p-retry):

- Exponential backoff for transient errors
- Max 3 retries

## Data Flow

### Search Items Flow

```
User Input
    ↓
Agent Chat UI (Client Component)
    ↓ POST /api/agent/chat
API Route Handler
    ↓ Extract session, validate input
agent.service.handleAgentMessage()
    ↓ LLM decides to call search_catalog tool
catalog.service.searchItems()
    ↓ MongoDB text search query
Mongoose → MongoDB
    ↓ Results
Map Mongoose docs → Domain entities
    ↓
Return Items[]
    ↓
Agent formats response with item cards
    ↓
Return to client
    ↓
Render item cards in chat
```

### Add to Cart Flow

```
User Input: "Add item X to cart"
    ↓
Agent Chat UI
    ↓ POST /api/agent/chat
API Route Handler
    ↓
agent.service.handleAgentMessage()
    ↓ LLM decides to call add_to_cart tool
cart.service.addItemToCart(userId, itemId, quantity)
    ↓ Get or create cart
    ↓ Fetch item details from catalog
    ↓ Add/update cart item
Mongoose → MongoDB (upsert cart)
    ↓
Return updated Cart
    ↓
Agent formats confirmation
    ↓
Return to client
    ↓
Render cart summary
```

### Checkout Flow

```
User Input: "Checkout"
    ↓
Agent Chat UI
    ↓ POST /api/agent/chat
API Route Handler
    ↓
agent.service.handleAgentMessage()
    ↓ LLM decides to call checkout tool
checkout.service.createPurchaseRequest(userId, cart)
    ↓ Validate cart not empty
    ↓ Create purchase request with item snapshots
Mongoose → MongoDB (insert purchaseRequest)
    ↓ Clear cart
Mongoose → MongoDB (delete cart)
    ↓
Return PurchaseRequest
    ↓
Agent formats confirmation with request ID
    ↓
Return to client
    ↓
Render purchase request card
```

## Integration Points

### External Services

| Service       | Purpose                | Integration  | Fallback |
| ------------- | ---------------------- | ------------ | -------- |
| OpenAI        | LLM (GPT-4o-mini)      | LangChain    | Gemini   |
| Google Gemini | LLM (gemini-2.0-flash) | LangChain    | OpenAI   |
| Grafana Loki  | Log aggregation        | winston-loki | Console  |
| Prometheus    | Metrics scraping       | prom-client  | None     |

### Internal Dependencies

| From               | To               | Purpose                  |
| ------------------ | ---------------- | ------------------------ |
| Agent Service      | Catalog Service  | Search items             |
| Agent Service      | Cart Service     | Manage cart              |
| Agent Service      | Checkout Service | Create purchase requests |
| Cart Service       | Catalog Service  | Fetch item details       |
| All Services       | Database Layer   | Persist data             |
| All Route Handlers | Auth Service     | Validate session         |

## Deployment Architecture

### Development

```
Developer Machine
├── Next.js Dev Server (:3000)
├── MongoDB (Docker :27017)
└── mongo-express (Docker :8081)
```

### Production (Planned - GCP)

```
Internet → Cloud Load Balancer
              ↓
         Cloud Run (Next.js)
              ↓
    ┌─────────┼─────────┐
    │         │         │
MongoDB    OpenAI    Loki/Prometheus
Atlas      API       (GCP Monitoring)
```

## Future Architecture Considerations

### Microservices (Out of Scope)

If scale requires, consider:

- Separate catalog service (gRPC)
- Separate agent service (with message queue)
- Event-driven architecture (Kafka, Pub/Sub)

### Caching Layer

- Redis for session storage (if moving away from JWT)
- Agent response caching for common queries
- Catalog search result caching

### Async Processing

- Background job queue (Bull, BullMQ)
- Process heavy agent tasks asynchronously
- Email notifications (SendGrid, Postmark)

## Related Documentation

- Technology stack: `.guided/architecture/stack.md`
- Domain entities: `.guided/architecture/entities.md`
- Service patterns: `.github/copilot-instructions.md`
