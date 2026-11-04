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

export function renderStrataDateGlyph(
  happenedIso?: string | null,
  writtenIso?: string | null,
  isHindsight?: boolean
): string {
  if (!happenedIso && !writtenIso) return '';
  const happened = (happenedIso || '').slice(0, 10);
  const written = (writtenIso || happenedIso || '').slice(0, 10);
  const isDifferent = isHindsight || (happened && written && happened !== written);

  return `<span class="strata-date-glyph${isDifferent ? ' is-hindsight' : ''}" aria-hidden="true" title="${isDifferent ? 'Hindsight retrospective layer' : 'Concurrent record layer'}"><span class="strata-glyph-layer happened-layer"></span><span class="strata-glyph-layer written-layer${isDifferent ? ' shifted' : ''}"></span></span>`;
}

export function formatOutcome(outcome?: string | null): string {
  if (!outcome) return '';
  const lower = outcome.toLowerCase().trim();
  switch (lower) {
    case 'worked':
      return 'Worked';
    case 'partly':
    case 'worked partly':
      return 'Partly worked';
    case 'failed':
    case "didn't work":
    case "what didn't work (failed)":
      return "Didn't work";
    case 'unresolved':
      return 'Unresolved';
    case 'unknown':
      return 'Unknown';
    default:
      return outcome.charAt(0).toUpperCase() + outcome.slice(1);
  }
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

  const isStructured = opts?.level
    ? opts.level === 'Structured' || opts.level === 'L1' || opts.level === 'L2' || opts.level === 'L3'
    : false;
  const levelBadge = isStructured
    ? '<span class="chip">Structured</span>'
    : '';

  const hindsightBadge =
    opts?.isHindsight ?? entry.is_hindsight
      ? '<span class="chip">Written looking back</span>'
      : '';

  const updatedLaterBadge =
    opts?.hasLaterUpdates
      ? '<span class="chip" style="border-color:var(--status-warn)">Later thinking</span>'
      : '';

  const outcomeText = formatOutcome(entry.outcome);
  const outcomeBadge = outcomeText
    ? `<span class="chip chip-outcome">${escapeHtml(outcomeText)}</span>`
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
    <div class="entry-meta tabular-nums">
      ${dateLabel ? `${renderStrataDateGlyph(entry.valid_from, entry.written_at || rawDate, opts?.isHindsight ?? entry.is_hindsight)}<time datetime="${dateLabel}">${dateLabel}</time>` : ''}
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
