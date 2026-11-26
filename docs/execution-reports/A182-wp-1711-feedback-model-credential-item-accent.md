# A182 — WP-17.11 feedback model credential item accent

| Field | Value |
| --- | --- |
| Report ID | A182 |
| Date | 2026-11-26 |
| Author | A (Implementer) |
| Task ID | `WP-17.11` |
| Evidence SHA | `b2bf7b85eea58b20b5bab1c98025d3dd040e40ca` |
| CI run | pending PR #280 CI |

---

## 1. Scope

WP-17.11 closes the WP-17 exit gate (C1–C5, K1–K5) in one package and one PR:

- [implemented] **C1 (Credential display):** Promoted Setup's recovery-code presentation as one registered component `Credential` (`data-c="Credential"`, `packages/ui-admin/src/components/credential/credential.css`, `apps/web/src/components/credential.ts`, registered in `docs/design/components.json`, gallery sample in `/admin/gallery`). Variants: `single` (wrapping cell with `overflow-wrap: anywhere`, fixing the 320px horizontal overflow on `account-token-created` from 384px to 320px) and `list` (2-column compact / 4-column regular monospace grid). Includes warning `Notice` ("Shown once. Save it now."), manual key grouped in blocks of 4, and one Copy / Copy all button with `"Copied"` `StatusLine`. Used for TOTP manual key, recovery codes, and API token created.
- [implemented] **C2 (Feedback model):** Authored `docs/adr/ADR-025-feedback-placement-and-timing.md` (`R-025-1`..`R-025-4`) and `docs/design/feedback.md` (registered as `L058`/`L059`). Enforced the 9 closed feedback scenarios across Account, Answering, Appearance, Backups, Providers, Visibility, Home, and Pages: inline field errors replacing helper (`aria-invalid` + `aria-describedby` + focus first invalid), full-width danger `Notice` below `ActionBar` in the same section (`aria-live="assertive"`, scrolled into view), non-secret success as `StatusLine` below `ActionBar` (no green `Notice`, cleared when dirty), state-derived warnings directly above `ActionBar`, and Appearance import validation errors mapped to `<= 3` short lines (`"and N more"` if truncated).
- [implemented] **C3 (Item v2):** Replaced D5's 320px stacking rule with a `@container (min-width: 480px)` anatomy on `.lp-list`: compact (`< 480px`) gives row 1 full-width title (clamped to 3 lines in lists), row 2 status + trailing chevron, row 3 description, row 4 atomic meta fields (`overflow-wrap: anywhere`), row 5 actions; regular (`>= 480px`) restores row 1 title + trailing status/chevron. Omitted redundant `StatusLabel` on single-status filtered lists (Inbox Pending/Replied/Declined, Audit Pending/Active/Discarded/Contradictions). Redesigned Contradictions items (`"{Entry A} vs {Entry B}"`, `"N% confidence"`, two quote blocks with entry links above and no `"Entry:"` prefix, `"Run check"` moved to top under tablist, actions **`Keep newer`** and **`Keep both`**). Removed the D5 stacking exemption from `tests/e2e/wp16-c-component-census.spec.ts` and updated `R-024-5`.
- [implemented] **C4 (Accent coverage):** Emitted all derived accent semantic/alias tokens and native `accent-color: var(--accent)` for both light and dark in `packages/ui-core/src/theme/theme-pack.ts` (`buildThemePackCss` & `buildThemePreviewCss`), added link/accent bindings in `packages/ui-admin/src/base/reset-and-typography.css`, and added `/admin/*` middleware in `apps/api/src/adapter/bundled-web.ts` so every admin HTML route serves the active saved `theme.<hash>.css`.
- [implemented] **C5 (Width set 320 / 1280 / 1920):** Extended the census and contact sheets to test and capture `320`, `1280`, and `1920` across all admin routes and required states, verifying that content columns preserve their max-width at `1920px`.

### Component statement (required when touching UI; D-J)

- [implemented] Credential display (`#account-totp-manual-cred`, `#account-recovery-output`, `#account-token-created`, `#gallery-credential-sample`): `data-c="Credential"`, variants `single` and `list` (pre-approved extraction C1; registered in `docs/design/components.json`)
- [implemented] Section feedback notices (`#account-creds-notice`, `#appearance-import-feedback`, `#tier1-warning`): `data-c="Notice"`, variants `danger` and `warn` (registered in `docs/design/components.json`)
- [implemented] Action success status lines (`#settings-status-banner`, `#appearance-import-feedback`, `#account-token-created-copied`): `data-c="StatusLine"`, variant `ok` (registered in `docs/design/components.json`)
- [implemented] Admin list items (Today, Entries, Inbox, Audit, Contradictions, Bookings, Structure, Ventures, Settings index, Account tokens, Status): `data-c="Item"`, Item v2 container-query layout (`compact < 480px`, `regular >= 480px`, `titleClamp2`, atomic `metaFields`, quote segment; registered in `docs/design/components.json`)

## 2. CI Evidence

- `pnpm ds:health --check`: PASSED (Public CSS 4129 B gzip, Fonts 73284 B, Admin CSS 20076 B gzip, Editor JS 139207 B gzip).
- `pnpm wp16n:verify`: PASSED (10/10 DoD checks green; 22 registered components, 0 UI guard violations, 0 inline styles, 0 file-size offenders).
- `pnpm verify:fast`: PASSED in 11.6s (47/47 API conformance files, 381/381 tests).
- `tests/e2e/wp17-9-content-and-ink-census.spec.ts`: 6/6 PASSED, 0 violations (K1–K5 across 132 route captures `320/1280/1920 x light/dark`, 479/480 switch, 320px token overflow, Credential single/list/manual, Feedback scenarios 1/2/3/5, Accent across 3 seeds including loud magenta).
- `40f87ad` detached worktree canary: 6/6 FAILED on base commit `40f87ad` (162 K3 route violations, K3 479/480 switch `172 < 191`, K1 320px token overflow `384 > 320`, K5 missing `Credential`, K2 `belowActionBar: false`, K4 `accentColor=auto`).
- `tests/e2e/wp17-9-self-test-journeys.spec.ts`: 8/8 PASSED (`J1–J8`, with `J3` and `J7` extended to assert `K2`).
- `tests/e2e/wp16-c-component-census.spec.ts`, `wp16-g-census.spec.ts`, `wp16-i-census.spec.ts`: 34/34 PASSED, 0 violations (306 D-G captures, 0 zero-pair relations).
- Contact sheet archive: `~/Desktop/wp17-11-contact-sheets.zip` (85 PNGs + `INDEX.md`, 5.3 MB).

## 3. Tests Added and Count Change

- `tests/e2e/wp17-9-content-and-ink-census.spec.ts`: expanded from 2 tests to 6 independent tests (`K1+K3+Content`, `K3 479/480`, `K1 token 320px`, `K5 Credential`, `K2 Feedback`, `K4 Accent`), +4 E2E tests.
- `tests/e2e/wp17-9-self-test-journeys.spec.ts`: extended `J3` and `J7` to assert `K2` feedback placement and timing (8/8).
- `tests/e2e/wp17-4-account.spec.ts`, `tests/e2e/wp17-8-appearance-v2.spec.ts`, `tests/e2e/wp16-c-component-census.spec.ts`, `tests/e2e/wp16-g-census.spec.ts`: aligned with C1–C4 contracts and removed the D5 stacking exemption.

## 4. Files Touched

- `.changeset/wp17-11-exit-gate-final.md`
- `apps/api/src/adapter/bundled-web.ts`
- `apps/web/src/components/credential.ts` (new)
- `apps/web/src/components/index.ts`
- `apps/web/src/pages/admin/audit.ts`
- `apps/web/src/pages/admin/bookings.ts`
- `apps/web/src/pages/admin/gallery.ts`
- `apps/web/src/pages/admin/inbox.ts`
- `apps/web/src/pages/admin/pages.ts`
- `apps/web/src/pages/admin/settings-script.ts`
- `apps/web/src/primitives/form-section.ts`
- `apps/web/src/primitives/item.ts`
- `apps/web/src/settings/modules/account-script.ts`
- `apps/web/src/settings/modules/account.ts`
- `apps/web/src/settings/modules/answering.ts`
- `apps/web/src/settings/modules/appearance-script.ts`
- `apps/web/src/settings/modules/appearance.ts`
- `apps/web/src/settings/modules/backups.ts`
- `apps/web/src/settings/modules/home.ts`
- `apps/web/src/settings/modules/providers.ts`
- `apps/web/src/settings/modules/visibility.ts`
- `docs/INDEX.md`
- `docs/adr/ADR-024-content-standard.md`
- `docs/adr/ADR-025-feedback-placement-and-timing.md` (new)
- `docs/design/README.md`
- `docs/design/components.json`
- `docs/design/decisions.md`
- `docs/design/feedback.md` (new)
- `docs/design/health-history.json`
- `docs/design/health.md`
- `docs/design/rules.md`
- `docs/doc-registry.json`
- `docs/execution-reports/A181-wp-1710-exit-gate-fixes.md`
- `docs/plans/backlog.yml`
- `docs/plans/wp17-progress.md`
- `packages/ui-admin/CHANGELOG.md`
- `packages/ui-admin/src/base/reset-and-typography.css`
- `packages/ui-admin/src/bundle.ts`
- `packages/ui-admin/src/components/credential/credential.css` (new)
- `packages/ui-admin/src/components/credential/credential.gallery.ts` (new)
- `packages/ui-admin/src/components/feedback/feedback.css`
- `packages/ui-admin/src/components/item/item.css`
- `packages/ui-admin/src/shell/overlay-mobile.css`
- `packages/ui-admin/src/templates/dfinal-system.css`
- `packages/ui-admin/src/templates/dghl-polish.css`
- `packages/ui-core/CHANGELOG.md`
- `packages/ui-core/src/theme/theme-pack.ts`
- `tests/e2e/wp16-c-component-census.spec.ts`
- `tests/e2e/wp16-g-census.spec.ts`
- `tests/e2e/wp17-4-account.spec.ts`
- `tests/e2e/wp17-8-appearance-v2.spec.ts`
- `tests/e2e/wp17-9-content-and-ink-census.spec.ts`
- `tests/e2e/wp17-9-self-test-journeys.spec.ts`
- `tests/e2e/wp17-contact-sheets.spec.ts`

## 5. Register and Backlog Changes

- Added `WP-17.11` in `docs/plans/backlog.yml` before `WP-18.3` (`gate: L-review`, `depends_on: [WP-17.10]`), and updated `WP-18.3` to depend on `WP-17.11`. Did NOT start `WP-18` / `WP-18.3`.
- Registered `ADR-025` (`L058`), `docs/design/feedback.md` (`L059`), and `A182` in `docs/doc-registry.json` and `docs/INDEX.md`.
- Registered `Credential` (`lp-credential`) in `docs/design/components.json` (22 components total).

## 6. Not Done (Tagged)

None.

## 7. Changes to Earlier Reports

- `R-024-5` in `docs/adr/ADR-024-content-standard.md` / `docs/design/rules.md` updated to replace WP-17.9 D5's 320px inline-status rule with WP-17.11 C3 Item v2 (`@container (min-width: 480px)`), and removed the D5 stacking exemption from `tests/e2e/wp16-c-component-census.spec.ts`.

## 8. Receipt Gate Self-Validation
```
$ pnpm receipt:check A182
=== Validating Receipt A182-wp-1711-feedback-model-credential-item-accent.md ===

✓ [HEADER-CHECK] Mandatory headers verified (6/6 present).
✓ [ANCESTOR-CHECK] Evidence SHA 'b2bf7b85eea58b20b5bab1c98025d3dd040e40ca' is an ancestor of HEAD.
✓ [FILES-TOUCHED] Matches git diff 2841a14314ef694f3ce5b19cfe75769951a54e2b..b2bf7b85eea58b20b5bab1c98025d3dd040e40ca (54 files verified).
✓ [SECTIONS-CHECK] Mandatory sections 1 through 9 verified for A182-wp-1711-feedback-model-credential-item-accent.md.
Found 0 section(s) marked verbatim.

🎉 All receipt checks PASSED for A182-wp-1711-feedback-model-credential-item-accent.md.
```

## 9. Handover Decision
- Decision: RECOMMENDED
- Rule(s): HO-R3
- Receipts since last handover: 166; WP-17 exit gate awaiting L-review
- Clean-boundary preconditions: met
- Next action: await L-review of `~/Desktop/wp17-11-contact-sheets.zip` before starting `WP-18.3`.
