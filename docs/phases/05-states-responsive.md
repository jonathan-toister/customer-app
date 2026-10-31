# Phase 5 — States, responsive, accessibility pass

## Goal
Every situation has a deliberate screen; the app is comfortable at phone and desktop widths.

## Tasks
1. **Shared state components** in `shared/ui/` (presentational, inputs/outputs only):
   - `LoadingState` — centred spinner + optional label.
   - `ErrorState` — icon, `message` input, "Try again" button → `retry` output.
   - `EmptyState` — icon, `title`, `message`, optional `actionLabel` → `action` output.
2. **Page template — exactly these cases, in this order** (the error rows are cases 9–10 in `docs/ERROR-HANDLING.md`):
   | Condition | Shows |
   |---|---|
   | `initialLoad()` | `LoadingState` "Loading customers…" |
   | `error()` and no customers | `ErrorState` with message, retry → `store.reload()` |
   | `error()` but customers on screen | keep the list; show a dismissible inline error banner with retry (stale results stay usable) |
   | no customers and `hasQuery()` | `EmptyState` "No customers match “{query}”" + "Clear search" |
   | no customers and no query | `EmptyState` "No customers yet" + "Add customer" (and mention reset) |
   | otherwise | active view |
3. **Responsive pass** at 375px, 768px and 1280px: toolbar wraps without overlap, cards grid adapts, dialog is
   usable on mobile (consider `maxWidth: '95vw'`), touch targets ≥ 44px.
4. **Accessibility pass:** every icon-only button has `aria-label`; search has a label; status isn't conveyed by
   colour alone (text inside the chip); visible focus; dialog has a proper title; an `aria-live="polite"` region
   announces result counts after a search ("12 customers").
5. Show a result count somewhere subtle (e.g. under the toolbar: "12 customers").

## Acceptance criteria
- Stop the server, refresh → `ErrorState`; start the server, click "Try again" → list loads. *(ERROR-HANDLING case 9)*
- With results on screen and `API_FAIL_RATE=0.5`, a failed search keeps the old results and shows the dismissible banner;
  retry and further typing still work. *(case 10)*
- Search for "zzzz" → no-results state with working "Clear search".
- Reset is the way to demo; to see the true empty state, temporarily make the seed empty (or describe it in README).
- No horizontal scroll at 375px. Keyboard-only: can search, sort, switch views, open/submit/cancel the dialog.

*As built:*
- **Dismissing the banner calls `store.dismissError()`**, a new one-line store method. The store stays the only
  owner of `error`, and the next failure shows the banner again by itself.
- **`initialLoad` changed** from `loading && isEmpty` to `loading && !hasLoaded` (a flag set on the first
  successful list response). The old rule flashed the full-page spinner while refining a search with no results.
- **The true empty state uses a server knob, `SEED=empty npm run dev`**, instead of editing the seed by hand.
  Reset keeps the list empty in that mode.
- **The result count is always in the DOM** (an `aria-live` region inserted later isn't announced). It's visually
  hidden when the list is empty, because the empty state already says so, and blank during the first load and
  the full-page error.
- **The error banner is inline in the page template**, not a fourth shared component. It's used once.
- **`ErrorState` / `EmptyState` take `heading`, not `title`**: an input named `title` also leaves a native `title`
  attribute on the host, which shows a browser tooltip over the whole state.
- **The startup spinner lives in `index.html`**, not in `LoadingState`. The app initializer waits for the first list, so the page isn't drawn during the first load. `LoadingState` shows only on "Try again" after a failed first load.
- **Visible focus:** `mat.strong-focus-indicators()` in `styles.scss`. Material's default focus is only a faint tint.
- **Responsive check** was done in 375px and 768px iframes (Chrome won't shrink the window that far): no horizontal
  scroll, every touch target ≥ 48px, and the dialog is 95vw on a phone.

## Commit
`feat(client): loading, error, empty and no-results states; responsive and a11y pass`
