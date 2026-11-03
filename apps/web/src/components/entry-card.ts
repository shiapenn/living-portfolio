/**
 * §12.4 Standard Entry Row & Card Component (Finding 20261020-UI-04 [P1])
 *
 * Unifies the hand-built entry rows across Home, Work, Writing, Build, and Timeline into a single
 * reusable, accessible, WCAG-conformant component.
 */

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export interface EntryRowOptions {
  asOf?: string;
  showSummary?: boolean;
  basePath?: string;
  level?: string;
  isHindsight?: boolean;
  hasLaterUpdates?: boolean;
  facets?: Array<{ key: string; value: any }>;
  summary?: string;
  asArticle?: boolean;
}

export function renderEntryRow(entry: any, opts?: EntryRowOptions): string {
  const basePath = opts?.basePath || (entry.profile && entry.profile !== 'freeform' ? '/work' : '/writing');
  const asOfQuery = opts?.asOf ? `?as_of=${encodeURIComponent(opts.asOf)}` : '';
  const href = `${basePath}/${escapeHtml(entry.slug)}${asOfQuery}`;
  const title = escapeHtml(entry.title);

  const rawDate = entry.valid_from || entry.created_at || entry.written_at || '';
  const dateLabel = rawDate ? rawDate.slice(0, 10) : '';

  const levelBadge = opts?.level
    ? `<span class="chip">${escapeHtml(opts.level)}${entry.profile ? ` · ${escapeHtml(entry.profile)}` : ''}</span>`
    : entry.profile
    ? `<span class="chip">${escapeHtml(entry.profile)}</span>`
    : '';

  const hindsightBadge =
    opts?.isHindsight ?? entry.is_hindsight
      ? '<span class="chip">Hindsight retrospective</span>'
      : '';

  const updatedLaterBadge =
    opts?.hasLaterUpdates
      ? '<span class="chip" style="border-color:var(--status-warn)">Updated later</span>'
      : '';

  const outcomeBadge = entry.outcome
    ? `<span class="chip chip-outcome">${escapeHtml(entry.outcome)}</span>`
    : '';

  let facetChips = '';
  if (opts?.facets && opts.facets.length > 0) {
    facetChips = `<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:4px">${opts.facets
      .map((f) => `<span class="chip">${escapeHtml(f.key)}: ${escapeHtml(String(f.value))}</span>`)
      .join(' ')}</div>`;
  }

  let summaryHtml = '';
  const summaryText = opts?.summary !== undefined ? opts.summary : entry.summary;
  if (opts?.showSummary !== false && summaryText) {
    summaryHtml = `<div style="color:var(--text-muted);max-width:68ch;margin-top:4px">${escapeHtml(summaryText)}</div>`;
  }

  const tag = opts?.asArticle ? 'article' : 'li';

  return `<${tag} class="entry-row">
  <div class="entry-row-top">
    <a href="${href}" class="entry-title-link">${title}</a>
    <div class="entry-meta">
      ${dateLabel ? `<time datetime="${dateLabel}">${dateLabel}</time>` : ''}
      ${levelBadge}
      ${hindsightBadge}
      ${updatedLaterBadge}
      ${outcomeBadge}
    </div>
  </div>
  ${summaryHtml}
  ${facetChips}
</${tag}>`;
}
