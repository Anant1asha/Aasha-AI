/**
 * Verification script for Milestone 1 (M1) Textbook Exercise Bank
 * Validates all 75 questions in chapters/ad_all_questions.json against QuestionSchemaValidator.
 */

const fs = require('fs');
const path = require('path');
const { QuestionSchemaValidator } = require('./question_schema_validator.js');

const jsonPath = path.resolve(__dirname, '../chapters/ad_all_questions.json');
const rawData = fs.readFileSync(jsonPath, 'utf8');
const data = JSON.parse(rawData);

console.log('================================================================================');
console.log(' AASHA FOUNDATION — M1 75-QUESTION SCHEMA VALIDATION REPORT');
console.log('================================================================================');

console.log(`Title: ${data.title}`);
console.log(`Total questions in metadata: ${data.total_questions}`);
console.log(`Total questions in questions array: ${data.questions ? data.questions.length : 0}`);

const result = QuestionSchemaValidator.validateExerciseBank(data, 'ad_all_questions.json');

console.log('\n--- Validation Results ---');
console.log(`Passed: ${result.passed ? 'YES (100% compliant)' : 'NO'}`);
console.log(`Score: ${result.score}/100`);
console.log(`Total Questions Validated: ${result.totalQuestions}`);
console.log(`Total Distractors Checked: ${result.totalDistractors}`);
console.log(`Total Hints Checked: ${result.totalHintsChecked}`);
console.log(`Spoiler Violations: ${result.spoilerViolations}`);
console.log(`Missing Misconceptions: ${result.missingMisconceptions}`);
console.log(`Low Quality Misconceptions: ${result.lowQualityMisconceptions}`);
console.log(`Structure Violations: ${result.structureViolations}`);
console.log(`Hint Violations: ${result.hintViolations}`);

if (result.errors.length > 0) {
  console.log('\n--- ERRORS ---');
  result.errors.forEach((err, idx) => {
    console.log(`[${idx + 1}] [${err.ruleId}] ${err.questionId}: ${err.message}`);
  });
}

if (result.warnings.length > 0) {
  console.log('\n--- WARNINGS ---');
  result.warnings.forEach((warn, idx) => {
    console.log(`[${idx + 1}] [${warn.ruleId}] ${warn.questionId}: ${warn.message}`);
  });
}

console.log('================================================================================');

if (!result.passed) {
  process.exit(1);
} else {
  console.log('M1 Textbook Exercise Bank is 100% Certified against L-Truth Standards.');
}
