import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { RegistryIngestionEngine } from '../packages/adapters/registry_ingestion_engine.ts';

test('registry leaves unmeasured gates UNKNOWN and rejects a hash string as certification evidence', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'aasha-registry-proof-'));
  try {
    const engine = new RegistryIngestionEngine(root);
    const candidatePath = engine.stageCandidate({ component_id: 'candidate-proof-test', version: '1.0.0', component_code: 'class C {}' });
    const candidate = JSON.parse(fs.readFileSync(candidatePath, 'utf8'));
    assert.equal(candidate.runtime.offline, 'UNKNOWN', 'candidate staging must not assume offline behavior');
    assert.deepEqual(candidate.runtime.external_urls, ['UNKNOWN'], 'unmeasured external dependencies must stay unknown');
    assert.equal(candidate.provenance.origin_repo_or_pdf_hash, 'UNKNOWN', 'missing provenance must not be replaced with a mock hash');
    assert.equal(candidate.license.spdx_identifier, 'UNKNOWN', 'missing license evidence must not default to MIT');
    assert.equal(candidate.license.license_status, 'UNKNOWN', 'missing license evidence must not be marked approved');
    assert.deepEqual(candidate.capability_contract.mechanics, [], 'candidate staging must not invent a mechanic');
    assert.deepEqual(candidate.applicability.classes, [], 'candidate staging must not invent a grade');
    const gates = engine.validateCandidate(candidate);
    assert.equal(gates.allowed, false);
    assert.equal(gates.gates.OFFLINE, 'UNKNOWN');
    assert.equal(gates.gates.PROVENANCE, 'UNKNOWN');
    assert.equal(gates.gates.LICENSE, 'UNKNOWN');
    assert.equal(gates.gates.BROWSER_RUNTIME, 'UNKNOWN');
    assert.equal(gates.gates.CAPABILITY_CONTRACT, 'UNKNOWN');
    assert.equal(gates.gates.ACCESSIBILITY, 'UNKNOWN');
    assert.equal(gates.gates.PERFORMANCE, 'UNKNOWN');
    const result = engine.promoteCandidate('candidate-proof-test', 'a'.repeat(64), {} as any);
    assert.equal(result.success, false);
    assert.match(result.reason, /signed component evidence file is missing/);
    const registryPath = path.join(root, 'experience_registry/registry.json');
    const registry = fs.existsSync(registryPath) ? JSON.parse(fs.readFileSync(registryPath, 'utf8')) : { components: [] };
    assert.equal(registry.components?.length ?? 0, 0);

    const metadataOnlyPath = engine.stageCandidate({ component_id: 'candidate-no-code' });
    const metadataOnly = JSON.parse(fs.readFileSync(metadataOnlyPath, 'utf8'));
    const metadataOnlyGates = engine.validateCandidate(metadataOnly);
    assert.equal(metadataOnlyGates.gates.FUNCTIONAL, 'UNKNOWN', 'absence of implementation code is missing evidence, not a failed test result');
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});


