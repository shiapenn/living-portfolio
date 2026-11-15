# A112 — WP-16.6 Inbox and audit rules pages

| Field | Value |
| --- | --- |
| Report ID | A112 |
| Date | 2026-11-15 |
| Author | A (Implementer) |
| Task ID | `WP-16.6` (PR #149) |
| Evidence SHA | `1950654` |
| CI run | `43694097102` (CI & Audit Conformance Gate), `43694097060` (Secret Scan), `43694097073` (Staging Deploy) on `main` |

---

## 1. Scope

1. `[implemented]` **Inbox & Audit Strings (`apps/web/src/strings/admin/inbox.ts`)**: Added all Inbox and Answer Rules labels, filter tabs, due-date indicators, reply/decline copy, and inline rule extraction copy.
2. `[implemented]` **Dedicated Inbox Pages (`apps/web/src/pages/admin/inbox.ts`)**: Rendered `/admin/inbox` and `/admin/inbox/:id` inside the admin shell with `All`/`Pending`/`Answered`/`Declined` filtering, due/overdue indicators, reply and decline actions, and inline `"Make this a rule?"` rule drafting.
3. `[implemented]` **Dedicated Answer Rules Page (`apps/web/src/pages/admin/audit.ts`, `apps/api/src/routes/audit.ts`)**: Rendered `/admin/audit` displaying Pending / Active / Discarded answer rules with source quote, scope, confirm/revoke actions, and added `POST /api/audit/scoped-constraints`.
4. `[implemented]` **Routes & E2E Coverage (`apps/web/src/renderer.ts`, `apps/web/src/app.ts`, `apps/api/src/adapter/bundled-web.ts`, `tests/e2e/wp16-6-inbox-and-audit-rules.spec.ts`)**: Exported renderers, mounted `/admin/inbox`, `/admin/inbox/:id`, and `/admin/audit`, and added 2 Playwright E2E tests.

---

## 2. CI Evidence

- `main` push CI & Audit Conformance Gate (`43694097102`): `success` (`Typecheck, Unit, Security Regression, DCO & Audit Gate` 2m0s; `Playwright End-to-End Suite` 2m20s).
- `main` push Secret Scan (`43694097060`): `success`.
- `main` push Staging Automated Continuous Deployment (`43694097073`): `success`.
- Local pre-push `pnpm verify` (all 15 gates) and `pnpm test:e2e` (`wp16-6-inbox-and-audit-rules.spec.ts` 2/2 + prior 108/108 = 110/110): `local output` passed.

---

## 3. Tests Added and Count Change

- Added `tests/e2e/wp16-6-inbox-and-audit-rules.spec.ts` (2 Playwright E2E tests covering `/admin/inbox`, `/admin/inbox/:id`, inline `"Make this a rule?"`, and `/admin/audit` Pending/Active/Discarded rule confirmation & revocation).
- Existing tests changed or removed: **None** (0 changed, 0 removed).

---

## 4. Files Touched

- `apps/api/src/adapter/bundled-web.ts`
- `apps/api/src/routes/audit.ts`
- `apps/web/src/app.ts`
- `apps/web/src/pages/admin/audit.ts`
- `apps/web/src/pages/admin/inbox.ts`
- `apps/web/src/renderer.ts`
- `apps/web/src/strings/admin/inbox.ts`
- `docs/INDEX.md`
- `docs/doc-registry.json`
- `docs/execution-reports/A111-wp-165-inspector-module.md`
- `tests/e2e/wp16-6-inbox-and-audit-rules.spec.ts`

---

## 5. Register and Backlog Changes

- None.

---

## 6. Not Done (Tagged)

- `[not-started]` `WP-16.7` (next task: `WP-16.7` retire monolith and swap `/admin` to Today).

---

## 7. Changes to Earlier Reports

- None.

---

## 8. Receipt Gate Self-Validation
```
$ pnpm receipt:check A112
=== Validating Receipt A112-wp-166-inbox-and-audit-rules.md ===

✓ [HEADER-CHECK] Mandatory headers verified (6/6 present).
✓ [ANCESTOR-CHECK] Evidence SHA '1950654' is an ancestor of HEAD.
✓ [FILES-TOUCHED] Matches git diff a0d8e67..1950654 (11 files verified).
✓ [SECTIONS-CHECK] Mandatory sections 1 through 9 verified for A112-wp-166-inbox-and-audit-rules.md.
Found 0 section(s) marked verbatim.

🎉 All receipt checks PASSED for A112-wp-166-inbox-and-audit-rules.md.
```

---

## 9. Handover Decision
- Decision: RECOMMENDED
- Rule(s): HO-R3
- Receipts since last handover: 7 (A106, A107, A108, A109, A110, A111, A112); work packages since: 0
- Clean-boundary preconditions: met
- Next action: continue with task `WP-16.7` (write `H017` after `WP-16.7` and Gate `G16` closure)
