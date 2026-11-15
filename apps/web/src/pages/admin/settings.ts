import { DEFAULT_STRATA_THEME, verifyThemeConformance } from "@living-portfolio/core";
import { adaptDataSource, type WebDataClient } from "../../lib/data-source.js";
import { escapeHtml } from "../../lib/html.js";
import { renderAdminShell } from "../../layouts/admin-shell.js";
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
    <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;margin-bottom:24px">
      <div>
        <h1 style="font-family:var(--font-reading);font-size:28px;margin:0">Admin Operations &amp; System Calibration</h1>
        <p style="color:var(--text-muted);margin:4px 0 0;font-size:14px">
          Configure routing floors, provider registry, degradation ladders, theme tokens, notification channels, and backup restore drills.
        </p>
      </div>
    </div>

    <div class="later-thinking-banner" data-banner="alpha-warning" role="note" style="margin-bottom:16px">
      <strong>${escapeHtml(ALPHA_WARNING_TEXT)}</strong>
    </div>

    <div id="settings-status-banner" role="status" aria-live="polite" style="margin-bottom:16px"></div>

    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%, 340px),1fr));gap:24px">
      <!-- Section 1: Routing Floors & Calibration -->
      <section class="admin-pane" aria-labelledby="routing-heading">
        <h2 id="routing-heading" style="font-size:18px;margin:0 0 12px 0">Routing Floors &amp; Calibration</h2>
        <div style="margin-bottom:12px">
          <label for="setting-tier1-floor" style="font-size:12px;font-weight:600;display:block;margin-bottom:4px">
            Tier 1 Advisory Floor (shipped default: 0.82):
          </label>
          <input type="number" id="setting-tier1-floor" class="ask-input" style="width:100%" step="0.01" min="0.1" max="1.0" value="${tier1Floor}" />
          <div id="tier1-warning" class="later-thinking-banner" role="alert" style="display:${tier1Floor < 0.82 ? 'block' : 'none'};margin-top:8px;font-size:12px">
            ⚠️ <strong>Warning:</strong> Tier 1 floor is set below the shipped default (0.82). Unverified advisory answers may be served without owner review.
          </div>
        </div>

        <div style="margin-bottom:12px">
          <label for="setting-tier2-floor" style="font-size:12px;font-weight:600;display:block;margin-bottom:4px">
            Tier 2 Escalation Floor (shipped default: 0.55):
          </label>
          <input type="number" id="setting-tier2-floor" class="ask-input" style="width:100%" step="0.01" min="0.1" max="1.0" value="${tier2Floor}" />
        </div>

        <div style="margin-bottom:12px">
          <label for="setting-facet-threshold" style="font-size:12px;font-weight:600;display:block;margin-bottom:4px">
            Facet Known Threshold (shipped default: 0.90):
          </label>
          <input type="number" id="setting-facet-threshold" class="ask-input" style="width:100%" step="0.01" min="0.5" max="1.0" value="${facetThreshold}" />
        </div>

        <div style="margin-bottom:16px;padding:12px;border:1px solid var(--rule);border-radius:6px;background:var(--surface-raised)">
          <div style="font-size:13px;font-weight:600;margin-bottom:10px">Self-Calibration Mechanisms (Spec §11, UX-08)</div>
          
          <div style="margin-bottom:10px">
            <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:6px">
              <label style="display:flex;align-items:center;gap:8px;font-size:13px;cursor:pointer">
                <input type="checkbox" id="setting-mech-suggestion-thresholds" ${mechSuggestion ? 'checked' : ''} />
                <span>Suggestion Thresholds</span>
              </label>
              <span id="gate-info-suggestion-thresholds" style="font-size:11px;color:var(--text-muted);background:var(--surface-sunken);padding:2px 6px;border-radius:4px">
                Gate: min 20 samples · Step limit: ±0.05
              </span>
            </div>
          </div>

          <div style="margin-bottom:10px">
            <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:6px">
              <label style="display:flex;align-items:center;gap:8px;font-size:13px;cursor:pointer">
                <input type="checkbox" id="setting-mech-routing-calibration" ${mechRouting ? 'checked' : ''} />
                <span>Routing Calibration</span>
              </label>
              <span id="gate-info-routing-calibration" style="font-size:11px;color:var(--text-muted);background:var(--surface-sunken);padding:2px 6px;border-radius:4px">
                Gate: min 20 samples · Step limit: ±0.05
              </span>
            </div>
          </div>

          <div style="margin-bottom:10px">
            <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:6px">
              <label style="display:flex;align-items:center;gap:8px;font-size:13px;cursor:pointer">
                <input type="checkbox" id="setting-mech-topology-audit" ${mechTopology ? 'checked' : ''} />
                <span>Topology Audit</span>
              </label>
              <span id="gate-info-topology-audit" style="font-size:11px;color:var(--text-muted);background:var(--surface-sunken);padding:2px 6px;border-radius:4px">
                Proposal only (never auto-applies)
              </span>
            </div>
          </div>

          <div style="margin-bottom:4px">
            <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:6px">
              <label style="display:flex;align-items:center;gap:8px;font-size:13px;cursor:pointer">
                <input type="checkbox" id="setting-mech-scoped-constraints" ${mechScoped ? 'checked' : ''} />
                <span>Scoped-Constraint Mining</span>
              </label>
              <span id="gate-info-scoped-constraints" style="font-size:11px;color:var(--text-muted);background:var(--surface-sunken);padding:2px 6px;border-radius:4px">
                Proposal only (never auto-applies)
              </span>
            </div>
          </div>
        </div>

        <div style="margin-bottom:16px;display:flex;align-items:center;gap:8px">
          <input type="checkbox" id="setting-answering-enabled" ${answeringEnabled ? 'checked' : ''} />
          <label for="setting-answering-enabled" style="font-size:13px">Automated Answering Enabled (Kill-switch)</label>
        </div>

        <button type="button" class="btn" id="btn-save-routing">Save Calibration &amp; Routing</button>
      </section>

      <!-- Section 2: Provider Registry & Degradation Ladder -->
      <section class="admin-pane" aria-labelledby="providers-heading">
        <h2 id="providers-heading" style="font-size:18px;margin:0 0 12px 0">Provider Registry &amp; Degradation Ladder</h2>
        <div style="font-size:12px;color:var(--text-muted);margin-bottom:12px">
          Active Provider Chain &amp; Zero-Retention Disclosures:
        </div>
        <div class="lp-table-scroll">
        <table style="width:100%;font-size:12px;border-collapse:collapse;margin-bottom:16px">
          <thead>
            <tr style="border-bottom:1px solid var(--rule);text-align:left">
              <th style="padding:4px 0">Provider</th>
              <th style="padding:4px 0">Model</th>
              <th style="padding:4px 0">Data Classes</th>
            </tr>
          </thead>
          <tbody>
            <tr style="border-bottom:1px solid var(--rule)">
              <td style="padding:6px 0"><code>local-onnx</code></td>
              <td>bge-small-en-v1.5 (dim 384)</td>
              <td>public, unpublished, private, sensitive</td>
            </tr>
            <tr style="border-bottom:1px solid var(--rule)">
              <td style="padding:6px 0"><code>groq</code></td>
              <td>llama-3.3-70b-versatile</td>
              <td>public, unpublished, private (zero-retention)</td>
            </tr>
            <tr style="border-bottom:1px solid var(--rule)">
              <td style="padding:6px 0"><code>gemini</code></td>
              <td>gemini-2.5-flash</td>
              <td>public (trains on free tier)</td>
            </tr>
          </tbody>
        </table>
        </div>

        <div style="margin-bottom:16px">
          <label for="setting-degradation-mode" style="font-size:12px;font-weight:600;display:block;margin-bottom:4px">
            Simulated Degradation Mode:
          </label>
          <select id="setting-degradation-mode" class="ask-input" style="width:100%">
            <option value="normal" ${degradationMode === 'normal' ? 'selected' : ''}>Normal (Extractive + Generative)</option>
            <option value="extractive" ${degradationMode === 'extractive' ? 'selected' : ''}>Extractive Only (Zero LLM synthesis)</option>
            <option value="disabled" ${degradationMode === 'disabled' ? 'selected' : ''}>Disabled (Offline handoff only)</option>
          </select>
        </div>

        <button type="button" class="btn btn-secondary" id="btn-save-degradation">Update Degradation Mode</button>
      </section>

      <!-- Section 3: Theme Customization & WCAG Conformance -->
      <section class="admin-pane" aria-labelledby="theme-heading">
        <h2 id="theme-heading" style="font-size:18px;margin:0 0 12px 0">Theme Customization &amp; Conformance</h2>
        <div style="margin-bottom:12px">
          <label for="setting-theme-light-accent" style="font-size:12px;font-weight:600;display:block;margin-bottom:4px">
            Light Theme Primary Accent:
          </label>
          <input type="text" id="setting-theme-light-accent" class="ask-input" style="width:100%" value="${escapeHtml(theme.lightTokens?.['--accent'] || '#3A4FD0')}" />
        </div>

        <div style="margin-bottom:12px">
          <label for="setting-theme-dark-accent" style="font-size:12px;font-weight:600;display:block;margin-bottom:4px">
            Dark Theme Primary Accent:
          </label>
          <input type="text" id="setting-theme-dark-accent" class="ask-input" style="width:100%" value="${escapeHtml(theme.darkTokens?.['--accent'] || '#9AA8FF')}" />
        </div>

        <div id="theme-conformance-box" style="padding:10px;border:1px solid var(--rule);border-radius:var(--radius-control);background:var(--surface-page);margin-bottom:16px;font-size:12px">
          <div style="font-weight:600;margin-bottom:4px">Theme Conformance Status:</div>
          <div>Valid Token Keys: <strong>${themeConformance.valid ? 'Passed' : 'Failed'}</strong></div>
          <div>Missing Tokens: <strong>${themeConformance.missingTokens.length === 0 ? 'None' : escapeHtml(themeConformance.missingTokens.join(', '))}</strong></div>
        </div>

        <button type="button" class="btn btn-secondary" id="btn-save-theme">Apply Theme Tokens</button>
      </section>

      <!-- Section 4: Notification Channel Delivery -->
      <section class="admin-pane" aria-labelledby="notifications-heading">
        <h2 id="notifications-heading" style="font-size:18px;margin:0 0 12px 0">Notification Delivery</h2>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
          <span style="font-size:13px">Channel Status:</span>
          <span class="chip" id="chip-notify-status">not_configured</span>
        </div>
        <p style="font-size:12px;color:var(--text-muted);margin:0 0 12px 0">
          Delivery adapter for ntfy, webhook, or email is not yet configured. The system will report honest not_configured status per honesty invariant.
        </p>
        <div style="margin-bottom:12px">
          <label for="setting-notify-topic" style="font-size:12px;font-weight:600;display:block;margin-bottom:4px">
            Notification Topic / Webhook URL:
          </label>
          <input type="text" id="setting-notify-topic" class="ask-input" style="width:100%" placeholder="https://ntfy.sh/owner-alerts" />
        </div>
        <button type="button" class="btn btn-secondary" id="btn-test-notification">Test Notification Delivery</button>
        <div id="notify-test-result" style="margin-top:8px;font-size:12px"></div>
      </section>

      <!-- Section 5: Encrypted Backups & Restore Verification Drill -->
      <section class="admin-pane" aria-labelledby="backups-heading">
        <h2 id="backups-heading" style="font-size:18px;margin:0 0 12px 0">Encrypted Backups &amp; Restore Drill</h2>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
          <span style="font-size:13px">Backup Subsystem:</span>
          <span class="chip" id="chip-backup-status">not_configured</span>
        </div>
        <div class="lp-table-scroll">
        <table style="width:100%;font-size:12px;border-collapse:collapse;margin-bottom:16px">
          <tbody>
            <tr style="border-bottom:1px solid var(--rule)">
              <td style="padding:4px 0"><strong>Encryption:</strong></td>
              <td style="text-align:right"><code>age (X25519)</code></td>
            </tr>
            <tr style="border-bottom:1px solid var(--rule)">
              <td style="padding:4px 0"><strong>Retention:</strong></td>
              <td style="text-align:right">7 daily / 4 weekly / 6 monthly</td>
            </tr>
            <tr style="border-bottom:1px solid var(--rule)">
              <td style="padding:4px 0"><strong>Last Restore Drill:</strong></td>
              <td style="text-align:right"><code>not_configured</code></td>
            </tr>
          </tbody>
        </table>
        </div>
        <button type="button" class="btn btn-secondary" id="btn-run-backup-drill">Run Encrypted Backup Drill</button>
        <div id="backup-drill-result" style="margin-top:8px;font-size:12px"></div>
      </section>
    </div>

${SETTINGS_SCRIPT}
  `;

  return renderAdminShell('Settings & Calibration', '/admin/settings', content);
}
