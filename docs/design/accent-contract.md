# Accent seed contract (D-N2)

Status: generator, validation, tests, and runtime wiring landed in WP-16.N S1. Appearance v2 (WP-17.4) will configure the seed for both languages.

## Contract

| Item | Definition |
| --- | --- |
| Source of truth | `accent.seed` in `packages/design-tokens/packs/core.json` (light and dark seeds) |
| Generator | `generateAccentRamp` in `packages/ui-core/src/accent/accent.ts` (OKLCH curve, ten steps) |
| Validation | `validateAccentSeed` rejects seeds that fail AA in either theme (text 4.5:1, UI 3:1, on-accent label 4.5:1) |
| Output | `buildAccentCss` emits one `@layer user-theme` file declaring `--lp-core-accent-<step>` only |
| File name | `accent.<hash>.css`, hash from content, immutable caching, served at `/assets/css/accent.<hash>.css` |
| Default | the default seed equals today's admin accent; unchanged builds emit the same bytes |
| Overrides | none required — tuned OKLCH curve keeps all admin steps within delta-E 2000 of 2 (max 0.93) |
| Consumers | admin (`tokens.css`) and public (`public.css`) map their accent semantics to `var(--lp-core-accent-*, <fallback>)` |
