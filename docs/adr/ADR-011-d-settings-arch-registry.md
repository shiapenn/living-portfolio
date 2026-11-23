---
id: ADR-011
title: Schema-Driven Settings Registry (D-SETTINGS-ARCH)
status: accepted
date: 2026-11-23
supersedes: null
area: settings
rules:
  - id: R-011-1
    text: "Admin settings groups and fields are declared in the central typed settings registry"
    enforced_by: apps/web/src/settings/registry.test.ts
---

# ADR-011: Schema-Driven Settings Registry (D-SETTINGS-ARCH)

## Decision
Migrates the D-SETTINGS-ARCH decision family: settings screens render from a typed declarative registry with consistent section and field primitives.
