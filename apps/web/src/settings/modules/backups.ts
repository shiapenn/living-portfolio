import { z } from '@living-portfolio/core';
import { escapeHtml } from '../../lib/html.js';
import { renderActionBar, renderFormSection } from '../../primitives/index.js';
import { renderStatusLine } from '../../components/index.js';
import type { SettingsModuleManifest } from '../registry.js';

export const BackupsConfigSchema = z.object({
  schedule: z.string().default('Daily'),
});

export type BackupsConfig = z.infer<typeof BackupsConfigSchema>;

export const backupsModule: SettingsModuleManifest<BackupsConfig> = {
  id: 'backups',
  title: 'Backups',
  summary: 'Encrypted backup status, restore drill, and archive export.',
  icon: 'shield',
  order: 5,
  route: '/admin/settings/backups',
  version: 1,
  defaults: {
    schedule: 'Daily',
  },
  schema: BackupsConfigSchema,
  status: () => 'Configured',
  render: (_cfg, ctx) => {
    const backupTarget = String(ctx.config?.BACKUP_TARGET || 'Local volume');

    return `
      <form id="settings-module-form" data-settings-module="backups" class="lp-stack lp-gap-section">
        ${renderStatusLine({ id: 'settings-status-banner' })}

        ${renderFormSection({
          title: 'Backup destination',
          description: `Current target: ${backupTarget}. Backups are encrypted before leaving the server.`,
          fieldsHtml: `<div id="backup-drill-result" class="lp-help-text"></div>`,
        })}
        ${renderActionBar({
          pageLevel: true,
          primary: { id: 'btn-save-settings-module', label: 'Save', variant: 'primary', type: 'button' },
          secondary: { id: 'btn-run-backup-drill', label: 'Run restore drill', variant: 'secondary', type: 'button' },
        })}
      </form>
    `;
  },
};
