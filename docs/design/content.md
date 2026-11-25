# Admin Content Standard

> Governed by [ADR-024](../adr/ADR-024-content-standard.md) (owner direction 2026-11-25: **remove rather than add**). Enforced on the rendered DOM by `tests/e2e/wp17-9-content-and-ink-census.spec.ts`.

## Core Principle

Remove rather than add — without stripping operational guidance. Every word on an admin screen must earn its place by clarifying an unfamiliar concept, specifying a format/range, stating a recommended value, or warning of a non-obvious consequence. Never explain what a heading or field label already states.

## Role Caps & Floor Rule

| UI Role | Cap | Rule |
| --- | --- | --- |
| Page title | Noun | Concise noun (e.g. `Audit`, `Pages`, `Appearance`, `Settings`). |
| Page description | `<= 14` words (1 line) | Omit if the title is self-explanatory. **Omitted on Settings index.** |
| Settings index module summary | `<= 6` words | Describe purpose, not a field list (e.g. `Automatic replies and thresholds`). |
| Section description | `<= 16` words (1 sentence) | Optional; omit if heading and fields are self-explanatory. |
| Field helper | `<= 12` words | For format, unit, range, recommended value, or consequence. Never restate the label. |
| Empty state | `<= 12` words (1 sentence) | Plus optional single action. No raised surface, no indent (`D4`). |
| Notice | `<= 2` sentences | Concise warning, error, or confirmation. Success notices follow an event only (never static). |
| Button | `<= 2` words | Verb + object, sentence case (e.g. `Save`, `Run check`, `Import pack`). |
| Default route static prose budget | `<= 60` words | Sum of static prose across counted prose roles (shrinking-only; max 3 recorded exemptions). |

### Information Floor Rule (Not Only Caps)

A numeric or consequential control **must** retain its recommended value or operational consequence in its helper or section description (within the 12-word helper / 16-word section description cap). Examples:
- Threshold controls state both the recommended value and directional effect (e.g. `Recommended 0.82. Higher sends more questions to Inbox.`).
- Irreversible or external-facing controls (crawler indexing, backup destination, fallback mode, session revocation, recovery code regeneration) state their consequence clearly.

## Tab Panels & State Messages

- A tab panel **never** repeats its active tab label as a heading inside the panel.
- Each view state renders **exactly one** status or empty-state line (never duplicated between an empty-state paragraph and a live status banner).

## Closed Status Vocabulary

Every `StatusLabel` (`data-c="StatusLabel"`) on an entity must come from that entity's closed vocabulary (enforced by census):

| Entity | Allowed Status Labels |
| --- | --- |
| **Booking** (`/admin/bookings`) | `Pending`, `Confirmed`, `Declined`, `Cancelled` |
| **API Token** (`/admin/settings/account`) | `Active`, `Revoked` |
| **Answer Rule** (`/admin/audit`) | `Pending`, `Active`, `Discarded` |
| **Page Revision** (`/admin/pages`) | Newest revision labelled `Current`; older revisions show **no** status |

## Date & Time Format

All rendered timestamps use the single formatter in `@living-portfolio/ui-core` (`formatAdminDateTime` / `formatAdminDate`) in the viewer's local timezone:
- **Date and time:** `25 Nov 2026, 14:29` (24-hour clock, no seconds)
- **Date only:** `25 Nov 2026`
- ISO-like date strings (`YYYY-MM-DD`) are **banned** in rendered admin text.

## Static Prose Word Metric Definition

The census word-budget metric counts visible static prose words inside `<main>` on the default state of each route (desktop light), defined as the union of these rendered roles/selectors:

1. **Page description**: `.lp-page-description`
2. **Section descriptions**: `.lp-form-section-desc`, `.lp-form-section-description`
3. **Field helpers**: `.lp-help-text`, `.lp-field-help`
4. **Empty state body**: `.lp-empty-state .lp-empty-body`
5. **Visible notices**: `.lp-notice` (excluding hidden notices)
6. **Static body/caption text**: `[data-c="Text"]` (`p.lp-text`, `p.lp-caption`, `p.lp-body`, `p.lp-description`) that is not already counted in (1)–(5), excluding user-authored content inside `.lp-item` rows, tables, and form controls.

**Explicitly excluded:** headings (`h1`–`h6`), navigation, tabs, field `<label>`s, choice option labels, button text, status labels, counts/badges, and user-authored data. Words are counted by splitting trimmed text on `/\s+/`.

## Superseding Rule on Explain Blocks

All `"How X works"` sections and `"What it does / When to change / Impact"` labels are retired (superseding the 2026-11-06 audit report §6 rule 2). Where a setting has a non-obvious consequence, express it in a single consequence sentence (`<= 20` words) as the page description or as a `Notice`.

## Banned Patterns in Rendered Text

The following must **never** appear in rendered admin DOM text:
- JavaScript coercion leaks: `[object Object]`, `undefined`, `null`, `NaN`
- Internal planning/spec references: `WP-\d`, `ADR-\d`, `<hash>`
- Awkward parenthetical plurals: `(s)`
- Implementation artifacts: source/asset filenames (`.css`, `.ts`, `.json`), API paths (`/api/...`), raw internal IDs
- Raw ISO date strings: `\d{4}-\d{2}-\d{2}`
