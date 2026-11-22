import { escapeHtml } from '../../../lib/html.js';
import {
  renderActionBar,
  renderBadge,
  renderButton,
  renderField,
  renderFormSection,
  renderIcon,
  renderItem,
  renderLevel,
  renderSubsection,
  renderTabs,
  renderTag,
  type StructureStage,
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
  const levelNames: StructureStage[] = ['Captured', 'Tagged', 'Claimed', 'Grounded'];
  const currentIdx = evidence.length > 0 ? 3 : claims.length > 0 ? 2 : facets.length > 0 ? 1 : 0;
  const currentLevel = levelNames[currentIdx];
  const nextStep =
    currentIdx === 0
      ? 'Add a tag to reach Tagged.'
      : currentIdx === 1
        ? 'Add a claim to reach Claimed.'
        : currentIdx === 2
          ? 'Attach evidence to reach Grounded.'
          : 'All structure levels complete.';

  const nextTargetId =
    currentIdx === 0
      ? 'ref-facet-value'
      : currentIdx === 1
        ? 'ref-btn-open-claim'
        : currentIdx === 2
          ? 'ref-btn-open-evidence'
          : '';
  const levelHtml = renderLevel({
    id: 'ref-structure-level',
    current: currentLevel,
    nextStep,
  }).replace(
    /<p class="lp-level-next[^"]*">[\s\S]*?<\/p>/,
    currentIdx < 3
      ? `<button type="button" id="ref-structure-next-step" class="lp-btn lp-btn-text lp-level-next" data-next-target="${nextTargetId}"><span>${escapeHtml(nextStep)}</span>${renderIcon('chevron-down', 16)}</button>`
      : `<p id="ref-structure-next-step" class="lp-level-next">${escapeHtml(nextStep)}</p>`
  );

  const tagsHtml = renderSubsection({
    title: 'Tags',
    bodyHtml: `<div id="ref-facets-list" class="lp-row lp-gap-8 lp-row-wrap">
      ${facets
        .filter((f: any) => f?.status !== 'rejected')
        .map((f: any) =>
          renderTag({
            label: String(f.value ?? f.facet_value ?? ''),
            category: String(f.key ?? f.facet_type ?? 'topic'),
            removeAction: 'facet',
            removeValue: String(f.id ?? ''),
          })
        )
        .join('')}
    </div>
    <div id="ref-tag-feedback" class="lp-field-error"></div>
    <div class="lp-stack lp-gap-related">
      ${renderField({
        kind: 'select',
        id: 'ref-facet-type',
        name: 'facetType',
        label: 'Category',
        value: 'topic',
        options: [
          { value: 'topic', label: 'Topic' },
          { value: 'role', label: 'Role' },
          { value: 'technology', label: 'Technology' },
          { value: 'domain', label: 'Domain' },
        ],
      })}
      ${renderField({
        kind: 'input',
        id: 'ref-facet-value',
        name: 'facetValue',
        label: 'Tag',
        placeholder: 'Add a tag',
      })}
    </div>`,
    actionBarHtml: renderActionBar({
      secondary: { id: 'ref-btn-add-facet', label: 'Add tag', variant: 'secondary', type: 'button' },
    }),
  });

  const spansHtml = renderSubsection({
    title: 'Suggested roles',
    intro: 'Passages that may play a role in your story. Accept to label one, or ignore it.',
    bodyHtml: `<div id="ref-spans-list" class="lp-list"></div>
    <div id="ref-spans-feedback" class="lp-sr-only" aria-live="polite"></div>`,
  });

  const claimsHtml = renderSubsection({
    title: 'Claims',
    bodyHtml: `<div id="ref-claims-list" class="lp-list${claims.length ? '' : ' lp-is-empty'}">${claims.length
        ? claims
            .map((c: any) =>
              renderItem({
                title: String(c.text ?? c.claim_text ?? ''),
                statusLabel: c.status ? String(c.status) : 'Claim',
                statusTone: c.status === 'accepted' ? 'ok' : 'neutral',
              })
            )
            .join('')
        : ''}</div>
    <div id="ref-claim-form-wrap" class="lp-stack lp-gap-related lp-is-hidden">
      ${renderField({ kind: 'input', id: 'ref-claim-input', name: 'claimText', label: 'Claim', placeholder: 'Add a claim' })}
      ${renderActionBar({
        primary: { id: 'ref-btn-add-claim', label: 'Add', variant: 'primary', type: 'button' },
        secondary: { id: 'ref-btn-cancel-claim', label: 'Cancel', variant: 'secondary', type: 'button' },
      })}
    </div>`,
    actionBarHtml: renderActionBar({
      secondary: { id: 'ref-btn-open-claim', label: 'Add claim', variant: 'secondary', type: 'button' },
    }),
  });

  const evidenceHtml = renderSubsection({
    title: 'Evidence',
    className: evidence.length ? undefined : 'lp-gap-related',
    bodyHtml: `<div id="ref-evidence-list" class="lp-list${evidence.length ? '' : ' lp-is-empty'}">${evidence.length
        ? evidence
            .map((ev: any) =>
              renderItem({
                title: String(ev.verification?.title ?? ev.title ?? ev.url ?? 'Evidence'),
                subtitle: ev.url ? String(ev.url) : undefined,
                statusLabel: ev.kind ? String(ev.kind) : 'url',
                statusTone: 'ok',
              })
            )
            .join('')
        : ''}</div>
    <div id="ref-evidence-form-wrap" class="lp-stack lp-gap-related lp-is-hidden">
      ${renderField({ kind: 'input', id: 'ref-evidence-title', name: 'evidenceTitle', label: 'Evidence title', placeholder: 'Evidence title' })}
      ${renderField({ kind: 'input', inputType: 'url', id: 'ref-evidence-url', name: 'evidenceUrl', label: 'Evidence URL', placeholder: 'https://example.com' })}
      ${renderActionBar({
        primary: { id: 'ref-btn-add-evidence', label: 'Add', variant: 'primary', type: 'button' },
        secondary: { id: 'ref-btn-cancel-evidence', label: 'Cancel', variant: 'secondary', type: 'button' },
      })}
    </div>`,
    actionBarHtml: renderActionBar({
      secondary: { id: 'ref-btn-open-evidence', label: 'Attach evidence', variant: 'secondary', type: 'button' },
    }),
  });

  return renderFormSection({
    id: 'ref-structure-section',
    title: 'Structure',
    description: 'Tags, suggested roles, claims, and evidence.',
    fieldsHtml: `<div class="lp-stack lp-gap-group">${levelHtml}${tagsHtml}${spansHtml}${claimsHtml}${evidenceHtml}</div>`,
  });
}
