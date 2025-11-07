# Theme Tokens - ProcureFlow

**Last Updated**: November 7, 2025  
**Tailwind Version**: v4.1.17  
## Theming System: shadcn UI-native OKLCH tokens

---

## Overview

ProcureFlow uses a **CSS variable-based theming system** aligned with [shadcn UI theming conventions](https://ui.shadcn.com/docs/theming). All colors are defined as HSL values in CSS custom properties and consumed via Tailwind utility classes.

### Key Features

- ✅ **Class-based dark mode** (`dark` class toggle)
- ✅ **HSL color format** for semantic theming
- ✅ **shadcn-compatible tokens** (background, foreground, primary, etc.)
- ✅ **Automatic theme switching** via `next-themes`
- ✅ **Tailwind v4 native** integration

---

## Token Reference

### Core Tokens

All tokens are defined in `src/styles/globals.css` under `@layer base`.

| Token | Purpose | Light Mode Value | Dark Mode Value |
| ----- | ------- | ---------------- | --------------- |
| `--background` | Page background | `0 0% 100%` (white) | `224 71.4% 4.1%` (dark blue-gray) |
| `--foreground` | Primary text color | `224 71.4% 4.1%` (dark blue-gray) | `210 20% 98%` (off-white) |
| `--card` | Card/panel background | `0 0% 100%` (white) | `224 71.4% 4.1%` (dark blue-gray) |
| `--card-foreground` | Text on cards | `224 71.4% 4.1%` | `210 20% 98%` |
| `--popover` | Popover/dropdown background | `0 0% 100%` | `224 71.4% 4.1%` |
| `--popover-foreground` | Text in popovers | `224 71.4% 4.1%` | `210 20% 98%` |

### Brand & Accent Tokens

| Token | Purpose | Light Mode Value | Dark Mode Value |
| ----- | ------- | ---------------- | --------------- |
| `--primary` | Primary brand color (buttons, links) | `262.1 83.3% 57.8%` (purple) | `263.4 70% 50.4%` (dark purple) |
| `--primary-foreground` | Text on primary elements | `210 20% 98%` | `210 20% 98%` |
| `--secondary` | Secondary UI elements | `220 14.3% 95.9%` (light gray) | `215 27.9% 16.9%` (dark gray) |
| `--secondary-foreground` | Text on secondary elements | `220.9 39.3% 11%` | `210 20% 98%` |
| `--accent` | Highlighted/active states | `220 14.3% 95.9%` | `215 27.9% 16.9%` |
| `--accent-foreground` | Text on accented elements | `220.9 39.3% 11%` | `210 20% 98%` |

### Semantic Tokens

| Token | Purpose | Light Mode Value | Dark Mode Value |
| ----- | ------- | ---------------- | --------------- |
| `--destructive` | Error/danger states | `0 84.2% 60.2%` (red) | `0 62.8% 30.6%` (dark red) |
| `--destructive-foreground` | Text on destructive elements | `210 20% 98%` | `210 20% 98%` |
| `--muted` | Muted/subdued backgrounds | `220 14.3% 95.9%` | `215 27.9% 16.9%` |
| `--muted-foreground` | Secondary/helper text | `220 8.9% 46.1%` | `217.9 10.6% 64.9%` |

### Form & UI Tokens

| Token | Purpose | Light Mode Value | Dark Mode Value |
| ----- | ------- | ---------------- | --------------- |
| `--border` | Default border color | `220 13% 91%` | `215 27.9% 16.9%` |
| `--input` | Input field borders | `220 13% 91%` | `215 27.9% 16.9%` |
| `--ring` | Focus ring color | `262.1 83.3% 57.8%` | `263.4 70% 50.4%` |
| `--radius` | Border radius base | `0.5rem` | `0.5rem` |

### Chart Colors (Optional)

| Token | Purpose | Value (Light) | Value (Dark) |
| ----- | ------- | ------------- | ------------ |
| `--chart-1` | Chart color 1 | `12 76% 61%` | `220 70% 50%` |
| `--chart-2` | Chart color 2 | `173 58% 39%` | `160 60% 45%` |
| `--chart-3` | Chart color 3 | `197 37% 24%` | `30 80% 55%` |
| `--chart-4` | Chart color 4 | `43 74% 66%` | `280 65% 60%` |
| `--chart-5` | Chart color 5 | `27 87% 67%` | `340 75% 55%` |

---

## Tailwind Config Mapping

The `tailwind.config.ts` maps these CSS variables to Tailwind utilities:

```typescript
colors: {
  background: 'hsl(var(--background))',
  foreground: 'hsl(var(--foreground))',
  card: {
    DEFAULT: 'hsl(var(--card))',
    foreground: 'hsl(var(--card-foreground))',
  },
  primary: {
    DEFAULT: 'hsl(var(--primary))',
    foreground: 'hsl(var(--primary-foreground))',
  },
  // ... etc.
}
```

This enables usage like:

```tsx
<div className="bg-background text-foreground">
  <button className="bg-primary text-primary-foreground">
    Primary Button
  </button>
</div>
```

---

## Usage Guidelines

### DO ✅

**Use semantic token classes**:
```tsx
// ✅ Good: Theme-aware
<div className="bg-card border-border text-foreground">
  <p className="text-muted-foreground">Helper text</p>
</div>
```

**Use default Tailwind colors for decorative purposes**:
```tsx
// ✅ OK: Decorative, non-thematic colors
<div className="bg-gradient-to-r from-pink-500 to-purple-600">
  Decorative gradient
</div>
```

### DON'T ❌

**Avoid hardcoded gray/blue shades for theme elements**:
```tsx
// ❌ Bad: Not theme-aware
<div className="bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white">
  This won't adapt to theme changes
</div>
```

**Don't bypass the token system**:
```tsx
// ❌ Bad: Direct HSL values
<div className="bg-[hsl(220,13%,91%)]">
  Use bg-border instead
</div>
```

---

## Component Examples

### Button Variants

```tsx
// Primary Button
<button className="bg-primary hover:bg-primary/90 text-primary-foreground">
  Save
</button>

// Secondary Button
<button className="bg-secondary hover:bg-secondary/90 text-secondary-foreground">
  Cancel
</button>

// Destructive Button
<button className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
  Delete
</button>
```

### Card Component

```tsx
<div className="bg-card border border-border rounded-lg p-6">
  <h2 className="text-foreground font-semibold mb-2">Card Title</h2>
  <p className="text-muted-foreground">Card description</p>
</div>
```

### Form Input

```tsx
<input
  className="border-input bg-background text-foreground focus:ring-ring rounded-md px-3 py-2"
  placeholder="Enter text..."
/>
```

### Active/Highlighted State

```tsx
<nav>
  <a className="bg-accent text-accent-foreground px-3 py-2 rounded">
    Active Link
  </a>
  <a className="text-muted-foreground hover:text-foreground px-3 py-2">
    Inactive Link
  </a>
</nav>
```

---

## Adding New Tokens

If you need to add custom semantic tokens:

### 1. Define CSS Variables

In `src/styles/globals.css`:

```css
@layer base {
  :root {
    /* ... existing tokens ... */
    --success: 142 76% 36%; /* Green */
    --success-foreground: 210 20% 98%;
  }

  .dark {
    /* ... existing tokens ... */
    --success: 142 70% 45%; /* Brighter green for dark mode */
    --success-foreground: 210 20% 98%;
  }
}
```

### 2. Update Tailwind Config

In `tailwind.config.ts`:

```typescript
colors: {
  // ... existing colors ...
  success: {
    DEFAULT: 'hsl(var(--success))',
    foreground: 'hsl(var(--success-foreground))',
  },
}
```

### 3. Use in Components

```tsx
<div className="bg-success text-success-foreground">
  Success message
</div>
```

---

## Dark Mode Implementation

### ThemeProvider Setup

The app uses `next-themes` for class-based theme switching. Configured in `app/layout.tsx`:

```tsx
import { ThemeProvider } from 'next-themes';

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
```

### Theme Toggle Component

Located at `src/components/layout/ThemeToggle.tsx`:

```tsx
import { useTheme } from 'next-themes';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  
  return (
    <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
      {theme === 'dark' ? '☀️' : '🌙'}
    </button>
  );
}
```

---

## Migrating from Hardcoded Colors

### Color Mapping Reference

| Old (Tailwind v3) | New (shadcn tokens) | Context |
| ----------------- | ------------------- | ------- |
| `bg-white` / `dark:bg-gray-800` | `bg-card` | Card/panel backgrounds |
| `bg-gray-50` / `dark:bg-gray-950` | `bg-background` | Page backgrounds |
| `bg-gray-100` / `dark:bg-gray-900` | `bg-muted` | Muted sections |
| `text-gray-900` / `dark:text-white` | `text-foreground` | Primary text |
| `text-gray-600` / `dark:text-gray-400` | `text-muted-foreground` | Secondary text |
| `bg-blue-600` / `hover:bg-blue-700` | `bg-primary` / `hover:bg-primary/90` | Primary buttons |
| `text-blue-600` / `dark:text-blue-400` | `text-primary` | Links, accents |
| `border-gray-200` / `dark:border-gray-700` | `border-border` | All borders |
| `bg-red-500` | `bg-destructive` | Error states |

---

## Testing Themes

### Manual Testing Checklist

- [ ] Toggle between light and dark modes
- [ ] Verify all semantic colors adapt correctly
- [ ] Check button states (hover, active, disabled)
- [ ] Test form inputs and borders
- [ ] Verify navigation active states
- [ ] Check card backgrounds and text contrast
- [ ] Test muted text is readable in both modes

### Browser DevTools

Use CSS variables inspector to verify:

```css
/* In browser console */
getComputedStyle(document.documentElement).getPropertyValue('--primary')
// Should return HSL values like "262.1 83.3% 57.8%"
```

---

## Troubleshooting

### Colors not updating on theme change

**Problem**: Components still show old colors after switching themes.

**Solution**: Ensure you're using semantic tokens (`bg-primary`) instead of hardcoded colors (`bg-blue-600`).

### Text contrast issues

**Problem**: Text is hard to read in light or dark mode.

**Solution**: Always pair semantic backgrounds with their `-foreground` counterparts:

```tsx
// ✅ Good: Proper contrast
<div className="bg-primary text-primary-foreground">Text</div>

// ❌ Bad: Potentially low contrast
<div className="bg-primary text-foreground">Text</div>
```

### Custom colors not applying

**Problem**: Added new tokens but they don't work.

**Solution**:
1. Verify CSS variables are defined in `:root` and `.dark`
2. Confirm `tailwind.config.ts` has matching color definitions
3. Rebuild with `pnpm build`
4. Clear Next.js cache: `rm -rf .next`

---

## Resources

- **shadcn UI Theming**: https://ui.shadcn.com/docs/theming
- **Tailwind CSS v4 Docs**: https://tailwindcss.com/docs
- **next-themes**: https://github.com/pacocoursey/next-themes
- **HSL Color Picker**: https://hslpicker.com/

---

**Maintained by**: ProcureFlow Team  
**Questions?**: Check `AGENTS.md` for coding guidelines
