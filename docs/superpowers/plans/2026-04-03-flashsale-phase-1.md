# Flash Sale Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an end-to-end flash sale system with admin management and storefront flash sale rendering, where flash sale price overrides normal displayed pricing.

**Architecture:** Implement flash sale as a dedicated product-level campaign subsystem with its own database tables, admin CRUD APIs, storefront query helpers, and admin/storefront UI integrations. Reuse the existing route split (`src/routes/*`), page split (`src/pages/*`), and DB bootstrap pattern (`src/lib/db.ts`) so the feature fits the refactored codebase without regressing into monolithic edits.

**Tech Stack:** Hono, Cloudflare D1, SSR HTML pages from `src/pages/*`, Tailwind utility classes in inline page templates, Axios on the client, existing `npm run build` and `npm run check:ui-safety` verification flow.

---

## File Structure

### New files

- `src/routes/flashSaleRoutes.ts`
  - Admin CRUD routes and storefront flash sale query routes.
- `src/lib/flashSaleHelpers.ts`
  - Shared pricing/status helpers for campaign status, active item filtering, and display price resolution.
- `docs/superpowers/specs/2026-04-03-flashsale-design.md`
  - Existing approved design spec.

### Modified files

- `src/index.tsx`
  - Register the new flash sale route module.
- `src/lib/db.ts`
  - Create and migrate `flash_sales` and `flash_sale_items` tables.
- `src/pages/adminPage.ts`
  - Add `Marketing > Flashsale`, flash sale page shell, listing UI, and create modal UI/logic.
- `src/pages/storefrontPage.ts`
  - Render flash sale badges, countdown, effective pricing, and `Flash Sale của shop` section.
- `src/routes/productRoutes.ts`
  - Enrich product payloads with flash sale fields if the helper approach is wired here.
- `scripts/check-ui-safety.mjs`
  - Optional only if a flash sale-specific storefront/admin page check becomes necessary.

### Existing files to inspect while implementing

- `src/routes/voucherStatsRoutes.ts`
  - Existing discount-related admin/storefront patterns.
- `src/routes/productRoutes.ts`
  - Product payload shape and storefront product endpoints.
- `src/pages/adminPage.ts`
  - Existing sidebar, page switching, modal, tab, and listing patterns.
- `src/pages/storefrontPage.ts`
  - Existing product cards, detail modal, mobile sliders, and pricing UI.

## Implementation Notes

- Keep phase 1 at **product level only**.
- Prefer `sale_price` over `discount_percent` when both exist.
- `flash sale` overrides display price only; voucher logic remains checkout-only.
- Use derived status for campaign state rather than storing duplicate status text.
- Follow the project rule of **one user request = one commit**, but this plan itself is intentionally decomposed into many small implementation commits.

## Task 1: Add database support for flash sale campaigns

**Files:**
- Create: `src/lib/flashSaleHelpers.ts`
- Modify: `src/lib/db.ts`
- Test: build + DB initialization smoke verification

- [ ] **Step 1: Write the failing helper contract notes into code comments or a minimal scaffold**

Create `src/lib/flashSaleHelpers.ts` with exported placeholders for:

```ts
export function getFlashSaleStatus(...) {}
export function resolveFlashSaleDisplay(...) {}
export function isFlashSaleActive(...) {}
```

This keeps the pricing/status rules out of page templates.

- [ ] **Step 2: Run build to verify the scaffold fails as expected if imports are incomplete**

Run: `npm run build`
Expected: fail if the new helper file is referenced before implementation, or pass if scaffold is not yet wired.

- [ ] **Step 3: Add flash sale tables in `src/lib/db.ts`**

Add `CREATE TABLE IF NOT EXISTS` statements for:

- `flash_sales`
- `flash_sale_items`

Recommended schema:

```sql
CREATE TABLE IF NOT EXISTS flash_sales (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  start_at DATETIME NOT NULL,
  end_at DATETIME NOT NULL,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
```

```sql
CREATE TABLE IF NOT EXISTS flash_sale_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  flash_sale_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  sale_price REAL,
  discount_percent REAL,
  purchase_limit INTEGER DEFAULT 0,
  is_enabled INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
```

Also add indexes for:

- `flash_sales(start_at, end_at, is_active)`
- `flash_sale_items(flash_sale_id)`
- `flash_sale_items(product_id)`

- [ ] **Step 4: Implement the helper functions minimally**

In `src/lib/flashSaleHelpers.ts`, implement:

- `isFlashSaleActive(campaign, now)`
- `getFlashSaleStatus(campaign, now)`
- `resolveFlashSaleDisplay({ price, originalPrice, salePrice, discountPercent })`

Keep these pure and reusable.

- [ ] **Step 5: Run build and verify DB/init code passes**

Run: `npm run build`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/lib/db.ts src/lib/flashSaleHelpers.ts
git commit -m "Add flash sale schema and helpers"
```

## Task 2: Add flash sale route module and register it

**Files:**
- Create: `src/routes/flashSaleRoutes.ts`
- Modify: `src/index.tsx`
- Test: route registration smoke check

- [ ] **Step 1: Create the route module skeleton**

Create `src/routes/flashSaleRoutes.ts` exporting:

```ts
export function registerFlashSaleRoutes(app: Hono<{ Bindings: AppBindings }>, deps: { initDB: ... }) {}
```

- [ ] **Step 2: Add failing placeholder endpoints**

Add temporary JSON responses for:

- `GET /api/admin/flash-sales`
- `POST /api/admin/flash-sales`
- `GET /api/admin/flash-sales/:id`
- `PUT /api/admin/flash-sales/:id`
- `PATCH /api/admin/flash-sales/:id/toggle`
- `DELETE /api/admin/flash-sales/:id`
- `GET /api/flash-sales/active-products`

- [ ] **Step 3: Register the module in `src/index.tsx`**

Import and call `registerFlashSaleRoutes(app, { initDB })` near the other route registrations.

- [ ] **Step 4: Run build to ensure route wiring is valid**

Run: `npm run build`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/routes/flashSaleRoutes.ts src/index.tsx
git commit -m "Register flash sale routes"
```

## Task 3: Implement admin flash sale listing APIs

**Files:**
- Modify: `src/routes/flashSaleRoutes.ts`
- Test: endpoint smoke checks via local HTTP or route-level manual checks

- [ ] **Step 1: Implement `GET /api/admin/flash-sales`**

Return campaigns with derived fields:

- `status`
- `product_count`
- `start_at`
- `end_at`

Support an optional status filter for:

- `all`
- `active`
- `upcoming`

- [ ] **Step 2: Implement `GET /api/admin/flash-sales/:id`**

Return campaign header and selected products/items for edit/view.

- [ ] **Step 3: Use shared helper status logic**

Ensure route responses derive status via `getFlashSaleStatus()` so admin and storefront stay consistent.

- [ ] **Step 4: Run build**

Run: `npm run build`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/routes/flashSaleRoutes.ts
git commit -m "Add flash sale admin listing APIs"
```

## Task 4: Implement admin create/update/delete/toggle APIs

**Files:**
- Modify: `src/routes/flashSaleRoutes.ts`
- Test: manual API validation via local requests or browser-driven admin flow later

- [ ] **Step 1: Implement request validation helpers inside the route module**

Validate:

- required name
- required start/end
- `end_at > start_at`
- at least one product item
- item has valid promotional value

- [ ] **Step 2: Implement `POST /api/admin/flash-sales`**

Create campaign and insert related `flash_sale_items` in one logical transaction flow.

- [ ] **Step 3: Implement `PUT /api/admin/flash-sales/:id`**

Update campaign fields and replace child item rows safely.

- [ ] **Step 4: Implement `PATCH /api/admin/flash-sales/:id/toggle` and `DELETE /api/admin/flash-sales/:id`**

Toggle enable state and allow delete with child cleanup.

- [ ] **Step 5: Run build**

Run: `npm run build`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/routes/flashSaleRoutes.ts
git commit -m "Add flash sale admin mutation APIs"
```

## Task 5: Implement storefront flash sale query support

**Files:**
- Modify: `src/routes/flashSaleRoutes.ts`
- Modify: `src/routes/productRoutes.ts`
- Modify: `src/lib/flashSaleHelpers.ts`
- Test: storefront payload inspection

- [ ] **Step 1: Implement `GET /api/flash-sales/active-products`**

Return only active flash sale products with computed display price fields.

- [ ] **Step 2: Enrich product payloads**

Add flash sale fields to existing product responses returned from:

- `/api/products`
- `/api/products/:id`
- optionally `/api/trending-products` and `/api/featured-products`

Use the helper so the same shape is reused everywhere.

- [ ] **Step 3: Keep fallback behavior safe**

If flash sale data is invalid or missing, preserve the old product payload shape and standard pricing.

- [ ] **Step 4: Run build**

Run: `npm run build`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/routes/flashSaleRoutes.ts src/routes/productRoutes.ts src/lib/flashSaleHelpers.ts
git commit -m "Add storefront flash sale product data"
```

## Task 6: Add admin sidebar entry and flash sale page shell

**Files:**
- Modify: `src/pages/adminPage.ts`
- Test: admin page navigation shell render

- [ ] **Step 1: Add `Marketing` menu group**

Follow the existing `Cài đặt` collapsible pattern.

Add submenu item:

- `Flashsale`

- [ ] **Step 2: Add `page-flashsale` shell**

Add a new page panel with:

- page title
- short description
- tabs for statuses
- create button
- table/list shell placeholder

- [ ] **Step 3: Extend page navigation logic**

Update:

- visible page list
- title mapping
- page switch logic

- [ ] **Step 4: Run build**

Run: `npm run build`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/pages/adminPage.ts
git commit -m "Add admin flash sale page shell"
```

## Task 7: Build the admin flash sale list UI

**Files:**
- Modify: `src/pages/adminPage.ts`
- Test: admin UI manual render check

- [ ] **Step 1: Add client state for flash sale listing**

Introduce variables for:

- selected status tab
- flash sale records
- loading state

- [ ] **Step 2: Implement `loadFlashSales()`**

Fetch `/api/admin/flash-sales` with the selected filter.

- [ ] **Step 3: Implement listing render**

Render rows/cards with:

- campaign name
- badge status
- start time
- end time
- product count
- action buttons

Use the current admin visual language.

- [ ] **Step 4: Wire tab switching**

Clicking tabs reloads filtered results.

- [ ] **Step 5: Run build and `check:ui-safety`**

Run:

- `npm run build`
- `npm run check:ui-safety`

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/pages/adminPage.ts
git commit -m "Render admin flash sale listings"
```

## Task 8: Build the create flash sale modal

**Files:**
- Modify: `src/pages/adminPage.ts`
- Test: admin modal manual validation

- [ ] **Step 1: Add modal markup**

Modal needs:

- campaign name
- start/end date time
- product picker area
- selected product pricing rows

- [ ] **Step 2: Add product selection flow**

Reuse existing product loading patterns from admin products where possible instead of inventing a new fetch style.

- [ ] **Step 3: Add pricing row logic**

Per selected product support:

- sale price
- or discount percent
- optional purchase limit

- [ ] **Step 4: Add validation and submit flow**

Submit to `POST /api/admin/flash-sales` and refresh the listing.

- [ ] **Step 5: Run build and `check:ui-safety`**

Run:

- `npm run build`
- `npm run check:ui-safety`

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/pages/adminPage.ts
git commit -m "Add flash sale creation modal"
```

## Task 9: Add storefront flash sale card pricing and badges

**Files:**
- Modify: `src/pages/storefrontPage.ts`
- Modify: `src/lib/flashSaleHelpers.ts` if storefront rendering needs helper tweaks
- Test: storefront load and card rendering

- [ ] **Step 1: Update product card rendering**

If `flash_sale_active` is true, render:

- flash sale badge
- countdown
- flash sale price
- struck-through original price

- [ ] **Step 2: Preserve non-flash products**

Ensure normal products render exactly as before when flash sale data is absent.

- [ ] **Step 3: Run build and `check:ui-safety`**

Run:

- `npm run build`
- `npm run check:ui-safety`

Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/pages/storefrontPage.ts src/lib/flashSaleHelpers.ts
git commit -m "Show flash sale pricing on storefront cards"
```

## Task 10: Add flash sale UI to product detail modal

**Files:**
- Modify: `src/pages/storefrontPage.ts`
- Test: product detail modal interaction

- [ ] **Step 1: Extend detail modal rendering**

When flash sale metadata exists, show:

- flash sale strip/badge
- countdown
- overridden main display price
- struck-through comparison price

- [ ] **Step 2: Keep buy flow unchanged**

Do not alter:

- color selection validation
- size validation
- add-to-cart
- quick order open flow

- [ ] **Step 3: Run build and `check:ui-safety`**

Run:

- `npm run build`
- `npm run check:ui-safety`

Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/pages/storefrontPage.ts
git commit -m "Show flash sale details in product modal"
```

## Task 11: Add `Flash Sale của shop` storefront section

**Files:**
- Modify: `src/pages/storefrontPage.ts`
- Test: storefront section render

- [ ] **Step 1: Add section shell**

Add a dedicated storefront section for active flash sale products.

- [ ] **Step 2: Load active flash sale products**

Fetch from `/api/flash-sales/active-products`.

- [ ] **Step 3: Render responsive layout**

Recommended:

- desktop strip/grid
- mobile horizontal slider

Keep click-to-open product detail modal behavior.

- [ ] **Step 4: Run build and `check:ui-safety`**

Run:

- `npm run build`
- `npm run check:ui-safety`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/pages/storefrontPage.ts
git commit -m "Add storefront flash sale section"
```

## Task 12: End-to-end verification and regression pass

**Files:**
- Modify: any small fixes discovered during verification
- Test: full regression checklist

- [ ] **Step 1: Verify admin create flow**

Check:

- campaign can be created
- tabs show correct derived status
- selected products and pricing persist

- [ ] **Step 2: Verify storefront price override**

Check:

- product card pricing
- detail modal pricing
- flash sale section rendering

- [ ] **Step 3: Verify regression-sensitive flows**

Check:

- product listing loads
- quick order modal still works
- add-to-cart still works
- vouchers still apply during checkout
- existing admin pages still load

- [ ] **Step 4: Run final verification**

Run:

- `npm run build`
- `npm run check:ui-safety`

Expected: PASS

- [ ] **Step 5: Commit final fixes**

```bash
git add <changed-files>
git commit -m "Polish flash sale phase 1 integration"
```

## Review Notes

This plan is intentionally staged so each commit produces a testable slice:

- schema/helpers
- routes
- admin shell
- admin modal
- storefront pricing
- storefront section
- regression pass

That sequence minimizes blast radius and makes rollback straightforward if any slice causes a regression.
