import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { IRAssembler } from '../canonical-ir/ir_assembler.ts';
import { V6Compiler } from './v6_compiler.ts';

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aasha-multi-source-'));
try {
  const bytesA = Buffer.from('source A');
  const bytesB = Buffer.from('source B');
  const pathA = path.join(tempDir, 'part-a.pdf');
  const pathB = path.join(tempDir, 'part-b.pdf');
  fs.writeFileSync(pathA, bytesA);
  fs.writeFileSync(pathB, bytesB);
  const hashA = crypto.createHash('sha256').update(bytesA).digest('hex');
  const hashB = crypto.createHash('sha256').update(bytesB).digest('hex');
  const { canonicalIR } = IRAssembler.assemble({
    chapter_id: 'multi-source', title: 'Multi Source', grade: 8, subject: 'Science', board: 'Fixture', source_pdf_hash: `sha256:${hashA}`,
    source_documents: [
      { id: 'part-a', file_name: 'part-a.pdf', sha256: hashA, page_count: 4 },
      { id: 'part-b', file_name: 'part-b.pdf', sha256: hashB, page_count: 3 },
    ],
    source_inventory_scope: 'FULL_CHAPTER',
    source_inventory: [{ id: 's:a', kind: 'chapter_concept', pages: [2], label: 'Part A concept', document_id: 'part-a', granularity: 'concept' }],
    source_coverage: [],
    raw_objectives: [{ description: 'Explain the concept.', bloom_level: 'understand', success_criteria: ['Explain'] }],
    raw_concepts: [{ name: 'Concept', definition: 'A source concept.' }], raw_misconceptions: [],
    raw_assessments: [{ objective_index: 0, concept_name: 'Concept', question_type: 'mcq', prompt: 'Check the concept?',
      options: [{ text: 'Yes', is_correct: true, distractor_explanation: '' }, { text: 'No', is_correct: false, distractor_explanation: 'Review the concept.' }],
      hints: { H1: 'Think.', H2: 'Recall.', H3: 'Apply.', H4: 'Check.' } }],
  });

  const valid = V6Compiler.compile(canonicalIR, { sourcePdfPaths: { 'part-a': pathA, 'part-b': pathB }, requireFullSourceCoverage: false });
  assert.equal(valid.sourceCoverage.source_hash_status, 'VERIFIED');
  assert.ok(valid.html.length > 0);

  const noEvidenceDefault = V6Compiler.compile(canonicalIR);
  assert.ok(noEvidenceDefault.errors.some((error) => error.includes('VERIFIED source hashes')));
  assert.equal(noEvidenceDefault.html, '');

  const singlePathForManyDocuments = V6Compiler.compile(canonicalIR, {
    sourcePdfPath: pathA, requireFullSourceCoverage: false,
  });
  assert.equal(singlePathForManyDocuments.sourceCoverage.source_hash_status, 'MISSING');

  const incompleteStrict = V6Compiler.compile(canonicalIR, {
    sourcePdfPaths: { 'part-a': pathA, 'part-b': pathB }, requireFullSourceCoverage: true,
  });
  assert.ok(incompleteStrict.errors.some((error) => error.includes('FULL source coverage')));
  assert.ok(incompleteStrict.errors.some((error) => error.includes('coverage inventory is incomplete')));
  assert.equal(incompleteStrict.html, '');
  const savedInventory = canonicalIR.source_inventory;
  canonicalIR.source_inventory = undefined;
  const noInventoryStrict = V6Compiler.compile(canonicalIR, {
    sourcePdfPaths: { 'part-a': pathA, 'part-b': pathB }, requireFullSourceCoverage: true,
  });
  assert.ok(noInventoryStrict.errors.some((error) => error.includes('source_inventory is missing')));
  canonicalIR.source_inventory = savedInventory;
  canonicalIR.source_coverage = [{
    source_item_id: 's:a', learning_target_ids: [canonicalIR.content_blocks[0].id], assessment_item_ids: [], coverage: 'FULL',
  }];
  const completeStrict = V6Compiler.compile(canonicalIR, {
    sourcePdfPaths: { 'part-a': pathA, 'part-b': pathB }, requireFullSourceCoverage: true,
  });
  assert.deepEqual(completeStrict.errors, []);
  assert.equal(completeStrict.sourceCoverage.status, 'FULL');

  canonicalIR.source_inventory_scope = 'PARTIAL';
  const partialInventoryStrict = V6Compiler.compile(canonicalIR, {
    sourcePdfPaths: { 'part-a': pathA, 'part-b': pathB }, requireFullSourceCoverage: true,
  });
  assert.equal(partialInventoryStrict.sourceCoverage.status, 'INCOMPLETE');
  assert.ok(partialInventoryStrict.errors.some((error) => error.includes('source inventory scope is PARTIAL')));
  assert.equal(partialInventoryStrict.html, '');
  canonicalIR.source_inventory_scope = 'FULL_CHAPTER';

  fs.writeFileSync(pathB, 'changed source B');
  const mismatch = V6Compiler.compile(canonicalIR, { sourcePdfPaths: { 'part-a': pathA, 'part-b': pathB }, requireFullSourceCoverage: false });
  assert.equal(mismatch.sourceCoverage.source_hash_status, 'MISMATCH');
  assert.equal(mismatch.html, '');

  const missing = V6Compiler.compile(canonicalIR, { sourcePdfPaths: { 'part-a': pathA }, requireFullSourceCoverage: false });
  assert.equal(missing.sourceCoverage.source_hash_status, 'MISSING');
  assert.equal(missing.html, '');
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}
console.log('PASS: V6 source manifest requires exact document set and verifies every PDF before compilation.');
