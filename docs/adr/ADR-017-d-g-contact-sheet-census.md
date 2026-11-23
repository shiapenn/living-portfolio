---
id: ADR-017
title: Contact Sheet Census and Style Gate (D-G)
status: accepted
date: 2026-11-23
supersedes: null
area: testing
rules:
  - id: R-017-1
    text: "All 42 admin states and 16 public states pass automated multi-viewport, dual-theme census with zero violations"
    enforced_by: tests/e2e/wp16-r-style-census.spec.ts
---

# ADR-017: Contact Sheet Census and Style Gate (D-G)

## Decision
Migrates the D-G decision family: every admin and public state is verified across viewports and themes via automated Playwright style census.
