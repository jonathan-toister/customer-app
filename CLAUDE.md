# Customer Management App — Claude Code instructions

Home assignment for an Angular Front-End Developer role. A small customer management app:
list, search, sort, add, edit and reset customers, backed by a small Express API.

The developer will be asked to **explain and modify any part of this code live** in a follow-up
interview. Readability and explainability beat cleverness everywhere.

## How to work in this repo

1. Work **one phase at a time**. Phases live in `docs/phases/`. `docs/PLAN.md` has the order and checklist.
2. Before starting a phase, read: this file, `docs/PLAN.md`, `docs/API.md`, `docs/ERROR-HANDLING.md`, and the phase file.
3. At the end of a phase:
   - make sure every acceptance criterion in the phase file is met (run the app / tests, don't assume),
   - tick the phase in `docs/PLAN.md`,
   - add any non-obvious choice to `docs/DECISIONS.md`,
   - run the **docs check** (see "Keeping docs in sync" below). In the summary, list which docs you updated, or say "docs: none needed",
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

## Commands

```bash
nvm use               # Node 24 from .nvmrc — the shell may default to an older Node
npm run install:all   # installs root, server and client deps
npm run dev           # server on :3000 + client on :4200
npm run test          # server tests (node:test via tsx), then client tests (Vitest); runs once, not watch mode
```

## Keeping docs in sync

Docs are part of the change, not a Phase 8 chore. Whenever a change touches something below, update the listed
docs **in the same change**:

| If you change… | Update |
|---|---|
| A command, script, port, env var or prerequisite (e.g. Node version) | `README.md` (Getting started / Scripts / Dev knobs), "Commands" above |
| Files or folders (add, rename, remove) | "Folder structure" below, README "Project structure" |
| An API endpoint, field, status or error code | `docs/API.md` **first**, then `server/requests.http`; `docs/ERROR-HANDLING.md` if client behaviour changes |
| Client error behaviour | `docs/ERROR-HANDLING.md` |
| Code that differs from a phase file | An "*As built:*" note in that phase file (keep the original text) + an entry in `docs/DECISIONS.md` |
| A non-obvious choice or a new dependency | `docs/DECISIONS.md` (the dependency table for packages) |
| A phase completed | Tick `docs/PLAN.md` + the README **Status** line |
| Files a CLI or schematic generated (`ng new`, `ng add`, `ng generate`) | Review them. Delete or adapt any boilerplate docs. Never leave generic instructions (there is one README, at the root) |
| The developer rejects or changes a suggestion | The AI log in `docs/DECISIONS.md` |

## Folder structure (target — folders appear as the phases add them; README "Project structure" shows what exists today)

```
CLAUDE.md, README.md, package.json
docs/       PLAN.md, API.md, ERROR-HANDLING.md, DECISIONS.md, phases/
server/src/ index.ts, customers.routes.ts, customers.store.ts, validation.ts, errors.ts, seed.ts (+ *.test.ts)
client/src/app/
  app.config.ts, app.routes.ts, app.ts (+ app.html, app.scss)
  features/customers/
    data/          customer.model.ts, customer-api.service.ts, customer.store.ts
    customers-page/
    components/    customer-toolbar/, customer-table/, customer-cards/, customer-status-badge/,
                   customer-form-dialog/
  shared/ui/       loading-state/, error-state/, empty-state/, error-banner/, confirm-dialog/,
                   dialog-shell/ (DialogShell + AppDialog), notification/ (NotificationService + toast/)
client/src/        styles.scss (Material theme), _tokens.scss (spacing, radius, status colours)
```

File naming: components use the Angular 2025 style (`customers-page/customers-page.ts`, class `CustomersPage`, no
`.component` suffix). Data-layer files keep descriptive suffixes (`customer-api.service.ts`, `customer.store.ts`,
`customer.model.ts`), so each file name says what kind of thing is inside.

Node 24 (see `.nvmrc`). Run `nvm use` before any npm command; Angular 22 doesn't run on Node 20.

## Angular conventions

- Standalone components only. `inject()` instead of constructor injection.
- `ChangeDetectionStrategy.OnPush` on every component.
- Signals for component and store state; `input()` / `output()` / `computed()`. RxJS only where streams
  genuinely help (the search pipeline, HTTP).
- Built-in control flow (`@if`, `@for` with `track`, `@switch`). No `*ngIf` / `*ngFor`.
- Presentational components (toolbar, table, cards, shared/ui) inject **nothing** from the app — inputs in, outputs out.
- Dialogs open through `AppDialog` and use `DialogShell`; messages go through `NotificationService`. Don't use
  `MatDialog`, `MatSnackBar`, or the browser's `alert` / `confirm`.
- Only `CustomersPage` and `CustomerFormDialog` talk to `CustomerStore`. Only `CustomerStore` talks to `CustomerApiService`.
- No `any`. Types for the API live in `customer.model.ts`.
- Keep files small. If the page component passes ~150 lines, logic has leaked into it.

## Things NOT to add (deliberate — see DECISIONS.md)

NgRx or any state library, HTTP interceptors, a global error service, a shared types package,
auth, i18n, SSR. Don't add new dependencies without noting them in `DECISIONS.md`.

## Code style

- Small, readable functions. Comments only where the *why* isn't obvious (e.g. the search pipeline operators).
- Names over abbreviations. No barrel `index.ts` files.
- Styles use the CSS variables from `client/src/_tokens.scss` (spacing, radius, status colours) and `--mat-sys-*`
  (colour, type). No raw px spacing or hex colours in component styles.
- UI copy is short and specific ("No customers match “ann”", not "No data").
