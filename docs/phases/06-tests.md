# Phase 6 — Tests

Tests are optional in the assignment, so test the parts that carry the engineering decisions —
not every component. Use the test runner the Angular CLI scaffolded.

## Tasks
1. **`CustomerStore` (highest value)** — mock `CustomerApiService`, use fake timers:
   - Rapid `setQuery('a'), ('an'), ('ann')` within 300ms → `api.list` called **once** with `q: 'ann'`.
   - `setQuery('ann')` then `setQuery('ann ')` → no second call.
   - A slow first response followed by a second query → only the second result ends up in `customers` (switchMap).
   - API error → `error` set, `loading` false; a later query still calls the API (stream survived).
   - `load()` resolves (doesn't reject) when the API fails.
   - `setSort` triggers a call immediately (no debounce).
   - `create()` resolves when the save succeeds even if the reload after it fails; `error` is set.
2. **`toApiError`** (in `customer-api.service.ts`) — see `docs/ERROR-HANDLING.md`:
   - A response body with our error shape is returned unchanged (code, message, fields).
   - Status 0, and a `5xx` with an HTML or empty body, both become `{ code: 'UNKNOWN', … }`.
3. **`CustomerFormDialog`:**
   - Invalid form → store not called.
   - Store rejects with `{ code: 'EMAIL_TAKEN', fields: { email } }` → email control has the server error **after the
     form is re-enabled**, dialog not closed.
   - A `fields` key with no matching control → shown in the general error area.
   - Store rejects with `NOT_FOUND` → dialog closes with `{ kind: 'not-found' }`.
4. **`CustomersPage`** (light): renders no-results state when store has a query and no customers; renders cards when mobile.
5. **Server (stretch):** supertest for list search/sort, 400/409 cases, and reset.

## Acceptance criteria
- `npm run test` passes from the repo root.
- Each store test name reads as a sentence describing behaviour.

## For the README "what I'd test next"
E2E (Playwright) for the main flow, visual/responsive checks, server tests if skipped.

## Commit
`test: store search pipeline, dialog validation, page states`
