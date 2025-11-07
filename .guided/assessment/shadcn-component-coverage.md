# shadcn/ui Component Coverage

**Assessment Date:** November 7, 2025  
**Project:** ProcureFlow  
**Version:** 1.0.0

## Overview

This document provides a quick reference of shadcn/ui component adoption status in ProcureFlow. It shows which components are currently used, which are planned for migration, and where they will be implemented.

---

## Component Coverage Table

| shadcn Component    | Used?                        | Where (Feature/Area)                       | Notes (Variants, Important Patterns)                                                                                                                                                                                                                                                                                         |
| ------------------- | ---------------------------- | ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **accordion**       | No                           | N/A                                        | Future: FAQ sections, collapsible content                                                                                                                                                                                                                                                                                    |
| **alert**           | Planned                      | Empty states, errors                       | Use for empty cart, product not found, validation errors. Variants: default, destructive, info                                                                                                                                                                                                                               |
| **alert-dialog**    | Planned                      | Delete confirmations                       | Future: destructive actions requiring confirmation                                                                                                                                                                                                                                                                           |
| **aspect-ratio**    | No                           | N/A                                        | Future: image containers if needed                                                                                                                                                                                                                                                                                           |
| **avatar**          | Planned                      | UserMenu, future profiles                  | Replace custom initials badge in UserMenu                                                                                                                                                                                                                                                                                    |
| **badge**           | Planned                      | Catalog, Sidebar                           | Replace 3+ custom badge implementations. Variants: default, secondary, destructive. Used for: category tags, cart count, status indicators                                                                                                                                                                                   |
| **breadcrumb**      | No                           | N/A                                        | Future: navigation breadcrumbs if multi-level structure added                                                                                                                                                                                                                                                                |
| **button**          | ✅ Yes                       | All features (catalog, cart, agent, login) | **Well-adopted.** Variants: default, secondary, outline, ghost, destructive. Sizes: default, sm, lg, icon. Used for all primary/secondary actions.                                                                                                                                                                           |
| **button-group**    | No                           | N/A                                        | Future: grouped button controls                                                                                                                                                                                                                                                                                              |
| **calendar**        | No                           | N/A                                        | Future: date selection for delivery dates, filtering                                                                                                                                                                                                                                                                         |
| **card**            | Planned                      | All features (9+ instances)                | **CRITICAL migration.** Replace all custom cards. Structure: Card + CardHeader + CardContent + CardFooter. Used in: login, catalog (register form, table wrapper, product detail), cart (items, summary, empty state), agent (chat container)                                                                                |
| **carousel**        | No                           | N/A                                        | Future: image galleries, featured items                                                                                                                                                                                                                                                                                      |
| **chart**           | No                           | N/A                                        | Future: analytics, reporting dashboards                                                                                                                                                                                                                                                                                      |
| **checkbox**        | Planned                      | Future multi-select                        | Future: bulk actions, filters, settings                                                                                                                                                                                                                                                                                      |
| **collapsible**     | No                           | N/A                                        | Future: collapsible sections (alternative to Accordion)                                                                                                                                                                                                                                                                      |
| **command**         | No                           | N/A                                        | Future: command palette (⌘K) for power users                                                                                                                                                                                                                                                                                 |
| **context-menu**    | No                           | N/A                                        | Future: right-click menus on items                                                                                                                                                                                                                                                                                           |
| **dialog**          | Planned                      | Future modals                              | Future: item details modal, confirmation dialogs (non-destructive)                                                                                                                                                                                                                                                           |
| **drawer**          | No                           | N/A                                        | Future: mobile bottom sheets, side drawers                                                                                                                                                                                                                                                                                   |
| **dropdown-menu**   | ✅ Yes (installed, not used) | **MIGRATION NEEDED: UserMenu**             | **Installed but not actively used.** Replace UserMenu custom dropdown with this. Variants: default, destructive (for logout?). Pattern: DropdownMenu + DropdownMenuTrigger + DropdownMenuContent + DropdownMenuItem + DropdownMenuSeparator                                                                                  |
| **empty**           | No                           | N/A                                        | Potential alternative to custom empty states (use Alert instead)                                                                                                                                                                                                                                                             |
| **field**           | No                           | N/A                                        | Form field wrapper (use with Form component)                                                                                                                                                                                                                                                                                 |
| **form**            | Planned                      | All forms (login, register, etc.)          | Future: react-hook-form integration for validation. Would replace custom form layouts. Use with Input, Textarea, Select, Label, etc.                                                                                                                                                                                         |
| **hover-card**      | No                           | N/A                                        | Future: hover previews on items, user profiles                                                                                                                                                                                                                                                                               |
| **input**           | Planned                      | All forms (login, catalog, agent, etc.)    | **HIGH PRIORITY.** Replace 7+ custom input implementations. Types: text, email, password, number, search. Pattern: Input with icon (absolute positioned wrapper).                                                                                                                                                            |
| **input-group**     | No                           | N/A                                        | Future: input with prefix/suffix (e.g., currency symbol)                                                                                                                                                                                                                                                                     |
| **input-otp**       | No                           | N/A                                        | Future: OTP/2FA if authentication is enhanced                                                                                                                                                                                                                                                                                |
| **item**            | No                           | N/A                                        | Generic item component (not commonly used)                                                                                                                                                                                                                                                                                   |
| **kbd**             | No                           | N/A                                        | Future: keyboard shortcut indicators                                                                                                                                                                                                                                                                                         |
| **label**           | Planned                      | All forms                                  | **HIGH PRIORITY.** Add to all form fields for accessibility. Used with Input, Textarea, Checkbox, Radio, Switch, Select.                                                                                                                                                                                                     |
| **menubar**         | No                           | N/A                                        | Future: top-level menu bar (desktop app style)                                                                                                                                                                                                                                                                               |
| **navigation-menu** | No                           | N/A                                        | Future: complex navigation (dropdown menus from navbar)                                                                                                                                                                                                                                                                      |
| **pagination**      | Planned                      | Catalog, future lists                      | Future: paginate catalog items, search results                                                                                                                                                                                                                                                                               |
| **popover**         | Planned                      | Future filters, contextual help            | Future: advanced search filters, help tooltips                                                                                                                                                                                                                                                                               |
| **progress**        | Planned                      | Future uploads, multi-step                 | Future: file upload progress, multi-step form progress                                                                                                                                                                                                                                                                       |
| **radio-group**     | Planned                      | Future single-choice forms                 | Future: shipping method, payment method selection                                                                                                                                                                                                                                                                            |
| **resizable**       | No                           | N/A                                        | Future: resizable panels (e.g., split view)                                                                                                                                                                                                                                                                                  |
| **scroll-area**     | No                           | N/A                                        | Future: custom scrollbars for specific areas                                                                                                                                                                                                                                                                                 |
| **select**          | Planned                      | Future form dropdowns                      | Future: category selection, sorting dropdowns. Replace native `<select>`.                                                                                                                                                                                                                                                    |
| **separator**       | Planned                      | Sidebar, cards, menus                      | Replace custom border divs. Use in: Sidebar sections, card content dividers, dropdown menu separators.                                                                                                                                                                                                                       |
| **sheet**           | Planned                      | Mobile sidebar, side panels                | **Sidebar mobile responsive.** Use for mobile sidebar drawer, or additional side panels (e.g., filters).                                                                                                                                                                                                                     |
| **sidebar**         | Planned                      | **MIGRATION NEEDED: Sidebar**              | **HIGH PRIORITY.** Replace custom Sidebar implementation with shadcn Sidebar component (new in v1+). Pattern: SidebarProvider + Sidebar + SidebarHeader + SidebarContent + SidebarGroup + SidebarMenu + SidebarMenuItem + SidebarMenuButton + SidebarFooter. Supports collapsible state, keyboard navigation, accessibility. |
| **skeleton**        | Planned                      | Future loading states                      | Future: loading placeholders for lists, tables, cards. Better UX than spinners.                                                                                                                                                                                                                                              |
| **slider**          | No                           | N/A                                        | Future: range filters (e.g., price range)                                                                                                                                                                                                                                                                                    |
| **sonner**          | ✅ Yes                       | All features (toast notifications)         | **Already integrated.** Uses Toaster component with theme integration. Called via `toast()` from sonner. Variants: success, error, info, warning, loading. **No changes needed.** ✅                                                                                                                                         |
| **spinner**         | Planned                      | Loading states                             | Potential replacement for custom Loader2 usage. Sizes and variants.                                                                                                                                                                                                                                                          |
| **switch**          | Planned                      | Future settings                            | Future: boolean settings (e.g., enable notifications, dark mode preference)                                                                                                                                                                                                                                                  |
| **table**           | Planned                      | Catalog items list                         | **HIGH PRIORITY.** Replace custom HTML table. Structure: Table + TableHeader + TableBody + TableRow + TableHead + TableCell + TableCaption. Used in: catalog items list. Improves accessibility and styling consistency.                                                                                                     |
| **tabs**            | Planned                      | Future tabbed interfaces                   | Future: product detail tabs (description, specs, reviews), settings tabs                                                                                                                                                                                                                                                     |
| **textarea**        | Planned                      | Forms (register, agent chat)               | **HIGH PRIORITY.** Replace 2+ custom textarea implementations. Used in: catalog register form (description), agent chat (message input). Auto-resize support.                                                                                                                                                                |
| **toast**           | No                           | N/A                                        | Alternative to Sonner (already using Sonner, no need for this)                                                                                                                                                                                                                                                               |
| **toggle**          | No                           | N/A                                        | Future: toggle buttons (e.g., view mode: grid/list)                                                                                                                                                                                                                                                                          |
| **toggle-group**    | No                           | N/A                                        | Future: grouped toggles (e.g., filter options)                                                                                                                                                                                                                                                                               |
| **tooltip**         | Planned                      | All interactive elements                   | **HIGH PRIORITY.** Replace `title` attributes. Use on: Sidebar collapse button, table action buttons, icon buttons. Pattern: TooltipProvider + Tooltip + TooltipTrigger + TooltipContent.                                                                                                                                    |

---

## Summary by Status

### ✅ Already Used (2 components)

1. **button** - Well-integrated across all features
2. **sonner** - Toast notifications fully implemented

### 🔄 Installed but Not Used (1 component)

1. **dropdown-menu** - Installed, needs to replace UserMenu custom dropdown

### 📋 Planned for Migration (17 components)

**High Priority (Core UI):**

1. **input** - Replace 7+ custom inputs
2. **textarea** - Replace 2+ custom textareas
3. **label** - Add to all form fields
4. **card** - Replace 9+ custom cards
5. **table** - Replace custom catalog table
6. **sidebar** - Replace custom sidebar
7. **badge** - Replace 3+ custom badges
8. **alert** - Use for empty states, errors

**Medium Priority (Enhancements):** 9. **tooltip** - Replace title attributes 10. **separator** - Replace custom borders 11. **avatar** - Use in UserMenu 12. **sheet** - Mobile sidebar 13. **dialog** - Future modals 14. **skeleton** - Loading states 15. **progress** - Future progress indicators

**Lower Priority (Forms & Controls):** 16. **checkbox** - Future multi-select 17. **radio-group** - Future single-choice 18. **select** - Future dropdowns 19. **switch** - Future settings 20. **form** - Future validation integration

### ❌ Not Planned (23 components)

Components not currently needed but available for future features:

- accordion, alert-dialog, aspect-ratio, breadcrumb, button-group, calendar, carousel, chart, collapsible, command, context-menu, drawer, empty, field, hover-card, input-group, input-otp, item, kbd, menubar, navigation-menu, pagination, resizable, scroll-area, slider, tabs, toast, toggle, toggle-group

---

## Migration Priority by Impact

### Phase 1 - Core Primitives (Foundation)

- ✅ **button** (already done)
- **input**, **textarea**, **label** (forms)
- Replace UserMenu with **dropdown-menu**

### Phase 2 - Structure (Visual Impact)

- **card** (9+ instances, biggest visual change)
- **sidebar** (complete navigation replacement)
- **table** (catalog display)

### Phase 3 - Enhancements (Polish)

- **badge** (tags and indicators)
- **alert** (empty states and errors)
- **tooltip** (better UX)
- **separator** (cleaner dividers)

### Phase 4 - Advanced (Future Features)

- **sheet** (mobile responsiveness)
- **dialog**, **alert-dialog** (modals)
- **skeleton**, **progress** (loading states)
- **avatar** (user profiles)

### Phase 5 - Forms & Controls (When Needed)

- **select**, **checkbox**, **radio-group**, **switch** (advanced forms)
- **form** (validation integration)

---

## Component Usage Patterns

### Most Common Patterns After Migration

1. **Button** - All CTAs, icon buttons, link buttons
   - `<Button variant="default|secondary|outline|ghost|destructive" size="default|sm|lg|icon">`

2. **Card** - All content containers
   - `<Card><CardHeader><CardTitle/></CardHeader><CardContent>...</CardContent><CardFooter>...</CardFooter></Card>`

3. **Input** - All text inputs
   - `<div><Label>Email</Label><Input type="email" placeholder="..." /></div>`

4. **DropdownMenu** - User menu, future dropdowns
   - `<DropdownMenu><DropdownMenuTrigger>...</DropdownMenuTrigger><DropdownMenuContent>...</DropdownMenuContent></DropdownMenu>`

5. **Table** - Data tables
   - `<Table><TableHeader><TableRow><TableHead>...</TableHead></TableRow></TableHeader><TableBody>...</TableBody></Table>`

6. **Badge** - Tags, counters, status
   - `<Badge variant="default|secondary|destructive">Category</Badge>`

7. **Tooltip** - Hover hints
   - `<Tooltip><TooltipTrigger>...</TooltipTrigger><TooltipContent>Hint</TooltipContent></Tooltip>`

---

## Theming & Customization Notes

### Current Theme Integration

- Uses CSS variables for theming (background, foreground, primary, etc.)
- next-themes integration for dark mode
- Tailwind 4.0 with @tailwindcss/postcss

### shadcn Components and Theme

All shadcn components use the same CSS variable system:

- `bg-background`, `text-foreground`
- `bg-card`, `text-card-foreground`
- `bg-primary`, `text-primary-foreground`
- `bg-accent`, `text-accent-foreground`
- `border-border`, `ring-ring`

**No theme conflicts expected.** shadcn components will adopt existing theme seamlessly.

---

## Installation Commands

### Install Components Needed for Migration

```bash
# Phase 1 - Core Primitives
npx shadcn@latest add input textarea label

# Phase 2 - Structure
npx shadcn@latest add card sidebar table

# Phase 3 - Enhancements
npx shadcn@latest add badge alert tooltip separator avatar

# Phase 4 - Advanced
npx shadcn@latest add sheet dialog alert-dialog skeleton progress

# Phase 5 - Forms & Controls (when needed)
npx shadcn@latest add select checkbox radio-group switch form
```

### Components Already Installed

```bash
# Already available (no need to reinstall)
# - button
# - dropdown-menu
# - sonner
```

---

## Expected Component Count After Full Migration

| Status                   | Count | Percentage                          |
| ------------------------ | ----- | ----------------------------------- |
| **Actively Used**        | ~20   | 33% of available shadcn components  |
| **Available (not used)** | ~35   | 58% (available for future features) |
| **Total shadcn Library** | ~60   | 100%                                |

After completing the migration plan, ProcureFlow will use approximately **20 shadcn components**, covering all core UI needs while maintaining a clean, consistent design system aligned with shadcn's patterns and best practices.

---

**Next Steps:** Proceed to `shadcn-redesign-migration-plan.md` for the detailed phased migration strategy.
