import { ADMIN_API_CLIENT_SCRIPT } from '../../lib/admin-api-client.js';

export const IMPORT_SCRIPT = `
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
          const stepMeta = {
            add: { n: 1, title: 'Add material', pct: '35' },
            plan: { n: 2, title: 'Plan', pct: '65' },
            triage: { n: 3, title: 'Review', pct: '100' },
          }[step] || { n: 1, title: 'Add material', pct: '35' };
          const stepperEl = document.getElementById('import-stepper');
          if (stepperEl) {
            const labelEl = stepperEl.querySelector('.lp-stepper-label');
            const fillEl = stepperEl.querySelector('.lp-stepper-fill');
            if (labelEl) labelEl.textContent = 'Step ' + stepMeta.n + ' of 3 · ' + stepMeta.title;
            if (fillEl) fillEl.className = 'lp-stepper-fill lp-stepper-pct-' + stepMeta.pct;
          }
          ['add', 'plan', 'triage'].forEach(function(s) {
            const panel = document.getElementById('import-step-' + s);
            if (panel) panel.classList.toggle('lp-is-hidden', s !== step);
          });
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
            return '<div class="triage-card lp-triage-item ' + (isSelected ? 'selected' : '') + ' ' + statusClass + '" data-index="' + idx + '" id="triage-card-' + idx + '">' +
              '<div class="lp-row-between">' +
                '<strong>' + escapeClientHtml(item.title) + '</strong>' +
                '<span class="lp-badge">' + Math.round(item.confidence * 100) + '% confidence · ' + escapeClientHtml(item.status.toUpperCase()) + '</span>' +
              '</div>' +
              '<p class="lp-help-text">' +
                escapeClientHtml(item.body_md.slice(0, 140)) + '...' +
              '</p>' +
              '<div class="lp-row-wrap">' +
                '<label class="lp-field-label">Profile <select class="lp-input lp-select triage-profile" data-index="' + idx + '">' +
                  '<option value="case-study"' + (item.profile === 'case-study' ? ' selected' : '') + '>Case Study</option>' +
                  '<option value="decision-record"' + (item.profile === 'decision-record' ? ' selected' : '') + '>Decision Record</option>' +
                  '<option value="how-to"' + (item.profile === 'how-to' ? ' selected' : '') + '>How-to</option>' +
                '</select></label>' +
                '<label class="lp-field-label">Date <input type="date" class="lp-input triage-date" data-index="' + idx + '" value="' + escapeClientHtml(item.valid_from) + '" /></label>' +
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
                banner.innerHTML = '<div class="lp-notice lp-notice-ok">Successfully imported ' + data.importedCount + ' entries! <a href="/admin">Go to Admin Workspace →</a></div>';
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
    </script>`;
