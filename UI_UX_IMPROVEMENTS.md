# UI/UX Improvements

## 1. Design System — CSS Variables (`src/app/globals.css`)

**Problem:** Only `--background` and `--foreground` were defined out of the ~20 required shadcn/ui design tokens. Every color used by shadcn components (`bg-primary`, `bg-card`, `text-muted-foreground`, `border-input`, etc.) was resolving to nothing, making the entire UI unstyled.

**Fix:** Added the complete neutral color palette to `:root` and `.dark`, then mapped all tokens in `@theme inline` so Tailwind utility classes resolve correctly.

Tokens added: `--card`, `--popover`, `--primary`, `--secondary`, `--muted`, `--accent`, `--destructive`, `--border`, `--input`, `--ring`, `--radius` — plus their `-foreground` variants and full dark-mode overrides.

---

## 2. i18n — "Purchase Orders" Hardcoded Label (`src/components/layout/sidebar.tsx`)

**Problem:** The sidebar nav item for Purchase Orders was hardcoded as the English string `"Purchase Orders"` while every other nav item used `t()`. This meant it never translated to Arabic.

**Fix:**
- Added `purchaseOrders` key to `messages/en.json` → `"Purchase Orders"`
- Added `purchaseOrders` key to `messages/ar.json` → `"أوامر الشراء"`
- Changed the sidebar to use `t("purchaseOrders")`

---

## 3. Mobile Layout — Sidebar & Header

**Problem:** The sidebar was a fixed `w-64` block with no responsive handling. On mobile there was no way to navigate — the sidebar just pushed content off screen.

**Fix:**
- **Sidebar** (`src/components/layout/sidebar.tsx`): extracted nav content into a `SidebarContent` component. The sidebar wrapper is now `hidden md:flex` — invisible on mobile, visible on desktop.
- **Header** (`src/components/layout/header.tsx`): added a `Menu` icon button (visible only on mobile via `md:hidden`) that opens a `Sheet` drawer containing `SidebarContent`.
- **Layout** (`src/app/[locale]/(dashboard)/layout.tsx`): added `min-w-0` to the content column to prevent flex overflow; reduced padding to `p-4 md:p-6`.
- **Sheet component** installed via `npx shadcn@latest add sheet`.

---

## 4. Loading States — Skeleton Screens

**Problem:** No `loading.tsx` files existed anywhere. Every page showed a blank white screen while server data fetched.

**Fix:** Created `loading.tsx` with animated `<Skeleton>` placeholders for all six main routes:

| Route | File |
|-------|------|
| Dashboard | `src/app/[locale]/(dashboard)/loading.tsx` |
| Hotels | `src/app/[locale]/(dashboard)/hotels/loading.tsx` |
| Projects | `src/app/[locale]/(dashboard)/projects/loading.tsx` |
| Inventory | `src/app/[locale]/(dashboard)/inventory/loading.tsx` |
| Purchase Orders | `src/app/[locale]/(dashboard)/purchase-orders/loading.tsx` |
| Vendors | `src/app/[locale]/(dashboard)/vendors/loading.tsx` |
| Reports | `src/app/[locale]/(dashboard)/reports/loading.tsx` |

Each skeleton mirrors the layout of its page (header + table rows, or stat cards + tables for the dashboard).

---

## 5. Tables — Hover States & Mobile Scroll

**Problem:** Table rows had no hover feedback, making the UI feel static. On narrow screens, wide tables had no horizontal scroll, causing content to overflow or compress into unreadable columns.

**Fix applied to all five data tables:**

| Component | Changes |
|-----------|---------|
| `hotels-table.tsx` | `overflow-x-auto` wrapper, `hover:bg-muted/50` on rows, `min-w` on key columns |
| `vendors-table.tsx` | Same |
| `projects-table.tsx` | Same; clickable rows now also visually respond to hover |
| `fabrics-table.tsx` | Same |
| `purchase-orders-table.tsx` | Same |
| `stock-summary-table.tsx` | Same |

---

## 6. Form Buttons — Loading Spinner

**Problem:** Form submit buttons showed disabled state and changed text to "Saving..." while pending, but had no visual spinner — making it hard to tell something was happening.

**Fix:** Added `<Loader2 className="h-4 w-4 animate-spin" />` inside submit buttons when `isPending` is true, across all form dialogs:

- `hotel-form-dialog.tsx`
- `contact-form-dialog.tsx`
- `location-form-dialog.tsx`
- `vendor-form-dialog.tsx`
- `fabric-form-dialog.tsx`
- `project-form-dialog.tsx`
- `purchase-order-form.tsx`

---

## 7. Bug Fix — `VendorSummary` Missing `address` Field

**Problem:** `VendorSummary` (used by the vendors list) was missing the `address` field. When a user opened the edit dialog for a vendor, the address field was always blank — the existing address was silently lost on save.

**Fix:**
- Added `address: string | null` to `VendorSummary` in `src/domain/vendor.ts`
- The Prisma repository already fetched all columns; the cast now matches the extended type

---

## 8. Bug Fix — TypeScript Resolver Type Mismatch

**Problem:** `z.coerce.number()` in Zod schemas produces an `unknown` input type (it accepts any input and coerces it), but React Hook Form's strict generic typing expected `number`. This caused TypeScript errors in two forms.

**Fix:** Added explicit `as Resolver<T>` cast on `zodResolver(...)` in:
- `src/components/projects/add-project-item-dialog.tsx`
- `src/components/purchase-orders/purchase-order-form.tsx`

---

## 9. Runtime Fix — `middleware.ts` vs `proxy.ts`

**Problem:** Two attempts were made to fix a Turbopack startup error ("Could not parse module middleware.ts") by creating `src/middleware.ts`. This introduced a conflict: Next.js 16 uses `proxy.ts` as the middleware convention, so having both files caused a fatal startup error.

**Fix:** Deleted `src/middleware.ts` and restored `src/proxy.ts` to its original state with `config` inline. In Next.js 16, `proxy.ts` is the correct and only middleware file.
