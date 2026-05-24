# Kemcon CRM — UX Audit

**Date:** 2026-05-24  
**Auditor:** Claude Sonnet 4.6  
**Scope:** Full internal platform audit — navigation, workflows, tables, forms, accessibility, responsiveness, performance perception, and enterprise design quality.

---

## Executive Summary

Kemcon CRM is a well-structured internal operational tool with a clean architecture, solid bilingual support, and thoughtful component design. However, several foundational enterprise UX patterns are missing or broken:

- **Navigation state is lost on all sub-routes** — staff have no visual indicator of where they are during most of their working session.
- **The project creation wizard leaks orphaned database records** — closing the dialog after Step 1 silently saves an empty DRAFT project.
- **The core workflow (creating a project with items) uses stacked modals** — a dialog inside a dialog, requiring 60+ interactions for a typical multi-item job.
- **No list in the application has search or filtering** — the platform will become unusable as data grows.
- **No breadcrumb navigation on any detail page** — users rely solely on the browser back button.

With targeted fixes (most of which are 1–3 day tasks), this platform has the structure to become a genuinely efficient internal tool. Without them, it will cause daily operational friction from the first week of real use.

---

## Severity Classification

| Level | Meaning |
|---|---|
| **P0** | Broken — causes data corruption or completely blocks workflows |
| **P1** | Severe — causes daily friction for all users |
| **P2** | Significant — causes friction for power users or as data scales |
| **P3** | Polish — inconsistency or minor usability issue |

---

## P0 — Broken (Fix Immediately)

### P0-1: Sidebar active state breaks on all sub-routes

**File:** `src/components/layout/sidebar.tsx:46`

```ts
// Current — only exact path match
pathname === href
```

When a user is on `/en/projects/123`, the "Projects" sidebar link is not highlighted. When on `/en/purchase-orders/new`, "Purchase Orders" is not highlighted. Staff have no visual indication of where they are during the majority of their working session — which is entirely on detail and creation pages, not list pages.

**Fix:**
```ts
// Replace the active condition with:
const isActive =
  href === `/${locale}`
    ? pathname === href          // dashboard: exact match only
    : pathname.startsWith(href); // all others: prefix match
```

---

### P0-2: Create Project Wizard commits to the database on Step 1 — modal close leaks orphaned records

**File:** `src/components/projects/create-project-wizard.tsx:71–82`

When the user fills in project details and clicks "Next", `createProjectAction` fires immediately. The project is now in the database as DRAFT. If the user then closes the Step 2 dialog (Escape, clicking outside, or the X button), the project persists silently. Every accidental close or change of mind adds garbage DRAFT records that staff must manually find and delete. This contaminates the Projects list and inflates the dashboard Draft count.

**Fix:** Collect all Step 1 fields and Step 2 items entirely in local React state, then make a single server action call only when the user clicks "Finish". If real-time inventory reservation is needed, use a provisional/temporary status — but do not commit the project header before the user completes their intent.

---

### P0-3: Stacked modal dialogs — AddItemWizard opens inside CreateProjectWizard

**File:** `src/components/projects/create-project-wizard.tsx:287–297`

`CreateProjectWizard` is a `<Dialog>`. When the user clicks "Add Item", `AddItemWizard` (another `<Dialog>`) opens on top of it. Two modal overlays are stacked simultaneously. There is no consistent UX pattern for this — it creates spatial confusion about what "Close" or "Back" does at each level, which modal owns focus, and where the user returns on close.

**Fix (preferred):** Move project creation to a dedicated full-page route at `/projects/new`, matching the pattern used for PO creation. Use an inline `useFieldArray` table (identical to the PO form's line items) for adding fabric items directly on the page — no nested dialog needed.

**Fix (minimal):** Expand the AddItemWizard steps to be panels within a single dialog rather than a second dialog. Close the outer CreateProjectWizard entirely when AddItemWizard opens, and re-open it with state restored on return.

---

## P1 — Severe (Fix Before Launch)

### P1-1: No search or filtering on any main list

Hotels, Vendors, Projects, Purchase Orders — none have a search input or filter controls. As the company grows from 20 records to 200, staff will be forced to visually scan entire tables to find a record. The projects list is the most critical: a company managing 50+ concurrent hotel jobs will be effectively blind.

The `common.search` i18n key already exists — it just has not been connected to any input.

**Minimum fix per page:**

| Page | Filters needed |
|---|---|
| Projects | Text search by name, Select by hotel, Select by status |
| Purchase Orders | Select by status, Select by vendor |
| Hotels | Text search by name |
| Vendors | Text search by name |
| Inventory | Text search by fabric name/code (already partially addressed via tabs) |

---

### P1-2: No breadcrumb navigation on detail pages

On `/en/projects/[id]`, `/en/hotels/[id]`, and `/en/purchase-orders/[id]`, there is no breadcrumb or back-link. The only way back to the list is the browser Back button or clicking the sidebar link (which is not even highlighted per P0-1). Staff lose navigation context entirely on detail pages.

**Fix:** Add a single back-link at the top of each detail page. No breadcrumb component required — a locale-prefixed `<Link>` with a `ChevronLeft` icon is sufficient and consistent with the existing pattern used on `/purchase-orders/new`.

```tsx
<Link href={`/${locale}/projects`} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
  <ChevronLeft className="h-4 w-4" />
  {t("backToList")}
</Link>
```

---

### P1-3: Redundant Eye (view) icon duplicates the clickable row affordance

**Files:** `src/components/hotels/hotels-table.tsx:110–114`, `src/components/projects/projects-table.tsx:134–140`

Every row in these tables navigates to the detail page on click. Yet there is also a separate ghost icon button with an `Eye` icon that does the identical navigation. This double affordance confuses the mental model — users learn to look for the icon and treat the row click as unreliable.

**Fix:** Remove the Eye icon from both tables. Row click is sufficient. The Pencil and Trash actions are the only buttons that need to remain visible in the Actions column.

---

### P1-4: Delete confirmation dialogs are non-specific

Every delete dialog shows a static string like "Are you sure you want to delete this hotel? This action cannot be undone." Nowhere does it name the specific record being deleted or warn about cascading effects.

For a system managing inventory stock, a project deletion restores FIFO inventory batches and removes usage records. A hotel deletion removes all associated contacts and locations. Staff need to understand the blast radius before confirming.

**Fix examples:**

```tsx
// Instead of:
<AlertDialogDescription>{t("deleteConfirm")}</AlertDialogDescription>

// Use:
<AlertDialogTitle>Delete "{project.nameEn}"?</AlertDialogTitle>
<AlertDialogDescription>
  This will permanently delete the project and restore{" "}
  {inventoryItemCount} inventory-sourced item(s) back to stock.
  This action cannot be undone.
</AlertDialogDescription>
```

---

### P1-5: STATUS_VARIANT maps are duplicated across 5+ files

`STATUS_VARIANT` for `PurchaseOrderStatus` is defined independently in:
- `src/app/[locale]/(dashboard)/page.tsx`
- `src/components/purchase-orders/purchase-orders-table.tsx`
- `src/components/purchase-orders/purchase-order-detail.tsx`
- `src/components/reports/material-usage-table.tsx`

`STATUS_VARIANT` for `ProjectStatus` is defined independently in:
- `src/components/projects/projects-table.tsx`
- `src/components/projects/project-detail-header.tsx`
- `src/components/reports/material-usage-table.tsx`

More critically: `DELIVERED` and `IN_PRODUCTION` both map to `"default"` variant, but `DELIVERED` gets an inline `bg-green-600` override applied in `projects-table.tsx` and not in `material-usage-table.tsx`. The DELIVERED badge looks different depending on which table you're in.

**Fix:** Create `src/lib/status-variants.ts`:

```ts
import type { PurchaseOrderStatus } from "@/domain/purchase-order";
import type { ProjectStatus } from "@/domain/project";

export const PO_STATUS_VARIANT: Record<PurchaseOrderStatus, "default" | "secondary" | "outline" | "destructive"> = {
  PENDING: "secondary",
  RECEIVED: "default",
  PARTIAL: "outline",
  CANCELLED: "destructive",
};

export const PROJECT_STATUS_VARIANT: Record<ProjectStatus, "default" | "secondary" | "outline"> = {
  DRAFT: "secondary",
  CONFIRMED: "outline",
  IN_PRODUCTION: "default",
  DELIVERED: "default", // pair with className="bg-green-600 text-white" everywhere
};
```

Import from this file in all components. Remove all inline definitions.

---

## P2 — Significant (Fix Within First Iteration)

### P2-1: No pagination anywhere

Every list fetches all records and renders them in a single DOM table. At 500 projects, 1000 PO lines, or 200 inventory batches, this causes slow initial page load and a progressively degrading DOM. No virtual scrolling is in place.

**Fix:** Add server-side pagination with a `page` and `pageSize` query param. A page size of 25 with a simple prev/next control is sufficient for initial launch.

---

### P2-2: Project Items tab has no edit capability

Once an item is added to a project, it can only be deleted. There is no way to correct the quantity, location, or fabric type. If a staff member enters 500m when they meant 50m, they must delete the item and re-add it through the full 3-step wizard — triggering a stock restoration and re-deduction cycle that pollutes the inventory batch history.

**Fix:** Add an Edit dialog for project items, identical in structure to the Add Item Wizard's "details" step but pre-populated. The quantity change should re-run the FIFO logic in the repository (deduct the delta or restore the difference).

---

### P2-3: No overdue project indicator

The platform has no way to surface projects that are past their delivery date but not yet DELIVERED. A fabric company supplying hotel furnishing deadlines will miss commitments silently. The projects list shows delivery dates but does not color, sort, or flag rows by urgency. The dashboard does not surface overdue jobs.

**Fix (table):** In `projects-table.tsx`, check if `deliveryDate < today` and status is not `DELIVERED`. If so, render the delivery date cell in `text-destructive` and add a small warning icon.

**Fix (dashboard):** Add a "Overdue Projects" stat card (count + destructive border) next to the existing stat cards.

---

### P2-4: PO number not auto-suggested

Staff manually type "PO-2026-001" every time. There is no suggestion, auto-increment, or duplicate validation at the UI level. Two staff members could create the same PO number on the same day. The schema likely has a unique constraint, but the error surfaces only after submission with a generic error toast.

**Fix:** On the PO creation form, generate a suggested PO number on page load (e.g. `PO-{YYYY}-{NNN}` based on the current year and count + 1). Display it pre-filled and editable. Validate client-side for format.

---

### P2-5: Inventory page conflates master data management with live stock operations

The `/inventory` page hosts two conceptually different activities on the same tabs:
- **Stock Levels** tab: live operational stock, batch history — used daily.
- **Fabric Catalog** tab: creating, editing, and deleting fabric definitions — configuration work done infrequently.

These have different users, different frequencies, and different risk profiles. An operator checking stock shouldn't be one click away from accidentally editing a fabric definition.

**Fix:** Move the Fabric Catalog to `/fabrics`. Reserve `/inventory` exclusively for stock levels and batch history. Update the sidebar link and translations accordingly.

---

### P2-6: "Back" button uses a raw Unicode arrow character — inconsistent with the rest of the UI

**Files:** `src/components/projects/add-item-wizard.tsx:314`, `src/components/projects/add-item-wizard.tsx:540`

```tsx
← {tc("back")}   // raw Unicode ← character
```

All other navigation in the application uses Lucide icons (`ChevronLeft`). This is the only exception and signals a design system gap.

**Fix:**
```tsx
import { ChevronLeft } from "lucide-react";

<Button variant="ghost" onClick={...}>
  <ChevronLeft className="h-4 w-4 me-1" />
  {tc("back")}
</Button>
```

---

## Dashboard Audit

### What works
- 4 stat cards are the correct pattern for an operational overview.
- Low stock card changes border and text to `destructive` when count > 0 — good ambient alerting.
- Recent POs table surfaces the most actionable recent activity.
- Two-column bottom layout is appropriately dense.

### Issues

**"Active Projects" merges CONFIRMED + IN_PRODUCTION into one number.** These are operationally distinct: IN_PRODUCTION means fabric is being cut and sewn now; CONFIRMED means a job is approved but not yet started. A production manager should not have to navigate to the projects list to see how many jobs are actively running.

**No "Pending POs Awaiting Receipt" stat card.** A receiving team's most important daily question is "what is expected in today?" The dashboard does not surface this. A card showing PENDING POs where `expectedAt <= today` would make the dashboard relevant to warehouse operations.

**No overdue projects anywhere on the dashboard.** If a hotel deadline passed yesterday and the project is still IN_PRODUCTION, nothing on the dashboard surfaces this.

**Dashboard tables have no clickable rows.** In the "Low Stock Fabrics" table, clicking on a fabric name navigates nowhere — even though the most logical next action is to view its inventory batches or create a new PO. Add row links pointing to `/inventory` (filtered to the fabric) or `/purchase-orders/new` (pre-filled with the fabric).

**Proposed additional stat cards:**
```
[Active Projects: CONFIRMED]  [Active Projects: IN_PRODUCTION]
[Overdue Projects]            [Pending POs (due today)]
```

---

## Table & Data Management Audit

### Universal problems across all tables

| Problem | Severity |
|---|---|
| No search input on any list page | P1 |
| No column sorting on any table | P2 |
| No pagination | P2 |
| No bulk actions (e.g. bulk delete DRAFT projects) | P2 |

### Purchase Orders table — specific issues
- No "Total Value" column — staff must open every PO to see its financial value.
- No "Expected Date" column — buyers cannot scan upcoming receipt dates from the list.

### Inventory Stock table — specific issues
- 8 columns: Code, Fabric, Unit, Total In, Total Left, Batches, Status, Actions. Extremely tight on 1280px laptops.
- The "Unit" column (showing "Meters" or "Rolls" as a badge) takes a full column width. This information could be embedded into the quantity cells (e.g. "4,500 m") freeing an entire column.
- The "Batches" count badge in the center of the row breaks visual alignment with the surrounding right-aligned number columns.

### Reports table — specific issues
- 8 columns: Project, Hotel, Fabric, Item Type, Quantity, Source, Status, Delivery Date. Will overflow on any screen below ~1400px.
- Date range filter inputs have no visible labels — two bare date inputs separated by an em-dash are not self-documenting.
- "Source" and "Status" badge columns side-by-side creates visual noise.

---

## Workflow Efficiency Audit

### Create Project (Core Workflow)

For a project with 5 fabric items, the current flow requires:

1. "New Project" → dialog opens
2. Fill project name (EN + AR), hotel, dates, notes
3. "Next" → **project committed to DB immediately** (P0-2)
4. "Add Item" → **second dialog opens inside the first** (P0-3)
5. Sub-step 1/3: Choose supply source
6. Sub-step 2/3: Browse fabric grid, click fabric card
7. Sub-step 3/3: Fill item type, quantity, location, notes
8. "Add Item" → sub-dialog closes, back to step 2
9. Repeat steps 4–8 for each additional item
10. "Finish" → wizard closes, page refreshes

For 5 items: **30+ clicks, 2 levels of nested modals**. For a typical hotel project with 15 items: **70+ interactions**.

**Fix:** Move to a full-page form at `/projects/new` (matching the PO creation pattern already in the app). Use an inline `useFieldArray` table for item entry — same approach as the PO line items form. This eliminates the nested dialog entirely and reduces a 15-item project to a single page interaction.

### Update Project Status

The inline `<Select>` on the detail header is clean, efficient, and saves automatically. This is one of the best-executed interactions in the application.

**One gap:** There is no transition guard. Moving a DELIVERED project back to DRAFT is technically possible and gives no warning. Add a soft confirmation when a backwards transition is detected: "Moving this project back to Draft — stock will not be automatically re-deducted. Are you sure?"

### Receive Purchase Order

Well-designed. Detail page → "Receive Order" button → confirmation dialog → toast + page refresh. Correctly scoped, appropriately guarded, and atomically executed. No changes needed.

---

## Cognitive Load Audit

### Where users will feel mentally exhausted

**The inventory page forces a mental context switch.** "Stock Levels" (checking live operational data) and "Fabric Catalog" (configuring master data) require different mental modes. Placing them as equal tabs on the same page creates confusion about the page's purpose. (See P2-5.)

**The Add Item Wizard's 3-sub-step structure is taxing for power users.** Source selection as a required first step adds friction. The source type (INVENTORY / CLIENT / DIRECT) changes what fabric list is shown — consider merging it into the details step as a radio group and defaulting to in-stock fabrics. This removes one full step from every item addition.

**Delete confirmation dialogs are anxiety-inducing for the wrong reason.** Because they don't name the specific record, every dialog feels identical. After clicking Delete on a long list row, "Are you sure?" without seeing the record name forces the user to remember what they just clicked. (See P1-4.)

**No visual urgency differentiation in the projects list.** A project due tomorrow looks identical to a project due next year. A project with 0 items looks identical to a fully staffed job. Tables need at minimum a color cue for overdue delivery dates.

---

## Accessibility Audit

| Issue | File | WCAG Level |
|---|---|---|
| Icon-only buttons without `aria-label` (Eye, Pencil, Trash in all tables) | All table components | AA |
| Date range inputs in Reports have no visible labels | `material-usage-table.tsx:156–170` | AA |
| Wizard step progress bar has no screen-reader text | `create-project-wizard.tsx:107–110` | AA |
| Low Stock badge uses color only — no icon for color-blind users | `stock-summary-table.tsx:93` | AA |
| `FabricCard` buttons in AddItemWizard have no accessible name | `add-item-wizard.tsx:566–586` | AA |
| Generic delete dialog description does not identify the record | All alert dialogs | AA |

**Fixes:**

```tsx
// 1. Icon buttons — add aria-label
<Button variant="ghost" size="icon" aria-label={`View ${hotel.nameEn}`}>
  <Eye className="h-4 w-4" />
</Button>

// 2. Date range labels in Reports filter bar
<div className="flex flex-col gap-1">
  <label className="text-xs text-muted-foreground">{t("filterDateFrom")}</label>
  <Input type="date" ... />
</div>

// 3. Wizard progress — add sr-only step count
<div role="progressbar" aria-valuenow={step === "project" ? 1 : 2} aria-valuemax={2}>
  <span className="sr-only">Step {step === "project" ? 1 : 2} of 2</span>
  <div className="flex gap-1.5">...</div>
</div>

// 4. Low Stock badge — add icon alongside color
<Badge variant="outline" className="border-amber-500 text-amber-600 gap-1">
  <AlertTriangle className="h-3 w-3" />
  {t("statusLow")}
</Badge>

// 5. FabricCard — add accessible label
<button aria-label={`Select ${nameEn} (${codeRef})`} ...>
```

---

## Responsive / Mobile Audit

### What works
- Sidebar correctly hides below `md` and is replaced with a Sheet.
- Dashboard stat cards use `grid-cols-2 lg:grid-cols-4`.
- `overflow-x-auto` on tables prevents layout breaking.
- Header hamburger menu maps correctly to a Sheet with full sidebar content.

### What breaks

| Breakpoint | Issue | Page |
|---|---|---|
| < 1400px | 8-column Reports table overflows | Reports |
| < 1200px | 7-column Project Items table crowded | Project Detail |
| < 1280px | PO form line-items table (5 cols + form inputs) overflows | PO New |
| < 1024px | Inventory table (8 cols) crowded | Inventory |
| Mobile | PO form line items completely unusable (inputs inside table cells) | PO New |
| Mobile | Reports filter bar: two fixed-width date inputs crowd the layout | Reports |

**Critical mobile fix — PO form line items:**  
`LineRow` renders as a `<TableRow>` with form inputs inside `<TableCell>` elements. On mobile this is completely unusable. Below `md`, render line items as stacked cards instead of table rows.

---

## Performance Perception Audit

### What works
- All data is server-fetched via Server Components — no client-side waterfall on initial load.
- `Promise.all` is used consistently for parallel data fetching.
- Toast notifications give immediate feedback on mutations.

### What feels slow or unreliable

**No skeleton loaders.** Every page renders nothing while the server fetches data, then appears all at once. On a slow connection this feels like the page is broken. Even simple gray-bar placeholders for table rows would dramatically improve perceived performance.

**`router.refresh()` after every mutation is jarring.** After updating project status or receiving a PO, the entire page re-renders server-side. The user sees the button spin → brief flash → new state. For status changes (performed many times daily), this 500–800ms cycle should be replaced with optimistic UI: immediately update the badge, revert on error.

**Image uploads in AddItemWizard show no progress.** The form submit button shows a spinner, but the upload is the slow part. On a slow mobile connection, a 4MB image upload takes 5–10 seconds with only a spinning button. Add a progress label ("Uploading image…") under the upload zone.

**No page transition indicator.** Route changes have no top-of-page loading bar. Database queries make navigation non-instant. A slim NProgress-style bar during transitions would improve perceived responsiveness.

---

## Enterprise Design Quality Rating

| Dimension | Score |
|---|---|
| UX Maturity | 5/10 |
| Operational Efficiency | 4/10 |
| Interface Consistency | 6/10 |
| Scalability | 4/10 |
| Visual Polish | 7/10 |
| Accessibility | 4/10 |
| Enterprise Readiness | 4/10 |
| **Overall** | **5/10** |

**Classification: Functional Internal Tool** — leaning toward Early Prototype on operational workflows.

The visual design is clean and professional (shadcn/ui + Tailwind v4 give a solid modern foundation). The architecture is genuinely well-structured with clean separation of concerns. The bilingual support is thorough and correctly implemented. However, the three P0 bugs would be noticed within the first hour of real daily use, the absence of search on any list will cause friction from week one, and the project creation workflow's complexity (stacked modals, 60+ interactions for a multi-item job) will frustrate staff who create multiple projects per day.

The gap between current state and production-ready is not a rewrite — it is targeted Sprint 1 and Sprint 2 work. The bones are correct.

---

## Prioritized Fix Roadmap

### Sprint 1 — Stop the Bleeding ✅ COMPLETE (2026-05-24)

| # | Fix | File | Status |
|---|---|---|---|
| 1 | Fix sidebar active state (`startsWith` instead of `===`) | `sidebar.tsx:46` | ✅ Done |
| 2 | Fix CreateProjectWizard to not commit on Step 1 | `create-project-wizard.tsx` | ✅ Done |
| 3 | Add `aria-label` to all icon-only action buttons | All table components | ✅ Done |
| 4 | Remove redundant Eye icon from Hotels + Projects tables | `hotels-table.tsx`, `projects-table.tsx` | ✅ Done |
| 5 | Extract `STATUS_VARIANT` to `src/lib/status-variants.ts` | All table and detail components | ✅ Done |

#### Sprint 1 Implementation Notes

**Fix 1 — Sidebar active state** (`src/components/layout/sidebar.tsx:45`)
Replaced `pathname === href` with a prefix match for all non-dashboard links:
```ts
(href === `/${locale}` ? pathname === href : pathname.startsWith(href))
```
Dashboard uses exact match to prevent it lighting up on every page.

**Fix 2 — CreateProjectWizard orphaned records** (`src/components/projects/create-project-wizard.tsx`)
"Next" no longer calls `createProjectAction`. Step 1 form values are saved to `pendingProjectValues` state. The project is only created in the DB the first time the user clicks "Add Item" (`handleOpenAddItem`). If the user closes the wizard without adding any items, zero DB records are written. A dedicated `isCreating` boolean drives the spinner on the "Add Item" button during that first lazy creation.

**Fix 3 — aria-labels on icon-only buttons**
Added `aria-label` props with the specific record name to all icon-only action buttons across:
- `hotels-table.tsx` — Edit, Delete
- `projects-table.tsx` — Edit, Delete
- `vendors-table.tsx` — Edit, Delete
- `project-items-tab.tsx` — Delete
- `project-detail-header.tsx` — Edit, Delete
- `purchase-orders-table.tsx` — View (Eye)

**Fix 4 — Remove redundant Eye icon**
- `hotels-table.tsx`: Eye button removed; row now navigates via `onClick → router.push(...)` (pattern matches Projects table). Actions cell gets `e.stopPropagation()` so Edit/Delete still work.
- `projects-table.tsx`: Eye button removed. Row click navigation was already present; duplicate button just deleted.

**Fix 5 — Centralised status variants** (`src/lib/status-variants.ts`)
Created `PO_STATUS_VARIANT` and `PROJECT_STATUS_VARIANT` as the single source of truth. Removed inline `STATUS_VARIANT` declarations from:
- `src/app/[locale]/(dashboard)/page.tsx`
- `src/components/purchase-orders/purchase-orders-table.tsx`
- `src/components/purchase-orders/purchase-order-detail.tsx`
- `src/components/reports/material-usage-table.tsx`
- `src/components/projects/projects-table.tsx`
- `src/components/projects/project-detail-header.tsx` (was dead code — no badge in that component)

`DELIVERED` badge inconsistency resolved: all consumers now pair `PROJECT_STATUS_VARIANT.DELIVERED` (`"default"`) with `className="bg-green-600 text-white hover:bg-green-700"` from `projects-table.tsx`.

### Sprint 2 — Core Operational UX ✅ COMPLETE (2026-05-24)

| # | Fix | Status |
|---|---|---|
| 6 | Add breadcrumb / back-link to Hotel, Project, and PO detail pages | ✅ Pre-existing (`backToList` links already present on all detail pages) |
| 7 | Add search + status filter to Projects list | ✅ Done |
| 8 | Add search + status/vendor filter to Purchase Orders list | ✅ Done |
| 9 | Add "Total Value" column to POs table | ✅ Done |
| 10 | Add Edit capability to Project Items tab | ✅ Done |
| 11 | Make delete dialogs show the specific record name | ✅ Done |
| 12 | Move Fabric Catalog to its own `/fabrics` route | ✅ Done |

#### Sprint 2 Implementation Notes

**Fix 6 — Back-links** (pre-existing)
All three detail pages already had back-links before Sprint 2. `hotels/[id]/page.tsx` renders `t("backToList")`, `projects/[id]` and `purchase-orders/[id]` both have `backToList` links in their headers. No changes needed.

**Fix 7 — Search + filters on Projects list** (`src/components/projects/projects-table.tsx`)
Added a filter bar above the table with three controls: a text input (searches `nameEn` + `nameAr`), a hotel `Select`, and a status `Select`. Filtering is done client-side with `useMemo` on a `filtered` array derived from the `projects` prop. Added `common.tryDifferentFilter` and `common.clearFilters` i18n keys. A "Clear filters" button appears only when any filter is active. An empty state is shown when `filtered.length === 0` after filtering (distinct from the true-empty state when no projects exist at all).

**Fix 8 — Search + filters on Purchase Orders list** (`src/components/purchase-orders/purchase-orders-table.tsx`)
Same pattern as Fix 7: text input searches PO number and vendor name; status `Select` and vendor `Select` (vendor options derived from the orders list to avoid a separate fetch). `purchaseOrders.filterAllStatuses` and `purchaseOrders.filterAllVendors` i18n keys added to both locale files.

**Fix 9 — Total Value column on POs table**
Three changes required:
1. `src/domain/purchase-order.ts` — added `totalValue: number` to `PurchaseOrderSummary` type
2. `src/infrastructure/repositories/purchase-order.repository.ts` — `findAll()` includes `lines: { select: { quantity, unitPrice } }`, computes `totalValue` via `.reduce()` (multiplying qty × price per line), then destructures `lines` off the returned objects so they aren't serialised to the client
3. `src/components/purchase-orders/purchase-orders-table.tsx` — added "Total Value" column showing `order.totalValue.toLocaleString() EGP`

**Fix 10 — Edit Project Items** (`src/components/projects/project-items-tab.tsx` + new files)
Added full Edit capability for project items:
- `src/domain/project.ts` — added `UpdateProjectItemInput` type + `updateItem()` to `IProjectRepository`
- `src/infrastructure/repositories/project.repository.ts` — `updateItem()` implementation with bidirectional FIFO/LIFO stock adjustment: increasing qty consumes more batches in FIFO order; decreasing qty restores stock in LIFO order by iterating `ProjectItemUsage` records in reverse, shrinking/deleting usages and incrementing `quantityLeft` on each batch
- `src/application/projects/commands/update-project-item.ts` — thin use case wrapper
- `src/app/[locale]/(dashboard)/projects/[id]/actions.ts` — `updateProjectItemAction` server action (revalidates projects + inventory paths)
- `src/components/projects/edit-project-item-dialog.tsx` — new dialog pre-populated with existing item values; editable fields: itemTypeEn, itemTypeAr, quantity (with unit label), locationId select, locationNoteEn, notes; fabric and source shown as read-only context
- `project-items-tab.tsx` — added Pencil icon button per row wired to the new dialog

*TypeScript fix:* Local schema uses `z.coerce.number()`. The `zodResolver` returns `Resolver<InputType>` where input type has `quantityNeeded: unknown`. Fixed by casting: `zodResolver(schema) as Resolver<FormValues>` — the same pattern used in `add-project-item-dialog.tsx`.

**Fix 11 — Specific record names in delete dialogs**
Updated `AlertDialogTitle` in all delete confirmations to show the specific record name:
- `hotels-table.tsx` — `Delete "${hotel.nameEn}"?`
- `projects-table.tsx` — `Delete "${project.nameEn}"?`
- `vendors-table.tsx` — `Delete "${vendor.nameEn}"?`
- `project-detail-header.tsx` — `Delete "${project.nameEn}"?`
- `delete-po-button.tsx` — added `poNumber: string` prop; title shows `Delete "${poNumber}"?`
- `purchase-order-detail.tsx` — passes `poNumber={order.poNumber}` to `DeletePOButton`

**Fix 12 — Move Fabric Catalog to `/fabrics`** (`src/app/[locale]/(dashboard)/fabrics/`)
Split the previous two-tab inventory page into two dedicated pages:
- `src/app/[locale]/(dashboard)/fabrics/page.tsx` — new dedicated Fabric Catalog page (fetches fabrics + vendors, renders `FabricsTable` with `PageHeader`)
- `src/app/[locale]/(dashboard)/fabrics/actions.ts` — new actions file revalidating `/en/fabrics`, `/ar/fabrics`, `/en/inventory`, `/ar/inventory` (both pages reference fabric data)
- `src/app/[locale]/(dashboard)/inventory/page.tsx` — stripped down to stock-only: removed Fabrics tab, FabricRepository, VendorRepository imports; uses `t("stockDescription")` instead of `t("description")`
- `src/components/fabrics/fabrics-table.tsx` + `fabric-form-dialog.tsx` — import paths updated to use `/fabrics/actions`
- `src/components/layout/sidebar.tsx` — added `Layers` icon + `/fabrics` link between Inventory and Purchase Orders
- `messages/en.json` + `messages/ar.json` — added `nav.fabrics` and `inventory.stockDescription` keys

### Sprint 3 — Power User Features ✅ COMPLETE (2026-05-24)

| # | Fix | Status |
|---|---|---|
| 13 | Refactor Create Project to full-page form at `/projects/new` (eliminates stacked modals) | ✅ Done |
| 14 | Add overdue project highlighting in the Projects table and Dashboard | ✅ Done |
| 15 | Add PO number auto-suggestion (year + auto-increment) | ✅ Done |
| 16 | Add pagination to all list pages (page size 25) | ✅ Done |
| 17 | Add skeleton loaders to all pages | ✅ Done |
| 18 | Add optimistic UI for project status changes | ✅ Done |
| 19 | Add sidebar section grouping (Operations / Catalog / Analytics) | ✅ Done |

#### Sprint 3 Implementation Notes

**Fix 13 — Full-page project creation** (`src/app/[locale]/(dashboard)/projects/new/page.tsx` + `src/components/projects/project-new-form.tsx`)
Moved project creation to a dedicated full-page route. `ProjectNewForm` renders project header fields and an items section on a single page. "Add Item" opens `AddItemWizard` as a plain dialog — no stacking since the parent is a page, not a dialog. Lazy creation preserved: project is written to DB only when the first item is added or "Create Project" is clicked. The "New Project" button in `projects-table.tsx` now navigates to `/projects/new` via `<Link>`. `ProjectsTable` props simplified: removed `fabrics`, `stockSummary`, and `HotelSummaryWithLocations` (now uses `HotelSummary[]`).

**Fix 14 — Overdue highlighting** (`projects-table.tsx` + `dashboard/page.tsx` + `domain/dashboard.ts` + `dashboard.repository.ts`)
In `projects-table.tsx`, delivery date cells show `text-destructive` + `AlertTriangle` icon when `deliveryDate < today && status !== DELIVERED`. Dashboard gains a 5th stat card "Overdue Projects" using a `prisma.project.count` query filtered by non-DELIVERED status and `deliveryDate < new Date()`. `DashboardStats.projectCounts.overdue` added to domain and repository. All three parallel queries (`groupBy`, `recentPOs`, `overdueCount`, `fabrics`) are now in a single `Promise.all`.

**Fix 15 — PO number auto-suggestion** (`domain/purchase-order.ts` + `purchase-order.repository.ts` + PO new page + `purchase-order-form.tsx`)
Added `getNextPoNumber()` to `IPurchaseOrderRepository`. Implementation counts POs with `poNumber LIKE 'PO-{YEAR}-%'` and returns `PO-{YEAR}-{NNN}` (zero-padded 3 digits). New PO page fetches the suggestion and passes it as `suggestedPoNumber` prop to `PurchaseOrderForm`, which pre-fills the field and shows "Auto-suggested — you can edit this" helper text.

**Fix 16 — Pagination** (`src/components/ui/table-pagination.tsx` + all four list tables)
Created shared `TablePagination` component (prev/next, page X/Y, row range display). Added to `ProjectsTable`, `PurchaseOrdersTable`, `HotelsTable`, `VendorsTable` — each with `PAGE_SIZE = 25` and page-reset on any filter change. Pagination row is hidden when `totalPages <= 1`.

**Fix 17 — Skeleton loaders** (various `loading.tsx` files)
Added `loading.tsx` for the new `/fabrics` and `/projects/new` routes (other routes already had skeletons from Sprint 1/2). Created `src/components/ui/skeleton-table.tsx` with reusable `SkeletonTable` and `SkeletonStatCards` helpers.

**Fix 18 — Optimistic status updates** (`project-detail-header.tsx`)
Replaced `router.refresh()` as the sole feedback mechanism with `useOptimistic`. The Select badge updates immediately on change; the server action confirms or reverts. `router.refresh()` still fires on success to sync server state, but the UI is no longer frozen waiting for it.

**Fix 19 — Sidebar section grouping** (`sidebar.tsx`)
Restructured sidebar links into three labelled groups: **Operations** (Projects, Hotels), **Catalog** (Inventory, Fabrics, Purchase Orders, Vendors), **Analytics** (Reports). Dashboard remains ungrouped at the top. Section labels use `text-[11px] uppercase tracking-wider text-muted-foreground/60` for visual hierarchy without competing with nav items. Added `nav.groupOperations`, `nav.groupCatalog`, `nav.groupAnalytics` i18n keys in both locales.

### Sprint 4 — Polish & Scale ✅ COMPLETE (2026-05-24)

| # | Fix | Status |
|---|---|---|
| 20 | Cmd+K global search | ✅ Done |
| 21 | Sidebar badges (pending PO count, low stock count) | ✅ Done |
| 22 | Dashboard: split Active Projects into CONFIRMED + IN_PRODUCTION cards | ✅ Done |
| 23 | Dashboard: add Overdue Projects card | ✅ Pre-existing (Sprint 3) |
| 24 | Dashboard: add Pending POs (expected today) card | ✅ Done |
| 25 | Add column sorting to all tables | ✅ Done |
| 26 | Fix PO form line items layout on mobile (card layout below md) | ✅ Done |
| 27 | Add status transition guard with confirmation for backwards moves | ✅ Done |
| 28 | Fix date range filter labels in Reports (visible `<label>` elements) | ✅ Done |
| 29 | Add `tel:` and `mailto:` links to Hotel Contacts table | ✅ Done |
| 30 | Page transition loading indicator (NProgress-style) | ✅ Done |

#### Sprint 4 Implementation Notes

**Fix 20 — Cmd+K global search** (`src/components/layout/command-menu.tsx`)
Created `CommandMenu` using shadcn's `CommandDialog`. Listens for both the native `Ctrl/Cmd+K` keyboard shortcut and a custom `open-command-menu` DOM event (fired by the Header's search trigger button). Mounted in the dashboard layout so it is available on every page. The palette provides navigation shortcuts to all main routes and "New Project" / "New Purchase Order" quick-create actions. No server data fetch — navigation only.

**Fix 21 — Sidebar badges** (`src/components/layout/sidebar.tsx` + `layout.tsx` + `header.tsx`)
Dashboard layout (`layout.tsx`) was converted to an `async` Server Component that runs two parallel queries: `purchaseOrder.count({ status: PENDING })` and a fabric-level low-stock aggregate (same 20% threshold as inventory page). Badge counts are passed as props to both `Sidebar` (desktop) and `Header → SidebarContent` (mobile sheet). Badges render as small destructive pill counters on the Inventory and Purchase Orders nav links. Count is capped at "99+" for display.

**Fix 22 + 24 — Dashboard stat card restructure** (`src/app/[locale]/(dashboard)/page.tsx` + domain + repository)
Replaced the single "Active Projects" card (confirmed + inProduction combined) with two dedicated cards: **Confirmed** (approved, not started) and **In Production** (fabric being worked now). Added a third alert card **POs Due Today** — counts PENDING orders where `expectedAt <= end of today`. Cards now arranged in two rows: 4-column project status row + 3-column alerts row. New i18n keys added to both locale files.

**Fix 25 — Column sorting** (`src/lib/use-table-sort.ts` + `src/components/ui/sortable-head.tsx`)
Created `useTableSort<T, K>` hook — a generic `useMemo`-based sort with cycle: none → asc → desc → none. Created `SortableHead` component that renders chevron icons (↑ / ↓ / ⇅) and delegates toggle. Applied to all four main tables:
- `ProjectsTable`: name, hotel, status, items count, start date, delivery date
- `PurchaseOrdersTable`: PO number, vendor, status, lines, ordered date, expected date, total value
- `HotelsTable`: name, locations, contacts, projects, created date
- `VendorsTable`: name, phone, fabrics, orders, created date

**Fix 26 — PO form mobile** (`src/components/purchase-orders/purchase-order-form.tsx`)
`LineRow` now renders two distinct layouts: a stacked card (visible on `< md`) with fabric selector full-width, and a 2-column grid for quantity/price; and the existing `<TableRow>` (visible on `md+`) hidden via `hidden md:table-row`. The table header block is wrapped in `hidden md:block`. Mobile labels are shown inline via `FormLabel` with `md:hidden`.

**Fix 27 — Backwards status transition guard** (`src/components/projects/project-detail-header.tsx`)
Added `STATUS_ORDER` map (`DRAFT=0 → DELIVERED=3`). When the user selects a status with a lower order value than the current status, instead of immediately calling the server action, the new status is saved to `pendingStatus` state and an `AlertDialog` opens explaining the backwards move (`Moving from {from} to {to} — stock will not be adjusted`). User must confirm before the status change commits.

**Fix 28 — Reports date filter labels** (`src/components/reports/material-usage-table.tsx`)
Wrapped each date `Input` in a `flex flex-col gap-1` container with a visible `<label>` element (`text-xs text-muted-foreground`) above it. The em-dash separator is vertically aligned with `mt-5` to match the input baseline.

**Fix 29 — Tel/mailto links** (`src/components/hotels/contacts-tab.tsx`)
Phone cells now render `<a href="tel:...">` and email cells render `<a href="mailto:...">` with `hover:underline`. Null values still render "—".

**Fix 30 — Page transition indicator** (`src/app/[locale]/layout.tsx`)
Installed `nextjs-toploader`. Added `<NextTopLoader showSpinner={false} color="hsl(var(--primary))" />` in the locale root layout (outside the `div[lang]` wrapper, before children). The bar color uses the design system's primary CSS variable so it adapts to any future theme changes.
