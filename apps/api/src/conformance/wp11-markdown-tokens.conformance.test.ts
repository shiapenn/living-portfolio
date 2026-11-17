import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryPortfolioRepository } from '@living-portfolio/db';
import {
  renderHomePage,
  renderWorkOrWritingPage,
  renderAdminEntriesPage,
  renderLayout,
  renderMarkdown,
  renderInlineMarkdown,
  sanitizeHtml,
  PRIMITIVE_TOKENS,
  SEMANTIC_TOKENS_LIGHT,
  SEMANTIC_TOKENS_DARK,
  COMPONENT_TOKENS,
  FONTS_CSS,
  THEME_CSS,
  STRATA_DESIGN_SYSTEM_CSS,
  renderField,
  renderButton,
  renderChip,
  renderEntryRow,
  renderEntryArticleWithSlots,
  renderEntryStructuredWithSlots,
  renderVentureWithSlots,
  renderHomeWithSlots,
  renderTimelineWithSlots,
} from '@living-portfolio/web';
import {
  REQUIRED_THEME_SLOTS,
  REQUIRED_THEME_TOKENS,
  DEFAULT_STRATA_THEME,
  verifyThemeConformance,
} from '@living-portfolio/core';

describe('WP-11.4 Conformance: Full Markdown Engine, Multi-Tier Design Tokens & Responsive Multi-Pane Layout', () => {
  let repo: InMemoryPortfolioRepository;

  beforeEach(async () => {
    repo = new InMemoryPortfolioRepository();

    await repo.createEntry(
      {
        slug: 'token-architecture-milestone',
        title: 'Multi-Tier Design Token Architecture',
        profile: 'case-study',
        view: 'article',
        visibility: 'public',
      },
      {
        written_at: '2026-10-25T12:00:00Z',
        valid_from: '2026-10-25T12:00:00Z',
        body_md: `# Top Level Document Title
Introductory paragraph explaining token architecture.

## Primitive Tier
- Scale ratios: 1.2
- Breakpoint tokens: 480, 768, 1024, 1280

### Code Example
\`\`\`typescript
export const tokens = { space: 4 };
\`\`\`

> "Design tokens are the visual atoms of the design system."

| Tier | Purpose | Example |
|---|---|---|
| Tier 1 | Primitives | --font-size-1 |
| Tier 2 | Semantics | --surface-page |
| Tier 3 | Components | --admin-nav-width |
`,
      }
    );
  });

  describe('F4 & 20261020-UI-01: Full CommonMark/GFM Rendering Engine & Enhanced Authoring Control', () => {
    it('parses headings with automatic demotion so page h1 is never usurped', () => {
      const md = '# Title\n## Subheading\n### Tertiary Section\n#### Level 4\n##### Level 5\n###### Level 6';
      const rendered = renderMarkdown(md);

      expect(rendered).toContain('<h2>Title</h2>');
      expect(rendered).toContain('<h3>Subheading</h3>');
      expect(rendered).toContain('<h4>Tertiary Section</h4>');
      expect(rendered).toContain('<h5>Level 4</h5>');
      expect(rendered).toContain('<h6>Level 5</h6>');
      expect(rendered).toContain('<h6>Level 6</h6>');
      expect(rendered).not.toContain('<h1>');
    });

    it('renders fenced code blocks with language classes', () => {
      const codeMd = '```python\ndef calculate(x: int) -> int:\n    return x * 2\n```';
      const rendered = renderMarkdown(codeMd);

      expect(rendered).toContain('<pre class="code-block language-python">');
      expect(rendered).toContain('<code class="language-python">');
      expect(rendered).toContain('def calculate(x: int) -&gt; int:');
    });

    it('renders GFM tables, lists, and blockquotes', () => {
      const tableMd = `
| Service | Status | Latency |
|---|---|---|
| Cache | Ready | 1.2ms |
| DB | Ready | 4.8ms |

- Item alpha
- Item beta

> Critical production note.
`;
      const rendered = renderMarkdown(tableMd);

      expect(rendered).toContain('<table class="data-table">');
      expect(rendered).toContain('<th>Service</th>');
      expect(rendered).toContain('<th>Status</th>');
      expect(rendered).toContain('<td>Cache</td>');
      expect(rendered).toContain('<td>Ready</td>');
      expect(rendered).toContain('<ul class="reading-list">');
      expect(rendered).toContain('<li>Item alpha</li>');
      expect(rendered).toContain('<blockquote class="reading-quote"><p>Critical production note.</p></blockquote>');
    });

    it('sanitizes dangerous HTML tags and script protocols', () => {
      const dirty = `
Safe text before
<script>maliciousCode();</script>
<img src="x" onerror="alert(1)" />
<a href="javascript:attack()">Click me</a>
`;
      const sanitized = sanitizeHtml(dirty);
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('maliciousCode');
      expect(sanitized).not.toContain('onerror=');
      expect(sanitized).not.toContain('javascript:attack()');
    });

    it('admin editor provides full-height Tiptap rich editor, source textarea fallback, and design token editor height', async () => {
      const html = await renderAdminEntriesPage(repo);

      expect(html).toContain('id="ref-field-body"');
      expect(html).toContain('id="ref-tiptap-editor"');
      expect(html).toContain('lp-tiptap-mount');
      expect(STRATA_DESIGN_SYSTEM_CSS).toContain('--editor-min-height: 60vh');
    });
  });

  describe('20261020-UI-02 & 20261020-UI-03: Multi-Tier Design Tokens & Typography Craft', () => {
    it('defines 3-tier token hierarchy with complete primitives, semantics, and component tokens', () => {
      // Tier 1: Primitives (D-MIN 8: {12, 14, 16, 24})
      expect(PRIMITIVE_TOKENS).toContain('--type-caption-size: 12px');
      expect(PRIMITIVE_TOKENS).toContain('--type-body-sm-size: 14px');
      expect(PRIMITIVE_TOKENS).toContain('--type-body-size: 16px');
      expect(PRIMITIVE_TOKENS).toContain('--type-page-title-size: 24px');
      expect(PRIMITIVE_TOKENS).toContain('--radius-control: 4px');
      expect(PRIMITIVE_TOKENS).toContain('--radius-overlay: 8px');

      // Breakpoints
      expect(PRIMITIVE_TOKENS).toContain('--bp-sm: 480px');
      expect(PRIMITIVE_TOKENS).toContain('--bp-md: 768px');
      expect(PRIMITIVE_TOKENS).toContain('--bp-lg: 1024px');
      expect(PRIMITIVE_TOKENS).toContain('--bp-xl: 1280px');

      // Tier 2: Semantics
      expect(SEMANTIC_TOKENS_LIGHT).toContain('--surface-page: #FFFFFF');
      expect(SEMANTIC_TOKENS_LIGHT).toContain('--surface-raised: #FFFFFF');
      expect(SEMANTIC_TOKENS_LIGHT).toContain('--border-control: #6B7B88');
      expect(SEMANTIC_TOKENS_LIGHT).toContain('--layout-max: 1180px');
      expect(SEMANTIC_TOKENS_LIGHT).toContain('--size-layout-max: 1180px');
      expect(SEMANTIC_TOKENS_LIGHT).toContain('--measure-reading: 68ch');

      // Tier 3: Component tokens
      expect(COMPONENT_TOKENS).toContain('--admin-nav-width: 240px');
      expect(COMPONENT_TOKENS).toContain('--admin-inspector-width: 340px');
      expect(COMPONENT_TOKENS).toContain('--strata-band-min: 44px');
      expect(COMPONENT_TOKENS).toContain('--strata-band-max: 120px');
    });

    it('declares self-hosted font-face rules with font-display: swap for Literata, Atkinson Hyperlegible, and JetBrains Mono', () => {
      expect(FONTS_CSS).toContain("font-family: 'Literata'");
      expect(FONTS_CSS).toContain("font-family: 'Atkinson Hyperlegible Next'");
      expect(FONTS_CSS).toContain("font-family: 'JetBrains Mono'");
      expect(FONTS_CSS).toContain('font-display: swap');
    });

    it('STRATA_DESIGN_SYSTEM_CSS embeds unified dark theme eliminating drift', () => {
      expect(STRATA_DESIGN_SYSTEM_CSS).toContain(':root[data-theme="dark"]');
      expect(STRATA_DESIGN_SYSTEM_CSS).toContain('--surface-page: #0F1A22');
      expect(STRATA_DESIGN_SYSTEM_CSS).toContain('--surface-raised: #16232D');
    });
  });

  describe('20261020-UI-04: Component Layer (Field, Button, Chip, EntryRow)', () => {
    it('Field abstraction associates label, hint, and error with appropriate accessibility attributes', () => {
      const field = renderField({
        kind: 'input',
        id: 'spec-input',
        name: 'spec',
        label: 'Specification Version',
        help: 'Enter semver identifier e.g. 0.1.0',
        error: 'Invalid version format',
        required: true,
      });

      expect(field).toContain('for="spec-input"');
      expect(field).toContain('id="spec-input-help"');
      expect(field).toContain('id="spec-input-error"');
      expect(field).toContain('role="alert"');
      expect(field).toContain('aria-hidden="true"');
      expect(field).toContain('Specification Version');
    });

    it('Button abstraction supports variants, sizes, loading, and disabled states', () => {
      const primaryBtn = renderButton({ label: 'Submit', variant: 'primary', size: 'md' });
      expect(primaryBtn).toContain('class="lp-btn lp-btn-primary lp-btn-md"');

      const quietBtn = renderButton({ label: 'Dismiss', variant: 'quiet', size: 'sm' });
      expect(quietBtn).toContain('class="lp-btn lp-btn-quiet lp-btn-sm"');

      const loadingBtn = renderButton({ label: 'Processing...', loading: true, disabled: true });
      expect(loadingBtn).toContain('aria-busy="true"');
      expect(loadingBtn).toContain('disabled');
    });

    it('Chip abstraction distinguishes confirmed, suggested, and interactive filter styles', () => {
      const facetChip = renderChip({ label: 'TypeScript', state: 'confirmed' });
      expect(facetChip).toContain('class="lp-chip lp-chip-confirmed"');

      const suggestedChip = renderChip({ label: 'Machine Suggested', state: 'suggested' });
      expect(suggestedChip).toContain('lp-chip-suggested');

      const filterBtn = renderChip({ label: 'Active Filter', interactive: true, selected: true });
      expect(filterBtn).toContain('<button type="button"');
      expect(filterBtn).toContain('aria-pressed="true"');
    });

    it('unifies entry rows in Home and Work pages', async () => {
      const homeHtml = await renderHomePage(repo);
      expect(homeHtml).toContain('class="entry-row"');
      expect(homeHtml).toContain('class="entry-title-link"');
      expect(homeHtml).toContain('href="/work/token-architecture-milestone"');

      const workHtml = await renderWorkOrWritingPage(repo, 'work');
      expect(workHtml).toContain('class="entry-row"');
      expect(workHtml).toContain('class="entry-title-link"');
    });
  });

  describe('20261020-UI-06, 20261020-UI-07, 20261020-UI-10: Multi-Pane Layout, Breakpoints & Slot Contracts', () => {
    it('admin editor renders slim admin header and full-screen D-LAYOUT editor with drawers', async () => {
      const adminHtml = await renderAdminEntriesPage(repo);

      expect(adminHtml).toContain('class="lp-admin-header"');
      expect(adminHtml).toContain('id="ref-editor-toolbar"');
      expect(adminHtml).toContain('id="ref-entries-drawer"');
      expect(adminHtml).toContain('id="ref-structure-section"');
    });

    it('responsive layout media queries handle mobile, tablet (2 panes), and desktop (3 panes)', () => {
      expect(STRATA_DESIGN_SYSTEM_CSS).toContain('@media (min-width: 768px) and (max-width: 1279px)');
      expect(STRATA_DESIGN_SYSTEM_CSS).toContain('@media (min-width: 1280px)');
      expect(STRATA_DESIGN_SYSTEM_CSS).toContain('@media (pointer: coarse)');
      expect(STRATA_DESIGN_SYSTEM_CSS).toContain('min-height: 44px');
    });

    it('conforms to core REQUIRED_THEME_SLOTS and passes verifyThemeConformance', () => {
      const conformance = verifyThemeConformance(DEFAULT_STRATA_THEME);
      expect(conformance.valid).toBe(true);
      expect(conformance.missingSlots).toHaveLength(0);
      expect(conformance.missingTokens).toHaveLength(0);

      // Verify slot layout composers
      const article = renderEntryArticleWithSlots({
        header: '<h1>Header</h1>',
        contextStrip: '<div>Context</div>',
        body: '<p>Body</p>',
      });
      expect(article).toContain('class="entry-article-view"');
      expect(article).toContain('entry-body');

      const home = renderHomeWithSlots({
        statement: '<p>Statement</p>',
        strataTimeline: '<div>Timeline</div>',
        entryList: '<ul><li>Entry</li></ul>',
        askField: '<form>Ask</form>',
      });
      expect(home).toContain('class="home-view"');
      expect(home).toContain('class="home-ask-slot"');
    });

    it('renderLayout injects CSP nonces into style and script elements', () => {
      const pageWithScript = '<p>Content</p><script>window.appInit = true;</script>';
      const layoutHtml = renderLayout('Test Nonce', '/test', pageWithScript, {
        nonce: 'c2VjdXJlTm9uY2UxMjM=',
      });

      expect(layoutHtml).toContain('<style nonce="c2VjdXJlTm9uY2UxMjM=">');
      expect(layoutHtml).toContain('<script nonce="c2VjdXJlTm9uY2UxMjM=">');
      expect(layoutHtml).toContain('<script nonce="c2VjdXJlTm9uY2UxMjM=">window.appInit = true;</script>');
    });
  });
});
