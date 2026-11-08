# A072 — WP-13.12 Legacy recovery notice and regeneration

| Field | Value |
| --- | --- |
| Report ID | A072 |
| Date | 2026-11-07 |
| Author | A (Implementer) |
| Task ID | `WP-13.12` |
| Evidence SHA | `4f10073` |
| CI run | local verify (`pnpm verify`) green (CI runs only on PRs/pushes to main) |

---

## 1. Scope

- **`[implemented]` Legacy notice removal from unauthenticated login:** Removed the `"Legacy 8-character recovery codes from earlier versions continue to be supported"` notice from `/admin/login` (`apps/web/src/renderer.ts`) so fresh installs are not confused and unauthenticated visitors are not informed of account history. Updated Playwright test 15 in `tests/e2e/auth.spec.ts` to assert that `#login-recovery-legacy-notice` does not exist on `/admin/login`.
- **`[implemented]` Admin shell warning for legacy recovery sign-in:** Added an alert banner `#admin-legacy-recovery-notice` in `renderAdminWorkspacePage` with exact text: `"You signed in with an older recovery code. Replace your recovery codes in Settings > Account as soon as you can."`. Server-side rendering in `bundled-web.ts` and `app.ts` as well as client-side session storage track `legacyRecoveryUsed: true` when a legacy-format code authenticates, and suppress the banner when modern 16-hex codes or standard TOTP codes are used.
- **`[implemented]` Recovery code regeneration endpoint:** Implemented `POST /api/auth/recovery-codes/regenerate` in `apps/api/src/auth/security.ts`. Requires an authenticated admin session and CSRF token. Generates 8 fresh 64-bit salted recovery codes, invalidates all prior recovery codes, and saves state. Added option support `{ legacyFormat?: boolean }` for migration test harness simulation.
- **`[implemented]` Settings > Account UI follow-up registration:** Registered follow-up finding `20261106-UX-47` under WP-17.4 in `docs/audits/register.yml` and `docs/plans/P004-ux-remediation-work-packages.md` to track the frontend UI in Settings > Account for owners to interactively regenerate and download new codes.
- **`[implemented]` Register hygiene:** Filled `links.pr` for all fixed findings in WP-13 (`UX-26`, `UX-28`, `UX-30`, `UX-32`, `UX-05`, `UX-31`, `UX-46`) and documented that under DR-AUD-001 rule D.4 / AUD-08, `verified_by` must remain `null` until independent re-audit verification.
- **`[implemented]` Automated verification:** Added unit/conformance tests in `apps/api/src/conformance/wp13-auth.conformance.test.ts` and E2E test 18 in `tests/e2e/auth.spec.ts` asserting that legacy codes trigger the warning banner, modern 16-hex codes do not, legacy codes burn after a single use, and regeneration invalidates prior codes.

---

## 2. CI Evidence

Local run of `pnpm verify` (typecheck, tests, OpenAPI drift, audit-check, and gitleaks-scan):
- `pnpm --filter @living-portfolio/api test src/conformance/wp13-auth.conformance.test.ts`: 18/18 tests PASSED.
- `pnpm test:e2e tests/e2e/auth.spec.ts`: 18/18 tests PASSED.
- `node scripts/audit-check`: PASSED.
- `node scripts/gitleaks-scan`: PASSED (256 commits scanned, 0 leaks found).

---

## 3. Tests Added and Count Change

- Conformance:
  - `apps/api/src/conformance/wp13-auth.conformance.test.ts`:
    - `WP-13.3 Conformance: Credentials Screen & Recovery Codes › WP-13.12: Modern 16-hex recovery code and TOTP sign-in do not flag legacyRecoveryUsed`
    - `WP-13.3 Conformance: Credentials Screen & Recovery Codes › WP-13.12: POST /api/auth/recovery-codes/regenerate invalidates older recovery codes and issues fresh 64-bit salted codes`
- E2E Playwright:
  - `tests/e2e/auth.spec.ts`:
    - Updated Test 15 to assert absence of `#login-recovery-legacy-notice` on `/admin/login` and absence of `#admin-legacy-recovery-notice` on `/admin` after modern 16-hex code sign-in.
    - Test 18: `WP-13.12: Legacy recovery code sign-in shows admin shell notice and burns after one use (UX-46, UX-47)`

---

## 4. Files Touched

- apps/api/src/adapter/bundled-web.ts
- apps/api/src/auth/security.ts
- apps/api/src/conformance/wp13-auth.conformance.test.ts
- apps/web/src/app.ts
- apps/web/src/renderer.ts
- docs/INDEX.md
- docs/audits/register.yml
- docs/doc-registry.json
- docs/execution-reports/A071-wp-1311-recovery-code-entropy-and-backup-path.md
- docs/plans/P004-ux-remediation-work-packages.md
- docs/plans/gates.json
- tests/e2e/auth.spec.ts

---

## 5. Register and Backlog Changes

- Corrected PR links in `docs/audits/register.yml`:
  - Reset `links.pr` back to `null` for findings `UX-26`, `UX-28`, `UX-30`, `UX-32`, and `UX-05`. PRs #68-#71 were erroneously cited from historical WP-10/WP-11 tasks; implementation for WP-13.1 through WP-13.7 was committed on local main and first pushed as `review/wp-13` (no task PRs exist; review PRs started at #76, with PR #80 merged for WP-13.12).
  - Findings fixed in task review PRs on `review/wp-13`: `20261106-UX-31` (PR #76, WP-13.8), `20261106-UX-46` (PR #79, WP-13.11).
  - Findings fixed directly on main: `20261106-UX-29`, `20261106-CP-14`, `20261106-CP-15` (`f33cd45`, `links.pr: null`).
  - Partial findings addressed in task review PRs: `20261106-UX-27` (PR #78, WP-13.10), `20261106-UX-33` & `20261106-UX-09` & `20261106-CP-01` (PR #77, WP-13.9), `20261106-UX-41` (PR #76, WP-13.6/WP-13.8).
- Registered new follow-up finding `20261106-UX-47` (P2, status: open) under WP-17.4 for Settings > Account recovery code regeneration UI.
- Confirmed DR-AUD-001 rule D.4 / AUD-08: `verified_by: null` is mandatory for implementers when claiming `status: fixed`; non-null sign-off is reserved for independent post-audit review.
- Added `WP-13.12` to `docs/plans/gates.json` under gate `WP-13` and `docs/plans/P004-ux-remediation-work-packages.md`.

---

## 6. Not Done (Tagged)

- Fresh data directory installs generate 64-bit recovery codes directly and are not affected by legacy migration. [implemented]
- Backend recovery code regeneration endpoint `POST /api/auth/recovery-codes/regenerate` is fully implemented and tested. [implemented]
- Settings > Account interactive UI for regeneration and key management deferred to WP-17.4 (`20261106-UX-47`). [not-started]
- Real external delivery notifications deferred to WP-17.2. [not-started]
- Provider key management and configuration UI deferred to WP-17.2. [not-started]
- Backup encryption drill automation with cloud storage targets deferred to WP-17.2 and WP-17.3. [not-started]
- Theme compilation and live theme switcher deferred to WP-17.8 and WP-20.1. [not-started]

---

## 7. Changes to Earlier Reports

- Corrected Evidence SHA in `docs/execution-reports/A071-wp-1311-recovery-code-entropy-and-backup-path.md` from `3728ba8` to `d8f017d` on `review/wp-13` to resolve the ancestor check after the owner squashed/merged PR #79.
- Updated Evidence SHA in `docs/execution-reports/A072-wp-1312-legacy-recovery-notice-and-regeneration.md` to `4f10073` on `review/wp-13` after PR #80 merge.
- Corrected register entries for `UX-26`, `UX-28`, `UX-30`, `UX-32`, and `UX-05` to set `links.pr: null` and noted they originated from local main and were first pushed on `review/wp-13`.

---

## 8. Receipt Gate Self-Validation

```
$ pnpm receipt:check A072
=== Validating Receipt A072-wp-1312-legacy-recovery-notice-and-regeneration.md ===

✓ [HEADER-CHECK] Mandatory headers verified (6/6 present).
✓ [ANCESTOR-CHECK] Evidence SHA '4f10073' is an ancestor of HEAD.
✓ [FILES-TOUCHED] Matches git diff d8f017d..4f10073 (12 files verified).
✓ [SECTIONS-CHECK] Mandatory sections 1 through 9 verified for A072-wp-1312-legacy-recovery-notice-and-regeneration.md.
Found 0 section(s) marked verbatim.

🎉 All receipt checks PASSED for A072-wp-1312-legacy-recovery-notice-and-regeneration.md.
```
✓ [FILES-TOUCHED] Matches git diff review/wp-13..b775790 (12 files verified).
✓ [SECTIONS-CHECK] Mandatory sections 1 through 9 verified for A072-wp-1312-legacy-recovery-notice-and-regeneration.md.
Found 0 section(s) marked verbatim.

🎉 All receipt checks PASSED for A072-wp-1312-legacy-recovery-notice-and-regeneration.md.
```

---

## 9. Handover Decision

- Decision: REQUIRED (HO-R1)
- Rule(s): HO-R1
- Receipts since last handover: 14 (A059 through A072); work packages since: 1 (WP-13)
- Clean-boundary preconditions: Work Package 13 complete; all 12 tasks (WP-13.0 through WP-13.12) finished with automated tests passing; awaiting owner sign-off at Gate G13 before authoring handover document H014.
- Next action: Gate G13 closure; work package WP-13 complete; present closing receipt, unmerged PR, and fresh-clone check to owner for sign-off. Handover H014 to be authored only after owner sign-off.
