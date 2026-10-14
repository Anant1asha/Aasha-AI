import assert from 'node:assert/strict';
import * as crypto from 'node:crypto';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import vm from 'node:vm';
import { evaluateSourceCoverage } from '../canonical-ir/canonical_ir_schema.ts';
import { evaluateLLECoverage } from '../canonical-ir/canonical_ir_schema.ts';
import { IRAssembler } from '../canonical-ir/ir_assembler.ts';
import { V6Compiler } from './v6_compiler.ts';

const { canonicalIR, validationErrors } = IRAssembler.assemble({
  chapter_id: 'concept-progression-regression',
  title: 'Three Step Learning Example',
  grade: 6,
  subject: 'Mathematics',
  board: 'Test fixture',
  source_pdf_hash: 'sha256:0000000000000000000000000000000000000000000000000000000000000000',
  raw_objectives: [{
    description: 'Explain and use three related concepts.',
    bloom_level: 'understand',
    success_criteria: ['Explain each concept'],
  }],
  raw_capabilities: [{ purpose: 'Task fixture balance manipulative', interaction_type: 'balance_beam', license_constraint: 'MIT_NATIVE', sandbox_required: true }],
  raw_concepts: [
    { name: 'First concept', name_hindi: 'पहली अवधारणा', definition: 'A substantive explanation of the first concept.', definition_hindi: 'पहली अवधारणा में x² का विचार समझें।' },
    { name: 'Second concept', definition: 'A substantive explanation of the second concept.' },
    { name: 'Third concept', definition: 'A substantive explanation of the third concept.' },
  ],
  raw_misconceptions: [],
  raw_assessments: [{
    objective_index: 0,
    concept_name: 'First concept',
    question_type: 'mcq',
    prompt: 'Assessment-only prompt: what is the protected answer?',
    options: [
      { text: 'Protected correct choice 73', is_correct: true, distractor_explanation: '' },
      { text: 'Incorrect choice 19', is_correct: false, distractor_explanation: 'Recheck the concept.' },
    ],
    hints: { H1: 'Recall the idea.', H2: 'Use the definition.', H3: 'Apply the rule.', H4: 'Work one step.' },
  }],
});

assert.deepEqual(validationErrors, []);
canonicalIR.accessibility_envelope.primary_language = 'en';
canonicalIR.accessibility_envelope.bilingual_pair = 'hi';
const firstConcept = canonicalIR.concept_graph[0];
canonicalIR.content_blocks.push({
  id: 'cnt:worked-example',
  type: 'worked_example',
  concept_id: firstConcept.id,
  text_english: 'Worked example: unpack a repeated product before applying the rule.',
  text_math_insulated: 'Worked example: unpack a repeated product before applying the rule.',
  provenance_source: 'test fixture',
  fidelity_score: 1,
});
assert.match(canonicalIR.content_blocks[0].text_hindi_math_insulated || '', /data-math/);
assert.equal(evaluateLLECoverage(canonicalIR).status, 'INCOMPLETE', 'partial translations never count as a complete bilingual package');
canonicalIR.experience_graph.states[0].content_ids.push('cnt:worked-example');
assert.equal(evaluateSourceCoverage(canonicalIR).status, 'UNKNOWN', 'missing source inventory is explicit unknown evidence');
canonicalIR.source_inventory = [
  { id: 'src:c1', kind: 'chapter_concept', pages: [1], label: 'Concept 1', granularity: 'concept' },
  { id: 'src:c2', kind: 'chapter_concept', pages: [2], label: 'Concept 2', granularity: 'concept' },
  { id: 'src:c3', kind: 'chapter_concept', pages: [3], label: 'Concept 3', granularity: 'concept' },
  { id: 'src:example', kind: 'worked_example', pages: [4], label: 'Worked example', granularity: 'worked_example' },
  { id: 'src:exercise', kind: 'textbook_exercise', pages: [5], label: 'End exercise 1', granularity: 'question' },
];
canonicalIR.source_inventory_scope = 'FULL_CHAPTER';
canonicalIR.source_coverage = [
  ...canonicalIR.content_blocks.slice(0, 3).map((block, index) => ({ source_item_id: `src:c${index + 1}`, learning_target_ids: [block.id], assessment_item_ids: [], coverage: 'FULL' as const })),
  { source_item_id: 'src:example', learning_target_ids: ['cnt:worked-example'], assessment_item_ids: [], coverage: 'FULL' },
  { source_item_id: 'src:exercise', learning_target_ids: [], assessment_item_ids: [canonicalIR.assessment_items[0].id], coverage: 'FULL' },
];
const sourcePdfPath = path.join(os.tmpdir(), `aasha-source-proof-${process.pid}.pdf`);
fs.writeFileSync(sourcePdfPath, 'fixture textbook source bytes');
canonicalIR.chapter_metadata.source_pdf_hash = 'sha256:' + crypto.createHash('sha256').update(fs.readFileSync(sourcePdfPath)).digest('hex');
canonicalIR.content_blocks.forEach((block) => { block.provenance_source = `pdf:${canonicalIR.chapter_metadata.source_pdf_hash}`; });
const registryBaseDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aasha-v6-registry-'));
fs.mkdirSync(path.join(registryBaseDir, 'experience_registry'), { recursive: true });
fs.writeFileSync(path.join(registryBaseDir, 'experience_registry', 'registry.json'), JSON.stringify({
  foundations: [{ id: 'fixture-balance', name: 'Fixture balance foundation', repo: 'fixture://local', license: 'MIT', subjects: ['Mathematics'], classes: [6], mechanics: ['balance_beam'] }],
  components: [],
}));
const compiled = V6Compiler.compile(canonicalIR, { registryBaseDir, sourcePdfPath, requireFullSourceCoverage: false });
assert.deepEqual(compiled.errors, []);
assert.equal(compiled.sourceCoverage.status, 'FULL');
assert.equal(compiled.sourceCoverage.source_hash_status, 'VERIFIED');
assert.equal(compiled.lleCoverage.status, 'INCOMPLETE', 'partial Hindi translations must be reported as incomplete');
assert.equal(compiled.capabilityMatches.length, 1, 'the active compiler resolves each Canonical IR capability');
assert.equal(compiled.capabilityMatches[0].result.status, 'MATCH_FOUND', 'the active compiler finds an exact registry mechanic');
assert.equal(compiled.capabilityMatches[0].result.reuse_class, 'ADAPTATION_CANDIDATE', 'catalog matches remain candidates until artifact gates pass');
assert.match(compiled.html, /__AASHA_CAPABILITY_MATCHES__/, 'the standalone artifact retains its capability-selection evidence');
assert.match(compiled.html, /REVIEW_REQUIRED/, 'the artifact does not upgrade a license string to approved evidence');
const packageResult = V6Compiler.compilePair(canonicalIR, { registryBaseDir, sourcePdfPath, requireFullSourceCoverage: false });
assert.deepEqual(packageResult.errors, []);
assert.equal(packageResult.sourceCoverage.status, 'FULL');
assert.equal(packageResult.sourceCoverage.source_hash_status, 'VERIFIED');
assert.equal(packageResult.lleCoverage.status, 'INCOMPLETE');
assert.match(packageResult.learningHtml, /__AASHA_SOURCE_COVERAGE__/);
assert.match(packageResult.learningHtml, /__AASHA_LLE_COVERAGE__/);
assert.ok(packageResult.learningHtml.length > 0 && packageResult.assessmentHtml.length > 0, 'the shared compiler produces both standalone artifacts');
assert.match(packageResult.learningHtml, /First concept/, 'the learning artifact keeps lesson content');
assert.doesNotMatch(packageResult.learningHtml, /Assessment-only prompt|Protected correct choice 73/, 'the learning artifact contains no assessment key or assessment items');
assert.doesNotMatch(packageResult.learningHtml, /<script\b[^>]*\bsrc\s*=|<link\b[^>]*\bhref\s*=\s*["']https?:|\bfetch\s*\(|new\s+XMLHttpRequest\s*\(/i, 'the learning artifact has no remote runtime dependencies');
const learnerRuntimeIRJson = packageResult.learningHtml.match(/const IR = ([\s\S]*?);\nconst CAPABILITY_MATCHES/);
assert.ok(learnerRuntimeIRJson, 'learning artifact embeds a parseable projected runtime IR');
assert.equal(JSON.parse(learnerRuntimeIRJson![1]).assessment_items.length, 0, 'learning runtime data contains no answer keys');
assert.match(packageResult.assessmentHtml, /Assessment-only prompt/, 'the assessment artifact contains its assessment prompt');
assert.doesNotMatch(packageResult.assessmentHtml, /Worked example: unpack a repeated product/, 'the assessment artifact does not embed lesson explanations');
assert.doesNotMatch(packageResult.assessmentHtml, /<script\b[^>]*\bsrc\s*=|<link\b[^>]*\bhref\s*=\s*["']https?:|\bfetch\s*\(|new\s+XMLHttpRequest\s*\(/i, 'the assessment artifact has no remote runtime dependencies');
fs.writeFileSync(sourcePdfPath, 'changed source bytes');
const mismatchedSource = V6Compiler.compile(canonicalIR, { registryBaseDir, sourcePdfPath, requireFullSourceCoverage: false });
assert.ok(mismatchedSource.errors.some((error) => error.includes('does not match')));
assert.equal(mismatchedSource.sourceCoverage.source_hash_status, 'MISMATCH');
assert.equal(mismatchedSource.html, '', 'a mismatched source PDF blocks compilation');
fs.rmSync(registryBaseDir, { recursive: true, force: true });
fs.rmSync(sourcePdfPath, { force: true });

const appScript = [...compiled.html.matchAll(/<script>([\s\S]*?)<\/script>/g)]
  .map(match => match[1])
  .find(script => script.includes('const IR ='));
assert.ok(appScript, 'compiled HTML includes its self-contained V6 runtime');

class FakeElement {
  innerHTML = '';
  textContent = '';
  innerText = '';
  style: Record<string, string> = {};
  disabled = false;
  dataset: Record<string, string> = {};
  classList = { add() {}, remove() {} };
  addEventListener() {}
}

const elements = new Map<string, FakeElement>();
const getElement = (id: string) => {
  if (!elements.has(id)) elements.set(id, new FakeElement());
  return elements.get(id)!;
};
let onReady: (() => void) | undefined;
const windowListeners = new Map<string, Array<(event: unknown) => void>>();
const fakeWindow = {
  addEventListener(type: string, handler: (event: unknown) => void) {
    if (type === 'DOMContentLoaded') onReady = () => handler(undefined);
    else windowListeners.set(type, [...(windowListeners.get(type) || []), handler]);
  },
  dispatchEvent() {},
  __AASHA_LANG__: 'en',
};
const context = {
  window: fakeWindow,
  document: {
    getElementById: getElement,
    querySelectorAll: () => [],
    addEventListener() {},
  },
  localStorage: { getItem: () => null, setItem() {} },
  customElements: { get: () => true, define() {} },
  HTMLElement: class {},
  CustomEvent: class { constructor(public type: string, public init?: unknown) {} },
  setTimeout,
  clearTimeout,
  console,
};

vm.runInNewContext(appScript!, context, { timeout: 1000 });
assert.ok(onReady, 'runtime registers its DOM ready handler');
onReady!();

const screen = getElement('screen');
assert.match(screen.innerHTML, /First concept/);
assert.match(screen.innerHTML, /Worked example/);
assert.match(screen.innerHTML, /unpack a repeated product/);
assert.doesNotMatch(screen.innerHTML, /Second concept|Third concept/, 'initial lesson view teaches only the first concept');

(fakeWindow as any).AashaLang.toggle();
assert.match(screen.innerHTML, /पहली अवधारणा/, 'language toggle rerenders available Hindi learning content');
(fakeWindow as any).AashaLang.toggle();
assert.match(screen.innerHTML, /First concept/, 'language toggle returns to English content');

(fakeWindow as any).exp.nextConcept();
assert.match(screen.innerHTML, /Second concept/);
assert.doesNotMatch(screen.innerHTML, /First concept|Third concept/, 'next action advances to the second concept');
(fakeWindow as any).exp.previousConcept();
assert.match(screen.innerHTML, /First concept/, 'back returns to the previous concept');
(fakeWindow as any).exp.nextConcept();

(fakeWindow as any).exp.nextConcept();
assert.match(screen.innerHTML, /Third concept/);
assert.doesNotMatch(screen.innerHTML, /First concept|Second concept/, 'each concept is presented as its own learning step');

assert.match(getElement('navBar').innerHTML, /Start Lab/, 'the simulation becomes available after the final concept');
(fakeWindow as any).exp.nextConcept();
assert.match(screen.innerHTML, /<aasha-sim/, 'the final concept advances into the existing simulation state');
assert.match(getElement('navBar').innerHTML, /Ready for Assessment/);
(fakeWindow as any).exp.back();
assert.match(screen.innerHTML, /Third concept/, 'Back from the simulation returns to the last concept instead of advancing');

console.log('PASS: V6 presents source concept content as an ordered learning progression.');
