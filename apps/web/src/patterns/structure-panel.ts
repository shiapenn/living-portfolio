import { escapeHtml } from '../lib/html.js';
import { renderBadge } from '../primitives/index.js';
import { renderTabs } from '../components/index.js';
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

function renderSuggestedBadge(): string {
  return renderBadge({ label: INSPECTOR_STRINGS.suggestedBadge, tone: 'info' });
}

export function renderStructureInspectorPanel(data: StructureInspectorData): string {
  const level = Math.max(0, Math.min(3, Number.isFinite(data.structureLevel) ? data.structureLevel : 0));
  const levelsHtml = INSPECTOR_STRINGS.levels
    .map((step) => {
      const done = step.level <= level;
      const current = step.level === level;
      return `<div class="lp-inspector-level${done ? ' lp-inspector-level-done' : ''}${current ? ' lp-inspector-level-current' : ''}" data-level="${step.level}">
        <span class="lp-inspector-level-code">${escapeHtml(step.code)}</span>
        <span class="lp-inspector-level-name">${escapeHtml(step.label)}</span>
      </div>`;
    })
    .join('');

  const nextPrompt = data.gapQuestions[0]?.trim() || INSPECTOR_STRINGS.defaultNextStep;

  const claimsList = data.claims.length > 0
    ? `<ul class="lp-inspector-list">${data.claims
        .slice(0, 5)
        .map((c) => `<li class="lp-inspector-item${c.suggested ? ' lp-inspector-suggested' : ''}"><span>${escapeHtml(c.claim_text || '')}</span>${c.suggested ? renderSuggestedBadge() : ''}</li>`)
        .join('')}</ul>`
    : `<p class="lp-field-help">${escapeHtml(INSPECTOR_STRINGS.tabs.structure.empty)}</p>`;

  const structurePanel = `<p class="lp-inspector-explainer">${escapeHtml(INSPECTOR_STRINGS.tabs.structure.explainer)}</p>
    ${claimsList}
    ${data.claims.some((c) => c.suggested) ? '' : `<div class="lp-inspector-item lp-inspector-suggested"><span>${escapeHtml(INSPECTOR_STRINGS.tabs.structure.suggestedHeading)}</span>${renderSuggestedBadge()}</div>`}`;

  const facetsList = data.facets.length > 0
    ? `<ul class="lp-inspector-list">${data.facets
        .slice(0, 8)
        .map((f) => `<li class="lp-inspector-item${f.suggested ? ' lp-inspector-suggested' : ''}"><span>${escapeHtml(`${f.facet_type ?? 'tag'}: ${f.facet_value ?? ''}`)}</span>${f.suggested ? renderSuggestedBadge() : ''}</li>`)
        .join('')}</ul>`
    : `<p class="lp-field-help">${escapeHtml(INSPECTOR_STRINGS.tabs.context.empty)}</p>
       <div class="lp-inspector-item lp-inspector-suggested"><span>${escapeHtml(INSPECTOR_STRINGS.tabs.context.suggestedHeading)}</span>${renderSuggestedBadge()}</div>`;

  const contextPanel = `<p class="lp-inspector-explainer">${escapeHtml(INSPECTOR_STRINGS.tabs.context.explainer)}</p>${facetsList}`;

  const evidenceList = data.evidence.length > 0
    ? `<ul class="lp-inspector-list">${data.evidence
        .slice(0, 6)
        .map((e) => `<li class="lp-inspector-item${e.suggested ? ' lp-inspector-suggested' : ''}"><span>${escapeHtml(e.title || e.url || e.kind || 'Evidence')}</span>${e.suggested ? renderSuggestedBadge() : ''}</li>`)
        .join('')}</ul>`
    : `<p class="lp-field-help">${escapeHtml(INSPECTOR_STRINGS.tabs.evidence.empty)}</p>
       <div class="lp-inspector-item lp-inspector-suggested"><span>${escapeHtml(INSPECTOR_STRINGS.tabs.evidence.suggestedHeading)}</span>${renderSuggestedBadge()}</div>`;

  const evidencePanel = `<p class="lp-inspector-explainer">${escapeHtml(INSPECTOR_STRINGS.tabs.evidence.explainer)}</p>${evidenceList}`;

  const isAnswerable = data.visibility !== 'draft' && (data.claims.length > 0 || level >= 2);
  const answerDetail = data.visibility === 'draft'
    ? INSPECTOR_STRINGS.tabs.answerability.draftDetail
    : isAnswerable
      ? INSPECTOR_STRINGS.tabs.answerability.readyDetail
      : INSPECTOR_STRINGS.tabs.answerability.ungroundedDetail;
  const answerPanel = `<p class="lp-inspector-explainer">${escapeHtml(INSPECTOR_STRINGS.tabs.answerability.explainer)}</p>
    <div class="lp-inspector-status">
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

  const historyPanel = `<p class="lp-inspector-explainer">${escapeHtml(INSPECTOR_STRINGS.tabs.history.explainer)}</p>${revList}${historyLink}`;

  return `<aside id="ref-inspector-pane" class="lp-editor-inspector lp-card" aria-label="${escapeHtml(INSPECTOR_STRINGS.paneLabel)}">
    <div class="lp-inspector-levels" role="group" aria-label="Structure level">${levelsHtml}</div>
    <p class="lp-inspector-next-step"><strong>${escapeHtml(INSPECTOR_STRINGS.nextStepPrefix)}</strong> ${escapeHtml(nextPrompt)}</p>
    ${renderTabs({
      id: 'ref-inspector-tabs',
      ariaLabel: INSPECTOR_STRINGS.paneLabel,
      tabs: [
        { id: 'structure', label: INSPECTOR_STRINGS.tabs.structure.label, panelHtml: structurePanel, active: true },
        { id: 'context', label: INSPECTOR_STRINGS.tabs.context.label, panelHtml: contextPanel },
        { id: 'evidence', label: INSPECTOR_STRINGS.tabs.evidence.label, panelHtml: evidencePanel },
        { id: 'answerability', label: INSPECTOR_STRINGS.tabs.answerability.label, panelHtml: answerPanel },
        { id: 'history', label: INSPECTOR_STRINGS.tabs.history.label, panelHtml: historyPanel },
      ],
    })}
  </aside>`;
}
