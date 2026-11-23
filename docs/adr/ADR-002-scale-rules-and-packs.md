---
id: ADR-002
title: Rule-Governed Scale Packs and Proximity Tiers (D-M2)
status: accepted
date: 2026-11-23
supersedes: null
---

# ADR-002: Rule-Governed Scale Packs and Proximity Tiers (`D-M2`)

## Decision
Each token pack (`packs/core.json`, `packs/admin.json`, `packs/public.json`) declares its own mathematical scale rules and governance metadata (`status`, `since`, `replacedBy`) validated by `packages/design-tokens/src/rules.test.ts`. Admin enforces a 4px space scale, proximity tiers `1..5` (`4, 8, 16, 24, 40`), 80px layout lattice, `12..48` type ramp, `400`/`600` weights, `1/2/4` borders, `e2 = 2x e1` elevation, and WCAG AA contrast (`4.5:1` text, `3:1` UI). Public declares its own fluid modular type scale and atmosphere space up to `256px`.
