import type { DataClass, TemporalLevel } from '../types/index.js';

/**
 * §14 Plugin & Extension SDK Contracts
 */

export interface PluginPermissions {
  networkHosts?: string[];
  filesystemPaths?: string[];
  dataClasses?: DataClass[];
}

export interface ImportedAsset {
  externalId: string;
  title: string;
  bodyMd: string;
  sourceUrl?: string;
  occurredAt?: string;
  temporalLevel: TemporalLevel;
  suggestedProfile?: string;
  facets?: Record<string, any>;
}

/**
 * 1. Source Connector Interface (§14)
 */
export interface SourceConnector {
  id: string;
  name: string;
  permissions: PluginPermissions;
  authenticate(credentials: Record<string, string>): Promise<boolean>;
  crawl(options?: { since?: string; limit?: number }): AsyncGenerator<ImportedAsset, void, unknown>;
  inferTemporalConfidence(rawItem: Record<string, any>): {
    valid_from?: string;
    temporal_level: TemporalLevel;
    confidence: number;
  };
}

/**
 * 2. Theme Contract & Slot Conformance (§12.10, §14)
 */
export const REQUIRED_THEME_SLOTS = {
  EntryArticle: ['header', 'contextStrip', 'body', 'marginRail', 'laterThinkingBanner', 'related', 'askWidgetMount'],
  EntryStructured: ['header', 'contextStrip', 'roleSections', 'evidenceRail', 'outcome', 'laterThinkingBanner', 'askWidgetMount'],
  Venture: ['header', 'overview', 'productEmbed', 'devLog', 'evidenceRail'],
  Home: ['statement', 'strataTimeline', 'entryList', 'askField'],
  Timeline: ['strataTimeline', 'asOfBar', 'results'],
} as const;

export const REQUIRED_THEME_TOKENS = [
  '--surface-page',
  '--surface-raised',
  '--text',
  '--text-muted',
  '--rule',
  '--accent',
  '--focus-ring',
  '--role-goal',
  '--role-approach',
  '--role-friction',
  '--role-decision',
  '--role-outcome',
  '--role-lesson',
] as const;

export interface ThemeDefinition {
  id: string;
  name: string;
  lightTokens: Record<string, string>;
  darkTokens: Record<string, string>;
  slots: Record<keyof typeof REQUIRED_THEME_SLOTS, string[]>;
  supportsNoJs: boolean;
}

export function verifyThemeConformance(theme: ThemeDefinition): {
  valid: boolean;
  missingSlots: string[];
  missingTokens: string[];
} {
  const missingSlots: string[] = [];
  for (const [view, required] of Object.entries(REQUIRED_THEME_SLOTS)) {
    const provided = theme.slots[view as keyof typeof REQUIRED_THEME_SLOTS] || [];
    for (const slot of required) {
      if (!provided.includes(slot)) {
        missingSlots.push(`${view}.${slot}`);
      }
    }
  }

  const missingTokens: string[] = [];
  for (const token of REQUIRED_THEME_TOKENS) {
    if (!theme.lightTokens[token]) missingTokens.push(`light:${token}`);
    if (!theme.darkTokens[token]) missingTokens.push(`dark:${token}`);
  }

  return {
    valid: missingSlots.length === 0 && missingTokens.length === 0 && theme.supportsNoJs,
    missingSlots,
    missingTokens,
  };
}

export const DEFAULT_STRATA_THEME: ThemeDefinition = {
  id: 'strata-default',
  name: 'Strata (Default)',
  supportsNoJs: true,
  lightTokens: {
    '--surface-page': '#F3F5F4',
    '--surface-raised': '#FFFFFF',
    '--text': '#14202A',
    '--text-muted': '#4B5A66',
    '--rule': '#CBD3D8',
    '--accent': '#3A4FD0',
    '--focus-ring': '#3A4FD0',
    '--role-goal': '#2F5FA8',
    '--role-approach': '#5A5F6B',
    '--role-friction': '#9A6A00',
    '--role-decision': '#5B3FA0',
    '--role-outcome': '#1F7A5A',
    '--role-lesson': '#A13A6B',
  },
  darkTokens: {
    '--surface-page': '#0F1A22',
    '--surface-raised': '#16232D',
    '--text': '#E6ECEF',
    '--text-muted': '#A3B2BD',
    '--rule': '#2A3946',
    '--accent': '#9AA8FF',
    '--focus-ring': '#9AA8FF',
    '--role-goal': '#8DB4EA',
    '--role-approach': '#B4B9C4',
    '--role-friction': '#E2B34A',
    '--role-decision': '#B9A4EE',
    '--role-outcome': '#6FCBA3',
    '--role-lesson': '#EE9CC2',
  },
  slots: {
    EntryArticle: ['header', 'contextStrip', 'body', 'marginRail', 'laterThinkingBanner', 'related', 'askWidgetMount'],
    EntryStructured: ['header', 'contextStrip', 'roleSections', 'evidenceRail', 'outcome', 'laterThinkingBanner', 'askWidgetMount'],
    Venture: ['header', 'overview', 'productEmbed', 'devLog', 'evidenceRail'],
    Home: ['statement', 'strataTimeline', 'entryList', 'askField'],
    Timeline: ['strataTimeline', 'asOfBar', 'results'],
  },
};

/**
 * 3. Notification Channel Interface (§13.9, §14)
 */
export interface AlertPayload {
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  link?: string;
}

export interface NotificationChannel {
  id: string;
  name: string;
  send(alert: AlertPayload): Promise<{ delivered: boolean; timestamp: string }>;
  test(): Promise<{ ok: boolean; latencyMs: number }>;
}

/**
 * 4. Backup Destination Interface (§13.9, §14)
 */
export interface BackupArtifact {
  key: string;
  sizeBytes: number;
  createdAt: string;
  encryptedWith: 'age';
  checksumSha256: string;
}

export interface BackupDestination {
  id: string;
  name: string;
  put(key: string, data: Uint8Array): Promise<BackupArtifact>;
  get(key: string): Promise<Uint8Array | null>;
  list(): Promise<BackupArtifact[]>;
  delete(key: string): Promise<boolean>;
}

/**
 * 5. Payment Provider Interface (§14, §16)
 */
export interface PaymentProvider {
  id: string;
  name: string;
  createCheckout(options: {
    tier: 'tier2_question' | 'tier3_session';
    amountCents: number;
    currency: string;
    question?: string;
  }): Promise<{ checkoutUrl: string; sessionId: string }>;
  verifyWebhook(payload: string, signature: string): Promise<{ valid: boolean; eventType: string }>;
}
