# Design System Map & Governance

> **Principle (`D-M0`):** One thin shared core (`@living-portfolio/ui-core`), two independent design languages (`@living-portfolio/ui-admin` and `@living-portfolio/ui-public`).

## 1. Which Language to Use Where

| Surface | Package | Token Pack | Class / Var Prefix | Governance Mode |
| --- | --- | --- | --- | --- |
| Shared core floor (a11y, theme, layout, icons) | `@living-portfolio/ui-core` | `packs/core.json` | `lp-core-*` / `--lp-core-*` | Semver-versioned; requires both regression suites green |
| Admin workspace (`/admin/*`) | `@living-portfolio/ui-admin` | `packs/admin.json` | `lp-*` / `--lp-*` | **System mode (`D-J`)**: no new component without L approval |
| Public site (`/`, `/work`, `/writing`, `/build`, `/timeline`, `/ask`, `/book`) | `@living-portfolio/ui-public` | `packs/public.json` | `pub-*` / `--pub-*` | **Expressive mode (`D-M3`)**: new components/tokens allowed with a PR brief; reviewed at sheet time |

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
- Generated Decisions Index: `docs/design/decisions.md` (run `node scripts/generate-decisions`)
- Generated Tokens Reference: `docs/design/tokens.md` (run `node packages/design-tokens/generate.mjs`)
- Generated Component Registry: `docs/design/components.json` (run `node scripts/generate-registry`)
