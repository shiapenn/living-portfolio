import { adaptDataSource, type WebDataClient } from "../../lib/data-source.js";
import { escapeHtml, parseAsOfDate } from "../../lib/html.js";
import { renderLayout } from "../../layouts/public-shell.js";
import { formatActionableError, STRINGS_EN } from "../../strings.js";

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
    ? `<div class="as-of-banner" role="status" style="margin-bottom:var(--lp-space-stack-snug);font-size:var(--lp-font-size-13)">
        <span><strong>Time-travel query active:</strong> Synthesizing answer strictly from records known as of <strong>${escapeHtml(initialAsOfDate)}</strong>.</span>
        <a href="/ask${activeScope ? `?scope=${encodeURIComponent(activeScope)}` : ''}">Reset to present</a>
      </div>`
    : '';

  const content = `
    <h1 style="font-family:var(--lp-font-family-reading);font-size:var(--lp-font-size-30);margin:0 0 var(--lp-space-stack-label-to-control) 0">Ask about my work</h1>
    <p style="color:var(--text-muted);margin:0 0 var(--lp-space-stack-group) 0;max-width:65ch">
      Answers come from my published entries and cite them. When my records don't cover your situation, I'll say so and offer a conversation.
    </p>

    <div class="ask-box" style="margin-top:0">
      ${activeScope ? `<div id="scope-chip-container" style="margin-bottom:var(--lp-space-stack-snug)"><span class="chip" id="ask-scope-chip">Scope: <strong>${escapeHtml(activeScope)}</strong> <button type="button" id="btn-clear-scope" style="background:none;border:none;cursor:pointer;padding:0 var(--lp-space-inset-track);font-weight:700" title="Clear scope">×</button></span></div>` : ''}
      ${asOfNoticeHtml}
      <form id="ask-form">
        <label for="ask-q" style="font-weight:600;display:block;margin-bottom:var(--lp-space-stack-sub-compact)">Your question</label>
        <div class="ask-input-row" style="margin-top:0">
          <input id="ask-q" name="q" type="text" class="ask-input" value="${escapeHtml(queryText || '')}" placeholder="e.g., Should we use PostgreSQL advisory locks or Redis for webhook coordination?" required />
          <button type="submit" class="btn" id="btn-ask-submit">Ask</button>
        </div>

        <details style="margin-top:var(--lp-space-stack-field-to-field)" ${queryText?.toLowerCase().includes('should') || hasValidAsOf ? 'open' : ''}>
          <summary style="cursor:pointer;font-size:var(--lp-font-size-14);color:var(--text-muted)">Tell me about your situation (optional)</summary>
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(var(--lp-size-popover-min-w),1fr));gap:var(--lp-space-stack-snug);margin-top:var(--lp-space-stack-snug)">
            <div>
              <label for="facet-db" style="font-size:var(--lp-font-size-13);display:block">Database</label>
              <input id="facet-db" type="text" class="ask-input" style="width:100%;padding:var(--lp-space-inset-compact)" placeholder="e.g., PostgreSQL or MySQL" />
            </div>
            <div>
              <label for="facet-stack" style="font-size:var(--lp-font-size-13);display:block">Stack</label>
              <input id="facet-stack" type="text" class="ask-input" style="width:100%;padding:var(--lp-space-inset-compact)" placeholder="e.g., Node.js, PgBouncer" />
            </div>
            <div>
              <label for="facet-asof" style="font-size:var(--lp-font-size-13);display:block">Answer as of (optional)</label>
              <input id="facet-asof" type="date" class="ask-input" style="width:100%;padding:var(--lp-space-inset-compact)" value="${escapeHtml(initialAsOfDate)}" />
            </div>
          </div>
        </details>
      </form>

      <div style="margin-top:var(--lp-space-stack-field-to-field);display:flex;gap:var(--lp-space-stack-label-to-control);flex-wrap:wrap;align-items:center">
        <span style="font-size:var(--lp-font-size-13);color:var(--text-muted)">Try asking:</span>
        ${examplesHtml}
      </div>
    </div>

    <div id="ask-live-region" aria-live="polite" style="margin-top:var(--lp-space-stack-group)"></div>

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
                  '<div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:var(--lp-space-stack-label-to-control);margin-bottom:var(--lp-space-stack-snug)">' +
                    '<span class="chip" data-status="invalid-query"><strong>Type a question to ask</strong></span>' +
                  '</div>' +
                  '<p style="margin:0 0 var(--lp-space-stack-snug) 0">' + esc(msg) + '</p>' +
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
                  '<p style="margin:var(--lp-space-stack-snug) 0">' + esc(answerText) + '</p>' +
                  '<p style="font-size:var(--lp-font-size-13);color:var(--text-muted)">Please try again in about ' + retryMinutes + ' minutes (' + retrySecs + 's), or book a session directly.</p>' +
                  '<div style="margin-top:var(--lp-space-stack-snug)"><a href="/book?q=' + encodeURIComponent(queryText) + '" class="btn" style="display:inline-block;text-decoration:none">Book a conversation →</a></div>' +
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
              ? '<div class="scope-notice" id="ask-scoped-notice" style="margin-bottom:var(--lp-space-stack-note);font-size:var(--lp-font-size-13);color:var(--text-muted)">Scoped to entry: <strong>' + esc(currentScope) + '</strong></div>'
              : '';

            if (data.tier === 'needs_context') {
              const missingList = Array.isArray(data.missingFacets) && data.missingFacets.length > 0 ? data.missingFacets : ['database', 'stack'];
              const facetFieldsHtml = missingList.map(function(f) {
                const label = esc(f.charAt(0).toUpperCase() + f.slice(1).replace(/_/g, ' '));
                return '<div style="margin-bottom:var(--lp-space-stack-label-to-control)">' +
                  '<label for="ctx-facet-' + esc(f) + '" style="font-size:var(--lp-font-size-12);font-weight:600;display:block;margin-bottom:var(--lp-space-stack-hairline)">' + label + '</label>' +
                  '<input type="text" id="ctx-facet-' + esc(f) + '" class="ask-input dynamic-facet-input" data-facet="' + esc(f) + '" style="width:100%;padding:var(--lp-space-inset-compact)" placeholder="e.g. your ' + esc(f) + '..." />' +
                  '</div>';
              }).join('');

              region.innerHTML =
                '<div class="strata-section" id="needs-context-card">' +
                  '<div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:var(--lp-space-stack-label-to-control);margin-bottom:var(--lp-space-stack-snug)">' +
                    '<span class="chip"><strong>' + esc(tierLabels.needs_context) + '</strong></span>' +
                  '</div>' +
                  scopeNoticeHtml +
                  '<p style="margin:0 0 var(--lp-space-stack-snug) 0">' + esc(data.answer || 'To advise accurately on this question, please provide the following details about your architecture or environment:') + '</p>' +
                  '<form id="needs-context-form" style="margin-bottom:var(--lp-space-stack-snug)">' +
                    facetFieldsHtml +
                    '<div style="display:flex;gap:var(--lp-space-stack-label-to-control);margin-top:var(--lp-space-stack-snug);flex-wrap:wrap">' +
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
              return '<li style="margin-bottom:var(--lp-space-stack-sub-compact)"><strong>[' + esc(c.citationId) + ']</strong> <a href="/work/' + encodeURIComponent(String(c.slug || '')) + '">' + esc(c.title) + '</a>: <em>"' + esc(c.text) + '"</em></li>';
            }).join('');

            const disclosureText = data.provider_disclosure || data.aiDisclosure;
            const disclosureHtml = disclosureText
              ? '<p class="provider-disclosure" style="font-size:var(--lp-font-size-12);color:var(--text-muted);margin:var(--lp-space-stack-field-to-field) 0 0 0;border-top:var(--lp-border-hairline) solid var(--rule);padding-top:var(--lp-space-inset-item-x)">Automated answer: ' + esc(disclosureText) + '</p>'
              : '';

            let receiptHtml = '';
            if (data.tier === 'tier2' && (data.receiptUrl || data.statusToken)) {
              const rUrl = safePath(data.receiptUrl || ('/ask/status/' + (data.statusToken || '')));
              receiptHtml =
                '<div style="margin:var(--lp-space-stack-field-to-field) 0;padding:var(--lp-space-inset-item-y);border:var(--lp-border-hairline) solid var(--accent);border-radius:var(--lp-radius-control);background:var(--surface-raised)">' +
                  '<strong style="font-size:var(--lp-font-size-14);display:block;margin-bottom:var(--lp-space-stack-compact)">Receipt Created</strong>' +
                  '<p style="margin:0 0 var(--lp-space-stack-label-to-control) 0;font-size:var(--lp-font-size-13)">You can track the owner&#39;s review and view the delivered reply at your personal receipt URL:</p>' +
                  '<a href="' + rUrl + '" class="btn" id="btn-view-receipt" style="display:inline-block;text-decoration:none">View Status Receipt →</a>' +
                '</div>';
            }

            region.innerHTML =
              '<div class="strata-section">' +
                '<div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:var(--lp-space-stack-label-to-control);margin-bottom:var(--lp-space-stack-snug)">' +
                  '<span class="chip"><strong>' + esc(tierLabels[data.tier] || data.tier) + '</strong></span>' +
                '</div>' +
                scopeNoticeHtml +
                (data.basis ? '<p style="font-size:var(--lp-font-size-13);color:var(--text-muted);margin:0 0 var(--lp-space-stack-label-to-control) 0">' + esc(data.basis) + '</p>' : '') +
                '<div class="reading-column" style="white-space:pre-wrap;margin-bottom:var(--lp-space-stack-field-to-field)">' + esc(data.answer) + '</div>' +
                receiptHtml +
                (citationsHtml ? '<div style="border-top:var(--lp-border-hairline) solid var(--rule);padding-top:var(--lp-space-inset-item-y)"><strong style="font-size:var(--lp-font-size-14)">Sources</strong><ul style="margin:var(--lp-space-stack-label-to-control) 0 0;padding-left:var(--lp-size-icon-md);font-size:var(--lp-font-size-14)">' + citationsHtml + '</ul></div>' : '') +
                (data.bookingUrl ? '<div style="margin-top:var(--lp-space-stack-snug)"><a href="' + safePath(data.bookingUrl) + '" class="btn" style="display:inline-block;text-decoration:none">Book a conversation →</a></div>' : '') +
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
