import { describe, it, expect, afterEach } from 'vitest';
import { z } from '@living-portfolio/core';
import {
  ensureBuiltinSettingsModulesRegistered,
  registerSettingsModule,
  unregisterSettingsModule,
  getSettingsModules,
  getSettingsModule,
  readModuleConfig,
  validateThemePack,
  BUILTIN_THEME_PACKS,
} from './index.js';
import { renderSettingsIndexPage, renderSettingsModulePage } from '../pages/admin/settings.js';

describe('D-SETTINGS-ARCH settings registry and theme packs', () => {
  const dummyId = 'dummy-test-module';

  afterEach(() => {
    unregisterSettingsModule(dummyId);
  });

  it('allows registering a dummy module that appears in the index and opens at its route with no edits to shared files', () => {
    ensureBuiltinSettingsModulesRegistered();
    registerSettingsModule({
      id: dummyId,
      title: 'Dummy Module',
      summary: 'Test module registered dynamically.',
      icon: 'sliders',
      order: 99,
      route: `/admin/settings/${dummyId}`,
      version: 1,
      defaults: { enabled: true },
      schema: z.object({ enabled: z.boolean().default(true) }),
      status: (cfg) => (cfg.enabled ? 'Enabled' : 'Disabled'),
      render: (cfg) => `<p id="dummy-rendered">${cfg.enabled ? 'on' : 'off'}</p>`,
    });

    const mods = getSettingsModules();
    expect(mods.some((m) => m.id === dummyId)).toBe(true);

    const indexHtml = renderSettingsIndexPage({}, {});
    expect(indexHtml).toContain('Dummy Module');
    expect(indexHtml).toContain(`/admin/settings/${dummyId}`);

    const mod = getSettingsModule(dummyId)!;
    const cfg = readModuleConfig(mod, {});
    const moduleHtml = renderSettingsModulePage(mod, cfg, { settings: {}, config: {} });
    expect(moduleHtml).toContain('id="dummy-rendered"');
  });

  it('accepts valid built-in theme packs and rejects a pack with failing contrast with a plain message', () => {
    expect(validateThemePack(BUILTIN_THEME_PACKS.light).ok).toBe(true);
    expect(validateThemePack(BUILTIN_THEME_PACKS.dark).ok).toBe(true);

    const badPack = {
      ...BUILTIN_THEME_PACKS.light,
      id: 'low-contrast',
      tokens: {
        ...BUILTIN_THEME_PACKS.light.tokens,
        '--text': '#CCCCCC',
      },
    };
    const res = validateThemePack(badPack);
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.message).toContain('4.5:1');
      expect(res.message).not.toMatch(/UX-\d+|§|[a-z]+_[a-z]+|\bTier \d/);
    }
  });
});
