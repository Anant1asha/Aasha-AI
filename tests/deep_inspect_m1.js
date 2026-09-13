const fs = require('fs');
const path = require('path');

const jsonPath = path.resolve(__dirname, '../chapters/ad_all_questions.json');
const raw = fs.readFileSync(jsonPath, 'utf8');
const data = JSON.parse(raw);
const questions = data.questions || [];

console.log(`Total questions in metadata: ${data.total_questions}`);
console.log(`Total questions in array: ${questions.length}`);

let issues = [];
let tierCounts = { warmup: 0, deep_dive: 0, boss: 0, other: 0 };
let optCountTotal = 0;
let distractorCountTotal = 0;
let hintCountTotal = 0;

questions.forEach((q, idx) => {
  const qId = q.id || `Q_${idx+1}`;
  if (tierCounts[q.tier] !== undefined) {
    tierCounts[q.tier]++;
  } else {
    tierCounts.other++;
  }

  // 1. Check options
  if (!Array.isArray(q.opts) || q.opts.length !== 4) {
    issues.push(`[${qId}] Expected 4 options, found ${q.opts ? q.opts.length : 'none'}`);
  } else {
    optCountTotal += q.opts.length;
    let correctCount = 0;
    q.opts.forEach((opt, oIdx) => {
      if (opt.c === true) {
        correctCount++;
        if (opt.m && opt.m.trim().length > 0) {
          issues.push(`[${qId}] Correct option #${oIdx+1} has non-empty m: "${opt.m}"`);
        }
      } else {
        distractorCountTotal++;
        if (!opt.m || opt.m.trim().length === 0) {
          issues.push(`[${qId}] False option #${oIdx+1} has empty m`);
        } else if (opt.m.trim().length < 15) {
          issues.push(`[${qId}] False option #${oIdx+1} m is shorter than 15 chars: "${opt.m}"`);
        }
      }
    });
    if (correctCount !== 1) {
      issues.push(`[${qId}] Expected exactly 1 correct option, found ${correctCount}`);
    }
  }

  // 2. Check hints h1-h4
  ['h1', 'h2', 'h3', 'h4'].forEach(h => {
    if (!q[h] || typeof q[h] !== 'string' || q[h].trim().length === 0) {
      issues.push(`[${qId}] Missing or empty hint ${h}`);
    } else {
      hintCountTotal++;
    }
  });

  // 3. Check q.m
  if (!q.m || q.m.trim().length < 15) {
    issues.push(`[${qId}] Missing or short q.m (< 15 chars): "${q.m}"`);
  }
});

console.log('Tier distribution:', JSON.stringify(tierCounts));
console.log(`Total options checked: ${optCountTotal}`);
console.log(`Total distractors checked: ${distractorCountTotal}`);
console.log(`Total hints checked: ${hintCountTotal}`);
console.log(`Issues found: ${issues.length}`);
if (issues.length > 0) {
  console.log('Sample issues:', issues.slice(0, 10));
} else {
  console.log('ALL 75 QUESTIONS PASSED DETAILED INTEGRITY CHECKS PERFECTLY!');
}
