/**
 * Verification script for Squares and Cubes question bank (Milestone 1)
 */
const fs = require('fs');
const path = require('path');
const { QuestionSchemaValidator } = require('./question_schema_validator');

const questionsPath = path.resolve(__dirname, '../chapters/square_cube_questions.json');
const rawData = fs.readFileSync(questionsPath, 'utf-8');
const data = JSON.parse(rawData);

console.log(`Loaded: ${data.title}`);
console.log(`Total questions declared: ${data.total_questions}`);
console.log(`Questions in array: ${data.questions.length}`);
console.log(`Tier counts: Warm-up=${data.tier_counts.warmup}, Deep Dive=${data.tier_counts.deep_dive}, Boss=${data.tier_counts.boss}`);

const result = QuestionSchemaValidator.validateExerciseBank(data.questions, 'SquaresCubes_Class8');

console.log('\n=== VALIDATION RESULT ===');
console.log(`Passed: ${result.passed}`);
console.log(`Score: ${result.score}/100`);
console.log(`Total Questions Checked: ${result.totalQuestions}`);
console.log(`Total Distractors Checked: ${result.totalDistractors}`);
console.log(`Total Hints Checked: ${result.totalHintsChecked}`);
console.log(`Spoiler Violations: ${result.spoilerViolations}`);
console.log(`Missing Misconceptions: ${result.missingMisconceptions}`);
console.log(`Low Quality Misconceptions: ${result.lowQualityMisconceptions}`);
console.log(`Structure Violations: ${result.structureViolations}`);
console.log(`Hint Violations: ${result.hintViolations}`);

if (result.errors.length > 0) {
  console.error('\nERRORS FOUND:');
  result.errors.forEach((err, idx) => {
    console.error(`[${idx + 1}] [${err.ruleId}] ${err.questionId}: ${err.message}`);
  });
  process.exit(1);
} else {
  console.log('\nSUCCESS: 100% of questions passed with 0 errors and 0 spoilers!');
}
