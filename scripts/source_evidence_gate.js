const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

/** Validates the reviewed source-to-output manifest required by legacy HTML builders. */
function validateSourceEvidenceManifest({ manifestPath, projectRoot, chapterId, learningTargetIds = [], assessmentTargetIds = [] }) {
  const errors = [];
  const root = path.resolve(projectRoot);
  let manifest;
  try {
    manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  } catch (error) {
    return { valid: false, errors: [`Cannot read source evidence manifest '${manifestPath}': ${error.message}`], source_hash_status: 'MISSING' };
  }
  if (manifest.schema_version !== 'aasha-source-evidence-v1') errors.push('Unsupported source evidence schema_version');
  if (!chapterId || manifest.chapter_id !== chapterId) errors.push(`Source evidence chapter_id must match '${chapterId || 'requested chapter'}'`);
  if (manifest.inventory_scope !== 'FULL_CHAPTER') errors.push('inventory_scope must be FULL_CHAPTER before artifact emission');

  const documents = Array.isArray(manifest.source_documents) ? manifest.source_documents : [];
  const documentMap = new Map();
  let missingSource = documents.length === 0;
  let hashMismatch = false;
  for (const document of documents) {
    if (!document?.id || documentMap.has(document.id)) errors.push(`Source document ID is missing or duplicated: '${document?.id}'`);
    documentMap.set(document?.id, document);
    if (!Number.isInteger(document.page_count) || document.page_count < 1) errors.push(`Source document '${document.id}' needs a positive integer page_count`);
    if (!/^[a-f0-9]{64}$/i.test(document.sha256 || '')) errors.push(`Source document '${document.id}' needs a 64-character SHA-256 digest`);
    if (typeof document.path !== 'string' || !document.path.trim() || path.isAbsolute(document.path)) {
      errors.push(`Source document '${document.id}' path must be a non-empty project-relative path`);
      missingSource = true;
      continue;
    }
    const absolutePath = path.resolve(root, document.path);
    if (absolutePath !== root && !absolutePath.startsWith(root + path.sep)) {
      errors.push(`Source document '${document.id}' path escapes the project root`);
      missingSource = true;
      continue;
    }
    if (!fs.existsSync(absolutePath)) {
      errors.push(`Source PDF for document '${document.id}' is missing: ${document.path}`);
      missingSource = true;
      continue;
    }
    const actualHash = crypto.createHash('sha256').update(fs.readFileSync(absolutePath)).digest('hex');
    if (actualHash !== String(document.sha256).toLowerCase()) {
      hashMismatch = true;
      errors.push(`Source document '${document.id}' SHA-256 mismatch`);
    }
  }
  if (documents.length === 0) errors.push('source_documents is missing or empty');

  const inventory = Array.isArray(manifest.source_inventory) ? manifest.source_inventory : [];
  const inventoryMap = new Map();
  for (const item of inventory) {
    if (!item?.id || inventoryMap.has(item.id)) errors.push(`Source inventory ID is missing or duplicated: '${item?.id}'`);
    inventoryMap.set(item?.id, item);
    if (!item.label?.trim()) errors.push(`Source inventory item '${item.id}' needs a readable label`);
    if (!Array.isArray(item.pages) || item.pages.length === 0 || item.pages.some((page) => !Number.isInteger(page) || page < 1)) {
      errors.push(`Source inventory item '${item.id}' needs one or more positive integer page references`);
    }
    if (documents.length > 1 && !item.document_id) errors.push(`Source inventory item '${item.id}' must name document_id`);
    if (item.document_id && !documentMap.has(item.document_id)) errors.push(`Source inventory item '${item.id}' references unknown document '${item.document_id}'`);
    const doc = item.document_id ? documentMap.get(item.document_id) : documents.length === 1 ? documents[0] : undefined;
    if (doc && Array.isArray(item.pages) && item.pages.some((page) => page > doc.page_count)) errors.push(`Source inventory item '${item.id}' cites a page beyond document '${doc.id}'`);
    if (item.granularity && !['concept', 'worked_example', 'activity', 'activity_step', 'question', 'question_part', 'other'].includes(item.granularity)) {
      errors.push(`Source inventory item '${item.id}' has unsupported granularity '${item.granularity}'`);
    }
  }
  if (inventory.length === 0) errors.push('source_inventory is missing or empty');

  const learningTargets = new Set(learningTargetIds);
  const assessmentTargets = new Set(assessmentTargetIds);
  const coverage = Array.isArray(manifest.source_coverage) ? manifest.source_coverage : [];
  const coverageMap = new Map();
  for (const entry of coverage) {
    if (!inventoryMap.has(entry?.source_item_id)) errors.push(`Coverage maps unknown source item '${entry?.source_item_id}'`);
    if (coverageMap.has(entry?.source_item_id)) errors.push(`Coverage entry is duplicated for '${entry.source_item_id}'`);
    coverageMap.set(entry?.source_item_id, entry);
    if (entry.coverage !== 'FULL') errors.push(`Source item '${entry.source_item_id}' is not FULL`);
    for (const targetId of entry.learning_target_ids || []) {
      if (!learningTargets.has(targetId)) errors.push(`Source item '${entry.source_item_id}' references unknown learning target '${targetId}'`);
    }
    for (const targetId of entry.assessment_item_ids || []) {
      if (!assessmentTargets.has(targetId)) errors.push(`Source item '${entry.source_item_id}' references unknown assessment target '${targetId}'`);
    }
    const item = inventoryMap.get(entry?.source_item_id);
    const permittedGranularity = {
      chapter_concept: ['concept'],
      worked_example: ['worked_example'],
      activity: ['activity', 'activity_step'],
      textbook_exercise: ['question', 'question_part'],
      other: ['other'],
    };
    if (item && !(permittedGranularity[item.kind] || []).includes(item.granularity)) {
      errors.push(`Source item '${item.id}' cannot be FULL without independently traceable granularity`);
    }
    if (item?.kind === 'textbook_exercise' && !(entry.assessment_item_ids || []).length) errors.push(`Textbook exercise '${item.id}' has no assessment target`);
    if (item && item.kind !== 'textbook_exercise' && !(entry.learning_target_ids || []).length) errors.push(`Learning source item '${item.id}' has no learning target`);
  }
  const unmapped = inventory.filter((item) => !coverageMap.has(item.id)).map((item) => item.id);
  if (unmapped.length) errors.push(`Unmapped source items: ${unmapped.join(', ')}`);

  return {
    valid: errors.length === 0,
    errors,
    source_hash_status: hashMismatch ? 'MISMATCH' : missingSource ? 'MISSING' : 'VERIFIED',
    total_items: inventory.length,
    fully_covered: coverage.filter((entry) => entry.coverage === 'FULL').length,
    unmapped: unmapped.length,
    manifest,
  };
}

module.exports = { validateSourceEvidenceManifest };
