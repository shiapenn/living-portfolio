import { escapeHtml } from '../lib/html.js';
import {
  renderActionBar,
  renderChip,
  renderStatusDot,
  type StatusTone,
} from '../primitives/index.js';

export interface ProviderRowProps {
  id: string;
  name: string;
  model: string;
  classes: readonly string[];
  status: string;
  tone?: StatusTone;
  statusId?: string;
  isLocal?: boolean;
  mode?: 'table-row' | 'item';
  editable?: boolean;
  hasKey?: boolean;
}

/**
 * Shared ProviderRow component used by both Setup Step 3 and Settings > Providers.
 * In `table-row` mode (Setup Step 3) it renders a read-only table row with
 * provider name, data-class chips, model, and status. In `item` mode (Settings)
 * it renders a stacked Item card with status, write-only API key input (never
 * echoing any stored secret), and a "Test key" button.
 */
export function renderProviderRow(props: ProviderRowProps): string {
  const name = escapeHtml(props.name);
  const model = escapeHtml(props.model);
  const status = escapeHtml(props.status);
  const chips = props.classes.map((c) => renderChip({ label: c })).join(' ');
  const tone: StatusTone = props.tone ?? (props.isLocal ? 'ok' : 'neutral');

  if (props.mode === 'table-row') {
    const statusClass = props.isLocal ? 'lp-status-line-ok' : 'lp-help-text';
    const statusAttr = props.statusId ? ` id="${escapeHtml(props.statusId)}"` : '';
    return `
      <tr>
        <td><strong>${name}</strong></td>
        <td>${chips}</td>
        <td><code>${model}</code></td>
        <td class="${statusClass}"${statusAttr}>${status}</td>
      </tr>
    `;
  }

  const safeId = escapeHtml(props.id);
  const keyPlaceholder = props.hasKey
    ? 'Key configured (enter new key to replace)'
    : 'Enter API key (write-only)';

  const controls =
    props.editable && !props.isLocal
      ? `
      <div class="lp-provider-key-row lp-stack-sm">
        <div class="lp-field">
          <label class="lp-field-label" for="provider-key-${safeId}">API key</label>
          <input
            type="password"
            id="provider-key-${safeId}"
            class="lp-input lp-provider-key-input"
            data-provider-id="${safeId}"
            value=""
            autocomplete="new-password"
            placeholder="${escapeHtml(keyPlaceholder)}"
          />
        </div>
        ${renderActionBar({
          secondary: {
            label: 'Test key',
            variant: 'secondary',
            type: 'button',
            className: 'btn-test-provider-key',
            dataAttrs: {
              'provider-id': props.id,
              'provider-name': props.name,
            },
          },
        })}
        <p id="provider-test-result-${safeId}" class="lp-help-text" aria-live="polite"></p>
      </div>
    `
      : '';

  return `
    <div class="lp-item lp-provider-row" data-provider-id="${safeId}">
      <div class="lp-item-main">
        <div class="lp-item-title-row">
          <span class="lp-item-title">${name}</span>
          <span class="lp-item-status">
            ${renderStatusDot({ label: status, tone })}
          </span>
        </div>
        <div class="lp-item-subtitle"><code>${model}</code> · ${chips}</div>
        ${controls ? `<div class="lp-item-body">${controls}</div>` : ''}
      </div>
    </div>
  `;
}
