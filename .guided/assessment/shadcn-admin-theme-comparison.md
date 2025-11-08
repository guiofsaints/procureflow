# shadcn-admin vs ProcureFlow Theme Comparison

**Date**: November 7, 2025  
**Purpose**: Compare theming approaches to design a unified migration strategy

---

## Executive Summary

Both projects use:

- ✅ **Tailwind CSS v4** with `@theme inline` directive
- ✅ **CSS variables** for theme tokens
- ✅ **Light/dark mode** support
- ✅ **shadcn/ui** component system

Key differences:

- **Color space**: shadcn-admin uses **OKLCH**, ProcureFlow uses **Tailwind palette** (neutral, rose)
- **Token naming**: shadcn-admin has **sidebar-specific tokens**, ProcureFlow inherits from base
- **Global styles**: shadcn-admin uses **utility definitions**, ProcureFlow uses **layer-based approach**
- **Animations**: shadcn-admin defines **collapsible animations**, ProcureFlow has **hero/landing animations**

---

## Token-by-Token Comparison

### Base Color Tokens

| Token                    | shadcn-admin                                                                | ProcureFlow                                                             | Migration Notes                          |
| ------------------------ | --------------------------------------------------------------------------- | ----------------------------------------------------------------------- | ---------------------------------------- |
| **--background**         | `oklch(1 0 0)` (light)<br>`oklch(0.129 0.042 264.695)` (dark)               | `var(--color-white)` (light)<br>`#212121` (dark)                        | Keep ProcureFlow values, align structure |
| **--foreground**         | `oklch(0.129 0.042 264.695)` (light)<br>`oklch(0.984 0.003 247.858)` (dark) | `var(--color-neutral-900)` (light)<br>`var(--color-neutral-50)` (dark)  | Keep ProcureFlow values                  |
| **--card**               | `oklch(1 0 0)` (light)<br>`oklch(0.14 0.04 259.21)` (dark)                  | `var(--color-white)` (light)<br>`#212121` (dark)                        | Keep ProcureFlow values                  |
| **--card-foreground**    | Same as foreground                                                          | Same as foreground                                                      | ✅ Aligned                               |
| **--primary**            | `oklch(0.208 0.042 265.755)` (light)<br>`oklch(0.929 0.013 255.508)` (dark) | `var(--color-neutral-900)` (light)<br>`var(--color-neutral-50)` (dark)  | Keep ProcureFlow values                  |
| **--primary-foreground** | Inverts primary                                                             | Inverts primary                                                         | ✅ Aligned                               |
| **--secondary**          | `oklch(0.968 0.007 247.896)` (light)<br>`oklch(0.279 0.041 260.031)` (dark) | `var(--color-neutral-100)` (light)<br>`var(--color-neutral-800)` (dark) | Keep ProcureFlow values                  |
| **--muted**              | Same as secondary                                                           | Same as secondary                                                       | ✅ Aligned                               |
| **--muted-foreground**   | `oklch(0.554 0.046 257.417)` (light)<br>`oklch(0.704 0.04 256.788)` (dark)  | `var(--color-neutral-500)` (light)<br>`var(--color-neutral-400)` (dark) | Keep ProcureFlow values                  |
| **--accent**             | Same as secondary                                                           | Same as secondary                                                       | ✅ Aligned                               |
| **--accent-foreground**  | Matches primary                                                             | Matches primary                                                         | ✅ Aligned                               |
| **--destructive**        | `oklch(0.577 0.245 27.325)` (light)<br>`oklch(0.704 0.191 22.216)` (dark)   | `var(--color-rose-500)` (light)<br>`var(--color-rose-700)` (dark)       | Keep ProcureFlow values                  |
| **--border**             | `oklch(0.929 0.013 255.508)` (light)<br>`oklch(1 0 0 / 10%)` (dark)         | `var(--color-neutral-200)` (light)<br>`var(--color-neutral-800)` (dark) | Keep ProcureFlow values                  |
| **--input**              | Same as border                                                              | Same as border                                                          | ✅ Aligned                               |
| **--ring**               | `oklch(0.704 0.04 256.788)` (light)<br>`oklch(0.551 0.027 264.364)` (dark)  | `var(--color-neutral-400)` (light)<br>`var(--color-neutral-300)` (dark) | Keep ProcureFlow values                  |

### Radius Tokens

| Token           | shadcn-admin                | ProcureFlow                 | Migration Notes                          |
| --------------- | --------------------------- | --------------------------- | ---------------------------------------- |
| **--radius**    | `0.625rem` (10px)           | `0.5rem` (8px)              | **Keep ProcureFlow** (more conservative) |
| **--radius-sm** | `calc(var(--radius) - 4px)` | `calc(var(--radius) - 4px)` | ✅ Aligned                               |
| **--radius-md** | `calc(var(--radius) - 2px)` | `calc(var(--radius) - 2px)` | ✅ Aligned                               |
| **--radius-lg** | `var(--radius)`             | `var(--radius)`             | ✅ Aligned                               |
| **--radius-xl** | `calc(var(--radius) + 4px)` | ❌ Not defined              | **Add to ProcureFlow**                   |

### Sidebar-Specific Tokens

| Token                            | shadcn-admin                | ProcureFlow    | Migration Notes                              |
| -------------------------------- | --------------------------- | -------------- | -------------------------------------------- |
| **--sidebar**                    | `var(--background)`         | ❌ Not defined | **Add to ProcureFlow** (inherits background) |
| **--sidebar-foreground**         | `var(--foreground)`         | ❌ Not defined | **Add to ProcureFlow** (inherits foreground) |
| **--sidebar-primary**            | `var(--primary)`            | ❌ Not defined | **Add to ProcureFlow** (inherits primary)    |
| **--sidebar-primary-foreground** | `var(--primary-foreground)` | ❌ Not defined | **Add to ProcureFlow**                       |
| **--sidebar-accent**             | `var(--accent)`             | ❌ Not defined | **Add to ProcureFlow**                       |
| **--sidebar-accent-foreground**  | `var(--accent-foreground)`  | ❌ Not defined | **Add to ProcureFlow**                       |
| **--sidebar-border**             | `var(--border)`             | ❌ Not defined | **Add to ProcureFlow**                       |
| **--sidebar-ring**               | `var(--ring)`               | ❌ Not defined | **Add to ProcureFlow**                       |

**Rationale**: shadcn/ui Sidebar component expects these tokens. By inheriting from base tokens, we maintain consistency while enabling future customization.

### Chart Colors

| Token                               | shadcn-admin    | ProcureFlow    | Migration Notes                       |
| ----------------------------------- | --------------- | -------------- | ------------------------------------- |
| **--chart-1** through **--chart-5** | Defined (OKLCH) | ❌ Not defined | **Optional** - Add if charts are used |

---

## File-by-File Comparison

### 1. Theme Definitions

#### shadcn-admin: `src/styles/theme.css`

```css
:root {
  --radius: 0.625rem;
  --background: oklch(1 0 0);
  --foreground: oklch(0.129 0.042 264.695);
  /* ... 20+ tokens ... */

  /* Sidebar tokens */
  --sidebar: var(--background);
  --sidebar-foreground: var(--foreground);
  /* ... */
}

.dark {
  --background: oklch(0.129 0.042 264.695);
  --foreground: oklch(0.984 0.003 247.858);
  /* ... */
}

@theme inline {
  --font-inter: 'Inter', 'sans-serif';
  --font-manrope: 'Manrope', 'sans-serif';

  --radius-sm: calc(var(--radius) - 4px);
  /* ... */

  --color-background: var(--background);
  --color-foreground: var(--foreground);
  /* Map all tokens to Tailwind's --color-* namespace */
}
```

**Structure**:

1. `:root` → Light mode tokens (direct OKLCH values)
2. `.dark` → Dark mode tokens (direct OKLCH values)
3. `@theme inline` → Maps tokens to Tailwind's namespace

---

#### ProcureFlow: `src/styles/globals.css`

```css
@theme {
  --color-background: var(--color-white);
  --color-foreground: var(--color-neutral-900);
  /* ... tokens reference Tailwind palette ... */
  --radius: 0.5rem;
  --radius-lg: var(--radius);
  /* ... */
}

@layer theme {
  .dark {
    --color-background: #212121;
    --color-foreground: var(--color-neutral-50);
    /* ... */
  }
}

@theme inline {
  --animate-rainbow: rainbow var(--speed, 2s) infinite linear;
  --color-color-1: var(--color-1);
  /* Custom animation tokens */
}

:root {
  --color-1: oklch(66.2% 0.225 25.9);
  /* Rainbow animation colors */
}
```

**Structure**:

1. `@theme` → Light mode tokens (references Tailwind palette)
2. `@layer theme .dark` → Dark mode overrides
3. `@theme inline` → Custom animation utilities
4. `:root` → Special-purpose variables (rainbow animation)

---

### 2. Global Styles & Directives

#### shadcn-admin: `src/styles/index.css`

```css
@import 'tailwindcss';
@import 'tw-animate-css';
@import './theme.css';

@custom-variant dark (&:is(.dark *));

@layer base {
  * {
    @apply border-border outline-ring/50;
    scrollbar-width: thin;
    scrollbar-color: var(--border) transparent;
  }

  body {
    @apply bg-background text-foreground 
           has-[div[data-variant='inset']]:bg-sidebar 
           min-h-svh w-full;
  }

  /* Prevent focus zoom on mobile */
  @media screen and (max-width: 767px) {
    input,
    select,
    textarea {
      font-size: 16px !important;
    }
  }
}

@utility container {
  margin-inline: auto;
  padding-inline: 2rem;
}

@utility no-scrollbar {
  &::-webkit-scrollbar {
    display: none;
  }
  -ms-overflow-style: none;
  scrollbar-width: none;
}
```

**Features**:

- ✅ Custom variant for dark mode
- ✅ Thin scrollbars with themed colors
- ✅ Body background adapts to sidebar variant
- ✅ Mobile input zoom prevention
- ✅ Custom `@utility` definitions

---

#### ProcureFlow: `src/styles/globals.css`

```css
@import 'tailwindcss';

@custom-variant dark (&:is(.dark *));
@variant dark (&:where(.dark, .dark *));

@theme {
  /* ... */
}

@layer theme {
  .dark {
    /* ... */
  }
}

@layer base {
  *,
  ::before,
  ::after {
    border-color: var(--color-border);
  }

  html,
  body {
    overflow-x: clip;
    max-width: 100vw;
  }

  * {
    @apply border-border outline-ring/50;
  }

  body {
    @apply bg-background text-foreground;
  }
}

/* Animations for landing page */
@keyframes fadeInUp {
  /* ... */
}
@keyframes slideInUp {
  /* ... */
}
/* ... */
```

**Features**:

- ✅ Two dark mode variants (for compatibility)
- ✅ Border color for pseudo-elements
- ✅ Horizontal overflow clipping (for sticky positioning)
- ✅ Custom animations for hero/landing page

---

## Migration Strategy

### Phase 1: Align Token Structure

**Goal**: Add missing tokens while keeping existing values

```css
/* Add to ProcureFlow's @theme block */
@theme {
  /* ... existing tokens ... */

  /* Add radius-xl (missing) */
  --radius-xl: calc(var(--radius) + 4px);

  /* Add sidebar tokens (inherit from base) */
  --color-sidebar: var(--color-background);
  --color-sidebar-foreground: var(--color-foreground);
  --color-sidebar-primary: var(--color-primary);
  --color-sidebar-primary-foreground: var(--color-primary-foreground);
  --color-sidebar-accent: var(--color-accent);
  --color-sidebar-accent-foreground: var(--color-accent-foreground);
  --color-sidebar-border: var(--color-border);
  --color-sidebar-ring: var(--color-ring);
}
```

**Then add to dark mode**:

```css
@layer theme {
  .dark {
    /* Sidebar inherits automatically, no overrides needed */
  }
}
```

---

### Phase 2: Adopt Global Style Patterns

**From shadcn-admin, add to ProcureFlow**:

```css
@layer base {
  * {
    @apply border-border outline-ring/50;
    scrollbar-width: thin;
    scrollbar-color: var(--color-border) transparent;
  }

  body {
    @apply bg-background text-foreground;
    /* Will add has-[...]:bg-sidebar when sidebar variant is implemented */
  }

  /* Cursor pointer for buttons */
  button:not(:disabled),
  [role='button']:not(:disabled) {
    cursor: pointer;
  }

  /* Prevent focus zoom on mobile */
  @media screen and (max-width: 767px) {
    input,
    select,
    textarea {
      font-size: 16px !important;
    }
  }
}
```

---

### Phase 3: Add Utility Definitions

```css
@utility no-scrollbar {
  /* Hide scrollbar for Chrome, Safari and Opera */
  &::-webkit-scrollbar {
    display: none;
  }
  /* Hide scrollbar for IE, Edge and Firefox */
  -ms-overflow-style: none;
  scrollbar-width: none;
}

@utility faded-bottom {
  @apply after:pointer-events-none after:absolute after:start-0 
         after:bottom-0 after:hidden after:h-32 after:w-full 
         after:rounded-b-2xl 
         after:bg-[linear-gradient(180deg,_transparent_10%,_var(--color-background)_70%)] 
         md:after:block;
}
```

---

### Phase 4: Collapsible Animations

**From shadcn-admin, add to ProcureFlow**:

```css
/* Collapsible Content Animations */
.CollapsibleContent {
  overflow: hidden;
}
.CollapsibleContent[data-state='open'] {
  animation: slideDown 300ms ease-out;
}
.CollapsibleContent[data-state='closed'] {
  animation: slideUp 300ms ease-out;
}

@keyframes slideDown {
  from {
    height: 0;
  }
  to {
    height: var(--radix-collapsible-content-height);
  }
}

@keyframes slideUp {
  from {
    height: var(--radix-collapsible-content-height);
  }
  to {
    height: 0;
  }
}
```

**Note**: These animations are required by the shadcn/ui Sidebar component.

---

## Compatibility Matrix

| Feature                    | shadcn-admin                                    | ProcureFlow | Compatibility | Action               |
| -------------------------- | ----------------------------------------------- | ----------- | ------------- | -------------------- |
| **Tailwind v4**            | ✅                                              | ✅          | ✅            | None                 |
| **@theme inline**          | ✅                                              | ✅          | ✅            | None                 |
| **CSS variables**          | ✅                                              | ✅          | ✅            | None                 |
| **Light/dark mode**        | ✅                                              | ✅          | ✅            | None                 |
| **Radius tokens**          | 5 sizes                                         | 4 sizes     | ⚠️            | Add `--radius-xl`    |
| **Sidebar tokens**         | ✅                                              | ❌          | ⚠️            | Add 8 sidebar tokens |
| **OKLCH colors**           | ✅                                              | ❌          | ✅            | Optional (future)    |
| **Scrollbar styling**      | ✅                                              | ❌          | ⚠️            | Add to base layer    |
| **Collapsible animations** | ✅                                              | ❌          | ⚠️            | Add keyframes        |
| **Mobile input zoom fix**  | ✅                                              | ❌          | ⚠️            | Add to base layer    |
| **Custom utilities**       | 3 (`container`, `no-scrollbar`, `faded-bottom`) | 0           | ⚠️            | Add utilities        |
| **Landing animations**     | ❌                                              | ✅          | ✅            | Keep existing        |

---

## Decision Log

### ✅ Keep from ProcureFlow

1. **Color values** (neutral palette, #212121 dark background)
2. **Base radius** (0.5rem vs 0.625rem - more conservative)
3. **Landing page animations** (fadeInUp, slideInUp, etc.)
4. **Rainbow animation tokens** (unique to ProcureFlow)
5. **Horizontal overflow clipping** (for sticky positioning)

### ✅ Adopt from shadcn-admin

1. **Sidebar tokens** (8 new tokens inheriting from base)
2. **Radius-xl token** (for consistency)
3. **Scrollbar styling** (thin, themed scrollbars)
4. **Collapsible animations** (required by Sidebar component)
5. **Mobile input zoom prevention** (accessibility)
6. **Button cursor pointer** (UX improvement)
7. **Custom utilities** (no-scrollbar, faded-bottom)

### ⏸️ Future Consideration

1. **OKLCH color space** (better perceptual uniformity, but requires color migration)
2. **Chart colors** (add when dashboard/analytics features are implemented)
3. **Font switcher tokens** (not needed unless feature is desired)

---

## Implementation Checklist

- [ ] Add `--radius-xl` token to `@theme` block
- [ ] Add 8 sidebar tokens to `@theme` block (inheriting from base)
- [ ] Add sidebar tokens to dark mode (inheritance only, no overrides)
- [ ] Add thin scrollbar styling to `@layer base`
- [ ] Add mobile input zoom prevention to `@layer base`
- [ ] Add button cursor pointer to `@layer base`
- [ ] Define `@utility no-scrollbar`
- [ ] Define `@utility faded-bottom`
- [ ] Add collapsible animations (.CollapsibleContent + keyframes)
- [ ] Verify all tokens work in both light and dark modes
- [ ] Test Sidebar component with new tokens

---

## Example: Final Merged Theme Structure

```css
@import 'tailwindcss';

@custom-variant dark (&:is(.dark *));
@variant dark (&:where(.dark, .dark *));

@theme {
  /* Base tokens (keep existing ProcureFlow values) */
  --color-background: var(--color-white);
  --color-foreground: var(--color-neutral-900);
  /* ... all existing tokens ... */

  /* Radius tokens */
  --radius: 0.5rem;
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px); /* NEW */

  /* Sidebar tokens (NEW - inherit from base) */
  --color-sidebar: var(--color-background);
  --color-sidebar-foreground: var(--color-foreground);
  --color-sidebar-primary: var(--color-primary);
  --color-sidebar-primary-foreground: var(--color-primary-foreground);
  --color-sidebar-accent: var(--color-accent);
  --color-sidebar-accent-foreground: var(--color-accent-foreground);
  --color-sidebar-border: var(--color-border);
  --color-sidebar-ring: var(--color-ring);
}

@layer theme {
  .dark {
    /* Dark mode overrides (keep existing ProcureFlow values) */
    --color-background: #212121;
    /* ... */

    /* Sidebar inherits automatically via var() references */
  }
}

@layer base {
  * {
    @apply border-border outline-ring/50;
    scrollbar-width: thin; /* NEW */
    scrollbar-color: var(--color-border) transparent; /* NEW */
  }

  /* ... existing base styles ... */

  /* NEW: Button cursor */
  button:not(:disabled),
  [role='button']:not(:disabled) {
    cursor: pointer;
  }

  /* NEW: Mobile input zoom prevention */
  @media screen and (max-width: 767px) {
    input,
    select,
    textarea {
      font-size: 16px !important;
    }
  }
}

/* NEW: Custom utilities */
@utility no-scrollbar {
  &::-webkit-scrollbar {
    display: none;
  }
  -ms-overflow-style: none;
  scrollbar-width: none;
}

@utility faded-bottom {
  @apply after:pointer-events-none after:absolute after:start-0 
         after:bottom-0 after:h-32 after:w-full 
         after:bg-[linear-gradient(180deg,_transparent_10%,_var(--color-background)_70%)];
}

/* NEW: Collapsible animations */
.CollapsibleContent {
  overflow: hidden;
}
.CollapsibleContent[data-state='open'] {
  animation: slideDown 300ms ease-out;
}
.CollapsibleContent[data-state='closed'] {
  animation: slideUp 300ms ease-out;
}

@keyframes slideDown {
  from {
    height: 0;
  }
  to {
    height: var(--radix-collapsible-content-height);
  }
}

@keyframes slideUp {
  from {
    height: var(--radix-collapsible-content-height);
  }
  to {
    height: 0;
  }
}

/* Keep existing ProcureFlow animations */
@keyframes fadeInUp {
  /* ... */
}
/* ... */
```

---

## Summary

The theme comparison reveals **high alignment** with a clear path forward:

1. **Keep** ProcureFlow's color values (no visual disruption)
2. **Add** shadcn-admin's sidebar tokens (required for Sidebar component)
3. **Adopt** shadcn-admin's global styles (scrollbars, mobile fixes, utilities)
4. **Merge** animations (collapsible from shadcn + landing from ProcureFlow)

This approach maximizes compatibility while preserving ProcureFlow's established visual identity.

---

_Next: Detailed component-by-component analysis (see `shadcn-admin-components-analysis.md`)._
