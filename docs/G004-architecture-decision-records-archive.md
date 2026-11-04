# G004 — Architecture Decision Records Archive

| Field | Value |
| --- | --- |
| Doc ID | `G004` |
| Class | G |
| Status | Active |
| Supersedes | none |

---

## 1. Purpose of Architecture Decision Records (ADRs)

Architecture Decision Records (ADRs) capture significant architectural decisions along with their context, trade-offs, and consequences. ADRs serve as a permanent, immutable record of engineering choices, preventing the re-derivation of settled decisions and providing transparent historical reasoning for maintainers and contributors.

In The Living Portfolio, foundational architectural shifts require an ADR before implementation commences.

---

## 2. ADR Index & Archive

| ADR ID | Title | Status | Date | Primary Scope | Document Link |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`P002`** | API Boundary and Web Decoupling | `Accepted` | 2026-11-02 | Decoupling the frontend web application from the backend database; establishing the `/api/v1` HTTP contract and generated `@living-portfolio/client`. | [`P002-api-boundary-and-web-decoupling-adr.md`](plans/P002-api-boundary-and-web-decoupling-adr.md) |
| **`P003`** | Hosting Provider Evaluation & Staging Architecture | `Accepted` | 2026-11-02 | Evaluation of hosting platforms (Render, Fly.io, Railway, VPS), selecting container-by-digest deployments, automated staging CD, and persistent pgvector storage. | [`P003-hosting-provider-evaluation-and-staging-architecture-adr.md`](plans/P003-hosting-provider-evaluation-and-staging-architecture-adr.md) |
| **`DR-AUD-001`** | Audit Tracking & Continuous Conformance Protocol | `Accepted` | 2026-10-21 | Establishing the machine-readable audit register (`register.yml`), mandatory regression probes, and CI conformance gates. | [`DR-AUD-001.md`](governance/DR-AUD-001.md) |

---

## 3. ADR Lifecycle & Statuses

Each ADR progresses through the following lifecycle states:

- **Proposed:** Drafted and open for maintainer review via a Pull Request.
- **Accepted:** Approved by maintainers and merged into the documentation suite. The decision is now active policy.
- **Superseded:** Replaced by a subsequent ADR (the superseded record explicitly links to the new ADR).
- **Deprecated:** The decision is no longer relevant due to architectural evolution or feature retirement.

---

## 4. When an ADR is Required

An ADR **MUST** be authored when proposing:
1. Introduction of new persistent data stores, message queues, or storage abstractions.
2. Breaking changes to the public API contract (`/api/v1`) or client SDK architecture.
3. Fundamental alterations to the security, authentication, or session management models.
4. Adoption of major external runtime libraries or frameworks.
5. Modifications to the deployment, containerization, or hosting runtime topologies.

---

## 5. Proposing a New ADR

1. **Allocate Document ID:**
   Use the documentation CLI tool to allocate the next sequential Class P document:
   ```bash
   pnpm docs:new P "Title of Architectural Decision"
   ```
2. **Follow the Standard Structure:**
   - **Context:** What problem are we solving? What are the constraints, operational realities, and motivations?
   - **Decision:** What specific approach are we taking?
   - **Rationale & Alternatives Considered:** Why was this option chosen over alternatives? (Include trade-offs matrix).
   - **Consequences:** What becomes easier? What becomes more complex?
   - **Security, Privacy & Truth Implications:** How does this decision affect data classification, truthfulness, and privacy?
3. **Submit for Review:**
   Submit via Pull Request. Ensure that all maintainers have an opportunity to review and provide feedback. Once merged, update this archive index.

---

## 6. Revision History

| Date | Author | Description |
| :--- | :--- | :--- |
| 2026-11-04 | Core Architecture Team | Initial release of G004 Architecture Decision Records Archive for v0.1.0 GA release. |
