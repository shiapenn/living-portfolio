import { loadConfig } from '@living-portfolio/config';
import { adaptDataSource, type WebDataClient } from '../../lib/data-source.js';
import { renderAdminShell, renderPageTemplate } from '../../layouts/admin-shell.js';
import {
  renderActionBar,
  renderButton,
  renderChoiceGroup,
  renderItem,
  renderList,
  renderSectionHeader,
  renderStepper,
} from '../../primitives/index.js';
import { renderPageNotice } from '../../components/index.js';
import { IMPORT_SCRIPT } from './import-script.js';

export async function renderAdminImportPage(repo: WebDataClient, options: { nonce?: string } = {}): Promise<string> {
  repo = adaptDataSource(repo);
  const cfg = loadConfig();
  const hasExternalProvider = Boolean(cfg.GEMINI_API_KEY?.trim() || cfg.OPENAI_API_KEY?.trim());

  const stagingNoticeHtml =
    cfg.DEPLOYMENT_CLASS === 'staging'
      ? `<div data-banner="staging-import-disabled">${renderPageNotice({
          tone: 'warn',
          message:
            'Import Disabled on Staging: Import connectors and ingestion pipelines are strictly disabled in staging environments to enforce synthetic data isolation.',
        })}</div>`
      : '';

  const stepperHtml = renderStepper({
    id: 'import-stepper',
    currentStep: 1,
    totalSteps: 3,
    stepTitle: 'Add material',
  });

  const planTierHtml = hasExternalProvider
    ? renderChoiceGroup({
        id: 'import-plan-choice',
        name: 'import_plan_tier',
        mode: 'single',
        variant: 'card',
        legend: 'Processing mode',
        options: [
          {
            id: 'plan-tier-free',
            value: 'free',
            label: 'Local / Free limits',
            description: 'Zero cost within local quotas.',
            checked: true,
          },
          {
            id: 'plan-tier-paid',
            value: 'paid',
            label: 'Fast cloud acceleration',
            description: 'Parallel external provider with estimated cost.',
            checked: false,
          },
        ],
      }) +
      `<div class="lp-stack lp-gap-tight">
        <div id="plan-free-est" class="lp-type-meta">Calculating local estimate...</div>
        <div id="plan-paid-est" class="lp-type-meta">Calculating cloud estimate...</div>
      </div>`
    : `<div id="plan-local-summary" class="lp-stack lp-gap-tight">
        <div class="lp-type-body">Local processing</div>
        <div id="plan-free-est" class="lp-type-meta">Calculating local estimate...</div>
      </div>`;

  const doneNextStepsHtml = renderList({
    id: 'import-done-next-steps',
    variant: 'interactive',
    itemsHtml: [
      renderItem({
        href: '/admin/entries',
        title: 'Review imported entries',
        subtitle: 'Edit drafts and publish when ready.',
        showChevron: true,
      }),
      renderItem({
        href: '/admin/audit',
        title: 'Check for contradictions',
        subtitle: 'Scan newly imported claims against existing entries.',
        showChevron: true,
      }),
      renderItem({
        id: 'btn-import-another',
        href: '#import-again',
        title: 'Import more material',
        subtitle: 'Start a fresh import batch.',
        showChevron: true,
      }),
    ].join(''),
  });

  const bodyHtml = `
    ${stagingNoticeHtml}
    <div class="lp-stack lp-gap-related">
      ${stepperHtml}
      ${renderPageNotice({ id: 'import-status-banner', tone: 'danger', message: '', role: 'none', hidden: true })}

      <!-- Step 1: Add Material -->
      <div id="import-step-add" class="lp-stack lp-gap-group">
        <section class="lp-stack lp-gap-group">
          <div class="lp-stack lp-gap-related">
            <div data-c="Field" data-rel="field" class="lp-field lp-field-file">
              <label class="lp-field-label" for="import-files-input">Upload files</label>
              <div class="lp-field-file-row">
                <input id="import-files-input" type="file" multiple accept=".md,.markdown,.txt,.html,.htm,.docx,.pdf,.zip" class="lp-sr-only lp-field-file-input" />
                <label class="lp-btn lp-btn-secondary lp-field-file-trigger" for="import-files-input">Choose files</label>
                <span id="import-files-status" class="lp-field-file-name">Markdown, text, HTML, DOCX, PDF, or ZIP</span>
              </div>
            </div>
            <div data-c="Field" data-rel="field" class="lp-field">
              <label class="lp-field-label" for="import-paste-area">Markdown or text</label>
              <textarea id="import-paste-area" rows="10" class="lp-input lp-textarea lp-editor-source-textarea" placeholder="# Migrating to Postgres Advisory Locks&#10;&#10;In 2024 we eliminated lock contention by migrating to PostgreSQL 15 advisory locks...&#10;&#10;---&#10;&#10;# Edge Microservice Architecture&#10;&#10;Designed multi-region edge gateways on Cloudflare Workers..."></textarea>
              <p class="lp-field-help">Separate several entries with <code>---</code>.</p>
            </div>
          </div>

          ${renderActionBar({
            level: 'page',
            primary: { id: 'btn-generate-plan', label: 'Generate plan', variant: 'primary' },
            secondary: { id: 'btn-load-sample', label: 'Load sample entries', variant: 'secondary' },
          })}
        </section>
      </div>

      <!-- Step 2: Plan -->
      <div id="import-step-plan" class="lp-stack lp-gap-group lp-is-hidden" data-has-provider="${hasExternalProvider ? 'true' : 'false'}">
        <section class="lp-stack lp-gap-group">
          <div class="lp-stack lp-gap-related">
            ${renderSectionHeader({ title: 'Processing plan' })}
            ${planTierHtml}
          </div>
          ${renderActionBar({
            level: 'page',
            primary: { id: 'btn-proceed-triage', label: 'Proceed to review', variant: 'primary' },
            secondary: { id: 'btn-back-add', label: 'Previous', variant: 'secondary' },
          })}
        </section>
      </div>

      <!-- Step 3: Review -->
      <div id="import-step-triage" class="lp-stack lp-gap-group lp-is-hidden">
        <section data-c="FormSection" data-rel="section" class="lp-form-section lp-stack lp-gap-group">
          <div class="lp-stack lp-gap-related">
            ${renderSectionHeader({ title: 'Review items' })}
            <div class="lp-stack lp-gap-group">
              <div class="lp-stack lp-gap-tight">
                <div id="import-review-counter" data-c="Text" data-purpose="meta" class="lp-type-meta">0 of 0 reviewed</div>
                <p class="triage-keys-legend" data-c="Text" data-purpose="helper" aria-label="Keyboard shortcuts">Keys: <kbd>J</kbd> / <kbd>K</kbd> next or previous · <kbd>A</kbd> include · <kbd>S</kbd> leave out · <kbd>R</kbd> change type · <kbd>D</kbd> set date</p>
              </div>
              <div data-c="ActionBar" data-level="item" data-rel="actions" class="lp-action-bar lp-action-bar-item">
                ${renderButton({ id: 'btn-bulk-accept', label: 'Include all high-confidence', variant: 'secondary', size: 'sm' })}
              </div>
              <div id="triage-cards-container" data-c="List" data-variant="plain" class="lp-list lp-list-plain"></div>
            </div>
          </div>

          ${renderActionBar({
            level: 'page',
            primary: { id: 'btn-commit-batch', label: 'Import included', variant: 'primary' },
            secondary: { id: 'btn-back-plan', label: 'Previous', variant: 'secondary' },
          })}
        </section>
      </div>

      <!-- Done Screen -->
      <div id="import-step-done" class="lp-stack lp-gap-group lp-is-hidden">
        <section data-c="FormSection" data-rel="section" class="lp-form-section lp-stack lp-gap-group">
          <div class="lp-stack lp-gap-related">
            ${renderSectionHeader({ title: 'Import complete' })}
            <div class="lp-stack lp-gap-related">
              <div id="import-done-summary" data-c="Text" data-purpose="value" class="lp-type-body">Imported entries are saved as private drafts.</div>
              ${doneNextStepsHtml}
            </div>
          </div>

          <div data-c="ActionBar" data-level="item" data-rel="actions" class="lp-action-bar lp-action-bar-item">
            ${renderButton({ id: 'btn-import-return-today', href: '/admin', label: 'Back to Today', variant: 'text' })}
          </div>
        </section>
      </div>
    </div>

${IMPORT_SCRIPT}
${options.nonce ? `<script type="module" src="/assets/client/import-page.js" nonce="${options.nonce}"></script>` : '<script type="module" src="/assets/client/import-page.js"></script>'}
  `;
  const content = renderPageTemplate({
    title: 'Import & Triage',
    description: 'Paste existing material, review the processing plan, and choose which entries to import.',
    archetype: 'form',
    bodyHtml,
  });
  return renderAdminShell('Import & Triage', '/admin/import', content, { nonce: options.nonce });
}
