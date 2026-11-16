# Design Foundations Specification (L017)

- **Document ID**: L017
- **Class**: L (Reference & Living Specification)
- **Status**: active
- **Work Package**: WP-15.3a (Design Foundations)

This specification defines the authoritative visual, structural, and interactive design foundations (`D-FOUND-1` through `D-FOUND-6`) for the Living Portfolio admin workspace and component primitives. Every primitive (`apps/web/src/primitives/*`), feedback and container component (`apps/web/src/components/*`), and admin workspace surface must conform to these rules and pass the automated computed-style and DOM conformance suite (`tests/e2e/wp15-3a-design-foundations.spec.ts`).

---

## D-FOUND-1: Icons & Iconography

1. **Self-Hosted Open-Licence SVG Sprite**:
   - All icons are rendered from a single self-hosted inline SVG sprite (`#lp-icon-sprite`) derived from the **Lucide** icon set under the **ISC Licence**:
     > Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted, provided that the above copyright notice and this permission notice appear in all copies.
   - All icons use a `24×24` coordinate grid (`viewBox="0 0 24 24"`), `fill="none"`, `stroke="currentColor"`, `stroke-width="2"`, `stroke-linecap="round"`, and `stroke-linejoin="round"`.
2. **Allowed Sizes**:
   - Icon dimensions are strictly restricted to `{16, 20, 24}` px (`width` and `height` attributes and computed CSS box).
3. **Zero Text Glyphs & Theme Toggle Rule**:
   - Text characters (`×`, `✕`, `▾`, `▸`, `◐`, `...`) are never used as icons. They are replaced by SVG symbols (`x`, `chevron-down`, `chevron-right`, `moon`, `sun`, `more-horizontal`, `menu`, `info`, `check-circle`, `alert-triangle`, `alert-circle`, `copy`, `plus`, `file-text`, `layers`, `loader`).
   - **Theme Toggle Rule**: The theme toggle button always displays the icon of the mode you will switch **to** (`moon` when in light mode with `aria-label="Switch to dark theme"`, and `sun` when in dark mode with `aria-label="Switch to light theme"`), never a half-circle (`◐`).
4. **Icon Surfaces & Button Variants**:
   - **Bare icon**: Sits inline next to text or inside a status surface (`Notice`, `StatusLine`, `Badge`).
   - **Ghost icon button (`.lp-icon-btn-ghost`)**: No border (`0px`), transparent background at rest (`rgba(0, 0, 0, 0)`), subtle fill on `:hover`, `:focus-visible`, and `:active`. Hit area is `32×32 px` on desktop (`44×44 px` default target) and at least `44×44 px` on touch/mobile viewports (`< 768 px`). Used for secondary utilities (dismiss, overflow menu trigger, copy).
   - **Outlined icon button (`.lp-icon-btn-outlined`)**: `1 px` `--border-control` border, transparent/surface background at rest, used **only** when standing alone in a header or toolbar on a plain surface (such as the header theme toggle or mobile menu button).
   - **Filled icon buttons are prohibited**: Primary and destructive actions always carry visible text labels.
5. **Accessibility & Tooltips**:
   - Every icon-only control (`IconButton`) must provide both an accessible name (`aria-label`) and a visible tooltip (`role="tooltip"` / `title`) revealed on hover and focus.
6. **Dismiss, Disclosure & Status Conventions**:
   - **Dismiss**: Always a `16 px` ghost `x` icon button positioned at the top right of its container.
   - **Disclosure & Menus**: Use a `16 px` `chevron-down` SVG icon that smoothly rotates `180deg` when expanded (`aria-expanded="true"` or `[open]`); the entire summary row is the interactive hit target.
   - **Status Icons**: Tone-specific icons (`info`, `check-circle`, `alert-triangle`, `alert-circle`) accompany every notice and status line tone so colour is never the sole cue.

---

## D-FOUND-2: Shape, Borders, Fill Hierarchy & Elevation

1. **Four Radius Tokens Only**:
   - `--radius-control: 8px` — buttons, inputs, textareas, selects, icon buttons, segmented buttons.
   - `--radius-container: 12px` — cards, notices, popovers, dropdown menus, empty states.
   - `--radius-overlay: 16px` — modal dialogs, sheets, drawers.
   - `--radius-pill: 999px` — non-interactive badges, interactive filter chips, switch tracks/thumbs, status dots.
2. **No Bordered Box Inside a Bordered Box**:
   - A bordered container (card, notice, dialog, empty state) must never contain a nested 4-sided bordered container or bordered button inside a notice. Sections inside a card or container are separated strictly by `1 px` hairline horizontal dividers (`border-top` or `border-bottom` using `--border-subtle`).
3. **Border Tokens & Contrast**:
   - `--border-subtle` (`1 px`): Used for non-interactive containers, cards, and hairline section dividers.
   - `--border-control` (`1 px`): Used for interactive controls at rest (inputs, selects, secondary buttons, outlined icon buttons, filter chips). Must maintain at least **3:1** contrast ratio against `--bg-surface` in both light and dark themes.
   - **Focus Ring**: `2 px solid var(--focus-ring)` with `2 px` `outline-offset` (`>= 3:1` contrast against surface).
4. **Fill Hierarchy**:
   - **Primary (`primary`)**: Solid high-contrast fill (`--role-action-bg` / `--accent`), contrasting foreground text.
   - **Secondary (`secondary`)**: Outlined (`1 px solid var(--border-control)`), surface background, subtle fill on hover/active.
   - **Tertiary / Quiet (`quiet`)**: Ghost at rest (`0 px` border, transparent fill), subtle fill (`--bg-subtle`) on `:hover`, `:focus-visible`, and `:active` so interactive affordance is unmistakable.
   - **Danger (`danger`)**: Outlined (`1 px solid var(--role-danger-border)`) when placed inside menus, toolbars, or triggers; solid filled (`--role-danger-bg` with high-contrast text) **only** on the final confirmation button inside a confirmation dialog.
5. **Badge vs Chip Distinction**:
   - **Badge (`.lp-badge`)**: Non-interactive `<span>`, pill radius (`--radius-pill: 999px`), tinted role background (`--role-*-bg`), role foreground text (`--role-*-fg`), **zero border** (`border: 0`). Nothing non-interactive may look like a button.
   - **Chip (`.lp-chip`)**: Interactive `<button>` (e.g. filter pill with `aria-pressed`), pill radius (`--radius-pill: 999px`), `1 px` border (`--border-control` at rest, role border when active).
6. **Elevation**:
   - Flat (`box-shadow: none`) for all in-flow content (cards, notices, fields, disclosures).
   - Raised (`--shadow-overlay`) only for floating overlays (menus, dialogs, drawers).

---

## D-FOUND-3: Spacing Scale & Layout Grid

1. **4 px Base Spacing Scale**:
   - Allowed spacing steps: `4px`, `8px`, `12px`, `16px`, `24px`, `32px`, `48px`, `64px` (`--space-1` through `--space-16`).
   - Semantic aliases:
     - `--space-inline: 8px`
     - `--space-field: 16px`
     - `--space-section: 32px`
     - `--gutter: 16px` below `768 px` viewport width, and `24px` at `768 px` and above.
   - Card padding is `16px` or `24px` only. No arbitrary spacing pixel literals outside the token scale.
2. **Single Admin Workspace Grid**:
   - Desktop split layout (`>= 768 px`): Entry list column fixed at `260 px` (`--layout-list-col: 260px`), main workspace column constrained to `max-width: 720px` (`--layout-main-max: 720px`, ~72 characters).
   - Every workspace state (`empty`, `first-run`, `draft`, `error`, `unlisted`, `public`) aligns to the exact same main-column left edge and width.
3. **Reserved Feedback Slots (Zero Layout Jump)**:
   - **Page Notice Slot (`.lp-page-notice-slot`)**: Spans the main column width and reserves its vertical slot (`min-height: 48px`) so showing or dismissing a notice does not shift the editor below.
   - **Status Line Slot (`.lp-status-line-slot`)**: Reserves a single-line slot (`min-height: 24px`) directly beneath the action bar.
4. **Responsive Admin Header (`>= 768 px` vs `< 768 px`) & Touch Targets**:
   - At `768 px` and above, the admin header displays the brand title, admin navigation (`Entries`, `Import`, `Settings`, `View public site`), theme toggle button (`moon` in light mode, `sun` in dark mode), and `Sign out`.
   - Below `768 px` **only**, the admin header collapses to the brand title, theme button, and menu button (`Menu` containing navigation and sign-out), so main workspace content starts within `<= 64 px` of the top of the viewport.
   - Every interactive touch target on `< 768 px` viewports measures at least `44×44 px`.

---

## D-FOUND-4: Typography & Colour Roles

1. **Type Scale Roles**:
   - `caption`: `12px / 16px` (`--type-caption-size: 12px`, `--type-caption-line: 16px`)
   - `body-sm`: `14px / 20px` (`--type-body-sm-size: 14px`, `--type-body-sm-line: 20px`)
   - `body`: `16px / 24px` (`--type-body-size: 16px`, `--type-body-line: 24px`)
   - `title`: `20px / 28px` (`--type-title-size: 20px`, `--type-title-line: 28px`)
   - `page-title`: `28px / 36px` (`--type-page-title-size: 28px`, `--type-page-title-line: 36px`)
   - Allowed font weights: `400` (regular), `500` (medium), `600` (semibold). Field labels use `14px / 20px` at weight `500`.
2. **Reading Face & Auto-Growing Writing Surface**:
   - The entry body writing surface (`textarea.lp-writing-surface`) uses the public reading serif font stack (`--font-reading`) at `16px / 24px` and reading measure (`--measure-reading: 68ch`), matching the published portfolio reading experience.
   - The writing surface starts at a minimum of `6` rows (`min-height: 144px`) and grows automatically with its content without clipping text at any viewport width (including `320 px`).
3. **Six Semantic Colour Roles & Computed Contrast Ratios**:
   - Roles: `action`, `neutral`, `success`, `warning`, `danger`, `info`.
   - Each role defines `--role-<name>-fg`, `--role-<name>-bg`, and `--role-<name>-border` in both light and dark themes.
   - **Contrast Guarantees** (computed and displayed as actual numeric ratios e.g. `"8.5:1"` in the gallery and verified in Playwright in both light and dark themes):
     - Text (`--role-<name>-fg` on `--role-<name>-bg`, and `--text` on `--surface-raised`): **>= 4.5:1**.
     - UI control boundaries (`--border-control` on `--surface-raised`) and focus rings (`--focus-ring` on `--surface-raised`): **>= 3.0:1**.

---

## D-FOUND-5: Interactive States & Motion

1. **Complete State Coverage, Loading & Disabled Tooltips**:
   - Every interactive primitive implements `default`, `hover`, `focus-visible`, `active`, `disabled`, `loading`, and `error` (where applicable).
   - **Loading Button**: Retains full text contrast (`opacity: 1`, `>= 4.5:1`) and renders an inline `16 px` animated spinner icon (`loader`) beside the label (label unchanged or `"Saving…"`).
   - **Disabled Control Tooltip**: Per `D-CONTRACT-6`, any disabled control must expose an explicit human-readable reason via a tooltip (`role="tooltip"`) revealed on both `:hover` and `:focus-within`, or be omitted from the DOM.
2. **Motion**:
   - Transitions run for `150ms` to `200ms` (`--duration-base: 160ms ease`) and animate **only** `opacity` and `transform` (plus colour/border state changes).
   - `@media (prefers-reduced-motion: reduce)` disables animations and instant-snaps transitions (`transition-duration: 0.01ms !important; animation-duration: 0.01ms !important`).

---

## D-FOUND-6: Component & Workspace Patterns

1. **Page Notice (`Notice`)**:
   - Structure: `16 px` tone SVG icon + concise text + at most one **link-style text action** (`.lp-notice-action-link`, never a bordered button) + `16 px` ghost `x` dismiss icon button at top right.
   - Alignment & Width: Spans the main column width. The `16 px` tone icon and the first line of text (`20 px` line-height) are vertically centred on the same alignment rule (`<= 2 px` centre offset).
   - Scope: Used **only** for whole-page conditions (offline, expired session, storage conflict).
   - **Save Failure & Message Exclusivity Rule**: Only one message is active at a time. A failed field validation or save error is **never** rendered as a page notice: it appears in the `StatusLine` (`"Enter a title to save this entry."` — never using directional words `"above"` or `"below"`) plus the field error directly under the field.
2. **Status Line (`StatusLine`)**:
   - Structure: `16 px` tone SVG icon (vertically centred with the first line of text) + status text + optional inline link-style action (`.lp-status-undo-link`, e.g., `Undo (8s)` with a real live countdown) sitting **directly after** its message at every viewport width (including `320 px`).
3. **Disclosure (`Disclosure`) & Details Field Layout**:
   - Structure: Hairline top divider (`1 px solid var(--border-subtle)`) + full-width summary row with a `16 px` rotating chevron + collapsible body. Never a 4-sided bordered card inside another card.
   - The `Details` summary row in the editor (`14 Nov 2026 · Exact date · Case Study`) never repeats the entry lifecycle state (`Draft` / `Unlisted` / `Public`), which is shown once in the editor header (`UX-78`).
   - Inside `Details`, the metadata fields (`slug`, `role profile`, `visibility`, `date`, `temporal confidence`) lay out in **1 column below `768 px`** and **2 columns at `768 px` and above**; the date field is never narrower than its content, and select values are never truncated.
4. **Empty State & First-Run Guide (`EmptyState`)**:
   - Renders inside the main workspace column at the standard left edge and width, with **one** primary call-to-action button.
   - When the first-run guide is shown, its steps live **inside** the `EmptyState` container using an ordered list (`<ol class="lp-empty-guide-steps">`) whose items do not include duplicate manual step numbers (`"1. 1."` is prohibited).
5. **Entry List Header & Non-Wrapping Labels**:
   - The sidebar list header displays the heading `"Entries"` beside a pill count `Badge` (`"0"`, `"1"`, `"2"`), never `"Entries (0 entries)"`, and renders the matching number of `EntryRow` items below.
   - Button and badge labels enforce `white-space: nowrap` so labels never wrap across lines.

---

## D-MIN: Minimal Visual Reset (Supersedes Conflicting D-FOUND-2, D-FOUND-3, D-FOUND-4)

Where `D-MIN` conflicts with `D-FOUND-2`, `D-FOUND-3`, or `D-FOUND-4`, `D-MIN` supersedes them:

1. **Remove rather than restyle**: An element stays only if a journey step in `docs/plans/front-end-acceptance.md` needs it.
2. **Radius & shadows**: `4 px` (controls, inputs, tabs, menu items) and `8 px` (menus, dialogs, drawers). No pills or `999 px`, except status dots. No shadows except on overlays.
3. **Control height & theme toggle**: All controls are `36 px` high (buttons, inputs, selects, dropdown triggers, icon buttons as `36 × 36`), with the same border and radius; the hit area grows to `44 px` on coarse pointers by padding, not by changing the look. The theme toggle lives in the Account menu.
4. **State label & counts**: State label is a `6 px` dot in the state colour plus plain text (`Draft` grey, `Unlisted` amber, `Public` green), one component used everywhere. Counts are plain text, no badge.
5. **Tabs**: One component, text with a `2 px` underline on the active tab, a single row. Boxed or pill tabs and step boxes are not used.
6. **Containers & borders**: No card around a whole page section. Sections separated by whitespace and a `1 px` hairline. Borders only on inputs, menus, and dialogs; no dashed borders; no nested containers.
7. **Spacing scale**: `4, 8, 16, 24, 40, 64` px; `16 px` between related items, `24 px` between groups, `40 px` between sections; page padding `24 px` (`16 px` below `768 px`).
8. **Typography**: One sans family for the whole admin; serif only in the writing surface and public reading text; sizes `12, 14, 16, 24` px; weights `400` and `600`; monospace only for code and keys; never show raw JSON or internal ids.
9. **Colour**: Neutrals plus one accent; status colours only for dots and text; tinted backgrounds only for the selected row and warning or error notices.
10. **Buttons**: One primary per view; secondary outlined; quiet text.
11. **Help**: No explainer cards; one line of help under a field; one line of page description.
12. **Navigation**: Render only items whose pages exist. The editor screen holds only the list, the editor, and the optional structure panel.
13. **Enforcement (style census, Playwright, every admin page × 2 themes × 1280 and 320 px)**: Computed radii are in `{0, 4, 8}` (dots excepted); every control is `36 px` high; font sizes are in `{12, 14, 16, 24}`; each role (state label, tab, button, icon button, input, select) has exactly one computed look across all pages; spacing values are in the scale; no inline styles; budgets live in a file that only shrinks (`docs/audits/style-census-budget.json`). Ratios and per-role signatures are printed in the report.

---

## D-LAYOUT: Layout and Editor Reset (Supersedes Conflicting Parts of D-MIN and D-FOUND)

Where `D-LAYOUT` conflicts with `D-MIN` or `D-FOUND`, `D-LAYOUT` supersedes them:

1. **Shell**: Top bar only (`48 px`, `1 px` hairline below), no sidebar anywhere. Left: launcher icon button (grid icon, `36 × 36`) plus product name. Right: site status (dot icon button with menu) and account (user icon button with menu: theme, sign out). The launcher opens a panel (popover from `768 px` up, full-width sheet below) listing the existing destinations in one column, grouped: Write (`Today`, `Entries`, `Import`), Respond (`Inbox`), Govern (`Answer rules`), Configure (`Settings`), plus `View public site`; each item has an icon and label; the current one is marked. `Esc` closes, arrow keys move, focus returns to the trigger. Render only pages that exist. The launcher list is built from a registry so a new page appears by registering it.
2. **One page template (every page except the editor)**: Single centred column, max width `720 px`, padding `24 px` (`16 px` below `768 px`), `h1` at the same top offset on every page (`40 px` below the top bar), optional one-line description, `24 px` between the title block and content, `40 px` between sections. One page background colour; no grey canvas; no cards or boxes around sections; hairlines and whitespace only. A tab list is followed by a `24 px` gap.
3. **One List row component**: Used for Entries, Inbox, Answer rules, History, Today, the entry drawer, and the Settings index. Primary text, optional one-line secondary text, a right-aligned trailing slot for the state label (dot plus text), vertically centred, hairline separators, the whole row is the click target, hover tint. No per-row buttons. Status always sits in the trailing slot.
4. **One Select primitive**: Native appearance removed, a `16 px` chevron icon `12 px` from the right edge, `36 px` right padding, identical in every dropdown on every page.
5. **Colours from theme tokens only**: Inputs, textareas, and selects use input tokens per theme (no hard-coded white or hex anywhere). One page background and one surface colour per theme; tinted backgrounds only for the selected row and warning or error notices.
6. **Login and setup**: No card; centred `360 px` column. The step indicator is the text `"Step 1 of 6 · Account"` plus a `2 px` progress line `16 px` below it; no row of six labels. The recovery link is a quiet text button that wraps inside the column.
7. **Today**: No boxes. Three plain sections made of List rows: `Automated answering` (state dot and text, Pause or Resume), `Needs attention`, `Getting started` (a dismiss icon). The per-row `"Open Editor"` button is removed; the row opens.
8. **Editor (`entries-detail` and `entries-new`, same screen)**: Full-screen. Below the top bar, a sticky toolbar:
   - Left: entries icon opening a left drawer (search plus List rows), closed by default.
   - Centre: icon-only formatting buttons with accessible names and tooltips (heading, bold, italic, link, bullet list, quote, code, and a `Source` toggle).
   - Right: state label (click opens the `Visibility` menu: `Draft`, `Unlisted`, `Public`, with `Publish`), a `History` icon (clock; link to `/admin/entries/:id/history`), a `Structure` icon (right drawer, closed by default), a `More` menu (`Delete` only), and `Save` (the one primary text button, with `"No changes to save."` and `"Saved"` messages kept in the toolbar).
   - Below toolbar: borderless `24 px` title field and, on one line under it, the details as plain text opening a popover to edit: date, date precision, type (shown with its section per rule 13).
   - Writing column: centred, max `760 px` for text, `16 px` serif, line-height `1.7`, filling the viewport height; nothing else on screen. Remove the stray `"Structure"` label and duplicate state label.
   - Structure drawer: keeps its current content without step boxes (one text line `"Captured, Tagged, Claimed, Grounded"` with the current step in bold), without explainer text, without dashed containers; add nothing to it.
9. **Editor engine**: Tiptap core (ProseMirror, MIT) only; no paid Tiptap extensions; custom nodes where needed. `body_md` stays the stored value. Markdown shortcuts and pasted Markdown work. The `Source` toggle swaps to a monospace textarea holding the same Markdown. Import uses the same component, `Source` mode by default. Built on a block registry: each block type registers its schema, editor view, Markdown serialiser, public renderer, and export rule. A test fails if a registered block lacks a public renderer or export rule. Round-trip gate: loads every seeded entry and a fixture set (including fixtures for future directives), serialises, and asserts identical normalised Markdown; saving without edits never changes `body_md` (amends `D-05` fallback: do not fall back to a plain source editor). Bundle growth `<= 150 KB` gzip; CSP compatible; keyboard operable; axe clean.
10. **Settings**: `/admin/settings` is an index of List rows built from the `D-SETTINGS-ARCH` registry, each with plain status text such as `"Not set up"`; each module opens `/admin/settings/<id>`, one column, one form, one Save. Initial modules: `Answering`, `Providers`, `Appearance`, `Notifications`, `Backups` (`Home` and `Account` follow in WP-17; `Storage` in WP-18). Plain language only: no spec ids, no section signs (`§`), no `snake_case` values, no `"Tier 1/2"` names; numbers shown with a one-line explanation; alpha notice is one line at the bottom of the index only.
11. **Import, History & Inbox**: Import tabs lose their numerals; History shows a plain-text excerpt with Markdown markers stripped; the Inbox reply box uses the normal input look (sans, not monospace).
12. **Remove rather than add**: Every removed and added element is listed with its reason.
13. **Sections (publishing target)**: Derived from entry type (profile) through configuration, not code: `case-study`, `design-project`, and `decision-record` → `Work`; `freeform` → `Writing`; `dev-log` entries attached to a venture → `Build`; any unmapped type defaults to `Writing`. Shown in three places: editor details line (`"Work · Case study"`), type picker grouped by section, and Publish dialog (`"Will appear in Work at /work/<slug>"`). Adding a new section later is a configuration change plus a public page, with no editor change.

---

## D-EDITOR-3: Target Block Model (for WP-18)

A Notion-class block editor with a slash menu, drag handles to reorder, and block types: paragraph, heading 1 to 3, bullet and numbered list, quote, callout, code, table, divider, link or embed, image, video, and a Columns container of 1 to 4 columns that can hold any block except another Columns container. Dropping an image or video beside another block creates columns. Layout is stored in `body_md` as container directives (`P004` §6.6) that degrade to readable text in plain Markdown; reading order equals source order; columns collapse to one below a container width. Markdown stays canonical. `WP-16.L` (`L2`) builds the editor shell, text blocks, slash menu, toolbar, shortcuts, `Source` toggle, and block registry; `WP-18.2` builds on this editor; `WP-18.5` adds nested Columns and drop-to-columns.

---

## D-SETTINGS-ARCH: Settings Module Architecture

Each settings module is a self-contained unit that registers a manifest: `id`, `title`, one-line `summary`, `icon`, `order`, `route`, a `status` function for the index, a config schema (`zod`) with defaults and a `version`, and its page component. Modules must not import each other; they read and write only their own namespaced config through one settings service, which validates, versions, and migrates. The `/admin/settings` index and launcher render from the registry.

`Appearance` defines a **theme-pack extension point**: a theme pack is a validated set of design tokens (the existing token schema, required keys, contrast checks per `D-FOUND`), selectable and applied globally to admin and public site; built-in `light` and `dark` packs and the existing accent settings ship through it (no pack editor yet). A theme pack with a failing contrast value is rejected with a plain message.

---

## D-STORAGE: Media and Storage Management (WP-18.9)

Registered as a Settings module (`/admin/settings/storage`) under `D-SETTINGS-ARCH` and built in `WP-18` after the media API (`WP-18.3`):
- Shows used space against available space or quota, and storage backend (`local volume` or `S3-compatible`).
- Editable upload limits written to the same configuration store (defaults: image `10 MB`, video `100 MB`, total `5 GB`; allowed types from configuration).
- Media list with thumbnail, size, date, and `"used in N entries (including past revisions)"`.
- Delete allowed only for files no entry or revision references; `"Remove unused"` with a confirmation that states the space freed.
- Quota warning at `80%` on `Today` under `Needs attention`.
- Backups, the backup drill, and Markdown export must include media, with a conformance test that a restored backup renders every image.
