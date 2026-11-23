# Design Tokens Reference (Generated)

> **Source of truth:** `packages/design-tokens/tokens.json` (schema: `packages/design-tokens/tokens.schema.json`).
> **Naming convention:** `--lp-<category>-<role>[-<variant>][-<state>]`
> **Version:** `3.0.0`

## Architecture (D-L4 & D-L5)

### 1. Three-Tier Hierarchy
- **Tier 1 — Primitive (`primitive.*`)**: Raw scales (`color`, `space 0..64`, `size`, `radius`, `border`, `font`, `motion`, `zIndex`, `opacity`, `elevation`). Never emitted as `--lp-prim-*` custom properties into shipped CSS and never referenced directly by component CSS.
- **Tier 2 — Semantic (`semantic.light.*`, `semantic.dark.*`)**: Theme-switched roles (`color.surface.l0..l2`, `color.surface.control*`, `color.surface.scrim`, `color.text.1..3`, `color.border.*`, `color.accent.*`, `color.role.*`, `color.passage.*`, `elevation.e0..e2`, `opacity.disabled`). Emitted as CSS custom properties on `:root` and switched in `:root[data-theme="dark"]` / `@media (prefers-color-scheme: dark)`.
- **Tier 3 — Component & Spacing Taxonomy (`component.*`, `responsive.*`)**:
  - **Stack relations (`--lp-space-stack-<relation>`)**: Vertical gaps between stacked elements (monotonic proximity: `label-to-control (8px) < field-to-field (16px) < subsection-to-subsection (24px) < section-to-section (40px)`).
  - **Inline relations (`--lp-space-inline-<relation>`)**: Horizontal gaps between inline peers (`segment: 4px`, `dot-text: 6px`, `icon-text: 8px`, `button-button: 8px`, `tag-tag: 8px`).
  - **Insets (`--lp-space-inset-<container>`)**: Internal container padding (`page-gutter: 16px -> 24px @ 768px`, `panel: 12px`, `dialog: 24px`, `item-x: 8px`, `item-y: 12px`, `control-x: 12px`, `tag-x: 8px`, `tag-y: 2px`, `track: 4px`).
  - **Sizes, Radii, Borders, Z-Index, Motion, Typography**: Semantic component dimensions (`--lp-size-*`), radii (`--lp-radius-r1`, `--lp-radius-r2`, plus semantic aliases), named z-index layers (`base`, `raised`, `sticky`, `overlay`, `popover`, `modal`, `toast`, `skip`), motion tokens, and font tokens.

### 2. Rules & Guards
1. **No numeral-named tokens**: Component and semantic token names may not be a bare number (e.g. `--lp-size-14`, `--lp-space-8`, `--lp-z-10` are forbidden).
2. **No reserved list / arithmetic closure**: Every token emitted into `tokens.css` must be used (`defined = used`, `0` unused). Any unused or unresolved token fails `scripts/verify-ui-guards`.
3. **Single-token responsive switching**: Responsive tokens (`--lp-size-control-height`, `--lp-space-inset-page-gutter`) keep one token name whose value switches at the `breakpoints` media query.
4. **Build-time primitive resolution**: Non-theme primitive references resolve at build time in `generate.mjs` so shipped CSS carries zero `--lp-prim-*` declarations.

### 3. How to Add a Token
1. Check if an existing semantic, relation (`space.stack.*`, `space.inline.*`, `space.inset.*`), or component token already expresses the role.
2. Add the raw value to `primitive` in `packages/design-tokens/tokens.json` if not already on the scale.
3. Add the semantic or component token referencing `{primitive.*}` (or `{semantic.*}` / `{component.*}`).
4. Run `node packages/design-tokens/generate.mjs` and verify `./scripts/verify-ui-guards` and `pnpm --filter @living-portfolio/design-tokens test`.

### 4. How to Choose a Token (Decision List)
1. **Vertical gap between stacked blocks, fields, headings, or lists?** -> Use `--lp-space-stack-<relation>` (`label-to-control`, `field-to-field`, `heading-to-list-plain`, `heading-to-list-interactive`, `control-to-list`, `subsection-to-subsection`, `section-to-section`, `header-to-content`).
2. **Horizontal gap between inline icon, text, dot, tag, or button peers?** -> Use `--lp-space-inline-<relation>` (`icon-text`, `button-button`, `dot-text`, `tag-tag`, `segment`).
3. **Internal padding of a page, panel, dialog, item, control, or tag?** -> Use `--lp-space-inset-<container>` (`page-gutter`, `panel`, `dialog`, `item-x`, `item-y`, `control-x`, `tag-x`, `tag-y`, `track`).
4. **Surface background?** -> Use `--lp-color-surface-l0` (page canvas), `--lp-color-surface-l1` (bars, panels, overlays), `--lp-color-surface-l2` (resting controls/chips), `--lp-color-surface-control-hover|active|selected`, or `--lp-color-surface-scrim` (modal/sheet backdrop).
5. **Text or icon colour?** -> Use `--lp-color-text-1` (primary), `--lp-color-text-2` (secondary/description/caption), `--lp-color-text-3` (placeholder/disabled), or `--lp-color-role-<tone>-fg`.
6. **Border or divider?** -> Use `--lp-border-hairline` with `--lp-color-border-subtle` (dividers), `--lp-color-border-control` (inputs/buttons), or `--lp-color-border-overlay` (panels/popovers/dialogs).
7. **Corner radius?** -> Use `--lp-radius-r1` / `--lp-radius-chip` (`4px`), `--lp-radius-r2` / `--lp-radius-control|container|overlay|card` (`8px`), or `--lp-radius-full` (`9999px` circular dots/radios).
8. **Stacking layer (`z-index`)?** -> Use a named layer only: `--lp-z-base` (`0`), `--lp-z-raised` (`1`), `--lp-z-sticky` (`100`), `--lp-z-overlay` (`200`), `--lp-z-popover` (`300`), `--lp-z-modal` (`400`), `--lp-z-toast` (`500`), `--lp-z-skip` (`1000`).

## Summary

- Primitive scale entries (build-time resolved, not emitted to CSS): **192**
- Semantic tokens (per theme): **52**
- Component, spacing (`stack`, `inline`, `inset`) & typography tokens: **152**
- Responsive breakpoint overrides: **2**

## Breakpoints

| Token | Value | Usage |
| --- | --- | --- |
| `breakpoints.viewport.sm` | `640px` | Mobile-to-desktop control height (`44px` -> `40px`), Item grid |
| `breakpoints.viewport.md` | `768px` | Page gutter (`16px` -> `24px`), push-panel vs overlay |
| `breakpoints.viewport.lg` | `1024px` | Wide desktop split layout (`1024px`) |
| `breakpoints.viewport.xl` | `1280px` | 3-pane desktop layout (`1280px`) |
| `breakpoints.container.compact` | `400px` | Container query threshold (`< 400px`) |

## D-FINAL & D-L4 Spacing Relations

| Relation | Stack Token | Value |
| --- | --- | --- |
| `page-title-to-description` | `--lp-space-stack-page-title-to-description` | `8px` |
| `header-to-content` | `--lp-space-stack-header-to-content` | `24px` |
| `tabs-to-content` | `--lp-space-stack-tabs-to-content` | `16px` |
| `section-heading-to-intro` | `--lp-space-stack-section-heading-to-intro` | `8px` |
| `heading-to-first` | `--lp-space-stack-heading-to-first` | `16px` |
| `heading-to-list-plain` | `--lp-space-stack-heading-to-list-plain` | `16px` |
| `heading-to-list-interactive` | `--lp-space-stack-heading-to-list-interactive` | `16px` |
| `control-to-list` | `--lp-space-stack-control-to-list` | `16px` |
| `tint-clearance` | `--lp-space-stack-tint-clearance` | `8px` |
| `subsection-to-subsection` | `--lp-space-stack-subsection-to-subsection` | `24px` |
| `label-to-control` | `--lp-space-stack-label-to-control` | `8px` |
| `field-to-field` | `--lp-space-stack-field-to-field` | `16px` |
| `item-to-item` | `--lp-space-stack-item-to-item` | `0px` |
| `item-body-to-actionbar` | `--lp-space-stack-item-body-to-actionbar` | `24px` |
| `section-to-section` | `--lp-space-stack-section-to-section` | `40px` |
| `action-bar-after-section` | `--lp-space-stack-action-bar-after-section` | `40px` |
| `action-bar-after-control` | `--lp-space-stack-action-bar-after-control` | `24px` |
| `button-to-button` | `--lp-space-stack-button-to-button` | `8px` |
| `dialog-title-to-body` | `--lp-space-stack-dialog-title-to-body` | `16px` |
| `dialog-body-to-actionbar` | `--lp-space-stack-dialog-body-to-actionbar` | `24px` |

## Typography Roles (7 Roles + control-label)

| Role | Size | Weight | Line Height | Color Token |
| --- | --- | --- | --- | --- |
| `page-title` | `24px` | `600` | `32px` | `--lp-color-text-1` |
| `section-title` | `16px` | `600` | `24px` | `--lp-color-text-1` |
| `item-title` | `14px` | `600` | `20px` | `--lp-color-text-1` |
| `body` | `14px` | `400` | `20px` | `--lp-color-text-1` |
| `description` | `14px` | `400` | `20px` | `--lp-color-text-2` |
| `caption` | `12px` | `400` | `16px` | `--lp-color-text-2` |
| `placeholder` | `14px` | `400` | `20px` | `--lp-color-text-3` |
| `control-label` | `14px` | `600` | `20px` | `--lp-color-text-1` |

## Tier 2: Semantic Tokens (Light vs Dark)

| Token | Light | Dark |
| --- | --- | --- |
| `--lp-color-surface-l0` | `#FFFFFF` | `#0F1A22` |
| `--lp-color-surface-l1` | `#F5F6F7` | `#16232D` |
| `--lp-color-surface-l2` | `#EBEFF2` | `#1E2E3B` |
| `--lp-color-surface-control` | `#EBEFF2` | `#1E2E3B` |
| `--lp-color-surface-control-hover` | `#E1E6EA` | `#273847` |
| `--lp-color-surface-control-active` | `#D2D9DF` | `#314557` |
| `--lp-color-surface-control-selected` | `#EEF1FF` | `#1A244D` |
| `--lp-color-surface-scrim` | `rgba(15, 26, 34, 0.45)` | `rgba(0, 0, 0, 0.6)` |
| `--lp-color-text-1` | `#14202A` | `#E6ECEF` |
| `--lp-color-text-2` | `#4B5A66` | `#A3B2BD` |
| `--lp-color-text-3` | `#63727E` | `#8A99A6` |
| `--lp-color-text-on-accent` | `#FFFFFF` | `#0F1A22` |
| `--lp-color-border-subtle` | `#CBD3D8` | `#2A3946` |
| `--lp-color-border-control` | `#6B7B88` | `#7E8F9C` |
| `--lp-color-border-overlay` | `#CBD3D8` | `#334656` |
| `--lp-color-border-subtle-ring` | `rgba(0, 0, 0, 0.1)` | `rgba(0, 0, 0, 0.1)` |
| `--lp-color-accent-default` | `#3A4FD0` | `#9AA8FF` |
| `--lp-color-accent-focus-ring` | `#3A4FD0` | `#9AA8FF` |
| `--lp-color-role-action-fg` | `#1E329E` | `#C5CEFF` |
| `--lp-color-role-action-bg` | `#EEF1FF` | `#1A244D` |
| `--lp-color-role-action-border` | `#3A4FD0` | `#9AA8FF` |
| `--lp-color-role-neutral-fg` | `#2D3B45` | `#D5DEE4` |
| `--lp-color-role-neutral-bg` | `#EEF1F3` | `#1E2C38` |
| `--lp-color-role-neutral-border` | `#6B7B88` | `#7E8F9C` |
| `--lp-color-role-success-fg` | `#145940` | `#8CE0BC` |
| `--lp-color-role-success-bg` | `#E8F5E9` | `#122B22` |
| `--lp-color-role-success-border` | `#1F7A5A` | `#6FCBA3` |
| `--lp-color-role-warning-fg` | `#6E4700` | `#F7D070` |
| `--lp-color-role-warning-bg` | `#FFF8E1` | `#2B210D` |
| `--lp-color-role-warning-border` | `#9A6A00` | `#E2B34A` |
| `--lp-color-role-danger-fg` | `#8E1B12` | `#FDA29B` |
| `--lp-color-role-danger-bg` | `#FFEBEE` | `#2E1515` |
| `--lp-color-role-danger-border` | `#B42318` | `#F97066` |
| `--lp-color-role-info-fg` | `#1D437A` | `#A9CBF4` |
| `--lp-color-role-info-bg` | `#EAF2FC` | `#15263D` |
| `--lp-color-role-info-border` | `#2F5FA8` | `#8DB4EA` |
| `--lp-color-passage-goal` | `#2F5FA8` | `#8DB4EA` |
| `--lp-color-passage-approach` | `#5A5F6B` | `#B4B9C4` |
| `--lp-color-passage-friction` | `#9A6A00` | `#E2B34A` |
| `--lp-color-passage-decision` | `#5B3FA0` | `#B9A4EE` |
| `--lp-color-passage-outcome` | `#1F7A5A` | `#6FCBA3` |
| `--lp-color-passage-lesson` | `#A13A6B` | `#EE9CC2` |
| `--lp-color-passage-neutral` | `#5A5F6B` | `#B4B9C4` |
| `--lp-color-elevation-shadow-e1` | `rgba(20, 32, 42, 0.14)` | `rgba(0, 0, 0, 0.55)` |
| `--lp-color-elevation-shadow-e2` | `rgba(20, 32, 42, 0.18)` | `rgba(0, 0, 0, 0.65)` |
| `--lp-elevation-e1-blur` | `16px` | `16px` |
| `--lp-elevation-e2-blur` | `32px` | `32px` |
| `--lp-elevation-e0` | `none` | `none` |
| `--lp-elevation-e1` | `0 4px 16px rgba(20, 32, 42, 0.14)` | `0 4px 16px rgba(0, 0, 0, 0.55)` |
| `--lp-elevation-e1-up` | `0 calc(-1 * 4px) 16px rgba(20, 32, 42, 0.14)` | `0 calc(-1 * 4px) 16px rgba(0, 0, 0, 0.55)` |
| `--lp-elevation-e2` | `0 8px 32px rgba(20, 32, 42, 0.18)` | `0 8px 32px rgba(0, 0, 0, 0.65)` |
| `--lp-opacity-disabled` | `0.5` | `0.5` |

## Tier 3: Component & Spacing Taxonomy Tokens

| Token | Value |
| --- | --- |
| `--lp-color-surface-page` | `#FFFFFF` |
| `--lp-color-surface-overlay` | `#F5F6F7` |
| `--lp-color-surface-subtle` | `#F5F6F7` |
| `--lp-space-proximity-1` | `4px` |
| `--lp-space-proximity-2` | `8px` |
| `--lp-space-proximity-3` | `16px` |
| `--lp-space-proximity-4` | `24px` |
| `--lp-space-proximity-5` | `40px` |
| `--lp-space-stack-none` | `0px` |
| `--lp-space-stack-label-to-control` | `8px` |
| `--lp-space-stack-tint-clearance` | `8px` |
| `--lp-space-stack-page-title-to-description` | `8px` |
| `--lp-space-stack-section-heading-to-intro` | `8px` |
| `--lp-space-stack-field-to-field` | `16px` |
| `--lp-space-stack-heading-to-first` | `16px` |
| `--lp-space-stack-heading-to-list-plain` | `16px` |
| `--lp-space-stack-heading-to-list-interactive` | `16px` |
| `--lp-space-stack-control-to-list` | `16px` |
| `--lp-space-stack-tabs-to-content` | `16px` |
| `--lp-space-stack-dialog-title-to-body` | `16px` |
| `--lp-space-stack-subsection-to-subsection` | `24px` |
| `--lp-space-stack-header-to-content` | `24px` |
| `--lp-space-stack-item-body-to-actionbar` | `24px` |
| `--lp-space-stack-action-bar-after-control` | `24px` |
| `--lp-space-stack-dialog-body-to-actionbar` | `24px` |
| `--lp-space-stack-section` | `40px` |
| `--lp-space-stack-section-to-section` | `40px` |
| `--lp-space-stack-action-bar-after-section` | `40px` |
| `--lp-space-inline-segment` | `4px` |
| `--lp-space-inline-dot-text` | `8px` |
| `--lp-space-inline-icon-text` | `8px` |
| `--lp-space-inline-button-button` | `8px` |
| `--lp-space-inline-tag-tag` | `8px` |
| `--lp-space-inset-tag-y` | `2px` |
| `--lp-space-inset-track` | `4px` |
| `--lp-space-inset-badge-x` | `4px` |
| `--lp-space-inset-item-x` | `8px` |
| `--lp-space-inset-tag-x` | `8px` |
| `--lp-space-inset-control-sm` | `12px` |
| `--lp-space-inset-item-y` | `12px` |
| `--lp-space-inset-control-x` | `12px` |
| `--lp-space-inset-panel` | `12px` |
| `--lp-space-inset-card-sm` | `16px` |
| `--lp-space-inset-page-gutter` | `16px` |
| `--lp-space-inset-section` | `16px` |
| `--lp-space-inset-dialog` | `24px` |
| `--lp-space-inset-empty` | `32px` |
| `--lp-space-inset-page-y` | `40px` |
| `--lp-space-inset-hero-y` | `48px` |
| `--lp-space-inset-stage-y` | `64px` |
| `--lp-size-control-height` | `44px` |
| `--lp-size-control-xs` | `32px` |
| `--lp-size-hit-area` | `44px` |
| `--lp-size-target-min` | `36px` |
| `--lp-size-bar-compact-height` | `48px` |
| `--lp-size-bar-editor-height` | `56px` |
| `--lp-size-bar-top-height` | `60px` |
| `--lp-size-icon-sm` | `16px` |
| `--lp-size-icon-md` | `20px` |
| `--lp-size-icon-lg` | `24px` |
| `--lp-size-status-dot` | `8px` |
| `--lp-size-notch-width` | `8px` |
| `--lp-size-indicator-md` | `8px` |
| `--lp-size-checkbox-sm` | `16px` |
| `--lp-size-switch-thumb` | `16px` |
| `--lp-size-tag-height` | `28px` |
| `--lp-size-track-height` | `4px` |
| `--lp-size-progress-track-w` | `100px` |
| `--lp-size-textarea-compact-min-h` | `68px` |
| `--lp-size-textarea-min-h` | `144px` |
| `--lp-size-card-min-h` | `140px` |
| `--lp-size-col-min-xs` | `128px` |
| `--lp-size-menu-min-w` | `148px` |
| `--lp-size-grid-card-min` | `180px` |
| `--lp-size-popover-min-w` | `200px` |
| `--lp-size-grid-field-min` | `220px` |
| `--lp-size-popover-max-w` | `280px` |
| `--lp-size-editor-canvas-min-h` | `360px` |
| `--lp-size-overlay-sample-max` | `420px` |
| `--lp-size-form-compact-max` | `440px` |
| `--lp-size-dialog-max-w` | `480px` |
| `--lp-size-card-max-w` | `520px` |
| `--lp-size-layout-list-col` | `260px` |
| `--lp-size-layout-nav-compact` | `240px` |
| `--lp-size-layout-inspector-compact` | `320px` |
| `--lp-size-layout-rail-width` | `320px` |
| `--lp-size-admin-nav-width` | `240px` |
| `--lp-size-admin-inspector-width` | `320px` |
| `--lp-size-layout-narrow-max` | `400px` |
| `--lp-size-layout-reading-col` | `640px` |
| `--lp-size-layout-main-max` | `720px` |
| `--lp-size-layout-medium-max` | `720px` |
| `--lp-size-layout-wide-col` | `800px` |
| `--lp-size-layout-dashboard-max` | `960px` |
| `--lp-size-layout-max` | `1200px` |
| `--lp-size-strata-band-min` | `44px` |
| `--lp-size-strata-band-max` | `120px` |
| `--lp-size-btn-item-min` | `96px` |
| `--lp-size-btn-action-min` | `160px` |
| `--lp-size-btn-action-max` | `240px` |
| `--lp-measure-reading` | `68ch` |
| `--lp-editor-min-h` | `60vh` |
| `--lp-elevation-e1-offset-y` | `4px` |
| `--lp-elevation-e2-offset-y` | `8px` |
| `--lp-radius-r1` | `4px` |
| `--lp-radius-r2` | `8px` |
| `--lp-radius-control` | `8px` |
| `--lp-radius-container` | `8px` |
| `--lp-radius-overlay` | `8px` |
| `--lp-radius-chip` | `4px` |
| `--lp-radius-card` | `8px` |
| `--lp-radius-full` | `999px` |
| `--lp-border-hairline` | `1px` |
| `--lp-border-focus` | `2px` |
| `--lp-border-role-rule` | `4px` |
| `--lp-border-banner-rule` | `4px` |
| `--lp-z-base` | `0` |
| `--lp-z-raised` | `100` |
| `--lp-z-sticky` | `200` |
| `--lp-z-overlay` | `300` |
| `--lp-z-popover` | `400` |
| `--lp-z-modal` | `500` |
| `--lp-z-toast` | `600` |
| `--lp-z-skip` | `1000` |
| `--lp-motion-duration-instant` | `0.01ms` |
| `--lp-motion-duration-fast` | `80ms` |
| `--lp-motion-duration-item` | `80ms` |
| `--lp-motion-duration-base` | `160ms` |
| `--lp-motion-duration-slow` | `240ms` |
| `--lp-motion-duration-pulse` | `960ms` |
| `--lp-motion-easing-standard` | `cubic-bezier(0.2, 0, 0, 1)` |
| `--lp-motion-easing-out` | `cubic-bezier(0, 0, 0.2, 1)` |
| `--lp-font-family-ui` | `'Atkinson Hyperlegible Next', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif` |
| `--lp-font-family-reading` | `'Literata', Georgia, 'Times New Roman', serif` |
| `--lp-font-family-code` | `'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace` |
| `--lp-font-size-12` | `12px` |
| `--lp-font-size-14` | `14px` |
| `--lp-font-size-16` | `16px` |
| `--lp-font-size-18` | `18px` |
| `--lp-font-size-20` | `20px` |
| `--lp-font-size-24` | `24px` |
| `--lp-font-size-28` | `28px` |
| `--lp-font-size-32` | `32px` |
| `--lp-font-weight-400` | `400` |
| `--lp-font-weight-600` | `600` |
| `--lp-font-line-16` | `16px` |
| `--lp-font-line-20` | `20px` |
| `--lp-font-line-24` | `24px` |
| `--lp-font-line-32` | `32px` |
| `--lp-font-line-reading` | `1.65` |
| `--lp-font-letter-normal` | `0em` |
| `--lp-font-letter-wide` | `0.03em` |
