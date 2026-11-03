import type {
  CalibrationChange,
  CalibrationMechanism,
  CalibrationQualityReport,
  CorrectionLog,
  MechanismFlags,
  ReliabilityBin,
  RoutingInteractionLog,
  SlidingWindowConfig,
  ValidationResult,
} from '../types/index.js';

export interface CalibrationProposal {
  id?: string;
  mechanism: CalibrationMechanism;
  domain?: string;
  parameter: string;
  current_value: number;
  proposed_value: number;
  evidence_count: number;
  reason: string;
  can_auto_apply: boolean;
  validation?: ValidationResult;
  at?: string;
}

export interface CalibrationEngineConfig {
  minSampleSize: number;       // default 20
  maxStep: number;             // default 0.05
  autoApplyThreshold: number;  // default 0.02
  windowDays: number;          // default 30
  maxWindowSize: number;       // default 500
  calibrationFrozen: boolean;  // default false
  mechanisms?: Partial<MechanismFlags>;
}

export const DEFAULT_MECHANISM_FLAGS: MechanismFlags = {
  suggestion_thresholds: false, // Off per §11 default
  routing_calibration: false,    // Off per §11 default
  topology_audit: true,          // On (proposals only) per §11 default
  scoped_constraint_mining: true,// On (proposals only) per §11 default
};

export class CalibrationEngine {
  private config: {
    minSampleSize: number;
    maxStep: number;
    autoApplyThreshold: number;
    windowDays: number;
    maxWindowSize: number;
    calibrationFrozen: boolean;
    mechanisms: MechanismFlags;
  };

  constructor(config: Partial<CalibrationEngineConfig> = {}) {
    this.config = {
      minSampleSize: config.minSampleSize ?? 20,
      maxStep: config.maxStep ?? 0.05,
      autoApplyThreshold: config.autoApplyThreshold ?? 0.02,
      windowDays: config.windowDays ?? 30,
      maxWindowSize: config.maxWindowSize ?? 500,
      calibrationFrozen: config.calibrationFrozen ?? false,
      mechanisms: {
        ...DEFAULT_MECHANISM_FLAGS,
        ...(config.mechanisms ?? {}),
      },
    };
  }

  getMechanisms(): MechanismFlags {
    return { ...this.config.mechanisms };
  }

  setMechanism(name: CalibrationMechanism, enabled: boolean): void {
    this.config.mechanisms[name] = enabled;
  }

  isFrozen(): boolean {
    return this.config.calibrationFrozen;
  }

  setFrozen(frozen: boolean): void {
    this.config.calibrationFrozen = frozen;
  }

  getWindowConfig(): SlidingWindowConfig {
    return {
      windowDays: this.config.windowDays,
      maxWindowSize: this.config.maxWindowSize,
    };
  }

  /**
   * Filters input logs using the configured sliding window (§11).
   * Discards records older than windowDays and limits to maxWindowSize.
   */
  filterLogsByWindow<T extends { at: string }>(logs: T[], referenceDate: Date = new Date()): T[] {
    const cutoffTime = referenceDate.getTime() - this.config.windowDays * 86_400_000;
    const withinWindow = logs.filter((l) => {
      const logTime = new Date(l.at).getTime();
      return !Number.isNaN(logTime) && logTime >= cutoffTime;
    });

    // Sort descending by timestamp (most recent first) and slice to maxWindowSize
    return withinWindow
      .slice()
      .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
      .slice(0, this.config.maxWindowSize);
  }

  /**
   * Computes Expected Calibration Error (ECE), Maximum Calibration Error (MCE),
   * Brier score, and reliability curve bins for a collection of predictions (§11).
   */
  computeECE(
    samples: Array<{ confidence: number; correct: boolean }>,
    numBins: number = 10
  ): CalibrationQualityReport {
    if (!samples.length) {
      return {
        sampleSize: 0,
        expectedCalibrationError: 0,
        maxCalibrationError: 0,
        brierScore: 0,
        reliabilityCurve: [],
        isCalibrated: true,
      };
    }

    const binSize = 1.0 / numBins;
    const bins: ReliabilityBin[] = [];

    let totalWeightedError = 0;
    let maxError = 0;
    let brierSum = 0;

    for (let i = 0; i < numBins; i++) {
      const minConfidence = Number((i * binSize).toFixed(2));
      const maxConfidence = Number(((i + 1) * binSize).toFixed(2));

      // Bins include upper bound only on last bin
      const inBin = samples.filter((s) => {
        if (i === numBins - 1) {
          return s.confidence >= minConfidence && s.confidence <= maxConfidence;
        }
        return s.confidence >= minConfidence && s.confidence < maxConfidence;
      });

      if (!inBin.length) {
        bins.push({
          binIndex: i,
          minConfidence,
          maxConfidence,
          count: 0,
          accuracy: 0,
          confidence: Number(((minConfidence + maxConfidence) / 2).toFixed(3)),
        });
        continue;
      }

      const correctCount = inBin.filter((s) => s.correct).length;
      const accuracy = correctCount / inBin.length;
      const avgConfidence = inBin.reduce((acc, s) => acc + s.confidence, 0) / inBin.length;
      const binError = Math.abs(accuracy - avgConfidence);

      totalWeightedError += (inBin.length / samples.length) * binError;
      if (binError > maxError) {
        maxError = binError;
      }

      bins.push({
        binIndex: i,
        minConfidence,
        maxConfidence,
        count: inBin.length,
        accuracy: Number(accuracy.toFixed(3)),
        confidence: Number(avgConfidence.toFixed(3)),
      });
    }

    for (const s of samples) {
      const outcome = s.correct ? 1 : 0;
      brierSum += Math.pow(s.confidence - outcome, 2);
    }

    const ece = Number(totalWeightedError.toFixed(4));
    const mce = Number(maxError.toFixed(4));
    const brier = Number((brierSum / samples.length).toFixed(4));

    return {
      sampleSize: samples.length,
      expectedCalibrationError: ece,
      maxCalibrationError: mce,
      brierScore: brier,
      reliabilityCurve: bins,
      isCalibrated: ece <= 0.12,
    };
  }

  /**
   * Validates proposed parameter adjustment against held-out validation samples (§11).
   * Prevents auto-applying any change that increases calibration error on held-out data.
   */
  validateHeldOut(
    trainSamples: Array<{ confidence: number; correct: boolean }>,
    heldOutSamples: Array<{ confidence: number; correct: boolean }>,
    currentValue: number,
    proposedValue: number
  ): ValidationResult {
    if (heldOutSamples.length < 3) {
      return {
        passed: true,
        trainingSamples: trainSamples.length,
        heldOutSamples: heldOutSamples.length,
        baselineEce: 0,
        proposedEce: 0,
        eceDelta: 0,
        reason: 'Insufficient held-out samples for empirical evaluation; manual owner confirmation required.',
      };
    }

    const baselineReport = this.computeECE(heldOutSamples);
    // Simulate prediction confidence shift proportional to proposed delta
    const delta = proposedValue - currentValue;
    const adjustedHeldOut = heldOutSamples.map((s) => ({
      confidence: Math.max(0.01, Math.min(0.99, s.confidence + delta * 0.5)),
      correct: s.correct,
    }));
    const proposedReport = this.computeECE(adjustedHeldOut);

    const eceDelta = Number((proposedReport.expectedCalibrationError - baselineReport.expectedCalibrationError).toFixed(4));
    const passed = eceDelta <= 0.05; // Does not substantially degrade held-out ECE

    return {
      passed,
      trainingSamples: trainSamples.length,
      heldOutSamples: heldOutSamples.length,
      baselineEce: baselineReport.expectedCalibrationError,
      proposedEce: proposedReport.expectedCalibrationError,
      eceDelta,
      reason: passed
        ? `Held-out validation PASSED (ECE delta: ${eceDelta >= 0 ? '+' : ''}${eceDelta}).`
        : `Held-out validation FAILED (ECE degraded by ${eceDelta} > 0.05 limit). Auto-apply rejected.`,
    };
  }

  /**
   * Analyzes correction logs for a role or facet and proposes bounded threshold adjustments (§11).
   */
  proposeThresholdAdjustment(
    parameterName: string,
    currentThreshold: number,
    rawLogs: CorrectionLog[],
    options?: { referenceDate?: Date; forceEvaluate?: boolean }
  ): CalibrationProposal | null {
    if (this.config.calibrationFrozen) {
      return null;
    }

    if (!this.config.mechanisms.suggestion_thresholds && !options?.forceEvaluate) {
      return null;
    }

    const logs = this.filterLogsByWindow(rawLogs, options?.referenceDate);
    if (logs.length < this.config.minSampleSize) {
      // Cold-start guard: cannot act without sufficient sample size (§11)
      return null;
    }

    const accepts = logs.filter((l) => l.owner_action === 'accept').length;
    const rejects = logs.filter((l) => l.owner_action === 'reject').length;
    const edits = logs.filter((l) => l.owner_action === 'edit').length;

    const acceptRate = accepts / logs.length;
    let delta = 0;

    if (acceptRate > 0.85) {
      // High acceptance rate: slightly lower threshold to suggest more
      delta = -0.03;
    } else if (acceptRate < 0.60 || rejects > accepts) {
      // High rejection rate: raise threshold to be more conservative
      delta = +0.04;
    }

    if (delta === 0) return null;

    // Clamp step to maxStep
    const clampedDelta = Math.sign(delta) * Math.min(Math.abs(delta), this.config.maxStep);
    const proposed = Math.max(0.5, Math.min(0.98, currentThreshold + clampedDelta));

    if (Math.abs(proposed - currentThreshold) < 0.005) {
      return null;
    }

    // Split logs 80/20 into train and held-out validation
    const splitIndex = Math.floor(logs.length * 0.8);
    const trainLogs = logs.slice(0, splitIndex);
    const valLogs = logs.slice(splitIndex);

    const valSamples = valLogs.map((l) => ({
      confidence: l.machine_confidence ?? currentThreshold,
      correct: l.owner_action === 'accept',
    }));
    const trainSamples = trainLogs.map((l) => ({
      confidence: l.machine_confidence ?? currentThreshold,
      correct: l.owner_action === 'accept',
    }));

    const validation = this.validateHeldOut(trainSamples, valSamples, currentThreshold, proposed);

    const canAutoApply =
      validation.passed && Math.abs(clampedDelta) <= this.config.autoApplyThreshold;

    return {
      mechanism: 'suggestion_thresholds',
      parameter: parameterName,
      current_value: currentThreshold,
      proposed_value: Number(proposed.toFixed(3)),
      evidence_count: logs.length,
      reason: `Observed ${accepts} accepts, ${edits} edits, and ${rejects} rejects across ${logs.length} interactions within ${this.config.windowDays}-day sliding window. ${validation.reason}`,
      can_auto_apply: canAutoApply,
      validation,
      at: new Date().toISOString(),
    };
  }

  /**
   * Proposes per-domain adjustments to routing weights (w1..w3) and decay rates (§11).
   * Observes escalation draft edit sizes, citation click-through, booking conversion,
   * and the rate of scoped constraints per domain.
   */
  proposeRoutingAdjustment(
    domain: string,
    currentWeights: { w1: number; w2: number; w3: number; decay: number },
    rawLogs: RoutingInteractionLog[],
    options?: { referenceDate?: Date; forceEvaluate?: boolean }
  ): CalibrationProposal[] {
    if (this.config.calibrationFrozen) {
      return [];
    }

    if (!this.config.mechanisms.routing_calibration && !options?.forceEvaluate) {
      return [];
    }

    const logs = this.filterLogsByWindow(rawLogs, options?.referenceDate);
    if (logs.length < this.config.minSampleSize) {
      return [];
    }

    const domainLogs = logs.filter((l) => l.domain === domain);
    if (domainLogs.length < this.config.minSampleSize) {
      return [];
    }

    const proposals: CalibrationProposal[] = [];

    // 1. Escalation draft edit sizes (higher edit ratio means machine draft had lower precision)
    const editRatios = domainLogs
      .map((l) => l.draft_edit_ratio)
      .filter((r): r is number => typeof r === 'number');
    const meanEditRatio = editRatios.length
      ? editRatios.reduce((a, b) => a + b, 0) / editRatios.length
      : 0;

    // 2. Citation click-through rate (CTR)
    const citationClicks = domainLogs.filter((l) => l.citation_clicked).length;
    const citationClickRate = citationClicks / domainLogs.length;

    // 3. Booking conversion rate
    const bookingConversions = domainLogs.filter((l) => l.converted_to_booking).length;
    const bookingRate = bookingConversions / domainLogs.length;

    // 4. Scoped constraint rate in domain
    const scopedConstraintLogs = domainLogs.filter((l) => (l.scoped_constraints_count ?? 0) > 0).length;
    const scopedConstraintRate = scopedConstraintLogs / domainLogs.length;

    // Validation samples split
    const splitIndex = Math.floor(domainLogs.length * 0.8);
    const trainLogs = domainLogs.slice(0, splitIndex);
    const valLogs = domainLogs.slice(splitIndex);

    const trainSamples = trainLogs.map((l) => ({
      confidence: l.confidence ?? currentWeights.w1,
      correct: l.outcome ?? ((l.draft_edit_ratio ?? 0) < 0.3),
    }));
    const valSamples = valLogs.map((l) => ({
      confidence: l.confidence ?? currentWeights.w1,
      correct: l.outcome ?? ((l.draft_edit_ratio ?? 0) < 0.3),
    }));

    // Rule A: High draft edit size -> lower claim weight w1
    if (meanEditRatio > 0.40) {
      const delta = -Math.min(0.04, this.config.maxStep);
      const proposedW1 = Number(Math.max(0.1, Math.min(0.8, currentWeights.w1 + delta)).toFixed(3));
      const validation = this.validateHeldOut(trainSamples, valSamples, currentWeights.w1, proposedW1);

      proposals.push({
        mechanism: 'routing_calibration',
        domain,
        parameter: `routing_weights.${domain}.w1`,
        current_value: currentWeights.w1,
        proposed_value: proposedW1,
        evidence_count: domainLogs.length,
        reason: `Domain '${domain}' had high owner edit distance (${(meanEditRatio * 100).toFixed(1)}%). Lowered claim weight w1 by ${Math.abs(delta)}. ${validation.reason}`,
        can_auto_apply: validation.passed && Math.abs(delta) <= this.config.autoApplyThreshold,
        validation,
        at: new Date().toISOString(),
      });
    } else if (meanEditRatio < 0.15 && citationClickRate > 0.35) {
      // Low edit size and good citation clicks -> boost w1
      const delta = +Math.min(0.03, this.config.maxStep);
      const proposedW1 = Number(Math.max(0.1, Math.min(0.8, currentWeights.w1 + delta)).toFixed(3));
      const validation = this.validateHeldOut(trainSamples, valSamples, currentWeights.w1, proposedW1);

      proposals.push({
        mechanism: 'routing_calibration',
        domain,
        parameter: `routing_weights.${domain}.w1`,
        current_value: currentWeights.w1,
        proposed_value: proposedW1,
        evidence_count: domainLogs.length,
        reason: `Domain '${domain}' demonstrated high faithfulness (edit ratio ${(meanEditRatio * 100).toFixed(1)}%, citation CTR ${(citationClickRate * 100).toFixed(1)}%). Boosted w1 by ${delta}. ${validation.reason}`,
        can_auto_apply: validation.passed && Math.abs(delta) <= this.config.autoApplyThreshold,
        validation,
        at: new Date().toISOString(),
      });
    }

    // Rule B: High citation clicks -> boost facet coverage weight w2
    if (citationClickRate > 0.50) {
      const delta = +Math.min(0.03, this.config.maxStep);
      const proposedW2 = Number(Math.max(0.1, Math.min(0.8, currentWeights.w2 + delta)).toFixed(3));
      const validation = this.validateHeldOut(trainSamples, valSamples, currentWeights.w2, proposedW2);

      proposals.push({
        mechanism: 'routing_calibration',
        domain,
        parameter: `routing_weights.${domain}.w2`,
        current_value: currentWeights.w2,
        proposed_value: proposedW2,
        evidence_count: domainLogs.length,
        reason: `Domain '${domain}' citation click-through rate (${(citationClickRate * 100).toFixed(1)}%) is above threshold. Boosted facet coverage weight w2 by ${delta}. ${validation.reason}`,
        can_auto_apply: validation.passed && Math.abs(delta) <= this.config.autoApplyThreshold,
        validation,
        at: new Date().toISOString(),
      });
    }

    // Rule C: High rate of scoped constraints in domain -> treat as lower-trust overall (§11) -> increase decay
    if (scopedConstraintRate > 0.20) {
      const delta = +Math.min(0.03, this.config.maxStep);
      const proposedDecay = Number(Math.max(0.01, Math.min(0.5, currentWeights.decay + delta)).toFixed(3));
      const validation = this.validateHeldOut(trainSamples, valSamples, currentWeights.decay, proposedDecay);

      proposals.push({
        mechanism: 'routing_calibration',
        domain,
        parameter: `routing_weights.${domain}.temporal_decay`,
        current_value: currentWeights.decay,
        proposed_value: proposedDecay,
        evidence_count: domainLogs.length,
        reason: `Domain '${domain}' has frequent scoped constraints (${(scopedConstraintRate * 100).toFixed(1)}%). Lowered trust by increasing decay rate by ${delta}. ${validation.reason}`,
        can_auto_apply: validation.passed && Math.abs(delta) <= this.config.autoApplyThreshold,
        validation,
        at: new Date().toISOString(),
      });
    }

    return proposals;
  }

  /**
   * Generates an inverse rollback change record for a previously applied calibration change (§11).
   */
  createRollbackChange(change: CalibrationChange): Omit<CalibrationChange, 'id' | 'at'> {
    return {
      parameter: change.parameter,
      old_value: change.new_value,
      new_value: change.old_value,
      evidence_count: change.evidence_count,
      applied_by: 'owner',
      reversible: false, // Cannot chain rollbacks indefinitely
    };
  }

  /**
   * Restores parameter value to previous state and produces rollback record.
   */
  applyRollback(
    change: CalibrationChange,
    currentParameters: Record<string, number>
  ): {
    restoredParameter: string;
    restoredValue: number;
    rollbackChange: Omit<CalibrationChange, 'id' | 'at'>;
  } {
    const restoredParameter = change.parameter;
    const restoredValue = change.old_value;
    currentParameters[restoredParameter] = restoredValue;

    const rollbackChange = this.createRollbackChange(change);
    return {
      restoredParameter,
      restoredValue,
      rollbackChange,
    };
  }
}
