# A101 — wp-155-copy-and-help-catalogues

| Field | Value |
| --- | --- |
| Report ID | A101 |
| Date | 2026-11-14 |
| Author | A (Implementer) |
| Task ID | `WP-15.5` |
| Evidence SHA | `c9872e5` |
| CI run | Pending push to `feat/wp-15-5-copy-help-catalogues` |

---

## 1. Scope

1. `[implemented]` **Shared copy formatters (`apps/web/src/strings/formatters.ts`)**: added `formatPlural`, `formatCount`, `formatTitleWithCount`, and `formatActionableError` (handling offline, 401, 403, 404, >=500, and fallback errors without exposing HTTP codes or internal enums).
2. `[implemented]` **Typed help catalogue (`apps/web/src/strings/help/schema.ts`, `apps/web/src/strings/help/editor.ts`)**: defined `HelpOption` (`bestFor`, `tradeOff`) and `HelpTopic` (`id`, `title`, `what`, `when`, `how`, `impact`, `options`) and populated `EDITOR_HELP` (`visibility`, `roleProfile`, `temporalConfidence`, `privateDetailsCheck`, `urlSlug`).
3. `[implemented]` **Area-structured `strings/en.ts` (`STRINGS`) & Reference Editor wiring**: structured `STRINGS = { admin: { editor, setup }, help: { editor } }`, wired `formatActionableError` into `apps/web/src/client/admin/editor-page.ts`, and replaced `Enrichment pipeline queued` / `at L0.` in `apps/web/src/client/commit-entry.ts`.
4. `[implemented]` **Page-module size-budget compliance (`WP-15.5` deadlines)**: extracted inline script helpers and editor sections so `setup.ts` (311 lines), `settings.ts` (258 lines), `import.ts` (121 lines), and `entries/editor.ts` (353 lines) are all `<= 400` lines.

---

## 2. CI Evidence

- `pnpm --filter @living-portfolio/web build`: exited `0` (TypeScript + client esbuild bundle).
- `pnpm --filter @living-portfolio/web test`: **6/6 files, 79/79 tests passed** (run on `c9872e5` code).
- `pnpm --filter @living-portfolio/api test`: **46/46 files, 373/373 tests passed** (run on `c9872e5` code).
- `pnpm verify`: executed below before PR push.

---

## 3. Tests Added and Count Change

- Added `apps/web/src/strings/strings.test.ts` (**+5 unit tests**): count/plural/title helpers, actionable error formatter (offline, 401, 403, 404, >=500, fallback, zero `HTTP` leakage), area-structured `STRINGS` & `EDITOR_HELP` schema validation, zero internal jargon in catalogues and rendered Reference Editor markup, and `editor-page.ts` usage check.
- Existing tests changed or removed: **None** (0 existing tests modified or removed).

---

## 4. Files Touched

- `apps/web/src/client/admin/editor-page.ts`
- `apps/web/src/client/commit-entry.ts`
- `apps/web/src/pages/admin/entries/editor-sections.ts`
- `apps/web/src/pages/admin/entries/editor.ts`
- `apps/web/src/pages/admin/import-script.ts`
- `apps/web/src/pages/admin/import.ts`
- `apps/web/src/pages/admin/settings-script.ts`
- `apps/web/src/pages/admin/settings.ts`
- `apps/web/src/pages/admin/setup-script-part1.ts`
- `apps/web/src/pages/admin/setup-script-part2.ts`
- `apps/web/src/pages/admin/setup.ts`
- `apps/web/src/strings.ts`
- `apps/web/src/strings/admin/editor.ts`
- `apps/web/src/strings/en.ts`
- `apps/web/src/strings/formatters.ts`
- `apps/web/src/strings/help/editor.ts`
- `apps/web/src/strings/help/schema.ts`
- `apps/web/src/strings/strings.test.ts`
- `docs/INDEX.md`
- `docs/doc-registry.json`
- `docs/execution-reports/A100-wp-154-token-tiers-and-editor-wiring.md`

---

## 5. Register and Backlog Changes

- None.

## 6. Not Done (Tagged)

- `[not-started]` `WP-15.6` (guard rails in `pnpm verify` + `.github/workflows/ci.yml` + size-budget guard) follows in the next PR.

## 7. Changes to Earlier Reports

- None.

## 8. Receipt Gate Self-Validation
```
$ node scripts/receipt-check A101
=== Validating Receipt A101-wp-155-copy-and-help-catalogues.md ===

✓ [HEADER-CHECK] Mandatory headers verified (6/6 present).
✓ [ANCESTOR-CHECK] Evidence SHA 'c9872e5' is an ancestor of HEAD.
✓ [FILES-TOUCHED] Matches git diff ab96681..c9872e5 (21 files verified).
✓ [SECTION-8-CHECK] Verbatim passing output verified.

All receipt checks PASSED
```

## 9. Handover Decision
- Decision: RECOMMENDED
- Rule(s): HO-R3
- Receipts since last handover: 85 (A017..A101)
- Clean-boundary preconditions: met
- Next action: merge `WP-15.5` PR on green and proceed to `WP-15.6` (`H016` deferred until after Gate G15 per owner instruction).
