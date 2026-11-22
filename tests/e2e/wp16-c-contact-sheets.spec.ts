import { test, expect } from '@playwright/test';
import { existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { execSync } from 'node:child_process';
import { ensureAdminLoggedIn } from './helpers.js';
import {
  STATES,
  THEMES,
  VIEWPORTS,
  expectedSheetFiles,
  sheetFileName,
} from './states-manifest.js';
import { getSeededIds, navigateToState, setTheme } from './census-helpers.js';

const OUT_DIR = resolve(process.cwd(), 'test-results/wp16f-contact-sheets');

test.describe('WP-16.F F4 Contact Sheet Capture (STATES manifest x 2 themes x 320/1280/1920)', () => {
  if (process.env.CAPTURE_CONTACT_SHEETS === '1') {
    test('captures every STATES manifest entry x 2 themes x 320, 1280, 1920 and zips to ~/Desktop/wp16f-contact-sheets.zip', async ({ page }) => {
      test.setTimeout(600_000);
      mkdirSync(OUT_DIR, { recursive: true });
      await page.emulateMedia({ reducedMotion: 'reduce' });

      await ensureAdminLoggedIn(page);
      const ids = await getSeededIds(page);
      expect(ids.entryId).toBeTruthy();

      const captured: Array<{ label: string; file: string; group: string }> = [];

      for (const vp of VIEWPORTS) {
        await page.setViewportSize(vp);
        for (const theme of THEMES) {
          const group = `${vp.width}px-${theme}`;
          for (const state of STATES) {
            const ok = await navigateToState(page, state, ids);
            await setTheme(page, theme);
            const file = sheetFileName(state.id, vp.width, theme);
            await page.screenshot({
              path: resolve(OUT_DIR, file),
              fullPage: state.fullPage ?? true,
            });
            captured.push({
              label: `${state.id} (${vp.width}px, ${theme})${ok ? '' : ' [fallback]'}`,
              file,
              group,
            });
          }
        }
      }

      // Verify 1:1 parity between STATES manifest and captured PNGs (D-FINAL #1)
      const actualFiles = readdirSync(OUT_DIR).filter((f) => f.endsWith('.png')).sort();
      const expected = expectedSheetFiles().sort();
      expect(actualFiles).toEqual(expected);

      // Generate HTML contact-sheet index
      const groups = Array.from(new Set(captured.map((c) => c.group)));
      const sectionsHtml = groups
        .map((g) => {
          const items = captured
            .filter((c) => c.group === g)
            .map(
              (c) => `<figure style="margin:0;border:1px solid #ccc;padding:8px;background:#fff">
                <figcaption style="font:12px/1.4 sans-serif;margin-bottom:6px">${c.label}</figcaption>
                <a href="${c.file}"><img src="${c.file}" loading="lazy" style="max-width:100%;height:auto;display:block" /></a>
              </figure>`
            )
            .join('\n');
          return `<h2>${g}</h2><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:16px">${items}</div>`;
        })
        .join('\n');

      writeFileSync(
        resolve(OUT_DIR, 'index.html'),
        `<!DOCTYPE html><html><head><meta charset="utf-8"><title>WP-16.F Contact Sheets</title></head><body style="font-family:sans-serif;padding:24px;background:#f5f6f7"><h1>WP-16.F Contact Sheets (${captured.length} captures)</h1>${sectionsHtml}</body></html>`,
        'utf8'
      );

      const zipPath = resolve(process.env.HOME || '~', 'Desktop/wp16f-contact-sheets.zip');
      execSync(`cd "${OUT_DIR}" && zip -rq "${zipPath}" .`);
      expect(existsSync(zipPath)).toBe(true);
      console.log(`[WP-16.F F4] Captured ${captured.length} PNGs and zipped to ${zipPath}`);
    });
  } else if (process.env.CAPTURE_G3_SHEETS === '1') {
    test('captures selective G3 contact sheets (named defect states + pixel diff > 0.5% vs WP-16.F) and zips to ~/Desktop/wp16g-contact-sheets.zip', async ({ page }) => {
      test.setTimeout(600_000);
      const ALL_DIR = resolve(process.cwd(), 'test-results/wp16g-all-sheets');
      const F_DIR = resolve(process.cwd(), 'test-results/wp16f-contact-sheets');
      const G_DIR = resolve(process.cwd(), 'test-results/wp16g-contact-sheets');
      mkdirSync(ALL_DIR, { recursive: true });
      mkdirSync(G_DIR, { recursive: true });
      await page.emulateMedia({ reducedMotion: 'reduce' });

      await ensureAdminLoggedIn(page);
      const ids = await getSeededIds(page);
      expect(ids.entryId).toBeTruthy();

      const namedDefectStates = new Set([
        'login',
        'login-recovery',
        'setup-step-1',
        'setup-step-2',
        'setup-step-3',
        'setup-step-4',
        'setup-step-5',
        'setup-step-6',
        'editor-edit',
        'editor-settings',
        'editor-tag-add',
        'editor-role-suggested',
        'editor-role-accepted',
        'editor-role-ignored',
        'status',
        'settings-providers',
        'settings-providers-change-1',
        'settings-providers-change-2',
        'settings-providers-change-3',
        'overlay-entries-panel',
        'overlay-launcher',
        'overlay-account',
        'overlay-slash-menu',
        'gallery',
        'fixture-pattern',
      ]);

      for (const vp of VIEWPORTS) {
        await page.setViewportSize(vp);
        for (const theme of THEMES) {
          for (const state of STATES) {
            await navigateToState(page, state, ids);
            await setTheme(page, theme);
            const file = sheetFileName(state.id, vp.width, theme);
            await page.screenshot({
              path: resolve(ALL_DIR, file),
              fullPage: state.fullPage ?? true,
            });
          }
        }
      }

      const pyScript = `
import json, shutil
from pathlib import Path
from PIL import Image, ImageChops

all_dir = Path(${JSON.stringify(ALL_DIR)})
f_dir = Path(${JSON.stringify(F_DIR)})
g_dir = Path(${JSON.stringify(G_DIR)})
named = set(${JSON.stringify(Array.from(namedDefectStates))})

results = []
for g_png in sorted(all_dir.glob("*.png")):
    name = g_png.name
    state_id = name.rsplit("-", 2)[0]
    f_png = f_dir / name
    diff_pct = 100.0
    if f_png.exists():
        im_g = Image.open(g_png).convert("RGBA")
        im_f = Image.open(f_png).convert("RGBA")
        if im_g.size == im_f.size:
            diff = ImageChops.difference(im_g, im_f)
            px = diff.getdata()
            changed = sum(1 for r, g, b, a in px if r > 4 or g > 4 or b > 4 or a > 4)
            diff_pct = round((changed / max(1, len(px))) * 100.0, 2)
        else:
            diff_pct = 100.0
    reasons = []
    if state_id in named:
        reasons.append("named-defect")
    if diff_pct > 0.5:
        reasons.append(f"pixel-diff={diff_pct}%")
    if reasons:
        shutil.copy2(g_png, g_dir / name)
        results.append({"file": name, "stateId": state_id, "diffPct": diff_pct, "reason": ", ".join(reasons)})

(g_dir / "index.json").write_text(json.dumps(results, indent=2))
lines = [f"{r['file']}\\t{r['diffPct']}%\\t{r['reason']}" for r in results]
(g_dir / "index.txt").write_text("\\n".join(lines) + "\\n")
print(f"G3 selective capture: {len(results)} / 252 sheets included.")
`;
      const summary = execSync('python3 -', { input: pyScript, encoding: 'utf8' });
      console.log(summary.trim());

      const zipPath = resolve(process.env.HOME || '~', 'Desktop/wp16g-contact-sheets.zip');
      execSync(`rm -f "${zipPath}" && cd "${G_DIR}" && zip -rq "${zipPath}" .`);
      expect(existsSync(zipPath)).toBe(true);
    });
  } else if (process.env.CAPTURE_H3_SHEETS === '1') {
    test('captures selective H3 contact sheets (named defect states + top bar states + pixel diff > 0.5% vs WP-16.G) and zips to ~/Desktop/wp16h-contact-sheets.zip', async ({ page }) => {
      test.setTimeout(600_000);
      const ALL_DIR = resolve(process.cwd(), 'test-results/wp16h-all-sheets');
      const G_ALL_DIR = existsSync('/tmp/wp16g-all-sheets')
        ? '/tmp/wp16g-all-sheets'
        : resolve(process.cwd(), 'test-results/wp16g-all-sheets');
      const H_DIR = resolve(process.cwd(), 'test-results/wp16h-contact-sheets');
      mkdirSync(ALL_DIR, { recursive: true });
      mkdirSync(H_DIR, { recursive: true });
      await page.emulateMedia({ reducedMotion: 'reduce' });

      await ensureAdminLoggedIn(page);
      const ids = await getSeededIds(page);
      expect(ids.entryId).toBeTruthy();

      const namedDefectStates = new Set([
        'answer-rules',
        'history',
        'settings-providers',
        'status',
        'editor-role-suggested',
        'editor-role-accepted',
        'editor-role-ignored',
        'editor-settings',
        'editor-tag-add',
        'login-recovery',
        'overlay-entries-panel',
        'setup-step-3',
        'setup-step-6',
        // Two additional states that show the top bar (H6)
        'today',
        'inbox',
      ]);

      for (const vp of VIEWPORTS) {
        await page.setViewportSize(vp);
        for (const theme of THEMES) {
          for (const state of STATES) {
            await navigateToState(page, state, ids);
            await setTheme(page, theme);
            const file = sheetFileName(state.id, vp.width, theme);
            await page.screenshot({
              path: resolve(ALL_DIR, file),
              fullPage: state.fullPage ?? true,
            });
          }
        }
      }

      const pyScript = `
import json, shutil
from pathlib import Path
from PIL import Image, ImageChops

all_dir = Path(${JSON.stringify(ALL_DIR)})
g_dir = Path(${JSON.stringify(G_ALL_DIR)})
h_dir = Path(${JSON.stringify(H_DIR)})
named = set(${JSON.stringify(Array.from(namedDefectStates))})

results = []
excluded = []
for h_png in sorted(all_dir.glob("*.png")):
    name = h_png.name
    state_id = name.rsplit("-", 2)[0]
    g_png = g_dir / name
    diff_pct = 100.0
    if g_png.exists():
        im_h = Image.open(h_png).convert("RGBA")
        im_g = Image.open(g_png).convert("RGBA")
        if im_h.size == im_g.size:
            diff = ImageChops.difference(im_h, im_g)
            px = diff.getdata()
            changed = sum(1 for r, g, b, a in px if r > 4 or g > 4 or b > 4 or a > 4)
            diff_pct = round((changed / max(1, len(px))) * 100.0, 2)
        else:
            diff_pct = 100.0
    reasons = []
    if state_id in named:
        reasons.append("named-defect")
    if diff_pct > 0.5:
        reasons.append(f"pixel-diff={diff_pct}%")
    if reasons:
        shutil.copy2(h_png, h_dir / name)
        results.append({"file": name, "stateId": state_id, "diffPct": diff_pct, "reason": ", ".join(reasons)})
    else:
        excluded.append({"file": name, "stateId": state_id, "diffPct": diff_pct})

(h_dir / "index.json").write_text(json.dumps({"included": results, "excludedCount": len(excluded)}, indent=2))
lines = [f"{r['file']}\\t{r['diffPct']}%\\t{r['reason']}" for r in results]
(h_dir / "index.txt").write_text("\\n".join(lines) + "\\n")
print(f"H3 selective capture: {len(results)} / {len(results) + len(excluded)} sheets included ({len(excluded)} unchanged excluded).")
`;
      const summary = execSync('python3 -', { input: pyScript, encoding: 'utf8' });
      console.log(summary.trim());

      const zipPath = resolve(process.env.HOME || '~', 'Desktop/wp16h-contact-sheets.zip');
      execSync(`rm -f "${zipPath}" && cd "${H_DIR}" && zip -rq "${zipPath}" .`);
      expect(existsSync(zipPath)).toBe(true);
    });
  } else if (process.env.CAPTURE_I3_SHEETS === '1') {
    test('captures selective I3 contact sheets (named defect states + pixel diff > 0.5% vs WP-16.H) and zips to ~/Desktop/wp16i-contact-sheets.zip', async ({ page }) => {
      test.setTimeout(600_000);
      const ALL_DIR = resolve(process.cwd(), 'test-results/wp16i-all-sheets');
      const H_ALL_DIR = existsSync('/tmp/wp16h-all-sheets')
        ? '/tmp/wp16h-all-sheets'
        : resolve(process.cwd(), 'test-results/wp16h-all-sheets');
      const I_DIR = resolve(process.cwd(), 'test-results/wp16i-contact-sheets');
      mkdirSync(ALL_DIR, { recursive: true });
      mkdirSync(I_DIR, { recursive: true });
      await page.emulateMedia({ reducedMotion: 'reduce' });

      await ensureAdminLoggedIn(page);
      const ids = await getSeededIds(page);
      expect(ids.entryId).toBeTruthy();

      const namedDefectStates = new Set([
        'overlay-delete-dialog',
        'overlay-publish-dialog',
        'answer-rules',
        'history',
        'settings-providers',
        'status',
        'editor-role-accepted',
        'editor-role-ignored',
        'editor-role-suggested',
        'editor-settings',
        'editor-tag-add',
        'setup-step-1',
        'setup-step-2',
        'setup-step-3',
        'setup-step-4',
        'setup-step-5',
        'setup-step-6',
        'overlay-entries-panel',
        'gallery',
        'fixture-pattern',
        'login-recovery',
      ]);

      for (const state of STATES) {
        for (const vp of VIEWPORTS) {
          await page.setViewportSize(vp);
          const ok = await navigateToState(page, state, ids);
          if (!ok) continue;
          for (const theme of THEMES) {
            await setTheme(page, theme);
            const file = sheetFileName(state.id, vp.width, theme);
            await page.screenshot({
              path: resolve(ALL_DIR, file),
              fullPage: state.fullPage ?? true,
            });
          }
        }
      }

      const pyScript = `
import json, shutil
from pathlib import Path
from PIL import Image, ImageChops

all_dir = Path(${JSON.stringify(ALL_DIR)})
h_dir = Path(${JSON.stringify(H_ALL_DIR)})
i_dir = Path(${JSON.stringify(I_DIR)})
named = set(${JSON.stringify(Array.from(namedDefectStates))})

results = []
excluded = []
for i_png in sorted(all_dir.glob("*.png")):
    name = i_png.name
    state_id = name.rsplit("-", 2)[0]
    h_png = h_dir / name
    diff_pct = 100.0
    if h_png.exists():
        im_i = Image.open(i_png).convert("RGBA")
        im_h = Image.open(h_png).convert("RGBA")
        if im_i.size == im_h.size:
            diff = ImageChops.difference(im_i, im_h)
            px = diff.getdata()
            changed = sum(1 for r, g, b, a in px if r > 4 or g > 4 or b > 4 or a > 4)
            diff_pct = round((changed / max(1, len(px))) * 100.0, 2)
        else:
            diff_pct = 100.0
    reasons = []
    if state_id in named:
        reasons.append("named-defect")
    if diff_pct > 0.5:
        reasons.append(f"pixel-diff={diff_pct}%")
    if reasons:
        shutil.copy2(i_png, i_dir / name)
        results.append({"file": name, "stateId": state_id, "diffPct": diff_pct, "reason": ", ".join(reasons)})
    else:
        excluded.append({"file": name, "stateId": state_id, "diffPct": diff_pct})

(i_dir / "index.json").write_text(json.dumps({"included": results, "excludedCount": len(excluded)}, indent=2))
lines = [f"{r['file']}\\t{r['diffPct']}%\\t{r['reason']}" for r in results]
(i_dir / "index.txt").write_text("\\n".join(lines) + "\\n")
print(f"I3 selective capture: {len(results)} / {len(results) + len(excluded)} sheets included ({len(excluded)} unchanged excluded).")
`;
      const summary = execSync('python3 -', { input: pyScript, encoding: 'utf8' });
      console.log(summary.trim());

      const zipPath = resolve(process.env.HOME || '~', 'Desktop/wp16i-contact-sheets.zip');
      execSync(`rm -f "${zipPath}" && cd "${I_DIR}" && zip -rq "${zipPath}" .`);
      expect(existsSync(zipPath)).toBe(true);
    });
  } else if (process.env.CAPTURE_J3_SHEETS === '1') {
    test('captures selective J3 contact sheets (named defect states + pixel diff > 0.5% vs WP-16.I) and zips to ~/Desktop/wp16j-contact-sheets.zip', async ({ page }) => {
      test.setTimeout(600_000);
      const ALL_DIR = resolve(process.cwd(), 'test-results/wp16j-all-sheets');
      const I_ALL_DIR = existsSync('/tmp/wp16i-all-sheets')
        ? '/tmp/wp16i-all-sheets'
        : resolve(process.cwd(), 'test-results/wp16i-all-sheets');
      const J_DIR = resolve(process.cwd(), 'test-results/wp16j-contact-sheets');
      mkdirSync(ALL_DIR, { recursive: true });
      mkdirSync(J_DIR, { recursive: true });
      await page.emulateMedia({ reducedMotion: 'reduce' });

      await ensureAdminLoggedIn(page);
      const ids = await getSeededIds(page);
      expect(ids.entryId).toBeTruthy();

      const namedDefectStates = new Set([
        'settings-providers',
        'editor-settings',
        'editor-tag-add',
        'editor-role-accepted',
        'editor-role-ignored',
        'editor-role-suggested',
      ]);

      for (const state of STATES) {
        for (const vp of VIEWPORTS) {
          await page.setViewportSize(vp);
          const ok = await navigateToState(page, state, ids);
          if (!ok) continue;
          for (const theme of THEMES) {
            await setTheme(page, theme);
            const file = sheetFileName(state.id, vp.width, theme);
            await page.screenshot({
              path: resolve(ALL_DIR, file),
              fullPage: state.fullPage ?? true,
            });
          }
        }
      }

      const pyScript = `
import json, shutil
from pathlib import Path
from PIL import Image, ImageChops

all_dir = Path(${JSON.stringify(ALL_DIR)})
i_dir = Path(${JSON.stringify(I_ALL_DIR)})
j_dir = Path(${JSON.stringify(J_DIR)})
named = set(${JSON.stringify(Array.from(namedDefectStates))})

results = []
excluded = []
for j_png in sorted(all_dir.glob("*.png")):
    name = j_png.name
    state_id = name.rsplit("-", 2)[0]
    i_png = i_dir / name
    diff_pct = 100.0
    if i_png.exists():
        im_j = Image.open(j_png).convert("RGBA")
        im_i = Image.open(i_png).convert("RGBA")
        if im_j.size == im_i.size:
            diff = ImageChops.difference(im_j, im_i)
            px = diff.getdata()
            changed = sum(1 for r, g, b, a in px if r > 4 or g > 4 or b > 4 or a > 4)
            diff_pct = round((changed / max(1, len(px))) * 100.0, 2)
        else:
            diff_pct = 100.0
    reasons = []
    if state_id in named:
        reasons.append("named-defect")
    if diff_pct > 0.5:
        reasons.append(f"pixel-diff={diff_pct}%")
    if reasons:
        shutil.copy2(j_png, j_dir / name)
        results.append({"file": name, "stateId": state_id, "diffPct": diff_pct, "reason": ", ".join(reasons)})
    else:
        excluded.append({"file": name, "stateId": state_id, "diffPct": diff_pct})

(j_dir / "index.json").write_text(json.dumps({"included": results, "excludedCount": len(excluded)}, indent=2))
lines = [f"{r['file']}\\t{r['diffPct']}%\\t{r['reason']}" for r in results]
(j_dir / "index.txt").write_text("\\n".join(lines) + "\\n")
print(f"J3 selective capture: {len(results)} / {len(results) + len(excluded)} sheets included ({len(excluded)} unchanged excluded).")
`;
      const summary = execSync('python3 -', { input: pyScript, encoding: 'utf8' });
      console.log(summary.trim());

      const zipPath = resolve(process.env.HOME || '~', 'Desktop/wp16j-contact-sheets.zip');
      execSync(`rm -f "${zipPath}" && cd "${J_DIR}" && zip -rq "${zipPath}" .`);
      expect(existsSync(zipPath)).toBe(true);
    });
  } else {
    test('STATES manifest parity guard (set CAPTURE_CONTACT_SHEETS=1 to capture)', () => {
      expect(expectedSheetFiles().length).toBe(STATES.length * THEMES.length * VIEWPORTS.length);
    });
  }
});
