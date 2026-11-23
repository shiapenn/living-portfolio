# Accent seed contract (D-N2)

Status: generator, validation and tests landed in WP-16.N N1. Runtime wiring and the settings UI are not built yet; Appearance v2 (WP-17.4) configures the seed for both languages.

## Contract

| Item | Definition |
| --- | --- |
| Source of truth | `accent.seed` in `packages/design-tokens/packs/core.json` (light and dark seeds) |
| Generator | `generateAccentRamp` in `packages/ui-core/src/accent/accent.ts` (OKLCH curve, ten steps) |
| Validation | `validateAccentSeed` rejects seeds that fail AA in either theme (text 4.5:1, UI 3:1, on-accent label 4.5:1) |
| Output | `buildAccentCss` emits one `@layer user-theme` file declaring `--lp-core-accent-<step>` only |
| File name | `accent.<hash>.css`, hash from content, immutable caching |
| Default | the default seed equals today's admin accent; unchanged builds emit the same bytes |
| Overrides | `accent.overrides` lists steps kept at today's admin value, each with a reason |
| Consumers | admin and public map their accent semantics to `--lp-core-accent-*` |

## Current overrides

| Step | Reason |
| --- | --- |
| 200 | generated value is delta-E 2000 of 2.01 from admin indigo-200 (limit 2) |
| 800 | generated value is delta-E 2000 of 4.43 from admin indigo-800 |
| 900 | generated value is delta-E 2000 of 6.15 from admin indigo-900 |
