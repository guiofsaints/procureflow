# Contributing to ProcureFlow

Welcome to ProcureFlow! This document outlines our development workflow, coding standards, and contribution guidelines.

## 🎯 Overview

ProcureFlow is a bootstrap codebase for AI-native procurement platforms. We maintain high code quality standards and follow modern development practices to ensure the codebase remains maintainable and extensible.

## 🚀 Getting Started

### Prerequisites

Before contributing, ensure you have:

- **Node.js** 18+ with **pnpm** 8+
- **Git** with conventional commit knowledge
- **Docker** for local development
- **VS Code** (recommended) with suggested extensions

### Initial Setup

1. **Fork and Clone**

   ```bash
   git clone https://github.com/your-username/procureflow.git
   cd procureflow
   ```

2. **Install Dependencies**

   ```bash
   pnpm install
   ```

3. **Environment Configuration**

   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Verify Setup**
   ```bash
   pnpm dev
   pnpm lint
   pnpm type-check
   ```

## 🔀 Development Workflow

### Branch Naming Convention

Use descriptive branch names with prefixes:

```bash
feat/procurement-catalog-search      # New features
fix/auth-session-timeout            # Bug fixes
docs/api-documentation              # Documentation
refactor/database-connection        # Code refactoring
chore/update-dependencies           # Maintenance
```

### Development Process

1. **Create Feature Branch**

   ```bash
   git checkout -b feat/your-feature-name
   ```

2. **Make Changes**
   - Write code following our coding standards
   - Add tests for new functionality
   - Update documentation as needed

3. **Quality Checks**

   ```bash
   # Run before committing
   pnpm lint          # ESLint + Prettier
   pnpm type-check    # TypeScript validation
   pnpm build         # Ensure build passes
   ```

4. **Commit Changes**

   ```bash
   # Use conventional commits (enforced by commitlint)
   git add .
   git commit -m "feat: add procurement catalog search functionality"
   ```

5. **Push and Create PR**
   ```bash
   git push origin feat/your-feature-name
   # Create Pull Request on GitHub
   ```

## 📝 Coding Standards

### TypeScript Guidelines

- **Strict TypeScript**: All code must pass strict type checking
- **Explicit Types**: Prefer explicit types over `any`
- **Interface Design**: Use interfaces for object shapes
- **Null Safety**: Handle undefined/null cases explicitly

```typescript
// ✅ Good
interface ProcurementRequest {
  id: string;
  category: string;
  budget?: number;
}

async function fetchRequest(id: string): Promise<ProcurementRequest | null> {
  // Implementation
}

// ❌ Avoid
function fetchRequest(id: any): any {
  // Implementation
}
```

### React/Next.js Best Practices

- **Server Components**: Prefer server components when possible
- **Client Components**: Use `"use client"` only when necessary
- **Component Structure**: Keep components focused and reusable
- **Performance**: Optimize with React.memo, useMemo, useCallback when needed

```typescript
// ✅ Server Component (default)
export default function ProcurementPage() {
  return <div>Server-rendered content</div>;
}

// ✅ Client Component (when interactivity needed)
'use client';
export default function InteractiveCart() {
  const [items, setItems] = useState([]);
  return <div>Interactive content</div>;
}
```

### CSS/Tailwind Guidelines

- **Tailwind First**: Use Tailwind classes for styling
- **Custom CSS**: Only when Tailwind is insufficient
- **Responsive Design**: Mobile-first approach
- **Semantic Classes**: Use semantic utility combinations

```typescript
// ✅ Good
<button className="btn-primary hover:bg-blue-700 focus:ring-2 focus:ring-blue-500">
  Submit Request
</button>

// ✅ Custom component classes (in globals.css)
.btn-primary {
  @apply bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition-colors;
}
```

### Database & API Guidelines

- **Type Safety**: Use TypeScript for all database models
- **Error Handling**: Implement comprehensive error handling
- **Validation**: Validate all inputs at API boundaries
- **Performance**: Use connection pooling and query optimization

```typescript
// ✅ Typed database model
interface User {
  _id: ObjectId;
  email: string;
  name: string;
  role: 'admin' | 'user';
  createdAt: Date;
}

// ✅ API route with validation
export async function POST(request: Request) {
  try {
    const body = await request.json();
    // Validate input
    const result = await processRequest(body);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

## 🧪 Testing Guidelines

### Test Structure (Future Implementation)

When implementing tests, follow these patterns:

```typescript
// Unit tests
describe('ProcurementService', () => {
  it('should calculate total budget correctly', () => {
    // Test implementation
  });
});

// Integration tests
describe('API /api/procurement', () => {
  it('should create procurement request', async () => {
    // Test implementation
  });
});

// E2E tests
describe('Procurement Flow', () => {
  it('should complete procurement request workflow', () => {
    // Test implementation
  });
});
```

### Testing Principles

- **Test Coverage**: Aim for high coverage on critical paths
- **Test Isolation**: Each test should be independent
- **Clear Assertions**: Use descriptive test names and assertions
- **Mock External Services**: Mock AI services, databases in tests

## 🔧 Tooling and Configuration

### ESLint Configuration

Our ESLint setup enforces:

- Next.js and React best practices
- TypeScript strict rules
- Import order and organization
- Code complexity limits

### Prettier Configuration

Consistent code formatting with:

- 2 spaces indentation
- Single quotes for strings
- Trailing commas where valid
- 80 character line length

### Husky Hooks

Pre-commit hooks ensure:

- Conventional commit messages (commitlint)
- Code passes linting (ESLint)
- TypeScript compilation succeeds
- Tests pass (when implemented)

## 🚢 Deployment and Infrastructure

### Docker Development

- **Consistency**: Use Docker for local development
- **Multi-stage Builds**: Optimize production images
- **Health Checks**: Implement health checks for all services
- **Security**: Use non-root users in containers

### Pulumi Infrastructure

- **Infrastructure as Code**: All infrastructure defined in TypeScript
- **Environment Separation**: Clear dev/staging/prod separation
- **Secret Management**: Use cloud secret managers
- **Monitoring**: Implement observability from the start

```typescript
// ✅ Pulumi resource example
const cloudRunService = new gcp.cloudrun.Service('app', {
  location: region,
  template: {
    spec: {
      containers: [
        {
          image: appImage,
          resources: {
            limits: {
              cpu: '1000m',
              memory: '512Mi',
            },
          },
        },
      ],
    },
  },
});
```

## 📋 Pull Request Guidelines

### PR Template

When creating a pull request:

1. **Clear Title**: Use conventional commit format
2. **Description**: Explain what changes and why
3. **Testing**: Describe how you tested the changes
4. **Screenshots**: Include UI changes screenshots
5. **Breaking Changes**: Highlight any breaking changes

### Review Process

- **Code Review**: At least one approving review required
- **Automated Checks**: All CI checks must pass
- **Testing**: Manual testing for significant changes
- **Documentation**: Update docs for new features

### PR Checklist

- [ ] Code follows our coding standards
- [ ] Tests added for new functionality
- [ ] Documentation updated
- [ ] No breaking changes (or clearly documented)
- [ ] Build passes locally
- [ ] All lint/type checks pass

## 🔒 Security Guidelines

### API Security

- **Input Validation**: Validate all user inputs
- **Authentication**: Verify user authentication for protected routes
- **Rate Limiting**: Implement rate limiting for public APIs
- **CORS**: Configure CORS properly for production

### Database Security

- **Connection Security**: Use secure connection strings
- **Query Safety**: Prevent injection attacks
- **Access Control**: Implement proper database access controls
- **Data Encryption**: Encrypt sensitive data

### Environment Security

- **Secret Management**: Never commit secrets to version control
- **Environment Variables**: Use `.env.local` for local secrets
- **Production Secrets**: Use cloud secret managers in production
- **Access Logging**: Log access to sensitive operations

## 🔄 Release Process

### Versioning

We use semantic versioning (semver):

- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

### Release Steps

```bash
# Create release (automated with standard-version)
pnpm release

# This will:
# 1. Bump version in package.json
# 2. Update CHANGELOG.md
# 3. Create git tag
# 4. Push changes and tags
```

### Changelog

- **Automated**: Generated from conventional commits
- **Manual Curation**: Review and enhance generated changelog
- **Breaking Changes**: Clearly document breaking changes
- **Migration Guides**: Provide migration guides for major versions

## 📞 Getting Help

### Communication

- **GitHub Issues**: For bug reports and feature requests
- **GitHub Discussions**: For questions and general discussion
- **Code Review**: For technical discussions in PRs

### Resources

- **Documentation**: Check README.md and docs/ folder
- **Architecture**: Review project structure and patterns
- **Examples**: Look at existing code for patterns
- **External Docs**: Next.js, MongoDB, LangChain documentation

## 🎉 Recognition

Contributors who follow these guidelines and make valuable contributions will be:

- Listed in our contributors section
- Recognized in release notes
- Considered for maintainer status

Thank you for contributing to ProcureFlow! Together we're building the future of AI-native procurement. 🚀

---

**Questions?** Open a GitHub Discussion or reach out to the maintainers.
