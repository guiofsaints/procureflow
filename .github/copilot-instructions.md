# GitHub Copilot Instructions for ProcureFlow

**ProcureFlow** is an AI-native procurement platform built as a production-ready bootstrap codebase. This provides a full-stack foundation with Next.js 15, MongoDB, LangChain, and modern tooling - ready for business logic implementation.

## Tech Stack

- **Next.js 15.1.3** App Router + React 19 Server Components
- **MongoDB 8.x** with Mongoose ODM (cached connections for hot reload)
- **NextAuth.js v5** (Credentials provider, JWT sessions)
- **LangChain 0.3.12** + OpenAI GPT (gpt-4o-mini)
- **Tailwind CSS 3.4** with shadcn/ui patterns
- **pnpm** workspace monorepo, **Docker** multi-stage builds, **Vitest** testing

## Critical Architecture Patterns

### 1. Route Groups & Server Components

````typescript
// app/(public)/ - No auth required (landing, docs)
// app/(app)/    - Authenticated routes (API, pages)

// ✅ Server Component by default
export default async function CatalogPage() {
  const session = await getServerSession(authOptions);
  const items = await getItems();
  return <ItemList items={items} />;
}

// ✅ Client Component only when needed
'use client';
export function InteractiveCart() {
  const [items, setItems] = useState([]);
  return <CartUI items={items} />;
}

### 2. Service Layer Pattern (Business Logic Isolation)

API routes are **thin controllers** - delegate to services in `src/features/{feature}/lib/*.service.ts`:

```typescript
// ✅ API Route - Thin controller
// app/(app)/api/items/route.ts
import { searchItems } from '@/features/catalog';

export async function GET(request: NextRequest) {
  try {
    const q = request.nextUrl.searchParams.get('q') || undefined;
    const items = await searchItems({ q });
    return NextResponse.json({ items });
  } catch (error) {
    console.error('GET /api/items error:', error);
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}

// ✅ Service - Pure business logic
// src/features/catalog/lib/catalog.service.ts
export async function searchItems({ q }: { q?: string }): Promise<Item[]> {
  await connectDB(); // Cached connection

  const query = q ? { $text: { $search: q } } : {};
  const docs = await ItemModel.find(query).lean().exec();

  return docs.map(mapToEntity); // Map to domain entity
}

// ❌ DON'T: Business logic in route handlers
export async function GET(request: NextRequest) {
  const items = await ItemModel.find(); // Direct DB access
  // Validation, mapping logic here - should be in service
}
````

### 3. Database Connection Pattern (Hot Reload Safe)

Always use the cached `connectDB()` helper from `@/lib/db/mongoose`:

```typescript
import connectDB from '@/lib/db/mongoose';

export async function createItem(input: CreateItemInput): Promise<Item> {
  await connectDB(); // ✅ Cached - reuses connection during hot reload

  const item = await ItemModel.create(input);
  return mapToEntity(item);
}

// ❌ DON'T: Create new connections directly
mongoose.connect(process.env.MONGODB_URI); // Causes connection leak
```

**Key Pattern**: Connection is cached in `globalThis.mongoose` - critical for Next.js dev mode.

### 4. Feature-Based Organization

Each feature exports services from `index.ts`:

```
src/features/catalog/
├── components/       # UI (CatalogPageContent.tsx)
├── lib/             # catalog.service.ts (business logic)
├── mock.ts          # Mock data for development
└── index.ts         # export * from './lib/catalog.service'
```

Import pattern: `import { createItem, searchItems } from '@/features/catalog'`

### 5. Domain-Driven Types

Domain entities in `src/domain/entities.ts` are framework-agnostic:

```typescript
// ✅ Domain entity (pure TypeScript)
export interface Item {
  id: string;
  name: string;
  category: string;
  estimatedPrice: number;
  status: ItemStatus;
  createdAt: Date;
}

// Mongoose schema is separate in src/lib/db/schemas/item.schema.ts
// Services map between Mongoose docs and domain entities
```

### 6. Error Handling Pattern

Custom errors for specific business rules:

```typescript
// ✅ Service layer - throw custom errors
export class DuplicateItemError extends Error {
  constructor(public duplicates: Item[]) {
    super('Potential duplicate detected');
  }
}

export async function createItem(input: CreateItemInput): Promise<Item> {
  const duplicates = await checkDuplicates(input);
  if (duplicates.length > 0) {
    throw new DuplicateItemError(duplicates);
  }
  // ...
}

// ✅ API route - handle errors with proper status codes
export async function POST(request: NextRequest) {
  try {
    const item = await createItem(body);
    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    if (error instanceof DuplicateItemError) {
      return NextResponse.json(
        { error: error.message, duplicates: error.duplicates },
        { status: 409 }
      );
    }
    // Generic error handling
  }
}
```

## Critical Workflows

### Development Commands

```bash
pnpm dev              # Start Next.js dev server (localhost:3000)
pnpm lint             # ESLint + Prettier check (must pass before commit)
pnpm lint:fix         # Auto-fix linting issues
pnpm type-check       # TypeScript validation (strict mode)
pnpm test             # Run Vitest API tests
pnpm test:watch       # Watch mode for TDD
pnpm docker:up        # Start MongoDB + web app in Docker
```

### Testing Pattern (Vitest)

Tests use **sequential execution** to avoid DB conflicts (`fileParallelism: false`):

```typescript
// tests/api/items.test.ts
import { describe, it, expect, beforeAll } from 'vitest';
import { ItemModel } from '@/lib/db/models';

describe('Catalog API', () => {
  beforeAll(async () => {
    await ItemModel.deleteMany({}); // Clean slate
  });

  it('should create item', async () => {
    const item = await createItem({ name: 'Laptop' /* ... */ });
    expect(item.id).toBeDefined();
  });
});
```

**Test DB**: Uses `MONGODB_URI_TEST` env var (separate from dev DB).

### Git Workflow (Conventional Commits)

Commitlint enforces [Conventional Commits](https://www.conventionalcommits.org/):

```bash
feat(catalog): add duplicate detection logic
fix(cart): resolve quantity validation bug
docs(readme): update setup instructions
refactor(db): extract connection caching logic
test(checkout): add purchase request tests
```

**Types**: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `perf`, `build`, `ci`, `revert`

## Project-Specific Conventions

### 1. Import Aliases (tsconfig.json)

```typescript
import { Button } from '@/components/ui/button'; // UI components
import { createItem } from '@/features/catalog'; // Feature services
import type { Item } from '@/domain/entities'; // Domain types
import connectDB from '@/lib/db/mongoose'; // Shared libs
import { authOptions } from '@/lib/auth/config'; // Auth config
```

### 2. Mongoose Query Pattern

```typescript
// ✅ Always use .lean().exec() for read queries
const items = await ItemModel.find(query)
  .lean() // Returns plain JS objects (not Mongoose docs)
  .exec(); // Returns proper Promise<T>

// ✅ Map to domain entities before returning
return items.map((doc) => ({
  id: doc._id.toString(),
  name: doc.name,
  // ...
}));

// ❌ DON'T return Mongoose documents directly
return await ItemModel.find(); // Exposes Mongoose internals
```

### 3. Authentication Check

```typescript
// ✅ In API routes requiring auth
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;
  // Proceed with authenticated logic
}
```

### 4. Client Context Pattern

Global state uses React Context + Provider pattern:

```typescript
// ✅ src/contexts/CartContext.tsx
'use client';
export function CartProvider({ children }: { children: ReactNode }) {
  const [itemCount, setItemCount] = useState(0);
  return <CartContext.Provider value={{ itemCount }}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
}

// Usage in layout.tsx
<CartProvider>
  <AppShell>{children}</AppShell>
</CartProvider>
```

### 5. AI Integration (LangChain)

```typescript
import { chatCompletion, promptTemplates } from '@/lib/ai/langchainClient';

// ✅ Use predefined templates
const analysis = await chatCompletion(
  promptTemplates.analyzeRequest(userInput).prompt,
  { systemMessage: promptTemplates.analyzeRequest('').systemMessage }
);

// ✅ Custom prompts with system message
const response = await chatCompletion('Analyze this request...', {
  systemMessage: 'You are a procurement expert...',
});
```

## Critical Don'ts

### ❌ Never Do These

1. **DON'T use `console.log` for errors** - use `console.error` (production logs)
2. **DON'T create Client Components unnecessarily** - default to Server Components
3. **DON'T put business logic in API routes** - delegate to services
4. **DON'T create new Mongoose connections** - always use `connectDB()`
5. **DON'T skip `.lean()` on read queries** - prevents Mongoose document overhead
6. **DON'T bypass conventional commits** - commitlint will reject invalid messages
7. **DON'T introduce new dependencies** without documenting rationale
8. **DON'T return Mongoose documents from services** - map to domain entities

### ⚠️ Common Pitfalls

**Hot Reload Issues**: If MongoDB connection fails during dev, check that `connectDB()` is using the cached pattern (see `src/lib/db/mongoose.ts`).

**TypeScript Errors**: Run `pnpm type-check` before committing - CI will fail on type errors even if Next.js builds.

**Test Failures**: Tests run sequentially - if parallelism is enabled, database conflicts occur.

## Coding Standards

### Quick Reference

```typescript
// ✅ TypeScript - Strict types with proper imports
import type { Item, Cart } from '@/domain/entities';

// ✅ Tailwind - Use cn() for conditional classes
import { cn } from '@/lib/utils';
const classes = cn('px-4 py-2', isActive && 'bg-blue-500');

// ✅ Error handling - console.error + specific error types
try {
  const item = await createItem(input);
} catch (error) {
  console.error('Failed to create item:', error);
  if (error instanceof ValidationError) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  throw error;
}

// ✅ Mongoose queries - Always .lean() for reads
const items = await ItemModel.find(query).lean().exec();

// ✅ Feature exports - Clean barrel pattern
// src/features/catalog/index.ts
export * from './lib/catalog.service';
export { CatalogPageContent } from './components/CatalogPageContent';
```

## When in Doubt

1. **Check existing code** for similar patterns (e.g., look at `src/features/catalog` for new features)
2. **Review `.guided/assessment/`** for recent fixes and standards
3. **Follow Next.js 15** best practices (App Router, Server Components)
4. **Maintain consistency** - if you see a pattern used 3+ times, follow it
5. **Ask for clarification** rather than assuming requirements

---

_These instructions ensure GitHub Copilot suggestions align with ProcureFlow's architecture, conventions, and quality standards._
