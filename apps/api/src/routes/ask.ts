import { Hono } from 'hono';
import type { IPortfolioRepository, SearchResult } from '@living-portfolio/db';
import type { BudgetGovernor, ModelProvider } from '@living-portfolio/ai';
import {
  verifyAnswerBeforeDelivery,
  verifyAnswerBeforeDeliveryAsync,
  formatProviderDisclosure,
  AnswerCache,
  classifyQuery,
} from '@living-portfolio/ai';
import { loadConfig } from '@living-portfolio/config';
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
  answerCache?: AnswerCache;
  auth?: AuthManager;
  tier1Floor?: number;
  tier2Floor?: number;
  getRuntimeSettings?: () => RuntimeSettingsState;
}

export function createAskRoutes(config: AskEngineConfig) {
  const {
    repo,
    governor,
    providers,
    answerCache = new AnswerCache(),
    auth,
    tier1Floor = 0.82,
    tier2Floor = 0.55,
    getRuntimeSettings,
  } = config;
  const router = new Hono();

  router.post('/', async (c) => {
    const body = await c.req.json();
    const parsed = AskQuerySchema.safeParse(body);

    if (!parsed.success) {
      return c.json({
        tier: 'invalid_query',
        error: 'Invalid query',
        message: 'Type a question to ask. It can be up to 1000 characters.',
        answer: 'Type a question to ask. It can be up to 1000 characters.',
        details: parsed.error.issues,
      }, 400);
    }

    const { query, as_of_date, facets: visitorFacets, scope_entry_slug, visitor_contact } = parsed.data;
    const runtime = getRuntimeSettings?.();

    // Check owner kill-switch (§1 Product Principles: "One setting disables automated answering instantly")
    if (runtime && (!runtime.automatedAnsweringEnabled || runtime.simulatedDegradationMode === 'disabled')) {
      return c.json({
        tier: 'disabled',
        answer: 'Automated answers are off right now. You can book a conversation or send the owner a message.',
        bookingUrl: `/book?q=${encodeURIComponent(query)}`,
        degradationStep: 'handoff',
        citations: [],
      });
    }

    // Step 6: Database or subsystem down handoff (Spec §10.8 Step 6, M2, Fix 12)
    if (typeof (repo as any).checkHealth === 'function') {
      try {
        const isHealthy = await (repo as any).checkHealth();
        if (!isHealthy) {
          return c.json({
            tier: 'disabled',
            answer: 'Automated answers are off right now while systems are offline. You can book a conversation or send the owner a message.',
            bookingUrl: `/book?q=${encodeURIComponent(query)}`,
            degradationStep: 'handoff',
            citations: [],
          });
        }
      } catch {
        return c.json({
          tier: 'disabled',
          answer: 'Automated answers are off right now while systems are offline. You can book a conversation or send the owner a message.',
          bookingUrl: `/book?q=${encodeURIComponent(query)}`,
          degradationStep: 'handoff',
          citations: [],
        });
      }
    }

    // 1. Abuse & rate limiting by daily-salted SHA-256 hash of client address (S4; never trust client session_id)
    const visitorId = auth ? auth.getHashedClientIp(c) : 'default-hashed-ip';
    const rateCheck = governor.checkVisitorRateLimit(visitorId);
    if (!rateCheck.allowed) {
      return c.json({
        tier: 'rate_limited',
        error: 'Hourly question limit reached',
        answer: "Hourly question limit reached. You've reached the limit of questions per hour. Try again in 60 minutes, or book a conversation.",
        retryAfter: 3600,
        handoffBooking: true,
      }, 429);
    }

    // 2. Query classification (lookup, advisory, about) (§10.3, Fix 15, Finding M4)
    const primaryProvider = providers.length > 0 ? providers[0] : undefined;
    const classification = await classifyQuery(query, primaryProvider);
    const queryClass = classification.queryClass;

    // Handle About path (§10.3: answered from the About page and settings)
    if (queryClass === 'about') {
      const siteConfig = loadConfig();
      const ownerName = siteConfig.PUBLIC_OWNER_NAME || 'the portfolio author';
      const ownerBio = siteConfig.PUBLIC_OWNER_BIO || 'Engineer and designer.';
      const forkNotice = siteConfig.PUBLIC_UNOFFICIAL_FORK_NOTICE
        ? ` ${siteConfig.PUBLIC_UNOFFICIAL_FORK_NOTICE}`
        : '';

      const aboutPassage = `About ${ownerName}: ${ownerBio}.${forkNotice}
Verified credentials: Cryptographically verified GPG commit signatures across published engineering repositories and host-level domain ownership manifest.
Site architecture: Living Portfolio static-first edge architecture backed by PostgreSQL, Hono API, and verified audit trails.`;

      const lease = governor.acquire(providers, 100, 'visitor_interactive', 'public');
      const aboutProvider = lease.provider;
      const isExtractive = !aboutProvider || lease.degradationStep === 'extractive';

      let answerText = '';
      if (isExtractive) {
        answerText = `Based on the About records: ${ownerBio}`;
      } else {
        try {
          const res = await aboutProvider.complete({
            model: 'default',
            messages: [
              {
                role: 'system',
                content: 'You answer questions about the portfolio author and site strictly based on the provided About and settings records. Be direct, concise, and helpful.',
              },
              {
                role: 'user',
                content: `About Records:\n${aboutPassage}\n\nQuestion: ${query}`,
              },
            ],
            temperature: 0.1,
          });
          answerText = res.text.trim();
        } catch {
          answerText = `Based on the About records: ${ownerBio}`;
        }
      }

      // Verify answer before delivery against About context
      const verified = await verifyAnswerBeforeDeliveryAsync({
        draftText: answerText,
        citedSpans: [
          {
            id: 'about-span',
            revision_id: 'about-rev',
            ordinal: 0,
            start_off: 0,
            end_off: aboutPassage.length,
            text_exact: aboutPassage,
            token_count: Math.ceil(aboutPassage.length / 4),
          },
        ],
        visitorFacets: visitorFacets || {},
        citedScopes: [{ domain: 'About & Credentials' }],
        asOfDate: as_of_date,
        degradationStep: isExtractive ? 'extractive' : 'normal',
        judgeProvider: aboutProvider ?? undefined,
      });

      const aboutCitations = [
        {
          entry_id: 'about',
          entry_slug: 'about',
          title: `About ${ownerName}`,
          url: '/about',
          snippet: ownerBio,
          date: as_of_date || new Date().toISOString(),
          context: { section: 'About & Verified Credentials' },
        },
      ];

      return c.json({
        tier: 'tier1',
        queryClass: 'about',
        answer: verified.verifiedText || `Based on the About records: ${ownerBio}`,
        citations: aboutCitations,
        citedScopes: verified.citedScopes,
        isReconstruction: verified.isReconstruction,
        reconstructionNotice: verified.reconstructionNotice,
        strippedAssertions: verified.strippedAssertions,
        degradationStep: isExtractive ? 'extractive' : 'normal',
        disclosure: formatProviderDisclosure(aboutProvider),
      });
    }

    // 3. Retrieval with temporal & visibility filtering (§10.4)
    let searchResults: SearchResult[] = [];
    try {
      searchResults = await repo.hybridSearch(query, {
        visibility: ['public'],
        as_of_date: as_of_date ?? undefined,
        limit: 5,
      });
    } catch {
      // Step 6: Degradation Ladder Handoff on Database/Embedding Failure (§10.8 Step 6)
      return c.json({
        tier: 'disabled',
        answer: 'Automated answers are temporarily unavailable while systems are offline. You can book a live conversation or send a message directly.',
        bookingUrl: `/book?q=${encodeURIComponent(query)}`,
        degradationStep: 'handoff',
        citations: [],
      });
    }

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

    // Step 2: Answer Cache lookup (Spec §10.8 Step 2, M2, Fix 12)
    const candidateRevisionIds = candidateMatches.map((m) => m.revision.id);
    const cachedAnswer = answerCache.get(query, candidateRevisionIds, visitorFacets, as_of_date);
    if (cachedAnswer) {
      return c.json({
        ...cachedAnswer,
        degradationStep: 'cached',
      });
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
    const candidateScopes: Record<string, any>[] = [];
    const routeMatches = await Promise.all(
      candidateMatches.map(async (m) => {
        const claims = await repo.getClaimsForRevision(m.span.revision_id);
        const evList = await repo.getEvidenceForEntry(m.entry.id);
        const claim = claims.find((c) => c.source_span_id === m.span.id) || claims[0];
        if (claim?.scope && Object.keys(claim.scope).length > 0) {
          candidateScopes.push(claim.scope);
        }
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
    if (candidateScopes.length === 0 && Object.keys(entryScope).length > 0) {
      candidateScopes.push(entryScope);
    }

    const routeDecision = routeQuery({
      queryClass,
      gateResult,
      matches: routeMatches,
      tier1Floor: activeTier1Floor,
      tier2Floor: activeTier2Floor,
    });

    // 6. Extractive mode or Tier 3 check before spending quota (Spec §10.8, §13.5, G8, Fix 11)
    const forceExtractive = runtime?.simulatedDegradationMode === 'extractive';

    // Helper for extractive degradation response
    const buildExtractiveResponse = (reasonNote?: string) => {
      const excerpts = candidateMatches.slice(0, 3).map((m, i) => `[${i + 1}] "${m.span.text_exact}" (from ${m.entry.title})`).join('\n\n');
      const disclosure = formatProviderDisclosure(null);
      const answer = reasonNote ? `${disclosure} (${reasonNote})\n\n${excerpts}` : `${disclosure}\n\n${excerpts}`;
      const isReconstruction = Boolean(as_of_date);
      const reconstructionNotice = as_of_date
        ? `Reconstructed from historical records as of ${new Date(as_of_date).toISOString().split('T')[0]}, not direct owner testimony.`
        : undefined;
      return c.json({
        tier: 'extractive',
        queryClass,
        answer,
        citations: candidateMatches.slice(0, 3).map((m, i) => ({
          citationId: i + 1,
          slug: m.entry.slug,
          title: m.entry.title,
          text: m.span.text_exact,
        })),
        citedScopes: candidateScopes,
        contextChips: Object.entries(entryScope).map(([k, v]) => `${k}: ${v}`),
        degradationStep: 'extractive',
        isReconstruction,
        reconstructionNotice,
        provider_disclosure: disclosure,
        aiDisclosure: disclosure,
      });
    };

    if (forceExtractive || routeDecision.isExtractive) {
      return buildExtractiveResponse();
    }

    if (routeDecision.tier === 'tier3') {
      return c.json({
        tier: 'tier3',
        queryClass,
        answer: "This is better as a conversation. Your situation has details my past work doesn't cover.",
        bookingUrl: `/book?q=${encodeURIComponent(query)}`,
        degradationStep: 'normal',
      });
    }

    // 7. Acquire lease for generative paths (Tier 1 synthesis or Tier 2 draft)
    let { provider, degradationStep } = governor.acquire(
      providers,
      250, // est tokens
      'visitor_interactive',
      'public' // public records only
    );

    if (degradationStep === 'extractive' || !provider) {
      return buildExtractiveResponse();
    }

    // 8. Tier 2: Needs owner review (G7: synthesize escalation draft via provider + verification)
    if (routeDecision.tier === 'tier2') {
      let escalationDraft = '';
      if (provider) {
        try {
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
          governor.reconcileUsage(provider.id, 'visitor_interactive', 250, draftCompletion.usage?.totalTokens ?? 250);
          const vDraft = await verifyAnswerBeforeDeliveryAsync({
            draftText: draftCompletion.text,
            citedSpans: candidateMatches.map((m) => m.span),
            visitorFacets,
            citedScopes: candidateScopes,
            asOfDate: as_of_date,
            judgeProvider: provider,
            degradationStep,
          });
          escalationDraft = vDraft.verifiedText;
        } catch {
          governor.reconcileUsage(provider.id, 'visitor_interactive', 250, 0);
          escalationDraft = candidateMatches.slice(0, 2).map((m) => m.span.text_exact).join('\n\n');
        }
      } else {
        escalationDraft = candidateMatches.slice(0, 2).map((m) => m.span.text_exact).join('\n\n');
      }

      const statusToken = crypto.randomUUID().replace(/-/g, '');
      const dueAt = new Date(Date.now() + 24 * 3600 * 1000).toISOString();

      await repo.saveEscalation({
        question: query,
        query_class: queryClass,
        facets: visitorFacets,
        draft: escalationDraft,
        status: 'pending',
        due_at: dueAt,
        status_token: statusToken,
        visitor_contact: visitor_contact || null,
      });

      return c.json({
        tier: 'tier2',
        queryClass,
        answer: "This needs the owner's review. Typical reply within 24 hours.",
        status: 'pending_review',
        statusToken,
        receiptUrl: `/ask/status/${statusToken}`,
        dueAt,
        citedScopes: candidateScopes,
        degradationStep,
      });
    }

    // 10. Tier 1: Generate grounded answer with citations across degradation ladder (§10.8)
    const promptContext = candidateMatches
      .map((m, idx) => `[cite:${idx + 1}] From "${m.entry.title}": ${m.span.text_exact}`)
      .join('\n\n');

    let activeProvider: ModelProvider | null = provider;
    let completionText: string | null = null;

    if (activeProvider) {
      try {
        const completion = await activeProvider.complete({
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
        governor.reconcileUsage(activeProvider.id, 'visitor_interactive', 250, completion.usage?.totalTokens ?? 250);
        completionText = completion.text;
      } catch (err: any) {
        governor.reconcileUsage(activeProvider.id, 'visitor_interactive', 250, 0);
        if (err?.message?.includes('429') || err?.status === 429) {
          governor.recordRateLimitError(activeProvider.id);
        }
        // Fallback provider ladder (§10.8 Step 3)
        const remainingProviders = providers.filter((p) => p.id !== activeProvider?.id);
        for (const fallback of remainingProviders) {
          try {
            const fallbackLease = governor.acquire([fallback], 250, 'visitor_interactive', 'public');
            if (fallbackLease.provider) {
              const res = await fallbackLease.provider.complete({
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
              governor.reconcileUsage(fallbackLease.provider.id, 'visitor_interactive', 250, res.usage?.totalTokens ?? 250);
              completionText = res.text;
              activeProvider = fallbackLease.provider;
              degradationStep = 'fallback_provider';
              break;
            }
          } catch (fbErr: any) {
            governor.reconcileUsage(fallback.id, 'visitor_interactive', 250, 0);
            if (fbErr?.message?.includes('429') || fbErr?.status === 429) {
              governor.recordRateLimitError(fallback.id);
            }
          }
        }
      }
    }

    // If no provider succeeded or is available, degrade to extractive excerpts
    if (!completionText || !activeProvider) {
      return buildExtractiveResponse();
    }

    // Verification check (§10.6, G5, M3: entailment judge, assertion stripping, citedScopes, reconstruction)
    const verification = await verifyAnswerBeforeDeliveryAsync({
      draftText: completionText,
      citedSpans: candidateMatches.map((m) => m.span),
      visitorFacets,
      citedScopes: candidateScopes,
      asOfDate: as_of_date,
      judgeProvider: activeProvider,
      degradationStep,
    });

    if (!verification.passed) {
      const reason = `synthesis verification downgraded: ${verification.anachronismDetails || 'faithfulness unverified'}`;
      return buildExtractiveResponse(reason);
    }

    const finalAnswer = verification.verifiedText;
    const citations = candidateMatches.map((m, idx) => ({
      citationId: idx + 1,
      slug: m.entry.slug,
      title: m.entry.title,
      text: m.span.text_exact,
    }));

    const disclosure = formatProviderDisclosure(activeProvider);

    const responsePayload = {
      tier: 'tier1',
      queryClass,
      answer: finalAnswer,
      citations,
      citedScopes: verification.citedScopes,
      verificationPassed: verification.passed,
      degradationStep,
      basis: `Based on ${citations.length} entries from the owner's records.`,
      isReconstruction: verification.isReconstruction,
      reconstructionNotice: verification.reconstructionNotice,
      strippedAssertions: verification.strippedAssertions,
      provider_disclosure: disclosure,
      aiDisclosure: disclosure,
    };

    // Cache the verified response for Step 2 degradation (§10.8 Step 2)
    const allCitedClaimIds: string[] = [];
    for (const m of candidateMatches) {
      try {
        const claims = await repo.getClaimsForRevision(m.span.revision_id);
        for (const cl of claims) {
          if (cl.id && !allCitedClaimIds.includes(cl.id)) {
            allCitedClaimIds.push(cl.id);
          }
        }
      } catch {
        // Continue if repo lookup fails
      }
    }
    const isAllPublic = candidateMatches.every((m) => m.entry.visibility === 'public');
    answerCache.set(
      query,
      candidateRevisionIds,
      allCitedClaimIds,
      responsePayload,
      visitorFacets,
      as_of_date,
      isAllPublic
    );

    return c.json(responsePayload);
  });

  // Query escalation receipt status (§6.1, §10.5, UX-08)
  router.get('/status/:token', async (c) => {
    const token = c.req.param('token');
    const escalation = await repo.getEscalationByStatusToken(token);
    if (!escalation) {
      return c.json({ error: 'Receipt status token not found' }, 404);
    }
    return c.json({
      found: true,
      escalation: {
        id: escalation.id,
        question: escalation.question,
        query_class: escalation.query_class,
        status: escalation.status,
        draft: escalation.draft,
        final: escalation.final,
        rejection_reason: escalation.rejection_reason,
        visitor_contact: escalation.visitor_contact,
        due_at: escalation.due_at,
        at: escalation.at,
      },
    });
  });

  // Attach/update contact information on escalation receipt (§6.1, UX-08)
  router.post('/status/:token/contact', async (c) => {
    const token = c.req.param('token');
    const body = await c.req.json().catch(() => ({}));
    const contact = body?.contact;
    if (!contact || typeof contact !== 'string' || !contact.trim()) {
      return c.json({ error: 'Valid contact is required' }, 400);
    }
    const escalation = await repo.getEscalationByStatusToken(token);
    if (!escalation) {
      return c.json({ error: 'Receipt status token not found' }, 404);
    }
    const updated = await repo.updateEscalation(escalation.id, {
      visitor_contact: contact.trim(),
    });
    return c.json({
      success: true,
      message: 'Contact details saved. You will receive notification when the owner replies.',
      escalation: {
        id: updated.id,
        status: updated.status,
        visitor_contact: updated.visitor_contact,
      },
    });
  });

  return router;
}
