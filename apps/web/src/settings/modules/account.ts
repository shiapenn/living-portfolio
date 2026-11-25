import { z } from '@living-portfolio/core';
import { renderActionBar, renderField, renderFormSection, renderText } from '../../primitives/index.js';
import { renderStatusLine } from '../../components/index.js';
import type { SettingsModuleManifest } from '../registry.js';
import { ACCOUNT_SCRIPT } from './account-script.js';

export const AccountConfigSchema = z.object({});
export type AccountConfig = z.infer<typeof AccountConfigSchema>;

export const accountModule: SettingsModuleManifest<AccountConfig> = {
  id: 'account',
  title: 'Account',
  summary: 'Sign-in credentials, authenticator, recovery codes, API tokens, and sessions.',
  icon: 'user',
  order: 7,
  route: '/admin/settings/account',
  version: 1,
  explain: {
    what: 'Manages your owner username, password, authenticator app, emergency recovery codes, developer API tokens, and active sessions.',
    when: 'Use when rotating your password, replacing your phone, regenerating recovery codes, or issuing automation tokens.',
    how: 'Update credentials, re-enrol your authenticator, or create and revoke tokens below. Each action takes effect immediately.',
    impact: 'Changing your password or revoking tokens/sessions immediately blocks the old credentials.',
  },
  defaults: {},
  schema: AccountConfigSchema,
  status: () => 'Configured',
  render: () => {
    const explain = accountModule.explain!;
    return `
      <form id="settings-module-form" data-settings-module="account" class="lp-stack lp-gap-section">
        ${renderStatusLine({ id: 'settings-status-banner' })}

        ${renderFormSection({
          id: 'account-explain-section',
          title: 'How account security works',
          fieldsHtml: `
            ${renderText({ variant: 'description', text: `What it does: ${explain.what}` })}
            ${renderText({ variant: 'description', text: `Impact: ${explain.impact}` })}
          `,
        })}

        ${renderFormSection({
          id: 'account-credentials-section',
          title: 'Sign-in credentials',
          description: 'Enter your current password to change your username or password.',
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
              label: 'New password (optional, min 12 characters)',
              inputType: 'password',
              value: '',
              attributes: 'autocomplete="new-password"',
            })}
          `,
          actionBarHtml: renderActionBar({
            level: 'item',
            secondary: { id: 'btn-update-credentials', label: 'Save credentials', variant: 'secondary', type: 'button', size: 'sm' },
          }),
        })}

        ${renderFormSection({
          id: 'account-totp-section',
          title: 'Authenticator app',
          description: 'Generate a new secret and confirm a 6-digit code to switch authenticator devices.',
          fieldsHtml: `
            ${renderText({ variant: 'caption', text: 'Your current authenticator remains active until you confirm a new code.' })}
            <div id="account-totp-reenrol-box" class="lp-stack lp-gap-related lp-is-hidden">
              <div id="account-totp-qr"></div>
              ${renderText({ id: 'account-totp-manual', variant: 'caption', text: '' })}
              ${renderField({
                kind: 'input',
                id: 'account-totp-code',
                name: 'totpCode',
                label: '6-digit confirmation code',
                inputType: 'text',
                value: '',
                placeholder: '123456',
              })}
            </div>
          `,
          actionBarHtml: renderActionBar({
            level: 'item',
            secondary: { id: 'btn-reenrol-totp', label: 'Re-enrol app', variant: 'secondary', type: 'button', size: 'sm' },
            textAction: { id: 'btn-confirm-totp', label: 'Confirm app', variant: 'text', type: 'button', size: 'sm' },
          }),
        })}

        ${renderFormSection({
          id: 'account-recovery-section',
          title: 'Recovery codes',
          description: 'Generate 8 fresh single-use recovery codes. Older codes are immediately invalidated.',
          fieldsHtml: renderText({ id: 'account-recovery-output', variant: 'caption', text: 'Recovery codes are shown once when generated.' }),
          actionBarHtml: renderActionBar({
            level: 'item',
            secondary: { id: 'btn-regen-recovery', label: 'Regenerate codes', variant: 'secondary', type: 'button', size: 'sm' },
          }),
        })}

        ${renderFormSection({
          id: 'account-tokens-section',
          title: 'Developer access',
          description: 'Create personal API tokens for scripts or automation.',
          fieldsHtml: `
            ${renderField({
              kind: 'input',
              id: 'account-token-label',
              name: 'tokenLabel',
              label: 'New token label',
              inputType: 'text',
              value: '',
              placeholder: 'ci-deploy',
            })}
            ${renderText({ id: 'account-token-created', variant: 'caption', text: 'Tokens are shown once when created.' })}
          `,
          actionBarHtml: renderActionBar({
            level: 'item',
            secondary: { id: 'btn-create-token', label: 'Create token', variant: 'secondary', type: 'button', size: 'sm' },
          }),
        })}

        ${renderFormSection({
          id: 'account-tokens-list-section',
          title: 'Active tokens',
          fieldsHtml: `<div id="account-tokens-container" data-c="List" data-variant="plain" class="lp-list lp-list-plain"></div>`,
        })}

        ${renderFormSection({
          id: 'account-sessions-section',
          title: 'Other sessions',
          description: 'Sign out all other browsers and devices while keeping this session active.',
          fieldsHtml: renderText({ id: 'account-sessions-result', variant: 'caption', text: 'Only your current browser session will remain signed in.' }),
          actionBarHtml: renderActionBar({
            level: 'item',
            secondary: { id: 'btn-revoke-other-sessions', label: 'End sessions', variant: 'secondary', type: 'button', size: 'sm' },
          }),
        })}
      </form>
      ${ACCOUNT_SCRIPT}
    `;
  },
};
