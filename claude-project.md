# ProcureFlow - Claude Project Instructions

## Project Context

**ProcureFlow** is a production-ready bootstrap codebase for building AI-native procurement platforms. This repository serves as a comprehensive foundation for tech case implementations, providing modern full-stack architecture with integrated AI capabilities.

### What Makes This Project Unique

1. **Guided Engineering Framework** (`.guided/`)
   - Structured documentation and assessment workflows
   - Codebase quality reviews and maintenance logs
   - Technical standards and conventions documentation

2. **Tech Case Architecture** (Full-Stack + Infrastructure)
   - Modern Next.js 15 with App Router and TypeScript
   - AI-first mindset with LangChain and OpenAI integration
   - Production-ready infrastructure with Docker and Pulumi

3. **Bootstrap Foundation**
   - Zero business logic implemented
   - All technical plumbing complete
   - Ready for feature development

## Tech Stack Overview

### Application Layer

- **Frontend**: Next.js 15 (App Router) + React 18 + TypeScript
- **Styling**: Tailwind CSS with utility-first approach
- **Authentication**: Auth.js (NextAuth) with credentials provider
- **Database**: MongoDB with Mongoose ODM

### AI & Integration Layer

- **AI Orchestration**: LangChain for workflow management
- **AI Provider**: OpenAI GPT integration
- **Prompt Management**: Structured templates in `src/lib/ai/`

### Infrastructure Layer

- **Containerization**: Docker with multi-stage builds
- **Orchestration**: docker-compose for local development
- **Cloud Infrastructure**: Pulumi (TypeScript) targeting GCP
- **Package Management**: pnpm workspace monorepo

### Development Experience

- **Code Quality**: ESLint (flat config) + Prettier + TypeScript strict
- **Git Workflow**: Husky + commitlint (conventional commits)
- **Build System**: Next.js build + Pulumi deployment

## Architecture Principles

### File Organization

```
apps/web/               # Next.js application
├── app/               # App Router (pages + API routes)
├── src/lib/           # Domain-organized utilities
│   ├── auth/          # Authentication logic
│   ├── db/            # Database connections
│   ├── ai/            # LangChain + OpenAI
│   ├── utils/         # General utilities
│   └── constants/     # Application constants
├── src/components/    # React components
└── src/types/         # TypeScript definitions

infra/pulumi/gcp/      # Infrastructure as Code
docker/                # Container configurations
.guided/               # Guided Engineering documentation
```

### Code Patterns

- **React Server Components** by default (use `'use client'` sparingly)
- **TypeScript strict mode** with proper type definitions
- **Conventional imports** with external → internal organization
- **Utility-first CSS** with Tailwind conventions

## When Modifying Code

### ✅ Recommended Practices

1. **Respect Existing Patterns**
   - Follow established file organization in `src/lib/`
   - Use existing utility functions rather than creating duplicates
   - Maintain the App Router architecture

2. **TypeScript Excellence**
   - Use strict typing with proper interfaces
   - Prefer `const` over `let` for immutable values
   - Import types with `import type { }` when appropriate

3. **Next.js 15 Best Practices**
   - Implement Server Components for data fetching
   - Use proper error boundaries and loading states
   - Follow App Router patterns for routing and API routes

4. **AI Integration Standards**
   - Use the established LangChain client in `src/lib/ai/`
   - Leverage existing prompt templates
   - Handle AI errors gracefully with fallbacks

### ❌ Practices to Avoid

1. **Architecture Violations**
   - Don't mix application logic with infrastructure code
   - Avoid bypassing the established authentication patterns
   - Don't introduce new major dependencies without justification

2. **Code Quality Issues**
   - Don't use `console.log` for error logging (use `console.error`)
   - Avoid ignoring TypeScript errors or ESLint warnings
   - Don't skip conventional commit message format

3. **Pattern Inconsistencies**
   - Don't create Pages Router patterns (this is App Router only)
   - Avoid manual class concatenation (use `cn()` utility)
   - Don't implement client components when server components suffice

## Guided Engineering Integration

### Documentation Standards

- The `.guided/` folder contains authoritative project documentation
- Assessment files track codebase quality and maintenance history
- All architectural decisions should align with documented standards

### Code Review Approach

- Reference `.guided/assessment/` for established quality standards
- Follow the patterns documented in codebase review assessments
- Maintain consistency with the established fix logs and conventions

### Quality Gates

Before suggesting modifications:

1. Ensure TypeScript compilation succeeds
2. Verify ESLint passes without warnings
3. Check that patterns align with existing codebase
4. Confirm proper error handling is implemented

## AI Assistant Behavior Guidelines

### Context Awareness

- Always check existing implementations before suggesting new approaches
- Understand the bootstrap nature - avoid implementing business logic
- Respect the tech case structure and learning objectives

### Code Suggestions

- Provide explanations for pattern choices
- Reference existing code examples when helpful
- Suggest incremental improvements rather than major rewrites

### Problem Solving Approach

1. **Analyze** existing patterns and conventions
2. **Reference** documentation in `.guided/` folder
3. **Propose** solutions that maintain architectural consistency
4. **Explain** reasoning behind suggestions

## Environment Integration

### Development Workflow

- Use `pnpm` for package management across workspaces
- Run quality checks: `pnpm lint`, `pnpm format`, `pnpm type-check`
- Test builds with `pnpm build` before suggesting complex changes

### Infrastructure Awareness

- Understand Docker containerization patterns
- Respect Pulumi infrastructure definitions
- Consider GCP deployment implications for suggestions

### AI Integration Context

- Leverage existing LangChain setup for AI features
- Use environment variable patterns for API keys
- Handle AI service failures gracefully

## Success Criteria

### Code Quality

- Zero TypeScript errors
- Zero ESLint warnings
- Consistent formatting with Prettier
- Proper conventional commit messages

### Architecture Alignment

- Follows Next.js 15 App Router patterns
- Maintains separation between app and infrastructure
- Uses established utility functions and patterns

### Documentation Consistency

- Aligns with `.guided/` documentation standards
- Maintains codebase quality as documented in assessments
- Preserves the bootstrap foundation integrity

---

_These instructions help Claude understand ProcureFlow's unique architecture and provide contextually appropriate suggestions that respect the established patterns and Guided Engineering framework._
