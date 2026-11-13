import { escapeHtml } from "../../lib/html.js";
import { renderLayout } from "../../layouts/public-shell.js";

export function renderBookPage(queryParam?: string, facetsParam?: string): string {
  const defaultTopic = queryParam || '';
  const defaultFacets = facetsParam || '';

  return renderLayout(
    'Book a conversation',
    '/book',
    `<div class="reading-column">
      <h1>Book a conversation</h1>
      <p>If your situation differs from what I've written about, a conversation will serve you better than a guess.</p>

      ${(defaultTopic || defaultFacets) ? `
      <div style="padding:10px 14px;background:var(--surface-raised);border:1px solid var(--rule);border-radius:var(--radius-control);margin-bottom:16px;font-size:13px">
        <strong>Carried Context from Ask:</strong>
        ${defaultTopic ? `<div style="margin-top:4px"><em>Topic:</em> "${escapeHtml(defaultTopic)}"</div>` : ''}
        ${defaultFacets ? `<div style="margin-top:2px;color:var(--text-muted)"><em>Facets:</em> ${escapeHtml(defaultFacets)}</div>` : ''}
      </div>` : ''}

      <div id="booking-confirmation" style="display:none;padding:16px;border:1px solid var(--accent);background:var(--surface-raised);border-radius:var(--radius-control);margin-bottom:16px" role="region" aria-label="Booking Confirmation">
        <span class="chip" style="background:#d1fae5;color:#065f46;font-weight:600;margin-bottom:8px;display:inline-block">✓ Request Confirmed</span>
        <h2 style="font-size:18px;margin:8px 0 4px 0">Consultation Request Received</h2>
        <p style="margin:0 0 10px 0;font-size:14px">
          We've received your request for: <strong id="conf-topic"></strong>
        </p>
        <p style="margin:0 0 12px 0;font-size:13px;color:var(--text-muted)">
          The owner will review your architectural context and reach out at <strong id="conf-contact"></strong> within 24 hours to coordinate scheduling.
        </p>
        <a href="/work" class="btn btn-secondary" style="text-decoration:none;display:inline-block">Explore Portfolio Records →</a>
      </div>

      <form id="booking-form" class="strata-section" style="border:1px solid var(--rule);padding:16px;border-radius:var(--radius-control)">
        <div id="booking-error" style="display:none;color:var(--status-warn,#d97706);font-size:13px;margin-bottom:12px" role="alert"></div>

        <div style="margin-bottom:12px">
          <label for="book-topic" style="display:block;font-weight:600;margin-bottom:4px;font-size:14px">Topic / Architecture Question <span style="color:var(--status-warn,#d97706)">*</span></label>
          <input id="book-topic" name="topic" type="text" class="ask-input" style="width:100%" value="${escapeHtml(defaultTopic)}" placeholder="Describe your architecture constraint or review topic..." required />
        </div>

        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;margin-bottom:12px">
          <div>
            <label for="book-name" style="display:block;font-weight:600;margin-bottom:4px;font-size:14px">Your Name / Organization</label>
            <input id="book-name" name="visitor_name" type="text" class="ask-input" style="width:100%" placeholder="e.g. Jane Doe or Engineering Lead" />
          </div>
          <div>
            <label for="book-contact" style="display:block;font-weight:600;margin-bottom:4px;font-size:14px">Contact Email or Handle <span style="color:var(--status-warn,#d97706)">*</span></label>
            <input id="book-contact" name="visitor_contact" type="text" class="ask-input" style="width:100%" placeholder="e.g. alex@example.com or @handle" required />
          </div>
        </div>

        <div style="margin-bottom:12px">
          <label for="book-facets" style="display:block;font-weight:600;margin-bottom:4px;font-size:14px">Context Facets / Production Constraints</label>
          <input id="book-facets" name="facets" type="text" class="ask-input" style="width:100%" value="${escapeHtml(defaultFacets)}" placeholder="e.g. scale: high_volume, stack: postgres, cloud: aws" />
        </div>

        <div style="margin-bottom:12px">
          <label for="book-time" style="display:block;font-weight:600;margin-bottom:4px;font-size:14px">Preferred Times / Format</label>
          <input id="book-time" name="preferred_time" type="text" class="ask-input" style="width:100%" placeholder="e.g. Weekday mornings (UTC+8), 30 min video call" />
        </div>

        <div style="margin-bottom:16px">
          <label for="book-notes" style="display:block;font-weight:600;margin-bottom:4px;font-size:14px">Additional Background Notes</label>
          <textarea id="book-notes" name="notes" class="ask-input" style="width:100%;min-height:70px;line-height:1.4" placeholder="Optional notes or links to relevant repos..."></textarea>
        </div>

        <button type="submit" id="btn-submit-booking" class="btn">Send request</button>
      </form>

      <script>
        (function() {
          var form = document.getElementById('booking-form');
          var confirmation = document.getElementById('booking-confirmation');
          var errorDiv = document.getElementById('booking-error');
          var submitBtn = document.getElementById('btn-submit-booking');

          if (form) {
            form.addEventListener('submit', async function(e) {
              e.preventDefault();
              errorDiv.style.display = 'none';
              submitBtn.setAttribute('disabled', 'true');
              submitBtn.textContent = 'Submitting Request...';

              var topic = (document.getElementById('book-topic').value || '').trim();
              var visitor_name = (document.getElementById('book-name').value || '').trim();
              var visitor_contact = (document.getElementById('book-contact').value || '').trim();
              var facetsRaw = (document.getElementById('book-facets').value || '').trim();
              var preferred_time = (document.getElementById('book-time').value || '').trim();
              var notes = (document.getElementById('book-notes').value || '').trim();

              var facets = {};
              if (facetsRaw) {
                try {
                  if (facetsRaw.startsWith('{')) {
                    facets = JSON.parse(facetsRaw);
                  } else {
                    facetsRaw.split(',').forEach(function(pair) {
                      var parts = pair.split(':');
                      if (parts.length >= 2) {
                        facets[parts[0].trim()] = parts.slice(1).join(':').trim();
                      } else {
                        facets[pair.trim()] = true;
                      }
                    });
                  }
                } catch (err) {
                  facets = { raw: facetsRaw };
                }
              }

              try {
                var res = await fetch('/api/book', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    topic: topic,
                    visitor_name: visitor_name || undefined,
                    visitor_contact: visitor_contact,
                    facets: facets,
                    preferred_time: preferred_time || undefined,
                    notes: notes || undefined
                  })
                });

                var data = await res.json();
                if (res.ok && data.success) {
                  form.style.display = 'none';
                  document.getElementById('conf-topic').textContent = topic;
                  document.getElementById('conf-contact').textContent = visitor_contact;
                  confirmation.style.display = 'block';
                } else {
                  errorDiv.textContent = data.error || 'Failed to submit request. Please try again.';
                  errorDiv.style.display = 'block';
                  submitBtn.removeAttribute('disabled');
                  submitBtn.textContent = 'Send request';
                }
              } catch (err) {
                errorDiv.textContent = 'Network error submitting booking request. Please check connection and try again.';
                errorDiv.style.display = 'block';
                submitBtn.removeAttribute('disabled');
                submitBtn.textContent = 'Send request';
              }
            });
          }
        })();
      </script>
    </div>`
  );
}
