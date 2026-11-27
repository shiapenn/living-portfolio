import { ADMIN_API_CLIENT_SCRIPT } from '../../lib/admin-api-client.js';

export const IMPORT_SCRIPT = `
    <script>
      (function() {
        ${ADMIN_API_CLIENT_SCRIPT}

        const banner = document.getElementById('import-status-banner');
        function setBanner(text) {
          if (!banner) return;
          const bodyEl = banner.querySelector('.lp-notice-body') || banner;
          bodyEl.textContent = text || '';
          if (text) {
            banner.setAttribute('role', 'alert');
            banner.removeAttribute('hidden');
            banner.classList.remove('lp-is-hidden');
          } else {
            banner.removeAttribute('role');
            banner.setAttribute('hidden', '');
            banner.classList.add('lp-is-hidden');
          }
        }
        let currentStep = 'add';
        let documents = [];
        let triageItems = [];
        let selectedIndex = 0;

        function setStep(step) {
          currentStep = step;
          const stepperEl = document.getElementById('import-stepper');
          if (stepperEl) {
            if (step === 'done') {
              stepperEl.classList.add('lp-is-hidden');
              stepperEl.setAttribute('hidden', '');
            } else {
              stepperEl.classList.remove('lp-is-hidden');
              stepperEl.removeAttribute('hidden');
              const stepMeta = {
                add: { n: 1, title: 'Add material', pct: '35' },
                plan: { n: 2, title: 'Plan', pct: '65' },
                triage: { n: 3, title: 'Review', pct: '100' },
              }[step] || { n: 1, title: 'Add material', pct: '35' };
              const labelEl = stepperEl.querySelector('.lp-stepper-label');
              if (labelEl) {
                labelEl.textContent = 'Step ' + stepMeta.n + ' of 3 · ' + stepMeta.title;
                labelEl.className = 'lp-stepper-label lp-stepper-pct-' + stepMeta.pct;
              }
            }
          }
          ['add', 'plan', 'triage', 'done'].forEach(function(s) {
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

        // File upload handler wired in client/admin/import-page.ts

        const generatePlanBtn = document.getElementById('btn-generate-plan');
        if (generatePlanBtn) {
          generatePlanBtn.addEventListener('click', async function() {
            const pasteArea = document.getElementById('import-paste-area');
            const rawText = pasteArea ? pasteArea.value.trim() : '';
            if (!rawText) {
              setBanner('Please paste or enter Markdown content first.');
              return;
            }

            const batchSuffix = Date.now().toString(36).slice(-5);
            const rawDocs = rawText.split(/\\n\\s*---\\s*\\n/).map(function(t) { return t.trim(); }).filter(Boolean);
            documents = rawDocs.map(function(text, idx) {
              const firstLine = text.split('\\n')[0].replace(/^#+\\s*/, '').trim();
              const title = firstLine || 'Imported Entry ' + (idx + 1);
              const baseSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || ('imported-' + idx);
              const slug = baseSlug + '-' + batchSuffix + '-' + idx;
              return { title: title, slug: slug, text: text, body_md: text };
            });

            try {
              const res = await apiClient('/api/import/plan', {
                method: 'POST',
                body: JSON.stringify({ documents: documents })
              });
              if (res.ok) {
                const plan = await res.json();
                const freeEl = document.getElementById('plan-free-est');
                if (freeEl) freeEl.textContent = plan.freePlanEstimate || 'About 1 day within free limits';
                const paidEl = document.getElementById('plan-paid-est');
                if (paidEl) paidEl.textContent = plan.paidFastEstimate || 'Finish in minutes for ~$0.15';

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
                setBanner('');
              } else {
                setBanner('Planner calculation failed.');
              }
            } catch (err) {
              setBanner('Network error connecting to planner.');
            }
          });
        }

        // Keep Choice radio card selected state synced
        document.querySelectorAll('input[name="import_plan_tier"]').forEach(function(radio) {
          radio.addEventListener('change', function() {
            document.querySelectorAll('#import-plan-choice .lp-choice').forEach(function(lbl) {
              const inp = lbl.querySelector('input');
              lbl.classList.toggle('is-selected', Boolean(inp && inp.checked));
            });
          });
        });

        document.getElementById('btn-proceed-triage')?.addEventListener('click', function() {
          selectedIndex = 0;
          renderTriageCards();
          setStep('triage');
        });

        document.getElementById('btn-back-add')?.addEventListener('click', function() {
          setStep('add');
        });

        document.getElementById('btn-back-plan')?.addEventListener('click', function() {
          setStep('plan');
        });

        document.getElementById('btn-import-another')?.addEventListener('click', function(e) {
          e.preventDefault();
          documents = [];
          triageItems = [];
          selectedIndex = 0;
          const pasteArea = document.getElementById('import-paste-area');
          if (pasteArea) pasteArea.value = '';
          setBanner('');
          setStep('add');
        });

        function updateReviewCounter() {
          const counterEl = document.getElementById('import-review-counter');
          const reviewed = triageItems.filter(function(i) { return i.status === 'accepted' || i.status === 'skipped'; }).length;
          if (counterEl) {
            counterEl.textContent = reviewed + ' of ' + triageItems.length + ' reviewed';
          }
          const included = triageItems.filter(function(i) { return i.status === 'accepted'; }).length;
          const commitBtn = document.getElementById('btn-commit-batch');
          if (commitBtn) {
            commitBtn.textContent = included > 0 ? 'Import ' + included + ' included' : 'Import included';
          }
        }

        function renderTriageCards() {
          const container = document.getElementById('triage-cards-container');
          if (!container) return;

          container.innerHTML = triageItems.map(function(item, idx) {
            const isSelected = idx === selectedIndex;
            const statusClass = item.status === 'accepted' ? 'status-accepted' : (item.status === 'skipped' ? 'status-skipped' : '');
            const statusLabel = item.status === 'accepted' ? 'Included' : (item.status === 'skipped' ? 'Left out' : 'Pending');
            const includeClass = item.status === 'accepted' ? 'lp-btn lp-btn-primary lp-btn-sm' : 'lp-btn lp-btn-secondary lp-btn-sm';
            const leaveClass = item.status === 'skipped' ? 'lp-btn lp-btn-primary lp-btn-sm' : 'lp-btn lp-btn-secondary lp-btn-sm';
            return '<div data-c="Item" class="lp-item lp-item-has-actions triage-card ' + (isSelected ? 'selected is-selected ' : '') + statusClass + '" data-index="' + idx + '" id="triage-card-' + idx + '">' +
              '<div class="lp-item-main">' +
                '<div class="lp-item-head">' +
                  '<span class="lp-item-title">' + escapeClientHtml(item.title) + '</span>' +
                  '<span class="lp-item-status">' + Math.round(item.confidence * 100) + '% · ' + statusLabel + '</span>' +
                '</div>' +
                '<p class="lp-item-body">' + escapeClientHtml(item.body_md.slice(0, 140)) + '...</p>' +
                '<div class="lp-stack lp-gap-related">' +
                  '<div data-c="Field" data-rel="field" class="lp-field">' +
                    '<label class="lp-field-label" for="triage-profile-' + idx + '">Change type</label>' +
                    '<select id="triage-profile-' + idx + '" class="lp-input lp-select triage-profile" data-index="' + idx + '">' +
                      '<option value="case-study"' + (item.profile === 'case-study' ? ' selected' : '') + '>Case study</option>' +
                      '<option value="decision-record"' + (item.profile === 'decision-record' ? ' selected' : '') + '>Decision record</option>' +
                      '<option value="how-to"' + (item.profile === 'how-to' ? ' selected' : '') + '>How-to</option>' +
                    '</select>' +
                  '</div>' +
                  '<div data-c="Field" data-rel="field" class="lp-field">' +
                    '<label class="lp-field-label" for="triage-date-' + idx + '">Set date</label>' +
                    '<input id="triage-date-' + idx + '" type="date" class="lp-input triage-date" data-index="' + idx + '" value="' + escapeClientHtml(item.valid_from) + '" />' +
                  '</div>' +
                '</div>' +
                '<div data-c="ActionBar" data-level="inline" class="lp-action-bar lp-action-bar-inline">' +
                  '<button type="button" class="' + includeClass + '" data-item-action="include" data-index="' + idx + '">Include</button>' +
                  '<button type="button" class="' + leaveClass + '" data-item-action="leave-out" data-index="' + idx + '">Leave out</button>' +
                '</div>' +
              '</div>' +
            '</div>';
          }).join('');

          container.querySelectorAll('.triage-card').forEach(function(card) {
            card.addEventListener('click', function() {
              const idx = parseInt(card.getAttribute('data-index') || '0', 10);
              selectTriageCard(idx);
            });
          });

          container.querySelectorAll('[data-item-action="include"]').forEach(function(btn) {
            btn.addEventListener('click', function(e) {
              e.stopPropagation();
              const idx = parseInt(btn.getAttribute('data-index') || '0', 10);
              if (triageItems[idx]) {
                triageItems[idx].status = 'accepted';
                selectedIndex = idx;
                renderTriageCards();
              }
            });
          });

          container.querySelectorAll('[data-item-action="leave-out"]').forEach(function(btn) {
            btn.addEventListener('click', function(e) {
              e.stopPropagation();
              const idx = parseInt(btn.getAttribute('data-index') || '0', 10);
              if (triageItems[idx]) {
                triageItems[idx].status = 'skipped';
                selectedIndex = idx;
                renderTriageCards();
              }
            });
          });

          container.querySelectorAll('.triage-profile').forEach(function(sel) {
            sel.addEventListener('change', function(e) {
              const idx = parseInt(sel.getAttribute('data-index') || '0', 10);
              if (triageItems[idx]) triageItems[idx].profile = e.target.value;
            });
          });

          container.querySelectorAll('.triage-date').forEach(function(inp) {
            inp.addEventListener('change', function(e) {
              const idx = parseInt(inp.getAttribute('data-index') || '0', 10);
              if (triageItems[idx]) triageItems[idx].valid_from = e.target.value;
            });
          });

          updateReviewCounter();
        }

        function selectTriageCard(idx) {
          if (idx < 0 || idx >= triageItems.length) return;
          selectedIndex = idx;
          document.querySelectorAll('.triage-card').forEach(function(c, i) {
            c.classList.toggle('selected', i === selectedIndex);
            c.classList.toggle('is-selected', i === selectedIndex);
          });
          const el = document.getElementById('triage-card-' + selectedIndex);
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }

        function acceptCurrent() {
          if (triageItems[selectedIndex]) {
            triageItems[selectedIndex].status = 'accepted';
            if (selectedIndex < triageItems.length - 1) selectedIndex++;
            renderTriageCards();
          }
        }

        function skipCurrent() {
          if (triageItems[selectedIndex]) {
            triageItems[selectedIndex].status = 'skipped';
            if (selectedIndex < triageItems.length - 1) selectedIndex++;
            renderTriageCards();
          }
        }

        function reassignCurrent() {
          if (triageItems[selectedIndex]) {
            const current = triageItems[selectedIndex].profile;
            triageItems[selectedIndex].profile = current === 'case-study' ? 'decision-record' : (current === 'decision-record' ? 'how-to' : 'case-study');
            renderTriageCards();
          }
        }

        function focusDateCurrent() {
          const inp = document.getElementById('triage-date-' + selectedIndex);
          if (inp) inp.focus();
        }

        document.getElementById('btn-key-prev')?.addEventListener('click', function() { selectTriageCard(selectedIndex - 1); });
        document.getElementById('btn-key-next')?.addEventListener('click', function() { selectTriageCard(selectedIndex + 1); });
        document.getElementById('btn-bulk-accept')?.addEventListener('click', function() {
          triageItems.forEach(function(item) {
            if (item.confidence >= 0.8) item.status = 'accepted';
          });
          renderTriageCards();
        });

        window.addEventListener('keydown', function(e) {
          if (currentStep !== 'triage') return;
          const tag = (e.target && e.target.tagName) ? e.target.tagName.toLowerCase() : '';
          if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
          const key = e.key.toLowerCase();
          if (key === 'j') { e.preventDefault(); selectTriageCard(selectedIndex + 1); }
          else if (key === 'k') { e.preventDefault(); selectTriageCard(selectedIndex - 1); }
          else if (key === 'a') { e.preventDefault(); acceptCurrent(); }
          else if (key === 's') { e.preventDefault(); skipCurrent(); }
          else if (key === 'r') { e.preventDefault(); reassignCurrent(); }
          else if (key === 'd') { e.preventDefault(); focusDateCurrent(); }
        });

        const commitBatchBtn = document.getElementById('btn-commit-batch');
        if (commitBatchBtn) {
          commitBatchBtn.addEventListener('click', async function() {
            const accepted = triageItems.filter(function(i) { return i.status === 'accepted'; });
            if (accepted.length === 0) {
              setBanner('Select at least one item to include before importing.');
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
                const summaryEl = document.getElementById('import-done-summary');
                if (summaryEl) {
                  summaryEl.textContent = 'Successfully imported ' + data.importedCount + ' entries as private drafts.';
                }
                setBanner('');
                setStep('done');
              } else {
                setBanner('Batch import failed (HTTP ' + res.status + ').');
              }
            } catch (err) {
              setBanner('Network error committing batch.');
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
