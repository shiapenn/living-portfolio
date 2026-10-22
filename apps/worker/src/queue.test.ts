import { describe, it, expect } from 'vitest';
import { InMemoryPortfolioRepository } from '@living-portfolio/db';
import { PortfolioWorker } from './worker.js';
import { WorkerQueueManager, QUEUE_NAMES } from './queue.js';
import { startWorkerProcess } from './index.js';
import PgBoss from 'pg-boss';

/**
 * Mock PgBoss implementation for in-memory unit tests
 */
class MockPgBoss {
  public handlers = new Map<string, (job: any) => Promise<any>>();
  public jobs: Array<{ name: string; data: any }> = [];
  public isStarted = false;
  public isStopped = false;

  async start() {
    this.isStarted = true;
    return this;
  }

  async stop() {
    this.isStopped = true;
  }

  async work<T>(name: string, handler: (jobs: Array<{ data: T }>) => Promise<any>) {
    this.handlers.set(name, handler);
    return 'mock-worker-id';
  }

  async send(name: string, data: any) {
    this.jobs.push({ name, data });
    return `job-${this.jobs.length}`;
  }
}

describe('WorkerQueueManager & Process Lifecycle (Fix 8, P3)', () => {
  it('registers workers across all 5 queues and reports active health', async () => {
    const mockBoss = new MockPgBoss();
    const repo = new InMemoryPortfolioRepository();
    const worker = new PortfolioWorker({ repo });
    const queueManager = new WorkerQueueManager(mockBoss as unknown as PgBoss, worker);

    const registered = await queueManager.registerWorkers();
    expect(registered).toEqual([
      QUEUE_NAMES.INGEST,
      QUEUE_NAMES.EMBED,
      QUEUE_NAMES.ENRICH,
      QUEUE_NAMES.PUBLISH,
      QUEUE_NAMES.DELETE_ENTRY,
    ]);

    const health = queueManager.getHealth();
    expect(health.status).toBe('active');
    expect(health.activeWorkers).toBe(5);
    expect(health.registeredQueues.length).toBe(5);
  });

  it('enqueues and executes ingest -> embed -> enrich pipeline with autoChain', async () => {
    const mockBoss = new MockPgBoss();
    const repo = new InMemoryPortfolioRepository();
    const worker = new PortfolioWorker({ repo });
    const queueManager = new WorkerQueueManager(mockBoss as unknown as PgBoss, worker);
    await queueManager.registerWorkers();

    // 1. Enqueue Ingest with autoChain: true
    await queueManager.enqueueIngest({
      slug: 'queue-driven-case-study',
      title: 'Queue Driven Architecture',
      body_md: 'We implemented background workers with pg-boss and Postgres. It worked reliably.',
      autoChain: true,
    });

    expect(mockBoss.jobs.length).toBe(1);
    expect(mockBoss.jobs[0].name).toBe(QUEUE_NAMES.INGEST);

    // Simulate worker processing ingest job
    const ingestHandler = mockBoss.handlers.get(QUEUE_NAMES.INGEST)!;
    const ingestResult = await ingestHandler([{ data: mockBoss.jobs[0].data }]);

    expect(ingestResult.entry.slug).toBe('queue-driven-case-study');
    expect(ingestResult.spans.length).toBeGreaterThan(0);

    // autoChain should have enqueued embed job
    expect(mockBoss.jobs.length).toBe(2);
    expect(mockBoss.jobs[1].name).toBe(QUEUE_NAMES.EMBED);
    expect(mockBoss.jobs[1].data.revisionId).toBe(ingestResult.revision.id);

    // Simulate worker processing embed job
    const embedHandler = mockBoss.handlers.get(QUEUE_NAMES.EMBED)!;
    const embedResult = await embedHandler([{ data: mockBoss.jobs[1].data }]);

    expect(embedResult.savedVectorsCount).toBe(ingestResult.spans.length);
    const savedVectors = await repo.getChunkVectorsForRevision(ingestResult.revision.id);
    expect(savedVectors.length).toBe(ingestResult.spans.length);

    // autoChain should have enqueued enrich job
    expect(mockBoss.jobs.length).toBe(3);
    expect(mockBoss.jobs[2].name).toBe(QUEUE_NAMES.ENRICH);
    expect(mockBoss.jobs[2].data.entryId).toBe(ingestResult.entry.id);

    // Simulate worker processing enrich job
    const enrichHandler = mockBoss.handlers.get(QUEUE_NAMES.ENRICH)!;
    const enrichResult = await enrichHandler([{ data: mockBoss.jobs[2].data }]);

    expect(enrichResult.claimsSuggested).toBeGreaterThan(0);
    expect(enrichResult.gapQuestions.length).toBeLessThanOrEqual(3);
  });

  it('enqueues publish and delete jobs and executes handlers correctly', async () => {
    const mockBoss = new MockPgBoss();
    const repo = new InMemoryPortfolioRepository();
    const worker = new PortfolioWorker({ repo });
    const queueManager = new WorkerQueueManager(mockBoss as unknown as PgBoss, worker);
    await queueManager.registerWorkers();

    // Ingest an entry to delete later
    const { entry } = await worker.runIngestJob({
      slug: 'to-delete',
      title: 'To Delete',
      body_md: 'Ephemeral entry.',
    });

    // Test publish queue
    await queueManager.enqueuePublish({ forceNow: true });
    expect(mockBoss.jobs.some((j) => j.name === QUEUE_NAMES.PUBLISH)).toBe(true);
    const publishHandler = mockBoss.handlers.get(QUEUE_NAMES.PUBLISH)!;
    const publishResult = await publishHandler([{ data: { forceNow: true } }]);
    expect(publishResult.built).toBe(true);

    // Test delete queue
    await queueManager.enqueueDeleteEntry({ entryId: entry.id });
    expect(mockBoss.jobs.some((j) => j.name === QUEUE_NAMES.DELETE_ENTRY)).toBe(true);
    const deleteHandler = mockBoss.handlers.get(QUEUE_NAMES.DELETE_ENTRY)!;
    const deleteResult = await deleteHandler([{ data: { entryId: entry.id } }]);
    expect(deleteResult.deletedRevisions).toBe(1);
  });

  it('boots standalone worker process instance with graceful stop', async () => {
    const repo = new InMemoryPortfolioRepository();
    const mockBoss = new MockPgBoss();

    const instance = await startWorkerProcess({
      repo,
      boss: mockBoss as unknown as PgBoss,
    });

    expect(instance.worker).toBeDefined();
    expect(instance.queueManager).toBeDefined();
    expect(instance.queueManager?.getHealth().status).toBe('active');

    // Graceful stop
    await instance.stop();
    expect(mockBoss.isStopped).toBe(true);
  });
});

const isDatabaseConfigured = Boolean(process.env.DATABASE_URL);

describe.skipIf(!isDatabaseConfigured)(
  'pg-boss Live PostgreSQL Integration Suite (CI Service Container, Fix 8, Fix 10, OSR-15)',
  () => {
    it('connects pg-boss to live PostgreSQL, registers queue, sends and fetches job', async () => {
      const boss = new PgBoss(process.env.DATABASE_URL!);
      await boss.start();

      const testQueue = 'lp:test-live-queue';
      let processedData: any = null;

      await boss.work(testQueue, async (job) => {
        processedData = job.data;
      });

      const jobId = await boss.send(testQueue, { test: 'live-pgboss', timestamp: Date.now() });
      expect(jobId).toBeDefined();

      // Allow job to be polled and processed
      for (let i = 0; i < 30; i++) {
        if (processedData) break;
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      expect(processedData).toEqual(
        expect.objectContaining({ test: 'live-pgboss' })
      );

      await boss.stop({ graceful: true, timeout: 3000 });
    });
  }
);
