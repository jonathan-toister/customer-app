# Decisions

Short log of architecture/technical choices. One or two lines each: the choice, and why.
Phase 7 condenses this into the README.

## Architecture

- **Feature-folder structure** (`features/customers/`, `shared/ui/`). Everything about customers lives together; `shared/` holds only things with no customer knowledge. No `core/` folder — there's nothing app-wide besides config.
- **One signal-based store service instead of NgRx.** One feature, one entity — a state library would be an unnecessary abstraction. The store exposes read-only signals and action methods.
- **Smart vs presentational split.** `CustomersPage` and `CustomerFormDialog` talk to the store; toolbar, views and state components only use inputs/outputs. Views are swappable and trivially testable.
- **Store is `providedIn: 'root'`** because the app initializer must call it before the page exists.
- **Data on startup via `provideAppInitializer`.** It awaits the first load; `load()` never rejects (errors go into the `error` signal), so a failing API shows the error state instead of a blank app.
- **Search and sort run on the server.** The client is written as if the dataset were large. With a few hundred records client-side filtering would also be valid (no API calls at all) — this is a deliberate trade-off to discuss.
- **Search pipeline:** `trim → debounceTime(300) → distinctUntilChanged → switchMap(api)` with `catchError` *inside* the `switchMap` so one failed request doesn't kill the stream. Sort changes bypass the debounce (they're single clicks).
- **Results stay visible while a search is in flight** (thin progress bar instead of a full spinner) so typing feels responsive.
- **After create/update/reset the store re-fetches the list** with current params instead of patching locally — the server owns filtering and sorting, so this is always correct. Optimistic updates are listed as a possible improvement.
- **The form dialog saves through the store itself** (not "return the value and let the page save"). Reason: the dialog must stay open and show server errors (e.g. `409` email taken) next to the field. *This changed during planning — the first sketch had the page doing the save.*
- **Multiple views (table / cards) need a shared sort control** in the toolbar, because Material's `matSort` only exists on table headers. Table headers are also bound to the same store state, so both stay in sync.
- **Mobile forces the card view** and hides the view switcher; the chosen desktop view is remembered in `localStorage`.
- **Dev proxy instead of CORS** — the client calls `/api`, the Angular dev server forwards to `:3000`.
- **`Customer` type is duplicated** in client and server rather than shared via a workspace package — not worth the setup at this size (listed as a limitation).
- **Reset endpoint** is a demo convenience, guarded in the UI by a confirmation dialog.
- **Client error handling is specified in `ERROR-HANDLING.md`** (every error case → what the user sees → which layer handles it), agreed before building the client. Key choices:
  - **Show the server's text.** `fields` messages and `message` are shown as they are. The client's own text, under the code `UNKNOWN`, is only for responses that aren't our error shape (server down, proxy error). The rules and their wording live in one place, the server.
  - **Map by body shape, not status code.** Behind the dev proxy, a stopped server usually comes back as a non-JSON `5xx`, not status 0.
  - **404 when saving an edit** (the customer was removed, e.g. by a reset in another tab) closes the dialog, shows "This customer no longer exists" and reloads. Keeping the dialog open would be a dead end.
  - **A save resolves once the save succeeds**, even if the list refresh after it fails. The refresh failure appears as the list's error banner, not as a dialog error. The data *was* saved.
  - **Client validation deliberately isn't a perfect copy of the server's** (a whitespace-only name, `a@b`). The server is the source of truth, and those cases show its field errors reaching the right control.
- **Angular CLI defaults kept (Angular 22.2):** Vitest test runner, **zoneless** change detection (no zone.js), strict TypeScript (6.0 in the client), Material 3 theme (azure/blue, Roboto). Angular 22 makes `OnPush` the default, but components still set it explicitly (CLAUDE.md), so the intent is visible.
- **File naming:** 2025 style for components (`app.ts`, `customers-page.ts`), descriptive suffixes kept for data files (`customer-api.service.ts`, `customer.store.ts`, `customer.model.ts`). *Developer's choice when asked.*
- **No `environment.ts`.** The API URL is a constant (`/api/customers`) in the API service. With the dev proxy (and same-origin hosting in production), it's the same everywhere, so environment files would add config for nothing.
- **`provideHttpClient()` without `withFetch()`:** deprecated in Angular 22, where fetch is the default backend.
- **Search pipeline compares with the last *request*, not the last typed term.** The first sketch used `distinctUntilChanged` + `combineLatest`. But `distinctUntilChanged` only remembers typed values, while clear, reset and sort changes also issue requests. After a clear, retyping the same term would be skipped, and reset sent a duplicate request. Every request now goes through one `fetch()` that records `lastRequest`, and the typing stream does `filter(term !== lastRequest.q)`.
- **`loading = false` in `tap`/`catchError`, not `finalize`.** `finalize` also runs when `switchMap` cancels an in-flight request, which would switch `loading` off while the newer request is still running.
- **Store inputs are Subjects fed by action methods**, not `toObservable(signal)`. `toObservable` emits through an effect, and the app initializer awaits the first load *before* the app runs effects. A Subject is synchronous and predictable, and it's easy to drive with fake timers in tests.
- **Verified: a stopped server behind the dev proxy returns `502 Bad Gateway` with a `text/plain` body**, not status 0. `toApiError` maps it to `UNKNOWN` as planned in `ERROR-HANDLING.md`.
- **Seed data is fully deterministic:** fixed name arrays, a fixed base date for `createdAt`, and stable UUID-shaped ids (`00000000-0000-4000-8000-000000000001`…). Every restart and reset gives identical data and ids, which keeps demos and manual checks repeatable. Customers created at runtime get `crypto.randomUUID()`.
- **`reset()` uses `structuredClone` of the seed.** Without a copy, create/update would change the seed array itself and reset would restore the edited data.
- **Server `list()` sorts the array returned by `filter()`**, never the store array. `Array.sort` sorts in place, so sorting the store directly would reorder stored data on every request.
- **Small `server/src/errors.ts` (`sendError`)**, which isn't in the original folder list. Both the routes and `index.ts` (404 and error handler) produce the API error shape, so it lives in one place.
- **Malformed JSON body → `400 BAD_REQUEST`, not `500 INTERNAL`.** The phase file's error handler would have reported a client mistake as a server error. Added to `API.md`.
- **`PUT` checks 404 before validating the body**, so the most basic problem (wrong id) is reported first.
- **TypeScript 7 (native compiler) on the server**, because that's what `npm install typescript` now installs. `tsx` runs the code, and `tsc --noEmit` (`npm --prefix server run typecheck`) only type-checks.
- **One README, at the root, written early and kept current**, rather than waiting until the end (Phase 7) or keeping per-package READMEs. The CLI-generated `client/README.md` was deleted because its instructions (`ng serve`, `ng e2e`) were wrong for this repo. CLAUDE.md's "Keeping docs in sync" table maps each kind of change to the docs it affects.
- **Root `npm run test` passes `--watch=false`.** `ng test` (Vitest) stays in watch mode in a terminal, so the command would never finish.
- **Node version pinned:** `.nvmrc` (`24`, current Active LTS) and `"engines": { "node": ">=22" }` in the root `package.json`. Node 20 is end-of-life and current Angular needs a newer runtime; this tells a reviewer which Node to use before they hit a confusing install error.
- **Mobile = under 600px wide (`Breakpoints.XSmall`)**, instead of `Breakpoints.Handset`, which also depends on orientation. Width alone is predictable and easy to test in DevTools. *Developer's choice when asked.*
- **`activeView` is a `computed`** (`isMobile ? 'cards' : selectedView`), not a value set in a subscription or an effect. It can never get out of sync, and the user's desktop choice is kept, so it comes back when the window widens.
- **The view choice is saved to `localStorage` in the change handler, not in an effect.** There's only one place it changes, so an effect would only add indirection. Reads and writes are wrapped in try/catch (storage can be blocked), and an unknown saved value falls back to `table`.
- **Toolbar has a separate `clear` output** for the × button. It calls `store.clearQuery()`, which searches at once. Reusing `queryChange('')` would wait for the debounce. *Developer's choice when asked.*
- **Table uses `matSortDisableClear`.** Material's sort header normally has a third "unsorted" click; the API always sorts, so the header only switches between asc and desc. The table is given the already-sorted array (no `MatTableDataSource`), so it never sorts locally.
- **Status is a text badge**, a styled `<span>` with the status word, so colour isn't the only signal. Not `mat-chip`, which is meant for interactive chips. The badge styles are repeated in the table and cards SCSS (a few lines) so each view stands on its own.
- **Whole table row clickable to edit**, plus the edit icon button for keyboard users. The button calls `stopPropagation()` so a click doesn't emit `edit` twice.
- **`MAT_ICON_DEFAULT_OPTIONS` sets the icon font to Material Symbols.** `ng add` put the Material Symbols font in `index.html`, but `<mat-icon>` defaults to the older `material-icons` class, so icons would show as text.
- **Component files:** separate `.html` / `.scss` per component (like `App`), and no generated `.spec.ts` stubs. Tests are written in Phase 6. *Developer's choice when asked.*

## Deliberately not added

NgRx, HTTP interceptors, global error handler service, shared types package, pagination, auth, URL-synced filters (stretch).

## New dependencies

| Package | Where | Why |
|---|---|---|
| express, tsx, typescript | server | API |
| concurrently | root | run both apps with one command |
| @angular/material, @angular/cdk | client | table, dialog, form fields, snackbar (added via `ng add`) |

## AI suggestions changed or rejected

> Claude Code appends here whenever the developer changes or rejects a suggestion.
> Format: **What was suggested → what was done instead → why.**

- **Phase 3, clickable table rows.** Suggested: skip them and keep only the edit icon button (less code to explain). → Done instead: the whole row opens edit, and the button stays for keyboard users. → Why: _TODO: developer's reason_.
