# ProcureFlow

AI-native procurement platform for streamlined purchasing workflows.

## Overview

ProcureFlow is a modern procurement application that combines catalog management, shopping cart functionality, and AI-powered conversational assistance to simplify the purchasing process. Built with Next.js 15, TypeScript, and MongoDB, it provides a foundation for building intelligent procurement systems.

**Status**: Bootstrap v1.0 - Foundation infrastructure ready, business logic implementation in progress.

## Tech Stack

- **Frontend**: Next.js 15.0.1 (App Router), React 19.2.0, TypeScript 5.9.3
- **Backend**: Next.js API Routes, Service Layer Architecture
- **Database**: MongoDB 8.10.6 (local), MongoDB Atlas M0 (cloud)
- **AI**: LangChain + OpenAI GPT-3.5-turbo (function calling)
- **Auth**: NextAuth.js v5 (JWT sessions)
- **Styling**: Tailwind CSS 4.1.0, Radix UI
- **Infrastructure**: Docker Compose (local), GCP Cloud Run (production), Pulumi IaC
- **CI/CD**: GitHub Actions
- **Package Manager**: pnpm 10.21.0 (monorepo)

## Quick Start

### Prerequisites

- Node.js 20.x
- pnpm 10.21.0+
- Docker Desktop (for local development)
- OpenAI API key (optional, for AI features)

### Installation

```powershell
# Clone repository
git clone https://github.com/guiofsaints/procureflow.git
cd procureflow

# Install dependencies
pnpm install

# Copy environment template
cp packages/web/.env.example packages/web/.env.local

# Start local environment (MongoDB + Next.js)
pnpm docker:up

# Create MongoDB text index (required for catalog search)
pnpm --filter web db:create-text-index

# Seed database with test data (optional)
pnpm --filter web db:seed-office-items    # 200 office supplies
pnpm --filter web db:seed-initial-user    # Admin user
```

### Development

```powershell
# Start development server
pnpm dev

# Access application
# http://localhost:3000

# MongoDB UI (mongo-express)
# http://localhost:8081 (admin/password)
```

### Demo Credentials

- **Email**: `guilherme@procureflow.com`
- **Password**: `guigui123`

## Project Structure

```
procureflow/
├── packages/
│   ├── web/                        # Next.js application
│   │   ├── src/
│   │   │   ├── app/                # Next.js App Router pages
│   │   │   ├── features/           # Feature modules (catalog, cart, agent, etc.)
│   │   │   ├── components/         # Shared UI components
│   │   │   ├── lib/                # Shared libraries (db, auth, ai, utils)
│   │   │   └── domain/             # Domain entities and types
│   │   └── scripts/                # Database migration and seeding scripts
│   ├── infra/                      # Infrastructure as Code
│   │   ├── compose.yaml            # Docker Compose for local dev
│   │   ├── docker/                 # Dockerfiles
│   │   └── pulumi/gcp/             # Pulumi GCP deployment
│   └── docs/                       # Documentation site (future)
├── .guided/                        # Comprehensive documentation
│   ├── assessment/                 # Discovery and IA
│   ├── product/                    # PRD (features, requirements)
│   ├── architecture/               # C4 diagrams, tech stack, infrastructure
│   ├── api/                        # OpenAPI documentation
│   ├── testing/                    # Testing strategy
│   ├── operations/                 # Deployment, rollback, autoscaling
│   └── operation/runbooks/         # Operational runbooks
└── .github/workflows/              # CI/CD pipelines
```

## Core Features

### Catalog Management
- Search items with full-text search (MongoDB text index)
- Register new items with duplicate detection
- Filter by category, supplier, price range

### Shopping Cart
- Add/remove/update items with quantity validation
- Real-time total cost calculation
- Persistent cart per user session

### Checkout
- Create purchase requests from cart
- Generate unique PR numbers (PR-20251112-001)
- View purchase request history

### AI Agent (Conversational Interface)
- Natural language procurement assistance
- Function calling: search catalog, add to cart, checkout
- Conversation history with metadata tracking

### Authentication
- Session-based authentication (NextAuth.js)
- Credentials provider (demo user)
- Protected API routes and pages

## Architecture

### Feature-Based Organization

All business logic is organized in self-contained feature modules:

```
features/
  catalog/
    components/       # React UI components
    lib/             # Service layer (catalog.service.ts)
    index.ts         # Public API exports
    types.ts         # Feature-specific types
```

### Service Layer Pattern

Business logic lives in `*.service.ts` files, not route handlers:

- Database-agnostic interfaces (domain entities in/out)
- Framework-agnostic (usable in API routes, server components, background jobs)
- Validated with custom error classes (`ValidationError`, `DuplicateItemError`)

**Example**: `features/catalog/lib/catalog.service.ts` exports `searchItems()`, `createItem()`, `getItemById()`

Route handlers in `app/api/**/route.ts` are thin wrappers:
1. Extract/validate request data
2. Get authenticated user from session
3. Call service function
4. Return formatted response

## Documentation

Comprehensive documentation available in `.guided/` directory:

- **[Discovery Summary](.guided/assessment/docs.discovery-summary.md)** - Repository overview and key findings
- **[PRD: Objectives and Features](.guided/product/prd.objective-and-features.md)** - Product vision and features
- **[C4 Architecture](.guided/architecture/c4.context.md)** - System architecture diagrams
- **[Infrastructure Documentation](.guided/architecture/infrastructure.md)** - Deployment and environments
- **[API Documentation](.guided/api/openapi.status-and-plan.md)** - OpenAPI specification and coverage
- **[Testing Strategy](.guided/testing/testing-strategy.md)** - Testing pyramid and tooling
- **[Operations Runbooks](.guided/operation/runbooks/)** - Deployment, rollback, troubleshooting

Full documentation index: [.guided/README.md](.guided/README.md)

## Development Workflows

### Running Tests

```powershell
# Run unit tests
pnpm --filter web test

# Run tests in watch mode
pnpm --filter web test:watch

# Generate coverage report
pnpm --filter web test:coverage
```

### Code Quality

```powershell
# Lint and format check
pnpm lint

# Auto-fix issues
pnpm lint:fix

# Format code
pnpm format

# Type check
pnpm --filter web type-check
```

### Database Operations

```powershell
# Create MongoDB text index (required for search)
pnpm --filter web db:create-text-index

# Seed office supplies (200 items)
pnpm --filter web db:seed-office-items

# Seed initial admin user
pnpm --filter web db:seed-initial-user

# Access MongoDB shell
docker exec -it procureflow-mongo mongosh procureflow
```

### Docker Commands

```powershell
# Start all services
pnpm docker:up

# Start in development mode (with hot reload)
pnpm docker:up:dev

# Stop all services
pnpm docker:down

# Start only MongoDB
pnpm docker:db

# View logs
pnpm docker:logs

# List running containers
pnpm docker:ps
```

## Deployment

### Local Development

Uses Docker Compose for MongoDB + Next.js with hot reload:

```powershell
pnpm docker:up
```

Services:
- **Web**: http://localhost:3000
- **MongoDB**: localhost:27017
- **Mongo Express**: http://localhost:8081

### GCP Cloud Run (Dev Environment)

Automated deployment via GitHub Actions on push to `main`:

1. Build Docker image from `Dockerfile.web`
2. Push to GCP Artifact Registry
3. Deploy with Pulumi IaC (Cloud Run + Secret Manager + MongoDB Atlas)
4. Run health checks

Manual deployment:
```powershell
# Preview infrastructure changes
pnpm infra:preview

# Deploy infrastructure
pnpm infra:deploy

# View outputs (service URL)
pnpm infra:output
```

See [Deployment Strategy](.guided/operations/deployment-strategy.md) for detailed procedures.

## Environment Variables

Required environment variables (see `packages/web/.env.example`):

```bash
# Database
MONGODB_URI=mongodb://localhost:27017/procureflow

# Authentication (generate with: openssl rand -base64 32)
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3000

# AI (optional, use "not-set" if not available)
OPENAI_API_KEY=sk-proj-...

# Environment
NODE_ENV=development
```

## Contributing

### Commit Conventions

This project uses [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add shopping cart persistence
fix: resolve duplicate item detection
docs: update deployment runbook
chore: upgrade dependencies
```

Enforced by commitlint with Husky pre-commit hooks.

### Pull Request Process

1. Create feature branch: `git checkout -b feat/your-feature`
2. Implement changes following project conventions
3. Run tests and linting: `pnpm lint && pnpm test`
4. Commit with conventional commits
5. Push and create PR
6. Wait for CI checks to pass
7. Request review from tech lead

## Testing

Current test coverage: ~5% (1 test file with 6 tests)

Target coverage: 60% across all metrics (lines, functions, branches, statements)

Testing strategy:
- **70% unit tests**: Service layer, utilities (Vitest + mocks)
- **25% integration tests**: API routes + database (mongodb-memory-server)
- **5% e2e tests**: Critical user flows (Playwright, future)

See [Testing Strategy](.guided/testing/testing-strategy.md) for details.

## Troubleshooting

### MongoDB Connection Issues

**Error**: `ECONNREFUSED` or `MongooseServerSelectionError`

**Solution**: Ensure MongoDB is running:
```powershell
pnpm docker:db
```

### Text Search Not Working

**Error**: Catalog search returns empty or `IndexNotFound`

**Solution**: Create MongoDB text index:
```powershell
pnpm --filter web db:create-text-index
```

### Agent Search Returns No Results

**Causes**:
1. No items in database → Run `pnpm --filter web db:seed-office-items`
2. No text index → Run `pnpm --filter web db:create-text-index`
3. Missing OpenAI API key → Set `OPENAI_API_KEY` in `.env.local`

### Port Already in Use

**Error**: `Port 3000 is already in use`

**Solution**: Kill process using port or change Next.js port:
```powershell
# Find process using port 3000
netstat -ano | findstr :3000

# Kill process (replace PID)
taskkill /PID <PID> /F

# Or change port in package.json dev script
"dev": "next dev -p 3001"
```

## License

Private repository - All rights reserved.

## Support

- **Documentation**: See `.guided/` directory
- **Issues**: Open GitHub issue with `bug` or `question` label
- **Architecture Decisions**: See [Decision Log](.guided/architecture/stack-and-patterns.md)

---

**Version**: 1.0.0  
**Status**: Bootstrap - Foundation Ready  
**Last Updated**: 2025-11-12
