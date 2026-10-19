## Purpose

<!-- Describe what this change does and why. -->

## Linked Audit Finding or OSR Task IDs

<!-- Reference permanent IDs from docs/audits/register.yml (e.g., S1, G5, OSR-02). -->
- Finding / Task IDs: 

## Tests Added or Updated

<!-- Every fixed finding or closed OSR task requires a passing test or CI check (AUD-14). -->
- [ ] Unit / integration / conformance test added or updated: `path/to/test.ts`
- [ ] `pnpm build && pnpm test && pnpm audit:check` passes locally

## Security-Sensitive Paths Check (`CODEOWNERS`)

- [ ] Does this PR touch paths in `CODEOWNERS` (`/apps/api/src/auth/`, `/packages/ai/src/governor/`, `/packages/db/`, `/packages/config/`, `/scripts/`, `/.github/`)?
- [ ] If yes, `security-review` label applied and authorization/visibility/redaction invariants verified.

## Developer Certificate of Origin (DCO) Confirmation

- [ ] I certify that this contribution complies with the [Developer Certificate of Origin 1.1](../DCO) and every commit includes a `Signed-off-by: Full Name <email>` trailer (`git commit -s`).
