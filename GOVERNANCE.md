# Project Governance (`GOVERNANCE.md`)

This document outlines the governance model, decision-making structure, and maintainer responsibilities for **The Living Portfolio** open-source project.

---

## 1. Project Philosophy & Scope

The Living Portfolio is an open-source, single-owner personal publishing and knowledge graph system designed to preserve intellectual continuity, truthfulness in professional records, and static-first resilience.

Core tenets of the project include:
- **Honesty is the invariant:** Bitemporal modeling, explicit distinction between hindsight edits and contemporaneous notes, and strict provenance for all AI-generated content.
- **Entry-first architecture:** Simple text publishes on day one without mandatory schema baggage; structured context enriches capabilities progressively.
- **Single-owner sovereignty:** Every deployment serves one owner and one database; multi-tenancy is explicitly out of scope.
- **Open-source transparency:** Permissive licensing (Apache-2.0), public specification conformance, and audit-driven governance.

---

## 2. Roles and Responsibilities

### 2.1 Contributors
Anyone who submits issues, pull requests, documentation improvements, or community feedback. Contributors are expected to follow the [Code of Conduct](CODE_OF_CONDUCT.md) and certify their contributions via the [Developer Certificate of Origin (DCO)](DCO).

### 2.2 Maintainers
Maintainers are trusted contributors responsible for the day-to-day stewardship of the codebase. Responsibilities include:
- Reviewing and merging Pull Requests according to the [Maintainer Checklist](CONTRIBUTING.md#3-maintainer-merge-checklist-osr-08).
- Triaging issues and audit findings in `docs/audits/register.yml`.
- Maintaining CI/CD pipeline reliability, test coverage, and documentation currency.
- Upholding code quality, accessibility, and security standards.

### 2.3 Project Lead / Architectural Owner
The Project Lead oversees the strategic roadmap, architecture, and gate releases. Responsibilities include:
- Certifying release gates (G0 through G5).
- Approving Architecture Decision Records (ADRs).
- Final authority on scope disputes or breaking specification changes.

### 2.4 Independent Auditors
Third-party or external reviewers conducting periodic technical, security, and UX audits under [DR-AUD-001](docs/governance/DR-AUD-001.md). Independent auditors have the authority to log findings directly into the audit register and verify fixes.

---

## 3. Decision-Making & Consensus Model

The project operates under a **consensus-seeking model**:

1. **Lazy Consensus for Routine Changes:** Small bug fixes, minor documentation updates, and routine maintenance changes proceed via pull request review. If a maintainer approves and no objections are raised within 48 hours, the PR may be merged.
2. **Consensus for Substantial Changes:** Enhancements touching core schemas, data models, or public API routes require discussion on an issue or PR, with explicit approval from at least two maintainers (or the Project Lead).
3. **Architecture Decision Records (ADRs) for Foundational Changes:** Structural changes—such as API boundary decoupling, database adapters, new runtime dependencies, or deployment architectures—must be documented in an ADR submitted under `docs/plans/` or `docs/governance/` (see [Architecture Decision Records Archive](docs/G004-architecture-decision-records-archive.md)).
4. **Escalation:** In the rare event of deadlock, the Project Lead makes the final determination.

---

## 4. Release Process & Quality Gates

All releases are governed by the **Release Gate Protocol** defined in [`docs/plans/osr-001-open-source-release.md`](docs/plans/osr-001-open-source-release.md):

- **Gate G0:** Repository sanitization, DCO sign-off, secrets elimination, baseline conformance.
- **Gate G1:** Branding segregation, alpha warnings, flip-day checklist.
- **Gate G2:** Decoupled web client, OpenAPI contracts, container quickstart, SBOM generation.
- **Gate G3:** Staging automated CD, deployment class isolation, backup restore verification.
- **Gate G4:** Production release automation, signed container images, rollback drill.
- **Gate G5:** General Availability release certification, final documentation suite, v0.1.0 GA tag.

Every release tag requires all automated gates and conformance checks (`pnpm verify`) to pass cleanly on the continuous integration harness.

---

## 5. Security & Vulnerability Reporting

Security disclosures are handled in private confidence to protect deployers. For details on reporting security vulnerabilities, refer to [SECURITY.md](SECURITY.md).

---

## 6. Code of Conduct

The project has adopted the Contributor Covenant, version 2.1. All contributors, maintainers, and participants are required to adhere to the standards outlined in [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).

---

## 7. Modifications to Governance

Modifications to this governance policy require an explicit Pull Request, a minimum 7-day review period, and unanimous approval by active maintainers.
