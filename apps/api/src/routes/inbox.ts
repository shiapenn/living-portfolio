import { Hono } from 'hono';
import type { IPortfolioRepository } from '@living-portfolio/db';
import { mineScopedConstraintFromRejection } from '@living-portfolio/core';

export function createInboxRoutes(repo: IPortfolioRepository) {
  const router = new Hono();

  // List escalations
  router.get('/', async (c) => {
    const status = c.req.query('status') || 'pending';
    const escalations = await repo.getEscalations(status);
    return c.json({ escalations });
  });

  // Review & approve escalation
  router.patch('/:id/approve', async (c) => {
    const id = c.req.param('id');
    const { finalReply } = await c.req.json();

    const escalations = await repo.getEscalations();
    const existing = escalations.find((e) => e.id === id);
    if (!existing) return c.json({ error: 'Escalation not found' }, 404);

    // Compute edit distance ratio as quality signal (§6.2, §11)
    const draft = existing.draft || '';
    const editDist = computeEditDistance(draft, finalReply);
    const maxLen = Math.max(draft.length, finalReply.length, 1);
    const normalizedEditDist = editDist / maxLen;

    const updated = await repo.updateEscalation(id, {
      final: finalReply,
      status: 'approved',
      draft_edit_distance: Number(normalizedEditDist.toFixed(3)),
    });

    // Save correction log for routing calibration (§11)
    await repo.saveCorrection({
      kind: 'escalation_reply',
      owner_action: 'edit',
      edit_distance: normalizedEditDist,
    });

    return c.json({ escalation: updated });
  });

  // Reject escalation with reason (Scoped Constraint Mining §11)
  router.patch('/:id/reject', async (c) => {
    const id = c.req.param('id');
    const { reason, technicalConstraint } = await c.req.json();

    const escalations = await repo.getEscalations();
    const existing = escalations.find((e) => e.id === id);
    if (!existing) return c.json({ error: 'Escalation not found' }, 404);

    const updated = await repo.updateEscalation(id, {
      status: 'rejected',
      rejection_reason: reason || 'Declined without specific constraint',
    });

    // Automated Scoped Constraint Mining (§11, Fix 17)
    let mined: { isTechnical: boolean; constraint?: Record<string, any>; quote?: string } = { isTechnical: false };
    if (technicalConstraint && typeof technicalConstraint === 'object') {
      mined = {
        isTechnical: true,
        constraint: technicalConstraint,
        quote: reason || 'Owner provided technical constraint',
      };
    } else if (reason) {
      mined = mineScopedConstraintFromRejection(reason, existing.facets);
    }

    if (mined.isTechnical && mined.constraint) {
      await repo.saveScopedConstraint({
        constraint: mined.constraint,
        scope: existing.facets || {},
        source_escalation: id,
        source_quote: mined.quote || reason || 'Technical constraint mined from rejection',
        status: 'proposed', // Invariant: ALWAYS proposed! Never active/confirmed without owner action!
      });
    }

    return c.json({ escalation: updated, minedConstraint: mined.isTechnical, constraint: mined.constraint });
  });

  return router;
}

// Levenshtein distance algorithm
function computeEditDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }

  return dp[m][n];
}
