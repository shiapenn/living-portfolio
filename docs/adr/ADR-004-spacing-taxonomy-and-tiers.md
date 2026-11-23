---
id: ADR-004
title: Spacing Taxonomy and Monotonic Proximity (D-L4)
status: accepted
date: 2026-11-23
supersedes: null
---

# ADR-004: Spacing Taxonomy and Monotonic Proximity (`D-L4`)

## Decision
Admin spacing uses explicit stack (`--lp-space-stack-<relation>`), inline (`--lp-space-inline-<relation>`), and inset (`--lp-space-inset-<container>`) relations mapped strictly to proximity tiers `1..5` (`4 < 8 < 16 < 24 < 40`) or scale steps. Adjective spacing tokens (`tight`, `related`, `group`, `snug`, `block`, `page`, `display`, `note`, `compact`, `sub-compact`, `hairline`) are deleted.
