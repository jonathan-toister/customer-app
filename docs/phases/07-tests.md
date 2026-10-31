# Phase 7 — Tests

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
   - **Pagination (Phase 6):** a search, clear or sort change goes back to page 1; `setPage` calls the API at once
     with `page` / `pageSize`; a clamped `page` from the response is stored; `total` drives `isEmpty`;
     a reload after a save stays on the current page.
   - **Skipping searches that can't match (Phase 6):** after "zz" returns `total: 0`, `setQuery('zzz')` and
     `setQuery('xzz')` make **no** call; `setQuery('z')` does; after `reload()`, `create()` or `reset()`,
     `setQuery('zzz')` calls the API again; sort and page changes are never skipped.
2. **`toApiError`** (in `customer-api.service.ts`) — see `docs/ERROR-HANDLING.md`:
   - A response body with our error shape is returned unchanged (code, message, fields).
   - Status 0, and a `5xx` with an HTML or empty body, both become `{ code: 'UNKNOWN', … }`.
3. **`CustomerFormDialog`** (mock the CDK `DialogRef` / `DIALOG_DATA`, not Material's):
   - Invalid form → store not called.
   - Store rejects with `{ code: 'EMAIL_TAKEN', fields: { email } }` → email control has the server error **after the
     form is re-enabled**, dialog not closed.
   - A `fields` key with no matching control → shown in the general error area.
   - Store rejects with `NOT_FOUND` → dialog closes with `{ kind: 'not-found' }`.
4. **`NotificationService`** (fake timers): `show()` sets `current`; it clears itself after 4s; a second `show()`
   replaces the first and restarts the timer; `dismiss()` clears it.
5. **`ConfirmDialog`:** Confirm closes with `true`, Cancel with `false`.
6. **`CustomersPage`** (light): renders no-results state when store has a query and no customers; renders cards when
   mobile; a `saved` dialog result calls `NotificationService.show()`; the paginator is hidden on the empty state.
7. **Server (stretch):** supertest for list search/sort, `page` / `pageSize` validation (400), slicing and clamping
   past the last page, 400/409 cases, and reset.

## Acceptance criteria
- `npm run test` passes from the repo root.
- Each store test name reads as a sentence describing behaviour.

## For the README "what I'd test next"
E2E (Playwright) for the main flow, visual/responsive checks, server tests if skipped.

## Commit
`Add tests for search, pagination, dialogs, notifications and page states`
