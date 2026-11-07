# A066 — WP-13.6 Login and sign-out

| Field | Value |
| --- | --- |
| Report ID | A066 |
| Date | 2026-11-07 |
| Author | A (Implementer) |
| Task ID | `WP-13.6` |
| Evidence SHA | `ee11061` |
| CI run | local output |

---

## 1. Scope

- 1. **Login 6-Digit Authenticator Explainer (UX-31):** Updated the owner sign-in page in `apps/web/src/renderer.ts` to include `#login-code-label` with `"6-Digit Authenticator Code"` and `#login-code-help` explaining verification codes from authenticator apps (Google Authenticator, 1Password, etc.). [implemented]
- 2. **Recovery Code Path Toggle (UX-31):** Added an interactive `#btn-toggle-recovery` control on `/admin/login` allowing users without their authenticator device to switch the code input mode to accept single-use emergency recovery codes (`xxxx-xxxx`), with explanatory copy and dynamic labels. [implemented]
- 3. **Admin Sign-Out Navigation Control (UX-41):** Added a `#btn-admin-logout` ("Sign out") button to the primary navigation bar in `renderLayout` for authenticated admin workspace pages (`/admin`, `/admin/settings`, `/admin/import`). The control calls `window.apiClient('/api/auth/logout', { method: 'POST' })`, clears client session storage, and redirects the user to `/admin/login`. [implemented]
- 4. **Register Closures (20261106-UX-31, 20261106-UX-41):** Marked `20261106-UX-31` as `fixed` in `docs/audits/register.yml`. Updated `20261106-UX-41` with a partial note recording the admin sign-out implementation while preserving the open status for remaining account management screens scheduled in WP-17.4. [implemented]

---

## 2. CI Evidence

### 2.1 Local Verification Suite (local output)

- `pnpm --filter @living-portfolio/web test`: 48 tests passed (verifies login explainer, recovery toggle markup, and layout sign out button rendering).
- `pnpm --filter @living-portfolio/api test`: 339 tests passed across 40 test files (verifies admin API client conformance, simulated 501s, and auth routes).
- `npx playwright test tests/e2e/auth.spec.ts`: 9 tests passed (exercises 6-digit explainer, recovery code toggle, login with emergency recovery code, header Sign out button click, session revocation, and redirect to login).
- `node scripts/audit-check`: All 160 entries parsed, fixed findings verified, and autonomous triage gate passed.

---

## 3. Tests Added and Count Change

- Web unit tests added: 2 tests in `apps/web/src/web.test.ts` (`WP-13.6: Login and Sign-Out (UX-31, UX-41)`).
- Total `apps/web` test count increased from 46 to 48 tests (2 new tests). No tests dropped, removed, or pruned.
- Total `apps/api` test count maintained at 339 tests across 40 test files.
- E2E tests: Added test 9 in `tests/e2e/auth.spec.ts` exercising login explainer, recovery code toggle mode, sign in with emergency code, header sign-out button, and unauthenticated redirect guard.

---

## 4. Files Touched

Matches `git diff --name-only f33cd45..ee11061` (7 files):
- `apps/web/src/renderer.ts`
- `apps/web/src/web.test.ts`
- `docs/INDEX.md`
- `docs/audits/register.yml`
- `docs/doc-registry.json`
- `docs/execution-reports/A065-wp-135-wizard-wording-and-states.md`
- `tests/e2e/auth.spec.ts`

---

## 5. Register and Backlog Changes

- `20261106-UX-31`: Transitioned from `open` to `fixed`.
  - Regression test: `tests/e2e/auth.spec.ts`.
- `20261106-UX-41`: Status remains `open`, history updated with partial resolution note for admin sign-out control.

---

## 6. Not Done (Tagged)

None. All deliverables for WP-13.6 are complete.

---

## 7. Changes to Earlier Reports

None. Reports A001 through A065 remain immutable.

---

## 8. Receipt Gate Self-Validation

```
=== Validating Receipt A066-wp-136-login-and-sign-out.md ===

✓ [HEADER-CHECK] Mandatory headers verified (6/6 present).
✓ [ANCESTOR-CHECK] Evidence SHA 'ee11061' is an ancestor of HEAD.
✓ [FILES-TOUCHED] Matches git diff f33cd45..ee11061 (7 files verified).
✓ [SECTIONS-CHECK] Mandatory sections 1 through 9 verified for A066-wp-136-login-and-sign-out.md.
Found 0 section(s) marked verbatim.

🎉 All receipt checks PASSED for A066-wp-136-login-and-sign-out.md.
```

---

## 9. Handover Decision

- Decision: RECOMMENDED
- Rule(s): HO-R3
- Receipts since last handover: 8 (A059, A060, A061, A062, A063, A064, A065, A066); work packages since: 0
- Clean-boundary preconditions: met
- Next action: continue with task WP-13.7 (Start-here and deployment truth); handover deferred to Gate G13 closure per protocol.
