---
id: ADR-016
title: Visual Polish, Dark Theme and Focus Visibility
status: accepted
date: 2026-11-23
supersedes: null
area: visual-discipline
rules:
  - id: R-016-1
    text: "Zero hard-coded color, spacing, or timing literals outside token sources and zero inline style= attributes"
    enforced_by: scripts/verify-ui-guards
---

# ADR-016: Visual Polish, Dark Theme and Focus Visibility

## Decision
Migrates the D-FINAL decision family: zero hard-coded colors outside token sources, light/dark semantic parity, and visible focus rings on all interactive controls.
