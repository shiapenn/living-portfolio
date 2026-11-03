import type {
  ImportPlannerConfig,
  ImportDocumentInput,
  ImportPlanResult,
  DocumentPreview,
} from '../types/index.js';

export const DEFAULT_IMPORT_PLANNER_CONFIG: ImportPlannerConfig = {
  dailyTokenBudget: 100000,
  dailyAudioSecondsBudget: 1800, // 30 minutes free transcription daily
  costPerMillionTokensUsd: 0.15,
  costPerAudioMinuteUsd: 0.006,
};

/**
 * §13.6 Import Planner under Quotas
 * Estimates tokens and audio seconds, compares them to configured budgets,
 * and produces ETA calculations and paid-tier acceleration estimates.
 */
export function planImport(
  documents: ImportDocumentInput[],
  config?: Partial<ImportPlannerConfig>
): ImportPlanResult {
  const mergedConfig: ImportPlannerConfig = {
    dailyTokenBudget: config?.dailyTokenBudget ?? DEFAULT_IMPORT_PLANNER_CONFIG.dailyTokenBudget,
    dailyAudioSecondsBudget:
      config?.dailyAudioSecondsBudget ?? DEFAULT_IMPORT_PLANNER_CONFIG.dailyAudioSecondsBudget!,
    costPerMillionTokensUsd:
      config?.costPerMillionTokensUsd ?? DEFAULT_IMPORT_PLANNER_CONFIG.costPerMillionTokensUsd!,
    costPerAudioMinuteUsd:
      config?.costPerAudioMinuteUsd ?? DEFAULT_IMPORT_PLANNER_CONFIG.costPerAudioMinuteUsd!,
  };

  let totalAudioSeconds = 0;

  const documentsPreview: DocumentPreview[] = documents.map((doc, idx) => {
    const text = doc.text || '';
    const chars = text.length;

    // Estimate word count and tokens (approx Math.ceil(chars / 4) + 20 per-doc envelope)
    const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
    const estTokens = Math.max(10, Math.ceil(chars / 4) + 20);

    const audioSec = Math.max(0, doc.audioDurationSeconds || 0);
    totalAudioSeconds += audioSec;

    return {
      id: doc.id || `doc-${idx + 1}`,
      title: doc.title || (text.slice(0, 40).trim() || `Document ${idx + 1}`),
      wordCount,
      estimatedTokens: estTokens,
      audioDurationSeconds: audioSec,
      dataClass: doc.dataClass || 'public',
    };
  });

  const totalEstimatedTokens = documentsPreview.reduce((sum, d) => sum + d.estimatedTokens, 0);

  // Free quota days: evaluate tokens and audio independently against configured budgets
  const tokenDays = Math.max(1, Math.ceil(totalEstimatedTokens / mergedConfig.dailyTokenBudget));
  const audioDays =
    totalAudioSeconds > 0
      ? Math.ceil(totalAudioSeconds / mergedConfig.dailyAudioSecondsBudget!)
      : 0;
  const daysWithinFree = Math.max(tokenDays, audioDays);

  // Paid fast estimate: finish today with small fee
  const tokenCost = (totalEstimatedTokens / 1_000_000) * mergedConfig.costPerMillionTokensUsd!;
  const audioCost = (totalAudioSeconds / 60) * mergedConfig.costPerAudioMinuteUsd!;
  const paidFastCostUsd = Number(Math.max(0.01, tokenCost + audioCost).toFixed(2));

  return {
    documentCount: documents.length,
    estimatedTokens: totalEstimatedTokens,
    totalAudioSeconds,
    configuredBudget: {
      dailyTokenBudget: mergedConfig.dailyTokenBudget,
      dailyAudioSecondsBudget: mergedConfig.dailyAudioSecondsBudget!,
      costPerMillionTokensUsd: mergedConfig.costPerMillionTokensUsd!,
      costPerAudioMinuteUsd: mergedConfig.costPerAudioMinuteUsd!,
    },
    daysWithinFree,
    freePlanEstimate: `About ${daysWithinFree} day${daysWithinFree > 1 ? 's' : ''} within free limits`,
    paidFastCostUsd,
    paidFastEstimate: `Finish in minutes for ~$${paidFastCostUsd}`,
    documentsPreview,
  };
}
