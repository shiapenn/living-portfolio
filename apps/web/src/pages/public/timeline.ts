import { adaptDataSource, type WebDataClient } from "../../lib/data-source.js";
import { escapeHtml, parseAsOfDate } from "../../lib/html.js";
import { renderLayout } from "../../layouts/public-shell.js";
import { renderStrataTimelineSection } from "../../components/strata-timeline.js";
import { renderEntryRow } from "../../components/index.js";
import { formatMonthYear, formatPlural } from "../../strings.js";

export async function renderTimelinePage(
  repo: WebDataClient,
  asOfParam?: string | null
): Promise<string> {
  repo = adaptDataSource(repo);
  const asOfInfo = parseAsOfDate(asOfParam);
  const { html: strataHtml, visibleSlugs } = await renderStrataTimelineSection(repo, asOfParam);
  const allPublic = await repo.listEntries({ visibility: ['public'] });

  const filtered = visibleSlugs ? allPublic.filter((e) => visibleSlugs.has(e.slug)) : allPublic;
  const excludedCount = allPublic.length - filtered.length;
  const asOfQuery = asOfInfo && asOfInfo.valid ? `?as_of=${encodeURIComponent(asOfInfo.raw)}` : '';

  let listContentHtml = '';
  if (filtered.length === 0) {
    listContentHtml = `
      <div class="empty-state pub-empty pub-mt-md">
        <p class="pub-m-0">No records active as of this date</p>
        <p class="pub-muted pub-m-0">All published entries were recorded after this point in time, or retrospective hindsight has been filtered out.</p>
        <a href="/timeline" class="btn btn-secondary">Reset to present</a>
      </div>
    `;
  } else {
    const listHtml = filtered
      .map((e) =>
        renderEntryRow(e, {
          basePath: '/work',
          asOf: asOfInfo && asOfInfo.valid ? asOfInfo.raw : undefined,
        })
      )
      .join('\n');
    listContentHtml = `<ul class="entry-list">${listHtml}</ul>`;
  }

  const activeDateLabel = asOfInfo && asOfInfo.valid ? formatMonthYear(asOfInfo.raw) : 'at present';
  const entryCountText = formatPlural(filtered.length, 'entry', 'entries');
  const hiddenText = excludedCount > 0 ? `. ${excludedCount} are hidden because they were written later.` : '';

  const content = `
    <h1 class="pub-m-0">Timeline</h1>
    <p class="pub-muted pub-m-0">
      Move the cursor to see what I had written by that date. Later entries, and entries written looking back, are hidden.
    </p>
    ${strataHtml}
    <section>
      <h2 class="pub-m-0">
        ${entryCountText} as of ${activeDateLabel}${hiddenText}
      </h2>
      ${listContentHtml}
    </section>
  `;

  return renderLayout('Timeline', '/timeline', content);
}
