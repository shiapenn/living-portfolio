# P002 — API Boundary and Web Decoupling Architecture Decision Record

| Field | Value |
| --- | --- |
| Doc ID | `P002` |
| Class | P |
| Status | Active |
| Supersedes | none |

---

## 1. Context and Problem Statement

In the initial implementation of the Living Portfolio monorepo, the user-facing web rendering layer (`apps/web`) and the backend API server (`apps/api`) were tightly coupled:

1. **Monolithic Mounting:** `apps/api/src/app.ts` statically imported rendering functions from `@living-portfolio/web` and mounted HTML routes (`/home`, `/work`, `/writing`, `/timeline`, `/ask`, `/admin`) directly inside `createApp()`.
2. **Direct Database Coupling:** The web renderer imported `@living-portfolio/db` directly, bypassing the API boundary and executing direct queries and repository mutations from server-side templates.
3. **Impediment to Independent Deployment:** This monolithic architecture prevented independent scaling, static asset offloading to edge CDNs, and containerization of pure API backends. Furthermore, it violated architectural principles defined in the Living Portfolio Open Source Specification (§4.2, §4.3, §7, §8), which require that frontend presentation and backend services interact through well-defined, versioned HTTP APIs.
4. **Audit Findings:** Independent Technical Audit finding `OSR-12` (API Versioning and OpenAPI Generation) and `OSR-13` (Web Decoupling and HTTP Client Enforcement) mandated strict separation before Gate G2 certification.

This Architecture Decision Record (ADR) codifies the decoupled system boundary, the versioned contract mechanism, and the optional convenience adapter for local single-process execution.

---

## 2. Decision Drivers

- **Zero Database Imports in Web Tier:** `apps/web` must not import `@living-portfolio/db` or connect directly to PostgreSQL or internal repository classes.
- **Contract-First Communication:** All data retrieved or manipulated by `apps/web` must flow through the canonical, versioned `/api/v1` HTTP endpoints.
- **Type Safety Without Shared State:** A typed client package (`@living-portfolio/client`) must provide end-to-end TypeScript interfaces generated from Zod validation schemas with zero schema drift.
- **Developer Experience & Local Simplicity:** Maintainers running a single local server must retain the ability to launch a unified process without running multiple background daemons.
- **Automated CI Enforcement:** Architectural boundary rules must be strictly validated on every commit and PR in CI, failing fast if unwanted cross-tier imports occur.

---

## 3. Considered Options

### Option 1: Full Framework Migration (Astro / Next.js)
Migrate `apps/web` immediately to a full-stack framework such as Astro or Next.js.
- *Pros:* Modern component ecosystem and built-in edge deployment adapters.
- *Cons:* Extremely high scope creep during the Gate G2 alpha stabilization phase; would break existing DOM testing harnesses and distract from fundamental reliability and security remediation. Explicitly ruled out for Gate G2 by roadmap invariant (OSR-001 §7.1).

### Option 2: Monolithic Single-Process with Internal Service Boundaries
Keep `apps/web` and `apps/api` in the same HTTP process, but introduce an internal TypeScript service boundary.
- *Pros:* Simple to deploy.
- *Cons:* Does not enforce network decoupling; invites subtle coupling leaks in imports; fails the cloud readiness requirement for separate container deployment in Work Package 8.

### Option 3: Strict HTTP Decoupling via `@living-portfolio/client` with Optional Bundled Adapter (Chosen)
Separate `apps/web` and `apps/api` into distinct network-addressable services:
- `apps/api` exposes pure `/api/v1/*` JSON endpoints governed by OpenAPI 3.1.0 specifications.
- `apps/web` is an autonomous Hono application that interacts with `apps/api` exclusively via `@living-portfolio/client` over HTTP/fetch.
- For local single-process convenience, an adapter (`apps/api/src/adapter/bundled-web.ts`) is provided behind an explicit flag (`ENABLE_BUNDLED_WEB=true` or `bundledWeb: true`).

---

## 4. Decision Outcome

We selected **Option 3**. The architecture is structured as follows:

```
+-----------------------------------------------------------+
|                        apps/web                           |
|  - createWebApp() / server.ts                             |
|  - Strata Design System HTML Templates                    |
|  - Zero Database Imports (Enforced by CI)                 |
+-----------------------------------------------------------+
                            |
                            | HTTP / Fetch (JSON)
                            v
+-----------------------------------------------------------+
|                 @living-portfolio/client                  |
|  - LivingPortfolioClient                                  |
|  - Canonical /api/v1 Base URL                             |
|  - Typed Submodules: entries, ask, structure, inbox...    |
+-----------------------------------------------------------+
                            |
                            | HTTP REST
                            v
+-----------------------------------------------------------+
|                        apps/api                           |
|  - createApp() (Pure API by Default)                      |
|  - Versioned Routes: /api/v1/*                            |
|  - Optional Adapter: src/adapter/bundled-web.ts           |
+-----------------------------------------------------------+
                            |
                            | Direct Storage Access
                            v
+-----------------------------------------------------------+
|                 @living-portfolio/db                      |
|  - PostgreSQL + pgvector / Drizzle ORM                    |
|  - InMemoryPortfolioRepository (Development/Tests)         |
+-----------------------------------------------------------+
```

### Key Architectural Invariants

1. **API Versioning Invariant:**
   All public and administrative API routes are mounted under the canonical prefix `/api/v1` (`/api/v1/health`, `/api/v1/entries`, `/api/v1/ask`, `/api/v1/timeline`, `/api/v1/structure`, `/api/v1/inbox`, `/api/v1/settings`, `/api/v1/book`). Backward-compatible redirects or aliases exist at `/api/*` during migration.

2. **OpenAPI Zero-Drift Specification:**
   The API contract is committed at `docs/spec/openapi.json`. It is generated deterministically from Zod validation schemas (`packages/core/src/openapi/index.ts`). CI gate `scripts/verify-openapi-drift` checks on every commit that the committed spec matches code definitions with zero drift.

3. **Frontend Boundary Invariant:**
   `apps/web` has zero dependencies on `@living-portfolio/db`. All data is consumed via `WebDataClient`, which wraps `LivingPortfolioClient`. An automated verification script (`scripts/verify-dependency-rules`) scans all source files in `apps/web/src/` to guarantee that no database imports exist.

4. **Pure API by Default:**
   Calling `createApp()` with default parameters instantiates a pure JSON API server. Public web routes (`/home`, `/work`, `/timeline`) return HTTP 404, guaranteeing that web presentation cannot accidentally leak into API-only deployments.

5. **Opt-In Bundled Web Adapter:**
   For local single-process execution or monolithic container deployments, `apps/api/src/server.ts` activates `mountBundledWeb()` from `apps/api/src/adapter/bundled-web.ts` only when `ENABLE_BUNDLED_WEB=true`.

---

## 5. Consequences

### Positive Consequences
- **Independent Deployability:** `apps/api` and `apps/web` can now be built into separate container images and hosted independently (e.g. API on Fly.io/Render with PostgreSQL, web on static edge hosting or Node container).
- **Strong Typing Across the Boundary:** Full IDE completion and runtime payload validation through `@living-portfolio/client`.
- **Architectural Conformance:** Closes findings `OSR-12` and `OSR-13` and satisfies Gate G2 decoupling criteria.
- **Test Integrity:** The repository conformance test suite (`web-decoupling.conformance.test.ts`) verifies pure API mode, bundled adapter mode, standalone client HTTP communication, and dependency isolation.

### Negative Consequences / Trade-offs
- **Network Overhead in Standalone Mode:** Web page rendering that requires multiple data elements incurs loopback HTTP requests if not aggregated. Mitigated by aggregate endpoints (e.g. `/api/v1/entries/:slug` returning entry, revision, facets, claims, and relations in a single payload).
- **Dual Server Configuration:** Developers running fully decoupled mode must run both `apps/api` on port 3000 and `apps/web` on port 3001, or run in bundled mode via `ENABLE_BUNDLED_WEB=true`.

---

## 6. Revision History

| Date | Author | Description |
| --- | --- | --- |
| 2026-11-02 | A (Implementer) | Initial architectural decision record for API boundary and web decoupling (WP-7.3 / OSR-23) |
