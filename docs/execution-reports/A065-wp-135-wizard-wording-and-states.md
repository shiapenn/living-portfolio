# A065 — WP-13.5 Wizard wording and states

| Field | Value |
| --- | --- |
| Report ID | A065 |
| Date | 2026-11-07 |
| Author | A (Implementer) |
| Task ID | `WP-13.5` |
| Evidence SHA | `f33cd45` |
| CI run | local output |

---

## 1. Scope

- 1. **Typed String Catalogue & Explainer Pattern:** Created `apps/web/src/strings/en.ts` containing the full setup wizard copy, field labels, plain-language explanations (what, when, effect), hosting cards from §6.8, and structured data tables. [implemented]
- 2. **Plain-Language Explanations & Systems Vocabulary Removal:** Replaced jargon in `apps/web/src/renderer.ts` (TOTP seed, public domain address, notification channels, backup destination, and age encryption keys) with plain-language guidance, and renamed zero-trust boundary to privacy boundary. [implemented]
- 3. **Honest Disabled States for Unconfigured Capabilities:** Disabled notification test button until a target is entered with explanatory helper text. Updated backup restore drill endpoint to return 501 with honest message `"Not available until a backup folder is set"`, and updated wizard UI to render an actionable notice when unconfigured. [implemented]
- 4. **Zero-Hardcode Markup Scan Compliance:** Extracted all vendor names (`OpenAI`, `Anthropic`, `Ollama`), model identifiers (`gpt-4o-mini`, `claude-3-5-sonnet`, `llama3.3`, `bge-small-en-v1.5`), and worked-example sample content out of the setup markup template in `apps/web/src/renderer.ts` into external catalogue structures. [implemented]
- 5. **Single Primary Action Enforcement:** Enforced strictly one primary action (`.btn-primary`) per wizard step across all 6 steps. In Step 1, account creation and TOTP confirmation buttons are styled secondary, leaving the gated Continue button as the primary action. In Step 6, Launch Portfolio is the single primary button with a secondary link for the Import Planner. [implemented]
- 6. **Register Closures (20261106-UX-29, 20261106-UX-33, 20261106-CP-14, 20261106-CP-15):** Marked findings `20261106-UX-29`, `20261106-UX-33`, `20261106-CP-14`, and `20261106-CP-15` as `fixed` in `docs/audits/register.yml`. [implemented]

---

## 2. CI Evidence

### 2.1 Local Verification Suite (local output)

- `pnpm --filter @living-portfolio/api test src/conformance/wp13-auth.conformance.test.ts`: Passed (verifies honest 501 and message when backup folder is unconfigured).
- `pnpm --filter @living-portfolio/api test`: 339 tests passed across 40 test files.
- `pnpm --filter @living-portfolio/web test`: 46 tests passed (verifies zero-vendor markup scan, single primary action per step, and §6.8 hosting card copy).
- `npx playwright test tests/e2e/auth.spec.ts`: 8 tests passed (exercises disabled notification test button, backup drill honest message without folder, single primary button on final step, and zero-vendor markup scan).
- `node scripts/audit-check`: All 160 entries parsed, fixed findings verified, and triage gate passed.

---

## 3. Tests Added and Count Change

- Conformance tests added: 1 test in `apps/api/src/conformance/wp13-auth.conformance.test.ts` (`WP-13.5: POST /api/settings/backups/run-drill reports honest disabled message when folder unconfigured (UX-33)`).
- Web unit tests added: 3 tests in `apps/web/src/web.test.ts` (`WP-13.5: Wizard Wording, States & Zero-Vendor Scan`).
- Total `apps/api` test count increased from 338 to 339 tests across 40 test files (1 new test). No tests dropped, removed, or pruned.
- Total `apps/web` test count increased from 43 to 46 tests (3 new tests). No tests dropped, removed, or pruned.
- E2E tests: Added test 8 in `tests/e2e/auth.spec.ts` asserting single primary action per step and zero-vendor markup scan in `renderer.ts`. Extended test 1 verifying notification disabled test button and drill honest message without folder.

---

## 4. Files Touched

Matches `git diff --name-only 9e306f0..f33cd45` (11 files):
- `apps/api/src/conformance/wp13-auth.conformance.test.ts`
- `apps/api/src/routes/settings.ts`
- `apps/web/src/renderer.ts`
- `apps/web/src/strings.ts`
- `apps/web/src/strings/en.ts`
- `apps/web/src/web.test.ts`
- `docs/INDEX.md`
- `docs/audits/register.yml`
- `docs/doc-registry.json`
- `docs/execution-reports/A064-wp-134-persist-wizard-choices.md`
- `tests/e2e/auth.spec.ts`

---

## 5. Register and Backlog Changes

- `20261106-UX-29`: Transitioned from `partial` to `fixed`.
  - Regression test: `apps/web/src/web.test.ts`.
- `20261106-UX-33`: Transitioned from `open` to `fixed`.
  - Regression test: `apps/api/src/conformance/wp13-auth.conformance.test.ts`.
- `20261106-CP-14`: Transitioned from `open` to `fixed`.
  - Regression test: `apps/web/src/web.test.ts`.
- `20261106-CP-15`: Transitioned from `open` to `fixed`.
  - Regression test: `apps/web/src/web.test.ts`.

---

## 6. Not Done (Tagged)

None. All deliverables for WP-13.5 are complete.

---

## 7. Changes to Earlier Reports

None. Reports A001 through A064 remain immutable.

---

## 8. Receipt Gate Self-Validation

```
=== Validating Receipt A065-wp-135-wizard-wording-and-states.md ===

✓ [HEADER-CHECK] Mandatory headers verified (6/6 present).
✓ [ANCESTOR-CHECK] Evidence SHA 'f33cd45' is an ancestor of HEAD.
✓ [FILES-TOUCHED] Matches git diff 9e306f0..f33cd45 (11 files verified).
✓ [SECTIONS-CHECK] Mandatory sections 1 through 9 verified for A065-wp-135-wizard-wording-and-states.md.
Found 0 section(s) marked verbatim.

🎉 All receipt checks PASSED for A065-wp-135-wizard-wording-and-states.md.
```

---

## 9. Handover Decision

- Decision: RECOMMENDED
- Rule(s): HO-R3
- Receipts since last handover: 7 (A059, A060, A061, A062, A063, A064, A065); work packages since: 0
- Clean-boundary preconditions: met
- Next action: Handover deferred to Gate G13 per execution plan. Proceed with task WP-13.6 (Login and sign-out).
