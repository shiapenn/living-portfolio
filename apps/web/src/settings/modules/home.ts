import { z } from '@living-portfolio/core';
import { renderActionBar, renderField, renderFormSection, renderText } from '../../primitives/index.js';
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
  summary: 'Home statement, Featured count, Recent count, and featured entries.',
  icon: 'sun',
  order: 8,
  route: '/admin/settings/home',
  version: 1,
  explain: {
    what: 'Configures the one-sentence statement and how many Featured and Recent items appear on your Home page.',
    when: 'Update whenever you want to highlight different entries or adjust how much appears on Home.',
    how: 'Edit the statement, list counts, or comma-separated featured entry slugs, then click Save.',
    impact: 'Updates your Home configuration immediately without modifying entry content.',
  },
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
    const explain = homeModule.explain!;

    return `
      <form id="settings-module-form" data-settings-module="home" class="lp-stack lp-gap-section">
        ${renderStatusLine({ id: 'settings-status-banner' })}

        ${renderFormSection({
          id: 'home-explain-section',
          title: 'How Home curation works',
          fieldsHtml: `
            ${renderText({ variant: 'description', text: `What it does: ${explain.what}` })}
            ${renderText({ variant: 'description', text: `Impact: ${explain.impact}` })}
          `,
        })}

        ${renderFormSection({
          title: 'Home statement and lists',
          fieldsHtml: `
            ${renderField({
              kind: 'textarea',
              id: 'setting-home-statement',
              name: 'statement',
              label: 'One-sentence Home statement',
              value: statement,
              rows: 3,
              help: 'Shown at the top of your public Home page.',
            })}
            ${renderField({
              kind: 'input',
              id: 'setting-home-featured-count',
              name: 'featuredCount',
              label: 'Featured items count',
              inputType: 'number',
              value: String(featuredCount),
              help: 'Maximum featured items shown on Home (default 3).',
              attributes: 'min="0" max="20" step="1"',
            })}
            ${renderField({
              kind: 'input',
              id: 'setting-home-recent-count',
              name: 'recentCount',
              label: 'Recent items count',
              inputType: 'number',
              value: String(recentCount),
              help: 'Maximum recent items shown on Home (default 10).',
              attributes: 'min="1" max="50" step="1"',
            })}
            ${renderField({
              kind: 'input',
              id: 'setting-home-featured-slugs',
              name: 'featuredSlugs',
              label: 'Featured entry slugs (comma-separated)',
              inputType: 'text',
              value: featuredSlugs.join(', '),
              placeholder: 'distributed-cache-migration, telemetry-postmortem',
              help: 'Slugs of published Work, Writing, or Build entries pinned to Featured.',
            })}
          `,
        })}

        ${renderActionBar({
          pageLevel: true,
          primary: { id: 'btn-save-settings-module', label: 'Save', variant: 'primary', type: 'button' },
        })}
      </form>
    `;
  },
};
