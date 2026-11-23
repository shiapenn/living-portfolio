---
id: ADR-012
title: Frontend-Backend Storage Decoupling (D-STORAGE)
status: accepted
date: 2026-11-23
supersedes: null
area: architecture
rules:
  - id: R-012-1
    text: "apps/web has zero database dependencies or imports; apps/api has zero static imports of apps/web"
    enforced_by: scripts/verify-dependency-rules
---

# ADR-012: Frontend-Backend Storage Decoupling (D-STORAGE)

## Decision
Migrates the D-STORAGE decision family: apps/web never imports database drivers or repositories directly and communicates exclusively through @living-portfolio/client.
