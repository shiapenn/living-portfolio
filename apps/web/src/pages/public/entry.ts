import {
  computeStructureLevel,
  detectLaterThinking,
  getProfile,
  getStructureLevelDetails,
  isTemporallyValid,
  type Revision,
} from "@living-portfolio/core";
import { adaptDataSource, type WebDataClient } from "../../lib/data-source.js";
import { escapeHtml, parseAsOfDate, renderMarkdownToHtml, sanitizeHttpUrl } from "../../lib/html.js";
import { renderLayout } from "../../layouts/public-shell.js";
import { renderNotFoundPage } from "./not-found.js";
import { formatOutcome, renderStrataDateGlyph } from "../../components/index.js";
import { formatEntryDateLine } from "../../strings.js";

export async function renderEntryDetailPage(
  repo: WebDataClient,
  slug: string,
  requestedView?: string,
  asOfParam?: string | null,
  activeSection: string = '/work'
): Promise<{ status: number; html: string; entry?: any }> {
  repo = adaptDataSource(repo);
  const result = await repo.getEntryBySlug(slug);
  if (!result || !result.currentRevision || result.entry.visibility === 'private') {
    return {
      status: 404,
      html: renderNotFoundPage(`Entry "${escapeHtml(slug)}" not found`, activeSection),
    };
  }

  const { entry } = result;
  const asOfInfo = parseAsOfDate(asOfParam);
  let rev = result.currentRevision;
  let isHistoricalRevision = false;
  let notYetWritten = false;

  if (asOfInfo && asOfInfo.valid) {
    const allRevs = await repo.getRevisions(entry.id);
    const validRevs = allRevs
      .filter((r) => isTemporallyValid(r, asOfInfo.date).valid)
      .sort((a, b) => {
        const da = new Date(a.valid_from || a.written_at).getTime();
        const db = new Date(b.valid_from || b.written_at).getTime();
        return db - da;
      });

    if (validRevs.length > 0) {
      rev = validRevs[0];
      if (rev.id !== result.currentRevision.id) {
        isHistoricalRevision = true;
      }
    } else {
      notYetWritten = true;
    }
  }

  const profile = getProfile(entry.profile);
  const [spans, facets, claims, evidence, annotations, acceptedRelations] = await Promise.all([
    repo.getSpans(rev.id),
    repo.getFacetsForEntry(entry.id),
    repo.getClaimsForRevision(rev.id),
    repo.getEvidenceForEntry(entry.id),
    repo.listAnnotationsForRevision(rev.id),
    repo.listAcceptedRelations(),
  ]);

  const structureLevel = computeStructureLevel({
    revision: rev,
    profile,
    facets,
    annotations,
    claims,
  });

  // §5.3 Confirmed facets only; machine-extracted unconfirmed facets are never shown as facts
  const confirmedFacets = facets.filter((f) => f.status === 'confirmed');
  const contextStripHtml =
    confirmedFacets.length > 0
      ? `<div style="display:flex;flex-wrap:wrap;gap:var(--lp-space-stack-label-to-control);margin:var(--lp-space-stack-snug) 0" aria-label="Confirmed context conditions">
          ${confirmedFacets.map((f) => `<span class="chip"><strong>${escapeHtml(f.key)}:</strong> ${escapeHtml(String(f.value))}</span>`).join('\n          ')}
         </div>`
      : '';

  const asOfQueryPart = asOfInfo && asOfInfo.valid ? `?as_of=${encodeURIComponent(asOfInfo.raw)}` : '';
  const asOfAndPart = asOfInfo && asOfInfo.valid ? `&as_of=${encodeURIComponent(asOfInfo.raw)}` : '';

  // §5.3 Later-thinking banner when an accepted relation supersedes or contradicts a claim here
  const laterAlerts = detectLaterThinking(
    claims.map((c) => ({ ...c, entry_id: entry.id, entry_slug: entry.slug })),
    acceptedRelations
  );
  const laterBannerHtml = laterAlerts
    .map(
      (a) => `<div class="later-thinking-banner" role="note">
        <strong>${escapeHtml(a.message)}</strong>
        <a href="/work/${a.newer_entry_slug}${asOfQueryPart}" style="margin-left:var(--lp-space-inline-icon-text)">Read "${escapeHtml(a.newer_entry_title)}" →</a>
      </div>`
    )
    .join('\n');

  // §5.2 Structured view qualifies when entry reaches L2 or L3, or when explicitly requested
  const qualifiesForStructured = structureLevel === 'L2' || structureLevel === 'L3';
  const activeView = requestedView === 'article' ? 'article' : requestedView === 'structured' ? 'structured' : qualifiesForStructured && entry.view === 'structured' ? 'structured' : 'article';

  let bodyHtml = '';
  if (activeView === 'structured' && profile.roles.length > 0) {
    if (spans.length > 0) {
      // Sort spans by start_off (or ordinal) to preserve document order
      const sortedSpans = [...spans].sort((a, b) => {
        const offA = a.start_off ?? a.ordinal ?? 0;
        const offB = b.start_off ?? b.ordinal ?? 0;
        return offA - offB;
      });

      interface RenderBlock {
        roleId?: string;
        roleLabel?: string;
        texts: string[];
      }

      const blocks: RenderBlock[] = [];

      for (const span of sortedSpans) {
        const acceptedAnn = annotations.find(
          (a) => a.span_id === span.id && a.status === 'accepted'
        );
        const roleId = acceptedAnn ? acceptedAnn.role : undefined;
        const roleDef = roleId
          ? profile.roles.find((r) => r.id === roleId) || {
              id: roleId,
              label: roleId.charAt(0).toUpperCase() + roleId.slice(1),
            }
          : undefined;

        const lastBlock = blocks[blocks.length - 1];
        if (lastBlock && lastBlock.roleId === roleId) {
          lastBlock.texts.push(span.text_exact);
        } else {
          blocks.push({
            roleId,
            roleLabel: roleDef?.label,
            texts: [span.text_exact],
          });
        }
      }

      const renderedSections = blocks.map((block) => {
        const combinedText = block.texts.map((t) => renderMarkdownToHtml(t)).join('\n');
        if (block.roleId && block.roleLabel) {
          const roleClass = `role-${escapeHtml(block.roleId)}`;
          return `<section class="role-section ${roleClass}" data-role="${escapeHtml(block.roleId)}">
            <h2 class="role-marker ${roleClass}">${escapeHtml(block.roleLabel)}</h2>
            <div class="reading-column">${combinedText}</div>
          </section>`;
        }
        return `<div class="unlabeled-span reading-column" style="margin-bottom:var(--lp-space-stack-group)">${combinedText}</div>`;
      });

      bodyHtml = renderedSections.join('\n');
    } else {
      bodyHtml = `<div class="reading-column">${renderMarkdownToHtml(rev.body_md || (rev as any).body || '')}</div>`;
    }
  } else {
    bodyHtml = `<div class="reading-column">${renderMarkdownToHtml(rev.body_md || (rev as any).body || '')}</div>`;
  }

  const happenedDate = (rev.valid_from || rev.written_at).slice(0, 10);
  const writtenDate = rev.written_at.slice(0, 10);
  const dateGlyphHtml = renderStrataDateGlyph(rev.valid_from, rev.written_at, rev.is_hindsight);
  const dateDisplay = formatEntryDateLine(
    rev.valid_from,
    rev.written_at,
    rev.is_hindsight,
    (entry as any).lang || 'en-US'
  );

  const evidenceHtml =
    evidence.length > 0
      ? evidence
          .map((ev) => {
            const safeUrl = sanitizeHttpUrl(ev.url);
            if (!safeUrl) return '';
            const linkMarkup = `<a href="${escapeHtml(safeUrl)}" target="_blank" rel="noopener">${escapeHtml(ev.url || ev.kind)}</a>`;
            return `<div style="margin-bottom:var(--lp-space-stack-label-to-control)">
              ${linkMarkup}
              ${
                ev.verified_at
                  ? `<div class="chip" style="margin-top:var(--lp-space-stack-compact);border-color:var(--lp-color-passage-outcome)" title="Verification proves the artifact exists and who authored it; it does not prove the surrounding narrative fits your situation.">✓ Verified (${escapeHtml(ev.verification?.label || 'artifact')})</div>`
                  : ''
              }
            </div>`;
          })
          .filter(Boolean)
          .join('\n') || '<p style="color:var(--text-muted);margin:0">No links or files attached to this entry.</p>'
      : '<p style="color:var(--text-muted);margin:0">No links or files attached to this entry.</p>';

  const claimsHtml =
    claims.filter((c) => c.status === 'accepted').length > 0
      ? claims
          .filter((c) => c.status === 'accepted')
          .map(
            (c) => `<div class="claim-item">
              <div class="claim-meta">${escapeHtml(c.kind.charAt(0).toUpperCase() + c.kind.slice(1).toLowerCase())}. Outcome: <strong>${escapeHtml(formatOutcome(c.outcome_status) || 'Unknown')}</strong></div>
              <div class="claim-text">${escapeHtml(c.text)}</div>
            </div>`
          )
          .join('\n')
      : '';

  let asOfBannerHtml = '';
  if (asOfInfo) {
    if (!asOfInfo.valid) {
      asOfBannerHtml = `<div class="as-of-banner" role="alert" style="position:sticky;top:0;z-index:var(--lp-z-sticky);margin-bottom:var(--lp-space-stack-field-to-field);border-left-color:var(--lp-color-passage-friction);background:var(--surface-raised)">
        <span><strong>Invalid as-of date ("${escapeHtml(asOfInfo.raw)}")</strong> — Showing present revision.</span>
        <a href="/work/${entry.slug}">Reset to present</a>
      </div>`;
    } else if (notYetWritten) {
      asOfBannerHtml = `<div class="as-of-banner" role="status" style="position:sticky;top:0;z-index:var(--lp-z-sticky);margin-bottom:var(--lp-space-stack-field-to-field);background:var(--surface-raised);border-left:var(--lp-border-banner-rule) solid var(--accent)">
        <span><strong>Viewing as of ${escapeHtml(asOfInfo.raw.slice(0, 10))}</strong> — This entry had not yet been recorded as of this date. Showing original revision from ${escapeHtml(result.currentRevision.written_at.slice(0, 10))}.</span>
        <div style="display:flex;gap:var(--lp-space-stack-snug);margin-top:var(--lp-space-stack-compact)">
          <a href="/work/${entry.slug}">View present revision</a>
          <a href="/timeline?as_of=${encodeURIComponent(asOfInfo.raw)}">Back to timeline</a>
        </div>
      </div>`;
    } else {
      asOfBannerHtml = `<div class="as-of-banner" role="status" style="position:sticky;top:0;z-index:var(--lp-z-sticky);margin-bottom:var(--lp-space-stack-field-to-field);background:var(--surface-raised);border-left:var(--lp-border-banner-rule) solid var(--accent)">
        <span><strong>Viewing as of ${escapeHtml(asOfInfo.raw.slice(0, 10))}</strong> — Showing the revision active as of this date${isHistoricalRevision ? ' (historical revision)' : ' (latest revision)'}.</span>
        <div style="display:flex;gap:var(--lp-space-stack-snug);margin-top:var(--lp-space-stack-compact)">
          <a href="/work/${entry.slug}">View present revision</a>
          <a href="/timeline?as_of=${encodeURIComponent(asOfInfo.raw)}">Back to timeline</a>
        </div>
      </div>`;
    }
  }

  const content = `
    <article${(entry as any).lang ? ` lang="${escapeHtml((entry as any).lang)}"` : ''}>
      ${asOfBannerHtml}
      <header style="margin-bottom:var(--lp-space-stack-group);border-bottom:var(--lp-border-hairline) solid var(--rule);padding-bottom:var(--lp-space-inset-section)">
        <div style="display:flex;justify-content:space-between;align-items:baseline;flex-wrap:wrap;gap:var(--lp-space-stack-snug)">
          <h1 style="font-family:var(--lp-font-family-reading);font-size:var(--lp-font-size-30);margin:0">${escapeHtml(entry.title)}</h1>
          <div style="display:flex;gap:var(--lp-space-stack-label-to-control)">
            ${qualifiesForStructured ? `<span class="chip">Structured</span>` : ''}
            ${
              qualifiesForStructured
                ? `<a href="/work/${entry.slug}?view=${activeView === 'structured' ? 'article' : 'structured'}${asOfAndPart}" class="btn btn-secondary" data-action="view-switch" style="padding:var(--lp-space-inset-compact) var(--lp-space-inset-card-sm);min-height:var(--lp-size-hit-area);display:inline-flex;align-items:center;font-size:var(--lp-font-size-14);text-decoration:none">${activeView === 'structured' ? 'Read as one article' : 'Read by section'}</a>`
                : ''
            }
          </div>
        </div>
        <p class="entry-date-line tabular-nums" style="color:var(--text-muted);margin:var(--lp-space-stack-label-to-control) 0 var(--lp-space-stack-label-to-control);font-size:var(--lp-font-size-14);display:flex;align-items:center;gap:var(--lp-space-stack-compact)">${dateGlyphHtml}<span>${escapeHtml(dateDisplay)}</span></p>
        ${contextStripHtml}
      </header>

      ${laterBannerHtml}

      <div class="entry-layout">
        <div>
          ${bodyHtml}
        </div>
        <aside class="margin-rail" aria-label="Entry evidence, claims, and scoped ask">
          <h3 style="margin:0 0 var(--lp-space-stack-label-to-control);font-size:var(--lp-font-size-14);font-family:var(--lp-font-family-reading)">Evidence</h3>
          ${evidenceHtml}

          ${claimsHtml ? `<h3 style="margin:var(--lp-space-stack-group) 0 var(--lp-space-stack-label-to-control);font-size:var(--lp-font-size-14);font-family:var(--lp-font-family-reading)">Conclusions</h3>${claimsHtml}` : ''}

          <div style="margin-top:var(--lp-space-stack-group);padding-top:var(--lp-space-inset-section);border-top:var(--lp-border-hairline) solid var(--rule)">
            <h3 style="margin:0 0 var(--lp-space-stack-label-to-control);font-size:var(--lp-font-size-14);font-family:var(--lp-font-family-reading)">Ask about this entry</h3>
            <form action="/ask" method="GET">
              <input type="hidden" name="scope" value="${escapeHtml(entry.slug)}" />
              ${asOfInfo && asOfInfo.valid ? `<input type="hidden" name="as_of" value="${escapeHtml(asOfInfo.raw)}" />` : ''}
              <input type="text" name="q" class="ask-input" style="width:100%;margin-bottom:var(--lp-space-stack-label-to-control)" placeholder="What would you like to know?" aria-label="Ask about this entry" required />
              <button type="submit" class="btn" style="width:100%">Ask</button>
            </form>
          </div>
        </aside>
      </div>
    </article>
  `;

  return { status: 200, html: renderLayout(entry.title, activeSection, content), entry };
}
