# Kemcon CRM — Project Documentation

## Company Overview

**Kemcon Group** is an Egyptian fabric company that manufactures and supplies curtains, sofas, chairs, bed sheets, and tables — primarily for luxury hotels in Egypt.

---

## Project Purpose

An internal CRM for managing:
- Hotel client projects (what fabric goes where)
- Raw fabric inventory and stock levels
- Vendor relationships and purchase orders
- Material usage reporting

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, Turbopack) |
| Database ORM | Prisma 7 + `@prisma/adapter-pg` |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (SSR) |
| UI Components | shadcn/ui v4 |
| Styling | Tailwind CSS v4 |
| Form handling | React Hook Form + Zod |
| Client caching | TanStack Query v5 |
| i18n | next-intl v4 |

---

## Architecture — Onion (Clean) Architecture

The backend follows the **Onion Architecture** pattern. The rule is simple:
> Inner layers know nothing about outer layers. Dependencies always point inward.

```
┌─────────────────────────────────────────┐
│           Presentation (Next.js)        │  pages, Server Actions, API routes
│  ┌───────────────────────────────────┐  │
│  │        Infrastructure             │  │  Prisma repos, Supabase, adapters
│  │  ┌─────────────────────────────┐  │  │
│  │  │       Application           │  │  │  use cases — orchestrate the flow
│  │  │  ┌───────────────────────┐  │  │  │
│  │  │  │       Domain          │  │  │  │  entities, interfaces, errors
│  │  │  └───────────────────────┘  │  │  │
│  │  └─────────────────────────────┘  │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

### Layer responsibilities

#### 1. Domain (`src/domain/`)
- Pure TypeScript types and interfaces — zero framework imports
- Entity types (not Prisma types — those are an infrastructure detail)
- Repository interfaces (contracts only, no implementations)
- Domain errors (`HotelNotFoundError`, `InsufficientStockError`, etc.)

#### 2. Application (`src/application/`)
- Use cases: one file per operation (e.g. `create-hotel.ts`, `receive-purchase-order.ts`)
- Receives repository interfaces via dependency injection — never imports Prisma directly
- Split into `queries/` (reads) and `commands/` (writes) per domain
- All business rules live here (e.g. "can only receive a PENDING order")

#### 3. Infrastructure (`src/infrastructure/`)
- Prisma repository implementations that satisfy the domain interfaces
- Supabase auth helpers
- This is the only layer that imports Prisma or any external SDK

#### 4. Presentation (`src/app/`)
- Next.js pages (Server Components) call query use cases directly
- `actions.ts` files (Server Actions) call command use cases
- Pages and components contain zero business logic — they only render and delegate

### Example flow — creating a hotel

```
page.tsx (form submit)
  → actions.ts (Server Action)
    → createHotel(input) in application/hotels/commands/create-hotel.ts
      → hotelRepository.create(data) via IHotelRepository interface
        → HotelRepository in infrastructure/repositories/hotel.repository.ts
          → prisma.hotel.create(...)
```

---

## Folder Structure

```
kemcon-crm/
├── messages/                          # i18n translation files
│   ├── en.json
│   └── ar.json
├── prisma/
│   └── schema.prisma                  # Database schema (12 models)
├── prisma.config.ts                   # Prisma 7 datasource config
├── src/
│   │
│   ├── domain/                        # LAYER 1 — pure types & contracts
│   │   ├── hotel.ts                   # Hotel, HotelLocation, HotelContact types + IHotelRepository
│   │   ├── project.ts                 # Project, ProjectItem types + IProjectRepository
│   │   ├── fabric.ts                  # Fabric types + IFabricRepository
│   │   ├── vendor.ts                  # Vendor types + IVendorRepository
│   │   ├── inventory.ts               # InventoryBatch types + IInventoryRepository
│   │   ├── purchase-order.ts          # PurchaseOrder types + IPurchaseOrderRepository
│   │   └── errors.ts                  # Domain errors
│   │
│   ├── application/                   # LAYER 2 — use cases
│   │   ├── hotels/
│   │   │   ├── queries/
│   │   │   │   ├── get-hotels.ts
│   │   │   │   └── get-hotel-by-id.ts
│   │   │   └── commands/
│   │   │       ├── create-hotel.ts
│   │   │       ├── update-hotel.ts
│   │   │       └── delete-hotel.ts
│   │   ├── projects/
│   │   │   ├── queries/
│   │   │   │   ├── get-projects.ts
│   │   │   │   └── get-project-by-id.ts
│   │   │   └── commands/
│   │   │       ├── create-project.ts
│   │   │       ├── update-project-status.ts
│   │   │       └── add-project-item.ts
│   │   ├── fabrics/
│   │   ├── vendors/
│   │   ├── inventory/
│   │   │   └── commands/
│   │   │       └── consume-stock.ts   # Deducts from InventoryBatch
│   │   └── purchase-orders/
│   │       └── commands/
│   │           └── receive-order.ts   # Creates InventoryBatches on receipt
│   │
│   ├── infrastructure/                # LAYER 3 — DB & external services
│   │   └── repositories/
│   │       ├── hotel.repository.ts    # Implements IHotelRepository via Prisma
│   │       ├── project.repository.ts
│   │       ├── fabric.repository.ts
│   │       ├── vendor.repository.ts
│   │       ├── inventory.repository.ts
│   │       └── purchase-order.repository.ts
│   │
│   ├── app/                           # LAYER 4 — Next.js presentation
│   │   ├── [locale]/
│   │   │   ├── (auth)/login/
│   │   │   │   └── page.tsx
│   │   │   ├── (dashboard)/
│   │   │   │   ├── layout.tsx
│   │   │   │   ├── page.tsx           # Dashboard
│   │   │   │   ├── hotels/
│   │   │   │   │   ├── page.tsx       # Server Component — calls query use case
│   │   │   │   │   ├── actions.ts     # Server Actions — call command use cases
│   │   │   │   │   └── [id]/page.tsx
│   │   │   │   ├── projects/
│   │   │   │   ├── inventory/
│   │   │   │   ├── purchase-orders/
│   │   │   │   ├── vendors/
│   │   │   │   └── reports/
│   │   │   └── layout.tsx
│   │   ├── globals.css
│   │   └── page.tsx
│   │
│   ├── components/
│   │   ├── auth/
│   │   ├── layout/
│   │   └── ui/                        # shadcn/ui components (never import domain)
│   │
│   ├── i18n/
│   │   ├── routing.ts
│   │   └── request.ts
│   │
│   ├── lib/
│   │   ├── prisma.ts                  # PrismaClient singleton
│   │   ├── supabase/
│   │   │   ├── client.ts
│   │   │   └── server.ts
│   │   └── utils.ts                   # cn() helper
│   │
│   ├── providers/
│   │   └── query-provider.tsx
│   │
│   └── proxy.ts                       # Auth guard + locale routing
│
├── .env.example
└── components.json
```

---

## Build Plan

### Phase 1 — Master Data ✅ Hotels done
*The lookup tables that everything else depends on. Build these first.*

| # | Feature | Status | Files touched | Notes |
|---|---------|--------|---------------|-------|
| 1 | **Hotels** | ✅ Done | `domain/hotel.ts`, `application/hotels/`, `infrastructure/repositories/hotel.repository.ts`, `app/.../hotels/` | List, create, edit. Sub-forms for locations and contacts |
| 2 | **Vendors** | ✅ Done | `domain/vendor.ts`, `application/vendors/`, `infrastructure/repositories/vendor.repository.ts`, `app/.../vendors/` | List, create, edit |
| 3 | **Fabrics** | ✅ Done | `domain/fabric.ts`, `application/fabrics/`, `infrastructure/repositories/fabric.repository.ts`, `app/.../inventory/fabrics/` | List, create, edit. Assign vendors, set unit type |

---

### Phase 2 — Inventory & Purchasing
*Stock must exist before projects can consume it.*

| # | Feature | Files touched | Notes |
|---|---------|---------------|-------|
| 4 | **Purchase Orders** | ✅ Done | `domain/purchase-order.ts`, `application/purchase-orders/`, PO repo, `app/.../purchase-orders/` | List, create (with line items), detail view, delete (PENDING only) |
| 5 | **Receive PO** | ✅ Done | `domain/inventory.ts`, `application/purchase-orders/commands/receive-order.ts`, PO repo, `app/.../purchase-orders/actions.ts`, `components/purchase-orders/receive-po-button.tsx` | Marks PO received, creates InventoryBatch records |
| 6 | **Inventory view** | ✅ Done | `application/inventory/queries/`, `infrastructure/repositories/inventory.repository.ts`, `app/.../inventory/page.tsx`, `components/inventory/` | Per-fabric stock levels, batch history, low-stock indicators |

---

### Phase 3 — Projects
*Core feature — ties hotels, fabrics, and inventory together.*

| # | Feature | Files touched | Notes |
|---|---------|---------------|-------|
| 7 | **Projects list** | ✅ Done | `domain/project.ts`, `application/projects/`, `infrastructure/repositories/project.repository.ts`, `app/.../projects/` | Create project, assign to hotel, set status |
| 8 | **Project detail** | ✅ Done | `app/.../projects/[id]/`, `components/projects/` | Add line items (fabric × item type × location), set supply source |
| 9 | **Stock consumption** | ✅ Done | `project.repository.ts` — addItem() + deleteItem() | FIFO deduction in atomic transaction; stock restored on item delete |

---

### Phase 4 — Reports
*Read-only views over existing data.*

| # | Feature | Files touched | Notes |
|---|---------|---------------|-------|
| 10 | **Material usage** | ✅ Done | `domain/project.ts` (MaterialUsageRow), `application/projects/queries/get-material-usage-report.ts`, `infrastructure/repositories/project.repository.ts`, `app/.../reports/page.tsx`, `components/reports/material-usage-table.tsx` | Flat detail table + by-fabric aggregate; filters: hotel, status, delivery date range |

---

### Phase 5 — Dashboard & Polish
| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 11 | **Dashboard** | ✅ Done | Summary cards: active projects, draft, delivered, low stock alerts; Recent POs table; Low stock fabrics list |
| 12 | **Arabic translations** | ✅ Done | All keys filled in alongside each feature; dashboard + reports blocks added |

---

## Key Architectural Decisions

### Routing
- All routes are under `src/app/[locale]/` — e.g. `/en/projects`, `/ar/hotels`
- Auth routes live in `(auth)` route group, dashboard routes in `(dashboard)` route group
- Root `/` redirects to `/en`
- `src/proxy.ts` handles auth guards and locale redirects (Next.js 16 uses `proxy.ts` instead of `middleware.ts`)

### Prisma 7 Setup
- `url` and `directUrl` are **no longer in `schema.prisma`** (Prisma 7 breaking change)
- Connection URL lives in `prisma.config.ts` under `datasource.url`
- Runtime queries use `PrismaPg` adapter passed to `PrismaClient({ adapter })`
- `prisma.config.ts` loads `.env.local` manually via `dotenv` (Prisma CLI does not read `.env.local` by default)

### i18n
- Supported locales: `en` (default) and `ar`
- Arabic uses RTL layout — the locale layout sets `dir="rtl"` automatically
- Translation files: `messages/en.json` and `messages/ar.json`
- Language switcher in the header swaps locale while keeping the current path

### Auth
- **Internal users only** — no public signup page
- Users are created manually via Supabase Dashboard → Authentication → Users
- All users share the same permissions (no role-based access, for now)

---

## Domain Model

### Hotels (Clients)
- A hotel has a name (EN + AR), multiple **locations** (e.g. "Main Branch", "Red Sea Branch"), and multiple **contacts**
- Each contact has a name, role, phone, email, and an `isPrimary` flag

### Projects
- Belongs to a hotel
- Status flow: `DRAFT → CONFIRMED → IN_PRODUCTION → DELIVERED`
- Contains multiple **ProjectItems** — each item is one fabric × item type × location combination
- Example item: "50m of Fabric X used for curtains in Suite 301"

### Project Items & Supply Source
Each project item has a `SupplySource`:
- `INVENTORY` — deducted from our stock
- `CLIENT` — the hotel provided the fabric (still logged for material usage tracking)
- `DIRECT` — bought specifically for this project, not via inventory

### Fabrics
- Has a code reference, name (EN + AR), and unit (`METERS` or `ROLLS`)
- Roll size varies per batch/order (not a fixed constant)
- Can be sourced from multiple vendors (many-to-many via `FabricVendor`)

### Inventory
- Raw fabric is tracked in **InventoryBatches** — each batch comes from a PO line
- Batches track `quantityIn`, `quantityLeft`, `unitCost`, and optionally `metersPerRoll`
- When a project item consumes stock, a `ProjectItemUsage` record links the item to the batch and decrements `quantityLeft`

### Purchase Orders
- Can be linked to a specific project **or** standalone (bulk buy independent of any project)
- Status: `PENDING → RECEIVED / PARTIAL / CANCELLED`
- Each PO line specifies fabric, quantity, unit price, and optional roll size
- Receiving a PO creates `InventoryBatch` records

### Vendors
- Linked to fabrics via `FabricVendor`
- Pricing is negotiated per order (no fixed price list)

---

## Pages / Routes

| Route | Purpose |
|-------|---------|
| `/[locale]/login` | Login page |
| `/[locale]` | Dashboard (home) |
| `/[locale]/projects` | Project list |
| `/[locale]/inventory` | Fabric inventory & stock levels |
| `/[locale]/purchase-orders` | Purchase orders |
| `/[locale]/vendors` | Vendor list |
| `/[locale]/hotels` | Hotel & client list |
| `/[locale]/reports` | Material usage reports |

---

## Reports (Phase 1 Scope)

- **Material usage** — which fabrics were consumed, by which project, and how much
- Profitability and outstanding order reports are out of scope for now

---

## Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Prisma 7 — use Direct Connection from Supabase > Settings > Database
# Encode special characters in password: @ → %40, & → %26, / → %2F, # → %23
DATABASE_URL=postgresql://postgres:PASSWORD@db.your-project.supabase.co:5432/postgres
```

> **Note:** The username for the direct connection is `postgres` (not `postgres.projectref`).
> The `postgres.projectref` format is only for the Supabase pooler connection.

---

## Implementation Log

### Phase 1.1 — Hotels ✅ (2026-05-19)

**What was built:**
- Full CRUD for hotels (list + detail page with tabs)
- Contacts sub-feature: add, edit, delete per hotel
- Locations sub-feature: add, delete per hotel
- Established the Onion Architecture pattern for all future features

**How it was built:**

*Domain layer* (`src/domain/`)
- `errors.ts` — base `DomainError`, `NotFoundError`, `HotelNotFoundError`
- `hotel.ts` — pure TypeScript types (`Hotel`, `HotelSummary`, `HotelLocation`, `HotelContact`) + all input types + `IHotelRepository` interface

*Application layer* (`src/application/hotels/`)
- `schemas.ts` — Zod schemas for hotel, location, and contact forms. Note: `isPrimary` is `z.boolean()` without `.default()` to avoid React Hook Form type mismatch
- `queries/get-hotels.ts`, `queries/get-hotel-by-id.ts`
- `commands/` — one file per operation: create, update, delete hotel; add/delete location; add/update/delete contact

*Infrastructure layer* (`src/infrastructure/repositories/`)
- `hotel.repository.ts` — `HotelRepository implements IHotelRepository` using Prisma
- `delete()` checks for active projects before deleting (throws if `_count.projects > 0`)
- `findAll()` uses `_count` to return badge totals without loading relations
- `findById()` orders contacts by `isPrimary desc, nameEn asc`

*Presentation layer*
- `hotels/page.tsx` — Server Component, calls `getHotels(repo)` directly
- `hotels/[id]/page.tsx` — Server Component, catches `HotelNotFoundError` → `notFound()`
- `hotels/actions.ts` + `hotels/[id]/actions.ts` — Server Actions return `ActionResult` union type, revalidate both locale paths
- All actions follow the pattern: `{ success: true } | { success: false; error: string }`

*Components* (`src/components/hotels/`)
- `hotels-table.tsx` — table with badges, row actions, inline `AlertDialog` for delete confirm
- `hotel-form-dialog.tsx` — handles both create and edit via optional `hotel?` prop
- `hotel-detail-header.tsx` — shows EN name large, AR name muted, edit button
- `contacts-tab.tsx` / `locations-tab.tsx` — tab content with tables + dialogs
- `contact-form-dialog.tsx` — 2-column grid layout for name fields
- `location-form-dialog.tsx` — EN + AR name + optional address

*Shared UI added*
- `src/components/ui/page-header.tsx` — reusable page header with title, description, action slot
- `src/components/ui/empty-state.tsx` — centered icon + title + description + action slot

*Packages added*
- `next-themes` — required by shadcn's `sonner.tsx`
- `date-fns` — for date formatting in the hotels table
- shadcn components: `tabs`, `alert-dialog`

*Layout updated*
- `src/app/[locale]/layout.tsx` — added `ThemeProvider` (next-themes) + `<Toaster richColors position="top-right" />`

**Key decisions made during implementation:**
- `z.boolean()` without `.default()` in contact schema — `.default()` creates an input/output type split that breaks React Hook Form's resolver typing
- `date-fns` `format()` wraps `new Date(hotel.createdAt)` because Next.js serializes Dates to strings across the server/client boundary
- Arabic name fields use `dir="rtl"` explicitly on the `Input` so placeholder and text render correctly regardless of page locale

---

### Phase 1.2 — Vendors ✅ (2026-05-19)

**What was built:**
- Full CRUD for vendors (list page with create/edit dialogs — no detail page needed)
- Table shows EN name, AR name, phone, email, fabric count badge, PO count badge, created date

**How it was built:**

*Domain layer* (`src/domain/`)
- `vendor.ts` — `Vendor`, `VendorSummary` (with `_count`), `CreateVendorInput`, `UpdateVendorInput`, `IVendorRepository`
- `errors.ts` — added `VendorNotFoundError`

*Application layer* (`src/application/vendors/`)
- `schemas.ts` — `nameEn` required (min 2), `nameAr`/`phone`/`email`/`address` optional; email uses the same `z.union([z.string().email(), z.literal("")])` pattern from contacts
- `queries/get-vendors.ts`, `queries/get-vendor-by-id.ts`
- `commands/` — `create-vendor.ts`, `update-vendor.ts`, `delete-vendor.ts`

*Infrastructure layer* (`src/infrastructure/repositories/`)
- `vendor.repository.ts` — `VendorRepository implements IVendorRepository`
- `findAll()` includes `_count` for `purchaseOrders` and `fabricVendors`
- `delete()` blocks deletion if vendor has `purchaseOrders > 0`

*Presentation layer*
- `vendors/page.tsx` — Server Component, calls `getVendors(repo)` + `getTranslations("vendors")`
- `vendors/actions.ts` — `createVendorAction`, `updateVendorAction`, `deleteVendorAction`; revalidates `/en/vendors` and `/ar/vendors`

*Components* (`src/components/vendors/`)
- `vendors-table.tsx` — table with badge counts (fabrics, orders), edit/delete row actions, `AlertDialog` for delete confirm, `EmptyState` for no results
- `vendor-form-dialog.tsx` — 2-column grid for EN/AR names and phone/email, full-width address field; handles both create and edit via optional `vendor?` prop

*Translations*
- `messages/en.json` + `messages/ar.json` — added full `vendors` key set

**Key decisions:**
- No detail page — vendors have no sub-entities (contacts/locations), so the table + dialog pattern covers everything
- `fabricVendors` count badge shows how many fabrics this vendor supplies; becomes useful once Fabrics feature is built
- Delete guard matches the Hotels pattern: checks PO count before allowing deletion

---

### Phase 1.3 — Fabrics ✅ (2026-05-19)

**What was built:**
- Full CRUD for fabrics at `/inventory` (Phase 2 will add stock tabs to the same page)
- Table shows code ref, EN/AR name, unit badge, vendor count, project count, created date
- Form includes vendor assignment via a scrollable checkbox list

**How it was built:**

*Domain layer*
- `fabric.ts` — `FabricUnit` ("METERS" | "ROLLS"), `Fabric`, `FabricSummary` (includes `vendors: [{ vendorId }]` for form pre-population + `_count`), `CreateFabricInput`, `UpdateFabricInput`, `IFabricRepository`
- `errors.ts` — added `FabricNotFoundError`

*Application layer* (`src/application/fabrics/`)
- `schemas.ts` — `codeRef` required (min 1), `nameEn` required (min 2), `unit` as `z.enum(["METERS","ROLLS"])`, `vendorIds` as optional string array
- Standard queries and commands following the Hotels/Vendors pattern

*Infrastructure layer*
- `fabric.repository.ts` — `findAll()` includes `vendors: { select: { vendorId: true } }` and `_count` for table display
- `create()` uses nested `vendors.create` to write `FabricVendor` junction records atomically
- `update()` uses `vendors.deleteMany: {}` then `vendors.create` to sync the full vendor set; only runs when `vendorIds !== undefined` (undefined = no change, `[]` = clear all)
- `delete()` blocks if fabric has purchase order lines, inventory batches, or project items

*Presentation layer*
- `inventory/page.tsx` — fetches both fabrics and vendors in parallel (vendors needed to populate the form's vendor checkbox list)
- `inventory/actions.ts` — standard create/update/delete actions

*Components* (`src/components/fabrics/`)
- `fabrics-table.tsx` — unit displayed as `Badge variant="outline"`, vendor/project counts as `Badge variant="secondary"`/`"default"`
- `fabric-form-dialog.tsx` — 2-column row for codeRef+unit, 2-column row for EN/AR names, full-width textarea for description, scrollable checkbox list for vendor assignment

*Packages added*
- shadcn `checkbox` component (installed via `npx shadcn@latest add checkbox`)

*Translations*
- `messages/en.json` + `messages/ar.json` — added full `fabrics` key set

**Key decisions:**
- Fabrics land at `/inventory` (not `/inventory/fabrics/`) so the sidebar link works immediately; Phase 2 will add stock-level views as tabs on the same page
- `FabricSummary` includes `vendors: [{ vendorId }]` (not just `_count`) so the edit form can pre-check the right vendor boxes without a separate fetch
- Vendor sync in `update()` uses `deleteMany + create` inside the same Prisma `update()` call, making it atomic without a manual transaction
- `description` field intentionally not stored in `FabricSummary` (not needed in the list view); only fetched on `findById` if a detail page is added later

---

### Phase 2.1 — Purchase Orders ✅ (2026-05-19)

**What was built:**
- List page at `/purchase-orders` with status badges, vendor, line count, order/expected dates
- Create page at `/purchase-orders/new` — full-page form with dynamic line items
- Detail page at `/purchase-orders/[id]` — shows header info and line items table with totals
- Delete (PENDING only) with redirect back to list

**How it was built:**

*Domain layer* (`src/domain/purchase-order.ts`)
- `PurchaseOrderStatus` ("PENDING" | "RECEIVED" | "PARTIAL" | "CANCELLED")
- `PurchaseOrderLine` — Decimal fields (`quantity`, `unitPrice`, `metersPerRoll`) typed as `number` in domain; converted from Prisma Decimal in the repository
- `PurchaseOrderSummary` — includes `vendor` object and `_count.lines` for the list
- `CreatePurchaseOrderInput` — `expectedAt` stored as `string` ("YYYY-MM-DD"), converted to `Date` in repository
- `PurchaseOrderNotFoundError` added to `errors.ts`

*Application layer* (`src/application/purchase-orders/`)
- `schemas.ts` — uses `z.coerce.number()` for quantity/price fields (HTML inputs return strings)
- `poLineSchema` validates each line; `purchaseOrderSchema` requires `lines` array min length 1
- Standard queries and commands; no `update` command (not needed for this phase)

*Infrastructure layer*
- `purchase-order.repository.ts` — `mapLine()` helper converts Prisma Decimal → number with `Number()`
- `create()` uses nested `lines.create` for atomic PO + lines creation
- `delete()` throws if status is not PENDING

*Presentation layer*
- `purchase-orders/page.tsx` — Server Component, "New PO" button links to `/new`
- `purchase-orders/new/page.tsx` — Server Component, fetches vendors + fabrics in parallel, renders `PurchaseOrderForm`
- `purchase-orders/[id]/page.tsx` — Server Component, catches `PurchaseOrderNotFoundError`
- `purchase-orders/actions.ts` — `createPurchaseOrderAction` returns `{ success, data: { id } }` so the form can redirect to the new PO's detail page

*Components* (`src/components/purchase-orders/`)
- `purchase-orders-table.tsx` — status badge uses `STATUS_VARIANT` map (PENDING=secondary, RECEIVED=default, PARTIAL=outline, CANCELLED=destructive)
- `purchase-order-form.tsx` — uses `useFieldArray` for dynamic lines; `LineRow` sub-component uses `useWatch` to detect fabric unit and conditionally show `metersPerRoll` input
- `purchase-order-detail.tsx` — calculates line totals and order total client-side from number fields; shows delete button only for PENDING
- `delete-po-button.tsx` — isolated client component for delete + AlertDialog + redirect

**Key decisions:**
- Full pages instead of dialogs — the create form has dynamic line items making a dialog impractical
- `Decimal → number` conversion in repository so values serialize cleanly across the server/client boundary
- `LineRow` uses `useWatch` (not local state) to react to fabric selection without lifting state up
- `createPurchaseOrderAction` returns the new PO's `id` so the form can redirect directly to the detail page
- No `update` command in this phase — editing a PO's header/lines can be added when needed

---

### Phase 2.2 — Receive PO ✅ (2026-05-19)

**What was built:**
- "Receive Order" button on the PO detail page (PENDING orders only)
- Confirmation dialog before committing the action
- Single Prisma transaction: creates one `InventoryBatch` per PO line, then sets PO status to `RECEIVED` and stamps `receivedAt`
- After confirm: toast notification + `router.refresh()` so the page re-renders with the updated `RECEIVED` badge and action buttons removed

**How it was built:**

*Domain layer*
- `inventory.ts` — NEW: `InventoryBatch` type (with optional `fabric` relation) + `IInventoryRepository` interface with `findByFabricId`; created now as groundwork for Phase 2.3
- `purchase-order.ts` — added `receive(id: string): Promise<PurchaseOrder>` to `IPurchaseOrderRepository`

*Application layer* (`src/application/purchase-orders/commands/`)
- `receive-order.ts` — thin use case; validates nothing beyond what the repository guards (status must be PENDING), delegates to `repo.receive(id)`

*Infrastructure layer*
- `purchase-order.repository.ts` — `receive()` implementation:
  1. Fetches PO with lines; throws `PurchaseOrderNotFoundError` if missing, throws if status ≠ PENDING
  2. Runs `prisma.$transaction`: creates `InventoryBatch` for each line (`quantityIn = quantityLeft = line.quantity`, `unitCost = line.unitPrice`, `metersPerRoll` and `currency` carried over), then updates PO to `{ status: "RECEIVED", receivedAt: new Date() }`
  3. Returns the full updated order via `mapOrder()`

*Presentation layer*
- `purchase-orders/actions.ts` — added `receivePurchaseOrderAction(id)`
- `purchase-order-detail.tsx` — "Receive Order" button shown alongside Delete for PENDING orders
- `receive-po-button.tsx` — NEW isolated client component: `PackageCheck` icon button → `AlertDialog` confirm → calls action → toast + `router.refresh()`

*Translations*
- `messages/en.json` + `messages/ar.json` — added `receive`, `receiveConfirm`, `receivedSuccess` keys under `purchaseOrders`

**Key decisions:**
- Single `prisma.$transaction` keeps inventory creation and PO status update atomic — no partial state if something fails mid-way
- `router.refresh()` (not `router.push()`) after receiving — stays on the detail page to confirm the updated status visually
- `IInventoryRepository` added to domain now even though no implementation is needed yet; Phase 2.3 will implement it in `inventory.repository.ts`

---

### Phase 2.3 — Inventory View ✅ (2026-05-19)

**What was built:**
- `/inventory` page upgraded to a two-tab layout: **Stock Levels** (default) + **Fabric Catalog** (existing)
- Stock Levels tab: per-fabric table with total quantity received, quantity left, batch count, and a status badge
- Status badges: "In Stock" (default), "Low Stock" (amber outline, ≤ 20% remaining), "Out of Stock" (destructive), "No batches" (muted)
- "Batches" button per row opens a dialog showing full batch history with received date, source PO, qty in/left, unit cost, and m/roll

**How it was built:**

*Domain layer* (`src/domain/inventory.ts`)
- Extended with `InventoryBatchWithPO` — batch type that includes the linked PO number for the history dialog
- Added `FabricStockSummary` — per-fabric aggregate (totalQuantityIn, totalQuantityLeft, batchCount) returned by the repository
- Updated `IInventoryRepository` to declare `getStockSummary()` and `getAllBatches()`

*Application layer* (`src/application/inventory/queries/`)
- `get-stock-summary.ts` — thin wrapper over `repo.getStockSummary()`
- `get-all-batches.ts` — thin wrapper over `repo.getAllBatches()`

*Infrastructure layer* (`src/infrastructure/repositories/inventory.repository.ts`) — NEW
- `getStockSummary()` — fetches all fabrics with their `inventoryBatches` (qty fields only), aggregates `totalQuantityIn` / `totalQuantityLeft` / `batchCount` in JS; all fabrics appear in the list even if they have no batches
- `getAllBatches()` — fetches all batches ordered by `receivedAt desc`, includes `purchaseOrderLine → purchaseOrder { id, poNumber }`; maps all Prisma Decimals to `number`

*Presentation layer*
- `inventory/page.tsx` — fetches fabrics, vendors, stock summaries, and all batches in parallel; groups batches into a `Record<fabricId, batch[]>` map; renders a `Tabs` layout (Stock tab default, Fabrics tab second)
- `components/inventory/stock-summary-table.tsx` — NEW client component; renders the stock table; tracks `selectedFabric` state to open the batch history dialog
- `components/inventory/batch-history-dialog.tsx` — NEW client component; `Dialog` showing the per-fabric batch table; low/empty quantities highlighted in amber/red; totals row at the bottom

*Translations*
- `messages/en.json` + `messages/ar.json` — replaced the sparse `inventory` key block with a full set covering all table columns, status labels, dialog title, and empty states

**Key decisions:**
- All batches are fetched once at page load (server component) and grouped client-side — avoids adding a "server query action" pattern just for on-demand reads; dataset size is manageable for this use case
- Low-stock threshold is 20% of `totalQuantityIn` — simple heuristic; no configurable threshold needed yet
- Stock tab is the default tab since that's the new Phase 2.3 focus; Fabric Catalog is still accessible as the second tab
- `getStockSummary()` returns ALL fabrics (not just those with stock) so the team can see which fabrics have never been ordered

---

### Phase 3 — Projects ✅ (2026-05-19)

**What was built:**
- Projects list page at `/projects` — table with name, hotel, status badge, item count, dates; row click navigates to detail
- Create/Edit dialog for project header (name EN+AR, hotel, start/delivery dates, notes)
- Project detail page at `/projects/[id]` — header with inline status select, edit + delete buttons; Items tab
- Add Item dialog — fabric selector, item type (EN+AR), location (from hotel's locations or free-text note), quantity, supply source
- Delete item — restores inventory stock atomically if source was INVENTORY
- Delete project (DRAFT only) — restores all INVENTORY stock in a single transaction

**How it was built:**

*Domain layer*
- `domain/project.ts` — NEW: `ProjectStatus`, `SupplySource`, `ProjectItem`, `Project`, `ProjectSummary`, `CreateProjectInput`, `UpdateProjectInput`, `AddProjectItemInput`, `IProjectRepository`
- `domain/errors.ts` — added `ProjectNotFoundError`, `InsufficientStockError`

*Application layer* (`src/application/projects/`)
- `schemas.ts` — `projectSchema`, `updateProjectSchema` (partial), `projectStatusSchema`, `projectItemSchema`; `quantityNeeded` uses `z.coerce.number()` for HTML input strings
- `queries/` — `get-projects.ts`, `get-project-by-id.ts` (throws `ProjectNotFoundError` if not found)
- `commands/` — `create-project.ts`, `update-project.ts`, `update-project-status.ts`, `add-project-item.ts`, `delete-project-item.ts`, `delete-project.ts`

*Infrastructure layer* (`src/infrastructure/repositories/project.repository.ts`) — NEW
- `addItem()` — runs a `prisma.$transaction`: creates `ProjectItem`, then if `source === "INVENTORY"`, consumes stock FIFO (batches ordered by `receivedAt asc`), creates `ProjectItemUsage` per batch consumed, decrements `quantityLeft`; throws `InsufficientStockError` if stock falls short
- `deleteItem()` — transaction: finds all `ProjectItemUsage` records, increments `quantityLeft` on each referenced batch, then deletes the item (usages cascade)
- `delete()` — DRAFT-only guard; transaction: restores stock for all INVENTORY items, then deletes project (cascades to items → usages)
- Float tolerance: `remaining > 0.001` check and `parseFloat(x.toFixed(6))` to avoid phantom shortfalls from float arithmetic

*Presentation layer*
- `projects/page.tsx` — fetches projects + hotels in parallel; renders `ProjectsTable`
- `projects/actions.ts` — `createProjectAction` (returns `{ data: { id } }` for potential future redirect), `updateProjectAction`, `deleteProjectAction`
- `projects/[id]/page.tsx` — first fetches project, then hotel + fabrics + hotels in parallel; passes `hotel.locations` to items tab
- `projects/[id]/actions.ts` — `updateProjectStatusAction`, `addProjectItemAction`, `deleteProjectItemAction`; all revalidate both locale paths + `/inventory` (stock changes affect that page)

*Components* (`src/components/projects/`)
- `projects-table.tsx` — row-click navigation; DELIVERED rows get green badge via custom Tailwind class; delete button only shown for DRAFT
- `project-form-dialog.tsx` — create + edit via optional `project?` prop; dates formatted with `date-fns`
- `project-detail-header.tsx` — inline status `Select` (any → any transition); edit button opens `ProjectFormDialog`; delete button (DRAFT only) + confirm dialog + redirect
- `project-items-tab.tsx` — items table with source badge (INVENTORY=default, CLIENT=secondary, DIRECT=outline); per-row delete with confirmation
- `add-project-item-dialog.tsx` — `useWatch` on `fabricId` + `useEffect` to auto-set `unit` from selected fabric; location select only rendered when hotel has locations

*Translations*
- Full `projects` key block added to both `en.json` and `ar.json`

**Key decisions:**
- Stock consumption is atomic in the repository layer (same `prisma.$transaction` as item creation) — avoids orphaned items if stock check fails
- FIFO order: `inventoryBatch` ordered by `receivedAt asc` — oldest stock used first
- Deleting INVENTORY items always restores stock — no "consumed stock is permanent" semantics at this stage; the CRM is the source of truth
- Status transitions are unconstrained at the application level — any → any; the team decides the workflow, not the software
- Project delete restricted to DRAFT only (same guard as PO delete on PENDING); prevents accidental loss of confirmed work

---

### Phase 4 — Material Usage Report ✅ (2026-05-20)

**What was built:**
- `/reports` page with a full material usage report replacing the placeholder stub
- Filter bar: hotel, project status, and delivery date range (with live row count + reset button)
- Two-tab view: **By Project** (flat detail rows) and **By Fabric** (aggregated totals)
- Empty state for no data / no filter matches

**How it was built:**

*Domain layer* (`src/domain/project.ts`)
- Added `MaterialUsageRow` type — one row per `ProjectItem`, carrying denormalized project, hotel, fabric, and usage fields
- Added `getMaterialUsageReport(): Promise<MaterialUsageRow[]>` to `IProjectRepository`

*Application layer* (`src/application/projects/queries/get-material-usage-report.ts`) — NEW
- Thin wrapper: `getMaterialUsageReport(repo)` delegates to `repo.getMaterialUsageReport()`

*Infrastructure layer* (`src/infrastructure/repositories/project.repository.ts`)
- `getMaterialUsageReport()` queries `ProjectItem` with nested `project → hotel` and `fabric` includes; maps Prisma Decimal → `number` and returns flat `MaterialUsageRow[]` ordered by `project.createdAt desc`
- Added `SupplySource` to the top-level import (was previously missing)

*Presentation layer*
- `reports/page.tsx` — Server Component; fetches rows + hotels in parallel; passes data to `MaterialUsageTable`

*Components* (`src/components/reports/material-usage-table.tsx`) — NEW
- `MaterialUsageTable` — client component with full filter + view logic
- Filter bar: hotel `Select`, status `Select`, two `date` `Input`s for delivery date range, reset `Button`, live row count
- Filtering is done client-side with `useMemo` — all rows are loaded once at page load
- **By Project tab**: flat `Table` — Project, Hotel, Fabric (name + code), Item Type, Qty + unit, Source badge, Status badge, Delivery date
- **By Fabric tab**: aggregated `Map` keyed by `fabricId`; accumulates `totalQty` and a `Set<projectId>` for unique project count; sorted by highest consumption; renders Code, Fabric name, Total qty, Project count

*Translations*
- `messages/en.json` + `messages/ar.json` — added full `reports` key block

**Key decisions:**
- Client-side filtering over URL search params — consistent with how inventory and other pages work; dataset size is manageable
- `byFabric` aggregation uses `parseFloat(x.toFixed(3))` accumulation to avoid float drift across many rows
- Both tabs share the same filtered rows — switching tabs instantly re-aggregates without any extra fetches
- Hotels fetched from `HotelRepository` (not derived from rows) so the hotel dropdown always shows all hotels, even those with no project items yet

---

### Phase 5 — Dashboard & Polish ✅ (2026-05-20)

**What was built:**
- Full dashboard at `/` replacing the placeholder stub
- 4 stat cards: Active Projects (confirmed + in-production), Draft Projects, Delivered Projects, Low Stock Alerts
- Recent Purchase Orders section (last 5, linked to detail pages)
- Low Stock Fabrics section (same 20% threshold as the inventory page); green "all stocked" state when empty
- Full Arabic translation blocks added for `dashboard` and `reports`

**How it was built:**

*Domain layer* (`src/domain/dashboard.ts`) — NEW
- `DashboardStats` type — project count breakdown, low stock fabrics array, recent POs array
- `IDashboardRepository` interface with single `getStats()` method

*Application layer* (`src/application/dashboard/get-dashboard-stats.ts`) — NEW
- Thin wrapper: `getDashboardStats(repo)` delegates to `repo.getStats()`

*Infrastructure layer* (`src/infrastructure/repositories/dashboard.repository.ts`) — NEW
- `getStats()` runs three queries in parallel via `Promise.all`:
  1. `project.groupBy({ by: ["status"], _count: true })` — gets all 4 project counts in one DB round-trip
  2. `fabric.findMany` with `inventoryBatches` (qty fields only) — aggregates totalIn/totalLeft per fabric in JS; filters for ≤ 20% threshold (same heuristic as inventory page)
  3. `purchaseOrder.findMany({ take: 5, orderBy: createdAt desc })` with vendor name — returns the 5 most recent POs
- Decimal fields from Prisma converted to `number` via `Number()`

*Presentation layer* (`src/app/[locale]/(dashboard)/page.tsx`)
- Server Component; fetches stats + translations in parallel
- Uses `getLocale()` from `next-intl/server` to prefix navigation links (`/${locale}/purchase-orders`, `/${locale}/inventory`)
- 4-column stat card grid (2 columns on small screens); `border-destructive/50` highlight on low-stock card when count > 0
- Recent POs table: PO number links to detail page, vendor, date, status badge using `PO_STATUS_VARIANT` map
- Low stock table: fabric name + code, qty left (red), total in (muted)

*Translations*
- `messages/en.json` + `messages/ar.json` — added full `dashboard` key block; `reports` block already added in Phase 4

**Key decisions:**
- `groupBy` for project counts instead of `findMany` — avoids loading all project records just for counts; single DB round-trip
- Three parallel queries instead of a transaction — reads are safe to run concurrently and there's no atomicity requirement for a dashboard
- Low-stock threshold kept at 20% to stay consistent with the inventory page — single source of truth if threshold ever changes
- `getLocale()` (not `params`) for locale in the Server Component — cleaner than drilling params; consistent with how `getTranslations` works in this project

---

## Setup from Scratch

```bash
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run dev
```

Add users via: **Supabase Dashboard → Authentication → Users → Add user**
