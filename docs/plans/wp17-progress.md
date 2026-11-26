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
| S1 | WP-17.1 | Settings templates & Routing (`/admin/settings/answering`, `/admin/routing`, consequence copy, reply-time, confirm dialog, zero jargon) | PR #275 (`84bd133`, A177) | done | CI run `45546978226` green; CodeQL `45546978196` green; census 0 violations |
| — | WP-17.2 | Setup Step 3 Model Providers (`ProviderFlow`, `UX-09`) | PR #234 (WP-16.G, A155) | done | Verified `tests/e2e/auth.spec.ts` tests 3 & 3b (19/19 passed) |
| S2 | WP-17.3 | Backups, Export & Visibility (`/admin/settings/backups`, `/admin/settings/visibility`, named archive, dynamic `/robots.txt`, AI-crawler switch) | PR #276 (`0d06655`, A178) | done | CI run `45549332627` green; CodeQL `45549332531` green; `wp17-3-backups-visibility.spec.ts` |
| S3 | WP-17.4 | Account (`/admin/settings/account` & `/admin/account`: username/password, TOTP re-enrol, recovery codes, API tokens, sign out other sessions, UX-49) | PR #276 (`0d06655`, A178) | done | CI run `45549332627` green; `wp17-4-account.spec.ts` |
| S4 | WP-17.5 | Audit (Contradictions, Stale claims), Calibration (per-mechanism switches, proposals, history, rollback), Structure (profiles, facets, hard constraints) | PR #276 (`0d06655`, A178) | done | CI run `45549332627` green; `wp17-5-audit-calibration-structure.spec.ts` |
| S5 | WP-17.6 | Bookings (list, detail, status) & Ventures (create, edit, link entries feeding `/build`) | PR #276 (`0d06655`, A178) | done | CI run `45549332627` green; `wp17-6-bookings-ventures.spec.ts` |
| S6 | WP-17.7 | Pages & Home settings (`/admin/pages` About/Now/Uses/Home statement with revisions, `/admin/settings/home` Featured/Recent counts, featured toggle) | PR #277 (`a8d2130`, A179) | done | CI run `45551672459` green; `wp17-7-pages-home.spec.ts` |
| S7 | WP-17.8 | Appearance v2 (typed theme-pack schema, live preview, AA contrast validation, constrained customisation, admin+public scopes, `theme.<hash>.css`, JSON import/export; `gate: L-review`) | PR #277 (`a8d2130`, A179) | done (L-review sheets delivered) | CI run `45551672459` green; CodeQL `45551672449` green; `wp17-8-appearance-v2.spec.ts`; `~/Desktop/wp17-contact-sheets.zip` |
| S8 | WP-17.9 | Polish, states and content standard (WP-17 exit gate; F1–F8, D1–D6, ADR-024, painted-ink census, J1–J8 self-tests; `gate: L-review`) | PR #278 (`39bf0cb`, A180) | done (L-review sheets delivered) | CI run `45561042710` green; CodeQL `45561042692` green; `wp17-9-content-and-ink-census.spec.ts` + `J1–J8`; `~/Desktop/wp17-9-contact-sheets.zip` |
| S9 | WP-17.10 | Exit-gate fixes (A1–A10; tab headings/status dedupe, 6 Contradictions states + extended J4, Account section-local errors/QR/dot gap, Answering floor/drift, Appearance AA disable, closed status vocab, reconciled word metric, ui-core datetime, A9 before/after, viewport dialog; `gate: L-review`) | PR #279 (`40f87ad`, A181) | done (L-review sheets delivered) | `wp17-9-content-and-ink-census.spec.ts` (0 violations), `J1–J8` (8/8), `wp16-c/g/i` (0 violations), `317f257` canary verified, `~/Desktop/wp17-10-contact-sheets.zip` |
| S10 | WP-17.11 | Exit-gate final (C1–C5, K1–K5; Credential component, ADR-025 Feedback model & `feedback.md`, Item v2 container query at 480px + Contradictions Keep newer/Keep both, full admin accent coverage, 320/1280/1920 widths; `gate: L-review`) | PR #280 (A182) | in progress (PR open) | `wp17-9-content-and-ink-census.spec.ts` (6/6, 0 violations), `J1–J8` (8/8), `wp16-c/g/i` (34/34), `40f87ad` K1–K5 canary (6/6 failed on base), `~/Desktop/wp17-11-contact-sheets.zip` |

## Time Ledger

| Slice | Start (UTC+8) | End (UTC+8) | Wall-Clock (min) | Notes |
| --- | --- | --- | --- | --- |
| Docs-0 | 2026-11-25 12:05 | 2026-11-25 12:15 | 10 | Intake, verification, ADR-023, backlog & register reconciliation (PR #274) |
| S1 (WP-17.1) | 2026-11-25 12:15 | 2026-11-25 12:34 | 19 | Settings templates & Routing (PR #275) |
| S2 (WP-17.3) | 2026-11-25 12:22 | 2026-11-25 12:27 | 5 | Backups, Export & Visibility (stacked while PR #275 CI ran) |
| S3 (WP-17.4) | 2026-11-25 12:28 | 2026-11-25 12:34 | 6 | Account settings (stacked while PR #275 CI ran) |
| S4-S5 (WP-17.5/17.6) | 2026-11-25 12:34 | 2026-11-25 12:53 | 19 | Audit Contradictions, Calibration, Structure, Bookings, Ventures + launcher scroll fix (PR #276, A178) |
| S6-S7 (WP-17.7/17.8) | 2026-11-25 12:44 | 2026-11-25 13:15 | 31 | Pages editor, Home settings, Appearance v2 (`ui-core` theme-pack + `theme.<hash>.css`), full census, contact sheets (PR #277, A179) |
| S8 (WP-17.9) | 2026-11-25 13:52 | 2026-11-25 14:37 | 45 | Polish contracts D1–D6, F1–F8, ADR-024 content standard, Appearance v2 composed preview & single seed, painted-ink census + fa0cf03 canary, J1–J8 journeys, deterministic sheets (PR #278, A180) |
| S9 (WP-17.10) | 2026-11-25 15:03 | 2026-11-25 15:30 | 27 | Exit-gate fixes A1–A10, ui-core datetime formatter, closed status vocabulary, reconciled word metric, extended J4, 317f257 canary, 77-file contact-sheet zip (PR #279, A181) |
| S10 (WP-17.11) | 2026-11-26 10:55 | 2026-11-26 11:55 | 60 | Feedback model (ADR-025), Credential component (C1), Item v2 container query 480px (C3), full admin accent coverage (C4), 320/1280/1920 widths (C5), K1–K5 census + 40f87ad canary, 85-PNG contact-sheet zip (PR #280, A182) |
