# Hard-Code Inventory & Remediation Report (`OSR-01`)

| Field | Value |
| --- | --- |
| Task ID | `OSR-01` |
| Plan Reference | [`docs/plans/osr-001-open-source-release.md`](../plans/osr-001-open-source-release.md) (§3.2, §7) |
| Scanner Script | [`scripts/hardcode-check`](../../scripts/hardcode-check) |
| Status | Claimed Fixed (0 unlisted hits in CI) |

## 1. Remediated Hard-Coded Literals

| Category | Previous Location | Previous Value | Remediation |
| --- | --- | --- | --- |
| Demo owner identity | `apps/web/src/renderer.ts` (`renderLayout`, `renderStaticPage('about')`) | `"Alex Rivera"` | Replaced with `cfg.PUBLIC_OWNER_NAME` from `@living-portfolio/config` (`OSR-04`, `OSR-09`). |
| Brand site title | `apps/web/src/renderer.ts` (`renderLayout`), `apps/api/src/app.ts` (`/rss.xml`, `/`) | `"The Living Portfolio"` | Replaced with `cfg.PUBLIC_SITE_NAME` from `@living-portfolio/config` (`OSR-09`). |
| Owner statement & bio | `apps/web/src/renderer.ts` (`renderHomePage`, `renderStaticPage('about')`) | Hard-coded strings | Replaced with `cfg.PUBLIC_OWNER_STATEMENT` and `cfg.PUBLIC_OWNER_BIO` (`OSR-09`). |
| Hard-coded origins & URLs | `apps/api/src/app.ts` (`cors`, `/rss.xml`, `/sitemap.xml`) | `"http://localhost:4000"`, `"https://portfolio.example.com"` | Replaced with `cfg.SITE_ORIGIN` and `cfg.ADMIN_ORIGIN` from `@living-portfolio/config` (`OSR-01`, `OSR-02`). |
| Unconditional demo seeding | `apps/api/src/server.ts` | `await seedDemoPortfolio(repo)` on boot | Moved demo runner to [`examples/seed-demo.ts`](../../examples/seed-demo.ts) and gated behind explicit `SEED_DEMO=true` (`OSR-04`). |

## 2. Explicit Scanner Allowlist

The CI scanner ([`scripts/hardcode-check`](../../scripts/hardcode-check)) enforces zero unlisted hits across `apps/`, `packages/`, `scripts/`, `examples/`, and `docs/`, with the following documented allowlist:

| Allowlisted Path | Reason |
| --- | --- |
| `docs/audits/2026-10-19-independent-technical-audit/` | Immutable closed audit report (`AUD-03`). |
| `docs/audits/register.yml` | Cumulative findings register quoting finding `P1` title verbatim. |
| `docs/audits/hardcode-inventory.md` | This inventory report documenting remediated literals. |
| `docs/plans/` | Remediation and OSR-001 plans referencing historical audit findings. |
| `docs/execution-reports/` | Historical execution reports (`A001.md`, `A002.md`, `OSR-05`). |
| `packages/config/` | Single source of truth for default configuration values. |
| `packages/ai/src/ai.test.ts` | Synthetic AWS key fixture testing `scanForConfidentialData` redaction scanner. |
