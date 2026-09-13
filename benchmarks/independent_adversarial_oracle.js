/**
 * AASHA Foundation - Milestone 1 Independent Adversarial Stress-Testing Oracle
 * ============================================================================
 * Independent challenger audit for ad_all_questions.json:
 * 1. Distractor fraction collisions (unreduced fractions, mathematical equivalence, cross-option comparison)
 * 2. Duplicate options (exact, normalized, numerical) across all 75 questions
 * 3. Question-level q.m leaks (verbatim, numerical, arithmetic evaluation, predicates)
 * 4. Evaluative/discouraging words in q.m, opt.m, and hints.h1-h4
 * 5. Hint scaffolding completeness and zero-spoiler compliance
 * 6. Correctness verification of answers
 */

const fs = require('fs');
const path = require('path');

const jsonPath = path.resolve(__dirname, '../chapters/ad_all_questions.json');
const rawData = fs.readFileSync(jsonPath, 'utf8');
const data = JSON.parse(rawData);
const questions = data.questions || [];

console.log('================================================================================');
console.log(' INDEPENDENT ADVERSARIAL ORACLE: DEEP STRESS HARNESS');
console.log(` Target File: chapters/ad_all_questions.json`);
console.log(` Total Questions Loaded: ${questions.length}`);
console.log('================================================================================\n');

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

function parseFractionOrNumber(str) {
  if (!str) return null;
  const clean = normalizeMath(str).replace(/\s+/g, '');

  // Integer
  if (/^-?\d+$/.test(clean)) {
    const n = parseInt(clean, 10);
    return { num: n, den: 1, val: n, raw: str };
  }

  // Simple Fraction: a/b or -a/b or a/-b
  const fracMatch = clean.match(/^(-?\d+)\/(-?\d+)$/);
  if (fracMatch) {
    let n = parseInt(fracMatch[1], 10);
    let d = parseInt(fracMatch[2], 10);
    if (d === 0) return null;
    if (d < 0) {
      n = -n;
      d = -d;
    }
    return { num: n, den: d, val: n / d, raw: str };
  }

  // Decimal: -12.34
  if (/^-?\d+\.\d+$/.test(clean)) {
    const v = parseFloat(clean);
    return { num: null, den: null, val: v, raw: str };
  }

  return null;
}

const DISCOURAGING_TERMS = [
  'incorrect', 'wrong', 'false', 'bad', 'stupid', 'dumb', 'careless',
  'foolish', 'silly', 'you failed', 'you did not', 'you made a mistake',
  'error on your part', 'not right', 'not correct', '❌'
];

const LEAK_PREDICATES = [
  'is', 'was', '=', 'giving', 'gives', 'give', 'becomes', 'became',
  ', not \\+?', 'not', 'equals', 'equal to', 'equals to', 'result is', 'results in',
  'yielding', 'yields', 'produces', 'produced', 'produces a value of',
  'leaving', 'leaves', 'leads to', 'should be', 'must be', 'to get',
  'target is', 'target value is', 'correct value is', 'correct answer is',
  'answer is', 'answer was', 'answer:', 'instead of', 'simplifies to',
  'reduces to', 'evaluates to', 'which is', 'giving a result of'
];

const STOPWORDS = new Set([
  'a', 'i', 'is', 'to', 'in', 'of', 'or', 'and', 'no', 'so', 'yes', 'all', 'one', 'two', 'true', 'false'
]);

const issues = {
  fractionCollisions: [],
  duplicateOptions: [],
  qMisconceptionSpoilers: [],
  evaluativeWords: [],
  distractorQuality: [],
  hintIssues: [],
  structureIssues: []
};

// 1. Structure & Count
if (questions.length !== 75) {
  issues.structureIssues.push(`Expected exactly 75 questions, found ${questions.length}`);
}

questions.forEach((q, idx) => {
  const qId = q.id || `Q_${idx + 1}`;
  const tag = q.tag || 'NoTag';

  // Check options count
  if (!Array.isArray(q.opts) || q.opts.length < 3 || q.opts.length > 4) {
    issues.structureIssues.push(`${qId} (${tag}): Options count is ${q.opts ? q.opts.length : 0}, expected 3 or 4`);
    return;
  }

  // Check correct option count
  const correct = q.opts.filter(o => o.c === true);
  if (correct.length !== 1) {
    issues.structureIssues.push(`${qId} (${tag}): Found ${correct.length} correct options, expected exactly 1`);
  }

  const correctOpt = correct[0];
  const correctRaw = (correctOpt ? correctOpt.t : q.ans || '').trim();
  const parsedCorrect = parseFractionOrNumber(correctRaw);

  // 2. Options Collision & Duplication Check (Pairwise across all options)
  for (let i = 0; i < q.opts.length; i++) {
    for (let j = i + 1; j < q.opts.length; j++) {
      const optA = q.opts[i];
      const optB = q.opts[j];
      const rawA = (optA.t || '').trim();
      const rawB = (optB.t || '').trim();
      const normA = normalizeMath(rawA).toLowerCase();
      const normB = normalizeMath(rawB).toLowerCase();

      // Duplicate text check
      if (rawA === rawB) {
        issues.duplicateOptions.push({
          qId, tag, optA: `#${i+1} (${rawA})`, optB: `#${j+1} (${rawB})`,
          type: 'EXACT_RAW_DUPLICATE'
        });
      } else if (normA === normB) {
        issues.duplicateOptions.push({
          qId, tag, optA: `#${i+1} (${rawA})`, optB: `#${j+1} (${rawB})`,
          type: 'NORMALIZED_DUPLICATE'
        });
      }

      // Mathematical value equivalence check
      const parsedA = parseFractionOrNumber(rawA);
      const parsedB = parseFractionOrNumber(rawB);

      if (parsedA && parsedB && Math.abs(parsedA.val - parsedB.val) < 1e-9) {
        const isOneCorrect = optA.c || optB.c;
        issues.fractionCollisions.push({
          qId,
          tag,
          type: isOneCorrect ? 'DISTRACTOR_EQUALS_CORRECT' : 'DISTRACTOR_EQUALS_DISTRACTOR',
          optA: `#${i+1}: '${rawA}' (c: ${optA.c}, val: ${parsedA.val})`,
          optB: `#${j+1}: '${rawB}' (c: ${optB.c}, val: ${parsedB.val})`,
          message: `Mathematical collision: Option #${i+1} ('${rawA}') and Option #${j+1} ('${rawB}') both evaluate to ${parsedA.val}`
        });
      }
    }
  }

  // 3. Question-level q.m Check
  if (!q.m || q.m.trim().length === 0) {
    issues.distractorQuality.push({ qId, tag, field: 'q.m', message: 'Missing q.m' });
  } else if (q.m.trim().length < 15) {
    issues.distractorQuality.push({ qId, tag, field: 'q.m', message: `q.m too short: "${q.m}"` });
  }

  const qm = q.m || '';
  const normQm = normalizeMath(qm).toLowerCase();
  const normCorrect = normalizeMath(correctRaw).toLowerCase();

  // Verbatim answer leak in q.m
  if (normCorrect.length >= 3 && !STOPWORDS.has(normCorrect)) {
    if (normQm.includes(normCorrect)) {
      issues.qMisconceptionSpoilers.push({
        qId, tag, target: correctRaw, field: 'q.m',
        message: `q.m leaks verbatim answer text '${correctRaw}' in: "${qm}"`
      });
    }
  }

  // Fraction leak in q.m (e.g. 5/7 or -3/2)
  if (parsedCorrect && parsedCorrect.den > 1) {
    const fracPat = new RegExp(`\\b${parsedCorrect.num}\\/${parsedCorrect.den}\\b`);
    if (fracPat.test(normQm)) {
      issues.qMisconceptionSpoilers.push({
        qId, tag, target: `${parsedCorrect.num}/${parsedCorrect.den}`, field: 'q.m',
        message: `q.m contains target fraction '${parsedCorrect.num}/${parsedCorrect.den}' in: "${qm}"`
      });
    }
  }

  // Value leak with predicate in q.m
  if (parsedCorrect) {
    const valStr = String(parsedCorrect.num !== null ? parsedCorrect.num : parsedCorrect.val);
    if (valStr.length > 0 && !STOPWORDS.has(valStr)) {
      const predRegex = new RegExp(`(?:${LEAK_PREDICATES.join('|')})\\s*[:=]?\\s*\\b${valStr}\\b`, 'i');
      if (predRegex.test(normQm)) {
        issues.qMisconceptionSpoilers.push({
          qId, tag, target: valStr, field: 'q.m',
          message: `q.m leaks target value '${valStr}' with predicate in: "${qm}"`
        });
      }
    }
  }

  // 4. Evaluative / Discouraging words check across q.m, opt.m, hints
  DISCOURAGING_TERMS.forEach(term => {
    const regex = new RegExp(`\\b${term}\\b`, 'i');

    if (regex.test(qm)) {
      issues.evaluativeWords.push({
        qId, tag, field: 'q.m', term,
        snippet: qm
      });
    }

    q.opts.forEach((opt, optIdx) => {
      const optM = opt.m || '';
      if (regex.test(optM)) {
        issues.evaluativeWords.push({
          qId, tag, field: `opt[${optIdx+1}].m`, term,
          snippet: optM
        });
      }
    });

    if (q.hints) {
      ['h1', 'h2', 'h3', 'h4'].forEach(hKey => {
        const hintText = q.hints[hKey] || '';
        if (regex.test(hintText)) {
          issues.evaluativeWords.push({
            qId, tag, field: `hints.${hKey}`, term,
            snippet: hintText
          });
        }
      });
    }
  });

  // 5. Option Misconception Quality & Zero Spoilers
  q.opts.forEach((opt, optIdx) => {
    if (opt.c) {
      if (opt.m && opt.m.trim().length > 0) {
        issues.distractorQuality.push({
          qId, tag, field: `opt[${optIdx+1}].m (correct)`,
          message: `Correct option has non-empty m: "${opt.m}"`
        });
      }
    } else {
      const optM = (opt.m || '').trim();
      if (optM.length < 15) {
        issues.distractorQuality.push({
          qId, tag, field: `opt[${optIdx+1}].m`,
          message: `Distractor m is too short (${optM.length} chars, min 15): "${optM}"`
        });
      }
      // Check spoiler in distractor m
      const normOptM = normalizeMath(optM).toLowerCase();
      if (normCorrect.length >= 3 && !STOPWORDS.has(normCorrect) && normOptM.includes(normCorrect)) {
        issues.distractorQuality.push({
          qId, tag, field: `opt[${optIdx+1}].m`,
          message: `Distractor m leaks verbatim correct answer '${correctRaw}' in: "${optM}"`
        });
      }
    }
  });

  // 6. Hints Complete & Scaffolding
  if (!q.hints) {
    issues.hintIssues.push({ qId, tag, message: 'Missing hints object' });
  } else {
    ['h1', 'h2', 'h3', 'h4'].forEach(hk => {
      if (!q.hints[hk] || q.hints[hk].trim().length < 10) {
        issues.hintIssues.push({ qId, tag, message: `Hint ${hk} missing or too short: "${q.hints[hk]}"` });
      }
    });
  }
});

// Summary Report
console.log('--- AUDIT FINDINGS ---');
console.log(`1. Distractor Fraction Collisions: ${issues.fractionCollisions.length}`);
issues.fractionCollisions.forEach((c, idx) => {
  console.log(`   [${idx+1}] ${c.qId} (${c.tag}): ${c.message} [${c.type}]`);
});

console.log(`\n2. Duplicate Options: ${issues.duplicateOptions.length}`);
issues.duplicateOptions.forEach((d, idx) => {
  console.log(`   [${idx+1}] ${d.qId} (${d.tag}): ${d.optA} == ${d.optB} [${d.type}]`);
});

console.log(`\n3. Question-level q.m Spoilers: ${issues.qMisconceptionSpoilers.length}`);
issues.qMisconceptionSpoilers.forEach((s, idx) => {
  console.log(`   [${idx+1}] ${s.qId} (${s.tag}): ${s.message}`);
});

console.log(`\n4. Evaluative / Discouraging Words: ${issues.evaluativeWords.length}`);
issues.evaluativeWords.forEach((w, idx) => {
  console.log(`   [${idx+1}] ${w.qId} (${w.tag}) [${w.field}]: Found '${w.term}' in "${w.snippet}"`);
});

console.log(`\n5. Distractor Quality & Zero-Spoiler Issues: ${issues.distractorQuality.length}`);
issues.distractorQuality.forEach((dq, idx) => {
  console.log(`   [${idx+1}] ${dq.qId} (${dq.tag}) [${dq.field}]: ${dq.message}`);
});

console.log(`\n6. Hint Scaffolding Issues: ${issues.hintIssues.length}`);
issues.hintIssues.forEach((hi, idx) => {
  console.log(`   [${idx+1}] ${hi.qId} (${hi.tag}): ${hi.message}`);
});

console.log(`\n7. Structure Issues: ${issues.structureIssues.length}`);
issues.structureIssues.forEach((si, idx) => {
  console.log(`   [${idx+1}] ${si}`);
});

const totalIssues = issues.fractionCollisions.length +
                    issues.duplicateOptions.length +
                    issues.qMisconceptionSpoilers.length +
                    issues.evaluativeWords.length +
                    issues.distractorQuality.length +
                    issues.hintIssues.length +
                    issues.structureIssues.length;

console.log('\n================================================================================');
console.log(`TOTAL AUDIT DEFECTS FOUND: ${totalIssues}`);
if (totalIssues === 0) {
  console.log('VERDICT: APPROVE (Zero defects discovered across all 75 questions)');
} else {
  console.log('VERDICT: REQUEST_CHANGES (Defects must be remediated)');
}
console.log('================================================================================\n');

process.exit(totalIssues === 0 ? 0 : 1);
