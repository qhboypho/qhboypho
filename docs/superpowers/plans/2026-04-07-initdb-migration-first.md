# initDB Migration-First Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove heavy request-time database initialization and shift schema/data setup to D1 migrations.

**Architecture:** Add one idempotent migration that upgrades old databases to the current schema and seeds/backfills required data, then reduce `createInitDB()` to a compatibility no-op so routes stop paying per-request initialization cost.

**Tech Stack:** Cloudflare D1, Wrangler migrations, TypeScript, Node contract tests.

---

### Task 1: Lock runtime contract with a failing test

**Files:**
- Create: `C:/Users/DinhTungPC/.gemini/antigravity/scratch/qhboypho-main/scripts/test-initdb-noop-contract.mjs`
- Modify: `C:/Users/DinhTungPC/.gemini/antigravity/scratch/qhboypho-main/package.json`

- [ ] Write a test that imports `createInitDB`, passes a fake DB whose `prepare()` increments a counter, calls `await initDB(fakeDb)`, and asserts the counter stays `0`.
- [ ] Run the test with `node --experimental-strip-types scripts/test-initdb-noop-contract.mjs` and confirm it fails before implementation.

### Task 2: Add migration for schema parity and one-time data setup

**Files:**
- Create: `C:/Users/DinhTungPC/.gemini/antigravity/scratch/qhboypho-main/migrations/0003_runtime_init_cleanup.sql`

- [ ] Add idempotent SQL for missing tables, indexes, and `ALTER TABLE` additions expected by current code.
- [ ] Add guarded hero banner seed SQL.
- [ ] Add one-time `selected_color_image` backfill SQL.

### Task 3: Reduce runtime init to compatibility no-op

**Files:**
- Modify: `C:/Users/DinhTungPC/.gemini/antigravity/scratch/qhboypho-main/src/lib/db.ts`

- [ ] Replace heavy runtime SQL with an async no-op returned by `createInitDB()`.
- [ ] Keep the function signature unchanged so route modules do not need refactoring.

### Task 4: Verify locally

**Files:**
- Modify if needed: `C:/Users/DinhTungPC/.gemini/antigravity/scratch/qhboypho-main/package.json`

- [ ] Run the initDB contract test again and confirm it passes.
- [ ] Run `npm run db:migrate:local`.
- [ ] Run `npm run build`.
- [ ] Run `npm run check:ui-safety`.
