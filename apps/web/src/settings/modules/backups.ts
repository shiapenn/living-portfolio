import { z } from '@living-portfolio/core';
import { escapeHtml } from '../../lib/html.js';
import { renderButton } from '../../primitives/index.js';
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
      <form id="settings-module-form" data-settings-module="backups" class="lp-stack-lg">
        ${renderStatusLine({ id: 'settings-status-banner' })}

        <section class="lp-stack-md">
          <h2 class="lp-section-title">Backup destination</h2>
          <p class="lp-help-text">Current target: ${escapeHtml(backupTarget)}. Backups are encrypted before leaving the server.</p>
          <div class="lp-row lp-gap-sm">
            ${renderButton({ id: 'btn-run-backup-drill', label: 'Run restore drill', variant: 'secondary', type: 'button' })}
          </div>
          <div id="backup-drill-result" class="lp-help-text"></div>
        </section>

        <div>
          ${renderButton({ id: 'btn-save-settings-module', label: 'Save', variant: 'primary', type: 'button' })}
        </div>
      </form>
    `;
  },
};
