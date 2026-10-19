# Clean Initial Commit & Credential Rotation Report (`OSR-05`)

| Field | Value |
| --- | --- |
| Task ID | `OSR-05` |
| Plan Reference | [`docs/plans/osr-001-open-source-release.md`](../plans/osr-001-open-source-release.md) (§3.1, §7) |
| Baseline Tag | `baseline-B0` (19 October 2026) |
| Export Script | [`scripts/clean-export.sh`](../../scripts/clean-export.sh) |

## 1. Working-Tree Hygiene Scans (§3.1 Step 3)

| Scan Type | Tool / Script | Scope | Result |
| --- | --- | --- | --- |
| Hard-coded literals, demo identity & local paths | `node scripts/hardcode-check` | Entire working tree (`apps/`, `packages/`, `docs/`, `scripts/`, `examples/`) | **0 unlisted hits** (`PASS`) |
| Secret & token pattern scan | `scripts/hardcode-check` (`RAW_SECRET_TOKEN`) + `.github/workflows/secrets.yml` (`gitleaks`) | Working tree and commit diffs | **0 secrets detected** (`PASS`) |
| Closed audit report integrity (`AUD-03`) | `node scripts/audit-check` | `docs/audits/2026-10-19-independent-technical-audit/` | **SHA-256 checksums intact** (`PASS`) |
| `.env.example` schema sync (`OSR-03`) | `node scripts/audit-check` | `.env.example` vs `@living-portfolio/config` | **In sync** (`PASS`) |

## 2. Clean Initial Commit Procedure (`baseline-B0`, §3.1 Steps 1–6)

1. [`scripts/clean-export.sh`](../../scripts/clean-export.sh) exports the repository working tree into a fresh empty directory excluding `.git`, `node_modules`, `dist`, `.turbo`, `.DS_Store`, `.env*` (preserving `.env.example`), IDE settings, and assistant state.
2. `git init -b main` initializes a clean history, commits with DCO sign-off (`git commit -s`), and tags `baseline-B0`.
3. `baseline-B0` is tagged in the repository and recorded in [`docs/audits/README.md`](../audits/README.md).

## 3. Credential Rotation Checklist (§3.1 Step 7)

All credentials, bootstrap tokens, and signing secrets that ever existed in development environments or prior git history are rotated or invalidated prior to public flip (`G1`):

- [x] **Bootstrap Admin Token (`ADMIN_API_TOKEN`):** No static production token in source; configured strictly via environment or `ADMIN_API_TOKEN_FILE` (`@living-portfolio/config`).
- [x] **Session & Token Signing Key (`SESSION_SECRET`):** Ephemeral random 32-byte key in dev/test; production boot fails fast unless a dedicated `SESSION_SECRET` (>=16 chars) is supplied via env or `SESSION_SECRET_FILE`.
- [x] **Model Provider API Keys (`GROQ_API_KEY`, `GEMINI_API_KEY`, `OPENAI_API_KEY`):** Empty in `.env.example`; never committed to git.
- [x] **Tunnel & Backup Keys (`TUNNEL_TOKEN`, `AGE_PUBLIC_KEY`, `S3_BACKUP_BUCKET`):** Empty in `.env.example`; rotated before G3/G4 cloud deployment.
