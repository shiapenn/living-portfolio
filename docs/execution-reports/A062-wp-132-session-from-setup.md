# A062 — WP-13.2 Session from setup

| Field | Value |
| --- | --- |
| Report ID | A062 |
| Date | 2026-11-07 |
| Author | A (Implementer) |
| Task ID | `WP-13.2` |
| Evidence SHA | `8f9ca3d` |
| CI run | local output |

---

## 1. Scope

- 1. **Session Issuance upon TOTP Confirmation:** Updated `POST /auth/totp/confirm` and `confirmTotpSetup()` in `apps/api/src/auth/security.ts` to instantiate an authenticated `AdminSession`, set the `lp_session` cookie (`HttpOnly; SameSite=Strict; Path=/; Max-Age=43200`), and return session payload containing `authenticated: true`, `username`, and `csrfToken`. [implemented]
- 2. **Wizard Client Session Storage & CSRF Token:** Enhanced setup wizard confirmation handler in `apps/web/src/renderer.ts` to record `csrfToken` into `sessionStorage` (`lp_csrf_token`), enabling subsequent `apiClient` requests to carry `X-CSRF-Token` headers alongside browser session cookies. [implemented]
- 3. **Bearer Token Removal from Setup Wizard (D-12):** Removed API bearer token display from the setup completion banner in `apps/web/src/renderer.ts`, aligning with Decision D-12 that API tokens belong exclusively in Settings › Account › Developer access. [implemented]
- 4. **Client SDK Support:** Added `confirmTotp` method and `AuthConfirmTotpResponse` interface to `@living-portfolio/client`, enabling typed client interactions with the TOTP confirmation route. [implemented]
- 5. **Register Closure (20261106-UX-28):** Marked `20261106-UX-28` as `fixed` in `docs/audits/register.yml`. [implemented]

---

## 2. CI Evidence

### 2.1 Local Verification Suite (local output)

- `pnpm --filter @living-portfolio/api test src/conformance/wp13-auth.conformance.test.ts`: Passed (verifies `POST /auth/totp/confirm` issues `lp_session` cookie and CSRF token, and authorized subsequent requests to `/api/settings/notifications/test` return 501 instead of 401).
- `pnpm --filter @living-portfolio/api test`: 336 tests passed across 40 test files.
- `pnpm --filter @living-portfolio/web test`: 43 tests passed.
- `npx playwright test tests/e2e/auth.spec.ts`: 6 tests passed (asserts bearer token is absent in wizard, owner is logged in after confirmation, and Step 4 notification test alert succeeds without 401 Unauthorized).
- `node scripts/audit-check`: All 160 entries parsed, fixed findings verified, and triage gate passed.

---

## 3. Tests Added and Count Change

- Conformance tests added: 1 test in `apps/api/src/conformance/wp13-auth.conformance.test.ts` (`Wizard completion issues lp_session cookie and csrfToken`). Targeted increment focused specifically on session cookie issuance and CSRF propagation, without dropping, removing, or pruning any existing tests.
- Total `apps/api` test count increased from 335 to 336 tests across 40 test files (1 new test).
- E2E tests: Extended `tests/e2e/auth.spec.ts` test 1 verifying absence of bearer token and successful execution of Step 4 notification delivery test alert without 401 Unauthorized.

---

## 4. Files Touched

Matches `git diff --name-only 50b37aa..8f9ca3d` (10 files):
- `apps/api/src/auth/security.ts`
- `apps/api/src/conformance/wp13-auth.conformance.test.ts`
- `apps/web/src/renderer.ts`
- `docs/INDEX.md`
- `docs/audits/register.yml`
- `docs/doc-registry.json`
- `docs/execution-reports/A061-wp-131-real-authenticator-enrolment.md`
- `packages/client/src/client.ts`
- `packages/client/src/types.ts`
- `tests/e2e/auth.spec.ts`

---

## 5. Register and Backlog Changes

- `20261106-UX-28`: Transitioned from `open` to `fixed`.
  - Regression test: `apps/api/src/conformance/wp13-auth.conformance.test.ts`.

---

## 6. Not Done (Tagged)

None. All deliverables for WP-13.2 are complete.

---

## 7. Changes to Earlier Reports

None. Reports A001 through A061 remain immutable.

---

## 8. Receipt Gate Self-Validation

```
=== Validating Receipt A062-wp-132-session-from-setup.md ===

✓ [HEADER-CHECK] Mandatory headers verified (6/6 present).
✓ [ANCESTOR-CHECK] Evidence SHA '8f9ca3d' is an ancestor of HEAD.
✓ [FILES-TOUCHED] Matches git diff 50b37aa..8f9ca3d (10 files verified).
✓ [SECTIONS-CHECK] Mandatory sections 1 through 9 verified for A062-wp-132-session-from-setup.md.
Found 0 section(s) marked verbatim.

🎉 All receipt checks PASSED for A062-wp-132-session-from-setup.md.
```

---

## 9. Handover Decision

- Decision: NOT REQUIRED
- Rule(s): HO-R5
- Receipts since last handover: 3 (A060, A061, A062); work packages since: 0
- Clean-boundary preconditions: met
- Next action: continue with task WP-13.3 (credentials screen)
