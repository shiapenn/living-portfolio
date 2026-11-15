# P005 — WP-15 Capability Parity Table

> [!NOTE]
> Created at Gate G15 closure (2026-11-15) after `WP-15.4` retired `apps/web/src/pages/admin/workspace.ts` in favour of the Reference Editor Page (`apps/web/src/pages/admin/entries/editor.ts`). Any safety-relevant control or data-protection feature not currently reachable in the UI is registered as a `P1` finding with a first-task slot in `WP-16.0`.

## 1. Feature Parity Matrix

| Legacy `workspace.ts` feature | Where it lives now / WP that restores it | What the owner can do meanwhile | Finding (if P1 safety/data-protection gap) |
| --- | --- | --- | --- |
| **Draft buffer & offline banner** (`#admin-offline-banner`, `#draft-restore-notice`, IndexedDB buffer, `beforeunload` unsaved guard) | Removed when `workspace.ts` was deleted in `WP-15.4`; **restored in `WP-16.0`** | **Not at all** (reloading or losing connection loses unsaved edits) | `20261106-UX-96` (`P1`, `WP-16.0`) |
| **Escalation review card** (`#esc-card-*`, approve / reject visitor escalations) | Removed from `/admin` in `WP-15.4`; **restored in `WP-16.0`** (quick review card) and **`WP-16.6`** (full Inbox & Answer Rules) | **API only** (`GET /api/v1/inbox`, `PATCH /api/v1/inbox/:id/approve`, `POST /api/v1/inbox/:id/reject`) | `20261106-UX-105` (`P1`, `WP-16.0`) |
| **Inbox** (visitor questions list & triage) | Removed from `/admin` in `WP-15.4`; **restored in `WP-16.0`** (escalations) and **`WP-16.6`** (full Inbox page) | **API only** (`GET /api/v1/inbox`, `PATCH /api/v1/inbox/:id/approve`, `POST /api/v1/inbox/:id/reject`) | `20261106-UX-105` (`P1`, `WP-16.0`) |
| **Kill switch** (`#btn-killswitch`: Pause / Resume Automated Answering) | Removed from `/admin` in `WP-15.4`; **restored on `/admin` in `WP-16.0`** and in top-bar/Routing in **`WP-17.1`** | **UI on `/admin/settings`** (`#setting-answering-enabled` checkbox) and **API** (`POST /api/settings`); not on `/admin` workspace | `20261106-UX-104` (`P1`, `WP-16.0`) |
| **Topology conflict card** (`#topology-conflicts-card`) | Removed in `WP-15.4`; **`WP-17.5`** (Audit & Contradictions page) | **Not at all** (`/api/audit/topology-conflicts` returns honest `501`) | — (unconfigured `501` capability) |
| **Scoped-constraint confirm / discard** (`#scoped-constraint-card`, `#btn-confirm-constraint`, `#btn-discard-constraint`) | Removed in `WP-15.4`; **`WP-17.5`** (Structure & Constraints) | **API only** (`/api/structure/constraints`) | — |
| **Deploy status chip** (`#deploy-status-chip`, `#admin-status-build`) | Removed from `/admin` per `D-WORKSPACE`; **`WP-16.1`** / **`WP-16.2`** (top-bar site status popover) & **`WP-17.1`** | **Not at all** | — |
| **Publish Now** (`#btn-publish-now`, site-wide static rebuild) | Entry publishing lives in Reference Editor (`Publish…` `#ref-btn-publish` on `/admin`); site-wide rebuild moves to **`WP-17.1`** | **UI** for per-entry publish (`/admin`); **API only** for site-wide rebuild | — |
| **Run Backup and Restore Drill** (`#btn-backup-drill`) | Lives in **`/admin/settings`** (`#btn-run-backup-drill`); full UI & implementation in **`WP-17.3`** | **UI on `/admin/settings`** (returns honest `501` until `WP-17.3`) | — |
| **Export Markdown + Sidecar** (`<a href="/api/settings/export">`) | Removed from `/admin` in `WP-15.4`; **`WP-17.3`** (Backups and export page) | **API only** (`GET /api/settings/export`) | — |
| **Quick Log** | Removed in `WP-15.4`; **`WP-18.8`** | **Not at all** (use `New entry` in Reference Editor) | — |
| **Guided and Paste modes** | Paste / Write is the default in Reference Editor (`/admin`); Guided Mode **`WP-18.1`** / **`WP-18.8`** | **UI** for Write/Paste only; Guided Mode **Not at all** | — |
| **Run Background Enrichment** | Automatic on entry commit; manual trigger & status in **`WP-16.5`** (Inspector) | **API only** (`POST /api/entries/:id/enrich`) / automatic on save | — |
| **Inspector tabs** (Structure, Context, Evidence, Answerability, History) | `Structure` drawer (`#ref-btn-structure`) and `History` drawer (More menu) live in Reference Editor (`/admin`); full 5-tab Inspector in **`WP-16.5`** | **UI** for Structure & History drawers only; Context, Evidence, Answerability **Not at all** in UI | — |

## 2. Immediate Remediation Slot (`WP-16.0`)

All three safety-relevant / data-protection UI losses from `workspace.ts` retirement are scheduled in **`WP-16.0`** (the first task of `WP-16`, before `WP-16.1`):
1. `20261106-UX-96`: Draft buffer, restore prompt, `beforeunload` unsaved-changes guard, and offline banner.
2. `20261106-UX-104`: Automated-answering kill switch accessible directly from the `/admin` workspace.
3. `20261106-UX-105`: Escalation review / approval card accessible from the `/admin` workspace.
