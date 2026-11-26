# Admin Feedback Placement & Timing

> Governed by [ADR-025](../adr/ADR-025-feedback-placement-and-timing.md) (`R-025-1`..`R-025-4`). Enforced by `tests/e2e/wp17-9-content-and-ink-census.spec.ts` (`K2`).

## Core Principle

**No toasts in admin.** Feedback appears in a deterministic place relative to the control or section that caused it, never shifts the trigger button out from under the pointer, never auto-dismisses errors, and never dumps raw validator output.

## Closed Scenario Table (9 Scenarios)

| # | Scenario | Component & Placement | Live Region / Focus | Clearing Rule |
| --- | --- | --- | --- | --- |
| 1 | **Field invalid** (client or server, single field) | Inline error text under that field, replacing its helper | `aria-invalid="true"` + `aria-describedby`; focus first invalid field on submit | Clears on next input/change to that field |
| 2 | **Action error** (single or cross-field) | `Notice` (`danger`, full container width) in the **same section** as trigger, directly **below** the section's `ActionBar` (no layout shift of button) | `role="alert"` / `aria-live="assertive"`, scrolled into view | Never auto-dismisses; clears on next edit or retry |
| 3 | **Action success without follow-up** (Save, Restore, Import ok) | `StatusLine` directly **below** the `ActionBar` (`"Saved"`, `"Imported"`); **never** a green `Notice` | `aria-live="polite"` | Clears when form becomes dirty again |
| 4 | **Success with secret to keep** (TOTP key, recovery codes, API token) | Warning `Notice` (`"Shown once. Save it now."`) + `Credential` (`single` or `list`) in the trigger's section | `aria-live="polite"` on Copy `StatusLine` (`"Copied"`) | Persists until navigation or next generation |
| 5 | **State-derived warning** (e.g. threshold drift from recommended) | `Notice` (`warn`, full container width) directly **above** the `ActionBar` of the controls it concerns | Updates live as values change (not tied to submit) | Disappears immediately when state returns to recommended |
| 6 | **Destructive or irreversible confirmation** | Existing `Overlay` dialog (`role="dialog"`, `aria-modal="true"`) | Focus moves to dialog primary/cancel control; Escape cancels | Closes on confirm, cancel, or Escape |
| 7 | **Page-level failure** (load, permission, network, expired session) | `Notice` (`danger`, full container width) at the **top of `<main>`** with `Retry` (only page-top use) | `role="alert"` / `aria-live="assertive"` | Clears on retry |
| 8 | **In progress** | Trigger button disables, shows `"Saving…"` / `"Checking…"`, `aria-busy="true"` on section within 100 milliseconds; if wait > 1 s add `StatusLine` | `aria-busy="true"` on section | Restores on settle |
| 9 | **Empty or idle** | `EmptyState` (`D4`: no raised surface, no indent, `<= 12` words + optional action) | `aria-live="polite"` on dynamic region transitions | Replaced when items arrive |

## Server Validation Error Mapping

- Map server validation errors into short copy: **at most 3 lines**, each **at most 12 words**, rendered as a list inside one `Notice` (or inline on a single invalid field).
- If more than 3 errors exist, append `"and N more"`.
- Never expose raw validator dumps, stack traces, or internal field paths.

## Width & Geometry

- Every `Notice` spans full container width (`width: 100%; box-sizing: border-box;`, verified within one pixel of its parent section/container width).
- Action errors and success `StatusLine`s sit **below** the `ActionBar` so the button never shifts during click.
