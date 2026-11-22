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
  margin: 0;
}

/* §12.6 Strata Timeline — the one bold element */
.strata-section {
  background: var(--surface-raised);
  border: 1px solid var(--rule);
  padding: var(--space-6);
  margin: 0;
}

.strata-header {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-3);
  margin: 0;
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
  margin: 0;
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
  margin: 0;
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
  font-size: 14px;
}

.strata-band .band-count {
  font-size: 12px;
  color: var(--text-muted);
}

.strata-legend {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-4);
  font-size: 14px;
  color: var(--text-muted);
  margin: 0;
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
  font-size: 14px;
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
  margin: 0;
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
  margin: 0;
  padding: var(--space-2) var(--space-4);
  font-style: italic;
}

.reading-list {
  padding-left: var(--space-6);
  margin: 0;
  line-height: 1.6;
}

.reading-list li {
  margin: 0;
}

.reading-image {
  max-width: 100%;
  height: auto;
  border-radius: var(--radius-control);
  border: 1px solid var(--rule);
  margin: 0;
}

.table-container {
  overflow-x: auto;
  margin: 0;
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
  margin: 0;
  font-size: 15px;
}

/* §12.6 Ask Surface */
.ask-box {
  background: var(--surface-raised);
  border: 1px solid var(--rule);
  padding: var(--space-6);
  margin: 0;
  border-radius: var(--radius-control);
}

.ask-input-row {
  display: flex;
  gap: var(--space-2);
  margin: 0;
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
  border: 1px solid var(--button-bg, var(--accent));
  background: var(--button-bg, var(--accent));
  color: var(--button-fg, var(--text-on-accent, #FFFFFF));
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
  min-height: 36px;
  padding: var(--space-1) var(--space-4);
  font-size: 14px;
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
  margin: 0;
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
  margin: 0;
}

.level-steps {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-1);
  margin: 0;
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
  margin: 0;
  overflow-x: auto;
}

.inspector-tab-btn {
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  padding: var(--space-2) var(--space-4);
  font-size: 14px;
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
  margin: 0;
  border-bottom: 1px solid var(--rule);
  padding-bottom: var(--space-2);
}

.triage-step {
  padding: var(--space-1) var(--space-4);
  border-radius: var(--radius-chip);
  font-size: 14px;
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
  gap: var(--space-4);
  align-items: center;
  flex-wrap: wrap;
  padding: var(--space-2) var(--space-4);
  background: var(--surface-page);
  border: 1px solid var(--rule);
  border-radius: var(--radius-control);
  font-size: 12px;
  margin: 0;
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
  margin: 0;
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
  margin: 0;
  overflow: hidden !important;
  clip: rect(0, 0, 0, 0) !important;
  white-space: nowrap !important;
  border: 0 !important;
}

/* Touch Target Size (WCAG 2.5.8 & Spec §12.5) */
.btn,
.theme-toggle-btn,
button[type="submit"] {
  min-height: var(--control-height);
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
  margin: 0;
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
  margin: 0;
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
  margin: 0;
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
  margin: 0;
}

.role-section {
  margin: 0;
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
  margin: 0;
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
  padding: 4px 8px;
  font-size: 14px;
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

/* WP-15.2 & WP-15.3a Shared Primitives & Design Foundations (D-FOUND-1..6) */
.lp-icon-sprite {
  position: absolute;
  width: 0;
  height: 0;
  overflow: hidden;
  pointer-events: none;
}

.lp-icon {
  display: inline-block;
  flex-shrink: 0;
  vertical-align: middle;
  color: currentColor;
}

.lp-icon-16 {
  width: 16px;
  height: 16px;
}

.lp-icon-20 {
  width: 20px;
  height: 20px;
}

.lp-icon-24 {
  width: 24px;
  height: 24px;
}

.lp-btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  font-family: var(--font-ui);
  font-size: var(--type-body-sm-size, 14px);
  line-height: var(--type-body-sm-line, 20px);
  font-weight: 600;
  white-space: nowrap;
  border-radius: var(--r2);
  border: 1px solid var(--border-control);
  padding: 0 var(--space-4);
  height: var(--control-height);
  min-height: var(--control-height);
  min-width: 36px;
  cursor: pointer;
  text-decoration: none;
  transition: opacity var(--duration-base, 160ms) ease, transform var(--duration-base, 160ms) ease;
}

.lp-btn:focus-visible,
.lp-icon-btn:focus-visible,
.lp-input:focus-visible,
.lp-chip:focus-visible,
.lp-switch:focus-visible,
.lp-btn.is-focus-visible,
.lp-icon-btn.is-focus-visible,
.lp-input.is-focus-visible,
.lp-chip.is-focus-visible {
  outline: 2px solid var(--focus-ring);
  outline-offset: 2px;
}

.lp-btn:active:not(:disabled),
.lp-icon-btn:active:not(:disabled),
.lp-btn.is-active,
.lp-icon-btn.is-active {
  transform: translateY(1px);
}

.lp-btn-sm {
  height: var(--control-height);
  min-height: var(--control-height);
  padding: 0 var(--space-4);
  font-size: var(--type-body-sm-size, 14px);
}

.lp-btn-primary {
  background: var(--button-bg, var(--accent));
  border-color: var(--button-bg, var(--accent));
  color: var(--button-fg, var(--text-on-accent, #ffffff));
}

.lp-btn-primary:hover:not(:disabled),
.lp-btn-primary.is-hover {
  opacity: 0.92;
}

.lp-btn-secondary {
  background: var(--surface-raised);
  border-color: var(--border-control);
  color: var(--text);
}

.lp-btn-secondary:hover:not(:disabled),
.lp-btn-secondary.is-hover {
  background: var(--role-neutral-bg);
}

.lp-btn-danger {
  background: var(--role-danger-bg);
  border-color: var(--role-danger-border);
  color: var(--role-danger-fg);
}

.lp-btn-danger-confirm {
  background: var(--role-danger-border);
  border-color: var(--role-danger-border);
  color: var(--surface-raised);
}

.lp-btn-quiet {
  background: transparent;
  border-color: transparent;
  color: var(--text);
}

.lp-btn-quiet:hover:not(:disabled),
.lp-btn-quiet:focus-visible,
.lp-btn-quiet.is-hover,
.lp-btn-quiet.is-active {
  background: var(--role-neutral-bg);
}

.lp-btn:disabled:not([aria-busy="true"]),
.lp-icon-btn:disabled:not([aria-busy="true"]),
.lp-switch:disabled,
.lp-input:disabled,
.lp-chip:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.lp-btn[aria-busy="true"],
.lp-btn-loading {
  opacity: 1;
  cursor: progress;
}

@keyframes lp-spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.lp-icon-spin {
  animation: lp-spin 900ms linear infinite;
}

@media (prefers-reduced-motion: reduce) {
  .lp-icon-spin {
    animation: none;
  }
}

.lp-icon-btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  min-width: 36px;
  min-height: 36px;
  padding: 0;
  border-radius: var(--r2);
  border: 1px solid var(--border-control);
  background: var(--surface-raised);
  color: var(--text);
  font-family: var(--font-ui);
  font-size: var(--type-body-sm-size, 14px);
  line-height: 1;
  cursor: pointer;
  transition: opacity var(--duration-base, 160ms) ease, transform var(--duration-base, 160ms) ease;
}

.lp-icon-btn-ghost {
  border: 1px solid var(--border-control);
  background: var(--surface-raised);
  color: var(--text);
}

.lp-icon-btn-ghost:hover:not(:disabled),
.lp-icon-btn-ghost:focus-visible,
.lp-icon-btn-ghost.is-hover,
.lp-icon-btn-ghost.is-active {
  background: var(--role-neutral-bg);
}

.lp-icon-btn-outlined {
  border: 1px solid var(--border-control);
  background: var(--surface-raised);
  color: var(--text);
}

.lp-icon-btn-outlined:hover:not(:disabled),
.lp-icon-btn-outlined.is-hover {
  background: var(--role-neutral-bg);
}

.lp-icon-btn-sm {
  width: 36px;
  height: 36px;
  min-width: 36px;
  min-height: 36px;
}

@media (pointer: coarse) {
  .lp-btn::after,
  .lp-icon-btn::after,
  button.lp-chip::after,
  .lp-tab::after,
  .lp-input::after,
  .lp-select::after {
    content: '';
    position: absolute;
    inset: -4px;
  }
}

.lp-chip {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-1);
  padding: var(--space-1) var(--space-2);
  border-radius: 4px;
  border: 1px solid var(--border-control);
  background: var(--surface-raised);
  color: var(--text);
  font-family: var(--font-ui);
  font-size: var(--type-body-sm-size, 14px);
  line-height: var(--type-body-sm-line, 20px);
  font-weight: 400;
  white-space: nowrap;
  cursor: default;
}

button.lp-chip {
  height: 36px;
  min-height: 36px;
  cursor: pointer;
}

button.lp-chip:hover:not(:disabled),
button.lp-chip.is-hover {
  background: var(--role-neutral-bg);
}

.lp-chip-suggested {
  border-style: solid;
  border-color: var(--state-provisional-border, var(--border-control));
}

.lp-chip-selected {
  background: var(--role-action-bg);
  border-color: var(--role-action-border);
  color: var(--role-action-fg);
}

.lp-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: 0;
  border-radius: 0;
  border: none;
  font-family: var(--font-ui);
  font-size: var(--type-body-sm-size, 14px);
  line-height: var(--type-body-sm-line, 20px);
  font-weight: 400;
  white-space: nowrap;
  cursor: default;
  background: transparent;
  color: var(--text-muted);
}

.lp-badge-neutral,
.lp-badge-ok,
.lp-badge-warn,
.lp-badge-danger,
.lp-badge-info,
.lp-badge-action {
  background: transparent;
  color: var(--text-muted);
}

.lp-status-indicator {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  font-family: var(--font-ui);
  font-size: 14px;
  font-weight: 400;
  color: var(--text);
  cursor: default;
}

.lp-status-dot {
  width: 6px;
  height: 6px;
  border-radius: 999px;
  display: inline-block;
  flex-shrink: 0;
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
  border-radius: 4px;
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
  border-radius: 4px;
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
  margin: 0;
}

.lp-field-label {
  font-family: var(--font-ui);
  font-size: var(--font-size-1, 14px);
  font-weight: 600;
  color: var(--text);
}

.lp-input {
  width: 100%;
  height: var(--control-height);
  min-height: var(--control-height);
  padding: 0 var(--space-2);
  font-family: var(--font-ui);
  font-size: 14px;
  font-weight: 400;
  color: var(--text);
  background: var(--surface-input);
  border: 1px solid var(--field-border, var(--border-control, var(--rule)));
  border-radius: var(--r2);
}

.lp-textarea {
  height: auto;
  min-height: 144px;
  padding: var(--space-2);
  font-family: var(--font-ui);
  font-size: 14px;
  field-sizing: content;
  overflow-y: hidden;
  resize: vertical;
}

.lp-select-wrap {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
}

.lp-select {
  appearance: none;
  -webkit-appearance: none;
  height: var(--control-height);
  min-height: var(--control-height);
  border-radius: var(--r2);
  padding: 0 36px 0 var(--space-2);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.lp-select-chevron {
  position: absolute;
  right: 12px;
  pointer-events: none;
  color: var(--text-muted);
}

.lp-select option {
  padding: 0;
  gap: 0;
}

input[type="date"].lp-input {
  min-width: 148px;
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
  font-size: 12px;
  color: var(--text-muted);
}

.lp-field-error {
  margin: 0;
  font-size: 12px;
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

/* WP-15.3 & WP-15.3a Feedback, Containers & Design Foundations */
.lp-card {
  background: var(--surface-raised);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-container);
  padding: var(--space-4);
}

.lp-card-section {
  padding-top: var(--space-4);
  margin: 0;
  border-top: 1px solid var(--border-subtle);
}

.lp-notice {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-4);
  padding: var(--space-4);
  border-radius: var(--radius-container);
  border: 1px solid var(--border-subtle);
  background: var(--role-neutral-bg);
  color: var(--role-neutral-fg);
  font-size: var(--type-body-sm-size, 14px);
  line-height: var(--type-body-sm-line, 20px);
}

.lp-notice-main {
  display: flex;
  align-items: flex-start;
  gap: var(--space-2);
  flex: 1;
  min-width: 0;
}

.lp-notice-content {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2);
  flex: 1;
  min-width: 0;
}

.lp-notice-icon {
  margin: 0;
}

.lp-notice-action-link {
  background: transparent;
  border: none;
  padding: var(--space-1) var(--space-2);
  color: currentColor;
  font-family: var(--font-ui);
  font-size: var(--type-body-sm-size, 14px);
  line-height: var(--type-body-sm-line, 20px);
  font-weight: 600;
  white-space: nowrap;
  text-decoration: underline;
  cursor: pointer;
  border-radius: var(--radius-control);
}

.lp-notice-actions {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.lp-notice-info {
  background: var(--role-info-bg);
  border-color: var(--role-info-border);
  color: var(--role-info-fg);
}

.lp-notice-warn {
  background: var(--role-warning-bg);
  border-color: var(--role-warning-border);
  color: var(--role-warning-fg);
}

.lp-notice-danger {
  background: var(--role-danger-bg);
  border-color: var(--role-danger-border);
  color: var(--role-danger-fg);
}

.lp-notice-ok {
  background: var(--role-success-bg);
  border-color: var(--role-success-border);
  color: var(--role-success-fg);
}

.lp-notice[hidden],
.lp-status-line[hidden],
.lp-modal-backdrop[hidden],
.lp-popover-menu[hidden] {
  display: none;
}

.lp-status-line {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  min-height: 36px;
  font-size: var(--type-body-sm-size, 14px);
  line-height: var(--type-body-sm-line, 20px);
  color: var(--text);
}

.lp-status-icon {
  flex-shrink: 0;
}

.lp-status-line-body {
  display: inline-flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--space-1);
  flex: 1;
  min-width: 0;
}

.lp-status-line-ok {
  color: var(--role-success-fg);
}

.lp-status-line-warn {
  color: var(--role-warning-fg);
}

.lp-status-line-danger {
  color: var(--role-danger-fg);
}

.lp-status-undo-link {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 36px;
  min-height: 36px;
  min-width: 36px;
  background: transparent;
  border: none;
  padding: 0 var(--space-1);
  color: var(--accent);
  font-family: var(--font-ui);
  font-size: var(--type-body-sm-size, 14px);
  line-height: var(--type-body-sm-line, 20px);
  font-weight: 600;
  white-space: nowrap;
  text-decoration: underline;
  cursor: pointer;
  border-radius: var(--radius-control);
}

.lp-modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: var(--z-overlay, 200);
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-4);
}

.lp-drawer-backdrop {
  justify-content: flex-end;
  padding: 0;
}

.lp-drawer-left {
  justify-content: flex-start;
}

.lp-dialog-panel {
  width: 100%;
  max-width: 480px;
  background: var(--surface-overlay, var(--surface-raised));
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-overlay);
  box-shadow: var(--shadow-overlay);
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.lp-drawer-panel {
  width: 100%;
  max-width: var(--admin-inspector-width, 340px);
  height: 100%;
  background: var(--surface-overlay, var(--surface-raised));
  border-left: 1px solid var(--border-subtle);
  border-radius: var(--radius-overlay);
  box-shadow: var(--shadow-overlay);
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  overflow-y: auto;
}

.lp-dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
}

.lp-dialog-title {
  margin: 0;
  font-size: var(--type-title-size, 20px);
  line-height: var(--type-title-line, 28px);
  font-weight: 600;
}

.lp-dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-2);
}

/* D-FOUND-6: Disclosure is a hairline divider + summary row with rotating chevron, never a 4-sided bordered box */
.lp-disclosure {
  border: none;
  border-top: 1px solid var(--border-subtle);
  border-radius: 0;
  background: transparent;
  padding: 0;
}

.lp-disclosure-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  min-height: var(--size-target-min, 44px);
  padding: var(--space-2) 0;
  cursor: pointer;
  font-weight: 600;
  list-style: none;
}

.lp-disclosure-summary::-webkit-details-marker {
  display: none;
}

.lp-disclosure-summary-end {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
}

.lp-disclosure-chevron {
  transition: transform var(--duration-base, 160ms) ease;
}

.lp-disclosure[open] .lp-disclosure-chevron {
  transform: rotate(180deg);
}

.lp-disclosure-meta {
  font-weight: 400;
  color: var(--text-muted);
  font-size: var(--type-body-sm-size, 14px);
}

.lp-disclosure-body {
  padding: var(--space-4) 0;
  border-top: 1px solid var(--border-subtle);
}

.lp-popover-menu {
  background: var(--surface-overlay, var(--surface-raised));
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  box-shadow: var(--shadow-overlay);
  padding: var(--space-2);
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  min-width: 180px;
}

.lp-tablist {
  display: flex;
  flex-wrap: nowrap;
  gap: var(--space-4);
  border-bottom: 1px solid var(--border-subtle);
  margin: 0;
  overflow-x: auto;
}

.lp-tab {
  position: relative;
  display: inline-flex;
  align-items: center;
  box-sizing: border-box;
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  border-radius: 4px 4px 0 0;
  padding: 0 var(--space-2);
  height: 36px;
  min-height: 36px;
  font-family: var(--font-ui);
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
  text-decoration: none;
  color: var(--text-muted);
  cursor: pointer;
}

.lp-tab[aria-selected="true"] {
  color: var(--accent);
  border-bottom-color: var(--accent);
}

.lp-table-wrap {
  overflow-x: auto;
}

.lp-table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--type-body-sm-size, 14px);
}

.lp-table caption {
  text-align: left;
  font-weight: 600;
  margin: 0;
}

.lp-table th,
.lp-table td {
  text-align: left;
  padding: var(--space-2) var(--space-4);
  border-bottom: 1px solid var(--border-subtle);
}

.lp-empty-state {
  text-align: left;
  padding: var(--space-6);
  border-radius: var(--radius-container);
  background: var(--surface-raised);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.lp-empty-title {
  margin: 0;
  font-size: var(--type-title-size, 20px);
  line-height: var(--type-title-line, 28px);
  font-weight: 600;
}

.lp-empty-body {
  margin: 0;
  color: var(--text-muted);
  font-size: var(--type-body-sm-size, 14px);
  line-height: var(--type-body-sm-line, 20px);
}

.lp-empty-guide {
  padding-top: var(--space-4);
  border-top: 1px solid var(--border-subtle);
}

.lp-empty-guide-steps {
  margin: 0;
  padding: 0 0 0 var(--space-6);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  font-size: var(--type-body-sm-size, 14px);
  line-height: var(--type-body-sm-line, 20px);
}

.lp-writing-surface,
.lp-writing-surface-field textarea.lp-input {
  font-family: var(--font-reading);
  font-size: var(--type-body-size, 16px);
  line-height: var(--type-body-line, 24px);
  max-width: var(--measure-reading, 68ch);
}

.lp-type-page-title {
  font-size: var(--type-page-title-size, 24px);
  line-height: var(--type-page-title-line, 32px);
  font-weight: 600;
}

.lp-type-title {
  font-size: var(--type-title-size, 16px);
  line-height: var(--type-title-line, 24px);
  font-weight: 600;
}

.lp-type-body {
  font-size: var(--type-body-size, 16px);
  line-height: var(--type-body-line, 24px);
  font-weight: 400;
}

.lp-type-body-sm {
  font-size: var(--type-body-sm-size, 14px);
  line-height: var(--type-body-sm-line, 20px);
  font-weight: 500;
}

.lp-type-caption {
  font-size: var(--type-caption-size, 12px);
  line-height: var(--type-caption-line, 16px);
  font-weight: 400;
  color: var(--text-muted);
}

/* D-FOUND-3 Admin Header & Foundations Gallery */
.lp-admin-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  height: 60px;
  min-height: 60px;
  max-height: 60px;
  padding: 12px;
  background: var(--surface-page);
  border-bottom: 1px solid var(--border-subtle);
}

.lp-admin-header .lp-icon-btn,
.lp-admin-header .lp-icon-btn-ghost {
  width: 36px;
  height: 36px;
  min-width: 36px;
  min-height: 36px;
  border-radius: var(--r2);
}

.lp-admin-header-brand {
  font-family: var(--font-ui);
  font-size: var(--type-body-size, 16px);
  line-height: var(--type-body-line, 24px);
  font-weight: 600;
  color: var(--text);
  white-space: nowrap;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}

.lp-admin-header-nav {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.lp-admin-header-link {
  font-family: var(--font-ui);
  font-size: var(--type-body-sm-size, 14px);
  line-height: var(--type-body-sm-line, 20px);
  font-weight: 500;
  color: var(--text);
  text-decoration: none;
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-control);
  white-space: nowrap;
}

.lp-admin-header-link:hover,
.lp-admin-header-link[aria-current="page"] {
  background: var(--role-neutral-bg);
}

.lp-admin-header-actions {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.lp-admin-header-mobile-only {
  display: none;
}

@media (max-width: 767px) {
  .lp-admin-header {
    height: 60px;
    min-height: 60px;
    max-height: 60px;
    padding: 12px;
  }
  .lp-admin-header-desktop-only,
  .lp-admin-header-nav {
    display: none;
  }
  .lp-admin-header-mobile-only {
    display: inline-flex;
  }
  .lp-notice-action-link {
    min-width: 44px;
    min-height: 44px;
  }
}

.lp-details-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--space-4);
}

@media (min-width: 768px) {
  .lp-details-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

.lp-menu-item {
  width: 100%;
  justify-content: flex-start;
}

.lp-staging-banner {
  position:sticky;
  top: 0;
  z-index: 999;
  display: flex;
  justify-content: center;
  padding: var(--space-2) var(--space-4);
  background: var(--surface-raised);
  border-bottom: 2px solid var(--status-warn-border);
  font-size: var(--type-body-sm-size);
}

.lp-modal-inline-stage {
  position: relative;
  inset: auto;
  z-index: 1;
  background: var(--surface-sunken);
  border-radius: var(--radius-container);
  padding: var(--space-4);
}

.lp-tooltip-wrap {
  position: relative;
  display: inline-flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-1);
}

.lp-tooltip-bubble {
  display: none;
  position: absolute;
  top: calc(100% + var(--space-1));
  left: 0;
  z-index: 20;
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-control);
  background: var(--text);
  color: var(--surface-raised);
  font-family: var(--font-ui);
  font-size: var(--type-caption-size, 12px);
  line-height: var(--type-caption-line, 16px);
  font-weight: 500;
  white-space: nowrap;
}

.lp-tooltip-wrap:hover .lp-tooltip-bubble:not([hidden]),
.lp-tooltip-wrap:focus-within .lp-tooltip-bubble:not([hidden]),
.lp-tooltip-wrap.is-tooltip-open .lp-tooltip-bubble:not([hidden]) {
  display: inline-flex;
}

.lp-specimen-captioned {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-1);
}

.lp-specimen-box-container {
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-container);
  border: 1px solid var(--border-subtle);
  background: var(--surface-raised);
  font-size: var(--type-caption-size, 12px);
  line-height: var(--type-caption-line, 16px);
}

.lp-specimen-box-overlay {
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-overlay);
  border: 1px solid var(--border-subtle);
  background: var(--surface-overlay, var(--surface-raised));
  box-shadow: var(--shadow-overlay);
  font-size: var(--type-caption-size, 12px);
  line-height: var(--type-caption-line, 16px);
}

.lp-specimen-surface-row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.lp-specimen-surface-chip {
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-control);
  font-size: var(--type-caption-size, 12px);
  line-height: var(--type-caption-line, 16px);
}

.lp-surface-chip-page {
  background: var(--surface-page);
  border: 1px solid var(--border-subtle);
}

.lp-surface-chip-raised {
  background: var(--surface-raised);
  border: 1px solid var(--border-subtle);
}

.lp-surface-chip-subtle {
  background: var(--surface-subtle);
  border: 1px solid var(--border-subtle);
}

.lp-surface-chip-control-border {
  background: var(--surface-raised);
  border: 1px solid var(--border-control);
}

.lp-spacing-bar-row {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--type-caption-size, 12px);
  line-height: var(--type-caption-line, 16px);
}

.lp-spacing-bar {
  height: 8px;
  background: var(--accent);
  border-radius: var(--radius-pill);
}

.lp-spacing-bar-4 { width: 4px; }
.lp-spacing-bar-8 { width: 8px; }
.lp-spacing-bar-12 { width: 12px; }
.lp-spacing-bar-16 { width: 16px; }
.lp-spacing-bar-24 { width: 24px; }
.lp-spacing-bar-32 { width: 32px; }
.lp-spacing-bar-48 { width: 48px; }
.lp-spacing-bar-64 { width: 64px; }

.lp-icon-inventory-grid {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.lp-icon-inventory-item {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-control);
  background: var(--role-neutral-bg);
  color: var(--role-neutral-fg);
  font-size: var(--type-caption-size, 12px);
  line-height: var(--type-caption-line, 16px);
}

.lp-entry-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-control);
  background: var(--surface-raised);
  color: var(--text);
  font-size: var(--type-body-sm-size, 14px);
  line-height: var(--type-body-sm-line, 20px);
}

.lp-entry-row-active {
  background: var(--role-action-bg);
  color: var(--role-action-fg);
  font-weight: 600;
}

.lp-editor-action-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
  padding-bottom: var(--space-2);
  border-bottom: 1px solid var(--border-subtle);
}

.lp-foundations-page {
  padding: var(--space-4) var(--gutter, 16px);
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
  max-width: var(--size-layout-max, 1180px);
  margin: 0 auto;
}

.lp-foundations-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: var(--space-4);
}

.lp-specimen-swatch {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-control);
  font-size: var(--type-body-sm-size, 14px);
  line-height: var(--type-body-sm-line, 20px);
  font-weight: 500;
}

.lp-specimen-swatch-action {
  background: var(--role-action-bg);
  color: var(--role-action-fg);
}

.lp-specimen-swatch-neutral {
  background: var(--role-neutral-bg);
  color: var(--role-neutral-fg);
}

.lp-specimen-swatch-success {
  background: var(--role-success-bg);
  color: var(--role-success-fg);
}

.lp-specimen-swatch-warning {
  background: var(--role-warning-bg);
  color: var(--role-warning-fg);
}

.lp-specimen-swatch-danger {
  background: var(--role-danger-bg);
  color: var(--role-danger-fg);
}

.lp-specimen-swatch-info {
  background: var(--role-info-bg);
  color: var(--role-info-fg);
}

.lp-contrast-probe {
  background: var(--surface-raised);
  color: var(--text);
  border: 1px solid var(--border-control);
  outline: 2px solid var(--focus-ring);
  outline-offset: 2px;
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-control);
}

.lp-admin-split-preview {
  display: grid;
  grid-template-columns: 260px minmax(0, 720px);
  gap: var(--space-6);
  align-items: start;
}

@media (max-width: 767px) {
  .lp-admin-split-preview {
    grid-template-columns: minmax(0, 1fr);
    gap: var(--space-4);
  }
}

.lp-preview-list-col {
  width: 260px;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.lp-preview-list-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
  padding-bottom: var(--space-2);
  border-bottom: 1px solid var(--border-subtle);
}

.lp-preview-main-col {
  width: 100%;
  max-width: 720px;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.lp-editor-canvas {
  background: var(--surface-raised);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-container);
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.lp-page-notice-slot {
  min-height: 48px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.lp-status-line-slot {
  min-height: 24px;
  display: flex;
  align-items: center;
}

/* WP-15.7 Reference Editor Page (D-FOUND-1..6, D-WORKSPACE, D-EDITOR) */
.lp-is-hidden,
[hidden] {
  display: none !important;
}

.lp-admin-body {
  margin: 0;
  background: var(--surface-page);
  color: var(--text);
  font-family: var(--font-ui);
  font-size: 14px;
}

.lp-admin-body button,
.lp-admin-body input,
.lp-admin-body select,
.lp-admin-body textarea {
  font-family: inherit;
  font-size: 14px;
}

a.lp-admin-header-brand {
  text-decoration: none;
  min-height: 44px;
  display: inline-flex;
  align-items: center;
}

.lp-admin-notice-slot {
  max-width: var(--size-layout-max, 1180px);
  margin: 0;
  padding: 0 var(--gutter, 16px);
}

.lp-editor-shell {
  max-width: var(--size-layout-max, 1180px);
  margin: 0 auto;
  padding: var(--space-4) var(--gutter, 16px) var(--space-6);
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--space-4);
}

@media (max-width: 767px) {
  .lp-editor-main {
    order: 1;
  }

  .lp-editor-sidebar {
    order: 2;
  }

  .lp-editor-inspector {
    order: 3;
  }

  .lp-entry-list[data-collapsed="true"] {
    display: none;
  }
}

@media (min-width: 768px) {
  .lp-editor-shell {
    grid-template-columns: 240px minmax(0, 720px);
    gap: var(--space-4);
    align-items: start;
  }

  .lp-sidebar-toggle {
    display: none;
  }
}

@media (min-width: 1080px) {
  .lp-editor-shell {
    grid-template-columns: 230px minmax(0, 1fr) 310px;
    gap: var(--space-4);
  }
}

.lp-editor-inspector {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding: var(--space-4);
}

.lp-entries-filters {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.lp-history-row {
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  overflow-wrap: anywhere;
}

.lp-history-row-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.lp-history-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2);
}

.lp-editor-sidebar {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.lp-sidebar-title-group {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
}

.lp-entry-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.lp-entry-row {
  text-decoration: none;
  min-height: var(--size-target-min, 44px);
}

.lp-entry-list-title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
}

.lp-editor-main {
  min-width: 0;
  width: 100%;
  max-width: 720px;
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.lp-editor-heading {
  margin: 0;
  overflow-wrap: anywhere;
}

.lp-editor-action-bar {
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
  padding-top: var(--space-4);
  border-top: 1px solid var(--border-subtle);
}

.lp-editor-primary-actions,
.lp-editor-secondary-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2);
}

.lp-menu-wrap {
  position: relative;
  display: inline-flex;
}

@media (min-width: 768px) {
  .lp-admin-header-mobile-only {
    display: none;
  }
}

.lp-menu-popover-float {
  position: absolute;
  right: 0;
  top: calc(100% + 4px);
  z-index: var(--z-overlay, 50);
}

.lp-empty-dismiss {
  display: flex;
  justify-content: flex-end;
  margin: 0;
}

.lp-publish-steps {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.lp-publish-step h3 {
  margin: 0;
  font-size: var(--type-body-size, 16px);
  line-height: var(--type-body-line, 24px);
  font-weight: 600;
}

.lp-publish-step p {
  margin: 0;
  font-size: var(--type-body-sm-size, 14px);
  line-height: var(--type-body-sm-line, 20px);
}

.lp-publish-matches {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.lp-publish-matches[hidden] {
  display: none;
}

.lp-publish-match-item {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
  padding: var(--space-2);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-control);
  background: var(--surface-subtle);
  font-size: var(--type-body-sm-size, 14px);
}

.lp-publish-match-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2);
}

.lp-publish-match-link {
  background: none;
  border: 0;
  padding: 0;
  color: var(--accent);
  font: inherit;
  text-decoration: underline;
  cursor: pointer;
  min-height: 44px;
  display: inline-flex;
  align-items: center;
}

.lp-workspace-safety-bar {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  margin: 0;
  padding-top: var(--space-4);
  border-top: 1px solid var(--border-subtle);
}

.lp-killswitch-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
  padding: var(--space-4);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-control);
  background: var(--surface-raised);
}

.lp-killswitch-copy {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.lp-escalations-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-4);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-control);
  background: var(--surface-raised);
}

.lp-escalations-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
}

.lp-escalations-title {
  margin: 0;
  font-size: var(--type-body-size, 16px);
  font-weight: 600;
}

.lp-escalation-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.lp-escalation-item {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-2);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-control);
  background: var(--surface-subtle);
}

.lp-escalation-question {
  margin: 0;
  font-weight: 600;
  font-size: var(--type-body-sm-size, 14px);
}

.lp-escalation-actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

/* --- WP-16.1 Admin Shell & Auth Shell --- */
.lp-admin-header-start {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  min-width: 0;
}

.lp-admin-shell-body {
  display: flex;
  min-height: calc(100vh - 57px);
  position: relative;
}

.lp-admin-shell-main {
  flex: 1;
  min-width: 0;
}

.lp-status-legend-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
  font-size: 12px;
}

.lp-status-legend-label {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
}

.lp-admin-section-card {
  max-width: 720px;
  background: var(--surface-raised);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-container);
  padding: var(--space-6);
}

.lp-admin-section-title {
  margin: 0;
  font-family: var(--font-reading);
}

.lp-admin-section-desc {
  margin: 0;
  color: var(--text-muted);
}

.lp-admin-section-actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.lp-table-scroll {
  width: 100%;
  overflow-x: auto;
}

@media (max-width: 767px) {
  .wizard-step-labels {
    display: none !important;
  }

  .lp-admin-rail-toggle {
    display: inline-flex;
  }

  .lp-admin-rail {
    position: fixed;
    top: 57px;
    left: 0;
    bottom: 0;
    z-index: 50;
    transform: translateX(-100%);
    transition: transform 0.18s ease;
    box-shadow: var(--shadow-overlay);
  }

  .lp-admin-rail.is-open {
    transform: translateX(0);
  }
}

/* --- WP-16.2 Today Dashboard --- */
.lp-dashboard-stack {
  max-width: 840px;
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.lp-dashboard-header h1 {
  margin: 0;
}

.lp-dashboard-header p {
  margin: 0;
}

.lp-dashboard-explain,
.lp-dashboard-card {
  background: var(--surface-raised);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-container);
  padding: var(--space-4);
}

.lp-dashboard-explain-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 180px), 1fr));
  gap: var(--space-4);
  margin: 0;
}

.lp-dashboard-explain-grid dt {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-muted);
  margin: 0;
}

.lp-dashboard-explain-grid dd {
  margin: 0;
  font-size: 14px;
}

.lp-dashboard-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
  margin: 0;
}

.lp-dashboard-card-title {
  margin: 0;
  font-size: var(--type-body-size, 16px);
  font-weight: 600;
}

.lp-dashboard-card-header .lp-dashboard-card-title {
  margin: 0;
}

.lp-dashboard-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.lp-dashboard-item {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-4);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-control);
  background: var(--surface-subtle);
}

.lp-dashboard-item-meta {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  min-width: 0;
}

.lp-dashboard-checklist {
  margin: 0;
  padding-left: var(--space-6);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

/* --- WP-16.3 Entries List Page --- */
.lp-entries-stack {
  max-width: 920px;
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.lp-entries-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
}

.lp-entries-header h1,
.lp-entries-header p {
  margin: 0;
}

.lp-entries-toolbar {
  display: flex;
  flex-direction: column;
  gap: 16px;
  align-items: stretch;
  margin: 0;
}

@media (min-width: 640px) {
  .lp-entries-toolbar {
    flex-direction: row;
    flex-wrap: wrap;
    align-items: flex-end;
  }
}

.lp-entries-filter-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  min-width: 130px;
}

.lp-entries-search-group {
  flex: 1;
  min-width: 180px;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.lp-entries-search-row {
  display: flex;
  gap: var(--space-2);
}

.lp-entries-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.lp-entries-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  padding: var(--space-4);
  background: var(--surface-raised);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-control);
}

.lp-entries-row-main {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  min-width: 0;
}

.lp-entries-row-title {
  font-weight: 600;
  color: var(--text);
  text-decoration: none;
  word-break: break-word;
}

.lp-entries-row-title:hover {
  text-decoration: underline;
}

.lp-entries-row-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2);
}

.lp-structure-meter {
  display: inline-flex;
  align-items: center;
  gap: 3px;
}

.lp-structure-step {
  width: 10px;
  height: 6px;
  border-radius: var(--radius-2);
  background: var(--border-subtle);
  display: inline-block;
}

.lp-structure-step.is-filled {
  background: var(--accent);
}

.lp-structure-label {
  font-size: 12px;
  color: var(--text-muted);
  margin: 0;
}

.lp-entries-pagination {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
}

/* WP-16.R R2 Unified Admin Page & Auth Primitives (D-MIN) */
.lp-is-hidden,
[hidden] {
  display: none !important;
}

.lp-page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--space-4);
  margin: 0;
}

.lp-page-title {
  margin: 0;
  font-family: var(--font-ui);
  font-size: 24px;
  line-height: 32px;
  font-weight: 600;
}

.lp-page-subtitle {
  margin: 0;
  font-size: 14px;
  color: var(--text-muted);
}

.lp-section-title {
  margin: 0;
  font-family: var(--font-ui);
  font-size: 16px;
  line-height: 24px;
  font-weight: 600;
}

.lp-section-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 340px), 1fr));
  gap: var(--space-6);
}

.lp-section-block {
  padding-top: var(--space-6);
  border-top: 1px solid var(--border-subtle);
}

.lp-stack-sm {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.lp-stack-md {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.lp-stack-md > * {
  margin: 0;
}

.lp-row-wrap {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2);
}

.lp-row-between {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.lp-help-text {
  margin: 0;
  font-size: 12px;
  color: var(--text-muted);
}

.lp-body-sm {
  margin: 0;
  font-size: 14px;
  color: var(--text);
}

.lp-body-sm-muted {
  margin: 0;
  font-size: 14px;
  color: var(--text-muted);
}

.lp-btn-full {
  width: 100%;
  white-space: normal;
  text-align: center;
}

.lp-btn-as-link {
  background: transparent;
  border: 0;
  padding: 0;
  cursor: pointer;
}

/* C3 Editor D-COMP #10 fixes */
.lp-admin-shell-main-full .lp-page-notice-slot {
  min-height: 0;
}

#ref-field-title.lp-editor-title-input {
  font-size: 24px;
  line-height: 32px;
  height: auto;
  min-height: 36px;
  border: 0;
}

@media (max-width: 639px) {
  .lp-editor-toolbar {
    flex-wrap: nowrap;
    padding: 8px 4px;
    gap: 4px;
  }

  .lp-editor-view-switch .lp-tab {
    padding-left: 8px;
    padding-right: 8px;
  }

  .lp-editor-toolbar-status {
    display: none;
  }

  .lp-editor-toolbar-center {
    position: fixed;
    left: 0;
    right: 0;
    bottom: var(--vv-bottom, 0px);
    z-index: var(--z-sticky);
    display: flex;
    flex-wrap: nowrap;
    overflow-x: auto;
    gap: 4px;
    padding: 8px 16px;
    background: var(--surface-page);
    border-radius: 0;
    box-shadow: var(--shadow-overlay);
  }

  .lp-editor-toolbar-center #ref-btn-source-toggle {
    display: none;
  }
}

.lp-input-code {
  font-family: var(--font-code);
  letter-spacing: 0.12em;
}

.lp-code-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-2);
}

.lp-code-cell {
  padding: var(--space-1) var(--space-2);
  background: var(--surface-subtle);
  border: 1px solid var(--border-subtle);
  border-radius: 4px;
  text-align: center;
  font-family: var(--font-code);
  font-size: 12px;
}

.lp-dropzone {
  padding: var(--space-4);
  border: 1px solid var(--border-control);
  border-radius: 4px;
  text-align: center;
  background: var(--surface-subtle);
}

.lp-triage-item {
  padding: var(--space-4);
  border-top: 1px solid var(--border-subtle);
}

.lp-status-line-ok {
  font-size: 12px;
  color: var(--status-ok);
}

.lp-status-line-danger {
  font-size: 12px;
  color: var(--status-error);
}

.lp-wizard-header {
  margin: 0;
  padding-bottom: var(--space-4);
  border-bottom: 1px solid var(--border-subtle);
}

.lp-wizard-progress {
  height: 4px;
  background: var(--surface-subtle);
  border-radius: 4px;
  overflow: hidden;
}

.lp-wizard-progress-fill {
  height: 100%;
  width: 16.6%;
  background: var(--accent);
  transition: width 0.3s ease;
}

.lp-wizard-progress-fill[data-step="1"] { width: 16.6%; }
.lp-wizard-progress-fill[data-step="2"] { width: 33.3%; }
.lp-wizard-progress-fill[data-step="3"] { width: 50%; }
.lp-wizard-progress-fill[data-step="4"] { width: 66.6%; }
.lp-wizard-progress-fill[data-step="5"] { width: 83.3%; }
.lp-wizard-progress-fill[data-step="6"] { width: 100%; }

.lp-wizard-steps {
  display: flex;
  justify-content: space-between;
  gap: var(--space-2);
  margin: 0;
  font-size: 12px;
  color: var(--text-muted);
}

.lp-wizard-step-label.is-active {
  font-weight: 600;
  color: var(--text);
}

.lp-wizard-step-label.is-done {
  font-weight: 600;
  color: var(--accent);
}

.lp-wizard-panel {
  margin: 0;
  padding: var(--space-4);
  border: 1px solid var(--border-subtle);
  background: var(--surface-subtle);
  border-radius: 4px;
}

.lp-qr-box {
  width: 100%;
  max-width: 200px;
  margin: 0;
  background: #fff;
  padding: var(--space-2);
  border-radius: 4px;
  text-align: center;
}

.lp-radio-card {
  display: flex;
  align-items: flex-start;
  gap: var(--space-2);
  padding: var(--space-4);
  border: 1px solid var(--border-subtle);
  background: var(--surface-subtle);
  border-radius: 4px;
  cursor: pointer;
}

.lp-theme-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-2);
  margin: 0;
}

.theme-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-4);
  border: 1px solid var(--border-subtle);
  border-radius: 4px;
  cursor: pointer;
}

.theme-card.is-selected {
  border: 2px solid var(--accent);
  background: var(--surface-subtle);
}

.lp-checkbox-row {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

.lp-btn-flex {
  flex: 1;
  text-align: center;
}

.lp-inline-list {
  font-size: 14px;
  margin: 0;
}

.lp-inbox-decline-row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  align-items: center;
}

.lp-inbox-decline-row .lp-input {
  flex: 1;
  min-width: 200px;
}

.lp-entries-row {
  cursor: pointer;
}

.lp-admin-body h1,
.lp-admin-body .lp-type-h1 {
  font-family: var(--font-ui);
  font-size: 24px;
  line-height: 1.3;
  font-weight: 600;
}

.lp-admin-body h2,
.lp-admin-body h3,
.lp-admin-body .lp-type-h2,
.lp-admin-body .lp-type-h3 {
  font-family: var(--font-ui);
  font-size: 16px;
  line-height: 1.4;
  font-weight: 600;
}

/* === D-LAYOUT Shell, Launcher, Page Template, List Row, Auth === */
.lp-admin-shell-main {
  width: 100%;
  background: var(--surface-page);
}

.lp-page-column {
  width: 100%;
  max-width: 720px;
  margin: 0 auto;
  padding: 40px 16px 64px;
}

@media (min-width: 768px) {
  .lp-page-column {
    padding: 40px 24px 64px;
  }
}

.lp-page-header {
  margin: 0;
}

.lp-page-header h1 {
  margin: 0;
}

.lp-page-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.lp-page-description {
  margin: 0;
  color: var(--text-muted);
  font-size: 14px;
}

.lp-page-tabs-wrap,
.lp-tabs {
  margin: 0;
}

.lp-page-sections {
  display: flex;
  flex-direction: column;
  gap: 40px;
}

.lp-launcher-panel {
  position: fixed;
  top: 48px;
  left: 0;
  right: 0;
  z-index: var(--z-overlay);
  background: var(--surface-overlay);
  border-bottom: 1px solid var(--border-subtle);
  box-shadow: var(--shadow-overlay);
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

@media (min-width: 768px) {
  .lp-launcher-panel {
    position: absolute;
    top: calc(100% + 4px);
    left: 0;
    right: auto;
    min-width: 240px;
    border: 1px solid var(--border-subtle);
    border-radius: 8px;
  }
}

.lp-launcher-panel[hidden] {
  display: none;
}

.lp-launcher-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.lp-launcher-heading {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-muted);
  padding: 4px 8px;
}

.lp-launcher-item {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 36px;
  padding: 0 8px;
  border-radius: 4px;
  text-decoration: none;
  color: var(--text);
  font-size: 14px;
}

.lp-launcher-item:hover {
  background: var(--surface-subtle);
}

.lp-launcher-item.is-current {
  background: var(--role-action-bg);
  color: var(--role-action-fg);
  font-weight: 600;
}

.lp-launcher-footer {
  border-top: 1px solid var(--border-subtle);
  padding-top: 8px;
}

.lp-list {
  display: flex;
  flex-direction: column;
  gap: 0;
  border-top: 1px solid var(--border-subtle);
}

.lp-entries-search-row .lp-input {
  flex: 1;
  min-width: 0;
}

.lp-entries-search-row .lp-btn {
  flex-shrink: 0;
}

.lp-section-title {
  margin: 0;
}

.lp-help-text {
  margin: 0;
  font-size: 12px;
  color: var(--text-muted);
}

.lp-choice-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  cursor: pointer;
}

/* === D-LAYOUT Full-Screen Editor === */
.lp-admin-shell-main-full {
  width: 100%;
  background: var(--surface-page);
}

.lp-editor-shell-fullscreen {
  position: relative;
  min-height: calc(100vh - 48px);
  background: var(--surface-page);
}

.lp-editor-fullscreen {
  display: flex;
  flex-direction: column;
  min-height: calc(100vh - 48px);
}

.lp-editor-toolbar {
  position: sticky;
  top: 0;
  z-index: var(--z-sticky);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  flex-wrap: nowrap;
  min-height: 48px;
  padding: 8px 16px;
  background: var(--surface-page);
}

.lp-editor-toolbar-left,
.lp-editor-toolbar-right {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: nowrap;
}

.lp-editor-view-switch {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.lp-format-bar {
  align-self: center;
  position: sticky;
  bottom: 16px;
  z-index: var(--z-sticky);
  display: inline-flex;
  align-items: center;
  gap: 4px;
  flex-wrap: nowrap;
  padding: 4px 8px;
  background: var(--surface-overlay);
  border-radius: var(--radius-control);
  box-shadow: var(--shadow-overlay);
  transition: opacity 160ms var(--ease-out), transform 160ms var(--ease-out);
}

.lp-format-bar .lp-icon-btn:active {
  transform: scale(0.96);
  transition-duration: 100ms;
}

.lp-editor-writing-view,
.lp-editor-settings-view {
  width: 100%;
}

.lp-editor-writing-view[hidden],
.lp-editor-settings-view[hidden] {
  display: none;
}

.lp-editor-toolbar-status {
  margin: 0;
}

.lp-editor-writing-col {
  width: 100%;
  max-width: 760px;
  margin: 0 auto;
  padding: 40px 16px 64px;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

@media (min-width: 768px) {
  .lp-editor-writing-col {
    padding: 40px 24px 64px;
  }
}

.lp-editor-title-input {
  width: 100%;
  height: 36px;
  min-height: 36px;
  border: 0;
  background: transparent;
  color: var(--text);
  font-family: var(--font-ui);
  font-size: 24px;
  font-weight: 600;
  line-height: 1.3;
  padding: 0;
  outline: none;
}

.lp-section-block .lp-section-title {
  margin: 0;
}

.lp-editor-details-popover {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  z-index: var(--z-overlay);
  width: min(480px, calc(100vw - 32px));
  padding: 16px;
}

.lp-editor-surface-wrap {
  position: relative;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.lp-tiptap-mount {
  flex: 1;
  min-height: 360px;
}

.lp-tiptap-prose {
  font-family: var(--font-reading);
  font-size: 16px;
  line-height: 1.7;
  color: var(--text);
  outline: none;
  min-height: 360px;
}

.lp-tiptap-prose p {
  margin: 0;
}

.lp-tiptap-prose h1,
.lp-tiptap-prose h2,
.lp-tiptap-prose h3 {
  font-family: var(--font-reading);
  margin: 0;
}

.lp-editor-source-textarea {
  font-family: var(--font-code);
  font-size: 14px;
  line-height: 1.6;
  min-height: 360px;
}

.lp-editor-shell-fullscreen {
  display: flex;
  width: 100%;
  min-height: calc(100vh - 56px);
}

.lp-editor-main-fullscreen {
  flex: 1;
  min-width: 0;
}

.lp-editor-drawer {
  position: fixed;
  top: 60px;
  bottom: 0;
  left: 0;
  z-index: 210;
  width: 260px;
  background: var(--surface-overlay);
  padding: 16px 12px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
  transition: width 240ms var(--ease-out), flex-basis 240ms var(--ease-out);
}
@media (min-width: 768px) {
  .lp-editor-drawer {
    position: relative;
    top: auto;
    bottom: auto;
    left: auto;
    flex: 0 0 260px;
  }
}

.lp-editor-drawer[hidden] {
  display: none;
}

.lp-editor-drawer-left {
  border: 0;
  border-right: 1px solid var(--border-overlay);
}

#ref-entry-list {
  padding: 0;
}

.lp-editor-drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.lp-slash-menu {
  position: absolute;
  top: 40px;
  left: 0;
  z-index: var(--z-overlay);
  min-width: 200px;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.lp-slash-menu[hidden] {
  display: none;
}

/* WP-16.C Gallery & Canary Fixtures */
.lp-gallery-root {
  display: flex;
  flex-direction: column;
  gap: 40px;
}

.lp-gallery-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.lp-gallery-row {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: center;
}

.lp-gallery-icon-sample {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
}

.lp-canary-stacking {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  gap: 8px;
}

.lp-canary-small-h1 {
  font-size: 14px;
  margin: 0;
}

.lp-canary-zero-margin {
  margin: 0;
  padding: 0;
}

.lp-canary-overlay {
  position: fixed;
  left: -80px;
  top: 40px;
  width: 200px;
  height: 80px;
  display: block;
}

.lp-canary-action-bar {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: flex-end;
}

.lp-canary-btn-sm {
  width: 100px;
}

.lp-canary-btn-md {
  width: 120px;
}

.lp-canary-rhythm {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.lp-canary-tabs {
  display: flex;
  flex-wrap: wrap;
  width: 280px;
}

.lp-canary-tab {
  width: 160px;
}

/* =========================================================
 * WP-16.C D-COMP Primitives & Component Contract
 * ========================================================= */

@media (prefers-reduced-motion: reduce) {
  .lp-choice,
  .lp-choice-check,
  .lp-overlay-surface {
    transition-duration: 0.01ms !important;
    animation-duration: 0.01ms !important;
  }
}

/* PageHeader (D-COMP #2) */
.lp-page-header-dcomp {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 0;
}

.lp-page-header-back {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  width: fit-content;
  font-size: 14px;
  line-height: 20px;
  color: var(--text-muted);
  text-decoration: none;
}

.lp-page-header-back:hover {
  color: var(--text);
}

.lp-page-header-title,
.lp-page-header h1 {
  font-size: 24px;
  line-height: 32px;
  font-weight: 600;
  margin: 0;
  color: var(--text);
}

.lp-page-header .lp-page-description {
  font-size: 14px;
  line-height: 20px;
  color: var(--text-muted);
  margin: 0;
}

.lp-page-header-action {
  width: 100%;
}

.lp-page-header-action .lp-btn {
  width: 100%;
}

@media (min-width: 640px) {
  .lp-page-header-dcomp {
    display: grid;
    grid-template-columns: 1fr auto;
    row-gap: 8px;
    column-gap: 16px;
    align-items: start;
  }

  .lp-page-header-back {
    grid-column: 1 / -1;
  }

  .lp-page-header-title,
  .lp-page-header h1 {
    grid-column: 1;
    line-height: 36px;
  }

  .lp-page-header-action {
    grid-column: 2;
    grid-row: 1;
    width: auto;
    justify-self: end;
  }

  .lp-page-header-back ~ .lp-page-header-action {
    grid-row: 2;
  }

  .lp-page-header-action .lp-btn {
    width: auto;
  }

  .lp-page-header .lp-page-description {
    grid-column: 1 / -1;
  }
}

/* Item (D-COMP #3) */
.lp-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px 0;
  border-bottom: 1px solid var(--border-subtle);
  color: var(--text);
  text-decoration: none;
}

a.lp-item:hover {
  background: var(--surface-subtle);
}

.lp-item.is-selected {
  background: var(--role-action-bg);
  border-radius: var(--r2);
}

.lp-item-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  line-height: 20px;
  font-weight: 600;
  color: var(--text);
}

.lp-item-leading {
  display: inline-flex;
  color: var(--text-muted);
  flex-shrink: 0;
}

.lp-item-subtitle {
  font-size: 12px;
  line-height: 16px;
  color: var(--text-muted);
}

.lp-item-body {
  font-size: 14px;
  line-height: 20px;
  color: var(--text);
}

.lp-item-segments {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.lp-item-segment {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.lp-item-segment-heading {
  font-size: 14px;
  line-height: 20px;
  font-weight: 600;
  color: var(--text);
}

.lp-item-meta {
  font-size: 12px;
  line-height: 16px;
  color: var(--text-muted);
}

.lp-item-status {
  display: flex;
  align-items: center;
  gap: 8px;
}

.lp-item-chevron {
  display: inline-flex;
  color: var(--text-muted);
}

@media (min-width: 640px) {
  .lp-item {
    display: grid;
    grid-template-columns: 1fr auto;
    column-gap: 16px;
    row-gap: 4px;
    align-items: start;
  }

  .lp-item-title {
    grid-column: 1;
    grid-row: 1;
  }

  .lp-item-status {
    grid-column: 2;
    grid-row: 1;
    justify-self: end;
  }

  .lp-item-subtitle,
  .lp-item-meta,
  .lp-item-body,
  .lp-item-segments,
  .lp-item-actions {
    grid-column: 1 / -1;
  }
}

/* ActionBar (D-COMP #4) */
.lp-action-bar {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 0;
  align-items: stretch;
}

.lp-action-bar .lp-btn {
  width: 100%;
}

@media (min-width: 640px) {
  .lp-action-bar {
    align-items: flex-start;
  }

  .lp-action-bar .lp-btn {
    width: 240px;
    min-width: 160px;
    max-width: 240px;
  }
}

/* Choice (D-COMP #5) */
.lp-choice-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.lp-choice-legend {
  font-size: 14px;
  line-height: 20px;
  font-weight: 600;
  color: var(--text);
}

.lp-choice-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.lp-choice-variant-button .lp-choice-list {
  flex-direction: column;
}

@media (min-width: 640px) {
  .lp-choice-variant-button .lp-choice-list {
    flex-direction: row;
    flex-wrap: wrap;
  }
}

.lp-choice {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 12px 16px;
  min-height: 36px;
  border: 1px solid var(--border-control);
  border-radius: var(--radius-control);
  background: var(--surface);
  color: var(--text);
  cursor: pointer;
  transition: border-color var(--duration-base) var(--ease-out), background-color var(--duration-base) var(--ease-out);
}

.lp-choice:hover:not(.is-disabled) {
  background: var(--surface-subtle);
}

.lp-choice:has(.lp-choice-input:focus-visible) {
  outline: 2px solid var(--focus-ring);
  outline-offset: 2px;
}

.lp-choice.is-selected,
.lp-choice:has(.lp-choice-input:checked) {
  border-color: var(--accent);
  background: var(--role-action-bg);
}

.lp-choice.is-disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.lp-choice > .lp-choice-input {
  position: absolute;
  left: 16px;
  top: 12px;
  width: 16px;
  height: 16px;
  margin: 0;
  padding: 0;
  border: 0;
  opacity: 0;
  appearance: none;
  cursor: pointer;
}

.lp-choice-check {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--accent);
  opacity: 0;
  transform: scale(0.8);
  transition: opacity var(--duration-base) var(--ease-out), transform var(--duration-base) var(--ease-out);
  flex-shrink: 0;
}

.lp-choice.is-selected .lp-choice-check,
.lp-choice:has(.lp-choice-input:checked) .lp-choice-check {
  opacity: 1;
  transform: scale(1);
}

.lp-choice-radio-dot {
  width: 16px;
  height: 16px;
  border-radius: 999px;
  border: 1px solid var(--border-control);
  background: var(--surface);
  flex-shrink: 0;
  position: relative;
  transition: border-color var(--duration-base) var(--ease-out), background-color var(--duration-base) var(--ease-out);
}

.lp-choice.is-selected .lp-choice-radio-dot,
.lp-choice:has(.lp-choice-input:checked) .lp-choice-radio-dot {
  border-color: var(--accent);
  background: var(--accent);
}

.lp-choice-card-body {
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 100%;
  min-width: 0;
}

.lp-choice-card-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.lp-choice-card-title {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  font-size: 14px;
  line-height: 20px;
  font-weight: 600;
  color: var(--text);
}

.lp-choice-card-desc {
  font-size: 12px;
  line-height: 16px;
  color: var(--text-muted);
}

.lp-choice-btn-label {
  font-size: 14px;
  line-height: 20px;
  font-weight: 600;
}

/* Tabs & Stepper (D-COMP #6) */
.lp-tabs {
  display: flex;
  flex-direction: column;
  width: 100%;
  margin: 0;
}

.lp-tabs[role="tablist"],
.lp-tablist {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  width: 100%;
  border-bottom: 1px solid var(--border-subtle);
}

.lp-tablist {
  margin: 0;
}

.lp-tab {
  flex: 1 1 0;
  min-width: 0;
  height: 36px;
  padding: 0 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
  font-size: 14px;
  line-height: 20px;
  color: var(--text-muted);
  background: transparent;
  border: 0;
  border-bottom: 2px solid transparent;
  text-decoration: none;
  cursor: pointer;
}

.lp-tab.is-active,
.lp-tab[aria-selected="true"] {
  color: var(--text);
  font-weight: 600;
  border-bottom-color: var(--accent);
}

.lp-stepper {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin: 0;
}

.lp-stepper-label {
  position: relative;
  font-size: 14px;
  line-height: 20px;
  font-weight: 600;
  color: var(--text);
  padding-bottom: 16px;
}

.lp-stepper-label::before,
.lp-stepper-label::after {
  content: '';
  position: absolute;
  left: 0;
  bottom: 0;
  height: 2px;
}

.lp-stepper-label::before {
  width: 100%;
  background: var(--border-subtle);
}

.lp-stepper-label::after {
  width: var(--stepper-pct, 35%);
  background: var(--accent);
  transition: width var(--duration-base) var(--ease-out);
}

.lp-stepper-pct-0 { --stepper-pct: 0%; }
.lp-stepper-pct-15 { --stepper-pct: 15%; }
.lp-stepper-pct-20 { --stepper-pct: 20%; }
.lp-stepper-pct-25 { --stepper-pct: 25%; }
.lp-stepper-pct-30 { --stepper-pct: 30%; }
.lp-stepper-pct-35 { --stepper-pct: 35%; }
.lp-stepper-pct-40 { --stepper-pct: 40%; }
.lp-stepper-pct-50 { --stepper-pct: 50%; }
.lp-stepper-pct-65 { --stepper-pct: 65%; }
.lp-stepper-pct-70 { --stepper-pct: 70%; }
.lp-stepper-pct-75 { --stepper-pct: 75%; }
.lp-stepper-pct-80 { --stepper-pct: 80%; }
.lp-stepper-pct-85 { --stepper-pct: 85%; }
.lp-stepper-pct-100 { --stepper-pct: 100%; }

/* Overlay (D-COMP #7) */
.lp-overlay {
  position: fixed;
  inset: 0;
  z-index: var(--z-overlay);
}

.lp-overlay[hidden] {
  display: none;
}

.lp-overlay-backdrop {
  position: fixed;
  inset: 0;
  background: var(--backdrop);
}

.lp-overlay-surface {
  position: fixed;
  background: var(--surface-overlay);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-overlay);
  box-shadow: var(--shadow-overlay);
  padding: 16px;
  max-height: calc(100vh - 32px);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
  transition: opacity var(--duration-base) var(--ease-out), transform var(--duration-base) var(--ease-out);
}

.lp-overlay-actions .lp-overlay-surface {
  left: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  border-radius: var(--radius-overlay) var(--radius-overlay) 0 0;
}

@media (min-width: 640px) {
  .lp-overlay-actions .lp-overlay-backdrop {
    background: transparent;
  }

  .lp-overlay-actions .lp-overlay-surface {
    left: auto;
    right: 24px;
    bottom: auto;
    top: 56px;
    width: 280px;
    border-radius: var(--radius-overlay);
  }
}

.lp-overlay-panel .lp-overlay-surface {
  inset: 0;
  width: 100%;
  height: 100%;
  max-height: 100vh;
  border-radius: 0;
}

.lp-overlay-dialog .lp-overlay-surface {
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: min(480px, calc(100vw - 32px));
}

.lp-overlay-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.lp-overlay-title {
  font-size: 16px;
  line-height: 24px;
  font-weight: 600;
  margin: 0;
  color: var(--text);
}

.lp-overlay-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* FormSection (D-COMP #9) */
.lp-form-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin: 0;
}

.lp-form-section-title {
  font-size: 16px;
  line-height: 24px;
  font-weight: 600;
  margin: 0;
  color: var(--text);
}

.lp-form-section-desc {
  font-size: 14px;
  line-height: 20px;
  color: var(--text-muted);
  margin: 0;
}

/* Canary overrides (must stay after D-COMP rules so intentional violations remain broken) */
.lp-canary-stacking.lp-page-header {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  gap: 8px;
}

.lp-canary-rhythm.lp-form-section {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.lp-canary-tabs.lp-tabs {
  display: flex;
  flex-wrap: wrap;
  width: 280px;
}

.lp-canary-tabs.lp-tabs .lp-canary-tab {
  flex: 0 0 auto;
  width: 160px;
}

/* Shell menu header & < 640px bottom-sheet overlays (D-COMP #7, #8) */
.lp-menu-header {
  padding: 4px 12px 8px;
  font-size: 12px;
  line-height: 16px;
  font-weight: 600;
  color: var(--text-muted);
  margin: 0;
}

.lp-editor-drawer-header-stack {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  padding: 0;
  gap: 8px;
}
.lp-editor-drawer .lp-section-header-title {
  text-align: left;
}
.lp-item-has-actions {
  display: flex !important;
  flex-direction: column;
  gap: 24px !important;
}
.lp-item-content {
  display: grid;
  grid-template-columns: 1fr;
  row-gap: 8px;
}
@container (min-width: 400px) {
  .lp-item-content {
    grid-template-columns: 1fr auto;
    column-gap: 16px;
  }
}

.lp-btn-as-link {
  background: transparent;
  border: 0;
  padding: 0;
  cursor: pointer;
}

/* C3 Editor D-COMP #10 fixes */
.lp-admin-shell-main-full .lp-page-notice-slot {
  min-height: 0;
}

#ref-field-title.lp-editor-title-input {
  font-size: 24px;
  line-height: 32px;
  height: auto;
  min-height: 36px;
  border: 0;
}

@media (max-width: 639px) {
  .lp-editor-toolbar {
    flex-wrap: nowrap;
    padding: 8px 4px;
    gap: 4px;
  }

  .lp-editor-view-switch .lp-tab {
    padding-left: 8px;
    padding-right: 8px;
  }

  .lp-editor-toolbar-status {
    display: none;
  }

  .lp-editor-toolbar-center {
    position: fixed;
    left: 0;
    right: 0;
    bottom: var(--vv-bottom, 0px);
    z-index: var(--z-sticky);
    display: flex;
    flex-wrap: nowrap;
    overflow-x: auto;
    gap: 4px;
    padding: 8px 16px;
    background: var(--surface-page);
    border-radius: 0;
    box-shadow: var(--shadow-overlay);
  }

  .lp-editor-toolbar-center #ref-btn-source-toggle {
    display: none;
  }
}

@media (max-width: 639px) {
  .lp-popover-menu,
  .lp-launcher-panel,
  .lp-status-popover {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    top: auto;
    width: 100%;
    max-width: 100%;
    max-height: calc(100vh - 32px);
    overflow-y: auto;
    border-radius: var(--radius-overlay) var(--radius-overlay) 0 0;
    z-index: var(--z-overlay);
  }
}

/* === D-SYS Foundations (WP-16.S S1) === */
.lp-stack { display: flex; flex-direction: column; }
.lp-row { display: flex; flex-direction: row; }
.lp-row-wrap { flex-wrap: wrap; }
.lp-gap-4 { gap: var(--space-1); }
.lp-gap-8 { gap: var(--space-2); }
.lp-gap-16 { gap: var(--space-4); }
.lp-gap-24 { gap: var(--space-6); }
.lp-gap-40 { gap: var(--space-12); }
.lp-gap-64 { gap: var(--space-16); }
.lp-align-start { align-items: flex-start; }
.lp-align-center { align-items: center; }
.lp-align-end { align-items: flex-end; }
.lp-align-stretch { align-items: stretch; }
.lp-justify-start { justify-content: flex-start; }
.lp-justify-center { justify-content: center; }
.lp-justify-end { justify-content: flex-end; }
.lp-justify-between { justify-content: space-between; }

.lp-page-column {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
  max-width: 720px;
  width: 100%;
  margin: 0 auto;
  padding: 40px 16px 64px;
  box-sizing: border-box;
}
@media (min-width: 768px) {
  .lp-page-column {
    padding: 40px 24px 64px;
  }
}
.lp-page-column-narrow { max-width: 400px; }
.lp-wizard-header { border-bottom: 0; padding: 0; }
.lp-page-sections { display: flex; flex-direction: column; gap: var(--space-12); }

.lp-page-header,
.lp-page-header-dcomp {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-2);
  text-align: start;
}
.lp-page-header-title,
.lp-page-description,
.lp-form-section-title,
.lp-form-section-desc,
.lp-item-title,
.lp-item-subtitle,
.lp-item-body,
.lp-empty-state,
.lp-section-header-title {
  text-align: start;
}

.lp-back-link {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  color: var(--text-muted);
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  min-height: 36px;
}
.lp-back-link:hover { color: var(--text); }

.lp-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
}
.lp-section-header-title {
  font-size: 16px;
  font-weight: 600;
  line-height: 24px;
  margin: 0;
}

.lp-form-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  border-top: 0;
  border-bottom: 0;
  padding: 0;
}
.lp-field { display: flex; flex-direction: column; gap: var(--space-2); }

.lp-action-bar {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  width: 100%;
}
.lp-action-bar .lp-btn {
  width: 100%;
  max-width: none;
}

/* D-SYS #14: Filled borderless 36x36 icon buttons */
.lp-icon-btn,
.lp-icon-btn-ghost,
.lp-icon-btn-outlined {
  width: 36px;
  height: 36px;
  min-width: 36px;
  min-height: 36px;
  padding: 0;
  border: 0;
  border-radius: var(--r2);
  background: var(--surface-control);
  color: var(--text);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 100ms ease, color 100ms ease;
}
.lp-icon-btn:hover,
.lp-icon-btn-ghost:hover,
.lp-icon-btn-outlined:hover {
  background: var(--surface-control-hover);
}
.lp-icon-btn:active,
.lp-icon-btn-ghost:active,
.lp-icon-btn-outlined:active {
  background: var(--surface-control-active);
}
.lp-icon-btn:active svg {
  transform: scale(0.92);
  transition: transform 100ms ease;
}
.lp-icon-btn[aria-pressed="true"],
.lp-icon-btn.is-selected {
  background: var(--surface-control-selected);
  color: var(--accent);
}
#theme-toggle.lp-icon-btn[aria-pressed="true"] {
  background: var(--surface-control);
  color: var(--text);
}
.lp-icon-toggle svg { transition: opacity 120ms ease, transform 120ms ease; }
@media (min-width: 768px) {
  .lp-admin-header-menu-btn,
  .lp-admin-header-mobile-only { display: none; }
}
@media (prefers-reduced-motion: reduce) {
  .lp-icon-btn,
  .lp-icon-btn svg,
  .lp-icon-toggle svg {
    transition-duration: 0.01ms !important;
    transform: none !important;
  }
}

/* D-I1 I8 & D-K2: List container has 0 horizontal padding and absorbs first/last Item vertical padding */
.lp-list,
.lp-item-list {
  --item-pad-y: 12px;
  padding: 0;
  border-top: 0;
}
.lp-list > .lp-item:first-child,
.lp-item-list > .lp-item:first-child {
  padding-top: 0;
}
.lp-list > .lp-item:last-child,
.lp-item-list > .lp-item:last-child {
  padding-bottom: 0;
}
.lp-list > .lp-item:first-child::before,
.lp-item-list > .lp-item:first-child::before {
  top: calc(-1 * var(--item-pad-y, 12px));
}
.lp-list > .lp-item:last-child::before,
.lp-item-list > .lp-item:last-child::before {
  bottom: calc(-1 * var(--item-pad-y, 12px));
}
.lp-popover-menu,
.lp-launcher-panel,
.lp-overlay-body {
  padding: 8px;
  border-top: 0;
}
.lp-item {
  position: relative;
  padding: var(--item-pad-y, 12px) 8px;
  border: 0;
}
.lp-item::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: var(--r2);
  background: transparent;
  z-index: 0;
  pointer-events: none;
  transition: background-color 120ms ease;
}
.lp-item > * { position: relative; z-index: 1; }
.lp-item:hover::before,
.lp-item.is-selected::before {
  background: var(--surface-control);
  border-radius: var(--r2);
}

/* D-SYS #2: Empty message regions take 0 height and 0 margin; remove stray hairlines */
.lp-status-line-slot:empty,
.lp-status-line:empty,
.lp-status-line[data-empty="true"]:has(.lp-status-line-text:empty),
.lp-page-notice-slot:empty,
.lp-help-text:empty,
.lp-field-error:empty {
  display: none;
  min-height: 0;
  padding: 0;
  margin: 0;
}
.lp-tabs,
.lp-tabs[role="tablist"] {
  border: 0;
}
.skip-link,
.lp-admin-header,
.lp-chip,
.lp-choice,
.lp-section-block,
.lp-gallery-section,
.lp-editor-toolbar,
.lp-editor-toolbar-center,
.lp-overlay-header,
.lp-overlay-footer {
  border: 0;
}
.lp-chip,
.lp-choice {
  background: var(--surface-control);
}
.lp-choice:has(input:checked),
.lp-choice.is-selected {
  background: var(--surface-control-selected);
}

/* D-SYS #11 & #15: Push panel overlay */
.lp-overlay-push-panel {
  position: fixed;
  top: 48px;
  left: 0;
  bottom: 0;
  width: 100%;
  z-index: var(--z-overlay);
  background: var(--surface-l1);
  border-right: 1px solid var(--border-subtle);
  transition: transform 240ms ease;
}
@media (min-width: 640px) {
  .lp-overlay-push-panel {
    width: 320px;
  }
}

/* === D-FINAL Design System (F1) === */
.lp-gap-tight { gap: 8px; }
.lp-gap-related { gap: 16px; }
.lp-gap-group { gap: 24px; }
.lp-gap-section { gap: 40px; }

/* Surfaces (F1) */
body { background: var(--surface-l0); color: var(--text-1); }
.lp-top-bar, .lp-admin-header, header[data-lp-shell-topbar] {
  background: var(--surface-l1);
  border-bottom: 1px solid var(--border-subtle);
}
.lp-popover-menu, .lp-launcher-panel, .lp-dialog-panel, .lp-overlay-sheet, .lp-format-bar {
  background: var(--surface-l1);
}
.lp-choice, .lp-icon-btn, .lp-icon-btn-ghost, .lp-icon-btn-outlined {
  background: var(--surface-l2);
}

/* Native controls styled from tokens (D-FINAL #4) */
select.lp-input, select.lp-select, input.lp-input, textarea.lp-input, textarea.lp-textarea, input.lp-choice-input {
  background-color: var(--surface-input);
  color: var(--text-1);
  border: 1px solid var(--border-control);
  color-scheme: inherit;
}
select.lp-input option, select.lp-select option, select.lp-input optgroup, select.lp-select optgroup {
  background-color: var(--surface-l1);
  color: var(--text-1);
}

/* 7 Type Roles (D-FINAL #8) */
.lp-page-title { font-size: 24px; font-weight: 600; color: var(--text-1); line-height: 32px; }
.lp-section-title, .lp-form-section-title, .lp-section-header-title { font-size: 16px; font-weight: 600; color: var(--text-1); line-height: 24px; }
.lp-item-title, .lp-field-label { font-size: 14px; font-weight: 600; color: var(--text-1); line-height: 20px; }
.lp-body, .lp-item-body { font-size: 14px; font-weight: 400; color: var(--text-1); line-height: 20px; margin: 0; }
.lp-line-clamp-3 { display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
.lp-description, .lp-page-description, .lp-form-section-desc { font-size: 14px; font-weight: 400; color: var(--text-2); line-height: 20px; margin: 0; }
.lp-caption, .lp-item-subtitle, .lp-item-meta, .lp-field-help, .lp-item-segment-heading { font-size: 12px; font-weight: 400; color: var(--text-2); line-height: 16px; margin: 0; }
.lp-prose { margin: 0; }
.lp-input::placeholder, .lp-textarea::placeholder, :disabled { color: var(--text-3); }

/* Relation gaps (D-FINAL #2) */
.lp-page-header { display: flex; flex-direction: column; gap: 8px; margin: 0; }
.lp-tabs { margin: 0; }
.lp-form-section { display: flex; flex-direction: column; gap: 16px; margin: 0; }
.lp-form-section.lp-gap-group { gap: 24px; }
.lp-form-section + .lp-form-section { margin-top: 0; }
.lp-form-section-header { display: flex; flex-direction: column; gap: 8px; }
.lp-field { display: flex; flex-direction: column; gap: 8px; margin: 0; }
.lp-field > .lp-field-label { display: block; position: static; margin: 0; }
.lp-field > .lp-input, .lp-field > .lp-select-wrap { display: block; position: relative; margin: 0; }
.lp-action-bar { margin-top: 0; }
.lp-item-actions .lp-action-bar { margin-top: 0; }

/* Item contract & hairlines (D-FINAL #5, #10, #24) */
.lp-item:not(:last-child) { border-bottom: 1px solid var(--border-subtle); }
.lp-item {
  display: grid;
  grid-template-columns: 1fr;
  gap: 4px;
}
.lp-item-title { order: 1; }
.lp-item-status { order: 2; }
.lp-item-subtitle { order: 3; }
.lp-item-body, .lp-item-segments { order: 4; }
.lp-item-meta { order: 5; }
.lp-item-actions { order: 6; }
@media (min-width: 640px) {
  .lp-item {
    grid-template-columns: 1fr auto;
    column-gap: 16px;
  }
  .lp-item-title { grid-column: 1; order: 1; }
  .lp-item-status { grid-column: 2; grid-row: 1; align-self: center; justify-self: end; order: 1; }
  .lp-item-subtitle, .lp-item-body, .lp-item-segments, .lp-item-meta, .lp-item-actions { grid-column: 1 / -1; }
}

/* Dialogs (D-FINAL #11, D-H H1) */
.lp-dialog-panel {
  container-type: inline-size;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}
.lp-dialog-header { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 0; }
.lp-dialog-body { padding: 0; }
.lp-dialog-footer, .lp-dialog-panel .lp-action-bar { display: flex; flex-direction: column; align-items: flex-start; gap: 8px; width: 100%; }
.lp-dialog-footer .lp-btn, .lp-dialog-panel .lp-action-bar .lp-btn {
  width: auto;
  min-width: 160px;
}
@container (max-width: 399px) {
  .lp-dialog-footer, .lp-dialog-panel .lp-action-bar { align-items: stretch; }
  .lp-dialog-footer .lp-btn, .lp-dialog-panel .lp-action-bar .lp-btn {
    width: 100%;
    min-width: 0;
  }
}

/* SegmentedControl (D-FINAL #15) */
.lp-segmented-control {
  display: inline-flex;
  align-items: center;
  height: 36px;
  padding: 0;
  border-radius: 4px;
  background: var(--surface-l2);
  gap: 4px;
}
.lp-segment-btn {
  height: 36px;
  padding: 0 8px;
  border: 1px solid transparent;
  border-radius: 4px;
  background: transparent;
  color: var(--text-2);
  font-family: var(--font-sans);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}
@media (min-width: 640px) {
  .lp-segment-btn { padding: 0 16px; }
}
.lp-segment-btn.is-selected {
  background: var(--surface-l0);
  color: var(--text-1);
}

/* Tag chip (D-FINAL #18) */
.lp-tag {
  display: inline-flex;
  align-items: center;
  height: 28px;
  padding: 0 0 0 8px;
  border-radius: 4px;
  background: var(--surface-l2);
  color: var(--text-2);
  font-size: 12px;
  font-weight: 400;
  border: 0;
  animation: lp-tag-enter 160ms var(--ease-out);
}
.lp-tag-remove {
  width: 36px;
  height: 36px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 0;
  background: transparent;
  color: var(--text-2);
  cursor: pointer;
}
@keyframes lp-tag-enter {
  from { opacity: 0; transform: scale(0.96); }
  to { opacity: 1; transform: scale(1); }
}

/* Level 4-segment progress bar (D-FINAL #18) */
.lp-level { display: flex; flex-direction: column; gap: 8px; }
.lp-level-bar { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
.lp-level-segment { display: flex; flex-direction: column; gap: 4px; }
.lp-level-bar-fill { height: 4px; border-radius: 4px; background: var(--surface-l2); }
.lp-level-segment.is-done .lp-level-bar-fill { background: var(--accent); }
.lp-level-label { font-size: 12px; font-weight: 400; color: var(--text-2); line-height: 16px; }
.lp-level-segment.is-current .lp-level-label { font-weight: 600; color: var(--text-1); }

/* D-FINAL #15, #16, D-H H5: Editor header row (1fr auto 1fr), Edit prose, details line, format bar */
.lp-editor-header-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  align-items: center;
  min-height: 56px;
  height: 56px;
  padding: 0 12px;
  background: var(--surface-l0);
  border-bottom: 0;
  gap: 4px;
}
.lp-editor-toolbar-sticky {
  position: sticky;
  top: 60px;
  z-index: var(--z-sticky);
  background: var(--surface-l0);
}
.lp-editor-toolbar-left { justify-self: start; display: flex; align-items: center; gap: 8px; }
.lp-editor-toolbar-center-slot { justify-self: center; display: flex; align-items: center; }
.lp-editor-toolbar-right { justify-self: end; display: flex; align-items: center; gap: 4px; }
@media (min-width: 640px) {
  .lp-editor-toolbar-right { gap: 8px; }
  .lp-editor-mobile-only { display: none; }
}
@media (max-width: 639px) {
  .lp-editor-desktop-only { display: none; }
  .lp-editor-toolbar-right .lp-btn { padding: 0 8px; }
}
.lp-editor-title-input {
  width: 100%;
  resize: none;
  overflow: hidden;
  white-space: pre-wrap;
  overflow-wrap: break-word;
  background: transparent;
  color: var(--text-1);
  border: 0;
  padding: 0;
}
.lp-editor-details-line {
  display: inline-block;
  max-width: 100%;
  text-align: left;
  text-decoration: none;
  background: transparent;
  border: 0;
  padding: 0;
  font-size: 12px;
  line-height: 16px;
  color: var(--text-2);
  cursor: pointer;
}
.lp-prose .ProseMirror {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.lp-prose .ProseMirror > * { margin: 0; }
.lp-prose .ProseMirror h1,
.lp-prose .ProseMirror h2,
.lp-prose .ProseMirror h3 {
  padding-top: 8px;
}
.lp-format-bar {
  position: fixed;
  bottom: calc(16px + var(--vv-bottom, 0px));
  left: 0;
  right: 0;
  margin: 0 auto;
  width: fit-content;
  z-index: var(--z-overlay);
  background: var(--surface-l1);
  box-shadow: var(--shadow-overlay);
  border-radius: 8px;
  padding: 4px 8px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
@media (min-width: 768px) {
  .lp-editor-drawer:not([hidden]) + .lp-editor-main-fullscreen .lp-format-bar {
    left: 260px;
  }
}

.lp-canary-center { text-align: center; }
.lp-canary-empty-tall { height: 48px; }
.lp-canary-gap-80 { display: flex; flex-direction: column; gap: 80px; }
.lp-canary-hairline { border-bottom: 1px solid var(--border-subtle); padding: 8px 0; }
.lp-canary-zero-pad-clip { padding: 0; overflow: hidden; }
.lp-canary-outlined-icon-btn { border: 1px solid var(--border-control); background: transparent; }
.lp-canary-wide-row { display: flex; width: 100%; overflow: hidden; }
.lp-canary-wide-btn { min-width: 400px; }
.lp-canary-btn-narrow { width: 160px !important; max-width: 160px !important; }
.lp-canary-formatting-offcenter { position: relative; }
.lp-canary-bar-offset { position: fixed; left: 0; bottom: 16px; width: 200px; }


/* =========================================================
 * WP-16.G D-G Container Queries, Geometry, Overlays & Roles
 * ========================================================= */

.lp-list,
.lp-item-list,
.lp-admin-main,
.lp-entries-drawer,
.lp-overlay-sheet,
.lp-gallery-root {
  container-type: inline-size;
}

/* Item geometry & container-based stacking (D-G #7, #8) */
.lp-item {
  width: 100%;
  box-sizing: border-box;
  margin: 0;
  padding: var(--item-pad-y, 12px) 8px;
  display: grid;
  grid-template-columns: 1fr auto;
  row-gap: 8px;
  column-gap: 12px;
  align-items: start;
}
.lp-item-title { grid-column: 1; grid-row: 1; order: 1; }
.lp-item-status { grid-column: 2; grid-row: 1; align-self: center; justify-self: end; display: inline-flex; align-items: center; gap: 8px; order: 2; }
.lp-item-subtitle { grid-column: 1 / -1; order: 3; }
.lp-item-body, .lp-item-segments { grid-column: 1 / -1; order: 4; }
.lp-item-meta { grid-column: 1 / -1; order: 5; }
.lp-item-actions { grid-column: 1 / -1; order: 6; }

.lp-item-segments { display: flex; flex-direction: column; gap: 16px; }
.lp-item-segment { display: flex; flex-direction: column; gap: 4px; }
.lp-item-segment-heading { font-size: 12px; font-weight: 400; color: var(--text-2); line-height: 16px; }

@container (max-width: 399px) {
  .lp-item {
    grid-template-columns: 1fr;
  }
  .lp-item-status {
    grid-column: 1;
    grid-row: 2;
    justify-self: stretch;
    justify-content: space-between;
  }
  .lp-item.lp-item-trailing-status,
  .lp-item.lp-item-trailing-status .lp-item-content {
    grid-template-columns: 1fr auto;
    column-gap: 16px;
  }
  .lp-item.lp-item-trailing-status .lp-item-status {
    grid-column: 2;
    grid-row: 1;
    justify-self: end;
    justify-content: flex-end;
  }
}

/* Subsection & ActionBar spacing (D-G #10) */
.lp-subsection-title { font-size: 14px; font-weight: 600; color: var(--text-1); line-height: 20px; margin: 0; }
.lp-subsection-intro { font-size: 14px; font-weight: 400; color: var(--text-2); line-height: 20px; margin: 0; }
#ref-claims-list.lp-is-empty, #ref-evidence-list.lp-is-empty { display: none; }
.lp-subsection.lp-stack.lp-gap-group { gap: 24px; }
.lp-subsection.lp-stack.lp-gap-group.lp-gap-related { gap: 16px; }

/* Select chevron vertically centred at 12px from right (D-G #11) */
.lp-select-wrap { position: relative; width: 100%; }
.lp-select-wrap select.lp-select {
  appearance: none;
  -webkit-appearance: none;
  background-image: none;
  padding-right: 36px;
}
.lp-select-chevron {
  position: absolute;
  right: 12px;
  top: 0;
  bottom: 0;
  margin: auto 0;
  height: 16px;
  width: 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  color: var(--text-2);
}

/* Text button & Disabled button weight (D-G #3, #11, D-H H8) */
.lp-btn.lp-btn-text,
.lp-btn-text {
  background: transparent;
  background-color: transparent;
  border: 0;
  color: var(--accent);
  padding: 0 8px;
  white-space: normal;
  text-align: left;
  height: auto;
  min-height: var(--control-height);
  font-weight: 600;
}
.lp-btn.lp-btn-text:hover:not(:disabled),
.lp-btn-text:hover:not(:disabled) {
  background: var(--surface-l2);
}
.lp-btn:disabled {
  font-weight: 600;
  color: var(--text-3);
}

/* Segmented track & 4px inset thumb + responsive icons (D-G #12, D-H H1, H7) */
.lp-segmented-control,
.lp-choice-variant-segmented .lp-choice-list {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: 1fr;
  padding: 4px;
  border-radius: var(--r2);
  background: var(--surface-l2);
  gap: 4px;
  height: var(--control-height);
  min-height: var(--control-height);
  box-sizing: border-box;
  align-items: center;
}
.lp-segment-btn,
.lp-choice-variant-segmented .lp-choice {
  height: calc(var(--control-height) - 8px);
  min-height: calc(var(--control-height) - 8px);
  min-width: 36px;
  padding: 0 8px;
  border: 1px solid transparent;
  border-radius: var(--r1);
  background: transparent;
  color: var(--text-2);
  font-family: var(--font-sans);
  font-size: 14px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  cursor: pointer;
  transition: background-color 160ms var(--ease-out), color 160ms var(--ease-out);
}
@media (min-width: 640px) {
  .lp-segment-btn,
  .lp-choice-variant-segmented .lp-choice { padding: 0 16px; }
}
.lp-segment-btn.is-selected,
.lp-choice-variant-segmented .lp-choice.is-selected {
  background: var(--surface-l0);
  color: var(--text-1);
}
.lp-segmented-responsive-icons .lp-segment-label { display: none; }
.lp-segmented-responsive-icons .lp-segment-icon { display: inline-flex; align-items: center; }
@media (min-width: 640px) {
  .lp-segmented-responsive-icons .lp-segment-label { display: inline; }
  .lp-segmented-responsive-icons .lp-segment-icon { display: none; }
}

/* Tag symmetric ink inset (D-H H4) */
.lp-tag {
  padding: 0 8px;
  font-size: 12px;
  font-weight: 400;
  height: 28px;
  border-radius: var(--r1);
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.lp-tag:has(.lp-tag-remove),
.lp-tag.lp-tag-removable {
  padding: 0 4px 0 8px;
}
.lp-tag-remove {
  width: auto;
  min-width: 0;
  height: 28px;
  padding: 0 4px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

/* Overlays 1px outline & directional shadow (D-G #6) */
.lp-popover-menu,
.lp-launcher-panel,
.lp-dialog-panel,
.lp-overlay-sheet,
.lp-format-bar {
  border: 1px solid var(--border-overlay);
}
.lp-popover-menu,
.lp-launcher-panel {
  box-shadow: var(--shadow-e1);
}
.lp-editor-drawer {
  border: 0;
  border-right: 1px solid var(--border-overlay);
  box-shadow: none;
}
.lp-overlay-sheet,
.lp-format-bar {
  box-shadow: var(--shadow-e1-up);
}
.lp-dialog-panel {
  box-shadow: var(--shadow-e2);
}

/* Sticky editor header at top 60px (D-H H5) */
.lp-editor-toolbar-sticky {
  top: 60px;
}

/* Visually-hidden screen-reader-only utility (D-H H10, zero margin) */
.lp-sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  clip-path: inset(50%);
  white-space: nowrap;
  border: 0;
}

/* Setup wizard 2px progress bar (D-H H10) */
.lp-auth-progress-track {
  height: 2px;
  width: 100%;
  background: var(--surface-l2);
  overflow: hidden;
}
.lp-auth-progress-fill {
  height: 100%;
  background: var(--accent);
  width: 16.667%;
  transition: width 160ms var(--ease-out);
}
.lp-auth-progress-fill[data-step="1"] { width: 16.667%; }
.lp-auth-progress-fill[data-step="2"] { width: 33.333%; }
.lp-auth-progress-fill[data-step="3"] { width: 50%; }
.lp-auth-progress-fill[data-step="4"] { width: 66.667%; }
.lp-auth-progress-fill[data-step="5"] { width: 83.333%; }
.lp-auth-progress-fill[data-step="6"] { width: 100%; }

/* Gallery outline mode (?outline=1, D-G #9) */
.lp-outline-mode [data-c] {
  outline: 1px dashed var(--accent);
  outline-offset: 2px;
}

/* =========================================================
 * WP-16.I D-I1 ActionBar (page | dialog | item) & Gallery Overlays
 * ========================================================= */

.lp-action-bar-page,
.lp-action-bar-dialog,
.lp-dialog-footer,
.lp-dialog-panel .lp-action-bar {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 8px;
  width: 100%;
}

.lp-action-bar-page .lp-btn:not(.lp-btn-text),
.lp-action-bar-dialog .lp-btn:not(.lp-btn-text),
.lp-dialog-footer .lp-btn:not(.lp-btn-text),
.lp-dialog-panel .lp-action-bar .lp-btn:not(.lp-btn-text) {
  width: 100%;
  min-width: 0;
  max-width: none;
}

.lp-action-bar-page .lp-btn-text,
.lp-action-bar-dialog .lp-btn-text,
.lp-dialog-footer .lp-btn-text,
.lp-dialog-panel .lp-action-bar .lp-btn-text {
  width: auto;
  min-width: 0;
  align-self: center;
}

.lp-form-section,
.lp-subsection {
  container-type: inline-size;
}
.lp-action-bar-item,
.lp-item-actions .lp-action-bar {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-start;
  gap: 8px;
  width: 100%;
}

.lp-action-bar-item .lp-btn:not(.lp-btn-text),
.lp-item-actions .lp-action-bar .lp-btn:not(.lp-btn-text) {
  width: auto;
  min-width: 96px;
  max-width: none;
}

.lp-action-bar-item .lp-btn-text,
.lp-item-actions .lp-action-bar .lp-btn-text {
  width: auto;
  min-width: 0;
  align-self: center;
}

.lp-gallery-overlay-sample {
  position: relative;
  display: block;
  width: 100%;
  max-width: 420px;
  inset: auto;
  z-index: 1;
}
.lp-gallery-overlay-sample .lp-overlay-backdrop {
  display: none;
}
.lp-gallery-overlay-sample .lp-overlay-surface,
.lp-gallery-panel-sample {
  position: relative;
  width: 100%;
  max-width: 100%;
  inset: auto;
  transform: none;
}
.lp-gallery-panel-sample {
  max-width: 280px;
  background: var(--surface-overlay);
  border: 0;
  border-right: 1px solid var(--border-overlay);
  padding: 16px 12px;
}
.lp-level-next {
  display: inline-flex;
  align-items: center;
  justify-content: flex-start;
  gap: 4px;
  width: auto;
  align-self: flex-start;
  padding-left: 0;
  padding-right: 0;
}
`;
