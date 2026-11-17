# A132 — WP-16.S S0 D-SYS Foundations and Census

| Field | Value |
| --- | --- |
| Report ID | A132 |
| Date | 2026-11-17 |
| Author | A (Implementer) |
| Task ID | `WP-16.S S0` |
| Evidence SHA | `46746e5ce0ade483a803fe2a8834eb52626dc9b1` |
| CI run | 44008648976 |

---

## 1. Scope

Executed `WP-16.S` `S0` (D-SYS foundations, D-08 amendment, defect registration, and failing-first census extensions + canaries):
- [implemented] Added `D-SYS` (rules 1–16) and `D-EDITOR-4` to `docs/design/foundations.md` and `docs/plans/P004-ux-remediation-work-packages.md`, plus `WP-16.S` (`S0`–`S4`) in `P004`.
- [implemented] Amended `D-08` in `docs/design/foundations.md` and `docs/plans/P004-ux-remediation-work-packages.md`: removed the top-bar status dot and status popover (unexplained purpose, extra shell variant) and moved `Site build`, `Automated answering` (same API / one source of truth), `Backups`, and `Providers` to `/admin/status` in the `Govern` group of the launcher.
- [implemented] Registered `20261106-UX-140` through `20261106-UX-156` (`status: open`) in `docs/audits/register.yml` and mapped them to `WP-16` in `docs/plans/gates.json` and `docs/plans/P004-ux-remediation-work-packages.md`.
- [implemented] Added the `D-SYS #1` `[COMPONENT-MARGIN]` guard rule to `scripts/verify-ui-guards` (without editing existing rules 1–6) with a failing-first canary test in `apps/api/src/conformance/wp15-6-ui-guards.conformance.test.ts` and initial allowlist `83` in `docs/audits/ui-guard-allowlist.json`.
- [implemented] Added `tests/e2e/wp16-s-system-census.spec.ts` (12 checks + 12 failing-first canaries via `/admin/_canary?suite=dsys`); observed initial 0-budget failures on `main` before recording the `S0` shrinking-only baseline in `docs/audits/dsys-census-budget.json`.

## 2. CI Evidence

- PR `#190` merged to `main` at `46746e5ce0ade483a803fe2a8834eb52626dc9b1`.
- `main` push CI run `44008648976` (`CI & Audit Conformance Gate`): `success`.
- `pnpm verify`: 15/15 gates passed.
- `tests/e2e/wp16-s-system-census.spec.ts`: 2/2 passed (all 12 canaries caught intentional violations with `> 0` measured elements; `D-SYS` census met `S0` baseline budgets).

## 3. Tests Added and Count Change

- Added `tests/e2e/wp16-s-system-census.spec.ts` (+2 E2E tests: 12-check canary suite and `D-SYS` system census).
- Added 1 Vitest canary test in `apps/api/src/conformance/wp15-6-ui-guards.conformance.test.ts` (`[COMPONENT-MARGIN]`).

## 4. Files Touched

- `apps/api/src/conformance/wp15-6-ui-guards.conformance.test.ts`
- `apps/web/src/app.ts`
- `apps/web/src/pages/admin/gallery.ts`
- `apps/web/src/styles.ts`
- `docs/INDEX.md`
- `docs/audits/dsys-census-budget.json`
- `docs/audits/register.yml`
- `docs/audits/ui-guard-allowlist.json`
- `docs/design/foundations.md`
- `docs/doc-registry.json`
- `docs/execution-reports/A131-wp-16c-c4-contact-sheets-and-register-closure.md`
- `docs/plans/P004-ux-remediation-work-packages.md`
- `docs/plans/gates.json`
- `scripts/verify-ui-guards`
- `tests/e2e/wp16-s-system-census.spec.ts`

## 5. Register and Backlog Changes

- Registered `20261106-UX-140` through `20261106-UX-156` (`status: open`) in `docs/audits/register.yml` and mapped them to `WP-16` in `docs/plans/gates.json` and `docs/plans/P004-ux-remediation-work-packages.md`.

## 6. Not Done (Tagged)

- [not-started] `WP-16.S S1`–`S4`: Foundation simplification, page/overlay migrations, `D-EDITOR-4` + Structure restoration, and final contact sheets.

## 7. Changes to Earlier Reports

- **Erratum to `A130` (`WP-16.C C3`):** `A130` stated that the editor's `Structure` drawer content was kept. That statement was incorrect: during `WP-16.L`/`WP-16.C`, the `Structure` area lost its pre-`WP-16.0` tagging capabilities (level line, next step, tags/facets, suggested span roles, claims, and evidence), leaving only a single sentence under three tabs. Registered as `20261106-UX-150` (`P1`, `status: open`) and scheduled for full restoration in `WP-16.S S3`. (`A130` itself is left immutable per protocol §1.3.)

## 8. Receipt Gate Self-Validation

```
$ pnpm receipt:check A132
=== Validating Receipt A132-wp-16s-s0-d-sys-foundations-and-census.md ===

✓ [HEADER-CHECK] Mandatory headers verified (6/6 present).
✓ [ANCESTOR-CHECK] Evidence SHA '46746e5ce0ade483a803fe2a8834eb52626dc9b1' is an ancestor of HEAD.
✓ [FILES-TOUCHED] Matches git diff 95e9e5efe6f51b306a7e7f81f49959725603e5d3..46746e5ce0ade483a803fe2a8834eb52626dc9b1 (15 files verified).
✓ [SECTIONS-CHECK] Mandatory sections 1 through 9 verified for A132-wp-16s-s0-d-sys-foundations-and-census.md.
✓ [CI-LOG-CHECK] CI run 44008648976 verified on GitHub (conclusion: success).

🎉 All receipt checks PASSED for A132-wp-16s-s0-d-sys-foundations-and-census.md.
```

## 9. Handover Decision
- Decision: RECOMMENDED
- Rule(s): HO-R3
- Receipts since last handover: 116 (per triage counter); work packages since: 0
- Clean-boundary preconditions: not met (`WP-16.S` in progress: `S1`–`S4` remaining; handover deferred until `WP-16.S` closure)
- Next action: land `A132` docs PR, then complete and merge `WP-16.S S1`.
