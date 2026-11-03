import type { SourceConnector, ImportedAsset, PluginPermissions } from './index.js';
import type { TemporalLevel } from '../types/index.js';

/**
 * Core Source Connectors (§14: GitHub, RSS, File Drop)
 */

export class GitHubConnector implements SourceConnector {
  public readonly id = 'github';
  public readonly name = 'GitHub Repository Connector';
  public readonly permissions: PluginPermissions = {
    networkHosts: ['api.github.com', 'raw.githubusercontent.com'],
    dataClasses: ['public'],
  };

  private token?: string;

  constructor(options?: { token?: string }) {
    this.token = options?.token;
  }

  async authenticate(credentials: Record<string, string> = {}): Promise<boolean> {
    if (credentials.token) {
      this.token = credentials.token;
      return true;
    }
    // Public unauthenticated access is permitted for open repositories
    return true;
  }

  inferTemporalConfidence(rawItem: Record<string, any>): {
    valid_from?: string;
    temporal_level: TemporalLevel;
    confidence: number;
  } {
    const dateStr = rawItem.date || rawItem.committed_date || rawItem.published_at;
    if (dateStr && !isNaN(Date.parse(dateStr))) {
      return {
        valid_from: new Date(dateStr).toISOString(),
        temporal_level: 'exact',
        confidence: 0.95,
      };
    }
    return {
      temporal_level: 'estimated',
      confidence: 0.5,
    };
  }

  async *crawl(options?: {
    repo?: string;
    items?: Array<Record<string, any>>;
    since?: string;
    limit?: number;
  }): AsyncGenerator<ImportedAsset, void, unknown> {
    const limit = options?.limit ?? 50;
    const providedItems = options?.items ?? [];

    let count = 0;
    for (const item of providedItems) {
      if (count >= limit) break;

      const temporal = this.inferTemporalConfidence(item);
      yield {
        externalId: String(item.id || item.sha || item.path || `gh-${count + 1}`),
        title: item.title || item.message?.split('\n')[0] || `Commit ${item.sha || count + 1}`,
        bodyMd: item.body || item.content || item.message || '',
        sourceUrl: item.html_url || (options?.repo ? `https://github.com/${options.repo}/commit/${item.sha}` : undefined),
        occurredAt: temporal.valid_from,
        temporalLevel: temporal.temporal_level,
        suggestedProfile: item.profile || 'case-study',
        facets: item.facets,
      };
      count++;
    }
  }
}

export class RSSConnector implements SourceConnector {
  public readonly id = 'rss';
  public readonly name = 'RSS / Atom Feed Connector';
  public readonly permissions: PluginPermissions = {
    networkHosts: ['*'],
    dataClasses: ['public'],
  };

  async authenticate(): Promise<boolean> {
    return true; // RSS feeds are public read-only endpoints
  }

  inferTemporalConfidence(rawItem: Record<string, any>): {
    valid_from?: string;
    temporal_level: TemporalLevel;
    confidence: number;
  } {
    const pubDate = rawItem.pubDate || rawItem.published || rawItem.isoDate || rawItem.date;
    if (pubDate && !isNaN(Date.parse(pubDate))) {
      return {
        valid_from: new Date(pubDate).toISOString(),
        temporal_level: 'exact',
        confidence: 0.9,
      };
    }
    return {
      temporal_level: 'estimated',
      confidence: 0.6,
    };
  }

  async *crawl(options?: {
    feedUrl?: string;
    items?: Array<Record<string, any>>;
    limit?: number;
  }): AsyncGenerator<ImportedAsset, void, unknown> {
    const limit = options?.limit ?? 50;
    const rawItems = options?.items ?? [];

    let count = 0;
    for (const item of rawItems) {
      if (count >= limit) break;

      const temporal = this.inferTemporalConfidence(item);
      yield {
        externalId: String(item.guid || item.id || item.link || `rss-${count + 1}`),
        title: item.title || `Feed Item ${count + 1}`,
        bodyMd: item.contentSnippet || item.content || item.description || '',
        sourceUrl: item.link || options?.feedUrl,
        occurredAt: temporal.valid_from,
        temporalLevel: temporal.temporal_level,
        suggestedProfile: 'writing',
        facets: item.facets,
      };
      count++;
    }
  }
}

export class FileDropConnector implements SourceConnector {
  public readonly id = 'file-drop';
  public readonly name = 'File Drop Connector';
  public readonly permissions: PluginPermissions = {
    filesystemPaths: ['/'],
    dataClasses: ['public', 'private', 'sensitive'],
  };

  async authenticate(): Promise<boolean> {
    return true;
  }

  inferTemporalConfidence(rawItem: Record<string, any>): {
    valid_from?: string;
    temporal_level: TemporalLevel;
    confidence: number;
  } {
    const dateStr = rawItem.modifiedAt || rawItem.mtime || rawItem.createdAt;
    if (dateStr && !isNaN(Date.parse(dateStr))) {
      return {
        valid_from: new Date(dateStr).toISOString(),
        temporal_level: 'exact',
        confidence: 0.85,
      };
    }
    return {
      temporal_level: 'estimated',
      confidence: 0.5,
    };
  }

  async *crawl(options?: {
    files?: Array<{ name: string; content: string; modifiedAt?: string; dataClass?: string }>;
    limit?: number;
  }): AsyncGenerator<ImportedAsset, void, unknown> {
    const limit = options?.limit ?? 100;
    const files = options?.files ?? [];

    let count = 0;
    for (const file of files) {
      if (count >= limit) break;

      const temporal = this.inferTemporalConfidence(file);
      const title = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');

      yield {
        externalId: `file-${file.name}`,
        title,
        bodyMd: file.content,
        occurredAt: temporal.valid_from,
        temporalLevel: temporal.temporal_level,
        suggestedProfile: 'case-study',
        facets: file.dataClass ? { data_class: file.dataClass } : undefined,
      };
      count++;
    }
  }
}
