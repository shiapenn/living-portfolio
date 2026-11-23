# WP-16.N Progress & DoD Checklist

Authoritative live tracker for `WP-16.N` (Consolidation and acceptance). Updated in every slice.

## Goal Condition

1. `pnpm wp16n:verify` exits `0` on `main`.
2. `~/Desktop/wp16n-public-sheets.zip` (interim) and `~/Desktop/wp16n-contact-sheets.zip` (final) exist.
3. Final report delivered; `WP-17` not started.

## Slice Status

| Slice | Scope | PR / Commit | Status | Evidence |
| --- | --- | --- | --- | --- |
| N0/N1-a | ADR-007, direction lab removal, accent generator, backlog, #267 integrity | PR #268 (`02d987c`, A170) | done | CI run `45130609111` green |
| S1 | Tokens cleanup, accent wiring (`accent.<hash>.css`), per-pack docs + prose/drift guards, `ci.yml` `!cancelled()`, `wp16n:verify` | PR #269 (`b532ef3`, A171) | done | CI run `45141160246` green; 252-sheet baseline captured from `2b64ea5` |
| S2 | Admin CSS migration out of `styles.ts` into `ui-admin` + route-group splits (`admin`, `admin-editor`, `admin-gallery`); delete `styles.ts`; split `app.ts`, `commit-entry.ts`, `foundations-gallery.ts`; shrinking-only 400-line guard | in-progress | in-progress | Admin pixel diff vs `2b64ea5`: 0/252 > 0.5% (237/252 exact 0px, max 0.085%) |
| S3 | Public: self-hosted WOFF2 fonts, neutral editorial pack (chroma <= 0.01), CJK stacks + `:lang(zh)` + Chinese sample, all 14 routes/states on `ui-public` with 0 inline `style=`, `STATES.public` complete, interim `wp16n-public-sheets.zip` | pending | pending | — |
| S4 | Governance: migrate ADR families, generate `rules.md` with enforcement guard, `ds:impact`, `ds:health` + nightly workflow, changesets + CHANGELOG | pending | pending | — |
| S5 | Performance budgets, delivery headers (brotli/ETag/immutable/preload), rendering cost, full admin & public census, pixel diff vs `2b64ea5`, final `wp16n-contact-sheets.zip` | pending | pending | — |

## Definition of Done (`D-N5`)

| # | Criterion | Status | Evidence |
| --- | --- | --- | --- |
| 1 | Zero hard-coded literals outside token sources; zero inline `style=`; zero CSS-in-TS; `styles.ts` removed | partial | S1 token cleanup done; S2 `styles.ts` deleted & zero CSS-in-TS; S3 public inline styles pending |
| 2 | Zero dependency violations/cycles; no non-exempt file > 400 lines; public entry points only; per-pack docs & drift/prose guards green | met (S2) | `S2-NO-STYLES-TS` & `S2-FILE-SIZE-400` pass; `verify-design-boundaries` green |
| 3 | Token rules, closure, zero undocumented duplicates, semantic = theme-switched, accent contract wired & tested, contrast green | met (S1) | PR #269 (`b532ef3`), zero overrides (max dE 0.93) |
| 4 | D-N4 performance budgets met / reported | unmet | Pending S5 |
| 5 | Admin 42x3x2 census 0 violations; public census 0 violations; admin pixel diff 0 vs `2b64ea5`; real fonts rendered | partial | S2 admin pixel diff: 0/252 > 0.5% (237/252 exact 0px); S3 public fonts/census pending |
| 6 | ADRs migrated, `rules.md` generated, `health.md` generated, backlog updated | partial | Backlog updated in #268; S4 governance pending |
