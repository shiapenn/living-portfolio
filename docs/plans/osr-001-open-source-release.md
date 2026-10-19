# Open-Source Release and Cloud Readiness Plan (OSR-001)

| Field | Value |
|---|---|
| Document ID | OSR-001 |
| Version | 1.0 |
| Date | 19 October 2026 |
| Status | Active |
| Repository path | `docs/plans/osr-001-open-source-release.md` |
| Related | Audit AUD-2026-10-19, DR-AUD-001, Remediation Plan |
| Audience | Maintainer, implementer (A), contributors |

Key words MUST, SHOULD and MAY are used as in RFC 2119.

---

## 1. Summary and project policies

This plan turns the local prototype into a public, self-hostable, Apache-2.0 repository, plus one official hosted instance, governed by pull requests and automated checks.

### 1.1 Project policies

| Area | Policy |
|---|---|
| **License** | Apache-2.0 for code and docs, with `LICENSE` and `THIRD_PARTY_NOTICES` at the root. |
| **Contributions** | Developer Certificate of Origin (DCO). Every commit carries `Signed-off-by`. There is no CLA. |
| **Repository history** | History starts from a single clean initial commit. The previous repository is archived privately and is never published or used as a fork source. |
| **Private phase** | As short as possible: gates G0 and G1 only. The repository becomes public at G1 so enforced rulesets and branch protection are available at no cost. |
| **Branding** | The project name and logo belong to the official hosted service. Forks may use the code freely but MUST remove official branding and state that they are unofficial (see §1.2). |
| **Deployment model** | Single-owner. One deployment serves one person or entity. Multi-tenancy is a non-goal (see §1.3). |
| **Alpha releases** | `v0.1.0-alpha.N` may ship before the Phase 2 correctness fixes, under the alpha conditions in §1.4. |
| **Hosting** | A PaaS with managed Postgres and pgvector, deploying the same OCI images that self-hosters use. Render is the lead candidate; Fly.io is the alternate (see §6.1). |
| **Single artifact principle** | The hosted instance and self-hosters run identical, signed images and identical migrations. The hosted instance differs only in configuration values. |

### 1.2 Trademark and unofficial forks

1. The name and logo are reserved for the official hosted service. They are NOT licensed under Apache-2.0. Apache-2.0 does not grant trademark rights, and `TRADEMARKS.md` states this.
2. Brand assets live in `brand/` with their own license file and are excluded from the Apache-2.0 grant. The code ships with neutral placeholder branding.
3. Site name, logo path, footer text and theme are configuration (`SITE_NAME`, `SITE_LOGO_URL`, and so on), never literals in code.
4. Any fork offering a service to others MUST remove official branding and display this statement in a visible place such as the footer and the About page: *"This is an unofficial fork and is not affiliated with the official project."*
5. The default footer template includes a slot for this statement. The self-host guide explains when it is required.
6. Consider trademark registration and a legal review of `TRADEMARKS.md` before the first alpha release. This document is not legal advice.

### 1.3 Single-owner scope (non-goals)

- No `tenant_id`, per-tenant billing, cross-tenant isolation or shared-database multi-tenancy.
- One deployment equals one owner equals one database.
- The official hosted instance is an instance of this software run for its owner. It is not a platform for third parties.
- Anyone wanting to host for others runs separate instances. This is outside the project's support scope.

### 1.4 Alpha policy

An alpha release is allowed before Phase 2 correctness fixes, provided that:

1. The top of `README.md` carries this prominent warning: **"Alpha version with known defects. Do not use in production or input real sensitive data."** The same text appears in the release notes of every alpha and in the admin UI banner.
2. The official staging environment uses **only synthetic data**. No real personal data is hosted anywhere in the cloud until gate G4 is met (§2.1).
3. The audit register and a `KNOWN_ISSUES.md` file list open P0/P1 findings in plain language.
4. Alpha images are never tagged `latest`.

---

## 2. Release sequencing

### 2.1 Stage gates

| Gate | Name | Exit criteria |
|---|---|---|
| **G0** | Private hygiene | Clean initial commit created (§3.1). Working tree scanned and clean. Hard-code inventory fixed. Credentials rotated. `LICENSE`, `DCO`, `SECURITY.md`, `CODEOWNERS`, `TRADEMARKS.md`, templates present. Pre-commit hooks and CI baseline in place. |
| **G1** | Security baseline and **public flip** | Remediation Phases 1a and 1b done: authentication, structural visibility, XSS and URL safety, hashed rate limits, CORS and CSP, Ask safety. P0 probes pass. Auditor re-verification recorded. README alpha warning in place. Flip-day checklist (§2.3) completed and rulesets verified as enforced. |
| **G2** | First alpha release (`v0.1.0-alpha.1`) | Remediation Phase 1c done: Postgres repository and migrations, Dockerfiles, decoupled web app, real `/healthz`. Fresh-clone quickstart passes in CI. Signed multi-arch images, SBOM and provenance published. |
| **G3** | Cloud staging | Staging deployed from the published image digests, synthetic data only, migration job, health checks and a restore drill passing. |
| **G4** | Cloud production | v0.1 exit criteria (spec §20) met: real backup and restore drill, setup wizard, budget caps tested, rollback tested, alerts firing in a staged failure. Only now may real data be hosted. |
| **G5** | `v0.1.0` | G4 met, all P0 findings fixed, all P1 findings fixed or scheduled with owners. |

### 2.2 Private-phase controls (G0 to G1)

The private phase has no enforced branch protection, because GitHub enforces rulesets on private repositories only with a paid plan. Compensating controls apply until the flip:

| Control | Detail |
|---|---|
| Pull requests by convention | All work happens on branches and merges through a PR. No direct commits to `main`. The maintainer merges only after the CI checks are green. |
| Local hooks | `pre-commit` runs secret scan (gitleaks), formatting and lint. A `commit-msg` hook rejects commits without `Signed-off-by`. Hooks can be bypassed locally, so they are a convenience, not enforcement. |
| CI is authoritative | The same checks, including a `dco` check, run in CI on every PR. The maintainer verifies they are green before merging. |
| Agent identity | The implementer works under a separate bot identity, or a fine-grained token limited to this repository, and pushes only to `agent/*` branches. Residual risk: such a token can technically push to `main` while rulesets are unenforced. Review `git log` before each flip-day step. |
| Secret scanning | GitHub's native secret scanning and push protection are not assumed to be available on a free private repository. Use gitleaks in hooks and CI instead. |
| Actions budget | Monitor free private Actions minutes. Keep the private phase short. |
| Scope | No cloud environment, no published images and no release tags exist during this phase. |

### 2.3 Flip-day checklist (private to public)

Perform in one session, in this order. Freeze merges until step 7 is verified.

1. Confirm `verified_by` entries in `register.yml` for all Phase 1a and 1b findings.
2. Run a final secret scan on the working tree and a search for local paths, usernames and tool-specific state files.
3. Confirm the README alpha warning, `KNOWN_ISSUES.md`, `SECURITY.md` and `TRADEMARKS.md` are present.
4. Keep the ruleset definitions ready as exported JSON in `docs/governance/rulesets/`.
5. Change repository visibility to public.
6. Apply the rulesets (§5.2) immediately.
7. **Verify enforcement:** a direct push to `main` is rejected; a PR without the required checks cannot merge; a test fork PR runs without secrets.
8. Enable secret scanning and push protection, private vulnerability reporting, Dependabot alerts and updates.
9. Set default workflow permissions to read-only, restrict allowed actions to reviewed ones, and require approval for workflow runs from outside collaborators.
10. Record the flip in `docs/governance/CHANGELOG.md`. Do not publish releases or images until G2.

### 2.4 Readiness signals for moving to the cloud

Before **G3** (staging):

1. Persistence is real (Postgres and migrations); nothing depends on process memory.
2. The app boots from environment variables alone, with fail-fast validation.
3. Images build reproducibly, run as non-root and have health checks.
4. `/healthz` checks the database, queue, disk and last backup.
5. Authentication is on by default and the first-run setup flow works.
6. CI runs real-component tests (Postgres, local embeddings), not only mocks.

Before **G4** (production, real data):

7. A real encrypted backup restores into a scratch instance.
8. Provider budget caps and per-visitor limits are set and tested.
9. Logs, metrics and alerts exist for failed jobs, backup age, error rate and spend.
10. A rollback path is tested and an incident contact is documented.

---

## 3. Repository preparation

### 3.1 Clean initial commit procedure

1. Freeze the current repository. Archive it as a private, offline, encrypted backup. It is never made public and never used as a fork source.
2. Create a **new empty directory**. Export the working tree into it without any `.git` directory, and exclude `node_modules`, build output, `.env*` files, IDE settings, agent or assistant state, session logs and local scratch files. Do not run `git init` inside the old directory, to avoid carrying over reflogs or stale refs.
3. Scan the exported tree: gitleaks in no-git mode, trufflehog in filesystem mode, plus a search for absolute local paths, usernames, personal emails and internal hostnames. Fix every hit. Execution reports and CLI transcripts are a common source.
4. Run `git init`, set the default branch to `main`, and make the first commit with a sign-off (`git commit -s`).
5. Tag it `baseline-B0`. Record the date in `docs/audits/README.md`: repository history begins at B0.
6. Create the new remote, push, and remove any reference to the old remote.
7. **Rotate every credential** that ever existed in the old repository, local `.env` files or assistant artifacts. The archive still contains them, so rotation is required even if scans are clean.
8. Carry `docs/audits/` over verbatim. The SHA-256 of the closed audit report stays valid. Update `register.yml` entries that cite old commit hashes so they cite file paths and B0 instead.

### 3.2 Hard-code inventory

A repeatable script scans for and the team fixes:

- hostnames, URLs, ports and `localhost`
- personal names, emails and absolute paths
- provider names, model ids and versions
- keys, tokens, passwords and connection strings
- demo owner identity and demo data
- tool- or IDE-specific files and agent configuration

The script runs in CI and fails on any new hit outside an explicit allowlist with a stated reason.

### 3.3 Configuration contract

1. `packages/config` defines every setting in a Zod schema with type, default, a `secret` flag and a `public` flag.
2. The app validates configuration at boot and exits with a clear message listing missing or invalid values.
3. Precedence: built-in defaults, then an optional YAML config file, then environment variables.
4. Setting classes:
   - **Deploy config** (URLs, ports, database URL, provider selection, branding, deployment class): environment.
   - **Secrets** (API keys, session secret, encryption keys): environment or `*_FILE` mounted files, never tracked by git.
   - **Owner preferences** (facets, thresholds, profile): stored in the database and edited in the admin UI.
5. Browser-safe variables use the `PUBLIC_` prefix. A build check fails if any secret name appears in client output.
6. `.env.example` is generated from the schema. CI fails if it is stale. Compose uses required-variable syntax (`${VAR:?message}`).
7. The demo seed lives in `examples/` and runs only by explicit command or `SEED_DEMO=true`. Owner name and site identity come from configuration.
8. `DEPLOYMENT_CLASS` takes `production`, `staging` or `development` and drives the safeguards in §6.4.

---

## 4. Architecture: frontend and backend decoupling

1. **Versioned contract.** The API is served under `/api/v1`. An OpenAPI document is generated from the Zod schemas, committed, and used to generate a typed client. CI fails on drift.
2. **Separate deployables.** `apps/api`, `apps/worker`, `apps/web` (public site) and the admin UI are independent packages. `apps/web` talks to the API over HTTP using the generated client. It MUST NOT import repository or database code. A dependency-rule check in CI enforces this.
3. **No coupling inside the API.** The API does not mount or import the web renderer. A single-process convenience mode MAY exist as an optional adapter behind a flag, never as the default.
4. **Static-first public site.** The site builds to static files deployable to any static host or CDN. Only Ask and time-travel call the API at runtime.
5. **Configurable origins.** The site reads `PUBLIC_API_BASE_URL`. The API reads `SITE_ORIGIN` and `ADMIN_ORIGIN` for a strict CORS allowlist. Admin cookies are `HttpOnly`, `Secure` and `SameSite`, with CSRF protection when origins differ.
6. **Ports and adapters.** Interfaces exist for repository, queue, object storage, model provider, notifier, backup destination and static publisher. Core code sees only interfaces. Provider-specific code lives in adapters and in `deploy/<target>/`.
7. **Contract tests.** One repository conformance suite runs against both the in-memory and Postgres implementations.

---

## 5. Governance, testing and CI/CD

### 5.1 Contribution rules

- **DCO.** A `DCO` file (Developer Certificate of Origin 1.1) sits at the repository root. `CONTRIBUTING.md` explains `git commit -s`. A required CI check named `dco` verifies every commit in a PR. Where GitHub offers it, also enable the setting requiring sign-off on web-based commits.
- **Sign-off meaning.** The `Signed-off-by` line is made by the human who takes responsibility for the change. Agent-authored commits MUST be signed off by the responsible human maintainer.
- **PR template.** Fields: purpose, linked finding or task IDs, tests added, security-sensitive paths touched, DCO confirmed.
- **CODEOWNERS.** Security-sensitive paths (authentication, visibility, governor, migrations, workflows, deploy files) are listed.

### 5.2 Rulesets after the public flip

Apply to `main` and `release/*`, with **no bypass actors**.

| Rule | Setting |
|---|---|
| Pull request required | Yes, for everyone, including maintainers and agents |
| Approvals | See the maintainer-mode table below |
| Dismiss stale approvals | Yes |
| Required status checks | `typecheck`, `lint`, `unit`, `contract`, `integration`, `security-regression`, `migration`, `build-images`, `secret-scan`, `dependency-review`, `audit-check`, `dco` |
| Branch must be up to date | Yes |
| Conversation resolution | Required |
| Force push and deletion | Blocked |
| Linear history | Yes |
| Tag creation for `v*` | Restricted to the release workflow identity |

**Maintainer modes.** GitHub does not let an author approve their own PR. With a single maintainer and no bypass, a required approval would block the maintainer from merging their own work. The rules therefore depend on how many maintainers exist:

| Mode | Approvals required | Notes |
|---|---|---|
| **Solo maintainer (current)** | 0 | A PR is still mandatory, and every check must pass. The maintainer reviews and merges. Changes to CODEOWNERS paths need the `security-review` label and the PR checklist completed. External contributors cannot merge, so their PRs always pass through the maintainer. |
| **Two or more maintainers** | 1, and code-owner review required for sensitive paths | Switch on as soon as a second trusted reviewer exists. |

The implementer works under a separate identity, so the maintainer's review of agent PRs is a real second-party review.

### 5.3 Testing layers

| Layer | Purpose | Tools | Runs |
|---|---|---|---|
| Static | Types, lint, format, licenses | `tsc`, ESLint, Prettier, license check | Every PR |
| Unit | Pure algorithms (gate, temporal, chunking, calibration) | Vitest, `fast-check` | Every PR |
| Contract | One suite across all repository, queue and provider adapters | Shared Vitest suite | Every PR |
| Integration | API against real Postgres with pgvector, real migrations, real local embeddings | Service containers or Testcontainers | Every PR |
| Security regression | Audit probes and future findings; route-by-role authorization matrix | Vitest | Every PR |
| Migration | Empty to latest; previous release to latest | Scripted | PRs touching schema |
| E2E | Fresh clone, compose up, setup wizard, publish, Ask | Playwright against the compose stack | Smoke on every PR, full nightly |
| Accessibility and performance | WCAG and page-weight budgets | axe, Lighthouse CI | Budget on PR, full nightly |
| Privacy | Outbound-call interception proves private and sensitive data never leaves | Network interceptor | Every PR |
| Evaluation | Retrieval and routing quality (spec §18.2) | Versioned dataset and runner | Nightly and release |
| Chaos and soak | Provider outage, database down, rate-limit storms | Scheduled workflow | Nightly or weekly |

Rules:

- Every per-PR test runs **without secrets**: mock providers for generation, real local components for storage and embeddings.
- Tests needing live provider keys run only on maintainer branches or `main`, with environment-scoped secrets.
- Mock-only tests do not count as evidence for a safety invariant. Each invariant needs at least one test against the real component.
- Expected-failure probes are bound to finding IDs. The build fails if one unexpectedly passes without its register entry being updated.

### 5.4 CI/CD without exposing secrets to forks

1. PR validation uses the `pull_request` event. For fork PRs GitHub supplies a read-only token and no secrets.
2. Never use `pull_request_target` to check out or run PR code. For privileged follow-ups (labels, comments) use a separate `workflow_run` job that treats uploaded artifacts as untrusted.
3. Default workflow permissions are read-only. Write permission is granted per job.
4. Require approval to run workflows from first-time or outside contributors.
5. Pin third-party actions to full commit SHAs and update them via Dependabot or Renovate.
6. Never run self-hosted runners on the public repository. Use job timeouts and concurrency cancellation.
7. Do not expose secrets to steps that execute PR code.

| Workflow | Trigger | Secrets | Jobs |
|---|---|---|---|
| `ci.yml` | `pull_request`, push to `main` | None | typecheck, lint, unit, contract, integration, security regression, migration, build images (no push), hadolint, container scan, SBOM, license check, `audit-check`, `dco` |
| `secrets.yml` | `pull_request`, push | None | gitleaks on the diff; full-tree scan on `main` and nightly |
| `codeql.yml` | `pull_request`, schedule | None | CodeQL for JavaScript and TypeScript |
| `deps.yml` | `pull_request` | None | dependency review, OSV scan |
| `e2e.yml` | `pull_request`, nightly | None | compose stack, Playwright, axe, Lighthouse |
| `nightly.yml` | schedule | Maintainer environment only | evaluation, chaos and soak, live-provider tests |
| `release.yml` | tag `v*` from `main` | Environment-scoped | multi-arch build, push to GHCR, sign (cosign), SBOM, provenance, release notes |
| `deploy-staging.yml` | merge to `main` | Environment-scoped | run migrations, deploy by image digest, smoke test |
| `deploy-prod.yml` | manual promotion of a signed release | Environment-scoped, required reviewer | migrate, deploy, health gate, auto-rollback |

Environment protection rules with required reviewers are free on public repositories.

---

## 6. Cloud and self-hosting portability

### 6.1 Hosting provider

**Selection criteria**

1. Managed Postgres with pgvector.
2. Deploys a prebuilt OCI image by digest, so the hosted instance runs the same artifact as self-hosters.
3. No long-lived cloud credential in the repository or in repository-wide Actions secrets. Preferred: the platform's GitHub integration, or OIDC if offered. Otherwise a deploy-only, environment-scoped, rotatable token kept only in a protected GitHub Environment.
4. Private networking between api, worker and database, scheduled jobs, and a persistent disk or object storage option.
5. Declarative config checked into `deploy/<provider>/`.

**Findings from provider documentation (checked 19 October 2026; re-verify in the spike below)**

| Provider | pgvector | Deploy credentials |
|---|---|---|
| Render | Supported; enable with `CREATE EXTENSION vector;` | Deploys through its GitHub app without storing a credential in the repo, or through an API key or deploy hook from your own CI |
| Fly.io | Stock `postgres-flex` image does not include it; needs a custom image, and availability on managed Postgres is not confirmed | Deploy token (`FLY_API_TOKEN`) in CI; a request for GitHub OIDC support had no confirmed answer |

**Decision.** Render is the lead candidate. Fly.io is the alternate. A short spike (OSR-17) confirms the following before the choice is final: prebuilt image deployment by digest, the credential model, pgvector on the target Postgres version, and the ability to run `pg_dump` for backups.

### 6.2 Reference deployments

| Target | Location | Contents |
|---|---|---|
| Docker Compose (self-host default) | `deploy/compose/` | `api`, `worker`, Postgres with pgvector, static web server, backup job, optional tunnel. Pinned tags, health checks, named volumes, required-variable checks. |
| Hosted instance | `deploy/render/` (or `deploy/fly/`) | Blueprint or equivalent: static site, api service, background worker, Postgres, scheduled backup job, environment groups. |
| Kubernetes (optional) | `deploy/helm/` | Chart reusing the same images and config schema. Deferred until requested. |

Provider-specific files live only under `deploy/`. Core packages never reference a provider.

### 6.3 End-to-end steps

1. Complete G0 and G1, including the public flip.
2. Build multi-stage, non-root Dockerfiles with health checks. On release, publish signed multi-arch images with SBOM and provenance to GHCR.
3. Ship migrations as a one-shot job that runs before the new version starts.
4. Provide the compose stack and a **quickstart test in CI**: fresh clone, `docker compose up`, setup wizard, one publish, one Ask.
5. Cut `v0.1.0-alpha.1` (G2).
6. Run the provider spike and record the result as an ADR.
7. Write the provider config under `deploy/<provider>/`, parameterized for region, size and domain.
8. Create **staging** (auto-deploy from `main`, synthetic data) and **production** (manual promotion of a signed release) as separate environments with separate secrets and databases.
9. Store secrets in the platform's secret store or protected GitHub Environments. Deploy by image digest.
10. Keep application authentication and TOTP as the baseline for the admin interface. Add an identity-aware proxy in front of the admin hostname where the platform and DNS allow.
11. Configure real backups (`pg_dump` plus `age`) to S3-compatible storage in a separate account or region, a scheduled restore into a scratch instance, and an alert when the last good backup is too old.
12. Set provider budget caps and per-visitor limits. Add structured logs, metrics and alerts.
13. Document rollback: redeploy the previous image digest. Migrations stay backward-compatible for one release.
14. Migrate real data only after G4.

### 6.4 Staging safeguards (synthetic data only)

Until G4, the official environment is staging and holds only synthetic data. Enforce this technically, not just by policy:

1. `DEPLOYMENT_CLASS=staging` shows a persistent banner: *"Staging: synthetic data only."*
2. Import and connector features are disabled, and `robots` rules prevent indexing.
3. Data comes from `examples/` seeds only. The environment is reset and reseeded on a schedule.
4. The staging database credentials, provider keys and backup storage are distinct from production.
5. Production configuration refuses to start unless the G4 sign-off record exists in `docs/releases/g4-signoff.md`.

---

## 7. Task register

IDs use the prefix `OSR-` and are tracked in `docs/audits/register.yml` like findings. Closing a task needs a named test or CI check (AUD-14).

| ID | Task | Acceptance criterion | Gate |
|---|---|---|---|
| OSR-01 | Hard-code inventory script, report and fixes | Zero unlisted hits in CI | G0 |
| OSR-02 | `packages/config` with Zod schema, fail-fast boot, `*_FILE` secrets, `PUBLIC_` rule | Boots from environment alone; clear error on missing values; test proves no secret reaches the web bundle | G0 |
| OSR-03 | Generate `.env.example` from schema; CI drift check | CI fails when stale | G0 |
| OSR-04 | Move demo seed to `examples/`; remove default seeding and hard-coded owner identity | Production start serves no demo data | G0 |
| OSR-05 | Clean initial commit procedure (§3.1), working-tree scans, credential rotation checklist | Written report; scans clean; baseline `baseline-B0` tagged; rotation confirmed | G0 |
| OSR-06 | Add `LICENSE`, `DCO`, `SECURITY.md`, `CODEOWNERS`, `TRADEMARKS.md`, `KNOWN_ISSUES.md`, issue and PR templates | Files present; templates reference finding IDs and DCO | G0 |
| OSR-07 | Pre-commit hooks (gitleaks, lint, `commit-msg` sign-off check) and CI baseline (typecheck, lint, unit, `audit-check`, `dco`, secret scan, CodeQL, dependency review), actions pinned by SHA | All green on a test PR; a commit without sign-off fails `dco` | G0 |
| OSR-08 | Private-phase controls: agent identity, `agent/*` branch convention, merge checklist | Documented in `CONTRIBUTING.md`; no direct commit to `main` in `git log` | G0 |
| OSR-09 | Branding as configuration; segregate `brand/` assets; unofficial-fork footer slot; self-host guide section | No brand literals in code; footer slot renders when configured | G1 |
| OSR-10 | Flip-day checklist and rulesets as code in `docs/governance/rulesets/` | Direct push to `main` rejected; fork PR has no secrets (tested) | G1 |
| OSR-11 | README alpha warning, admin UI banner, release-notes template | Warning text present in all three | G1 |
| OSR-12 | Versioned API (`/api/v1`), committed OpenAPI, generated client | Web uses the client; CI fails on drift | G2 |
| OSR-13 | Decouple web from API; remove web mounting from `createApp()`; optional bundled mode behind a flag | Dependency-rule check passes; web runs against a remote API URL | G2 |
| OSR-14 | Repository conformance suite over in-memory and Postgres | Same suite passes on both | G2 |
| OSR-15 | Integration and E2E lanes with Postgres service container and local embeddings | Required checks; no secrets needed | G2 |
| OSR-16 | Dockerfiles, compose stack, quickstart test in CI; release workflow with multi-arch images, SBOM, provenance, signing | Fresh-clone quickstart passes; tagged build produces signed images (closes F2) | G2 |
| OSR-17 | Hosting provider spike and ADR (image by digest, credential model, pgvector, `pg_dump`) | ADR committed with evidence | G3 |
| OSR-18 | Provider config in `deploy/<provider>/`, staging deploy workflow, scoped deploy credential | Staging deploys from `main` by image digest | G3 |
| OSR-19 | Staging safeguards (§6.4) and `DEPLOYMENT_CLASS` handling | Banner shown; import disabled; production refuses to start without sign-off record | G3 |
| OSR-20 | Real backups and restore drill, backup-age alert (replaces the 501 endpoints) | Nightly scratch restore passes in CI | G4 |
| OSR-21 | Observability, budget caps and alerts | Alerts fire in a staged failure test | G4 |
| OSR-22 | Production deploy workflow with required reviewer, health gate, auto-rollback | Rollback proven in staging | G4 |
| OSR-23 | Docs: self-host guide, config reference, upgrade guide, contributor guide, ADRs (API boundary, config contract, hosting adapters, provider choice) | Present and linked from README | G2 and G4 |

Housekeeping: record each `OSR-` task in `register.yml`; keep this plan under change control in `docs/plans/`; keep reports, plans and review letters in the repository, not only in chat or assistant artifacts.

---

## 8. Risks

| Risk | Mitigation |
|---|---|
| Public flip before P0 fixes | G1 requires Phase 1a and 1b and auditor re-verification before the flip |
| Secrets or local paths in the clean tree | Tree scans (OSR-05, OSR-07), pre-commit hooks, rotation of all credentials |
| Unenforced rules during the private phase | Short phase, PR convention, CI as authority, agent identity and `agent/*` branches |
| Solo maintainer cannot self-approve under strict rules | Solo-maintainer mode (0 approvals, PR and checks mandatory); move to 1 approval with a second reviewer |
| Fork CI leaks secrets | `pull_request` only, no secrets in PR workflows, pinned actions, approval for outside contributors |
| Hosted instance drifts from self-hosted behavior | Same image digests and config schema; differences only in `deploy/` and values |
| Provider lacks a needed capability | Spike OSR-17 before commitment; alternate provider documented; adapters keep core portable |
| Real data reaches staging | Technical safeguards in §6.4, separate credentials, production start guard |
| Branding confusion from forks | `TRADEMARKS.md`, config-driven branding, mandatory unofficial-fork statement |
| Tests pass on mocks while real behavior fails | Real-component lanes (OSR-15), contract suite (OSR-14) |
| Loss of git history and blame | Accepted; audit documents carry the provenance and B0 is recorded |
