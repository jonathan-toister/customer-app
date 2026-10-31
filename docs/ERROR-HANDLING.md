# Client error handling

What the Angular app does with every kind of error from the API, and which layer handles it.
The error shape and codes are defined in `API.md`. If behaviour and this file disagree, fix one of them. Don't leave them out of sync.

## Principles

- **Show the server's text.** Field messages (`fields`) and `message` are shown exactly as the server sends them.
  The client writes its own text only when the response isn't our error shape.
- **The server is the source of truth for validation.** Client validators mirror the server rules to give quick feedback.
  Anything they miss is caught by the server and shown under the right field.
- **Never lose the user's work.** A failed save keeps the dialog open with every value intact. A failed search keeps the old results on screen.

## Who handles what

| Layer | Responsibility |
|---|---|
| `CustomerApiService` | The **only** place that sees `HttpErrorResponse`. `toApiError(err)`: if `err.error` has our shape (`{ error: { code, message } }`), return `err.error.error` unchanged. Otherwise (status 0, a proxy `5xx` with an HTML/empty body, anything else) return `{ code: 'UNKNOWN', message: "Can't reach the server. Please try again." }` |
| `CustomerStore` | List errors go into the `error` signal and never throw. `load()` never rejects. `create` / `update` / `reset` **reject with `ApiError`**. A successful save **resolves even if the reload after it fails**, and that failure goes into `error`. On `NOT_FOUND` from `update`, the store calls `reload()` and then rejects |
| `CustomerFormDialog` | Every save error (cases 2–7 below) |
| `CustomersPage` | List errors (page states and banner), reset errors (snackbar), and the snackbar after the dialog closes |

`ApiError.code` is the server codes plus the client-only `'UNKNOWN'`.

## Cases

| # | Situation | Response | User sees | How to trigger |
|---|---|---|---|---|
| 1 | Client validation fails | none, no request is sent | `mat-error` under each invalid field; all fields marked touched | Empty name, or email `abc` |
| 2 | Server validation | `400 VALIDATION_ERROR` + `fields` | The server message under each matching field. Dialog stays open, form editable. The message clears as soon as that field is edited | Name `"   "` (spaces pass `required`) or email `a@b` (passes `Validators.email`, fails the server regex) |
| 3 | Email taken | `409 EMAIL_TAKEN` + `fields.email` | "Email is already in use" under the email field | Email `ANN.TAYLOR@example.com` |
| 4 | A `fields` key with no matching form control | `400` | `error.message` in the dialog's general error area | Only with a contract mismatch; covered by a unit test |
| 5 | The customer being edited no longer exists | `404 NOT_FOUND` on `PUT` | Dialog closes → snackbar "This customer no longer exists" → list reloads | Create a customer, open its edit dialog, run `curl -X POST localhost:3000/api/customers/reset`, then Save. *(Seed ids survive a reset, so editing a seed customer won't 404)* |
| 6 | Server error on save | `500 INTERNAL` / `SIMULATED_FAILURE` | `error.message` in the dialog's general error area. Values kept, Save works again | `API_FAIL_RATE=1` |
| 7 | Server unreachable on save | status 0, or a non-JSON proxy `5xx` | "Can't reach the server. Please try again." in the dialog's general error area | Stop the server with the dialog open, then Save |
| 8 | Save succeeded, refresh failed | `201`/`200`, then a list error | Dialog closes with the success snackbar. List keeps the old results and shows the error banner | `API_FAIL_RATE=0.5`, save until it happens |
| 9 | First load fails, or any list error with nothing on screen | any | Full-page `ErrorState` with "Try again" | Stop the server, refresh the page |
| 10 | Search / sort / reload fails while results are showing | any | Old results stay, plus a dismissible error banner with retry. Typing again still searches | `API_FAIL_RATE=0.5`, then type in search |
| 11 | Reset fails | any | Snackbar with `error.message`; the list is unchanged | `API_FAIL_RATE=1`, then Reset |
| — | Invalid `sort` / `order` | `400 BAD_REQUEST` | Can't happen from the UI (sort values are typed). If it did, handled like 9 / 10 | — |

## Dialog: applying a server error (order matters)

When `store.create()` / `store.update()` rejects with an `ApiError`:

1. If `code === 'NOT_FOUND'` → `dialogRef.close({ kind: 'not-found' })` and stop. There's nothing left to edit.
2. `saving.set(false)` and `form.enable()` **first**. Enabling a control re-runs its validators, which would wipe
   any server error set before it.
3. For each `[field, message]` in `error.fields`: if `form.get(field)` exists → `setErrors({ server: message })`
   and `markAsTouched()`. Otherwise treat it as unmatched.
4. If there is no `fields`, or any field was unmatched → `generalError.set(error.message)`.

In the template, inside the field's `mat-error`:

```html
@if (form.controls.email.hasError('server')) {
  {{ form.controls.email.getError('server') }}
}
```

- A server error clears by itself when that field's value changes, because the validators re-run and replace the errors object.
- `generalError` is cleared at the start of the next submit.
- Dialog result type: `{ kind: 'saved'; customer: Customer } | { kind: 'not-found' } | undefined` (`undefined` = cancelled).
  The page shows "Customer added" / "Customer updated" for `saved` and "This customer no longer exists" for `not-found`.

## Client vs server validation

| Rule | Client | Server |
|---|---|---|
| Name required, 2–100 chars | `required`, `minLength(2)`, `maxLength(100)` on the raw value | same rule on the **trimmed** value, so `"   "` → "Name is required" |
| Email format | `Validators.email` (accepts `a@b`) | `something@something.tld`, so `a@b` → "Enter a valid email address" |
| Email unique | not checked | `409 EMAIL_TAKEN`, case-insensitive |
| Status in enum | `mat-select` only offers valid values | checked |

These gaps are left on purpose rather than duplicating the server's rules exactly. They also make it easy to show,
in a demo, that server field errors arrive under the right field.

## Where this is built and tested

| Case(s) | Built in | Verified by |
|---|---|---|
| `toApiError`, store contract | Phase 2 | Phase 2 acceptance (server stopped → `UNKNOWN`), Phase 6 store + `toApiError` tests |
| 1–8 | Phase 4 | Phase 4 acceptance criteria, Phase 6 dialog tests |
| 9–10 | Phase 5 | Phase 5 acceptance criteria |
| 11 | Phase 4 | Phase 4 acceptance criteria |
