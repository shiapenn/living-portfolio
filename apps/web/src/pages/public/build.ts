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
    ? `<ul class="entry-list" style="margin-top:8px">
        ${devLog.map((e) => renderEntryRow(e, { basePath: '/work' })).join('\n')}
      </ul>`
    : `<div class="empty-state" style="padding:24px;text-align:center;border:1px dashed var(--rule);border-radius:var(--radius-card);margin-top:12px">
        <p style="color:var(--text-muted);font-size:14px;margin:0">No dev log entries recorded for this venture yet.</p>
      </div>`;

  const content = `
    <article class="reading-column" style="max-width:var(--layout-max);margin:0 auto">
      <div style="margin-bottom:16px">
        <a href="/build" class="btn btn-secondary" style="display:inline-flex;align-items:center;padding:4px 10px;font-size:13px">← Back to Build</a>
      </div>
      <header style="margin-bottom:24px">
        <div style="display:flex;justify-content:space-between;align-items:baseline;flex-wrap:wrap;gap:8px">
          <h1 style="font-family:var(--font-reading);font-size:32px;margin:0">${escapeHtml(venture.name)}</h1>
          <span class="chip">Status: <strong>${escapeHtml(venture.status)}</strong></span>
        </div>
        <p style="font-size:17px;color:var(--text-muted);margin:12px 0 16px">${escapeHtml(venture.description || '')}</p>
        <div style="display:flex;gap:6px;flex-wrap:wrap">${facetChips}</div>
      </header>

      <section class="strata-section" style="margin-bottom:24px">
        <h2 style="font-family:var(--font-reading);font-size:20px;margin:0 0 12px 0">Dev log: ${formatPlural(devLog.length, 'entry', 'entries')}</h2>
        ${devLogListHtml}
      </section>

      <div style="margin-top:24px">
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

      return `<section class="strata-section" style="margin-bottom:24px">
        <div style="display:flex;justify-content:space-between;align-items:baseline;flex-wrap:wrap;gap:8px">
          <h2 style="font-family:var(--font-reading);font-size:24px;margin:0">
            <a href="/build/${escapeHtml(v.slug || v.id)}" style="color:inherit;text-decoration:none">${escapeHtml(v.name)}</a>
          </h2>
          <span class="chip">Status: <strong>${escapeHtml(v.status)}</strong></span>
        </div>
        <p style="margin:8px 0 12px;max-width:65ch">${escapeHtml(v.description || '')}</p>
        <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:16px">${facetChips}</div>
        <div style="margin-top:12px;padding-top:12px;border-top:1px solid var(--rule)">
          <strong style="font-size:14px">Dev log: ${formatPlural(devLog.length, 'entry', 'entries')}</strong>
          ${devLog.length > 0 ? `
            <ul style="margin:6px 0 0;padding-left:20px">
              ${devLog.map((e) => `<li><a href="/work/${escapeHtml(e.slug)}">${escapeHtml(e.title)}</a></li>`).join('\n            ')}
            </ul>
          ` : `
            <p style="color:var(--text-muted);font-size:13px;margin:4px 0 0">No dev log entries attached yet.</p>
          `}
        </div>
      </section>`;
    })
    .join('\n');

  const content = `
    <h1 style="font-family:var(--font-reading);font-size:30px;margin:0 0 8px 0">Build</h1>
    <p style="color:var(--text-muted);margin:0 0 24px 0">Things I've shipped and keep improving, with a log of how each one changed.</p>
    ${ventures.length > 0 ? ventureBlocks : `
      <div class="empty-state" style="padding:48px 16px;text-align:center;border:1px dashed var(--rule);border-radius:var(--radius-card);margin-top:24px">
        <p style="font-weight:600;font-size:18px;margin:0 0 8px 0">No ventures or products listed yet</p>
        <p style="color:var(--text-muted);font-size:15px;margin:0 0 20px 0">Long-running software products, tools, and production deployments will appear here with linked architectural dev-logs.</p>
        <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap">
          <a href="/work" class="btn btn-secondary">Explore Technical Work</a>
          <a href="/ask" class="btn">Ask</a>
        </div>
      </div>
    `}
  `;

  return renderLayout('Build', '/build', content);
}
