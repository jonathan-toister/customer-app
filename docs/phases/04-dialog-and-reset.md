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
   - On submit: if invalid → mark all as touched, stop. Else `saving` signal = true, disable the form, call
     `store.create()` / `store.update()`.
     - Success → `dialogRef.close(savedCustomer)`.
     - `ApiError` with `fields` → set each as a server error on the matching control (`setErrors({ server: msg })`)
       and show it in `mat-error`. Re-enable the form.
     - Other errors → show `error.message` in a small error area inside the dialog. Re-enable the form.
   - Cancel button; disable closing via backdrop/Escape while `saving`.
   - Focus the name field on open; Enter submits.
2. **Page wiring:** `openAdd()` / `openEdit(customer)`; after a successful close show a `MatSnackBar`
   ("Customer added" / "Customer updated"). The page does **not** save — the dialog does (see DECISIONS.md).
3. **`ConfirmDialog`** in `shared/ui/` — generic: `title`, `message`, `confirmLabel`, returns `true`/`false`.
4. **Reset:** toolbar menu → "Reset demo data" → `ConfirmDialog`
   ("Reset all customers? This replaces every change with the original demo data.", confirm label "Reset").
   On confirm → `store.reset()` → snackbar "Demo data restored". On failure → snackbar with the error message.

## Acceptance criteria
- Add a customer → dialog closes, snackbar shows, the new customer appears in the list in the right sort position.
- Edit a customer's status → reflected in both table and cards.
- Submit with an empty name / bad email → client-side errors, no request sent.
- Use an existing email (different case) → `409` → error shown under the email field, dialog stays open, form still editable.
- With `API_FAIL_RATE=1`, saving shows an error inside the dialog; nothing is lost.
- Double-clicking Save sends only one request.
- Reset: cancel does nothing; confirm restores the seed list, clears the search and resets sort.

## Be ready to explain
- Why the dialog, not the page, performs the save.
- `nonNullable` forms and what `reset()` does to a control's value with and without it.
- How server field errors get mapped onto form controls.

## Commit
`feat(client): add/edit dialog with server validation and reset demo data`
