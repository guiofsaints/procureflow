# Tailwind CSS v4 Migration Plan - ProcureFlow

**Date**: November 7, 2025  
**Project**: ProcureFlow  
**Migration**: Tailwind CSS v3.3.6 → v4.x  
**Theming**: shadcn UI HSL-based design tokens

---

## Migration Strategy

### Approach

**Incremental migration** with component-level verification:

1. ✅ Update dependencies and configuration
2. ✅ Establish shadcn-compatible CSS variable system
3. ✅ Migrate CSS directives to v4 syntax
4. ✅ Replace hardcoded colors with semantic tokens
5. ✅ Test and validate across all features

### Success Criteria

- [ ] All pages render correctly in light and dark modes
- [ ] No Tailwind v3 dependencies remain
- [ ] Theme tokens match shadcn conventions
- [ ] `pnpm lint`, `pnpm build`, `pnpm type-check` pass
- [ ] Visual consistency maintained from v3

---

## Dependencies Migration

### Package Versions: From → To

| Package                      | Current (v3) | Target (v4) | Notes                                 |
| ---------------------------- | ------------ | ----------- | ------------------------------------- |
| **tailwindcss**              | ^3.3.6       | ^4.0.0      | Core framework upgrade                |
| **@tailwindcss/typography**  | ^0.5.10      | ❌ Remove   | Not yet compatible with v4 (optional) |
| **postcss**                  | ^8.5.1       | ^8.5.1      | No change needed                      |
| **autoprefixer**             | ^10.4.20     | ^10.4.20    | No change needed                      |
| **tailwind-merge**           | ^3.3.1       | ^3.3.1      | No change needed (utility)            |
| **class-variance-authority** | ^0.7.1       | ^0.7.1      | No change needed (utility)            |

### Installation Command

```bash
pnpm remove @tailwindcss/typography
pnpm add -D tailwindcss@^4.0.0
```

**Impact**: `@tailwindcss/typography` removal is safe as it's not currently active in config.

---

## Configuration Migration

### 1. Tailwind Config (`tailwind.config.ts`)

#### Current (Tailwind 3)

```typescript
import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        /* custom colors */
      },
      fontFamily: {
        /* custom fonts */
      },
      // ...
    },
  },
  plugins: [],
};
```

#### Target (Tailwind 4)

```typescript
import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}', './src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  darkMode: 'class', // Changed from default 'media'
};

export default config;
```

#### Key Changes

| Change                                                       | Impact | Reason                                 |
| ------------------------------------------------------------ | ------ | -------------------------------------- |
| **Remove `./pages/**` from content\*\*                       | Low    | Next.js 15 uses App Router only        |
| **Add CSS variable-based colors**                            | High   | shadcn theming integration             |
| **Remove custom `brand`/`success`/`warning`/`error` colors** | Medium | Replaced by semantic tokens            |
| **Add `darkMode: 'class'`**                                  | High   | Enable class-based theme switching     |
| **Add `borderRadius` variants**                              | Low    | shadcn convention for consistent radii |

---

### 2. PostCSS Config (`postcss.config.mjs`)

#### Current → Target

**No changes needed** - Tailwind 4 is backward compatible with PostCSS setup:

```javascript
const config = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};

export default config;
```

---

### 3. Global CSS (`src/styles/globals.css`)

#### Current (Tailwind 3)

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --foreground-rgb: 0, 0, 0;
  --background-start-rgb: 214, 219, 220;
  --background-end-rgb: 255, 255, 255;
}

@media (prefers-color-scheme: dark) {
  :root {
    --foreground-rgb: 255, 255, 255;
    --background-start-rgb: 0, 0, 0;
    --background-end-rgb: 0, 0, 0;
  }
}
```

#### Target (Tailwind 4 + shadcn)

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 224 71.4% 4.1%;
    --card: 0 0% 100%;
    --card-foreground: 224 71.4% 4.1%;
    --popover: 0 0% 100%;
    --popover-foreground: 224 71.4% 4.1%;
    --primary: 262.1 83.3% 57.8%;
    --primary-foreground: 210 20% 98%;
    --secondary: 220 14.3% 95.9%;
    --secondary-foreground: 220.9 39.3% 11%;
    --muted: 220 14.3% 95.9%;
    --muted-foreground: 220 8.9% 46.1%;
    --accent: 220 14.3% 95.9%;
    --accent-foreground: 220.9 39.3% 11%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 20% 98%;
    --border: 220 13% 91%;
    --input: 220 13% 91%;
    --ring: 262.1 83.3% 57.8%;
    --radius: 0.5rem;
    --chart-1: 12 76% 61%;
    --chart-2: 173 58% 39%;
    --chart-3: 197 37% 24%;
    --chart-4: 43 74% 66%;
    --chart-5: 27 87% 67%;
  }

  .dark {
    --background: 224 71.4% 4.1%;
    --foreground: 210 20% 98%;
    --card: 224 71.4% 4.1%;
    --card-foreground: 210 20% 98%;
    --popover: 224 71.4% 4.1%;
    --popover-foreground: 210 20% 98%;
    --primary: 263.4 70% 50.4%;
    --primary-foreground: 210 20% 98%;
    --secondary: 215 27.9% 16.9%;
    --secondary-foreground: 210 20% 98%;
    --muted: 215 27.9% 16.9%;
    --muted-foreground: 217.9 10.6% 64.9%;
    --accent: 215 27.9% 16.9%;
    --accent-foreground: 210 20% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 20% 98%;
    --border: 215 27.9% 16.9%;
    --input: 215 27.9% 16.9%;
    --ring: 263.4 70% 50.4%;
    --chart-1: 220 70% 50%;
    --chart-2: 160 60% 45%;
    --chart-3: 30 80% 55%;
    --chart-4: 280 65% 60%;
    --chart-5: 340 75% 55%;
  }
}

* {
  @apply border-border;
}

body {
  @apply bg-background text-foreground;
}
```

#### Key Changes

| Change                                       | Impact | Reason                        |
| -------------------------------------------- | ------ | ----------------------------- |
| **Replace RGB with HSL values**              | High   | shadcn standard format        |
| **Add semantic tokens**                      | High   | Enable theme-aware components |
| **Use `.dark` class instead of media query** | High   | Class-based theme switching   |
| **Add `@layer base`**                        | Medium | Proper CSS layer organization |
| **Add global border/body styles**            | Low    | Consistent theme application  |

---

## Component-Level Color Migration

### Hardcoded Color → Semantic Token Mapping

| Current Class (v3)                         | Target Class (v4)                    | Usage Context        |
| ------------------------------------------ | ------------------------------------ | -------------------- |
| `bg-white` / `dark:bg-gray-800`            | `bg-card`                            | Card backgrounds     |
| `bg-gray-50` / `dark:bg-gray-950`          | `bg-background`                      | Page backgrounds     |
| `bg-gray-100` / `dark:bg-gray-900`         | `bg-muted`                           | Muted sections       |
| `text-gray-900` / `dark:text-white`        | `text-foreground`                    | Primary text         |
| `text-gray-600` / `dark:text-gray-400`     | `text-muted-foreground`              | Secondary text       |
| `text-gray-500` / `dark:text-gray-400`     | `text-muted-foreground`              | Tertiary text        |
| `bg-blue-600` / `hover:bg-blue-700`        | `bg-primary` / `hover:bg-primary/90` | Primary buttons      |
| `text-blue-600` / `dark:text-blue-400`     | `text-primary`                       | Links, accents       |
| `bg-blue-50` / `dark:bg-blue-900/20`       | `bg-accent`                          | Highlighted sections |
| `border-gray-200` / `dark:border-gray-700` | `border-border`                      | All borders          |
| `bg-red-500`                               | `bg-destructive`                     | Error states         |
| `text-red-600`                             | `text-destructive`                   | Error text           |

### Example Refactor: Button Component

#### Before (v3)

```typescript
const variantClasses = {
  primary: 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500',
  secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-900 focus:ring-gray-500',
};
```

#### After (v4)

```typescript
const variantClasses = {
  primary:
    'bg-primary hover:bg-primary/90 text-primary-foreground focus:ring-ring',
  secondary:
    'bg-secondary hover:bg-secondary/90 text-secondary-foreground focus:ring-ring',
};
```

---

## ESLint Configuration

### Current → Target

**Current**: No Tailwind-specific ESLint rules

**Target (Optional)**: Add `eslint-plugin-tailwindcss` for class ordering

```bash
pnpm add -D eslint-plugin-tailwindcss
```

Update `eslint.config.mjs`:

```javascript
import tailwindcss from 'eslint-plugin-tailwindcss';

const eslintConfig = [
  // ... existing config
  ...tailwindcss.configs['flat/recommended'],
  {
    rules: {
      'tailwindcss/classnames-order': 'warn',
      'tailwindcss/no-custom-classname': 'off',
    },
  },
];
```

**Impact**: Low priority - can be added post-migration for code consistency.

---

## Step-by-Step Migration Checklist

### Phase 1: Preparation (Pre-Migration)

- [x] 1.1. Document current Tailwind usage (audit complete)
- [x] 1.2. Create migration plan with de-para mapping
- [ ] 1.3. Create git branch: `feature/tailwind-v4-migration`
- [ ] 1.4. Backup current build artifacts for comparison

### Phase 2: Dependencies & Configuration

- [ ] 2.1. Update `package.json` dependencies (remove @tailwindcss/typography, upgrade tailwindcss)
- [ ] 2.2. Run `pnpm install` to apply changes
- [ ] 2.3. Update `tailwind.config.ts` with v4-compatible structure
- [ ] 2.4. Add `darkMode: 'class'` to config
- [ ] 2.5. Verify config compiles: `pnpm build` (expect CSS changes but no errors)

### Phase 3: CSS Layer & Token Migration

- [ ] 3.1. Update `globals.css` with shadcn HSL token structure
- [ ] 3.2. Replace `:root` RGB variables with HSL semantic tokens
- [ ] 3.3. Replace `@media (prefers-color-scheme: dark)` with `.dark` class
- [ ] 3.4. Add `@layer base` with global styles
- [ ] 3.5. Test theme switching manually in browser

### Phase 4: Component Color Migration

- [ ] 4.1. **AppShell & Layout** (`src/components/layout/`)
  - [ ] Replace `bg-gray-50/dark:bg-gray-950` → `bg-background`
  - [ ] Replace `text-gray-*` → `text-foreground/muted-foreground`

- [ ] 4.2. **Sidebar** (`src/components/layout/Sidebar.tsx`)
  - [ ] Replace `bg-white/dark:bg-gray-800` → `bg-card`
  - [ ] Replace active state colors → `bg-accent text-accent-foreground`

- [ ] 4.3. **Button** (`src/components/ui/Button.tsx`)
  - [ ] Replace `bg-blue-*` → `bg-primary`
  - [ ] Replace `bg-gray-*` → `bg-secondary`

- [ ] 4.4. **Catalog Pages** (`src/features/catalog/components/`)
  - [ ] Replace card backgrounds → `bg-card`
  - [ ] Replace borders → `border-border`
  - [ ] Replace tag colors → `bg-accent text-accent-foreground`

- [ ] 4.5. **Cart Pages** (`src/features/cart/components/`)
  - [ ] Replace table styles → semantic tokens
  - [ ] Replace quantity controls → `border-input bg-background`

- [ ] 4.6. **Agent Chat** (`src/features/agent/components/`)
  - [ ] Replace message bubbles → `bg-muted/bg-primary`
  - [ ] Replace text colors → `text-foreground/text-primary-foreground`

### Phase 5: Validation & Testing

- [ ] 5.1. Run `pnpm lint` and fix any new warnings
- [ ] 5.2. Run `pnpm type-check` and resolve type errors
- [ ] 5.3. Run `pnpm build` successfully
- [ ] 5.4. Visual testing:
  - [ ] Landing page (light/dark)
  - [ ] Catalog list (light/dark)
  - [ ] Product detail (light/dark)
  - [ ] Cart page (light/dark)
  - [ ] Agent chat (light/dark)
  - [ ] Sidebar navigation (collapsed/expanded)
- [ ] 5.5. Verify theme toggle works correctly

### Phase 6: Documentation & Cleanup

- [ ] 6.1. Create `src/styles/theme-tokens.md` documentation
- [ ] 6.2. Create `.guided/assessment/tailwind-v4-migration-notes.md`
- [ ] 6.3. Update `README.md` if necessary (theming section)
- [ ] 6.4. Remove any unused custom color utilities from config
- [ ] 6.5. Commit changes with conventional commit message

---

## Rollback Plan

If migration fails or introduces critical bugs:

1. **Git Rollback**: `git checkout main` (assuming feature branch workflow)
2. **Dependency Rollback**:
   ```bash
   pnpm add -D tailwindcss@^3.3.6 @tailwindcss/typography@^0.5.10
   pnpm install
   ```
3. **Config Rollback**: Restore `tailwind.config.ts` and `globals.css` from git
4. **Build Verification**: Run `pnpm build` to confirm rollback success

---

## Timeline Estimate

| Phase                              | Duration | Dependencies |
| ---------------------------------- | -------- | ------------ |
| **Phase 1**: Preparation           | 1 hour   | None         |
| **Phase 2**: Dependencies & Config | 1 hour   | Phase 1      |
| **Phase 3**: CSS Tokens            | 2 hours  | Phase 2      |
| **Phase 4**: Component Migration   | 6 hours  | Phase 3      |
| **Phase 5**: Validation            | 2 hours  | Phase 4      |
| **Phase 6**: Documentation         | 1 hour   | Phase 5      |
| **Buffer**: Fixes & Iterations     | 2 hours  | All phases   |

**Total Estimated Time**: 12-15 hours

---

## Risk Mitigation

### High-Risk Areas

| Risk                          | Mitigation                                | Contingency                        |
| ----------------------------- | ----------------------------------------- | ---------------------------------- |
| **Breaking visual changes**   | Side-by-side screenshot comparison        | Keep v3 branch for reference       |
| **Dark mode inconsistencies** | Test every component in both modes        | Add manual QA checklist            |
| **Missing semantic tokens**   | Map all hardcoded colors before migration | Keep color mapping table handy     |
| **Build failures**            | Test build after each phase               | Commit after each successful phase |

### Communication Plan

- **Stakeholders**: Notify before migration starts
- **Progress Updates**: Commit messages follow conventional commits
- **Issues**: Document in `.guided/assessment/tailwind-v4-migration-notes.md`

---

## Next Steps

1. ✅ Review and approve this migration plan
2. ⏳ Create feature branch: `feature/tailwind-v4-migration`
3. ⏳ Execute Phase 2: Update dependencies
4. ⏳ Execute Phase 3: Migrate CSS tokens
5. ⏳ Execute Phase 4: Refactor components
6. ⏳ Execute Phase 5: Validate and test
7. ⏳ Execute Phase 6: Document and merge

---

**Plan Status**: Ready for execution  
**Approval Required**: Yes (stakeholder sign-off recommended)  
**Next Document**: `src/styles/theme-tokens.md` (created during Phase 6)
