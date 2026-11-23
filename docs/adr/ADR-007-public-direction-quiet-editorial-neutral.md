---
id: ADR-007
title: Public Direction - Quiet Editorial, Made Neutral (D-N1)
status: accepted
date: 2026-11-23
supersedes: null
area: public-language
rules:
  - id: R-007-1
    text: "Public neutrals stay strictly chroma-neutral (OKLCH chroma <= 0.01) with real self-hosted WOFF2 editorial fonts and CJK :lang(zh) support"
    enforced_by: packages/design-tokens/src/rules.test.ts
---

# ADR-007: Public Direction - Quiet Editorial, Made Neutral (`D-N1`)

## Decision
The public site direction is **Quiet Editorial, made neutral**. Strata and Field Notebook are rejected and their packs, lab routes and prototype code are deleted. `docs/design/explorations/index.md` is the only record kept.

- **Neutral:** public neutrals use a chroma-neutral ramp (OKLCH chroma at most 0.01, enforced by a test). No warm paper tint. Light is white or near-white with near-black text; dark is near-black with off-white text. Hairline rules and whitespace carry structure. Eyebrows and labels use `text-2`, not the accent. Bracket labels such as `[GOAL]` become proper label styling.
- **Type:** serif for titles and reading, sans for UI (shared with admin). Fonts are self-hosted WOFF2, subset, `font-display: swap`, with metric-adjusted fallbacks. CJK fallbacks and `:lang(zh)` rules are part of the stacks.
- **One accent:** public links, focus ring, active nav and selection use the accent only, generated from the shared core seed (`accent.seed`, see `accent-contract.md`).
- **Scope fence:** the time travel component and the three-column public frame are backlog items `P-4` and `P-5`, not part of WP-16.

## Consequences
- ADR-001 is amended: the public language is no longer an open exploration.
- `P-1` is closed by this decision; WP-16.N N3 realises it.
