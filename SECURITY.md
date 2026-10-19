# Security Policy & Audit Disclosure (`AUD-23`)

## Supported Status

The Living Portfolio is currently in **pre-`v0.1` active remediation** following the initial independent technical audit ([`AUD-2026-10-19`](./docs/audits/2026-10-19-independent-technical-audit/report.md)).

> **Warning:** Do not expose the current prototype directly to the public internet until all `P0` security findings (`S1`–`S6`) in [`docs/audits/register.yml`](./docs/audits/register.yml) are marked `fixed` with passing regression tests.

---

## Active Security Findings (`S`-Series in `register.yml`)

All security and privacy findings are tracked in [`docs/audits/register.yml`](./docs/audits/register.yml) and governed by [`docs/governance/DR-AUD-001.md`](./docs/governance/DR-AUD-001.md):

| ID | Severity | Status | Summary | Spec Reference |
| --- | --- | --- | --- | --- |
| **`S1`** | `P0` | `open` | No authentication or authorization across API and admin routes | §3.11, §13.4, §15 |
| **`S2`** | `P0` | `open` | Private data can reach `/api/ask` after unauthenticated visibility mutation | §3.11, §10.4, §15 |
| **`S3`** | `P0` | `open` | DOM XSS in Ask widget via unescaped `innerHTML` writes | §8, §12, §15 |
| **`S4`** | `P0` | `open` | Rate-limit bypass via client-supplied `session_id` and unhashed IP headers | §13.5, §13.8, §15 |
| **`S5`** | `P0` | `open` | Open wildcard CORS (`*`), missing CSP/security headers, and no bot challenge | §13.5, §13.8, §15 |
| **`S6`** | `P0` | `open` | Evidence links allow `javascript:` protocol URLs in `href` attributes | §3.8, §12, §15 |
| **`S7`** | `P1` | `open` | Enrichment job bypasses data-class privacy routing, governor, and redaction gate | §4.3, §8, §13.5, §15 |

Regression probes for `S1`–`S6` are located in [`apps/api/src/conformance/p0-probes.conformance.test.ts`](./apps/api/src/conformance/p0-probes.conformance.test.ts).

---

## Reporting a Vulnerability

Please report security vulnerabilities privately via GitHub Security Advisories rather than opening a public issue. Every confirmed security vulnerability is assigned a permanent `S`-series finding ID in [`docs/audits/register.yml`](./docs/audits/register.yml) and gated by a mandatory regression test (`AUD-14`–`AUD-16`).
