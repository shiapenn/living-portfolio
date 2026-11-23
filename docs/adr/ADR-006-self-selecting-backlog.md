---
id: ADR-006
title: Self-Selecting Backlog and Owner Gates (D-M7)
status: accepted
date: 2026-11-23
supersedes: null
area: governance
rules:
  - id: R-006-1
    text: "Backlog items declare dependencies and owner gates in docs/plans/backlog.yml"
    enforced_by: scripts/backlog-next
---

# ADR-006: Self-Selecting Backlog and Owner Gates (`D-M7`)

## Decision
Backlog items live in `docs/plans/backlog.yml` (schema-checked) and are selected via `pnpm backlog:next`. After finishing a package, the agent selects the next unblocked item whose dependencies are `done` and whose gate is `none` (or satisfied), stopping only at owner gates (`Gate GFE`, `owner-direction`) or when nothing is unblocked. Owner sheet feedback arrives as defects and takes priority.
