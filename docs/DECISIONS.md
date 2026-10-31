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
- **Node version pinned:** `.nvmrc` (`24`, current Active LTS) and `"engines": { "node": ">=22" }` in the root `package.json`. Node 20 is end-of-life and current Angular needs a newer runtime; this tells a reviewer which Node to use before they hit a confusing install error.

## Deliberately not added

NgRx, HTTP interceptors, global error handler service, shared types package, pagination, auth, URL-synced filters (stretch).

## New dependencies

| Package | Where | Why |
|---|---|---|
| express, tsx, typescript | server | API |
| concurrently | root | run both apps with one command |
| @angular/material | client | table, dialog, form fields, snackbar |

## AI suggestions changed or rejected

> Claude Code appends here whenever the developer changes or rejects a suggestion.
> Format: **What was suggested → what was done instead → why.**

-
