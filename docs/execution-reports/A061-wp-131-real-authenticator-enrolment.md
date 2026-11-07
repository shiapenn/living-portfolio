# A061 — WP-13.1 Real Authenticator Enrolment

| Field | Value |
| --- | --- |
| Report ID | A061 |
| Date | 2026-11-07 |
| Author | A (Implementer) |
| Task ID | `WP-13.1` |
| Evidence SHA | `50b37aa` |
| CI run | local output |

---

## 1. Scope

- 1. **RFC 4648 Base32 Conversion:** Implemented RFC 4648 Base32 buffer encoding and decoding routines (`hexToBase32`, `base32ToHex`, `bufferToBase32`, `base32ToBuffer`) in `apps/api/src/auth/totp.ts`, ensuring bit-for-bit round trip with the 20-byte hex secrets stored in `AdminAccount`. [implemented]
- 2. **Canonical OTPAuth URI Builder:** Implemented `buildOtpAuthUri()` generating `otpauth://totp/` URIs incorporating configured site issuer, owner username, and Base32 secret. [implemented]
- 3. **Local SVG QR Code Rendering:** Integrated self-contained QR code generation via `qrcode` rendering valid SVG markup locally without external HTTP calls or CDN dependencies. [implemented]
- 4. **Setup Enrolment Interface:** Extended setup wizard Step 1 in `apps/web/src/renderer.ts` to display the rendered QR code SVG and manual Base32 key upon account submission, alongside a 6-digit confirmation code form. [implemented]
- 5. **Confirmation Endpoint (`POST /auth/totp/confirm`):** Implemented verification route and `confirmTotpSetup` method on `AuthManager` requiring one valid TOTP code before `isSetupCompleted()` transitions to true. [implemented]
- 6. **Register Closure (20261106-UX-26):** Marked `20261106-UX-26` as `fixed` in `docs/audits/register.yml` with regression coverage in `wp13-auth.conformance.test.ts`. [implemented]

---

## 2. CI Evidence

### 2.1 Local Verification Suite (local output)

- `pnpm --filter @living-portfolio/api test src/auth/totp.test.ts`: 5 tests passed (Base32 RFC 4648 vectors, 20-byte random round trips, permissive whitespace decoding, OTPAuth URI formatting, local SVG QR generation).
- `pnpm --filter @living-portfolio/api test src/conformance/wp13-auth.conformance.test.ts`: 2 tests passed (Base32/URI generation in `/setup`, code confirmation/rejection in `/totp/confirm`).
- `npx playwright test tests/e2e/auth.spec.ts`: 6 tests passed (Setup wizard displays QR code & manual Base32 key, wrong code fails with recovery message, valid code completes setup and unlocks login).
- `node scripts/audit-check`: All 160 entries parsed, fixed findings verified, and triage gate passed.

---

## 3. Tests Added and Count Change

- Unit tests added: 5 tests in `apps/api/src/auth/totp.test.ts`.
- Conformance tests added: 2 tests in `apps/api/src/conformance/wp13-auth.conformance.test.ts`.
- Total `apps/api` test count increased from 328 to 335 tests across 40 test files (7 new tests).
- E2E tests: Updated `tests/e2e/auth.spec.ts` test 1 verifying QR code display, manual Base32 key, invalid code rejection, and valid code setup completion.

---

## 4. Files Touched

Matches `git diff --name-only 4d6029e..50b37aa` (12 files):
- `apps/api/package.json`
- `apps/api/src/auth/security.ts`
- `apps/api/src/auth/totp.test.ts`
- `apps/api/src/auth/totp.ts`
- `apps/api/src/conformance/wp13-auth.conformance.test.ts`
- `apps/web/src/renderer.ts`
- `docs/INDEX.md`
- `docs/audits/register.yml`
- `docs/doc-registry.json`
- `docs/execution-reports/A060-wp-130-intake-and-registration.md`
- `pnpm-lock.yaml`
- `tests/e2e/auth.spec.ts`

---

## 5. Register and Backlog Changes

- `20261106-UX-26`: Transitioned from `open` to `fixed`.
  - Regression test: `apps/api/src/conformance/wp13-auth.conformance.test.ts`.

---

## 6. Not Done (Tagged)

None. All deliverables for WP-13.1 are complete.

---

## 7. Changes to Earlier Reports

None. Reports A001 through A060 remain immutable.

---

## 8. Receipt Gate Self-Validation

```
=== Validating Receipt A061-wp-131-real-authenticator-enrolment.md ===

✓ [HEADER-CHECK] Mandatory headers verified (6/6 present).
✓ [ANCESTOR-CHECK] Evidence SHA '50b37aa' is an ancestor of HEAD.
✓ [FILES-TOUCHED] Matches git diff 4d6029e..50b37aa (12 files verified).
✓ [SECTIONS-CHECK] Mandatory sections 1 through 9 verified for A061-wp-131-real-authenticator-enrolment.md.
Found 0 section(s) marked verbatim.

🎉 All receipt checks PASSED for A061-wp-131-real-authenticator-enrolment.md.
```

---

## 9. Handover Decision

- Decision: NOT REQUIRED
- Rule(s): HO-R5
- Receipts since last handover: 2 (A060, A061); work packages since: 0
- Clean-boundary preconditions: met
- Next action: continue with task WP-13.2 (session from setup)
