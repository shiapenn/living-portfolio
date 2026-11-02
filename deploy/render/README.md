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

## 5. Rollback Runbook

To rollback a broken staging deployment to a previously verified release:
1. Identify the last verified Git commit SHA or GHCR image digest from GitHub Actions release logs.
2. Trigger the deploy hook with the previous image digest:
   ```bash
   curl -fsS -X POST "${RENDER_STAGING_API_DEPLOY_HOOK}?imgURL=ghcr.io/${OWNER}/living-portfolio-api@sha256:${PREVIOUS_DIGEST}"
   ```
3. Database migrations maintain backward compatibility across $N-1$ releases, allowing seamless rollback without schema corruption.
