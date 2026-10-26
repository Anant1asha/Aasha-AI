import assert from 'node:assert/strict';
import { evaluateLLECoverage, evaluateSourceCoverage } from './canonical_ir_schema.ts';
import { IRAssembler } from './ir_assembler.ts';
import { V6Compiler } from '../v6-engine/v6_compiler.ts';

const exampleBlockId = 'cnt:mathematics:c6:source-content-test:learning_1';
const { canonicalIR, validationErrors } = IRAssembler.assemble({
  chapter_id: 'source-content-test',
  title: 'Source Content Test',
  grade: 6,
  subject: 'Mathematics',
  board: 'Fixture',
  source_pdf_hash: `sha256:${'0'.repeat(64)}`,
  raw_objectives: [{
    description: 'Explain the source concept and example.',
    bloom_level: 'understand',
    success_criteria: ['Explain the example'],
  }],
  raw_concepts: [{
    name: 'Powers',
    name_hindi: 'घात',
    definition: 'A power records repeated multiplication.',
    definition_hindi: 'घात बार-बार होने वाले गुणन को दिखाती है।',
  }],
  raw_misconceptions: [],
  raw_assessments: [],
  raw_learning_content: [{
    source_item_id: 'src:worked-example-1',
    concept_name: 'Powers',
    type: 'worked_example',
    text_english: 'Example: \\(2^3 = 2 \\times 2 \\times 2 = 8\\).',
    text_hindi: 'उदाहरण: \\(2^3 = 2 \\times 2 \\times 2 = 8\\)।',
  }],
  source_inventory_scope: 'FULL_CHAPTER',
  source_inventory: [
    { id: 'src:concept-1', kind: 'chapter_concept', pages: [1], label: 'Powers concept', granularity: 'concept' },
    { id: 'src:worked-example-1', kind: 'worked_example', pages: [2], label: 'Worked example 1', granularity: 'worked_example' },
  ],
  source_coverage: [
    { source_item_id: 'src:concept-1', learning_target_ids: ['cnt:mathematics:c6:source-content-test:def_1'], assessment_item_ids: [], coverage: 'FULL' },
    { source_item_id: 'src:worked-example-1', learning_target_ids: [exampleBlockId], assessment_item_ids: [], coverage: 'FULL' },
  ],
});

assert.deepEqual(validationErrors, []);
const example = canonicalIR.content_blocks.find((block) => block.id === exampleBlockId);
assert.ok(example, 'the assembler keeps source-grounded worked examples as Canonical IR content blocks');
assert.equal(example.type, 'worked_example');
assert.equal(example.concept_id, canonicalIR.concept_graph[0].id);
assert.ok(example.provenance_source.includes('src:worked-example-1'));
assert.ok(example.provenance_source.includes(canonicalIR.chapter_metadata.source_pdf_hash));
assert.match(example.text_math_insulated, /data-math=/);
assert.ok(example.text_hindi_math_insulated);
assert.ok(canonicalIR.experience_graph.states[0].content_ids.includes(exampleBlockId));
assert.equal(evaluateSourceCoverage(canonicalIR).status, 'FULL');
assert.equal(evaluateLLECoverage(canonicalIR).status, 'COMPLETE');
const compiled = V6Compiler.compile(canonicalIR, { artifactMode: 'learning', requireFullSourceCoverage: false });
assert.deepEqual(compiled.errors, []);
assert.match(compiled.html, /Example:/, 'the standalone learning renderer includes assembled source content');
assert.match(compiled.html, /2\^3/, 'the rendered artifact preserves the worked-example expression');

console.log('PASS: Source-grounded learning content keeps provenance, math insulation, bilingual text, and renderer links.');
