# Customer Management App

A small app for managing customers: list, search, sort, add, edit, and reset the demo data.
The client is **Angular 22 with Angular Material**. It talks to a small **Express 5 + TypeScript** API that keeps
customers in memory. Built as a home assignment for an Angular Front-End Developer role.

**Status:** Phases 0–2 of 7 are done: the API and the client's data layer (store, search pipeline, startup load).
The real UI arrives in Phase 3. Until then, the page shows a search box and a debug view of the store's state.
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
| `PORT` | `3000` | API port. The client proxy expects 3000 |

```bash
API_FAIL_RATE=0.3 npm run dev     # roughly 1 in 3 requests fails
API_DELAY_MS=1500 npm run dev     # slow responses, to see loading states and cancelled searches
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
    └── src/app/
        ├── app.ts, app.config.ts, app.routes.ts
        └── features/customers/
            ├── data/       customer.model.ts, customer-api.service.ts, customer.store.ts
            └── customers-page/
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
