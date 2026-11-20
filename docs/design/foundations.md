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

---

## D-COMP: Component Contract and Mobile Pass (Supersedes Conflicting Parts of D-LAYOUT, D-MIN, and D-FOUND)

Where `D-COMP` conflicts with `D-LAYOUT`, `D-MIN`, or `D-FOUND`, `D-COMP` supersedes them:

1. **Icons**: Fix the sprite so every icon id resolves to its own glyph. The close glyph (`close`) is used only by close buttons. Required icons: `grid` (launcher), `user` (account), `bold`, `italic`, `heading`, `link`, `list`, `quote`, `code`, `source` (code brackets), `clock`, `layers`, `more`, `search`, `chevron-down`, `chevron-left` (back), `check`, `close`. Every icon button's resolved symbol equals the requested name; every toolbar glyph is distinct; an unknown icon id throws in dev and test instead of falling back.
2. **PageHeader (one component, every template page)**: Optional back link (`chevron-left` icon + text) on its own row above the title; `h1` (`24 px`); optional one-line description below it (`14 px`, grey); never the description or any link on the title row. A page-level primary action sits right-aligned on the title row from `640 px` up and below the description at full width under `640 px`. Gaps: back link to title `8 px`, title to description `8 px`, header to content `24 px`.
3. **Item (`ListRow` becomes `Item`)**: Slots in order: leading icon (optional), title (`14 px`, `600`), subtitle (`12 px` grey), body (`14 px`; if several heading-plus-body sets, each is a segment with `8 px` between heading and body and `16 px` between segments), meta (date and time, `12 px` grey), status (dot plus text), actions. From `640 px` up: content left; status and a chevron in a trailing slot aligned to the title line; meta under the subtitle; actions in an `ActionBar` below the body. Under `640 px` every slot stacks in this order: title, subtitle, body, status, meta, actions. The whole row opens on click unless it holds actions. At most two actions per `Item`. Used by Entries, Inbox, Answer rules, History, Today, drawers. Answer rules: the title is the rule as one plain sentence; scope is the subtitle; the source quote is body.
4. **ActionBar (every form, `Item`, dialog and sheet)**: A vertical stack in this order: primary, secondary, optional text button. From `640 px` up each button has the same width (`min 160 px`, `max 240 px`), left-aligned; under `640 px` full width. `16 px` above the bar, `8 px` between buttons. Toolbars, icon buttons, tab rows and the editor toolbar are not `ActionBar`s.
5. **Choice controls**: One `Choice` component for single (radio group) and multiple (checkbox) selection, in two variants.
   - **Button variant**: option label only; multi-select shows a `check` icon left of the label when selected.
   - **Card variant** (use when an option has a description): title, description; multi-select shows the `check` at the far right of the title row; titles wrap to two lines, then truncate with an ellipsis and a tooltip. A single on/off setting is a one-option card.
   - Native input remains in the DOM, visually hidden, for keyboard (arrows in radio groups, space for checkboxes), screen readers and forms; visible focus ring on the `Choice`. Selected: `1 px` accent border, a light tint, `check` icon.
   - **Motion tokens**: `100 ms`, `160 ms`, `240 ms`, one easing, only `transform`, `opacity` and colour; selection animates over `160 ms` (border and tint fade; check scales from `0.8` to `1`); radio selection also cross-fades; `prefers-reduced-motion` removes all of it.
   - Define hover, pressed, focus, disabled and selected for every `Choice`, `Button` and `Item` in the gallery. Native checkbox and radio appearance must not be visible anywhere.
6. **Tabs and Stepper**: `Tabs` are for peer views only (Inbox statuses, Answer rule statuses, Structure drawer): up to `4` tabs with short labels in one equal-width row at `320 px`, never wrapping; `5` or more becomes a `Select`. Sequences (Import: Add, Plan, Review; Setup) use one `Stepper`: the text `"Step 1 of 3 · Add material"` naming the current step plus a `2 px` progress line `16 px` below; no tab-styled steps; no numerals in tab labels.
7. **Overlay primitive (replaces every ad hoc menu, popover and drawer)**: One component with presentation by width.
   - Up to `8` simple actions (account, site status, visibility, more, launcher): popover anchored to its trigger with flip and shift so it never leaves the viewport from `640 px` up, bottom sheet at full width under `640 px`.
   - More than `8` destinations or any need for search: full-screen panel.
   - Decisions and forms (Publish, Delete): modal dialog.
   - All: role and labelling, `Esc` closes, focus trap in dialogs and sheets, focus returns to the trigger, `160 ms` enter and exit, backdrop only for sheets, panels and dialogs. Content comes from registries and renders identically in every presentation.
8. **IA of the shell**: Launcher groups from the registry: `Write` (`Today`, `Entries`, `Import`), `Respond` (`Inbox`), `Govern` (`Answer rules`), `Configure` (`Answering`, `Providers`, `Appearance`, `Notifications`, `Backups`, from the settings registry), then `View public site`. Remove the Settings index page from the launcher; `/admin/settings` redirects to `/admin/settings/answering`; remove the `"All settings"` link. Account menu: the signed-in name as a non-interactive header, the theme choice, `Sign out`; remove `Settings` and `View public site` from it. Site status menu: status line, the Automated answering switch with a confirmed quick pause (`D-08`; **amended by `D-SYS` #10**: top-bar status dot/menu removed, replaced by `/admin/status` in the `Govern` group), `Rebuild site`.
9. **Settings pages**: `PageHeader` (no extra links), then `FormSection`s. A `FormSection` is a heading (`16 px`, `600`), an optional one-line description, then fields; `8 px` between heading and description, `16 px` to the first field, `16 px` between fields, `40 px` between sections, `24 px` above the `ActionBar`. Boolean settings are one-option `Choice` cards. `Providers`: same `ProviderRow` component as setup step 3 (status, write-only key field never echoed, `"Test key"`, fallback mode); every difference between settings and setup step 3 must be listed in the receipt and closed.
10. **Editor**: The title is the borderless `24 px` field; no gap between the top bar and the toolbar; `Source` is an icon button (`source` icon, pressed state, tooltip `"Markdown source"`); under `640 px` the top toolbar is one row (`entries`, `state`, `history`, `structure`, `more`, `Save`) and the formatting bar is a second single-row, horizontally scrollable bar docked above the keyboard using `visualViewport`, with `Source` inside `More`. Import has no mode toggle: a labelled field `"Paste Markdown or text"`. Visibility uses the `Overlay` primitive.
11. **Entries**: Filters (`State`, `Type`, `Search`) are not boxed; they stack full width under `640 px`; the `Filter` button is removed; `State` and `Type` apply on change and `Search` applies on `Enter` or after `300 ms`. Entries drawer: full-width `"New entry"` primary, then search, then `Item`s (title, then status below).
12. **Today**: `PageHeader`; one section `"Needs attention"` of `Item`s built from existing data only: pending Inbox questions (count), drafts (count), answer rules waiting for confirmation (count), backup not set up, plus a warning row `"Automated answering is paused · Resume"` only when paused. `"Getting started"` shows only until all three steps are done, with a dismiss icon button aligned to the heading line. When nothing is pending: one line, `"Nothing needs your attention."` The Automated answering row is removed (it lives in site status).
13. **Login and Setup**: Login: `Sign in` (primary) first, then the recovery link as a text button below it. Setup: `Back` is a `chevron-left` back link above the step title (`PageHeader` back slot); `Next` is the primary `ActionBar` button at the bottom; option sets are `Choice` cards; the step line names the step (`"Step 2 of 6 · Hosting"`).
14. **Global stacking rule**: Under `640 px`, siblings inside any `Item`, `FormSection`, `PageHeader`, filter group or `ActionBar` never share a row, except an icon with its own label and the tab row. Same elements keep the same horizontal alignment (left) across pages.
15. **Gallery (`/admin/_gallery`)**: Dev and test only route (not in navigation, not in production builds) rendering every `D-COMP` component in every state (`default`, `hover`, `pressed`, `focus`, `disabled`, `selected`, `error`, `loading` where they apply) at `1280 px` and `320 px`.

---

## D-SYS: System Simplification (Supersedes Conflicting Parts of D-COMP, D-LAYOUT, D-MIN, D-FOUND, D-08, and WP-16.C)

Where `D-SYS` conflicts with `D-COMP`, `D-LAYOUT`, `D-MIN`, `D-FOUND`, `D-08`, or `WP-16.C`, `D-SYS` supersedes them:

1. **Spacing ownership**: Components have no outer margin (only `margin: 0` or `auto`). All spacing between components comes from layout containers (`Stack` and `Row` with gap tokens `4, 8, 16, 24, 40, 64` px). Padding inside a component is allowed. `scripts/verify-ui-guards` enforces a guard rule failing on any other `margin` in shared component CSS.
2. **Empty space and lines**: Message regions (feedback places) and any element with no visible content take zero height and zero margin when empty (`aria-live` nodes stay as zero-height). No empty in-flow element has height; the gap between any two adjacent in-flow blocks never exceeds `40 px` (except page top and bottom padding). **Line budget**: a hairline (`border-top`, `border-bottom`, `hr`) is allowed only (a) at the bottom of the top bar and (b) between `Item`s in a list, never before the first or after the last. Every other hairline is removed: editor header line, dividers between `FormSection`s (use `40 px` of whitespace), separators inside menus and sheets (use whitespace or a group label), the two setup dividers, the baseline under `Tabs` (only the active tab's `2 px` underline remains), the rule under the `Stepper` (`2 px` progress line stays as progress, not a divider), and rules around tables (provider rows are `Item`s). Borders on inputs, selects, and secondary buttons are control borders, not lines.
3. **Alignment**: All text is left-aligned (`text-align: start`) everywhere: headings, descriptions, `Item`s, labels, empty states. Centred text only inside buttons and equal-width tab labels.
4. **Widths**: `ActionBar` buttons span the full width of their container at every viewport width (supersedes the `160–240 px` cap in `D-COMP` #4). Templates: `standard` (`720 px`), `narrow` (`400 px`, login only), `editor`. Setup uses the `standard` template and `PageHeader` (single-column title, description below).
5. **BackLink**: One component: `chevron-left` icon plus the visible text `"Back"`, left-aligned, in the `PageHeader` back slot, on every page that goes back (History, Inbox detail, setup steps). Accessible name `"Back to <destination>"`. No arrow characters in any string.
6. **History**: Title `"History"`; description is the entry title; remove the explanatory sentence from the page and move it into the Restore confirmation dialog (`"Restoring adds a new revision at the top. Nothing is lost."`). Each revision is an `Item`: title is the date and time, status `"Latest"` where it applies, body is a two-line plain-text excerpt; no `"exact"` text; `Restore` is the secondary action in the `Item`'s `ActionBar`.
7. **Import**: `Stepper` `"Step 1 of 3 · Add material"` only. Remove the `"Add Existing Material"` heading and the long instruction. One field label `"Markdown or text"` with one help line `"Separate several entries with ---."`. `ActionBar`: `Generate plan` (primary), `Load sample entries` (secondary). No arrows in labels.
8. **One shell**: Exactly one function renders the top bar and page frame for every admin page, including the editor, login, and setup; templates only select content width. The top bar has the same height, padding, element order, and tokens everywhere. Left: launcher icon button plus fixed text `"Admin"`. Before sign-in (login, setup), the same bar renders without the launcher and account button, showing only `"Admin"` and the theme toggle. Delete the second shell and the editor's own header chrome other than the editor header row (rule 11).
9. **Top bar content**: Right group: theme toggle (`sun` or `moon` icon button) and account (`user` icon button). The account menu holds the signed-in name (non-interactive header) and `Sign out` only. No status indicator, no `More`. Icon groups never collapse into a menu: any row has at most three icon buttons plus one primary text button; if a design needs more, report it.
10. **Status (amends `D-08`)**: Remove the top-bar status dot and the status popover completely. Add `/admin/status` in the `Govern` group of the launcher, next to `Answer rules`, through the registry. Title `"Status"`. `Item`s: `Site build` (state, secondary action `Rebuild site`), `Automated answering` (state, `Pause` or `Resume` with the existing confirmation; calls the same API as the Answering setting; one source of truth; both views reflect each other), `Backups` (last drill state, link to `Settings > Backups`), `Providers` (count configured, link to `Settings > Providers`). `Today` shows a `Needs attention` row only when answering is paused or the last build failed.
11. **Editor (`D-EDITOR-4`)**: One header row directly under the top bar, no line below it. Left: panel toggle icon button (open and close variants differ). Centre: a two-option icon switch, `Edit` and `Settings` (tooltips, radio-group semantics; `Edit` default). Right: `History` (clock icon button), `Delete` (trash icon button; typed confirmation dialog stays; destructive colour only on hover and in the dialog), `Save` (the one primary text button; `"No changes to save."` and `"Saved"` messages as now). Nothing collapses; the row fits at `320 px` (`~296 px` of content; if it does not fit, reduce gaps to `4 px` and report). Remove the visibility menu, the structure drawer, the layers icon, the header state label, and the `More` menu. Details line under the title is read-only text: state, section, type, date; clicking it opens the `Settings` view.
    - **Edit view**: Writing canvas plus a floating formatting bar: a pill with `H`, `B`, `I`, link, list, quote, code, and `Source` (icon, pressed state, tooltip `"Markdown source"`), horizontally centred on the writing column (not the viewport), `16 px` above the bottom of the viewport, on the highest layer below dialogs, overlay shadow, hidden while a dialog is open. Below `640 px` it docks above the on-screen keyboard (`visualViewport`), centred with `16 px` side margins, scrolling horizontally with edge fades if too wide. Micro-interactions: enters with an `8 px` rise and fade over `160 ms` on first editor focus; button press `100 ms`; active formatting reflects the selection; `prefers-reduced-motion` removes motion.
    - **Settings view**: Replaces the canvas; one `720 px` column; `FormSection`s separated by `40 px` of whitespace (no lines, no tabs): `Visibility` (`Choice` cards `Draft`, `Unlisted`, `Public`; Publish dialog flow unchanged), `Details` (type grouped by section, date, date precision, slug), `Structure` (full restoration of pre-WP-16.0 / `P005` / spec §§3.4, 3.5, 12.6 tagging surface: level line `Captured, Tagged, Claimed, Grounded` with current in bold, next-step suggestion, tags/facets add/remove from vocabulary, suggested roles on spans accept/change/ignore, claims, evidence). `Delete` is NOT repeated here. Unsaved edits persist when switching views; `Save` works from both. No Structure field blocks `Save` or `Publish`.
    - **Entries panel**: From `640 px` up a `320 px` left panel that pushes the canvas aside (the writing column re-centres in the remaining space), slide `240 ms`; below `640 px` a full-width slide-over. Header: `"Entries"` left-aligned with the collapse icon trailing; then a full-width `"New entry"` button, then search, then `Item`s.
12. **Item hover and padding**: Hover or selected tint is drawn with an `8 px` bleed beyond the content box (text stays on the column edge); every container that holds `Item`s (panel, menu, sheet) has `8 px` inner padding so the tint is never clipped; vertical padding of every `Item` is `12 px`.
13. **SectionHeader**: A heading (`16 px`, `600`) with an optional trailing icon button vertically centred on the heading line. `Today`'s checklist dismiss uses the `close` icon and tooltip `"Dismiss checklist"`.
14. **Icon buttons**: Keep the Lucide stroke glyphs. The click area of every icon button is a filled background, not an outline: `36 × 36 px`, radius `4 px`, no border; fill from a control-surface token at rest, stronger token on hover, stronger one on press (`scale(0.92)` on glyph over `100 ms`), accent tint with accent glyph when selected/pressed (toggles), standard focus ring. The `Edit`/`Settings` switch is one filled container with a moving selected thumb. Toggles cross-fade over `120 ms` (`sun`/`moon`, panel open/close); `prefers-reduced-motion` removes motion.
15. **Simplification**: Only allowed shared components: `Page` (templates), the one `Shell`, `Stack`, `Row`, `PageHeader`, `BackLink`, `SectionHeader`, `Item`, `FormSection`, `Field`, `Choice`, `Button` (`primary`, `secondary`, `text`, `icon`), `ActionBar`, `Tabs`, `Stepper`, `Select`, `Input` and `Textarea`, `Overlay` (`popover`, `sheet`, `panel`, `push panel`, `dialog`), `Icon`, `StatusLabel`, `Toolbar`. Delete any other component or duplicate class; no role may have two implementations. One components stylesheet generated from tokens; per-page CSS only for page-specific layout, under a size cap. CSS and client bundle bytes must not grow.
16. **Other fixes**: `Answer rules` `Item`: title is the rule as one plain sentence, subtitle is the scope, status stacked per `Item` contract, actions in `ActionBar`. `Setup`: `Choice` cards keep radio group with `D-COMP` #5 selection micro-interaction; `Next` is full-width primary; `Back` uses `BackLink`. `Login`: `narrow` template (`400 px`); `Sign in` primary full width above recovery link as full-width text button.

---

## D-FINAL: Final Polish and Contract Closure (Supersedes Conflicting Earlier Rules)

Where `D-FINAL` conflicts with `D-SYS`, `D-COMP`, `D-LAYOUT`, `D-MIN`, or `D-FOUND`, `D-FINAL` supersedes them:

### A. Measurement & Census Contract
1. **Single `STATES` Manifest**: `tests/e2e/states-manifest.ts` lists every page, view, and overlay state (all admin pages, editor Edit and Settings views, publish and delete dialogs, entries panel open, launcher, account menu, slash menu, setup steps 1–6, login and recovery login, Providers change flow steps, tag add, suggested role states `suggested`/`accepted`/`ignored`, empty and error states, gallery). Census and contact sheets iterate the exact same manifest × 2 themes × `320`, `1280`, and `1920`; the census fails if a sheet exists that is not in the manifest or vice versa.
2. **Painted-Gap Check**: Measures painted boxes only (elements with text, border, or background; ignoring empty containers and wrappers). Between consecutive painted blocks inside the page column, vertical whitespace must equal the relation token (`±1 px`):
   - `page-title-to-description`: `8 px`
   - `header-to-content`: `24 px`
   - `tabs-to-content`: `16 px`
   - `section-heading-to-intro`: `8 px`
   - `heading-or-intro-to-first`: `16 px`
   - `label-to-control`: `8 px`
   - `control-to-help`: `8 px`
   - `field-to-field`: `16 px`
   - `item-to-item`: `0 px` (`12 px` top/bottom padding + `1 px` hairline)
   - `section-to-section`: `40 px`
   - `last-control-to-action-bar`: `24 px`
   - `button-to-button`: `8 px`
   - `dialog-title-to-body`: `16 px`
   - `dialog-body-to-action-bar`: `24 px`
   `Stack` accepts only `tight` (`8`), `related` (`16`), `group` (`24`), `section` (`40`); numeric gaps in page and pattern code fail a guard. Canaries catch a hidden `80 px` spacer and a collapsed-margin case.
3. **Rendered-Text Check**: Checks DOM text of every state for arrows (`->`, `<-`, `→`, `←`), internal words (`profile`, `facet`, `temporal`, `tier`, `spec`, `ids`), unresolved placeholders (`<slug>`), and raw JSON.
4. **Colour Check (Including Native Controls)**: Sets `color-scheme` per theme and styles every native control (`select`, `input`, `date`, `textarea`, scrollbars) from tokens. Every computed colour, background, and border in every state (plus hover/focus states in the gallery) belongs to the active theme's token set.
5. **Line Check (Positive & Negative)**: Required hairlines (top bar bottom edge; between `Item`s in a list; inner edge of push panel) must exist; no other hairlines; `Tabs` has only the active `2 px` underline.

### B. Design System (`D-DS`)
6. **Layers & Dependency Rule**: `tokens` -> `primitives` -> `patterns` -> `pages`. Pages import patterns and primitives only; patterns import primitives and tokens only; primitives import tokens only; no lateral or upward imports; no CSS in pages (layout only through `Stack`, `Row`, `Page`). Enforced by an import-direction guard and a fixture page built solely from patterns that passes the entire census.
7. **Surfaces**: Three levels per theme: `L0` page canvas (`--surface-l0` / `--surface-page`); `L1` raised areas (top bar, push panel, sheets, popovers, dialogs, format bar) with ~4% lightness shift from `L0` in both themes, allowed hairline (top bar bottom edge; panel inner edge), and overlay shadow only for popovers, dialogs, sheets, and format bar; `L2` control fill (icon buttons, unselected `Choice` cards, tags). Sticky editor header row uses `L0` with no line.
8. **Type Roles (7 Exact Signatures)**:
   - `page-title`: `24px` / `600` / `text-1`
   - `section-title`: `16px` / `600` / `text-1`
   - `item-title` & `field-label`: `14px` / `600` / `text-1`
   - `body`: `14px` / `400` / `text-1`
   - `description` (page/section intros, sentence subtitles): `14px` / `400` / `text-2`
   - `caption` (help text, meta, chip text, `Item` subtitle): `12px` / `400` / `text-2`
   - `placeholder` & `disabled`: `14px` / `400` / `text-3`
   `text-2` and `text-3` contrast checked in both themes.
9. **Vertical Fields**: Label above, control, help below at every width; never side by side. Inline combinations (Category, Tag, Add) stack vertically full width.
10. **Item Contract**: From `640 px` up: title row with status label trailing and aligned to title; below it subtitle, body, meta; actions last. Under `640 px`: title, status label directly under title, then subtitle, body, meta, actions. Status never sits next to actions.
11. **Dialogs**: Padding `24 px`; title, `16 px`, body, `24 px`, `ActionBar` stacked (primary, then secondary), full width, no empty icon slot, `8 px` between buttons; close icon in the title row.
12. **BackLink Scope**: Appears only on child pages (History, Inbox detail, setup steps 2–6, Providers change flow). Removed from Settings modules, Status, and every launcher destination.
13. **Login & Setup**: Login uses `narrow` (`400 px`) template, centred, padding `24 px` (`16 px` below `768 px`), `40 px` top padding. Setup uses `standard` (`720 px`) template with the same padding; `Stepper` inside container, no full-bleed line, no divider.
14. **Choice Cards**: Unselected `L2` fill, selected accent tint and `check` or filled radio; Visibility labels `"Draft, only you"`, `"Unlisted, anyone with the link"`, `"Public, listed on your site"`.

### C. Editor
15. **Header Row**: CSS grid `1fr auto 1fr` (`36 px` row, vertically centred). Left: panel toggle aligned to top bar's left icon edge. Centre: two-segment control `"Edit"` and `"Settings"` (text labels, filled selected thumb, no underline), centred on viewport (`±1 px`). Right: from `640 px` up `History`, `Delete`, `Save` with `Save`'s right edge equal to top bar's account icon right edge; below `640 px` `More` icon button (`History`, `Delete entry` sheet) and `Save`.
16. **Edit View**: Prose spacing inside writing surface (`.lp-prose` exempt from margin guard): `16 px` between blocks, headings `24 px` above and `8 px` below; read-only details line under title (`"Draft, Work · Case study · 14 Sept 2021"`; click opens Settings view); auto-growing wrapping title (never truncates). Format bar: `position: fixed`, centred on writing column, `16 px` above viewport bottom (`visualViewport` on mobile).
17. **Settings View**: Uses `D-FINAL` A & B. Details: `"Type"` (grouped by section), `"Date precision"`, slug, date, read-only line `"Publishes to Work at /work/<actual slug>"` using real slug and section (same in Publish dialog).
18. **Structure Section**:
    - `Level`: read-only 4-segment progress bar (`Captured`, `Tagged`, `Claimed`, `Grounded`, `12 px` caption, done filled, current `600`, upcoming muted, non-interactive) + one next-step sentence (`description`).
    - `Tags`: section title `"Tags"`; themed `Tag` chips (`28 px` high, caption, remove icon button `36 px` hit area); stacked add form (`Select` `"Category"` with chevron, `Input` `"Tag"`, secondary `"Add tag"` full width; Enter adds & keeps focus; `160 ms` scale `0.96`/fade enter; duplicate error in feedback slot).
    - `Suggested roles`: intro `"Passages that may play a role in your story. Accept to label one, or ignore it."`; `Item`s with title=role, body=passage (3-line ellipsis, full text tooltip), status=`Suggested`/`Accepted`/`Ignored`; two-option `Choice` (button variant, single-select, deselectable: `Accept`, `Ignore` side by side equal width, persisted via annotations endpoint, `160 ms` status cross-fade, live-region announcement).
    - `Claims` & `Evidence`: lists of `Item`s (title, status, remove icon button); `"Add claim"` and `"Attach evidence"` secondary `ActionBar` buttons opening an `Overlay` (dialog `>= 640 px`, sheet `< 640 px`) with endpoint fields, `"Add"` primary, `"Cancel"` secondary stacked. Never blocks `Save` or `Publish`.

### D. Pages & Surfaces
19. **Providers (`D-PROV`)**: Top-level page, no Back. `PageHeader`; one `Item` `"Answering model"` (status `"Local only, quotes from your entries"` or `"Connected"`, `"Change"` secondary button -> `/admin/settings/providers/change` child page with Back, 3-step `Stepper`: Step 1 `Provider` Choice cards, Step 2 `Model` Select/Input, Step 3 `Key` write-only + `"Test and save"`; Local only & Ollama skip Step 3); below `Item`, `FormSection` `"Fallback behaviour"`. Setup step 3 uses the same flow components.
20. **Status**: Title `"Status"`, description `"Site build, automated answering, backups and providers."`. One list of 4 `Item`s (no section headings): `Site` (`Rebuild site`), `Automated answering` (`Pause`/`Resume`), `Backups` (whole-row link to Settings > Backups, trailing chevron), `Providers` (whole-row link to Settings > Providers, trailing chevron; Local counts as configured).
21. **Today**: Description `"What needs your attention."`. Needs attention rows: title only (`"1 unpublished draft"`, `"2 questions waiting in Inbox"`), trailing chevron, no status label; paused/failed rows only when applicable; `Getting started` dismiss vertically centred on heading line.
22. **Answer Rules & Settings Modules**: `Answer rules` `Item`: title=plain sentence, status per #10, subtitle=scope, body only if source quote differs from title with `"From your reply"` caption, `ActionBar` below. Settings modules: `PageHeader`, `FormSection`s, vertical fields, `ActionBar` `Save` `24 px` below last control.
23. **Entries Panel**: `L1` surface + inner-edge hairline, `Item`s with `8 px` bleed and `8 px` container padding, header `"Entries"` with trailing collapse icon, push layout from `640 px`.
24. **Hairlines & Surfaces**: Top bar `L1` with bottom hairline; `Item`s separated by hairlines (not before first or after last); push panel inner edge.


## 9. D-G Closure Pass Decisions (WP-16.G, Supersedes Conflicting Earlier Rules)

### A. Measurement Integrity
1. **State Markers & Reachability**: Every state in `STATES` declares a `marker` (expected route + visible text or selector, e.g. step heading + `"Step N of 6"`); the contact sheet generator and census assert the marker before capture/measurement and fail on mismatch. Setup steps 1 to 6 are each reachable in the harness (resetting setup state per step).
2. **Hook-Based Relation Measurement**: Shared components emit `data-rel` attributes (`title`, `description`, `section`, `field`, `help`, `itembody`, `actions`, `tabs`, `segment`, `subsection`, etc.). Every relation in `D-FINAL #2` plus `D-G #10` must have `measured > 0` in at least one state, else the census fails (`0` pairs is a failure). Any painted gap differing from its token by `> 1 px` fails (no logged mode). Gallery fixes: `tabs` to content `16 px`, `Item` to `Item` `0 px` plus hairline.
3. **Type Roles & Control-Label**: Exact 7 type roles plus `control-label` (`14px` / `600`, buttons). Tag text uses `caption` (`12px` / `400`). Placeholder and disabled text is `14px` / `400` `--text-3`; disabled buttons keep `control-label` weight (`600`) and take `--text-3`.
4. **One Implementation Per Role**: Components emit `data-c="<Name>"`. Guards fail on any element whose text matches `/^back\b/i`, stepper text `/step \d+ of \d+/i`, status dot+text, tag chip, or `<select>` outside its matching component, and fail if `BackLink` text is anything other than `"Back"` (accessible `aria-label` carries destination).
5. **Container-Responsive Primitives**: `Item`, `Field` groups, `Choice`, `ActionBar`, and `Tag` use `@container` (`inline-size`) queries, never viewport `@media` queries. `@media` is allowed only in Shell, Page, and PageHeader (breakpoint `640 px`).
6. **Overlays Outline & Shadow**: Every overlay (popover, sheet, panel, dialog, format bar) has a `1 px` outline token plus elevation shadow (`--shadow-e1` for popovers/menus, `--shadow-e2` for dialogs/sheets) whose offset points away from its anchor (popover below trigger: down; bottom sheet: up; left panel: right; top dropdown sheet: down; dialog: centred). Permitted in line budget.

### B. Item, Spacing & Geometry
7. **Item Geometry**: The `Item` rectangle equals the list width (hairline, hover tint, selected tint all the same width); content inset `8 px` on both sides; vertical padding `12 px` (replaces `D-SYS #12` 8px bleed). Containers (`panel`, `menu`, `sheet`) give Items full inner width; panel inner left edge is `16 px` matching top bar icon edge; panel buttons and search align to `16 px`.
8. **Container-Based Item Stacking**: When an `Item`'s container is narrower than `400 px`, the trailing slot (`StatusLabel` then chevron if any) drops onto its own line directly under `title`: status left, chevron far right; otherwise status trails on the `title` row and chevron follows. Order: `title`, `trailing`, `subtitle`, `body`, `meta`, `actions`. Status page rows use `StatusLabel` (`dot` + text) with trailing chevron.
9. **Segments & Gallery Anatomy**: A segment is a label (`caption`) above its text (`body`), `4 px` between label and text, `16 px` between segments; `Item` body to `ActionBar` is `24 px`; `data-rel` hooks emitted. Gallery includes anatomy captions (`parent`, `children`) and a dev-only `?outline=1` structure mode.
10. **Extended Spacing Relations**: Page-level `ActionBar` (after last `FormSection`) preceded by `40 px` (`section`). `ActionBar` inside `Item`, `Dialog`, sheet, or subsection preceded by `24 px` (`group`). Subsections inside a `FormSection` separated by `24 px` (`group`); subsection titles use `item-title` (`14/600`) while `FormSection` titles stay `16/600` at `40 px` between sections; subsection title to intro `8 px`, intro to first `Item`/`Field` `16 px`.
11. **Select & Text Button**: `<select>` chevron vertically centred (`50%`) and `12 px` from right edge everywhere. Text buttons have no fill and no border in every state except hover tint (including login recovery).
12. **Segmented Choice & Sticky Editor Header**: `Choice` has `button`, `card`, and `segmented` variants. `Segmented`: track (`L2`, radius `8 px`, padding `4 px`), equal-width grid (`1fr` per option), selected thumb (`L0`, radius `4 px`, inset `4 px` all sides, `160 ms` slide). Used for `Edit`/`Settings` and deselectable `Accept`/`Ignore`. Below `640 px`, `Edit`/`Settings` segments are icon-only (`pencil`, `sliders` + tooltips/`aria-label`). Editor header stays sticky at `top: 48 px` (`top bar` height) at scroll top and scrolled, including `editor-tag-add`.
13. **Notice Scope**: `Notice` is the only tinted block and only for warning and error. Informational copy is plain `description` text (replacing Setup Step 3 Privacy Boundary box).
14. **Tag**: Symmetric padding (`8 px` left/right without remove; `8 px` left, `4 px` right with `20 px` remove icon button having `36 px` hit area). Removal calls the existing endpoint; editor tags include remove control.

### C. Pages & Flows
15. **Setup Header**: `Back` (steps 2–6 only, text `"Back"`), then `Stepper` (`"Step N of 6"` + `2 px` progress line bound to actual step), then `h1` naming the step (without `"Step N:"` prefix), then `description`. `Stepper` text is `"Step N of M"` only across setup, Import, and Providers change.
16. **Setup Step 3 (`ProviderFlow`)**: Embeds shared `ProviderFlow` (`Choice` cards, model `Select`, write-only key field with `"Test and save"`) without its own stepper; `"Local only"` default; sub-steps via Back/Next; configuring an external provider in setup shows `Connected` on Settings > Providers and Status (`UX-09`).
17. **Editor Settings View**: Under `Type` select, help line `"Publishes in Work at /work/<real slug>"` (mapped section + real slug); `Type` select groups options by section (`Work`, `Writing`, `Build`); remove loose line under `Date precision`. Level next-step sentence is a text button with down icon scrolling to & focusing the matching control. `Suggested roles`: `Item` title=role, body=passage derived from revision body by span offsets (3-line clamp), status label per Item contract, segmented `Accept`/`Ignore` with `24 px` above.
18. **Entries Panel, Status, Page Padding**: Entries panel header text left-aligned. All pages (including fixture and gallery) wrap content in `Page` template with padding (`24 px`, `16 px` below `768 px`); census fails if any page content box is within `16 px` of viewport edge.
19. **Appearance v2 (Recorded in P004 WP-17)**: Theme pack format (typed token schema across primitive, semantic, and component tiers, one tokens source file generated to CSS), selectable packs with live preview and contrast validation, constrained customisation, import/export. Not built in WP-16.G.
