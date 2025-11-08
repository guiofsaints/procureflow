# Dependency Upgrade Plan

**Generated:** November 7, 2025  
**Project:** ProcureFlow  
**Scope:** All packages in monorepo (`apps/*`, `infra/*`, root)

---

## Executive Summary

### Upgrade Overview

| Category | Packages | Risk | Est. Time |
|----------|----------|------|-----------|
| Patch Updates | 1 | ✅ Low | 15 min |
| Minor Updates | 6 | ⚠️ Medium | 1-2 hours |
| Major Updates (Tooling) | 3 | 🔴 High | 2-3 hours |
| Major Updates (Framework) | 5 | 🔴 Critical | 4-6 hours |
| Major Updates (AI Stack) | 2 | 🔴 Critical | 3-4 hours |
| Major Updates (Infra) | 1 | ⚠️ Medium | 1-2 hours |
| Cleanup | 1 | ✅ Low | 30 min |

**Total Estimated Time:** 12-18 hours  
**Recommended Duration:** 3-4 work sessions over 2-3 days

---

## Pre-Upgrade Checklist

Before starting any upgrades:

- [ ] **Git Status Clean:** No uncommitted changes
  ```bash
  git status
  ```

- [ ] **Create Backup Branch:**
  ```bash
  git checkout -b backup/pre-upgrade
  git push origin backup/pre-upgrade
  git checkout main
  ```

- [ ] **Create Upgrade Branch:**
  ```bash
  git checkout -b chore/dependency-upgrades
  ```

- [ ] **Baseline Quality Checks Pass:**
  ```bash
  pnpm install
  pnpm lint
  pnpm format
  pnpm type-check
  pnpm test
  pnpm build
  ```

- [ ] **Document Current Versions:**
  ```bash
  pnpm list --depth=0 > .guided/assessment/pre-upgrade-versions.txt
  ```

---

## Phase 1: Patch Updates (✅ Low Risk)

**Duration:** 15 minutes  
**Risk:** Low  
**Can Fail:** Unlikely

### Scope

Update packages with only patch version changes:

| Package | Location | Current | Target | Change |
|---------|----------|---------|--------|--------|
| `@commitlint/config-conventional` | Root | 20.0.0 | 20.1.0 | Patch |

### Commands

```bash
# Update commitlint config
pnpm add -D -w @commitlint/config-conventional@^20.1.0

# Verify installation
pnpm install
```

### Quality Gate

```bash
✅ pnpm install          # Should complete without errors
✅ pnpm lint            # Should pass (commitlint in husky)
✅ pnpm format          # Should pass
✅ pnpm type-check      # Should pass
✅ pnpm test            # Should pass
✅ pnpm build           # Should succeed

# Test git commit hooks
✅ Test: git commit -m "test: verify commitlint works"  # Should validate
```

### Commit

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore(deps): upgrade @commitlint/config-conventional to 20.1.0"
```

### Rollback (if needed)

```bash
git reset --hard HEAD~1
pnpm install
```

---

## Phase 2: Minor Updates - Build Tools (⚠️ Medium Risk)

**Duration:** 1-2 hours  
**Risk:** Medium  
**Focus:** Development tooling and styling

### Scope

Update packages with minor version changes (tooling only):

| Package | Location | Current | Target | Change |
|---------|----------|---------|--------|--------|
| `tailwindcss` | apps/web | 4.0.0 | 4.1.17 | Minor |
| `@pulumi/pulumi` | infra/pulumi/gcp | 3.150.0 | 3.206.0 | Minor |
| `@pulumi/docker` | infra/pulumi/gcp | 4.5.8 | 4.9.0 | Minor |
| `lucide-react` | apps/web | 0.553.0 | 0.563.0 | Minor |

### Commands

```bash
# Update Tailwind CSS in web app
cd apps/web
pnpm add -D tailwindcss@^4.1.17

# Update lucide-react in web app
pnpm add lucide-react@latest

# Update Pulumi packages in infra
cd ../../infra/pulumi/gcp
pnpm add @pulumi/pulumi@^3.206.0 @pulumi/docker@^4.9.0

# Return to root and reinstall
cd ../../..
pnpm install
```

### Quality Gate

```bash
✅ pnpm install          # Should complete without errors
✅ pnpm lint            # Should pass
✅ pnpm format          # Should pass
✅ pnpm type-check      # Should pass (TypeScript should compile)
✅ pnpm test            # Should pass
✅ pnpm build           # Should succeed

# Test Tailwind classes render correctly
✅ Manual: Check that styling looks correct in dev mode

# Test Pulumi
cd infra/pulumi/gcp
✅ pulumi preview       # Should run without errors (may show no changes)
cd ../../..
```

### Expected Issues

- **Tailwind CSS:** Minor version should be backward compatible
- **Pulumi:** May show minor diff in preview (review carefully)
- **Icons:** Lucide icons should render the same

### Commit

```bash
git add apps/web/package.json infra/pulumi/gcp/package.json pnpm-lock.yaml
git commit -m "chore(deps): upgrade build tools and styling dependencies

- tailwindcss: 4.0.0 → 4.1.17
- lucide-react: 0.553.0 → 0.563.0
- @pulumi/pulumi: 3.150.0 → 3.206.0
- @pulumi/docker: 4.5.8 → 4.9.0"
```

### Rollback (if needed)

```bash
git reset --hard HEAD~1
pnpm install
```

---

## Phase 3: Minor Updates - Runtime Dependencies (⚠️ Medium Risk)

**Duration:** 30-60 minutes  
**Risk:** Medium  
**Focus:** Runtime libraries with minor updates

### Scope

| Package | Location | Current | Target | Change |
|---------|----------|---------|--------|--------|
| `next-auth` | apps/web | 4.24.5 | 4.24.12 | Minor |

### Commands

```bash
cd apps/web
pnpm add next-auth@^4.24.12

cd ../..
pnpm install
```

### Quality Gate

```bash
✅ pnpm install          # Should complete without errors
✅ pnpm lint            # Should pass
✅ pnpm format          # Should pass
✅ pnpm type-check      # Should pass
✅ pnpm test            # Should pass
✅ pnpm build           # Should succeed

# Manual Testing - CRITICAL for auth changes
✅ Test login flow with demo@procureflow.com / demo123
✅ Test logout
✅ Test protected routes redirect to login
✅ Test session persistence across page refreshes
```

### Expected Issues

- **NextAuth:** Minor version should be backward compatible
- If auth breaks, rollback immediately

### Commit

```bash
git add apps/web/package.json pnpm-lock.yaml
git commit -m "chore(deps): upgrade next-auth to 4.24.12"
```

### Rollback (if needed)

```bash
git reset --hard HEAD~1
pnpm install
```

---

## Phase 4: ESLint 9 Upgrade (🔴 High Risk)

**Duration:** 2-3 hours  
**Risk:** High  
**Focus:** Linting infrastructure

### Scope

| Package | Location | Current | Target | Change |
|---------|----------|---------|--------|--------|
| `eslint` | apps/web | 8.57.1 | 9.39.1 | Major |
| `@eslint/eslintrc` | apps/web | 2.1.4 | 3.3.1 | Major |

### Pre-Upgrade Verification

```bash
# Verify current ESLint config works
cd apps/web
pnpm lint

# Check that flat config is in use
cat eslint.config.mjs  # Should exist and be properly configured
```

### Commands

```bash
cd apps/web

# Upgrade ESLint packages together
pnpm add -D eslint@^9.39.1 @eslint/eslintrc@^3.3.1

cd ../..
pnpm install
```

### Configuration Changes Required

**File:** `apps/web/eslint.config.mjs`

Review the file and ensure:
1. ✅ `FlatCompat` is still imported correctly
2. ✅ All plugins are ESLint 9 compatible
3. ✅ Rules are still valid

Expected structure:
```javascript
import { FlatCompat } from '@eslint/eslintrc';
// ... rest of config
```

### Quality Gate

```bash
✅ pnpm install          # Should complete without errors
✅ pnpm lint            # CRITICAL - Must pass
✅ pnpm lint:fix        # Should auto-fix any new violations
✅ pnpm format          # Should pass
✅ pnpm type-check      # Should pass
✅ pnpm test            # Should pass
✅ pnpm build           # Should succeed
```

### Expected Issues

1. **New Lint Errors:**
   - Run `pnpm lint:fix` to auto-fix
   - Manually fix any remaining issues
   - May need to adjust rules in `eslint.config.mjs`

2. **Plugin Incompatibilities:**
   - Verify `eslint-config-next` is compatible
   - May need to wait for Next.js 16 upgrade first

3. **Rule Changes:**
   - Some rules may have different defaults
   - Review and adjust as needed

### Verification Commands

```bash
# Test ESLint on specific files
cd apps/web
pnpm eslint src/lib/utils/index.ts --debug

# Test on entire codebase
pnpm lint

# Check for deprecated rules
pnpm eslint . --print-config src/lib/utils/index.ts | grep deprecated
```

### Commit

```bash
git add apps/web/package.json apps/web/eslint.config.mjs pnpm-lock.yaml
git commit -m "chore(deps): upgrade ESLint to v9 with flat config

- eslint: 8.57.1 → 9.39.1
- @eslint/eslintrc: 2.1.4 → 3.3.1

All lint rules passing with updated configuration."
```

### Rollback (if needed)

```bash
git reset --hard HEAD~1
pnpm install
```

---

## Phase 5: React 19 + Next.js 16 Upgrade (🔴 CRITICAL)

**Duration:** 4-6 hours  
**Risk:** CRITICAL  
**Focus:** Core framework upgrade

### ⚠️ CRITICAL NOTES

- **Must upgrade React and Next.js together** (Next.js 16 requires React 19)
- **Most impactful change** in entire upgrade plan
- **Extensive testing required**
- **Have rollback plan ready**

### Scope

| Package | Location | Current | Target | Change |
|---------|----------|---------|--------|--------|
| `react` | apps/web | 18.3.1 | 19.2.0 | Major |
| `react-dom` | apps/web | 18.3.1 | 19.2.0 | Major |
| `next` | apps/web | 15.5.6 | 16.0.1 | Major |
| `eslint-config-next` | apps/web | 15.5.6 | 16.0.1 | Minor |
| `@types/react` | apps/web | 18.3.26 | 19.2.2 | Major |
| `@types/react-dom` | apps/web | 18.3.7 | 19.2.2 | Major |

### Pre-Upgrade Preparation

1. **Read Migration Guides:**
   - React 19: https://react.dev/blog/2025/01/29/react-19
   - Next.js 16: https://nextjs.org/docs/app/building-your-application/upgrading/version-16

2. **Backup Current State:**
   ```bash
   git tag pre-react19-upgrade
   git push origin pre-react19-upgrade
   ```

3. **Run Baseline Tests:**
   ```bash
   pnpm test
   pnpm build
   ```

### Commands

```bash
cd apps/web

# Upgrade React ecosystem together
pnpm add react@^19.2.0 react-dom@^19.2.0 next@^16.0.1

# Upgrade type definitions
pnpm add -D @types/react@^19.2.2 @types/react-dom@^19.2.2

# Upgrade Next.js ESLint config to match
pnpm add -D eslint-config-next@^16.0.1

cd ../..
pnpm install
```

### Configuration Updates Required

#### 1. Check `next.config.mjs`

Review for Next.js 16 specific changes:

```javascript
// next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Review any experimental features
  // experimental: { ... }
  
  // Check image optimization settings
  // images: { ... }
  
  // Verify any custom webpack config
};

export default nextConfig;
```

#### 2. Review App Router Usage

Verify all routes follow Next.js 16 patterns:
- `app/(public)/*` - Public routes
- `app/(app)/*` - Authenticated routes
- `app/api/*` - API routes

#### 3. Check Server Components

Ensure proper `'use client'` directives where needed.

### Quality Gate - Phase 1: Build & Type Check

```bash
✅ pnpm install          # Should complete without errors
✅ pnpm type-check      # TypeScript MUST compile
```

**If type check fails:**
- Review type errors carefully
- May need to update component props
- Fix all type errors before proceeding

### Quality Gate - Phase 2: Linting & Formatting

```bash
✅ pnpm lint            # Should pass (may have new warnings)
✅ pnpm lint:fix        # Auto-fix any new issues
✅ pnpm format          # Should pass
```

### Quality Gate - Phase 3: Tests

```bash
✅ pnpm test            # All tests MUST pass
```

**If tests fail:**
- Review test failures
- Update tests for React 19 changes
- Fix all failing tests

### Quality Gate - Phase 4: Build

```bash
✅ pnpm build           # Production build MUST succeed
```

**If build fails:**
- Review build errors
- Check for Next.js 16 specific issues
- Fix all build errors

### Manual Testing Checklist

#### Authentication Flow
- [ ] Navigate to `/` (landing page)
- [ ] Click "Sign In" or navigate to login
- [ ] Sign in with `demo@procureflow.com` / `demo123`
- [ ] Verify redirect to authenticated area
- [ ] Sign out
- [ ] Verify redirect to public area

#### Catalog & Shopping
- [ ] Browse catalog at `/catalog`
- [ ] Search for items
- [ ] Click item to view details
- [ ] Add item to cart
- [ ] View cart at `/cart`
- [ ] Update quantities
- [ ] Remove items
- [ ] Clear cart

#### Checkout Flow
- [ ] Add items to cart
- [ ] Navigate to checkout
- [ ] Fill out checkout form
- [ ] Submit purchase request
- [ ] Verify success message

#### AI Agent
- [ ] Navigate to `/agent`
- [ ] Send a chat message
- [ ] Verify response
- [ ] Test conversation continuity

#### Theme & Layout
- [ ] Toggle light/dark theme
- [ ] Verify theme persists on refresh
- [ ] Check navigation
- [ ] Verify responsive layout (mobile, tablet, desktop)

#### API Routes
- [ ] Test `/api/health` - Should return 200 OK
- [ ] Test `/api/items` - Should return items list
- [ ] Test protected routes require auth

### Console Checks

```bash
# Run dev server and check console
pnpm dev

# Look for:
✅ No error messages
✅ No React hydration warnings
✅ No deprecation warnings
⚠️ Note any warnings (may be acceptable)
```

### Expected Issues & Solutions

#### Issue 1: Type Errors with React 19
**Solution:** Update component props to use new React 19 types

#### Issue 2: Hydration Mismatches
**Solution:** Ensure Server/Client component split is correct

#### Issue 3: Suspense Boundary Errors
**Solution:** Update Suspense usage to React 19 patterns

#### Issue 4: Next.js Caching Differences
**Solution:** Review and update `revalidate` options if needed

### Commit

```bash
git add apps/web/package.json apps/web/next.config.mjs pnpm-lock.yaml
git commit -m "chore(deps): upgrade to React 19 and Next.js 16

BREAKING CHANGES:
- react: 18.3.1 → 19.2.0
- react-dom: 18.3.1 → 19.2.0
- next: 15.5.6 → 16.0.1
- @types/react: 18.3.26 → 19.2.2
- @types/react-dom: 18.3.7 → 19.2.2
- eslint-config-next: 15.5.6 → 16.0.1

All tests passing. Manual testing verified.
See upgrade notes in .guided/assessment/ for details."
```

### Rollback (if critical issues)

```bash
# Rollback to pre-upgrade tag
git reset --hard pre-react19-upgrade
pnpm install

# Or just rollback last commit
git reset --hard HEAD~1
pnpm install
```

---

## Phase 6: LangChain 1.0 + OpenAI v6 Upgrade (🔴 CRITICAL)

**Duration:** 3-4 hours  
**Risk:** CRITICAL  
**Focus:** AI stack upgrade

### ⚠️ CRITICAL NOTES

- **Core AI functionality** will be affected
- **Major refactor** of AI integration code required
- **Coordinate LangChain and OpenAI upgrades**
- **Extensive testing** of AI features required

### Scope

| Package | Location | Current | Target | Change |
|---------|----------|---------|--------|--------|
| `langchain` | apps/web | 0.0.208 | 1.0.3 | Major |
| `openai` | apps/web | 4.104.0 | 6.8.1 | Major |

### Pre-Upgrade Preparation

1. **Read Migration Guides:**
   - LangChain: https://js.langchain.com/docs/guides/migrating_to_1_0
   - OpenAI: https://github.com/openai/openai-node/releases/tag/v6.0.0

2. **Backup Current State:**
   ```bash
   git tag pre-langchain1-upgrade
   git push origin pre-langchain1-upgrade
   ```

3. **Identify All AI Code:**
   - `apps/web/src/lib/ai/langchainClient.ts`
   - `apps/web/src/features/agent/lib/agent.service.ts`
   - Any API routes using AI (`app/api/agent/`)

### Commands - Step 1: Install New Packages

```bash
cd apps/web

# Install LangChain 1.0 core packages
pnpm add @langchain/core @langchain/openai langchain@latest

# Upgrade OpenAI SDK
pnpm add openai@^6.8.1

cd ../..
pnpm install
```

### Code Refactor Required

#### File 1: `apps/web/src/lib/ai/langchainClient.ts`

**Before (0.0.x):**
```typescript
import { ChatOpenAI } from 'langchain/chat_models/openai';
import { HumanMessage, SystemMessage } from 'langchain/schema';

export async function chatCompletion(prompt: string) {
  const chat = new ChatOpenAI({
    modelName: 'gpt-4o-mini',
    temperature: 0.7,
  });
  
  const messages = [
    new SystemMessage('You are a helpful assistant'),
    new HumanMessage(prompt),
  ];
  
  const response = await chat.call(messages);
  return response.content;
}
```

**After (1.0.x):**
```typescript
import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';

export async function chatCompletion(prompt: string) {
  const chat = new ChatOpenAI({
    model: 'gpt-4o-mini',  // Changed from modelName
    temperature: 0.7,
  });
  
  const messages = [
    new SystemMessage('You are a helpful assistant'),
    new HumanMessage(prompt),
  ];
  
  const response = await chat.invoke(messages);  // Changed from call()
  return response.content;
}
```

**Key Changes:**
1. Import from `@langchain/openai` instead of `langchain/chat_models/openai`
2. Import messages from `@langchain/core/messages`
3. Use `model` instead of `modelName`
4. Use `invoke()` instead of `call()`

### Refactor Steps

```bash
# Step 1: Update imports in langchainClient.ts
# (Make changes as shown above)

# Step 2: Update any other files using LangChain
# Search for LangChain usage
grep -r "from 'langchain" apps/web/src

# Step 3: Update imports in all found files
```

### Quality Gate - Phase 1: Type Check

```bash
✅ pnpm type-check      # TypeScript MUST compile
```

**If type check fails:**
- Review import errors
- Update all LangChain imports
- Fix type mismatches

### Quality Gate - Phase 2: Build & Lint

```bash
✅ pnpm lint            # Should pass
✅ pnpm build           # Should succeed
```

### Quality Gate - Phase 3: Tests

```bash
✅ pnpm test            # All tests MUST pass
```

### Manual Testing - AI Features

#### AI Agent Chat
1. [ ] Navigate to `/agent`
2. [ ] Send message: "Hello"
3. [ ] Verify AI responds
4. [ ] Send message: "Analyze this procurement request: Need 5 laptops"
5. [ ] Verify AI analyzes the request
6. [ ] Send follow-up message
7. [ ] Verify conversation context maintained

#### Request Analysis
1. [ ] Test procurement request analysis
2. [ ] Verify structured responses work
3. [ ] Check error handling

#### Streaming (if used)
1. [ ] Verify streaming responses work
2. [ ] Check for partial response display

### Expected Issues & Solutions

#### Issue 1: Import Errors
**Symptom:** Cannot find module 'langchain/...'  
**Solution:** Update all imports to new package structure

#### Issue 2: Method Not Found
**Symptom:** `chat.call is not a function`  
**Solution:** Replace `.call()` with `.invoke()`

#### Issue 3: Type Errors
**Symptom:** Type mismatches with messages  
**Solution:** Import message types from `@langchain/core/messages`

#### Issue 4: OpenAI Response Structure
**Symptom:** Different response format  
**Solution:** Update response handling for OpenAI v6

### Verification Script

Create test file to verify AI works:

```bash
# Create test file
cat > apps/web/test-ai.ts << 'EOF'
import { chatCompletion } from './src/lib/ai/langchainClient';

async function test() {
  console.log('Testing LangChain integration...');
  const response = await chatCompletion('Say hello!');
  console.log('Response:', response);
  console.log('✅ AI integration working!');
}

test().catch(console.error);
EOF

# Run test (requires OPENAI_API_KEY in .env)
cd apps/web
tsx test-ai.ts
cd ../..
```

### Commit

```bash
git add apps/web/package.json apps/web/src/lib/ai/ apps/web/src/features/agent/ pnpm-lock.yaml
git commit -m "chore(deps): upgrade LangChain to 1.0 and OpenAI SDK to v6

BREAKING CHANGES:
- langchain: 0.0.208 → 1.0.3
- openai: 4.104.0 → 6.8.1
- Refactored imports to use @langchain/core and @langchain/openai
- Updated API calls from .call() to .invoke()
- All AI features tested and working

Migration changes:
- Updated langchainClient.ts with new import structure
- Updated agent service for LangChain 1.0 API
- Verified streaming and conversation context work"
```

### Rollback (if critical issues)

```bash
# Rollback to pre-upgrade tag
git reset --hard pre-langchain1-upgrade
pnpm install

# Or just rollback last commit
git reset --hard HEAD~1
pnpm install
```

---

## Phase 7: Pulumi GCP Provider v9 Upgrade (⚠️ Medium Risk)

**Duration:** 1-2 hours  
**Risk:** Medium  
**Focus:** Infrastructure upgrade

### Scope

| Package | Location | Current | Target | Change |
|---------|----------|---------|--------|--------|
| `@pulumi/gcp` | infra/pulumi/gcp | 8.11.1 | 9.4.0 | Major |

### Pre-Upgrade Preparation

1. **Read Migration Guide:**
   - https://www.pulumi.com/registry/packages/gcp/

2. **Backup Current State:**
   ```bash
   git tag pre-pulumi-gcp9-upgrade
   git push origin pre-pulumi-gcp9-upgrade
   ```

3. **Export Current State:**
   ```bash
   cd infra/pulumi/gcp
   pulumi stack export > stack-backup.json
   cd ../../..
   ```

### Commands

```bash
cd infra/pulumi/gcp

# Upgrade GCP provider
pnpm add @pulumi/gcp@^9.4.0

cd ../../..
pnpm install
```

### Quality Gate - Phase 1: Preview

```bash
cd infra/pulumi/gcp

✅ pulumi preview       # CRITICAL - Review ALL changes

# Look for:
# - Resource replacements (⚠️ be very careful)
# - Property updates (usually safe)
# - No unexpected deletions
```

**What to check in preview:**
- ✅ If preview shows "no changes" or minor updates: GOOD
- ⚠️ If preview shows resource replacements: REVIEW CAREFULLY
- 🔴 If preview shows resource deletions: STOP and investigate

### Expected Preview Output

**Good (safe to proceed):**
```
Previewing update (dev)

View Live: https://app.pulumi.com/...

     Type                 Name        Plan       
     pulumi:pulumi:Stack  gcp-dev                

Resources:
    ~ 2 to update
    3 unchanged
```

**Concerning (investigate before proceeding):**
```
Previewing update (dev)

     Type                 Name        Plan       Info
     pulumi:pulumi:Stack  gcp-dev                
 +-  some-resource        resource    replace    [diff: ~someProperty]
```

### Quality Gate - Phase 2: TypeScript Build

```bash
# Build infrastructure code
pnpm build

✅ TypeScript should compile without errors
```

### If Preview Shows Changes

**DO NOT automatically apply!**

1. Review each change in detail
2. Understand why the change is happening
3. Verify it's expected for GCP provider v9
4. Document any infrastructure changes required

### Commit (Infrastructure Code Only)

```bash
# Commit package.json changes
git add infra/pulumi/gcp/package.json pnpm-lock.yaml
git commit -m "chore(deps): upgrade @pulumi/gcp to 9.4.0

Pulumi preview reviewed - no infrastructure changes required.
All resources remain unchanged."

# Do NOT commit infrastructure changes without testing
```

### Rollback (if needed)

```bash
git reset --hard pre-pulumi-gcp9-upgrade
pnpm install
cd infra/pulumi/gcp
pulumi stack import < stack-backup.json
cd ../../..
```

---

## Phase 8: Type Definitions Update (⚠️ Medium Risk)

**Duration:** 30 minutes  
**Risk:** Medium (coordinated with React 19)

### Scope

| Package | Location | Current | Target | Change |
|---------|----------|---------|--------|--------|
| `@types/node` | apps/web | 20.19.24 | 24.10.0 | Major |
| `@types/node` | infra/pulumi/gcp | 20.10.0 | 24.10.0 | Major |

### ⚠️ NOTE

`@types/react` and `@types/react-dom` were already upgraded in Phase 5 (React 19 upgrade).

### Commands

```bash
# Update @types/node in web app
cd apps/web
pnpm add -D @types/node@^24.10.0

# Update @types/node in infra
cd ../../infra/pulumi/gcp
pnpm add -D @types/node@^24.10.0

# Reinstall
cd ../../..
pnpm install
```

### Quality Gate

```bash
✅ pnpm install          # Should complete without errors
✅ pnpm type-check      # TypeScript MUST compile
✅ pnpm lint            # Should pass
✅ pnpm test            # Should pass
✅ pnpm build           # Should succeed
```

### Expected Issues

**Node.js Runtime vs Types:**
- Using Node.js 18 runtime with Node.js 24 types
- Should work fine (types are forward-compatible)
- Gives access to newer Node.js type definitions
- May show some APIs not available in Node 18 (rare)

### Commit

```bash
git add apps/web/package.json infra/pulumi/gcp/package.json pnpm-lock.yaml
git commit -m "chore(deps): upgrade @types/node to 24.10.0

Updated Node.js type definitions across all packages.
Compatible with Node.js 18+ runtime."
```

### Rollback (if needed)

```bash
git reset --hard HEAD~1
pnpm install
```

---

## Phase 9: Cleanup - Remove Unused Dependencies (✅ Low Risk)

**Duration:** 30 minutes  
**Risk:** Low

### Scope

Remove confirmed unused dependencies:

| Package | Location | Status |
|---------|----------|--------|
| `@pulumi/docker` | infra/pulumi/gcp | 🔴 Unused |

### Pre-Cleanup Verification

```bash
# Double-check usage one more time
grep -r "@pulumi/docker" infra/pulumi/gcp/

# Should return only package.json reference
```

### Commands

```bash
cd infra/pulumi/gcp

# Remove unused package
pnpm remove @pulumi/docker

cd ../../..
pnpm install
```

### Quality Gate

```bash
✅ pnpm install          # Should complete without errors
✅ pnpm type-check      # Should pass
✅ pnpm lint            # Should pass
✅ pnpm test            # Should pass
✅ pnpm build           # Should succeed

# Infrastructure specific
cd infra/pulumi/gcp
✅ pnpm build           # Should compile
✅ pulumi preview       # Should not show changes
cd ../../..
```

### Commit

```bash
git add infra/pulumi/gcp/package.json pnpm-lock.yaml
git commit -m "chore(deps): remove unused @pulumi/docker dependency

Package was not used in infrastructure code.
Verified no impact on Pulumi stack."
```

### Rollback (if needed)

```bash
git reset --hard HEAD~1
pnpm install
```

---

## Phase 10: Final Verification & Documentation (✅ Low Risk)

**Duration:** 1 hour  
**Risk:** Low

### Complete Quality Gate Suite

Run full test suite one final time:

```bash
# Install and verify lock file
✅ pnpm install

# Linting
✅ pnpm lint
✅ pnpm lint:prettier

# Formatting
✅ pnpm format --check

# Type checking
✅ pnpm type-check

# Tests
✅ pnpm test
✅ pnpm test:api

# Production build
✅ pnpm build

# Start production server (verify it runs)
✅ pnpm start &
# Test that it responds
✅ curl http://localhost:3000/api/health
# Stop server
```

### Manual Testing - Full Flow

Complete end-to-end testing:

1. **Authentication:**
   - [ ] Login
   - [ ] Logout
   - [ ] Protected routes

2. **Catalog:**
   - [ ] Browse items
   - [ ] Search
   - [ ] View details

3. **Cart:**
   - [ ] Add items
   - [ ] Update quantities
   - [ ] Remove items

4. **Checkout:**
   - [ ] Submit request
   - [ ] Verify submission

5. **AI Agent:**
   - [ ] Chat functionality
   - [ ] Request analysis

6. **Theme:**
   - [ ] Toggle light/dark
   - [ ] Persistence

### Document Upgraded Versions

```bash
# Generate final version list
pnpm list --depth=0 > .guided/assessment/post-upgrade-versions.txt

# Compare before/after
diff .guided/assessment/pre-upgrade-versions.txt .guided/assessment/post-upgrade-versions.txt
```

### Update Documentation

Update relevant documentation files:

#### 1. README.md

Update version requirements if needed:

```markdown
## Requirements

- Node.js 18.17.0 or higher
- pnpm 8.0.0 or higher
- MongoDB 8.x

## Tech Stack

- **Next.js 16** with App Router
- **React 19**
- **TypeScript 5.9**
- **Tailwind CSS 4**
- **LangChain 1.0**
```

#### 2. package.json (Root)

Update engines if needed:

```json
{
  "engines": {
    "node": ">=18.17.0",
    "pnpm": ">=8.0.0"
  }
}
```

### Create Upgrade Summary Document

```bash
cat > .guided/assessment/upgrade-summary.md << 'EOF'
# Dependency Upgrade Summary

**Date:** November 7, 2025  
**Duration:** [Actual time taken]  
**Result:** ✅ Success

## Upgraded Packages

### Patch Updates
- @commitlint/config-conventional: 20.0.0 → 20.1.0

### Minor Updates
- tailwindcss: 4.0.0 → 4.1.17
- lucide-react: 0.553.0 → 0.563.0
- next-auth: 4.24.5 → 4.24.12
- @pulumi/pulumi: 3.150.0 → 3.206.0
- @pulumi/docker: 4.5.8 → 4.9.0

### Major Updates
- react: 18.3.1 → 19.2.0
- react-dom: 18.3.1 → 19.2.0
- next: 15.5.6 → 16.0.1
- eslint: 8.57.1 → 9.39.1
- @eslint/eslintrc: 2.1.4 → 3.3.1
- langchain: 0.0.208 → 1.0.3
- openai: 4.104.0 → 6.8.1
- @pulumi/gcp: 8.11.1 → 9.4.0
- @types/node: 20.x → 24.10.0
- @types/react: 18.3.26 → 19.2.2
- @types/react-dom: 18.3.7 → 19.2.2
- eslint-config-next: 15.5.6 → 16.0.1

### Removed
- @pulumi/docker (unused)

## Issues Encountered

[Document any issues and how they were resolved]

## Testing Results

- ✅ All quality gates passed
- ✅ Manual testing complete
- ✅ No regressions detected

## Performance Impact

[Note any performance changes observed]

## Next Steps

- Monitor production for any issues
- Update dependency audit in 3 months

EOF
```

### Final Commit

```bash
git add .
git commit -m "docs: update documentation for dependency upgrades

- Updated version requirements in README
- Added upgrade summary
- Documented final package versions"
```

---

## Post-Upgrade: Merge to Main

### Pre-Merge Checklist

- [ ] All phases completed successfully
- [ ] All quality gates passed
- [ ] Full manual testing done
- [ ] Documentation updated
- [ ] No known issues

### Merge Commands

```bash
# Ensure you're on the upgrade branch
git checkout chore/dependency-upgrades

# Final rebase with main (if main has changed)
git fetch origin
git rebase origin/main

# Resolve any conflicts if needed
# Run quality gates again after rebase
pnpm install
pnpm lint
pnpm type-check
pnpm test
pnpm build

# Merge to main
git checkout main
git merge chore/dependency-upgrades

# Push to remote
git push origin main

# Tag the upgrade
git tag deps-upgrade-2025-11-07
git push origin deps-upgrade-2025-11-07

# Clean up branch (optional)
git branch -d chore/dependency-upgrades
git push origin --delete chore/dependency-upgrades
```

---

## Rollback Procedures

### If Issues Found After Merge

#### Option 1: Revert Merge Commit

```bash
# Find merge commit hash
git log --oneline -10

# Revert the merge
git revert -m 1 <merge-commit-hash>

# Push revert
git push origin main
```

#### Option 2: Hard Reset to Backup Tag

```bash
# Reset to pre-upgrade state
git reset --hard pre-react19-upgrade

# Force push (⚠️ DANGEROUS - only if necessary)
git push origin main --force
```

#### Option 3: Selective Rollback

Roll back only problematic phase:

```bash
# Find commit hash of problematic phase
git log --oneline --all

# Revert that specific commit
git revert <commit-hash>

# Push
git push origin main
```

---

## Sign-Off Checklist

Before considering upgrade complete:

### Technical Verification
- [ ] All package.json files updated
- [ ] pnpm-lock.yaml updated
- [ ] All quality gates pass
- [ ] Production build succeeds
- [ ] Application runs without errors

### Functional Verification
- [ ] Authentication works
- [ ] Catalog browsing works
- [ ] Cart functionality works
- [ ] Checkout works
- [ ] AI agent works
- [ ] Theme switching works
- [ ] All API routes respond correctly

### Code Quality
- [ ] No linting errors
- [ ] Code properly formatted
- [ ] TypeScript compiles without errors
- [ ] All tests pass
- [ ] No console errors in browser
- [ ] No console warnings (or documented)

### Documentation
- [ ] README updated
- [ ] Upgrade summary created
- [ ] Breaking changes documented
- [ ] Version lists generated

### Git Hygiene
- [ ] Commits follow conventional format
- [ ] Upgrade branch merged to main
- [ ] Upgrade tagged in git
- [ ] Backup tags created

### Cleanup
- [ ] Unused dependencies removed
- [ ] Old backup branches deleted (optional)
- [ ] Working directory clean

---

## Expected Timeline

| Phase | Duration | Can Run |
|-------|----------|---------|
| Phase 1: Patch Updates | 15 min | Evening |
| Phase 2: Minor - Tools | 1-2 hours | Evening |
| Phase 3: Minor - Runtime | 30-60 min | Evening |
| **Break** | - | - |
| Phase 4: ESLint 9 | 2-3 hours | Morning |
| **Break / Review** | - | - |
| Phase 5: React 19 + Next 16 | 4-6 hours | Full day |
| **Break / Testing** | - | - |
| Phase 6: LangChain + OpenAI | 3-4 hours | Half day |
| Phase 7: Pulumi GCP | 1-2 hours | Evening |
| Phase 8: Type Definitions | 30 min | Evening |
| Phase 9: Cleanup | 30 min | Evening |
| Phase 10: Final Verification | 1 hour | Anytime |

**Total:** 12-18 hours over 2-3 days

---

## Success Criteria

✅ **Complete** when:

1. All targeted dependencies upgraded to latest stable versions
2. All quality gates pass without errors
3. Full manual testing completed successfully
4. Documentation updated
5. Changes merged to main branch
6. No known regressions or issues

---

**Status:** Ready for execution  
**Next:** Begin Phase 1 - Patch Updates

**Good luck! 🚀**
