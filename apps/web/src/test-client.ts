import { chunkMarkdown } from '@living-portfolio/core';

/**
 * In-memory test client for @living-portfolio/web tests.
 * Implements the client data contract without importing @living-portfolio/db.
 */
export function createTestClient() {
  const entries: any[] = [];
  const revisions: Record<string, any[]> = {};
  const currentRevisions: Record<string, any> = {};
  const spans: Record<string, any[]> = {};
  const facets: Record<string, any[]> = {};
  const claims: Record<string, any[]> = {};
  const evidence: Record<string, any[]> = {};
  const annotations: Record<string, any[]> = {};
  const relations: any[] = [];
  const ventures: any[] = [];
  const escalations: any[] = [];
  const constraints: any[] = [];

  let idCounter = 1;
  function nextId(prefix = 'id') {
    return `${prefix}_${idCounter++}`;
  }

  // --- Seed Demo Data ---
  const strataVenture = {
    id: 'venture_strata',
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
  };
  ventures.push(strataVenture);

  const pulseVenture = {
    id: 'venture_pulse',
    slug: 'pg-pulse',
    name: 'pg-pulse',
    description: 'Zero-dependency PostgreSQL lock contention profiler and queue health monitor.',
    status: 'maintained',
    links: { repo: 'https://github.com/example/pg-pulse' },
    started_at: '2021-06-15T00:00:00Z',
    facets: {
      stack: 'Go, PostgreSQL 15',
      scale: '50k TPS',
      domain: 'Database Infrastructure',
    },
  };
  ventures.push(pulseVenture);

  // 1. Entry 2021
  const e2021 = {
    id: 'entry_2021',
    slug: 'redis-distributed-locks-2021',
    title: 'Distributed Webhook Coordination with Redis Locks',
    profile: 'case-study',
    view: 'structured',
    visibility: 'public',
    venture_id: pulseVenture.id,
    created_at: '2021-09-14T10:00:00Z',
    updated_at: '2021-09-14T10:00:00Z',
  };
  const rev2021 = {
    id: 'rev_2021',
    entry_id: e2021.id,
    body_md: `## The goal\nWe needed distributed job coordination across 16 worker nodes processing billing webhooks without double-charging customers.\n\n## What I did\nWe deployed a 3-node Redis cluster using Redlock leases with a 5-second TTL around every webhook processor.\n\n## What got in the way\nDuring a network partition between availability zones, clock drift caused lock leases to overlap for 180ms before fencing tokens were checked.\n\n## The decision\nWe chose Redis Redlock with short TTLs and idempotency keys in Postgres as a secondary guard.\n\n## What happened\nIt worked partly: duplicate webhooks dropped by 99.4%, but maintaining a separate Redis cluster purely for locking added operational overhead during failovers.\n\n## What I'd tell someone else\nUse Redis distributed locks when you already run Redis at scale, but always pair lock acquisition with database-level idempotency constraints.`,
    body_hash: 'sha256-2021-redis',
    written_at: '2021-09-14T10:00:00Z',
    valid_from: '2021-08-01T00:00:00Z',
    valid_to: '2024-03-10T00:00:00Z',
    temporal_level: 'exact',
    is_hindsight: false,
  };
  entries.push(e2021);
  revisions[e2021.id] = [rev2021];
  currentRevisions[e2021.id] = rev2021;
  spans[rev2021.id] = chunkMarkdown(rev2021.id, rev2021.body_md, { targetTokens: 60, maxTokens: 120 });
  facets[e2021.id] = [
    { entry_id: e2021.id, revision_id: rev2021.id, key: 'database', value: 'Redis + PostgreSQL', source: 'owner', status: 'confirmed', confidence: 1.0 },
    { entry_id: e2021.id, revision_id: rev2021.id, key: 'scale', value: '16 worker nodes', source: 'owner', status: 'confirmed', confidence: 1.0 },
  ];
  if (spans[rev2021.id][0]) {
    annotations[rev2021.id] = [
      { id: 'ann_2021_1', span_id: spans[rev2021.id][0].id, role: 'goal', profile: 'case-study', source: 'owner', status: 'accepted', confidence: 1.0 },
      { id: 'ann_2021_2', span_id: spans[rev2021.id][0].id, role: 'decision', profile: 'case-study', source: 'owner', status: 'accepted', confidence: 1.0 },
    ];
  }
  const claim2021 = {
    id: 'claim_2021',
    revision_id: rev2021.id,
    text: 'Use Redis Redlock leases for distributed job coordination across worker nodes.',
    kind: 'decision',
    outcome_status: 'partly',
    scope: { database: 'PostgreSQL', scale: 'under 50k TPS' },
    valid_from: '2021-08-01T00:00:00Z',
    valid_to: '2024-03-10T00:00:00Z',
    temporal_level: 'exact',
    is_hindsight: false,
    source: 'owner',
    status: 'accepted',
  };
  claims[rev2021.id] = [claim2021];

  // 2. Entry 2024
  const e2024 = {
    id: 'entry_2024',
    slug: 'advisory-locks-revisited',
    title: 'Advisory Locks, Revisited: Dropping Redis for Postgres 15',
    profile: 'case-study',
    view: 'structured',
    visibility: 'public',
    venture_id: pulseVenture.id,
    created_at: '2024-03-15T14:30:00Z',
    updated_at: '2024-03-15T14:30:00Z',
  };
  const rev2024 = {
    id: 'rev_2024',
    entry_id: e2024.id,
    body_md: `## The goal\nEliminate the separate Redis lock cluster while keeping p99 webhook coordination latency under 50ms for a team of 12 engineers.\n\n## What I did\nWe replaced Redis Redlock with transaction-scoped PostgreSQL advisory locks (pg_try_advisory_xact_lock) hashed on the tenant and webhook ID, using PgBouncer in transaction pooling mode.\n\n## What got in the way\nSession-level advisory locks leaked across pooled connections in PgBouncer until we switched strictly to transaction-scoped locks tied to short transactions.\n\n## The decision\nWe standardized on pg_try_advisory_xact_lock inside PostgreSQL 15 and decommissioned the standalone Redis lock cluster.\n\n## What happened\nIt worked: p99 coordination latency dropped by 40% (to 18ms), zero lock leaks occurred over 6 months, and infrastructure ops dropped by one cluster.\n\n## What I'd tell someone else\nWhen your throughput is under 50k TPS and PostgreSQL is already your source of truth, transaction-scoped advisory locks beat running an external lock service—provided you never hold locks across external HTTP calls.`,
    body_hash: 'sha256-2024-advisory',
    written_at: '2024-03-15T14:30:00Z',
    valid_from: '2024-03-10T00:00:00Z',
    valid_to: null,
    temporal_level: 'exact',
    is_hindsight: false,
  };
  entries.push(e2024);
  revisions[e2024.id] = [rev2024];
  currentRevisions[e2024.id] = rev2024;
  spans[rev2024.id] = chunkMarkdown(rev2024.id, rev2024.body_md, { targetTokens: 60, maxTokens: 120 });
  annotations[rev2024.id] = [
    'goal',
    'approach',
    'friction',
    'decision',
    'outcome',
    'lesson',
  ].map((role, idx) => ({
    id: `ann_2024_${idx}`,
    span_id: spans[rev2024.id][idx % spans[rev2024.id].length].id,
    role,
    profile: 'case-study',
    source: 'owner',
    status: 'accepted',
    confidence: 1.0,
  }));
  facets[e2024.id] = [
    { entry_id: e2024.id, revision_id: rev2024.id, key: 'database', value: 'PostgreSQL', source: 'owner', status: 'confirmed', confidence: 1.0 },
    { entry_id: e2024.id, revision_id: rev2024.id, key: 'stack', value: 'PostgreSQL 15, PgBouncer, TypeScript', source: 'owner', status: 'confirmed', confidence: 1.0 },
    { entry_id: e2024.id, revision_id: rev2024.id, key: 'team_size', value: '12 people', source: 'owner', status: 'confirmed', confidence: 1.0 },
    { entry_id: e2024.id, revision_id: rev2024.id, key: 'latency_budget', value: 'under 50 ms', source: 'machine', status: 'suggested', confidence: 0.93 },
  ];
  const claim2024 = {
    id: 'claim_2024',
    revision_id: rev2024.id,
    text: 'Transaction-scoped PostgreSQL advisory locks (pg_try_advisory_xact_lock) outperform external Redis locks under 50k TPS when paired with short transactions.',
    kind: 'lesson',
    outcome_status: 'worked',
    scope: { database: 'PostgreSQL', scale: 'under 50k TPS' },
    valid_from: '2024-03-10T00:00:00Z',
    valid_to: null,
    temporal_level: 'exact',
    is_hindsight: false,
    source: 'owner',
    status: 'accepted',
  };
  claims[rev2024.id] = [claim2024];

  relations.push({
    id: 'rel_1',
    src_claim: claim2021.id,
    dst_claim: claim2024.id,
    type: 'supersedes',
    scope: { database: 'PostgreSQL', scale: 'under 50k TPS' },
    status: 'accepted',
    valid_from: '2024-03-10T00:00:00Z',
    dst_claim_text: claim2024.text,
    dst_entry_slug: e2024.slug,
    dst_entry_title: e2024.title,
    dst_written_at: rev2024.written_at,
  });

  evidence[e2024.id] = [
    {
      id: 'ev_1',
      entry_id: e2024.id,
      claim_id: claim2024.id,
      kind: 'commit',
      url: 'https://github.com/example/pg-pulse/pull/482',
      verification: {
        label: 'PR #482, verified GPG signature',
        signer: 'owner@example.com',
        commitSha: '9f8d2a1',
      },
      verified_at: '2024-03-15T15:00:00Z',
    },
  ];

  // 3. Entry 2025
  const e2025 = {
    id: 'entry_2025',
    slug: 'designing-strata-timeline',
    title: 'Designing the Strata Timeline: Making Time Legible Without Card Grids',
    profile: 'design-project',
    view: 'structured',
    visibility: 'public',
    venture_id: strataVenture.id,
    created_at: '2025-07-20T12:00:00Z',
    updated_at: '2025-07-20T12:00:00Z',
  };
  const rev2025 = {
    id: 'rev_2025',
    entry_id: e2025.id,
    body_md: `## Brief\nDesign a portfolio interface where a person's accumulated engineering and design work is legible across time without decorative card grids.\n\n## Exploration\nWe explored node-link force graphs and calendar heatmaps, but force graphs turned into unreadable hairballs past 30 entries and heatmaps hid the nature of the work.\n\n## Iteration\nWe modeled time as geological strata: each month forms a horizontal layer whose height encodes entry volume and whose fill pattern distinguishes case studies, decisions, and ventures.\n\n## Final\nShipped a keyboard-accessible SVG + HTML strata bar with an "as of" time-travel scrubber and an instant text-equivalent list view.\n\n## Lesson\nVisualizing knowledge over time works best when spatial position strictly means chronology and every visual border corresponds to a real schema boundary.`,
    body_hash: 'sha256-2025-strata',
    written_at: '2025-07-20T12:00:00Z',
    valid_from: '2025-07-01T00:00:00Z',
    valid_to: null,
    temporal_level: 'exact',
    is_hindsight: false,
  };
  entries.push(e2025);
  revisions[e2025.id] = [rev2025];
  currentRevisions[e2025.id] = rev2025;
  spans[rev2025.id] = chunkMarkdown(rev2025.id, rev2025.body_md, { targetTokens: 60, maxTokens: 120 });
  facets[e2025.id] = [
    { entry_id: e2025.id, revision_id: rev2025.id, key: 'domain', value: 'Design Systems & Accessibility', source: 'owner', status: 'confirmed', confidence: 1.0 },
    { entry_id: e2025.id, revision_id: rev2025.id, key: 'stack', value: 'CSS Custom Properties, Astro, WCAG 2.2 AA', source: 'owner', status: 'confirmed', confidence: 1.0 },
  ];
  annotations[rev2025.id] = [
    { id: 'ann_2025_1', span_id: spans[rev2025.id][0].id, role: 'brief', profile: 'design-project', source: 'owner', status: 'accepted', confidence: 1.0 },
    { id: 'ann_2025_2', span_id: spans[rev2025.id][spans[rev2025.id].length - 1].id, role: 'lesson', profile: 'design-project', source: 'owner', status: 'accepted', confidence: 1.0 },
  ];

  // 4. Hindsight Entry 2026
  const eHindsight = {
    id: 'entry_hindsight',
    slug: 'premature-microservices-retrospective',
    title: 'Why Our 2022 Microservice Split Was Premature (2026 Retrospective)',
    profile: 'decision-record',
    view: 'article',
    visibility: 'public',
    venture_id: null,
    created_at: '2026-02-10T09:00:00Z',
    updated_at: '2026-02-10T09:00:00Z',
  };
  const revHindsight = {
    id: 'rev_hindsight',
    entry_id: eHindsight.id,
    body_md: `Looking back from 2026 at our 2022 microservice split: splitting our monolith into 9 services when we only had 4 backend engineers slowed feature delivery by half. Had we used modular monolith boundaries in TypeScript first, we would have avoided 14 months of distributed tracing tax.`,
    body_hash: 'sha256-2026-hindsight',
    written_at: '2026-02-10T09:00:00Z',
    valid_from: '2022-05-01T00:00:00Z',
    valid_to: null,
    temporal_level: 'exact',
    is_hindsight: true,
  };
  entries.push(eHindsight);
  revisions[eHindsight.id] = [revHindsight];
  currentRevisions[eHindsight.id] = revHindsight;
  spans[revHindsight.id] = chunkMarkdown(revHindsight.id, revHindsight.body_md);

  // 5. ONNX Entry 2026
  const eOnnx = {
    id: 'entry_onnx',
    slug: 'local-onnx-embeddings-benchmark',
    title: 'Local CPU Embeddings with ONNX Runtime on Arm64',
    profile: 'freeform',
    view: 'article',
    visibility: 'public',
    venture_id: strataVenture.id,
    created_at: '2026-08-12T16:00:00Z',
    updated_at: '2026-08-12T16:00:00Z',
  };
  const revOnnx = {
    id: 'rev_onnx',
    entry_id: eOnnx.id,
    body_md: `Benchmarked local CPU embeddings using ONNX Runtime (bge-small-en-v1.5, 384d) inside our worker container. Cold load takes 420ms and embedding a 400-token span takes 14ms on a 2-vCPU Arm VM. Zero vendor API quota used and zero risk of forced model retirement.`,
    body_hash: 'sha256-2026-onnx',
    written_at: '2026-08-12T16:00:00Z',
    valid_from: '2026-08-12T00:00:00Z',
    valid_to: null,
    temporal_level: 'exact',
    is_hindsight: false,
  };
  entries.push(eOnnx);
  revisions[eOnnx.id] = [revOnnx];
  currentRevisions[eOnnx.id] = revOnnx;
  spans[revOnnx.id] = chunkMarkdown(revOnnx.id, revOnnx.body_md);

  // 6. Private Entry
  const ePrivate = {
    id: 'entry_private',
    slug: 'private-nda-architecture-notes',
    title: 'Private NDA Architecture Notes (Internal Only)',
    profile: 'freeform',
    view: 'article',
    visibility: 'private',
    venture_id: null,
    created_at: '2026-09-01T00:00:00Z',
    updated_at: '2026-09-01T00:00:00Z',
  };
  const revPrivate = {
    id: 'rev_private',
    entry_id: ePrivate.id,
    body_md: `Confidential internal notes under client NDA: project codename Aurora uses custom FPGA acceleration.`,
    body_hash: 'sha256-private',
    written_at: '2026-09-01T00:00:00Z',
    valid_from: '2026-09-01T00:00:00Z',
    valid_to: null,
    temporal_level: 'exact',
    is_hindsight: false,
  };
  entries.push(ePrivate);
  revisions[ePrivate.id] = [revPrivate];
  currentRevisions[ePrivate.id] = revPrivate;
  spans[revPrivate.id] = chunkMarkdown(revPrivate.id, revPrivate.body_md);

  // Seed escalation
  escalations.push({
    id: 'esc_1',
    question: 'Should we use PostgreSQL advisory locks if our webhook workers hold locks across 2-second third-party Stripe API calls?',
    query_class: 'advisory',
    facets: { database: 'PostgreSQL 15', stack: 'Node.js, PgBouncer', latency_budget: '2000ms external HTTP' },
    draft: 'In "Advisory Locks, Revisited", transaction-scoped advisory locks worked well for short transactions under 50ms, but holding transaction locks across 2-second external HTTP calls risks exhausting the PgBouncer connection pool.',
    status: 'pending',
    status_token: 'seed-esc-status-token',
    due_at: new Date(Date.now() + 20 * 3600 * 1000).toISOString(),
    created_at: new Date().toISOString(),
  });

  // Seed constraint
  constraints.push({
    id: 'sc_1',
    constraint: { holds_external_http_during_lock: false },
    scope: { database: 'PostgreSQL', pooling: 'PgBouncer transaction mode' },
    source_quote: 'Never hold transaction-scoped advisory locks across external HTTP calls.',
    status: 'proposed',
  });

  const client = {
    entries: {
      list: async (opts?: any) => {
        const vis = opts?.visibility
          ? Array.isArray(opts.visibility)
            ? opts.visibility
            : [opts.visibility]
          : ['public'];
        return { entries: entries.filter((e) => vis.includes(e.visibility)) };
      },
      get: async (idOrSlug: string, opts?: any) => {
        const entry = entries.find((e) => e.id === idOrSlug || e.slug === idOrSlug);
        if (!entry) return null;
        return {
          entry,
          currentRevision: currentRevisions[entry.id] || null,
          facets: facets[entry.id] || [],
          claims: currentRevisions[entry.id] ? claims[currentRevisions[entry.id].id] || [] : [],
          spans: currentRevisions[entry.id] ? spans[currentRevisions[entry.id].id] || [] : [],
          evidence: evidence[entry.id] || [],
          revisions: revisions[entry.id] || [],
        };
      },
      getBySlug: async (slug: string, opts?: any) => {
        const entry = entries.find((e) => e.slug === slug);
        if (!entry) return null;
        return {
          entry,
          currentRevision: currentRevisions[entry.id] || null,
          facets: facets[entry.id] || [],
          claims: currentRevisions[entry.id] ? claims[currentRevisions[entry.id].id] || [] : [],
          spans: currentRevisions[entry.id] ? spans[currentRevisions[entry.id].id] || [] : [],
          evidence: evidence[entry.id] || [],
          revisions: revisions[entry.id] || [],
        };
      },
    },
    listEntries: async (opts?: any) => {
      const vis = opts?.visibility
        ? Array.isArray(opts.visibility)
          ? opts.visibility
          : [opts.visibility]
        : ['public'];
      return entries.filter((e) => vis.includes(e.visibility));
    },
    getEntry: async (id: string, vis?: any) => {
      const entry = entries.find((e) => e.id === id);
      if (!entry) return null;
      if (vis && !vis.includes(entry.visibility)) return null;
      return {
        entry,
        currentRevision: currentRevisions[entry.id] || null,
      };
    },
    getEntryBySlug: async (slug: string, vis?: any) => {
      const entry = entries.find((e) => e.slug === slug);
      if (!entry) return null;
      if (vis && !vis.includes(entry.visibility)) return null;
      return {
        entry,
        currentRevision: currentRevisions[entry.id] || null,
      };
    },
    getRevisions: async (entryId: string) => {
      return revisions[entryId] || [];
    },
    getSpans: async (revId: string) => {
      return spans[revId] || [];
    },
    getFacetsForEntry: async (entryId: string) => {
      return facets[entryId] || [];
    },
    getClaimsForRevision: async (revId: string) => {
      return claims[revId] || [];
    },
    getEvidenceForEntry: async (entryId: string) => {
      return evidence[entryId] || [];
    },
    listAnnotationsForRevision: async (revId: string) => {
      return annotations[revId] || [];
    },
    listAcceptedRelations: async () => {
      return relations.filter((r) => r.status === 'accepted');
    },
    listVentures: async () => {
      return ventures;
    },
    getEscalationByStatusToken: async (token: string) => {
      return escalations.find((e) => e.status_token === token) || null;
    },
    getEscalations: async () => {
      return escalations;
    },
    saveEscalation: async (esc: any) => {
      const record = { id: nextId('esc'), ...esc };
      escalations.push(record);
      return record;
    },
    getScopedConstraints: async () => {
      return constraints;
    },
    saveScopedConstraint: async (sc: any) => {
      const record = { id: nextId('sc'), ...sc };
      constraints.push(record);
      return record;
    },
    createEntry: async (entryData: any, revData: any) => {
      const entry = { id: nextId('entry'), ...entryData };
      const rev = { id: nextId('rev'), entry_id: entry.id, ...revData };
      entries.push(entry);
      revisions[entry.id] = [rev];
      currentRevisions[entry.id] = rev;
      spans[rev.id] = chunkMarkdown(rev.id, rev.body_md);
      return { entry, revision: rev };
    },
    createRevision: async (entryId: string, revData: any) => {
      const rev = { id: nextId('rev'), entry_id: entryId, ...revData };
      if (!revisions[entryId]) revisions[entryId] = [];
      revisions[entryId].push(rev);
      currentRevisions[entryId] = rev;
      spans[rev.id] = chunkMarkdown(rev.id, rev.body_md);
      return rev;
    },
  };

  return client;
}
