import { THEME_CSS } from './tokens/index.js';

/**
 * §12 UI Design System — Strata CSS Custom Properties, Typography, Component Layer, and Layout Rules
 */
export const STRATA_DESIGN_SYSTEM_CSS = `
${THEME_CSS}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  background-color: var(--surface-page);
  color: var(--text);
  font-family: var(--font-ui);
  font-size: var(--text-ui-size, 16px);
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

/* §12.4 Semantic Typography Scale (Finding 20261020-UI-02) */
.text-display {
  font-family: var(--font-reading);
  font-size: var(--font-size-5, 25px);
  font-weight: 500;
  line-height: 1.4;
}

.text-h1 {
  font-family: var(--font-reading);
  font-size: var(--font-size-6, 30px);
  font-weight: 600;
  line-height: 1.25;
}

.text-h2 {
  font-family: var(--font-reading);
  font-size: var(--font-size-4, 21px);
  font-weight: 600;
  line-height: 1.3;
}

.text-h3 {
  font-family: var(--font-reading);
  font-size: var(--font-size-3, 18px);
  font-weight: 600;
  line-height: 1.35;
}

.text-body {
  font-family: var(--font-reading);
  font-size: var(--font-size-3, 18px);
  font-weight: 400;
  line-height: 1.65;
  max-width: var(--measure-reading, 68ch);
}

.text-ui {
  font-family: var(--font-ui);
  font-size: var(--font-size-2, 16px);
  font-weight: 400;
  line-height: 1.5;
}

.text-ui-sm {
  font-family: var(--font-ui);
  font-size: var(--font-size-1, 14px);
  font-weight: 400;
  line-height: 1.45;
}

.text-code {
  font-family: var(--font-code);
  font-size: var(--font-size-1, 14px);
  font-weight: 400;
  line-height: 1.6;
}

/* Header & Navigation */
.site-header {
  border-bottom: 1px solid var(--rule);
  background: var(--surface-page);
  padding: var(--space-4) var(--space-6);
}

.site-nav {
  max-width: var(--size-layout-max, 1180px);
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
  font-size: var(--font-size-4, 21px);
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
  font-size: var(--font-size-2, 16px);
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
  border: 1px solid var(--border-control, var(--rule));
  border-radius: var(--radius-control);
  padding: var(--space-2) var(--space-3);
  cursor: pointer;
  font-family: var(--font-ui);
  font-size: var(--font-size-1, 14px);
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

/* Main container */
.site-main {
  max-width: var(--size-layout-max, 1180px);
  margin: 0 auto;
  padding: var(--space-8) var(--space-6) var(--space-18);
}

/* §12.4 Reading Measure & Typography */
.reading-column {
  font-family: var(--font-reading);
  font-size: var(--font-size-3, 18px);
  line-height: 1.65;
  max-width: var(--measure-reading, 68ch);
}

.owner-statement {
  font-family: var(--font-reading);
  font-size: var(--font-size-5, 25px);
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
  font-size: var(--font-size-1, 14px);
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
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  text-decoration: none;
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
  border-top-color: var(--text-muted);
  background: repeating-linear-gradient(
    -45deg,
    var(--surface-page),
    var(--surface-page) 6px,
    var(--surface-raised) 6px,
    var(--surface-raised) 12px
  );
  border-style: dashed;
}

.strata-band .band-label-future {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-muted);
  font-weight: 700;
  display: inline-block;
  margin-top: var(--space-1);
}

.strata-band:hover,
.strata-band:focus-visible {
  outline: 2px solid var(--focus-ring);
  outline-offset: 2px;
}

.strata-legend {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-4);
  font-size: 13px;
  color: var(--text-muted);
  margin-top: var(--space-3);
}

.strata-legend-item {
  display: flex;
  align-items: center;
  gap: var(--space-1);
}

.strata-legend-swatch {
  width: 12px;
  height: 12px;
  border-radius: var(--radius-chip);
}

/* Chips & Badges */
.chip {
  display: inline-flex;
  align-items: center;
  font-size: var(--font-size-1, 14px);
  padding: 3px var(--space-2);
  border-radius: var(--radius-chip);
  border: 1px solid var(--border-control, var(--rule));
  background: var(--surface-raised);
  color: var(--text);
  text-decoration: none;
  cursor: default;
}

.chip[href],
button.chip {
  cursor: pointer;
}

.chip.active {
  background: var(--accent);
  color: var(--text-on-accent, #FFFFFF);
  border-color: var(--accent);
}

.chip-suggested,
.chip-provisional {
  border-style: dashed;
  border-color: var(--state-provisional-border, var(--text-muted));
  opacity: 0.85;
}

.chip-facet {
  font-size: 13px;
  font-family: var(--font-ui);
}

/* CommonMark / GFM Rendered Styles (F4, 20261020-UI-01) */
.code-block {
  font-family: var(--font-code);
  font-size: var(--font-size-1, 14px);
  background: var(--surface-raised);
  border: 1px solid var(--rule);
  border-left: 3px solid var(--accent);
  padding: var(--space-4);
  border-radius: var(--radius-control);
  overflow-x: auto;
  line-height: 1.6;
  margin: var(--space-4) 0;
}

.code-block code {
  font-family: inherit;
  font-size: inherit;
}

.inline-code {
  font-family: var(--font-code);
  font-size: 0.9em;
  background: var(--surface-page);
  border: 1px solid var(--rule);
  padding: 1px 4px;
  border-radius: var(--radius-chip);
}

.reading-quote {
  border-left: 3px solid var(--accent);
  background: var(--surface-raised);
  margin: var(--space-4) 0;
  padding: var(--space-2) var(--space-4);
  font-style: italic;
}

.reading-list {
  padding-left: var(--space-6);
  margin: var(--space-3) 0 var(--space-4);
  line-height: 1.6;
}

.reading-list li {
  margin-bottom: var(--space-1);
}

.reading-image {
  max-width: 100%;
  height: auto;
  border-radius: var(--radius-control);
  border: 1px solid var(--rule);
  margin: var(--space-4) 0;
}

.table-container {
  overflow-x: auto;
  margin: var(--space-4) 0;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-family: var(--font-ui);
  font-size: var(--font-size-1, 14px);
}

.data-table th,
.data-table td {
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--rule);
  text-align: left;
}

.data-table th {
  background: var(--surface-raised);
  font-weight: 600;
}

/* Entry Details Two-Column Layout with Margin Rail */
.entry-detail-layout {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-8);
}

@media (min-width: 1024px) {
  .entry-detail-layout {
    grid-template-columns: minmax(0, var(--measure-reading, 68ch)) var(--rail-width, 320px);
    align-items: start;
  }

  .margin-rail {
    position: sticky;
    top: var(--space-6);
  }
}

.margin-rail {
  background: var(--surface-raised);
  border: 1px solid var(--rule);
  padding: var(--space-4);
  border-radius: var(--radius-control);
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
  border-radius: var(--radius-control);
}

.ask-input-row {
  display: flex;
  gap: var(--space-2);
  margin-top: var(--space-3);
}

.ask-input {
  flex: 1;
  padding: var(--space-3);
  font-size: var(--font-size-2, 16px);
  font-family: var(--font-ui);
  border: 1px solid var(--border-control, var(--rule));
  border-radius: var(--radius-control);
  background: var(--surface-page);
  color: var(--text);
}

.ask-input:focus {
  border-color: var(--focus-ring);
  outline: none;
}

/* Component Layer Buttons (20261020-UI-04) */
.btn {
  padding: var(--space-2) var(--space-4);
  font-size: var(--font-size-1, 15px);
  font-family: var(--font-ui);
  font-weight: 600;
  border-radius: var(--radius-control);
  border: 1px solid var(--accent);
  background: var(--accent);
  color: var(--surface-raised);
  cursor: pointer;
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  transition: opacity var(--duration-fast, 120ms) ease;
}

.btn:disabled,
.btn[aria-disabled="true"] {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  background: var(--surface-raised);
  color: var(--text);
  border-color: var(--border-control, var(--rule));
}

.btn-quiet {
  background: transparent;
  color: var(--text);
  border-color: transparent;
}

.btn-danger {
  background: var(--status-error);
  border-color: var(--status-error);
  color: #FFFFFF;
}

.btn-sm {
  min-height: 32px;
  padding: var(--space-1) var(--space-3);
  font-size: 13px;
}

/* Responsive Admin Shell (20261020-UI-06, UI-07) */
.admin-shell {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-6);
}

/* Tablet 2-pane mode (768px - 1279px) */
@media (min-width: 768px) and (max-width: 1279px) {
  .admin-shell {
    grid-template-columns: 1fr var(--admin-inspector-width, 340px);
    align-items: start;
  }
}

/* Desktop 3-pane mode (>= 1280px) */
@media (min-width: 1280px) {
  .admin-shell {
    grid-template-columns: var(--admin-nav-width, 240px) 1fr var(--admin-inspector-width, 340px);
    align-items: start;
  }
}

.admin-pane {
  background: var(--surface-raised);
  border: 1px solid var(--rule);
  padding: var(--space-4);
  border-radius: var(--radius-control);
}

.admin-header-status {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-4);
  background: var(--surface-raised);
  border: 1px solid var(--rule);
  border-radius: var(--radius-control);
  margin-bottom: var(--space-4);
  font-size: var(--font-size-1, 14px);
}

/* Editor Workspace (20261020-UI-01) */
.editor-workspace {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.editor-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-1);
  background: var(--surface-page);
  padding: var(--space-2);
  border: 1px solid var(--rule);
  border-bottom: none;
  border-radius: var(--radius-control) var(--radius-control) 0 0;
}

.editor-toolbar button {
  padding: 4px 8px;
  font-size: 12px;
  font-family: var(--font-ui);
  background: var(--surface-raised);
  border: 1px solid var(--rule);
  border-radius: var(--radius-chip);
  cursor: pointer;
  color: var(--text);
  min-height: 32px;
}

.editor-textarea {
  min-height: var(--editor-min-height, 60vh);
  width: 100%;
  font-family: var(--font-code);
  font-size: var(--font-size-1, 14px);
  padding: var(--space-3);
  border: 1px solid var(--border-control, var(--rule));
  border-radius: 0 0 var(--radius-control) var(--radius-control);
  background: var(--surface-raised);
  color: var(--text);
  line-height: 1.6;
  resize: vertical;
}

.editor-statusbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: var(--text-muted);
  margin-top: var(--space-1);
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

/* Inspector Tabs */
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

/* Import Triage Stepper */
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
  transition: border-color var(--duration-fast, 120ms) ease;
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
  transition: top var(--duration-fast, 120ms) ease;
}

.skip-link:focus {
  top: var(--space-2);
  outline: 2px solid var(--focus-ring);
}

/* Accessibility Utility Classes (UX-15) */
.visually-hidden,
.sr-only {
  position: absolute !important;
  width: 1px !important;
  height: 1px !important;
  padding: 0 !important;
  margin: -1px !important;
  overflow: hidden !important;
  clip: rect(0, 0, 0, 0) !important;
  white-space: nowrap !important;
  border: 0 !important;
}

/* Touch Target Size (WCAG 2.5.8 & Spec §12.5) */
.btn,
.theme-toggle-btn,
button[type="submit"] {
  min-height: 44px;
}

@media (pointer: coarse) {
  .btn,
  .theme-toggle-btn,
  .chip,
  button,
  input,
  select,
  textarea {
    min-height: 44px;
    min-width: 44px;
  }
}

/* Structured View Role Sections & Unlabeled Spans (UX-16) */
.role-section {
  margin-bottom: var(--space-6);
  padding-left: var(--space-4);
  border-left: var(--role-section-rule-width, 3px) solid var(--accent);
}

.unlabeled-span {
  margin-bottom: var(--space-6);
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
`;
