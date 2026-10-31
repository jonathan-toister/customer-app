# Phase 2 — Client scaffold + data layer

## Goal
An Angular app that loads customers at startup through a store with a debounced, cancellable search pipeline.
No real UI yet — a temporary `<pre>` dump of the store state is enough to verify.

## Tasks
1. Scaffold in `client/` with the Angular CLI: SCSS, routing on, SSR off. Accept the CLI's defaults otherwise
   (test runner, zoneless/zone setting) — don't fight them; note which ones were used in `DECISIONS.md`.
2. `ng add @angular/material` (pick a prebuilt theme, enable typography, animations as the schematic offers).
3. `proxy.conf.json` mapping `/api` → `http://localhost:3000`; wire it in `angular.json` serve options.
   ~~`environment.ts` → `apiUrl: '/api'`~~ *As built:* a `CUSTOMERS_URL = '/api/customers'` constant in the API service.
   Thanks to the proxy, the URL is the same in every environment (see DECISIONS.md).
4. `app.config.ts`: `provideRouter(routes)`, `provideHttpClient()` (*as built:* without `withFetch()`, which is
   deprecated in Angular 22 because fetch is the default), and `provideAppInitializer(() => inject(CustomerStore).load())`.
5. `app.routes.ts`: `''` → redirect to `customers`; `customers` → `loadComponent` of `CustomersPage`;
   `**` → redirect to `customers`. (Create an empty `CustomersPage` placeholder for now.)
6. `features/customers/data/customer.model.ts` — types from `API.md` plus:
   `SortField`, `SortOrder`, `CustomerSort { field; order }`, `ApiError { code; message; fields? }`.
   `ApiError['code']` is the server codes plus the client-only `'UNKNOWN'` (see `docs/ERROR-HANDLING.md`).
7. `customer-api.service.ts` — `list(q, sort)`, `create(input)`, `update(id, input)`, `reset()`.
   Builds `HttpParams`, omits empty `q`. No state, no retries.
   Every method maps errors with `toApiError(err: HttpErrorResponse)`: if `err.error` has our error shape, return
   `err.error.error` unchanged. Otherwise return `{ code: 'UNKNOWN', message: "Can't reach the server. Please try again." }`.
   Don't check only for status 0: behind the dev proxy, a stopped server usually shows up as a `5xx` with an HTML/empty body.
8. `customer.store.ts` (`providedIn: 'root'`):
   - **State signals** (private writable, public read-only via `.asReadonly()`):
     `customers`, `loading`, `error: ApiError | null`, `query` (raw text, updates on every keystroke),
     `sort` (default `createdAt desc`).
   - **Derived:** `isEmpty`, `hasQuery`, `initialLoad` (loading and no customers yet).
   - **Pipeline** (set up once, in the constructor, with `takeUntilDestroyed`). *As built*, which changed from the
     first sketch (see DECISIONS.md):
     ```
     keystrokes$ → map(trim) → debounceTime(300) → filter(term !== lastRequest.q) → fetch()
     fetch()     = lastRequest = { q: query().trim(), sort: sort() }; requests$.next(lastRequest)
                   (also called directly by setSort, clearQuery, reload, reset, load: no debounce for clicks)
     requests$
       → tap(loading = true, error = null)
       → switchMap(params => api.list(params).pipe(
             tap(set customers, loading = false),
             catchError(err => { error = err; loading = false; return EMPTY })   // inside switchMap: the stream survives
         ))
     ```
     *First sketch:* `distinctUntilChanged` on the search term, and `combineLatest` of term and sort. It was replaced
     because `distinctUntilChanged` only remembers the last *typed* term. After clear/reset, typing the same term again
     would be skipped, and reset caused a duplicate request. Comparing with the last *request* fixes both.
     `loading` is set back to `false` in `tap`/`catchError`, **not** in `finalize`: `finalize` also runs when
     `switchMap` cancels a request, which would turn `loading` off while the newer request is still running.
     Comment each operator with **why** it's there — this code will be explained in the interview.
   - **Actions:** `setQuery(text)`, `setSort(sort)`, `reload()`, `clearQuery()`,
     `load(): Promise<void>` — triggers the first fetch and resolves when it settles (success *or* error). **Never rejects.**
     `create(input)` / `update(id, input)` — return a `Promise<Customer>` that **rejects with `ApiError`** so the dialog
     can show field errors; on success call `reload()`. The promise resolves as soon as the save succeeds. It does
     **not** wait for or depend on the reload: a failed reload goes into `error`, not into the dialog.
     If `update` fails with `NOT_FOUND`, call `reload()` and then reject (the dialog closes and the list refreshes).
     `reset()` — calls `api.reset()`, clears the query, resets sort to default, reloads. Rejects with `ApiError` on failure.
9. Temporary page template: `<pre>{{ debug() | json }}</pre>` plus an `<input>` calling `store.setQuery`, to verify.

## Acceptance criteria
- `npm run dev` starts both apps; the page shows customers immediately (initializer awaited the first load).
- Stop the server and reload the page → the app still renders and the store has an `error` (no blank screen, no uncaught error in console).
  That error is `{ code: 'UNKNOWN', message: "Can't reach the server. Please try again." }`. Note in `DECISIONS.md`
  which HTTP status the proxy actually returned (DevTools → Network).
- In DevTools → Network, typing "annabel" quickly produces **one** request (debounce).
- Typing "ann", then quickly "anna" with `API_DELAY_MS=1500` → the first request shows as **cancelled** (switchMap).
- Typing "ann", then "ann " → no new request (trim + distinctUntilChanged).
- With `API_FAIL_RATE=0.5`, after a failed search, typing again still triggers requests (stream didn't die).

## Be ready to explain
- `debounceTime` vs `throttleTime`; why `switchMap` and not `mergeMap`/`concatMap`/`exhaustMap`.
- Why `catchError` must sit inside the `switchMap`.
- Why the initializer's promise must never reject.
- Signals vs RxJS here: why both, and where the boundary is.

## Commit
`feat(client): scaffold, customer store with debounced search and startup load`
