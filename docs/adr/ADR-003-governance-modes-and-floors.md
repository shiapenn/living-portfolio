---
id: ADR-003
title: Dual Governance Modes and Universal Floors (D-M3 / D-J)
status: accepted
date: 2026-11-23
supersedes: null
area: governance
rules:
  - id: R-003-1
    text: "Admin and public enforce universal accessibility, containment, and isolation floors in Playwright census"
    enforced_by: tests/e2e/wp16-m-public-census.spec.ts
---

# ADR-003: Dual Governance Modes and Universal Floors (`D-M3` / `D-J`)

## Decision
Admin operates in strict system mode (`D-J`: no new component without L approval). Public operates in expressive mode (new `pub-*` components/tokens allowed with a PR brief; reviewed at sheet time). Both languages enforce core WCAG AA floors (contrast, visible focus, keyboard operability, reduced-motion, zero font/image CLS). Census checks are tagged `core`, `admin-only`, or `public-only`.
