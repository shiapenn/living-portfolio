import { Hono } from 'hono';
import type { IPortfolioRepository } from '@living-portfolio/db';
import type { BudgetGovernor, ModelProvider } from '@living-portfolio/ai';
import { verifyAnswerBeforeDelivery } from '@living-portfolio/ai';
import {
  AskQuerySchema,
  checkGate,
  routeQuery,
} from '@living-portfolio/core';

import type { RuntimeSettingsState } from './settings.js';
import type { AuthManager } from '../auth/security.js';

export interface AskEngineConfig {
  repo: IPortfolioRepository;
  governor: BudgetGovernor;
  providers: ModelProvider[];
  auth?: AuthManager;
  tier1Floor?: number;
  tier2Floor?: number;
  getRuntimeSettings?: () => RuntimeSettingsState;
}

export function createAskRoutes(config: AskEngineConfig) {
  const { repo, governor, providers, auth, tier1Floor = 0.82, tier2Floor = 0.55, getRuntimeSettings } = config;
  const router = new Hono();

  router.post('/', async (c) => {
    const body = await c.req.json();
    const parsed = AskQuerySchema.safeParse(body);

    if (!parsed.success) {
      return c.json({ error: 'Invalid query', details: parsed.error.issues }, 400);
    }

    const { query, as_of_date, facets: visitorFacets, scope_entry_slug } = parsed.data;
    const runtime = getRuntimeSettings?.();

    // Check owner kill-switch (§1 Product Principles: "One setting disables automated answering instantly")
    if (runtime && (!runtime.automatedAnsweringEnabled || runtime.simulatedDegradationMode === 'disabled')) {
      return c.json({
        tier: 'disabled',
        answer: 'Automated answers are currently paused by the owner. You can book a live conversation or send a message directly.',
        bookingUrl: `/book?q=${encodeURIComponent(query)}`,
        degradationStep: 'handoff',
        citations: [],
      });
    }

    // 1. Abuse & rate limiting by daily-salted SHA-256 hash of client address (S4; never trust client session_id)
    const visitorId = auth ? auth.getHashedClientIp(c) : 'default-hashed-ip';
    const rateCheck = governor.checkVisitorRateLimit(visitorId);
    if (!rateCheck.allowed) {
      return c.json({
        tier: 'no_match',
        answer: 'Hourly question limit reached. Please wait before asking another question, or book a live session.',
        handoffBooking: true,
      }, 429);
    }

    // 2. Query classification (lookup, advisory, about)
    const lowerQuery = query.toLowerCase();
    let queryClass: 'lookup' | 'advisory' | 'about' = 'lookup';
    if (lowerQuery.includes('should') || lowerQuery.includes('how to') || lowerQuery.includes('recommend') || lowerQuery.includes('best approach')) {
      queryClass = 'advisory';
    } else if (lowerQuery.includes('who are you') || lowerQuery.includes('about you') || lowerQuery.includes('background')) {
      queryClass = 'about';
    }

    // 3. Retrieval with temporal & visibility filtering (§10.4)
    const searchResults = await repo.hybridSearch(query, {
      visibility: ['public'],
      as_of_date: as_of_date ?? undefined,
      limit: 5,
    });

    if (searchResults.length === 0) {
      return c.json({
        tier: 'no_match',
        queryClass,
        answer: "That isn't in these records. You can ask the owner or book a conversation.",
        citations: [],
        degradationStep: 'normal',
      });
    }

    // Filter to scoped entry if provided
    let candidateMatches = searchResults;
    if (scope_entry_slug) {
      candidateMatches = searchResults.filter((r) => r.entry.slug === scope_entry_slug);
      if (candidateMatches.length === 0) candidateMatches = searchResults.slice(0, 2);
    }

    // 4. Gate checking for advisory queries (§10.5, G1, G3, G4)
    let gateResult: 'PASS' | 'FAIL' | 'INDETERMINATE' = 'PASS';
    let gateDetails: any = null;
    const topEntry = candidateMatches[0].entry;
    const entryFacets = await repo.getFacetsForEntry(topEntry.id);
    const entryScope: Record<string, any> = {};
    entryFacets.forEach((f) => {
      if (f.status === 'confirmed') entryScope[f.key] = f.value;
    });

    const domainConfig = {
      id: 'systems',
      name: 'Systems & Architecture',
      hard_facets: ['database', 'stack'],
      soft_facets: ['scale', 'team_size', 'latency_budget', 'throughput_tps'],
      facet_weight: { database: 1.0, stack: 0.8 },
    };

    const scopedConstraints = await repo.getScopedConstraints('confirmed');

    if (queryClass === 'advisory') {
      gateDetails = checkGate({
        clientFacets: visitorFacets,
        entryScope,
        domain: domainConfig,
        scopedConstraints,
      });
      gateResult = gateDetails.result;

      // G6: Advisory query with INDETERMINATE gate returns needs_context asking visitor once
      if (gateResult === 'INDETERMINATE') {
        const missingFacets = gateDetails?.unknown || [];
        const contextAlreadyAsked = Boolean(body.context_asked || (visitorFacets && Object.keys(visitorFacets).length > 0));
        if (!contextAlreadyAsked && missingFacets.length > 0) {
          return c.json({
            tier: 'needs_context',
            queryClass,
            answer: 'To advise accurately on this question, please provide the following details about your architecture or environment:',
            missingFacets,
            degradationStep: 'normal',
            citations: [],
          });
        }
      }
    }

    const activeTier1Floor = runtime?.tier1_floor ?? tier1Floor;
    const activeTier2Floor = runtime?.tier2_floor ?? tier2Floor;

    // 5. Routing tier decision (G2: computed dynamically from repository)
    const routeMatches = await Promise.all(
      candidateMatches.map(async (m) => {
        const claims = await repo.getClaimsForRevision(m.span.revision_id);
        const evList = await repo.getEvidenceForEntry(m.entry.id);
        const claim = claims.find((c) => c.source_span_id === m.span.id) || claims[0];
        const hasEvidence = evList.length > 0;
        const hasVerifiedEvidence = evList.some((e) => e.verified_at != null || e.verification != null);
        const outcomeStatus = claim?.outcome_status ?? null;
        const hasScope = Boolean(claim?.scope && Object.keys(claim.scope).length > 0);
        return {
          similarity: m.similarity,
          hasEvidence,
          hasVerifiedEvidence,
          outcomeStatus,
          hasScope,
        };
      })
    );

    const routeDecision = routeQuery({
      queryClass,
      gateResult,
      matches: routeMatches,
      tier1Floor: activeTier1Floor,
      tier2Floor: activeTier2Floor,
    });

    // 6. Budget governor and degradation ladder (§10.8, §13.5)
    const { provider, degradationStep } = governor.acquire(
      providers,
      250, // est tokens
      'visitor_interactive',
      'public' // public records only
    );

    const forceExtractive = runtime?.simulatedDegradationMode === 'extractive';

    // 7. Degradation Step: Extractive Mode
    if (forceExtractive || degradationStep === 'extractive' || !provider || routeDecision.isExtractive) {
      const excerpts = candidateMatches.slice(0, 3).map((m, i) => `[${i + 1}] "${m.span.text_exact}" (from ${m.entry.title})`).join('\n\n');
      return c.json({
        tier: 'extractive',
        queryClass,
        answer: `Showing excerpts from the owner's records. Automated answers are paused for now.\n\n${excerpts}`,
        citations: candidateMatches.slice(0, 3).map((m, i) => ({
          citationId: i + 1,
          slug: m.entry.slug,
          title: m.entry.title,
          text: m.span.text_exact,
        })),
        contextChips: Object.entries(entryScope).map(([k, v]) => `${k}: ${v}`),
        degradationStep: 'extractive',
        aiDisclosure: 'Showing excerpts from the owner\'s records. Automated answers are paused for now.',
      });
    }

    // 8. Tier 2: Needs owner review (G7: synthesize escalation draft via provider + verification)
    if (routeDecision.tier === 'tier2') {
      let escalationDraft = '';
      if (provider) {
        const promptContext = candidateMatches
          .map((m, idx) => `[cite:${idx + 1}] From "${m.entry.title}": ${m.span.text_exact}`)
          .join('\n\n');
        const draftCompletion = await provider.complete({
          model: 'default',
          messages: [
            {
              role: 'system',
              content: "You synthesize an accurate preliminary response draft for the owner's review based on the provided records.",
            },
            {
              role: 'user',
              content: `Question: ${query}\n\nOwner records:\n${promptContext}`,
            },
          ],
          temperature: 0.1,
        });
        const vDraft = verifyAnswerBeforeDelivery({
          draftText: draftCompletion.text,
          citedSpans: candidateMatches.map((m) => m.span),
          visitorFacets,
          citedScopes: [],
          asOfDate: as_of_date,
        });
        escalationDraft = vDraft.verifiedText;
      } else {
        escalationDraft = candidateMatches.slice(0, 2).map((m) => m.span.text_exact).join('\n\n');
      }

      await repo.saveEscalation({
        question: query,
        query_class: queryClass,
        facets: visitorFacets,
        draft: escalationDraft,
        status: 'pending',
        due_at: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      });

      return c.json({
        tier: 'tier2',
        queryClass,
        answer: 'This needs the owner\'s review. Typical reply within 24 hours.',
        status: 'pending_review',
        degradationStep,
      });
    }

    // 9. Tier 3: Conversation / booking
    if (routeDecision.tier === 'tier3') {
      return c.json({
        tier: 'tier3',
        queryClass,
        answer: 'This topic involves specific constraints that are better addressed in a live conversation.',
        bookingUrl: `/book?q=${encodeURIComponent(query)}`,
        degradationStep,
      });
    }

    // 10. Tier 1: Generate grounded answer with citations
    const promptContext = candidateMatches
      .map((m, idx) => `[cite:${idx + 1}] From "${m.entry.title}": ${m.span.text_exact}`)
      .join('\n\n');

    const completion = await provider.complete({
      model: 'default',
      messages: [
        {
          role: 'system',
          content: 'You are an accurate, honest AI assistant representing the owner\'s work. Answer only from the provided citations. If the record does not answer, say so clearly. Reference citations using [cite:1], [cite:2]. State uncertainty in plain words, never fake certainty scores.',
        },
        {
          role: 'user',
          content: `Question: ${query}\n\nOwner's records:\n${promptContext}`,
        },
      ],
      temperature: 0.1,
    });

    // Verification check (§10.6, G5: downgrade to extractive on failed verification)
    const verification = verifyAnswerBeforeDelivery({
      draftText: completion.text,
      citedSpans: candidateMatches.map((m) => m.span),
      visitorFacets,
      citedScopes: [],
      asOfDate: as_of_date,
    });

    if (!verification.passed) {
      const excerpts = candidateMatches.slice(0, 3).map((m, i) => `[${i + 1}] "${m.span.text_exact}" (from ${m.entry.title})`).join('\n\n');
      return c.json({
        tier: 'extractive',
        queryClass,
        answer: `Showing extractive excerpts from the owner's records (synthesis verification downgraded: ${verification.anachronismDetails || 'faithfulness unverified'}).\n\n${excerpts}`,
        citations: candidateMatches.slice(0, 3).map((m, i) => ({
          citationId: i + 1,
          slug: m.entry.slug,
          title: m.entry.title,
          text: m.span.text_exact,
        })),
        degradationStep: 'extractive',
        verificationPassed: false,
        aiDisclosure: 'Synthesis downgraded to extractive mode per verification gate.',
      });
    }

    const finalAnswer = verification.verifiedText;
    const citations = candidateMatches.map((m, idx) => ({
      citationId: idx + 1,
      slug: m.entry.slug,
      title: m.entry.title,
      text: m.span.text_exact,
    }));

    return c.json({
      tier: 'tier1',
      queryClass,
      answer: finalAnswer,
      citations,
      verificationPassed: verification.passed,
      degradationStep,
      basis: `Based on ${citations.length} entries from the owner's records.`,
      aiDisclosure: 'Automated answer generated from the owner\'s actual records with verification.',
    });
  });

  return router;
}
