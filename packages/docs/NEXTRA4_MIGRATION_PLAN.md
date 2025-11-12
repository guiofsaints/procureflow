# Nextra 4 Migration Plan

**Project**: ProcureFlow Documentation Site  
**Package**: packages/docs  
**Current Version**: Nextra 2.13.4 + Next.js 14.2.33 + React 18.3.1  
**Target Version**: Nextra 4.6.0 + Next.js 16.0.1 + React 19.2.0  
**Date**: 2025-11-12  
**Status**: Planning Phase

---

## Executive Summary

This document outlines a comprehensive, phased migration from Nextra 2 (Pages Router) to Nextra 4 (App Router). The migration involves:

- **8 packages** requiring major version updates
- **Architectural shift** from Pages Router to App Router
- **32 .mdx content files** to be migrated
- **8 _meta.json navigation files** to convert to _meta.js (ES modules)
- **Configuration rewrites** for next.config.mjs and theme configuration
- **New search engine** setup with Pagefind

**Risk Level**: HIGH (major architectural changes, no official migration guide from v2)  
**Estimated Complexity**: 8-10 hours (testing included)  
**Rollback Strategy**: Git tag + branch isolation

---

## Current State Analysis

### Dependency Versions

| Package | Current | Target | Delta | Breaking Changes |
|---------|---------|--------|-------|------------------|
| nextra | 2.13.4 | 4.6.0 | +2 major | Pages→App Router, theme.config removed |
| nextra-theme-docs | 2.13.4 | 4.6.0 | +2 major | Component API changes, layout props |
| next | 14.2.33 | 16.0.1 | +2 major | App Router enhancements, Turbopack |
| react | 18.3.1 | 19.2.0 | +1 major | React Compiler, server components |
| react-dom | 18.3.1 | 19.2.0 | +1 major | RSC improvements |
| @types/react | 18.3.26 | 19.2.3 | +1 major | React 19 types |
| @types/react-dom | 18.3.7 | 19.2.3 | +1 major | React 19 types |
| @types/node | 20.19.25 | 24.10.1 | +4 major | Node.js 24 types |

### File Inventory

**Configuration Files** (4):
- `package.json` - Scripts and dependencies
- `next.config.mjs` - Nextra plugin configuration (NEEDS REWRITE)
- `theme.config.tsx` - Theme options (WILL BE REMOVED)
- `tsconfig.json` - TypeScript config (moduleResolution change needed)

**Navigation Files** (8):
- Root `_meta.json` (9 sections)
- `prd/_meta.json`, `tech/_meta.json`, `tech/c4/_meta.json`
- `openapi/_meta.json`, `testing/_meta.json`
- `operations/_meta.json`, `runbooks/_meta.json`
- **All need conversion to _meta.js with ES module exports**

**Content Files** (32 .mdx):
- Main: index, contributing, glossary, references
- PRD section: 5 pages
- Tech section: 7 pages (includes C4 diagrams)
- OpenAPI section: 3 pages
- Testing section: 3 pages
- Operations section: 4 pages
- Runbooks section: 6 pages

**Script Files** (2):
- `scripts/lint-mdx.ts` - MDX linter (compatible)
- `scripts/fix-mdx.ts` - MDX auto-fixer (compatible)

---

## Breaking Changes Analysis

### 1. Pages Router → App Router (CRITICAL)

**Impact**: Complete file structure reorganization

**Current Structure**:
```
pages/
  _meta.json
  index.mdx
  prd/
    _meta.json
    index.mdx
    ...
  tech/
    ...
```

**Target Structure (Content Directory Convention)**:
```
app/
  [[...mdxPath]]/
    page.jsx          # Catch-all route (gateway to content/)
  layout.jsx          # Root layout with <Layout>, <Navbar>, <Footer>
  mdx-components.jsx  # Global MDX components
content/
  _meta.js            # ES module exports
  index.mdx
  prd/
    _meta.js
    index.mdx
    ...
  tech/
    ...
```

**Migration Steps**:
1. Create `app/` directory
2. Create `app/[[...mdxPath]]/page.jsx` catch-all route
3. Create `app/layout.jsx` with Nextra theme components
4. Rename `pages/` → `content/`
5. Convert all `_meta.json` → `_meta.js`

### 2. theme.config.tsx Removal (CRITICAL)

**Impact**: All theme configuration must move to layout props

**Current** (`theme.config.tsx`):
```tsx
export default {
  logo: <span>ProcureFlow Docs</span>,
  project: {
    link: 'https://github.com/guiofsaints/procureflow'
  },
  docsRepositoryBase: '...',
  footer: { text: '© 2025 ...' },
  sidebar: { defaultMenuCollapseLevel: 1 },
  // ... many other options
}
```

**Target** (`app/layout.jsx`):
```jsx
import { Layout, Navbar, Footer } from 'nextra-theme-docs'
import { Head, Banner } from 'nextra/components'
import { getPageMap } from 'nextra/page-map'
import 'nextra-theme-docs/style.css'

export const metadata = {
  title: 'ProcureFlow Documentation',
  description: '...'
}

export default async function RootLayout({ children }) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <Head />
      <body>
        <Layout
          navbar={<Navbar logo={<b>ProcureFlow</b>} projectLink="..." />}
          footer={<Footer>© 2025 ...</Footer>}
          pageMap={await getPageMap()}
          docsRepositoryBase="..."
          sidebar={{ defaultMenuCollapseLevel: 1 }}
          editLink="Edit on GitHub"
        >
          {children}
        </Layout>
      </body>
    </html>
  )
}
```

**Migration Table**:

| theme.config Option | Nextra 4 Location |
|---------------------|-------------------|
| `logo` | `logo` prop in `<Navbar>` |
| `project.link` | `projectLink` prop in `<Navbar>` |
| `project.icon` | `projectIcon` prop in `<Navbar>` |
| `docsRepositoryBase` | `docsRepositoryBase` prop in `<Layout>` |
| `editLink.content` | `editLink` prop in `<Layout>` |
| `footer.content` | `children` prop in `<Footer>` |
| `sidebar.*` | `sidebar` prop in `<Layout>` |
| `navigation` | `navigation` prop in `<Layout>` |
| `darkMode` | `darkMode` prop in `<Layout>` |
| `nextThemes` | `nextThemes` prop in `<Layout>` |
| `head` | **REMOVED** - Use Next.js Metadata API |
| `direction` | **REMOVED** - Use `dir` attribute on `<html>` |

### 3. next.config.mjs Changes (HIGH)

**Current**:
```js
import nextra from 'nextra'

const withNextra = nextra({
  theme: 'nextra-theme-docs',
  themeConfig: './theme.config.tsx'
})

export default withNextra({
  output: 'export',
  images: { unoptimized: true },
  basePath: '',
  trailingSlash: false
})
```

**Target**:
```js
import nextra from 'nextra'

const withNextra = nextra({
  // NO theme or themeConfig options
  // Optional: contentDirBasePath: '/docs' if needed
})

export default withNextra({
  output: 'export',
  images: { unoptimized: true },
  basePath: '',
  trailingSlash: false
})
```

**Changes**:
- Remove `theme` option (now via imports in layout.jsx)
- Remove `themeConfig` option (now props in layout.jsx)
- Optional: Add `contentDirBasePath` if serving from subdirectory

### 4. _meta.json → _meta.js Conversion (HIGH)

**Current** (JSON):
```json
{
  "index": "Overview",
  "prd": {
    "title": "Product Requirements",
    "type": "page"
  },
  "tech": {
    "title": "Technical Architecture",
    "type": "page"
  }
}
```

**Target** (ES module):
```js
export default {
  index: 'Overview',
  prd: {
    title: 'Product Requirements',
    type: 'page'
  },
  tech: {
    title: 'Technical Architecture',
    type: 'page'
  }
}
```

**Changes**:
- Rename `.json` → `.js`
- Add `export default` statement
- Keep same structure
- Can now use dynamic JavaScript (e.g., functions, computed values)

### 5. New Search Engine - Pagefind (MEDIUM)

**Impact**: FlexSearch → Pagefind, requires build-time indexing

**Installation**:
```bash
pnpm add -D pagefind
```

**Setup Steps**:
1. Add `postbuild` script: `"postbuild": "pagefind --site out --output-path out/_pagefind"`
2. Add `_pagefind/` to `.gitignore`
3. Enable pre/post scripts in `.npmrc`: `enable-pre-post-scripts=true`
4. Import `<Search>` from `nextra/components` in layout

**Benefits**:
- Rust-powered (faster)
- Better search results
- Indexes remote MDX
- Indexes dynamic content
- Indexes imported components

### 6. TypeScript Configuration (LOW)

**Current** (`tsconfig.json`):
```json
{
  "compilerOptions": {
    "moduleResolution": "node"
  }
}
```

**Target**:
```json
{
  "compilerOptions": {
    "moduleResolution": "bundler"
  }
}
```

**Reason**: Nextra 4 packages removed `"typesVersions"` field, requires bundler resolution.

### 7. MDX Syntax Updates (LOW)

**Likely Compatible** (no changes expected):
- Frontmatter
- Mermaid diagrams
- Code blocks
- Tables (already fixed ISO dates)
- Callouts/Admonitions

**Potentially Breaking**:
- `import` statements (verify paths work)
- Custom components (check if need updating)
- HTML-like syntax (already fixed with lint-mdx)

---

## Migration Phases

### Phase 0: Pre-Migration Safety

**Objective**: Create safety net and document current state

**Tasks**:
1. Commit all current changes: `git add . && git commit -m "docs: pre-nextra4 migration state"`
2. Create safety tag: `git tag nextra-2.13.4-working`
3. Create migration branch: `git checkout -b feat/nextra-4-migration`
4. Backup current dev server state: Take screenshots of:
   - Homepage
   - Navigation structure
   - Search functionality
   - Any custom styled pages
5. Document custom configuration:
   - Review `theme.config.tsx` for custom options
   - Note any custom CSS in globals.css
   - List any modified Nextra components

**Validation**:
- [ ] Git tag created
- [ ] Migration branch active
- [ ] Screenshots saved
- [ ] Configuration documented

**Rollback**: `git checkout main && git branch -D feat/nextra-4-migration`

---

### Phase 1: Update React Ecosystem

**Objective**: Update React and related packages first (smaller change)

**Dependency Changes**:
```json
{
  "react": "^19.2.0",
  "react-dom": "^19.2.0"
}
```

**Dev Dependency Changes**:
```json
{
  "@types/react": "^19.2.3",
  "@types/react-dom": "^19.2.3"
}
```

**Commands**:
```bash
cd c:\Workspace\procureflow\packages\docs
pnpm add react@^19.2.0 react-dom@^19.2.0
pnpm add -D @types/react@^19.2.3 @types/react-dom@^19.2.3
```

**Testing**:
```bash
pnpm dev  # Should still work with Nextra 2 + React 19
```

**Expected Warnings**:
- Possible peer dependency warnings (ignore for now)
- React 19 deprecation notices (normal)

**Validation**:
- [ ] Packages installed successfully
- [ ] `pnpm dev` starts without errors
- [ ] Site loads at http://localhost:3001
- [ ] No runtime errors in browser console
- [ ] TypeScript compilation succeeds

**Rollback**: `git checkout package.json pnpm-lock.yaml && pnpm install`

---

### Phase 2: Update Next.js

**Objective**: Upgrade Next.js incrementally (14→15→16)

**Step 2a: Next.js 14 → 15**

```bash
pnpm add next@^15
```

Test:
```bash
pnpm dev
```

**Step 2b: Next.js 15 → 16**

```bash
pnpm add next@^16.0.1
```

Test:
```bash
pnpm dev
```

**Known Issues**:
- Nextra 2 may break with Next.js 16 (expected)
- Pages Router deprecation warnings (expected)
- If dev server fails: **NORMAL** - proceed to Phase 3

**Validation**:
- [ ] Next.js 16.0.1 installed
- [ ] `pnpm install` completes
- [ ] Ready to install Nextra 4

**Rollback**: `git checkout package.json pnpm-lock.yaml && pnpm install`

---

### Phase 3: Update Node Types

**Objective**: Update Node.js type definitions

```bash
pnpm add -D @types/node@^24.10.1
```

**Testing**:
```bash
pnpm build  # TypeScript compilation
```

**Validation**:
- [ ] Types installed
- [ ] No TypeScript errors in project files

**Rollback**: `git checkout package.json pnpm-lock.yaml && pnpm install`

---

### Phase 4: Install Nextra 4

**Objective**: Update Nextra core packages

**Dependency Changes**:
```json
{
  "nextra": "^4.6.0",
  "nextra-theme-docs": "^4.6.0"
}
```

**Dev Dependency Changes**:
```json
{
  "pagefind": "^1.0.0"
}
```

**Commands**:
```bash
pnpm add nextra@^4.6.0 nextra-theme-docs@^4.6.0
pnpm add -D pagefind
```

**Expected State**:
- Dev server WILL NOT work yet (missing app/ directory)
- Build WILL fail (missing configuration)
- **THIS IS EXPECTED** - proceed to Phase 5

**Validation**:
- [ ] Nextra 4.6.0 installed
- [ ] nextra-theme-docs 4.6.0 installed
- [ ] pagefind installed
- [ ] No installation errors

**Rollback**: `git checkout package.json pnpm-lock.yaml && pnpm install`

---

### Phase 5: Create App Router Structure

**Objective**: Convert from Pages Router to App Router with Content Directory Convention

**Task 5a: Rename pages → content**

```bash
cd c:\Workspace\procureflow\packages\docs
mv pages content
```

**Task 5b: Create app/ directory structure**

```bash
mkdir app
mkdir "app\[[...mdxPath]]"
```

**Task 5c: Create catch-all route handler**

Create `app/[[...mdxPath]]/page.jsx`:
```jsx
import { notFound } from 'next/navigation'
import { compileMdx } from 'nextra/compile'
import { evaluate } from 'nextra/mdx-remote'
import { existsSync, readFileSync } from 'fs'
import { join } from 'path'

// This is the catch-all route for MDX files in content/ directory
export default async function Page({ params }) {
  const { mdxPath = [] } = await params
  const pagePath = mdxPath.join('/') || 'index'
  
  // Try to load the MDX file from content/
  const filePath = join(process.cwd(), 'content', `${pagePath}.mdx`)
  
  if (!existsSync(filePath)) {
    notFound()
  }
  
  const source = readFileSync(filePath, 'utf8')
  const { result } = await evaluate(source)
  
  return result
}

// Generate static params for all MDX files (for static export)
export async function generateStaticParams() {
  // This will be populated by Nextra's page map
  return []
}
```

**Task 5d: Create root layout**

Create `app/layout.jsx`:
```jsx
import { Footer, Layout, Navbar } from 'nextra-theme-docs'
import { Head } from 'nextra/components'
import { getPageMap } from 'nextra/page-map'
import 'nextra-theme-docs/style.css'

export const metadata = {
  title: {
    default: 'ProcureFlow Documentation',
    template: '%s | ProcureFlow Docs'
  },
  description: 'AI-native procurement platform - Complete technical documentation',
  openGraph: {
    title: 'ProcureFlow Documentation',
    description: 'AI-native procurement platform - Complete technical documentation',
    type: 'website',
    locale: 'en_US'
  }
}

const navbar = (
  <Navbar
    logo={<span style={{ fontWeight: 700 }}>ProcureFlow Docs</span>}
    projectLink="https://github.com/guiofsaints/procureflow"
  />
)

const footer = (
  <Footer className="flex-col items-center md:items-start">
    MIT {new Date().getFullYear()} © ProcureFlow.
  </Footer>
)

export default async function RootLayout({ children }) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <Head />
      <body>
        <Layout
          navbar={navbar}
          footer={footer}
          pageMap={await getPageMap()}
          docsRepositoryBase="https://github.com/guiofsaints/procureflow/tree/main/packages/docs"
          editLink="Edit this page on GitHub"
          sidebar={{
            defaultMenuCollapseLevel: 1,
            toggleButton: true
          }}
        >
          {children}
        </Layout>
      </body>
    </html>
  )
}
```

**Validation**:
- [ ] `content/` directory exists (renamed from pages/)
- [ ] `app/` directory created
- [ ] `app/[[...mdxPath]]/page.jsx` created
- [ ] `app/layout.jsx` created
- [ ] File structure matches Nextra 4 convention

**Rollback**: `mv content pages && rm -rf app`

---

### Phase 6: Convert _meta.json → _meta.js

**Objective**: Convert all 8 navigation files to ES module format

**Files to Convert**:
1. `content/_meta.json` → `content/_meta.js`
2. `content/prd/_meta.json` → `content/prd/_meta.js`
3. `content/tech/_meta.json` → `content/tech/_meta.js`
4. `content/tech/c4/_meta.json` → `content/tech/c4/_meta.js`
5. `content/openapi/_meta.json` → `content/openapi/_meta.js`
6. `content/testing/_meta.json` → `content/testing/_meta.js`
7. `content/operations/_meta.json` → `content/operations/_meta.js`
8. `content/runbooks/_meta.json` → `content/runbooks/_meta.js`

**Conversion Pattern**:

**Before** (`_meta.json`):
```json
{
  "index": "Overview",
  "prd": "Product Requirements"
}
```

**After** (`_meta.js`):
```js
export default {
  index: 'Overview',
  prd: 'Product Requirements'
}
```

**PowerShell Conversion Script**:
```powershell
# Run from packages/docs directory
Get-ChildItem -Path content -Filter "_meta.json" -Recurse | ForEach-Object {
    $jsonPath = $_.FullName
    $jsPath = $jsonPath -replace '\.json$', '.js'
    
    # Read JSON content
    $content = Get-Content $jsonPath -Raw | ConvertFrom-Json
    
    # Convert to JS export
    $jsContent = "export default " + ($content | ConvertTo-Json -Depth 10) + "`n"
    
    # Write JS file
    Set-Content -Path $jsPath -Value $jsContent
    
    # Remove JSON file
    Remove-Item $jsonPath
    
    Write-Host "Converted: $jsonPath -> $jsPath"
}
```

**Manual Conversion** (if script fails):
For each file, copy JSON content, create .js file, wrap in `export default { ... }`

**Validation**:
- [ ] All 8 _meta.js files created
- [ ] All 8 _meta.json files deleted
- [ ] Syntax is valid JavaScript
- [ ] No JSON parse errors

**Rollback**: `git checkout content/**/_meta.json && rm content/**/_meta.js`

---

### Phase 7: Update next.config.mjs

**Objective**: Remove theme.config references, update to Nextra 4 API

**Current Content**:
```js
import nextra from 'nextra'

const withNextra = nextra({
  theme: 'nextra-theme-docs',
  themeConfig: './theme.config.tsx'
})

export default withNextra({
  output: 'export',
  images: { unoptimized: true },
  basePath: '',
  trailingSlash: false
})
```

**New Content**:
```js
import nextra from 'nextra'

const withNextra = nextra({
  // No theme or themeConfig options in Nextra 4
})

export default withNextra({
  output: 'export',
  images: { unoptimized: true },
  basePath: '',
  trailingSlash: false
})
```

**Validation**:
- [ ] `theme` option removed
- [ ] `themeConfig` option removed
- [ ] Next.js config options preserved (output, images, etc.)

**Rollback**: `git checkout next.config.mjs`

---

### Phase 8: Create mdx-components.jsx

**Objective**: Configure global MDX components (Nextra 4 requirement)

**Create File**: `mdx-components.jsx` (in root of packages/docs)

**Content**:
```jsx
import { useMDXComponents as getDocsMDXComponents } from 'nextra-theme-docs'

const docsComponents = getDocsMDXComponents()

export function useMDXComponents(components) {
  return {
    ...docsComponents,
    ...components
    // Add custom components here if needed
  }
}
```

**Validation**:
- [ ] File created in correct location (packages/docs/mdx-components.jsx)
- [ ] Exports `useMDXComponents` function
- [ ] Imports from `nextra-theme-docs`

**Rollback**: `rm mdx-components.jsx`

---

### Phase 9: Remove theme.config.tsx

**Objective**: Delete obsolete configuration file (all options moved to layout.jsx)

**Command**:
```bash
rm theme.config.tsx
```

**Verification**:
- Check that all theme.config options were migrated to app/layout.jsx
- Review Phase 5d layout.jsx creation to confirm coverage

**Validation**:
- [ ] theme.config.tsx deleted
- [ ] All options migrated to layout.jsx

**Rollback**: `git checkout theme.config.tsx`

---

### Phase 10: Setup Pagefind Search

**Objective**: Configure Rust-powered search engine

**Task 10a: Update package.json scripts**

Add/modify scripts:
```json
{
  "scripts": {
    "dev": "next dev --port 3001",
    "build": "next build",
    "postbuild": "pagefind --site out --output-path out/_pagefind",
    "start": "next start",
    "export": "next build && next export",
    "lint": "next lint",
    "lint:mdx": "tsx scripts/lint-mdx.ts",
    "fix:mdx": "tsx scripts/fix-mdx.ts"
  }
}
```

**Task 10b: Update .gitignore**

Add:
```
_pagefind/
out/_pagefind/
```

**Task 10c: Enable pre/post scripts**

Create/update `.npmrc`:
```
enable-pre-post-scripts=true
```

**Task 10d: Add Search component to layout**

Update `app/layout.jsx` to import and use `<Search>`:
```jsx
import { Search } from 'nextra/components'

// In Layout component:
<Layout
  navbar={navbar}
  search={
    <Search
      placeholder="Search documentation..."
      loading="Loading..."
      emptyResult="No results found."
      errorText="Failed to load search index."
    />
  }
  // ... other props
>
```

**Validation**:
- [ ] postbuild script added
- [ ] _pagefind/ in .gitignore
- [ ] .npmrc has enable-pre-post-scripts=true
- [ ] Search component in layout.jsx

**Rollback**: `git checkout package.json .gitignore .npmrc app/layout.jsx`

---

### Phase 11: Update tsconfig.json

**Objective**: Fix TypeScript module resolution for Nextra 4

**Current**:
```json
{
  "compilerOptions": {
    "moduleResolution": "node"
  }
}
```

**New**:
```json
{
  "compilerOptions": {
    "moduleResolution": "bundler"
  }
}
```

**Reason**: Nextra 4 packages removed `typesVersions` field, requires bundler resolution mode.

**Validation**:
- [ ] moduleResolution changed to "bundler"
- [ ] No TypeScript errors in project

**Testing**:
```bash
pnpm build  # Should compile TypeScript
```

**Rollback**: `git checkout tsconfig.json`

---

### Phase 12: Validate MDX Files

**Objective**: Ensure all 32 MDX files are compatible with Nextra 4

**Task 12a: Run MDX linter**

```bash
pnpm lint:mdx
```

**Expected**: No issues (we already fixed ISO dates and HTML-like patterns)

**Task 12b: Check for breaking patterns**

Review any Nextra 2-specific syntax:
- [ ] No direct `import { useConfig } from 'nextra-theme-docs/config'` (removed)
- [ ] No `import { useRouter } from 'nextra/hooks'` (use `next/navigation`)
- [ ] Verify all relative links work with new structure
- [ ] Check if custom components need updates

**Task 12c: Update frontmatter (if needed)**

Nextra 4 frontmatter changes:
- `title` and `description` are now used for metadata
- No breaking changes expected, but verify

**Validation**:
- [ ] lint:mdx passes with no errors
- [ ] No Nextra 2-specific imports found
- [ ] Frontmatter is compatible

**Rollback**: `git checkout content/**/*.mdx`

---

### Phase 13: First Build Attempt

**Objective**: Build the site and identify remaining issues

**Command**:
```bash
pnpm build
```

**Expected Issues**:
1. **Missing catch-all implementation**: May need to update `app/[[...mdxPath]]/page.jsx`
2. **Page map errors**: Check getPageMap() usage
3. **Component import errors**: Verify all Nextra component imports
4. **Type errors**: Check TypeScript compilation

**Troubleshooting**:

**Issue**: "Cannot find module 'nextra/components'"
**Fix**: Check tsconfig.json moduleResolution is "bundler"

**Issue**: "Page map is undefined"
**Fix**: Verify content/ directory structure, check _meta.js files

**Issue**: "Layout not found"
**Fix**: Verify app/layout.jsx exists and exports default function

**Validation**:
- [ ] Build completes without errors
- [ ] Static files generated in `out/` directory
- [ ] No TypeScript errors
- [ ] No Next.js build errors

**Rollback**: Full rollback if build fails - see Phase 14

---

### Phase 14: Test Dev Server

**Objective**: Verify site works in development mode

**Command**:
```bash
pnpm dev
```

**Testing Checklist**:
- [ ] Server starts at http://localhost:3001
- [ ] Homepage loads
- [ ] Navigation sidebar renders
- [ ] All 9 sections visible in sidebar
- [ ] Can navigate between pages
- [ ] Mermaid diagrams render
- [ ] Code blocks have syntax highlighting
- [ ] Tables render correctly
- [ ] No console errors

**Common Issues**:

**Issue**: White screen / React errors
**Check**: Browser console for component errors, verify Layout props

**Issue**: Navigation not working
**Check**: _meta.js files, pageMap generation

**Issue**: Styles missing
**Check**: `import 'nextra-theme-docs/style.css'` in layout.jsx

**Validation**:
- [ ] Dev server runs without errors
- [ ] All pages accessible
- [ ] Navigation functional
- [ ] Styling applied correctly

**Rollback**: If critical issues, return to Phase 0 backup

---

### Phase 15: Test Search Functionality

**Objective**: Verify Pagefind search works

**Prerequisites**: Build must be completed (postbuild runs Pagefind)

**Steps**:
1. Run `pnpm build` (generates search index)
2. Check `out/_pagefind/` directory exists
3. Start dev server: `pnpm dev`
4. Click search input
5. Search for test terms:
   - "procurement" (should find catalog pages)
   - "OpenAPI" (should find API docs)
   - "deploy" (should find operations pages)
   - "Mermaid" (should find architecture diagrams)

**Validation**:
- [ ] Search modal opens
- [ ] Search returns relevant results
- [ ] Search is fast (<500ms)
- [ ] Results link to correct pages
- [ ] No console errors during search

**Issue**: Search not working
**Fix**: Verify postbuild script ran, check _pagefind/ directory exists

---

### Phase 16: Visual Regression Testing

**Objective**: Compare new site to screenshots from Phase 0

**Testing**:
1. Open new site at http://localhost:3001
2. Compare each page to Phase 0 screenshots
3. Verify:
   - [ ] Layout matches (header, sidebar, footer)
   - [ ] Styling is consistent
   - [ ] All content visible
   - [ ] Navigation structure identical
   - [ ] Mermaid diagrams render correctly
   - [ ] Code blocks styled properly
   - [ ] Tables formatted correctly

**Known Differences** (expected):
- Search UI may look different (Pagefind vs FlexSearch)
- Minor styling differences (Nextra 4 uses Tailwind CSS 4)
- Possible font rendering changes

**Action Items**:
- Document any significant visual differences
- Fix critical styling issues
- Accept minor cosmetic changes

**Validation**:
- [ ] Visual comparison complete
- [ ] No major regressions found
- [ ] Critical issues addressed

---

### Phase 17: Full Page Validation

**Objective**: Systematically test all 32 pages

**Test Matrix**:

| Section | Pages | Status | Issues |
|---------|-------|--------|--------|
| Main | index, contributing, glossary, references | [ ] | |
| PRD | index, objective, features, functional-requirements, non-functional-requirements | [ ] | |
| Tech | index, stack, patterns, infrastructure | [ ] | |
| Tech/C4 | context, container, component | [ ] | |
| OpenAPI | index, specification, generation-and-validation | [ ] | |
| Testing | index, layers-and-tooling, ci-gates | [ ] | |
| Operations | index, deploy, rollback, autoscaling | [ ] | |
| Runbooks | index, local-dev, build-and-deploy, rollback, autoscaling-check, troubleshooting | [ ] | |

**For Each Page**:
1. Navigate to page
2. Verify content renders
3. Check Mermaid diagrams (if present)
4. Verify code blocks
5. Test internal links
6. Check tables format correctly
7. Note any issues

**Validation**:
- [ ] All 32 pages tested
- [ ] All issues documented
- [ ] Critical issues fixed

---

### Phase 18: Link Validation

**Objective**: Verify all internal and external links work

**Internal Links**:
```bash
# Manual check of common link patterns
grep -r "\[.*\](\/" content/
grep -r "\[.*\](\.\./" content/
```

**Testing**:
- [ ] Sidebar navigation links work
- [ ] In-page anchor links work (#sections)
- [ ] Cross-page references work (../other-page)
- [ ] Breadcrumb navigation works
- [ ] External links open in new tab

**Tools** (optional):
- Use browser extension like "Check My Links"
- Or manual testing

**Validation**:
- [ ] No broken internal links
- [ ] External links functional
- [ ] Anchor links scroll correctly

---

### Phase 19: Performance Testing

**Objective**: Verify build performance and bundle size

**Metrics to Check**:

**Build Time**:
```bash
time pnpm build
```
- Target: <2 minutes

**Bundle Size**:
Check Next.js build output for "First Load JS":
- Target: <150 kB (Nextra 4 reduced bundle size)

**Page Load**:
- Test in browser DevTools Network tab
- Target: <2s for homepage

**Comparison** (Nextra 2 vs 4):
- Nextra 4 should be smaller and faster
- Document improvements

**Validation**:
- [ ] Build time acceptable
- [ ] Bundle size reduced
- [ ] Pages load quickly

---

### Phase 20: Static Export Testing

**Objective**: Verify static export works (for GitHub Pages)

**Command**:
```bash
pnpm build
```

**Checks**:
- [ ] `out/` directory created
- [ ] HTML files generated for all pages
- [ ] `_pagefind/` directory in `out/`
- [ ] Static assets copied
- [ ] No errors during export

**Test Static Files**:
```bash
# Serve static files locally
cd out
python -m http.server 8080
# Or use npx serve
npx serve
```

Open http://localhost:8080 and test:
- [ ] Site loads from static files
- [ ] Navigation works
- [ ] Search works (critical - Pagefind needs static files)
- [ ] All pages accessible

**Validation**:
- [ ] Static export successful
- [ ] Site fully functional from static files

---

### Phase 21: Create Migration Documentation

**Objective**: Document the migration for future reference

**Create File**: `NEXTRA4_MIGRATION_LOG.md`

**Content to Include**:
- Migration date
- Packages updated (with versions)
- Breaking changes encountered
- Issues found and solutions
- Time spent per phase
- Total migration time
- Rollback procedures tested
- Lessons learned

**Validation**:
- [ ] Migration log created
- [ ] All phases documented
- [ ] Issues recorded with solutions

---

### Phase 22: Final Validation & Scaffold Log

**Objective**: Complete final checks and create scaffold log

**Final Checklist**:
- [ ] All 32 pages render correctly
- [ ] All 9 navigation sections functional
- [ ] Search works and returns results
- [ ] Mermaid diagrams render
- [ ] Code blocks highlighted
- [ ] Tables formatted
- [ ] Links functional
- [ ] Build succeeds
- [ ] Static export works
- [ ] Dev server stable
- [ ] No console errors
- [ ] Performance acceptable

**Create Scaffold Log**: `docs.site.scaffold-log.md`

Content:
```markdown
# ProcureFlow Documentation Site - Scaffold Log

**Framework**: Nextra 4.6.0 + Next.js 16.0.1 + React 19.2.0
**Date Completed**: [DATE]
**Status**: ✅ Complete - Nextra 4 Migration Successful

## Files Created/Modified

### Configuration Files
- `app/layout.jsx` - Root layout with Nextra theme components
- `app/[[...mdxPath]]/page.jsx` - Catch-all route for content/
- `mdx-components.jsx` - Global MDX component configuration
- `next.config.mjs` - Updated for Nextra 4 API
- `tsconfig.json` - Changed moduleResolution to bundler
- `package.json` - Updated all dependencies to latest
- `.npmrc` - Enabled pre/post scripts
- `.gitignore` - Added _pagefind/ directory

### Navigation Files (8 total - converted JSON → JS)
- `content/_meta.js` - Root navigation (9 sections)
- `content/prd/_meta.js` - PRD section navigation
- `content/tech/_meta.js` - Tech section navigation
- `content/tech/c4/_meta.js` - C4 diagrams navigation
- `content/openapi/_meta.js` - OpenAPI section navigation
- `content/testing/_meta.js` - Testing section navigation
- `content/operations/_meta.js` - Operations section navigation
- `content/runbooks/_meta.js` - Runbooks section navigation

### Content Files (32 .mdx pages)
All pages migrated from pages/ to content/ directory:
- Main: index, contributing, glossary, references (4 pages)
- PRD: 5 pages (index, objective, features, functional-requirements, non-functional-requirements)
- Tech: 7 pages (index, stack, patterns, infrastructure, c4/context, c4/container, c4/component)
- OpenAPI: 3 pages (index, specification, generation-and-validation)
- Testing: 3 pages (index, layers-and-tooling, ci-gates)
- Operations: 4 pages (index, deploy, rollback, autoscaling)
- Runbooks: 6 pages (index, local-dev, build-and-deploy, rollback, autoscaling-check, troubleshooting)

### Scripts (preserved)
- `scripts/lint-mdx.ts` - MDX linter (compatible with Nextra 4)
- `scripts/fix-mdx.ts` - MDX auto-fixer (compatible with Nextra 4)

## Architecture Changes

### Pages Router → App Router
- Renamed `pages/` → `content/`
- Created `app/` directory with App Router structure
- Implemented catch-all route pattern for MDX rendering
- Moved theme configuration from theme.config.tsx to layout.jsx props

### Search Engine
- Migrated from FlexSearch to Pagefind (Rust-powered)
- Added postbuild script for search indexing
- Improved search performance and result quality

### Dependencies Updated
- nextra: 2.13.4 → 4.6.0 (+2 major)
- nextra-theme-docs: 2.13.4 → 4.6.0 (+2 major)
- next: 14.2.33 → 16.0.1 (+2 major)
- react: 18.3.1 → 19.2.0 (+1 major)
- react-dom: 18.3.1 → 19.2.0 (+1 major)
- @types/node: 20.19.25 → 24.10.1 (+4 major)
- @types/react: 18.3.26 → 19.2.3 (+1 major)
- @types/react-dom: 18.3.7 → 19.2.3 (+1 major)
- pagefind: ^1.0.0 (new)

## Migration Statistics
- Total files created: 3 (layout.jsx, page.jsx, mdx-components.jsx)
- Total files modified: 5 (package.json, next.config.mjs, tsconfig.json, .npmrc, .gitignore)
- Total files converted: 8 (_meta.json → _meta.js)
- Total files deleted: 1 (theme.config.tsx)
- Total content files: 32 (all compatible, no changes needed)
- Migration time: [X hours]
- Build time: [X minutes]
- Bundle size improvement: [X%]

## Verification Checklist
✅ All 32 pages render correctly
✅ Navigation structure intact (9 sections)
✅ Search functionality working (Pagefind)
✅ Mermaid diagrams render
✅ Code syntax highlighting works
✅ Tables formatted correctly
✅ Internal links functional
✅ External links open in new tab
✅ Static export successful
✅ Dev server stable
✅ Build succeeds without errors
✅ TypeScript compilation passes
✅ No runtime console errors

## Known Issues
[Document any remaining issues or limitations]

## Rollback Procedure
Git tag created: `nextra-2.13.4-working`
Rollback command: `git checkout nextra-2.13.4-working`
```

**Validation**:
- [ ] Scaffold log created
- [ ] All sections complete
- [ ] Statistics accurate

---

## Risk Assessment Matrix

| Risk | Likelihood | Impact | Mitigation | Contingency |
|------|-----------|--------|------------|-------------|
| Build fails after Nextra 4 install | High | Critical | Phased migration, frequent testing | Git rollback to Phase 3 |
| MDX files incompatible | Low | High | Pre-migration linting, syntax validation | Manual fixes per file |
| _meta.js conversion errors | Medium | Medium | Automated script with validation | Manual conversion |
| Search not working | Medium | Medium | Follow Pagefind setup exactly | Disable search temporarily |
| TypeScript errors | Low | Medium | Update moduleResolution early | Rollback tsconfig.json |
| Performance regression | Low | Low | Bundle size monitoring | Profile and optimize |
| Visual regressions | Medium | Low | Screenshot comparison | CSS adjustments |

---

## Rollback Procedures

### Full Rollback (Return to Nextra 2)

**When to Use**: Critical failure, site completely broken

**Steps**:
```bash
# 1. Return to main branch
git checkout main

# 2. Delete migration branch
git branch -D feat/nextra-4-migration

# 3. Verify working state
pnpm dev

# 4. Confirm site loads at http://localhost:3001
```

**Validation**: Site returns to Nextra 2.13.4 working state

---

### Partial Rollback (Return to Specific Phase)

**When to Use**: Issue found in later phase, want to retry from earlier point

**Example** (rollback to Phase 5 - after creating app/ structure):

```bash
# 1. View commit history
git log --oneline

# 2. Find commit after Phase 5
git checkout <commit-hash>

# 3. Create new branch from that point
git checkout -b feat/nextra-4-migration-retry

# 4. Continue from next phase
```

---

### Dependency-Only Rollback

**When to Use**: Dependencies updated but file structure changes not started

```bash
# Rollback package.json and lock file
git checkout package.json pnpm-lock.yaml

# Reinstall previous versions
pnpm install

# Restart dev server
pnpm dev
```

---

## Success Criteria

### Minimum Viable Migration (MVM)

- [ ] Site builds without errors
- [ ] All 32 pages accessible
- [ ] Navigation functional
- [ ] Dev server stable
- [ ] Static export works

### Complete Success

- [ ] All MVM criteria met
- [ ] Search functional (Pagefind)
- [ ] Mermaid diagrams render
- [ ] No visual regressions
- [ ] Performance improved
- [ ] Bundle size reduced
- [ ] All links working
- [ ] Documentation complete

---

## Timeline Estimate

| Phase | Description | Estimated Time |
|-------|-------------|----------------|
| 0 | Pre-migration safety | 15 min |
| 1-3 | Dependency updates | 30 min |
| 4 | Install Nextra 4 | 10 min |
| 5 | Create app/ structure | 45 min |
| 6 | Convert _meta files | 30 min |
| 7-9 | Update config files | 30 min |
| 10 | Setup Pagefind | 20 min |
| 11 | Update tsconfig | 5 min |
| 12 | Validate MDX | 20 min |
| 13 | First build attempt | 15 min |
| 14 | Test dev server | 30 min |
| 15 | Test search | 15 min |
| 16-18 | Validation & testing | 90 min |
| 19-20 | Performance & export | 30 min |
| 21-22 | Documentation | 45 min |

**Total Estimated Time**: 6-8 hours

**Actual Time**: [To be filled during migration]

---

## Key Resources

### Official Documentation
- Nextra 4 Blog Post: https://the-guild.dev/blog/nextra-4
- Nextra 4 Docs: https://nextra.site/docs
- Next.js App Router: https://nextjs.org/docs/app
- Pagefind Docs: https://pagefind.app/docs

### Migration Examples
- Nextra Docs Site: https://github.com/shuding/nextra/tree/main/examples/docs
- SWR Site (i18n): https://github.com/shuding/nextra/tree/main/examples/swr-site
- Blog Example: https://github.com/shuding/nextra/tree/main/examples/blog

### Troubleshooting
- Nextra GitHub Issues: https://github.com/shuding/nextra/issues
- Next.js Discord: https://nextjs.org/discord
- Nextra Discussions: https://github.com/shuding/nextra/discussions

---

## Post-Migration Tasks

### Immediate (same session)
- [ ] Merge migration branch to main
- [ ] Push to remote repository
- [ ] Deploy to GitHub Pages (test production)
- [ ] Verify deployed site functionality
- [ ] Update README with Nextra 4 info

### Short-term (within 1 week)
- [ ] Monitor for user-reported issues
- [ ] Test on multiple browsers
- [ ] Test on mobile devices
- [ ] Optimize search index (if needed)
- [ ] Add more documentation pages (if planned)

### Long-term (ongoing)
- [ ] Keep dependencies updated
- [ ] Monitor Nextra 4 releases
- [ ] Leverage new Nextra 4 features
- [ ] Improve search UX
- [ ] Optimize build performance

---

## Notes for Future Reference

### What Worked Well
- [To be filled during migration]

### Challenges Encountered
- [To be filled during migration]

### Lessons Learned
- [To be filled during migration]

### Recommendations for Others
- [To be filled during migration]

---

**Document Version**: 1.0  
**Last Updated**: 2025-11-12  
**Author**: AI Agent (GitHub Copilot)  
**Status**: Ready for Execution
