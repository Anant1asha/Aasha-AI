const { QuestionSchemaValidator } = require('../benchmarks/question_schema_validator');
const { WARMUP_QUESTIONS } = require('./exponents_warmup_data');
const { DEEPDIVE_QUESTIONS } = require('./exponents_deepdive_data');
const { BOSS_QUESTIONS } = require('./exponents_boss_data');

const allQuestions = [
  ...WARMUP_QUESTIONS.map(q => ({ ...q, tier: 'Warmup' })),
  ...DEEPDIVE_QUESTIONS.map(q => ({ ...q, tier: 'DeepDive' })),
  ...BOSS_QUESTIONS.map(q => ({ ...q, tier: 'Boss' }))
];

console.log(`Total questions to validate: ${allQuestions.length}`);

let totalErrors = 0;
allQuestions.forEach((q, idx) => {
  const context = `[${q.tier}] Q${idx+1} (${q.tag || q.id})`;
  const correctOpts = q.opts.filter(o => o.correct === true);
  if (correctOpts.length !== 1) {
    console.error(`ERROR: ${context} has ${correctOpts.length} correct options (must be exactly 1)`);
    totalErrors++;
    return;
  }
  const correctOpt = correctOpts[0];

  q.opts.forEach((opt, oIdx) => {
    if (opt.correct) return;
    const errors = QuestionSchemaValidator.validateDistractor(
      { t: opt.text, c: false, m: opt.m },
      { t: correctOpt.text, c: true },
      context,
      oIdx
    );
    if (errors.length > 0) {
      console.error(`\nVIOLATION in ${context} Opt ${oIdx+1} ('${opt.text}'):`);
      errors.forEach(err => console.error(`  - [${err.ruleId}] ${err.message}`));
      totalErrors += errors.length;
    }
  });

  // Verify hints
  ['h1', 'h2', 'h3', 'h4'].forEach(hKey => {
    if (!q.hints || !q.hints[hKey] || q.hints[hKey].length < 10) {
      console.error(`ERROR in ${context}: Hint ${hKey} missing or too short`);
      totalErrors++;
    }
  });
});

if (totalErrors === 0) {
  console.log('\n SUCCESS: All 64 Questions passed 100% of L-Truth Zero-Spoiler and Schema Invariants!');
} else {
  console.error(`\n FAILED: Found ${totalErrors} violations.`);
  process.exit(1);
}
