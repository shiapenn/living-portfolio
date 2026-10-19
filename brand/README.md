# Segregated Brand Assets (`brand/`)

Per [`TRADEMARKS.md`](../TRADEMARKS.md) and [`docs/plans/osr-001-open-source-release.md`](../docs/plans/osr-001-open-source-release.md) (§1.2, `OSR-09`):

1. Official brand assets placed in `brand/` are governed by [`brand/LICENSE`](LICENSE) and are **excluded** from the Apache-2.0 license grant.
2. The open-source application ships with neutral configuration-driven branding (`PUBLIC_SITE_NAME=Portfolio Sandbox`, `PUBLIC_OWNER_NAME=Portfolio Owner`).
3. Forks and third-party deployments MUST remove `brand/` assets and configure their own branding via `@living-portfolio/config`.
