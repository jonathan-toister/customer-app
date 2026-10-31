# Phase 2 — Client scaffold + data layer

## Goal
An Angular app that loads customers at startup through a store with a debounced, cancellable search pipeline.
No real UI yet — a temporary `<pre>` dump of the store state is enough to verify.

## Tasks
1. Scaffold in `client/` with the Angular CLI: SCSS, routing on, SSR off. Accept the CLI's defaults otherwise
   (test runner, zoneless/zone setting) — don't fight them; note which ones were used in `DECISIONS.md`.
2. `ng add @angular/material` (pick a prebuilt theme, enable typography, animations as the schematic offers).
3. `proxy.conf.json` mapping `/api` → `http://localhost:3000`; wire it in `angular.json` serve options.
   `environment.ts` → `apiUrl: '/api'`.
4. `app.config.ts`: `provideRouter(routes)`, `provideHttpClient(withFetch())`, and
   `provideAppInitializer(() => inject(CustomerStore).load())`.
5. `app.routes.ts`: `''` → redirect to `customers`; `customers` → `loadComponent` of `CustomersPage`;
   `**` → redirect to `customers`. (Create an empty `CustomersPage` placeholder for now.)
6. `features/customers/data/customer.model.ts` — types from `API.md` plus:
   `SortField`, `SortOrder`, `CustomerSort { field; order }`, `ApiError { code; message; fields? }`.
7. `customer-api.service.ts` — `list(q, sort)`, `create(input)`, `update(id, input)`, `reset()`.
   Builds `HttpParams`, omits empty `q`. Maps `HttpErrorResponse` → `ApiError` (fallback message for network errors,
   status 0). No state, no retries.
8. `customer.store.ts` (`providedIn: 'root'`):
   - **State signals** (private writable, public read-only via `.asReadonly()`):
     `customers`, `loading`, `error: ApiError | null`, `query` (raw text, updates on every keystroke),
     `sort` (default `createdAt desc`).
   - **Derived:** `isEmpty`, `hasQuery`, `initialLoad` (loading and no customers yet).
   - **Pipeline** (set up once, in the constructor, with `takeUntilDestroyed`):
     ```
     searchTerm$ = query$ → map(trim) → debounceTime(300) → distinctUntilChanged()
     params$     = combineLatest([searchTerm$ (startWith current), sort$ (distinct by field+order)])
     merge(params$, reload$ → latest params)
       → tap(loading = true, error = null)
       → switchMap(params => api.list(params).pipe(
             catchError(err => { error = err; return EMPTY })     // inside switchMap: the stream survives
         ))
       → set customers, loading = false
     ```
     Make sure `loading` is set back to `false` on error too (`finalize` inside the switchMap is fine).
     Comment each operator with **why** it's there — this code will be explained in the interview.
   - **Actions:** `setQuery(text)`, `setSort(sort)`, `reload()`, `clearQuery()`,
     `load(): Promise<void>` — triggers the first fetch and resolves when it settles (success *or* error). **Never rejects.**
     `create(input)` / `update(id, input)` — return a `Promise<Customer>` that **rejects with `ApiError`** so the dialog
     can show field errors; on success call `reload()`.
     `reset()` — calls `api.reset()`, clears the query, resets sort to default, reloads.
9. Temporary page template: `<pre>{{ debug() | json }}</pre>` plus an `<input>` calling `store.setQuery`, to verify.

## Acceptance criteria
- `npm run dev` starts both apps; the page shows customers immediately (initializer awaited the first load).
- Stop the server and reload the page → the app still renders and the store has an `error` (no blank screen, no uncaught error in console).
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
