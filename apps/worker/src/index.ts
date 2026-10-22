import PgBoss from 'pg-boss';
import {
  createDbPool,
  closeDbPool,
  createDrizzleDb,
  assertSchemaVersion,
  PostgresPortfolioRepository,
  InMemoryPortfolioRepository,
  type IPortfolioRepository,
} from '@living-portfolio/db';
import { PortfolioWorker } from './worker.js';
import { WorkerQueueManager, QUEUE_NAMES } from './queue.js';

export * from './worker.js';
export * from './queue.js';

export interface WorkerProcessOptions {
  databaseUrl?: string;
  repo?: IPortfolioRepository;
  boss?: PgBoss;
  worker?: PortfolioWorker;
}

export interface WorkerProcessInstance {
  boss: PgBoss | null;
  queueManager: WorkerQueueManager | null;
  worker: PortfolioWorker;
  repo: IPortfolioRepository;
  stop: () => Promise<void>;
}

/**
 * Initializes and starts the background worker process daemon (§8, §13, Fix 8, P3).
 * When DATABASE_URL is available, connects to Postgres via pg-boss and mounts persistent queues.
 */
export async function startWorkerProcess(
  options?: WorkerProcessOptions
): Promise<WorkerProcessInstance> {
  const databaseUrl = options?.databaseUrl ?? process.env.DATABASE_URL;

  let repo: IPortfolioRepository;
  let boss: PgBoss | null = null;
  let queueManager: WorkerQueueManager | null = null;

  if (options?.repo) {
    repo = options.repo;
  } else if (databaseUrl) {
    const pool = createDbPool({ connectionString: databaseUrl });
    await assertSchemaVersion(pool);
    repo = new PostgresPortfolioRepository(createDrizzleDb(pool));
  } else {
    repo = new InMemoryPortfolioRepository();
  }

  const worker = options?.worker ?? new PortfolioWorker({ repo });

  if (options?.boss) {
    boss = options.boss;
    queueManager = new WorkerQueueManager(boss, worker);
    await queueManager.registerWorkers();
  } else if (databaseUrl) {
    boss = new PgBoss(databaseUrl);
    await boss.start();
    queueManager = new WorkerQueueManager(boss, worker);
    await queueManager.registerWorkers();
  }

  const stop = async () => {
    if (boss) {
      await boss.stop({ graceful: true, timeout: 5000 });
    }
    if (databaseUrl && !options?.repo) {
      await closeDbPool();
    }
  };

  return {
    boss,
    queueManager,
    worker,
    repo,
    stop,
  };
}

// Automatically start when executed directly as CLI / process entrypoint
const isMain =
  typeof process !== 'undefined' &&
  process.argv[1] &&
  (process.argv[1].endsWith('worker.js') || process.argv[1].endsWith('index.js'));

if (isMain) {
  startWorkerProcess()
    .then((instance) => {
      console.log(
        `[Worker] Living Portfolio background daemon running. Mode: ${
          instance.boss ? 'Postgres pg-boss' : 'In-memory standalone'
        }`
      );

      const handleSignal = async (sig: string) => {
        console.log(`[Worker] Received ${sig}, shutting down gracefully...`);
        try {
          await instance.stop();
          console.log('[Worker] Graceful shutdown completed.');
          process.exit(0);
        } catch (err) {
          console.error('[Worker] Error during shutdown:', err);
          process.exit(1);
        }
      };

      process.on('SIGINT', () => handleSignal('SIGINT'));
      process.on('SIGTERM', () => handleSignal('SIGTERM'));
    })
    .catch((err) => {
      console.error('[Worker] Fatal error starting worker daemon:', err);
      process.exit(1);
    });
}
