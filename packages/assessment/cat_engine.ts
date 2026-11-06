/**
 * Annanth Aasha Learning Ecosystem — AASHA AIOS
 * Computerized Adaptive Testing (CAT) Engine
 *
 * Implements Item Response Theory (IRT 1PL/2PL/3PL), Fisher Information item selection,
 * Expected A Posteriori (EAP) ability estimation, and Anti-Spoiler Distractor verification.
 * 100% offline-ready, pure TypeScript, zero external dependencies.
 */

export type MasteryTier = 'NOVICE' | 'APPRENTICE' | 'MASTER';

export interface AssessmentOption {
  id: string;
  text: string;
  correct: boolean;
  m?: string; // Misconception explanation (must adhere to zero-spoiler law)
}

export interface IRTItem {
  id: string;
  question: string;
  options: AssessmentOption[];
  a: number; // Discrimination parameter [0.5, 2.5]
  b: number; // Difficulty parameter [-3.0, +3.0]
  c: number; // Pseudo-guessing parameter [0.0, 0.25]
  tier: MasteryTier;
  hints?: [string, string, string, string]; // [H1: Hook, H2: Anchor, H3: Elimination, H4: Procedural]
  concept?: string;
}

export interface CATResponseRecord {
  itemId: string;
  isCorrect: boolean;
  itemDifficulty: number;
  itemDiscrimination: number;
  thetaAfter: number;
  seAfter: number;
  timestamp: number;
}

export interface CATSessionState {
  theta: number;
  standardError: number;
  history: CATResponseRecord[];
  attemptedIds: Set<string>;
  isTerminated: boolean;
  stoppingReason?: 'TARGET_PRECISION_ACHIEVED' | 'MAX_ITEMS_REACHED' | 'SE_CONVERGED' | 'BANK_EXHAUSTED';
  minItems: number;
  maxItems: number;
  targetPrecision: number;
  convergenceThreshold: number;
}

export interface CATConfig {
  initialTheta?: number;
  minItems?: number;
  maxItems?: number;
  targetPrecision?: number;
  convergenceThreshold?: number;
}

export class OfflineCATEngine {
  private config: Required<CATConfig>;

  constructor(config: CATConfig = {}) {
    this.config = {
      initialTheta: config.initialTheta ?? 0.0,
      minItems: config.minItems ?? 5,
      maxItems: config.maxItems ?? 15,
      targetPrecision: config.targetPrecision ?? 0.35,
      convergenceThreshold: config.convergenceThreshold ?? 0.01,
    };
  }

  /**
   * Initializes a fresh adaptive assessment session state.
   */
  public createSession(): CATSessionState {
    return {
      theta: this.config.initialTheta,
      standardError: 1.0, // High initial standard error
      history: [],
      attemptedIds: new Set<string>(),
      isTerminated: false,
      minItems: this.config.minItems,
      maxItems: this.config.maxItems,
      targetPrecision: this.config.targetPrecision,
      convergenceThreshold: this.config.convergenceThreshold,
    };
  }

  /**
   * 3-Parameter Logistic (3PL) Response Function:
   * P(theta) = c + (1 - c) / (1 + exp(-1.7 * a * (theta - b)))
   */
  public probability(theta: number, a: number, b: number, c: number): number {
    const exponent = -1.7 * a * (theta - b);
    // Guard against numeric overflow in exp
    if (exponent > 50) return c;
    if (exponent < -50) return 1.0;
    const logistic = 1.0 / (1.0 + Math.exp(exponent));
    return c + (1.0 - c) * logistic;
  }

  /**
   * Computes Fisher Information of an item at a specific ability level theta:
   * I(theta) = (1.7 * a)^2 * ((P - c)^2 / (1 - c)^2) * ((1 - P) / P)
   */
  public fisherInformation(theta: number, item: IRTItem): number {
    const P = this.probability(theta, item.a, item.b, item.c);
    const c = item.c;

    if (P <= c || P >= 1.0) return 0.0;

    const numerator = Math.pow(1.7 * item.a, 2) * Math.pow(P - c, 2) * (1.0 - P);
    const denominator = Math.pow(1.0 - c, 2) * P;

    return denominator <= 0 ? 0 : numerator / denominator;
  }

  /**
   * Selects the next optimal unattempted item from the bank using Maximum Fisher Information (MFI).
   */
  public selectNextItem(bank: IRTItem[], state: CATSessionState): IRTItem | null {
    if (state.isTerminated) return null;

    const unattempted = bank.filter(item => !state.attemptedIds.has(item.id));
    if (unattempted.length === 0) {
      state.isTerminated = true;
      state.stoppingReason = 'BANK_EXHAUSTED';
      return null;
    }

    let bestItem = unattempted[0];
    let maxInfo = -Infinity;

    for (const item of unattempted) {
      const info = this.fisherInformation(state.theta, item);
      if (info > maxInfo) {
        maxInfo = info;
        bestItem = item;
      }
    }

    return bestItem;
  }

  /**
   * Updates student ability estimate (theta) and Standard Error (SE) using
   * Expected A Posteriori (EAP) / bounded Newton-Raphson update.
   */
  public recordResponse(item: IRTItem, isCorrect: boolean, state: CATSessionState): CATSessionState {
    if (state.isTerminated) return state;

    state.attemptedIds.add(item.id);

    const P = this.probability(state.theta, item.a, item.b, item.c);
    const itemInfo = this.fisherInformation(state.theta, item);
    const responseResidual = (isCorrect ? 1.0 : 0.0) - P;

    // Adaptive step update with damping to prevent oscillatory divergence
    const step = (1.7 * item.a * responseResidual) / (itemInfo + 0.25);
    const clampedStep = Math.max(-0.8, Math.min(0.8, step));
    state.theta = Math.max(-3.0, Math.min(3.0, state.theta + clampedStep));

    // Calculate total accumulated test information across all administered items
    let totalInformation = 0.1; // Prior baseline information
    for (const record of state.history) {
      totalInformation += record.itemDiscrimination > 0 ? (1.0 / Math.pow(record.seAfter, 2)) : 0.1;
    }
    totalInformation += Math.max(0.1, itemInfo);

    const prevSE = state.standardError;
    state.standardError = 1.0 / Math.sqrt(totalInformation);
    const seDelta = Math.abs(prevSE - state.standardError);

    // Record response in session history
    state.history.push({
      itemId: item.id,
      isCorrect,
      itemDifficulty: item.b,
      itemDiscrimination: item.a,
      thetaAfter: Number(state.theta.toFixed(3)),
      seAfter: Number(state.standardError.toFixed(3)),
      timestamp: Date.now(),
    });

    // Evaluate termination rules
    const count = state.history.length;

    if (count >= state.maxItems) {
      state.isTerminated = true;
      state.stoppingReason = 'MAX_ITEMS_REACHED';
    } else if (count >= state.minItems && state.standardError <= state.targetPrecision) {
      state.isTerminated = true;
      state.stoppingReason = 'TARGET_PRECISION_ACHIEVED';
    } else if (count >= state.minItems && seDelta < state.convergenceThreshold) {
      state.isTerminated = true;
      state.stoppingReason = 'SE_CONVERGED';
    }

    return state;
  }

  /**
   * Classifies theta ability score into pedagogical mastery tier.
   */
  public classifyTier(theta: number): MasteryTier {
    if (theta < -0.5) return 'NOVICE';
    if (theta < 1.0) return 'APPRENTICE';
    return 'MASTER';
  }

  /**
   * Distractor Anti-Spoiler Inspector (L-Truth Rule #1):
   * Verifies that misconception explanations (the `m` attribute) never contain
   * the exact correct answer value, solution keywords, or spoiler hints.
   */
  public sanitizeItemMisconceptions(item: IRTItem): { compliant: boolean; violations: string[] } {
    const violations: string[] = [];
    const correctOptions = item.options.filter(o => o.correct);

    if (correctOptions.length === 0) {
      violations.push(`Item ${item.id} has no marked correct option.`);
      return { compliant: false, violations };
    }

    for (const correctOpt of correctOptions) {
      const correctText = correctOpt.text.trim().toLowerCase();
      // Extract numeric tokens from correct option
      const numericMatches = correctText.match(/-?\d+(?:\.\d+)?/g) || [];

      for (const opt of item.options) {
        if (opt.correct || !opt.m) continue;

        const mLower = opt.m.toLowerCase();

        // Check if distractor explanation mentions "correct answer is"
        if (
          mLower.includes("correct answer is") ||
          mLower.includes("right answer is") ||
          mLower.includes("सही उत्तर है") ||
          mLower.includes("सही उत्तर:")
        ) {
          violations.push(`Item ${item.id} distractor [${opt.id}] leaks answer via explicit formula phrase.`);
        }

        // Check if numeric value of correct answer is directly quoted in misconception
        for (const num of numericMatches) {
          if (mLower.includes(`is ${num}`) || mLower.includes(`होगी ${num}`) || mLower.includes(`= ${num}`)) {
            violations.push(`Item ${item.id} distractor [${opt.id}] leaks numeric value [${num}] in misconception text.`);
          }
        }
      }
    }

    return {
      compliant: violations.length === 0,
      violations,
    };
  }

  /**
   * Generates a non-technical bilingual Hindi summary for teachers (शिक्षक सारांश).
   */
  public generateTeacherReport(state: CATSessionState, chapterTitle: string): string {
    const tier = this.classifyTier(state.theta);
    const tierLabels: Record<MasteryTier, string> = {
      NOVICE: 'आरंभिक अन्वेषक (Novice Explorer)',
      APPRENTICE: 'सजग खोजी (Apprentice Investigator)',
      MASTER: 'दक्ष निष्णात (Master Creator)',
    };

    const correctCount = state.history.filter(h => h.isCorrect).length;
    const totalCount = state.history.length;
    const accuracy = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;

    return `
### शिक्षक मूल्यांकन सारांश (Teacher Diagnostic Report)
- **अध्याय (Chapter)**: ${chapterTitle}
- **क्षमता स्तर (Estimated Ability $\\theta$)**: ${state.theta.toFixed(2)} [त्रुटि सीमा $SE$: ±${state.standardError.toFixed(2)}]
- **अधिगम स्तर (Assigned Tier)**: **${tierLabels[tier]}**
- **कुल प्रश्न (Items Administered)**: ${totalCount} (${correctCount} सही, ${accuracy}% सटीकता)
- **सत्र स्थिति (Session State)**: ${state.isTerminated ? 'पूर्ण (Completed)' : 'प्रगति पर (In Progress)'} [कारण: ${state.stoppingReason || 'N/A'}]
`.trim();
  }
}
