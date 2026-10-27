import { chunkMarkdown } from '@living-portfolio/core';
import type { IPortfolioRepository } from './repository.js';

/**
 * Seeds a rich, realistic multi-year portfolio corpus spanning L0–L3 structure levels,
 * bitemporal revisions, hindsight entries, ventures, accepted `supersedes` relations,
 * verified evidence, inbox escalations, and topology conflict reports.
 */
export async function seedDemoPortfolio(repo: IPortfolioRepository): Promise<void> {
  const existing = await repo.listEntries({ visibility: ['public', 'unlisted', 'private'] });
  if (existing.length > 0) return;

  // 1. Ventures (§3.10)
  const strataVenture = await repo.createVenture({
    slug: 'strata-engine',
    name: 'Strata Engine',
    description: 'Time-aware knowledge graph and static-first portfolio runtime for engineers and designers.',
    status: 'live',
    links: {
      live: 'https://strata.example.com',
      repo: 'https://github.com/example/strata-engine',
      demo: 'https://strata.example.com/demo',
    },
    started_at: '2023-02-01T00:00:00Z',
    facets: {
      stack: 'TypeScript, PostgreSQL, Astro',
      scale: 'Single-node / Edge CDN',
      domain: 'Knowledge Systems',
    },
  });

  const pulseVenture = await repo.createVenture({
    slug: 'pg-pulse',
    name: 'pg-pulse',
    description: 'Zero-dependency PostgreSQL lock contention profiler and queue health monitor.',
    status: 'maintained',
    links: {
      repo: 'https://github.com/example/pg-pulse',
    },
    started_at: '2021-06-15T00:00:00Z',
    facets: {
      stack: 'Go, PostgreSQL 15',
      scale: '50k TPS',
      domain: 'Database Infrastructure',
    },
  });

  // 2. Entry 1 (2021): Earlier approach using Redis locks (will be superseded by 2024 entry -> triggers Later-Thinking Banner §10.7)
  const entry2021Body = `## The goal
We needed distributed job coordination across 16 worker nodes processing billing webhooks without double-charging customers.

## What I did
We deployed a 3-node Redis cluster using Redlock leases with a 5-second TTL around every webhook processor.

## What got in the way
During a network partition between availability zones, clock drift caused lock leases to overlap for 180ms before fencing tokens were checked.

## The decision
We chose Redis Redlock with short TTLs and idempotency keys in Postgres as a secondary guard.

## What happened
It worked partly: duplicate webhooks dropped by 99.4%, but maintaining a separate Redis cluster purely for locking added operational overhead during failovers.

## What I'd tell someone else
Use Redis distributed locks when you already run Redis at scale, but always pair lock acquisition with database-level idempotency constraints.`;

  const { entry: e2021, revision: rev2021 } = await repo.createEntry(
    {
      slug: 'redis-distributed-locks-2021',
      title: 'Distributed Webhook Coordination with Redis Locks',
      profile: 'case-study',
      view: 'structured',
      visibility: 'public',
      venture_id: pulseVenture.id,
      current_revision_id: null,
    },
    {
      body_md: entry2021Body,
      body_hash: 'sha256-2021-redis',
      written_at: '2021-09-14T10:00:00Z',
      valid_from: '2021-08-01T00:00:00Z',
      valid_to: '2024-03-10T00:00:00Z',
      temporal_level: 'exact',
      is_hindsight: false,
    }
  );

  const spans2021 = await repo.saveSpans(chunkMarkdown(rev2021.id, entry2021Body, { targetTokens: 60, maxTokens: 120 }));
  await repo.saveFacet({
    entry_id: e2021.id,
    revision_id: rev2021.id,
    key: 'database',
    value: 'Redis + PostgreSQL',
    source: 'owner',
    status: 'confirmed',
    confidence: 1.0,
    source_span_id: spans2021[0]?.id,
  });
  await repo.saveFacet({
    entry_id: e2021.id,
    revision_id: rev2021.id,
    key: 'scale',
    value: '16 worker nodes',
    source: 'owner',
    status: 'confirmed',
    confidence: 1.0,
  });

  if (spans2021[0]) {
    await repo.saveAnnotation({ span_id: spans2021[0].id, role: 'goal', profile: 'case-study', source: 'owner', status: 'accepted', confidence: 1.0 });
    await repo.saveAnnotation({ span_id: spans2021[0].id, role: 'decision', profile: 'case-study', source: 'owner', status: 'accepted', confidence: 1.0 });
  }

  const claim2021 = await repo.saveClaim({
    revision_id: rev2021.id,
    text: 'Use Redis Redlock leases for distributed job coordination across worker nodes.',
    kind: 'decision',
    outcome_status: 'partly',
    scope: { database: 'PostgreSQL', scale: 'under 50k TPS' },
    valid_from: '2021-08-01T00:00:00Z',
    valid_to: '2024-03-10T00:00:00Z',
    temporal_level: 'exact',
    is_hindsight: false,
    source_span_id: spans2021[0]?.id,
    source: 'owner',
    status: 'accepted',
  });

  // 3. Entry 2 (2024): L3 Case Study — Advisory locks revisited (supersedes 2021 claim)
  const entry2024Body = `## The goal
Eliminate the separate Redis lock cluster while keeping p99 webhook coordination latency under 50ms for a team of 12 engineers.

## What I did
We replaced Redis Redlock with transaction-scoped PostgreSQL advisory locks (pg_try_advisory_xact_lock) hashed on the tenant and webhook ID, using PgBouncer in transaction pooling mode.

## What got in the way
Session-level advisory locks leaked across pooled connections in PgBouncer until we switched strictly to transaction-scoped locks tied to short transactions.

## The decision
We standardized on pg_try_advisory_xact_lock inside PostgreSQL 15 and decommissioned the standalone Redis lock cluster.

## What happened
It worked: p99 coordination latency dropped by 40% (to 18ms), zero lock leaks occurred over 6 months, and infrastructure ops dropped by one cluster.

## What I'd tell someone else
When your throughput is under 50k TPS and PostgreSQL is already your source of truth, transaction-scoped advisory locks beat running an external lock service—provided you never hold locks across external HTTP calls.`;

  const { entry: e2024, revision: rev2024 } = await repo.createEntry(
    {
      slug: 'advisory-locks-revisited',
      title: 'Advisory Locks, Revisited: Dropping Redis for Postgres 15',
      profile: 'case-study',
      view: 'structured',
      visibility: 'public',
      venture_id: pulseVenture.id,
      current_revision_id: null,
    },
    {
      body_md: entry2024Body,
      body_hash: 'sha256-2024-advisory',
      written_at: '2024-03-15T14:30:00Z',
      valid_from: '2024-03-10T00:00:00Z',
      valid_to: null,
      temporal_level: 'exact',
      is_hindsight: false,
    }
  );

  const spans2024 = await repo.saveSpans(chunkMarkdown(rev2024.id, entry2024Body, { targetTokens: 60, maxTokens: 120 }));
  const roles2024 = ['goal', 'approach', 'friction', 'decision', 'outcome', 'lesson'];
  for (let i = 0; i < spans2024.length; i++) {
    const role = roles2024[i % roles2024.length];
    await repo.saveAnnotation({
      span_id: spans2024[i].id,
      role,
      profile: 'case-study',
      source: 'owner',
      status: 'accepted',
      confidence: 1.0,
    });
  }

  await repo.saveFacet({
    entry_id: e2024.id,
    revision_id: rev2024.id,
    key: 'database',
    value: 'PostgreSQL',
    source: 'owner',
    status: 'confirmed',
    confidence: 1.0,
    source_span_id: spans2024[0]?.id,
  });
  await repo.saveFacet({
    entry_id: e2024.id,
    revision_id: rev2024.id,
    key: 'stack',
    value: 'PostgreSQL 15, PgBouncer, TypeScript',
    source: 'owner',
    status: 'confirmed',
    confidence: 1.0,
  });
  await repo.saveFacet({
    entry_id: e2024.id,
    revision_id: rev2024.id,
    key: 'team_size',
    value: '12 people',
    source: 'owner',
    status: 'confirmed',
    confidence: 1.0,
  });
  await repo.saveFacet({
    entry_id: e2024.id,
    revision_id: rev2024.id,
    key: 'latency_budget',
    value: 'under 50 ms',
    source: 'machine',
    status: 'suggested',
    confidence: 0.93,
    source_span_id: spans2024[0]?.id,
  });

  const claim2024 = await repo.saveClaim({
    revision_id: rev2024.id,
    text: 'Transaction-scoped PostgreSQL advisory locks (pg_try_advisory_xact_lock) outperform external Redis locks under 50k TPS when paired with short transactions.',
    kind: 'lesson',
    outcome_status: 'worked',
    scope: { database: 'PostgreSQL', scale: 'under 50k TPS' },
    valid_from: '2024-03-10T00:00:00Z',
    valid_to: null,
    temporal_level: 'exact',
    is_hindsight: false,
    source_span_id: spans2024[spans2024.length - 1]?.id,
    source: 'owner',
    status: 'accepted',
  });

  // Supersedes relation linking 2021 claim -> 2024 claim (§3.6, §10.7)
  await repo.saveRelation({
    src_claim: claim2021.id,
    dst_claim: claim2024.id,
    type: 'supersedes',
    scope: { database: 'PostgreSQL', scale: 'under 50k TPS' },
    status: 'accepted',
    valid_from: '2024-03-10T00:00:00Z',
  });

  // Verified Evidence on 2024 entry (§3.8)
  await repo.saveEvidence({
    entry_id: e2024.id,
    claim_id: claim2024.id,
    span_id: spans2024[0]?.id,
    kind: 'commit',
    url: 'https://github.com/example/pg-pulse/pull/482',
    verification: {
      label: 'PR #482, verified GPG signature',
      signer: 'owner@example.com',
      commitSha: '9f8d2a1',
    },
    verified_at: '2024-03-15T15:00:00Z',
  });

  // 4. Entry 3 (2025): L2 Design Project — Designing the Strata Timeline
  const entry2025Body = `## Brief
Design a portfolio interface where a person's accumulated engineering and design work is legible across time without decorative card grids.

## Exploration
We explored node-link force graphs and calendar heatmaps, but force graphs turned into unreadable hairballs past 30 entries and heatmaps hid the nature of the work.

## Iteration
We modeled time as geological strata: each month forms a horizontal layer whose height encodes entry volume and whose fill pattern distinguishes case studies, decisions, and ventures.

## Final
Shipped a keyboard-accessible SVG + HTML strata bar with an "as of" time-travel scrubber and an instant text-equivalent list view.

## Lesson
Visualizing knowledge over time works best when spatial position strictly means chronology and every visual border corresponds to a real schema boundary.`;

  const { entry: e2025, revision: rev2025 } = await repo.createEntry(
    {
      slug: 'designing-strata-timeline',
      title: 'Designing the Strata Timeline: Making Time Legible Without Card Grids',
      profile: 'design-project',
      view: 'structured',
      visibility: 'public',
      venture_id: strataVenture.id,
      current_revision_id: null,
    },
    {
      body_md: entry2025Body,
      body_hash: 'sha256-2025-strata',
      written_at: '2025-07-20T12:00:00Z',
      valid_from: '2025-07-01T00:00:00Z',
      valid_to: null,
      temporal_level: 'exact',
      is_hindsight: false,
    }
  );

  const spans2025 = await repo.saveSpans(chunkMarkdown(rev2025.id, entry2025Body, { targetTokens: 60, maxTokens: 120 }));
  await repo.saveFacet({
    entry_id: e2025.id,
    revision_id: rev2025.id,
    key: 'domain',
    value: 'Design Systems & Accessibility',
    source: 'owner',
    status: 'confirmed',
    confidence: 1.0,
  });
  await repo.saveFacet({
    entry_id: e2025.id,
    revision_id: rev2025.id,
    key: 'stack',
    value: 'CSS Custom Properties, Astro, WCAG 2.2 AA',
    source: 'owner',
    status: 'confirmed',
    confidence: 1.0,
  });
  if (spans2025[0]) {
    await repo.saveAnnotation({ span_id: spans2025[0].id, role: 'brief', profile: 'design-project', source: 'owner', status: 'accepted', confidence: 1.0 });
    await repo.saveAnnotation({ span_id: spans2025[spans2025.length - 1].id, role: 'lesson', profile: 'design-project', source: 'owner', status: 'accepted', confidence: 1.0 });
  }

  // 5. Entry 4 (2026): Hindsight retrospective written in 2026 about 2022 (§3.9 is_hindsight = true)
  const entryHindsightBody = `Looking back from 2026 at our 2022 microservice split: splitting our monolith into 9 services when we only had 4 backend engineers slowed feature delivery by half. Had we used modular monolith boundaries in TypeScript first, we would have avoided 14 months of distributed tracing tax.`;

  const { entry: eHindsight, revision: revHindsight } = await repo.createEntry(
    {
      slug: 'premature-microservices-retrospective',
      title: 'Why Our 2022 Microservice Split Was Premature (2026 Retrospective)',
      profile: 'decision-record',
      view: 'article',
      visibility: 'public',
      venture_id: null,
      current_revision_id: null,
    },
    {
      body_md: entryHindsightBody,
      body_hash: 'sha256-2026-hindsight',
      written_at: '2026-02-10T09:00:00Z',
      valid_from: '2022-05-01T00:00:00Z',
      valid_to: null,
      temporal_level: 'exact',
      is_hindsight: true,
    }
  );
  const spansHindsight = await repo.saveSpans(chunkMarkdown(revHindsight.id, entryHindsightBody));
  await repo.saveClaim({
    revision_id: revHindsight.id,
    text: 'Splitting a monolith into 9 microservices with a 4-person team caused a 50% delivery slowdown.',
    kind: 'outcome',
    outcome_status: 'failed',
    scope: { team_size: '4 people', architecture: 'microservices' },
    valid_from: '2022-05-01T00:00:00Z',
    valid_to: '2023-11-01T00:00:00Z',
    temporal_level: 'exact',
    is_hindsight: true,
    source_span_id: spansHindsight[0]?.id,
    source: 'owner',
    status: 'accepted',
  });

  // 6. Entry 5 (2026): L0 Quick Log / Freeform note on Local ONNX Embeddings
  const entryOnnxBody = `Benchmarked local CPU embeddings using ONNX Runtime (bge-small-en-v1.5, 384d) inside our worker container. Cold load takes 420ms and embedding a 400-token span takes 14ms on a 2-vCPU Arm VM. Zero vendor API quota used and zero risk of forced model retirement.`;

  const { revision: revOnnx } = await repo.createEntry(
    {
      slug: 'local-onnx-embeddings-benchmark',
      title: 'Local CPU Embeddings with ONNX Runtime on Arm64',
      profile: 'freeform',
      view: 'article',
      visibility: 'public',
      venture_id: strataVenture.id,
      current_revision_id: null,
    },
    {
      body_md: entryOnnxBody,
      body_hash: 'sha256-2026-onnx',
      written_at: '2026-08-12T16:00:00Z',
      valid_from: '2026-08-12T00:00:00Z',
      valid_to: null,
      temporal_level: 'exact',
      is_hindsight: false,
    }
  );
  await repo.saveSpans(chunkMarkdown(revOnnx.id, entryOnnxBody));

  // 7. Entry 6: Private entry (must NEVER be cited or retrieved in visitor Ask §3.11)
  const { revision: revPrivate } = await repo.createEntry(
    {
      slug: 'private-nda-architecture-notes',
      title: 'Private NDA Architecture Notes (Internal Only)',
      profile: 'freeform',
      view: 'article',
      visibility: 'private',
      venture_id: null,
      current_revision_id: null,
    },
    {
      body_md: `Confidential internal notes under client NDA: project codename Aurora uses custom FPGA acceleration.`,
      body_hash: 'sha256-private',
      written_at: '2026-09-01T00:00:00Z',
      valid_from: '2026-09-01T00:00:00Z',
      valid_to: null,
      temporal_level: 'exact',
      is_hindsight: false,
    }
  );
  await repo.saveSpans(chunkMarkdown(revPrivate.id, `Confidential internal notes under client NDA: project codename Aurora uses custom FPGA acceleration.`));

  // 8. Seed Escalation in Inbox (§6.2)
  await repo.saveEscalation({
    question: 'Should we use PostgreSQL advisory locks if our webhook workers hold locks across 2-second third-party Stripe API calls?',
    query_class: 'advisory',
    facets: { database: 'PostgreSQL 15', stack: 'Node.js, PgBouncer', latency_budget: '2000ms external HTTP' },
    draft: 'In "Advisory Locks, Revisited", transaction-scoped advisory locks worked well for short transactions under 50ms, but holding transaction locks across 2-second external HTTP calls risks exhausting the PgBouncer connection pool.',
    status: 'pending',
    status_token: 'seed-esc-status-token',
    due_at: new Date(Date.now() + 20 * 3600 * 1000).toISOString(),
  });

  // 9. Seed Scoped Constraint Proposal (§11)
  await repo.saveScopedConstraint({
    constraint: { holds_external_http_during_lock: false },
    scope: { database: 'PostgreSQL', pooling: 'PgBouncer transaction mode' },
    source_quote: 'Never hold transaction-scoped advisory locks across external HTTP calls.',
    status: 'proposed',
  });

  // 10. Seed Correction Logs for Self-Calibration (§11)
  for (let i = 0; i < 6; i++) {
    await repo.saveCorrection({
      kind: 'role',
      role: 'friction',
      domain: 'Database Infrastructure',
      machine_confidence: 0.78,
      owner_action: i < 4 ? 'reject' : 'accept',
      edit_distance: 0.15,
    });
  }
}
