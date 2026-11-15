import { escapeHtml } from '../../lib/html.js';
import { renderAdminShell } from '../../layouts/admin-shell.js';

export interface AdminSectionDescriptor {
  title: string;
  purpose: string;
  actionLabel: string;
  actionHref: string;
}

const SECTION_DESCRIPTORS: Record<string, AdminSectionDescriptor> = {
  '/admin/entries': {
    title: 'Entries',
    purpose: 'Find, filter, and triage your writing across drafts, unlisted, and public entries.',
    actionLabel: 'New entry',
    actionHref: '/admin/entries/new',
  },
  '/admin/quick-log': {
    title: 'Quick Log',
    purpose: 'Capture a four-field note quickly while decisions and outcomes are fresh.',
    actionLabel: 'Open full editor',
    actionHref: '/admin/entries/new',
  },
  '/admin/pages': {
    title: 'Pages',
    purpose: 'Edit your About sections and Home statement with revision history.',
    actionLabel: 'View public home',
    actionHref: '/home',
  },
  '/admin/inbox': {
    title: 'Inbox',
    purpose: 'Review visitor questions, approve or decline replies, and promote answer rules.',
    actionLabel: 'Open workspace',
    actionHref: '/admin',
  },
  '/admin/bookings': {
    title: 'Bookings',
    purpose: 'Review and manage visitor conversation requests.',
    actionLabel: 'Open Inbox',
    actionHref: '/admin/inbox',
  },
  '/admin/audit': {
    title: 'Audit',
    purpose: 'Review contradictions, answer rules, and stale claims across your records.',
    actionLabel: 'Open Structure',
    actionHref: '/admin/structure',
  },
  '/admin/calibration': {
    title: 'Calibration',
    purpose: 'Inspect self-calibration proposals, sample gates, and rollback history.',
    actionLabel: 'Open Answering',
    actionHref: '/admin/routing',
  },
  '/admin/structure': {
    title: 'Structure',
    purpose: 'Manage role profiles, facet vocabulary, and hard constraints.',
    actionLabel: 'Open Audit',
    actionHref: '/admin/audit',
  },
  '/admin/routing': {
    title: 'Answering',
    purpose: 'Configure confidence thresholds, automatic answers, and fallback behaviour.',
    actionLabel: 'Open Settings',
    actionHref: '/admin/settings',
  },
  '/admin/theme': {
    title: 'Theme',
    purpose: 'Customise colour tokens, shape presets, and preview contrast.',
    actionLabel: 'Open Settings',
    actionHref: '/admin/settings',
  },
};

export function renderAdminSectionPage(
  routePath: string,
  options: { titleOverride?: string; purposeOverride?: string; nonce?: string } = {}
): string {
  const baseKey = routePath.startsWith('/admin/inbox/')
    ? '/admin/inbox'
    : routePath.startsWith('/admin/settings/')
    ? '/admin/settings'
    : routePath === '/quick-log'
    ? '/admin/quick-log'
    : routePath;

  const desc = SECTION_DESCRIPTORS[baseKey] ?? {
    title: options.titleOverride ?? 'Settings',
    purpose: options.purposeOverride ?? 'Configure this workspace area.',
    actionLabel: 'All settings',
    actionHref: '/admin/settings',
  };

  const title = options.titleOverride ?? desc.title;
  const purpose = options.purposeOverride ?? desc.purpose;

  const content = `<section class="lp-admin-section-card">
  <h1 class="lp-type-title">${escapeHtml(title)}</h1>
  <p class="lp-field-help">${escapeHtml(purpose)}</p>
  <div class="lp-admin-section-actions">
    <a href="${escapeHtml(desc.actionHref)}" class="lp-btn lp-btn-primary lp-btn-sm">${escapeHtml(desc.actionLabel)}</a>
  </div>
</section>`;

  return renderAdminShell(title, routePath, content, { nonce: options.nonce });
}
