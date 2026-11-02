# Render Cloud Staging Deployment Guide (Gate G3, OSR-18)

This directory contains the declarative infrastructure configuration for deploying **The Living Portfolio** to [Render](https://render.com) staging environment, codifying the architectural decisions from [ADR P003](../../docs/plans/P003-hosting-provider-evaluation-and-staging-architecture-adr.md).

---

## 1. Architecture Overview

The staging environment consists of four decoupled components orchestrated via `render.yaml`:

1. **`living-portfolio-web`** (`apps/web`): Public Strata site and admin frontend served on port 3001. Connects to `living-portfolio-api` via HTTP over Render's internal network (`.render.internal`).
2. **`living-portfolio-api`** (`apps/api`): REST API backend served on port 3000. Provides versioned endpoints (`/api/v1`), JWT authentication, OpenAPI schema, and database persistence.
3. **`living-portfolio-worker`** (`apps/worker`): Background worker daemon handling chunking, embeddings computation, and asynchronous tasks via `pg-boss`.
4. **`living-portfolio-db`**: Managed PostgreSQL 16 database instance with native `pgvector` extension enabled (`CREATE EXTENSION IF NOT EXISTS vector;`).

---

## 2. Deployment Mechanics: Immutable Image Digests

As required by Gate G3 and Spec §13.1, staging deployments are driven by **prebuilt container images pinned to immutable SHA-256 digests**, guaranteeing bit-for-bit parity with CI-verified artifacts:

1. GitHub Actions CI builds and packages multi-arch container images (`apps/web`, `apps/api`, `apps/worker`) on pushes to `main`.
2. Images are pushed to GitHub Container Registry (`ghcr.io/shiapenn/living-portfolio/*`).
3. The continuous deployment workflow (`.github/workflows/deploy-staging.yml`) retrieves the exact SHA-256 digest (`@sha256:...`) of each pushed image.
4. Deployment is triggered via scoped per-service Deploy Hooks or Render API passing the full image URL with immutable digest:
   ```bash
   POST https://api.render.com/deploy/srv-${SERVICE_ID}?imgURL=ghcr.io/${OWNER}/living-portfolio-api@sha256:${DIGEST}
   ```

---

## 3. Scoped Deploy Credentials & Security Isolation

To adhere to the principle of least privilege:
- **No Root API Tokens:** Deployments do NOT use account-wide Render API tokens with deletion or billing privileges.
- **Per-Service Deploy Hooks:** Each service (`web`, `api`, `worker`) possesses an independent deploy hook URL configured in the GitHub repository's `staging` environment:
  - `RENDER_STAGING_API_DEPLOY_HOOK`
  - `RENDER_STAGING_WEB_DEPLOY_HOOK`
  - `RENDER_STAGING_WORKER_DEPLOY_HOOK`
- **Zero-Credential Read Access:** Container images on GHCR are public or linked to Render via scoped package read tokens.
- **Environment Isolation:** Staging database credentials, synthetic JWT secrets, and API keys are isolated within Render's staging environment and never shared with production.

---

## 4. Staging Safeguards (OSR-19)

The staging environment operates with technical safeguards enforced at runtime:
- `DEPLOYMENT_CLASS=staging` renders the persistent warning banner: *"Staging: synthetic data only."*
- Connectors and live external imports are disabled.
- Search indexing is blocked (`robots.txt` disallows all crawlers, and HTML contains `<meta name="robots" content="noindex, nofollow">`).
- All seed data is synthetic and sourced exclusively from `examples/`.

---

## 5. Staging Rollback Runbook

To rollback a broken staging deployment to a previously verified release:
1. Identify the last verified Git commit SHA or GHCR image digest from GitHub Actions release logs.
2. Trigger the deploy hook with the previous image digest:
   ```bash
   curl -fsS -X POST "${RENDER_STAGING_API_DEPLOY_HOOK}?imgURL=ghcr.io/${OWNER}/living-portfolio-api@sha256:${PREVIOUS_DIGEST}"
   ```
3. Database migrations maintain backward compatibility across $N-1$ releases, allowing seamless rollback without schema corruption.

---

## 6. Production Blueprint & Deployment Architecture (Gate G4, OSR-22)

The production environment mirrors staging topology while enforcing production-grade resilience and isolation in `render.production.yaml`:
- **`living-portfolio-web-prod`**: Autonomous frontend on port 3001 (`DEPLOYMENT_CLASS=production`).
- **`living-portfolio-api-prod`**: Versioned API backend on port 3000 (`DEPLOYMENT_CLASS=production`).
- **`living-portfolio-worker-prod`**: Background worker daemon (`DEPLOYMENT_CLASS=production`).
- **`living-portfolio-db-prod`**: Managed PostgreSQL 16 database instance (`portfolio_production`) with `pgvector`.

---

## 7. Required Reviewer & Environment Protection

Production deployments are orchestrated via `.github/workflows/deploy-production.yml` and bound to the GitHub `production` environment:
- **Required Reviewers:** Deployments pause before execution and strictly require manual approval by repository owners/maintainers.
- **Branch Protection:** Deployment is restricted to release tags (`v*`) and validated `main` branch heads.
- **Scoped Production Secrets:**
  - `RENDER_PRODUCTION_API_DEPLOY_HOOK`
  - `RENDER_PRODUCTION_WEB_DEPLOY_HOOK`
  - `RENDER_PRODUCTION_WORKER_DEPLOY_HOOK`
  - `PRODUCTION_API_URL`
  - `PRODUCTION_WEB_URL`

---

## 8. Health Gate & Automated Rollback Protocol (Spec §13.1, §19, OSR-22)

Every production deployment executes through the unified CLI deploy gate (`scripts/deploy-with-rollback`):
1. **Immutable Digest Pinning:** All service images MUST be referenced by full `@sha256:...` digest. Mutable tags (`:latest`, `:staging-latest`) are rejected with an exit error.
2. **Deploy Trigger:** Services are updated concurrently via scoped deploy hooks passing `@${TARGET_DIGEST}`.
3. **Health Gate Evaluation:**
   - Probes `${PRODUCTION_API_URL}/healthz` for `HTTP 200 { "status": "healthy" }`.
   - Probes `${PRODUCTION_API_URL}/api/v1/health` for database connectivity and active alert clearance.
   - Probes `${PRODUCTION_WEB_URL}/healthz` for `HTTP 200 { "status": "ok" }`.
   - Executes polling loop with exponential backoff across 15 attempts (120s timeout window).
4. **Automated Rollback:**
   - If the health gate fails (timeout, 5xx error, or degraded status), automated rollback triggers immediately.
   - Previous known-healthy image digests (`@${PREVIOUS_DIGEST}`) are deployed to all affected services via deploy hooks.
   - Health gate re-verifies that rolled-back services return to healthy status.
   - Deployment exits with code 1, signaling failed target deployment while preserving production uptime.

---

## 9. Rollback Drill Proof in Staging (Gate G4)

To prove rollback capability without risking production traffic, staging supports an automated rollback drill:
```bash
node scripts/deploy-with-rollback --simulate-failure --dry-run
```
Or via GitHub Actions workflow dispatch:
```bash
gh workflow run deploy-staging.yml -f trigger_rollback_drill=true
```
This simulates deployment failure, triggers the automated rollback sequence, and proves the cluster recovers cleanly.
