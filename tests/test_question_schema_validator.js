/**
 * Test Suite: QuestionSchemaValidator Unit & Edge Case Tests
 * ==========================================================
 * Tests:
 * 1. Strict Question Schema (mcq 3-4 options, exactly 1 correct)
 * 2. Distractor quality (non-trivial, minimum length, pedagogical explanation)
 * 3. Rule #1 Zero-Spoiler Invariant (no verbatim leaks, no numerical leaks, no phrase leaks)
 * 4. 4-Tier Progressive Scaffolding Hints
 * 5. Section 11/16 Prohibited negative feedback patterns
 */

const assert = require('assert');
const { QuestionSchemaValidator } = require('../benchmarks/question_schema_validator');

console.log('=== RUNNING QUESTION SCHEMA VALIDATOR TESTS ===');

// Test 1: Valid high-quality question with zero spoilers
{
  const validQ = {
    id: 'test_q1',
    q: 'Why must the denominator of a rational number never be zero?',
    opts: [
      { t: 'Because division by zero is mathematically undefined', c: true, m: '' },
      { t: 'Because zero is not an integer', c: false, m: 'Zero is an integer, but dividing any quantity into zero shares lacks mathematical meaning.' },
      { t: 'Because rational numbers must always be positive', c: false, m: 'Rational numbers routinely include negative values; the restriction applies solely to division by zero.' },
      { t: 'Because zero cancels the entire numerator', c: false, m: 'Zero in the numerator produces zero, but having zero as the divisor is undefined.' }
    ],
    hints: {
      h1: 'Consider what division actually means in terms of equal shares.',
      h2: 'Recall the definition of a fraction as splitting a whole into parts.',
      h3: 'Ask: can something be divided into zero groups?',
      h4: 'Identify which operational condition cannot be evaluated.'
    }
  };

  const errors = QuestionSchemaValidator.validateQuestion(validQ);
  assert.strictEqual(errors.length, 0, `Expected 0 errors for valid question, got: ${JSON.stringify(errors)}`);
  console.log('  [PASS] Valid question and distractors pass cleanly.');
}

// Test 2: Missing misconception ('m' empty or absent on distractor)
{
  const missingMQ = {
    id: 'test_missing_m',
    q: 'What is the standard form of 32 / -48?',
    opts: [
      { t: '-2/3', c: true, m: '' },
      { t: '2/-3', c: false, m: '' }, // Missing!
      { t: '-4/6', c: false, m: 'The fraction was not simplified to co-prime integers.' }
    ]
  };

  const errors = QuestionSchemaValidator.validateQuestion(missingMQ);
  const hasMissing = errors.some(e => e.ruleId === 'RULE_1_MISSING_MISCONCEPTION');
  assert.strictEqual(hasMissing, true, 'Expected RULE_1_MISSING_MISCONCEPTION error');
  console.log('  [PASS] Missing misconception explanation caught.');
}

// Test 3: Trivial placeholder misconception
{
  const trivialMQ = {
    id: 'test_trivial_m',
    q: 'What is the reciprocal of -5/7?',
    opts: [
      { t: '-7/5', c: true, m: '' },
      { t: '5/7', c: false, m: 'Wrong.' }, // Trivial!
      { t: '7/5', c: false, m: 'Inverted the fraction but erroneously discarded the negative sign.' }
    ]
  };

  const errors = QuestionSchemaValidator.validateQuestion(trivialMQ);
  const hasTrivial = errors.some(e => e.ruleId === 'RULE_1_LOW_QUALITY_MISCONCEPTION');
  assert.strictEqual(hasTrivial, true, 'Expected RULE_1_LOW_QUALITY_MISCONCEPTION error');
  console.log('  [PASS] Trivial placeholder misconception caught.');
}

// Test 4: Verbatim answer leakage in distractor explanation
{
  const leakQ = {
    id: 'test_leak_verbatim',
    q: 'Which set represents numbers that can be written as p/q?',
    opts: [
      { t: 'Rational numbers', c: true, m: '' },
      { t: 'Irrational numbers', c: false, m: 'This is wrong because rational numbers are the ones expressible as p/q.' }, // Leaks target answer!
      { t: 'Imaginary numbers', c: false, m: 'Imaginary numbers involve roots of negative numbers, not integer ratios.' }
    ]
  };

  const errors = QuestionSchemaValidator.validateQuestion(leakQ);
  const hasLeak = errors.some(e => e.ruleId === 'RULE_1_SPOILER_VERBATIM_ANSWER');
  assert.strictEqual(hasLeak, true, 'Expected RULE_1_SPOILER_VERBATIM_ANSWER error');
  console.log('  [PASS] Verbatim target answer leakage caught.');
}

// Test 5: Numerical answer leakage in distractor explanation
{
  const numLeakQ = {
    id: 'test_leak_num',
    q: 'Solve for x: 2x = 10',
    opts: [
      { t: '5', c: true, m: '' },
      { t: '20', c: false, m: 'Multiplied by 2 instead of dividing, but the target value is 5.' }, // Numerical leak: "is 5"
      { t: '8', c: false, m: 'Subtracted 2 instead of dividing.' }
    ]
  };

  const errors = QuestionSchemaValidator.validateQuestion(numLeakQ);
  const hasNumLeak = errors.some(e => e.ruleId === 'RULE_1_SPOILER_NUMERICAL_LEAK');
  assert.strictEqual(hasNumLeak, true, 'Expected RULE_1_SPOILER_NUMERICAL_LEAK error');
  console.log('  [PASS] Numerical answer leakage pattern caught.');
}

// Test 6: Hint spoiler leakage
{
  const hintLeakQ = {
    id: 'test_hint_leak',
    q: 'Find the multiplicative inverse of -13/19.',
    opts: [
      { t: '-19/13', c: true, m: '' },
      { t: '13/19', c: false, m: 'Inverted the sign instead of inverting the fraction.' },
      { t: '19/13', c: false, m: 'Flipped the numerator and denominator but dropped the negative sign.' }
    ],
    hints: {
      h1: 'The multiplicative inverse turns a/b into b/a.',
      h2: 'The result is -19/13 when you flip numerator and denominator.' // Hint leak!
    }
  };

  const errors = QuestionSchemaValidator.validateQuestion(hintLeakQ);
  const hasHintLeak = errors.some(e => e.ruleId.includes('HINT_SPOILER'));
  assert.strictEqual(hasHintLeak, true, 'Expected HINT_SPOILER error');
  console.log('  [PASS] Progressive hint answer leakage caught.');
}

// Test 7: Section 11/16 Prohibited negative feedback
{
  const negFbQ = {
    id: 'test_neg_fb',
    q: 'Identify the additive identity of rational numbers.',
    opts: [
      { t: '0', c: true, m: '' },
      { t: '1', c: false, m: '❌ Incorrect. You chose the multiplicative identity instead.' },
      { t: '-1', c: false, m: 'Adding -1 changes the original quantity.' }
    ]
  };

  const errors = QuestionSchemaValidator.validateQuestion(negFbQ);
  const hasNegFb = errors.some(e => e.ruleId === 'SECTION_11_NEGATIVE_FEEDBACK');
  assert.strictEqual(hasNegFb, true, 'Expected SECTION_11_NEGATIVE_FEEDBACK error');
  console.log('  [PASS] Section 11/16 prohibited negative feedback caught.');
}

// Test 8: Full Exercise Bank validation
{
  const exerciseBank = {
    warmup: [
      {
        id: 'w1',
        q: 'What is 0 divided by 5?',
        opts: [
          { t: '0', c: true, m: '' },
          { t: '5', c: false, m: 'Confused dividing zero with dividing by 1.' },
          { t: 'Undefined', c: false, m: 'Division BY zero is undefined, but dividing zero by a non-zero integer equals zero.' }
        ]
      }
    ],
    deep_dive: [
      {
        id: 'd1',
        q: 'Express 18 / -24 in standard form.',
        opts: [
          { t: '-3/4', c: true, m: '' },
          { t: '3/-4', c: false, m: 'Standard form requires a positive denominator.' },
          { t: '-9/12', c: false, m: 'Divided only by 2; numerator and denominator still share a factor of 3.' }
        ]
      }
    ]
  };

  const summary = QuestionSchemaValidator.validateExerciseBank(exerciseBank, 'TestBank');
  assert.strictEqual(summary.passed, true);
  assert.strictEqual(summary.score, 100);
  assert.strictEqual(summary.totalQuestions, 2);
  assert.strictEqual(summary.spoilerViolations, 0);
  console.log('  [PASS] Full Exercise Bank validation passes with score 100/100.');
}

// Test 9: Unicode minus and LaTeX fraction answer leakage
{
  const latexLeakQ = {
    id: 'test_latex_leak',
    q: 'Simplify 32/-48 to standard form.',
    opts: [
      { t: '-2/3', c: true, m: '' },
      { t: '2/-3', c: false, m: 'Forgot to move negative sign to numerator instead of −2/3.' }, // Unicode minus leak!
      { t: '-4/6', c: false, m: 'The fraction was not simplified to lowest terms, yielding -\\frac{2}{3}.' } // LaTeX fraction leak!
    ]
  };

  const errors = QuestionSchemaValidator.validateQuestion(latexLeakQ);
  const hasSpoiler = errors.some(e => e.ruleId.includes('SPOILER'));
  assert.strictEqual(hasSpoiler, true, 'Expected spoiler violation for Unicode minus and LaTeX fraction');
  console.log('  [PASS] Unicode minus and LaTeX fraction answer leakage caught.');
}

// Test 10: Tier 4 hint leakage detection
{
  const tier4LeakQ = {
    id: 'test_tier4_leak',
    q: 'Evaluate 2^(-3).',
    opts: [
      { t: '1/8', c: true, m: '' },
      { t: '-8', c: false, m: 'Confused negative exponent with negative base.' },
      { t: '1/6', c: false, m: 'Multiplied base by exponent instead of taking reciprocal.' }
    ],
    hints: {
      h1: 'Recall what a negative exponent does to the base.',
      h2: 'Negative exponent a^(-n) = 1/(a^n).',
      h3: 'Calculate 2^3 in the denominator.',
      h4: 'The final evaluated result is 1/8.' // Tier 4 spoiler!
    }
  };

  const errors = QuestionSchemaValidator.validateQuestion(tier4LeakQ);
  const hasHintSpoiler = errors.some(e => e.ruleId.includes('HINT_SPOILER'));
  assert.strictEqual(hasHintSpoiler, true, 'Expected HINT_SPOILER error for Tier 4 hint');
  console.log('  [PASS] Tier 4 progressive hint spoiler leakage caught.');
}

// Test 11: Duplicate option text detection
{
  const dupOptQ = {
    id: 'test_dup_opts',
    q: 'What is the additive identity for rational numbers?',
    opts: [
      { t: '0', c: true, m: '' },
      { t: '1', c: false, m: '1 is the multiplicative identity.' },
      { t: '0', c: false, m: 'Zero is the correct answer, not a distractor.' } // Duplicate text!
    ]
  };

  const errors = QuestionSchemaValidator.validateQuestion(dupOptQ);
  const hasDup = errors.some(e => e.ruleId === 'SCHEMA_DUPLICATE_OPTIONS');
  assert.strictEqual(hasDup, true, 'Expected SCHEMA_DUPLICATE_OPTIONS error');
  console.log('  [PASS] Duplicate option text detected.');
}

// Test 12: Expanded spoiler predicates (instead of, leads to, to get)
{
  const predicateLeakQ = {
    id: 'test_predicate_leak',
    q: 'Find x if 3x = 15.',
    opts: [
      { t: '5', c: true, m: '' },
      { t: '45', c: false, m: 'Multiplied 15 by 3 instead of 5.' }, // "instead of 5"
      { t: '12', c: false, m: 'Subtracted 3 from 15 to get 5.' } // "to get 5"
    ]
  };

  const errors = QuestionSchemaValidator.validateQuestion(predicateLeakQ);
  const spoilerCount = errors.filter(e => e.ruleId.includes('SPOILER')).length;
  assert.strictEqual(spoilerCount >= 2, true, `Expected >= 2 spoiler errors, got ${spoilerCount}`);
  console.log('  [PASS] Expanded spoiler predicates (instead of, to get) caught.');
}

// Test 13: DOM .quiz-card HTML extraction in Chapter Validation
{
  const sampleHtml = `
    <div class="assessment-section" id="section-warmup">
      <div class="quiz-card" id="q_w_1">
        <div class="quiz-question">Which integer is neither positive nor negative?</div>
        <div class="quiz-opts-container">
          <div class="quiz-opt" data-m="" onclick="answerQuestion(this, 'q_w_1', 'n1', true, '', 5)">
            <span class="quiz-opt-text">0</span>
          </div>
          <div class="quiz-opt" data-m="1 is a positive integer." onclick="answerQuestion(this, 'q_w_1', 'n1', false, '1 is a positive integer.', 5)">
            <span class="quiz-opt-text">1</span>
          </div>
          <div class="quiz-opt" data-m="-1 is a negative integer." onclick="answerQuestion(this, 'q_w_1', 'n1', false, '-1 is a negative integer.', 5)">
            <span class="quiz-opt-text">-1</span>
          </div>
        </div>
        <div class="hint-box" data-h1="Consider the boundary on the number line." data-h2="It separates positive and negative numbers." data-h3="Think of origin." data-h4="Consider origin coordinate."></div>
      </div>
    </div>
  `;

  const summary = QuestionSchemaValidator.validateChapterHtml(sampleHtml, 'sample.html');
  assert.strictEqual(summary.totalQuestions, 1, `Expected 1 extracted DOM question, got ${summary.totalQuestions}`);
  assert.strictEqual(summary.totalDistractors, 2, `Expected 2 distractors, got ${summary.totalDistractors}`);
  assert.strictEqual(summary.passed, true);
  console.log('  [PASS] DOM .quiz-card extraction from HTML gamified assessment sections verified.');
}

console.log('\n[ALL QUESTION SCHEMA VALIDATOR UNIT TESTS PASSED SUCCESSFULLY]');

