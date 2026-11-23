---
id: ADR-001
title: One Thin Core, Two Design Languages (D-M0 / D-M1)
status: accepted
date: 2026-11-23
supersedes: null
area: architecture
rules:
  - id: R-001-1
    text: "Separate UI into ui-core, ui-admin (lp-*), and ui-public (pub-*) with zero cross-language imports or bundles"
    enforced_by: scripts/verify-design-boundaries
  - id: R-001-2
    text: "Share one core accent seed across admin and public via user-theme accent.<hash>.css"
    enforced_by: packages/ui-core/src/accent/accent.test.ts
---

# ADR-001: One Thin Core, Two Design Languages (`D-M0` / `D-M1`)

## Decision
Separate the UI into one thin shared core (`@living-portfolio/ui-core`) and two independent design languages: `@living-portfolio/ui-admin` (`lp-*`, `--lp-*`) and `@living-portfolio/ui-public` (`pub-*`, `--pub-*`). Ship separate hashed, immutable cascade-layered CSS bundles (`core.css`, `admin.css`, `public.css`). Admin ships zero public CSS/JS and public ships zero admin CSS/JS. Enforce boundaries via `.dependency-cruiser.cjs` and `scripts/verify-design-boundaries`.

## Amendment (WP-16.N, `D-N1`)
The public language direction is decided in [ADR-007](ADR-007-public-direction-quiet-editorial-neutral.md): Quiet Editorial, made neutral. The exploration lab (`/_lab/public/*`) and the direction packs no longer exist. Both languages share one accent seed from the core pack (`D-N2`).
