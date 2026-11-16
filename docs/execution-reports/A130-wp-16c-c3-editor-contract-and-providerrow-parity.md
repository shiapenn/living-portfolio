# A130 — WP-16.C C3: Editor Contract and ProviderRow Parity

| Field | Value |
| --- | --- |
| Report ID | A130 |
| Date | 2026-11-16 |
| Author | A (Implementer) |
| Task ID | `WP-16.C C3` |
| Evidence SHA | `b269b74355847b7ecb69e4c48605da400fc896b7` |
| CI run | 43856696491 |

---

## 1. Scope

Executed `WP-16.C` `C3` (Editor contract, mobile toolbars, and `ProviderRow` parity):
- [implemented] Editor contract (`D-COMP #10` in `editor-toolbar.ts`, `editor-page.ts`, `containers.ts`, `styles.ts`, `tokens/index.ts`): `#ref-field-title.lp-editor-title-input` set to `24px / 32px` borderless; `.lp-admin-shell-main-full .lp-page-notice-slot { min-height: 0; }` removes the blank band between the top bar and toolbar; `Source` converted to an icon button (`icon: 'source'`, tooltip `"Markdown source"`, hidden on `<640px` and exposed in `#ref-more-menu` as `#ref-more-source`); `<640px` top toolbar stays one row and `.lp-editor-toolbar-center` docks above the virtual keyboard using `window.visualViewport` (`--vv-bottom`, removed when `0px`).
- [implemented] `ProviderRow` parity (`D-COMP #9` in `apps/web/src/components/provider-row.ts`, `setup.ts`, `providers.ts`, `settings-script.ts`): extracted shared `renderProviderRow` used by both Setup Step 3 (`mode: 'table-row'`, read-only) and Settings > Providers (`mode: 'item'`, editable for external providers).
  Differences between Settings > Providers and Setup Step 3 identified and closed:
  1. Missing providers list when `ctx.providers` was empty -> Closed: Settings > Providers now renders the full `WIZARD_STRINGS.step3.providersTable.rows` (`Local ONNX`, `OpenAI Compatible`, `Anthropic`) merged with live `ctx.providers` state, instead of an empty-state fallback.
  2. Missing data-class badges and model IDs -> Closed: `renderProviderRow` displays the same data-class `renderChip` badges (`public`, `confidential`, `public only`) and `<code>` model identifier in both Setup Step 3 and Settings > Providers.
  3. Missing write-only API key input and `"Test key"` action -> Closed: Settings > Providers renders a write-only `<input type="password" value="" autocomplete="new-password">` (never echoing stored secrets) and a secondary `"Test key"` button wired to `/api/settings/providers/test` in `settings-script.ts`.
  4. Ad hoc section/button markup -> Closed: Settings > Providers now uses `renderFormSection` and `renderActionBar` matching `D-COMP #4` and `#9`.
- [implemented] Shrunk `docs/audits/dcomp-census-budget.json` `pageHeaderViolations` from `12` to `0` (`8/8` `D-COMP` checks at `0` violations).

## 2. CI Evidence

- PR `#186` merged to `main` at `b269b74355847b7ecb69e4c48605da400fc896b7`.
- `main` push CI run `43856696491` (`CI & Audit Conformance Gate`): `success`.
- `pnpm verify`: 15/15 gates passed.
- `pnpm test:e2e`: `wp16-c-component-census.spec.ts` (`0/8` violations) and `wp16-r-style-census.spec.ts` (`0/16` violations) passed.

## 3. Tests Added and Count Change

- Updated `tests/e2e/wp15-7-editor-reference-page.spec.ts` (`:not(.lp-mobile-only-menu-item)` on desktop More menu count check).
- Net test count change: 0 added, 0 removed.

## 4. Files Touched

- `apps/web/src/client/admin/editor-page.ts`
- `apps/web/src/client/containers.ts`
- `apps/web/src/components/index.ts`
- `apps/web/src/components/provider-row.ts`
- `apps/web/src/pages/admin/entries/editor-toolbar.ts`
- `apps/web/src/pages/admin/settings-script.ts`
- `apps/web/src/pages/admin/setup.ts`
- `apps/web/src/settings/modules/providers.ts`
- `apps/web/src/styles.ts`
- `apps/web/src/tokens/index.ts`
- `docs/INDEX.md`
- `docs/audits/dcomp-census-budget.json`
- `docs/doc-registry.json`
- `docs/execution-reports/A129-wp-16c-c2-page-and-overlay-migrations.md`
- `tests/e2e/wp15-7-editor-reference-page.spec.ts`

## 5. Register and Backlog Changes

None (`UX-126`..`UX-139` remain `open` until `WP-16.C C4` contact sheets and final verification).

## 6. Not Done (Tagged)

- [not-started] `WP-16.C C4`: Capture contact sheets at `1280px` and `320px` (`light` and `dark`, plus editor at `1920px`), zip to `~/Desktop/wp16c-contact-sheets.zip`, self-review every sheet, and transition `UX-126`..`UX-139` to `fixed`.

## 7. Changes to Earlier Reports

None.

## 8. Receipt Gate Self-Validation

```
$ pnpm receipt:check A130
=== Validating Receipt A130-wp-16c-c3-editor-contract-and-providerrow-parity.md ===

✓ [HEADER-CHECK] Mandatory headers verified (6/6 present).
✓ [ANCESTOR-CHECK] Evidence SHA 'b269b74355847b7ecb69e4c48605da400fc896b7' is an ancestor of HEAD.
✓ [FILES-TOUCHED] Matches git diff 3f9288d8de7829846bf0335e83b6ae2b52781914..b269b74355847b7ecb69e4c48605da400fc896b7 (15 files verified).
✓ [SECTIONS-CHECK] Mandatory sections 1 through 9 verified for A130-wp-16c-c3-editor-contract-and-providerrow-parity.md.
✓ [CI-LOG-CHECK] CI run 43856696491 verified on GitHub (conclusion: success).

🎉 All receipt checks PASSED for A130-wp-16c-c3-editor-contract-and-providerrow-parity.md.
```

## 9. Handover Decision
- Decision: RECOMMENDED
- Rule(s): HO-R3
- Receipts since last handover: 114 (per triage counter); work packages since: 0
- Clean-boundary preconditions: met (`WP-16.C` in progress; `H018` deferred until `WP-16.C` gate closure)
- Next action: proceed to `WP-16.C C4` (contact sheets, self-review, and register closure).
