# Phase 1 — Backend API

Read `docs/API.md` first — it is the contract. Implement exactly that.

## Goal
A small Express 5 + TypeScript server with in-memory customers, server-side search/sort,
create/update with validation, reset, and dev knobs for latency and failures.

## Tasks
1. `server/` with its own `package.json` (`"type": "module"`), `tsconfig.json` (strict), deps: `express`;
   dev deps: `typescript`, `tsx`, `@types/express`, `@types/node`.
   Scripts: `dev` → `tsx watch src/index.ts`, `start` → `tsx src/index.ts`.
2. `src/seed.ts` — ~40 deterministic customers (fixed arrays of first/last names, no faker dependency).
   Mixed statuses, `createdAt` spread across the last ~2 years, a few names sharing substrings
   (e.g. "Ann", "Anna", "Joanne") so search is demo-able.
3. `src/customers.store.ts` — module holding the array. Functions:
   `list({ q, sort, order })`, `getById(id)`, `create(input)`, `update(id, input)`, `reset()`, `emailTaken(email, exceptId?)`.
   `reset()` replaces the array with a **deep copy** of the seed (`structuredClone`).
   Sorting: strings with `localeCompare` (case-insensitive), `createdAt` by date.
4. `src/validation.ts` — `validateCustomerInput(body)` returning either `{ ok: true, value }` (trimmed, email
   lower-cased) or `{ ok: false, fields }`. Rules: name 2–100 chars; email basic format check; status in the enum.
   Also `parseListQuery(query)` for `q/sort/order` → `400` on invalid values.
5. `src/customers.routes.ts` — an Express `Router` implementing the five endpoints and status codes from `API.md`.
   Note `POST /reset` must be registered **before** `/:id` routes are matched (it isn't ambiguous for POST, but keep routes ordered for readability).
6. `src/index.ts` — `express.json()`, then a dev-knob middleware for `/api` (delay by `API_DELAY_MS`, fail with
   `500 SIMULATED_FAILURE` at `API_FAIL_RATE`), the router mounted at `/api/customers`, a 404 handler for unknown
   `/api` routes, and a final error handler that returns the standard error shape with `INTERNAL`.
   Log one line on start: port, delay, fail rate.
7. A small `server/requests.http` (or a README snippet with curl commands) covering each endpoint — handy for manual checks.

## Acceptance criteria (verify with curl)
- `GET /api/customers` returns ~40 customers sorted by `createdAt desc`.
- `?q=ann` matches name or email case-insensitively; `?q=%20ann%20` behaves the same (trimmed).
- `?sort=name&order=asc` sorts alphabetically; `?sort=banana` → `400 BAD_REQUEST`.
- `POST` with a bad email → `400` with `fields.email`; with an existing email (different case) → `409 EMAIL_TAKEN`.
- `PUT` keeping the customer's own email → `200`; using another customer's email → `409`; unknown id → `404`.
- `createdAt` and `id` cannot be changed by `PUT`.
- After creating a customer, `POST /api/customers/reset` → `204`, and the list is back to the original seed.
- `API_DELAY_MS=1500` visibly delays responses; `API_FAIL_RATE=1` makes every request return the error shape.

## Be ready to explain
- Why reset uses a deep copy of the seed (what breaks with a shallow copy?).
- Why email uniqueness is case-insensitive.
- Why validation errors return `fields` keyed by input name.

## Commit
`feat(server): in-memory customers API with search, sort, validation and reset`
