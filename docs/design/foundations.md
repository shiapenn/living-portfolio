# Design Foundations Specification (L017)

| Field | Value |
| --- | --- |
| Document ID | L017 |
| Class | L (Reference & Living Specification) |
| Status | active (numeric tables migrated to generated token docs in WP-16.N) |
| Work Package | WP-15.3a (Design Foundations), consolidated in WP-16.N |

This specification defines the authoritative visual, structural, and interactive design foundations (`D-FOUND-1` through `D-FOUND-6`) for the Living Portfolio admin workspace. Numeric token values live exclusively in the generated token tables so prose never drifts from source.

## Source-of-Truth Tables

| Topic | Authoritative Source |
| --- | --- |
| Token scales, breakpoints, spacing relations, typography roles, elevation, radii, borders | [tokens.md](tokens.md), [tokens-core.md](tokens-core.md), [tokens-admin.md](tokens-admin.md), [tokens-public.md](tokens-public.md) |
| Accent seed contract | [accent-contract.md](accent-contract.md) |
| Registered components and variants | [components.json](components.json) |
| Architecture and design decisions | [decisions.md](decisions.md) |

## Non-Numeric Principles

1. **Icons (`D-FOUND-1`)**: Self-hosted Lucide SVG sprite (`#lp-icon-sprite`, ISC licence). No text glyphs (`×`, `▾`, `◐`) as icons. Theme toggle displays the icon of the mode being switched to (`moon` with `Switch to dark theme` in light mode, `sun` with `Switch to light theme` in dark mode). Filled icon buttons are prohibited.
2. **Borders & Surfaces (`D-FOUND-2`)**: No bordered box inside a bordered box. Badges are non-interactive borderless pills; chips are interactive bordered buttons. Flat elevation for in-flow content; raised elevation only for floating overlays.
3. **Layout & Feedback (`D-FOUND-3`)**: Single admin workspace grid with reserved page-notice and status-line slots to prevent layout shift.
4. **Typography & Colour (`D-FOUND-4`)**: Six semantic colour roles (`action`, `neutral`, `success`, `warning`, `danger`, `info`) with WCAG AA contrast enforced in automated tests.
5. **Interactive States & Accessibility (`D-FOUND-5` / `D-FOUND-6`)**: Visible `:focus-visible` ring on every interactive control, full keyboard navigation, `prefers-reduced-motion` support in `@living-portfolio/ui-core`, and `forced-colors` support.
