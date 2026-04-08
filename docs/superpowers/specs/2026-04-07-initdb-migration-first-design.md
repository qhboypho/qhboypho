# initDB Migration-First Design

## Goal
Move database schema creation, ALTERs, backfills, and banner seeding out of request-time `initDB()` and into D1 migrations so requests no longer pay repeated initialization cost.

## Current Problem
`src/lib/db.ts` runs table creation, column evolution, backfill of `orders.selected_color_image`, and `hero_banners` seed work every time routes call `initDB()`. Most route handlers call it, so request latency includes avoidable schema/data maintenance.

## Phase Scope
- Add a new D1 migration that brings older databases up to the current schema.
- Add one-time data migration steps for `selected_color_image` backfill and `hero_banners` seed.
- Keep runtime compatibility by leaving the `initDB` dependency surface in place, but make it a no-op.
- Do not redesign route registration or API contracts.

## Migration Strategy
1. Keep historical migrations intact.
2. Add one new migration to evolve a DB created from `0001_schema.sql` + `0002_seed.sql` up to the schema expected by current code.
3. Include only idempotent SQL so local/prod can apply safely.
4. Move hero banner seeding into SQL guarded by `WHERE NOT EXISTS`.
5. Move color-image backfill into SQL using JSON extraction where possible, with thumbnail fallback.

## Runtime Strategy
- `createInitDB()` will still return an async function so existing route wiring does not break.
- That async function will no longer execute schema/data SQL on requests.
- Migration application becomes the required setup path via `wrangler d1 migrations apply`.

## Verification
- A failing test first that proves `initDB()` should not call `db.prepare()` at runtime.
- Migration apply locally.
- Build and UI safety checks.
- Optional DB smoke query after migration.
