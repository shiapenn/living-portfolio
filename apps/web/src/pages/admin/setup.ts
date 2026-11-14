import { loadConfig } from "@living-portfolio/config";
import { escapeHtml } from "../../lib/html.js";
import { renderLayout } from "../../layouts/public-shell.js";
import { WIZARD_STRINGS } from "../../strings.js";
import { SETUP_SCRIPT_PART_1 } from './setup-script-part1.js';
import { SETUP_SCRIPT_PART_2 } from './setup-script-part2.js';

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
${SETUP_SCRIPT_PART_1}
${SETUP_SCRIPT_PART_2}
  `;
  return renderLayout('First-Run Setup', '/admin/setup', content);
}
