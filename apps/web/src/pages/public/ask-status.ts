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
        <p class="pub-muted">The token provided does not match any active escalation receipt in these records.</p>
        <p><a href="/ask" class="btn">Return to Ask</a></p>
      </div>`
    );
  }

  const isPending = escalation.status === 'pending';
  const isApproved = escalation.status === 'approved';
  const isRejected = escalation.status === 'rejected';

  let statusBadge = '<span class="chip">Pending Review</span>';
  if (isApproved) {
    statusBadge = '<span class="chip">Approved by Owner</span>';
  } else if (isRejected) {
    statusBadge = '<span class="chip">Declined</span>';
  }

  const dueLabel = escalation.due_at
    ? new Date(escalation.due_at).toLocaleString()
    : 'within 24 hours of submission';

  const facetsHtml = escalation.facets && Object.keys(escalation.facets).length > 0
    ? Object.entries(escalation.facets).map(([k, v]) => `<span class="chip">${escapeHtml(k)}: ${escapeHtml(String(v))}</span>`).join(' ')
    : '';

  return renderLayout(
    'Question Status & Receipt',
    '/ask',
    `<div class="reading-column">
      <div class="pub-row-between pub-mb-md">
        <h1 class="pub-m-0">Escalation Receipt</h1>
        ${statusBadge}
      </div>

      <div class="strata-section pub-mb-md">
        <div class="pub-muted pub-mb-md">
          Submitted: ${new Date(escalation.at).toLocaleString()} · Class: ${escapeHtml(escalation.query_class)}
        </div>
        <p class="pub-m-0">${escapeHtml(escalation.question)}</p>
        ${facetsHtml ? `<div class="pub-mb-md">${facetsHtml}</div>` : ''}
      </div>

      ${isPending ? `
      <div class="strata-section pub-mb-md">
        <h2 class="pub-m-0">Pending Owner Review</h2>
        <p class="pub-m-0">
          The owner typically reviews and answers pending queries within 24 hours (due by <strong>${escapeHtml(dueLabel)}</strong>).
        </p>
        <p class="pub-muted pub-m-0">
          Bookmark this link or refresh to see the reply. You can also provide an email or handle below to be notified directly.
        </p>

        ${escalation.draft ? `
        <div>
          <strong>Draft Under Review (Private to Visitor):</strong>
          <p class="pub-muted">${escapeHtml(escalation.draft)}</p>
        </div>` : ''}

        <div id="contact-feedback" class="pub-mb-md"></div>

        <form id="contact-form" class="pub-row">
          <label for="contact-input" class="visually-hidden">Notification Email</label>
          <input id="contact-input" type="text" class="ask-input pub-flex-1" value="${escapeHtml(escalation.visitor_contact || '')}" placeholder="you@example.com (optional notification)" />
          <button type="submit" id="btn-save-contact" class="btn btn-secondary">Save Notification Contact</button>
        </form>

        <div class="pub-section pub-mt-md">
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
      <div class="strata-section pub-mb-md">
        <h2 class="pub-m-0">Owner's Verified Reply</h2>
        <div class="pub-mb-md">${escapeHtml(escalation.final || escalation.draft || '')}</div>
        <div class="pub-muted pub-section">
          Verified and approved by the owner directly from personal records.
        </div>
      </div>
      <p><a href="/ask" class="btn">Ask Another Question</a></p>` : ''}

      ${isRejected ? `
      <div class="strata-section pub-mb-md">
        <h2 class="pub-m-0">Question Declined</h2>
        <p class="pub-m-0">
          ${escapeHtml(escalation.rejection_reason || 'The owner reviewed this question and indicated it cannot be answered reliably from currently published records.')}
        </p>
        <p class="pub-muted pub-m-0">
          If this involves specific non-public architectural constraints, consider <a href="/book?q=${encodeURIComponent(escalation.question)}">booking a live architecture conversation</a>.
        </p>
      </div>
      <p><a href="/ask" class="btn">Return to Ask</a></p>` : ''}
    </div>`
  );
}
