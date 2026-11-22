import { renderAdminShell } from "../../layouts/admin-shell.js";
import { renderStatusLine } from "../../components/index.js";
import { renderActionBar, renderBackLink, renderButton, renderChoiceGroup, renderField, renderIcon, renderItem } from "../../primitives/index.js";
import { PROVIDERS_CATALOG, renderProviderFlow } from "../../patterns/provider-flow.js";
import { WIZARD_STRINGS } from "../../strings.js";
import { SETUP_SCRIPT_PART_1 } from './setup-script-part1.js';
import { SETUP_SCRIPT_PART_2 } from './setup-script-part2.js';

export function renderAdminSetupPage(): string {
  const stepTitle = (raw: string) => raw.replace(/^Step \d+:\s*/, '');
  const content = `
    <div class="lp-page-column admin-setup-container lp-stack lp-gap-group">
      <div class="lp-wizard-header" data-c="Stepper" data-rel="stepper">
        <p id="wizard-step-chip" class="lp-auth-step-text">Step 1 of 6 · Account</p>
        <div class="lp-auth-progress-track">
          <div id="wizard-progress-fill" class="lp-auth-progress-fill"></div>
        </div>
      </div>

      <div id="setup-status" role="alert" class="lp-is-hidden"></div>

      <!-- Step 1: Owner Account Setup -->
      <div id="wizard-step-1" class="wizard-step lp-stack lp-gap-group">
        <div class="lp-page-header" data-c="PageHeader">
          <h1 class="lp-page-title" data-rel="title">${WIZARD_STRINGS.step1.title}</h1>
          <p class="lp-page-description" data-rel="description">${WIZARD_STRINGS.step1.subtitle}</p>
        </div>

        <form id="admin-setup-form" class="lp-stack lp-gap-group">
          <div class="lp-stack lp-gap-related">
            <div class="lp-field">
              <label for="setup-username" class="lp-field-label">${WIZARD_STRINGS.step1.fields.username.label}</label>
              <input id="setup-username" type="text" class="lp-input" required />
              <div class="lp-help-text">${WIZARD_STRINGS.step1.fields.username.help}</div>
            </div>
            <div class="lp-field">
              <label for="setup-password" class="lp-field-label">${WIZARD_STRINGS.step1.fields.password.label}</label>
              <input id="setup-password" type="password" minlength="12" class="lp-input" required />
              <div class="lp-help-text">${WIZARD_STRINGS.step1.fields.password.help}</div>
            </div>
            <div class="lp-field">
              <label for="setup-totp-secret" class="lp-field-label">${WIZARD_STRINGS.step1.fields.totpSecret.label}</label>
              <input id="setup-totp-secret" type="text" class="lp-input" placeholder="Generated if blank" />
              <div class="lp-help-text">${WIZARD_STRINGS.step1.fields.totpSecret.help}</div>
            </div>
          </div>
          ${renderActionBar({
            level: 'page',
            primary: { label: WIZARD_STRINGS.step1.submitButton, type: 'submit', variant: 'primary' },
          })}
        </form>

        <div id="totp-enrolment-container" class="lp-wizard-panel lp-stack-md lp-is-hidden">
          <div>
            <h3 class="lp-section-title">${WIZARD_STRINGS.step1.enrolment.title}</h3>
            <p class="lp-body-sm-muted">${WIZARD_STRINGS.step1.enrolment.instructions}</p>
          </div>
          <div id="setup-qr-code" class="lp-qr-box"></div>
          <div class="lp-help-text">
            <span>${WIZARD_STRINGS.step1.enrolment.manualKeyLabel} </span>
            <code id="setup-manual-key"></code>
          </div>
          <form id="totp-confirm-form" class="lp-stack-md">
            <div class="lp-field">
              <label for="confirm-totp-code" class="lp-field-label">${WIZARD_STRINGS.step1.enrolment.codeLabel}</label>
              <input id="confirm-totp-code" type="text" maxlength="6" pattern="[0-9]{6}" class="lp-input lp-input-code" placeholder="000000" required />
            </div>
            <div id="totp-confirm-error" role="alert" class="lp-notice lp-notice-danger lp-is-hidden"></div>
            ${renderButton({ label: WIZARD_STRINGS.step1.enrolment.verifyButton, id: 'btn-confirm-totp', type: 'submit', variant: 'secondary', className: 'lp-btn-full' })}
          </form>
        </div>

        <div id="credentials-display-container" class="lp-wizard-panel lp-stack-md lp-is-hidden">
          <div>
            <h3 class="lp-section-title">${WIZARD_STRINGS.step1.credentials.title}</h3>
            <p class="lp-body-sm-muted">${WIZARD_STRINGS.step1.credentials.instructions}</p>
          </div>

          <div class="lp-wizard-panel lp-stack-sm">
            <div class="lp-row-between">
              <span class="lp-field-label">${WIZARD_STRINGS.step1.credentials.totpKeyLabel}</span>
              ${renderButton({ label: 'Copy Key', id: 'btn-copy-totp-key', variant: 'secondary' })}
            </div>
            <code id="credentials-totp-key"></code>
            <p class="lp-help-text">${WIZARD_STRINGS.step1.credentials.totpKeyHelp}</p>
          </div>

          <div class="lp-wizard-panel lp-stack-sm">
            <div class="lp-row-between">
              <span class="lp-field-label">${WIZARD_STRINGS.step1.credentials.recoveryCodesLabel}</span>
              <div class="lp-row-wrap">
                ${renderButton({ label: 'Copy All', id: 'btn-copy-recovery-codes', variant: 'secondary' })}
                ${renderButton({ label: 'Download (.txt)', id: 'btn-download-recovery-codes', variant: 'secondary' })}
              </div>
            </div>
            <div id="recovery-codes-grid" class="lp-code-grid"></div>
            <p class="lp-help-text">${WIZARD_STRINGS.step1.credentials.recoveryCodesHelp}</p>
          </div>

          ${renderChoiceGroup({
            name: 'setup-saved-credentials-gate',
            mode: 'multiple',
            variant: 'card',
            options: [{ id: 'setup-saved-credentials-gate', value: 'confirmed', label: WIZARD_STRINGS.step1.credentials.gateLabel }],
          })}

          ${renderButton({ label: WIZARD_STRINGS.step1.credentials.continueButton, id: 'btn-continue-step2', variant: 'primary', className: 'lp-btn-full', disabled: true })}
        </div>
      </div>

      <!-- Step 2: Hosting Option & Preset -->
      <div id="wizard-step-2" class="wizard-step lp-stack lp-gap-group lp-is-hidden">
        <div class="lp-page-header" data-c="PageHeader">
          ${renderBackLink({ destination: 'Account', href: '/admin/setup?step=1', className: 'btn-nav-step', dataAttrs: { target: '1' } })}
          <h1 class="lp-page-title" data-rel="title">${stepTitle(WIZARD_STRINGS.step2.title)}</h1>
          <p class="lp-page-description" data-rel="description">${WIZARD_STRINGS.step2.subtitle}</p>
        </div>

        ${renderChoiceGroup({
          name: 'hosting-preset',
          mode: 'single',
          variant: 'card',
          options: WIZARD_STRINGS.step2.hostingPresets.map((preset, idx) => ({
            value: preset.value,
            label: preset.title,
            description: `${preset.sentence} (${preset.tradeoff})`,
            checked: idx === 0,
          })),
        })}

        <div class="lp-field">
          <label for="setup-origin-url" class="lp-field-label">${WIZARD_STRINGS.step2.originUrl.label}</label>
          <input type="text" id="setup-origin-url" class="lp-input" placeholder="${WIZARD_STRINGS.step2.originUrl.placeholder}" />
          <div class="lp-help-text">${WIZARD_STRINGS.step2.originUrl.help}</div>
        </div>

        ${renderActionBar({
          pageLevel: true,
          primary: { label: WIZARD_STRINGS.step2.nextButton, variant: 'primary', className: 'btn-nav-step', dataAttrs: { target: '3' } },
        })}
      </div>

      <!-- Step 3: Model Providers & Privacy Boundary -->
      <div id="wizard-step-3" class="wizard-step lp-stack lp-gap-group lp-is-hidden">
        <div class="lp-page-header" data-c="PageHeader">
          ${renderBackLink({ destination: 'Hosting', href: '/admin/setup?step=2', className: 'btn-nav-step', dataAttrs: { target: '2' } })}
          <h1 class="lp-page-title" data-rel="title">${stepTitle(WIZARD_STRINGS.step3.title)}</h1>
          <p id="step3-keys-notice" class="lp-page-description" data-rel="description">Without an external provider, Ask shows direct quotes from your entries. You can add one later in Settings &gt; Providers.</p>
        </div>

        <div id="setup-provider-flow-root">
          ${renderProviderFlow({ step: 1, selectedProvider: 'local', hideStepper: true, hidePrimaryWhenLocal: true }).replaceAll('lp-btn-primary', 'lp-btn-secondary')}
        </div>
        ${renderStatusLine({ id: 'setup-provider-status' })}
        <div class="lp-sr-only" aria-hidden="true">
          ${PROVIDERS_CATALOG.map((p) => `<span id="status-${p.id}">${p.id === 'local' ? 'Configured' : 'Not configured'}</span>`).join('')}
        </div>

        ${renderActionBar({
          pageLevel: true,
          primary: { label: WIZARD_STRINGS.step3.nextButton, variant: 'primary', className: 'btn-nav-step', dataAttrs: { target: '4' } },
        })}
      </div>

      <!-- Step 4: Notifications -->
      <div id="wizard-step-4" class="wizard-step lp-stack lp-gap-group lp-is-hidden">
        <div class="lp-page-header" data-c="PageHeader">
          ${renderBackLink({ destination: 'Model Providers', href: '/admin/setup?step=3', className: 'btn-nav-step', dataAttrs: { target: '3' } })}
          <h1 class="lp-page-title" data-rel="title">${stepTitle(WIZARD_STRINGS.step4.title)}</h1>
          <p class="lp-page-description" data-rel="description">${WIZARD_STRINGS.step4.subtitle}</p>
        </div>

        <div class="lp-stack lp-gap-related">
        ${renderField({
          kind: 'select',
          id: 'setup-notification-channel',
          name: 'notificationChannel',
          label: WIZARD_STRINGS.step4.channel.label,
          options: WIZARD_STRINGS.step4.channel.options.map(opt => ({ value: opt.value, label: opt.label })),
        })}

        <div class="lp-field">
          <label for="setup-notification-target" class="lp-field-label">${WIZARD_STRINGS.step4.target.label}</label>
          <input type="text" id="setup-notification-target" class="lp-input" placeholder="${WIZARD_STRINGS.step4.target.placeholder}" />
          <div class="lp-help-text">${WIZARD_STRINGS.step4.target.help}</div>
        </div>

        <div class="lp-stack-sm">
          ${renderButton({ label: WIZARD_STRINGS.step4.testButton, id: 'btn-setup-test-alert', variant: 'secondary', disabled: true, title: WIZARD_STRINGS.step4.testDisabledReason })}
          <div id="setup-alert-disabled-reason" class="lp-help-text">${WIZARD_STRINGS.step4.testDisabledReason}</div>
          <div id="setup-alert-result" class="lp-is-hidden" role="alert"></div>
        </div>
        </div>

        ${renderActionBar({
          pageLevel: true,
          primary: { label: WIZARD_STRINGS.step4.nextButton, variant: 'primary', className: 'btn-nav-step', dataAttrs: { target: '5' } },
        })}
      </div>

      <!-- Step 5: Backups -->
      <div id="wizard-step-5" class="wizard-step lp-stack lp-gap-group lp-is-hidden">
        <div class="lp-page-header" data-c="PageHeader">
          ${renderBackLink({ destination: 'Notifications', href: '/admin/setup?step=4', className: 'btn-nav-step', dataAttrs: { target: '4' } })}
          <h1 class="lp-page-title" data-rel="title">${stepTitle(WIZARD_STRINGS.step5.title)}</h1>
          <p class="lp-page-description" data-rel="description">${WIZARD_STRINGS.step5.subtitle}</p>
        </div>

        <div class="lp-stack lp-gap-related">
        ${renderField({
          kind: 'select',
          id: 'setup-backup-dest',
          name: 'backupDest',
          label: WIZARD_STRINGS.step5.destination.label,
          options: WIZARD_STRINGS.step5.destination.options.map(opt => ({ value: opt.value, label: opt.label })),
        })}

        <div class="lp-field">
          <label for="setup-backup-dir" class="lp-field-label">${WIZARD_STRINGS.step5.folder.label}</label>
          <input type="text" id="setup-backup-dir" class="lp-input" value="./data/backups" placeholder="${WIZARD_STRINGS.step5.folder.placeholder}" />
          <div class="lp-help-text">${WIZARD_STRINGS.step5.folder.help}</div>
        </div>

        <div class="lp-field">
          <label for="setup-age-key" class="lp-field-label">${WIZARD_STRINGS.step5.ageKey.label}</label>
          <input type="text" id="setup-age-key" class="lp-input lp-input-code" placeholder="${WIZARD_STRINGS.step5.ageKey.placeholder}" />
          <div class="lp-help-text">${WIZARD_STRINGS.step5.ageKey.help}</div>
        </div>

        <div class="lp-stack-sm">
          ${renderButton({ label: WIZARD_STRINGS.step5.drillButton, id: 'btn-setup-test-drill', variant: 'secondary' })}
          <div id="setup-drill-result" class="lp-is-hidden" role="alert"></div>
        </div>
        </div>

        ${renderActionBar({
          pageLevel: true,
          primary: { label: WIZARD_STRINGS.step5.nextButton, variant: 'primary', className: 'btn-nav-step', dataAttrs: { target: '6' } },
        })}
      </div>

      <!-- Step 6: Theme Selection & First-Run Walkthrough -->
      <div id="wizard-step-6" class="wizard-step lp-stack lp-gap-group lp-is-hidden">
        <div class="lp-page-header" data-c="PageHeader">
          ${renderBackLink({ destination: 'Backups', href: '/admin/setup?step=5', className: 'btn-nav-step', dataAttrs: { target: '5' } })}
          <h1 class="lp-page-title" data-rel="title">${stepTitle(WIZARD_STRINGS.step6.title)}</h1>
          <p class="lp-page-description" data-rel="description">${WIZARD_STRINGS.step6.subtitle}</p>
          <p id="step6-theme-notice" class="lp-help-text">${WIZARD_STRINGS.step6.themeAppliedNotice}</p>
        </div>

        ${renderChoiceGroup({
          name: 'theme-preset',
          mode: 'single',
          variant: 'card',
          options: WIZARD_STRINGS.step6.themePresets.map((theme, idx) => ({
            value: theme.value,
            label: theme.title,
            description: theme.description,
            checked: idx === 0,
          })),
        })}

        <div class="lp-stack-sm">
          <h3 class="lp-section-title">${WIZARD_STRINGS.step6.workedExample.title}</h3>
          <p class="lp-page-description">${WIZARD_STRINGS.step6.workedExample.lead}</p>
          <ul class="lp-inline-list lp-page-description">
            ${WIZARD_STRINGS.step6.workedExample.claims.map(c => `<li><strong>${c.label}:</strong> ${c.text}</li>`).join('')}
          </ul>
          <p class="lp-page-description">"${WIZARD_STRINGS.step6.workedExample.closing}"</p>
        </div>

        <p class="lp-help-text">${WIZARD_STRINGS.step6.deployNotice}</p>

        ${renderActionBar({
          level: 'page',
          primary: { id: 'btn-setup-finish-login', href: '/admin', label: WIZARD_STRINGS.step6.finishButton, variant: 'primary' },
          secondary: { id: 'btn-setup-launch-import', href: '/admin/import', label: WIZARD_STRINGS.step6.importButton, variant: 'secondary' },
        })}
      </div>
    </div>
${SETUP_SCRIPT_PART_1}
${SETUP_SCRIPT_PART_2}
  `;
  return renderAdminShell('First-Run Setup', '/admin/setup', content, { authenticated: false, template: 'standard' });
}
