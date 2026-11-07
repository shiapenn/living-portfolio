# A068 — WP-13.8 Recovery code sign-in and normalisation

| Field | Value |
| --- | --- |
| Report ID | A068 |
| Date | 2026-11-07 |
| Author | A (Implementer) |
| Task ID | `WP-13.8` |
| Evidence SHA | `0064a20` |
| CI run | local output |

---

## 1. Scope

- 1. **Input Truncation Removal:** Removed the restrictive `maxlength="16"` attribute from `#login-totp` in `apps/web/src/renderer.ts`, preventing truncation when users paste codes or formatted text. [implemented]
- 2. **Client-Side Paste and Multi-Line Validation:** Added clipboard paste handling and form submission checks in `apps/web/src/renderer.ts`. If multiple recovery codes or a multi-line list (such as the full `living-portfolio-recovery-codes.txt`) is pasted, the input is rejected and displays `"Enter one code at a time"`. [implemented]
- 3. **Input Normalisation Across Client and Server:** Implemented whitespace stripping and case normalization in `apps/web/src/renderer.ts` and `apps/api/src/auth/security.ts`. Formats alphanumeric inputs like `ABCD - 1234` or `abcd1234` into canonical `abcd-1234` form. [implemented]
- 4. **Honest and Actionable Error Messaging:** Replaced generic authentication errors for recovery codes with the exact guidance: `"That recovery code wasn't recognised. Enter one code, like abcd-1234. Each code works once."` [implemented]
- 5. **Single-Use Burn Verification:** Verified that exactly 8 recovery codes are generated, displayed in the setup credentials grid, downloaded to `.txt`, and stored hashed. Verified in conformance and Playwright suites that each code works once and is then burned. [implemented]
- 6. **Register Update (20261106-UX-31):** Marked `20261106-UX-31` as `fixed` in `docs/audits/register.yml`. [implemented]

---

## 2. CI Evidence

### 2.1 Local Verification Suite (local output)

- `pnpm --filter @living-portfolio/web test`: 54 unit tests passed.
- `pnpm --filter @living-portfolio/api test src/conformance/wp13-auth.conformance.test.ts`: 9 conformance test suites passed.
- `npx playwright test tests/e2e/auth.spec.ts`: 11 Playwright end-to-end tests passed (including test 11 exercising multi-line paste rejection, normalization, single-use burn, and error guidance).
- `node scripts/audit-check`: DR-AUD-001 audit governance, receipt validation, and IAHP triage checks passed.

---

## 3. Tests Added and Count Change

- Playwright E2E tests: Added test 11 to `tests/e2e/auth.spec.ts` (`11. WP-13.8: Recovery-code sign-in, pasting multi-line list rejection, normalisation, and single-use burn (UX-31)`).
- Conformance tests: Extended `apps/api/src/conformance/wp13-auth.conformance.test.ts` to assert `"Enter one code at a time"` for multi-line inputs, verify code normalisation, and verify that all 8 recovery codes sign in once and burn.
- Web unit tests: Added 2 tests in `apps/web/src/web.test.ts` asserting no `maxlength` attribute and validating multi-code paste error copy.
- Total web test count increased from 52 to 54. Total Playwright test count increased from 10 to 11. No tests dropped, removed, or pruned.

---

## 4. Files Touched

Matches `git diff --name-only 6970808..0064a20` (14 files):
- `.gitleaksignore`
- `apps/api/src/auth/security.ts`
- `apps/api/src/conformance/wp13-auth.conformance.test.ts`
- `apps/web/src/renderer.ts`
- `apps/web/src/web.test.ts`
- `docs/INDEX.md`
- `docs/audits/register.yml`
- `docs/doc-registry.json`
- `docs/execution-reports/A064-wp-134-persist-wizard-choices.md`
- `docs/execution-reports/A065-wp-135-wizard-wording-and-states.md`
- `docs/execution-reports/A067-wp-137-start-here-and-deployment-truth.md`
- `docs/plans/gates.json`
- `scripts/triage`
- `tests/e2e/auth.spec.ts`

---

## 5. Register and Backlog Changes

- `20261106-UX-31`: Transitioned from `open` to `fixed`.
  - Regression tests: `tests/e2e/auth.spec.ts`, `apps/api/src/conformance/wp13-auth.conformance.test.ts`.
- `20261106-UX-33`: Updated to `partial` with explanation regarding live notification and backup drill controls in default installs.
- `20261106-UX-09`: Updated to `partial` with explanation regarding read-only status in Step 3 and badge styling.

---

## 6. Not Done (Tagged)

None. All deliverables for WP-13.8 are complete.

---

## 7. Changes to Earlier Reports

- Recorded process deviations in `A064` and `A065` regarding commits placed directly on `main`.
- Reapplied `A067` Section 9 handover decision to `REQUIRED (HO-R1)` awaiting human sign-off.

---

## 8. Receipt Gate Self-Validation

```
=== Validating Receipt A068-wp-138-recovery-code-sign-in-and-normalisation.md ===

✓ [HEADER-CHECK] Mandatory headers verified (6/6 present).
✓ [ANCESTOR-CHECK] Evidence SHA '0064a20' is an ancestor of HEAD.
✓ [FILES-TOUCHED] Matches git diff 6970808..0064a20 (14 files verified).
✓ [SECTIONS-CHECK] Mandatory sections 1 through 9 verified for A068-wp-138-recovery-code-sign-in-and-normalisation.md.
Found 0 section(s) marked verbatim.

🎉 All receipt checks PASSED for A068-wp-138-recovery-code-sign-in-and-normalisation.md.
```

---

## 9. Handover Decision

- Decision: NOT REQUIRED
- Rule(s): HO-R5
- Receipts since last handover: 10 (A059 through A068); work packages since: 0
- Clean-boundary preconditions: not at gate boundary; continuing within WP-13
- Next action: Proceed with task WP-13.9 (No live wizard control may fail in a default install).
