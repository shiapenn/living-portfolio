---
id: ADR-022
title: Consolidation, Health Budgets and Changesets (D-L / D-N)
status: accepted
date: 2026-11-23
supersedes: null
area: governance
rules:
  - id: R-022-1
    text: "Design system payload budgets and token inventory are tracked in docs/design/health.md and guarded against regression"
    enforced_by: scripts/ds-health
  - id: R-022-2
    text: "Changes to UI packages require a .changeset entry and up-to-date package CHANGELOG.md files"
    enforced_by: scripts/verify-changeset
  - id: R-022-3
    text: "All consolidation DoD criteria pass together under pnpm wp16n:verify"
    enforced_by: scripts/wp16n-verify
---

# ADR-022: Consolidation, Health Budgets and Changesets (D-L / D-N)

## Decision
Migrates the D-L and D-N consolidation governance rules: zero CSS-in-TS, shrinking-only file size caps, design system health budgets, changesets for UI packages, and unified DoD verification.
