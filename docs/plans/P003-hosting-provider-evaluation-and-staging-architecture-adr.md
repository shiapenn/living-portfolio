# P003 — Hosting provider evaluation and staging architecture ADR

| Field | Value |
| --- | --- |
| Doc ID | `P003` |
| Class | P |
| Status | Active |
| Supersedes | none |

---

## 1. Context and Problem Statement

Following the completion of Gate G2 (Phase 5 / v0.1.0-alpha.2), the Living Portfolio is decoupled into an autonomous HTTP frontend (`apps/web`), a versioned backend REST API (`apps/api`), a background worker daemon (`apps/worker`), and PostgreSQL 16 persistence with `pgvector` (`packages/db`).

Work Package 8 (Cloud Staging Readiness / Gate G3) requires standing up an automated staging environment deployed from the `main` branch to validate the complete platform in a real cloud environment before general availability. As defined in the Open Source Release Plan (`docs/plans/osr-001-open-source-release.md` §6.1, §6.2), the hosting provider choice must be verified via a dedicated technical spike (`OSR-17`) addressing:
1. Prebuilt image deployment by immutable image digest (`ghcr.io/owner/repo/image@sha256:...`).
2. Scoped credential model minimizing CI privilege and preventing lateral movement.
3. Native `pgvector` support on PostgreSQL 16 without custom fork maintenance.
4. Unrestricted `pg_dump` and `pg_restore` access for automated encrypted backups and CI restore drills.
5. Private networking between web, api, worker, and database services.
6. Declarative infrastructure specification checked into version control (`deploy/<provider>/`).

This Architecture Decision Record (ADR) codifies the spike findings, compares the primary candidate (**Render**) against the alternate (**Fly.io**) and supplementary options, and establishes the cloud deployment architecture for Gate G3 and Gate G4.

---

## 2. Decision Drivers

- **Immutable Digest Deploys:** The hosting platform must accept prebuilt, Cosign-signed multi-arch container images referenced by SHA-256 digest directly from GitHub Container Registry (GHCR), guaranteeing zero build execution on the hosting runner.
- **Out-of-the-Box pgvector Support:** The managed database must natively support PostgreSQL 16 with the `vector` extension (`0.7.x+`) without requiring maintainers to compile or patch custom database engine binaries.
- **Direct pg_dump & pg_restore Compatibility:** The database must permit direct SSL connections from automated backup runners using standard PostgreSQL client tools (`pg_dump -Fc`) without mandatory proprietary VPN clients.
- **Least-Privilege Credential Isolation:** GitHub Actions CI deployment workflows must authenticate using scoped service deploy hooks or restricted API tokens rather than unrestricted account root credentials.
- **Zero-Hardcoded Secrets & Clean Env Contract:** All provider configuration must conform strictly to the Environment Contract (`docs/G002-configuration-reference-and-environment-contract.md`) and support `*_FILE` secrets mounting and runtime parameter injection.
- **Cost Predictability & Tier Boundaries:** The staging infrastructure must have predictable monthly costs and support automatic sleep/standby or budget caps to prevent unexpected runaway spending.

---

## 3. Evaluated Candidates & Spike Findings

We conducted an architectural spike evaluating **Render**, **Fly.io**, **Railway**, and **Docker Compose** against the mandatory Gate G3 criteria:

| Evaluation Criterion | Render (Selected Lead) | Fly.io (Alternate) | Railway (Discarded) | Docker Compose (Self-Host Baseline) |
|---|---|---|---|---|
| **Prebuilt Image by Digest** | Supported via Blueprint (`render.yaml`) and REST API (`POST /v1/services/{id}/deploys` with image digest). | Supported via `flyctl deploy -i <image>@sha256:...`. | Supported, but requires CLI or GraphQL API mutations. | Native (`docker compose pull && docker compose up`). |
| **Managed Postgres with pgvector** | Native PostgreSQL 16 supports `CREATE EXTENSION vector;` on all plans. | No native managed DB; `postgres-flex` requires building custom Docker images with `pgvector`. | Available via plugin, but version pinning and extension lifecycle vary. | Fully supported via official `pgvector/pgvector:pg16` image. |
| **pg_dump / pg_restore Access** | Standard external connection string (`postgres://...`) with SSL enforcement; works directly with `pg_dump`. | Internal 6PN IPv6 network by default; external `pg_dump` requires `fly wireguard` or proxy machine. | Supported via TCP proxy, but dynamic hostnames complicate automation. | Direct access via host port mapping or container network. |
| **Deploy Credential Model** | Individual per-service Deploy Hooks (URL tokens) or scoped API Keys (`RENDER_API_KEY`). | App-scoped or org-scoped tokens (`FLY_API_TOKEN`); OIDC integration is complex. | Project-scoped tokens; variable permissions. | Local secrets or SSH deploy keys. |
| **Private Networking** | Built-in `.render.internal` DNS for inter-service communication behind firewalls. | Built-in `.internal` 6PN WireGuard mesh network. | Built-in private networking between services in a project. | Docker bridge network (`portfolio-network`). |
| **Declarative Infrastructure** | `render.yaml` Blueprint checked into `deploy/render/render.yaml`. | `fly.toml` per service (separate files for web, api, worker, db). | `railway.toml` or UI templates. | `docker-compose.yml` checked into `deploy/compose/`. |
| **Background Workers & Cron** | Dedicated Background Worker service type and Cron Job service type. | Fly Machines with custom command/schedule. | Background service worker supported. | Standard daemon containers with restart policies. |

---

## 4. Deep-Dive Spike Verification

### 4.1 Prebuilt Image Deployment by Digest
- **Render:** Render blueprints (`render.yaml`) natively allow specifying prebuilt images:
  ```yaml
  services:
    - type: web
      name: living-portfolio-api
      env: docker
      image:
        url: ghcr.io/shiapenn/living-portfolio-api:sha-c430f63
  ```
  Additionally, GitHub Actions CI workflows can trigger zero-credential or hook-based deployments:
  ```bash
  curl -s -X POST "https://api.render.com/deploy/srv-xxxxx?imgURL=ghcr.io/shiapenn/living-portfolio-api@sha256:${DIGEST}"
  ```
  This guarantees that the container image deployed to staging is bit-for-bit identical to the artifact verified by CodeQL and Trivy in CI.

### 4.2 pgvector Extension Verification
- **Render PostgreSQL:** Executing `CREATE EXTENSION IF NOT EXISTS vector;` on Render PostgreSQL 16 succeeds immediately with `vector 0.7.x`. Chunks vector embeddings (`vector(1536)`) and HNSW / IVFFlat indexing execute natively.
- **Fly.io PostgreSQL:** Fly's `postgres-flex` template does not bundle `pgvector`. Attempting to load the extension without building a custom image yields `ERROR: extension "vector" is not available`. Maintaining custom PostgreSQL container builds introduces substantial maintenance burden outside the core application mission.

### 4.3 Database Backup & Restore Drill (`pg_dump`)
- **Render:** Render provides both automated daily backups and explicit external connection endpoints with TLS. A CI runner or backup daemon can execute:
  ```bash
  pg_dump -Fc --no-owner --no-acl "${DATABASE_URL}" | age -r "${AGE_PUBLIC_KEY}" > backup.dump.age
  ```
  Scratch-container restore drills (WP-9.1 / `OSR-20`) can verify the dump cleanly in an ephemeral local Postgres instance during CI execution.
- **Fly.io:** Running `pg_dump` externally requires establishing a user-space WireGuard tunnel or running the dump within an ephemeral Fly Machine, adding network failure modes to backup automation.

---

## 5. Decision Outcome

We selected **Render** as the primary cloud hosting provider for staging (Gate G3) and production (Gate G4), with **Docker Compose** as the reference self-hosting implementation:

1. **Lead Cloud Provider: Render (`deploy/render/`)**
   - Staging environment deployed automatically from `main` using image digests.
   - Managed PostgreSQL 16 with native `pgvector`.
   - Separate services:
     - `living-portfolio-api`: Web service running `@living-portfolio/api`.
     - `living-portfolio-web`: Web service running `@living-portfolio/web`.
     - `living-portfolio-worker`: Background worker running `@living-portfolio/worker`.
     - `living-portfolio-db`: Managed PostgreSQL database with `vector` extension.
   - Declarative specification stored at `deploy/render/render.yaml`.

2. **Self-Hosted Reference: Docker Compose (`deploy/compose/`)**
   - Remains the 100% self-hosted reference implementation for single-node operators.
   - Uses `pgvector/pgvector:pg16` container.

3. **Designated Alternate: Fly.io (`deploy/fly/`)**
   - Documented as the secondary edge-native candidate if multi-region active-active deployment is required in future milestones.

---

## 6. Staging Architecture & Safeguards (OSR-18, OSR-19)

In accordance with Spec §6.4 and `docs/plans/osr-001-open-source-release.md`:

```
+---------------------------------------------------------------------------------+
|                                 STAGING CLOUD                                   |
|                                                                                 |
|  +---------------------------+             +---------------------------------+  |
|  |   living-portfolio-web    |   HTTP      |      living-portfolio-api       |  |
|  | - Persistent Banner       | ----------> | - DEPLOYMENT_CLASS=staging      |  |
|  |   "Staging: synthetic"    | (Internal)  | - Import connectors disabled    |  |
|  | - robots.txt noindex      |             | - Synthetic demo seed only      |  |
|  +---------------------------+             +---------------------------------+  |
|                                                            |                    |
|                                                            | Database Pool      |
|                                                            v                    |
|  +---------------------------+             +---------------------------------+  |
|  |  living-portfolio-worker  |             |      living-portfolio-db        |  |
|  | - pg-boss daemon          | ----------> | - Managed PostgreSQL 16         |  |
|  | - Chunking & Embeddings   | (Internal)  | - pgvector extension enabled    |  |
|  +---------------------------+             +---------------------------------+  |
+---------------------------------------------------------------------------------+
```

### Staging Safeguards Implementation (Gate G3 / OSR-19):
1. **Persistent UI Warning:** When `DEPLOYMENT_CLASS=staging`, `apps/web` renders an inescapable banner at the top of every page: *"Staging: synthetic data only."*
2. **Import Connectors Disabled:** All import endpoints (`/api/v1/import/*`) return `403 Forbidden` with error code `STAGING_IMPORT_DISABLED`.
3. **Search Engine Blocking:** `robots.txt` serves `Disallow: /` and all HTML responses include `<meta name="robots" content="noindex, nofollow">`.
4. **Isolated Credentials:** Staging database credentials, API keys, and synthetic encryption keys are strictly separated from production environments.
5. **Production Start Guard:** The application runtime refuses to boot when `DEPLOYMENT_CLASS=production` unless a valid G4 sign-off document exists (`docs/releases/g4-signoff.md`).

---

## 7. Operational Runbook & CI/CD Pipeline Design

### 7.1 Staging Deploy Workflow (`.github/workflows/deploy-staging.yml`)
- **Trigger:** Automatic push to `main` following successful completion of `main-gates` (CI & Audit Conformance, Secret Scan, CodeQL).
- **Authentication:** Scoped Render deploy hooks or GitHub Environment secret `RENDER_DEPLOY_HOOK_URL`.
- **Deployment Mechanics:**
  1. Verify prebuilt images exist on GHCR with valid digests.
  2. Invoke Render deploy hook with target image digest.
  3. Poll deployment status until `live` or `failed`.
  4. Execute synthetic smoke test suite against staging URL (`/api/v1/health`, public entry retrieval, Ask extractive response).

### 7.2 Rollback Procedure
If a staging or production deploy fails health verification:
1. Re-invoke the deploy hook specifying the previous verified image digest SHA.
2. Migrations are designed to be backward-compatible with release $N-1$, ensuring zero downtime during rollback.

---

## 8. Architectural Invariants and Compliance Verification

- **Invariance 1 (Decoupled Cloud Topology):** The web tier and API tier communicate over standard HTTP REST contracts (`@living-portfolio/client`), allowing independent scaling and hosting.
- **Invariance 2 (Zero Hardcoded Cloud Identifiers):** Service URLs, ports, and database credentials are fully resolved from environment variables conforming to `packages/config`.
- **Invariance 3 (Self-Host Primacy):** No cloud provider feature may introduce proprietary dependencies into `@living-portfolio/core`, `@living-portfolio/api`, or `@living-portfolio/web`. All provider-specific blueprints reside exclusively in `deploy/`.
