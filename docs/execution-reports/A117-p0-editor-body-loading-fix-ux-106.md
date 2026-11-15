# A117 — P0 Editor body loading fix (UX-106)

| Field | Value |
| --- | --- |
| Report ID | A117 |
| Date | 2026-11-15 |
| Author | A (Implementer) |
| Task ID | `P0-editor-body` (PR #160) |
| Evidence SHA | `337d107` |
| CI run | `43716967813` (CI & Audit Conformance Gate), `43716967817` (Secret Scan) on `main` |

---

## 1. Scope

1. `[implemented]` **Reproduced & fixed P0 empty-body bug on `/admin/entries/:id` (`apps/web/src/pages/admin/entries/editor.ts`, `apps/web/src/pages/admin/entries/history.ts`)**: `renderDedicatedEditorPage` and `renderEntryHistoryPage` checked `clientOrRepo?.entries?.get` before `clientOrRepo?.getEntry` (hitting `Map.prototype.get` on `InMemoryPortfolioRepository` and returning the raw `Entry` without `currentRevision.body_md`), and `mapRawEditorEntry(e)` was called without `rev` (ignoring `e.revision?.body_md`). Fixed by checking `typeof clientOrRepo?.getEntry === 'function'` first, adding `e.revision`/`e.currentRevision` fallback in `mapRawEditorEntry`, and merging `selectedEntry` from `getEntry`.
2. `[implemented]` **Failing-first Playwright E2E test (`tests/e2e/wp16-p0-editor-body.spec.ts`)**: Opens `"Distributed Webhook Coordination with Redis Locks"` on `/admin/entries/:id`, asserts `#ref-field-body` equals `revision.body_md`, clicks Save without changes, and verifies `currentRevision.body_md` is unchanged.
3. `[implemented]` **Register & plan mapping (`docs/audits/register.yml`, `docs/plans/P004-ux-remediation-work-packages.md`, `docs/plans/gates.json`)**: Registered `20261106-UX-106` (P0) and transitioned to `fixed`.

---

## 2. CI Evidence

*Note: All durations below are wall-clock minutes/seconds (the GitHub Actions `billable` field returns `0` for this repository).*

- `main` push CI & Audit Conformance Gate (`43716967813`): `success` — wall-clock job durations: `Detect Changed Scope` 7s (0.12m), `Typecheck, Unit, Security Regression, DCO & Audit Gate` 2m13s (2.22m), `Playwright End-to-End Suite` 2m28s (2.47m).
- `main` push Secret Scan (`43716967817`): `success` — wall-clock duration: 13s (0.22m).
- Local verification: `pnpm exec playwright test tests/e2e/wp16-p0-editor-body.spec.ts` failed before the fix (`Received: ""`) and passed after (`1 passed (1.8s)`); `pnpm verify` passed all 15 gates (`local output`).

---

## 3. Tests Added and Count Change

- Added `tests/e2e/wp16-p0-editor-body.spec.ts` (1 Playwright E2E test).
- Existing tests removed: **None** (0 removed).

---

## 4. Files Touched

- `apps/web/src/pages/admin/entries/editor.ts`
- `apps/web/src/pages/admin/entries/history.ts`
- `docs/INDEX.md`
- `docs/audits/register.yml`
- `docs/doc-registry.json`
- `docs/execution-reports/A116-wp-16pre-g-close-dependabot-alert-5.md`
- `docs/plans/P004-ux-remediation-work-packages.md`
- `docs/plans/gates.json`
- `tests/e2e/wp16-p0-editor-body.spec.ts`

---

## 5. Register and Backlog Changes

- `20261106-UX-106` (P0): registered `open` -> `fixed` (verified by `tests/e2e/wp16-p0-editor-body.spec.ts`).

---

## 6. Not Done (Tagged)

- `[not-started]` `WP-16.R` Minimal Visual Reset (`R0`–`R4`).

---

## 7. Changes to Earlier Reports

- None.

---

## 8. Receipt Gate Self-Validation

```
$ pnpm receipt:check A117 --offline
=== Validating Receipt A117-p0-editor-body-loading-fix-ux-106.md ===

✓ [HEADER-CHECK] Mandatory headers verified (6/6 present).
✓ [ANCESTOR-CHECK] Evidence SHA '337d107' is an ancestor of HEAD.
✓ [FILES-TOUCHED] Matches git diff dc3d4e0..337d107 (9 files verified).
✓ [SECTIONS-CHECK] Mandatory sections 1 through 9 verified for A117-p0-editor-body-loading-fix-ux-106.md.
Found 0 section(s) marked verbatim.

🎉 All receipt checks PASSED for A117-p0-editor-body-loading-fix-ux-106.md.
```

---

## 9. Handover Decision
- Decision: RECOMMENDED
- Rule(s): HO-R3
- Receipts since last handover: 3 (A115..A117); work packages since: 0
- Clean-boundary preconditions: met
- Next action: `WP-16.R` `R0` (amend `docs/design/foundations.md` and `P004` with `D-MIN`, register findings, write failing style-census test).
