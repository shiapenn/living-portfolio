import { z } from '@living-portfolio/core';
import { renderActionBar, renderField, renderFormSection, renderText } from '../../primitives/index.js';
import { renderEmptyState, renderStatusLine } from '../../components/index.js';
import type { SettingsModuleManifest } from '../registry.js';

export const BackupsConfigSchema = z.object({
  schedule: z.string().default('Daily'),
  destination: z.string().default(''),
  agePublicKey: z.string().default(''),
});

export type BackupsConfig = z.infer<typeof BackupsConfigSchema>;

export const backupsModule: SettingsModuleManifest<BackupsConfig> = {
  id: 'backups',
  title: 'Backups',
  summary: 'Encrypted backups and archive export',
  icon: 'shield',
  order: 5,
  route: '/admin/settings/backups',
  version: 1,
  defaults: {
    schedule: 'Daily',
    destination: '',
    agePublicKey: '',
  },
  schema: BackupsConfigSchema,
  status: (cfg, ctx) => {
    const raw = ctx?.settings || {};
    const backupsObj = (raw.backups && typeof raw.backups === 'object' ? raw.backups : raw) as Record<string, unknown>;
    const dest = String(backupsObj.destination || raw.backupDestination || cfg.destination || '').trim();
    return dest ? 'Configured' : 'Not set up';
  },
  render: (cfg, ctx) => {
    const raw = ctx.settings || {};
    const backupsObj = (raw.backups && typeof raw.backups === 'object' ? raw.backups : raw) as Record<string, unknown>;
    const destination = String(backupsObj.destination || raw.backupDestination || cfg.destination || '').trim();
    const ageKey = String(backupsObj.agePublicKey || raw.backupAgePublicKey || cfg.agePublicKey || '').trim();

    const drillStatusHtml = destination
      ? renderText({ id: 'backup-drill-result', variant: 'caption', text: 'Ready to run a restore drill.' })
      : renderEmptyState({ id: 'backup-drill-result', body: 'Set a backup folder to enable restore drills.' });

    return `
      <form id="settings-module-form" data-settings-module="backups" class="lp-stack lp-gap-section">
        ${renderStatusLine({ id: 'settings-status-banner' })}

        ${renderFormSection({
          title: 'Backup destination',
          fieldsHtml: `
            ${renderField({
              kind: 'input',
              id: 'setting-backup-destination',
              name: 'destination',
              label: 'Backup folder path',
              inputType: 'text',
              value: destination,
              placeholder: './data/backups',
              help: 'Writable server folder for encrypted snapshots.',
            })}
            ${renderField({
              kind: 'input',
              id: 'setting-backup-age-key',
              name: 'agePublicKey',
              label: 'Age public key',
              inputType: 'text',
              value: ageKey,
              placeholder: 'age1...',
              help: 'Optional key used to encrypt snapshots.',
            })}
            ${drillStatusHtml}
          `,
          actionBarHtml: renderActionBar({
            level: 'item',
            secondary: { id: 'btn-run-backup-drill', label: 'Run drill', variant: 'secondary', type: 'button', size: 'sm' },
          }),
        })}

        ${renderFormSection({
          title: 'Archive export',
          description: 'Download all entries and metadata as a portable archive.',
          fieldsHtml: renderText({
            variant: 'caption',
            text: 'Exporting never modifies live entries.',
          }),
          actionBarHtml: renderActionBar({
            level: 'item',
            secondary: {
              id: 'btn-export-archive',
              label: 'Download archive',
              variant: 'secondary',
              size: 'sm',
              href: '/api/settings/export',
            },
          }),
        })}

        ${renderActionBar({
          pageLevel: true,
          primary: { id: 'btn-save-settings-module', label: 'Save', variant: 'primary', type: 'button' },
        })}
      </form>
    `;
  },
};
