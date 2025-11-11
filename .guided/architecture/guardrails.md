# Guardrails and Technical Conventions

> **Status**: Extracted from codebase analysis  
> **Last Updated**: 2025-11-10

## Code Organization

### G-1: Feature-Based Structure
- All business logic in `features/<name>/` folders
- Each feature self-contained: components/, lib/, types.ts, index.ts
- Export via barrel files (index.ts)

### G-2: Service Layer Pattern
- Business logic ONLY in `*.service.ts` files
- Services return domain entities, not Mongoose documents
- Services framework-agnostic (no Next.js dependencies)
- Route handlers are thin wrappers calling services

### G-3: Import Conventions
- ✅ Import from barrel: `import { searchItems } from '@/features/catalog'`
- ❌ Direct service import: `import { searchItems } from '@/features/catalog/lib/catalog.service'`

## Database

### G-4: Connection Management
- Always `await connectDB()` before DB operations
- Use cached singleton pattern (`lib/db/mongoose.ts`)

### G-5: Domain Entities vs Mongoose Documents
- Define domain interfaces in `domain/entities.ts`
- Services accept/return domain entities
- Map Mongoose docs to entities before returning

### G-6: MongoDB Text Search
- Run `pnpm --filter web db:create-text-index` before using search
- Text search requires index on (name, category, description)

## Authentication

### G-7: Session Extraction
- API routes: `const session = await getServerSession(authConfig)`
- Server Components: Same pattern
- Client: `useSession()` hook

### G-8: User ID Flow
- Services accept `userId: string | Types.ObjectId`
- Support both authenticated users and demo scenarios

## TypeScript

### G-9: Type Safety
- Use TypeScript interfaces for all domain entities
- No `any` types (use `unknown` if truly generic)
- Validate inputs with Zod or custom validators

### G-10: Path Aliases
- Use `@/*` for imports from src/
- Configured in tsconfig.json

## Error Handling

### G-11: Custom Error Classes
- Throw typed errors: `ValidationError`, `DuplicateItemError`
- Route handlers map errors to HTTP status codes

### G-12: Error Response Format
```typescript
return NextResponse.json({ error: message }, { status: code })
```

## AI/LangChain

### G-13: Agent Tool Pattern
- Agent calls same service functions as API routes
- No duplicate logic
- Tools defined as JSON schemas

### G-14: Provider Abstraction
- Support OpenAI or Gemini via environment variable
- Use LangChain wrapper (`lib/ai/langchainClient.ts`)

## Component Patterns

### G-15: Server Components by Default
- Use `'use client'` only when needed (hooks, interactivity)
- Prefer Server Components for data fetching

### G-16: UI Components
- Use Radix primitives from `components/ui/`
- Follow shadcn-style patterns

## Testing (Planned)

### G-17: Test Organization
- Co-locate tests with features
- Use Vitest for unit tests
- Use Playwright for E2E

## Git Workflow

### G-18: Conventional Commits
- Required: `feat:`, `fix:`, `docs:`, `refactor:`, etc.
- Enforced by commitlint

### G-19: Code Quality Checks
- Pre-commit: `pnpm lint` + `pnpm format`
- Use Husky for git hooks

## Performance

### G-20: Database Queries
- Use `.lean()` for read-only queries (faster)
- Index frequently queried fields

### G-21: AI Token Management
- Count tokens with tiktoken
- Monitor costs per conversation

## Security

### G-22: Input Validation
- Validate all inputs before processing
- Use Zod schemas or custom validators

### G-23: Authentication Required
- All API routes check session
- No unauthenticated access to data

## What NOT to Do

❌ Implement business logic in route handlers  
❌ Import directly from `*.service.ts` files  
❌ Return Mongoose documents from services  
❌ Forget `connectDB()` before DB operations  
❌ Skip text index creation for search  
❌ Use `'use client'` unnecessarily  
❌ Commit `.env.local` or secrets  

## Related Documentation

- Architecture patterns: `.guided/architecture/context.md`
- Service examples: `.github/copilot-instructions.md`
