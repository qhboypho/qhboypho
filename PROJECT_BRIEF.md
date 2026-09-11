# Project Brief

## Purpose

QH Clothes storefront and admin panel built on Hono, Vite, Cloudflare Pages/Workers, and D1.

## Run And Verify

- Install: `npm install`
- Build: `npm run build`
- Full release gate: `npm run check:release` (strict TypeScript, launch tests, real workerd smoke tests, admin contract, full dependency audit).
- Local Pages server: `npm run dev:sandbox`
- Admin dashboard smoke check: `npm run test:admin-dashboard-local`
- Launch regression suite: `npm run test:launch` (isolated SQLite and mocked providers; includes build).
- Admin authentication requires a configured PBKDF2 password hash; there is no `admin` / `admin` fallback.

## Key Areas

- App entry and route registration: `src/index.tsx`
- Admin UI HTML/scripts: `src/pages/admin/*`
- Orders/admin stats API: `src/routes/orderRoutes.ts`, `src/routes/voucherStatsRoutes.ts`
- Database migrations: `migrations/*`

## Current Notes

- Local `frontend-v2` refresh keeps the stacked hero carousel and auto-typing, introduces scoped cobalt light/dark surfaces, improves checkout labels/touch targets/dialog focus and payment selection semantics, and disables fabricated purchase notifications on the main storefront. No deployment is implied by this branch.
- UI checks: `node scripts/test-frontend-v2-ui.mjs`, `node scripts/test-frontend-v2-modal-runtime.mjs`, and `node scripts/test-frontend-v2-purchase-toast.mjs`, plus build/typecheck/launch regression checks. Browser QA must cover both themes and mobile checkout; synthetic local fixtures do not validate live merchant/carrier behavior.
- Product photos and live promotional prices remain data-owned: the observed Polo/chair mismatch was not changed in production; investigate live product/variant pricing with real fixtures before claiming a data correction.
- `/api/admin/stats` supports dashboard date filters via `mode=month&month=YYYY-MM`, `mode=day&date=YYYY-MM-DD`, or `mode=all`.
- Dashboard revenue counts paid non-cancelled orders plus completed COD orders, not every non-cancelled order.
- Dashboard date/month filter is injected next to the admin avatar and is only visible on the dashboard page.
- Dashboard now includes `Người xem sản phẩm`, counted from unique human browser visits to storefront product-list/detail endpoints and deduped by signed visitor cookie per local day.
- On mobile, the dashboard date filter sits under the top bar and above the stat cards, so long month/day text never overflows horizontally.
- On mobile, dashboard stat cards use tighter labels and smaller values so the metric text stays inside the cards.
- Dashboard financial overview now uses only delivered revenue from orders in `done` status that do not have `return_status` of `returned`, `cancelled`, or `delivery_failed`; tax estimates use the household goods-selling rates `VAT 1%` and `TNCN 0.5%`.
- Completed orders now persist `delivered_at`; dashboard financial totals and the admin tax-report export use that delivery-complete timestamp instead of order creation time.
- The dashboard financial panel now exposes an Excel export button that downloads the currently filtered successful-order tax evidence, including order code, tracking code, order date, delivered date, order value, per-order VAT/TNCN, and total tax.
- The sidebar `Đơn hàng` badge uses the all-time shipping-queue total for non-internal orders, matching the `Sắp xếp vận chuyển` + `Đang chờ vận chuyển` split on the orders page.
- MoMo checkout uses a server-created `captureWallet` session and a signed IPN at `/api/payments/momo/ipn`; provide the MoMo credentials and public HTTPS IPN URL as Worker secrets before enabling live payments.
- MoMo remains hidden in checkout; Apple Pay is not implemented.
- Checkout retries use a persisted guest access token and idempotency key. Migrations 0031–0034 add atomic stock/voucher reservations, payment and shipment attempts, and immutable manual-payment audit records. Historical orders are not assumed to have reserved stock.
- Unpaid online orders remain visible in admin but cannot ship as COD. Ambiguous carrier creation results require reconciliation before another attempt; delivery failure alone does not restore inventory.
- Manual VietQR must be explicitly configured, never used as an automatic PayOS-error fallback. An authorized operator must verify bank receipt and record its unique reference.
- Payment reconciliation runs in a separate scheduled Worker configured by `wrangler.payments.jsonc`; deploying Pages alone does not deploy this scheduler or its secrets.
- Production release requires backup, staging migration rehearsal, matching application/migration rollout and owner-supervised merchant/carrier acceptance. See `docs/launch-payment-checklist.md`; local passing tests do not verify live credentials.
- TypeScript baseline errors are fixed without disabling strict checks. The admin notification contract targets the settings button moved in c01c74bb.
- LiveChatRoom belongs to the separate private Worker in `wrangler.chat.jsonc`; deploy it before Pages. Its daily schedule owns expired-chat cleanup. Pages cannot host Durable Object classes or cron handlers.
- Preview bindings are intentionally empty until separate staging resources are provisioned. Never point preview at production D1/R2/chat. `deploy:prod` explicitly uses the verified production branch `ui-new-v1`, not the current local branch.
- Build dependencies were patched; Miniflare's pinned sharp is overridden to 0.35.4 to address its native-image security advisory. Revisit this override when upstream updates the pin. Install from package-lock.json with `npm ci`.
- Release preflight and remaining production gates: `docs/release-2026-09-10.md`. A backup rehearsal is not a deployment or a live merchant/carrier acceptance test.
- Isolated online staging now exists at `qhclothes-release-staging.pages.dev`, with separate D1/R2/private chat configs in `wrangler.staging.jsonc` and `wrangler.chat-staging.jsonc`. No provider secrets or production customer data are copied there.
- Remote D1 migration compatibility is tested: reservation triggers use `SELECT RAISE(...) WHERE changes() = 0`, avoiding nested CASE/END rejected by the remote parser. Chat date must not be in the UTC future.
- Production upgraded on 2026-09-10: Pages `a1467496` (source `b3aed844`), D1 migrations 0031–0034, private chat and payment reconciliation Workers deployed. Access protects `*.qhclothes.pages.dev`; canonical Pages/custom storefront domains remain public. Maintenance and fresh drained-backup rehearsal preceded migrations. See release notes for exact versions and private backup fingerprint.
- Post-release read-only HTTP/browser checks passed and historical orders were preserved. No production test order, payment or shipment was created. Actual cron execution, webhook registration and owner-supervised merchant/carrier acceptance still need verification; deployment success and mocked tests do not prove live provider correctness.
