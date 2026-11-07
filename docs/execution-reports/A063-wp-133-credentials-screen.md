# A063 — WP-13.3 Credentials screen

| Field | Value |
| --- | --- |
| Report ID | A063 |
| Date | 2026-11-07 |
| Author | A (Implementer) |
| Task ID | `WP-13.3` |
| Evidence SHA | `6ce8df0` |
| CI run | local output |

---

## 1. Scope

- 1. **Server-Side Recovery Codes Generation:** Implemented `generateRecoveryCodes()` in `apps/api/src/auth/security.ts` generating 8 single-use alphanumeric codes (`xxxx-xxxx`). Stored SHA-256 hashes in `AdminAccount.recoveryCodeHashes` on setup, returning plaintext codes once in setup response. [implemented]
- 2. **Single-Use Recovery Code Authentication:** Updated `authenticateLogin()` in `apps/api/src/auth/security.ts` to accept recovery codes when TOTP verification fails, verify against stored SHA-256 hashes, burn the matched hash immediately from account state, and persist state. Rejected subsequent login attempts with burned codes. [implemented]
- 3. **Designed Credentials Presentation:** Replaced inline completion text in setup wizard (`apps/web/src/renderer.ts`) with a structured `#credentials-display-container` displaying the Base32 authenticator key, an 8-code recovery grid, plain-language security guidance, and interactive Copy Key, Copy All, and .txt download buttons. [implemented]
- 4. **Gate Checkbox Enforcement:** Implemented `#setup-saved-credentials-gate` checkbox gating the single primary navigation action `#btn-continue-step2`, ensuring Continue remains disabled until the operator acknowledges saving recovery codes. [implemented]
- 5. **Register Closure (20261106-UX-30):** Marked finding `20261106-UX-30` as `fixed` in `docs/audits/register.yml`, and recorded `partial` progress for `20261106-UX-29` (competing buttons resolved in Step 1). [implemented]

---

## 2. CI Evidence

### 2.1 Local Verification Suite (local output)

- `pnpm --filter @living-portfolio/api test src/conformance/wp13-auth.conformance.test.ts`: Passed (verifies 8 recovery codes generated, hashes stored, and single-use login with burning).
- `pnpm --filter @living-portfolio/api test`: 337 tests passed across 40 test files.
- `pnpm --filter @living-portfolio/web test`: 43 tests passed.
- `npx playwright test tests/e2e/auth.spec.ts`: 7 tests passed (verifies credentials screen display, gate disabling Continue until checked, recovery codes file download, and single-use login with consumed code rejection).
- `node scripts/audit-check`: All 160 entries parsed, fixed findings verified, and triage gate passed.

---

## 3. Tests Added and Count Change

- Conformance tests added: 1 test in `apps/api/src/conformance/wp13-auth.conformance.test.ts` (`Generates 8 single-use recovery codes during setup; allows sign-in once per code`).
- Total `apps/api` test count increased from 336 to 337 tests across 40 test files (1 new test). No tests dropped, removed, or pruned.
- E2E tests: Extended `tests/e2e/auth.spec.ts` test 1 verifying credentials screen, 8 recovery codes grid, gate checkbox disabling/enabling Continue, and file download. Added test 7 verifying single-use recovery code login and subsequent burned-code rejection.

---

## 4. Files Touched

Matches `git diff --name-only 8f9ca3d..6ce8df0` (9 files):
- `apps/api/src/auth/security.ts`
- `apps/api/src/conformance/wp13-auth.conformance.test.ts`
- `apps/web/src/renderer.ts`
- `docs/INDEX.md`
- `docs/audits/register.yml`
- `docs/doc-registry.json`
- `docs/execution-reports/A062-wp-132-session-from-setup.md`
- `packages/client/src/types.ts`
- `tests/e2e/auth.spec.ts`

---

## 5. Register and Backlog Changes

- `20261106-UX-30`: Transitioned from `open` to `fixed`.
  - Regression test: `apps/api/src/conformance/wp13-auth.conformance.test.ts`.
- `20261106-UX-29`: Recorded `partial` progress in history (eliminated competing login button after account creation in Step 1).

---

## 6. Not Done (Tagged)

None. All deliverables for WP-13.3 are complete.

---

## 7. Changes to Earlier Reports

None. Reports A001 through A062 remain immutable.

---

## 8. Receipt Gate Self-Validation

```
=== Validating Receipt A063-wp-133-credentials-screen.md ===

✓ [HEADER-CHECK] Mandatory headers verified (6/6 present).
✓ [ANCESTOR-CHECK] Evidence SHA '6ce8df0' is an ancestor of HEAD.
✓ [FILES-TOUCHED] Matches git diff 8f9ca3d..6ce8df0 (9 files verified).
✓ [SECTIONS-CHECK] Mandatory sections 1 through 9 verified for A063-wp-133-credentials-screen.md.
Found 0 section(s) marked verbatim.

🎉 All receipt checks PASSED for A063-wp-133-credentials-screen.md.
```

---

## 9. Handover Decision

- Decision: NOT REQUIRED
- Rule(s): HO-R5
- Receipts since last handover: 4 (A060, A061, A062, A063); work packages since: 0
- Clean-boundary preconditions: met
- Next action: continue with task WP-13.4 (persist wizard choices)
