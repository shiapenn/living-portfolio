# G003 — Upgrade and Migration Guide

| Field | Value |
| --- | --- |
| Doc ID | `G003` |
| Class | G |
| Status | Active |
| Supersedes | none |

---

## 1. Overview and Versioning Policy (§19)

The Living Portfolio follows [Semantic Versioning 2.0.0](https://semver.org/) for the application suite (`MAJOR.MINOR.PATCH`):
- **MAJOR:** Incompatible architectural shifts, breaking public API changes (`/api/v1` contract breaks), or mandatory manual schema interventions.
- **MINOR:** Backward-compatible new features, profile extensions, or non-breaking API additions.
- **PATCH:** Backward-compatible bug fixes, security patches, and performance optimizations.

Database schema evolution is tracked independently via an explicit integer version: `qrxp_schema_version`. All database migrations are **forward-only SQL scripts**. The API service validates the database schema version during boot; if the database is running an unrecognized or outdated schema version, the process halts immediately with actionable instructions on how to run migrations.

---

## 2. Pre-Upgrade Preparation & Mandatory Backups

Before applying any update in staging or production environments, always perform a complete backup:

### 2.1 Database Snapshot
Create a consistent binary or custom-format dump using `pg_dump`:
```bash
pg_dump -Fc "$DATABASE_URL" > "backup-pre-upgrade-$(date +%Y%m%d%H%M%S).dump"
```
Or execute the automated encrypted backup utility:
```bash
pnpm backup:run
```

### 2.2 Media Storage Snapshot
If using local storage, back up the asset directory:
```bash
tar -czvf "media-pre-upgrade-$(date +%Y%m%d%H%M%S).tar.gz" data/uploads/
```

### 2.3 Verify Backup Integrity
Ensure the dump is non-empty and readable before proceeding with the upgrade.

---

## 3. Database Migration Workflow

The data tier is managed via **Drizzle ORM** migrations located in `packages/db/migrations/`.

### 3.1 Applying Migrations in Docker Deployments
When using Docker Compose or container orchestrators, database migrations are applied either via a one-off migration task or during container startup:
```bash
docker compose run --rm api pnpm --filter @living-portfolio/db db:migrate
```

### 3.2 Applying Migrations in Source / Local Deployments
```bash
pnpm --filter @living-portfolio/db db:migrate
```

### 3.3 Zero-Downtime Migration Principles
For production deployments, migrations must adhere to backward compatibility during rolling deployments:
1. **Expand Phase:** Add new nullable columns, create new tables, or add indexes concurrently without locking existing tables.
2. **Deploy Code:** Deploy updated API and worker containers capable of reading both old and new schema variants.
3. **Contract Phase:** In a subsequent release, backfill default values and remove deprecated columns or tables.

---

## 4. Embedding Model Transitions & Vector Re-Embedding (§13.5, §19)

Unlike tabular relational columns, vector embeddings are tightly coupled to the specific model and dimensionality (e.g. 384 dimensions for all-MiniLM-L6-v2, 768 or 1536 for larger models). 

When upgrading to a new embedding model:
1. **Shadow Vectors:** The worker generates embeddings for the new model in a secondary vector column (`embedding_v2`) while the active system continues serving search requests from the primary column.
2. **Verification & Quality Gate:** Once 100% of published records are embedded with the new model, evaluation scripts score retrieval accuracy against the labeled benchmark suite.
3. **Atomic Cutover:** The API configuration updates `ACTIVE_EMBEDDING_MODEL` to the new version.
4. **Calibration Reset:** Parameter calibration values (`confidence_threshold`, `tier_boundaries`) fitted to the old vector space are reset or re-calibrated (§11).

---

## 5. Rollback Procedures

If an upgrade fails during deployment or causes unexpected regressions:

### 5.1 Application Code Rollback
Roll back container images to the previous known good digest:
```bash
# Docker Compose
docker compose pull api:<previous-tag>
docker compose up -d --no-deps api
```

### 5.2 Database Rollback Strategy
Because migrations are forward-only, database rollbacks depend on the nature of the migration:
- **Additive Migrations (non-breaking columns/tables):** Old code runs safely against the new schema. No database rollback is required.
- **Breaking Migrations:** Restore the database from the pre-upgrade snapshot taken in Section 2:
  ```bash
  pg_restore --clean --if-exists -d "$DATABASE_URL" backup-pre-upgrade-*.dump
  ```

---

## 6. Upgrade Troubleshooting

| Symptom | Root Cause | Resolution |
| --- | --- | --- |
| API exits at boot with `SchemaVersionMismatchError` | Pending database migrations | Run `pnpm --filter @living-portfolio/db db:migrate` before launching API. |
| Vector similarity queries fail with dimension error | Mismatch between model dimension and `pgvector` column | Verify `EMBEDDING_DIMENSION` in `.env` matches the active vector index. |
| Session invalidation after upgrade | `SESSION_SECRET` was rotated or changed | Re-authenticate with owner credentials at `/admin/login`. |
| 500 on admin actions due to CSRF token | Cached client bundle with stale session storage | Refresh browser cache and re-login to regenerate CSRF tokens. |

---

## 7. Revision History

| Date | Author | Description |
| :--- | :--- | :--- |
| 2026-11-04 | Core Architecture Team | Initial release of G003 Upgrade and Migration Guide for v0.1.0 GA release. |
