# Admin Content Standard

> Governed by [ADR-024](../adr/ADR-024-content-standard.md) (owner direction 2026-11-25: **remove rather than add**). Enforced on the rendered DOM by `tests/e2e/wp17-9-content-and-ink-census.spec.ts`.

## Core Principle

Remove rather than add. Every word on an admin screen must earn its place by clarifying an unfamiliar concept, specifying a format/range, or warning of a non-obvious consequence. Never explain what a heading or field label already states.

## Role Caps

| UI Role | Cap | Rule |
| --- | --- | --- |
| Page title | Noun | Concise noun (e.g. `Audit`, `Pages`, `Appearance`, `Settings`). |
| Page description | `<= 14` words (1 line) | Omit if the title is self-explanatory. **Omitted on Settings index.** |
| Settings index module summary | `<= 6` words | Describe purpose, not a field list (e.g. `Automatic replies and thresholds`). |
| Section description | `<= 16` words (1 sentence) | Optional; omit if heading and fields are self-explanatory. |
| Field helper | `<= 12` words | Only for format, unit, range, or consequence. Never restate the label or repeat a default value. |
| Empty state | `<= 12` words (1 sentence) | Plus optional single action. No raised surface, no indent (`D4`). |
| Notice | `<= 2` sentences | Concise warning, error, or confirmation. |
| Button | `<= 2` words | Verb + object, sentence case (e.g. `Save`, `Run check`, `Import pack`). |
| Default route static prose budget | `<= 60` words | Sum of static prose across description, section description, helper, empty, and notice roles (shrinking-only; max 3 recorded exemptions). |

## Superseding Rule on Explain Blocks

All `"How X works"` sections and `"What it does / When to change / Impact"` labels are retired (superseding the 2026-11-06 audit report §6 rule 2). Where a setting has a non-obvious consequence, express it in a single consequence sentence (`<= 20` words) as the page description or as a `Notice`.

## Banned Patterns in Rendered Text

The following must **never** appear in rendered admin DOM text:
- JavaScript coercion leaks: `[object Object]`, `undefined`, `null`, `NaN`
- Internal planning/spec references: `WP-\d`, `ADR-\d`, `<hash>`
- Awkward parenthetical plurals: `(s)`
- Implementation artifacts: source/asset filenames (`.css`, `.ts`, `.json`), API paths (`/api/...`), raw internal IDs
