---
id: ADR-021
title: Item Flush Alignment Replacing Bleed (D-K)
status: accepted
date: 2026-11-23
supersedes: ADR-018
area: layout
rules:
  - id: R-021-1
    text: "List items align flush with parent section boundaries (replaces legacy D-H negative bleed)"
    enforced_by: tests/e2e/wp16-g-census.spec.ts
---

# ADR-021: Item Flush Alignment Replacing Bleed (D-K)

## Decision
Migrates the D-K decision family (superseding ADR-018): list items align flush with section content edges without negative horizontal surface bleed.
