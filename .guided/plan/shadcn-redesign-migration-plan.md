# shadcn/ui Redesign Migration Plan

**Assessment Date:** November 7, 2025  
**Project:** ProcureFlow  
**Version:** 1.0.0

## Overview

This document outlines a phased, incremental migration plan to adopt shadcn/ui components as the primary UI building blocks for ProcureFlow, replacing custom Tailwind-only implementations with standardized, accessible shadcn components.

### Migration Goals

1. **Standardize UI:** Replace 85% custom UI with shadcn components
2. **Improve Accessibility:** Leverage shadcn's built-in ARIA attributes and keyboard navigation
3. **Reduce Code Duplication:** Eliminate 9+ custom card implementations, 7+ custom input patterns, etc.
4. **Maintain Theme Consistency:** Preserve existing theme tokens and dark mode support
5. **Ensure Zero Regressions:** Incremental migration with quality gates at each phase

### Migration Scope

- **Total Components to Migrate:** 34 custom UI blocks
- **shadcn Components to Install:** ~17 new components
- **Estimated Effort:** 5 phases, ~40-60 hours total
- **Risk Level:** Medium (visual changes, but incremental approach minimizes risk)

---

## Migration Phases

### Phase 1 – Core Primitives (Forms & Buttons)

**Goal:** Replace all custom form inputs with shadcn primitives and standardize button usage.

#### Scope

**Components from Mapping Table:**
1. Search input (catalog)
2. Login email/password inputs
3. Register form inputs (name, category, price)
4. Register textarea (description)
5. Chat message textarea
6. Quantity number input (partial - use shadcn Input + Button)
7. Demo credentials button
8. Custom table action buttons

**shadcn Components to Install:**
- `input`
- `textarea`
- `label`

#### Tasks

1. **Install shadcn Components**
   ```bash
   npx shadcn@latest add input textarea label
   ```

2. **Replace Login Form Inputs** (`app/(public)/page.tsx`)
   - Replace custom email input with `<Input type="email" />`
   - Replace custom password input with `<Input type="password" />`
   - Add `<Label>` for each input (accessibility)
   - Update styling to use shadcn patterns

3. **Replace Catalog Search Input** (`src/features/catalog/components/CatalogPageContent.tsx`)
   - Replace custom search input with shadcn `<Input />`
   - Keep Search icon with wrapper pattern (absolute positioning)

4. **Replace Register Form Inputs** (`src/features/catalog/components/CatalogPageContent.tsx`)
   - Replace all text inputs with `<Input />`
   - Replace textarea with `<Textarea />`
   - Add `<Label>` for each field
   - Consider wrapping in shadcn Form component (optional for Phase 1, recommended for Phase 5)

5. **Replace Agent Chat Input** (`src/features/agent/components/AgentChatPageContent.tsx`)
   - Replace custom textarea with `<Textarea />`
   - Keep `resize-none` and `max-h-32` utilities

6. **Replace Quantity Input** (`src/features/catalog/components/ProductDetailPageContent.tsx`)
   - Use shadcn `<Input type="number" />` for the input
   - Use shadcn `<Button size="icon-sm" variant="ghost">` for +/- buttons
   - Keep custom composition/layout

7. **Standardize All Button Usage**
   - Review all Button usages across the app
   - Replace custom inline buttons (table actions) with shadcn `<Button size="sm">`
   - Ensure consistent variant usage (default, secondary, outline, ghost)
   - Replace "Demo credentials" button with `<Button variant="outline">`

#### Considerations

- **i18n:** All placeholder text and labels must remain i18n-aware (currently hardcoded, but plan for future i18n)
- **Theming:** shadcn Input/Textarea use same CSS variables - no theme conflicts
- **Validation:** For now, keep basic HTML5 validation. Full validation with react-hook-form is Phase 5.

#### Quality Checks

Run after completing all tasks:
```bash
cd apps/web
pnpm lint          # Must pass with 0 errors
pnpm type-check    # Must pass with 0 errors
pnpm test          # Must pass (if tests exist)
pnpm build         # Must build successfully
```

**Manual Testing:**
- [ ] Login form works (demo credentials, validation)
- [ ] Catalog search filters items
- [ ] Register form accepts input and validates
- [ ] Agent chat sends messages
- [ ] Quantity input increments/decrements correctly
- [ ] All buttons respond to clicks
- [ ] Dark mode works on all new inputs

**Sign-off:** All automated checks pass + manual testing complete before proceeding to Phase 2.

---

### Phase 2 – Layout & Structure (Cards & Sidebar)

**Goal:** Replace all custom cards with shadcn Card and migrate Sidebar to shadcn Sidebar component.

#### Scope

**Components from Mapping Table:**
1. Login card
2. Catalog register form card
3. Catalog table card
4. Cart item cards (multiple)
5. Empty cart card
6. Product detail card
7. Product not found card
8. Order summary card
9. Agent chat container card
10. Collapsible Sidebar (complete replacement)

**shadcn Components to Install:**
- `card`
- `sidebar`
- `separator`

#### Tasks

1. **Install shadcn Components**
   ```bash
   npx shadcn@latest add card sidebar separator
   ```

2. **Replace Login Card** (`app/(public)/page.tsx`)
   - Wrap form in `<Card>`
   - Move title "Sign in to your account" to `<CardHeader><CardTitle>`
   - Wrap form fields in `<CardContent>`
   - Move demo credentials section to `<CardFooter>`
   - Remove custom `bg-white dark:bg-gray-800 rounded-xl shadow-lg border` classes

3. **Replace Catalog Register Form Card** (`src/features/catalog/components/CatalogPageContent.tsx`)
   - Wrap form in `<Card>`
   - Move "Register New Item" title to `<CardHeader><CardTitle>`
   - Wrap form fields in `<CardContent>`
   - Move buttons to `<CardFooter>` with proper button alignment

4. **Replace Catalog Table Card** (`src/features/catalog/components/CatalogPageContent.tsx`)
   - Wrap table in `<Card>` (no header/footer needed, just wrapper)
   - Keep `overflow-x-auto` for responsive behavior

5. **Replace Cart Item Cards** (`src/features/cart/components/CartPageContent.tsx`)
   - Each cart item becomes `<Card><CardContent>`
   - Keep quantity controls and subtotal inside CardContent
   - Consider using `<Separator />` between item info and quantity controls

6. **Replace Empty Cart Card** (`src/features/cart/components/CartPageContent.tsx`)
   - Option A: Use `<Card>` with centered content
   - Option B: Use `<Alert>` (info variant) - recommended for empty states
   - Keep icon, heading, description, CTA button

7. **Replace Product Detail Card** (`src/features/catalog/components/ProductDetailPageContent.tsx`)
   - Wrap product info in `<Card>`
   - Product header (name, price, badges) → `<CardHeader>`
   - Description and details grid → `<CardContent>`
   - Add to cart section → `<CardFooter>` or separate Card below

8. **Replace Product Not Found Card** (`src/features/catalog/components/ProductDetailPageContent.tsx`)
   - Replace with `<Alert variant="destructive">` (better semantics)
   - Keep icon, heading, description, back button

9. **Replace Order Summary Card** (`src/features/cart/components/CartPageContent.tsx`)
   - Wrap in `<Card>`
   - "Order Summary" → `<CardHeader><CardTitle>`
   - Summary details → `<CardContent>`
   - Checkout button → `<CardFooter>`

10. **Replace Agent Chat Container** (`src/features/agent/components/AgentChatPageContent.tsx`)
    - Wrap chat in `<Card>`
    - Chat messages area → `<CardContent>` with scroll
    - Input form → `<CardFooter>` with `<Separator />` above

11. **Replace Custom Sidebar with shadcn Sidebar** (`src/components/layout/Sidebar.tsx`)
    - **MAJOR REPLACEMENT:** This is a complete rewrite
    - Use shadcn Sidebar component pattern:
      ```tsx
      <SidebarProvider>
        <Sidebar>
          <SidebarHeader>
            {/* Logo and title */}
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link href="/catalog">
                      <Package /> Catalog
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                {/* More nav items */}
              </SidebarMenu>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter>
            {/* Theme toggle and UserMenu */}
          </SidebarFooter>
        </Sidebar>
      </SidebarProvider>
      ```
    - Migrate collapsible state to SidebarProvider
    - Migrate active state highlighting
    - Keep cart badge on nav item (use Badge component in Phase 3)
    - Update AppShell to work with new Sidebar component

#### Considerations

- **Visual Changes:** Cards will have consistent padding, rounded corners, and shadows
- **Sidebar:** Major behavioral change - test collapsing, nav item clicks, mobile responsiveness
- **Theme:** Ensure all cards and sidebar respect dark mode

#### Quality Checks

Run after completing all tasks:
```bash
cd apps/web
pnpm lint          # Must pass
pnpm type-check    # Must pass
pnpm test          # Must pass
pnpm build         # Must build successfully
```

**Manual Testing:**
- [ ] All cards render correctly (login, catalog, cart, agent, product detail)
- [ ] Sidebar collapses and expands
- [ ] Navigation items highlight active route
- [ ] Cart badge shows on sidebar nav item
- [ ] Empty states display correctly
- [ ] Product detail card shows all sections
- [ ] Dark mode works on all cards and sidebar

**Sign-off:** All checks pass + comprehensive visual review before proceeding to Phase 3.

---

### Phase 3 – Data Display (Tables, Badges, Alerts)

**Goal:** Replace custom table, badges, and empty states with shadcn equivalents.

#### Scope

**Components from Mapping Table:**
1. Catalog items table
2. Category badge
3. Cart count badge
4. Status badge
5. Empty cart state (if not done in Phase 2 with Alert)
6. No search results state
7. Product not found state (if not done in Phase 2 with Alert)

**shadcn Components to Install:**
- `table`
- `badge`
- `alert`

#### Tasks

1. **Install shadcn Components**
   ```bash
   npx shadcn@latest add table badge alert
   ```

2. **Replace Catalog Items Table** (`src/features/catalog/components/CatalogPageContent.tsx`)
   - Replace custom `<table>` with shadcn Table components:
     ```tsx
     <Table>
       <TableHeader>
         <TableRow>
           <TableHead>Name</TableHead>
           <TableHead>Category</TableHead>
           {/* More headers */}
         </TableRow>
       </TableHeader>
       <TableBody>
         {items.map(item => (
           <TableRow key={item.id}>
             <TableCell>{item.name}</TableCell>
             {/* More cells */}
           </TableRow>
         ))}
       </TableBody>
     </Table>
     ```
   - Keep responsive wrapper (`overflow-x-auto`)
   - Ensure hover states work on TableRow
   - Update empty state to use Alert or table caption

3. **Replace Category Badge** (`src/features/catalog/components/CatalogPageContent.tsx`)
   - Replace custom badge with `<Badge variant="secondary">{item.category}</Badge>`
   - Remove custom classes: `px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-primary/10 text-primary`

4. **Replace Cart Count Badge** (`src/components/layout/Sidebar.tsx`)
   - Replace custom absolute-positioned badge with `<Badge variant="destructive">{count}</Badge>`
   - May need wrapper div with relative positioning
   - Ensure badge displays correctly on nav icon

5. **Replace Status Badge** (`src/features/catalog/components/ProductDetailPageContent.tsx`)
   - Replace custom status badges with shadcn Badge
   - Use conditional variant based on status:
     ```tsx
     <Badge variant={item.status === ItemStatus.Active ? "default" : "secondary"}>
       {item.status === ItemStatus.Active ? "Available" : "Inactive"}
     </Badge>
     ```

6. **Replace Empty States with Alert**
   - **Empty Cart** (`src/features/cart/components/CartPageContent.tsx`):
     ```tsx
     <Alert>
       <ShoppingCart className="h-4 w-4" />
       <AlertTitle>Your cart is empty</AlertTitle>
       <AlertDescription>
         Add items from the catalog to get started.
         <Button asChild className="mt-2">
           <Link href="/catalog">Browse Catalog</Link>
         </Button>
       </AlertDescription>
     </Alert>
     ```
   - **No Search Results** (`src/features/catalog/components/CatalogPageContent.tsx`):
     - Extract from table tbody and place above table as Alert
   - **Product Not Found** (`src/features/catalog/components/ProductDetailPageContent.tsx`):
     - Replace custom error card with `<Alert variant="destructive">`

#### Considerations

- **Table Accessibility:** shadcn Table includes proper ARIA roles
- **Badge Consistency:** All badges will have uniform styling
- **Alert Semantics:** Better than custom divs for empty/error states

#### Quality Checks

Run after completing all tasks:
```bash
cd apps/web
pnpm lint
pnpm type-check
pnpm test
pnpm build
```

**Manual Testing:**
- [ ] Catalog table displays items correctly
- [ ] Table is responsive (scrolls horizontally on small screens)
- [ ] Category badges render correctly
- [ ] Cart badge shows count on sidebar
- [ ] Status badges show correct variant
- [ ] Empty cart alert displays
- [ ] No search results alert shows when no items match
- [ ] Product not found alert displays for invalid ID

**Sign-off:** All checks pass + visual verification of tables, badges, and alerts.

---

### Phase 4 – Overlays & Interactions (Dropdowns, Tooltips, Sheets)

**Goal:** Replace custom dropdown (UserMenu), add tooltips, and prepare for dialogs/sheets.

#### Scope

**Components from Mapping Table:**
1. UserMenu (replace custom dropdown with DropdownMenu)
2. Theme toggle (use Button, optionally DropdownMenu for light/dark/system)
3. Tooltips (replace title attributes)
4. Future: Dialog, AlertDialog, Sheet (add but don't implement yet)

**shadcn Components to Install:**
- `tooltip`
- `avatar`
- `dialog`
- `alert-dialog`
- `sheet`

#### Tasks

1. **Install shadcn Components**
   ```bash
   npx shadcn@latest add tooltip avatar dialog alert-dialog sheet
   ```

2. **Replace UserMenu with DropdownMenu** (`src/components/layout/UserMenu.tsx`)
   - **MAJOR REPLACEMENT:** Remove custom dropdown implementation
   - Replace with shadcn DropdownMenu (already installed):
     ```tsx
     <DropdownMenu>
       <DropdownMenuTrigger asChild>
         <Button variant="ghost" className="...">
           <Avatar>
             <AvatarFallback>{user.initials}</AvatarFallback>
           </Avatar>
           {!collapsed && (
             <>
               <div>
                 <p>{user.name}</p>
                 <p>{user.email}</p>
               </div>
               <ChevronUp className="..." />
             </>
           )}
         </Button>
       </DropdownMenuTrigger>
       <DropdownMenuContent align="end">
         <DropdownMenuItem onClick={...}>
           <User /> Profile
         </DropdownMenuItem>
         <DropdownMenuItem onClick={...}>
           <Settings /> Settings
         </DropdownMenuItem>
         <DropdownMenuSeparator />
         <DropdownMenuItem variant="destructive" onClick={...}>
           <LogOut /> Logout
         </DropdownMenuItem>
       </DropdownMenuContent>
     </DropdownMenu>
     ```
   - Remove manual click-outside detection (DropdownMenu handles this)
   - Use shadcn Avatar for user avatar

3. **Enhance Theme Toggle** (`src/components/layout/ThemeToggle.tsx`)
   - Option A: Keep as Button (ghost variant)
   - Option B (recommended): Use DropdownMenu for light/dark/system selection:
     ```tsx
     <DropdownMenu>
       <DropdownMenuTrigger asChild>
         <Button variant="ghost" size="icon">
           <Sun className="dark:hidden" />
           <Moon className="hidden dark:block" />
         </Button>
       </DropdownMenuTrigger>
       <DropdownMenuContent align="end">
         <DropdownMenuItem onClick={() => setTheme("light")}>
           <Sun /> Light
         </DropdownMenuItem>
         <DropdownMenuItem onClick={() => setTheme("dark")}>
           <Moon /> Dark
         </DropdownMenuItem>
         <DropdownMenuItem onClick={() => setTheme("system")}>
           <Monitor /> System
         </DropdownMenuItem>
       </DropdownMenuContent>
     </DropdownMenu>
     ```

4. **Add Tooltips Throughout App**
   - Wrap app in `<TooltipProvider>` (in root layout or AppShell)
   - Replace `title` attributes with Tooltip:
     - Sidebar collapse button
     - Table action buttons (Details, Add to Cart)
     - Icon-only buttons
   - Pattern:
     ```tsx
     <Tooltip>
       <TooltipTrigger asChild>
         <Button size="icon" variant="ghost">
           <Icon />
         </Button>
       </TooltipTrigger>
       <TooltipContent>
         <p>Tooltip text</p>
       </TooltipContent>
     </Tooltip>
     ```

5. **Prepare for Future Dialogs and Sheets**
   - Dialog and AlertDialog are installed but not yet used
   - Sheet is installed for future mobile sidebar or side panels
   - Document usage patterns for future features:
     - Dialog: Item details modal, image zoom
     - AlertDialog: Delete confirmations ("Are you sure?")
     - Sheet: Mobile sidebar drawer, filter panels

#### Considerations

- **DropdownMenu:** Keyboard navigation and accessibility built-in
- **Tooltips:** Must wrap app in TooltipProvider (add to root layout)
- **Avatar:** Better than custom initials badge

#### Quality Checks

Run after completing all tasks:
```bash
cd apps/web
pnpm lint
pnpm type-check
pnpm test
pnpm build
```

**Manual Testing:**
- [ ] UserMenu dropdown opens on click
- [ ] UserMenu closes on outside click or Escape key
- [ ] UserMenu items trigger correct actions
- [ ] Avatar displays user initials correctly
- [ ] Theme toggle works (if DropdownMenu, test all 3 options)
- [ ] Tooltips appear on hover
- [ ] Tooltips dismiss correctly
- [ ] Keyboard navigation works for dropdowns and tooltips

**Sign-off:** All checks pass + thorough interaction testing.

---

### Phase 5 – Feature-Specific Refinements & Polish

**Goal:** Clean up remaining custom patterns, add enhancements, and ensure full consistency.

#### Scope

**Enhancements:**
1. Add Skeleton for loading states
2. Add Progress for future features
3. Add form validation with react-hook-form + shadcn Form component
4. Add Separator where needed (replace custom borders)
5. Review and standardize spacing, padding, and visual hierarchy

**Optional (if time permits):**
- Add Select, Checkbox, RadioGroup, Switch for future forms
- Add Pagination for catalog (if implementing paginated lists)
- Add Tabs for potential tabbed interfaces

#### Tasks

1. **Install Remaining Components**
   ```bash
   npx shadcn@latest add skeleton progress form select checkbox radio-group switch pagination separator
   ```

2. **Add Skeleton Loading States**
   - Replace Loader2 spinners in lists/tables with Skeleton placeholders
   - Example: Catalog table loading state
     ```tsx
     {isLoading ? (
       <TableBody>
         {[...Array(5)].map((_, i) => (
           <TableRow key={i}>
             <TableCell><Skeleton className="h-4 w-32" /></TableCell>
             <TableCell><Skeleton className="h-4 w-20" /></TableCell>
             {/* More skeleton cells */}
           </TableRow>
         ))}
       </TableBody>
     ) : (
       <TableBody>{/* Actual rows */}</TableBody>
     )}
     ```

3. **Add Form Validation (Login, Register)**
   - Integrate react-hook-form with shadcn Form component
   - Add zod schema for validation
   - Example (Login form):
     ```tsx
     <Form {...form}>
       <form onSubmit={form.handleSubmit(onSubmit)}>
         <FormField
           control={form.control}
           name="email"
           render={({ field }) => (
             <FormItem>
               <FormLabel>Email</FormLabel>
               <FormControl>
                 <Input type="email" placeholder="your@email.com" {...field} />
               </FormControl>
               <FormMessage />
             </FormItem>
           )}
         />
         {/* More fields */}
         <Button type="submit">Sign In</Button>
       </form>
     </Form>
     ```

4. **Replace Custom Borders with Separator**
   - Sidebar sections: Use `<Separator />` between nav and footer
   - Card content: Use `<Separator />` to divide sections
   - Dropdown menus: Already using DropdownMenuSeparator

5. **Standardize Spacing and Visual Hierarchy**
   - Review all pages for consistent spacing (p-4, p-6, gap-4, gap-6)
   - Ensure headings use consistent text sizes (text-2xl, text-3xl)
   - Ensure all interactive elements have proper focus states

6. **Add Optional Components (If Needed)**
   - **Select:** For category selection in register form (instead of text input)
   - **Checkbox:** For future multi-select features (bulk actions)
   - **RadioGroup:** For future single-choice UI (e.g., shipping method)
   - **Switch:** For future boolean settings
   - **Pagination:** For catalog if implementing paginated lists

7. **Final Review and Cleanup**
   - Remove unused custom components and styles
   - Consolidate any remaining duplicate code
   - Ensure all components are documented (JSDoc comments)
   - Update README with new component patterns

#### Considerations

- **Validation:** Adds form validation library (zod, react-hook-form) - increases bundle size slightly
- **Skeleton:** Better UX than spinners for list/table loading
- **Polish:** This phase is about refinement, not major changes

#### Quality Checks

Run after completing all tasks:
```bash
cd apps/web
pnpm lint
pnpm type-check
pnpm test
pnpm build
```

**Manual Testing:**
- [ ] All loading states show skeletons
- [ ] Form validation works (shows errors, prevents invalid submission)
- [ ] Separators appear where custom borders were
- [ ] All pages have consistent spacing and visual hierarchy
- [ ] New form controls (Select, Checkbox, etc.) work if implemented
- [ ] No console errors or warnings

**Sign-off:** All checks pass + final visual review of entire app.

---

## Post-Migration Checklist

After completing all 5 phases, verify the following:

### Functional Completeness
- [ ] All mapped components have been migrated or explicitly marked as intentionally custom
- [ ] No duplicate custom primitives where shadcn provides equivalents
- [ ] Theme and spacing remain consistent across all pages
- [ ] Dark mode works on all shadcn components
- [ ] All interactive elements are keyboard-accessible

### Code Quality
- [ ] Zero linting errors (`pnpm lint`)
- [ ] Zero TypeScript errors (`pnpm type-check`)
- [ ] All tests pass (`pnpm test`)
- [ ] Build succeeds (`pnpm build`)
- [ ] No unused imports or components

### Documentation
- [ ] Updated README with new component patterns
- [ ] Updated component documentation (JSDoc)
- [ ] Created usage examples for key components
- [ ] Documented any intentionally custom components

### Visual Quality
- [ ] Consistent spacing and padding across all pages
- [ ] Consistent typography hierarchy
- [ ] Proper focus states on all interactive elements
- [ ] Smooth transitions and animations
- [ ] Responsive design works on mobile, tablet, desktop

### Accessibility
- [ ] All form fields have labels
- [ ] All buttons have accessible names
- [ ] All interactive elements are keyboard-navigable
- [ ] Proper ARIA attributes on complex components
- [ ] Color contrast meets WCAG AA standards

### Performance
- [ ] Bundle size increase is acceptable (shadcn is tree-shakeable)
- [ ] No runtime performance regressions
- [ ] Images and assets optimized
- [ ] Lazy loading implemented where appropriate

---

## Rollback Strategy

If issues are discovered after deploying a phase:

1. **Immediate Rollback:** Revert to previous git commit
2. **Identify Issue:** Review errors, test failures, or visual regressions
3. **Fix and Re-test:** Address the issue in a separate branch
4. **Re-deploy:** After all quality checks pass

**Prevention:** Run all quality checks after each phase before proceeding.

---

## Standard Commands

### Quality Gate Commands

Run these commands after each phase and before final sign-off:

```bash
# Navigate to web app
cd apps/web

# Type checking (must pass with 0 errors)
pnpm type-check

# Linting (must pass with 0 errors)
pnpm lint

# Auto-fix linting issues (optional)
pnpm lint:fix

# Run tests (must pass all tests)
pnpm test

# Build for production (must succeed)
pnpm build

# Format code (ensures consistent formatting)
pnpm format   # If this script exists in package.json
# OR
npx prettier --write "src/**/*.{ts,tsx}"
```

### Development Commands

```bash
# Run dev server for manual testing
pnpm dev

# Install shadcn components (per phase)
npx shadcn@latest add [component-name]
```

---

## Timeline Estimate

| Phase | Effort (hours) | Components Changed | Risk Level |
|-------|---------------|-------------------|------------|
| **Phase 1** | 8-12 | 7 input/textarea, 1 button cleanup | Low |
| **Phase 2** | 12-16 | 9 cards, 1 sidebar (major) | Medium-High |
| **Phase 3** | 6-10 | 1 table, 3 badges, 3 alerts | Low-Medium |
| **Phase 4** | 8-12 | 1 dropdown, tooltips, 1 avatar | Medium |
| **Phase 5** | 6-10 | Skeleton, validation, polish | Low |
| **TOTAL** | **40-60** | **~35 components** | **Medium** |

**Recommended Timeline:** 2-3 sprints (depending on team capacity)

---

## Success Criteria

### Quantitative
- ✅ 85% → 15% custom UI (from 85% custom to 15% custom)
- ✅ 3 → 20+ shadcn components in active use
- ✅ 0 linting errors
- ✅ 0 TypeScript errors
- ✅ 100% test pass rate
- ✅ Successful production build

### Qualitative
- ✅ Consistent visual design across all pages
- ✅ Improved accessibility (ARIA, keyboard navigation)
- ✅ Maintainable codebase (less duplication, clear patterns)
- ✅ Developer velocity improved (reusable components)
- ✅ User experience preserved or improved

---

## Notes

- **Incremental Migration:** Each phase is self-contained and deployable
- **No Big Bang:** Avoid migrating everything at once to minimize risk
- **Quality First:** Never proceed to next phase if quality checks fail
- **Visual Review:** Manual testing is critical for UI migrations
- **Theme Consistency:** All shadcn components respect existing CSS variables

---

**Next Steps:** Review this plan with the team, prioritize phases based on business needs, and begin Phase 1 implementation. Refer to `shadcn-redesign-notes.md` for implementation tips and risk mitigation strategies.
