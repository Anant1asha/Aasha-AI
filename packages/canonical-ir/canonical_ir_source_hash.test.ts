import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { IRAssembler } from './ir_assembler.ts';

function assembleWithSourceHash(sourcePdfHash: string) {
  return IRAssembler.assemble({
    chapter_id: 'source-hash-contract',
    title: 'Source Hash Contract',
    grade: 6,
    subject: 'Mathematics',
    board: 'Test fixture',
    source_pdf_hash: sourcePdfHash,
    raw_objectives: [{
      description: 'Explain the concept.',
      bloom_level: 'understand',
      success_criteria: ['Explain the concept'],
    }],
    raw_concepts: [{ name: 'Concept', definition: 'A source-grounded explanation.' }],
    raw_misconceptions: [],
    raw_assessments: [],
  });
}

const invalid = assembleWithSourceHash('sha256_math_matrix_8_ch02_exponents_and_powers');
assert.ok(
  invalid.validationErrors.some(error => error.includes('source_pdf_hash') && error.includes('SHA-256')),
  'descriptive placeholders are rejected as source provenance',
);

const validHash = createHash('sha256').update('test source PDF bytes').digest('hex');
const valid = assembleWithSourceHash(`sha256:${validHash}`);
assert.deepEqual(valid.validationErrors, [], 'a correctly formatted SHA-256 source fingerprint is accepted');

console.log('PASS: Canonical IR refuses descriptive source-hash placeholders.');
