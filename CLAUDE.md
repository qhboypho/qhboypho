# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project: QH Clothes (qhboypho)

## Overview

QH Clothes is a Vietnamese fashion e-commerce storefront on **Cloudflare Pages** + **Cloudflare D1** (SQLite). The entire app runs as a single **Hono** Worker (src/index.tsx). No separate frontend framework -- the UI is server-rendered HTML with vanilla JS injected as inline script-tag strings.

## Build / Dev / Deploy

    npm install
    npm run dev           # Vite dev server (port 5173)
    npm run dev:sandbox   # wrangler pages dev against dist (port 3000)
    npm run build         # Vite build for Cloudflare Pages
    npm run deploy        # build + wrangler pages deploy (preview)
    npm run deploy:prod   # build + deploy to production project qhclothes
    npm run preview       # wrangler pages dev against dist
    npm run cf-typegen    # regenerate worker-configuration.d.ts

    # Database (D1 local)
    npm run db:migrate:local
    npm run db:seed
    npm run db:reset

    # Alternative: build + CF deploy + git push to main
    ./deploy.sh

## Running Tests

No automated test runner (no Jest/Vitest). Tests are standalone Node.js scripts in scripts/:

    node scripts/test-zalopay-local.mjs
    node scripts/test-payos-local.mjs
    node scripts/test-admin-auth-flow.mjs
    node scripts/test-admin-dashboard-local.mjs
    node scripts/test-admin-source-contract.mjs
    node scripts/test-initdb-noop-contract.mjs
    node scripts/check-ui-safety.mjs

    # Some need --experimental-strip-types
    node --experimental-strip-types scripts/test-initdb-noop-contract.mjs

    # package.json shortcuts
    npm run test:payos-local
    npm run test:zalopay-local
    npm run test:initdb-noop
    npm run test:admin-auth-flow
    npm run test:admin-source-contract
    npm run test:admin-dashboard-local
    npm run check:ui-safety

Contract tests (e.g. test-admin-source-contract.mjs) use Node assert/strict to inspect
source files statically -- no running server needed.

## Architecture

### Platform

  Runtime:    Cloudflare Workers (Cloudflare Pages Functions)
  Framework:  Hono v4 -- routing, middleware, cookie helpers, JSX renderer
  Database:   Cloudflare D1 (SQLite-compatible, bound as env.DB)
  Build:      Vite + @hono/vite-build targeting cloudflare-pages
  Local dev:  @hono/vite-dev-server with Cloudflare adapter
  TypeScript: strict, moduleResolution Bundler, JSX via hono/jsx

### Entry Point

src/index.tsx -- creates Hono app, registers CORS + static middleware + admin auth guard,
wires all route modules, exports default app.

### Route Modules (src/routes/)

Each exports registerXxxRoutes(app, deps). Dependencies injected -- no global singletons.

  pageRoutes.ts          GET /  /admin/*  /admin/login  -- serve HTML pages
  productRoutes.ts       /api/products  /api/admin/products  /api/featured-products  /api/trending-products
  orderRoutes.ts         /api/orders  /api/admin/orders  /api/user/orders  GHTK shipping
  paymentRoutes.ts       PayOS + ZaloPay link/sync, Casso webhook, /api/address/...
  authRoutes.ts          Admin login/logout, Google OAuth, /api/auth/me
  voucherStatsRoutes.ts  Voucher CRUD + validation
  flashSaleRoutes.ts     Flash sale campaigns + items CRUD
  adminUtilityRoutes.ts  Hero banners, GHTK pickup config, app settings

### Library (src/lib/)

  adminHelpers.ts         Session token gen/validation, PBKDF2 password hashing (Web Crypto),
                          admin profile resolution, app_settings upsert/read
  userSessionHelpers.ts   Signed cookie-based user sessions; secret in app_settings
  paymentHelpers.ts       PayOS HMAC-SHA256 signing, ZaloPay MAC, syncOrderPayment* pollers,
                          address-kit in-memory cache (provinces + communes)
  shippingHelpers.ts      GHTK create/cancel shipment, PDF label fetch, PDF merge (pdf-lib),
                          Vietnamese address string parser
  productSkuHelpers.ts    SKU generation from color x size matrix, syncProductSkus, bulk load
  flashSaleHelpers.ts     Flash sale status, display price resolution, active sale map loader
  productFlashSaleView.ts Attach SKU-level flash sale state to product API responses
  orderColorHelpers.ts    Resolve selected color image from product color options
  db.ts                   createInitDB -- intentional no-op; schema = D1 migrations only

### Pages / HTML Generation (src/pages/)

TypeScript functions returning raw HTML strings. No template engine.

  src/pages/
    storefrontPage.ts    storefrontHTML()   customer-facing SPA shell
    adminPage.ts         adminHTML()         admin panel SPA shell
    adminLoginPage.ts    adminLoginHTML()
    storefront/          sections, styles, modals, script, script-detail-order
    admin/               sections, styles, modals, script, script-orders,
                         script-featured-settings, script-flashsale

Inline scripts are vanilla JS (global let vars + imperative DOM). No client bundler.
Tailwind CSS and Axios loaded from CDN.

### Database Schema (migrations/)

  0001_schema.sql                products, orders -- core tables + indexes
  0003_runtime_init_cleanup.sql  vouchers, transactions, users, app_settings,
                                 hero_banners, flash_sales, flash_sale_items;
                                 seeds initial hero banners
  0004_product_skus_flashsale.sql  product_skus (backfills from existing products);
                                   adds product_sku_id FK to flash_sale_items + orders

### Types (src/types/)

  app.ts    AppBindings = CloudflareBindings + optional payment/shipping env vars
  admin.ts  AppContext, AppSettingEntry, AdminProfile
  worker-configuration.d.ts  auto-generated (npm run cf-typegen) -- do not edit

## Key Patterns

### Dependency Injection
Route modules receive a typed deps object; src/index.tsx is the composition root that imports
all lib functions and threads them into registerXxxRoutes(). Modules are testable without a server.

### Admin Authentication
  Cookies: admin_token + admin_user_key (HttpOnly, SameSite=Lax, 30-day expiry)
  Token stored in app_settings as admin_session_{adminUserKey}
  Hono middleware guards /api/admin/* except /api/admin/login
  pageRoutes.ts redirects /admin/* to /admin/login if token invalid

### User Authentication
  Signed cookies via hono/cookie setSignedCookie; secret stored in app_settings
  Google OAuth: /api/auth/google -> Google -> /api/auth/callback
  Mock user fallback when Google credentials absent (dev convenience)

### Payment Providers
  COD:           no gateway; paid at delivery
  BANK_TRANSFER: PayOS -- webhook at /api/payments/payos/webhook
  ZALOPAY:       ZaloPay -- callback at /api/payments/zalopay/callback
  syncOrderPayment* helpers poll provider APIs on demand to reconcile payment_status.

### Shipping
  GHTK (Giao Hang Tiet Kiem) Vietnamese courier
  Pickup address stored in app_settings (admin configures in UI)
  Address parser expects: detail, ward, district, province (comma-separated)
  PDF labels fetched from GHTK and merged via pdf-lib

### SPA Shell Pattern
  Server renders full HTML once (all sections, modals, scripts)
  showPage(xxx) toggles hidden on div#page-xxx elements
  No client-side router

### Naming Conventions
  Route files          camelCaseRoutes.ts
  Lib files            camelCaseHelpers.ts
  Register functions   registerXxxRoutes(app, deps)
  HTML generators      xxxHTML(), xxxInlineScript()
  DB columns           snake_case
  Env vars             SCREAMING_SNAKE_CASE
  Order codes          QH + 6 random digits (e.g. QH123456)
  SKU codes            SKU-{productId}-{COLOR-SLUG}-{SIZE-SLUG}
  app_settings keys    snake_case (e.g. admin_session_admin, ghtk_pick_address_id)

## Local Environment (.dev.vars)

  ZALOPAY_APP_ID, ZALOPAY_KEY1, ZALOPAY_KEY2
  ZALOPAY_CREATE_ENDPOINT, ZALOPAY_QUERY_ENDPOINT (optional; sandbox defaults if absent)
  ZALOPAY_CALLBACK_URL (optional; recommended on production)
  PAYOS_CLIENT_ID, PAYOS_API_KEY, PAYOS_CHECKSUM_KEY
  GHTK_TOKEN, GHTK_CLIENT_SOURCE
  GHTK_PICK_NAME, GHTK_PICK_ADDRESS, GHTK_PICK_PROVINCE, GHTK_PICK_DISTRICT, GHTK_PICK_WARD, GHTK_PICK_TEL
  GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
  CASSO_SECURE_TOKEN
  CORS_ALLOWED_ORIGINS (comma-sep, e.g. http://localhost:5173,http://localhost:3000)

Default admin: username admin / password admin (auto-hashed to PBKDF2 on first login).

## Notable Files

  src/index.tsx             Entry point + composition root
  wrangler.jsonc            Cloudflare config: D1 binding, nodejs_compat flag
  vite.config.ts            Vite + Hono plugins, entry src/index.tsx
  public/_routes.json       CF Pages routing: Worker /* except /static/* and /qh-logo.png
  ecosystem.config.cjs      PM2 config for wrangler pages dev as background process
  deploy.sh                 build -> CF Pages deploy -> git push to main
  worker-configuration.d.ts Auto-generated CF binding types (npm run cf-typegen)
  docs/superpowers/         Internal design docs (flash sale, migration-first schema)

## Workflow Rules (After Each Task)

Sau mỗi task hoàn thành, bắt buộc thực hiện checklist sau trước khi commit:

1. **Effect Range** — Kiểm tra feature chỉ ảnh hưởng đúng phần cần thay đổi, không lan sang module/component khác ngoài phạm vi.
2. **UI Integrity** — Kiểm tra UI có bị lỗi hoặc làm hỏng chỗ khác không (layout shift, z-index conflict, responsive breakpoints, animation conflict).
3. **Code Quality** — Xem code đã clean chưa: đặt tên rõ ràng, không duplicate logic, không magic number, refactor nếu cần.
4. **Security** — Kiểm tra vấn đề bảo mật: không expose sensitive data ở client-side, không XSS (innerHTML với dữ liệu user input phải escape), không hardcode secrets.
5. **Commit** — Commit với message rõ ràng theo format: `feat/fix/refactor: mô tả ngắn gọn bằng tiếng Việt hoặc English`. Gửi commit ID cho user sau khi commit.