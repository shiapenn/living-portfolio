# Effective Design & Architecture Rules (Generated)

> Auto-generated from `docs/adr/ADR-*.md` front matter via `node scripts/generate-rules`. Do not edit by hand.
> Superseded ADRs are excluded automatically.

| Metric | Value |
| --- | --- |
| Accepted ADRs | 24 |
| Superseded ADRs (excluded) | 1 |
| Effective Rules | 39 |
| Areas Covered | 12 |

## architecture

| Rule | Requirement | Source ADR | Enforced By |
| --- | --- | --- | --- |
| `R-001-1` | Separate UI into ui-core, ui-admin (lp-*), and ui-public (pub-*) with zero cross-language imports or bundles | [ADR-001](../adr/ADR-001-two-design-languages.md) | `scripts/verify-design-boundaries` |
| `R-001-2` | Share one core accent seed across admin and public via user-theme accent.<hash>.css | [ADR-001](../adr/ADR-001-two-design-languages.md) | `packages/ui-core/src/accent/accent.test.ts` |
| `R-012-1` | apps/web has zero database dependencies or imports; apps/api has zero static imports of apps/web | [ADR-012](../adr/ADR-012-d-storage-decoupling.md) | `scripts/verify-dependency-rules` |
| `R-023-1` | Global design framework defines a shared token contract (type, space/rhythm relations, colour, radius, elevation, motion, density) implemented by both admin and public packs | [ADR-023](../adr/ADR-023-unified-design-framework.md) | `packages/design-tokens/src/rules.test.ts` |
| `R-023-2` | Shared UI components (button, icon, theme toggle, link, tag, field, choice, notice) live in ui-core using contract tokens only; changes to shared components must pass both admin and public regression suites | [ADR-023](../adr/ADR-023-unified-design-framework.md) | `scripts/verify-design-boundaries` |
| `R-023-3` | Admin operates in system mode (no new component without L prior approval; variants only); public operates in expressive mode (PR brief recorded and reviewed after the fact) | [ADR-023](../adr/ADR-023-unified-design-framework.md) | `scripts/verify-ui-guards` |

## components

| Rule | Requirement | Source ADR | Enforced By |
| --- | --- | --- | --- |
| `R-014-1` | Admin primitives and components pass composition and markup contract unit tests | [ADR-014](../adr/ADR-014-d-comp-primitive-composition.md) | `apps/web/src/primitives/dcomp.test.ts` |
| `R-015-1` | Public and admin routes render complete empty, error, and 404 system states with actionable CTAs | [ADR-015](../adr/ADR-015-d-sys-system-states.md) | `apps/api/src/conformance/wp11-nav-states.conformance.test.ts` |
| `R-019-1` | Named z-index tokens enforce modal and toast stacking order without magic numbers | [ADR-019](../adr/ADR-019-d-i-overlays-and-focus.md) | `packages/design-tokens/src/drift.test.ts` |

## content

| Rule | Requirement | Source ADR | Enforced By |
| --- | --- | --- | --- |
| `R-024-1` | Admin copy follows the remove-rather-than-add content standard with an operational floor: page description <= 14 words (omitted on Settings index), Settings index summaries <= 6 words, section description <= 16 words, field helper <= 12 words (numeric/consequential controls keep recommended value or consequence), empty state <= 12 words, notice <= 2 sentences (success notices follow events only), buttons <= 2 words sentence case, and default route static prose <= 60 words | [ADR-024](../adr/ADR-024-content-standard.md) | `tests/e2e/wp17-9-content-and-ink-census.spec.ts` |
| `R-024-2` | Rendered admin UI must never contain banned internal tokens ([object Object], undefined, null, NaN, WP-N, ADR-N, <hash>, (s), filenames, API paths, raw IDs, or raw ISO YYYY-MM-DD dates); timestamps use the ui-core formatter (25 Nov 2026, 14:29) | [ADR-024](../adr/ADR-024-content-standard.md) | `tests/e2e/wp17-9-content-and-ink-census.spec.ts` |
| `R-024-3` | Tabs always have an active selected tab matching the URL (unknown values fall back to the first tab), labels are 1-2 short words, painted label ink boxes never intersect or clip, targets are >= 44px, overflowing tablists scroll horizontally with scroll-snap and edge fade, and tab panels never repeat their active tab name as a heading or duplicate status lines | [ADR-024](../adr/ADR-024-content-standard.md) | `tests/e2e/wp17-9-content-and-ink-census.spec.ts` |
| `R-024-4` | EmptyState has no raised surface and no padding indent: left ink edge aligns with the section heading left ink edge within 1px, renders one sentence <= 12 words plus optional action, and is used consistently across lists, panels, and tab panels | [ADR-024](../adr/ADR-024-content-standard.md) | `tests/e2e/wp17-9-content-and-ink-census.spec.ts` |
| `R-024-5` | Item v2 uses a container query at 480px on its own container: compact (<480px) places full-width title on row 1 (entity names clamped to 3 lines; content titles for questions, rules, and claims never clamp), status (dot + label with >= 4px painted gap) + trailing chevron on row 2, description on row 3, atomic-field meta on row 4, and actions on row 5; regular (>=480px) places title + trailing status/chevron on row 1. Status is omitted in single-status filtered views (Audit tabs, Inbox tabs, Contradictions, Active tokens), and when status is omitted the trailing chevron stays on the title row in both compact and regular layouts (never alone on its own row) | [ADR-024](../adr/ADR-024-content-standard.md) | `tests/e2e/wp17-9-content-and-ink-census.spec.ts` |
| `R-024-6` | Entity status labels obey the closed vocabulary in docs/design/content.md: Booking (Pending, Confirmed, Declined, Cancelled), Token (Active, Revoked), Rule (Pending, Active, Discarded), and Page Revision (newest labelled Current, older rows show no status) | [ADR-024](../adr/ADR-024-content-standard.md) | `tests/e2e/wp17-9-content-and-ink-census.spec.ts` |

## editor

| Rule | Requirement | Source ADR | Enforced By |
| --- | --- | --- | --- |
| `R-010-1` | Admin editor preserves lossless markdown roundtrip and loads route-split editor CSS only on editor routes | [ADR-010](../adr/ADR-010-d-editor-markdown-architecture.md) | `apps/web/src/editor/roundtrip.test.ts` |

## feedback

| Rule | Requirement | Source ADR | Enforced By |
| --- | --- | --- | --- |
| `R-025-1` | Admin uses no toasts; all feedback follows the 9 closed scenarios in docs/design/feedback.md: field-invalid inline replacing helper (aria-invalid + aria-describedby, focus first invalid), action-error danger Notice directly below the trigger section ActionBar (aria-live=assertive, scrolled into view), action-success without follow-up as StatusLine below ActionBar (not a green Notice, cleared on dirty), secret-bearing success as a single Credential container with its own header line ('Shown once. Save it now.', warning icon + secondary text) in trigger section (amended WP-17.14 D7), state-derived warning Notice directly above ActionBar, destructive confirmation via Overlay dialog, page-level failure as page-top danger Notice with Retry, in-progress disabling trigger with Saving…/Checking… + aria-busy, and empty/idle via EmptyState | [ADR-025](../adr/ADR-025-feedback-placement-and-timing.md) | `tests/e2e/wp17-9-content-and-ink-census.spec.ts` |
| `R-025-2` | All Notices span full container width (within 1px of container width); server validation errors are mapped to concise copy (at most 3 lines, each <= 12 words, with 'and N more' if truncated; no raw validator dumps); errors never auto-dismiss and clear only on next edit or retry | [ADR-025](../adr/ADR-025-feedback-placement-and-timing.md) | `tests/e2e/wp17-9-content-and-ink-census.spec.ts` |
| `R-025-3` | One-time secrets (TOTP manual key, recovery codes, API tokens) render via the registered Credential component (variants single and list) as ONE bordered container: an internal header line ('Shown once. Save it now.', warning icon + secondary text, replacing separate Notice + Credential per WP-17.14 D7), borderless left-aligned monospace codes in 1/2 columns (single wrapping with overflow-wrap:anywhere, manual key grouped in blocks of 4), and Copy/Copy all + Copied StatusLine in the footer; nesting depth of bordered containers <= 2 | [ADR-025](../adr/ADR-025-feedback-placement-and-timing.md) | `tests/e2e/wp17-14-closed-world-audit.spec.ts` |
| `R-025-4` | Every accent-bearing admin role (primary Button fill/label, text Button, Link, focus ring, selected Tab indicator, selected Choice tint/check, native accent-color, EmptyState/Notice links) binds strictly to the derived accent tokens in light and dark themes with zero hard-coded legacy accent ink | [ADR-025](../adr/ADR-025-feedback-placement-and-timing.md) | `tests/e2e/wp17-9-content-and-ink-census.spec.ts` |

## governance

| Rule | Requirement | Source ADR | Enforced By |
| --- | --- | --- | --- |
| `R-003-1` | Admin and public enforce universal accessibility, containment, and isolation floors in Playwright census | [ADR-003](../adr/ADR-003-governance-modes-and-floors.md) | `tests/e2e/wp16-m-public-census.spec.ts` |
| `R-006-1` | Backlog items declare dependencies and owner gates in docs/plans/backlog.yml | [ADR-006](../adr/ADR-006-self-selecting-backlog.md) | `scripts/backlog-next` |
| `R-020-1` | Component registry docs/design/components.json stays synchronized with co-located component sources | [ADR-020](../adr/ADR-020-d-j-component-registry-governance.md) | `scripts/generate-registry` |
| `R-020-2` | Design decisions index and effective rules stay synchronized with docs/adr/ front matter | [ADR-020](../adr/ADR-020-d-j-component-registry-governance.md) | `scripts/generate-decisions` |
| `R-020-3` | Every accepted ADR rule links to a valid enforcement guard/test or explicit manual review | [ADR-020](../adr/ADR-020-d-j-component-registry-governance.md) | `scripts/generate-rules` |
| `R-022-1` | Design system payload budgets and token inventory are tracked in docs/design/health.md and guarded against regression | [ADR-022](../adr/ADR-022-d-l-consolidation-health-changesets.md) | `scripts/ds-health` |
| `R-022-2` | Changes to UI packages require a .changeset entry and up-to-date package CHANGELOG.md files | [ADR-022](../adr/ADR-022-d-l-consolidation-health-changesets.md) | `scripts/verify-changeset` |
| `R-022-3` | All consolidation DoD criteria pass together under pnpm wp16n:verify | [ADR-022](../adr/ADR-022-d-l-consolidation-health-changesets.md) | `scripts/wp16n-verify` |

## layout

| Rule | Requirement | Source ADR | Enforced By |
| --- | --- | --- | --- |
| `R-009-1` | Zero horizontal overflow across 320px, 1280px, and 1920px viewports in both admin and public | [ADR-009](../adr/ADR-009-d-layout-grid-and-breakpoints.md) | `tests/e2e/wp16-r-style-census.spec.ts` |
| `R-013-1` | Admin and public pages preserve single H1 hierarchy and tokenized section spacing rhythm | [ADR-013](../adr/ADR-013-d-sections-rhythm.md) | `tests/e2e/wp16-g-census.spec.ts` |
| `R-021-1` | List items align flush with parent section boundaries (replaces legacy D-H negative bleed) | [ADR-021](../adr/ADR-021-d-k-item-flush-alignment.md) | `tests/e2e/wp16-g-census.spec.ts` |

## public-language

| Rule | Requirement | Source ADR | Enforced By |
| --- | --- | --- | --- |
| `R-007-1` | Public neutrals stay strictly chroma-neutral (OKLCH chroma <= 0.01) with real self-hosted WOFF2 editorial fonts and CJK :lang(zh) support | [ADR-007](../adr/ADR-007-public-direction-quiet-editorial-neutral.md) | `packages/design-tokens/src/rules.test.ts` |

## settings

| Rule | Requirement | Source ADR | Enforced By |
| --- | --- | --- | --- |
| `R-011-1` | Admin settings groups and fields are declared in the central typed settings registry | [ADR-011](../adr/ADR-011-d-settings-arch-registry.md) | `apps/web/src/settings/registry.test.ts` |

## testing

| Rule | Requirement | Source ADR | Enforced By |
| --- | --- | --- | --- |
| `R-017-1` | All 42 admin states and 16 public states pass automated multi-viewport, dual-theme census with zero violations | [ADR-017](../adr/ADR-017-d-g-contact-sheet-census.md) | `tests/e2e/wp16-r-style-census.spec.ts` |

## tokens

| Rule | Requirement | Source ADR | Enforced By |
| --- | --- | --- | --- |
| `R-002-1` | Every token pack declares and satisfies mathematical scale rules and AA contrast in light and dark themes | [ADR-002](../adr/ADR-002-scale-rules-and-packs.md) | `packages/design-tokens/src/rules.test.ts` |
| `R-004-1` | Spacing tokens preserve monotonic proximity hierarchy (inline <= label-to-control < field < subsection < section) | [ADR-004](../adr/ADR-004-spacing-taxonomy-and-tiers.md) | `packages/design-tokens/src/drift.test.ts` |
| `R-005-1` | Zero unresolved token aliases, zero emitted primitives, and full CSS custom property closure | [ADR-005](../adr/ADR-005-token-tiers-and-closure.md) | `scripts/verify-css-variables` |

## visual-discipline

| Rule | Requirement | Source ADR | Enforced By |
| --- | --- | --- | --- |
| `R-008-1` | Avoid decorative chrome and redundant containers; rely on whitespace and hairline rules for structure | [ADR-008](../adr/ADR-008-d-min-quiet-restraint.md) | `manual review` |
| `R-016-1` | Zero hard-coded color, spacing, or timing literals outside token sources and zero inline style= attributes | [ADR-016](../adr/ADR-016-d-final-visual-polish.md) | `scripts/verify-ui-guards` |
