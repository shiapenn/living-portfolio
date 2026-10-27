# A032 — WP-5.2 Setup Wizard and Credential Lockdown

| Field | Value |
| --- | --- |
| Report ID | A032 |
| Date | 2026-10-27 |
| Author | A (Implementer) |
| Task ID | `WP-5.2` |
| Evidence SHA | `413d4d4` |
| CI run | https://github.com/shiapenn/living-portfolio/actions/runs/40467379261 |

---

## 1. Scope

- **`[implemented]`** 6-step first-run setup wizard UI (§13.13): Implemented full wizard interface at `/admin/setup` covering: Step 1 (Owner Account Setup with username, password >= 12 chars, TOTP secret generation, QR/secret display, initial PAT registration); Step 2 (Hosting option and presets `hobbyist-docker`, `private-local`, `reliable-low-cost`, and tunnel/origin settings `#setup-origin-url`); Step 3 (Model Providers & Privacy Router table with declared data classes `public`, `internal`, `confidential`, and zero-trust boundary banner); Step 4 (Notification adapter selector and live test delivery button calling `/api/settings/notifications/test`); Step 5 (Encrypted backup destination presets `local-scratch`, `s3-compatible`, `git-export`, age recipient public key field, and test drill button calling `/api/settings/backups/run-drill`); Step 6 (Theme selection for `Editorial Classic`, `Modern Monospace`, `Minimalist Sans`, and first-run walkthrough card with worked profile prompt example).
- **`[implemented]`** Persistent token revocation & account state: Extended `AuthManager` in `apps/api/src/auth/security.ts` to support file-backed persistence via `storagePath` option (and `authStoragePath` in `createApp()`), writing account credentials and bearer token revocation timestamps across reboots.
- **`[implemented]`** Rate-limiting login UX: Enhanced `/admin/login` error handler to present human-readable 429 guidance ("Too many failed login attempts. Try again in 15 minutes.") on rate limit trigger.
- **`[implemented]`** Automated test coverage: Added 2 unit tests in `apps/web/src/web.test.ts` and 3 integration tests in `apps/api/src/api.test.ts`.
- **`[implemented]`** Register governance: Updated `docs/audits/register.yml` transitioning `20261020-UX-01` from `status: partial` to `status: fixed`.

---

## 2. CI Evidence

### 2.1 Commit and PR Provenance
- PR: `#50` (`feat(wp5.2): 6-step setup wizard, credential lockdown & token revocation persistence`)
- Merge Method: Rebase and merge (`origin/main` at `413d4d401f275c4ce1e21e86975e23a76a39b540`)
- Commits landed: `413d4d4` (`feat(wp5.2): 6-step setup wizard, credential lockdown & token revocation persistence (Fix 20261020-UX-01)`)
- Evidence SHA: `413d4d4`
- Ancestor Verification: `git merge-base --is-ancestor 413d4d4 HEAD` exits 0.

### 2.2 Verbatim Vitest Results per Package (Job 122065969073)
```
@living-portfolio/core:test: Test Files  1 passed (1)
@living-portfolio/core:test: Tests  17 passed (17)
@living-portfolio/ai:test: Test Files  1 passed (1)
@living-portfolio/ai:test: Tests  16 passed (16)
@living-portfolio/config:test: Test Files  1 passed (1)
@living-portfolio/config:test: Tests  5 passed (5)
@living-portfolio/web:test: Test Files  1 passed (1)
@living-portfolio/web:test: Tests  26 passed (26)
@living-portfolio/worker:test: Test Files  2 passed (2)
@living-portfolio/worker:test: Tests  12 passed (12)
@living-portfolio/db:test: Test Files  4 passed (4)
@living-portfolio/db:test: Tests  45 passed (45)
@living-portfolio/api:test: Test Files  16 passed (16)
@living-portfolio/api:test: Tests  132 passed (132)
```
*Total: 26 test files, 253 passed tests across 7 packages (computed from the above).*

### 2.3 Verbatim Playwright E2E Results (Job 122065968804)
```
23 passed (14.8s)
```

### 2.4 Verbatim SARIF Static Analysis Baseline Gate (Job 122065968965)
```
✓ [SARIF-GATE] Baseline verified: 0 rule(s) mapped to valid register findings.
[SARIF-GATE] Alerts parsed from SARIF: total = 0, baselined = 0, unbaselined = 0
✓ [SARIF-GATE] Gate PASSED: All 0 CodeQL alert(s) across 1 file(s) are baselined against approved register findings.
```

### 2.5 Verbatim Gitleaks Commit Count & Secret Scan Output (Job 122065968990)
```
1 commits scanned.
scanned ~30732 bytes (30.73 KB) in 181ms
✓ Gitleaks scan passed with 0 leaks.
no leaks found
```

### 2.6 Verbatim DCO Verification Line (Job 122065969073)
```
✓ [OSR-07 DCO] All 1 commit(s) in 3f5c14e2111b1819c42a217e7d7b6cf6b419572a..f3091cefeb6feca8f9587bbc8ade9c9dff47b2d0 carry a valid Signed-off-by trailer.
```

---

## 3. Tests Added and Count Change

- Unit & Conformance (Vitest): 253 tests (+5 new tests compared to A031 count of 248).
  - `apps/web/src/web.test.ts`:
    - `WP-5.2: First-Run 6-Step Setup Wizard, Login Throttling & Lockdown (20261020-UX-01) > 1. renderAdminSetupPage renders all 6 wizard steps, progress indicator, and walkthrough card`
    - `WP-5.2: First-Run 6-Step Setup Wizard, Login Throttling & Lockdown (20261020-UX-01) > 2. renderAdminLoginPage renders credentials form and handles 429 throttling message`
  - `apps/api/src/api.test.ts`:
    - `WP-5.2: Setup Wizard, Credential Lockdown & Token Revocation Persistence (20261020-UX-01) > persists admin account and token revocation across reboots via storagePath`
    - `WP-5.2: Setup Wizard, Credential Lockdown & Token Revocation Persistence (20261020-UX-01) > enforces setup lockdown and 409 Conflict once admin account is configured`
    - `WP-5.2: Setup Wizard, Credential Lockdown & Token Revocation Persistence (20261020-UX-01) > returns human-readable 429 throttling message upon 5 failed attempts`
- Browser Integration (Playwright): 23 tests (all passing).

---

## 4. Files Touched

- apps/api/src/api.test.ts
- apps/api/src/app.ts
- apps/api/src/auth/security.ts
- apps/web/src/renderer.ts
- apps/web/src/web.test.ts
- docs/INDEX.md
- docs/audits/register.yml
- docs/doc-registry.json
- docs/execution-reports/A031-wp5-1-admin-operations-and-killswitch.md

---

## 5. Register and Backlog Changes

- `docs/audits/register.yml`:
  - `20261020-UX-01`: Transitioned `status: partial` -> `status: fixed`.
  - Added historical transition entry dated `2026-10-27`.

---

## 6. Not Done (Tagged)

- **`[not-started]`** Work Package 5.3 (WP-5.3): Multi-tenant database boundary hardening and schema isolation.
- **`[not-started]`** Work Package 5.4 (WP-5.4): Complete Phase 4 verification, end-to-end documentation alignment, and release cut.

---

## 7. Changes to Earlier Reports

- None.

---

## 8. Receipt Gate Self-Validation
```
=== Validating Receipt A032-wp5-2-setup-wizard-and-credential-lockdown.md ===

✓ [HEADER-CHECK] Mandatory headers verified (6/6 present).
✓ [ANCESTOR-CHECK] Evidence SHA '413d4d4' is an ancestor of HEAD.
✓ [FILES-TOUCHED] Matches git diff c3a221c..413d4d4 (9 files verified).
✓ [SECTIONS-CHECK] Mandatory sections 1 through 9 verified for A032-wp5-2-setup-wizard-and-credential-lockdown.md.
Found 5 section(s) marked verbatim.
✓ [VERBATIM-CHECK] Section "2.2 Verbatim Vitest Results per Package (Job 122065969073)" verified against CI logs.
✓ [VERBATIM-CHECK] Section "2.3 Verbatim Playwright E2E Results (Job 122065968804)" verified against CI logs.
✓ [VERBATIM-CHECK] Section "2.4 Verbatim SARIF Static Analysis Baseline Gate (Job 122065968965)" verified against CI logs.
✓ [VERBATIM-CHECK] Section "2.5 Verbatim Gitleaks Commit Count & Secret Scan Output (Job 122065968990)" verified against CI logs.
✓ [VERBATIM-CHECK] Section "2.6 Verbatim DCO Verification Line (Job 122065969073)" verified against CI logs.

🎉 All receipt checks PASSED for A032-wp5-2-setup-wizard-and-credential-lockdown.md.
```

---

## 9. Handover Decision

- Decision: NOT REQUIRED
- Rule(s): HO-R5
- Receipts since last handover: 2 (A031, A032); work packages since: 0
- Clean-boundary preconditions: all tests pass cleanly, 0 static analysis alerts, 0 credential leaks, linear git history with DCO sign-offs.
- Next action: continue with task WP-5.3 under Work Package 5 upon authorization.
