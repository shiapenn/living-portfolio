# Design Tokens Reference (Generated)

> **Source of truth:** `packages/design-tokens/tokens.json` (schema: `packages/design-tokens/tokens.schema.json`).
> **Naming convention:** `--lp-<category>-<role>[-<variant>][-<state>]`
> **Architecture:** Three tiers — **Primitive** (raw scales), **Semantic** (theme-switched roles: light & dark), **Component** (dimensions, radii, relations, typography roles).

## Summary

- Primitive tokens: **215**
- Semantic tokens (per theme): **62**
- Component, relation & typography tokens: **198**
- Reserved tokens: **31**

## Breakpoints

| Token | Value | Usage |
| --- | --- | --- |
| `breakpoints.viewport.sm` | `640px` | Mobile-to-desktop control height (`44px` -> `40px`), Item grid |
| `breakpoints.viewport.md` | `768px` | Gutter (`16px` -> `24px`), push-panel vs overlay |
| `breakpoints.container.compact` | `400px` | Container query threshold (`< 400px`) |

## D-FINAL Spacing Relations

| Relation | Token | Value |
| --- | --- | --- |
| `page-title-to-description` | `--lp-rel-page-title-to-description` | `8px` |
| `header-to-content` | `--lp-rel-header-to-content` | `24px` |
| `tabs-to-content` | `--lp-rel-tabs-to-content` | `16px` |
| `section-heading-to-intro` | `--lp-rel-section-heading-to-intro` | `8px` |
| `heading-to-first` | `--lp-rel-heading-to-first` | `16px` |
| `subsection-to-subsection` | `--lp-rel-subsection-to-subsection` | `24px` |
| `label-to-control` | `--lp-rel-label-to-control` | `8px` |
| `field-to-field` | `--lp-rel-field-to-field` | `16px` |
| `item-to-item` | `--lp-rel-item-to-item` | `0px` |
| `item-body-to-actionbar` | `--lp-rel-item-body-to-actionbar` | `24px` |
| `section-to-section` | `--lp-rel-section-to-section` | `40px` |
| `action-bar-after-section` | `--lp-rel-action-bar-after-section` | `40px` |
| `action-bar-after-control` | `--lp-rel-action-bar-after-control` | `24px` |
| `button-to-button` | `--lp-rel-button-to-button` | `8px` |
| `dialog-title-to-body` | `--lp-rel-dialog-title-to-body` | `16px` |
| `dialog-body-to-actionbar` | `--lp-rel-dialog-body-to-actionbar` | `24px` |

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
| `--lp-color-surface-page` | `#FFFFFF` | `#0F1A22` |
| `--lp-color-surface-raised` | `#FFFFFF` | `#16232D` |
| `--lp-color-surface-overlay` | `#F5F6F7` | `#16232D` |
| `--lp-color-surface-sunken` | `#F3F5F4` | `#121C24` |
| `--lp-color-surface-subtle` | `#F3F5F4` | `#16232D` |
| `--lp-color-surface-panel` | `#F5F6F7` | `#16232D` |
| `--lp-color-surface-input` | `#FFFFFF` | `#16232D` |
| `--lp-color-surface-control` | `#EBEFF2` | `#1E2E3B` |
| `--lp-color-surface-control-hover` | `#E1E6EA` | `#273847` |
| `--lp-color-surface-control-active` | `#D2D9DF` | `#314557` |
| `--lp-color-surface-control-selected` | `#EEF1FF` | `#1A244D` |
| `--lp-color-surface-backdrop` | `rgba(15, 26, 34, 0.45)` | `rgba(0, 0, 0, 0.6)` |
| `--lp-color-text-1` | `#14202A` | `#E6ECEF` |
| `--lp-color-text-2` | `#4B5A66` | `#A3B2BD` |
| `--lp-color-text-3` | `#63727E` | `#8A99A6` |
| `--lp-color-text-on-accent` | `#FFFFFF` | `#0F1A22` |
| `--lp-color-text-future` | `#4B5A66` | `#A3B2BD` |
| `--lp-color-border-subtle` | `#CBD3D8` | `#2A3946` |
| `--lp-color-border-control` | `#6B7B88` | `#7E8F9C` |
| `--lp-color-border-overlay` | `#CBD3D8` | `#334656` |
| `--lp-color-border-provisional` | `#4B5A66` | `#A3B2BD` |
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
| `--lp-color-role-goal` | `#2F5FA8` | `#8DB4EA` |
| `--lp-color-role-approach` | `#5A5F6B` | `#B4B9C4` |
| `--lp-color-role-friction` | `#9A6A00` | `#E2B34A` |
| `--lp-color-role-decision` | `#5B3FA0` | `#B9A4EE` |
| `--lp-color-role-outcome` | `#1F7A5A` | `#6FCBA3` |
| `--lp-color-role-lesson` | `#A13A6B` | `#EE9CC2` |
| `--lp-color-role-neutral` | `#5A5F6B` | `#B4B9C4` |
| `--lp-color-status-ok` | `#145940` | `#8CE0BC` |
| `--lp-color-status-warn` | `#6E4700` | `#F7D070` |
| `--lp-color-status-error` | `#8E1B12` | `#FDA29B` |
| `--lp-elevation-e0` | `none` | `none` |
| `--lp-elevation-e1` | `0 6px 16px rgba(20, 32, 42, 0.14)` | `0 6px 18px rgba(0, 0, 0, 0.55)` |
| `--lp-elevation-e1-up` | `0 -6px 16px rgba(20, 32, 42, 0.14)` | `0 -6px 18px rgba(0, 0, 0, 0.55)` |
| `--lp-elevation-e1-right` | `6px 0 16px rgba(20, 32, 42, 0.14)` | `6px 0 18px rgba(0, 0, 0, 0.55)` |
| `--lp-elevation-e2` | `0 12px 32px rgba(20, 32, 42, 0.18)` | `0 12px 36px rgba(0, 0, 0, 0.65)` |
| `--lp-opacity-disabled` | `0.5` | `0.5` |
| `--lp-opacity-scrim` | `0.45` | `0.6` |
| `--lp-color-accent-subtle-ring` | `rgba(0, 0, 0, 0.1)` | `rgba(0, 0, 0, 0.1)` |

## Tier 3: Component Tokens

| Token | Value |
| --- | --- |
| `--lp-space-0` | `0px` |
| `--lp-space-2` | `2px` |
| `--lp-space-4` | `4px` |
| `--lp-space-8` | `8px` |
| `--lp-space-12` | `12px` |
| `--lp-space-16` | `16px` |
| `--lp-space-24` | `24px` |
| `--lp-space-32` | `32px` |
| `--lp-space-40` | `40px` |
| `--lp-space-48` | `48px` |
| `--lp-space-64` | `64px` |
| `--lp-size-control-height` | `44px` |
| `--lp-size-control-height-desktop` | `40px` |
| `--lp-size-hit-area` | `44px` |
| `--lp-size-target-min` | `36px` |
| `--lp-size-bar-top-height` | `60px` |
| `--lp-size-bar-editor-height` | `56px` |
| `--lp-size-bar-inset` | `12px` |
| `--lp-size-icon-sm` | `16px` |
| `--lp-size-icon-md` | `20px` |
| `--lp-size-item-pad-y` | `12px` |
| `--lp-size-item-pad-x` | `8px` |
| `--lp-size-tag-pad-y` | `2px` |
| `--lp-size-tag-pad-x` | `8px` |
| `--lp-size-track-height` | `2px` |
| `--lp-size-track-pad` | `4px` |
| `--lp-size-layout-main-max` | `720px` |
| `--lp-size-layout-narrow-max` | `400px` |
| `--lp-size-layout-rail-width` | `320px` |
| `--lp-size-layout-max` | `1180px` |
| `--lp-size-layout-list-col` | `260px` |
| `--lp-size-admin-nav-width` | `240px` |
| `--lp-size-admin-inspector-width` | `340px` |
| `--lp-size-strata-band-min` | `44px` |
| `--lp-size-strata-band-max` | `120px` |
| `--lp-size-btn-item-min` | `96px` |
| `--lp-size-btn-action-min` | `160px` |
| `--lp-size-btn-action-max` | `240px` |
| `--lp-size-gutter` | `16px` |
| `--lp-size-gutter-desktop` | `24px` |
| `--lp-radius-r1` | `4px` |
| `--lp-radius-r2` | `8px` |
| `--lp-radius-control` | `8px` |
| `--lp-radius-container` | `8px` |
| `--lp-radius-overlay` | `8px` |
| `--lp-radius-chip` | `4px` |
| `--lp-radius-pill` | `4px` |
| `--lp-radius-card` | `8px` |
| `--lp-border-hairline` | `1px` |
| `--lp-border-focus` | `2px` |
| `--lp-border-role-rule` | `3px` |
| `--lp-border-banner-rule` | `4px` |
| `--lp-z-base` | `{primitive.zIndex.0}` |
| `--lp-z-raised` | `1` |
| `--lp-z-sticky` | `100` |
| `--lp-z-overlay` | `200` |
| `--lp-z-popover` | `210` |
| `--lp-z-toast` | `300` |
| `--lp-z-modal` | `999` |
| `--lp-z-skip` | `1000` |
| `--lp-motion-duration-instant` | `0.01ms` |
| `--lp-motion-duration-fast` | `100ms` |
| `--lp-motion-duration-item` | `120ms` |
| `--lp-motion-duration-base` | `160ms` |
| `--lp-motion-duration-slow` | `240ms` |
| `--lp-motion-duration-pulse` | `900ms` |
| `--lp-motion-easing-out` | `cubic-bezier(0.2, 0, 0, 1)` |
| `--lp-motion-easing-ease` | `ease` |
| `--lp-font-family-ui` | `'Atkinson Hyperlegible Next', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif` |
| `--lp-font-family-reading` | `'Literata', Georgia, 'Times New Roman', serif` |
| `--lp-font-family-code` | `'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace` |
| `--lp-font-size-12` | `12px` |
| `--lp-font-size-14` | `14px` |
| `--lp-font-size-16` | `16px` |
| `--lp-font-size-24` | `24px` |
| `--lp-font-line-16` | `16px` |
| `--lp-font-line-20` | `20px` |
| `--lp-font-line-24` | `24px` |
| `--lp-font-line-32` | `32px` |
| `--lp-font-line-reading` | `1.65` |
| `--lp-measure-reading` | `68ch` |
| `--lp-editor-min-h` | `60vh` |
| `--lp-size-5` | `5px` |
| `--lp-size-6` | `6px` |
| `--lp-size-9` | `9px` |
| `--lp-size-10` | `10px` |
| `--lp-size-11` | `11px` |
| `--lp-size-13` | `13px` |
| `--lp-size-14` | `14px` |
| `--lp-size-15` | `15px` |
| `--lp-size-18` | `18px` |
| `--lp-size-21` | `21px` |
| `--lp-size-25` | `25px` |
| `--lp-size-28` | `28px` |
| `--lp-size-30` | `30px` |
| `--lp-size-48` | `48px` |
| `--lp-size-52` | `52px` |
| `--lp-size-57` | `57px` |
| `--lp-size-70` | `70px` |
| `--lp-size-80` | `80px` |
| `--lp-size-100` | `100px` |
| `--lp-size-130` | `130px` |
| `--lp-size-140` | `140px` |
| `--lp-size-144` | `144px` |
| `--lp-size-148` | `148px` |
| `--lp-size-230` | `230px` |
| `--lp-size-310` | `310px` |
| `--lp-size-360` | `360px` |
| `--lp-size-420` | `420px` |
| `--lp-size-440` | `440px` |
| `--lp-size-480` | `480px` |
| `--lp-size-520` | `520px` |
| `--lp-size-760` | `760px` |
| `--lp-size-840` | `840px` |
| `--lp-size-920` | `920px` |
| `--lp-size-999` | `999px` |
| `--lp-size-1080` | `1080px` |
| `--lp-size-1280` | `1280px` |
| `--lp-size-0-5` | `0.5px` |
| `--lp-size-1-5` | `1.5px` |
| `--lp-size-32` | `32px` |
| `--lp-size-180` | `180px` |
| `--lp-size-200` | `200px` |
| `--lp-size-220` | `220px` |
| `--lp-size-280` | `280px` |
| `--lp-size-400` | `400px` |
| `--lp-z-3` | `3` |
| `--lp-z-4` | `4` |
| `--lp-z-10` | `10` |
| `--lp-z-20` | `20` |
| `--lp-z-50` | `50` |
| `--lp-elevation-subtle-ring` | `rgba(0, 0, 0, 0.1)` |
| `--lp-size-17` | `17px` |
| `--lp-size-640` | `640px` |

## Reserved Tokens

| Token | Reason |
| --- | --- |
| `--lp-opacity-disabled` | Reserved semantic disabled opacity (0.45) for disabled interactive states |
| `--lp-opacity-scrim` | Reserved semantic scrim opacity (0.45) for overlay backdrops |
| `--lp-space-0` | Reserved in spacing scale (0px) for zero-spacing utility parity |
| `--lp-space-32` | Reserved in raw spacing scale (0,2,4,8,12,16,24,32,40,48,64) for future layout gutters |
| `--lp-space-48` | Reserved in raw spacing scale (0,2,4,8,12,16,24,32,40,48,64) for future section breaks |
| `--lp-size-bar-inset` | Reserved bar inset padding (2px) for dense segmented controls |
| `--lp-size-icon-sm` | Reserved small icon size (14px) for inline status indicators |
| `--lp-size-item-pad-y` | Reserved component token (12px) mirroring item vertical padding |
| `--lp-size-item-pad-x` | Reserved component token (16px) mirroring item horizontal padding |
| `--lp-size-tag-pad-y` | Reserved component token (4px) mirroring tag vertical padding |
| `--lp-size-tag-pad-x` | Reserved component token (8px) mirroring tag horizontal padding |
| `--lp-size-track-height` | Reserved switch track height (24px) |
| `--lp-size-track-pad` | Reserved switch track padding (2px) |
| `--lp-border-focus` | Reserved focus outline width (2px) for high-contrast focus rings |
| `--lp-motion-easing-out` | Reserved motion easing curve (ease-out) for exit transitions |
| `--lp-motion-easing-ease` | Reserved motion easing curve (ease) for general transitions |
| `--lp-font-family-code` | Reserved monospace font stack for code/technical previews |
| `--lp-font-size-12` | Reserved 12px font size token for caption/meta parity |
| `--lp-font-line-16` | Reserved 16px line-height token for compact metadata |
| `--lp-font-line-20` | Reserved 20px line-height token for body copy |
| `--lp-font-line-24` | Reserved 24px line-height token for section headings |
| `--lp-font-line-32` | Reserved 32px line-height token for page titles |
| `--lp-font-line-reading` | Reserved 1.65 reading line-height for longform public prose |
| `--lp-editor-min-h` | Reserved editor textarea minimum height (140px) |
| `--lp-size-25` | Reserved 25px layout dimension token |
| `--lp-size-52` | Reserved 52px layout dimension token |
| `--lp-size-1280` | Reserved 1280px max-viewport container width token |
| `--lp-size-400` | Reserved 400px narrow container width token |
| `--lp-elevation-subtle-ring` | Reserved subtle border-ring elevation for flat cards |
| `--lp-radius-pill` | Reserved pill radius (9999px) for future circular badges |
| `--lp-z-toast` | Reserved z-index layer for toast notifications above overlays |
