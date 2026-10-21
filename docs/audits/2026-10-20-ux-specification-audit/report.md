# Design Specification Audit Report

Audit date: 20 October 2026. Target: `living-portfolio-main.zip` (alpha, `0.1.0-alpha.0`). Governing documents: `docs/spec/The_Living_Portfolio_Open_Source_Spec.md` (the Spec) and `Design Audit.md` (the method).

## 0. Executive summary

**Verdict.** The repository is a spec-faithful *engine* with an unfinished *interface*. The core algorithms, schemas and API routes track the Spec closely. The UI is a thin vertical slice in two files: `apps/web/src/renderer.ts` (1,140 lines) and `apps/web/src/styles.ts` (476 lines). The public reading pages mostly work. **The owner side cannot be operated from a browser at all.** The Spec's central promise, "paste a document, it publishes, structure arrives gradually by confirming suggestions", has no working path from first run to a published, structured entry.

This is also a build-order inversion. The Spec's v0.1 exit criteria (setup wizard, import, entry editor, honest Ask) are unmet, while v0.3 showpieces (strata timeline, time-travel, later-thinking banners) are present. Visitors get the memorable element; the owner has no tool to feed it.

**The seven findings that matter most (all verified by running the app, see Appendix A):**

1. **No way in.** A browser opening `/admin` receives raw JSON, `{"error":"Unauthorized: admin authentication required"}`. There is no login page and no setup wizard (`apps/api/src/server.ts:216`, `apps/api/src/app.ts:50` hard-codes `setupWizardCompleted: true`).
2. **Admin actions fail silently.** The admin page's `fetch` calls send no `Authorization` or `X-CSRF-Token` header (`renderer.ts:1074`, `1104`, `1118`, `1130`). Publish never checks `res.ok`, so a failed publish shows nothing.
3. **False reassurance.** When the redaction-preview request fails, the page still prints "✓ No confidential secrets or NDA markers detected" (`renderer.ts:1085`). The scanner itself missed an `sk-…` API key and an "NDA" mention in my test.
4. **The publish gate is bypassable.** `POST /api/entries` accepts `visibility: public` without a redaction token (`apps/api/src/routes/entries.ts:181`). A body containing a secret went live and was served at `/work/leaky-1`. The admin form also substitutes the literal text "Published stub entry." for an empty body (`renderer.ts:1097`), so an empty submit publishes junk.
5. **Published Markdown is flattened.** `renderMarkdownToHtml` (`renderer.ts:41`) understands only `#`/`##` and paragraphs. Code fences, lists, links and `###` headings render as literal text. For a site meant to be a tech blog, this is a blocker.
6. **Structured view deletes content.** On the seeded L3 entry, 2 of 3 spans (603 characters, including the "What I'd tell someone else" lesson) do not appear in the structured view (`renderer.ts:370-390`).
7. **Dead-end visitor flows.** `/book` is an `alert()` that stores nothing (`renderer.ts:839`). Tier 2 escalations capture no visitor contact, so the owner's approved reply has nowhere to go (`apps/api/src/routes/inbox.ts:15`). `/build/:slug` returns 404.

**Your three calibration anti-patterns, confirmed and generalised:**

| Anti-pattern | Confirmed as | Root cause in code |
| --- | --- | --- |
| A. Tab-cramming | UX-13 | `renderLayout` (`renderer.ts:60-69`) puts 8 destinations plus a theme toggle in one flat bar, including **Admin** for anonymous visitors and four utility pages that are not in the Spec's nav |
| B. Monolithic admin | UX-09, UI-06 | `renderAdminWorkspacePage` (`renderer.ts:850-1140`) renders editor, inspector, inbox, audit and settings controls in one scroll, with no sub-routes. The Spec defines nine `/admin/...` areas |
| C. Truncated CMS | UX-04, UX-07, UI-01 | One `Publish as is` button is the only save action. No draft, edit, revision, unpublish or delete UI exists. The editor is an 8-row `<textarea>` (`renderer.ts:994`), where the Spec calls for TipTap rich text with a CodeMirror source toggle |

**Counts.** 33 findings: 16 UX (Layer 1), 10 UI (Layer 2), 7 Content (Layer 3). Each finding appears in exactly one layer; other layers cross-reference by ID only. Roadmap: 11 P0, 14 P1, 8 P2 actions (Part 4).

## 0.1 Method, evidence and limits

**Method.** Full read of the Spec (1,240 lines) and `Design Audit.md`. Full read of `apps/web/src/*`. Targeted read of `apps/api/src/{app,server}.ts`, `auth/security.ts` and every route file. I then installed dependencies, built the monorepo, booted the server with `SEED_DEMO=true`, and probed it with `curl` (Appendix A).

**What this audit does not cover.** I did not review backend algorithm correctness beyond UX consequences, the worker internals, Docker or hosting, or the database layer. For those I rely on the repository's own `KNOWN_ISSUES.md` and `docs/audits/conformance.yml` and flag them as "not re-verified". I did not render pages in a real browser, so there are no screenshots, no axe run, and no measured contrast ratios. Where I say a state "will" fail contrast or touch-target minimums, that is inferred from CSS values and marked *(inferred)*.

**Finding IDs.** `UX-nn` Layer 1, `UI-nn` Layer 2, `CP-nn` Layer 3. Spec references use `§`. File references are relative to the repository root, `living-portfolio-main/`.

**Conventions for status.** *Implemented*: works end to end as the Spec describes. *Partial*: some of it works. *Missing*: no code or UI. *Flawed UX*: exists, but its placement, mechanics or messaging defeats the Spec's intent.

---

## Part 1. Section-by-section specification conformance matrix

Each row maps one Spec section to the code. Diagnoses are kept short and point to finding IDs, which carry the detail in Part 2.

### 1.1 Principles, governance and content model (§0 to §3)

| File Path | Spec Requirement (explicit and inferred) | Status | Gap Analysis and UX Diagnosis |
| --- | --- | --- | --- |
| `apps/web/src/renderer.ts`, `apps/api/src/app.ts` | §0 to §1. Reading first and no-JS readable; honesty invariant; owner can always stop automated answering; degrade, don't fail | Partial | Reading pages are server-rendered and work without JS. The kill switch exists (`app.ts:40-52`, `renderer.ts:1116`) but its UI assumes the initial state is "enabled" (UX-09). Honesty is breached by hard-coded "detected conflict" and "verified" content (UX-09, CP-03) |
| `LICENSE`, `CONTRIBUTING.md`, `SECURITY.md`, `THIRD_PARTY_NOTICES`, `.github/ISSUE_TEMPLATE/*` | §2. Apache-2.0, `GOVERNANCE.md`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, issue/PR templates, `SECURITY.md` | Partial | `GOVERNANCE.md` and `CODE_OF_CONDUCT.md` are absent from the tree. No profile, theme or connector proposal templates. Not UX-scoped; noted for completeness |
| `packages/core/src/types/index.ts`, `algorithms/structureLevel.ts` | §3.1 to §3.3. Kernel objects; L0 to L3 computed from content; shown to the owner as a four-step indicator, never a percentage | Flawed UX | The logic is implemented. But visitors see raw codes, "Structure: L2" (`renderer.ts:441`) and "L0 · case-study" chips (`renderer.ts:271`, `522`). The Spec reserves the four-step indicator for the owner. Raw schema vocabulary on public pages breaks §4.1 and §12.9 (CP-02) |
| `packages/core/src/profiles/index.ts`; `renderer.ts:968-976` | §3.4. Profiles are YAML vocabularies supplied by the profile; plain-language prompts per role | Partial | Six profiles exist as TypeScript objects, not YAML with JSON Schema validation (`conformance.yml`). The admin dropdown hard-codes six `<option>`s instead of reading `/api/structure/profiles`, and shows none of the role prompts (UX-07) |
| `apps/api/src/routes/structure.ts:27-58`; `renderer.ts:1011-1027` | §3.5. Annotations are multi-label; machine ones start *suggested*; accept is one tap; rejection is remembered | Missing (UI) | API for create and patch exists. No UI to accept, change or ignore a suggestion, and no marginal markers in an editor (UX-06) |
| `structure.ts:88-120`; `renderer.ts:422-433` | §3.6. Claims with scope and outcome status; relations require scope for `supersedes` | Partial | Accepted claims render in the margin rail with outcome. No claim authoring, no relation review UI (UX-06, UX-09) |
| `structure.ts:59-87`; `renderer.ts:343-349`, `512-515` | §3.7. Facets known vs unknown; only confirmed facets shown as facts; outcome status first-class | Partial | Public pages correctly show confirmed facets only (a Spec-conformant detail). Owner cannot set a facet or outcome. The `/work` filter covers outcome only; the Spec also lists domain and stack (UX-13) |
| `renderer.ts:402-420`; `structure.ts:121-147`; `renderer.ts:809-814` | §3.8. Evidence is an attachment, badge only if verified; UI states what verification does not prove | Flawed UX | The entry rail does it right: badge only when `verified_at` is set, with the "does not prove the narrative" tooltip. `/about` then shows two verified badges unconditionally (CP-03). No attach-evidence UI (UX-06) |
| `renderer.ts:979-987`, `1100`; `temporal.ts` | §3.9. Exact/range/estimated dates; one question per entry: "Are you writing about something that happened earlier?" | Partial | A checkbox exists. `temporal_level` is hard-coded to `exact` (`renderer.ts:1100`), so range and estimated dates cannot be entered. The default date is hard-coded `2026-10-19` (`renderer.ts:980`) |
| `renderer.ts:555-592`; `structure.ts:148-167` | §3.10. Venture page: overview, live embed, dev-log feed, outcome notes, evidence; status and links | Partial | `/build` lists ventures with status, facet chips and an entry list. No venture page, no live URL, repo link or sandboxed click-to-load embed, no venture create UI (UX-13) |
| `entries.ts:181-275`, `293-361`; `renderer.ts:316` | §3.11. Visibility is private/unlisted/public; revisions immutable and viewable; public transition guarded by redaction preview | Flawed UX | Public reads correctly 404 private entries. Creation can go public with no preview token; update requires one. No revision list, no diff, no visibility control (UX-03, UX-04) |

### 1.2 Authoring (§4)

| File Path | Spec Requirement (explicit and inferred) | Status | Gap Analysis and UX Diagnosis |
| --- | --- | --- | --- |
| none | §4.1. First-run walkthrough (60 to 90 s) using one worked example; in-context guidance with stronger/weaker popover; glossary linked from every tooltip | Missing | No walkthrough, no guidance, no glossary page. The only explanation of a role is a `title=` tooltip on public headings (`renderer.ts:383`), which touch and keyboard users cannot read (UX-07, CP-01) |
| none | §4.2. Guided mode: each prompt with question, definition, placeholder, "Nothing went wrong" option | Missing | The editor has one body field. No per-role prompts and no "Nothing went wrong" choice (UX-07) |
| `renderer.ts:41-56`, `954-1006` | §4.3. CommonMark + GFM; rich text with Markdown toggle; sanitised HTML; 3,000-word cap; alt text required; redaction preview as a required human step | Flawed UX | Plain textarea. Renderer drops lists, code, links, tables, images (UI-01). Word cap and nudges absent. Redaction preview is optional and can mislead (UX-03) |
| `renderer.ts:948-1007` | §4.4. Four modes: Paste/import, Guided, Freeform with sidebar, Quick log; "Good enough" always visible; max 3 targeted questions | Partial | Only a Paste-style form. The "Good enough" sentence is printed (`renderer.ts:1004`) but nothing follows it. No sidebar "here's what I found", no quick log route or API (UX-07) |

### 1.3 Information architecture and entry views (§5)

| File Path | Spec Requirement (explicit and inferred) | Status | Gap Analysis and UX Diagnosis |
| --- | --- | --- | --- |
| `apps/api/src/server.ts:198-216`, `app.ts:138-170` | §5.1. Site map: `/`, `/now`, `/work`, `/work/[slug]`, `/writing`, `/writing/[slug]`, `/build`, `/build/[slug]`, `/timeline`, `/ask`, `/about`, `/uses`, `/book`, `/rss.xml`, `/sitemap.xml`, `/admin/...` | Partial | Present: 13 of 17 routes. Missing: `/build/[slug]` (404, verified) and every `/admin/*` sub-route. `/uses` and `/book` exist but nothing links to them (verified). `/writing/[slug]` renders the same page as `/work/[slug]` and `/writing` lists link to `/work/…` (verified). `/rss.xml` is invalid XML when a title contains `&` (verified). Unknown paths return plain-text 404 (UX-13) |
| `renderer.ts:366-393` | §5.2. Structured view only at L2+ and when the owner enables it; otherwise article view; nothing breaks | Flawed UX | Gate logic is correct. But the structured view renders only spans with an *accepted* role annotation and drops the rest. On the seeded L3 entry, 603 characters vanish (UX-16). The owner cannot enable the view (the form hard-codes `view: 'article'`, `renderer.ts:1102`) |
| `renderer.ts:436-475` | §5.3. Title and dates; context strip; body; margin rail (inline on narrow); later-thinking banner; **related entries** | Partial | All present except related entries. The rail stacks after the body on narrow screens rather than appearing after the relevant paragraph (UI-07). The "Ask about this entry" form navigates to `/ask` instead of opening in place (UX-10) |

### 1.4 User task flows (§6)

| File Path | Spec Requirement (explicit and inferred) | Status | Gap Analysis and UX Diagnosis |
| --- | --- | --- | --- |
| `renderer.ts:236-308`, `310-479` | §6.1 Read. Home or index, then entry; no graph calls; no JS needed | Implemented | Verified server-rendered. Quality limited by UI-01 and UX-13 |
| `renderer.ts:459-473`, `634-779` | §6.1 Ask about this. Widget scoped to entry; streams answer; links to full Ask or booking if it cannot answer | Flawed UX | Navigates away; the Ask page never shows that it is scoped (verified: no "scoped" text rendered); no streaming (UX-10) |
| `renderer.ts:634-779`; `ask.ts:28-250` | §6.1 Ask (global). Classify; advisory asks for facets once with skip; Tier routing | Partial | No `needs_context` state (the repo's own G6). Facet fields are two hard-coded inputs (database, stack) inside a `<details>` that opens only if the query contains "should" (`renderer.ts:652`) (UX-10) |
| `renderer.ts:137-234`, `594-632` | §6.1 Time-travel. Cursor moves; later layers dim; header says "Viewing as of March 2021"; arrow keys, Page Up/Down, Enter | Flawed UX | Dims bands and filters the list, but the as-of date is not carried to entries or Ask. Default date is a fixed past day. Promised keyboard controls are not implemented (UX-12) |
| `renderer.ts:402-420`, `797-816` | §6.1 Check credentials. Badges only for verified evidence | Flawed UX | See CP-03 |
| `renderer.ts:833-847` | §6.1 Book. Scheduling pre-filled with facets and question | Flawed UX | Submit calls `alert()`; nothing is sent or stored; no contact field; facets not passed (UX-11) |
| none; `import.ts:11-188` | §6.2 Import existing material: connect or drop, plan, triage, publish as is | Missing (UI) | API only: `/plan` and `/batch`. No upload, planner, progress, or triage UI (UX-07) |
| `renderer.ts:1011-1029` | §6.2 Add structure: inspector, suggested roles, facets, outcome, evidence, answerability preview | Partial | Read-only inspector bound to `entries[0]` regardless of selection (`renderer.ts:855`). No tabs, no actions (UX-06) |
| `renderer.ts:948-1007` | §6.2 Write new; date offline material | Partial | One form; no range picker, anchor-to-entry or bulk-tag on the timeline (UX-04, UX-07) |
| `renderer.ts:901-915`; `inbox.ts:15-70` | §6.2 Review escalations: question, visitor facets, verified draft, editor; approving sends the reply | Flawed UX | Read-only list. No approve, edit, or reject UI. No visitor facets shown. Approving does not deliver anywhere (UX-08) |
| `renderer.ts:929`, `1115-1126`; `settings.ts:103-145` | §6.2 Tune routing and disclosure | Partial | Kill switch only. No floors, no hard facets, no calibration freeze, no persistent warning when Tier 1 floor is below 0.82 (UX-09) |
| `calibration.ts`, `audit.ts` | §6.2 Review calibration; resolve conflicts; review scoped constraints; theme the site | Missing (UI) | Calibration and theme have API only. The conflict card is hard-coded text (`renderer.ts:1042-1044`) while the API correctly returns 501. Scoped constraints are listed without confirm or discard (UX-09) |
| none | §6.2 Monitor and maintain: digest, quota/backup status, provider banners, upgrade rollback | Missing | No status area. `health.ts:19-26` returns fabricated values (`lastRestoreTestStatus: 'passed'`) (UX-09) |

### 1.5 Stack, pipelines and data (§7 to §9)

| File Path | Spec Requirement (explicit and inferred) | Status | Gap Analysis and UX Diagnosis |
| --- | --- | --- | --- |
| `apps/web/package.json`, `renderer.ts` | §7. Astro static site with React islands; React admin SPA (Vite, TanStack Router and Query, Radix); TipTap + CodeMirror | Deviates | Public and admin are string-template SSR mounted inside the API (`server.ts:198-216`). The repo records this as finding `F1`. No component model, no router, no editor library. This is the root cause behind UI-04 and UI-10 |
| `apps/worker/src/worker.ts`; `renderer.ts:1110` | §8. Publish decoupled from enrichment; debounced build; owner sees progress | Flawed UX | The admin banner says "Background enrichment queued". Nothing in `apps/api/src` enqueues a job (verified by search), so the claim is untrue. The worker's `forceNow` publish has no route or button (UX-05) |
| `packages/db/src/schema/index.ts` | §9. Data model | Not re-verified | Out of UX scope. See `KNOWN_ISSUES.md` (P1, P2, P4, P6) |

### 1.6 Algorithms and calibration (§10 to §11)

| File Path | Spec Requirement (explicit and inferred) | Status | Gap Analysis and UX Diagnosis |
| --- | --- | --- | --- |
| `ask.ts:166-196`; `renderer.ts:728-735` | §10.5. Tier routing; Tier 2 shows "needs owner's review, typical reply within 24 hours; status persists" | Flawed UX | Message shown once, then lost on reload. No receipt, no contact, no status page (UX-08, UX-10) |
| `ask.ts:44-58` | §10.8. Degradation ladder; extractive sentence fixed | Partial | Extractive tier label reads "Reduced mode — Extractive excerpts only" (`renderer.ts:732`) rather than the Spec's fixed sentence (CP-07). A 429 rate limit is returned as `tier: 'no_match'` and shown as "Not in records" (UX-10) |
| `packages/core/src/algorithms/*`, `ask.ts` | §10.1 to §10.7. Chunking, gap questions, gate, verification, staleness | Not re-verified | Repo lists open P0s `G1` to `G7` (`KNOWN_ISSUES.md`). UX consequences are covered in UX-10 and UX-08 |
| `calibration.ts`; `packages/core/src/algorithms/calibration.ts` | §11. Four mechanisms; observe, propose, confirm, log, rollback | Missing (UI) | No dashboard: no parameters, proposals, history or rollback control (UX-09) |

### 1.7 UI design system (§12)

| File Path | Spec Requirement (explicit and inferred) | Status | Gap Analysis and UX Diagnosis |
| --- | --- | --- | --- |
| `renderer.ts:137-234`; `styles.ts:190-259` | §12.1 to §12.2. Strata timeline as the one bold element; structure on screen means structure in the data | Flawed UX | Bands are equal-width buttons, not a time axis. The legend promises glyphs for profile (■ ◆ ▲, `renderer.ts:220-222`) but bands draw none (UI-05) |
| `styles.ts:5-80` | §12.3. Colour tokens, 4px spacing scale, radii by role, contrast CI | Partial | Semantic colour, spacing and radius tokens match the Spec's values. No primitive or component tier, no elevation, z-index or motion tokens; `--layout-max` is used but never defined (`renderer.ts:114`); 151 inline `style` attributes and 219 raw `px` values bypass tokens (UI-02). No contrast CI |
| `styles.ts:38-41` | §12.4. Self-hosted Literata, Atkinson Hyperlegible Next, JetBrains Mono; type scale 14 to 44 at 1.2 | Flawed UX | Families are named but there is no `@font-face`; the browser falls back to Georgia and system sans (UI-03). Off-scale sizes in use: 12, 13, 15, 24, 28 (UI-02) |
| `styles.ts:351,364,434` | §12.5. Breakpoints 480/768/1024/1280; admin three panes → two on tablet; phone supports quick log and triage with 44px targets | Flawed UX | Only 1024 is used. Admin collapses straight from three panes to one stack. Several controls are below 44px *(inferred from `min-height:30px` and `34px`, `renderer.ts:212`, `444`)* (UI-06, UI-07) |
| `renderer.ts:236-308` | §12.6 Home | Partial | Statement, strata, list and Ask field are present, in the Spec's order. The "featured" list is every public entry, with no curation (`renderer.ts:289`). Each row makes five repository calls (UX-13) |
| `renderer.ts:634-779` | §12.6 Ask widget states: idle, needs context, answering, Tier 1, Tier 2, Tier 3, no match, disabled, reduced | Partial | Seven of nine states have some rendering. "Needs context" is absent. "Answering" is a text line with no streaming and no disabled button (UX-10) |
| `renderer.ts:938-1029` | §12.6 Admin workspace: Entries \| Editor \| Inspector (Structure, Context, Evidence, Answerability, History) | Flawed UX | The three panes exist as a static layout. No selection, no tabs, no history (UX-04, UX-06, UI-06) |
| none | §12.6 Import triage with `J K A R D S` keys | Missing | See UX-07 |
| `renderer.ts:1110`, `1124`; entire file | §12.7. Undo or clear confirmation for visitor-visible actions; progress for long operations; machine suggestions dashed | Flawed UX | Publish, kill switch and backup drill act immediately with no confirm or undo. Dashed style exists only for facet chips (`styles.ts:321`) (UX-04) |
| `renderer.ts:58-135`, `681-779` | §12.8. WCAG 2.2 AA; keyboard parity; focus into dialogs; `aria-live`; timeline text equivalent; ICU strings; logical CSS properties | Partial | Focus ring, live region on Ask and a text-list timeline exist. No skip link, no `<h1>` on home, no dialogs, theme toggle misbehaves on dark-OS first click, all strings inline, no `lang` per entry (UX-15, CP-06) |
| `renderer.ts` (all) | §12.9. Sentence case; one name per action; schema terms hidden; errors say what happened and what to do | Flawed UX | See CP-01 to CP-07 |
| `packages/core/src/sdk/index.ts`; `renderer.ts` | §12.10. Slot contracts per view; theme conformance in CI | Partial | `DEFAULT_STRATA_THEME` and `verifyThemeConformance` exist; the renderer does not use slots (UI-10) |

### 1.8 Operations, SDK, security, roadmap (§13 to §21)

| File Path | Spec Requirement (explicit and inferred) | Status | Gap Analysis and UX Diagnosis |
| --- | --- | --- | --- |
| `docker/docker-compose.hobbyist.yml`; `app.ts:29-30,50` | §13. Setup wizard (cannot be skipped); admin account first; compose with Dockerfiles; `/healthz` probes | Partial | Compose file present, Dockerfiles absent (finding `F2`). Wizard UI absent. If no `ADMIN_API_TOKEN` is set, the server falls back to a published default token; I used it successfully in my test (UX-01) |
| `packages/core/src/sdk/index.ts` | §14. Plugin SDK contracts | Not re-verified | Out of UX scope |
| `entries.ts:88-232` | §15. Redaction preview is a required human step for public content | Flawed UX | See UX-03 |
| none | §16. Monetization (optional, off) | Missing by design | No action |
| `app.ts:125-136` | §17. Federation (out of scope for v1.0) | Stub | Returns 501 honestly. No action |
| `apps/web/src/web.test.ts` (77 lines, 5 tests) | §18. Playwright for every flow in §6; axe; keyboard flows; Lighthouse; visual regression | Missing | Web tests assert HTML substrings only. No Playwright, axe or Lighthouse config exists in the tree (UX-15) |
| `docs/` | §19. Twelve named docs | Partial | Only `docs/self-hosting.md` exists of the named set. `ui-design-system.md`, `content-model.md`, `profiles.md` and others are absent |
| `README.md`, `KNOWN_ISSUES.md` | §20. Release train v0.1 to v1.0 | Misordered | See executive summary: v0.3 visuals precede v0.1 authoring |
| n/a | §21. Open questions | n/a | No action |

---

## Part 2. Layer 1: Behavioral and interaction architecture (UX)

Scope: routing topology, state machines, task mechanics, system-state coverage and accessibility mechanics. Visual styling, tokens and wording are excluded here and handled in Layers 2 and 3.

### 2.1 UX diagnostic and remediation matrix

| File Path | Flow/State Gap (As-Is diagnosis) | UX Dimension Impacted | Concrete Code/Flow Fix (To-Be, detail in 2.2 to 2.5) |
| --- | --- | --- | --- |
| **UX-01** `apps/api/src/server.ts:216`; `app.ts:29-30,50` | Owner has no way to sign in or set up. A browser at `/admin` gets raw JSON 401. `setupWizardCompleted` is hard-coded `true`. If `ADMIN_API_TOKEN` is unset, a published default token (`lp_pat_default_test_admin_token_001`) grants admin; it worked in my run | Task completion, trust, first-run safety | Add `/admin/login` and `/admin/setup` (2.3.G). For `Accept: text/html`, the auth middleware redirects to `/admin/login?next=…`; JSON clients still get 401. Remove the default-token fallback and refuse to boot without a token until setup completes. Derive the flag from `auth.isSetupCompleted()` |
| **UX-02** `renderer.ts:1074,1104,1118,1130` | Every admin `fetch` omits `X-CSRF-Token` and `Authorization`, so with a cookie session they hit the CSRF 403 (`auth/security.ts:273-275`). No failure branch exists; Publish ignores `res.ok` | Error recovery, feedback, learnability | New `lib/api-client.ts`. It injects the CSRF token returned by `/api/auth/login`, routes 401 to login, shows a persistent inline error with a retry action for 4xx/5xx, and only shows success after `res.ok` |
| **UX-03** `renderer.ts:1071-1088`; `entries.ts:181-232`; `packages/ai` scanner | Redaction preview is optional, and a failed request renders green "✓ No confidential secrets…". In my test the scanner flagged an email but not an `sk-…` key or "NDA". `POST /api/entries` publishes public with no token (verified: secret served at `/work/leaky-1`) | Error prevention, safety, honesty | Make Review a mandatory lifecycle state (2.3.A). Server: reject `visibility: public` on create without a valid token, or force `private` on create. UI: four states (checking / clean / needs review / could not check); only "clean" is ever green. Add the NDA confirmation checkbox the Spec requires |
| **UX-04** `renderer.ts:954-1006,1097-1111,877-884` | Truncated CMS lifecycle (Anti-pattern C). One action, "Publish as is", creates a *public* entry. No draft/save, no edit of existing entries, no revision list, no visibility control, no unpublish, no delete (API exists for all). Empty body is replaced with a stub and published (`:1097`). Slug is manual. Admin list links to `/work/…` which 404s for private entries. No undo or confirm | Task completeness, error prevention, reversibility | Full entry lifecycle and workspace (2.3.A). Routes `/admin/entries`, `/admin/entries/new`, `/admin/entries/:id`, `/admin/entries/:id/history`. Server-side reject empty body. Auto-slug from title with edit. Preview renders drafts through the public renderer behind admin auth |
| **UX-05** `renderer.ts:1110`; `worker.ts:225-260`; no API route | Two meanings of "publish" are collapsed. Visibility change is instant; the static site rebuild is debounced (10 min, 12 per day) and has no UI. "Background enrichment queued" is shown but nothing enqueues (verified) | System status visibility (Nielsen #1), trust | Add `POST /api/publish/now` (worker `forceNow`) and `GET /api/publish/status`. Show a deploy chip in the admin top bar: Queued (next build in 7 min) / Building / Live / Cap reached. Remove or make true the enrichment banner (2.3.A) |
| **UX-06** `renderer.ts:855-871,1011-1027`; `structure.ts:27-147` | The structure loop (the Spec's core value) is read-only. Inspector is bound to `entries[0]`. No accept/change/ignore, no facet confirm, no outcome picker, no evidence attach, no answerability preview, no tabs. Gap questions are a bullet list you cannot answer | Core value delivery, efficiency | Inspector with tabs Structure, Context, Evidence, Answerability, History bound to the selected entry (2.3.C). Wire to the existing `PATCH /api/structure/*` routes. Each gap question becomes a one-tap control with Skip |
| **UX-07** none; `import.ts` | Onboarding and alternative authoring paths are missing: first-run walkthrough, import upload and planner, confidence-sorted triage with `J K A R D S`, guided mode with per-role prompts, quick log (no route or API at all) | Learnability, efficiency, entry-first principle | Add Import (2.3.B), Guided mode and Quick log as modes of `/admin/entries/new`, and a first-run walkthrough launched from `/admin/setup` step 6 |
| **UX-08** `renderer.ts:901-915`; `inbox.ts:15-70`; `ask.ts:166-196` | Escalation loop is open at both ends. Owner list is read-only (no approve, edit or reject). Visitor side captures no contact, so an approved reply cannot be delivered; the 24-hour promise has no receipt or status page. The draft is a static template string (`ask.ts:175`, repo finding `G7`) | Task completion, trust, service promise | Inbox as a queue with editor and deliver action (2.3.F). Tier 2 asks for an email or notify channel (optional, with consent line) and returns a receipt URL `/ask/status/:token` |
| **UX-09** `renderer.ts:929-931,1032-1059,1115-1126`; `audit.ts:7-20`; `health.ts:19-26`; `settings.ts` | Admin operations are static, fabricated or absent. The topology-conflict card is hard-coded text while the API returns an honest 501. Scoped constraints list lacks confirm and discard. Kill-switch UI starts from a local `answeringEnabled = true`, ignoring server state. Calibration, routing floors, theme, providers, notifications and backups have no screens. `health.ts` and `settings.ts` return invented "passed" and "verified" statuses | Honesty invariant, system status, control | Dedicated admin areas (2.2). Every status field is either measured or rendered as "Not configured" / "Not available yet". Kill switch reads `GET /api/settings` on load and shows state with `aria-pressed` |
| **UX-10** `renderer.ts:634-779`; `ask.ts:44-58,166-196` | Ask flow gaps. No `needs_context` state; facets are two hard-coded inputs revealed by a keyword heuristic that duplicates the server classifier (`:652`). Entry-scoped asks lose their scope on screen. A 429 comes back as `tier: 'no_match'` and displays as "Not in records". Submit is not disabled while waiting (double submit burns the hourly limit). No streaming. Example questions are hard-coded, not from entries. Non-JSON errors fall to a misleading "Origin unreachable" | Error recovery, flow clarity, honesty | State machine in 2.3.D. Server returns an explicit `needs_context` payload listing hard facets from the domain config, a `rate_limited` tier, and `retryAfter`. Client shows a scope chip, disables submit while pending, and distinguishes network, 429 and 5xx |
| **UX-11** `renderer.ts:833-847` | Booking is an `alert()`; no endpoint, no storage, no contact field, facets not carried (Tier 3 dead end) | Task completion | `POST /api/book` storing question, facets, contact, optional slot link; confirmation page with receipt; owner notified through the notification adapter (2.3.D) |
| **UX-12** `renderer.ts:137-234` (`:183`, `:211`, `:220-223`), `594-632` | Time-travel does not travel. The as-of date is not carried to entries (links go to `/work/slug`, which shows the latest revision), to Ask, or to nav. Default date is a fixed `2026-10-19`, so "Apply" without edits excludes recent entries (verified). Band click hard-codes day 28. Keyboard hint promises arrows, Page Up/Down and Enter, but no handler exists. All-filtered result has no empty state | Flow continuity, learnability, accessibility | `?as_of=` becomes a site-wide mode (2.3.E): persisted in the URL, shown in a sticky "Viewing as of…" bar on every page, added to entry links and Ask. Default to *today*. Implement the documented keys in `client/strata-keyboard.ts` |
| **UX-13** `renderer.ts:58-76`, `236-308`, `481-592`; `server.ts:198-231` | Anti-pattern A. See 2.2 for the full IA critique. Eight flat nav items incl. **Admin** for anonymous visitors; `/now /uses /book /about` mixed with primary destinations or unreachable; `/build/:slug` 404; `/writing` and `/work` duplicate each other and cross-link; "featured" is every entry; `/work` filters outcome only; Home makes five repo calls per entry | Findability, hierarchy, performance | Route tree and navigation rules in 2.2 |
| **UX-14** all views | System-state coverage is thin. See 2.4 | Resilience, Spec "degrade, don't fail" | Shared state components and per-view state table in 2.4 |
| **UX-15** `renderer.ts:58-135` (`:126`, `:183`, `:212`, `:444`), `styles.ts:242`; `web.test.ts` | Accessibility mechanics. No skip link (`#main-content` exists, unreferenced). Home has no `<h1>` (verified). Theme toggle: with a dark OS and no saved choice, the first click sets "dark" (no visible change). Timeline bands are `<button onclick=location.href>` (navigation as buttons). Dimmed bands use `opacity:.35` *(contrast likely below 4.5:1, inferred)*. Controls with `min-height` 30 and 34px *(inferred below 44px)*. `localStorage` is unguarded. Static alpha banner uses `role="alert"`. No Playwright or axe | Accessibility (WCAG 2.2 AA), motor access | Matrix in 2.5 |
| **UX-16** `renderer.ts:370-390` | The structured view renders only spans carrying an *accepted* role annotation and silently drops everything else. On `redis-distributed-locks-2021` (L3): 3 spans, 1 shown, 603 characters lost, including the lesson (verified). Violates "unlabeled is valid" (§3.5) and "nothing breaks" (§5.2) | Data integrity of reading, trust | Render every span in document order. Labeled spans get the role section wrapper; unlabeled spans render as plain paragraphs between sections. Add a regression test: concatenated text of structured view equals the article view text |

### 2.2 Information architecture and navigation topology (replaces the flat nav)

**Diagnosis (Anti-pattern A).** The primary bar treats every feature as equal. Tab placement should follow three properties: audience (visitor or owner), frequency, and whether the feature is a *place* (has its own URL and content) or an *action* (a short task that returns you to context). Applying that:

| Feature | Audience | Frequency | Is it a place or an action | Right container |
| --- | --- | --- | --- | --- |
| Work, Writing, Build, Timeline | Visitor | High | Places | **Primary nav** (as the Spec's wireframe shows) |
| Ask (global) | Visitor | High, but also needed *in context* | Place and action | Primary nav item **plus** an inline widget on Home and every entry (an action, in the margin rail) |
| Ask about this entry | Visitor | Medium | Action | **Margin-rail widget that answers in place**, with "Open in full Ask" as the escape hatch. Not a navigation |
| About, Now, Uses | Visitor | Low | Places | **Secondary nav**: footer and an "About" menu. Not primary |
| Book | Visitor | Low, but the terminal step of Ask Tier 3 | Action | **Contextual CTA** inside Ask results, entry rail and About. A footer link, not a tab |
| Theme toggle | Visitor | Rare | Utility | Utility slot at the end of the header, icon button with `aria-pressed` and visible label on focus |
| Admin | Owner | n/a | Separate app | **Not in the public nav.** Own hostname per §13.4. No link from public pages |
| Time-travel "as of" | Visitor | Medium | Mode, not a place | **Sticky as-of bar**, available from the Timeline and persisted across pages |

**Target public route tree.**

```
/                        Home: statement, strata timeline (compact), recent list, Ask field
/work                     Structured profiles; filters: domain, stack, outcome (all four outcome values)
/work/[slug]              Entry (structured or article; ?view=article)
/writing                  All entries, chronological, tag filter
/writing/[slug]           301 to /work/[slug] if the entry has a structured profile, else canonical here
/build                    Ventures index
/build/[slug]             Venture: overview, click-to-load embed, dev-log, outcome notes, evidence
/timeline                 Time-travel: strata (full width), as-of bar, results, text list expanded by default
/ask                      Full Ask: scope chip, context form, answer states, receipt
/ask/status/[token]       Tier 2 receipt: pending, answered, or booking offer
/book                     Booking request with question and facets prefilled; confirmation
/about  /now  /uses       Secondary nav
/rss.xml  /sitemap.xml    Feed (valid XML, autodiscovery link in <head>) and complete sitemap
/404                      HTML not-found page with search and links to Work, Writing, Ask
```

**Primary navigation rules.** Exactly five links in Spec order (Work, Writing, Build, Timeline, Ask), the owner name as the home link, and the theme toggle. About, Now, Uses, Book and the RSS link move to the footer. Mark the current section with `aria-current="page"`, and make an entry page count toward the section it was reached from (today every entry page activates "Work", `renderer.ts:478`).

**Home.** Make "featured" real: an owner-set flag with a fallback to the five most recent entries, not every entry. Compute list rows from one repository query that returns revision, level and alert flags, not five calls per entry (`renderer.ts:242-257`).

**Target admin route tree and navigation pattern (Anti-pattern B).** Replace the single page with an application shell: a left rail of grouped sections on desktop, a bottom bar with four items on phones, and a top bar that holds global status (deploy chip, automated-answering state, alert count). The Spec's nine areas plus the Spec's owner flows group by *frequency and intent*:

```
/admin/login   /admin/setup            Auth and first-run wizard (outside the shell)
/admin                                 Today: a needs-attention queue, not a settings page
   Daily work (high frequency)
   /admin/entries                      List with filters; /new (modes); /:id editor + inspector; /:id/history
   /admin/import                       Planner, progress, triage
   /admin/inbox                        Escalations queue; /:id review and reply
   Trust and quality (weekly)
   /admin/audit                        Topology conflicts; scoped constraints
   /admin/calibration                  Parameters, proposals, history, rollback
   /admin/routing                      Floors, hard facets, disclosure line, kill switch, freeze calibration
   /admin/structure                    Profiles, facet vocabulary, hard-constraint settings
   Site (occasional)
   /admin/ventures                     Create and edit ventures
   /admin/pages                        Edit Now, About, Uses text; credentials list
   /admin/theme                        Live preview, tokens, per-view overrides
   /admin/publish                      Deploy history, publish now
   System (rare)
   /admin/settings/providers           Providers, data classes, budgets
   /admin/settings/notifications       Adapter and test
   /admin/settings/backups             Schedule, last restore test, export
   /admin/settings/security            Password, TOTP, passkeys, API tokens
   /admin/health                       /healthz detail, provider and model availability
```

**"Today" is the replacement for the dump page.** It shows only things that need the owner: escalations due (with time remaining), suggestions waiting (count, link to the highest-value entry), import status, alerts (disk, backup, provider), and the last deploy. When everything is clear it says so. High-frequency creation lives one click away; low-frequency system settings sit under a collapsed "System" group.

**Progressive disclosure rules.** (1) Settings that can harm visitors (Tier 1 floor, kill switch) live in Routing, not System, because the owner reaches for them under pressure. (2) Advanced facets and calibration appear only after the corresponding feature has data. Calibration shows "Not enough history yet (12 of 50 needed)" instead of empty controls. (3) The inspector never shows a percentage, per §3.3.

### 2.3 Core workflow and state-machine redesign

#### 2.3.A Entry authoring, preview and publishing pipeline (Anti-pattern C)

Two state machines run in parallel and the UI must keep them visibly separate.

**Entry state (per entry).**

| State | Meaning | Visibility field | Allowed transitions | Guard |
| --- | --- | --- | --- | --- |
| Draft | Being written; never visible to visitors | `private` | Save (new revision), Preview, Request publish, Delete | Only a body and a date are required (§1, §4.3). No other field blocks Save |
| In review | Redaction preview shown | `private` | Confirm and publish, Back to draft | Preview must complete ("could not check" blocks); NDA checkbox answered; flagged items either fixed or acknowledged |
| Published | Live at its URL after the next deploy | `public` | Edit (creates a revision), Unpublish, Make unlisted | Server accepts the transition only with a signed token bound to the *current* body hash (already built, `entries.ts:249-266`). Extend to create |
| Unlisted | Reachable by link, not listed or cited | `unlisted` | Publish, Unpublish | Same token as Published |
| Unpublished | Returned to Draft; undo window | `private` | Re-publish, Delete | Confirmation names what disappears and when the static site updates |

**Site deploy state (global).** Idle, Queued (with countdown), Building, Live, Failed (with reason), Cap reached. "Publish now" is available from the top bar and from the confirmation panel, and is the only way to skip the 10-minute debounce.

**Editor workspace blueprint** (route `/admin/entries/:id`, desktop three panes; tablet two panes with the inspector as a right drawer; phone single column):

```
Top bar:   [Entry title (editable)]   State chip: Draft | Saved 2 s ago   [Preview] [Publish…]   Deploy chip
Left:      Entries list with filters (State, Profile, Level, Venture, Search); current entry highlighted
Centre:    Editor: Rich text | Markdown toggle; slash menu for headings, code, image (alt text required)
           Suggested role markers in the margin (dashed, "suggested": Accept / Change / Ignore)
           Date row: [exact | range | estimated] picker + "Writing about something earlier?" (Yes/No)
           Sticky footer: [Save draft]  [Preview]  [Publish…]   "Good enough" is the Publish path, always on
Right:     Inspector tabs: Structure | Context | Evidence | Answerability | History
```

Rules:

- **Autosave is a draft buffer, not a revision.** Revisions are immutable (§3.11), so *Save draft* creates a revision explicitly, while autosave writes to a local draft buffer and shows "Unsaved changes". Leaving the page with unsaved changes prompts.
- **Publish… opens a focus-trapped dialog** (the Review state) with, in order: the redaction preview result and flagged lines, the NDA question, the visibility choice (Public / Unlisted), and the deploy choice ("Publish now" / "Publish with the next build"). Success shows a toast with **Undo** for 30 seconds (§12.7) and a link to the live URL once the deploy is Live.
- **Preview** renders the draft through the public renderer at `/admin/entries/:id/preview` in an iframe-free side panel with a width switcher (phone, tablet, desktop) and an as-of selector.
- **Empty or whitespace body** is a validation error on both client and server; the stub fallback is deleted.
- **Nothing blocks Save or Publish for missing structure** (§1). The sidebar shows gap questions (at most three) with Skip.
- **Delete** shows the report the deletion job will produce (revisions, spans, claims, embeddings) before confirming (§15).
- **Honest enrichment status.** After publish, the inspector shows "Suggestions pending" only if the enrich job exists. Until enqueueing is implemented, say nothing.

Target files: `apps/web/src/pages/admin/entries/editor.ts`, `list.ts`, `publish-dialog.ts`, `preview.ts`; `apps/web/src/client/admin/editor.ts` (island); `apps/api/src/routes/entries.ts` (reject public create without token; reject empty body); new `apps/api/src/routes/publish.ts`.

#### 2.3.B Import and triage

`/admin/import` has three steps shown as a stepper: **Add** (drop files, paste, or connect a source), **Plan** (calls `/api/import/plan`; show tokens, ETA within free limits, and the clearly labelled "pay a little, finish today" option without a default selection, per §21), **Triage**. Triage rows show the item, suggested profile, date and certainty, and facets with their source quote. Keys: `J/K` move, `A` accept, `R` reassign, `D` set date, `S` skip; a visible key legend and an on-screen button for every key. Bulk accept by source or confidence tier. *Publish as is* stays available at every step and routes through the Review dialog for each public item (the server already demands a token per item on `publishAsIs`, `import.ts:135-155`). Long operations show progress, can be cancelled, and survive reload (job state from the server). Targets: `pages/admin/import/{add,plan,triage}.ts`, `client/admin/triage-keys.ts`.

#### 2.3.C Structure review loop (inspector)

| Tab | Content | Actions (API) |
| --- | --- | --- |
| Structure | Four-step bar with plain labels; "Unlocks" sentence; suggested role markers | Accept, Change role, Ignore (`PATCH /api/structure/annotations/:id`). Ignore is remembered |
| Context | Facets as chips with source quote; dashed when suggested | Confirm, Edit, Reject (`PATCH /facets/:id`); add facet from the domain vocabulary |
| Evidence | Attached items with verification state | Add link, commit or file (`POST /evidence`); explanatory line about what verification does not prove |
| Answerability | Example questions this entry can support now, and "one more step" prompts | Each gap question is answerable inline with Skip (`generateGapQuestions`) |
| History | Revisions with written-at, hindsight flag, diff | Restore as new revision |

The inspector follows the *selected* entry, not the first one.

#### 2.3.D Visitor Ask, escalation and booking

```
Idle → (submit) → Classifying →
   lookup:    Answering → Tier 1 answer | No match | Reduced (extractive)
   advisory:  Needs context (one form; each field skippable) → Answering → Tier 1 | Tier 2 | Tier 3
   any:       Disabled (owner paused) | Rate limited (retry-after) | Network error (retry)
Tier 2 → Receipt (optional contact) → /ask/status/[token]: Pending → Answered | Booking offered
Tier 3 → /book (question and facets prefilled) → Confirmation
```

Behaviours to implement: the hard-facet fields come from the domain config, not two literals; "Skip" caps the answer and says why; the entry scope shows as a removable chip; the submit button disables while pending; streaming text updates a polite live region with a visible "Stop" control; the Tier 2 receipt persists in `sessionStorage` and in a shareable status URL; the example questions are generated from entries with a fallback of none, not three invented ones. Targets: `pages/public/ask.ts`, `client/ask-widget.ts`, `pages/public/ask-status.ts`, `pages/public/book.ts`; API `ask.ts` returns `{tier:'needs_context', requiredFacets:[…]}` and `{tier:'rate_limited', retryAfter}`; new `book.ts` route.

#### 2.3.E Time-travel as a site-wide mode

A sticky bar appears on every page when `as_of` is set: "Viewing as of March 2021 · Reset". Entry links, Ask and the strata keep the parameter. Entry pages show the revision that existed on that date (§3.11). The strata component implements the Spec's keys: Left/Right move by entry, Page Up/Down by year, Enter opens, Home/End jump to ends; with reduced motion, changes are instant. Provide a date field for assistive-technology and mobile users and a text list expanded by default on narrow screens. Empty result: "Nothing was recorded by this date. Move the cursor later."

#### 2.3.F Escalation inbox

List (sorted by due time, with a time-remaining chip) and a detail view with: the visitor question, class, facets with matched/mismatched/unknown, the verified draft in an editor, the cited passages, and actions **Approve and send**, **Edit and send**, **Reject** (with the optional "is this a technical constraint?" prompt that proposes a scoped constraint, shown with its source quote). Sending uses the visitor's chosen channel; if none exists, the reply publishes to the receipt URL. Edit size is recorded as the quality signal (already implemented, `inbox.ts:23-40`). Phone layout supports review and approval with 44px targets (§12.5).

#### 2.3.G First-run and sign-in

`/admin/setup` is a six-step wizard that cannot be skipped (§13.13): admin account, hosting preset, provider keys with live validation and per-provider data classes, notification adapter with a real test, backup destination with first run, theme and first deploy. Step 6 ends in the first-run walkthrough (one worked example across the profile prompts, ending "Now try one of yours"). `/admin/login` takes username, password and TOTP; it explains throttling states ("Too many attempts. Try again in 14 minutes.") and redirects to `next`.

### 2.4 System-state coverage matrix

Legend: **Y** present and adequate, **\~** partial, **—** absent. "N/A" where the state cannot occur.

| View | Loading | Empty | Error | Partial | Offline / origin down | Permission denied | Fix (shared component) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Home, Work, Writing, Build | N/A (static) | \~ ("No matching entries found." on index only; Home and Build show a blank list) | — | — | Y (static) | N/A | `EmptyState` with a next action; "No entries yet" for owner shows "Paste a document to start" |
| Entry | N/A | N/A | \~ (HTML 404 for private) | — (structured view silently partial, UX-16) | Rail Ask hides when `/healthz` fails | N/A | `NotFound` page; rail checks `/healthz` with short timeout (§13.7) |
| Timeline | N/A | — (all filtered out) | — (bad `as_of`) | — | Y | N/A | `EmptyState`; validate and explain invalid dates |
| Ask | \~ (text line only) | — | \~ (one generic message) | — (needs context) | \~ | N/A | `AskStateRegion` rendering all nine Spec states plus rate-limited and network error |
| Book | — | N/A | — | — | — | N/A | Submit states and confirmation |
| Admin shell | — | — | \~ (JSON 401) | — | — | \~ (raw 401) | Login redirect; `PermissionDenied` page; session-expiry dialog preserving drafts |
| Entries list | — | — | — | — | — | — | Skeleton rows; "No entries yet. Paste a document to start." |
| Editor | — | N/A | — (silent failure) | \~ | — (no draft buffer) | — | Save status, retry banner, local draft recovery |
| Inspector | — | \~ ("All core fields present" text only) | — | — | — | — | Per-tab empty and error states |
| Inbox | — | Y ("No pending escalations") | — | — | — | — | Skeleton; overdue state with danger chip |
| Import | — | — | — | — | — | — | Whole area missing; includes resumed-after-reload and cancelled states |
| Calibration, Audit | — | — | — | — | — | — | "Not enough history yet (n of N)" for off-by-default mechanisms |

### 2.5 Interaction mechanics and WCAG 2.2 AA matrix

| Check | As-Is (file) | Fix |
| --- | --- | --- |
| 2.4.1 Bypass blocks | No skip link; `#main-content` exists (`renderer.ts:111`) | First element in `<body>`: `<a class="skip-link" href="#main-content">Skip to content</a>` |
| 1.3.1 / 2.4.6 Headings | Home has no `<h1>` (verified). Entry headings use inline sizes | One `<h1>` per page; heading levels follow structure, never size |
| 4.1.2 Name, role, value | Theme toggle has no pressed state; strata bands are buttons that navigate (`:183`) | Toggle: `aria-pressed` and persistent label. Bands: `<a href="/timeline?as_of=…">` |
| Theme logic | `current === 'dark' ? 'light' : 'dark'` ignores system preference (`:126`) | Read `matchMedia('(prefers-color-scheme: dark)')` when no attribute is set. Wrap `localStorage` in `try/catch` |
| 2.1.1 Keyboard; §12.6 keys | Documented timeline keys and triage keys do not exist | Implement and test with Playwright (Appendix B) |
| 2.4.3 / 2.4.11 Focus | No dialogs yet; none of the focus-in, focus-return behaviour exists | Dialog primitive with focus trap, `Esc`, return focus, `aria-modal` |
| 4.1.3 Status messages | Ask region is `aria-live="polite"` (good); admin banner is polite (good); alpha banner is `role="alert"` on every load (`:918`) | Alpha banner as `role="note"`; reserve `alert` for failures |
| 2.5.8 Target size (min 24px) and §12.5 (44px) | `min-height:30px` and `34px` controls (`:212`, `:444`); chips used as filter links | Token `--size-target-min: 44px` on touch (`pointer: coarse`); chips-as-links get padding to 44px hit area |
| 1.4.1 Use of colour | Dimmed future bands are signalled by opacity and the banner text only | Add an explicit "after this date" text or icon in the band's accessible name and a hatch pattern |
| 1.4.3 Contrast | `opacity:.35` over text *(inferred failure)*; no contrast CI (§12.3) | Do not use opacity for text; compute pairs in CI |
| 1.4.10 / 1.4.4 Reflow, zoom | Not tested | Add 200% zoom and 320px checks to Playwright |
| Tooltips as sole help | `title="Schema role: …"` (`:383`) is unreachable on touch and by keyboard | Replace with a disclosure button (see CP-01) |
| §18.1 Frontend tests | 5 string-match tests | Add Playwright specs for each §6 flow, axe on every route, keyboard specs for timeline, Ask and triage, and a no-JS readability smoke test |

---

## Part 3. Layer 2: Visual, token and component system architecture (UI)

Scope: token taxonomy, component hierarchy and APIs, responsive rules, aesthetic craft and package structure. Built on the Layer 1 states; flow logic and wording are excluded.

### 3.1 UI diagnostic summary

| File Path | As-Is diagnosis | To-Be blueprint |
| --- | --- | --- |
| **UI-01** `apps/web/src/renderer.ts:41-56`, `:994` | The content renderer handles `#`, `##` and paragraphs only, and escapes everything else. Verified: a body with `### heading`, a list, a fenced `ts` block and a link renders as four literal paragraphs. The authoring control is an 8-row `<textarea>` | 3.5: Markdown pipeline (CommonMark + GFM, sanitised, allow-listed MDX components, syntax highlighting) and the `Editor` component (TipTap rich text with CodeMirror source toggle) |
| **UI-02** `apps/web/src/styles.ts:5-80`; `renderer.ts` (151 inline `style=` attributes, 219 raw `px`) | Tokens exist for colour, spacing and radius, in one flat semantic tier. Missing: primitive tier, component tier, size, elevation, z-index, motion, breakpoint and text-style tokens. `--layout-max` is referenced (`renderer.ts:114`) and never defined, so the footer width is unconstrained. The dark palette is declared twice (`styles.ts:44-62` and `64-80`), so the two copies can drift. Font sizes in use: 13px (22 times), 14px (17), 15px (5), 12px (3), 24px (1), 28px (1), none on the Spec's 14/16/18/21/25/30/36/44 scale. **Measured contrast:** the control border token `--rule` is 1.52:1 (light) and 1.35:1 (dark) against `--surface-raised`; §12.3 requires 3:1 for UI boundaries. Dimmed timeline text (`opacity:.35`) is 2.14:1 light and 2.91:1 dark against the page; text needs 4.5:1 | 3.2 and 3.3 |
| **UI-03** `styles.ts:38-41` | `--font-reading`, `--font-ui`, `--font-code` name Literata, Atkinson Hyperlegible Next and JetBrains Mono, but no `@font-face` exists and no font files ship. Every visitor sees Georgia and system sans. This violates §12.4 (self-hosted, subset, `font-display: swap`) and the reading-comfort goal | `tokens/fonts.css` with self-hosted subset WOFF2 files, OFL licences listed in `THIRD_PARTY_NOTICES` |
| **UI-04** `renderer.ts:266,517,606` (entry rows), `:300,467,645` (ask forms), `:533-537,673-675` (chips as links and buttons), `:444` and 8 other inline-styled buttons, 12 inline-styled labels | No component layer. The entry row is hand-built three times with different content; there are three separate Ask forms; chips are used as navigation links and as buttons; `.btn` has one variant and no loading, disabled or invalid states; forms have no `Field` abstraction, so labels, hints and errors are styled by hand 12 times | 3.4: atomic hierarchy and component APIs |
| **UI-05** `renderer.ts:137-234`; `styles.ts:190-259` | The strata timeline, the Spec's one bold element, is a row of equal-width buttons. It is not a time axis; empty months are skipped. The legend promises ■ ◆ ▲ by profile (`:220-222`) but no band carries a glyph, so colour-or-shape encoding is absent. Height formula `Math.min(110, 44 + n*24)` is a magic number. Bands have a single accent colour | 3.7: strata redesign |
| **UI-06** `renderer.ts:850-1140`; `styles.ts:427-445` | Admin is one page: a three-pane editor shell followed by a grid of unrelated panels. There is no application shell, no density system, no header status area. Below 1024px the shell becomes one long stack (the Spec specifies two panes on tablet) | 3.6 and the `AdminShell` template in 3.4 |
| **UI-07** `styles.ts:351,364,434`; `renderer.ts:459-473` | One breakpoint (1024). Spec breakpoints 480/768/1024/1280 are not tokens. The margin rail stacks after the whole body on narrow screens instead of following the relevant paragraph. No `pointer: coarse` rules; interactive controls at 30, 34, 36 and 40px *(Spec: 44px on touch)*. Wide tables and strata rely on ad-hoc `overflow-x` | 3.6 |
| **UI-08** `renderer.ts:382-385,427-431,346-348`; `styles.ts:327-342` | The role classes `.role-marker` and `.role-goal` to `.role-lesson` are defined and never used (verified: 0 occurrences in `renderer.ts`); the structured view re-implements the same border with inline styles. Claim cards are inline-styled boxes, against §12.1 ("deliberately avoids card grids"). Date line, context strip and rail headings use three different spacing rhythms | 3.4 (`RoleSection`, `ClaimItem`) and 3.7 |
| **UI-09** entire UI | No surface craft beyond rules and a single accent: no optical alignment, tabular numerals, text-wrap tuning, code styling, selection colour, or motion that answers actions (the file has no transitions at all, only a reduced-motion reset at `styles.ts:470`) | 3.7 |
| **UI-10** `apps/web/src/renderer.ts` (1,140 lines), `styles.ts`, `packages/core/src/sdk/index.ts` | One file holds layout, ten pages, the admin app and three inline scripts. The theme contract (`DEFAULT_STRATA_THEME`, `verifyThemeConformance`) exists in core but the renderer neither exposes slots (§12.10) nor consumes theme tokens at build time. Inline scripts and `onclick` handlers force `script-src 'unsafe-inline'` in the CSP (`app.ts:59`) | 3.8: package topology and slot contract |

### 3.2 Design token architecture (three tiers)

Tier 1 **primitives** are raw values with no meaning; tier 2 **semantic** tokens give meaning and switch by theme; tier 3 **component** tokens bind semantics to one component. Components may reference tiers 2 and 3 only; primitives are never used directly in markup or component CSS (enforced by a lint rule, 3.8).

```css
/* tokens/primitive.css  (tier 1) */
:root {
  /* neutral */
  --n-0:#FFFFFF; --n-50:#F3F5F4; --n-200:#CBD3D8; --n-500:#6B7B88; --n-600:#4B5A66; --n-900:#14202A;
  --nd-900:#0F1A22; --nd-800:#16232D; --nd-700:#2A3946; --nd-500:#7E8F9C; --nd-300:#A3B2BD; --nd-100:#E6ECEF;
  /* accent and roles (values from Spec §12.3) */
  --indigo-600:#3A4FD0; --indigo-300:#9AA8FF;
  --blue-600:#2F5FA8;  --blue-300:#8DB4EA;   --slate-500:#5A5F6B; --slate-300:#B4B9C4;
  --amber-700:#9A6A00; --amber-400:#E2B34A;  --violet-700:#5B3FA0; --violet-300:#B9A4EE;
  --green-700:#1F7A5A; --green-300:#6FCBA3;  --rose-700:#A13A6B;   --rose-300:#EE9CC2;
  --amber-800:#8A5A00; --amber-300:#F5C451;  --red-700:#B42318;    --red-400:#F97066;
  /* scales */
  --space-1:4px; --space-2:8px; --space-3:12px; --space-4:16px; --space-6:24px; --space-8:32px; --space-12:48px; --space-18:72px;
  --font-size-1:14px; --font-size-2:16px; --font-size-3:18px; --font-size-4:21px;
  --font-size-5:25px; --font-size-6:30px; --font-size-7:36px; --font-size-8:44px;   /* ratio 1.2 */
  --radius-2:2px; --radius-6:6px; --radius-12:12px;
  --duration-fast:120ms; --duration-base:160ms; --duration-slow:240ms;
  --ease-out:cubic-bezier(.2,.8,.2,1);
  --bp-sm:480px; --bp-md:768px; --bp-lg:1024px; --bp-xl:1280px;
}

/* tokens/semantic.css  (tier 2), light default */
:root {
  --surface-page:var(--n-50);   --surface-raised:var(--n-0);   --surface-overlay:var(--n-0);
  --text:var(--n-900);          --text-muted:var(--n-600);     --text-on-accent:var(--n-0);
  --rule:var(--n-200);          /* decorative dividers only */
  --border-control:var(--n-500);/* 3:1 or better against both surfaces: inputs, buttons, chips */
  --accent:var(--indigo-600);   --focus-ring:var(--accent);
  --role-goal:var(--blue-600); --role-approach:var(--slate-500); --role-friction:var(--amber-700);
  --role-decision:var(--violet-700); --role-outcome:var(--green-700); --role-lesson:var(--rose-700);
  --role-neutral:var(--slate-500);       /* custom roles without a token (Spec §12.3) */
  --status-warn:var(--amber-800); --status-error:var(--red-700); --status-ok:var(--green-700);
  --state-future-text:var(--n-600);      /* replaces opacity:.35 on dimmed layers */
  --state-provisional-border:var(--text-muted); /* dashed outline for machine suggestions */
  --shadow-overlay:0 8px 24px rgb(20 32 42 / .16); /* elevation only for overlays */
  --z-base:0; --z-sticky:100; --z-overlay:200; --z-toast:300;
  --size-target-min:44px; --size-layout-max:1180px; --measure-reading:68ch; --rail-width:320px;
  --text-body-size:var(--font-size-3); --text-body-leading:1.65; --text-ui-size:var(--font-size-2);
}
/* tokens/themes/dark.css: ONE definition, applied for [data-theme=dark] and for system dark when unset */
:root[data-theme="dark"], :root:not([data-theme="light"]) { /* inside @media (prefers-color-scheme: dark) for the second selector */
  --surface-page:var(--nd-900); --surface-raised:var(--nd-800); --text:var(--nd-100); --text-muted:var(--nd-300);
  --rule:var(--nd-700); --border-control:var(--nd-500); --accent:var(--indigo-300);
  --role-goal:var(--blue-300); /* … remaining roles and status from primitives */
}
/* tokens/themes/contrast.css: [data-contrast=more] and @media (prefers-contrast: more): text 7:1, --border-control 4.5:1, 2px rules */

/* tokens/component.css  (tier 3) */
:root {
  --button-height-md:var(--size-target-min); --button-height-sm:32px;  /* sm only on pointer:fine */
  --button-bg:var(--accent); --button-fg:var(--text-on-accent); --button-radius:var(--radius-6);
  --chip-radius:var(--radius-2); --chip-border:var(--border-control);
  --field-border:var(--border-control); --field-radius:var(--radius-6);
  --role-section-rule-width:3px; --banner-rule-width:4px;
  --strata-band-min:44px; --strata-band-max:120px;
  --admin-nav-width:240px; --admin-inspector-width:340px;
}
```

Notes: (1) Text, link and button pairs in the current palette already pass (measured: body text 15.10:1, muted 6.49:1, link 5.98:1, button 6.54:1 in light), so the *values* stay; the structural fix is the new `--border-control` and `--state-future-text`. (2) The role colours are borders and markers, not text, and all exceed 3:1 on `--surface-raised`, so they remain valid. (3) CI computes every semantic text/surface pair and every `--border-control` pair in both themes and in the contrast theme, and fails below 4.5:1 and 3:1 respectively (§12.3).

**Typographic scale and semantic text styles.**

| Style | Face | Size token | Weight and leading | Used for |
| --- | --- | --- | --- | --- |
| `text-display` | Reading | `--font-size-5` (25) | 500, 1.4 | Owner statement |
| `text-h1` | Reading | `--font-size-6` (30) | 600, 1.25 | Page title |
| `text-h2` | Reading | `--font-size-4` (21) | 600, 1.3 | Section heading |
| `text-h3` | Reading | `--font-size-3` (18) | 600, 1.35 | Sub-section, role label |
| `text-body` | Reading | `--font-size-3` (18) | 400, 1.65, measure 62 to 70ch | Entry body |
| `text-ui` | Interface | `--font-size-2` (16) | 400 and 600, 1.5 | Controls, nav |
| `text-ui-sm` | Interface | `--font-size-1` (14) | 400 and 600, 1.45 | Meta, chips, rail, labels |
| `text-code` | Code | `--font-size-1` (14) | 400, 1.6 | Code only (never decorative labels) |

Headings differ by weight and size together, per §12.4. Sentence case throughout; no tracked-out all caps (note: `renderer.ts:428` upper-cases claim kinds via `toUpperCase()`, which contradicts §12.1; counted under CP-02).

### 3.3 Hardcoded-to-token migration table

| File Path | Current hardcoded value | Proposed semantic or component token |
| --- | --- | --- |
| `renderer.ts:114` | `max-width:var(--layout-max)` (undefined); `margin:48px auto 24px; padding:16px 24px; font-size:14px` | `.site-footer` class using `--size-layout-max`, `--space-12`, `--space-6`, `--space-4`, `text-ui-sm` |
| `styles.ts:116`, `:168` | `max-width:1180px` (twice) | `--size-layout-max` |
| `styles.ts:353` | `minmax(0,68ch) 320px` | `--measure-reading`, `--rail-width` |
| `styles.ts:436` | `240px 1fr 340px` | `--admin-nav-width`, `--admin-inspector-width` |
| `renderer.ts:80` | `height:24px; margin-right:8px` on logo | `.site-brand__mark` with `--space-6` height and `--space-2` gap |
| `renderer.ts:85` | `margin:0; border-radius:0; justify-content:center` on staging banner | `Banner` variant `tone="info" bleed` |
| `renderer.ts:89` | `margin-top:6px; font-size:13px` | `text-ui-sm`, `--space-2` |
| `renderer.ts:181` | `Math.min(110, 44 + n*24)` | CSS `height: clamp(var(--strata-band-min), calc(var(--n) * 1ch + 36px), var(--strata-band-max))` with `--n` set per band |
| `renderer.ts:206`, `:289`, `:296`, `:439`, `:616`, `:639` | `font-size:18px / 21px / 30px` with inline `font-family:var(--font-reading)` | `text-h3`, `text-h2`, `text-h1` classes |
| `renderer.ts:212` | `min-height:34px; padding:4px 12px` | `Button size="sm"` with `--button-height-sm` (`pointer: coarse` raises to `--size-target-min`) |
| `renderer.ts:444` | `padding:4px 10px; min-height:30px; font-size:13px` | `Button variant="secondary" size="sm"` |
| `renderer.ts:346`, `:525`, `:574` | `gap:8px / 6px; margin:12px 0` on chip rows | `.chip-row` with `--space-2` gap |
| `renderer.ts:382` | `margin-bottom:24px; padding-left:16px; border-left:3px solid var(--role-…)` | `RoleSection` using `--role-section-rule-width`, `--space-6`, `--space-4` and the role token |
| `renderer.ts:427` | `padding:8px; border:1px solid var(--rule); background:var(--surface-raised)` | `ClaimItem` using `--space-2` and `--border-control`; drop the box, use a left rule |
| `renderer.ts:957-1002` | 12 labels with `font-size:13px; font-weight:600; display:block` | `Field` label style `text-ui-sm` at 600 |
| `renderer.ts:955`, `:966` | `grid-template-columns:1fr 1fr` and `1fr 1fr 1fr`; `gap:12px` | `.form-grid` with a container query and `--space-3` |
| `renderer.ts:994` | `font-size:14px; font-family:var(--font-code)` on textarea, `rows=8` | `Editor` token `--editor-min-height: 60vh`, `text-code` |
| `renderer.ts:1032` | `minmax(340px,1fr); gap:24px` | Replaced by admin routes (Layer 1); panel width `--admin-inspector-width` |
| `renderer.ts` (all) | `font-size:12px / 13px` (25 uses), `15px` (5), `24px`, `28px` | `text-ui-sm` (14), `text-ui` (16), `--font-size-5` (25), `--font-size-6` (30) |
| `styles.ts:242` | `opacity:0.35` on dimmed bands (text 2.14:1 light) | `--state-future-text` plus hatch pattern; never opacity on text |
| `styles.ts:402-405` | `.ask-input { border:1px solid var(--rule) }` (1.52:1) | `--field-border` (→ `--border-control`) |
| `styles.ts:408-419`, `:421-425` | `.btn` and `.btn-secondary` border `var(--accent)` / `var(--rule)`; `min-height:40px` | `--button-*` tokens; secondary border `--border-control`; height `--button-height-md` (44px on coarse) |
| `styles.ts:163` | `.theme-toggle-btn min-height:36px; font-size:14px` | `Button variant="quiet" size="md"` |
| `styles.ts:44-80` | Dark values declared twice | One `themes/dark.css` definition |
| `styles.ts:38-41` | Font stacks without `@font-face` | `tokens/fonts.css` (UI-03) |

### 3.4 Atomic hierarchy and component API standardisation

Hierarchy and ownership (each level may import only from levels above it in this list):

1. **Elements** (`primitives/`): Button, Link, Chip, Field and its controls, Banner, Icon, Skeleton, VisuallyHidden.
2. **Components** (`components/`): EntryRow, ContextStrip, EvidenceItem, ClaimItem, RoleSection, SuggestionMarker, LevelBar, StateChip, AsOfBar, AnswerCard, Dialog, Tabs, Toast, EmptyState.
3. **Modules and patterns** (`patterns/`): EntryArticle, EntryStructured, MarginRail, StrataTimeline, AskWidget, InspectorTabs, TriageList, EditorWorkspace, DataList, WizardStepper.
4. **Page templates** (`layouts/`): SiteLayout, ReadingLayout, AdminShell, AuthLayout.

| Component | API (props and variants) | States | Do | Don't |
| --- | --- | --- | --- | --- |
| `Button` | `variant: primary / secondary / quiet / danger`; `size: md / sm`; `href` renders `<a>`; `loading`; `iconStart`; `type` | default, hover, focus-visible, active, disabled, loading (`aria-busy`) | One primary per view; destructive uses `danger` plus Dialog confirm | Don't use for navigation (use `href`); don't style with inline CSS |
| `Chip` | `kind: facet / status / level / filter`; `provisional` (dashed, with "suggested" label); `as: span / a / button`; `selected` | default, selected (`aria-current` or `aria-pressed`), provisional | Show confirmed facts as solid; machine output as provisional (§12.2.5) | Don't use for primary navigation; don't signal meaning by colour alone |
| `Field` | `label`, `hint`, `error`, `required`, control slot; error id wired to `aria-describedby` | default, focus, invalid, disabled, read-only | Put the hint above the control; error says what failed and the fix | Don't use placeholder as the label; don't colour-only invalid |
| `Banner` | `tone: info / warn / danger / success`; `action`; `dismissible`; role is `status` for info and success, `alert` only for danger | Visible, dismissed | Use for page-level conditions such as alpha notice, as-of, later-thinking | Don't stack more than two; don't use `role="alert"` for static notices |
| `EntryRow` | `title`, `href`, `date`, `summary`, `markers[]` (profile, venture, hindsight, updated later), `levelMarker?` | default, hover, focus | One component for Home, Work, Writing, Timeline and Admin list (replaces `renderer.ts:266,517,606`) | Don't show L0 to L3 codes to visitors; marker only if the entry has structure |
| `RoleSection` | `role` (token key), `label`, `children` | default | Left rule in the role token, label always visible (not colour-only) | Don't reuse the rule for non-role meaning (§12.2.3) |
| `SuggestionMarker` | `kind: role / facet / claim`; `status: suggested / accepted / rejected`; `onAccept`, `onChange`, `onIgnore` | suggested (dashed), accepted (solid), rejected (hidden, remembered) | Accept in one activation; announce changes in a polite live region | Don't pre-accept; don't hide the "suggested" label |
| `LevelBar` | `level: L0..L3`, plain labels Text, Context, Roles, Claims | four steps | Show only to owners, as a map | Don't show a percentage or colour-grade it |
| `Dialog` | `title`, `onClose`, `initialFocus`, `size`; footer actions | open, closing | Trap focus, close on `Esc`, return focus to opener; use for Review and destructive confirms | Don't nest dialogs; don't use for content that deserves a route |
| `Tabs` | `tabs[]`, `value`, `orientation`; roving tabindex; each tab maps to a hash or route | selected, disabled | Use inside the inspector and settings areas only | **Don't use for primary site navigation** (UX-13) |
| `AnswerCard` | `tier: tier1 / tier2 / tier3 / no_match / disabled / reduced / needs_context / rate_limited`; `basis`, `contextCheck`, `citations[]`, `disclosure` | one visual per tier | Disclosure line always visible on automated answers; never show a numeric confidence (§12.6) | Don't render tier names ("Tier 2") to visitors |
| `StrataTimeline` | `bands[]`, `asOf`, `onAsOfChange`, `view: graphic / list` | default, as-of, empty, loading | Always render the list view alongside, expanded by default on narrow screens | Don't encode profile by colour alone |
| `AdminShell` | `nav[]` (grouped), `topbar` slots: deploy chip, answering state, alerts; `main` | collapsed rail (tablet), bottom bar (phone) | Keep global status in the top bar on every admin route | Don't place settings forms inside the shell's frame; they get their own route |

### 3.5 Content rendering and the authoring control (UI-01)

**Render pipeline** (`lib/markdown.ts`, replacing `renderMarkdownToHtml`): parse with a CommonMark + GFM parser; sanitise raw HTML with an allow-list; allow only an allow-listed set of MDX components (Callout, Figure, ProductEmbed) and no arbitrary MDX (§4.3); highlight code at build time; require alt text on images; add `rel="noopener noreferrer"` and external-link affordance; heading demotion so entry headings start at `h2` under the page `h1`. Role-field content disallows top-level headings (§4.3). Acceptance tests: every Markdown feature in §4.3 renders; `<script>` and `javascript:` URLs are stripped; the rendered text of each span equals the span text (supports UX-16 regression).

**`Editor` component.** TipTap (ProseMirror) with a Markdown serializer as the default surface; CodeMirror 6 as a one-click "Markdown source" toggle that preserves selection and undo history; toolbar with heading, list, quote, code block (language picker), link, image (alt required), table. Minimum height 60vh, comfortable line length, a distraction-free mode (hides panes, keeps the save and publish controls), word counter against the soft 3,000-word cap per field with a non-blocking warning, and paste handling that converts HTML and Markdown clipboard content. Role markers render in the left margin as `SuggestionMarker`s anchored to span offsets. The existing `textarea` remains only as the no-JS fallback (hidden when the island loads).

### 3.6 Cross-viewport and input adaptation

| Context | Rule |
| --- | --- |
| Breakpoints | Tokens `--bp-sm 480`, `--bp-md 768`, `--bp-lg 1024`, `--bp-xl 1280`. Use container queries (`container-type: inline-size`) on `EntryLayout`, `AdminPane` and `DataList` so components respond to the space they have, not the window |
| Entry page | At `--bp-lg` and up: reading column plus a 320px sticky margin rail. Below: rail items move *inline after the paragraph they annotate* when the span is known, otherwise into one labelled disclosure "Evidence, claims and Ask" directly after the body (§5.3, §12.5) |
| Strata timeline | Desktop: full-width graphic. Tablet: graphic scrolls horizontally with scroll-snap and sticky as-of cursor. Phone: list view is the default and the graphic is a secondary toggle |
| Admin | `--bp-xl` and up: nav rail, list, editor, inspector. `--bp-md` to `--bp-xl`: two panes, with list as a drawer and inspector as a right drawer. Below `--bp-md`: bottom bar with Today, Inbox, Quick log, Import triage, More; editor not offered beyond Quick log and read-only preview (§12.5) |
| Input type | `@media (pointer: coarse)` sets `--size-target-min` hit areas of 44px for buttons, chips-as-links, tabs, list rows and checkboxes. `@media (hover: none)` removes hover-only affordances; nothing is available on hover alone. Keyboard shortcuts (`J K A R D S`) are always paired with visible buttons |
| Forms | Single column below `--bp-md`; labels above controls; native `input type="date"` plus range and estimated pickers; `inputmode` and `autocomplete` set |
| Zoom and text size | Layout is tested at 200% zoom and 320 CSS px width; logical properties (`margin-inline`, `padding-block`) throughout for RTL support (§12.8) |

### 3.7 Aesthetic craft and differentiation

**Strata timeline v2** (UI-05). Axis is time, not entry order: each month is a column of equal width including empty months (drawn as a hairline), so gaps in the owner's record are visible. Band height encodes entry count on a square-root scale between `--strata-band-min` and `--strata-band-max`. Profile is encoded by *fill pattern* (solid, diagonal hatch, dots) defined once as SVG patterns, plus a venture notch on the top edge, so the legend's shapes are what is drawn and colour is never the only cue. The as-of cursor is a vertical hairline with a labelled handle (`role="slider"`, `aria-valuetext="March 2021"`) that settles in `--duration-base`. Layers after the cursor use hatch plus `--state-future-text`, not opacity.

**Surface and type polish.** `font-variant-numeric: tabular-nums` for dates and counts; `text-wrap: balance` for headings and `text-wrap: pretty` for body; hanging punctuation in blockquotes; baseline-align the margin rail's first line with the first body line; code blocks get a 3px left rule in `--rule` and no card; `::selection` uses `--accent` at readable contrast; focus ring stays `2px / 2px offset` as specified. The page keeps rules and spacing, not shadows, for structure; `--shadow-overlay` is for Dialog and menus only.

**Choreographed micro-transitions** (only where they answer an action, §12.7): suggestion accept (dashed to solid outline, `--duration-fast`); dialog open and close (`--duration-base`, opacity and 4px translate); as-of cursor settle; toast in and out; disclosure expand. No entrance animations. Everything is disabled under `prefers-reduced-motion` (replace with instant state change).

**Differentiation device.** Treat the *happened / written* date pair on every entry as a small two-layer strata glyph (a short bar above a shorter bar offset by the gap between the dates) beside the textual dates. It carries real data, repeats the site's one idea at entry scale, and needs no decoration.

### 3.8 Package file topology

**As-Is.**

```
apps/web/
  package.json
  src/
    index.ts          re-exports styles and renderer
    renderer.ts       1,140 lines: helpers, layout, 10 pages, admin, 3 inline scripts
    styles.ts         476 lines: one CSS template string
    web.test.ts       77 lines: 5 substring tests
apps/api/src/server.ts   mounts every page route (L198-216)
```

**To-Be (phase 1, inside the existing package; keeps SSR and the current API mount).**

```
apps/web/src/
  tokens/        primitive.css  semantic.css  component.css  fonts.css  themes/{dark,contrast}.css  index.ts
  primitives/    button.ts  link.ts  chip.ts  field.ts  banner.ts  icon.ts  skeleton.ts  index.ts
  components/    entry-row.ts  context-strip.ts  evidence-item.ts  claim-item.ts  role-section.ts  suggestion-marker.ts
                 level-bar.ts  state-chip.ts  as-of-bar.ts  answer-card.ts  dialog.ts  tabs.ts  toast.ts  empty-state.ts  index.ts
  patterns/      entry-article.ts  entry-structured.ts  margin-rail.ts  strata-timeline.ts  ask-widget.ts
                 inspector-tabs.ts  triage-list.ts  editor-workspace.ts  data-list.ts  wizard-stepper.ts  index.ts
  layouts/       site-layout.ts  reading-layout.ts  admin-shell.ts  auth-layout.ts  index.ts
  pages/
    public/      home.ts  work.ts  writing.ts  entry.ts  build.ts  venture.ts  timeline.ts  ask.ts  ask-status.ts
                 book.ts  about.ts  now.ts  uses.ts  not-found.ts  index.ts
    admin/       login.ts  setup.ts  today.ts  entries/{list,editor,history,preview}.ts  import/{add,plan,triage}.ts
                 inbox.ts  audit.ts  calibration.ts  routing.ts  structure.ts  ventures.ts  pages.ts  theme.ts  publish.ts
                 settings/{providers,notifications,backups,security}.ts  health.ts  index.ts
  client/        ask-widget.ts  strata-keyboard.ts  theme-toggle.ts  admin/{api-client,editor,triage-keys,publish-dialog}.ts
  content/       strings.en.ts (ICU catalog)  glossary.ts  terms.ts           (Layer 3)
  lib/           escape.ts  sanitize-url.ts  markdown.ts  as-of.ts  routes.ts
  theme-sdk/     slots.ts  conformance.ts                                      (§12.10)
  index.ts       barrel: tokens, layouts, pages, theme-sdk
  web.test.ts → tests/ (unit)   e2e/ (Playwright specs per §6 flow; axe; keyboard)
```

**Exact moves.**

| From | To |
| --- | --- |
| `renderer.ts:16-39` | `lib/escape.ts`, `lib/sanitize-url.ts` |
| `renderer.ts:41-56` | `lib/markdown.ts` (rewritten, 3.5) |
| `renderer.ts:58-135` | `layouts/site-layout.ts` and `client/theme-toggle.ts` |
| `renderer.ts:137-234` | `patterns/strata-timeline.ts` (rewritten, 3.7) and `client/strata-keyboard.ts` |
| `renderer.ts:236-308` | `pages/public/home.ts` using `components/entry-row.ts` |
| `renderer.ts:310-479` | `pages/public/entry.ts`; `patterns/entry-article.ts`, `entry-structured.ts`, `margin-rail.ts` |
| `renderer.ts:481-553` | `pages/public/work.ts`, `writing.ts` |
| `renderer.ts:555-592` | `pages/public/build.ts` and new `venture.ts` |
| `renderer.ts:594-632` | `pages/public/timeline.ts` |
| `renderer.ts:634-779` | `pages/public/ask.ts`, `patterns/ask-widget.ts`, `client/ask-widget.ts` |
| `renderer.ts:781-848` | `pages/public/{now,about,uses,book}.ts` |
| `renderer.ts:850-1140` | split across `pages/admin/*` and `client/admin/*` per Layer 1 route tree |
| `styles.ts` | `tokens/*.css` and per-component CSS beside each component |
| `apps/api/src/server.ts:198-216` | one `pages/routes.ts` table imported by the server; adds the 404 handler and `Accept: text/html` login redirect |

**Barrel and boundary rules.** Each folder exports through its own `index.ts`; `package.json` `exports` publishes `./tokens`, `./primitives`, `./components`, `./patterns`, `./layouts`, `./pages`, `./theme-sdk`. A lint rule (`eslint-plugin-boundaries` or `import/no-restricted-paths`) forbids upward imports (primitives may not import components; components may not import patterns) and forbids `style=` attributes and raw hex or `px` literals in `pages/`, `patterns/` and `components/` (extends the existing `scripts/hardcode-check`). Inline `<script>` and `onclick` are replaced by files in `client/`, after which the CSP drops `'unsafe-inline'` for scripts (`app.ts:59`).

**Phase 2 (aligns with Spec §7 and repo finding F1).** Move `pages/public/*` and `layouts/site-layout.ts` to an Astro app (`apps/site`, static output, React islands for Ask, timeline and widgets) that consumes `tokens/` and `primitives/` from a new `packages/ui`. Move `pages/admin/*` to `apps/admin` (Vite, React, TanStack Router and Query, Radix primitives, TipTap, CodeMirror). Phase 1 deliberately keeps the same file names so Phase 2 is a transport change, not a redesign.

---

## Part 3b. Layer 3: Semantic and microcopy architecture (Content)

Scope: domain taxonomy, interface strings, voice and recovery-oriented messaging. Built on the Layer 1 flows and Layer 2 constraints (for example, the 44px button and 62 to 70 character measure limit how long a label or paragraph can be). Layout and behaviour are not re-litigated here.

### 3b.1 Content findings

| ID and File Path | As-Is diagnosis | To-Be |
| --- | --- | --- |
| **CP-01** `renderer.ts:639,296,302,470,649,466` and others | **Naming drift.** The same objects and actions carry different names across files. *Ask*: "Ask" (nav), "Ask the Portfolio", "Ask about my work", "Ask records", "Ask scoped record", "Ask about this entry". *Publish*: "Publish as is (L0)", "Immediate Publish", "Published stub entry", "Published … at L0". *Time*: "Timeline", "Strata timeline", "Time-Travel Knowledge Graph", "Time-travel as of", "Viewing as of". *Entry*: "entry", "record", "layer", "write-up", "dev-log entry". *Booking*: five names (see 3b.2). *Outcome*: "Worked partly" and "What didn't work (Failed)" against schema values `partly` and `failed` | Canonical glossary in 3b.2, enforced from one catalogue (CP-06) |
| **CP-02** `renderer.ts:809,968,985,1002,1024,1039` (six Spec section numbers), `:837`, `:1034` ("Tier 3", "Tier 2"), `:441`, `:271`, `:522` ("L0" to "L3"), `:428` (`toUpperCase()`), `:383` ("Schema role"), `:656` ("hard constraint"), `:409` ("Blocked non-HTTP(S) URL") | **Spec and schema vocabulary leaks into the interface.** Section numbers, tier names, level codes and internal terms appear in labels. The Spec requires naming things by what users understand and keeping schema terms as developer tooltips (§4.1, §12.9). Upper-casing contradicts §12.1 | Rewrite per 3b.4; move schema ids to `data-*` attributes |
| **CP-03** `renderer.ts:786-794` (Now), `:822-830` (Uses), `:812-813` (credentials), `:1042-1044` (conflict) | **Hard-coded owner content shipped in code.** Every instance renders one particular author's "What I'm focused on now", tool list and two unconditional "Verified" badges. A new owner's site would assert credentials nobody verified, which breaks §6.1 ("badges appear only for evidence that was verified") and the honesty invariant. (The fabricated conflict card is UX-09; its *wording* is rewritten below.) | Owner-editable pages in Admin; credentials rendered only from verified evidence; neutral placeholders by default |
| **CP-04** `renderer.ts:753`, `:1074-1133`; `ask.ts:33`; `entries.ts:260`; `auth/security.ts:206,276-290` | **Errors do not say what failed, why, or what to do.** "Origin unreachable" (infrastructure term); developer strings such as "Unauthorized: admin authentication required" and "Validation failed" with raw Zod issues; `Invalid query` has no UI branch, so the Ask card renders blank (the code looks up `tierLabels[undefined]`, `renderer.ts:744`); admin fetches show nothing on failure | Error pattern and rewrites in 3b.4 |
| **CP-05** `renderer.ts:289-293`, `:548`, `:577-579`, `:915`, `:212`, `:302`, `:470`, `:844` | **Empty states and CTAs are not invitations.** Home and Build lists render blank when empty; "No matching entries found." has no next action; CTAs name the system ("Ask records", "Ask scoped record", "Apply") instead of the outcome | Rewrites in 3b.4 |
| **CP-06** `renderer.ts:93,174,185,196,263,396-400,623` | **No string architecture.** All text is inline in TypeScript; `lang="en"` is fixed (no per-entry language); plurals are hand-coded (`count > 1 ? 's' : ''`); dates are raw ISO slices ("2024-03-12", "2021-03") where the Spec writes "March 2024"; no ICU message format (§12.8) | `content/strings.en.ts` ICU catalogue; `Intl.DateTimeFormat`; per-entry `lang` |
| **CP-07** `renderer.ts:728-735`; `ask.ts:43,56,81,181,192` | **Ask states do not use the Spec's fixed strings.** Four of nine differ ("Reduced mode — Extractive excerpts only", "Better as a live conversation", "Not in records", "Automated answers paused"). A rate limit is mislabelled "Not in records" (flow fix is UX-10; the *strings* are here) | Use the Spec's strings verbatim; add strings for needs-context and rate-limited |

### 3b.2 Terminology taxonomy (one name per concept)

| Concept | Canonical term | Retire | Notes |
| --- | --- | --- | --- |
| A document the owner wrote | **Entry** | record, layer, write-up, log item, artifact | "Work" and "Writing" name *sections*, not object types |
| Section names | **Work**, **Writing**, **Build**, **Timeline**, **Ask** | "Work & Case Studies", "Writing & Chronological Log", "Build — Ventures & Shipped Products", "Time-Travel Knowledge Graph", "Ask the Portfolio" | Page `h1` equals the nav label, so people know where they are |
| Viewing the past | **As of** ("Viewing as of March 2021") | time-travel, scrub, knowledge graph | One mode name |
| Asking a visitor question | **Ask** (button), **Ask about my work** (page heading), **Ask about this entry** (rail) | Ask records, Ask scoped record, Ask the Portfolio | The verb is always "Ask" |
| Escalated answer paths | **Needs the owner's review**, **Better as a conversation** | Tier 2, Tier 3, escalation, handoff | Spec strings; tier names never shown to visitors |
| Booking | **Book a conversation** | Book a Live Session, Book a Live Conversation (Tier 3), Request 30-minute architecture review, Book live session with prefilled context | Title, heading and link text identical |
| Making visible | **Publish** → **Published**; **Unpublish**; **Unlisted** | Publish as is (L0), Immediate Publish, go live | "Publish as is" survives only for *bulk import* ("Publish all as is") |
| Entry types | Case study, Decision record, Design project, Research note, How-to, **Just text** | Role profile, Freeform (L0/L1 only) | Admin only. Visitors do not see profile names as codes |
| Structure steps | **Text, Context, Roles, Claims** | L0, L1, L2, L3 | Owner-only; visitors see none. A "Structured" marker appears on an entry only when it has structure |
| Visibility | **Private, Unlisted, Public** (capitalised, with a one-line meaning) | `private`, `unlisted`, `public` raw chips | Consistent with Publish states |
| Outcomes | **Worked, Partly worked, Didn't work, Unresolved, Unknown** | Worked partly, What didn't work (Failed) | Matches the five schema values |
| Written looking back | **Written looking back** | hindsight, hindsight retrospective, "Happened earlier?" | Matches §12.6 wording |
| Later update banner | **Later thinking** | updated later, superseded (visitor-facing) | The Spec's banner name |
| Owner's inbox | **Inbox**, with **Questions waiting** | Escalation Inbox, Tier 2 Review, escalations |  |
| Suggestion vs fact | **Suggested** (dashed) → **Confirmed** | machine-suggested, mined, detected | Machine output is labelled as such (§12.9) |
| Mined rules | **Suggested rules** from your replies | scoped constraints, mined constraints | Developer term stays in the API |
| Voice | Site content uses first person ("my work"). System statements use "the owner" where the Spec fixes the string ("Automated answer from the owner's records") | mixing "I" and "the owner" in one message | Never both in one sentence |

**Copy rules applied below** (from §12.9): sentence case; active verbs; one name per action; errors say what happened, why, and the exact next step, without apologising; empty states invite action; ellipses are the single character "…"; no ALL CAPS for emphasis; numbers and dates use `Intl` formats; labels stay within one line at 320px (Layer 2).

### 3b.3 Error and feedback pattern

Every failure string has three parts: **what failed**, **why** (if known and useful), **what to do now**. Example: "Couldn't publish. You're signed out. Sign in again; your draft is saved on this device." Retry actions are buttons inside the message. Messages that need an immediate response use `role="alert"`; confirmations use `role="status"`. Raw API strings never reach the screen; the client maps error codes to catalogue keys (CP-06).

### 3b.4 File-mapped copy audit table

File paths are relative to `apps/web/src/` unless stated. Line numbers are in `renderer.ts` unless stated.

#### Global, Home and Timeline

| File Path and Key/Line | Current String | Optimized String | UX Writing Rationale |
| --- | --- | --- | --- |
| `:107` theme button | "◐ Theme" (aria-label "Toggle color theme") | Visible "Dark mode", `aria-pressed` reflects state; no separate aria-label | Visible text and accessible name match (WCAG 2.5.3); states a toggle, not a noun |
| `:85` staging banner | "Staging: synthetic data only." | "Staging site. Everything here is sample data." | Plain words, full sentences |
| `:14` `ALPHA_WARNING_TEXT` | "Alpha version with known defects. Do not use in production or input real sensitive data." | "This is alpha software with known defects. Don't use it in production or enter sensitive data." + link "See known issues" | Active voice, contraction, gives the next step |
| `:206` strata `h2` | "Strata timeline (2021–2026)" | "Timeline, {firstYear} to now" | Hard-coded years become computed; uses the section's name |
| `:207` | "Select any layer to scrub the knowledge graph to that point in time." | "Pick a month to see this site as it was then." | Removes layer, scrub and knowledge graph; states the outcome |
| `:210`, `:212` | "Time-travel as of:" / "Apply" | "As of" / "View" | One mode name; verb states the action |
| `:185`, `:196` | "3 layers", "(2)" | ICU plural: "{n, plural, one {# entry} other {# entries}}" | One name per object; correct plurals in any language |
| `:174` | "Viewing as of 2021-03 — Later entries and hindsight retrospectives written after this date are excluded." / "Reset to present" | "Viewing as of March 2021. Entries written later are hidden." / "Back to today" | Human date; shorter; plain "today" |
| `:223` | "Keyboard: Left/Right arrows move by layer, Enter time-travels to layer" | "Keyboard: Left and Right arrows move between months. Enter opens a month." (shown only once implemented) | Matches the object (month) and the real behaviour |
| `:226` | "Text-equivalent accessible timeline list" | "Timeline as a list" | The alternative view is useful to everyone, so name it by what it is |
| `:289` | "Recent and featured work" | "Recent work" ("Featured" once the owner curates) | Today it is not curated, so the label would overclaim |
| `:298` | "Answered from my actual records with inline citations, scope verification, and explicit uncertainty." | "Answers come from my own entries, with sources you can open. If I can't back something up, I'll say so." | Benefit first; drops system terms; fits one measure |
| `:302` | "Ask records" | "Ask" | One verb |
| `:271`, `:522` | "L1 · case-study" | Visitors: marker "Structured" only when the entry has structure. Admin: "Context · Case study" | Schema codes removed from public pages (§12.6) |
| `:273` | "Updated later" | "Later thinking" (links to the newer entry) | Spec banner name; the chip leads somewhere |

#### Entry, indexes and static pages

| File Path and Key/Line | Current String | Optimized String | UX Writing Rationale |
| --- | --- | --- | --- |
| `:399-400` | "Happened 2024-03-12 · Written 2026-09-01, looking back (hindsight)" / "Happened & written 2026-10-19" | "Happened March 2024. Written September 2026, looking back." / "Written October 2026." | Spec wording (§12.6); human dates; one sentence per fact |
| `:441` | "Structure: L2" | (removed for visitors) | Not information a reader can use |
| `:444` | "Switch to Article view" / "Switch to Structured view" | "Read as one article" / "Read by section" | Describes what the reader gets |
| `:383` | `title="Schema role: goal"` | `data-role="goal"` (no visible change) | Tooltips fail touch and keyboard; Spec keeps the schema term for developers |
| `:463`, `:428` | "Key claims & outcomes"; "LESSON · Outcome: worked" | "Conclusions"; "Lesson. Outcome: Worked" | Sentence case; plain noun; matches outcome terms |
| `:420` | "No external artifacts attached." | "No links or files attached to this entry." | "Artifacts" is jargon |
| `:409` | "Blocked non-HTTP(S) URL (kind)" shown to visitors | Visitors: item omitted. Owner: "This link was hidden because it isn't an http or https address. Edit the link." | Audience-appropriate; error with a fix |
| `:414` | "✓ Verified (artifact)" with the meaning only in a tooltip | "Verified: signed commit" (use `verification.label`) plus a visible "What does verified mean?" disclosure | The "does not prove the story" caveat must be readable, not hover-only |
| `:466-470` | "Ask about this entry" / "Question about this entry..." / "Ask scoped record" | Heading kept; placeholder "What would you like to know?"; button "Ask" | "Scoped record" is internal |
| `:319` | "Entry not found. Browse all work." | "That entry isn't available. It may have been renamed or unpublished. Try Work, Writing or Ask." | Says why and gives three ways forward |
| `:529` | "Work & Case Studies" / "Writing & Chronological Log" | "Work" / "Writing" | `h1` equals nav label |
| `:544` | "Structured case studies, architecture decisions, and design projects with verified evidence." / "All public entries ordered chronologically." | "Case studies, decisions and design projects, with the evidence behind them." / "Everything I've published, newest first." | Drops "verified" (not all evidence is); concrete ordering |
| `:533-537` | "Filter by outcome:" All / Worked / Worked partly / What didn't work (Failed) | "Outcome:" All / Worked / Partly worked / Didn't work / Unresolved | Full status set; consistent terms |
| `:548` | "No matching entries found." | "No entries match this filter. Clear it to see everything." (button "Clear filter") | Empty state with a next action |
| `:586-587` | "Build — Ventures & Shipped Products" / "Long-running products and open-source tools with linked dev-logs and constraint facets." | "Build" / "Things I've shipped and keep improving, with a log of how each one changed." | Plain; drops "constraint facets" |
| `:576` | "Attached dev-log entries (3):" | "Dev log: 3 entries" | Scannable |
| `:616-618` | "Time-Travel Knowledge Graph" / "Scrub the timeline to see only what was recorded and believed as of that date. Hindsight entries written later are automatically filtered out." | "Timeline" / "Move the cursor to see what I had written by that date. Later entries, and entries written looking back, are hidden." | One mode name; explains the rule in plain words |
| `:623` | "Records active as of 2021-03-28 (5 visible, 2 future/hindsight excluded)" | "5 entries as of March 2021. 2 are hidden because they were written later." | Entries, not records; says why |
| `:809-810` | "Verified credentials (§6.1)" / "Badges appear only for artifacts with cryptographic or host-level verification records:" | "Verified credentials" / "A badge appears only when it can be proved: signed commits checked against GitHub, or ownership of this domain." | Spec number removed; states the rule |
| `:812-813` | Two unconditional "✓ Verified…" badges | Render only verified items. Otherwise: "Nothing has been verified yet." | Honesty (CP-03) |
| `:787-788` | "What I'm focused on now" / "Updated October 2026" (hard-coded) | Owner-editable; "Updated {date}" computed; default "Nothing here yet." | CP-03 |

#### Ask and Book

| File Path and Key/Line | Current String | Optimized String | UX Writing Rationale |
| --- | --- | --- | --- |
| `:639-641` | "Ask the Portfolio" / "Answers are synthesized strictly from public records with inline citations, scope applicability checks, and explicit uncertainty. Numeric confidence scores are never shown." | "Ask about my work" / "Answers come from my published entries and cite them. When my records don't cover your situation, I'll say so and offer a conversation." | Describes the benefit, not the architecture |
| `:653` | "Optional context facets (for advisory questions — skippable)" | "Tell me about your situation (optional)" with hint "This lets me check whether my experience applies. Skip anything you don't know." | Drops "facets" and "advisory" |
| `:656` | "Database engine (hard constraint)" | "Database", hint "For example PostgreSQL or MySQL" | "Hard constraint" is internal |
| `:664` | "Time-travel as of date" | "Answer as of (optional)", hint "Use only what I had written by this date" | Same mode name; says what it does |
| `:672` | "Examples from records:" | "Try asking:" | Shorter |
| `:708` | "Searching records and verifying citations..." | "Looking through my entries…" (polite live region) | Plain progress; real ellipsis |
| `:728-735` Tier 1 | "Automated answer from the owner's records" | Keep (Spec string) | Already conformant |
| `:728-735` Tier 2 | "Needs the owner's review" | "This needs the owner's review. Typical reply within 24 hours." | Spec string, with the promise |
| `:728-735` Tier 3 | "Better as a live conversation" | "This is better as a conversation." | Spec string |
| `:728-735` extractive | "Reduced mode — Extractive excerpts only" | "Showing excerpts from the owner's records. Automated answers are paused for now." | Spec's fixed sentence; no "Extractive" |
| `:728-735` no match / disabled | "Not in records" / "Automated answers paused" | "That isn't in these records." / "Automated answers are off." | Spec strings; full sentences |
| new, needs-context | (missing) | "A few details will help me check this against my experience. Skip any you don't know." | Spec state "Needs context" |
| `:748` | "Cited passages:" | "Sources" | Shorter heading |
| `:749` | "Book live session with prefilled context →" | "Book a conversation", note "Your question is included." | One booking name; benefit as a note |
| `:750` | "AI Disclosure: …" | Disclosure text only, labelled "Automated answer" | The label already says it; avoids a prefix |
| `ask.ts:56` (429) | "Hourly question limit reached. Please wait before asking another question, or book a live session." | "You've reached the limit of {n} questions per hour. Try again in {minutes} minutes, or book a conversation." | Specific number and time; no "please" |
| `ask.ts:43` | "Automated answers are currently paused by the owner. You can book a live conversation or send a message directly." | "Automated answers are off right now. You can book a conversation or send the owner a message." | Shorter, same facts |
| `ask.ts:192` | "This topic involves specific constraints that are better addressed in a live conversation." | "This is better as a conversation. Your situation has details my past work doesn't cover." | Spec string plus the reason |
| `ask.ts:33` (400) and `:744` | `Invalid query` (card renders blank) | "Type a question to ask. It can be up to {max} characters." | What failed and how to fix it |
| `:753` | "Origin unreachable. Book a session or leave a message." | "Can't reach the server, so answers aren't available right now. Try again in a minute, or book a conversation." | Removes infrastructure term; what, why, next step |
| `:834-838` | "Book a Live Session" / "Book a Live Conversation (Tier 3)" / "When your architectural constraints differ from my documented records, a direct conversation avoids bad extrapolation." | "Book a conversation" (title and `h1`) / "If your situation differs from what I've written about, a conversation will serve you better than a guess." | One name; tier removed; plain benefit |
| `:841-844` | "Topic / Question (pre-filled from Ask)" / "Describe your architecture constraint..." / "Request 30-minute architecture review" | "What would you like to talk about?" with hint "Filled in from your question." / "For example: We run MySQL on one node and want to drop Redis locks" / "Send request" | The button names the outcome; the length belongs in owner settings |
| `:839` | `alert('Session request submitted with your context facets.')` | Confirmation page: "Request sent. {Owner} will reply to {email} within {n} days." | A persistent message, not a dismissible dialog |

#### Admin

| File Path and Key/Line | Current String | Optimized String | UX Writing Rationale |
| --- | --- | --- | --- |
| `:923-926` | "Owner Admin Workspace" / "Entry-first authoring, machine-suggested structure inspector, routing kill-switch, self-calibration, and encrypted backups." | "Today" / "What needs your attention." | Task-oriented; no feature list |
| `:929` | "Pause Automated Answering" / "Resume Automated Answering" | "Pause automated answers" / "Resume automated answers" with state line "Automated answers are on." | Sentence case; current state is visible |
| `:930`, `:931` | "Run Backup & Restore Drill" / "Export Markdown + Sidecar" | "Test backup restore" / "Export your data" with hint "Markdown files plus a JSON file of structure." | "Drill" and "sidecar" are jargon |
| `:950`, `:952` | "Author / Paste Entry (L0 Immediate Publish)" / chip "Mode: Paste / Guided / Freeform" | "New entry" / segmented control "Paste", "Guided", "Write freely", "Quick log" | The chip looked like a control but was not one |
| `:968-975` | "Role profile (§3.4)" with "Freeform (L0/L1 only)" | "Type of entry" with options "Case study", …, "Just text"; hint "Case study asks what went wrong and what you'd tell someone else." | Task language; hint teaches the concept (§4.1) |
| `:985` | "Happened earlier? (Hindsight §3.9)" | "Are you writing about something that happened earlier?" Yes / No | The Spec's question, verbatim |
| `:992`, `:994` | "Body (Markdown + GFM — only a body and date are required; structure is optional)" / "Paste any existing write-up or answer the profile prompts..." | Label "Entry", hint "Only text and a date are required." / "Paste a document, or start writing." | Short label; hint carries the rule |
| `:1001`, `:1002`, `:1004` | "Publish as is (L0)" / "Preview Redaction (§4.3)" / ""Good enough" exit always active — structure never blocks publishing." | "Publish" / "Check for private details" / "Structure is optional. You can publish now and add more later." | "Publish" then "Published" (§12.9); plain name for the check |
| `:1011-1012` | "Inspector: …" / "Four-step structure map (never a percentage score):" | "What this entry can do" / "Each step unlocks more. It's a map, not a score." | Explains purpose, not implementation |
| `:1021`, `:890` | "Context facets (dashed = machine suggested)"; chip "(suggested)" / "(confirmed)" | "Context"; legend "Dashed items are suggestions. Confirm or ignore each one."; chip "Suggested" only when unconfirmed | Machine output labelled; no noise on facts |
| `:898`, `:899` | "… (unlocks higher tier)" / "All core context and outcome fields are present for this entry." | "{question}" with note "Answering this lets advisory questions use this entry." / "Nothing more to add right now." | "Tier" removed; says what you gain |
| `:1034`, `:915` | "Escalation Inbox — Tier 2 Review (2)" / "No pending escalations." | "Inbox (2)" / "No questions waiting. New ones appear here and in your notifications." | Spec area name; empty state explains |
| `:907` | "Visitor Question (lookup):" | "Question from a visitor" | Query class is internal |
| `:1039-1048` | "Topology Audit & Scoped Constraints (§11)" / "Detected Claim Conflict:" / "Does the later claim supersede the earlier one, or do they apply to different situations?" | "Conflicts to review" / empty: "No conflicts found yet." / "Does the newer claim replace the older one, or do they apply to different situations?" with buttons "Replaces it" and "Different situations" | Plain terms; the answer is the only way an edge is created (§6.2) |
| `:1050`, `:1054` | "Mined Scoped Constraints (1)" / `Quote: "…" · Status: proposed` | "Suggested rules from your replies (1)" / `From your reply: "…"` with chip "Waiting for you" and buttons "Confirm" and "Discard" | "Mined" and "scoped" are internal |

#### Errors and feedback (admin and API)

| File Path and Key/Line | Current String | Optimized String | UX Writing Rationale |
| --- | --- | --- | --- |
| `:1083` | "Redaction Preview Warnings: email ("a@b.com") — Confirm none of this is under NDA before publishing." | "Found 1 thing to check: the email a@b.com. Remove it or confirm it's safe to publish. Is any of this entry under NDA?" (Yes / No) | What was found, what to do, and the question the Spec requires |
| `:1085` | "✓ No confidential secrets or NDA markers detected." | "No emails, keys or names from your exclusion list were found. This check can miss things, so read the entry through once yourself." | Calibrated claim (in my test the scanner caught 1 of 3 planted items) |
| new, failed check | (shows the green string above) | "Couldn't check for private details: you're signed out. Sign in again, then retry." (button "Retry") | Failure never looks like success (UX-03) |
| `:1110` | "Published "X" at L0. Background enrichment queued. View entry →" | "Published "X". It goes live on the next site build, in about 7 minutes." with actions "Publish now", "View entry", "Undo" | Accurate; includes deploy status and undo (§12.7) |
| `:1124` | "Automated answering is now ENABLED." / "… PAUSED (Handoff only)." | "Automated answers are on." / "Automated answers are paused. Visitors see booking options instead." | No capitals for emphasis; states the consequence |
| `:1132` | "Encrypted Backup (age) & Scratch Restore Drill: PASSED (12 entries verified)." | "Backup restore test passed. 12 entries were restored and checked." | Result in plain words |
| `entries.ts:260` | "Redaction preview confirmation required before changing visibility to public" | "Check this entry for private details before making it public." (reason mapped: "You edited the entry after the last check. Run the check again.") | Imperative; reason shown when known |
| `auth/security.ts:206` | "Too many failed login attempts. Try again later." | "Too many sign-in attempts. Try again in {minutes} minutes." | Concrete wait |
| `auth/security.ts:276-290` | "Unauthorized: admin authentication required" / "Forbidden: missing or invalid CSRF token" | "You're signed out. Sign in to continue." / "Your session expired. Reload the page and sign in again." | Recovery action; no HTTP vocabulary |
| `routes` setup (`auth/security.ts`, `/setup`) | "Username and password (min 12 chars) are required" | "Enter a username and a password of at least 12 characters." | Directs the correction |

### 3b.5 String architecture (CP-06)

Create `content/strings.en.ts` as an ICU MessageFormat catalogue keyed by `area.component.element` (for example `ask.state.tier2.title`), with a build-time check that no string literal over two words appears in `pages/`, `patterns/` or `components/` (extends `scripts/hardcode-check`). Dates and numbers use `Intl.DateTimeFormat` and `Intl.NumberFormat` with the entry's language. Each entry stores its own content language (§12.8), emitted as `lang` on the article element and used for chunking and spell-check. `glossary.ts` holds the taxonomy in 3b.2 and generates the glossary page the Spec requires (§4.1), so tooltips, labels and the glossary cannot drift.

---

## Part 4. Prioritized remediation roadmap

Findings overlap, so actions are grouped: 11 P0, 14 P1 and 8 P2, covering all 33 findings. Effort: S under 2 days, M 3 to 8 days, L over 8 days (one engineer). Every action ends with an acceptance test that can run in the Playwright suite from P1-10.

### P0. Critical blockers and broken core flows

Goal: an owner can sign in, write, check, publish, and structure an entry, and a visitor can read it correctly and reach the owner. Nothing here is polish.

| ID | Action | Findings | Target files | Effort | Acceptance |
| --- | --- | --- | --- | --- | --- |
| P0-1 | Admin sign-in and first-run setup; remove default token; HTML redirect to login | UX-01 | `pages/admin/{login,setup}.ts`; `apps/api/src/app.ts:29-30,50`; `server.ts:216` | M | Browser at `/admin` signed out lands on login; server refuses to boot without a token until setup completes |
| P0-2 | Admin API client with CSRF and error handling; no success message without `res.ok` | UX-02 | `client/admin/api-client.ts`; every `fetch` in admin | S | Forced 401, 403 and 500 each show a specific recovery message |
| P0-3 | Close the publish gate: server rejects public create without a valid token and rejects empty body; four-state redaction result; NDA question; broaden scanner | UX-03 | `entries.ts:181-232`; `packages/ai` scanner; review dialog | M | Test with an `sk-` key, a client name and an email: all flagged; public create without token returns 400; a failed check is never green |
| P0-4 | Entry lifecycle: Draft, Review, Published, Unlisted, Unpublished; list, select, edit, history, delete with report; auto-slug; undo | UX-04 | `pages/admin/entries/*`; `entries.ts`; routes table | L | Create draft, publish, edit (new revision), unpublish, delete, all from the UI, with no console errors |
| P0-5 | Replace the Markdown renderer (CommonMark + GFM, sanitised, highlighted code, alt text) | UI-01 | `lib/markdown.ts` | M | The §4.3 feature list matches fixtures; script and `javascript:` URLs stripped |
| P0-6 | `Editor` component: TipTap rich text, CodeMirror Markdown toggle, 60vh minimum, word counter | UI-01 | `patterns/editor-workspace.ts`; `client/admin/editor.ts` | L | Toggle preserves content and undo; paste of Markdown and HTML converts correctly |
| P0-7 | Fix structured view: render every span, labelled or not | UX-16 | `pages/public/entry.ts` | S | Structured and article views contain identical text (seed entry loses 0 characters) |
| P0-8 | Structure review loop: inspector tabs bound to the selected entry; accept, change, ignore; confirm facets; outcome picker; evidence attach; answerable gap questions | UX-06 | `patterns/inspector-tabs.ts`; `structure.ts` routes | L | A suggested role is accepted in one activation and appears in the structured view |
| P0-9 | Make the admin truthful: delete the hard-coded conflict card, show "not configured" for unmeasured statuses, remove or implement the enrichment banner, read kill-switch state from the server | UX-09 (honesty part), UX-05 (banner) | `renderer.ts:1040-1048,1110,1115-1126`; `health.ts:19-26`; `settings.ts` | S | No status string in the UI without a measured source; kill switch shows server state on load |
| P0-10 | Close visitor dead ends: `POST /api/book` with confirmation page; Tier 2 contact and receipt URL; inbox approve, edit and reject with delivery | UX-08, UX-11 | `pages/public/{book,ask-status}.ts`; `inbox.ts`; new `book.ts` | L | A visitor asks, receives a receipt, the owner approves, the visitor sees the reply at the receipt URL |
| P0-11 | Time-travel correctness: default to today, validate dates, carry `as_of` through entries, Ask and links, sticky as-of bar | UX-12 | `pages/public/timeline.ts`; `lib/as-of.ts`; `components/as-of-bar.ts` | M | Applying the default date excludes nothing; an entry opened from a 2021 view shows its 2021 revision |

### P1. Major structural and information-architecture refactoring

Goal: replace the tab-cramped public nav and monolithic admin with the route trees in Part 2, and fill the missing states and flows.

| ID | Action | Findings | Target files | Effort | Acceptance |
| --- | --- | --- | --- | --- | --- |
| P1-1 | Public nav and route tree: five-link primary nav, secondary footer nav, remove Admin link, canonical `/work` vs `/writing`, HTML 404, curated Home list, one query per list | UX-13 | `layouts/site-layout.ts`; `pages/routes.ts` | M | Nav has 5 links; `/writing/[slug]` of a structured entry 301s; unknown path returns the HTML 404 |
| P1-2 | Venture page `/build/[slug]` with overview, click-to-load sandboxed embed, dev log, evidence | UX-13, §3.10 | `pages/public/venture.ts` | M | Seeded venture page renders all five blocks; embed loads only on click |
| P1-3 | Admin shell and route tree with the "Today" queue, grouped nav, top-bar status | UX-09 (structure), UI-06 | `layouts/admin-shell.ts`; `pages/admin/today.ts` | L | Every Spec `/admin/...` area has a route; Today lists only items needing action |
| P1-4 | Import: add, plan with ETA and cost choice, confidence-sorted triage with `J K A R D S`, bulk accept | UX-07 | `pages/admin/import/*`; `client/admin/triage-keys.ts` | L | Import 20 documents using only the keyboard; reload mid-import resumes |
| P1-5 | Guided mode, Quick log, first-run walkthrough | UX-07 | `pages/admin/entries/editor.ts`; new quick-log route; `pages/admin/setup.ts` | L | Quick log creates a stub entry in under 30 seconds on a phone |
| P1-6 | Deploy status, Publish now, deploy chip | UX-05 | `routes/publish.ts`; `components/state-chip.ts` | M | Chip shows Queued with a countdown, then Live; Publish now bypasses the debounce |
| P1-7 | Ask flow: needs-context, rate-limited, scope chip, pending-disable, streaming with Stop, entry-derived examples | UX-10 | `pages/public/ask.ts`; `client/ask-widget.ts`; `ask.ts` | L | All nine Spec states plus rate-limited and network error have Playwright specs |
| P1-8 | Remaining admin screens: routing floors and warning, calibration, audit actions, theme with live preview, providers, notifications, backups | UX-09 (rest) | `pages/admin/{routing,calibration,audit,theme,settings/*}.ts` | L | Lowering the Tier 1 floor shows the persistent warning; a scoped constraint can be confirmed or discarded |
| P1-9 | Shared state components and per-view states (2.4) | UX-14 | `components/{empty-state,toast}.ts`; `primitives/skeleton.ts` | M | Every view in the 2.4 matrix has no "—" |
| P1-10 | Accessibility fixes and test suite: skip link, `h1`, theme toggle logic, bands as links, focus management, target sizes; Playwright, axe, keyboard, no-JS and Lighthouse | UX-15 | `layouts/site-layout.ts`; `e2e/` | L | axe reports zero serious or critical issues on all routes; no-JS reading smoke test passes |
| P1-11 | Strata timeline v2 with real time axis, pattern encoding, slider cursor and the documented keys | UI-05 | `patterns/strata-timeline.ts`; `client/strata-keyboard.ts` | L | Arrow, Page Up/Down, Enter and Home/End work; profile is distinguishable in greyscale |
| P1-12 | Component library and token tiers; `--border-control` and `--state-future-text` first; migrate inline styles per 3.3; lint rules | UI-02, UI-04 | `tokens/*`; `primitives/*`; `components/*` | L | Zero `style=` attributes in `pages/`; contrast CI green in light, dark and contrast themes |
| P1-13 | Responsive system: container queries, rail inline placement, admin tablet and phone layouts, coarse-pointer targets | UI-06, UI-07 | `patterns/margin-rail.ts`; `layouts/admin-shell.ts` | M | 320px and 200% zoom specs pass; all touch targets measure 44px or more |
| P1-14 | Content architecture: ICU catalogue, glossary, `Intl` dates, per-entry language | CP-01, CP-06 | `content/*` | M | Lint fails on inline string literals in `pages/`; entry `lang` appears in HTML |

### P2. Visual polish, micro-interactions and copy

| ID | Action | Findings | Target files | Effort | Acceptance |
| --- | --- | --- | --- | --- | --- |
| P2-1 | Finish token migration of remaining inline values; define `--layout-max`; single dark definition | UI-02 | `tokens/*`; `hardcode-check` | M | Hardcode check passes with zero exceptions |
| P2-2 | Self-host fonts as subset WOFF2 with `font-display: swap`; list OFL licences | UI-03 | `tokens/fonts.css`; `THIRD_PARTY_NOTICES` | S | No request to third-party font hosts; reading pages render Literata |
| P2-3 | Entry page craft: role sections, claim items without boxes, related entries, type polish, happened/written glyph, micro-transitions under reduced-motion control | UI-08, UI-09 | `patterns/entry-*.ts`; `components/role-section.ts` | M | Visual regression baselines recorded for article and structured views |
| P2-4 | Theme slot contract and conformance in CI; theme editor hooks | UI-10 | `theme-sdk/*`; `packages/core/src/sdk` | M | A sample theme fails CI when a slot or token is missing |
| P2-5 | Microcopy rewrite pass from 3b.4: navigation, indexes, Ask, Book, admin labels, empty states, Spec strings | CP-02, CP-05, CP-07 | `content/strings.en.ts` | M | No Spec section number, tier name or level code appears in rendered HTML (grep test) |
| P2-6 | Owner-editable Now, About, Uses and credentials; neutral defaults; badges only from verified evidence | CP-03 | `pages/admin/pages.ts`; `pages/public/{now,about,uses}.ts` | M | A fresh instance shows no one else's bio or badges |
| P2-7 | Error and feedback strings: error-code mapping and the three-part pattern | CP-04 | `client/admin/api-client.ts`; `content/*` | S | Each API error code maps to a catalogue key; no raw API text on screen |
| P2-8 | Feed and sitemap integrity: escape XML in `rss.xml`, point links at canonical URLs, add autodiscovery link, complete `sitemap.xml` | §5.1 | `apps/api/src/app.ts:138-159`; `layouts/site-layout.ts` | S | Feed validates with an XML parser when a title contains `&` |

**Sequencing.** P0-1 and P0-2 first (nothing else is testable without them). P0-3 before any wider use of publish. P0-5 and P0-7 are quick and unblock honest reading. P1-12 should start alongside P0-6 so new components are built on tokens, not on more inline styles. P1-14 should land before P2-5 so rewrites go into the catalogue once.

**Do not do yet.** Do not enable the self-calibration mechanisms, start the Astro and React split (Phase 2 in 3.8), or build monetization until P0 and P1-3, P1-7 and P1-10 are done. The Spec's own gating (§11, §18.2) says those should follow evidence and a working authoring path.

---

## Appendix A. Evidence log (what I ran)

Setup: `pnpm install --frozen-lockfile`, `pnpm build` (7 of 7 tasks succeeded), server started with `SEED_DEMO=true` on port 4010, probed with `curl` and a short Python script.

| # | Probe | Result | Supports |
| --- | --- | --- | --- |
| V1 | `GET /admin`, `Accept: text/html`, no credentials | `401`, `content-type: application/json`, body `{"error":"Unauthorized: admin authentication required"}` | UX-01 |
| V2 | `POST /api/entries/redaction-preview` and `POST /api/entries` without credentials (what the page's script sends) | Both `401`. The page's handler reads `data.warnings`, finds none, and prints the green "No confidential secrets…" string (from reading `renderer.ts:1080-1086`; not run in a browser) | UX-02, UX-03 |
| V3 | Same preview endpoint with the default bootstrap bearer, text containing an `sk-…` key, "Acme" and "NDA", and an email | Only the email was flagged | UX-03 |
| V4 | `POST /api/entries` with the bootstrap bearer, `visibility: public`, body containing an `sk-…` key, no redaction token | `201`; `GET /work/leaky-1` served the key | UX-03 |
| V5 | Bootstrap bearer accepted with no `ADMIN_API_TOKEN` configured | Yes (default token `lp_pat_default_test_admin_token_001`) | UX-01 |
| V6 | `GET /timeline` | Date input default `2026-10-19`; `as_of=garbage` returns 200 | UX-12 |
| V7 | Entry with `###`, a list, a fenced `ts` block and a link, viewed at `/work/md-test` | Rendered as four literal paragraphs | UI-01 |
| V8 | `GET /build/strata-engine`; `GET /nope` | `404`; plain-text `404` | UX-13 |
| V9 | Links on `/writing`; nav links on `/` | Entries link to `/work/…`; no links to `/uses`, `/book` or an RSS alternate | UX-13 |
| V10 | `GET /rss.xml` after creating a title containing `&` and `<` | XML parser: not well-formed | P2-8 |
| V11 | Spans of seeded L3 entry `redis-distributed-locks-2021` vs spans with an accepted role | 3 spans, 1 shown; 603 characters, including the lesson, absent from the structured view | UX-16 |
| V12 | `/ask?q=x&scope=…` page text; `/book` markup | No scope indicator; `onsubmit="event.preventDefault(); alert(…)"` | UX-10, UX-11 |
| V13 | Search for enqueue calls in `apps/api/src` | None | UX-05 |
| V14 | Search for visitor contact fields in the ask schema and escalation table | None | UX-08 |
| V15 | Authenticated admin HTML searched for approve, accept, reject, delete, revision, save draft, unpublish, login | 0 matches each | UX-04, UX-06, UX-08 |
| V16 | Admin entry-list link target for the private seed entry | `404` | UX-04 |
| V17 | Code counts: 151 inline `style=` attributes, 219 `px` values, 12 inline-styled labels, `.role-*` classes unused, 3 copies of the entry-row markup, dark palette declared twice, no `@font-face` | Static analysis of `renderer.ts` and `styles.ts` | UI-02 to UI-04, UI-08 |
| V18 | WCAG contrast computed from `styles.ts` token values | Text pairs pass (body 15.10:1, muted 6.49:1, link 5.98:1, button 6.54:1 light). `--rule` as control border: 1.52:1 light, 1.35:1 dark (needs 3:1). Dimmed band text: 2.14:1 light, 2.91:1 dark (needs 4.5:1). Proposed `--border-control`: 3.98:1 or better in both themes | UI-02, UX-15 |

**Correction to section 0.1.** That section says no contrast ratios were measured. I computed them (V18) after drafting Part 1; read the "inferred" labels on contrast in Parts 1 and 2 as superseded by V18. Everything else in 0.1 stands: no real-browser rendering, no axe run, and the server, worker and database layers were not audited beyond their UX consequences.

**Not verified.** Visual appearance, screen-reader behaviour, behaviour of the inline scripts in a real browser (including the theme-toggle first-click issue, which comes from reading `renderer.ts:126`), and the correctness of the algorithms behind Ask tiers. The repository's own open findings G1 to G8, P1 to P4 and F1 to F3 (`KNOWN_ISSUES.md`) remain relevant to those.

## Appendix B. Verification protocol for the remediation

Add these Playwright specs (Spec §18.1) so the remediation can be proven rather than asserted. Each maps to a roadmap item.

| Spec | Covers |
| --- | --- |
| `auth.setup-login.spec` | Signed-out `/admin` redirects; first-run wizard cannot be skipped; throttling message (P0-1) |
| `admin.entry-lifecycle.spec` | Draft, review, publish, edit, unpublish, delete; empty body rejected; failed redaction check never green; secret in body is flagged (P0-3, P0-4) |
| `public.markdown-fidelity.spec` | Headings, lists, code, tables, links, images; sanitisation; structured text equals article text (P0-5, P0-7) |
| `admin.structure-review.spec` | Accept, change, ignore a suggested role; confirm facet; answer a gap question; level bar updates (P0-8) |
| `visitor.ask-states.spec` | Nine Spec states plus needs-context, rate-limited, network error; entry-scoped ask keeps its scope (P1-7) |
| `visitor.escalation-and-booking.spec` | Tier 2 receipt, owner reply delivered, booking confirmation persisted (P0-10) |
| `visitor.time-travel.spec` | Default date excludes nothing; `as_of` carried to entries and Ask; keyboard controls; empty result (P0-11, P1-11) |
| `admin.import-triage.spec` | Plan, keyboard triage `J K A R D S`, bulk accept, resume after reload (P1-4) |
| `a11y.axe-all-routes.spec` | axe on every public and admin route in light, dark and contrast themes; skip link; heading order (P1-10) |
| `a11y.keyboard-and-zoom.spec` | Focus order, dialog focus trap and return, 320px and 200% zoom, 44px targets on coarse pointer (P1-10, P1-13) |
| `public.no-js.spec` | Every reading page is complete with JavaScript disabled (Spec §1) |
| `content.lint.spec` | No Spec section number, tier name, level code or raw ISO date in rendered HTML (P2-5, P1-14) |
