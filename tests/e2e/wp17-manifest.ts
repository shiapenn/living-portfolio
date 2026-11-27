import type { Page } from '@playwright/test';

export type PageArchetype = 'form' | 'list' | 'detail' | 'review' | 'dashboard';

export type ManifestStateAction =
  | 'none'
  | 'account-recovery-codes'
  | 'account-totp-reenrol'
  | 'account-token-created'
  | 'contradictions-found'
  | 'entries-paged-middle'
  | 'entries-paged-last'
  | 'editor-media-idle'
  | 'editor-media-uploading'
  | 'editor-media-error-oversize'
  | 'editor-media-error-quota'
  | 'editor-media-error-network'
  | 'editor-media-edit'
  | 'editor-media-inserted'
  | 'public-embed-gate-loaded';

export interface ManifestEntry {
  id: string;
  route: string;
  archetype: PageArchetype;
  stateLabel: string;
  assertion: string;
  checkIds: string[];
  action?: ManifestStateAction;
  /** Whether this entry requires seeded fixture IDs. */
  fixtureKey?: 'bookingPendingId' | 'bookingConfirmedId' | 'bookingDeclinedId' | 'entryId' | 'mediaEntryId' | 'mediaEntrySlug';
  /** Optional CSS selector marker proving the state renders what it claims. */
  markerSelector?: string;
}

export interface ManifestFixtures {
  bookingPendingId: string;
  bookingConfirmedId: string;
  bookingDeclinedId: string;
  entryId: string;
  mediaEntryId: string;
  mediaEntrySlug: string;
  mediaImageId: string;
  mediaVideoId: string;
}

/**
 * Single authoritative route-and-state manifest (WP-17.14 D4).
 * Feeds:
 * - Closed-world adjacency, archetype, item, interaction, and coverage audits (K22–K27)
 * - Contact sheet harness (tests/e2e/wp17-contact-sheets.spec.ts)
 * - scripts/design-audit coverage checks
 */
export const WP17_MANIFEST: ManifestEntry[] = [
  {
    id: 'today',
    route: '/admin',
    archetype: 'dashboard',
    stateLabel: 'Today workspace',
    assertion: 'Dashboard sections of navigable Items with S3 padding and trailing chevron',
    checkIds: ['K22', 'K23', 'K24', 'K27'],
  },
  {
    id: 'entries',
    route: '/admin/entries',
    archetype: 'list',
    stateLabel: 'Entries list',
    assertion: 'List archetype with navigable Items, S1 internal rows, S3 padding',
    checkIds: ['K22', 'K23', 'K24', 'K27'],
  },
  {
    id: 'entries-paged-first',
    route: '/admin/entries?page=1',
    archetype: 'list',
    stateLabel: 'Entries list (Paged: first page)',
    assertion: 'Pager on single row, prev disabled, next enabled, regular/compact tabular summary',
    checkIds: ['K36', 'K37', 'K38', 'K39', 'K40', 'K41'],
  },
  {
    id: 'entries-paged-middle',
    route: '/admin/entries?page=2',
    archetype: 'list',
    stateLabel: 'Entries list (Paged: middle page)',
    assertion: 'Pager on single row, prev enabled, next enabled, regular/compact tabular summary',
    checkIds: ['K36', 'K37', 'K38', 'K39', 'K40', 'K41'],
  },
  {
    id: 'entries-paged-last',
    route: '/admin/entries?page=3',
    archetype: 'list',
    stateLabel: 'Entries list (Paged: last page)',
    assertion: 'Pager on single row, prev enabled, next disabled, regular/compact tabular summary',
    checkIds: ['K36', 'K37', 'K38', 'K39', 'K40', 'K41'],
  },
  {
    id: 'inbox',
    route: '/admin/inbox',
    archetype: 'list',
    stateLabel: 'Inbox list',
    assertion: 'List archetype with tabs, unclamped content titles, trailing chevron',
    checkIds: ['K22', 'K23', 'K24', 'K27'],
  },
  {
    id: 'bookings-list',
    route: '/admin/bookings',
    archetype: 'list',
    stateLabel: 'Bookings list',
    assertion: 'Merged 2-line meta, trailing chevron + whole-row hit target, S3 to ActionBar',
    checkIds: ['K22', 'K23', 'K24', 'K26', 'K27'],
  },
  {
    id: 'booking-detail-pending',
    route: '/admin/bookings/:id',
    archetype: 'detail',
    stateLabel: 'Booking detail (Pending)',
    assertion: 'Decision bar directly under header, single 6-row definition list, humanised values, History',
    checkIds: ['K22', 'K23', 'K26', 'K27'],
    fixtureKey: 'bookingPendingId',
  },
  {
    id: 'booking-detail-confirmed',
    route: '/admin/bookings/:id',
    archetype: 'detail',
    stateLabel: 'Booking detail (Confirmed)',
    assertion: 'Decision bar with Cancel directly under header, single definition list, History',
    checkIds: ['K22', 'K23', 'K26', 'K27'],
    fixtureKey: 'bookingConfirmedId',
  },
  {
    id: 'booking-detail-declined',
    route: '/admin/bookings/:id',
    archetype: 'detail',
    stateLabel: 'Booking detail (Declined)',
    assertion: 'No action bar when terminal, single definition list, History',
    checkIds: ['K22', 'K23', 'K26', 'K27'],
    fixtureKey: 'bookingDeclinedId',
  },
  {
    id: 'audit-rules',
    route: '/admin/audit?status=proposed',
    archetype: 'review',
    stateLabel: 'Audit answer rules (Proposed)',
    assertion: 'Review archetype tabs + list of rule items with S3 to ActionBar',
    checkIds: ['K22', 'K23', 'K24', 'K27'],
  },
  {
    id: 'contradictions-found',
    route: '/admin/audit?status=contradictions',
    archetype: 'review',
    stateLabel: 'Contradictions (Found)',
    assertion: 'Item header "{N}% likely conflict", action-link eyebrow, equal-date "Same time" + disabled Keep newer',
    checkIds: ['K22', 'K23', 'K24', 'K26', 'K27'],
    action: 'contradictions-found',
  },
  {
    id: 'calibration',
    route: '/admin/calibration',
    archetype: 'form',
    stateLabel: 'Calibration settings',
    assertion: 'Form archetype with S3 heading->first and S4 sibling->action group',
    checkIds: ['K22', 'K23', 'K27'],
  },
  {
    id: 'structure',
    route: '/admin/structure',
    archetype: 'form',
    stateLabel: 'Structure overview',
    assertion: 'Form archetype sections with S3 heading->first and S5 section->section',
    checkIds: ['K22', 'K23', 'K27'],
  },
  {
    id: 'status',
    route: '/admin/status',
    archetype: 'dashboard',
    stateLabel: 'System status',
    assertion: 'Dashboard sections of operational items with S3 padding',
    checkIds: ['K22', 'K23', 'K24', 'K27'],
  },
  {
    id: 'pages',
    route: '/admin/pages',
    archetype: 'list',
    stateLabel: 'Pages management',
    assertion: 'List archetype of public pages',
    checkIds: ['K22', 'K23', 'K24', 'K27'],
  },
  {
    id: 'ventures',
    route: '/admin/ventures',
    archetype: 'list',
    stateLabel: 'Ventures list',
    assertion: 'List archetype of ventures',
    checkIds: ['K22', 'K23', 'K24', 'K27'],
  },
  {
    id: 'import',
    route: '/admin/import',
    archetype: 'form',
    stateLabel: 'Import entries',
    assertion: 'Form archetype with S3 heading->first',
    checkIds: ['K22', 'K23', 'K27'],
  },
  {
    id: 'settings-index',
    route: '/admin/settings',
    archetype: 'list',
    stateLabel: 'Settings index',
    assertion: 'List archetype of navigable module items with trailing chevron',
    checkIds: ['K22', 'K23', 'K24', 'K27'],
  },
  {
    id: 'settings-account',
    route: '/admin/settings/account',
    archetype: 'form',
    stateLabel: 'Account (default + active tokens)',
    assertion: 'Security section with 3 Subsections, S3 heading->first everywhere, Active tokens List at S3',
    checkIds: ['K22', 'K23', 'K24', 'K27'],
  },
  {
    id: 'account-recovery-codes',
    route: '/admin/settings/account',
    archetype: 'form',
    stateLabel: 'Account (Recovery codes revealed)',
    assertion: 'Single-container Credential with internal warning header, borderless codes, nesting depth <= 2',
    checkIds: ['K22', 'K23', 'K26', 'K27'],
    action: 'account-recovery-codes',
  },
  {
    id: 'account-totp',
    route: '/admin/settings/account',
    archetype: 'form',
    stateLabel: 'Account (TOTP re-enrol)',
    assertion: 'Progressive reveal QR + single Credential manual key + 6-digit code field',
    checkIds: ['K22', 'K23', 'K26', 'K27'],
    action: 'account-totp-reenrol',
  },
  {
    id: 'account-token-created',
    route: '/admin/settings/account',
    archetype: 'form',
    stateLabel: 'Account (API token created)',
    assertion: 'Single-container Credential with internal warning header, Copy in footer, Active tokens S3',
    checkIds: ['K22', 'K23', 'K24', 'K26', 'K27'],
    action: 'account-token-created',
  },
  {
    id: 'settings-answering',
    route: '/admin/settings/answering',
    archetype: 'form',
    stateLabel: 'Answering settings',
    assertion: 'Form archetype with S3 heading->first and S4 sibling->ActionBar',
    checkIds: ['K22', 'K23', 'K27'],
  },
  {
    id: 'settings-appearance',
    route: '/admin/settings/appearance',
    archetype: 'form',
    stateLabel: 'Appearance settings',
    assertion: 'Form archetype with Choice cards and S3/S4 rhythm',
    checkIds: ['K22', 'K23', 'K27'],
  },
  {
    id: 'settings-backups',
    route: '/admin/settings/backups',
    archetype: 'form',
    stateLabel: 'Backups settings',
    assertion: 'Form archetype with S3 heading->first',
    checkIds: ['K22', 'K23', 'K27'],
  },
  {
    id: 'settings-visibility',
    route: '/admin/settings/visibility',
    archetype: 'form',
    stateLabel: 'Visibility settings',
    assertion: 'Form archetype with S3 heading->first',
    checkIds: ['K22', 'K23', 'K27'],
  },
  {
    id: 'gallery',
    route: '/admin/_gallery',
    archetype: 'dashboard',
    stateLabel: 'Design system gallery + State Matrix',
    assertion: 'Tonal hover/active ladder, unified unclipped focus ring, distinct disabled Choice',
    checkIds: ['K25', 'K27'],
  },
  // WP-18.4 Editor Media Dialog & Public Media States
  {
    id: 'editor-media-idle',
    route: '/admin/entries/:id',
    archetype: 'form',
    stateLabel: 'Editor media dialog (Idle)',
    assertion: 'Unified Overlay dialog with Field[file], Alt text, Decorative Choice, Caption, Insert->Cancel ActionBar',
    checkIds: ['K22', 'K27', 'K36', 'K37', 'K38', 'K39', 'K40'],
    action: 'editor-media-idle',
    fixtureKey: 'mediaEntryId',
    markerSelector: '#ref-media-dialog[data-media-state="idle"]:not([hidden])',
  },
  {
    id: 'editor-media-uploading',
    route: '/admin/entries/:id',
    archetype: 'form',
    stateLabel: 'Editor media dialog (Uploading > 1s)',
    assertion: 'aria-busy=true on primary button and Uploading StatusLine after 1s',
    checkIds: ['K22', 'K27', 'K36', 'K37', 'K38', 'K39', 'K40'],
    action: 'editor-media-uploading',
    fixtureKey: 'mediaEntryId',
    markerSelector: '#ref-media-dialog[data-media-state="uploading"] #ref-media-submit[aria-busy="true"]',
  },
  {
    id: 'editor-media-error-oversize',
    route: '/admin/entries/:id',
    archetype: 'form',
    stateLabel: 'Editor media dialog (Error: oversize)',
    assertion: 'Danger Notice S3 below ActionBar explaining file exceeds upload limit',
    checkIds: ['K22', 'K27', 'K36', 'K37', 'K38', 'K39', 'K40'],
    action: 'editor-media-error-oversize',
    fixtureKey: 'mediaEntryId',
    markerSelector: '#ref-media-error-notice:not([hidden])',
  },
  {
    id: 'editor-media-error-quota',
    route: '/admin/entries/:id',
    archetype: 'form',
    stateLabel: 'Editor media dialog (Error: quota)',
    assertion: 'Danger Notice S3 below ActionBar explaining storage quota reached',
    checkIds: ['K22', 'K27', 'K36', 'K37', 'K38', 'K39', 'K40'],
    action: 'editor-media-error-quota',
    fixtureKey: 'mediaEntryId',
    markerSelector: '#ref-media-error-notice:not([hidden])',
  },
  {
    id: 'editor-media-error-network',
    route: '/admin/entries/:id',
    archetype: 'form',
    stateLabel: 'Editor media dialog (Error: network)',
    assertion: 'Danger Notice S3 below ActionBar explaining network upload failure',
    checkIds: ['K22', 'K27', 'K36', 'K37', 'K38', 'K39', 'K40'],
    action: 'editor-media-error-network',
    fixtureKey: 'mediaEntryId',
    markerSelector: '#ref-media-error-notice:not([hidden])',
  },
  {
    id: 'editor-media-edit',
    route: '/admin/entries/:id',
    archetype: 'form',
    stateLabel: 'Editor media dialog (Edit mode)',
    assertion: 'Edit mode shows Save, Cancel, and destructive Remove text button last',
    checkIds: ['K22', 'K27', 'K36', 'K37', 'K38', 'K39', 'K40'],
    action: 'editor-media-edit',
    fixtureKey: 'mediaEntryId',
    markerSelector: '#ref-media-dialog[data-media-mode="edit"] #ref-media-remove:not(.lp-is-hidden)',
  },
  {
    id: 'editor-media-inserted',
    route: '/admin/entries/:id',
    archetype: 'form',
    stateLabel: 'Editor with inserted media blocks',
    assertion: 'Inserted image and video blocks render cleanly with Edit button and no drag handles',
    checkIds: ['K22', 'K27', 'K36', 'K37', 'K38', 'K39', 'K40'],
    action: 'editor-media-inserted',
    fixtureKey: 'mediaEntryId',
    markerSelector: '.lp-editor-media-block[data-media-node="image"]',
  },
  {
    id: 'public-entry-image',
    route: '/work/:slug',
    archetype: 'detail',
    stateLabel: 'Public entry with image (.pub-media)',
    assertion: 'Public image renders in .pub-media with stored width/height, loading=lazy, and figcaption',
    checkIds: ['K22', 'K27', 'K36', 'K37', 'K38', 'K39', 'K40'],
    fixtureKey: 'mediaEntrySlug',
    markerSelector: '.pub-media[data-pub-media="image"] img[width][height][loading="lazy"]',
  },
  {
    id: 'public-entry-video',
    route: '/work/:slug',
    archetype: 'detail',
    stateLabel: 'Public entry with uploaded video (.pub-media)',
    assertion: 'Public uploaded video renders with controls, preload=metadata, aria-label, and figcaption',
    checkIds: ['K22', 'K27', 'K36', 'K37', 'K38', 'K39', 'K40'],
    fixtureKey: 'mediaEntrySlug',
    markerSelector: '.pub-media[data-pub-media="video"] video[controls][preload="metadata"][aria-label]',
  },
  {
    id: 'public-embed-gate-unloaded',
    route: '/work/:slug',
    archetype: 'detail',
    stateLabel: 'Public embed gate (Unloaded)',
    assertion: 'Static placeholder with zero iframe/third-party requests before click',
    checkIds: ['K22', 'K27', 'K36', 'K37', 'K38', 'K39', 'K40'],
    fixtureKey: 'mediaEntrySlug',
    markerSelector: '.pub-embed-gate[data-embed-state="unloaded"] .pub-embed-load-btn',
  },
  {
    id: 'public-embed-gate-loaded',
    route: '/work/:slug',
    archetype: 'detail',
    stateLabel: 'Public embed gate (Loaded on stub host)',
    assertion: 'Clicking Load video creates iframe pointed at configured stub host',
    checkIds: ['K22', 'K27', 'K36', 'K37', 'K38', 'K39', 'K40'],
    action: 'public-embed-gate-loaded',
    fixtureKey: 'mediaEntrySlug',
    markerSelector: '.pub-embed-gate[data-embed-state="loaded"] iframe.pub-embed-frame',
  },
];

export const MANIFEST_UNIQUE_ROUTES = Array.from(new Set(WP17_MANIFEST.map((m) => m.route)));

export async function getCsrfHeaders(page: Page): Promise<Record<string, string>> {
  const csrf = await page.evaluate(() => {
    const m = document.cookie.match(/(?:^|;\s*)lp_csrf=([^;]+)/);
    return m ? decodeURIComponent(m[1]) : (sessionStorage.getItem('lp_csrf_token') || '');
  });
  return { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf };
}

export async function seedManifestFixtures(page: Page): Promise<ManifestFixtures> {
  const headers = await getCsrfHeaders(page);

  // Ensure at least one active API token exists for Account Active tokens list
  const tokRes = await page.request.get('/api/auth/tokens');
  const tokData = await tokRes.json().catch(() => ({ tokens: [] }));
  const activeTokens = (tokData.tokens || []).filter((t: any) => !t.revokedAt);
  if (activeTokens.length === 0) {
    await page.request.post('/api/auth/tokens', { headers, data: { label: 'ci-deploy-token' } });
  }

  // Seed 3 bookings (pending with snake_case facets, confirmed, declined)
  const bPend = await (
    await page.request.post('/api/book', {
      data: {
        topic: 'Distributed Locking Architecture Review',
        visitor_name: 'Maya Chen',
        visitor_contact: 'maya@acme.dev',
        facets: { scale: 'high_volume', stack: 'postgres' },
        preferred_time: '2026-12-03T10:00:00Z',
        notes: 'Comparing Redis vs Postgres advisory locks.',
      },
    })
  ).json();
  const bConf = await (
    await page.request.post('/api/book', {
      data: {
        topic: 'API Gateway Migration Strategy',
        visitor_name: 'David Park',
        visitor_contact: 'david@northstar.io',
        facets: { cloud: 'aws' },
        preferred_time: '2026-12-05T14:00:00Z',
        notes: 'Planning phased rollout.',
      },
    })
  ).json();
  const bDecl = await (
    await page.request.post('/api/book', {
      data: {
        topic: 'Frontend Framework Selection',
        visitor_name: 'Sam Patel',
        visitor_contact: 'sam@startup.co',
        preferred_time: '2026-12-06T09:00:00Z',
        notes: 'General advisory chat.',
      },
    })
  ).json();
  await page.request.patch(`/api/book/${bConf.booking.id}`, { headers, data: { status: 'confirmed' } });
  await page.request.patch(`/api/book/${bDecl.booking.id}`, { headers, data: { status: 'declined' } });

  // Ensure at least 25 entries exist so pagination has >= 3 pages (first, middle, last) for H5/K41
  const entriesRes = await page.request.get('/api/entries?visibility=all&limit=50', { headers });
  const entriesData = await entriesRes.json().catch(() => ({ entries: [] }));
  let list = entriesData.entries || [];
  if (list.length < 25) {
    const needed = 25 - list.length;
    for (let i = 0; i < needed; i++) {
      const idx = list.length + i + 1;
      await page.request.post('/api/entries', {
        headers,
        data: {
          title: `Architecture Note ${idx}`,
          slug: `architecture-note-${idx}-${Date.now()}-${i}`,
          profile: i % 3 === 0 ? 'work' : i % 3 === 1 ? 'note' : 'venture',
          visibility: 'private',
          body_md: `# Architecture Note ${idx}\n\nSeeded entry for multi-page pagination verification.`,
        },
      });
    }
    const refreshed = await (await page.request.get('/api/entries?visibility=all&limit=50', { headers })).json().catch(() => ({ entries: [] }));
    list = refreshed.entries || list;
  }
  const entryId = String(list[0]?.id || '');

  const existingConflicts = await (await page.request.get('/api/audit/topology-conflicts', { headers })).json().catch(() => ({ conflicts: [] }));
  if (!Array.isArray(existingConflicts.conflicts) || existingConflicts.conflicts.length === 0) {
    if (list.length >= 2) {
      const e1 = await (await page.request.get(`/api/entries/${encodeURIComponent(list[0].id)}`, { headers })).json();
      const e2 = await (await page.request.get(`/api/entries/${encodeURIComponent(list[1].id)}`, { headers })).json();
      const rev1Id = e1.revision?.id || e1.revisions?.[0]?.id;
      const rev2Id = e2.revision?.id || e2.revisions?.[0]?.id;
      if (rev1Id && rev2Id) {
        await page.request.post('/api/structure/claims', {
          headers,
          data: { revision_id: rev1Id, text: 'We recommend Redis locks for webhook coordination across workers.', kind: 'decision', scope: { domain: 'manifest-locks' }, status: 'accepted' },
        });
        await page.request.post('/api/structure/claims', {
          headers,
          data: { revision_id: rev2Id, text: 'We avoid Redis locks for webhook coordination due to failovers.', kind: 'decision', scope: { domain: 'manifest-locks' }, status: 'accepted' },
        });
        await page.request.post('/api/audit/topology-conflicts/detect', { headers, data: {} });
      }
    }
  }

  // WP-18.4: Seed synthetic PNG image, minimal MP4 video, and a published public entry referencing both + stub embed
  const tinyPng = Buffer.from(
    '89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000a49444154789c63000100000500010d0a2db40000000049454e44ae426082',
    'hex'
  );
  const tinyMp4 = Buffer.concat([
    Buffer.from([0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70, 0x6d, 0x70, 0x34, 0x32, 0x00, 0x00, 0x00, 0x00, 0x6d, 0x70, 0x34, 0x32, 0x69, 0x73, 0x6f, 0x6d]),
    Buffer.alloc(32),
  ]);
  const csrfOnly = { 'X-CSRF-Token': headers['X-CSRF-Token'] };
  const imgUp = await (
    await page.request.post('/api/media', {
      headers: csrfOnly,
      multipart: { file: { name: 'diagram.png', mimeType: 'image/png', buffer: tinyPng }, alt_text: 'Synthetic architecture diagram' },
    })
  ).json();
  const vidUp = await (
    await page.request.post('/api/media', {
      headers: csrfOnly,
      multipart: { file: { name: 'walkthrough.mp4', mimeType: 'video/mp4', buffer: tinyMp4 }, alt_text: 'Synthetic deployment walkthrough' },
    })
  ).json();
  const mediaImageId = String(imgUp.id || imgUp.asset?.id || '');
  const mediaVideoId = String(vidUp.id || vidUp.asset?.id || '');
  const mediaEntrySlug = 'wp18-4-media-showcase';
  const mediaBodyMd = [
    'This entry demonstrates privacy-first images, uploaded video, and consent-gated embeds.',
    '',
    `![Synthetic architecture diagram](/api/media/${mediaImageId} "Request routing topology")`,
    '',
    `:::video{src="/api/media/${mediaVideoId}" description="Synthetic deployment walkthrough" caption="Local clip"}\n:::`,
    '',
    ':::video{embed="https://stub.invalid/embed/demo" description="Consent-gated stub talk" caption="Stub host demo"}\n:::',
  ].join('\n');

  let mediaEntryId = '';
  const existingMediaEntry = list.find((e: any) => e.slug === mediaEntrySlug);
  if (existingMediaEntry) {
    mediaEntryId = String(existingMediaEntry.id);
  } else {
    const previewRes = await (
      await page.request.post('/api/entries/redaction-preview', {
        headers,
        data: { entryId: 'draft', text: mediaBodyMd },
      })
    ).json();
    const createdMediaEntry = await (
      await page.request.post('/api/entries', {
        headers,
        data: {
          title: 'Media & Embed Showcase',
          slug: mediaEntrySlug,
          profile: 'case-study',
          visibility: 'public',
          body_md: mediaBodyMd,
          redactionPreviewToken: previewRes.redactionPreviewToken,
        },
      })
    ).json();
    mediaEntryId = String(createdMediaEntry.entry?.id || entryId);
  }

  return {
    bookingPendingId: String(bPend.booking.id),
    bookingConfirmedId: String(bConf.booking.id),
    bookingDeclinedId: String(bDecl.booking.id),
    entryId,
    mediaEntryId,
    mediaEntrySlug,
    mediaImageId,
    mediaVideoId,
  };
}

export function resolveManifestUrl(entry: ManifestEntry, fixtures: ManifestFixtures): string {
  if (!entry.fixtureKey) return entry.route;
  return entry.route
    .replace(':id', encodeURIComponent(fixtures[entry.fixtureKey]))
    .replace(':slug', encodeURIComponent(fixtures[entry.fixtureKey]));
}

const SYNTHETIC_PNG_BYTES = Buffer.from(
  '89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000a49444154789c63000100000500010d0a2db40000000049454e44ae426082',
  'hex'
);

let releasePendingUpload: (() => void) | null = null;

export async function navigateToManifestEntry(
  page: Page,
  entry: ManifestEntry,
  fixtures: ManifestFixtures
): Promise<void> {
  if (releasePendingUpload) {
    releasePendingUpload();
    releasePendingUpload = null;
  }
  await page.unroute('**/api/media').catch(() => {});
  await page.unroute('https://stub.invalid/**').catch(() => {});
  const url = resolveManifestUrl(entry, fixtures);
  await page.goto(url, { waitUntil: 'networkidle' });
  if (entry.action === 'account-recovery-codes') {
    await page.click('#btn-regen-recovery');
    await page.locator('#account-recovery-output .lp-credential-cell').first().waitFor({ state: 'visible', timeout: 5000 });
  } else if (entry.action === 'account-totp-reenrol') {
    await page.click('#btn-reenrol-totp');
    await page.locator('#account-totp-manual-cred').waitFor({ state: 'visible', timeout: 5000 });
  } else if (entry.action === 'account-token-created') {
    await page.fill('#account-token-label', 'manifest-deploy-token');
    await page.click('#btn-create-token');
    await page.locator('#account-token-created').waitFor({ state: 'visible', timeout: 5000 });
  } else if (entry.action === 'contradictions-found') {
    const count = await page.locator('[data-conflict-row]').count();
    if (count === 0) {
      const btn = page.locator('#btn-detect-conflicts');
      if (await btn.isVisible()) {
        await btn.click();
        await page.waitForTimeout(800);
      }
    }
  } else if (entry.action === 'entries-paged-middle') {
    const nextBtn = page.locator('#btn-entries-next');
    if ((await nextBtn.isVisible()) && !(await nextBtn.isDisabled())) {
      const summaryBefore = await page.locator('#entries-page-summary').textContent();
      if (summaryBefore && /Page 1 of/.test(summaryBefore)) {
        await nextBtn.click();
        await page.waitForTimeout(400);
      }
    }
  } else if (entry.action === 'entries-paged-last') {
    const nextBtn = page.locator('#btn-entries-next');
    for (let hop = 0; hop < 10; hop++) {
      if (!(await nextBtn.isVisible()) || (await nextBtn.isDisabled())) break;
      await nextBtn.click();
      await page.waitForTimeout(300);
    }
  } else if (entry.action === 'editor-media-idle') {
    await page.click('#ref-fmt-image');
    await page.locator('#ref-media-dialog[data-media-state="idle"]:not([hidden])').waitFor({ state: 'visible', timeout: 5000 });
  } else if (entry.action === 'editor-media-uploading') {
    await page.route('**/api/media', async (route) => {
      if (route.request().method() === 'POST') {
        await new Promise<void>((r) => {
          const timer = setTimeout(r, 8000);
          releasePendingUpload = () => {
            clearTimeout(timer);
            r();
          };
        });
        await route.abort().catch(() => {});
      } else {
        await route.continue();
      }
    });
    await page.click('#ref-fmt-image');
    await page.setInputFiles('#ref-media-file', { name: 'slow.png', mimeType: 'image/png', buffer: SYNTHETIC_PNG_BYTES });
    await page.fill('#ref-media-alt', 'Slow upload test');
    await page.click('#ref-media-submit');
    await page.locator('#ref-media-status:not([hidden])').waitFor({ state: 'visible', timeout: 3000 });
  } else if (entry.action === 'editor-media-error-oversize') {
    await page.route('**/api/media', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({ status: 413, contentType: 'application/json', body: JSON.stringify({ code: 'FILE_TOO_LARGE', error: 'File too large' }) });
      } else await route.continue();
    });
    await page.click('#ref-fmt-image');
    await page.setInputFiles('#ref-media-file', { name: 'huge.png', mimeType: 'image/png', buffer: SYNTHETIC_PNG_BYTES });
    await page.fill('#ref-media-alt', 'Oversize test');
    await page.click('#ref-media-submit');
    await page.locator('#ref-media-error-notice:not([hidden])').waitFor({ state: 'visible', timeout: 5000 });
  } else if (entry.action === 'editor-media-error-quota') {
    await page.route('**/api/media', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({ status: 413, contentType: 'application/json', body: JSON.stringify({ code: 'STORAGE_QUOTA_EXCEEDED', error: 'Quota exceeded' }) });
      } else await route.continue();
    });
    await page.click('#ref-fmt-image');
    await page.setInputFiles('#ref-media-file', { name: 'quota.png', mimeType: 'image/png', buffer: SYNTHETIC_PNG_BYTES });
    await page.fill('#ref-media-alt', 'Quota test');
    await page.click('#ref-media-submit');
    await page.locator('#ref-media-error-notice:not([hidden])').waitFor({ state: 'visible', timeout: 5000 });
  } else if (entry.action === 'editor-media-error-network') {
    await page.route('**/api/media', async (route) => {
      if (route.request().method() === 'POST') await route.abort('failed');
      else await route.continue();
    });
    await page.click('#ref-fmt-image');
    await page.setInputFiles('#ref-media-file', { name: 'net.png', mimeType: 'image/png', buffer: SYNTHETIC_PNG_BYTES });
    await page.fill('#ref-media-alt', 'Network error test');
    await page.click('#ref-media-submit');
    await page.locator('#ref-media-error-notice:not([hidden])').waitFor({ state: 'visible', timeout: 5000 });
  } else if (entry.action === 'editor-media-edit') {
    await page.locator('.lp-editor-media-block[data-media-node="image"] [data-media-edit="true"]').first().click();
    await page.locator('#ref-media-dialog[data-media-mode="edit"]:not([hidden])').waitFor({ state: 'visible', timeout: 5000 });
  } else if (entry.action === 'editor-media-inserted') {
    await page.locator('.lp-editor-media-block[data-media-node="image"]').first().waitFor({ state: 'visible', timeout: 5000 });
  } else if (entry.action === 'public-embed-gate-loaded') {
    await page.route('https://stub.invalid/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'text/html; charset=utf-8',
        body: '<!doctype html><html><body style="margin:0;background:#111;color:#fff;display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif">Stub video player loaded</body></html>',
      });
    });
    await page.locator('.pub-embed-gate .pub-embed-load-btn').first().click();
    await page.locator('.pub-embed-gate[data-embed-state="loaded"] iframe.pub-embed-frame').first().waitFor({ state: 'visible', timeout: 5000 });
  }
  if (entry.markerSelector) {
    await page.locator(entry.markerSelector).first().waitFor({ state: 'attached', timeout: 5000 });
  }
}
