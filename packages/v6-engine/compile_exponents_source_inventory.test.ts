import assert from 'node:assert/strict';
import { evaluateSourceCoverage } from '../canonical-ir/canonical_ir_schema.ts';
import { IRAssembler } from '../canonical-ir/ir_assembler.ts';
import { exponentsPowersProposal } from './compile_exponents_powers_class8.ts';

const { canonicalIR, validationErrors } = IRAssembler.assemble(exponentsPowersProposal);
assert.deepEqual(validationErrors, []);
assert.equal(canonicalIR.source_inventory_scope, 'PARTIAL');

const coverage = evaluateSourceCoverage(canonicalIR);
assert.equal(coverage.status, 'INCOMPLETE');
assert.equal(coverage.total_items, 233);
assert.equal(coverage.fully_covered, 78);
assert.equal(coverage.unmapped, 154);
assert.equal(coverage.omitted, 1);
assert.deepEqual(coverage.invalid_references, []);

const sources = new Map(canonicalIR.source_inventory?.map((item) => [item.id, item]));
const mappedQuestions = new Map(canonicalIR.source_coverage?.map((entry) => [
  entry.source_item_id,
  entry.assessment_item_ids,
]));
const mappedLearningTargets = new Map(canonicalIR.source_coverage?.map((entry) => [
  entry.source_item_id,
  entry.learning_target_ids,
]));
assert.equal(sources.get('math-matrix-ch2-warmup-q1-a')?.pages[0], 1);
assert.equal(sources.get('math-matrix-ch2-warmup-q10-d')?.pages[0], 1);
assert.equal(sources.get('math-matrix-ch2-ex2a-q1-a')?.pages[0], 6);
assert.equal(sources.get('math-matrix-ch2-ex2a-q7-h')?.pages[0], 6);
assert.equal(sources.get('math-matrix-ch2-ex2a-q8-a')?.pages[0], 1);
assert.equal(sources.get('math-matrix-ch2-ex2a-q8-h')?.pages[0], 1);
assert.equal(sources.get('math-matrix-ch2-ex2a-q13-c')?.pages[0], 1);
assert.equal(sources.get('math-matrix-ch2-ex2a-q20')?.pages[0], 1);
for (const sourceId of [
  'math-matrix-ch2-ex2b-q1-h',
  'math-matrix-ch2-ex2b-q2-h',
  'math-matrix-ch2-ex2b-q3-a',
  'math-matrix-ch2-ex2b-q3-h',
  'math-matrix-ch2-ex2b-q4',
  'math-matrix-ch2-ex2b-q5',
]) {
  assert.ok(sources.has(sourceId), `missing Exercise 2(B) source item ${sourceId}`);
}
assert.equal(sources.get('math-matrix-ch2-rewind-q1-h')?.pages[0], 4);
assert.equal(sources.get('math-matrix-ch2-rewind-q15')?.pages[0], 5);
assert.equal(sources.get('math-matrix-ch2-hots-q2-a')?.pages[0], 4);
assert.equal(sources.get('math-matrix-ch2-hots-q2-b')?.pages[0], 4);
assert.equal(sources.get('math-matrix-ch2-hots-q3')?.pages[0], 4);
assert.equal(sources.get('math-matrix-ch2-hots-q4')?.pages[0], 4);
assert.equal(sources.has('math-matrix-ch2-hots-q1-missing-source'), true);
assert.equal(canonicalIR.source_coverage?.find((entry) => entry.source_item_id === 'math-matrix-ch2-hots-q1-missing-source')?.coverage, 'OMITTED');
for (const sourceId of [
  'math-matrix-ch2-solved-example-15',
  'math-matrix-ch2-activity-maths-lab',
  'math-matrix-ch2-activity-life-skills',
  'math-matrix-ch2-activity-subject-integration',
]) {
  assert.ok(sources.has(sourceId), `missing chapter learning/activity inventory item ${sourceId}`);
  assert.deepEqual(mappedQuestions.get(sourceId), [], `${sourceId} learning coverage must not be mistaken for assessment coverage`);
  assert.ok(mappedLearningTargets.get(sourceId)?.length, `${sourceId} must point to reviewed learning content`);
}
const mappedExamples: Array<[string, number, RegExp]> = [
  ['math-matrix-ch2-intro-example-h', 1, /\(-4\/5\)\^5/],
  ['math-matrix-ch2-solved-example-1', 2, /4\^\{-3\}.*5\/3/],
  ['math-matrix-ch2-solved-example-11', 3, /6\/7.*x/],
  ['math-matrix-ch2-solved-example-12', 4, /0\.6573.*6\.573/],
];
for (const [sourceId, contentIndex, textPattern] of mappedExamples) {
  const block = canonicalIR.content_blocks.find((candidate) => candidate.id === `cnt:mathematics:c8:c8_math_exponents_powers:learning_${contentIndex}`);
  assert.ok(block, `${sourceId} must be emitted as a learning content block`);
  assert.match(block.text_english, textPattern);
  assert.ok(block.text_hindi, `${sourceId} must include its Hindi explanation`);
  assert.ok(mappedLearningTargets.get(sourceId)?.includes(block.id), `${sourceId} must map to its exact rendered block`);
}
const expandedLearningItems = [
  ...'abcdefg'.split('').map((letter) => `math-matrix-ch2-intro-example-${letter}`),
  ...[2, 3, 4, 5, 6, 7, 8, 9, 10, 13, 14, 15].map((example) => `math-matrix-ch2-solved-example-${example}`),
  'math-matrix-ch2-activity-maths-lab',
  'math-matrix-ch2-activity-life-skills',
  'math-matrix-ch2-activity-subject-integration',
];
for (const [index, sourceId] of expandedLearningItems.entries()) {
  const blockId = `cnt:mathematics:c8:c8_math_exponents_powers:learning_${index + 5}`;
  const block = canonicalIR.content_blocks.find((candidate) => candidate.id === blockId);
  assert.ok(block, `${sourceId} must produce source-specific learning content`);
  assert.ok(block.text_english.trim(), `${sourceId} must include English content`);
  assert.ok(block.text_hindi?.trim(), `${sourceId} must include Hindi content`);
  assert.ok(mappedLearningTargets.get(sourceId)?.includes(blockId), `${sourceId} must map to its exact content block`);
  assert.ok(block.provenance_source.includes(`source-item:${sourceId}`), `${sourceId} must retain source provenance`);
}
const correctedExample3 = canonicalIR.content_blocks.find((block) => block.id === 'cnt:mathematics:c8:c8_math_exponents_powers:learning_13');
assert.match(correctedExample3?.text_english || '', /-125\/32/);
assert.match(correctedExample3?.text_english || '', /solution appears to print -10/i);
const checkedExample14 = canonicalIR.content_blocks.find((block) => block.id === 'cnt:mathematics:c8:c8_math_exponents_powers:learning_22');
assert.match(checkedExample14?.text_english || '', /109\.75.*110/);
assert.match(checkedExample14?.text_english || '', /printed solution.*100/i);
for (const sourceId of [
  'math-matrix-ch2-concept-exponential-notation',
  'math-matrix-ch2-concept-negative-integral-exponents',
  'math-matrix-ch2-concept-exponent-laws',
  'math-matrix-ch2-concept-solving-exponential-equations',
  'math-matrix-ch2-concept-standard-form',
]) {
  assert.ok(sources.has(sourceId), `missing chapter concept inventory item ${sourceId}`);
  assert.deepEqual(mappedQuestions.get(sourceId), [], `${sourceId} must not imply assessment coverage`);
}
assert.deepEqual(mappedQuestions.get('math-matrix-ch2-warmup-q1-a'), [canonicalIR.assessment_items[0].id]);
const confirmedMappings: Array<[string, number]> = [
  ['math-matrix-ch2-hots-q2-b', 37],
  ['math-matrix-ch2-hots-q3', 38],
  ['math-matrix-ch2-ex2a-q3-b', 35],
  ['math-matrix-ch2-ex2a-q3-c', 36],
  ['math-matrix-ch2-warmup-q6-c', 30],
  ['math-matrix-ch2-mcq-q7', 31],
  ['math-matrix-ch2-mcq-q9', 32],
  ['math-matrix-ch2-mcq-q10', 33],
  ['math-matrix-ch2-mcq-q11', 34],
  ['math-matrix-ch2-warmup-q1-c', 26],
  ['math-matrix-ch2-warmup-q1-d', 27],
  ['math-matrix-ch2-warmup-q2-b', 28],
  ['math-matrix-ch2-warmup-q2-c', 29],
  ['math-matrix-ch2-ex2a-q10-a', 12],
  ['math-matrix-ch2-ex2a-q10-c', 13],
  ['math-matrix-ch2-ex2a-q18', 11],
  ['math-matrix-ch2-ex2b-q1-a', 14],
  ['math-matrix-ch2-ex2b-q2-a', 15],
  ['math-matrix-ch2-mcq-q1', 16],
  ['math-matrix-ch2-mcq-q2', 17],
  ['math-matrix-ch2-mcq-q3', 18],
  ['math-matrix-ch2-mcq-q4', 19],
  ['math-matrix-ch2-mcq-q5', 20],
  ['math-matrix-ch2-mcq-q6', 21],
  ['math-matrix-ch2-mcq-q8', 22],
  ['math-matrix-ch2-mcq-q12', 23],
  ['math-matrix-ch2-hots-q2-a', 24],
  ['math-matrix-ch2-hots-q4', 25],
];
for (const [sourceId, assessmentNumber] of confirmedMappings) {
  assert.ok(sources.has(sourceId), `missing reviewed source inventory item ${sourceId}`);
  assert.deepEqual(mappedQuestions.get(sourceId), [canonicalIR.assessment_items[assessmentNumber - 1].id]);
}
assert.match(canonicalIR.assessment_items[25].prompt, /\(-\\frac\{5\}\{3\}\)\^5/);
assert.match(canonicalIR.assessment_items[26].prompt, /\(-\\frac\{7\}\{11\}\)\^4/);
assert.match(canonicalIR.assessment_items[27].prompt, /2197/);
assert.match(canonicalIR.assessment_items[28].prompt, /1024/);
assert.match(canonicalIR.assessment_items[29].prompt, /a\^4.*b\^4.*c\^4/);
assert.match(canonicalIR.assessment_items[30].prompt, /8\^0 - 3\^0/);
assert.match(canonicalIR.assessment_items[31].prompt, /3\^0 - 4\^0/);
assert.match(canonicalIR.assessment_items[32].prompt, /2\^\{x-4\}/);
assert.match(canonicalIR.assessment_items[33].prompt, /0\.00000037/);
assert.match(canonicalIR.assessment_items[34].prompt, /\(-4\)\^{-2}/);
assert.match(canonicalIR.assessment_items[35].prompt, /1.*7\^{-2}/);
assert.match(canonicalIR.assessment_items[36].prompt, /a\^\{p\+q\}/);
assert.match(canonicalIR.assessment_items[37].prompt, /0\.000007.*0\.00001275/);
assert.equal(canonicalIR.assessment_items[37].options.find((option) => option.is_correct)?.text, 'Approximately 1.82 times');
assert.ok(Math.abs(0.00001275 / 0.000007 - 1.82) < 0.01);
const mappedDeepDiveItems: Array<[string, number, RegExp]> = [
  ['math-matrix-ch2-ex2a-q10-b', 39, /2x-1/],
  ['math-matrix-ch2-ex2a-q10-d', 40, /2x-1/],
  ['math-matrix-ch2-ex2a-q14', 41, /3\^\{-7\}/],
  ['math-matrix-ch2-ex2a-q15', 42, /\(-4\)\^5.*4\^\{-2\}/],
  ['math-matrix-ch2-ex2a-q19', 43, /\\frac\{3\}\{8\}.*\\frac\{9\}\{64\}/],
  ['math-matrix-ch2-ex2a-q20', 44, /\\frac\{4\}\{7\}.*\\frac\{7\}\{16\}/],
  ['math-matrix-ch2-ex2b-q1-e', 45, /0\.0000000839/],
  ['math-matrix-ch2-ex2b-q2-b', 46, /4\.6.*10\^4/],
  ['math-matrix-ch2-ex2b-q2-c', 47, /8.*10\^\{-8\}/],
  ['math-matrix-ch2-ex2b-q2-e', 48, /5\.8.*10\^\{12\}/],
  ['math-matrix-ch2-ex2b-q3-b', 49, /0\.00000000000000000016/],
  ['math-matrix-ch2-ex2b-q3-c', 50, /0\.0000005/],
  ['math-matrix-ch2-ex2b-q3-d', 51, /0\.00001275/],
  ['math-matrix-ch2-ex2b-q3-f', 52, /300,000,000/],
];
for (const [sourceId, assessmentNumber, promptPattern] of mappedDeepDiveItems) {
  assert.deepEqual(mappedQuestions.get(sourceId), [canonicalIR.assessment_items[assessmentNumber - 1].id]);
  const assessment = canonicalIR.assessment_items[assessmentNumber - 1];
  assert.match(assessment.prompt, promptPattern);
  assert.ok(assessment.prompt_hindi, `${sourceId} needs a Hindi prompt`);
  assert.ok(assessment.options.every((option) => option.text_hindi), `${sourceId} needs Hindi answer options`);
  assert.ok(assessment.options.every((option) => option.is_correct || option.distractor_explanation_hindi), `${sourceId} needs Hindi diagnostic feedback`);
  assert.ok(assessment.hints_hindi && Object.values(assessment.hints_hindi).every(Boolean), `${sourceId} needs four Hindi hints`);
}
for (const assessment of canonicalIR.assessment_items.slice(25, 38)) {
  assert.ok(assessment.prompt_hindi, `${assessment.id} must include its Hindi prompt`);
  assert.ok(assessment.options.every((option) => option.text_hindi), `${assessment.id} must include Hindi answer options`);
  assert.ok(assessment.options.every((option) => option.is_correct || option.distractor_explanation_hindi), `${assessment.id} must include Hindi misconception feedback`);
  assert.ok(assessment.hints_hindi && Object.values(assessment.hints_hindi).every(Boolean), `${assessment.id} must include all four Hindi hints`);
}
const confirmedConceptMappings = [
  ['math-matrix-ch2-concept-exponential-notation', 0],
  ['math-matrix-ch2-concept-negative-integral-exponents', 1],
  ['math-matrix-ch2-concept-exponent-laws', 2],
  ['math-matrix-ch2-concept-solving-exponential-equations', 3],
  ['math-matrix-ch2-concept-standard-form', 4],
] as const;
for (const [sourceId, conceptIndex] of confirmedConceptMappings) {
  const concept = canonicalIR.concept_graph[conceptIndex];
  const content = canonicalIR.content_blocks.find((block) => block.concept_id === concept.id);
  assert.ok(content, `${sourceId} must be rendered as a learning content block`);
  assert.ok(mappedLearningTargets.get(sourceId)?.includes(concept.id));
  assert.ok(mappedLearningTargets.get(sourceId)?.includes(content.id));
}
for (const exampleNumber of Array.from({ length: 15 }, (_, index) => index + 1)) {
  assert.ok(sources.has(`math-matrix-ch2-solved-example-${exampleNumber}`));
}
for (const exampleLetter of ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']) {
  assert.ok(sources.has(`math-matrix-ch2-intro-example-${exampleLetter}`));
}
assert.equal(canonicalIR.chapter_metadata.source_documents?.length, 2);

console.log('PASS: All 23 worked examples, three activities, and 47 exact exercise mappings retain source-linked bilingual content; remaining source inventory stays unmapped.');
