import { THEME_CSS, BREAKPOINTS } from './tokens/index.js';

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
  font-size: var(--text-ui-size, var(--lp-space-16));
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
}

/* §12.2 Accessible visible focus */
:focus-visible {
  outline: var(--lp-space-2) solid var(--focus-ring);
  outline-offset: var(--lp-space-2);
}

/* §12.4 Surface Craft: Selection & Text Wrapping (Finding 20261020-UI-09) */
::selection {
  background-color: var(--accent);
  color: var(--text-on-accent, var(--lp-color-text-on-accent));
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
  text-underline-offset: var(--lp-border-role-rule);
  transition: color var(--duration-fast, var(--lp-motion-duration-item)) ease;
}

/* §12.4 Semantic Typography Scale (Finding 20261020-UI-02) */
.text-display {
  font-family: var(--font-reading);
  font-size: var(--lp-font-size-24));
  font-weight: 500;
  line-height: 1.4;
}

.text-h1 {
  font-family: var(--font-reading);
  font-size: var(--lp-font-size-24));
  font-weight: 600;
  line-height: 1.25;
}

.text-h2 {
  font-family: var(--font-reading);
  font-size: var(--lp-font-size-16));
  font-weight: 600;
  line-height: 1.3;
}

.text-h3 {
  font-family: var(--font-reading);
  font-size: var(--lp-font-size-16));
  font-weight: 600;
  line-height: 1.35;
}

.text-body {
  font-family: var(--font-reading);
  font-size: var(--lp-font-size-16));
  font-weight: 400;
  line-height: 1.65;
  max-width: var(--measure-reading, 68ch);
}

.text-ui {
  font-family: var(--font-ui);
  font-size: var(--lp-font-size-14));
  font-weight: 400;
  line-height: 1.5;
}

.text-ui-sm {
  font-family: var(--font-ui);
  font-size: var(--lp-font-size-14));
  font-weight: 400;
  line-height: 1.45;
}

.text-code {
  font-family: var(--font-code);
  font-size: var(--lp-font-size-14));
  font-weight: 400;
  line-height: 1.6;
}

/* Header & Navigation */
.site-header {
  border-bottom: var(--lp-border-hairline) solid var(--rule);
  background: var(--surface-page);
  padding: var(--space-4) var(--space-6);
}

.site-nav {
  max-width: var(--size-layout-max, var(--lp-size-layout-max));
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
  font-size: var(--lp-font-size-16));
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
  font-size: var(--lp-font-size-14));
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
  border: var(--lp-border-hairline) solid var(--border-control, var(--rule));
  border-radius: var(--radius-control);
  padding: var(--space-2) var(--space-3);
  cursor: pointer;
  font-family: var(--font-ui);
  font-size: var(--lp-font-size-14));
  min-height: var(--lp-size-hit-area);
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

/* Main container */
.site-main {
  max-width: var(--size-layout-max, var(--lp-size-layout-max));
  margin: 0 auto;
  padding: var(--space-8) var(--space-6) var(--space-18);
}

/* §12.4 Reading Measure & Typography */
.reading-column {
  font-family: var(--font-reading);
  font-size: var(--lp-font-size-16));
  line-height: 1.65;
  max-width: var(--measure-reading, 68ch);
}

.owner-statement {
  font-family: var(--font-reading);
  font-size: var(--lp-font-size-24));
  line-height: 1.4;
  font-weight: 500;
  max-width: 64ch;
  margin: 0;
}

/* §12.6 Strata Timeline — the one bold element */
.strata-section {
  background: var(--surface-raised);
  border: var(--lp-border-hairline) solid var(--rule);
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
  border-left: var(--lp-border-role-rule) solid var(--accent);
  padding: var(--space-2) var(--space-4);
  font-size: var(--lp-font-size-14));
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
  border-bottom: var(--lp-space-2) solid var(--rule);
}

.strata-layers {
  display: flex;
  align-items: flex-end;
  gap: var(--lp-space-2);
  min-height: var(--lp-size-140);
  position: relative;
  width: max-content;
  min-width: 100%;
}

.strata-band {
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  text-decoration: none;
  flex: 1 0 var(--lp-size-32);
  min-width: var(--lp-size-32);
  background: var(--surface-page);
  border: var(--lp-border-hairline) solid var(--rule);
  border-top: var(--lp-space-4) solid var(--accent);
  padding: var(--space-1) var(--space-2);
  cursor: pointer;
  text-align: left;
  color: var(--text);
  border-radius: var(--radius-chip);
  position: relative;
  transition: transform var(--duration-fast, var(--lp-motion-duration-item)) var(--ease-out),
              border-color var(--duration-fast, var(--lp-motion-duration-item)) ease,
              background-color var(--duration-fast, var(--lp-motion-duration-item)) ease;
}

.strata-band:hover {
  transform: translateY(calc(-1 * var(--lp-space-2)));
  outline: var(--lp-space-2) solid var(--focus-ring);
  outline-offset: var(--lp-space-2);
}

.strata-band:focus-visible {
  outline: var(--lp-space-2) solid var(--focus-ring);
  outline-offset: var(--lp-space-2);
  z-index: var(--lp-z-3);
}

/* Empty Month Hairline along Continuous Time Axis (Finding 20261020-UI-05) */
.strata-band.strata-band-empty {
  background: transparent;
  border: var(--lp-border-hairline) solid transparent;
  border-top: var(--lp-border-hairline) solid var(--rule);
  border-radius: 0;
  height: var(--lp-size-hit-area) !important;
  padding: var(--lp-space-2) var(--space-1);
  color: var(--text-muted);
}

.strata-band.strata-band-empty:hover {
  border-top-color: var(--accent);
  background: var(--surface-page);
}

.band-empty-hairline {
  width: 100%;
  height: var(--lp-border-hairline);
  background: var(--rule);
  margin-bottom: auto;
}

.band-ym-empty {
  font-size: var(--lp-size-11);
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
  border-top-color: var(--role-decision, var(--lp-color-role-decision));
  background: repeating-linear-gradient(
    -45deg,
    var(--surface-page),
    var(--surface-page) var(--lp-space-4),
    var(--surface-raised) var(--lp-space-4),
    var(--surface-raised) var(--lp-space-8)
  );
}

.strata-band[data-profile="design-project"],
.strata-band.profile-design-project {
  border-top-color: var(--role-outcome, var(--lp-color-role-outcome));
  background: radial-gradient(
    circle,
    var(--rule) var(--lp-size-1-5),
    var(--surface-page) var(--lp-size-1-5)
  );
  background-size: var(--lp-space-8) var(--lp-space-8);
}

/* Venture Notch on Top Edge */
.band-venture-notch {
  position: absolute;
  top: calc(-1 * var(--lp-space-4));
  right: var(--lp-space-4);
  width: var(--lp-space-8);
  height: var(--lp-space-4);
  background-color: var(--accent);
  border-radius: var(--lp-border-hairline);
}

/* As-Of Timeline Cursor */
.as-of-cursor {
  position: absolute;
  top: 0;
  bottom: 0;
  width: var(--lp-space-2);
  background-color: var(--accent);
  z-index: var(--lp-z-4);
  pointer-events: none;
  transition: left var(--duration-base, var(--lp-motion-duration-base)) var(--ease-out);
}

.as-of-cursor-handle {
  position: absolute;
  top: calc(-1 * var(--lp-space-24));
  left: 50%;
  transform: translateX(-50%);
  background: var(--accent);
  color: var(--text-on-accent, var(--lp-color-text-on-accent));
  font-size: var(--lp-size-11);
  font-weight: 600;
  padding: var(--lp-space-2) var(--lp-size-6);
  border-radius: var(--radius-chip);
  white-space: nowrap;
}

/* Future Dimmed Bands */
.strata-band[data-dimmed="true"] {
  border-top-color: var(--text-muted);
  background: repeating-linear-gradient(
    -45deg,
    var(--surface-page),
    var(--surface-page) var(--lp-size-6),
    var(--surface-raised) var(--lp-size-6),
    var(--surface-raised) var(--lp-space-12)
  );
  border-style: dashed;
  color: var(--state-future-text, var(--text-muted));
}

.strata-band .band-label-future {
  font-size: var(--lp-size-11);
  text-transform: uppercase;
  letter-spacing: var(--lp-size-0-5);
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
  font-size: var(--lp-size-11);
  color: var(--accent);
}

.strata-band .band-ym {
  font-weight: 700;
  font-size: var(--lp-size-14);
}

.strata-band .band-count {
  font-size: var(--lp-space-12);
  color: var(--text-muted);
}

.strata-legend {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-4);
  font-size: var(--lp-size-14);
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
  font-size: var(--lp-space-12);
  color: var(--text-muted);
}

.strata-legend-swatch {
  width: var(--lp-space-12);
  height: var(--lp-space-12);
  border-radius: var(--radius-chip);
}

/* Chips & Badges */
.chip {
  display: inline-flex;
  align-items: center;
  font-size: var(--lp-font-size-14));
  padding: var(--lp-border-role-rule) var(--space-2);
  border-radius: var(--radius-chip);
  border: var(--lp-border-hairline) solid var(--border-control, var(--rule));
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
  color: var(--text-on-accent, var(--lp-color-text-on-accent));
  border-color: var(--accent);
}

.chip-suggested,
.chip-provisional {
  border-style: dashed;
  border-color: var(--state-provisional-border, var(--text-muted));
  opacity: 0.85;
}

.chip-facet {
  font-size: var(--lp-size-14);
  font-family: var(--font-ui);
}

/* CommonMark / GFM Rendered Styles (F4, 20261020-UI-01) */
.code-block {
  font-family: var(--font-code);
  font-size: var(--lp-font-size-14));
  background: var(--surface-raised);
  border: var(--lp-border-hairline) solid var(--rule);
  border-left: var(--lp-border-role-rule) solid var(--accent);
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
  border: var(--lp-border-hairline) solid var(--rule);
  padding: var(--lp-border-hairline) var(--lp-space-4);
  border-radius: var(--radius-chip);
}

.reading-quote {
  border-left: var(--lp-border-role-rule) solid var(--accent);
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
  border: var(--lp-border-hairline) solid var(--rule);
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
  font-size: var(--lp-font-size-14));
}

.data-table th,
.data-table td {
  padding: var(--space-2) var(--space-3);
  border: var(--lp-border-hairline) solid var(--rule);
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

@media (min-width: ${BREAKPOINTS.viewport.lg}px) {
  .entry-detail-layout {
    grid-template-columns: minmax(0, var(--measure-reading, 68ch)) var(--rail-width, var(--lp-size-layout-rail-width));
    align-items: start;
  }

  .margin-rail {
    position: sticky;
    top: var(--space-6);
  }
}

.margin-rail {
  background: var(--surface-raised);
  border: var(--lp-border-hairline) solid var(--rule);
  padding: var(--space-4);
  border-radius: var(--radius-control);
}

/* §5.3 Later-thinking banner */
.later-thinking-banner {
  border: var(--lp-border-hairline) solid var(--status-warn);
  border-left: var(--lp-space-4) solid var(--status-warn);
  background: var(--surface-raised);
  padding: var(--space-3) var(--space-4);
  margin: 0;
  font-size: var(--lp-size-15);
}

/* §12.6 Ask Surface */
.ask-box {
  background: var(--surface-raised);
  border: var(--lp-border-hairline) solid var(--rule);
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
  font-size: var(--lp-font-size-14));
  font-family: var(--font-ui);
  border: var(--lp-border-hairline) solid var(--border-control, var(--rule));
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
  font-size: var(--lp-font-size-14));
  font-family: var(--font-ui);
  font-weight: 600;
  border-radius: var(--radius-control);
  border: var(--lp-border-hairline) solid var(--button-bg, var(--accent));
  background: var(--button-bg, var(--accent));
  color: var(--button-fg, var(--text-on-accent, var(--lp-color-text-on-accent)));
  cursor: pointer;
  min-height: var(--lp-size-hit-area);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  transition: opacity var(--duration-fast, var(--lp-motion-duration-item)) ease;
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
  color: var(--lp-color-text-on-accent);
}

.btn-sm {
  min-height: var(--lp-size-target-min);
  padding: var(--space-1) var(--space-4);
  font-size: var(--lp-size-14);
}

/* Responsive Admin Shell (20261020-UI-06, UI-07) */
.admin-shell {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-6);
}

/* Tablet 2-pane mode (768px - 1279px) */
@media (min-width: ${BREAKPOINTS.viewport.md}px) and (max-width: 1279px) {
  .admin-shell {
    grid-template-columns: 1fr var(--admin-inspector-width, var(--lp-size-admin-inspector-width));
    align-items: start;
  }
}

/* Desktop 3-pane mode (>= 1280px) */
@media (min-width: ${BREAKPOINTS.viewport.xl}px) {
  .admin-shell {
    grid-template-columns: var(--admin-nav-width, var(--lp-size-btn-action-max)) 1fr var(--admin-inspector-width, var(--lp-size-admin-inspector-width));
    align-items: start;
  }
}

.admin-pane {
  background: var(--surface-raised);
  border: var(--lp-border-hairline) solid var(--rule);
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
  border: var(--lp-border-hairline) solid var(--rule);
  border-radius: var(--radius-control);
  margin: 0;
  font-size: var(--lp-font-size-14));
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
  border: var(--lp-border-hairline) solid var(--rule);
  border-bottom: none;
  border-radius: var(--radius-control) var(--radius-control) 0 0;
}

.editor-toolbar button {
  padding: var(--lp-space-4) var(--lp-space-8);
  font-size: var(--lp-space-12);
  font-family: var(--font-ui);
  background: var(--surface-raised);
  border: var(--lp-border-hairline) solid var(--rule);
  border-radius: var(--radius-chip);
  cursor: pointer;
  color: var(--text);
  min-height: var(--lp-size-32);
}

.editor-textarea {
  min-height: var(--editor-min-height, 60vh);
  width: 100%;
  font-family: var(--font-code);
  font-size: var(--lp-font-size-14));
  padding: var(--space-3);
  border: var(--lp-border-hairline) solid var(--border-control, var(--rule));
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
  font-size: var(--lp-space-12);
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
  font-size: var(--lp-space-12);
  text-align: center;
  border: var(--lp-border-hairline) solid var(--rule);
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
  border-bottom: var(--lp-border-hairline) solid var(--rule);
  margin: 0;
  overflow-x: auto;
}

.inspector-tab-btn {
  background: none;
  border: none;
  border-bottom: var(--lp-space-2) solid transparent;
  padding: var(--space-2) var(--space-4);
  font-size: var(--lp-size-14);
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
  border-bottom: var(--lp-border-hairline) solid var(--rule);
  padding-bottom: var(--space-2);
}

.triage-step {
  padding: var(--space-1) var(--space-4);
  border-radius: var(--radius-chip);
  font-size: var(--lp-size-14);
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
  border: var(--lp-border-hairline) solid var(--rule);
  border-radius: var(--radius-control);
  font-size: var(--lp-space-12);
  margin: 0;
}

.key-badge {
  display: inline-block;
  padding: var(--lp-border-hairline) var(--lp-size-6);
  font-size: var(--lp-size-11);
  font-family: var(--font-code);
  font-weight: 700;
  background: var(--surface-raised);
  border: var(--lp-border-hairline) solid var(--rule);
  border-radius: var(--radius-chip);
  box-shadow: 0 var(--lp-border-hairline) 0 var(--lp-color-accent-subtle-ring);
  color: var(--text);
}

.triage-card {
  border: var(--lp-border-hairline) solid var(--rule);
  border-radius: var(--radius-control);
  padding: var(--space-3);
  margin: 0;
  background: var(--surface-raised);
  transition: border-color var(--duration-fast, var(--lp-motion-duration-item)) ease;
}

.triage-card.selected {
  border-color: var(--accent);
  box-shadow: 0 0 0 var(--lp-space-2) var(--focus-ring);
}

.triage-card.status-accepted {
  border-left: var(--lp-space-4) solid var(--role-outcome);
}

.triage-card.status-skipped {
  opacity: 0.5;
  border-left: var(--lp-space-4) solid var(--text-muted);
}

/* Accessibility Skip Link (UX-15) */
.skip-link {
  position: absolute;
  top: calc(-1 * var(--lp-size-bar-top-height));
  left: var(--space-2);
  background: var(--surface-raised);
  color: var(--accent);
  padding: var(--space-2) var(--space-4);
  z-index: var(--lp-z-skip);
  text-decoration: none;
  font-weight: 700;
  border: var(--lp-space-2) solid var(--accent);
  border-radius: var(--radius-control);
  transition: top var(--duration-fast, var(--lp-motion-duration-item)) ease;
}

.skip-link:focus {
  top: var(--space-2);
  outline: var(--lp-space-2) solid var(--focus-ring);
}

/* Accessibility Utility Classes (UX-15) */
.visually-hidden,
.sr-only {
  position: absolute !important;
  width: var(--lp-border-hairline) !important;
  height: var(--lp-border-hairline) !important;
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
    min-height: var(--lp-size-hit-area);
    min-width: var(--lp-size-hit-area);
  }
}

/* Differentiation Device: Two-layer Strata Date Glyph (Finding 20261020-UI-09) */
.strata-date-glyph {
  display: inline-flex;
  flex-direction: column;
  gap: var(--lp-space-2);
  width: var(--lp-size-14);
  height: var(--lp-size-10);
  vertical-align: middle;
  margin: 0;
}

.strata-glyph-layer {
  height: var(--lp-border-role-rule);
  border-radius: var(--lp-border-hairline);
  background: var(--accent);
  display: block;
}

.strata-glyph-layer.happened-layer {
  width: var(--lp-size-14);
}

.strata-glyph-layer.written-layer {
  width: var(--lp-size-14);
  background: var(--role-goal, var(--accent));
}

.strata-glyph-layer.written-layer.shifted {
  width: var(--lp-size-9);
  margin: 0;
  background: var(--role-friction, var(--lp-color-role-friction));
}

/* §12.1 Text-First Claim Items (deliberately avoids card grids, Finding 20261020-UI-08) */
.claim-item {
  padding: var(--space-3) 0;
  border-bottom: var(--lp-border-hairline) solid var(--rule);
}

.claim-item:last-child {
  border-bottom: none;
}

.claim-meta {
  font-family: var(--font-ui);
  font-size: var(--lp-font-size-14));
  color: var(--text-muted);
  margin: 0;
}

.claim-text {
  font-family: var(--font-reading);
  font-size: var(--lp-font-size-14));
  line-height: 1.5;
}

/* §12.3 & §12.4 Role Markers & Sections (Findings 20261020-UI-08, 20261020-UI-09) */
.role-marker {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: var(--lp-space-2) var(--space-2);
  font-family: var(--font-ui);
  font-size: var(--lp-font-size-14));
  font-weight: 600;
  border-radius: var(--radius-chip, var(--lp-space-2));
  border-left: var(--role-section-rule-width, var(--lp-border-role-rule)) solid var(--accent);
  background: var(--surface-raised);
  color: var(--text);
  margin: 0;
}

.role-section {
  margin: 0;
  padding-left: var(--space-4);
  border-left: var(--role-section-rule-width, var(--lp-border-role-rule)) solid var(--accent);
  transition: border-color var(--duration-fast, var(--lp-motion-duration-item)) ease;
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
  transition: background-color var(--duration-fast, var(--lp-motion-duration-item)) ease,
              border-color var(--duration-fast, var(--lp-motion-duration-item)) ease,
              color var(--duration-fast, var(--lp-motion-duration-item)) ease,
              transform var(--duration-fast, var(--lp-motion-duration-item)) ease;
}

.btn:active {
  transform: scale(0.98);
}

.chip {
  transition: background-color var(--duration-fast, var(--lp-motion-duration-item)) ease,
              border-color var(--duration-fast, var(--lp-motion-duration-item)) ease,
              color var(--duration-fast, var(--lp-motion-duration-item)) ease;
}

#editor-status-line .as-of-banner,
#editor-status-line .later-thinking-banner {
  margin: 0;
  padding: var(--lp-space-4) var(--lp-space-8);
  font-size: var(--lp-size-14);
  display: inline-flex;
  align-items: center;
  gap: var(--lp-space-8);
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
    animation-duration: var(--lp-motion-duration-instant) !important;
    transition-duration: var(--lp-motion-duration-instant) !important;
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
  width: var(--lp-space-16);
  height: var(--lp-space-16);
}

.lp-icon-20 {
  width: var(--lp-size-icon-md);
  height: var(--lp-size-icon-md);
}

.lp-icon-24 {
  width: var(--lp-space-24);
  height: var(--lp-space-24);
}

.lp-btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  font-family: var(--font-ui);
  font-size: var(--type-body-sm-size, var(--lp-size-14));
  line-height: var(--type-body-sm-line, var(--lp-size-icon-md));
  font-weight: 600;
  white-space: nowrap;
  border-radius: var(--r2);
  border: var(--lp-border-hairline) solid var(--border-control);
  padding: 0 var(--space-4);
  height: var(--control-height);
  min-height: var(--control-height);
  min-width: var(--lp-size-target-min);
  cursor: pointer;
  text-decoration: none;
  transition: opacity var(--duration-base, var(--lp-motion-duration-base)) ease, transform var(--duration-base, var(--lp-motion-duration-base)) ease;
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
  outline: var(--lp-space-2) solid var(--focus-ring);
  outline-offset: var(--lp-space-2);
}

.lp-btn:active:not(:disabled),
.lp-icon-btn:active:not(:disabled),
.lp-btn.is-active,
.lp-icon-btn.is-active {
  transform: translateY(var(--lp-border-hairline));
}

.lp-btn-sm {
  height: var(--control-height);
  min-height: var(--control-height);
  padding: 0 var(--space-4);
  font-size: var(--type-body-sm-size, var(--lp-size-14));
}

.lp-btn-primary {
  background: var(--button-bg, var(--accent));
  border-color: var(--button-bg, var(--accent));
  color: var(--button-fg, var(--text-on-accent, var(--lp-color-text-on-accent)));
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
  animation: lp-spin var(--lp-motion-duration-pulse) linear infinite;
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
  width: var(--lp-size-target-min);
  height: var(--lp-size-target-min);
  min-width: var(--lp-size-target-min);
  min-height: var(--lp-size-target-min);
  padding: 0;
  border-radius: var(--r2);
  border: var(--lp-border-hairline) solid var(--border-control);
  background: var(--surface-raised);
  color: var(--text);
  font-family: var(--font-ui);
  font-size: var(--type-body-sm-size, var(--lp-size-14));
  line-height: 1;
  cursor: pointer;
  transition: opacity var(--duration-base, var(--lp-motion-duration-base)) ease, transform var(--duration-base, var(--lp-motion-duration-base)) ease;
}

.lp-icon-btn-ghost {
  border: var(--lp-border-hairline) solid var(--border-control);
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
  border: var(--lp-border-hairline) solid var(--border-control);
  background: var(--surface-raised);
  color: var(--text);
}

.lp-icon-btn-outlined:hover:not(:disabled),
.lp-icon-btn-outlined.is-hover {
  background: var(--role-neutral-bg);
}

.lp-icon-btn-sm {
  width: var(--lp-size-target-min);
  height: var(--lp-size-target-min);
  min-width: var(--lp-size-target-min);
  min-height: var(--lp-size-target-min);
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
    inset: calc(-1 * var(--lp-space-4));
  }
}

.lp-chip {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-1);
  padding: var(--space-1) var(--space-2);
  border-radius: var(--lp-space-4);
  border: var(--lp-border-hairline) solid var(--border-control);
  background: var(--surface-raised);
  color: var(--text);
  font-family: var(--font-ui);
  font-size: var(--type-body-sm-size, var(--lp-size-14));
  line-height: var(--type-body-sm-line, var(--lp-size-icon-md));
  font-weight: 400;
  white-space: nowrap;
  cursor: default;
}

button.lp-chip {
  height: var(--lp-size-target-min);
  min-height: var(--lp-size-target-min);
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
  font-size: var(--type-body-sm-size, var(--lp-size-14));
  line-height: var(--type-body-sm-line, var(--lp-size-icon-md));
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
  font-size: var(--lp-size-14);
  font-weight: 400;
  color: var(--text);
  cursor: default;
}

.lp-status-dot {
  width: var(--lp-size-6);
  height: var(--lp-size-6);
  border-radius: var(--lp-size-999);
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
  min-height: var(--size-target-min, var(--lp-size-hit-area));
  padding: var(--space-1) 0;
  background: transparent;
  border: none;
  color: var(--text);
  font-family: var(--font-ui);
  font-size: var(--lp-font-size-14));
  font-weight: 600;
  cursor: pointer;
  text-align: left;
}

.lp-switch-track {
  position: relative;
  width: var(--lp-size-hit-area);
  height: var(--lp-space-24);
  border-radius: var(--lp-space-4);
  background: var(--surface-sunken);
  border: var(--lp-border-hairline) solid var(--border-control, var(--rule));
  display: inline-flex;
  align-items: center;
  padding: var(--lp-space-2);
}

.lp-switch[aria-checked="true"] .lp-switch-track {
  background: var(--accent);
  border-color: var(--accent);
}

.lp-switch-thumb {
  width: var(--lp-size-18);
  height: var(--lp-size-18);
  border-radius: var(--lp-space-4);
  background: var(--surface-raised);
  transition: transform var(--duration-fast, var(--lp-motion-duration-item)) ease;
}

.lp-switch[aria-checked="true"] .lp-switch-thumb {
  transform: translateX(var(--lp-size-icon-md));
}

.lp-field {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  margin: 0;
}

.lp-field-label {
  font-family: var(--font-ui);
  font-size: var(--lp-font-size-14));
  font-weight: 600;
  color: var(--text);
}

.lp-input {
  width: 100%;
  height: var(--control-height);
  min-height: var(--control-height);
  padding: 0 var(--space-2);
  font-family: var(--font-ui);
  font-size: var(--lp-size-14);
  font-weight: 400;
  color: var(--text);
  background: var(--surface-input);
  border: var(--lp-border-hairline) solid var(--field-border, var(--border-control, var(--rule)));
  border-radius: var(--r2);
}

.lp-textarea {
  height: auto;
  min-height: var(--lp-size-144);
  padding: var(--space-2);
  font-family: var(--font-ui);
  font-size: var(--lp-size-14);
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
  padding: 0 var(--lp-size-target-min) 0 var(--space-2);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.lp-select-chevron {
  position: absolute;
  right: var(--lp-space-12);
  pointer-events: none;
  color: var(--text-muted);
}

.lp-select option {
  padding: 0;
  gap: 0;
}

input[type="date"].lp-input {
  min-width: var(--lp-size-148);
}

.lp-field-has-error .lp-input {
  border-color: var(--status-error);
}

.lp-choice-label {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  min-height: var(--size-target-min, var(--lp-size-hit-area));
  font-family: var(--font-ui);
  font-size: var(--lp-font-size-14));
  color: var(--text);
  cursor: pointer;
}

.lp-choice-input {
  width: var(--lp-size-18);
  height: var(--lp-size-18);
  cursor: pointer;
}

.lp-field-help {
  margin: 0;
  font-size: var(--lp-space-12);
  color: var(--text-muted);
}

.lp-field-error {
  margin: 0;
  font-size: var(--lp-space-12);
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
  border: var(--lp-border-hairline) solid var(--rule);
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
  max-width: var(--lp-size-520);
}

/* WP-15.3 & WP-15.3a Feedback, Containers & Design Foundations */
.lp-card {
  background: var(--surface-raised);
  border: var(--lp-border-hairline) solid var(--border-subtle);
  border-radius: var(--radius-container);
  padding: var(--space-4);
}

.lp-card-section {
  padding-top: var(--space-4);
  margin: 0;
  border-top: var(--lp-border-hairline) solid var(--border-subtle);
}

.lp-notice {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-4);
  padding: var(--space-4);
  border-radius: var(--radius-container);
  border: var(--lp-border-hairline) solid var(--border-subtle);
  background: var(--role-neutral-bg);
  color: var(--role-neutral-fg);
  font-size: var(--type-body-sm-size, var(--lp-size-14));
  line-height: var(--type-body-sm-line, var(--lp-size-icon-md));
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
  font-size: var(--type-body-sm-size, var(--lp-size-14));
  line-height: var(--type-body-sm-line, var(--lp-size-icon-md));
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
  min-height: var(--lp-size-target-min);
  font-size: var(--type-body-sm-size, var(--lp-size-14));
  line-height: var(--type-body-sm-line, var(--lp-size-icon-md));
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
  height: var(--lp-size-target-min);
  min-height: var(--lp-size-target-min);
  min-width: var(--lp-size-target-min);
  background: transparent;
  border: none;
  padding: 0 var(--space-1);
  color: var(--accent);
  font-family: var(--font-ui);
  font-size: var(--type-body-sm-size, var(--lp-size-14));
  line-height: var(--type-body-sm-line, var(--lp-size-icon-md));
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
  background: var(--lp-color-surface-backdrop);
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
  max-width: var(--lp-size-480);
  background: var(--surface-overlay, var(--surface-raised));
  border: var(--lp-border-hairline) solid var(--border-subtle);
  border-radius: var(--radius-overlay);
  box-shadow: var(--shadow-overlay);
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.lp-drawer-panel {
  width: 100%;
  max-width: var(--admin-inspector-width, var(--lp-size-admin-inspector-width));
  height: 100%;
  background: var(--surface-overlay, var(--surface-raised));
  border-left: var(--lp-border-hairline) solid var(--border-subtle);
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
  font-size: var(--type-title-size, var(--lp-size-icon-md));
  line-height: var(--type-title-line, var(--lp-size-28));
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
  border-top: var(--lp-border-hairline) solid var(--border-subtle);
  border-radius: 0;
  background: transparent;
  padding: 0;
}

.lp-disclosure-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  min-height: var(--size-target-min, var(--lp-size-hit-area));
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
  transition: transform var(--duration-base, var(--lp-motion-duration-base)) ease;
}

.lp-disclosure[open] .lp-disclosure-chevron {
  transform: rotate(180deg);
}

.lp-disclosure-meta {
  font-weight: 400;
  color: var(--text-muted);
  font-size: var(--type-body-sm-size, var(--lp-size-14));
}

.lp-disclosure-body {
  padding: var(--space-4) 0;
  border-top: var(--lp-border-hairline) solid var(--border-subtle);
}

.lp-popover-menu {
  background: var(--surface-overlay, var(--surface-raised));
  border: var(--lp-border-hairline) solid var(--border-subtle);
  border-radius: var(--lp-space-8);
  box-shadow: var(--shadow-overlay);
  padding: var(--space-2);
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  min-width: var(--lp-size-180);
}

.lp-tablist {
  display: flex;
  flex-wrap: nowrap;
  gap: var(--space-4);
  border-bottom: var(--lp-border-hairline) solid var(--border-subtle);
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
  border-bottom: var(--lp-space-2) solid transparent;
  border-radius: var(--lp-space-4) var(--lp-space-4) 0 0;
  padding: 0 var(--space-2);
  height: var(--lp-size-target-min);
  min-height: var(--lp-size-target-min);
  font-family: var(--font-ui);
  font-size: var(--lp-size-14);
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
  font-size: var(--type-body-sm-size, var(--lp-size-14));
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
  border-bottom: var(--lp-border-hairline) solid var(--border-subtle);
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
  font-size: var(--type-title-size, var(--lp-size-icon-md));
  line-height: var(--type-title-line, var(--lp-size-28));
  font-weight: 600;
}

.lp-empty-body {
  margin: 0;
  color: var(--text-muted);
  font-size: var(--type-body-sm-size, var(--lp-size-14));
  line-height: var(--type-body-sm-line, var(--lp-size-icon-md));
}

.lp-empty-guide {
  padding-top: var(--space-4);
  border-top: var(--lp-border-hairline) solid var(--border-subtle);
}

.lp-empty-guide-steps {
  margin: 0;
  padding: 0 0 0 var(--space-6);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  font-size: var(--type-body-sm-size, var(--lp-size-14));
  line-height: var(--type-body-sm-line, var(--lp-size-icon-md));
}

.lp-writing-surface,
.lp-writing-surface-field textarea.lp-input {
  font-family: var(--font-reading);
  font-size: var(--type-body-size, var(--lp-space-16));
  line-height: var(--type-body-line, var(--lp-space-24));
  max-width: var(--measure-reading, 68ch);
}

.lp-type-page-title {
  font-size: var(--type-page-title-size, var(--lp-space-24));
  line-height: var(--type-page-title-line, var(--lp-size-32));
  font-weight: 600;
}

.lp-type-title {
  font-size: var(--type-title-size, var(--lp-space-16));
  line-height: var(--type-title-line, var(--lp-space-24));
  font-weight: 600;
}

.lp-type-body {
  font-size: var(--type-body-size, var(--lp-space-16));
  line-height: var(--type-body-line, var(--lp-space-24));
  font-weight: 400;
}

.lp-type-body-sm {
  font-size: var(--type-body-sm-size, var(--lp-size-14));
  line-height: var(--type-body-sm-line, var(--lp-size-icon-md));
  font-weight: 500;
}

.lp-type-caption {
  font-size: var(--type-caption-size, var(--lp-space-12));
  line-height: var(--type-caption-line, var(--lp-space-16));
  font-weight: 400;
  color: var(--text-muted);
}

/* D-FOUND-3 Admin Header & Foundations Gallery */
.lp-admin-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  height: var(--lp-size-bar-top-height);
  min-height: var(--lp-size-bar-top-height);
  max-height: var(--lp-size-bar-top-height);
  padding: var(--lp-space-12);
  background: var(--surface-page);
  border-bottom: var(--lp-border-hairline) solid var(--border-subtle);
}

.lp-admin-header .lp-icon-btn,
.lp-admin-header .lp-icon-btn-ghost {
  width: var(--lp-size-target-min);
  height: var(--lp-size-target-min);
  min-width: var(--lp-size-target-min);
  min-height: var(--lp-size-target-min);
  border-radius: var(--r2);
}

.lp-admin-header-brand {
  font-family: var(--font-ui);
  font-size: var(--type-body-size, var(--lp-space-16));
  line-height: var(--type-body-line, var(--lp-space-24));
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
  font-size: var(--type-body-sm-size, var(--lp-size-14));
  line-height: var(--type-body-sm-line, var(--lp-size-icon-md));
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

@media (max-width: ${BREAKPOINTS.viewport.md - 1}px) {
  .lp-admin-header {
    height: var(--lp-size-bar-top-height);
    min-height: var(--lp-size-bar-top-height);
    max-height: var(--lp-size-bar-top-height);
    padding: var(--lp-space-12);
  }
  .lp-admin-header-desktop-only,
  .lp-admin-header-nav {
    display: none;
  }
  .lp-admin-header-mobile-only {
    display: inline-flex;
  }
  .lp-notice-action-link {
    min-width: var(--lp-size-hit-area);
    min-height: var(--lp-size-hit-area);
  }
}

.lp-details-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--space-4);
}

@media (min-width: ${BREAKPOINTS.viewport.md}px) {
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
  z-index: var(--lp-z-modal);
  display: flex;
  justify-content: center;
  padding: var(--space-2) var(--space-4);
  background: var(--surface-raised);
  border-bottom: var(--lp-space-2) solid var(--status-warn-border);
  font-size: var(--type-body-sm-size);
}

.lp-modal-inline-stage {
  position: relative;
  inset: auto;
  z-index: var(--lp-z-raised);
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
  z-index: var(--lp-z-20);
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-control);
  background: var(--text);
  color: var(--surface-raised);
  font-family: var(--font-ui);
  font-size: var(--type-caption-size, var(--lp-space-12));
  line-height: var(--type-caption-line, var(--lp-space-16));
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
  border: var(--lp-border-hairline) solid var(--border-subtle);
  background: var(--surface-raised);
  font-size: var(--type-caption-size, var(--lp-space-12));
  line-height: var(--type-caption-line, var(--lp-space-16));
}

.lp-specimen-box-overlay {
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-overlay);
  border: var(--lp-border-hairline) solid var(--border-subtle);
  background: var(--surface-overlay, var(--surface-raised));
  box-shadow: var(--shadow-overlay);
  font-size: var(--type-caption-size, var(--lp-space-12));
  line-height: var(--type-caption-line, var(--lp-space-16));
}

.lp-specimen-surface-row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.lp-specimen-surface-chip {
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-control);
  font-size: var(--type-caption-size, var(--lp-space-12));
  line-height: var(--type-caption-line, var(--lp-space-16));
}

.lp-surface-chip-page {
  background: var(--surface-page);
  border: var(--lp-border-hairline) solid var(--border-subtle);
}

.lp-surface-chip-raised {
  background: var(--surface-raised);
  border: var(--lp-border-hairline) solid var(--border-subtle);
}

.lp-surface-chip-subtle {
  background: var(--surface-subtle);
  border: var(--lp-border-hairline) solid var(--border-subtle);
}

.lp-surface-chip-control-border {
  background: var(--surface-raised);
  border: var(--lp-border-hairline) solid var(--border-control);
}

.lp-spacing-bar-row {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--type-caption-size, var(--lp-space-12));
  line-height: var(--type-caption-line, var(--lp-space-16));
}

.lp-spacing-bar {
  height: var(--lp-space-8);
  background: var(--accent);
  border-radius: var(--radius-pill);
}

.lp-spacing-bar-4 { width: var(--lp-space-4); }
.lp-spacing-bar-8 { width: var(--lp-space-8); }
.lp-spacing-bar-12 { width: var(--lp-space-12); }
.lp-spacing-bar-16 { width: var(--lp-space-16); }
.lp-spacing-bar-24 { width: var(--lp-space-24); }
.lp-spacing-bar-32 { width: var(--lp-size-32); }
.lp-spacing-bar-48 { width: var(--lp-size-48); }
.lp-spacing-bar-64 { width: var(--lp-space-64); }

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
  font-size: var(--type-caption-size, var(--lp-space-12));
  line-height: var(--type-caption-line, var(--lp-space-16));
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
  font-size: var(--type-body-sm-size, var(--lp-size-14));
  line-height: var(--type-body-sm-line, var(--lp-size-icon-md));
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
  border-bottom: var(--lp-border-hairline) solid var(--border-subtle);
}

.lp-foundations-page {
  padding: var(--space-4) var(--gutter, var(--lp-space-16));
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
  max-width: var(--size-layout-max, var(--lp-size-layout-max));
  margin: 0 auto;
}

.lp-foundations-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(var(--lp-size-layout-list-col), 1fr));
  gap: var(--space-4);
}

.lp-specimen-swatch {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-control);
  font-size: var(--type-body-sm-size, var(--lp-size-14));
  line-height: var(--type-body-sm-line, var(--lp-size-icon-md));
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
  border: var(--lp-border-hairline) solid var(--border-control);
  outline: var(--lp-space-2) solid var(--focus-ring);
  outline-offset: var(--lp-space-2);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-control);
}

.lp-admin-split-preview {
  display: grid;
  grid-template-columns: var(--lp-size-layout-list-col) minmax(0, var(--lp-size-layout-main-max));
  gap: var(--space-6);
  align-items: start;
}

@media (max-width: ${BREAKPOINTS.viewport.md - 1}px) {
  .lp-admin-split-preview {
    grid-template-columns: minmax(0, 1fr);
    gap: var(--space-4);
  }
}

.lp-preview-list-col {
  width: var(--lp-size-layout-list-col);
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
  border-bottom: var(--lp-border-hairline) solid var(--border-subtle);
}

.lp-preview-main-col {
  width: 100%;
  max-width: var(--lp-size-layout-main-max);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.lp-editor-canvas {
  background: var(--surface-raised);
  border: var(--lp-border-hairline) solid var(--border-subtle);
  border-radius: var(--radius-container);
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.lp-page-notice-slot {
  min-height: var(--lp-size-48);
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.lp-status-line-slot {
  min-height: var(--lp-space-24);
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
  font-size: var(--lp-size-14);
}

.lp-admin-body button,
.lp-admin-body input,
.lp-admin-body select,
.lp-admin-body textarea {
  font-family: inherit;
  font-size: var(--lp-size-14);
}

a.lp-admin-header-brand {
  text-decoration: none;
  min-height: var(--lp-size-hit-area);
  display: inline-flex;
  align-items: center;
}

.lp-admin-notice-slot {
  max-width: var(--size-layout-max, var(--lp-size-layout-max));
  margin: 0;
  padding: 0 var(--gutter, var(--lp-space-16));
}

.lp-editor-shell {
  max-width: var(--size-layout-max, var(--lp-size-layout-max));
  margin: 0 auto;
  padding: var(--space-4) var(--gutter, var(--lp-space-16)) var(--space-6);
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--space-4);
}

@media (max-width: ${BREAKPOINTS.viewport.md - 1}px) {
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

@media (min-width: ${BREAKPOINTS.viewport.md}px) {
  .lp-editor-shell {
    grid-template-columns: var(--lp-size-btn-action-max) minmax(0, var(--lp-size-layout-main-max));
    gap: var(--space-4);
    align-items: start;
  }

  .lp-sidebar-toggle {
    display: none;
  }
}

@media (min-width: var(--lp-size-1080)) {
  .lp-editor-shell {
    grid-template-columns: var(--lp-size-230) minmax(0, 1fr) var(--lp-size-310);
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
  min-height: var(--size-target-min, var(--lp-size-hit-area));
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
  max-width: var(--lp-size-layout-main-max);
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
  border-top: var(--lp-border-hairline) solid var(--border-subtle);
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

@media (min-width: ${BREAKPOINTS.viewport.md}px) {
  .lp-admin-header-mobile-only {
    display: none;
  }
}

.lp-menu-popover-float {
  position: absolute;
  right: 0;
  top: calc(100% + var(--lp-space-4));
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
  font-size: var(--type-body-size, var(--lp-space-16));
  line-height: var(--type-body-line, var(--lp-space-24));
  font-weight: 600;
}

.lp-publish-step p {
  margin: 0;
  font-size: var(--type-body-sm-size, var(--lp-size-14));
  line-height: var(--type-body-sm-line, var(--lp-size-icon-md));
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
  border: var(--lp-border-hairline) solid var(--border-subtle);
  border-radius: var(--radius-control);
  background: var(--surface-subtle);
  font-size: var(--type-body-sm-size, var(--lp-size-14));
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
  min-height: var(--lp-size-hit-area);
  display: inline-flex;
  align-items: center;
}

.lp-workspace-safety-bar {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  margin: 0;
  padding-top: var(--space-4);
  border-top: var(--lp-border-hairline) solid var(--border-subtle);
}

.lp-killswitch-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
  padding: var(--space-4);
  border: var(--lp-border-hairline) solid var(--border-subtle);
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
  border: var(--lp-border-hairline) solid var(--border-subtle);
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
  font-size: var(--type-body-size, var(--lp-space-16));
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
  border: var(--lp-border-hairline) solid var(--border-subtle);
  border-radius: var(--radius-control);
  background: var(--surface-subtle);
}

.lp-escalation-question {
  margin: 0;
  font-weight: 600;
  font-size: var(--type-body-sm-size, var(--lp-size-14));
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
  min-height: calc(100vh - var(--lp-size-57));
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
  font-size: var(--lp-space-12);
}

.lp-status-legend-label {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
}

.lp-admin-section-card {
  max-width: var(--lp-size-layout-main-max);
  background: var(--surface-raised);
  border: var(--lp-border-hairline) solid var(--border-subtle);
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

@media (max-width: ${BREAKPOINTS.viewport.md - 1}px) {
  .wizard-step-labels {
    display: none !important;
  }

  .lp-admin-rail-toggle {
    display: inline-flex;
  }

  .lp-admin-rail {
    position: fixed;
    top: var(--lp-size-57);
    left: 0;
    bottom: 0;
    z-index: var(--lp-z-50);
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
  max-width: var(--lp-size-840);
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
  border: var(--lp-border-hairline) solid var(--border-subtle);
  border-radius: var(--radius-container);
  padding: var(--space-4);
}

.lp-dashboard-explain-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, var(--lp-size-180)), 1fr));
  gap: var(--space-4);
  margin: 0;
}

.lp-dashboard-explain-grid dt {
  font-size: var(--lp-space-12);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-muted);
  margin: 0;
}

.lp-dashboard-explain-grid dd {
  margin: 0;
  font-size: var(--lp-size-14);
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
  font-size: var(--type-body-size, var(--lp-space-16));
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
  border: var(--lp-border-hairline) solid var(--border-subtle);
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
  max-width: var(--lp-size-920);
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
  gap: var(--lp-space-16);
  align-items: stretch;
  margin: 0;
}

@media (min-width: ${BREAKPOINTS.viewport.sm}px) {
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
  min-width: var(--lp-size-130);
}

.lp-entries-search-group {
  flex: 1;
  min-width: var(--lp-size-180);
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
  border: var(--lp-border-hairline) solid var(--border-subtle);
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
  gap: var(--lp-border-role-rule);
}

.lp-structure-step {
  width: var(--lp-size-10);
  height: var(--lp-size-6);
  border-radius: var(--lp-radius-r1);
  background: var(--border-subtle);
  display: inline-block;
}

.lp-structure-step.is-filled {
  background: var(--accent);
}

.lp-structure-label {
  font-size: var(--lp-space-12);
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
  font-size: var(--lp-space-24);
  line-height: var(--lp-size-32);
  font-weight: 600;
}

.lp-page-subtitle {
  margin: 0;
  font-size: var(--lp-size-14);
  color: var(--text-muted);
}

.lp-section-title {
  margin: 0;
  font-family: var(--font-ui);
  font-size: var(--lp-space-16);
  line-height: var(--lp-space-24);
  font-weight: 600;
}

.lp-section-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, var(--lp-size-admin-inspector-width)), 1fr));
  gap: var(--space-6);
}

.lp-section-block {
  padding-top: var(--space-6);
  border-top: var(--lp-border-hairline) solid var(--border-subtle);
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
  font-size: var(--lp-space-12);
  color: var(--text-muted);
}

.lp-body-sm {
  margin: 0;
  font-size: var(--lp-size-14);
  color: var(--text);
}

.lp-body-sm-muted {
  margin: 0;
  font-size: var(--lp-size-14);
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
  font-size: var(--lp-space-24);
  line-height: var(--lp-size-32);
  height: auto;
  min-height: var(--lp-size-target-min);
  border: 0;
}

@media (max-width: ${BREAKPOINTS.viewport.sm - 1}px) {
  .lp-editor-toolbar {
    flex-wrap: nowrap;
    padding: var(--lp-space-8) var(--lp-space-4);
    gap: var(--lp-space-4);
  }

  .lp-editor-view-switch .lp-tab {
    padding-left: var(--lp-space-8);
    padding-right: var(--lp-space-8);
  }

  .lp-editor-toolbar-status {
    display: none;
  }

  .lp-editor-toolbar-center {
    position: fixed;
    left: 0;
    right: 0;
    bottom: var(--vv-bottom, 0);
    z-index: var(--z-sticky);
    display: flex;
    flex-wrap: nowrap;
    overflow-x: auto;
    gap: var(--lp-space-4);
    padding: var(--lp-space-8) var(--lp-space-16);
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
  border: var(--lp-border-hairline) solid var(--border-subtle);
  border-radius: var(--lp-space-4);
  text-align: center;
  font-family: var(--font-code);
  font-size: var(--lp-space-12);
}

.lp-dropzone {
  padding: var(--space-4);
  border: var(--lp-border-hairline) solid var(--border-control);
  border-radius: var(--lp-space-4);
  text-align: center;
  background: var(--surface-subtle);
}

.lp-triage-item {
  padding: var(--space-4);
  border-top: var(--lp-border-hairline) solid var(--border-subtle);
}

.lp-status-line-ok {
  font-size: var(--lp-space-12);
  color: var(--status-ok);
}

.lp-status-line-danger {
  font-size: var(--lp-space-12);
  color: var(--status-error);
}

.lp-wizard-header {
  margin: 0;
  padding-bottom: var(--space-4);
  border-bottom: var(--lp-border-hairline) solid var(--border-subtle);
}

.lp-wizard-progress {
  height: var(--lp-space-4);
  background: var(--surface-subtle);
  border-radius: var(--lp-space-4);
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
  font-size: var(--lp-space-12);
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
  border: var(--lp-border-hairline) solid var(--border-subtle);
  background: var(--surface-subtle);
  border-radius: var(--lp-space-4);
}

.lp-qr-box {
  width: 100%;
  max-width: var(--lp-size-200);
  margin: 0;
  background: var(--lp-color-text-on-accent);
  padding: var(--space-2);
  border-radius: var(--lp-space-4);
  text-align: center;
}

.lp-radio-card {
  display: flex;
  align-items: flex-start;
  gap: var(--space-2);
  padding: var(--space-4);
  border: var(--lp-border-hairline) solid var(--border-subtle);
  background: var(--surface-subtle);
  border-radius: var(--lp-space-4);
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
  border: var(--lp-border-hairline) solid var(--border-subtle);
  border-radius: var(--lp-space-4);
  cursor: pointer;
}

.theme-card.is-selected {
  border: var(--lp-space-2) solid var(--accent);
  background: var(--surface-subtle);
}

.lp-checkbox-row {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--lp-size-14);
  font-weight: 600;
  cursor: pointer;
}

.lp-btn-flex {
  flex: 1;
  text-align: center;
}

.lp-inline-list {
  font-size: var(--lp-size-14);
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
  min-width: var(--lp-size-200);
}

.lp-entries-row {
  cursor: pointer;
}

.lp-admin-body h1,
.lp-admin-body .lp-type-h1 {
  font-family: var(--font-ui);
  font-size: var(--lp-space-24);
  line-height: 1.3;
  font-weight: 600;
}

.lp-admin-body h2,
.lp-admin-body h3,
.lp-admin-body .lp-type-h2,
.lp-admin-body .lp-type-h3 {
  font-family: var(--font-ui);
  font-size: var(--lp-space-16);
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
  max-width: var(--lp-size-layout-main-max);
  margin: 0 auto;
  padding: var(--lp-space-40) var(--lp-space-16) var(--lp-space-64);
}

@media (min-width: ${BREAKPOINTS.viewport.md}px) {
  .lp-page-column {
    padding: var(--lp-space-40) var(--lp-space-24) var(--lp-space-64);
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
  gap: var(--lp-space-16);
  flex-wrap: wrap;
}

.lp-page-description {
  margin: 0;
  color: var(--text-muted);
  font-size: var(--lp-size-14);
}

.lp-page-tabs-wrap,
.lp-tabs {
  margin: 0;
}

.lp-page-sections {
  display: flex;
  flex-direction: column;
  gap: var(--lp-space-40);
}

.lp-launcher-panel {
  position: fixed;
  top: var(--lp-size-48);
  left: 0;
  right: 0;
  z-index: var(--z-overlay);
  background: var(--surface-overlay);
  border-bottom: var(--lp-border-hairline) solid var(--border-subtle);
  box-shadow: var(--shadow-overlay);
  padding: var(--lp-space-16);
  display: flex;
  flex-direction: column;
  gap: var(--lp-space-16);
}

@media (min-width: ${BREAKPOINTS.viewport.md}px) {
  .lp-launcher-panel {
    position: absolute;
    top: calc(100% + var(--lp-space-4));
    left: 0;
    right: auto;
    min-width: var(--lp-size-btn-action-max);
    border: var(--lp-border-hairline) solid var(--border-subtle);
    border-radius: var(--lp-space-8);
  }
}

.lp-launcher-panel[hidden] {
  display: none;
}

.lp-launcher-group {
  display: flex;
  flex-direction: column;
  gap: var(--lp-space-4);
}

.lp-launcher-heading {
  font-size: var(--lp-space-12);
  font-weight: 600;
  color: var(--text-muted);
  padding: var(--lp-space-4) var(--lp-space-8);
}

.lp-launcher-item {
  display: flex;
  align-items: center;
  gap: var(--lp-space-8);
  height: var(--lp-size-target-min);
  padding: 0 var(--lp-space-8);
  border-radius: var(--lp-space-4);
  text-decoration: none;
  color: var(--text);
  font-size: var(--lp-size-14);
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
  border-top: var(--lp-border-hairline) solid var(--border-subtle);
  padding-top: var(--lp-space-8);
}

.lp-list {
  display: flex;
  flex-direction: column;
  gap: 0;
  border-top: var(--lp-border-hairline) solid var(--border-subtle);
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
  font-size: var(--lp-space-12);
  color: var(--text-muted);
}

.lp-choice-row {
  display: flex;
  align-items: center;
  gap: var(--lp-space-8);
  font-size: var(--lp-size-14);
  cursor: pointer;
}

/* === D-LAYOUT Full-Screen Editor === */
.lp-admin-shell-main-full {
  width: 100%;
  background: var(--surface-page);
}

.lp-editor-shell-fullscreen {
  position: relative;
  min-height: calc(100vh - var(--lp-size-48));
  background: var(--surface-page);
}

.lp-editor-fullscreen {
  display: flex;
  flex-direction: column;
  min-height: calc(100vh - var(--lp-size-48));
}

.lp-editor-toolbar {
  position: sticky;
  top: 0;
  z-index: var(--z-sticky);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--lp-space-8);
  flex-wrap: nowrap;
  min-height: var(--lp-size-48);
  padding: var(--lp-space-8) var(--lp-space-16);
  background: var(--surface-page);
}

.lp-editor-toolbar-left,
.lp-editor-toolbar-right {
  display: flex;
  align-items: center;
  gap: var(--lp-space-4);
  flex-wrap: nowrap;
}

.lp-editor-view-switch {
  display: inline-flex;
  align-items: center;
  gap: var(--lp-space-4);
}

.lp-format-bar {
  align-self: center;
  position: sticky;
  bottom: var(--lp-space-16);
  z-index: var(--z-sticky);
  display: inline-flex;
  align-items: center;
  gap: var(--lp-space-4);
  flex-wrap: nowrap;
  padding: var(--lp-space-4) var(--lp-space-8);
  background: var(--surface-overlay);
  border-radius: var(--radius-control);
  box-shadow: var(--shadow-overlay);
  transition: opacity var(--lp-motion-duration-base) var(--ease-out), transform var(--lp-motion-duration-base) var(--ease-out);
}

.lp-format-bar .lp-icon-btn:active {
  transform: scale(0.96);
  transition-duration: var(--lp-motion-duration-fast);
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
  max-width: var(--lp-size-760);
  margin: 0 auto;
  padding: var(--lp-space-40) var(--lp-space-16) var(--lp-space-64);
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--lp-space-16);
}

@media (min-width: ${BREAKPOINTS.viewport.md}px) {
  .lp-editor-writing-col {
    padding: var(--lp-space-40) var(--lp-space-24) var(--lp-space-64);
  }
}

.lp-editor-title-input {
  width: 100%;
  height: var(--lp-size-target-min);
  min-height: var(--lp-size-target-min);
  border: 0;
  background: transparent;
  color: var(--text);
  font-family: var(--font-ui);
  font-size: var(--lp-space-24);
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
  top: calc(100% + var(--lp-space-4));
  left: 0;
  z-index: var(--z-overlay);
  width: min(var(--lp-size-480), calc(100vw - var(--lp-size-32)));
  padding: var(--lp-space-16);
}

.lp-editor-surface-wrap {
  position: relative;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.lp-tiptap-mount {
  flex: 1;
  min-height: var(--lp-size-360);
}

.lp-tiptap-prose {
  font-family: var(--font-reading);
  font-size: var(--lp-space-16);
  line-height: 1.7;
  color: var(--text);
  outline: none;
  min-height: var(--lp-size-360);
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
  font-size: var(--lp-size-14);
  line-height: 1.6;
  min-height: var(--lp-size-360);
}

.lp-editor-shell-fullscreen {
  display: flex;
  width: 100%;
  min-height: calc(100vh - var(--lp-size-bar-editor-height));
}

.lp-editor-main-fullscreen {
  flex: 1;
  min-width: 0;
}

.lp-editor-drawer {
  position: fixed;
  top: var(--lp-size-bar-top-height);
  bottom: 0;
  left: 0;
  z-index: var(--lp-z-popover);
  width: var(--lp-size-layout-list-col);
  background: var(--surface-overlay);
  padding: var(--lp-space-16) var(--lp-space-12);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: var(--lp-space-16);
  transition: width var(--lp-motion-duration-slow) var(--ease-out), flex-basis var(--lp-motion-duration-slow) var(--ease-out);
}
@media (min-width: ${BREAKPOINTS.viewport.md}px) {
  .lp-editor-drawer {
    position: relative;
    top: auto;
    bottom: auto;
    left: auto;
    flex: 0 0 var(--lp-size-layout-list-col);
  }
}

.lp-editor-drawer[hidden] {
  display: none;
}

.lp-editor-drawer-left {
  border: 0;
  border-right: var(--lp-border-hairline) solid var(--border-overlay);
}

#ref-entry-list {
  padding: 0;
}

.lp-editor-drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--lp-space-8);
}

.lp-slash-menu {
  position: absolute;
  top: var(--lp-space-40);
  left: 0;
  z-index: var(--z-overlay);
  min-width: var(--lp-size-200);
  padding: var(--lp-space-8);
  display: flex;
  flex-direction: column;
  gap: var(--lp-space-4);
}

.lp-slash-menu[hidden] {
  display: none;
}

/* WP-16.C Gallery & Canary Fixtures */
.lp-gallery-root {
  display: flex;
  flex-direction: column;
  gap: var(--lp-space-40);
}

.lp-gallery-section {
  display: flex;
  flex-direction: column;
  gap: var(--lp-space-8);
}

.lp-gallery-row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--lp-space-16);
  align-items: center;
}

.lp-gallery-icon-sample {
  display: inline-flex;
  align-items: center;
  gap: var(--lp-space-8);
  font-size: var(--lp-space-12);
}

.lp-canary-stacking {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  gap: var(--lp-space-8);
}

.lp-canary-small-h1 {
  font-size: var(--lp-size-14);
  margin: 0;
}

.lp-canary-zero-margin {
  margin: 0;
  padding: 0;
}

.lp-canary-overlay {
  position: fixed;
  left: calc(-1 * var(--lp-size-80));
  top: var(--lp-space-40);
  width: var(--lp-size-200);
  height: var(--lp-size-80);
  display: block;
}

.lp-canary-action-bar {
  display: flex;
  flex-direction: column;
  gap: var(--lp-space-8);
  align-items: flex-end;
}

.lp-canary-btn-sm {
  width: var(--lp-size-100);
}

.lp-canary-btn-md {
  width: var(--lp-size-strata-band-max);
}

.lp-canary-rhythm {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.lp-canary-tabs {
  display: flex;
  flex-wrap: wrap;
  width: var(--lp-size-280);
}

.lp-canary-tab {
  width: var(--lp-size-btn-action-min);
}

/* =========================================================
 * WP-16.C D-COMP Primitives & Component Contract
 * ========================================================= */

@media (prefers-reduced-motion: reduce) {
  .lp-choice,
  .lp-choice-check,
  .lp-overlay-surface {
    transition-duration: var(--lp-motion-duration-instant) !important;
    animation-duration: var(--lp-motion-duration-instant) !important;
  }
}

/* PageHeader (D-COMP #2) */
.lp-page-header-dcomp {
  display: flex;
  flex-direction: column;
  gap: var(--lp-space-8);
  margin: 0;
}

.lp-page-header-back {
  display: inline-flex;
  align-items: center;
  gap: var(--lp-space-4);
  width: fit-content;
  font-size: var(--lp-size-14);
  line-height: var(--lp-size-icon-md);
  color: var(--text-muted);
  text-decoration: none;
}

.lp-page-header-back:hover {
  color: var(--text);
}

.lp-page-header-title,
.lp-page-header h1 {
  font-size: var(--lp-space-24);
  line-height: var(--lp-size-32);
  font-weight: 600;
  margin: 0;
  color: var(--text);
}

.lp-page-header .lp-page-description {
  font-size: var(--lp-size-14);
  line-height: var(--lp-size-icon-md);
  color: var(--text-muted);
  margin: 0;
}

.lp-page-header-action {
  width: 100%;
}

.lp-page-header-action .lp-btn {
  width: 100%;
}

@media (min-width: ${BREAKPOINTS.viewport.sm}px) {
  .lp-page-header-dcomp {
    display: grid;
    grid-template-columns: 1fr auto;
    row-gap: var(--lp-space-8);
    column-gap: var(--lp-space-16);
    align-items: start;
  }

  .lp-page-header-back {
    grid-column: 1 / -1;
  }

  .lp-page-header-title,
  .lp-page-header h1 {
    grid-column: 1;
    line-height: var(--lp-size-target-min);
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
  gap: var(--lp-space-8);
  padding: var(--lp-space-16) 0;
  border-bottom: var(--lp-border-hairline) solid var(--border-subtle);
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
  gap: var(--lp-space-8);
  font-size: var(--lp-size-14);
  line-height: var(--lp-size-icon-md);
  font-weight: 600;
  color: var(--text);
}

.lp-item-leading {
  display: inline-flex;
  color: var(--text-muted);
  flex-shrink: 0;
}

.lp-item-subtitle {
  font-size: var(--lp-space-12);
  line-height: var(--lp-space-16);
  color: var(--text-muted);
}

.lp-item-body {
  font-size: var(--lp-size-14);
  line-height: var(--lp-size-icon-md);
  color: var(--text);
}

.lp-item-segments {
  display: flex;
  flex-direction: column;
  gap: var(--lp-space-16);
}

.lp-item-segment {
  display: flex;
  flex-direction: column;
  gap: var(--lp-space-8);
}

.lp-item-segment-heading {
  font-size: var(--lp-size-14);
  line-height: var(--lp-size-icon-md);
  font-weight: 600;
  color: var(--text);
}

.lp-item-meta {
  font-size: var(--lp-space-12);
  line-height: var(--lp-space-16);
  color: var(--text-muted);
}

.lp-item-status {
  display: flex;
  align-items: center;
  gap: var(--lp-space-8);
}

.lp-item-chevron {
  display: inline-flex;
  color: var(--text-muted);
}

@media (min-width: ${BREAKPOINTS.viewport.sm}px) {
  .lp-item {
    display: grid;
    grid-template-columns: 1fr auto;
    column-gap: var(--lp-space-16);
    row-gap: var(--lp-space-4);
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
  gap: var(--lp-space-8);
  margin: 0;
  align-items: stretch;
}

.lp-action-bar .lp-btn {
  width: 100%;
}

@media (min-width: ${BREAKPOINTS.viewport.sm}px) {
  .lp-action-bar {
    align-items: flex-start;
  }

  .lp-action-bar .lp-btn {
    width: var(--lp-size-btn-action-max);
    min-width: var(--lp-size-btn-action-min);
    max-width: var(--lp-size-btn-action-max);
  }
}

/* Choice (D-COMP #5) */
.lp-choice-group {
  display: flex;
  flex-direction: column;
  gap: var(--lp-space-8);
}

.lp-choice-legend {
  font-size: var(--lp-size-14);
  line-height: var(--lp-size-icon-md);
  font-weight: 600;
  color: var(--text);
}

.lp-choice-list {
  display: flex;
  flex-direction: column;
  gap: var(--lp-space-8);
}

.lp-choice-variant-button .lp-choice-list {
  flex-direction: column;
}

@media (min-width: ${BREAKPOINTS.viewport.sm}px) {
  .lp-choice-variant-button .lp-choice-list {
    flex-direction: row;
    flex-wrap: wrap;
  }
}

.lp-choice {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: var(--lp-space-8);
  padding: var(--lp-space-12) var(--lp-space-16);
  min-height: var(--lp-size-target-min);
  border: var(--lp-border-hairline) solid var(--border-control);
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
  outline: var(--lp-space-2) solid var(--focus-ring);
  outline-offset: var(--lp-space-2);
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
  left: var(--lp-space-16);
  top: var(--lp-space-12);
  width: var(--lp-space-16);
  height: var(--lp-space-16);
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
  width: var(--lp-space-16);
  height: var(--lp-space-16);
  border-radius: var(--lp-size-999);
  border: var(--lp-border-hairline) solid var(--border-control);
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
  gap: var(--lp-space-4);
  width: 100%;
  min-width: 0;
}

.lp-choice-card-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--lp-space-8);
}

.lp-choice-card-title {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  font-size: var(--lp-size-14);
  line-height: var(--lp-size-icon-md);
  font-weight: 600;
  color: var(--text);
}

.lp-choice-card-desc {
  font-size: var(--lp-space-12);
  line-height: var(--lp-space-16);
  color: var(--text-muted);
}

.lp-choice-btn-label {
  font-size: var(--lp-size-14);
  line-height: var(--lp-size-icon-md);
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
  border-bottom: var(--lp-border-hairline) solid var(--border-subtle);
}

.lp-tablist {
  margin: 0;
}

.lp-tab {
  flex: 1 1 0;
  min-width: 0;
  height: var(--lp-size-target-min);
  padding: 0 var(--lp-space-8);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
  font-size: var(--lp-size-14);
  line-height: var(--lp-size-icon-md);
  color: var(--text-muted);
  background: transparent;
  border: 0;
  border-bottom: var(--lp-space-2) solid transparent;
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
  gap: var(--lp-space-16);
  margin: 0;
}

.lp-stepper-label {
  position: relative;
  font-size: var(--lp-size-14);
  line-height: var(--lp-size-icon-md);
  font-weight: 600;
  color: var(--text);
  padding-bottom: var(--lp-space-16);
}

.lp-stepper-label::before,
.lp-stepper-label::after {
  content: '';
  position: absolute;
  left: 0;
  bottom: 0;
  height: var(--lp-space-2);
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
  border: var(--lp-border-hairline) solid var(--border-subtle);
  border-radius: var(--radius-overlay);
  box-shadow: var(--shadow-overlay);
  padding: var(--lp-space-16);
  max-height: calc(100vh - var(--lp-size-32));
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: var(--lp-space-16);
  transition: opacity var(--duration-base) var(--ease-out), transform var(--duration-base) var(--ease-out);
}

.lp-overlay-actions .lp-overlay-surface {
  left: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  border-radius: var(--radius-overlay) var(--radius-overlay) 0 0;
}

@media (min-width: ${BREAKPOINTS.viewport.sm}px) {
  .lp-overlay-actions .lp-overlay-backdrop {
    background: transparent;
  }

  .lp-overlay-actions .lp-overlay-surface {
    left: auto;
    right: var(--lp-space-24);
    bottom: auto;
    top: var(--lp-size-bar-editor-height);
    width: var(--lp-size-280);
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
  width: min(var(--lp-size-480), calc(100vw - var(--lp-size-32)));
}

.lp-overlay-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--lp-space-8);
}

.lp-overlay-title {
  font-size: var(--lp-space-16);
  line-height: var(--lp-space-24);
  font-weight: 600;
  margin: 0;
  color: var(--text);
}

.lp-overlay-body {
  display: flex;
  flex-direction: column;
  gap: var(--lp-space-8);
}

/* FormSection (D-COMP #9) */
.lp-form-section {
  display: flex;
  flex-direction: column;
  gap: var(--lp-space-16);
  margin: 0;
}

.lp-form-section-title {
  font-size: var(--lp-space-16);
  line-height: var(--lp-space-24);
  font-weight: 600;
  margin: 0;
  color: var(--text);
}

.lp-form-section-desc {
  font-size: var(--lp-size-14);
  line-height: var(--lp-size-icon-md);
  color: var(--text-muted);
  margin: 0;
}

/* Canary overrides (must stay after D-COMP rules so intentional violations remain broken) */
.lp-canary-stacking.lp-page-header {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  gap: var(--lp-space-8);
}

.lp-canary-rhythm.lp-form-section {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.lp-canary-tabs.lp-tabs {
  display: flex;
  flex-wrap: wrap;
  width: var(--lp-size-280);
}

.lp-canary-tabs.lp-tabs .lp-canary-tab {
  flex: 0 0 auto;
  width: var(--lp-size-btn-action-min);
}

/* Shell menu header & < 640px bottom-sheet overlays (D-COMP #7, #8) */
.lp-menu-header {
  padding: var(--lp-space-4) var(--lp-space-12) var(--lp-space-8);
  font-size: var(--lp-space-12);
  line-height: var(--lp-space-16);
  font-weight: 600;
  color: var(--text-muted);
  margin: 0;
}

.lp-editor-drawer-header-stack {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  padding: 0;
  gap: var(--lp-space-8);
}
.lp-editor-drawer .lp-section-header-title {
  text-align: left;
}
.lp-item-has-actions {
  display: flex !important;
  flex-direction: column;
  gap: var(--lp-space-24) !important;
}
.lp-item-content {
  display: grid;
  grid-template-columns: 1fr;
  row-gap: var(--lp-space-8);
}
@container (min-width: ${BREAKPOINTS.container.compact}px) {
  .lp-item-content {
    grid-template-columns: 1fr auto;
    column-gap: var(--lp-space-16);
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
  font-size: var(--lp-space-24);
  line-height: var(--lp-size-32);
  height: auto;
  min-height: var(--lp-size-target-min);
  border: 0;
}

@media (max-width: ${BREAKPOINTS.viewport.sm - 1}px) {
  .lp-editor-toolbar {
    flex-wrap: nowrap;
    padding: var(--lp-space-8) var(--lp-space-4);
    gap: var(--lp-space-4);
  }

  .lp-editor-view-switch .lp-tab {
    padding-left: var(--lp-space-8);
    padding-right: var(--lp-space-8);
  }

  .lp-editor-toolbar-status {
    display: none;
  }

  .lp-editor-toolbar-center {
    position: fixed;
    left: 0;
    right: 0;
    bottom: var(--vv-bottom, 0);
    z-index: var(--z-sticky);
    display: flex;
    flex-wrap: nowrap;
    overflow-x: auto;
    gap: var(--lp-space-4);
    padding: var(--lp-space-8) var(--lp-space-16);
    background: var(--surface-page);
    border-radius: 0;
    box-shadow: var(--shadow-overlay);
  }

  .lp-editor-toolbar-center #ref-btn-source-toggle {
    display: none;
  }
}

@media (max-width: ${BREAKPOINTS.viewport.sm - 1}px) {
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
    max-height: calc(100vh - var(--lp-size-32));
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
  max-width: var(--lp-size-layout-main-max);
  width: 100%;
  margin: 0 auto;
  padding: var(--lp-space-40) var(--lp-space-16) var(--lp-space-64);
  box-sizing: border-box;
}
@media (min-width: ${BREAKPOINTS.viewport.md}px) {
  .lp-page-column {
    padding: var(--lp-space-40) var(--lp-space-24) var(--lp-space-64);
  }
}
.lp-page-column-narrow { max-width: var(--lp-size-layout-narrow-max); }
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
  font-size: var(--lp-size-14);
  font-weight: 500;
  min-height: var(--lp-size-target-min);
}
.lp-back-link:hover { color: var(--text); }

.lp-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
}
.lp-section-header-title {
  font-size: var(--lp-space-16);
  font-weight: 600;
  line-height: var(--lp-space-24);
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
  width: var(--lp-size-target-min);
  height: var(--lp-size-target-min);
  min-width: var(--lp-size-target-min);
  min-height: var(--lp-size-target-min);
  padding: 0;
  border: 0;
  border-radius: var(--r2);
  background: var(--surface-control);
  color: var(--text);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color var(--lp-motion-duration-fast) ease, color var(--lp-motion-duration-fast) ease;
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
  transition: transform var(--lp-motion-duration-fast) ease;
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
.lp-icon-toggle svg { transition: opacity var(--lp-motion-duration-item) ease, transform var(--lp-motion-duration-item) ease; }
@media (min-width: ${BREAKPOINTS.viewport.md}px) {
  .lp-admin-header-menu-btn,
  .lp-admin-header-mobile-only { display: none; }
}
@media (prefers-reduced-motion: reduce) {
  .lp-icon-btn,
  .lp-icon-btn svg,
  .lp-icon-toggle svg {
    transition-duration: var(--lp-motion-duration-instant) !important;
    transform: none !important;
  }
}

/* D-I1 I8 & D-K2: List container has 0 horizontal padding and absorbs first/last Item vertical padding */
.lp-list,
.lp-item-list {
  --item-pad-y: var(--lp-space-12);
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
  top: calc(-1 * var(--item-pad-y, var(--lp-space-12)));
}
.lp-list > .lp-item:last-child::before,
.lp-item-list > .lp-item:last-child::before {
  bottom: calc(-1 * var(--item-pad-y, var(--lp-space-12)));
}
.lp-popover-menu,
.lp-launcher-panel,
.lp-overlay-body {
  padding: var(--lp-space-8);
  border-top: 0;
}
.lp-item {
  position: relative;
  padding: var(--item-pad-y, var(--lp-space-12)) var(--lp-space-8);
  border: 0;
}
.lp-item::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: var(--r2);
  background: transparent;
  z-index: var(--lp-z-base);
  pointer-events: none;
  transition: background-color var(--lp-motion-duration-item) ease;
}
.lp-item > * { position: relative; z-index: var(--lp-z-raised); }
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
  top: var(--lp-size-48);
  left: 0;
  bottom: 0;
  width: 100%;
  z-index: var(--z-overlay);
  background: var(--surface-l1);
  border-right: var(--lp-border-hairline) solid var(--border-subtle);
  transition: transform var(--lp-motion-duration-slow) ease;
}
@media (min-width: ${BREAKPOINTS.viewport.sm}px) {
  .lp-overlay-push-panel {
    width: var(--lp-size-layout-rail-width);
  }
}

/* === D-FINAL Design System (F1) === */
.lp-gap-tight { gap: var(--lp-space-8); }
.lp-gap-related { gap: var(--lp-space-16); }
.lp-gap-group { gap: var(--lp-space-24); }
.lp-gap-section { gap: var(--lp-space-40); }

/* Surfaces (F1) */
body { background: var(--surface-l0); color: var(--text-1); }
.lp-top-bar, .lp-admin-header, header[data-lp-shell-topbar] {
  background: var(--surface-l1);
  border-bottom: var(--lp-border-hairline) solid var(--border-subtle);
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
  border: var(--lp-border-hairline) solid var(--border-control);
  color-scheme: inherit;
}
select.lp-input option, select.lp-select option, select.lp-input optgroup, select.lp-select optgroup {
  background-color: var(--surface-l1);
  color: var(--text-1);
}

/* 7 Type Roles (D-FINAL #8) */
.lp-page-title { font-size: var(--lp-space-24); font-weight: 600; color: var(--text-1); line-height: var(--lp-size-32); }
.lp-section-title, .lp-form-section-title, .lp-section-header-title { font-size: var(--lp-space-16); font-weight: 600; color: var(--text-1); line-height: var(--lp-space-24); }
.lp-item-title, .lp-field-label { font-size: var(--lp-size-14); font-weight: 600; color: var(--text-1); line-height: var(--lp-size-icon-md); }
.lp-body, .lp-item-body { font-size: var(--lp-size-14); font-weight: 400; color: var(--text-1); line-height: var(--lp-size-icon-md); margin: 0; }
.lp-line-clamp-3 { display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
.lp-description, .lp-page-description, .lp-form-section-desc { font-size: var(--lp-size-14); font-weight: 400; color: var(--text-2); line-height: var(--lp-size-icon-md); margin: 0; }
.lp-caption, .lp-item-subtitle, .lp-item-meta, .lp-field-help, .lp-item-segment-heading { font-size: var(--lp-space-12); font-weight: 400; color: var(--text-2); line-height: var(--lp-space-16); margin: 0; }
.lp-prose { margin: 0; }
.lp-input::placeholder, .lp-textarea::placeholder, :disabled { color: var(--text-3); }

/* Relation gaps (D-FINAL #2) */
.lp-page-header { display: flex; flex-direction: column; gap: var(--lp-space-8); margin: 0; }
.lp-tabs { margin: 0; }
.lp-form-section { display: flex; flex-direction: column; gap: var(--lp-space-16); margin: 0; }
.lp-form-section.lp-gap-group { gap: var(--lp-space-24); }
.lp-form-section + .lp-form-section { margin-top: 0; }
.lp-form-section-header { display: flex; flex-direction: column; gap: var(--lp-space-8); }
.lp-field { display: flex; flex-direction: column; gap: var(--lp-space-8); margin: 0; }
.lp-field > .lp-field-label { display: block; position: static; margin: 0; }
.lp-field > .lp-input, .lp-field > .lp-select-wrap { display: block; position: relative; margin: 0; }
.lp-action-bar { margin-top: 0; }
.lp-item-actions .lp-action-bar { margin-top: 0; }

/* Item contract & hairlines (D-FINAL #5, #10, #24) */
.lp-item:not(:last-child) { border-bottom: var(--lp-border-hairline) solid var(--border-subtle); }
.lp-item {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--lp-space-4);
}
.lp-item-title { order: 1; }
.lp-item-status { order: 2; }
.lp-item-subtitle { order: 3; }
.lp-item-body, .lp-item-segments { order: 4; }
.lp-item-meta { order: 5; }
.lp-item-actions { order: 6; }
@media (min-width: ${BREAKPOINTS.viewport.sm}px) {
  .lp-item {
    grid-template-columns: 1fr auto;
    column-gap: var(--lp-space-16);
  }
  .lp-item-title { grid-column: 1; order: 1; }
  .lp-item-status { grid-column: 2; grid-row: 1; align-self: center; justify-self: end; order: 1; }
  .lp-item-subtitle, .lp-item-body, .lp-item-segments, .lp-item-meta, .lp-item-actions { grid-column: 1 / -1; }
}

/* Dialogs (D-FINAL #11, D-H H1) */
.lp-dialog-panel {
  container-type: inline-size;
  padding: var(--lp-space-24);
  display: flex;
  flex-direction: column;
  gap: var(--lp-space-24);
}
.lp-dialog-header { display: flex; align-items: center; justify-content: space-between; gap: var(--lp-space-8); padding: 0; }
.lp-dialog-body { padding: 0; }
.lp-dialog-footer, .lp-dialog-panel .lp-action-bar { display: flex; flex-direction: column; align-items: flex-start; gap: var(--lp-space-8); width: 100%; }
.lp-dialog-footer .lp-btn, .lp-dialog-panel .lp-action-bar .lp-btn {
  width: auto;
  min-width: var(--lp-size-btn-action-min);
}
@container (max-width: ${BREAKPOINTS.container.compact - 1}px) {
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
  height: var(--lp-size-target-min);
  padding: 0;
  border-radius: var(--lp-space-4);
  background: var(--surface-l2);
  gap: var(--lp-space-4);
}
.lp-segment-btn {
  height: var(--lp-size-target-min);
  padding: 0 var(--lp-space-8);
  border: var(--lp-border-hairline) solid transparent;
  border-radius: var(--lp-space-4);
  background: transparent;
  color: var(--text-2);
  font-family: var(--lp-font-family-ui);
  font-size: var(--lp-size-14);
  font-weight: 600;
  cursor: pointer;
}
@media (min-width: ${BREAKPOINTS.viewport.sm}px) {
  .lp-segment-btn { padding: 0 var(--lp-space-16); }
}
.lp-segment-btn.is-selected {
  background: var(--surface-l0);
  color: var(--text-1);
}

/* Tag chip (D-FINAL #18) */
.lp-tag {
  display: inline-flex;
  align-items: center;
  height: var(--lp-size-28);
  padding: 0 0 0 var(--lp-space-8);
  border-radius: var(--lp-space-4);
  background: var(--surface-l2);
  color: var(--text-2);
  font-size: var(--lp-space-12);
  font-weight: 400;
  border: 0;
  animation: lp-tag-enter var(--lp-motion-duration-base) var(--ease-out);
}
.lp-tag-remove {
  width: var(--lp-size-target-min);
  height: var(--lp-size-target-min);
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
.lp-level { display: flex; flex-direction: column; gap: var(--lp-space-8); }
.lp-level-bar { display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--lp-space-8); }
.lp-level-segment { display: flex; flex-direction: column; gap: var(--lp-space-4); }
.lp-level-bar-fill { height: var(--lp-space-4); border-radius: var(--lp-space-4); background: var(--surface-l2); }
.lp-level-segment.is-done .lp-level-bar-fill { background: var(--accent); }
.lp-level-label { font-size: var(--lp-space-12); font-weight: 400; color: var(--text-2); line-height: var(--lp-space-16); }
.lp-level-segment.is-current .lp-level-label { font-weight: 600; color: var(--text-1); }

/* D-FINAL #15, #16, D-H H5: Editor header row (1fr auto 1fr), Edit prose, details line, format bar */
.lp-editor-header-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  align-items: center;
  min-height: var(--lp-size-bar-editor-height);
  height: var(--lp-size-bar-editor-height);
  padding: 0 var(--lp-space-12);
  background: var(--surface-l0);
  border-bottom: 0;
  gap: var(--lp-space-4);
}
.lp-editor-toolbar-sticky {
  position: sticky;
  top: var(--lp-size-bar-top-height);
  z-index: var(--z-sticky);
  background: var(--surface-l0);
}
.lp-editor-toolbar-left { justify-self: start; display: flex; align-items: center; gap: var(--lp-space-8); }
.lp-editor-toolbar-center-slot { justify-self: center; display: flex; align-items: center; }
.lp-editor-toolbar-right { justify-self: end; display: flex; align-items: center; gap: var(--lp-space-4); }
@media (min-width: ${BREAKPOINTS.viewport.sm}px) {
  .lp-editor-toolbar-right { gap: var(--lp-space-8); }
  .lp-editor-mobile-only { display: none; }
}
@media (max-width: ${BREAKPOINTS.viewport.sm - 1}px) {
  .lp-editor-desktop-only { display: none; }
  .lp-editor-toolbar-right .lp-btn { padding: 0 var(--lp-space-8); }
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
  font-size: var(--lp-space-12);
  line-height: var(--lp-space-16);
  color: var(--text-2);
  cursor: pointer;
}
.lp-prose .ProseMirror {
  display: flex;
  flex-direction: column;
  gap: var(--lp-space-16);
}
.lp-prose .ProseMirror > * { margin: 0; }
.lp-prose .ProseMirror h1,
.lp-prose .ProseMirror h2,
.lp-prose .ProseMirror h3 {
  padding-top: var(--lp-space-8);
}
.lp-format-bar {
  position: fixed;
  bottom: calc(var(--lp-space-16) + var(--vv-bottom, 0));
  left: 0;
  right: 0;
  margin: 0 auto;
  width: fit-content;
  z-index: var(--z-overlay);
  background: var(--surface-l1);
  box-shadow: var(--shadow-overlay);
  border-radius: var(--lp-space-8);
  padding: var(--lp-space-4) var(--lp-space-8);
  display: inline-flex;
  align-items: center;
  gap: var(--lp-space-4);
}
@media (min-width: ${BREAKPOINTS.viewport.md}px) {
  .lp-editor-drawer:not([hidden]) + .lp-editor-main-fullscreen .lp-format-bar {
    left: var(--lp-size-layout-list-col);
  }
}

.lp-canary-center { text-align: center; }
.lp-canary-empty-tall { height: var(--lp-size-48); }
.lp-canary-gap-80 { display: flex; flex-direction: column; gap: var(--lp-size-80); }
.lp-canary-hairline { border-bottom: var(--lp-border-hairline) solid var(--border-subtle); padding: var(--lp-space-8) 0; }
.lp-canary-zero-pad-clip { padding: 0; overflow: hidden; }
.lp-canary-outlined-icon-btn { border: var(--lp-border-hairline) solid var(--border-control); background: transparent; }
.lp-canary-wide-row { display: flex; width: 100%; overflow: hidden; }
.lp-canary-wide-btn { min-width: var(--lp-size-layout-narrow-max); }
.lp-canary-btn-narrow { width: var(--lp-size-btn-action-min) !important; max-width: var(--lp-size-btn-action-min) !important; }
.lp-canary-formatting-offcenter { position: relative; }
.lp-canary-bar-offset { position: fixed; left: 0; bottom: var(--lp-space-16); width: var(--lp-size-200); }


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
  padding: var(--item-pad-y, var(--lp-space-12)) var(--lp-space-8);
  display: grid;
  grid-template-columns: 1fr auto;
  row-gap: var(--lp-space-8);
  column-gap: var(--lp-space-12);
  align-items: start;
}
.lp-item-title { grid-column: 1; grid-row: 1; order: 1; }
.lp-item-status { grid-column: 2; grid-row: 1; align-self: center; justify-self: end; display: inline-flex; align-items: center; gap: var(--lp-space-8); order: 2; }
.lp-item-subtitle { grid-column: 1 / -1; order: 3; }
.lp-item-body, .lp-item-segments { grid-column: 1 / -1; order: 4; }
.lp-item-meta { grid-column: 1 / -1; order: 5; }
.lp-item-actions { grid-column: 1 / -1; order: 6; }

.lp-item-segments { display: flex; flex-direction: column; gap: var(--lp-space-16); }
.lp-item-segment { display: flex; flex-direction: column; gap: var(--lp-space-4); }
.lp-item-segment-heading { font-size: var(--lp-space-12); font-weight: 400; color: var(--text-2); line-height: var(--lp-space-16); }

@container (max-width: ${BREAKPOINTS.container.compact - 1}px) {
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
    column-gap: var(--lp-space-16);
  }
  .lp-item.lp-item-trailing-status .lp-item-status {
    grid-column: 2;
    grid-row: 1;
    justify-self: end;
    justify-content: flex-end;
  }
}

/* Subsection & ActionBar spacing (D-G #10) */
.lp-subsection-title { font-size: var(--lp-size-14); font-weight: 600; color: var(--text-1); line-height: var(--lp-size-icon-md); margin: 0; }
.lp-subsection-intro { font-size: var(--lp-size-14); font-weight: 400; color: var(--text-2); line-height: var(--lp-size-icon-md); margin: 0; }
#ref-claims-list.lp-is-empty, #ref-evidence-list.lp-is-empty { display: none; }
.lp-subsection.lp-stack.lp-gap-group { gap: var(--lp-space-24); }
.lp-subsection.lp-stack.lp-gap-group.lp-gap-related { gap: var(--lp-space-16); }

/* Select chevron vertically centred at 12px from right (D-G #11) */
.lp-select-wrap { position: relative; width: 100%; }
.lp-select-wrap select.lp-select {
  appearance: none;
  -webkit-appearance: none;
  background-image: none;
  padding-right: var(--lp-size-target-min);
}
.lp-select-chevron {
  position: absolute;
  right: var(--lp-space-12);
  top: 0;
  bottom: 0;
  margin: auto 0;
  height: var(--lp-space-16);
  width: var(--lp-space-16);
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
  padding: 0 var(--lp-space-8);
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
  padding: var(--lp-space-4);
  border-radius: var(--r2);
  background: var(--surface-l2);
  gap: var(--lp-space-4);
  height: var(--control-height);
  min-height: var(--control-height);
  box-sizing: border-box;
  align-items: center;
}
.lp-segment-btn,
.lp-choice-variant-segmented .lp-choice {
  height: calc(var(--control-height) - var(--lp-space-8));
  min-height: calc(var(--control-height) - var(--lp-space-8));
  min-width: var(--lp-size-target-min);
  padding: 0 var(--lp-space-8);
  border: var(--lp-border-hairline) solid transparent;
  border-radius: var(--r1);
  background: transparent;
  color: var(--text-2);
  font-family: var(--lp-font-family-ui);
  font-size: var(--lp-size-14);
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--lp-space-4);
  cursor: pointer;
  transition: background-color var(--lp-motion-duration-base) var(--ease-out), color var(--lp-motion-duration-base) var(--ease-out);
}
@media (min-width: ${BREAKPOINTS.viewport.sm}px) {
  .lp-segment-btn,
  .lp-choice-variant-segmented .lp-choice { padding: 0 var(--lp-space-16); }
}
.lp-segment-btn.is-selected,
.lp-choice-variant-segmented .lp-choice.is-selected {
  background: var(--surface-l0);
  color: var(--text-1);
}
.lp-segmented-responsive-icons .lp-segment-label { display: none; }
.lp-segmented-responsive-icons .lp-segment-icon { display: inline-flex; align-items: center; }
@media (min-width: ${BREAKPOINTS.viewport.sm}px) {
  .lp-segmented-responsive-icons .lp-segment-label { display: inline; }
  .lp-segmented-responsive-icons .lp-segment-icon { display: none; }
}

/* Tag symmetric ink inset (D-H H4) */
.lp-tag {
  padding: 0 var(--lp-space-8);
  font-size: var(--lp-space-12);
  font-weight: 400;
  height: var(--lp-size-28);
  border-radius: var(--r1);
  display: inline-flex;
  align-items: center;
  gap: var(--lp-space-4);
}
.lp-tag:has(.lp-tag-remove),
.lp-tag.lp-tag-removable {
  padding: 0 var(--lp-space-4) 0 var(--lp-space-8);
}
.lp-tag-remove {
  width: auto;
  min-width: 0;
  height: var(--lp-size-28);
  padding: 0 var(--lp-space-4);
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
  border: var(--lp-border-hairline) solid var(--border-overlay);
}
.lp-popover-menu,
.lp-launcher-panel {
  box-shadow: var(--shadow-e1);
}
.lp-editor-drawer {
  border: 0;
  border-right: var(--lp-border-hairline) solid var(--border-overlay);
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
  top: var(--lp-size-bar-top-height);
}

/* Visually-hidden screen-reader-only utility (D-H H10, zero margin) */
.lp-sr-only {
  position: absolute;
  width: var(--lp-border-hairline);
  height: var(--lp-border-hairline);
  padding: 0;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  clip-path: inset(50%);
  white-space: nowrap;
  border: 0;
}

/* Setup wizard 2px progress bar (D-H H10) */
.lp-auth-progress-track {
  height: var(--lp-space-2);
  width: 100%;
  background: var(--surface-l2);
  overflow: hidden;
}
.lp-auth-progress-fill {
  height: 100%;
  background: var(--accent);
  width: 16.667%;
  transition: width var(--lp-motion-duration-base) var(--ease-out);
}
.lp-auth-progress-fill[data-step="1"] { width: 16.667%; }
.lp-auth-progress-fill[data-step="2"] { width: 33.333%; }
.lp-auth-progress-fill[data-step="3"] { width: 50%; }
.lp-auth-progress-fill[data-step="4"] { width: 66.667%; }
.lp-auth-progress-fill[data-step="5"] { width: 83.333%; }
.lp-auth-progress-fill[data-step="6"] { width: 100%; }

/* Gallery outline mode (?outline=1, D-G #9) */
.lp-outline-mode [data-c] {
  outline: var(--lp-border-hairline) dashed var(--accent);
  outline-offset: var(--lp-space-2);
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
  gap: var(--lp-space-8);
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
  gap: var(--lp-space-8);
  width: 100%;
}

.lp-action-bar-item .lp-btn:not(.lp-btn-text),
.lp-item-actions .lp-action-bar .lp-btn:not(.lp-btn-text) {
  width: auto;
  min-width: var(--lp-size-btn-item-min);
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
  max-width: var(--lp-size-420);
  inset: auto;
  z-index: var(--lp-z-raised);
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
  max-width: var(--lp-size-280);
  background: var(--surface-overlay);
  border: 0;
  border-right: var(--lp-border-hairline) solid var(--border-overlay);
  padding: var(--lp-space-16) var(--lp-space-12);
}
.lp-level-next {
  display: inline-flex;
  align-items: center;
  justify-content: flex-start;
  gap: var(--lp-space-4);
  width: auto;
  align-self: flex-start;
  padding-left: 0;
  padding-right: 0;
}
`;
