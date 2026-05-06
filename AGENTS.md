# Repo Workflow

Follow the global workflow in `C:\Users\DinhTungPC\AGENTS.md`.

## Repo-specific Fast Path

- This repo is indexed by GitNexus as `qhboypho-main`.
- Use GitNexus only when the blast radius is shared or unclear:
  - `src/lib/*`, `src/routes/*`, auth, payment, order, session, shipping
  - API contract or database schema changes
  - rename, move, extract, or cross-module regression work
- For isolated copy, style, or small page tweaks, skip heavy graph work and verify directly.

## Minimal Checks

- Frontend or admin flow changes: run `npm run build` and the narrowest contract or smoke checks for the touched flow.
- Backend or shared logic: verify the changed endpoint or path and one adjacent caller path.
- Before commit, review staged diff. If GitNexus `detect_changes` is unavailable, use `git diff --stat` plus targeted checks.

## GitNexus Notes

- If GitNexus says the index is stale, run `npx gitnexus analyze`.
- After commits that change code structure materially, refresh the index when needed.
