# G002 — Configuration Reference and Environment Contract

| Field | Value |
| --- | --- |
| Doc ID | `G002` |
| Class | G |
| Status | Active |
| Supersedes | none |

---

## 1. Overview and Architecture

The Living Portfolio application suite is configured through a centralized, Zod-validated configuration package: [`@living-portfolio/config`](../packages/config).

The system adheres to twelve-factor configuration principles with strict production fail-fast assertions. Configuration is loaded synchronously during application boot across all runtime services (`apps/api`, `apps/web`, `apps/worker`), ensuring that missing required values or malformed parameters are flagged immediately before any network ports or database pools open.

### Core Architectural Guarantees

1. **Precedence Hierarchy:** Defaults < Configuration File < Environment Variables < `*_FILE` Secret Mounts.
2. **Container Secret Isolation:** All sensitive credentials support Docker/Kubernetes secret mounts via standard `_FILE` suffixes (e.g. `DATABASE_URL_FILE`, `SESSION_SECRET_FILE`).
3. **Client-Safe Secret Isolation:** Variables prefixed with `PUBLIC_` are explicitly extracted for browser consumption; non-`PUBLIC_` variables and secrets are completely isolated from client rendering bundles.
4. **Zero-Drift Synchronization:** The root `.env.example` template is generated deterministically from `@living-portfolio/config` metadata and continuously verified in CI via `pnpm env:check`.

---

## 2. Configuration Precedence

Configuration values are resolved using the following order of precedence, where each subsequent tier overrides values defined in earlier tiers:

```
+-----------------------------------------------------------+
| 1. Hardcoded Schema Defaults (Lowest)                     |
+-----------------------------------------------------------+
                            | Overridden by
                            v
+-----------------------------------------------------------+
| 2. Optional YAML Configuration File (CONFIG_FILE)         |
+-----------------------------------------------------------+
                            | Overridden by
                            v
+-----------------------------------------------------------+
| 3. Environment Variables (process.env)                    |
+-----------------------------------------------------------+
                            | Overridden by
                            v
+-----------------------------------------------------------+
| 4. Mounted Secret Files (*_FILE) (Highest)                |
+-----------------------------------------------------------+
```

### Precedence Resolution Rules

1. **YAML Configuration File:** If the `CONFIG_FILE` environment variable is defined and points to an existing file (or if `yamlPath` is passed to `loadConfig()`), its parsed key-value pairs populate the configuration base.
2. **Environment Variables:** Values in `process.env` override both built-in defaults and file-based settings.
3. **Mounted Secret Files (`*_FILE`):** If an environment variable ending with `_FILE` is defined (e.g. `SESSION_SECRET_FILE=/run/secrets/session_secret`), the system reads the referenced file's contents, trims trailing newlines, and assigns the result to the base key (`SESSION_SECRET`). If the referenced file does not exist, boot aborts immediately with a `ConfigValidationError`.

---

## 3. Environment Variable Reference

### 3.1 Deployment and Server Topology

| Key | Type | Default | Production Required | Description |
| --- | --- | --- | --- | --- |
| `PORT` | Integer (1–65535) | `4000` | No | HTTP server listening port for bundled or unified deployments. |
| `API_PORT` | Integer | `3000` | No | Listening port for standalone `apps/api`. |
| `WEB_PORT` | Integer | `3001` | No | Listening port for standalone `apps/web`. |
| `DEPLOYMENT_CLASS` | Enum | `development` | Yes | Target deployment class: `development`, `staging`, or `production`. Controls validation rules and security guards. |
| `PRESET` | Enum | `free-cloud` | No | Resource and provider preset: `free-cloud`, `hobbyist-vps`, or `local-only`. |
| `SITE_ORIGIN` | String (URLs) | `http://localhost:4000` | No | Comma-separated list of allowed public web origins for CORS headers and canonical feed generation. |
| `ADMIN_ORIGIN` | String (URLs) | `http://localhost:4000` | No | Allowed origin for administrative sessions and CSRF token verification. |
| `ADMIN_HOSTNAME` | String | `admin.example.com` | No | Hostname used for edge routing of admin workspace traffic (§13.4). |
| `API_HOSTNAME` | String | `api.example.com` | No | Hostname used for edge routing of public API traffic (§13.4). |
| `ENABLE_BUNDLED_WEB` | Boolean | `false` | No | Enables the optional single-process bundled web adapter in `apps/api`. |
| `SEED_DEMO` | Boolean | `false` | No | Seeds synthetic multi-year demo records on boot. **Strictly forbidden in `production`**. |
| `NTFY_TOPIC` | String | `""` | No | ntfy.sh notification topic for escalations and operational alerts (§13.9). |
| `AGE_PUBLIC_KEY` | String | `""` | No | age public key for encrypting automated database backups (§13.9). |
| `S3_BACKUP_BUCKET` | String | `""` | No | S3-compatible bucket name for encrypted backup archives (§13.9). |

### 3.2 Database Configuration

| Key | Secret Mount | Default | Production Required | Description |
| --- | --- | --- | --- | --- |
| `DATABASE_URL` | `DATABASE_URL_FILE` | `""` | **Yes** | PostgreSQL + pgvector connection string (e.g. `postgresql://user:pass@host:5432/portfolio`). |
| `PORTFOLIO_DB_MODE` | None | `in-memory` (dev) | No | Explicit database adapter mode: `in-memory`, `postgres`, or `dual-write`. |

### 3.3 Authentication & Secrets

| Key | Secret Mount | Default | Production Required | Description |
| --- | --- | --- | --- | --- |
| `SESSION_SECRET` | `SESSION_SECRET_FILE` | `""` | **Yes** | Minimum 16-character HMAC key for signing session cookies, CSRF tokens, and redaction preview tokens. |
| `ADMIN_API_TOKEN` | `ADMIN_API_TOKEN_FILE` | `""` | No | Bootstrap personal access token for headless automation and initial setup. |
| `TUNNEL_TOKEN` | `TUNNEL_TOKEN_FILE` | `""` | No | Cloudflare Tunnel token for exposing local or private services (§13.8). |

### 3.4 AI Providers and Model Credentials

| Key | Secret Mount | Default | Description |
| --- | --- | --- | --- |
| `OPENAI_API_KEY` | `OPENAI_API_KEY_FILE` | `""` | API key for OpenAI model endpoints (§13.5). |
| `GROQ_API_KEY` | `GROQ_API_KEY_FILE` | `""` | API key for Groq fast inference endpoints (§13.5). |
| `GEMINI_API_KEY` | `GEMINI_API_KEY_FILE` | `""` | API key for Google Gemini model endpoints (§13.5). |

### 3.5 Client-Safe Branding & Public Settings (`PUBLIC_*`)

All variables in this category are safe for public browser exposure and client-side consumption.

| Key | Default | Description |
| --- | --- | --- |
| `PUBLIC_API_BASE_URL` | `/api` | Browser-safe base URL for API requests from `apps/web`. |
| `PUBLIC_SITE_NAME` | `Portfolio Sandbox` | Public site title and header brand label (OSR-09). |
| `PUBLIC_OWNER_NAME` | `Portfolio Owner` | Display name of the portfolio owner (OSR-04, OSR-09). |
| `PUBLIC_OWNER_STATEMENT` | *Default positioning statement* | Positioning statement rendered on the home page (OSR-09). |
| `PUBLIC_OWNER_BIO` | *Default bio paragraph* | Biography paragraph rendered on the `/about` page (OSR-09). |
| `PUBLIC_SITE_LOGO_URL` | `""` | Optional URL or static path to custom brand logo. |
| `PUBLIC_SITE_FOOTER_TEXT` | `Powered by an open-source...` | Footer copyright and license line. |
| `PUBLIC_UNOFFICIAL_FORK_NOTICE`| `This is an unofficial fork...`| Mandatory trademark notice when hosting an unofficial fork offering services to others (OSR-09 §1.2). |

---

## 4. Production Safeguards (`DEPLOYMENT_CLASS=production`)

When `DEPLOYMENT_CLASS=production`, `loadConfig()` enforces strict operational invariants and throws a `ConfigValidationError` if violated:

1. **Mandatory Database Connection:** `DATABASE_URL` (or `DATABASE_URL_FILE`) must be populated with a non-empty connection string. In-memory databases are rejected for production.
2. **Cryptographic Session Secret:** `SESSION_SECRET` (or `SESSION_SECRET_FILE`) must be populated and contain at least 16 characters.
3. **No Synthetic Demo Seeding:** `SEED_DEMO=true` is strictly prohibited. Production instances must never boot with synthetic demo records.

---

## 5. Client Secret Isolation Contract

To prevent credential leaks to public visitor browsers:

1. **Server Isolation:** The `loadConfig()` function returns the full `AppConfig` interface containing all configuration items, which is consumed only by server-side packages (`apps/api`, `apps/worker`, server templates).
2. **Browser Extraction:** `getPublicConfig(cfg)` filters the configuration object, returning **only** settings whose keys begin with `PUBLIC_`.
3. **Verification Test:** Unit test `packages/config/src/config.test.ts` asserts that `getPublicConfig()` contains 0 secrets and that non-public variables (`SESSION_SECRET`, `ADMIN_API_TOKEN`, `DATABASE_URL`, API keys) never appear in the returned object.

---

## 6. Zero-Drift Synchronization

The `.env.example` file in the repository root serves as the authoritative starter template for developers and operators.

To prevent documentation rot, `.env.example` is generated programmatically:

```bash
# Generate .env.example from CONFIG_SETTINGS_METADATA
pnpm env:generate

# Verify that committed .env.example matches code definitions
pnpm env:check
```

The check runs as Gate 2 in `pnpm verify` (`scripts/verify-all`). If an engineer adds or modifies a setting in `CONFIG_SETTINGS_METADATA` without regenerating `.env.example`, CI fails immediately.

---

## 7. Revision History

| Date | Author | Description |
| --- | --- | --- |
| 2026-11-02 | A (Implementer) | Initial configuration reference and environment contract (WP-7.3 / OSR-23) |
