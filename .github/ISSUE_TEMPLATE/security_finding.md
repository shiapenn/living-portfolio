---
name: Audit Finding Remediation Task
about: Track remediation of a registered finding in docs/audits/register.yml
title: "[AUDIT] "
labels: ["audit", "security-review"]
---

> **Note:** Do NOT report undisclosed vulnerabilities in public issues. See [`SECURITY.md`](../../SECURITY.md) for private vulnerability reporting.

## Finding Details

- **Finding ID (`docs/audits/register.yml`):** 
- **Severity (`P0` | `P1` | `P2` | `P3`):** 
- **Target Remediation Gate:** `Gate 1a | Gate 1b | Gate 1c | Phase 2 | Phase 3`
- **Regression Test Path (`AUD-14`):** 

## Acceptance Criteria

- [ ] Implementation complete without `SIMULATED(...)` fallbacks
- [ ] Regression test added and passing in CI
- [ ] `docs/audits/register.yml` updated (`verified_by: null` preserved for auditor re-verification)
- [ ] Commits signed off per [DCO](../../DCO) (`git commit -s`)
