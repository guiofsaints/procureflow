# GitHub Copilot Instructions for ProcureFlow

## Project Overview

**ProcureFlow** is an AI-native procurement platform built as a production-ready bootstrap codebase for tech case implementations. This repository provides a modern full-stack foundation with AI integration, ready for business logic development.

### Core Purpose

- **Bootstrap codebase** for AI-native procurement use cases
- **Production-ready** foundation with modern tooling
- **No business logic implemented** - ready for feature development

## Tech Stack

### Primary Technologies

- **Next.js 15** with App Router and TypeScript
- **React 18** with modern patterns
- **Tailwind CSS** for styling
- **Auth.js (NextAuth)** with Credentials provider
- **MongoDB** with Mongoose ODM
- **LangChain** for AI workflow orchestration
- **OpenAI GPT** integration

### Infrastructure

- **Docker** with multi-stage builds
- **Pulumi** (TypeScript) for GCP deployment
- **pnpm** workspace monorepo structure

### Development Tools

- **ESLint** with flat config (modernized)
- **Prettier** for code formatting
- **Husky** + **commitlint** for conventional commits
- **TypeScript** strict mode

## Folder Structure

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
│           │   ├── ai/        # LangChain & OpenAI integration
│           │   ├── utils/     # Utility functions
│           │   └── constants/ # Application constants
│           ├── components/    # React components
│           │   └── ui/        # UI component library
│           ├── styles/        # Global CSS and Tailwind
│           └── types/         # TypeScript type definitions
├── infra/
│   └── pulumi/gcp/           # Infrastructure as Code
├── docker/                   # Docker configurations
└── .guided/                  # Guided Engineering documentation
    └── assessment/           # Codebase reviews and fixes
```

## Coding Standards

### TypeScript Conventions

- Use **strict TypeScript** with `noEmit: true`
- Prefer `const` over `let` when variables are not reassigned
- Use proper type definitions in `src/types/`
- Import types with `import type { }` when appropriate

### React & Next.js Patterns

- Use **App Router** (not Pages Router)
- Place API routes in `app/api/`
- Use **React Server Components** by default
- Add `'use client'` only when necessary
- Follow Next.js 15 patterns and conventions

### File Organization

- Components in `src/components/` with proper exports from `index.ts`
- UI components in `src/components/ui/`
- Library code in `src/lib/` organized by domain:
  - `auth/` - Authentication logic
  - `db/` - Database connections and models
  - `ai/` - LangChain and OpenAI integration
  - `utils/` - General utilities
  - `constants/` - Application constants

### Import Organization

```typescript
// External libraries
import React from 'react';
import { NextRequest } from 'next/server';

// Internal imports (with proper spacing)
import { Button } from '@/components/ui/button';
import { chatCompletion } from '@/lib/ai/langchainClient';
```

### CSS & Styling

- Use **Tailwind CSS** utility classes
- Place global styles in `src/styles/globals.css`
- Follow Tailwind conventions for responsive design
- Use `cn()` utility for conditional classes

## Code Suggestions Guidelines

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

### DON'T ❌

- **Introduce new major dependencies** without justification
- **Mix business logic into infrastructure** code
- **Use `console.log` for error logging** (use `console.error`)
- **Create duplicate utility functions**
- **Bypass existing authentication patterns**
- **Use Pages Router patterns** (this is App Router only)
- **Ignore TypeScript errors or warnings**
- **Skip conventional commit format**

## AI Integration Patterns

### LangChain Usage

```typescript
import { chatCompletion, promptTemplates } from '@/lib/ai/langchainClient';

// Use predefined templates
const analysis = await chatCompletion(
  promptTemplates.analyzeRequest(requestText).prompt,
  { systemMessage: promptTemplates.analyzeRequest('').systemMessage }
);

// Custom prompts
const response = await chatCompletion('Your custom prompt here');
```

### Environment Variables

- Always check for required environment variables
- Use proper defaults and error handling
- Document new environment variables in README

## Authentication Patterns

### NextAuth.js Usage

```typescript
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';

// In Server Components or API routes
const session = await getServerSession(authOptions);
```

## Database Patterns

### Mongoose Connection

```typescript
import { connectDB } from '@/lib/db/mongoose';

// Always use the cached connection helper
await connectDB();
```

## Good vs Bad Examples

### ✅ Good: React Server Component

```typescript
// app/dashboard/page.tsx
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/auth/signin');
  }

  return <div>Dashboard content</div>;
}
```

### ❌ Bad: Client Component unnecessarily

```typescript
'use client';
import { useSession } from 'next-auth/react';

export default function DashboardPage() {
  const { data: session } = useSession();
  // This should be a Server Component instead
}
```

### ✅ Good: Utility Function Usage

```typescript
import { cn } from '@/lib/utils';

const buttonClass = cn(
  'px-4 py-2 rounded',
  isActive && 'bg-blue-500',
  className
);
```

### ❌ Bad: Manual Class Concatenation

```typescript
const buttonClass = `px-4 py-2 rounded ${isActive ? 'bg-blue-500' : ''} ${className || ''}`;
```

### ✅ Good: Error Handling

```typescript
try {
  const result = await apiCall();
  return result;
} catch (error) {
  console.error('API call failed:', error);
  throw new Error('Failed to fetch data');
}
```

### ❌ Bad: Poor Error Handling

```typescript
try {
  const result = await apiCall();
  return result;
} catch (error) {
  console.log(error); // Use console.error instead
  return null; // Don't silently fail
}
```

## Infrastructure Considerations

### Docker

- Use the existing multi-stage Dockerfile patterns
- Don't modify security settings without justification
- Health checks are already implemented

### Pulumi

- Keep infrastructure code in `infra/pulumi/gcp/`
- Use TypeScript for infrastructure definitions
- Don't mix application logic with infrastructure

## Quality Gates

Before suggesting code:

1. **TypeScript compiles** without errors
2. **ESLint passes** with zero warnings
3. **Follows existing patterns** in the codebase
4. **Proper error handling** implemented
5. **Conventional commit** format followed

## When in Doubt

1. **Check existing code** for similar patterns
2. **Review `.guided/assessment/`** for recent fixes and standards
3. **Follow Next.js 15 and React 18** best practices
4. **Maintain consistency** with established conventions
5. **Ask for clarification** rather than assuming requirements

---

_These instructions ensure GitHub Copilot suggestions align with ProcureFlow's architecture, conventions, and quality standards._
