import { loadConfig } from '@living-portfolio/config';
import {
  computeStructureLevel,
  detectLaterThinking,
  generateGapQuestions,
  getProfile,
  getStructureLevelDetails,
  isTemporallyValid,
} from '@living-portfolio/core';
import type { IPortfolioRepository } from '@living-portfolio/db';
import { STRATA_DESIGN_SYSTEM_CSS } from './styles.js';

export const ALPHA_WARNING_TEXT =
  'Alpha version with known defects. Do not use in production or input real sensitive data.';

function escapeHtml(str: string): string {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function sanitizeHttpUrl(rawUrl?: string | null): string | null {
  if (!rawUrl || typeof rawUrl !== 'string') return null;
  const trimmed = rawUrl.trim();
  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) {
    return trimmed;
  }
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return parsed.toString();
    }
    return null;
  } catch {
    return null;
  }
}

function renderMarkdownToHtml(md: string): string {
  return md
    .split(/\n\s*\n/)
    .map((block) => {
      const trimmed = block.trim();
      if (!trimmed) return '';
      if (trimmed.startsWith('## ')) {
        return `<h2>${escapeHtml(trimmed.slice(3))}</h2>`;
      }
      if (trimmed.startsWith('# ')) {
        return `<h2>${escapeHtml(trimmed.slice(2))}</h2>`;
      }
      return `<p>${escapeHtml(trimmed)}</p>`;
    })
    .join('\n');
}

function renderLayout(title: string, activePath: string, mainContentHtml: string): string {
  const cfg = loadConfig();
  const navItems = [
    { href: '/work', label: 'Work' },
    { href: '/writing', label: 'Writing' },
    { href: '/build', label: 'Build' },
    { href: '/timeline', label: 'Timeline' },
    { href: '/ask', label: 'Ask' },
    { href: '/now', label: 'Now' },
    { href: '/about', label: 'About' },
    { href: '/admin', label: 'Admin' },
  ];

  const navHtml = navItems
    .map(
      (item) =>
        `<a href="${item.href}"${activePath.startsWith(item.href) ? ' aria-current="page"' : ''}>${item.label}</a>`
    )
    .join('\n          ');

  const safeLogoUrl = sanitizeHttpUrl(cfg.PUBLIC_SITE_LOGO_URL);
  const brandHtml = safeLogoUrl
    ? `<img src="${escapeHtml(safeLogoUrl)}" alt="${escapeHtml(cfg.PUBLIC_OWNER_NAME)}" style="height:24px;vertical-align:middle;margin-right:8px" />${escapeHtml(cfg.PUBLIC_OWNER_NAME)}`
    : escapeHtml(cfg.PUBLIC_OWNER_NAME);

  const stagingBannerHtml =
    cfg.DEPLOYMENT_CLASS === 'staging'
      ? `<div class="as-of-banner" data-banner="staging-synthetic-only" role="status" style="margin:0;border-radius:0;justify-content:center"><strong>Staging: synthetic data only.</strong></div>`
      : '';

  const unofficialForkSlotHtml = cfg.PUBLIC_UNOFFICIAL_FORK_NOTICE
    ? `<div class="unofficial-fork-slot" data-slot="unofficial-fork-notice" style="margin-top:6px;font-size:13px;color:var(--text-muted)">${escapeHtml(cfg.PUBLIC_UNOFFICIAL_FORK_NOTICE)}</div>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)} — ${escapeHtml(cfg.PUBLIC_SITE_NAME)}</title>
  <style>${STRATA_DESIGN_SYSTEM_CSS}</style>
</head>
<body>
  <a href="#main-content" class="skip-link">Skip to main content</a>
  ${stagingBannerHtml}
  <header class="site-header">
    <nav class="site-nav" aria-label="Primary navigation">
      <a href="/" class="site-brand">${brandHtml}</a>
      <div class="nav-links">
        ${navHtml}
        <button type="button" class="theme-toggle-btn" id="theme-toggle" aria-label="Toggle color theme">◐ Theme</button>
      </div>
    </nav>
  </header>
  <main class="site-main" id="main-content">
    ${mainContentHtml}
  </main>
  <footer class="site-footer" style="max-width:var(--layout-max);margin:48px auto 24px;padding:16px 24px;border-top:1px solid var(--rule);font-size:14px;color:var(--text-muted)">
    <div>${escapeHtml(cfg.PUBLIC_SITE_FOOTER_TEXT)}</div>
    ${unofficialForkSlotHtml}
  </footer>
  <script>
    (function() {
      const btn = document.getElementById('theme-toggle');
      const saved = localStorage.getItem('strata-theme');
      if (saved) document.documentElement.setAttribute('data-theme', saved);
      if (btn) {
        btn.addEventListener('click', function() {
          const current = document.documentElement.getAttribute('data-theme');
          const next = current === 'dark' ? 'light' : 'dark';
          document.documentElement.setAttribute('data-theme', next);
          localStorage.setItem('strata-theme', next);
        });
      }
    })();
  </script>
</body>
</html>`;
}

export async function renderStrataTimelineSection(
  repo: IPortfolioRepository,
  asOfParam?: string | null
): Promise<{ html: string; visibleSlugs: Set<string> | null }> {
  const entries = await repo.listEntries({ visibility: ['public'] });
  const buckets: Record<string, { yearMonth: string; count: number; titles: string[]; slugs: string[]; profiles: string[] }> = {};
  let visibleSlugs: Set<string> | null = null;

  if (asOfParam) {
    visibleSlugs = new Set<string>();
  }

  for (const entry of entries) {
    const full = await repo.getEntry(entry.id);
    if (!full || !full.currentRevision) continue;
    const rev = full.currentRevision;
    const d = rev.valid_from ? new Date(rev.valid_from) : new Date(rev.written_at);
    const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

    if (!buckets[ym]) {
      buckets[ym] = { yearMonth: ym, count: 0, titles: [], slugs: [], profiles: [] };
    }
    buckets[ym].count++;
    buckets[ym].titles.push(entry.title);
    buckets[ym].slugs.push(entry.slug);
    buckets[ym].profiles.push(entry.profile);

    if (asOfParam && visibleSlugs) {
      const check = isTemporallyValid(rev, new Date(asOfParam));
      if (check.valid) visibleSlugs.add(entry.slug);
    }
  }

  const sorted = Object.values(buckets).sort((a, b) => a.yearMonth.localeCompare(b.yearMonth));

  const asOfBanner = asOfParam
    ? `<div class="as-of-banner" role="status">
         <span><strong>Viewing as of ${escapeHtml(asOfParam.slice(0, 7))}</strong> — Later entries and hindsight retrospectives written after this date are excluded.</span>
         <a href="/timeline">Reset to present</a>
       </div>`
    : '';

  const bandsHtml = sorted
    .map((b) => {
      const heightPx = Math.min(110, 44 + b.count * 24);
      const dimmed = asOfParam ? b.yearMonth > asOfParam.slice(0, 7) : false;
      return `<button type="button" class="strata-band" style="height:${heightPx}px" data-ym="${b.yearMonth}" data-slug="${b.slugs[0]}" data-dimmed="${dimmed}" onclick="window.location.href='/timeline?as_of=${b.yearMonth}-28T23:59:59Z'" aria-label="${b.yearMonth}: ${b.count} entries (${b.profiles.join(', ')})">
        <div style="font-weight:700;font-size:13px">${b.yearMonth}</div>
        <div style="font-size:12px;color:var(--text-muted)">${b.count} layer${b.count > 1 ? 's' : ''}</div>
      </button>`;
    })
    .join('\n      ');

  const textListHtml = sorted
    .map((b) => {
      const visibleIndices = b.slugs
        .map((s, idx) => (!visibleSlugs || visibleSlugs.has(s) ? idx : -1))
        .filter((idx) => idx !== -1);
      if (visibleIndices.length === 0) return '';
      return `<li><strong>${b.yearMonth}</strong> (${visibleIndices.length}): ${visibleIndices
        .map((i) => `<a href="/work/${b.slugs[i]}">${escapeHtml(b.titles[i])}</a>`)
        .join(', ')}</li>`;
    })
    .filter(Boolean)
    .join('\n        ');

  const html = `<section class="strata-section" aria-labelledby="strata-heading">
    <div class="strata-header">
      <div>
        <h2 id="strata-heading" style="margin:0;font-size:18px;font-family:var(--font-reading)">Strata timeline (2021–2026)</h2>
        <span style="font-size:14px;color:var(--text-muted)">Select any layer to scrub the knowledge graph to that point in time.</span>
      </div>
      <form method="GET" action="/timeline" style="display:flex;gap:8px;align-items:center">
        <label for="as-of-input" style="font-size:14px">Time-travel as of:</label>
        <input id="as-of-input" name="as_of" type="date" value="${asOfParam ? escapeHtml(asOfParam.slice(0, 10)) : '2026-10-19'}" class="ask-input" style="padding:4px 8px;width:auto" />
        <button type="submit" class="btn btn-secondary" style="min-height:34px;padding:4px 12px">Apply</button>
      </form>
    </div>
    ${asOfBanner}
    <div class="strata-layers" role="region" aria-label="Chronological strata layers">
      ${bandsHtml}
    </div>
    <div class="strata-legend">
      <span>■ Case study</span>
      <span>◆ Decision record</span>
      <span>▲ Design project</span>
      <span>Keyboard: Left/Right arrows move by layer, Enter time-travels to layer</span>
    </div>
    <details style="margin-top:12px;font-size:14px">
      <summary style="cursor:pointer;color:var(--text-muted)">Text-equivalent accessible timeline list</summary>
      <ul style="margin-top:8px">
        ${textListHtml}
      </ul>
    </details>
  </section>`;

  return { html, visibleSlugs };
}

export async function renderHomePage(repo: IPortfolioRepository): Promise<string> {
  const { html: strataHtml } = await renderStrataTimelineSection(repo);
  const publicEntries = await repo.listEntries({ visibility: ['public'] });
  const acceptedRelations = await repo.listAcceptedRelations();

  const rowsHtml: string[] = [];
  for (const entry of publicEntries) {
    const full = await repo.getEntry(entry.id);
    if (!full || !full.currentRevision) continue;
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

    const dateLabel = (rev.valid_from || rev.written_at).slice(0, 10);
    const firstSentence = rev.body_md.replace(/#+\s+[^\n]+\n+/g, '').split('.')[0] + '.';

    rowsHtml.push(`<li class="entry-row">
      <div class="entry-row-top">
        <a href="/work/${entry.slug}" class="entry-title-link">${escapeHtml(entry.title)}</a>
        <div class="entry-meta">
          <time datetime="${dateLabel}">${dateLabel}</time>
          <span class="chip">${level} · ${escapeHtml(entry.profile)}</span>
          ${rev.is_hindsight ? '<span class="chip">Hindsight retrospective</span>' : ''}
          ${alerts.length > 0 ? '<span class="chip" style="border-color:var(--status-warn)">Updated later</span>' : ''}
        </div>
      </div>
      <div style="color:var(--text-muted);max-width:65ch">${escapeHtml(firstSentence)}</div>
    </li>`);
  }

  const cfg = loadConfig();
  const content = `
    <h1 class="visually-hidden">${escapeHtml(cfg.PUBLIC_SITE_NAME)} — ${escapeHtml(cfg.PUBLIC_OWNER_NAME)}</h1>
    <p class="owner-statement">
      ${escapeHtml(cfg.PUBLIC_OWNER_STATEMENT)}
    </p>

    ${strataHtml}

    <section aria-labelledby="featured-heading">
      <h2 id="featured-heading" style="font-family:var(--font-reading);font-size:21px;margin-bottom:12px">Recent and featured work</h2>
      <ul class="entry-list">
        ${rowsHtml.join('\n')}
      </ul>
    </section>

    <section class="ask-box" aria-labelledby="home-ask-heading">
      <h2 id="home-ask-heading" style="margin:0;font-family:var(--font-reading);font-size:21px">Ask about my work</h2>
      <p style="margin:4px 0 0;color:var(--text-muted);font-size:15px">
        Answered from my actual records with inline citations, scope verification, and explicit uncertainty.
      </p>
      <form action="/ask" method="GET" class="ask-input-row">
        <input type="text" name="q" class="ask-input" placeholder="e.g., What did you use to replace Redis distributed locks?" aria-label="Ask a question about my work" required />
        <button type="submit" class="btn">Ask records</button>
      </form>
    </section>
  `;

  return renderLayout('Home', '/', content);
}

export async function renderEntryDetailPage(
  repo: IPortfolioRepository,
  slug: string,
  requestedView?: string
): Promise<{ status: number; html: string }> {
  const result = await repo.getEntryBySlug(slug);
  if (!result || !result.currentRevision || result.entry.visibility === 'private') {
    return {
      status: 404,
      html: renderLayout('Entry not found', '/work', `<p>Entry not found. <a href="/work">Browse all work</a>.</p>`),
    };
  }

  const { entry, currentRevision: rev } = result;
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
      ? `<div style="display:flex;flex-wrap:wrap;gap:8px;margin:12px 0" aria-label="Confirmed context conditions">
          ${confirmedFacets.map((f) => `<span class="chip"><strong>${escapeHtml(f.key)}:</strong> ${escapeHtml(String(f.value))}</span>`).join('\n          ')}
         </div>`
      : '';

  // §5.3 Later-thinking banner when an accepted relation supersedes or contradicts a claim here
  const laterAlerts = detectLaterThinking(
    claims.map((c) => ({ ...c, entry_id: entry.id, entry_slug: entry.slug })),
    acceptedRelations
  );
  const laterBannerHtml = laterAlerts
    .map(
      (a) => `<div class="later-thinking-banner" role="note">
        <strong>${escapeHtml(a.message)}</strong>
        <a href="/work/${a.newer_entry_slug}" style="margin-left:8px">Read "${escapeHtml(a.newer_entry_title)}" →</a>
      </div>`
    )
    .join('\n');

  // §5.2 Structured view qualifies when entry reaches L2 or L3
  const qualifiesForStructured = structureLevel === 'L2' || structureLevel === 'L3';
  const activeView = requestedView === 'article' ? 'article' : qualifiesForStructured && entry.view === 'structured' ? 'structured' : 'article';

  let bodyHtml = '';
  if (activeView === 'structured' && profile.roles.length > 0) {
    const sectionsHtml = profile.roles
      .map((roleDef) => {
        const matchingSpanIds = new Set(
          annotations.filter((a) => a.role === roleDef.id && a.status === 'accepted').map((a) => a.span_id)
        );
        const matchingSpans = spans.filter((s) => matchingSpanIds.has(s.id));
        const sectionText =
          matchingSpans.length > 0
            ? matchingSpans.map((s) => renderMarkdownToHtml(s.text_exact)).join('\n')
            : '';
        if (!sectionText) return '';
        return `<section style="margin-bottom:24px;padding-left:16px;border-left:3px solid var(--role-${roleDef.id}, var(--accent))">
          <h2 style="font-size:18px;margin:0 0 8px 0" title="Schema role: ${roleDef.id}">${escapeHtml(roleDef.label)}</h2>
          <div class="reading-column">${sectionText}</div>
        </section>`;
      })
      .filter(Boolean)
      .join('\n');

    bodyHtml = sectionsHtml || `<div class="reading-column">${renderMarkdownToHtml(rev.body_md)}</div>`;
  } else {
    bodyHtml = `<div class="reading-column">${renderMarkdownToHtml(rev.body_md)}</div>`;
  }

  const happenedDate = (rev.valid_from || rev.written_at).slice(0, 10);
  const writtenDate = rev.written_at.slice(0, 10);
  const dateDisplay =
    happenedDate !== writtenDate
      ? `Happened ${happenedDate} · Written ${writtenDate}${rev.is_hindsight ? ', looking back (hindsight)' : ''}`
      : `Happened & written ${happenedDate}`;

  const evidenceHtml =
    evidence.length > 0
      ? evidence
          .map((ev) => {
            const safeUrl = sanitizeHttpUrl(ev.url);
            const linkMarkup = safeUrl
              ? `<a href="${escapeHtml(safeUrl)}" target="_blank" rel="noopener">${escapeHtml(ev.url || ev.kind)}</a>`
              : `<span class="chip" data-unsafe-url="blocked">Blocked non-HTTP(S) URL (${escapeHtml(ev.kind)})</span>`;
            return `<div style="margin-bottom:8px">
              ${linkMarkup}
              ${
                ev.verified_at
                  ? `<div class="chip" style="margin-top:4px;border-color:var(--role-outcome)" title="Verification proves the artifact exists and who authored it; it does not prove the surrounding narrative fits your situation.">✓ Verified (${escapeHtml(ev.verification?.label || 'artifact')})</div>`
                  : ''
              }
            </div>`;
          })
          .join('\n')
      : '<p style="color:var(--text-muted);margin:0">No external artifacts attached.</p>';

  const claimsHtml =
    claims.filter((c) => c.status === 'accepted').length > 0
      ? claims
          .filter((c) => c.status === 'accepted')
          .map(
            (c) => `<div style="margin-bottom:8px;padding:8px;border:1px solid var(--rule);background:var(--surface-raised)">
              <div style="font-size:12px;color:var(--text-muted)">${escapeHtml(c.kind.toUpperCase())} · Outcome: <strong>${escapeHtml(c.outcome_status || 'unknown')}</strong></div>
              <div style="font-size:14px;margin-top:4px">${escapeHtml(c.text)}</div>
            </div>`
          )
          .join('\n')
      : '';

  const content = `
    <article>
      <header style="margin-bottom:24px;border-bottom:1px solid var(--rule);padding-bottom:16px">
        <div style="display:flex;justify-content:space-between;align-items:baseline;flex-wrap:wrap;gap:12px">
          <h1 style="font-family:var(--font-reading);font-size:30px;margin:0">${escapeHtml(entry.title)}</h1>
          <div style="display:flex;gap:8px">
            <span class="chip">Structure: ${structureLevel}</span>
            ${
              qualifiesForStructured
                ? `<a href="/work/${entry.slug}?view=${activeView === 'structured' ? 'article' : 'structured'}" class="btn btn-secondary" style="padding:4px 10px;min-height:30px;font-size:13px;text-decoration:none">Switch to ${activeView === 'structured' ? 'Article' : 'Structured'} view</a>`
                : ''
            }
          </div>
        </div>
        <p style="color:var(--text-muted);margin:8px 0 0;font-size:15px">${escapeHtml(dateDisplay)}</p>
        ${contextStripHtml}
      </header>

      ${laterBannerHtml}

      <div class="entry-layout">
        <div>
          ${bodyHtml}
        </div>
        <aside class="margin-rail" aria-label="Entry evidence, claims, and scoped ask">
          <h3 style="margin:0 0 8px;font-size:15px">Evidence</h3>
          ${evidenceHtml}

          ${claimsHtml ? `<h3 style="margin:20px 0 8px;font-size:15px">Key claims & outcomes</h3>${claimsHtml}` : ''}

          <div style="margin-top:24px;padding-top:16px;border-top:1px solid var(--rule)">
            <h3 style="margin:0 0 8px;font-size:15px">Ask about this entry</h3>
            <form action="/ask" method="GET">
              <input type="hidden" name="scope" value="${escapeHtml(entry.slug)}" />
              <input type="text" name="q" class="ask-input" style="width:100%;margin-bottom:8px" placeholder="Question about this entry..." aria-label="Ask about this entry" required />
              <button type="submit" class="btn" style="width:100%">Ask scoped record</button>
            </form>
          </div>
        </aside>
      </div>
    </article>
  `;

  return { status: 200, html: renderLayout(entry.title, '/work', content) };
}

export async function renderWorkOrWritingPage(
  repo: IPortfolioRepository,
  mode: 'work' | 'writing',
  filterOutcome?: string
): Promise<string> {
  const entries = await repo.listEntries({ visibility: ['public'] });
  const rows: string[] = [];

  for (const entry of entries) {
    if (mode === 'work' && entry.profile === 'freeform') continue;
    const full = await repo.getEntry(entry.id);
    if (!full || !full.currentRevision) continue;
    const rev = full.currentRevision;
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
    const dateLabel = (rev.valid_from || rev.written_at).slice(0, 10);
    const confirmedChips = facets
      .filter((f) => f.status === 'confirmed')
      .map((f) => `<span class="chip">${escapeHtml(f.key)}: ${escapeHtml(String(f.value))}</span>`)
      .join(' ');

    rows.push(`<li class="entry-row">
      <div class="entry-row-top">
        <a href="/work/${entry.slug}" class="entry-title-link">${escapeHtml(entry.title)}</a>
        <div class="entry-meta">
          <time datetime="${dateLabel}">${dateLabel}</time>
          <span class="chip">${level} · ${escapeHtml(entry.profile)}</span>
        </div>
      </div>
      ${confirmedChips ? `<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:4px">${confirmedChips}</div>` : ''}
    </li>`);
  }

  const title = mode === 'work' ? 'Work & Case Studies' : 'Writing & Chronological Log';
  const filterBar =
    mode === 'work'
      ? `<div style="display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap;align-items:center">
          <span style="font-size:14px;color:var(--text-muted)">Filter by outcome:</span>
          <a href="/work" class="chip">All</a>
          <a href="/work?outcome=worked" class="chip">Worked</a>
          <a href="/work?outcome=partly" class="chip">Worked partly</a>
          <a href="/work?outcome=failed" class="chip">What didn't work (Failed)</a>
        </div>`
      : '';

  const content = `
    <h1 style="font-family:var(--font-reading);font-size:30px;margin:0 0 8px 0">${title}</h1>
    <p style="color:var(--text-muted);margin:0 0 24px 0">
      ${mode === 'work' ? 'Structured case studies, architecture decisions, and design projects with verified evidence.' : 'All public entries ordered chronologically.'}
    </p>
    ${filterBar}
    <ul class="entry-list">
      ${rows.length > 0 ? rows.join('\n') : '<li class="entry-row">No matching entries found.</li>'}
    </ul>
  `;

  return renderLayout(title, `/${mode}`, content);
}

export async function renderBuildPage(repo: IPortfolioRepository): Promise<string> {
  const ventures = await repo.listVentures();
  const entries = await repo.listEntries({ visibility: ['public'] });

  const ventureBlocks = ventures
    .map((v) => {
      const devLog = entries.filter((e) => e.venture_id === v.id);
      const facetChips = v.facets
        ? Object.entries(v.facets)
            .map(([k, val]) => `<span class="chip">${escapeHtml(k)}: ${escapeHtml(String(val))}</span>`)
            .join(' ')
        : '';

      return `<section class="strata-section" style="margin-bottom:24px">
        <div style="display:flex;justify-content:space-between;align-items:baseline;flex-wrap:wrap;gap:8px">
          <h2 style="font-family:var(--font-reading);font-size:24px;margin:0">${escapeHtml(v.name)}</h2>
          <span class="chip">Status: <strong>${escapeHtml(v.status)}</strong></span>
        </div>
        <p style="margin:8px 0 12px;max-width:65ch">${escapeHtml(v.description || '')}</p>
        <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:16px">${facetChips}</div>
        <div style="margin-top:12px;padding-top:12px;border-top:1px solid var(--rule)">
          <strong style="font-size:14px">Attached dev-log entries (${devLog.length}):</strong>
          <ul style="margin:6px 0 0;padding-left:20px">
            ${devLog.map((e) => `<li><a href="/work/${e.slug}">${escapeHtml(e.title)}</a></li>`).join('\n            ')}
          </ul>
        </div>
      </section>`;
    })
    .join('\n');

  const content = `
    <h1 style="font-family:var(--font-reading);font-size:30px;margin:0 0 8px 0">Build — Ventures & Shipped Products</h1>
    <p style="color:var(--text-muted);margin:0 0 24px 0">Long-running products and open-source tools with linked dev-logs and constraint facets.</p>
    ${ventureBlocks}
  `;

  return renderLayout('Build', '/build', content);
}

export async function renderTimelinePage(
  repo: IPortfolioRepository,
  asOfParam?: string | null
): Promise<string> {
  const { html: strataHtml, visibleSlugs } = await renderStrataTimelineSection(repo, asOfParam);
  const allPublic = await repo.listEntries({ visibility: ['public'] });

  const filtered = visibleSlugs ? allPublic.filter((e) => visibleSlugs.has(e.slug)) : allPublic;
  const excludedCount = allPublic.length - filtered.length;

  const listHtml = filtered
    .map(
      (e) => `<li class="entry-row">
        <div class="entry-row-top">
          <a href="/work/${e.slug}" class="entry-title-link">${escapeHtml(e.title)}</a>
          <span class="chip">${escapeHtml(e.profile)}</span>
        </div>
      </li>`
    )
    .join('\n');

  const content = `
    <h1 style="font-family:var(--font-reading);font-size:30px;margin:0 0 8px 0">Time-Travel Knowledge Graph</h1>
    <p style="color:var(--text-muted);margin:0 0 24px 0">
      Scrub the timeline to see only what was recorded and believed as of that date. Hindsight entries written later are automatically filtered out.
    </p>
    ${strataHtml}
    <section>
      <h2 style="font-family:var(--font-reading);font-size:21px;margin:0 0 12px 0">
        Records active ${asOfParam ? `as of ${escapeHtml(asOfParam.slice(0, 10))}` : 'at present'} (${filtered.length} visible${excludedCount > 0 ? `, ${excludedCount} future/hindsight excluded` : ''})
      </h2>
      <ul class="entry-list">
        ${listHtml}
      </ul>
    </section>
  `;

  return renderLayout('Timeline', '/timeline', content);
}

export async function renderAskPage(
  initialQuery?: string,
  scopeSlug?: string
): Promise<string> {
  const content = `
    <h1 style="font-family:var(--font-reading);font-size:30px;margin:0 0 8px 0">Ask the Portfolio</h1>
    <p style="color:var(--text-muted);margin:0 0 24px 0;max-width:65ch">
      Answers are synthesized strictly from public records with inline citations, scope applicability checks, and explicit uncertainty. Numeric confidence scores are never shown.
    </p>

    <div class="ask-box" style="margin-top:0">
      ${scopeSlug ? `<div id="scope-chip-container" style="margin-bottom:12px"><span class="chip">Scope: <strong>${escapeHtml(scopeSlug)}</strong> <button type="button" id="btn-clear-scope" style="background:none;border:none;cursor:pointer;padding:0 4px;font-weight:700" title="Clear scope">×</button></span></div>` : ''}
      <form id="ask-form">
        <label for="ask-q" style="font-weight:600;display:block;margin-bottom:6px">Your question</label>
        <div class="ask-input-row" style="margin-top:0">
          <input id="ask-q" name="q" type="text" class="ask-input" value="${escapeHtml(initialQuery || '')}" placeholder="e.g., Should we use PostgreSQL advisory locks or Redis for webhook coordination?" required />
          <button type="submit" class="btn" id="btn-ask-submit">Ask</button>
        </div>

        <details style="margin-top:16px" ${initialQuery?.toLowerCase().includes('should') ? 'open' : ''}>
          <summary style="cursor:pointer;font-size:14px;color:var(--text-muted)">Optional context facets (for advisory questions — skippable)</summary>
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;margin-top:12px">
            <div>
              <label for="facet-db" style="font-size:13px;display:block">Database engine (hard constraint)</label>
              <input id="facet-db" type="text" class="ask-input" style="width:100%;padding:6px" placeholder="e.g., PostgreSQL or MySQL" />
            </div>
            <div>
              <label for="facet-stack" style="font-size:13px;display:block">Stack</label>
              <input id="facet-stack" type="text" class="ask-input" style="width:100%;padding:6px" placeholder="e.g., Node.js, PgBouncer" />
            </div>
            <div>
              <label for="facet-asof" style="font-size:13px;display:block">Time-travel as of date</label>
              <input id="facet-asof" type="date" class="ask-input" style="width:100%;padding:6px" />
            </div>
          </div>
        </details>
      </form>

      <div style="margin-top:16px;display:flex;gap:8px;flex-wrap:wrap;align-items:center">
        <span style="font-size:13px;color:var(--text-muted)">Examples from records:</span>
        <button type="button" class="chip example-q" style="cursor:pointer">What did you use to replace Redis distributed locks?</button>
        <button type="button" class="chip example-q" style="cursor:pointer">Should I use PostgreSQL advisory locks for webhook workers?</button>
        <button type="button" class="chip example-q" style="cursor:pointer">How fast are local ONNX embeddings on Arm64?</button>
      </div>
    </div>

    <div id="ask-live-region" aria-live="polite" style="margin-top:24px"></div>

    <script>
      (function() {
        const form = document.getElementById('ask-form');
        const qInput = document.getElementById('ask-q');
        const dbInput = document.getElementById('facet-db');
        const stackInput = document.getElementById('facet-stack');
        const asOfInput = document.getElementById('facet-asof');
        const region = document.getElementById('ask-live-region');
        const scopeSlug = ${JSON.stringify(scopeSlug || null)};

        function esc(str) {
          return String(str == null ? '' : str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
        }

        function safePath(url) {
          const s = String(url == null ? '' : url).trim();
          if (s.startsWith('/') && !s.startsWith('//')) return esc(s);
          if (s.startsWith('http://') || s.startsWith('https://')) return esc(s);
          return '#';
        }

        const submitBtn = document.getElementById('btn-ask-submit');
        const clearScopeBtn = document.getElementById('btn-clear-scope');
        let currentScope = scopeSlug;

        if (clearScopeBtn) {
          clearScopeBtn.addEventListener('click', function() {
            currentScope = null;
            const container = document.getElementById('scope-chip-container');
            if (container) container.style.display = 'none';
          });
        }

        async function runQuery(queryText) {
          region.textContent = 'Searching records and verifying citations...';
          if (submitBtn) {
            submitBtn.setAttribute('disabled', 'true');
            submitBtn.textContent = 'Searching...';
          }
          const facets = {};
          if (dbInput && dbInput.value.trim()) facets.database = dbInput.value.trim();
          if (stackInput && stackInput.value.trim()) facets.stack = stackInput.value.trim();

          const payload = {
            query: queryText,
            facets: Object.keys(facets).length > 0 ? facets : undefined,
            as_of_date: asOfInput && asOfInput.value ? new Date(asOfInput.value).toISOString() : undefined,
            scope_entry_slug: currentScope || undefined
          };

          try {
            const res = await fetch('/api/ask', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
            });
            const data = await res.json();

            if (res.status === 400) {
              region.innerHTML = '<div class="strata-section"><p style="color:var(--status-warn,#d97706);font-weight:600">Please enter a valid question (at least 3 characters).</p></div>';
              return;
            }

            if (res.status === 429) {
              const retryMinutes = data.retryAfter ? Math.max(1, Math.ceil(data.retryAfter / 60)) : 60;
              region.innerHTML =
                '<div class="strata-section">' +
                  '<span class="chip"><strong>Question limit reached</strong></span>' +
                  '<p style="margin:12px 0">' + esc(data.answer || 'Hourly question limit reached. Please wait before asking another question, or book a live session.') + '</p>' +
                  '<p style="font-size:13px;color:var(--text-muted)">Please try again in about ' + retryMinutes + ' minute' + (retryMinutes > 1 ? 's' : '') + ', or book a session directly.</p>' +
                  '<div style="margin-top:12px"><a href="/book" class="btn" style="display:inline-block;text-decoration:none">Book a session →</a></div>' +
                '</div>';
              return;
            }

            if (res.status >= 500) {
              region.innerHTML = '<div class="strata-section"><p style="color:var(--status-warn,#d97706);font-weight:600">The server encountered an error processing your query. Please try again later.</p></div>';
              return;
            }

            const tierLabels = {
              tier1: "Automated answer from the owner's records",
              tier2: "Needs the owner's review",
              tier3: "Better as a live conversation",
              extractive: "Showing excerpts from the owner's records. Automated answers are paused for now.",
              no_match: "That isn't in these records. You can ask the owner or book a conversation.",
              disabled: "Automated answers paused",
              rate_limited: "Hourly question limit reached",
              needs_context: "Additional context required"
            };

            if (data.tier === 'needs_context') {
              region.innerHTML =
                '<div class="strata-section">' +
                  '<div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px;margin-bottom:12px">' +
                    '<span class="chip"><strong>' + esc(tierLabels.needs_context) + '</strong></span>' +
                  '</div>' +
                  '<p style="margin:0 0 12px 0">' + esc(data.answer || 'This question needs more context about your requirements to formulate an accurate answer.') + '</p>' +
                  (data.prompt ? '<p style="font-size:13px;color:var(--text-muted);margin-bottom:12px">' + esc(data.prompt) + '</p>' : '') +
                  '<button type="button" class="btn btn-secondary" id="btn-open-context-facets">Open Context Facets</button>' +
                '</div>';
              return;
            }

            const citationsHtml = (data.citations || []).map(function(c) {
              return '<li style="margin-bottom:6px"><strong>[' + esc(c.citationId) + ']</strong> <a href="/work/' + encodeURIComponent(String(c.slug || '')) + '">' + esc(c.title) + '</a>: <em>"' + esc(c.text) + '"</em></li>';
            }).join('');

            const disclosureText = data.provider_disclosure || data.aiDisclosure;
            const disclosureHtml = disclosureText
              ? '<p class="provider-disclosure" style="font-size:12px;color:var(--text-muted);margin:16px 0 0 0;border-top:1px solid var(--rule);padding-top:8px">AI Disclosure: ' + esc(disclosureText) + '</p>'
              : '';

            region.innerHTML =
              '<div class="strata-section">' +
                '<div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px;margin-bottom:12px">' +
                  '<span class="chip"><strong>' + esc(tierLabels[data.tier] || data.tier) + '</strong></span>' +
                '</div>' +
                (data.basis ? '<p style="font-size:13px;color:var(--text-muted);margin:0 0 8px 0">' + esc(data.basis) + '</p>' : '') +
                '<div class="reading-column" style="white-space:pre-wrap;margin-bottom:16px">' + esc(data.answer) + '</div>' +
                (citationsHtml ? '<div style="border-top:1px solid var(--rule);padding-top:12px"><strong style="font-size:14px">Cited passages:</strong><ul style="margin:8px 0 0;padding-left:20px;font-size:14px">' + citationsHtml + '</ul></div>' : '') +
                (data.bookingUrl ? '<div style="margin-top:12px"><a href="' + safePath(data.bookingUrl) + '" class="btn" style="display:inline-block;text-decoration:none">Book live session with prefilled context →</a></div>' : '') +
                disclosureHtml +
              '</div>';
          } catch (err) {
            region.innerHTML = '<div class="strata-section"><p>Unable to reach server. Please check your network connection and retry. <a href="/book">Book a session or leave a message</a>.</p></div>';
          } finally {
            if (submitBtn) {
              submitBtn.removeAttribute('disabled');
              submitBtn.textContent = 'Ask';
            }
          }
        }

        if (form) {
          form.addEventListener('submit', function(e) {
            e.preventDefault();
            if (qInput.value.trim()) runQuery(qInput.value.trim());
          });
        }

        document.querySelectorAll('.example-q').forEach(function(btn) {
          btn.addEventListener('click', function() {
            qInput.value = btn.textContent;
            runQuery(btn.textContent);
          });
        });

        document.addEventListener('click', function(e) {
          if (e.target && e.target.id === 'btn-open-context-facets') {
            const d = document.querySelector('details');
            if (d) d.setAttribute('open', 'true');
          }
        });

        if (qInput && qInput.value.trim()) {
          runQuery(qInput.value.trim());
        }
      })();
    </script>
  `;

  return renderLayout('Ask', '/ask', content);
}

export function renderStaticPage(page: 'now' | 'about' | 'uses' | 'book', queryParam?: string): string {
  if (page === 'now') {
    return renderLayout(
      'Now',
      '/now',
      `<div class="reading-column">
        <h1>What I'm focused on now</h1>
        <p><em>Updated October 2026</em></p>
        <ul>
          <li>Refining local ONNX embedding pipelines for zero-maintenance personal knowledge graphs.</li>
          <li>Publishing benchmark suites comparing PostgreSQL 16 advisory locks and pg-boss queues against external brokers.</li>
          <li>Maintaining the open-source Strata Design System for static-first technical portfolios.</li>
        </ul>
      </div>`
    );
  }
  if (page === 'about') {
    const cfg = loadConfig();
    const forkNoticeHtml = cfg.PUBLIC_UNOFFICIAL_FORK_NOTICE
      ? `<p class="unofficial-fork-slot" data-slot="unofficial-fork-notice"><em>${escapeHtml(cfg.PUBLIC_UNOFFICIAL_FORK_NOTICE)}</em></p>`
      : '';
    return renderLayout(
      'About & Verified Credentials',
      '/about',
      `<div class="reading-column">
        <h1>About ${escapeHtml(cfg.PUBLIC_OWNER_NAME)}</h1>
        <p>${escapeHtml(cfg.PUBLIC_OWNER_BIO)}</p>
        ${forkNoticeHtml}
        <h2>Verified credentials (§6.1)</h2>
        <p>Badges appear only for artifacts with cryptographic or host-level verification records:</p>
        <ul>
          <li><span class="chip" style="border-color:var(--role-outcome)">✓ Verified GPG Commits</span> Signed commits verified against GitHub repository history.</li>
          <li><span class="chip" style="border-color:var(--role-outcome)">✓ Verified Domain Ownership</span> DNS TXT &amp; /.well-known/living-portfolio.json manifest.</li>
        </ul>
      </div>`
    );
  }
  if (page === 'uses') {
    return renderLayout(
      'Uses & Stack',
      '/uses',
      `<div class="reading-column">
        <h1>Tools &amp; Stack</h1>
        <ul>
          <li><strong>Database &amp; Queue:</strong> PostgreSQL 16 + pgvector + pg-boss</li>
          <li><strong>Runtime &amp; API:</strong> TypeScript, Node.js LTS, Hono, Drizzle ORM</li>
          <li><strong>Local AI:</strong> ONNX Runtime (bge-small-en-v1.5 embeddings), Tesseract OCR</li>
          <li><strong>Typography:</strong> Literata, Atkinson Hyperlegible Next, JetBrains Mono (SIL OFL)</li>
        </ul>
      </div>`
    );
  }
  return renderLayout(
    'Book a Live Session',
    '/book',
    `<div class="reading-column">
      <h1>Book a Live Conversation (Tier 3)</h1>
      <p>When your architectural constraints differ from my documented records, a direct conversation avoids bad extrapolation.</p>
      <form class="strata-section" onsubmit="event.preventDefault(); alert('Session request submitted with your context facets.');">
        <div style="margin-bottom:12px">
          <label for="book-q" style="display:block;font-weight:600;margin-bottom:4px">Topic / Question (pre-filled from Ask)</label>
          <input id="book-q" type="text" class="ask-input" style="width:100%" value="${escapeHtml(queryParam || '')}" placeholder="Describe your architecture constraint..." />
        </div>
        <button type="submit" class="btn">Request 30-minute architecture review</button>
      </form>
    </div>`
  );
}

export const ADMIN_API_CLIENT_SCRIPT = `
        async function apiClient(url, options) {
          var opts = options || {};
          var csrf = sessionStorage.getItem('lp_csrf_token') || '';
          var headers = Object.assign({
            'Content-Type': 'application/json',
            'X-CSRF-Token': csrf
          }, opts.headers || {});
          return window.fetch(url, Object.assign({}, opts, { headers: headers }));
        }
        window.apiClient = apiClient;
`;

export async function renderAdminWorkspacePage(repo: IPortfolioRepository): Promise<string> {
  const entries = await repo.listEntries({ visibility: ['public', 'unlisted', 'private'] });
  const escalations = await repo.getEscalations();
  const scopedConstraints = await repo.getScopedConstraints();

  const entriesWithData = await Promise.all(
    entries.map(async (e) => {
      const full = await repo.getEntry(e.id, ['public', 'unlisted', 'private']);
      const revs = await repo.getRevisions(e.id);
      const facets = await repo.getFacetsForEntry(e.id);
      const currentRev = full?.currentRevision || null;
      const claims = currentRev ? await repo.getClaimsForRevision(currentRev.id) : [];
      const annotations = currentRev ? await repo.listAnnotationsForRevision(currentRev.id) : [];
      const level = currentRev
        ? computeStructureLevel({
            revision: currentRev,
            profile: getProfile(e.profile),
            facets,
            annotations,
            claims,
          })
        : 'L0';
      const gaps = currentRev
        ? generateGapQuestions({ revision: currentRev, facets, claims })
        : [];
      return {
        ...e,
        currentRevision: currentRev,
        revisions: revs,
        facets,
        claims,
        structureLevel: level,
        gapQuestions: gaps,
      };
    })
  );

  const firstEntry = entriesWithData[0];
  const firstRev = firstEntry?.currentRevision ?? null;
  const firstFacets = firstEntry?.facets ?? [];
  const firstLevel = firstEntry?.structureLevel ?? 'L0';
  const levelDetails = getStructureLevelDetails(firstLevel);
  const gapQuestions = firstEntry?.gapQuestions ?? [];

  const entriesListHtml = entriesWithData
    .map(
      (e) => `<li class="admin-entry-item" data-entry-id="${e.id}" style="padding:8px 0;border-bottom:1px solid var(--rule);display:flex;justify-content:space-between;align-items:center;gap:8px">
        <button type="button" class="admin-entry-select-btn" data-entry-id="${e.id}" style="background:none;border:none;padding:0;font-weight:600;text-align:left;cursor:pointer;color:var(--text);flex:1">
          ${escapeHtml(e.title)}
        </button>
        <span class="chip" data-status="${escapeHtml(e.visibility)}">${escapeHtml(e.visibility)}</span>
        ${e.visibility !== 'private' ? `<a href="/work/${escapeHtml(e.slug)}" target="_blank" style="font-size:12px;color:var(--text-muted);text-decoration:none" title="View live page">↗</a>` : ''}
      </li>`
    )
    .join('\n');

  const firstEntryRevisionsHtml = (firstEntry?.revisions || [])
    .map(
      (r, idx) => `<div style="padding:6px 0;border-bottom:1px solid var(--rule);display:flex;justify-content:space-between;align-items:center">
        <div>
          <strong>Revision ${idx + 1}</strong>
          <span style="color:var(--text-muted);font-size:12px">(${new Date(r.written_at).toLocaleDateString()})</span>
        </div>
        <div>
          <code style="font-size:11px">${escapeHtml((r.body_hash || '').slice(0, 10))}...</code>
          ${r.id === firstRev?.id ? '<span class="chip" style="margin-left:4px;font-size:11px">current</span>' : ''}
        </div>
      </div>`
    )
    .join('\n') || '<p style="color:var(--text-muted);margin:0">No revisions found.</p>';

  const facetsInspectorHtml = firstFacets
    .map(
      (f) => `<div style="margin-bottom:6px;display:flex;justify-content:space-between;align-items:center">
        <span class="chip ${f.status === 'suggested' ? 'chip-suggested' : ''}">
          ${escapeHtml(f.key)}: ${escapeHtml(String(f.value))} (${f.status === 'suggested' ? 'suggested' : 'confirmed'})
        </span>
      </div>`
    )
    .join('\n');

  const gapHtml =
    gapQuestions.length > 0
      ? gapQuestions.map((g) => `<li style="margin-bottom:4px">${escapeHtml(g.question)} <em>(unlocks higher tier)</em></li>`).join('\n')
      : '<li>All core context and outcome fields are present for this entry.</li>';

  const escalationsHtml =
    escalations.length > 0
      ? escalations
          .map(
            (esc) => `<div style="border:1px solid var(--rule);padding:12px;margin-bottom:12px;background:var(--surface-page)">
              <div style="display:flex;justify-content:space-between;margin-bottom:6px">
                <strong>Visitor Question (${escapeHtml(esc.query_class)}):</strong>
                <span class="chip">${escapeHtml(esc.status)}</span>
              </div>
              <p style="margin:0 0 8px 0">${escapeHtml(esc.question)}</p>
              <div style="font-size:13px;color:var(--text-muted);margin-bottom:8px">Draft: ${escapeHtml(esc.draft || '')}</div>
            </div>`
          )
          .join('\n')
      : '<p style="color:var(--text-muted)">No pending escalations.</p>';

  const content = `
    <div class="later-thinking-banner" data-banner="alpha-warning" role="alert" style="margin-bottom:16px">
      <strong>${escapeHtml(ALPHA_WARNING_TEXT)}</strong>
    </div>
    <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;margin-bottom:24px">
      <div>
        <h1 style="font-family:var(--font-reading);font-size:28px;margin:0">Owner Admin Workspace</h1>
        <p style="color:var(--text-muted);margin:4px 0 0;font-size:14px">
          Entry-first authoring, machine-suggested structure inspector, routing kill-switch, self-calibration, and encrypted backups.
        </p>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <a href="/admin/import" class="btn btn-secondary" id="btn-import-triage" style="text-decoration:none;display:inline-flex;align-items:center">Import &amp; Triage</a>
        <button type="button" class="btn btn-secondary" id="btn-killswitch" aria-pressed="true">Pause Automated Answering</button>
        <button type="button" class="btn btn-secondary" id="btn-backup-drill">Run Backup &amp; Restore Drill</button>
        <a href="/api/settings/export" target="_blank" class="btn btn-secondary" style="text-decoration:none;display:inline-flex;align-items:center">Export Markdown + Sidecar</a>
      </div>
    </div>

    <div id="admin-undo-banner" role="region" aria-label="Undo action" style="display:none;margin-bottom:16px"></div>
    <div id="admin-status-banner" role="status" aria-live="polite" style="margin-bottom:16px"></div>

    <div id="admin-walkthrough-card" style="padding:12px 16px;border:1px solid var(--accent);border-radius:var(--radius-control);background:var(--surface-raised);margin-bottom:16px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">
      <div>
        <strong>First-Run Authoring Walkthrough (§4.1):</strong>
        <span style="font-size:13px;color:var(--text-muted);margin-left:6px">1. Paste write-up or choose Guided mode. 2. Use Inspector to accept suggested roles &amp; confirm facets. 3. Preview redactions and publish.</span>
      </div>
      <button type="button" class="btn btn-secondary" id="btn-dismiss-walkthrough" style="padding:2px 8px;font-size:12px">Dismiss</button>
    </div>

    <!-- §12.6 Three-Pane Entry Workspace -->
    <div class="admin-shell">
      <!-- Pane 1: Entries & Filters -->
      <aside class="admin-pane" aria-label="Entries list and filters">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
          <h2 style="font-size:16px;margin:0">Entries (${entries.length})</h2>
          <button type="button" class="btn btn-secondary" id="btn-new-entry" style="padding:2px 8px;font-size:12px">+ New Entry</button>
        </div>
        <ul id="admin-entries-list" style="list-style:none;padding:0;margin:0;font-size:14px">
          ${entriesListHtml}
        </ul>
      </aside>

      <!-- Pane 2: Editor (Rich Text / Markdown, Hindsight Question, Redaction Preview, Publish as is) -->
      <section class="admin-pane" aria-label="Entry editor">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-wrap:wrap;gap:8px">
          <h2 id="editor-mode-heading" style="font-size:18px;margin:0">Author / Paste Entry (L0 Immediate Publish)</h2>
          <div style="display:flex;gap:6px">
            <button type="button" class="btn btn-secondary active" id="mode-btn-paste" style="font-size:12px;padding:2px 8px">Paste / Freeform</button>
            <button type="button" class="btn btn-secondary" id="mode-btn-guided" style="font-size:12px;padding:2px 8px">Guided Mode (§4.2)</button>
            <button type="button" class="btn btn-secondary" id="mode-btn-quick" style="font-size:12px;padding:2px 8px">Quick Log (§4.4)</button>
          </div>
        </div>

        <!-- Guided Mode Panel (§4.2) -->
        <div id="editor-guided-panel" style="display:none;margin-bottom:12px;border:1px solid var(--rule);border-radius:var(--radius-control);padding:12px;background:var(--surface-page)">
          <div style="font-size:13px;font-weight:600;margin-bottom:8px">Guided Mode — Per-Role Prompts</div>
          <div style="margin-bottom:8px">
            <label for="guided-problem" style="font-size:12px;font-weight:600;display:block;margin-bottom:2px">Problem (What challenge did you tackle?)</label>
            <input type="text" id="guided-problem" class="ask-input" style="width:100%;padding:4px 6px" placeholder="e.g. Distributed lock contention under peak traffic" />
          </div>
          <div style="margin-bottom:8px">
            <label for="guided-approach" style="font-size:12px;font-weight:600;display:block;margin-bottom:2px">Approach (What technical solution was implemented?)</label>
            <input type="text" id="guided-approach" class="ask-input" style="width:100%;padding:4px 6px" placeholder="e.g. Migrated from Redis Redlock to Postgres 15 advisory locks" />
          </div>
          <div style="margin-bottom:8px">
            <label for="guided-outcome" style="font-size:12px;font-weight:600;display:block;margin-bottom:2px">Outcome (Measurable result or milestone)</label>
            <input type="text" id="guided-outcome" class="ask-input" style="width:100%;padding:4px 6px" placeholder="e.g. Zero lock contention, P99 latency dropped by 42ms" />
          </div>
          <div style="margin-bottom:8px">
            <label for="guided-lesson" style="font-size:12px;font-weight:600;display:block;margin-bottom:2px">Lesson Learned (What worked, or what went wrong?)</label>
            <input type="text" id="guided-lesson" class="ask-input" style="width:100%;padding:4px 6px;margin-bottom:4px" placeholder="e.g. Connection pooling was critical to avoid exhausting connections" />
            <label style="font-size:12px;display:flex;align-items:center;gap:6px;cursor:pointer">
              <input type="checkbox" id="guided-nothing-wrong" /> Nothing went wrong (smooth execution)
            </label>
          </div>
          <button type="button" class="btn btn-secondary" id="btn-guided-compile" style="font-size:12px;padding:4px 8px">Compile into Body →</button>
        </div>

        <!-- Quick Log Panel (§4.4) -->
        <div id="editor-quick-panel" style="display:none;margin-bottom:12px;border:1px solid var(--rule);border-radius:var(--radius-control);padding:12px;background:var(--surface-page)">
          <div style="font-size:13px;font-weight:600;margin-bottom:4px">Quick Log — Fast Thought Capture (under 30s)</div>
          <textarea id="quick-log-text" rows="3" class="ask-input" style="width:100%;font-size:13px;margin-bottom:8px" placeholder="Capture notes, a milestone, or snippet..."></textarea>
          <button type="button" class="btn" id="btn-submit-quick-log" style="font-size:12px;padding:4px 10px">Save Quick Log Entry</button>
        </div>

        <form id="admin-entry-form">
          <input type="hidden" id="entry-id" value="" />
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">
            <div>
              <label for="entry-title" style="font-size:13px;font-weight:600;display:block">Title</label>
              <input id="entry-title" type="text" class="ask-input" style="width:100%;padding:6px" placeholder="e.g., Zero-Downtime Queue Cutover" required />
            </div>
            <div>
              <label for="entry-slug" style="font-size:13px;font-weight:600;display:block">Slug</label>
              <input id="entry-slug" type="text" class="ask-input" style="width:100%;padding:6px" placeholder="zero-downtime-queue-cutover" required />
            </div>
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:12px;margin-bottom:12px">
            <div>
              <label for="entry-profile" style="font-size:13px;font-weight:600;display:block">Role profile (§3.4)</label>
              <select id="entry-profile" class="ask-input" style="width:100%;padding:6px">
                <option value="case-study">Case study (default)</option>
                <option value="decision-record">Decision record</option>
                <option value="design-project">Design project</option>
                <option value="research-note">Research note</option>
                <option value="how-to">How-to</option>
                <option value="freeform">Freeform (L0/L1 only)</option>
              </select>
            </div>
            <div>
              <label for="entry-visibility" style="font-size:13px;font-weight:600;display:block">Visibility (§3.11)</label>
              <select id="entry-visibility" class="ask-input" style="width:100%;padding:6px">
                <option value="private">Private (Draft)</option>
                <option value="unlisted">Unlisted</option>
                <option value="public">Public</option>
              </select>
            </div>
            <div>
              <label for="entry-date" style="font-size:13px;font-weight:600;display:block">When it happened</label>
              <input id="entry-date" type="date" class="ask-input" style="width:100%;padding:6px" value="2026-10-19" />
            </div>
            <div style="display:flex;align-items:flex-end;padding-bottom:6px">
              <label style="font-size:13px;display:flex;align-items:center;gap:6px;cursor:pointer">
                <input id="entry-hindsight" type="checkbox" />
                Happened earlier? (Hindsight §3.9)
              </label>
            </div>
          </div>

          <div style="margin-bottom:12px">
            <label for="entry-body" style="font-size:13px;font-weight:600;display:block;margin-bottom:4px">
              Body (Markdown + GFM — only a body and date are required; structure is optional)
            </label>
            <textarea id="entry-body" rows="8" class="ask-input" style="width:100%;font-family:var(--font-code);font-size:14px" placeholder="Paste any existing write-up or answer the profile prompts..."></textarea>
            <input type="hidden" id="entry-preview-token" name="redactionPreviewToken" value="" />
          </div>

          <div id="redaction-preview-box" style="margin-bottom:12px"></div>

          <div style="margin-bottom:12px;padding:10px 12px;border:1px solid var(--rule);border-radius:4px;background:var(--bg-subtle)">
            <label style="display:flex;align-items:flex-start;gap:8px;font-size:13px;cursor:pointer">
              <input type="checkbox" id="entry-nda-confirmed" name="nda_confirmed" value="true" style="margin-top:2px" />
              <span><strong>Confidentiality &amp; NDA Confirmation (§4.3):</strong> I confirm this content is not subject to an active Non-Disclosure Agreement (NDA) or client confidentiality restrictions, or that all necessary client approvals and redactions have been completed.</span>
            </label>
          </div>

          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">
            <div style="display:flex;gap:8px;flex-wrap:wrap" id="editor-action-buttons">
              <button type="button" class="btn btn-secondary" id="btn-save-draft">Save draft</button>
              <button type="submit" class="btn" id="btn-publish-entry">Publish as is (L0)</button>
              <button type="button" class="btn btn-secondary" id="btn-redaction-check">Preview Redaction (§4.3)</button>
              <button type="button" class="btn btn-secondary" id="btn-unpublish" style="display:none">Unpublish</button>
              <button type="button" class="btn btn-secondary" id="btn-delete-entry" style="display:none;color:var(--red-700,#b42318)">Delete</button>
            </div>
            <span style="font-size:13px;color:var(--text-muted)">"Good enough" exit always active — structure never blocks publishing.</span>
          </div>
        </form>
      </section>

      <!-- Pane 3: Structure Inspector & Answerability Preview (§12.6, §15, 20261020-UX-06) -->
      <aside class="admin-pane" aria-label="Structure inspector and answerability preview">
        <h2 style="font-size:16px;margin:0 0 8px 0">Inspector: <span id="inspector-heading">${escapeHtml(firstEntry?.title || 'Sample')}</span></h2>

        <!-- Inspector Tabs (§12.6) -->
        <div class="inspector-tabs" role="tablist" aria-label="Inspector Panels">
          <button type="button" role="tab" id="tab-btn-structure" aria-controls="panel-structure" aria-selected="true" class="inspector-tab-btn active">Structure</button>
          <button type="button" role="tab" id="tab-btn-context" aria-controls="panel-context" aria-selected="false" class="inspector-tab-btn">Context</button>
          <button type="button" role="tab" id="tab-btn-evidence" aria-controls="panel-evidence" aria-selected="false" class="inspector-tab-btn">Evidence</button>
          <button type="button" role="tab" id="tab-btn-answerability" aria-controls="panel-answerability" aria-selected="false" class="inspector-tab-btn">Answerability</button>
          <button type="button" role="tab" id="tab-btn-history" aria-controls="panel-history" aria-selected="false" class="inspector-tab-btn">History</button>
        </div>

        <!-- Tab 1: Structure Panel -->
        <div class="inspector-tab-panel active" id="panel-structure" role="tabpanel" aria-labelledby="tab-btn-structure">
          <div style="font-size:13px;color:var(--text-muted)">Four-step structure map (never a percentage score):</div>
          <div class="level-steps" id="inspector-level-steps" role="list" aria-label="Structure level indicator">
            <div class="level-step" role="listitem" data-level="L0" data-active="${firstLevel === 'L0' || firstLevel === 'L1' || firstLevel === 'L2' || firstLevel === 'L3'}">L0 Text</div>
            <div class="level-step" role="listitem" data-level="L1" data-active="${firstLevel === 'L1' || firstLevel === 'L2' || firstLevel === 'L3'}">L1 Context</div>
            <div class="level-step" role="listitem" data-level="L2" data-active="${firstLevel === 'L2' || firstLevel === 'L3'}">L2 Roles</div>
            <div class="level-step" role="listitem" data-level="L3" data-active="${firstLevel === 'L3'}">L3 Claims</div>
          </div>
          <p style="font-size:13px;margin:4px 0 12px 0" id="inspector-unlocks"><strong>Unlocks:</strong> ${escapeHtml(levelDetails.unlocked.join(', '))}</p>

          <h3 style="font-size:14px;margin:12px 0 6px 0">Role Annotations &amp; Suggestions (§3.5)</h3>
          <div id="inspector-annotations-list" style="font-size:13px">
            <p style="color:var(--text-muted)">Select an entry to review machine-suggested roles.</p>
          </div>
        </div>

        <!-- Tab 2: Context Panel -->
        <div class="inspector-tab-panel" id="panel-context" role="tabpanel" aria-labelledby="tab-btn-context">
          <h3 style="font-size:14px;margin:0 0 6px 0">Context Facets (dashed = machine suggested)</h3>
          <div id="inspector-facets">
            ${facetsInspectorHtml}
          </div>

          <div style="margin-top:16px;padding-top:12px;border-top:1px solid var(--rule)">
            <h4 style="font-size:13px;margin:0 0 6px 0">Add Facet</h4>
            <div style="display:flex;gap:6px;flex-direction:column">
              <input type="text" id="new-facet-key" class="ask-input" style="padding:4px;font-size:12px" placeholder="Facet name (e.g. database, stack)" />
              <input type="text" id="new-facet-value" class="ask-input" style="padding:4px;font-size:12px" placeholder="Value (e.g. Postgres 15)" />
              <input type="text" id="new-facet-quote" class="ask-input" style="padding:4px;font-size:12px" placeholder="Source quote (optional)" />
              <button type="button" class="btn btn-secondary" id="btn-add-facet" style="font-size:12px;padding:3px 8px">Confirm &amp; Add Facet</button>
            </div>
          </div>
        </div>

        <!-- Tab 3: Evidence Panel -->
        <div class="inspector-tab-panel" id="panel-evidence" role="tabpanel" aria-labelledby="tab-btn-evidence">
          <h3 style="font-size:14px;margin:0 0 4px 0">Attached Evidence (§3.8)</h3>
          <p style="font-size:12px;color:var(--text-muted);margin:0 0 8px 0">
            Evidence verification confirms artifact authenticity but does not prove the narrative.
          </p>
          <div id="inspector-evidence-list" style="font-size:13px">
            <p style="color:var(--text-muted)">No evidence attached yet.</p>
          </div>

          <div style="margin-top:16px;padding-top:12px;border-top:1px solid var(--rule)">
            <h4 style="font-size:13px;margin:0 0 6px 0">Attach Evidence Item</h4>
            <div style="display:flex;gap:6px;flex-direction:column">
              <select id="new-evidence-kind" class="ask-input" style="padding:4px;font-size:12px">
                <option value="repo_commit">Git Commit</option>
                <option value="pull_request">Pull Request</option>
                <option value="document">Design Doc / Specification</option>
                <option value="url">External Link / URL</option>
              </select>
              <input type="text" id="new-evidence-url" class="ask-input" style="padding:4px;font-size:12px" placeholder="URL or commit SHA" />
              <input type="text" id="new-evidence-label" class="ask-input" style="padding:4px;font-size:12px" placeholder="Label / Description" />
              <button type="button" class="btn btn-secondary" id="btn-attach-evidence" style="font-size:12px;padding:3px 8px">Attach Evidence</button>
            </div>
          </div>
        </div>

        <!-- Tab 4: Answerability Panel -->
        <div class="inspector-tab-panel" id="panel-answerability" role="tabpanel" aria-labelledby="tab-btn-answerability">
          <h3 style="font-size:14px;margin:0 0 6px 0">Answerability &amp; Gap Questions (§10.2)</h3>
          <ul id="inspector-gap-questions" style="font-size:13px;padding-left:18px;margin:0">
            ${gapHtml}
          </ul>
        </div>

        <!-- Tab 5: History Panel -->
        <div class="inspector-tab-panel" id="panel-history" role="tabpanel" aria-labelledby="tab-btn-history">
          <h3 style="font-size:14px;margin:0 0 6px 0">Revision History (§3.11, §15)</h3>
          <div id="inspector-revisions-list" style="font-size:13px">
            ${firstEntryRevisionsHtml}
          </div>
        </div>
      </aside>
    </div>

    <!-- Operational Panels: Inbox Escalations, Audit, Routing & Calibration -->
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(340px,1fr));gap:24px;margin-top:24px">
      <section class="admin-pane" aria-labelledby="inbox-heading">
        <h2 id="inbox-heading" style="font-size:18px;margin:0 0 12px 0">Escalation Inbox — Tier 2 Review (${escalations.length})</h2>
        ${escalationsHtml}
      </section>

      <section class="admin-pane" aria-labelledby="audit-heading">
        <h2 id="audit-heading" style="font-size:18px;margin:0 0 12px 0">Topology Audit &amp; Scoped Constraints (§11)</h2>
        <h3 style="font-size:14px;margin:12px 0 6px 0">Mined Scoped Constraints (${scopedConstraints.length})</h3>
        ${scopedConstraints.length > 0 ? scopedConstraints
          .map(
            (sc) => `<div style="font-size:13px;padding:8px;border:1px dashed var(--rule)">
              Quote: "${escapeHtml(sc.source_quote || '')}" · Status: <strong>${escapeHtml(sc.status)}</strong>
            </div>`
          )
          .join('\n') : '<p style="color:var(--text-muted);font-size:13px">No active scoped constraints recorded.</p>'}
      </section>
    </div>

    <script>
      (function() {
        const banner = document.getElementById('admin-status-banner');
        const undoBanner = document.getElementById('admin-undo-banner');
        const form = document.getElementById('admin-entry-form');
        const redactBtn = document.getElementById('btn-redaction-check');
        const redactBox = document.getElementById('redaction-preview-box');
        const killBtn = document.getElementById('btn-killswitch');
        const drillBtn = document.getElementById('btn-backup-drill');
        const saveDraftBtn = document.getElementById('btn-save-draft');
        const unpublishBtn = document.getElementById('btn-unpublish');
        const deleteBtn = document.getElementById('btn-delete-entry');
        const newEntryBtn = document.getElementById('btn-new-entry');
        const entryIdInput = document.getElementById('entry-id');
        const titleInput = document.getElementById('entry-title');
        const slugInput = document.getElementById('entry-slug');
        const modeHeading = document.getElementById('editor-mode-heading');
        const stateBadge = document.getElementById('chip-current-state');
        let answeringEnabled = true;
        let currentPreviewToken = '';
        let currentHasWarnings = false;
        let slugIsManual = false;
        let undoTimeout = null;

        ${ADMIN_API_CLIENT_SCRIPT}

        function renderAdminError(res) {
          if (res.status === 401) {
            return '<div class="later-thinking-banner" role="alert" data-error="401">Your session has expired. <a href="/admin/login" style="margin-left:8px;font-weight:600">Sign in again →</a></div>';
          }
          if (res.status === 403) {
            return '<div class="later-thinking-banner" role="alert" data-error="403">Security check failed (CSRF token invalid or missing). Please refresh and retry.</div>';
          }
          if (res.status >= 500) {
            return '<div class="later-thinking-banner" role="alert" data-error="500">Server error (HTTP ' + res.status + '). Please retry your request.</div>';
          }
          return '<div class="later-thinking-banner" role="alert" data-error="' + res.status + '">Request failed (HTTP ' + res.status + '). Please check inputs and retry.</div>';
        }

        function showUndoBanner(message, onUndo) {
          if (undoTimeout) clearTimeout(undoTimeout);
          if (!undoBanner) return;
          undoBanner.style.display = 'block';
          undoBanner.innerHTML = '<div class="as-of-banner" style="display:flex;justify-content:space-between;align-items:center">' +
            '<span>' + message + '</span>' +
            '<button type="button" class="btn btn-secondary" id="btn-undo-action" style="padding:2px 8px;font-size:12px;margin-left:8px">Undo (30s)</button>' +
            '</div>';
          const undoBtn = document.getElementById('btn-undo-action');
          if (undoBtn) {
            undoBtn.addEventListener('click', async function() {
              if (undoTimeout) clearTimeout(undoTimeout);
              undoBanner.style.display = 'none';
              await onUndo();
            });
          }
          undoTimeout = setTimeout(function() {
            undoBanner.style.display = 'none';
          }, 30000);
        }

        function slugify(text) {
          return (text || '')
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
        }

        if (titleInput) {
          titleInput.addEventListener('input', function(e) {
            if ((!entryIdInput || !entryIdInput.value) && !slugIsManual && slugInput) {
              slugInput.value = slugify(e.target.value);
            }
          });
        }

        if (slugInput) {
          slugInput.addEventListener('input', function() {
            slugIsManual = true;
          });
        }

        async function selectEntry(id) {
          try {
            const res = await apiClient('/api/entries/' + id);
            if (!res.ok) return;
            const data = await res.json();
            const entry = data.entry;
            const currentRev = data.currentRevision;

            if (entryIdInput) entryIdInput.value = entry.id;
            if (titleInput) titleInput.value = entry.title || '';
            if (slugInput) slugInput.value = entry.slug || '';
            const profileSelect = document.getElementById('entry-profile');
            if (profileSelect) profileSelect.value = entry.profile || 'case-study';
            const visibilityInput = document.getElementById('entry-visibility');
            if (visibilityInput && entry.visibility) {
              visibilityInput.value = entry.visibility;
            }
            const dateInput = document.getElementById('entry-date');
            if (dateInput && currentRev?.valid_from) {
              dateInput.value = currentRev.valid_from.slice(0, 10);
            }
            const hindsightCheck = document.getElementById('entry-hindsight');
            if (hindsightCheck) hindsightCheck.checked = !!currentRev?.is_hindsight;
            const bodyEl = document.getElementById('entry-body');
            if (bodyEl) bodyEl.value = currentRev?.body_md || '';

            if (modeHeading) modeHeading.textContent = 'Edit Entry: ' + entry.title;
            if (stateBadge) stateBadge.textContent = 'State: ' + entry.visibility.toUpperCase();

            if (unpublishBtn) {
              unpublishBtn.style.display = entry.visibility === 'public' || entry.visibility === 'unlisted' ? 'inline-block' : 'none';
            }
            if (deleteBtn) {
              deleteBtn.style.display = 'inline-block';
            }

            // Update Inspector Revisions
            const revRes = await apiClient('/api/entries/' + entry.id + '/revisions');
            if (revRes.ok) {
              const revData = await revRes.json();
              const revListEl = document.getElementById('inspector-revisions-list');
              if (revListEl && Array.isArray(revData.revisions)) {
                revListEl.innerHTML = revData.revisions.map(function(r, idx) {
                  const dateStr = r.written_at ? new Date(r.written_at).toLocaleDateString() : 'N/A';
                  const hashSnippet = (r.body_hash || '').slice(0, 10);
                  const isCur = r.id === entry.current_revision_id;
                  return '<div style="padding:6px 0;border-bottom:1px solid var(--rule);display:flex;justify-content:space-between;align-items:center">' +
                    '<div><strong>Revision ' + (idx + 1) + '</strong> <span style="color:var(--text-muted);font-size:12px">(' + escapeClientHtml(dateStr) + ')</span></div>' +
                    '<div><code style="font-size:11px">' + escapeClientHtml(hashSnippet) + '...</code>' +
                    (isCur ? '<span class="chip" style="margin-left:4px;font-size:11px">current</span>' : '') +
                    '</div></div>';
                }).join('');
              }
            }

            // Update Inspector Title
            const inspHeading = document.getElementById('inspector-heading');
            if (inspHeading) inspHeading.textContent = 'Inspector: ' + entry.title;

            // Update Inspector Facets, Evidence, and Annotations
            await loadInspectorData(entry.id, currentRev ? currentRev.id : null);
          } catch (err) {}
        }

        async function loadInspectorData(entryId, revId) {
          // 1. Facets
          try {
            const facetsRes = await apiClient('/api/structure/entries/' + entryId + '/facets');
            if (facetsRes.ok) {
              const fData = await facetsRes.json();
              const container = document.getElementById('inspector-facets');
              if (container && Array.isArray(fData.facets)) {
                if (fData.facets.length === 0) {
                  container.innerHTML = '<p style="color:var(--text-muted);font-size:13px;margin:0">No facets recorded yet.</p>';
                } else {
                  container.innerHTML = fData.facets.map(function(f) {
                    const isSugg = f.status === 'suggested';
                    return '<div style="margin-bottom:8px;padding:6px;border:1px ' + (isSugg ? 'dashed' : 'solid') + ' var(--rule);border-radius:4px;display:flex;justify-content:space-between;align-items:center;gap:6px">' +
                      '<div><span class="chip ' + (isSugg ? 'chip-suggested' : '') + '">' + escapeClientHtml(f.key) + ': ' + escapeClientHtml(String(f.value)) + '</span>' +
                      (f.source_quote ? '<div style="font-size:11px;color:var(--text-muted);margin-top:2px">"' + escapeClientHtml(f.source_quote) + '"</div>' : '') +
                      '</div>' +
                      (isSugg ? '<div style="display:flex;gap:4px">' +
                        '<button type="button" class="btn btn-secondary btn-confirm-facet" data-facet-id="' + f.id + '" style="padding:1px 6px;font-size:11px">Confirm</button>' +
                        '<button type="button" class="btn btn-secondary btn-reject-facet" data-facet-id="' + f.id + '" style="padding:1px 6px;font-size:11px">Reject</button>' +
                      '</div>' : '') +
                    '</div>';
                  }).join('');

                  container.querySelectorAll('.btn-confirm-facet').forEach(function(b) {
                    b.addEventListener('click', async function() {
                      const fid = b.getAttribute('data-facet-id');
                      await apiClient('/api/structure/facets/' + fid, {
                        method: 'PATCH',
                        body: JSON.stringify({ status: 'confirmed' })
                      });
                      loadInspectorData(entryId, revId);
                    });
                  });
                  container.querySelectorAll('.btn-reject-facet').forEach(function(b) {
                    b.addEventListener('click', async function() {
                      const fid = b.getAttribute('data-facet-id');
                      await apiClient('/api/structure/facets/' + fid, {
                        method: 'PATCH',
                        body: JSON.stringify({ status: 'rejected' })
                      });
                      loadInspectorData(entryId, revId);
                    });
                  });
                }
              }
            }
          } catch (err) {}

          // 2. Evidence
          try {
            const evRes = await apiClient('/api/structure/entries/' + entryId + '/evidence');
            if (evRes.ok) {
              const evData = await evRes.json();
              const container = document.getElementById('inspector-evidence-list');
              if (container && Array.isArray(evData.evidence)) {
                if (evData.evidence.length === 0) {
                  container.innerHTML = '<p style="color:var(--text-muted);font-size:13px;margin:0">No evidence items attached yet.</p>';
                } else {
                  container.innerHTML = evData.evidence.map(function(ev) {
                    const isVer = !!ev.verified_at;
                    return '<div style="margin-bottom:6px;padding:6px;border:1px solid var(--rule);border-radius:4px">' +
                      '<div style="display:flex;justify-content:space-between;align-items:center">' +
                        '<strong>' + escapeClientHtml(ev.label || ev.kind) + '</strong>' +
                        (isVer ? '<span class="chip" style="border-color:var(--role-outcome);font-size:11px">✓ Verified</span>' : '<span class="chip" style="font-size:11px">Unverified</span>') +
                      '</div>' +
                      '<div style="font-size:12px;color:var(--text-muted);margin-top:2px"><a href="' + escapeClientHtml(ev.url) + '" target="_blank" rel="noopener">' + escapeClientHtml(ev.url) + '</a></div>' +
                    '</div>';
                  }).join('');
                }
              }
            }
          } catch (err) {}

          // 3. Spans & Annotations
          if (revId) {
            try {
              const spansRes = await apiClient('/api/structure/revisions/' + revId + '/spans');
              if (spansRes.ok) {
                const sData = await spansRes.json();
                const container = document.getElementById('inspector-annotations-list');
                if (container && Array.isArray(sData.spans)) {
                  const allAnnotations = [];
                  sData.spans.forEach(function(sp) {
                    if (Array.isArray(sp.annotations)) {
                      sp.annotations.forEach(function(ann) {
                        allAnnotations.push({ ...ann, spanText: sp.text });
                      });
                    }
                  });

                  if (allAnnotations.length === 0) {
                    container.innerHTML = '<p style="color:var(--text-muted);font-size:13px;margin:0">No role annotations recorded. Suggestions appear after enrichment.</p>';
                  } else {
                    container.innerHTML = allAnnotations.map(function(ann) {
                      const isSugg = ann.status === 'suggested';
                      return '<div style="margin-bottom:8px;padding:6px;border:1px ' + (isSugg ? 'dashed' : 'solid') + ' var(--rule);border-radius:4px">' +
                        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">' +
                          '<span class="chip ' + (isSugg ? 'chip-suggested' : '') + '">Role: ' + escapeClientHtml(ann.role) + ' (' + escapeClientHtml(ann.status) + ')</span>' +
                          (isSugg ? '<div style="display:flex;gap:4px">' +
                            '<button type="button" class="btn btn-secondary btn-accept-ann" data-ann-id="' + ann.id + '" style="padding:1px 6px;font-size:11px">Accept</button>' +
                            '<button type="button" class="btn btn-secondary btn-ignore-ann" data-ann-id="' + ann.id + '" style="padding:1px 6px;font-size:11px">Ignore</button>' +
                          '</div>' : '') +
                        '</div>' +
                        '<div style="font-size:12px;color:var(--text-muted)">"' + escapeClientHtml((ann.spanText || '').slice(0, 100)) + '..."</div>' +
                      '</div>';
                    }).join('');

                    container.querySelectorAll('.btn-accept-ann').forEach(function(b) {
                      b.addEventListener('click', async function() {
                        const aid = b.getAttribute('data-ann-id');
                        await apiClient('/api/structure/annotations/' + aid, {
                          method: 'PATCH',
                          body: JSON.stringify({ status: 'accepted' })
                        });
                        loadInspectorData(entryId, revId);
                      });
                    });
                    container.querySelectorAll('.btn-ignore-ann').forEach(function(b) {
                      b.addEventListener('click', async function() {
                        const aid = b.getAttribute('data-ann-id');
                        await apiClient('/api/structure/annotations/' + aid, {
                          method: 'PATCH',
                          body: JSON.stringify({ status: 'rejected' })
                        });
                        loadInspectorData(entryId, revId);
                      });
                    });
                  }
                }
              }
            } catch (err) {}
          }
        }

        // Tab switching
        document.querySelectorAll('.inspector-tab-btn').forEach(function(btn) {
          btn.addEventListener('click', function() {
            document.querySelectorAll('.inspector-tab-btn').forEach(function(b) {
              b.classList.remove('active');
              b.setAttribute('aria-selected', 'false');
            });
            document.querySelectorAll('.inspector-tab-panel').forEach(function(p) {
              p.classList.remove('active');
            });
            btn.classList.add('active');
            btn.setAttribute('aria-selected', 'true');
            const targetId = btn.getAttribute('aria-controls');
            if (targetId) {
              const panel = document.getElementById(targetId);
              if (panel) panel.classList.add('active');
            }
          });
        });

        // Editor Mode switching
        const modeBtnPaste = document.getElementById('mode-btn-paste');
        const modeBtnGuided = document.getElementById('mode-btn-guided');
        const modeBtnQuick = document.getElementById('mode-btn-quick');
        const guidedPanel = document.getElementById('editor-guided-panel');
        const quickPanel = document.getElementById('editor-quick-panel');

        function setEditorMode(mode) {
          [modeBtnPaste, modeBtnGuided, modeBtnQuick].forEach(function(b) {
            if (b) b.classList.remove('active');
          });
          if (guidedPanel) guidedPanel.style.display = 'none';
          if (quickPanel) quickPanel.style.display = 'none';

          if (mode === 'guided') {
            if (modeBtnGuided) modeBtnGuided.classList.add('active');
            if (guidedPanel) guidedPanel.style.display = 'block';
          } else if (mode === 'quick') {
            if (modeBtnQuick) modeBtnQuick.classList.add('active');
            if (quickPanel) quickPanel.style.display = 'block';
          } else {
            if (modeBtnPaste) modeBtnPaste.classList.add('active');
          }
        }

        if (modeBtnPaste) modeBtnPaste.addEventListener('click', function() { setEditorMode('paste'); });
        if (modeBtnGuided) modeBtnGuided.addEventListener('click', function() { setEditorMode('guided'); });
        if (modeBtnQuick) modeBtnQuick.addEventListener('click', function() { setEditorMode('quick'); });

        const nothingWrongCheck = document.getElementById('guided-nothing-wrong');
        const guidedLessonInput = document.getElementById('guided-lesson');
        if (nothingWrongCheck && guidedLessonInput) {
          nothingWrongCheck.addEventListener('change', function() {
            if (nothingWrongCheck.checked) {
              guidedLessonInput.value = 'Smooth execution with no notable regressions.';
            }
          });
        }

        const guidedCompileBtn = document.getElementById('btn-guided-compile');
        if (guidedCompileBtn) {
          guidedCompileBtn.addEventListener('click', function() {
            const prob = document.getElementById('guided-problem')?.value.trim() || '';
            const app = document.getElementById('guided-approach')?.value.trim() || '';
            const out = document.getElementById('guided-outcome')?.value.trim() || '';
            const les = document.getElementById('guided-lesson')?.value.trim() || '';

            const parts = [];
            if (prob) parts.push('## Problem\\n\\n' + prob);
            if (app) parts.push('## Approach\\n\\n' + app);
            if (out) parts.push('## Outcome\\n\\n' + out);
            if (les) parts.push('## Lesson\\n\\n' + les);

            const compiled = parts.join('\\n\\n');
            const bodyEl = document.getElementById('entry-body');
            if (bodyEl && compiled) {
              bodyEl.value = compiled;
              setEditorMode('paste');
              banner.innerHTML = '<div class="as-of-banner">Compiled guided prompts into body.</div>';
            }
          });
        }

        const quickSubmitBtn = document.getElementById('btn-submit-quick-log');
        if (quickSubmitBtn) {
          quickSubmitBtn.addEventListener('click', async function() {
            const text = document.getElementById('quick-log-text')?.value.trim() || '';
            if (!text) {
              banner.innerHTML = '<div class="later-thinking-banner" role="alert">Please enter quick log text.</div>';
              return;
            }
            try {
              const res = await apiClient('/api/entries/quick-log', {
                method: 'POST',
                body: JSON.stringify({ text: text })
              });
              if (res.ok) {
                const data = await res.json();
                banner.innerHTML = '<div class="as-of-banner">Quick log saved as "' + escapeClientHtml(data.entry.title) + '" (private).</div>';
                document.getElementById('quick-log-text').value = '';
                setEditorMode('paste');
                const listEl = document.getElementById('admin-entries-list');
                if (listEl) {
                  const li = document.createElement('li');
                  li.className = 'admin-entry-item';
                  li.setAttribute('data-entry-id', data.entry.id);
                  li.style = 'padding:8px 0;border-bottom:1px solid var(--rule);display:flex;justify-content:space-between;align-items:center;gap:8px';
                  li.innerHTML = '<button type="button" class="admin-entry-select-btn" data-entry-id="' + data.entry.id + '" style="background:none;border:none;padding:0;font-weight:600;text-align:left;cursor:pointer;color:var(--text);flex:1">' +
                    escapeClientHtml(data.entry.title) + '</button>' +
                    '<span class="chip" data-status="private">private</span>';
                  listEl.prepend(li);
                  li.querySelector('.admin-entry-select-btn').addEventListener('click', function() {
                    selectEntry(data.entry.id);
                  });
                }
              } else {
                banner.innerHTML = renderAdminError(res);
              }
            } catch (err) {
              banner.innerHTML = '<div class="later-thinking-banner" role="alert">Network error saving quick log.</div>';
            }
          });
        }

        const dismissWalkthroughBtn = document.getElementById('btn-dismiss-walkthrough');
        if (dismissWalkthroughBtn) {
          dismissWalkthroughBtn.addEventListener('click', function() {
            const card = document.getElementById('admin-walkthrough-card');
            if (card) card.style.display = 'none';
          });
        }

        const addFacetBtn = document.getElementById('btn-add-facet');
        if (addFacetBtn) {
          addFacetBtn.addEventListener('click', async function() {
            const entryId = entryIdInput?.value;
            if (!entryId) {
              banner.innerHTML = '<div class="later-thinking-banner">Please select an entry first.</div>';
              return;
            }
            const key = document.getElementById('new-facet-key')?.value.trim();
            const val = document.getElementById('new-facet-value')?.value.trim();
            const quote = document.getElementById('new-facet-quote')?.value.trim();
            if (!key || !val) {
              banner.innerHTML = '<div class="later-thinking-banner">Facet name and value are required.</div>';
              return;
            }
            const res = await apiClient('/api/structure/facets', {
              method: 'POST',
              body: JSON.stringify({
                entry_id: entryId,
                key: key,
                value: val,
                source_quote: quote || undefined,
                status: 'confirmed'
              })
            });
            if (res.ok) {
              document.getElementById('new-facet-key').value = '';
              document.getElementById('new-facet-value').value = '';
              document.getElementById('new-facet-quote').value = '';
              loadInspectorData(entryId, null);
            }
          });
        }

        const attachEvidenceBtn = document.getElementById('btn-attach-evidence');
        if (attachEvidenceBtn) {
          attachEvidenceBtn.addEventListener('click', async function() {
            const entryId = entryIdInput?.value;
            if (!entryId) {
              banner.innerHTML = '<div class="later-thinking-banner">Please select an entry first.</div>';
              return;
            }
            const kind = document.getElementById('new-evidence-kind')?.value;
            const url = document.getElementById('new-evidence-url')?.value.trim();
            const label = document.getElementById('new-evidence-label')?.value.trim();
            if (!url) {
              banner.innerHTML = '<div class="later-thinking-banner">Evidence URL or commit SHA is required.</div>';
              return;
            }
            const res = await apiClient('/api/structure/evidence', {
              method: 'POST',
              body: JSON.stringify({
                entry_id: entryId,
                kind: kind || 'url',
                url: url,
                label: label || undefined
              })
            });
            if (res.ok) {
              document.getElementById('new-evidence-url').value = '';
              document.getElementById('new-evidence-label').value = '';
              loadInspectorData(entryId, null);
            }
          });
        }

        // Bind clicks on entry list buttons
        document.querySelectorAll('.admin-entry-select-btn').forEach(function(btn) {
          btn.addEventListener('click', function() {
            const id = btn.getAttribute('data-entry-id');
            if (id) selectEntry(id);
          });
        });

        if (newEntryBtn) {
          newEntryBtn.addEventListener('click', function() {
            if (entryIdInput) entryIdInput.value = '';
            if (form) form.reset();
            const visibilityInput = document.getElementById('entry-visibility');
            if (visibilityInput) visibilityInput.value = 'private';
            slugIsManual = false;
            currentPreviewToken = '';
            currentHasWarnings = false;
            if (unpublishBtn) unpublishBtn.style.display = 'none';
            if (deleteBtn) deleteBtn.style.display = 'none';
            if (modeHeading) modeHeading.textContent = 'Author / Paste Entry (L0 Immediate Publish)';
            if (stateBadge) stateBadge.textContent = 'Mode: Paste / Guided / Freeform';
            const redactBoxEl = document.getElementById('redaction-preview-box');
            if (redactBoxEl) redactBoxEl.innerHTML = '';
            const inspHeading = document.getElementById('inspector-heading');
            if (inspHeading) inspHeading.textContent = 'Inspector: New Draft';
            const revListEl = document.getElementById('inspector-revisions-list');
            if (revListEl) revListEl.innerHTML = '<p style="color:var(--text-muted);margin:0">No revisions yet (new draft).</p>';
          });
        }

        if (saveDraftBtn) {
          saveDraftBtn.addEventListener('click', async function() {
            const text = document.getElementById('entry-body')?.value || '';
            const title = document.getElementById('entry-title')?.value || '';
            let slug = document.getElementById('entry-slug')?.value || '';
            if (!slug && title) slug = slugify(title);

            if (!text || !text.trim()) {
              banner.innerHTML = '<div class="later-thinking-banner" role="alert">Body content is required before saving.</div>';
              return;
            }
            if (!title.trim()) {
              banner.innerHTML = '<div class="later-thinking-banner" role="alert">Title is required before saving.</div>';
              return;
            }

            const isEdit = entryIdInput && entryIdInput.value;
            if (isEdit) {
              const entryId = entryIdInput.value;
              try {
                const res = await apiClient('/api/entries/' + entryId, {
                  method: 'PUT',
                  body: JSON.stringify({
                    title: title,
                    profile: document.getElementById('entry-profile')?.value || 'case-study',
                    visibility: 'private'
                  })
                });
                if (res.ok) {
                  // Add new revision
                  await apiClient('/api/entries/' + entryId + '/revisions', {
                    method: 'POST',
                    body: JSON.stringify({
                      body_md: text,
                      temporal_level: 'exact',
                      valid_from: new Date(document.getElementById('entry-date')?.value || Date.now()).toISOString(),
                      is_hindsight: document.getElementById('entry-hindsight')?.checked || false
                    })
                  });
                  banner.innerHTML = '<div class="as-of-banner">Saved draft "' + escapeClientHtml(title) + '" (private).</div>';
                  showUndoBanner('Saved draft "' + escapeClientHtml(title) + '".', async function() {
                    banner.innerHTML = '<div class="later-thinking-banner">Undo: Draft save acknowledged.</div>';
                  });
                } else {
                  banner.innerHTML = renderAdminError(res);
                }
              } catch (err) {
                banner.innerHTML = '<div class="later-thinking-banner" role="alert">Network error saving draft.</div>';
              }
            } else {
              try {
                const payload = {
                  title: title,
                  slug: slug,
                  profile: document.getElementById('entry-profile')?.value || 'case-study',
                  body_md: text,
                  valid_from: new Date(document.getElementById('entry-date')?.value || Date.now()).toISOString(),
                  is_hindsight: document.getElementById('entry-hindsight')?.checked || false,
                  temporal_level: 'exact',
                  visibility: 'private',
                  view: 'article'
                };
                const res = await apiClient('/api/entries', {
                  method: 'POST',
                  body: JSON.stringify(payload)
                });
                if (res.ok) {
                  const data = await res.json();
                  if (entryIdInput) entryIdInput.value = data.entry.id;
                  if (modeHeading) modeHeading.textContent = 'Edit Entry: ' + data.entry.title;
                  if (stateBadge) stateBadge.textContent = 'State: PRIVATE (Draft)';
                  banner.innerHTML = '<div class="as-of-banner">Created draft "' + escapeClientHtml(payload.title) + '".</div>';
                  showUndoBanner('Created draft "' + escapeClientHtml(payload.title) + '".', async function() {
                    await apiClient('/api/entries/' + data.entry.id, { method: 'DELETE' });
                    banner.innerHTML = '<div class="later-thinking-banner">Undone: Draft deleted.</div>';
                  });
                } else {
                  banner.innerHTML = renderAdminError(res);
                }
              } catch (err) {
                banner.innerHTML = '<div class="later-thinking-banner" role="alert">Network error creating draft.</div>';
              }
            }
          });
        }

        if (unpublishBtn) {
          unpublishBtn.addEventListener('click', async function() {
            const entryId = entryIdInput?.value;
            if (!entryId) return;
            const title = document.getElementById('entry-title')?.value || '';
            try {
              const res = await apiClient('/api/entries/' + entryId, {
                method: 'PUT',
                body: JSON.stringify({ visibility: 'private' })
              });
              if (res.ok) {
                unpublishBtn.style.display = 'none';
                if (stateBadge) stateBadge.textContent = 'State: PRIVATE (Unpublished)';
                banner.innerHTML = '<div class="as-of-banner">Unpublished "' + escapeClientHtml(title) + '". Returned to private draft state.</div>';
                showUndoBanner('Unpublished "' + escapeClientHtml(title) + '".', async function() {
                  await apiClient('/api/entries/' + entryId, {
                    method: 'PUT',
                    body: JSON.stringify({ visibility: 'public' })
                  });
                  unpublishBtn.style.display = 'inline-block';
                  if (stateBadge) stateBadge.textContent = 'State: PUBLIC';
                  banner.innerHTML = '<div class="as-of-banner">Undone: Republished "' + escapeClientHtml(title) + '".</div>';
                });
              } else {
                banner.innerHTML = renderAdminError(res);
              }
            } catch (err) {
              banner.innerHTML = '<div class="later-thinking-banner" role="alert">Network error unpublishing entry.</div>';
            }
          });
        }

        if (deleteBtn) {
          deleteBtn.addEventListener('click', async function() {
            const entryId = entryIdInput?.value;
            if (!entryId) return;
            const title = document.getElementById('entry-title')?.value || '';
            if (!window.confirm('Delete entry "' + title + '" and all its revisions, spans, and claims? (§15)')) {
              return;
            }
            try {
              const res = await apiClient('/api/entries/' + entryId, { method: 'DELETE' });
              if (res.ok) {
                const data = await res.json();
                banner.innerHTML = '<div class="as-of-banner">Deleted "' + escapeClientHtml(title) + '" (' + (data.report?.deletedRevisions || 1) + ' revisions purged).</div>';
                if (newEntryBtn) newEntryBtn.click();
                const itemEl = document.querySelector('.admin-entry-item[data-entry-id="' + entryId + '"]');
                if (itemEl) itemEl.remove();
              } else {
                banner.innerHTML = renderAdminError(res);
              }
            } catch (err) {
              banner.innerHTML = '<div class="later-thinking-banner" role="alert">Network error deleting entry.</div>';
            }
          });
        }

        // Initialize killswitch state from server settings
        apiClient('/api/settings').then(function(res) {
          if (res.ok) return res.json();
        }).then(function(data) {
          if (data && data.runtime && killBtn) {
            answeringEnabled = data.runtime.automatedAnsweringEnabled;
            killBtn.setAttribute('aria-pressed', answeringEnabled ? 'true' : 'false');
            killBtn.textContent = answeringEnabled ? 'Pause Automated Answering' : 'Resume Automated Answering';
          }
        }).catch(function() {});

        function escapeClientHtml(str) {
          return String(str || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
        }

        async function runRedactionCheck() {
          const textEl = document.getElementById('entry-body');
          const text = textEl ? textEl.value : '';
          const tokenInput = document.getElementById('entry-preview-token');
          // State 1: checking
          redactBox.innerHTML = '<div class="later-thinking-banner" data-state="checking" role="status">Checking for confidential data...</div>';
          try {
            const res = await apiClient('/api/entries/redaction-preview', {
              method: 'POST',
              body: JSON.stringify({ text: text })
            });
            if (res.ok) {
              const data = await res.json();
              currentPreviewToken = data.redactionPreviewToken || '';
              currentHasWarnings = Array.isArray(data.warnings) && data.warnings.length > 0;
              if (tokenInput) tokenInput.value = currentPreviewToken;

              const tokenBadgeHtml = currentPreviewToken
                ? '<div class="preview-token-badge" id="preview-token-badge" data-token="' + escapeClientHtml(currentPreviewToken) + '" style="font-size:12px;color:var(--text-muted);margin-top:6px">Signed preview token: <code>' + escapeClientHtml(currentPreviewToken.slice(0, 16)) + '...</code></div>'
                : '';

              if (Array.isArray(data.warnings) && data.warnings.length > 0) {
                // State 3: needs review (amber banner, never green)
                const warningList = data.warnings.map(function(w) {
                  return escapeClientHtml(w.type) + ' ("' + escapeClientHtml(w.match) + '")';
                }).join(', ');
                redactBox.innerHTML = '<div class="later-thinking-banner" data-state="needs-review" role="alert">' +
                  '<strong>Needs Review (' + data.warnings.length + ' findings):</strong> ' + warningList +
                  ' — Confirm none of this is under NDA before publishing.</div>' + tokenBadgeHtml;
              } else if (Array.isArray(data.warnings) && data.warnings.length === 0) {
                // State 2: clean (the ONLY state that can ever be green)
                redactBox.innerHTML = '<div class="chip" data-state="clean" style="border-color:var(--role-outcome)">✓ No confidential secrets or NDA markers detected.</div>' + tokenBadgeHtml;
              } else {
                currentPreviewToken = '';
                if (tokenInput) tokenInput.value = '';
                // State 4: could not check
                redactBox.innerHTML = '<div class="later-thinking-banner" data-state="could-not-check" role="alert">' +
                  "Couldn't check for private details." +
                  ' <button type="button" class="btn btn-secondary" id="btn-redaction-retry" style="margin-left:8px;padding:2px 8px;font-size:12px">Retry</button></div>';
                const retryBtn = document.getElementById('btn-redaction-retry');
                if (retryBtn) retryBtn.addEventListener('click', runRedactionCheck);
              }
            } else {
              currentPreviewToken = '';
              if (tokenInput) tokenInput.value = '';
              // State 4: could not check (HTTP error)
              let advice = 'request failed (HTTP ' + res.status + '). Please check inputs and retry.';
              if (res.status === 401) {
                advice = 'Your session has expired. <a href="/admin/login" style="margin-left:8px;font-weight:600">Sign in again →</a>, then retry.';
              } else if (res.status === 403) {
                advice = 'Security check failed (CSRF token invalid or missing). Please refresh and retry.';
              } else if (res.status >= 500) {
                advice = 'Server error (HTTP ' + res.status + '). Please retry.';
              }
              redactBox.innerHTML = '<div class="later-thinking-banner" role="alert" data-error="' + res.status + '" data-state="could-not-check">' +
                "Couldn't check for private details: " + advice +
                ' <button type="button" class="btn btn-secondary" id="btn-redaction-retry" style="margin-left:8px;padding:2px 8px;font-size:12px">Retry</button></div>';
              const retryBtn = document.getElementById('btn-redaction-retry');
              if (retryBtn) retryBtn.addEventListener('click', runRedactionCheck);
            }
          } catch (err) {
            currentPreviewToken = '';
            if (tokenInput) tokenInput.value = '';
            // State 4: could not check (network/fetch error)
            redactBox.innerHTML = '<div class="later-thinking-banner" role="alert" data-state="could-not-check">' +
              "Couldn't check for private details: network error connecting to server." +
              ' <button type="button" class="btn btn-secondary" id="btn-redaction-retry" style="margin-left:8px;padding:2px 8px;font-size:12px">Retry</button></div>';
            const retryBtn = document.getElementById('btn-redaction-retry');
            if (retryBtn) retryBtn.addEventListener('click', runRedactionCheck);
          }
        }

        if (redactBtn) {
          redactBtn.addEventListener('click', runRedactionCheck);
        }

        // Token invalidated after a body edit
        const bodyInputEl = document.getElementById('entry-body');
        if (bodyInputEl) {
          bodyInputEl.addEventListener('input', function() {
            if (currentPreviewToken) {
              currentPreviewToken = '';
              const tokenInput = document.getElementById('entry-preview-token');
              if (tokenInput) tokenInput.value = '';
              const badge = document.getElementById('preview-token-badge');
              if (badge) badge.remove();
              redactBox.innerHTML = '<div class="later-thinking-banner" data-state="invalidated" role="status">Body edited since last check — preview token invalidated. Re-run "Preview Redaction (§4.3)" before publishing.</div>';
            }
          });
        }

        if (form) {
          form.addEventListener('submit', async function(e) {
            e.preventDefault();
            const text = document.getElementById('entry-body').value;
            if (!text || !text.trim()) {
              banner.innerHTML = '<div class="later-thinking-banner" role="alert">Body content is required before publishing.</div>';
              return;
            }

            // Publish gate: signed preview token required
            if (!currentPreviewToken) {
              banner.innerHTML = '<div class="later-thinking-banner" role="alert" data-gate="preview-token">Redaction preview check is required before publishing. Please click "Preview Redaction (§4.3)".</div>';
              return;
            }

            const ndaCheckbox = document.getElementById('entry-nda-confirmed');
            const ndaConfirmed = ndaCheckbox ? ndaCheckbox.checked : false;

            // Publish gate: NDA confirmation required when warnings exist
            if (currentHasWarnings && !ndaConfirmed) {
              banner.innerHTML = '<div class="later-thinking-banner" role="alert" data-gate="nda-confirmed">Confidentiality &amp; NDA confirmation is required before publishing entries with potential secrets or exclusion warnings.</div>';
              return;
            }

            const payload = {
              title: document.getElementById('entry-title').value,
              slug: document.getElementById('entry-slug').value,
              profile: document.getElementById('entry-profile').value,
              body_md: text,
              valid_from: new Date(document.getElementById('entry-date').value).toISOString(),
              is_hindsight: document.getElementById('entry-hindsight').checked,
              temporal_level: 'exact',
              visibility: 'public',
              view: 'article',
              redactionPreviewToken: currentPreviewToken,
              nda_confirmed: ndaConfirmed
            };
            try {
              const res = await apiClient('/api/entries', {
                method: 'POST',
                body: JSON.stringify(payload)
              });
              if (res.ok) {
                currentPreviewToken = '';
                const tokenInput = document.getElementById('entry-preview-token');
                if (tokenInput) tokenInput.value = '';
                banner.innerHTML = '<div class="as-of-banner">Published "' + escapeClientHtml(payload.title) + '" at L0. <a href="/work/' + escapeClientHtml(payload.slug) + '">View entry →</a></div>';
              } else {
                banner.innerHTML = renderAdminError(res);
              }
            } catch (err) {
              banner.innerHTML = '<div class="later-thinking-banner" role="alert">Network error connecting to server. Please retry.</div>';
            }
          });
        }

        if (killBtn) {
          killBtn.addEventListener('click', async function() {
            const nextState = !answeringEnabled;
            try {
              const res = await apiClient('/api/settings/routing', {
                method: 'PATCH',
                body: JSON.stringify({ automatedAnsweringEnabled: nextState })
              });
              if (res.ok) {
                answeringEnabled = nextState;
                killBtn.setAttribute('aria-pressed', answeringEnabled ? 'true' : 'false');
                killBtn.textContent = answeringEnabled ? 'Pause Automated Answering' : 'Resume Automated Answering';
                banner.innerHTML = '<div class="as-of-banner">Automated answering is now <strong>' + (answeringEnabled ? 'ENABLED' : 'PAUSED (Handoff only)') + '</strong>.</div>';
              } else {
                banner.innerHTML = renderAdminError(res);
              }
            } catch (err) {
              banner.innerHTML = '<div class="later-thinking-banner" role="alert">Network error connecting to server. Please retry.</div>';
            }
          });
        }

        if (drillBtn) {
          drillBtn.addEventListener('click', async function() {
            try {
              const res = await apiClient('/api/settings/backups/run-drill', { method: 'POST' });
              if (res.ok) {
                const data = await res.json();
                banner.innerHTML = '<div class="as-of-banner">Encrypted Backup (' + data.encryptedWith + ') &amp; Scratch Restore Drill: <strong>' + data.status.toUpperCase() + '</strong> (' + data.checks.entriesCount + ' entries verified).</div>';
              } else {
                banner.innerHTML = renderAdminError(res);
              }
            } catch (err) {
              banner.innerHTML = '<div class="later-thinking-banner" role="alert">Network error connecting to server. Please retry.</div>';
            }
          });
        }
      })();
    </script>
  `;

  return renderLayout('Admin Workspace', '/admin', content);
}

export function renderAdminLoginPage(): string {
  const content = `
    <div style="max-width:440px;margin:48px auto;padding:24px;border:1px solid var(--rule);background:var(--surface-page)">
      <h1 style="font-size:24px;margin:0 0 8px 0">Owner Sign in</h1>
      <p style="font-size:14px;color:var(--text-muted);margin:0 0 20px 0">
        Enter your admin credentials and 6-digit TOTP code to access the workspace.
      </p>

      <div id="login-error" role="alert" style="margin-bottom:16px;display:none"></div>

      <form id="admin-login-form">
        <div style="margin-bottom:12px">
          <label for="login-username" style="display:block;font-size:13px;font-weight:600;margin-bottom:4px">Username</label>
          <input id="login-username" type="text" class="ask-input" style="width:100%;padding:8px" autocomplete="username" required />
        </div>
        <div style="margin-bottom:12px">
          <label for="login-password" style="display:block;font-size:13px;font-weight:600;margin-bottom:4px">Password</label>
          <input id="login-password" type="password" class="ask-input" style="width:100%;padding:8px" autocomplete="current-password" required />
        </div>
        <div style="margin-bottom:16px">
          <label for="login-totp" style="display:block;font-size:13px;font-weight:600;margin-bottom:4px">Authenticator (TOTP) Code</label>
          <input id="login-totp" type="text" pattern="[0-9]{6}" maxlength="6" class="ask-input" style="width:100%;padding:8px;font-family:var(--font-code);letter-spacing:2px" placeholder="123456" autocomplete="one-time-code" required />
        </div>
        <button type="submit" class="btn" style="width:100%;padding:10px">Sign in</button>
      </form>
      <div style="margin-top:16px;font-size:12px;color:var(--text-muted);line-height:1.4">
        Login attempts are rate-limited to 5 per 15 minutes. If throttled: "Too many failed login attempts. Try again later."
      </div>
    </div>
    <script>
      (function() {
        const form = document.getElementById('admin-login-form');
        const errBox = document.getElementById('login-error');

        ${ADMIN_API_CLIENT_SCRIPT}

        form.addEventListener('submit', async function(e) {
          e.preventDefault();
          errBox.style.display = 'none';
          const username = document.getElementById('login-username').value;
          const password = document.getElementById('login-password').value;
          const totpCode = document.getElementById('login-totp').value;

          try {
            const res = await apiClient('/api/auth/login', {
              method: 'POST',
              body: JSON.stringify({ username, password, totpCode })
            });
            const data = await res.json();
            if (res.ok) {
              if (data.csrfToken) {
                sessionStorage.setItem('lp_csrf_token', data.csrfToken);
              }
              function sanitizeNext(target) {
                if (!target || typeof target !== 'string') return '/admin';
                var trimmed = target.trim();
                if (!trimmed || !trimmed.startsWith('/')) return '/admin';
                var bslash = String.fromCharCode(92);
                if (trimmed.startsWith('//') || trimmed.startsWith('/' + bslash) || trimmed.startsWith(bslash)) return '/admin';
                var decoded = trimmed;
                for (var i = 0; i < 3; i++) {
                  try {
                    var nextDecoded = decodeURIComponent(decoded);
                    if (nextDecoded === decoded) break;
                    decoded = nextDecoded;
                  } catch (_) {
                    return '/admin';
                  }
                }
                decoded = decoded.trim();
                if (!decoded.startsWith('/') || decoded.startsWith('//') || decoded.startsWith('/' + bslash) || decoded.startsWith(bslash)) return '/admin';
                for (var j = 0; j < decoded.length; j++) {
                  var code = decoded.charCodeAt(j);
                  if (code <= 32 || code === 127) return '/admin';
                }
                if (decoded.indexOf(bslash) !== -1) return '/admin';
                try {
                  var u = new URL(trimmed, window.location.origin);
                  if (u.origin !== window.location.origin) return '/admin';
                  if (u.protocol !== window.location.protocol) return '/admin';
                  if (!u.pathname.startsWith('/') || u.pathname.startsWith('//') || u.pathname.indexOf(bslash) !== -1) {
                    return '/admin';
                  }
                  return u.pathname + u.search + u.hash;
                } catch (_) {
                  return '/admin';
                }
              }
              const rawNext = new URLSearchParams(window.location.search).get('next');
              window.location.href = sanitizeNext(rawNext);
            } else if (res.status === 401) {
              errBox.className = 'later-thinking-banner';
              errBox.textContent = data.error || 'Invalid credentials or TOTP code.';
              errBox.style.display = 'block';
            } else if (res.status === 403) {
              errBox.className = 'later-thinking-banner';
              errBox.textContent = data.error || 'Access forbidden (security check failed).';
              errBox.style.display = 'block';
            } else if (res.status >= 500) {
              errBox.className = 'later-thinking-banner';
              errBox.textContent = 'Server error during sign-in. Please retry.';
              errBox.style.display = 'block';
            } else {
              errBox.className = 'later-thinking-banner';
              errBox.textContent = data.error || ('Sign-in failed (HTTP ' + res.status + ')');
              errBox.style.display = 'block';
            }
          } catch (err) {
            errBox.className = 'later-thinking-banner';
            errBox.textContent = 'Network error connecting to login server.';
            errBox.style.display = 'block';
          }
        });
      })();
    </script>
  `;
  return renderLayout('Sign in', '/admin/login', content);
}

export function renderAdminSetupPage(): string {
  const content = `
    <div style="max-width:560px;margin:40px auto;padding:24px;border:1px solid var(--rule);background:var(--surface-page)">
      <span class="chip" style="margin-bottom:8px">Step 1 of 6 · First-Run Wizard (§13.13)</span>
      <h1 style="font-size:26px;margin:4px 0 12px 0">Owner Account Setup</h1>
      <p style="font-size:14px;color:var(--text-muted);margin:0 0 20px 0">
        Initialize your private administrative account. Subsequent steps configure hosting preset, provider keys, notification adapter, backup destination, and theme.
      </p>

      <div id="setup-status" role="alert" style="margin-bottom:16px;display:none"></div>

      <form id="admin-setup-form">
        <div style="margin-bottom:12px">
          <label for="setup-username" style="display:block;font-size:13px;font-weight:600;margin-bottom:4px">Owner Username</label>
          <input id="setup-username" type="text" class="ask-input" style="width:100%;padding:8px" required />
        </div>
        <div style="margin-bottom:12px">
          <label for="setup-password" style="display:block;font-size:13px;font-weight:600;margin-bottom:4px">Master Password (min 12 chars)</label>
          <input id="setup-password" type="password" minlength="12" class="ask-input" style="width:100%;padding:8px" required />
        </div>
        <div style="margin-bottom:16px">
          <label for="setup-totp-secret" style="display:block;font-size:13px;font-weight:600;margin-bottom:4px">TOTP Secret Hex (optional, generated if blank)</label>
          <input id="setup-totp-secret" type="text" class="ask-input" style="width:100%;padding:8px;font-family:var(--font-code)" placeholder="Leave blank to generate 20-byte random secret" />
        </div>
        <button type="submit" class="btn" style="width:100%;padding:10px">Complete Account Setup &amp; View TOTP</button>
      </form>
    </div>
    <script>
      (function() {
        const form = document.getElementById('admin-setup-form');
        const statusBox = document.getElementById('setup-status');

        ${ADMIN_API_CLIENT_SCRIPT}

        form.addEventListener('submit', async function(e) {
          e.preventDefault();
          statusBox.style.display = 'none';
          const username = document.getElementById('setup-username').value;
          const password = document.getElementById('setup-password').value;
          const totpSecret = document.getElementById('setup-totp-secret').value || undefined;

          try {
            const res = await apiClient('/api/auth/setup', {
              method: 'POST',
              body: JSON.stringify({ username, password, totpSecret })
            });
            const data = await res.json();
            if (res.ok) {
              statusBox.className = 'as-of-banner';
              statusBox.innerHTML = '<strong>Setup Completed!</strong> Save your TOTP secret hex: <code>' + data.totpSecret + '</code>. Your initial API bearer token is: <code>' + data.bearerToken + '</code>. <br/><a href="/admin/login" class="btn" style="display:inline-block;margin-top:8px">Proceed to Sign in →</a>';
              statusBox.style.display = 'block';
              form.style.display = 'none';
            } else if (res.status === 409) {
              statusBox.className = 'later-thinking-banner';
              statusBox.textContent = data.error || 'Account setup already completed.';
              statusBox.style.display = 'block';
            } else if (res.status >= 500) {
              statusBox.className = 'later-thinking-banner';
              statusBox.textContent = 'Server error during setup. Please retry.';
              statusBox.style.display = 'block';
            } else {
              statusBox.className = 'later-thinking-banner';
              statusBox.textContent = data.error || ('Setup failed (HTTP ' + res.status + ')');
              statusBox.style.display = 'block';
            }
          } catch (err) {
            statusBox.className = 'later-thinking-banner';
            statusBox.textContent = 'Network error during setup.';
            statusBox.style.display = 'block';
          }
        });
      })();
    </script>
  `;
  return renderLayout('First-Run Setup', '/admin/setup', content);
}

export async function renderAdminImportPage(repo: IPortfolioRepository): Promise<string> {
  const content = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:8px">
      <div>
        <h1 style="font-family:var(--font-reading);font-size:28px;margin:0">Import &amp; Triage</h1>
        <p style="color:var(--text-muted);margin:4px 0 0;font-size:14px">
          Connect or paste existing material, plan processing budget, and triage with confidence sorting and keyboard controls (§6.2, §12.6, 20261020-UX-07).
        </p>
      </div>
      <a href="/admin" class="btn btn-secondary" style="text-decoration:none">← Back to Workspace</a>
    </div>

    <!-- Triage Stepper -->
    <div class="triage-stepper" role="navigation" aria-label="Import stages">
      <div class="triage-step active" id="step-tab-add">1. Add Material</div>
      <div class="triage-step" id="step-tab-plan">2. Import Planner</div>
      <div class="triage-step" id="step-tab-triage">3. Triage &amp; Review</div>
    </div>

    <div id="import-status-banner" role="status" aria-live="polite" style="margin-bottom:16px"></div>

    <!-- Step 1: Add Material -->
    <div id="import-step-add" style="display:block">
      <div class="admin-pane" style="max-width:800px">
        <h2 style="font-size:18px;margin:0 0 8px 0">Add Existing Material</h2>
        <p style="font-size:13px;color:var(--text-muted);margin:0 0 16px 0">
          Paste one or more Markdown articles, notes, or case studies (separate multiple entries with <code>---</code>).
        </p>

        <div style="margin-bottom:12px">
          <label for="import-paste-area" style="font-size:13px;font-weight:600;display:block;margin-bottom:4px">Markdown Content</label>
          <textarea id="import-paste-area" rows="10" class="ask-input" style="width:100%;font-family:var(--font-code);font-size:13px" placeholder="# Migrating to Postgres Advisory Locks&#10;&#10;In 2024 we eliminated lock contention by migrating to PostgreSQL 15 advisory locks...&#10;&#10;---&#10;&#10;# Edge Microservice Architecture&#10;&#10;Designed multi-region edge gateways on Cloudflare Workers..."></textarea>
        </div>

        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
          <button type="button" class="btn" id="btn-generate-plan">Generate Processing Plan →</button>
          <button type="button" class="btn btn-secondary" id="btn-load-sample">Load Sample Entries</button>
        </div>
      </div>
    </div>

    <!-- Step 2: Import Planner -->
    <div id="import-step-plan" style="display:none">
      <div class="admin-pane" style="max-width:800px">
        <h2 style="font-size:18px;margin:0 0 8px 0">Import Processing Planner (§13.6, §21)</h2>
        <p style="font-size:13px;color:var(--text-muted);margin:0 0 16px 0">
          Estimated token workload and turnaround schedule based on detected document length.
        </p>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px">
          <div style="border:1px solid var(--rule);padding:16px;border-radius:var(--radius-control);background:var(--surface-raised)">
            <h3 style="font-size:15px;margin:0 0 8px 0">Free Limits (Zero Cost)</h3>
            <div id="plan-free-est" style="font-size:14px;font-weight:600;color:var(--role-outcome)">Calculating...</div>
            <p style="font-size:12px;color:var(--text-muted);margin:8px 0 0 0">
              Runs within local or free-tier quotas. Enrichment throttles across daily allocation.
            </p>
          </div>
          <div style="border:1px solid var(--rule);padding:16px;border-radius:var(--radius-control);background:var(--surface-raised)">
            <h3 style="font-size:15px;margin:0 0 8px 0">Fast Cloud Acceleration</h3>
            <div id="plan-paid-est" style="font-size:14px;font-weight:600;color:var(--accent)">Calculating...</div>
            <p style="font-size:12px;color:var(--text-muted);margin:8px 0 0 0">
              Parallel execution via external LLM provider. Clearly labeled cost without default selection.
            </p>
          </div>
        </div>

        <div style="display:flex;gap:8px">
          <button type="button" class="btn" id="btn-proceed-triage">Proceed to Triage →</button>
          <button type="button" class="btn btn-secondary" id="btn-back-add">← Back</button>
        </div>
      </div>
    </div>

    <!-- Step 3: Triage & Review -->
    <div id="import-step-triage" style="display:none">
      <div class="triage-keys-legend" aria-label="Keyboard Shortcuts">
        <span><span class="key-badge">J</span> / <span class="key-badge">K</span> Navigate items</span>
        <span><span class="key-badge">A</span> Accept</span>
        <span><span class="key-badge">R</span> Reassign profile</span>
        <span><span class="key-badge">D</span> Set date</span>
        <span><span class="key-badge">S</span> Skip</span>
      </div>

      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:16px">
        <div style="display:flex;gap:6px;flex-wrap:wrap">
          <button type="button" class="btn btn-secondary" id="btn-key-prev"><span class="key-badge">K</span> Prev</button>
          <button type="button" class="btn btn-secondary" id="btn-key-next"><span class="key-badge">J</span> Next</button>
          <button type="button" class="btn btn-secondary" id="btn-key-accept"><span class="key-badge">A</span> Accept</button>
          <button type="button" class="btn btn-secondary" id="btn-key-reassign"><span class="key-badge">R</span> Reassign</button>
          <button type="button" class="btn btn-secondary" id="btn-key-date"><span class="key-badge">D</span> Set Date</button>
          <button type="button" class="btn btn-secondary" id="btn-key-skip"><span class="key-badge">S</span> Skip</button>
        </div>
        <div style="display:flex;gap:8px">
          <button type="button" class="btn btn-secondary" id="btn-bulk-accept">Bulk Accept All High-Confidence</button>
          <button type="button" class="btn" id="btn-commit-batch">Commit Accepted Items</button>
        </div>
      </div>

      <div id="triage-cards-container" style="max-width:850px"></div>
    </div>

    <script>
      (function() {
        ${ADMIN_API_CLIENT_SCRIPT}

        const banner = document.getElementById('import-status-banner');
        let currentStep = 'add';
        let documents = [];
        let triageItems = [];
        let selectedIndex = 0;

        function setStep(step) {
          currentStep = step;
          document.querySelectorAll('.triage-step').forEach(function(el) {
            el.classList.remove('active');
          });
          document.getElementById('import-step-add').style.display = step === 'add' ? 'block' : 'none';
          document.getElementById('import-step-plan').style.display = step === 'plan' ? 'block' : 'none';
          document.getElementById('import-step-triage').style.display = step === 'triage' ? 'block' : 'none';
          document.getElementById('step-tab-' + step)?.classList.add('active');
        }

        const sampleBatch = [
          '# Zero-Downtime Migration to Postgres Advisory Locks\\n\\nIn Q3 2024 we eliminated webhook race conditions by swapping Redis Redlock for Postgres 15 advisory locks. P99 latency dropped 42ms.',
          '# Edge-Native Analytics with ClickHouse and WebAssembly\\n\\nBuilt an edge metrics pipeline streaming telemetry directly to ClickHouse via vector embeddings.',
          '# Migrating Monolith to Event-Driven Core\\n\\nDecomposed the legacy order worker into decoupled event handlers using pg-boss.'
        ].join('\\n\\n---\\n\\n');

        const loadSampleBtn = document.getElementById('btn-load-sample');
        if (loadSampleBtn) {
          loadSampleBtn.addEventListener('click', function() {
            const pasteArea = document.getElementById('import-paste-area');
            if (pasteArea) pasteArea.value = sampleBatch;
          });
        }

        const generatePlanBtn = document.getElementById('btn-generate-plan');
        if (generatePlanBtn) {
          generatePlanBtn.addEventListener('click', async function() {
            const pasteArea = document.getElementById('import-paste-area');
            const rawText = pasteArea ? pasteArea.value.trim() : '';
            if (!rawText) {
              banner.innerHTML = '<div class="later-thinking-banner" role="alert">Please paste or enter Markdown content first.</div>';
              return;
            }

            const rawDocs = rawText.split(/\\n\\s*---\\s*\\n/).map(function(t) { return t.trim(); }).filter(Boolean);
            documents = rawDocs.map(function(text, idx) {
              const firstLine = text.split('\\n')[0].replace(/^#+\\s*/, '').trim();
              const title = firstLine || 'Imported Entry ' + (idx + 1);
              const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || ('imported-' + Date.now() + '-' + idx);
              return { title: title, slug: slug, text: text, body_md: text };
            });

            try {
              const res = await apiClient('/api/import/plan', {
                method: 'POST',
                body: JSON.stringify({ documents: documents })
              });
              if (res.ok) {
                const plan = await res.json();
                document.getElementById('plan-free-est').textContent = plan.freePlanEstimate || 'About 1 day within free limits';
                document.getElementById('plan-paid-est').textContent = plan.paidFastEstimate || 'Finish in minutes for ~$0.15';

                triageItems = documents.map(function(d, idx) {
                  return {
                    id: 'doc-' + idx,
                    title: d.title,
                    slug: d.slug,
                    body_md: d.body_md,
                    profile: 'case-study',
                    valid_from: new Date().toISOString().slice(0, 10),
                    confidence: 0.85 + (idx % 2) * 0.1,
                    status: 'pending'
                  };
                });

                setStep('plan');
                banner.innerHTML = '';
              } else {
                banner.innerHTML = '<div class="later-thinking-banner" role="alert">Planner calculation failed.</div>';
              }
            } catch (err) {
              banner.innerHTML = '<div class="later-thinking-banner" role="alert">Network error connecting to planner.</div>';
            }
          });
        }

        const proceedTriageBtn = document.getElementById('btn-proceed-triage');
        if (proceedTriageBtn) {
          proceedTriageBtn.addEventListener('click', function() {
            renderTriageCards();
            setStep('triage');
          });
        }

        const backAddBtn = document.getElementById('btn-back-add');
        if (backAddBtn) {
          backAddBtn.addEventListener('click', function() {
            setStep('add');
          });
        }

        function renderTriageCards() {
          const container = document.getElementById('triage-cards-container');
          if (!container) return;

          container.innerHTML = triageItems.map(function(item, idx) {
            const isSelected = idx === selectedIndex;
            const statusClass = item.status === 'accepted' ? 'status-accepted' : (item.status === 'skipped' ? 'status-skipped' : '');
            return '<div class="triage-card ' + (isSelected ? 'selected' : '') + ' ' + statusClass + '" data-index="' + idx + '" id="triage-card-' + idx + '">' +
              '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">' +
                '<strong>' + escapeClientHtml(item.title) + '</strong>' +
                '<span class="chip" style="font-size:11px">' + Math.round(item.confidence * 100) + '% confidence · ' + escapeClientHtml(item.status.toUpperCase()) + '</span>' +
              '</div>' +
              '<div style="font-size:12px;color:var(--text-muted);margin-bottom:8px">' +
                escapeClientHtml(item.body_md.slice(0, 140)) + '...' +
              '</div>' +
              '<div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap;font-size:12px">' +
                '<label>Profile: <select class="ask-input triage-profile" data-index="' + idx + '" style="padding:2px 4px;font-size:12px">' +
                  '<option value="case-study"' + (item.profile === 'case-study' ? ' selected' : '') + '>Case Study</option>' +
                  '<option value="decision-record"' + (item.profile === 'decision-record' ? ' selected' : '') + '>Decision Record</option>' +
                  '<option value="how-to"' + (item.profile === 'how-to' ? ' selected' : '') + '>How-to</option>' +
                '</select></label>' +
                '<label>Date: <input type="date" class="ask-input triage-date" data-index="' + idx + '" value="' + escapeClientHtml(item.valid_from) + '" style="padding:2px 4px;font-size:12px" /></label>' +
              '</div>' +
            '</div>';
          }).join('');

          // Bind card click selection
          container.querySelectorAll('.triage-card').forEach(function(card) {
            card.addEventListener('click', function() {
              const idx = parseInt(card.getAttribute('data-index') || '0', 10);
              selectTriageCard(idx);
            });
          });

          // Bind profile changes
          container.querySelectorAll('.triage-profile').forEach(function(sel) {
            sel.addEventListener('change', function(e) {
              const idx = parseInt(sel.getAttribute('data-index') || '0', 10);
              if (triageItems[idx]) triageItems[idx].profile = e.target.value;
            });
          });

          // Bind date changes
          container.querySelectorAll('.triage-date').forEach(function(inp) {
            inp.addEventListener('change', function(e) {
              const idx = parseInt(inp.getAttribute('data-index') || '0', 10);
              if (triageItems[idx]) triageItems[idx].valid_from = e.target.value;
            });
          });
        }

        function selectTriageCard(idx) {
          if (idx < 0 || idx >= triageItems.length) return;
          selectedIndex = idx;
          document.querySelectorAll('.triage-card').forEach(function(c, i) {
            c.classList.toggle('selected', i === selectedIndex);
          });
          const el = document.getElementById('triage-card-' + selectedIndex);
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }

        function acceptCurrent() {
          if (triageItems[selectedIndex]) {
            triageItems[selectedIndex].status = 'accepted';
            renderTriageCards();
            if (selectedIndex < triageItems.length - 1) selectTriageCard(selectedIndex + 1);
          }
        }

        function skipCurrent() {
          if (triageItems[selectedIndex]) {
            triageItems[selectedIndex].status = 'skipped';
            renderTriageCards();
            if (selectedIndex < triageItems.length - 1) selectTriageCard(selectedIndex + 1);
          }
        }

        function reassignCurrent() {
          if (triageItems[selectedIndex]) {
            const current = triageItems[selectedIndex].profile;
            const next = current === 'case-study' ? 'decision-record' : (current === 'decision-record' ? 'how-to' : 'case-study');
            triageItems[selectedIndex].profile = next;
            renderTriageCards();
          }
        }

        function focusDateCurrent() {
          const el = document.getElementById('triage-card-' + selectedIndex);
          if (el) {
            const inp = el.querySelector('.triage-date');
            if (inp) inp.focus();
          }
        }

        // On-screen buttons
        document.getElementById('btn-key-prev')?.addEventListener('click', function() { selectTriageCard(selectedIndex - 1); });
        document.getElementById('btn-key-next')?.addEventListener('click', function() { selectTriageCard(selectedIndex + 1); });
        document.getElementById('btn-key-accept')?.addEventListener('click', acceptCurrent);
        document.getElementById('btn-key-skip')?.addEventListener('click', skipCurrent);
        document.getElementById('btn-key-reassign')?.addEventListener('click', reassignCurrent);
        document.getElementById('btn-key-date')?.addEventListener('click', focusDateCurrent);

        document.getElementById('btn-bulk-accept')?.addEventListener('click', function() {
          triageItems.forEach(function(item) {
            if (item.confidence >= 0.8) item.status = 'accepted';
          });
          renderTriageCards();
        });

        // Keyboard handler
        window.addEventListener('keydown', function(e) {
          if (currentStep !== 'triage') return;
          const tag = (e.target && e.target.tagName) ? e.target.tagName.toLowerCase() : '';
          if (tag === 'input' || tag === 'textarea' || tag === 'select') return;

          const key = e.key.toLowerCase();
          if (key === 'j') {
            e.preventDefault();
            selectTriageCard(selectedIndex + 1);
          } else if (key === 'k') {
            e.preventDefault();
            selectTriageCard(selectedIndex - 1);
          } else if (key === 'a') {
            e.preventDefault();
            acceptCurrent();
          } else if (key === 's') {
            e.preventDefault();
            skipCurrent();
          } else if (key === 'r') {
            e.preventDefault();
            reassignCurrent();
          } else if (key === 'd') {
            e.preventDefault();
            focusDateCurrent();
          }
        });

        // Commit batch
        const commitBatchBtn = document.getElementById('btn-commit-batch');
        if (commitBatchBtn) {
          commitBatchBtn.addEventListener('click', async function() {
            const accepted = triageItems.filter(function(i) { return i.status === 'accepted'; });
            if (accepted.length === 0) {
              banner.innerHTML = '<div class="later-thinking-banner" role="alert">No items are marked as accepted. Use "A" or click Accept on items before committing.</div>';
              return;
            }

            try {
              const res = await apiClient('/api/import/batch', {
                method: 'POST',
                body: JSON.stringify({
                  items: accepted.map(function(item) {
                    return {
                      slug: item.slug,
                      title: item.title,
                      body_md: item.body_md,
                      profile: item.profile,
                      temporal_level: 'estimated',
                      valid_from: new Date(item.valid_from).toISOString()
                    };
                  }),
                  publishAsIs: false
                })
              });
              if (res.ok) {
                const data = await res.json();
                banner.innerHTML = '<div class="as-of-banner">Successfully imported ' + data.importedCount + ' entries! <a href="/admin" style="font-weight:700;margin-left:8px">Go to Admin Workspace →</a></div>';
              } else {
                banner.innerHTML = '<div class="later-thinking-banner" role="alert">Batch import failed (HTTP ' + res.status + ').</div>';
              }
            } catch (err) {
              banner.innerHTML = '<div class="later-thinking-banner" role="alert">Network error committing batch.</div>';
            }
          });
        }

        function escapeClientHtml(str) {
          return String(str || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
        }
      })();
    </script>
  `;
  return renderLayout('Import & Triage', '/admin/import', content);
}
