import { loadConfig } from "@living-portfolio/config";
import { adaptDataSource, type WebDataClient } from "../../lib/data-source.js";
import { escapeHtml } from "../../lib/html.js";
import { renderLayout } from "../../layouts/public-shell.js";
import { ALPHA_WARNING_TEXT } from "../../renderer.js";
import { ADMIN_API_CLIENT_SCRIPT } from "./workspace.js";

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
