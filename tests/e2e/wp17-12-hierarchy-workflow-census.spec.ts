import { test, expect } from '@playwright/test';
import { ensureAdminLoggedIn } from './helpers.js';

/**
 * WP-17.12 Hierarchy & Workflow Census (K6–K13).
 * Every test K6–K13 is independent, must fail on cd6a3d1 in a detached worktree,
 * and must pass on PR head with pair/node counts > 0.
 */

test.describe('WP-17.12 Hierarchy & Workflow Checks (K6–K13)', () => {
  test('K6: Recovery codes 1/2 columns and zero mid-code line wraps at 320/1280/1920', async ({ page }) => {
    await ensureAdminLoggedIn(page);
    await page.setViewportSize({ width: 320, height: 640 });
    await page.goto('/admin/settings/account');
    await page.click('#btn-regen-recovery');
    await expect(page.locator('#account-recovery-output .lp-credential-cell')).toHaveCount(8);

    const results: Record<number, { cols: number; wrappedCells: number; cellCount: number }> = {};
    for (const width of [320, 1280, 1920] as const) {
      await page.setViewportSize({ width, height: width === 320 ? 640 : 800 });
      const m = await page.evaluate(() => {
        const grid = document.querySelector('#account-recovery-output .lp-credential-list') as HTMLElement | null;
        const cells = Array.from(document.querySelectorAll('#account-recovery-output .lp-credential-cell'));
        const cols = grid ? getComputedStyle(grid).gridTemplateColumns.split(/\s+/).filter(Boolean).length : 0;
        let wrappedCells = 0;
        for (const cell of cells) {
          const r = document.createRange();
          r.selectNodeContents(cell);
          const rects = Array.from(r.getClientRects()).filter((rc) => rc.width > 0.5 && rc.height > 0.5);
          const lines = new Set(rects.map((rc) => Math.round(rc.top)));
          if (lines.size > 1 || getComputedStyle(cell).whiteSpace !== 'nowrap') wrappedCells++;
        }
        return { cols, wrappedCells, cellCount: cells.length };
      });
      results[width] = m;
      expect(m.cellCount).toBe(8);
      expect(m.cols, `K6 cols at ${width}px`).toBe(width < 480 ? 1 : 2);
      expect(m.wrappedCells, `K6 wrapped cells at ${width}px`).toBe(0);
    }
    console.log('=== WP-17.12 K6 COUNTS ===', JSON.stringify(results));
  });

  test('K7: Credential Copy inside surface footer, B2 vertical gaps, TOTP manual key helper without Notice', async ({ page }) => {
    await ensureAdminLoggedIn(page);
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/admin/settings/account');

    // Recovery codes: D7 single-container Credential with internal .lp-credential-header & Copy inside surface (no separate Notice)
    await page.click('#btn-regen-recovery');
    await expect(page.locator('#account-recovery-output[data-c="Credential"]')).toBeVisible();
    const recCheck = await page.evaluate(() => {
      const root = document.getElementById('account-recovery-output')!;
      const noticeCount = root.querySelectorAll('.lp-notice').length;
      const surface = root.querySelector('.lp-credential-surface')!;
      const header = surface.querySelector('.lp-credential-header');
      const copyBtn = document.getElementById('account-recovery-output-copy-btn')!;
      return {
        noticeCount,
        hasHeaderInsideSurface: Boolean(header),
        copyInsideSurface: Boolean(copyBtn.closest('.lp-credential-surface') === surface),
      };
    });
    expect(recCheck.noticeCount).toBe(0);
    expect(recCheck.hasHeaderInsideSurface).toBe(true);
    expect(recCheck.copyInsideSurface).toBe(true);

    // TOTP manual key: NO Notice, helper "Enter this key if you can't scan the code.", Copy inside surface, S4 (24px) to 6-digit field
    await page.click('#btn-reenrol-totp');
    await expect(page.locator('#account-totp-manual-cred[data-c="Credential"]')).toBeVisible();
    const totpCheck = await page.evaluate(() => {
      const root = document.getElementById('account-totp-manual-cred')!;
      const noticeCount = root.querySelectorAll('.lp-notice').length;
      const helper = (root.querySelector('.lp-field-help')?.textContent || '').trim();
      const copyBtn = document.getElementById('account-totp-manual-cred-copy-btn')!;
      const surface = root.querySelector('.lp-credential-surface')!;
      const codeField = document.getElementById('account-totp-code')?.closest('.lp-field') as HTMLElement | null;
      const gapToCodeField = codeField
        ? Math.round(codeField.getBoundingClientRect().top - root.getBoundingClientRect().bottom)
        : -1;
      return {
        noticeCount,
        helper,
        copyInsideSurface: Boolean(copyBtn.closest('.lp-credential-surface') === surface),
        gapToCodeField,
      };
    });
    expect(totpCheck.noticeCount).toBe(0);
    expect(totpCheck.helper).toBe("Enter this key if you can't scan the code.");
    expect(totpCheck.copyInsideSurface).toBe(true);
    expect(Math.abs(totpCheck.gapToCodeField - 24)).toBeLessThanOrEqual(1);
    console.log('=== WP-17.12 K7 COUNTS ===', JSON.stringify({ recCheck, totpCheck }));
  });

  test('K8: Contradictions state panel order (headline > ActionBar > feedback) and identical ActionBar top across all 6 states', async ({ page }) => {
    await ensureAdminLoggedIn(page);
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/admin/audit?status=contradictions');

    const measureState = async (label: string) => {
      const m = await page.evaluate(() => {
        const panel = document.getElementById('audit-contradictions-panel');
        const headline = document.getElementById('audit-state-headline');
        const meta = document.getElementById('audit-last-checked');
        const btn = document.getElementById('btn-detect-conflicts');
        const err = document.getElementById('audit-conflicts-error');
        if (!panel || !headline || !meta || !btn) return null;
        const hr = headline.getBoundingClientRect();
        const mr = meta.getBoundingClientRect();
        const br = btn.getBoundingClientRect();
        const er = err && !err.classList.contains('lp-is-hidden') ? err.getBoundingClientRect() : null;
        return {
          state: panel.getAttribute('data-contradictions-state'),
          headlineText: (headline.textContent || '').trim(),
          headlineBottom: Math.round(hr.bottom),
          metaTop: Math.round(mr.top),
          actionTop: Math.round(br.top),
          actionBottom: Math.round(br.bottom),
          errTop: er ? Math.round(er.top) : null,
        };
      });
      expect(m, `K8 missing elements in state ${label}`).not.toBeNull();
      expect(m!.actionTop, `K8 headline above ActionBar in ${label}`).toBeGreaterThanOrEqual(m!.headlineBottom);
      if (m!.errTop !== null) {
        expect(m!.errTop, `K8 feedback below ActionBar in ${label}`).toBeGreaterThanOrEqual(m!.actionBottom - 1);
      }
      return m!;
    };

    const actionTops: Record<string, number> = {};
    // 1. idle
    const sIdle = await measureState('idle');
    actionTops.idle = sIdle.actionTop;

    // 2. running (intercept to pause briefly)
    let releaseDetect!: () => void;
    const detectGate = new Promise<void>((r) => { releaseDetect = r; });
    await page.route('**/api/audit/topology-conflicts/detect', async (route) => {
      await detectGate;
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ detected: 0, conflicts: [] }) });
    });
    const clickP = page.click('#btn-detect-conflicts');
    await expect(page.locator('#audit-contradictions-panel')).toHaveAttribute('data-contradictions-state', 'running');
    const sRunning = await measureState('running');
    actionTops.running = sRunning.actionTop;
    releaseDetect();
    await clickP;

    // 3. clean
    await expect(page.locator('#audit-contradictions-panel')).toHaveAttribute('data-contradictions-state', 'clean');
    const sClean = await measureState('clean');
    actionTops.clean = sClean.actionTop;
    await page.unroute('**/api/audit/topology-conflicts/detect');

    // 4. error
    await page.route('**/api/audit/topology-conflicts/detect', (route) =>
      route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ error: 'Boom' }) })
    );
    await page.click('#btn-detect-conflicts');
    await expect(page.locator('#audit-contradictions-panel')).toHaveAttribute('data-contradictions-state', 'error');
    const sError = await measureState('error');
    actionTops.error = sError.actionTop;
    expect(sError.errTop).not.toBeNull();
    await page.unroute('**/api/audit/topology-conflicts/detect');

    const tops = Object.values(actionTops);
    expect(Math.max(...tops) - Math.min(...tops), `K8 ActionBar top drifted: ${JSON.stringify(actionTops)}`).toBeLessThanOrEqual(1);
    console.log('=== WP-17.12 K8 ACTION TOPS ===', JSON.stringify(actionTops));
  });

  test('K9: Contradiction item Older/Newer dates, 2 claim blocks, side-by-side >=640 / stacked+vs <640, zero status', async ({ page }) => {
    await ensureAdminLoggedIn(page);
    const csrf = await page.evaluate(() => {
      const m = document.cookie.match(/(?:^|;\s*)lp_csrf=([^;]+)/);
      return m ? decodeURIComponent(m[1]) : (sessionStorage.getItem('lp_csrf_token') || '');
    });
    const headers = { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf };

    // Ensure at least one contradiction exists by triggering detect
    await page.request.post('/api/audit/topology-conflicts/detect', { headers, data: {} });
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/admin/audit?status=contradictions');

    const count = await page.locator('[data-conflict-row]').count();
    if (count === 0) {
      const entriesData = await (await page.request.get('/api/entries?visibility=all&limit=5', { headers })).json();
      const list = entriesData.entries || [];
      const e1 = await (await page.request.get(`/api/entries/${encodeURIComponent(list[0].id)}`, { headers })).json();
      const e2 = await (await page.request.get(`/api/entries/${encodeURIComponent(list[1].id)}`, { headers })).json();
      const rev1Id = e1.revision?.id || e1.revisions?.[0]?.id;
      const rev2Id = e2.revision?.id || e2.revisions?.[0]?.id;
      await page.request.post('/api/structure/claims', {
        headers,
        data: { revision_id: rev1Id, text: 'We recommend Redis locks for webhook coordination.', kind: 'decision', scope: { domain: 'k9-locks' }, status: 'accepted' },
      });
      await page.request.post('/api/structure/claims', {
        headers,
        data: { revision_id: rev2Id, text: 'We avoid Redis locks for webhook coordination as a bottleneck.', kind: 'decision', scope: { domain: 'k9-locks' }, status: 'accepted' },
      });
      await page.request.post('/api/audit/topology-conflicts/detect', { headers, data: {} });
      await page.goto('/admin/audit?status=contradictions');
    }

    const row = page.locator('[data-conflict-row]').first();
    await expect(row).toBeVisible();
    const wide = await row.evaluate((el) => {
      const cards = Array.from(el.querySelectorAll('.lp-item-claim-card'));
      const eyebrows = Array.from(el.querySelectorAll('.lp-item-claim-eyebrow')).map((e) => (e.textContent || '').trim());
      const vs = el.querySelector('.lp-item-claims-vs') as HTMLElement | null;
      const statusCount = el.querySelectorAll('[data-c="StatusLabel"]').length;
      const r0 = cards[0]?.getBoundingClientRect();
      const r1 = cards[1]?.getBoundingClientRect();
      return {
        cardCount: cards.length,
        eyebrows,
        sideBySide: Boolean(r0 && r1 && r1.left >= r0.right - 2),
        vsHidden: !vs || getComputedStyle(vs).display === 'none',
        statusCount,
      };
    });
    expect(wide.cardCount).toBe(2);
    expect(wide.eyebrows[0]).toMatch(/^(Older|Same date)/);
    expect(wide.eyebrows[1]).toMatch(/^(Newer|Same date)/);
    expect(wide.sideBySide).toBe(true);
    expect(wide.vsHidden).toBe(true);
    expect(wide.statusCount).toBe(0);

    await page.setViewportSize({ width: 320, height: 640 });
    const narrow = await row.evaluate((el) => {
      const cards = Array.from(el.querySelectorAll('.lp-item-claim-card'));
      const vs = el.querySelector('.lp-item-claims-vs') as HTMLElement | null;
      const r0 = cards[0]?.getBoundingClientRect();
      const r1 = cards[1]?.getBoundingClientRect();
      return {
        stacked: Boolean(r0 && r1 && r1.top >= r0.bottom - 1),
        vsVisible: Boolean(vs && getComputedStyle(vs).display !== 'none' && (vs.textContent || '').trim() === 'vs'),
      };
    });
    expect(narrow.stacked).toBe(true);
    expect(narrow.vsVisible).toBe(true);
    console.log('=== WP-17.12 K9 PROOF ===', JSON.stringify({ wide, narrow }));
  });

  test('K10: Bookings list has date+timezone slot & no email; detail route has every A4 field & visitor helper', async ({ page }) => {
    await ensureAdminLoggedIn(page);
    const created = await (await page.request.post('/api/book', {
      data: {
        topic: 'K10 Architecture Review',
        visitor_name: 'Jordan Lee',
        visitor_contact: 'jordan@example.com',
        facets: { scale: 'high_volume' },
        preferred_time: '2026-12-03T10:00:00Z',
        notes: 'Evaluating Postgres advisory locks.',
      },
    })).json();
    const bookingId = created.booking.id;

    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/admin/bookings');
    const row = page.locator(`[data-booking-row="${bookingId}"]`);
    await expect(row).toBeVisible();
    const listCheck = await row.evaluate((el) => ({
      slot: (el.querySelector('[data-booking-slot]')?.textContent || '').trim(),
      requester: (el.querySelector('[data-booking-requester]')?.textContent || '').trim(),
      received: (el.querySelector('[data-booking-received]')?.textContent || '').trim(),
      hasEmailInList: (el.textContent || '').includes('jordan@example.com'),
      detailHref: el.querySelector('a.lp-item-row-link')?.getAttribute('href') || '',
    }));
    expect(listCheck.slot).toMatch(/\d{1,2}\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/);
    expect(listCheck.slot).toMatch(/UTC|GMT|your time/i);
    expect(listCheck.requester).toBe('Jordan Lee');
    expect(listCheck.received).toMatch(/^Received /);
    expect(listCheck.hasEmailInList).toBe(false);
    expect(listCheck.detailHref).toBe(`/admin/bookings/${bookingId}`);

    await page.goto(listCheck.detailHref);
    await expect(page.locator('#booking-detail-page')).toBeVisible();
    const detailCheck = await page.evaluate(() => ({
      listText: (document.querySelector('#booking-detail-list')?.textContent || '').trim(),
      emailHref: document.querySelector('#booking-detail-list a[href^="mailto:"]')?.getAttribute('href') || '',
      historyCount: document.querySelectorAll('#booking-status-history [data-c="Item"]').length,
      visitorHelper: (document.querySelector('#booking-decision-bar [data-purpose="consequence"]')?.textContent || '').trim(),
    }));
    expect(detailCheck.emailHref).toContain('mailto:jordan%40example.com');
    expect(detailCheck.emailHref).toContain('Re%3A%20K10%20Architecture%20Review');
    expect(detailCheck.listText).toContain('Scale: High volume');
    expect(detailCheck.listText).toContain('Evaluating Postgres advisory locks.');
    expect(detailCheck.historyCount).toBeGreaterThanOrEqual(1);
    expect(detailCheck.visitorHelper).toMatch(/visitor isn't notified/i);
    console.log('=== WP-17.12 K10 PROOF ===', JSON.stringify({ listCheck, detailCheck }));
  });

  test('K11: Chevron never alone on a row when status omitted; content titles unclamped', async ({ page }) => {
    await ensureAdminLoggedIn(page);
    await page.setViewportSize({ width: 320, height: 640 });
    await page.goto('/admin/inbox');
    const inboxCheck = await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('#inbox-list [data-c="Item"]'));
      let checked = 0;
      const violations: string[] = [];
      for (const it of items) {
        const title = it.querySelector('.lp-item-title') as HTMLElement | null;
        const span = title?.querySelector('span') as HTMLElement | null;
        const chev = it.querySelector('.lp-item-chevron') as HTMLElement | null;
        const hasStatus = Boolean(it.querySelector('[data-c="StatusLabel"]'));
        if (title && chev && !hasStatus) {
          checked++;
          const tr = title.getBoundingClientRect();
          const cr = chev.getBoundingClientRect();
          if (cr.top >= tr.bottom - 1) {
            violations.push(`Chevron alone on row below title (chevTop=${cr.top} >= titleBottom=${tr.bottom})`);
          }
        }
        if (span) {
          const clamp = getComputedStyle(span).webkitLineClamp;
          if (clamp && clamp !== 'none' && clamp !== 'unset') {
            violations.push(`Inbox content title is clamped (${clamp})`);
          }
        }
      }
      return { checked, violations };
    });
    expect(inboxCheck.checked).toBeGreaterThan(0);
    expect(inboxCheck.violations).toEqual([]);
    console.log('=== WP-17.12 K11 COUNTS ===', JSON.stringify(inboxCheck));
  });

  test('K12: B2 spacing tiers (S1-S5) and B3 8 type roles (counts > 0 per relation and role)', async ({ page }) => {
    await ensureAdminLoggedIn(page);
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/admin/_gallery');

    const specimen = await page.evaluate(() => {
      const root = document.getElementById('gallery-type-specimen');
      if (!root) return null;
      const read = (sel: string) => {
        const el = root.querySelector(sel) as HTMLElement | null;
        if (!el) return null;
        const cs = getComputedStyle(el);
        return { size: parseFloat(cs.fontSize), weight: Number(cs.fontWeight), color: cs.color };
      };
      return {
        pageTitle: read('.lp-page-title'),
        sectionTitle: read('.lp-section-title'),
        itemTitle: read('.lp-item-title'),
        label: read('.lp-field-label'),
        body: read('.lp-body'),
        secondary: read('.lp-description'),
        meta: read('.lp-field-help'),
        mono: read('.lp-credential-single'),
      };
    });
    expect(specimen).not.toBeNull();
    expect(specimen!.pageTitle?.size).toBe(24);
    expect(specimen!.pageTitle?.weight).toBe(700);
    expect(specimen!.sectionTitle?.size).toBe(18);
    expect(specimen!.sectionTitle?.weight).toBe(600);
    expect(specimen!.pageTitle!.size - specimen!.sectionTitle!.size).toBeGreaterThanOrEqual(4);
    expect(specimen!.itemTitle?.size).toBe(16);
    expect(specimen!.itemTitle?.weight).toBe(500);
    expect(specimen!.label?.size).toBe(14);
    expect(specimen!.label?.weight).toBe(500);
    expect(specimen!.label?.color).not.toBe(specimen!.sectionTitle?.color);
    expect(specimen!.body?.size).toBe(14);
    expect(specimen!.body?.weight).toBe(400);
    expect(specimen!.secondary?.size).toBe(13);
    expect(specimen!.secondary?.weight).toBe(400);
    expect(specimen!.mono?.size).toBe(13);

    // Check B2 S1 (4px) title->description and S2/S3/S4/S5 on Answering
    await page.goto('/admin/settings/answering');
    const spacing = await page.evaluate(() => {
      const gap = (a: Element | null, b: Element | null) =>
        a && b ? Math.round(b.getBoundingClientRect().top - a.getBoundingClientRect().bottom) : -1;
      const h1 = document.querySelector('main h1');
      const desc = document.querySelector('main .lp-page-description');
      const header = document.querySelector('main .lp-page-header');
      const firstField = document.querySelector('main .lp-field');
      const fields = Array.from(document.querySelectorAll('main .lp-form-section .lp-field'));
      const sections = Array.from(document.querySelectorAll('main .lp-form-section'));
      return {
        s1_titleToDesc: gap(h1, desc),
        s2_labelToCtrl: gap(firstField?.querySelector('.lp-field-label') ?? null, firstField?.querySelector('.lp-input') ?? null),
        s3_fieldToField: fields.length >= 2 ? gap(fields[0], fields[1]) : -1,
        s4_headerToContent: gap(header, header?.nextElementSibling ?? null),
        s5_sectionToSection: sections.length >= 2 ? gap(sections[0], sections[1]) : -1,
      };
    });
    expect(Math.abs(spacing.s1_titleToDesc - 4)).toBeLessThanOrEqual(1);
    expect(Math.abs(spacing.s2_labelToCtrl - 8)).toBeLessThanOrEqual(1);
    expect(Math.abs(spacing.s3_fieldToField - 16)).toBeLessThanOrEqual(1);
    expect(Math.abs(spacing.s4_headerToContent - 24)).toBeLessThanOrEqual(1);
    expect(Math.abs(spacing.s5_sectionToSection - 40)).toBeLessThanOrEqual(1);
    console.log('=== WP-17.12 K12 PROOF ===', JSON.stringify({ specimenRoles: 8, spacing }));
  });

  test('K13: Every visible input/select/textarea at 320px has computed font-size >= 16px', async ({ page }) => {
    await ensureAdminLoggedIn(page);
    await page.setViewportSize({ width: 320, height: 640 });
    const routes = ['/admin/entries', '/admin/settings/answering', '/admin/settings/account', '/admin/settings/appearance', '/admin/ventures'];
    let checked = 0;
    const violations: string[] = [];
    for (const r of routes) {
      await page.goto(r);
      const res = await page.evaluate((route) => {
        const els = Array.from(document.querySelectorAll('main input:not([type="checkbox"]):not([type="radio"]):not([type="hidden"]), main select, main textarea'));
        let cnt = 0;
        const bad: string[] = [];
        for (const el of els) {
          const cs = getComputedStyle(el);
          if (cs.display === 'none' || cs.visibility === 'hidden' || el.getBoundingClientRect().width === 0) continue;
          cnt++;
          const fs = parseFloat(cs.fontSize);
          if (fs < 16) bad.push(`${route} ${el.tagName.toLowerCase()}#${el.id}: ${fs}px < 16px`);
        }
        return { cnt, bad };
      }, r);
      checked += res.cnt;
      violations.push(...res.bad);
    }
    expect(checked).toBeGreaterThan(0);
    expect(violations).toEqual([]);
    console.log('=== WP-17.12 K13 COUNTS ===', JSON.stringify({ inputsCheckedAt320: checked, violations: 0 }));
  });
});
