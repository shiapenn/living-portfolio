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
3. **Zero Text Glyphs**:
   - Text characters (`×`, `✕`, `▾`, `▸`, `◐`, `...`) are never used as icons. They are replaced by SVG symbols (`x`, `chevron-down`, `chevron-right`, `sun-moon`, `more-horizontal`, `menu`, `info`, `check-circle`, `alert-triangle`, `alert-circle`).
4. **Icon Surfaces & Button Variants**:
   - **Bare icon**: Sits inline next to text or inside a status surface (`Notice`, `StatusLine`, `Badge`).
   - **Ghost icon button (`.lp-icon-btn-ghost`)**: No border (`0px`), transparent background at rest (`rgba(0, 0, 0, 0)`), subtle fill on `:hover`, `:focus-visible`, and `:active`. Hit area is `32×32 px` on desktop and at least `44×44 px` on touch/mobile viewports (`< 768 px`). Used for secondary utilities (dismiss, overflow menu trigger, copy).
   - **Outlined icon button (`.lp-icon-btn-outlined`)**: `1 px` `--border-control` border, transparent/surface background at rest, used **only** when standing alone in a header or toolbar on a plain surface (such as the header theme toggle or mobile menu button).
   - **Filled icon buttons are prohibited**: Primary and destructive actions always carry visible text labels.
5. **Accessibility & Tooltips**:
   - Every icon-only control (`IconButton`) must provide both an accessible name (`aria-label`) and a tooltip (`title`) available on hover and focus.
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
   - A bordered container (card, notice, dialog, empty state) must never contain a nested 4-sided bordered container. Sections inside a card or container are separated strictly by `1 px` hairline horizontal dividers (`border-top` or `border-bottom` using `--border-subtle`).
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
   - Allowed spacing steps: `4px`, `8px`, `12px`, `16px`, `24px`, `32px`, `48px`, `64px` (`--space-1` through `--space-8`).
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
4. **Compact Viewport (`< 768 px`) & Touch Targets**:
   - Below `768 px`, the admin header collapses to the brand title plus a single menu button (`Menu` containing theme toggle and sign-out), so main workspace content starts within `<= 64 px` of the top of the viewport.
   - Every interactive touch target on `< 768 px` viewports measures at least `44×44 px`.

---

## D-FOUND-4: Typography & Colour Roles

1. **Type Scale Roles**:
   - `caption`: `12px / 16px` (`--text-caption-size: 12px`, `--text-caption-line: 16px`)
   - `body-sm`: `14px / 20px` (`--text-body-sm-size: 14px`, `--text-body-sm-line: 20px`)
   - `body`: `16px / 24px` (`--text-body-size: 16px`, `--text-body-line: 24px`)
   - `title`: `20px / 28px` (`--text-title-size: 20px`, `--text-title-line: 28px`)
   - `page-title`: `28px / 36px` (`--text-page-title-size: 28px`, `--text-page-title-line: 36px`)
   - Allowed font weights: `400` (regular), `500` (medium), `600` (semibold). Field labels use `14px / 20px` at weight `500`.
2. **Reading Face on the Writing Surface**:
   - The entry body writing surface (`textarea.lp-writing-surface`) uses the public reading serif font stack (`--font-reading`) at `16px / 24px` and reading measure (`--measure-reading: 65ch`), matching the published portfolio reading experience.
3. **Six Semantic Colour Roles & Contrast Ratios**:
   - Roles: `action`, `neutral`, `success`, `warning`, `danger`, `info`.
   - Each role defines `--role-<name>-fg`, `--role-<name>-bg`, and `--role-<name>-border` in both light and dark themes.
   - **Contrast Guarantees** (verified via computed styles in Playwright in both light and dark themes):
     - Text (`--role-<name>-fg` on `--role-<name>-bg`, and `--text-primary` / `--text-secondary` on `--bg-surface`): **>= 4.5:1**.
     - UI control boundaries (`--border-control` on `--bg-surface`) and focus rings (`--focus-ring` on `--bg-surface`): **>= 3.0:1**.

---

## D-FOUND-5: Interactive States & Motion

1. **Complete State Coverage**:
   - Every interactive primitive implements `default`, `hover`, `focus-visible`, `active`, `disabled`, `loading`, and `error` (where applicable).
   - Per `D-CONTRACT-6`, any disabled control must expose an explicit human-readable reason via `title` / tooltip on hover and focus, or be omitted from the DOM.
2. **Motion**:
   - Transitions run for `150ms` to `200ms` (`--motion-fast: 160ms ease`) and animate **only** `opacity` and `transform` (plus colour/border state changes).
   - `@media (prefers-reduced-motion: reduce)` disables animations and instant-snaps transitions (`transition-duration: 0.01ms !important; animation-duration: 0.01ms !important`).

---

## D-FOUND-6: Component & Workspace Patterns

1. **Page Notice (`Notice`)**:
   - Structure: `16 px` tone SVG icon + concise text + at most one action button + `16 px` ghost `x` dismiss icon button at top right.
   - Scope: Used **only** for whole-page conditions (offline, expired session, storage conflict).
   - **Save Failure Rule**: A failed field validation or save error is **never** rendered as a page notice. It appears in the `StatusLine` with remediation guidance, and the specific field error appears directly beneath the offending field (`Field` error message). One event never triggers two conflicting banners.
2. **Status Line (`StatusLine`)**:
   - Structure: `16 px` tone SVG icon + status text + optional inline link-style action (`.lp-status-undo-link`, e.g., `Undo (8s)` with a live countdown).
3. **Disclosure (`Disclosure`)**:
   - Structure: Hairline top divider (`1 px solid var(--border-subtle)`) + full-width summary row with a `16 px` rotating chevron + collapsible body. Never a 4-sided bordered card inside another card.
   - The `Details` summary row in the editor never repeats the entry lifecycle state (which is shown once in the editor header).
4. **Empty State & First-Run Guide (`EmptyState`)**:
   - Renders inside the main workspace column at the standard left edge and width, with **one** primary call-to-action button.
   - When the first-run guide is shown, its steps live **inside** the `EmptyState` container using an ordered list (`<ol class="lp-empty-state-steps">`) whose items do not include duplicate manual step numbers (`"1. 1."` is prohibited).
5. **Entry List Header & Non-Wrapping Labels**:
   - The sidebar list header displays the heading `"Entries"` beside a pill count `Badge` (`"0"`, `"3"`), never `"Entries (0 entries)"`.
   - Button and badge labels enforce `white-space: nowrap` so labels never wrap across lines.
