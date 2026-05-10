# Project Brief

## Purpose

QH Clothes storefront and admin panel built on Hono, Vite, Cloudflare Pages/Workers, and D1.

## Run And Verify

- Install: `npm install`
- Build: `npm run build`
- Local Pages server: `npm run dev:sandbox`
- Admin dashboard smoke check: `npm run test:admin-dashboard-local`
- Local admin fallback credentials can be `admin` / `admin` when no DB password override is set.

## Key Areas

- App entry and route registration: `src/index.tsx`
- Admin UI HTML/scripts: `src/pages/admin/*`
- Orders/admin stats API: `src/routes/orderRoutes.ts`, `src/routes/voucherStatsRoutes.ts`
- Database migrations: `migrations/*`

## Current Notes

- `/api/admin/stats` supports dashboard date filters via `mode=month&month=YYYY-MM`, `mode=day&date=YYYY-MM-DD`, or `mode=all`.
- Dashboard revenue counts paid non-cancelled orders plus completed COD orders, not every non-cancelled order.
- Dashboard date/month filter is injected next to the admin avatar and is only visible on the dashboard page.
- Dashboard now includes `Người xem sản phẩm`, counted from unique human browser visits to storefront product-list/detail endpoints and deduped by signed visitor cookie per local day.
- On mobile, the dashboard date filter sits under the top bar and above the stat cards, so long month/day text never overflows horizontally.
- On mobile, dashboard stat cards use tighter labels and smaller values so the metric text stays inside the cards.
- Dashboard financial overview now uses only delivered revenue from orders in `done` status that do not have `return_status` of `returned`, `cancelled`, or `delivery_failed`; tax estimates use the household goods-selling rates `VAT 1%` and `TNCN 0.5%`.
- The sidebar `Đơn hàng` badge uses the all-time shipping-queue total for non-internal orders, matching the `Sắp xếp vận chuyển` + `Đang chờ vận chuyển` split on the orders page.
