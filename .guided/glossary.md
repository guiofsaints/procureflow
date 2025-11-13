# Glossary

**Executive Summary**: Comprehensive glossary of ProcureFlow domain terminology, technical concepts, and acronyms. Covers 60+ terms across business domains (Agent, Catalog, Cart, Checkout), architectural patterns (C4 Model, Domain Entity, Service Layer), infrastructure concepts (Cloud Run, Pulumi, IaC), and development practices (Conventional Commits, Feature-Based Structure). Each term includes clear definition and context within ProcureFlow implementation. Use as reference when reading technical documentation or contributing to codebase.

---

## Table of Contents

- [Business Domain Terms](#business-domain-terms)
- [Architecture and Patterns](#architecture-and-patterns)
- [Infrastructure and Deployment](#infrastructure-and-deployment)
- [Development and Tooling](#development-and-tooling)
- [Acronyms Reference](#acronyms-reference)
- [References](#references)

---

## Business Domain Terms

### Agent

AI-powered conversational interface that processes natural language requests to search catalog, add items to cart, and complete checkout. Built with LangChain and OpenAI function calling. Maintains conversation context in MongoDB to preserve state across messages.

### Agent Memory

Conversation context stored in MongoDB `agentConversations` collection to maintain state across messages, including previous items mentioned, cart state, and user preferences. Enables coherent multi-turn conversations.

### Catalog

Master list of available procurement items searchable via MongoDB text index. Each item has name, category, description, estimated price, status (Active/Inactive), and metadata. Seeded with 200 office supply items for demo purposes.

### Cart

Shopping cart containing items to purchase. Stored in MongoDB `carts` collection with user reference, items array, and timestamps. Supports add, update quantity, remove, and clear operations. One cart per user.

### Checkout

Process of converting cart to purchase request. Creates immutable snapshot of cart items with total price calculation. Clears cart upon successful checkout. Purchase request stored in `purchaseRequests` collection.

### Item

Procurement catalog item with properties: name, category, description, estimatedPrice, currency, unit, status, createdBy, timestamps. Searchable via full-text search on name, category, and description fields.

### Purchase Request (PR)

Immutable record created at checkout time. Contains snapshot of cart items, total price, requester information, status (Pending/Approved/Rejected), and timestamps. Represents formal procurement request requiring approval workflow (future enhancement).

---

## Architecture and Patterns

### C4 Model

Architecture visualization framework with 4 levels: Context (system boundary), Container (deployable units), Component (code modules), Code (classes). ProcureFlow uses Context and Container diagrams in `architecture/` directory to document system structure.

### Service Layer Pattern

Architectural pattern where business logic lives in `*.service.ts` files separate from route handlers. Services are database-agnostic, framework-agnostic, return domain entities, and handle validation. Route handlers are thin wrappers that call services.

### Domain Entity

Framework-agnostic TypeScript interface representing business concept (e.g., `Item`, `Cart`, `PurchaseRequest`). Defined in `domain/entities.ts`. Services return domain entities, not Mongoose documents, ensuring separation of concerns.

### Feature-Based Structure

Code organization pattern where each business domain (catalog, cart, checkout, agent, auth) lives in isolated `features/<name>/` directory with:

- `components/` - React UI components
- `lib/` - Service layer (`*.service.ts`)
- `types.ts` - Feature-specific types
- `index.ts` - Public API exports (barrel pattern)

### Barrel Export

Pattern where feature exports all public APIs through `index.ts` file. Consumers import from feature root: `import { searchItems } from '@/features/catalog'` instead of deep imports. Simplifies refactoring and encapsulation.

### Agent-First Architecture

Design philosophy where AI agent is primary interface, with traditional UI as secondary. Agent capabilities (search, add to cart, checkout) mirror UI workflows but prioritize natural language interaction.

---

## Infrastructure and Deployment

### Cloud Run

GCP serverless container platform hosting ProcureFlow. Auto-scales from 0-2 instances (dev) or 1-10 instances (prod) based on concurrent request load. Provides HTTPS endpoints, health checks, and pay-per-use pricing.

### Pulumi

Infrastructure as Code (IaC) platform using TypeScript. ProcureFlow Pulumi programs in `packages/infra/pulumi/gcp/` provision Cloud Run services, secrets, container images, and networking. State stored in Pulumi Cloud.

### Infrastructure as Code (IaC)

Practice of defining infrastructure (servers, networks, databases) as version-controlled code rather than manual configuration. ProcureFlow uses Pulumi TypeScript for reproducible deployments.

### Docker Compose

Tool for defining multi-container Docker applications. ProcureFlow uses `compose.yaml` for local development environment with MongoDB, mongo-express (admin UI), and web application containers.

### Artifact Registry

GCP container image registry storing Docker images built from `Dockerfile.web`. Images tagged with git SHA and deployed to Cloud Run. Provides vulnerability scanning and access control.

### Scale-to-Zero

Cloud Run feature terminating all instances after 15 minutes idle. Enabled in dev environment for cost savings ($0 when idle). Disabled in production (min 1 instance) to avoid cold starts.

### Cold Start

Startup latency (2-4 seconds) when Cloud Run scales from 0 instances. Caused by container initialization, package imports, and framework startup. Mitigated in production by maintaining min 1 instance.

### Concurrency

Number of simultaneous HTTP requests handled by single container instance. ProcureFlow targets 80 concurrent requests/instance for optimal cost/performance balance. Cloud Run auto-scales when concurrency threshold exceeded.

### Revision

Cloud Run deployment version. Each `pulumi up` creates new revision (e.g., `procureflow-web-00042-xyz`). Traffic can split between revisions for gradual rollout or instant rollback to previous revision.

---

## Development and Tooling

### Conventional Commits

Commit message format: `type(scope): subject`. Types: feat (new feature), fix (bug fix), docs (documentation), style (formatting), refactor (code restructure), test (tests), chore (build/config), perf (performance). Enforced by commitlint in CI.

### Next.js App Router

Next.js 15 routing system using file-system based routing in `app/` directory. Supports server components, API routes, layouts, and route groups `(app)` and `(public)` for organization without affecting URLs.

### Server Components

React components that render on server, not sent to client. Default in Next.js 15. Reduce JavaScript bundle size, enable direct database access, improve performance. Use `'use client'` directive for interactive components.

### API Route

Next.js server-side endpoint in `app/(app)/api/*/route.ts` that handles HTTP requests. Exports named functions (GET, POST, DELETE) and returns `NextResponse`. Thin wrapper around service layer functions.

### MongoDB Text Index

Database index enabling full-text search. Created on `items` collection fields: name, category, description. Required for catalog search functionality. Created by `pnpm --filter web db:create-text-index`.

### Mongoose

MongoDB ODM (Object Document Mapper) for Node.js. Provides schema definition, validation, type safety, and query building. Models defined in `lib/db/schemas/`, exported from `lib/db/models.ts`.

### NextAuth.js

Authentication library for Next.js using JWT strategy with 30-day session expiration. Demo credentials provider in `lib/auth/config.ts`. Session available via `getServerSession()` in server components and API routes.

### LangChain

Framework for building LLM applications. ProcureFlow uses it for agent tool orchestration, conversation management, and OpenAI function calling. Wrapper in `lib/ai/langchainClient.ts` handles tool execution.

### Function Calling

OpenAI technique where LLM analyzes user message and decides which tools to execute (search_catalog, add_to_cart, checkout) with appropriate parameters. Returns structured JSON response parsed and executed by agent service.

### Vitest

Test framework for unit and integration tests. Configuration in `vitest.config.ts`. Supports TypeScript, ESM, mongodb-memory-server for database tests. Coverage thresholds: 60% lines/functions/branches/statements.

### Mermaid

Diagram-as-code syntax embedded in Markdown for flowcharts, sequence diagrams, and C4 diagrams. Used throughout documentation for visual architecture representation. Renders in GitHub and VS Code.

---

## Acronyms Reference

| Acronym         | Full Term                                    | Definition                                                          |
| --------------- | -------------------------------------------- | ------------------------------------------------------------------- |
| **AI**          | Artificial Intelligence                      | Machine learning models (OpenAI GPT-4) powering agent               |
| **API**         | Application Programming Interface            | HTTP endpoints in `app/(app)/api/`                                  |
| **C4**          | Context, Containers, Components, Code        | Architecture diagram framework                                      |
| **CI/CD**       | Continuous Integration/Continuous Deployment | GitHub Actions workflow for automated deployment                    |
| **CPU**         | Central Processing Unit                      | Cloud Run instance CPU limit (1000m = 1 vCPU)                       |
| **CRUD**        | Create, Read, Update, Delete                 | Basic data operations                                               |
| **DDD**         | Domain-Driven Design                         | Software design approach focusing on domain models                  |
| **E2E**         | End-to-End                                   | Testing layer covering full user journeys (not implemented in v1.0) |
| **FR**          | Functional Requirement                       | Specific feature requirement with acceptance criteria               |
| **GCP**         | Google Cloud Platform                        | Cloud provider hosting ProcureFlow                                  |
| **IaC**         | Infrastructure as Code                       | Pulumi TypeScript programs                                          |
| **JWT**         | JSON Web Token                               | Session token format used by NextAuth.js                            |
| **LLM**         | Large Language Model                         | OpenAI GPT-4 model                                                  |
| **MDX**         | Markdown + JSX                               | Documentation file format (Markdown with React components)          |
| **MVP**         | Minimum Viable Product                       | v1.0 core features                                                  |
| **NFR**         | Non-Functional Requirement                   | System quality attributes                                           |
| **NPS**         | Net Promoter Score                           | Customer satisfaction metric (target: 20 → 70)                      |
| **ODM**         | Object Document Mapper                       | Mongoose MongoDB library                                            |
| **ORM**         | Object-Relational Mapper                     | Similar to ODM but for SQL databases                                |
| **p50/p95/p99** | 50th/95th/99th Percentile                    | Latency percentile targets (p95 < 2s)                               |
| **PR**          | Purchase Request                             | Checkout output (also Pull Request in Git context)                  |
| **PRD**         | Product Requirements Document                | Product specification document                                      |
| **RBAC**        | Role-Based Access Control                    | Permission system (planned for v1.1+)                               |
| **SLA**         | Service Level Agreement                      | Contractual uptime guarantee (99.5%)                                |
| **SLO**         | Service Level Objective                      | Performance target (p95 < 2s)                                       |
| **SSR**         | Server-Side Rendering                        | Next.js rendering strategy                                          |
| **TS**          | TypeScript                                   | Typed JavaScript superset                                           |
| **UI**          | User Interface                               | Frontend React components                                           |
| **URL**         | Uniform Resource Locator                     | Web address                                                         |

---

## Additional Terms

### Health Check

API endpoint (`/api/health`) that returns 200 status with database connection state. Used by Cloud Run to determine service health. Responds with `{ "status": "ok", "database": "connected" }`.

### Smoke Test

Post-deployment verification procedure testing critical paths: health check returns 200, root endpoint accessible, catalog search functional. Defined in deployment strategy as required validation step.

### Traffic Split

Cloud Run feature dividing traffic percentage between revisions (0-100%). Used for gradual rollout (canary deployment) or instant rollback. ProcureFlow uses 100% traffic to single revision (no gradual rollout in v1.0).

### Rollback

Reverting to previous stable version. Cloud Run: shift 100% traffic to previous revision (2-5 min). Pulumi: revert infrastructure code and run `pulumi up` (10-30 min). See rollback strategy document for procedures.

### Secret Manager

GCP service for storing sensitive configuration (API keys, database credentials, session secrets). Secrets mounted to Cloud Run containers as environment variables. Updated via Pulumi or gcloud CLI.

### Turbopack

Next.js fast bundler (Rust-based) for development mode. Faster compilation than Webpack. Used automatically in Next.js 15+ dev mode (`next dev --turbo`).

### Text Search

MongoDB feature for full-text search queries using `$text` operator. Searches indexed fields (name, category, description) with stemming and stop words. Case-insensitive, supports multiple languages.

### Session Token

JWT token storing user authentication state. Generated by NextAuth.js, stored in HTTP-only cookie, expires after 30 days. Contains user ID, email, and expiration timestamp.

---

## Assumptions and Limitations

### Assumptions

- Readers have basic knowledge of web development
- Terms explained in context of ProcureFlow implementation
- External tool documentation available for deeper reference
- Acronyms follow industry-standard definitions

### Known Limitations

- Glossary covers core terms, not exhaustive
- Some Next.js/React terms assumed knowledge
- GCP-specific terminology requires Cloud Console access
- Business domain evolves with feature additions

### Update Frequency

- Quarterly review for new terms
- Immediate update when new features add terminology
- Version-specific terms marked with version number
- Deprecated terms marked as such with replacement

---

## References

### Internal Documentation

- **[PRD: Objectives and Features](./product/prd.objective-and-features.md)** - Business domain concepts
- **[Technology Stack](./architecture/stack-and-patterns.md)** - Technical terminology
- **[Infrastructure Documentation](./architecture/infrastructure.md)** - Deployment terms
- **[C4 Context Diagram](./architecture/c4.context.md)** - System architecture
- **[Testing Strategy](./testing/testing-strategy.md)** - Testing terminology

### External Resources

- **[C4 Model](https://c4model.com/)** - Architecture framework
- **[MongoDB Glossary](https://www.mongodb.com/docs/manual/reference/glossary/)** - Database terms
- **[Next.js Glossary](https://nextjs.org/docs/app/building-your-application/routing)** - Framework concepts
- **[Cloud Run Documentation](https://cloud.google.com/run/docs)** - Platform terminology
- **[OpenAI Documentation](https://platform.openai.com/docs/)** - AI concepts

---

**Last Updated**: 2025-11-13  
**Version**: 1.0  
**Coverage**: 60+ terms across 4 categories
