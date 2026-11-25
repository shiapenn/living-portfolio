# A176 — WP-16 closure ADR-023 backlog reconciliation

| Field | Value |
| --- | --- |
| Report ID | A176 |
| Date | 2026-11-25 |
| Author | A (Implementer) |
| Task ID | `WP-16 Owner Sign-Off` |
| Evidence SHA | `3b6453d0a078016fbadc9e69add879c22b38efd8` |
| CI run | 45545070317 |

---

## 1. Scope

### 1.0 Intake & Verification
- [implemented] `pnpm handover:verify H017`: exited `1` with expected known drift exception (non-docs commits between `dff335a` and `HEAD` from WP-16.R..WP-16.N).
- [implemented] `pnpm wp16n:verify`: PASSED (10/10 DoD checks green).
- [implemented] `pnpm exec playwright test tests/e2e/auth.spec.ts`: PASSED (19/19 tests, including tests 3 & 3b proving `ProviderFlow` in Setup Step 3, `Settings > Providers`, and `Status` for `WP-17.2` / `UX-09`).

### 1.1 Owner Sign-Off Deliverables (WP-16 closed 2026-11-23)
- [implemented] Authored `ADR-023` (`docs/adr/ADR-023-unified-design-framework.md`): Unified design framework (shared token contract for type, space/rhythm relations, colour, radius, elevation, motion, density; rules; shared components in `@living-portfolio/ui-core` using contract tokens only; language-specific structure in `@living-portfolio/ui-admin` and `@living-portfolio/ui-public`; public pack scales & rhythm/role checks; admin system mode vs public expressive mode; shared component changes must pass both suites).
- [implemented] Updated `docs/adr/ADR-001-two-design-languages.md`, `docs/design/README.md`, and regenerated `docs/design/decisions.md` (23 ADRs), `docs/design/rules.md` (29 effective rules), and `docs/design/health.md`.
- [implemented] Reconciled `docs/plans/backlog.yml` against `docs/audits/2026-11-06-ux-specification-audit/report.md` (§7.8–§7.11) and `P004`:
  1. [implemented] Added `WP-19.0` ("Design framework review and unification", depends on `WP-16.N`, `gate: L-review`) before the WP-19 Public Frame.
  2. [implemented] Marked `WP-17.2` (`UX-09`, Setup Step 3 `ProviderFlow`) as `status: done` after verifying `tests/e2e/auth.spec.ts` (19/19 passed).
  3. [implemented] Replaced misassigned `WP-17.3` (Storage settings & Media API) with report §7.8 `WP-17.3` (Backups, Export & Visibility); moved Media API (`WP-18.3`), Images & video (`WP-18.4`), Columns (`WP-18.5`), Import stepper (`WP-18.6`), Real file import (`WP-18.7`), Quick Log (`WP-18.8`), and Storage settings (`WP-18.9`) to `WP-18` (marking `WP-18.1` and `WP-18.2` done per WP-16.L L2).
  4. [implemented] Added missing WP-17 report items: `WP-17.4` (Account), `WP-17.5` (Audit, Calibration & Structure), `WP-17.6` (Bookings & Ventures), `WP-17.7` (Pages & Home settings), and renumbered Appearance v2 from old `WP-17.4` to `WP-17.8` (`gate: L-review`).
  5. [implemented] Added missing WP-19 Public Frame items (`WP-19.1`..`WP-19.8`), mapping legacy `P-2` into `WP-19.2`, keeping `P-3` (performance budget gate), and keeping `P-4` and `P-5` as `blocked-on-owner` owner-direction items.
  6. [implemented] Added missing WP-20 items (`WP-20.1`..`WP-20.7`), wiring `WP-20.1` (live public theme application & shape contract) to depend on `WP-19.2`, `WP-17.8` (Appearance public scope), `GATE-GFE`, and `P-3`.
- [implemented] Updated `docs/audits/register.yml`: transitioned 61 WP-16 admin findings (`20261106-UX-157`..`20261106-UX-217`) from `partial` ("awaiting L review") and `20261106-UX-09` to `fixed` (`verified_by: L`, owner acceptance 2026-11-23, receipts `A150`–`A175`); registered 9 new open public defect findings (`20261106-UX-218`..`20261106-UX-226`) mapped to `WP-19.0` in `P004` and `gates.json`.
- [implemented] Created `docs/plans/wp17-progress.md` live checklist & time ledger.

### Component statement (required when touching UI; D-J)
- [implemented] Docs-only PR; no UI code or components modified.

## 2. CI Evidence

- PR #274 commit `3b6453d0a078016fbadc9e69add879c22b38efd8`:
  - `CI & Audit Conformance Gate` run `45545070317`: `success` (1m9s; Playwright E2E skipped on docs-only change per WP-14.pre-c).
  - `CodeQL Static Analysis` run `45545070221`: `success` (2m9s).
  - `Secret Scan (gitleaks)` run `45545070339`: `success` (6s).

## 3. Tests Added and Count Change

- [implemented] No tests added (docs-only PR). Verified existing `tests/e2e/auth.spec.ts` locally (local output: 19/19 passed in 8.6s).

## 4. Files Touched

- `docs/INDEX.md`
- `docs/adr/ADR-001-two-design-languages.md`
- `docs/adr/ADR-023-unified-design-framework.md`
- `docs/audits/register.yml`
- `docs/design/README.md`
- `docs/design/decisions.md`
- `docs/design/health.md`
- `docs/design/rules.md`
- `docs/doc-registry.json`
- `docs/execution-reports/A175-wp-16n-s5-performance-closure.md`
- `docs/plans/P004-ux-remediation-work-packages.md`
- `docs/plans/backlog.yml`
- `docs/plans/gates.json`
- `docs/plans/wp17-progress.md`

## 5. Register and Backlog Changes

- [implemented] `docs/audits/register.yml`: 62 findings transitioned `partial` -> `fixed` (`20261106-UX-09`, `20261106-UX-157`..`20261106-UX-217`, `verified_by: L`, owner acceptance 2026-11-23); 9 new `open` public findings added (`20261106-UX-218`..`20261106-UX-226`) mapped to `WP-19.0`.
- [implemented] `docs/plans/backlog.yml`: reconciled with audit report §7.8–§7.11 and P004 (added `WP-19.0`, marked `WP-17.2`/`WP-18.1`/`WP-18.2` done, moved Storage/Media to `WP-18`, populated `WP-17.3`..`WP-17.8`, `WP-19.1`..`WP-19.8`, `WP-20.1`..`WP-20.7`).

## 6. Not Done (Tagged)

- [not-started] `WP-17.1`, `WP-17.3`..`WP-17.8` — scheduled next in this session.
- [not-started] `WP-18.3`..`WP-18.9`, `WP-19.0`..`WP-19.8`, `WP-20.1`..`WP-20.7` — out of scope for WP-17.

## 7. Changes to Earlier Reports

None.

## 8. Receipt Gate Self-Validation

```
$ pnpm receipt:check A176
=== Validating Receipt A176-wp-16-closure-adr-023-backlog-reconciliation.md ===

✓ [HEADER-CHECK] Mandatory headers verified (6/6 present).
✓ [ANCESTOR-CHECK] Evidence SHA '3b6453d0a078016fbadc9e69add879c22b38efd8' is an ancestor of HEAD.
✓ [FILES-TOUCHED] Matches git diff 2c6b315ef4a90eb7a87a5bee6253b0ce8fae9d27..3b6453d0a078016fbadc9e69add879c22b38efd8 (14 files verified).
✓ [SECTIONS-CHECK] Mandatory sections 1 through 9 verified for A176-wp-16-closure-adr-023-backlog-reconciliation.md.
Found 0 section(s) marked verbatim.

🎉 All receipt checks PASSED for A176-wp-16-closure-adr-023-backlog-reconciliation.md.
```

## 9. Handover Decision

- Decision: RECOMMENDED
- Rule(s): HO-R3
- Receipts since last handover: 160; work packages since: 2
- Clean-boundary preconditions: met
- Next action: merge PR #274 via `--merge` and continue with WP-17.1 (`pnpm backlog:next`); H018 is not written at this interim boundary per `execution-protocol.md` §1.7 & `P004` §7.10 (hands-on owner handover/gate deferred to Milestone Gate GFE).
