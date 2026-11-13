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

/* §12.4 Surface Craft: Selection & Text Wrapping (Finding 20261020-UI-09) */
::selection {
  background-color: var(--accent);
  color: var(--text-on-accent, #FFFFFF);
}

h1, h2, h3, h4, h5, h6,
.text-h1, .text-h2, .text-h3, .text-display {
  text-wrap: balance;
}

p, .reading-column, .text-body {
  text-wrap: pretty;
}

/* §12.4 Tabular Numerals for Chronology & Metrics (Finding 20261020-UI-09) */
.tabular-nums,
.strata-band,
.entry-meta,
.date-display,
.entry-date-line,
.level-step,
.data-table td,
time {
  font-variant-numeric: tabular-nums;
}

/* Optical Alignment: Hanging Punctuation in Blockquotes */
blockquote, .reading-quote {
  hanging-punctuation: first allow-end;
}

a {
  color: var(--accent);
  text-decoration: underline;
  text-underline-offset: 3px;
  transition: color var(--duration-fast, 120ms) ease;
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

.strata-layers-container {
  position: relative;
  overflow-x: auto;
  padding: var(--space-6) 0 var(--space-2);
  border-bottom: 2px solid var(--rule);
}

.strata-layers {
  display: flex;
  align-items: flex-end;
  gap: 2px;
  min-height: 140px;
  position: relative;
  width: max-content;
  min-width: 100%;
}

.strata-band {
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  text-decoration: none;
  flex: 1 0 32px;
  min-width: 32px;
  background: var(--surface-page);
  border: 1px solid var(--rule);
  border-top: 4px solid var(--accent);
  padding: var(--space-1) var(--space-2);
  cursor: pointer;
  text-align: left;
  color: var(--text);
  border-radius: var(--radius-chip);
  position: relative;
  transition: transform var(--duration-fast, 120ms) var(--ease-out),
              border-color var(--duration-fast, 120ms) ease,
              background-color var(--duration-fast, 120ms) ease;
}

.strata-band:hover {
  transform: translateY(-2px);
  outline: 2px solid var(--focus-ring);
  outline-offset: 2px;
}

.strata-band:focus-visible {
  outline: 2px solid var(--focus-ring);
  outline-offset: 2px;
  z-index: 3;
}

/* Empty Month Hairline along Continuous Time Axis (Finding 20261020-UI-05) */
.strata-band.strata-band-empty {
  background: transparent;
  border: 1px solid transparent;
  border-top: 1px solid var(--rule);
  border-radius: 0;
  height: 44px !important;
  padding: 2px var(--space-1);
  color: var(--text-muted);
}

.strata-band.strata-band-empty:hover {
  border-top-color: var(--accent);
  background: var(--surface-page);
}

.band-empty-hairline {
  width: 100%;
  height: 1px;
  background: var(--rule);
  margin-bottom: auto;
}

.band-ym-empty {
  font-size: 11px;
  color: var(--text-muted);
  display: block;
  text-align: center;
}

/* Profile Visual Texture Encodings (■ ◆ ▲) */
.strata-band[data-profile="case-study"],
.strata-band.profile-case-study {
  border-top-color: var(--role-goal, var(--accent));
  background: var(--surface-page);
}

.strata-band[data-profile="decision-record"],
.strata-band.profile-decision-record {
  border-top-color: var(--role-decision, #5B3FA0);
  background: repeating-linear-gradient(
    -45deg,
    var(--surface-page),
    var(--surface-page) 4px,
    var(--surface-raised) 4px,
    var(--surface-raised) 8px
  );
}

.strata-band[data-profile="design-project"],
.strata-band.profile-design-project {
  border-top-color: var(--role-outcome, #1F7A5A);
  background: radial-gradient(
    circle,
    var(--rule) 1.5px,
    var(--surface-page) 1.5px
  );
  background-size: 8px 8px;
}

/* Venture Notch on Top Edge */
.band-venture-notch {
  position: absolute;
  top: -4px;
  right: 4px;
  width: 8px;
  height: 4px;
  background-color: var(--accent);
  border-radius: 1px;
}

/* As-Of Timeline Cursor */
.as-of-cursor {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 2px;
  background-color: var(--accent);
  z-index: 4;
  pointer-events: none;
  transition: left var(--duration-base, 160ms) var(--ease-out);
}

.as-of-cursor-handle {
  position: absolute;
  top: -24px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--accent);
  color: var(--text-on-accent, #ffffff);
  font-size: 11px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: var(--radius-chip);
  white-space: nowrap;
}

/* Future Dimmed Bands */
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
  color: var(--state-future-text, var(--text-muted));
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

.strata-band .band-header {
  display: flex;
  align-items: baseline;
  gap: var(--space-1);
}

.strata-band .band-glyphs {
  font-size: 11px;
  color: var(--accent);
}

.strata-band .band-ym {
  font-weight: 700;
  font-size: 13px;
}

.strata-band .band-count {
  font-size: 12px;
  color: var(--text-muted);
}

.strata-legend {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-4);
  font-size: 13px;
  color: var(--text-muted);
  margin-top: var(--space-3);
  align-items: center;
}

.strata-legend-item {
  display: flex;
  align-items: center;
  gap: var(--space-1);
}

.strata-legend-hint {
  margin-left: auto;
  font-size: 12px;
  color: var(--text-muted);
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

/* Differentiation Device: Two-layer Strata Date Glyph (Finding 20261020-UI-09) */
.strata-date-glyph {
  display: inline-flex;
  flex-direction: column;
  gap: 2px;
  width: 14px;
  height: 10px;
  vertical-align: middle;
  margin-right: var(--space-1);
}

.strata-glyph-layer {
  height: 3px;
  border-radius: 1px;
  background: var(--accent);
  display: block;
}

.strata-glyph-layer.happened-layer {
  width: 14px;
}

.strata-glyph-layer.written-layer {
  width: 14px;
  background: var(--role-goal, var(--accent));
}

.strata-glyph-layer.written-layer.shifted {
  width: 9px;
  margin-left: 5px;
  background: var(--role-friction, #9A6A00);
}

/* §12.1 Text-First Claim Items (deliberately avoids card grids, Finding 20261020-UI-08) */
.claim-item {
  padding: var(--space-3) 0;
  border-bottom: 1px solid var(--rule);
}

.claim-item:last-child {
  border-bottom: none;
}

.claim-meta {
  font-family: var(--font-ui);
  font-size: var(--font-size-1, 13px);
  color: var(--text-muted);
  margin-bottom: var(--space-1);
}

.claim-text {
  font-family: var(--font-reading);
  font-size: var(--font-size-2, 15px);
  line-height: 1.5;
}

/* §12.3 & §12.4 Role Markers & Sections (Findings 20261020-UI-08, 20261020-UI-09) */
.role-marker {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: 2px var(--space-2);
  font-family: var(--font-ui);
  font-size: var(--font-size-2, 16px);
  font-weight: 600;
  border-radius: var(--radius-chip, 2px);
  border-left: var(--role-section-rule-width, 3px) solid var(--accent);
  background: var(--surface-raised);
  color: var(--text);
  margin: 0 0 var(--space-2) 0;
}

.role-section {
  margin-bottom: var(--space-6);
  padding-left: var(--space-4);
  border-left: var(--role-section-rule-width, 3px) solid var(--accent);
  transition: border-color var(--duration-fast, 120ms) ease;
}

.role-marker.role-goal, .role-section.role-goal { border-left-color: var(--role-goal); }
.role-marker.role-approach, .role-section.role-approach { border-left-color: var(--role-approach); }
.role-marker.role-friction, .role-section.role-friction { border-left-color: var(--role-friction); }
.role-marker.role-decision, .role-section.role-decision { border-left-color: var(--role-decision); }
.role-marker.role-outcome, .role-section.role-outcome { border-left-color: var(--role-outcome); }
.role-marker.role-lesson, .role-section.role-lesson { border-left-color: var(--role-lesson); }

/* Other role profiles (Decision Record, Design Project) */
.role-marker.role-brief, .role-section.role-brief { border-left-color: var(--role-goal); }
.role-marker.role-exploration, .role-section.role-exploration { border-left-color: var(--role-approach); }
.role-marker.role-critique, .role-section.role-critique { border-left-color: var(--role-friction); }
.role-marker.role-iteration, .role-section.role-iteration { border-left-color: var(--role-approach); }
.role-marker.role-final, .role-section.role-final { border-left-color: var(--role-outcome); }
.role-marker.role-impact, .role-section.role-impact { border-left-color: var(--role-outcome); }
.role-marker.role-context, .role-section.role-context { border-left-color: var(--role-approach); }
.role-marker.role-options, .role-section.role-options { border-left-color: var(--role-friction); }
.role-marker.role-consequences, .role-section.role-consequences { border-left-color: var(--role-outcome); }

.unlabeled-span {
  margin-bottom: var(--space-6);
}

/* §12.7 Choreographed Micro-Transitions */
.btn {
  transition: background-color var(--duration-fast, 120ms) ease,
              border-color var(--duration-fast, 120ms) ease,
              color var(--duration-fast, 120ms) ease,
              transform var(--duration-fast, 120ms) ease;
}

.btn:active {
  transform: scale(0.98);
}

.chip {
  transition: background-color var(--duration-fast, 120ms) ease,
              border-color var(--duration-fast, 120ms) ease,
              color var(--duration-fast, 120ms) ease;
}

#editor-status-line .as-of-banner,
#editor-status-line .later-thinking-banner {
  margin: 0;
  padding: 4px 10px;
  font-size: 13px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border-radius: var(--radius-control);
}

#editor-toast .as-of-banner,
#editor-toast .later-thinking-banner {
  margin: 0;
  padding: 0;
  border: none;
  background: transparent;
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
    transform: none !important;
  }
}

/* WP-15.2 Shared Primitives */
.lp-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  font-family: var(--font-ui);
  font-size: var(--font-size-1, 14px);
  font-weight: 600;
  border-radius: var(--button-radius, var(--radius-control));
  border: 1px solid var(--border-control, var(--rule));
  padding: var(--space-2) var(--space-4);
  min-height: var(--button-height-md, var(--size-target-min, 44px));
  cursor: pointer;
  text-decoration: none;
  transition: opacity var(--duration-fast, 120ms) ease, background-color var(--duration-fast, 120ms) ease;
}

.lp-btn-sm {
  min-height: var(--button-height-sm, 36px);
  padding: var(--space-1) var(--space-3);
  font-size: var(--font-size-1, 13px);
}

.lp-btn-primary {
  background: var(--button-bg, var(--accent));
  border-color: var(--button-bg, var(--accent));
  color: var(--button-fg, var(--text-on-accent, #ffffff));
}

.lp-btn-secondary {
  background: var(--surface-raised);
  border-color: var(--border-control, var(--rule));
  color: var(--text);
}

.lp-btn-danger {
  background: var(--status-danger-bg, var(--status-error));
  border-color: var(--status-danger-border, var(--status-error));
  color: var(--status-danger-fg, #ffffff);
}

.lp-btn-quiet {
  background: transparent;
  border-color: transparent;
  color: var(--text);
}

.lp-btn:disabled,
.lp-icon-btn:disabled,
.lp-switch:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.lp-icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: var(--size-target-min, 44px);
  min-height: var(--size-target-min, 44px);
  padding: var(--space-2);
  border-radius: var(--button-radius, var(--radius-control));
  border: 1px solid var(--border-control, var(--rule));
  font-family: var(--font-ui);
  font-size: var(--font-size-2, 16px);
  line-height: 1;
  cursor: pointer;
}

.lp-icon-btn-sm {
  min-width: var(--button-height-sm, 36px);
  min-height: var(--button-height-sm, 36px);
}

.lp-chip {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-1) var(--space-3);
  border-radius: var(--chip-radius, var(--radius-chip));
  border: 1px solid var(--chip-border, var(--rule));
  background: var(--surface-raised);
  color: var(--text);
  font-family: var(--font-ui);
  font-size: var(--font-size-1, 14px);
  cursor: default;
}

button.lp-chip {
  min-height: var(--size-target-min, 44px);
  cursor: pointer;
}

.lp-chip-suggested {
  border-style: dashed;
  border-color: var(--state-provisional-border, var(--text-muted));
}

.lp-chip-selected {
  background: var(--accent);
  border-color: var(--accent);
  color: var(--text-on-accent, #ffffff);
}

.lp-badge {
  display: inline-flex;
  align-items: center;
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-chip);
  border: 1px solid var(--rule);
  font-family: var(--font-ui);
  font-size: 12px;
  font-weight: 600;
  cursor: default;
  background: var(--surface-subtle);
  color: var(--text);
}

.lp-badge-ok {
  background: var(--status-success-bg);
  border-color: var(--status-success-border);
  color: var(--status-success-fg);
}

.lp-badge-warn {
  background: var(--status-warn-bg);
  border-color: var(--status-warn-border);
  color: var(--status-warn-fg);
}

.lp-badge-danger {
  background: var(--status-danger-bg);
  border-color: var(--status-danger-border);
  color: var(--status-danger-fg);
}

.lp-status-indicator {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  font-family: var(--font-ui);
  font-size: var(--font-size-1, 14px);
  color: var(--text);
  cursor: default;
}

.lp-status-dot {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  display: inline-block;
  background: var(--text-muted);
}

.lp-status-dot-ok {
  background: var(--status-ok);
}

.lp-status-dot-warn {
  background: var(--status-warn);
}

.lp-status-dot-danger {
  background: var(--status-error);
}

.lp-switch-row {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.lp-switch {
  display: inline-flex;
  align-items: center;
  gap: var(--space-3);
  min-height: var(--size-target-min, 44px);
  padding: var(--space-1) 0;
  background: transparent;
  border: none;
  color: var(--text);
  font-family: var(--font-ui);
  font-size: var(--font-size-1, 14px);
  font-weight: 600;
  cursor: pointer;
  text-align: left;
}

.lp-switch-track {
  position: relative;
  width: 44px;
  height: 24px;
  border-radius: 999px;
  background: var(--surface-sunken);
  border: 1px solid var(--border-control, var(--rule));
  display: inline-flex;
  align-items: center;
  padding: 2px;
}

.lp-switch[aria-checked="true"] .lp-switch-track {
  background: var(--accent);
  border-color: var(--accent);
}

.lp-switch-thumb {
  width: 18px;
  height: 18px;
  border-radius: 999px;
  background: var(--surface-raised);
  transition: transform var(--duration-fast, 120ms) ease;
}

.lp-switch[aria-checked="true"] .lp-switch-thumb {
  transform: translateX(20px);
}

.lp-field {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  margin-bottom: var(--space-3);
}

.lp-field-label {
  font-family: var(--font-ui);
  font-size: var(--font-size-1, 14px);
  font-weight: 600;
  color: var(--text);
}

.lp-input {
  width: 100%;
  min-height: var(--size-target-min, 44px);
  padding: var(--space-2) var(--space-3);
  font-family: var(--font-ui);
  font-size: var(--font-size-1, 14px);
  color: var(--text);
  background: var(--surface-raised);
  border: 1px solid var(--field-border, var(--border-control, var(--rule)));
  border-radius: var(--field-radius, var(--radius-control));
}

.lp-textarea {
  min-height: 96px;
  resize: vertical;
}

.lp-field-has-error .lp-input {
  border-color: var(--status-error);
}

.lp-choice-label {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  min-height: var(--size-target-min, 44px);
  font-family: var(--font-ui);
  font-size: var(--font-size-1, 14px);
  color: var(--text);
  cursor: pointer;
}

.lp-choice-input {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.lp-field-help {
  margin: 0;
  font-size: 13px;
  color: var(--text-muted);
}

.lp-field-error {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--status-danger-fg, var(--status-error));
}

.lp-gallery {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.lp-gallery-section {
  background: var(--surface-raised);
  border: 1px solid var(--rule);
  border-radius: var(--radius-card);
  padding: var(--space-4);
}

.lp-gallery-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-3);
}

.lp-gallery-stack {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  max-width: 520px;
}
`;
