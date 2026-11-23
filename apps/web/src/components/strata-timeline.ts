import { isTemporallyValid } from "@living-portfolio/core";
import { adaptDataSource, type WebDataClient } from "../lib/data-source.js";
import { escapeHtml, parseAsOfDate } from "../lib/html.js";
import { formatMonthYear, formatPlural } from "../strings.js";
import { STRATA_TIMELINE_SCRIPT } from "./strata-timeline-script.js";

export async function renderStrataTimelineSection(
  repo: WebDataClient,
  asOfParam?: string | null
): Promise<{ html: string; visibleSlugs: Set<string> | null }> {
  repo = adaptDataSource(repo);
  const entries = await repo.listEntries({ visibility: ['public'] });
  const buckets: Record<
    string,
    {
      yearMonth: string;
      count: number;
      titles: string[];
      slugs: string[];
      profiles: string[];
      ventureIds: string[];
    }
  > = {};
  const asOfInfo = parseAsOfDate(asOfParam);
  let visibleSlugs: Set<string> | null = null;

  if (asOfInfo && asOfInfo.valid) {
    visibleSlugs = new Set<string>();
  }

  for (const entry of entries) {
    const full = await repo.getEntry(entry.id);
    if (!full || !full.currentRevision) continue;
    const rev = full.currentRevision;
    const d = rev.valid_from ? new Date(rev.valid_from) : new Date(rev.written_at);
    const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

    if (!buckets[ym]) {
      buckets[ym] = {
        yearMonth: ym,
        count: 0,
        titles: [],
        slugs: [],
        profiles: [],
        ventureIds: [],
      };
    }
    buckets[ym].count++;
    buckets[ym].titles.push(entry.title);
    buckets[ym].slugs.push(entry.slug);
    buckets[ym].profiles.push(entry.profile);
    if (entry.venture_id) {
      buckets[ym].ventureIds.push(entry.venture_id);
    }

    if (asOfInfo && asOfInfo.valid && visibleSlugs) {
      const check = isTemporallyValid(rev, asOfInfo.date);
      if (check.valid) visibleSlugs.add(entry.slug);
    }
  }

  // Generate continuous month axis across all years (Finding 20261020-UI-05)
  const populatedYms = Object.keys(buckets).sort();
  const today = new Date();
  const currentYm = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

  let minYm = populatedYms[0] || currentYm;
  let maxYm = populatedYms[populatedYms.length - 1] || currentYm;
  if (currentYm > maxYm) maxYm = currentYm;

  if (asOfInfo && asOfInfo.valid) {
    const asOfYm = asOfInfo.raw.slice(0, 7);
    if (asOfYm < minYm) minYm = asOfYm;
    if (asOfYm > maxYm) maxYm = asOfYm;
  }

  const allMonths: string[] = [];
  {
    const [startYear, startMonth] = minYm.split('-').map(Number);
    const [endYear, endMonth] = maxYm.split('-').map(Number);
    let y = startYear;
    let m = startMonth;
    while (y < endYear || (y === endYear && m <= endMonth)) {
      allMonths.push(`${y}-${String(m).padStart(2, '0')}`);
      m++;
      if (m > 12) {
        m = 1;
        y++;
      }
    }
  }

  const profileGlyphMap: Record<string, string> = {
    'case-study': '■',
    'decision-record': '◆',
    'design-project': '▲',
  };

  let asOfBanner = '';
  if (asOfInfo) {
    if (asOfInfo.valid) {
      asOfBanner = `<div class="as-of-banner" role="status">
         <span><strong>Viewing as of ${formatMonthYear(asOfInfo.raw)} (${escapeHtml(asOfInfo.raw.slice(0, 7))})</strong> — Entries written later are hidden.</span>
         <a href="/timeline">Back to today</a>
       </div>`;
    } else {
      asOfBanner = `<div class="as-of-banner" role="alert">
         <span><strong>Invalid as-of date ("${escapeHtml(asOfInfo.raw)}")</strong> — Showing records as of present.</span>
         <a href="/timeline">Back to today</a>
       </div>`;
    }
  }

  const bandsHtml = allMonths
    .map((ym) => {
      const b = buckets[ym] || {
        yearMonth: ym,
        count: 0,
        titles: [],
        slugs: [],
        profiles: [],
        ventureIds: [],
      };

      const [yearStr, monthStr] = ym.split('-');
      const year = parseInt(yearStr, 10);
      const month = parseInt(monthStr, 10);
      const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
      const padDay = String(lastDay).padStart(2, '0');
      const bandAsOf = `${ym}-${padDay}T23:59:59Z`;

      const dimmed = asOfInfo && asOfInfo.valid ? ym > asOfInfo.raw.slice(0, 7) : false;
      const isCursor = asOfInfo && asOfInfo.valid && ym === asOfInfo.raw.slice(0, 7);

      if (b.count === 0) {
        return `<a href="/timeline?as_of=${bandAsOf}" class="strata-band strata-band-empty" data-band-tier="1" data-ym="${ym}" data-asof="${bandAsOf}" data-dimmed="${dimmed}" data-count="0"${isCursor ? ' data-cursor="true"' : ''} aria-label="${ym}: No entries (${formatMonthYear(ym)})${dimmed ? ' (after as-of date)' : ''}">
          <div class="band-empty-hairline" aria-hidden="true"></div>
          <span class="band-ym-empty">${month === 1 ? ym : monthStr}</span>
          ${dimmed ? '<div class="band-label-future">(future)</div>' : ''}
        </a>`;
      }

      // Height formula: non-linear square-root scale between 52px and 120px (Finding 20261020-UI-05)
      const heightPx = Math.min(120, Math.round(52 + Math.sqrt(b.count) * 28));
      const layerText = formatPlural(b.count, 'entry', 'entries');
      const uniqueProfiles = Array.from(new Set(b.profiles));
      const primaryProfile = uniqueProfiles[0] || 'case-study';
      const glyphs = uniqueProfiles.map((p) => profileGlyphMap[p] || '■').join(' ');
      const hasVenture = b.ventureIds.length > 0;

      return `<a href="/timeline?as_of=${bandAsOf}" class="strata-band" data-profile="${escapeHtml(primaryProfile)}" data-band-tier="${Math.min(5, Math.max(1, Math.ceil((heightPx - 40) / 16)))}" data-ym="${ym}" data-slug="${b.slugs[0]}" data-asof="${bandAsOf}" data-dimmed="${dimmed}" data-count="${b.count}"${isCursor ? ' data-cursor="true"' : ''} aria-label="${ym} (${formatMonthYear(ym)}): ${layerText} (${uniqueProfiles.join(', ')})${dimmed ? ' (after as-of date)' : ''}">
        ${hasVenture ? '<span class="band-venture-notch" title="Venture project" aria-hidden="true"></span>' : ''}
        <div class="band-header">
          <span class="band-glyphs" aria-hidden="true">${glyphs}</span>
          <span class="band-ym">${ym}</span>
        </div>
        <div class="band-count">${layerText}</div>
        ${dimmed ? '<div class="band-label-future">(future)</div>' : ''}
      </a>`;
    })
    .join('\n      ');

  const asOfQuery = asOfInfo && asOfInfo.valid ? `?as_of=${encodeURIComponent(asOfInfo.raw)}` : '';
  const textListHtml = allMonths
    .map((ym) => {
      const b = buckets[ym];
      if (!b || b.count === 0) return '';
      const visibleIndices = b.slugs
        .map((s, idx) => (!visibleSlugs || visibleSlugs.has(s) ? idx : -1))
        .filter((idx) => idx !== -1);
      if (visibleIndices.length === 0) return '';
      return `<li><strong>${formatMonthYear(b.yearMonth)}</strong> (${formatPlural(visibleIndices.length, 'entry', 'entries')}): ${visibleIndices
        .map((i) => `<a href="/work/${b.slugs[i]}${asOfQuery}">${escapeHtml(b.titles[i])}</a>`)
        .join(', ')}</li>`;
    })
    .filter(Boolean)
    .join('\n        ');

  const todayIso = new Date().toISOString().slice(0, 10);
  const defaultInputValue = asOfInfo && asOfInfo.valid ? asOfInfo.raw.slice(0, 10) : todayIso;

  const html = `<section class="strata-section" aria-labelledby="strata-heading">
    <div class="strata-header">
      <div>
        <h2 id="strata-heading" class="pub-m-0">Strata timeline</h2>
        <span class="pub-muted">Pick a month to see this site as it was then. Gaps show time between projects.</span>
      </div>
      <form method="GET" action="/timeline" class="pub-row">
        <label for="as-of-input">As of:</label>
        <input id="as-of-input" name="as_of" type="date" value="${escapeHtml(defaultInputValue)}" class="ask-input pub-input-auto" />
        <button type="submit" class="btn btn-secondary">Apply Date</button>
      </form>
    </div>
    ${asOfBanner}
    <div class="strata-layers-container">
      <div class="strata-layers" role="region" aria-label="Chronological strata layers">
        ${asOfInfo && asOfInfo.valid ? `<div class="as-of-cursor" id="strata-cursor" role="slider" aria-label="As of date cursor" aria-valuetext="${escapeHtml(asOfInfo.raw.slice(0, 10))}" tabindex="0"><span class="as-of-cursor-handle" title="Viewing as of ${escapeHtml(asOfInfo.raw.slice(0, 7))}">Viewing as of ${formatMonthYear(asOfInfo.raw)} (${escapeHtml(asOfInfo.raw.slice(0, 7))})</span></div>` : ''}
        ${bandsHtml}
      </div>
    </div>
    <div class="strata-legend" role="list" aria-label="Strata encoding legend">
      <span class="strata-legend-item" role="listitem"><span class="glyph-case-study" aria-hidden="true">■</span> Case study</span>
      <span class="strata-legend-item" role="listitem"><span class="glyph-decision-record" aria-hidden="true">◆</span> Decision record</span>
      <span class="strata-legend-item" role="listitem"><span class="glyph-design-project" aria-hidden="true">▲</span> Design project</span>
      <span class="strata-legend-item" role="listitem"><span class="band-venture-notch band-venture-notch-inline" aria-hidden="true"></span> Venture notch</span>
      <span class="strata-legend-hint">Keyboard: Left/Right arrows move between months, PageUp/PageDown by year, Enter opens month.</span>
    </div>
    <details class="pub-mt-md">
      <summary class="pub-muted">Timeline as a list</summary>
      <ul class="pub-mt-md">
        ${textListHtml}
      </ul>
    </details>${STRATA_TIMELINE_SCRIPT}
  </section>`;

  return { html, visibleSlugs };
}
