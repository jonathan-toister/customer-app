# Phase 3 — Customers page, toolbar, views

## Goal
The real list UI: a toolbar with search, sort and view switch, and two interchangeable views (table, cards).

## Tasks
1. **`AppComponent` shell:** Material toolbar with the app title, `<router-outlet>`. Nothing else.
2. **`CustomerToolbar`** (presentational):
   - Inputs: `query`, `sort`, `view`, `showViewSwitch`, `busy`.
   - Outputs: `queryChange`, `sortChange`, `viewChange`, `add`, `reset`.
   - Search `mat-form-field` with a search icon, a clear (×) button when non-empty, `aria-label`.
   - Sort: `mat-select` for the field + an icon button toggling asc/desc (`aria-label` reflects current direction).
   - View switch: `mat-button-toggle-group` (table / cards icons, with labels/tooltips). Hidden when `showViewSwitch` is false.
   - "Add customer" primary button. A `mat-menu` (more-vert) holding "Reset demo data" (wired in phase 4).
   - A thin `mat-progress-bar` under the toolbar when `busy` (searching with results already on screen).
3. **`CustomerTable`** (presentational): `mat-table` with name, email, status, created date, and an edit action.
   - Inputs: `customers`, `sort`. Outputs: `edit`, `sortChange`.
   - Bind `matSort` to the `sort` input (`matSortActive`, `matSortDirection`) and emit `sortChange` on header click —
     **no client-side sorting**, the server sorts. Toolbar and headers stay in sync through the store.
   - Status as a small coloured chip/badge; date via `DatePipe` (`mediumDate`).
   - Whole row clickable for edit is optional; the explicit edit icon button is required (keyboard accessible).
4. **`CustomerCards`** (presentational): responsive CSS grid of `mat-card`s (auto-fill, min ~280px).
   Same inputs/outputs minus sort. Shows the same four fields and an edit button.
5. **`CustomersPage`** (smart):
   - Injects `CustomerStore`, `BreakpointObserver`.
   - `isMobile` via `toSignal(breakpointObserver.observe(Breakpoints.Handset)…)`.
   - `selectedView` signal initialised from `localStorage['customers.view']` (default `table`), saved on change.
     Wrap `localStorage` access in try/catch.
   - `activeView = computed(() => isMobile() ? 'cards' : selectedView())`.
   - Template chooses between state components (temporary simple text is fine — real ones in phase 5) and
     `@switch (activeView())` for the views.
   - Full-page loading only when `store.initialLoad()`; otherwise keep results visible and pass `busy` to the toolbar.
6. Remove the temporary debug `<pre>` from phase 2.

*As built:*
- **Mobile is `Breakpoints.XSmall` (width under 600px), not `Breakpoints.Handset`.** Handset also depends on orientation
  (a landscape window up to 959px wide counts as a phone), which is harder to predict and to test in DevTools.
- **The toolbar has one extra output, `clear`**, for the × button. The page calls `store.clearQuery()`, which searches
  at once. `queryChange('')` would wait for the 300ms debounce like normal typing.
- **Rows are not clickable; only the edit icon button opens edit.** Clickable rows were built first and then removed
  (see the AI log in `DECISIONS.md`).
- `CustomerView` (`'table' | 'cards'`) is exported from `customer-toolbar.ts`, because the toolbar owns the view switch.
  It's a UI type, so it isn't in `customer.model.ts`.
- `MAT_ICON_DEFAULT_OPTIONS` in `app.config.ts` makes `<mat-icon>` use the Material Symbols font that `index.html` loads.

## Stretch
- `CustomerCompactList` as a third view option.

## Acceptance criteria
- Desktop: can switch table ↔ cards; choice survives a page refresh.
- Narrow viewport (DevTools, ~375px): cards only, no view switch, toolbar wraps cleanly, no horizontal scroll.
- Sorting from the toolbar updates the table header arrow, and clicking a header updates the toolbar select.
- While typing, existing results stay on screen with the thin progress bar — no flashing to a spinner.
- Presentational components have no `inject()` of app services (grep to confirm).

## Be ready to explain
- Why the views don't sort locally.
- Why `activeView` is `computed` rather than set in an effect/subscription.
- What `track` in `@for` does and what you're tracking by.

## Commit
`feat(client): customers page with toolbar, table and card views`
