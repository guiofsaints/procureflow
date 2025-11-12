# ProcureFlow AI Agent Instructions

## Project Overview

**ProcureFlow** is an AI-native procurement platform bootstrap codebase. This is a **foundation project** with plumbing and infrastructure ready—business logic implementation is the primary development focus.

**Tech Stack**: Next.js 15 (App Router) • TypeScript • MongoDB/Mongoose • NextAuth.js • LangChain/OpenAI • Tailwind CSS • pnpm monorepo

## Architecture & Code Organization

### Feature-Based Structure

All business logic lives in `packages/web/src/features/` with isolated, self-contained features:

```
features/
  <feature-name>/
    components/        # React UI components
    lib/              # Service layer (*.service.ts)
    index.ts          # Public API exports
    types.ts          # Feature-specific types
    mock.ts           # Test fixtures (optional)
```

**Pattern**: Features export services and components through `index.ts` barrel files. Import from feature root: `import { searchItems } from '@/features/catalog'`

### Service Layer Pattern

Business logic is **always** in `*.service.ts` files, never in route handlers. Services are:

- Database-agnostic at the interface level (domain entities in, domain entities out)
- Framework-agnostic (can be used in API routes, server components, or background jobs)
- Validated with custom error classes (`ValidationError`, `DuplicateItemError`)

**Example**: `features/catalog/lib/catalog.service.ts` exports `searchItems()`, `createItem()`, `getItemById()`

Route handlers in `app/**/route.ts` are thin wrappers:

1. Extract/validate request data
2. Get authenticated user from session
3. Call service function
4. Return formatted response

### Database Layer

**MongoDB connection**: Cached singleton pattern in `lib/db/mongoose.ts` handles Next.js hot reloads. Always use `await connectDB()` before DB operations.

**Mongoose schemas**: Located in `lib/db/schemas/`. Models exported from `lib/db/models.ts`.

**Domain entities**: TypeScript interfaces in `domain/entities.ts` represent business concepts (framework-agnostic). Services return domain entities, not Mongoose documents.

**Critical**: MongoDB text search requires index creation. Run `pnpm --filter web db:create-text-index` before testing catalog search.

### Authentication Pattern

**NextAuth.js** with JWT strategy. Session available in:

- API routes: `const session = await getServerSession(authConfig)`
- Server components: Same pattern
- Client: `useSession()` hook

**Demo credentials**: `guilherme@procureflow.com` / `guigui123` (credentials provider in `lib/auth/config.ts`)

User IDs flow through services as `string | Types.ObjectId` to support both authenticated users and demo scenarios.

### AI Agent Architecture

**LangChain integration** with OpenAI function calling:

1. **Entry point**: `features/agent/lib/agent.service.ts` → `handleAgentMessage()`
2. **LLM wrapper**: `lib/ai/langchainClient.ts` → `chatCompletionWithTools()`
3. **Tool definitions**: Agent service defines tools (search_catalog, add_to_cart, checkout, etc.) as JSON schemas
4. **Execution flow**: User message → LLM decides tool calls → Execute via service layer → Return formatted response
5. **Conversation persistence**: `AgentConversationModel` stores messages with metadata (items, cart) for UI rendering

**Critical pattern**: When agent wants to modify data (add to cart, checkout), it calls the same service functions as API routes. No duplicate logic.

## Development Workflows

### Running the App

```powershell
# Development (from root)
pnpm dev              # Starts Next.js at http://localhost:3000

# With Docker (includes MongoDB)
pnpm docker:up        # Full stack with mongo-express at :8081
pnpm docker:down

# Database operations (from root)
pnpm --filter web db:create-text-index   # Required for catalog search
pnpm --filter web db:seed-office-items   # Seed 200 test items
pnpm --filter web db:seed-initial-user   # Create admin user
```

### Code Quality

```powershell
pnpm lint           # ESLint + Prettier check
pnpm lint:fix       # Auto-fix issues
pnpm format         # Prettier format
pnpm build          # TypeScript + Next.js build (validates types)
```

**Commit conventions**: Use conventional commits (enforced by commitlint). Examples: `feat: add cart analytics`, `fix: resolve duplicate item detection`

### Key Scripts Location

Database migration scripts in `packages/web/scripts/` (run with `tsx`):

- `create-text-index.ts`: MongoDB text index for catalog search
- `seed-office-items.ts`: Populate catalog with 200 items
- `seed-initial-user.ts`: Create admin user

## Project-Specific Conventions

### Import Aliases

Use TypeScript path aliases consistently:

- `@/features/<name>`: Feature modules
- `@/lib/<module>`: Shared libraries (db, auth, ai, utils)
- `@/domain`: Domain entities and types
- `@/components`: Shared UI components

### Route Organization (Next.js App Router)

```
app/
  (public)/          # Unauthenticated routes (landing, docs)
    layout.tsx       # Public layout (no auth check)
    page.tsx         # Login/landing page
  (app)/             # Authenticated routes
    layout.tsx       # App layout with AppShell, requires session
    api/             # API routes
    catalog/         # Feature pages
    cart/
    agent/
```

**Pattern**: Route groups `(public)` and `(app)` organize layouts without affecting URL structure.

### Error Handling

Services throw typed errors:

- `ValidationError`: Input validation failures (400-level)
- `DuplicateItemError`: Detected duplicates (includes duplicates array)
- Generic `Error`: Unexpected failures (500-level)

Route handlers catch and map to HTTP status codes:

```typescript
try {
  const result = await someService.doThing(params);
  return NextResponse.json(result);
} catch (error) {
  if (error instanceof ValidationError) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  // ... handle other error types
}
```

### Component Patterns

**Server Components by default** (Next.js 15). Use `'use client'` only when needed (hooks, interactivity).

**UI components**: Radix UI primitives in `components/ui/` (shadcn-style). Use these instead of building from scratch.

**Layout system**: `AppShell` in `components/layout/` provides sidebar navigation, header, and responsive container.

## Common Pitfalls & Solutions

### MongoDB Connection Issues

**Symptom**: `Error: ECONNREFUSED` or `MongooseServerSelectionError`  
**Fix**: Ensure MongoDB is running. With Docker: `pnpm docker:db`. Check `MONGODB_URI` in `.env.local`.

### Text Search Not Working

**Symptom**: Catalog search returns empty or `IndexNotFound` error  
**Fix**: Run `pnpm --filter web db:create-text-index` to create required text index on items collection.

### Agent Search Returns No Results

**Symptom**: Agent says "No items found" for valid queries  
**Fix**:

1. Verify items exist: check MongoDB or run seed script
2. Verify text index exists
3. Check OpenAI API key is set (`OPENAI_API_KEY`)

### TypeScript Path Resolution

**Symptom**: Import errors like `Cannot find module '@/features/...'`  
**Fix**: Use imports from barrel files (`@/features/catalog`, not `@/features/catalog/lib/catalog.service`)

### Session/Auth Issues

**Symptom**: `User must be authenticated` errors  
**Fix**:

1. Verify `NEXTAUTH_SECRET` and `NEXTAUTH_URL` in `.env.local`
2. Sign in at http://localhost:3000 with demo credentials
3. Check session in route handler: `const session = await getServerSession(authConfig)`

## Critical Integration Points

### Adding a New Feature

1. Create feature directory: `features/<name>/`
2. Add service layer: `lib/<name>.service.ts` with exported functions
3. Define types in domain: `domain/entities.ts` (if new entity)
4. Create Mongoose schema: `lib/db/schemas/<name>.schema.ts`
5. Add to models: Export from `lib/db/models.ts`
6. Create API routes: `app/(app)/api/<name>/route.ts`
7. Create UI components: `features/<name>/components/`
8. Export via barrel: `features/<name>/index.ts`

### Agent Tool Integration

To add new agent capability:

1. Add tool definition in `features/agent/lib/agent.service.ts` → `tools` array
2. Add case in `executeTool()` function to call appropriate service
3. Update prompt to instruct agent when to use tool
4. Test with agent chat UI at `/agent`

### Database Schema Changes

1. Update Mongoose schema in `lib/db/schemas/`
2. Update domain entity in `domain/entities.ts`
3. Create migration script in `packages/web/scripts/` if needed
4. Document in `packages/web/scripts/README.md`

## Environment Variables Reference

**Required**:

- `MONGODB_URI`: MongoDB connection string (Docker: `mongodb://localhost:27017/procureflow`)
- `NEXTAUTH_SECRET`: Secret key for session encryption (generate with `openssl rand -base64 32`)
- `NEXTAUTH_URL`: App URL (dev: `http://localhost:3000`)

**Optional (for AI features)**:

- `OPENAI_API_KEY`: OpenAI API key for agent functionality

## What NOT to Do

❌ Don't implement business logic in route handlers—always use service layer  
❌ Don't import directly from `*.service.ts`—use barrel exports from `features/<name>/index.ts`  
❌ Don't use Mongoose models directly in components—services return domain entities  
❌ Don't forget to run `connectDB()` before database operations  
❌ Don't mix client and server code—respect Next.js boundaries  
❌ Don't commit `.env.local`—use `.env.example` as template  
❌ Don't skip the text index creation—catalog search requires it

## Quick Reference

**Find a service function**: Check `features/<name>/lib/*.service.ts`  
**Add API endpoint**: Create `app/(app)/api/<path>/route.ts`  
**Database schema**: Look in `lib/db/schemas/`  
**Domain types**: Defined in `domain/entities.ts`  
**Seeding data**: Scripts in `packages/web/scripts/`  
**Component library**: UI primitives in `components/ui/`
