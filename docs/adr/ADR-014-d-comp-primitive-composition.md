---
id: ADR-014
title: Component Composition and Primitives (D-COMP)
status: accepted
date: 2026-11-23
supersedes: null
area: components
rules:
  - id: R-014-1
    text: "Admin primitives and components pass composition and markup contract unit tests"
    enforced_by: apps/web/src/primitives/dcomp.test.ts
---

# ADR-014: Component Composition and Primitives (D-COMP)

## Decision
Migrates the D-COMP decision family: every UI surface is composed from registered primitives and components with co-located gallery samples and unit tests.
