import { z } from '@living-portfolio/core';
import { renderActionBar, renderField, renderFormSection, renderSubsection } from '../../primitives/index.js';
import { renderCredential } from '../../components/index.js';
import type { SettingsModuleManifest } from '../registry.js';
import { ACCOUNT_SCRIPT } from './account-script.js';

export const AccountConfigSchema = z.object({});
export type AccountConfig = z.infer<typeof AccountConfigSchema>;

export const accountModule: SettingsModuleManifest<AccountConfig> = {
  id: 'account',
  title: 'Account',
  summary: 'Password, authenticator, tokens, and sessions',
  icon: 'user',
  order: 7,
  route: '/admin/settings/account',
  version: 1,
  defaults: {},
  schema: AccountConfigSchema,
  status: () => 'Configured',
  render: () => `
    <form id="settings-module-form" data-settings-module="account" class="lp-stack lp-gap-section">
      ${renderFormSection({
        id: 'account-credentials-section',
        title: 'Sign-in credentials',
        fieldsHtml: `
          ${renderField({
            kind: 'input',
            id: 'account-current-password',
            name: 'currentPassword',
            label: 'Current password',
            inputType: 'password',
            value: '',
            attributes: 'autocomplete="current-password"',
          })}
          ${renderField({
            kind: 'input',
            id: 'account-new-username',
            name: 'newUsername',
            label: 'New username (optional)',
            inputType: 'text',
            value: '',
            attributes: 'autocomplete="username"',
          })}
          ${renderField({
            kind: 'input',
            id: 'account-new-password',
            name: 'newPassword',
            label: 'New password (optional)',
            inputType: 'password',
            value: '',
            help: 'Minimum 12 characters.',
            attributes: 'autocomplete="new-password"',
          })}
        `,
        actionBarHtml: renderActionBar({
          level: 'item',
          secondary: { id: 'btn-update-credentials', label: 'Save credentials', variant: 'secondary', type: 'button', size: 'sm' },
        }),
        feedbackHtml: `<div id="account-creds-notice" class="lp-is-hidden" aria-live="assertive" tabindex="-1"></div>`,
      })}

      ${renderFormSection({
        id: 'account-security-section',
        title: 'Security',
        fieldsHtml: `<div class="lp-stack lp-gap-group">
          ${renderSubsection({
            id: 'account-totp-section',
            title: 'Authenticator app',
            consequence: 'Current authenticator stays active until you confirm a new code.',
            bodyHtml: '',
            actionBarHtml: `<div class="lp-stack lp-gap-related">
              <div id="account-totp-start-actions">${renderActionBar({
                level: 'item',
                secondary: { id: 'btn-reenrol-totp', label: 'Re-enrol app', variant: 'secondary', type: 'button', size: 'sm' },
              })}</div>
              <div id="account-totp-reenrol-box" class="lp-stack lp-gap-group lp-is-hidden">
                <div class="lp-stack lp-gap-related">
                  <div id="account-totp-qr"></div>
                  ${renderCredential({
                    id: 'account-totp-manual-cred',
                    variant: 'single',
                    value: '',
                    groupBy4: true,
                    showNotice: false,
                    helperText: "Enter this key if you can't scan the code.",
                    hidden: true,
                  })}
                </div>
                ${renderField({
                  kind: 'input',
                  id: 'account-totp-code',
                  name: 'totpCode',
                  label: '6-digit code',
                  inputType: 'text',
                  value: '',
                  placeholder: '123456',
                })}
                <div id="account-totp-confirm-actions">
                  ${renderActionBar({
                    level: 'item',
                    secondary: { id: 'btn-confirm-totp', label: 'Confirm app', variant: 'secondary', type: 'button', size: 'sm' },
                    textAction: { id: 'btn-cancel-totp', label: 'Cancel', variant: 'text', type: 'button', size: 'sm' },
                  })}
                </div>
              </div>
              <div id="account-totp-notice" class="lp-is-hidden" aria-live="assertive" tabindex="-1"></div>
            </div>`,
          })}

          ${renderSubsection({
            id: 'account-recovery-section',
            title: 'Recovery codes',
            consequence: 'Regenerating invalidates all older recovery codes immediately.',
            bodyHtml: '',
            actionBarHtml: `<div class="lp-stack lp-gap-related">
              ${renderActionBar({
                level: 'item',
                secondary: { id: 'btn-regen-recovery', label: 'Regenerate codes', variant: 'secondary', type: 'button', size: 'sm' },
              })}
              ${renderCredential({
                id: 'account-recovery-output',
                variant: 'list',
                values: [],
                hidden: true,
              })}
              <div id="account-recovery-notice" class="lp-is-hidden" aria-live="assertive" tabindex="-1"></div>
            </div>`,
          })}

          ${renderSubsection({
            id: 'account-sessions-section',
            title: 'Other sessions',
            consequence: 'Signs out all other browsers and devices immediately.',
            bodyHtml: '',
            actionBarHtml: `<div class="lp-stack lp-gap-related">
              ${renderActionBar({
                level: 'item',
                secondary: { id: 'btn-revoke-other-sessions', label: 'End sessions', variant: 'secondary', type: 'button', size: 'sm' },
              })}
              <div id="account-sessions-notice" class="lp-is-hidden" aria-live="polite" tabindex="-1"></div>
            </div>`,
          })}
        </div>`,
      })}

      ${renderFormSection({
        id: 'account-tokens-section',
        title: 'API tokens',
        fieldsHtml: `
          ${renderField({
            kind: 'input',
            id: 'account-token-label',
            name: 'tokenLabel',
            label: 'Token label',
            inputType: 'text',
            value: '',
            placeholder: 'ci-deploy',
          })}
        `,
        actionBarHtml: renderActionBar({
          level: 'item',
          secondary: { id: 'btn-create-token', label: 'Create token', variant: 'secondary', type: 'button', size: 'sm' },
        }),
        feedbackHtml: `
          ${renderCredential({
            id: 'account-token-created',
            variant: 'single',
            value: '',
            hidden: true,
          })}
          <div id="account-tokens-notice" class="lp-is-hidden" aria-live="assertive" tabindex="-1"></div>
        `,
      })}

      ${renderFormSection({
        id: 'account-tokens-list-section',
        title: 'Active tokens',
        fieldsHtml: `<div id="account-tokens-container" data-c="List" data-variant="plain" class="lp-list lp-list-plain"></div>`,
        feedbackHtml: `<div id="account-tokens-list-notice" class="lp-is-hidden" aria-live="polite" tabindex="-1"></div>`,
      })}
    </form>
    ${ACCOUNT_SCRIPT}
  `,
};
