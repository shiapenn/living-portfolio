import { computeStructureLevel, getProfile, isTemporallyValid } from "@living-portfolio/core";
import { adaptDataSource, type WebDataClient } from "../../lib/data-source.js";
import { escapeHtml, parseAsOfDate } from "../../lib/html.js";
import { renderLayout } from "../../layouts/public-shell.js";
import { renderEntryRow } from "../../components/index.js";
import { formatPlural } from "../../strings.js";

export async function renderWorkOrWritingPage(
  repo: WebDataClient,
  mode: 'work' | 'writing',
  filterOutcome?: string,
  asOfParam?: string | null
): Promise<string> {
  repo = adaptDataSource(repo);
  const asOfInfo = parseAsOfDate(asOfParam);
  const entries = await repo.listEntries({ visibility: ['public'] });
  const rows: string[] = [];

  for (const entry of entries) {
    if (mode === 'work' && entry.profile === 'freeform') continue;
    const full = await repo.getEntry(entry.id);
    if (!full || !full.currentRevision) continue;
    let rev = full.currentRevision;

    if (asOfInfo && asOfInfo.valid) {
      const allRevs = await repo.getRevisions(entry.id);
      const validRevs = allRevs
        .filter((r) => isTemporallyValid(r, asOfInfo.date).valid)
        .sort((a, b) => {
          const da = new Date(a.valid_from || a.written_at).getTime();
          const db = new Date(b.valid_from || b.written_at).getTime();
          return db - da;
        });
      if (validRevs.length === 0) continue;
      rev = validRevs[0];
    }

    const [facets, annotations, claims] = await Promise.all([
      repo.getFacetsForEntry(entry.id),
      repo.listAnnotationsForRevision(rev.id),
      repo.getClaimsForRevision(rev.id),
    ]);

    if (filterOutcome && !claims.some((c) => c.outcome_status === filterOutcome)) {
      continue;
    }

    const level = computeStructureLevel({
      revision: rev,
      profile: getProfile(entry.profile),
      facets,
      annotations,
      claims,
    });
    const confirmedFacets = facets.filter((f) => f.status === 'confirmed');

    rows.push(
      renderEntryRow(entry, {
        basePath: mode === 'work' ? '/work' : '/writing',
        asOf: asOfInfo && asOfInfo.valid ? asOfInfo.raw : undefined,
        level,
        facets: confirmedFacets.map((f) => ({ key: f.key, value: f.value })),
      })
    );
  }

  const title = mode === 'work' ? 'Work' : 'Writing';
  const asOfParamQuery = asOfInfo && asOfInfo.valid ? `&as_of=${encodeURIComponent(asOfInfo.raw)}` : '';
  const asOfPrefixQuery = asOfInfo && asOfInfo.valid ? `?as_of=${encodeURIComponent(asOfInfo.raw)}` : '';

  const filterBar =
    mode === 'work'
      ? `<div style="display:flex;gap:var(--lp-space-8);margin-bottom:var(--lp-space-16);flex-wrap:wrap;align-items:center">
          <span style="font-size:var(--lp-size-14);color:var(--text-muted)">Outcome:</span>
          <a href="/work${asOfPrefixQuery}" class="chip${!filterOutcome ? ' active' : ''}">All</a>
          <a href="/work?outcome=worked${asOfParamQuery}" class="chip${filterOutcome === 'worked' ? ' active' : ''}">Worked</a>
          <a href="/work?outcome=partly${asOfParamQuery}" class="chip${filterOutcome === 'partly' ? ' active' : ''}">Partly worked</a>
          <a href="/work?outcome=failed${asOfParamQuery}" class="chip${filterOutcome === 'failed' ? ' active' : ''}">Didn't work</a>
          <a href="/work?outcome=unresolved${asOfParamQuery}" class="chip${filterOutcome === 'unresolved' ? ' active' : ''}">Unresolved</a>
        </div>`
      : '';

  const asOfBanner = asOfInfo && asOfInfo.valid
    ? `<div class="as-of-banner" role="status" style="margin-bottom:var(--lp-space-16)">
         <span><strong>Viewing as of ${escapeHtml(asOfInfo.raw.slice(0, 10))}</strong> — Entries written after this date are excluded.</span>
         <a href="${mode === 'work' ? '/work' : '/writing'}">Reset to present</a>
       </div>`
    : '';

  const content = `
    <h1 style="font-family:var(--font-reading);font-size:var(--lp-size-30);margin:0 0 var(--lp-space-8) 0">${title}</h1>
    <p style="color:var(--text-muted);margin:0 0 var(--lp-space-24) 0">
      ${mode === 'work' ? 'Case studies, decisions and design projects, with the evidence behind them.' : "Everything I've published, newest first."}
    </p>
    ${filterBar}
    ${asOfBanner}
    ${rows.length > 0 ? `
      <ul class="entry-list">
        ${rows.join('\n')}
      </ul>
    ` : `
      <div class="empty-state" style="padding:var(--lp-size-48) var(--lp-space-16);text-align:center;border:var(--lp-border-hairline) dashed var(--rule);border-radius:var(--radius-card);margin:var(--lp-space-24) 0">
        <p style="font-weight:600;font-size:var(--lp-size-18);margin:0 0 var(--lp-space-8) 0">${filterOutcome ? 'No entries match the selected filters' : (mode === 'work' ? 'No matching case studies found' : 'No writing entries found')}</p>
        <p style="color:var(--text-muted);font-size:var(--lp-size-14);margin:0 0 var(--lp-size-icon-md) 0">
          ${filterOutcome ? `No public case studies match the outcome filter "${escapeHtml(filterOutcome)}".` : (asOfInfo && asOfInfo.valid ? 'No public entries were recorded on or before this as-of date.' : 'No public entries have been published yet.')}
        </p>
        <div style="display:flex;gap:var(--lp-space-12);justify-content:center;flex-wrap:wrap">
          ${filterOutcome ? `<a href="/work${asOfPrefixQuery}" class="btn btn-secondary">Reset all filters</a>` : ''}
          ${asOfInfo && asOfInfo.valid ? `<a href="/${mode}" class="btn btn-secondary">Reset to present</a>` : ''}
          <a href="/ask" class="btn">Ask</a>
        </div>
      </div>
    `}
  `;

  return renderLayout(title, `/${mode}`, content);
}
