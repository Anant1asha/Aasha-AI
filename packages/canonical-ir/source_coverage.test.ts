import assert from 'node:assert/strict';
import { evaluateLLECoverage, evaluateSourceCoverage } from './canonical_ir_schema.ts';
import { IRAssembler } from './ir_assembler.ts';

const { canonicalIR } = IRAssembler.assemble({
  chapter_id: 'coverage-evidence', title: 'Coverage Fixture', grade: 8, subject: 'Science', board: 'Fixture',
  source_pdf_hash: 'sha256:' + '0'.repeat(64),
  raw_objectives: [{ description: 'Explain the concept.', bloom_level: 'understand', success_criteria: ['Explain'] }],
  raw_concepts: [{ name: 'Concept', definition: 'A source concept.' }], raw_misconceptions: [],
  raw_assessments: [{ objective_index: 0, concept_name: 'Concept', question_type: 'mcq', prompt: 'Check the concept?',
    options: [{ text: 'Yes', is_correct: true, distractor_explanation: '' }, { text: 'No', is_correct: false, distractor_explanation: 'Review the concept.' }],
    hints: { H1: 'Think.', H2: 'Recall.', H3: 'Apply.', H4: 'Check.' } }],
});

assert.equal(evaluateSourceCoverage(canonicalIR).status, 'UNKNOWN', 'no extracted inventory must never imply complete coverage');
assert.equal(evaluateLLECoverage(canonicalIR).status, 'INCOMPLETE', 'Hindi is required by the IR contract and missing translations remain visible');
canonicalIR.source_inventory = [
  { id: 's:concept', kind: 'chapter_concept', pages: [4], label: 'Concept definition', granularity: 'concept' },
  { id: 's:example', kind: 'worked_example', pages: [5, 6], label: 'Worked example', granularity: 'worked_example' },
  { id: 's:exercise', kind: 'textbook_exercise', pages: [12], label: 'End-of-chapter exercise 1', granularity: 'question' },
];
canonicalIR.source_inventory_scope = 'FULL_CHAPTER';
canonicalIR.source_coverage = [
  { source_item_id: 's:concept', learning_target_ids: [canonicalIR.concept_graph[0].id], assessment_item_ids: [], coverage: 'FULL' },
  { source_item_id: 's:example', learning_target_ids: [canonicalIR.content_blocks[0].id], assessment_item_ids: [], coverage: 'PARTIAL', note: 'Only the setup is represented.' },
];
canonicalIR.chapter_metadata.source_documents = [
  { id: 'part-1', file_name: 'chapter-part-1.pdf', sha256: '0'.repeat(64), page_count: 6 },
  { id: 'part-2', file_name: 'chapter-part-2.pdf', sha256: '1'.repeat(64), page_count: 6 },
];
canonicalIR.source_inventory[0].document_id = 'part-1';
canonicalIR.source_inventory[1].document_id = 'part-2';
canonicalIR.source_inventory[2].document_id = 'part-2';
canonicalIR.source_inventory[2].pages = [5];
let report = evaluateSourceCoverage(canonicalIR);
assert.equal(report.status, 'INCOMPLETE');
assert.equal(report.partial, 1);
assert.equal(report.unmapped, 1);

canonicalIR.source_coverage.push({ source_item_id: 's:exercise', learning_target_ids: [], assessment_item_ids: [canonicalIR.assessment_items[0].id], coverage: 'FULL' });
canonicalIR.source_coverage[1].coverage = 'FULL';
report = evaluateSourceCoverage(canonicalIR);
assert.equal(report.status, 'FULL');
assert.equal(report.fully_covered, 3);
canonicalIR.source_inventory_scope = 'PARTIAL';
assert.equal(evaluateSourceCoverage(canonicalIR).status, 'INCOMPLETE', 'all mapped items cannot imply chapter-wide completeness when the inventory scope is partial');
canonicalIR.source_inventory_scope = 'FULL_CHAPTER';
delete canonicalIR.source_inventory[2].granularity;
assert.equal(evaluateSourceCoverage(canonicalIR).status, 'INVALID', 'FULL exercise coverage must be inventoried per question or subpart');
canonicalIR.source_inventory[2].granularity = 'question';

canonicalIR.source_inventory[2].pages = [7];
assert.equal(evaluateSourceCoverage(canonicalIR).status, 'INVALID', 'a page must be within its referenced PDF page count');
canonicalIR.source_inventory[2].pages = [5];
delete canonicalIR.source_inventory[2].document_id;
assert.equal(evaluateSourceCoverage(canonicalIR).status, 'INVALID', 'multi-document source items must identify their source PDF');

canonicalIR.source_coverage[2].assessment_item_ids = ['ast:missing'];
report = evaluateSourceCoverage(canonicalIR);
assert.equal(report.status, 'INVALID', 'a broken mapping reference must not pass completeness');

canonicalIR.concept_graph[0].name_hindi = 'अवधारणा';
canonicalIR.content_blocks[0].text_hindi = 'स्रोत की अवधारणा।';
canonicalIR.assessment_items[0].prompt_hindi = 'अवधारणा जाँचें?';
canonicalIR.assessment_items[0].options[0].text_hindi = 'हाँ';
canonicalIR.assessment_items[0].options[1].text_hindi = 'नहीं';
canonicalIR.assessment_items[0].options[1].distractor_explanation_hindi = 'अवधारणा फिर से देखें।';
canonicalIR.assessment_items[0].hints_hindi = { H1_hook: 'सोचें।', H2_concept: 'याद करें।', H3_formula: 'लागू करें।', H4_step: 'जाँचें।' };
const lle = evaluateLLECoverage(canonicalIR);
assert.equal(lle.status, 'COMPLETE');
assert.equal(lle.coverage_percent, 100);
console.log('PASS: Source inventory coverage distinguishes unknown, incomplete, full, and invalid evidence.');
