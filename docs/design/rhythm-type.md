# Admin Rhythm, Type & Mobile Input Standard

> Authoritative admin spacing (`B2`), typography (`B3`), and mobile input (`B4`) specification, established from the `B1` painted-ink audit on `cd6a3d1` (WP-17.12). Public site rhythm and type are governed separately in `WP-19.0`.

## B1 Baseline Audit (`cd6a3d1`)

Measured across 20 admin routes × `320 / 1280 / 1920` × `light / dark` (`120` captures):

| Relation | Baseline Count | Baseline Distinct Values (px) | Baseline Spread | Normalised Tier (B2) |
| --- | --- | --- | --- | --- |
| `title->description` (inside element) | 114 | `8` | 8 | **S1** (`4px`) |
| `label->control` | 186 | `8` | 8 | **S2** (`8px`) |
| `control->helper/error` | 102 | `8` | 8 | **S2** (`8px`) |
| `field->field` | 84 | `16` | 16 | **S3** (`16px`) |
| `block->block in a group` | 342 | `8, 16, 24, 40` | 8–40 | **S3** (`16px`) / **S4** (`24px`) |
| `element->attached action` | 90 | `24, 40` | 24–40 | **S4** (`24px`, section) / **S5** (`40px`, page) |
| `page title->content` | 120 | `24` | 24 | **S4** (`24px`) |
| `section->section` | 114 | `40` | 40 | **S5** (`40px`) |

- **Baseline distinct `(role, size, weight, colour)` combinations:** `18` across light & dark (`9` per theme: `label` collided with `item-title` at size 14 weight 600 and split across weights 400/600; `secondary` split across sizes 12 and 14).
- **Baseline mobile inputs at compact width `320`:** `31 / 31` visible inputs/selects/textareas were size `14` (below the iOS Safari zoom floor of `16`).

## B2 Closed Spacing Model (`S1`–`S5`)

Tiers are strictly increasing, each `>= 1.5×` the previous, mapped directly to `--lp-space-proximity-1..5` (default comfortable density):

| Tier | Token | Value | Ratio vs Prev | Closed Relations |
| --- | --- | --- | --- | --- |
| **S1** | `--lp-space-proximity-1` | `4px` | — | Inside an element: `icon<->label`, `title<->description`, compact item title-to-status row gap |
| **S2** | `--lp-space-proximity-2` | `8px` | `2.0×` | `label->control`, `control->helper/error`, status row internals inside an item |
| **S3** | `--lp-space-proximity-3` | `16px` | `2.0×` | Sibling elements in a group: `field->field`, `notice<->block`, `ActionBar->feedback`, attached action, Credential block internals, `section heading->content` |
| **S4** | `--lp-space-proximity-4` | `24px` | `1.5×` | `group->group` inside a section, `control->ActionBar`, `page title->content`, Credential block to next content |
| **S5** | `--lp-space-proximity-5` | `40px` | `1.67×` | `section->section`, `last-section->page ActionBar` |

Every measured relation gap must equal its tier within tolerance (`K12`). Zero measured pairs for any relation fails the check.

## B3 Admin Type Model (8 Closed Roles)

Every neighbouring role differs by at least **two** of: size step (`>= 2` scale points), weight step (`>= 100`), or colour tier (`text-1`, `text-2`, `text-3`, all `>= 4.5:1` WCAG AA in light & dark). Applied in one place via `packages/design-tokens/packs/admin.json` and `packages/ui-admin/src/templates/dfinal-system.css`:

| # | Role | CSS Selectors | Size | Weight | Colour Tier | Line | Diff vs Prev |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | `page-title` | `.lp-page-title` | `24px` | `700` | `text-1` | `32px` | — |
| 2 | `section-title` | `.lp-section-title`, `.lp-form-section-title` | `18px` | `600` | `text-1` | `24px` | `-6` (`>=4`), `-100` (2 axes) |
| 3 | `item-title` | `.lp-item-title` | `16px` | `500` | `text-1` | `24px` | `-2`, `-100` (2 axes) |
| 4 | `label` | `.lp-field-label` | `14px` | `500` | `text-2` | `20px` | `-2`, `text-2` (2 axes; 3 axes lighter than `section-title`) |
| 5 | `body` | `.lp-body`, `.lp-item-body`, `body` | `14px` | `400` | `text-1` | `20px` | `-100`, `text-1` (2 axes; 2 axes below `item-title`) |
| 6 | `secondary` | `.lp-page-description`, `.lp-form-section-desc`, `.lp-description`, `.lp-item-subtitle` | `12px` | `500` | `text-2` | `16px` | `-2`, `+100`, `text-2` (3 axes) |
| 7 | `meta/helper` | `.lp-field-help`, `.lp-help-text`, `.lp-caption`, `.lp-item-meta` | `12px` | `400` | `text-3` | `16px` | `-100`, `text-3` (2 axes) |
| 8 | `mono` | `code`, `pre`, `.lp-credential-single`, `.lp-credential-cell` | `12px` | `400` | `text-1` | `20px` | `text-1`, `JetBrains Mono` |

Specimen rendered at `/admin/_gallery#gallery-type-specimen` and captured at `320` and `1280`.

## B4 Mobile Inputs (Compact Floor)

All `<input>` (text/email/password/number/search/url/date), `<select>`, and `<textarea>` elements render using `var(--lp-font-size-16)` uniformly across compact and desktop widths so iOS Safari never auto-zooms on focus and control type signatures remain uniform (`K13`).
