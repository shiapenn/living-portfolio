import { escapeHtml } from '../../../lib/html.js';
import {
  renderActionBar,
  renderBadge,
  renderButton,
  renderField,
  renderFormSection,
  renderItem,
  renderTabs,
} from '../../../primitives/index.js';
import {
  renderDialog,
  renderDrawer,
} from '../../../components/index.js';
import { type StructureInspectorData } from '../../../patterns/structure-panel.js';
import { EDITOR_STRINGS } from '../../../strings/admin/editor.js';

export function renderDraftAndOfflineBanners(): string {
  return `<div id="admin-offline-banner" class="lp-notice lp-notice-warn" hidden>
  <div class="lp-notice-main">
    <div class="lp-notice-content">
      <span class="lp-notice-text">${escapeHtml(EDITOR_STRINGS.safety.offlineBanner)}</span>
    </div>
  </div>
</div>
<div id="draft-restore-notice" class="lp-notice lp-notice-info" hidden>
  <div class="lp-notice-main">
    <div class="lp-notice-content">
      <span class="lp-notice-text">${escapeHtml(EDITOR_STRINGS.safety.draftRestored)}</span>
      <button type="button" id="btn-discard-draft-buffer" class="lp-notice-action-link">${escapeHtml(EDITOR_STRINGS.safety.draftDiscard)}</button>
    </div>
  </div>
</div>`;
}

export interface WorkspaceEscalationItem {
  id: string;
  question: string;
  draft?: string;
}

export function renderWorkspaceSafetyControls(options: {
  answeringEnabled: boolean;
  escalations: WorkspaceEscalationItem[];
}): string {
  const enabled = options.answeringEnabled;
  const killLabel = enabled
    ? EDITOR_STRINGS.safety.killSwitchPauseBtn
    : EDITOR_STRINGS.safety.killSwitchResumeBtn;
  const killStateLabel = enabled
    ? EDITOR_STRINGS.safety.killSwitchActive
    : EDITOR_STRINGS.safety.killSwitchPaused;
  const escCount = options.escalations.length;
  const escItemsHtml = options.escalations
    .map(
      (esc) => `<li class="lp-escalation-item" data-escalation-id="${escapeHtml(esc.id)}">
  <p class="lp-escalation-question">${escapeHtml(esc.question)}</p>
  <div class="lp-escalation-actions">
    <button type="button" class="lp-btn lp-btn-primary lp-btn-sm" data-esc-approve="${escapeHtml(esc.id)}">${escapeHtml(EDITOR_STRINGS.safety.approveBtn)}</button>
    <button type="button" class="lp-btn lp-btn-secondary lp-btn-sm" data-esc-reject="${escapeHtml(esc.id)}">${escapeHtml(EDITOR_STRINGS.safety.rejectBtn)}</button>
  </div>
</li>`
    )
    .join('');

  return `<section class="lp-workspace-safety-bar" aria-label="Workspace safety controls">
  <div class="lp-killswitch-row">
    <div class="lp-killswitch-copy">
      <span class="lp-type-body-sm">${escapeHtml(EDITOR_STRINGS.safety.killSwitchTitle)}</span>
      ${renderBadge({
        id: 'ref-killswitch-badge',
        label: killStateLabel,
        tone: enabled ? 'ok' : 'warn',
      })}
    </div>
    <button type="button" id="btn-killswitch" class="lp-btn lp-btn-secondary lp-btn-sm" aria-pressed="${enabled ? 'true' : 'false'}">${escapeHtml(killLabel)}</button>
  </div>
  <div id="ref-escalations-card" class="lp-escalations-card">
    <div class="lp-escalations-header">
      <h2 class="lp-escalations-title">${escapeHtml(EDITOR_STRINGS.safety.escalationsTitle)}</h2>
      ${renderBadge({ id: 'ref-escalations-count', label: String(escCount), tone: escCount > 0 ? 'warn' : 'neutral' })}
    </div>
    <p id="ref-escalations-empty" class="lp-field-help"${escCount > 0 ? ' hidden' : ''}>${escapeHtml(EDITOR_STRINGS.safety.escalationsEmpty)}</p>
    <ul id="ref-escalations-list" class="lp-escalation-list"${escCount === 0 ? ' hidden' : ''}>${escItemsHtml}</ul>
  </div>
</section>`;
}

export function renderEditorDialogsAndDrawers(): string {
  const publishDialogBody = `<div class="lp-publish-steps">
  <section class="lp-publish-step">
    <h3>1. ${escapeHtml(EDITOR_STRINGS.publishDialog.checkTitle)}</h3>
    <p id="ref-publish-dialog-status" role="status" aria-live="polite">${escapeHtml(EDITOR_STRINGS.publishDialog.clean)}</p>
    <ul id="ref-publish-matches" class="lp-publish-matches" hidden></ul>
  </section>
  <section id="ref-publish-nda-step" class="lp-publish-step" hidden>
    <h3>2. ${escapeHtml(EDITOR_STRINGS.publishDialog.ndaTitle)}</h3>
    ${renderField({
      kind: 'checkbox',
      id: 'ref-publish-nda-check',
      name: 'ndaConfirm',
      label: EDITOR_STRINGS.publishDialog.ndaLabel,
    })}
  </section>
  <section class="lp-publish-step">
    <h3 id="ref-publish-next-heading">2. ${escapeHtml(EDITOR_STRINGS.publishDialog.nextTitle)}</h3>
    <p id="ref-publish-section-target" class="lp-field-help"></p>
    <p>${escapeHtml(EDITOR_STRINGS.publishDialog.nextSummary)}</p>
  </section>
</div>`;

  const structureBody = `<p class="lp-field-help">${escapeHtml(EDITOR_STRINGS.structureDrawer.intro)}</p>
${renderTabs({
  id: 'ref-structure-tabs',
  ariaLabel: EDITOR_STRINGS.structureDrawer.title,
  tabs: [
    { id: 'summary', label: EDITOR_STRINGS.structureDrawer.tabs.summary, panelHtml: `<p>${escapeHtml(EDITOR_STRINGS.structureDrawer.summaryText)}</p>`, active: true },
    { id: 'context', label: EDITOR_STRINGS.structureDrawer.tabs.context, panelHtml: `<p>${escapeHtml(EDITOR_STRINGS.structureDrawer.contextText)}</p>` },
    { id: 'evidence', label: EDITOR_STRINGS.structureDrawer.tabs.evidence, panelHtml: `<p>${escapeHtml(EDITOR_STRINGS.structureDrawer.evidenceText)}</p>` },
  ],
})}`;

  return `${renderDialog({
    id: 'ref-publish-dialog',
    title: EDITOR_STRINGS.publishDialog.title,
    bodyHtml: publishDialogBody,
    footerHtml: renderActionBar({
      primary: { id: 'ref-publish-confirm', label: EDITOR_STRINGS.publishDialog.confirm, variant: 'primary' },
      secondary: { id: 'ref-publish-cancel', label: EDITOR_STRINGS.publishDialog.cancel, variant: 'secondary', dataAttrs: { 'lp-dialog-close': 'true' } },
    }),
  })}
  ${renderDialog({
    id: 'ref-delete-dialog',
    title: EDITOR_STRINGS.deleteDialog.title,
    bodyHtml: `<p>${escapeHtml(EDITOR_STRINGS.deleteDialog.body)}</p>`,
    footerHtml: renderActionBar({
      primary: { id: 'ref-delete-confirm', label: EDITOR_STRINGS.deleteDialog.confirm, variant: 'danger', className: 'lp-btn-danger-confirm' },
      secondary: { id: 'ref-delete-cancel', label: EDITOR_STRINGS.deleteDialog.cancel, variant: 'secondary', dataAttrs: { 'lp-dialog-close': 'true' } },
    }),
  })}
  ${renderDrawer({
    id: 'ref-structure-drawer',
    title: EDITOR_STRINGS.structureDrawer.title,
    bodyHtml: structureBody,
    position: 'right',
  })}
  ${renderDrawer({
    id: 'ref-history-drawer',
    title: EDITOR_STRINGS.historyDrawer.title,
    bodyHtml: `<p id="ref-history-empty" class="lp-field-help">${escapeHtml(EDITOR_STRINGS.historyDrawer.empty)}</p><ul id="ref-history-list" class="lp-entry-list"></ul>`,
    position: 'right',
  })}`;
}

export function renderStructureSection(inspector?: StructureInspectorData): string {
  const facets = inspector?.facets ?? [];
  const claims = inspector?.claims ?? [];
  const evidence = inspector?.evidence ?? [];
  const levelNames = ['Captured', 'Tagged', 'Claimed', 'Grounded'] as const;
  const currentIdx = evidence.length > 0 ? 3 : claims.length > 0 ? 2 : facets.length > 0 ? 1 : 0;
  const currentLevel = levelNames[currentIdx];
  const nextStep =
    currentIdx === 0
      ? 'Add a facet tag to reach Tagged.'
      : currentIdx === 1
        ? 'Add a claim to reach Claimed.'
        : currentIdx === 2
          ? 'Attach evidence to reach Grounded.'
          : 'All structure levels complete.';

  const levelHtml = `<div id="ref-structure-level" class="lp-row lp-gap-8 lp-structure-levels" data-current-level="${currentLevel}">
    ${levelNames
      .map(
        (lvl, idx) =>
          `<span class="lp-badge ${idx <= currentIdx ? 'lp-badge-ok' : 'lp-badge-neutral'}" data-level-step="${lvl}">${lvl}</span>`
      )
      .join('')}
  </div>
  <p id="ref-structure-next-step" class="lp-field-help">${escapeHtml(nextStep)}</p>`;

  const facetsHtml = `<div class="lp-stack lp-gap-8">
    <h3 class="lp-form-section-title">Facets</h3>
    <div id="ref-facets-list" class="lp-row lp-gap-8 lp-row-wrap">
      ${facets
        .map(
          (f: any) =>
            `<span class="lp-chip lp-chip-confirmed" data-facet-id="${escapeHtml(String(f.id ?? ''))}">${escapeHtml(String(f.key ?? f.facet_type ?? 'topic'))}: ${escapeHtml(String(f.value ?? f.facet_value ?? ''))}</span>`
        )
        .join('')}
    </div>
    <div class="lp-row lp-gap-8">
      <select id="ref-facet-type" class="lp-select" aria-label="Facet type">
        <option value="topic">Topic</option>
        <option value="role">Role</option>
        <option value="technology">Technology</option>
        <option value="domain">Domain</option>
      </select>
      <input type="text" id="ref-facet-value" class="lp-input" placeholder="Add facet tag…" aria-label="Facet value" />
      ${renderButton({ id: 'ref-btn-add-facet', label: 'Add tag', variant: 'secondary', size: 'sm' })}
    </div>
  </div>`;

  const spansHtml = `<div class="lp-stack lp-gap-8">
    <h3 class="lp-form-section-title">Suggested roles</h3>
    <div id="ref-spans-list" class="lp-stack lp-gap-8"></div>
  </div>`;

  const claimsHtml = `<div class="lp-stack lp-gap-8">
    <h3 class="lp-form-section-title">Claims</h3>
    <div id="ref-claims-list" class="lp-list">
      ${claims
        .map((c: any) =>
          renderItem({
            title: String(c.text ?? c.claim_text ?? ''),
            statusLabel: c.status ? String(c.status) : 'Claim',
            statusTone: 'neutral',
          })
        )
        .join('')}
    </div>
    <div class="lp-row lp-gap-8">
      <input type="text" id="ref-claim-input" class="lp-input" placeholder="Add a claim…" aria-label="Claim text" />
      ${renderButton({ id: 'ref-btn-add-claim', label: 'Add claim', variant: 'secondary', size: 'sm' })}
    </div>
  </div>`;

  const evidenceHtml = `<div class="lp-stack lp-gap-8">
    <h3 class="lp-form-section-title">Evidence</h3>
    <div id="ref-evidence-list" class="lp-list">
      ${evidence
        .map((ev: any) =>
          renderItem({
            title: String(ev.verification?.title ?? ev.title ?? ev.url ?? 'Evidence'),
            subtitle: ev.url ? String(ev.url) : undefined,
            statusLabel: ev.kind ? String(ev.kind) : 'url',
            statusTone: 'ok',
          })
        )
        .join('')}
    </div>
    <div class="lp-row lp-gap-8">
      <input type="text" id="ref-evidence-title" class="lp-input" placeholder="Evidence title" aria-label="Evidence title" />
      <input type="url" id="ref-evidence-url" class="lp-input" placeholder="https://…" aria-label="Evidence URL" />
      ${renderButton({ id: 'ref-btn-add-evidence', label: 'Attach', variant: 'secondary', size: 'sm' })}
    </div>
  </div>`;

  return renderFormSection({
    id: 'ref-structure-section',
    title: 'Structure',
    description: 'Tagging, suggested span roles, claims, and evidence.',
    fieldsHtml: `<div class="lp-stack lp-gap-16">${levelHtml}${facetsHtml}${spansHtml}${claimsHtml}${evidenceHtml}</div>`,
  });
}
