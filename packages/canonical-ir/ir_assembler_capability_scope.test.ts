import assert from 'node:assert/strict';
import { IRAssembler } from './ir_assembler.ts';

const baseline = {
  chapter_id: 'universal-capability-scope', title: 'Any subject chapter', grade: 7,
  subject: 'Science', board: 'Fixture', source_pdf_hash: 'sha256:' + '0'.repeat(64),
  raw_objectives: [{ description: 'Explain a source concept.', bloom_level: 'understand', success_criteria: ['Explain it'] }],
  raw_concepts: [{ name: 'Source concept', definition: 'A source-grounded explanation.' }],
  raw_misconceptions: [], raw_assessments: [],
};

const { canonicalIR } = IRAssembler.assemble(baseline);
assert.deepEqual(canonicalIR.capability_requirements, [], 'the assembler must not invent a chapter-independent balance-beam requirement');
const sim = canonicalIR.experience_graph.states.find((state) => state.type === 'interactive_sim');
assert.ok(sim, 'the extensible runtime may still provide its existing interactive-simulation stage');
assert.equal(sim.capability_id, undefined, 'an unrequested simulation has no fabricated capability binding');

const explicitlyRequested = IRAssembler.assemble({
  ...baseline,
  raw_capabilities: [{ purpose: 'Balance an equation visually', interaction_type: 'balance_beam', license_constraint: 'MIT_NATIVE', sandbox_required: true }],
}).canonicalIR;
assert.equal(explicitlyRequested.capability_requirements.length, 1, 'explicitly requested mechanics remain represented');
assert.equal(explicitlyRequested.experience_graph.states.find((state) => state.type === 'interactive_sim')?.capability_id, explicitlyRequested.capability_requirements[0].id);
console.log('PASS: Canonical IR capabilities are task supplied, not chapter hard-coded.');
