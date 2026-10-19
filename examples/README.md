# Synthetic Demo Fixtures (`examples/`)

Per [`docs/plans/osr-001-open-source-release.md`](../docs/plans/osr-001-open-source-release.md) (`OSR-04`, §3.3 rule 7 and §6.4):

1. Synthetic demo entries are **never** seeded by default on server startup (`SEED_DEMO=false` by default).
2. `DEPLOYMENT_CLASS=production` rejects `SEED_DEMO=true` at boot via `@living-portfolio/config`.
3. To seed synthetic demo data explicitly during local development or staging:
   - Set `SEED_DEMO=true` in your development environment, or
   - Call `POST /api/seed` with an authenticated admin token (`Authorization: Bearer <token>`), or
   - Run `npx tsx examples/seed-demo.ts`.
