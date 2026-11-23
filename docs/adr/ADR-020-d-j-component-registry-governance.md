---
id: ADR-020
title: Component Registry and Governance (D-J)
status: accepted
date: 2026-11-23
supersedes: null
area: governance
rules:
  - id: R-020-1
    text: "Component registry docs/design/components.json stays synchronized with co-located component sources"
    enforced_by: scripts/generate-registry
  - id: R-020-2
    text: "Design decisions index and effective rules stay synchronized with docs/adr/ front matter"
    enforced_by: scripts/generate-decisions
  - id: R-020-3
    text: "Every accepted ADR rule links to a valid enforcement guard/test or explicit manual review"
    enforced_by: scripts/generate-rules
---

# ADR-020: Component Registry and Governance (D-J)

## Decision
Migrates the D-J decision family: every component class family is registered in docs/design/components.json, generated from co-located gallery sources, and guarded in CI.
