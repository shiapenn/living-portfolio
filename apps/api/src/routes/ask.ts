import { Hono } from 'hono';
import type { IPortfolioRepository } from '@living-portfolio/db';
import type { BudgetGovernor, ModelProvider } from '@living-portfolio/ai';
import { verifyAnswerBeforeDelivery } from '@living-portfolio/ai';
import {
  AskQuerySchema,
  checkGate,
  routeQuery,
} from '@living-portfolio/core';

export interface AskEngineConfig {
  repo: IPortfolioRepository;
  governor: BudgetGovernor;
  providers: ModelProvider[];
  tier1Floor?: number;
  tier2Floor?: number;
}

export function createAskRoutes(config: AskEngineConfig) {
  const { repo, governor, providers, tier1Floor = 0.82, tier2Floor = 0.55 } = config;
  const router = new Hono();

  router.post('/', async (c) => {
    const body = await c.req.json();
    const parsed = AskQuerySchema.safeParse(body);

    if (!parsed.success) {
      return c.json({ error: 'Invalid query', details: parsed.error.issues }, 400);
    }

    const { query, as_of_date, facets: visitorFacets, session_id, scope_entry_slug } = parsed.data;

    // 1. Abuse & rate limiting
    const visitorId = session_id || c.req.header('x-forwarded-for') || 'default-session';
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

    // 4. Gate checking for advisory queries (§10.5)
    let gateResult: 'PASS' | 'FAIL' | 'INDETERMINATE' = 'PASS';
    let gateDetails: any = null;

    if (queryClass === 'advisory') {
      const topEntry = candidateMatches[0].entry;
      const entryFacets = await repo.getFacetsForEntry(topEntry.id);
      const entryScope: Record<string, any> = {};
      entryFacets.forEach((f) => {
        if (f.status === 'confirmed') entryScope[f.key] = f.value;
      });

      gateDetails = checkGate({
        clientFacets: visitorFacets,
        entryScope,
        domain: {
          id: 'general',
          name: 'General',
          hard_facets: ['database', 'stack'],
          soft_facets: [],
          facet_weight: {},
        },
      });
      gateResult = gateDetails.result;
    }

    // 5. Routing tier decision
    const routeDecision = routeQuery({
      queryClass,
      gateResult,
      matches: candidateMatches.map((m) => ({
        similarity: m.similarity,
        hasEvidence: false,
        hasVerifiedEvidence: false,
        outcomeStatus: 'worked',
        hasScope: true,
      })),
      tier1Floor,
      tier2Floor,
    });

    // 6. Budget governor and degradation ladder (§10.8, §13.5)
    const { provider, degradationStep } = governor.acquire(
      providers,
      250, // est tokens
      'visitor_interactive',
      'public' // public records only
    );

    // 7. Degradation Step: Extractive Mode
    if (degradationStep === 'extractive' || !provider || routeDecision.isExtractive) {
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
        degradationStep: 'extractive',
        aiDisclosure: 'Extractive excerpts directly from verified records without generative synthesis.',
      });
    }

    // 8. Tier 2: Needs owner review
    if (routeDecision.tier === 'tier2') {
      // Create escalation record
      await repo.saveEscalation({
        question: query,
        query_class: queryClass,
        facets: visitorFacets,
        draft: `Preliminary draft regarding ${candidateMatches[0].entry.title}`,
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

    // Verification check (§10.6)
    const verification = verifyAnswerBeforeDelivery({
      draftText: completion.text,
      citedSpans: candidateMatches.map((m) => m.span),
      visitorFacets,
      citedScopes: [],
      asOfDate: as_of_date,
    });

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
