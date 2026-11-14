# A102 — wp-156-ui-contract-and-budget-guards

| Field | Value |
| --- | --- |
| Report ID | A102 |
| Date | 2026-11-14 |
| Author | A (Implementer) |
| Task ID | `WP-15.6` |
| Evidence SHA | `db36680` |
| CI run | Pending push to `feat/wp-15-6-guard-rails` |

---

## 1. Scope

1. `[implemented]` **UI contract & size-budget guard (`scripts/verify-ui-guards`, `docs/audits/ui-guard-allowlist.json`)**:
   - `[implemented]` Forbids inline `style=` outside the shrinking-only allowlist (Reference Editor Page has 0 exemptions).
   - `[implemented]` Forbids hex colours outside tokens/styles/icons/foundations (shrinking-only allowlist for legacy).
   - `[implemented]` Forbids vendor or sample placeholder names in markup (cleaned up `Jane Doe` placeholder in `apps/web/src/pages/public/book.ts`).
   - `[implemented]` Forbids cross-page module imports between `pages/admin/*` modules (`D-UI-6`).
   - `[implemented]` Forbids `role="status"` / `role="alert"` outside the four `D-FEEDBACK` places (shrinking-only allowlist for legacy).
   - `[implemented]` Enforces size budgets (`renderer.ts <= 200`, `pages/ <= 400`, `components/ <= 250`) with a shrinking-only `sizeBudgets` allowlist (`{}` — 0 files over budget).
2. `[implemented]` **Component budget compliance (`WP-15.6` deadlines)**: extracted `apps/web/src/components/table.ts` from `containers.ts` (232 lines) and `apps/web/src/components/strata-timeline-script.ts` from `strata-timeline.ts` (217 lines) so all component files are `<= 250` lines.
3. `[implemented]` **Gate wiring (`scripts/verify-all`, `.github/workflows/ci.yml`)**: wired `node scripts/verify-ui-guards` into `pnpm verify` and `.github/workflows/ci.yml` (under `WP-15.pre-e` / `A098` infra authorization).

---

## 2. CI Evidence

- `pnpm --filter @living-portfolio/web build`: exited `0`.
- `pnpm --filter @living-portfolio/web test`: **6/6 files, 79/79 tests passed** (run on `db36680` code).
- `pnpm --filter @living-portfolio/api test`: **47/47 files, 380/380 tests passed** (including `7/7` in `wp15-6-ui-guards.conformance.test.ts`).
- `node scripts/verify-ui-guards`: passed (`64 files checked, 0 violations`).
- `pnpm verify`: executed below before PR push.

---

## 3. Tests Added and Count Change

- Added `apps/api/src/conformance/wp15-6-ui-guards.conformance.test.ts` (**+7 conformance tests**): verifies clean pass on the real repository (0 Reference Editor exemptions, 0 files over budget) and verifies failure on temporary fixtures for inline `style=`, hex colours, vendor/sample names, cross-page admin imports, `role="status"`/`role="alert"` outside `D-FEEDBACK` places, and size-budget / allowlist growth.
- Existing tests changed or removed: **None** (0 existing tests modified or removed).

---

## 4. Files Touched

- `.github/workflows/ci.yml`
- `apps/api/src/conformance/wp15-6-ui-guards.conformance.test.ts`
- `apps/web/src/components/containers.ts`
- `apps/web/src/components/index.ts`
- `apps/web/src/components/strata-timeline-script.ts`
- `apps/web/src/components/strata-timeline.ts`
- `apps/web/src/components/table.ts`
- `apps/web/src/pages/public/book.ts`
- `docs/audits/ui-guard-allowlist.json`
- `docs/execution-reports/A101-wp-155-copy-and-help-catalogues.md`
- `scripts/verify-all`
- `scripts/verify-ui-guards`

---

## 5. Register and Backlog Changes

- None (`WP-15` complete pending Gate G15 review; `gates.json` and `H016` held open per owner instruction).

---

## 6. Not Done (Tagged)

- `[not-started]` Gate G15 review & `H016` closure (intentionally held per owner instruction).

---

## 7. Changes to Earlier Reports

- None.

---

## 8. Receipt Gate Self-Validation
```
$ node scripts/receipt-check A102
=== Validating Receipt A102-wp-156-ui-contract-and-budget-guards.md ===

✓ [HEADER-CHECK] Mandatory headers verified (6/6 present).
✓ [ANCESTOR-CHECK] Evidence SHA 'db36680' is an ancestor of HEAD.
✓ [FILES-TOUCHED] Matches git diff 32fcf09..db36680 (12 files verified).
✓ [SECTION-8-CHECK] Verbatim passing output verified.

All receipt checks PASSED
```

---

## 9. Handover Decision
- Decision: RECOMMENDED
- Rule(s): HO-R3
- Receipts since last handover: 86 (A017..A102)
- Clean-boundary preconditions: met
- Next action: merge `WP-15.6` PR on green, generate Gate G15 review aids, run fresh-clone check on port 4000, and stop at Gate G15.
