# Contributing to ProcureFlow

Welcome to ProcureFlow! This guide will help you contribute effectively to our AI-native procurement platform bootstrap codebase.

## Project Overview

ProcureFlow is a production-ready bootstrap foundation for tech case implementations. This repository provides a clean, well-structured foundation with all essential tooling and infrastructure plumbing in place, ready for implementing business logic and advanced procurement features.

## Development Setup

### Prerequisites

- **Node.js** 18+ (LTS recommended)
- **pnpm** 8+ (package manager)
- **Docker** & docker-compose (for local development)
- **Git** with conventional commit support

### Quick Setup

1. **Clone and Install**

   ```bash
   git clone <repository-url>
   cd procureflow
   pnpm install
   ```

2. **Environment Configuration**

   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start Development**

   ```bash
   # Option 1: Next.js only
   pnpm dev

   # Option 2: Full stack with Docker (includes MongoDB)
   pnpm docker:up
   ```

4. **Verify Setup**
   - Visit http://localhost:3000
   - Check http://localhost:3000/api/health
   - Run `pnpm lint` to verify tooling

## Development Workflow

### Available Scripts

| Command            | Description                     |
| ------------------ | ------------------------------- |
| `pnpm dev`         | Start development server        |
| `pnpm build`       | Build for production            |
| `pnpm start`       | Start production server         |
| `pnpm lint`        | Run ESLint + Prettier check     |
| `pnpm lint:fix`    | Fix auto-fixable linting issues |
| `pnpm format`      | Format code with Prettier       |
| `pnpm type-check`  | TypeScript type checking        |
| `pnpm docker:up`   | Start all services with Docker  |
| `pnpm docker:down` | Stop Docker services            |

### Quality Gates

Before submitting any changes, ensure:

1. **TypeScript compiles cleanly**

   ```bash
   pnpm type-check
   ```

2. **No linting errors**

   ```bash
   pnpm lint
   ```

3. **Code is properly formatted**

   ```bash
   pnpm format
   ```

4. **Build succeeds**
   ```bash
   pnpm build
   ```

## Coding Standards

### TypeScript Guidelines

- Use **strict mode** with `noEmit: true`
- Prefer `const` over `let` for immutable variables
- Use proper type definitions in `src/types/`
- Import types with `import type { }` when appropriate

### React & Next.js Patterns

- Use **App Router** (not Pages Router)
- Default to **React Server Components**
- Add `'use client'` only when necessary
- Place API routes in `app/api/`
- Follow Next.js 15 conventions

### File Organization

```
apps/web/src/
├── components/          # React components with index.ts exports
│   └── ui/             # Reusable UI components
├── lib/                # Domain-organized utilities
│   ├── auth/           # Authentication logic
│   ├── db/             # Database connections
│   ├── ai/             # LangChain & OpenAI integration
│   ├── utils/          # General utilities
│   └── constants/      # Application constants
├── styles/             # Global CSS and Tailwind
└── types/              # TypeScript type definitions
```

### Import Organization

```typescript
// 1. External libraries
import React from 'react';
import { NextRequest } from 'next/server';

// 2. Internal imports (with spacing)
import { Button } from '@/components/ui/button';
import { chatCompletion } from '@/lib/ai/langchainClient';
```

### CSS & Styling

- Use **Tailwind CSS** utility classes
- Use `cn()` utility for conditional classes
- Keep global styles minimal in `src/styles/globals.css`
- Follow responsive design patterns

## Git Workflow

### Branch Naming

Use descriptive branch names with prefixes:

```bash
feat/add-supplier-management
fix/auth-session-handling
docs/update-api-documentation
refactor/improve-database-connection
chore/update-dependencies
```

### Commit Messages

We use **conventional commits** enforced by commitlint:

```bash
feat: add supplier evaluation criteria
fix: resolve database connection pooling issue
docs: update API endpoint documentation
style: format code with prettier
refactor: extract authentication utilities
perf: optimize LangChain prompt processing
test: add unit tests for utility functions
build: update Next.js to latest version
ci: add automated testing workflow
chore: update package dependencies
```

### Commit Message Format

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types**: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`

### Pull Request Process

1. **Create Feature Branch**

   ```bash
   git checkout -b feat/your-feature-name
   ```

2. **Make Changes** following coding standards

3. **Run Quality Checks**

   ```bash
   pnpm lint:fix
   pnpm type-check
   pnpm build
   ```

4. **Commit with Conventional Format**

   ```bash
   git add .
   git commit -m "feat: add new feature description"
   ```

5. **Push and Create PR**
   ```bash
   git push origin feat/your-feature-name
   ```

## Infrastructure Development

### Docker Workflow

```bash
# Start local development environment
pnpm docker:up

# View logs
docker-compose logs -f web

# Rebuild after changes
pnpm docker:build

# Stop services
pnpm docker:down
```

### Pulumi Infrastructure

For infrastructure changes:

```bash
cd infra/pulumi/gcp

# Install dependencies
pnpm install

# Preview changes
pnpm pulumi:preview

# Apply changes (only after review)
pnpm pulumi:up
```

## AI Integration Guidelines

### LangChain Patterns

```typescript
import { chatCompletion, promptTemplates } from '@/lib/ai/langchainClient';

// Use predefined templates
const analysis = await chatCompletion(
  promptTemplates.analyzeRequest(requestText).prompt,
  { systemMessage: promptTemplates.analyzeRequest('').systemMessage }
);
```

### Environment Variables

Required for AI features:

- `OPENAI_API_KEY` - OpenAI API key
- Always check availability before making AI calls
- Handle failures gracefully with fallback responses

## Testing Guidelines

While the test suite is not yet implemented, follow these patterns:

```typescript
// Future testing patterns
describe('Component', () => {
  it('should render correctly', () => {
    // Test implementation
  });
});
```

## Documentation Standards

### Code Documentation

- Add JSDoc comments for public functions
- Document complex business logic
- Include usage examples for utilities

### README Updates

- Keep installation instructions current
- Document new environment variables
- Update architecture diagrams when needed

## Architecture Guidelines

### What to Build

✅ **Encouraged:**

- New React components with proper TypeScript
- API routes following established patterns
- Utility functions in appropriate `src/lib/` domains
- Infrastructure improvements via Pulumi
- Documentation and quality improvements

❌ **Discouraged:**

- Business logic implementation (this is a bootstrap)
- New major dependencies without discussion
- Changes to core infrastructure without review
- Bypassing established patterns

### Quality Reference

Refer to `.guided/assessment/` for:

- Established coding standards
- Quality benchmarks
- Recent fixes and improvements
- Architecture decisions

## Getting Help

### Resources

- **Documentation**: Check `.guided/` folder for standards
- **Examples**: Review existing code in `apps/web/src/`
- **Architecture**: See `README.md` for project structure

### Common Issues

1. **TypeScript Errors**: Run `pnpm type-check` for details
2. **Lint Failures**: Use `pnpm lint:fix` for auto-fixes
3. **Build Issues**: Check environment variables and dependencies
4. **Docker Problems**: Ensure Docker daemon is running

### Communication

- Create issues for bugs or feature requests
- Use descriptive titles and provide context
- Reference relevant code sections
- Include error messages and environment details

## Release Process

We use `standard-version` for automated releases:

```bash
# Generate changelog and bump version
pnpm release

# Push release
git push --follow-tags origin main
```

## Security Guidelines

- Never commit API keys or secrets
- Use environment variables for configuration
- Follow Docker security best practices
- Report security issues privately

---

Thank you for contributing to ProcureFlow! Your efforts help build a robust foundation for AI-native procurement platforms.

For questions or clarifications, please open an issue or reach out to the maintainers.
