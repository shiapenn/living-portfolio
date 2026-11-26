import { z } from '@living-portfolio/core';
import { escapeHtml } from '../../lib/html.js';
import { renderActionBar, renderChoiceGroup, renderField, renderFormSection, renderText } from '../../primitives/index.js';
import { renderDialog, renderStatusLine } from '../../components/index.js';
import type { SettingsModuleManifest } from '../registry.js';

export const RECOMMENDED_THRESHOLDS = {
  directConfidenceFloor: 0.82,
  synthesisConfidenceFloor: 0.55,
  topicMatchThreshold: 0.9,
} as const;

export const AnsweringConfigSchema = z.object({
  answeringEnabled: z.boolean().default(true),
  directConfidenceFloor: z.number().min(0.1).max(1.0).default(0.82),
  synthesisConfidenceFloor: z.number().min(0.1).max(1.0).default(0.55),
  topicMatchThreshold: z.number().min(0.5).max(1.0).default(0.9),
  replyTimeEstimate: z.string().default('Within 24 hours'),
  publicConfidenceDisclosure: z.boolean().default(true),
  suggestThresholds: z.boolean().default(false),
  autoCalibrateRouting: z.boolean().default(false),
  auditContradictions: z.boolean().default(true),
  rememberVisitorRules: z.boolean().default(true),
});

export type AnsweringConfig = z.infer<typeof AnsweringConfigSchema>;

export const answeringModule: SettingsModuleManifest<AnsweringConfig> = {
  id: 'answering',
  title: 'Answering',
  summary: 'Automatic replies and thresholds',
  icon: 'sliders',
  order: 1,
  route: '/admin/settings/answering',
  version: 1,
  defaults: {
    answeringEnabled: true,
    directConfidenceFloor: RECOMMENDED_THRESHOLDS.directConfidenceFloor,
    synthesisConfidenceFloor: RECOMMENDED_THRESHOLDS.synthesisConfidenceFloor,
    topicMatchThreshold: RECOMMENDED_THRESHOLDS.topicMatchThreshold,
    replyTimeEstimate: 'Within 24 hours',
    publicConfidenceDisclosure: true,
    suggestThresholds: false,
    autoCalibrateRouting: false,
    auditContradictions: true,
    rememberVisitorRules: true,
  },
  schema: AnsweringConfigSchema,
  status: (cfg, ctx) => {
    const raw = ctx?.settings || {};
    const runtime = (raw.runtime && typeof raw.runtime === 'object' ? raw.runtime : raw) as Record<string, unknown>;
    const enabled =
      typeof runtime.automatedAnsweringEnabled === 'boolean'
        ? runtime.automatedAnsweringEnabled
        : typeof raw.answering_enabled === 'boolean'
          ? raw.answering_enabled
          : cfg.answeringEnabled;
    return enabled ? 'Active' : 'Paused';
  },
  render: (cfg, ctx) => {
    const raw = ctx.settings || {};
    const runtime = (raw.runtime && typeof raw.runtime === 'object' ? raw.runtime : raw) as Record<string, unknown>;
    const routing = (raw.routing && typeof raw.routing === 'object' ? raw.routing : raw) as Record<string, unknown>;
    const answeringEnabled =
      typeof runtime.automatedAnsweringEnabled === 'boolean'
        ? runtime.automatedAnsweringEnabled
        : typeof raw.answering_enabled === 'boolean'
          ? raw.answering_enabled
          : cfg.answeringEnabled;
    const directFloor = typeof routing.tier1_floor === 'number' ? routing.tier1_floor : cfg.directConfidenceFloor;
    const synthFloor = typeof routing.tier2_floor === 'number' ? routing.tier2_floor : cfg.synthesisConfidenceFloor;
    const topicThreshold = typeof routing.facet_known_threshold === 'number' ? routing.facet_known_threshold : cfg.topicMatchThreshold;
    const replyTime = typeof routing.replyTimeEstimate === 'string' ? routing.replyTimeEstimate : cfg.replyTimeEstimate;
    const publicDisclosure =
      typeof routing.publicConfidenceDisclosure === 'boolean'
        ? routing.publicConfidenceDisclosure
        : cfg.publicConfidenceDisclosure;
    const cal = (raw.calibration && typeof raw.calibration === 'object' ? raw.calibration : {}) as Record<string, unknown>;
    const mechSuggest = typeof cal.suggestion_thresholds === 'boolean' ? cal.suggestion_thresholds : cfg.suggestThresholds;
    const mechRouting = typeof cal.routing_calibration === 'boolean' ? cal.routing_calibration : cfg.autoCalibrateRouting;
    const mechTopology = typeof cal.topology_audit === 'boolean' ? cal.topology_audit : cfg.auditContradictions;
    const mechScoped = typeof cal.scoped_constraint_mining === 'boolean' ? cal.scoped_constraint_mining : cfg.rememberVisitorRules;

    const driftedFromRecommended =
      Math.abs(directFloor - RECOMMENDED_THRESHOLDS.directConfidenceFloor) > 0.001 ||
      Math.abs(synthFloor - RECOMMENDED_THRESHOLDS.synthesisConfidenceFloor) > 0.001 ||
      Math.abs(topicThreshold - RECOMMENDED_THRESHOLDS.topicMatchThreshold) > 0.001;

    const pauseDialogHtml = renderDialog({
      id: 'answering-pause-dialog',
      title: 'Pause automatic answering?',
      bodyHtml: renderText({
        variant: 'body',
        text: 'Visitors see a paused notice and new questions wait in Inbox.',
      }),
      footerHtml: renderActionBar({
        level: 'dialog',
        primary: { id: 'btn-confirm-pause-answering', label: 'Pause answering', variant: 'primary', type: 'button' },
        secondary: { id: 'btn-cancel-pause-answering', label: 'Cancel', variant: 'secondary', type: 'button' },
      }),
    });

    return `
      <form id="settings-module-form" data-settings-module="answering" class="lp-stack lp-gap-section">
        ${renderFormSection({
          title: 'Automatic answering',
          fieldsHtml: renderChoiceGroup({
            name: 'answering-enabled-group',
            mode: 'multiple',
            variant: 'card',
            options: [
              {
                id: 'setting-answering-enabled',
                value: 'enabled',
                label: 'Allow automatic visitor answers',
                description: 'When paused, new visitor questions wait in Inbox.',
                checked: answeringEnabled,
              },
            ],
          }),
        })}

        ${renderFormSection({
          title: 'Confidence thresholds',
          fieldsHtml: `
            ${renderField({
              kind: 'input',
              id: 'setting-tier1-floor',
              name: 'directConfidenceFloor',
              label: 'Direct quote threshold',
              inputType: 'number',
              value: String(directFloor),
              help: 'Recommended 0.82. Higher sends more questions to Inbox.',
              attributes: 'step="0.01" min="0.1" max="1.0"',
            })}
            ${renderField({
              kind: 'input',
              id: 'setting-tier2-floor',
              name: 'synthesisConfidenceFloor',
              label: 'Summary answer threshold',
              inputType: 'number',
              value: String(synthFloor),
              help: 'Recommended 0.55. Higher requires stronger multi-entry matches.',
              attributes: 'step="0.01" min="0.1" max="1.0"',
            })}
            ${renderField({
              kind: 'input',
              id: 'setting-facet-threshold',
              name: 'topicMatchThreshold',
              label: 'Topic match threshold',
              inputType: 'number',
              value: String(topicThreshold),
              help: 'Recommended 0.90. Higher narrows topic matching.',
              attributes: 'step="0.01" min="0.5" max="1.0"',
            })}
            <div id="tier1-warning" data-c="Notice" class="lp-notice lp-notice-warn${driftedFromRecommended ? '' : ' lp-is-hidden'}">
              Custom thresholds differ from recommended values and change how questions route.
            </div>
          `,
          actionBarHtml: renderActionBar({
            level: 'item',
            secondary: { id: 'btn-restore-thresholds', label: 'Restore recommended', variant: 'secondary', type: 'button', size: 'sm' },
          }),
          feedbackHtml: `<div id="answering-thresholds-feedback" class="lp-is-hidden" aria-live="polite" tabindex="-1"></div>`,
        })}

        ${renderFormSection({
          title: 'Visitor disclosure',
          fieldsHtml: `
            ${renderChoiceGroup({
              name: 'public-disclosure-group',
              mode: 'multiple',
              variant: 'card',
              options: [
                {
                  id: 'setting-public-disclosure',
                  value: 'enabled',
                  label: 'Show answer source and confidence note',
                  checked: publicDisclosure,
                },
              ],
            })}
            ${renderField({
              kind: 'select',
              id: 'setting-reply-time',
              name: 'replyTimeEstimate',
              label: 'Expected reply time',
              value: replyTime,
              options: [
                { value: 'Within 24 hours', label: 'Within 24 hours' },
                { value: 'Within 48 hours', label: 'Within 48 hours' },
                { value: 'Within 3 business days', label: 'Within 3 business days' },
                { value: 'Within a week', label: 'Within a week' },
              ],
            })}
          `,
        })}

        ${renderFormSection({
          title: 'Self-checks',
          fieldsHtml: renderChoiceGroup({
            name: 'answering-mechanisms',
            mode: 'multiple',
            variant: 'card',
            options: [
              {
                id: 'setting-mech-suggestion-thresholds',
                value: 'suggest',
                label: 'Adjust tag suggestion thresholds from your approvals',
                checked: mechSuggest,
              },
              {
                id: 'setting-mech-routing-calibration',
                value: 'routing',
                label: 'Calibrate routing thresholds from visitor feedback',
                checked: mechRouting,
              },
              {
                id: 'setting-mech-topology-audit',
                value: 'topology',
                label: 'Flag contradicting claims across entries',
                checked: mechTopology,
              },
              {
                id: 'setting-mech-scoped-constraints',
                value: 'scoped',
                label: 'Propose reusable answer rules after you reply',
                checked: mechScoped,
              },
            ],
          }),
        })}
        <div class="lp-stack lp-gap-related">
          ${renderActionBar({
            pageLevel: true,
            primary: { id: 'btn-save-settings-module', label: 'Save', variant: 'primary', type: 'button' },
          })}
          <div id="settings-status-banner" class="lp-is-hidden" aria-live="polite" tabindex="-1"></div>
        </div>
      </form>
      ${pauseDialogHtml}
      <div class="lp-is-hidden" data-module-meta="${escapeHtml(answeringModule.id)}"></div>
    `;
  },
};
