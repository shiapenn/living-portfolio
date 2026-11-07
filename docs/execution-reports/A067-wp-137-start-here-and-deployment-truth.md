# A067 — WP-13.7 Start-here and deployment truth

| Field | Value |
| --- | --- |
| Report ID | A067 |
| Date | 2026-11-07 |
| Author | A (Implementer) |
| Task ID | `WP-13.7` |
| Evidence SHA | `6970808` |
| CI run | local output |

---

## 1. Scope

- 1. **Start-Here Onboarding Runbook (`docs/START-HERE.md`, UX-32):** Authored `docs/START-HERE.md` (< 15 min, prerequisites checklist, 6 ordered steps, what you need to hand, troubleshooting, and port 4000 truth). Registered as document `L016` in `docs/doc-registry.json`. [implemented]
- 2. **Deployment Truth & Port Alignment (UX-32):** Corrected documentation and container stacks to reflect port 4000 reality (updated `docs/self-hosting.md` L48/L52 from 3000 to 4000, `docker/Dockerfile.api`, and `docker/docker-compose.hobbyist.yml`). Documented `ENABLE_BUNDLED_WEB` in `@living-portfolio/config` schema, `docs/self-hosting.md`, and regenerated `.env.example`. [implemented]
- 3. **Standalone Admin Guard (UX-05):** Added `adminGuard` middleware in `apps/web/src/app.ts` redirecting unauthenticated requests on `/admin*` routes (`/admin`, `/admin/settings`, `/admin/import`) to `/admin/login` (or `/admin/setup` if setup is required). Provided in-memory session validation in `apps/api/src/adapter/bundled-web.ts` and enhanced `createTestClient` in `apps/web/src/test-client.ts`. [implemented]
- 4. **Register Closures (20261106-UX-32, 20261106-UX-05):** Marked `20261106-UX-32` and `20261106-UX-05` as `fixed` in `docs/audits/register.yml`. [implemented]

---

## 2. CI Evidence

### 2.1 Local Verification Suite (local output)

- `pnpm --filter @living-portfolio/web test`: 52 tests passed (verifies standalone admin guard, redirect to login, setup requirement redirect, and authenticated 200).
- `pnpm --filter @living-portfolio/api test`: 342 tests passed across 40 test files (verifies START-HERE runbook contents, self-hosting port 4000 truth, compose stack configuration, and config schema).
- `npx playwright test tests/e2e/auth.spec.ts`: 10 tests passed (test 10 exercises unauthenticated redirect on `/admin`, `/admin/settings`, and `/admin/import`).
- `node scripts/audit-check`: All 160 entries parsed, fixed findings verified, and autonomous triage gate passed.
- `node scripts/docs-check`: All 103 registered documents validated with zero sequence or H1 drift.

---

## 3. Tests Added and Count Change

- Conformance tests added: 3 tests in `apps/api/src/conformance/wp13-auth.conformance.test.ts` (`WP-13.7: START-HERE.md runbook exists`, `WP-13.7: self-hosting documentation and compose stack reflect port 4000 truth`, and `WP-13.7: @living-portfolio/config schema defines ENABLE_BUNDLED_WEB`).
- Web unit tests added: 4 tests in `apps/web/src/web.test.ts` (`WP-13.7: Standalone Admin Guard & Deployment Truth (UX-05, UX-32)`).
- E2E tests: Added test 10 in `tests/e2e/auth.spec.ts` exercising standalone admin unauthenticated redirect guard.
- Total `apps/web` test count increased from 48 to 52 tests (4 new tests). No tests dropped, removed, or pruned.
- Total `apps/api` test count increased from 339 to 342 tests across 40 test files (3 new tests). No tests dropped, removed, or pruned.

---

## 4. Files Touched

Matches `git diff --name-only ee11061..6970808` (17 files):
- `.env.example`
- `apps/api/src/adapter/bundled-web.ts`
- `apps/api/src/conformance/wp13-auth.conformance.test.ts`
- `apps/web/src/app.ts`
- `apps/web/src/test-client.ts`
- `apps/web/src/web.test.ts`
- `docker/Dockerfile.api`
- `docker/docker-compose.hobbyist.yml`
- `docs/INDEX.md`
- `docs/START-HERE.md`
- `docs/audits/register.yml`
- `docs/doc-registry.json`
- `docs/execution-reports/A066-wp-136-login-and-sign-out.md`
- `docs/self-hosting.md`
- `packages/client/src/client.ts`
- `packages/config/src/index.ts`
- `tests/e2e/auth.spec.ts`

---

## 5. Register and Backlog Changes

- `20261106-UX-32`: Transitioned from `open` to `fixed`.
  - Regression test: `apps/api/src/conformance/wp13-auth.conformance.test.ts`.
- `20261106-UX-05`: Transitioned from `open` to `fixed`.
  - Regression test: `apps/web/src/web.test.ts`.

---

## 6. Not Done (Tagged)

None. All deliverables for WP-13.7 are complete.

---

## 7. Changes to Earlier Reports

None. Reports A001 through A066 remain immutable.

---

## 8. Receipt Gate Self-Validation

```
=== Validating Receipt A067-wp-137-start-here-and-deployment-truth.md ===

✓ [HEADER-CHECK] Mandatory headers verified (6/6 present).
✓ [ANCESTOR-CHECK] Evidence SHA '6970808' is an ancestor of HEAD.
✓ [FILES-TOUCHED] Matches git diff ee11061..6970808 (17 files verified).
✓ [SECTIONS-CHECK] Mandatory sections 1 through 9 verified for A067-wp-137-start-here-and-deployment-truth.md.
Found 0 section(s) marked verbatim.

🎉 All receipt checks PASSED for A067-wp-137-start-here-and-deployment-truth.md.
```

---

## 9. Handover Decision

- Decision: RECOMMENDED
- Rule(s): HO-R3
- Receipts since last handover: 9 (A059, A060, A061, A062, A063, A064, A065, A066, A067); work packages since: 0
- Clean-boundary preconditions: met
- Next action: Gate G13 closure; work package WP-13 complete; present closing receipt and fresh-clone check to user (L) for sign-off.
