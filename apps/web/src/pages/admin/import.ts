import { loadConfig } from "@living-portfolio/config";
import { adaptDataSource, type WebDataClient } from "../../lib/data-source.js";
import { escapeHtml } from "../../lib/html.js";
import { renderAdminShell } from "../../layouts/admin-shell.js";
import { ALPHA_WARNING_TEXT } from "../../renderer.js";
import { IMPORT_SCRIPT } from './import-script.js';

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

${IMPORT_SCRIPT}
  `;
  return renderAdminShell('Import & Triage', '/admin/import', content);
}
