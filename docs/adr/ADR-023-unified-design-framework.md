---
id: ADR-023
title: Unified Design Framework, Differentiated Languages
status: accepted
date: 2026-11-25
supersedes: null
area: architecture
rules:
  - id: R-023-1
    text: "Global design framework defines a shared token contract (type, space/rhythm relations, colour, radius, elevation, motion, density) implemented by both admin and public packs"
    enforced_by: packages/design-tokens/src/rules.test.ts
  - id: R-023-2
    text: "Shared UI components (button, icon, theme toggle, link, tag, field, choice, notice) live in ui-core using contract tokens only; changes to shared components must pass both admin and public regression suites"
    enforced_by: scripts/verify-design-boundaries
  - id: R-023-3
    text: "Admin operates in system mode (no new component without L prior approval; variants only); public operates in expressive mode (PR brief recorded and reviewed after the fact)"
    enforced_by: scripts/verify-ui-guards
---

# ADR-023: Unified Design Framework, Differentiated Languages

## Context
WP-16.M and WP-16.N separated the UI into `@living-portfolio/ui-core`, `@living-portfolio/ui-admin`, and `@living-portfolio/ui-public` (ADR-001). Owner review of WP-16.N public contact sheets showed that treating the public language as a separate ad-hoc CSS layer without a shared token contract and shared primitive components led to duplicated controls (outlined buttons, unstyled links, inconsistent theme toggles) and missing rhythm/relation checks on public pages.

## Decision
1. **One unified design framework:** The global framework consists of a **token contract** (roles for type, space and rhythm relations, colour, radius, elevation, motion, and density), the governance rules, shared components, and the verification tooling. It governs both languages.
2. **Shared components in `@living-portfolio/ui-core`:** Shared primitives (`button`, `icon`, `theme toggle`, `link`, `tag`, `field`, `choice`, `notice`, and similar cross-surface primitives) live in `@living-portfolio/ui-core` and reference **contract tokens only**. Admin and public differentiate through token values and declared variants — never by forking component implementations.
3. **Language-specific structure stays in each language:**
   - `@living-portfolio/ui-admin`: admin-only structure (`Item`, `ActionBar`, admin shell, settings patterns, editor chrome).
   - `@living-portfolio/ui-public`: public-only structure (`entry`, `timeline`, `Ask panel`, public frame).
4. **Independent pack scales with shared contract & checks:** The public pack (`packs/public.json`) keeps its own type scale, space scale and rhythm relations, radii, and neutral palette (plus the shared core accent seed), and implements the contract schema with its own relation and role checks in the census (`WP-19.0`).
5. **Dual governance modes:**
   - **Admin — System mode:** Strict component registry (`docs/design/components.json`). No new component without L's prior approval; extend variants only.
   - **Public — Expressive mode:** New public-only components and layout patterns allowed with a brief recorded in the PR and reviewed after the fact on contact sheets.
   - **Shared components (`ui-core`):** Any change to a shared component must pass both the admin and public regression and census suites.

## Consequences
- `ADR-001` is amended to clarify that `ui-core` owns the shared component layer against the token contract, not only accessibility/layout/icon utilities.
- `WP-19.0` ("Design framework review and unification") is scheduled before the WP-19 Public Frame to audit both packs against the contract, extract shared components into `ui-core`, systematise public scales and rhythm relation checks, and resolve visible public defects.
