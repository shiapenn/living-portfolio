# Design System Map & Governance

> **Principle (`D-M0`, amended by `ADR-023`):** One unified design framework (shared token contract, rules, shared components in `@living-portfolio/ui-core`, and tooling) governing two differentiated design languages (`@living-portfolio/ui-admin` and `@living-portfolio/ui-public`).

## 1. Which Language to Use Where

| Surface | Package | Token Pack | Class / Var Prefix | Governance Mode |
| --- | --- | --- | --- | --- |
| Shared framework & primitives (a11y, theme, layout, icons, button, link, tag, field, choice, notice) | `@living-portfolio/ui-core` | `packs/core.json` + contract | `lp-core-*` / `--lp-core-*` | Semver-versioned; uses contract tokens only; requires both admin and public suites green |
| Admin workspace (`/admin/*`) | `@living-portfolio/ui-admin` | `packs/admin.json` | `lp-*` / `--lp-*` | **System mode (`D-J`, `ADR-023`)**: no new component without L approval; variants only |
| Public site (`/`, `/work`, `/writing`, `/build`, `/timeline`, `/ask`, `/book`) | `@living-portfolio/ui-public` | `packs/public.json` | `pub-*` / `--pub-*` | **Expressive mode (`D-M3`, `ADR-023`)**: brief recorded in PR, reviewed after the fact |

## 2. How to Choose a Token, Component, and Template

1. **Tokens (`docs/design/tokens.md`)**:
   - Admin vertical gaps: use `--lp-space-stack-<relation>` or proximity levels `--lp-space-proximity-1..5` (`4, 8, 16, 24, 40`).
   - Public tokens: use `--pub-*` tokens from `packages/design-tokens/packs/public.json`. Never reference `--lp-*` component tokens in public code.
   - All tokens carry governance metadata (`status: active | deprecated`, `since`, `replacedBy`) and must pass `packages/design-tokens/src/rules.test.ts`.
2. **Components (`docs/design/components.json`)**:
   - Generated from co-located `*.gallery.ts` files via `node scripts/generate-registry`.
   - Admin pages must only emit registered `data-c` components and `lp-*` class families.
   - Public pages may introduce `pub-*` components with a recorded PR brief (purpose, why no existing component fits, accessibility, performance cost, tokens used, gallery sample).
3. **Promotion Rule (`D-M1`)**:
   - A component moves into `@living-portfolio/ui-core` only when both languages genuinely need it, via a semver-versioned change that passes both admin and public regression suites.

## 3. Lifecycle & Deprecation (`D-M6`)

- **States**: `proposed` -> `active` -> `deprecated` -> `removed`.
- **Deprecation window**: Minimum one full work package between `deprecated` (with `replacedBy` populated) and `removed`.
- **Changelog & Semver**: Each UI package (`design-tokens`, `ui-core`, `ui-admin`, `ui-public`) is independently semver-versioned.

## 4. Where Decisions Live

- Architecture Decision Records: `docs/adr/ADR-*.md`
- Admin Content Standard: `docs/design/content.md` (`ADR-024`)
- Admin Feedback Placement & Timing: `docs/design/feedback.md` (`ADR-025`)
- Admin Rhythm, Type & Mobile Input Standard: `docs/design/rhythm-type.md` (B1–B4)
- Admin Screen Brief Gate: `docs/design/screen-brief.md` (Part C)
- Admin Design Audit Protocol: `docs/design/audit-protocol.md` (D8, `pnpm design:audit`)
- Generated Decisions Index: `docs/design/decisions.md` (run `node scripts/generate-decisions`)
- Generated Effective Rules: `docs/design/rules.md` (run `node scripts/generate-rules`)
- Generated Tokens Reference: `docs/design/tokens.md` (run `node packages/design-tokens/generate.mjs`)
- Generated Component Registry: `docs/design/components.json` (run `node scripts/generate-registry`)
