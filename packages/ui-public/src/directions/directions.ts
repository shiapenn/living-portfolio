import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CORE_BUNDLE_CSS, hashCss } from '@living-portfolio/ui-core';

const __dirname = dirname(fileURLToPath(import.meta.url));
export const DIRECTIONS_CSS = readFileSync(resolve(__dirname, '../../src/directions/directions.css'), 'utf8');
export const DIRECTIONS_CSS_HASH = hashCss(DIRECTIONS_CSS);

export type PublicDirectionId = 'quiet-editorial' | 'field-notebook' | 'strata';
export type PublicLabTemplate = 'home' | 'work' | 'entry' | 'writing' | 'timeline' | 'ask' | 'build';

export interface PublicDirectionSpec {
  id: PublicDirectionId;
  name: string;
  mood: string;
  typePair: string;
  fontLicense: string;
  fontPayloadBudgetKb: number;
  paletteLight: { canvas: string; paper: string; ink: string; accent: string };
  paletteDark: { canvas: string; paper: string; ink: string; accent: string };
  motionLanguage: string;
  density: string;
  strataTreatment: string;
  textureRule: string;
}

export const PUBLIC_DIRECTIONS: Record<PublicDirectionId, PublicDirectionSpec> = {
  'quiet-editorial': {
    id: 'quiet-editorial',
    name: 'Quiet Editorial',
    mood: 'Calm authority, archival warm paper, generous whitespace, hairline rules',
    typePair: 'Literata (display & reading) + Atkinson Hyperlegible Next (UI)',
    fontLicense: 'SIL OFL 1.1',
    fontPayloadBudgetKb: 96,
    paletteLight: { canvas: '#FAF7F2', paper: '#F2ECE2', ink: '#1F1B16', accent: '#7A3E24' },
    paletteDark: { canvas: '#161412', paper: '#1F1C19', ink: '#EFECE6', accent: '#E0A484' },
    motionLanguage: 'Restrained 240ms ease-out fades, zero parallax',
    density: 'Spacious (68ch measure, 48px vertical rhythm)',
    strataTreatment: 'Hairline chronological margin rule with serif year index',
    textureRule: 'Flat warm paper with 1px rules and zero drop shadows',
  },
  'field-notebook': {
    id: 'field-notebook',
    name: 'Field Notebook',
    mood: 'Technical craft, graph-paper structure, marginalia, schematic diagram feel',
    typePair: 'Atkinson Hyperlegible Next (sans) + JetBrains Mono (annotations & metadata)',
    fontLicense: 'SIL OFL 1.1',
    fontPayloadBudgetKb: 92,
    paletteLight: { canvas: '#F3F6F4', paper: '#E9EFEA', ink: '#111E24', accent: '#166534' },
    paletteDark: { canvas: '#0D1317', paper: '#141D24', ink: '#E6F0EC', accent: '#6EE7B7' },
    motionLanguage: 'Crisp 120ms mechanical snaps, zero bounce',
    density: 'Structured compact-medium (24px grid cadence)',
    strataTreatment: 'Monospace coordinate ticks with bracketed role annotations',
    textureRule: 'CSS 24px graph-paper grid, dashed borders, 2px sharp corners',
  },
  strata: {
    id: 'strata',
    name: 'Strata',
    mood: 'Accumulated depth and time, geological earth-tone bands, bold display type',
    typePair: 'Literata (bold display) + Atkinson Hyperlegible Next (body)',
    fontLicense: 'SIL OFL 1.1',
    fontPayloadBudgetKb: 96,
    paletteLight: { canvas: '#F5EFE6', paper: '#EDE3D4', ink: '#1D1712', accent: '#8C3B1F' },
    paletteDark: { canvas: '#151210', paper: '#201B17', ink: '#F4EDE4', accent: '#F09D78' },
    motionLanguage: 'Measured 320ms layered transitions, reduced-motion safe',
    density: 'Medium-bold with full-width layered band separation',
    strataTreatment: 'Stacked earth-tone geological bands (ochre, terracotta, sage, slate)',
    textureRule: 'Layered earth-tone surface bands with 4px seam rules and soft depth',
  },
};

export interface LabEntrySummary {
  slug: string;
  title: string;
  date: string;
  profile: string;
  summary: string;
  bodyHtml?: string;
}

export interface PublicLabRenderInput {
  direction: PublicDirectionId;
  template: PublicLabTemplate;
  siteName: string;
  ownerName: string;
  entries: LabEntrySummary[];
  activeEntry?: LabEntrySummary;
}

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function isValidPublicDirection(val: string): val is PublicDirectionId {
  return val === 'quiet-editorial' || val === 'field-notebook' || val === 'strata';
}

export function renderPublicLabPage(input: PublicLabRenderInput): string {
  const spec = PUBLIC_DIRECTIONS[input.direction];
  const base = `/_lab/public/${spec.id}`;
  const nav = [
    { href: `${base}`, label: 'Home', key: 'home' },
    { href: `${base}/work`, label: 'Work', key: 'work' },
    { href: `${base}/writing`, label: 'Writing', key: 'writing' },
    { href: `${base}/build`, label: 'Build', key: 'build' },
    { href: `${base}/timeline`, label: 'Timeline', key: 'timeline' },
    { href: `${base}/ask`, label: 'Ask', key: 'ask' },
  ];

  const entries = input.entries.length > 0 ? input.entries : [];
  const featured = input.activeEntry ?? entries[0];

  let mainHtml = '';
  if (input.template === 'home') {
    mainHtml = `<section class="pub-lab-hero">
      <p class="pub-lab-kicker">${esc(spec.name)} — ${esc(spec.mood)}</p>
      <h1 class="pub-lab-display">${esc(input.ownerName)}</h1>
      <p class="pub-lab-lead">Proof-first engineering archive, architectural decisions, and chronological strata across systems work.</p>
    </section>
    <section aria-label="Selected work">
      <p class="pub-lab-kicker">Selected Work</p>
      <div class="pub-lab-grid">
        ${entries
          .slice(0, 6)
          .map(
            (e) => `<article class="pub-lab-card">
              <div class="pub-lab-meta">${esc(e.date.slice(0, 10))} · ${esc(e.profile)}</div>
              <h2><a href="${base}/work/${encodeURIComponent(e.slug)}">${esc(e.title)}</a></h2>
              <p>${esc(e.summary)}</p>
            </article>`
          )
          .join('\n')}
      </div>
    </section>
    <section class="pub-lab-strata-stack" aria-label="Strata preview">
      <p class="pub-lab-kicker">Strata Timeline</p>
      ${entries
        .slice(0, 4)
        .map(
          (e, i) => `<div class="pub-lab-strata-layer">
            <div class="pub-lab-meta">[0${i + 1}] ${esc(e.date.slice(0, 10))} · ${esc(e.profile)}</div>
            <strong>${esc(e.title)}</strong>
          </div>`
        )
        .join('\n')}
    </section>`;
  } else if (input.template === 'work' || input.template === 'writing' || input.template === 'build') {
    const heading = input.template === 'work' ? 'Work Index' : input.template === 'writing' ? 'Writing Index' : 'Build Log';
    mainHtml = `<section class="pub-lab-hero">
      <p class="pub-lab-kicker">${esc(spec.name)}</p>
      <h1 class="pub-lab-display">${heading}</h1>
      <p class="pub-lab-lead">${entries.length} published archive entries rendered in ${esc(spec.name)}.</p>
    </section>
    <div class="pub-lab-grid">
      ${entries
        .map(
          (e) => `<article class="pub-lab-card">
            <div class="pub-lab-meta">${esc(e.date.slice(0, 10))} · ${esc(e.profile)}</div>
            <h2><a href="${base}/work/${encodeURIComponent(e.slug)}">${esc(e.title)}</a></h2>
            <p>${esc(e.summary)}</p>
          </article>`
        )
        .join('\n')}
    </div>`;
  } else if (input.template === 'entry' && featured) {
    mainHtml = `<article class="pub-lab-prose">
      <p class="pub-lab-kicker">${esc(featured.date.slice(0, 10))} · ${esc(featured.profile)}</p>
      <h1 class="pub-lab-display">${esc(featured.title)}</h1>
      <p class="pub-lab-lead">${esc(featured.summary)}</p>
      <div class="pub-lab-strata-stack">
        <div class="pub-lab-strata-layer"><div class="pub-lab-meta">[GOAL]</div><p>Establish deterministic reliability and verifiable provenance across distributed state transitions.</p></div>
        <div class="pub-lab-strata-layer"><div class="pub-lab-meta">[DECISION]</div><p>Adopted explicit lease boundaries and immutable append-only audit logs with automated conformance probes.</p></div>
        <div class="pub-lab-strata-layer"><div class="pub-lab-meta">[OUTCOME]</div><p>Reduced tail latency and eliminated silent drift under concurrent load.</p></div>
      </div>
      ${featured.bodyHtml ? `<div style="margin-top:32px">${featured.bodyHtml}</div>` : ''}
    </article>`;
  } else if (input.template === 'timeline') {
    mainHtml = `<section class="pub-lab-hero">
      <p class="pub-lab-kicker">Strata Motif — ${esc(spec.strataTreatment)}</p>
      <h1 class="pub-lab-display">Chronological Strata</h1>
    </section>
    <div class="pub-lab-strata-stack">
      ${entries
        .map(
          (e, i) => `<article class="pub-lab-strata-layer">
            <div class="pub-lab-meta">[LAYER ${String(i + 1).padStart(2, '0')}] ${esc(e.date.slice(0, 10))} · ${esc(e.profile)}</div>
            <h2><a href="${base}/work/${encodeURIComponent(e.slug)}">${esc(e.title)}</a></h2>
            <p>${esc(e.summary)}</p>
          </article>`
        )
        .join('\n')}
    </div>`;
  } else {
    mainHtml = `<section class="pub-lab-hero">
      <p class="pub-lab-kicker">Grounded Inquiry</p>
      <h1 class="pub-lab-display">Ask the Archive</h1>
      <p class="pub-lab-lead">Every answer is grounded in published entries with explicit citations and NDA-safe boundaries.</p>
      <form class="pub-lab-ask-box" action="/ask" method="get">
        <label class="lp-core-sr-only" for="lab-ask-input">Ask a question</label>
        <input id="lab-ask-input" class="pub-lab-input" type="search" name="q" placeholder="Ask about architecture decisions, outcomes, or systems work..." />
        <button class="pub-lab-btn" type="submit">Ask</button>
      </form>
    </section>`;
  }

  return `<!DOCTYPE html>
<html lang="en" data-lang="public" data-direction="${spec.id}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="robots" content="noindex, nofollow" />
  <title>${esc(spec.name)} (${input.template}) — ${esc(input.siteName)}</title>
  <style>${CORE_BUNDLE_CSS}\n${DIRECTIONS_CSS}</style>
</head>
<body class="pub-lab-shell">
  <a href="#main-content" class="lp-core-skip-link skip-link">Skip to main content</a>
  <div class="pub-lab-banner" role="note">
    <span><strong>Public Direction Lab (dev/staging only):</strong> ${esc(spec.name)} · ${esc(spec.typePair)}</span>
    <span>Switch: <a href="/_lab/public/quiet-editorial">Quiet Editorial</a> · <a href="/_lab/public/field-notebook">Field Notebook</a> · <a href="/_lab/public/strata">Strata</a></span>
  </div>
  <header class="pub-lab-header">
    <nav class="pub-lab-nav" aria-label="Lab navigation">
      <a href="${base}" class="pub-lab-brand">${esc(input.ownerName)}</a>
      <div class="pub-lab-links">
        ${nav
          .map((n) => `<a href="${n.href}"${n.key === input.template ? ' aria-current="page"' : ''}>${n.label}</a>`)
          .join('\n        ')}
      </div>
    </nav>
  </header>
  <main id="main-content" class="pub-lab-main">
    ${mainHtml}
  </main>
</body>
</html>`;
}
