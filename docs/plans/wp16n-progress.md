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
| S1 | Tokens cleanup, accent wiring (`accent.<hash>.css`), per-pack docs + prose/drift guards, `ci.yml` `!cancelled()`, `wp16n:verify` | in-progress | in-progress | 252-sheet admin baseline captured from `2b64ea5` |
| S2 | Admin CSS migration out of `styles.ts` into `ui-admin` + route-group splits; delete `styles.ts`; split files > 400 lines; dead CSS/exports | pending | pending | — |
| S3 | Public: self-hosted WOFF2 fonts, neutral editorial pack (chroma <= 0.01), CJK stacks + `:lang(zh)` + Chinese sample, all 14 routes/states on `ui-public` with 0 inline `style=`, `STATES.public` complete, interim `wp16n-public-sheets.zip` | pending | pending | — |
| S4 | Governance: migrate ADR families, generate `rules.md` with enforcement guard, `ds:impact`, `ds:health` + nightly workflow, changesets + CHANGELOG | pending | pending | — |
| S5 | Performance budgets, delivery headers (brotli/ETag/immutable/preload), rendering cost, full admin & public census, pixel diff vs `2b64ea5`, final `wp16n-contact-sheets.zip` | pending | pending | — |

## Definition of Done (`D-N5`)

| # | Criterion | Status | Evidence |
| --- | --- | --- | --- |
| 1 | Zero hard-coded literals outside token sources; zero inline `style=`; zero CSS-in-TS; `styles.ts` removed | unmet | S1 token cleanup done; S2 (`styles.ts`) & S3 (public inline styles) pending |
| 2 | Zero dependency violations/cycles; no non-exempt file > 400 lines; public entry points only; per-pack docs & drift/prose guards green | partial | S1 per-pack docs + drift/prose guards green; S2 file-size & dep-cruiser pending |
| 3 | Token rules, closure, zero undocumented duplicates, semantic = theme-switched, accent contract wired & tested, contrast green | met (S1) | `design-tokens` + `ui-core` tests + `accent.<hash>.css` wired; zero overrides (max dE 0.93) |
| 4 | D-N4 performance budgets met / reported | unmet | Pending S5 |
| 5 | Admin 42x3x2 census 0 violations; public census 0 violations; admin pixel diff 0 vs `2b64ea5`; real fonts rendered | partial | Baseline `2b64ea5` (252 PNGs) captured; S1 pixel diff running |
| 6 | ADRs migrated, `rules.md` generated, `health.md` generated, backlog updated | partial | Backlog updated in #268; S4 governance pending |
