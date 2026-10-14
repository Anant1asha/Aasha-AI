const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { validateSourceEvidenceManifest } = require('./source_evidence_gate');

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'aasha-source-evidence-'));
try {
  const sourcePath = path.join(root, 'book-part.pdf');
  const bytes = Buffer.from('PDF source fixture');
  fs.writeFileSync(sourcePath, bytes);
  const manifestPath = path.join(root, 'source-evidence.json');
  const manifest = {
    schema_version: 'aasha-source-evidence-v1',
    chapter_id: 'fixture-chapter',
    inventory_scope: 'FULL_CHAPTER',
    inventory_scope: 'FULL_CHAPTER',
    source_documents: [{ id: 'book-part', path: 'book-part.pdf', sha256: crypto.createHash('sha256').update(bytes).digest('hex'), page_count: 2 }],
    source_inventory: [{ id: 'exercise:q1', kind: 'textbook_exercise', document_id: 'book-part', pages: [2], label: 'Exercise 1', granularity: 'question' }],
    source_coverage: [{ source_item_id: 'exercise:q1', learning_target_ids: [], assessment_item_ids: ['assessment:q1'], coverage: 'FULL' }],
  };
  fs.writeFileSync(manifestPath, JSON.stringify(manifest));

  const valid = validateSourceEvidenceManifest({ manifestPath, projectRoot: root, chapterId: 'fixture-chapter', assessmentTargetIds: ['assessment:q1'] });
  assert.equal(valid.valid, true, valid.errors.join('\n'));
  assert.equal(valid.manifest.chapter_id, 'fixture-chapter');

  manifest.inventory_scope = 'PARTIAL';
  fs.writeFileSync(manifestPath, JSON.stringify(manifest));
  const partialScope = validateSourceEvidenceManifest({ manifestPath, projectRoot: root, chapterId: 'fixture-chapter', assessmentTargetIds: ['assessment:q1'] });
  assert.equal(partialScope.valid, false);
  assert.match(partialScope.errors.join('\n'), /inventory_scope must be FULL_CHAPTER/i);
  manifest.inventory_scope = 'FULL_CHAPTER';

  manifest.source_coverage = [];
  fs.writeFileSync(manifestPath, JSON.stringify(manifest));
  const incomplete = validateSourceEvidenceManifest({ manifestPath, projectRoot: root, chapterId: 'fixture-chapter', assessmentTargetIds: ['assessment:q1'] });
  assert.equal(incomplete.valid, false);
  assert.match(incomplete.errors.join('\n'), /unmapped source items/i);

  manifest.source_coverage = [{ source_item_id: 'exercise:q1', learning_target_ids: [], assessment_item_ids: ['assessment:missing'], coverage: 'FULL' }];
  fs.writeFileSync(manifestPath, JSON.stringify(manifest));
  const dangling = validateSourceEvidenceManifest({ manifestPath, projectRoot: root, chapterId: 'fixture-chapter', assessmentTargetIds: ['assessment:q1'] });
  assert.equal(dangling.valid, false);
  assert.match(dangling.errors.join('\n'), /unknown assessment target/i);

  manifest.source_coverage = [{ source_item_id: 'exercise:q1', learning_target_ids: [], assessment_item_ids: ['assessment:q1'], coverage: 'FULL' }];
  manifest.source_inventory[0].pages = [3];
  fs.writeFileSync(manifestPath, JSON.stringify(manifest));
  const pageOutOfRange = validateSourceEvidenceManifest({ manifestPath, projectRoot: root, chapterId: 'fixture-chapter', assessmentTargetIds: ['assessment:q1'] });
  assert.equal(pageOutOfRange.valid, false);
  assert.match(pageOutOfRange.errors.join('\n'), /page beyond/i);
  manifest.source_inventory[0].pages = [2];

  const wrongChapter = validateSourceEvidenceManifest({ manifestPath, projectRoot: root, chapterId: 'different-chapter', assessmentTargetIds: ['assessment:q1'] });
  assert.equal(wrongChapter.valid, false);
  assert.match(wrongChapter.errors.join('\n'), /chapter_id must match/i);

  fs.writeFileSync(sourcePath, 'changed bytes');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest));
  const mismatch = validateSourceEvidenceManifest({ manifestPath, projectRoot: root, chapterId: 'fixture-chapter', assessmentTargetIds: ['assessment:q1'] });
  assert.equal(mismatch.valid, false);
  assert.match(mismatch.errors.join('\n'), /SHA-256 mismatch/i);
} finally {
  fs.rmSync(root, { recursive: true, force: true });
}
console.log('PASS: Legacy build source manifest rejects incomplete mappings, dangling outputs, and changed PDFs.');
