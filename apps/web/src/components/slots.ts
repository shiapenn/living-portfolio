/**
 * §12.10 Theme Contract & Slot Conformance (Finding 20261020-UI-10 [P1])
 *
 * Implements named slot layout composers matching REQUIRED_THEME_SLOTS in @living-portfolio/core.
 */

export interface EntryArticleSlots {
  header: string;
  contextStrip: string;
  body: string;
  marginRail?: string;
  laterThinkingBanner?: string;
  related?: string;
  askWidgetMount?: string;
}

export function renderEntryArticleWithSlots(slots: EntryArticleSlots): string {
  return `
    <article class="entry-article-view">
      ${slots.laterThinkingBanner || ''}
      <header class="entry-header">
        ${slots.header}
        ${slots.contextStrip ? `<div class="entry-context-slot" style="margin: var(--lp-space-stack-field-to-field) 0;">${slots.contextStrip}</div>` : ''}
      </header>
      <div class="entry-layout" style="display: grid; grid-template-columns: 1fr; gap: var(--lp-space-stack-group); margin-top: var(--lp-space-stack-group);">
        <div class="entry-body reading-column">
          ${slots.body}
          ${slots.related || ''}
          ${slots.askWidgetMount || ''}
        </div>
        ${slots.marginRail ? `<aside class="entry-margin-rail" aria-label="Context and metadata">${slots.marginRail}</aside>` : ''}
      </div>
    </article>
  `;
}

export interface EntryStructuredSlots {
  header: string;
  contextStrip: string;
  roleSections: string;
  evidenceRail?: string;
  outcome?: string;
  laterThinkingBanner?: string;
  askWidgetMount?: string;
}

export function renderEntryStructuredWithSlots(slots: EntryStructuredSlots): string {
  return `
    <article class="entry-structured-view">
      ${slots.laterThinkingBanner || ''}
      <header class="entry-header">
        ${slots.header}
        ${slots.contextStrip ? `<div class="entry-context-slot" style="margin: var(--lp-space-stack-field-to-field) 0;">${slots.contextStrip}</div>` : ''}
      </header>
      <div class="entry-layout" style="display: grid; grid-template-columns: 1fr; gap: var(--lp-space-stack-group); margin-top: var(--lp-space-stack-group);">
        <div class="entry-body reading-column">
          ${slots.roleSections}
          ${slots.outcome || ''}
          ${slots.askWidgetMount || ''}
        </div>
        ${slots.evidenceRail ? `<aside class="entry-evidence-rail" aria-label="Evidence and verification">${slots.evidenceRail}</aside>` : ''}
      </div>
    </article>
  `;
}

export interface VentureSlots {
  header: string;
  overview: string;
  productEmbed?: string;
  devLog?: string;
  evidenceRail?: string;
}

export function renderVentureWithSlots(slots: VentureSlots): string {
  return `
    <article class="venture-view">
      <header class="venture-header">
        ${slots.header}
      </header>
      <div class="venture-layout" style="display: grid; grid-template-columns: 1fr; gap: var(--lp-space-stack-group); margin-top: var(--lp-space-stack-group);">
        <div class="venture-main reading-column">
          ${slots.overview}
          ${slots.productEmbed || ''}
          ${slots.devLog || ''}
        </div>
        ${slots.evidenceRail ? `<aside class="venture-rail" aria-label="Venture facts and links">${slots.evidenceRail}</aside>` : ''}
      </div>
    </article>
  `;
}

export interface HomeSlots {
  statement: string;
  strataTimeline: string;
  entryList: string;
  askField: string;
}

export function renderHomeWithSlots(slots: HomeSlots): string {
  return `
    <div class="home-view">
      <section class="home-statement-slot">
        ${slots.statement}
      </section>
      <section class="home-strata-slot" aria-label="Strata Timeline">
        ${slots.strataTimeline}
      </section>
      <section class="home-entries-slot" aria-label="Featured Entries">
        ${slots.entryList}
      </section>
      <section class="home-ask-slot" aria-label="Ask about my work">
        ${slots.askField}
      </section>
    </div>
  `;
}

export interface TimelineSlots {
  strataTimeline: string;
  asOfBar: string;
  results: string;
}

export function renderTimelineWithSlots(slots: TimelineSlots): string {
  return `
    <div class="timeline-view">
      <section class="timeline-strata-slot">
        ${slots.strataTimeline}
      </section>
      <section class="timeline-asof-slot">
        ${slots.asOfBar}
      </section>
      <section class="timeline-results-slot">
        ${slots.results}
      </section>
    </div>
  `;
}
