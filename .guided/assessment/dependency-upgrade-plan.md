# Dependency Upgrade Plan

**Project:** ProcureFlow Tech Case  
**Date:** November 7, 2025  
**Planned By:** Dependency Upgrade Engineer  
**Cross-reference:** [dependency-inventory.md](./dependency-inventory.md)

## Executive Summary

This plan outlines a **conservative, phased upgrade strategy** for ProcureFlow dependencies, prioritizing stability and minimizing risk to the bootstrap codebase. The approach focuses on upgrading low-risk tooling and development dependencies while **deferring major framework changes** that could introduce significant breaking changes.

**Key Decisions:**

- ✅ Upgrade: Tooling, TypeScript, Mongoose, Husky, Commitlint, Pulumi core
- ⚠️ Selective Upgrade: ESLint (8→9), pnpm (8→9), Pulumi GCP (7→8)
- 🚫 Defer: Next.js 16, React 19, Tailwind 4, LangChain 1.x, NextAuth 5, OpenAI 6.x

---

## Upgrade Phases

### Phase 1: Low-Risk Tooling & Dependencies ✅

**Risk Level:** LOW  
**Estimated Effort:** 30 minutes  
**Rollback:** Simple (revert package.json + lockfile)

### Phase 2: Medium-Risk Developer Tooling ⚠️

**Risk Level:** MEDIUM  
**Estimated Effort:** 1-2 hours  
**Rollback:** Moderate (config changes needed)

### Phase 3: Infrastructure Updates ⚠️

**Risk Level:** MEDIUM  
**Estimated Effort:** 1 hour  
**Rollback:** Simple (Pulumi state preserved)

### Phase 4: Major Framework Updates 🚫

**Risk Level:** CRITICAL  
**Status:** **DEFERRED**  
**Rationale:** Ecosystem not ready, too many breaking changes

---

## Phase 1: Low-Risk Tooling & Dependencies

### Packages to Upgrade

| Package          | Current | Target  | Risk | Area    |
| ---------------- | ------- | ------- | ---- | ------- |
| `prettier`       | 3.1.0   | 3.4.2   | LOW  | Tooling |
| `typescript`     | 5.1.6   | 5.9.3   | LOW  | Core    |
| `mongoose`       | 8.0.3   | 8.10.6  | LOW  | Data    |
| `autoprefixer`   | 10.4.16 | 10.4.20 | LOW  | Styling |
| `postcss`        | 8.4.32  | 8.5.1   | LOW  | Styling |
| `@pulumi/pulumi` | 3.95.0  | 3.150.0 | LOW  | Infra   |
| `@pulumi/docker` | 4.5.1   | 4.5.8   | LOW  | Infra   |

### Pre-Upgrade Checklist

- [ ] Backup current `pnpm-lock.yaml`
- [ ] Create git branch: `chore/dependency-upgrade-phase1`
- [ ] Ensure clean working directory (`git status`)
- [ ] Verify Node.js version: `node --version` (should be 20.x)

### Step-by-Step Instructions

#### 1.1 Update Root `package.json`

```json
{
  "devDependencies": {
    "prettier": "^3.4.2"
  }
}
```

#### 1.2 Update `apps/web/package.json`

```json
{
  "dependencies": {
    "mongoose": "^8.10.6"
  },
  "devDependencies": {
    "typescript": "^5.9.3",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.5.1"
  }
}
```

#### 1.3 Update `infra/pulumi/gcp/package.json`

```json
{
  "dependencies": {
    "@pulumi/pulumi": "^3.150.0",
    "@pulumi/docker": "^4.5.8"
  }
}
```

#### 1.4 Install Dependencies

```bash
pnpm install
```

**Expected Result:** Clean installation with no peer dependency warnings.

#### 1.5 Verify Installation

```bash
# Check TypeScript version
pnpm --filter web exec tsc --version  # Should show 5.9.3

# Check Prettier version
pnpm exec prettier --version  # Should show 3.4.2

# Verify builds still work
pnpm type-check
pnpm lint
pnpm format --check
```

### Code Changes Required

**NONE** - These are all backwards-compatible updates.

### Testing Checklist

- [ ] `pnpm install` completes successfully
- [ ] `pnpm type-check` passes
- [ ] `pnpm lint` passes
- [ ] `pnpm format` runs without errors
- [ ] `pnpm build` (Next.js build) completes
- [ ] No new TypeScript errors introduced

### Rollback Plan

```bash
git checkout pnpm-lock.yaml package.json apps/web/package.json infra/pulumi/gcp/package.json
pnpm install
```

---

## Phase 2: Medium-Risk Developer Tooling

### 2A: Husky 8.x → 9.x

**Breaking Changes:**

- New init command: `pnpm exec husky init` (instead of `pnpm exec husky install`)
- Different hook script format
- `.husky/` directory structure unchanged but scripts updated

#### Pre-Upgrade Checklist

- [ ] Review current `.husky/` directory contents
- [ ] Backup `.husky/` directory
- [ ] Ensure `prepare` script exists in root `package.json`

#### Update Steps

**2A.1 Update `package.json`**

```json
{
  "devDependencies": {
    "husky": "^9.1.7"
  },
  "scripts": {
    "prepare": "husky"
  }
}
```

**2A.2 Install Husky 9**

```bash
pnpm install
```

**2A.3 Update Git Hooks (if needed)**

Check `.husky/pre-commit` and `.husky/commit-msg` - they should work as-is with Husky 9.

**Current format (should be fine):**

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

pnpm lint-staged
```

**2A.4 Test Hooks**

```bash
# Test commit-msg hook
echo "invalid message" | git commit --no-verify -F -  # Should fail with Husky 9

# Test pre-commit hook (if applicable)
git add .
git commit -m "test: husky 9 validation"  # Should run hooks
git reset HEAD~1  # Reset test commit
```

#### Code Changes Required

- Update `.husky/` scripts IF they fail (unlikely)
- The `prepare` script changes from `husky install` to just `husky`

#### Testing Checklist

- [ ] Husky 9 installed successfully
- [ ] `commit-msg` hook works (validates conventional commits)
- [ ] `pre-commit` hook works (if configured)
- [ ] `pnpm prepare` runs without errors

---

### 2B: Commitlint 18.x → 20.x

**Breaking Changes:**

- Requires Node.js 18+ (we have 20.x ✅)
- Config format mostly unchanged
- Some plugin API changes (we're not using custom plugins)

#### Update Steps

**2B.1 Update `package.json`**

```json
{
  "devDependencies": {
    "@commitlint/cli": "^20.1.0",
    "@commitlint/config-conventional": "^20.0.0"
  }
}
```

**2B.2 Install Dependencies**

```bash
pnpm install
```

**2B.3 Verify Config**

Check `commitlint.config.cjs` - should work as-is:

```javascript
module.exports = {
  extends: ['@commitlint/config-conventional'],
};
```

**2B.4 Test Commitlint**

```bash
echo "feat: test commit message" | pnpm exec commitlint  # Should pass
echo "invalid message" | pnpm exec commitlint  # Should fail
```

#### Code Changes Required

**NONE** - Config should work as-is.

#### Testing Checklist

- [ ] Commitlint 20.x installed
- [ ] Valid commits pass validation
- [ ] Invalid commits fail validation
- [ ] Husky integration still works

---

### 2C: ESLint 8.x → 9.x (OPTIONAL - Higher Risk)

**⚠️ WARNING:** This is the most complex upgrade in Phase 2. Consider deferring if time-constrained.

**Breaking Changes:**

- Flat config is now mandatory (we already use it ✅)
- Some plugins may not be compatible yet
- `@eslint/eslintrc` compatibility layer updated
- Changed plugin resolution

#### Pre-Upgrade Assessment

First, check if `eslint-config-next` supports ESLint 9:

```bash
# Check Next.js ESLint config compatibility
pnpm info eslint-config-next peerDependencies
```

**Decision Point:**

- If `eslint-config-next` requires ESLint 8.x → **DEFER** this upgrade
- If it supports ESLint 9.x → **PROCEED**

#### Update Steps (IF PROCEEDING)

**2C.1 Update `apps/web/package.json`**

```json
{
  "devDependencies": {
    "eslint": "^9.39.1",
    "@eslint/eslintrc": "^3.3.1"
  }
}
```

**2C.2 Install Dependencies**

```bash
cd apps/web
pnpm install
```

**2C.3 Update `eslint.config.mjs` (if needed)**

Review and potentially update:

```javascript
import { FlatCompat } from '@eslint/eslintrc';

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    rules: {
      // ... existing rules
    },
  },
];

export default eslintConfig;
```

**2C.4 Test ESLint**

```bash
pnpm --filter web lint
```

**2C.5 Fix Any Errors**

Common issues:

- Plugin resolution errors → Update plugin imports
- Rule deprecations → Update or remove deprecated rules
- Config extension issues → Adjust FlatCompat usage

#### Code Changes Required

- **Likely:** `eslint.config.mjs` adjustments for ESLint 9 compatibility
- **Possible:** Rule configuration updates

#### Testing Checklist

- [ ] ESLint 9 installed
- [ ] `pnpm lint` passes with no errors
- [ ] All existing lint rules still work
- [ ] No false positives introduced

#### Rollback Plan

```bash
cd apps/web
git checkout package.json
pnpm install
```

**RECOMMENDATION:** **DEFER** ESLint 9 upgrade until `eslint-config-next` has full support. Current ESLint 8 is stable and sufficient.

---

## Phase 3: Infrastructure Updates

### 3A: pnpm 8.x → 9.x

**Breaking Changes:**

- Lockfile format v9 (backwards compatible for reading v8)
- Some CLI flags changed
- Workspace protocol changes (minor)

#### Update Steps

**3A.1 Update `package.json`**

```json
{
  "packageManager": "pnpm@9.15.1"
}
```

**3A.2 Install pnpm 9 Globally (if needed)**

```bash
npm install -g pnpm@9
```

**3A.3 Update Dependencies**

```bash
pnpm install
```

This will update `pnpm-lock.yaml` to v9 format.

**3A.4 Verify Workspace**

```bash
pnpm -r ls  # List all workspace packages
pnpm run build  # Ensure builds still work
```

#### Code Changes Required

**NONE**

#### Testing Checklist

- [ ] pnpm 9 installed
- [ ] `pnpm install` completes
- [ ] `pnpm-lock.yaml` updated to v9
- [ ] All workspace commands work
- [ ] Builds complete successfully

---

### 3B: Pulumi GCP Provider 7.x → 8.x

**Breaking Changes:**

- GCP API updates reflected in resource schemas
- Some resource properties renamed or removed
- New required properties for some resources

#### Pre-Upgrade Checklist

- [ ] Review current `infra/pulumi/gcp/index.ts`
- [ ] Ensure Pulumi CLI is up to date: `pulumi version`
- [ ] Backup Pulumi state: `pulumi stack export > backup.json`

#### Update Steps

**3B.1 Update `infra/pulumi/gcp/package.json`**

```json
{
  "dependencies": {
    "@pulumi/gcp": "^8.11.1"
  }
}
```

**3B.2 Install Dependencies**

```bash
cd infra/pulumi/gcp
pnpm install
```

**3B.3 Review Breaking Changes**

Check Pulumi GCP v8 changelog:

```bash
# Review changes between v7 and v8
pnpm info @pulumi/gcp --json | jq .versions
```

**3B.4 Update Infrastructure Code**

Review `index.ts` for:

- Deprecated resource properties
- Required property additions
- Resource type changes

**3B.5 Run Pulumi Preview**

```bash
cd infra/pulumi/gcp
pulumi preview
```

**Expected:** No changes if infrastructure code is compatible. If there are issues, review and fix.

**3B.6 (OPTIONAL) Upgrade to v9**

If v8 works well, can proceed to v9:

```json
{
  "dependencies": {
    "@pulumi/gcp": "^9.4.0"
  }
}
```

Repeat steps 3B.2-3B.5.

#### Code Changes Required

- **Likely:** None (if infrastructure is simple)
- **Possible:** Resource property updates in `index.ts`

#### Testing Checklist

- [ ] `pnpm install` completes
- [ ] TypeScript compilation succeeds
- [ ] `pulumi preview` runs without errors
- [ ] No unexpected infrastructure changes shown

#### Rollback Plan

```bash
cd infra/pulumi/gcp
git checkout package.json
pnpm install
pulumi preview  # Verify state is intact
```

---

## Phase 4: Major Framework Updates (DEFERRED)

### Why We're Deferring These Upgrades

The following upgrades are **NOT recommended** for the current bootstrap codebase due to high risk and insufficient ecosystem maturity:

#### 4A: Next.js 15.x → 16.x & React 18.x → 19.x 🚫

**Status:** **DEFER**

**Why:**

- Next.js 16 requires React 19
- React 19 is very new (released late 2024)
- Many third-party libraries not yet compatible
- Breaking changes in React 19:
  - Removed `defaultProps` for function components
  - `ref` is now a prop (not special)
  - New concurrent rendering behaviors
  - Stricter hydration checks

**Impact on ProcureFlow:**

- Potential component breakage
- NextAuth compatibility concerns
- Unknown issues with Mongoose + React Server Components
- Risk to AI features (LangChain + React)

**When to Reconsider:**

- Q2 2026 or later, when ecosystem is stable
- After Next.js 16 has 6+ months in production
- When `next-auth` v5 is stable and supports React 19

#### 4B: Tailwind CSS 3.x → 4.x 🚫

**Status:** **DEFER INDEFINITELY**

**Why:**

- Tailwind v4 is a complete rewrite
- CSS-first configuration (not TypeScript)
- Breaking changes in plugin system
- Different content detection
- PostCSS integration changes
- Requires rewriting `tailwind.config.ts` to CSS

**Impact on ProcureFlow:**

- ALL components need review
- Configuration completely rewritten
- Custom theme may not migrate cleanly
- Risk of visual regressions

**When to Reconsider:**

- Only if Tailwind v4 provides critical features needed
- After v4 has 12+ months of production use
- When migration tools are mature
- **Recommendation:** Stay on v3.x long-term, it's stable and sufficient

#### 4C: LangChain 0.0.x → 1.x 🚫

**Status:** **DEFER**

**Why:**

- Complete API rewrite
- Import paths completely changed:
  - Old: `langchain/chat_models/openai`
  - New: `@langchain/openai`
- New packages required: `@langchain/core`, `@langchain/openai`
- Breaking changes in:
  - ChatOpenAI configuration
  - Message schema
  - Streaming API
  - Agent framework

**Impact on ProcureFlow:**

- Complete rewrite of `apps/web/src/lib/ai/langchainClient.ts`
- All AI features need retesting
- Prompt templates may need updates
- Risk to core AI functionality

**When to Reconsider:**

- When AI features are production-critical
- After LangChain 1.x is stable (6+ months)
- When dedicated AI development sprint is planned
- With comprehensive testing plan

#### 4D: NextAuth v4 → Auth.js v5 🚫

**Status:** **DEFER (BETA SOFTWARE)**

**Why:**

- Auth.js v5 is still in BETA
- Major rewrite from NextAuth v4
- Package renamed: `next-auth` → `@auth/nextauth`
- Breaking changes in:
  - Configuration API
  - Session handling
  - Provider setup
  - Callbacks

**Impact on ProcureFlow:**

- Complete rewrite of `apps/web/src/lib/auth/config.ts`
- All authentication needs retesting
- Potential session migration issues
- Risk to user authentication flow

**When to Reconsider:**

- When Auth.js v5 reaches stable (non-beta) release
- Q1-Q2 2026 or later
- After community adoption is widespread

#### 4E: OpenAI SDK 4.x → 6.x 🚫

**Status:** **DEFER (Tied to LangChain)**

**Why:**

- Tied to LangChain upgrade
- Major breaking changes in API
- Streaming API changes
- Response structure changes

**Impact on ProcureFlow:**

- Currently used via LangChain (indirect)
- Direct impact if LangChain is upgraded
- Should be upgraded together with LangChain

**When to Reconsider:**

- When LangChain 1.x is adopted
- Together with LangChain upgrade

---

## Global Testing Strategy

### After Each Phase

Run the following test suite:

```bash
# 1. Clean install
rm -rf node_modules apps/web/node_modules infra/pulumi/gcp/node_modules
pnpm install

# 2. Type checking
pnpm type-check

# 3. Linting
pnpm lint

# 4. Formatting
pnpm format --check

# 5. Build
pnpm build

# 6. Manual smoke tests
# - Start dev server: pnpm dev
# - Access http://localhost:3000
# - Check /api/health endpoint
# - (Optional) Test authentication flow
```

### Regression Checklist

- [ ] TypeScript compilation successful
- [ ] No new ESLint errors
- [ ] Prettier formatting consistent
- [ ] Next.js builds without errors
- [ ] Health check API works
- [ ] Authentication flow functional (if tested)
- [ ] No console errors in browser
- [ ] Git hooks working (Husky + Commitlint)

---

## Risk Mitigation

### Backup Strategy

Before starting any phase:

```bash
# 1. Create backup branch
git checkout -b backup/before-dependency-upgrade-$(date +%Y%m%d)
git push origin backup/before-dependency-upgrade-$(date +%Y%m%d)

# 2. Create working branch
git checkout main
git checkout -b chore/dependency-upgrade-phase-[N]

# 3. Backup lockfile
cp pnpm-lock.yaml pnpm-lock.yaml.backup
```

### Rollback Procedures

#### Quick Rollback (Simple)

```bash
git checkout pnpm-lock.yaml package.json apps/web/package.json infra/pulumi/gcp/package.json
pnpm install
```

#### Full Rollback (Major Issues)

```bash
git checkout backup/before-dependency-upgrade-YYYYMMDD
git branch -D chore/dependency-upgrade-phase-[N]
pnpm install
```

### Monitoring After Upgrade

- Watch for TypeScript errors in development
- Monitor build times (should not increase significantly)
- Check CI/CD pipelines if configured
- Review dependency tree for unexpected additions

---

## Execution Timeline

| Phase        | Description      | Effort  | Risk     | Recommended Date |
| ------------ | ---------------- | ------- | -------- | ---------------- |
| **Phase 1**  | Low-risk tooling | 30 min  | LOW      | Immediate        |
| **Phase 2A** | Husky 8→9        | 30 min  | LOW      | Immediate        |
| **Phase 2B** | Commitlint 18→20 | 15 min  | LOW      | Immediate        |
| **Phase 2C** | ESLint 8→9       | 1-2 hrs | MEDIUM   | DEFER (optional) |
| **Phase 3A** | pnpm 8→9         | 15 min  | LOW      | After Phase 2    |
| **Phase 3B** | Pulumi GCP 7→8/9 | 1 hr    | MEDIUM   | After Phase 3A   |
| **Phase 4**  | Major frameworks | N/A     | CRITICAL | DEFERRED         |

**Recommended Execution:**

- **Week 1:** Phases 1, 2A, 2B, 3A
- **Week 2:** Phase 3B (after infrastructure testing)
- **Phase 2C:** Only if time permits and ESLint 9 is proven compatible
- **Phase 4:** Re-evaluate in Q2 2026

---

## Success Criteria

### Phase 1 Success

- ✅ All low-risk packages upgraded
- ✅ Zero new TypeScript errors
- ✅ Build completes successfully
- ✅ No formatting/linting regressions
- ✅ Mongoose connection still works

### Phase 2 Success

- ✅ Husky 9 installed and hooks working
- ✅ Commitlint 20 validating commits
- ✅ (Optional) ESLint 9 running without errors
- ✅ Developer experience unchanged or improved

### Phase 3 Success

- ✅ pnpm 9 installed, workspace functioning
- ✅ Pulumi GCP provider upgraded
- ✅ `pulumi preview` shows no unexpected changes
- ✅ Infrastructure code compiles

### Overall Success

- ✅ Stable codebase with updated dependencies
- ✅ All CI/CD checks passing
- ✅ Documentation updated
- ✅ Team can continue development without blockers

---

## Post-Upgrade Documentation

After successful upgrades, update:

1. **README.md**: Update version requirements
2. **CONTRIBUTING.md**: Update development setup instructions
3. **.github/copilot-instructions.md**: Update tech stack versions
4. **CHANGELOG.md**: Document dependency upgrades with `standard-version`

---

## Appendix: Deferred Upgrades Detail

### LangChain 0.0.x → 1.x Migration Notes

When this upgrade is eventually performed, here's what will be needed:

**Old Code (0.0.x):**

```typescript
import { ChatOpenAI } from 'langchain/chat_models/openai';
import { HumanMessage, SystemMessage } from 'langchain/schema';

const model = new ChatOpenAI({
  openAIApiKey: API_KEY,
  modelName: 'gpt-3.5-turbo',
  temperature: 0.7,
});

const messages = [
  new SystemMessage('You are a helpful assistant'),
  new HumanMessage('Hello'),
];

const response = await model.call(messages);
```

**New Code (1.x):**

```typescript
import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';

const model = new ChatOpenAI({
  apiKey: API_KEY, // Changed from openAIApiKey
  model: 'gpt-3.5-turbo', // Changed from modelName
  temperature: 0.7,
});

const messages = [
  new SystemMessage('You are a helpful assistant'),
  new HumanMessage('Hello'),
];

const response = await model.invoke(messages); // Changed from call
```

**Required Package Changes:**

```bash
pnpm remove langchain
pnpm add @langchain/core @langchain/openai
```

---

## Conclusion

This plan provides a **safe, incremental path** for upgrading ProcureFlow dependencies while minimizing risk to the bootstrap codebase. By focusing on low-risk updates first and deferring major framework changes, we maintain stability while keeping the project reasonably up-to-date.

**Key Takeaway:** For a bootstrap/tech case codebase, **stability > cutting-edge**. The deferred upgrades (React 19, Next.js 16, Tailwind 4, LangChain 1.x) offer little value and significant risk at this stage. Revisit them when the ecosystem matures and business requirements justify the effort.
