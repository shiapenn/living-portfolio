# Design Audit

---

### Role & Objective

Act as a Principal Design Systems Architect, Staff UX Engineer, and Senior Content Designer. Conduct an exhaustive, codebase-grounded diagnostic audit and architectural remediation of the target code package.

### Global Execution Constraints (Strict Enforcement)

1. **Strict MECE Separation:** Execute the audit across three mutually exclusive layers: **Layer 1: Behavioral & Flow Architecture (UX)**, **Layer 2: Visual, Token & Component System Architecture (UI)**, and **Layer 3: Semantic & Microcopy Architecture (Content)**. Never repeat findings across layers.
2. **Mandatory File-Path Grounding:** Every diagnosed issue, architectural gap, and remediation proposal MUST cite the exact relative file path (and line numbers or component/function names where applicable, e.g., `src/components/Button/Button.tsx:L42`). Do not provide generic advice detached from the repository.
3. **Diagnostic-to-Remediation Pairing:** For every issue uncovered, pair the **As-Is Diagnosis** (exact file path + root cause) with a **To-Be Remediation Blueprint** (target file path, refactored code/token structure, or file-tree migration).

---

### Layer 1: Behavioral & Interaction Architecture (Senior UX Architect)

**Scope:** Routing topology, state machines, task mechanics, and usability heuristics within the target package. (Exclude visual styling, tokens, and string wording).

1. **Route & Task Flow Completeness:** Trace all route definitions, navigation guards, and multi-step task flows inside the target code package. Identify dead ends, redundant steps, broken back-navigation, and unguarded state transitions.
2. **System State Coverage (Non-Happy Paths):** Audit every view and interactive module for missing or degraded system states: `loading` (skeletons/spinners), `empty` (zero-data), `error` (network/validation), `partial`, `offline`, and `permission-denied`.
3. **Interaction Mechanics & Accessibility:** Diagnose usability bottlenecks (cognitive load, Fitts's Law target sizing, focus trapping) and WCAG 2.2 AA gaps (ARIA roles, keyboard navigation tab-order, screen-reader announcements, and micro-interaction state triggers).
4. **Layer 1 Deliverable:** A **UX Diagnostic & Remediation Matrix** mapping `File Path` | `Flow/State Gap` | `UX Dimension Impacted` | `Concrete Code/Flow Fix`.

---

### Layer 2: Visual, Token & Component System Architecture (Principal UI / Systems Designer)

**Scope:** Aesthetic direction, token taxonomy, component hierarchy, responsive rules, and package file structure. (Build upon Layer 1 states; exclude flow logic and copywriting).

1. **Design Token Architecture (Foundations):** Audit all hardcoded values (hex codes, px values, magic numbers) across stylesheet and style-object files. Define a clean, three-tier token taxonomy (**Primitive $\rightarrow$ Semantic $\rightarrow$ Component-Specific**) covering:
    - **Color System:** Surface, text, border, and interactive states across light/dark/high-contrast themes.
    - **Typographic Scale:** Font families, fluid/modular size scales, line heights, letter spacing, and semantic text styles.
    - **Spatial & Surface Tokens:** Spacing grid, sizing scales, border radii, elevation/shadows, z-index layers, and motion/easing curves.
2. **Atomic Hierarchy & Component API Standardization:** Audit the package's UI hierarchy (**Elements $\rightarrow$ Components $\rightarrow$ Modules/Patterns $\rightarrow$ Page Templates**). Identify fragmented, duplicate, or overly coupled components. Standardize prop APIs, state variants, slot composition patterns, and strict usage constraints (Do's & Don'ts).
3. **Cross-Viewport & Input Adaptation:** Evaluate layout resilience across Desktop, Tablet, and Mobile browsers. Specify container queries, breakpoint rules, fluid grid adaptations, and touch- vs. pointer-target adjustments.
4. **Aesthetic Craft & Differentiation:** Identify opportunities to elevate visual polish beyond generic templates through subtle surface treatments, optical alignment, and choreographed micro-transitions.
5. **Package File Topology:** Propose an optimal, scalable directory structure (`tokens/`, `primitives/`, `components/`, `patterns/`, `layouts/`) showing exact file moves, renames, and clean barrel exports.
6. **Layer 2 Deliverable:**
    - **Hardcoded-to-Token Migration Table** (`File Path` | `Current Hardcoded Value` | `Proposed Semantic Token`).
    - **Target Package Directory Blueprint** (As-Is vs. To-Be file tree with refactoring specifications).

---

### Layer 3: Semantic & Microcopy Architecture (Senior Content Designer)

**Scope:** Domain taxonomy, interface strings, voice consistency, and recovery-oriented messaging. (Build upon Layer 1 flows and Layer 2 spatial constraints).

1. **Terminology Taxonomy & Consistency:** Audit all hardcoded strings and localization files (`i18n`/constants) within the target code package. Eliminate naming drift where identical objects or actions use conflicting labels across different files.
2. **Interface Microcopy Optimization:** Audit and rewrite CTAs, navigation labels, form labels/placeholders, empty-state prompts, and tooltips for maximum scannability, brevity, and action orientation.
3. **Actionable Error & Feedback Strings:** Rewrite all validation, toast, and system error messages so they clearly communicate *what failed*, *why*, and *the exact recovery action*.
4. **Layer 3 Deliverable:** A **File-Mapped Copy Audit Table** (`File Path & Key/Line` | `Current String` | `Optimized String` | `UX Writing Rationale`).