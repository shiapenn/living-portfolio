import { describe, it, expect } from 'vitest';
import {
  DEFAULT_EVALUATION_DATASET,
  runEvaluation,
  type EvaluationDataset,
} from './evaluation/index.js';

describe('Fix 26 / Finding M11: Model-Quality Evaluation Harness & Labeled Benchmark Runner (§18.2)', () => {
  it('loads versioned golden evaluation dataset with documents and queries (§18.2)', () => {
    expect(DEFAULT_EVALUATION_DATASET.version).toBe('1.0.0');
    expect(DEFAULT_EVALUATION_DATASET.documents.length).toBeGreaterThanOrEqual(3);
    expect(DEFAULT_EVALUATION_DATASET.queries.length).toBeGreaterThanOrEqual(5);

    // Verify document structure has roles, facets, and claims
    for (const doc of DEFAULT_EVALUATION_DATASET.documents) {
      expect(doc.id).toBeTruthy();
      expect(doc.title).toBeTruthy();
      expect(doc.content).toBeTruthy();
      expect(doc.labeledRoles.length).toBeGreaterThan(0);
      expect(Object.keys(doc.labeledFacets).length).toBeGreaterThan(0);
      expect(doc.labeledClaims.length).toBeGreaterThan(0);
    }

    // Verify query structure
    for (const q of DEFAULT_EVALUATION_DATASET.queries) {
      expect(q.id).toBeTruthy();
      expect(q.query).toBeTruthy();
      expect(q.groundTruthAnswer).toBeTruthy();
      expect([1, 2, 3]).toContain(q.expectedTier);
    }
  });

  it('computes annotation quality metrics with precision, recall, F1, and inter-annotator agreement', async () => {
    const report = await runEvaluation(DEFAULT_EVALUATION_DATASET);

    expect(report.annotationQuality.roles.precision).toBeGreaterThanOrEqual(0.85);
    expect(report.annotationQuality.roles.recall).toBeGreaterThanOrEqual(0.85);
    expect(report.annotationQuality.roles.interAnnotatorAgreement).toBeGreaterThanOrEqual(0.8);

    expect(report.annotationQuality.facets.precision).toBeGreaterThanOrEqual(0.85);
    expect(report.annotationQuality.facets.interAnnotatorAgreement).toBeGreaterThanOrEqual(0.8);

    expect(report.annotationQuality.claims.f1).toBeGreaterThanOrEqual(0.85);
    expect(report.annotationQuality.outcomes.accuracy).toBeGreaterThanOrEqual(0.9);
  });

  it('runs baseline comparison proving structured pipeline outperforms plain chunk retrieval and general model', async () => {
    const report = await runEvaluation(DEFAULT_EVALUATION_DATASET);
    const { fullPipeline, plainRetrievalNoStructure, generalModelNoRetrieval } = report.baselineComparison;

    // Correctness order: full pipeline > plain retrieval > general model
    expect(fullPipeline.answerCorrectness).toBeGreaterThan(plainRetrievalNoStructure.answerCorrectness);
    expect(plainRetrievalNoStructure.answerCorrectness).toBeGreaterThan(generalModelNoRetrieval.answerCorrectness);

    // Citation accuracy order: full pipeline > plain retrieval > general model
    expect(fullPipeline.citationAccuracy).toBeGreaterThan(plainRetrievalNoStructure.citationAccuracy);

    // Inapplicability error rates: full pipeline has fewest errors
    expect(fullPipeline.applicabilityErrors).toBeLessThan(plainRetrievalNoStructure.applicabilityErrors);
    expect(fullPipeline.confidentInapplicableRate).toBeLessThan(plainRetrievalNoStructure.confidentInapplicableRate);
  });

  it('proves all individual structural features beat the un-structured baseline via structure ablation (§18.2)', async () => {
    const report = await runEvaluation(DEFAULT_EVALUATION_DATASET);
    const plainBaseline = report.baselineComparison.plainRetrievalNoStructure.answerCorrectness;

    for (const [key, feature] of Object.entries(report.structureAblation)) {
      expect(feature.withFeature).toBeGreaterThan(feature.withoutFeature);
      expect(feature.withFeature).toBeGreaterThan(plainBaseline);
      expect(feature.beatsBaseline).toBe(true);
      expect(feature.lift).toBeGreaterThan(0);
    }

    expect(report.summary.allAblationsBeatBaseline).toBe(true);
  });

  it('evaluates calibration curves, ECE, time-travel leakage, and zero-cost extractive mode (§18.1, §18.2)', async () => {
    const report = await runEvaluation(DEFAULT_EVALUATION_DATASET);

    // Calibration
    expect(report.calibration.expectedCalibrationError).toBeLessThan(0.05);
    expect(report.calibration.reliabilityCurve.length).toBe(5);
    expect(report.summary.eceAcceptable).toBe(true);

    // Time-travel leakage: 0 post-cutoff leakage
    expect(report.timeTravelLeakage.testedHistoricalQueries).toBeGreaterThan(0);
    expect(report.timeTravelLeakage.anachronismRate).toBe(0.0);
    expect(report.summary.anachronismRateAcceptable).toBe(true);

    // Presets
    expect(report.presetComparison.freeCloud.costPer1k).toBe(0.0);
    expect(report.presetComparison.reliableLowCost.citationAccuracy).toBeGreaterThan(0.9);

    // Extractive mode
    expect(report.extractiveMode.modelCalls).toBe(0);
    expect(report.extractiveMode.citationAccuracy).toBeGreaterThan(0.9);

    expect(report.summary.status).toBe('pass');
  });
});
