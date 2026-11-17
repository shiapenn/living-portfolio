import { escapeHtml } from '../lib/html.js';
import { renderBadge, renderIconButton, renderTabs } from '../primitives/index.js';
import { INSPECTOR_STRINGS } from '../strings/admin/inspector.js';

export interface InspectorFacet {
  facet_type?: string;
  facet_value?: string;
  suggested?: boolean;
}

export interface InspectorEvidence {
  title?: string;
  url?: string;
  kind?: string;
  suggested?: boolean;
}

export interface InspectorClaim {
  claim_text?: string;
  suggested?: boolean;
}

export interface InspectorRevision {
  id: string;
  valid_from?: string;
  temporal_level?: string;
  created_at?: string;
}

export interface StructureInspectorData {
  entryId?: string;
  visibility: 'draft' | 'unlisted' | 'public';
  structureLevel: number;
  gapQuestions: string[];
  facets: InspectorFacet[];
  claims: InspectorClaim[];
  evidence: InspectorEvidence[];
  revisions: InspectorRevision[];
}

export function renderStructureInspectorPanel(data: StructureInspectorData): string {
  const level = Math.max(0, Math.min(3, Number.isFinite(data.structureLevel) ? data.structureLevel : 0));
  const stepNames = ['Captured', 'Tagged', 'Claimed', 'Grounded'];
  const levelLineHtml = stepNames
    .map((name, idx) => (idx === level ? `<strong>${escapeHtml(name)}</strong>` : escapeHtml(name)))
    .join(', ');

  const nextPrompt = data.gapQuestions[0]?.trim() || INSPECTOR_STRINGS.defaultNextStep;

  const claimsList = data.claims.length > 0
    ? `<ul class="lp-inspector-list">${data.claims
        .slice(0, 5)
        .map((c) => `<li class="lp-inspector-item"><span>${escapeHtml(c.claim_text || '')}</span></li>`)
        .join('')}</ul>`
    : `<p class="lp-field-help">${escapeHtml(INSPECTOR_STRINGS.tabs.structure.empty)}</p>`;

  const facetsList = data.facets.length > 0
    ? `<ul class="lp-inspector-list">${data.facets
        .slice(0, 8)
        .map((f) => `<li class="lp-inspector-item"><span>${escapeHtml(`${f.facet_type ?? 'tag'}: ${f.facet_value ?? ''}`)}</span></li>`)
        .join('')}</ul>`
    : `<p class="lp-field-help">${escapeHtml(INSPECTOR_STRINGS.tabs.context.empty)}</p>`;

  const evidenceList = data.evidence.length > 0
    ? `<ul class="lp-inspector-list">${data.evidence
        .slice(0, 6)
        .map((e) => `<li class="lp-inspector-item"><span>${escapeHtml(e.title || e.url || e.kind || 'Evidence')}</span></li>`)
        .join('')}</ul>`
    : `<p class="lp-field-help">${escapeHtml(INSPECTOR_STRINGS.tabs.evidence.empty)}</p>`;

  const isAnswerable = data.visibility !== 'draft' && (data.claims.length > 0 || level >= 2);
  const answerDetail = data.visibility === 'draft'
    ? INSPECTOR_STRINGS.tabs.answerability.draftDetail
    : isAnswerable
      ? INSPECTOR_STRINGS.tabs.answerability.readyDetail
      : INSPECTOR_STRINGS.tabs.answerability.ungroundedDetail;
  const answerPanel = `<div class="lp-inspector-status">
      ${renderBadge({ label: isAnswerable ? INSPECTOR_STRINGS.tabs.answerability.readyLabel : INSPECTOR_STRINGS.tabs.answerability.notReadyLabel, tone: isAnswerable ? 'ok' : 'warn' })}
      <p class="lp-field-help">${escapeHtml(answerDetail)}</p>
    </div>`;

  const revList = data.revisions.length > 0
    ? `<ul class="lp-inspector-list">${data.revisions
        .slice(0, 4)
        .map((r) => `<li class="lp-inspector-item"><span>${escapeHtml(String(r.created_at || r.valid_from || r.id).slice(0, 10))}</span>${renderBadge({ label: r.temporal_level || 'exact', tone: 'neutral' })}</li>`)
        .join('')}</ul>`
    : `<p class="lp-field-help">${escapeHtml(INSPECTOR_STRINGS.tabs.history.empty)}</p>`;

  const historyLink = data.entryId && data.entryId !== 'new'
    ? `<a href="/admin/entries/${encodeURIComponent(data.entryId)}/history" class="lp-btn lp-btn-secondary lp-btn-sm">${escapeHtml(INSPECTOR_STRINGS.tabs.history.viewAll)}</a>`
    : '';

  return `<aside id="ref-inspector-pane" class="lp-editor-drawer lp-editor-drawer-right" aria-label="${escapeHtml(INSPECTOR_STRINGS.paneLabel)}" hidden>
    <div class="lp-editor-drawer-header">
      <p class="lp-inspector-level-line">${levelLineHtml}</p>
      ${renderIconButton({
        id: 'ref-btn-close-structure',
        ariaLabel: 'Close structure panel',
        title: 'Close structure panel',
        icon: 'x',
        iconSize: 16,
        variant: 'quiet',
        size: 'sm',
      })}
    </div>
    <p class="lp-inspector-next-step"><strong>${escapeHtml(INSPECTOR_STRINGS.nextStepPrefix)}</strong> ${escapeHtml(nextPrompt)}</p>
    ${renderTabs({
      id: 'ref-inspector-tabs',
      ariaLabel: INSPECTOR_STRINGS.paneLabel,
      tabs: [
        { id: 'structure', label: INSPECTOR_STRINGS.tabs.structure.label, panelHtml: claimsList, active: true },
        { id: 'context', label: INSPECTOR_STRINGS.tabs.context.label, panelHtml: facetsList },
        { id: 'evidence', label: INSPECTOR_STRINGS.tabs.evidence.label, panelHtml: evidenceList },
        { id: 'answerability', label: INSPECTOR_STRINGS.tabs.answerability.label, panelHtml: answerPanel },
        { id: 'history', label: INSPECTOR_STRINGS.tabs.history.label, panelHtml: `${revList}${historyLink}` },
      ],
    })}
  </aside>`;
}
