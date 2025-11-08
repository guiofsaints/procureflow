# Dependency Upgrade Notes

**Generated:** November 7, 2025  
**Last Updated:** November 7, 2025  
**Monorepo:** ProcureFlow

---

## Purpose

This document captures important findings, breaking changes, and considerations discovered during the dependency audit that will inform the upgrade strategy.

---

## Critical Upgrade Considerations

### 1. React 19 Upgrade (🔴 High Priority, High Risk)

**Current:** React 18.3.1  
**Target:** React 19.2.0  
**Change Type:** Major

#### Breaking Changes to Consider:

1. **New Hooks:**
   - `use()` hook for reading promises and context
   - Replaces some `useEffect` patterns for data fetching

2. **Server Components:**
   - Improved server component support
   - Changes to async server components
   - Better hydration handling

3. **Suspense Improvements:**
   - Suspense is now stable for data fetching
   - Changes to error boundaries

4. **Deprecated Patterns:**
   - Some string refs deprecated
   - Changes to `defaultProps` handling

#### Migration Resources:
- **Official Guide:** https://react.dev/blog/2025/01/29/react-19
- **Upgrade Tool:** `npx codemod@latest upgrade/react/19`
- **Key Docs:**
  - https://react.dev/blog/2024/04/25/react-19-upgrade-guide
  - https://react.dev/reference/react/use

#### Impact Assessment for ProcureFlow:
- ✅ Already using Server Components pattern
- ✅ Using Next.js App Router (compatible)
- ⚠️ Need to review all `useEffect` data fetching patterns
- ⚠️ Verify all Radix UI components work with React 19
- ⚠️ Test cart context and state management

#### Testing Strategy:
1. Upgrade in isolated branch
2. Run all tests
3. Manually test:
   - Authentication flow
   - Cart management
   - Catalog browsing
   - AI agent chat
   - Theme switching
4. Check for console warnings

---

### 2. Next.js 16 Upgrade (🔴 High Priority, High Risk)

**Current:** Next.js 15.5.6  
**Target:** Next.js 16.0.1  
**Change Type:** Major

#### Key Considerations:

1. **React 19 Requirement:**
   - Next.js 16 **requires** React 19
   - Must upgrade React first or simultaneously

2. **App Router Changes:**
   - Caching behavior modifications
   - Changes to `revalidate` options
   - Server Actions improvements

3. **Turbopack:**
   - Default bundler in dev mode
   - May affect build configuration

4. **Image Optimization:**
   - New image optimization defaults
   - Changes to `next/image` component

#### Migration Resources:
- **Official Guide:** https://nextjs.org/docs/app/building-your-application/upgrading/version-16
- **Changelog:** https://github.com/vercel/next.js/releases/tag/v16.0.0
- **Codemod:** `npx @next/codemod@latest upgrade latest`

#### Impact Assessment for ProcureFlow:
- ✅ Using App Router exclusively
- ✅ No Pages Router to migrate
- ⚠️ Review all API routes (`app/(app)/api/*`)
- ⚠️ Test Server Actions if used
- ⚠️ Verify static generation for public pages

#### Upgrade Order:
**MUST upgrade React 19 BEFORE or WITH Next.js 16**

---

### 3. ESLint 9 Upgrade (🔴 High Priority, Medium Risk)

**Current:** ESLint 8.57.1  
**Target:** ESLint 9.39.1  
**Change Type:** Major

#### Breaking Changes:

1. **Flat Config Required:**
   - ✅ **ALREADY USING** `eslint.config.mjs`
   - Old `.eslintrc.*` format no longer supported
   - ProcureFlow is already prepared!

2. **Plugin Compatibility:**
   - Need to verify `eslint-config-next` supports ESLint 9
   - `@eslint/eslintrc` may need update to v3

3. **Rule Changes:**
   - Some rules deprecated or changed behavior
   - New recommended rules

#### Migration Resources:
- **Official Guide:** https://eslint.org/docs/latest/use/migrate-to-9.0.0
- **Flat Config Docs:** https://eslint.org/docs/latest/use/configure/configuration-files
- **Next.js ESLint:** https://nextjs.org/docs/app/building-your-application/configuring/eslint

#### Impact Assessment for ProcureFlow:
- ✅ Already using flat config (`eslint.config.mjs`)
- ✅ Using `FlatCompat` from `@eslint/eslintrc`
- ⚠️ May need to update `eslint-config-next` to v16 (matches Next.js 16)
- ⚠️ Review and test all lint rules

#### Upgrade Path:
1. Upgrade `@eslint/eslintrc` to v3 first
2. Upgrade `eslint` to v9
3. Upgrade `eslint-config-next` to match Next.js version
4. Run `pnpm lint` and fix any new errors

---

### 4. LangChain 1.0 Upgrade (🔴 High Priority, High Risk)

**Current:** LangChain 0.0.208  
**Target:** LangChain 1.0.3  
**Change Type:** Major (🎉 Stable Release!)

#### Major Breaking Changes:

1. **Package Structure:**
   - Split into modular packages:
     - `@langchain/core` - Core interfaces
     - `@langchain/openai` - OpenAI integration
     - `@langchain/community` - Community integrations
     - `langchain` - Meta package

2. **Import Paths:**
   ```javascript
   // OLD (0.0.x):
   import { ChatOpenAI } from 'langchain/chat_models/openai';
   
   // NEW (1.0.x):
   import { ChatOpenAI } from '@langchain/openai';
   ```

3. **API Changes:**
   - Prompt templates syntax updated
   - Chain interfaces refactored
   - Memory handling changed

4. **TypeScript:**
   - Improved type safety
   - Better inference

#### Migration Resources:
- **Migration Guide:** https://js.langchain.com/docs/guides/migrating_to_1_0
- **v0.2 to v1.0:** https://js.langchain.com/docs/guides/migrating_to_0_2 (intermediate)
- **API Reference:** https://js.langchain.com/docs/api/

#### Impact Assessment for ProcureFlow:
- 🔴 **HIGH IMPACT** - Core AI functionality
- ⚠️ Need to update: `src/lib/ai/langchainClient.ts`
- ⚠️ Need to refactor: `src/features/agent/lib/agent.service.ts`
- ⚠️ All AI chat and procurement analysis features affected

#### Current Usage in ProcureFlow:
```typescript
// File: src/lib/ai/langchainClient.ts
import { ChatOpenAI } from 'langchain/chat_models/openai';
import { HumanMessage, SystemMessage } from 'langchain/schema';
```

#### Required Changes:
1. Install new packages:
   ```bash
   pnpm add @langchain/core @langchain/openai
   ```

2. Update imports:
   ```typescript
   import { ChatOpenAI } from '@langchain/openai';
   import { HumanMessage, SystemMessage } from '@langchain/core/messages';
   ```

3. Review prompt templates and chains

4. Test all AI features:
   - Agent chat
   - Request analysis
   - Item recommendations

---

### 5. OpenAI SDK v6 Upgrade (🔴 High Priority, High Risk)

**Current:** OpenAI 4.104.0  
**Target:** OpenAI 6.8.1  
**Change Type:** Major

#### Breaking Changes:

1. **Response Structure:**
   - Changes to completion response format
   - New streaming API

2. **Error Handling:**
   - Updated error types
   - Different error response structure

3. **API Compatibility:**
   - Some deprecated endpoints removed
   - New model naming conventions

4. **TypeScript:**
   - Improved type definitions
   - Stricter types

#### Migration Resources:
- **Changelog:** https://github.com/openai/openai-node/releases
- **v6 Release:** https://github.com/openai/openai-node/releases/tag/v6.0.0
- **API Docs:** https://platform.openai.com/docs/api-reference

#### Impact Assessment for ProcureFlow:
- ⚠️ Used via LangChain integration
- ⚠️ May be used directly in some places
- ⚠️ Coordinate with LangChain upgrade

#### Upgrade Strategy:
**Upgrade AFTER LangChain 1.0** to ensure compatibility

---

### 6. Pulumi GCP Provider v9 (⚠️ Medium Priority, Medium Risk)

**Current:** @pulumi/gcp 8.11.1  
**Target:** @pulumi/gcp 9.4.0  
**Change Type:** Major

#### Breaking Changes:

1. **Resource Schema Changes:**
   - Some GCP resource properties renamed
   - New required fields
   - Deprecated properties removed

2. **Provider Configuration:**
   - Updated authentication patterns
   - Region/zone handling changes

#### Migration Resources:
- **Provider Docs:** https://www.pulumi.com/registry/packages/gcp/
- **Migration Guide:** https://www.pulumi.com/registry/packages/gcp/how-to-guides/
- **Changelog:** https://github.com/pulumi/pulumi-gcp/releases

#### Impact Assessment for ProcureFlow:
- ✅ Infrastructure isolated from web app
- ⚠️ Review `infra/pulumi/gcp/index.ts`
- ⚠️ Run `pulumi preview` before applying

#### Upgrade Process:
1. Upgrade package
2. Run `pulumi preview` to see planned changes
3. Review any resource replacements
4. Test in dev environment
5. Apply to production only after validation

---

### 7. Type Definitions (@types/node, @types/react, @types/react-dom)

**Current:**
- `@types/node`: 20.19.24
- `@types/react`: 18.3.26
- `@types/react-dom`: 18.3.7

**Target:**
- `@types/node`: 24.10.0
- `@types/react`: 19.2.2
- `@types/react-dom`: 19.2.2

**Change Type:** Major

#### Considerations:

1. **@types/node v24:**
   - Node.js 24 types (future-looking)
   - May introduce new APIs
   - Check compatibility with Node.js 18 runtime

2. **@types/react v19:**
   - **MUST upgrade with React 19**
   - Will break type checking until React is upgraded

3. **@types/react-dom v19:**
   - **MUST upgrade with React 19**
   - Matches React types

#### Upgrade Order:
**Upgrade React types SIMULTANEOUSLY with React 19 upgrade**

---

## Deprecated Packages

### None Found ✅

All packages in use are actively maintained:
- ✅ Regular updates within last 3 months
- ✅ Active GitHub repositories
- ✅ Strong community support
- ✅ No deprecation notices

---

## Minor Version Upgrades Worth Noting

### 1. Tailwind CSS 4.0 → 4.1.17

**Current:** 4.0.0  
**Target:** 4.1.17  
**Change Type:** Minor

**Notes:**
- Already on Tailwind 4! 🎉
- Minor version updates (17 patches)
- Likely bug fixes and performance improvements
- Low risk upgrade

### 2. Pulumi SDK 3.150.0 → 3.206.0

**Current:** 3.150.0  
**Target:** 3.206.0  
**Change Type:** Minor (56 minor versions!)

**Notes:**
- Significant gap (56 minor versions)
- Likely many new features and improvements
- Review changelog for relevant updates
- Test Pulumi commands after upgrade

---

## Coordinated Upgrades Required

### 🔗 React Ecosystem (Must Upgrade Together):

1. `react` 18 → 19
2. `react-dom` 18 → 19  
3. `@types/react` 18 → 19
4. `@types/react-dom` 18 → 19
5. `next` 15 → 16
6. `eslint-config-next` 15 → 16

**Reason:** These packages have strict peer dependencies

### 🔗 ESLint Ecosystem:

1. `eslint` 8 → 9
2. `@eslint/eslintrc` 2 → 3
3. `eslint-config-next` (must support ESLint 9)

**Reason:** Config and plugins must match ESLint version

### 🔗 AI Stack:

1. `langchain` 0.0.x → 1.0.x
2. `openai` 4.x → 6.x

**Reason:** LangChain has peer dependency on OpenAI SDK

---

## Testing Requirements by Upgrade

### React 19 + Next.js 16:
- [ ] Authentication flow (sign in/out)
- [ ] Cart management (add/remove items)
- [ ] Catalog browsing and search
- [ ] Item detail pages
- [ ] Checkout process
- [ ] Theme switching (light/dark)
- [ ] All API routes (`/api/*`)
- [ ] Server components rendering
- [ ] Client components interactivity

### ESLint 9:
- [ ] `pnpm lint` passes
- [ ] No new warnings
- [ ] Rules still enforce code quality

### LangChain 1.0 + OpenAI v6:
- [ ] AI agent chat functionality
- [ ] Request analysis
- [ ] Item recommendations
- [ ] Streaming responses work
- [ ] Error handling correct

### Pulumi GCP v9:
- [ ] `pulumi preview` runs successfully
- [ ] No unexpected resource changes
- [ ] Infrastructure state intact

---

## Configuration Files Requiring Updates

### Potentially Affected:

1. **`eslint.config.mjs`**
   - May need rule updates for ESLint 9
   - Verify `FlatCompat` usage with `@eslint/eslintrc` v3

2. **`next.config.mjs`**
   - Review for Next.js 16 changes
   - Check image optimization config
   - Verify experimental features

3. **`tsconfig.json`**
   - May need updates for new TypeScript features
   - Verify `@types/node` v24 compatibility

4. **`src/lib/ai/langchainClient.ts`**
   - **Major refactor required** for LangChain 1.0
   - Update all imports
   - Update prompt templates

5. **`infra/pulumi/gcp/index.ts`**
   - Review for GCP provider v9 changes
   - Update resource configurations if needed

---

## Risk Mitigation Strategies

### 1. Branching Strategy:
- Create feature branches for each major upgrade phase
- Test thoroughly before merging
- Keep main branch stable

### 2. Incremental Approach:
- Upgrade in phases (see upgrade plan)
- Don't mix unrelated major upgrades
- One major ecosystem at a time

### 3. Rollback Plan:
- Git tags before each major upgrade
- Document known-good versions
- Keep old lock file for quick rollback

### 4. Testing:
- Run full test suite after each phase
- Manual testing of critical paths
- Monitor for console warnings/errors

---

## Known Issues to Watch For

### React 19:
- Server/Client component hydration mismatches
- Suspense boundary errors
- Context API changes

### Next.js 16:
- Caching behavior changes causing stale data
- Server Action edge cases
- Build performance differences

### ESLint 9:
- Plugin incompatibilities
- False positive rule violations
- Performance regressions

### LangChain 1.0:
- Import path resolution errors
- Type inference issues
- Breaking API changes in chains

### OpenAI v6:
- Streaming response format changes
- Error handling differences
- Rate limiting behavior

---

## Recommended Reading Before Upgrade

1. **React 19:** https://react.dev/blog/2025/01/29/react-19
2. **Next.js 16:** https://nextjs.org/docs/app/building-your-application/upgrading/version-16
3. **ESLint 9:** https://eslint.org/docs/latest/use/migrate-to-9.0.0
4. **LangChain 1.0:** https://js.langchain.com/docs/guides/migrating_to_1_0

---

## Success Criteria

After all upgrades complete, the following must be true:

✅ All quality gates pass:
- `pnpm lint` - No errors
- `pnpm format` - Code formatted
- `pnpm type-check` - TypeScript compiles
- `pnpm test` - All tests pass
- `pnpm build` - Production build succeeds

✅ Manual testing passes:
- All major user flows work
- No console errors
- No visible regressions

✅ Performance maintained or improved:
- Build times reasonable
- Runtime performance good
- No obvious slowdowns

✅ Documentation updated:
- README reflects new versions
- Breaking changes documented
- Migration notes preserved

---

**Status:** Ready for upgrade plan execution  
**Next:** See `.guided/plan/dependency-upgrade-plan.md` for detailed execution strategy
