/**
 * AASHA AIOS — Deterministic Ten-Frame Mathematical Evaluator
 * Path: Aasha-AI/packages/adapters/ten_frame_evaluator.ts
 *
 * Implements Section 2A.14 (Mathematical Contract):
 * Separates Math Model -> Expected State -> Interaction Representation -> Response -> Deterministic Evaluation.
 * Pure deterministic mathematics with zero runtime LLM dependency.
 */

export interface TenFrameMathConfig {
  targetSum: number;         // Target sum (1 <= targetSum <= 10)
  startingQuantity: number;  // Starting quantity already in frame (0 <= startingQuantity < targetSum)
  maxCapacity: number;       // Grid frame capacity (default: 10)
}

export interface TenFrameEvaluationResult {
  isCorrect: boolean;
  targetSum: number;
  startingQuantity: number;
  neededQuantity: number;
  placedQuantity: number;
  currentTotal: number;
  difference: number;        // currentTotal - targetSum
  diagnosticSignal: 'TARGET_MATCH' | 'UNDERFILL' | 'OVERFILL' | 'EMPTY_ATTEMPT' | 'INVALID_QUANTITY';
  diagnosticExplanation: string; // Zero-spoiler pedagogical diagnosis
  evidenceType: 'CONCEPTUAL_ADDITION' | 'PLACE_VALUE_COMPLETION' | 'OVERFILL_ERROR' | 'INCOMPLETE_COUNT';
}

export class TenFrameMathEvaluator {
  private config: TenFrameMathConfig;

  constructor(config?: Partial<TenFrameMathConfig>) {
    const target = config?.targetSum !== undefined ? Math.floor(config.targetSum) : 10;
    const start = config?.startingQuantity !== undefined ? Math.floor(config.startingQuantity) : 4;
    const capacity = config?.maxCapacity !== undefined ? Math.floor(config.maxCapacity) : 10;

    // Boundary constraint assertions
    this.config = {
      targetSum: Math.max(1, Math.min(capacity, target)),
      startingQuantity: Math.max(0, Math.min(target - 1, start)),
      maxCapacity: Math.max(1, capacity),
    };
  }

  public getConfig(): Readonly<TenFrameMathConfig> {
    return { ...this.config };
  }

  public getNeededQuantity(): number {
    return this.config.targetSum - this.config.startingQuantity;
  }

  /**
   * Deterministically evaluates learner placement.
   * Pure evaluation function: no side effects, no mutation.
   */
  public evaluate(placedQuantity: number): TenFrameEvaluationResult {
    const needed = this.getNeededQuantity();
    const placed = Number.isFinite(placedQuantity) ? Math.floor(placedQuantity) : 0;
    const currentTotal = this.config.startingQuantity + placed;
    const diff = currentTotal - this.config.targetSum;

    if (placed < 0 || placed > this.config.maxCapacity) {
      return {
        isCorrect: false,
        targetSum: this.config.targetSum,
        startingQuantity: this.config.startingQuantity,
        neededQuantity: needed,
        placedQuantity: placed,
        currentTotal,
        difference: diff,
        diagnosticSignal: 'INVALID_QUANTITY',
        diagnosticExplanation: 'Quantity must be within frame capacity boundaries.',
        evidenceType: 'INCOMPLETE_COUNT',
      };
    }

    if (placed === 0) {
      return {
        isCorrect: false,
        targetSum: this.config.targetSum,
        startingQuantity: this.config.startingQuantity,
        neededQuantity: needed,
        placedQuantity: 0,
        currentTotal,
        difference: diff,
        diagnosticSignal: 'EMPTY_ATTEMPT',
        diagnosticExplanation: 'No counters placed yet; empty spaces remain to be filled.',
        evidenceType: 'INCOMPLETE_COUNT',
      };
    }

    if (placed === needed) {
      return {
        isCorrect: true,
        targetSum: this.config.targetSum,
        startingQuantity: this.config.startingQuantity,
        neededQuantity: needed,
        placedQuantity: placed,
        currentTotal: this.config.targetSum,
        difference: 0,
        diagnosticSignal: 'TARGET_MATCH',
        diagnosticExplanation: 'Correct quantity placed; ten-frame target achieved perfectly.',
        evidenceType: 'CONCEPTUAL_ADDITION',
      };
    }

    if (placed < needed) {
      return {
        isCorrect: false,
        targetSum: this.config.targetSum,
        startingQuantity: this.config.startingQuantity,
        neededQuantity: needed,
        placedQuantity: placed,
        currentTotal,
        difference: diff,
        diagnosticSignal: 'UNDERFILL',
        diagnosticExplanation: 'Incomplete addition; additional counters are required to reach the target sum.',
        evidenceType: 'INCOMPLETE_COUNT',
      };
    }

    // placed > needed
    return {
      isCorrect: false,
      targetSum: this.config.targetSum,
      startingQuantity: this.config.startingQuantity,
      neededQuantity: needed,
      placedQuantity: placed,
      currentTotal,
      difference: diff,
      diagnosticSignal: 'OVERFILL',
      diagnosticExplanation: 'Exceeded target sum; more counters were added than the target requires.',
      evidenceType: 'OVERFILL_ERROR',
    };
  }
}
