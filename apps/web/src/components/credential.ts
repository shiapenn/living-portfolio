import { escapeHtml } from '../lib/html.js';
import { renderButton, renderIcon } from '../primitives/index.js';

export type CredentialVariant = 'single' | 'list';

export interface CredentialProps {
  id: string;
  variant: CredentialVariant;
  /** For 'single': the secret string (e.g. API token or manual TOTP key). */
  value?: string;
  /** For 'list': array of secret items (e.g. 8 recovery codes). */
  values?: string[];
  /** Group a single value into blocks of 4 characters (for TOTP manual keys). */
  groupBy4?: boolean;
  /** Whether to show the warning Notice above the surface (default true; false for TOTP manual key). */
  showNotice?: boolean;
  /** Optional warning notice copy (defaults to "Shown once. Save it now."). */
  warningText?: string;
  /** Optional helper line above the surface when showNotice is false (e.g. TOTP manual key). */
  helperText?: string;
  /** Hide the entire Credential block until revealed client-side. */
  hidden?: boolean;
  className?: string;
}

/**
 * Formats a TOTP manual key into space-separated groups of 4 characters.
 */
export function formatManualKeyGroups(raw: string): string {
  const clean = raw.replace(/\s+/g, '');
  return clean.replace(/(.{4})(?=.)/g, '$1 ');
}

/**
 * Renders the registered Credential component (C1 / WP-17.12 A1):
 * Optional warning Notice ("Shown once. Save it now.") or helper line above a bordered
 * monospace Credential surface, with Copy / Copy all inside the surface footer row.
 */
export function renderCredential(props: CredentialProps): string {
  const showNotice = props.showNotice !== false;
  const warning = props.warningText ?? 'Shown once. Save it now.';
  const hiddenClass = props.hidden ? ' lp-is-hidden' : '';
  const classes = ['lp-credential', hiddenClass.trim(), props.className].filter(Boolean).join(' ');
  const copyLabel = props.variant === 'list' ? 'Copy all' : 'Copy';

  const displaySingle = props.groupBy4 && props.value
    ? formatManualKeyGroups(props.value)
    : (props.value ?? '');
  const copyPayload = props.variant === 'list'
    ? (props.values ?? []).join('\n')
    : (props.value ?? '');

  const surfaceInner = props.variant === 'list'
    ? `<div class="lp-credential-list" data-credential-values>${(props.values ?? [])
        .map((code) => `<span class="lp-credential-cell">${escapeHtml(code)}</span>`)
        .join('')}</div>`
    : `<div class="lp-credential-single" data-credential-value>${escapeHtml(displaySingle)}</div>`;

  const headerHtml = showNotice
    ? `<div class="lp-credential-header"><span class="lp-credential-header-icon" aria-hidden="true">${renderIcon('alert-triangle', 16)}</span><span data-purpose="helper">${escapeHtml(warning)}</span></div>`
    : '';
  const leadHtml = !showNotice && props.helperText
    ? `<p data-c="Text" data-variant="caption" data-purpose="helper" class="lp-field-help">${escapeHtml(props.helperText)}</p>`
    : '';

  return `<div id="${escapeHtml(props.id)}" data-c="Credential" data-variant="${props.variant}" class="${escapeHtml(classes)}" data-copy-value="${escapeHtml(copyPayload)}">
  ${leadHtml}
  <div class="lp-credential-surface">
    ${headerHtml}
    ${surfaceInner}
    <div class="lp-credential-footer">
      ${renderButton({
        id: `${props.id}-copy-btn`,
        label: copyLabel,
        variant: 'secondary',
        size: 'sm',
        type: 'button',
        dataAttrs: { 'credential-copy': props.id },
      })}
      <span id="${escapeHtml(props.id)}-copied" class="lp-credential-copied" aria-live="polite"></span>
    </div>
  </div>
</div>`;
}

/**
 * Client helper to wire Copy / Copy all buttons on Credential components and
 * populate Credential blocks dynamically.
 */
export const CREDENTIAL_CLIENT_SCRIPT = `
var lpGroupBy4 = function (raw) {
  return String(raw || '').replace(/\\s+/g, '').replace(/(.{4})(?=.)/g, '$1 ');
};
var lpSetCredentialSingle = function (id, value, groupBy4) {
  var root = document.getElementById(id);
  if (!root) return;
  root.classList.remove('lp-is-hidden');
  root.setAttribute('data-copy-value', String(value || ''));
  var cell = root.querySelector('[data-credential-value]');
  if (cell) cell.textContent = groupBy4 ? lpGroupBy4(value) : String(value || '');
  var copied = document.getElementById(id + '-copied');
  if (copied) copied.textContent = '';
};
var lpSetCredentialList = function (id, values) {
  var root = document.getElementById(id);
  if (!root) return;
  var arr = Array.isArray(values) ? values : [];
  root.classList.remove('lp-is-hidden');
  root.setAttribute('data-copy-value', arr.join('\\n'));
  var grid = root.querySelector('[data-credential-values]');
  if (grid) {
    grid.innerHTML = arr.map(function (c) {
      return '<span class="lp-credential-cell">' + String(c).replace(/</g, '&lt;') + '</span>';
    }).join('');
  }
  var copied = document.getElementById(id + '-copied');
  if (copied) copied.textContent = '';
};
document.addEventListener('click', async function (e) {
  var btn = e.target && e.target.closest ? e.target.closest('button[data-credential-copy]') : null;
  if (!btn) return;
  var cid = btn.getAttribute('data-credential-copy');
  var root = cid ? document.getElementById(cid) : null;
  if (!root) return;
  var val = root.getAttribute('data-copy-value') || '';
  if (!val) return;
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(val);
    }
  } catch {}
  var copied = document.getElementById(cid + '-copied');
  if (copied) copied.textContent = 'Copied';
});`;
