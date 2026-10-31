# Phase 8 — README, decisions, final review

## Goal
A submission a reviewer can run in two minutes and understand in five.

## README.md sections (required by the assignment)
*As built:* the README has existed since Phase 2 and every phase keeps it current (see "Keeping docs in sync" in CLAUDE.md).
It already covers overview, status, prerequisites, getting started, scripts, data and API, structure and docs.
Phase 8 **adds** screenshots (1), architecture and technical choices (3), the AI usage note (4), known limitations (5)
and "with more time" (6). It also removes the **Status** line and re-checks the existing sections against a fresh clone.

1. **Overview** — one paragraph + a screenshot or two (desktop table, mobile cards).
2. **Setup & run** — Node version, `npm run install:all`, `npm run dev`, URLs, how to run tests.
   **Data source:** how the Express server works, the in-memory seed, `API_DELAY_MS` / `API_FAIL_RATE`,
   and that reset restores the seed. Link to `docs/API.md`.
3. **Architecture & technical choices** — 6–10 bullets condensed from `docs/DECISIONS.md`, including a short paragraph
   on the search requirement (debounce, distinct, switchMap, catchError placement, results staying visible,
   server-side vs client-side trade-off, and why pagination settles it).
4. **AI usage note** — tools used, what for, and **at least one suggestion changed or rejected**, taken from the
   AI log in `DECISIONS.md`. Written by the developer in their own words; Claude Code may draft but must not invent entries.
5. **Known limitations** — in-memory data resets on server restart; duplicated `Customer` type;
   reset endpoint unprotected; no auth; no URL-synced filters (if not done); anything skipped from the plan.
6. **With more time** — virtual scroll, optimistic updates, URL state, shared types package,
   E2E tests, delete customer, persisted storage.

## Final review checklist
- [x] Fresh clone → `npm run install:all && npm run dev` works (test in a temp folder).
- [x] No `node_modules`, no secrets, no stray console logs or commented-out code.
- [x] Every row of the traceability table in `PLAN.md` is satisfied.
- [x] Lint/build passes: `ng build` without warnings worth mentioning.
- [ ] Developer can answer every "Be ready to explain" item from phases 1–7.
- [ ] If submitting as ZIP: excludes `node_modules`, `dist`, `.angular`.

## Commit
`docs: README, architecture notes, AI usage and limitations`

*As built:*
- The fresh-clone check ran **before** this phase, as its own step, from a clone of the published GitHub repo
  (Node 24: install, dev, test, typecheck, build and the dev knobs). It found and fixed three things: the API port
  variable is now `API_PORT` (the Angular dev server also reads `PORT`), the root `engines` range now matches
  Angular's, and the CLI's `client/.vscode/launch.json` / `tasks.json` were removed. See `DECISIONS.md`.
- Screenshots are in `docs/screenshots/` (desktop table, mobile cards), taken from the running app with the seed data.
- The two server `console` calls are kept on purpose: the startup line, and logging unexpected errors in the
  error handler.
- The AI usage note was drafted by Claude Code from the AI log only. The developer added what Claude chat was
  used for and kept the rest.
- The README also got a short **Tests** section. Commits are in plain language and split in two, as in earlier phases.
- The ZIP item doesn't apply: the project is submitted as a GitHub repo.
