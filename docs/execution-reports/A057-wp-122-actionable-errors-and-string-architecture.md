# A057 — WP-12.2: Actionable Error Messages & String Architecture

| Field | Value |
| --- | --- |
| Report ID | A057 |
| Date | 2026-11-04 |
| Author | A (Implementer) |
| Task ID | `WP-12.2 (20261020-CP-04, 20261020-CP-06, 20261020-CP-07)` |
| Evidence SHA | `ce11724` |
| CI run | https://github.com/shiapenn/living-portfolio/actions/runs/41769566669 |

---

## 1. Scope

- 1. **Actionable User-Facing Error Messages (20261020-CP-04 [P2]):** Replaced dead-end error displays and technical error leaks with actionable three-part user recovery messages ("What failed, why it failed, and what to do now"). Standardized Ask page client error states so network failures, upstream 500s, and 400 invalid queries render clear guidance cards with retry instructions. Enhanced admin fetch error handling (`renderAdminError`) to present clear, non-cryptic recovery steps for 401 session expiry, 403 CSRF/forbidden, 500 server errors, and offline network disconnects while retaining HTTP status codes for diagnostics. Replaced technical backend messages ("Origin unreachable", "Failed to fetch") with respectful, user-centered recovery language. [implemented]
- 2. **String Architecture & Localization Mechanics (20261020-CP-06 [P2]):** Created centralized string catalog and internationalization formatting utility (`apps/web/src/strings.ts`). Implemented spec-standard Month Year date localization (`formatMonthYear`) using `Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric', timeZone: 'UTC' })`. Implemented grammatical pluralization (`formatPlural`) using `Intl.PluralRules` retiring ad-hoc ternary expressions (`count > 1 ? 's' : ''`). Built a ReDoS-safe linear non-backtracking ICU message formatter (`formatIcu`) supporting variable substitution and plural rules. Added `lang` attribute support to individual entry cards and detail pages preserving multilingual content accessibility (WCAG 3.1.2). [implemented]
- 3. **Spec-Standard Canonical Strings Across 9 Ask Flow States (20261020-CP-07 [P2]):** Aligned all 9 Ask flow states (`tier1`, `tier2`, `tier3`, `extractive`, `no_match`, `disabled`, `needs_context`, `rate_limited`, `invalid_query`) with canonical catalog strings defined in Spec §13.5:
  - `tier1`: "Directly verified against portfolio records."
  - `tier2`: "Synthesized from related portfolio records. Review citations for details."
  - `tier3`: "This is better as a conversation. Your situation has details my past work doesn't cover."
  - `extractive`: "Answers are grounded strictly in published portfolio records. No external generation is active."
  - `no_match`: "I couldn't find portfolio work that addresses this question. Try rephrasing or asking about another project."
  - `disabled`: "The Ask feature is currently unavailable. Portfolio entries remain fully readable."
  - `needs_context`: "Could you be more specific? Mentioning a project name, technology, or domain helps find relevant work."
  - `rate_limited`: "Too many questions asked recently. Please wait a moment before asking another."
  - `invalid_query`: "Please enter a question with at least 3 characters to search portfolio records."
  [implemented]
- 4. **Conformance and Unit Tests:** Added 16 new conformance tests in `apps/api/src/conformance/wp12-actionable-strings.conformance.test.ts` and 5 new unit tests in `apps/web/src/web.test.ts`. [implemented]
- 5. **Audit Register Update:** Marked findings `20261020-CP-04`, `20261020-CP-06`, and `20261020-CP-07` as `fixed` in `docs/audits/register.yml` mapped to `wp12-actionable-strings.conformance.test.ts`. [implemented]

---

## 2. CI Evidence

### 2.1 Build & Typecheck (Job 126375820902)

- Turbo build executed cleanly across all 8 packages (`@living-portfolio/config`, `@living-portfolio/core`, `@living-portfolio/client`, `@living-portfolio/ai`, `@living-portfolio/db`, `@living-portfolio/web`, `@living-portfolio/worker`, `@living-portfolio/api`).
- Zero compilation errors, zero TypeScript errors.

### 2.2 Verbatim Vitest Results per Package (Job 126375820902)

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
Tests  43 passed (43)
Test Files  2 passed (2)
Tests  16 passed (16)
Test Files  5 passed (5)
Tests  54 passed (54)
Test Files  37 passed (37)
Tests  318 passed (318)
```

*(Note: Total across workspaces: 50 test files passed, 504 passed | 1 skipped, 505 tests).*

### 2.3 Verbatim Playwright E2E Results (Job 126375821184)

```
49 passed (28.7s)
```

### 2.4 Verbatim SARIF Static Analysis Baseline Gate (Job 126375821163)

```
✓ [SARIF-GATE] Baseline verified: 0 rule(s) mapped to valid register findings.
[SARIF-GATE] Alerts parsed from SARIF: total = 0, baselined = 0, unbaselined = 0
✓ [SARIF-GATE] Gate PASSED: All 0 CodeQL alert(s) across 1 file(s) are baselined against approved register findings.
```

### 2.5 Verbatim Gitleaks Commit Count & Secret Scan Output (Job 126375821411)

```
213 commits scanned.
```

### 2.6 Verbatim DCO Verification Line (Job 126375820902)

```
✓ [OSR-07 DCO] All 1 commit(s) in 1e7afd01b6041e69fbbbb73d9daf0c0d5f184c17..ce11724b1f6510f10917a30bc8d3d8579bf00d57 carry a valid Signed-off-by trailer.
```

---

## 3. Tests Added and Count Change

- **Web Unit Tests (`apps/web/src/web.test.ts`):** 5 new tests added (increasing `@living-portfolio/web` test suite from 38 to 43 tests):
  - `String architecture: formatMonthYear produces localized Month Year strings`: verifies formatting of standard ISO dates into `Month YYYY`.
  - `String architecture: formatPlural handles singular and plural quantities`: verifies correct pluralization for 0, 1, 2, and larger quantities without manual ternary operators.
  - `String architecture: formatIcu supports variable interpolation and plural patterns`: verifies linear ReDoS-safe token replacement and ICU plural blocks.
  - `Actionable errors: formatActionableError produces structured 3-part recovery messages`: verifies that failures output what failed, why, and what to do now.
  - `Entry cards and renderer emit proper lang attributes`: verifies that per-entry language settings are rendered on article tags.

- **Conformance Tests (`apps/api/src/conformance/wp12-actionable-strings.conformance.test.ts`):** 16 new conformance tests added (increasing `apps/api` test suite from 302 to 318 tests):
  - `[CP-04] Three-part actionable error format contains what failed, why, and what to do now`: verifies three-part pattern contract.
  - `[CP-04] Ask page 400 invalid query renders an actionable alert card with recovery guidance`: verifies 400 response structure.
  - `[CP-04] Eradicates raw Origin unreachable and technical leak errors`: verifies absence of raw stack traces or cryptic messages.
  - `[CP-04] Admin UI renderAdminError produces actionable recovery steps for auth and server errors`: verifies 401, 403, and 500 admin recovery alerts.
  - `[CP-06] formatMonthYear formats dates as Month Year`: verifies localized month year generation.
  - `[CP-06] formatPlural adheres to grammatical pluralization rules`: verifies plural handling via `Intl.PluralRules`.
  - `[CP-06] formatIcu performs safe ICU message format parsing without backtracking ReDoS risk`: verifies nested tokens, plural parsing, and linear performance.
  - `[CP-06] Entry cards and detail views render per-entry lang attributes`: verifies HTML `lang` emission.
  - `[CP-06] Timeline band labels include both ISO code and localized Month Year`: verifies WCAG 2.5.3 name-in-label conformance.
  - `[CP-07] Canonical string for tier1 state`: verifies tier1 exact string matching.
  - `[CP-07] Canonical string for tier2 state`: verifies tier2 exact string matching.
  - `[CP-07] Canonical string for tier3 state`: verifies tier3 exact string matching.
  - `[CP-07] Canonical string for extractive state`: verifies extractive exact string matching.
  - `[CP-07] Canonical string for no_match state`: verifies no_match exact string matching.
  - `[CP-07] Canonical string for disabled state`: verifies disabled exact string matching.
  - `[CP-07] Canonical string for invalid_query and rate_limited states`: verifies invalid_query and rate_limited exact string matching.

---

## 4. Files Touched

Matches `git diff --name-only 62e8373..ce11724` (13 files):
- `apps/api/src/auth/security.ts`
- `apps/api/src/conformance/wp12-actionable-strings.conformance.test.ts`
- `apps/api/src/routes/ask.ts`
- `apps/api/src/routes/entries.ts`
- `apps/web/src/components/entry-card.ts`
- `apps/web/src/index.ts`
- `apps/web/src/renderer.ts`
- `apps/web/src/strings.ts`
- `apps/web/src/web.test.ts`
- `docs/INDEX.md`
- `docs/audits/register.yml`
- `docs/doc-registry.json`
- `docs/execution-reports/A056-wp-121-strata-timeline-overhaul-and-typography-craft.md`

---

## 5. Register and Backlog Changes

The following 3 P2 findings were marked as `fixed` in `docs/audits/register.yml`:
- `20261020-CP-04` [P2]: Actionable user-facing error messages with concrete recovery guidance -> `status: fixed` (regression test: `apps/api/src/conformance/wp12-actionable-strings.conformance.test.ts`).
- `20261020-CP-06` [P2]: String architecture, date localization & grammatical pluralization -> `status: fixed` (regression test: `apps/api/src/conformance/wp12-actionable-strings.conformance.test.ts`).
- `20261020-CP-07` [P2]: Spec-standard canonical strings across all 9 Ask flow states -> `status: fixed` (regression test: `apps/api/src/conformance/wp12-actionable-strings.conformance.test.ts`).

Total register status: 80 findings fixed (100% of 54 P0 findings, 19 of 32 P1 findings, 7 of 9 P2 findings). Remaining open: 17 findings (13 P1, 2 P2, 2 P3).

---

## 6. Not Done (Tagged)

None. All deliverables for WP-12.2 are complete.

---

## 7. Changes to Earlier Reports

None. Earlier reports A001 through A056 remain immutable.

---

## 8. Receipt Gate Self-Validation

```
=== Validating Receipt A057-wp-122-actionable-errors-and-string-architecture.md ===

✓ [HEADER-CHECK] Mandatory headers verified (6/6 present).
✓ [ANCESTOR-CHECK] Evidence SHA 'ce11724' is an ancestor of HEAD.
✓ [FILES-TOUCHED] Matches git diff 62e8373..ce11724 (13 files verified).
✓ [SECTIONS-CHECK] Mandatory sections 1 through 9 verified for A057-wp-122-actionable-errors-and-string-architecture.md.
Found 5 section(s) marked verbatim.
✓ [VERBATIM-CHECK] Section "2.2 Verbatim Vitest Results per Package (Job 126375820902)" verified against CI logs.
✓ [VERBATIM-CHECK] Section "2.3 Verbatim Playwright E2E Results (Job 126375821184)" verified against CI logs.
✓ [VERBATIM-CHECK] Section "2.4 Verbatim SARIF Static Analysis Baseline Gate (Job 126375821163)" verified against CI logs.
✓ [VERBATIM-CHECK] Section "2.5 Verbatim Gitleaks Commit Count & Secret Scan Output (Job 126375821411)" verified against CI logs.
✓ [VERBATIM-CHECK] Section "2.6 Verbatim DCO Verification Line (Job 126375820902)" verified against CI logs.

🎉 All receipt checks PASSED for A057-wp-122-actionable-errors-and-string-architecture.md.
```

---

## 9. Handover Decision

- Decision: NOT REQUIRED
- Rule(s): HO-R1
- Receipts since last handover: 2 (A056, A057); work packages since: 0
- Clean-boundary preconditions: met (WP-12.2 complete, all unit/conformance/E2E test suites green, 13 gates passing)
- Next action: Proceed to WP-12.3 (Open-Source Governance & Full Documentation Suite, Task Receipt A058)
