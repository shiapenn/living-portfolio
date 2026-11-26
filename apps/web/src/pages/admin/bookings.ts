import { loadConfig } from '@living-portfolio/config';
import { formatAdminDate, formatAdminDateTime } from '@living-portfolio/ui-core';
import { escapeHtml } from '../../lib/html.js';
import { ADMIN_API_CLIENT_SCRIPT } from '../../lib/admin-api-client.js';
import { renderAdminShell, renderPageTemplate } from '../../layouts/admin-shell.js';
import { renderActionBar, renderFormSection, renderIcon, renderItem, renderList, renderStatusDot, renderText } from '../../primitives/index.js';
import { renderEmptyState, renderStatusLine } from '../../components/index.js';

function formatBookingSlot(preferredTime?: string | null, fallbackIso?: string | null): string {
  const raw = (preferredTime || '').trim();
  const tzMatch = /\b(UTC(?:[+-]\d{1,2})?|GMT(?:[+-]\d{1,2})?|PST|PDT|EST|EDT|CET|CEST|IST|JST|SGT|AEST)\b/i;
  const dateMatch = /\b(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)|(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)\b|\d{4}-\d{2}-\d{2})/i;
  if (raw) {
    const parsed = Date.parse(raw);
    if (!Number.isNaN(parsed) && /\d{4}-\d{2}-\d{2}/.test(raw)) {
      const d = new Date(parsed);
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const pad = (n: number) => String(n).padStart(2, '0');
      const utcStr = `${days[d.getUTCDay()]} ${d.getUTCDate()} ${months[d.getUTCMonth()]}, ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())} UTC`;
      const localStr = `${pad(d.getHours())}:${pad(d.getMinutes())} your time`;
      return `${utcStr} · ${localStr}`;
    }
    if (tzMatch.test(raw) && dateMatch.test(raw)) return raw;
    if (tzMatch.test(raw)) {
      const refDate = fallbackIso ? formatAdminDate(fallbackIso) : 'Next available';
      return `${refDate}, ${raw}`;
    }
    return `${raw} (UTC · your local time)`;
  }
  const refDate = fallbackIso ? formatAdminDate(fallbackIso) : 'Date not specified';
  return `${refDate}, time flexible (UTC)`;
}

function bookingStatusMeta(statusRaw: string): { label: string; tone: 'ok' | 'warn' | 'neutral' } {
  const status = String(statusRaw || 'pending');
  if (status === 'confirmed') return { label: 'Confirmed', tone: 'ok' };
  if (status === 'declined') return { label: 'Declined', tone: 'neutral' };
  if (status === 'cancelled') return { label: 'Cancelled', tone: 'neutral' };
  return { label: 'Pending', tone: 'warn' };
}

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
          const detailHref = `/admin/bookings/${encodeURIComponent(id)}`;
          const status = String(b.status || 'pending');
          const { label: statusLabel, tone: statusTone } = bookingStatusMeta(status);
          const rawCreated = b.created_at || b.at || new Date().toISOString();
          const slotText = formatBookingSlot(b.preferred_time, rawCreated);
          const requesterName = String(b.visitor_name || 'Anonymous requester');
          const receivedShort = formatAdminDate(rawCreated).replace(/\s+\d{4}$/, '');
          const receivedText = `Received ${receivedShort}`;
          const detailRowsHtml = `<div class="lp-stack lp-gap-tight">
            <div class="lp-item-meta"><span class="lp-item-meta-field lp-item-meta-strong" data-booking-slot="true">${escapeHtml(slotText)}</span></div>
            <div class="lp-item-meta"><span class="lp-item-meta-field" data-booking-requester="true">${escapeHtml(requesterName)}</span></div>
            <div class="lp-item-meta"><span class="lp-item-meta-field" data-booking-received="true">${escapeHtml(receivedText)}</span></div>
          </div>`;
          const actions = status === 'pending'
            ? {
                level: 'item' as const,
                secondary: { label: 'Confirm', variant: 'secondary' as const, size: 'sm' as const, dataAttrs: { 'booking-id': id, 'booking-status': 'confirmed' } },
                textAction: { label: 'Decline', variant: 'text' as const, size: 'sm' as const, dataAttrs: { 'booking-id': id, 'booking-status': 'declined' } },
              }
            : status === 'confirmed'
              ? {
                  level: 'item' as const,
                  secondary: { label: 'Cancel', variant: 'secondary' as const, size: 'sm' as const, dataAttrs: { 'booking-id': id, 'booking-status': 'cancelled' } },
                }
              : undefined;
          const statusHtml = `<div class="lp-item-status">${renderStatusDot({ label: statusLabel, tone: statusTone })}<a href="${escapeHtml(detailHref)}" class="lp-item-chevron" aria-label="View booking details">${renderIcon('chevron-right', 16)}</a></div>`;
          const actionsHtml = actions ? `<div data-rel="actions" class="lp-item-actions">${renderActionBar(actions)}</div>` : '';
          return `<div data-c="Item" data-rel="item" class="lp-item${actions ? ' lp-item-has-actions' : ''}" data-booking-row="${escapeHtml(id)}">
            <div class="lp-item-content">
              <div data-rel="title" class="lp-item-title"><a href="${escapeHtml(detailHref)}" class="lp-item-title-link">${escapeHtml(String(b.topic || 'Consultation request'))}</a></div>
              ${statusHtml}
              <div data-rel="itembody" class="lp-item-segments">${detailRowsHtml}</div>
            </div>
            ${actionsHtml}
          </div>`;
        }).join(''),
      })
    : renderEmptyState({
        id: 'bookings-empty',
        body: 'No booking requests yet.',
      });

  const bodyHtml = `
    <div class="lp-stack lp-gap-section">
      ${renderStatusLine({ id: 'bookings-status-line' })}
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
            if (statusEl) { statusEl.textContent = 'Booking updated.'; statusEl.className = 'lp-status-line lp-status-line-ok'; }
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
    description: 'Confirm or decline consultation requests.',
    bodyHtml,
  });

  return renderAdminShell('Bookings', '/admin/bookings', content, {
    siteName: options.siteName ?? cfg.PUBLIC_SITE_NAME,
    answeringEnabled: options.answeringEnabled,
    nonce: options.nonce,
  });
}

export async function renderAdminBookingDetailPage(
  clientOrRepo: any,
  bookingId: string,
  options: { siteName?: string; answeringEnabled?: boolean; nonce?: string } = {}
): Promise<string | null> {
  const cfg = loadConfig();
  let booking: any = null;
  try {
    if (clientOrRepo?.getBooking) {
      booking = await clientOrRepo.getBooking(bookingId);
    } else if (clientOrRepo?.getBookings) {
      const all = (await clientOrRepo.getBookings()) ?? [];
      booking = all.find((b: any) => String(b.id) === String(bookingId)) ?? null;
    }
  } catch { booking = null; }
  if (!booking) return null;

  const id = String(booking.id);
  const topic = String(booking.topic || 'Consultation request');
  const status = String(booking.status || 'pending');
  const { label: statusLabel, tone: statusTone } = bookingStatusMeta(status);
  const rawCreated = booking.created_at || booking.at || new Date().toISOString();
  const slotText = formatBookingSlot(booking.preferred_time, rawCreated);
  const requesterName = String(booking.visitor_name || 'Anonymous requester');
  const contact = String(booking.visitor_contact || '');
  const isEmail = contact.includes('@') && !contact.startsWith('@');
  const mailtoHref = isEmail
    ? `mailto:${encodeURIComponent(contact)}?subject=${encodeURIComponent(`Re: ${topic}`)}`
    : `mailto:?subject=${encodeURIComponent(`Re: ${topic}`)}`;
  const receivedText = formatAdminDateTime(rawCreated);
  const facetsObj = booking.facets && typeof booking.facets === 'object' ? booking.facets : {};
  const facetEntries = Object.entries(facetsObj).filter(([, v]) => String(v || '').trim().length > 0);
  const facetsText = facetEntries.length > 0
    ? facetEntries.map(([k, v]) => `${k}: ${String(v)}`).join(' · ')
    : 'None provided';
  const notesText = booking.notes ? String(booking.notes) : 'None provided';
  const history: Array<{ status: string; at: string }> = Array.isArray(booking.status_history) && booking.status_history.length > 0
    ? booking.status_history
    : [{ status, at: String(booking.created_at || new Date().toISOString()) }];

  const detailsListHtml = renderList({
    id: 'booking-detail-fields',
    variant: 'plain',
    itemsHtml: [
      renderItem({ title: 'Status', statusLabel, statusTone }),
      renderItem({ title: 'Requested slot', body: slotText, attributes: 'data-booking-detail-slot="true"' }),
      renderItem({ title: 'Requester', body: requesterName, attributes: 'data-booking-detail-requester="true"' }),
      `<div data-c="Item" data-rel="item" class="lp-item" data-booking-detail-email="true">
        <div data-rel="title" class="lp-item-title"><span>Contact</span></div>
        <div data-rel="itembody" class="lp-item-body">${isEmail ? `<a href="${escapeHtml(mailtoHref)}" class="lp-item-link">${escapeHtml(contact)}</a>` : escapeHtml(contact || 'Not provided')}</div>
      </div>`,
      renderItem({ title: 'Context facets', body: facetsText, attributes: 'data-booking-detail-facets="true"' }),
      renderItem({ title: 'Background notes', body: notesText, attributes: 'data-booking-detail-notes="true"' }),
      renderItem({ title: 'Received', body: receivedText, attributes: 'data-booking-detail-received="true"' }),
    ].join(''),
  });

  const historyHtml = renderList({
    id: 'booking-status-history',
    variant: 'plain',
    itemsHtml: history.map((h) => {
      const hm = bookingStatusMeta(h.status);
      return renderItem({
        title: hm.label,
        meta: h.at ? formatAdminDateTime(h.at) : '',
      });
    }).join(''),
  });

  const emailLinkHtml = `<a id="btn-booking-email" href="${escapeHtml(mailtoHref)}" class="lp-btn lp-btn-text lp-btn-sm">Email requester</a>`;
  const actionBar = status === 'pending'
    ? `<div class="lp-stack lp-gap-tight">${renderActionBar({
        level: 'item',
        secondary: { id: 'btn-booking-confirm', label: 'Confirm', variant: 'secondary', size: 'sm', type: 'button', dataAttrs: { 'booking-id': id, 'booking-status': 'confirmed' } },
        textAction: { id: 'btn-booking-decline', label: 'Decline', variant: 'text', size: 'sm', type: 'button', dataAttrs: { 'booking-id': id, 'booking-status': 'declined' } },
      })}<div>${emailLinkHtml}</div></div>`
    : status === 'confirmed'
      ? renderActionBar({
          level: 'item',
          secondary: { id: 'btn-booking-cancel', label: 'Cancel', variant: 'secondary', size: 'sm', type: 'button', dataAttrs: { 'booking-id': id, 'booking-status': 'cancelled' } },
          textAction: { id: 'btn-booking-email', label: 'Email requester', variant: 'text', size: 'sm', href: mailtoHref },
        })
      : renderActionBar({
          level: 'item',
          textAction: { id: 'btn-booking-email', label: 'Email requester', variant: 'text', size: 'sm', href: mailtoHref },
        });

  const bodyHtml = `
    <div id="booking-detail-page" data-booking-detail-id="${escapeHtml(id)}" data-booking-status="${escapeHtml(status)}" class="lp-stack lp-gap-section">
      ${renderFormSection({
        id: 'booking-detail-section',
        title: 'Request details',
        fieldsHtml: detailsListHtml,
        actionBarHtml: actionBar,
        feedbackHtml: `
          ${renderText({ id: 'booking-visitor-helper', variant: 'caption', className: 'lp-field-help', text: 'Confirming or declining updates status here only. No email is sent automatically.' })}
          <div id="booking-detail-feedback" class="lp-is-hidden" aria-live="polite" tabindex="-1"></div>
        `,
      })}
      ${renderFormSection({
        id: 'booking-history-section',
        title: 'Status history',
        fieldsHtml: historyHtml,
      })}
    </div>
    <script${options.nonce ? ` nonce="${escapeHtml(options.nonce)}"` : ''}>
      ${ADMIN_API_CLIENT_SCRIPT}
      (function () {
        var root = document.getElementById('booking-detail-page');
        var fb = document.getElementById('booking-detail-feedback');
        if (!root) return;
        root.addEventListener('click', async function (e) {
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
            if (fb) { fb.className = 'lp-status-line lp-status-line-ok'; fb.textContent = 'Status updated.'; }
            window.location.reload();
          } else {
            if (fb) { fb.className = 'lp-notice lp-notice-danger'; fb.textContent = 'Could not update booking status.'; }
            btn.disabled = false;
          }
        });
      })();
    </script>`;

  const content = renderPageTemplate({
    backHref: '/admin/bookings',
    title: topic,
    bodyHtml,
  });

  return renderAdminShell(topic, '/admin/bookings', content, {
    siteName: options.siteName ?? cfg.PUBLIC_SITE_NAME,
    answeringEnabled: options.answeringEnabled,
    nonce: options.nonce,
  });
}
