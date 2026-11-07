# A064 — WP-13.4 Persist wizard choices

| Field | Value |
| --- | --- |
| Report ID | A064 |
| Date | 2026-11-07 |
| Author | A (Implementer) |
| Task ID | `WP-13.4` |
| Evidence SHA | `9e306f0` |
| CI run | local output |

---

## 1. Scope

- 1. **Enum Alignment for Presets:** Extended the `PRESET` configuration enums in `packages/config/src/index.ts` and `packages/ai/src/providers/registry.ts` to include `'hobbyist-docker'`, `'private-local'`, and `'reliable-low-cost'`. [implemented]
- 2. **Settings Persistence Endpoints:** Added granular settings update endpoints (`PATCH /settings/hosting`, `PATCH /settings/notifications`, `PATCH /settings/backups`, `PATCH /settings/theme`, and general `PATCH /settings`) in `apps/api/src/routes/settings.ts`. Updated `GET /settings` to retrieve and merge runtime configuration overrides. [implemented]
- 3. **Interactive Form Radio Elements in Web Renderer:** Replaced non-interactive theme cards in `apps/web/src/renderer.ts` with functional radio inputs (`input[name="theme-preset"]`), preserving preset selection attributes and visual selection styles. [implemented]
- 4. **Step-by-Step Settings Persistence in Wizard:** Added `saveStep(stepNum)` and `restoreSettings()` functions to the setup wizard script in `apps/web/src/renderer.ts`. Every step transition persists the current step's inputs via `PATCH /settings`, and the wizard restores saved values upon revisit or page reload. [implemented]
- 5. **Reloadable Wizard Guard in Bundled Web Adapter:** Updated the `/admin/setup` redirect logic in `apps/api/src/adapter/bundled-web.ts` to allow authenticated operators to reload `/admin/setup` during onboarding without premature redirection to `/admin/login`, while locking down `/admin/setup` once `setupWizardCompleted` is finalized. [implemented]
- 6. **Register Closure (20261106-UX-27):** Marked finding `20261106-UX-27` as `fixed` in `docs/audits/register.yml`. [implemented]

---

## 2. CI Evidence

### 2.1 Local Verification Suite (local output)

- `pnpm --filter @living-portfolio/api test src/conformance/wp13-auth.conformance.test.ts`: Passed (verifies settings persistence across PATCH and GET for hosting, notifications, backups, and theme preset).
- `pnpm --filter @living-portfolio/api test`: 338 tests passed across 40 test files.
- `pnpm --filter @living-portfolio/web test`: 43 tests passed.
- `npx playwright test tests/e2e/auth.spec.ts`: 7 tests passed (exercises choices on hosting, notifications, backups, and theme, page reload at Step 5, backward revisit, and final setup completion).
- `node scripts/audit-check`: All 160 entries parsed, fixed findings verified, and triage gate passed.

---

## 3. Tests Added and Count Change

- Conformance tests added: 1 test in `apps/api/src/conformance/wp13-auth.conformance.test.ts` (`Persists wizard choices across steps, reload, and revisit (WP-13.4, 20261106-UX-27)`).
- Total `apps/api` test count increased from 337 to 338 tests across 40 test files (1 new test). No tests dropped, removed, or pruned.
- E2E tests: Extended `tests/e2e/auth.spec.ts` test 1 to configure notification email, select daily backup schedule, select Strata Serif theme, reload at Step 5, navigate back through steps verifying values persist, and complete onboarding.

---

## 4. Files Touched

Matches `git diff --name-only 6ce8df0..9e306f0` (11 files):
- `apps/api/src/adapter/bundled-web.ts`
- `apps/api/src/conformance/wp13-auth.conformance.test.ts`
- `apps/api/src/routes/settings.ts`
- `apps/web/src/renderer.ts`
- `docs/INDEX.md`
- `docs/audits/register.yml`
- `docs/doc-registry.json`
- `docs/execution-reports/A063-wp-133-credentials-screen.md`
- `packages/ai/src/providers/registry.ts`
- `packages/config/src/index.ts`
- `tests/e2e/auth.spec.ts`

---

## 5. Register and Backlog Changes

- `20261106-UX-27`: Transitioned from `open` to `fixed`.
  - Regression test: `apps/api/src/conformance/wp13-auth.conformance.test.ts`.

---

## 6. Not Done (Tagged)

None. All deliverables for WP-13.4 are complete.

---

## 7. Changes to Earlier Reports

None. Reports A001 through A063 remain immutable.

---

## 8. Receipt Gate Self-Validation

```
=== Validating Receipt A064-wp-134-persist-wizard-choices.md ===

✓ [HEADER-CHECK] Mandatory headers verified (6/6 present).
✓ [ANCESTOR-CHECK] Evidence SHA '9e306f0' is an ancestor of HEAD.
✓ [FILES-TOUCHED] Matches git diff 6ce8df0..9e306f0 (11 files verified).
✓ [SECTIONS-CHECK] Mandatory sections 1 through 9 verified for A064-wp-134-persist-wizard-choices.md.
Found 0 section(s) marked verbatim.

🎉 All receipt checks PASSED for A064-wp-134-persist-wizard-choices.md.
```

---

## 9. Handover Decision

- Decision: RECOMMENDED
- Rule(s): HO-R3
- Receipts since last handover: 6 (A059, A060, A061, A062, A063, A064); work packages since: 0
- Clean-boundary preconditions: met
- Next action: Handover deferred to Gate G13 per execution plan. Proceed with task WP-13.5 (Wizard wording and states).
