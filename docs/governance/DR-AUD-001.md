# Living Portfolio: Audit Tracking Requirements (DR-AUD)

| Field | Value |
| --- | --- |
| Document ID | DR-AUD-001 |
| Version | 1.0 |
| Date | 19 October 2026 |
| Addressee | A (implementer) |
| Accompanies | *Living Portfolio Independent Technical Audit* (audit AUD-2026-10-19) |
| Governing spec | [`docs/spec/The_Living_Portfolio_Open_Source_Spec.md`](../spec/The_Living_Portfolio_Open_Source_Spec.md) |

The key words MUST, MUST NOT, SHOULD and MAY are used as in RFC 2119.

---

## 1. Purpose

This document defines where audit records live in the repository and how they are structured, tracked and closed. Its aim is that every finding, fix and re-audit stays traceable in one place for the life of the project.

## 2. Normative basis

These are **derived requirements**. They follow from the spec but are not stated verbatim in it.

| Spec reference | What it contributes |
| --- | --- |
| §19 | Documentation lives under `docs/`, with a defined documentation set. `docs/` does not yet exist in the repository. |
| §0, principle 2 | Honesty is the invariant: history is preserved and nothing unconfirmed poses as fact. Audit history is therefore append-only. |
| §18.1–§18.2 | Claims about quality must be backed by tests and an evaluation harness. Findings close only on test evidence. |
| §20 | Release exit criteria. Audit status gates releases. |
| §2 | Governance and RFC process. Used here to amend §19. |

**Gap.** §19 does not list an audits directory. Requirement AUD-01 is therefore a derived requirement, and §10 of this document proposes the §19 amendment that makes it explicit.

## 3. Definitions

- **Audit:** one dated, independent review of the code against the spec.
- **Finding:** one defect or gap, with a permanent ID.
- **Register:** the cumulative record of all findings across all audits.
- **Conformance table:** the per-spec-section status record.
- **Simulated code:** code that returns or reports a result without performing the real operation.

## 4. Required repository layout

**AUD-01.** The repository MUST contain `docs/audits/`, created by the first audit.

**AUD-02.** The layout MUST be:

```
docs/
  spec/
    The_Living_Portfolio_Open_Source_Spec.md
  execution-reports/
    A001.md
  audits/
    README.md
    register.yml
    conformance.yml
    2026-10-19-independent-technical-audit/
      report.md
      findings.snapshot.yml
      repro/
```

**AUD-03.** Each audit MUST have its own subfolder named `YYYY-MM-DD-<slug>`. Files inside a closed audit folder MUST NOT be edited, except to correct typos with a dated note.

**AUD-04.** `register.yml` and `conformance.yml` MUST sit above the dated folders, because they span all audits.

**AUD-05.** `docs/audits/README.md` MUST state the status legend, the ID rules, and how to open a new audit.

**AUD-06.** The spec file SHOULD move to `docs/spec/` so section references have a stable path. If it does, `README.md` and all links MUST be updated in the same change.

## 5. Finding records

**AUD-07.** Every finding MUST have a permanent ID that is never reused. For AUD-2026-10-19 the IDs are those in the report: S1–S7, G1–G8, B1–B4, P1–P6, F1–F4. Later audits MUST use a prefix that includes the audit date to avoid collisions (for example `2027Q1-S1`).

**AUD-08.** `register.yml` MUST contain one entry per finding with these fields:

```yaml
- id: S1
  audit: AUD-2026-10-19
  title: No authentication or authorization
  spec_sections: ["3.11", "15"]
  severity: P0            # P0 | P1 | P2 | P3
  status: open            # open | in-progress | fixed | accepted-risk | wont-fix
  owner: A
  links:
    issue: null
    pr: null
  regression_test: null   # path, required before status can be fixed
  history:
    - { date: 2026-10-19, status: open, note: "Raised by audit" }
```

**AUD-09.** The history list MUST be append-only. A status change adds an entry and never edits an earlier one.

**AUD-10.** `accepted-risk` and `wont-fix` MUST include a written rationale and the name of the person who approved it.

## 6. Conformance table

**AUD-11.** `conformance.yml` MUST contain one row per spec section (§0–§21) with: current status (`implemented`, `partial`, `stub`, `missing`, `misleading`, `non-conformant`, `deviates`), the finding IDs that explain it, and the date last scored.

**AUD-12.** The matrix in each audit report MUST be a snapshot of this file at the audit date. Later changes go in `conformance.yml`, not in the old report.

**AUD-13.** A section MAY be scored `implemented` only when its finding IDs are all `fixed` and each has a passing regression test.

## 7. Closing findings

**AUD-14.** A finding MUST NOT move to `fixed` unless its `regression_test` field names a test file that exists and passes in CI.

**AUD-15.** The probes in `repro/` MUST be promoted into regression tests, for example under `apps/api/src/conformance/`. Each probe covering a P0 finding becomes a test that fails today and must pass before closure.

**AUD-16.** Every P0 finding MUST be `fixed` or `accepted-risk` before any release tag. Every P1 finding MUST be resolved or scheduled before v0.2.

## 8. Simulated code and honest reporting

**AUD-17.** Simulated code MUST be marked in source with `SIMULATED(<finding-id>)` in a comment.

**AUD-18.** A route or job containing simulated code MUST NOT report success. Until the real implementation exists it MUST return `501 Not Implemented` (routes) or throw a not-implemented error (jobs). This applies at minimum to: `/api/settings/evaluation`, `/api/settings/backups/run-drill`, the worker backup job, the calibration parameters endpoint, and the federation manifest's credential claims.

**AUD-19.** CI MUST fail if a `SIMULATED(...)` marker is reachable from a public route without returning `501`.

**AUD-20.** Every execution report (A001 and successors) MUST tag each statement as `implemented`, `simulated` or `not-started`, and MUST link to the finding IDs it affects.

## 9. CI gates and cadence

**AUD-21.** A script (`scripts/audit-check`) MUST run in CI and verify that: the register and conformance files parse; every `fixed` finding has an existing test file; no P0 is `open` on a tagged release; and no entry in a closed audit folder changed.

**AUD-22.** A new dated audit MUST be run for each minor release (v0.1 through v0.5) and before v1.0. It re-scores `conformance.yml` and appends findings to `register.yml`.

**AUD-23.** `README.md` MUST link to `docs/audits/README.md`. `SECURITY.md` SHOULD link to the security findings (S-series).

## 10. Proposed amendment to spec §19

Submit through the §2 RFC process. Proposed addition to the §19 documentation set:

> `docs/audits/` (dated audit reports, the cumulative findings register, and the spec-conformance table, per DR-AUD-001). `docs/execution-reports/` (implementation reports, each statement tagged implemented, simulated or not-started). `docs/spec/` (the versioned specification).

## 11. Deliverables to A

A MUST receive, and acknowledge, these two documents together:

1. *Living Portfolio Independent Technical Audit* (findings, matrix, 26 prioritized fixes).
2. This document, DR-AUD-001.

## 12. Acceptance criteria for A's first response

| # | Criterion |
| --- | --- |
| 1 | `docs/audits/` exists with the layout in AUD-02, and the audit report is committed under its dated folder. |
| 2 | `register.yml` contains all 26 audit fixes mapped to their finding IDs, each with owner and status. |
| 3 | `conformance.yml` matches the audit matrix. |
| 4 | A002 (the re-issued execution report) tags every statement per AUD-20. |
| 5 | Fabricated endpoints return `501` per AUD-18, with `SIMULATED(...)` markers in source. |
| 6 | The P0 probes exist as failing regression tests. |
| 7 | `scripts/audit-check` runs in CI. |

## 13. Traceability to the audit

| Audit item | Requirements that govern it |
| --- | --- |
| Fabricated results (audit §2, finding 2) | AUD-17 to AUD-19 |
| P0 fixes 1–8 | AUD-14 to AUD-16 |
| A001 overstatements (audit §3) | AUD-20 |
| Missing `docs/` set (spec §19) | AUD-01, AUD-06, §10 |
| Release gating (spec §20) | AUD-16, AUD-22 |
