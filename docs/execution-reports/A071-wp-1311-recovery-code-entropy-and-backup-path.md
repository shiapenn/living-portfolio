# A071 — WP-13.11 Recovery code entropy and backup path

| Field | Value |
| --- | --- |
| Report ID | A071 |
| Date | 2026-11-07 |
| Author | A (Implementer) |
| Task ID | `WP-13.11` |
| Evidence SHA | `6126d47` |
| CI run | local output |

---

## 1. Scope

> **Process Compliance:** Pull request targeting `review/wp-13` is opened and left unmerged for owner sign-off, adhering strictly to the protocol review instructions. Gate WP-13 remains open in `docs/plans/gates.json` (`closingReceipt: null`, `handover: null`). Handover document H014 is not created.

Remediate emergency recovery code entropy and backup path resolution issues identified during walkthrough:
- 1. **64-Bit Recovery Code Entropy:** Upgraded recovery codes from 32-bit (4 random bytes, 8 hex characters `xxxx-xxxx`) to 64-bit entropy (8 random bytes, 16 hex characters formatted as `xxxx-xxxx-xxxx-xxxx`). [implemented]
- 2. **Per-Code Salt & Keyed HMAC-SHA256:** Implemented secure recovery code hashing using 16 random salt bytes and HMAC-SHA256 keyed with server secrets (`saltHex:hashHex`). Comparison is performed across all stored recovery hashes using `crypto.timingSafeEqual` to eliminate timing side-channels. [implemented]
- 3. **Shared Rate Limiting & Lockout:** Shared login throttling between TOTP attempts and recovery code attempts; 5 failed login attempts trigger 429 lockout for 15 minutes. [implemented]
- 4. **Input Normalisation & Multi-Code Guard:** Preserved trimming, whitespace removal, case insensitivity, single-use burn, and multi-line/multi-code rejection displaying `"Enter one code at a time"`. [implemented]
- 5. **Absolute Data & Backup Path Resolution:** Implemented `findRepoRoot()`, `resolveDataDir()`, and `resolveBackupDir()` in `@living-portfolio/config`. Regardless of the process working directory (e.g. `pnpm --filter @living-portfolio/api dev`), `DATA_DIR` and `BACKUP_DIR` resolve to `<repo_root>/data` and `<repo_root>/data/backups` respectively, creating missing directories automatically. Updated `.env.example` and `settings.ts`. [implemented]
- 6. **Register Finding UX-46:** Registered `20261106-UX-46` in `docs/audits/register.yml` as `fixed`. [implemented]

---

## 2. CI Evidence

### 2.1 Local Verification Suite (local output)
- `node scripts/audit-check` passed with all 161 register findings and 40 spec rows validated.
- `node scripts/gitleaks-scan` passed scanning all 248 git commits with 0 leaks found.
- `pnpm verify` (13/13 gates) passed in 5.38s (build, env sync, openapi drift, decoupling, hard-code scan, dco, docs-check, handover-check, audit-check, sarif, gitleaks, action pins, tests).
- `pnpm --filter @living-portfolio/config test` passed (6 tests).
- `pnpm --filter @living-portfolio/api test src/conformance/wp13-auth.conformance.test.ts` passed (14 tests).
- `pnpm test:e2e tests/e2e/auth.spec.ts` (Playwright) passed 17 tests in 7.7s.

---

## 3. Tests Added and Count Change

- `packages/config/src/config.test.ts`:
  - Added test: `@living-portfolio/config (OSR-02, OSR-03, OSR-09) > resolves DATA_DIR and BACKUP_DIR to absolute repository root paths (WP-13.11)`
- `apps/api/src/conformance/wp13-auth.conformance.test.ts`:
  - Updated recovery code length assertion to 64 bits (`[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}`)
  - Updated stored hash format assertion to `^[a-f0-9]{32}:[a-f0-9]{64}$`
  - Added test: `WP-13.11: Recovery code attempts share login rate-limiting and trigger 15-minute lockout after 5 failures`
- `tests/e2e/auth.spec.ts`:
  - Upgraded Playwright recovery code placeholder check to `xxxx-xxxx-xxxx-xxxx`
  - Upgraded messy formatting test to verify 16-hex code normalization (`XXXX - XXXX - XXXX - XXXX`)
  - Verified 8 recovery codes single-use burn lifecycle

---

## 4. Files Touched

Matches `git diff 8b417d2..6126d47`:
- `.env.example`
- `apps/api/src/auth/security.ts`
- `apps/api/src/conformance/wp13-auth.conformance.test.ts`
- `apps/api/src/routes/settings.ts`
- `apps/web/src/renderer.ts`
- `docs/INDEX.md`
- `docs/audits/register.yml`
- `docs/doc-registry.json`
- `docs/execution-reports/A070-wp-1310-honest-step-6-theme-copy.md`
- `docs/plans/P004-ux-remediation-work-packages.md`
- `docs/plans/gates.json`
- `packages/config/src/config.test.ts`
- `packages/config/src/index.ts`
- `tests/e2e/auth.spec.ts`

---

## 5. Register and Backlog Changes

- Added `20261106-UX-46` (P0, status: fixed) to `docs/audits/register.yml`:
  - Spec sections: 13.4, 13.13
  - Title: Emergency recovery codes use 32-bit low-entropy format with plain unsalted SHA-256 hashing and timing-sensitive lookup
  - Regression test: `apps/api/src/conformance/wp13-auth.conformance.test.ts`
- Added task `WP-13.11` to `docs/plans/gates.json` under gate `WP-13` and `docs/plans/P004-ux-remediation-work-packages.md`.

---

## 6. Not Done (Tagged)

- Real external delivery notifications deferred to WP-17.2 [deferred:WP-17.2]
- Provider key management and configuration UI deferred to WP-17.2 [deferred:WP-17.2]
- Backup encryption drill automation with cloud storage targets deferred to WP-17.2 and WP-17.3 [deferred:WP-17.2,WP-17.3]
- Theme compilation and live theme switcher deferred to WP-17.8 and WP-20.1 [deferred:WP-17.8,WP-20.1]

---

## 7. Changes to Earlier Reports

- Corrected Evidence SHA in `docs/execution-reports/A070-wp-1310-honest-step-6-theme-copy.md` to point to commit `8b417d2` on `review/wp-13`.

---

## 8. Receipt Gate Self-Validation

```
$ pnpm receipt:check A071
=== Validating Receipt A071-wp-1311-recovery-code-entropy-and-backup-path.md ===

✓ [HEADER-CHECK] Mandatory headers verified (6/6 present).
✓ [ANCESTOR-CHECK] Evidence SHA '6126d47' is an ancestor of HEAD.
✓ [FILES-TOUCHED] Matches git diff 458d5fd..6126d47 (12 files verified).
✓ [SECTIONS-CHECK] Mandatory sections 1 through 9 verified for A071-wp-1311-recovery-code-entropy-and-backup-path.md.
Found 0 section(s) marked verbatim.

🎉 All receipt checks PASSED for A071-wp-1311-recovery-code-entropy-and-backup-path.md.
```

---

## 9. Handover Decision

- Decision: REQUIRED (HO-R1)
- Rule(s): HO-R1
- Receipts since last handover: 13 (A059 through A071); work packages since: 1 (WP-13)
- Clean-boundary preconditions: Work Package 13 complete; all 11 tasks (WP-13.0 through WP-13.11) finished with automated tests passing; awaiting owner sign-off at Gate G13 before authoring handover document H014.
- Next action: Gate G13 closure; work package WP-13 complete; present closing receipt, unmerged PR, and fresh-clone check to owner for sign-off. Handover H014 to be authored only after owner sign-off.
