# Governance & Release Gate Changelog (`docs/governance/CHANGELOG.md`)

All governance milestones, audit baselines, and stage-gate transitions (`G0`–`G5`) are recorded here per [`docs/plans/osr-001-open-source-release.md`](../plans/osr-001-open-source-release.md) (§2.3 step 10).

## [2026-10-19] — Gate G0 (Private Hygiene) & Phase 1a (Security Baseline)

- **Audit Baseline:** Committed [`AUD-2026-10-19`](../audits/2026-10-19-independent-technical-audit/report.md), [`docs/audits/register.yml`](../audits/register.yml), and [`docs/audits/conformance.yml`](../audits/conformance.yml) under [`DR-AUD-001`](DR-AUD-001.md).
- **Phase 1a Remediation (Fixes 1, 2, 5, 6):** Implemented admin authentication, CSRF protection, login throttling, hashed revocable Bearer tokens (`S1`), structural visibility filtering and signed `redactionPreviewToken` (`S2`), Ask widget DOM XSS escaping (`S3`), daily-salted SHA-256 IP rate limiting (`S4`), origin-allowlisted CORS + CSP/security headers (`S5`), and evidence URL protocol validation (`S6`).
- **OSR-01..OSR-11 (G0 & G1 Readiness):**
  - Added `@living-portfolio/config` (`OSR-02`), generated `.env.example` (`OSR-03`), moved synthetic demo seeding to `examples/seed-demo.ts` behind `SEED_DEMO=true` (`OSR-04`), and added `scripts/hardcode-check` (`OSR-01`).
  - Added `LICENSE` (Apache-2.0), `THIRD_PARTY_NOTICES`, `DCO`, `TRADEMARKS.md`, `KNOWN_ISSUES.md`, `CODEOWNERS`, `CONTRIBUTING.md`, issue/PR/release templates (`OSR-06`, `OSR-08`, `OSR-11`), segregated `brand/` (`OSR-09`), and added rulesets-as-code in `docs/governance/rulesets/` (`OSR-10`).
