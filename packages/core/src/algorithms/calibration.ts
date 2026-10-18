import type { CalibrationChange, CorrectionLog } from '../types/index.js';

export interface CalibrationProposal {
  parameter: string;
  current_value: number;
  proposed_value: number;
  evidence_count: number;
  reason: string;
  can_auto_apply: boolean;
}

export interface CalibrationEngineConfig {
  minSampleSize: number;     // default 20
  maxStep: number;           // default 0.05
  autoApplyThreshold: number;// default 0.02
}

export class CalibrationEngine {
  private config: CalibrationEngineConfig;

  constructor(config: Partial<CalibrationEngineConfig> = {}) {
    this.config = {
      minSampleSize: config.minSampleSize ?? 20,
      maxStep: config.maxStep ?? 0.05,
      autoApplyThreshold: config.autoApplyThreshold ?? 0.02,
    };
  }

  /**
   * Analyzes correction logs for a role or facet and proposes bounded threshold adjustments.
   */
  proposeThresholdAdjustment(
    parameterName: string,
    currentThreshold: number,
    logs: CorrectionLog[]
  ): CalibrationProposal | null {
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

    const canAutoApply = Math.abs(clampedDelta) <= this.config.autoApplyThreshold;

    return {
      parameter: parameterName,
      current_value: currentThreshold,
      proposed_value: Number(proposed.toFixed(3)),
      evidence_count: logs.length,
      reason: `Observed ${accepts} accepts, ${edits} edits, and ${rejects} rejects across ${logs.length} interactions.`,
      can_auto_apply: canAutoApply,
    };
  }

  /**
   * Generates a rollback record to revert a calibration change.
   */
  createRollbackChange(change: CalibrationChange): Omit<CalibrationChange, 'id' | 'at'> {
    return {
      parameter: change.parameter,
      old_value: change.new_value,
      new_value: change.old_value,
      evidence_count: change.evidence_count,
      applied_by: 'owner',
      reversible: true,
    };
  }
}
