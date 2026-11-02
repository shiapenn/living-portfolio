import PgBoss from 'pg-boss';
import type { PortfolioWorker } from './worker.js';

export const QUEUE_NAMES = {
  INGEST: 'lp:ingest',
  EMBED: 'lp:embed',
  ENRICH: 'lp:enrich',
  PUBLISH: 'lp:publish',
  DELETE_ENTRY: 'lp:delete-entry',
} as const;

export type QueueName = typeof QUEUE_NAMES[keyof typeof QUEUE_NAMES];

export interface IngestJobPayload {
  slug: string;
  title: string;
  body_md: string;
  profile?: string;
  visibility?: 'private' | 'unlisted' | 'public';
  valid_from?: string;
  temporal_level?: 'exact' | 'range' | 'estimated';
  is_hindsight?: boolean;
  autoChain?: boolean;
}

export interface EmbedJobPayload {
  revisionId: string;
  entryId?: string;
  autoChain?: boolean;
}

export interface EnrichJobPayload {
  entryId: string;
  revisionId: string;
}

export interface PublishJobPayload {
  forceNow?: boolean;
  nowMs?: number;
  outputDir?: string;
}

export interface DeleteEntryJobPayload {
  entryId: string;
}

export class WorkerQueueManager {
  private boss: PgBoss;
  private worker: PortfolioWorker;
  private registeredQueues: string[] = [];
  private isListening = false;

  constructor(boss: PgBoss, worker: PortfolioWorker) {
    this.boss = boss;
    this.worker = worker;
  }

  async registerWorkers(): Promise<string[]> {
    if (this.isListening) {
      return this.registeredQueues;
    }

    // 1. Ingest Handler
    await this.boss.work<IngestJobPayload>(QUEUE_NAMES.INGEST, async (jobs) => {
      const results = [];
      for (const job of jobs) {
        const result = await this.worker.runIngestJob(job.data);
        if (job.data.autoChain) {
          await this.boss.send(QUEUE_NAMES.EMBED, {
            revisionId: result.revision.id,
            entryId: result.entry.id,
            autoChain: true,
          });
        }
        results.push(result);
      }
      return results.length === 1 ? results[0] : results;
    });
    this.registeredQueues.push(QUEUE_NAMES.INGEST);

    // 2. Embed Handler
    await this.boss.work<EmbedJobPayload>(QUEUE_NAMES.EMBED, async (jobs) => {
      const results = [];
      for (const job of jobs) {
        const result = await this.worker.runEmbedJob(job.data.revisionId);
        if (job.data.autoChain && job.data.entryId) {
          await this.boss.send(QUEUE_NAMES.ENRICH, {
            entryId: job.data.entryId,
            revisionId: job.data.revisionId,
          });
        }
        results.push(result);
      }
      return results.length === 1 ? results[0] : results;
    });
    this.registeredQueues.push(QUEUE_NAMES.EMBED);

    // 3. Enrich Handler
    await this.boss.work<EnrichJobPayload>(QUEUE_NAMES.ENRICH, async (jobs) => {
      const results = [];
      for (const job of jobs) {
        results.push(await this.worker.runEnrichJob(job.data.entryId, job.data.revisionId));
      }
      return results.length === 1 ? results[0] : results;
    });
    this.registeredQueues.push(QUEUE_NAMES.ENRICH);

    // 4. Publish Handler
    await this.boss.work<PublishJobPayload>(QUEUE_NAMES.PUBLISH, async (jobs) => {
      const results = [];
      for (const job of jobs) {
        results.push(await this.worker.runPublishStaticSiteJob(job.data));
      }
      return results.length === 1 ? results[0] : results;
    });
    this.registeredQueues.push(QUEUE_NAMES.PUBLISH);

    // 5. Delete Entry Handler
    await this.boss.work<DeleteEntryJobPayload>(QUEUE_NAMES.DELETE_ENTRY, async (jobs) => {
      const results = [];
      for (const job of jobs) {
        results.push(await this.worker.runDeleteEntryJob(job.data.entryId));
      }
      return results.length === 1 ? results[0] : results;
    });
    this.registeredQueues.push(QUEUE_NAMES.DELETE_ENTRY);

    this.isListening = true;
    return this.registeredQueues;
  }

  async enqueueIngest(payload: IngestJobPayload): Promise<string | null> {
    return this.boss.send(QUEUE_NAMES.INGEST, payload);
  }

  async enqueueEmbed(payload: EmbedJobPayload): Promise<string | null> {
    return this.boss.send(QUEUE_NAMES.EMBED, payload);
  }

  async enqueueEnrich(payload: EnrichJobPayload): Promise<string | null> {
    return this.boss.send(QUEUE_NAMES.ENRICH, payload);
  }

  async enqueuePublish(payload: PublishJobPayload = {}): Promise<string | null> {
    return this.boss.send(QUEUE_NAMES.PUBLISH, payload);
  }

  async enqueueDeleteEntry(payload: DeleteEntryJobPayload): Promise<string | null> {
    return this.boss.send(QUEUE_NAMES.DELETE_ENTRY, payload);
  }

  getHealth() {
    return {
      status: this.isListening ? 'active' : 'idle',
      registeredQueues: [...this.registeredQueues],
      activeWorkers: this.registeredQueues.length,
    };
  }

  getBoss(): PgBoss {
    return this.boss;
  }
}
