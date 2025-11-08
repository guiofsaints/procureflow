# Dependency Audit Report

**Generated:** November 7, 2025  
**Monorepo:** ProcureFlow  
**Package Manager:** pnpm 10.20.0

---

## Executive Summary

### Total Packages Analyzed: 3
- Root workspace (`package.json`)
- Web app (`apps/web/package.json`)
- GCP Infrastructure (`infra/pulumi/gcp/package.json`)

### Upgrade Categories

| Category | Count | Risk Level |
|----------|-------|------------|
| **Patch Updates** | 1 | ✅ Low |
| **Minor Updates** | 5 | ⚠️ Medium |
| **Major Updates** | 6 | 🔴 High |
| **Up-to-date** | ~35 | ✅ None |

---

## 1. Root Workspace (`package.json`)

### Dependencies: N/A (workspace config only)

### Dev Dependencies

| Package | Current | Latest | Change Type | Notes |
|---------|---------|--------|-------------|-------|
| `@commitlint/cli` | ^20.1.0 | 20.1.0 | ✅ Up-to-date | Conventional commits linter |
| `@commitlint/config-conventional` | ^20.0.0 | 20.1.0 | 🟡 Patch | Config for commitlint |
| `husky` | ^9.1.7 | 9.1.7 | ✅ Up-to-date | Git hooks manager |
| `prettier` | ^3.6.2 | 3.6.2 | ✅ Up-to-date | Code formatter |
| `standard-version` | ^9.5.0 | 9.5.0 | ✅ Up-to-date | Semantic versioning |

**Risk Assessment:** ✅ **LOW** - Only one patch update needed

---

## 2. Web Application (`apps/web/package.json`)

### Runtime Dependencies

| Package | Current | Latest | Change Type | Notes |
|---------|---------|--------|-------------|-------|
| **Core Framework** |
| `next` | ^15.0.3 (→15.5.6) | 16.0.1 | 🔴 Major | Next.js 16 - Breaking changes expected |
| `react` | ^18.2.0 (→18.3.1) | 19.2.0 | 🔴 Major | React 19 - New hooks, breaking changes |
| `react-dom` | ^18.2.0 (→18.3.1) | 19.2.0 | 🔴 Major | Must match React version |
| **Authentication & Database** |
| `next-auth` | ^4.24.5 | 4.24.12 | 🟢 Minor | Auth.js - patch updates available |
| `mongoose` | ^8.10.6 | 8.10.6 | ✅ Up-to-date | MongoDB ODM |
| **AI & ML** |
| `langchain` | ^0.0.208 | 1.0.3 | 🔴 Major | LangChain 1.0 - Stable release! |
| `openai` | ^4.20.1 (→4.104.0) | 6.8.1 | 🔴 Major | OpenAI SDK v6 - Breaking changes |
| **UI Components** |
| `@hookform/resolvers` | ^5.2.2 | 5.2.2 | ✅ Up-to-date | Form validation |
| `@radix-ui/react-avatar` | ^1.1.11 | 1.1.11 | ✅ Up-to-date | |
| `@radix-ui/react-collapsible` | ^1.1.12 | 1.1.12 | ✅ Up-to-date | |
| `@radix-ui/react-dialog` | ^1.1.15 | 1.1.15 | ✅ Up-to-date | |
| `@radix-ui/react-dropdown-menu` | ^2.1.16 | 2.1.16 | ✅ Up-to-date | |
| `@radix-ui/react-label` | ^2.1.8 | 2.1.8 | ✅ Up-to-date | |
| `@radix-ui/react-separator` | ^1.1.8 | 1.1.8 | ✅ Up-to-date | |
| `@radix-ui/react-slot` | ^1.2.4 | 1.2.4 | ✅ Up-to-date | |
| `@radix-ui/react-tooltip` | ^1.2.8 | 1.2.8 | ✅ Up-to-date | |
| `@tanstack/react-table` | ^8.21.3 | 8.21.3 | ✅ Up-to-date | Data tables |
| **Utilities** |
| `class-variance-authority` | ^0.7.1 | 0.7.1 | ✅ Up-to-date | CSS variants |
| `clsx` | ^2.1.1 | 2.1.1 | ✅ Up-to-date | Class names utility |
| `lucide-react` | ^0.553.0 | 0.563.0 | 🟢 Minor | Icon library |
| `next-themes` | ^0.4.6 | 0.4.6 | ✅ Up-to-date | Theme switcher |
| `react-hook-form` | ^7.66.0 | 7.66.0 | ✅ Up-to-date | Forms |
| `sonner` | ^2.0.7 | 2.0.7 | ✅ Up-to-date | Toast notifications |
| `tailwind-merge` | ^3.3.1 | 3.3.1 | ✅ Up-to-date | Tailwind class merging |
| `zod` | ^4.1.12 | 4.1.12 | ✅ Up-to-date | Schema validation |

### Dev Dependencies

| Package | Current | Latest | Change Type | Notes |
|---------|---------|--------|-------------|-------|
| **Linting & Type Checking** |
| `eslint` | ^8.54.0 (→8.57.1) | 9.39.1 | 🔴 Major | ESLint 9 - Flat config required |
| `@eslint/eslintrc` | ^2.1.4 | 3.3.1 | 🔴 Major | ESLint config utility |
| `eslint-config-next` | ^15.0.3 (→15.5.6) | 16.0.1 | 🟢 Minor | Must match Next.js version |
| `typescript` | ^5.9.3 | 5.9.3 | ✅ Up-to-date | TypeScript compiler |
| **Type Definitions** |
| `@types/node` | ^20.10.0 (→20.19.24) | 24.10.0 | 🔴 Major | Node.js types v24 |
| `@types/react` | ^18.2.41 (→18.3.26) | 19.2.2 | 🔴 Major | React 19 types |
| `@types/react-dom` | ^18.2.17 (→18.3.7) | 19.2.2 | 🔴 Major | React DOM 19 types |
| **Styling** |
| `tailwindcss` | ^4.0.0 | 4.1.17 | 🟢 Minor | Already on Tailwind 4! |
| `@tailwindcss/postcss` | ^4.1.17 | 4.1.17 | ✅ Up-to-date | PostCSS plugin |
| `autoprefixer` | ^10.4.20 | 10.4.20 | ✅ Up-to-date | CSS autoprefixer |
| `postcss` | ^8.5.1 | 8.5.1 | ✅ Up-to-date | CSS processor |

**Risk Assessment:** 🔴 **HIGH** - Multiple major updates including React 19, Next.js 16, ESLint 9, LangChain 1.0, and OpenAI v6

---

## 3. GCP Infrastructure (`infra/pulumi/gcp/package.json`)

### Dependencies

| Package | Current | Latest | Change Type | Notes |
|---------|---------|--------|-------------|-------|
| `@pulumi/pulumi` | ^3.150.0 | 3.206.0 | 🟢 Minor | Pulumi SDK - 56 minor versions behind |
| `@pulumi/gcp` | ^8.11.1 | 9.4.0 | 🔴 Major | GCP provider v9 |
| `@pulumi/docker` | ^4.5.8 | 4.9.0 | 🟢 Minor | Docker provider |

### Dev Dependencies

| Package | Current | Latest | Change Type | Notes |
|---------|---------|--------|-------------|-------|
| `@types/node` | ^20.10.0 | 24.10.0 | 🔴 Major | Shared with web app |
| `typescript` | ^5.9.3 | 5.9.3 | ✅ Up-to-date | Shared with web app |

**Risk Assessment:** ⚠️ **MEDIUM** - One major update (GCP provider), some minor updates

---

## Summary by Risk Category

### ✅ Patch Updates (Low Risk)

1. `@commitlint/config-conventional`: 20.0.0 → 20.1.0

**Total:** 1 package

---

### 🟢 Minor Updates (Medium Risk)

1. **Web App:**
   - `next-auth`: 4.24.5 → 4.24.12
   - `lucide-react`: 0.553.0 → 0.563.0
   - `eslint-config-next`: 15.5.6 → 16.0.1 (should match Next.js)
   - `tailwindcss`: 4.0.0 → 4.1.17

2. **Infrastructure:**
   - `@pulumi/pulumi`: 3.150.0 → 3.206.0
   - `@pulumi/docker`: 4.5.8 → 4.9.0

**Total:** 6 packages

---

### 🔴 Major Updates (High Risk)

#### Critical Platform Updates:
1. **Next.js Ecosystem:**
   - `next`: 15.5.6 → 16.0.1
   - `react`: 18.3.1 → 19.2.0
   - `react-dom`: 18.3.1 → 19.2.0
   - `@types/react`: 18.3.26 → 19.2.2
   - `@types/react-dom`: 18.3.7 → 19.2.2

2. **Development Tooling:**
   - `eslint`: 8.57.1 → 9.39.1
   - `@eslint/eslintrc`: 2.1.4 → 3.3.1

3. **AI/ML Stack:**
   - `langchain`: 0.0.208 → 1.0.3 (🎉 Stable release!)
   - `openai`: 4.104.0 → 6.8.1

4. **Infrastructure:**
   - `@pulumi/gcp`: 8.11.1 → 9.4.0

5. **Type Definitions:**
   - `@types/node`: 20.19.24 → 24.10.0

**Total:** 11 packages

---

## Critical Dependencies Requiring Special Attention

### 1. React 19 Upgrade
- **Impact:** Breaking changes to hooks, suspense, server components
- **Migration Guide:** https://react.dev/blog/2025/01/29/react-19
- **Considerations:**
  - New `use()` hook replaces some patterns
  - Suspense improvements
  - Server Components changes
  - All React-related packages must be upgraded together

### 2. Next.js 16 Upgrade
- **Impact:** Framework-level breaking changes
- **Migration Guide:** https://nextjs.org/docs/app/building-your-application/upgrading/version-16
- **Considerations:**
  - App Router changes
  - Server Actions updates
  - Caching behavior changes
  - Must be done after React 19

### 3. ESLint 9 Upgrade
- **Impact:** Flat config is now required (no more `.eslintrc`)
- **Migration Guide:** https://eslint.org/docs/latest/use/migrate-to-9.0.0
- **Considerations:**
  - Already using flat config (`eslint.config.mjs`)
  - Verify all plugins support ESLint 9
  - Rules may have changed

### 4. LangChain 1.0 Upgrade
- **Impact:** Major API changes, stable release
- **Migration Guide:** https://js.langchain.com/docs/guides/migrating_to_0_2
- **Considerations:**
  - Package structure changed (@langchain/core, @langchain/openai)
  - Import paths updated
  - Breaking API changes

### 5. OpenAI SDK v6 Upgrade
- **Impact:** Breaking changes in API interface
- **Migration Guide:** https://github.com/openai/openai-node/releases
- **Considerations:**
  - Response structure changes
  - Streaming API updates
  - Error handling changes

### 6. Pulumi GCP Provider v9
- **Impact:** Resource schema changes
- **Migration Guide:** https://www.pulumi.com/registry/packages/gcp/
- **Considerations:**
  - Review breaking changes in GCP resources
  - Test infrastructure preview before applying
  - May require Pulumi state updates

---

## Deprecated or Problematic Packages

### None Detected ✅

All packages are actively maintained and have recent releases. No deprecated packages found.

---

## Recommended Upgrade Strategy

Given the complexity and interdependencies:

1. **Phase 1:** Patch updates (safe, immediate)
2. **Phase 2:** Tooling minor updates (build tools, Tailwind)
3. **Phase 3:** Infrastructure updates (Pulumi - isolated from web app)
4. **Phase 4:** ESLint 9 (requires config validation)
5. **Phase 5:** React 19 + Next.js 16 (coordinated, high-risk)
6. **Phase 6:** AI stack (LangChain + OpenAI - breaking changes)
7. **Phase 7:** Type definitions (after framework upgrades)

**See:** `.guided/plan/dependency-upgrade-plan.md` for detailed execution plan.

---

## Quality Gates

After each phase, the following must pass:

```bash
✅ pnpm install          # No errors, lock file updated
✅ pnpm lint            # No linting errors
✅ pnpm format          # Code formatted
✅ pnpm type-check      # TypeScript compiles
✅ pnpm test            # Tests pass
✅ pnpm build           # Production build succeeds
```

---

**Next Steps:** Review the upgrade plan in `.guided/plan/dependency-upgrade-plan.md`
