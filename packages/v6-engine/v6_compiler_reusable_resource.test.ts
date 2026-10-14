import assert from 'node:assert/strict';
import * as crypto from 'node:crypto';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { IRAssembler } from '../canonical-ir/ir_assembler.ts';
import { V6Compiler } from './v6_compiler.ts';

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'aasha-v6-resource-'));
try {
  const projectDir = path.join(root, 'project');
  const registryDir = path.join(projectDir, 'experience_registry');
  const resourceDir = path.join(root, 'AASHA_Visual_Mass_Harvest_Phase3', 'resources');
  fs.mkdirSync(registryDir, { recursive: true });
  fs.mkdirSync(resourceDir, { recursive: true });

  const resourceHtml = '<!doctype html><html><body><main><h1>Number Line Marker</h1><div id="stage"></div><script>const AASHA={emit:(type,payload={})=>{window.__AASHA_EVENTS__=(window.__AASHA_EVENTS__||[]).concat({type,payload,sequence_number:(window.__AASHA_EVENTS__||[]).length+1})}};</script></main></body></html>';
  const resourceRelPath = 'AASHA_Visual_Mass_Harvest_Phase3/resources/number-line.html';
  fs.writeFileSync(path.join(root, resourceRelPath), resourceHtml);
  const resourceHash = crypto.createHash('sha256').update(resourceHtml).digest('hex');
  const registry = {
    foundations: [],
    components: [{
      component_id: 'AVR-number-line', version: '1.0.0', status: 'APPROVED',
      capability_contract: { mechanics: ['number_line'] },
      applicability: { subjects: ['Mathematics'], classes: [6] },
      adapter: { source_path: resourceRelPath, web_component_tag: 'aasha-sim' },
      provenance: { source_hash: resourceHash },
      license: { license_status: 'APPROVED', spdx_identifier: 'MIT' },
      runtime: { offline: true, external_urls: [] },
    }],
  };
  fs.writeFileSync(path.join(registryDir, 'registry.json'), JSON.stringify(registry));

  const pdfPath = path.join(root, 'source.pdf');
  fs.writeFileSync(pdfPath, 'source bytes for a compiler integration fixture');
  const pdfHash = crypto.createHash('sha256').update(fs.readFileSync(pdfPath)).digest('hex');
  const { canonicalIR, validationErrors } = IRAssembler.assemble({
    chapter_id: 'resource-adaptation-fixture', title: 'Coordinate Concepts', grade: 6,
    subject: 'Mathematics', board: 'Fixture', source_pdf_hash: `sha256:${pdfHash}`,
    raw_objectives: [{ description: 'Locate values on a number line.', bloom_level: 'apply', success_criteria: ['Place a value'] }],
    raw_concepts: [{ name: 'Number line', definition: 'A number line shows values in ordered positions.' }],
    raw_misconceptions: [],
    raw_assessments: [{
      objective_index: 0, concept_name: 'Number line', question_type: 'mcq', prompt: 'Which point represents two?',
      options: [
        { text: 'Two', is_correct: true, distractor_explanation: '' },
        { text: 'Three', is_correct: false, distractor_explanation: 'Check the tick labels.' },
      ],
      hints: { H1: 'Count the intervals.', H2: 'Start at zero.', H3: 'Move right.', H4: 'Read the label.' },
    }],
    raw_capabilities: [{ purpose: 'Place values using a number line', interaction_type: 'number_line', license_constraint: 'MIT_NATIVE', sandbox_required: true }],
    source_inventory_scope: 'FULL_CHAPTER',
    source_inventory: [{ id: 'source:number-line', kind: 'chapter_concept', pages: [1], label: 'Number line concept', granularity: 'concept' }],
    source_coverage: [{ source_item_id: 'source:number-line', learning_target_ids: ['cnt:mathematics:c6:resource-adaptation-fixture:def_1'], assessment_item_ids: [], coverage: 'FULL' }],
  });
  assert.deepEqual(validationErrors, []);
  canonicalIR.accessibility_envelope.primary_language = 'en';
  canonicalIR.accessibility_envelope.bilingual_pair = 'hi';

  const result = V6Compiler.compilePair(canonicalIR, { registryBaseDir: projectDir, sourcePdfPath: pdfPath, requireFullSourceCoverage: false });
  assert.deepEqual(result.errors, []);
  assert.match(result.learningHtml, /__AASHA_SELECTED_RUNTIME_RESOURCE__/);
  assert.match(result.learningHtml, /AVR-number-line/);
  assert.match(result.learningHtml, /srcdoc/);
  assert.match(result.learningHtml, /setAttribute\('sandbox','allow-scripts'\)/);
  assert.match(result.learningHtml, /aasha-touch-targets/);
  assert.match(result.learningHtml, /min-height:44px/);
  assert.match(result.learningHtml, /__aasha_resource_event/);
  assert.equal(result.lleCoverage.status, 'INCOMPLETE', 'an English-only embedded resource must lower Hindi LLE coverage');
  assert(result.lleCoverage.missing_fields.includes('resource:AVR-number-line:hindi_interface'));
  assert.match(result.assessmentHtml, /Assessment/);
  assert.doesNotMatch(result.assessmentHtml, /Number Line Marker|window\.__AASHA_SELECTED_RUNTIME_RESOURCE__ = \{/,'assessment output must not bundle the learning simulation resource');
  assert.doesNotMatch(result.learningHtml, /Which point represents two\?|Two/,'learning output must not disclose source assessment content through the embedded simulator');

  const workspaceRoot = path.resolve(process.cwd());
  const actualWorkspaceResource = path.resolve(workspaceRoot, '..', 'AASHA_Visual_Mass_Harvest_Phase3', 'resources', 'AVR-P301-number-line-marker.html');
  if (fs.existsSync(actualWorkspaceResource)) {
    const actualPair = V6Compiler.compilePair(canonicalIR, { registryBaseDir: workspaceRoot, sourcePdfPath: pdfPath, requireFullSourceCoverage: false });
    assert.deepEqual(actualPair.errors, []);
    assert.match(actualPair.learningHtml, /AVR-P301-number-line-marker/,'the workspace registry and neighboring resource library resolve through the regular V6 build path');
    assert.match(actualPair.learningHtml, /Number Line Marker/);
    assert.match(actualPair.learningHtml, /sandbox','allow-scripts/);
    assert.doesNotMatch(actualPair.assessmentHtml, /Number Line Marker/);
  }
  console.log('PASS: V6 bundles the exact offline resource only into learning output and keeps its evidence status explicit.');
} finally {
  fs.rmSync(root, { recursive: true, force: true });
}
