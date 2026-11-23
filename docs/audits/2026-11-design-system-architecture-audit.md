# Design System Architecture & Public Foundations Audit (2026-11)

| Field | Value |
| --- | --- |
| Audit ID | `AUD-2026-11-DS-ARCH` |
| Work Package | `WP-16.M` (`M1`) |
| Date | `2026-11-23` |
| Baseline Commit | `6b030ab` (`A169`, WP-16.L L4 closure) |
| Scope | File architecture, token rules (`D-M2`), public site inventory & budgets (`D-M3`/`D-M4`), governance (`D-M6`), performance |

---

## Executive Summary

No concrete blockers were found against `D-M0` through `D-M7`. The current codebase has a clean TypeScript package graph (`0` circular imports across workspaces) and zero raw `px`/`hex` leaks in public templates, but suffers from four structural problems that `WP-16.M` resolves:

1. **Monolithic inline CSS (`apps/web/src/styles.ts`)**: `5,639` lines (`142,331` bytes raw, `19,442` bytes gzip) plus `17,917` bytes (`3,750` bytes gzip) of `tokens.css` are inlined inside `<style>` on **every** SSR HTML response—both admin and public. Every public visitor downloads `~112.4 KB` of admin-only `.lp-*` CSS on every page navigation with zero HTTP caching.
2. **Coupled design languages**: All `11` public files (`public-shell.ts` + `10` page templates) import `STRATA_DESIGN_SYSTEM_CSS` and reference `374` `--lp-*` custom properties and `201` inline `style="..."` attributes. Public cannot evolve its own visual identity without risking admin regressions.
3. **Token scale drift (`D-M2`)**: `packages/design-tokens/tokens.json` holds `219` primitive, `52` semantic, `173` component, and `20` relation tokens, with `40` scale-rule violations (`6` off-grid space values, `7` off-ramp font sizes, `1` off-rule border `3px`, `22` non-4px-multiple sizes, `3` off-rule motion durations, `1` off-rule easing `ease`, `1` non-em letter-spacing `0.5px`, elevation offsets `6px`/`12px` off the 4px grid, and `16` adjective space tokens). Three legacy/test-only tokens (`canary-probe`, `bar-legacy-offset`, `hatch-step`) live in the global token table.
4. **Governance & gallery drift risk**: `docs/design/components.json` and gallery views are hand-maintained, D-rules are scattered across plans/receipts rather than `docs/adr/`, there is no `CODEOWNERS` for design packages, and no machine-readable `docs/plans/backlog.yml`.

---

## 1. File Architecture & Module Boundaries

### 1.1 Workspace Dependency Graph
- Current packages: `@living-portfolio/config`, `@living-portfolio/core`, `@living-portfolio/db`, `@living-portfolio/ai`, `@living-portfolio/client`, `@living-portfolio/design-tokens`.
- Current apps: `@living-portfolio/api`, `@living-portfolio/web`, `@living-portfolio/worker`.
- **Cycles**: `0` workspace-level cycles; `0` cross-page admin imports (enforced by `scripts/verify-ui-guards`).
- **Missing boundaries**: `apps/web/src/primitives/`, `apps/web/src/components/`, `apps/web/src/patterns/`, and `apps/web/src/styles.ts` are all co-located inside `apps/web` with no package-level enforcement separating core, admin (`lp-`), and public (`pub-`).

### 1.2 `apps/web/src/styles.ts` Monolith Breakdown
- Total size: `5,639` lines / `142,331` bytes raw (`19,442` bytes gzip).
- Estimated split by selector ownership:
  - **Admin-only (`.lp-*`)**: `112,445` bytes (`79.0%`)
  - **Shared / reset / base / utilities**: `20,177` bytes (`14.2%`)
  - **Public-only (`.site-*`, `.hero-*`, `.entry-*`, `.strata-*`, `.ask-*`, `.timeline-*`, `.build-*`, `.book-*`)**: `9,709` bytes (`6.8%`)
- Major monolith sections:
  - Base, primitives & legacy components (`L1–L3492`): `84,158` bytes
  - `D-FINAL Design System (F1)` (`L4960–L5639`): `24,232` bytes
  - `D-LAYOUT Full-Screen Editor` (`L3650–L4700`): `23,435` bytes
  - `D-SYS Foundations (WP-16.S S1)` (`L4701–L4959`): `7,219` bytes
  - `D-LAYOUT Shell, Launcher, Page Template, List Row, Auth` (`L3493–L3649`): `3,288` bytes
- **Target (`D-M1`)**: Split into `packages/ui-core`, `packages/ui-admin`, and `packages/ui-public` with per-component `.css` files compiled into cascade layers (`reset, tokens, base, primitives, components, patterns, templates, pages, utilities`) and served as hashed, immutable static bundles (`core.<hash>.css`, `admin.<hash>.css`, `public.<hash>.css`).

---

## 2. Tokens Audit Against `D-M2`

### 2.1 Current Token Counts (`packages/design-tokens/tokens.json`)
| Tier / Category | Count |
| --- | ---: |
| Primitive (`primitive.*`) | 219 |
| Semantic per theme (`semantic.light.*` / `semantic.dark.*`) | 52 |
| Component (`component.*`) | 173 |
| Relations (`relations.*`) | 20 |
| Typography roles (`typographyRoles.*`) | 8 |
| Responsive overrides (`responsive.*`) | 2 |

### 2.2 Scale-Rule Violations per Category
| Category | Rule (`D-M2`) | Violation Count | Violating Entries |
| --- | --- | ---: | --- |
| Space primitives | `0, 2, 4, 8, 12, 16, 24, 32, 40, 48, 64, 96` px | 6 | `5px`, `6px`, `10px`, `14px`, `20px`, `28px` |
| Adjective space tokens | Delete; map relations to proximity tiers `1..5` (`4, 8, 16, 24, 40`) or scale steps | 16 | `stack.{hairline,compact,sub-compact,tight,note,snug,related,group,display,block,page}`, `inline.{hairline,snug,related,group}`, `inset.compact` |
| Type ramp | `12, 14, 16, 18, 20, 24, 28, 32, 40, 48` px | 7 | `10px`, `11px`, `13px`, `15px`, `17px`, `21px`, `30px` |
| Type weights | `400` and `600` only (unless justified) | 2 | `500` (check usage), `700` (check usage) |
| Letter-spacing | `em` units only | 1 | `letter-wide: 0.5px` -> `0.03em` |
| Border widths | `0, 1, 2, 4` px | 1 | `border.3: 3px` (`--lp-border-role-rule`) -> `4px` (or `2px`) |
| Component sizes | Multiples of `4px`; layout widths on `80px` lattice (`320..1200`) | 22 | `1px`, `2px`, `3px`, `5px`, `6px`, `9px`, `10px`, `11px`, `13px`, `14px`, `15px`, `17px`, `18px`, `21px`, `30px`, `57px`, `70px`, `130px`, `230px`, `310px`, `340px`, `1180px` (+ `0.5px`, `1.5px`) |
| Elevation offsets | Space scale, `e2 = 2x e1` (`4/16`, `8/32`) | 2 | `e1-offset-y: 6px` -> `4px`, `e2-offset-y: 12px` -> `8px` |
| Motion durations | `0, 80, 160, 240` ms (loop `960` ms) | 3 | `fast: 100ms` -> `80ms`, `item: 120ms` -> `80ms`, `pulse: 900ms` -> `960ms` |
| Motion easing | `standard` and `out` only (delete `ease`) | 1 | `easing-ease: ease` |

### 2.3 Single-Use & Legacy/Test-Only Tokens
- **Single-use global component tokens**: `60` tokens referenced once in production code (of which `20` are intentional relation tokens in `D-L4`; the remaining `40` single-use dimensions/insets should become component-local `_` custom properties or map to proximity tiers).
- **Legacy / test-only tokens**:
  - `--lp-size-canary-probe` (`80px`): used only by canary/test CSS in `styles.ts`.
  - `--lp-size-bar-legacy-offset` (`57px`): legacy top-bar offset in `styles.ts`.
  - `--lp-size-hatch-step` (`1.5px`): single-use diagonal hatch pattern step in `styles.ts`.

---

## 3. Public Site Inventory & Baseline (`D-M4`)

### 3.1 Routes & Templates
| Route(s) | Template File | Raw TS Bytes | `--lp-*` Refs | Inline `style=` | Client JS Bundle |
| --- | --- | ---: | ---: | ---: | --- |
| `/`, `/home` | `apps/web/src/pages/public/home.ts` | 5,091 | 19 | 9 | None (inline theme script only) |
| `/work`, `/writing` | `apps/web/src/pages/public/entries-index.ts` | 5,869 | 18 | 9 | None |
| `/work/:slug`, `/writing/:slug`, `/build/:slug` | `apps/web/src/pages/public/entry.ts` | 14,095 | 49 | 24 | Inline Strata script |
| `/build` | `apps/web/src/pages/public/build.ts` | 7,934 | 54 | 30 | None |
| `/timeline` | `apps/web/src/pages/public/timeline.ts` | 3,131 | 14 | 6 | Inline Strata script |
| `/ask` | `apps/web/src/pages/public/ask.ts` | 20,618 | 67 | 49 | Inline Ask script |
| `/ask/status/:token` | `apps/web/src/pages/public/ask-status.ts` | 8,930 | 68 | 29 | None |
| `/book` | `apps/web/src/pages/public/book.ts` | 9,551 | 50 | 30 | Inline Book script |
| `/now`, `/about`, `/uses` | `apps/web/src/pages/public/static.ts` | 1,655 | 0 | 0 | None |
| 404 | `apps/web/src/pages/public/not-found.ts` | 1,774 | 13 | 7 | None |
| Shell (all public routes) | `apps/web/src/layouts/public-shell.ts` | 7,401 | 22 | 8 | Inline theme toggle (`~1.5 KB`) |

### 3.2 Baseline Payload & Core Web Vitals
- **CSS shipped per public route (baseline)**: `160,248` bytes raw (`23,192` bytes gzip), inlined in `<head><style>` on every navigation (`79%` admin-only CSS).
- **JS shipped per public route (baseline)**: `~1.5 KB` inline theme script (`0` external ES bundles on home/index/static; `~2–4 KB` inline script on interactive `/ask`, `/book`, `/timeline`).
- **Fonts (baseline)**: `0` bytes network transfer (`@font-face` uses `local(...)` with system serif/sans/mono fallbacks; `font-display: swap`).
- **Hard-coded values in public templates**: `0` raw `px`, `0` raw `hex` (all previously migrated to `--lp-*`), `201` inline `style=` attributes.
- **Proposed Public Performance Budgets (`D-M3`, non-blocking report until L approves)**:
  - Font families: `<= 2` open-licensed (SIL OFL 1.1 / Apache 2.0), self-hosted WOFF2 subsets, total font payload `<= 120 KB` gzipped.
  - Public CSS bundle (`core.css + public.css`): `<= 12 KB` gzipped per route (down from `23.2 KB` baseline).
  - Public JS per route: `<= 15 KB` gzipped.
  - Core Web Vitals targets: `LCP <= 2.5s` (simulated mid-tier 4G), `CLS <= 0.05`, `INP <= 200ms`.
  - Zero render-blocking third-party requests; explicit image dimensions; zero canvas/WebGL.

---

## 4. Governance Inventory

| Artifact / Guard | Current State | Gap for `D-M6` / `D-M7` |
| --- | --- | --- |
| `docs/design/tokens.md` | Generated by `packages/design-tokens/generate.mjs` | Extend to multi-pack (`core`, `admin`, `public`) + drift guard |
| `docs/design/components.json` | Hand-maintained (`8,887` bytes) | Generate from co-located `*.gallery.ts` registries |
| `docs/design/README.md` | Missing | Create map (how to choose token/component/template, language rules) |
| `docs/adr/` & `docs/design/decisions.md` | Missing (D-rules scattered in plans/receipts) | Migrate D-rules into ADRs; generate `decisions.md` |
| `.github/pull_request_template.md` | Generic template (`1,054` bytes) | Add admin Component Statement / public Component Brief, token statement, gallery sample, screenshots |
| `.github/CODEOWNERS` | Missing | Add ownership for `packages/design-tokens`, `ui-core`, `ui-admin`, `ui-public` |
| `docs/plans/backlog.yml` & `pnpm backlog:next` | Missing | Create schema-checked backlog & selector CLI |
| Dependency / namespace guards | `scripts/verify-dependency-rules` (API/web only) | Add `dependency-cruiser` config + `lp-`/`pub-` namespace isolation guard |
