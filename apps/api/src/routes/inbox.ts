import { Hono } from 'hono';
import type { IPortfolioRepository } from '@living-portfolio/db';

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

    // If rejection included a technical constraint, mine it as a proposed scoped constraint (§11)
    if (technicalConstraint && typeof technicalConstraint === 'object') {
      await repo.saveScopedConstraint({
        constraint: technicalConstraint,
        scope: existing.facets || {},
        source_escalation: id,
        source_quote: reason || 'Owner rejected with technical boundary condition',
        status: 'proposed',
      });
    }

    return c.json({ escalation: updated, minedConstraint: !!technicalConstraint });
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
