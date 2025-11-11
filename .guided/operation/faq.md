# Frequently Asked Questions (FAQ)

> **Status**: Living Document  
> **Last Updated**: 2025-11-10

## General

### What is ProcureFlow?

ProcureFlow is an AI-native procurement platform that allows employees to request materials through conversational AI instead of complex ERP interfaces. It's a bootstrap codebase designed for rapid feature development.

### What is the current status?

ProcureFlow is in **MVP (v0.1.0)** status. Core infrastructure and architecture are complete. Business logic is ready for implementation. See `.guided/product/roadmap.md` for details.

### Is this production-ready?

**Partially**. The architecture and infrastructure are production-quality, but **automated tests are missing**. Add tests before deploying to production. See `.guided/testing/risks.md`.

---

## Development

### What do I need to get started?

- Node.js 18.17.0+
- pnpm 9.15.1 (exact version)
- MongoDB 6.0+ (or Docker)
- OpenAI or Google Gemini API key

See `.guided/base/setup.instructions.md`.

### Why pnpm instead of npm/yarn?

pnpm offers:
- Faster installs
- Disk efficiency (hard links)
- Strict mode (prevents phantom dependencies)
- Native workspace support

### Why MongoDB instead of PostgreSQL?

MongoDB provides:
- Schema flexibility for rapid iteration
- Built-in full-text search
- Natural fit for nested documents (cart items, agent messages)

Trade-off: Less strict data integrity vs. faster development.

### How do I add a new feature?

1. Create feature folder: `features/<name>/`
2. Add service: `features/<name>/lib/<name>.service.ts`
3. Add components: `features/<name>/components/`
4. Export via barrel: `features/<name>/index.ts`
5. Create API route: `app/(app)/api/<name>/route.ts`

See `.guided/architecture/context.md` for patterns.

### Where should business logic go?

**Always in `*.service.ts` files**, never in route handlers. Services are framework-agnostic and reusable.

### How do I run tests?

**Tests don't exist yet.** See `.guided/testing/strategy.md` for planned approach.

---

## AI Agent

### Which AI provider should I use?

**OpenAI** is the default (GPT-4o-mini). **Gemini** is available as a free alternative. Set `AI_PROVIDER` in `.env.local` to force a specific provider.

### How does the agent work?

1. User sends message
2. LangChain sends message + available tools to LLM
3. LLM decides which tool(s) to call
4. Agent service executes tools (calls service layer functions)
5. Results returned to LLM for response formatting
6. Formatted response sent to user

See `.guided/architecture/context.md` for detailed flow.

### How do I add a new agent tool?

1. Define tool JSON schema in `features/agent/lib/agent.service.ts`
2. Add case in `executeTool()` function
3. Call appropriate service function

Example: Adding a "cancel_order" tool would call `checkout.service.cancelPurchaseRequest()`.

### What if OpenAI is down?

Switch to Gemini:
```env
AI_PROVIDER=gemini
GOOGLE_API_KEY=your-key-here
```

Circuit breaker prevents cascading failures.

---

## Database

### How do I seed the database?

```zsh
# Create required text index
pnpm --filter web db:create-text-index

# Seed catalog items
pnpm --filter web db:seed-office-items

# Create demo user
pnpm --filter web db:seed-initial-user
```

### Why isn't search working?

Catalog search requires a text index on the `items` collection. Run:

```zsh
pnpm --filter web db:create-text-index
```

See `.guided/operation/troubleshooting.md#text-search-not-working`.

### How do I connect to MongoDB?

**Docker** (recommended):
```zsh
pnpm docker:db
```

**mongo-express** (GUI):  
http://localhost:8081

**mongosh** (CLI):
```zsh
mongosh mongodb://localhost:27017/procureflow
```

---

## Deployment

### How do I deploy to production?

**Planned deployment target**: Google Cloud Platform (GCP) with Pulumi

Infrastructure code in `packages/infra/pulumi/gcp/`.

**Not yet configured for production deployment.**

### What environment variables are required?

See `.guided/context/env.md` for complete reference.

**Required**:
- `MONGODB_URI`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- `OPENAI_API_KEY` or `GOOGLE_API_KEY`

### How do I generate NEXTAUTH_SECRET?

```zsh
openssl rand -base64 32
```

---

## Troubleshooting

### I'm getting MongoDB connection errors

See `.guided/operation/troubleshooting.md#mongodb-connection-errors`

Common solutions:
1. Ensure MongoDB is running: `pnpm docker:db`
2. Verify `MONGODB_URI` in `.env.local`
3. Test connection: `mongosh mongodb://localhost:27017/procureflow`

### The agent isn't responding

Check:
1. OpenAI API key is set
2. Catalog items exist (`db.items.countDocuments()`)
3. Text index exists (`pnpm --filter web db:create-text-index`)

See `.guided/operation/troubleshooting.md#agent-returns-no-results`

### TypeScript errors during build

Run type check:
```zsh
pnpm --filter web type-check
```

Common issues:
- Missing imports
- Incorrect path aliases (use `@/` imports)
- Environment variables not set

---

## Architecture

### Why the service layer pattern?

**Benefits**:
- Framework-agnostic (testable, reusable)
- Separation of concerns (HTTP vs. business logic)
- Can be called from API routes, Server Components, agent tools, or background jobs

See `.guided/architecture/context.md#layered-architecture`.

### What's the difference between domain entities and Mongoose documents?

- **Domain entities** (`domain/entities.ts`): Framework-agnostic TypeScript interfaces
- **Mongoose documents**: Database-specific schemas

Services accept and return domain entities, not Mongoose documents. This keeps business logic decoupled from database implementation.

### How do route handlers work?

Route handlers are **thin wrappers**:
1. Extract request data
2. Get session (authentication)
3. Call service function
4. Return formatted response

**No business logic in route handlers.**

---

## Testing

### Why are there no tests?

This is a **bootstrap codebase** focused on infrastructure and architecture. Tests should be added before production deployment.

See `.guided/testing/strategy.md` for planned approach.

### How do I add tests?

**Phase 1** (recommended):
1. Install Vitest: `pnpm add -D vitest @vitest/ui`
2. Create `vitest.config.ts`
3. Write service tests: `features/catalog/lib/catalog.service.test.ts`

See `.guided/testing/strategy.md#unit-tests`.

---

## Contributing

### What's the commit message format?

**Conventional Commits** enforced by commitlint:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types**: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`

**Example**:
```
feat(catalog): add price range filtering

Allow users to filter items by max price.

Closes #123
```

### What's the code style?

- **ESLint** for linting
- **Prettier** for formatting
- Pre-commit hooks enforce checks

Run:
```zsh
pnpm lint        # Check
pnpm lint:fix    # Fix
pnpm format      # Format
```

---

## Resources

- **Project Structure**: `.guided/base/project.structure.md`
- **Setup Guide**: `.guided/base/setup.instructions.md`
- **Architecture**: `.guided/architecture/context.md`
- **Troubleshooting**: `.guided/operation/troubleshooting.md`
- **Copilot Instructions**: `.github/copilot-instructions.md`

---

## Still Have Questions?

Check the documentation in `.guided/` or review the codebase. All files include inline comments and clear patterns.
