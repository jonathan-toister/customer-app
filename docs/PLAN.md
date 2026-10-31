# Plan

Goal: a clear, working Customer Management app in roughly 3–4 hours of frontend work, plus a small
backend. Prioritise working behaviour over polish. Stretch items are marked and can be skipped.

## Phases

| # | Phase | File | Est. | Done |
|---|-------|------|------|------|
| 0 | Repo setup | `phases/00-setup.md` | 10 min | [x] |
| 1 | Backend API (incl. reset) | `phases/01-backend.md` | 30–40 min | [x] |
| 2 | Client scaffold + data layer | `phases/02-client-data-layer.md` | 45 min | [x] |
| 3 | Customers page, toolbar, views | `phases/03-page-and-views.md` | 60 min | [x] |
| 4 | Add / edit dialog + reset | `phases/04-dialog-and-reset.md` | 45 min | [x] |
| 5 | States, responsive, a11y pass | `phases/05-states-responsive.md` | 30 min | [x] |
| 6 | Modifications: tokens, own dialog/toast, pagination, skip empty searches | `phases/06-modifications.md` | 90–120 min | [ ] |
| 7 | Tests | `phases/07-tests.md` | 45–60 min | [ ] |
| 8 | README, decisions, final review | `phases/08-docs-and-review.md` | 20 min | [ ] |

## Requirements traceability

| Assignment requirement | Where it's handled |
|---|---|
| List with name, email, status, creation date | Phase 3 — table + cards views |
| Search and sort | Phase 1 (server-side), Phase 2 (store pipeline), Phase 3 (toolbar), Phase 6 (pagination) |
| Add and edit | Phase 4 — form dialog |
| Data available when the app starts | Phase 2 — `provideAppInitializer` → `store.load()` |
| No customers / something goes wrong | `ERROR-HANDLING.md` (every error case → behaviour → phase); Phase 5 — loading, error+retry, empty, no-results; Phase 4 — save errors |
| Usable on desktop and small screens | Phase 3 (cards forced on mobile), Phase 5 (pass) |
| "Search should feel responsive and not overload the API" | Phase 2 — debounce, distinctUntilChanged, switchMap; Phase 3 — keep results visible while searching; Phase 6 — skip searches that can't match, one page per request |
| Reset customers (own addition) | Phase 1 endpoint, Phase 4 UI with confirmation |
| README, architecture, AI note, limitations | Phase 8 |

## Stretch (only if time remains)

- Compact list view (third view option).
- Search, sort and page reflected in the URL query params.
- Server tests with supertest.
