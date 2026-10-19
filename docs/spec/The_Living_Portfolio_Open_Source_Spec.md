# The Living Portfolio (Open Source)
### Product & Technical Specification for Self-Hosted Deployment

---

## 0. Summary

The Living Portfolio is a self-hosted personal site that works as a tech blog, a design portfolio, and a showcase for things the owner has built. Underneath the pages is a time-aware knowledge graph of the owner's work. Visitors can read it like any site, ask questions that are answered from the owner's actual records with citations, scrub a timeline to see what the owner knew at a given date, and escalate to the owner when the records can't answer confidently.

Anyone can deploy it from source (`git clone` or a release `code.zip`) on a laptop, a home server, a small VPS, a free cloud VM, or Kubernetes. It can run on free tiers for little more than the cost of a domain name, within the limits and trade-offs described in §13. There is no central platform: every instance has one owner, who holds the data, the keys, and the configuration.

Three decisions shape everything below:

1. **Entry-first, structure optional.** The unit of content is a document as the owner already has it. It publishes, is searchable, is citable, and can be asked about on day one with no categorization. Structure (context, roles, claims, evidence) is added gradually, mostly by confirming machine suggestions, and each added layer unlocks more capability. Structure is never a prerequisite.
2. **Honesty is the invariant.** The system preserves what the owner wrote and believed at each point in time. Automation may suggest, flag, and propose; it never rewrites history, never silently changes what visitors are told, and never lets unconfirmed machine output pose as the owner's judgment.
3. **The narrative site stands alone.** Public pages are static, fast, and fully readable without JavaScript or the graph. The graph is an enhancement layer.

---

## 1. Product Principles

| Principle | Consequence |
|---|---|
| Reading comes first | Pages are static-first; the reader is never blocked by chat, graph, or structure widgets |
| Evidence is visible | Answers cite entries and passages; dates, provenance, and verification status are shown |
| Structure is enrichment | Any entry works at the lowest structure level; the editor never refuses to save or publish for missing fields |
| Uncertainty is stated in words | Visitors see what was matched and what could not be verified, not a fake-precision score |
| The owner can always stop it | One setting disables automated answering instantly; another freezes self-calibration |
| Degrade, don't fail | Quota exhaustion, provider loss, or host failure steps down to cached or extractive answers (§10.8), never an error page; the static site keeps serving |
| Structure must earn its keep | A structural feature stays on by default only if it measurably beats a plain text-retrieval baseline on the project's evaluation set (§18) |

---

## 2. Licensing & Governance

**License:** Apache-2.0 is recommended. The value of an instance is the owner's own graph, so a re-hosted copy of the code is not a competitive threat, and the patent grant gives enterprises comfort. If a hosted commercial offering is ever planned, decide on AGPL-3.0 before external contributors arrive, since relicensing later is hard. Bundled fonts and third-party assets keep their own licenses (the default fonts are SIL OFL) and are listed in `THIRD_PARTY_NOTICES`.

**Governance:**
- `GOVERNANCE.md` names maintainers; routine PRs use lazy consensus.
- **Schema changes go through an RFC process**, because the data model, role profiles, and relation types are a contract that themes, plugins, and every instance's upgrade path depend on.
- `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, and templates for bugs, features, connector proposals, profile proposals, and theme submissions.
- `SECURITY.md` with a private disclosure channel. Self-hosters get no automatic patching, so tagged security releases and a clear advisory process matter.

---

## 3. Content Model

### 3.1 Design stance

The model has a small **kernel** that every entry has, and optional **annotation layers** that enrich it. The kernel is what retrieval, citation, time-travel, and verification need. The layers are what make advisory questions answerable with confidence.

### 3.2 Kernel objects

| Object | What it is |
|---|---|
| **Entry** | A document: a post, case study, note, design write-up, or dev-log item. Has a slug, a profile, a visibility, and optionally a venture |
| **Revision** | An immutable saved version of an entry's body. Edits create new revisions; old ones are kept |
| **Span** | A contiguous passage of a revision (paragraph-level, structure-aware), anchored by character offsets plus a text-quote selector so annotations survive edits |
| **Time** | When it happened (event time) and when it was recorded, with a confidence level (§3.9) |
| **Context facets** | Structured conditions the work happened under (§3.7) |
| **Annotation** | An optional role label on a span (§3.5) |
| **Claim** | A statement the system can reason about, such as a lesson, decision, or outcome, with its scope and time (§3.6) |
| **Relation** | A typed link between claims (supersedes, refines, contradicts, supports, depends on) |
| **Evidence** | Something openable that backs a claim or entry: a link, commit, file, demo, or media item |
| **Venture** | A long-running shipped product or project that many entries attach to |
| **Media asset** | An image, video, audio, or file, with derived text (caption, OCR, transcript) |

### 3.3 Structure levels

Each entry has a structure level, computed from what it contains. Levels describe what the system can do with an entry, and are shown to the owner as a four-step indicator, never as a percentage score.

| Level | The entry has | Unlocks |
|---|---|---|
| **L0 Text** | Body, date (possibly estimated), embeddings | Publishing, search, citations, timeline placement, lookup answers ("did you write about X?", "what did you use for Y?") |
| **L1 Context** | Known values for the domain's hard-constraint facets | Advisory answers can pass the constraint gate; advisory drafts for owner review (Tier 2) |
| **L2 Roles** | Role annotations covering the profile's minimum role set | Structured case-study view; role-aware retrieval (when evaluation confirms it helps); better gap questions |
| **L3 Claims** | At least one claim with scope and an outcome status | Eligible for automated advisory answers (Tier 1), staleness banners, "what didn't work" answers |

Evidence is a separate boost, not a level: verified evidence raises routing scores and earns badges at any level.

### 3.4 Role profiles

Roles are a **vocabulary supplied by a profile**, not a fixed ontology. A profile is a YAML file that defines role names, plain-language prompts, which roles bear claims, and the minimum role set for L2. Profiles are community-contributable.

```yaml
id: case-study
label: Case study
roles:
  - { id: goal,     label: The goal,                   prompt: What were you trying to achieve, and why? }
  - { id: approach, label: What I did,                 prompt: What did you actually do? }
  - { id: friction, label: What got in the way,        prompt: What went wrong, got hard, or surprised you? }
  - { id: decision, label: The decision,               prompt: What did you choose, and what did you rule out?, claim_bearing: true }
  - { id: outcome,  label: What happened,              prompt: What was the result?, claim_bearing: true, structured: outcome_status }
  - { id: lesson,   label: What I'd tell someone else, prompt: What would you tell someone facing this, and when would it not apply?, claim_bearing: true }
evidence: attachments        # evidence attaches to any role or span, it is not a step
context: facets              # context is structured facets, see §3.7
minimum_for_L2: [ [friction, goal], [decision, lesson, outcome] ]   # at least one from each group
```

Reference profiles shipped in core:

| Profile | Roles |
|---|---|
| **Case study** (default) | goal, approach, friction, decision, outcome, lesson |
| **Decision record** | context, options, decision, consequences, lesson |
| **Design project** | brief, exploration, critique, iteration, final, impact, lesson |
| **Research note** | question, method, finding, limitation, lesson |
| **How-to** | goal, steps, pitfall, result |
| **Freeform** | no roles; L0/L1 only |

The classic six-step chain maps onto the default profile as follows: Intent is *goal*, Execution is *approach*, Artifact is *evidence* (an attachment on any span), Friction is *friction*, Resolution splits into *decision* and *outcome*, and Insight is *lesson*. Context is promoted from prose into structured facets because routing depends on it.

Profiles never change the core schema; they change prompts, extraction priors, and the structured view.

### 3.5 Span annotations

- An annotation links a span to a role from the entry's profile.
- **Multi-label:** one span can carry several roles (a paragraph can state both a friction and a decision). **Unlabeled is valid.**
- Each annotation records `source` (machine or owner), `status` (suggested, accepted, rejected), and `confidence`.
- Machine annotations start as *suggested*. Accepting is one tap; rejecting is remembered so the same suggestion isn't repeated.
- Entries may repeat roles (several friction/decision pairs) and place them in any order, since real work loops.

### 3.6 Claims and relations

Claims are the units on which staleness, contradiction, and time-travel operate. A claim has text, a kind (lesson, decision, outcome, finding, fact), a **scope** (the conditions under which it holds, expressed as facets), an **outcome status** (worked, partly, failed, unresolved, unknown), a source span, and bitemporal fields.

Relation types:

| Type | Meaning |
|---|---|
| `supports` | One claim adds evidence for another |
| `refines` | Adds precision within overlapping scope without invalidating |
| `contradicts` | Conflicts under overlapping scope |
| `supersedes` | Invalidates another claim within a stated scope; requires that scope |
| `depends_on` | Holds only if another claim holds |

Claims may be extracted from any span, but spans with claim-bearing roles are the high-confidence sources. Claims are bound to a revision, so editing an entry creates new claims rather than overwriting old ones.

### 3.7 Context facets and outcome status

Facets are key/value conditions on an entry or a claim: domain, stack, scale, team size, timeline, budget class, regulatory setting, and similar. They come from a **controlled vocabulary** per domain (extensible by the owner) plus free tags, so facets compare across entries.

- Each domain declares which facets are **hard** (a mismatch makes advice inapplicable, such as database engine or latency budget) and which are **soft** (affect similarity only).
- A facet value counts as **known** if the owner confirmed it, or if it was machine-extracted from a quoted source span at confidence above `facet_known_threshold` (default 0.9). Otherwise it is **unknown**.
- **Outcome status** is a structured field (worked, partly, failed, unresolved, unknown). Failed and partly outcomes are first-class: they let the system answer "what didn't work" and avoid presenting a failed approach as a recommendation.

### 3.8 Evidence

Evidence is an attachment, not a narrative step. It can point to a span, a claim, or a whole entry. Kinds: URL, repository commit or PR, file, media asset, live product link. Optional verification records (for example a signed commit checked against the repository host) are stored with the evidence and shown as a badge. Verification proves an artifact exists and who authored it; it does not prove the surrounding narrative is true or that the approach fits a visitor's situation, and the UI says so.

### 3.9 Time

| Field | Meaning |
|---|---|
| `valid_from`, `valid_to` | When the described event or state held in reality (`valid_to` null if ongoing) |
| `written_at` | When this revision was saved (transaction time) |
| `temporal_level` | `exact`, `range`, or `estimated` |
| `valid_from_range_end` | Upper bound when the date is a range |
| `is_hindsight` | True if the text is a retrospective written well after the event |

Rules that follow from this:
- Online sources supply exact dates automatically (commit time, upload date, publish date, EXIF).
- Offline or undated material gets a range via picker, an anchor to nearby dated content, or a confirmed OCR hint.
- Every new entry asks one question: "Are you writing about something that happened earlier?" A yes sets `is_hindsight`, because hindsight text written in 2026 about 2021 would otherwise leak later knowledge into a 2021 view.
- A range or estimated date is never used for a hard include/exclude cut when the query date falls inside its range; it contributes through decay weight only.

### 3.10 Ventures

A shipped product is a long-running aggregate that entries attach to via `venture_id`. A venture has a status (idea, building, live, maintained, sunset), links (live URL, repository, demo), a start date, and constraint facets. Its page shows an overview, an embedded or linked live product, a dev-log feed of its entries, outcome notes, and evidence. Dev-log entries also appear in the site-wide writing feed and timeline with a venture marker. Everything that works for entries (retrieval, time-travel, staleness) works for ventures because a venture is just a filter over its entries.

### 3.11 Visibility and revisions

Each entry is `private`, `unlisted`, or `public`. Retrieval for visitor chat only ever draws on public entries (and unlisted ones if the owner enables it), enforced as a filter applied before any retrieval, never after. Private entries are never cited. Because chat can paraphrase, there is no "assistant-only but hidden" mode.

Revisions are immutable. Time-travel and audit read the revision that existed at the relevant `written_at`, so editing an old post never rewrites what the owner had published at the time.

---

## 4. Authoring & Input Guidance

### 4.1 How the concepts are introduced

The roles are not taught as vocabulary. Users see plain questions, with the term as a small label, learned through one worked example.

1. **First-run walkthrough (about 60 to 90 seconds).** One example entry shown across the profile's prompts, ending with "Now try one of yours." If content was imported, drafts are pre-filled for editing.
2. **In-context guidance.** Each prompt shows its question, a one-line definition, a placeholder example, and a "stronger vs. weaker" popover.
3. **Reference.** A glossary page linked from every tooltip.

Reader-facing headings use the friendly labels ("What got in the way"); the schema term appears as a tooltip for developers.

### 4.2 Default profile: what goes in each prompt

| Label (schema id) | Question | Write | Avoid | Typical size |
|---|---|---|---|---|
| The goal (`goal`) | What were you trying to achieve, and why? | The aim and motivation as understood at the time | Describing the solution or result | 1 to 3 sentences |
| What I did (`approach`) | What did you actually do? | Approach, key actions, tools, sequence, in first person | A full changelog | 1 to 3 short paragraphs |
| What got in the way (`friction`) | What went wrong, got hard, or surprised you? | Specific obstacles with symptoms or evidence | "It was hard"; blaming people | 1 to 3 paragraphs, repeatable |
| The decision (`decision`) | What did you choose, and what did you rule out? | The choice, alternatives, trade-offs | Only describing what worked | 1 to 2 paragraphs |
| What happened (`outcome`) | What was the result? | Result with numbers where available, plus a status | Reporting only successes | 1 paragraph plus status |
| What I'd tell someone else (`lesson`) | What would you tell someone facing this, and when wouldn't it apply? | A transferable lesson with conditions | Platitudes; restating the decision | 1 to 3 sentences |

Evidence ("What it left behind") is attached anywhere: links, commits, files, demos, designs.

**Disambiguation tests**, shown beside the prompts:
- *Approach vs. evidence:* if you could link to it, it is evidence; if it is a story about what you did, it is approach.
- *Friction vs. decision:* friction is the problem and its signs; the decision is what you chose to do.
- *Decision vs. lesson:* the decision is true for this project; the lesson would still help on a different one.

### 4.3 Input constraints

| Topic | Rule |
|---|---|
| **Markdown** | CommonMark plus GFM (lists, tables, fenced code with language tags, inline code, links, blockquotes, images). Rich-text editor by default with a Markdown source toggle |
| **Headings** | Within a role-labeled field, top-level headings are discouraged because the field is itself a section |
| **HTML / MDX** | Raw HTML is sanitized. MDX components are limited to an allow-list; arbitrary MDX is not supported in v1 because it degrades extraction and is a risk if others contribute |
| **Required** | Only a body and a date are required. Everything else is optional, including friction. Offer an explicit "Nothing went wrong" choice so users aren't pushed to invent difficulty |
| **Length** | Sizes are soft guidance. A hard cap (about 3,000 words per field, configurable) keeps chunking and embedding reliable; longer material should be split into multiple entries |
| **Images** | Alt text required; it is also retrieval text |
| **Video / audio** | Auto-transcribed; file types and size limits configurable |
| **Time** | Exact, range, or estimated, with the hindsight question (§3.9) |
| **Confidentiality** | Before publishing, a redaction preview highlights personal names, client names, secrets, and anything matching exclusion rules, and asks whether any of it is under NDA |

### 4.4 Authoring modes

- **Paste or import first (primary path).** Bring a document as it is. It publishes immediately. A sidebar shows "here's what I found" with suggested roles, facets, claims, and dates to accept, change, or ignore. At most two or three targeted questions appear, only for missing facts whose answers would unlock the most capability (§10.2). A **"Good enough"** exit is always visible. The owner never has to finish.
- **Guided.** Writing from scratch with the profile's prompts in order (any order allowed, repeatable, evidence attachable anywhere).
- **Freeform.** A normal editor. Structure is suggested alongside, with gaps called out ("No outcome found. Did it work?").
- **Quick log.** A thirty-second mobile form: what happened, what was decided, what was learned, which venture. It creates a stub entry the owner can expand later or leave as is.

Non-blocking nudges flag vague language, a missing outcome, a lesson without conditions, and a decision without alternatives. Every nudge can be dismissed.

---

## 5. Information Architecture

### 5.1 Site map

```
/                     Home: owner statement, strata timeline, featured entries, Ask field
/now                  Current focus
/work                 Entries with a structured profile, filterable by domain, stack, outcome
/work/[slug]          Entry, structured or article view
/writing              All entries chronologically, tag-filterable
/writing/[slug]       Entry, article view
/build                Ventures: shipped products and projects
/build/[slug]         Venture page: overview, live embed, dev-log
/timeline             Time-travel view
/ask                  Full Ask surface with context questions
/about                Bio and verified credentials
/uses                 Tools and stack
/book                 Live-session scheduling
/rss.xml, /sitemap.xml
/admin/...            Owner only
   entries            Write, edit, structure inspector
   import             Import and triage
   inbox              Escalated questions
   structure          Profiles, facet vocabulary, hard-constraint settings
   routing            Thresholds and disclosure
   calibration        Self-calibration parameters, proposals, history, rollback
   audit              Topology conflicts and scoped-constraint review
   theme              Theme and tokens
   settings           Providers and budgets, connectors, notifications, backups, payments, exports
```

### 5.2 Entry views

An entry renders in one of two views. The **article view** shows the body as written. The **structured view** appears only when the entry reaches L2 and the owner enables it: the body is rearranged into the profile's sections with a context strip, evidence rail, and outcome. If an entry doesn't qualify, it falls back to the article view. Nothing breaks for unstructured content.

### 5.3 Entry page elements

1. Title and dates, with both "happened" and "written" dates shown when they differ.
2. **Context strip:** confirmed facets as plain chips. Machine-extracted, unconfirmed facets are not shown as facts.
3. Body.
4. **Margin rail** (wide screens; inline on narrow): role markers, evidence chips with verification state, and the Ask-about-this entry point.
5. **Later-thinking banner** when an accepted relation shows a newer claim supersedes or contradicts one here in overlapping scope.
6. Related entries.

---

## 6. User Task Flows

### 6.1 Visitor flows

| Flow | Steps |
|---|---|
| **Read** | Home or index, then entry. No graph calls; fully works without JavaScript |
| **Ask about this** | Open the entry's widget. Retrieval is scoped to this entry and its relations. Answer streams with citations. If it can't answer, the widget links to full Ask or booking |
| **Ask (global)** | Type a question. The system classifies it. A *lookup* question is answered with citations. An *advisory* question first asks for the few facets it needs (stack, scale, constraints), then routes by tier (§10.5). Missing facets are asked once, with "skip" available; skipping leaves them unknown and caps the answer |
| **Time-travel** | Move the timeline cursor. All content and answers reflect only what was recorded as of that date, with the owner's later-superseded beliefs excluded |
| **Check credentials** | Badges appear only for evidence that was verified; unverified claims carry no badge |
| **Book** | Scheduling pre-filled with the facets and question already provided |

### 6.2 Owner flows

| Flow | Steps |
|---|---|
| **Import existing material** | Connect sources or drop files, bulk crawl into unprocessed records, background enrichment, confidence-sorted triage (accept, reassign, adjust date, skip), draft pages generated and published as is |
| **Add structure to an entry** | Open the inspector: review suggested roles, confirm facets, set outcome status, attach evidence, watch the structure level change and the answerability preview (§12.6) show example questions the entry can now support |
| **Write new** | Guided, freeform, or quick log |
| **Date offline material** | Date range picker, anchor to nearby dated entry, confirm OCR hint, or bulk-tag a cluster on the timeline |
| **Review escalations** | Inbox shows the question, the visitor's facets, a verified draft, and an editor. Approving sends the reply; the size of the edit is recorded as a quality signal |
| **Tune routing and disclosure** | Raise the automated-answer bar, set hard facets per domain, disable automated answering, or freeze calibration |
| **Review calibration proposals** | See current parameters, pending proposals, history with evidence, and roll back any change |
| **Resolve conflicts** | Audit queue lists detected contradictions as questions; the owner's answer is the only way an edge is created |
| **Review scoped constraints** | See rules mined from the owner's own rejections, the quote they came from, and the scope they would apply to; confirm or discard |
| **Theme the site** | Live preview, token edits, per-view overrides |
| **Monitor and maintain** | Weekly digest; quota, backup, and restore-test status; provider and model availability banners; one-click rollback of an upgrade |

---

## 7. Technology Stack

These are the reference choices. Each sits behind an interface (§14) so deployers can swap it. Versions are pinned at release time; use current LTS releases of Node and Postgres.

| Concern | Choice | Why |
|---|---|---|
| Language | TypeScript throughout | One language across site, admin, API, workers, and plugins lowers the contribution barrier |
| Monorepo | pnpm workspaces + Turborepo | Independent publishing of SDK packages with shared tooling |
| Public site | **Astro**, static output, small interactive islands (React) for chat, timeline, and widgets | Static-first rendering matches the "readable without the graph" principle and keeps JavaScript off reading pages |
| Admin app | React single-page app (Vite), TanStack Query and Router, accessible primitives from Radix UI | Admin is interactive and authenticated; no SEO needs |
| API | **Hono** on Node.js | Small, standards-based HTTP framework that runs on Node, containers, and edge runtimes |
| Validation | Zod schemas shared between API, admin, and SDKs | Single source of truth for types |
| Database | **PostgreSQL** with **pgvector** and built-in full-text search | One database to run for the default profile |
| Graph storage | Relational tables with recursive CTEs for traversal (default); Neo4j adapter for the enterprise profile | Entry and claim graphs for one owner are small; no graph database needed by default |
| ORM and migrations | Drizzle ORM with plain SQL migrations | Typed queries, reviewable migrations |
| Jobs | **pg-boss** (Postgres-backed queue) | Removes Redis from the default deployment |
| Search | Hybrid: pgvector similarity plus Postgres full-text, merged by reciprocal rank fusion | Strong lookup quality without extra services |
| Object storage | Local filesystem by default; S3-compatible storage (including MinIO or a CDN-fronted bucket) optional, recommended for backups and large media | Works on a laptop and scales to cloud |
| Media processing | ffmpeg for audio extraction, chunking, and frames; hosted Whisper-class ASR by default on small hosts (local whisper.cpp or faster-whisper where the host has capacity); local Tesseract OCR first, with a vision model only for low-confidence or public content | Offloads heavy CPU work while keeping private content local |
| LLM access | A thin internal `ModelProvider` interface with adapters: OpenAI-compatible endpoints, Anthropic, Google Gemini, and Ollama for local models; per-role provider chains with a budget governor and declared data-use policies (§13.5) | Bring your own key; no provider lock-in; quota- and privacy-aware routing |
| Embeddings | Small open model run locally on CPU via ONNX Runtime by default; hosted embeddings optional; model id, version, and dimension stored with every vector | Hosted embedding models are retired on vendor schedules; local embeddings avoid forced re-embedding, quota use, and content exposure. Model swaps still require a managed re-embed (§19) |
| Contradiction and entailment checks | LLM judge via the provider interface, or a local cross-encoder (ONNX) | Same code path for both; evaluated on a labeled set (§18) |
| Editor | TipTap (ProseMirror) with Markdown serialization; CodeMirror 6 for the source toggle | Rich editing for non-Markdown writers, source mode for developers |
| Auth | Argon2id passwords, TOTP, and passkeys (WebAuthn via SimpleWebAuthn); server-side sessions | No external identity service needed; SSO/OIDC/SAML in the enterprise profile |
| Observability | pino structured logs; OpenTelemetry traces, optional | Useful by default, exportable when needed |
| Testing | Vitest, Playwright, axe-core, Lighthouse CI, and an evaluation harness (§18) | Covers logic, flows, accessibility, performance, and model quality |
| Packaging | Multi-stage, multi-architecture (amd64 and arm64) Docker images, Compose files, a Helm chart (enterprise), release `code.zip` built by CI | Free and low-cost hosts are often Arm; matches the target audience |
| Edge and tunnel | Cloudflare Tunnel (`cloudflared`) by default for outbound-only access; Caddy reference config as an alternative | No open inbound ports; automatic TLS |
| Static hosting | CDN static hosting by direct upload (§13.7) | Unlimited static requests on common free plans; the site survives origin outages |
| Notifications | ntfy, Telegram, email (SMTP or API), or webhook adapters | Escalations and alerts must reach the owner |
| Backups | `pg_dump` plus media sync, encrypted with `age`, to S3-compatible storage and an optional private Git export | Data portability and recovery on any host |

**Scale assumption:** a single owner's corpus is thousands to tens of thousands of chunks. At that size, filtered exact vector scans in Postgres are fast and avoid the recall problems that filtered approximate indexes can have. HNSW indexes are optional and should use iterative scanning where the installed pgvector version supports it; verify against the installed version.

---

## 8. System Architecture & Pipelines

```
 Sources (paste, upload, connectors, quick log, editor)
        │
        ▼
 INGEST          normalize to Markdown + media, redact per exclusion rules (locally),
                 create revision, create spans, resolve dates
        │  (entry is publishable here: L0)
        ▼
 EMBED           chunk-level embeddings with model id/version; full-text index
        │
        ▼
 ENRICH (async, all outputs are suggestions)
   • facet extraction (with quoted source span + confidence)
   • role suggestion per span
   • claim extraction + outcome status
   • relation candidates
   • evidence discovery (links, commits, media)
   • gap detection → at most 3 high-value questions
        │
        ▼
 REVIEW          owner accepts / changes / ignores; structure level updates
        │
        ▼
 SERVE           static site build  ·  chat API (retrieve → gate → route → draft → verify)
                 timeline API  ·  inbox  ·  notifications
        │
        ▼
 CALIBRATE       observes corrections and outcomes; proposes bounded changes (§11)
```

Principles:
- **Publish speed is decoupled from enrichment.** Imports go live at L0 while enrichment continues.
- **Model output is always data, never instruction.** Ingested text and visitor input are untrusted; they never change system prompts, tool permissions, or retrieval filters.
- **Every machine output carries provenance:** model id, prompt version, source span, confidence.

---

## 9. Data Model

Core tables (PostgreSQL). `qrxp_schema_version` is stored in a `schema_info` table and checked at boot.

```sql
create table ventures (
  id uuid primary key, name text not null, status text not null,
  links jsonb, started_at timestamptz, facets jsonb
);

create table entries (
  id uuid primary key,
  slug text unique not null,
  profile text not null default 'freeform',
  view text not null default 'article',            -- article | structured
  visibility text not null default 'private',      -- private | unlisted | public
  venture_id uuid references ventures(id),
  current_revision_id uuid,
  created_at timestamptz not null default now()
);

create table entry_revisions (
  id uuid primary key,
  entry_id uuid not null references entries(id),
  body_md text not null,
  body_hash text not null,
  written_at timestamptz not null default now(),   -- transaction time
  valid_from timestamptz, valid_to timestamptz,    -- event time
  temporal_level text not null default 'estimated',-- exact | range | estimated
  valid_from_range_end timestamptz,
  is_hindsight boolean not null default false
);

create table spans (
  id uuid primary key,
  revision_id uuid not null references entry_revisions(id),
  ordinal int not null, start_off int not null, end_off int not null,
  text_exact text not null, prefix text, suffix text, token_count int
);

create table annotations (
  id uuid primary key,
  span_id uuid not null references spans(id),
  role text not null, profile text not null,
  source text not null,                            -- machine | owner
  status text not null,                            -- suggested | accepted | rejected
  confidence real, created_at timestamptz not null default now()
);

create table facets (
  id uuid primary key,
  entry_id uuid not null references entries(id),
  revision_id uuid references entry_revisions(id),
  key text not null, value jsonb not null,
  source text not null, status text not null,      -- machine/owner ; suggested/confirmed/rejected
  confidence real, source_span_id uuid references spans(id)
);

create table claims (
  id uuid primary key,
  revision_id uuid not null references entry_revisions(id),
  text text not null,
  kind text not null,                              -- lesson | decision | outcome | finding | fact
  outcome_status text,                             -- worked | partly | failed | unresolved | unknown
  scope jsonb,                                     -- facets under which the claim holds
  valid_from timestamptz, valid_to timestamptz,
  recorded_at timestamptz not null default now(),
  temporal_level text, is_hindsight boolean not null default false,
  source_span_id uuid references spans(id),
  source text not null, status text not null       -- machine/owner ; suggested/accepted/rejected
);

create table relations (
  id uuid primary key,
  src_claim uuid not null references claims(id),
  dst_claim uuid not null references claims(id),
  type text not null,                              -- supports | refines | contradicts | supersedes | depends_on
  scope jsonb,                                     -- required for supersedes
  status text not null,                            -- proposed | accepted | dismissed
  recorded_at timestamptz not null default now(),
  valid_from timestamptz
);

create table evidence (
  id uuid primary key,
  entry_id uuid references entries(id), span_id uuid references spans(id),
  claim_id uuid references claims(id),
  kind text not null, url text, media_id uuid,
  verification jsonb, verified_at timestamptz
);

create table media_assets (
  id uuid primary key, entry_id uuid references entries(id),
  mime_type text not null, uri text not null, alt_text text,
  caption text, ocr_text text, transcript jsonb, duration_sec int
);

create table embedding_sets (                      -- one row per model/version in use
  id uuid primary key, model_id text not null, model_version text not null,
  dim int not null, status text not null           -- active | building | retired
);
-- vector storage: one table per embedding_set (chunk_id, vector), created by migration
```

Operational records:

```sql
create table correction_log (id uuid primary key, kind text, role text, domain text,
  machine_confidence real, owner_action text, edit_distance real, at timestamptz default now());
create table escalations (id uuid primary key, question text, query_class text,
  facets jsonb, draft text, final text, draft_edit_distance real,
  citation_clicks int, booked boolean, status text, due_at timestamptz, at timestamptz default now());
create table calibration_changes (id uuid primary key, parameter text, old_value real, new_value real,
  evidence_count int, applied_by text, reversible boolean default true, at timestamptz default now());
create table topology_reports (id uuid primary key, claim_a uuid, claim_b uuid,
  confidence real, overlap jsonb, status text, at timestamptz default now());
create table scoped_constraints (id uuid primary key, constraint jsonb, scope jsonb,
  source_escalation uuid, source_quote text, status text,   -- proposed | confirmed | revoked
  at timestamptz default now());
```

Source-of-truth and portability: entry bodies are also exportable as Markdown files with front matter, and annotations, facets, claims, and relations as a JSON sidecar, so an owner can leave with their data in open formats.

---

## 10. Algorithms

### 10.1 Structure-aware chunking and anchoring

Split by headings and paragraphs first, then by token budget (target 300 to 500 tokens with small overlap) so a span rarely crosses a section boundary. Each span stores character offsets plus a text-quote selector (exact text with prefix and suffix). When a revision changes, annotations are re-anchored by selector match and flagged for review if no confident match is found.

### 10.2 Gap questions (value of information)

```
FUNCTION GapQuestions(entry, domain):
  candidates = []
  FOR facet IN domain.hard_facets:
    IF facet is unknown AND not inferable at >= facet_known_threshold:
      candidates.ADD(question_for(facet), value = domain.facet_weight[facet])
  IF entry has no outcome status: candidates.ADD("Did it work?", value = HIGH)
  IF entry date is estimated: candidates.ADD("When was this?", value = MED)
  RETURN top 3 by value, each skippable
```

### 10.3 Query classification

Each visitor question is classified as **lookup** (what, whether, where: answerable from text with citations), **advisory** (what should I do in my situation: depends on applicability), or **about** (questions about the owner or the site: answered from the About page and settings). Classification uses the provider interface with a small prompt and is evaluated on a labeled query set (§18); ambiguous cases are treated as advisory because that is the stricter path.

### 10.4 Retrieval and temporal expansion

```
FUNCTION Retrieve(query, t_q, scope):
  filter = visibility IN allowed
           AND revision.written_at <= t_q
           AND IsTemporallyValid(chunk_or_claim, t_q)
  candidates = HybridSearch(query, filter)                  // vector + full-text, RRF
  expanded   = TemporalExpand(candidates, t_q, hops=2)
  RETURN Rerank(expanded)

FUNCTION IsTemporallyValid(x, t_q):
  IF x.temporal_level != "exact" AND t_q WITHIN [x.valid_from, x.valid_from_range_end]:
    RETURN soft_include(weight = reduced)                   // never a hard cut inside a range
  RETURN x.valid_from <= t_q
     AND (x.valid_to IS NULL OR x.valid_to > t_q)
     AND x.recorded_at <= t_q
     AND NOT (x.is_hindsight AND x.valid_from < t_q)

FUNCTION TemporalExpand(seeds, t_q, hops):
  // the temporal predicate applies to every claim AND every relation traversed,
  // because a link created later did not exist at t_q
  FOR hop IN 1..hops:
    FOR each relation r adjacent to frontier:
      IF IsTemporallyValid(r, t_q) AND IsTemporallyValid(r.other_end, t_q) AND
         NOT superseded_by_accepted_relation_before(t_q, within scope):
        ADD r.other_end
```

Optional role-aware boost: spans labeled friction or decision receive a retrieval boost for advisory queries. This is shipped behind a flag and enabled by default only if it wins the ablation in §18.

### 10.5 Gate and routing

```
FUNCTION Gate(client_facets, matched_entry_scope, scoped_constraints):
  FOR dim IN domain.hard_facets + applicable(scoped_constraints):
    IF either value unknown:            mark dim unknown
    ELIF values incompatible:           RETURN FAIL
  RETURN INDETERMINATE if any unknown else PASS

FUNCTION Route(query, class, matches):
  IF class == lookup:
     IF support(matches) >= lookup_threshold: Tier 1 (cited, grounded)
     ELSE: say it isn't in the records, offer to ask the owner
  IF class == advisory:
     g = Gate(...)
     IF g == FAIL:           Tier 3   (live conversation; no draft shown)
     IF g == INDETERMINATE:  ask visitor for the missing facets once;
                             if still unknown: cap at Tier 2
     S = sigmoid(w1*z_norm + w2*S_evidence + w3*S_outcome)
     IF g == PASS AND S >= tier1_floor AND matched claims have scope+outcome: Tier 1
     ELIF S >= tier2_floor:  Tier 2 (draft, owner reviews before delivery)
     ELSE:                   Tier 3
```

- `z_norm` is the best match's similarity normalized against the expected maximum for a graph of that size and domain (so prolific authors aren't inflated).
- `S_evidence` is the share of supporting claims with attached or verified evidence.
- `S_outcome` reflects outcome status; failed or partly outcomes lead to "here's what didn't work" phrasing, not a recommendation.
- **Shipped defaults** `tier1_floor = 0.82` and `tier2_floor = 0.55` are starting values, not validated guarantees. They must be calibrated against labeled data on each instance (§11, §18). The admin shows a persistent warning if the Tier 1 floor is set below the shipped default.

### 10.6 Verification before delivery

A drafted answer passes two checks before it is shown:
1. **Faithfulness:** each assertion is entailed by the retrieved passages, with citations resolving to a span, or to a timestamp range for video and audio. Unsupported assertions are removed or the answer is regenerated in extractive form.
2. **Applicability:** the cited experience's scope is compared with the visitor's facets; any mismatch or unknown is stated in the answer ("This was a single-node deployment; you mentioned a cluster").

A failed check downgrades the tier by one step. For time-travel queries, an **anachronism check** scans the draft for entities, versions, or events dated after the query date and falls back to an extractive answer if any are found. The answer is labeled as a reconstruction from records, not as testimony.

### 10.7 Staleness

For each public entry, find accepted `supersedes` or `contradicts` relations whose scope overlaps the entry's claims; if one exists, show the later-thinking banner linking to the newer entry. Recompute at build time and whenever any relation is accepted.

### 10.8 Degradation ladder

When a model budget runs out, a provider fails, or the host is constrained, answering steps down instead of failing. The ladder wraps the routing in §10.5: it never changes which tier a question qualifies for, only how the answer is produced.

1. **Normal.** Generate the answer for the tier that routing chose.
2. **Cached.** Serve a previously generated answer when the normalized question, the set of cited entry revisions, the visitor's facets, and the "as of" date all match, or when an embedding-near duplicate above a high threshold matches under the same facets. Only answers built from public entries are cached. A cache entry is invalidated when any cited revision changes or an accepted relation touches a cited claim. Time-travel answers are cached only under their "as of" date.
3. **Fallback provider.** Try the next provider in the chain whose data policy allows the content (§13.5).
4. **Smaller or shorter.** Use a smaller model and a trimmed context, still subject to the verification pass (§10.6).
5. **Extractive mode.** Make no generation call. Return the top-ranked passages with citations, dates, and the confirmed context chips under a fixed sentence ("Showing excerpts from the owner's records. Automated answers are paused for now."). For advisory questions the passages appear with the applicability check (matched, mismatched, and unknown facets) but no synthesized advice. This mode needs only the local embedding model and the database.
6. **Handoff only.** If the database or embeddings are unavailable, the widget shows booking and message options.

Degradation applies to visitor traffic first; owner-interactive work such as inbox drafts keeps priority access to budget (§13.5).

---

## 11. Self-Calibration Layer

The layer observes how the owner corrects the system and how visitors respond, and proposes bounded adjustments. It never edits entries, claims, or relations. All four mechanisms follow one governance rule:

> **Observe, propose a bounded change, auto-apply only if small and the evidence is sufficient, otherwise ask the owner to confirm, log every change with its evidence, and allow one-click rollback.**

Every mechanism requires a **minimum sample size** before acting, clamps each update to a **maximum step**, and uses a sliding window so old behavior doesn't dominate. The two parameter-changing mechanisms ship **off**: a new instance has no history and the sample gates cannot be met.

| Mechanism | Observes | Proposes | Default |
|---|---|---|---|
| **Suggestion thresholds** | Rate at which each role/facet/claim suggestion is accepted, edited, or rejected; size of edits | Per-type confidence thresholds for pre-selecting a suggestion versus asking for review. Suggestions stay marked as machine-made until the owner confirms | Off |
| **Routing calibration** | Escalation draft edit sizes, citation click-through, booking conversion, and the rate of scoped constraints per domain | Per-domain adjustments to `w1..w3` and decay rates. A domain with frequent scoped constraints is treated as lower-trust overall | Off |
| **Topology audit** | Claim pairs with overlapping time and scope, opposing conclusions, and no relation | A ranked conflict report with the question "does the later claim supersede the earlier one, or do they apply to different situations?" Never creates an edge | On (proposals only) |
| **Scoped constraint mining** | The owner's own rejection replies in the inbox | A proposed constraint bound to that conversation's scope, shown with the quote it came from; applied only after the owner confirms | On (proposals only) |

Notes on each:
- **Edit distance and click-through are noisy signals.** An owner's style preferences or an ambiguous question can inflate edit sizes. Treat them as evidence to be combined, validate against a held-out labeled set before trusting a change, and report calibration quality (reliability curves, expected calibration error) on the dashboard.
- **Topology audit** selects candidates by constraint *similarity*, not exact match; uses an entailment/contradiction model with its own measured precision and recall; and ranks by confidence times page visibility so alerts don't become noise.
- **Scoped constraints** apply only when a visitor's facets are similar enough to the stored scope (`scope_match_threshold`), expire with the venture or period they came from, and are listed in `/admin/audit` for revocation. A rejection reason that isn't a technical constraint ("too busy right now") is never auto-converted.

---

## 12. UI Design System

### 12.1 Direction

**Subject:** a person's accumulated work, made of layers laid down over time. **Audience:** visitors judging whether this person's experience fits their problem; owners maintaining that record with minimal effort. **Primary job:** make evidence and time legible.

**Concept: strata.** Time is the organizing idea, so time is the one bold element: the **strata timeline**, where entries stack as layers across the owner's years. Everything else is quiet, typographic, and text-first so the strata can carry the identity. The site deliberately avoids card grids, tracked-out all-caps labels, mono data labels everywhere, and decorative gradients; structure is shown only where it encodes information.

### 12.2 Design principles

1. Text is the interface; chrome earns its place.
2. One memorable element (the strata timeline); everything else disciplined.
3. Structure on screen means structure in the data (a border, marker, or rule always signals something).
4. Meaning never rests on color alone: every role, status, and state has a label or icon too.
5. Machine output looks provisional until the owner confirms it.
6. Defaults are accessible: visible focus, keyboard parity, reduced motion, 200% zoom.

### 12.3 Tokens

Semantic tokens are CSS custom properties; themes override them. Values are starting points, and CI checks every text/surface pair for contrast (4.5:1 for text, 3:1 for UI boundaries and focus).

| Token | Light | Dark |
|---|---|---|
| `--surface-page` | `#F3F5F4` | `#0F1A22` |
| `--surface-raised` | `#FFFFFF` | `#16232D` |
| `--text` | `#14202A` | `#E6ECEF` |
| `--text-muted` | `#4B5A66` | `#A3B2BD` |
| `--rule` | `#CBD3D8` | `#2A3946` |
| `--accent` | `#3A4FD0` | `#9AA8FF` |
| `--focus-ring` | `--accent`, 2px with 2px offset | same |
| `--role-goal` | `#2F5FA8` | `#8DB4EA` |
| `--role-approach` | `#5A5F6B` | `#B4B9C4` |
| `--role-friction` | `#9A6A00` | `#E2B34A` |
| `--role-decision` | `#5B3FA0` | `#B9A4EE` |
| `--role-outcome` | `#1F7A5A` | `#6FCBA3` |
| `--role-lesson` | `#A13A6B` | `#EE9CC2` |
| `--status-warn` / `--status-error` | derived, contrast-checked | derived, contrast-checked |

Spacing uses a 4px base on a 4, 8, 12, 16, 24, 32, 48, 72 scale. **Radii vary by role:** 2px for chips and markers, 6px for controls, 12px for overlays and popovers. Elevation is reserved for overlays; structure elsewhere uses rules and spacing. Roles are drawn from the active profile; custom roles get a neutral token unless the profile sets one. Light and dark modes follow the system setting with a visible override.

### 12.4 Typography

| Role | Face | Notes |
|---|---|---|
| Reading and headings | **Literata** (OFL, variable) | Designed for long reading; body 18px with 1.65 line height, reading measure 62 to 70 characters |
| Interface | **Atkinson Hyperlegible Next** (OFL) | Chosen for legibility; sentence case throughout |
| Code | **JetBrains Mono** (OFL) | Code only, not decorative labels |

Fonts are self-hosted, subset, and loaded with `font-display: swap` and system fallback stacks; nothing is fetched from third-party font hosts. Type scale ratio 1.2 from 16px (14, 16, 18, 21, 25, 30, 36, 44). Left-aligned text, no justification. Headings are set in the reading face at weights, not sizes alone, to separate levels.

### 12.5 Layout and responsive behavior

- Breakpoints: 480, 768, 1024, 1280.
- Entry page is one reading column with a margin rail at 1024 and above; on narrower screens the rail's content moves inline after the relevant paragraph or collapses behind a labeled control.
- Admin is desktop-first with a three-pane workspace; tablet collapses to two panes; phone supports quick log, inbox review and approval, notifications, and triage with large touch targets (minimum 44px).
- Performance targets (to be measured, not assumed): reading pages ship no framework JavaScript by default beyond small islands, about 70 KB gzipped JS on a reading page, and a largest contentful paint around 2 seconds on a mid-tier phone over throttled 4G.

### 12.6 Key screens

**Home**

```
┌──────────────────────────────────────────────────────────────┐
│ Name                 Work  Writing  Build  Timeline  Ask  ◐ │
├──────────────────────────────────────────────────────────────┤
│  One-sentence statement of what I work on.                    │
│                                                               │
│  ░▒▓▓▒░░▒▒▓▓▓▒░░░▒▓▒░░▒▓▓▓▓▒░     ← strata timeline, 2018–now │
│  2018        2020        2022        2024        2026         │
│                                                               │
│  Recent and featured, as a plain list: title, a sentence,     │
│  date, and a structure marker only if the entry has one.      │
│                                                               │
│  Ask about my work: [ type a question ................ ]      │
└──────────────────────────────────────────────────────────────┘
```

**Strata timeline.** Each month is a band whose height reflects the number of entries and whose texture or fill indicates profile or venture (with a legend and accessible names). A cursor sets the "as of" date: later layers dim and the page header states "Viewing as of March 2021." Keyboard: left and right arrows move by entry, page up and page down by year, Enter opens. With reduced motion, changes are instant.

**Entry page (structured view)**

```
┌────────────────────────────────────────────────────────────────┐
│ Title                                                           │
│ Happened March 2024. Written September 2026, looking back.     │
│ Postgres 15   12 people   under 50 ms   (confirmed facets)     │
├───────────────────────────────────────┬────────────────────────┤
│ The goal            prose…            │ Evidence               │
│ What I did          prose…            │  PR 482, verified      │
│ What got in the way prose…            │  Latency dashboard     │
│ The decision        prose…            │ Ask about this         │
│ What happened       worked, p99 −40%  │  [ question ......... ]│
│ What I'd tell someone else  prose…    │                        │
├───────────────────────────────────────┴────────────────────────┤
│ Later thinking: updated in "Advisory locks, revisited".         │
└────────────────────────────────────────────────────────────────┘
```

**Ask widget states**

| State | What the visitor sees |
|---|---|
| Idle | Input with examples drawn from the owner's actual entries |
| Needs context | One short form for missing facets, each skippable |
| Answering | Streaming text with a polite live region for screen readers |
| Tier 1 answer | Label "Automated answer from the owner's records". Line stating basis: "Based on 3 entries from 2021 to 2024". Context check: "Matches: Postgres, under 15 people. Not verified: latency budget." Citations open the passage in place |
| Tier 2 | "This needs the owner's review. Typical reply within 24 hours." Draft is not shown; status persists |
| Tier 3 | "This is better as a conversation." Booking with the question prefilled |
| No match | "That isn't in these records." Offer to ask the owner |
| Disabled | Notice that automated answers are off, with booking |
| Reduced mode | "Showing excerpts from the owner's records. Automated answers are paused for now." Ranked passages with citations, dates, and context chips; booking offered. No model-generated text |

The AI disclosure is always visible on any automated answer. Numeric confidence scores are never shown to visitors.

**Admin entry workspace**

```
┌──────────┬───────────────────────────────────┬─────────────────────────┐
│ Entries  │ Editor (rich text | Markdown)      │ Inspector               │
│ filters  │                                    │ Structure | Context |   │
│          │ Suggested roles shown as           │ Evidence | Answerability│
│          │ marginal markers: accept, change,  │ | History              │
│          │ ignore                             │                         │
│          │                                    │ Level: Text, Context,   │
│ [Publish as is]                               │ Roles, Claims           │
└──────────┴───────────────────────────────────┴─────────────────────────┘
```

The **Answerability** tab lists example questions the entry can currently support and what one more step would add ("Add an outcome to make this answerable for advisory questions"). The level indicator is a four-step bar with plain labels; it is a map of what's possible, not a score to maximize.

**Import triage.** A confidence-sorted list or card stack. Each row shows the item, its suggested type, date and its certainty, and facets with their source quotes. Keyboard: `J`/`K` move, `A` accept, `R` reassign, `D` set date, `S` skip. Bulk accept by source or confidence tier. **Publish as is** is always available.

### 12.7 Interaction and motion

Motion answers an action (expanding, confirming, moving the timeline cursor) and is otherwise absent. There are no entrance animations. Machine-suggested items are drawn with a dashed outline and a "suggested" label, and become solid when accepted. Every irreversible or visible-to-visitors action has an undo or a clear confirmation. Long operations (import, re-embedding) show progress, remain cancelable, and survive page reloads.

### 12.8 Accessibility and internationalization

- Target WCAG 2.2 AA, verified by axe in CI plus manual keyboard and screen-reader passes on the strata timeline, Ask widget, and triage views.
- Full keyboard operability; logical focus order; visible focus; focus moves into dialogs and returns on close.
- Streaming answers use `aria-live="polite"`; the strata timeline has a text-equivalent list view.
- Honors `prefers-reduced-motion` and `prefers-color-scheme`; supports 200% zoom and text-only enlargement without loss of content.
- UI strings externalized (ICU message format); logical CSS properties for right-to-left support; each entry carries its own content language, used for chunking, embeddings, and spell-check.

### 12.9 Copy rules

Sentence case. Active verbs. One name per action throughout a flow ("Publish" produces "Published"). Name things by what users understand ("What got in the way"), not by schema terms. Errors say what happened and what to do, without apologizing; empty states are invitations ("No entries yet. Paste a document to start."). Machine output is labeled as such.

### 12.10 Theme contract

Themes implement slot contracts per view and may override tokens:

```
EntryArticle:    header, contextStrip, body, marginRail, laterThinkingBanner, related, askWidgetMount
EntryStructured: header, contextStrip, roleSections[], evidenceRail, outcome, laterThinkingBanner, askWidgetMount
Venture:         header, overview, productEmbed, devLog, evidenceRail
Home:            statement, strataTimeline, entryList, askField
Timeline:        strataTimeline, asOfBar, results
```

`theme-sdk` ships conformance tests (required slots, token coverage, contrast, no-JS rendering) that run in the theme's CI. Owners can swap themes with live preview, override one view, or use a custom component slot (this is also how live product demos are embedded). Product embeds are sandboxed iframes loaded on click by default to protect privacy and performance.

---

## 13. Deployment, Hosting & Operations

### 13.1 Goals

1. **Zero or near-zero recurring cost** for a personal site, using free tiers where they are dependable and naming the small costs that are hard to avoid: a domain name, and optionally a few dollars a month for a reliable host.
2. **Static-first resilience.** The public site is static files on a CDN. If the origin host, the database, or every model provider is down, visitors can still read everything.
3. **Few moving parts.** One origin host runs three processes (API, worker, Postgres) plus a tunnel agent. The same Compose file works on a home server, a free cloud VM, or a small paid VPS, on both x86-64 and ARM64.
4. **No silent data exposure.** Every model provider declares its data-use policy, and the system routes content only to providers whose policy fits that content (§13.5).
5. **Degrade, don't fail.** When quotas run out or a provider disappears, the site steps down a defined ladder (§10.8) instead of returning errors.
6. **Assume free tiers change.** Limits, model names, and terms are configuration, not code. The system verifies them at runtime, and the docs carry "last verified" dates (§13.11).
7. **Low maintenance.** Target: under about 30 minutes a month in steady state, through automated backups, restore tests, health checks, and update notices (§13.9). This is a target to validate with real deployers, not a measured result.

### 13.2 Profiles

| | Hobbyist (default) | Enterprise |
|---|---|---|
| Database | Postgres + pgvector only | Postgres, with optional Neo4j graph adapter |
| Queue | pg-boss | pg-boss or an external queue |
| Models | Provider chains with budgets (§13.5); local CPU embeddings | Per-task provider routing with cost tracking |
| Secrets | Encrypted at rest with a locally generated key | External secrets manager or cloud KMS; optional confidential-computing enclaves |
| Auth | Password, TOTP, passkeys; optional Cloudflare Access in front of `/admin` | Adds OIDC/SAML SSO and audit logs |
| Hosting | Static on a CDN plus one origin host (§13.3) | Kubernetes via Helm, horizontal workers |

A third, experimental **Edge-light** profile avoids running a server at all (§13.3, option D).

### 13.3 Hosting options for the origin

The public site always deploys as static files to a CDN. Only the origin (API, worker, database) has options.

| Option | What it is | Cost | Strengths | Risks | Choose when |
|---|---|---|---|---|---|
| **A. Own hardware** | A mini-PC, Raspberry Pi-class board, or NAS, connected to Cloudflare through an outbound tunnel | Hardware and power you already have | No inbound ports, full control, no provider policy risk | Home power and network outages; you are the sysadmin | You already run a home server |
| **B. Free cloud VM** | An always-free Arm VM (for example Oracle's Ampere A1 allowance) | $0 | Real server, enough RAM for this stack | Capacity may be unavailable when you try to create it; idle instances can be reclaimed; the free allowance has been reduced before; no SLA | You accept rebuild risk and keep off-host backups |
| **C. Small paid VPS** | A low-end VPS from any mainstream provider | A few dollars per month | Predictable, fast to set up, no reclamation lottery | A recurring cost | You want the least maintenance and highest reliability |
| **D. Edge-light (experimental)** | Hono API on an edge runtime, hosted Postgres with pgvector, jobs run on demand | $0 within free limits | No server to patch or lose | Small database cap, cold starts, no always-on worker, runtime CPU limits, more moving vendors | You want zero servers and can live with reduced features |

**Default recommendation:** static site on Cloudflare plus one origin from options A, B, or C. If a free VM is unavailable or gets reclaimed, move the same Compose stack to option A or C by restoring a backup (§13.9); nothing in the design is tied to one provider.

**Edge-light (option D) in detail.** The API runs as a Worker, the database is a hosted serverless Postgres, and visitor queries are embedded by a hosted embedding service. Because an always-polling queue would keep the database awake and burn its compute allowance, jobs run as batch invocations (start, drain the queue, exit) from an on-demand local worker or a scheduled CI job. Known constraints to validate before declaring this profile supported: the free database size cap, scale-to-zero cold-start latency on the first query, per-request CPU and subrequest limits on the free edge runtime, a shared daily request quota with other dynamic routes, and the lack of local embeddings (so the index depends on a hosted model's lifecycle). It is marked experimental until a deployer completes the end-to-end test in §18.

Not recommended: free application platforms that sleep or pause idle projects (a paused database or a cold web service breaks scheduled jobs and visitor Ask), and any host whose free plan limits use to personal, non-commercial purposes if you intend to enable paid tiers (§16).

### 13.4 Reference topology

```
 Visitor ──► Cloudflare: DNS, CDN, TLS, WAF, bot challenge
                │                                │
          static assets                     api.example.com   (DNS-proxied to the tunnel;
                │                                │             no edge function in the path)
                ▼                                ▼
   Static hosting (Astro build,           cloudflared tunnel  (outbound connection only)
   deployed by direct upload)                    │
                                      ┌──────────▼──────────────────────────┐
   admin.example.com ───────────────► │ ORIGIN HOST (A, B, or C)            │
   (Cloudflare Access + app auth)     │  api     Hono; also serves /admin   │
                                      │  worker  pg-boss jobs, embeddings,  │
                                      │          media processing, builds   │
                                      │  db      Postgres 16 + pgvector     │
                                      │  media   local disk (or S3-compat.) │
                                      └──────────┬──────────────────────────┘
                                                 │ outbound only
                 ┌───────────────────────────────┼──────────────────────────────┐
         Model providers                 Object storage                   Notifications
         (chains, budgets, §13.5)        media + encrypted backups        ntfy, Telegram, email
```

Design decisions:
- **API on its own hostname, reached directly through the tunnel.** Routing `/ask` through an edge function would consume that platform's daily dynamic-request quota, add latency, and turn quota exhaustion into errors on a site that otherwise serves static files for free.
- **Admin on a separate hostname, served by the API** (same origin as its API, so cookies and CORS stay simple), never by the static host.
- **Outbound-only networking.** The origin opens no public inbound ports; SSH is reached through the tunnel or restricted to the owner's address.

### 13.5 Model-provider strategy

**Roles and chains.** Each role has an ordered chain of providers. The router walks the chain and takes the first provider that is healthy, within budget, and allowed for the content's data class.

| Role | Default approach | Why |
|---|---|---|
| **Embeddings** | **Local CPU model** run with ONNX Runtime inside the worker and API: a small open embedding model chosen by evaluation on your own corpus (§18.2); check its license | Hosted embedding models are perishable: one major vendor retired its earlier embedding models in January 2026 and lists a further retirement schedule for its successor. Local embeddings never expire, use no quota, expose no content, and cost little CPU at personal-site scale. They are not a local LLM; small models typically need on the order of hundreds of megabytes of memory. A hosted embedding chain is an optional fallback, and a switch always builds a second embedding set (§19) |
| **Extraction** (async: roles, facets, claims) | A free-tier or low-cost hosted model, quality over speed | Runs in the background and tolerates queueing for days if needed |
| **Synthesis** (real-time answers) | A fast hosted model with a second provider as fallback | Low latency matters for streaming; token budgets are small, so context is trimmed |
| **ASR** | Hosted Whisper-class transcription with audio extracted and chunked locally | Offloads CPU; free allowances are measured in audio seconds |
| **OCR and vision** | **Local Tesseract first**; a hosted vision model only for low-confidence results or diagrams | Local OCR is cheap, private, and fast; vision APIs are reserved for content that is already public |

Local generation models are not recommended on small hosts; they compete with Postgres and the API for memory.

**Data-use policy routing.** Free tiers differ in what they do with submitted content, and at least one major free tier allows inputs to be used to improve the vendor's products and read by human reviewers. Every provider adapter therefore declares a `dataPolicy` (trains on inputs: yes, no, or conditional; retention; human review; zero-retention option). Every job carries a **data class**:

| Data class | Meaning | Allowed providers |
|---|---|---|
| `public` | Published entry that passed the redaction preview | Any, including free tiers that may train on inputs |
| `unpublished` | Drafts and imports awaiting review | Providers that do not train on inputs, or local |
| `private` | `private` visibility | Providers that do not train on inputs (enable zero-retention where offered), or local |
| `sensitive` | Matched an exclusion rule or flagged in redaction | Local only, or skip enrichment |

The wizard shows, per configured provider, which data classes it will receive. Defaults err toward the stricter class.

**Budget governor.** A ledger tracks each provider and model against its limits: requests and tokens per minute and per day, and audio seconds per hour and per day. Limits come from three sources, in this order: provider response headers when available, the owner's values from the provider console, and conservative defaults. Some providers no longer publish free-tier limits and show them only per project in a console, so the governor also learns from `429` responses (it lowers its assumed limit for 24 hours and backs off with jitter).

```
FUNCTION Acquire(role, est_tokens, priority, data_class):
  FOR provider IN chain[role]:
    IF NOT policy_allows(provider, data_class) OR NOT healthy(provider): CONTINUE
    IF ledger[provider].can_spend(est_tokens, priority):
      RETURN lease(provider)
  RETURN degrade(role)            // see the ladder in §10.8

priority: owner_interactive > visitor_interactive > background
rules:
  background work may not use the last background_reserve share of any daily budget
  visitor traffic is capped at visitor_share of the daily budget
  at soft_threshold (default 80%): prefer smaller models, serve cached answers, trim context
  at hard_threshold: extractive mode (§10.8)
```

**Abuse and cost controls for `/ask`:** a bot challenge on the first question of a session; per-session and hashed-per-address rate limits; a maximum context size; answer caching (§10.8); and an owner-set daily cap. The authoritative limits live in the app, with edge rules as a first filter.

**Model availability checks.** Model names churn. At startup and once a day, the system lists models from each provider and confirms every configured model still exists. A missing or deprecated model raises an admin banner and triggers fallback along the chain. A scheduled CI canary does the same for the project's default presets and opens an issue when one disappears.

### 13.6 Media and imports under quotas

- **Audio and video.** Extract audio locally with ffmpeg, downsample to speech quality, and split into chunks under the provider's upload limit (free plans can be as low as about 25 MB). The original video stays in object storage or on disk; only audio goes to the transcription provider.
- **Images.** Local OCR first; low-confidence results and diagrams go to a vision provider only if the entry's data class allows it.
- **Import planner.** Before a bulk import starts, the wizard estimates tokens and audio seconds, compares them to the configured budgets, and shows an ETA ("about 4 days within free limits, or minutes if you allow a few cents of paid usage"). Free allowances are daily, so large backlogs run slowly by design; imported entries publish at L0 immediately while enrichment trickles in. Tokens for a one-time import of a few million tokens cost on the order of cents to about a dollar at current listed prices for small hosted open models, so the planner offers a clearly labeled "pay a little, finish today" option.
- **Resumable.** Jobs checkpoint per document, survive restarts, and respect the priority rules above.
- **Upload limits.** Default 50 MB per direct upload (configurable); larger files use chunked upload. Media never goes into the static bundle.

### 13.7 Building and publishing the static site

- **Build on the origin (or in CI), deploy by direct upload.** A Git-connected static host would need database access from its build environment, and free plans cap builds (a free static plan can allow about 500 builds a month, 20,000 files per site, and a per-file size cap of about 25 MiB; verify current numbers). The worker builds the site and uploads the output instead.
- **Debounced publishing.** Publish events are coalesced (default: at most one build per 10 minutes, at most 12 per day), with a manual "publish now" for the owner. Relation changes that flip staleness banners trigger a rebuild through the same queue.
- **What ships in the bundle.** HTML, CSS, small scripts, optimized responsive images under a size budget, and a build-time keyword search index so search works with the API offline. Originals and video are served from object storage through the CDN.
- **Widget resilience.** Ask and timeline widgets check `/healthz` with a short timeout and show the disabled state (booking, message) when the origin is unreachable.
- **Hosting terms.** Use a static host whose free plan permits commercial use if you enable paid tiers; some popular free plans restrict use to personal, non-commercial projects.

### 13.8 Networking and edge security

- **Tunnel by default.** Run `cloudflared` as a container. No inbound ports are open. If you use a conventional reverse proxy instead (Caddy reference config), restrict the firewall to the CDN's published address ranges and enable authenticated origin pulls.
- **Admin protection in layers.** Separate hostname; Cloudflare Access in front of it where available (verify current free-plan terms); then the app's own authentication (password, TOTP, passkeys). The setup wizard cannot be skipped.
- **Bot and abuse protection.** A bot challenge on `/ask`; app-level rate limits as the authoritative layer.
- **Headers and embeds.** Strict CSP and security headers; sandboxed, click-to-load product embeds; CORS limited to the site's own origins.
- **Streaming.** Answers stream over server-sent events through the proxied hostname. Send periodic keep-alive comments and cap generation length so streams do not hit proxy idle timeouts.
- **Domain.** A custom domain is the one near-unavoidable recurring cost. A free subdomain works for trials, but named tunnels and Access require a domain on the CDN account.

### 13.9 Operations: keeping maintenance low

**Backups (mandatory, automated).**
- Nightly `pg_dump` in custom format, plus an incremental media sync, encrypted with `age` (the private key is held offline by the owner).
- Destinations: S3-compatible object storage (free allowances exist; some require a payment method on file, so verify), and optionally a private Git repository receiving the portable export (Markdown with front matter plus the JSON sidecar from §9).
- Retention: 7 daily, 4 weekly, 6 monthly (configurable).
- **Monthly automated restore test** into a scratch container that checks row counts, embedding presence, and media checksums, then reports to the owner. An untested backup is treated as no backup.
- A `restore` command rebuilds the full stack on any new host in one run; the target recovery time is a few hours, and the static site keeps serving throughout.

**Updates.**
- OS: unattended security upgrades.
- App: releases are announced in the admin; upgrading is `docker compose pull` plus an automatic migration that first takes a snapshot and refuses to boot against an unknown schema (§19). Automatic updates are opt-in.
- Containers use restart policies, memory limits, health checks, and log rotation, so one runaway process cannot take the host down.

**Monitoring and notifications.**
- `/healthz` reports database, queue depth, disk usage, last backup, and provider canaries. An external free uptime monitor can watch it.
- A **notification adapter** (ntfy, Telegram, email, or webhook) is required at setup, because escalated questions and the response deadlines in §16 depend on reaching the owner. Alerts: disk above 80%, backup failure, budget thresholds, provider or model failure, certificate or tunnel problems.
- A weekly **owner digest** summarizes questions, escalations, quota use, import progress, and backup status.

**Free-VM specifics (option B).**
- Provision with a script (cloud-init or Infrastructure as Code) kept in the repo, so rebuilding after a reclaim or capacity problem is a single command.
- Build multi-architecture images (amd64 and arm64); free Arm VMs need arm64.
- Do not rely on artificial "keep-alive" load to avoid idle reclamation; it is fragile and may breach the provider's terms. Plan for rebuilds with backups. Some deployers upgrade to a pay-as-you-go account while staying inside the free allowance to reduce capacity and reclamation problems; read the provider's current terms first, since allowances have been cut before and may be enforced on paid accounts too.
- Treat the stated allowance as variable: size the deployment to fit comfortably in roughly 2 vCPUs and 4 to 6 GB of memory, which fits both the current and the earlier published allowances.

### 13.10 Sizing and tuning

A personal corpus is small: about 50,000 chunks at 768 dimensions is roughly 150 MB of float32 vectors (about half that as half-precision vectors where supported). Postgres tuning should follow that, not the host's total RAM.

| Host | PostgreSQL | Processes |
|---|---|---|
| **Minimum**: 2 vCPU, 2 GB RAM, 20 GB disk | `shared_buffers` 256 MB, `effective_cache_size` 1 GB, `max_connections` 20, `work_mem` 8 MB | API container limit 512 MB, worker 768 MB; add a 2 GB swap file |
| **Comfortable**: 2 vCPU, 4 to 6 GB RAM | `shared_buffers` 512 MB to 1 GB, `effective_cache_size` 2 to 3 GB | API 768 MB, worker 1.5 GB |
| **Large free allocation**: up to 2 vCPU, 12 GB RAM | `shared_buffers` up to 2 GB, `effective_cache_size` up to 6 GB | Headroom for optional local transcription |

Exact filtered vector scans are used by default (§7); no approximate index is needed at this size, which saves memory and avoids recall problems. Media dominates disk use, so storage alerts and optional object-storage offload matter more than database size.

```yaml
# docker/docker-compose.hobbyist.yml (excerpt)
services:
  db:
    image: pgvector/pgvector:pg16
    restart: unless-stopped
    environment: { POSTGRES_DB: portfolio }
    command: ["postgres", "-c", "shared_buffers=256MB", "-c", "effective_cache_size=1GB", "-c", "max_connections=20"]
    volumes: ["pgdata:/var/lib/postgresql/data"]
    healthcheck: { test: ["CMD-SHELL", "pg_isready -U postgres"], interval: 10s, retries: 6 }
  api:
    image: ghcr.io/<org>/living-portfolio-api:<tag>     # multi-arch: amd64 + arm64
    restart: unless-stopped
    mem_limit: 512m
    depends_on: { db: { condition: service_healthy } }
  worker:
    image: ghcr.io/<org>/living-portfolio-worker:<tag>
    restart: unless-stopped
    mem_limit: 768m
    depends_on: { db: { condition: service_healthy } }
  tunnel:
    image: cloudflare/cloudflared:latest
    restart: unless-stopped
    command: tunnel --no-autoupdate run
    environment: { TUNNEL_TOKEN: "${TUNNEL_TOKEN}" }
  backup:
    image: ghcr.io/<org>/living-portfolio-backup:<tag>
    restart: unless-stopped
volumes: { pgdata: {} }
```

### 13.11 Free-tier facts and risk register

Facts below were checked in October 2026 and **will drift**. The repository keeps them in `docs/hosting-free-tier.md` with last-verified dates and a quarterly maintainer review; verify before relying on any number.

| Service | What the free tier provides (as checked) | What to design around |
|---|---|---|
| Static hosting and CDN (Cloudflare) | Unlimited static requests; 100,000 dynamic Worker or Functions requests per day, shared; about 500 builds per month, 20,000 files per site, 25 MiB per file on the free Pages plan | Keep the API off edge functions; build elsewhere; keep media out of the bundle |
| Hosted embedding and inference (Cloudflare Workers AI) | About 10,000 neurons per day; the vendor states it does not train on customer content | Useful as a no-training fallback; small daily budget |
| Fast inference host (Groq) | Per-model daily limits (a small 8B-class model about 14,400 requests and 500K tokens per day; a 70B-class model about 1,000 requests and 100K tokens per day); Whisper about 20 requests per minute, 2,000 per day, 7,200 audio seconds per hour, 28,800 per day; no retention of inference data by default, zero-retention switch, no training | Token budgets, not request counts, are the binding limit; a 70B model gives only a few dozen long answers a day |
| Google Gemini API | Free-tier limits shown per project in AI Studio and not published; free-tier content may be used to improve Google products (outside the UK, Swiss, and EEA/EU regions per the vendor) and may be human-reviewed; model lineup rotates | Public-class content only; confirm model names at runtime |
| Free Arm cloud VM (Oracle) | Documented allowance reported as reduced from 4 OCPU and 24 GB to 2 OCPU and 12 GB (1,500 OCPU-hours and 9,000 GB-hours per month); capacity errors on creation; idle reclamation when CPU, network, and memory stay below roughly 10 to 20 percent for 7 days; no SLA | Size for 2 vCPU and 4 to 6 GB; keep backups off-host; script a rebuild |
| Serverless Postgres (Neon) | 0.5 GB per project; 100 compute-hours per project per month; scale-to-zero after 5 minutes that cannot be disabled on free | Fits Edge-light only; polling queues defeat scale-to-zero |
| Backend platform (Supabase) | 500 MB database; free projects pause after 7 days of inactivity | A paused database breaks scheduled jobs; not recommended |
| Frontend platform (Vercel Hobby) | Limited to personal, non-commercial use | Do not use if you enable paid tiers |

| Risk | Impact | Mitigation | Fallback |
|---|---|---|---|
| Free VM unavailable, reclaimed, or allowance cut | Ask and admin go offline; static site stays up | Scripted rebuild, off-host encrypted backups, right-sized stack | Move the same Compose stack to home hardware or a small paid VPS |
| Hosted model retired or renamed | Enrichment or answers fail | Daily availability check, provider chains, CI canary, local embeddings | Next provider in chain, then extractive mode |
| Quota exhaustion or bot traffic | Answers stop or the owner's key is throttled | Budget governor, caching, bot challenge, per-session limits, owner cap | Extractive mode, then booking only |
| Provider policy change (training or retention) | Private content exposed | Data-class routing, per-provider `dataPolicy` reviewed each release | Local-only or no-training providers |
| Single-host failure or data loss | Loss of graph, media, or both | Nightly encrypted backups, monthly restore test, portable export | Restore to a new host |
| Static host limits (builds, files, size) | Publishing blocked | Debounced builds, build elsewhere, media offloaded | Alternate static host; the build output is portable |
| Unexpected charges | Surprise bill | Prefer no-card free tiers; app-level caps; billing alarms where cards are required | Disable the provider in config |
| Owner unreachable for escalations | Deadlines missed | Required notification adapter, weekly digest, auto-refund policy (§16) | Pause automated Tier 2 and use booking only |

### 13.12 Presets and configuration

A preset sets sensible defaults for a deployment style; every key can be overridden. Provider model IDs are filled in by the wizard from each provider's live model list because names change.

```yaml
preset: free-cloud            # free-cloud | private-local | reliable-low-cost
hosting:
  static: direct-upload
  origin: single-host         # own box, free VM, or small VPS
  tunnel: cloudflared
  admin_hostname: admin.example.com
  api_hostname: api.example.com
models:
  embeddings:
    chain: [ { provider: local-onnx, model: <small-embedding-model> } ]
  extraction:
    chain:
      - { provider: groq,   model: <id>, data_classes: [public, unpublished, private] }  # enable zero-retention
      - { provider: gemini, model: <id>, data_classes: [public] }                         # free tier may train on inputs
  synthesis:
    chain:
      - { provider: groq,   model: <id>, data_classes: [public] }
      - { provider: gemini, model: <id>, data_classes: [public] }
  asr: { chain: [ { provider: groq, model: <whisper-id> } ], chunk_seconds: 600 }
  ocr: { chain: [ { provider: tesseract-local }, { provider: gemini, data_classes: [public], when: low_confidence } ] }
budgets:
  visitor_share: 0.6
  background_reserve: 0.3
  soft_threshold: 0.8
  hard_threshold: 1.0
  fallback: extractive
  per_visitor: { questions_per_hour: 10, bot_challenge: true }
cache: { answers: true, ttl_hours: 168 }
publish: { debounce_minutes: 10, max_builds_per_day: 12 }
backups:
  schedule: "03:30"
  destinations: [ object-storage ]
  encrypt: age
  retention: { daily: 7, weekly: 4, monthly: 6 }
  restore_test: monthly
notifications: { escalations: [ntfy], digest: weekly }
routing:
  tier1_floor: 0.82           # starting default; calibrate on your data before relying on it
  tier2_floor: 0.55
  facet_known_threshold: 0.9
calibration:
  suggestion_thresholds: false
  routing_calibration: false
  topology_audit: true
  scoped_constraints: true
storage: { backend: postgres, media: filesystem }
profiles: [case-study, decision-record, design-project, freeform]
visibility: { chat_uses_unlisted: false }
payments: { provider: none }
telemetry: false              # opt-in only
```

- `private-local` replaces hosted providers with local models for extraction and synthesis and requires a larger host; it exists for deployers who cannot send content to third parties.
- `reliable-low-cost` assumes a small paid VPS and a paid, no-training model tier for extraction and synthesis, so quotas stop being the binding constraint. Costs scale with usage and are shown in the admin.
- Every key has a documented default and a documented reason. Because no central platform can enforce the Tier 1 floor, the admin warns clearly when it is lowered, and an optional public disclosure line can state the instance's settings.

### 13.13 Quickstart

```bash
git clone https://github.com/<org>/living-portfolio.git
cd living-portfolio
cp .env.example .env
docker compose -f docker/docker-compose.hobbyist.yml up -d
```

The **setup wizard** then walks through:
1. Create the admin account (required before anything else is reachable).
2. Choose a hosting option and preset; paste the tunnel token and domain.
3. Add model-provider keys; each is validated live, and the wizard shows the data classes it will receive.
4. Choose a notification channel and send a test alert.
5. Choose a backup destination, run the first backup, and run a test restore.
6. Pick a theme, deploy the static site, and optionally launch the import planner (§13.6).

**Target:** from a clean machine to a working Ask on about twenty imported documents in under fifteen minutes (the first import's background enrichment may continue after that). This is a target to measure in usability tests, not a measured result. A pinned `code.zip` is built by CI for each tag, and published images are multi-architecture.

---

## 14. Plugin & Extension SDK

| Extension | Interface | Notes |
|---|---|---|
| **Source connector** | `authenticate`, `crawl` (yields `ImportedAsset`), `inferTemporalConfidence` | Core: GitHub, YouTube, RSS, file drop. Community: Notion, Figma, archives |
| **Role profile** | YAML file (§3.4) | Validated against a JSON Schema |
| **Theme** | Slot contract + tokens (§12.10) | Conformance suite in CI |
| **Model provider** | `complete`, `embed`, `transcribe`, `vision`, plus declarations: `limits()` (rate and token budgets), `dataPolicy` (training, retention, human review), and `listModels()` for availability checks | OpenAI-compatible endpoints (covering many hosts), Anthropic, Google Gemini, local ONNX embeddings, and Ollama in core |
| **Payment provider** | `createCheckout`, `verifyWebhook` | Stripe and LemonSqueezy in core; owner keeps the full amount minus processor fees |
| **Notification channel** | `send(alert)`, `test()` | ntfy, Telegram, email, and webhook in core |
| **Backup destination** | `put`, `get`, `list`, `delete` | S3-compatible and local path in core; private Git export |
| **Graph adapter** | `upsert`, `traverse`, `vectorSearch`, `temporalFilter` | Postgres in core; Neo4j for enterprise |

Plugins declare required permissions (network hosts, filesystem paths, data classes) and run with least privilege; the admin shows each plugin's declared permissions before enabling it. Community plugins are versioned independently so a broken one never blocks a core release.

---

## 15. Security & Privacy

- **Network exposure:** the default topology uses an outbound-only tunnel, so the origin opens no public inbound ports (§13.8). If you use a conventional reverse proxy, TLS is required before exposing `/admin`, and the firewall should admit only the CDN's address ranges.
- **Admin authentication** is enforced from first boot; the setup wizard cannot be skipped. TOTP and passkeys supported; SSO in the enterprise profile.
- **Secrets** (provider keys, payment secrets) encrypted at rest; guidance for external secret managers.
- **Cost abuse:** public chat is protected by a bot challenge on first use, per-session and per-address rate limits, a maximum context size, answer caching, and the budget governor with owner-set daily caps (§13.5). When a cap is reached the site steps down the degradation ladder to cached and extractive answers (§10.8) rather than going silent or running up a bill.
- **Prompt injection:** ingested documents and visitor messages are untrusted data; they cannot alter system prompts, tools, or retrieval filters. Visibility filters are applied in the database query, not in the prompt.
- **Local redaction** runs before any content leaves for a model provider; exclusion rules (repositories, date ranges, domains) are enforced there. Local-model options exist for deployers who cannot send content to third parties. Redaction by pattern matching and entity recognition is imperfect, so the redaction preview (§4.3) is a required human step for public content.
- **Third-party content:** journals and documents can contain other people's information; the preview and the owner's confirmation are the consent mechanism, and the docs say plainly that this is the owner's responsibility.
- **Provider data-use policy:** every provider adapter declares whether it trains on inputs, how long it retains them, and whether humans may review them. Content is routed by data class (§13.5), so private, unpublished, and sensitive content never goes to a provider whose policy forbids it. Free tiers of some providers permit training and human review, so they receive public-class content only by default. Enable zero-retention options where a provider offers them.
- **Deletion:** deleting an entry removes its revisions, spans, claims, relations, embeddings, and derived records through a single job, and the job reports what it removed. Exported copies and external model-provider logs are outside the instance's control, and the docs state that.
- **Telemetry** is off by default; any update check is opt-in and documented in the config and README.
- **Supply chain:** pinned dependencies, signed release artifacts, an SBOM per release, and dependency-audit checks in CI.

---

## 16. Monetization (Optional)

Monetization is a payment-provider plugin and is off by default. When enabled, Tier 2 reviewed answers and Tier 3 sessions can be paid through the owner's own processor account. Small per-query charges are impractical on card rails because of fixed fees, so the reference flow sells prepaid credits or fixed-price questions. There is no platform fee. Before enabling paid tiers, confirm that every free-tier service you rely on permits commercial use (§13.7, §13.11). Owners must set their own refund and response-time policy; the system tracks the response deadline and can auto-refund when it is missed. Legal terms for advice, liability, and AI disclosure are the owner's responsibility, and the docs provide a template and a checklist, not legal advice.

---

## 17. Federation (Optional)

An instance may publish a small manifest at `/.well-known/living-portfolio.json` describing its public domains, verified-credential summary, and discoverability preferences. An optional, community-run registry indexes only manifests that opt in; it does not crawl instances. Federation is out of scope for v1.0 and carries no data-sharing by default.

---

## 18. Testing & Evaluation

### 18.1 Automated tests

| Area | Tests |
|---|---|
| Ingest | Parsers per source and format; chunking and anchoring across edits; re-anchoring failure flags |
| Time | Boundary tests for validity windows, hindsight flags, range and estimated dates; revision-based time-travel returns what was written by the query date |
| Retrieval and gate | Visibility filter applied before retrieval (private entries never appear); every combination of fail, unknown, and pass yields the specified tier; floors cannot be bypassed from the UI without the warning |
| Verification | Entailment precision on a labeled claim set including adversarial unsupported claims; anachronism check recall on seeded post-cutoff terms |
| Calibration | Cold-start guard (no change below minimum sample), step clamping, oscillation under simulated noisy feedback, exact rollback, and no code path in topology audit or constraint mining that writes a relation or an active constraint without an owner action |
| Security | Auth required on every admin route; rate-limit and spend-cap tests; prompt-injection fixtures in ingested and visitor text; exclusion-rule enforcement verified by intercepting outbound model calls |
| Hosting and degradation | Budget-governor unit tests (window accounting, reserves, priority classes, soft and hard thresholds, limits learned after a rate-limit response); provider-chain chaos tests (timeouts, 429s, a model removed, malformed streams) confirm the order of the degradation ladder; extractive mode returns cited passages with no model call; answer-cache invalidation on revision or relation change; data-class routing tests prove private and sensitive content never reaches a provider whose policy forbids it |
| Operations | Backup-then-restore drill on a clean container verifies row counts, embedding presence, and media checksums; migration with snapshot and rollback; multi-architecture image smoke tests on amd64 and arm64; a 2 GB-RAM host soak test with an import running; `/healthz` and provider-canary behavior; publish debounce and daily build cap; static-site resilience with the origin stopped |
| Model availability | A scheduled canary lists each default preset's model IDs and opens an issue when one is missing or deprecated; the runtime startup and daily check raises an admin banner and triggers fallback |
| Frontend | Visual regression per view; axe accessibility checks; keyboard flows for timeline, Ask, and triage; no-JavaScript readability smoke test; Lighthouse budgets |
| Plugins | Theme conformance suite; connector contract tests against recorded fixtures |
| End to end | Playwright specs for every visitor and owner flow in §6, across the hobbyist and enterprise profiles and the free-cloud preset, with one real and one mocked model provider |

### 18.2 Model-quality evaluation (the harness that decides what stays on)

Maintain a public, versioned evaluation set of documents, labeled structure, queries, and expected citations.

- **Annotation quality:** precision, recall, and inter-annotator agreement for roles, facets, claims, and outcome status, reported with confidence intervals and per type.
- **Baseline comparison:** every release compares the full pipeline against (a) plain chunk-level retrieval with no structure and (b) a general model with no retrieval. Metrics: answer correctness, citation accuracy, applicability errors, and the rate of confident-but-inapplicable answers.
- **Structure ablation:** each structural feature (role-aware boost, structured gate, claim-level retrieval, structured view) is tested alone. A feature that doesn't beat the baseline is demoted to optional, so structure stays only where it measurably helps.
- **Calibration:** reliability curves and expected calibration error for tier scores on held-out labeled queries; the shipped floors are revisited when the evidence moves.
- **Onboarding usability:** task success and time for someone who has never seen the roles to import an existing document and get a working answer, without reading documentation. This tests the flexibility goal directly.
- **Time-travel leakage:** rate of anachronisms in historical answers against owner-confirmed ground truth.
- **Preset comparison and degraded modes:** the harness runs each preset (free-cloud, reliable-low-cost, private-local) so deployers can see the quality trade-offs of smaller or free models, and scores extractive-mode answers for citation accuracy and usefulness, since that mode is a normal operating state on free tiers.
- **Edge-light validation:** an outside deployer completes the end-to-end flows on the Edge-light profile and records latency, cold-start behavior, and any runtime limit hit, before the profile is labeled supported.

---

## 19. Versioning, Migrations & Documentation

Semantic versioning for the application; a separate, explicit `qrxp_schema_version`. Migrations are forward-only SQL scripts with documented rollback guidance; the app refuses to start against an unknown schema version and prints the exact migration command. Embedding model changes are handled by building a second embedding set alongside the active one, evaluating it, then cutting over. Local embeddings remove the most common forced re-embedding trigger (a vendor retiring a hosted model), and hosted-model deprecations are caught by the availability checks in §13.5. Calibration parameters that were fitted to the old set are reset or refit as part of the cutover, because their meaning changes with the model.

Documentation set: `README.md`; `docs/self-hosting.md`; `docs/hosting-free-tier.md` (free-tier facts with last-verified dates); `docs/operations.md` (backups, restores, updates, monitoring); `docs/architecture.md`; `docs/content-model.md` (including the authoring guidance in §4); `docs/profiles.md`; `docs/ui-design-system.md`; `docs/plugin-development.md`; `docs/security.md`; `docs/upgrading.md`; `docs/evaluation.md`.

---

## 20. Roadmap

| Release | Scope | Exit criteria |
|---|---|---|
| **v0.1 Self-hostable core** | Compose deployment with multi-architecture images, setup wizard, Postgres + pgvector, local CPU embeddings, import and paste with the import planner, entry editor, L0 and L1 (kernel, dates, facets), lookup answers with citations, provider chains with the budget governor and extractive fallback, automated encrypted backups with restore test, notification adapter, static site with direct-upload publishing, default theme | Clean install to working Ask in the target time on the usability test; visibility and data-class routing tests pass; backup-restore drill passes on amd64 and arm64 |
| **v0.2 Structure** | Profiles, role suggestions, claims, outcome status, structure inspector, answerability preview, advisory routing with the gate and Tiers 1 to 3, inbox, verification pass | Evaluation harness running in CI with baseline and ablation reports |
| **v0.3 Time and ventures** | Strata timeline and time-travel, revisions-based history, later-thinking banners, ventures and quick log, topology audit and scoped-constraint proposals | Time-travel leakage metric within the agreed bound |
| **v0.4 Ecosystem and Edge-light** | Connector, profile, theme, model-provider, payment, notification, and backup SDKs documented and versioned; first community plugins; Edge-light serverless profile (experimental) | Plugin conformance suites and permission display shipped; Edge-light end-to-end test completed by an outside deployer |
| **v0.5 Enterprise** | Neo4j adapter, Helm chart, SSO, audit logging, optional enclave support | Load and failure tests at the enterprise profile |
| **v1.0 Stable** | Schema frozen under the RFC process; upgrade path guaranteed | Two releases of migration testing with no breaking changes |
| **Post-1.0** | Calibration parameter-changing mechanisms enabled by default after evidence; federation registry; richer media understanding | Evaluation evidence that the features help |

---

## 21. Open Questions

- **License:** whether a planned hosted offering would justify AGPL before external contributors arrive.
- **Schema governance at scale:** how forks of profiles and facet vocabularies stay interoperable, and how the RFC process handles incompatible community extensions.
- **Facet vocabularies:** how much of a shared vocabulary ships in core versus grows per instance, given that comparable facets are what make routing work.
- **Liability and disclosure:** legal responsibility for advice delivered by automated tiers, and the minimum disclosure every deployment should show.
- **Cost exposure:** a sensible default spending and rate-limit posture for a public `/ask` backed by the owner's own paid model key.
- **Local model quality:** which tasks (extraction, entailment, classification) are reliable on small local models, and where the docs should recommend a stronger provider.
- **Evaluation ownership:** who curates and extends the public evaluation set so results stay comparable across releases.
- **Calibration drift:** how often to re-validate calibrated parameters against fresh labels instead of trusting the evidence behind their last change.
- **Free-tier volatility:** who maintains `docs/hosting-free-tier.md`, how often limits are re-verified, and what the project does when a popular free option changes or disappears.
- **Free-tier data policies:** whether the project should refuse by default any provider that may train on inputs, or keep gating by data class as specified.
- **Edge-light viability:** whether the API, retrieval, and verification fit within free edge-runtime limits, or the profile should require a paid plan.
- **Cost transparency:** how to present the "pay a little, finish today" import option without nudging owners toward spending they don't need.
