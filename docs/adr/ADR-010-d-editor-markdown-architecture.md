---
id: ADR-010
title: Admin Editor and Markdown Roundtrip (D-EDITOR)
status: accepted
date: 2026-11-23
supersedes: null
area: editor
rules:
  - id: R-010-1
    text: "Admin editor preserves lossless markdown roundtrip and loads route-split editor CSS only on editor routes"
    enforced_by: apps/web/src/editor/roundtrip.test.ts
---

# ADR-010: Admin Editor and Markdown Roundtrip (D-EDITOR)

## Decision
Migrates the D-EDITOR decision family: isolated route-group CSS bundle for editor surfaces, lossless markdown roundtrip, and autosave safety.
