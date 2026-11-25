import { loadConfig } from '@living-portfolio/config';
import { escapeHtml } from '../../lib/html.js';
import { ADMIN_API_CLIENT_SCRIPT } from '../../lib/admin-api-client.js';
import { renderAdminShell, renderPageTemplate } from '../../layouts/admin-shell.js';
import { renderFormSection, renderItem, renderList, renderText } from '../../primitives/index.js';
import { renderEmptyState, renderStatusLine } from '../../components/index.js';

export async function renderAdminBookingsPage(
  clientOrRepo: any,
  options: { siteName?: string; answeringEnabled?: boolean; nonce?: string } = {}
): Promise<string> {
  const cfg = loadConfig();
  let bookings: any[] = [];
  try {
    if (clientOrRepo?.getBookings) {
      bookings = (await clientOrRepo.getBookings()) ?? [];
    }
  } catch { bookings = []; }

  const listHtml = bookings.length > 0
    ? renderList({
        id: 'bookings-list',
        variant: 'plain',
        itemsHtml: bookings.slice().reverse().map((b) => {
          const id = String(b.id);
          const status = String(b.status || 'pending');
          const statusLabel = status === 'confirmed' ? 'Active' : status === 'declined' ? 'Ignored' : 'Pending';
          const statusTone = status === 'confirmed' ? 'ok' : status === 'declined' ? 'neutral' : 'warn';
          const who = [b.visitor_name, b.visitor_contact].filter(Boolean).join(' · ');
          const metaParts = [who, b.preferred_time ? `Preferred: ${b.preferred_time}` : ''].filter(Boolean);
          return renderItem({
            title: String(b.topic || 'Consultation request'),
            subtitle: metaParts.join(' · ') || 'Visitor request',
            body: b.notes ? String(b.notes) : undefined,
            statusLabel,
            statusTone,
            actions: status === 'pending'
              ? {
                  level: 'item',
                  secondary: { label: 'Confirm', variant: 'secondary', size: 'sm', dataAttrs: { 'booking-id': id, 'booking-status': 'confirmed' } },
                  textAction: { label: 'Decline', variant: 'text', size: 'sm', dataAttrs: { 'booking-id': id, 'booking-status': 'declined' } },
                }
              : undefined,
            attributes: `data-booking-row="${escapeHtml(id)}"`,
          });
        }).join(''),
      })
    : renderEmptyState({
        id: 'bookings-empty',
        headingTag: 'h2',
        title: 'No booking requests yet',
        body: 'Consultation requests submitted from your public Book page will appear here.',
      });

  const bodyHtml = `
    <div class="lp-stack lp-gap-section">
      ${renderStatusLine({ id: 'bookings-status-line' })}

      ${renderFormSection({
        id: 'bookings-explain-section',
        title: 'How bookings work',
        fieldsHtml: renderText({
          variant: 'description',
          text: 'What it does: Lists consultation requests from /book so you can confirm or decline them in one place.',
        }),
      })}

      ${renderFormSection({
        id: 'bookings-requests-section',
        title: 'Requests',
        fieldsHtml: listHtml,
      })}
    </div>
    <script${options.nonce ? ` nonce="${escapeHtml(options.nonce)}"` : ''}>
      ${ADMIN_API_CLIENT_SCRIPT}
      (function () {
        var list = document.getElementById('bookings-list');
        var statusEl = document.getElementById('bookings-status-line');
        if (!list) return;
        list.addEventListener('click', async function (e) {
          var btn = e.target && e.target.closest ? e.target.closest('button[data-booking-status]') : null;
          if (!btn) return;
          var id = btn.getAttribute('data-booking-id');
          var nextStatus = btn.getAttribute('data-booking-status');
          btn.disabled = true;
          var res = await apiClient('/api/book/' + encodeURIComponent(id), {
            method: 'PATCH',
            body: JSON.stringify({ status: nextStatus }),
          });
          if (res && res.ok) {
            if (statusEl) statusEl.textContent = 'Booking updated.';
            window.location.reload();
          } else {
            if (statusEl) statusEl.textContent = 'Could not update booking.';
            btn.disabled = false;
          }
        });
      })();
    </script>`;

  const content = renderPageTemplate({
    title: 'Bookings',
    description: 'Review and respond to public consultation requests.',
    bodyHtml,
  });

  return renderAdminShell('Bookings', '/admin/bookings', content, {
    siteName: options.siteName ?? cfg.PUBLIC_SITE_NAME,
    answeringEnabled: options.answeringEnabled,
    nonce: options.nonce,
  });
}
