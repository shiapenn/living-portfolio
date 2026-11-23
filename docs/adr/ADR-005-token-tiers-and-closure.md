---
id: ADR-005
title: Three-Tier Tokens and Arithmetic Closure (D-L5)
status: accepted
date: 2026-11-23
supersedes: null
area: tokens
rules:
  - id: R-005-1
    text: "Zero unresolved token aliases, zero emitted primitives, and full CSS custom property closure"
    enforced_by: scripts/verify-css-variables
---

# ADR-005: Three-Tier Tokens and Arithmetic Closure (`D-L5`)

## Decision
Tokens follow three tiers (`primitive -> semantic -> component`). Primitives resolve at build time and are never emitted as `--lp-prim-*` in shipped CSS. Every emitted token must be used (`defined = used`, zero unused tokens, zero `reserved` list).
