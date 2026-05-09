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
- The sidebar `Đơn hàng` badge uses `sidebarUndeliveredOrders`: all non-internal orders whose status is not `done` or `cancelled`, independent of the dashboard date filter.
