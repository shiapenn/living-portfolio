# WP-17 Progress & Time Ledger

Authoritative live tracker for `WP-17` (Settings, maintenance, account, and Appearance v2). Updated in every slice.

## Standing Rules & Constraints
- Admin is in **system mode** (`ADR-023`, `D-J`): use existing registered `data-c` components and templates; no new component without L's prior approval; variants only.
- Zero literals outside token sources, zero inline `style=`, all values from tokens.
- Every new state added to `STATES` (`tests/e2e/states-manifest.ts`) with markers, census, registry, and gallery.
- Public site is NOT restyled in `WP-17` (public scope of Appearance v2 is stored and validated only; live public application lands in `WP-19`/`WP-20.1`).

## Slice Checklist

| Slice | Backlog ID | Scope | PR / Commit | Status | Evidence |
| --- | --- | --- | --- | --- | --- |
| Docs-0 | WP-16 closure | ADR-023, ADR-001/rules.md, backlog reconciliation, register updates | PR #274 (`3b6453d`, A176) | done | CI run `45545070317` green; `auth.spec.ts` 19/19 |
| S1 | WP-17.1 | Settings templates & Routing (`/admin/settings/answering`, `/admin/routing`, consequence copy, reply-time, confirm dialog, zero jargon) | pending | pending | — |
| — | WP-17.2 | Setup Step 3 Model Providers (`ProviderFlow`, `UX-09`) | PR #234 (WP-16.G, A155) | done | Verified `tests/e2e/auth.spec.ts` tests 3 & 3b (19/19 passed) |
| S2 | WP-17.3 | Backups, Export & Visibility (`/admin/settings/backups`, `/admin/settings/visibility`, named archive, dynamic `/robots.txt`, AI-crawler switch) | pending | pending | — |
| S3 | WP-17.4 | Account (`/admin/settings/account` & `/admin/account`: username/password, TOTP re-enrol, recovery codes, API tokens, sign out other sessions, UX-49) | pending | pending | — |
| S4 | WP-17.5 | Audit (Contradictions, Stale claims), Calibration (per-mechanism switches, proposals, history, rollback), Structure (profiles, facets, hard constraints) | pending | pending | — |
| S5 | WP-17.6 | Bookings (list, detail, status) & Ventures (create, edit, link entries feeding `/build`) | pending | pending | — |
| S6 | WP-17.7 | Pages & Home settings (`/admin/pages` About/Now/Uses/Home statement with revisions, `/admin/settings/home` Featured/Recent counts, featured toggle) | pending | pending | — |
| S7 | WP-17.8 | Appearance v2 (typed theme-pack schema, live preview, AA contrast validation, constrained customisation, admin+public scopes, `theme.<hash>.css`, JSON import/export; `gate: L-review`) | pending | pending | — |

## Time Ledger

| Slice | Start (UTC+8) | End (UTC+8) | Wall-Clock (min) | Notes |
| --- | --- | --- | --- | --- |
| Docs-0 | 2026-11-25 12:05 | 2026-11-25 12:15 | 10 | Intake, verification, ADR-023, backlog & register reconciliation (PR #274) |
| S1 (WP-17.1) | 2026-11-25 12:15 | pending | — | Settings templates & Routing (`/admin/settings/answering`, `/admin/routing`) |
