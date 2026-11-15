import { DEFAULT_STRATA_THEME, verifyThemeConformance } from "@living-portfolio/core";
import { adaptDataSource, type WebDataClient } from "../../lib/data-source.js";
import { escapeHtml } from "../../lib/html.js";
import { renderAdminShell } from "../../layouts/admin-shell.js";
import { renderButton, renderChip } from "../../primitives/index.js";
import { ALPHA_WARNING_TEXT } from "../../renderer.js";
import { type AdminSettingsState } from '../../lib/admin-api-client.js';
import { SETTINGS_SCRIPT } from './settings-script.js';

export async function renderAdminSettingsPage(
  repo: WebDataClient,
  settingsState?: AdminSettingsState
): Promise<string> {
  repo = adaptDataSource(repo);
  const tier1Floor = settingsState?.tier1_floor ?? 0.82;
  const tier2Floor = settingsState?.tier2_floor ?? 0.55;
  const facetThreshold = settingsState?.facet_known_threshold ?? 0.90;
  const answeringEnabled = settingsState?.automatedAnsweringEnabled ?? true;
  const degradationMode = settingsState?.simulatedDegradationMode ?? 'normal';
  const theme = settingsState?.theme ?? structuredClone(DEFAULT_STRATA_THEME);
  const themeConformance = verifyThemeConformance(theme);
  const mechSuggestion = settingsState?.calibration?.suggestion_thresholds ?? false;
  const mechRouting = settingsState?.calibration?.routing_calibration ?? false;
  const mechTopology = settingsState?.calibration?.topology_audit ?? true;
  const mechScoped = settingsState?.calibration?.scoped_constraint_mining ?? true;

  const content = `
    <div class="lp-page-header">
      <div>
        <h1 class="lp-page-title">Admin Operations &amp; System Calibration</h1>
        <p class="lp-page-subtitle">
          Configure routing floors, provider registry, degradation ladders, theme tokens, notification channels, and backup restore drills.
        </p>
      </div>
    </div>

    <div class="lp-notice lp-notice-warn" data-banner="alpha-warning" role="note">
      <strong>${escapeHtml(ALPHA_WARNING_TEXT)}</strong>
    </div>

    <div id="settings-status-banner" role="status" aria-live="polite"></div>

    <div class="lp-section-grid">
      <!-- Section 1: Routing Floors & Calibration -->
      <section class="lp-section-block lp-stack-md" aria-labelledby="routing-heading">
        <h2 id="routing-heading" class="lp-section-title">Routing Floors &amp; Calibration</h2>
        <div class="lp-field">
          <label class="lp-field-label" for="setting-tier1-floor">
            Tier 1 Advisory Floor (shipped default: 0.82)
          </label>
          <input type="number" id="setting-tier1-floor" class="lp-input" step="0.01" min="0.1" max="1.0" value="${tier1Floor}" />
          <div id="tier1-warning" class="lp-notice lp-notice-warn${tier1Floor < 0.82 ? '' : ' lp-is-hidden'}" role="alert">
            <strong>Warning:</strong> Tier 1 floor is set below the shipped default (0.82). Unverified advisory answers may be served without owner review.
          </div>
        </div>

        <div class="lp-field">
          <label class="lp-field-label" for="setting-tier2-floor">
            Tier 2 Escalation Floor (shipped default: 0.55)
          </label>
          <input type="number" id="setting-tier2-floor" class="lp-input" step="0.01" min="0.1" max="1.0" value="${tier2Floor}" />
        </div>

        <div class="lp-field">
          <label class="lp-field-label" for="setting-facet-threshold">
            Facet Known Threshold (shipped default: 0.90)
          </label>
          <input type="number" id="setting-facet-threshold" class="lp-input" step="0.01" min="0.5" max="1.0" value="${facetThreshold}" />
        </div>

        <div class="lp-stack-sm lp-divider-top">
          <div class="lp-field-label">Self-Calibration Mechanisms (Spec §11, UX-08)</div>
          <div class="lp-row-between">
            <label class="lp-choice-label" for="setting-mech-suggestion-thresholds">
              <input type="checkbox" id="setting-mech-suggestion-thresholds" class="lp-choice-input" ${mechSuggestion ? 'checked' : ''} />
              <span>Suggestion Thresholds</span>
            </label>
            <span id="gate-info-suggestion-thresholds" class="lp-help-text">
              Gate: min 20 samples · Step limit: ±0.05
            </span>
          </div>
          <div class="lp-row-between">
            <label class="lp-choice-label" for="setting-mech-routing-calibration">
              <input type="checkbox" id="setting-mech-routing-calibration" class="lp-choice-input" ${mechRouting ? 'checked' : ''} />
              <span>Routing Calibration</span>
            </label>
            <span id="gate-info-routing-calibration" class="lp-help-text">
              Gate: min 20 samples · Step limit: ±0.05
            </span>
          </div>
          <div class="lp-row-between">
            <label class="lp-choice-label" for="setting-mech-topology-audit">
              <input type="checkbox" id="setting-mech-topology-audit" class="lp-choice-input" ${mechTopology ? 'checked' : ''} />
              <span>Topology Audit</span>
            </label>
            <span id="gate-info-topology-audit" class="lp-help-text">
              Proposal only (never auto-applies)
            </span>
          </div>
          <div class="lp-row-between">
            <label class="lp-choice-label" for="setting-mech-scoped-constraints">
              <input type="checkbox" id="setting-mech-scoped-constraints" class="lp-choice-input" ${mechScoped ? 'checked' : ''} />
              <span>Scoped-Constraint Mining</span>
            </label>
            <span id="gate-info-scoped-constraints" class="lp-help-text">
              Proposal only (never auto-applies)
            </span>
          </div>
        </div>

        <div>
          <label class="lp-choice-label" for="setting-answering-enabled">
            <input type="checkbox" id="setting-answering-enabled" class="lp-choice-input" ${answeringEnabled ? 'checked' : ''} />
            <span>Automated Answering Enabled (Kill-switch)</span>
          </label>
        </div>

        <div>
          ${renderButton({ id: 'btn-save-routing', label: 'Save Calibration & Routing', variant: 'primary' })}
        </div>
      </section>

      <!-- Section 2: Provider Registry & Degradation Ladder -->
      <section class="lp-section-block lp-stack-md" aria-labelledby="providers-heading">
        <h2 id="providers-heading" class="lp-section-title">Provider Registry &amp; Degradation Ladder</h2>
        <p class="lp-help-text">
          Active Provider Chain &amp; Zero-Retention Disclosures:
        </p>
        <div class="lp-table-wrap">
          <table class="lp-table">
            <thead>
              <tr>
                <th>Provider</th>
                <th>Model</th>
                <th>Data Classes</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><code>local-onnx</code></td>
                <td>bge-small-en-v1.5 (dim 384)</td>
                <td>public, unpublished, private, sensitive</td>
              </tr>
              <tr>
                <td><code>groq</code></td>
                <td>llama-3.3-70b-versatile</td>
                <td>public, unpublished, private (zero-retention)</td>
              </tr>
              <tr>
                <td><code>gemini</code></td>
                <td>gemini-2.5-flash</td>
                <td>public (trains on free tier)</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="lp-field">
          <label class="lp-field-label" for="setting-degradation-mode">
            Simulated Degradation Mode
          </label>
          <select id="setting-degradation-mode" class="lp-input lp-select">
            <option value="normal" ${degradationMode === 'normal' ? 'selected' : ''}>Normal (Extractive + Generative)</option>
            <option value="extractive" ${degradationMode === 'extractive' ? 'selected' : ''}>Extractive Only (Zero LLM synthesis)</option>
            <option value="disabled" ${degradationMode === 'disabled' ? 'selected' : ''}>Disabled (Offline handoff only)</option>
          </select>
        </div>

        <div>
          ${renderButton({ id: 'btn-save-degradation', label: 'Update Degradation Mode', variant: 'secondary' })}
        </div>
      </section>

      <!-- Section 3: Theme Customization & WCAG Conformance -->
      <section class="lp-section-block lp-stack-md" aria-labelledby="theme-heading">
        <h2 id="theme-heading" class="lp-section-title">Theme Customization &amp; Conformance</h2>
        <div class="lp-field">
          <label class="lp-field-label" for="setting-theme-light-accent">
            Light Theme Primary Accent
          </label>
          <input type="text" id="setting-theme-light-accent" class="lp-input" value="${escapeHtml(theme.lightTokens?.['--accent'] || '#3A4FD0')}" />
        </div>

        <div class="lp-field">
          <label class="lp-field-label" for="setting-theme-dark-accent">
            Dark Theme Primary Accent
          </label>
          <input type="text" id="setting-theme-dark-accent" class="lp-input" value="${escapeHtml(theme.darkTokens?.['--accent'] || '#9AA8FF')}" />
        </div>

        <div id="theme-conformance-box" class="lp-stack-sm lp-divider-top">
          <div class="lp-field-label">Theme Conformance Status</div>
          <div class="lp-body-sm">Valid Token Keys: <strong>${themeConformance.valid ? 'Passed' : 'Failed'}</strong></div>
          <div class="lp-body-sm">Missing Tokens: <strong>${themeConformance.missingTokens.length === 0 ? 'None' : escapeHtml(themeConformance.missingTokens.join(', '))}</strong></div>
        </div>

        <div>
          ${renderButton({ id: 'btn-save-theme', label: 'Apply Theme Tokens', variant: 'secondary' })}
        </div>
      </section>

      <!-- Section 4: Notification Channel Delivery -->
      <section class="lp-section-block lp-stack-md" aria-labelledby="notifications-heading">
        <h2 id="notifications-heading" class="lp-section-title">Notification Delivery</h2>
        <div class="lp-row-between">
          <span class="lp-body-sm">Channel Status</span>
          ${renderChip({ id: 'chip-notify-status', label: 'not_configured', state: 'confirmed' })}
        </div>
        <p class="lp-help-text">
          Delivery adapter for ntfy, webhook, or email is not yet configured. The system will report honest not_configured status per honesty invariant.
        </p>
        <div class="lp-field">
          <label class="lp-field-label" for="setting-notify-topic">
            Notification Topic / Webhook URL
          </label>
          <input type="text" id="setting-notify-topic" class="lp-input" placeholder="https://ntfy.sh/owner-alerts" />
        </div>
        <div>
          ${renderButton({ id: 'btn-test-notification', label: 'Test Notification Delivery', variant: 'secondary' })}
        </div>
        <div id="notify-test-result" class="lp-help-text"></div>
      </section>

      <!-- Section 5: Encrypted Backups & Restore Verification Drill -->
      <section class="lp-section-block lp-stack-md" aria-labelledby="backups-heading">
        <h2 id="backups-heading" class="lp-section-title">Encrypted Backups &amp; Restore Drill</h2>
        <div class="lp-row-between">
          <span class="lp-body-sm">Backup Subsystem</span>
          ${renderChip({ id: 'chip-backup-status', label: 'not_configured', state: 'confirmed' })}
        </div>
        <div class="lp-table-wrap">
          <table class="lp-table">
            <tbody>
              <tr>
                <td><strong>Encryption</strong></td>
                <td><code>age (X25519)</code></td>
              </tr>
              <tr>
                <td><strong>Retention</strong></td>
                <td>7 daily / 4 weekly / 6 monthly</td>
              </tr>
              <tr>
                <td><strong>Last Restore Drill</strong></td>
                <td><code>not_configured</code></td>
              </tr>
            </tbody>
          </table>
        </div>
        <div>
          ${renderButton({ id: 'btn-run-backup-drill', label: 'Run Encrypted Backup Drill', variant: 'secondary' })}
        </div>
        <div id="backup-drill-result" class="lp-help-text"></div>
      </section>
    </div>

${SETTINGS_SCRIPT}
  `;

  return renderAdminShell('Settings & Calibration', '/admin/settings', content);
}
