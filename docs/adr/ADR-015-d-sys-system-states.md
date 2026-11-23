---
id: ADR-015
title: System States, Empty States and Feedback (D-SYS)
status: accepted
date: 2026-11-23
supersedes: null
area: components
rules:
  - id: R-015-1
    text: "Public and admin routes render complete empty, error, and 404 system states with actionable CTAs"
    enforced_by: apps/api/src/conformance/wp11-nav-states.conformance.test.ts
---

# ADR-015: System States, Empty States and Feedback (D-SYS)

## Decision
Migrates the D-SYS decision family: every route handles empty, error, loading, and 404 states with clear actions and tokenized feedback banners.
