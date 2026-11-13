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

  let statusBadge = '<span class="chip" style="background:#fef3c7;color:#92400e;font-weight:600">Pending Review</span>';
  if (isApproved) {
    statusBadge = '<span class="chip" style="background:#d1fae5;color:#065f46;font-weight:600">Approved by Owner</span>';
  } else if (isRejected) {
    statusBadge = '<span class="chip" style="background:#fee2e2;color:#991b1b;font-weight:600">Declined</span>';
  }

  const dueLabel = escalation.due_at
    ? new Date(escalation.due_at).toLocaleString()
    : 'within 24 hours of submission';

  const facetsHtml = escalation.facets && Object.keys(escalation.facets).length > 0
    ? Object.entries(escalation.facets).map(([k, v]) => `<span class="chip" style="font-size:12px">${escapeHtml(k)}: ${escapeHtml(String(v))}</span>`).join(' ')
    : '';

  return renderLayout(
    'Question Status & Receipt',
    '/ask',
    `<div class="reading-column">
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:12px">
        <h1 style="margin:0">Escalation Receipt</h1>
        ${statusBadge}
      </div>

      <div class="strata-section" style="border:1px solid var(--rule);padding:16px;border-radius:var(--radius-control);margin-bottom:16px">
        <div style="font-size:12px;color:var(--text-muted);margin-bottom:6px">
          Submitted: ${new Date(escalation.at).toLocaleString()} · Class: ${escapeHtml(escalation.query_class)}
        </div>
        <p style="font-size:16px;font-weight:600;margin:0 0 8px 0">${escapeHtml(escalation.question)}</p>
        ${facetsHtml ? `<div style="margin-bottom:8px">${facetsHtml}</div>` : ''}
      </div>

      ${isPending ? `
      <div class="strata-section" style="border:1px solid #fef3c7;background:var(--surface-raised);padding:16px;border-radius:var(--radius-control);margin-bottom:16px">
        <h2 style="font-size:16px;margin:0 0 6px 0">Pending Owner Review</h2>
        <p style="margin:0 0 8px 0;font-size:14px">
          The owner typically reviews and answers pending queries within 24 hours (due by <strong>${escapeHtml(dueLabel)}</strong>).
        </p>
        <p style="margin:0 0 12px 0;font-size:13px;color:var(--text-muted)">
          Bookmark this link or refresh to see the reply. You can also provide an email or handle below to be notified directly.
        </p>

        ${escalation.draft ? `
        <div style="margin:12px 0;padding:10px 12px;background:var(--surface-page);border:1px solid var(--rule);border-radius:var(--radius-control);font-size:13px">
          <strong>Draft Under Review (Private to Visitor):</strong>
          <p style="margin:4px 0 0 0;font-style:italic;color:var(--text-muted)">${escapeHtml(escalation.draft)}</p>
        </div>` : ''}

        <div id="contact-feedback" style="display:none;margin-bottom:8px;font-size:13px;color:var(--accent)"></div>

        <form id="contact-form" style="display:flex;gap:8px;flex-wrap:wrap">
          <label for="contact-input" class="visually-hidden">Notification Email</label>
          <input id="contact-input" type="text" class="ask-input" style="flex:1;min-width:200px" value="${escapeHtml(escalation.visitor_contact || '')}" placeholder="you@example.com (optional notification)" />
          <button type="submit" id="btn-save-contact" class="btn btn-secondary">Save Notification Contact</button>
        </form>

        <div style="margin-top:16px;padding-top:12px;border-top:1px solid var(--rule);font-size:13px">
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
      <div class="strata-section" style="border:1px solid #d1fae5;background:var(--surface-raised);padding:16px;border-radius:var(--radius-control);margin-bottom:16px">
        <h2 style="font-size:16px;margin:0 0 8px 0;color:#065f46">Owner's Verified Reply</h2>
        <div style="font-size:15px;line-height:1.6;white-space:pre-wrap;margin-bottom:12px">${escapeHtml(escalation.final || escalation.draft || '')}</div>
        <div style="font-size:12px;color:var(--text-muted);border-top:1px solid var(--rule);padding-top:8px">
          Verified and approved by the owner directly from personal records.
        </div>
      </div>
      <p><a href="/ask" class="btn">Ask Another Question</a></p>` : ''}

      ${isRejected ? `
      <div class="strata-section" style="border:1px solid #fee2e2;background:var(--surface-raised);padding:16px;border-radius:var(--radius-control);margin-bottom:16px">
        <h2 style="font-size:16px;margin:0 0 8px 0;color:#991b1b">Question Declined</h2>
        <p style="margin:0 0 10px 0;font-size:14px">
          ${escapeHtml(escalation.rejection_reason || 'The owner reviewed this question and indicated it cannot be answered reliably from currently published records.')}
        </p>
        <p style="margin:0;font-size:13px;color:var(--text-muted)">
          If this involves specific non-public architectural constraints, consider <a href="/book?q=${encodeURIComponent(escalation.question)}">booking a live architecture conversation</a>.
        </p>
      </div>
      <p><a href="/ask" class="btn">Return to Ask</a></p>` : ''}
    </div>`
  );
}
