import { z } from '@living-portfolio/core';
import { renderActionBar, renderField, renderFormSection, renderText } from '../../primitives/index.js';
import { renderStatusLine } from '../../components/index.js';
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
  summary: 'Encrypted backup status, restore drill, and archive export.',
  icon: 'shield',
  order: 5,
  route: '/admin/settings/backups',
  version: 1,
  explain: {
    what: 'Saves encrypted copies of your portfolio and lets you download a portable Markdown and data archive at any time.',
    when: 'Configure before publishing regularly and run a restore drill after changing your backup folder or encryption key.',
    how: 'Set a writable backup folder and optional Age public key, then test recovery or download an archive.',
    impact: 'Exporting or testing recovery never modifies your live entries.',
  },
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
    const explain = backupsModule.explain!;

    return `
      <form id="settings-module-form" data-settings-module="backups" class="lp-stack lp-gap-section">
        ${renderStatusLine({ id: 'settings-status-banner' })}

        ${renderFormSection({
          id: 'backups-explain-section',
          title: 'How backups and export work',
          fieldsHtml: `
            ${renderText({ variant: 'description', text: `What it does: ${explain.what}` })}
            ${renderText({ variant: 'description', text: `When to change: ${explain.when}` })}
          `,
        })}

        ${renderFormSection({
          title: 'Backup destination',
          description: destination
            ? `Current destination: ${destination}. Backups are encrypted before leaving the server.`
            : 'No backup folder is configured yet. Set a writable folder below to enable restore drills.',
          fieldsHtml: `
            ${renderField({
              kind: 'input',
              id: 'setting-backup-destination',
              name: 'destination',
              label: 'Backup folder path',
              inputType: 'text',
              value: destination,
              placeholder: './data/backups',
              help: 'Folder on the server where encrypted backup snapshots are written.',
            })}
            ${renderField({
              kind: 'input',
              id: 'setting-backup-age-key',
              name: 'agePublicKey',
              label: 'Age encryption public key',
              inputType: 'text',
              value: ageKey,
              placeholder: 'age1...',
              help: 'Optional public key used to encrypt backup files so only your private key can decrypt them.',
            })}
            ${renderText({ id: 'backup-drill-result', variant: 'caption', text: destination ? 'Ready to run a restore drill.' : 'Restore drill is unavailable until a backup folder is set.' })}
          `,
          actionBarHtml: renderActionBar({
            level: 'item',
            secondary: { id: 'btn-run-backup-drill', label: 'Run drill', variant: 'secondary', type: 'button', size: 'sm' },
          }),
        })}

        ${renderFormSection({
          title: 'Portable archive export',
          description: 'Download all entries as Markdown with front matter plus structured metadata in a named archive file.',
          fieldsHtml: renderText({
            variant: 'description',
            text: 'Includes public, unlisted, and private entries, ventures, and accepted relations.',
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
