# Living Portfolio: Independent Technical Audit

*Audit of `living-portfolio-main.zip` against `The_Living_Portfolio_Open_Source_Spec.md`, and of execution report A001. Audit date: 19 October 2026.*

## 1. Role, scope and method

**Role.** Independent technical auditor. I am separate from "A", the author of A001. I treat A001's statements as claims to verify, not as evidence.

**Tasks performed.**

1. Read the full spec (§0–§21).
2. Installed, built and tested the monorepo (pnpm 12.14.0, Node 22).
3. Read the source of every package and route that carries a spec invariant.
4. Probed the running API in-process with 20+ targeted requests (auth, visibility, rate limits, gate, time-travel).
5. Mapped each spec section to an implementation status.
6. Produced this report and a prioritized fix list.

**Not verified (environment limits).** I could not run Postgres or Docker, a browser, axe or Lighthouse tests, or live provider calls. I did not round-trip the portable export. I read the files listed below in full or in the relevant parts. I skimmed `structure.ts`, `timeline.ts`, `styles.ts`, `chunking.ts` and `gapQuestions.ts` for the claims I cite.

**Status legend used in the matrix.** *Implemented* means it meets the spec text. *Partial* means it works but has defects or gaps. *Stub* means it is a placeholder or simulated. *Missing* means no code was found. *Misleading* means the code reports something that is not true.

---

## 2. Executive verdict

**What this package is.** A well-structured, strictly typed **reference prototype of the algorithmic kernel**. It runs entirely on an in-memory repository with a mock model provider.

**What it is not.** It is not the "completed implementation" A001 describes, and it does not meet the spec's **v0.1 Self-hostable core** exit criteria (§20). The build and tests pass, but the tests exercise the mocks, not the spec's invariants.

**Headline findings.**

1. **There is no authentication anywhere.** In my probes, an anonymous caller could read a private NDA entry by slug, list private entries with `?visibility=all`, and flip it to `public`. The entry then appeared in `/api/ask` citations. The same caller could delete entries, read the visitor inbox, disable automated answering, set the Tier 1 floor to 0.1, and re-run the demo seed. This breaks §3.11, §15 and the "honesty" invariant.
2. **Several endpoints and jobs return fabricated results.** `/api/settings/evaluation` returns hard-coded precision/recall and "48 documents, 140 labeled queries" that do not exist. The backup restore drill returns `passed` with hard-coded `embeddingsPresent: true` and `mediaChecksumsMatch: true`. The worker's backup job has the same hard-coded values and performs no encryption. This directly contradicts spec §0 principle 2 ("never lets unconfirmed machine output pose as the owner's judgment") and §18.2.
3. **The Ask safety logic is bypassed by construction.** The API hard-codes `hasEvidence: true, hasVerifiedEvidence: true, outcomeStatus: 'worked', hasScope: true` for every match before routing. The gate ignores unknown values on the entry side. The applicability check receives an empty scope list. An anachronism is detected, but the draft is delivered anyway.
4. **Nothing is persisted and nothing is deployable.** `server.ts` always seeds a fictional "Alex Rivera" demo portfolio into memory on boot. The Drizzle schema is never executed. `pg-boss` and ONNX are never imported. `docker-compose` references two Dockerfiles that do not exist. The `apps/web` renderer is never mounted by any server.

**Credibility of A001.** Its claims on build/test status, core algorithm existence and seed data are **accurate**. Its claims about embeddings, encrypted backups with restore drills, the evaluation harness, the budget governor's owner reserve, and "verification" are **overstated or false**. See §3.

---

## 3. Verification of A001's claims

| A001 claim | Verdict | Evidence |
| --- | --- | --- |
| All builds and test suites pass | **True** | `pnpm build`: 6/6 tasks. `vitest`: 37/37 (core 17, ai 4, db 2, api 5, worker 4, web 5). |
| Types, Zod schemas, six role profiles | **True** (with a deviation) | Profiles are TypeScript objects. The spec (§3.4, §14) requires YAML validated by JSON Schema. The `yaml` dependency is unused. |
| Structure-aware chunking and text-quote re-anchoring | **True, minor gap** | Selectors and offsets exist. No "small overlap" between chunks (§10.1). |
| Value-of-information gap questions | **True** | `gapQuestions.ts`, tested. |
| Bitemporal validity and `is_hindsight` leakage prevention | **Partial** | The hindsight branch in `temporal.ts` is dead code. It is unreachable because a prior `written_at > t_q` check returns first. The spec's `NOT (is_hindsight AND valid_from < t_q)` rule has no independent effect. Separately, `createEntry` sets `written_at = valid_from` for non-hindsight entries, which falsifies transaction time. |
| Hard-constraint Gate and Tier 1–3 routing | **Partial, defective** | See §5 items G1–G4. |
| Later-thinking staleness detection | **Partial** | No scope-overlap test (§10.7). The banner fires for any accepted supersedes/contradicts relation. |
| Bounded self-calibration with exact rollback | **Overstated** | One of four mechanisms. `/calibration/apply` accepts arbitrary values with no guard. "Rollback" appends a swapped record and restores nothing. |
| Extension and theme SDK, notification, backup and payment interfaces | **Interfaces only** | No concrete connector, notifier, backup or payment adapter exists. Theme conformance checks slots and tokens only. `supportsNoJs` is a self-declared boolean, and there is no contrast test. |
| Data-use policy router and budget governor reserving capacity for owner-interactive work | **Partial / false in part** | Policy router exists and is tested. There is **no owner reserve**: `owner_interactive` is never checked against any limit. |
| Pre-delivery faithfulness, scope and anachronism checks | **Overstated** | Faithfulness only checks that spans exist. No entailment. Applicability receives `citedScopes: []`. Anachronism is a four-digit-year regex, and a hit does not change the delivered text. |
| Drizzle PostgreSQL + pgvector schemas, RRF hybrid search, pre-retrieval visibility filter, recursive temporal expansion, cascading delete | **Mostly overstated** | The schema file compiles but is never run. Search is keyword-only: `embedding` is ignored, and RRF ranks a single list. Expansion is an in-memory loop, not a recursive CTE. |
| Hono routes incl. kill-switch, <0.82 warning, **encrypted backup restore drill**, export, **§18.2 evaluation harness** | **Mixed** | Kill-switch and warning exist but are unauthenticated. Drill and evaluation harness are **fabricated** (see §2). |
| Worker: 384-d local ONNX embeddings | **False** | `MockModelProvider.embed` hashes characters into a vector. Vectors are not stored. The model id `local-onnx/bge-small-en-v1.5` is a hard-coded string. |
| Worker: age-encrypted backup and scratch restore verification | **False** | Returns constants. No `pg_dump`, no `age`, no restore. |
| Worker: 10-minute debounce and daily build cap | **Partial** | Counters work in one process. `buildsToday` is never reset, so after 12 builds the site never builds again until restart. No static site is actually built (`pagesCount` is `public + 10`). |
| Strata site: static-first, no-JS readable HTML; 3-pane admin | **Partial** | The renderer is a set of string-returning functions. No server, Astro build or router calls them. The admin pane is a `<textarea>` with no auth. |
| README quickstart: `docker compose up -d` | **Fails** | `docker/Dockerfile.api` and `docker/Dockerfile.worker` are missing. |

---

## 4. Specification-conformance matrix

| § | Section | Status | Evidence and gaps |
| --- | --- | --- | --- |
| 0–1 | Summary and principles | **Partial** | "Owner can always stop it" exists, but the switch is public. "Honesty is the invariant" is violated by fabricated outputs. "Degrade, don't fail" is only partly implemented (§10.8). |
| 2 | Licensing and governance | **Missing** | No `LICENSE`, `GOVERNANCE.md`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md`, issue templates or `THIRD_PARTY_NOTICES`. |
| 3.1–3.3 | Kernel objects, structure levels | **Implemented** | Types, Zod schemas, L0–L3 computation, tested. |
| 3.4 | Role profiles | **Partial** | Six profiles present. Not YAML, no JSON Schema validation. |
| 3.5–3.8 | Annotations, claims, facets, evidence | **Partial** | Entities and status lifecycles exist. Relation creation does not require `scope` for `supersedes`, as the spec requires. `PUT`/`POST` routes let the client set `status: accepted` directly. |
| 3.9 | Time | **Partial** | See §3: dead hindsight branch, fabricated `written_at`. The "Are you writing about something earlier?" prompt is not present in any flow. |
| 3.10 | Ventures | **Partial** | Entity, seed and Build page exist. Venture page with live embed and dev-log feed not verified. |
| 3.11 | Visibility and revisions | **Non-conformant** | Search filters visibility, but the API exposes private entries (see S1, S2). `unlisted` and the `chat_uses_unlisted` setting are not handled. No guard against mutating visibility without review. |
| 4 | Authoring and input | **Stub** | Regex redaction scan only (secrets, email, IP). No names, client names, exclusion rules or NDA question. No first-run walkthrough, quick log, "Nothing went wrong" option, 3,000-word cap, or HTML/MDX sanitizer. Import publishes `public` with no preview. |
| 5 | Information architecture | **Partial** | Renderers for Home, Work, Build, Timeline, Ask, Entry, Admin, Book. No `/now`, `/about`, `/uses`, venture detail or `/admin/*` sub-routes. Nothing is routed. |
| 6 | Task flows | **Partial** | Ask, time-travel, inbox and triage have API endpoints. Inbox approve does not send a reply. Quick log, date-offline flows, and keyboard triage (`J/K/A/R/D/S`) are not implemented. |
| 7 | Technology stack | **Deviates** | Used: TypeScript, pnpm, Turborepo, Hono, Zod, Vitest. **Not used:** Astro, React, Vite, TanStack, Radix, TipTap, CodeMirror, pg-boss (declared, never imported), ONNX Runtime, pino, argon2/TOTP/WebAuthn, age. No ADR records the deviations. |
| 8 | Pipelines | **Stub** | Six functions exist in one class. No process entrypoint, no queue, no retries, no checkpoints. Enrichment sends content to the provider with no data class, no governor and no redaction gate. Claim extraction is a keyword check that defaults outcome to `worked`. |
| 9 | Data model | **Partial** | Drizzle schema declared. No migrations, no `schema_info` boot check, no per-embedding-set vector tables, never run against Postgres. Repository is `InMemoryPortfolioRepository` only. `slug unique` is not enforced (two `POST`s with slug `dup` both returned 201). |
| 10.1 | Chunking and anchoring | **Implemented** | Minor: no overlap. |
| 10.2 | Gap questions | **Implemented** | Tested. |
| 10.3 | Query classification | **Stub, wrong default** | Substring heuristics in `ask.ts`, not the provider. Default is `lookup`. The spec requires ambiguous cases to default to `advisory`. No `about` path. |
| 10.4 | Retrieval and expansion | **Partial / Stub** | Visibility and `written_at` filters applied. No vector search or full-text. Soft-include decay weights are computed but ignored in ranking. `temporalExpand` is never called by `/ask`, ignores the "superseded before t\_q" clause, and does not apply visibility to expanded claims. |
| 10.5 | Gate and routing | **Partial, defective** | See G1–G4 below. |
| 10.6 | Verification | **Stub** | See §3. A failed check does not downgrade the tier. No "reconstruction from records" label. |
| 10.7 | Staleness | **Partial** | No scope overlap, no recompute-on-accept trigger. |
| 10.8 | Degradation ladder | **Partial** | Step 1, step 4 (flag only, no smaller model), and step 5 (extractive) exist. **Missing:** step 2 (cache), step 3 as a distinct step, step 6 (handoff when the DB is down). `isExtractive` is always `false`. |
| 11 | Self-calibration | **Partial** | Suggestion-threshold proposals with a sample guard exist. Missing: routing calibration, sliding window, held-out validation, ECE/reliability curves, per-mechanism on/off flags. Topology audit is a hard-coded fixture with fake claim ids. Constraint "mining" takes a client-supplied object. `calibrationFrozen` is ignored. |
| 12 | UI design system | **Partial** | Tokens, dark mode, focus ring, reduced-motion, timeline and text-equivalent list exist. Fonts are named but no `@font-face` or font files ship. Client code uses `innerHTML` with unescaped data. User-facing copy contains "Tier 1" and "Query class". No i18n, no 44 px touch-target evidence. |
| 13.1–13.4 | Deployment goals, profiles, topology | **Missing** | No Dockerfiles, no backup service, no setup wizard, no admin hostname split, no Cloudflare Access/tunnel configuration beyond a compose service. |
| 13.5 | Provider strategy and governor | **Partial** | Data-class routing, per-visitor limit and ledger exist. Defects at B1–B4 below. No availability check, no header learning, no 429 integration (`recordRateLimitError` is never called). |
| 13.6 | Media and imports | **Stub** | Import planner uses a fixed 100k-token budget and ignores configured budgets. No ffmpeg, OCR, ASR, resumability or checkpoints. |
| 13.7 | Static build and publish | **Stub** | Debounce and cap counters only. No build, no direct upload, no keyword index, no `/healthz` timeout in widgets. |
| 13.8–13.9 | Edge security and operations | **Missing / Stub** | `cors({origin:'*'})`. No CSP or security headers. No SSE keep-alive. Real backups, monthly restore test, `/healthz` depth (queue, disk, last backup), notifications and digest: none. |
| 13.10–13.13 | Sizing, free-tier register, presets, quickstart | **Missing** | No preset loader, no `docs/hosting-free-tier.md`. `.env.example` present. Quickstart fails (§3). |
| 14 | Plugin and extension SDK | **Interfaces only** | No concrete adapters or permission display. |
| 15 | Security and privacy | **Non-conformant** | No auth, secrets-at-rest, bot challenge, CSP, supply-chain checks or exclusion-rule enforcement. Deletion cascade works in memory but skips escalations and media. |
| 16 | Monetization | **Interface only** | Off by default, as specified. |
| 17 | Federation | **Misleading** | Manifest hard-codes owner name and `verified: true` credentials that nothing verified. |
| 18.1 | Automated tests | **Partial** | 37 unit tests over mocks. None for auth, rate-limit or spend cap, prompt injection, outbound-call interception, chaos, cache, migration, soak, Playwright, axe or Lighthouse. One worker test passes vacuously (backup stub). |
| 18.2 | Evaluation harness | **Misleading** | No dataset, no runner. Endpoint returns invented metrics. |
| 19 | Versioning, migrations, docs | **Missing** | `qrxp_v1.0.0` is a string literal. No migrations, no boot refusal, none of the 12 documentation files. |
| 20 | Roadmap exit criteria (v0.1) | **Not met** | See §6. |

**Tally (22 rows above, grouped by section family).** Implemented: 3. Partial/stub/deviating: 12. Missing or non-conformant: 5. Misleading: 2.

---

## 5. Detailed findings

### Security and privacy (S)

- **S1. No authentication or authorization.** Probed without credentials: `GET /api/entries?visibility=all` returned the private entry. `GET /api/entries/private-nda-architecture-notes` returned 200. `PUT /api/entries/:id {visibility:"public"}` returned 200 with no redaction step. `DELETE /api/entries/:id` deleted an entry. `PATCH /api/settings/routing` set `tier1_floor=0.1` and disabled automated answering. `GET /api/inbox` exposed visitor questions, facets and drafts. `POST /api/seed` is open.
- **S2. Private data reached the Ask surface.** After the `PUT` above, `/api/ask` cited `private-nda-architecture-notes`. The visibility filter works, but nothing protects the field it filters on.
- **S3. DOM XSS in the Ask widget.** The inline script writes `data.answer`, `c.title`, `c.text` and `data.basis` into `innerHTML`. Entry text and model output are untrusted per §8 and §15.
- **S4. Rate limit bypass.** The limiter keys on the client-supplied `session_id`. Rotating it let 30 of 30 requests succeed against a cap of 10 per hour. Addresses are not hashed. `x-forwarded-for` is trusted blindly.
- **S5. Open CORS, no security headers, no bot challenge.** See §13.8, §15.
- **S6. Evidence links.** `escapeHtml` is applied to `href`, but `javascript:` URLs are not rejected.
- **S7. Enrichment bypasses privacy routing.** `runEnrichJob` calls the provider directly with no data class, no governor and no use of the redaction scan result.

### Ask correctness and safety (G)

- **G1. Entry-side unknown facets are ignored.** `checkGate` marks a dimension unknown only when the client value is missing. If the entry's hard facet is unknown, the dimension is silently skipped and the gate can return PASS. The spec says either side unknown means unknown.
- **G2. Routing inputs are fabricated.** `ask.ts` passes constant true/`worked` values for evidence, verification, outcome and scope on every match, so Tier 1 depends only on keyword similarity.
- **G3. Scoped constraints are never loaded.** `checkGate` accepts them, but the route passes none. The gate also only adds the constraint's key and does not evaluate its value or scope.
- **G4. Hard facets are hard-coded** (`database`, `stack`) instead of coming from the domain configuration.
- **G5. Anachronism delivered.** I called the verifier with a draft mentioning 2025 and `asOfDate` 2021. It reported `anachronismDetected: true`, yet `verifiedText` still contained the 2025 text, and `ask.ts` returns that field.
- **G6. Indeterminate gate does not ask for facets.** The spec's "ask once, then cap at Tier 2" flow has no API state. The response goes straight to a Tier 2 escalation with a placeholder draft.
- **G7. Tier 2 drafts are not real or verified.** The stored draft is the string `Preliminary draft regarding <title>`.
- **G8. Governor side effects.** `acquire()` runs before tier selection, so budget is spent on requests that end up as Tier 2, Tier 3 or extractive.

### Budget governor (B)

- **B1.** No owner-interactive reserve or priority check. Owner work is unmetered and unbounded.
- **B2.** With default config, visitors are blocked at `visitorShare` 0.6, below `softThreshold` 0.8. The soft step (smaller model) is therefore unreachable for visitors.
- **B3.** Visitor share is computed against total tokens, not visitor tokens.
- **B4.** Hard threshold, per-minute limits, header-derived limits and 429 learning are not wired. Estimated tokens are never reconciled with actual usage.

### Persistence and pipeline (P)

- **P1.** Everything is in memory. `server.ts` unconditionally seeds demo data, so a production start serves fictional content under the name Alex Rivera.
- **P2.** `pg`, `pgvector` and Drizzle are used only to declare a schema. No connection code, migrations or repository implementation exist.
- **P3.** The worker has no entrypoint, no pg-boss registration and no persistence of embeddings.
- **P4.** `createEntry` overwrites `written_at` with `valid_from` for non-hindsight entries. `body_hash` in the worker is `sha256-<slug>-<timestamp>` and in import is the literal `'hash'`.
- **P5.** `buildsToday` never resets.
- **P6.** Revisions are "immutable" only by convention. `updateEntry` can change `current_revision_id`.

### Frontend and operations (F)

- **F1.** `apps/web` is not imported by any package or server. `/`, `/work`, `/admin` do not exist at runtime.
- **F2.** Compose references missing Dockerfiles, has no backup service, and has no health checks for api or worker.
- **F3.** `/healthz` is wired to `async () => true`.
- **F4.** Markdown rendering was only confirmed for headings and paragraphs. Treat CommonMark/GFM support as unverified.

---

## 6. v0.1 exit criteria (spec §20)

| Criterion | Met? |
| --- | --- |
| Clean install to working Ask in the target time | No. Compose build fails. No wizard. |
| Visibility and data-class routing tests pass | Partly. Tests pass on mocks. Probes show the visibility guarantee fails at the API layer. |
| Backup-restore drill passes | No. The drill is simulated. |
| Multi-arch images, setup wizard, import planner, entry editor, notification adapter, direct-upload publishing | No. |

---

## 7. Prioritized fix list

### P0: must fix before any use beyond a local demo

| # | Fix | Resolves |
| --- | --- | --- |
| 1 | Add default-deny auth middleware. Separate public and admin routers. Implement setup-wizard-gated admin account, Argon2id, server-side sessions, TOTP. Gate `/api/seed`, entries mutation, settings, inbox, audit, calibration, import. Restrict `?visibility=` and slug reads to the admin session. | S1, S2 |
| 2 | Make visibility enforcement structural. Repository methods take an allowed-visibility argument. Changing visibility to `public`, and import with `publishAsIs`, require a redaction-preview confirmation record. | S1, S2, §3.11 |
| 3 | Remove every fabricated result, or return `501 Not Implemented` with a clear message. Targets: `/settings/evaluation`, `/settings/backups/run-drill`, worker backup job, `/calibration/parameters` constants, federation manifest. Never report `passed` without a real check. | §0, §17, §18.2 |
| 4 | Fix Ask safety. Feed real claim scope, outcome and evidence into `routeQuery`. Fix the gate for entry-side unknowns. Load confirmed scoped constraints. Pass cited scopes to verification. On anachronism or failed faithfulness, return the extractive answer and downgrade the tier. Default ambiguous queries to advisory. | G1–G7 |
| 5 | Escape or sanitize all `innerHTML` writes in the Ask widget. Reject non-http(s) evidence URLs. | S3, S6 |
| 6 | Rate-limit by hashed address, not client `session_id`. Set CORS to the site's own origins. Add security headers and CSP. | S4, S5 |
| 7 | Implement a Postgres repository, migrations and the `schema_info` boot check. Stop unconditional demo seeding (make it an explicit command). | P1, P2, §9, §19 |
| 8 | Provide Dockerfiles, mount the web renderer (or ship the Astro build), give the worker a real entrypoint, add a real `/healthz`. | F1–F3, P3 |

### P1: spec-correctness defects

| # | Fix |
| --- | --- |
| 9 | Time semantics. Stop deriving `written_at` from `valid_from`. Implement the `is_hindsight AND valid_from < t_q` exclusion. Apply decay weights in ranking. Add the superseded-before-`t_q` clause and a visibility filter to `temporalExpand`, and call it from `/ask`. Enforce slug uniqueness and revision immutability. |
| 10 | Real hybrid retrieval: pgvector plus Postgres FTS with RRF over two ranked lists. Real local ONNX embeddings stored with model id, version and dimension. |
| 11 | Governor: add the owner reserve and priority, correct the visitor-share and soft/hard threshold semantics, reconcile estimated and actual tokens, wire 429 learning, release provisional spend on non-generating paths. |
| 12 | Implement the ladder's missing steps: answer cache with invalidation, distinct fallback-provider step, handoff when DB or embeddings are down. |
| 13 | Enrichment must use the data-class router and exclusion rules, and skip or go local-only on `sensitive`. Replace keyword claim extraction. |
| 14 | Real verification: entailment (LLM judge or cross-encoder), assertion removal, applicability against actual scopes, entity and version anachronism detection, "reconstruction" label. |
| 15 | Query classification through the provider with a labeled test set. Add the `about` path. Add the Needs-context state (§12.6) for indeterminate gates. |

### P2: feature completeness for v0.2–v0.3

| # | Fix |
| --- | --- |
| 16 | Calibration: routing mechanism, sliding window, held-out validation, ECE reporting, per-mechanism flags, honoring `calibrationFrozen`, guarded `/apply`, rollback that restores state. |
| 17 | Topology audit and constraint mining as real detectors that only propose. Add a test that no path writes a relation or active constraint without an owner action (§18.1). |
| 18 | Staleness: scope overlap, recompute on relation accept. |
| 19 | Real static build, direct-upload publish, build-time keyword index, daily reset of build counter. |
| 20 | Real backups: `pg_dump` plus `age`, scratch-container restore with row, embedding and checksum verification, retention, notifications, digest. |
| 21 | Import planner using configured budgets. Resumable per-document jobs. Core connectors (GitHub, RSS, file drop). Concrete notification adapters. |
| 22 | Frontend: self-host fonts with `@font-face`, replace the textarea with the specified editor, keyboard triage, i18n, theme conformance for contrast and no-JS rendering. |

### P3: project hygiene

| # | Fix |
| --- | --- |
| 23 | Add `LICENSE` (Apache-2.0 per §2), `GOVERNANCE.md`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md`, `THIRD_PARTY_NOTICES`, issue templates. |
| 24 | Write the 12 documentation files in §19. Add an ADR for each deliberate stack deviation (no Astro, no React admin, YAML profiles as TypeScript). |
| 25 | CI: audit and SBOM, the missing test categories in §18.1, Playwright flows, axe, and a versioned evaluation set with a real runner. |
| 26 | Tests: add regression tests for every P0 and P1 item above. Replace the vacuous backup test. |

---

## 8. What is good and worth keeping

- Clean package boundaries and strict TypeScript. The repository interface (`IPortfolioRepository`) makes a Postgres implementation a contained task.
- Core algorithms are pure functions with unit tests (chunking, structure levels, gap questions, calibration proposals, temporal predicate).
- The seed corpus exercises the right edge cases: a superseded 2021 claim, a hindsight retrospective, a private NDA entry.
- The owner kill-switch and Tier 1 floor warning exist and match the spec's intent once authenticated.
- Redaction scanning, data-class policy routing and HTML escaping in the renderer are in place and mostly sound.

## 9. Recommended next step

Treat the repository as **pre-v0.1**. Fix P0 items 1–8 first, because items 1–3 are honesty and privacy failures that would be harmful if the code were deployed as described in A001. Then ask A to re-issue the execution report with each statement tagged *implemented*, *simulated* or *not started*.

## Appendix: how to reproduce

1. Unzip, then run `pnpm install --frozen-lockfile`, `pnpm build` and `pnpm test`. All pass.
2. In `apps/api`, create a Vitest file that calls `createApp()` and `seedDemoPortfolio(repo)`. Issue the requests in §5 S1–S4 with `app.request(...)` and no credentials.
3. Call `verifyAnswerBeforeDelivery` with `asOfDate: '2021-06-01'` and a draft containing 2025 to reproduce G5.
4. Run `ls docker` to confirm the Dockerfiles are absent.
