# API contract

Base path: `/api`. JSON in and out. The server listens on port `3000`; the Angular dev server proxies `/api` to it.

This file is the contract between client and server. Change it first, then the code.

## Customer

```ts
type CustomerStatus = 'active' | 'inactive' | 'pending';

interface Customer {
  id: string;            // crypto.randomUUID()
  name: string;          // trimmed, 2–100 chars
  email: string;         // trimmed, lower-cased, valid format, unique (case-insensitive)
  status: CustomerStatus;
  createdAt: string;     // ISO 8601, set by the server on create, never changed
}

type CustomerInput = Pick<Customer, 'name' | 'email' | 'status'>;
```

## Endpoints

### `GET /api/customers`

Query params (all optional):

| Param | Values | Default |
|---|---|---|
| `q` | free text; case-insensitive substring match on `name` **or** `email`; trimmed; empty = no filter | — |
| `sort` | `name` \| `email` \| `status` \| `createdAt` | `createdAt` |
| `order` | `asc` \| `desc` | `desc` |

Invalid `sort` / `order` values → `400`.
`200` → `Customer[]` (no pagination — see known limitations).

### `GET /api/customers/:id`

`200` → `Customer` · `404` if unknown.

### `POST /api/customers`

Body: `CustomerInput`. `201` → created `Customer` · `400` validation · `409` email already exists.

### `PUT /api/customers/:id`

Body: `CustomerInput` (full replace of editable fields; `id` and `createdAt` are never changed).
`200` → updated `Customer` · `400` · `404` · `409` (email used by **another** customer).

### `POST /api/customers/reset`

Restores the original seed data (a fresh deep copy). `204` No Content.
Demo/dev convenience — in a real product this would be admin-only or not exist. Documented as such in the README.

## Error shape

Every non-2xx response:

```json
{
  "error": {
    "code": "VALIDATION_ERROR | EMAIL_TAKEN | NOT_FOUND | BAD_REQUEST | SIMULATED_FAILURE | INTERNAL",
    "message": "Human-readable summary",
    "fields": { "email": "Email is already in use" }
  }
}
```

`fields` is present only for `VALIDATION_ERROR` and `EMAIL_TAKEN`, keyed by input field name,
so the client can show messages next to the right form field.

A request body that isn't valid JSON → `400 BAD_REQUEST`. Unknown `/api` routes → `404 NOT_FOUND`.
Any unexpected server error → `500 INTERNAL`.

## Dev knobs (environment variables on the server)

| Var | Default | Effect |
|---|---|---|
| `PORT` | `3000` | |
| `API_DELAY_MS` | `400` | Artificial latency on every `/api` request — makes loading states and request cancellation visible |
| `API_FAIL_RATE` | `0` | 0–1 probability that a request fails with `500 SIMULATED_FAILURE` — used to demo the error/retry UI |
| `SEED` | (demo data) | `SEED=empty` starts with no customers, to demo the empty state. Reset also restores the empty list |

Example: `API_FAIL_RATE=0.3 npm run dev`.
