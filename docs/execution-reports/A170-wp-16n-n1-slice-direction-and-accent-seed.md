# A170 — wp-16n-n1-slice-direction-and-accent-seed

| Field | Value |
| --- | --- |
| Report ID | A170 |
| Date | 2026-11-23 |
| Author | A (Implementer) |
| Task ID | `WP-16.N N0/N1 (partial slice)` |
| Evidence SHA | `abb5395` |
| CI run | 45130057335 |

---

## 1. Scope

Partial delivery of `WP-16.N`. WP-16.N is **not closed**; N2 to N5 were not started.

- [implemented] Integrity check of PR #267 (see section 2).
- [implemented] `D-N1` decision recorded: `docs/adr/ADR-007-public-direction-quiet-editorial-neutral.md`; ADR-001 amended; `docs/design/explorations/index.md` is the only exploration record.
- [implemented] Deleted Strata and Field Notebook packs together with the whole direction lab (`packages/ui-public/src/directions`, `/_lab/public/*` routes, M contact-sheet spec). The lab banner and direction switcher went with it; no lab route remains.
- [implemented] `D-N2` generator and contract: `packages/ui-core/src/accent/accent.ts` (OKLCH ramp, delta-E 2000, AA validation, `user-theme` layer CSS builder, content-hashed file name), `accent.seed` and listed overrides in `packs/core.json`, `docs/design/accent-contract.md`, 9 new unit tests.
- [implemented] Baseline numbers: `docs/design/audit-delta-wp16n.md`.
- [implemented] Backlog: `WP-16.N` added, `P-4` and `P-5` added as not in scope for WP-16, `P-1` closed, `P-2` and `WP-17.1` depend on `WP-16.N`, `WP-17.4` configures the accent seed for both languages.
- [not-started] Everything else in `D-N1` (neutral ramp, fonts, CJK, public restyle), `D-N2` runtime wiring, `D-N3`, `D-N4`, `D-N5` evidence.
- [implemented] No protocol deviation; no ruleset bypass was used for this PR.

### Component statement (required when touching UI; D-J)

- [implemented] No new or changed UI element; code was removed (direction lab) and a pure generator added. No `data-c` component added or changed.

## 2. CI Evidence

- PR #268 head `abb5395`: CI & Audit Conformance Gate run `45130057335` (typecheck/unit job `137543255673` success 2m2s, Playwright shards 1 to 4 success, `Playwright End-to-End Suite` `137544428732` success), CodeQL run `45130057310` (job `137543255295` success 1m26s), gitleaks run `45130057425` (job `137543255827` success).
- Local `pnpm verify`: 16/16 PASSED (local output).

### Integrity finding: how PR #267 merged

- [implemented] Merge commit `2b64ea5`, head `56738a8`, merged `2026-11-23T06:42:15Z` by the repository owner through the normal merge, no auto-merge.
- Ruleset `main-gates` (id 25530940): enforcement `active`, `bypass_actors` empty. Required checks: Typecheck/Unit/DCO/Audit, Gitleaks, Playwright End-to-End Suite, CodeQL.
- On head `56738a8` at merge time all four were green: Typecheck `137528516793` (06:40:05Z), Gitleaks `137528466361` (06:38:01Z), CodeQL `137528471292` (06:39:31Z), Playwright End-to-End Suite `137529542216` (06:41:00Z, pull_request run `45125398498`). A second green `Playwright End-to-End Suite` `137529752207` (06:41:34Z) came from `workflow_dispatch` run `45125240549` on the same head.
- A superseded duplicate pull_request run `45125393208` was cancelled and shows one failed `Playwright End-to-End Suite` `137528473871` (06:38:01Z, cancelled run); it was replaced by run `45125398498`.
- Conclusion: no ruleset bypass and no admin merge are recorded. The dispatch run was not needed to satisfy the required checks, since the pull_request run was itself green. Limit: the API does not expose a per-merge bypass flag; the conclusion rests on the empty bypass list, the active enforcement and the green required checks before merge. No protocol deviation recorded.

### handover:verify H017

- [implemented] `pnpm handover:verify H017` halts on non-docs drift between Evidence SHA `dff335a` and HEAD. This is the known drift exception (H017 baseline superseded in the protocol revision history), unchanged, and was not treated as a new halt.

## 3. Tests Added and Count Change

- [implemented] `packages/ui-core/src/accent/accent.test.ts`: 9 tests (round trip, contrast, seed rejection, override, hashed file, pack contract). Removed `directions.test.ts` and the M contact-sheet spec with their code. ui-core went from 2 to 11 tests (computed from vitest output).

## 4. Files Touched

The checker diffs from the previous receipt's Evidence SHA (`673b716`), so the list also contains the files of PR #267 (merged `2b64ea5`) that landed after A169. This PR's own changes are listed in `git diff 2b64ea5..abb5395` (22 files).

- `.dependency-cruiser.cjs`
- `.githooks/pre-push`
- `.github/CODEOWNERS`
- `.github/pull_request_template.md`
- `.github/workflows/ci.yml`
- `apps/api/src/conformance/wp11-accessibility.conformance.test.ts`
- `apps/api/src/conformance/wp11-markdown-tokens.conformance.test.ts`
- `apps/api/src/conformance/wp12-strata-craft.conformance.test.ts`
- `apps/web/package.json`
- `apps/web/src/app.ts`
- `apps/web/src/client/admin-entry.ts`
- `apps/web/src/client/admin/tiptap-editor.ts`
- `apps/web/src/client/commit-entry.ts`
- `apps/web/src/client/publish-dialog.ts`
- `apps/web/src/components/entry-card.ts`
- `apps/web/src/components/slots.ts`
- `apps/web/src/components/strata-timeline.ts`
- `apps/web/src/layouts/public-shell.ts`
- `apps/web/src/pages/admin/gallery.ts`
- `apps/web/src/pages/public/ask-status.ts`
- `apps/web/src/pages/public/ask.ts`
- `apps/web/src/pages/public/book.ts`
- `apps/web/src/pages/public/build.ts`
- `apps/web/src/pages/public/entries-index.ts`
- `apps/web/src/pages/public/entry.ts`
- `apps/web/src/pages/public/home.ts`
- `apps/web/src/pages/public/not-found.ts`
- `apps/web/src/pages/public/timeline.ts`
- `apps/web/src/primitives/foundations-gallery.ts`
- `apps/web/src/primitives/gallery.ts`
- `apps/web/src/styles.ts`
- `apps/web/src/tokens/index.ts`
- `apps/web/src/web.test.ts`
- `docs/INDEX.md`
- `docs/adr/ADR-001-two-design-languages.md`
- `docs/adr/ADR-002-scale-rules-and-packs.md`
- `docs/adr/ADR-003-governance-modes-and-floors.md`
- `docs/adr/ADR-004-spacing-taxonomy-and-tiers.md`
- `docs/adr/ADR-005-token-tiers-and-closure.md`
- `docs/adr/ADR-006-self-selecting-backlog.md`
- `docs/adr/ADR-007-public-direction-quiet-editorial-neutral.md`
- `docs/audits/2026-11-design-system-architecture-audit.md`
- `docs/design/README.md`
- `docs/design/accent-contract.md`
- `docs/design/audit-delta-wp16n.md`
- `docs/design/components.json`
- `docs/design/decisions.md`
- `docs/design/explorations/index.md`
- `docs/design/tokens-exceptions.json`
- `docs/design/tokens.md`
- `docs/doc-registry.json`
- `docs/execution-reports/A169-wp-16l-l4-pixel-diff-and-closure.md`
- `docs/plans/backlog.yml`
- `docs/plans/execution-protocol.md`
- `package.json`
- `packages/db/src/dual-write.test.ts`
- `packages/db/src/postgres.test.ts`
- `packages/db/src/repository.conformance.test.ts`
- `packages/db/src/test-db.ts`
- `packages/design-tokens/generate.mjs`
- `packages/design-tokens/packs/admin.json`
- `packages/design-tokens/packs/core.json`
- `packages/design-tokens/packs/public.json`
- `packages/design-tokens/src/core.css`
- `packages/design-tokens/src/generated.ts`
- `packages/design-tokens/src/index.ts`
- `packages/design-tokens/src/public.css`
- `packages/design-tokens/src/rules.test.ts`
- `packages/design-tokens/src/tokens.css`
- `packages/design-tokens/tokens.json`
- `packages/ui-admin/package.json`
- `packages/ui-admin/src/admin.test.ts`
- `packages/ui-admin/src/bundle.ts`
- `packages/ui-admin/src/index.ts`
- `packages/ui-admin/src/primitives/button/button.css`
- `packages/ui-admin/src/primitives/button/button.gallery.ts`
- `packages/ui-admin/tsconfig.json`
- `packages/ui-core/package.json`
- `packages/ui-core/src/accent/accent.test.ts`
- `packages/ui-core/src/accent/accent.ts`
- `packages/ui-core/src/core.test.ts`
- `packages/ui-core/src/index.ts`
- `packages/ui-core/src/layers.css`
- `packages/ui-core/src/primitives/accessibility/accessibility.css`
- `packages/ui-core/src/primitives/accessibility/accessibility.gallery.ts`
- `packages/ui-core/src/primitives/accessibility/accessibility.ts`
- `packages/ui-core/src/primitives/layout/layout.css`
- `packages/ui-core/src/primitives/layout/layout.gallery.ts`
- `packages/ui-core/src/primitives/layout/layout.ts`
- `packages/ui-core/src/theme/theme.ts`
- `packages/ui-core/tsconfig.json`
- `packages/ui-public/package.json`
- `packages/ui-public/src/bundle.ts`
- `packages/ui-public/src/components/shell/shell.css`
- `packages/ui-public/src/components/shell/shell.gallery.ts`
- `packages/ui-public/src/components/shell/shell.ts`
- `packages/ui-public/src/index.ts`
- `packages/ui-public/src/public.test.ts`
- `packages/ui-public/tsconfig.json`
- `playwright.config.ts`
- `pnpm-lock.yaml`
- `scripts/backlog-next`
- `scripts/capture-sheets-parallel`
- `scripts/changed-states`
- `scripts/generate-decisions`
- `scripts/generate-registry`
- `scripts/triage`
- `scripts/verify-all`
- `scripts/verify-css-variables`
- `scripts/verify-design-boundaries`
- `scripts/verify-fast`
- `tests/e2e/census-helpers.ts`
- `tests/e2e/public-states-manifest.ts`
- `tests/e2e/states-manifest.ts`
- `tests/e2e/wp11-markdown-tokens-layout.spec.ts`
- `tests/e2e/wp16-f-census.spec.ts`
- `tests/e2e/wp16-g-census.spec.ts`
- `tests/e2e/wp16-h-census.spec.ts`
- `tests/e2e/wp16-i-census.spec.ts`
- `tests/e2e/wp16-j-census.spec.ts`
- `tests/e2e/wp16-k-census.spec.ts`
- `tests/e2e/wp16-l-census.spec.ts`
- `tests/e2e/wp16-m-public-census.spec.ts`

## 5. Register and Backlog Changes

- `docs/plans/backlog.yml`: see section 1. No change to `docs/audits/register.yml`.

## 6. Not Done (Tagged)

- [not-started] N2: styles.ts (5644 lines) migration and route-group CSS split.
- [not-started] N3: fonts, neutral editorial pack, 192 public inline styles, STATES.public completion, Chinese sample.
- [not-started] N4: ADR migration, rules.md, health, ds:impact, change-sets, architecture fitness.
- [not-started] N5: censuses, pixel diff, performance numbers, contact-sheet zip.
- [not-started] `D-N2` runtime wiring (serving `accent.<hash>.css`, both packs mapping to it) and `D-N3` token cleanup.
- [partial] Reason: the package is several days of work and cannot honestly be finished inside the 90 minute target; stopping at a green, mergeable slice.

## 7. Changes to Earlier Reports

None. The `#267` report statement about a workflow_dispatch resolution is clarified in section 2 rather than edited.

## 8. Receipt Gate Self-Validation
```
$ pnpm receipt:check A170
=== Validating Receipt A170-wp-16n-n1-slice-direction-and-accent-seed.md ===

✓ [HEADER-CHECK] Mandatory headers verified (6/6 present).
✓ [ANCESTOR-CHECK] Evidence SHA 'abb5395' is an ancestor of HEAD.
✓ [FILES-TOUCHED] Matches git diff 673b7161a99fb508b921ba8f8ca01fac35bfbc2f..abb5395 (123 files verified).
✓ [SECTIONS-CHECK] Mandatory sections 1 through 9 verified for A170-wp-16n-n1-slice-direction-and-accent-seed.md.
Found 0 section(s) marked verbatim.

🎉 All receipt checks PASSED for A170-wp-16n-n1-slice-direction-and-accent-seed.md.
```

## 9. Handover Decision
- Decision: RECOMMENDED
- Rule(s): HO-R3
- Receipts since last handover: 154 (per triage counter); work packages since: 2
- Clean-boundary preconditions: met
- Next action: continue WP-16.N at N1 remainder and N2 on a new branch; WP-17 stays blocked until WP-16.N closes.
