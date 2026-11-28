---
id: ADR-024
title: Content Standard and Admin UI Polish Contracts
status: accepted
date: 2026-11-25
supersedes: null
area: content
rules:
  - id: R-024-1
    text: "Admin copy follows the remove-rather-than-add content standard with an operational floor: page description <= 14 words (omitted on Settings index), Settings index summaries <= 6 words, section description <= 16 words, field helper <= 12 words (numeric/consequential controls keep recommended value or consequence), empty state <= 12 words, notice <= 2 sentences (success notices follow events only), buttons <= 2 words sentence case, and default route static prose <= 60 words"
    enforced_by: tests/e2e/wp17-9-content-and-ink-census.spec.ts
  - id: R-024-2
    text: "Rendered admin UI must never contain banned internal tokens ([object Object], undefined, null, NaN, WP-N, ADR-N, <hash>, (s), filenames, API paths, raw IDs, or raw ISO YYYY-MM-DD dates); timestamps use the ui-core formatter (25 Nov 2026, 14:29)"
    enforced_by: tests/e2e/wp17-9-content-and-ink-census.spec.ts
  - id: R-024-3
    text: "Tabs always have an active selected tab matching the URL (unknown values fall back to the first tab), labels are 1-2 short words, painted label ink boxes never intersect or clip, targets are >= 44px, overflowing tablists scroll horizontally with scroll-snap and edge fade, and tab panels never repeat their active tab name as a heading or duplicate status lines"
    enforced_by: tests/e2e/wp17-9-content-and-ink-census.spec.ts
  - id: R-024-4
    text: "EmptyState has no raised surface and no padding indent: left ink edge aligns with the section heading left ink edge within 1px, renders one sentence <= 12 words plus optional action, and is used consistently across lists, panels, and tab panels"
    enforced_by: tests/e2e/wp17-9-content-and-ink-census.spec.ts
  - id: R-024-5
    text: "Item v2 uses a container query at 480px on its own container: compact (<480px) places full-width title on row 1 (entity names clamped to 3 lines; content titles for questions, rules, and claims never clamp), status (dot + label with >= 4px painted gap) + trailing chevron on row 2, description on row 3, atomic-field meta on row 4, and actions on row 5; regular (>=480px) places title + trailing status/chevron on row 1. Status is omitted in single-status filtered views (Audit tabs, Inbox tabs, Contradictions, Active tokens), and when status is omitted the trailing chevron stays on the title row in both compact and regular layouts (never alone on its own row)"
    enforced_by: tests/e2e/wp17-9-content-and-ink-census.spec.ts
  - id: R-024-6
    text: "Entity status labels obey the closed vocabulary in docs/design/content.md: Booking (Pending, Confirmed, Declined, Cancelled), Token (Active, Revoked), Rule (Pending, Active, Discarded), Page Revision (newest labelled Current, older rows show no status), and Media Asset (In use, Unused)"
    enforced_by: tests/e2e/wp17-9-content-and-ink-census.spec.ts
---

# ADR-024: Content Standard and Admin UI Polish Contracts

## Context
During the WP-17 exit review (`L-review` of `wp17-contact-sheets.zip`), several systemic defects appeared across admin pages: verbose "How X works" explain blocks repeating what labels already communicate, leaked internal identifiers (`theme.<hash>.css`, `WP-19/WP-20.1`, `[object Object]`, `(s)` plurals), overlapping tabs at 320px, four inconsistent empty-state treatments (including raised/indented boxes), and divergent `Item` layouts between 1280px and 320px.

The 2026-11-06 UX audit report (§6, rule 2) originally recommended a four-part "Explain before asking" block on every settings module. On 2026-11-25, the owner issued a superseding direction: **remove rather than add**.

## Decision
1. **Superseding owner decision on Explain blocks (2026-11-25):** Every `"How X works"` section and `"What it does / When to change / Impact"` label is deleted across all admin pages and settings modules. Where an action or setting has a non-obvious consequence, keep only one plain consequence sentence (at most 20 words) as the page description or as a `Notice`.
2. **Content standard (`docs/design/content.md`):**
   - **Page header:** Noun title + at most one description line (`<= 14` words), omitted when the title is self-explanatory. Settings index omits the page subtitle entirely.
   - **Settings index descriptions:** Each registered module description is `<= 6` words describing purpose, never a field list (e.g. `"Automatic replies and thresholds"`).
   - **Sections:** Heading + optional single sentence (`<= 16` words); omit when heading and fields are self-explanatory.
   - **Field helpers:** Only for format, unit, range, or consequence (`<= 12` words); never restate the label or repeat a default.
   - **Empty states:** Single sentence (`<= 12` words) + optional action.
   - **Notices:** At most 2 sentences.
   - **Buttons:** Verb + object, `<= 2` words, sentence case.
   - **Banned patterns in rendered DOM:** `[object Object]`, `undefined`, `null`, `NaN`, `WP-\d`, `ADR-\d`, `<hash>`, `(s)`, filenames (`.css`, `.ts`, `.json`), API paths (`/api/...`), raw IDs.
   - **Per-route static prose word budget:** Default state of every admin route has `<= 60` words of static prose across `Text` roles (shrinking-only; at most 3 recorded exemptions with reasons).
3. **Shared component polish contracts (D1–D6):**
   - **D1 Tabs:** Selected tab always exists and equals the URL parameter (unknown values fall back to the first tab). Labels are 1–2 short words, never wrap or overlap, targets `>= 44px`, horizontal scroll with `scroll-snap` and edge fade on overflow, active tab scrolled into view.
   - **D2 Audit:** Page title is `"Audit"` with 4 tabs (`Proposed`, `Active`, `Ignored`, `Contradictions`) in one tablist (`/admin/audit?status=contradictions` preserved).
   - **D3 Contradictions states:** Distinct visible markers + `aria-live` status for `idle`, `running`, `clean`, `found`, `error`, and `resolved`.
   - **D4 EmptyState:** No raised surface, no padding indent; left ink edge equals section heading left ink edge (`<= 1px`).
   - **D5 Item anatomy:** Uniform at 1280px and 320px: row 1 = title + trailing status (dot + text + chevron if navigable); row 2 = description; optional meta; trailing item actions per `D-L1`.
   - **D6 Home statement:** Single source of truth in Settings > Home (`/admin/settings/home`); removed from `/admin/pages` tabs.

## Consequences
- All admin pages are rewritten to conform to `docs/design/content.md`.
- Automated rendered-DOM content and painted-ink census checks (`tests/e2e/wp17-9-content-and-ink-census.spec.ts`) enforce `R-024-1`..`R-024-5` on every admin route across 1280px/320px and light/dark themes.
