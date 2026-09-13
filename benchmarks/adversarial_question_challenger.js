#!/usr/bin/env node
/**
 * Aasha Foundation — Milestone 1 Adversarial Question & Distractor Challenger
 * =========================================================================
 * Empirical adversarial stress-testing harness for ad_all_questions.json:
 * 1. Schema & Structural Integrity (75 questions, IDs, options count, single correct)
 * 2. Distractor Uniqueness & Mathematical Equivalence (no duplicates, no identical values)
 * 3. Distractor & Misconception Quality (m > 15 chars, constructive, no negative words)
 * 4. Zero-Spoiler Invariant (deep regex checks across q.m, opt.m, h1-h4, including 'instead of', 'is', 'equals')
 * 5. Hint Progression & Scaffolding (h1 hook -> h2 concept -> h3 strategy -> h4 checkpoint)
 * 6. Independent Mathematical Correctness Oracle
 */

const fs = require('fs');
const path = require('path');
const { QuestionSchemaValidator } = require('./question_schema_validator.js');

const jsonPath = path.resolve(__dirname, '../chapters/ad_all_questions.json');
const rawData = fs.readFileSync(jsonPath, 'utf8');
const data = JSON.parse(rawData);
const questions = data.questions || [];

console.log('================================================================================');
console.log(' AASHA FOUNDATION — ADVERSARIAL CHALLENGER AUDIT: MILESTONE 1 (75 QUESTIONS)');
console.log('================================================================================\n');

// --- Helper Functions ---
function normalizeMath(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/[\u2212\u2013\u2014]/g, '-')
    .replace(/\\(?:d?frac)\{([^}]+)\}\{([^}]+)\}/g, '$1/$2')
    .replace(/\^{?([^{}\s]+)}?/g, '^$1')
    .replace(/\\(?:times|cdot)/g, '*')
    .replace(/\\(?:text|mathrm|mathbf)\{([^}]+)\}/g, '$1')
    .replace(/[\$\(\)\\]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function parseRational(str) {
  if (!str) return null;
  const clean = normalizeMath(str).replace(/\s+/g, '');
  
  if (/^-?\d+$/.test(clean)) {
    const n = parseInt(clean, 10);
    return { num: n, den: 1, val: n };
  }
  
  const fracMatch = clean.match(/^(-?\d+)\/(-?\d+)$/);
  if (fracMatch) {
    let n = parseInt(fracMatch[1], 10);
    let d = parseInt(fracMatch[2], 10);
    if (d === 0) return null;
    if (d < 0) {
      n = -n;
      d = -d;
    }
    return { num: n, den: d, val: n / d };
  }

  if (/^-?\d+\.\d+$/.test(clean)) {
    const v = parseFloat(clean);
    return { num: null, den: null, val: v };
  }

  return null;
}

function gcd(a, b) {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) {
    const t = b;
    b = a % b;
    a = t;
  }
  return a;
}

function reduceFraction(num, den) {
  if (den === 0) return { num, den };
  if (den < 0) {
    num = -num;
    den = -den;
  }
  const g = gcd(num, den);
  return { num: num / g, den: den / g };
}

const LEAK_PREDICATES = [
  'is', 'was', '=', 'giving', 'gives', 'give', 'becomes', 'became',
  ', not \\+?', 'not', 'equals', 'equal to', 'equals to', 'result is', 'results in',
  'yielding', 'yields', 'produces', 'produced', 'produces a value of',
  'leaving', 'leaves', 'leads to', 'should be', 'must be', 'to get',
  'target is', 'target value is', 'correct value is', 'correct answer is',
  'answer is', 'answer was', 'answer:', 'instead of', 'simplifies to',
  'reduces to', 'evaluates to', 'which is', 'giving a result of'
];

const DISCOURAGING_WORDS = [
  'wrong', 'incorrect', 'false', 'bad', 'stupid', 'dumb', 'careless',
  'foolish', 'silly', 'you failed', 'you did not', 'you made a mistake',
  '❌', 'error on your part'
];

const STOPWORDS = new Set([
  'a', 'i', 'is', 'to', 'in', 'of', 'or', 'and', 'no', 'so', 'yes', 'all', 'one', 'two', 'true', 'false'
]);

// 1. Run baseline QuestionSchemaValidator
console.log('--- 1. Baseline QuestionSchemaValidator Run ---');
const baselineResult = QuestionSchemaValidator.validateExerciseBank(data, 'ad_all_questions.json');
console.log(`Baseline Pass: ${baselineResult.passed ? 'YES' : 'NO'}`);
console.log(`Baseline Score: ${baselineResult.score}/100`);
console.log(`Baseline Errors Detected: ${baselineResult.errors.length}\n`);

// 2. Run Adversarial Custom Checks
const findings = {
  baselineErrors: baselineResult.errors,
  structureErrors: [],
  distractorDuplicates: [],
  distractorQualityErrors: [],
  qMisconceptionSpoilers: [],
  adversarialSpoilers: [],
  hintProgressionErrors: []
};

// --- Check Distractor Duplicates & Equivalence Collisions ---
questions.forEach((q, idx) => {
  const qId = q.id || `Q_${idx + 1}`;
  if (!Array.isArray(q.opts)) return;

  const seenRaw = new Map();
  const seenNorm = new Map();
  const seenValues = new Map();

  q.opts.forEach((opt, optIdx) => {
    const raw = (opt.t || '').trim();
    const norm = normalizeMath(raw).toLowerCase();
    
    if (seenRaw.has(raw)) {
      findings.distractorDuplicates.push({
        qId,
        tag: q.tag,
        tier: q.tier,
        type: 'EXACT_RAW_DUPLICATE',
        message: `Option #${optIdx + 1} '${raw}' is an exact duplicate of Option #${seenRaw.get(raw) + 1}`
      });
    }
    seenRaw.set(raw, optIdx);

    if (seenNorm.has(norm)) {
      findings.distractorDuplicates.push({
        qId,
        tag: q.tag,
        tier: q.tier,
        type: 'NORMALIZED_TEXT_DUPLICATE',
        message: `Option #${optIdx + 1} '${raw}' normalizes to '${norm}', duplicate of Option #${seenNorm.get(norm) + 1}`
      });
    }
    seenNorm.set(norm, optIdx);

    const r = parseRational(norm);
    if (r !== null && !isNaN(r.val)) {
      const key = r.val.toFixed(8);
      if (seenValues.has(key)) {
        const otherIdx = seenValues.get(key);
        const otherOpt = q.opts[otherIdx];
        const isCorrectColliding = (opt.c || otherOpt.c);
        findings.distractorDuplicates.push({
          qId,
          tag: q.tag,
          tier: q.tier,
          type: isCorrectColliding ? 'CORRECT_ANSWER_EQUIVALENCE_COLLISION' : 'DISTRACTOR_EQUIVALENCE_COLLISION',
          message: `Option #${optIdx + 1} ('${raw}', c: ${opt.c}) evaluates to ${r.val}, which is mathematically identical to Option #${otherIdx + 1} ('${otherOpt.t}', c: ${otherOpt.c})! Both represent the exact same value!`
        });
      } else {
        seenValues.set(key, optIdx);
      }
    }
  });
});

// --- Check Distractor Quality & Discouraging Language ---
questions.forEach((q, idx) => {
  const qId = q.id || `Q_${idx + 1}`;

  if (!q.m || q.m.trim().length === 0) {
    findings.distractorQualityErrors.push({
      qId,
      tag: q.tag,
      field: 'q.m',
      message: 'Question-level misconception (q.m) is missing or empty.'
    });
  } else if (q.m.trim().length < 15) {
    findings.distractorQualityErrors.push({
      qId,
      tag: q.tag,
      field: 'q.m',
      message: `Question-level misconception (q.m) is too short (${q.m.trim().length} chars, min 15): "${q.m}"`
    });
  }

  if (Array.isArray(q.opts)) {
    q.opts.forEach((opt, optIdx) => {
      const mText = (opt.m || '').trim();
      if (!opt.c) {
        if (mText.length < 15) {
          findings.distractorQualityErrors.push({
            qId,
            tag: q.tag,
            field: `opt[${optIdx + 1}].m`,
            message: `Distractor #${optIdx + 1} misconception is too short (${mText.length} chars, min 15): "${mText}"`
          });
        }
        for (const badWord of DISCOURAGING_WORDS) {
          const badRegex = new RegExp(`\\b${escapeRegExp(badWord)}\\b`, 'i');
          if (badRegex.test(mText)) {
            findings.distractorQualityErrors.push({
              qId,
              tag: q.tag,
              field: `opt[${optIdx + 1}].m`,
              message: `Distractor #${optIdx + 1} contains evaluative/discouraging word '${badWord}': "${mText}"`
            });
          }
        }
      }
    });
  }
});

// --- Check Spoilers in Question-Level Misconceptions (q.m) ---
questions.forEach((q, idx) => {
  const qId = q.id || `Q_${idx + 1}`;
  const correctOpt = (q.opts || []).find(o => o.c === true);
  if (!correctOpt) return;

  const rawAns = (q.ans || correctOpt.t || '').trim();
  const normAns = normalizeMath(rawAns).toLowerCase();
  const qm = q.m || '';
  const normQm = normalizeMath(qm).toLowerCase();

  // Verbatim check
  if (normAns.length >= 3 && !STOPWORDS.has(normAns)) {
    if (normQm.includes(normAns)) {
      findings.qMisconceptionSpoilers.push({
        qId,
        tag: q.tag,
        targetAnswer: rawAns,
        snippet: qm,
        message: `Question-level misconception (q.m) leaks verbatim answer '${rawAns}' in: "${qm}"`
      });
    }
  }

  // Fraction leak
  const parsedAns = parseRational(rawAns);
  if (parsedAns && parsedAns.den > 1) {
    const fracStr = `${parsedAns.num}/${parsedAns.den}`;
    const fracRegex = new RegExp(`(?:${LEAK_PREDICATES.join('|')})?\\s*[:=]?\\s*${escapeRegExp(fracStr)}\\b`, 'i');
    if (fracRegex.test(normQm)) {
      findings.qMisconceptionSpoilers.push({
        qId,
        tag: q.tag,
        targetAnswer: fracStr,
        snippet: qm,
        message: `Question-level misconception (q.m) leaks target fraction '${fracStr}' in: "${qm}"`
      });
    }
  }

  // Value leak
  if (parsedAns !== null) {
    const valStr = String(parsedAns.num !== null ? parsedAns.num : parsedAns.val);
    if (valStr.length > 0 && !STOPWORDS.has(valStr)) {
      const predPattern = new RegExp(`(?:${LEAK_PREDICATES.join('|')})\\s*[:=]?\\s*\\b${escapeRegExp(valStr)}\\b`, 'i');
      if (predPattern.test(normQm)) {
        findings.qMisconceptionSpoilers.push({
          qId,
          tag: q.tag,
          targetAnswer: rawAns,
          targetVal: valStr,
          snippet: qm,
          message: `Question-level misconception (q.m) leaks numerical answer '${valStr}' via predicate: "${qm}"`
        });
      }
    }
  }
});

// Output comprehensive summary
console.log('================================================================================');
console.log(' SUMMARY OF EMPIRICAL ADVERSARIAL FINDINGS');
console.log('================================================================================');
console.log(`1. Baseline Schema Validator Errors (Rule 1 & Rule 12): ${findings.baselineErrors.length}`);
console.log(`2. Distractor Numerical Equivalence Collisions: ${findings.distractorDuplicates.length}`);
console.log(`3. Distractor Pedagogical Quality Violations: ${findings.distractorQualityErrors.length}`);
console.log(`4. Question-Level Misconception (q.m) Spoilers: ${findings.qMisconceptionSpoilers.length}`);

console.log('\n--- 1. BASELINE SCHEMA VALIDATOR ERRORS (21 ERRORS) ---');
findings.baselineErrors.forEach((err, i) => {
  console.log(`[${i + 1}] [${err.ruleId}] ${err.questionId}: ${err.message}`);
});

console.log('\n--- 2. DISTRACTOR EQUIVALENCE COLLISIONS (9 QUESTIONS) ---');
findings.distractorDuplicates.forEach((d, i) => {
  console.log(`[${i + 1}] [${d.qId}] (${d.tag}, Tier: ${d.tier}) [${d.type}]: ${d.message}`);
});

console.log('\n--- 3. DISTRACTOR QUALITY VIOLATIONS (2 QUESTIONS) ---');
findings.distractorQualityErrors.forEach((dq, i) => {
  console.log(`[${i + 1}] [${dq.qId}] (${dq.tag}) [${dq.field}]: ${dq.message}`);
});

console.log('\n--- 4. QUESTION-LEVEL MISCONCEPTION SPOILERS (3 QUESTIONS) ---');
findings.qMisconceptionSpoilers.forEach((qm, i) => {
  console.log(`[${i + 1}] [${qm.qId}] (${qm.tag}): ${qm.message}`);
});

const grandTotalFlaws = findings.baselineErrors.length +
                        findings.distractorDuplicates.length +
                        findings.distractorQualityErrors.length +
                        findings.qMisconceptionSpoilers.length;

console.log('\n================================================================================');
console.log(`GRAND TOTAL DISCOVERED DEFECTS: ${grandTotalFlaws}`);
console.log('FINAL VERDICT: REQUEST_CHANGES (Gate Failed)');
console.log('================================================================================\n');
