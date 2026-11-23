# WP-16.N audit delta (baseline before consolidation)

Measured on `main` at `2b64ea5` (WP-16.M merge), local output.

## Token counts by pack

| Pack | Primitive | Semantic | Component |
| --- | --- | --- | --- |
| core | 35 | 0 | 0 |
| admin | 192 | 104 | 152 |
| public | 93 | 38 | 31 |

## CSS and styling

| Measure | Value |
| --- | --- |
| `apps/web/src/styles.ts` | 5644 lines, 158666 bytes raw, 22607 bytes gzip (inlined admin CSS string in TS) |
| core bundle | 1639 bytes raw, 748 bytes gzip |
| admin base bundle | 17605 bytes raw, 3709 bytes gzip |
| public bundle | 10418 bytes raw, 2454 bytes gzip |
| inline `style=` occurrences in web source | 235 in 17 files (pages/public 192, components 20, layouts 4, admin pages 0) |

## Architecture

| Measure | Value |
| --- | --- |
| Source files over 400 lines (tests and generated excluded) | 21, largest `styles.ts` (5644) |

## Findings registered for WP-16.N

| Item | Status after N1 |
| --- | --- |
| Direction packs and lab routes still shipped | removed |
| No accent seed contract | generator, validation, tests landed; wiring pending |
| styles.ts holds all admin CSS | pending (N2) |
| Public pages carry 192 inline styles | pending (N3) |
| Fonts show Georgia and Arial fallbacks | pending (N3) |
| ADR families D-MIN..D-L not migrated | pending (N4) |
