# Changesets for Design System Packages

Every PR that modifies `@living-portfolio/design-tokens`, `@living-portfolio/ui-core`,
`@living-portfolio/ui-admin`, or `@living-portfolio/ui-public` must include a changeset
markdown file in `.changeset/<slug>.md` with YAML front matter:

```markdown
---
"@living-portfolio/design-tokens": minor
"@living-portfolio/ui-public": minor
---

Short summary of the change and any migration notes.
```

Run `pnpm ds:changelog` to regenerate per-package `CHANGELOG.md` files from `.changeset/*.md`.
Verified in CI via `node scripts/verify-changeset`.
