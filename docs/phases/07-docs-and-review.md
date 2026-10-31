# Phase 7 — README, decisions, final review

## Goal
A submission a reviewer can run in two minutes and understand in five.

## README.md sections (required by the assignment)
*As built:* the README has existed since Phase 2 and every phase keeps it current (see "Keeping docs in sync" in CLAUDE.md).
It already covers overview, status, prerequisites, getting started, scripts, data and API, structure and docs.
Phase 7 **adds** screenshots (1), architecture and technical choices (3), the AI usage note (4), known limitations (5)
and "with more time" (6). It also removes the **Status** line and re-checks the existing sections against a fresh clone.

1. **Overview** — one paragraph + a screenshot or two (desktop table, mobile cards).
2. **Setup & run** — Node version, `npm run install:all`, `npm run dev`, URLs, how to run tests.
   **Data source:** how the Express server works, the in-memory seed, `API_DELAY_MS` / `API_FAIL_RATE`,
   and that reset restores the seed. Link to `docs/API.md`.
3. **Architecture & technical choices** — 6–10 bullets condensed from `docs/DECISIONS.md`, including a short paragraph
   on the search requirement (debounce, distinct, switchMap, catchError placement, results staying visible,
   server-side vs client-side trade-off).
4. **AI usage note** — tools used, what for, and **at least one suggestion changed or rejected**, taken from the
   AI log in `DECISIONS.md`. Written by the developer in their own words; Claude Code may draft but must not invent entries.
5. **Known limitations** — no pagination; in-memory data resets on server restart; duplicated `Customer` type;
   reset endpoint unprotected; no auth; no URL-synced filters (if not done); anything skipped from the plan.
6. **With more time** — pagination/virtual scroll, optimistic updates, URL state, shared types package,
   E2E tests, delete customer, persisted storage.

## Final review checklist
- [ ] Fresh clone → `npm run install:all && npm run dev` works (test in a temp folder).
- [ ] No `node_modules`, no secrets, no stray console logs or commented-out code.
- [ ] Every row of the traceability table in `PLAN.md` is satisfied.
- [ ] Lint/build passes: `ng build` without warnings worth mentioning.
- [ ] Developer can answer every "Be ready to explain" item from phases 1–6.
- [ ] If submitting as ZIP: excludes `node_modules`, `dist`, `.angular`.

## Commit
`docs: README, architecture notes, AI usage and limitations`
