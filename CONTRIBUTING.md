# Contributing to ProcureFlow

Thank you for your interest in contributing to ProcureFlow! This document provides guidelines and instructions for contributing to the project.

---

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Environment Setup](#development-environment-setup)
- [Contribution Workflow](#contribution-workflow)
- [Branch Strategy](#branch-strategy)
- [Commit Message Guidelines](#commit-message-guidelines)
- [Coding Standards](#coding-standards)
- [Testing Requirements](#testing-requirements)
- [Pull Request Process](#pull-request-process)
- [Release Process](#release-process)
- [Proposing Breaking Changes](#proposing-breaking-changes)
- [Getting Help](#getting-help)

---

## Code of Conduct

This project adheres to a code of conduct that promotes respectful, inclusive collaboration. By participating, you are expected to:

- Use welcoming and inclusive language
- Respect differing viewpoints and experiences
- Accept constructive criticism gracefully
- Focus on what is best for the project and community
- Show empathy towards other community members

Unacceptable behavior includes harassment, trolling, personal attacks, or other unprofessional conduct. Violations may result in temporary or permanent exclusion from the project.

---

## Getting Started

### Prerequisites

Before contributing, ensure you have the following installed:

- **Node.js**: v18.17.0 or higher (LTS recommended)
- **pnpm**: v8.0.0 or higher (package manager)
- **Docker**: Latest stable version (for local MongoDB)
- **Git**: Latest stable version

### Fork and Clone

1. Fork the repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/procureflow.git
   cd procureflow
   ```
3. Add the upstream repository as a remote:
   ```bash
   git remote add upstream https://github.com/guiofsaints/procureflow.git
   ```

---

## Development Environment Setup

### Quick Start (Recommended)

1. **Install dependencies**:

   ```bash
   pnpm install
   ```

2. **Set up environment variables**:

   ```bash
   cp packages/web/.env.example packages/web/.env.local
   ```

   Edit `packages/web/.env.local` and configure:
   - `MONGODB_URI`: MongoDB connection string (default: `mongodb://localhost:27017/procureflow`)
   - `NEXTAUTH_SECRET`: Generate with `openssl rand -base64 32`
   - `NEXTAUTH_URL`: Application base URL (default: `http://localhost:3000`)
   - `OPENAI_API_KEY`: (Optional) OpenAI API key for agent functionality

3. **Start MongoDB and application**:

   ```bash
   pnpm docker:up
   ```

4. **Create text search index** (required for catalog search):

   ```bash
   pnpm --filter web db:create-text-index
   ```

5. **Seed database with test data** (optional):

   ```bash
   pnpm --filter web db:seed-initial-user
   pnpm --filter web db:seed-office-items
   ```

6. **Access the application**:
   - Web app: http://localhost:3000
   - MongoDB admin (mongo-express): http://localhost:8081

### Alternative: MongoDB Cloud (MongoDB Atlas)

If you prefer not to use Docker:

1. Create a free MongoDB Atlas account at https://cloud.mongodb.com
2. Create an M0 (free tier) cluster
3. Get the connection string and update `MONGODB_URI` in `.env.local`
4. Run the application without Docker:
   ```bash
   pnpm dev
   ```

---

## Contribution Workflow

### 1. Sync with Upstream

Before starting work, ensure your local repository is up to date:

```bash
git checkout main
git fetch upstream
git merge upstream/main
git push origin main
```

### 2. Create a Feature Branch

Create a new branch for your work:

```bash
git checkout -b feature/your-feature-name
```

Branch naming conventions:

- `feature/description`: New features or enhancements
- `fix/description`: Bug fixes
- `docs/description`: Documentation updates
- `chore/description`: Maintenance tasks (dependencies, refactoring)
- `test/description`: Test additions or modifications

### 3. Make Changes

- Write clean, readable code following the [Coding Standards](#coding-standards)
- Add or update tests to cover your changes
- Update documentation if your changes affect user-facing behavior
- Ensure your changes pass linting and type checks:
  ```bash
  pnpm lint
  pnpm --filter web type-check
  ```

### 4. Commit Your Changes

Follow the [Commit Message Guidelines](#commit-message-guidelines) for all commits:

```bash
git add .
git commit -m "feat: add new catalog filter by category"
```

### 5. Push to Your Fork

```bash
git push origin feature/your-feature-name
```

### 6. Open a Pull Request

1. Navigate to the original repository on GitHub
2. Click "New Pull Request"
3. Select your fork and branch
4. Fill out the pull request template with:
   - Description of changes
   - Related issue(s) if applicable
   - Screenshots or examples if relevant
   - Testing performed
   - Checklist items completed

---

## Branch Strategy

### Main Branches

- **`main`**: Stable branch reflecting the latest release. All commits should be production-ready.
- **`develop`** (future): Development branch for integrating features before release (not currently used in this project)

### Working Branches

- **Feature branches**: `feature/description` - Created from `main`, merged back via PR
- **Bugfix branches**: `fix/description` - Created from `main`, merged back via PR
- **Hotfix branches**: `hotfix/description` - Created from `main` for urgent production fixes

### Merging Strategy

- All changes to `main` must go through pull requests (no direct commits)
- Pull requests require at least one approval from a maintainer
- Squash and merge is preferred to keep commit history clean
- Delete feature branches after merge to keep repository tidy

---

## Commit Message Guidelines

This project follows [Conventional Commits](https://www.conventionalcommits.org/) specification. Commit messages are enforced via Commitlint.

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type

Must be one of the following:

- **feat**: A new feature
- **fix**: A bug fix
- **docs**: Documentation only changes
- **style**: Changes that do not affect the meaning of the code (white-space, formatting, etc.)
- **refactor**: A code change that neither fixes a bug nor adds a feature
- **perf**: A code change that improves performance
- **test**: Adding missing tests or correcting existing tests
- **build**: Changes that affect the build system or external dependencies
- **ci**: Changes to CI configuration files and scripts
- **chore**: Other changes that don't modify src or test files
- **revert**: Reverts a previous commit

### Scope (Optional)

Scope specifies the area of the codebase affected:

- `catalog`: Catalog feature (search, registration)
- `cart`: Shopping cart feature
- `checkout`: Checkout and purchase request feature
- `agent`: AI agent and conversational interface
- `auth`: Authentication and authorization
- `settings`: User settings and preferences
- `infra`: Infrastructure and deployment
- `docs`: Documentation
- `api`: API endpoints
- `db`: Database schemas and migrations

### Subject

- Use imperative, present tense: "add" not "added" nor "adds"
- Don't capitalize the first letter
- No period (.) at the end
- Keep it concise (50 characters or less)

### Body (Optional)

- Wrap at 72 characters
- Explain what and why vs. how
- Use bullet points if needed

### Footer (Optional)

- Reference issues: `Fixes #123` or `Closes #456`
- Note breaking changes: `BREAKING CHANGE: description`

### Examples

#### Simple feature:

```
feat(catalog): add category filter to search endpoint

Allow users to filter catalog search results by category.
This improves search precision for large catalogs.
```

#### Bug fix:

```
fix(cart): prevent duplicate items with same ID

Previously, adding the same item twice created duplicate entries.
Now, the quantity is incremented instead.

Fixes #42
```

#### Breaking change:

```
feat(auth): migrate to OAuth-only authentication

BREAKING CHANGE: Credentials provider has been removed.
Users must authenticate via Google OAuth.

Migration guide: docs/migration/v2.0.0.md
```

#### Documentation:

```
docs: update setup guide with MongoDB Atlas instructions

Add step-by-step guide for using cloud database instead of Docker.
```

---

## Coding Standards

### TypeScript

- **Strict mode**: Always use `"strict": true` in `tsconfig.json`
- **Type safety**: Avoid `any` types; use `unknown` or specific types
- **Explicit return types**: Define return types for all functions
- **No unused variables**: Remove or prefix with `_` if required by interface

### Code Style

- **Formatting**: Use Prettier with project configuration (enforced via pre-commit hooks)
  - Single quotes for strings
  - No semicolons (where optional)
  - 2 spaces indentation
  - 80 character line length (flexible, not strict)
- **Linting**: ESLint rules are enforced; run `pnpm lint:fix` to auto-fix issues
- **Naming conventions**:
  - `camelCase` for variables, functions, and methods
  - `PascalCase` for types, interfaces, classes, and React components
  - `UPPER_SNAKE_CASE` for constants and environment variables

### Architecture Patterns

#### Feature-Based Organization

All business logic lives in `packages/web/src/features/` with self-contained modules:

```
features/
  <feature-name>/
    components/        # React UI components
    lib/              # Service layer (*.service.ts)
    index.ts          # Public API exports
    types.ts          # Feature-specific types
    mock.ts           # Test fixtures (optional)
```

**Always export services and components through `index.ts` barrel files.**

#### Service Layer Pattern

Business logic must be in `*.service.ts` files, never in route handlers:

```typescript
// ✅ GOOD: Service function in features/catalog/lib/catalog.service.ts
export async function searchItems(query: string): Promise<Item[]> {
  await connectDB();
  const items = await ItemModel.find({ $text: { $search: query } }).limit(50);
  return items.map(toItemEntity);
}

// ❌ BAD: Business logic in API route
export async function GET(request: NextRequest) {
  const items = await ItemModel.find(...); // Don't query DB directly in routes
  return NextResponse.json(items);
}
```

Route handlers should be thin wrappers:

1. Extract/validate request data
2. Get authenticated user from session
3. Call service function
4. Return formatted response

#### Domain-Driven Design

- Define domain entities in `domain/entities.ts` (framework-agnostic)
- Services return domain entities, not Mongoose documents
- Keep database concerns isolated in `lib/db/` directory

### Error Handling

- Use typed error classes: `ValidationError`, `DuplicateItemError`, etc.
- Provide descriptive error messages for debugging
- Map service errors to HTTP status codes in route handlers:
  - `ValidationError` → 400 Bad Request
  - `ItemNotFoundError` → 404 Not Found
  - `DuplicateItemError` → 409 Conflict
  - Generic `Error` → 500 Internal Server Error

---

## Testing Requirements

### Test Coverage Expectations

- **New features**: Must include tests for core functionality
- **Bug fixes**: Must include a test that reproduces the bug and validates the fix
- **Refactoring**: Maintain or improve existing test coverage

### Running Tests

```bash
# Run all tests
pnpm --filter web test

# Run tests in watch mode
pnpm --filter web test

# Run tests with coverage report
pnpm --filter web test:coverage

# Run tests with UI
pnpm --filter web test:ui
```

### Test Structure

Use Vitest with Testing Library for React components:

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MyComponent } from './MyComponent';

describe('MyComponent', () => {
  it('renders the component with correct text', () => {
    render(<MyComponent text="Hello World" />);
    expect(screen.getByText('Hello World')).toBeInTheDocument();
  });

  it('handles click events', async () => {
    const handleClick = vi.fn();
    render(<MyComponent onClick={handleClick} />);
    await userEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledOnce();
  });
});
```

For service layer tests:

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { searchItems } from './catalog.service';

describe('Catalog Service', () => {
  let mongoServer: MongoMemoryServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    process.env.MONGODB_URI = mongoServer.getUri();
  });

  afterAll(async () => {
    await mongoServer.stop();
  });

  it('searches items by keyword', async () => {
    const results = await searchItems('laptop');
    expect(results).toHaveLength(3);
    expect(results[0].name).toContain('Laptop');
  });
});
```

---

## Pull Request Process

### Before Submitting

Ensure your PR meets these requirements:

- [ ] Code follows the [Coding Standards](#coding-standards)
- [ ] All tests pass: `pnpm --filter web test:run`
- [ ] Linting passes: `pnpm lint`
- [ ] Type checking passes: `pnpm --filter web type-check`
- [ ] Build succeeds: `pnpm build`
- [ ] Commit messages follow [Conventional Commits](#commit-message-guidelines)
- [ ] Documentation updated (if applicable)
- [ ] CHANGELOG.md updated (for significant changes)

### PR Template

When opening a pull request, fill out the template with:

1. **Description**: What does this PR do? Why is it needed?
2. **Related Issues**: Link to GitHub issues (e.g., `Fixes #123`)
3. **Type of Change**: Feature, bug fix, documentation, etc.
4. **Testing**: How was this tested? Include test cases or manual testing steps.
5. **Screenshots**: Include for UI changes
6. **Checklist**: Confirm all items above are completed

### Review Process

1. **Automated Checks**: GitHub Actions runs linting, tests, and build
2. **Code Review**: At least one maintainer must approve
3. **Changes Requested**: Address feedback and push updates
4. **Approval**: Once approved, the PR will be merged by a maintainer

### After Merge

- Your branch will be automatically deleted (if using GitHub's squash and merge)
- Pull the latest `main` to your local repository:
  ```bash
  git checkout main
  git pull upstream main
  ```

---

## Release Process

### Version Bumping

This project uses [Semantic Versioning](https://semver.org/):

- **MAJOR**: Breaking changes (incompatible API changes)
- **MINOR**: New features (backwards-compatible)
- **PATCH**: Bug fixes (backwards-compatible)

### How Releases Are Created

1. **Prepare Release Branch** (maintainers only):

   ```bash
   git checkout -b release/v1.1.0
   ```

2. **Update CHANGELOG.md**:
   - Move items from `[Unreleased]` section to new version section `[1.1.0] - YYYY-MM-DD`
   - Add "Summary of This Release" section
   - Add "Upgrade Notes" if there are breaking changes
   - Update links at bottom of file

3. **Bump Version Numbers**:
   - Update `version` field in `package.json` (root)
   - Update `version` field in `packages/web/package.json`
   - Run `pnpm install` to update `pnpm-lock.yaml`

4. **Commit Version Bump**:

   ```bash
   git add .
   git commit -m "chore(release): bump version to 1.1.0"
   ```

5. **Create Pull Request**:
   - Open PR from `release/v1.1.0` to `main`
   - Title: "Release v1.1.0"
   - Description: Copy summary from CHANGELOG.md

6. **Merge and Tag** (after approval):

   ```bash
   git checkout main
   git pull origin main
   git tag -a v1.1.0 -m "Release v1.1.0"
   git push origin main --tags
   ```

7. **Create GitHub Release**:
   - Navigate to Releases on GitHub
   - Click "Draft a new release"
   - Select tag `v1.1.0`
   - Title: "ProcureFlow v1.1.0"
   - Description: Copy from CHANGELOG.md
   - Publish release

### Release Cadence

- **Major releases**: As needed (typically 6-12 months)
- **Minor releases**: Monthly or bi-monthly
- **Patch releases**: As needed for critical bug fixes (within 1-2 weeks of issue discovery)

---

## Proposing Breaking Changes

Breaking changes require extra care and communication. If you're proposing a breaking change:

### 1. Open a Discussion First

Before creating a PR, open a GitHub Discussion:

- Explain the problem with the current approach
- Propose the breaking change with examples
- Outline the migration path for users
- Estimate the impact (how many users/integrations affected)

### 2. Document the Migration

Create a migration guide:

- Document old behavior vs. new behavior
- Provide code examples showing how to migrate
- List all affected APIs, functions, or endpoints
- Include a testing checklist for users

### 3. Update CHANGELOG.md

Mark breaking changes clearly:

```markdown
### Changed

- **BREAKING**: Auth API now requires OAuth; credentials provider removed. See [migration guide](docs/migration/v2.0.0.md).
```

### 4. Increment Major Version

Breaking changes trigger a major version bump (e.g., v1.5.0 → v2.0.0).

---

## Getting Help

### Resources

- **Documentation**: [Architecture Guide](/.github/copilot-instructions.md), [PRD](/.guided/product/PRD.md)
- **API Reference**: [OpenAPI Spec](/api/openapi) (runtime endpoint)
- **Infrastructure**: [Setup Guide](/packages/infra/pulumi/gcp/docs/SETUP.md)

### Communication Channels

- **GitHub Issues**: For bug reports and feature requests
- **GitHub Discussions**: For questions, ideas, and general discussion
- **Pull Request Comments**: For code-specific questions during review

### Asking Questions

When asking for help:

1. Search existing issues and discussions first
2. Provide context: what are you trying to accomplish?
3. Include code snippets, error messages, or screenshots
4. Describe what you've tried so far

---

## License

By contributing to ProcureFlow, you agree that your contributions will be licensed under the same license as the project (see LICENSE file).

---

## Thank You!

Your contributions make ProcureFlow better for everyone. We appreciate your time and effort in helping improve this project.

For questions or concerns about contributing, please open a GitHub Discussion or contact the maintainers.

**Happy contributing!**
