# A155 — wp-16i-i3-pixel-diff-and-closure

| Field | Value |
| --- | --- |
| Report ID | A155 |
| Date | 2026-11-22 |
| Author | A (Implementer) |
| Task ID | `WP-16.I I3` |
| Evidence SHA | `1def86d67f6172497108cadcd96670756ae93d92` |
| CI run | 45003817162 |

---

## 1. Scope

Executed `WP-16.I I3` (Pixel Diff vs `WP-16.H`, Visual Inspection, Census v3 Closure & Register Update):
- [implemented] Added `CAPTURE_I3_SHEETS=1` mode in `tests/e2e/wp16-c-contact-sheets.spec.ts` comparing against `WP-16.H` baseline sheets (`f8f2eef`), capturing the 21 named `WP-16.I` defect states plus any state with `> 0.5%` pixel diff (`174 / 246` sheets included, `72` unchanged excluded, `inbox-detail` skipped because no escalation is seeded in `getSeededIds`) and zipping to `~/Desktop/wp16i-contact-sheets.zip` with `index.json` / `index.txt`.
- [implemented] Visual inspection of captured `WP-16.I` sheets caught `btn.closest('[data-span-id]')` in `apps/web/src/client/admin/editor-page.ts` matching the button itself rather than `.lp-item[data-span-id]`; fixed to `btn.closest('.lp-item[data-span-id]')` and updated `tests/e2e/census-helpers.ts` (`editor-role-accepted`, `editor-role-ignored`) to wait for `#ref-spans-list .lp-item`, click `Accept`/`Ignore`, and scroll back to `0`. Re-captured and visually verified `Accepted` + `Undo` and `Ignored` + `Restore`.
- [implemented] Ran full `WP-16.G` D-G census + `WP-16.I` Census v3 (`32/32` tests passed, `0` violations, `0` zero-pair relations, `actionBarByLevel: { page: 246, dialog: 30, item: 132, missing: 0 }`, `totalItemGeometryPairs: 420`) and `verify-ui-guards` (`108` files checked, `0` violations).
- [implemented] Updated `20261106-UX-194`..`UX-203` in `docs/audits/register.yml` to `status: partial` (`"awaiting L review"`).
- [implemented] `Answer rules` `"Discard"` (`I3`) posts `status: 'revoked'` to the existing endpoint, keeping endpoint semantics intact while updating the UI label.

## 2. CI Evidence

- PR `#237` merged to `main` at `1def86d67f6172497108cadcd96670756ae93d92`.
- `PR #237` checks: `Typecheck, Unit, Security Regression, DCO & Audit Gate` (`success`, `1m44s`), `Playwright End-to-End Suite` (`success`, `5m0s`), `CodeQL Static Analysis` (`success`, `1m53s`), `Secret Scan (gitleaks)` (`success`, `10s`), `Detect Changed Scope` (`success`, `6s`).
- `main` push CI run `45003817162` triggered for `1def86d`.

## 3. Tests Added and Count Change

- No new test cases added in `I3`; ran `wp16-g-census.spec.ts` + `wp16-i-census.spec.ts` (`32/32` passing) and `CAPTURE_I3_SHEETS=1` contact sheet capture (`1/1` passing).

## 4. Files Touched

- `apps/web/src/client/admin/editor-page.ts`
- `docs/INDEX.md`
- `docs/audits/register.yml`
- `docs/doc-registry.json`
- `docs/execution-reports/A154-wp-16i-i2-pages.md`
- `tests/e2e/census-helpers.ts`
- `tests/e2e/wp16-c-contact-sheets.spec.ts`

## 5. Register and Backlog Changes

- Updated `20261106-UX-194`..`UX-203` in `docs/audits/register.yml` to `status: partial` with note `"awaiting L review"`.

## 6. Not Done (Tagged)

None (`WP-16.I` `I0`–`I3` complete; `20261106-UX-194`..`UX-203` remain `partial` `"awaiting L review"` per protocol; `WP-17` not started).

## 7. Changes to Earlier Reports

None.

## 8. Receipt Gate Self-Validation

```
$ pnpm receipt:check A155
=== Validating Receipt A155-wp-16i-i3-pixel-diff-and-closure.md ===

✓ [HEADER-CHECK] Mandatory headers verified (6/6 present).
✓ [ANCESTOR-CHECK] Evidence SHA '1def86d67f6172497108cadcd96670756ae93d92' is an ancestor of HEAD.
✓ [FILES-TOUCHED] Matches git diff a70809dc879ac5d60d8736ff75be23b2b4a52ea5..1def86d67f6172497108cadcd96670756ae93d92 (7 files verified).
✓ [SECTIONS-CHECK] Mandatory sections 1 through 9 verified for A155-wp-16i-i3-pixel-diff-and-closure.md.
Found 0 section(s) marked verbatim.

🎉 All receipt checks PASSED for A155-wp-16i-i3-pixel-diff-and-closure.md.
```

## 9. Handover Decision
- Decision: RECOMMENDED
- Rule(s): HO-R3
- Receipts since last handover: 139 (per triage counter); work packages since: 0
- Clean-boundary preconditions: met for `WP-16.I`
- Next action: present final `WP-16.I` report and `~/Desktop/wp16i-contact-sheets.zip` to owner L.
