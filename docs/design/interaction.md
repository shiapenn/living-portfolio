# Admin Interaction Conventions (D5)

> Authoritative interaction contract for `@living-portfolio/ui-admin`. Resolved hex, pixel, and duration values live in the generated token tables (`docs/design/tokens.md`). Enforced across both light and dark themes by `K25` (`tests/e2e/wp17-14-closed-world-audit.spec.ts`) on `#gallery-state-matrix` and live manifest routes.

## 1. Tonal Ladder (`default -> hover -> active`)

Every interactive surface moves **one step toward the foreground** at each interaction step, in both themes:

- **Light theme** (dark foreground `--lp-color-text-1`):
  - **Primary fill (`Button` primary):** darkens per step — `--lp-color-accent-default` -> `--lp-color-accent-hover` -> `--lp-color-accent-active`. Never uses `opacity` to simulate hover/active (opacity on white lightens the fill).
  - **Neutral surfaces (`Button` secondary/text, `Choice`, `Item`):** darken per step — default (`--surface-l0` / `--surface-l1`) -> hover (`--surface-control-hover`) -> active (`--surface-control-active`).
- **Dark theme** (light foreground `--lp-color-text-1`):
  - **Primary fill (`Button` primary):** lightens per step — `--lp-color-accent-default` -> `--lp-color-accent-hover` -> `--lp-color-accent-active`.
  - **Neutral surfaces (`Button` secondary/text, `Choice`, `Item`):** lighten per step — default (`--surface-l0` / `--surface-l1`) -> hover (`--surface-control-hover`) -> active (`--surface-control-active`).

## 2. Focus Ring Geometry (One Token Set)

Every focusable element (`Button`, `Link`, `Choice`, `Field`, `Tab`, `Item`) uses **one** focus ring contract:
- `outline: var(--lp-border-focus) solid var(--focus-ring);` (accent, `>= 3:1` contrast)
- `outline-offset: var(--lp-border-focus);`
- **Zero** `box-shadow` focus rings (no double rings).
- **Radius inherits** the element's `border-radius` (`.lp-tab`, `.lp-item-link`, `.lp-back-link`, `.lp-item` declare non-zero radius via `--lp-radius-r1` / `--lp-radius-control` so focus rings are never zero-radius squares).
- **Focus ring (`V2` Tab override):** Tabs use an inset focus ring (`outline-offset: calc(-1 * var(--lp-border-focus))`, `border-radius: var(--lp-radius-control)`) so the ring stays inside the tab bounds and is never clipped by the horizontal scroll container.
- **Secondary button (`V4`):** Uses tonal neutral fill (`--lp-color-fill-neutral-tint-1`) with no outline, stepping to `--lp-color-fill-neutral-tint-2` (hover) and `--lp-color-fill-neutral-tint-3` (active). Page-level `ActionBar` buttons stack vertically at full container width at every viewport (`H4`, reversing the regular-width auto-width portion of `V4`); inline/section/dialog actions remain auto width.
- **Never clipped:** scroll containers such as `.lp-tabs[role="tablist"]` keep focus rings unclipped on all four sides.

## 3. Disabled & Busy States

- **Disabled:** distinct **fill** (`--lp-color-surface-disabled`) AND distinct **text** (`--text-3`) from default, muted border (`--border-subtle`), `cursor: not-allowed`, and **zero** hover/active colour change. Applies uniformly to `Button`, `Field`, and `Choice`.
- **Busy (`aria-busy="true"`):** `opacity: 1`, `cursor: progress`, retains legible foreground/fill while preventing duplicate submission.
