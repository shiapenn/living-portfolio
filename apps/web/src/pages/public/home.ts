import { loadConfig } from "@living-portfolio/config";
import {
  computeStructureLevel,
  detectLaterThinking,
  getProfile,
  isTemporallyValid,
} from "@living-portfolio/core";
import { adaptDataSource, type WebDataClient } from "../../lib/data-source.js";
import { escapeHtml } from "../../lib/html.js";
import { renderLayout } from "../../layouts/public-shell.js";
import { renderStrataTimelineSection } from "../../components/strata-timeline.js";
import { renderEntryRow } from "../../components/index.js";

export async function renderHomePage(repo: WebDataClient): Promise<string> {
  repo = adaptDataSource(repo);
  const { html: strataHtml } = await renderStrataTimelineSection(repo);
  const publicEntries = await repo.listEntries({ visibility: ['public'] });
  const acceptedRelations = await repo.listAcceptedRelations();

  // Featured entries: owner-set flag with fallback to top 5 most recent public entries (20261020-UX-13)
  const candidateFeatured = publicEntries.filter((e: any) => e.featured);
  const featuredList = (candidateFeatured.length > 0 ? candidateFeatured : publicEntries).slice(0, 5);

  // Compute list rows concurrently for only the featured entries (eliminating N+1 serial calls)
  const rows = await Promise.all(
    featuredList.map(async (entry) => {
      const full = await repo.getEntry(entry.id);
      if (!full || !full.currentRevision) return null;
      const rev = full.currentRevision;
      const [facets, annotations, claims] = await Promise.all([
        repo.getFacetsForEntry(entry.id),
        repo.listAnnotationsForRevision(rev.id),
        repo.getClaimsForRevision(rev.id),
      ]);
      const level = computeStructureLevel({
        revision: rev,
        profile: getProfile(entry.profile),
        facets,
        annotations,
        claims,
      });
      const alerts = detectLaterThinking(
        claims.map((c) => ({ ...c, entry_id: entry.id, entry_slug: entry.slug })),
        acceptedRelations
      );

      const bodyText = rev.body_md || (rev as any).body || '';
      const firstSentence = bodyText.replace(/#+\s+[^\n]+\n+/g, '').split('.')[0] + '.';

      return renderEntryRow(entry, {
        basePath: '/work',
        level,
        isHindsight: rev.is_hindsight,
        hasLaterUpdates: alerts.length > 0,
        summary: firstSentence,
      });
    })
  );

  const rowsHtml = rows.filter(Boolean) as string[];

  const cfg = loadConfig();
  const content = `
    <h1 class="visually-hidden">${escapeHtml(cfg.PUBLIC_SITE_NAME)} — ${escapeHtml(cfg.PUBLIC_OWNER_NAME)}</h1>
    <p class="owner-statement">
      ${escapeHtml(cfg.PUBLIC_OWNER_STATEMENT)}
    </p>

    ${strataHtml}

    <section aria-labelledby="featured-heading">
      <div class="pub-row-between pub-mb-md">
        <h2 id="featured-heading" class="pub-m-0">Recent work</h2>
        <a href="/work">View all work (${publicEntries.length}) →</a>
      </div>
      ${rowsHtml.length > 0 ? `
        <ul class="entry-list">
          ${rowsHtml.join('\n')}
        </ul>
      ` : `
        <div class="empty-state pub-empty pub-mt-md">
          <p class="pub-m-0">No entries published yet</p>
          <p class="pub-muted pub-m-0">Technical case studies and architectural decisions will appear here as they are published.</p>
          <div class="pub-row">
            <a href="/timeline" class="btn btn-secondary">Explore Timeline</a>
            <a href="/ask" class="btn">Ask Questions</a>
          </div>
        </div>
      `}
    </section>

    <section class="ask-box" aria-labelledby="home-ask-heading">
      <h2 id="home-ask-heading" class="pub-m-0">Ask about my work</h2>
      <p class="pub-muted">
        Answers come from my own entries, with sources you can open. If I can't back something up, I'll say so.
      </p>
      <form action="/ask" method="GET" class="ask-input-row">
        <input type="text" name="q" class="ask-input" placeholder="e.g., What did you use to replace Redis distributed locks?" aria-label="Ask a question about my work" required />
        <button type="submit" class="btn">Ask</button>
      </form>
    </section>
  `;

  return renderLayout('Home', '/', content);
}
