# Phase 6 — Modifications

## Goal
Four changes the developer asked for after Phase 5, before tests are written:
one source for design values, our own dialog and notification, pagination, and no API call for a search that
can't match.

## Tasks

### A. Design tokens and shared style pieces
1. `client/src/_tokens.scss` (pulled in by `styles.scss`): CSS custom properties for spacing, corner radius,
   status colours and the content width. Colours and type already come from the Material theme (`--mat-sys-*`).
2. Every component `.scss` uses the tokens instead of raw px values and hex colours.
3. `CustomerStatusBadge` (`features/customers/components/customer-status-badge/`) replaces the badge markup and
   styles copied into the table and the cards.
4. `ErrorBanner` (`shared/ui/error-banner/`) replaces the red box copied into the page banner and the form
   dialog's general error. Action buttons are projected in.

### B. Our own dialog and notification
1. `DialogShell` (`shared/ui/dialog-shell/`): heading, content and actions slots. One look for every dialog.
2. `AppDialog` service (same folder): opens any dialog through the unstyled CDK `Dialog` with the shared config.
   CDK gives focus trapping, Escape, backdrop and the dialog role. No Material dialog styles.
3. `ConfirmDialog` and `CustomerFormDialog` use `DialogShell` and the CDK `DialogRef` / `DIALOG_DATA`.
4. `NotificationService` + `Toast` (`shared/ui/notification/`): one message at a time, closes after 4s,
   `success` or `error`. The toast is rendered once in `app.html`. Replaces `MatSnackBar`.

### C. Pagination
1. `docs/API.md` first: `page` / `pageSize` params; the list response becomes `{ items, total, page, pageSize }`;
   a page past the end is clamped to the last page.
2. Server: `parseListQuery` validates the params, `list()` filters → sorts → slices. `requests.http` examples.
3. Client: `CustomerPage` type, `api.list()` sends the params, the store keeps `total` / `page` / `pageSize`.
   Search, clear, sort and reset go back to page 1. Reloads after a save stay on the current page.
4. `mat-paginator` under the active view (table and cards share it), hidden when the list is empty.

### D. Skip searches that can't match
1. When a search for "zz" returns `total: 0`, typing any text that contains "zz" doesn't call the API.
   The server matches a case-insensitive substring, so a longer text can only match fewer customers.
2. Forgotten on reload, retry, create, update and reset, because the data may have changed.

## Acceptance criteria
- 40 seed customers → 4 pages of 10; changing the page size works; search and sort go back to page 1;
  saving an edit on page 3 stays on page 3.
- `curl 'localhost:3000/api/customers?page=0'` → `400`; `?page=99` → the last page, with `page: 4`.
- Network tab: search "zzzz", wait, then type "zzzzz" or put "x" in front → no new request. "Clear search" → a request.
- Confirm, add and edit dialogs and all notifications use the new design; no `mat-mdc-dialog` or
  `mat-mdc-snack-bar` elements in the DOM. Escape and backdrop close a dialog (not while saving), and focus goes back
  to the button that opened it.
- No raw px spacing or hex status colours outside `_tokens.scss`. Changing one token changes table and cards.
- ERROR-HANDLING cases 5, 8, 10 and 11 still behave as documented, with toasts.
- `npm run test` and `npm --prefix client run build` pass. No horizontal scroll at 375px.

## Be ready to explain
- Why pagination makes "filter in the browser" the wrong choice, and what was true before it.
- Why `includes`, not `startsWith`, for skipping searches, and when the remembered empty term must be forgotten.
- What the CDK `Dialog` does for us that a hand-made `<div>` overlay wouldn't (focus trap, Escape, restoring focus, roles).
- Why `NotificationService` isn't the "global error service" that CLAUDE.md rules out.

## Commits (one per item, each confirmed first)
1. `Move design values into one tokens file`
2. `Use our own dialog and notification design`
3. `Add pagination to the customer list`
4. `Skip searches that can't have results`

*As built:*
- **The error banner always shows its icon**, in the dialog too (the dialog's old error box had none), so the two
  really are one design.
- **"This customer no longer exists" is an `error` notification** (red), because the edit wasn't saved.
- **The state icon size became a token too** (`--app-state-icon-size`), since the empty and error states share it.
  Sizes used by one component only (column widths, flex bases) stay in that component.
- **After saving an edit, focus goes to the page, not the edit button**: the reload re-creates the table rows. The same
  was true with `MatDialog`. Escape and Cancel do return focus to the button.
- **Page size is kept on reset**; page, search and sort go back to their defaults.
- **The "can't match" rule also covers an empty list**: if `''` found no one, typing doesn't call the API until a
  reload or reset. It's the same rule (every text contains `''`), so it needs no extra code.
- **Only typing is skipped.** Sort and page clicks always call the API.
