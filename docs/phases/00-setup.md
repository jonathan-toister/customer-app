# Phase 0 — Repo setup

## Goal
An empty but runnable repo skeleton with the planning docs committed.

## Tasks
1. `git init` at the repo root (planning files — `CLAUDE.md`, `docs/` — are already here).
2. Root `.gitignore`: `node_modules/`, `dist/`, `.angular/`, `coverage/`, `.env`, `*.log`, `.DS_Store`.
3. Root `package.json` (private, no workspaces) with `concurrently` as a dev dependency and scripts:
   - `install:all` → `npm install && npm --prefix server install && npm --prefix client install`
   - `dev` → run `server` and `client` dev scripts together with `concurrently` (named, coloured output)
   - `test` → client tests (append server tests later if they exist)
   These scripts reference folders created in phases 1–2; that's fine.
4. Placeholder `README.md` with just the title and "WIP — see docs/PLAN.md".
   *As built:* replaced by a real README after Phase 2, and kept current from then on (see DECISIONS.md).

## Acceptance criteria
- `git status` is clean after the commit.
- No `node_modules` tracked.

## Commit
`chore: repo skeleton and planning docs`
