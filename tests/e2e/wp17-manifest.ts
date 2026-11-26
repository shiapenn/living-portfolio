import type { Page } from '@playwright/test';

export type PageArchetype = 'form' | 'list' | 'detail' | 'review' | 'dashboard';

export type ManifestStateAction =
  | 'none'
  | 'account-recovery-codes'
  | 'account-totp-reenrol'
  | 'account-token-created'
  | 'contradictions-found';

export interface ManifestEntry {
  id: string;
  route: string;
  archetype: PageArchetype;
  stateLabel: string;
  assertion: string;
  checkIds: string[];
  action?: ManifestStateAction;
  /** Whether this entry requires seeded fixture IDs (bookingPendingId, bookingConfirmedId, bookingDeclinedId). */
  fixtureKey?: 'bookingPendingId' | 'bookingConfirmedId' | 'bookingDeclinedId' | 'entryId';
}

export interface ManifestFixtures {
  bookingPendingId: string;
  bookingConfirmedId: string;
  bookingDeclinedId: string;
  entryId: string;
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

  // Get existing entries and seed dated contradictions so Contradictions (Found) is populated
  const entriesRes = await page.request.get('/api/entries?visibility=all&limit=5', { headers });
  const entriesData = await entriesRes.json().catch(() => ({ entries: [] }));
  const list = entriesData.entries || [];
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

  return {
    bookingPendingId: String(bPend.booking.id),
    bookingConfirmedId: String(bConf.booking.id),
    bookingDeclinedId: String(bDecl.booking.id),
    entryId,
  };
}

export function resolveManifestUrl(entry: ManifestEntry, fixtures: ManifestFixtures): string {
  if (!entry.fixtureKey) return entry.route;
  return entry.route.replace(':id', encodeURIComponent(fixtures[entry.fixtureKey]));
}

export async function navigateToManifestEntry(
  page: Page,
  entry: ManifestEntry,
  fixtures: ManifestFixtures
): Promise<void> {
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
  }
}
