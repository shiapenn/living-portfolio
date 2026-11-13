import { loadConfig } from "@living-portfolio/config";
import { escapeHtml } from "../../lib/html.js";
import { renderLayout } from "../../layouts/public-shell.js";
import { WIZARD_STRINGS } from "../../strings.js";
import { ADMIN_API_CLIENT_SCRIPT } from "./workspace.js";

export function renderAdminSetupPage(): string {
  const content = `
    <div class="admin-setup-container" style="max-width:680px;margin:32px auto;padding:24px;border:1px solid var(--rule);background:var(--surface-page)">
      <div class="wizard-header" style="margin-bottom:20px;border-bottom:1px solid var(--rule);padding-bottom:16px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <span class="chip" id="wizard-step-chip">Step 1 of 6 · First-Run Wizard</span>
          <span style="font-size:12px;color:var(--text-muted)">The Living Portfolio</span>
        </div>
        <div class="wizard-progress-bar" style="height:4px;background:var(--surface-panel);border-radius:2px;overflow:hidden">
          <div id="wizard-progress-fill" style="height:100%;width:16.6%;background:var(--accent);transition:width 0.3s ease"></div>
        </div>
        <div class="wizard-step-labels" style="display:flex;justify-content:space-between;margin-top:8px;font-size:11px;color:var(--text-muted)">
          <span id="step-lbl-1" style="font-weight:700;color:var(--text)">1. Account</span>
          <span id="step-lbl-2">2. Hosting</span>
          <span id="step-lbl-3">3. Providers</span>
          <span id="step-lbl-4">4. Alerts</span>
          <span id="step-lbl-5">5. Backups</span>
          <span id="step-lbl-6">6. Walkthrough</span>
        </div>
      </div>

      <div id="setup-status" role="alert" style="margin-bottom:16px;display:none"></div>

      <!-- Step 1: Owner Account Setup -->
      <div id="wizard-step-1" class="wizard-step">
        <h1 style="font-size:24px;margin:4px 0 8px 0">${WIZARD_STRINGS.step1.title}</h1>
        <p style="font-size:14px;color:var(--text-muted);margin:0 0 16px 0">
          ${WIZARD_STRINGS.step1.subtitle}
        </p>

        <form id="admin-setup-form">
          <div style="margin-bottom:12px">
            <label for="setup-username" style="display:block;font-size:13px;font-weight:600;margin-bottom:4px">${WIZARD_STRINGS.step1.fields.username.label}</label>
            <input id="setup-username" type="text" class="ask-input" style="width:100%;padding:8px" required />
            <div style="font-size:12px;color:var(--text-muted);margin-top:4px">${WIZARD_STRINGS.step1.fields.username.help}</div>
          </div>
          <div style="margin-bottom:12px">
            <label for="setup-password" style="display:block;font-size:13px;font-weight:600;margin-bottom:4px">${WIZARD_STRINGS.step1.fields.password.label}</label>
            <input id="setup-password" type="password" minlength="12" class="ask-input" style="width:100%;padding:8px" required />
            <div style="font-size:12px;color:var(--text-muted);margin-top:4px">${WIZARD_STRINGS.step1.fields.password.help}</div>
          </div>
          <div style="margin-bottom:16px">
            <label for="setup-totp-secret" style="display:block;font-size:13px;font-weight:600;margin-bottom:4px">${WIZARD_STRINGS.step1.fields.totpSecret.label}</label>
            <input id="setup-totp-secret" type="text" class="ask-input" style="width:100%;padding:8px;font-family:var(--font-code)" placeholder="Leave blank to generate random secret" />
            <div style="font-size:12px;color:var(--text-muted);margin-top:4px">${WIZARD_STRINGS.step1.fields.totpSecret.help}</div>
          </div>
          <button type="submit" class="btn btn-secondary" style="width:100%;padding:10px">${WIZARD_STRINGS.step1.submitButton}</button>
        </form>

        <div id="totp-enrolment-container" style="display:none;margin-top:16px;padding:16px;border:1px solid var(--rule);background:var(--surface-subtle)">
          <h3 style="font-size:18px;margin:0 0 8px 0">${WIZARD_STRINGS.step1.enrolment.title}</h3>
          <p style="font-size:13px;color:var(--text-muted);margin:0 0 12px 0">
            ${WIZARD_STRINGS.step1.enrolment.instructions}
          </p>
          <div id="setup-qr-code" style="max-width:200px;margin:12px auto;background:#fff;padding:8px;border-radius:4px;text-align:center"></div>
          <div style="margin:12px 0;text-align:center">
            <span style="font-size:12px;color:var(--text-muted)">${WIZARD_STRINGS.step1.enrolment.manualKeyLabel} </span>
            <code id="setup-manual-key" style="font-size:14px;font-weight:700;word-break:break-all"></code>
          </div>
          <form id="totp-confirm-form" style="margin-top:16px">
            <div style="margin-bottom:12px">
              <label for="confirm-totp-code" style="display:block;font-size:13px;font-weight:600;margin-bottom:4px">${WIZARD_STRINGS.step1.enrolment.codeLabel}</label>
              <input id="confirm-totp-code" type="text" maxlength="6" pattern="[0-9]{6}" class="ask-input" style="width:100%;padding:8px;text-align:center;font-size:18px;letter-spacing:4px" placeholder="000000" required />
            </div>
            <div id="totp-confirm-error" role="alert" class="later-thinking-banner" style="display:none;margin-bottom:12px"></div>
            <button id="btn-confirm-totp" type="submit" class="btn btn-secondary" style="width:100%;padding:10px">${WIZARD_STRINGS.step1.enrolment.verifyButton}</button>
          </form>
        </div>

        <div id="credentials-display-container" style="display:none;margin-top:16px;padding:20px;border:1px solid var(--rule);background:var(--surface-subtle);border-radius:6px">
          <h3 style="font-size:18px;margin:0 0 8px 0">${WIZARD_STRINGS.step1.credentials.title}</h3>
          <p style="font-size:13px;color:var(--text-muted);margin:0 0 16px 0">
            ${WIZARD_STRINGS.step1.credentials.instructions}
          </p>

          <div style="margin-bottom:16px;padding:12px;background:var(--surface);border:1px solid var(--rule);border-radius:4px">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
              <span style="font-size:12px;font-weight:600;text-transform:uppercase;color:var(--text-muted)">${WIZARD_STRINGS.step1.credentials.totpKeyLabel}</span>
              <button type="button" class="btn btn-secondary" id="btn-copy-totp-key" style="font-size:12px;padding:4px 8px">Copy Key</button>
            </div>
            <code id="credentials-totp-key" style="font-size:14px;font-weight:700;word-break:break-all"></code>
            <p style="font-size:12px;color:var(--text-muted);margin:4px 0 0 0">
              ${WIZARD_STRINGS.step1.credentials.totpKeyHelp}
            </p>
          </div>

          <div style="margin-bottom:16px;padding:12px;background:var(--surface);border:1px solid var(--rule);border-radius:4px">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
              <span style="font-size:12px;font-weight:600;text-transform:uppercase;color:var(--text-muted)">${WIZARD_STRINGS.step1.credentials.recoveryCodesLabel}</span>
              <div style="display:flex;gap:8px">
                <button type="button" class="btn btn-secondary" id="btn-copy-recovery-codes" style="font-size:12px;padding:4px 8px">Copy All</button>
                <button type="button" class="btn btn-secondary" id="btn-download-recovery-codes" style="font-size:12px;padding:4px 8px">Download (.txt)</button>
              </div>
            </div>
            <div id="recovery-codes-grid" style="display:grid;grid-template-columns:repeat(2, 1fr);gap:8px;font-family:var(--font-code);font-size:14px;font-weight:600">
            </div>
            <p style="font-size:12px;color:var(--text-muted);margin:8px 0 0 0">
              ${WIZARD_STRINGS.step1.credentials.recoveryCodesHelp}
            </p>
          </div>

          <div style="margin:16px 0;padding:12px;background:rgba(234, 179, 8, 0.1);border:1px solid rgba(234, 179, 8, 0.3);border-radius:4px">
            <label style="display:flex;align-items:center;gap:8px;font-size:13px;font-weight:600;cursor:pointer">
              <input type="checkbox" id="setup-saved-credentials-gate" style="width:16px;height:16px" />
              <span>${WIZARD_STRINGS.step1.credentials.gateLabel}</span>
            </label>
          </div>

          <button type="button" class="btn btn-primary" id="btn-continue-step2" disabled style="width:100%;padding:10px;margin-bottom:8px">${WIZARD_STRINGS.step1.credentials.continueButton}</button>
        </div>
      </div>

      <!-- Step 2: Hosting Option & Preset -->
      <div id="wizard-step-2" class="wizard-step" style="display:none">
        <h2 style="font-size:22px;margin:4px 0 8px 0">${WIZARD_STRINGS.step2.title}</h2>
        <p style="font-size:14px;color:var(--text-muted);margin:0 0 16px 0">
          ${WIZARD_STRINGS.step2.subtitle}
        </p>

        <div style="display:flex;flex-direction:column;gap:10px;margin-bottom:16px">
          ${WIZARD_STRINGS.step2.hostingPresets.map((preset, idx) => `
            <label style="display:flex;align-items:flex-start;gap:10px;padding:12px;border:1px solid var(--rule);background:var(--surface-subtle);cursor:pointer">
              <input type="radio" name="hosting-preset" value="${preset.value}" ${idx === 0 ? 'checked' : ''} style="margin-top:3px" />
              <div>
                <strong>${preset.title}</strong>
                <div style="font-size:13px;color:var(--text);margin-top:2px">${preset.sentence}</div>
                <div style="font-size:12px;color:var(--text-muted);margin-top:2px">${preset.tradeoff}</div>
              </div>
            </label>
          `).join('')}
        </div>

        <div style="margin-bottom:16px;border-top:1px solid var(--rule);padding-top:16px">
          <label for="setup-origin-url" style="display:block;font-size:13px;font-weight:600;margin-bottom:4px">${WIZARD_STRINGS.step2.originUrl.label}</label>
          <input type="text" id="setup-origin-url" class="ask-input" style="width:100%;padding:8px" placeholder="${WIZARD_STRINGS.step2.originUrl.placeholder}" />
          <div style="font-size:12px;color:var(--text-muted);margin-top:4px">${WIZARD_STRINGS.step2.originUrl.help}</div>
        </div>

        <div style="display:flex;justify-content:space-between">
          <button type="button" class="btn btn-secondary btn-nav-step" data-target="1">${WIZARD_STRINGS.step2.backButton}</button>
          <button type="button" class="btn btn-primary btn-nav-step" data-target="3">${WIZARD_STRINGS.step2.nextButton}</button>
        </div>
      </div>

      <!-- Step 3: Model Providers & Privacy Boundary -->
      <div id="wizard-step-3" class="wizard-step" style="display:none">
        <h2 style="font-size:22px;margin:4px 0 8px 0">${WIZARD_STRINGS.step3.title}</h2>
        <p style="font-size:14px;color:var(--text-muted);margin:0 0 16px 0">
          ${WIZARD_STRINGS.step3.subtitle}
        </p>

        <div class="table-wrap" style="margin-bottom:16px">
          <table style="width:100%;border-collapse:collapse;font-size:13px">
            <thead>
              <tr style="border-bottom:1px solid var(--rule);text-align:left">
                ${WIZARD_STRINGS.step3.providersTable.headers.map(h => `<th style="padding:6px">${h}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${WIZARD_STRINGS.step3.providersTable.rows.map(row => `
                <tr style="border-bottom:1px solid var(--rule)">
                  <td style="padding:8px"><strong>${row.name}</strong></td>
                  <td style="padding:8px">${row.classes.map(c => `<span style="display:inline-block;padding:2px 6px;border-radius:2px;background:var(--surface-subtle);border:1px solid var(--rule);font-size:11px;color:var(--text-muted);cursor:default">${c}</span>`).join(' ')}</td>
                  <td style="padding:8px"><code>${row.model}</code></td>
                  <td style="padding:8px;color:${row.isLocal ? 'var(--status-ok)' : 'var(--text-muted)'}" ${row.statusId ? `id="${row.statusId}"` : ''}>${row.status}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div class="as-of-banner" style="margin-bottom:16px">
          <strong>${WIZARD_STRINGS.step3.boundaryNotice}</strong>
          <p id="step3-keys-notice" style="margin:8px 0 0 0;font-weight:normal">${WIZARD_STRINGS.step3.keysNotice}</p>
        </div>

        <div style="display:flex;justify-content:space-between">
          <button type="button" class="btn btn-secondary btn-nav-step" data-target="2">${WIZARD_STRINGS.step3.backButton}</button>
          <button type="button" class="btn btn-primary btn-nav-step" data-target="4">${WIZARD_STRINGS.step3.nextButton}</button>
        </div>
      </div>

      <!-- Step 4: Notifications -->
      <div id="wizard-step-4" class="wizard-step" style="display:none">
        <h2 style="font-size:22px;margin:4px 0 8px 0">${WIZARD_STRINGS.step4.title}</h2>
        <p style="font-size:14px;color:var(--text-muted);margin:0 0 16px 0">
          ${WIZARD_STRINGS.step4.subtitle}
        </p>

        <div style="margin-bottom:12px">
          <label for="setup-notification-channel" style="display:block;font-size:13px;font-weight:600;margin-bottom:4px">${WIZARD_STRINGS.step4.channel.label}</label>
          <select id="setup-notification-channel" class="ask-input" style="width:100%;padding:8px">
            ${WIZARD_STRINGS.step4.channel.options.map(opt => `<option value="${opt.value}">${opt.label}</option>`).join('')}
          </select>
        </div>

        <div style="margin-bottom:16px">
          <label for="setup-notification-target" style="display:block;font-size:13px;font-weight:600;margin-bottom:4px">${WIZARD_STRINGS.step4.target.label}</label>
          <input type="text" id="setup-notification-target" class="ask-input" style="width:100%;padding:8px" placeholder="${WIZARD_STRINGS.step4.target.placeholder}" />
          <div style="font-size:12px;color:var(--text-muted);margin-top:4px">${WIZARD_STRINGS.step4.target.help}</div>
        </div>

        <div style="margin-bottom:16px">
          <button type="button" class="btn btn-secondary" id="btn-setup-test-alert" disabled title="${WIZARD_STRINGS.step4.testDisabledReason}">${WIZARD_STRINGS.step4.testButton}</button>
          <div id="setup-alert-disabled-reason" style="font-size:12px;color:var(--text-muted);margin-top:4px">${WIZARD_STRINGS.step4.testDisabledReason}</div>
          <div id="setup-alert-result" style="margin-top:8px;display:none" role="alert"></div>
        </div>

        <div style="display:flex;justify-content:space-between">
          <button type="button" class="btn btn-secondary btn-nav-step" data-target="3">${WIZARD_STRINGS.step4.backButton}</button>
          <button type="button" class="btn btn-primary btn-nav-step" data-target="5">${WIZARD_STRINGS.step4.nextButton}</button>
        </div>
      </div>

      <!-- Step 5: Backups -->
      <div id="wizard-step-5" class="wizard-step" style="display:none">
        <h2 style="font-size:22px;margin:4px 0 8px 0">${WIZARD_STRINGS.step5.title}</h2>
        <p style="font-size:14px;color:var(--text-muted);margin:0 0 16px 0">
          ${WIZARD_STRINGS.step5.subtitle}
        </p>

        <div style="margin-bottom:12px">
          <label for="setup-backup-dest" style="display:block;font-size:13px;font-weight:600;margin-bottom:4px">${WIZARD_STRINGS.step5.destination.label}</label>
          <select id="setup-backup-dest" class="ask-input" style="width:100%;padding:8px">
            ${WIZARD_STRINGS.step5.destination.options.map(opt => `<option value="${opt.value}">${opt.label}</option>`).join('')}
          </select>
        </div>

        <div style="margin-bottom:12px">
          <label for="setup-backup-dir" style="display:block;font-size:13px;font-weight:600;margin-bottom:4px">${WIZARD_STRINGS.step5.folder.label}</label>
          <input type="text" id="setup-backup-dir" class="ask-input" style="width:100%;padding:8px" value="./data/backups" placeholder="${WIZARD_STRINGS.step5.folder.placeholder}" />
          <div style="font-size:12px;color:var(--text-muted);margin-top:4px">${WIZARD_STRINGS.step5.folder.help}</div>
        </div>

        <div style="margin-bottom:16px">
          <label for="setup-age-key" style="display:block;font-size:13px;font-weight:600;margin-bottom:4px">${WIZARD_STRINGS.step5.ageKey.label}</label>
          <input type="text" id="setup-age-key" class="ask-input" style="width:100%;padding:8px;font-family:var(--font-code)" placeholder="${WIZARD_STRINGS.step5.ageKey.placeholder}" />
          <div style="font-size:12px;color:var(--text-muted);margin-top:4px">${WIZARD_STRINGS.step5.ageKey.help}</div>
        </div>

        <div style="margin-bottom:16px">
          <button type="button" class="btn btn-secondary" id="btn-setup-test-drill">${WIZARD_STRINGS.step5.drillButton}</button>
          <div id="setup-drill-result" style="margin-top:8px;display:none" role="alert"></div>
        </div>

        <div style="display:flex;justify-content:space-between">
          <button type="button" class="btn btn-secondary btn-nav-step" data-target="4">${WIZARD_STRINGS.step5.backButton}</button>
          <button type="button" class="btn btn-primary btn-nav-step" data-target="6">${WIZARD_STRINGS.step5.nextButton}</button>
        </div>
      </div>

      <!-- Step 6: Theme Selection & First-Run Walkthrough -->
      <div id="wizard-step-6" class="wizard-step" style="display:none">
        <h2 style="font-size:22px;margin:4px 0 8px 0">${WIZARD_STRINGS.step6.title}</h2>
        <p style="font-size:14px;color:var(--text-muted);margin:0 0 8px 0">
          ${WIZARD_STRINGS.step6.subtitle}
        </p>
        <p id="step6-theme-notice" style="font-size:13px;color:var(--text-muted);margin:0 0 16px 0">
          ${WIZARD_STRINGS.step6.themeAppliedNotice}
        </p>

        <div style="display:grid;grid-template-columns:repeat(3, 1fr);gap:12px;margin-bottom:20px">
          ${WIZARD_STRINGS.step6.themePresets.map((theme, idx) => `
            <label class="theme-card" style="display:flex;flex-direction:column;gap:6px;padding:12px;border:${idx === 0 ? '2px solid var(--accent)' : '1px solid var(--rule)'};background:${idx === 0 ? 'var(--surface-subtle)' : 'transparent'};cursor:pointer;border-radius:4px">
              <div style="display:flex;align-items:center;gap:8px">
                <input type="radio" name="theme-preset" value="${theme.value}" ${idx === 0 ? 'checked' : ''} />
                <strong>${theme.title}</strong>
              </div>
              <div style="font-size:12px;color:var(--text-muted)">${theme.description}</div>
            </label>
          `).join('')}
        </div>

        <!-- First-Run Walkthrough Worked Example Card -->
        <div class="as-of-banner" style="margin-bottom:20px">
          <h3 style="font-size:16px;margin:0 0 6px 0">${WIZARD_STRINGS.step6.workedExample.title}</h3>
          <p style="font-size:13px;line-height:1.5;margin:0 0 10px 0">
            ${WIZARD_STRINGS.step6.workedExample.lead}
          </p>
          <ul style="font-size:13px;margin:0 0 12px 18px;line-height:1.5">
            ${WIZARD_STRINGS.step6.workedExample.claims.map(c => `<li><strong>${c.label}:</strong> ${c.text}</li>`).join('')}
          </ul>
          <p style="font-size:13px;font-style:italic;margin:0">
            "${WIZARD_STRINGS.step6.workedExample.closing}"
          </p>
        </div>

        <p style="font-size:12px;color:var(--text-muted);margin-bottom:12px">${WIZARD_STRINGS.step6.deployNotice}</p>

        <div style="display:flex;gap:12px">
          <a href="/admin" class="btn btn-primary" id="btn-setup-finish-login" style="flex:1;text-align:center;padding:12px">${WIZARD_STRINGS.step6.finishButton}</a>
          <a href="/admin/import" class="btn btn-secondary" id="btn-setup-launch-import" style="flex:1;text-align:center;padding:12px">${WIZARD_STRINGS.step6.importButton}</a>
        </div>

        <div style="margin-top:16px;text-align:left">
          <button type="button" class="btn btn-secondary btn-nav-step" data-target="5">${WIZARD_STRINGS.step6.backButton}</button>
        </div>
      </div>
    </div>
    <script>
      (function() {
        const form = document.getElementById('admin-setup-form');
        const statusBox = document.getElementById('setup-status');
        const chip = document.getElementById('wizard-step-chip');
        const progressFill = document.getElementById('wizard-progress-fill');
        const completedActions = document.getElementById('account-completed-actions');

        ${ADMIN_API_CLIENT_SCRIPT}

        let currentActiveStep = 1;

        async function saveStep(stepNum) {
          try {
            if (stepNum === 2) {
              const presetEl = document.querySelector('input[name="hosting-preset"]:checked');
              const preset = presetEl ? presetEl.value : 'hobbyist-docker';
              const publicAddress = (document.getElementById('setup-origin-url') || {}).value || '';
              await apiClient('/api/settings/hosting', {
                method: 'PATCH',
                body: JSON.stringify({ preset: preset, publicAddress: publicAddress })
              });
            } else if (stepNum === 4) {
              const channel = (document.getElementById('setup-notification-channel') || {}).value || 'ntfy';
              const target = (document.getElementById('setup-notification-target') || {}).value || '';
              await apiClient('/api/settings/notifications', {
                method: 'PATCH',
                body: JSON.stringify({ channel: channel, target: target })
              });
            } else if (stepNum === 5) {
              const destination = (document.getElementById('setup-backup-dest') || {}).value || 'local';
              const agePublicKey = (document.getElementById('setup-age-key') || {}).value || '';
              await apiClient('/api/settings/backups', {
                method: 'PATCH',
                body: JSON.stringify({ destination: destination, agePublicKey: agePublicKey })
              });
            } else if (stepNum === 6) {
              const themeEl = document.querySelector('input[name="theme-preset"]:checked');
              const preset = themeEl ? themeEl.value : 'editorial-classic';
              await apiClient('/api/settings/theme', {
                method: 'PATCH',
                body: JSON.stringify({ preset: preset })
              });
            }
          } catch (_) {}
        }

        async function restoreSettings() {
          try {
            const sessRes = await apiClient('/api/auth/session');
            if (sessRes.ok) {
              const sessData = await sessRes.json();
              if (sessData.authenticated) {
                const f = document.getElementById('admin-setup-form');
                if (f) f.style.display = 'none';
                const s = document.getElementById('setup-status');
                if (s) s.style.display = 'none';
                if (currentActiveStep === 1) {
                  goToStep(2);
                }
              }
            }

            const res = await apiClient('/api/settings');
            if (!res.ok) return;
            const data = await res.json();
            if (data.hosting) {
              const preset = data.hosting.preset || data.preset;
              if (preset) {
                const r = document.querySelector('input[name="hosting-preset"][value="' + preset + '"]');
                if (r) r.checked = true;
              }
              if (data.hosting.publicAddress) {
                const urlInput = document.getElementById('setup-origin-url');
                if (urlInput) urlInput.value = data.hosting.publicAddress;
              }
            }
            if (data.notifications) {
              if (data.notifications.channel) {
                const chanSelect = document.getElementById('setup-notification-channel');
                if (chanSelect) chanSelect.value = data.notifications.channel;
              }
              const targetVal = data.notifications.target || data.notifications.topic;
              if (targetVal) {
                const targetInput = document.getElementById('setup-notification-target');
                if (targetInput) targetInput.value = targetVal;
              }
            }
            if (data.backups) {
              if (data.backups.destination) {
                const destSelect = document.getElementById('setup-backup-dest');
                if (destSelect) destSelect.value = data.backups.destination;
              }
              if (data.backups.agePublicKey) {
                const ageInput = document.getElementById('setup-age-key');
                if (ageInput) ageInput.value = data.backups.agePublicKey;
              }
            }
            if (data.themePreset) {
              const tr = document.querySelector('input[name="theme-preset"][value="' + data.themePreset + '"]');
              if (tr) {
                tr.checked = true;
                document.querySelectorAll('.theme-card').forEach(function(card) {
                  card.style.border = '1px solid var(--rule)';
                  card.style.background = 'transparent';
                });
                const parentLabel = tr.closest('.theme-card');
                if (parentLabel) {
                  parentLabel.style.border = '2px solid var(--accent)';
                  parentLabel.style.background = 'var(--surface-subtle)';
                }
              }
            }
          } catch (_) {}
        }

        function goToStep(stepNum) {
          currentActiveStep = stepNum;
          for (let i = 1; i <= 6; i++) {
            const stepEl = document.getElementById('wizard-step-' + i);
            const lblEl = document.getElementById('step-lbl-' + i);
            if (stepEl) {
              stepEl.style.display = i === stepNum ? 'block' : 'none';
            }
            if (lblEl) {
              if (i === stepNum) {
                lblEl.style.fontWeight = '700';
                lblEl.style.color = 'var(--text)';
              } else if (i < stepNum) {
                lblEl.style.fontWeight = '500';
                lblEl.style.color = 'var(--accent)';
              } else {
                lblEl.style.fontWeight = 'normal';
                lblEl.style.color = 'var(--text-muted)';
              }
            }
          }
          if (progressFill) {
            progressFill.style.width = Math.round((stepNum / 6) * 100) + '%';
          }
          if (chip) {
            chip.textContent = 'Step ' + stepNum + ' of 6 · First-Run Wizard';
          }
        }

        document.querySelectorAll('.btn-nav-step').forEach(function(btn) {
          btn.addEventListener('click', async function() {
            const target = parseInt(btn.getAttribute('data-target') || '1', 10);
            if (target > currentActiveStep) {
              await saveStep(currentActiveStep);
            }
            goToStep(target);
          });
        });

        document.querySelectorAll('input[name="theme-preset"]').forEach(function(radio) {
          radio.addEventListener('change', function() {
            document.querySelectorAll('.theme-card').forEach(function(card) {
              card.style.border = '1px solid var(--rule)';
              card.style.background = 'transparent';
            });
            const parentLabel = radio.closest('.theme-card');
            if (parentLabel) {
              parentLabel.style.border = '2px solid var(--accent)';
              parentLabel.style.background = 'var(--surface-subtle)';
            }
            saveStep(6);
          });
        });

        const finishLoginBtn = document.getElementById('btn-setup-finish-login');
        if (finishLoginBtn) {
          finishLoginBtn.addEventListener('click', async function() {
            await saveStep(6);
            await apiClient('/api/settings', {
              method: 'PATCH',
              body: JSON.stringify({ setupWizardCompleted: true })
            });
          });
        }
        const launchImportBtn = document.getElementById('btn-setup-launch-import');
        if (launchImportBtn) {
          launchImportBtn.addEventListener('click', async function() {
            await saveStep(6);
            await apiClient('/api/settings', {
              method: 'PATCH',
              body: JSON.stringify({ setupWizardCompleted: true })
            });
          });
        }

        restoreSettings();

        const continueBtn = document.getElementById('btn-continue-step2');
        if (continueBtn) {
          continueBtn.addEventListener('click', function() {
            goToStep(2);
          });
        }

        let cachedSetupData = null;

        form.addEventListener('submit', async function(e) {
          e.preventDefault();
          statusBox.style.display = 'none';
          const username = document.getElementById('setup-username').value;
          const password = document.getElementById('setup-password').value;
          const totpSecret = document.getElementById('setup-totp-secret').value || undefined;

          try {
            const res = await apiClient('/api/auth/setup', {
              method: 'POST',
              body: JSON.stringify({ username, password, totpSecret })
            });
            const data = await res.json();
            if (res.ok) {
              cachedSetupData = data;
              form.style.display = 'none';
              const qrBox = document.getElementById('setup-qr-code');
              if (qrBox) qrBox.innerHTML = data.qrCodeSvg || '';
              const keyEl = document.getElementById('setup-manual-key');
              if (keyEl) keyEl.textContent = data.totpSecretBase32 || '';
              const enrolBox = document.getElementById('totp-enrolment-container');
              if (enrolBox) enrolBox.style.display = 'block';
            } else if (res.status === 409) {
              statusBox.className = 'later-thinking-banner';
              statusBox.textContent = data.error || 'Account setup already completed.';
              statusBox.style.display = 'block';
            } else if (res.status >= 500) {
              statusBox.className = 'later-thinking-banner';
              statusBox.textContent = 'Server error during setup. Please retry.';
              statusBox.style.display = 'block';
            } else {
              statusBox.className = 'later-thinking-banner';
              statusBox.textContent = data.error || ('Setup failed (HTTP ' + res.status + ')');
              statusBox.style.display = 'block';
            }
          } catch (err) {
            statusBox.className = 'later-thinking-banner';
            statusBox.textContent = 'Network error during setup.';
            statusBox.style.display = 'block';
          }
        });

        const confirmForm = document.getElementById('totp-confirm-form');
        if (confirmForm) {
          confirmForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const codeInput = document.getElementById('confirm-totp-code');
            const code = codeInput ? codeInput.value.trim() : '';
            const confirmError = document.getElementById('totp-confirm-error');
            if (confirmError) confirmError.style.display = 'none';

            try {
              const res = await apiClient('/api/auth/totp/confirm', {
                method: 'POST',
                body: JSON.stringify({ code })
              });
              const data = await res.json();
              if (res.ok) {
                if (data.csrfToken) {
                  sessionStorage.setItem('lp_csrf_token', data.csrfToken);
                }
                const enrolBox = document.getElementById('totp-enrolment-container');
                if (enrolBox) enrolBox.style.display = 'none';
                statusBox.className = 'as-of-banner';
                const secret = (cachedSetupData && cachedSetupData.totpSecret) || '';
                // Per D-12 & WP-13.2: Stop showing the bearer token in the wizard
                statusBox.innerHTML = '<strong>Setup Completed!</strong> Authenticator enrolled and session established. TOTP secret hex: <code>' + secret + '</code>.';
                statusBox.style.display = 'block';

                const credBox = document.getElementById('credentials-display-container');
                if (credBox) {
                  const keyEl = document.getElementById('credentials-totp-key');
                  if (keyEl) keyEl.textContent = (cachedSetupData && (cachedSetupData.totpSecretBase32 || cachedSetupData.totpSecret)) || '';
                  const grid = document.getElementById('recovery-codes-grid');
                  if (grid && cachedSetupData && cachedSetupData.recoveryCodes) {
                    grid.innerHTML = cachedSetupData.recoveryCodes.map(function(c) {
                      return '<div style="padding:4px 8px;background:var(--surface);border:1px solid var(--rule);border-radius:4px;text-align:center"><code>' + c + '</code></div>';
                    }).join('');
                  }
                  credBox.style.display = 'block';
                }
              } else {
                if (confirmError) {
                  confirmError.textContent = data.message || data.error || 'Invalid TOTP code. Please check your authenticator app.';
                  confirmError.style.display = 'block';
                }
              }
            } catch (err) {
              if (confirmError) {
                confirmError.textContent = 'Network error verifying TOTP code.';
                confirmError.style.display = 'block';
              }
            }
          });
        }

        // Credentials screen interactive handlers (WP-13.3, UX-30)
        const savedGate = document.getElementById('setup-saved-credentials-gate');
        if (savedGate && continueBtn) {
          savedGate.addEventListener('change', function() {
            if (savedGate.checked) {
              continueBtn.disabled = false;
              continueBtn.removeAttribute('disabled');
            } else {
              continueBtn.disabled = true;
              continueBtn.setAttribute('disabled', 'disabled');
            }
          });
        }

        const downloadBtn = document.getElementById('btn-download-recovery-codes');
        if (downloadBtn) {
          downloadBtn.addEventListener('click', function() {
            const codes = (cachedSetupData && cachedSetupData.recoveryCodes) || [];
            const username = (cachedSetupData && cachedSetupData.username) || 'owner';
            const text = 'Living Portfolio Emergency Recovery Codes\\n' +
              'Account: ' + username + '\\n' +
              'Generated: ' + new Date().toISOString() + '\\n\\n' +
              'Each code can be used once if you lose access to your authenticator app:\\n\\n' +
              codes.map(function(c, i) { return (i + 1) + '. ' + c; }).join('\\n') + '\\n';
            const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'living-portfolio-recovery-codes.txt';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          });
        }

        const copyCodesBtn = document.getElementById('btn-copy-recovery-codes');
        if (copyCodesBtn) {
          copyCodesBtn.addEventListener('click', function() {
            const codes = (cachedSetupData && cachedSetupData.recoveryCodes) || [];
            if (navigator.clipboard && navigator.clipboard.writeText) {
              navigator.clipboard.writeText(codes.join('\\n'));
              copyCodesBtn.textContent = 'Copied!';
              setTimeout(function() { copyCodesBtn.textContent = 'Copy All'; }, 2000);
            }
          });
        }

        const copyKeyBtn = document.getElementById('btn-copy-totp-key');
        if (copyKeyBtn) {
          copyKeyBtn.addEventListener('click', function() {
            const key = (cachedSetupData && (cachedSetupData.totpSecretBase32 || cachedSetupData.totpSecret)) || '';
            if (navigator.clipboard && navigator.clipboard.writeText) {
              navigator.clipboard.writeText(key);
              copyKeyBtn.textContent = 'Copied!';
              setTimeout(function() { copyKeyBtn.textContent = 'Copy Key'; }, 2000);
            }
          });
        }

        // Step 4: Notification test disabled in this version (UX-33, WP-17.2)
        const notifTargetInput = document.getElementById('setup-notification-target');
        const testAlertBtn = document.getElementById('btn-setup-test-alert');
        const alertDisabledReason = document.getElementById('setup-alert-disabled-reason');
        function updateAlertButton() {
          if (!testAlertBtn) return;
          testAlertBtn.disabled = true;
          if (alertDisabledReason) {
            alertDisabledReason.style.display = 'block';
          }
        }
        if (notifTargetInput) {
          notifTargetInput.addEventListener('input', updateAlertButton);
          updateAlertButton();
        }

        const alertResult = document.getElementById('setup-alert-result');
        if (testAlertBtn && alertResult) {
          testAlertBtn.addEventListener('click', async function() {
            alertResult.style.display = 'none';
            try {
              const res = await apiClient('/api/settings/notifications/test', { method: 'POST' });
              const data = await res.json();
              alertResult.className = 'later-thinking-banner';
              alertResult.textContent = data.message || "Test alerts aren't available in this version yet.";
              alertResult.style.display = 'block';
            } catch (err) {
              alertResult.className = 'later-thinking-banner';
              alertResult.textContent = "Test alerts aren't available in this version yet.";
              alertResult.style.display = 'block';
            }
          });
        }

        // Step 5: Test Drill button
        const testDrillBtn = document.getElementById('btn-setup-test-drill');
        const drillResult = document.getElementById('setup-drill-result');
        if (testDrillBtn && drillResult) {
          testDrillBtn.addEventListener('click', async function() {
            drillResult.style.display = 'none';
            const destFolder = (document.getElementById('setup-backup-dir') || {}).value || './data/backups';
            const ageKey = (document.getElementById('setup-age-key') || {}).value || '';

            try {
              const res = await apiClient('/api/settings/backups/run-drill', {
                method: 'POST',
                body: JSON.stringify({ destinationDir: destFolder.trim() || undefined, agePublicKey: ageKey.trim() || undefined })
              });
              const data = await res.json();
              if (res.status === 501) {
                drillResult.className = 'later-thinking-banner';
                drillResult.textContent = data.message || 'Not available until a backup folder is set';
                drillResult.style.display = 'block';
              } else if (res.ok && data.ok) {
                drillResult.className = 'chip';
                drillResult.textContent = '✓ Backup created & restore verification drill succeeded!';
                drillResult.style.display = 'block';
              } else {
                drillResult.className = 'later-thinking-banner';
                drillResult.textContent = data.message || data.error || "The app can't write to that folder. Choose another folder or fix its permissions.";
                drillResult.style.display = 'block';
              }
            } catch (err) {
              drillResult.className = 'later-thinking-banner';
              drillResult.textContent = "The app can't write to that folder. Choose another folder or fix its permissions.";
              drillResult.style.display = 'block';
            }
          });
        }

        // Step 6: Trigger static deploy on finish
        const finishBtn = document.getElementById('btn-setup-finish-login');
        if (finishBtn) {
          finishBtn.addEventListener('click', function() {
            apiClient('/api/publish/now', { method: 'POST' }).catch(function() {});
          });
        }
      })();
    </script>
  `;
  return renderLayout('First-Run Setup', '/admin/setup', content);
}
