---
id: ADR-025
title: Feedback Placement and Timing
status: accepted
date: 2026-11-26
supersedes: null
area: feedback
rules:
  - id: R-025-1
    text: "Admin uses no toasts; all feedback follows the 9 closed scenarios in docs/design/feedback.md: field-invalid inline replacing helper (aria-invalid + aria-describedby, focus first invalid), action-error danger Notice directly below the trigger section ActionBar (aria-live=assertive, scrolled into view), action-success without follow-up as StatusLine below ActionBar (not a green Notice, cleared on dirty), secret-bearing success as warning Notice + Credential in trigger section, state-derived warning Notice directly above ActionBar, destructive confirmation via Overlay dialog, page-level failure as page-top danger Notice with Retry, in-progress disabling trigger with Saving…/Checking… + aria-busy, and empty/idle via EmptyState"
    enforced_by: tests/e2e/wp17-9-content-and-ink-census.spec.ts
  - id: R-025-2
    text: "All Notices span full container width (within 1px of container width); server validation errors are mapped to concise copy (at most 3 lines, each <= 12 words, with 'and N more' if truncated; no raw validator dumps); errors never auto-dismiss and clear only on next edit or retry"
    enforced_by: tests/e2e/wp17-9-content-and-ink-census.spec.ts
  - id: R-025-3
    text: "One-time secrets (TOTP manual key, recovery codes, API tokens) render via the registered Credential component (variants single and list): warning Notice ('Shown once. Save it now.') above a bordered monospace Credential surface with Copy/Copy all + Copied StatusLine, single wrapping with overflow-wrap:anywhere (zero horizontal overflow), manual key grouped in blocks of 4, and list in a 2-col compact / 4-col regular grid"
    enforced_by: tests/e2e/wp17-9-content-and-ink-census.spec.ts
  - id: R-025-4
    text: "Every accent-bearing admin role (primary Button fill/label, text Button, Link, focus ring, selected Tab indicator, selected Choice tint/check, native accent-color, EmptyState/Notice links) binds strictly to the derived accent tokens in light and dark themes with zero hard-coded legacy accent ink"
    enforced_by: tests/e2e/wp17-9-content-and-ink-census.spec.ts
---

# ADR-025: Feedback Placement and Timing

## Context
During L-review of `wp17-10-contact-sheets.zip`, inconsistent feedback placement and styling surfaced across admin screens: page-top banners for section-level actions, shrink-wrapped success Notices instead of full-width feedback or StatusLines, raw six-sentence validator dumps on JSON import errors, uncontained API tokens causing horizontal overflow at narrow viewports, and unstyled legacy-blue text buttons/links when a non-default accent pack was active.

## Decision
1. **Closed 9-scenario feedback model (`docs/design/feedback.md`):** No toasts in admin. Every user action and system state maps to exactly one of 9 deterministic placements and timings (field-invalid inline, section-local error Notice below ActionBar, non-secret success StatusLine below ActionBar, secret-bearing success Notice + Credential, state-derived warning Notice above ActionBar, Overlay dialog for destructive confirmation, page-top danger Notice with Retry for page-level failure only, in-progress button state + `aria-busy`, and EmptyState for empty/idle).
2. **Full-width Notices & mapped validation copy:** Every `.lp-notice` spans 100% of its container width. Server validation errors are mapped to at most 3 lines of at most 12 words each (`and N more` if truncated). Errors never auto-dismiss; they clear on next edit or retry.
3. **Credential component (`C1`):** Promote Setup's recovery-code presentation to the registered `Credential` component (`data-c="Credential"`, variants `single` and `list`) for TOTP manual keys, recovery codes, and newly created API tokens.
4. **Complete accent coverage (`C4`):** Bind every accent-bearing role across light and dark themes to the derived accent tokens emitted by `@layer user-theme`.

## Consequences
- All admin screens (Account, Answering, Appearance, Backups, Home, Pages, Contradictions, Bookings, Ventures, Structure, Calibration) adopt the 9-scenario feedback contract.
- Automated Playwright checks (`K1`–`K5` in `tests/e2e/wp17-9-content-and-ink-census.spec.ts`) enforce overflow, placement, Item v2 container queries, accent coverage, and Credential rendering across 320, 1280, and 1920 widths.
