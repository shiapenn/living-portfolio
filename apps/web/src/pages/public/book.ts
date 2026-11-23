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
      <div class="pub-mb-md">
        <strong>Carried Context from Ask:</strong>
        ${defaultTopic ? `<div class="pub-mt-md"><em>Topic:</em> "${escapeHtml(defaultTopic)}"</div>` : ''}
        ${defaultFacets ? `<div class="pub-muted pub-mt-md"><em>Facets:</em> ${escapeHtml(defaultFacets)}</div>` : ''}
      </div>` : ''}

      <div id="booking-confirmation" class="pub-mb-md" role="region" aria-label="Booking Confirmation">
        <span class="chip pub-mb-md">✓ Request Confirmed</span>
        <h2>Consultation Request Received</h2>
        <p class="pub-m-0">
          We've received your request for: <strong id="conf-topic"></strong>
        </p>
        <p class="pub-muted pub-m-0">
          The owner will review your architectural context and reach out at <strong id="conf-contact"></strong> within 24 hours to coordinate scheduling.
        </p>
        <a href="/work" class="btn btn-secondary">Explore Portfolio Records →</a>
      </div>

      <form id="booking-form" class="strata-section">
        <div id="booking-error" class="pub-mb-md" role="alert"></div>

        <div class="pub-mb-md">
          <label for="book-topic" class="pub-mb-md">Topic / Architecture Question <span>*</span></label>
          <input id="book-topic" name="topic" type="text" class="ask-input pub-btn-full" value="${escapeHtml(defaultTopic)}" placeholder="Describe your architecture constraint or review topic..." required />
        </div>

        <div class="pub-grid-2 pub-mb-md">
          <div>
            <label for="book-name" class="pub-mb-md">Your Name / Organization</label>
            <input id="book-name" name="visitor_name" type="text" class="ask-input pub-btn-full" placeholder="e.g. Your Name or Engineering Lead" />
          </div>
          <div>
            <label for="book-contact" class="pub-mb-md">Contact Email or Handle <span>*</span></label>
            <input id="book-contact" name="visitor_contact" type="text" class="ask-input pub-btn-full" placeholder="e.g. alex@example.com or @handle" required />
          </div>
        </div>

        <div class="pub-mb-md">
          <label for="book-facets" class="pub-mb-md">Context Facets / Production Constraints</label>
          <input id="book-facets" name="facets" type="text" class="ask-input pub-btn-full" value="${escapeHtml(defaultFacets)}" placeholder="e.g. scale: high_volume, stack: postgres, cloud: aws" />
        </div>

        <div class="pub-mb-md">
          <label for="book-time" class="pub-mb-md">Preferred Times / Format</label>
          <input id="book-time" name="preferred_time" type="text" class="ask-input pub-btn-full" placeholder="e.g. Weekday mornings (UTC+8), 30 min video call" />
        </div>

        <div class="pub-mb-md">
          <label for="book-notes" class="pub-mb-md">Additional Background Notes</label>
          <textarea id="book-notes" name="notes" class="ask-input pub-btn-full" placeholder="Optional notes or links to relevant repos..."></textarea>
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
