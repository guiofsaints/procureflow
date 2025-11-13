# References

**Executive Summary**: Comprehensive reference guide linking to external documentation, tools, and resources for ProcureFlow technology stack. Organized by category: Frameworks (Next.js, React, TypeScript), Backend (MongoDB, Mongoose, NextAuth.js), AI (LangChain, OpenAI), Testing (Vitest, Testing Library), Infrastructure (GCP, Pulumi, Docker), and Development Tools (pnpm, ESLint, GitHub Actions). Includes links to official docs, tutorials, and ProcureFlow internal documentation. Use as quick reference hub when implementing features or troubleshooting issues.

---

## Table of Contents

- [Framework Documentation](#framework-documentation)
- [Backend and Database](#backend-and-database)
- [AI and LangChain](#ai-and-langchain)
- [Testing](#testing)
- [Infrastructure and Cloud](#infrastructure-and-cloud)
- [Development Tools](#development-tools)
- [Documentation and Standards](#documentation-and-standards)
- [Internal Resources](#internal-resources)
- [References](#references)

---

## Framework Documentation

### Next.js

**Official Documentation**

- [Next.js Documentation](https://nextjs.org/docs) - Complete framework guide
- [App Router](https://nextjs.org/docs/app) - File-based routing system
- [API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers) - Server-side endpoints
- [Server Components](https://nextjs.org/docs/app/building-your-application/rendering/server-components) - React Server Components
- [Deployment](https://nextjs.org/docs/app/building-your-application/deploying) - Production deployment

**Key Concepts**

- [Data Fetching](https://nextjs.org/docs/app/building-your-application/data-fetching) - Server and client data patterns
- [Caching](https://nextjs.org/docs/app/building-your-application/caching) - Request memoization
- [Environment Variables](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables) - Configuration management
- [TypeScript](https://nextjs.org/docs/app/building-your-application/configuring/typescript) - TypeScript integration

---

### React

**Official Documentation**

- [React Documentation](https://react.dev/) - Modern React docs
- [React Hooks](https://react.dev/reference/react) - Hook API reference
- [Server Components](https://react.dev/reference/react/use-server) - RSC specification
- [Suspense](https://react.dev/reference/react/Suspense) - Async rendering

**Learning Resources**

- [Quick Start](https://react.dev/learn) - Interactive tutorial
- [Thinking in React](https://react.dev/learn/thinking-in-react) - Mental model
- [React Server Components](https://github.com/reactwg/server-components) - Working group

---

### TypeScript

**Official Documentation**

- [TypeScript Documentation](https://www.typescriptlang.org/docs/) - Language reference
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html) - Comprehensive guide
- [Type Compatibility](https://www.typescriptlang.org/docs/handbook/type-compatibility.html) - Type system
- [Utility Types](https://www.typescriptlang.org/docs/handbook/utility-types.html) - Built-in helpers

**Configuration**

- [tsconfig.json](https://www.typescriptlang.org/tsconfig) - Compiler options
- [Project References](https://www.typescriptlang.org/docs/handbook/project-references.html) - Monorepo setup

---

## Backend and Database

### MongoDB

**Official Documentation**

- [MongoDB Documentation](https://www.mongodb.com/docs/) - Database manual
- [MongoDB Atlas](https://www.mongodb.com/docs/atlas/) - Cloud database
- [Text Search](https://www.mongodb.com/docs/manual/text-search/) - Full-text search
- [Indexes](https://www.mongodb.com/docs/manual/indexes/) - Query optimization
- [Aggregation](https://www.mongodb.com/docs/manual/aggregation/) - Data processing

**Tools**

- [MongoDB Compass](https://www.mongodb.com/products/compass) - GUI client
- [mongosh](https://www.mongodb.com/docs/mongodb-shell/) - Shell client
- [Connection String](https://www.mongodb.com/docs/manual/reference/connection-string/) - URI format

---

### Mongoose

**Official Documentation**

- [Mongoose Documentation](https://mongoosejs.com/docs/) - ODM guide
- [Schemas](https://mongoosejs.com/docs/guide.html) - Schema definition
- [Models](https://mongoosejs.com/docs/models.html) - Model API
- [Queries](https://mongoosejs.com/docs/queries.html) - Query building
- [Validation](https://mongoosejs.com/docs/validation.html) - Data validation

**Key Features**

- [Middleware](https://mongoosejs.com/docs/middleware.html) - Pre/post hooks
- [Population](https://mongoosejs.com/docs/populate.html) - Reference resolution
- [Virtuals](https://mongoosejs.com/docs/tutorials/virtuals.html) - Computed properties

---

### NextAuth.js

**Official Documentation**

- [NextAuth.js Documentation](https://next-auth.js.org/) - Authentication library
- [Getting Started](https://next-auth.js.org/getting-started/introduction) - Setup guide
- [Configuration](https://next-auth.js.org/configuration/options) - Options reference
- [JWT Strategy](https://next-auth.js.org/configuration/options#jwt) - Token-based auth
- [Callbacks](https://next-auth.js.org/configuration/callbacks) - Lifecycle hooks

**Providers**

- [Credentials Provider](https://next-auth.js.org/providers/credentials) - Username/password
- [OAuth Providers](https://next-auth.js.org/providers/oauth) - Third-party auth

---

## AI and LangChain

### LangChain

**Official Documentation**

- [LangChain.js Documentation](https://js.langchain.com/docs/) - JavaScript library
- [Agents](https://js.langchain.com/docs/modules/agents/) - Agent systems
- [Tools](https://js.langchain.com/docs/modules/agents/tools/) - Tool creation
- [Chains](https://js.langchain.com/docs/modules/chains/) - LLM chains
- [Memory](https://js.langchain.com/docs/modules/memory/) - Conversation memory

**Integrations**

- [OpenAI Integration](https://js.langchain.com/docs/integrations/platforms/openai) - OpenAI models
- [Chat Models](https://js.langchain.com/docs/modules/model_io/chat/) - Chat completions

---

### OpenAI

**Official Documentation**

- [OpenAI API Documentation](https://platform.openai.com/docs/) - API reference
- [Function Calling](https://platform.openai.com/docs/guides/function-calling) - Tool usage
- [GPT-4 Models](https://platform.openai.com/docs/models/gpt-4-turbo-and-gpt-4) - Model specs
- [Chat Completions](https://platform.openai.com/docs/api-reference/chat) - API endpoint
- [Best Practices](https://platform.openai.com/docs/guides/prompt-engineering) - Prompt engineering

**Resources**

- [API Keys](https://platform.openai.com/api-keys) - Key management
- [Usage Dashboard](https://platform.openai.com/usage) - Cost tracking
- [Status Page](https://status.openai.com/) - Service status

---

## Testing

### Vitest

**Official Documentation**

- [Vitest Documentation](https://vitest.dev/) - Test framework
- [Getting Started](https://vitest.dev/guide/) - Setup guide
- [API Reference](https://vitest.dev/api/) - Test API
- [Coverage](https://vitest.dev/guide/coverage.html) - Code coverage
- [Mocking](https://vitest.dev/guide/mocking.html) - Mock functions

**Configuration**

- [Config Reference](https://vitest.dev/config/) - vitest.config.ts options
- [Environment](https://vitest.dev/guide/environment.html) - Test environment

---

### Testing Library

**Official Documentation**

- [Testing Library Documentation](https://testing-library.com/) - Testing philosophy
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/) - React testing
- [Queries](https://testing-library.com/docs/queries/about) - Element selection
- [User Events](https://testing-library.com/docs/user-event/intro) - User interactions

**Best Practices**

- [Common Mistakes](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library) - Kent C. Dodds

---

### mongodb-memory-server

**Documentation**

- [GitHub Repository](https://github.com/nodkz/mongodb-memory-server) - In-memory MongoDB
- [API Documentation](https://nodkz.github.io/mongodb-memory-server/) - API reference

---

## Infrastructure and Cloud

### Google Cloud Platform

**Cloud Run**

- [Cloud Run Documentation](https://cloud.google.com/run/docs) - Serverless containers
- [Deploying Containers](https://cloud.google.com/run/docs/deploying) - Deployment guide
- [Configuring Services](https://cloud.google.com/run/docs/configuring/services) - Service configuration
- [Autoscaling](https://cloud.google.com/run/docs/about-instance-autoscaling) - Scaling behavior
- [Troubleshooting](https://cloud.google.com/run/docs/troubleshooting) - Common issues
- [Pricing](https://cloud.google.com/run/pricing) - Cost calculator

**Other Services**

- [Secret Manager](https://cloud.google.com/secret-manager/docs) - Secrets management
- [Artifact Registry](https://cloud.google.com/artifact-registry/docs) - Container registry
- [Cloud Build](https://cloud.google.com/build/docs) - CI/CD platform
- [Identity and Access Management](https://cloud.google.com/iam/docs) - Permissions

**CLI Tools**

- [gcloud CLI](https://cloud.google.com/sdk/gcloud) - Command-line tool
- [gcloud Reference](https://cloud.google.com/sdk/gcloud/reference) - Command reference

---

### Pulumi

**Official Documentation**

- [Pulumi Documentation](https://www.pulumi.com/docs/) - IaC platform
- [Get Started](https://www.pulumi.com/docs/get-started/) - Quickstart guide
- [Concepts](https://www.pulumi.com/docs/intro/concepts/) - Core concepts
- [GCP Provider](https://www.pulumi.com/registry/packages/gcp/) - GCP integration
- [Cloud Run Resource](https://www.pulumi.com/registry/packages/gcp/api-docs/cloudrun/service/) - Service definition

**Advanced Topics**

- [Stack References](https://www.pulumi.com/docs/intro/concepts/stack/#stackreferences) - Cross-stack data
- [Secrets](https://www.pulumi.com/docs/intro/concepts/secrets/) - Encrypted config
- [State Management](https://www.pulumi.com/docs/intro/concepts/state/) - State backends

---

### Docker

**Official Documentation**

- [Docker Documentation](https://docs.docker.com/) - Container platform
- [Docker Compose](https://docs.docker.com/compose/) - Multi-container apps
- [Dockerfile Reference](https://docs.docker.com/engine/reference/builder/) - Build instructions
- [Docker CLI](https://docs.docker.com/engine/reference/commandline/cli/) - Command reference
- [Best Practices](https://docs.docker.com/develop/dev-best-practices/) - Production guidelines

**Tools**

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) - Development environment
- [Docker Hub](https://hub.docker.com/) - Image registry

---

## Development Tools

### pnpm

**Official Documentation**

- [pnpm Documentation](https://pnpm.io/) - Fast package manager
- [Workspaces](https://pnpm.io/workspaces) - Monorepo support
- [CLI Commands](https://pnpm.io/cli/install) - Command reference
- [Configuration](https://pnpm.io/npmrc) - .npmrc options

**Migration**

- [From npm/yarn](https://pnpm.io/installation#using-corepack) - Migration guide

---

### ESLint

**Official Documentation**

- [ESLint Documentation](https://eslint.org/docs/) - Linter
- [Configuration](https://eslint.org/docs/latest/use/configure/) - Config files
- [Rules](https://eslint.org/docs/rules/) - Rule reference
- [Plugins](https://eslint.org/docs/latest/extend/plugins) - Plugin system

**Integrations**

- [Next.js ESLint](https://nextjs.org/docs/app/building-your-application/configuring/eslint) - Next.js config
- [TypeScript ESLint](https://typescript-eslint.io/) - TS support

---

### Prettier

**Official Documentation**

- [Prettier Documentation](https://prettier.io/docs/) - Code formatter
- [Options](https://prettier.io/docs/en/options.html) - Formatting options
- [Configuration](https://prettier.io/docs/en/configuration.html) - Config files
- [Integrations](https://prettier.io/docs/en/integrations.html) - Editor setup

---

### Git and GitHub

**Git Documentation**

- [Git Documentation](https://git-scm.com/doc) - Version control
- [Pro Git Book](https://git-scm.com/book/en/v2) - Comprehensive guide
- [Git Workflows](https://git-scm.com/book/en/v2/Distributed-Git-Distributed-Workflows) - Collaboration

**GitHub**

- [GitHub Docs](https://docs.github.com/) - Platform documentation
- [GitHub Actions](https://docs.github.com/en/actions) - CI/CD automation
- [Workflow Syntax](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions) - YAML reference
- [Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets) - Secret management

---

## Documentation and Standards

### Markdown and MDX

**Documentation**

- [Markdown Guide](https://www.markdownguide.org/) - Syntax reference
- [GitHub Flavored Markdown](https://github.github.com/gfm/) - GitHub variant
- [MDX](https://mdxjs.com/) - Markdown + JSX

---

### Mermaid

**Official Documentation**

- [Mermaid Documentation](https://mermaid.js.org/) - Diagram syntax
- [Flowchart](https://mermaid.js.org/syntax/flowchart.html) - Flowchart syntax
- [Sequence Diagram](https://mermaid.js.org/syntax/sequenceDiagram.html) - Sequence syntax
- [Live Editor](https://mermaid.live/) - Online editor

---

### C4 Model

**Resources**

- [C4 Model](https://c4model.com/) - Architecture framework
- [Diagrams](https://c4model.com/#Diagrams) - Diagram types
- [Tooling](https://c4model.com/#Tooling) - Visualization tools

---

### Standards

**OpenAPI**

- [OpenAPI Specification](https://spec.openapis.org/oas/v3.0.3) - API spec standard
- [Swagger Editor](https://editor.swagger.io/) - Online editor
- [Redocly](https://redocly.com/docs/) - API documentation tools

**Versioning**

- [Semantic Versioning](https://semver.org/) - Version numbering
- [Keep a Changelog](https://keepachangelog.com/) - Changelog format

**Commits**

- [Conventional Commits](https://www.conventionalcommits.org/) - Commit format
- [commitlint](https://commitlint.js.org/) - Commit linting

---

## Internal Resources

### Documentation

**Core Documentation**

- [GitHub Repository](https://github.com/guiofsaints/procureflow) - Source code
- [README](https://github.com/guiofsaints/procureflow#readme) - Project overview
- [CHANGELOG](https://github.com/guiofsaints/procureflow/blob/main/CHANGELOG.md) - Version history
- [CONTRIBUTING](https://github.com/guiofsaints/procureflow/blob/main/CONTRIBUTING.md) - Contribution guide

**Architecture**

- [C4 Context Diagram](./architecture/c4.context.md) - System boundary
- [C4 Container Diagram](./architecture/c4.container.md) - Container architecture
- [Technology Stack](./architecture/stack-and-patterns.md) - Tech decisions
- [Infrastructure](./architecture/infrastructure.md) - Deployment architecture

**Product**

- [PRD: Objectives and Features](./product/prd.objective-and-features.md) - Product vision
- [Functional Requirements](./product/prd.functional-requirements.md) - Feature specs
- [Non-Functional Requirements](./product/prd.non-functional-requirements.md) - Quality attributes

**Operations**

- [Deployment Strategy](./operations/deployment-strategy.md) - Deployment guide
- [Rollback Strategy](./operations/rollback-strategy.md) - Rollback procedures
- [Autoscaling Policy](./operations/autoscaling-policy.md) - Scaling configuration

**Runbooks**

- [Local Development](./operation/runbooks/local-dev.md) - Setup guide
- [Build and Deploy](./operation/runbooks/build-and-deploy.md) - Deployment procedures
- [Rollback](./operation/runbooks/rollback.md) - Rollback execution
- [Autoscaling Check](./operation/runbooks/autoscaling-check.md) - Scaling verification
- [Troubleshooting](./operation/runbooks/troubleshooting.md) - Common issues

**Testing**

- [Testing Strategy](./testing/testing-strategy.md) - Test approach
- [CI Gates](./testing/ci-gates.md) - Quality gates

**API**

- [OpenAPI Status](./api/openapi.status-and-plan.md) - API documentation

---

### Configuration Files

**Root Level**

- [package.json](https://github.com/guiofsaints/procureflow/blob/main/package.json) - Workspace config
- [pnpm-workspace.yaml](https://github.com/guiofsaints/procureflow/blob/main/pnpm-workspace.yaml) - Workspace packages
- [tsconfig.json](https://github.com/guiofsaints/procureflow/blob/main/tsconfig.json) - TypeScript base config
- [commitlint.config.cjs](https://github.com/guiofsaints/procureflow/blob/main/commitlint.config.cjs) - Commit conventions

**Web Package**

- [packages/web/package.json](https://github.com/guiofsaints/procureflow/blob/main/packages/web/package.json) - Web dependencies
- [packages/web/tsconfig.json](https://github.com/guiofsaints/procureflow/blob/main/packages/web/tsconfig.json) - Web TypeScript config
- [packages/web/next.config.mjs](https://github.com/guiofsaints/procureflow/blob/main/packages/web/next.config.mjs) - Next.js config
- [packages/web/vitest.config.ts](https://github.com/guiofsaints/procureflow/blob/main/packages/web/vitest.config.ts) - Test config
- [packages/web/tailwind.config.ts](https://github.com/guiofsaints/procureflow/blob/main/packages/web/tailwind.config.ts) - Tailwind config

**Infrastructure**

- [packages/infra/compose.yaml](https://github.com/guiofsaints/procureflow/blob/main/packages/infra/compose.yaml) - Docker Compose
- [packages/infra/docker/Dockerfile.web](https://github.com/guiofsaints/procureflow/blob/main/packages/infra/docker/Dockerfile.web) - Web Dockerfile
- [packages/infra/pulumi/gcp/Pulumi.yaml](https://github.com/guiofsaints/procureflow/blob/main/packages/infra/pulumi/gcp/Pulumi.yaml) - Pulumi project

---

### Live Endpoints (Local)

- **Development Server**: http://localhost:3000
- **API Health Check**: http://localhost:3000/api/health
- **OpenAPI Spec**: http://localhost:3000/api/openapi
- **Catalog Search**: http://localhost:3000/api/items?query=chair
- **Agent Chat**: http://localhost:3000/agent
- **mongo-express**: http://localhost:8081 (MongoDB admin UI)

---

## Assumptions and Limitations

### Assumptions

- Links current as of publication date
- External documentation subject to change
- Internal links resolve to main branch
- Readers have internet access for external resources

### Known Limitations

- External links may break over time
- Some resources require paid accounts (GCP, OpenAI)
- Documentation versions may not match stack versions
- Internal links assume .guided/ directory structure

### Maintenance

- Quarterly review of external links
- Update on major version changes
- Broken link fixes as discovered
- New tool additions as needed

---

**Last Updated**: 2025-11-13  
**Version**: 1.0  
**Link Count**: 100+ external resources, 30+ internal docs
