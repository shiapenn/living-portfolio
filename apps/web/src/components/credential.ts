import { escapeHtml } from '../lib/html.js';
import { renderIcon } from '../primitives/index.js';

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
  /** Whether to show the warning Notice header (default true; false for TOTP manual key). */
  showNotice?: boolean;
  /** Optional warning notice copy (defaults to "Shown once. Save it now."). */
  warningText?: string;
  /** Optional helper line inside the header when showNotice is false (e.g. TOTP manual key). */
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

function renderGroupedManualKeyHtml(raw: string): string {
  const clean = raw.replace(/\s+/g, '');
  if (!clean) return '';
  const groups = clean.match(/.{1,4}/g) || [];
  return groups.map((g) => `<span class="lp-credential-group">${escapeHtml(g)}</span>`).join('');
}

/**
 * Renders the registered Credential component (C1 / WP-17.12 A1 / WP-17.16 H6):
 * Raised container with header row (warning/helper + trailing 44x44 icon-only Copy button)
 * and borderless sunken inner value panel (radius 8, padding 16). Nesting depth <= 2.
 */
export function renderCredential(props: CredentialProps): string {
  const showNotice = props.showNotice !== false;
  const warning = props.warningText ?? 'Shown once. Save it now.';
  const hiddenClass = props.hidden ? ' lp-is-hidden' : '';
  const classes = ['lp-credential', hiddenClass.trim(), props.className].filter(Boolean).join(' ');
  const copyLabel = props.variant === 'list' ? 'Copy all' : 'Copy';

  const copyPayload = props.variant === 'list'
    ? (props.values ?? []).join('\n')
    : (props.value ?? '');

  const panelInner = props.variant === 'list'
    ? `<div class="lp-credential-list" data-credential-values>${(props.values ?? [])
        .map((code) => `<span class="lp-credential-cell">${escapeHtml(code)}</span>`)
        .join('')}</div>`
    : props.groupBy4
      ? `<div class="lp-credential-single lp-credential-grouped" data-credential-value data-group-by-4="true">${renderGroupedManualKeyHtml(props.value ?? '')}</div>`
      : `<div class="lp-credential-single" data-credential-value>${escapeHtml(props.value ?? '')}</div>`;

  const headerLeadHtml = showNotice
    ? `<span class="lp-credential-header-lead"><span class="lp-credential-header-icon" aria-hidden="true">${renderIcon('alert-triangle', 16)}</span><span data-purpose="helper">${escapeHtml(warning)}</span></span>`
    : `<span class="lp-credential-header-lead"><span data-purpose="helper">${escapeHtml(props.helperText ?? 'Manual setup key')}</span></span>`;

  const copyIconBtn = `<button type="button" id="${escapeHtml(props.id)}-copy-btn" data-c="Button" class="lp-btn lp-btn-secondary lp-btn-icon" aria-label="${escapeHtml(copyLabel)}" title="${escapeHtml(copyLabel)}" data-icon-name="copy" data-credential-copy="${escapeHtml(props.id)}">${renderIcon('copy', 20)}</button>`;

  return `<div id="${escapeHtml(props.id)}" data-c="Credential" data-variant="${props.variant}" class="${escapeHtml(classes)}" data-copy-value="${escapeHtml(copyPayload)}">
  <div class="lp-credential-surface">
    <div class="lp-credential-header">
      ${headerLeadHtml}
      ${copyIconBtn}
      <span id="${escapeHtml(props.id)}-copied" class="lp-sr-only" aria-live="polite"></span>
    </div>
    <div class="lp-credential-panel">
      ${panelInner}
    </div>
    <div id="${escapeHtml(props.id)}-copy-error" class="lp-notice lp-notice-danger lp-is-hidden" aria-live="assertive">Could not copy to clipboard. Select the value and copy manually.</div>
  </div>
</div>`;
}

const COPY_ICON_SVG = renderIcon('copy', 20).replace(/'/g, "\\'");
const CHECK_ICON_SVG = renderIcon('check', 20).replace(/'/g, "\\'");

/**
 * Client helper to wire icon-only Copy / Copy all buttons on Credential components and
 * populate Credential blocks dynamically.
 */
export const CREDENTIAL_CLIENT_SCRIPT = `
var lpCopyIconSvg = '${COPY_ICON_SVG}';
var lpCheckIconSvg = '${CHECK_ICON_SVG}';
var lpGroupBy4Html = function (raw) {
  var clean = String(raw || '').replace(/\\s+/g, '');
  if (!clean) return '';
  var groups = clean.match(/.{1,4}/g) || [];
  return groups.map(function (g) {
    return '<span class="lp-credential-group">' + g.replace(/</g, '&lt;') + '</span>';
  }).join('');
};
var lpSetCredentialSingle = function (id, value, groupBy4) {
  var root = document.getElementById(id);
  if (!root) return;
  root.classList.remove('lp-is-hidden');
  root.setAttribute('data-copy-value', String(value || ''));
  var cell = root.querySelector('[data-credential-value]');
  if (cell) {
    if (groupBy4 || cell.getAttribute('data-group-by-4') === 'true') {
      cell.classList.add('lp-credential-grouped');
      cell.innerHTML = lpGroupBy4Html(value);
    } else {
      cell.textContent = String(value || '');
    }
  }
  var copied = document.getElementById(id + '-copied');
  if (copied) copied.textContent = '';
  var errEl = document.getElementById(id + '-copy-error');
  if (errEl) errEl.classList.add('lp-is-hidden');
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
  var errEl = document.getElementById(id + '-copy-error');
  if (errEl) errEl.classList.add('lp-is-hidden');
};
document.addEventListener('click', async function (e) {
  var btn = e.target && e.target.closest ? e.target.closest('button[data-credential-copy]') : null;
  if (!btn) return;
  var cid = btn.getAttribute('data-credential-copy');
  var root = cid ? document.getElementById(cid) : null;
  if (!root) return;
  var val = root.getAttribute('data-copy-value') || '';
  if (!val) return;
  var errEl = document.getElementById(cid + '-copy-error');
  var ok = false;
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(val);
      ok = true;
    }
  } catch {}
  if (!ok) {
    try {
      var ta = document.createElement('textarea');
      ta.value = val;
      ta.setAttribute('readonly', '');
      ta.className = 'lp-sr-only';
      document.body.appendChild(ta);
      ta.select();
      ok = document.execCommand('copy');
      document.body.removeChild(ta);
    } catch {}
  }
  if (ok) {
    if (errEl) errEl.classList.add('lp-is-hidden');
    btn.setAttribute('data-icon-name', 'check');
    btn.innerHTML = lpCheckIconSvg;
    var copied = document.getElementById(cid + '-copied');
    if (copied) copied.textContent = 'Copied';
    if (btn._lpCopyTimer) clearTimeout(btn._lpCopyTimer);
    btn._lpCopyTimer = setTimeout(function () {
      btn.setAttribute('data-icon-name', 'copy');
      btn.innerHTML = lpCopyIconSvg;
    }, 2000);
  } else if (errEl) {
    errEl.setAttribute('data-c', 'Notice');
    errEl.classList.remove('lp-is-hidden');
  }
});`;
