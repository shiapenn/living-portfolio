## Summary
<!-- Describe the change, work-package ID, and motivation. -->

## Design System Statements (`D-J`, `D-M3`, `D-M6`)

### 1. Component Statement (Admin — system mode) OR Component Brief (Public — expressive mode)
- **Language touched:** `none` | `core` | `admin` | `public`
- **Admin (`D-J`):** List every new or changed `data-c` component & variant from `docs/design/components.json` (no new admin component without L approval).
- **Public (`D-M3` brief, if adding a `pub-*` component):**
  - Purpose:
  - Why no existing component or variant fits:
  - Accessibility (contrast, keyboard, focus, reduced-motion):
  - Performance cost (gzip CSS/JS bytes, fonts):
  - Tokens used (`--pub-*` / `--lp-core-*`):
  - Gallery sample ID:

### 2. Token Statement (`D-M2`)
- **New/changed tokens:** `none` (or list token name, pack, and the declared scale rule it follows).

### 3. Verification Checklist
- [ ] Co-located `*.gallery.ts` sample updated and `node scripts/generate-registry` run (if UI touched)
- [ ] Unit, conformance, and Playwright E2E tests added/updated
- [ ] `pnpm verify:fast` and `node scripts/verify-design-boundaries` pass
- [ ] DCO sign-off (`git commit -s`) on every commit
- [ ] Before/after screenshots or contact sheets attached (for visual changes)
