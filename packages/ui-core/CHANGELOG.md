# Changelog — @living-portfolio/ui-core

> Generated from `.changeset/*.md` via `pnpm ds:changelog`.

## MINOR (wp16n-consolidation)

WP-16.N design system consolidation:
- Cleaned value-duplicate, theme-invariant, and single-use tokens; enforced chroma-neutral public neutrals and OKLCH accent ramp generation with zero overrides.
- Added self-hosted variable Latin WOFF2 fonts (Literata + Atkinson Hyperlegible Next) with metric fallbacks and CJK `:lang(zh)` rules in `@living-portfolio/ui-core` and `@living-portfolio/ui-public`.
- Migrated all admin CSS out of `apps/web/src/styles.ts` into layered, route-split hashed bundles in `@living-portfolio/ui-admin` with zero pixel regression.
- Added ADR-generated `rules.md`, `ds:impact`, `ds:health`, nightly health workflow, and changeset governance.

## MINOR (wp17-10-exit-gate)

WP-17.10 exit-gate fixes: add unified `formatAdminDate` / `formatAdminDateTime` in `ui-core`, constrain Account QR code to `<= 192px` via `--lp-size-grid-card-min` token, and ensure status dot-to-label gap uses `--lp-space-inline-icon-text`.

## MINOR (wp17-9-polish-contracts)

Implement WP-17.9 polish contracts (ADR-024, D1-D6): horizontal scroll-snap + edge-fade Tabs with >= 44px targets, unboxed/unindented EmptyState aligned to heading ink edge, uniform Item anatomy across 320px and 1280px, Appearance v2 composed preview container, and single-seed OKLCH light/dark accent derivation.

## MINOR (wp17-appearance-v2)

Add Appearance v2 typed theme-pack schema, WCAG AA contrast validation, built-in packs, and cacheable `theme.<hash>.css` (`@layer user-theme`) generator with zero-cost default fallback (WP-17.8).
