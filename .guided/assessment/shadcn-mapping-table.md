# shadcn/ui Mapping Table

**Assessment Date:** November 7, 2025  
**Project:** ProcureFlow  
**Version:** 1.0.0

## Introduction

This document provides a comprehensive mapping of all current UI components and blocks to their shadcn/ui equivalents. Use this table as the primary reference for migration planning and execution.

---

## Mapping Table

| Component / Block | Location (File Path) | Purpose / Notes | shadcn Equivalent(s) | Migration Notes |
|------------------|---------------------|-----------------|---------------------|----------------|
| **LAYOUT & NAVIGATION** |
| AppShell wrapper | `src/components/layout/AppShell.tsx` | Main layout container with sidebar + content area | No direct equivalent - keep custom or compose with Sheet pattern | Keep as-is (layout wrapper) but ensure it composes well with shadcn components |
| Collapsible Sidebar | `src/components/layout/Sidebar.tsx` | Collapsible navigation sidebar with nav items, badge, theme toggle, user menu | **Sidebar** (new in shadcn v1+) | **HIGH PRIORITY:** Replace entire custom Sidebar with shadcn Sidebar component. Use SidebarProvider, SidebarTrigger, SidebarContent, SidebarGroup, SidebarMenu patterns. |
| Nav item links | `src/components/layout/Sidebar.tsx` (inside map) | Navigation links with icons and active states | **Sidebar** > SidebarMenuItem + SidebarMenuButton | Migrate nav items to use SidebarMenuItem and SidebarMenuButton components with proper active state handling |
| Cart badge on nav icon | `src/components/layout/Sidebar.tsx` (absolute positioned) | Notification badge showing cart count | **Badge** | Replace custom badge (absolute positioned span) with shadcn Badge component, potentially composed with SidebarMenuButton |
| Theme toggle button | `src/components/layout/ThemeToggle.tsx` | Toggle between light/dark themes | **Button** (variant="ghost") + custom logic | Replace custom button with shadcn Button (ghost variant). Keep next-themes logic. Could also use DropdownMenu for theme selection (light/dark/system). |
| User menu dropdown | `src/components/layout/UserMenu.tsx` | User avatar + dropdown menu with profile/settings/logout | **DropdownMenu** + **Avatar** | **HIGH PRIORITY:** Replace custom dropdown (manual click-outside) with shadcn DropdownMenu. Add shadcn Avatar for user avatar. Use DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem. |
| **FORMS & INPUTS** |
| Search input (catalog) | `src/features/catalog/components/CatalogPageContent.tsx` (lines ~88-103) | Search bar with Search icon | **Input** + icon pattern | Replace custom input with shadcn Input. Use composition pattern for icon (absolute positioned within wrapper div). |
| Login email input | `app/(public)/page.tsx` (line ~69) | Email input field | **Input** (type="email") | Replace with shadcn Input component with proper email type |
| Login password input | `app/(public)/page.tsx` (line ~84) | Password input field | **Input** (type="password") | Replace with shadcn Input component with proper password type |
| Register form inputs | `src/features/catalog/components/CatalogPageContent.tsx` (lines ~129-172) | Multiple text inputs (name, category, price) | **Input** + **Label** | Replace all custom inputs with shadcn Input and Label components. Consider using **Form** component with react-hook-form for validation. |
| Register textarea | `src/features/catalog/components/CatalogPageContent.tsx` (lines ~154-165) | Multi-line description input | **Textarea** | Replace custom textarea with shadcn Textarea component |
| Quantity number input | `src/features/catalog/components/ProductDetailPageContent.tsx` (lines ~177-204) | Number input with +/- buttons | Custom composition: **Input** + **Button** (icon) | Keep as custom composition but use shadcn Input and Button (icon variant) for the +/- controls |
| Chat message textarea | `src/features/agent/components/AgentChatPageContent.tsx` (lines ~75-86) | Auto-resizing message input | **Textarea** | Replace with shadcn Textarea. Keep resize-none and max-h utilities. |
| Demo credentials button | `app/(public)/page.tsx` (line ~115) | Button to fill demo credentials | **Button** (variant="secondary" or "outline") | Replace custom button with shadcn Button (secondary or outline variant) |
| **BUTTONS** |
| Primary action buttons | Throughout app | Main CTAs (Login, Register, Checkout, Send, etc.) | ✅ **Button** (variant="default") | Already using shadcn Button - ensure all primary actions use it consistently |
| Secondary buttons | Various locations | Secondary actions (Cancel, Back, etc.) | ✅ **Button** (variant="secondary" or "outline") | Already using shadcn Button - ensure consistent variant usage |
| Icon buttons | Sidebar collapse, cart item remove, etc. | Icon-only buttons | ✅ **Button** (size="icon", variant="ghost") | Already using shadcn Button - standardize to icon size variants |
| Custom table action buttons | `src/features/catalog/components/CatalogPageContent.tsx` (lines ~297-326) | "Details" and "Add to Cart" buttons in table rows | **Button** (size="sm", variants) | Replace custom inline buttons with shadcn Button (size="sm"). Remove custom className for bg-secondary/bg-primary. |
| **DATA DISPLAY - CARDS** |
| Login card | `app/(public)/page.tsx` (line ~26) | Main login form container | **Card** + **CardHeader** + **CardContent** | Replace custom div with shadcn Card. Split header ("Sign in to your account") into CardHeader, form into CardContent, demo section could be CardFooter. |
| Catalog register form card | `src/features/catalog/components/CatalogPageContent.tsx` (lines ~125-194) | Inline registration form container | **Card** + **CardHeader** + **CardContent** + **CardFooter** | Replace custom card with shadcn Card. Title → CardHeader, form fields → CardContent, buttons → CardFooter. |
| Catalog table card | `src/features/catalog/components/CatalogPageContent.tsx` (line ~235) | Table wrapper card | **Card** (no header/footer, just wrapper) | Replace wrapper div with shadcn Card (or use card classes on the wrapper). Table overflow handling stays. |
| Cart item cards | `src/features/cart/components/CartPageContent.tsx` (lines ~101-153) | Individual cart item containers | **Card** + **CardContent** | Each cart item should be a shadcn Card with CardContent. Quantity controls and subtotal stay inside. |
| Empty cart card | `src/features/cart/components/CartPageContent.tsx` (lines ~95-106) | Empty state container | **Card** (centered content) or **Alert** | Consider using shadcn Alert (info variant) instead of custom card for empty states. Or use Card with centered content. |
| Product detail card | `src/features/catalog/components/ProductDetailPageContent.tsx` (lines ~95-239) | Large product information card | **Card** + **CardHeader** + **CardContent** | Replace custom card. Product header (name, price) → CardHeader. Description and details → CardContent sections. Add to cart could be separate CardFooter. |
| Product not found card | `src/features/catalog/components/ProductDetailPageContent.tsx` (lines ~60-72) | Error state when product not found | **Alert** (variant="destructive") or **Card** | Replace with shadcn Alert (destructive or default variant) for better semantics. |
| Order summary card | `src/features/cart/components/CartPageContent.tsx` (lines ~158-199) | Sticky cart summary sidebar | **Card** + **CardHeader** + **CardContent** + **CardFooter** | Replace custom card. "Order Summary" → CardHeader, summary details → CardContent, checkout button → CardFooter. |
| Agent chat container | `src/features/agent/components/AgentChatPageContent.tsx` (line ~57) | Chat interface container card | **Card** (structural wrapper) | Replace wrapper div with shadcn Card. Chat messages area is CardContent, input form area is CardFooter. |
| **DATA DISPLAY - TABLES** |
| Catalog items table | `src/features/catalog/components/CatalogPageContent.tsx` (lines ~235-326) | Table displaying catalog items | **Table** + **TableHeader** + **TableBody** + **TableRow** + **TableHead** + **TableCell** | Replace custom HTML table with shadcn Table component. Use TableHeader, TableBody, TableRow, TableHead, TableCell. Keep responsive wrapper with overflow-x-auto. |
| **DATA DISPLAY - BADGES** |
| Category badge | `src/features/catalog/components/CatalogPageContent.tsx` (line ~279) | Displays item category | **Badge** (variant="secondary" or custom) | Replace custom badge (`px-2 py-1 inline-flex text-xs rounded-full bg-primary/10 text-primary`) with shadcn Badge. Use variant prop or customize with className. |
| Cart count badge | `src/components/layout/Sidebar.tsx` (lines ~79-83) | Notification badge on cart icon | **Badge** (variant="destructive") | Replace custom absolute-positioned badge with shadcn Badge. May need wrapper positioning. |
| Status badge | `src/features/catalog/components/ProductDetailPageContent.tsx` (lines ~103-109, 110-116) | Product status (Active/Inactive) | **Badge** (variants: default or secondary) | Replace custom badges with shadcn Badge. Use conditional variant based on status. |
| **DATA DISPLAY - EMPTY STATES** |
| Empty cart state | `src/features/cart/components/CartPageContent.tsx` (lines ~95-106) | Shown when cart is empty | **Alert** or custom with **Card** | Use shadcn Alert (info variant) with icon, or keep as custom Card with centered content. Add "Browse Catalog" button (shadcn Button). |
| No search results | `src/features/catalog/components/CatalogPageContent.tsx` (lines ~258-264) | Shown when search returns no results | Table row with colSpan or **Alert** | Consider extracting to shadcn Alert above the table instead of inside tbody. Better UX. |
| Product not found | `src/features/catalog/components/ProductDetailPageContent.tsx` (lines ~60-72) | Error state for invalid product ID | **Alert** (variant="default" or "destructive") | Replace custom error card with shadcn Alert. Clearer semantics. |
| **FEEDBACK** |
| Toast notifications | Throughout app (using `toast()` from sonner) | Success, error, info toasts | ✅ **Toaster** (Sonner) | Already using shadcn Toaster/Sonner. No changes needed. ✅ |
| Button loading state | Multiple locations (e.g., login, checkout, add to cart) | Disabled button with loading spinner | **Button** (disabled) + Loader2 icon | Keep pattern but ensure all buttons use shadcn Button with consistent loading state (Loader2 icon + text). Could add a `loading` prop to Button for convenience. |
| Chat typing indicator | `src/features/agent/components/AgentChatPageContent.tsx` (lines ~49-62) | Three animated dots showing agent is typing | Custom (animated dots) or **Spinner** | Keep custom typing indicator for chat UX, or replace with shadcn Spinner if available. Custom is acceptable for this use case. |
| **OVERLAYS** |
| User menu dropdown (custom) | `src/components/layout/UserMenu.tsx` | User menu with manual dropdown | **DropdownMenu** (already installed but not used) | **HIGH PRIORITY:** Replace entire custom dropdown implementation with shadcn DropdownMenu. Use DropdownMenuTrigger (user avatar button), DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator. Remove manual click-outside logic. |
| DropdownMenu (unused) | `src/components/ui/dropdown-menu.tsx` | Installed but not used | ✅ **DropdownMenu** | Already available. Need to adopt in UserMenu. |
| **NOT YET IMPLEMENTED** |
| Dialogs / Modals | N/A | Delete confirmations, detail modals, etc. | **Dialog** + **AlertDialog** | Add shadcn Dialog for general modals. Use AlertDialog for destructive confirmations (e.g., "Delete item?"). |
| Tooltips | N/A | Hover hints on buttons and icons | **Tooltip** | Add shadcn Tooltip to replace `title` attributes (e.g., Sidebar collapse button, table action buttons). |
| Sheets / Drawers | N/A | Mobile sidebar, side panels | **Sheet** | Consider shadcn Sheet for mobile-responsive sidebar or additional side panels. |
| Popovers | N/A | Filter dropdowns, contextual help | **Popover** | Add shadcn Popover for non-blocking contextual UI (e.g., advanced search filters). |
| Tabs | N/A | Tabbed navigation (future feature) | **Tabs** | Add shadcn Tabs for potential tabbed interfaces (e.g., product details with tabs). |
| Accordion | N/A | Collapsible sections (future feature) | **Accordion** | Add shadcn Accordion for FAQ or collapsible content sections. |
| Progress indicators | N/A | Upload progress, multi-step forms | **Progress** | Add shadcn Progress for future features requiring progress bars. |
| Checkbox | N/A | Multi-select, settings | **Checkbox** | Add shadcn Checkbox for future multi-select features (e.g., bulk actions). |
| Radio Group | N/A | Single-choice options | **RadioGroup** | Add shadcn RadioGroup for future single-choice UI (e.g., shipping method selection). |
| Select dropdowns | N/A | Dropdowns for form fields | **Select** | Add shadcn Select to replace native `<select>` elements in future forms. |
| Switch | N/A | Toggle settings | **Switch** | Add shadcn Switch for boolean settings (e.g., enable notifications). |
| Avatar | N/A | User avatars | **Avatar** | Add shadcn Avatar for user profile images in UserMenu and future features. |
| Separator | N/A | Visual dividers | **Separator** | Add shadcn Separator to replace custom border divs (e.g., in sidebars, cards). |
| Skeleton | N/A | Loading placeholders | **Skeleton** | Add shadcn Skeleton for content loading states (better UX than spinners for lists/tables). |
| Calendar | N/A | Date picking | **Calendar** + **Popover** | Add shadcn Calendar with Popover for future date selection (e.g., delivery date). |
| Pagination | N/A | Table/list pagination | **Pagination** | Add shadcn Pagination for future paginated lists (catalog, search results). |

---

## Summary Statistics

| Category | Total Components/Blocks | Already shadcn | Custom (to migrate) | Not Yet Needed |
|----------|-------------------------|----------------|---------------------|----------------|
| **Layout & Navigation** | 6 | 0 | 6 | 0 |
| **Forms & Inputs** | 9 | 0 | 9 | 5 (Select, Checkbox, Radio, Switch, Label) |
| **Buttons** | 4 | 4 ✅ | 0 | 0 |
| **Cards** | 9 | 0 | 9 | 0 |
| **Tables** | 1 | 0 | 1 | 0 |
| **Badges** | 3 | 0 | 3 | 0 |
| **Empty States** | 3 | 0 | 3 | 0 |
| **Feedback** | 3 | 1 (Toaster) ✅ | 2 | 1 (Skeleton) |
| **Overlays** | 2 | 1 (DropdownMenu installed) | 1 | 5 (Dialog, Tooltip, Sheet, Popover, AlertDialog) |
| **Not Implemented** | 0 | 0 | 0 | 13 (various future components) |
| **TOTAL** | **40** | **6** (15%) | **34** (85%) | **24** |

---

## High Priority Migrations

### Critical (Replace Custom with Existing shadcn)

1. **UserMenu** → **DropdownMenu** (component already installed, not used)
2. **All Cards** → **Card** (9 instances, most impactful visual change)
3. **All Form Inputs** → **Input**, **Textarea**, **Label** (9 instances, better accessibility)
4. **Sidebar** → **Sidebar** (new shadcn component, complete replacement)

### High Impact (Add shadcn, Replace Custom)

5. **Table** → **Table** (1 instance but large component, improves accessibility)
6. **Badges** → **Badge** (3 instances, quick wins)
7. **Theme Toggle** → **Button** (better consistency)

### Medium Priority (Enhance Existing)

8. **Empty States** → **Alert** (better semantics)
9. **Custom Table Buttons** → **Button** (consistency)

### Future Additions (When Needed)

10. **Dialog**, **AlertDialog**, **Tooltip**, **Sheet**, **Popover**, **Tabs**, **Accordion**, **Select**, **Checkbox**, **Radio**, **Switch**, **Avatar**, **Separator**, **Skeleton**, **Calendar**, **Pagination**

---

## Notes on Deliberately Custom Components

### Components to Keep Custom

| Component | Reason to Keep Custom | Notes |
|-----------|----------------------|-------|
| AppShell | Layout wrapper, no direct shadcn equivalent | Keep as-is, ensures proper composition with shadcn components |
| Chat Typing Indicator | Specific UX pattern for chat | Custom animated dots are acceptable, shadcn Spinner doesn't fit the use case |
| Quantity Input (with +/- buttons) | Custom composition | Use shadcn Input + Button (icon) but keep custom layout |

---

**Next Steps:** Use this mapping table to execute the migration plan defined in `shadcn-redesign-migration-plan.md`. Each phase will address a subset of these mappings, ensuring incremental, safe migration to shadcn/ui components.
