import { renderButton, renderIconButton } from './button.js';
import { renderBadge } from './chip.js';
import { renderField } from './field.js';
import { renderPageNotice, renderStatusLine } from '../components/feedback.js';
import { renderDisclosure, renderEmptyState } from '../components/containers.js';

export function renderDetailsFields(prefix: string, visibilityValue: 'draft' | 'unlisted' | 'public' = 'draft'): string {
  return `<div class="lp-details-grid">
    ${renderField({
      kind: 'input',
      id: `${prefix}-slug`,
      name: `${prefix}_slug`,
      label: 'URL slug',
      value: 'deterministic-sqlite-migrations',
    })}
    ${renderField({
      kind: 'select',
      id: `${prefix}-profile`,
      name: `${prefix}_profile`,
      label: 'Role profile',
      value: 'case-study',
      options: [
        { value: 'case-study', label: 'Case Study — Architecture & Trade-offs' },
        { value: 'decision', label: 'Decision Record — Context & Consequences' },
        { value: 'build-note', label: 'Build Note — Implementation & Benchmarks' },
        { value: 'freeform', label: 'Freeform Essay — Longform Reading' },
      ],
    })}
    ${renderField({
      kind: 'select',
      id: `${prefix}-visibility`,
      name: `${prefix}_visibility`,
      label: 'Visibility',
      value: visibilityValue,
      options: [
        { value: 'draft', label: 'Draft — Private to workspace' },
        { value: 'unlisted', label: 'Unlisted — Anyone with the signed link' },
        { value: 'public', label: 'Public — Listed on portfolio & timeline' },
      ],
    })}
    ${renderField({
      kind: 'input',
      inputType: 'date',
      id: `${prefix}-date`,
      name: `${prefix}_date`,
      label: 'Entry date',
      value: '2026-11-14',
    })}
    ${renderField({
      kind: 'select',
      id: `${prefix}-temporal`,
      name: `${prefix}_temporal`,
      label: 'Temporal confidence',
      value: 'exact',
      options: [
        { value: 'exact', label: 'Exact date (day precision)' },
        { value: 'estimated', label: 'Estimated month or quarter' },
        { value: 'range', label: 'Date range (start to end)' },
        { value: 'hindsight', label: 'Retrospective hindsight note' },
      ],
    })}
  </div>`;
}

function renderEntryListRows(
  state: string,
  items: Array<{ title: string; badge: string; tone: 'neutral' | 'warn' | 'ok'; active?: boolean }>
): string {
  if (items.length === 0) return '';
  return `<div class="lp-gallery-stack" data-entry-rows="${state}">
    ${items
      .map(
        (item) => `<div class="lp-entry-row${item.active ? ' lp-entry-row-active' : ''}">
      <span>${item.title}</span>
      ${renderBadge({ label: item.badge, tone: item.tone })}
    </div>`
      )
      .join('')}
  </div>`;
}


export function renderFoundationsPreviewSection(): { layoutPreviewHtml: string; clientScript: string } {
  const renderFullEditorSpecimen = (opts: {
    state: 'draft' | 'error' | 'unlisted' | 'public';
    heading: string;
    badgeLabel: string;
    badgeTone: 'neutral' | 'warn' | 'ok';
    titleId: string;
    titleValue: string;
    titleError?: string;
    bodyValue: string;
    statusTone: 'info' | 'ok' | 'danger';
    statusMsg: string;
    undoLabel?: string;
    undoSeconds?: number;
    primaryLabel: string;
  }) => `<div class="lp-editor-canvas">
    <div class="lp-dialog-header">
      <strong>${opts.heading}</strong>
      ${renderBadge({ label: opts.badgeLabel, tone: opts.badgeTone })}
    </div>
    <div class="lp-editor-action-bar">
      <div class="lp-gallery-row">
        ${renderButton({ label: 'Save', variant: 'secondary', size: 'sm' })}
        ${renderButton({ label: opts.primaryLabel, variant: 'primary', size: 'sm' })}
      </div>
      ${renderIconButton({ ariaLabel: 'More entry actions', icon: 'more-horizontal', iconSize: 16, variant: 'quiet' })}
    </div>
    <div class="lp-status-line-slot">
      ${renderStatusLine({
        id: `preview-${opts.state}-status`,
        tone: opts.statusTone,
        message: opts.statusMsg,
        undoLabel: opts.undoLabel,
        undoSeconds: opts.undoSeconds,
      })}
    </div>
    ${renderField({
      kind: 'input',
      id: opts.titleId,
      name: `${opts.state}_title`,
      label: 'Title',
      value: opts.titleValue,
      required: true,
      error: opts.titleError,
    })}
    ${renderField({
      kind: 'textarea',
      id: `preview-${opts.state}-body`,
      name: `${opts.state}_body`,
      label: 'Body',
      value: opts.bodyValue,
      rows: 6,
      className: 'lp-writing-surface-field',
    })}
    ${renderDisclosure({
      id: `preview-${opts.state}-details`,
      summary: 'Details',
      summaryMeta: '14 Nov 2026 · Exact date · Case Study',
      open: false,
      bodyHtml: renderDetailsFields(`preview-${opts.state}`, opts.state === 'error' ? 'draft' : opts.state),
    })}
  </div>`;

  const states: Array<{
    state: 'empty' | 'first-run' | 'draft' | 'error' | 'unlisted' | 'public';
    count: string;
    listRowsHtml: string;
    mainHtml: string;
  }> = [
    {
      state: 'empty',
      count: '0',
      listRowsHtml: renderEntryListRows('empty', []),
      mainHtml: renderEmptyState({
        id: 'preview-empty-card',
        title: 'No entry selected',
        body: 'Choose an entry from the list or start a new draft.',
        actionHtml: renderButton({ label: 'Start a draft', variant: 'primary' }),
      }),
    },
    {
      state: 'first-run',
      count: '0',
      listRowsHtml: renderEntryListRows('first-run', []),
      mainHtml: renderEmptyState({
        id: 'preview-first-run-card',
        title: 'Write your first entry',
        body: 'Capture engineering decisions, trade-offs, and lessons learned while they are fresh.',
        guideSteps: [
          { title: 'Draft in private', body: 'Every entry starts as a private draft saved to your workspace.' },
          { title: 'Scan before publishing', body: 'Run the built-in privacy check before making an entry public.' },
        ],
        actionHtml: renderButton({ label: 'Start your first draft', variant: 'primary' }),
      }),
    },
    {
      state: 'draft',
      count: '1',
      listRowsHtml: renderEntryListRows('draft', [
        { title: 'Deterministic SQLite migrations', badge: 'Draft', tone: 'neutral', active: true },
      ]),
      mainHtml: renderFullEditorSpecimen({
        state: 'draft',
        heading: 'Draft Entry',
        badgeLabel: 'Draft',
        badgeTone: 'neutral',
        titleId: 'preview-draft-title',
        titleValue: 'Deterministic SQLite migrations',
        bodyValue: 'We replaced ad-hoc schema patches with a linear migration journal verified in CI.',
        statusTone: 'info',
        statusMsg: 'Draft saved just now.',
        primaryLabel: 'Publish…',
      }),
    },
    {
      state: 'error',
      count: '1',
      listRowsHtml: renderEntryListRows('error', [
        { title: 'Untitled entry', badge: 'Draft', tone: 'neutral', active: true },
      ]),
      mainHtml: renderFullEditorSpecimen({
        state: 'error',
        heading: 'Untitled Entry',
        badgeLabel: 'Draft',
        badgeTone: 'neutral',
        titleId: 'preview-error-title',
        titleValue: '',
        titleError: 'Enter a title to save this entry.',
        bodyValue: 'Notes on bounding queue retry backoff under downstream saturation.',
        statusTone: 'danger',
        statusMsg: 'Enter a title to save this entry.',
        primaryLabel: 'Publish…',
      }),
    },
    {
      state: 'unlisted',
      count: '2',
      listRowsHtml: renderEntryListRows('unlisted', [
        { title: 'Zero-downtime queue consumer', badge: 'Unlisted', tone: 'warn', active: true },
        { title: 'Deterministic SQLite migrations', badge: 'Draft', tone: 'neutral' },
      ]),
      mainHtml: renderFullEditorSpecimen({
        state: 'unlisted',
        heading: 'Shared via link',
        badgeLabel: 'Unlisted',
        badgeTone: 'warn',
        titleId: 'preview-unlisted-title',
        titleValue: 'Zero-downtime queue consumer',
        bodyValue: 'Draining in-flight leases cleanly before rotating worker processes.',
        statusTone: 'ok',
        statusMsg: 'Unlisted link active.',
        undoLabel: 'Undo',
        undoSeconds: 8,
        primaryLabel: 'Publish…',
      }),
    },
    {
      state: 'public',
      count: '2',
      listRowsHtml: renderEntryListRows('public', [
        { title: 'Designing resilient webhook retries', badge: 'Public', tone: 'ok', active: true },
        { title: 'Zero-downtime queue consumer', badge: 'Unlisted', tone: 'warn' },
      ]),
      mainHtml: renderFullEditorSpecimen({
        state: 'public',
        heading: 'Published on portfolio',
        badgeLabel: 'Public',
        badgeTone: 'ok',
        titleId: 'preview-public-title',
        titleValue: 'Designing resilient webhook retries',
        bodyValue: 'Idempotency keys and dead-letter replay controls kept delivery above 99.98%.',
        statusTone: 'ok',
        statusMsg: 'Published to public timeline.',
        primaryLabel: 'Update public entry',
      }),
    },
  ];

  const layoutPreviewHtml = `<section id="foundations-layout-preview" class="lp-gallery" aria-label="Workspace state alignment preview">
  <h2>Single Admin Grid — 6-State Column Alignment (D-FOUND-3, D-FOUND-6)</h2>
  ${states
    .map(
      (s) => `<div class="lp-admin-split-preview" data-preview-state="${s.state}">
    <aside class="lp-preview-list-col" data-state-list="${s.state}" aria-label="Entries list (${s.state})">
      <div class="lp-preview-list-header">
        <strong>Entries</strong>
        ${renderBadge({ label: s.count, tone: 'neutral' })}
      </div>
      ${s.listRowsHtml}
    </aside>
    <div class="lp-preview-main-col" data-state-main="${s.state}">
      ${s.mainHtml}
    </div>
  </div>`
    )
    .join('')}
</section>`;

  const clientScript = `<script>
(function () {
  // 1. Auto-grow textareas without clipping text
  function autoGrow(el) {
    el.style.overflowY = 'hidden';
    if (el.scrollHeight > el.clientHeight) {
      el.style.height = (el.scrollHeight + 4) + 'px';
    }
  }
  document.querySelectorAll('textarea[data-lp-autogrow]').forEach(function (ta) {
    autoGrow(ta);
    ta.addEventListener('input', function () { autoGrow(ta); });
  });

  // 2. Dialog focus-trap & Escape close
  var dialog = document.getElementById('gal-dialog-specimen');
  if (dialog) {
    dialog.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        e.preventDefault();
        dialog.setAttribute('hidden', '');
        return;
      }
      if (e.key === 'Tab') {
        var focusable = Array.from(dialog.querySelectorAll('button:not([disabled]), [href], input:not([disabled])'));
        if (focusable.length === 0) return;
        var first = focusable[0];
        var last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    });
    dialog.querySelectorAll('[data-lp-dialog-close], #gal-dialog-cancel').forEach(function (btn) {
      btn.addEventListener('click', function () { dialog.setAttribute('hidden', ''); });
    });
  }

  // 3. Open Menu keyboard navigation (ArrowDown, ArrowUp, Home, End, Escape)
  var menu = document.getElementById('gal-menu-popover');
  var menuTrigger = document.getElementById('gal-menu-trigger');
  if (menu) {
    menu.addEventListener('keydown', function (e) {
      var items = Array.from(menu.querySelectorAll('[role="menuitem"]'));
      var idx = items.indexOf(document.activeElement);
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        items[(idx + 1) % items.length].focus();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        items[(idx - 1 + items.length) % items.length].focus();
      } else if (e.key === 'Home') {
        e.preventDefault();
        items[0].focus();
      } else if (e.key === 'End') {
        e.preventDefault();
        items[items.length - 1].focus();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        menu.setAttribute('hidden', '');
        if (menuTrigger) {
          menuTrigger.setAttribute('aria-expanded', 'false');
          menuTrigger.focus();
        }
      }
    });
  }

  // 4. Live Undo countdown timer
  document.querySelectorAll('[data-lp-status-undo]').forEach(function (btn) {
    var secs = parseInt(btn.getAttribute('data-undo-seconds') || '8', 10);
    var label = btn.getAttribute('data-undo-label') || 'Undo';
    var timer = setInterval(function () {
      if (secs <= 1) {
        clearInterval(timer);
        return;
      }
      secs -= 1;
      btn.setAttribute('data-undo-seconds', String(secs));
      btn.textContent = label + ' (' + secs + 's)';
    }, 1000);
  });
})();
</script>`;

  return { layoutPreviewHtml, clientScript };
}
