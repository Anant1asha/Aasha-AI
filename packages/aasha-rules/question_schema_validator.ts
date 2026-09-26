/**
 * AASHA Universal Teaching Language System
 * Strict Question Schema & Exercise Bank Validator
 * ===================================================
 * Enforces:
 * 1. Rule #1 Zero-Spoiler Invariant (L-Truth Benchmark Standard)
 * 2. High-Quality Pedagogical Misconception Diagnosis (m field)
 * 3. 4-Tier Progressive Scaffolding Hints without answer leakage across ALL tiers (1-4)
 * 4. 100% Textbook Exercise Mapping & 3-Tier Structure (Warm-up, Deep Dive, Boss)
 * 5. Robust LaTeX & Unicode Mathematical Expression Normalization
 */

export interface QuestionOption {
  t: string;           // Option text
  c: boolean;          // Is correct? (Exactly one true per question)
  m?: string;          // Misconception explanation (empty for c=true, mandatory & diagnostic for c=false)
  xp?: number;         // Optional XP points
}

export interface QuestionHints {
  h1?: string;         // Tier 1: Attention hook
  h2?: string;         // Tier 2: Conceptual relationship
  h3?: string;         // Tier 3: Strategy / Rule
  h4?: string;         // Tier 4: Intermediate procedural step
  hint_1_attention?: string;
  hint_2_relationship?: string;
  hint_3_strategy?: string;
  hint_4_procedure?: string;
}

export interface AssessmentQuestion {
  id?: string;
  q: string;                      // Question text
  opts: QuestionOption[];          // 3-4 options
  tier?: 'warmup' | 'deep_dive' | 'boss' | 1 | 2 | 3;
  hints?: QuestionHints;
  concept_id?: string;
  node_id?: string;
  difficulty?: string;
}

export interface QuestionValidationError {
  questionId: string;
  ruleId: string;
  severity: 'ERROR' | 'WARNING';
  message: string;
  context?: string;
}

export interface ValidationSummary {
  passed: boolean;
  totalQuestions: number;
  totalDistractors: number;
  totalHintsChecked: number;
  spoilerViolations: number;
  missingMisconceptions: number;
  lowQualityMisconceptions: number;
  structureViolations: number;
  hintViolations: number;
  score: number; // 0 - 100
  errors: QuestionValidationError[];
  warnings: QuestionValidationError[];
}

export const TRIVIAL_MISCONCEPTION_PATTERNS = [
  /^(?:wrong|incorrect|false|not correct|not right|try again|think again|review the concept|check again|no|rethink)[.!]?$/i,
  /^(?:this is wrong|that is wrong|this is incorrect|that is incorrect)[.!]?$/i,
  /^(?:review chapter|read again|study again|see notes|review the foundational concept rule)[.!]?$/i
];

export const SPOILER_PHRASES = [
  'the result is',
  'the correct answer is',
  'correct answer is',
  'giving',
  'gives',
  'answer is',
  'answer was',
  'answer should be',
  'sum is',
  'product is',
  'difference is',
  'quotient is',
  'leaving no',
  'which is equal to',
  'equals to',
  'equal to',
  'evaluates to',
  'instead of',
  'yielding',
  'yields',
  'produces',
  'leads to'
];

export const LEAK_PREDICATES = [
  'is', 'was', '=', 'giving', 'gives', 'give', 'becomes', 'became',
  ', not \\+?', 'not', 'equals', 'equal to', 'equals to', 'result is', 'results in',
  'yielding', 'yields', 'produces', 'produced', 'produces a value of',
  'leaving', 'leaves', 'leads to', 'should be', 'must be', 'to get',
  'target is', 'target value is', 'correct value is', 'correct answer is',
  'answer is', 'answer was', 'answer:', 'instead of'
];

export const STOPWORDS = new Set([
  'a', 'i', 'is', 'to', 'in', 'of', 'or', 'and', 'no', 'so', 'yes', 'all', 'one', 'two', 'true', 'false'
]);

export function normalizeMathText(text: string): string {
  if (!text) return '';
  return String(text)
    .replace(/[\u2212\u2013\u2014]/g, '-')
    .replace(/\\(?:d?frac)\{([^}]+)\}\{([^}]+)\}/g, '$1/$2')
    .replace(/\^{?([^{}\s]+)}?/g, '^$1')
    .replace(/\\(?:times|cdot)/g, '*')
    .replace(/\\(?:text|mathrm|mathbf)\{([^}]+)\}/g, '$1')
    .replace(/[\$\(\)\\]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function escapeRegex(str: string): string {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export class QuestionSchemaValidator {
  /**
   * Validates a single option for zero spoiler and pedagogical quality.
   */
  static validateDistractor(
    option: QuestionOption,
    correctOption: QuestionOption,
    qContext: string,
    optIdx: number
  ): QuestionValidationError[] {
    const errors: QuestionValidationError[] = [];
    const qId = qContext;

    if (option.c === true) {
      if (option.m && option.m.trim().length > 0) {
        errors.push({
          questionId: qId,
          ruleId: 'RULE_1_CORRECT_OPTION_M_EMPTY',
          severity: 'WARNING',
          message: `Correct option #${optIdx + 1} ('${option.t}') should have an empty 'm' field. Received: "${option.m}"`,
          context: qContext
        });
      }
      return errors;
    }

    const mText = (option.m || '').trim();

    // 1. Missing misconception
    if (!mText) {
      errors.push({
        questionId: qId,
        ruleId: 'RULE_1_MISSING_MISCONCEPTION',
        severity: 'ERROR',
        message: `Distractor #${optIdx + 1} ('${option.t}') is missing misconception diagnosis ('m' field is empty). Every distractor must explain why this mistake happens.`,
        context: qContext
      });
      return errors;
    }

    // 2. Trivial placeholder
    for (const pattern of TRIVIAL_MISCONCEPTION_PATTERNS) {
      if (pattern.test(mText) || mText.length < 12) {
        errors.push({
          questionId: qId,
          ruleId: 'RULE_1_LOW_QUALITY_MISCONCEPTION',
          severity: 'ERROR',
          message: `Distractor #${optIdx + 1} misconception "${mText}" is a trivial non-diagnostic placeholder. Must provide actionable diagnostic reasoning (minimum 12+ chars).`,
          context: qContext
        });
        break;
      }
    }

    // 3. Prohibited negative feedback
    if (/❌\s*incorrect/i.test(mText) || /❌\s*wrong/i.test(mText)) {
      errors.push({
        questionId: qId,
        ruleId: 'SECTION_11_NEGATIVE_FEEDBACK',
        severity: 'ERROR',
        message: `Distractor #${optIdx + 1} contains purely evaluative negative phrasing ('❌ incorrect'). Feedback must diagnose the misconception constructively.`,
        context: qContext
      });
    }

    // 4. Zero-Spoiler Invariant
    if (!correctOption || !correctOption.t) return errors;

    const rawCorrect = String(correctOption.t).trim();
    const normCorrect = normalizeMathText(rawCorrect).toLowerCase();
    const normM = normalizeMathText(mText).toLowerCase();

    // 4a. Boolean stopword bypass hardening (True / False answer leak detection)
    const isBooleanTarget = /^(?:true|false)$/i.test(normCorrect);
    if (isBooleanTarget) {
      const boolLeakRegex = new RegExp(
        '(?:\\b(?:' + LEAK_PREDICATES.map(p => escapeRegex(p).replace(/\s+/g, '\\s+(?:[a-z]+\\s+)?')).join('|') + '|statement\\s+is|claim\\s+is|option\\s+is|actually)\\b)\\s*(?:[a-z]+\\s*){0,3}[:=]?\\s*\\b' + escapeRegex(normCorrect) + '\\b',
        'i'
      );
      if (boolLeakRegex.test(normM)) {
        errors.push({
          questionId: qId,
          ruleId: 'RULE_1_SPOILER_BOOLEAN_LEAK',
          severity: 'ERROR',
          message: `Rule #1 Spoiler: Distractor #${optIdx + 1} ('${option.t}') reveals target boolean answer '${rawCorrect}' in explanation: "${mText}".`,
          context: qContext
        });
        return errors;
      }
    }

    // 4b. Verbatim target answer inclusion (for non-pure-number terms, e.g. text/phrases/algebra)
    const isPureNumber = /^-?\d+(?:\.\d+)?$/.test(normCorrect);
    if (!isPureNumber && normCorrect.length > 0) {
      const isStopword = STOPWORDS.has(normCorrect);
      if (!isStopword) {
        let verbatimMatch = false;
        if (normCorrect.length >= 3) {
          verbatimMatch = normM.includes(normCorrect);
        } else {
          // For short non-number tokens (e.g. x, 2x), use word/boundary matching
          const shortRegex = new RegExp(`(?:^|[\\s,;:(])${escapeRegex(normCorrect)}(?:$|[\\s,;:).!?])`, 'i');
          verbatimMatch = shortRegex.test(normM);
        }

        if (verbatimMatch) {
          errors.push({
            questionId: qId,
            ruleId: 'RULE_1_SPOILER_VERBATIM_ANSWER',
            severity: 'ERROR',
            message: `Rule #1 Spoiler: Distractor #${optIdx + 1} ('${option.t}') leaks the verbatim correct answer text '${rawCorrect}' in its explanation: "${mText}".`,
            context: qContext
          });
          return errors;
        }
      }
    }

    // 4c. Fraction answer leakage
    const fracMatch = normCorrect.match(/^(-?\d+)\s*\/\s*(\d+)$/);
    if (fracMatch) {
      const num = fracMatch[1];
      const den = fracMatch[2];
      const fracRegex = new RegExp(`(?:${LEAK_PREDICATES.join('|')})?\\s*[:=]?\\s*${escapeRegex(num)}\\s*\\/\\s*${escapeRegex(den)}\\b`, 'i');
      if (fracRegex.test(normM)) {
        errors.push({
          questionId: qId,
          ruleId: 'RULE_1_SPOILER_FRACTION_LEAK',
          severity: 'ERROR',
          message: `Rule #1 Spoiler: Distractor #${optIdx + 1} reveals the target fraction '${rawCorrect}' in explanation: "${mText}".`,
          context: qContext
        });
        return errors;
      }
    }

    // 4d. Numerical value leakage patterns with adverb/modifier tolerance (up to 4 qualifier words)
    const nums = normCorrect.match(/-?\d+(?:\.\d+)?/g) || [];
    for (const n of nums) {
      const escapedN = escapeRegex(n);
      const leakPattern = new RegExp(
        '(?:\\b(?:' + LEAK_PREDICATES.map(p => escapeRegex(p).replace(/\s+/g, '\\s+(?:[a-z]+\\s+)?')).join('|') + ')\\b)\\s*(?:[a-z]+\\s*){0,4}[:=]?\\s*\\b' + escapedN + '\\b',
        'i'
      );
      if (leakPattern.test(normM)) {
        errors.push({
          questionId: qId,
          ruleId: 'RULE_1_SPOILER_NUMERICAL_LEAK',
          severity: 'ERROR',
          message: `Rule #1 Spoiler: Distractor #${optIdx + 1} explicitly reveals target numerical value '${n}' in explanation: "${mText}".`,
          context: qContext
        });
        return errors;
      }
    }

    // 4d. Revealing phrasing + number in close proximity with word boundary
    for (const phrase of SPOILER_PHRASES) {
      for (const n of nums) {
        const escapedN = escapeRegex(n);
        const phraseLeakPattern = new RegExp(`(?:${escapeRegex(phrase)})\\s*(?:[a-z]+\\s*){0,3}[:=]?\\s*\\b${escapedN}\\b`, 'i');
        if (phraseLeakPattern.test(normM)) {
          errors.push({
            questionId: qId,
            ruleId: 'RULE_1_SPOILER_PHRASE_LEAK',
            severity: 'ERROR',
            message: `Rule #1 Spoiler: Distractor #${optIdx + 1} contains revealing phrase '${phrase}' directly revealing answer value '${n}' in: "${mText}".`,
            context: qContext
          });
          return errors;
        }
      }
    }

    return errors;
  }

  /**
   * Validates progressive scaffolding hints across ALL tiers (1-4).
   */
  static validateHints(
    hints: QuestionHints,
    correctOption: QuestionOption,
    qContext: string
  ): QuestionValidationError[] {
    const errors: QuestionValidationError[] = [];
    if (!hints || !correctOption || !correctOption.t) return errors;

    const hintList = [
      hints.h1 || hints.hint_1_attention,
      hints.h2 || hints.hint_2_relationship,
      hints.h3 || hints.hint_3_strategy,
      hints.h4 || hints.hint_4_procedure,
    ].filter(h => Boolean(h && String(h).trim().length > 0));

    const rawCorrect = String(correctOption.t).trim();
    const normCorrect = normalizeMathText(rawCorrect).toLowerCase();
    const nums = normCorrect.match(/-?\d+(?:\.\d+)?/g) || [];
    const isStopword = STOPWORDS.has(normCorrect);

    hintList.forEach((hintText, hIdx) => {
      const normH = normalizeMathText(hintText || '').toLowerCase();

      if (normCorrect.length > 0 && !isStopword) {
        let verbatimHint = false;
        if (normCorrect.length >= 3) {
          verbatimHint = normH.includes(normCorrect);
        } else {
          const shortRegex = new RegExp(`(?:^|[\\s,;:(])${escapeRegex(normCorrect)}(?:$|[\\s,;:).!?])`, 'i');
          verbatimHint = shortRegex.test(normH);
        }

        if (verbatimHint) {
          errors.push({
            questionId: qContext,
            ruleId: 'RULE_12_HINT_SPOILER',
            severity: 'ERROR',
            message: `Progressive Hint Tier ${hIdx + 1} leaks target answer '${correctOption.t}' in: "${hintText}".`,
            context: qContext
          });
        }
      }

      for (const n of nums) {
        const escapedN = escapeRegex(n);
        const leakPattern = new RegExp(`(?:${LEAK_PREDICATES.join('|')})\\s*[:=]?\\s*${escapedN}\\b`, 'i');
        if (leakPattern.test(normH)) {
          errors.push({
            questionId: qContext,
            ruleId: 'RULE_12_HINT_SPOILER_VALUE',
            severity: 'ERROR',
            message: `Progressive Hint Tier ${hIdx + 1} reveals answer value '${n}' in: "${hintText}".`,
            context: qContext
          });
        }
      }
    });

    return errors;
  }

  /**
   * Validates an entire question object.
   */
  static validateQuestion(q: AssessmentQuestion, index: number = 0): QuestionValidationError[] {
    const qId = q.id || `Q_${index + 1}`;
    const errors: QuestionValidationError[] = [];

    if (!q.q || String(q.q).trim().length < 5) {
      errors.push({
        questionId: qId,
        ruleId: 'SCHEMA_INVALID_QUESTION_PROMPT',
        severity: 'ERROR',
        message: `Question '${qId}' has missing or too short question prompt.`,
        context: qId
      });
    }

    if (!Array.isArray(q.opts) || q.opts.length < 3 || q.opts.length > 4) {
      errors.push({
        questionId: qId,
        ruleId: 'SCHEMA_INVALID_OPTION_COUNT',
        severity: 'ERROR',
        message: `Question '${qId}' must have exactly 3 to 4 options. Found: ${Array.isArray(q.opts) ? q.opts.length : 0}`,
        context: qId
      });
      return errors;
    }

    const correctOpts = q.opts.filter(o => o && o.c === true);
    if (correctOpts.length !== 1) {
      errors.push({
        questionId: qId,
        ruleId: 'SCHEMA_CORRECT_OPTION_COUNT',
        severity: 'ERROR',
        message: `Question '${qId}' must have EXACTLY ONE correct option marked (c: true). Found: ${correctOpts.length}`,
        context: qId
      });
      return errors;
    }

    const correctOpt = correctOpts[0];
    const seenTexts = new Set<string>();

    q.opts.forEach((opt, optIdx) => {
      if (!opt.t || String(opt.t).trim().length === 0) {
        errors.push({
          questionId: qId,
          ruleId: 'SCHEMA_EMPTY_OPTION_TEXT',
          severity: 'ERROR',
          message: `Question '${qId}' Option #${optIdx + 1} has empty text.`,
          context: qId
        });
      }

      const normOptT = normalizeMathText(opt.t).toLowerCase();
      if (seenTexts.has(normOptT)) {
        errors.push({
          questionId: qId,
          ruleId: 'SCHEMA_DUPLICATE_OPTIONS',
          severity: 'ERROR',
          message: `Question '${qId}' contains duplicate option text: "${opt.t}". All options must be distinct.`,
          context: qId
        });
      }
      seenTexts.add(normOptT);

      const distractorErrors = this.validateDistractor(opt, correctOpt, qId, optIdx);
      errors.push(...distractorErrors);
    });

    if (q.hints) {
      const hintErrors = this.validateHints(q.hints, correctOpt, qId);
      errors.push(...hintErrors);
    }

    return errors;
  }

  /**
   * Validates an entire exercise bank.
   */
  static validateExerciseBank(bank: any, context: string = 'ExerciseBank'): ValidationSummary {
    let questions: AssessmentQuestion[] = [];

    if (Array.isArray(bank)) {
      questions = bank;
    } else if (typeof bank === 'object' && bank !== null) {
      if (Array.isArray(bank.questions)) {
        questions = bank.questions;
      } else {
        const levels = ['warmup', 'deep_dive', 'boss'];
        for (const lvl of levels) {
          if (Array.isArray(bank[lvl])) {
            bank[lvl].forEach((q: any) => {
              questions.push({ ...q, tier: lvl as any });
            });
          }
        }
        if (questions.length === 0 && Array.isArray(bank.exercises)) {
          questions = bank.exercises;
        }
      }
    }

    const allErrors: QuestionValidationError[] = [];
    let totalDistractors = 0;
    let totalHints = 0;
    let spoilerViolations = 0;
    let missingMisconceptions = 0;
    let lowQualityMisconceptions = 0;
    let structureViolations = 0;
    let hintViolations = 0;

    questions.forEach((q, idx) => {
      const qErrors = this.validateQuestion(q, idx);
      allErrors.push(...qErrors);

      if (Array.isArray(q.opts)) {
        totalDistractors += q.opts.filter(o => !o.c).length;
      }
      if (q.hints) {
        totalHints += Object.keys(q.hints).length;
      }
    });

    allErrors.forEach(err => {
      if (err.ruleId.includes('SPOILER')) spoilerViolations++;
      else if (err.ruleId.includes('MISSING_MISCONCEPTION')) missingMisconceptions++;
      else if (err.ruleId.includes('LOW_QUALITY')) lowQualityMisconceptions++;
      else if (err.ruleId.includes('HINT')) hintViolations++;
      else structureViolations++;
    });

    const errorCount = allErrors.filter(e => e.severity === 'ERROR').length;
    const penalty = (spoilerViolations * 20) +
                    (missingMisconceptions * 15) +
                    (lowQualityMisconceptions * 8) +
                    (structureViolations * 10) +
                    (hintViolations * 10);

    const baseScore = questions.length > 0 ? Math.max(0, 100 - penalty) : 0;
    const passed = errorCount === 0 && spoilerViolations === 0 && missingMisconceptions === 0;

    return {
      passed,
      totalQuestions: questions.length,
      totalDistractors,
      totalHintsChecked: totalHints,
      spoilerViolations,
      missingMisconceptions,
      lowQualityMisconceptions,
      structureViolations,
      hintViolations,
      score: baseScore,
      errors: allErrors.filter(e => e.severity === 'ERROR'),
      warnings: allErrors.filter(e => e.severity === 'WARNING')
    };
  }

  /**
   * Validates all questions within chapter HTML (NODES, WE, and DOM quiz-cards).
   */
  static validateChapterHtml(htmlContent: string, filename: string = 'chapter.html'): ValidationSummary {
    const questions: AssessmentQuestion[] = [];

    // 1. Extract from NODES in JS
    const nodesMatch = htmlContent.match(/var\s+NODES\s*=\s*(\[[\s\S]*?\]);\s*(?:var|function|App|\$)/);
    if (nodesMatch) {
      try {
        const cleaned = nodesMatch[1]
          .replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g, '$1"$2":')
          .replace(/:\s*'([^']*)'/g, ':"$1"');
        const nodes = JSON.parse(cleaned);
        if (Array.isArray(nodes)) {
          nodes.forEach((n: any, nIdx: number) => {
            (n.steps || []).forEach((s: any, sIdx: number) => {
              if (s && s.t === 'quiz' && s.q) {
                questions.push({
                  id: `Node${nIdx + 1}_Step${sIdx + 1}_quiz`,
                  q: s.q.q,
                  opts: s.q.opts || []
                });
              }
            });
          });
        }
      } catch (e) {}
    }

    // 2. Extract from WE in JS
    const weMatch = htmlContent.match(/var\s+WE\s*=\s*(\{[\s\S]*?\});\s*(?:var|function|App|\$)/);
    if (weMatch) {
      try {
        const cleaned = weMatch[1]
          .replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g, '$1"$2":')
          .replace(/:\s*'([^']*)'/g, ':"$1"');
        const weObj = JSON.parse(cleaned);
        for (const [weKey, we] of Object.entries(weObj) as [string, any][]) {
          if (we.check && we.check.opts) {
            questions.push({
              id: `WE_${weKey}_check`,
              q: we.check.q,
              opts: we.check.opts
            });
          }
          if (Array.isArray(we.steps)) {
            we.steps.forEach((ws: any, wsIdx: number) => {
              if (ws.check && ws.check.opts) {
                questions.push({
                  id: `WE_${weKey}_Step${wsIdx + 1}_check`,
                  q: ws.check.q,
                  opts: ws.check.opts
                });
              }
            });
          }
        }
      } catch (e) {}
    }

    // 3. Extract from DOM quiz-cards in HTML (e.g. Gamified assessments #section-warmup, deep_dive, boss)
    const cardSplit = htmlContent.split(/<div[^>]*class=["'][^"']*quiz-card[^"']*["']/i);
    for (let c = 1; c < cardSplit.length; c++) {
      const cardHtml = cardSplit[c];
      const idMatch = cardHtml.match(/^[^>]*id=["']([^"']+)["']/i);
      const qId = idMatch ? idMatch[1] : `DOM_Card_${c}`;

      const qTextMatch = cardHtml.match(/<div[^>]*class=["']quiz-question["'][^>]*>([\s\S]*?)<\/div>/i);
      const qText = qTextMatch ? qTextMatch[1].replace(/<[^>]+>/g, '').trim() : '';

      const domOpts: QuestionOption[] = [];
      const optSplit = cardHtml.split(/<div[^>]*class=["'][^"']*quiz-opt[^"']*["']/i);
      for (let o = 1; o < optSplit.length; o++) {
        const optChunk = optSplit[o];
        const mMatch = optChunk.match(/data-m=(?:"([^"]*)"|'([^']*)')/i);
        const m = mMatch ? (mMatch[1] !== undefined ? mMatch[1] : mMatch[2]).replace(/&quot;/g, '"').replace(/&#39;/g, "'") : '';
        const onclickMatch = optChunk.match(/onclick=(?:"([^"]*)"|'([^']*)')/i);
        const onclick = onclickMatch ? (onclickMatch[1] !== undefined ? onclickMatch[1] : onclickMatch[2]) : '';
        const isCorrect = /,\s*true\b/i.test(onclick) || /data-correct=["']true["']/i.test(optChunk);
        const textMatch = optChunk.match(/<span[^>]*class=["']quiz-opt-text["'][^>]*>([\s\S]*?)<\/span>/i);
        const t = textMatch ? textMatch[1].replace(/<[^>]+>/g, '').trim() : '';
        if (t) {
          domOpts.push({ t, c: isCorrect, m });
        }
      }

      let hints: QuestionHints | undefined = undefined;
      const hintBoxMatch = cardHtml.match(/<div[^>]*class=["']hint-box["'][^>]*data-h1=["']([^"']*)["'][^>]*data-h2=["']([^"']*)["'][^>]*data-h3=["']([^"']*)["'][^>]*data-h4=["']([^"']*)["']/i);
      if (hintBoxMatch) {
        hints = {
          h1: hintBoxMatch[1].replace(/&quot;/g, '"').replace(/&#39;/g, "'"),
          h2: hintBoxMatch[2].replace(/&quot;/g, '"').replace(/&#39;/g, "'"),
          h3: hintBoxMatch[3].replace(/&quot;/g, '"').replace(/&#39;/g, "'"),
          h4: hintBoxMatch[4].replace(/&quot;/g, '"').replace(/&#39;/g, "'")
        };
      }

      if (domOpts.length >= 2) {
        questions.push({
          id: qId,
          q: qText || `Assessment Question ${qId}`,
          opts: domOpts,
          hints
        });
      }
    }

    return this.validateExerciseBank(questions, filename);
  }
}
