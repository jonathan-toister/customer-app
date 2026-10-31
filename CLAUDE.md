# Customer Management App — Claude Code instructions

Home assignment for an Angular Front-End Developer role. A small customer management app:
list, search, sort, add, edit and reset customers, backed by a small Express API.

The developer will be asked to **explain and modify any part of this code live** in a follow-up
interview. Readability and explainability beat cleverness everywhere.

## How to work in this repo

1. Work **one phase at a time**. Phases live in `docs/phases/`. `docs/PLAN.md` has the order and checklist.
2. Before starting a phase, read: this file, `docs/PLAN.md`, `docs/API.md`, and the phase file.
3. At the end of a phase:
   - make sure every acceptance criterion in the phase file is met (run the app / tests, don't assume),
   - tick the phase in `docs/PLAN.md`,
   - add any non-obvious choice to `docs/DECISIONS.md`,
   - give a short summary of what changed and **stop**. Wait for the developer to review before the next phase.
4. Commit at the end of each phase with the message suggested in the phase file.
5. If something in the plan is wrong or unclear, say so and propose a fix — don't silently deviate.
6. **AI-usage log:** when the developer rejects or changes one of your suggestions, append an entry to
   the "AI suggestions changed or rejected" section of `docs/DECISIONS.md` (what you suggested, what they
   chose, why). The README's AI note is built from this.

## Stack

- **Client:** Angular (latest stable — whatever `ng new` installs), TypeScript strict, Angular Material, SCSS.
- **Server:** Node + Express 5 + TypeScript, run with `tsx`. In-memory persistence, seeded on start.
- **Root:** plain `package.json` with scripts only (no workspaces). `concurrently` runs both apps.
- Client talks to the server via the Angular dev-server **proxy** (`/api` → `http://localhost:3000`), so no CORS setup.

## Commands (target state)

```bash
npm run install:all   # installs root, server and client deps
npm run dev           # server on :3000 + client on :4200
npm run test          # client tests (and server tests if present)
```

## Folder structure (target state)

```
CLAUDE.md, README.md, package.json
docs/       PLAN.md, API.md, DECISIONS.md, phases/
server/src/ index.ts, customers.routes.ts, customers.store.ts, validation.ts, errors.ts, seed.ts
client/src/app/
  app.config.ts, app.routes.ts, app.component.ts
  features/customers/
    data/          customer.model.ts, customer-api.service.ts, customer.store.ts
    customers-page/
    components/    customer-toolbar/, customer-table/, customer-cards/, customer-form-dialog/
  shared/ui/       loading-state/, error-state/, empty-state/, confirm-dialog/
```

## Angular conventions

- Standalone components only. `inject()` instead of constructor injection.
- `ChangeDetectionStrategy.OnPush` on every component.
- Signals for component and store state; `input()` / `output()` / `computed()`. RxJS only where streams
  genuinely help (the search pipeline, HTTP).
- Built-in control flow (`@if`, `@for` with `track`, `@switch`). No `*ngIf` / `*ngFor`.
- Presentational components (toolbar, table, cards, shared/ui) inject **nothing** from the app — inputs in, outputs out.
- Only `CustomersPage` and `CustomerFormDialog` talk to `CustomerStore`. Only `CustomerStore` talks to `CustomerApiService`.
- No `any`. Types for the API live in `customer.model.ts`.
- Keep files small. If the page component passes ~150 lines, logic has leaked into it.

## Things NOT to add (deliberate — see DECISIONS.md)

NgRx or any state library, HTTP interceptors, a global error service, a shared types package,
pagination, auth, i18n, SSR. Don't add new dependencies without noting them in `DECISIONS.md`.

## Code style

- Small, readable functions. Comments only where the *why* isn't obvious (e.g. the search pipeline operators).
- Names over abbreviations. No barrel `index.ts` files.
- UI copy is short and specific ("No customers match “ann”", not "No data").
