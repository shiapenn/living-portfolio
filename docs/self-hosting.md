# Self-Hosting & Branding Configuration Guide (`docs/self-hosting.md`)

> **Alpha version with known defects. Do not use in production or input real sensitive data.**

This guide covers complete self-hosting instructions, deployment topology, environment configuration, reverse proxy setup, backup automation, and trademark/branding rules required by [`docs/plans/osr-001-open-source-release.md`](plans/osr-001-open-source-release.md) (`OSR-09`, `OSR-23`, §1.2, §3.3).

---

## 1. Single-Owner Deployment Model (§1.3)

One deployment serves one owner and one PostgreSQL database. Multi-tenancy (`tenant_id`, shared-database isolation) is explicitly out of scope. Every instance operates as an independent, sovereign digital estate.

---

## 2. System Requirements (§13.1)

- **Compute:** 1 vCPU (minimum), 2+ vCPUs recommended.
- **Memory:** 1 GB RAM (minimum for containerized Node.js runtime + Postgres), 2 GB+ recommended for background vector operations and local embeddings.
- **Storage:** 10 GB+ SSD recommended for application files, media assets, Postgres data, and pgvector embeddings.
- **Operating System:** Linux (Ubuntu 22.04 LTS / Debian 12 / Alpine), macOS, or any container engine supporting Docker / OCI standards (amd64 / arm64).
- **Database:** PostgreSQL 16+ with the `pgvector` extension enabled.

---

## 3. Quickstart via Docker Compose (§13.13)

The fastest and most reliable deployment path is via Docker Compose:

1. **Clone the repository:**
   ```bash
   git clone https://github.com/shiapenn/living-portfolio.git
   cd living-portfolio
   ```

2. **Generate configuration:**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` to configure your origins, session secrets, and database credentials (see Section 4).

3. **Launch the stack:**
   ```bash
   docker compose -f docker/docker-compose.yml up -d
   ```

4. **Verify container health:**
   ```bash
   curl http://localhost:4000/healthz
   ```

5. **Initial Setup:**
   Navigate to `http://localhost:4000/admin/setup` in your browser to complete owner account creation and generate the initial recovery token.

---

## 4. Configuration Contract (`@living-portfolio/config`)

All runtime settings are validated at boot by [`packages/config/src/index.ts`](../packages/config/src/index.ts). For complete contract definitions, see [`docs/G002-configuration-reference-and-environment-contract.md`](G002-configuration-reference-and-environment-contract.md).

### 4.1 Deployment Parameters
- `PORT`: Port the API HTTP server listens on (default: `4000`).
- `ENABLE_BUNDLED_WEB`: Enables single-process bundled web server mode in `apps/api` (default: `true`). When enabled, the public site and admin workspace are served on `PORT` alongside the API routes.
- `DEPLOYMENT_CLASS`: Operational environment classification (`development` | `staging` | `production`). Production enforces strict TLS origins and disallows default secrets.
- `DATABASE_URL`: PostgreSQL connection string with pgvector (e.g. `postgresql://postgres:postgres@db:5432/living_portfolio`).
- `SITE_ORIGIN`: Public domain serving the frontend portfolio (e.g. `https://example.com`).
- `ADMIN_ORIGIN`: Origin authorized to access the owner workspace (e.g. `https://example.com` or `https://admin.example.com`).

### 4.2 Security Secrets (Env or `*_FILE` Mounts)
Secrets can be supplied via standard environment variables or mounted files for container secret managers:
- `SESSION_SECRET` (or `SESSION_SECRET_FILE`): 64+ char random hex string for signing session cookies.
- `ADMIN_API_TOKEN` (or `ADMIN_API_TOKEN_FILE`): 64+ char bearer token for programmatic API administration.
- `GROQ_API_KEY`: Groq Cloud API key for fast Llama inference.
- `GEMINI_API_KEY`: Google Gemini API key for multimodal reasoning.
- `OPENAI_API_KEY`: OpenAI API key.

### 4.3 Browser-Safe Branding (`PUBLIC_` Prefix)
All variables prefixed with `PUBLIC_` are safe to pass to browser clients:
- `PUBLIC_SITE_NAME`: Site title displayed in `<title>`, navigation, and RSS feed.
- `PUBLIC_OWNER_NAME`: Owner display name in header and about pages.
- `PUBLIC_OWNER_STATEMENT`: Hero section positioning statement.
- `PUBLIC_OWNER_BIO`: Biography paragraph on the about page.
- `PUBLIC_SITE_LOGO_URL`: Path or URL to custom avatar or branding icon.
- `PUBLIC_SITE_FOOTER_TEXT`: Custom footer attribution text.
- `PUBLIC_UNOFFICIAL_FORK_NOTICE`: Mandatory disclosure slot for unofficial forks.

---

## 5. Reverse Proxy & Network Topologies (§13.4)

The application follows an **outbound-only architecture**. The origin server should not expose unauthenticated public ports directly to the internet.

### Option A: Cloudflare Tunnel (`cloudflared`) — Recommended
Cloudflare Tunnel provides automated TLS, DDoS mitigation, and zero exposed inbound ports:
1. Install `cloudflared` on the host or run as a companion container.
2. Route traffic to the local Docker network (`http://web:3000`).
3. Set `SITE_ORIGIN` and `ADMIN_ORIGIN` to your Cloudflare domain.

### Option B: Caddy Reverse Proxy
Caddy provides automatic HTTPS with Let's Encrypt:
```caddy
example.com {
    reverse_proxy localhost:3000 {
        header_up X-Forwarded-Proto {scheme}
        header_up X-Forwarded-Host {host}
    }
}
```

---

## 6. Storage & Media Asset Handling (§13.9)

- **Default:** Local filesystem storage under `data/uploads/` or a mounted Docker volume.
- **Cloud Object Storage (Optional):** S3-compatible storage (Cloudflare R2, AWS S3, MinIO) for media uploads and offsite backups.

---

## 7. Automated Backups & Disaster Recovery (OSR-20, §13.11)

The system includes automated database dumps and asset backups:

1. **Manual Backup:**
   ```bash
   pnpm backup:run
   ```
2. **Encrypted Age Backups:** Backups generated by `scripts/backup.sh` are encrypted with an `age` recipient key before uploading to offsite storage.
3. **Disaster Recovery Drill:**
   Test backup restoration in a clean container scratch environment:
   ```bash
   pnpm test:backup-restore
   ```

---

## 8. Trademark & Unofficial Fork Notice (`TRADEMARKS.md`, `OSR-09`)

1. If you self-host for your own personal portfolio, set `PUBLIC_SITE_NAME` and `PUBLIC_OWNER_NAME` to your own name and domain.
2. Any fork or deployment offering a service to others **MUST** remove official branding (`brand/`) and display the mandatory notice in the footer and About page (`PUBLIC_UNOFFICIAL_FORK_NOTICE`):
   > *"This is an unofficial fork and is not affiliated with the official project."*
