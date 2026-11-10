import { loadConfig } from '@living-portfolio/config';
import {
  DEFAULT_STRATA_THEME,
  computeStructureLevel,
  detectLaterThinking,
  generateGapQuestions,
  getProfile,
  getStructureLevelDetails,
  isTemporallyValid,
  verifyThemeConformance,
  type Entry,
  type Revision,
  type Span,
  type Facet,
  type Claim,
  type Evidence,
  type Relation,
} from '@living-portfolio/core';
import type { LivingPortfolioClient } from '@living-portfolio/client';
import { STRATA_DESIGN_SYSTEM_CSS } from './styles.js';
import { renderMarkdown } from './markdown.js';
import { renderEntryRow, renderField, renderButton, renderChip, formatOutcome, renderStrataDateGlyph } from './components/index.js';
import { formatMonthYear, formatEntryDateLine, formatPlural, STRINGS_EN, formatActionableError, WIZARD_STRINGS } from './strings.js';

export interface WebDataClient {
  entries?: {
    list: (params?: any) => Promise<{ entries: Entry[] }>;
    get: (id: string, options?: any) => Promise<any>;
    getBySlug?: (slug: string, options?: any) => Promise<any>;
  };
  listEntries: (opts?: any) => Promise<Entry[]>;
  getEntry: (id: string, vis?: any) => Promise<{ entry: Entry; currentRevision?: Revision | null; revisions?: Revision[] } | null>;
  getEntryBySlug: (slug: string, vis?: any) => Promise<{ entry: Entry; currentRevision?: Revision | null; revisions?: Revision[] } | null>;
  listAcceptedRelations: () => Promise<Relation[]>;
  getFacetsForEntry: (id: string) => Promise<Facet[]>;
  getSpans: (revId: string) => Promise<Span[]>;
  getClaimsForRevision: (revId: string) => Promise<Claim[]>;
  getEvidenceForEntry: (id: string) => Promise<Evidence[]>;
  listAnnotationsForRevision: (revId: string) => Promise<any[]>;
  getRevisions: (id: string) => Promise<Revision[]>;
  listVentures: () => Promise<any[]>;
  getEscalationByStatusToken: (token: string) => Promise<any>;
  getEscalations: () => Promise<any[]>;
  getScopedConstraints: () => Promise<any[]>;
  structure?: any;
  timeline?: any;
  inbox?: any;
  settings?: any;
}

/**
 * Normalizes input data source to standard client / repository methods.
 * Supports LivingPortfolioClient directly over HTTP/fetch, and provides
 * backward compatibility for existing in-memory tests without requiring @living-portfolio/db imports.
 */
export function adaptDataSource(source: any): WebDataClient {
  if (!source) return source;

  // If source already implements listEntries, it is already a repository or WebDataClient!
  if (typeof source.listEntries === 'function') {
    if (typeof source.listVentures !== 'function') {
      source.listVentures = async () => [];
    }
    if (typeof source.getEscalations !== 'function') {
      source.getEscalations = async () => [];
    }
    if (typeof source.getScopedConstraints !== 'function') {
      source.getScopedConstraints = async () => [];
    }
    if (typeof source.getEscalationByStatusToken !== 'function') {
      source.getEscalationByStatusToken = async () => null;
    }
    return source;
  }

  // If source already has .entries.list, it's a LivingPortfolioClient!
  if (source.entries && typeof source.entries.list === 'function') {
    return {
      ...source,
      listEntries: async (opts?: any) => {
        const res = await source.entries.list(opts);
        return res?.entries || [];
      },
      getEntry: async (id: string, vis?: any) => {
        const res = await source.entries.get(id);
        if (!res) return null;
        return {
          entry: res.entry || res,
          currentRevision: res.revision || res.currentRevision || null,
          revisions: res.revisions || [],
        };
      },
      getEntryBySlug: async (slug: string, vis?: any) => {
        const res = source.entries.getBySlug ? await source.entries.getBySlug(slug) : await source.entries.get(slug);
        if (!res) return null;
        return {
          entry: res.entry || res,
          currentRevision: res.revision || res.currentRevision || null,
          revisions: res.revisions || [],
        };
      },
      listAcceptedRelations: async () => {
        if (typeof source.listAcceptedRelations === 'function') return source.listAcceptedRelations();
        if (typeof source.structure?.relations === 'function') {
          const res = await source.structure.relations();
          return res?.relations || [];
        }
        if (typeof source.structure?.listRelations === 'function') {
          const res = await source.structure.listRelations();
          return res?.relations || [];
        }
        return [];
      },
      getFacetsForEntry: async (id: string) => {
        if (typeof source.getFacetsForEntry === 'function') return source.getFacetsForEntry(id);
        if (typeof source.structure?.getFacets === 'function') {
          try {
            const res = await source.structure.getFacets(id);
            return res?.facets || [];
          } catch {}
        }
        return [];
      },
      getSpans: async (revId: string) => {
        if (typeof source.getSpans === 'function') return source.getSpans(revId);
        if (typeof source.structure?.getSpans === 'function') {
          try {
            const res = await source.structure.getSpans(revId);
            return res?.spans || [];
          } catch {}
        }
        return [];
      },
      getClaimsForRevision: async (revId: string) => {
        if (typeof source.getClaimsForRevision === 'function') return source.getClaimsForRevision(revId);
        return [];
      },
      getEvidenceForEntry: async (id: string) => {
        if (typeof source.getEvidenceForEntry === 'function') return source.getEvidenceForEntry(id);
        if (typeof source.structure?.getEvidence === 'function') {
          try {
            const res = await source.structure.getEvidence(id);
            return res?.evidence || [];
          } catch {}
        }
        return [];
      },
      listAnnotationsForRevision: async (revId: string) => {
        if (typeof source.listAnnotationsForRevision === 'function') return source.listAnnotationsForRevision(revId);
        return [];
      },
      getRevisions: async (id: string) => {
        if (typeof source.getRevisions === 'function') return source.getRevisions(id);
        const res = await source.entries.get(id);
        return res?.revisions || [];
      },
      listVentures: async () => {
        if (typeof source.listVentures === 'function') return source.listVentures();
        if (typeof source.timeline?.ventures === 'function') {
          const res = await source.timeline.ventures();
          return res?.ventures || [];
        }
        return [];
      },
      getEscalationByStatusToken: async (token: string) => {
        if (typeof source.getEscalationByStatusToken === 'function') return source.getEscalationByStatusToken(token);
        if (typeof source.inbox?.escalations?.get === 'function') {
          const res = await source.inbox.escalations.get(token);
          return res?.escalation || null;
        }
        return null;
      },
      getEscalations: async () => {
        if (typeof source.getEscalations === 'function') return source.getEscalations();
        if (typeof source.inbox?.escalations?.list === 'function') {
          const res = await source.inbox.escalations.list();
          return res?.escalations || [];
        }
        return [];
      },
      getScopedConstraints: async () => {
        if (typeof source.getScopedConstraints === 'function') return source.getScopedConstraints();
        if (typeof source.structure?.constraints === 'function') {
          const res = await source.structure.constraints();
          return res?.constraints || [];
        }
        return [];
      },
    };
  }

  return source;
}

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

export function renderMarkdownToHtml(md: string): string {
  if (!md || typeof md !== 'string') return '';
  return renderMarkdown(md, { demoteHeadings: true });
}

export interface RenderLayoutOptions {
  nonce?: string;
  headSlot?: string;
  headerSlot?: string;
  footerSlot?: string;
  clientScript?: string;
}

export function renderLayout(
  title: string,
  activePath: string,
  mainContentHtml: string,
  options?: RenderLayoutOptions
): string {
  const cfg = loadConfig();
  const navItems = [
    { href: '/work', label: 'Work' },
    { href: '/writing', label: 'Writing' },
    { href: '/build', label: 'Build' },
    { href: '/timeline', label: 'Timeline' },
    { href: '/ask', label: 'Ask' },
  ];

  const navHtml = navItems
    .map(
      (item) =>
        `<a href="${item.href}"${activePath === item.href || (item.href !== '/' && activePath.startsWith(item.href)) ? ' aria-current="page"' : ''}>${item.label}</a>`
    )
    .join('\n          ');

  const safeLogoUrl = sanitizeHttpUrl(cfg.PUBLIC_SITE_LOGO_URL);
  const brandHtml = safeLogoUrl
    ? `<img src="${escapeHtml(safeLogoUrl)}" alt="${escapeHtml(cfg.PUBLIC_OWNER_NAME)}" style="height:24px;vertical-align:middle;margin-right:8px" />${escapeHtml(cfg.PUBLIC_OWNER_NAME)}`
    : escapeHtml(cfg.PUBLIC_OWNER_NAME);

  const stagingBannerHtml =
    cfg.DEPLOYMENT_CLASS === 'staging'
      ? `<div class="as-of-banner" data-banner="staging-synthetic-only" role="status" style="position:sticky;top:0;z-index:999;margin:0;border-radius:0;justify-content:center;background:var(--surface-raised);border-bottom:2px solid var(--role-challenge,#f59e0b)"><strong>Staging: synthetic data only.</strong></div>`
      : '';

  const robotsMetaHtml =
    cfg.DEPLOYMENT_CLASS === 'staging'
      ? '  <meta name="robots" content="noindex, nofollow" />\n'
      : '';

  const unofficialForkSlotHtml = cfg.PUBLIC_UNOFFICIAL_FORK_NOTICE
    ? `<div class="unofficial-fork-slot" data-slot="unofficial-fork-notice" style="margin-top:6px;font-size:13px;color:var(--text-muted)">${escapeHtml(cfg.PUBLIC_UNOFFICIAL_FORK_NOTICE)}</div>`
    : '';

  const nonceAttr = options?.nonce ? ` nonce="${escapeHtml(options.nonce)}"` : '';

  // Inject nonce into any <script> tags inside mainContentHtml if specified
  let safeMainContent = mainContentHtml;
  if (options?.nonce) {
    safeMainContent = safeMainContent.replace(
      /<script\b(?![^>]*\bnonce=)([^>]*)>/gi,
      `<script nonce="${escapeHtml(options.nonce)}"$1>`
    );
  }

  const headSlotHtml = options?.headSlot ? `  ${options.headSlot}\n` : '';
  const headerSlotHtml = options?.headerSlot ? `    ${options.headerSlot}\n` : '';
  const footerSlotHtml = options?.footerSlot ? `    ${options.footerSlot}\n` : '';

  const isAdmin = activePath.startsWith('/admin') && activePath !== '/admin/login' && activePath !== '/admin/setup';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
${robotsMetaHtml}${headSlotHtml}  <title>${escapeHtml(title)} — ${escapeHtml(cfg.PUBLIC_SITE_NAME)}</title>
  <style${nonceAttr}>${STRATA_DESIGN_SYSTEM_CSS}</style>
</head>
<body>
  <a href="#main-content" class="skip-link">Skip to main content</a>
  ${stagingBannerHtml}
  <header class="site-header">
${headerSlotHtml}    <nav class="site-nav" aria-label="Primary navigation">
      <a href="/" class="site-brand"${activePath === '/' ? ' aria-current="page"' : ''}>${brandHtml}</a>
      <div class="nav-links">
        ${navHtml}
        ${isAdmin ? `<button type="button" class="btn btn-secondary" id="btn-admin-logout" style="font-size:12px;padding:4px 10px;margin-left:8px;cursor:pointer">Sign out</button>` : ''}
        <button type="button" class="theme-toggle-btn" id="theme-toggle" aria-pressed="false" style="min-height:44px"><span aria-hidden="true">◐</span> <span class="theme-label">Dark theme</span></button>
      </div>
    </nav>
  </header>
  <main class="site-main" id="main-content">
    ${safeMainContent}
  </main>
  <footer class="site-footer" style="max-width:var(--layout-max);margin:48px auto 24px;padding:16px 24px;border-top:1px solid var(--rule);font-size:14px;color:var(--text-muted)">
${footerSlotHtml}    <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;margin-bottom:12px">
      <nav aria-label="Secondary navigation" style="display:flex;gap:16px;flex-wrap:wrap">
        <a href="/about">About</a>
        <a href="/now">Now</a>
        <a href="/uses">Uses</a>
        <a href="/book">Book</a>
        <a href="/rss.xml">RSS</a>
      </nav>
      <div>${escapeHtml(cfg.PUBLIC_SITE_FOOTER_TEXT)}</div>
    </div>
    ${unofficialForkSlotHtml}
  </footer>
  <script${nonceAttr}>
    (function() {
      const logoutBtn = document.getElementById('btn-admin-logout');
      if (logoutBtn) {
        logoutBtn.addEventListener('click', async function() {
          try {
            if (typeof window.apiClient === 'function') {
              await window.apiClient('/api/auth/logout', { method: 'POST' });
            }
          } catch (_) {}
          try {
            sessionStorage.removeItem('lp_csrf_token');
            sessionStorage.removeItem('lp_legacy_recovery_used');
          } catch (_) {}
          window.location.href = '/admin/login';
        });
      }

      const btn = document.getElementById('theme-toggle');
      function getStoredTheme() {
        try {
          const saved = localStorage.getItem('strata-theme');
          if (saved === 'dark' || saved === 'light') return saved;
        } catch (_) {}
        return null;
      }
      function getSystemTheme() {
        try {
          if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
          }
        } catch (_) {}
        return 'light';
      }
      function updateThemeUI(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        if (btn) {
          const isDark = theme === 'dark';
          btn.setAttribute('aria-pressed', isDark ? 'true' : 'false');
          btn.innerHTML = isDark
            ? '<span aria-hidden="true">☀</span> <span class="theme-label">Light theme</span>'
            : '<span aria-hidden="true">◐</span> <span class="theme-label">Dark theme</span>';
        }
      }
      let currentTheme = getStoredTheme() || getSystemTheme();
      updateThemeUI(currentTheme);
      if (btn) {
        btn.addEventListener('click', function() {
          currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
          updateThemeUI(currentTheme);
          try { localStorage.setItem('strata-theme', currentTheme); } catch (_) {}
        });
      }
    })();
  </script>
${options?.clientScript ? `  <script type="module" src="${escapeHtml(options.clientScript)}"${nonceAttr}></script>\n` : ''}</body>
</html>`;
}

export interface AsOfDateInfo {
  date: Date;
  valid: boolean;
  raw: string;
}

export function parseAsOfDate(asOfParam?: string | null): AsOfDateInfo | null {
  if (!asOfParam || typeof asOfParam !== 'string') return null;
  const trimmed = asOfParam.trim();
  if (!trimmed) return null;
  const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(trimmed);
  const dateStr = isDateOnly ? `${trimmed}T23:59:59.999Z` : trimmed;
  const parsed = new Date(dateStr);
  if (isNaN(parsed.getTime())) {
    return { date: new Date(), valid: false, raw: trimmed };
  }
  return { date: parsed, valid: true, raw: trimmed };
}

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
      asOfBanner = `<div class="as-of-banner" role="alert" style="border-left-color:var(--role-challenge,#f59e0b);background:var(--surface-raised)">
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
        return `<a href="/timeline?as_of=${bandAsOf}" class="strata-band strata-band-empty" style="height:44px" data-ym="${ym}" data-asof="${bandAsOf}" data-dimmed="${dimmed}" data-count="0"${isCursor ? ' data-cursor="true"' : ''} aria-label="${ym}: No entries (${formatMonthYear(ym)})${dimmed ? ' (after as-of date)' : ''}">
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

      return `<a href="/timeline?as_of=${bandAsOf}" class="strata-band" data-profile="${escapeHtml(primaryProfile)}" style="height:${heightPx}px" data-ym="${ym}" data-slug="${b.slugs[0]}" data-asof="${bandAsOf}" data-dimmed="${dimmed}" data-count="${b.count}"${isCursor ? ' data-cursor="true"' : ''} aria-label="${ym} (${formatMonthYear(ym)}): ${layerText} (${uniqueProfiles.join(', ')})${dimmed ? ' (after as-of date)' : ''}">
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
        <h2 id="strata-heading" style="margin:0;font-size:18px;font-family:var(--font-reading)">Strata timeline</h2>
        <span style="font-size:14px;color:var(--text-muted)">Pick a month to see this site as it was then. Gaps show time between projects.</span>
      </div>
      <form method="GET" action="/timeline" style="display:flex;gap:8px;align-items:center">
        <label for="as-of-input" style="font-size:14px">As of:</label>
        <input id="as-of-input" name="as_of" type="date" value="${escapeHtml(defaultInputValue)}" class="ask-input" style="padding:4px 8px;width:auto" />
        <button type="submit" class="btn btn-secondary" style="min-height:44px;padding:6px 16px">Apply Date</button>
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
      <span class="strata-legend-item" role="listitem"><span class="band-venture-notch" style="position:static;display:inline-block;margin-right:4px" aria-hidden="true"></span> Venture notch</span>
      <span class="strata-legend-hint">Keyboard: Left/Right arrows move between months, PageUp/PageDown by year, Enter opens month.</span>
    </div>
    <details style="margin-top:12px;font-size:14px">
      <summary style="cursor:pointer;color:var(--text-muted)">Timeline as a list</summary>
      <ul style="margin-top:8px">
        ${textListHtml}
      </ul>
    </details>
    <script>
      (function() {
        const bands = Array.from(document.querySelectorAll('.strata-band'));
        const cursor = document.getElementById('strata-cursor');
        if (bands.length === 0) return;

        function updateCursor(targetBand) {
          if (!cursor || !targetBand) return;
          const leftPos = targetBand.offsetLeft + (targetBand.offsetWidth / 2);
          cursor.style.left = leftPos + 'px';
        }

        const activeBand = document.querySelector('.strata-band[data-cursor="true"]') ||
                           document.querySelector('.strata-band[data-dimmed="true"]');
        if (activeBand && cursor) {
          updateCursor(activeBand);
        }

        bands.forEach(function(band, idx) {
          band.addEventListener('keydown', function(e) {
            let targetIdx = -1;
            if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
              targetIdx = Math.min(bands.length - 1, idx + 1);
            } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
              targetIdx = Math.max(0, idx - 1);
            } else if (e.key === 'Home') {
              targetIdx = 0;
            } else if (e.key === 'End') {
              targetIdx = bands.length - 1;
            } else if (e.key === 'PageUp') {
              targetIdx = Math.max(0, idx - 12);
            } else if (e.key === 'PageDown') {
              targetIdx = Math.min(bands.length - 1, idx + 12);
            } else if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              band.click();
              return;
            }
            if (targetIdx !== -1 && targetIdx !== idx) {
              e.preventDefault();
              bands[targetIdx].focus();
              updateCursor(bands[targetIdx]);
            }
          });
        });
      })();
    </script>
  </section>`;

  return { html, visibleSlugs };
}

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
      <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:12px;flex-wrap:wrap;gap:8px">
        <h2 id="featured-heading" style="font-family:var(--font-reading);font-size:21px;margin:0">Recent work</h2>
        <a href="/work" style="font-size:14px;color:var(--accent);text-decoration:none">View all work (${publicEntries.length}) →</a>
      </div>
      ${rowsHtml.length > 0 ? `
        <ul class="entry-list">
          ${rowsHtml.join('\n')}
        </ul>
      ` : `
        <div class="empty-state" style="padding:40px 16px;text-align:center;border:1px dashed var(--rule);border-radius:var(--radius-card);margin-top:16px">
          <p style="font-weight:600;font-size:18px;margin:0 0 8px 0">No entries published yet</p>
          <p style="color:var(--text-muted);font-size:15px;margin:0 0 20px 0">Technical case studies and architectural decisions will appear here as they are published.</p>
          <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap">
            <a href="/timeline" class="btn btn-secondary">Explore Timeline</a>
            <a href="/ask" class="btn">Ask Questions</a>
          </div>
        </div>
      `}
    </section>

    <section class="ask-box" aria-labelledby="home-ask-heading">
      <h2 id="home-ask-heading" style="margin:0;font-family:var(--font-reading);font-size:21px">Ask about my work</h2>
      <p style="margin:4px 0 0;color:var(--text-muted);font-size:15px">
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
      ? `<div style="display:flex;flex-wrap:wrap;gap:8px;margin:12px 0" aria-label="Confirmed context conditions">
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
        <a href="/work/${a.newer_entry_slug}${asOfQueryPart}" style="margin-left:8px">Read "${escapeHtml(a.newer_entry_title)}" →</a>
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
        return `<div class="unlabeled-span reading-column" style="margin-bottom:24px">${combinedText}</div>`;
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
            return `<div style="margin-bottom:8px">
              ${linkMarkup}
              ${
                ev.verified_at
                  ? `<div class="chip" style="margin-top:4px;border-color:var(--role-outcome)" title="Verification proves the artifact exists and who authored it; it does not prove the surrounding narrative fits your situation.">✓ Verified (${escapeHtml(ev.verification?.label || 'artifact')})</div>`
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
      asOfBannerHtml = `<div class="as-of-banner" role="alert" style="position:sticky;top:0;z-index:10;margin-bottom:16px;border-left-color:var(--role-challenge,#f59e0b);background:var(--surface-raised)">
        <span><strong>Invalid as-of date ("${escapeHtml(asOfInfo.raw)}")</strong> — Showing present revision.</span>
        <a href="/work/${entry.slug}">Reset to present</a>
      </div>`;
    } else if (notYetWritten) {
      asOfBannerHtml = `<div class="as-of-banner" role="status" style="position:sticky;top:0;z-index:10;margin-bottom:16px;background:var(--surface-raised);border-left:4px solid var(--accent)">
        <span><strong>Viewing as of ${escapeHtml(asOfInfo.raw.slice(0, 10))}</strong> — This entry had not yet been recorded as of this date. Showing original revision from ${escapeHtml(result.currentRevision.written_at.slice(0, 10))}.</span>
        <div style="display:flex;gap:12px;margin-top:4px">
          <a href="/work/${entry.slug}">View present revision</a>
          <a href="/timeline?as_of=${encodeURIComponent(asOfInfo.raw)}">Back to timeline</a>
        </div>
      </div>`;
    } else {
      asOfBannerHtml = `<div class="as-of-banner" role="status" style="position:sticky;top:0;z-index:10;margin-bottom:16px;background:var(--surface-raised);border-left:4px solid var(--accent)">
        <span><strong>Viewing as of ${escapeHtml(asOfInfo.raw.slice(0, 10))}</strong> — Showing the revision active as of this date${isHistoricalRevision ? ' (historical revision)' : ' (latest revision)'}.</span>
        <div style="display:flex;gap:12px;margin-top:4px">
          <a href="/work/${entry.slug}">View present revision</a>
          <a href="/timeline?as_of=${encodeURIComponent(asOfInfo.raw)}">Back to timeline</a>
        </div>
      </div>`;
    }
  }

  const content = `
    <article${(entry as any).lang ? ` lang="${escapeHtml((entry as any).lang)}"` : ''}>
      ${asOfBannerHtml}
      <header style="margin-bottom:var(--space-6);border-bottom:1px solid var(--rule);padding-bottom:var(--space-4)">
        <div style="display:flex;justify-content:space-between;align-items:baseline;flex-wrap:wrap;gap:12px">
          <h1 style="font-family:var(--font-reading);font-size:30px;margin:0">${escapeHtml(entry.title)}</h1>
          <div style="display:flex;gap:8px">
            ${qualifiesForStructured ? `<span class="chip">Structured</span>` : ''}
            ${
              qualifiesForStructured
                ? `<a href="/work/${entry.slug}?view=${activeView === 'structured' ? 'article' : 'structured'}${asOfAndPart}" class="btn btn-secondary" data-action="view-switch" style="padding:6px 14px;min-height:44px;display:inline-flex;align-items:center;font-size:14px;text-decoration:none">${activeView === 'structured' ? 'Read as one article' : 'Read by section'}</a>`
                : ''
            }
          </div>
        </div>
        <p class="entry-date-line tabular-nums" style="color:var(--text-muted);margin:var(--space-2) 0 var(--space-3);font-size:var(--font-size-1,14px);display:flex;align-items:center;gap:var(--space-1)">${dateGlyphHtml}<span>${escapeHtml(dateDisplay)}</span></p>
        ${contextStripHtml}
      </header>

      ${laterBannerHtml}

      <div class="entry-layout">
        <div>
          ${bodyHtml}
        </div>
        <aside class="margin-rail" aria-label="Entry evidence, claims, and scoped ask">
          <h3 style="margin:0 0 var(--space-2);font-size:var(--font-size-2,15px);font-family:var(--font-reading)">Evidence</h3>
          ${evidenceHtml}

          ${claimsHtml ? `<h3 style="margin:var(--space-6) 0 var(--space-2);font-size:var(--font-size-2,15px);font-family:var(--font-reading)">Conclusions</h3>${claimsHtml}` : ''}

          <div style="margin-top:var(--space-6);padding-top:var(--space-4);border-top:1px solid var(--rule)">
            <h3 style="margin:0 0 var(--space-2);font-size:var(--font-size-2,15px);font-family:var(--font-reading)">Ask about this entry</h3>
            <form action="/ask" method="GET">
              <input type="hidden" name="scope" value="${escapeHtml(entry.slug)}" />
              ${asOfInfo && asOfInfo.valid ? `<input type="hidden" name="as_of" value="${escapeHtml(asOfInfo.raw)}" />` : ''}
              <input type="text" name="q" class="ask-input" style="width:100%;margin-bottom:8px" placeholder="What would you like to know?" aria-label="Ask about this entry" required />
              <button type="submit" class="btn" style="width:100%">Ask</button>
            </form>
          </div>
        </aside>
      </div>
    </article>
  `;

  return { status: 200, html: renderLayout(entry.title, activeSection, content), entry };
}

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
      ? `<div style="display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap;align-items:center">
          <span style="font-size:14px;color:var(--text-muted)">Outcome:</span>
          <a href="/work${asOfPrefixQuery}" class="chip${!filterOutcome ? ' active' : ''}">All</a>
          <a href="/work?outcome=worked${asOfParamQuery}" class="chip${filterOutcome === 'worked' ? ' active' : ''}">Worked</a>
          <a href="/work?outcome=partly${asOfParamQuery}" class="chip${filterOutcome === 'partly' ? ' active' : ''}">Partly worked</a>
          <a href="/work?outcome=failed${asOfParamQuery}" class="chip${filterOutcome === 'failed' ? ' active' : ''}">Didn't work</a>
          <a href="/work?outcome=unresolved${asOfParamQuery}" class="chip${filterOutcome === 'unresolved' ? ' active' : ''}">Unresolved</a>
        </div>`
      : '';

  const asOfBanner = asOfInfo && asOfInfo.valid
    ? `<div class="as-of-banner" role="status" style="margin-bottom:16px">
         <span><strong>Viewing as of ${escapeHtml(asOfInfo.raw.slice(0, 10))}</strong> — Entries written after this date are excluded.</span>
         <a href="${mode === 'work' ? '/work' : '/writing'}">Reset to present</a>
       </div>`
    : '';

  const content = `
    <h1 style="font-family:var(--font-reading);font-size:30px;margin:0 0 8px 0">${title}</h1>
    <p style="color:var(--text-muted);margin:0 0 24px 0">
      ${mode === 'work' ? 'Case studies, decisions and design projects, with the evidence behind them.' : "Everything I've published, newest first."}
    </p>
    ${filterBar}
    ${asOfBanner}
    ${rows.length > 0 ? `
      <ul class="entry-list">
        ${rows.join('\n')}
      </ul>
    ` : `
      <div class="empty-state" style="padding:48px 16px;text-align:center;border:1px dashed var(--rule);border-radius:var(--radius-card);margin:24px 0">
        <p style="font-weight:600;font-size:18px;margin:0 0 8px 0">${filterOutcome ? 'No entries match the selected filters' : (mode === 'work' ? 'No matching case studies found' : 'No writing entries found')}</p>
        <p style="color:var(--text-muted);font-size:14px;margin:0 0 20px 0">
          ${filterOutcome ? `No public case studies match the outcome filter "${escapeHtml(filterOutcome)}".` : (asOfInfo && asOfInfo.valid ? 'No public entries were recorded on or before this as-of date.' : 'No public entries have been published yet.')}
        </p>
        <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap">
          ${filterOutcome ? `<a href="/work${asOfPrefixQuery}" class="btn btn-secondary">Reset all filters</a>` : ''}
          ${asOfInfo && asOfInfo.valid ? `<a href="/${mode}" class="btn btn-secondary">Reset to present</a>` : ''}
          <a href="/ask" class="btn">Ask</a>
        </div>
      </div>
    `}
  `;

  return renderLayout(title, `/${mode}`, content);
}

export function renderNotFoundPage(
  message?: string,
  activePath: string = '/'
): string {
  const content = `
    <div class="empty-state" style="padding:48px 16px;text-align:center;max-width:640px;margin:40px auto">
      <h1 style="font-family:var(--font-reading);font-size:32px;margin:0 0 12px 0">404 — Page Not Found</h1>
      <p style="color:var(--text-muted);font-size:16px;margin:0 0 24px 0">
        ${escapeHtml(message || 'The page or record you requested does not exist or may have been moved.')}
      </p>
      <div style="margin-bottom:28px">
        <form action="/ask" method="GET" style="display:flex;gap:8px;max-width:440px;margin:0 auto">
          <input type="text" name="q" class="ask-input" placeholder="Search records or ask a question..." aria-label="Search records" style="flex:1" required />
          <button type="submit" class="btn">Search</button>
        </form>
      </div>
      <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap">
        <a href="/work" class="btn btn-secondary">Explore Work</a>
        <a href="/writing" class="btn btn-secondary">Browse Writing</a>
        <a href="/timeline" class="btn btn-secondary">View Timeline</a>
        <a href="/ask" class="btn">Ask Questions</a>
      </div>
    </div>
  `;
  return renderLayout('404 — Page Not Found', activePath, content);
}

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
      <div class="empty-state" style="padding:32px;text-align:center;border:1px dashed var(--rule);border-radius:var(--radius-card);margin-top:16px">
        <p style="font-size:16px;font-weight:600;margin:0 0 8px 0">No records active as of this date</p>
        <p style="color:var(--text-muted);margin:0 0 16px 0">All published entries were recorded after this point in time, or retrospective hindsight has been filtered out.</p>
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
    <h1 style="font-family:var(--font-reading);font-size:30px;margin:0 0 8px 0">Timeline</h1>
    <p style="color:var(--text-muted);margin:0 0 24px 0">
      Move the cursor to see what I had written by that date. Later entries, and entries written looking back, are hidden.
    </p>
    ${strataHtml}
    <section>
      <h2 style="font-family:var(--font-reading);font-size:21px;margin:0 0 12px 0">
        ${entryCountText} as of ${activeDateLabel}${hiddenText}
      </h2>
      ${listContentHtml}
    </section>
  `;

  return renderLayout('Timeline', '/timeline', content);
}

export async function renderAskPage(
  clientOrQuery?: WebDataClient | string,
  initialQuery?: string,
  scopeSlug?: string,
  asOfParam?: string | null
): Promise<string> {
  let client: WebDataClient | undefined;
  let queryText: string | undefined;
  let activeScope: string | undefined;
  let asOfArg: string | null | undefined;

  if (typeof clientOrQuery === 'object' && clientOrQuery !== null) {
    client = clientOrQuery;
    queryText = initialQuery;
    activeScope = scopeSlug;
    asOfArg = asOfParam;
  } else {
    client = undefined;
    queryText = typeof clientOrQuery === 'string' ? clientOrQuery : undefined;
    activeScope = initialQuery;
    asOfArg = scopeSlug;
  }

  const asOfInfo = parseAsOfDate(asOfArg);
  const hasValidAsOf = asOfInfo && asOfInfo.valid;
  const initialAsOfDate = hasValidAsOf ? asOfInfo.raw.slice(0, 10) : '';

  // Extract dynamic question examples from published entries (§6.1, UX-10)
  const dynamicExamples: string[] = [];
  if (client) {
    try {
      const adapted = adaptDataSource(client);
      const publicEntries = await adapted.listEntries({ visibility: ['public'] });
      for (const entry of publicEntries.slice(0, 3)) {
        if (entry.title) {
          dynamicExamples.push(`What approach was used in ${entry.title}?`);
        }
      }
    } catch {}
  }
  if (dynamicExamples.length === 0) {
    dynamicExamples.push(
      'What did you use to replace Redis distributed locks?',
      'Should I use PostgreSQL advisory locks for webhook workers?',
      'How fast are local ONNX embeddings on Arm64?'
    );
  }

  const examplesHtml = dynamicExamples
    .map((ex) => `<button type="button" class="chip example-q" style="cursor:pointer">${escapeHtml(ex)}</button>`)
    .join('\n');

  const asOfNoticeHtml = hasValidAsOf
    ? `<div class="as-of-banner" role="status" style="margin-bottom:12px;font-size:13px">
        <span><strong>Time-travel query active:</strong> Synthesizing answer strictly from records known as of <strong>${escapeHtml(initialAsOfDate)}</strong>.</span>
        <a href="/ask${activeScope ? `?scope=${encodeURIComponent(activeScope)}` : ''}">Reset to present</a>
      </div>`
    : '';

  const content = `
    <h1 style="font-family:var(--font-reading);font-size:30px;margin:0 0 8px 0">Ask about my work</h1>
    <p style="color:var(--text-muted);margin:0 0 24px 0;max-width:65ch">
      Answers come from my published entries and cite them. When my records don't cover your situation, I'll say so and offer a conversation.
    </p>

    <div class="ask-box" style="margin-top:0">
      ${activeScope ? `<div id="scope-chip-container" style="margin-bottom:12px"><span class="chip" id="ask-scope-chip">Scope: <strong>${escapeHtml(activeScope)}</strong> <button type="button" id="btn-clear-scope" style="background:none;border:none;cursor:pointer;padding:0 4px;font-weight:700" title="Clear scope">×</button></span></div>` : ''}
      ${asOfNoticeHtml}
      <form id="ask-form">
        <label for="ask-q" style="font-weight:600;display:block;margin-bottom:6px">Your question</label>
        <div class="ask-input-row" style="margin-top:0">
          <input id="ask-q" name="q" type="text" class="ask-input" value="${escapeHtml(queryText || '')}" placeholder="e.g., Should we use PostgreSQL advisory locks or Redis for webhook coordination?" required />
          <button type="submit" class="btn" id="btn-ask-submit">Ask</button>
        </div>

        <details style="margin-top:16px" ${queryText?.toLowerCase().includes('should') || hasValidAsOf ? 'open' : ''}>
          <summary style="cursor:pointer;font-size:14px;color:var(--text-muted)">Tell me about your situation (optional)</summary>
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;margin-top:12px">
            <div>
              <label for="facet-db" style="font-size:13px;display:block">Database</label>
              <input id="facet-db" type="text" class="ask-input" style="width:100%;padding:6px" placeholder="e.g., PostgreSQL or MySQL" />
            </div>
            <div>
              <label for="facet-stack" style="font-size:13px;display:block">Stack</label>
              <input id="facet-stack" type="text" class="ask-input" style="width:100%;padding:6px" placeholder="e.g., Node.js, PgBouncer" />
            </div>
            <div>
              <label for="facet-asof" style="font-size:13px;display:block">Answer as of (optional)</label>
              <input id="facet-asof" type="date" class="ask-input" style="width:100%;padding:6px" value="${escapeHtml(initialAsOfDate)}" />
            </div>
          </div>
        </details>
      </form>

      <div style="margin-top:16px;display:flex;gap:8px;flex-wrap:wrap;align-items:center">
        <span style="font-size:13px;color:var(--text-muted)">Try asking:</span>
        ${examplesHtml}
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
        const scopeSlug = ${JSON.stringify(activeScope || null)};

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

        async function runQuery(queryText, extraFacets, contextAsked) {
          region.textContent = 'Searching records and verifying citations...';
          if (submitBtn) {
            submitBtn.setAttribute('disabled', 'true');
            submitBtn.setAttribute('aria-busy', 'true');
            submitBtn.textContent = 'Searching...';
          }
          if (qInput) {
            qInput.setAttribute('disabled', 'true');
          }

          const facets = Object.assign({}, extraFacets || {});
          if (dbInput && dbInput.value.trim() && !facets.database) facets.database = dbInput.value.trim();
          if (stackInput && stackInput.value.trim() && !facets.stack) facets.stack = stackInput.value.trim();

          const payload = {
            query: queryText,
            facets: Object.keys(facets).length > 0 ? facets : undefined,
            as_of_date: asOfInput && asOfInput.value ? new Date(asOfInput.value).toISOString() : undefined,
            scope_entry_slug: currentScope || undefined,
            context_asked: contextAsked === true ? true : undefined
          };

          try {
            const res = await fetch('/api/ask', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
            });

            let data = null;
            try {
              data = await res.json();
            } catch (jsonErr) {
              const statusSnippet = res.status ? ' (' + res.status + ')' : '';
              region.innerHTML = '<div class="strata-section" role="alert"><p>Can\\\'t reach the server' + statusSnippet + ', so answers aren\\\'t available right now. Try again in a minute, or <a href="/book">book a conversation</a>.</p></div>';
              return;
            }

            if (res.status === 400 || (data && (data.tier === 'invalid_query' || data.error === 'Invalid query'))) {
              const msg = (data && (data.answer || data.message)) || 'Type a question to ask. It can be up to 1000 characters.';
              region.innerHTML =
                '<div class="strata-section" role="alert">' +
                  '<div style="display:flex;justify-content:space-between;flex-wrap:gap:8px;margin-bottom:12px">' +
                    '<span class="chip" data-status="invalid-query"><strong>Type a question to ask</strong></span>' +
                  '</div>' +
                  '<p style="margin:0 0 12px 0">' + esc(msg) + '</p>' +
                '</div>';
              return;
            }

            if (res.status === 429 || (data && data.tier === 'rate_limited')) {
              const retrySecs = (data && data.retryAfter) ? data.retryAfter : 3600;
              const retryMinutes = Math.max(1, Math.ceil(retrySecs / 60));
              const answerText = (data && (data.answer || data.error)) || "Hourly question limit reached. You've reached the limit of questions per hour. Try again in " + retryMinutes + " minutes, or book a conversation.";
              region.innerHTML =
                '<div class="strata-section" role="alert">' +
                  '<span class="chip" data-status="rate-limited"><strong>Hourly question limit reached</strong></span>' +
                  '<p style="margin:12px 0">' + esc(answerText) + '</p>' +
                  '<p style="font-size:13px;color:var(--text-muted)">Please try again in about ' + retryMinutes + ' minutes (' + retrySecs + 's), or book a session directly.</p>' +
                  '<div style="margin-top:12px"><a href="/book?q=' + encodeURIComponent(queryText) + '" class="btn" style="display:inline-block;text-decoration:none">Book a conversation →</a></div>' +
                '</div>';
              return;
            }

            if (res.status >= 500) {
              const statusSnippet = res.status ? ' (' + res.status + ')' : '';
              region.innerHTML = '<div class="strata-section" role="alert"><p>Can\\\'t reach the server' + statusSnippet + ', so answers aren\\\'t available right now. Try again in a minute, or <a href="/book">book a conversation</a>.</p></div>';
              return;
            }

            const tierLabels = {
              tier1: "Automated answer from the owner's records",
              tier2: "This needs the owner's review. Typical reply within 24 hours.",
              tier3: "This is better as a conversation.",
              extractive: "Showing excerpts from the owner's records. Automated answers are paused for now.",
              no_match: "That isn't in these records.",
              disabled: "Automated answers are off.",
              rate_limited: "Hourly question limit reached",
              needs_context: "A few details will help me check this against my experience. Skip any you don't know.",
              invalid_query: "Type a question to ask"
            };

            const scopeNoticeHtml = currentScope
              ? '<div class="scope-notice" id="ask-scoped-notice" style="margin-bottom:10px;font-size:13px;color:var(--text-muted)">Scoped to entry: <strong>' + esc(currentScope) + '</strong></div>'
              : '';

            if (data.tier === 'needs_context') {
              const missingList = Array.isArray(data.missingFacets) && data.missingFacets.length > 0 ? data.missingFacets : ['database', 'stack'];
              const facetFieldsHtml = missingList.map(function(f) {
                const label = esc(f.charAt(0).toUpperCase() + f.slice(1).replace(/_/g, ' '));
                return '<div style="margin-bottom:8px">' +
                  '<label for="ctx-facet-' + esc(f) + '" style="font-size:12px;font-weight:600;display:block;margin-bottom:2px">' + label + '</label>' +
                  '<input type="text" id="ctx-facet-' + esc(f) + '" class="ask-input dynamic-facet-input" data-facet="' + esc(f) + '" style="width:100%;padding:6px" placeholder="e.g. your ' + esc(f) + '..." />' +
                  '</div>';
              }).join('');

              region.innerHTML =
                '<div class="strata-section" id="needs-context-card">' +
                  '<div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px;margin-bottom:12px">' +
                    '<span class="chip"><strong>' + esc(tierLabels.needs_context) + '</strong></span>' +
                  '</div>' +
                  scopeNoticeHtml +
                  '<p style="margin:0 0 12px 0">' + esc(data.answer || 'To advise accurately on this question, please provide the following details about your architecture or environment:') + '</p>' +
                  '<form id="needs-context-form" style="margin-bottom:12px">' +
                    facetFieldsHtml +
                    '<div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap">' +
                      '<button type="submit" class="btn" id="btn-submit-with-context">Submit with Context</button>' +
                      '<button type="button" class="btn btn-secondary" id="btn-skip-context">Skip (Answer with uncertainty)</button>' +
                    '</div>' +
                  '</form>' +
                '</div>';

              const ctxForm = document.getElementById('needs-context-form');
              if (ctxForm) {
                ctxForm.addEventListener('submit', function(e) {
                  e.preventDefault();
                  const gathered = Object.assign({}, facets);
                  ctxForm.querySelectorAll('.dynamic-facet-input').forEach(function(inp) {
                    const fk = inp.getAttribute('data-facet');
                    if (fk && inp.value.trim()) gathered[fk] = inp.value.trim();
                  });
                  runQuery(queryText, gathered, false);
                });
              }

              const skipBtn = document.getElementById('btn-skip-context');
              if (skipBtn) {
                skipBtn.addEventListener('click', function() {
                  runQuery(queryText, facets, true);
                });
              }
              return;
            }

            const citationsHtml = (data.citations || []).map(function(c) {
              return '<li style="margin-bottom:6px"><strong>[' + esc(c.citationId) + ']</strong> <a href="/work/' + encodeURIComponent(String(c.slug || '')) + '">' + esc(c.title) + '</a>: <em>"' + esc(c.text) + '"</em></li>';
            }).join('');

            const disclosureText = data.provider_disclosure || data.aiDisclosure;
            const disclosureHtml = disclosureText
              ? '<p class="provider-disclosure" style="font-size:12px;color:var(--text-muted);margin:16px 0 0 0;border-top:1px solid var(--rule);padding-top:8px">Automated answer: ' + esc(disclosureText) + '</p>'
              : '';

            let receiptHtml = '';
            if (data.tier === 'tier2' && (data.receiptUrl || data.statusToken)) {
              const rUrl = safePath(data.receiptUrl || ('/ask/status/' + (data.statusToken || '')));
              receiptHtml =
                '<div style="margin:16px 0;padding:12px;border:1px solid var(--accent);border-radius:var(--radius-control);background:var(--surface-raised)">' +
                  '<strong style="font-size:14px;display:block;margin-bottom:4px">Receipt Created</strong>' +
                  '<p style="margin:0 0 8px 0;font-size:13px">You can track the owner&#39;s review and view the delivered reply at your personal receipt URL:</p>' +
                  '<a href="' + rUrl + '" class="btn" id="btn-view-receipt" style="display:inline-block;text-decoration:none">View Status Receipt →</a>' +
                '</div>';
            }

            region.innerHTML =
              '<div class="strata-section">' +
                '<div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px;margin-bottom:12px">' +
                  '<span class="chip"><strong>' + esc(tierLabels[data.tier] || data.tier) + '</strong></span>' +
                '</div>' +
                scopeNoticeHtml +
                (data.basis ? '<p style="font-size:13px;color:var(--text-muted);margin:0 0 8px 0">' + esc(data.basis) + '</p>' : '') +
                '<div class="reading-column" style="white-space:pre-wrap;margin-bottom:16px">' + esc(data.answer) + '</div>' +
                receiptHtml +
                (citationsHtml ? '<div style="border-top:1px solid var(--rule);padding-top:12px"><strong style="font-size:14px">Sources</strong><ul style="margin:8px 0 0;padding-left:20px;font-size:14px">' + citationsHtml + '</ul></div>' : '') +
                (data.bookingUrl ? '<div style="margin-top:12px"><a href="' + safePath(data.bookingUrl) + '" class="btn" style="display:inline-block;text-decoration:none">Book a conversation →</a></div>' : '') +
                disclosureHtml +
              '</div>';
          } catch (err) {
            region.innerHTML = '<div class="strata-section" role="alert"><p>Can\\\'t reach the server, so answers aren\\\'t available right now. Try again in a minute, or <a href="/book">book a conversation</a>.</p></div>';
          } finally {
            if (submitBtn) {
              submitBtn.removeAttribute('disabled');
              submitBtn.removeAttribute('aria-busy');
              submitBtn.textContent = 'Ask';
            }
            if (qInput) {
              qInput.removeAttribute('disabled');
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

  return renderLayout('Ask about my work', '/ask', content);
}

export function renderStaticPage(page: 'now' | 'about' | 'uses' | 'book', queryParam?: string): string {
  if (page === 'now') {
    return renderLayout(
      'Now',
      '/now',
      `<div class="reading-column">
        <h1>What I'm focused on now</h1>
        <p class="neutral-empty-note"><em>Nothing here yet.</em></p>
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
        <h2>Verified credentials</h2>
        <p>A badge appears only when it can be proved: signed commits checked against GitHub, or ownership of this domain.</p>
        <p class="neutral-empty-note"><em>Nothing has been verified yet.</em></p>
      </div>`
    );
  }
  if (page === 'uses') {
    return renderLayout(
      'Uses & Stack',
      '/uses',
      `<div class="reading-column">
        <h1>Tools &amp; Stack</h1>
        <p class="neutral-empty-note"><em>Instance stack information.</em></p>
      </div>`
    );
  }
  return renderBookPage(queryParam);
}

export function renderBookPage(queryParam?: string, facetsParam?: string): string {
  const defaultTopic = queryParam || '';
  const defaultFacets = facetsParam || '';

  return renderLayout(
    'Book a conversation',
    '/book',
    `<div class="reading-column">
      <h1>Book a conversation</h1>
      <p>If your situation differs from what I've written about, a conversation will serve you better than a guess.</p>

      ${(defaultTopic || defaultFacets) ? `
      <div style="padding:10px 14px;background:var(--surface-raised);border:1px solid var(--rule);border-radius:var(--radius-control);margin-bottom:16px;font-size:13px">
        <strong>Carried Context from Ask:</strong>
        ${defaultTopic ? `<div style="margin-top:4px"><em>Topic:</em> "${escapeHtml(defaultTopic)}"</div>` : ''}
        ${defaultFacets ? `<div style="margin-top:2px;color:var(--text-muted)"><em>Facets:</em> ${escapeHtml(defaultFacets)}</div>` : ''}
      </div>` : ''}

      <div id="booking-confirmation" style="display:none;padding:16px;border:1px solid var(--accent);background:var(--surface-raised);border-radius:var(--radius-control);margin-bottom:16px" role="region" aria-label="Booking Confirmation">
        <span class="chip" style="background:#d1fae5;color:#065f46;font-weight:600;margin-bottom:8px;display:inline-block">✓ Request Confirmed</span>
        <h2 style="font-size:18px;margin:8px 0 4px 0">Consultation Request Received</h2>
        <p style="margin:0 0 10px 0;font-size:14px">
          We've received your request for: <strong id="conf-topic"></strong>
        </p>
        <p style="margin:0 0 12px 0;font-size:13px;color:var(--text-muted)">
          The owner will review your architectural context and reach out at <strong id="conf-contact"></strong> within 24 hours to coordinate scheduling.
        </p>
        <a href="/work" class="btn btn-secondary" style="text-decoration:none;display:inline-block">Explore Portfolio Records →</a>
      </div>

      <form id="booking-form" class="strata-section" style="border:1px solid var(--rule);padding:16px;border-radius:var(--radius-control)">
        <div id="booking-error" style="display:none;color:var(--status-warn,#d97706);font-size:13px;margin-bottom:12px" role="alert"></div>

        <div style="margin-bottom:12px">
          <label for="book-topic" style="display:block;font-weight:600;margin-bottom:4px;font-size:14px">Topic / Architecture Question <span style="color:var(--status-warn,#d97706)">*</span></label>
          <input id="book-topic" name="topic" type="text" class="ask-input" style="width:100%" value="${escapeHtml(defaultTopic)}" placeholder="Describe your architecture constraint or review topic..." required />
        </div>

        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;margin-bottom:12px">
          <div>
            <label for="book-name" style="display:block;font-weight:600;margin-bottom:4px;font-size:14px">Your Name / Organization</label>
            <input id="book-name" name="visitor_name" type="text" class="ask-input" style="width:100%" placeholder="e.g. Jane Doe or Engineering Lead" />
          </div>
          <div>
            <label for="book-contact" style="display:block;font-weight:600;margin-bottom:4px;font-size:14px">Contact Email or Handle <span style="color:var(--status-warn,#d97706)">*</span></label>
            <input id="book-contact" name="visitor_contact" type="text" class="ask-input" style="width:100%" placeholder="e.g. alex@example.com or @handle" required />
          </div>
        </div>

        <div style="margin-bottom:12px">
          <label for="book-facets" style="display:block;font-weight:600;margin-bottom:4px;font-size:14px">Context Facets / Production Constraints</label>
          <input id="book-facets" name="facets" type="text" class="ask-input" style="width:100%" value="${escapeHtml(defaultFacets)}" placeholder="e.g. scale: high_volume, stack: postgres, cloud: aws" />
        </div>

        <div style="margin-bottom:12px">
          <label for="book-time" style="display:block;font-weight:600;margin-bottom:4px;font-size:14px">Preferred Times / Format</label>
          <input id="book-time" name="preferred_time" type="text" class="ask-input" style="width:100%" placeholder="e.g. Weekday mornings (UTC+8), 30 min video call" />
        </div>

        <div style="margin-bottom:16px">
          <label for="book-notes" style="display:block;font-weight:600;margin-bottom:4px;font-size:14px">Additional Background Notes</label>
          <textarea id="book-notes" name="notes" class="ask-input" style="width:100%;min-height:70px;line-height:1.4" placeholder="Optional notes or links to relevant repos..."></textarea>
        </div>

        <button type="submit" id="btn-submit-booking" class="btn">Send request</button>
      </form>

      <script>
        (function() {
          var form = document.getElementById('booking-form');
          var confirmation = document.getElementById('booking-confirmation');
          var errorDiv = document.getElementById('booking-error');
          var submitBtn = document.getElementById('btn-submit-booking');

          if (form) {
            form.addEventListener('submit', async function(e) {
              e.preventDefault();
              errorDiv.style.display = 'none';
              submitBtn.setAttribute('disabled', 'true');
              submitBtn.textContent = 'Submitting Request...';

              var topic = (document.getElementById('book-topic').value || '').trim();
              var visitor_name = (document.getElementById('book-name').value || '').trim();
              var visitor_contact = (document.getElementById('book-contact').value || '').trim();
              var facetsRaw = (document.getElementById('book-facets').value || '').trim();
              var preferred_time = (document.getElementById('book-time').value || '').trim();
              var notes = (document.getElementById('book-notes').value || '').trim();

              var facets = {};
              if (facetsRaw) {
                try {
                  if (facetsRaw.startsWith('{')) {
                    facets = JSON.parse(facetsRaw);
                  } else {
                    facetsRaw.split(',').forEach(function(pair) {
                      var parts = pair.split(':');
                      if (parts.length >= 2) {
                        facets[parts[0].trim()] = parts.slice(1).join(':').trim();
                      } else {
                        facets[pair.trim()] = true;
                      }
                    });
                  }
                } catch (err) {
                  facets = { raw: facetsRaw };
                }
              }

              try {
                var res = await fetch('/api/book', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    topic: topic,
                    visitor_name: visitor_name || undefined,
                    visitor_contact: visitor_contact,
                    facets: facets,
                    preferred_time: preferred_time || undefined,
                    notes: notes || undefined
                  })
                });

                var data = await res.json();
                if (res.ok && data.success) {
                  form.style.display = 'none';
                  document.getElementById('conf-topic').textContent = topic;
                  document.getElementById('conf-contact').textContent = visitor_contact;
                  confirmation.style.display = 'block';
                } else {
                  errorDiv.textContent = data.error || 'Failed to submit request. Please try again.';
                  errorDiv.style.display = 'block';
                  submitBtn.removeAttribute('disabled');
                  submitBtn.textContent = 'Send request';
                }
              } catch (err) {
                errorDiv.textContent = 'Network error submitting booking request. Please check connection and try again.';
                errorDiv.style.display = 'block';
                submitBtn.removeAttribute('disabled');
                submitBtn.textContent = 'Send request';
              }
            });
          }
        })();
      </script>
    </div>`
  );
}

export async function renderAskStatusPage(repo: WebDataClient, statusToken: string): Promise<string> {
  repo = adaptDataSource(repo);
  const escalation = await repo.getEscalationByStatusToken(statusToken);

  if (!escalation) {
    return renderLayout(
      'Receipt Not Found',
      '/ask',
      `<div class="reading-column">
        <h1>Receipt Status Not Found</h1>
        <p style="color:var(--text-muted)">The token provided does not match any active escalation receipt in these records.</p>
        <p><a href="/ask" class="btn">Return to Ask</a></p>
      </div>`
    );
  }

  const isPending = escalation.status === 'pending';
  const isApproved = escalation.status === 'approved';
  const isRejected = escalation.status === 'rejected';

  let statusBadge = '<span class="chip" style="background:#fef3c7;color:#92400e;font-weight:600">Pending Review</span>';
  if (isApproved) {
    statusBadge = '<span class="chip" style="background:#d1fae5;color:#065f46;font-weight:600">Approved by Owner</span>';
  } else if (isRejected) {
    statusBadge = '<span class="chip" style="background:#fee2e2;color:#991b1b;font-weight:600">Declined</span>';
  }

  const dueLabel = escalation.due_at
    ? new Date(escalation.due_at).toLocaleString()
    : 'within 24 hours of submission';

  const facetsHtml = escalation.facets && Object.keys(escalation.facets).length > 0
    ? Object.entries(escalation.facets).map(([k, v]) => `<span class="chip" style="font-size:12px">${escapeHtml(k)}: ${escapeHtml(String(v))}</span>`).join(' ')
    : '';

  return renderLayout(
    'Question Status & Receipt',
    '/ask',
    `<div class="reading-column">
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:12px">
        <h1 style="margin:0">Escalation Receipt</h1>
        ${statusBadge}
      </div>

      <div class="strata-section" style="border:1px solid var(--rule);padding:16px;border-radius:var(--radius-control);margin-bottom:16px">
        <div style="font-size:12px;color:var(--text-muted);margin-bottom:6px">
          Submitted: ${new Date(escalation.at).toLocaleString()} · Class: ${escapeHtml(escalation.query_class)}
        </div>
        <p style="font-size:16px;font-weight:600;margin:0 0 8px 0">${escapeHtml(escalation.question)}</p>
        ${facetsHtml ? `<div style="margin-bottom:8px">${facetsHtml}</div>` : ''}
      </div>

      ${isPending ? `
      <div class="strata-section" style="border:1px solid #fef3c7;background:var(--surface-raised);padding:16px;border-radius:var(--radius-control);margin-bottom:16px">
        <h2 style="font-size:16px;margin:0 0 6px 0">Pending Owner Review</h2>
        <p style="margin:0 0 8px 0;font-size:14px">
          The owner typically reviews and answers pending queries within 24 hours (due by <strong>${escapeHtml(dueLabel)}</strong>).
        </p>
        <p style="margin:0 0 12px 0;font-size:13px;color:var(--text-muted)">
          Bookmark this link or refresh to see the reply. You can also provide an email or handle below to be notified directly.
        </p>

        ${escalation.draft ? `
        <div style="margin:12px 0;padding:10px 12px;background:var(--surface-page);border:1px solid var(--rule);border-radius:var(--radius-control);font-size:13px">
          <strong>Draft Under Review (Private to Visitor):</strong>
          <p style="margin:4px 0 0 0;font-style:italic;color:var(--text-muted)">${escapeHtml(escalation.draft)}</p>
        </div>` : ''}

        <div id="contact-feedback" style="display:none;margin-bottom:8px;font-size:13px;color:var(--accent)"></div>

        <form id="contact-form" style="display:flex;gap:8px;flex-wrap:wrap">
          <label for="contact-input" class="visually-hidden">Notification Email</label>
          <input id="contact-input" type="text" class="ask-input" style="flex:1;min-width:200px" value="${escapeHtml(escalation.visitor_contact || '')}" placeholder="you@example.com (optional notification)" />
          <button type="submit" id="btn-save-contact" class="btn btn-secondary">Save Notification Contact</button>
        </form>

        <div style="margin-top:16px;padding-top:12px;border-top:1px solid var(--rule);font-size:13px">
          Need an immediate live discussion instead? <a href="/book?q=${encodeURIComponent(escalation.question)}">Book a 30-minute consultation →</a>
        </div>
      </div>
      <script>
        (function() {
          var form = document.getElementById('contact-form');
          var input = document.getElementById('contact-input');
          var fb = document.getElementById('contact-feedback');
          if (form) {
            form.addEventListener('submit', async function(e) {
              e.preventDefault();
              var contact = (input.value || '').trim();
              if (!contact) return;
              try {
                var res = await fetch('/api/ask/status/${statusToken}/contact', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ contact: contact })
                });
                var data = await res.json();
                if (res.ok && data.success) {
                  fb.textContent = '✓ ' + data.message;
                  fb.style.display = 'block';
                }
              } catch (err) {
                fb.textContent = 'Network error saving contact.';
                fb.style.display = 'block';
              }
            });
          }
        })();
      </script>` : ''}

      ${isApproved ? `
      <div class="strata-section" style="border:1px solid #d1fae5;background:var(--surface-raised);padding:16px;border-radius:var(--radius-control);margin-bottom:16px">
        <h2 style="font-size:16px;margin:0 0 8px 0;color:#065f46">Owner's Verified Reply</h2>
        <div style="font-size:15px;line-height:1.6;white-space:pre-wrap;margin-bottom:12px">${escapeHtml(escalation.final || escalation.draft || '')}</div>
        <div style="font-size:12px;color:var(--text-muted);border-top:1px solid var(--rule);padding-top:8px">
          Verified and approved by the owner directly from personal records.
        </div>
      </div>
      <p><a href="/ask" class="btn">Ask Another Question</a></p>` : ''}

      ${isRejected ? `
      <div class="strata-section" style="border:1px solid #fee2e2;background:var(--surface-raised);padding:16px;border-radius:var(--radius-control);margin-bottom:16px">
        <h2 style="font-size:16px;margin:0 0 8px 0;color:#991b1b">Question Declined</h2>
        <p style="margin:0 0 10px 0;font-size:14px">
          ${escapeHtml(escalation.rejection_reason || 'The owner reviewed this question and indicated it cannot be answered reliably from currently published records.')}
        </p>
        <p style="margin:0;font-size:13px;color:var(--text-muted)">
          If this involves specific non-public architectural constraints, consider <a href="/book?q=${encodeURIComponent(escalation.question)}">booking a live architecture conversation</a>.
        </p>
      </div>
      <p><a href="/ask" class="btn">Return to Ask</a></p>` : ''}
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

export interface AdminSettingsState {
  automatedAnsweringEnabled?: boolean;
  calibrationFrozen?: boolean;
  simulatedDegradationMode?: 'normal' | 'extractive' | 'disabled';
  tier1_floor?: number;
  tier2_floor?: number;
  facet_known_threshold?: number;
  theme?: typeof DEFAULT_STRATA_THEME;
}

export async function renderAdminWorkspacePage(
  repo: WebDataClient,
  settingsOrOptions?: AdminSettingsState | { settingsState?: AdminSettingsState; legacyRecoveryUsed?: boolean }
): Promise<string> {
  repo = adaptDataSource(repo);
  const settingsState = (settingsOrOptions as any)?.settingsState ?? ((settingsOrOptions as any)?.automatedAnsweringEnabled !== undefined ? settingsOrOptions as AdminSettingsState : undefined);
  const legacyRecoveryUsed = Boolean((settingsOrOptions as any)?.legacyRecoveryUsed);
  const answeringEnabledInitial = settingsState?.automatedAnsweringEnabled ?? true;
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
          .map((esc) => {
            const isPending = esc.status === 'pending';
            const dueLabel = esc.due_at ? `Due by ${new Date(esc.due_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : '';
            const contactLabel = esc.visitor_contact ? `Notify: ${escapeHtml(esc.visitor_contact)}` : 'Receipt link delivery';
            return `
            <div class="escalation-card" id="esc-card-${esc.id}" style="border:1px solid var(--rule);padding:16px;margin-bottom:16px;background:var(--surface-page);border-radius:var(--radius-control)">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;flex-wrap:wrap;gap:8px">
                <div>
                  <strong style="font-size:15px">Visitor Question (${escapeHtml(esc.query_class)}):</strong>
                  <span class="chip" style="margin-left:6px">${escapeHtml(esc.status)}</span>
                  ${dueLabel ? `<span class="chip" style="margin-left:4px;font-size:11px;background:var(--surface-raised)">${escapeHtml(dueLabel)}</span>` : ''}
                </div>
                <div style="font-size:12px;color:var(--text-muted)">
                  ${escapeHtml(contactLabel)}
                </div>
              </div>
              <p style="margin:0 0 12px 0;font-size:14px;font-weight:500">${escapeHtml(esc.question)}</p>

              ${esc.facets && Object.keys(esc.facets).length > 0 ? `
              <div style="margin-bottom:10px;font-size:12px">
                <strong>Visitor Context Facets:</strong>
                <div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:4px">
                  ${Object.entries(esc.facets).map(([k, v]) => `<span class="chip" style="font-size:11px">${escapeHtml(k)}: ${escapeHtml(String(v))}</span>`).join('')}
                </div>
              </div>` : ''}

              <div style="margin-bottom:12px">
                <label for="draft-${esc.id}" style="display:block;font-size:12px;font-weight:600;margin-bottom:4px">
                  ${isPending ? 'Proposed draft reply:' : 'Final reply:'}
                </label>
                <textarea id="draft-${esc.id}" class="ask-input escalation-draft-textarea" style="width:100%;min-height:90px;font-size:13px;line-height:1.4" ${!isPending ? 'readonly' : ''}>${escapeHtml(esc.final || esc.draft || '')}</textarea>
              </div>

              ${isPending ? `
              <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
                <button type="button" class="btn btn-approve-escalation" data-id="${esc.id}">Approve &amp; Deliver</button>
                <button type="button" class="btn btn-secondary btn-reject-escalation" data-id="${esc.id}">Reject</button>
                <span id="esc-status-${esc.id}" style="font-size:12px;color:var(--text-muted)"></span>
              </div>` : `
              <div style="font-size:12px;color:var(--text-muted)">
                ${esc.status === 'approved' ? `✓ Approved and delivered to receipt.` : `✕ Rejected: ${escapeHtml(esc.rejection_reason || 'Declined')}`}
              </div>`}
            </div>`;
          })
          .join('\n')
      : '<p style="color:var(--text-muted)">No pending escalations.</p>';

  const scopedConstraintsHtml =
    scopedConstraints.length > 0
      ? scopedConstraints
          .map((sc) => {
            const isConfirmed = sc.status === 'confirmed';
            const isDiscarded = sc.status === 'discarded';
            return `
            <div class="scoped-constraint-card" id="constraint-card-${sc.id}" style="font-size:13px;padding:10px 12px;border:1px solid var(--rule);border-radius:var(--radius-control);margin-bottom:8px;background:var(--surface-page)">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;flex-wrap:wrap;gap:6px">
                <div>
                  <strong>Scope:</strong> <code style="font-size:11px">${escapeHtml(JSON.stringify(sc.scope || {}))}</code>
                </div>
                <span class="chip chip-constraint-status" id="chip-status-${sc.id}">${escapeHtml(sc.status)}</span>
              </div>
              <p style="margin:0 0 8px 0;font-size:13px">Quote: <em>"${escapeHtml(sc.source_quote || '')}"</em></p>
              <div style="display:flex;gap:6px;align-items:center">
                ${!isConfirmed ? `<button type="button" class="btn btn-secondary btn-confirm-constraint" data-id="${sc.id}" style="padding:2px 8px;font-size:12px">Confirm</button>` : ''}
                ${!isDiscarded ? `<button type="button" class="btn btn-secondary btn-discard-constraint" data-id="${sc.id}" style="padding:2px 8px;font-size:12px">Discard</button>` : ''}
                <span id="constraint-msg-${sc.id}" style="font-size:11px;color:var(--text-muted)"></span>
              </div>
            </div>`;
          })
          .join('\n')
      : '<p style="color:var(--text-muted);font-size:13px">No active scoped constraints recorded.</p>';

  const content = `
    <div class="later-thinking-banner" data-banner="alpha-warning" role="note" style="margin-bottom:16px">
      <strong>${escapeHtml(ALPHA_WARNING_TEXT)}</strong>
    </div>
    <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;margin-bottom:24px">
      <div>
        <h1 style="font-family:var(--font-reading);font-size:28px;margin:0">Admin Workspace</h1>
        <p style="color:var(--text-muted);margin:4px 0 0;font-size:14px">
          Entry-first authoring, machine-suggested structure inspector, routing kill-switch, self-calibration, and encrypted backups.
        </p>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
        <span id="deploy-status-chip" class="chip" data-status="idle" style="display:inline-flex;align-items:center;gap:6px;font-size:12px;padding:4px 8px" aria-live="polite">Deploy: Ready</span>
        <button type="button" class="btn btn-secondary" id="btn-publish-now" style="font-size:12px">Publish Now</button>
        <a href="/admin/import" class="btn btn-secondary" id="btn-import-triage" style="text-decoration:none;display:inline-flex;align-items:center">Import &amp; Triage</a>
        <a href="/admin/settings" class="btn btn-secondary" id="btn-admin-settings" style="text-decoration:none;display:inline-flex;align-items:center">Settings &amp; Calibration</a>
        <button type="button" class="btn btn-secondary" id="btn-killswitch" aria-pressed="${answeringEnabledInitial ? 'true' : 'false'}">${answeringEnabledInitial ? 'Pause Automated Answering' : 'Resume Automated Answering'}</button>
        <button type="button" class="btn btn-secondary" id="btn-backup-drill">Run Backup &amp; Restore Drill</button>
        <a href="/api/settings/export" target="_blank" class="btn btn-secondary" style="text-decoration:none;display:inline-flex;align-items:center">Export Markdown + Sidecar</a>
      </div>
    </div>

    <div id="admin-legacy-recovery-notice" class="admin-notice-banner" role="alert" style="display:${legacyRecoveryUsed ? 'block' : 'none'};padding:12px 16px;border:1px solid var(--accent);border-radius:var(--radius-control);background:var(--surface-raised);margin-bottom:16px;font-size:14px">
      You signed in with an older recovery code. Replace your recovery codes in Settings &gt; Account as soon as you can.
    </div>

    <div id="admin-undo-banner" role="region" aria-label="Undo action" style="display:none;margin-bottom:16px"></div>
    <div id="admin-status-banner" role="status" aria-live="polite" style="margin-bottom:16px"></div>

    <div id="admin-walkthrough-card" style="padding:12px 16px;border:1px solid var(--accent);border-radius:var(--radius-control);background:var(--surface-raised);margin-bottom:16px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">
      <div>
        <strong>First-Run Authoring Walkthrough:</strong>
        <span style="font-size:13px;color:var(--text-muted);margin-left:6px">1. Paste write-up or choose Guided mode. 2. Use Inspector to accept suggested roles &amp; confirm facets. 3. Preview redactions and publish.</span>
      </div>
      <button type="button" class="btn btn-secondary" id="btn-dismiss-walkthrough" style="padding:2px 8px;font-size:12px">Dismiss</button>
    </div>

    <!-- Header Status Area (20261020-UI-06) -->
    <div class="admin-header-status" role="region" aria-label="System status">
      <div style="display:flex;align-items:center;gap:var(--space-2);flex-wrap:wrap">
        <strong>Status:</strong>
        <span class="chip" id="admin-status-build">Static rebuild: Idle</span>
        <span class="chip" id="admin-status-answering">${answeringEnabledInitial ? 'Answering: Active' : 'Answering: Paused'}</span>
      </div>
      <div style="display:flex;align-items:center;gap:var(--space-2)">
        <span class="chip" style="border-color:var(--role-outcome)">● Operational</span>
      </div>
    </div>

    <!-- Three-Pane Entry Workspace -->
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
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-wrap:gap;gap:8px">
          <div style="display:flex;align-items:center;gap:8px">
            <h2 id="editor-mode-heading" style="font-size:18px;margin:0">New entry</h2>
            <span id="chip-current-state" class="chip" data-status="private" style="font-size:12px;padding:2px 8px;background:#f1f5f9;color:#475569">State: PRIVATE (Draft)</span>
          </div>
          <div style="display:flex;gap:6px">
            <button type="button" class="btn btn-secondary active" id="mode-btn-paste" style="font-size:12px;padding:2px 8px">Paste / Freeform</button>
            <button type="button" class="btn btn-secondary" id="mode-btn-guided" style="font-size:12px;padding:2px 8px">Guided Mode</button>
            <button type="button" class="btn btn-secondary" id="mode-btn-quick" style="font-size:12px;padding:2px 8px">Quick Log</button>
          </div>
        </div>

        <!-- Guided Mode Panel -->
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

        <!-- Quick Log Panel -->
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
              <label for="entry-profile" style="font-size:13px;font-weight:600;display:block">Role profile</label>
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
              <label for="entry-visibility" style="font-size:13px;font-weight:600;display:block">Visibility</label>
              <select id="entry-visibility" class="ask-input" style="width:100%;padding:6px">
                <option value="private">Private (Draft)</option>
                <option value="unlisted">Unlisted</option>
                <option value="public">Public</option>
              </select>
            </div>
            <div>
              <label for="entry-date" style="font-size:13px;font-weight:600;display:block">When it happened</label>
              <input id="entry-date" type="date" class="ask-input" style="width:100%;padding:6px" value="" />
              <div id="entry-date-error" style="color:var(--red-700,#b42318);font-size:12px;display:none;margin-top:2px" role="alert"></div>
            </div>
            <div>
              <label for="entry-temporal-level" style="font-size:13px;font-weight:600;display:block">Temporal confidence</label>
              <select id="entry-temporal-level" class="ask-input" style="width:100%;padding:6px">
                <option value="exact">Exact (default)</option>
                <option value="range">Range</option>
                <option value="estimated">Estimated</option>
              </select>
              <div id="range-end-container" style="display:none;margin-top:6px">
                <label for="entry-date-range-end" style="font-size:12px;font-weight:600;display:block">Range end</label>
                <input id="entry-date-range-end" type="date" class="ask-input" style="width:100%;padding:4px 6px;font-size:12px" />
              </div>
            </div>
          </div>
          <div style="margin-bottom:12px">
            <label style="font-size:13px;display:flex;align-items:center;gap:6px;cursor:pointer">
              <input id="entry-hindsight" type="checkbox" />
              Are you writing about something that happened earlier?
            </label>
          </div>

          <div class="editor-workspace" style="margin-bottom:12px">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
              <label for="entry-body" style="font-size:13px;font-weight:600;display:block">
                Body (Markdown + GFM — min 60vh editor workspace; only body and date required)
              </label>
              <div style="display:flex;gap:4px">
                <button type="button" class="btn btn-secondary" id="btn-toggle-editor-mode" style="padding:2px 8px;font-size:12px">Preview</button>
              </div>
            </div>
            <div class="editor-toolbar" role="toolbar" aria-label="Markdown formatting toolbar">
              <button type="button" data-action="h2" title="Insert H2 Heading">H2</button>
              <button type="button" data-action="h3" title="Insert H3 Heading">H3</button>
              <button type="button" data-action="bold" title="Insert Bold Text"><strong>B</strong></button>
              <button type="button" data-action="italic" title="Insert Italic Text"><em>I</em></button>
              <button type="button" data-action="list" title="Insert Bullet List">• List</button>
              <button type="button" data-action="code" title="Insert Code Block">&lt;/&gt;</button>
              <button type="button" data-action="quote" title="Insert Blockquote">“ Quote</button>
              <button type="button" data-action="link" title="Insert Link">🔗 Link</button>
            </div>
            <textarea id="entry-body" rows="12" class="ask-input editor-textarea" placeholder="Paste any existing write-up or write in Markdown / GFM..."></textarea>
            <div id="entry-body-preview" class="editor-preview reading-column" style="display:none;min-height:var(--editor-min-height, 60vh);padding:16px;background:var(--surface-raised);border:1px solid var(--rule);border-radius:0 0 var(--radius-control) var(--radius-control);overflow-y:auto"></div>
            <div class="editor-statusbar">
              <span id="editor-word-count">0 words (soft cap: 3,000)</span>
              <span id="editor-word-warning" style="display:none;color:var(--status-warn);font-weight:600">Entry exceeds 3,000 words. Consider breaking into a multi-part series for readability.</span>
            </div>
            <input type="hidden" id="entry-preview-token" name="redactionPreviewToken" value="" />
          </div>

          <div id="redaction-preview-box" style="margin-bottom:12px"></div>

          <div style="margin-bottom:12px;padding:10px 12px;border:1px solid var(--rule);border-radius:4px;background:var(--bg-subtle)">
            <label style="display:flex;align-items:flex-start;gap:8px;font-size:13px;cursor:pointer">
              <input type="checkbox" id="entry-nda-confirmed" name="nda_confirmed" value="true" style="margin-top:2px" />
              <span><strong>Confidentiality &amp; NDA Confirmation:</strong> I confirm this content is not subject to an active Non-Disclosure Agreement (NDA) or client confidentiality restrictions, or that all necessary client approvals and redactions have been completed.</span>
            </label>
          </div>

          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:gap;gap:8px">
            <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center" id="editor-action-buttons">
              <button type="button" class="btn btn-secondary" id="btn-save-draft">Save draft</button>
              <button type="button" class="btn btn-primary" id="btn-open-publish-dialog">Publish…</button>
              <button type="submit" class="btn btn-secondary" id="btn-publish-entry">Publish</button>
              <button type="button" class="btn btn-secondary" id="btn-unlist" style="display:none">Unlist</button>
              <button type="button" class="btn btn-secondary" id="btn-redaction-check">Check for private details</button>
              <button type="button" class="btn btn-secondary" id="btn-unpublish" style="display:none">Unpublish</button>
              <button type="button" class="btn btn-secondary" id="btn-delete-entry" style="display:none;color:var(--red-700,#b42318)">Delete</button>
              <span id="editor-status-line" role="status" aria-live="polite" tabindex="-1" style="font-size:13px;display:none;align-items:center;gap:6px;padding:4px 8px;border-radius:var(--radius-control);outline:none"></span>
            </div>
            <span style="font-size:13px;color:var(--text-muted)">Structure is optional. You can publish now and add more later.</span>
          </div>
        </form>

        <div id="editor-toast" role="status" aria-live="polite" style="position:fixed;bottom:24px;right:24px;z-index:9999;max-width:420px;display:none;padding:12px 16px;background:var(--surface-raised);border:1px solid var(--accent);border-radius:var(--radius-card, 8px);box-shadow:0 4px 16px rgba(0,0,0,0.18);font-size:14px"></div>

        <!-- Publish Pre-Flight Dialog (WP-14.3) -->
        <dialog id="publish-dialog" class="publish-dialog" role="dialog" aria-modal="true" aria-labelledby="publish-dialog-title" style="display:none;position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);width:520px;max-width:92vw;max-height:90vh;overflow-y:auto;background:var(--bg-base);border:1px solid var(--rule);border-radius:var(--radius-card, 8px);box-shadow:0 12px 32px rgba(0,0,0,0.25);z-index:10000;padding:24px;box-sizing:border-box">
          <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--rule);padding-bottom:12px;margin-bottom:16px">
            <h2 id="publish-dialog-title" style="margin:0;font-size:18px">Publish Pre-Flight</h2>
            <button type="button" class="btn btn-secondary" id="btn-close-publish-dialog" style="padding:4px 8px">✕ Close</button>
          </div>

          <!-- Pre-flight step 1: Private details scan -->
          <div style="margin-bottom:16px;padding:12px;border:1px solid var(--rule);border-radius:6px;background:var(--surface-raised)">
            <div style="font-size:13px;font-weight:600;margin-bottom:4px">1. Private-Detail Check</div>
            <div id="publish-scan-status" style="font-size:13px">Checking for private details...</div>
            <div id="publish-matches-detail" style="display:none;margin-top:8px">
              <button type="button" class="btn btn-secondary" id="btn-publish-open-drawer" style="font-size:12px;padding:2px 8px">View Detailed Findings →</button>
            </div>
          </div>

          <!-- Pre-flight step 2: NDA confirmation (conditional) -->
          <div id="publish-nda-section" style="display:none;margin-bottom:16px;padding:12px;border:1px solid var(--rule);border-radius:6px;background:var(--surface-raised)">
            <div style="font-size:13px;font-weight:600;margin-bottom:4px">2. Confidentiality &amp; NDA Confirmation</div>
            <label style="font-size:13px;display:flex;align-items:flex-start;gap:8px;cursor:pointer">
              <input type="checkbox" id="publish-dialog-nda" style="margin-top:2px" />
              <span>I confirm that publishing this content does not violate any non-disclosure agreement (NDA) or confidentiality obligation.</span>
            </label>
          </div>

          <!-- Pre-flight step 3: Who can see it -->
          <div style="margin-bottom:16px;padding:12px;border:1px solid var(--rule);border-radius:6px;background:var(--surface-raised)">
            <div style="font-size:13px;font-weight:600;margin-bottom:6px">3. Who Can See It</div>
            <div style="display:flex;gap:16px;font-size:13px">
              <label style="display:flex;align-items:center;gap:6px;cursor:pointer">
                <input type="radio" name="publish-visibility-choice" value="public" checked /> Public (searchable, in index)
              </label>
              <label style="display:flex;align-items:center;gap:6px;cursor:pointer">
                <input type="radio" name="publish-visibility-choice" value="unlisted" /> Unlisted (direct link only)
              </label>
            </div>
          </div>

          <!-- Pre-flight step 4: What happens next -->
          <div id="publish-what-happens-next" style="margin-bottom:16px;padding:12px;border:1px solid var(--rule);border-radius:6px;background:var(--surface-raised)">
            <div style="font-size:13px;font-weight:600;margin-bottom:6px">4. What Happens Next</div>
            <ul style="font-size:12px;color:var(--text-muted);margin:0;padding-left:18px;line-height:1.6">
              <li>Static rebuild queued for public site</li>
              <li>Enrichment pipeline queued for structured facets</li>
              <li>RSS feed and sitemap updated</li>
              <li>Exact URL: <code id="publish-target-url" style="color:var(--text-base)">/work/...</code></li>
            </ul>
          </div>

          <div id="publish-dialog-alert" style="display:none;margin-bottom:12px;color:var(--red-700,#b42318);font-size:13px" role="alert"></div>

          <!-- Pre-flight step 5: Single primary action -->
          <div style="display:flex;justify-content:flex-end;gap:8px;border-top:1px solid var(--rule);padding-top:12px">
            <button type="button" class="btn btn-secondary" id="btn-cancel-publish">Cancel</button>
            <button type="button" class="btn btn-primary" id="btn-confirm-publish">Publish</button>
          </div>
        </dialog>
        <div id="publish-dialog-backdrop" style="display:none;position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.4);z-index:9999"></div>

        <!-- UI Redaction Preview Drawer -->
        <aside id="redaction-preview-drawer" class="redaction-drawer" style="display:none;position:fixed;top:0;right:0;width:460px;max-width:92vw;height:100vh;background:var(--bg-base);box-shadow:-4px 0 24px rgba(0,0,0,0.18);border-left:1px solid var(--rule);z-index:9999;padding:24px;overflow-y:auto;box-sizing:border-box" role="dialog" aria-labelledby="redaction-drawer-title" aria-modal="true">
          <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--rule);padding-bottom:12px;margin-bottom:16px">
            <h2 id="redaction-drawer-title" style="margin:0;font-size:18px">Redaction Review Drawer</h2>
            <button type="button" class="btn btn-secondary" id="btn-close-redaction-drawer" style="padding:4px 8px">✕ Close</button>
          </div>
          <p style="font-size:13px;color:var(--text-muted);margin:0 0 16px 0">
            Multi-pass entity scanner detected sensitive patterns. Review matches by pass or mask them automatically before public publishing.
          </p>

          <div style="margin-bottom:16px">
            <button type="button" class="btn btn-primary" id="btn-drawer-redact-all" style="width:100%;padding:10px">Redact All Findings</button>
          </div>

          <!-- Pass 1: Credentials & Secret Keys -->
          <div style="margin-bottom:16px;border:1px solid var(--rule);border-radius:6px;padding:12px;background:var(--bg-subtle)">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
              <strong style="font-size:13px">Pass 1: Credentials &amp; Secrets</strong>
              <span id="drawer-count-pass1" class="chip" style="font-size:11px">0 found</span>
            </div>
            <div id="drawer-items-pass1" style="font-size:13px;color:var(--text-muted)">None detected.</div>
          </div>

          <!-- Pass 2: NDA & Confidentiality Markers -->
          <div style="margin-bottom:16px;border:1px solid var(--rule);border-radius:6px;padding:12px;background:var(--bg-subtle)">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
              <strong style="font-size:13px">Pass 2: NDA &amp; Restrictions</strong>
              <span id="drawer-count-pass2" class="chip" style="font-size:11px">0 found</span>
            </div>
            <div id="drawer-items-pass2" style="font-size:13px;color:var(--text-muted)">None detected.</div>
          </div>

          <!-- Pass 3: Entities & Exclusions -->
          <div style="margin-bottom:16px;border:1px solid var(--rule);border-radius:6px;padding:12px;background:var(--bg-subtle)">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
              <strong style="font-size:13px">Pass 3: Entities, Project Names &amp; Exclusions</strong>
              <span id="drawer-count-pass3" class="chip" style="font-size:11px">0 found</span>
            </div>
            <div id="drawer-items-pass3" style="font-size:13px;color:var(--text-muted)">None detected.</div>
          </div>

          <!-- Highlight Preview Pane -->
          <div style="margin-top:16px">
            <strong style="font-size:13px;display:block;margin-bottom:6px">Matched Entity Highlighting:</strong>
            <div id="drawer-highlight-preview" style="font-family:var(--font-code);font-size:12px;padding:12px;background:var(--bg-subtle);border:1px solid var(--rule);border-radius:4px;white-space:pre-wrap;max-height:220px;overflow-y:auto"></div>
          </div>
        </aside>
      </section>

      <!-- Pane 3: Structure Inspector & Answerability Preview -->
      <aside class="admin-pane" aria-label="Structure inspector and answerability preview">
        <h2 style="font-size:16px;margin:0 0 8px 0">Inspector: <span id="inspector-heading">${escapeHtml(firstEntry?.title || 'Sample')}</span></h2>

        <!-- Inspector Tabs -->
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
            <div class="level-step" role="listitem" data-level="L0" data-active="${firstLevel === 'L0' || firstLevel === 'L1' || firstLevel === 'L2' || firstLevel === 'L3'}">Text</div>
            <div class="level-step" role="listitem" data-level="L1" data-active="${firstLevel === 'L1' || firstLevel === 'L2' || firstLevel === 'L3'}">Context</div>
            <div class="level-step" role="listitem" data-level="L2" data-active="${firstLevel === 'L2' || firstLevel === 'L3'}">Roles</div>
            <div class="level-step" role="listitem" data-level="L3" data-active="${firstLevel === 'L3'}">Claims</div>
          </div>
          <p style="font-size:13px;margin:4px 0 12px 0" id="inspector-unlocks"><strong>Unlocks:</strong> ${escapeHtml(levelDetails.unlocked.join(', '))}</p>

          <h3 style="font-size:14px;margin:12px 0 6px 0">Role Annotations &amp; Suggestions</h3>
          <div id="inspector-annotations-list" style="font-size:13px">
            <p style="color:var(--text-muted)">Select an entry to review machine-suggested roles.</p>
          </div>
          <div style="margin-top:12px;padding-top:10px;border-top:1px solid var(--rule)">
            <button type="button" class="btn btn-secondary" id="btn-trigger-enrichment" style="font-size:11px;padding:3px 8px">Run Background Enrichment</button>
            <div id="enrichment-status-container" style="display:none;margin-top:6px">
              <span class="chip" id="enrichment-status-chip" style="font-size:11px"></span>
            </div>
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
          <h3 style="font-size:14px;margin:0 0 4px 0">Attached Evidence</h3>
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
          <h3 style="font-size:14px;margin:0 0 6px 0">Answerability &amp; Gap Questions</h3>
          <ul id="inspector-gap-questions" style="font-size:13px;padding-left:18px;margin:0">
            ${gapHtml}
          </ul>
        </div>

        <!-- Tab 5: History Panel -->
        <div class="inspector-tab-panel" id="panel-history" role="tabpanel" aria-labelledby="tab-btn-history">
          <h3 style="font-size:14px;margin:0 0 6px 0">Revision History</h3>
          <div id="inspector-revisions-list" style="font-size:13px">
            ${firstEntryRevisionsHtml}
          </div>
        </div>
      </aside>
    </div>

    <!-- Operational Panels: Inbox Escalations, Audit, Routing & Calibration -->
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(340px,1fr));gap:24px;margin-top:24px">
      <section class="admin-pane" aria-labelledby="inbox-heading">
        <h2 id="inbox-heading" style="font-size:18px;margin:0 0 12px 0">Inbox (${escalations.length})</h2>
        ${escalationsHtml}
      </section>

      <section class="admin-pane" aria-labelledby="audit-heading">
        <h2 id="audit-heading" style="font-size:18px;margin:0 0 12px 0">Conflicts to review</h2>

        <!-- Honest Topology Conflicts Card (20261020-UX-09) -->
        <div class="topology-conflicts-card" id="topology-conflicts-card" style="margin-bottom:16px;padding:12px;border:1px solid var(--rule);border-radius:var(--radius-control);background:var(--surface-page)">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
            <h3 style="font-size:13px;margin:0">Topology Conflict Detection</h3>
            <span class="chip" style="font-size:11px" id="chip-topology-status">501 Not Implemented</span>
          </div>
          <p id="topology-status-msg" style="font-size:12px;color:var(--text-muted);margin:0">
            Automated claim topology conflict detector is not yet implemented (SIMULATED finding M6). No active conflicts detected.
          </p>
        </div>

        <h3 style="font-size:14px;margin:12px 0 6px 0">Suggested rules from your replies (${scopedConstraints.length})</h3>
        ${scopedConstraintsHtml}
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
        let answeringEnabled = ${answeringEnabledInitial ? 'true' : 'false'};
        let currentPreviewToken = '';
        let currentHasWarnings = false;
        let slugIsManual = false;
        let undoTimeout = null;

        ${ADMIN_API_CLIENT_SCRIPT}

        let toastTimeout = null;
        function showEditorFeedback(messageHtml, isError) {
          const statusLine = document.getElementById('editor-status-line');
          const toast = document.getElementById('editor-toast');
          const cleanHtml = messageHtml.startsWith('<div') ? messageHtml : ('<span>' + messageHtml + '</span>');
          if (statusLine) {
            statusLine.innerHTML = cleanHtml;
            statusLine.style.display = 'inline-flex';
            statusLine.style.outline = 'none';
            statusLine.focus();
          }
          if (toast) {
            toast.innerHTML = cleanHtml;
            toast.style.display = 'block';
            if (toastTimeout) clearTimeout(toastTimeout);
            toastTimeout = setTimeout(function() {
              toast.style.display = 'none';
            }, 6000);
          }
          if (banner) {
            banner.innerHTML = messageHtml.startsWith('<div')
              ? messageHtml
              : ('<div class="' + (isError ? 'later-thinking-banner' : 'as-of-banner') + '">' + messageHtml + '</div>');
          }
        }

        async function refreshEntriesList(selectedId) {
          try {
            const res = await apiClient('/api/entries?visibility=all');
            if (!res.ok) return;
            const data = await res.json();
            const entries = data.entries || [];
            const listEl = document.getElementById('admin-entries-list');
            if (listEl) {
              listEl.innerHTML = entries.map(function(e) {
                return '<li class="admin-entry-item" data-entry-id="' + escapeClientHtml(e.id) + '" style="padding:8px 0;border-bottom:1px solid var(--rule);display:flex;justify-content:space-between;align-items:center;gap:8px">' +
                  '<button type="button" class="admin-entry-select-btn" data-entry-id="' + escapeClientHtml(e.id) + '" style="background:none;border:none;padding:0;font-weight:600;text-align:left;cursor:pointer;color:var(--text);flex:1">' +
                    escapeClientHtml(e.title) +
                  '</button>' +
                  '<span class="chip" data-status="' + escapeClientHtml(e.visibility) + '">' + escapeClientHtml(e.visibility) + '</span>' +
                  (e.visibility !== 'private' ? '<a href="/work/' + escapeClientHtml(e.slug) + '" target="_blank" style="font-size:12px;color:var(--text-muted);text-decoration:none" title="View live page">↗</a>' : '') +
                '</li>';
              }).join('');

              listEl.querySelectorAll('.admin-entry-select-btn').forEach(function(btn) {
                btn.addEventListener('click', function() {
                  const id = btn.getAttribute('data-entry-id');
                  if (id) selectEntry(id);
                });
              });
            }
            const countHeading = document.querySelector('aside[aria-label="Entries list and filters"] h2');
            if (countHeading) {
              countHeading.textContent = 'Entries (' + entries.length + ')';
            }
          } catch (_) {}
        }

        function renderAdminError(res) {
          if (!res) {
            return '<div class="later-thinking-banner" role="alert" data-error="network">Can&#39;t reach the server. Please check your connection and retry.</div>';
          }
          if (res.status === 401) {
            return '<div class="later-thinking-banner" role="alert" data-error="401">Your session has expired. You&#39;re signed out. <a href="/admin/login" style="margin-left:8px;font-weight:600">Sign in again →</a></div>';
          }
          if (res.status === 403) {
            return '<div class="later-thinking-banner" role="alert" data-error="403">Security check failed (CSRF token invalid or missing). Your session expired. Reload the page and sign in again.</div>';
          }
          if (res.status >= 500) {
            return '<div class="later-thinking-banner" role="alert" data-error="500">Server error (HTTP ' + res.status + '). Can&#39;t reach the server. Please retry your request.</div>';
          }
          return '<div class="later-thinking-banner" role="alert" data-error="' + res.status + '">Action failed. Check your input and retry.</div>';
        }

        function showUndoBanner(message, onUndo) {
          if (undoTimeout) clearTimeout(undoTimeout);
          const undoHtml = '<div style="display:flex;justify-content:space-between;align-items:center;gap:12px">' +
            '<span>' + message + '</span>' +
            '<button type="button" class="btn btn-secondary" id="btn-undo-action" style="padding:2px 8px;font-size:12px;margin-left:8px">Undo (30s)</button>' +
          '</div>';
          showEditorFeedback(undoHtml, false);
          if (undoBanner) {
            undoBanner.style.display = 'block';
            undoBanner.innerHTML = '<div class="as-of-banner" style="display:flex;justify-content:space-between;align-items:center">' +
              '<span>' + message + '</span>' +
              '<button type="button" class="btn btn-secondary" id="btn-undo-action-banner" style="padding:2px 8px;font-size:12px;margin-left:8px">Undo (30s)</button>' +
              '</div>';
            const bBtn = document.getElementById('btn-undo-action-banner');
            if (bBtn) {
              bBtn.addEventListener('click', async function() {
                if (undoTimeout) clearTimeout(undoTimeout);
                undoBanner.style.display = 'none';
                await onUndo();
              });
            }
          }
          const undoBtn = document.getElementById('btn-undo-action');
          if (undoBtn) {
            undoBtn.addEventListener('click', async function() {
              if (undoTimeout) clearTimeout(undoTimeout);
              if (undoBanner) undoBanner.style.display = 'none';
              const statusLine = document.getElementById('editor-status-line');
              if (statusLine) statusLine.style.display = 'none';
              const toast = document.getElementById('editor-toast');
              if (toast) toast.style.display = 'none';
              await onUndo();
            });
          }
          undoTimeout = setTimeout(function() {
            if (undoBanner) undoBanner.style.display = 'none';
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
            const statusLine = document.getElementById('editor-status-line');
            if (statusLine) { statusLine.style.display = 'none'; statusLine.innerHTML = ''; }
            const toast = document.getElementById('editor-toast');
            if (toast) { toast.style.display = 'none'; toast.innerHTML = ''; }
            const res = await apiClient('/api/entries/' + id);
            if (!res.ok) {
              const banner = document.getElementById('admin-status-banner');
              if (banner) banner.innerHTML = renderAdminError(res);
              return;
            }
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
            const dateErr = document.getElementById('entry-date-error');
            if (dateErr) dateErr.style.display = 'none';
            const temporalSelect = document.getElementById('entry-temporal-level');
            const rangeEndContainer = document.getElementById('range-end-container');
            const rangeEndInput = document.getElementById('entry-date-range-end');
            if (temporalSelect) {
              temporalSelect.value = currentRev?.temporal_level || 'exact';
            }
            if (rangeEndContainer) {
              rangeEndContainer.style.display = currentRev?.temporal_level === 'range' ? 'block' : 'none';
            }
            if (rangeEndInput) {
              rangeEndInput.value = currentRev?.valid_from_range_end ? currentRev.valid_from_range_end.slice(0, 10) : '';
            }
            const hindsightCheck = document.getElementById('entry-hindsight');
            if (hindsightCheck) hindsightCheck.checked = !!currentRev?.is_hindsight;
            const bodyEl = document.getElementById('entry-body');
            if (bodyEl) {
              bodyEl.value = currentRev?.body_md || '';
              updateWordCount();
            }

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

        const legacyNotice = document.getElementById('admin-legacy-recovery-notice');
        if (sessionStorage.getItem('lp_legacy_recovery_used') === 'true' && legacyNotice) {
          legacyNotice.style.display = 'block';
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
            const statusLine = document.getElementById('editor-status-line');
            if (statusLine) { statusLine.style.display = 'none'; statusLine.innerHTML = ''; }
            const toast = document.getElementById('editor-toast');
            if (toast) { toast.style.display = 'none'; toast.innerHTML = ''; }
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

        // Entry lifecycle handlers (Save draft, Unpublish, Delete) migrated to client bundle:
        // apps/web/src/client/admin-entry.ts (WP-14.0)

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

        function setupRedactionDrawer(warnings, fullText, multiPass) {
          const drawerEl = document.getElementById('redaction-preview-drawer');
          const openBtn = document.getElementById('btn-open-redaction-drawer');
          const closeBtn = document.getElementById('btn-close-redaction-drawer');
          const redactAllBtn = document.getElementById('btn-drawer-redact-all');
          const countP1 = document.getElementById('drawer-count-pass1');
          const countP2 = document.getElementById('drawer-count-pass2');
          const countP3 = document.getElementById('drawer-count-pass3');
          const itemsP1 = document.getElementById('drawer-items-pass1');
          const itemsP2 = document.getElementById('drawer-items-pass2');
          const itemsP3 = document.getElementById('drawer-items-pass3');
          const highlightEl = document.getElementById('drawer-highlight-preview');

          if (openBtn && drawerEl) {
            openBtn.onclick = function() {
              drawerEl.style.display = 'block';
            };
          }
          if (closeBtn && drawerEl) {
            closeBtn.onclick = function() {
              drawerEl.style.display = 'none';
            };
          }

          const pass1 = (multiPass && multiPass.pass1Secrets) || warnings.filter(function(w) { return w.type === 'secret'; });
          const pass2 = (multiPass && multiPass.pass2NdaMarkers) || warnings.filter(function(w) { return w.type === 'nda'; });
          const pass3 = (multiPass && multiPass.pass3Entities) || warnings.filter(function(w) { return w.type !== 'secret' && w.type !== 'nda'; });

          if (countP1) countP1.textContent = pass1.length + ' found';
          if (countP2) countP2.textContent = pass2.length + ' found';
          if (countP3) countP3.textContent = pass3.length + ' found';

          function renderGroupItems(group) {
            if (group.length === 0) return '<div style="color:var(--text-muted)">None detected.</div>';
            return group.map(function(item) {
              return '<div style="display:flex;justify-content:space-between;align-items:center;padding:4px 0;border-bottom:1px solid var(--rule)">' +
                '<span><code>' + escapeClientHtml(item.match) + '</code> <small style="color:var(--text-muted)">(' + escapeClientHtml(item.type) + ')</small></span>' +
                '<button type="button" class="btn btn-secondary btn-redact-item" data-match="' + escapeClientHtml(item.match) + '" data-type="' + escapeClientHtml(item.type) + '" style="padding:1px 6px;font-size:11px">Redact</button>' +
                '</div>';
            }).join('');
          }

          if (itemsP1) itemsP1.innerHTML = renderGroupItems(pass1);
          if (itemsP2) itemsP2.innerHTML = renderGroupItems(pass2);
          if (itemsP3) itemsP3.innerHTML = renderGroupItems(pass3);

          // Highlight matches in preview pane
          if (highlightEl) {
            let highlighted = escapeClientHtml(fullText);
            warnings.forEach(function(w) {
              const escMatch = escapeClientHtml(w.match);
              if (escMatch) {
                highlighted = highlighted.split(escMatch).join('<mark style="background:#fedf89;padding:1px 4px;border-radius:2px">' + escMatch + '</mark>');
              }
            });
            highlightEl.innerHTML = highlighted;
          }

          // Individual item redact buttons
          const itemBtns = drawerEl ? drawerEl.querySelectorAll('.btn-redact-item') : [];
          itemBtns.forEach(function(btn) {
            btn.onclick = function() {
              const targetMatch = btn.getAttribute('data-match');
              const targetType = btn.getAttribute('data-type') || 'REDACTED';
              const bodyInput = document.getElementById('entry-body');
              if (bodyInput && targetMatch) {
                bodyInput.value = bodyInput.value.split(targetMatch).join('[REDACTED: ' + targetType.toUpperCase() + ']');
                runRedactionCheck();
              }
            };
          });

          // Redact All button
          if (redactAllBtn) {
            redactAllBtn.onclick = function() {
              const bodyInput = document.getElementById('entry-body');
              if (bodyInput) {
                let updated = bodyInput.value;
                const sorted = warnings.slice().sort(function(a, b) {
                  return (b.match || '').length - (a.match || '').length;
                });
                sorted.forEach(function(w) {
                  if (w.match) {
                    updated = updated.split(w.match).join('[REDACTED: ' + String(w.type).toUpperCase() + ']');
                  }
                });
                bodyInput.value = updated;
                if (drawerEl) drawerEl.style.display = 'none';
                runRedactionCheck();
              }
            };
          }
        }

        async function runRedactionCheck() {
          const textEl = document.getElementById('entry-body');
          const text = textEl ? textEl.value.trim() : '';
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
                  ' — Confirm none of this is under NDA before publishing.' +
                  ' <button type="button" class="btn btn-secondary" id="btn-open-redaction-drawer" style="margin-left:8px;padding:2px 8px;font-size:12px">Open Review Drawer →</button></div>' + tokenBadgeHtml;
                setupRedactionDrawer(data.warnings, text, data.multiPass);
              } else if (Array.isArray(data.warnings) && data.warnings.length === 0) {
                // State 2: clean (the ONLY state that can ever be green)
                redactBox.innerHTML = '<div class="chip" data-state="clean" style="border-color:var(--role-outcome)">✓ No confidential secrets or NDA markers detected.</div>' + tokenBadgeHtml;
                const drawerEl = document.getElementById('redaction-preview-drawer');
                if (drawerEl) drawerEl.style.display = 'none';
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

        function updateWordCount() {
          const bodyEl = document.getElementById('entry-body');
          const countEl = document.getElementById('editor-word-count');
          const warnEl = document.getElementById('editor-word-warning');
          if (!bodyEl || !countEl) return;
          const text = bodyEl.value || '';
          const words = text.trim() ? text.trim().split(/\\s+/).length : 0;
          countEl.textContent = words + ' words (soft cap: 3,000)';
          if (warnEl) {
            warnEl.style.display = words > 3000 ? 'block' : 'none';
          }
        }

        // Token invalidated after a body edit & word count update
        const bodyInputEl = document.getElementById('entry-body');
        if (bodyInputEl) {
          bodyInputEl.addEventListener('input', function() {
            updateWordCount();
            if (currentPreviewToken) {
              currentPreviewToken = '';
              const tokenInput = document.getElementById('entry-preview-token');
              if (tokenInput) tokenInput.value = '';
              const badge = document.getElementById('preview-token-badge');
              if (badge) badge.remove();
              redactBox.innerHTML = '<div class="later-thinking-banner" data-state="invalidated" role="status">Body edited since last check — preview token invalidated. Re-run "Check for private details" before publishing.</div>';
            }
          });
        }

        // Markdown Formatting Toolbar Actions (20261020-UI-01)
        const editorToolbar = document.querySelector('.editor-toolbar');
        if (editorToolbar) {
          editorToolbar.addEventListener('click', function(e) {
            const btn = e.target.closest('button[data-action]');
            if (!btn) return;
            const action = btn.getAttribute('data-action');
            const textarea = document.getElementById('entry-body');
            if (!textarea) return;
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const sel = textarea.value.substring(start, end);
            const needsLeadingNewline = start > 0 && textarea.value[start - 1] !== '\\n';
            const prefix = needsLeadingNewline ? '\\n\\n' : '';
            let replacement = '';

            switch (action) {
              case 'h2':
                replacement = prefix + '## ' + (sel || 'Heading 2');
                break;
              case 'h3':
                replacement = prefix + '### ' + (sel || 'Heading 3');
                break;
              case 'bold':
                replacement = '**' + (sel || 'bold text') + '**';
                break;
              case 'italic':
                replacement = '*' + (sel || 'italic text') + '*';
                break;
              case 'list':
                replacement = prefix + '- ' + (sel || 'List item');
                break;
              case 'code':
                replacement = prefix + '\x60\x60\x60\\n' + (sel || '// code') + '\\n\x60\x60\x60';
                break;
              case 'quote':
                replacement = prefix + '> ' + (sel || 'Blockquote');
                break;
              case 'link':
                replacement = '[' + (sel || 'link text') + '](https://example.com)';
                break;
            }

            if (replacement) {
              textarea.setRangeText(replacement, start, end, 'end');
              textarea.focus();
              updateWordCount();
            }
          });
        }

        // Markdown Source / Preview Toggle (20261020-UI-01)
        const toggleEditorModeBtn = document.getElementById('btn-toggle-editor-mode');
        const previewPane = document.getElementById('entry-body-preview');
        if (toggleEditorModeBtn && previewPane && bodyInputEl) {
          toggleEditorModeBtn.addEventListener('click', function() {
            const isEditing = bodyInputEl.style.display !== 'none';
            if (isEditing) {
              bodyInputEl.style.display = 'none';
              previewPane.style.display = 'block';
              toggleEditorModeBtn.textContent = 'Edit source';
              const rawMd = bodyInputEl.value;
              previewPane.innerHTML = rawMd
                .split(/\\n\\s*\\n/)
                .map(function(block) {
                  const t = block.trim();
                  if (!t) return '';
                  if (t.startsWith('### ')) return '<h3>' + escapeClientHtml(t.slice(4)) + '</h3>';
                  if (t.startsWith('## ')) return '<h2>' + escapeClientHtml(t.slice(3)) + '</h2>';
                  if (t.startsWith('# ')) return '<h2>' + escapeClientHtml(t.slice(2)) + '</h2>';
                  if (t.startsWith('> ')) return '<blockquote class="reading-quote"><p>' + escapeClientHtml(t.slice(2)) + '</p></blockquote>';
                  if (t.startsWith('\x60\x60\x60')) return '<pre class="code-block"><code>' + escapeClientHtml(t.replace(/^\x60\x60\x60[a-z]*\\n?/, '').replace(/\x60\x60\x60$/, '')) + '</code></pre>';
                  return '<p>' + escapeClientHtml(t) + '</p>';
                })
                .join('\\n');
            } else {
              bodyInputEl.style.display = 'block';
              previewPane.style.display = 'none';
              toggleEditorModeBtn.textContent = 'Preview';
              bodyInputEl.focus();
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

        const deployChip = document.getElementById('deploy-status-chip');
        const publishNowBtn = document.getElementById('btn-publish-now');
        const triggerEnrichBtn = document.getElementById('btn-trigger-enrichment');
        const enrichStatusContainer = document.getElementById('enrichment-status-container');
        const enrichStatusChip = document.getElementById('enrichment-status-chip');

        async function fetchDeployStatus() {
          if (!deployChip) return;
          try {
            const res = await apiClient('/api/publish/status');
            if (res.ok) {
              const data = await res.json();
              deployChip.setAttribute('data-status', data.state || data.status);
              if (data.state === 'building') {
                deployChip.textContent = 'Deploy: Building...';
              } else if (data.state === 'queued') {
                deployChip.textContent = 'Deploy: Queued (next build in ' + data.minutesRemaining + 'm)';
              } else if (data.state === 'cap_reached') {
                deployChip.textContent = 'Deploy: Cap reached (' + data.buildsToday + '/' + data.maxBuildsPerDay + ' today)';
              } else if (data.state === 'live') {
                deployChip.textContent = 'Deploy: Live (' + data.buildsToday + '/' + data.maxBuildsPerDay + ' today)';
              } else {
                deployChip.textContent = 'Deploy: Ready (' + data.buildsToday + '/' + data.maxBuildsPerDay + ' today)';
              }
            }
          } catch (e) {}
        }
        fetchDeployStatus();

        if (publishNowBtn) {
          publishNowBtn.addEventListener('click', async function() {
            publishNowBtn.setAttribute('disabled', 'true');
            publishNowBtn.textContent = 'Building...';
            try {
              const res = await apiClient('/api/publish/now', { method: 'POST' });
              if (res.ok) {
                const data = await res.json();
                banner.innerHTML = '<div class="as-of-banner">Static site rebuild triggered successfully (build #' + data.buildsToday + ' today).</div>';
                await fetchDeployStatus();
              } else {
                banner.innerHTML = renderAdminError(res);
              }
            } catch (err) {
              banner.innerHTML = '<div class="later-thinking-banner" role="alert">Network error triggering static rebuild.</div>';
            } finally {
              publishNowBtn.removeAttribute('disabled');
              publishNowBtn.textContent = 'Publish Now';
            }
          });
        }

        if (triggerEnrichBtn) {
          triggerEnrichBtn.addEventListener('click', async function() {
            const entryId = entryIdInput ? entryIdInput.value : undefined;
            triggerEnrichBtn.setAttribute('disabled', 'true');
            triggerEnrichBtn.textContent = 'Queueing...';
            try {
              const res = await apiClient('/api/publish/enrich', {
                method: 'POST',
                body: JSON.stringify(entryId ? { entryId: entryId } : {})
              });
              if (res.ok) {
                if (enrichStatusContainer) enrichStatusContainer.style.display = 'block';
                if (enrichStatusChip) enrichStatusChip.textContent = entryId ? 'Enrichment: queued for entry' : 'Enrichment: queued for portfolio';
                banner.innerHTML = '<div class="as-of-banner">✓ Enrichment pipeline queued.</div>';
              } else {
                banner.innerHTML = renderAdminError(res);
              }
            } catch (err) {
              banner.innerHTML = '<div class="later-thinking-banner" role="alert">Network error queueing enrichment.</div>';
            } finally {
              triggerEnrichBtn.removeAttribute('disabled');
              triggerEnrichBtn.textContent = 'Run Background Enrichment';
            }
          });
        }

        // Escalation inbox interactive review & approval (Spec 6.2, UX-08)
        document.querySelectorAll('.btn-approve-escalation').forEach(function(btn) {
          btn.addEventListener('click', async function() {
            var id = btn.getAttribute('data-id');
            var textarea = document.getElementById('draft-' + id);
            var finalReply = textarea ? textarea.value : '';
            var statusEl = document.getElementById('esc-status-' + id);
            btn.setAttribute('disabled', 'true');
            if (statusEl) statusEl.textContent = 'Approving...';
            try {
              var res = await apiClient('/api/inbox/' + id + '/approve', {
                method: 'PATCH',
                body: JSON.stringify({ finalReply: finalReply })
              });
              if (res.ok) {
                if (statusEl) statusEl.textContent = '✓ Approved and delivered';
                btn.style.display = 'none';
                var rejectBtn = document.querySelector('.btn-reject-escalation[data-id="' + id + '"]');
                if (rejectBtn) rejectBtn.style.display = 'none';
                var badge = document.querySelector('#esc-card-' + id + ' .chip');
                if (badge) {
                  badge.textContent = 'approved';
                  badge.style.background = '#d1fae5';
                  badge.style.color = '#065f46';
                }
              } else {
                if (statusEl) statusEl.textContent = 'Error approving escalation.';
                btn.removeAttribute('disabled');
              }
            } catch (err) {
              if (statusEl) statusEl.textContent = 'Network error approving escalation.';
              btn.removeAttribute('disabled');
            }
          });
        });

        document.querySelectorAll('.btn-reject-escalation').forEach(function(btn) {
          btn.addEventListener('click', async function() {
            var id = btn.getAttribute('data-id');
            var reason = prompt('Optional reason for rejection (proposes technical constraint if constraint detected):', 'Out of current scope or technical constraint');
            if (reason === null) return;
            var statusEl = document.getElementById('esc-status-' + id);
            btn.setAttribute('disabled', 'true');
            if (statusEl) statusEl.textContent = 'Rejecting...';
            try {
              var res = await apiClient('/api/inbox/' + id + '/reject', {
                method: 'PATCH',
                body: JSON.stringify({ reason: reason })
              });
              if (res.ok) {
                if (statusEl) statusEl.textContent = '✕ Rejected';
                btn.style.display = 'none';
                var approveBtn = document.querySelector('.btn-approve-escalation[data-id="' + id + '"]');
                if (approveBtn) approveBtn.style.display = 'none';
                var badge = document.querySelector('#esc-card-' + id + ' .chip');
                if (badge) {
                  badge.textContent = 'rejected';
                  badge.style.background = '#fee2e2';
                  badge.style.color = '#991b1b';
                }
              } else {
                if (statusEl) statusEl.textContent = 'Error rejecting escalation.';
                btn.removeAttribute('disabled');
              }
            } catch (err) {
              if (statusEl) statusEl.textContent = 'Network error rejecting escalation.';
              btn.removeAttribute('disabled');
            }
          });
        });
        // Scoped constraints confirm & discard actions (Spec 11, UX-09)
        document.querySelectorAll('.btn-confirm-constraint').forEach(function(btn) {
          btn.addEventListener('click', async function() {
            var id = btn.getAttribute('data-id');
            var msgEl = document.getElementById('constraint-msg-' + id);
            var statusEl = document.getElementById('chip-status-' + id);
            btn.setAttribute('disabled', 'true');
            if (msgEl) msgEl.textContent = 'Confirming...';
            try {
              var res = await apiClient('/api/settings/constraints/' + id + '/confirm', { method: 'PATCH' });
              if (res.ok) {
                if (statusEl) {
                  statusEl.textContent = 'confirmed';
                  statusEl.style.background = '#d1fae5';
                  statusEl.style.color = '#065f46';
                }
                btn.style.display = 'none';
                if (msgEl) msgEl.textContent = '✓ Confirmed';
              } else {
                if (msgEl) msgEl.textContent = 'Error confirming constraint.';
                btn.removeAttribute('disabled');
              }
            } catch (err) {
              if (msgEl) msgEl.textContent = 'Network error.';
              btn.removeAttribute('disabled');
            }
          });
        });

        document.querySelectorAll('.btn-discard-constraint').forEach(function(btn) {
          btn.addEventListener('click', async function() {
            var id = btn.getAttribute('data-id');
            var msgEl = document.getElementById('constraint-msg-' + id);
            var statusEl = document.getElementById('chip-status-' + id);
            btn.setAttribute('disabled', 'true');
            if (msgEl) msgEl.textContent = 'Discarding...';
            try {
              var res = await apiClient('/api/settings/constraints/' + id + '/discard', { method: 'PATCH' });
              if (res.ok) {
                if (statusEl) {
                  statusEl.textContent = 'discarded';
                  statusEl.style.background = '#fee2e2';
                  statusEl.style.color = '#991b1b';
                }
                btn.style.display = 'none';
                if (msgEl) msgEl.textContent = '✕ Discarded';
              } else {
                if (msgEl) msgEl.textContent = 'Error discarding constraint.';
                btn.removeAttribute('disabled');
              }
            } catch (err) {
              if (msgEl) msgEl.textContent = 'Network error.';
              btn.removeAttribute('disabled');
            }
          });
        });
      })();
    </script>
  `;

  return renderLayout('Admin Workspace', '/admin', content, {
    clientScript: '/assets/client/admin-entry.js',
  });
}

export async function renderAdminSettingsPage(
  repo: WebDataClient,
  settingsState?: AdminSettingsState
): Promise<string> {
  repo = adaptDataSource(repo);
  const tier1Floor = settingsState?.tier1_floor ?? 0.82;
  const tier2Floor = settingsState?.tier2_floor ?? 0.55;
  const facetThreshold = settingsState?.facet_known_threshold ?? 0.90;
  const calibrationFrozen = settingsState?.calibrationFrozen ?? false;
  const answeringEnabled = settingsState?.automatedAnsweringEnabled ?? true;
  const degradationMode = settingsState?.simulatedDegradationMode ?? 'normal';
  const theme = settingsState?.theme ?? structuredClone(DEFAULT_STRATA_THEME);
  const themeConformance = verifyThemeConformance(theme);

  const content = `
    <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;margin-bottom:24px">
      <div>
        <h1 style="font-family:var(--font-reading);font-size:28px;margin:0">Admin Operations &amp; System Calibration</h1>
        <p style="color:var(--text-muted);margin:4px 0 0;font-size:14px">
          Configure routing floors, provider registry, degradation ladders, theme tokens, notification channels, and backup restore drills.
        </p>
      </div>
      <div>
        <a href="/admin" class="btn btn-secondary" style="text-decoration:none;display:inline-flex;align-items:center">← Back to Workspace</a>
      </div>
    </div>

    <div id="settings-status-banner" role="status" aria-live="polite" style="margin-bottom:16px"></div>

    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(340px,1fr));gap:24px">
      <!-- Section 1: Routing Floors & Calibration -->
      <section class="admin-pane" aria-labelledby="routing-heading">
        <h2 id="routing-heading" style="font-size:18px;margin:0 0 12px 0">Routing Floors &amp; Calibration</h2>
        <div style="margin-bottom:12px">
          <label for="setting-tier1-floor" style="font-size:12px;font-weight:600;display:block;margin-bottom:4px">
            Tier 1 Advisory Floor (shipped default: 0.82):
          </label>
          <input type="number" id="setting-tier1-floor" class="ask-input" style="width:100%" step="0.01" min="0.1" max="1.0" value="${tier1Floor}" />
          <div id="tier1-warning" class="later-thinking-banner" role="alert" style="display:${tier1Floor < 0.82 ? 'block' : 'none'};margin-top:8px;font-size:12px">
            ⚠️ <strong>Warning:</strong> Tier 1 floor is set below the shipped default (0.82). Unverified advisory answers may be served without owner review.
          </div>
        </div>

        <div style="margin-bottom:12px">
          <label for="setting-tier2-floor" style="font-size:12px;font-weight:600;display:block;margin-bottom:4px">
            Tier 2 Escalation Floor (shipped default: 0.55):
          </label>
          <input type="number" id="setting-tier2-floor" class="ask-input" style="width:100%" step="0.01" min="0.1" max="1.0" value="${tier2Floor}" />
        </div>

        <div style="margin-bottom:12px">
          <label for="setting-facet-threshold" style="font-size:12px;font-weight:600;display:block;margin-bottom:4px">
            Facet Known Threshold (shipped default: 0.90):
          </label>
          <input type="number" id="setting-facet-threshold" class="ask-input" style="width:100%" step="0.01" min="0.5" max="1.0" value="${facetThreshold}" />
        </div>

        <div style="margin-bottom:12px;display:flex;align-items:center;gap:8px">
          <input type="checkbox" id="setting-calibration-frozen" ${calibrationFrozen ? 'checked' : ''} />
          <label for="setting-calibration-frozen" style="font-size:13px">Freeze Calibration</label>
        </div>

        <div style="margin-bottom:16px;display:flex;align-items:center;gap:8px">
          <input type="checkbox" id="setting-answering-enabled" ${answeringEnabled ? 'checked' : ''} />
          <label for="setting-answering-enabled" style="font-size:13px">Automated Answering Enabled (Kill-switch)</label>
        </div>

        <button type="button" class="btn" id="btn-save-routing">Save Calibration &amp; Routing</button>
      </section>

      <!-- Section 2: Provider Registry & Degradation Ladder -->
      <section class="admin-pane" aria-labelledby="providers-heading">
        <h2 id="providers-heading" style="font-size:18px;margin:0 0 12px 0">Provider Registry &amp; Degradation Ladder</h2>
        <div style="font-size:12px;color:var(--text-muted);margin-bottom:12px">
          Active Provider Chain &amp; Zero-Retention Disclosures:
        </div>
        <table style="width:100%;font-size:12px;border-collapse:collapse;margin-bottom:16px">
          <thead>
            <tr style="border-bottom:1px solid var(--rule);text-align:left">
              <th style="padding:4px 0">Provider</th>
              <th style="padding:4px 0">Model</th>
              <th style="padding:4px 0">Data Classes</th>
            </tr>
          </thead>
          <tbody>
            <tr style="border-bottom:1px solid var(--rule)">
              <td style="padding:6px 0"><code>local-onnx</code></td>
              <td>bge-small-en-v1.5 (dim 384)</td>
              <td>public, unpublished, private, sensitive</td>
            </tr>
            <tr style="border-bottom:1px solid var(--rule)">
              <td style="padding:6px 0"><code>groq</code></td>
              <td>llama-3.3-70b-versatile</td>
              <td>public, unpublished, private (zero-retention)</td>
            </tr>
            <tr style="border-bottom:1px solid var(--rule)">
              <td style="padding:6px 0"><code>gemini</code></td>
              <td>gemini-2.5-flash</td>
              <td>public (trains on free tier)</td>
            </tr>
          </tbody>
        </table>

        <div style="margin-bottom:16px">
          <label for="setting-degradation-mode" style="font-size:12px;font-weight:600;display:block;margin-bottom:4px">
            Simulated Degradation Mode:
          </label>
          <select id="setting-degradation-mode" class="ask-input" style="width:100%">
            <option value="normal" ${degradationMode === 'normal' ? 'selected' : ''}>Normal (Extractive + Generative)</option>
            <option value="extractive" ${degradationMode === 'extractive' ? 'selected' : ''}>Extractive Only (Zero LLM synthesis)</option>
            <option value="disabled" ${degradationMode === 'disabled' ? 'selected' : ''}>Disabled (Offline handoff only)</option>
          </select>
        </div>

        <button type="button" class="btn btn-secondary" id="btn-save-degradation">Update Degradation Mode</button>
      </section>

      <!-- Section 3: Theme Customization & WCAG Conformance -->
      <section class="admin-pane" aria-labelledby="theme-heading">
        <h2 id="theme-heading" style="font-size:18px;margin:0 0 12px 0">Theme Customization &amp; Conformance</h2>
        <div style="margin-bottom:12px">
          <label for="setting-theme-light-accent" style="font-size:12px;font-weight:600;display:block;margin-bottom:4px">
            Light Theme Primary Accent:
          </label>
          <input type="text" id="setting-theme-light-accent" class="ask-input" style="width:100%" value="${escapeHtml(theme.lightTokens?.['--accent'] || '#3A4FD0')}" />
        </div>

        <div style="margin-bottom:12px">
          <label for="setting-theme-dark-accent" style="font-size:12px;font-weight:600;display:block;margin-bottom:4px">
            Dark Theme Primary Accent:
          </label>
          <input type="text" id="setting-theme-dark-accent" class="ask-input" style="width:100%" value="${escapeHtml(theme.darkTokens?.['--accent'] || '#9AA8FF')}" />
        </div>

        <div id="theme-conformance-box" style="padding:10px;border:1px solid var(--rule);border-radius:var(--radius-control);background:var(--surface-page);margin-bottom:16px;font-size:12px">
          <div style="font-weight:600;margin-bottom:4px">Theme Conformance Status:</div>
          <div>Valid Token Keys: <strong>${themeConformance.valid ? 'Passed' : 'Failed'}</strong></div>
          <div>Missing Tokens: <strong>${themeConformance.missingTokens.length === 0 ? 'None' : escapeHtml(themeConformance.missingTokens.join(', '))}</strong></div>
        </div>

        <button type="button" class="btn btn-secondary" id="btn-save-theme">Apply Theme Tokens</button>
      </section>

      <!-- Section 4: Notification Channel Delivery -->
      <section class="admin-pane" aria-labelledby="notifications-heading">
        <h2 id="notifications-heading" style="font-size:18px;margin:0 0 12px 0">Notification Delivery</h2>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
          <span style="font-size:13px">Channel Status:</span>
          <span class="chip" id="chip-notify-status">not_configured</span>
        </div>
        <p style="font-size:12px;color:var(--text-muted);margin:0 0 12px 0">
          Delivery adapter for ntfy, webhook, or email is not yet configured. The system will report honest not_configured status per honesty invariant.
        </p>
        <div style="margin-bottom:12px">
          <label for="setting-notify-topic" style="font-size:12px;font-weight:600;display:block;margin-bottom:4px">
            Notification Topic / Webhook URL:
          </label>
          <input type="text" id="setting-notify-topic" class="ask-input" style="width:100%" placeholder="https://ntfy.sh/owner-alerts" />
        </div>
        <button type="button" class="btn btn-secondary" id="btn-test-notification">Test Notification Delivery</button>
        <div id="notify-test-result" style="margin-top:8px;font-size:12px"></div>
      </section>

      <!-- Section 5: Encrypted Backups & Restore Verification Drill -->
      <section class="admin-pane" aria-labelledby="backups-heading">
        <h2 id="backups-heading" style="font-size:18px;margin:0 0 12px 0">Encrypted Backups &amp; Restore Drill</h2>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
          <span style="font-size:13px">Backup Subsystem:</span>
          <span class="chip" id="chip-backup-status">not_configured</span>
        </div>
        <table style="width:100%;font-size:12px;border-collapse:collapse;margin-bottom:16px">
          <tbody>
            <tr style="border-bottom:1px solid var(--rule)">
              <td style="padding:4px 0"><strong>Encryption:</strong></td>
              <td style="text-align:right"><code>age (X25519)</code></td>
            </tr>
            <tr style="border-bottom:1px solid var(--rule)">
              <td style="padding:4px 0"><strong>Retention:</strong></td>
              <td style="text-align:right">7 daily / 4 weekly / 6 monthly</td>
            </tr>
            <tr style="border-bottom:1px solid var(--rule)">
              <td style="padding:4px 0"><strong>Last Restore Drill:</strong></td>
              <td style="text-align:right"><code>not_configured</code></td>
            </tr>
          </tbody>
        </table>
        <button type="button" class="btn btn-secondary" id="btn-run-backup-drill">Run Encrypted Backup Drill</button>
        <div id="backup-drill-result" style="margin-top:8px;font-size:12px"></div>
      </section>
    </div>

    <script>
      (function() {
        const banner = document.getElementById('settings-status-banner');
        const tier1Input = document.getElementById('setting-tier1-floor');
        const tier1Warning = document.getElementById('tier1-warning');
        const tier2Input = document.getElementById('setting-tier2-floor');
        const facetInput = document.getElementById('setting-facet-threshold');
        const frozenCheck = document.getElementById('setting-calibration-frozen');
        const answeringCheck = document.getElementById('setting-answering-enabled');
        const degradationSelect = document.getElementById('setting-degradation-mode');

        ${ADMIN_API_CLIENT_SCRIPT}

        // Live validation of Tier 1 floor warning (< 0.82)
        if (tier1Input && tier1Warning) {
          tier1Input.addEventListener('input', function() {
            var val = parseFloat(tier1Input.value);
            if (!isNaN(val) && val < 0.82) {
              tier1Warning.style.display = 'block';
            } else {
              tier1Warning.style.display = 'none';
            }
          });
        }

        // Save Routing & Calibration
        var btnSaveRouting = document.getElementById('btn-save-routing');
        if (btnSaveRouting) {
          btnSaveRouting.addEventListener('click', async function() {
            btnSaveRouting.setAttribute('disabled', 'true');
            try {
              var payload = {
                tier1_floor: parseFloat(tier1Input.value),
                tier2_floor: parseFloat(tier2Input.value),
                facet_known_threshold: parseFloat(facetInput.value),
                calibrationFrozen: frozenCheck.checked,
                automatedAnsweringEnabled: answeringCheck.checked
              };
              var res = await apiClient('/api/settings/routing', {
                method: 'PATCH',
                body: JSON.stringify(payload)
              });
              if (res.ok) {
                var data = await res.json();
                var warnMsg = data.routing && data.routing.warning ? ' ' + data.routing.warning : '';
                banner.innerHTML = '<div class="as-of-banner">✓ Routing &amp; Calibration saved successfully.' + warnMsg + '</div>';
              } else {
                banner.innerHTML = '<div class="later-thinking-banner" role="alert">Error saving calibration settings (HTTP ' + res.status + ').</div>';
              }
            } catch (err) {
              banner.innerHTML = '<div class="later-thinking-banner" role="alert">Network error saving calibration settings.</div>';
            } finally {
              btnSaveRouting.removeAttribute('disabled');
            }
          });
        }

        // Update Degradation Mode
        var btnSaveDegradation = document.getElementById('btn-save-degradation');
        if (btnSaveDegradation) {
          btnSaveDegradation.addEventListener('click', async function() {
            btnSaveDegradation.setAttribute('disabled', 'true');
            try {
              var res = await apiClient('/api/settings/routing', {
                method: 'PATCH',
                body: JSON.stringify({ simulatedDegradationMode: degradationSelect.value })
              });
              if (res.ok) {
                banner.innerHTML = '<div class="as-of-banner">✓ Degradation mode updated to <strong>' + degradationSelect.value + '</strong>.</div>';
              } else {
                banner.innerHTML = '<div class="later-thinking-banner" role="alert">Error updating degradation mode.</div>';
              }
            } catch (err) {
              banner.innerHTML = '<div class="later-thinking-banner" role="alert">Network error updating degradation mode.</div>';
            } finally {
              btnSaveDegradation.removeAttribute('disabled');
            }
          });
        }

        // Save Theme Tokens
        var btnSaveTheme = document.getElementById('btn-save-theme');
        if (btnSaveTheme) {
          btnSaveTheme.addEventListener('click', async function() {
            btnSaveTheme.setAttribute('disabled', 'true');
            try {
              var lightAccent = document.getElementById('setting-theme-light-accent').value;
              var darkAccent = document.getElementById('setting-theme-dark-accent').value;
              var res = await apiClient('/api/settings/theme', {
                method: 'PATCH',
                body: JSON.stringify({
                  lightTokens: { '--accent': lightAccent },
                  darkTokens: { '--accent': darkAccent }
                })
              });
              if (res.ok) {
                var data = await res.json();
                banner.innerHTML = '<div class="as-of-banner">✓ Theme updated. Conformance check: <strong>' + (data.conformance && data.conformance.valid ? 'PASSED' : 'FAILED') + '</strong>.</div>';
              } else {
                banner.innerHTML = '<div class="later-thinking-banner" role="alert">Error updating theme tokens.</div>';
              }
            } catch (err) {
              banner.innerHTML = '<div class="later-thinking-banner" role="alert">Network error updating theme.</div>';
            } finally {
              btnSaveTheme.removeAttribute('disabled');
            }
          });
        }

        // Test Notification
        var btnTestNotification = document.getElementById('btn-test-notification');
        if (btnTestNotification) {
          btnTestNotification.addEventListener('click', async function() {
            var resultEl = document.getElementById('notify-test-result');
            btnTestNotification.setAttribute('disabled', 'true');
            if (resultEl) resultEl.innerHTML = '<span style="color:var(--text-muted)">Testing delivery...</span>';
            try {
              var res = await apiClient('/api/settings/notifications/test', { method: 'POST' });
              if (res.status === 501) {
                var errData = await res.json();
                if (resultEl) resultEl.innerHTML = '<div class="later-thinking-banner" role="note" style="margin:4px 0;font-size:11px"><strong>501 Not Implemented:</strong> ' + (errData.message || 'Notification adapter is not yet implemented.') + '</div>';
              } else if (res.ok) {
                if (resultEl) resultEl.innerHTML = '<span style="color:green">✓ Delivery test completed.</span>';
              } else {
                if (resultEl) resultEl.innerHTML = '<span style="color:red">Delivery test failed (HTTP ' + res.status + ').</span>';
              }
            } catch (err) {
              if (resultEl) resultEl.innerHTML = '<span style="color:red">Network error testing notification.</span>';
            } finally {
              btnTestNotification.removeAttribute('disabled');
            }
          });
        }

        // Run Backup Drill
        var btnRunBackupDrill = document.getElementById('btn-run-backup-drill');
        if (btnRunBackupDrill) {
          btnRunBackupDrill.addEventListener('click', async function() {
            var resultEl = document.getElementById('backup-drill-result');
            btnRunBackupDrill.setAttribute('disabled', 'true');
            if (resultEl) resultEl.innerHTML = '<span style="color:var(--text-muted)">Executing backup drill...</span>';
            try {
              var res = await apiClient('/api/settings/backups/run-drill', { method: 'POST' });
              if (res.status === 501) {
                var errData = await res.json();
                if (resultEl) resultEl.innerHTML = '<div class="later-thinking-banner" role="note" style="margin:4px 0;font-size:11px"><strong>501 Not Implemented:</strong> ' + (errData.message || 'Backup restore verification drill is not yet implemented.') + '</div>';
              } else if (res.ok) {
                if (resultEl) resultEl.innerHTML = '<span style="color:green">✓ Backup restore drill passed.</span>';
              } else {
                if (resultEl) resultEl.innerHTML = '<span style="color:red">Backup drill failed (HTTP ' + res.status + ').</span>';
              }
            } catch (err) {
              if (resultEl) resultEl.innerHTML = '<span style="color:red">Network error executing backup drill.</span>';
            } finally {
              btnRunBackupDrill.removeAttribute('disabled');
            }
          });
        }
      })();
    </script>
  `;

  return renderLayout('Settings & Calibration', '/admin/settings', content);
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
          <label id="login-code-label" for="login-totp" style="display:block;font-size:13px;font-weight:600;margin-bottom:4px">6-Digit Authenticator Code</label>
          <input id="login-totp" type="text" class="ask-input" style="width:100%;padding:8px;font-family:var(--font-code);letter-spacing:2px" placeholder="000000" autocomplete="one-time-code" required />
          <div id="login-code-help" style="font-size:12px;color:var(--text-muted);margin-top:4px">
            Enter the 6-digit verification code from your authenticator app (Google Authenticator, 1Password, etc.).
          </div>
          <div style="margin-top:8px">
            <button type="button" id="btn-toggle-recovery" style="background:none;border:none;padding:0;font-size:12px;color:var(--accent);text-decoration:underline;cursor:pointer">Lost your authenticator device? Sign in with a recovery code</button>
          </div>
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
        const toggleBtn = document.getElementById('btn-toggle-recovery');
        const codeLabel = document.getElementById('login-code-label');
        const codeInput = document.getElementById('login-totp');
        const codeHelp = document.getElementById('login-code-help');
        let recoveryMode = false;

        function checkMultipleCodes(val) {
          if (!val) return false;
          const lines = val.trim().split(new RegExp('\\r?\\n')).filter(function(l) { return l.trim().length > 0; });
          if (lines.length > 1) return true;
          const stripped = val.replace(new RegExp('[\\s-]+', 'g'), '');
          if (stripped.length >= 32) return true;
          const tokens = val.trim().split(new RegExp('\\s+'));
          if (tokens.length > 1) {
            const codeTokens = tokens.filter(function(t) { return new RegExp('^[a-zA-Z0-9]{4}-[a-zA-Z0-9]{4}$').test(t); });
            if (codeTokens.length > 1) return true;
          }
          return false;
        }

        if (codeInput) {
          codeInput.addEventListener('paste', function(e) {
            const pasteData = (e.clipboardData || window.clipboardData) ? (e.clipboardData || window.clipboardData).getData('text') : '';
            if (pasteData && checkMultipleCodes(pasteData)) {
              e.preventDefault();
              errBox.className = 'later-thinking-banner';
              errBox.textContent = 'Enter one code at a time';
              errBox.style.display = 'block';
              codeInput.value = '';
              return;
            }
          });
        }

        if (toggleBtn && codeLabel && codeInput && codeHelp) {
          toggleBtn.addEventListener('click', function() {
            recoveryMode = !recoveryMode;
            errBox.style.display = 'none';
            if (recoveryMode) {
              codeLabel.textContent = 'Single-Use Recovery Code';
              codeInput.placeholder = 'xxxx-xxxx-xxxx-xxxx';
              codeHelp.textContent = 'Enter one of your 8 emergency alphanumeric recovery codes. Each code can only be used once.';
              toggleBtn.textContent = 'Have your authenticator? Use 6-digit TOTP code';
            } else {
              codeLabel.textContent = '6-Digit Authenticator Code';
              codeInput.placeholder = '000000';
              codeHelp.textContent = 'Enter the 6-digit verification code from your authenticator app (Google Authenticator, 1Password, etc.).';
              toggleBtn.textContent = 'Lost your authenticator device? Sign in with a recovery code';
            }
          });
        }

        ${ADMIN_API_CLIENT_SCRIPT}

        form.addEventListener('submit', async function(e) {
          e.preventDefault();
          errBox.style.display = 'none';
          const username = document.getElementById('login-username').value;
          const password = document.getElementById('login-password').value;
          const rawCode = document.getElementById('login-totp').value.trim();

          if (checkMultipleCodes(rawCode)) {
            errBox.className = 'later-thinking-banner';
            errBox.textContent = 'Enter one code at a time';
            errBox.style.display = 'block';
            return;
          }

          let normalizedCode = rawCode;
          if (recoveryMode || rawCode.includes('-')) {
            const noSpaces = rawCode.toLowerCase().replace(new RegExp('[\\s-]+', 'g'), '');
            if (new RegExp('^[a-z0-9]{16}$').test(noSpaces)) {
              normalizedCode = noSpaces.slice(0, 4) + '-' + noSpaces.slice(4, 8) + '-' + noSpaces.slice(8, 12) + '-' + noSpaces.slice(12, 16);
            } else if (new RegExp('^[a-z0-9]{8}$').test(noSpaces)) {
              normalizedCode = noSpaces.slice(0, 4) + '-' + noSpaces.slice(4);
            } else {
              normalizedCode = rawCode.trim();
            }
          }

          try {
            const payload = {
              username: username,
              password: password,
              totpCode: recoveryMode ? undefined : normalizedCode,
              recoveryCode: recoveryMode ? normalizedCode : undefined,
              code: normalizedCode,
            };
            const res = await apiClient('/api/auth/login', {
              method: 'POST',
              body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (res.ok) {
              if (data.csrfToken) {
                sessionStorage.setItem('lp_csrf_token', data.csrfToken);
              }
              sessionStorage.setItem('lp_legacy_recovery_used', data.legacyRecoveryUsed ? 'true' : 'false');
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
            } else if (res.status === 400) {
              errBox.className = 'later-thinking-banner';
              errBox.textContent = data.message || data.error || 'Enter one code at a time';
              errBox.style.display = 'block';
            } else if (res.status === 401) {
              errBox.className = 'later-thinking-banner';
              errBox.textContent = data.message || data.error || (recoveryMode
                ? "That recovery code wasn't recognised. Enter one code, like abcd-1234. Each code works once."
                : 'Invalid credentials or TOTP code.');
              errBox.style.display = 'block';
            } else if (res.status === 403) {
              errBox.className = 'later-thinking-banner';
              errBox.textContent = data.message || data.error || 'Access forbidden (security check failed).';
              errBox.style.display = 'block';
            } else if (res.status === 429) {
              errBox.className = 'later-thinking-banner';
              errBox.textContent = data.message || data.error || 'Too many failed login attempts. Try again in 15 minutes.';
              errBox.style.display = 'block';
            } else if (res.status >= 500) {
              errBox.className = 'later-thinking-banner';
              errBox.textContent = 'Server error during sign-in. Please retry.';
              errBox.style.display = 'block';
            } else {
              errBox.className = 'later-thinking-banner';
              errBox.textContent = data.message || data.error || ('Sign-in failed (HTTP ' + res.status + ')');
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
    <div class="admin-setup-container" style="max-width:680px;margin:32px auto;padding:24px;border:1px solid var(--rule);background:var(--surface-page)">
      <div class="wizard-header" style="margin-bottom:20px;border-bottom:1px solid var(--rule);padding-bottom:16px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <span class="chip" id="wizard-step-chip">Step 1 of 6 · First-Run Wizard</span>
          <span style="font-size:12px;color:var(--text-muted)">The Living Portfolio</span>
        </div>
        <div class="wizard-progress-bar" style="height:4px;background:var(--surface-panel);border-radius:2px;overflow:hidden">
          <div id="wizard-progress-fill" style="height:100%;width:16.6%;background:var(--accent);transition:width 0.3s ease"></div>
        </div>
        <div class="wizard-step-labels" style="display:flex;justify-content:space-between;margin-top:8px;font-size:11px;color:var(--text-muted)">
          <span id="step-lbl-1" style="font-weight:700;color:var(--text)">1. Account</span>
          <span id="step-lbl-2">2. Hosting</span>
          <span id="step-lbl-3">3. Providers</span>
          <span id="step-lbl-4">4. Alerts</span>
          <span id="step-lbl-5">5. Backups</span>
          <span id="step-lbl-6">6. Walkthrough</span>
        </div>
      </div>

      <div id="setup-status" role="alert" style="margin-bottom:16px;display:none"></div>

      <!-- Step 1: Owner Account Setup -->
      <div id="wizard-step-1" class="wizard-step">
        <h1 style="font-size:24px;margin:4px 0 8px 0">${WIZARD_STRINGS.step1.title}</h1>
        <p style="font-size:14px;color:var(--text-muted);margin:0 0 16px 0">
          ${WIZARD_STRINGS.step1.subtitle}
        </p>

        <form id="admin-setup-form">
          <div style="margin-bottom:12px">
            <label for="setup-username" style="display:block;font-size:13px;font-weight:600;margin-bottom:4px">${WIZARD_STRINGS.step1.fields.username.label}</label>
            <input id="setup-username" type="text" class="ask-input" style="width:100%;padding:8px" required />
            <div style="font-size:12px;color:var(--text-muted);margin-top:4px">${WIZARD_STRINGS.step1.fields.username.help}</div>
          </div>
          <div style="margin-bottom:12px">
            <label for="setup-password" style="display:block;font-size:13px;font-weight:600;margin-bottom:4px">${WIZARD_STRINGS.step1.fields.password.label}</label>
            <input id="setup-password" type="password" minlength="12" class="ask-input" style="width:100%;padding:8px" required />
            <div style="font-size:12px;color:var(--text-muted);margin-top:4px">${WIZARD_STRINGS.step1.fields.password.help}</div>
          </div>
          <div style="margin-bottom:16px">
            <label for="setup-totp-secret" style="display:block;font-size:13px;font-weight:600;margin-bottom:4px">${WIZARD_STRINGS.step1.fields.totpSecret.label}</label>
            <input id="setup-totp-secret" type="text" class="ask-input" style="width:100%;padding:8px;font-family:var(--font-code)" placeholder="Leave blank to generate random secret" />
            <div style="font-size:12px;color:var(--text-muted);margin-top:4px">${WIZARD_STRINGS.step1.fields.totpSecret.help}</div>
          </div>
          <button type="submit" class="btn btn-secondary" style="width:100%;padding:10px">${WIZARD_STRINGS.step1.submitButton}</button>
        </form>

        <div id="totp-enrolment-container" style="display:none;margin-top:16px;padding:16px;border:1px solid var(--rule);background:var(--surface-subtle)">
          <h3 style="font-size:18px;margin:0 0 8px 0">${WIZARD_STRINGS.step1.enrolment.title}</h3>
          <p style="font-size:13px;color:var(--text-muted);margin:0 0 12px 0">
            ${WIZARD_STRINGS.step1.enrolment.instructions}
          </p>
          <div id="setup-qr-code" style="max-width:200px;margin:12px auto;background:#fff;padding:8px;border-radius:4px;text-align:center"></div>
          <div style="margin:12px 0;text-align:center">
            <span style="font-size:12px;color:var(--text-muted)">${WIZARD_STRINGS.step1.enrolment.manualKeyLabel} </span>
            <code id="setup-manual-key" style="font-size:14px;font-weight:700;word-break:break-all"></code>
          </div>
          <form id="totp-confirm-form" style="margin-top:16px">
            <div style="margin-bottom:12px">
              <label for="confirm-totp-code" style="display:block;font-size:13px;font-weight:600;margin-bottom:4px">${WIZARD_STRINGS.step1.enrolment.codeLabel}</label>
              <input id="confirm-totp-code" type="text" maxlength="6" pattern="[0-9]{6}" class="ask-input" style="width:100%;padding:8px;text-align:center;font-size:18px;letter-spacing:4px" placeholder="000000" required />
            </div>
            <div id="totp-confirm-error" role="alert" class="later-thinking-banner" style="display:none;margin-bottom:12px"></div>
            <button id="btn-confirm-totp" type="submit" class="btn btn-secondary" style="width:100%;padding:10px">${WIZARD_STRINGS.step1.enrolment.verifyButton}</button>
          </form>
        </div>

        <div id="credentials-display-container" style="display:none;margin-top:16px;padding:20px;border:1px solid var(--rule);background:var(--surface-subtle);border-radius:6px">
          <h3 style="font-size:18px;margin:0 0 8px 0">${WIZARD_STRINGS.step1.credentials.title}</h3>
          <p style="font-size:13px;color:var(--text-muted);margin:0 0 16px 0">
            ${WIZARD_STRINGS.step1.credentials.instructions}
          </p>

          <div style="margin-bottom:16px;padding:12px;background:var(--surface);border:1px solid var(--rule);border-radius:4px">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
              <span style="font-size:12px;font-weight:600;text-transform:uppercase;color:var(--text-muted)">${WIZARD_STRINGS.step1.credentials.totpKeyLabel}</span>
              <button type="button" class="btn btn-secondary" id="btn-copy-totp-key" style="font-size:12px;padding:4px 8px">Copy Key</button>
            </div>
            <code id="credentials-totp-key" style="font-size:14px;font-weight:700;word-break:break-all"></code>
            <p style="font-size:12px;color:var(--text-muted);margin:4px 0 0 0">
              ${WIZARD_STRINGS.step1.credentials.totpKeyHelp}
            </p>
          </div>

          <div style="margin-bottom:16px;padding:12px;background:var(--surface);border:1px solid var(--rule);border-radius:4px">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
              <span style="font-size:12px;font-weight:600;text-transform:uppercase;color:var(--text-muted)">${WIZARD_STRINGS.step1.credentials.recoveryCodesLabel}</span>
              <div style="display:flex;gap:8px">
                <button type="button" class="btn btn-secondary" id="btn-copy-recovery-codes" style="font-size:12px;padding:4px 8px">Copy All</button>
                <button type="button" class="btn btn-secondary" id="btn-download-recovery-codes" style="font-size:12px;padding:4px 8px">Download (.txt)</button>
              </div>
            </div>
            <div id="recovery-codes-grid" style="display:grid;grid-template-columns:repeat(2, 1fr);gap:8px;font-family:var(--font-code);font-size:14px;font-weight:600">
            </div>
            <p style="font-size:12px;color:var(--text-muted);margin:8px 0 0 0">
              ${WIZARD_STRINGS.step1.credentials.recoveryCodesHelp}
            </p>
          </div>

          <div style="margin:16px 0;padding:12px;background:rgba(234, 179, 8, 0.1);border:1px solid rgba(234, 179, 8, 0.3);border-radius:4px">
            <label style="display:flex;align-items:center;gap:8px;font-size:13px;font-weight:600;cursor:pointer">
              <input type="checkbox" id="setup-saved-credentials-gate" style="width:16px;height:16px" />
              <span>${WIZARD_STRINGS.step1.credentials.gateLabel}</span>
            </label>
          </div>

          <button type="button" class="btn btn-primary" id="btn-continue-step2" disabled style="width:100%;padding:10px;margin-bottom:8px">${WIZARD_STRINGS.step1.credentials.continueButton}</button>
        </div>
      </div>

      <!-- Step 2: Hosting Option & Preset -->
      <div id="wizard-step-2" class="wizard-step" style="display:none">
        <h2 style="font-size:22px;margin:4px 0 8px 0">${WIZARD_STRINGS.step2.title}</h2>
        <p style="font-size:14px;color:var(--text-muted);margin:0 0 16px 0">
          ${WIZARD_STRINGS.step2.subtitle}
        </p>

        <div style="display:flex;flex-direction:column;gap:10px;margin-bottom:16px">
          ${WIZARD_STRINGS.step2.hostingPresets.map((preset, idx) => `
            <label style="display:flex;align-items:flex-start;gap:10px;padding:12px;border:1px solid var(--rule);background:var(--surface-subtle);cursor:pointer">
              <input type="radio" name="hosting-preset" value="${preset.value}" ${idx === 0 ? 'checked' : ''} style="margin-top:3px" />
              <div>
                <strong>${preset.title}</strong>
                <div style="font-size:13px;color:var(--text);margin-top:2px">${preset.sentence}</div>
                <div style="font-size:12px;color:var(--text-muted);margin-top:2px">${preset.tradeoff}</div>
              </div>
            </label>
          `).join('')}
        </div>

        <div style="margin-bottom:16px;border-top:1px solid var(--rule);padding-top:16px">
          <label for="setup-origin-url" style="display:block;font-size:13px;font-weight:600;margin-bottom:4px">${WIZARD_STRINGS.step2.originUrl.label}</label>
          <input type="text" id="setup-origin-url" class="ask-input" style="width:100%;padding:8px" placeholder="${WIZARD_STRINGS.step2.originUrl.placeholder}" />
          <div style="font-size:12px;color:var(--text-muted);margin-top:4px">${WIZARD_STRINGS.step2.originUrl.help}</div>
        </div>

        <div style="display:flex;justify-content:space-between">
          <button type="button" class="btn btn-secondary btn-nav-step" data-target="1">${WIZARD_STRINGS.step2.backButton}</button>
          <button type="button" class="btn btn-primary btn-nav-step" data-target="3">${WIZARD_STRINGS.step2.nextButton}</button>
        </div>
      </div>

      <!-- Step 3: Model Providers & Privacy Boundary -->
      <div id="wizard-step-3" class="wizard-step" style="display:none">
        <h2 style="font-size:22px;margin:4px 0 8px 0">${WIZARD_STRINGS.step3.title}</h2>
        <p style="font-size:14px;color:var(--text-muted);margin:0 0 16px 0">
          ${WIZARD_STRINGS.step3.subtitle}
        </p>

        <div class="table-wrap" style="margin-bottom:16px">
          <table style="width:100%;border-collapse:collapse;font-size:13px">
            <thead>
              <tr style="border-bottom:1px solid var(--rule);text-align:left">
                ${WIZARD_STRINGS.step3.providersTable.headers.map(h => `<th style="padding:6px">${h}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${WIZARD_STRINGS.step3.providersTable.rows.map(row => `
                <tr style="border-bottom:1px solid var(--rule)">
                  <td style="padding:8px"><strong>${row.name}</strong></td>
                  <td style="padding:8px">${row.classes.map(c => `<span style="display:inline-block;padding:2px 6px;border-radius:2px;background:var(--surface-subtle);border:1px solid var(--rule);font-size:11px;color:var(--text-muted);cursor:default">${c}</span>`).join(' ')}</td>
                  <td style="padding:8px"><code>${row.model}</code></td>
                  <td style="padding:8px;color:${row.isLocal ? 'var(--green)' : 'var(--text-muted)'}" ${row.statusId ? `id="${row.statusId}"` : ''}>${row.status}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div class="as-of-banner" style="margin-bottom:16px">
          <strong>${WIZARD_STRINGS.step3.boundaryNotice}</strong>
          <p id="step3-keys-notice" style="margin:8px 0 0 0;font-weight:normal">${WIZARD_STRINGS.step3.keysNotice}</p>
        </div>

        <div style="display:flex;justify-content:space-between">
          <button type="button" class="btn btn-secondary btn-nav-step" data-target="2">${WIZARD_STRINGS.step3.backButton}</button>
          <button type="button" class="btn btn-primary btn-nav-step" data-target="4">${WIZARD_STRINGS.step3.nextButton}</button>
        </div>
      </div>

      <!-- Step 4: Notifications -->
      <div id="wizard-step-4" class="wizard-step" style="display:none">
        <h2 style="font-size:22px;margin:4px 0 8px 0">${WIZARD_STRINGS.step4.title}</h2>
        <p style="font-size:14px;color:var(--text-muted);margin:0 0 16px 0">
          ${WIZARD_STRINGS.step4.subtitle}
        </p>

        <div style="margin-bottom:12px">
          <label for="setup-notification-channel" style="display:block;font-size:13px;font-weight:600;margin-bottom:4px">${WIZARD_STRINGS.step4.channel.label}</label>
          <select id="setup-notification-channel" class="ask-input" style="width:100%;padding:8px">
            ${WIZARD_STRINGS.step4.channel.options.map(opt => `<option value="${opt.value}">${opt.label}</option>`).join('')}
          </select>
        </div>

        <div style="margin-bottom:16px">
          <label for="setup-notification-target" style="display:block;font-size:13px;font-weight:600;margin-bottom:4px">${WIZARD_STRINGS.step4.target.label}</label>
          <input type="text" id="setup-notification-target" class="ask-input" style="width:100%;padding:8px" placeholder="${WIZARD_STRINGS.step4.target.placeholder}" />
          <div style="font-size:12px;color:var(--text-muted);margin-top:4px">${WIZARD_STRINGS.step4.target.help}</div>
        </div>

        <div style="margin-bottom:16px">
          <button type="button" class="btn btn-secondary" id="btn-setup-test-alert" disabled title="${WIZARD_STRINGS.step4.testDisabledReason}">${WIZARD_STRINGS.step4.testButton}</button>
          <div id="setup-alert-disabled-reason" style="font-size:12px;color:var(--text-muted);margin-top:4px">${WIZARD_STRINGS.step4.testDisabledReason}</div>
          <div id="setup-alert-result" style="margin-top:8px;display:none" role="alert"></div>
        </div>

        <div style="display:flex;justify-content:space-between">
          <button type="button" class="btn btn-secondary btn-nav-step" data-target="3">${WIZARD_STRINGS.step4.backButton}</button>
          <button type="button" class="btn btn-primary btn-nav-step" data-target="5">${WIZARD_STRINGS.step4.nextButton}</button>
        </div>
      </div>

      <!-- Step 5: Backups -->
      <div id="wizard-step-5" class="wizard-step" style="display:none">
        <h2 style="font-size:22px;margin:4px 0 8px 0">${WIZARD_STRINGS.step5.title}</h2>
        <p style="font-size:14px;color:var(--text-muted);margin:0 0 16px 0">
          ${WIZARD_STRINGS.step5.subtitle}
        </p>

        <div style="margin-bottom:12px">
          <label for="setup-backup-dest" style="display:block;font-size:13px;font-weight:600;margin-bottom:4px">${WIZARD_STRINGS.step5.destination.label}</label>
          <select id="setup-backup-dest" class="ask-input" style="width:100%;padding:8px">
            ${WIZARD_STRINGS.step5.destination.options.map(opt => `<option value="${opt.value}">${opt.label}</option>`).join('')}
          </select>
        </div>

        <div style="margin-bottom:12px">
          <label for="setup-backup-dir" style="display:block;font-size:13px;font-weight:600;margin-bottom:4px">${WIZARD_STRINGS.step5.folder.label}</label>
          <input type="text" id="setup-backup-dir" class="ask-input" style="width:100%;padding:8px" value="./data/backups" placeholder="${WIZARD_STRINGS.step5.folder.placeholder}" />
          <div style="font-size:12px;color:var(--text-muted);margin-top:4px">${WIZARD_STRINGS.step5.folder.help}</div>
        </div>

        <div style="margin-bottom:16px">
          <label for="setup-age-key" style="display:block;font-size:13px;font-weight:600;margin-bottom:4px">${WIZARD_STRINGS.step5.ageKey.label}</label>
          <input type="text" id="setup-age-key" class="ask-input" style="width:100%;padding:8px;font-family:var(--font-code)" placeholder="${WIZARD_STRINGS.step5.ageKey.placeholder}" />
          <div style="font-size:12px;color:var(--text-muted);margin-top:4px">${WIZARD_STRINGS.step5.ageKey.help}</div>
        </div>

        <div style="margin-bottom:16px">
          <button type="button" class="btn btn-secondary" id="btn-setup-test-drill">${WIZARD_STRINGS.step5.drillButton}</button>
          <div id="setup-drill-result" style="margin-top:8px;display:none" role="alert"></div>
        </div>

        <div style="display:flex;justify-content:space-between">
          <button type="button" class="btn btn-secondary btn-nav-step" data-target="4">${WIZARD_STRINGS.step5.backButton}</button>
          <button type="button" class="btn btn-primary btn-nav-step" data-target="6">${WIZARD_STRINGS.step5.nextButton}</button>
        </div>
      </div>

      <!-- Step 6: Theme Selection & First-Run Walkthrough -->
      <div id="wizard-step-6" class="wizard-step" style="display:none">
        <h2 style="font-size:22px;margin:4px 0 8px 0">${WIZARD_STRINGS.step6.title}</h2>
        <p style="font-size:14px;color:var(--text-muted);margin:0 0 8px 0">
          ${WIZARD_STRINGS.step6.subtitle}
        </p>
        <p id="step6-theme-notice" style="font-size:13px;color:var(--text-muted);margin:0 0 16px 0">
          ${WIZARD_STRINGS.step6.themeAppliedNotice}
        </p>

        <div style="display:grid;grid-template-columns:repeat(3, 1fr);gap:12px;margin-bottom:20px">
          ${WIZARD_STRINGS.step6.themePresets.map((theme, idx) => `
            <label class="theme-card" style="display:flex;flex-direction:column;gap:6px;padding:12px;border:${idx === 0 ? '2px solid var(--accent)' : '1px solid var(--rule)'};background:${idx === 0 ? 'var(--surface-subtle)' : 'transparent'};cursor:pointer;border-radius:4px">
              <div style="display:flex;align-items:center;gap:8px">
                <input type="radio" name="theme-preset" value="${theme.value}" ${idx === 0 ? 'checked' : ''} />
                <strong>${theme.title}</strong>
              </div>
              <div style="font-size:12px;color:var(--text-muted)">${theme.description}</div>
            </label>
          `).join('')}
        </div>

        <!-- First-Run Walkthrough Worked Example Card -->
        <div class="as-of-banner" style="margin-bottom:20px">
          <h3 style="font-size:16px;margin:0 0 6px 0">${WIZARD_STRINGS.step6.workedExample.title}</h3>
          <p style="font-size:13px;line-height:1.5;margin:0 0 10px 0">
            ${WIZARD_STRINGS.step6.workedExample.lead}
          </p>
          <ul style="font-size:13px;margin:0 0 12px 18px;line-height:1.5">
            ${WIZARD_STRINGS.step6.workedExample.claims.map(c => `<li><strong>${c.label}:</strong> ${c.text}</li>`).join('')}
          </ul>
          <p style="font-size:13px;font-style:italic;margin:0">
            "${WIZARD_STRINGS.step6.workedExample.closing}"
          </p>
        </div>

        <p style="font-size:12px;color:var(--text-muted);margin-bottom:12px">${WIZARD_STRINGS.step6.deployNotice}</p>

        <div style="display:flex;gap:12px">
          <a href="/admin" class="btn btn-primary" id="btn-setup-finish-login" style="flex:1;text-align:center;padding:12px">${WIZARD_STRINGS.step6.finishButton}</a>
          <a href="/admin/import" class="btn btn-secondary" id="btn-setup-launch-import" style="flex:1;text-align:center;padding:12px">${WIZARD_STRINGS.step6.importButton}</a>
        </div>

        <div style="margin-top:16px;text-align:left">
          <button type="button" class="btn btn-secondary btn-nav-step" data-target="5">${WIZARD_STRINGS.step6.backButton}</button>
        </div>
      </div>
    </div>
    <script>
      (function() {
        const form = document.getElementById('admin-setup-form');
        const statusBox = document.getElementById('setup-status');
        const chip = document.getElementById('wizard-step-chip');
        const progressFill = document.getElementById('wizard-progress-fill');
        const completedActions = document.getElementById('account-completed-actions');

        ${ADMIN_API_CLIENT_SCRIPT}

        let currentActiveStep = 1;

        async function saveStep(stepNum) {
          try {
            if (stepNum === 2) {
              const presetEl = document.querySelector('input[name="hosting-preset"]:checked');
              const preset = presetEl ? presetEl.value : 'hobbyist-docker';
              const publicAddress = (document.getElementById('setup-origin-url') || {}).value || '';
              await apiClient('/api/settings/hosting', {
                method: 'PATCH',
                body: JSON.stringify({ preset: preset, publicAddress: publicAddress })
              });
            } else if (stepNum === 4) {
              const channel = (document.getElementById('setup-notification-channel') || {}).value || 'ntfy';
              const target = (document.getElementById('setup-notification-target') || {}).value || '';
              await apiClient('/api/settings/notifications', {
                method: 'PATCH',
                body: JSON.stringify({ channel: channel, target: target })
              });
            } else if (stepNum === 5) {
              const destination = (document.getElementById('setup-backup-dest') || {}).value || 'local';
              const agePublicKey = (document.getElementById('setup-age-key') || {}).value || '';
              await apiClient('/api/settings/backups', {
                method: 'PATCH',
                body: JSON.stringify({ destination: destination, agePublicKey: agePublicKey })
              });
            } else if (stepNum === 6) {
              const themeEl = document.querySelector('input[name="theme-preset"]:checked');
              const preset = themeEl ? themeEl.value : 'editorial-classic';
              await apiClient('/api/settings/theme', {
                method: 'PATCH',
                body: JSON.stringify({ preset: preset })
              });
            }
          } catch (_) {}
        }

        async function restoreSettings() {
          try {
            const sessRes = await apiClient('/api/auth/session');
            if (sessRes.ok) {
              const sessData = await sessRes.json();
              if (sessData.authenticated) {
                const f = document.getElementById('admin-setup-form');
                if (f) f.style.display = 'none';
                const s = document.getElementById('setup-status');
                if (s) s.style.display = 'none';
                if (currentActiveStep === 1) {
                  goToStep(2);
                }
              }
            }

            const res = await apiClient('/api/settings');
            if (!res.ok) return;
            const data = await res.json();
            if (data.hosting) {
              const preset = data.hosting.preset || data.preset;
              if (preset) {
                const r = document.querySelector('input[name="hosting-preset"][value="' + preset + '"]');
                if (r) r.checked = true;
              }
              if (data.hosting.publicAddress) {
                const urlInput = document.getElementById('setup-origin-url');
                if (urlInput) urlInput.value = data.hosting.publicAddress;
              }
            }
            if (data.notifications) {
              if (data.notifications.channel) {
                const chanSelect = document.getElementById('setup-notification-channel');
                if (chanSelect) chanSelect.value = data.notifications.channel;
              }
              const targetVal = data.notifications.target || data.notifications.topic;
              if (targetVal) {
                const targetInput = document.getElementById('setup-notification-target');
                if (targetInput) targetInput.value = targetVal;
              }
            }
            if (data.backups) {
              if (data.backups.destination) {
                const destSelect = document.getElementById('setup-backup-dest');
                if (destSelect) destSelect.value = data.backups.destination;
              }
              if (data.backups.agePublicKey) {
                const ageInput = document.getElementById('setup-age-key');
                if (ageInput) ageInput.value = data.backups.agePublicKey;
              }
            }
            if (data.themePreset) {
              const tr = document.querySelector('input[name="theme-preset"][value="' + data.themePreset + '"]');
              if (tr) {
                tr.checked = true;
                document.querySelectorAll('.theme-card').forEach(function(card) {
                  card.style.border = '1px solid var(--rule)';
                  card.style.background = 'transparent';
                });
                const parentLabel = tr.closest('.theme-card');
                if (parentLabel) {
                  parentLabel.style.border = '2px solid var(--accent)';
                  parentLabel.style.background = 'var(--surface-subtle)';
                }
              }
            }
          } catch (_) {}
        }

        function goToStep(stepNum) {
          currentActiveStep = stepNum;
          for (let i = 1; i <= 6; i++) {
            const stepEl = document.getElementById('wizard-step-' + i);
            const lblEl = document.getElementById('step-lbl-' + i);
            if (stepEl) {
              stepEl.style.display = i === stepNum ? 'block' : 'none';
            }
            if (lblEl) {
              if (i === stepNum) {
                lblEl.style.fontWeight = '700';
                lblEl.style.color = 'var(--text)';
              } else if (i < stepNum) {
                lblEl.style.fontWeight = '500';
                lblEl.style.color = 'var(--accent)';
              } else {
                lblEl.style.fontWeight = 'normal';
                lblEl.style.color = 'var(--text-muted)';
              }
            }
          }
          if (progressFill) {
            progressFill.style.width = Math.round((stepNum / 6) * 100) + '%';
          }
          if (chip) {
            chip.textContent = 'Step ' + stepNum + ' of 6 · First-Run Wizard';
          }
        }

        document.querySelectorAll('.btn-nav-step').forEach(function(btn) {
          btn.addEventListener('click', async function() {
            const target = parseInt(btn.getAttribute('data-target') || '1', 10);
            if (target > currentActiveStep) {
              await saveStep(currentActiveStep);
            }
            goToStep(target);
          });
        });

        document.querySelectorAll('input[name="theme-preset"]').forEach(function(radio) {
          radio.addEventListener('change', function() {
            document.querySelectorAll('.theme-card').forEach(function(card) {
              card.style.border = '1px solid var(--rule)';
              card.style.background = 'transparent';
            });
            const parentLabel = radio.closest('.theme-card');
            if (parentLabel) {
              parentLabel.style.border = '2px solid var(--accent)';
              parentLabel.style.background = 'var(--surface-subtle)';
            }
            saveStep(6);
          });
        });

        const finishLoginBtn = document.getElementById('btn-setup-finish-login');
        if (finishLoginBtn) {
          finishLoginBtn.addEventListener('click', async function() {
            await saveStep(6);
            await apiClient('/api/settings', {
              method: 'PATCH',
              body: JSON.stringify({ setupWizardCompleted: true })
            });
          });
        }
        const launchImportBtn = document.getElementById('btn-setup-launch-import');
        if (launchImportBtn) {
          launchImportBtn.addEventListener('click', async function() {
            await saveStep(6);
            await apiClient('/api/settings', {
              method: 'PATCH',
              body: JSON.stringify({ setupWizardCompleted: true })
            });
          });
        }

        restoreSettings();

        const continueBtn = document.getElementById('btn-continue-step2');
        if (continueBtn) {
          continueBtn.addEventListener('click', function() {
            goToStep(2);
          });
        }

        let cachedSetupData = null;

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
              cachedSetupData = data;
              form.style.display = 'none';
              const qrBox = document.getElementById('setup-qr-code');
              if (qrBox) qrBox.innerHTML = data.qrCodeSvg || '';
              const keyEl = document.getElementById('setup-manual-key');
              if (keyEl) keyEl.textContent = data.totpSecretBase32 || '';
              const enrolBox = document.getElementById('totp-enrolment-container');
              if (enrolBox) enrolBox.style.display = 'block';
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

        const confirmForm = document.getElementById('totp-confirm-form');
        if (confirmForm) {
          confirmForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const codeInput = document.getElementById('confirm-totp-code');
            const code = codeInput ? codeInput.value.trim() : '';
            const confirmError = document.getElementById('totp-confirm-error');
            if (confirmError) confirmError.style.display = 'none';

            try {
              const res = await apiClient('/api/auth/totp/confirm', {
                method: 'POST',
                body: JSON.stringify({ code })
              });
              const data = await res.json();
              if (res.ok) {
                if (data.csrfToken) {
                  sessionStorage.setItem('lp_csrf_token', data.csrfToken);
                }
                const enrolBox = document.getElementById('totp-enrolment-container');
                if (enrolBox) enrolBox.style.display = 'none';
                statusBox.className = 'as-of-banner';
                const secret = (cachedSetupData && cachedSetupData.totpSecret) || '';
                // Per D-12 & WP-13.2: Stop showing the bearer token in the wizard
                statusBox.innerHTML = '<strong>Setup Completed!</strong> Authenticator enrolled and session established. TOTP secret hex: <code>' + secret + '</code>.';
                statusBox.style.display = 'block';

                const credBox = document.getElementById('credentials-display-container');
                if (credBox) {
                  const keyEl = document.getElementById('credentials-totp-key');
                  if (keyEl) keyEl.textContent = (cachedSetupData && (cachedSetupData.totpSecretBase32 || cachedSetupData.totpSecret)) || '';
                  const grid = document.getElementById('recovery-codes-grid');
                  if (grid && cachedSetupData && cachedSetupData.recoveryCodes) {
                    grid.innerHTML = cachedSetupData.recoveryCodes.map(function(c) {
                      return '<div style="padding:4px 8px;background:var(--surface);border:1px solid var(--rule);border-radius:4px;text-align:center"><code>' + c + '</code></div>';
                    }).join('');
                  }
                  credBox.style.display = 'block';
                }
              } else {
                if (confirmError) {
                  confirmError.textContent = data.message || data.error || 'Invalid TOTP code. Please check your authenticator app.';
                  confirmError.style.display = 'block';
                }
              }
            } catch (err) {
              if (confirmError) {
                confirmError.textContent = 'Network error verifying TOTP code.';
                confirmError.style.display = 'block';
              }
            }
          });
        }

        // Credentials screen interactive handlers (WP-13.3, UX-30)
        const savedGate = document.getElementById('setup-saved-credentials-gate');
        if (savedGate && continueBtn) {
          savedGate.addEventListener('change', function() {
            if (savedGate.checked) {
              continueBtn.disabled = false;
              continueBtn.removeAttribute('disabled');
            } else {
              continueBtn.disabled = true;
              continueBtn.setAttribute('disabled', 'disabled');
            }
          });
        }

        const downloadBtn = document.getElementById('btn-download-recovery-codes');
        if (downloadBtn) {
          downloadBtn.addEventListener('click', function() {
            const codes = (cachedSetupData && cachedSetupData.recoveryCodes) || [];
            const username = (cachedSetupData && cachedSetupData.username) || 'owner';
            const text = 'Living Portfolio Emergency Recovery Codes\\n' +
              'Account: ' + username + '\\n' +
              'Generated: ' + new Date().toISOString() + '\\n\\n' +
              'Each code can be used once if you lose access to your authenticator app:\\n\\n' +
              codes.map(function(c, i) { return (i + 1) + '. ' + c; }).join('\\n') + '\\n';
            const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'living-portfolio-recovery-codes.txt';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          });
        }

        const copyCodesBtn = document.getElementById('btn-copy-recovery-codes');
        if (copyCodesBtn) {
          copyCodesBtn.addEventListener('click', function() {
            const codes = (cachedSetupData && cachedSetupData.recoveryCodes) || [];
            if (navigator.clipboard && navigator.clipboard.writeText) {
              navigator.clipboard.writeText(codes.join('\\n'));
              copyCodesBtn.textContent = 'Copied!';
              setTimeout(function() { copyCodesBtn.textContent = 'Copy All'; }, 2000);
            }
          });
        }

        const copyKeyBtn = document.getElementById('btn-copy-totp-key');
        if (copyKeyBtn) {
          copyKeyBtn.addEventListener('click', function() {
            const key = (cachedSetupData && (cachedSetupData.totpSecretBase32 || cachedSetupData.totpSecret)) || '';
            if (navigator.clipboard && navigator.clipboard.writeText) {
              navigator.clipboard.writeText(key);
              copyKeyBtn.textContent = 'Copied!';
              setTimeout(function() { copyKeyBtn.textContent = 'Copy Key'; }, 2000);
            }
          });
        }

        // Step 4: Notification test disabled in this version (UX-33, WP-17.2)
        const notifTargetInput = document.getElementById('setup-notification-target');
        const testAlertBtn = document.getElementById('btn-setup-test-alert');
        const alertDisabledReason = document.getElementById('setup-alert-disabled-reason');
        function updateAlertButton() {
          if (!testAlertBtn) return;
          testAlertBtn.disabled = true;
          if (alertDisabledReason) {
            alertDisabledReason.style.display = 'block';
          }
        }
        if (notifTargetInput) {
          notifTargetInput.addEventListener('input', updateAlertButton);
          updateAlertButton();
        }

        const alertResult = document.getElementById('setup-alert-result');
        if (testAlertBtn && alertResult) {
          testAlertBtn.addEventListener('click', async function() {
            alertResult.style.display = 'none';
            try {
              const res = await apiClient('/api/settings/notifications/test', { method: 'POST' });
              const data = await res.json();
              alertResult.className = 'later-thinking-banner';
              alertResult.textContent = data.message || "Test alerts aren't available in this version yet.";
              alertResult.style.display = 'block';
            } catch (err) {
              alertResult.className = 'later-thinking-banner';
              alertResult.textContent = "Test alerts aren't available in this version yet.";
              alertResult.style.display = 'block';
            }
          });
        }

        // Step 5: Test Drill button
        const testDrillBtn = document.getElementById('btn-setup-test-drill');
        const drillResult = document.getElementById('setup-drill-result');
        if (testDrillBtn && drillResult) {
          testDrillBtn.addEventListener('click', async function() {
            drillResult.style.display = 'none';
            const destFolder = (document.getElementById('setup-backup-dir') || {}).value || './data/backups';
            const ageKey = (document.getElementById('setup-age-key') || {}).value || '';

            try {
              const res = await apiClient('/api/settings/backups/run-drill', {
                method: 'POST',
                body: JSON.stringify({ destinationDir: destFolder.trim() || undefined, agePublicKey: ageKey.trim() || undefined })
              });
              const data = await res.json();
              if (res.status === 501) {
                drillResult.className = 'later-thinking-banner';
                drillResult.textContent = data.message || 'Not available until a backup folder is set';
                drillResult.style.display = 'block';
              } else if (res.ok && data.ok) {
                drillResult.className = 'chip';
                drillResult.textContent = '✓ Backup created & restore verification drill succeeded!';
                drillResult.style.display = 'block';
              } else {
                drillResult.className = 'later-thinking-banner';
                drillResult.textContent = data.message || data.error || "The app can't write to that folder. Choose another folder or fix its permissions.";
                drillResult.style.display = 'block';
              }
            } catch (err) {
              drillResult.className = 'later-thinking-banner';
              drillResult.textContent = "The app can't write to that folder. Choose another folder or fix its permissions.";
              drillResult.style.display = 'block';
            }
          });
        }

        // Step 6: Trigger static deploy on finish
        const finishBtn = document.getElementById('btn-setup-finish-login');
        if (finishBtn) {
          finishBtn.addEventListener('click', function() {
            apiClient('/api/publish/now', { method: 'POST' }).catch(function() {});
          });
        }
      })();
    </script>
  `;
  return renderLayout('First-Run Setup', '/admin/setup', content);
}

export async function renderAdminImportPage(repo: WebDataClient): Promise<string> {
  repo = adaptDataSource(repo);
  const cfg = loadConfig();
  const stagingNoticeHtml =
    cfg.DEPLOYMENT_CLASS === 'staging'
      ? `    <div class="later-thinking-banner" data-banner="staging-import-disabled" role="alert" style="margin-bottom:16px;border-left:4px solid var(--role-challenge,#f59e0b)">
      <strong>Import Disabled on Staging:</strong> Import connectors and ingestion pipelines are strictly disabled in staging environments to enforce synthetic data isolation.
    </div>\n`
      : '';

  const content = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:8px">
      <div>
        <h1 style="font-family:var(--font-reading);font-size:28px;margin:0">Import &amp; Triage</h1>
        <p style="color:var(--text-muted);margin:4px 0 0;font-size:14px">
          Connect or paste existing material, plan processing budget, and triage with confidence sorting and keyboard controls.
        </p>
      </div>
      <a href="/admin" class="btn btn-secondary" style="text-decoration:none">← Back to Workspace</a>
    </div>

    ${stagingNoticeHtml}<!-- Triage Stepper -->
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
        <h2 style="font-size:18px;margin:0 0 8px 0">Import Processing Planner</h2>
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
