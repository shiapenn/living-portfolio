import type { DataClass, DegradationStep } from '@living-portfolio/core';
import type { ModelProvider } from '../providers/types.js';
import { isPolicyAllowedForDataClass } from '../providers/types.js';

export type RequestPriority = 'owner_interactive' | 'visitor_interactive' | 'background';

export interface BudgetConfig {
  visitorShare: number;      // default 0.6 (60%)
  backgroundReserve: number; // default 0.3 (30%)
  softThreshold: number;     // default 0.8 (80%)
  hardThreshold: number;     // default 1.0 (100%)
  perVisitorHourlyCap: number; // default 10 questions/hour
}

export interface ProviderLedger {
  requestsToday: number;
  tokensToday: number;
  lastReset: string;
  isRateLimitedUntil?: string; // 24-hr backoff on 429
  effectiveTpmDiscount: number;
}

export class BudgetGovernor {
  private config: BudgetConfig;
  private ledgers = new Map<string, ProviderLedger>();
  private visitorHistory = new Map<string, number[]>(); // ip/sessionId -> timestamps

  constructor(config: Partial<BudgetConfig> = {}) {
    this.config = {
      visitorShare: config.visitorShare ?? 0.6,
      backgroundReserve: config.backgroundReserve ?? 0.3,
      softThreshold: config.softThreshold ?? 0.8,
      hardThreshold: config.hardThreshold ?? 1.0,
      perVisitorHourlyCap: config.perVisitorHourlyCap ?? 10,
    };
  }

  private getLedger(providerId: string): ProviderLedger {
    const todayStr = new Date().toISOString().slice(0, 10);
    let ledger = this.ledgers.get(providerId);

    if (!ledger || ledger.lastReset !== todayStr) {
      ledger = {
        requestsToday: 0,
        tokensToday: 0,
        lastReset: todayStr,
        effectiveTpmDiscount: 1.0,
      };
      this.ledgers.set(providerId, ledger);
    }

    return ledger;
  }

  /**
   * Checks visitor abuse & rate limit (§13.5)
   */
  checkVisitorRateLimit(visitorId: string): { allowed: boolean; remaining: number } {
    const now = Date.now();
    const oneHourAgo = now - 3600 * 1000;
    const timestamps = (this.visitorHistory.get(visitorId) || []).filter((t) => t > oneHourAgo);

    if (timestamps.length >= this.config.perVisitorHourlyCap) {
      return { allowed: false, remaining: 0 };
    }

    timestamps.push(now);
    this.visitorHistory.set(visitorId, timestamps);
    return {
      allowed: true,
      remaining: this.config.perVisitorHourlyCap - timestamps.length,
    };
  }

  /**
   * Walks the provider chain and acquires a lease for a provider that satisfies
   * data policies and budget constraints (§13.5). If none available, returns the degradation step.
   */
  acquire(
    chain: ModelProvider[],
    estTokens: number,
    priority: RequestPriority,
    dataClass: DataClass
  ): { provider: ModelProvider | null; degradationStep: DegradationStep } {
    const now = new Date();

    for (const provider of chain) {
      // 1. Data policy check
      if (!isPolicyAllowedForDataClass(provider.dataPolicy, dataClass)) {
        continue;
      }

      const limits = provider.limits();
      const ledger = this.getLedger(provider.id);

      // Check if provider has active 429 penalty
      if (ledger.isRateLimitedUntil && new Date(ledger.isRateLimitedUntil) > now) {
        continue;
      }

      const dailyTokensMax = limits.dailyTokens ?? 1000000;
      const projectedTokens = ledger.tokensToday + estTokens;
      const usageRatio = projectedTokens / dailyTokensMax;

      // Rule: Background work may not consume the last background_reserve share
      if (priority === 'background' && usageRatio > 1.0 - this.config.backgroundReserve) {
        continue;
      }

      // Rule: Visitor traffic is capped at visitor_share
      if (priority === 'visitor_interactive' && usageRatio > this.config.visitorShare) {
        continue;
      }

      // Soft threshold rule: if > softThreshold, suggest smaller model / trimmed context
      let step: DegradationStep = 'normal';
      if (usageRatio >= this.config.softThreshold) {
        step = 'smaller_model';
      }

      // Record provisional spend
      ledger.tokensToday += estTokens;
      ledger.requestsToday += 1;

      return { provider, degradationStep: step };
    }

    // If chain exhausted, step down to extractive mode (§10.8)
    return { provider: null, degradationStep: 'extractive' };
  }

  /**
   * Learns from a 429 response by applying a 24-hour conservative discount and backoff (§13.5).
   */
  recordRateLimitError(providerId: string): void {
    const ledger = this.getLedger(providerId);
    const penaltyUntil = new Date(Date.now() + 24 * 3600 * 1000).toISOString();
    ledger.isRateLimitedUntil = penaltyUntil;
    ledger.effectiveTpmDiscount = Math.max(0.2, ledger.effectiveTpmDiscount * 0.7);
  }
}
