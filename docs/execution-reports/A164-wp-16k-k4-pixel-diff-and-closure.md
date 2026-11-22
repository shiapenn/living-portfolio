# A164 — wp-16k-k4-pixel-diff-and-closure

| Field | Value |
| --- | --- |
| Report ID | A164 |
| Date | 2026-11-23 |
| Author | A (Implementer) |
| Task ID | `WP-16.K K4` |
| Evidence SHA | `3d312a952d36fc871fa4d2eb2f550a297ace36b3` |
| CI run | 45041614991 |

---

## 1. Scope

Executed `WP-16.K K4` (Pixel-Diff Verification, Visual Inspection, Contact Sheets Zip, and Closure):
- [implemented] Compared all `252` captures after K3/K4 tokenization against pre-tokenization `K2` (`61a25147d2aada2b5b222a1553d54b2d12f47fd5`): initial diff caught `.lp-modal-backdrop` scrim drift on `overlay-delete-dialog` and `overlay-publish-dialog` (`rgba(15, 26, 34, 0.45)` vs `rgba(0, 0, 0, 0.5)`); added `--lp-color-surface-modal-backdrop` (`rgba(0, 0, 0, 0.5)`) in `packages/design-tokens/tokens.json` and `apps/web/src/styles.ts`. After fix, `246/246` non-gallery captures had `0.0000%` pixel diff vs `K2`; only the `6` `gallery` captures differed (`#gallery-foundations-tokens` added in K3).
- [implemented] Compared all `252` K4 captures against `WP-16.J` (`cfdca95`) and packaged `~/Desktop/wp16k-contact-sheets.zip` (`144` sheets across `29` states: all `11` required states plus `18` additional states with `> 0.5%` pixel diff vs `J`, with `index.json` and `index.txt` reasons).
- [implemented] Visually inspected rendered sheets (`settings-providers`, `editor-settings`, `answer-rules`, `status`, `history`, `inbox`, `gallery`) before reporting.
- [implemented] Added `CAPTURE_K_ALL=1` capture mode in `tests/e2e/wp16-c-contact-sheets.spec.ts` and updated `docs/audits/register.yml` (`UX-209..UX-212` -> `partial`, awaiting L review).

### Component statement (required when touching UI; D-J)

- [implemented] `.lp-modal-backdrop` (`Overlay`): existing component in `docs/design/components.json`; preserved `rgba(0, 0, 0, 0.5)` via `--lp-color-surface-modal-backdrop` (`packages/design-tokens/tokens.json`), no new component or variant added.

## 2. CI Evidence

- PR `#255` merged to `main` at `3d312a952d36fc871fa4d2eb2f550a297ace36b3`.
- `PR #255` checks: `Typecheck, Unit, Security Regression, DCO & Audit Gate` (`success`, `1m48s`), `Playwright End-to-End Suite` (`success`, `9m1s`), `CodeQL Static Analysis` (`success`, `1m53s`), `Secret Scan (gitleaks)` (`success`, `6s`), `Detect Changed Scope` (`success`, `5s`).

## 3. Tests Added and Count Change

- Added `CAPTURE_K_ALL=1` mode in `tests/e2e/wp16-c-contact-sheets.spec.ts`.
- Verified `wp16-k-census.spec.ts` (`7/7` passed: `item:subsection:compact: 108`, `item:item:compact: 126`, `item:page:compact: 6`, zero `item:*:full`; `orphanTextCountAllStates: 0`, `unownedMarginCountAllStates: 0`), `node scripts/verify-ui-guards` (`109` files, `0` violations), `pnpm verify:css-variables` (`628` tokens, `0` undefined), `pnpm --filter @living-portfolio/design-tokens test` (`2/2`), `pnpm --filter @living-portfolio/web test` (`12` files / `101/101`), `pnpm audit:check`, and `pnpm docs:check`.

## 4. Files Touched

- `apps/web/src/styles.ts`
- `docs/INDEX.md`
- `docs/audits/register.yml`
- `docs/design/tokens.md`
- `docs/doc-registry.json`
- `docs/execution-reports/A163-wp-16k-k3-full-tokenization.md`
- `packages/design-tokens/src/generated.ts`
- `packages/design-tokens/src/tokens.css`
- `packages/design-tokens/tokens.json`
- `tests/e2e/wp16-c-contact-sheets.spec.ts`

## 5. Register and Backlog Changes

- `docs/audits/register.yml`: `20261106-UX-209`, `20261106-UX-210`, `20261106-UX-211`, `20261106-UX-212` updated from `open` to `partial` (awaiting L review of `~/Desktop/wp16k-contact-sheets.zip`).

## 6. Not Done (Tagged)

- `[not-started]` `WP-17`: explicitly excluded per task instruction ("Do not start WP-17. Stop after K4.").

## 7. Changes to Earlier Reports

None.

## 8. Receipt Gate Self-Validation

```
$ pnpm receipt:check A164
=== Validating Receipt A164-wp-16k-k4-pixel-diff-and-closure.md ===

✓ [HEADER-CHECK] Mandatory headers verified (6/6 present).
✓ [ANCESTOR-CHECK] Evidence SHA '3d312a952d36fc871fa4d2eb2f550a297ace36b3' is an ancestor of HEAD.
✓ [FILES-TOUCHED] Matches git diff a9dacd5098fc98fb6982459e6e63243bae24274b..3d312a952d36fc871fa4d2eb2f550a297ace36b3 (10 files verified).
✓ [SECTIONS-CHECK] Mandatory sections 1 through 9 verified for A164-wp-16k-k4-pixel-diff-and-closure.md.
Found 0 section(s) marked verbatim.

🎉 All receipt checks PASSED for A164-wp-16k-k4-pixel-diff-and-closure.md.
```

## 9. Handover Decision

- Decision: RECOMMENDED
- Rule(s): HO-R3
- Receipts since last handover: 148 (per triage counter); work packages since: 0
- Clean-boundary preconditions: met for `WP-16.K` (`K0`–`K4` complete; awaiting L review before `WP-17`).
- Next action: L reviews `~/Desktop/wp16k-contact-sheets.zip` and closes `20261106-UX-209..UX-212`.
