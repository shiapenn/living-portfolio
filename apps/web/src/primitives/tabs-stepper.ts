import { escapeHtml } from '../lib/html.js';
import { renderField } from './field.js';

export interface TabItem {
  id: string;
  label: string;
  href?: string;
  active?: boolean;
  controls?: string;
  count?: number;
  panelHtml?: string;
}

export interface TabsProps {
  id?: string;
  ariaLabel: string;
  tabs: TabItem[];
  className?: string;
}

/**
 * Unified Tabs primitive (D-COMP #6):
 * - Peer views only, up to 4 tabs with short labels in one equal-width row at 320px, never wrapping
 * - 5 or more tabs automatically becomes a Select
 * - No numerals in tab labels
 */
export function renderTabs(props: TabsProps): string {
  if (props.tabs.length >= 5) {
    const activeTab = props.tabs.find((t) => t.active) ?? props.tabs[0];
    return `<div class="${escapeHtml(['lp-tabs-select-wrap', props.className].filter(Boolean).join(' '))}">
      ${renderField({
        id: props.id ? `${props.id}-select` : 'tabs-select',
        name: props.id ?? 'tabs',
        label: props.ariaLabel,
        kind: 'select',
        value: activeTab?.id ?? '',
        options: props.tabs.map((t) => ({ value: t.id, label: t.label })),
      })}
    </div>`;
  }

  const idAttr = props.id ? ` id="${escapeHtml(props.id)}"` : '';
  const classes = ['lp-tabs', props.className].filter(Boolean).join(' ');
  const idPrefix = props.id ?? 'tabs';
  const hasPanels = props.tabs.some((t) => t.panelHtml !== undefined);
  const items = props.tabs
    .map((t) => {
      const isActive = Boolean(t.active);
      const cls = ['lp-tab', isActive ? 'is-active' : ''].filter(Boolean).join(' ');
      const controlsId = t.controls ?? (hasPanels ? `${idPrefix}-panel-${t.id}` : undefined);
      const controlsAttr = controlsId ? ` aria-controls="${escapeHtml(controlsId)}"` : '';
      const tabIdAttr = hasPanels ? ` id="${escapeHtml(idPrefix)}-tab-${escapeHtml(t.id)}"` : '';
      const countText = typeof t.count === 'number' ? ` (${t.count})` : '';
      const label = `${escapeHtml(t.label)}${escapeHtml(countText)}`;
      if (t.href) {
        return `<a href="${escapeHtml(t.href)}" role="tab"${tabIdAttr} class="${escapeHtml(cls)}" aria-selected="${isActive ? 'true' : 'false'}"${controlsAttr} data-tab-id="${escapeHtml(t.id)}">${label}</a>`;
      }
      return `<button type="button" role="tab"${tabIdAttr} class="${escapeHtml(cls)}" aria-selected="${isActive ? 'true' : 'false'}" tabindex="${isActive ? '0' : '-1'}"${controlsAttr} data-tab-id="${escapeHtml(t.id)}">${label}</button>`;
    })
    .join('');

  const tablistHtml = `<div${idAttr} class="${escapeHtml(classes)}" role="tablist" aria-label="${escapeHtml(props.ariaLabel)}">${items}</div>`;
  if (!hasPanels) return tablistHtml;

  const panelsHtml = props.tabs
    .map((t) => {
      const isActive = Boolean(t.active);
      const panelId = t.controls ?? `${idPrefix}-panel-${t.id}`;
      return `<div id="${escapeHtml(panelId)}" role="tabpanel" aria-labelledby="${escapeHtml(idPrefix)}-tab-${escapeHtml(t.id)}" class="lp-tab-panel"${isActive ? '' : ' hidden'}>${t.panelHtml ?? ''}</div>`;
    })
    .join('');

  return `${tablistHtml}\n${panelsHtml}`;
}

export interface StepperProps {
  currentStep: number;
  totalSteps: number;
  stepTitle: string;
  id?: string;
  className?: string;
}

/**
 * Unified Stepper primitive (D-COMP #6):
 * - Text "Step N of M · <Step title>"
 * - 2px progress line 16px below
 * - No tab-styled steps
 */
export function renderStepper(props: StepperProps): string {
  const idAttr = props.id ? ` id="${escapeHtml(props.id)}"` : '';
  const classes = ['lp-stepper', props.className].filter(Boolean).join(' ');
  const clampedStep = Math.max(1, Math.min(props.currentStep, props.totalSteps));
  const pct = Math.round((clampedStep / Math.max(1, props.totalSteps)) * 100);

  return `<div${idAttr} class="${escapeHtml(classes)}" role="progressbar" aria-valuenow="${clampedStep}" aria-valuemin="1" aria-valuemax="${props.totalSteps}" aria-label="Step ${clampedStep} of ${props.totalSteps} · ${escapeHtml(props.stepTitle)}">
  <div class="lp-stepper-label">Step ${clampedStep} of ${props.totalSteps} · ${escapeHtml(props.stepTitle)}</div>
  <div class="lp-stepper-track"><div class="lp-stepper-fill lp-stepper-pct-${Math.round(pct / 5) * 5}"></div></div>
</div>`;
}
