# Customer Management App

A small app for managing customers: list, search, sort, add, edit, and reset the demo data.
The client is **Angular 22 with Angular Material**. It talks to a small **Express 5 + TypeScript** API that keeps
customers in memory. Built as a home assignment for an Angular Front-End Developer role.

**Status:** Phases 0–5 of 8 are done: the API, the client's data layer, the customers page (search, sort,
table and card views), adding, editing and resetting customers, and the loading, error, empty and no-results
states with a responsive and accessibility pass. Phase 6 (design tokens, own dialog and notification,
pagination, skipping searches that can't match) is in progress; tests come in Phase 7.
Progress is tracked in [docs/PLAN.md](docs/PLAN.md).

## Prerequisites

- **Node 24** (pinned in [`.nvmrc`](.nvmrc)). Angular 22 needs Node ≥ 22.22 or ≥ 24.15, so it won't run on Node 20.
- npm (comes with Node).

With [nvm](https://github.com/nvm-sh/nvm):

```bash
nvm install   # once: installs the version from .nvmrc
nvm use       # in every new terminal, from the repo root
```

## Getting started

```bash
nvm use
npm run install:all   # installs root, server and client dependencies
npm run dev           # starts the API and the Angular dev server together
```

| What | URL |
|---|---|
| App | http://localhost:4200 |
| API | http://localhost:3000/api/customers |

The client calls `/api/...` on its own origin. The Angular dev server forwards those calls to the API
([`client/proxy.conf.json`](client/proxy.conf.json)), so no CORS setup is needed.

## Scripts

Run from the repo root:

| Command | Does |
|---|---|
| `npm run install:all` | Installs dependencies for root, `server/` and `client/` |
| `npm run dev` | Runs the API (port 3000) and the client (port 4200) together, with labelled output |
| `npm run test` | Runs the client unit tests once (Vitest) |
| `npm --prefix server run typecheck` | Type-checks the server |
| `npm --prefix client run build` | Production build of the client into `client/dist/` |

## Data and API

- The server starts with **40 seeded customers**, held in memory. Restarting the server, or calling
  `POST /api/customers/reset`, restores the original data.
- Search and sort run on the server (`GET /api/customers?q=ann&sort=name&order=asc`).
- The full contract (endpoints, validation, error shape) is in [docs/API.md](docs/API.md).
  [`server/requests.http`](server/requests.http) has a ready-made request for each endpoint (VS Code REST Client extension).

**Dev knobs.** These environment variables make loading and error states easy to see:

| Variable | Default | Effect |
|---|---|---|
| `API_DELAY_MS` | `400` | Adds delay to every API response |
| `API_FAIL_RATE` | `0` | Chance (0–1) that a request fails with a `500` |
| `SEED` | demo data | `SEED=empty` starts with no customers, to see the empty state. Reset keeps it empty |
| `PORT` | `3000` | API port. The client proxy expects 3000 |

```bash
API_FAIL_RATE=0.3 npm run dev     # roughly 1 in 3 requests fails
API_DELAY_MS=1500 npm run dev     # slow responses, to see loading states and cancelled searches
SEED=empty npm run dev            # no customers, to see the "No customers yet" state
```

## Project structure

```
├── package.json            root scripts only (no workspaces)
├── docs/                   plan, API contract, decisions, per-phase specs
├── server/
│   ├── requests.http       manual API checks
│   └── src/                index.ts (app setup), customers.routes.ts, customers.store.ts,
│                           validation.ts, errors.ts, seed.ts
└── client/
    ├── proxy.conf.json     /api → http://localhost:3000
    └── src/
        ├── styles.scss     Material theme (colours, type)
        ├── _tokens.scss    the app's own design values: spacing, radius, status colours
        └── app/
            ├── app.ts, app.config.ts, app.routes.ts
            ├── features/customers/
            │   ├── data/             customer.model.ts, customer-api.service.ts, customer.store.ts
            │   ├── customers-page/   the smart page: connects the store to the components and dialogs
            │   └── components/       customer-toolbar/, customer-table/, customer-cards/,
            │                         customer-status-badge/ (inputs in, outputs out),
            │                         customer-form-dialog/ (add/edit; saves through the store)
            └── shared/ui/            no customer knowledge, inputs in, outputs out
                ├── confirm-dialog/   generic yes/no dialog
                ├── error-banner/     red inline error box (list banner, dialog error)
                └── loading-state/, error-state/, empty-state/   full-area page states
```

## Documentation

| File | What's in it |
|---|---|
| [docs/PLAN.md](docs/PLAN.md) | Phases, progress, and where each assignment requirement is handled |
| [docs/API.md](docs/API.md) | The API contract between client and server |
| [docs/ERROR-HANDLING.md](docs/ERROR-HANDLING.md) | What the user sees for every kind of error, and which part of the app handles it |
| [docs/DECISIONS.md](docs/DECISIONS.md) | Technical choices and why, plus a log of AI suggestions that were changed or rejected |
| [docs/phases/](docs/phases/) | Task list and acceptance criteria for each phase |
| [CLAUDE.md](CLAUDE.md) | Conventions and workflow rules for working on this repo (also read by Claude Code) |
