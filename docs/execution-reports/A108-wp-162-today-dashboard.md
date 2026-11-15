# A108 — WP-16.2 Today dashboard module (D-UI-1..D-UI-6)

| Field | Value |
| --- | --- |
| Report ID | A108 |
| Date | 2026-11-15 |
| Author | A (Implementer) |
| Task ID | `WP-16.2` (PR #141) |
| Evidence SHA | `2a1a23d` |
| CI run | `43687535616` (CI & Audit Conformance Gate), `43687535715` (Secret Scan), `43687535682` (Staging Deploy) on `main` |

---

## 1. Scope

1. `[implemented]` **Today Dashboard Page & Strings (`D-UI-1..D-UI-6`, `CP-13`)**: Created `apps/web/src/pages/admin/dashboard.ts` (`renderAdminDashboardPage`) and `apps/web/src/strings/admin/dashboard.ts` (`DASHBOARD_STRINGS`) built strictly from shared components (`renderAdminShell`, `renderButton`, `renderChip`, `renderPageNotice`) with zero inline styles.
2. `[implemented]` **Needs-Attention List & Standardized Explanation**: Renders build failure, questions due (`pendingInboxCount`), drafts (`draftCount`), and backup overdue items with direct action links, plus the What/When/How/Impact explanation block (`#today-explanation`).
3. `[implemented]` **Server-Persisted Checklist Dismissal**: Added `dashboardChecklistDismissed` to `RuntimeSettingsState` and `PATCH /api/settings/dashboard` in `apps/api/src/routes/settings.ts`; mounted `/admin/today` in `apps/web/src/app.ts` and `apps/api/src/adapter/bundled-web.ts`.

---

## 2. CI Evidence

- `main` push CI & Audit Conformance Gate (`43687535616`): `success` (`Typecheck, Unit, Security Regression, DCO & Audit Gate` 1m58s; `Playwright End-to-End Suite` 1m44s).
- `main` push Secret Scan (`43687535715`): `success`.
- `main` push Staging Automated Continuous Deployment (`43687535682`): `success`.
- Local pre-push `pnpm verify` (all 15 gates) and `pnpm test:e2e` (101 passed, 0 failed): `local output` passed.

---

## 3. Tests Added and Count Change

- Added `apps/web/src/pages/admin/dashboard.test.ts` (2 unit tests: fixture needs-attention items + zero inline styles; `checklistDismissed: true`).
- Added `tests/e2e/wp16-2-today-dashboard.spec.ts` (2 Playwright E2E tests: admin shell + 0 overflow at 320 px; server-persisted checklist dismissal across reload).
- Existing tests changed or removed: **None** (0 changed, 0 removed).

---

## 4. Files Touched

- `apps/api/src/adapter/bundled-web.ts`
- `apps/api/src/routes/settings.ts`
- `apps/web/src/app.ts`
- `apps/web/src/layouts/admin-shell.ts`
- `apps/web/src/pages/admin/dashboard.test.ts`
- `apps/web/src/pages/admin/dashboard.ts`
- `apps/web/src/renderer.ts`
- `apps/web/src/strings/admin/dashboard.ts`
- `apps/web/src/styles.ts`
- `docs/INDEX.md`
- `docs/doc-registry.json`
- `docs/execution-reports/A107-wp-161-admin-shell-and-route-registry.md`
- `tests/e2e/wp16-2-today-dashboard.spec.ts`

---

## 5. Register and Backlog Changes

- None (`20261106-UX-17` and `20261106-CP-13` remain `open`/`partial` pending remaining WP-16/WP-17 pages).

---

## 6. Not Done (Tagged)

- `[not-started]` `WP-16.3`..`WP-16.7` (next task: `WP-16.3`).

---

## 7. Changes to Earlier Reports

- None.

---

## 8. Receipt Gate Self-Validation
```
$ pnpm receipt:check A108
=== Validating Receipt A108-wp-162-today-dashboard.md ===

✓ [HEADER-CHECK] Mandatory headers verified (6/6 present).
✓ [ANCESTOR-CHECK] Evidence SHA '2a1a23d' is an ancestor of HEAD.
✓ [FILES-TOUCHED] Matches git diff 0ae9c76..2a1a23d (13 files verified).
✓ [SECTIONS-CHECK] Mandatory sections 1 through 9 verified for A108-wp-162-today-dashboard.md.
Found 0 section(s) marked verbatim.

🎉 All receipt checks PASSED for A108-wp-162-today-dashboard.md.
```

---

## 9. Handover Decision
- Decision: RECOMMENDED
- Rule(s): HO-R3
- Receipts since last handover: 3 (A106, A107, A108); work packages since: 0
- Clean-boundary preconditions: met
- Next action: continue with task `WP-16.3`
