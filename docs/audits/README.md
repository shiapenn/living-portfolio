# Living Portfolio — Audit Tracking & Conformance Register

This directory maintains the append-only technical audit history, cumulative findings register, and specification-conformance table for **The Living Portfolio**, governed by [`DR-AUD-001`](../governance/DR-AUD-001.md) and [`The_Living_Portfolio_Open_Source_Spec.md`](../spec/The_Living_Portfolio_Open_Source_Spec.md).

---

## 1. Directory Layout (`AUD-02` – `AUD-04`)

```text
docs/
  spec/
    The_Living_Portfolio_Open_Source_Spec.md
  governance/
    DR-AUD-001.md
  plans/
    remediation-plan-AUD-2026-10-19.md
    osr-001-open-source-release.md
  execution-reports/
    A001.md
    A002.md
    OSR-05-clean-tree-and-rotation.md
  audits/
    README.md
    register.yml
    conformance.yml
    hardcode-inventory.md
    2026-10-19-independent-technical-audit/
      report.md
      findings.snapshot.yml
      repro/
        p0-probes.ts
```

- **Repository History Baseline (`OSR-05` §3.1):** Repository history begins at `baseline-B0` (recorded **19 October 2026**). Earlier prototype history is archived privately offline.
- **`register.yml`**: Cumulative record of all findings (`S*`, `G*`, `B*`, `P*`, `F*`, `M*`) and open-source readiness tasks (`OSR-*`) across all audits (`AUD-08`). Each entry includes `verified_by` (`null` until independently verified by the auditor after re-audit).
- **`conformance.yml`**: Per-spec-section (`§0`–`§21`) conformance status (`AUD-11`).
- **`YYYY-MM-DD-<slug>/`**: Immutable snapshot folder for each dated audit (`AUD-03`). Files inside a closed audit folder **MUST NOT** be edited, except to correct typos with a dated note.

---

## 2. Status Legend (`AUD-05`, `AUD-08`, `AUD-11`)

### 2.1 Finding Status (`register.yml`)

| Status | Meaning | Closure / Governance Rule |
| --- | --- | --- |
| `open` | Defect or gap confirmed by audit and not yet resolved. | Default initial state. Every `P0` finding has a failing regression probe. |
| `in-progress` | Active remediation underway. | History entry appended with owner and target PR/branch. |
| `fixed` | Defect resolved and verified by automated regression test. | **MUST** set `regression_test` to an existing test file that passes in CI (`AUD-14`). |
| `accepted-risk` | Risk consciously accepted for current milestone. | **MUST** include written `rationale` and `approved_by` (`AUD-10`). |
| `wont-fix` | Finding declined with architectural rationale. | **MUST** include written `rationale` and `approved_by` (`AUD-10`). |

### 2.2 Severity Levels (`register.yml`)

- **`P0`**: Critical security, privacy, honesty, or deployability blocker. **MUST** be `fixed` or `accepted-risk` before any release tag (`AUD-16`).
- **`P1`**: Specification-correctness defect. **MUST** be resolved or scheduled before `v0.2` (`AUD-16`).
- **`P2`**: Feature completeness gap for `v0.2`–`v0.3`.
- **`P3`**: Project hygiene, governance files, documentation, and extended test suites.

### 2.3 Specification Conformance Status (`conformance.yml`)

| Status | Meaning |
| --- | --- |
| `implemented` | Meets the specification text; all linked finding IDs are `fixed` with passing regression tests (`AUD-13`). |
| `partial` | Core logic exists and works in part, but has defects or gaps documented by linked findings. |
| `stub` | Placeholder or simulated implementation. |
| `missing` | No implementation code or required artifact exists yet. |
| `misleading` | Code previously reported fabricated or unverified results as real (must return `501` with `SIMULATED(<id>)` per `AUD-17`–`AUD-19` until implemented). |
| `non-conformant` | Implementation violates a normative security, privacy, or honesty invariant. |
| `deviates` | Deliberate or unrecorded stack/format deviation from the specification requiring remediation or an ADR. |

---

## 3. Finding ID Rules (`AUD-07`)

1. **Permanent & Never Reused:** Every finding receives a permanent ID that is never reused or reassigned.
2. **Baseline Audit (`AUD-2026-10-19`):**
   - Uses the report's §5 category IDs:
     - **`S1`–`S7`**: Security and privacy
     - **`G1`–`G8`**: Ask correctness and safety
     - **`B1`–`B4`**: Budget governor
     - **`P1`–`P6`**: Persistence and pipeline
     - **`F1`–`F4`**: Frontend and operations
   - Uses **`M1`–`M11`** (Matrix / Headline findings) for the remaining gaps identified in §2, §3, §4, and §7 Fixes `#3` and `#12`–`#26` that did not carry a letter-number code in §5, ensuring 100% bidirectional traceability across all 29 §5 findings and all 26 prioritized fixes (`Fix 1`–`Fix 26`).
3. **Subsequent Audits (`AUD-07`, `AUD-22`):**
   - Later audits **MUST** prefix every finding ID with the audit date/quarter identifier to prevent collisions (for example: `2027Q1-S1`, `2027-01-15-G1`).

---

## 4. Simulated Code Policy (`AUD-17` – `AUD-19`)

- Any simulated or placeholder code **MUST** carry a source comment `// SIMULATED(<finding-id>)`.
- Any HTTP route containing `SIMULATED(...)` **MUST** return `501 Not Implemented` (and any worker job **MUST** throw a not-implemented error) until the real implementation is complete (`AUD-18`).
- CI fails via `scripts/audit-check` if any `SIMULATED(...)` marker is reachable from a route without returning `501` (`AUD-19`).

---

## 5. How to Open a New Audit (`AUD-05`, `AUD-22`)

A new dated audit **MUST** be run for each minor release (`v0.1` through `v0.5`) and prior to `v1.0`:

1. Create a new immutable subfolder `docs/audits/YYYY-MM-DD-<slug>/` containing:
   - `report.md` (dated independent review)
   - `findings.snapshot.yml` (point-in-time snapshot of findings opened in the audit)
   - `repro/` (reproducible probe scripts)
2. Assign permanent prefixed IDs (`YYYY-MM-DD-<category><number>` or `YYYYQ<N>-<category><number>`) to all new findings.
3. Append new findings to `docs/audits/register.yml` with initial `history` entries (`AUD-08`, `AUD-09`). Never delete or overwrite prior history entries.
4. Re-score `docs/audits/conformance.yml` with updated `status`, `findings`, and `last_scored` date (`AUD-11`–`AUD-13`).
5. Promote `repro/` scripts for any new `P0` findings into regression tests under `apps/api/src/conformance/` (`AUD-15`).
6. Register the closed audit folder's file checksums in `scripts/audit-check` and verify all checks pass via `pnpm audit:check`.
