import { z } from '@living-portfolio/core';
import { renderActionBar, renderField, renderFormSection } from '../../primitives/index.js';
import { renderStatusLine } from '../../components/index.js';
import type { SettingsModuleManifest } from '../registry.js';

export const NotificationsConfigSchema = z.object({
  topicUrl: z.string().default(''),
});

export type NotificationsConfig = z.infer<typeof NotificationsConfigSchema>;

export const notificationsModule: SettingsModuleManifest<NotificationsConfig> = {
  id: 'notifications',
  title: 'Notifications',
  summary: 'Delivery topic for Inbox escalations and health alerts.',
  icon: 'bell',
  order: 4,
  route: '/admin/settings/notifications',
  version: 1,
  defaults: {
    topicUrl: '',
  },
  schema: NotificationsConfigSchema,
  status: (cfg, ctx) => {
    const url = (ctx?.settings?.notify_topic as string) || cfg.topicUrl;
    return url ? 'Configured' : 'Not set up';
  },
  render: (cfg, ctx) => {
    const topicUrl = (ctx.settings?.notify_topic as string) || cfg.topicUrl;

    return `
      <form id="settings-module-form" data-settings-module="notifications" class="lp-stack-lg">
        ${renderStatusLine({ id: 'settings-status-banner' })}

        ${renderFormSection({
          title: 'Alert destination',
          fieldsHtml: `
            ${renderField({
              kind: 'input',
              id: 'setting-notify-topic',
              name: 'topicUrl',
              label: 'Notification topic URL',
              inputType: 'text',
              value: topicUrl,
              placeholder: 'https://ntfy.sh/owner-alerts',
              help: 'Endpoint notified when a visitor question needs your attention.',
            })}
            <div id="notify-test-result" class="lp-help-text"></div>
          `,
          actionBarHtml: renderActionBar({
            primary: { id: 'btn-save-settings-module', label: 'Save', variant: 'primary', type: 'button' },
            secondary: { id: 'btn-test-notification', label: 'Send test alert', variant: 'secondary', type: 'button' },
          }),
        })}
      </form>
    `;
  },
};
