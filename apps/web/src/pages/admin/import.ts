import { loadConfig } from "@living-portfolio/config";
import { adaptDataSource, type WebDataClient } from "../../lib/data-source.js";
import { renderAdminShell } from "../../layouts/admin-shell.js";
import { renderButton } from "../../primitives/index.js";
import { renderPageNotice } from "../../components/index.js";
import { IMPORT_SCRIPT } from './import-script.js';

export async function renderAdminImportPage(repo: WebDataClient): Promise<string> {
  repo = adaptDataSource(repo);
  const cfg = loadConfig();
  const stagingNoticeHtml =
    cfg.DEPLOYMENT_CLASS === 'staging'
      ? `<div data-banner="staging-import-disabled">${renderPageNotice({
          tone: 'warn',
          message: 'Import Disabled on Staging: Import connectors and ingestion pipelines are strictly disabled in staging environments to enforce synthetic data isolation.',
        })}</div>`
      : '';

  const content = `
    <div class="lp-page-header">
      <div>
        <h1 class="lp-page-title">Import &amp; Triage</h1>
        <p class="lp-page-subtitle">
          Connect or paste existing material, plan processing budget, and triage with confidence sorting and keyboard controls.
        </p>
      </div>
    </div>

    ${stagingNoticeHtml}
    <div class="lp-tablist" role="tablist" aria-label="Import stages">
      <button type="button" role="tab" class="lp-tab" id="step-tab-add" aria-selected="true">1. Add Material</button>
      <button type="button" role="tab" class="lp-tab" id="step-tab-plan" aria-selected="false">2. Import Planner</button>
      <button type="button" role="tab" class="lp-tab" id="step-tab-triage" aria-selected="false">3. Triage &amp; Review</button>
    </div>

    <div id="import-status-banner" role="status" aria-live="polite"></div>

    <!-- Step 1: Add Material -->
    <div id="import-step-add" class="lp-stack-md">
      <section class="lp-section-block lp-stack-md">
        <h2 class="lp-section-title">Add Existing Material</h2>
        <p class="lp-body-sm-muted">
          Paste one or more Markdown articles, notes, or case studies (separate multiple entries with <code>---</code>).
        </p>

        <div class="lp-field">
          <label class="lp-field-label" for="import-paste-area">Markdown Content</label>
          <textarea id="import-paste-area" rows="10" class="lp-input lp-textarea" placeholder="# Migrating to Postgres Advisory Locks&#10;&#10;In 2024 we eliminated lock contention by migrating to PostgreSQL 15 advisory locks...&#10;&#10;---&#10;&#10;# Edge Microservice Architecture&#10;&#10;Designed multi-region edge gateways on Cloudflare Workers..."></textarea>
        </div>

        <div class="lp-row-wrap">
          ${renderButton({ id: 'btn-generate-plan', label: 'Generate Processing Plan →', variant: 'primary' })}
          ${renderButton({ id: 'btn-load-sample', label: 'Load Sample Entries', variant: 'secondary' })}
        </div>
      </section>
    </div>

    <!-- Step 2: Import Planner -->
    <div id="import-step-plan" class="lp-stack-md lp-is-hidden">
      <section class="lp-section-block lp-stack-md">
        <h2 class="lp-section-title">Import Processing Planner</h2>
        <p class="lp-body-sm-muted">
          Estimated token workload and turnaround schedule based on detected document length.
        </p>

        <div class="lp-section-grid">
          <div class="lp-stack-sm">
            <h3 class="lp-section-title">Free Limits (Zero Cost)</h3>
            <div id="plan-free-est" class="lp-body-sm">Calculating...</div>
            <p class="lp-help-text">
              Runs within local or free-tier quotas. Enrichment throttles across daily allocation.
            </p>
          </div>
          <div class="lp-stack-sm">
            <h3 class="lp-section-title">Fast Cloud Acceleration</h3>
            <div id="plan-paid-est" class="lp-body-sm">Calculating...</div>
            <p class="lp-help-text">
              Parallel execution via external LLM provider. Clearly labeled cost without default selection.
            </p>
          </div>
        </div>

        <div class="lp-row-wrap">
          ${renderButton({ id: 'btn-proceed-triage', label: 'Proceed to Triage →', variant: 'primary' })}
          ${renderButton({ id: 'btn-back-add', label: '← Back', variant: 'secondary' })}
        </div>
      </section>
    </div>

    <!-- Step 3: Triage & Review -->
    <div id="import-step-triage" class="lp-stack-md lp-is-hidden">
      <div class="triage-keys-legend lp-row-wrap lp-help-text" aria-label="Keyboard Shortcuts">
        <span><kbd>J</kbd> / <kbd>K</kbd> Navigate items</span>
        <span><kbd>A</kbd> Accept</span>
        <span><kbd>R</kbd> Reassign profile</span>
        <span><kbd>D</kbd> Set date</span>
        <span><kbd>S</kbd> Skip</span>
      </div>

      <div class="lp-row-between">
        <div class="lp-row-wrap">
          ${renderButton({ id: 'btn-key-prev', label: 'K Prev', variant: 'secondary' })}
          ${renderButton({ id: 'btn-key-next', label: 'J Next', variant: 'secondary' })}
          ${renderButton({ id: 'btn-key-accept', label: 'A Accept', variant: 'secondary' })}
          ${renderButton({ id: 'btn-key-reassign', label: 'R Reassign', variant: 'secondary' })}
          ${renderButton({ id: 'btn-key-date', label: 'D Set Date', variant: 'secondary' })}
          ${renderButton({ id: 'btn-key-skip', label: 'S Skip', variant: 'secondary' })}
        </div>
        <div class="lp-row-wrap">
          ${renderButton({ id: 'btn-bulk-accept', label: 'Bulk Accept All High-Confidence', variant: 'secondary' })}
          ${renderButton({ id: 'btn-commit-batch', label: 'Commit Accepted Items', variant: 'primary' })}
        </div>
      </div>

      <div id="triage-cards-container" class="lp-stack-md"></div>
    </div>

${IMPORT_SCRIPT}
  `;
  return renderAdminShell('Import & Triage', '/admin/import', content);
}
