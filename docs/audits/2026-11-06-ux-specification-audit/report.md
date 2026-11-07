# UX & Specification Audit Report — `living-portfolio-main`

**Target:** `living-portfolio-main.zip` (v0.1.0, snapshot dated 4 Nov 2026) · **Audit date:** 6 Nov 2026 (final version, revised after the owner walkthrough and reply) · **Method:** `Design Audit.md` (three MECE layers) · **Controlling spec:** `The_Living_Portfolio_Open_Source_Spec.md`

**Final version (6 Nov 2026).** This revision adds the owner’s manual walkthrough (§5), a revised information architecture and interaction model that supersedes §2.1.1 (§6), and agent-executable work packages with handover points (§7), with every decision closed in §8. Version 1 sections stay as evidence. **Corrections to version 1:** the audit date was 6 Nov 2026, not 5 Nov; UX-05 is narrowed (the owner ran bundled mode on port 4000 and the login guard worked); the kill-switch, theme-toggle, public-navigation and scoped-constraint placements in §2.1.1 are replaced; and UI-01’s undefined radius tokens are now identified as the root cause of the “everything is a rectangle” problem. Details in §5.1.

**Owner’s final rulings (reply of 6 Nov 2026), applied throughout.** The 103 KB spec in `docs/spec/` is authoritative, so §1 is rebuilt against it and the uploaded delta is set aside (D-01). “Save draft” and “Publish” show no change because every success and error message is written to a banner at the very top of a long page, far from the editor (UX-43); this replaces my earlier prediction of a visible duplicate-slug error. Time travel already exists, but list pages and the timeline test only an entry’s current revision, so an entry you revised later disappears from earlier dates (UX-44). The `/ask` and `/timeline` pages are retired in favour of panels (D-10). The home page keeps its own identity with configurable Featured and Recent lists (D-09). Every decision in §8 is closed, no work package waits on one, and §5.4 records what each ruling changed.

---

## 0. Read this first

### 0.1 How this audit was done, and its limits

- **Static read of the shipped source.** I did not install dependencies, run the app, or run the test suites. Each finding is tagged **V** (verified by reading the cited lines) or **I** (inferred from structure or CSS; needs a browser check).
- **Depth.** I read the admin workspace, settings, setup, login, import, home, Ask, static pages, booking and timeline closely. I only skimmed entry detail, the work/writing indexes, the strata timeline, the markdown engine and ask-status. `renderer.ts` is 5,119 lines (\~267 KB), so a literal line-by-line pass of every function wasn’t possible in one sitting. Part 5 lists what to verify next.
- **Line numbers** refer to files exactly as shipped in the zip.

### 0.2 Two source-of-truth issues you should know about

1. **The uploaded spec is not the one the repo was built against.** The file you attached is a 20 KB *open-source delta* that repeatedly defers to a “core spec” (§7, §8.2, §9, §10) which wasn’t supplied. The repo ships a different, 103 KB standalone spec (`docs/spec/The_Living_Portfolio_Open_Source_Spec.md`) with its own vocabulary (entries, profiles, structure levels L0–L3, `apps/web` containing the admin) instead of the delta’s `apps/admin`, qRXP primitives and Tier-1 floors. I treated your uploaded spec as controlling wherever it speaks, and used the in-repo spec as the best available stand-in for the deferred material, marked **(proxy)**. Its §5.1 defines nine `/admin/*` routes and its §6.2 the owner flows; those are the main basis for the information architecture I infer below.
2. **The repo already contains an audit of an earlier build** (`docs/audits/2026-10-20-ux-specification-audit/report.md`) that named your same three anti-patterns, followed by remediation work packages WP11–WP12. So the code audited here is *post-remediation*. Several of your calibration symptoms are partly fixed (login and setup now exist; the editor has Save draft, Publish, Unpublish, Delete and a redaction drawer). What remains are structural failures underneath those fixes, and in two cases the fixes introduced new defects.

| Anti-pattern in your brief | State in the code today | Verdict |
| --- | --- | --- |
| **A. Tab-cramming** | Public nav is 5 links plus a theme toggle (`apps/web/src/renderer.ts` `renderLayout` L235–L375, `navItems` L242): not egregious. The cramming has *moved*: 7 actions in the admin header (L2205–L2214), a 5-tab Inspector that hides the core structuring workflow (L2444–L2448), About/Now/Uses/Book relegated to a footer, and five flat sections on Settings. | Partly resolved, relocated |
| **B. Monolithic admin** | `/admin` still renders header actions, status strip, walkthrough card, a three-pane workspace, then Inbox and Conflicts panels, all in one function of \~1,800 lines (`renderAdminWorkspacePage` L2028–L3839). Only 3 of the 9 admin routes the in-repo spec defines exist (`apps/web/src/app.ts`). | Confirmed |
| **C. Truncated CMS** | A Publish button exists, but its code path fails for any entry that has already been saved (UX-01); the Visibility control is dead (UX-03); the editor is 60 vh tall but roughly 500 px wide at desktop (UI-02). | Confirmed, in a different form |

### 0.3 Verdict

The engine is far ahead of the interface. The API exposes calibration proposals, topology conflicts, import connectors and jobs, ventures, bookings and an evaluation runner; the web app surfaces almost none of them. The authoring pipeline looks complete on screen but is internally inconsistent: Publish, Save draft, Unpublish and both Undo actions disagree about how an entry changes state. And the admin cannot be reached safely in the default deployment shape. Nothing here is a rewrite-level problem, but the admin needs to stop being one 1,800-line template string and become a routed application with a state machine for entries.

### 0.4 Twelve findings that matter most

| ID | Finding | Evidence | Sev |
| --- | --- | --- | --- |
| UX-01 | Publishing an entry that already exists always sends `POST /api/entries`, which returns 409 for the existing slug; the user sees a generic “Action failed” message. The API already supports promoting a draft via `PUT /:id`, but the UI never calls it. | `renderer.ts` L3531–L3580; `apps/api/src/routes/entries.ts` L246–L262, L357–L400 | P0 |
| UX-02 | “Save draft” on an existing entry hard-codes `visibility:'private'`, silently unpublishing a live page. | `renderer.ts` L3106 | P0 |
| UX-03 | The Visibility dropdown is never read by any handler, so “Unlisted” is unreachable. | markup L2322; handlers L3106, L3140, L3562 | P0 |
| UX-04 | Both Undo actions are unreliable. Undoing an unpublish omits the preview token, so the API rejects it, yet the UI reports “Undone: Republished”. Undoing a draft save only prints “Undo: Draft save acknowledged.” | `renderer.ts` L3181–L3190, L3122 | P0 |
| UX-05 | In standalone mode `/admin*` routes have no auth guard and the server-side render uses a client with no token; the guard exists only in the optional bundled adapter. Browser calls use relative `/api/...` URLs that the web origin doesn’t serve. The shipped Compose file has no web service. | `apps/web/src/app.ts` admin block; `apps/api/src/adapter/bundled-web.ts`; `renderer.ts` L2005; `docker/docker-compose.hobbyist.yml` | P0 |
| UX-06 | No admin shell: admin pages use the public layout (public nav, theme toggle, footer), there is no admin navigation and no sign-out anywhere. | `renderer.ts` L3839 (`renderLayout('Admin Workspace', …)`); zero “logout” hits | P1 |
| UX-07 | Eight backend capabilities have no screen: calibration proposals/history/rollback, topology conflicts, import connectors and jobs, ventures, bookings, evaluation, redaction exclusions, API tokens. | endpoint inventory vs. UI calls | P1 |
| UX-08 | Calibration is on by default (`calibrationFrozen:false`, `minSampleSize:5`, `autoApplyThreshold:0.02`), contradicting the spec’s “ships disabled”. The UI offers only an opt-out “Freeze” checkbox. | `apps/api/src/routes/calibration.ts` L10–L20; `settings.ts` L44; `renderer.ts` L3899 | P1 |
| UX-09 | Setup wizard step 3 (“Model Providers”) is a read-only table: no API-key field, no live validation, no storage choice, all of which spec §4 requires. | `renderer.ts` \~L4417–L4466 | P0 |
| UI-01 | Eight CSS variables are used but never defined (`--radius-control`, `--radius-card`, `--bg-base`, `--bg-subtle`, `--surface-subtle`, `--surface-panel`, `--green`, `--role-challenge`); 684 inline `style` attributes; the redaction drawer’s background is `var(--bg-base)`, which resolves to nothing. | scripted scan; `renderer.ts` L2390 | P1 |
| UI-02 | At ≥1280 px the admin grid gives the editor roughly 500 px (1180 px max width − 240 − 340 − gaps − padding). Between 768–1279 px the grid has two columns for three panes. | `styles.ts` L692–L713; tokens `--size-layout-max: 1180px` | P1 |
| CP-01 | Engineering jargon leaks into the owner UI: “SIMULATED finding M6”, “501 Not Implemented”, “honesty invariant”, “Tier 1 Advisory Floor”, “Published … at L0”. | `renderer.ts` L2553, L3580 and Settings section | P2 |

---

## 1. Section-by-section specification conformance matrix (re-baselined to the in-repo spec)

**Authority.** By the owner’s ruling (D-01) the spec in `docs/spec/The_Living_Portfolio_Open_Source_Spec.md` governs. My first matrix was written against the uploaded 20 KB delta and is replaced; its delta-only rows (`apps/admin`, qRXP primitives, the package layout, `config.yaml`) are retired. Where the owner has deliberately departed from the spec, the row says **amended** and §5.4 records the amendment.

**Status key:** ✅ Implemented · 🟡 Partial · ❌ Missing · ⚠️ Flawed (exists but fails its purpose) · — Not audited. Backend sections (§7 to §10 data model and algorithms) were not audited except where they touch the interface.

| Spec § | File path | Requirement (explicit and inferred) | Status | Gap and diagnosis |
| --- | --- | --- | --- | --- |
| §1 Principles (L28) | `renderer.ts` L2208; `routes/calibration.ts` | The owner can always stop automated answering instantly, and can freeze self-calibration | ⚠️ | The stop control is a header button with no confirmation (UX-16); “freeze” is one flag that defaults to not frozen (UX-08). Moves to Settings › Answering (D-08) |
| §2 Licensing and governance | `LICENSE`, `GOVERNANCE.md` | Open-source posture | — | Files present; not UX scope |
| §3.2–3.3 Kernel and structure levels | `renderer.ts` L2440–L2535 | Four-step level bar (Text, Context, Roles, Claims); structure is never a prerequisite | 🟡 | Level shown only in the inspector, which can show the wrong entry (UX-37); no level indicator in any list |
| §3.4–3.5 Profiles and span annotations; §12.6 | editor (`#entry-body`, L2359) | Suggested roles appear as marginal markers: accept, change, ignore | ❌ | The editor is a plain textarea, so a marginal layer is impossible; suggestions are only listed in the inspector. Needs the new editor (WP-18) |
| §3.6 Claims and relations | `routes/structure.ts` | Owner can author claims and supersede links; later-thinking banners | ⚠️ | API supports it; no authoring UI (UX-07) |
| §3.7 Facets and outcome status; §12.7 | `renderer.ts` L2107; `styles.ts` | Machine-suggested items drawn dashed with a “suggested” label, solid once accepted | ⚠️ | `chip-suggested` is applied but has no CSS rule (UX-38). Outcome status cannot be set |
| §3.8 Evidence | inspector | Attach and verify evidence | 🟡 | Attach works; no remove or relabel |
| §3.9 Time | three write paths | `temporal_level` is exact, range or estimated; “Happened … Written … looking back” | ⚠️ | UI always sends `exact` (UX-22) |
| §3.10 Ventures | `routes/structure.ts` L175 | Ventures with status, links and dev-log | ⚠️ | No UI to create or link (UX-07) |
| §3.11 Visibility and revisions | `renderer.ts` L3082–L3592 | private, unlisted, public; immutable revisions; undo or clear confirmation | ⚠️ | Unlisted unreachable (UX-03); Save on a public entry unpublishes it (UX-02); Undo unreliable (UX-04); feedback invisible (UX-43); no history UI |
| §4.4 Authoring modes | editor; import page | Paste or import first, with “Good enough” and Publish as is; Guided; Freeform; Quick log as a thirty-second mobile form (what happened, decided, learned, which venture) | ⚠️ | All modes share one cramped pane; no Publish as is in the editor; Quick Log is a mode toggle, not a mobile route (UX-18) |
| §5.1 Site map | `apps/web/src/app.ts` | Public routes; nine `/admin/*` routes (entries, import, inbox, structure, routing, calibration, audit, theme, settings) | 🟡 | All public routes exist. Admin has only `/admin`, `/admin/import`, `/admin/settings` plus login and setup. **Amended** by the owner: nav, About merge, retirement of `/ask` and `/timeline` pages (§5.4) |
| §5.2–5.3 Entry views and page elements | `renderEntryDetailPage` | Article and structured views; margin rail; later-thinking banner | — | Skimmed, not line-audited |
| §6.1 Visitor flows: time travel (L289) | `renderer.ts` L420–L440; `routes/timeline.ts` L57–L80 | Content and answers reflect only what was recorded as of the date; later-superseded beliefs excluded | ⚠️ | Entry detail picks the right revision. List pages and the timeline test only the current revision, so an entry revised after the chosen date vanishes from earlier views (UX-44) |
| §6.2 Write, import, add structure | `renderer.ts` L2254–L2535, L4720+ | Owner flows | ⚠️ | See §4.4 row; import is paste-only (UX-36) |
| §6.2 Review escalations; scoped constraints | `renderer.ts` L2539–L2560 | Inbox with draft, edit, approve; constraints shown with their source quote; revoke in `/admin/audit` | 🟡 | Works inline; no list view; source quote not shown; no revoke (UX-07) |
| §6.2 Review calibration; resolve conflicts | `routes/calibration.ts`, `routes/audit.ts` | Parameters, proposals, history, rollback; conflict list | ❌ | No UI; the conflicts card is static text (CP-02) |
| §6.2 Tune routing and disclosure | Settings | Raise the bar, set hard facets per domain, disable answering | 🟡 | Three numbers and a flag; no hard-facet editing; no public disclosure |
| §6.2 Theme the site; date offline material; monitor | Settings “Theme”; — | Live preview; date picker for offline material; digest and restore status | ⚠️ | No live preview; date-offline flow absent; drill returns 501 without configuration (UX-33) |
| §10.8 Degradation ladder | Settings | Reduced mode shown to visitors | 🟡 | A test-mode select exists with jargon labels (CP-01) |
| §11 Self-calibration | `routes/calibration.ts` L10–L20; `settings.ts` L44 | Suggestion thresholds and routing calibration ship **off**; topology audit and constraint mining on, proposals only; config block per mechanism; one-click rollback | ⚠️ | One flag, default not frozen, `minSampleSize` 5, `autoApplyThreshold` 0.02: the parameter-changing mechanisms are effectively on (UX-08) |
| §12.1–12.2 Strata and principles | `styles.ts`, `renderer.ts` | A border, marker or rule always signals structure in the data; machine output looks provisional; meaning never rests on colour alone | ⚠️ | Every pane gets the same bordered box regardless of meaning; suggestion state unstyled (UI-03, UX-38) |
| §12.3 Tokens | `tokens/index.ts` | Three-tier tokens | 🟡 | Defined but bypassed by 684 inline styles; eight used and never defined (UI-01) |
| §12.5 Layout | `styles.ts` L692–L713, L959 | Breakpoints 480/768/1024/1280; admin three-pane, two-pane on tablet; phone supports quick log, inbox, triage at 44 px; about 70 KB JavaScript on reading pages | ⚠️ | Editor about 500 px wide (UI-02); small targets (UX-23); performance unmeasured |
| §12.6 Home | `renderHomePage` | Statement, strata timeline, plain entry list, Ask field | 🟡 | Present; Featured unreachable (UX-17); **amended** by D-09 and the panels |
| §12.6 Ask widget states | `renderAskPage` | Nine labelled states, AI disclosure, no numeric confidence | 🟡 | Tier labels and hand-offs present in the code I read; not line-audited |
| §12.6 Admin entry workspace | `renderAdminWorkspacePage` | Three panes; Inspector tabs Structure, Context, Evidence, Answerability, History; four-step bar; Publish as is | ⚠️ | Layout matches the spec but fails in use: cramped, wrong entry, no explainers (UI-02, UX-37, CP-13) |
| §12.6 Import triage | `renderer.ts` L4720+ | Keys J, K, A, R, D, S; bulk accept; Publish as is | ✅ | Keyboard model implemented as specified. Planner cards are inert and input is paste-only (UX-35, UX-36) |
| §12.7 Interaction and motion | handlers | Every visible-to-visitors action has undo or clear confirmation; long operations show progress and can be cancelled | ⚠️ | UX-04, UX-43; import progress and cancel not found |
| §12.8 Accessibility and i18n | drawer, tabs, `strings.ts` | WCAG 2.2 AA; focus into dialogs and back; text-equivalent for the timeline; strings externalised (ICU); logical CSS for RTL | 🟡 | UX-13 to UX-15; strings catalogue bypassed by the admin; RTL not verified |
| §12.9 Copy rules | all | Sentence case; one name per action; plain words, not schema terms; errors say what happened and what to do | ⚠️ | Title Case buttons, “L0”, “Tier”, “SIMULATED”, generic errors (CP-01 to CP-15) |
| §12.10 Theme contract | `components/slots.ts` | Slots per view; live preview; override one view | 🟡 | Slots exist; no preview; frame slots for the new rails needed (WP-19) |
| §13.6 Imports under quotas | import page | Planner with Free and Fast options, progress, cancel | ⚠️ | Option cards are inert (UX-35) |
| §13.7 Build and publish the static site | Publish Now | Rebuild on demand | ✅ | Owner confirmed it works |
| §13.13 Quickstart and wizard | setup page | Six steps; keys validated live; test alert; first backup and test restore; deploy site; under fifteen minutes | ⚠️ | UX-26 to UX-33; no live key validation; no deploy step |
| §15 Security and privacy | `security.ts` | Admin never reachable unauthenticated; two-factor | 🟡 | Enrolment impossible with an authenticator app (UX-26); standalone guard (UX-05) |
| §17 Federation (optional) | `app.ts` | Manifest | 🟡 | Route exists; no owner control |
| §18 Testing | `tests/`, `apps/api/src/conformance/` | Automated suites | ✅ | Present, not executed; many assert ids and strings |
| §19 Documentation | `docs/` | Docs and versioning | 🟡 | No start-here checklist (UX-32) |
| §3, §7–§10 | — | Data model, stack, algorithms | — | Not audited |

---

## 2. MECE remediation blueprint

Per `Design Audit.md`, each finding lives in exactly one layer: **Layer 1** behaviour and flow (`UX-` IDs), **Layer 2** visual, token and component system (`UI-`), **Layer 3** semantics and microcopy (`CP-`). Other layers refer to a finding by ID only.

### 2.1 Layer 1 — Behavioural & interaction architecture

#### 2.1.1 Information architecture and navigation topology (superseded by §6)

**Principle applied.** Tabs are for peer views of the same kind of thing. Ask is an *action*, Book is a *conversion*, About/Now/Uses are *reference pages*, and admin tasks differ in frequency by orders of magnitude. Flattening them into one bar (public) or one page (admin) is the root cause behind your anti-patterns A and B.

**Public site: keep five destinations, change their roles.**

| Element | Today (`renderLayout`, `renderer.ts` L235–L375) | Proposed | Why |
| --- | --- | --- | --- |
| Primary tabs | Work · Writing · Build · Timeline · Ask, plus a theme toggle inside the nav | Work · Writing · Build · Timeline | Peer content views. Timeline is a browsing mode, so it stays. |
| Ask | A tab | A visually distinct button at the end of the header, plus a page-scoped “Ask about this” in each entry’s margin rail (spec §5.3, proxy) | It’s a task and the product’s most distinctive feature. Promote it without making it a peer of content sections. |
| Book | Footer link only | Contextual CTA on About, in the Ask hand-off (which already carries `?q=` and `facets=`), and in the entry margin rail; plus a low-emphasis header text link | The conversion path of a consulting portfolio shouldn’t live in a footer. |
| About / Now / Uses | Footer | Footer, unchanged | Reference pages; the footer is right. They still need an owner editor (UX-17). |
| Theme toggle | Inside the primary nav, `min-height:44px` | Footer utility row (header overflow menu on narrow screens) | A preference, not navigation; it also uses a slot on 360 px screens. |
| Home | Statement → strata timeline → “Recent work” (every row links to `/work`) → Ask | Statement → timeline → three short rails (Featured work, Latest writing, Currently building) → Ask | The product is blog + portfolio + builder showcase. Home shows one of the three. |

**Admin: a routed shell grouped by how often the owner does each task.** Today `/admin` is one page and the header carries seven unrelated actions (L2205–L2214). Proposed tree (the nine spec routes from the in-repo §5.1 are all present, grouped):

```
/admin/login   /admin/setup                  (no shell; setup runs once)

/admin                         TODAY dashboard: due inbox items, drafts, deploy status,
                               alerts (backup age, provider outage), onboarding checklist
├─ WRITE        (daily)
│   /admin/entries            list: filter by state, search, sort, bulk actions
│   /admin/entries/new
│   /admin/entries/:id        full-width editor; structure inspector as right-hand drawer
│   /admin/entries/:id/history   revisions, compare, restore
│   /admin/quick-log          30-second capture, mobile-first (alias: /quick-log, owner-only)
│   /admin/pages              edit /now, /about, /uses
│   /admin/ventures           feeds /build
├─ RESPOND      (daily)
│   /admin/inbox   /admin/inbox/:id
│   /admin/bookings
├─ REVIEW       (weekly)
│   /admin/import   /admin/import/jobs/:id
│   /admin/audit              conflicts + scoped constraints
│   /admin/calibration        parameters · proposals · history · rollback
├─ CONFIGURE    (rare)
│   /admin/structure          profiles, facet vocabulary, hard constraints
│   /admin/routing            answer-confidence bar, disclosure, answering on/off
│   /admin/theme              tokens with live preview
│   /admin/settings/{providers,connectors,notifications,backups,payments,federation,export}
└─ /admin/account            password · authenticator · API tokens · sign out
```

**Shell behaviour.** Left rail with the four groups above (icons only below 1024 px; off-canvas below 768 px). A top bar carries what must be visible everywhere: deploy status, the **answering on/off switch**, the below-floor warning (spec §6 asks for it to be persistent), a primary “New entry” button and the account menu. Inbox, Audit and Import show count badges. Every route is deep-linkable and has its own `<title>`, so back/forward, bookmarks and “open in new tab” work (today `app.ts` defines no per-entry route, so no entry can be linked; UX-12).

**Where today’s controls go.**

| Control today | Where | New location |
| --- | --- | --- |
| Header: Publish Now (`#btn-publish-now`) | Dashboard header | Settings › Export & publishing (“Rebuild site now”); per-entry Publish lives in the editor |
| Header: Import & Triage, Settings & Calibration | Header links | Rail items; Settings & Calibration split into three routes |
| Header: Pause Automated Answering | Header button | Top-bar switch with confirm dialog (UX-16) |
| Header: Run Backup & Restore Drill | Header button | Settings › Backups |
| Header: Export Markdown + Sidecar | Header link | Settings › Export |
| First-run walkthrough card (L2219) | Banner above the editor | Dashboard checklist, dismissal persisted server-side |
| Quick Log mode (editor toggle) | Editor pane | `/admin/quick-log` |
| Inspector tabs: Structure, Context, Evidence, Answerability, History | Five tabs | See below |
| Inbox and Conflicts panels (L2537–L2560) | Bottom of dashboard | `/admin/inbox`, `/admin/audit` |

**Fixing the inspector tab-cramming (A, relocated).** Five ARIA tabs hide the task the product is built around: *add structure, see what it unlocks*. Structure, Context and Answerability are one mental task, so merge them into a single scrollable **Structure** panel with progressive disclosure: level stepper and a “Next step” suggestion on top (derived from `gapQuestions`), then collapsible Roles, Facets and Evidence sections. History moves to its own route (rarely used, and it deserves a compare view). The panel is closed by default on a new entry (spec: structure is never a prerequisite) and opens with a quiet “Add context?” prompt after first publish.

#### 2.1.2 Entry lifecycle: the state machine the CMS is missing

The API already models the lifecycle: `visibility` (`private | unlisted | public`), revisions, and a signed redaction token bound to `(entryId, body hash, warnings)` that is required for any transition to `public`. The UI treats these as three unrelated buttons. Target machine:

```
            save              check            publish
[new] ────────▶ [draft] ────────▶ [draft + token] ───────▶ [public]
                  ▲  │ edit body          │ edit body (token void)    │  ▲
                  │  └────▶ back to [draft]  └──▶ back to [draft]      │  │ edit → save changes
                  │                         unlist ──▶ [unlisted]   │  │ (stays public; re-check
                  │                                                     │  │  if body hash changed)
                  └──────────────── unpublish ◀─────────────────────────┘
 any state ── delete (typed confirmation, consequences listed) ──▶ [gone]
```

| Transition | Trigger | API call | Guards | Today | Verdict |
| --- | --- | --- | --- | --- | --- |
| new → draft | Save draft | `POST /entries` `visibility:'private'` | title, body | `renderer.ts` L3125–L3150 | OK |
| draft → draft | Save (autosave) | `POST /entries/:id/revisions` | body changed | L3099–L3115, result unchecked | Fix: check `res.ok` |
| draft → checked | Publish dialog opens (auto-run) or “Check for private details” | `POST /entries/redaction-preview` | none | Manual click only; Publish refuses until clicked (L3537–L3543) | Fix: run automatically |
| draft → public (new entry) | Confirm in Publish dialog | `POST /entries` `visibility:'public'` + token (`entryId:'draft'`) + `nda_confirmed` | token valid, NDA if warnings | L3531–L3580 | OK only for never-saved entries |
| **draft → public (saved entry)** | Confirm in Publish dialog | **`PUT /entries/:id`** `visibility:'public'` + token (`entryId:id`) + `nda_confirmed` | same | **Always `POST` → 409** | **Broken (UX-01)** |
| draft → unlisted | Publish dialog, “Unlisted” | `PUT /entries/:id` `visibility:'unlisted'` | none (server gate is public-only) | Dropdown ignored (L2322) | **Broken (UX-03)** |
| public → public | Save changes | `POST /entries/:id/revisions`, `PUT` meta *without* touching visibility | re-check if body hash changed | `Save draft` sends `visibility:'private'` (L3106) | **Silent unpublish (UX-02)** |
| public → draft | Unpublish | `PUT /entries/:id` `visibility:'private'` | confirm | L3168–L3190 | OK |
| unpublish undo | Undo (30 s) | Re-run check, then `PUT` public + token | token | Sends `{visibility:'public'}` with no token (L3184) → 400, yet prints “Undone” | **Broken (UX-04)** |
| any → deleted | Delete | `DELETE /entries/:id` | typed confirmation | `window.confirm` (L3205) | Weak: no consequence list, no undo |

**Corrected commit path.** Replace the three separate handlers (L3082, L3531, L3168) with one function so state can’t diverge:

```ts
type Intent = 'save' | 'publish' | 'unlist' | 'unpublish';

async function commitEntry(intent: Intent) {
  const s = readForm();                       // title, slug, profile, body, date, hindsight
  const id = s.id;                            // empty for a never-saved entry
  const current = id ? state.visibility : 'private';
  // Visibility only changes on an explicit intent; 'save' preserves it.
  const target = { save: current, publish: 'public', unlist: 'unlisted', unpublish: 'private' }[intent];

  const gate = target === 'public' && current !== 'public'
    ? await ensureRedactionToken(s)           // auto-runs scan; opens drawer if warnings need review
    : null;
  if (gate && gate.cancelled) return;

  const res = id
    ? await api.put('/api/entries/' + id, { title: s.title, profile: s.profile, visibility: target,
        redactionPreviewToken: gate && gate.token, nda_confirmed: gate && gate.nda })
    : await api.post('/api/entries', { ...s.payload, visibility: target,
        redactionPreviewToken: gate && gate.token, nda_confirmed: gate && gate.nda });
  if (!res.ok) return showError(res);        // map 409/400 to specific copy (CP-12)

  if (id && s.bodyChanged) {
    const rev = await api.post('/api/entries/' + id + '/revisions', s.revisionPayload);
    if (!rev.ok) return showError(rev);
  }
  setState({ id: res.entry.id, visibility: target, dirty: false });
  toast(intent, { undo: undoFor(intent, s) });  // undo re-enters commitEntry, never raw PUT
}
```

File targets: new `apps/web/src/pages/admin/editor/commit-entry.ts` (typed, unit-testable) replacing the inline script block at `renderer.ts` L3082–L3234 and L3531–L3592. One note on the token: `verifyRedactionPreviewToken` binds the token to the body hash, so any edit voids it. The UI must clear its stored token on every body `input` event (I did not find this in the script; verify) so the dialog re-runs the scan rather than failing at the server.

**Publish dialog (replaces the bare button).** Opening it auto-runs the scan, then shows a pre-flight list: (1) *Private-detail check* with matches grouped by the three passes already built, or “Nothing found”; (2) the NDA confirmation only if matches exist; (3) *Who can see it*: Public or Unlisted; (4) *What happens next*: static rebuild queued, enrichment queued, RSS and sitemap updated, the exact URL; (5) a single primary action, **Publish**. On success: a toast with **View page** and a working **Unpublish** (not “Undo”). The existing three-pass redaction drawer becomes step (1)’s detail view rather than a separate manual detour.

**Preview.** Add a split view (editor left, rendered preview right, shared scroll) and **Preview as visitor**, which renders the draft revision through the real public entry template at a signed, unguessable URL. This closes the spec’s “draft pages … published as is” loop. The current Preview button simply swaps the textarea for a rendered div (`#btn-toggle-editor-mode`, L3501) so the writer can’t see both at once.

#### 2.1.3 Authoring mechanics (input ergonomics)

The spec asks for an expansive, distraction-free place to write. What exists is a 12-row `<textarea>` with a minimum height of 60 vh (`#entry-body`, L2359; `.editor-textarea`, `styles.ts` L764), a toolbar that only inserts Markdown syntax, and a Preview toggle. Behaviour to add (layout changes are in Layer 2, UI-02):

| Mechanic | Today | Target |
| --- | --- | --- |
| Persistence | None between clicks; closing the tab loses unsaved text | Local autosave every \~2 s to IndexedDB, restored on reopen, plus a `beforeunload` guard while dirty. Server revisions stay explicit (⌘/Ctrl+S) because revisions are immutable per the spec, and per-keystroke autosave would bury real history. |
| Entry state visibility | The script updates `#chip-current-state` (L2579, L3130, L3175) but that element isn’t in the markup, so the owner never sees Draft / Public / Unlisted (UX-10) | A persistent state chip beside the title: Draft · Public · Unlisted, with “Unsaved changes” and “Last saved …” |
| Date | `value="2026-10-19"` is baked into the markup (L2330); clearing the field makes `new Date('').toISOString()` throw a `RangeError` before the `try` block (publish handler, L3558) (UX-11) | Default to today (client-side), validate on blur, never throw |
| Temporal confidence | All three write paths hard-code `temporal_level:'exact'` | A “How sure are you of this date?” control (Exact, Range or Estimated, the spec’s three levels), as the spec’s temporal-confidence levels require (UX-22) |
| Slug | Auto-fills from the title until edited; no availability check, so a clash is discovered only after Publish returns 409 | Check availability on blur (`GET /entries/:slug`, 404 means free) and show the result inline |
| Preview | Toggle swaps the textarea for a rendered div | Split view + Preview as visitor (2.1.2) |
| Keyboard | Toolbar buttons only | ⌘/Ctrl+B and +I, ⌘/Ctrl+S save, ⌘/Ctrl+Enter open Publish dialog, Esc closes drawers, Ctrl+\\ toggles the inspector |
| Focus mode | None | Hides rail, top bar and inspector; keeps title, body and state chip |
| Media | No image or file insertion | Drag/paste image upload (spec: multimodal content blocks, object storage); alt-text prompt |
| Guided mode | A panel of four single-line inputs above the editor that “compiles into body” | Inline prompts that appear *inside* the editor as collapsible section scaffolds (Problem, Approach, Outcome, Lesson), so the writer never leaves the document |
| Quick Log | A third mode toggle inside the editor, behind the same cramped pane (UX-18) | Own route, the spec’s four short fields (what happened, what was decided, what was learned, which venture) and one button, “Add date/context later” link; installable as a home-screen shortcut |

#### 2.1.4 CRUD completeness audit

Every resource the API exposes, against what the web app lets the owner do. ✓ = reachable in UI, ✗ = not, · = not applicable.

| Resource (API) | C | R | U | D | Missing and fix |
| --- | --- | --- | --- | --- | --- |
| Entries (`/entries`) | ✓ | ✓ | ✓ | ✓ | State transitions broken (2.1.2). No list filters/search; delete is `window.confirm`. |
| Revisions (`/entries/:id/revisions`) | ✓ | ✓ (id + hash only) | · | ✗ | No diff, no body preview, no restore. History route with compare and “restore as new revision”. |
| Visibility (unlisted) | ✗ | · | ✗ | · | UX-03. |
| Featured flag | ✗ | ✓ (Home) | ✗ | ✗ | Add a “Feature on Home” toggle and reorder in the entries list (UX-17). |
| Pages: `/now`, `/about`, `/uses` | ✗ | ✓ (placeholder) | ✗ | ✗ | `/admin/pages` editor using the same Markdown workspace; no schema yet, so this needs a small `pages` resource. |
| Ventures (`/structure/ventures`) | ✗ | ✓ (`/build`) | ✗ | ✗ | `/admin/ventures` with an entry picker so dev-log entries attach to a venture. |
| Facets | ✓ | ✓ | ✓ (confirm) | ✗ | No remove or edit of a wrong facet; add “remove” and “edit value”. |
| Evidence | ✓ | ✓ | ✗ | ✗ | No remove or relabel; the API has no delete route either, so add one. |
| Role annotations | ✓ (suggested) | ✓ | ✓ (accept/reject) | ✗ | No manual role marking on a selected passage. |
| Claims / relations | ✗ | partly (display) | ✗ | ✗ | API supports `POST/PATCH` (`structure.ts`); UI has no authoring, so supersedes/contradicts links, the basis of later-thinking banners, can only come from machine suggestions. |
| Escalations (`/inbox`) | · | ✓ | ✓ (approve/reject) | ✗ | Needs its own route, filters (pending, due soon, answered) and an edit-size indicator. |
| Bookings (`/book` GET) | · | ✗ | ✗ | ✗ | Visitors can submit, but the owner has nowhere to read requests. `/admin/bookings`. |
| Scoped constraints | · | ✓ | ✓ (confirm/discard) | ✗ | Show the source quote and scope (spec §6.2) before confirm. |
| Topology conflicts | · | ✗ | ✗ | · | API `GET /audit/topology-conflicts`, `POST /detect`, `/:id/resolve` exist; UI prints a static “not implemented” note (CP-02). |
| Calibration proposals | · | ✗ | ✗ (apply) | ✗ (rollback) | API `GET /calibration/proposals`, `POST /apply`, `GET /history`, `POST /rollback/:id`; no UI. |
| Import jobs and connectors | ✗ | ✗ | ✗ (pause/resume) | · | `GET /import/connectors`, `POST /connectors/:id/crawl`, `/jobs/*`; UI is paste-only. |
| Routing / settings | · | ✓ | ✓ (3 numbers) | · | No provider keys, budgets, connectors, payments, storage, federation. |
| Theme tokens | · | ✓ | ✓ (2 hex fields) | · | No preview, no contrast check, no dark/light swatches. |
| Redaction exclusions | ✗ | ✗ | ✗ | ✗ | `PATCH /settings/redaction` exists; the owner can’t maintain the list of client or project names the scanner should catch. |
| Auth: password, TOTP, API tokens | ✓ (setup) | ✗ | ✗ | ✗ | No sign-out, password change, TOTP re-enrolment or token revocation. |
| Evaluation runner | · | ✗ | · | · | `GET/POST /settings/evaluation`; needed to honour the principle “structure must earn its keep”. |

#### 2.1.5 System-state coverage (non-happy paths)

Only states I could verify from the code are marked ✓ or ✗; “?” means I couldn’t confirm without running the app.

| View | Loading | Empty | Error | Partial | Offline | Permission denied |
| --- | --- | --- | --- | --- | --- | --- |
| Admin dashboard (`/admin`) | ? | ✗ entries list renders nothing when empty (`entriesListHtml` is an empty string) | ✓ for actions (`renderAdminError`: network, 401, 403, 5xx) but ✗ for the initial server render, which can throw (UX-05) | ✗ one failing fetch aborts the whole page (`Promise.all` over every entry, L2032–L2062) | ✗ | ✗ unguarded in standalone mode; in bundled mode the guard redirects |
| Editor | ? | ✓ “New entry” | ✓ banner (but 409 and 400 collapse into generic copy, CP-12) | ✗ revision save result is ignored | ✗ no local buffer | ✓ 401 banner with sign-in link |
| Inspector | ? | ✓ “No evidence attached yet” | ? | ? | ✗ | ? |
| Inbox | ✗ | ? | ? | ✗ | ✗ | ? |
| Import | ? | ✓ | ✓ | ✗ | ✗ | ? |
| Settings | ✗ | · | ✓ per section | ✗ provider table is hard-coded, so “degraded” provider states can’t appear | ✗ | ? |
| Public Home, Work, Timeline | · | ✓ dedicated empty states (L715, L1104, L1288) | ? | ✗ | ✗ | · |
| Ask | ? | ✓ | ✓ tiers and hand-off | ✓ extractive degradation | ? | · |

Two specific fixes. (1) The dashboard fetches every entry’s revisions, facets, claims and annotations before sending any HTML (`renderAdminWorkspacePage` L2032–L2062). Replace with a paginated entries list and load detail only for the selected entry; this also removes the “inspector always shows the first entry” behaviour. (2) Add a global offline/online banner and keep the local draft buffer so an outage never costs writing.

#### 2.1.6 Accessibility and interaction mechanics (WCAG 2.2 AA)

| ID | Issue | Evidence | Fix |
| --- | --- | --- | --- |
| UX-13 | The redaction drawer is a fixed `<aside>` with no `role="dialog"`, no `aria-modal`, no Escape handler, no focus trap and no focus return. | `renderer.ts` L2390; the admin script has no focus handling beyond two `textarea.focus()` calls | Build one reusable `Drawer` primitive (`role=dialog`, labelled by its title, trap focus, Esc closes, return focus to the trigger). |
| UX-14 | The inspector uses `role=tab` / `tabpanel` but no arrow-key navigation or roving `tabindex`; the admin script registers no `keydown` handlers. | L2444–L2448 | Implement the ARIA tabs pattern, or after the merge in 2.1.1 remove tabs and use disclosure sections. |
| UX-15 | The 30-second Undo offer is injected into a `role=region` that isn’t live, so screen-reader users don’t hear it; focus doesn’t move after Save, Publish or Delete. | `#admin-undo-banner`, L2216 (I) | Use a polite live region for toasts, and move focus to the state chip or toast action after commits. |
| UX-16 | The answering kill switch is a `button` whose label *and* `aria-pressed` both change, and “pressed” means *enabled* while the label says “Pause”. It acts instantly with no confirm. This is the one control that changes what the public is told. | L2208, L3594 | A `role=switch` with a stable label “Automated answering” and on/off state; confirm on turning off with a statement of what visitors will see instead. |
| UX-23 | Target size: dozens of controls use `padding:2px 8px; font-size:12px` (`#btn-new-entry` L2245, the mode toggles L2258–L2262, Dismiss L2219). On fine pointers that’s roughly 20 px tall, below WCAG 2.2 SC 2.5.8 (24 × 24). `styles.ts` L959 only enlarges targets for coarse pointers. | markup (I for rendered size) | A `Button` primitive with `sm` ≥ 24 px and `md` ≥ 36 px; ban inline `padding` on `.btn`. |
| UX-24 | Triage uses single-character shortcuts (J, K, A, R, D, S). SC 2.1.4 requires a way to turn off or remap them. | `renderer.ts` L4805–L4820 (legend) | Add a “Keyboard shortcuts” toggle in the triage header, on by default only while the triage list has focus. |
| UX-25 | Delete sits beside Unpublish in the same row with the same size (L2377–L2386), a mis-tap risk on touch. | markup (I) | Separate destructive actions into an overflow menu with a typed-confirmation dialog. |

#### 2.1.7 Layer 1 deliverable — UX Diagnostic & Remediation Matrix

| File path | Flow / state gap | UX dimension | Concrete code or flow fix |
| --- | --- | --- | --- |
| `apps/web/src/renderer.ts` L3531–L3580; `apps/api/src/routes/entries.ts` L357–L400 | UX-01 Publish of a saved entry POSTs and hits 409 | Task completion; error recovery | `commitEntry('publish')` (2.1.2): `PUT /entries/:id` with token and NDA flag; map 409 to a slug-specific message. |
| `renderer.ts` L3099–L3115 | UX-02 Save draft on a public entry sends `visibility:'private'` | Data safety; trust | `save` preserves visibility; only `unpublish` may lower it. |
| `renderer.ts` L2322; L3106, L3140, L3562 | UX-03 Visibility select is dead; Unlisted unreachable | Control integrity | Replace with Publish dialog’s “Who can see it”. Delete the select. |
| `renderer.ts` L3122, L3181–L3190 | UX-04 Undo is a no-op or fails while reporting success | Honesty of feedback | Undo is only offered when the inverse call is verified; always check `res.ok` before changing the banner. |
| `apps/web/src/app.ts` admin block; `apps/api/src/adapter/bundled-web.ts` | UX-05 Standalone `/admin*` is unguarded; SSR client is tokenless; browser fetches are relative | Security; reachability | Make `/admin` a client-rendered shell served after an authenticated session check (redirect to `/admin/login`); the shell calls `/api/v1` with an explicit `API_BASE_URL`; add a `web` service to Compose or document bundled mode as the default. |
| `renderer.ts` L3839; new `layouts/admin-shell.ts` | UX-06 Admin wrapped in public layout; no admin nav; no sign-out | Wayfinding | Admin shell (2.1.1) with account menu and `POST /auth/logout`. |
| API vs. `renderer.ts` | UX-07 Eight capabilities with no UI | Feature discoverability | New routes in 2.1.1; build in this order: calibration, audit, bookings, connectors, ventures. |
| `calibration.ts` L10–L20; `settings.ts` L44; `renderer.ts` L3899 | UX-08 Calibration on by default, 5-sample gate, UI offers only “Freeze” | Safety default | Default `calibrationEnabled:false`; raise `minSampleSize` to the documented gate; invert the control to “Enable self-calibration” with an explanatory threshold; never auto-apply threshold changes. |
| `renderer.ts` L4417–L4466 | UX-09 Wizard step 3 is non-interactive | Onboarding | Per-provider key field with “Test key” (live call before save), storage backend radio, “Skip, use extractive answers”. |
| `renderer.ts` L2579 | UX-10 `#chip-current-state` doesn’t exist | Status visibility | Add the chip to the editor header. |
| `renderer.ts` L2330, L3558 | UX-11 Stale date default; empty date throws | Input validation | Default to today; validate; wrap payload construction in `try`. |
| `apps/web/src/app.ts` | UX-12 No per-entry admin URL | Deep-linking | `/admin/entries/:id`; `history.pushState` on selection. |
| `renderer.ts` L2390 | UX-13 Drawer is not a dialog | Accessibility | `Drawer` primitive. |
| `renderer.ts` L2444–L2448 | UX-14 Tabs without keyboard support | Accessibility | See 2.1.6. |
| `renderer.ts` L2216 | UX-15 Undo/toast not announced; no focus management | Accessibility | Live region and focus return. |
| `renderer.ts` L2208, L3594 | UX-16 Kill switch semantics and no confirm | Safety; accessibility | Switch plus confirm. |
| `renderer.ts` L1680–L1720; L648–L740 | UX-17 About/Now/Uses uneditable; “featured” unreachable | Content ownership | `/admin/pages`; featured toggle in entries list. |
| `renderer.ts` L2258–L2262, L2938 | UX-18 Quick Log buried in the editor | Capture speed | `/admin/quick-log` route. |
| `renderer.ts` L330, `renderBookPage` L1722 | UX-19 Book only in footer; no owner inbox for bookings | Conversion | CTAs in 2.1.1; `/admin/bookings`. |
| `renderer.ts` L648–L740 | UX-20 Home shows only /work rows; rows for freeform posts link to /work | Information scent | Three rails; link by profile (freeform → `/writing`). |
| `renderer.ts` (three write paths) | UX-22 `temporal_level` always `'exact'` | Data integrity | Temporal-confidence control. |
| `renderer.ts` L2245–L2262; `styles.ts` L959 | UX-23 Sub-24 px targets on fine pointers | Accessibility | `Button` size scale. |
| `renderer.ts` L4805–L4820 | UX-24 Single-key shortcuts can’t be disabled | Accessibility | Shortcut toggle. |
| `renderer.ts` L2377–L2386 | UX-25 Destructive button adjacent to Unpublish | Error prevention | Overflow menu + typed confirm. |

---

### 2.2 Layer 2 — Visual, token & component system architecture

Scope: tokens, component hierarchy, responsive rules and package topology. It builds on the states defined in Layer 1 and excludes flow logic and wording.

#### 2.2.1 Design-token architecture

**What’s already good.** `apps/web/src/tokens/index.ts` (261 lines) is a real three-tier system: primitives (palettes, a 4 px spacing scale, a 1.2-ratio type scale, radii), semantics (surfaces, text, rules, roles, status, elevation, z-index, light and dark with `[data-theme]`), and component tokens (button, field, editor). It also has a `prefers-contrast: more` block (L248). The problem is that the interface mostly doesn’t use it.

**UI-01 — tokens used but never defined.** No definition was found in `tokens/index.ts`, `styles.ts` or the layout `<head>` for any of these (verified by a scripted scan of every `var(--…)` against every declared property, then by grep):

| Token used | Where | Effect | Fix |
| --- | --- | --- | --- |
| `--radius-control` | `styles.ts` L163, L176; 19 uses in `renderer.ts` (admin panes, book form, escalation cards) | `border-radius` is invalid, so those boxes render square while the designed ones are rounded | Add `--radius-control: var(--radius-6)` to the component tier |
| `--radius-card` | Empty states (L715, L1104, L1181, L1258, L1288) | Same | `--radius-card: var(--radius-12)` |
| `--bg-base` | Redaction drawer background, L2390 | The drawer has no background colour, so page content shows through the panel that holds the most sensitive review in the product (I: confirm in browser) | Add `--surface-overlay` and use it |
| `--bg-subtle` (5), `--surface-subtle` (2), `--surface-panel` (1, wizard progress track L4328) | Admin panes, wizard | Transparent | One new semantic: `--surface-sunken` |
| `--green` | Wizard step 3 “Active” status | Falls back to inherited colour | `--status-success-fg` |
| `--role-challenge` (4, with a `#f59e0b` fallback) | Staging and import banners | Works only through the hard-coded fallback | `--status-warn-border` |

**Other token debt (counts from a scripted scan of `renderer.ts`).**

- **684 inline `style` attributes** and **1,036 `px` literals** against a spacing scale of eight steps.
- **Off-scale type.** The scale is 14/16/18/21/25/30/36/44, but inline sizes are 13 px (83 uses), 12 px (76), 11 px (26) and 15 px (7). That is 192 of 265 inline font sizes (72%) on no step of the scale.
- **32 hard-coded hex colours in `renderer.ts` and 7 in `styles.ts`**, several duplicating primitives (`#3A4FD0` is `--indigo-600`; `#b42318` is `--red-700`).
- **z-index bypass.** Literal `10` (×3), `999`, `9999` against tokens `--z-sticky: 100` and `--z-overlay: 200`.
- **Invalid CSS:** `flex-wrap:gap` appears three times (L1510, L2254, L2377), so those rows never wrap.
- **Themes.** Light, dark and a partial `prefers-contrast: more`; no `forced-colors` support and no explicit high-contrast theme, which `Design Audit.md` lists as a target.

**Target taxonomy** (additions only; existing tokens stay):

| Tier | Add | Rule |
| --- | --- | --- |
| Primitive | none | Never referenced from markup. |
| Semantic | `--surface-sunken`, `--surface-overlay`; `--status-{success,warn,danger,info}-{fg,bg,border}`; `--text-caption` (12/16), `--text-body-sm` (14/20), `--text-body` (16/24), `--text-h3` 18, `--text-h2` 21, `--text-h1` 30; `--elevation-drawer`; `--target-min` (24), `--target-touch` (44) | Components and pages use only semantic or component tokens. |
| Component | `--radius-control`, `--radius-card`, `--drawer-width: 460px`, `--admin-rail-width`, `--admin-inspector-width`, `--field-grid-gap` | One owner per component. |

Type decision for the admin: body 14 px, captions 12 px minimum; retire 11 px, 13 px and 15 px.

**Hardcoded-to-Token Migration Table** (Layer 2 deliverable)

| File path : line | Current hard-coded value | Proposed semantic token |
| --- | --- | --- |
| `renderer.ts` L2390 | `background:var(--bg-base)` | `var(--surface-overlay)` |
| `renderer.ts` L2390 | `box-shadow:-4px 0 24px rgba(0,0,0,0.18)` | `var(--elevation-drawer)` |
| `renderer.ts` L2390 | `width:460px; max-width:92vw` | `width:min(var(--drawer-width), 92vw)` |
| `renderer.ts` L2390 (the single `z-index:9999`) | `z-index:9999` | `var(--z-overlay)` |
| `renderLayout`, staging banner (L\~262) | `z-index:999`; `var(--role-challenge,#f59e0b)` | `var(--z-sticky)`; `var(--status-warn-border)` |
| `renderBookPage` confirmation chip (L\~1740) | `background:#d1fae5; color:#065f46` | `--status-success-bg` / `--status-success-fg` |
| Constraint confirm / discard handlers (L3710–L3780) | JS-set `#d1fae5/#065f46` and `#fee2e2/#991b1b` | Toggle `data-status` and let CSS apply `--status-*` tokens (no inline colour mutation) |
| `renderer.ts`, 83 occurrences | `font-size:13px` | `--text-body-sm` (14 px) or `--text-caption` |
| `renderer.ts`, 76 + 26 occurrences | `font-size:12px`, `11px` | `--text-caption` (12 px; drop 11 px) |
| `renderer.ts`, 5+ occurrences (Ask, Settings, Import h1) | `font-size:28px` / `30px` | `--text-h1` |
| `renderer.ts` L2219, L2245, L2258–L2262 | `padding:2px 8px; font-size:12px` | `Button size="sm"` (≥ `--target-min`) |
| `renderer.ts` L2380 (Delete) | `var(--red-700,#b42318)` | `var(--status-danger-fg)` |
| `renderBookPage` | `var(--status-warn,#d97706)` | `var(--status-warn-fg)` |
| Settings theme inputs (L\~3965) | default `#3A4FD0`, `#9AA8FF` | read from `DEFAULT_STRATA_THEME`; display as swatches bound to `--indigo-600` / `--indigo-300` |
| `renderLayout` brand logo | `height:24px; margin-right:8px` inline | `.site-brand__logo { height: var(--logo-height) }` |
| `renderLayout` theme toggle | `style="min-height:44px"` | `var(--target-touch)` via `.btn` |
| `renderer.ts` L2317 | `grid-template-columns:1fr 1fr 1fr 1fr` (entry meta row) | `.field-grid` with a container query (4 → 2 → 1) |
| `renderer.ts` L1510, L2254, L2377 | `flex-wrap:gap` | `flex-wrap:wrap; gap:var(--space-2)` |

#### 2.2.2 Atomic hierarchy and component API

**As-is.** `apps/web/src/components/` has five files (`button`, `chip`, `field`, `entry-card`, `slots`). `renderer.ts` imports `renderButton`, `renderChip` and `renderField` at L22 but **calls each of them zero times**. Only `renderEntryRow` (4 calls) is used. Every button, chip and form field in roughly 3,000 lines of admin and public markup is hand-written HTML with inline style, so the component library cannot enforce target size, state variants or focus styles. The client behaviour (about 1,800 lines for the workspace alone, L2574–L3837) lives in template-literal strings: untyped, unlinted and untestable except through Playwright. The admin API helper (`ADMIN_API_CLIENT_SCRIPT`, L2005) is pasted into each page separately.

**Target hierarchy.**

| Level | Contents |
| --- | --- |
| Elements | `Button`, `IconButton`, `Link`, `Chip`/`Badge`, `Field` (`Input`, `Textarea`, `Select`, `Checkbox`, `Switch`), `Heading`, `VisuallyHidden` |
| Components | `Toast`, `Banner`, `Dialog`, `Drawer`, `Disclosure`, `Tabs`, `Table`, `EmptyState`, `StateChip`, `EntryRow` |
| Modules / patterns | `EditorWorkspace`, `PublishDialog`, `RedactionReview`, `StructurePanel`, `TriageBoard`, `SettingsSection`, `EscalationCard`, `ProviderRow`, `UndoToast` |
| Page templates | `PublicShell` + `ReadingColumn`, `AdminShell` + `Workbench` (list/detail), `WizardShell`, `SettingsTemplate` |

**Prop API standards.** `Button`: `variant` (primary, secondary, danger, ghost), `size` (sm ≥ 24 px, md ≥ 36 px; touch auto-promotes to 44 px), `loading`, `href` or `type`, `iconStart`. `Banner`/`Toast`: `tone` (info, success, warn, danger), `live` (polite, assertive), optional `action`. `Dialog`/`Drawer`: required `title`, `onClose`, `initialFocus`. `Field`: required `label`, optional `hint`, `error`; error text is linked with `aria-describedby`.

| Do | Don’t |
| --- | --- |
| Use a `Button` variant for emphasis | Write `class="btn"` with inline padding or font size |
| Express state with `data-status` and tokens | Set colours from script (`style.background = '#d1fae5'`) |
| Pass copy from the string catalogue | Inline copy in markup (CP-series) |
| Use one `Drawer` for every slide-over | Hand-position `position:fixed` panels |
| Keep existing element `id`s and `data-*` hooks during migration | Rename ids without updating the conformance and Playwright suites that assert them (40+ API conformance files and 12 e2e specs reference markup) |

#### 2.2.3 Cross-viewport and input adaptation

| Viewport | Today (`styles.ts` L692–L713, L959) | Proposed |
| --- | --- | --- |
| ≥ 1280 px, admin | Three columns 240 / 1fr / 340 inside the 1180 px page cap, so the editor gets about 500 px (I: confirm computed width) | Admin shell uses the full viewport; rail 220 px; the writing canvas is `minmax(0, 1fr)` with text capped at about 72 characters; inspector docked at ≥ 1440 px, otherwise an overlay drawer |
| 1024–1279 px | Two-column rule applied to three children (list, editor, inspector), so the editor can land in the 340 px column (I) | Rail collapses to icons; list becomes a slide-over; editor full width; inspector overlay |
| 768–1023 px | Single column; list, editor and inspector stack | Same stack but with a sticky action bar (Save, Publish) |
| < 768 px | Public nav has five links plus the theme toggle (I: verify wrapping at 360 px); admin is the stacked desktop layout | Bottom bar (Today, Write, Inbox, More); Quick Log as the default landing action; editor toolbar pinned above the keyboard using `visualViewport` |
| Entry meta row | Four equal columns at any width, so about 110 px inputs in a 500 px pane (L2317) | Container query: 4 → 2 → 1 by pane width, not viewport width |
| Pointer | A coarse-pointer rule enlarges targets (L959) | Keep; make 44 px the floor for primary actions on both pointer types |
| Motion | `prefers-reduced-motion` honoured (L1091) | Keep; reuse it for the new drawer and toast transitions |

#### 2.2.4 Aesthetic craft and differentiation

The public side already has a distinctive idea (the strata timeline, a serif reading face, entry rows with a date glyph). The admin looks like a stack of bordered cards, with every section wrapped in an identical `.admin-pane`. Concrete upgrades:

1. **One canvas, not nested boxes.** Use a single `--surface-sunken` workspace with hairline dividers; reserve bordered cards for items that are objects (an escalation, a proposal).
2. **Make the writing surface feel like the published page.** Render the editor in `--font-reading` at the same measure as the public article, so what the owner sees is what visitors read; keep chrome (toolbar, status) quiet and low-contrast until hovered.
3. **Choreographed transitions, short and purposeful.** The drawer slides 200 ms ease-out with the scrim; publish success morphs the state chip from Draft to Public and then shows the toast; the inspector’s level stepper animates one step when structure is added. All gated by `prefers-reduced-motion`.
4. **Optical alignment.** Align chip text and icon baselines, give buttons with leading icons equal optical padding, and match the 4 px grid for every gap (today a mix of 6, 8, 10, 12, 14, 16 px appears).
5. **Meaningful empty states** that name the next action (“Write your first entry”, “Import what you already have”) rather than a blank list.

#### 2.2.5 Package file topology

Both specs call for an admin that is separable from the public site (the uploaded spec’s `apps/admin`; the in-repo spec’s React SPA). The shipped admin is the middle 1,800 lines of one 5,119-line file. Recommended path: **Step 1** (low risk, unblocks the Layer 1 work) split the files without changing behaviour and keep the old export names; **Step 2** (optional, matches both specs) lift `pages/admin` and `client/admin` into `apps/admin`, served as a client-rendered shell that talks to `/api/v1`, which also removes the unauthenticated server-render problem in UX-05.

**As-is**

```
apps/web/src/
├── app.ts                 (160)   routes, no admin guard
├── renderer.ts          (5,119)   public pages + admin + wizard + import + client scripts
├── styles.ts            (1,098)   all CSS as one string
├── strings.ts             (291)   catalogue, partly used
├── markdown.ts            (367)
├── tokens/index.ts        (261)
└── components/ button chip entry-card field slots   (button/chip/field never called)
```

**To-be**

```
apps/web/src/
├── tokens/        primitive.ts  semantic.ts  component.ts  themes/{light,dark,high-contrast}.ts
├── styles/        base.ts  layout.ts  admin.ts  print.ts
├── primitives/    button  icon-button  chip  field  switch  heading  link
├── components/    toast  banner  dialog  drawer  disclosure  table  empty-state  state-chip  entry-row
├── patterns/      editor-workspace  publish-dialog  redaction-review  structure-panel
│                  triage-board  settings-section  escalation-card  undo-toast
├── layouts/       public-shell  admin-shell  wizard-shell  reading-column
├── pages/
│   ├── public/    home  entries-index  entry  build  timeline  ask  ask-status  book  static  not-found
│   └── admin/     dashboard  entries/{list,editor,history}  quick-log  pages  ventures  inbox
│                  bookings  import  audit  calibration  structure  routing  theme
│                  settings/{providers,connectors,notifications,backups,payments,federation,export}
│                  account  login  setup/{step1…step6}
├── client/        typed, bundled modules (esbuild) injected with the CSP nonce the layout already supports
│                  admin/{api,commit-entry,editor,redaction,inspector,inbox,triage,settings}.ts  ask.ts
├── strings/       en.ts  index.ts      (the only place user-visible copy lives)
└── index.ts       barrel: re-exports the current public names so bundled-web.ts keeps compiling
```

**Exact moves from `renderer.ts`.**

| Lines | Content | Destination |
| --- | --- | --- |
| L56–L233 | `adaptDataSource`, escapers, URL sanitiser | `lib/data-source.ts`, `lib/html.ts` |
| L235–L375 | `renderLayout` | `layouts/public-shell.ts` (admin gets its own `admin-shell.ts`) |
| L376–L647 | `renderStrataTimelineSection` | `components/strata-timeline.ts` |
| L648–L740 | Home | `pages/public/home.ts` |
| L741–L1120 | Entry detail; work and writing index | `pages/public/entry.ts`, `entries-index.ts` |
| L1121–L1326 | Not found; Build; Timeline | `pages/public/{not-found,build,timeline}.ts` |
| L1327–L1679 | Ask page and its script | `pages/public/ask.ts` + `client/ask.ts` |
| L1680–L1869 | Static pages; Book | `pages/public/{static,book}.ts` |
| L1870–L2027 | Ask status | `pages/public/ask-status.ts` |
| L2028–L3839 | Admin workspace | `pages/admin/{dashboard,entries/*,inbox,audit}.ts`, `patterns/{editor-workspace,redaction-review,structure-panel}.ts`, `client/admin/*` |
| L3841–L4196 | Settings | `pages/admin/settings/*` |
| L4197–L4719 | Login; Setup | `pages/admin/login.ts`, `pages/admin/setup/*` |
| L4720–L5119 | Import and triage | `pages/admin/import.ts`, `client/admin/triage.ts` |

---

### 2.3 Layer 3 — Semantic & microcopy architecture

Scope: terminology, interface strings and recovery-oriented messages. It builds on the flows in Layer 1 and the space constraints in Layer 2. Line numbers marked “\~” are approximate (taken from section offsets rather than a direct hit).

**What’s already good, and should be kept.** The visitor-facing voice is warm and honest: “If I can’t back something up, I’ll say so.”, “Structure is optional. You can publish now and add more later.”, “Are you writing about something that happened earlier?”. `strings.ts` already defines a canonical catalogue and a three-part error formatter. The problem is that the owner-facing UI bypasses it and speaks the language of the spec and the test suite.

#### 2.3.1 Terminology taxonomy

| Concept | Variants found | Canonical owner-UI term | Canonical visitor-UI term |
| --- | --- | --- | --- |
| A piece of content | entry, case study, write-up (walkthrough), record / “Portfolio Records” (booking confirmation), Visitor Question | **Entry** (owner); profile name for the type | **Case study**, **Post** by profile; never “record” |
| Not yet public | Private (Draft), private, Unpublished, “draft” | **Draft** (state). “Private” is not a separate state. | n/a |
| Going live | Publish, Publish Now (site rebuild), Publish as is (import), “Deploy: Ready” | **Publish** = make an entry visible; **Rebuild site** = regenerate static pages; **Site status** | n/a |
| Visitor question for the owner | Inbox, escalation, Visitor Question, Tier 2 / Tier 3, pending | **Inbox** / **Question** | “Send to the owner” |
| Added meaning | Structure, Context, Facets, Roles, Claims, L0–L3 | **Structure** with four plain steps: Text → Context → Roles → Claims. Level codes are never shown. | n/a |
| Confidence settings | Floor, Tier 1 Advisory Floor, Tier 2 Escalation Floor, Facet Known Threshold | **Automatic-answer bar**, **Owner-review bar**, **Context-match bar** | optional disclosure: “This site answers automatically above …” |
| Self-tuning | Routing Floors & Calibration, Freeze Calibration, System Calibration | **Self-tuning** (off by default) | n/a |
| Automatic replies | Automated Answering, Answering: Active, Kill-switch | **Automatic answers** (on/off) | “Automatic answers are paused” |
| Voice | Visitor pages use “I/my”; the booking confirmation says “We’ve received” | First person singular on every visitor surface |  |
| Casing | Mixed Title Case (“Run Backup & Restore Drill”) and sentence case | **Sentence case** for every button, label and heading |  |

**Writing rules.** Verb-first buttons naming the object (“Publish entry”, not “Submit”). No tier numbers, level codes, HTTP codes, finding IDs or status enums in primary text; they may appear in a collapsed “Details”. Every warning states the consequence and offers the recovery action. A promise (such as a reply time) is written once, from configuration.

#### 2.3.2 Actionable errors

The API already returns usable messages (for example `entries.ts` L252 and L276 return “Check this entry for private details before making it public.”), but `renderAdminError` (script in `renderer.ts`, \~L2588–L2603) discards `message` and prints generic text. Map every status to *what failed, why, what to do now*:

| Status | Today | Target |
| --- | --- | --- |
| 400, redaction token missing or stale | “Action failed. Check your input and retry.” | Server message plus a button: “You edited this entry after the last check. Check it again.” \[Check for private details\] |
| 400, NDA confirmation required | same | “We found {n} items that might be private. Confirm they’re cleared, or hide them, then publish.” \[Review matches\] |
| 401 | “Your session has expired. You’re signed out. Sign in again →” | Keep; add “Your draft is saved on this device.” |
| 403 | “Security check failed (CSRF token invalid or missing)…” | “Your session timed out. Reload and sign in again. Your draft is saved on this device.” |
| 409 | generic | “An entry at /work/{slug} already exists. Change the address, or open that entry.” \[Change address\] \[Open existing\] |
| 429 | generic | “Too many attempts. Wait {n} seconds and try again.” |
| 5xx | “Server error (HTTP 500). Can’t reach the server. Please retry your request.” | “Something went wrong on the server and nothing was saved. Try again in a moment.” (the old text contradicts itself: a 5xx means the server was reached) |
| Network failure | “Can’t reach the server. Please check your connection and retry.” | Keep; add the offline draft reassurance and a Retry button |

Because the admin script is a template string it cannot import `strings.ts`; bundling `client/admin/*` (2.2.5) is what lets one catalogue serve both server and browser.

#### 2.3.3 Layer 3 deliverable — file-mapped copy audit

| File path & line | Current string | Optimized string | UX-writing rationale |
| --- | --- | --- | --- |
| `renderer.ts` L2553 | “Automated claim topology conflict detector is not yet implemented (SIMULATED finding M6). No active conflicts detected.” | Interim: “Conflict checking isn’t turned on yet, so nothing has been checked.” Final: “No contradictions found as of {date}. \[Check now\]” | The original says nothing has been detected while also saying detection doesn’t exist, which breaks the product’s own honesty principle. Unchecked is not the same as clear. |
| `renderer.ts` \~L2548 | Chip: “501 Not Implemented” | “Not available yet”, later “Checked {date}” | HTTP codes mean nothing to the owner. |
| `renderer.ts` L3580 | “Published ‘{title}’ at L0. View entry →” | “‘{title}’ is live. View page →” plus a quiet “Add context later to unlock more questions.” | Say the outcome and the next optional step; drop the internal level. |
| `renderer.ts` L1747 | “We’ve received your request for: … The owner will review your architectural context and reach out at … within 24 hours” | “Thanks. I’ve got your request about ‘{topic}’. I’ll reply at {contact}, usually within {sla}.” | Matches the site’s first-person voice; “architectural context” assumes the topic. |
| `renderer.ts` L1540, L1747, L1899, L1926 | “24 hours” written four times | One `REPLY_SLA_HOURS` setting, rendered by a single helper | A promise the owner can’t change; wrong whenever they’re away. Honesty risk. |
| `renderer.ts` L2200–L2203 | H1 “Admin Workspace”; subtitle “Entry-first authoring, machine-suggested structure inspector, routing kill-switch, self-calibration, and encrypted backups.” | H1 “Today”; no subtitle, then “2 questions due today · 1 draft” | A feature list isn’t orientation. State what needs attention. |
| `renderer.ts` L2219–L2224 | “First-Run Authoring Walkthrough: 1. Paste write-up or choose Guided mode. 2. Use Inspector to accept suggested roles & confirm facets. 3. Preview redactions and publish.” | “Get started: 1 Write or paste something. 2 Check it for private details. 3 Publish. Adding structure is optional and can wait.” | Replaces system words (inspector, roles, facets, redactions) with the task; reflects “structure is optional”. |
| `renderer.ts` L2353 | Label: “Body (Markdown + GFM — min 60vh editor workspace; only body and date required)” | Label “Write”; hint “Markdown is supported.” | A layout note leaked into the label. |
| `renderer.ts` \~L2287 | “Compile into Body →” | “Insert into draft” | Plain verb, plain object. |
| `renderer.ts` \~L2397 | “Multi-pass entity scanner detected sensitive patterns. Review matches by pass or mask them automatically before public publishing.” | “We found text that might be private. Review each match, or hide them all before you publish.” | Task-first, no implementation detail, no “public publishing”. |
| `renderer.ts` \~L2588–L2603 | “Action failed. Check your input and retry.” | See 2.3.2 | Names what failed, why and the exact next step. |
| `renderer.ts` \~L3858 | Settings H1 “Admin Operations & System Calibration” | “Settings” | The page is split by route (2.1.1), so the title needn’t list contents. |
| `renderer.ts` \~L3868 | “Tier 1 Advisory Floor (shipped default: 0.82):” | Label “Automatic-answer bar”; hint “Visitors get an automatic answer only when confidence is at least this. Recommended: 0.82.” | Spec §5 requires the reason for each default beside the field. |
| `renderer.ts` \~L3870 | “⚠️ Warning: Tier 1 floor is set below the shipped default (0.82). Unverified advisory answers may be served without owner review.” | “Lower than recommended (0.82). Visitors may get automatic answers you haven’t reviewed. \[Restore 0.82\]” | Concrete consequence plus a one-click fix; spec §6 wants this persistent. |
| `renderer.ts` Settings, degradation select | “Simulated Degradation Mode”: Normal / Extractive Only (Zero LLM synthesis) / Disabled (Offline handoff only) | “Test fallback mode”: Normal / Quotes only, no AI writing / Answering off, offer booking | Each option says what the visitor sees. |
| `renderer.ts` Settings, Notification section (\~L3985–L3999) | Chip “not\_configured”; “…will report honest not\_configured status per honesty invariant.” | Chip “Not set up”; “Alerts aren’t set up. Add an ntfy topic or webhook to be told when someone asks a question.” | Enum and spec jargon out; recovery action in. |
| `renderer.ts` \~L4006, L4028 | “Encrypted Backups & Restore Drill”; “Run Encrypted Backup Drill” | “Backups”; “Test a restore” | Outcome over mechanism. |
| `renderer.ts` \~L4462 | “Zero-Trust Boundary: When no external provider is configured, Ask gracefully degrades to honest extractive quotes.” | “Without an AI provider, Ask shows direct quotes from your entries instead of writing answers.” | Says what visitors see; drops branding words (“gracefully”, “honest”). |
| `renderer.ts` L4447, status cells | “claude-3-5-sonnet”; status “Optional” | Model name from the provider registry; status “Add API key” / “Connected” / “Key not valid” | Hard-coded model name is already stale; status must reflect reality. |
| `renderer.ts` \~L4356–L4363 | “Master Password (min 12 chars)”; “TOTP Secret Hex (optional, generated if blank)”; “Complete Account Setup & View TOTP” | “Password (at least 12 characters)”; “Authenticator key. Leave blank and we’ll generate one.”; “Create account and show my authenticator code” | Removes acronyms and “hex”; the button says what happens. |
| `renderer.ts` \~L4403 | “Public Domain / Tunnel Origin” | “Your site’s address”, hint “For example https://portfolio.example.org” | Plain language and an example. |
| `renderer.ts` \~L4822 | “Bulk Accept All High-Confidence” | “Accept all high-confidence matches” | Sentence case, names the object. |
| `renderer.ts` L2205–L2214 | “Publish Now”, “Run Backup & Restore Drill”, “Export Markdown + Sidecar” | “Rebuild site”, (moved to Backups), “Export entries” | “Publish Now” collides with entry publishing; “Sidecar” is internal. |
| `renderer.ts` `renderBookPage` L1722+ | Label “Topic / Architecture Question \*”; placeholder “Describe your architecture constraint or review topic…” | “What would you like to talk about?”; “A sentence or two is plenty.” | Not every visitor has an architecture question. |
| `renderer.ts` L3122 | “Undo: Draft save acknowledged.” | Remove; see UX-04 | The message describes nothing the user did. |

---

## 3. Prioritized remediation roadmap (version 1 view; sequenced into work packages in §7)

Effort: S under a day, M a few days, L a week or more. Every item lists its file targets and a check that proves it is done.

### P0 — critical blockers and broken core flows

| # | Action | Findings | File targets | Effort | Done when |
| --- | --- | --- | --- | --- | --- |
| P0-1 | Make the admin reachable and guarded in the default deployment: server-render no admin data; add an auth check that redirects to `/admin/login`; use an explicit API base URL for browser calls; add a `web` service to Compose or make bundled mode the documented default and add `ENABLE_BUNDLED_WEB` to `.env.example` and `docs/self-hosting.md` | UX-05 | `apps/web/src/app.ts`, `renderer.ts` L2005, `docker/docker-compose.hobbyist.yml`, `.env.example` | M | A fresh `docker compose up` serves the site; `/admin` without a session returns a redirect, never JSON or a 500 |
| P0-2 | One `commitEntry()` path for Save, Publish, Unlist, Unpublish; Publish uses `PUT /entries/:id` for saved entries; Save never changes visibility; check every `res.ok`; real Undo | UX-01 to UX-04 | new `client/admin/commit-entry.ts`; replaces `renderer.ts` L3082–L3234, L3531–L3592 | M | Playwright: new → save → publish → edit → save keeps it public → unpublish → undo restores it |
| P0-3 | Publish dialog with auto-run redaction scan, NDA step, Public/Unlisted choice, outcome summary | UX-03, UX-01 | `patterns/publish-dialog.ts`, `patterns/redaction-review.ts` | M | No manual “check first” step; stale-token failure is impossible from the UI |
| P0-4 | Setup wizard step 3 becomes interactive: key field, live validation, storage choice, skip path | UX-09 | `renderer.ts` \~L4417–L4466 (to `pages/admin/setup/step3.ts`) | M | A wrong key shows “Key not valid” before saving; a right one flips the status |
| P0-5 | Flip calibration to off by default and invert the control | UX-08 | `apps/api/src/routes/calibration.ts` L10–L20, `settings.ts` L44, Settings markup | S | New instance reports calibration disabled; enabling requires an explicit action and shows the sample gate |
| P0-6 | Fix state visibility and date handling in the editor: render the state chip; default date to today; never throw on empty | UX-10, UX-11 | `renderer.ts` L2330, L2579, L3558 | S | State chip shows Draft/Public/Unlisted; clearing the date shows an inline error |

### P1 — major structural and IA refactoring

| # | Action | Findings | File targets | Effort |
| --- | --- | --- | --- | --- |
| P1-1 | Admin shell: left rail, top bar with answering switch, deploy status and floor warning, account menu with sign-out; separate layout from the public one | UX-06, UX-16 | `layouts/admin-shell.ts`, `app.ts` | M |
| P1-2 | Split `/admin` into routes: entries (list + editor), inbox, audit, calibration, bookings, import, settings sections, account; deep-linkable entries | UX-12, UX-07 | `pages/admin/*`, `app.ts` | L |
| P1-3 | Editor workspace: full-width canvas, split preview, Preview as visitor, local autosave, unsaved-changes guard, shortcuts, temporal-confidence control, slug check | UI-02, UX-22 | `patterns/editor-workspace.ts`, `styles/admin.ts` | L |
| P1-4 | Build the missing screens in this order: calibration (proposals, history, rollback), audit (conflicts and constraint source quotes), bookings, import connectors and jobs, ventures, pages editor | UX-07, UX-17 | `pages/admin/*` | L |
| P1-5 | Define the eight missing tokens, replace undefined references, then delete the inline-style debt page by page | UI-01 | `tokens/*`, `styles/*` | M |
| P1-6 | Make the component library real: `Button`, `Chip`, `Field`, `Drawer`, `Dialog`, `Toast`, `Banner`; adopt in the admin first | UX-13 to UX-15, UX-23, UX-25 | `primitives/*`, `components/*` | L |
| P1-7 | Split `renderer.ts` per 2.2.5 with a compatibility barrel; bundle `client/*` modules | UI-series | `apps/web/src/**` | L |
| P1-8 | Replace the first-entry-only server render of the inspector and the load-everything dashboard with a paginated list and per-entry loading | 2.1.5 | `pages/admin/entries/*` | M |

### P2 — visual polish, micro-interactions and copy

| # | Action | Findings | Effort |
| --- | --- | --- | --- |
| P2-1 | Apply the copy table in 2.3.3, move all strings into `strings/en.ts`, and route client-side errors through the catalogue | CP-series | M |
| P2-2 | Single reply-time setting used everywhere | CP (SLA row) | S |
| P2-3 | Typographic scale consolidation (retire 11, 13, 15 px); add `forced-colors` and a high-contrast theme | UI-01 | M |
| P2-4 | Home rails for Writing and Build; Book CTAs; theme toggle to footer | UX-19, UX-20 | S |
| P2-5 | Theme editor with live preview and contrast check | spec §8.2 | M |
| P2-6 | Motion polish (drawer, state-chip morph, level stepper); optical alignment pass | 2.2.4 | S |
| P2-7 | Missing documentation and templates: `docs/architecture.md`, `plugin-development.md`, `security.md`, `upgrading.md`, feature/connector/theme issue templates, Caddy reference config | spec §1.2, §12, §15 | M |
| P2-8 | Public “confidence settings” disclosure and federation controls | spec §6, §13 | S |

---

## 4. What I did not verify, and how to close the gap

1. **Nothing was executed.** Run `pnpm install && pnpm test && pnpm test:e2e` and, separately, `docker compose -f docker/docker-compose.hobbyist.yml up` with and without `ENABLE_BUNDLED_WEB=true`, then open `/admin` unauthenticated. This confirms or refutes UX-05 and the computed editor width in UI-02.
2. **Read lightly:** entry detail, work/writing index, strata timeline, `markdown.ts`, ask-status, `apps/worker` and `packages/ai`. Their UX surfaces may hold further findings.
3. **Not inspected:** `LICENSE` text, the RFC process in `GOVERNANCE.md`, database migrations and the boot-time schema check, and the CI workflows’ actual results.
4. **Spec mismatch.** If the uploaded delta spec is meant to be authoritative for naming (qRXP primitives, `apps/admin`, Tier-1 floors), the codebase has diverged from it at the vocabulary level, and a decision is needed on which document is canonical before the copy and package changes above are final.
5. **Test coupling.** More than 40 conformance suites and 12 Playwright specs assert specific ids and strings. Plan each refactor so ids and `data-*` hooks are preserved, or update the matching tests in the same change.

---

## 5. Reconciling the owner’s walkthrough and reply with the code

The walkthrough is the first end-to-end run by someone who isn’t the author, and it finds a class of failure my static read could not: the journey from clone to first login is broken in ways no single file shows. Every claim below was checked against the shipped source; where the code disagrees with the walkthrough or with my version 1, I say so.

### 5.1 What changes from version 1

| Topic | Version 1 said | Version 2 position | Why |
| --- | --- | --- | --- |
| Roadmap form | P0/P1/P2 lists | Not work packages. Replaced by sequenced packages with entry and exit criteria, per-task acceptance tests and handovers (§7) | A priority list has no order, dependencies, stop points or handover, and doesn’t match the repo’s protocol (`docs/plans/execution-protocol.md`, `P001`) |
| UX-05, admin reachability | Admin unguarded and unreachable in the default deployment | Narrowed. The owner ran bundled mode on port 4000, where the guard redirected to `/admin/login` as designed. Remaining risk: standalone `app.ts` serves `/admin*` without a guard, and `docs/self-hosting.md` L52 tells the owner to open port 3000 while `ENABLE_BUNDLED_WEB` is undocumented | Direct evidence from a run; I had only inferred it |
| Wizard (UX-09) | Step 3 is a non-interactive table | Widened (UX-27): the wizard saves nothing from steps 2 to 6. Its script makes exactly three API calls: setup, notification test, backup drill | `renderer.ts` L4644 (setup), L4682 (test alert), L4702 (drill); no other `apiClient` call in L4320–L4719 |
| Rectangles | UI-01 listed undefined tokens as token debt | Root cause of the walkthrough’s “everything is a rectangle”. `--radius-control`, `--radius-chip` and `--radius-card` are used and never defined, so controls, chips and cards all lose their radius | Rescan of `styles.ts` found `--radius-chip` and `--radius-control` undefined; renderer adds `--radius-card` |
| Answering kill switch | Top-bar switch with confirm (UX-16) | Canonical home is **Settings › Answering**, as the owner proposes. The top bar shows a status chip that links there and offers a one-click pause with confirm | It is a configuration with safety consequences; hiding it entirely costs response time in an incident |
| Theme toggle | Move to footer | Header icon beside RSS, as the owner proposes | A persistent, learnable affordance; icon-only on narrow screens |
| Public navigation | Work, Writing, Build, Timeline; Ask as button | About, Work, Writing, Build; Book as CTA; Timeline and Ask as side panels (§6.2) | Adopted with conditions; see 6.2 |
| Scoped constraints | Under Audit with conflicts | Under Inbox: a rule suggestion appears right after a reply, with a list at `/admin/rules`. Conflicts move to `/admin/health` | The walkthrough asks whether they are related. They share a source (replies) but are different tasks (answer a visitor vs. repair the knowledge base) |
| Audit date | 5 Nov 2026 | 6 Nov 2026 | Corrected |

**Where I push back on the walkthrough** (details in §6):

1. *Column layouts and video in the editor* conflict with the product’s Markdown-plus-sidecar portability unless they serialise to a Markdown directive syntax. They are feasible, but only with that constraint and a new media API (none exists). See D-05 and D-06.
2. *Overlay-free three-region layout* works on wide screens only. Below about 1280 px the centre column falls under a readable measure, so panels become sheets there. This is an exception to “no overlays” and has to be explicit.
3. *Overruled by D-10 (§5.4): I argued that the panels replacing the Timeline and Ask pages* must keep `/timeline` and `/ask` as real, linkable routes. Panels are an enhancement over them; otherwise search engines, no-script visitors, shared links and screen-reader users lose the features.
4. *Language switching* implies translated content, not only translated interface text. Entries carry a `lang` attribute (`renderer.ts` L963) but the site is `lang=“en”` (L292) and `strings.ts` fixes `en-US`. I scope it to UI-string readiness first (D-07).
5. *Free-form shape properties* in themes risk unreadable or inaccessible combinations. I propose bounded presets checked by the existing conformance step.
6. *Hiding cost choices in Import* is not right either: “Free limits” versus “Fast cloud” is a real decision, but it should appear only when an external provider is configured, with a plain explanation and an estimate.

### 5.2 Evidence ledger: walkthrough claims against the code

Verdict key: **Confirmed**, **Confirmed + cause** (code explains it), **Partly**, **Not as stated** (code differs). IDs continue the version 1 series.

| § | Owner experience | Code evidence | Verdict | ID |
| --- | --- | --- | --- | --- |
| 3.1 | “TOTP” is unexplained; unclear if username and password can change later | No explanatory text in the wizard form; no change-password or change-username route in the API (`apps/api/src/auth/security.ts`: setup, login, logout, tokens only) | Confirmed | UX-41, CP-14 |
| 3.2 | Dense, unformatted text with a hex secret and a bearer token; unclear use, importance and storage | `renderer.ts` L4651 writes both values into one `innerHTML` string; no copy, download or acknowledgement step | Confirmed | UX-30 |
| 3.2 | The secret can’t be used in an authenticator app | `security.ts` L161: `randomBytes(20).toString('hex')`; no `otpauth://`, base32 or QR anywhere in `apps` or `packages` (scripted search). Authenticator apps need base32 or a QR code, so the owner had to script the code | **Confirmed + cause** (stronger than the walkthrough states) | UX-26 |
| 3.2 | Two buttons, no way to choose | Both shown at once in the completed state | Confirmed | UX-29 |
| 3.2.1 | Hosting presets are too technical; the domain field is unclear | Preset radios at L4380–L4394 carry jargon; value never posted | Confirmed | CP-14, UX-27 |
| 3.2.2 | Step 3 table has no interactive elements; badges look like buttons; “Zero-Trust Boundary” is unexplained | Static table (L4417–L4466); badge and button share styling; the note has no heading explaining relevance | Confirmed | UX-09, UI-03, CP-14 |
| 3.2.3 | Step 4 channel choice changes nothing; “Test Delivery” returns “Unauthorized” | Select and field at L4478 are never read; `POST /auth/setup` (`security.ts` L439–L456) creates no session, while only `/login` sets `lp_session` (L476), so authenticated calls from the wizard fail | **Confirmed + cause** | UX-27, UX-28 |
| 3.2.4 | Step 5 destination and “age key” unclear; drill returns “Unauthorized” | Same cause. Note the API *does* accept `destinationDir` and `agePublicKey` (`settings.ts` L302–L310) but the wizard sends an empty body | **Confirmed + cause** | UX-28, UX-33 |
| 3.2.5 | Theme cards aren’t clickable; four cramped columns of example text; unclear what to click | Cards have `cursor:pointer` and no handler (L4543–L4551); a hard-coded worked example sits in markup | Confirmed | UX-27, UI-03, CP-15 |
| 3.2.6–7 | Both final buttons go to the login page | Both link to `/admin/login`; the wizard ends signed out | Confirmed | UX-29 |
| 3.3 | Login asks for a 6-digit code without saying where it comes from | Login form lists the field; no guidance, and enrolment is impossible without a script (UX-26) | Confirmed | UX-31 |
| 4.1 | Admin Workspace has no distinguishable blocks or visible IA | Matches 0.2 (anti-pattern B) | Confirmed | UX-06, UX-07 |
| 4.2 | “Deploy: Ready (0/12 today)”: badge or button? | Non-interactive chip; no legend or link | Confirmed | UX-39 |
| 4.3 | Publish Now works | Rebuilds the static site; name collides with entry publishing | Confirmed | CP-13 (copy) |
| 4.4 | Import takes Markdown only; “Free” vs “Fast” boxes aren’t clickable; Accept/Skip/Reassign unclear; 1 input became 3 items; page stays after commit; two similar return links | Plan cards are static `h3` blocks (`renderer.ts` L4780); commit handler shows a banner with a link and does not navigate (L5098); separate back button at L4738 | Confirmed. The 1→3 split is not explained in the UI; I could not tell from code whether it comes from the sample loader or from splitting (I) | UX-35, UX-36 |
| 4.5 | Settings modules should be separate pages, each with what / when / how / impact | One page, five sections (L3841–L4196); no explanatory text per section | Confirmed | UX-06, CP-13 |
| 4.6 | Pause/Resume answering should live in settings | Header toggle (L2208); see 5.1 for the revised placement | Agreed, with a status chip kept in the top bar | UX-16 |
| 4.7 | Backup drill in the header returns HTTP 501 | `settings.ts` L302–L322 returns 501 `SIMULATED(M1)` unless `BACKUP_DIR` or an age key is configured; the UI offers the button regardless | **Confirmed + cause** | UX-33 |
| 4.8 | Export opens plain text in the browser | Header is a plain `<a href=“/api/settings/export”>`; no download filename or archive | Confirmed | UX-34 |
| 4.9 | Walkthrough card can be dismissed | Present (L2219) | Confirmed. Whether dismissal persists across reloads I did not verify | UX-17 (copy in CP-13) |
| 4.10 | Status badges unclear | Three chips in one strip | Confirmed | UX-39 |
| 4.11.2 | Editor is cramped; wants images, video, columns; Preview toggles to “Edit source” | Matches UI-02 and 2.1.3. No media API exists; routes are ask, audit, book, calibration, entries, health, import, inbox, publish, settings, structure, timeline | Confirmed. Needs new backend | UI-02, UX-35, §6.6 |
| 4.11.2 | “Entries (9)”: unclear whether published | List shows all visibilities; state per row not verified | Partly (I) | UX-10 |
| 4.11.3 | Inspector purpose and target unclear; it shows another entry’s title | Server-renders the first entry regardless of the editor (L2440). The owner saw “Inspector: Distributed Webhook…” beside “New entry” | **Confirmed + cause** | UX-37 |
| 4.11.3.1 | “Run Background Enrichment” and “Enrichment: queued” unexplained | No help text; the feature is a worker job | Confirmed | CP-13 |
| 4.11.3.2 | “dashed = machine suggested” isn’t visible | `chip-suggested` is applied (L2107) but no rule exists in `styles.ts` | **Confirmed + cause** | UX-38 |
| 4.11.3.4 | “Answerability” shows two lines and no meaning | Empty-state copy only | Confirmed | CP-13 |
| 4.11.4 | Where should the Inspector entry point be, in list or detail? | Answered in 6.5 | Design question | §6.5 |
| 4.12–4.13 | Inbox has no list view; are suggested rules and conflicts related to it? | Inbox renders inline at the page foot; suggested rules come from `getScopedConstraints` after replies; conflicts are a separate audit job | Confirmed. Related by source only | UX-07; IA in 6.4 |
| Closing | Needs an owner/visitor switch and an owner-only top bar | No owner presence on public pages; no session endpoint is used by the web app | Confirmed | UX-40 |
| Closing | Timeline as left drawer; Ask as right panel; time-scoped answers | Backend is partly ready: `POST /ask` accepts `as_of_date` and `scope_entry_slug` (`routes/ask.ts` L59, L342); `GET /timeline` accepts `as_of` (`timeline.ts` L10, L57–60). The entries list has no as-of parameter | Feasible; one API gap | §6.2, D-04 |
| Closing | robots.txt must be implemented | Already exists at `apps/web/src/app.ts` L65–L72 and `apps/api/src/app.ts` L320, but it is `Allow: /` for everyone, with no rule for `/admin` or `/api`, and no crawler policy. `rss.xml` (L123) and `sitemap.xml` (L137) also exist; the layout links the feed once | **Not as stated**; incomplete rather than missing | UX-42 |
| Closing | Language switching; legal; site map; admin login in footer | No locale model; `lang` fixed to `en` | Confirmed gap | D-07 |
| Closing | Badges, buttons, switches all rectangles; wants configurable radius, stroke, flat vs shadow | Undefined radius tokens (above); theme contract in `packages/core` has no shape keys (search found none; I) | **Confirmed + cause** | UI-03, UI-04 |
| Closing | Settings pages should share a template | Each section hand-written | Confirmed | UI (`SettingsTemplate`, 2.2.2) |

### 5.3 New findings from the walkthrough

IDs continue each layer’s series. Severity uses the roadmap scale. “V” means verified in code; “I” inferred.

| ID | Layer | Finding | Evidence | Sev |
| --- | --- | --- | --- | --- |
| UX-26 | 1 | An owner cannot enrol an authenticator app. The secret is 20 random bytes in hex, with no `otpauth://` link, base32 form or QR code; login then demands a 6-digit code. | `security.ts` L161; `renderer.ts` L4651 (V) | P0 |
| UX-27 | 1 | Wizard steps 2 to 6 write nothing: hosting preset, domain, notification channel and target, backup destination, age key and theme choice are never sent. | `renderer.ts` L4320–L4719: three API calls only (V) | P0 |
| UX-28 | 1 | Setup creates no session, so the wizard’s own test buttons fail as “Unauthorized” and the wizard ends signed out. | `security.ts` L439–L456 vs L476 (V) | P0 |
| UX-29 | 1 | Competing end-of-step actions: two primary buttons after account creation; two final buttons that both go to login. | `renderer.ts` (V) | P1 |
| UX-30 | 1 | Credentials (secret, API token) are shown as one unformatted line with no copy, download, explanation or “I’ve saved this” gate. The token is a long-lived credential shown with no guidance. | `renderer.ts` L4651 (V) | P0 |
| UX-31 | 1 | Login requests a code the owner was never taught to obtain. | login markup (V) | P1 |
| UX-32 | 1 | No Start-here checklist. `docs/self-hosting.md` L52 sends the owner to port 3000 while the walkthrough ran on 4000; `ENABLE_BUNDLED_WEB` is undocumented. | docs (V) | P1 |
| UX-33 | 1 | Capabilities that are unavailable by configuration show live buttons that fail with 501 (Run Backup & Restore Drill in the header and wizard); the wizard’s own fields would configure it but aren’t sent. | `settings.ts` L302–L322 (V) | P1 |
| UX-34 | 1 | Export is a bare link to an API URL that renders text in the browser. | header markup (V) | P1 |
| UX-35 | 1 | Import flow: a cost choice that looks like two disabled boxes; no success state; duplicate return links; unexplained item counts; Accept/Skip/Reassign vocabulary. | `renderer.ts` L4738–L5098 (V; counts I) | P1 |
| UX-36 | 1 | Import takes Markdown only: no rich-text paste, HTML, Word, PDF, images, archives or URLs. | import form (V) | P1 |
| UX-37 | 1 | The Inspector reflects the first entry in the list, not the one being edited. | L2440 (V) | P1 |
| UX-38 | 1 | Machine-suggested facets carry a class with no styling, so the suggested/confirmed distinction is invisible. | L2107; `styles.ts` (V) | P2 |
| UX-39 | 1 | Status chips (deploy, rebuild, answering, operational) have no legend, no link and look interactive. | L2200–L2230 (V) | P1 |
| UX-40 | 1 | No owner presence on public pages and no “view as visitor” state. | `renderLayout` (V) | P1 |
| UX-41 | 1 | No account management: change password or username, re-enrol authenticator, list or revoke tokens, sign out. | auth routes (V) | P1 |
| UX-42 | 1 | `robots.txt` allows everything, including `/admin` and `/api`; no crawler policy or owner control. | `app.ts` L65–L72 (V) | P2 |
| UI-03 | 2 | No visual language separates badge, chip, button, switch, tab and card; undefined radius tokens remove the only differentiator; hover-pointer cards with no action mislead. | `styles.ts` L163, L176, `.chip`; `renderer.ts` L4543 (V) | P1 |
| UI-04 | 2 | The theme contract has no shape or surface properties (radius, border width, elevation). | `packages/core` search (I) | P2 |
| CP-13 | 3 | No explanation pattern anywhere. Modules never say what they are, when to use them, how to set them up and what changes. | wizard, settings, import, inspector (V) | P1 |
| CP-14 | 3 | Setup vocabulary assumes expertise: TOTP, tunnel origin, Tier 2 escalations, age recipient key, zero-trust boundary. | wizard markup (V) | P1 |
| CP-15 | 3 | Hard-coded sample content and vendor names in markup (worked example; provider and model table), which the repo’s own protocol §1.6 prohibits (no vendors or sample clients in code). | `execution-protocol.md` §1.6; `renderer.ts` L4417–L4466 (V) | P2 |

### 5.4 The owner’s reply: rulings and what they change

#### 5.4.1 Why Save draft and Publish appear to do nothing (UX-43)

The owner reports that both buttons produce no visible change, while “Check for private details” works and shows a signed token. I had predicted a visible duplicate-slug error. The code shows something different and more basic. Every message the editor produces (saved, created, published, undo, and every error) is written into one element, `#admin-status-banner` (`renderer.ts` L2217), which sits at the **top** of the page above the header actions, the status strip, the walkthrough card and the three-pane workspace. The editor starts at about L2254 and, on a normal screen, below the fold. Nothing scrolls the banner into view or moves focus to it, the entries list is not re-rendered after a create, and the state chip the script updates does not exist (UX-10). So a click can succeed, fail with a 409, or hit any error, and the person looking at the editor sees the same thing in every case. “Check for private details” is the exception because its result box is rendered beside the button.

What is still unknown is whether Publish also fails server-side. UX-01 stands as a code-level defect (a saved entry is re-created with `POST`, which should return a duplicate-slug error), but the fix cannot be judged until feedback is visible. **Final decision:** WP-14 begins with a new task, WP-14.0a, that makes feedback local and visible before anything else changes: an inline status line beside the action buttons, a toast fixed to the viewport with a polite live region, focus moved to the result, and the entries list refreshed after create, save and delete. The lifecycle tests in WP-14.1 then assert both the outcome and that the message is visible within the viewport.

#### 5.4.2 Spec authority and the amendments it requires (D-01)

With the in-repo spec authoritative, three things follow. (1) UX-08 stands, and is sharper: spec §11 says only the two parameter-changing mechanisms ship off, and topology audit and scoped-constraint mining ship on as proposals only, so the control must be **one switch per mechanism**, not a single freeze flag. (2) Several of my earlier recommendations contradicted the spec and are corrected in §6.11: the five Inspector sections are kept (Structure, Context, Evidence, Answerability, History), the Quick Log is a four-field form, suggested items must be dashed and labelled, `temporal_level` takes the values exact, range and estimated, the admin keeps the spec’s nine route names, and the performance budget of about 70 KB of JavaScript on reading pages applies to the new panels. (3) The owner’s decisions depart from the spec in nine places. Each is an amendment that the implementing task writes into `docs/spec/` in the same pull request, so spec and code never diverge.

| ID | Spec location | Amendment | Applied by |
| --- | --- | --- | --- |
| A-01 | §12.6 Home nav, §5.1 | Main navigation becomes About, Work, Writing, Build, with a Book call to action and theme and RSS icons | WP-19.2 |
| A-02 | §5.1 L247–L248 | `/timeline` and `/ask` pages are retired; the Timeline becomes a left **time rail** and Ask a right **conversation panel** on every page. Answer permalinks under `/ask/status/` stay | WP-19.3 to WP-19.6 |
| A-03 | §5.1 | `/now`, `/about` and `/uses` become sections of About; the old URLs redirect to anchors | WP-19.2 |
| A-04 | §12.6 Home | Home has a one-sentence statement, a Featured list (default 3) and a Recent list (default 10, includes revisions), both counts set in the admin | WP-17.7, WP-19.2 |
| A-05 | §12.6 Admin entry workspace | The entries list becomes its own route; the editor and Inspector remain the working pair | WP-16.3 to WP-16.5 |
| A-06 | §4.4 | Quick Log gains its own route, `/admin/quick-log` | WP-18.8 |
| A-07 | §12.10 Theme contract | Adds a Frame contract: header, ownerBar, timelineRail, main, askPanel, footer; Home slots become statement, featured, recent | WP-19.3 |
| A-08 | §12.3, §12.2 | Theme shape presets for radius and border; surface style is flat or outlined for content, raised only for overlays (spec principle 3: a border always signals structure) | WP-20.1 |
| A-09 | §12.6 Ask widget | The automated-answer label is first person (“Automated answer from my records”), matching the first-person narrative of the site | WP-20.4 |

#### 5.4.3 Time travel as the owner defines it (D-04, UX-44)

The owner’s example: viewpoints a (2023-12-24), b (2024-12-24) and c (2025-12-24), then a revision b′ of b written on 2025-06-30. Viewing as of 2025-03-30 must show b, and as of 2025-09-30 must show b′, and Ask must answer from the same version. This matches spec §5.3 (answers reflect only what was recorded as of that date) and §3.11 (time travel reads the revision that existed at the relevant `written_at`). The “Viewing as of” banner already exists, and the query parameter is `as_of`, not the `asof` I wrote earlier.

| Surface | Today | Required | Evidence |
| --- | --- | --- | --- |
| Entry detail | Selects among revisions that were valid and written by the date | Same, but order by `written_at`, newest first | `renderer.ts` L758–L780 sorts by `valid_from`, falling back to `written_at`; b and b′ describe the same event and share a `valid_from`, so the order is a tie and the older revision can win (I) |
| Work and Writing lists, Home list | Test only the **current** revision | Resolve each entry to its revision as of the date | `renderer.ts` L420–L440 |
| Strata timeline and `GET /timeline` | Test only the current revision, so a revised entry is counted as “future” | Same resolver | `routes/timeline.ts` L57–L80 |
| Ask | Passes `as_of_date` through retrieval and the verifier, with a reconstruction notice | Verify against the owner’s scenario | `routes/ask.ts` L173, L342; `repository.ts` L773 |
| Parameter | `as_of` on work, writing, entry and timeline | Keep `as_of`; add `ask` and `timeline` panel flags | `app.ts` L90–L116 |

At 2025-03-30 the lists today would test b′ (written 2025-06-30, after the date), judge it invalid, and drop the whole entry, so b is missing from Work, Writing and the timeline even though its own page would show it. **Fix:** one shared `resolveRevisionAsOf(entry, date)` in `packages/core` (newest `written_at` not after the date, then the existing event-validity and hindsight rules), used by every surface above and by Ask context assembly. **Acceptance:** a fixture with the owner’s exact scenario, asserted on the Work list, the entry page, the timeline and an Ask citation at both dates (WP-19.5).

#### 5.4.4 Panels instead of pages (D-10)

The owner is right that a bare `/ask` page and a bare `/timeline` page serve no visitor job beyond a link, and that Ask means different things on a page (about this) and on Home (about everything), as does the timeline. I withdraw my request to keep them. To avoid losing what those pages gave: `/ask` and `/ask?q=…` redirect to Home with the panel open and the question filled; `/timeline` redirects to Home with the rail open; `/ask/status/:token` stays because escalation emails and alerts link to it; both are removed from the sitemap; the time rail includes a **text-equivalent list view** (spec §12.8); panels are landmarks with a visible control, keyboard access and focus return. No-script visitors still read every page; they lose Ask and time travel, which already require script.

#### 5.4.5 Naming and elevation of the three regions

The owner finds “left vertical drawer” and “right retractable panel” indistinct. They are different things, so they now have different names. **Story** is the main region: the author’s first-person account. **Time rail** (left) is an instrument: it changes *when* the story is read and carries no content of its own. **Conversation panel** (right) is the visitor’s second-person dialogue with the author. All three sit on one plane and push each other aside (extrude). Where width forces an overlay, **the conversation panel is raised above the Story and the time rail**, as the owner suggests; the time rail and the Story share the lower plane.

| Situation | Time rail | Story | Conversation panel |
| --- | --- | --- | --- |
| 1280 px and wider, either or both open | Base plane; pushes the Story | Base plane | Base plane, distinguished by a slightly different surface tone and a hairline; pushes the Story |
| 1024–1279 px | Opens alone; the other collapses | Base plane, never under 640 px | Opens alone; the other collapses |
| Below 1024 px | Sheet on the base-plus-one level | Base plane | Sheet at the **highest** level (`--elevation-conversation`); if both are open, Ask is on top |

Voice follows the names: Story copy is first person; the panel addresses the visitor as “you” and labels automated answers in the author’s first person (A-09).

#### 5.4.6 New findings from the reply

| ID | Layer | Finding | Evidence | Sev |
| --- | --- | --- | --- | --- |
| UX-43 | 1 | Every editor message is written to a banner at the top of the page, away from the action; no scroll, focus or list refresh | `renderer.ts` L2217; handlers L3099–L3166 (V) | P0 |
| UX-44 | 1 | Time travel drops entries revised after the chosen date from list pages and the timeline | `renderer.ts` L420–L440; `timeline.ts` L57–L80 (V) | P0 |
| UX-45 | 1 | Revision ordering in entry detail can tie for revisions of one event, so the wrong version can show | `renderer.ts` L758–L780 (I) | P1 |

---

## 6. Revised information architecture and interaction model (supersedes §2.1.1)

**Six rules drawn from the walkthrough.** (1) One primary task per page. (2) Explain before asking: every module says what it is, when you need it, how to set it up and what changes. (3) State is always visible and honest, never a chip that looks like a button. (4) The owner can leave the admin, browse as a visitor, and come back. (5) Panels enhance real routes; they never replace them. (6) Content stays portable: anything the editor can express must serialise to Markdown plus the sidecar.

### 6.1 Two navigation systems

```
┌─ OWNER BAR (owner only; added by script when a session exists) ──────────────────────────┐
│ Dashboard · New entry · Edit this page · Inbox 2 · Site status ●     [View as visitor] [Sign out] │
├─ SITE HEADER ─────────────────────────────────────────────────────────────────────────────┤
│ Name        About  Work  Writing  Build                    [ Book ]   ◐  RSS               │
├───────────┬─────────────────────────────────────────────────────┬──────────────────────────┤
│ TIME RAIL │ STORY (first person)                                │ CONVERSATION PANEL       │
│ left      │ Home · About · Work · Writing · Build               │ right, second person     │
│ Now ●     │ ┌─ Viewing as of March 2023 · Return to now ─────┐ │ Ask about: this entry ▾  │
│  │        │ │ content as it stood on that date               │ │ As of: March 2023        │
│ 2024      │ └────────────────────────────────────────────────┘ │ [ question ........... ] │
│ 2023 ●    │                                                     │                          │
│ [list ▾]  │                                                     │                          │
├───────────┴─────────────────────────────────────────────────────┴──────────────────────────┤
│ FOOTER  Legal · Language ▾ · Site map · RSS · Owner sign in                                │
└────────────────────────────────────────────────────────────────────────────────────────────┘
```

### 6.2 Public frame: assessment of the owner’s proposal

| Proposal | Assessment | Adopted design | Conditions and risks |
| --- | --- | --- | --- |
| Main nav: About, Work, Writing, Build; Book as CTA; theme and RSS icons | Sound. It removes the Ask and Timeline tabs, the cramming v1 flagged, and surfaces the conversion path | Adopt as stated | `/about`, `/now`, `/uses` stay as redirects to anchors on About (`#owner`, `#now`, `#stack`) to keep links and search results. Home keeps its own page with a statement, Featured and Recent lists (D-09) |
| About holds three subsections | Good: merges three near-empty pages | One About page with three owner-editable sections via `/admin/pages` | Pages need revisions, or time travel can’t show an earlier About |
| Ask as a right-hand retractable panel | Strong: it keeps conversation beside the content it is about | Panel, collapsed by default, auto-scoped to the open entry (`scope_entry_slug`) and to the selected date (`as_of_date`). `/ask` is retired and redirects to Home with the panel open (D-10) | A panel that survives navigation needs either client-side navigation or restored state (D-03); decided (D-03): restored state from `sessionStorage` and `?ask=1` |
| Timeline as a left vertical drawer, collapsed, anchored at Now; scrolling changes page content to that date | Strong concept and the product’s own idea (as-of reconstruction). Backend is half-ready: Ask and `/timeline` take a date; the entries list does not | Drawer reusing the strata timeline. Selecting a date sets `?as_of=YYYY-MM` and shows a banner “Viewing as of … · Return to now”; Ask answers inside that window and says so (the Ask route already emits a reconstruction notice) | Needs `as_of` on `GET /entries` and `GET /entries/:slug`. Decided (D-04): revision time, as defined in §5.4.3, through one shared resolver. `/timeline` redirects to Home with the rail open (D-10). |
| Extrude (push) rather than overlay | Right for a reading product, and it allows two dates side by side later | CSS grid: `[timeline] var(--timeline-w) [main] minmax(0,1fr) [ask] var(--ask-w)`, widths animated 0 → open. Collapsed rails show a 48 px handle | Below about 1280 px the main column would drop under a readable measure, so only one panel opens at a time; below 1024 px panels become full-height sheets with focus trap. These are deliberate exceptions to “no overlays” |
| Simultaneous parallel timelines | Valuable but a second product feature | Phase it: single date first; compare mode (`?as_of=A&compare=B`) in WP-19 | Doubles rendering state; needs mobile fallback (stacked) |
| Footer: legal, language, site map, admin login | Right place | Footer with those four; language selector appears only when more than one locale is configured | Needs locale model (D-07) |
| `robots.txt` | Exists, but allows everything | Generate from settings: disallow `/admin`, `/api`, `/ask/status`; optional AI-crawler policy; sitemap line kept | UX-42 |

### 6.3 Owner bar and “view as visitor”

A thin bar is injected by a small script only when `GET /api/auth/session` (new) reports a signed-in owner. Public HTML stays identical for everyone, so static builds, caching and sharing are unaffected. **Items:** Dashboard, New entry, **Edit this page** (resolved from a `<meta name=“lp-entry”>` the public page already can carry, going to `/admin/entries/:id`), Inbox count, site status, **View as visitor**, Sign out. **View as visitor** hides the bar and any draft or owner-only markers, leaves only a small “Back to admin” pill, and stores the choice in `sessionStorage`. Nothing private is ever rendered into public HTML.

### 6.4 Admin information architecture (revised)

```
/admin                         TODAY: needs-attention list, drafts, due questions, site status, checklist
WRITE      /admin/entries            list: filter, search, state, structure meter
           /admin/entries/new
           /admin/entries/:id        editor + Inspector (five sections); /history sub-route
           /admin/import             stepper: Add → Plan → Review → Done
           /admin/quick-log          four-field capture, mobile-first (alias /quick-log, owner only)
           /admin/pages              About sections and the Home statement
RESPOND    /admin/inbox  /admin/inbox/:id    visitor questions; reply; prompt “Make this a rule?”
           /admin/bookings
GOVERN     /admin/audit              Contradictions · Answer rules · Stale claims
           /admin/calibration        one switch per mechanism; proposals, history, rollback
           /admin/structure          profiles, facet vocabulary, hard constraints
CONFIGURE  /admin/routing            Answering: bars, disclosure, automatic-answers switch, fallback test
           /admin/theme              Appearance: tokens, shape presets, live preview
           /admin/settings/{providers,connectors,notifications,backups,payments,home,visibility,account}
```

**Page contract.** Every admin page has a title, one sentence of purpose, one primary action, and a state strip. **Status legend:** the top-bar status opens a popover that explains each indicator in words (Site build: idle or building; Automatic answers: on or off, link to Settings › Answering; System: operational or the specific failure). Indicators that aren’t clickable use a dot and text, never a bordered pill.

| Area | The one task | Entry points | States the page must show |
| --- | --- | --- | --- |
| Today | Know what needs me now | Landing after sign-in; owner bar | Nothing due; N questions due; build failing; backup overdue |
| Entries list | Find and triage my writing | Rail, owner bar | Empty; filtered empty; loading; offline |
| Entry editor | Write and publish one entry | List row, owner bar “Edit this page”, New entry | Unsaved, saving, saved, offline buffer, Draft, Public, Unlisted, conflict; every result visible beside the action |
| Import | Bring existing writing in | Today checklist, rail | Nothing added, parsing, plan ready, reviewing 12 of 40, done |
| Inbox | Answer a visitor | Owner bar count, Today | Empty, pending, answered, overdue |
| Audit | Decide what the site should remember or fix | Prompt after a reply, rail, Today alerts | Not yet checked; clear as of a date; N proposals; per view: Contradictions, Answer rules (pending, active, discarded), Stale claims |
| Calibration | Review proposals and roll back | Rail, Settings › Answering link | Every mechanism off; on with sample gate not met; proposal pending; applied; rolled back |
| Routing and Settings pages | Change one area | Rail, status popover | Saved, unsaved, error, unavailable here with the reason |

### 6.5 Entries list, editor and the Inspector entry point

The owner asks where the Inspector’s entry point belongs. **Answer: both, for different jobs, and the Inspector keeps the five sections the spec defines** (Structure, Context, Evidence, Answerability, History). The **list** is where you find entries that lack context: each row shows the four-step structure meter (Text, Context, Roles, Claims) and an **Add context** action that opens the editor with the Inspector already showing. The **editor** is where you do the work: the Inspector is the right-hand pane, titled with the open entry’s name, and it never renders without a selected entry, which removes the first-entry-by-default confusion (UX-37). The tabs follow the ARIA tabs pattern with arrow keys. The level bar sits at the top, with a one-line next step taken from the gap questions. Each tab opens with the explainer pattern (6.10): *Enrichment* is “a background pass that suggests roles and context from your text; run it after publishing or importing”; **Answerability** keeps its spec name and starts with the sentence “Questions this entry can answer now, and what one more step would add”, then lists them, naming the missing item. History shows recent revisions and links to the full history route.

### 6.6 Editor canvas

**Goal:** a large, quiet, consistent writing surface. **Modes:** Write (default), Split (source left, rendered right), Preview, Focus (everything but the page hidden). **Layout:** the canvas takes the full width of the content region; text is capped near 72 characters; the Structure drawer and metadata sit outside the writing column. Metadata (title, slug, type, date, visibility) lives in a collapsible header, not above the text.

| Capability | Proposal | Dependency |
| --- | --- | --- |
| Formatting | Slash menu and toolbar: headings, lists, quote, code, table, callout, link | none |
| Images | Paste or drop; alt-text prompt; stored under `/media/<hash>` | **New** `POST /media`, size and type limits, object storage or a volume (D-06) |
| Video | Upload or embed by URL; embeds use a privacy-preserving click-to-load wrapper | Media API; CSP allowlist |
| Columns (2 to 4) | A container directive that stays readable as text (proposed syntax below) | Markdown renderer extension in `markdown.ts`; export fidelity test |
| Autosave | Local buffer every \~2 s; explicit Save creates a revision | none |
| Source toggle | Always available, loss-free | Round-trip test corpus |
| Draft, preview, publish | The state machine and Publish dialog from 2.1.2 | WP-14 |

```
:::columns
::col
Text that sits in the first column.
::col
![Architecture diagram](/media/3fa9….webp)
:::
```

**Editor technology (D-05).** CodeMirror 6 with live preview is the most Markdown-faithful and cheapest; a ProseMirror-based editor gives the block and column experience the owner asks for but must prove lossless Markdown round trips. Recommended default: ProseMirror with directive nodes, shipped only when a round-trip suite over the existing sample entries and the export fixtures passes at 100%; CodeMirror stays as the Source mode.

### 6.7 Import redesign

A four-step stepper with a persistent summary (“3 files, 12 pieces found”): **1 Add** (drop files, paste rich text or Markdown, add a URL, or choose a connector; accepted types shown), **2 Plan** (“How should we process this?”), **3 Review**, **4 Done**. Plan options appear only when an external AI provider is configured; otherwise the page says processing will use your own limits and shows no price.

| Plan option | Plain-language option row |
| --- | --- |
| Free limits | “Slower, no cost. About a day for this batch. Best if you’re not in a hurry. Uses your free daily allowance.” |
| Fast cloud | “Done in minutes for about $0.01 here. Sends text to the AI provider you chose. Best when you want it today.” |

The option rows are real radio buttons with a recommended default. **Review** renames actions for what they do: Accept → **Include**, Skip → **Leave out**, Reassign → **Change type**, Set Date → **Set date**; the header says “12 of 40 reviewed” and explains any split (“Your document was divided at its headings into 3 entries”). **Done** shows what was created and offers three next steps (open the entries list, add context, import more). Server work: multipart `POST /import/files`; parse Word and HTML to Markdown, extract PDF text, store images through the media API.

### 6.8 Setup and first-run redesign

Sign-in happens before anything that needs authorisation, and every step saves as it goes.

| Step | Purpose | What the owner sees | Saved through |
| --- | --- | --- | --- |
| 0 Start here | Know what you need | `docs/START-HERE.md` checklist and a pre-flight page (database reachable, address, port) | none |
| 1 Account | Create the owner login | Username, password; “You can change both later in Settings › Account” | `POST /auth/setup` |
| 2 Secure sign-in | Enrol an authenticator | QR code, manual key (base32), 6-digit confirmation field, downloadable recovery codes. Sign-in cookie issued on success | new `POST /auth/totp/confirm` |
| 3 Where it runs | Pick a hosting style | Three one-line cards, below | settings API |
| 4 Site address | Public web address | “The address people will visit, for example https://yourname.com. Skip to try it on this computer.” | settings API |
| 5 AI services | Optional answers | Key field per provider, **Test key**; skip explains the fallback | settings API |
| 6 Alerts | Be told about questions | Channel cards with outcomes; **Send test** | settings API |
| 7 Backups | Protect your content | Destination cards; the age key explained; test enabled only when configured | settings API |
| 8 Look and feel | Choose a style | Three clickable cards with live mini-previews | settings API |
| 9 Finish | Start | Primary: **Go to your dashboard**. Secondary: **Import writing you already have** | none |

**Hosting cards.** *Home server or small VPS (recommended):* “Everything runs in one Docker stack you control. The simplest setup.” *Fully private:* “AI runs on your own machine and nothing is sent to outside services. Best when privacy matters more than speed.” *Small server plus paid AI:* “Needs less hardware and gives better written answers. Your text goes to the AI providers you choose, under their terms.” The API bearer token is no longer shown here; it moves to Settings › Account › Developer access.

### 6.9 Component affordances and the shape system

Root cause first: the undefined radius tokens (UI-03). Fixing them is a one-day change that gives controls, chips and cards the radii the design already intended. Then give each component kind a distinct, non-interchangeable look:

| Kind | Interactive | Shape | Fill and border | Hover | Role |
| --- | --- | --- | --- | --- | --- |
| Button | yes | control radius | filled (primary) or outlined (secondary) | darker fill, pointer | `button` |
| Link | yes | none | text colour, underline | underline thickens | `link` |
| Chip (filter) | yes | pill | subtle fill, border | border darkens | `button` or `checkbox` |
| Badge / status | **no** | pill, smaller type | tinted fill, no border | none, default cursor | none (text) |
| Switch | yes | track and thumb | track changes colour on | thumb shifts | `switch` |
| Card (object) | only if it has a single action | card radius | surface, hairline border | lift only if clickable | `article` or `link` |
| Status dot | no | circle | colour plus text | none | status text |

**Theme shape contract (UI-04).** Add bounded properties to the theme: `shape.radius` (sharp, soft, round, pill), `shape.border` (none, hairline, strong), `surface.style` (flat or outlined for content; raised only for overlays). Each maps to tokens (`--radius-control`, `--radius-chip`, `--radius-card`, `--border-width`, `--elevation-*`) and passes through the existing conformance check, extended with contrast rules (text 4.5:1; component boundaries and focus 3:1). Settings › Appearance previews every combination live.

### 6.10 Settings template and the explainer pattern

All settings pages use one template: left sub-navigation, page header, an **Explain** block, the form, a state panel (current, last changed, last tested), and a save bar. The explainer has four fixed parts, written once in a typed help catalogue (`strings/help/<module>.ts`) so copy is never inlined: **What it is**, **When you need it**, **How to set it up**, **What changes**. Choice fields carry per-option cards (**Best for**, **Trade-off**).

| Alert channel | What you’d get |
| --- | --- |
| ntfy | A push notification on your phone through the free ntfy app. Best for instant alerts. Needs a topic name you choose. |
| Email | A message to an inbox you name, sent through your mail relay. Best if you check mail more than apps. |
| Webhook | The site posts to a web address you control. Best for connecting your own tools. |
| Telegram | A message from a bot you create. Best if you already live in Telegram. |

### 6.11 Final rulings that govern §6 and §7

Where any sentence in 6.1 to 6.10 reads differently, this section wins. Each item names the work package that implements it and amends the spec in that package’s pull request (A-01 to A-09, §5.4.2).

**Public frame.** Three regions on one plane: **time rail** (left), **Story** (centre), **conversation panel** (right). Navigation is About, Work, Writing, Build, a Book call to action, and theme and RSS icons. State lives in the URL: `as_of=YYYY-MM` (or a full date), `ask=1` with an optional `q`, and `timeline=1`. `/ask` and `/timeline` redirect to Home with the panel or rail open; `/ask/status/:token` remains. The rail is collapsed to a 48 px handle that shows “Now”, opens to about 280 px, shows the vertical strata timeline with a text-equivalent list view, and offers **Return to now**. The panel opens to about 380 px, shows its scope (“About this entry” or “About everything”, switchable) and its date (“As of March 2023”), and follows the spec’s Ask widget states and AI disclosure. Panel state persists across navigation through `sessionStorage` plus the URL flag. At 1280 px and above both can be open and push the Story; from 1024 to 1279 px one opens at a time and the Story never falls under 640 px; below 1024 px they are sheets, with the panel highest (5.4.5). **Performance:** reading pages stay within about 70 KB of gzipped JavaScript (spec §12.5); rail and panel code loads on first open.

**Home (D-09).** A one-sentence statement; **Featured** (default 3), curated from Work, Writing and Build through a featured toggle on entries and ventures; **Recent** (default 10), automatic and including revisions, which are labelled “Revised”. Both counts are settings in the admin (`/admin/settings/home`), stored in configuration, never in code. The time rail and the panel are present as on every page.

**Admin routes.** The spec’s nine (entries, import, inbox, structure, routing, calibration, audit, theme, settings) plus Today, quick-log, pages and bookings, as drawn in 6.4.

**Inspector.** Five spec sections, level bar, explainers, never shown without the open entry (6.5).

**Quick Log.** The spec’s four short fields (what happened, what was decided, what was learned, which venture); it creates a stub entry that can be expanded later.

**Setup wizard.** Everything in 6.8, plus the remaining steps from spec §13.13: the backup step runs the first backup and a test restore, and the last step deploys the static site and offers the import planner. Keys are validated live and each shows the data classes it will receive.

**Options, not cards.** Choices in the wizard, import planner and settings are radio option rows with a title, a sentence and a trade-off line. The spec avoids card grids and says a border always signals structure.

**Calibration.** One switch per mechanism (suggestion thresholds off, routing calibration off, topology audit on as proposals only, scoped-constraint mining on as proposals only), matching the spec’s configuration block.

---

## 7. Work packages for agent execution

### 7.0 Is the roadmap a set of phased work packages?

**No.** The P0/P1/P2 roadmap in §3 ranks problems by severity. An agent can’t execute a ranking without making decisions the ranking never records. The table shows what is missing.

| Property an agent needs | §3 roadmap | Work package (this section) |
| --- | --- | --- |
| Order and dependencies | Severity only; items 1 to 8 within a tier are not sequenced | Explicit dependency graph; one task at a time |
| Entry criteria | None | Baseline, decisions and prior gate that must hold before starting |
| Task granularity | Items of S to L effort, many spanning 3 to 10 files | One task = one pull request = one receipt |
| Acceptance | “Done when” in prose | Named Playwright tests and commands whose output proves it |
| Stop points | None | A gate closed by L at the end of every package |
| Handover | None | A handover file at every gate so a human can open a new session |
| Decisions | Hidden inside items | Numbered decisions with an owner and a default |
| Fit with repo rules | Not considered | Matches `execution-protocol.md`, `P001` (IAHP), `gates.json` and the register |

### 7.1 How the packages plug into the repo’s existing protocol

The repository already runs a mature agent process, so these packages use it rather than inventing a second one. I read `docs/plans/P001-iterative-agent-handover-protocol.md`, `docs/plans/execution-protocol.md`, `docs/templates/G001-handover-template.md` and `docs/handovers/H013-*.md`; I did not run the scripts they name.

| Element | How it is used here |
| --- | --- |
| Package and task IDs | `WP-13` onward (WP-12 closed at receipt `A058`, handover `H013`). Tasks are `WP-13.1`, `WP-13.2`, and so on |
| One task | One branch `feat/<task-id>-<slug>`, one PR titled with the task ID, merged by **Rebase and merge**, one receipt `A059` onward from `pnpm docs:new A “<Title>”`, DCO sign-off on every commit |
| Verification | `pnpm verify` and `pnpm receipt:check` before each PR; every user-visible behaviour has a Playwright test; underlying invariants get unit or conformance tests |
| Findings | New findings are registered in `docs/audits/register.yml` as `20261106-<layer>-<nn>` (for example `20261106-UX-26`). A finding becomes `fixed` only when every acceptance criterion below passes in automated tests; otherwise `partial` |
| Gates | Each package adds an entry to `docs/plans/gates.json` with `requiredTaskIds` and `requiredPassingTests` (the exact Playwright titles) |
| Handovers | At each gate L signs off, then a handover is **required** (IAHP rule HO-R1). The outgoing agent runs `pnpm docs:new H “<Title>”` (next ID is expected to be `H014`), fills it by derivation from CI and the register, passes `pnpm handover:check`, merges a docs-only PR and stops |
| Zero-hardcode | Protocol §1.6: no owner names, domains, vendor keys or sample clients in code; values come from `@living-portfolio/config`, the settings API or data files. New copy goes in `strings/` |
| Stops | The protocol stops only after WP-1 and WP-2; here the agent **halts at every gate**, because the brief requires a human-resumable handover at the end of each phase |

**Task WP-13.0 does the registration** (new findings, new gates, this plan as a `P`-class document), so the repository itself carries the plan after the first session.

### 7.2 Phase map

| WP | Name | Outcome a human can see | Depends on | Closes |
| --- | --- | --- | --- | --- |
| 13 | Onboarding and authentication integrity | A new owner can install, enrol an authenticator, finish setup signed in, and every wizard choice is saved | none | UX-26 to UX-33, UX-09, UX-41 (part), CP-14, CP-15 |
| 14 | Entry lifecycle integrity | Save, Publish, Unlist, Unpublish and Undo behave correctly; state is visible; shapes appear | WP-13 | UX-01 to UX-04, UX-08, UX-10, UX-11, UX-22, UX-43, UI-01, partly UI-03 |
| 15 | Foundations | Defined tokens, real primitives, split renderer, bundled client modules, one copy and help catalogue | WP-14 | UI-01 (full), UI-03, UX-13 to UX-15, UX-23 to UX-25, UX-38 |
| 16 | Admin shell, entries and inbox | Routed admin with rail, Today, entries list and editor routes, Inspector, inbox and answer rules | WP-15 | UX-06, UX-12, UX-37, UX-39, UX-07 (part) |
| 17 | Settings, maintenance and account | Separate settings pages on one template, answering switch, audit, calibration and structure screens, bookings, ventures, pages, account | WP-16 | UX-07, UX-16, UX-17, UX-33, UX-34, UX-41, UX-42, CP-13 |
| 18 | Authoring canvas and import | Large immersive editor, media, columns, import stepper with real file parsing | WP-15, WP-16 | UI-02, UX-35, UX-36, UX-18 |
| 19 | Public frame | Owner bar, new navigation, About, Ask panel, time rail with as-of, footer, robots | WP-16, WP-17 | UX-19, UX-20, UX-40, UX-44, UX-45 |
| 20 | Shape system, i18n readiness, polish, release | Theme shape presets, locale readiness, accessibility sweep, docs, v0.2.0 | all | UI-04, remaining P2 |

```
WP-13 → WP-14 → WP-15 → WP-16 → WP-17 → WP-19 → WP-20
                     └──────────→ WP-18 ───────┘   (WP-18 may run before WP-17 once WP-16 is closed)
```

If only one human is available, run them in numeric order. The only parallelism the repo’s one-session model allows is WP-18 before WP-17.

### 7.3 Standing instructions for every session

These apply to every package. They restate the repo’s rules only where an agent working from this plan could otherwise miss them.

1. **Entry.** Read the latest handover and `docs/plans/execution-protocol.md` and nothing else; run `pnpm handover:verify <H###>`; stop and report if any halt condition in the handover applies. Do not explore the repo. For WP-13 the “latest handover” is `H013`.
2. **Zero inference.** Cite exact paths, symbols and line anchors. Line numbers in this report are from the shipped zip and can drift; always re-locate by symbol or element ID and note any discrepancy in the receipt (section 1.0).
3. **One task at a time**, in the listed order; never reorder without a note and L’s sign-off.
4. **Verify first.** Each task opens with the repro: write the failing Playwright test that shows the defect, then fix it. Findings tagged **I** (inferred) in this report must be confirmed in a browser before any change; record the result.
5. **No new inline styles or hard-coded colours, sizes, copy or vendor names** in code written from WP-15 onward; use tokens, primitives and the catalogue. Until WP-15 lands, do not widen existing debt.
6. **Preserve test hooks.** Keep element `id`s and `data-*` attributes that conformance or e2e tests assert, or update those tests in the same pull request and say so.
7. **Evidence labelling:** `CI` for log blocks copied verbatim from the named job, `local output` otherwise, “computed from the above” for totals.
8. **Honesty.** Do not describe a behaviour as fixed unless a test in the receipt exercises it. Tag unfinished items `[partial]`, `[simulated]` or `[not-started]` as the repo does.
9. **Decisions.** Every decision is closed in §8. If a task meets a question §8 does not cover, choose the option that follows the spec and the principles in §6, record the choice and its reason in the receipt, and carry on; do not stop to ask. Spec first: a task that implements an amendment (A-01 to A-09, §5.4.2) or otherwise changes behaviour the spec describes edits the matching section of docs/spec/ in the same pull request.
10. **Exit.** At a gate, produce the closing receipt (gate summary and the fresh-clone command for L), wait for L’s sign-off, then write the handover and stop. Do no other work in that session.

**Start prompt (give this to every new session).** Take the template in `docs/templates/G001-handover-template.md`; its start prompt reads: *You are taking over the Living Portfolio implementation. Read `<path of the latest handover>`, then `docs/plans/execution-protocol.md`, and nothing else. Do not explore the repo. Run `pnpm handover:verify <H###>`. If any halt condition in section 8 applies, stop and report.* Each handover below lists the one **Immediate next action 1** the incoming agent should perform.

### 7.4 WP-13 — Onboarding and authentication integrity

**Goal.** A person who has never seen the product can clone it, follow a written checklist, create an account, enrol a real authenticator app, finish setup signed in, and find every choice they made saved afterwards. **Entry criteria.** `H013` verified. `pnpm verify` green at the `H013` evidence SHA. Decision D-02 is closed (§8).

| Task | What to do | Files | Closes | Done when |
| --- | --- | --- | --- | --- |
| WP-13.0 | Intake and registration. Run the entry routine. Add the findings in §5.3 and §2 of this report to `docs/audits/register.yml`; add gates WP-13 to WP-20 to `docs/plans/gates.json`; create this plan as a `P` document with `pnpm docs:new P “UX remediation work packages v2”` and paste §7 into it | `docs/audits/register.yml`, `docs/plans/gates.json`, `docs/plans/` | none | `pnpm docs:check` and `pnpm receipt:check A059` pass |
| WP-13.1 | Real authenticator enrolment. Keep the stored secret as is; derive its base32 form; build an `otpauth://totp/` URI with the issuer taken from the configured site name; render a QR code locally (no external service); show the manual key; add `POST /auth/totp/confirm` that verifies one code before setup is marked complete | `apps/api/src/auth/security.ts` (secret at L161, setup route L439–L456), setup page in `apps/web/src/renderer.ts` (L4320–L4719), new `apps/api/src/auth/totp.ts` | UX-26 | Unit: base32 round trip and URI format. Playwright: setup shows QR and manual key; entering a correct code (computed in the test) completes setup; a wrong code does not |
| WP-13.2 | Session from setup. After a confirmed code, issue the same `lp_session` cookie and CSRF token that `/login` issues; add `GET /auth/session` returning `{authenticated, username, csrfToken}`; stop showing the bearer token in the wizard | `security.ts` (login cookie at L476), `packages/client` | UX-28, UX-30 (part) | Playwright: after setup the owner is signed in, and the wizard’s later test buttons return something other than 401 |
| WP-13.3 | Credentials screen. Replace the inline line with a designed step: recovery codes (generated server-side, stored hashed, downloadable once), copy buttons, a plain explanation of what each item is and why it matters, and an “I saved these” gate before continuing. Move the API token to a later Account screen | `security.ts`, setup page | UX-30, UX-29 (part) | Playwright: the gate blocks Continue until ticked; recovery codes download; a recovery code can sign in once |
| WP-13.4 | Persist wizard choices. Each “Next” saves its step through the settings API after sign-in; revisiting a step restores values; theme cards become real radio inputs; hosting preset, public address, notification channel and target, backup destination and age key are stored | `renderer.ts` setup page, `apps/api/src/routes/settings.ts`, `packages/config` | UX-27 | Playwright: choose each option, reload, values persist; settings API returns them |
| WP-13.5 | Wizard wording and states. Move all wizard copy to `strings/`; use the hosting cards and field help from §6.8; explain every field (what, when, effect); disable test buttons with the reason when a setting is empty; make the backup test send its fields and turn a 501 into “Not available until a backup folder is set”; remove hard-coded vendor, model and sample text (data file or config); one primary action per step; the backup step runs the first backup and a test restore and the last step deploys the static site and offers the import planner (spec §13.13); the final screen shows one primary button | setup page, `strings/en.ts`, `settings.ts` L253, L302–L322 | UX-29, UX-33, CP-14, CP-15 | Playwright: no step presents two competing primary actions; the drill with no folder shows the new message; a repository scan finds no vendor or sample names in the setup markup |
| WP-13.6 | Login and sign-out. Explain the 6-digit field and add a recovery-code path; add a Sign out control to every admin page header | login page (L4197–), `renderLayout`, `POST /auth/logout` | UX-31, UX-41 (part) | Playwright: sign in with a recovery code; sign out ends the session and redirects |
| WP-13.7 | Start-here and deployment truth. Write `docs/START-HERE.md` (prerequisites checklist, ordered steps, expected time, what you will need to hand); correct the port in `docs/self-hosting.md` L52; document `ENABLE_BUNDLED_WEB` in `.env.example` and the guide; add a guard for `/admin*` in standalone `app.ts` that redirects when `GET /auth/session` says unauthenticated | `docs/`, `.env.example`, `apps/web/src/app.ts`, `docker/` | UX-32, UX-05 | A fresh-clone run of the documented steps reaches the setup page; unauthenticated `/admin` in standalone mode redirects to login |

**Gate G13 (L signs off).** (1) All seven tasks merged with receipts. (2) Playwright titles for WP-13.1 to WP-13.7 listed in `gates.json` pass in CI. (3) Fresh-clone check by L: clone, follow `START-HERE.md`, complete setup with a real authenticator app, sign out, sign back in with the code. (4) Register entries for UX-26 to UX-33 are `fixed` or `partial` with reasons.

**Handover H014 contents.** *Phase closed:* WP-13. *Phase next:* WP-14. *Hot files:* `renderer.ts` (`renderAdminWorkspacePage`, entry handlers L3082–L3234 and L3531–L3592), `apps/api/src/routes/entries.ts` (L246–L262, L357–L400), `calibration.ts` (L10–L20), `settings.ts` (L44), `styles.ts`, `tokens/index.ts`. *Immediate next action 1:* open `docs/plans/` plan document, task WP-14.0a, and write the failing Playwright test that the result of Save draft and Publish is visible in the viewport without scrolling. *Pending decisions to carry:* none; every decision is closed in §8. *Pitfalls:* the redaction token is bound to the entry and body hash and must be cleared on every body edit; `renderer.ts` line numbers have shifted after WP-13.

### 7.5 WP-14 — Entry lifecycle integrity

**Goal.** The entry state machine in §2.1.2 works exactly as drawn, state is visible, and the self-tuning layer is off by default. Everything is done in place, without restructuring. **Entry criteria.** `H014` verified; G13 closed.

| Task | What to do | Files | Closes | Done when |
| --- | --- | --- | --- | --- |
| WP-14.0a | **Make results visible first.** Stop writing every editor result into the single banner at the top of the page. Show an inline status line beside Save, Publish, Unpublish and Delete; show a toast fixed to the viewport in a polite live region; move focus to the result; refresh the entries list after create, save and delete | `renderer.ts` L2216–L2217 (banner and undo regions), handlers L3082–L3234 and L3531–L3592 | UX-43 | Playwright: after each action the message is inside the viewport without scrolling and is announced; a newly created entry appears in the list |
| WP-14.0 | Client bundling. Add a small build step (esbuild) that compiles typed modules under `apps/web/src/client/` into script assets served with the CSP nonce the layout already supports; migrate only the entry-handler block first | `apps/web/package.json`, `apps/web/src/client/`, `renderLayout` | prerequisite | A trivial module loads under the existing CSP; `pnpm verify` passes |
| WP-14.1 | `commitEntry` state machine. Implement the function in §2.1.2: Save never changes visibility; Publish of a saved entry calls `PUT /entries/:id` with token and NDA flag, of a new entry `POST`; Unlist and Unpublish are separate intents; clear the stored token on body edit; check every response; map 409 and 400 to specific messages from the API’s `message` field | new `client/admin/commit-entry.ts`; replaces L3082–L3234, L3531–L3592 | UX-01, UX-02, UX-03, UX-04, CP-12 | Playwright (one scripted journey, each step asserting the visible message): new → save → publish → edit → save stays public → unpublish → undo restores public → unlist; plus a 409 case and a stale-token case |
| WP-14.2 | State and date correctness. Render the state chip the script already targets; default the date to today on the client; validate it without throwing; add a temporal-confidence control (Exact, Range with a range end, Estimated) and send it instead of the fixed `exact` | markup around L2322–L2330 and L2579, three write paths | UX-10, UX-11, UX-22 | Playwright: chip shows Draft, Public, Unlisted; clearing the date shows an inline error; choosing Estimated or Range (with a range end) is stored |
| WP-14.3 | Publish dialog. Opening it auto-runs the scan; shows matches (the three-pass drawer as the detail), the NDA step only when needed, the Public or Unlisted choice, and what happens next; one Publish action; success toast with View page and a working Unpublish | redaction drawer markup L2390; `client/admin/publish-dialog.ts` | UX-03 (part), UX-13 (part) | Playwright: publishing needs no manual pre-check; a match blocks until confirmed or masked; focus is trapped and returned |
| WP-14.4 | Do not lose writing. Local autosave of the draft to IndexedDB, restore prompt on reopen, `beforeunload` guard when dirty, an offline banner | `client/admin/draft-buffer.ts` | 2.1.3 | Playwright: type, reload, text restored; leaving with unsaved text prompts |
| WP-14.5 | Calibration defaults as spec §11 requires. Suggestion thresholds and routing calibration ship off; topology audit and scoped-constraint mining stay on as proposal-only; replace the single “Freeze Calibration” checkbox with one switch per mechanism, each showing its minimum-sample gate and step limit; raise the gate above the current 5 samples to the spec’s value; never auto-apply a parameter change below the gate; mirror the spec’s `calibration:` configuration block | `apps/api/src/routes/calibration.ts` L10–L20, `settings.ts` L44, `packages/config`, settings markup (L3899) | UX-08 | API conformance test: a fresh instance reports both parameter mechanisms off and applies nothing; the other two report proposals only; Playwright: enabling a mechanism shows its gate |
| WP-14.6 | Quick visual repairs. Define `--radius-control`, `--radius-chip`, `--radius-card`, `--surface-overlay`, `--surface-sunken`, `--status-success-*`, `--status-warn-*`, `--status-danger-*`; replace uses of undefined names; fix the three `flex-wrap:gap` declarations; add a CI script that fails on any `var(--x)` with no definition | `tokens/index.ts`, `styles.ts`, `renderer.ts` L1510, L2254, L2377, `scripts/` | UI-01 (part), UI-03 (part) | The new script passes; screenshots show rounded controls and an opaque drawer |

**Gate G14.** (1) Tasks merged with receipts. (2) Lifecycle Playwright journey and the cases above pass in CI and are listed in `gates.json`. (3) `pnpm verify` includes the undefined-variable check. (4) L manually publishes, edits, unpublishes and undoes on a fresh clone. (5) UX-01 to UX-04, UX-08, UX-10, UX-11, UX-22 registered `fixed`.

**Handover H015 contents.** *Phase next:* WP-15. *Hot files:* `tokens/index.ts`, `styles.ts`, `components/*`, `renderer.ts` split map in §2.2.5, `apps/web/src/client/`, `scripts/`. *Immediate next action 1:* open task WP-15.0, create the DOM-id snapshot script, run it on `main` and commit its output as the baseline before moving any code. *Pending decisions:* none; every decision is closed in §8. *Pitfalls:* `bundled-web.ts` imports renderer names, so the compatibility barrel must keep them; conformance suites assert specific ids and strings.

### 7.6 WP-15 — Foundations

**Goal.** Replace ad-hoc markup with a real design system, split the 5,119-line renderer without changing behaviour, and give copy and help text one home. After this package every later page is built from primitives and tokens. **Entry criteria.** `H015` verified; G14 closed.

| Task | What to do | Files | Closes | Done when |
| --- | --- | --- | --- | --- |
| WP-15.0 | Baseline for safe refactoring. Write a script that renders every page with fixture data and records every element `id`, `data-testid` and `data-*` hook, plus the list of user-visible strings the existing tests assert; commit the baseline; fail CI if an id disappears without an allowlist entry | `scripts/snapshot-dom-ids`, `tests/` | enabler | Script passes on `main`; deleting an id fails CI |
| WP-15.1 | Complete the token tiers in §2.2.1: status tokens, type scale (12/14/16/18/21/30), spacing for 4 px grid, elevation, drawer width, target sizes, high-contrast theme and `forced-colors` support; apply the migration table rows to shared code | `tokens/*`, `styles/*` | UI-01 (full) | Variable-definition check passes; contrast tests for light, dark, high-contrast |
| WP-15.2 | Primitives per §2.2.2 and the affordance table in §6.9: `Button`, `IconButton`, `Chip`, `Badge`, `StatusDot`, `Switch`, `Field` (input, textarea, select, checkbox, radio) with sizes, variants, loading and disabled states; add a development-only gallery route used by visual and accessibility tests | `apps/web/src/primitives/*`, gallery route | UI-03, UX-23 | Unit tests for variants; axe finds no serious violations on the gallery; every control meets the target size |
| WP-15.3 | Components: `Dialog`, `Drawer`, `Toast` and live region, `Banner`, `Disclosure`, `Tabs` (arrow keys, roving tabindex), `Table`, `EmptyState`. Adopt `Drawer` for the redaction review and `Tabs` for the existing inspector so those two findings close before the redesign | `components/*`, `renderer.ts` L2390, L2444 | UX-13, UX-14, UX-15, UX-25 | Playwright: focus trap, Escape, focus return; arrow keys move tabs; toasts are announced |
| WP-15.4 | Split the renderer mechanically using the move map in §2.2.5, in three pull requests (public pages, admin workspace, settings/setup/import); keep a compatibility barrel for the names `bundled-web.ts` imports; no behavioural change | `apps/web/src/**` | package topology | DOM-id check unchanged; whole existing e2e and conformance suite green; `renderer.ts` under 300 lines |
| WP-15.5 | Copy and help catalogues. Structure `strings/en.ts` by area; add a typed `strings/help/<module>.ts` schema (what, when, how, impact, options with best-for and trade-off); expose the actionable-error formatter to client modules; apply the rows of §2.3.3 that live in files touched so far | `strings/*`, `client/*` | CP-13 (foundation), CP-01 | Unit tests on the formatter; a test that every message key referenced in markup exists |
| WP-15.6 | Guard rails in `pnpm verify`: forbid inline `style=` in files created after this task (allowlist for legacy), hex colours outside tokens, undefined CSS variables, and vendor or sample names in markup | `scripts/`, `docs/audits/hardcode-inventory.md` | UI-01, CP-15 | Introducing each violation in a temporary branch fails the check |
| WP-15.7 | Style the missing states: suggested versus confirmed facet chips, badge versus button, switch, status dots; remove `cursor:pointer` from non-interactive elements | `styles/*` | UX-38, UI-03 | Visual snapshots on the gallery; Playwright checks computed cursor and role |

**Gate G15.** (1) Tasks merged with receipts. (2) DOM-id baseline unchanged; renderer split complete. (3) Gallery passes axe. (4) New CI guards enabled. (5) L reviews the gallery on a fresh clone and confirms badge, chip, button and switch are distinguishable at a glance.

**Handover H016 contents.** *Phase next:* WP-16. *Hot files:* `apps/web/src/primitives/*`, `components/*`, `layouts/` (empty), `pages/` (moved files), `strings/help/`, `scripts/snapshot-dom-ids`. *Immediate next action 1:* open task WP-16.1 and write the failing Playwright test that lists the admin route table in §6.4 and asserts each route redirects to login when signed out. *Pending decisions:* none; every decision is closed in §8. *Pitfalls:* never edit a moved file and relocate it in one PR; the barrel must keep exporting `renderAdmin*` names; legacy files are allowlisted for inline styles and must shrink, not grow.

### 7.7 WP-16 — Admin shell, entries and inbox

**Goal.** `/admin` stops being one page. The owner gets a shell with a navigation rail, a Today page, a real entries list, an editor route per entry, a Structure drawer, and an inbox with rules. **Entry criteria.** `H016` verified; G15 closed.

| Task | What to do | Files | Closes | Done when |
| --- | --- | --- | --- | --- |
| WP-16.1 | Admin shell and route registry. Layout with rail (Write, Respond, Govern, Configure), top bar (site status popover with legend, account menu with Sign out), skip link, responsive collapse; every route in §6.4 guarded and deep-linkable, including the spec’s nine; each page gets a title and heading | `layouts/admin-shell.ts`, `apps/web/src/app.ts`, `pages/admin/*` | UX-06, UX-39 | Playwright: all routes redirect when signed out and render the shell when signed in; the legend explains each indicator |
| WP-16.2 | Today. Needs-attention list (questions due, drafts, build failure, backup overdue), a checklist that replaces the walkthrough card, dismissal stored on the server | `pages/admin/dashboard.ts`, settings API | UX-17 (part), CP-13 | Playwright: items appear from fixtures; dismissal survives reload |
| WP-16.3 | Entries list. Paginated, filter by state and type, search, state chip, four-step structure meter, row menu (Edit, Add context, Unpublish, Delete with typed confirmation), empty, loading, error and offline states | `pages/admin/entries/list.ts`; add pagination to `GET /entries` if absent | UX-12, 2.1.5 | Playwright per state; no request loads every entry’s details |
| WP-16.4 | Editor routes. Move the current editor into `/admin/entries/new` and `/admin/entries/:id`; the page loads only its own entry; the unsaved-change guard works across navigation; the “default to first entry” behaviour is removed | `pages/admin/entries/editor.ts` | UX-12, UX-37 | Playwright: opening a URL shows that entry; the Inspector never shows another entry |
| WP-16.5 | Inspector. Keep the spec’s five sections (Structure, Context, Evidence, Answerability, History) as an accessible tab set (arrow keys) in the right-hand pane, scoped to the open entry, headed by the four-step level bar and a next-step prompt from the gap questions; each tab carries its explainer; suggested items are dashed and labelled; History links to `/admin/entries/:id/history` with restore as a new revision | `patterns/structure-panel.ts` | UX-37, UX-14, CP-13 | Playwright: the Inspector opens from the list’s Add context action and from the editor; History restore creates a revision |
| WP-16.6 | Inbox and answer rules. Inbox list and detail routes, filters, due indicators, reply flow, inline “Make this a rule?” after a reply; the Answer rules view of `/admin/audit` lists pending, active and discarded rules with source quote and scope, and can revoke | `pages/admin/inbox.ts`, `pages/admin/audit.ts` | UX-07 (part) | Playwright: reply, accept a suggested rule, see it active, revoke it |
| WP-16.7 | Retire the monolith. Remove the old combined page; keep `/admin/import` and `/admin/settings` working until WP-17 and WP-18 replace them; update `gates.json` titles | `renderer.ts` remnants, `gates.json` | anti-pattern B | `/admin` renders Today only; all earlier gates still pass |

**Gate G16.** (1) Tasks merged with receipts. (2) The Playwright route-table test and the per-state tests are listed in `gates.json` and pass. (3) L walks the owner journey from sign-in: Today → entries → editor → Inspector → inbox → rule, and confirms each page has one primary task.

**Handover H017 contents.** *Phase next:* WP-17. *Hot files:* `layouts/admin-shell.ts`, `pages/admin/*`, `apps/web/src/app.ts`, `apps/api/src/routes/settings.ts`, `strings/help/`. *Immediate next action 1:* open task WP-17.1 and write the failing Playwright test for the Answering settings page, including the automatic-answers confirm dialog. *Pending decisions:* none; every decision is closed in §8. *Pitfalls:* `/admin/import` and `/admin/settings` remain legacy until replaced; do not delete their e2e coverage.

### 7.8 WP-17 — Settings, maintenance and account

**Goal.** Every settings area is its own page on one template, with plain-language explanation. The API capabilities that have no screen today (health, self-tuning, bookings, ventures, account, About pages) all get one. **Entry criteria.** `H017` verified; G16 closed.

| Task | What to do | Files | Closes | Done when |
| --- | --- | --- | --- | --- |
| WP-17.1 | `SettingsTemplate` (sub-navigation, header, Explain block, form, state panel, save bar) and the **Routing** page at `/admin/routing`: confidence bars with recommended values and consequence copy, public disclosure, the automatic-answers switch with confirm (and the quick pause from the top-bar status chip), fallback test mode, a configurable reply-time setting | `patterns/settings-section.ts`, `pages/admin/routing.ts`, help catalogue | UX-16, CP-13 | Playwright: lowering a bar shows the consequence and a restore button; pausing needs confirmation and updates the top-bar status |
| WP-17.2 | **Providers** (live registry, write-only API key fields, Test key, per-provider status and the data classes it may receive) and **Notifications** (channel options with outcomes, Send test while signed in, delivery history) | `settings/providers.ts`, `settings/notifications.ts`, `settings.ts` | UX-09 (complete), CP-13 | Playwright: a bad key shows “Key not valid”; keys are never returned by the API; a test alert reaches a stub channel |
| WP-17.3 | **Backups and export** (honest availability, destination options, age key explained, run a test with its result, export as a named archive download) and **Visibility** (robots policy generated from settings with `/admin`, `/api` and `/ask/status` disallowed and an AI-crawler switch, RSS and sitemap status, federation manifest, public confidence disclosure) | `settings/backups.ts`, `settings/visibility.ts`, `apps/web/src/app.ts` L65–L72, export route | UX-33, UX-34, UX-42 | Playwright: export downloads a file with a filename; `robots.txt` reflects settings; the drill states why it is unavailable when it is |
| WP-17.4 | **Account**: change username and password, re-enrol the authenticator, regenerate recovery codes, list, create and revoke API tokens (Developer access), sign out other sessions | `settings/account.ts`, `security.ts` | UX-41 | Playwright for each action; the old password stops working |
| WP-17.5 | **Audit** (Contradictions: detect, list, resolve; Stale claims), **Calibration** (one switch per mechanism, proposals, history, rollback) and **Structure** (profiles, facet vocabulary, hard constraints) | `pages/admin/audit.ts`, `calibration.ts`, `structure.ts`, `routes/audit.ts`, `routes/calibration.ts` | UX-07 | Playwright: a seeded conflict can be reviewed and resolved; a proposal can be applied then rolled back |
| WP-17.6 | **Bookings** (list, detail, status) and **Ventures** (create, edit, link entries, feeds `/build`) | `pages/admin/bookings.ts`, `pages/admin/ventures.ts`, `routes/book.ts`, `routes/structure.ts` L175 | UX-07, UX-19 (part) | Playwright: a booking submitted publicly appears in admin; a venture shows on `/build` |
| WP-17.7 | **Pages and Home settings**: edit the About sections (owner, now, stack) and the Home statement with revisions through a new `pages` resource and migration; `/admin/settings/home` holds the Featured count (default 3) and Recent count (default 10) as configuration; featured toggle on entries and ventures | `routes/pages.ts` (new), `packages/db`, `pages/admin/pages.ts`, `settings/home.ts` | UX-17 | Playwright: editing a section creates a revision; changing a count changes the Home list; a featured entry appears on Home |
| WP-17.8 | **Theme** at `/admin/theme`: move the token editor, add a basic live preview and contrast check; shape presets arrive in WP-20.1 | `pages/admin/theme.ts`, `packages/core` theme | spec §12.10 | Playwright: a colour change previews before saving; a failing contrast pair is blocked |

**Gate G17.** (1) Tasks merged with receipts. (2) The old `/admin/settings` page is removed and all settings areas pass their Playwright tests. (3) No API capability from the §2.1.4 table remains without a screen, or its absence is recorded as an accepted gap in the register. (4) L opens each settings page and confirms the Explain block states what, when, how and impact.

**Handover H018 contents.** *Phase next:* WP-18. *Hot files:* `settings/*`, `pages/admin/health.ts`, `routes/pages.ts`, `strings/help/*`. *Immediate next action 1:* open task WP-18.1 and write the failing Playwright test for the editor canvas width (at 1440 px the writing column is at least 640 px and capped near 72 characters). *Pending decisions:* none; every decision is closed in §8. *Pitfalls:* provider keys are write-only; never echo them in a response, log or test snapshot.

### 7.9 WP-18 — Authoring canvas and import

**Goal.** Writing is immersive and consistent, content can include images, video and columns without leaving Markdown, and importing existing material is a guided, real-format flow. **Entry criteria.** `H018` verified; G17 closed.

| Task | What to do | Files | Closes | Done when |
| --- | --- | --- | --- | --- |
| WP-18.1 | Canvas layout. Writing surface takes the full content width with the text capped near 72 characters; metadata in a collapsible header; modes Write, Split, Preview, Focus; Structure stays a drawer | `patterns/editor-workspace.ts`, `styles/admin.ts` | UI-02 | Playwright: at 1440 px the writing column is at least 640 px; at 1024 px the drawer overlays; at 390 px the toolbar stays reachable above the keyboard |
| WP-18.2 | Editor engine (D-05). Build the block editor with toolbar, slash menu, shortcuts and a loss-free Source mode. **Fail-safe:** if the Markdown round-trip suite (every seeded entry plus the export fixtures) is not 100% by the end of the task, ship CodeMirror live preview instead and record the decision | `client/admin/editor/*`, `markdown.ts` | 2.1.3 | Round-trip suite passes; Playwright covers each toolbar action and each shortcut |
| WP-18.3 | Media API. `POST /media` and `GET /media/:id` with auth and CSRF, a storage adapter (volume by default, S3-compatible by configuration), limits and allowed types from configuration, content sniffing, SVG rejected or sanitised, alt text stored, hashed names, a migration | `apps/api/src/routes/media.ts`, `packages/db`, `packages/config` | enabler | Conformance tests: oversize, wrong type, spoofed type, unauthenticated, path traversal |
| WP-18.4 | Images and video. Paste, drop or pick; alt-text prompt; captions; lazy loading; video upload or consent-gated embed; CSP sources from configuration; public rendering in `markdown.ts` | editor, `markdown.ts`, layout CSP | 4.11.2 request | Playwright: upload, reorder, publish, and the public page renders with alt text; embeds don’t load before consent |
| WP-18.5 | Columns. Implement the container directive (§6.6) in the parser, renderer and editor; two to four columns collapse to one below a container width; reading order matches source order | `markdown.ts`, editor | 4.11.2 request | Round-trip and export fixtures include columns; Playwright at three widths; screen-reader order test |
| WP-18.6 | Import stepper. Add, Plan, Review, Done with a persistent summary; Plan options as real radios shown only when an external provider is configured, with the cards in §6.7; Review renamed to Include, Leave out, Change type, Set date with “N of M reviewed”; Done screen with three next steps | `pages/admin/import.ts` | UX-35 | Playwright: no dead cards; success page replaces the in-place banner; one return link |
| WP-18.7 | Real file import. `POST /import/files` (multipart); Markdown, text, HTML, Word, PDF text and zip; rich paste in the Add step; embedded images go through the media API; per-file result and errors; explain how content was split | `routes/import.ts`, parsers behind an interface | UX-36 | Fixture files of each type import; a corrupt file reports its own error without failing the batch |
| WP-18.8 | Quick Log as a route. `/admin/quick-log` (alias `/quick-log`, owner only), the spec’s four fields (what happened, what was decided, what was learned, which venture) and one button, mobile-first, app-manifest shortcut | `pages/admin/quick-log.ts` | UX-18 | Playwright on a 390 px viewport: capture in under 30 seconds; works from the owner bar |

**Gate G18.** (1) Tasks merged with receipts. (2) Round-trip suite at 100% or CodeMirror fallback recorded. (3) Media conformance tests pass. (4) L writes an entry with an image and two columns, publishes it, and checks the public page and the Markdown export.

**Handover H019 contents.** *Phase next:* WP-19. *Hot files:* `client/admin/editor/*`, `markdown.ts`, `routes/media.ts`, `routes/import.ts`. *Immediate next action 1:* open task WP-19.1 and write the failing Playwright test that the owner bar appears only when `GET /auth/session` reports a signed-in owner and is absent after **View as visitor**. *Pending decisions:* none; every decision is closed in §8. *Pitfalls:* media files must never be served from a path the admin guard protects; the column directive must degrade to readable text in the exported Markdown.

### 7.10 WP-19 — Public frame

**Goal.** The public site gets the owner’s structure: main navigation, a Home with Featured and Recent lists, About, a left **time rail** and a right **conversation panel** that push the Story aside, an owner bar, and a footer. The separate `/ask` and `/timeline` pages are retired (D-10). **Entry criteria.** `H019` verified; G18 closed.

| Task | What to do | Files | Closes | Done when |
| --- | --- | --- | --- | --- |
| WP-19.1 | Owner bar and View as visitor. A script injected only for a signed-in owner; Dashboard, New entry, Edit this page, Inbox count, status, Sign out; the visitor view hides the bar and shows a Back to admin pill; no personalised HTML | `client/public/owner-bar.ts`, public layout | UX-40 | Playwright: bar absent when signed out; present when signed in; absent in visitor view; static HTML identical for both |
| WP-19.2 | Public shell, About and Home (A-01, A-03, A-04). Header About, Work, Writing, Build, Book call to action, theme and RSS icons; footer with legal, site map, owner sign-in and a language slot; About composed from the pages resource with anchors; `/about`, `/now`, `/uses` redirect to anchors; Home shows the statement, Featured (count from settings, default 3, curated from Work, Writing and Build) and Recent (count from settings, default 10, includes revisions labelled “Revised”) | `layouts/public-shell.ts`, `pages/public/about.ts`, `home.ts` | UX-19, UX-20, UX-17 | Playwright: nav and redirects; Home list lengths follow the settings; no five-tab bar remains |
| WP-19.3 | Three-region layout (A-02, A-07). Grid of time rail, Story and conversation panel that extrude; collapsed handles; widths from tokens; breakpoint rules and elevation rules from §5.4.5; URL flags `as_of`, `ask=1`, `timeline=1`; landmarks and focus management; reduced motion; the theme Frame slot contract; `/ask` and `/timeline` redirect to Home with the region open; rail and panel code loads on first open | `layouts/public-shell.ts`, `styles/layout.ts`, `components/slots.ts` | §5.4.5 | Playwright at 1440, 1100, 800 and 390 px: the Story is never under 640 px except on sheets; `Esc` closes sheets; a bundle-size test keeps a reading page within about 70 KB gzipped JavaScript |
| WP-19.4 | Conversation panel. Extract the Ask UI into a shared component used by the panel; scope switch (this entry or everything); date chip; persistence across navigation through `sessionStorage` plus `ask=1`; answers announced in a live region; Book hand-off kept; remove the `/ask` page route but keep `/ask/status/:token` | `components/ask.ts`, `client/public/ask-panel.ts` | §5.4.4 | Playwright: asking on an entry page sends `scope_entry_slug`; navigating keeps the conversation; the panel works on Home with scope “everything” |
| WP-19.5 | Time travel correctness (UX-44, UX-45). Add one shared `resolveRevisionAsOf(entry, date)` in `packages/core` (newest `written_at` not after the date, then the existing event-validity and hindsight rules); use it in the Work, Writing and Home lists, entry detail, `GET /timeline` and Ask context assembly; add `as_of` to `GET /entries`, `GET /entries/:slug` and pages | `packages/core`, `renderer.ts` L420–L440 and L758–L780, `routes/timeline.ts`, `routes/entries.ts`, `routes/ask.ts` | UX-44, UX-45 | Conformance and Playwright fixture with the owner’s scenario: viewpoints a, b, c and a later revision b′; at 2025-03-30 b appears in the list, the page, the timeline and an Ask citation; at 2025-09-30 b′ does; no draft or private entry is ever returned |
| WP-19.6 | Time rail. Vertical strata timeline, collapsed and anchored at Now; selecting a date sets `as_of`, re-renders the Story, shows “Viewing as of … Return to now” and passes the date to Ask; keyboard operable; a text-equivalent list view (spec §12.8); remove the `/timeline` page route | `components/strata-timeline.ts`, `client/public/time-rail.ts` | §5.4.4 | Playwright: choose a past month and Work lists only what existed; the list view gives the same dates; Ask answers carry the reconstruction notice |
| WP-19.7 | Discovery. `robots.txt` from settings, sitemap without `/ask` and `/timeline` and respecting visibility, RSS link in `<head>`, canonical URLs, `noindex` on as-of variants | `apps/web/src/app.ts` L65–L137 | UX-42 | Playwright and unit tests on each output |
| WP-19.8 | Compare mode. Two Story columns with independent dates (`?as_of=A&compare=B`) at 1440 px and wider, stacked with a switch below; the conversation panel follows the focused column | public shell | owner request | Playwright at both widths; each column resolves its own revisions |

**Gate G19.** (1) Tasks 19.1 to 19.8 merged with receipts. (2) The layout test passes at all four widths and the JavaScript budget test passes. (3) The time-travel fixture passes on every surface. (4) L walks the visitor journey: Home, About, Work, ask a question in the panel, open the rail, move to a past date, see the change in the Story and in the answer, return to now, then switch to the owner bar and back.

**Handover H020 contents.** *Phase next:* WP-20. *Hot files:* `layouts/public-shell.ts`, `client/public/*`, `routes/entries.ts`, `routes/timeline.ts`. *Immediate next action 1:* open task WP-20.1 and write the failing conformance test that every theme preset keeps text at 4.5:1 and component boundaries at 3:1. *Pending decisions:* none; every decision is closed in §8. *Pitfalls:* as-of pages must never leak private entries or draft revisions; do not index as-of variants.

### 7.11 WP-20 — Shape system, locale readiness, polish and release

**Goal.** Finish the visual system, make the interface ready for more than one language, sweep accessibility and copy, complete the documentation, and release. **Entry criteria.** `H020` verified; G19 closed.

| Task | What to do | Files | Closes | Done when |
| --- | --- | --- | --- | --- |
| WP-20.1 | Theme shape contract (A-08). Radius presets (sharp, soft, round, pill), border presets (none, hairline, strong), content surface flat or outlined, raised only for overlays, all mapped to tokens; extend the conformance check with contrast rules (text 4.5:1, boundaries and focus 3:1); live preview on `/admin/theme` | `packages/core` theme, `tokens/*`, `pages/admin/theme.ts` | UI-04 | Conformance test over all presets; Playwright: change a preset, the page updates, a failing combination is blocked |
| WP-20.2 | Interface translation readiness (D-07). Locale configuration; `lang` set from it; UI strings in ICU message format keyed by locale (spec §12.8); logical CSS properties for right-to-left; footer language selector shown only when more than one locale exists; `hreflang`. No content translation | `strings/*`, `renderLayout`, `packages/config`, `styles/*` | spec §12.8 | Tests with a second fixture locale and a right-to-left fixture; the selector is hidden with one locale |
| WP-20.3 | Accessibility sweep. axe across every route in e2e; keyboard-only journeys for sign-in, write, publish, import, settings, rail and panel; target sizes; single-key shortcuts can be turned off | `tests/e2e/a11y/*` | UX-24, remainder | Zero serious or critical violations; documented exceptions only |
| WP-20.4 | Copy sweep. Apply every remaining row of §2.3.3 and the glossary in §2.3.1; set the first-person answer label (A-09); add a test that fails if owner-facing markup contains internal terms (tier numbers, level codes, status enums, HTTP codes, finding IDs) | `strings/*` | CP-01 to CP-15 | Terminology test passes |
| WP-20.5 | Performance. Remove the per-entry repository calls on Home (N+1) and the load-everything admin paths that remain; measure reading-page JavaScript and largest contentful paint against spec §12.5 and record the numbers | `pages/public/home.ts`, `scripts/` | 2.1.5 | Query-count test on Home; budget script output in the receipt |
| WP-20.6 | Documentation and amendments. Confirm A-01 to A-09 are written into `docs/spec/`; add `docs/architecture.md`, `plugin-development.md`, `security.md`, `upgrading.md`, a reverse-proxy reference config, feature, connector and theme issue templates, and refresh README and `START-HERE.md` | `docs/`, `.github/ISSUE_TEMPLATE/` | spec §19 | `pnpm docs:check` passes; a diff check shows every amendment present |
| WP-20.7 | Release v0.2.0: changelog, version bump, release workflow, fresh-clone verification by L, closing receipt, final handover | `CHANGELOG`, workflows | release | L signs the gate |

**Gate G20 (release).** Every earlier gate still passes; L completes the full owner journey on a fresh clone (clone, START-HERE, setup, write, import, publish, visit as visitor, ask, time-travel, settings, backup test, sign out). **Handover H021** records v0.2.0 and the maintenance backlog.

---

## 8. Decision record (all closed)

Every decision is closed. The first thirteen are the owner’s rulings of 6 Nov 2026; D-10 overrides my earlier recommendation. D-14 to D-20 are mine, made so that no package has to wait; each follows the spec or the owner’s stated principles, and each can be reversed by editing the named task. Nothing here is deferred.

| ID | Question | Ruling | By | Applied in |
| --- | --- | --- | --- | --- |
| D-01 | Which spec is canonical | The 103 KB in-repo spec; the uploaded 20 KB delta is set aside | Owner | §1 re-baselined; WP-14.5 |
| D-02 | Admin architecture; Compose web service | Server-rendered pages with bundled client modules; document bundled mode as the default; add an optional web profile to Compose | Owner | WP-13.7, WP-15.4 |
| D-03 | Panel persistence | Restored state through `sessionStorage` and the URL flag `ask=1` | Owner | WP-19.4 |
| D-04 | Meaning of “as of” | Revision time: the version that existed on that date, for the pages and for Ask. Example: a, b, c, and b′ written 2025-06-30 → b at 2025-03-30, b′ at 2025-09-30 | Owner | WP-19.5 |
| D-05 | Editor technology | ProseMirror for block, WYSIWYG editing with Markdown syntax; must pass a 100% lossless round-trip suite, otherwise CodeMirror source editing | Owner | WP-18.2 |
| D-06 | Media | Local volume; images up to 10 MB; video by load-on-consent embed, with upload limits set in configuration; every limit in a configuration file the owner can edit, none in code | Owner | WP-18.3, WP-18.4 |
| D-07 | Language switching | Interface strings only, built so more languages can be added later; no content translation | Owner | WP-20.2 |
| D-08 | Automatic-answers switch | Settings › Answering, plus a top-bar status chip with a confirmed quick pause | Owner | WP-17.1 |
| D-09 | Home page | One-sentence statement; Featured (default 3) from Work, Writing and Build; Recent (default 10) automatic, including revisions; both counts configurable; rail and panel present | Owner | WP-17.7, WP-19.2 |
| D-10 | Keep `/ask` and `/timeline` pages | No. Retire them; panels only. Ask may be about this content or the whole site; the timeline also applies to Home | Owner | WP-19.3 to WP-19.6 |
| D-11 | Import formats | Markdown, text, HTML, Word, PDF text, zip; no OCR | Owner | WP-18.7 |
| D-12 | Setup token display | Not shown; Settings › Account › Developer access | Owner | WP-13.2, WP-17.4 |
| D-13 | Recovery codes | Yes | Owner | WP-13.3 |
| D-14 | Region names and elevation | Time rail, Story, conversation panel; one plane when side by side; the panel highest when overlaid (§5.4.5) | Agent, from the owner’s metaphor | WP-19.3 |
| D-15 | Inspector sections | Keep the spec’s five, add explainers and correct scoping | Agent, from spec §12.6 | WP-16.5 |
| D-16 | Admin routes | The spec’s nine names, plus Today, quick-log, pages and bookings | Agent, from spec §5.1 | WP-16.1 |
| D-17 | Quick Log | The spec’s four fields on its own route | Agent, from spec §4.4 | WP-18.8 |
| D-18 | Compare mode | In scope, last task of WP-19 | Agent, from the owner’s request for parallel dates | WP-19.8 |
| D-19 | Where answer rules live | Prompt after a reply in Inbox; list and revoke in Audit | Agent, from spec §6.2 | WP-16.6 |
| D-20 | Choice controls | Radio option rows, not cards | Agent, from spec principle on card grids | WP-13.5, WP-18.6 |

---

## 9. Crosswalk from the version 1 roadmap to the work packages

| Version 1 item | Work package |
| --- | --- |
| P0-1 admin reachability and guard | WP-13.7 |
| P0-2, P0-3 entry commit path and Publish dialog | WP-14.1, WP-14.3 |
| P0-4 setup wizard interactive | WP-13.1 to WP-13.5, WP-17.2 |
| P0-5 calibration default | WP-14.5 |
| P0-6 state chip and date | WP-14.2 |
| P1-1, P1-2 admin shell and routes | WP-16.1 to WP-16.7, WP-17 |
| P1-3 editor workspace | WP-18.1, WP-14.4 |
| P1-4 missing screens | WP-17.5 to WP-17.7, WP-16.6 |
| P1-5 tokens | WP-14.6, WP-15.1 |
| P1-6 component library | WP-15.2, WP-15.3 |
| P1-7 renderer split | WP-15.4 |
| P1-8 paginated dashboard | WP-16.3 |
| P2-1 copy | WP-15.5, WP-20.4 |
| P2-2 reply-time setting | WP-17.1 (configuration), WP-20.4 |
| P2-3 type scale and high contrast | WP-15.1, WP-20.1 |
| P2-4 home rails, Book CTA, theme toggle | WP-19.2 |
| P2-5 theme editor | WP-17 (basic), WP-20.1 |
| P2-6 motion and optical alignment | WP-15.7, WP-20.3 |
| P2-7 docs and templates | WP-13.7, WP-20.6 |
| P2-8 confidence disclosure and federation controls | WP-17.3 |
| Walkthrough-only items (owner bar, side panels, as-of, import formats, robots, shape system, locale) | WP-19, WP-18.6 to WP-18.7, WP-17.3, WP-20.1, WP-20.2 |

**Added in the final version:** UX-43 maps to WP-14.0a; UX-44 and UX-45 to WP-19.5; A-01 to A-09 (§5.4.2) to the tasks named there; D-01 to D-20 to §8.

## 10. Limits of version 2

1. **Nothing was executed.** I read the code and did not run the app, the tests or the repository’s scripts (`docs:new`, `handover:check`, `receipt:check`). WP-13.0 starts by confirming those scripts and `gates.json` behave as I read them, and any difference goes in its receipt.
2. **The cause of “no visible change” is established; the server-side outcome of Publish is not.** The messages are written far from the editor (UX-43). Whether Publish then succeeds or returns a duplicate-slug error is only knowable once feedback is visible, which is why WP-14.0a comes first and WP-14.1 asserts both.
3. **Three findings need a browser or a test to confirm:** the revision-order tie in entry detail (UX-45), the computed editor width at desktop sizes (UI-02), and the transparent redaction drawer (UI-01). Each package’s first test settles it.
4. **Line numbers** come from the shipped zip and several are approximate (marked “\~”). Agents are told to re-locate by symbol.
5. **Estimates are deliberately absent.** The repository’s protocol schedules by task and gate, not by time, and I have no basis to estimate agent throughput on this codebase.
6. **Not audited:** the data model, algorithms and stack sections of the spec (§7 to §10), entry-page elements, and the Ask page beyond the states I read.
