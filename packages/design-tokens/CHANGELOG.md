# Changelog — @living-portfolio/design-tokens

> Generated from `.changeset/*.md` via `pnpm ds:changelog`.

## MINOR (wp16n-consolidation)

WP-16.N design system consolidation:
- Cleaned value-duplicate, theme-invariant, and single-use tokens; enforced chroma-neutral public neutrals and OKLCH accent ramp generation with zero overrides.
- Added self-hosted variable Latin WOFF2 fonts (Literata + Atkinson Hyperlegible Next) with metric fallbacks and CJK `:lang(zh)` rules in `@living-portfolio/ui-core` and `@living-portfolio/ui-public`.
- Migrated all admin CSS out of `apps/web/src/styles.ts` into layered, route-split hashed bundles in `@living-portfolio/ui-admin` with zero pixel regression.
- Added ADR-generated `rules.md`, `ds:impact`, `ds:health`, nightly health workflow, and changeset governance.
