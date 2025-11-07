# ProcureFlow - Agent Instructions

**AI Assistant Guidelines for ProcureFlow Development**

This document provides comprehensive guidance for AI agents (GitHub Copilot, Claude, Windsurf, Continue, etc.) working on ProcureFlow - an AI-native procurement platform built with Next.js 15, MongoDB, and LangChain.

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Project Structure](#project-structure)
- [Tech Stack](#tech-stack)
- [Coding Standards](#coding-standards)
- [Feature Development Guidelines](#feature-development-guidelines)
- [Testing & Quality](#testing--quality)
- [Common Patterns](#common-patterns)
- [Dos and Don'ts](#dos-and-donts)
- [Troubleshooting](#troubleshooting)

---

## Architecture Overview

### Project Nature

ProcureFlow is a **bootstrap codebase** - a production-ready foundation for AI-native procurement use cases with:

- ✅ Complete full-stack setup with modern tooling
- ✅ Authentication and database integration ready
- ✅ AI/LangChain integration for agent development
- ✅ Docker and cloud infrastructure prepared
- ❌ **No business logic fully implemented** - ready for feature development

### Core Architectural Principles

1. **Next.js App Router First**: Use Server Components by default, Client Components only when necessary
2. **Route Groups for Organization**: Public routes in `(public)`, authenticated routes in `(app)`
3. **Feature-Based Structure**: Domain logic organized by feature in `src/features/`
4. **Service Layer Isolation**: Business logic in services, API routes are thin controllers
5. **Type Safety**: Strict TypeScript with proper domain types
6. **AI-Native**: LangChain orchestration with structured prompts

### Domain Model

**Core Entities**:

- **User**: Authentication and user management
- **Item**: Catalog items (products/services to procure)
- **Cart**: Shopping cart for procurement requests
- **PurchaseRequest**: Submitted procurement requests
- **AgentConversation**: AI agent chat history

**Business Rules**:

- Items must have positive prices
- Duplicate items checked by name + category
- Cart items validated against catalog
- Purchase requests require justification

---

## Project Structure

```
procureflow/
├── apps/
│   └── web/                          # Next.js 15 Application
│       ├── app/
│       │   ├── layout.tsx           # Root layout with global styles
│       │   ├── (public)/            # Public routes (no auth required)
│       │   │   ├── layout.tsx       # Public routes layout
│       │   │   ├── page.tsx         # Landing page
│       │   │   └── docs/            # Documentation pages
│       │   │       └── api/
│       │   │           └── page.tsx # API docs (Swagger UI)
│       │   └── (app)/               # Authenticated app routes
│       │       ├── layout.tsx       # App routes layout
│       │       └── api/             # API routes
│       │           ├── health/      # Health check endpoint
│       │           ├── auth/        # NextAuth.js authentication
│       │           ├── items/       # Catalog items API
│       │           ├── cart/        # Cart management API
│       │           ├── checkout/    # Checkout and purchase requests
│       │           ├── agent/       # AI agent chat API
│       │           └── openapi/     # OpenAPI spec generation
│       │
│       ├── src/
│       │   ├── features/            # Feature-based organization
│       │   │   ├── catalog/         # Catalog feature
│       │   │   │   ├── components/  # UI components for catalog
│       │   │   │   ├── lib/         # catalog.service.ts
│       │   │   │   └── index.ts     # Feature exports
│       │   │   ├── cart/            # Cart feature
│       │   │   │   ├── components/  # UI components for cart
│       │   │   │   ├── lib/         # cart.service.ts
│       │   │   │   └── index.ts     # Feature exports
│       │   │   ├── checkout/        # Checkout feature
│       │   │   │   ├── components/  # UI components for checkout
│       │   │   │   ├── lib/         # checkout.service.ts
│       │   │   │   └── index.ts     # Feature exports
│       │   │   └── agent/           # AI Agent feature
│       │   │       ├── components/  # UI components for agent
│       │   │       ├── lib/         # agent.service.ts
│       │   │       └── index.ts     # Feature exports
│       │   │
│       │   ├── domain/              # Domain entities and types
│       │   │   ├── entities.ts      # Core domain entities
│       │   │   ├── mongo-schemas.d.ts # MongoDB type definitions
│       │   │   └── index.ts         # Domain exports
│       │   │
│       │   ├── lib/                 # Shared libraries
│       │   │   ├── auth/            # NextAuth.js configuration
│       │   │   │   └── config.ts    # Authentication setup
│       │   │   ├── db/              # Database layer
│       │   │   │   ├── mongoose.ts  # Connection management
│       │   │   │   ├── models.ts    # Mongoose model exports
│       │   │   │   └── schemas/     # Mongoose schemas
│       │   │   │       ├── user.schema.ts
│       │   │   │       ├── item.schema.ts
│       │   │   │       ├── cart.schema.ts
│       │   │   │       ├── purchase-request.schema.ts
│       │   │   │       └── agent-conversation.schema.ts
│       │   │   ├── ai/              # AI integration
│       │   │   │   └── langchainClient.ts # LangChain + OpenAI
│       │   │   ├── utils/           # Utility functions
│       │   │   │   └── index.ts     # cn(), etc.
│       │   │   ├── constants/       # Application constants
│       │   │   │   └── index.ts     # API_ROUTES, etc.
│       │   │   └── openapi.ts       # OpenAPI spec generation
│       │   │
│       │   ├── components/          # Shared React components
│       │   │   ├── ui/              # UI primitives
│       │   │   │   └── Button.tsx
│       │   │   └── index.ts         # Component exports
│       │   │
│       │   ├── styles/              # Global styles
│       │   │   └── globals.css      # Tailwind + global CSS
│       │   │
│       │   └── types/               # Global type definitions
│       │       └── globals.d.ts     # Ambient types
│       │
│       └── tests/                   # Test suites
│           ├── setup.ts             # Test configuration
│           └── api/                 # API integration tests
│               ├── items.test.ts
│               ├── cart-and-checkout.test.ts
│               └── agent.test.ts
│
├── infra/
│   └── pulumi/gcp/                  # Infrastructure as Code
│       ├── index.ts                 # Pulumi program
│       ├── package.json
│       └── Pulumi.yaml
│
├── docker/
│   ├── Dockerfile.web               # Multi-stage production build
│   └── mongo-init/                  # MongoDB initialization scripts
│
├── .github/
│   ├── copilot-instructions.md      # GitHub Copilot guidelines
│   └── CONTRIBUTING.md              # Contribution workflow
│
├── .guided/                         # Guided Engineering assets
│   ├── product/                     # Product documentation
│   └── assessment/                  # Code quality assessments
│
├── AGENTS.md                        # This file
├── README.md                        # Project README
├── ESTRUTURA.md                     # Architecture documentation (PT-BR)
├── docker-compose.yml               # Local development environment
├── pnpm-workspace.yaml              # pnpm monorepo config
└── tsconfig.json                    # Root TypeScript config
```

### Key Directory Purposes

| Directory            | Purpose                              | Import Alias   |
| -------------------- | ------------------------------------ | -------------- |
| `app/(public)/`      | Public routes (landing, docs)        | N/A            |
| `app/(app)/api/`     | API routes (REST endpoints)          | N/A            |
| `src/features/`      | Feature-specific code (services, UI) | `@/features`   |
| `src/domain/`        | Core domain entities and types       | `@/domain`     |
| `src/lib/db/`        | Database connection and schemas      | `@/lib/db`     |
| `src/lib/ai/`        | AI/LangChain integration             | `@/lib/ai`     |
| `src/lib/auth/`      | Authentication configuration         | `@/lib/auth`   |
| `src/components/ui/` | Reusable UI components               | `@/components` |
| `tests/`             | Test suites (Vitest)                 | N/A            |

---

## Tech Stack

### Core Framework

- **Next.js 15.1.3**: App Router, React Server Components, API Routes
- **React 19.0.0**: Modern React with Server Components
- **TypeScript 5.7.3**: Strict mode enabled

### Database & ORM

- **MongoDB 8.x**: Document database
- **Mongoose 8.9.5**: ODM with schema validation
- Connection pooling with `cached` pattern for hot reload support

### Authentication

- **NextAuth.js v5**: Authentication with Credentials provider
- Session management with JWT
- Demo credentials: `demo@procureflow.com` / `demo123`

### AI & ML

- **LangChain 0.3.12**: AI workflow orchestration
- **OpenAI GPT**: Chat completions (gpt-4o-mini)
- Structured prompt templates for procurement use cases

### Styling

- **Tailwind CSS 3.4.17**: Utility-first CSS framework
- **shadcn/ui** patterns: Composable UI components
- `cn()` utility for conditional classes

### Development Tools

- **pnpm 8+**: Fast, disk-efficient package manager
- **ESLint 9**: Flat config with TypeScript rules
- **Prettier 3**: Code formatting
- **Husky + commitlint**: Git hooks with conventional commits
- **Vitest**: Unit and integration testing

### Infrastructure

- **Docker**: Multi-stage builds for production
- **docker-compose**: Local development environment
- **Pulumi (TypeScript)**: Infrastructure as Code for GCP

---

## Coding Standards

### TypeScript

```typescript
// ✅ DO: Use strict TypeScript with proper types
import type { Item } from '@/domain/entities';

export async function getItem(id: string): Promise<Item | null> {
  // Implementation
}

// ❌ DON'T: Use `any` or skip types
export async function getItem(id) {
  // Missing types
}
```

### React Patterns

```typescript
// ✅ DO: Use Server Components by default
export default async function CatalogPage() {
  const items = await getItems();
  return <ItemList items={items} />;
}

// ✅ DO: Client Components only when needed
'use client';
export function InteractiveCart() {
  const [items, setItems] = useState([]);
  // Client-side interactivity
}

// ❌ DON'T: Unnecessary Client Components
'use client';
export default function StaticPage() {
  return <div>Static content</div>;
}
```

### API Route Structure

```typescript
// ✅ DO: Thin controllers, delegate to services
import { NextRequest, NextResponse } from 'next/server';
import { searchItems } from '@/features/catalog';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const q = searchParams.get('q') || undefined;

    const items = await searchItems({ q });

    return NextResponse.json({ success: true, data: items });
  } catch (error) {
    console.error('GET /api/items error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch items' },
      { status: 500 }
    );
  }
}

// ❌ DON'T: Business logic in route handlers
export async function GET(request: NextRequest) {
  // Direct database access, validation, etc.
  const items = await ItemModel.find();
  // This should be in a service
}
```

### Service Layer

```typescript
// ✅ DO: Pure business logic, no HTTP concerns
export async function createItem(input: CreateItemInput): Promise<Item> {
  await connectDB();

  // Validation
  validateCreateItemInput(input);

  // Business logic
  const duplicates = await checkDuplicates(input);
  if (duplicates.length > 0) {
    throw new DuplicateItemError('Duplicate found', duplicates);
  }

  // Persistence
  const item = await ItemModel.create(input);

  return mapToEntity(item);
}

// ❌ DON'T: HTTP-specific code in services
export async function createItem(req: NextRequest) {
  const body = await req.json(); // HTTP concern
  // Service should not know about HTTP
}
```

### Import Organization

```typescript
// ✅ DO: Organized imports with spacing
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth/config';
import { createCart } from '@/features/cart';
import type { Cart } from '@/domain/entities';

// ❌ DON'T: Unorganized imports
import { createCart } from '@/features/cart';
import type { Cart } from '@/domain/entities';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
```

### Error Handling

```typescript
// ✅ DO: Proper error handling with specific types
try {
  const item = await createItem(input);
  return NextResponse.json({ success: true, data: item }, { status: 201 });
} catch (error) {
  if (error instanceof ValidationError) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }

  if (error instanceof DuplicateItemError) {
    return NextResponse.json(
      { success: false, error: error.message, duplicates: error.duplicates },
      { status: 409 }
    );
  }

  console.error('Unexpected error creating item:', error);
  return NextResponse.json(
    { success: false, error: 'Internal server error' },
    { status: 500 }
  );
}

// ❌ DON'T: Generic error handling
try {
  const item = await createItem(input);
} catch (error) {
  console.log(error); // Use console.error
  return NextResponse.json({ error: 'Error' }); // Too generic
}
```

### Database Patterns

```typescript
// ✅ DO: Use cached connection for hot reload
import connectDB from '@/lib/db/mongoose';

export async function searchItems() {
  await connectDB(); // Cached, hot-reload safe

  const items = await ItemModel.find().lean().exec();
  return items.map(mapToEntity);
}

// ✅ DO: Use .lean() for read-only queries
const items = await ItemModel.find().lean().exec();

// ❌ DON'T: Return Mongoose documents directly
const items = await ItemModel.find().exec();
return items; // Return domain entities instead
```

### Styling with Tailwind

```typescript
// ✅ DO: Use cn() for conditional classes
import { cn } from '@/lib/utils';

export function Button({ className, variant, ...props }) {
  return (
    <button
      className={cn(
        'px-4 py-2 rounded font-medium',
        variant === 'primary' && 'bg-blue-500 text-white',
        variant === 'secondary' && 'bg-gray-200 text-gray-900',
        className
      )}
      {...props}
    />
  );
}

// ❌ DON'T: Manual string concatenation
<button className={`px-4 py-2 ${variant === 'primary' ? 'bg-blue-500' : 'bg-gray-200'}`} />
```

---

## Feature Development Guidelines

### Adding a New Feature

When adding a new feature (e.g., `suppliers`):

1. **Create feature structure**:

   ```
   src/features/suppliers/
   ├── components/       # UI components
   ├── lib/             # suppliers.service.ts
   └── index.ts         # Export service functions
   ```

2. **Define domain entities** in `src/domain/entities.ts`:

   ```typescript
   export interface Supplier {
     id: string;
     name: string;
     // ... fields
   }
   ```

3. **Create Mongoose schema** in `src/lib/db/schemas/supplier.schema.ts`:

   ```typescript
   import { Schema, model } from 'mongoose';

   const supplierSchema = new Schema(
     {
       name: { type: String, required: true },
       // ... fields
     },
     { timestamps: true }
   );

   export const SupplierModel = model('Supplier', supplierSchema);
   ```

4. **Implement service layer** in `src/features/suppliers/lib/suppliers.service.ts`:

   ```typescript
   export async function getSuppliers(): Promise<Supplier[]> {
     await connectDB();
     const docs = await SupplierModel.find().lean().exec();
     return docs.map(mapToEntity);
   }
   ```

5. **Create API routes** in `app/(app)/api/suppliers/route.ts`:

   ```typescript
   import { getSuppliers } from '@/features/suppliers';

   export async function GET() {
     const suppliers = await getSuppliers();
     return NextResponse.json({ success: true, data: suppliers });
   }
   ```

6. **Build UI components** in `src/features/suppliers/components/`:

   ```typescript
   export function SupplierList({ suppliers }: { suppliers: Supplier[] }) {
     // Component implementation
   }
   ```

7. **Write tests** in `tests/api/suppliers.test.ts`:

   ```typescript
   import { describe, it, expect } from 'vitest';

   describe('Suppliers API', () => {
     it('should fetch suppliers', async () => {
       // Test implementation
     });
   });
   ```

### Feature Checklist

- [ ] Domain entity defined in `src/domain/entities.ts`
- [ ] Mongoose schema created in `src/lib/db/schemas/`
- [ ] Service layer implemented in `src/features/{feature}/lib/`
- [ ] API routes created in `app/(app)/api/{feature}/`
- [ ] UI components built in `src/features/{feature}/components/`
- [ ] Feature exports in `src/features/{feature}/index.ts`
- [ ] Tests written in `tests/api/{feature}.test.ts`
- [ ] Types are strict and complete
- [ ] Error handling implemented
- [ ] Conventional commit message

---

## Testing & Quality

### Running Quality Checks

```bash
# Type checking
pnpm type-check

# Linting
pnpm lint
pnpm lint:fix

# Formatting
pnpm format

# Testing
pnpm test
pnpm test:watch

# Build verification
pnpm build
```

### Test Structure

```typescript
// ✅ DO: Comprehensive test coverage
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

describe('Cart Service', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await cleanupTestDatabase();
  });

  it('should create a new cart', async () => {
    const cart = await createCart({ userId: 'user123' });

    expect(cart).toBeDefined();
    expect(cart.userId).toBe('user123');
    expect(cart.items).toHaveLength(0);
  });

  it('should add items to cart', async () => {
    const cart = await createCart({ userId: 'user123' });
    const updatedCart = await addItemToCart({
      cartId: cart.id,
      itemId: 'item123',
      quantity: 2,
    });

    expect(updatedCart.items).toHaveLength(1);
    expect(updatedCart.items[0].quantity).toBe(2);
  });
});
```

### Commit Message Format

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): description

[optional body]

[optional footer]
```

**Types**:

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples**:

```bash
feat(catalog): add item duplicate detection
fix(cart): resolve quantity validation bug
docs(readme): update setup instructions
refactor(structure): align nextjs app structure and agent docs
test(checkout): add purchase request validation tests
```

---

## Common Patterns

### Authentication Check

```typescript
// In API routes
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.email) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // Proceed with authenticated logic
}
```

### Database Queries

```typescript
// Search with text index
const items = await ItemModel.find({ $text: { $search: keyword } })
  .sort({ score: { $meta: 'textScore' } })
  .limit(50)
  .lean()
  .exec();

// Find by ID
const item = await ItemModel.findById(id).lean().exec();

// Create
const newItem = await ItemModel.create(data);

// Update
const updated = await ItemModel.findByIdAndUpdate(
  id,
  { $set: updates },
  { new: true }
)
  .lean()
  .exec();
```

### AI/LangChain Usage

```typescript
import { chatCompletion, promptTemplates } from '@/lib/ai/langchainClient';

// Using predefined templates
const analysis = await chatCompletion(
  promptTemplates.analyzeRequest(requestText).prompt,
  { systemMessage: promptTemplates.analyzeRequest('').systemMessage }
);

// Custom prompts
const response = await chatCompletion('Analyze this procurement request...', {
  systemMessage: 'You are a procurement expert...',
});
```

### Tailwind Responsive Design

```typescript
<div className="
  px-4 py-2           /* Mobile */
  sm:px-6 sm:py-3     /* Tablet */
  lg:px-8 lg:py-4     /* Desktop */
  max-w-7xl mx-auto
">
  {children}
</div>
```

---

## Dos and Don'ts

### DO ✅

- **Follow existing patterns** in the codebase
- **Use TypeScript strictly** with proper types
- **Implement React Server Components** when possible
- **Use established utility functions** from `src/lib/`
- **Follow conventional commits** format
- **Add proper error handling** with `console.error`
- **Use `const` for immutable variables**
- **Organize imports** with proper spacing
- **Follow Next.js App Router** patterns
- **Delegate business logic to services**
- **Use `.lean()` for read-only Mongoose queries**
- **Import types with `import type {}`** when appropriate
- **Use route groups** for organization: `(public)` and `(app)`
- **Keep feature code in `src/features/`**
- **Run quality checks** before committing

### DON'T ❌

- **Introduce new major dependencies** without justification
- **Mix business logic into infrastructure** code
- **Use `console.log` for error logging** (use `console.error`)
- **Create duplicate utility functions**
- **Bypass existing authentication patterns**
- **Use Pages Router patterns** (this is App Router only)
- **Ignore TypeScript errors or warnings**
- **Skip conventional commit format**
- **Put business logic in API route handlers**
- **Return Mongoose documents directly** (map to domain entities)
- **Use Client Components unnecessarily**
- **Mix HTTP concerns into service layer**
- **Create API routes outside `app/(app)/api/`**
- **Create public pages outside `app/(public)/`**

---

## Troubleshooting

### Common Issues

**TypeScript Errors After File Moves**:

- Run `pnpm type-check` to see all errors
- Update import paths to use correct aliases (`@/features`, `@/domain`, etc.)
- Ensure `tsconfig.json` paths are correct

**Hot Reload Issues with MongoDB**:

- Use the `connectDB()` helper from `@/lib/db/mongoose`
- Don't create new connections in services
- Connection is cached and reused

**Build Failures**:

- Check for missing environment variables
- Run `pnpm lint` to catch linting issues
- Verify all imports are resolvable
- Ensure no Client Components are using server-only APIs

**Test Failures**:

- Check that test database connection is configured
- Ensure `MONGODB_URI_TEST` is set in `.env.local`
- Verify test setup and teardown are running
- Run tests in isolation: `pnpm test -- items.test.ts`

**Docker Issues**:

- Ensure `.env.local` is not copied to Docker (use `.env.production`)
- Check `MONGODB_URI` is configured for Docker network
- Verify health check endpoint is accessible

---

## Quick Reference

### Import Aliases

| Alias          | Resolves To               |
| -------------- | ------------------------- |
| `@/app`        | `apps/web/app`            |
| `@/features`   | `apps/web/src/features`   |
| `@/domain`     | `apps/web/src/domain`     |
| `@/lib`        | `apps/web/src/lib`        |
| `@/components` | `apps/web/src/components` |
| `@/styles`     | `apps/web/src/styles`     |
| `@/types`      | `apps/web/src/types`      |

### File Locations

| What             | Where                                     |
| ---------------- | ----------------------------------------- |
| API routes       | `app/(app)/api/{resource}/route.ts`       |
| Public pages     | `app/(public)/{page}/page.tsx`            |
| Feature services | `src/features/{feature}/lib/*.service.ts` |
| Feature UI       | `src/features/{feature}/components/`      |
| Domain entities  | `src/domain/entities.ts`                  |
| Mongoose schemas | `src/lib/db/schemas/{entity}.schema.ts`   |
| Shared utilities | `src/lib/utils/index.ts`                  |
| Auth config      | `src/lib/auth/config.ts`                  |
| AI/LangChain     | `src/lib/ai/langchainClient.ts`           |
| Tests            | `tests/api/{feature}.test.ts`             |

### Environment Variables

| Variable           | Purpose                        | Example                                      |
| ------------------ | ------------------------------ | -------------------------------------------- |
| `MONGODB_URI`      | MongoDB connection string      | `mongodb://localhost:27017/procureflow`      |
| `MONGODB_URI_TEST` | Test database connection       | `mongodb://localhost:27017/procureflow_test` |
| `NEXTAUTH_SECRET`  | NextAuth.js secret key         | `your-secret-key-here`                       |
| `NEXTAUTH_URL`     | Application URL                | `http://localhost:3000`                      |
| `OPENAI_API_KEY`   | OpenAI API key for AI features | `sk-your-openai-api-key`                     |
| `NODE_ENV`         | Environment mode               | `development` / `production` / `test`        |

---

## Additional Resources

- **Project README**: `README.md` - Setup and usage instructions
- **Contributing Guide**: `.github/CONTRIBUTING.md` - Development workflow
- **GitHub Copilot Instructions**: `.github/copilot-instructions.md` - Copilot-specific guidance
- **Architecture Documentation**: `ESTRUTURA.md` - Detailed architecture (PT-BR)
- **Guided Engineering Assets**: `.guided/` - Product docs and assessments

---

**Remember**: ProcureFlow is a bootstrap codebase. Focus on implementing clean, maintainable patterns that can be extended for specific procurement use cases. Prioritize type safety, proper architecture, and quality over speed.

**When in doubt**:

1. Check existing code for similar patterns
2. Review `.guided/assessment/` for recent fixes and standards
3. Follow Next.js 15 and React 18 best practices
4. Maintain consistency with established conventions
5. Ask for clarification rather than assuming requirements

---

_Happy coding! 🚀_
