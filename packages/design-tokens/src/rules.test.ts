import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadPack, resolveRef } from '../generate.mjs';

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  const n = parseInt(clean, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function relativeLuminance([r, g, b]: [number, number, number]): number {
  const ch = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * ch(r) + 0.7152 * ch(g) + 0.0722 * ch(b);
}

function contrastRatio(fg: string, bg: string): number {
  const l1 = relativeLuminance(hexToRgb(fg));
  const l2 = relativeLuminance(hexToRgb(bg));
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

describe('D-M2 Scale Rules & Governance Validation across Core, Admin, and Public Packs', () => {
  it('validates core pack universal rules (space base 4, breakpoints mult 64 + 400, z-index steps of 100, em letter-spacing)', () => {
    const core = loadPack('core');
    expect(core.governance?.default?.status).toBe('active');
    expect(core.governance?.default?.since).toBeTruthy();
    expect('replacedBy' in core.governance.default).toBe(true);

    for (const [k, v] of Object.entries<string>(core.primitive.space)) {
      const px = parseFloat(v);
      expect(px === 2 || px % core.rules.spaceBase === 0, `core space.${k}=${v}`).toBe(true);
    }
    for (const [k, v] of Object.entries<number>(core.breakpoints.viewport)) {
      expect(v % core.rules.breakpointStep, `breakpoint ${k}=${v}`).toBe(0);
    }
    expect(core.breakpoints.container.compact).toBe(core.rules.containerBreakpoint);
    for (const [k, v] of Object.entries<string>(core.primitive.zIndex)) {
      expect(Number(v) % core.rules.zIndexStep, `zIndex.${k}=${v}`).toBe(0);
    }
    for (const [k, v] of Object.entries<string>(core.primitive.font)) {
      if (k.startsWith('letter-')) expect(v.endsWith('em'), `font.${k}=${v}`).toBe(true);
    }
  });

  it('validates admin pack against its declared D-M2 rules (space, proximity tiers, no adjectives, type ramp, layout lattice, sizes, borders, elevation, motion)', () => {
    const admin = loadPack('admin');
    const r = admin.rules;

    // 1. Space primitives on allowed steps
    const spaceSet = new Set(r.spaceAllowed);
    for (const [k, v] of Object.entries<string>(admin.primitive.space)) {
      expect(spaceSet.has(parseFloat(v)), `admin primitive.space.${k}=${v}`).toBe(true);
    }

    // 2. Proximity tiers strict order 4 < 8 < 16 < 24 < 40
    const tiers = [1, 2, 3, 4, 5].map((n) => parseFloat(resolveRef(admin.proximity[String(n)], admin, 'light')));
    expect(tiers).toEqual(r.proximityTiers);

    // 3. No deleted adjective space tokens
    const forbiddenAdj = /\.(tight|related|group|snug|block|page|display|note|compact|sub-compact|hairline)$/;
    for (const k of Object.keys(admin.component)) {
      if (k.startsWith('space.')) {
        expect(k, `deleted adjective token still present: ${k}`).not.toMatch(forbiddenAdj);
      }
    }

    // 4. Every relation maps to a proximity tier or primitive space token (no raw px)
    for (const [k, v] of Object.entries<string>(admin.relations)) {
      expect(v, `relation ${k} must reference proximity or primitive.space`).toMatch(/^\{(proximity\.\d+|primitive\.space\.\d+)\}$/);
    }

    // 5. Type ramp, line-heights mult 4, weights 400/600, letter-spacing in em
    const typeSet = new Set(r.typeRamp);
    const weightSet = new Set(r.weightsAllowed);
    for (const [k, v] of Object.entries<string>(admin.primitive.font)) {
      if (k.startsWith('size-')) expect(typeSet.has(parseFloat(v)), `font.${k}=${v}`).toBe(true);
      if (k.startsWith('line-') && v.endsWith('px')) expect(parseFloat(v) % r.lineHeightStep, `font.${k}=${v}`).toBe(0);
      if (k.startsWith('weight-')) expect(weightSet.has(Number(v)), `font.${k}=${v}`).toBe(true);
      if (k.startsWith('letter-')) expect(v.endsWith('em'), `font.${k}=${v}`).toBe(true);
    }

    // 6. Component sizes mult 4; layout widths on 80px lattice
    const lattice = new Set(r.layoutLattice);
    for (const [k, v] of Object.entries<string>(admin.primitive.size)) {
      if (v.endsWith('px')) expect(parseFloat(v) % r.sizeStep, `size.${k}=${v}`).toBe(0);
    }
    const layoutKeys = [
      'size.admin-inspector-width',
      'size.layout-narrow-max',
      'size.layout-reading-col',
      'size.layout-main-max',
      'size.layout-wide-col',
      'size.layout-dashboard-max',
      'size.layout-max',
    ];
    for (const lk of layoutKeys) {
      const px = parseFloat(resolveRef(admin.component[lk], admin, 'light'));
      expect(lattice.has(px), `layout width ${lk}=${px}px not on 80px lattice`).toBe(true);
    }

    // 7. Radius & borders
    const radSet = new Set(r.radiusAllowed);
    for (const [k, v] of Object.entries<string>(admin.primitive.radius)) {
      expect(radSet.has(parseFloat(v)), `radius.${k}=${v}`).toBe(true);
    }
    const borderSet = new Set(r.borderAllowed);
    for (const [k, v] of Object.entries<string>(admin.primitive.border)) {
      expect(borderSet.has(parseFloat(v)), `border.${k}=${v}`).toBe(true);
    }

    // 8. Elevation e2 === 2 * e1 and shadow direction uses offset variable (never literal)
    const e1y = parseFloat(admin.primitive.elevation['e1-offset-y']);
    const e2y = parseFloat(admin.primitive.elevation['e2-offset-y']);
    expect(e2y).toBe(e1y * r.elevationRatio);
    expect(e1y % r.spaceBase).toBe(0);
    expect(admin.semantic.light['elevation.e1']).toContain('{component.elevation.e1-offset-y}');
    expect(admin.semantic.light['elevation.e1-up']).toContain('calc(-1 * {component.elevation.e1-offset-y})');
    expect(admin.semantic.light['elevation.e2']).toContain('{component.elevation.e2-offset-y}');

    // 9. Motion durations & easings (no reduced-motion hack token)
    expect('duration-instant' in admin.primitive.motion).toBe(false);
    expect('motion.duration-instant' in admin.component).toBe(false);
    const durSet = new Set(r.motionDurationsMs);
    for (const [k, v] of Object.entries<string>(admin.primitive.motion)) {
      if (k.startsWith('duration-')) expect(durSet.has(parseFloat(v)), `motion.${k}=${v}`).toBe(true);
      if (k.startsWith('easing-')) expect(r.motionEasingsAllowed.includes(k.replace('easing-', '')), `motion.${k}`).toBe(true);
    }

    // 9b. Semantic means theme-switched (no identical light/dark semantic tokens)
    for (const k of Object.keys(admin.semantic.light)) {
      const lVal = resolveRef(admin.semantic.light[k], admin, 'light');
      const dVal = resolveRef(admin.semantic.dark[k], admin, 'dark');
      expect(lVal, `semantic.${k} is identical in light and dark (${lVal}); move to component tier`).not.toBe(dVal);
    }

    // 9c. Zero undocumented value duplicates in component tier (every duplicate needs governance.aliases with reason)
    const aliases = admin.governance?.aliases ?? {};
    const seenByCatVal = new Map<string, string>();
    for (const [k, v] of Object.entries<string>(admin.component)) {
      const cat = k.split('.')[0];
      const key = `${cat}:${resolveRef(v, admin, 'light')}`;
      if (seenByCatVal.has(key)) {
        const aliasEntry = aliases[k];
        expect(aliasEntry, `undocumented duplicate component token ${k} (same value as ${seenByCatVal.get(key)})`).toBeDefined();
        expect(aliasEntry.aliasOf, `alias ${k} missing aliasOf`).toBeTruthy();
        expect(aliasEntry.reason?.length, `alias ${k} missing reason`).toBeGreaterThan(5);
      } else {
        seenByCatVal.set(key, k);
      }
    }

    // 10. Z-index steps of 100
    for (const [k, v] of Object.entries<string>(admin.primitive.zIndex)) {
      expect(Number(v) % r.zIndexStep, `zIndex.${k}=${v}`).toBe(0);
    }

    // 11. Contrast validation (text >= 4.5:1, UI >= 3:1, both themes)
    for (const mode of ['light', 'dark'] as const) {
      const bg = resolveRef(admin.semantic[mode]['color.surface.l0'], admin, mode);
      const t1 = resolveRef(admin.semantic[mode]['color.text.1'], admin, mode);
      const t2 = resolveRef(admin.semantic[mode]['color.text.2'], admin, mode);
      const borderCtrl = resolveRef(admin.semantic[mode]['color.border.control'], admin, mode);
      expect(contrastRatio(t1, bg), `admin ${mode} text.1`).toBeGreaterThanOrEqual(r.minTextContrast);
      expect(contrastRatio(t2, bg), `admin ${mode} text.2`).toBeGreaterThanOrEqual(r.minTextContrast);
      expect(contrastRatio(borderCtrl, bg), `admin ${mode} border.control`).toBeGreaterThanOrEqual(r.minUiContrast);
      for (const role of ['action', 'neutral', 'success', 'warning', 'danger', 'info']) {
        const fg = resolveRef(admin.semantic[mode][`color.role.${role}-fg`], admin, mode);
        const rbg = resolveRef(admin.semantic[mode][`color.role.${role}-bg`], admin, mode);
        expect(contrastRatio(fg, rbg), `admin ${mode} role.${role}`).toBeGreaterThanOrEqual(r.minTextContrast);
      }
    }
  });

  it('validates public pack against its own declared D-M2 rules (space to 256, fluid clamp type scale, contrast both moods)', () => {
    const pub = loadPack('public');
    const r = pub.rules;
    const spaceSet = new Set(r.spaceAllowed);
    for (const [k, v] of Object.entries<string>(pub.primitive.space)) {
      const px = parseFloat(v);
      expect(spaceSet.has(px) && px <= r.spaceMax, `public space.${k}=${v}`).toBe(true);
    }
    expect(r.typeScale.kind).toBe('fluid-modular');
    expect(r.typeScale.ratio).toBeGreaterThan(1);
    for (const [k, v] of Object.entries<string>(pub.primitive.font)) {
      if (k.startsWith('size-')) expect(v.startsWith('clamp('), `public font.${k}=${v}`).toBe(true);
    }
    for (const mode of ['light', 'dark'] as const) {
      const bg = resolveRef(pub.semantic[mode]['color.surface.canvas'], pub, mode);
      const t1 = resolveRef(pub.semantic[mode]['color.text.primary'], pub, mode);
      const t2 = resolveRef(pub.semantic[mode]['color.text.secondary'], pub, mode);
      const border = resolveRef(pub.semantic[mode]['color.border.strong'], pub, mode);
      expect(contrastRatio(t1, bg), `public ${mode} text.primary`).toBeGreaterThanOrEqual(r.minTextContrast);
      expect(contrastRatio(t2, bg), `public ${mode} text.secondary`).toBeGreaterThanOrEqual(r.minTextContrast);
      expect(contrastRatio(border, bg), `public ${mode} border.strong`).toBeGreaterThanOrEqual(r.minUiContrast);
    }
    // Public semantic tokens must be theme-switched (light !== dark)
    for (const k of Object.keys(pub.semantic.light)) {
      const lVal = resolveRef(pub.semantic.light[k], pub, 'light');
      const dVal = resolveRef(pub.semantic.dark[k], pub, 'dark');
      expect(lVal, `public semantic.${k} is identical in light and dark`).not.toBe(dVal);
    }
    // Public zero undocumented duplicates
    const pubAliases = pub.governance?.aliases ?? {};
    const pubSeen = new Map<string, string>();
    for (const [k, v] of Object.entries<string>(pub.component)) {
      const cat = k.split('.')[0];
      const key = `${cat}:${resolveRef(v, pub, 'light')}`;
      if (pubSeen.has(key)) {
        expect(pubAliases[k], `public undocumented duplicate ${k} (same as ${pubSeen.get(key)})`).toBeDefined();
      } else {
        pubSeen.set(key, k);
      }
    }
  });
});
