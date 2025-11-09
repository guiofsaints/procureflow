# ProcureFlow Branding & Theme Notes

## Theme Tokens

### Location

Theme tokens are defined in `src/styles/globals.css` using Tailwind 4's `@theme` syntax.

### Color Palette

The application uses an **OKLCH color palette** for better perceptual uniformity and wide color gamut support:

- **Light Mode** (`:root` in `@theme` block):
  - Background: `oklch(1 0 0)` - Pure white
  - Foreground: `oklch(0.141 0.005 285.823)` - Deep purple-gray
  - Primary: `oklch(0.541 0.281 293.009)` - Vibrant purple
  - Borders: `oklch(0.92 0.004 286.32)` - Light gray-purple
  - Sidebar: `oklch(0.985 0 0)` - Off-white

- **Dark Mode** (`.dark` in `@layer theme` block):
  - Background: `oklch(0.141 0.005 285.823)` - Deep purple-gray
  - Foreground: `oklch(0.985 0 0)` - Off-white
  - Primary: `oklch(0.606 0.25 292.717)` - Lighter purple
  - Borders: `oklch(1 0 0 / 10%)` - Semi-transparent white
  - Sidebar: `oklch(0.21 0.006 285.885)` - Darker purple-gray

### Design System

- **Border Radius**: `0.65rem` (increased from `0.5rem` for softer appearance)
- **Color Format**: OKLCH (Oklab Lightness Chroma Hue)
- **Utility Classes**: Standard Tailwind/shadcn classes (`bg-background`, `text-foreground`, etc.)

## Logo Usage

### Logo Asset

**File**: `procureflow.png`

**Locations**:

- `apps/web/public/procureflow.png` - Main public asset (served at `/procureflow.png`)
- `apps/web/app/icon.png` - Next.js file-based metadata icon (favicons, PWA)
- `apps/web/app/(public)/procureflow.png` - Original source file

### Logo Implementation

1. **Favicon / App Icon**
   - Uses Next.js 15 file-based metadata API
   - File: `apps/web/app/icon.png`
   - Automatically generates favicons and PWA icons

2. **Public Layout (Landing/Login)**
   - File: `apps/web/app/(public)/layout.tsx`
   - Shows logo in header with Next/Image component
   - Size: 48x48px
   - Includes text: "ProcureFlow" + "AI-Native Procurement Platform"

3. **Sidebar (App Shell)**
   - File: `src/components/layout/Sidebar.tsx`
   - Shows logo at top of sidebar navigation
   - Size: 32x32px
   - Responsive: Works with collapsed/expanded states
   - Includes same branding text (auto-hidden when collapsed)

### Styling

All logo implementations use theme-aware colors via CSS variables:

- No hardcoded colors
- Respects light/dark mode automatically
- Uses `bg-background`, `text-foreground`, `border-border` utility classes

## Verification Steps

### Quick Visual Check

1. **Start dev server**: `pnpm dev`
2. **Check public pages**: Visit `http://localhost:3000` - logo should appear in header
3. **Check app pages**: Visit `http://localhost:3000/catalog` - logo should appear in sidebar
4. **Toggle theme**: Use theme toggle - colors should adapt seamlessly
5. **Check favicon**: Look at browser tab - should show ProcureFlow icon

### Quality Checks

```bash
# Type checking
pnpm typecheck

# Linting
pnpm lint

# Formatting
pnpm format

# Build
pnpm build
```

## Future Enhancements

- [ ] Add logo to README.md
- [ ] Create logo variants (light/dark mode specific if needed)
- [ ] Add loading states for logo images
- [ ] Consider SVG version for better scalability
- [ ] Add social media preview images (OG images)
