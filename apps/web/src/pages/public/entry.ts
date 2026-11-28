import {
  computeStructureLevel,
  detectLaterThinking,
  getProfile,
  getStructureLevelDetails,
  isTemporallyValid,
  type Revision,
} from "@living-portfolio/core";
import { adaptDataSource, type WebDataClient } from "../../lib/data-source.js";
import { loadConfig, parseEmbedAllowedHosts } from "@living-portfolio/config";
import { escapeHtml, parseAsOfDate, renderMarkdownToHtml, sanitizeHttpUrl } from "../../lib/html.js";
import { extractInternalMediaIds, type MediaDimension } from "../../markdown-media.js";
import { renderLayout } from "../../layouts/public-shell.js";
import { renderNotFoundPage } from "./not-found.js";
import { formatOutcome, renderStrataDateGlyph } from "../../components/index.js";
import { formatEntryDateLine } from "../../strings.js";

export async function renderEntryDetailPage(
  repo: WebDataClient,
  slug: string,
  requestedView?: string,
  asOfParam?: string | null,
  activeSection: string = '/work',
  requestedLang?: string | null
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
      ? `<div class="pub-row" aria-label="Confirmed context conditions">
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
        <a href="/work/${a.newer_entry_slug}${asOfQueryPart}" class="pub-ml-sm">Read "${escapeHtml(a.newer_entry_title)}" →</a>
      </div>`
    )
    .join('\n');

  // §5.2 Structured view qualifies when entry reaches L2 or L3, or when explicitly requested
  const qualifiesForStructured = structureLevel === 'L2' || structureLevel === 'L3';
  const activeView = requestedView === 'article' ? 'article' : requestedView === 'structured' ? 'structured' : qualifiesForStructured && entry.view === 'structured' ? 'structured' : 'article';

  // WP-18.4: Resolve stored width/height for referenced /api/media/:id images to prevent CLS
  const rawBodyMd = rev.body_md || (rev as any).body || '';
  const mediaDimensions: Record<string, MediaDimension> = { ...((result as any).mediaDimensions || {}) };
  const referencedMediaIds = extractInternalMediaIds(rawBodyMd);
  if (referencedMediaIds.length > 0 && typeof (repo as any).getMedia === 'function') {
    await Promise.all(
      referencedMediaIds.map(async (mid) => {
        if (mediaDimensions[mid]) return;
        try {
          const asset = await (repo as any).getMedia(mid);
          if (asset && typeof asset.width === 'number' && typeof asset.height === 'number' && asset.width > 0 && asset.height > 0) {
            mediaDimensions[mid] = { width: asset.width, height: asset.height };
          }
        } catch {}
      })
    );
  }
  const mdOpts = {
    mediaDimensions,
    embedAllowedHosts: parseEmbedAllowedHosts(loadConfig().MEDIA_EMBED_ALLOWED_HOSTS),
  };

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
        const combinedText = block.texts.map((t) => renderMarkdownToHtml(t, mdOpts)).join('\n');
        if (block.roleId && block.roleLabel) {
          const roleClass = `role-${escapeHtml(block.roleId)}`;
          return `<section class="role-section ${roleClass}" data-role="${escapeHtml(block.roleId)}">
            <h2 class="role-marker ${roleClass}">${escapeHtml(block.roleLabel)}</h2>
            <div class="reading-column">${combinedText}</div>
          </section>`;
        }
        return `<div class="unlabeled-span reading-column pub-mb-md">${combinedText}</div>`;
      });

      bodyHtml = renderedSections.join('\n');
    } else {
      bodyHtml = `<div class="reading-column">${renderMarkdownToHtml(rawBodyMd, mdOpts)}</div>`;
    }
  } else {
    bodyHtml = `<div class="reading-column">${renderMarkdownToHtml(rawBodyMd, mdOpts)}</div>`;
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
            const rawEvUrl = typeof ev.url === 'string' ? ev.url.replace(/["']+$/, '') : ev.url;
            const safeUrl = sanitizeHttpUrl(rawEvUrl);
            if (!safeUrl) return '';
            const linkMarkup = `<a href="${escapeHtml(safeUrl)}" target="_blank" rel="noopener">${escapeHtml(rawEvUrl || ev.kind)}</a>`;
            return `<div class="pub-mb-md">
              ${linkMarkup}
              ${
                ev.verified_at
                  ? `<div class="chip pub-mt-md" title="Verification proves the artifact exists and who authored it; it does not prove the surrounding narrative fits your situation.">✓ Verified (${escapeHtml(ev.verification?.label || 'artifact')})</div>`
                  : ''
              }
            </div>`;
          })
          .filter(Boolean)
          .join('\n') || '<p class="pub-muted pub-m-0">No links or files attached to this entry.</p>'
      : '<p class="pub-muted pub-m-0">No links or files attached to this entry.</p>';

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
      asOfBannerHtml = `<div class="as-of-banner as-of-banner-sticky pub-mb-md" role="alert">
        <span><strong>Invalid as-of date ("${escapeHtml(asOfInfo.raw)}")</strong> — Showing present revision.</span>
        <a href="/work/${entry.slug}">Reset to present</a>
      </div>`;
    } else if (notYetWritten) {
      asOfBannerHtml = `<div class="as-of-banner as-of-banner-sticky pub-mb-md" role="status">
        <span><strong>Viewing as of ${escapeHtml(asOfInfo.raw.slice(0, 10))}</strong> — This entry had not yet been recorded as of this date. Showing original revision from ${escapeHtml(result.currentRevision.written_at.slice(0, 10))}.</span>
        <div class="pub-row pub-mt-md">
          <a href="/work/${entry.slug}">View present revision</a>
          <a href="/timeline?as_of=${encodeURIComponent(asOfInfo.raw)}">Back to timeline</a>
        </div>
      </div>`;
    } else {
      asOfBannerHtml = `<div class="as-of-banner as-of-banner-sticky pub-mb-md" role="status">
        <span><strong>Viewing as of ${escapeHtml(asOfInfo.raw.slice(0, 10))}</strong> — Showing the revision active as of this date${isHistoricalRevision ? ' (historical revision)' : ' (latest revision)'}.</span>
        <div class="pub-row pub-mt-md">
          <a href="/work/${entry.slug}">View present revision</a>
          <a href="/timeline?as_of=${encodeURIComponent(asOfInfo.raw)}">Back to timeline</a>
        </div>
      </div>`;
    }
  }

  const zhSampleHtml =
    requestedLang === 'zh'
      ? `<section class="pub-section pub-zh-sample" lang="zh" aria-label="中文排版示例">
          <h2>中文排版与阅读节奏</h2>
          <p>安静的编排风格依靠留白、细线与清晰的层级关系来组织信息，而不是依赖装饰性的色彩或沉重的卡片边框。在中文长文阅读中，合理的行高与字距能够让视线平稳推进，避免拥挤感。</p>
          <blockquote>「好的设计系统应当退居内容之后，让文字、证据与时间线本身成为页面的主角。」</blockquote>
          <p>当内容包含<em>强调语义</em>或技术术语（如 <code>OKLCH</code> 与 <code>WOFF2</code>）时，排版系统会保持端正的字形，不施加倾斜变形，并自动匹配合适的中文字体回退栈。</p>
        </section>`
      : '';

  const content = `
    <article${requestedLang ? ` lang="${escapeHtml(requestedLang)}"` : (entry as any).lang ? ` lang="${escapeHtml((entry as any).lang)}"` : ''}>
      ${asOfBannerHtml}
      <header class="pub-header-rule pub-mb-md">
        <div class="pub-row-between">
          <h1 class="pub-m-0">${escapeHtml(entry.title)}</h1>
          <div class="pub-row">
            ${qualifiesForStructured ? `<span class="chip">Structured</span>` : ''}
            ${
              qualifiesForStructured
                ? `<a href="/work/${entry.slug}?view=${activeView === 'structured' ? 'article' : 'structured'}${asOfAndPart}" class="btn btn-secondary" data-action="view-switch">${activeView === 'structured' ? 'Read as one article' : 'Read by section'}</a>`
                : ''
            }
          </div>
        </div>
        <p class="entry-date-line tabular-nums pub-row pub-muted">${dateGlyphHtml}<span>${escapeHtml(dateDisplay)}</span></p>
        ${contextStripHtml}
      </header>

      ${laterBannerHtml}

      <div class="entry-layout">
        <div>
          ${bodyHtml}
          ${zhSampleHtml}
        </div>
        <aside class="margin-rail" aria-label="Entry evidence, claims, and scoped ask">
          <h3 class="pub-m-0">Evidence</h3>
          ${evidenceHtml}

          ${claimsHtml ? `<h3>Conclusions</h3>${claimsHtml}` : ''}

          <div class="pub-section pub-mt-md">
            <h3 class="pub-m-0">Ask about this entry</h3>
            <form action="/ask" method="GET">
              <input type="hidden" name="scope" value="${escapeHtml(entry.slug)}" />
              ${asOfInfo && asOfInfo.valid ? `<input type="hidden" name="as_of" value="${escapeHtml(asOfInfo.raw)}" />` : ''}
              <input type="text" name="q" class="ask-input pub-btn-full pub-mb-md" placeholder="What would you like to know?" aria-label="Ask about this entry" required />
              <button type="submit" class="btn pub-btn-full">Ask</button>
            </form>
          </div>
        </aside>
      </div>
    </article>
  `;

  return { status: 200, html: renderLayout(entry.title, activeSection, content), entry };
}
