# Phase 4 — Add / edit dialog + reset

## Goal
Create and edit customers in one dialog with client and server validation; reset demo data behind a confirmation.

## Tasks
1. **`CustomerFormDialog`**:
   - Opened by the page with `MatDialog.open(CustomerFormDialog, { data: { customer?: Customer } })`.
     No customer → "Add customer"; with customer → "Edit customer" and a pre-filled form.
   - Typed reactive form (`FormBuilder.nonNullable`): `name` (required, minLength 2, maxLength 100),
     `email` (required, email), `status` (required, `mat-select`, default `active`).
   - Inline `mat-error` messages per field.
   - On submit: if invalid → mark all as touched, stop. Else clear `generalError`, `saving` signal = true, disable
     the form, call `store.create()` / `store.update()`.
     - Success → `dialogRef.close({ kind: 'saved', customer })`.
     - Failure → follow **"Dialog: applying a server error"** in `docs/ERROR-HANDLING.md`, step by step:
       1. `NOT_FOUND` → `dialogRef.close({ kind: 'not-found' })`, stop.
       2. `saving = false` and `form.enable()` **before** setting any server error (enabling re-runs validators and would wipe them).
       3. Each `fields` entry with a matching control → `setErrors({ server: msg })` + `markAsTouched()`, shown in that field's `mat-error`.
       4. No `fields`, or an unmatched key → `generalError` = `error.message`, shown in a small error area above the actions.
   - Result type: `{ kind: 'saved'; customer: Customer } | { kind: 'not-found' } | undefined` (`undefined` = cancelled).
   - Cancel button; disable closing via backdrop/Escape while `saving`.
   - Focus the name field on open; Enter submits.
2. **Page wiring:** `openAdd()` / `openEdit(customer)`. After close, show a `MatSnackBar` per result:
   `saved` → "Customer added" / "Customer updated"; `not-found` → "This customer no longer exists" (the store has
   already reloaded the list); `undefined` → nothing. The page does **not** save — the dialog does (see DECISIONS.md).
3. **`ConfirmDialog`** in `shared/ui/` — generic: `title`, `message`, `confirmLabel`, returns `true`/`false`.
4. **Reset:** toolbar menu → "Reset demo data" → `ConfirmDialog`
   ("Reset all customers? This replaces every change with the original demo data.", confirm label "Reset").
   On confirm → `store.reset()` → snackbar "Demo data restored". On failure → snackbar with the error message.

## Acceptance criteria
- Add a customer → dialog closes, snackbar shows, the new customer appears in the list in the right sort position.
- Edit a customer's status → reflected in both table and cards.
- Submit with an empty name / bad email → client-side errors, no request sent.
Case numbers below refer to `docs/ERROR-HANDLING.md`.
- Use an existing email (different case) → `409` → error shown under the email field, dialog stays open, form still editable. *(case 3)*
- Name of only spaces → server's "Name is required" under name. Email `a@b` → server's "Enter a valid email address" under email.
  Editing the field clears the message. *(case 2)*
- With `API_FAIL_RATE=1`, saving shows an error inside the dialog; nothing is lost; Save works again. *(case 6)*
- Stop the server with the dialog open, then Save → "Can't reach the server. Please try again." in the dialog. *(case 7)*
- Create a customer, open its edit dialog, reset via curl, then Save → dialog closes, snackbar "This customer no longer exists",
  the list no longer shows it. *(case 5)*
- With `API_FAIL_RATE=0.5`, a save whose follow-up reload fails → dialog closes with the success snackbar; the list shows the error banner. *(case 8)*
- Double-clicking Save sends only one request.
- Reset: cancel does nothing; confirm restores the seed list, clears the search and resets sort.
- Reset with `API_FAIL_RATE=1` → snackbar with the error message; list unchanged. *(case 11)*

## Be ready to explain
- Why the dialog, not the page, performs the save.
- `nonNullable` forms and what `reset()` does to a control's value with and without it.
- How server field errors get mapped onto form controls, and why `form.enable()` must run **before** `setErrors`.
- Why a whitespace-only name reaches the server at all (client validation mirrors the server, but the server is the source of truth).

## Commit
`feat(client): add/edit dialog with server validation and reset demo data`
