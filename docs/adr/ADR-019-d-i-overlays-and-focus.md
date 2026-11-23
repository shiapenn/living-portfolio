---
id: ADR-019
title: Overlay Surfaces and Focus Management (D-I)
status: accepted
date: 2026-11-23
supersedes: null
area: components
rules:
  - id: R-019-1
    text: "Named z-index tokens enforce modal and toast stacking order without magic numbers"
    enforced_by: packages/design-tokens/src/drift.test.ts
---

# ADR-019: Overlay Surfaces and Focus Management (D-I)

## Decision
Migrates the D-I decision family: dialogs, drawers, popovers, and menus use named z-index tiers, Escape dismissal, and viewport-safe positioning.
