import { adaptDataSource, type WebDataClient } from "../../lib/data-source.js";
import { escapeHtml } from "../../lib/html.js";
import { renderLayout } from "../../layouts/public-shell.js";

export async function renderAskStatusPage(repo: WebDataClient, statusToken: string): Promise<string> {
  repo = adaptDataSource(repo);
  const escalation = await repo.getEscalationByStatusToken(statusToken);

  if (!escalation) {
    return renderLayout(
      'Receipt Not Found',
      '/ask',
      `<div class="reading-column">
        <h1>Receipt Status Not Found</h1>
        <p style="color:var(--text-muted)">The token provided does not match any active escalation receipt in these records.</p>
        <p><a href="/ask" class="btn">Return to Ask</a></p>
      </div>`
    );
  }

  const isPending = escalation.status === 'pending';
  const isApproved = escalation.status === 'approved';
  const isRejected = escalation.status === 'rejected';

  let statusBadge = '<span class="chip" style="background:var(--lp-color-role-warning-bg);color:var(--lp-color-role-warning-fg);font-weight:600">Pending Review</span>';
  if (isApproved) {
    statusBadge = '<span class="chip" style="background:var(--lp-color-role-success-bg);color:var(--lp-color-role-success-fg);font-weight:600">Approved by Owner</span>';
  } else if (isRejected) {
    statusBadge = '<span class="chip" style="background:var(--lp-color-role-danger-bg);color:var(--lp-color-role-danger-fg);font-weight:600">Declined</span>';
  }

  const dueLabel = escalation.due_at
    ? new Date(escalation.due_at).toLocaleString()
    : 'within 24 hours of submission';

  const facetsHtml = escalation.facets && Object.keys(escalation.facets).length > 0
    ? Object.entries(escalation.facets).map(([k, v]) => `<span class="chip" style="font-size:var(--lp-font-size-12)">${escapeHtml(k)}: ${escapeHtml(String(v))}</span>`).join(' ')
    : '';

  return renderLayout(
    'Question Status & Receipt',
    '/ask',
    `<div class="reading-column">
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:var(--lp-space-stack-label-to-control);margin-bottom:var(--lp-space-inset-item-y)">
        <h1 style="margin:0">Escalation Receipt</h1>
        ${statusBadge}
      </div>

      <div class="strata-section" style="border:var(--lp-border-hairline) solid var(--rule);padding:var(--lp-space-inset-section);border-radius:var(--lp-radius-control);margin-bottom:var(--lp-space-stack-field-to-field)">
        <div style="font-size:var(--lp-font-size-12);color:var(--text-muted);margin-bottom:var(--lp-space-proximity-2)">
          Submitted: ${new Date(escalation.at).toLocaleString()} · Class: ${escapeHtml(escalation.query_class)}
        </div>
        <p style="font-size:var(--lp-font-size-16);font-weight:600;margin:0 0 var(--lp-space-stack-label-to-control) 0">${escapeHtml(escalation.question)}</p>
        ${facetsHtml ? `<div style="margin-bottom:var(--lp-space-stack-label-to-control)">${facetsHtml}</div>` : ''}
      </div>

      ${isPending ? `
      <div class="strata-section" style="border:var(--lp-border-hairline) solid var(--lp-color-role-warning-bg);background:var(--surface-raised);padding:var(--lp-space-inset-section);border-radius:var(--lp-radius-control);margin-bottom:var(--lp-space-stack-field-to-field)">
        <h2 style="font-size:var(--lp-font-size-16);margin:0 0 var(--lp-space-proximity-2) 0">Pending Owner Review</h2>
        <p style="margin:0 0 var(--lp-space-stack-label-to-control) 0;font-size:var(--lp-font-size-14)">
          The owner typically reviews and answers pending queries within 24 hours (due by <strong>${escapeHtml(dueLabel)}</strong>).
        </p>
        <p style="margin:0 0 var(--lp-space-inset-item-y) 0;font-size:var(--lp-font-size-12);color:var(--text-muted)">
          Bookmark this link or refresh to see the reply. You can also provide an email or handle below to be notified directly.
        </p>

        ${escalation.draft ? `
        <div style="margin:var(--lp-space-inset-item-y) 0;padding:var(--lp-space-inset-control-sm) var(--lp-space-inset-item-y);background:var(--surface-page);border:var(--lp-border-hairline) solid var(--rule);border-radius:var(--lp-radius-control);font-size:var(--lp-font-size-12)">
          <strong>Draft Under Review (Private to Visitor):</strong>
          <p style="margin:var(--lp-space-proximity-1) 0 0 0;font-style:italic;color:var(--text-muted)">${escapeHtml(escalation.draft)}</p>
        </div>` : ''}

        <div id="contact-feedback" style="display:none;margin-bottom:var(--lp-space-stack-label-to-control);font-size:var(--lp-font-size-12);color:var(--accent)"></div>

        <form id="contact-form" style="display:flex;gap:var(--lp-space-stack-label-to-control);flex-wrap:wrap">
          <label for="contact-input" class="visually-hidden">Notification Email</label>
          <input id="contact-input" type="text" class="ask-input" style="flex:1;min-width:var(--lp-size-popover-min-w)" value="${escapeHtml(escalation.visitor_contact || '')}" placeholder="you@example.com (optional notification)" />
          <button type="submit" id="btn-save-contact" class="btn btn-secondary">Save Notification Contact</button>
        </form>

        <div style="margin-top:var(--lp-space-stack-field-to-field);padding-top:var(--lp-space-inset-item-y);border-top:var(--lp-border-hairline) solid var(--rule);font-size:var(--lp-font-size-12)">
          Need an immediate live discussion instead? <a href="/book?q=${encodeURIComponent(escalation.question)}">Book a 30-minute consultation →</a>
        </div>
      </div>
      <script>
        (function() {
          var form = document.getElementById('contact-form');
          var input = document.getElementById('contact-input');
          var fb = document.getElementById('contact-feedback');
          if (form) {
            form.addEventListener('submit', async function(e) {
              e.preventDefault();
              var contact = (input.value || '').trim();
              if (!contact) return;
              try {
                var res = await fetch('/api/ask/status/${statusToken}/contact', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ contact: contact })
                });
                var data = await res.json();
                if (res.ok && data.success) {
                  fb.textContent = '✓ ' + data.message;
                  fb.style.display = 'block';
                }
              } catch (err) {
                fb.textContent = 'Network error saving contact.';
                fb.style.display = 'block';
              }
            });
          }
        })();
      </script>` : ''}

      ${isApproved ? `
      <div class="strata-section" style="border:var(--lp-border-hairline) solid var(--lp-color-role-success-bg);background:var(--surface-raised);padding:var(--lp-space-inset-section);border-radius:var(--lp-radius-control);margin-bottom:var(--lp-space-stack-field-to-field)">
        <h2 style="font-size:var(--lp-font-size-16);margin:0 0 var(--lp-space-stack-label-to-control) 0;color:var(--lp-color-role-success-fg)">Owner's Verified Reply</h2>
        <div style="font-size:var(--lp-font-size-14);line-height:1.6;white-space:pre-wrap;margin-bottom:var(--lp-space-inset-item-y)">${escapeHtml(escalation.final || escalation.draft || '')}</div>
        <div style="font-size:var(--lp-font-size-12);color:var(--text-muted);border-top:var(--lp-border-hairline) solid var(--rule);padding-top:var(--lp-space-inset-item-x)">
          Verified and approved by the owner directly from personal records.
        </div>
      </div>
      <p><a href="/ask" class="btn">Ask Another Question</a></p>` : ''}

      ${isRejected ? `
      <div class="strata-section" style="border:var(--lp-border-hairline) solid var(--lp-color-role-danger-bg);background:var(--surface-raised);padding:var(--lp-space-inset-section);border-radius:var(--lp-radius-control);margin-bottom:var(--lp-space-stack-field-to-field)">
        <h2 style="font-size:var(--lp-font-size-16);margin:0 0 var(--lp-space-stack-label-to-control) 0;color:var(--lp-color-role-danger-fg)">Question Declined</h2>
        <p style="margin:0 0 var(--lp-space-inset-item-y) 0;font-size:var(--lp-font-size-14)">
          ${escapeHtml(escalation.rejection_reason || 'The owner reviewed this question and indicated it cannot be answered reliably from currently published records.')}
        </p>
        <p style="margin:0;font-size:var(--lp-font-size-12);color:var(--text-muted)">
          If this involves specific non-public architectural constraints, consider <a href="/book?q=${encodeURIComponent(escalation.question)}">booking a live architecture conversation</a>.
        </p>
      </div>
      <p><a href="/ask" class="btn">Return to Ask</a></p>` : ''}
    </div>`
  );
}
