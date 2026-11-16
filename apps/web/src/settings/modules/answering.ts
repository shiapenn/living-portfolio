import { z } from '@living-portfolio/core';
import { escapeHtml } from '../../lib/html.js';
import { renderButton, renderField } from '../../primitives/index.js';
import { renderStatusLine } from '../../components/index.js';
import type { SettingsModuleManifest } from '../registry.js';

export const AnsweringConfigSchema = z.object({
  answeringEnabled: z.boolean().default(true),
  directConfidenceFloor: z.number().min(0.1).max(1.0).default(0.82),
  synthesisConfidenceFloor: z.number().min(0.1).max(1.0).default(0.65),
  topicMatchThreshold: z.number().min(0.5).max(1.0).default(0.75),
  suggestThresholds: z.boolean().default(false),
  autoCalibrateRouting: z.boolean().default(false),
  auditContradictions: z.boolean().default(true),
  rememberVisitorRules: z.boolean().default(true),
});

export type AnsweringConfig = z.infer<typeof AnsweringConfigSchema>;

export const answeringModule: SettingsModuleManifest<AnsweringConfig> = {
  id: 'answering',
  title: 'Answering',
  summary: 'Automatic visitor replies, confidence thresholds, and self-checks.',
  icon: 'message',
  order: 1,
  route: '/admin/settings/answering',
  version: 1,
  defaults: {
    answeringEnabled: true,
    directConfidenceFloor: 0.82,
    synthesisConfidenceFloor: 0.65,
    topicMatchThreshold: 0.75,
    suggestThresholds: false,
    autoCalibrateRouting: false,
    auditContradictions: true,
    rememberVisitorRules: true,
  },
  schema: AnsweringConfigSchema,
  status: (cfg) => (cfg.answeringEnabled ? 'Active' : 'Paused'),
  render: (cfg, ctx) => {
    const raw = ctx.settings || {};
    const answeringEnabled = typeof raw.answering_enabled === 'boolean' ? raw.answering_enabled : cfg.answeringEnabled;
    const directFloor = typeof raw.tier1_floor === 'number' ? raw.tier1_floor : cfg.directConfidenceFloor;
    const synthFloor = typeof raw.tier2_floor === 'number' ? raw.tier2_floor : cfg.synthesisConfidenceFloor;
    const topicThreshold = typeof raw.facet_known_threshold === 'number' ? raw.facet_known_threshold : cfg.topicMatchThreshold;
    const cal = (raw.calibration && typeof raw.calibration === 'object' ? raw.calibration : {}) as Record<string, unknown>;
    const mechSuggest = typeof cal.suggestion_thresholds === 'boolean' ? cal.suggestion_thresholds : typeof raw.mech_suggestion_thresholds === 'boolean' ? raw.mech_suggestion_thresholds : cfg.suggestThresholds;
    const mechRouting = typeof cal.routing_calibration === 'boolean' ? cal.routing_calibration : typeof raw.mech_routing_calibration === 'boolean' ? raw.mech_routing_calibration : cfg.autoCalibrateRouting;
    const mechTopology = typeof cal.topology_audit === 'boolean' ? cal.topology_audit : typeof raw.mech_topology_audit === 'boolean' ? raw.mech_topology_audit : cfg.auditContradictions;
    const mechScoped = typeof cal.scoped_constraint_mining === 'boolean' ? cal.scoped_constraint_mining : typeof raw.mech_scoped_constraints === 'boolean' ? raw.mech_scoped_constraints : cfg.rememberVisitorRules;

    return `
      <form id="settings-module-form" data-settings-module="answering" class="lp-stack-lg">
        ${renderStatusLine({ id: 'settings-status-banner' })}

        <section class="lp-stack-md">
          <h2 class="lp-section-title">Automatic answering</h2>
          <label class="lp-choice-row">
            <input type="checkbox" id="setting-answering-enabled" class="lp-choice-input" ${answeringEnabled ? 'checked' : ''} />
            <span>Allow automatic visitor answers on the public site</span>
          </label>
          <p class="lp-help-text">When paused, visitor questions wait for your reply in Inbox.</p>
        </section>

        <section class="lp-stack-md">
          <h2 class="lp-section-title">Confidence thresholds</h2>
          ${renderField({
            kind: 'input',
            id: 'setting-tier1-floor',
            name: 'directConfidenceFloor',
            label: 'Direct quote threshold',
            inputType: 'number',
            value: String(directFloor),
            help: 'Minimum match score (0.10 to 1.00, recommended 0.82) before quoting an entry directly.',
            attributes: 'step="0.01" min="0.1" max="1.0"',
          })}
          <div id="tier1-warning" class="lp-notice lp-notice-warn${directFloor < 0.82 ? '' : ' lp-is-hidden'}">
            Lowering this below 0.82 may allow weaker direct quotes.
          </div>
          ${renderField({
            kind: 'input',
            id: 'setting-tier2-floor',
            name: 'synthesisConfidenceFloor',
            label: 'Summary answer threshold',
            inputType: 'number',
            value: String(synthFloor),
            help: 'Minimum match score (0.10 to 1.00, recommended 0.65) before combining multiple entries.',
            attributes: 'step="0.01" min="0.1" max="1.0"',
          })}
          ${renderField({
            kind: 'input',
            id: 'setting-facet-threshold',
            name: 'topicMatchThreshold',
            label: 'Topic recognition threshold',
            inputType: 'number',
            value: String(topicThreshold),
            help: 'Minimum similarity (0.50 to 1.00, recommended 0.75) to match a known topic.',
            attributes: 'step="0.01" min="0.5" max="1.0"',
          })}
        </section>

        <section class="lp-stack-md">
          <h2 class="lp-section-title">Self-checks</h2>
          <label class="lp-choice-row">
            <input type="checkbox" id="setting-mech-suggestion-thresholds" class="lp-choice-input" ${mechSuggest ? 'checked' : ''} />
            <span>Adjust tag suggestion thresholds from your approvals</span>
          </label>
          <label class="lp-choice-row">
            <input type="checkbox" id="setting-mech-routing-calibration" class="lp-choice-input" ${mechRouting ? 'checked' : ''} />
            <span>Calibrate routing thresholds from visitor feedback</span>
          </label>
          <label class="lp-choice-row">
            <input type="checkbox" id="setting-mech-topology-audit" class="lp-choice-input" ${mechTopology ? 'checked' : ''} />
            <span>Flag contradicting claims across entries</span>
          </label>
          <label class="lp-choice-row">
            <input type="checkbox" id="setting-mech-scoped-constraints" class="lp-choice-input" ${mechScoped ? 'checked' : ''} />
            <span>Propose reusable answer rules after you reply</span>
          </label>
        </section>

        <div>
          ${renderButton({ id: 'btn-save-settings-module', label: 'Save', variant: 'primary', type: 'button' })}
        </div>
      </form>
      <div class="lp-is-hidden" data-module-meta="${escapeHtml(answeringModule.id)}"></div>
    `;
  },
};
