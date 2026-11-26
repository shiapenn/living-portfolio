# Admin Design Audit Protocol (D8)

> Authoritative seven-level (`L0`–`L6`) automated design audit protocol for `@living-portfolio/ui-admin`, run via `pnpm design:audit` (and enforced inside `pnpm wp16n:verify` + Playwright `tests/e2e/wp17-13-design-audit.spec.ts`). Spacing contracts are measured on **layout boxes** (`getBoundingClientRect()`); painted ink is reserved for alignment and visibility checks.

## Audit Levels (`L0`–`L6`)

| Level | Name | Contract Enforced | Enforcement |
| --- | --- | --- | --- |
| **L0** | Text Purposes | Closed `data-purpose` set (`title`, `label`, `value`, `helper`, `consequence`, `status`, `feedback`, `empty`, `meta`, `intro`); zero section intro text; consequence notes directly above their `ActionBar`. | `K17`, `pnpm design:audit` |
| **L1** | Structure Tiers | Page -> Section -> Group -> Control/Item hierarchy; `List` `definition` variant for key-value detail views; no orphan text nodes. | `wp16-k`, `K21` |
| **L2** | Rhythm (Box Gaps) | Containers own spacing via `S1`–`S5` gap tokens (`--lp-space-proximity-1..5`); each relation maps to exactly one gap per viewport; every `ActionBar` has `S4` above it (or `S2` below its `consequence` note + `S4` above the note) regardless of previous element role. | `K14`, `K15` |
| **L3** | Type Roles | No rendered admin text below the `secondary` floor; merged `secondary` role (`text-2`, `>= 7:1` contrast); `text-3` reserved for placeholder and disabled; definition labels never larger or bolder than values. | `K18` |
| **L4** | Interaction | Action groups `<= 2` controls on one row at compact width; one primary CTA per form; full state matrix (`default/hover/focus-visible/active/disabled/busy`) with distinct token-backed states. | `K19`, `K20` |
| **L5** | Tokens | Palette-membership census (every painted background, border, and text colour resolves to an active pack token, unmatched = 0); light/dark token-chain parity; dark first paint zero light surfaces; unified link styles (`<= 2`: action link + inline/citation link). | `K20`, `pnpm design:audit` |
| **L6** | Components | Registered components carry zero outer margins (`allowlist = []`); no local overrides; full component inventory coverage. | `K16`, `pnpm design:audit` |

## Baseline Audit (`e29cc38`, Pre-WP-17.13)

Measured across 20 admin routes × `320 / 1280` × `light / dark` (`80` captures):

| Level | Measured | Baseline Violations (`e29cc38`) | Root Cause Summary |
| --- | --- | --- | --- |
| **L0** Text Purposes | 356 | **388** (`32` section intros + `356` missing `data-purpose`) | Section descriptions rendered as intros; `Text` had no `data-purpose` attribute |
| **L1** Structure Tiers | 42 states | **0** | Baseline `wp16-k` clean; Booking detail lacked `definition` list variant |
| **L2** Rhythm (Box Gaps) | 48 | **2** (`42` above Re-enrol / End sessions on Account) | Empty `.lp-stack` wrapper inside `FormSection` stacked `S3 + S4` above `ActionBar` |
| **L3** Type Roles | 1832 | **216** (`216` text nodes below `13`) | Legacy `meta/helper` and `secondary` used size `12` |
| **L4** Interaction | 132 | **2** (`2` wrapped ActionBars at compact width) | Two-button bars wrapped when labels exceeded container |
| **L5** Tokens & Links | 44 links | **2** non-accent link styles (`text-3` grey underlined + `text-1` unstyled) | `.lp-item-link.lp-caption` inherited `text-3` colour; `admin-shell` hard-coded `data-theme="light"` |
| **L6** Components | 1184 | **3** CSS margin rules in `ui-admin` | Residual component margin rules (`dghl-polish.css`, `item.css`, `reset-and-typography.css`) |

## Target & Exemptions

- **Shrinking-only exemption budget:** `0` across `L0`–`L6`.
- Run statically via `pnpm design:audit` (wired into `pnpm wp16n:verify`) and live across all routes via `pnpm exec playwright test tests/e2e/wp17-13-design-audit.spec.ts`.
