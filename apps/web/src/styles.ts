/**
 * §12 UI Design System — Strata CSS Custom Properties, Typography, and Layout Rules
 */
export const STRATA_DESIGN_SYSTEM_CSS = `
:root {
  /* §12.3 Semantic Tokens (Light Mode Default) */
  --surface-page: #F3F5F4;
  --surface-raised: #FFFFFF;
  --text: #14202A;
  --text-muted: #4B5A66;
  --rule: #CBD3D8;
  --accent: #3A4FD0;
  --focus-ring: #3A4FD0;
  --role-goal: #2F5FA8;
  --role-approach: #5A5F6B;
  --role-friction: #9A6A00;
  --role-decision: #5B3FA0;
  --role-outcome: #1F7A5A;
  --role-lesson: #A13A6B;
  --status-warn: #8A5A00;
  --status-error: #B42318;

  /* §12.3 Spacing Scale (4px base) */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-6: 24px;
  --space-8: 32px;
  --space-12: 48px;
  --space-18: 72px;

  /* §12.3 Radii by role */
  --radius-chip: 2px;
  --radius-control: 6px;
  --radius-overlay: 12px;

  /* §12.4 Typography */
  --font-reading: 'Literata', Georgia, 'Times New Roman', serif;
  --font-ui: 'Atkinson Hyperlegible Next', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-code: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --surface-page: #0F1A22;
    --surface-raised: #16232D;
    --text: #E6ECEF;
    --text-muted: #A3B2BD;
    --rule: #2A3946;
    --accent: #9AA8FF;
    --focus-ring: #9AA8FF;
    --role-goal: #8DB4EA;
    --role-approach: #B4B9C4;
    --role-friction: #E2B34A;
    --role-decision: #B9A4EE;
    --role-outcome: #6FCBA3;
    --role-lesson: #EE9CC2;
    --status-warn: #F5C451;
    --status-error: #F97066;
  }
}

:root[data-theme="dark"] {
  --surface-page: #0F1A22;
  --surface-raised: #16232D;
  --text: #E6ECEF;
  --text-muted: #A3B2BD;
  --rule: #2A3946;
  --accent: #9AA8FF;
  --focus-ring: #9AA8FF;
  --role-goal: #8DB4EA;
  --role-approach: #B4B9C4;
  --role-friction: #E2B34A;
  --role-decision: #B9A4EE;
  --role-outcome: #6FCBA3;
  --role-lesson: #EE9CC2;
  --status-warn: #F5C451;
  --status-error: #F97066;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  background-color: var(--surface-page);
  color: var(--text);
  font-family: var(--font-ui);
  font-size: 16px;
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
}

/* §12.2 Accessible visible focus */
:focus-visible {
  outline: 2px solid var(--focus-ring);
  outline-offset: 2px;
}

a {
  color: var(--accent);
  text-decoration: underline;
  text-underline-offset: 3px;
}

/* Header & Navigation */
.site-header {
  border-bottom: 1px solid var(--rule);
  background: var(--surface-page);
  padding: var(--space-4) var(--space-6);
}

.site-nav {
  max-width: 1180px;
  margin: 0 auto;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
}

.site-brand {
  font-family: var(--font-reading);
  font-weight: 700;
  font-size: 21px;
  color: var(--text);
  text-decoration: none;
}

.nav-links {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-4);
}

.nav-links a {
  color: var(--text);
  text-decoration: none;
  font-size: 16px;
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-control);
}

.nav-links a:hover,
.nav-links a[aria-current="page"] {
  color: var(--accent);
  text-decoration: underline;
}

.theme-toggle-btn {
  background: var(--surface-raised);
  color: var(--text);
  border: 1px solid var(--rule);
  border-radius: var(--radius-control);
  padding: var(--space-1) var(--space-3);
  cursor: pointer;
  font-family: var(--font-ui);
  font-size: 14px;
  min-height: 36px;
}

/* Main container */
.site-main {
  max-width: 1180px;
  margin: 0 auto;
  padding: var(--space-8) var(--space-6) var(--space-18);
}

/* §12.4 Reading Measure & Typography */
.reading-column {
  font-family: var(--font-reading);
  font-size: 18px;
  line-height: 1.65;
  max-width: 68ch;
}

.owner-statement {
  font-family: var(--font-reading);
  font-size: 25px;
  line-height: 1.4;
  font-weight: 500;
  max-width: 64ch;
  margin: 0 0 var(--space-8) 0;
}

/* §12.6 Strata Timeline — the one bold element */
.strata-section {
  background: var(--surface-raised);
  border: 1px solid var(--rule);
  padding: var(--space-6);
  margin-bottom: var(--space-8);
}

.strata-header {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
}

.as-of-banner {
  background: var(--surface-page);
  border-left: 3px solid var(--accent);
  padding: var(--space-2) var(--space-4);
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  margin-bottom: var(--space-4);
}

.strata-layers {
  display: flex;
  align-items: flex-end;
  gap: var(--space-2);
  min-height: 120px;
  padding: var(--space-4) 0 var(--space-2);
  border-bottom: 2px solid var(--rule);
  overflow-x: auto;
}

.strata-band {
  flex: 1;
  min-width: 56px;
  background: var(--surface-page);
  border: 1px solid var(--rule);
  border-top: 4px solid var(--accent);
  padding: var(--space-2);
  cursor: pointer;
  text-align: left;
  color: var(--text);
  border-radius: var(--radius-chip);
}

.strata-band[data-dimmed="true"] {
  opacity: 0.35;
}

.strata-band:hover,
.strata-band:focus-visible {
  border-color: var(--accent);
  background: var(--surface-raised);
}

.strata-legend {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-4);
  margin-top: var(--space-3);
  font-size: 14px;
  color: var(--text-muted);
}

/* Plain Entry List (§12.1: avoids card grids) */
.entry-list {
  list-style: none;
  padding: 0;
  margin: 0;
  border-top: 1px solid var(--rule);
}

.entry-row {
  padding: var(--space-4) 0;
  border-bottom: 1px solid var(--rule);
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.entry-row-top {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-3);
}

.entry-title-link {
  font-family: var(--font-reading);
  font-size: 21px;
  font-weight: 600;
  color: var(--text);
  text-decoration: none;
}

.entry-title-link:hover {
  color: var(--accent);
  text-decoration: underline;
}

.entry-meta {
  font-size: 14px;
  color: var(--text-muted);
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
  align-items: center;
}

/* Chips & Markers (2px radius per §12.3) */
.chip {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: 2px var(--space-2);
  font-size: 13px;
  border: 1px solid var(--rule);
  border-radius: var(--radius-chip);
  background: var(--surface-raised);
  color: var(--text);
}

.chip.active, a.chip.active {
  border-color: var(--accent);
  font-weight: 600;
  background: var(--surface-raised);
}

/* §12.2 & §12.7 Machine-suggested items: dashed outline + "suggested" label */
.chip-suggested {
  border-style: dashed;
  border-color: var(--text-muted);
  color: var(--text-muted);
}

.role-marker {
  display: inline-block;
  padding: 2px var(--space-2);
  font-size: 13px;
  font-weight: 600;
  border-radius: var(--radius-chip);
  border-left: 3px solid var(--accent);
  background: var(--surface-raised);
}

.role-goal { border-left-color: var(--role-goal); }
.role-approach { border-left-color: var(--role-approach); }
.role-friction { border-left-color: var(--role-friction); }
.role-decision { border-left-color: var(--role-decision); }
.role-outcome { border-left-color: var(--role-outcome); }
.role-lesson { border-left-color: var(--role-lesson); }

/* §5.3 & §12.5 Entry Layout with Margin Rail at >=1024px */
.entry-layout {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-8);
}

@media (min-width: 1024px) {
  .entry-layout {
    grid-template-columns: minmax(0, 68ch) 320px;
    align-items: start;
  }
}

.margin-rail {
  border-top: 1px solid var(--rule);
  padding-top: var(--space-4);
  font-size: 14px;
}

@media (min-width: 1024px) {
  .margin-rail {
    border-top: none;
    border-left: 1px solid var(--rule);
    padding-top: 0;
    padding-left: var(--space-6);
  }
}

/* §5.3 Later-thinking banner */
.later-thinking-banner {
  border: 1px solid var(--status-warn);
  border-left: 4px solid var(--status-warn);
  background: var(--surface-raised);
  padding: var(--space-3) var(--space-4);
  margin: var(--space-6) 0;
  font-size: 15px;
}

/* §12.6 Ask Surface */
.ask-box {
  background: var(--surface-raised);
  border: 1px solid var(--rule);
  padding: var(--space-6);
  margin-top: var(--space-6);
}

.ask-input-row {
  display: flex;
  gap: var(--space-2);
  margin-top: var(--space-3);
}

.ask-input {
  flex: 1;
  padding: var(--space-3);
  font-size: 16px;
  font-family: var(--font-ui);
  border: 1px solid var(--rule);
  border-radius: var(--radius-control);
  background: var(--surface-page);
  color: var(--text);
}

.btn {
  padding: var(--space-2) var(--space-4);
  font-size: 15px;
  font-family: var(--font-ui);
  font-weight: 600;
  border-radius: var(--radius-control);
  border: 1px solid var(--accent);
  background: var(--accent);
  color: var(--surface-raised);
  cursor: pointer;
  min-height: 40px;
}

.btn-secondary {
  background: var(--surface-raised);
  color: var(--text);
  border-color: var(--rule);
}

/* §12.5 & §12.6 Admin 3-Pane Workspace */
.admin-shell {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-6);
}

@media (min-width: 1024px) {
  .admin-shell {
    grid-template-columns: 240px 1fr 340px;
    align-items: start;
  }
}

.admin-pane {
  background: var(--surface-raised);
  border: 1px solid var(--rule);
  padding: var(--space-4);
}

.level-steps {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-1);
  margin: var(--space-3) 0;
}

.level-step {
  padding: var(--space-1) var(--space-2);
  font-size: 12px;
  text-align: center;
  border: 1px solid var(--rule);
  border-radius: var(--radius-chip);
  color: var(--text-muted);
}

.level-step[data-active="true"] {
  border-color: var(--accent);
  color: var(--text);
  font-weight: 700;
  background: var(--surface-page);
}

/* §12.6 Inspector Tabs & Panels */
.inspector-tabs {
  display: flex;
  gap: var(--space-1);
  border-bottom: 1px solid var(--rule);
  margin-bottom: var(--space-3);
  overflow-x: auto;
}

.inspector-tab-btn {
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  padding: var(--space-2) var(--space-3);
  font-size: 13px;
  font-weight: 600;
  color: var(--text-muted);
  cursor: pointer;
  white-space: nowrap;
}

.inspector-tab-btn[aria-selected="true"],
.inspector-tab-btn.active {
  color: var(--accent);
  border-bottom-color: var(--accent);
}

.inspector-tab-panel {
  display: none;
}

.inspector-tab-panel.active {
  display: block;
}

/* §12.6 Import Triage Stepper & Keys */
.triage-stepper {
  display: flex;
  gap: var(--space-2);
  margin-bottom: var(--space-4);
  border-bottom: 1px solid var(--rule);
  padding-bottom: var(--space-2);
}

.triage-step {
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-chip);
  font-size: 13px;
  font-weight: 600;
  color: var(--text-muted);
  background: var(--surface-page);
}

.triage-step.active {
  background: var(--accent);
  color: var(--surface-raised);
}

.triage-keys-legend {
  display: flex;
  gap: var(--space-3);
  align-items: center;
  flex-wrap: wrap;
  padding: var(--space-2) var(--space-3);
  background: var(--surface-page);
  border: 1px solid var(--rule);
  border-radius: var(--radius-control);
  font-size: 13px;
  margin-bottom: var(--space-3);
}

.key-badge {
  display: inline-block;
  padding: 1px 6px;
  font-size: 11px;
  font-family: var(--font-code);
  font-weight: 700;
  background: var(--surface-raised);
  border: 1px solid var(--rule);
  border-radius: var(--radius-chip);
  box-shadow: 0 1px 0 rgba(0,0,0,0.1);
  color: var(--text);
}

.triage-card {
  border: 1px solid var(--rule);
  border-radius: var(--radius-control);
  padding: var(--space-3);
  margin-bottom: var(--space-2);
  background: var(--surface-raised);
  transition: border-color 0.15s ease;
}

.triage-card.selected {
  border-color: var(--accent);
  box-shadow: 0 0 0 2px var(--focus-ring);
}

.triage-card.status-accepted {
  border-left: 4px solid var(--role-outcome);
}

.triage-card.status-skipped {
  opacity: 0.5;
  border-left: 4px solid var(--text-muted);
}

/* Accessibility Skip Link (UX-15) */
.skip-link {
  position: absolute;
  top: -60px;
  left: var(--space-2);
  background: var(--surface-raised);
  color: var(--accent);
  padding: var(--space-2) var(--space-4);
  z-index: 1000;
  text-decoration: none;
  font-weight: 700;
  border: 2px solid var(--accent);
  border-radius: var(--radius-control);
  transition: top 0.15s ease;
}

.skip-link:focus {
  top: var(--space-2);
  outline: 2px solid var(--focus-ring);
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
`;
