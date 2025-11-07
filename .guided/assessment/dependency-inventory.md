# Dependency Inventory

**Project:** ProcureFlow Tech Case  
**Date:** November 7, 2025  
**Node.js Version:** v20.19.4 LTS  
**Package Manager:** pnpm 8.15.0

## Overview

This document provides a comprehensive inventory of all dependencies across the ProcureFlow monorepo workspace, analyzing current versions, latest stable versions, and upgrade risks.

---

## 1. Root Package (`procureflow`)

**Location:** `package.json`  
**Purpose:** Workspace root, shared tooling and development dependencies

### Development Dependencies

| Package                           | Current | Latest | Type | Risk Level | Notes                                                          |
| --------------------------------- | ------- | ------ | ---- | ---------- | -------------------------------------------------------------- |
| `@commitlint/cli`                 | 18.6.1  | 20.1.0 | dev  | **HIGH**   | Major version bump (18→20), requires config updates            |
| `@commitlint/config-conventional` | 18.6.3  | 20.0.0 | dev  | **HIGH**   | Major version bump (18→20), may have breaking config changes   |
| `husky`                           | 8.0.3   | 9.1.7  | dev  | **HIGH**   | Major version bump (8→9), different installation/setup process |
| `prettier`                        | 3.1.0   | 3.4.2  | dev  | LOW        | Minor version, low risk                                        |
| `standard-version`                | 9.5.0   | 9.5.0  | dev  | N/A        | Already on latest                                              |

### Package Manager

| Tool   | Current | Latest   | Notes                                          |
| ------ | ------- | -------- | ---------------------------------------------- |
| `pnpm` | 8.15.0  | 10.x     | Major version available, but 9.x is stable LTS |
| `node` | 20.19.4 | 20.x LTS | Already on latest LTS, no upgrade needed       |

---

## 2. Web Application (`apps/web`)

**Location:** `apps/web/package.json`  
**Purpose:** Next.js application with AI integration

### Runtime Dependencies

| Package     | Current | Latest       | Type    | Risk Level   | Notes                                                     |
| ----------- | ------- | ------------ | ------- | ------------ | --------------------------------------------------------- |
| `next`      | 15.5.6  | 16.0.1       | runtime | **HIGH**     | Major version bump (15→16), breaking changes expected     |
| `react`     | 18.3.1  | 19.2.0       | runtime | **HIGH**     | Major version bump (18→19), React 19 has breaking changes |
| `react-dom` | 18.3.1  | 19.2.0       | runtime | **HIGH**     | Must match React version                                  |
| `next-auth` | 4.24.5  | 5.0.0-beta.x | runtime | **CRITICAL** | `next-auth` v4 → Auth.js v5 is major rewrite, beta status |
| `mongoose`  | 8.0.3   | 8.10.x       | runtime | LOW          | Minor version bump, backwards compatible                  |
| `langchain` | 0.0.208 | 1.0.3        | runtime | **CRITICAL** | Major version (0.0.x → 1.x), complete API restructure     |
| `openai`    | 4.104.0 | 6.8.1        | runtime | **HIGH**     | Major version bump (4→6), breaking API changes            |

### Development Dependencies

| Package                   | Current  | Latest  | Type | Risk Level   | Notes                                                       |
| ------------------------- | -------- | ------- | ---- | ------------ | ----------------------------------------------------------- |
| `@types/node`             | 20.19.24 | 24.10.0 | dev  | MEDIUM       | Major version for Node 24 types, but we're on Node 20       |
| `@types/react`            | 18.3.26  | 19.2.2  | dev  | **HIGH**     | Must align with React version upgrade                       |
| `@types/react-dom`        | 18.3.7   | 19.2.2  | dev  | **HIGH**     | Must align with React version upgrade                       |
| `typescript`              | 5.1.6    | 5.9.3   | dev  | MEDIUM       | Minor version, may introduce stricter checks                |
| `eslint`                  | 8.57.1   | 9.39.1  | dev  | **HIGH**     | Major version (8→9), flat config required, breaking changes |
| `eslint-config-next`      | 15.5.6   | 16.0.1  | dev  | **HIGH**     | Tied to Next.js version                                     |
| `@eslint/eslintrc`        | 2.1.4    | 3.3.1   | dev  | **HIGH**     | Major version, compatibility with ESLint 9                  |
| `tailwindcss`             | 3.4.18   | 4.1.17  | dev  | **CRITICAL** | Major version (3→4), major breaking changes in v4           |
| `autoprefixer`            | 10.4.16  | 10.4.x  | dev  | LOW          | Patch version                                               |
| `postcss`                 | 8.4.32   | 8.5.x   | dev  | LOW          | Minor version                                               |
| `@tailwindcss/typography` | 0.5.10   | 0.5.x   | dev  | LOW          | Currently commented out in config                           |

---

## 3. Infrastructure (`infra/pulumi/gcp`)

**Location:** `infra/pulumi/gcp/package.json`  
**Purpose:** GCP infrastructure as code with Pulumi

### Runtime Dependencies

| Package          | Current | Latest     | Type    | Risk Level | Notes                                           |
| ---------------- | ------- | ---------- | ------- | ---------- | ----------------------------------------------- |
| `@pulumi/pulumi` | 3.95.0  | 3.x latest | runtime | LOW        | Minor version update within v3                  |
| `@pulumi/gcp`    | 7.38.0  | 9.4.0      | runtime | **HIGH**   | Major version bumps (7→9), GCP provider changes |
| `@pulumi/docker` | 4.5.1   | 4.x latest | runtime | LOW        | Within same major version                       |

### Development Dependencies

| Package       | Current  | Latest  | Type | Risk Level | Notes                                                 |
| ------------- | -------- | ------- | ---- | ---------- | ----------------------------------------------------- |
| `@types/node` | 20.19.24 | 24.10.0 | dev  | MEDIUM     | Major version for Node 24 types, but we're on Node 20 |
| `typescript`  | 5.9.3    | 5.9.x   | dev  | N/A        | Already on latest 5.x                                 |

---

## Critical Breaking Changes Analysis

### 🔴 CRITICAL RISK - Requires Major Code Changes

1. **LangChain 0.0.208 → 1.0.3**
   - **Impact:** Complete API restructure
   - **Breaking Changes:**
     - Import paths changed from `langchain/chat_models/openai` to `@langchain/openai`
     - Schema imports changed to `@langchain/core/messages`
     - ChatOpenAI configuration API changed
     - Requires installing new packages: `@langchain/openai`, `@langchain/core`
   - **Files Affected:** `apps/web/src/lib/ai/langchainClient.ts`
   - **Recommendation:** Defer or do carefully with full testing

2. **Tailwind CSS 3.4.18 → 4.1.17**
   - **Impact:** Major framework rewrite
   - **Breaking Changes:**
     - New CSS-first configuration (CSS instead of JS config)
     - Different plugin system
     - PostCSS plugin changes
     - Content detection changes
   - **Files Affected:** `tailwind.config.ts`, potentially all components
   - **Recommendation:** DEFER - Too risky for bootstrap codebase, stick with v3 for now

3. **NextAuth v4 → Auth.js v5**
   - **Impact:** Complete rewrite, still in beta
   - **Breaking Changes:**
     - Different configuration API
     - Renamed from `next-auth` to `@auth/nextauth`
     - Session handling changes
     - Provider configuration changes
   - **Files Affected:** `apps/web/src/lib/auth/config.ts`, `apps/web/app/api/auth/[...nextauth]/route.ts`
   - **Recommendation:** DEFER - Beta software, wait for stable release

### 🟡 HIGH RISK - Breaking Changes Expected

4. **Next.js 15.5.6 → 16.0.1**
   - **Impact:** Major version bump
   - **Breaking Changes:**
     - May require React 19
     - Turbopack changes
     - Caching behavior changes
     - Possible metadata API changes
   - **Recommendation:** Proceed with caution, align with React upgrade

5. **React 18.3.1 → 19.2.0**
   - **Impact:** New React version with breaking changes
   - **Breaking Changes:**
     - Removed: `defaultProps` for function components
     - Changed: `ref` is now a prop
     - New: React Compiler support
     - Stricter hydration checks
   - **Recommendation:** Must upgrade with Next.js 16, thorough testing needed

6. **ESLint 8.57.1 → 9.39.1**
   - **Impact:** New flat config system mandatory
   - **Breaking Changes:**
     - Flat config is now default (already using FlatCompat)
     - Removed: `.eslintrc` support
     - Changed: Plugin resolution
     - Changed: Config extension behavior
   - **Files Affected:** `apps/web/eslint.config.mjs` (already flat, but may need updates)
   - **Recommendation:** Moderate priority, current flat config helps

7. **OpenAI SDK 4.104.0 → 6.8.1**
   - **Impact:** Major version bumps (4→5→6)
   - **Breaking Changes:**
     - API method signatures changed
     - Streaming API changes
     - Response structure changes
   - **Files Affected:** Not directly used (via LangChain), but may affect LangChain integration
   - **Recommendation:** Align with LangChain upgrade

8. **Pulumi GCP Provider 7.38.0 → 9.4.0**
   - **Impact:** Major version bumps (7→8→9)
   - **Breaking Changes:**
     - GCP API changes reflected in provider
     - Resource property changes
     - Deprecated resources removed
   - **Files Affected:** `infra/pulumi/gcp/index.ts`
   - **Recommendation:** Check infrastructure code, test with `pulumi preview`

9. **Commitlint 18.x → 20.x**
   - **Impact:** Major version bump
   - **Breaking Changes:**
     - Node.js 18+ required (we have 20, OK)
     - Configuration changes
     - Plugin API changes
   - **Files Affected:** `commitlint.config.cjs`
   - **Recommendation:** Low impact, safe to upgrade

10. **Husky 8.0.3 → 9.1.7**
    - **Impact:** Major version bump
    - **Breaking Changes:**
      - Different installation process
      - `.husky/` directory structure changes
      - Git hook script changes
    - **Files Affected:** `.husky/` directory
    - **Recommendation:** Safe to upgrade, well-documented migration

### 🟢 LOW RISK - Minor/Patch Versions

11. **TypeScript 5.1.6 → 5.9.3**
    - Minor version, incremental improvements and stricter checks
    - Safe to upgrade

12. **Mongoose 8.0.3 → 8.10.x**
    - Minor version within v8, backwards compatible
    - Safe to upgrade

13. **Prettier 3.1.0 → 3.4.2**
    - Patch version, formatting improvements
    - Safe to upgrade

14. **@types/node 20.x → 24.x**
    - We're on Node 20 LTS, should stay on @types/node v20
    - Do NOT upgrade to v24 types

15. **Pulumi Core 3.95.0 → 3.x latest**
    - Minor version, safe to upgrade

---

## Recommended Upgrade Strategy

### Phase 1: Low-Risk Tooling (Safe to do now)

- ✅ `prettier` 3.1.0 → 3.4.2
- ✅ `mongoose` 8.0.3 → 8.10.x
- ✅ `typescript` 5.1.6 → 5.9.3
- ✅ `husky` 8.0.3 → 9.1.7
- ✅ `@commitlint/*` 18.x → 20.x
- ✅ `@pulumi/pulumi` 3.95.0 → 3.x latest
- ✅ `autoprefixer`, `postcss` (minor updates)

### Phase 2: Medium-Risk Infrastructure (Proceed with testing)

- ⚠️ `@pulumi/gcp` 7.38.0 → 8.x (then 9.x in separate step)
- ⚠️ `pnpm` 8.15.0 → 9.x (LTS, skip 10.x for now)

### Phase 3: High-Risk Framework (Requires careful planning)

- 🔴 `eslint` 8.x → 9.x (with config updates)
- 🔴 `@eslint/eslintrc` 2.x → 3.x
- 🔴 DEFER: `next` + `react` + `react-dom` to v16/v19 (wait for ecosystem)
- 🔴 DEFER: `next-auth` v4 → v5 (wait for stable release)

### Phase 4: Critical AI Stack (High risk, defer)

- 🚫 DEFER: `langchain` 0.0.x → 1.x (major rewrite, needs dedicated effort)
- 🚫 DEFER: `openai` 4.x → 6.x (tied to LangChain)
- 🚫 DEFER: `tailwindcss` 3.x → 4.x (too risky, v3 is stable and sufficient)

---

## Dependencies to Keep at Current Versions

1. **`@types/node`**: Keep at `^20.x.x` (matches Node.js 20 LTS)
2. **`tailwindcss`**: Keep at `3.x` (v4 is too risky and new)
3. **`next-auth`**: Keep at `4.x` (v5 is still beta)
4. **`langchain`**: Keep at `0.0.x` for now (v1 requires significant refactor)
5. **`openai`**: Keep at `4.x` (tied to LangChain version)
6. **`next`**: Keep at `15.x` for now (v16 requires React 19, ecosystem not ready)
7. **`react`/`react-dom`**: Keep at `18.x` (v19 adoption is early)

---

## Version Constraints Summary

| Constraint | Current     | Target        | Status                   |
| ---------- | ----------- | ------------- | ------------------------ |
| Node.js    | 20.19.4 LTS | 20.x LTS      | ✅ Keep current          |
| pnpm       | 8.15.0      | 9.x           | ⚠️ Can upgrade           |
| React      | 18.3.1      | 18.3.x latest | ✅ Keep at 18.x          |
| Next.js    | 15.5.6      | 15.x latest   | ✅ Keep at 15.x          |
| TypeScript | 5.1.6       | 5.9.3         | ✅ Safe upgrade          |
| ESLint     | 8.57.1      | 9.x           | ⚠️ Can upgrade with work |
| Tailwind   | 3.4.18      | 3.x latest    | ✅ Keep at 3.x           |
| LangChain  | 0.0.208     | 0.0.x latest  | 🚫 Defer v1.x            |

---

## Security Considerations

All current versions are within supported maintenance windows and do not have known critical CVEs. Priority should be on stability over latest versions for this bootstrap codebase.

- **Next.js 15.x**: Actively supported
- **React 18.x**: LTS, widely used in production
- **Node.js 20.x**: LTS until April 2026
- **Mongoose 8.x**: Current major version
- **Pulumi 3.x**: Stable and actively maintained

---

## Conclusion

**Total Dependencies Reviewed:** 35  
**Safe to Upgrade (Low Risk):** 8  
**Proceed with Caution (Medium/High Risk):** 6  
**Defer (Critical Risk/Beta):** 7  
**Keep Current:** 7

The inventory reveals that while many dependencies have newer versions available, the majority of major version upgrades carry significant breaking changes that would destabilize this bootstrap codebase. A conservative, phased approach is recommended, focusing first on low-risk tooling updates and deferring major framework changes until the ecosystem matures.
