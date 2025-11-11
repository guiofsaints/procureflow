# Technology Stack

> **Status**: Current State Documentation  
> **Last Updated**: 2025-11-10  
> **Persona**: DocumentationEngineer

## Overview

ProcureFlow is built on a modern, AI-first technology stack centered around Next.js 15, TypeScript, MongoDB, and LangChain. The stack prioritizes type safety, developer experience, and AI integration.

## Core Technologies

### Frontend

| Technology          | Version | Purpose                    | Notes                                     |
| ------------------- | ------- | -------------------------- | ----------------------------------------- |
| **Next.js**         | 16.0.1  | Full-stack React framework | App Router, Server Components, API Routes |
| **React**           | 19.2.0  | UI library                 | Server Components by default              |
| **TypeScript**      | 5.9.3   | Type system                | Strict mode disabled (gradual migration)  |
| **Tailwind CSS**    | 4.1.17  | Styling framework          | With @tailwindcss/postcss                 |
| **Radix UI**        | Various | Accessible UI primitives   | Alert, Dialog, Dropdown, Tabs, etc.       |
| **Lucide React**    | 0.553.0 | Icon library               | Consistent icon set                       |
| **React Hook Form** | 7.66.0  | Form management            | With Zod integration                      |
| **next-themes**     | 0.4.6   | Theme management           | Dark/light mode support                   |

### Backend & Database

| Technology      | Version   | Purpose          | Notes                                 |
| --------------- | --------- | ---------------- | ------------------------------------- |
| **Node.js**     | >=18.17.0 | Runtime          | Required minimum version              |
| **MongoDB**     | 6.0+      | Primary database | Document database                     |
| **Mongoose**    | 8.10.6    | ODM              | Schema validation, connection pooling |
| **NextAuth.js** | 4.24.13   | Authentication   | JWT strategy, Credentials provider    |
| **bcryptjs**    | 3.0.3     | Password hashing | For credentials auth                  |

### AI & Machine Learning

| Technology                  | Version | Purpose                   | Notes                              |
| --------------------------- | ------- | ------------------------- | ---------------------------------- |
| **LangChain Core**          | 1.0.3   | AI workflow orchestration | Message handling, chains           |
| **@langchain/openai**       | 1.0.0   | OpenAI integration        | GPT-4o-mini (default)              |
| **@langchain/google-genai** | 1.0.0   | Gemini integration        | Alternative to OpenAI              |
| **OpenAI SDK**              | 6.8.1   | Direct OpenAI API access  | For non-LangChain use cases        |
| **tiktoken**                | 1.0.22  | Token counting            | For monitoring and cost management |

### Observability & Reliability

| Technology       | Version | Purpose         | Notes                     |
| ---------------- | ------- | --------------- | ------------------------- |
| **winston**      | 3.18.3  | Logging         | Structured logging        |
| **winston-loki** | 6.1.3   | Log aggregation | Grafana Loki integration  |
| **prom-client**  | 15.1.3  | Metrics         | Prometheus metrics export |
| **opossum**      | 9.0.0   | Circuit breaker | Fault tolerance           |
| **bottleneck**   | 2.19.5  | Rate limiting   | API request throttling    |
| **p-retry**      | 7.1.0   | Retry logic     | Exponential backoff       |

### Developer Experience

| Technology           | Version | Purpose                   | Notes                       |
| -------------------- | ------- | ------------------------- | --------------------------- |
| **pnpm**             | 9.15.1  | Package manager           | Strict version requirement  |
| **ESLint**           | 9.39.1  | Linting                   | Next.js config + TypeScript |
| **Prettier**         | 3.4.2   | Code formatting           | Consistent style            |
| **Husky**            | 9.1.7   | Git hooks                 | Pre-commit checks           |
| **commitlint**       | 20.1.0  | Commit message validation | Conventional commits        |
| **tsx**              | 4.20.6  | TypeScript execution      | For scripts                 |
| **standard-version** | 9.5.0   | Versioning                | Automated changelog         |

### Infrastructure

| Technology         | Version | Purpose                | Notes                       |
| ------------------ | ------- | ---------------------- | --------------------------- |
| **Docker**         | Latest  | Containerization       | Multi-stage builds          |
| **docker-compose** | Latest  | Local development      | MongoDB + mongo-express     |
| **Pulumi**         | Latest  | Infrastructure as Code | GCP deployment (TypeScript) |

## Detailed Stack Analysis

### Next.js 15 (App Router)

**Why Next.js**:

- Server Components reduce client bundle size
- Built-in API routes for backend logic
- File-based routing with route groups
- Streaming and Suspense support
- Excellent TypeScript integration

**App Router Patterns**:

- `(public)/` - Unauthenticated routes
- `(app)/` - Authenticated routes
- Server Components by default
- Client Components (`'use client'`) only when needed

**API Route Pattern**:

- Thin wrappers around service layer
- Session extraction via NextAuth
- Error handling with typed errors
- JSON responses

### MongoDB + Mongoose

**Why MongoDB**:

- Flexible schema for rapid iteration
- Full-text search with text indexes
- Native JSON support
- Mature Node.js driver

**Mongoose ODM**:

- Schema validation
- TypeScript integration via discriminated types
- Connection pooling with singleton pattern
- Middleware (pre/post hooks)

**Connection Pattern**:

```typescript
// Cached singleton to handle Next.js hot reloads
await connectDB(); // Before any DB operation
```

**Text Search**:

- Requires index: `db:create-text-index` script
- Used for catalog search
- Scored results by relevance

### LangChain + OpenAI/Gemini

**Architecture**:

1. **Provider abstraction**: Support OpenAI or Gemini via environment variable
2. **LangChain wrapper**: `lib/ai/langchainClient.ts`
3. **Function calling**: Agent tools defined as JSON schemas
4. **Message history**: Stored in MongoDB for conversation context

**AI Provider Selection**:

- Default: OpenAI (GPT-4o-mini)
- Fallback: Google Gemini (gemini-2.0-flash)
- Configurable via `AI_PROVIDER` environment variable

**Token Management**:

- `tiktoken` for accurate token counting
- Cost tracking per conversation
- Model-specific limits

### Authentication (NextAuth.js)

**Strategy**: JWT (JSON Web Tokens)

- No database sessions (stateless)
- Credentials provider for demo (`demo@procureflow.com` / `demo123`)
- Future: OAuth providers (Google, Microsoft)

**Session Flow**:

```typescript
// API routes and Server Components
const session = await getServerSession(authConfig);

// Client components
const { data: session } = useSession();
```

**Security**:

- Passwords hashed with bcryptjs (10 rounds)
- JWT secret in environment variable (`NEXTAUTH_SECRET`)
- HTTPS required in production

### Observability Stack

**Logging (Winston)**:

- Structured JSON logs
- Multiple transports (console, Loki)
- Contextual metadata (userId, requestId)
- Log levels: error, warn, info, debug

**Metrics (Prometheus)**:

- Custom metrics: request duration, AI token usage
- Histogram for latency percentiles
- Counter for errors
- Gauge for active sessions
- Exported at `/api/metrics`

**Reliability**:

- **Circuit Breaker** (Opossum): Prevent cascading failures on AI API
- **Rate Limiting** (Bottleneck): Respect OpenAI rate limits (60 req/min)
- **Retry Logic** (p-retry): Exponential backoff for transient errors

### UI Component Library

**Radix UI Primitives**:

- Unstyled, accessible components
- Full keyboard navigation
- ARIA attributes
- Customized with Tailwind

**Component Pattern** (shadcn-style):

```typescript
// components/ui/button.tsx
import { Slot } from '@radix-ui/react-slot';
import { cva } from 'class-variance-authority';
// Variants defined with CVA, styled with Tailwind
```

**Key Components**:

- Alert Dialog - Confirmation modals
- Dropdown Menu - User menu, context menus
- Tabs - Multi-panel layouts
- Form - React Hook Form integration
- Table - Data tables with @tanstack/react-table

### Development Tooling

**pnpm Workspaces**:

- Monorepo structure
- Shared dependencies
- Workspace protocol for internal packages
- Strict version enforcement

**ESLint + Prettier**:

- Next.js recommended rules
- TypeScript-aware linting
- Import order enforcement
- Consistent formatting

**Git Workflow**:

- Husky pre-commit: lint + format check
- Commitlint: Conventional commits (feat, fix, docs, etc.)
- standard-version: Automated changelog and versioning

## Architecture Decisions

### Why pnpm over npm/yarn?

- **Disk efficiency**: Content-addressable storage, hard links
- **Strict mode**: Prevents phantom dependencies
- **Performance**: Faster installs
- **Workspace support**: Native monorepo support

### Why MongoDB over PostgreSQL?

- **Schema flexibility**: Rapid iteration without migrations
- **Document model**: Natural fit for complex nested data (cart items, agent messages)
- **Full-text search**: Built-in text index for catalog search
- **Developer experience**: Mongoose ODM simplifies TypeScript integration

**Trade-off**: Less strict data integrity vs. faster development

### Why LangChain over direct OpenAI SDK?

- **Provider abstraction**: Swap OpenAI ↔ Gemini without code changes
- **Message management**: Simplified conversation history
- **Tool calling**: Structured function definitions and execution
- **Future-proof**: Easier to add more providers or capabilities

**Trade-off**: Additional abstraction layer, slightly larger bundle

### Why JWT over session database?

- **Stateless**: No session storage required
- **Scalability**: No shared state between servers
- **Simplicity**: Fewer moving parts

**Trade-off**: Cannot invalidate sessions server-side (requires expiry)

## Runtime Requirements

### Development

- Node.js 18.17.0+
- pnpm 9.15.1 (exact version)
- MongoDB 6.0+ (local or Docker)
- Environment variables (see `.guided/context/env.md`)

### Production

- Node.js 18.17.0+ (Docker image: `node:18-alpine`)
- MongoDB 6.0+ (MongoDB Atlas recommended)
- Environment variables for secrets
- HTTPS reverse proxy (nginx, Cloudflare)

## Environment Variables

See `.guided/context/env.md` for complete reference.

**Critical Variables**:

- `MONGODB_URI` - Database connection string
- `NEXTAUTH_SECRET` - JWT secret
- `NEXTAUTH_URL` - Application URL
- `OPENAI_API_KEY` or `GOOGLE_API_KEY` - AI provider

## Deployment Targets

### Local Development

```bash
pnpm dev  # Next.js dev server on :3000
pnpm docker:up  # Full stack with MongoDB
```

### Docker

- Multi-stage build in `packages/infra/docker/Dockerfile.web`
- Production build → nginx or standalone Next.js server
- Health checks via `/api/health`

### Cloud (Pulumi + GCP)

- Infrastructure as Code: `packages/infra/pulumi/gcp/`
- Targets: Cloud Run, Cloud SQL (MongoDB alternative), Cloud Storage
- Secrets: Google Secret Manager

## Dependency Management

### Update Strategy

- **Minor/patch**: Update regularly (weekly)
- **Major**: Evaluate breaking changes, update in dedicated PR
- **Security**: Update immediately via `pnpm audit`

### Lock Files

- `pnpm-lock.yaml` committed to git
- Reproducible builds across environments
- Verify lock file integrity in CI

## Testing Dependencies

**Currently Minimal** (See `.guided/testing/risks.md`):

- No test framework configured yet
- Planned: Vitest, @testing-library/react, Playwright

## Performance Considerations

### Bundle Size

- Server Components reduce client JavaScript
- Dynamic imports for heavy libraries
- Icon tree-shaking with Lucide

### Database Performance

- Indexes on frequently queried fields
- Text index for search
- Mongoose lean() for read-only queries
- Connection pooling

### AI Performance

- Token counting to avoid quota issues
- Caching for repeated queries (future)
- Streaming responses for long completions (future)

## Security Considerations

### Dependencies

- Regular `pnpm audit` checks
- Automated updates via Dependabot (future)
- Review supply chain risks

### Runtime

- Environment variable validation
- Input sanitization (Zod schemas)
- HTTPS in production
- Rate limiting on AI endpoints

## Future Stack Evolution

### Planned Additions

- **Testing**: Vitest, Playwright, Testing Library
- **E2E Testing**: Playwright for critical flows
- **Monitoring**: Sentry for error tracking
- **CDN**: Cloudflare for static assets
- **Cache**: Redis for session caching (if moving away from JWT)

### Potential Replacements

- **Database**: Consider PostgreSQL if strict relational model needed
- **AI Provider**: Add Anthropic Claude support
- **Auth**: Consider Auth0 or Clerk for OAuth providers

## Related Documentation

- Architecture context: `.guided/architecture/context.md`
- Domain entities: `.guided/architecture/entities.md`
- Deployment guide: `.guided/base/setup.instructions.md`
- Environment variables: `.guided/context/env.md`
