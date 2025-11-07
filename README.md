# ProcureFlow - AI-Native Procurement Platform

**Bootstrap Codebase for Tech Case Implementation**

ProcureFlow is a production-ready starter codebase for building an AI-native procurement platform. This repository provides a clean, well-structured foundation with all the essential tooling and infrastructure plumbing in place, ready for implementing business logic and advanced procurement features.

## 🎯 Project Context

This is a **bootstrap codebase** designed for a tech case study focused on AI-native procurement. The foundation includes:

- ✅ **Complete full-stack setup** with modern tooling
- ✅ **Authentication and database integration** ready
- ✅ **AI/LangChain integration** for future agent development
- ✅ **Docker and cloud infrastructure** prepared
- ✅ **Development workflow** with linting, formatting, and conventional commits
- ❌ **No business logic implemented** - ready for feature development

## 🏗️ Tech Stack

### Core Framework

- **Next.js 15** with App Router and TypeScript
- **Tailwind CSS** for styling
- **React 18** with modern patterns

### Authentication & Database

- **Auth.js (NextAuth)** with Credentials provider configured
- **MongoDB** with Mongoose ODM
- Connection pooling and hot reload support

### AI & Machine Learning

- **LangChain** for AI workflow orchestration
- **OpenAI GPT** integration
- Structured prompt templates for procurement use cases

### Infrastructure & DevOps

- **Docker** with multi-stage builds
- **docker-compose** for local development
- **Pulumi** (TypeScript) for GCP deployment
- **pnpm** workspace monorepo structure

### Developer Experience

- **ESLint & Prettier** with strict TypeScript rules
- **Husky & commitlint** for conventional commits
- **standard-version** for automated changelog
- Comprehensive VS Code configuration

## 📁 Project Structure

```
procureflow/
├── apps/
│   └── web/                    # Next.js application
│       ├── app/               # App Router pages & API routes
│       │   ├── api/health/    # Health check endpoint
│       │   ├── api/auth/      # NextAuth.js routes
│       │   ├── layout.tsx     # Root layout
│       │   └── page.tsx       # Landing page
│       └── src/
│           ├── lib/
│           │   ├── auth/      # Authentication configuration
│           │   ├── db/        # Database connection helpers
│           │   └── ai/        # LangChain & OpenAI integration
│           └── styles/        # Global CSS and Tailwind
├── infra/
│   └── pulumi/gcp/           # Infrastructure as Code
├── docker/                   # Docker configurations
└── docs/                     # Documentation (future)
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+
- **pnpm** 8+
- **Docker** & docker-compose (optional)
- **MongoDB** (local or cloud)

### 1. Install Dependencies

```bash
# Install all workspace dependencies
pnpm install
```

### 2. Environment Setup

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your configuration
# See "Environment Variables" section below
```

### 3. Run Development Server

```bash
# Start Next.js development server
pnpm dev

# Or with Docker (includes MongoDB)
pnpm docker:up
```

The application will be available at:

- **Web App**: http://localhost:3000
- **Health Check**: http://localhost:3000/api/health
- **MongoDB Admin** (Docker): http://localhost:8081

### 4. Verify Setup

- ✅ Visit http://localhost:3000 to see the landing page
- ✅ Check http://localhost:3000/api/health for API status
- ✅ Run `pnpm lint` to verify code quality setup
- ✅ Test authentication with demo credentials (see Auth section)

## 🔧 Development Workflow

### Available Scripts

```bash
# Development
pnpm dev              # Start development server
pnpm build            # Build for production
pnpm start            # Start production server

# Code Quality
pnpm lint             # Run ESLint + Prettier check
pnpm lint:fix         # Fix linting issues
pnpm format           # Format code with Prettier
pnpm type-check       # TypeScript type checking

# Release Management
pnpm release          # Generate changelog and version bump

# Docker
pnpm docker:up        # Start all services with Docker
pnpm docker:down      # Stop Docker services
pnpm docker:build     # Rebuild Docker images
```

### Conventional Commits

This project uses conventional commits for automated changelog generation:

```bash
feat: add new procurement analysis feature
fix: resolve database connection issue
docs: update API documentation
chore: update dependencies
```

Commit messages are validated using commitlint on commit.

## 🔐 Authentication

### Demo Credentials (Bootstrap Only)

The credentials provider is configured with demo credentials for testing:

- **Email**: `demo@procureflow.com`
- **Password**: `demo123`

⚠️ **Important**: Replace the demo authentication logic in `src/lib/auth/config.ts` with proper user verification for production use.

### Google OAuth (Stubbed)

Google OAuth provider is configured but commented out. To enable:

1. Create a Google OAuth app in Google Cloud Console
2. Add `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` to `.env`
3. Uncomment the GoogleProvider in `src/lib/auth/config.ts`

## 🗄️ Database

### MongoDB Setup

The app uses MongoDB with Mongoose. Connection is cached to handle Next.js hot reloads.

#### Local MongoDB

```bash
# With Docker (recommended for development)
pnpm docker:up

# Or install MongoDB locally and use:
MONGODB_URI=mongodb://localhost:27017/procureflow
```

#### MongoDB Atlas (Cloud)

```bash
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/procureflow
```

### Database Health Check

The `/api/health` endpoint includes database connectivity verification (when uncommented in the health route).

## 🤖 AI Integration

### LangChain & OpenAI Setup

1. Get an OpenAI API key from https://platform.openai.com/
2. Add to your `.env`:
   ```bash
   OPENAI_API_KEY=sk-your-api-key-here
   ```

### Usage Examples

```typescript
import { chatCompletion, promptTemplates } from '@/lib/ai/langchainClient';

// Simple completion
const response = await chatCompletion('Analyze this procurement request...');

// Using predefined templates
const analysis = await chatCompletion(
  promptTemplates.analyzeRequest('Office supplies for Q1').prompt,
  { systemMessage: promptTemplates.analyzeRequest('').systemMessage }
);
```

## 🐳 Docker Setup

### Local Development with Docker

```bash
# Start all services (web + MongoDB)
docker-compose up

# With MongoDB admin UI
docker-compose --profile debug up

# Build and run
docker-compose up --build
```

### Production Deployment

The multi-stage Dockerfile builds an optimized production image:

```bash
# Build production image
docker build -f docker/Dockerfile.web -t procureflow-web .

# Run production container
docker run -p 3000:3000 procureflow-web
```

## ☁️ Infrastructure (Pulumi + GCP)

### Setup

1. Install Pulumi CLI: https://www.pulumi.com/docs/get-started/install/
2. Configure GCP credentials
3. Initialize Pulumi stack

```bash
cd infra/pulumi/gcp

# Install dependencies
pnpm install

# Login to Pulumi
pulumi login

# Create a new stack
pulumi stack init dev

# Configure GCP project
pulumi config set gcp:project your-gcp-project-id
pulumi config set gcp:region us-central1

# Preview infrastructure changes
pnpm pulumi:preview

# Deploy infrastructure
pnpm pulumi:up
```

### Resources Created

- **Cloud Run service** for the Next.js app
- **Storage bucket** for static assets
- **IAM policies** for public access
- Basic monitoring and health checks

**Note**: The current setup is minimal. For production, add Cloud SQL, Secret Manager, VPC, and proper IAM.

## 🌍 Environment Variables

### Required Variables

| Variable          | Description               | Example                                 |
| ----------------- | ------------------------- | --------------------------------------- |
| `MONGODB_URI`     | MongoDB connection string | `mongodb://localhost:27017/procureflow` |
| `NEXTAUTH_SECRET` | NextAuth.js secret key    | `your-secret-key-here`                  |
| `NEXTAUTH_URL`    | Application URL           | `http://localhost:3000`                 |

### Optional Variables

| Variable               | Description                    | Default       |
| ---------------------- | ------------------------------ | ------------- |
| `OPENAI_API_KEY`       | OpenAI API key for AI features | -             |
| `GOOGLE_CLIENT_ID`     | Google OAuth client ID         | -             |
| `GOOGLE_CLIENT_SECRET` | Google OAuth secret            | -             |
| `NODE_ENV`             | Environment mode               | `development` |

### Example .env.local

```bash
# Database
MONGODB_URI=mongodb://localhost:27017/procureflow

# Authentication
NEXTAUTH_SECRET=super-secret-key-change-in-production
NEXTAUTH_URL=http://localhost:3000

# AI Services (Optional)
OPENAI_API_KEY=sk-your-openai-api-key

# OAuth Providers (Optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Development
NODE_ENV=development
```

## 🔄 Future Implementation Areas

This bootstrap provides the foundation for implementing:

### Product Features

- **Procurement catalog** with search and filtering
- **Shopping cart** and approval workflows
- **AI procurement agent** with natural language interface
- **Supplier management** and evaluation
- **Contract lifecycle management**
- **Spend analytics** and reporting

### Infrastructure Extensions

- **Observability** with monitoring and logging
- **CI/CD pipelines** with GitHub Actions
- **Multi-environment** deployment (dev, staging, prod)
- **Performance optimization** and caching
- **Security hardening** and compliance

### Architecture Patterns

- **Event-driven architecture** with message queues
- **Microservices** decomposition if needed
- **CQRS/Event Sourcing** for complex domains
- **GraphQL API** for flexible data access

## 🧪 Testing

Testing infrastructure is prepared but not yet implemented:

```bash
# Future commands (not yet implemented)
pnpm test           # Run unit tests
pnpm test:e2e       # Run end-to-end tests
pnpm test:coverage  # Generate coverage report
```

## 🤖 Using AI and IDE Assistants

ProcureFlow is optimized for modern AI-powered development workflows. We provide dedicated instruction files for popular AI assistants and IDEs to ensure consistent, high-quality code suggestions:

### GitHub Copilot

- **File**: [`.github/copilot-instructions.md`](./.github/copilot-instructions.md)
- **Purpose**: Project-specific guidelines for GitHub Copilot
- **Covers**: Tech stack patterns, coding standards, architecture guidelines, and forbidden practices

### Anthropic Claude

- **File**: [`claude-project.md`](./claude-project.md)
- **Purpose**: Comprehensive project context for Claude
- **Covers**: Guided Engineering framework, architecture principles, and behavior guidelines

### Windsurf IDE

- **File**: [`.windsurf/windsurf.yaml`](./.windsurf/windsurf.yaml)
- **Purpose**: Project-aware configuration for Windsurf
- **Covers**: Stack definition, key directories, coding standards, and quality conventions

### Continue Extension

- **File**: [`.continue/continue.yaml`](./.continue/continue.yaml)
- **Purpose**: VS Code Continue extension configuration
- **Covers**: System instructions, prompt snippets, and reusable tasks

### Contributing Guidelines

- **File**: [`.github/CONTRIBUTING.md`](./.github/CONTRIBUTING.md)
- **Purpose**: Complete contribution workflow documentation
- **Covers**: Setup, quality gates, Git workflow, and architecture guidelines

### Best Practices for AI-Assisted Development

When working with AI assistants on ProcureFlow:

1. **Read the Instructions First**: Each AI assistant has specific guidelines tailored to this project
2. **Follow Established Patterns**: All instruction files reference the same architectural conventions
3. **Respect the Bootstrap Nature**: This is a foundation codebase - avoid implementing business logic
4. **Use Quality Gates**: Always run `pnpm lint`, `pnpm type-check`, and `pnpm build` before committing
5. **Reference `.guided/` Documentation**: The Guided Engineering assets provide authoritative project standards

### Quick Reference

| Task                            | Recommended Tool | Instruction File                  |
| ------------------------------- | ---------------- | --------------------------------- |
| Code suggestions during typing  | GitHub Copilot   | `.github/copilot-instructions.md` |
| Complex refactoring or analysis | Claude           | `claude-project.md`               |
| Project-wide development        | Windsurf         | `.windsurf/windsurf.yaml`         |
| Custom prompts and snippets     | Continue         | `.continue/continue.yaml`         |
| Contributing to the project     | Human developers | `.github/CONTRIBUTING.md`         |

These instruction files ensure that AI assistants understand ProcureFlow's unique architecture, conventions, and quality standards, leading to more accurate and contextually appropriate suggestions.

## 📝 Contributing

See [CONTRIBUTING.md](./.github/CONTRIBUTING.md) for development workflow, coding standards, and contribution guidelines.

## 📜 License

MIT License - see [LICENSE](./LICENSE) file for details.

## 🆘 Support

For issues related to this bootstrap codebase:

1. Check the [troubleshooting section](./TROUBLESHOOTING.md)
2. Review environment variable configuration
3. Verify Docker and MongoDB connectivity
4. Check the health endpoint: http://localhost:3000/api/health

---

**Ready to build the future of AI-native procurement! 🚀**
