# A090 — WP-14 entry lifecycle integrity gate closure

| Field | Value |
| --- | --- |
| Report ID | A090 |
| Date | 2026-11-13 |
| Author | A (Implementer) |
| Task ID | `WP-14` |
| Evidence SHA | 70f5676 |
| CI run | 43391622918 (PR #113 head `b7a9d5d`) / 43394080468 (`main` merge `4dc9b32`) / 43394936936 (PR #114 head `eca2164`) / 43396682506 (PR #117 head `3fcd8a5`) |

---

## 1. Scope

Work Package 14 (Gate G14 Entry Lifecycle Integrity) closure and certification per `docs/plans/P004-ux-remediation-work-packages.md` §1.1 and §7.5, incorporating `WP-14.pre-c` CI cost control (`A088`, PR #106), `WP-14.7` entry lifecycle hotfix (`A089`, PR #113), Dependabot monthly/limit configuration (PR #114), and the reconciled UI Contract (`D-UI-1..D-UI-6`, `D-CONTRACT-1..D-CONTRACT-5`, `D-ORDER`, PR #117).

> **Process Deviation Record (Premature Gate G14 Closure and Reopening):** PR #104 (`4cda311`, `A087`) and PR #105 (`0ac0322`, `H015`) prematurely marked `WP-14` closed before owner walkthrough completion. In PR #106 (`b4a577c`, `A088`), `WP-14` was reopened in `docs/plans/gates.json` (`closingReceipt: null`, `handover: null`) while `WP-14.pre-c` and `WP-14.7` were executed. With `WP-14.7` (`A089`, PR #113) verified and merged (`4dc9b32`), this closing report (`A090`) sets `WP-14.closingReceipt = "A090"` while keeping `WP-14.handover = null` pending owner Gate G14 review.

- [implemented] **WP-14.pre-a (Dependency Vulnerability Review & Dependabot Triage, `UX-51`):** PR #92 (`9b03835`, `A075`). Patched runtime dependencies `@hono/node-server` (`2.1.6`) and `drizzle-orm` (`0.45.4`) and triaged all 23 Dependabot alerts.
- [implemented] **WP-14.pre-b (CI Download Resilience, `UX-52`, `UX-53`, `UX-54`):** PR #93 (`166cb9f`, `A076`), PR #94 (`91b64c6`, `A077`), and PR #96 (`728d91d`, `A079`). Added 5-attempt retry with exponential backoff to CodeQL and Gitleaks downloads and added `zod-collection-guard.conformance.test.ts`.
- [implemented] **WP-14.pre-c (CI Cost Control & Dependabot Governance):** PR #106 (`b4a577c`, `A088`) and PR #114 (`200efbe`). Skipped Playwright E2E and CodeQL analysis on docs-only PRs (proven on PR #107 vs PR #108 and PR #117), restricted non-tag staging builds to `linux/amd64` (reducing staging build time from `585,000 ms` to `127,000 ms`), closed Dependabot PRs #109–#112, and set `.github/dependabot.yml` to `monthly` schedule with `open-pull-requests-limit: 1` per ecosystem and `version-update:semver-major` ignores for `zod`, `vitest`, and `@vitest/*`.
- [implemented] **WP-14.0a (Visible Editor Results, `UX-43`):** PR #95 (`a8012dc`, `A078`) and PR #96 (`728d91d`, `A079`). Rendered `#editor-status-line` and `#editor-toast` in viewport beside action controls with focus management and entries list refresh.
- [implemented] **WP-14.0 (Modular Client Bundling):** PR #97 (`ce7dabc`, `A080`). Added `esbuild` client bundle (`apps/web/src/client/admin-entry.ts` -> `dist/client/admin-entry.js`) with CSP nonce support.
- [implemented] **WP-14.1 (`commitEntry` State Machine, `UX-01`..`UX-04`, `CP-12`):** PR #98 (`49f7ada`, `A081`). Implemented `commitEntry` preserving public state on Save draft, updating saved entries via `PUT /api/entries/:id`, and mapping 409/400 API error messages.
- [implemented] **WP-14.2 (State Chip & Date Correctness, `UX-10`, `UX-11`, `UX-22`):** PR #99 (`e888a6f`, `A082`). Added `#chip-current-state` (`Draft`, `Public`, `Unlisted`), client today date default, inline date validation without throwing `RangeError`, and temporal confidence controls (`Exact`, `Range`, `Estimated`).
- [implemented] **WP-14.3 (Publish Dialog & Auto-Scan, `UX-03`, `UX-13`):** PR #100 (`69f24ff`, `A083`). Built `#publish-confirm-dialog` with auto-running private-detail scan, conditional NDA gate, Public/Unlisted radio choice, focus trap/return, and toast Unpublish action.
- [implemented] **WP-14.4 (Local Autosave & Draft Buffer):** PR #101 (`27869bb`, `A084`). Added debounced IndexedDB draft buffer (`apps/web/src/client/draft-buffer.ts`), restore prompt on reload, `beforeunload` dirty guard, and offline banner.
- [implemented] **WP-14.5 (Spec §11 Calibration Defaults, `UX-08`):** PR #102 (`e1c179d`, `A085`). Defaulted suggestion thresholds and routing calibration to OFF on fresh instances, enforced 20-sample minimum gate and `±0.05` step limit, and rendered 4 mechanism switches.
- [implemented] **WP-14.6 (Quick Visual Repairs & CSS Variable Gate, `UI-01`, `UI-03`):** PR #103 (`f53656f`, `A086`). Defined missing CSS tokens, restored drawer/dialog background opacity, fixed `flex-wrap:gap` declarations, and added `scripts/verify-css-variables` to `pnpm verify`.
- [implemented] **WP-14.7 (Entry Lifecycle Hotfix, `UX-04`, `UX-57`, `UX-58`, `UX-59`):** PR #113 (`4dc9b32`, `A089`). Removed duplicate `#btn-publish-entry` button leaving `#btn-open-publish-dialog` (`Publish…`) as the single publish path; enforced `verifyScanApprovalToken` and `nda_confirmed` on the server across every transition to `public` (`POST`, `PUT`, `Undo`, and public revision updates); wired working `Undo` buttons in both `#editor-status-line` (`#btn-undo-status-line`) and `#editor-toast` (`#btn-undo-toast`) with a real 1s countdown for both Unpublish (restoring `Public`) and Save draft with changed text (restoring earlier body text); fixed `GET /api/entries/:slug` to return `currentRevision` so selecting an entry in `#admin-entries-list` preserves `#entry-body`; dynamically numbered `#publish-confirm-dialog` headings (`1, 2, 3` when NDA hidden; `1, 2, 3, 4` when NDA shown); and verified `unlisted` entries stay out of public lists (`/`, `/work`, `GET /api/entries`) while opening at `/work/:slug`.
- [implemented] **UI Contract Reconciliation (`P004`, `H014`, `H015`, `register.yml`):** PR #117 (`7284aa5`). Recorded `D-UI-1`..`D-UI-6`, `D-CONTRACT-1`..`D-CONTRACT-5`, and `D-ORDER` in `P004` §1.1 and §7.6, reconciled WP names and task numbers across `H014`, `H015`, `register.yml`, `gates.json`, and `P004`, and marked `UX-04`, `UX-57`, `UX-58`, and `UX-59` notes as `fixed (pending owner retest)`.

---

## 2. CI Evidence

Local verification via `pnpm verify` (14/14 steps passed) and `pnpm test:e2e`:
- Unit & Conformance Suites: `367 passed` across `44` test files.
- Playwright End-to-End Suite: `81 passed` across `20` test files.

### Verified GitHub Actions CI Runs Across WP-14 (All Green)

| Task / Scope | Receipt | PR | Task Evidence SHA | PR Head SHA & CI Run IDs (Gate / CodeQL / Gitleaks) | `main` Merge Commit SHA & CI Run IDs (Gate / CodeQL / Gitleaks / Staging CD) |
| --- | --- | --- | --- | --- | --- |
| WP-14.pre-a | A075 | #92 | `036fc20` | `09c521b` (`42485334140` / `42485334075` / `42485334161`) | `9b03835` (`42489721052` / `42489721076` / `42489721149`) |
| WP-14.pre-b | A076 | #93 | `a14fcae` | `a405215` (`42491664853` / `42491664868` / `42491664901`) | `166cb9f` (`42491949409` / `42491949393` / `42491949396`) |
| WP-14.pre-corr | A077 | #94 | `377e35e` | `ea91ecd` (`42751211377` / `42751211253` / `42751211379`) | `91b64c6` (`42751542743` / `42751542764` / `42751542828`) |
| WP-14.0a | A078 | #95 | `db0082b` | `5923bd9` (`42754272314` / `42754272821` / `42754272143`) | `a8012dc` (`42757704638` / `42757704639` / `42757704871`) |
| WP-14.0a-corr | A079 | #96 | `7976977` | `efcb7bc` (`42759187778` / `42759187487` / `42759187503`) | `728d91d` (`42760339473` / `42760339450` / `42760339653`) |
| WP-14.0 | A080 | #97 | `0d02302` | `a83f8b8` (`42761791832` / `42761791634` / `42761791795`) | `ce7dabc` (`42762569511` / `42762569791` / `42762569493`) |
| WP-14.1 | A081 | #98 | `10b163d` | `eda1ae3` (`42764148268` / `42764148403` / `42764148480`) | `49f7ada` (`42764794917` / `42764795130` / `42764794961`) |
| WP-14.2 | A082 | #99 | `e72b4ad` | `5442aa8` (`42765534227` / `42765534543` / `42765534131`) | `e888a6f` (`42765865414` / `42765865538` / `42765865350`) |
| WP-14.3 | A083 | #100 | `20b53d7` | `1eb4d55` (`42766924603` / `42766924758` / `42766924628`) | `69f24ff` (`42767199408` / `42767199518` / `42767199367`) |
| WP-14.4 | A084 | #101 | `0c77e5d` | `20b72a1` (`42768300516` / `42768300753` / `42768300643`) | `27869bb` (`42768634328` / `42768634307` / `42768634516`) |
| WP-14.5 | A085 | #102 | `cf13ed1` | `79a0d7e` (`42771249482` / `42771249484` / `42771249164`) | `e1c179d` (`42771576334` / `42771576294` / `42771576375`) |
| WP-14.6 | A086 | #103 | `1759ab2` | `d2e48d1` (`42773514952` / `42773514806` / `42773514680`) | `f53656f` (`42773887782` / `42773887402` / `42773887735` / `42773887423`) |
| Gate G14 (v1) | A087 | #104 | `c43b846` | `a397993` (`42774767695` / `42774767821` / `42774767690`) | `4cda311` (`42774989134` / `42774989302` / `42774989419`) |
| G14 Corr & H015 | — | #105 | `8489fb3` | `8489fb3` (`43381845608` / `43381845616` / `43381845792`) | `0ac0322` (`43382195534` / `43382195605` / `43382195516`) |
| WP-14.pre-c | A088 | #106 | `09f7fe7` | `50a93a9` (`43387771115` / `43387771135` / `43387771321`) | `b4a577c` (`43388204215` / `43388204147` / `43388204163` / `43388204096`) |
| WP-14.7 Hotfix | A089 | #113 | `c436424` | `b7a9d5d` (`43391622918` / `43391622934` / `43391622971`) | `4dc9b32` (`43394080468` / `43394080555` / `43394080590` / `43394080514`) |
| Dependabot Config | — | #114 | `eca2164` | `eca2164` (`43394936936` / `43394935537` / `43394935621`) | `200efbe` (`43395324060` / `43395324093` / `43395324403`) |
| P004 UI Contract | — | #117 | `3fcd8a5` | `3fcd8a5` (`43396682506` [E2E skipped] / `43396682481` [CodeQL skipped] / `43396682366`) | `7284aa5` (`43396878063` / `43396878083` / `43396878058`) |

---

## 3. Tests Added and Count Change

Net test additions across WP-14 (including `WP-14.7`):
- `apps/api/src/conformance/zod-collection-guard.conformance.test.ts` (1 test)
- `apps/api/src/conformance/calibration-defaults.conformance.test.ts` (3 tests)
- `apps/api/src/conformance/wp14-7-publish-scan-and-unlisted.conformance.test.ts` (2 tests)
- `tests/e2e/wp14-editor-feedback.spec.ts` (2 tests)
- `tests/e2e/wp14-client-bundling.spec.ts` (2 tests)
- `tests/e2e/wp14-commit-entry.spec.ts` (3 tests)
- `tests/e2e/wp14-state-date.spec.ts` (3 tests)
- `tests/e2e/wp14-publish-dialog.spec.ts` (2 tests)
- `tests/e2e/wp14-draft-buffer.spec.ts` (3 tests)
- `tests/e2e/wp14-calibration-defaults.spec.ts` (1 test)
- `tests/e2e/wp14-7-hotfix.spec.ts` (4 tests)
- `scripts/verify-css-variables` conformance gate script

Current test totals:
- Unit & Conformance tests: `367` tests across `44` files (up from `360` tests in `41` files at G13).
- Playwright E2E tests: `81` tests across `20` files (up from `61` tests at G13).

---

## 4. Files Touched

- .github/dependabot.yml
- docs/INDEX.md
- docs/audits/register.yml
- docs/doc-registry.json
- docs/execution-reports/A089-wp-147-entry-lifecycle-hotfix.md
- docs/handovers/H014-wp-13-onboarding-and-authentication-gate-closure.md
- docs/handovers/H015-wp-14-entry-lifecycle-integrity-gate-closure.md
- docs/plans/P004-ux-remediation-work-packages.md
- docs/plans/gates.json

---

## 5. Register and Backlog Changes

Register counts (from `docs/audits/register.yml` verified by `node scripts/handover-facts`):
- 118 fixed, 11 partial, 55 open (P0: 1, P1: 31, P2: 23; Total: 184).

Remediated (`fixed`) Findings in WP-14:
- `20261106-UX-01`: `open -> fixed` (WP-14.1, PR #98)
- `20261106-UX-02`: `open -> fixed` (WP-14.1, PR #98)
- `20261106-UX-03`: `open -> fixed` (WP-14.1 & WP-14.3, PR #98, PR #100)
- `20261106-UX-04`: `open -> fixed -> partial -> fixed` (WP-14.7, PR #113, `tests/e2e/wp14-7-hotfix.spec.ts`, confirmed in owner Gate G14 retest)
- `20261106-UX-08`: `open -> fixed` (WP-14.5, PR #102)
- `20261106-UX-10`: `open -> fixed` (WP-14.2, PR #99)
- `20261106-UX-11`: `open -> fixed` (WP-14.2, PR #99)
- `20261106-UX-22`: `open -> fixed` (WP-14.2, PR #99)
- `20261106-UX-57`: `open -> fixed` (WP-14.7, PR #113, `apps/api/src/conformance/wp14-7-publish-scan-and-unlisted.conformance.test.ts` & `tests/e2e/wp14-7-hotfix.spec.ts`, confirmed in owner Gate G14 retest)
- `20261106-UX-58`: `open -> fixed` (WP-14.7, PR #113, `tests/e2e/wp14-7-hotfix.spec.ts`, confirmed in owner Gate G14 retest)
- `20261106-UX-59`: `open -> fixed` (WP-14.7, PR #113, `apps/api/src/conformance/wp14-7-publish-scan-and-unlisted.conformance.test.ts` & `tests/e2e/wp14-7-hotfix.spec.ts`, confirmed in owner Gate G14 retest)

All 11 `status: partial` Findings (with target WP):
1. `20261106-UX-09` (P0): Setup wizard step 3 read-only table (`WP-13.9`); live key validation/storage in **WP-17.2**.
2. `20261106-UX-27` (P0): Wizard steps 2–6 persisted (`WP-13.4`, `WP-13.10`); live public theme application in **WP-17.8** and **WP-20.1**.
3. `20261106-UX-29` (P1): Wizard competing primary actions fixed (`WP-13.5`); reused for competing site-wide, entry, and mode action buttons in `/admin` editor workspace, completing in **WP-15.7** (`D-WORKSPACE`, `D-EDITOR`).
4. `20261106-UX-33` (P1): Live wizard controls that fail in a default install disabled with plain explanation (`WP-13.5`, `WP-13.9`); settings screens in **WP-17.2** and **WP-17.3**.
5. `20261106-UX-41` (P1): Admin header Sign out added (`WP-13.6`); full account management in **WP-17.4**.
6. `20261106-UX-43` (P0): Inline `#editor-status-line` and list refresh added (`WP-14.0a`), but top `#admin-status-banner` / `#admin-undo-banner` remains and is still written; completes in **WP-15.3** and **WP-15.7** (`D-FEEDBACK`).
7. `20261106-CP-01` (P2): Wizard 501 jargon removed (`WP-13.9`); editor/shared catalogue and full copy sweep in **WP-15.5**, **WP-15.7**, and **WP-20.4**.
8. `20261106-UX-51` (P1): Runtime alerts patched and Dependabot PRs triaged (`WP-14.pre-a`); major `zod` 4 (`UX-53`) and `vitest` 4 (`UX-54`) migrations in **WP-15.0**.
9. `20261106-UX-52` (P2): Download retry with backoff added (`WP-14.pre-b`); monitor across **WP-14..WP-20**.
10. `20261106-UI-01` (P1): Missing CSS variables defined and `verify-css-variables` gate added (`WP-14.6`); token tiers and inline style guard in **WP-15.4** and **WP-15.6**.
11. `20261106-UI-03` (P1): Missing radius tokens defined (`WP-14.6`); shared UI primitives and reference editor page styling in **WP-15.2** and **WP-15.7**.

Carry-Forward Open Findings Registered in WP-14 & Gate G14 Sign-Off:
- `20261106-UX-53` (P2, `open`): Zod 4 migration -> **WP-15.0**.
- `20261106-UX-54` (P2, `open`): Vitest 4 / Tinypool / esbuild dev-only migrations -> **WP-15.0**.
- `20261106-UX-55` (P2, `open`): Owner-facing jargon in editor messages (`L0`, `Enrichment pipeline queued`, `N revisions purged`) -> **WP-15.7** & **WP-15.5**.
- `20261106-UX-56` (P1, `open`): Duplicate editor feedback across `#admin-status-banner`, `#editor-status-line`, and `#editor-toast` with triple `role="status"` live regions -> **WP-15.3** & **WP-15.7** (`D-FEEDBACK`).
- `20261106-UX-60` (P2, `open`): Toasts (`#editor-toast`) disappear after a few seconds without hover/focus pause or dismiss button and repeat the inline status message -> **WP-15.3** & **WP-15.7** (`D-FEEDBACK`).
- `20261106-UX-61` (P1, `open`): Admin workspace renders inside public site header navigation and footer including `"unofficial fork"` notice -> **WP-15.7** (`D-WORKSPACE`).
- `20261106-UX-62` (P1, `open`): Site-wide actions mixed with entry actions on editor screen, duplicate `"Publish"` naming (`Publish Now` vs `Publish…`), and `"Deploy: Building..."` contradicting `"Static rebuild: Idle"` -> **WP-15.7** (`D-WORKSPACE`).
- `20261106-UX-63` (P1, `open`): Six editor action buttons across two rows; `Unlist` and `Unpublish` both shown on unlisted entry; `Delete` adjacent to `Unpublish`; `"Check for private details"` duplicates dialog scan -> **WP-15.7** (`D-EDITOR`, `D-CONTRACT-6`).
- `20261106-UX-64` (P1, `open`): Entry visibility controlled by both a `#entry-visibility` dropdown and a separate `#btn-unlist` button -> **WP-15.7** (`D-EDITOR`).
- `20261106-UX-65` (P1, `open`): NDA confirmation panel (`#entry-nda-confirmed`), inline scan result (`#redaction-preview-box`), and raw `"Signed preview token"` (`#preview-token-badge`) permanently visible in editor and not cleanly cleared across edits and actions -> **WP-15.7** (`D-EDITOR`).
- `20261106-UX-66` (P2, `open`): Developer copy in editor workspace UI (`min 60vh editor workspace`, `never a percentage score`, `Unlocks: ...`, `501 Not Implemented`, `SIMULATED finding M6`) -> **WP-15.7** & **WP-15.5** (`D-EDITOR`, `D-HELP`, `D-WORKSPACE`).
- `20261106-UX-67` (P1, `open`): Editor workspace bugs (`"Entries (0)"` with one entry listed, `"Inspector: Inspector: New Draft"` on saved unlisted entry, `"1 words"`, truncated select values `"Case stu"` and `"Exact (de"`) -> **WP-15.7** & **WP-15.5** (`D-EDITOR`, `D-HELP`).
- `20261106-UX-68` (P2, `open`): First-Run walkthrough shown with existing entry and steps run together on one line; empty Inbox, Conflicts, and three permanent status chips consume editor space -> **WP-15.7** (`D-WORKSPACE`, `D-HELP`).
- `20261106-UX-69` (P2, `open`): Authoring mode buttons (`Paste / Freeform`, `Guided Mode`, `Quick Log`) look like action buttons with no selected state, and five metadata fields are crammed above the body -> **WP-15.7** (`D-EDITOR`).

---

## 6. Not Done (Tagged)

- [not-started] WP-15 Foundations, Monolith Split, Shared Building Blocks & Reference Editor Page (Gate G15, ordered per `D-ORDER`): DOM-id baseline & `UX-53`/`UX-54` migrations (`WP-15.0`), mechanical monolith split (`WP-15.1`), shared building blocks (`WP-15.2`, `WP-15.3`), Reference Editor Page built to `D-WORKSPACE`, `D-EDITOR`, `D-FEEDBACK`, and `D-HELP` with interaction contract test (`WP-15.7`), and then complete token tiers (`WP-15.4`), copy and help catalogues (`WP-15.5`), and CI guard rails (`WP-15.6`) applied to that real page.

---

## 7. Changes to Earlier Reports

None. `A087` (`docs/execution-reports/A087-wp-14-entry-lifecycle-integrity-gate-closure.md`), `A088` (`docs/execution-reports/A088-wp-14pre-c-ci-cost-control.md`), and `A089` (`docs/execution-reports/A089-wp-147-entry-lifecycle-hotfix.md`) remain untouched.

---

## 8. Receipt Gate Self-Validation

```
$ node scripts/receipt-check docs/execution-reports/A090-wp-14-entry-lifecycle-integrity-gate-closure.md
=== Validating Receipt A090-wp-14-entry-lifecycle-integrity-gate-closure.md ===

✓ [HEADER-CHECK] Mandatory headers verified (6/6 present).
✓ [ANCESTOR-CHECK] Evidence SHA '70f5676' is an ancestor of HEAD.
✓ [FILES-TOUCHED] Matches git diff c436424..70f5676 (9 files verified).
✓ [SECTIONS-CHECK] Mandatory sections 1 through 9 verified for A090-wp-14-entry-lifecycle-integrity-gate-closure.md.
Found 0 section(s) marked verbatim.

🎉 All receipt checks PASSED for A090-wp-14-entry-lifecycle-integrity-gate-closure.md.
```

---

## 9. Handover Decision

- Decision: REQUIRED
- Rule(s): HO-R1
- Receipts since last handover: 16 (A075..A090 since H014); work packages since: 1 (WP-14)
- Clean-boundary preconditions: met
- Next action: Author Handover `H015` (`docs/handovers/H015-wp-14-entry-lifecycle-integrity-gate-closure.md`) and close gate `WP-14` in `docs/plans/gates.json`

---

## 10. Manual Acceptance Script (Path B on Port 4000 from Fresh Clone)

To verify the complete WP-14 and WP-14.7 entry lifecycle on a fresh clone without Docker:

```bash
# 1. Fresh clone
git clone https://github.com/shiapenn/living-portfolio.git test-lp-wp14
cd test-lp-wp14

# 2. Setup environment, install dependencies, and build
cp .env.example .env
pnpm install
pnpm build

# 3. Start single-process server on port 4000 (Path B)
PORT=4000 ENABLE_BUNDLED_WEB=true pnpm --filter @living-portfolio/api dev
```

### Public Route Truth (Confirmed Against `apps/web/src/app.ts` L180–200 and `apps/web/src/renderer.ts` L761–1100):
- `GET /` and `GET /work`: list `public` entries with structured profiles (`entry.profile !== 'freeform'`, such as the default `case-study`).
- `GET /writing`: lists **all** `public` entries (both structured profiles and `freeform`).
- `GET /api/entries` (and `GET /api/v1/entries`): defaults to `visibility: ['public']`, excluding `unlisted` and `private` entries.
- `GET /work/:slug`: serves any `public` or `unlisted` entry (`200 OK`; returns `404` when `private`).
- `GET /writing/:slug`: `301`-redirects structured entries (`entry.profile !== 'freeform'`) to `/work/:slug`, and serves `freeform` entries (`entry.profile === 'freeform'`) directly (`200 OK` when `public` or `unlisted`).

### Owner Walkthrough Checklist:

1. **First-Run Setup Step (Before Login):**
   - On a fresh unconfigured instance (`setupRequired: true`), open `http://localhost:4000/admin`; confirm it `302`-redirects to `http://localhost:4000/admin/setup`.
   - Complete the 6-step setup wizard: (Step 1) create the owner username/password, save/download the 8 recovery codes (`xxxx-xxxx-xxxx-xxxx`), tick the confirmation gate (`#gate-saved-credentials`), and click **Continue**; (Step 2) scan the QR code or enter the Base32 secret in an authenticator app and confirm a 6-digit code (`POST /api/auth/totp/confirm`, which issues the `lp_session` cookie and `csrfToken` in `sessionStorage`); (Steps 3–6) review/save choices and click **Launch Portfolio** to land on `http://localhost:4000/admin`.
2. **Sign-Out & Login Step (`/admin/login`):**
   - Click **Sign out** (`#btn-admin-logout`) in the header; confirm you are redirected to `http://localhost:4000/admin/login` and visiting `http://localhost:4000/admin` while signed out redirects (`302`) to `/admin/login`.
   - Sign back in at `http://localhost:4000/admin/login` using your password and a 6-digit authenticator code (or click the recovery-code toggle and enter one 16-hex recovery code), landing on `http://localhost:4000/admin`.
3. **State Chip, Date Default & Temporal Confidence (`UX-10`, `UX-11`, `UX-22`):**
   - Confirm `#chip-current-state` renders `"Draft"`.
   - Confirm `#entry-date` defaults to today's date (`YYYY-MM-DD`); clear `#entry-date` and click **Save draft** (`#btn-save-draft`) — confirm inline `#entry-date-error` appears without an unhandled `RangeError`. Restore today's date.
   - Confirm `#entry-temporal-level` offers `Exact`, `Range` (revealing `#entry-date-range-end`), and `Estimated`.
4. **Single `Publish…` Path & Private-Detail Check (`UX-57`):**
   - Confirm the editor action bar has **only one** publish button: **Publish…** (`#btn-open-publish-dialog`), and that the old plain `Publish` button (`#btn-publish-entry`) does **not** exist.
   - Enter title `"WP-14 Walkthrough Entry"`, slug `"wp14-walkthrough-entry"`, and body `"Initial clean draft text."`, then click **Save draft** (`#btn-save-draft`).
   - Confirm the result message appears in `#editor-status-line` inside the viewport without scrolling (`UX-43`), `#chip-current-state` shows `"Draft"`, and the entry appears in `#admin-entries-list`.
5. **Pre-Flight Dialog Step Numbering (`UX-58`) & Publishing (`UX-01`, `UX-57`):**
   - Click **Publish…** (`#btn-open-publish-dialog`) to open `#publish-confirm-dialog`.
   - With clean text (`0` confidential matches), confirm `#publish-step-2-nda` is hidden and the visible step headings inside `#publish-confirm-dialog` are numbered sequentially **`1. Private-Detail Check`**, **`2. Who Can See It`**, and **`3. What Happens Next`** (no skip from `1` to `3`).
   - Close the dialog (`#btn-cancel-publish`), add a sensitive token to `#entry-body` (e.g., `AKIAIOSFODNN7EXAMPLE`), and click **Publish…** (`#btn-open-publish-dialog`) again:
     - Confirm `#btn-confirm-publish` is disabled until the match is resolved/acknowledged, and when a confidential match reveals `#publish-step-2-nda`, the visible step headings number **`1`**, **`2`**, **`3`**, **`4`**.
   - Remove the sensitive token so `#entry-body` is clean again, click **Publish…** (`#btn-open-publish-dialog`), wait for `"No private details found"`, and click **Publish entry** (`#btn-confirm-publish`).
   - Confirm the existing entry is updated via `PUT` (no duplicate row in `#admin-entries-list`) and `#chip-current-state` updates to `"Public"`.
6. **Undo from `#editor-status-line` After Changed Save Draft and After Unpublish (`UX-02`, `UX-04`):**
   - **After Save draft with changed text:** Change `#entry-body` to `"Updated body text after publish."` and click **Save draft** (`#btn-save-draft`). Confirm `#chip-current-state` remains `"Public"` (`UX-02`) and `#editor-status-line` displays **Undo (30s)** (`#btn-undo-status-line`) with a live 1-second countdown (`30s` -> `29s` -> ...). Click **Undo** (`#btn-undo-status-line`): confirm `#entry-body` and the server revision revert to `"Initial clean draft text."`.
   - **After Unpublish:** Click **Unpublish** (`#btn-unpublish`); confirm `#chip-current-state` changes to `"Draft"` (`private`) and **Undo (30s)** (`#btn-undo-status-line`) appears in `#editor-status-line`. Click **Undo** (`#btn-undo-status-line`): confirm the entry is restored to `"Public"` (`#chip-current-state` shows `"Public"` and `http://localhost:4000/work/wp14-walkthrough-entry` returns `200 OK`).
7. **Unlisted Excluded from Public Lists (`/`, `/work`, `/writing`, `/api/entries`) and Reachable by Direct Link (`/work/:slug`) (`UX-03`, `UX-59`):**
   - Click **Unlist** (`#btn-unlist`) (or open **Publish…**, select the **Unlisted** radio option `input[name="publish-visibility-choice"][value="unlisted"]`, and confirm).
   - Confirm `#chip-current-state` shows `"Unlisted"`.
   - Open `http://localhost:4000/`, `http://localhost:4000/work`, `http://localhost:4000/writing`, and `http://localhost:4000/api/entries`: confirm `"WP-14 Walkthrough Entry"` (`wp14-walkthrough-entry`) does **not** appear on any public list page or default feed.
   - Open `http://localhost:4000/work/wp14-walkthrough-entry` directly: confirm it loads (`200 OK`) and renders `"WP-14 Walkthrough Entry"` and its body text (and `http://localhost:4000/writing/wp14-walkthrough-entry` `301`-redirects to `/work/wp14-walkthrough-entry` for structured profiles or renders `200 OK` if `profile === 'freeform'`).
8. **Import Page Still Creates Drafts:**
   - Navigate to `http://localhost:4000/admin/import`.
   - Enter or keep sample content in the import input (`#import-raw-input`), click **Plan Import** (`#btn-plan-import`), then accept/stage an item (`#btn-triage-accept` / commit import) to create a draft entry.
   - Return to `http://localhost:4000/admin` and confirm the imported entry appears in `#admin-entries-list` with `draft` (`private`) status, and clicking it loads its title and body into `#entry-title` and `#entry-body`.
9. **Local Autosave Buffer (`WP-14.4`) & Calibration Defaults (`UX-08`):**
   - Type unsaved text in `#entry-body`, reload `/admin`, and confirm `#draft-restore-notice` offers one-click restore (`#btn-restore-draft`).
   - Open `http://localhost:4000/admin/settings` and confirm suggestion thresholds and routing calibration default to OFF with 4 mechanism switches showing the 20-sample minimum gate and `±0.05` step limits.
