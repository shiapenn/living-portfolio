import type { RoleProfile } from '../types/index.js';

export type SectionId = 'work' | 'writing' | 'build';

export interface SectionDefinition {
  id: SectionId;
  label: string;
  basePath: string;
  description: string;
}

export interface SectionMappingConfig {
  sections: Record<SectionId, SectionDefinition>;
  profileToSection: Record<string, SectionId>;
  defaultSection: SectionId;
}

export const DEFAULT_SECTION_CONFIG: SectionMappingConfig = {
  sections: {
    work: {
      id: 'work',
      label: 'Work',
      basePath: '/work',
      description: 'Structured case studies, design projects, and decision records.',
    },
    writing: {
      id: 'writing',
      label: 'Writing',
      basePath: '/writing',
      description: 'Essays, notes, and chronological writing.',
    },
    build: {
      id: 'build',
      label: 'Build',
      basePath: '/build',
      description: 'Ventures, shipped products, and dev-log entries.',
    },
  },
  profileToSection: {
    'case-study': 'work',
    'design-project': 'work',
    'decision-record': 'work',
    'freeform': 'writing',
    'dev-log': 'build',
  },
  defaultSection: 'writing',
};

export interface ResolvedEntrySection {
  id: SectionId;
  label: string;
  basePath: string;
  url: string;
}

/**
 * Resolve the public section and target URL for an entry profile using configuration.
 * Unmapped profiles default to `Writing` per D-LAYOUT #13.
 */
export function resolveEntrySection(
  profileId: string | null | undefined,
  options?: {
    slug?: string;
    hasVenture?: boolean;
    config?: SectionMappingConfig;
  }
): ResolvedEntrySection {
  const cfg = options?.config ?? DEFAULT_SECTION_CONFIG;
  const key = (profileId || '').trim();
  let sectionId: SectionId;
  if (options?.hasVenture && key === 'dev-log') {
    sectionId = 'build';
  } else {
    sectionId = cfg.profileToSection[key] ?? cfg.defaultSection;
  }
  const def = cfg.sections[sectionId] ?? cfg.sections[cfg.defaultSection];
  const slug = (options?.slug || '').trim();
  const url = slug ? `${def.basePath}/${encodeURIComponent(slug)}` : `${def.basePath}/<slug>`;
  return {
    id: def.id,
    label: def.label,
    basePath: def.basePath,
    url,
  };
}

export interface GroupedProfileOption {
  sectionId: SectionId;
  sectionLabel: string;
  profiles: RoleProfile[];
}

/**
 * Group role profiles by their configured public section for the editor type picker.
 */
export function groupProfilesBySection(
  profiles: RoleProfile[],
  config: SectionMappingConfig = DEFAULT_SECTION_CONFIG
): GroupedProfileOption[] {
  const order: SectionId[] = ['work', 'writing', 'build'];
  const buckets: Record<SectionId, RoleProfile[]> = {
    work: [],
    writing: [],
    build: [],
  };

  for (const p of profiles) {
    const resolved = resolveEntrySection(p.id, { config });
    buckets[resolved.id].push(p);
  }

  return order
    .filter((id) => buckets[id].length > 0)
    .map((id) => ({
      sectionId: id,
      sectionLabel: config.sections[id].label,
      profiles: buckets[id],
    }));
}
