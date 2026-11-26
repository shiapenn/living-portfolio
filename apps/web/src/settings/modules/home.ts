import { z } from '@living-portfolio/core';
import { renderActionBar, renderField, renderFormSection } from '../../primitives/index.js';
import { renderStatusLine } from '../../components/index.js';
import type { SettingsModuleManifest } from '../registry.js';

export const HomeConfigSchema = z.object({
  statement: z.string().default('Independent builder documenting real engineering work, decisions, and outcomes.'),
  featuredCount: z.number().int().min(0).max(20).default(3),
  recentCount: z.number().int().min(1).max(50).default(10),
  featuredSlugs: z.custom<string[]>((v) => Array.isArray(v)).default([]),
});

export type HomeConfig = z.infer<typeof HomeConfigSchema>;

export const homeModule: SettingsModuleManifest<HomeConfig> = {
  id: 'home',
  title: 'Home',
  summary: 'Home statement and featured items',
  icon: 'sun',
  order: 8,
  route: '/admin/settings/home',
  version: 1,
  defaults: {
    statement: 'Independent builder documenting real engineering work, decisions, and outcomes.',
    featuredCount: 3,
    recentCount: 10,
    featuredSlugs: [],
  },
  schema: HomeConfigSchema,
  status: (cfg, ctx) => {
    const raw = (ctx?.settings?.home && typeof ctx.settings.home === 'object' ? ctx.settings.home : {}) as Record<string, unknown>;
    const fc = typeof raw.featuredCount === 'number' ? raw.featuredCount : cfg.featuredCount;
    const rc = typeof raw.recentCount === 'number' ? raw.recentCount : cfg.recentCount;
    return `${fc} featured · ${rc} recent`;
  },
  render: (cfg, ctx) => {
    const raw = (ctx.settings?.home && typeof ctx.settings.home === 'object' ? ctx.settings.home : {}) as Record<string, unknown>;
    const statement = typeof raw.statement === 'string' ? raw.statement : cfg.statement;
    const featuredCount = typeof raw.featuredCount === 'number' ? raw.featuredCount : cfg.featuredCount;
    const recentCount = typeof raw.recentCount === 'number' ? raw.recentCount : cfg.recentCount;
    const featuredSlugs = Array.isArray(raw.featuredSlugs) ? (raw.featuredSlugs as string[]) : cfg.featuredSlugs;

    return `
      <form id="settings-module-form" data-settings-module="home" class="lp-stack lp-gap-section">
        ${renderFormSection({
          title: 'Home statement and lists',
          fieldsHtml: `
            ${renderField({
              kind: 'textarea',
              id: 'setting-home-statement',
              name: 'statement',
              label: 'Home statement',
              value: statement,
              rows: 3,
              help: 'One sentence shown at the top of Home.',
            })}
            ${renderField({
              kind: 'input',
              id: 'setting-home-featured-count',
              name: 'featuredCount',
              label: 'Featured items count',
              inputType: 'number',
              value: String(featuredCount),
              help: 'Range 0 to 20.',
              attributes: 'min="0" max="20" step="1"',
            })}
            ${renderField({
              kind: 'input',
              id: 'setting-home-recent-count',
              name: 'recentCount',
              label: 'Recent items count',
              inputType: 'number',
              value: String(recentCount),
              help: 'Range 1 to 50.',
              attributes: 'min="1" max="50" step="1"',
            })}
            ${renderField({
              kind: 'input',
              id: 'setting-home-featured-slugs',
              name: 'featuredSlugs',
              label: 'Pinned entry slugs',
              inputType: 'text',
              value: featuredSlugs.join(', '),
              placeholder: 'distributed-cache-migration, telemetry-postmortem',
              help: 'Comma-separated slugs of published entries.',
            })}
          `,
        })}

        <div class="lp-stack lp-gap-related">
          ${renderActionBar({
            pageLevel: true,
            primary: { id: 'btn-save-settings-module', label: 'Save', variant: 'primary', type: 'button' },
          })}
          <div id="settings-status-banner" class="lp-is-hidden" aria-live="polite" tabindex="-1"></div>
        </div>
      </form>
    `;
  },
};
