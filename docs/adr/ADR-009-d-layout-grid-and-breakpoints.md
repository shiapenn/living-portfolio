---
id: ADR-009
title: Layout Grid and Responsive Breakpoints (D-LAYOUT)
status: accepted
date: 2026-11-23
supersedes: null
area: layout
rules:
  - id: R-009-1
    text: "Zero horizontal overflow across 320px, 1280px, and 1920px viewports in both admin and public"
    enforced_by: tests/e2e/wp16-r-style-census.spec.ts
---

# ADR-009: Layout Grid and Responsive Breakpoints (D-LAYOUT)

## Decision
Migrates the D-LAYOUT decision family: single breakpoint source of truth in core tokens, zero horizontal overflow across viewports, and 80px-lattice layout widths.
