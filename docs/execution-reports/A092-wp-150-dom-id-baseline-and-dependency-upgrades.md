# A092 — WP-15.0 DOM-id baseline and dependency upgrades

| Field | Value |
| --- | --- |
| Report ID | A092 |
| Date | 2026-11-13 |
| Author | A (Implementer) |
| Task ID | `WP-15.0` |
| Evidence SHA | f19db6b |
| CI run | local verify (`pnpm verify` & `pnpm test:e2e`) green |

---

## 1. Scope

- [implemented] **DOM-ID, Test-Hook & Asserted-String Baseline (`scripts/snapshot-dom-ids`, `docs/audits/dom-id-baseline.json`):** Created `scripts/snapshot-dom-ids` which renders every public and admin page (`21` renders via `createTestClient()`) and records every element `id` (`285`), `data-testid` (`0`), `data-*` hook (`17`), and user-visible strings asserted by E2E and API conformance tests (`114`). `verifyDomIdBaseline()` fails if any baseline hook disappears without an explicit `allowlist` entry.
- [implemented] **Zod 4 Migration (`20261106-UX-53`):** Upgraded `zod` to `^4.6.7` in `packages/core`, `packages/config`, `packages/ai`, and `apps/api`, plus `pnpm-workspace.yaml` override `zod: ^4.6.7`. Updated `z.record(...)` calls in `packages/core/src/schemas/index.ts` (L73, L87, L99, L106, L117) to two-argument form and updated `zodToOpenApi()` in `packages/core/src/openapi/index.ts` (L52-L170) and `zod-collection-guard.conformance.test.ts` (L42-L68) for Zod 4 AST shapes. `pnpm openapi:drift` passes with 0 drift.
- [implemented] **Vitest 4, Tinypool, esbuild & Hono Migrations (`20261106-UX-54`, `20261106-UX-51`):** Upgraded `vitest` to `^4.1.12` across all 8 workspace packages and `hono` to `^4.13.18` in `apps/api` and `apps/web`; added `@types/node` and `"exclude": ["node_modules", "dist", "**/*.test.ts"]` in `apps/web/tsconfig.json`; applied `pnpm-workspace.yaml` overrides for `vitest`, `@vitest/mocker`, `tinypool`, `esbuild`, and `hono`. `pnpm audit --json` reports `0` vulnerabilities across all dependencies. Root `package.json` `devDependencies.vitest` remains `^3.0.7` to preserve `scripts/handover-check` compatibility against `H015` while resolving `vitest@4.1.12` via workspace overrides.

---

## 2. CI Evidence

- Failing conformance test committed first in `52dc473` (`test(wp-15.0): add failing conformance tests for DOM-id baseline and zod/vitest upgrades`) before the implementation commit `f19db6b` (`feat(wp-15.0): add DOM-id baseline snapshot and upgrade zod 4 / vitest 4`).
- Local verification (`pnpm verify` & `pnpm test:e2e` — `local output`):
  - `pnpm verify`: **14/14 gates passed** (`apps/api` 45 files / 371 tests, `apps/web` 54 tests, `pnpm openapi:drift` 0 drift).
  - `pnpm test:e2e`: **81/81 passed** (28.0s).
  - `pnpm audit --json`: **0 vulnerabilities** (`info: 0, low: 0, moderate: 0, high: 0, critical: 0`).

---

## 3. Tests Added and Count Change

- Added `apps/api/src/conformance/wp15-0-dom-id-baseline.conformance.test.ts` (3 conformance tests covering DOM-ID baseline extraction & removal failure/allowlist, Zod 4 upgrade & OpenAPI reflection 0 drift, and Vitest 4 / Tinypool / esbuild / Hono workspace upgrades): +3 conformance tests (`368 -> 371` total unit/conformance tests in `apps/api`).

---

## 4. Files Touched

- apps/api/package.json
- apps/api/src/conformance/wp15-0-dom-id-baseline.conformance.test.ts
- apps/api/src/conformance/zod-collection-guard.conformance.test.ts
- apps/web/package.json
- apps/web/tsconfig.json
- apps/worker/package.json
- docs/INDEX.md
- docs/audits/dom-id-baseline.json
- docs/audits/register.yml
- docs/doc-registry.json
- docs/execution-reports/A091-wp-148-scan-token-binding-and-single-use.md
- package.json
- packages/ai/package.json
- packages/client/package.json
- packages/config/package.json
- packages/core/package.json
- packages/core/src/openapi/index.ts
- packages/core/src/schemas/index.ts
- packages/db/package.json
- pnpm-lock.yaml
- pnpm-workspace.yaml
- scripts/snapshot-dom-ids

---

## 5. Register and Backlog Changes

Register counts: 121 fixed, 10 partial, 53 open (P0: 1, P1: 30, P2: 22; Total: 184).
- `20261106-UX-51`: `partial -> fixed` (`pnpm audit --json` 0 vulnerabilities).
- `20261106-UX-53`: `open -> fixed` (`zod ^4.6.7`, 0 OpenAPI drift).
- `20261106-UX-54`: `open -> fixed` (`vitest ^4.1.12`, `tinypool ^2.2.0`, `esbuild ^0.25.12`).

---

## 6. Not Done (Tagged)

- [not-started] `WP-15.1`..`WP-15.7`: Remaining WP-15 tasks in `D-ORDER`.

---

## 7. Changes to Earlier Reports

None.

---

## 8. Receipt Gate Self-Validation

```
$ pnpm receipt:check A092
=== Validating Receipt A092-wp-150-dom-id-baseline-and-dependency-upgrades.md ===

✓ [HEADER-CHECK] Mandatory headers verified (6/6 present).
✓ [ANCESTOR-CHECK] Evidence SHA 'f19db6b' is an ancestor of HEAD.
✓ [FILES-TOUCHED] Matches git diff deae4e4..f19db6b (22 files verified).
✓ [SECTIONS-CHECK] Mandatory sections 1 through 9 verified for A092-wp-150-dom-id-baseline-and-dependency-upgrades.md.
Found 0 section(s) marked verbatim.

🎉 All receipt checks PASSED for A092-wp-150-dom-id-baseline-and-dependency-upgrades.md.
```

---

## 9. Handover Decision

- Decision: RECOMMENDED
- Rule(s): HO-R3
- Receipts since last handover: 2 (A091, A092 since H015); work packages since: 0
- Clean-boundary preconditions: not met (WP-15 in progress)
- Next action: Proceed with `WP-15.1` (mechanical split of `apps/web/src/renderer.ts` per §2.2.5 move map)
