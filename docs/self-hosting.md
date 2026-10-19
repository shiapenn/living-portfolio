# Self-Hosting & Branding Configuration Guide (`docs/self-hosting.md`)

> **Alpha version with known defects. Do not use in production or input real sensitive data.**

This guide covers self-hosting configuration and the trademark/branding rules required by [`docs/plans/osr-001-open-source-release.md`](plans/osr-001-open-source-release.md) (`OSR-09`, §1.2, §3.3).

## 1. Single-Owner Deployment Model (§1.3)

One deployment serves one owner and one PostgreSQL database. Multi-tenancy (`tenant_id`, shared-database isolation) is a non-goal.

## 2. Configuration Contract (`@living-portfolio/config`)

All runtime settings are validated at boot by [`packages/config/src/index.ts`](../packages/config/src/index.ts). Copy `.env.example` (generated from the schema via `pnpm config:generate-env`) to `.env` and configure:

- **Deploy config:** `PORT`, `DEPLOYMENT_CLASS` (`development` | `staging` | `production`), `DATABASE_URL`, `SITE_ORIGIN`, `ADMIN_ORIGIN`.
- **Secrets (env or `*_FILE` mounted files):** `SESSION_SECRET` (or `SESSION_SECRET_FILE`), `ADMIN_API_TOKEN` (or `ADMIN_API_TOKEN_FILE`), `GROQ_API_KEY`, `GEMINI_API_KEY`, `OPENAI_API_KEY`.
- **Browser-safe branding (`PUBLIC_` prefix):**
  - `PUBLIC_SITE_NAME`: Site title shown in `<title>` and RSS feed.
  - `PUBLIC_OWNER_NAME`: Owner display name in the navigation header and About page.
  - `PUBLIC_OWNER_STATEMENT`: Home page positioning statement.
  - `PUBLIC_OWNER_BIO`: About page biography paragraph.
  - `PUBLIC_SITE_LOGO_URL`: Optional URL/path to your own logo.
  - `PUBLIC_SITE_FOOTER_TEXT`: Footer attribution text.
  - `PUBLIC_UNOFFICIAL_FORK_NOTICE`: Footer and About page unofficial-fork disclosure slot.

## 3. Trademark & Unofficial Fork Notice (`TRADEMARKS.md`, `OSR-09`)

1. If you self-host for your own personal portfolio, set `PUBLIC_SITE_NAME` and `PUBLIC_OWNER_NAME` to your own name and domain.
2. Any fork or deployment offering a service to others **MUST** remove official branding (`brand/`) and display the mandatory notice in the footer and About page (`PUBLIC_UNOFFICIAL_FORK_NOTICE`):
   > *"This is an unofficial fork and is not affiliated with the official project."*
