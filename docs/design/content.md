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
| Section description | **Banned (D2)** | Section intro text is banned. Move operational consequences to `consequence` directly above the section's `ActionBar` (tier `S2` gap), or delete. |
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

## Text Roles & Label-Free Value Clarity (A6)

Every value shown to the owner must carry its own clear, label-free meaning — never bare fields separated only by spaces:
- **Date / time:** include a contextual prefix when ambiguous (e.g. `Received 24 Nov`, `Created 24 Nov 2026`, `Last checked 26 Nov 2026, 11:44`).
- **Timezone:** scheduled slots always show both date and timezone (e.g. `Tue 3 Dec, 10:00 UTC · 18:00 your time`).
- **Who:** requester name or author stands on its own line/slot, separate from email or timestamps.
- **What:** topic, question, or claim is distinct from its source (`From {Entry title}`) and its likelihood/confidence (`84% likely conflict`).
- **Never** concatenate unrelated bare values with spaces (e.g. `Alex alex@example.com Tue 10am`). Use explicit rows, `·` separators with context, or dedicated detail fields.

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

## Media Metadata Privacy Limitation (WP-18.3a)

Uploaded JPEG, PNG, and WebP images have EXIF, GPS, IPTC, and XMP metadata stripped automatically without re-encoding. **Video metadata is not stripped on upload** — this limitation is surfaced as a consequence line (`Video metadata isn't removed on upload.`) directly above the `ActionBar` in the video upload dialog.

## Closed Text Purposes (WP-17.13 D2)

Every visible text node on admin screens carries an explicit `data-purpose` from the closed set:

| Purpose | Meaning | Allowed Placement |
| --- | --- | --- |
| `title` | Page, section, subsection, item, or empty-state heading | `h1`, `h2`, `h3`, `.lp-item-title` |
| `label` | Field label, choice label, or definition term | `<label>`, `<dt>`, segment label |
| `value` | Body copy, item content, claim quote, or definition value | `<dd>`, `.lp-body`, `.lp-item-body`, `blockquote` |
| `helper` | Format, range, recommended value, or resolution rule | Below control (field help) or above list (legend) |
| `consequence` | Operational or irreversible effect of an action | Directly above its `ActionBar` inside `.lp-action-group` (`S2` gap) |
| `status` | Closed-vocabulary entity state or panel state headline | `StatusLabel`, panel headline |
| `feedback` | Post-action result, validation error, or alert | Below `ActionBar` (`S3` gap) or below invalid field (`S2` gap) |
| `empty` | Empty-state single sentence | `.lp-empty-body` |
| `meta` | Timestamps, provenance, subtitles, secondary identifiers | `.lp-item-meta`, `.lp-item-subtitle`, `.lp-item-claim-eyebrow` |
| `intro` | Page-level orientation line (omitted when redundant) | Page header only (never section-level) |

## Route Text Purpose Audit Table (WP-17.13 D2)

| Route | Text Node | Purpose | Disposition |
| --- | --- | --- | --- |
| `/admin/settings/account` | `Password, authenticator, tokens, and sessions` | `intro` | **Deleted** (redundant section list) |
| `/admin/settings/account` | `Current authenticator stays active until you confirm a new code.` | `consequence` | **Moved** from section intro to `.lp-action-group` above `Re-enrol app` |
| `/admin/settings/account` | `Regenerating invalidates all older recovery codes immediately.` | `consequence` | **Moved** from section intro to `.lp-action-group` above `Regenerate codes` |
| `/admin/settings/account` | `Shown once when generated.` | `helper` | **Deleted** (covered by `Credential` Notice when shown) |
| `/admin/settings/account` | `Shown once when created.` | `helper` | **Deleted** (covered by `Credential` Notice when shown) |
| `/admin/settings/account` | `Signs out all other browsers and devices immediately.` | `consequence` | **Moved** from section intro to `.lp-action-group` above `End sessions` |
| `/admin/settings/account` | `Minimum 12 characters.` | `helper` | **Kept** below `New password (optional)` |
| `/admin/settings/account` | `Enter this key if you can't scan the code.` | `helper` | **Kept** inside `Credential` manual key block |
| `/admin/settings/answering` | `When paused, new visitor questions wait in Inbox.` | `helper` | **Moved** from section intro to choice option description |
| `/admin/settings/answering` | `Recommended 0.82. Higher sends more questions to Inbox.` | `helper` | **Kept** below `Direct quote threshold` |
| `/admin/settings/answering` | `Recommended 0.55. Higher requires stronger multi-entry matches.` | `helper` | **Kept** below `Summary answer threshold` |
| `/admin/settings/answering` | `Recommended 0.90. Higher narrows topic matching.` | `helper` | **Kept** below `Topic match threshold` |
| `/admin/settings/appearance` | `Public site styling applies in a future release.` | `meta` | **Moved** from section intro to `Text[data-purpose="meta"]` |
| `/admin/settings/appearance` | `Hex format (#RRGGBB). Light and dark ramps derive automatically.` | `helper` | **Kept** below `Accent seed` |
| `/admin/settings/appearance` | `Arbitrary CSS properties are rejected.` | `helper` | **Kept** below `Theme pack JSON` |
| `/admin/settings/backups` | `Download all entries and metadata as a portable archive.` | `intro` | **Deleted** (restates heading and button) |
| `/admin/settings/backups` | `Exporting never modifies live entries.` | `consequence` | **Moved** to `.lp-action-group` above `Download archive` |
| `/admin/settings/visibility` | `Changes update crawler rules immediately.` | `consequence` | **Moved** from section intro to `.lp-action-group` above `Save` |
| `/admin/calibration` | `Self-tuning switches, proposals, and rollback history.` | `intro` | **Deleted** (redundant section list) |
| `/admin/calibration` | `Adjustments require 20 samples and step at most 0.05.` | `consequence` | **Moved** from section intro to `.lp-action-group` above `Save switches` |
| `/admin/structure` | `Entry profiles and private detail exclusions.` | `intro` | **Deleted** (redundant section list) |
| `/admin/structure` | `Matched terms require confirmation before publishing.` | `helper` | **Moved** from section intro into `Excluded terms` field helper |
| `/admin/bookings/:id` | `Status changes here only. The visitor isn't notified.` | `consequence` | **Moved** from post-action helper to `.lp-action-group` above Confirm/Decline/Cancel |
| `/admin/bookings/:id` | `Pending · {date}` | `meta` | **Kept** as single-line `secondary` history entry |
| `/admin/audit?status=contradictions` | `Keep newer stops answers using the older claim. Keep both leaves both.` | `helper` | **Kept** in `secondary` role above conflict list |
| `/admin/audit?status=contradictions` | `Same date. Edit an entry to resolve.` | `helper` | **Added** when `Keep newer` is disabled on equal timestamps |
| `/admin/entries/new` | `Choose who can view this entry.` | `intro` | **Deleted** (restates `Visibility` heading) |
| `/admin/entries/new` | `Slug, type, date, and precision.` | `intro` | **Deleted** (redundant field list) |
| `/admin/entries/new` | `Tags, suggested roles, claims, and evidence.` | `intro` | **Deleted** (redundant subsection list) |
| `/admin/entries/new` | `Passages that may play a role in your story. Accept to label one, or ignore it.` | `intro` | **Deleted** (subsection intro banned) |
