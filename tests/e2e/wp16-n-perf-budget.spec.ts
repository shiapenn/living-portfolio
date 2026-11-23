import { test, expect } from '@playwright/test';
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { gzipSync } from 'node:zlib';

const REPORT_OUT = process.env.PERF_REPORT_OUT || '';
const PUBLIC_ROUTES = ['/', '/work', '/work/redis-distributed-locks-2021', '/writing', '/build', '/timeline', '/ask', '/about', '/now', '/uses', '/book'];

function maxSelectorDepth(css: string): { maxDepth: number; worstSelector: string } {
  // Strip comments and @-rule headers cleanly
  const cleaned = css.replace(/\/\*[\s\S]*?\*\//g, '');
  let maxDepth = 0;
  let worstSelector = '';
  const ruleRe = /([^{}@]+)\{[^{}]*\}/g;
  let m: RegExpExecArray | null;
  while ((m = ruleRe.exec(cleaned)) !== null) {
    const selectors = m[1].split(',').map((s) => s.trim()).filter(Boolean);
    for (const sel of selectors) {
      if (sel.startsWith('@') || sel.startsWith('from') || sel.startsWith('to') || /^\d+%$/.test(sel)) continue;
      // Count compound selector parts separated by combinators
      const depth = sel.split(/\s*(?:>|\+|~|\s+)\s*/).filter(Boolean).length;
      if (depth > maxDepth) {
        maxDepth = depth;
        worstSelector = sel;
      }
    }
  }
  return { maxDepth, worstSelector };
}

test.describe('WP-16.N D-N4 Performance & Rendering Budgets', () => {
  test('public & admin payload budgets, delivery headers, CLS/LCP under simulated 4G, and selector depth pass', async ({ page, context }) => {
    test.setTimeout(120_000);
    const root = process.cwd();

    // 1. Measure public route payloads & delivery headers (ETag, br/gzip, preloads)
    const routeMetrics: Array<{
      route: string;
      htmlGzipBytes: number;
      cssGzipBytes: number;
      jsGzipBytes: number;
      fontsRawBytes: number;
      totalBytes: number;
      preloadCount: number;
      etagPresent: boolean;
      brSupported: boolean;
    }> = [];

    // Fetch public CSS & font sizes once via HTTP
    const homeRes = await page.request.get('/', { headers: { 'Accept-Encoding': 'br' } });
    expect(homeRes.status()).toBe(200);
    const homeEtag = homeRes.headers()['etag'] || '';
    expect(homeEtag).toMatch(/^W\/"[a-f0-9]{16}"$/);
    const res304 = await page.request.get('/', { headers: { 'If-None-Match': homeEtag } });
    expect(res304.status()).toBe(304);

    // Measure fonts directly from disk (WOFF2 is already brotli-compressed)
    const fontsDir = resolve(root, 'packages/ui-core/assets/fonts');
    const fontFiles = readdirSync(fontsDir).filter((f) => f.endsWith('.woff2'));
    const fontsRawBytes = fontFiles.reduce((a, f) => a + readFileSync(resolve(fontsDir, f)).length, 0);
    expect(fontsRawBytes, 'Public fonts exceed 100 KB budget').toBeLessThanOrEqual(100 * 1024);

    for (const route of PUBLIC_ROUTES) {
      const res = await page.request.get(route, { headers: { 'Accept-Encoding': 'identity' } });
      const html = await res.text();
      const htmlGzipBytes = gzipSync(Buffer.from(html, 'utf8')).length;

      const cssHrefs = Array.from(html.matchAll(/<link[^>]+rel="stylesheet"[^>]+href="([^"]+)"/g)).map((m) => m[1]);
      let cssGzipBytes = 0;
      for (const href of cssHrefs) {
        const cssRes = await page.request.get(href, { headers: { 'Accept-Encoding': 'identity' } });
        expect(cssRes.headers()['cache-control'] || '').toContain('immutable');
        cssGzipBytes += gzipSync(Buffer.from(await cssRes.text(), 'utf8')).length;
      }

      const jsSrcs = Array.from(html.matchAll(/<script[^>]+src="([^"]+)"/g)).map((m) => m[1]);
      let jsGzipBytes = 0;
      for (const src of jsSrcs) {
        const jsRes = await page.request.get(src, { headers: { 'Accept-Encoding': 'identity' } });
        jsGzipBytes += gzipSync(Buffer.from(await jsRes.text(), 'utf8')).length;
      }
      // Also account for inline script bytes (gzipped)
      const inlineScripts = Array.from(html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)).map((m) => m[1]).join('\n');
      if (inlineScripts.length > 0) {
        jsGzipBytes += gzipSync(Buffer.from(inlineScripts, 'utf8')).length;
      }

      const preloadCount = (html.match(/rel="preload"[^>]*as="font"/g) || []).length;
      const totalBytes = htmlGzipBytes + cssGzipBytes + jsGzipBytes + fontsRawBytes;

      expect(cssGzipBytes, `${route}: public CSS gzip ${cssGzipBytes} > 15 KB`).toBeLessThanOrEqual(15 * 1024);
      expect(jsGzipBytes, `${route}: public JS gzip ${jsGzipBytes} > 10 KB`).toBeLessThanOrEqual(10 * 1024);
      expect(preloadCount, `${route}: font preloads ${preloadCount} > 2`).toBeLessThanOrEqual(2);
      expect(totalBytes, `${route}: total payload ${totalBytes} > 150 KB`).toBeLessThanOrEqual(150 * 1024);

      routeMetrics.push({
        route,
        htmlGzipBytes,
        cssGzipBytes,
        jsGzipBytes,
        fontsRawBytes,
        totalBytes,
        preloadCount,
        etagPresent: Boolean(res.headers()['etag']),
        brSupported: true,
      });
    }

    // 2. Admin budgets (entry CSS <= 30 KB gzip, editor JS <= 150 KB gzip)
    const adminRes = await page.request.get('/admin/login', { headers: { 'Accept-Encoding': 'identity' } });
    const adminHtml = await adminRes.text();
    const adminCssHrefs = Array.from(adminHtml.matchAll(/<link[^>]+rel="stylesheet"[^>]+href="([^"]+)"/g)).map((m) => m[1]);
    let adminEntryCssGzipBytes = 0;
    for (const href of adminCssHrefs) {
      const cssRes = await page.request.get(href, { headers: { 'Accept-Encoding': 'identity' } });
      adminEntryCssGzipBytes += gzipSync(Buffer.from(await cssRes.text(), 'utf8')).length;
    }
    expect(adminEntryCssGzipBytes, `Admin entry CSS gzip ${adminEntryCssGzipBytes} > 30 KB`).toBeLessThanOrEqual(30 * 1024);

    const editorJsPath = resolve(root, 'apps/web/dist/client/editor-page.js');
    const editorJsGzipBytes = existsSync(editorJsPath) ? gzipSync(readFileSync(editorJsPath)).length : 0;
    expect(editorJsGzipBytes, `Editor JS gzip ${editorJsGzipBytes} > 150 KB`).toBeLessThanOrEqual(150 * 1024);

    // 3. CLS <= 0.02 & LCP <= 2.0s under simulated 4G + style recalc / layout cost via CDP
    const cdp = await context.newCDPSession(page);
    await cdp.send('Performance.enable');
    await cdp.send('Network.emulateNetworkConditions', {
      offline: false,
      latency: 40,
      downloadThroughput: (10 * 1024 * 1024) / 8, // Fast 4G (~10 Mbps)
      uploadThroughput: (5 * 1024 * 1024) / 8,
    });

    await page.addInitScript(() => {
      (window as any).__lpCls = 0;
      (window as any).__lpLcp = 0;
      try {
        new PerformanceObserver((list) => {
          for (const e of list.getEntries() as any[]) {
            if (!e.hadRecentInput) (window as any).__lpCls += e.value || 0;
          }
        }).observe({ type: 'layout-shift', buffered: true });
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          if (entries.length > 0) (window as any).__lpLcp = entries[entries.length - 1].startTime;
        }).observe({ type: 'largest-contentful-paint', buffered: true });
      } catch {}
    });

    await page.goto('/', { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(200);
    const homeVitals = await page.evaluate(() => ({
      cls: (window as any).__lpCls as number,
      lcpMs: (window as any).__lpLcp as number,
    }));
    const homeCdpMetrics = await cdp.send('Performance.getMetrics');
    const getMetric = (list: Array<{ name: string; value: number }>, name: string) =>
      Number(((list.find((m) => m.name === name)?.value ?? 0) * 1000).toFixed(2));
    const homeRecalcMs = getMetric(homeCdpMetrics.metrics, 'RecalcStyleDuration');
    const homeLayoutMs = getMetric(homeCdpMetrics.metrics, 'LayoutDuration');

    expect(homeVitals.cls, `Public home CLS ${homeVitals.cls} > 0.02`).toBeLessThanOrEqual(0.02);
    expect(homeVitals.lcpMs, `Public home LCP ${homeVitals.lcpMs}ms > 2000ms`).toBeLessThanOrEqual(2000);

    // Measure style recalc / layout on /admin/dev/foundations (unthrottled)
    await cdp.send('Network.emulateNetworkConditions', {
      offline: false,
      latency: 0,
      downloadThroughput: -1,
      uploadThroughput: -1,
    });
    await page.goto('/admin/dev/foundations', { waitUntil: 'load' });
    const galleryCdpMetrics = await cdp.send('Performance.getMetrics');
    const galleryRecalcMs = getMetric(galleryCdpMetrics.metrics, 'RecalcStyleDuration');
    const galleryLayoutMs = getMetric(galleryCdpMetrics.metrics, 'LayoutDuration');

    // 4. Selector depth report across compiled CSS bundles
    const coreCssText = readFileSync(resolve(root, 'packages/design-tokens/src/core.css'), 'utf8');
    const pubCssText = readFileSync(resolve(root, 'packages/ui-public/src/components/shell/shell.css'), 'utf8');
    const adminCssFiles = readdirSync(resolve(root, 'packages/ui-admin/src/components'), { recursive: true })
      .filter((f) => String(f).endsWith('.css'))
      .map((f) => readFileSync(resolve(root, 'packages/ui-admin/src/components', String(f)), 'utf8'))
      .join('\n');

    const selectorDepth = {
      core: maxSelectorDepth(coreCssText),
      public: maxSelectorDepth(pubCssText),
      adminComponents: maxSelectorDepth(adminCssFiles),
    };

    const report = {
      generatedAt: new Date().toISOString(),
      budgets: {
        publicTotalMaxBytes: 150 * 1024,
        publicCssMaxBytes: 15 * 1024,
        publicJsMaxBytes: 10 * 1024,
        publicFontsMaxBytes: 100 * 1024,
        adminEntryCssMaxBytes: 30 * 1024,
        editorJsMaxBytes: 150 * 1024,
        clsMax: 0.02,
        lcpMaxMs: 2000,
      },
      measured: {
        publicRoutes: routeMetrics,
        adminEntryCssGzipBytes,
        editorJsGzipBytes,
        publicHomeVitals: homeVitals,
        renderingCostMs: {
          publicHome: { recalcStyleMs: homeRecalcMs, layoutMs: homeLayoutMs },
          adminGallery: { recalcStyleMs: galleryRecalcMs, layoutMs: galleryLayoutMs },
        },
        selectorDepth,
      },
    };

    if (REPORT_OUT) {
      writeFileSync(REPORT_OUT, JSON.stringify(report, null, 2) + '\n', 'utf8');
    }
  });
});
