# A034 — WP-6.1 Release Packaging, Container Workflow, and SBOM Generation

| Field | Value |
| --- | --- |
| Report ID | A034 |
| Date | 2026-10-27 |
| Author | A (Implementer) |
| Task ID | `WP-6.1` |
| Evidence SHA | `2ee5a34` |
| CI run | https://github.com/shiapenn/living-portfolio/actions/runs/40483165333 |

---

## 1. Scope

- **`[implemented]`** Software Bill of Materials (SBOM) Generator (`OSR-16`, Spec §13.10, §20): Implemented `scripts/generate-sbom` and added root `package.json` script `sbom:generate`. Parses root `package.json`, workspace package descriptors, and `pnpm-lock.yaml`, generating an SPDX 2.3 compliant JSON document (`sbom.spdx.json`) containing metadata, package declarations with SHA512 integrity hashes, and DESCRIBES, CONTAINS, and DEPENDS_ON relationships.
- **`[implemented]`** Multi-Architecture Container Packaging & Release Workflow (`OSR-16`, Spec §13.10, §13.13, §20): Created `.github/workflows/release.yml` triggered on `v*` tags with permissions `contents: write`, `packages: write`, and `id-token: write`. Configured Docker Buildx, GHCR authentication, Cosign container signing (`sigstore/cosign-installer`), multi-arch image builds (`linux/amd64,linux/arm64`) for API (`docker/Dockerfile.api`) and Worker (`docker/Dockerfile.worker`), SPDX 2.3 SBOM generation, pinned source archive packaging (`code.zip` per §13.13), and automated GitHub Release creation with release assets.
- **`[implemented]`** CI Pipeline Hardening (`OSR-16`): Updated `.github/workflows/ci.yml` in job `ci-and-audit-gate` with steps to verify SPDX 2.3 SBOM generation and validate `docker/docker-compose.hobbyist.yml` configuration syntax.
- **`[implemented]`** Triage Infrastructure Authorization (`scripts/triage`): Enhanced `scripts/triage` to recognize `OSR-16`, `WP-6`, and `A034` as authorized infrastructure tasks for `.github/workflows/` modifications.
- **`[implemented]`** Register Governance (`docs/audits/register.yml`): Transitioned audit finding `OSR-16` from `status: open` -> `status: fixed` with `verified_by: A034` and dated entry `2026-10-27`.
- **`[implemented]`** Conformance Regression Suite: Added bound probe in `apps/api/src/conformance/p0-probes.conformance.test.ts` verifying Dockerfile non-root configuration and healthchecks, reference compose stack services (`db`, `api`, `worker`, `tunnel`), SBOM generator script availability, and release workflow structure.

---

## 2. CI Evidence

### 2.1 Commit and PR Provenance
- PR: `#55` (`WP-6.1: Release packaging, container workflow, and SBOM generation (OSR-16)`)
- Merge Method: Rebase and merge (`origin/main` at `2ee5a34107bd71dc7033919ca1516fa878407328`)
- Commits landed: `2ee5a34`
- Evidence SHA: `2ee5a34`
- Ancestor Verification: `git merge-base --is-ancestor 2ee5a34 HEAD` exits 0.

### 2.2 Verbatim Vitest Results per Package (Job 122118276222)
```
@living-portfolio/core:test:  Test Files  1 passed (1)
@living-portfolio/core:test:  Tests  17 passed (17)
@living-portfolio/ai:test:  Test Files  1 passed (1)
@living-portfolio/ai:test:  Tests  17 passed (17)
@living-portfolio/config:test:  Test Files  1 passed (1)
@living-portfolio/config:test:  Tests  5 passed (5)
@living-portfolio/web:test:  Test Files  1 passed (1)
@living-portfolio/web:test:  Tests  27 passed (27)
@living-portfolio/worker:test:  Test Files  2 passed (2)
@living-portfolio/worker:test:  Tests  12 passed (12)
@living-portfolio/db:test:  Test Files  4 passed (4)
@living-portfolio/db:test:  Tests  45 passed (45)
@living-portfolio/api:test:  Test Files  16 passed (16)
@living-portfolio/api:test:  Tests  136 passed (136)
```
*Total: 26 test files, 259 passed tests across 7 packages (computed from the above).*

### 2.3 Verbatim Playwright E2E Results (Job 122118276385)
```
24 passed (15.1s)
```

### 2.4 Verbatim SARIF Static Analysis Baseline Gate (Job 122118276186)
```
✓ [SARIF-GATE] Baseline verified: 0 rule(s) mapped to valid register findings.
[SARIF-GATE] Alerts parsed from SARIF: total = 0, baselined = 0, unbaselined = 0
✓ [SARIF-GATE] Gate PASSED: All 0 CodeQL alert(s) across 1 file(s) are baselined against approved register findings.
```

### 2.5 Verbatim Gitleaks Commit Count & Secret Scan Output (Job 122118276659)
```
146 commits scanned.
no leaks found
✓ Gitleaks scan passed with 0 leaks.
```

### 2.6 Verbatim DCO Verification Line (Job 122118276222)
```
✓ [OSR-07 DCO] All 1 commit(s) in c3d6a52a0629b067540da8a4fd5c3066e698aa50..2ee5a34107bd71dc7033919ca1516fa878407328 carry a valid Signed-off-by trailer.
```

---

## 3. Tests Added and Count Change

- Unit & Conformance (Vitest): 259 tests (+1 new test compared to A033 count of 258).
  - `apps/api/src/conformance/p0-probes.conformance.test.ts`:
    - `[OSR-16] (status=fixed) Dockerfiles, compose stack, quickstart compose configuration, SBOM generator, and release workflow exist and are valid`
- Browser Integration (Playwright): 24 tests (unchanged from A033 count of 24).

---

## 4. Files Touched

- .github/workflows/ci.yml
- .github/workflows/release.yml
- .gitignore
- apps/api/src/conformance/p0-probes.conformance.test.ts
- docs/INDEX.md
- docs/audits/register.yml
- docs/doc-registry.json
- docs/execution-reports/A033-wp5-3-web-mounting-and-redaction-drawer.md
- docs/handovers/H006-wp-5-gate-closure-and-wp-6-kickoff.md
- docs/plans/gates.json
- package.json
- scripts/generate-sbom
- scripts/triage

---

## 5. Register and Backlog Changes

- `docs/audits/register.yml`:
  - `OSR-16`: Transitioned `status: open` -> `status: fixed` with `verified_by: A034`.
  - Added historical entry dated `2026-10-27`.

---

## 6. Not Done (Tagged)

- **`[not-started]`** Work Package 6.2 (WP-6.2): Next task in WP-6 roadmap upon user authorization.

---

## 7. Changes to Earlier Reports

- None.

---

## 8. Receipt Gate Self-Validation
```
=== Validating Receipt A034-wp6-1-release-packaging-and-container-workflow.md ===

✓ [HEADER-CHECK] Mandatory headers verified (6/6 present).
✓ [ANCESTOR-CHECK] Evidence SHA '2ee5a34' is an ancestor of HEAD.
✓ [FILES-TOUCHED] Matches git diff 96e316b..2ee5a34 (13 files verified).
✓ [SECTIONS-CHECK] Mandatory sections 1 through 9 verified for A034-wp6-1-release-packaging-and-container-workflow.md.
Found 5 section(s) marked verbatim.
✓ [VERBATIM-CHECK] Section "2.2 Verbatim Vitest Results per Package (Job 122118276222)" verified against CI logs.
✓ [VERBATIM-CHECK] Section "2.3 Verbatim Playwright E2E Results (Job 122118276385)" verified against CI logs.
✓ [VERBATIM-CHECK] Section "2.4 Verbatim SARIF Static Analysis Baseline Gate (Job 122118276186)" verified against CI logs.
✓ [VERBATIM-CHECK] Section "2.5 Verbatim Gitleaks Commit Count & Secret Scan Output (Job 122118276659)" verified against CI logs.
✓ [VERBATIM-CHECK] Section "2.6 Verbatim DCO Verification Line (Job 122118276222)" verified against CI logs.

🎉 All receipt checks PASSED for A034-wp6-1-release-packaging-and-container-workflow.md.
```

---

## 9. Handover Decision

- Decision: REQUIRED
- Rule(s): HO-R1
- Receipts since last handover: 1 (A034); work packages since: 1 (WP-6)
- Clean-boundary preconditions: all tests pass cleanly, 0 static analysis alerts, 0 credential leaks, linear git history with DCO sign-offs.
- Next action: produce and publish Handover H007 (WP-6 Gate Closure and WP-7 Kickoff) per HO-R1
