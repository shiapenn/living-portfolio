import { Hono } from 'hono';
import type { IPortfolioRepository } from '@living-portfolio/db';
import { isTemporallyValid } from '@living-portfolio/core';

export function createTimelineRoutes(repo: IPortfolioRepository) {
  const router = new Hono();

  // Get Strata Timeline aggregate data
  router.get('/', async (c) => {
    const asOfParam = c.req.query('as_of');
    const entries = await repo.listEntries({ visibility: ['public'] });

    // Aggregate entries by month/year
    const strataBuckets: Record<
      string,
      {
        yearMonth: string;
        count: number;
        entries: { id: string; slug: string; title: string; profile: string }[];
        profileCounts: Record<string, number>;
      }
    > = {};

    for (const entry of entries) {
      const full = await repo.getEntry(entry.id);
      if (!full || !full.currentRevision) continue;

      const rev = full.currentRevision;
      const eventDate = rev.valid_from ? new Date(rev.valid_from) : new Date(rev.written_at);
      const yearMonth = `${eventDate.getFullYear()}-${String(eventDate.getMonth() + 1).padStart(2, '0')}`;

      if (!strataBuckets[yearMonth]) {
        strataBuckets[yearMonth] = {
          yearMonth,
          count: 0,
          entries: [],
          profileCounts: {},
        };
      }

      strataBuckets[yearMonth].count++;
      strataBuckets[yearMonth].entries.push({
        id: entry.id,
        slug: entry.slug,
        title: entry.title,
        profile: entry.profile,
      });

      strataBuckets[yearMonth].profileCounts[entry.profile] =
        (strataBuckets[yearMonth].profileCounts[entry.profile] || 0) + 1;
    }

    const sortedBuckets = Object.values(strataBuckets).sort((a, b) =>
      a.yearMonth.localeCompare(b.yearMonth)
    );

    // If as_of query provided, filter entries valid as of that date
    let timeTravelView = null;
    if (asOfParam) {
      const asOfDate = new Date(asOfParam);
      const visibleEntries: any[] = [];
      let futureExcludedCount = 0;

      for (const entry of entries) {
        const full = await repo.getEntry(entry.id);
        if (!full || !full.currentRevision) continue;

        const check = isTemporallyValid(full.currentRevision, asOfDate);
        if (check.valid) {
          visibleEntries.push({
            id: entry.id,
            slug: entry.slug,
            title: entry.title,
            profile: entry.profile,
            decayWeight: check.decayWeight,
          });
        } else {
          futureExcludedCount++;
        }
      }

      timeTravelView = {
        asOfDate: asOfDate.toISOString(),
        formattedHeader: `Viewing as of ${asOfDate.toLocaleString('default', { month: 'long', year: 'numeric' })}`,
        visibleEntries,
        futureExcludedCount,
      };
    }

    return c.json({
      strataBuckets: sortedBuckets,
      timeTravelView,
    });
  });

  return router;
}
