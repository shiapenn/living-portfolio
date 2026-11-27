# Admin Screen Brief Gate (Part C)

> Every new admin route, new list-item type, or new state panel **must** include a Screen Brief in the PR description before implementation begins.

## Required Brief Template

One concise block per screen:
- **Archetype (`D1`):** One of `form`, `list`, `detail`, `review`, or `dashboard` (emitted via `data-archetype` on `.lp-page-column`).
- **Job to be done (JTBD):** What the owner is here to accomplish.
- **Decision & required data:** The decision the owner makes and the exact fields needed on screen to make it.
- **Primary action & consequence:** The main action and what changes (including whether visitors/external systems are affected).
- **Hierarchy ranking (`1..n`):** Visual priority order of fields and why.
- **States:** `empty`, `error`, `loading`, `one`, `many`, `long text`.
- **Compact behaviour:** How layout adapts at compact container width without overflow or orphaned chevrons.

---

## Retroactive Briefs (WP-17.9 – WP-17.12)

### 1. Today (`/admin`)
- **JTBD:** Triage what needs attention right now on first login.
- **Decision & data:** Which queue to open first (unpublished draft count, unanswered inbox count, pending bookings, setup/backup readiness).
- **Primary action & consequence:** Navigate to the relevant work queue (read-only navigation).
- **Hierarchy:** `1` page title -> `2` Needs attention items (title, status, chevron) -> `3` Quick links.
- **States:** empty ("All caught up"), error (page-top Notice + Retry), loading (SSR), one/many items, long titles clamped to 3 lines.
- **Compact:** Row 1 full-width title, row 2 status + trailing chevron (or chevron trailing on row 1 if status omitted).

### 2. Entries (`/admin/entries`)
- **JTBD:** Find, filter, and open portfolio entries for editing or creation.
- **Decision & data:** Which entry to edit (title, state `Draft`/`Published`/`Private`, entry type/profile, updated date).
- **Primary action & consequence:** `New entry` creates a draft; clicking a row opens the editor.
- **Hierarchy:** `1` New entry / filter bar -> `2` Entry title -> `3` Status -> `4` Profile & updated date.
- **States:** empty ("No entries match"), error (page-top Notice), loading, one/many, long titles clamped to 3 lines.
- **Compact:** Filters stack full-width (compact input size floor); items stack status + chevron on row 2.

### 3. Inbox (`/admin/inbox`)
- **JTBD:** Answer escalated visitor questions or decline out-of-scope ones.
- **Decision & data:** Whether to reply or decline (full unclamped visitor question, visitor context/time, matched entries).
- **Primary action & consequence:** Open question / send reply (publishes answer to visitor & optionally proposes an answer rule) or decline.
- **Hierarchy:** `1` Tabs (`Pending`, `Replied`, `Declined`) -> `2` Full visitor question (`content` title, unclamped) -> `3` Received timestamp & meta -> `4` Action (`Reply` / `Decline`).
- **States:** empty ("No pending questions"), error (section Notice below ActionBar), loading, one/many, long multi-sentence questions unclamped.
- **Compact:** Single-status filtered tab omits status; trailing chevron stays on row 1 next to unclamped question.

### 4. Audit — Answer Rules (`/admin/audit?status=proposed|confirmed|revoked`)
- **JTBD:** Approve, discard, or restore rules extracted from owner replies.
- **Decision & data:** Whether a rule should govern future automated answers (full unclamped rule text, scope condition, source quote).
- **Primary action & consequence:** `Confirm` activates rule for `/api/ask`; `Discard` revokes it; `Restore` re-activates.
- **Hierarchy:** `1` Tabs -> `2` Unclamped rule summary (`content` title) -> `3` Scope description -> `4` Source quote -> `5` Actions.
- **States:** empty ("No rules in this view"), error (StatusLine/Notice), loading, one/many, long rules unclamped.
- **Compact:** Single-status tab omits status; full-width text with actions stacked below.

### 5. Audit — Contradictions (`/admin/audit?status=contradictions`)
- **JTBD:** Decide which conflicting claim stands, or confirm both apply without conflicting.
- **Decision & data:** Older vs newer claim text, entry dates (`Older · {date}` / `Newer · {date}`), source entry links, conflict likelihood (`{N}% likely conflict`).
- **Primary action & consequence:** `Keep newer` records a `supersedes` relation stopping answers from using the older claim; `Keep both` dismisses the conflict. *(API does not currently express "keep older".)*
- **Hierarchy:** `1` State panel (headline -> `Last checked` meta -> `Run check`/`Check again` ActionBar -> error Notice) -> `2` One-line intro -> `3` Conflict title + `{N}% likely conflict` -> `4` Older/Newer claim blocks with edit links -> `5` `Keep newer` / `Keep both`.
- **States:** `idle`, `running`, `clean`, `found`, `error`, `resolved` — button position identical across all 6 states.
- **Compact:** Below container breakpoint `640`, claim blocks stack with visible `"vs"` divider; at or above `640`, side-by-side. No status label.

### 6. Bookings List & Detail (`/admin/bookings`, `/admin/bookings/:id`)
- **JTBD:** Review consultation requests and confirm, decline, cancel, or email the requester.
- **Decision & data:** Topic, status (`Pending`/`Confirmed`/`Declined`/`Cancelled`), requested slot with date & timezone (`requester slot · owner local time`), requester name, received date; on detail: email (`mailto:`), context facets, notes, status history.
- **Primary action & consequence:** `Confirm` / `Decline` / `Cancel` updates status locally only (does NOT email visitor automatically); `Email requester` opens prefilled `mailto:` with `Re: {topic}`.
- **Hierarchy:** List: `1` Topic + status + chevron -> `2` Requested slot (strong meta) -> `3` Requester name -> `4` Received date -> `5` Confirm/Decline. Detail: `1` Topic + status -> `2` Requested slot -> `3` Requester name & mailto -> `4` Facets & notes -> `5` Status history -> `6` Actions + visitor-behaviour helper.
- **States:** empty ("No booking requests yet"), error (Notice below ActionBar), loading, pending/confirmed/declined/cancelled, long notes.
- **Compact:** List items stack row 2 status + chevron; detail fields stack full-width cleanly.

### 7. Settings — Account (`/admin/settings/account`)
- **JTBD:** Manage credentials, TOTP authenticator, recovery codes, API tokens, and active sessions.
- **Decision & data:** Credential fields, QR + manual key, one-time recovery codes, active token list (label, created date, last-used).
- **Primary action & consequence:** Rotate password/TOTP/recovery codes (invalidates old codes), create/revoke API tokens, end other sessions.
- **Hierarchy:** `1` Section title -> `2` Fields / QR -> `3` ActionBar -> `4` Feedback Notice or `Credential` block (with Copy inside surface footer).
- **States:** idle, error (full-width danger Notice below ActionBar), secret-created (`Credential`), active tokens list (status hidden — single-status).
- **Compact:** Recovery codes 1-per-row (`nowrap`, never wraps mid-code); API tokens wrap cleanly (`overflow-wrap: anywhere`, 0 overflow).

### 8. Settings — Answering, Providers, Appearance, Backups, Visibility, Home, Pages, Structure, Calibration, Ventures, Status
- **JTBD:** Configure automated answering thresholds, model fallback, visual theme pack, backups, crawler policy, home counts, static pages, taxonomy, calibration, ventures, and system health.
- **Decision & data:** Current values, recommended defaults & operational consequences (ADR-024 floor rule), live contrast check (Appearance), revision history (Pages).
- **Primary action & consequence:** `Save` persists config and confirms with `StatusLine` (never green Notice); `Restore recommended` resets defaults; `Pause answering` opens confirmation `Overlay`.
- **Hierarchy:** `1` Page title -> `2` Section title -> `3` Label + Control + Helper -> `4` State warning Notice (above ActionBar) -> `5` ActionBar -> `6` Feedback (`StatusLine` or danger `Notice`).
- **States:** default, dirty, state-warning (drift/AA fail), field-invalid (`aria-invalid`), action-error, action-success (`StatusLine`), empty.
- **Compact:** All inputs meet the compact mobile size floor, single-column sections, full-width Notices, horizontally scrollable Tabs.

---

## Forward Screen Briefs (WP-18)

### 9. Editor — Insert / Edit Media Dialog (`WP-18.4`, `Overlay` on `/admin/entries/:id`)
- **Archetype (`D1`):** System-mode `Overlay` dialog (`dialog` variant) inside the fullscreen entry editor; zero new `data-c` components (variants only: `Field[file]`, `Field[text]`, `Choice`, `ActionBar[dialog]`, `Notice[danger]`, `StatusLine`, `Text[caption]`).
- **JTBD:** Insert or edit an image, uploaded video, or consent-gated external video embed in an entry with accessible descriptions and privacy-preserving storage references (`/api/media/:id`).
- **Decision & required data:**
  - *Image:* File (`Field` file variant styled as Secondary button), Alt text (`Field`, required unless Decorative `Choice` is checked), Decorative image (`Choice` single checkbox), Caption (`Field`, optional). Decorative round-trips as `![](/api/media/:id "caption")`.
  - *Video:* Mode `Choice` (`Upload` / `Embed URL`), File (`Field` file variant) or Embed URL (`Field` url, host validated against config allowlist `MEDIA_EMBED_ALLOWED_HOSTS`, default `youtube-nocookie.com` and `player.vimeo.com`), Description (`Field`, required; becomes accessible name), Caption (`Field`, optional). Poster and `.vtt` captions track are omitted in `WP-18.4` (`.vtt` deferred to `WP-20.3`).
- **Primary action & consequence:** `Insert` (add mode) or `Save` (edit mode) inserts/updates the media block in the entry; `Cancel` (`Text` button) closes without changes; `Remove` (`text-danger` button, edit mode only, last) deletes the block immediately with no confirmation dialog because editor undo restores it. Consequence line (`S2` above `ActionBar`): `"Visitors must click to load this video."` (Embed URL mode) / `"Video metadata isn't removed on upload."` (Video upload mode).
- **Entry points:** Formatting bar (`Image` and `Video` buttons), `/image` and `/video` slash commands, clipboard `paste`, and editor-surface `drop` (no drop zone inside the dialog; paste/drop upload immediately then open the dialog for required alt text / description).
- **Hierarchy (`1..n`):** `1` Dialog title (`Insert image` / `Edit image` / `Insert video` / `Edit video`) -> `2` Mode `Choice` (video) & File / URL `Field` -> `3` Alt text / Description `Field` + Decorative `Choice` -> `4` Caption `Field` -> `5` Consequence line (`S2`) + `ActionBar` (`Insert`/`Save`, `Cancel`, `Remove`) -> `6` Upload `StatusLine` (`> 1s`) or danger `Notice` (`S3` below `ActionBar`).
- **States:** `idle`, `uploading` (`aria-busy="true"` on primary button, `StatusLine` after `1s`), `error-oversize`, `error-quota`, `error-network` / type / SVG (`Notice[danger]` under `ActionBar`), `field-invalid` (missing alt/description or disallowed embed host), `edit`, `inserted`.
- **Compact:** At compact container width, dialog surface fills the viewport gutter with dialog inset padding; file trigger, inputs, choices, stacked `ActionBar` buttons, and `Notice` align flush on the dialog content column with zero horizontal overflow.
