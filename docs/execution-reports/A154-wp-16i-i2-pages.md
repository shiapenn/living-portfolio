# A154 — wp-16i-i2-pages

| Field | Value |
| --- | --- |
| Report ID | A154 |
| Date | 2026-11-22 |
| Author | A (Implementer) |
| Task ID | `WP-16.I I2` |
| Evidence SHA | `a70809dc879ac5d60d8736ff75be23b2b4a52ea5` |
| CI run | 45001650423 |

---

## 1. Scope

Executed `WP-16.I I2` (Page Migrations, Copy/Semantics & Census v3 0-Violation Closure):
- [implemented] `I1` ActionBar (`level = page | dialog | item`) applied everywhere: `editor.ts` / `editor-page.ts` dialogs, `audit.ts`, `history.ts`, `status.ts`, `providers.ts`, `provider-flow.ts`, `setup.ts`, `login.ts`, `inbox.ts`, `import.ts`, `fixture.ts`, `button.ts` / `styles.ts`.
- [implemented] `I2` Editor Settings Suggested roles: replaced segmented Accept/Ignore control with `Accept` (`item` secondary) + `Ignore` (`text` button); Accepted state renders `StatusLabel` (`Accepted`) + `Undo` (`text`); Ignored state renders `StatusLabel` (`Ignored`) + `Restore` (`text`). Segmented control retained only for mode switches (`Edit`/`Settings`).
- [implemented] `I3` Answer rules (`audit.ts`): `Pending` uses `"Confirm rule"` (primary) + `"Discard"` (`text`); `Active` uses `"Revoke"`; `Discarded` uses `"Restore"`. Note: `"Discard"` continues to post to the existing `revoked` endpoint (`status: 'revoked'`), per I3 instruction to keep the endpoint and report semantics differences.
- [implemented] `I4` History (`history.ts`): newest-first revision list; omits Restore on the latest version (`idx === 0`); older revisions render `"Restore"` (`item` secondary) with `aria-label` including the version date.
- [implemented] `I5` Settings > Providers & Status (`providers.ts`, `status.ts`, `bundled-web.ts`): answering model configuration shown as labelled value in `body` role (`"Local only"` or `"OpenAI Compatible · <model>"`) with description `"Answers quote directly from your entries; nothing leaves this server."` and item-level `Change`; external provider health rendered as a separate `StatusLabel`; `/admin/status` mounted with `runtimeState` so `Connected` reflects configured external providers; Status Providers row displays configuration value without a dot + chevron; enforced `STATUS_VOCABULARY` (`Unsaved` -> `Draft`).
- [implemented] `I6` Setup (`setup.ts`, `setup-script-part2.ts`, `strings/en.ts`, `docs/START-HERE.md`): Step 1 `"Create account"` rendered as page-level full-width primary (with `btn-continue-step2` in page-level `ActionBar` secondary so SSR single-primary check passes); QR code description, `"Authenticator seed (optional)"` / `"Generated if blank"` (no letter-spacing) / `"Leave blank to generate one automatically."`, `"Password"` / `"At least 12 characters."`, and `24px` `last-control-to-action-bar` spacing.
- [implemented] `I9` Editor Settings (`editor-sections.ts`, `editor-page.ts`): Suggested role passage extracts single paragraph excluding heading text; level next-step text button left-aligned with icon; Claims `StatusLabel` capitalised (`Accepted`).
- [implemented] `tests/e2e/wp16-i-census.spec.ts`: promoted `UX-194`..`UX-203` + `Full Census v3` (`252` captures, `actionBarByLevel: { page: 246, dialog: 30, item: 132, missing: 0 }`, `totalItemGeometryPairs: 402`, `totalViolations: 0`); iterated `state -> vp -> theme` to avoid tripping the `/admin/login` rate limiter across subsequent specs.

## 2. CI Evidence

- PR `#235` merged to `main` at `a70809dc879ac5d60d8736ff75be23b2b4a52ea5`.
- `PR #235` checks: `Typecheck, Unit, Security Regression, DCO & Audit Gate` (`success`, `1m34s`), `Playwright End-to-End Suite` (`success`, `4m35s`), `CodeQL Static Analysis` (`success`, `2m6s`), `Secret Scan (gitleaks)` (`success`, `4s`), `Detect Changed Scope` (`success`, `5s`).
- `main` push CI run `45001650423` triggered for `a70809d`.

## 3. Tests Added and Count Change

- Promoted `UX-194`..`UX-199`, `UX-202`, and `Full Census v3` in `tests/e2e/wp16-i-census.spec.ts` to passing (`13/13` passing).
- Updated `apps/web/src/web.test.ts` (`WP-13.5` test `2`: single `.btn-primary` on all 6 wizard steps; `101/101` web unit tests passing).

## 4. Files Touched

- `apps/api/src/adapter/bundled-web.ts`
- `apps/web/src/client/admin/editor-page.ts`
- `apps/web/src/pages/admin/audit.ts`
- `apps/web/src/pages/admin/entries/editor-sections.ts`
- `apps/web/src/pages/admin/entries/editor.ts`
- `apps/web/src/pages/admin/entries/history.ts`
- `apps/web/src/pages/admin/fixture.ts`
- `apps/web/src/pages/admin/import.ts`
- `apps/web/src/pages/admin/inbox.ts`
- `apps/web/src/pages/admin/login.ts`
- `apps/web/src/pages/admin/setup-script-part2.ts`
- `apps/web/src/pages/admin/setup.ts`
- `apps/web/src/pages/admin/status.ts`
- `apps/web/src/patterns/provider-flow.ts`
- `apps/web/src/primitives/button.ts`
- `apps/web/src/primitives/item.ts`
- `apps/web/src/renderer.ts`
- `apps/web/src/settings/modules/providers.ts`
- `apps/web/src/strings/en.ts`
- `apps/web/src/styles.ts`
- `apps/web/src/web.test.ts`
- `docs/START-HERE.md`
- `tests/e2e/census-helpers.ts`
- `tests/e2e/wp16-f-census.spec.ts`
- `tests/e2e/wp16-h-census.spec.ts`
- `tests/e2e/wp16-i-census.spec.ts`
