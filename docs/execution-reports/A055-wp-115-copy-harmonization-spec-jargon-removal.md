# A055 — WP-11.5: Copy Harmonization & Spec-Jargon Removal

| Field | Value |
| --- | --- |
| Report ID | A055 |
| Date | 2026-11-03 |
| Author | A (Implementer) |
| Task ID | `WP-11.5 (20261020-CP-01, 20261020-CP-02, 20261020-CP-03)` |
| Evidence SHA | `6752105` |
| CI run | https://github.com/shiapenn/living-portfolio/actions/runs/41639073610 |

---

## 1. Scope

- 1. **Cross-Route Naming Harmonization (20261020-CP-01 [P1]):** Harmonized all route headings to strictly match primary and secondary navigation anchors: `<h1>Work</h1>`, `<h1>Writing</h1>`, `<h1>Build</h1>`, `<h1>Timeline</h1>`, `<h1>Ask about my work</h1>`, `<h1>Book a conversation</h1>`. Standardized outcome labels across filter chips, card badges, and claims to canonical spec values: `Worked`, `Partly worked`, `Didn't work`, `Unresolved`, `Unknown` (retiring non-standard "Worked partly", "What didn't work (Failed)"). Unified canonical action verbs: "Ask" on submit buttons, "Ask about this entry" on entry margin rails, "Book a conversation" on CTAs, "Publish" on editor controls, "As of" on timeline filters, "Later thinking" on revision banners, and "Written looking back" on hindsight badges. [implemented]
- 2. **Spec and Schema Jargon Removal (20261020-CP-02 [P1]):** Purged internal specification section numbers (`(§...)`) from user-facing headings, button labels, and alert banners across visitor and admin routes. Eliminated `(hard constraint)` jargon from Ask prompt facets. Relocated schema roles from visible UI text to machine-readable `data-role="..."` attributes. Replaced visitor-facing `Structure: L2` tier codes with a clean, neutral `<span class="chip">Structured</span>` badge shown only on structured entries. Harmonized view switcher to canonical "Read as one article" / "Read by section" (`data-action="view-switch"`). Standardized claims to sentence case ("Lesson. Outcome: Worked", heading "Conclusions"). [implemented]
- 3. **Zero Hardcoded Owner/Sample Content (20261020-CP-03 [P1]):** Eliminated all hardcoded personal bio details, hardware specifications, and unconditional verification badges. `/now` defaults to a clean neutral empty fallback `<h1>What I'm focused on now</h1><p class="neutral-empty-note"><em>Nothing here yet.</em></p>`. `/about` removed `(§6.1)` and replaced unverified GitHub/Keybase badges with honest credential guidance: `<h2>Verified credentials</h2><p>A badge appears only when it can be proved: signed commits checked against GitHub, or ownership of this domain.</p><p class="neutral-empty-note"><em>Nothing has been verified yet.</em></p>`. `/uses` replaced personal workstation claims with neutral stack documentation: `<h1>Tools &amp; Stack</h1><p class="neutral-empty-note"><em>Instance stack information.</em></p>`. [implemented]
- 4. **Conformance Test Suite (`apps/api/src/conformance/wp11-copy-harmonization.conformance.test.ts`):** Authored comprehensive conformance suite verifying naming harmonization, zero spec jargon leaks, structured chips, data-role attributes, and neutral owner content fallbacks. [implemented]
- 5. **Audit Register Update:** Marked findings `20261020-CP-01`, `20261020-CP-02`, and `20261020-CP-03` as `fixed` in `docs/audits/register.yml` mapped to `wp11-copy-harmonization.conformance.test.ts`. [implemented]

---

## 2. CI Evidence

### 2.1 Build & Typecheck (Job 125927634412)

- Turbo build executed cleanly across all 8 packages (`@living-portfolio/config`, `@living-portfolio/core`, `@living-portfolio/client`, `@living-portfolio/ai`, `@living-portfolio/db`, `@living-portfolio/web`, `@living-portfolio/worker`, `@living-portfolio/api`).
- Zero compilation errors, zero TypeScript errors.

### 2.2 Verbatim Vitest Results per Package (Job 125927634412)

```
Test Files  1 passed (1)
Tests  5 passed (5)
Test Files  1 passed (1)
Tests  5 passed (5)
Test Files  1 passed (1)
Tests  33 passed (33)
Test Files  2 passed (2)
Tests  29 passed (29)
Test Files  1 passed (1)
Tests  33 passed (33)
Test Files  2 passed (2)
Tests  16 passed (16)
Test Files  5 passed (5)
Tests  54 passed (54)
Test Files  35 passed (35)
Tests  289 passed (289)
```

*(Note: Total across workspaces: 48 test files passed, 464 passed | 1 skipped, 465 tests).*

### 2.3 Verbatim Playwright E2E Results (Job 125927633882)

```
49 passed (26.9s)
```

### 2.4 Verbatim SARIF Static Analysis Baseline Gate (Job 125927633802)

```
✓ [SARIF-GATE] Baseline verified: 0 rule(s) mapped to valid register findings.
[SARIF-GATE] Alerts parsed from SARIF: total = 0, baselined = 0, unbaselined = 0
✓ [SARIF-GATE] Gate PASSED: All 0 CodeQL alert(s) across 1 file(s) are baselined against approved register findings.
```

### 2.5 Verbatim Gitleaks Commit Count & Secret Scan Output (Job 125927633923)

```
2 commits scanned.
```

### 2.6 Verbatim DCO Verification Line (Job 125927634412)

```
✓ [OSR-07 DCO] All 2 commit(s) in 604431b1256433955de7838134b205600eea2a4b..be593b92af5cc73c4f4e65886d2918328784c076 carry a valid Signed-off-by trailer.
```

---

## 3. Tests Added and Count Change

- **Conformance Tests (`apps/api/src/conformance/wp11-copy-harmonization.conformance.test.ts`):** 3 new conformance tests added (increasing `apps/api` test suite from 286 to 289 tests):
  - `[CP-01] Cross-route naming harmonization: headings, outcome chips, and action verbs`: verifies canonical `<h1>` headings (`Work`, `Build`, `Timeline`, `Ask about my work`, `Book a conversation`), standard outcome chips (`Worked`, `Partly worked`, `Didn't work`, `Unresolved`), absence of retired outcome phrases, and action verbs.
  - `[CP-02] Removal of spec & schema jargon: no section numbers, data-role attributes, neutral structured chips`: verifies zero leaked section numbers (`(§...)`) across public and admin routes, presence of `data-role` attributes on structured sections, neutral `Structured` chips without `Structure: L2`, and canonical view switchers.
  - `[CP-03] Zero hard-coded owner/sample content in UI templates (/now, /about, /uses)`: verifies `/now` empty state, `/about` honest verification notice without unproved badges, and `/uses` neutral stack documentation.

---

## 4. Files Touched

Matches `git diff --name-only 6208dbc..6752105` (17 files):
- `apps/api/src/api.test.ts`
- `apps/api/src/conformance/p0-probes.conformance.test.ts`
- `apps/api/src/conformance/wp11-copy-harmonization.conformance.test.ts`
- `apps/api/src/conformance/wp11-nav-states.conformance.test.ts`
- `apps/web/src/components/entry-card.ts`
- `apps/web/src/components/slots.ts`
- `apps/web/src/renderer.ts`
- `apps/web/src/tokens/index.ts`
- `apps/web/src/web.test.ts`
- `docs/INDEX.md`
- `docs/audits/register.yml`
- `docs/doc-registry.json`
- `docs/execution-reports/A054-wp-114-markdown-engine-tokens-and-responsive-layout.md`
- `tests/e2e/providers.spec.ts`
- `tests/e2e/visitor-escalation-booking.spec.ts`
- `tests/e2e/wp11-accessibility-and-structure.spec.ts`
- `tests/e2e/wp11-publish-and-ask.spec.ts`

---

## 5. Register and Backlog Changes

The following 3 P1 findings were marked as `fixed` in `docs/audits/register.yml`:
- `20261020-CP-01` [P1]: Cross-route naming harmonization -> `status: fixed` (regression test: `apps/api/src/conformance/wp11-copy-harmonization.conformance.test.ts`).
- `20261020-CP-02` [P1]: Spec and schema vocabulary leaks into interface -> `status: fixed` (regression test: `apps/api/src/conformance/wp11-copy-harmonization.conformance.test.ts`).
- `20261020-CP-03` [P1]: Hardcoded owner content shipped in code -> `status: fixed` (regression test: `apps/api/src/conformance/wp11-copy-harmonization.conformance.test.ts`).

Total register status: 74 findings fixed (100% of 54 P0 findings, 19 of 32 P1 findings). Remaining open: 23 findings (13 P1, 8 P2, 2 P3).

---

## 6. Not Done (Tagged)

None. All deliverables for WP-11.5 are complete.

---

## 7. Changes to Earlier Reports

None. Earlier reports A001 through A054 remain immutable.

---

## 8. Receipt Gate Self-Validation

```
=== Validating Receipt A055-wp-115-copy-harmonization-spec-jargon-removal.md ===

✓ [HEADER-CHECK] Mandatory headers verified (6/6 present).
✓ [ANCESTOR-CHECK] Evidence SHA '6752105' is an ancestor of HEAD.
✓ [FILES-TOUCHED] Matches git diff 6208dbc..6752105 (17 files verified).
✓ [SECTIONS-CHECK] Mandatory sections 1 through 9 verified for A055-wp-115-copy-harmonization-spec-jargon-removal.md.
Found 5 section(s) marked verbatim.
✓ [VERBATIM-CHECK] Section "2.2 Verbatim Vitest Results per Package (Job 125927634412)" verified against CI logs.
✓ [VERBATIM-CHECK] Section "2.3 Verbatim Playwright E2E Results (Job 125927633882)" verified against CI logs.
✓ [VERBATIM-CHECK] Section "2.4 Verbatim SARIF Static Analysis Baseline Gate (Job 125927633802)" verified against CI logs.
✓ [VERBATIM-CHECK] Section "2.5 Verbatim Gitleaks Commit Count & Secret Scan Output (Job 125927633923)" verified against CI logs.
✓ [VERBATIM-CHECK] Section "2.6 Verbatim DCO Verification Line (Job 125927634412)" verified against CI logs.

🎉 All receipt checks PASSED for A055-wp-115-copy-harmonization-spec-jargon-removal.md.
```

---

## 9. Handover Decision

- Decision: REQUIRED
- Rule(s): HO-R1
- Receipts since last handover: 5 (A051, A052, A053, A054, A055); work packages since: 1 (WP-11)
- Clean-boundary preconditions: met (all WP-11 implementation tasks A051 through A055 verified in CI)
- Next action: Author Handover Snapshot H012 for Work Package 11 Gate Closure & Milestone v0.2 UX Certification
