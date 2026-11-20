# A147 — wp-16g-g3-pixel-diff-and-closure

| Field | Value |
| --- | --- |
| Report ID | A147 |
| Date | 2026-11-20 |
| Author | A (Implementer) |
| Task ID | `WP-16.G G3` |
| Evidence SHA | `4c6cd7084a9d2187987283634175ad3a3e1893bb` |
| CI run | 44719415329 |

---

## 1. Scope

Executed `WP-16.G G3` (Pixel-Diff Contact Sheets, Full D-G Census Report & Register Closure):
- [implemented] `tests/e2e/wp16-c-contact-sheets.spec.ts`: added `CAPTURE_G3_SHEETS=1` selective contact sheet capture & PIL pixel diff against WP-16.F sheets (`~/Desktop/wp16f-contact-sheets.zip`); included `252/252` captures (named defect states + pixel diff `> 0.5%`), wrote `index.txt`/`index.json`, and zipped to `~/Desktop/wp16g-contact-sheets.zip`.
- [implemented] `tests/e2e/wp16-g-census.spec.ts`: printed full D-G census report (`42` states, `252` captures, `0` zero-pair relations, `0` violations across all 21 relations, 7 type roles + `control-label`, 6 canaries, 12 defect tests).
- [implemented] `docs/audits/register.yml`: updated `20261106-UX-170`..`UX-181` to `status: partial` with note `"awaiting L review"` (`UX-157`..`UX-169` remain `partial` `"awaiting L review"`).
- [implemented] Visually inspected captured G3 sheets via `read_file` and recorded remaining visual deviations for L review (no silent `"fixed"` claims; WP-17 not started).

## 2. CI Evidence

- PR `#221` merged to `main` at `4c6cd7084a9d2187987283634175ad3a3e1893bb`.
- PR `#221` checks: `CI & Audit Conformance Gate` (`success`), `Playwright End-to-End Suite` (`success`), `CodeQL (JavaScript / TypeScript)` (`success`), `Gitleaks Secret & Credential Scan` (`success`), `Detect Changed Scope` (`success`).
- `main` push CI run `44719415329`.

## 3. Tests Added and Count Change

- Added selective G3 pixel-diff capture harness (`CAPTURE_G3_SHEETS=1`) in `tests/e2e/wp16-c-contact-sheets.spec.ts` (`+0` default Playwright test count change).
- Verified `wp16-g-census.spec.ts` (`19 passed`, `0` zero-pair relations, `0` violations).

## 4. Files Touched

- `docs/INDEX.md`
- `docs/audits/register.yml`
- `docs/doc-registry.json`
- `docs/execution-reports/A146-wp-16g-g2-pages-and-flows.md`
- `tests/e2e/wp16-c-contact-sheets.spec.ts`
- `tests/e2e/wp16-g-census.spec.ts`

## 5. Register and Backlog Changes

- `docs/audits/register.yml`: `20261106-UX-170`..`UX-181` set to `status: partial` (`"awaiting L review"`).

## 6. Not Done (Tagged)

- [not-started] Closure of `20261106-UX-157`..`UX-181` awaiting L review of `~/Desktop/wp16g-contact-sheets.zip` and remaining observed visual deviations (`lp-sr-only` spans on Setup Step 3, `Suggested roles` legacy dot & vertical `Accept`/`Ignore` stack in Editor Settings, centered Level next-step text button, faint grey background on `#btn-toggle-recovery` in Login).

## 7. Changes to Earlier Reports

None.

## 8. Receipt Gate Self-Validation

```
$ pnpm receipt:check A147
=== Validating Receipt A147-wp-16g-g3-pixel-diff-and-closure.md ===

✓ [HEADER-CHECK] Mandatory headers verified (6/6 present).
✓ [ANCESTOR-CHECK] Evidence SHA '4c6cd7084a9d2187987283634175ad3a3e1893bb' is an ancestor of HEAD.
✓ [FILES-TOUCHED] Matches git diff a8268f2aaf795aa2ea80e548f55b7920c2277c5b..4c6cd7084a9d2187987283634175ad3a3e1893bb (6 files verified).
✓ [SECTIONS-CHECK] Mandatory sections 1 through 9 verified for A147-wp-16g-g3-pixel-diff-and-closure.md.

🎉 All receipt checks PASSED for A147-wp-16g-g3-pixel-diff-and-closure.md.
```

## 9. Handover Decision
- Decision: RECOMMENDED
- Rule(s): HO-R3
- Receipts since last handover: 131 (per triage counter); work packages since: 0
- Clean-boundary preconditions: WP-16.G complete; WP-17 not started (awaiting L review of `~/Desktop/wp16g-contact-sheets.zip`).
- Next action: L reviews `~/Desktop/wp16g-contact-sheets.zip` and closes `20261106-UX-157`..`UX-181` before `WP-17`.
