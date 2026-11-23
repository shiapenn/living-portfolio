import { adaptDataSource, type WebDataClient } from "../../lib/data-source.js";
import { escapeHtml, sanitizeHttpUrl } from "../../lib/html.js";
import { renderLayout } from "../../layouts/public-shell.js";
import { renderNotFoundPage } from "./not-found.js";
import { renderEntryDetailPage } from "./entry.js";
import { renderEntryRow } from "../../components/index.js";
import { formatPlural } from "../../strings.js";

export async function renderBuildVenturePage(
  repo: WebDataClient,
  slug: string
): Promise<{ status: number; html: string }> {
  repo = adaptDataSource(repo);
  const ventures = await repo.listVentures();
  const venture = ventures.find((v) => (v.slug || v.id) === slug || v.id === slug);

  if (!venture) {
    const entryRes = await repo.getEntryBySlug(slug);
    if (entryRes && entryRes.currentRevision && entryRes.entry.visibility === 'public') {
      return renderEntryDetailPage(repo, slug, 'article', undefined, '/build');
    }
    return {
      status: 404,
      html: renderNotFoundPage(`Venture or build project "${escapeHtml(slug)}" not found`, '/build'),
    };
  }

  const entries = await repo.listEntries({ visibility: ['public'] });
  const devLog = entries.filter((e) => e.venture_id === venture.id);

  const facetChips = venture.facets
    ? (Array.isArray(venture.facets)
        ? venture.facets.map((f: any) => `<span class="chip">${escapeHtml(f.facet || f.name || '')}: <strong>${escapeHtml(String(f.value ?? ''))}</strong></span>`)
        : Object.entries(venture.facets).map(([k, val]) => `<span class="chip">${escapeHtml(k)}: <strong>${escapeHtml(String(val))}</strong></span>`))
        .join(' ')
    : '';

  const devLogListHtml = devLog.length > 0
    ? `<ul class="entry-list pub-mt-md">
        ${devLog.map((e) => renderEntryRow(e, { basePath: '/work' })).join('\n')}
      </ul>`
    : `<div class="empty-state pub-empty pub-mt-md">
        <p class="pub-muted pub-m-0">No dev log entries recorded for this venture yet.</p>
      </div>`;

  const content = `
    <article class="reading-column pub-m-0">
      <div class="pub-mb-md">
        <a href="/build" class="btn btn-secondary">← Back to Build</a>
      </div>
      <header class="pub-mb-md">
        <div class="pub-row-between">
          <h1 class="pub-m-0">${escapeHtml(venture.name)}</h1>
          <span class="chip">Status: <strong>${escapeHtml(venture.status)}</strong></span>
        </div>
        <p class="pub-muted">${escapeHtml(venture.description || '')}</p>
        <div class="pub-row">${facetChips}</div>
      </header>

      <section class="strata-section pub-mb-md">
        <h2 class="pub-m-0">Dev log: ${formatPlural(devLog.length, 'entry', 'entries')}</h2>
        ${devLogListHtml}
      </section>

      <div class="pub-mt-md">
        <a href="/ask?scope=${encodeURIComponent(venture.slug || venture.id)}" class="btn">Ask about this venture</a>
      </div>
    </article>
  `;

  return {
    status: 200,
    html: renderLayout(venture.name, '/build', content),
  };
}

export async function renderBuildPage(repo: WebDataClient): Promise<string> {
  repo = adaptDataSource(repo);
  const ventures = await repo.listVentures();
  const entries = await repo.listEntries({ visibility: ['public'] });

  const ventureBlocks = ventures
    .map((v) => {
      const devLog = entries.filter((e) => e.venture_id === v.id);
      const facetChips = v.facets
        ? (Array.isArray(v.facets)
            ? v.facets.map((f: any) => `<span class="chip">${escapeHtml(f.facet || f.name || '')}: <strong>${escapeHtml(String(f.value ?? ''))}</strong></span>`)
            : Object.entries(v.facets).map(([k, val]) => `<span class="chip">${escapeHtml(k)}: <strong>${escapeHtml(String(val))}</strong></span>`))
            .join(' ')
        : '';

      return `<section class="strata-section pub-mb-md">
        <div class="pub-row-between">
          <h2 class="pub-m-0">
            <a href="/build/${escapeHtml(v.slug || v.id)}">${escapeHtml(v.name)}</a>
          </h2>
          <span class="chip">Status: <strong>${escapeHtml(v.status)}</strong></span>
        </div>
        <p>${escapeHtml(v.description || '')}</p>
        <div class="pub-row pub-mb-md">${facetChips}</div>
        <div class="pub-section pub-mt-md">
          <strong>Dev log: ${formatPlural(devLog.length, 'entry', 'entries')}</strong>
          ${devLog.length > 0 ? `
            <ul>
              ${devLog.map((e) => `<li><a href="/work/${escapeHtml(e.slug)}">${escapeHtml(e.title)}</a></li>`).join('\n            ')}
            </ul>
          ` : `
            <p class="pub-muted">No dev log entries attached yet.</p>
          `}
        </div>
      </section>`;
    })
    .join('\n');

  const content = `
    <h1 class="pub-m-0">Build</h1>
    <p class="pub-muted pub-m-0">Things I've shipped and keep improving, with a log of how each one changed.</p>
    ${ventures.length > 0 ? ventureBlocks : `
      <div class="empty-state pub-empty pub-mt-md">
        <p class="pub-m-0">No ventures or products listed yet</p>
        <p class="pub-muted pub-m-0">Long-running software products, tools, and production deployments will appear here with linked architectural dev-logs.</p>
        <div class="pub-row">
          <a href="/work" class="btn btn-secondary">Explore Technical Work</a>
          <a href="/ask" class="btn">Ask</a>
        </div>
      </div>
    `}
  `;

  return renderLayout('Build', '/build', content);
}
