import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { VersionManager } from '../packages/aios/version_manager.ts';
import { REQUIRED_CERTIFICATION_GATES, SignedCertification } from '../packages/aios/trust_authority.ts';

test('VersionManager requires signed, artifact-bound executed evidence and then remains HIL-gated', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'aasha-cert-evidence-'));
  const oldKeys = process.env.AASHA_CERTIFICATION_TRUSTED_KEYS_JSON;
  const oldHilKeys = process.env.AASHA_HIL_TRUSTED_KEYS_JSON;
  try {
    const artifact = path.join(root, 'chapter.html');
    const source = path.join(root, 'source.pdf');
    const contract = path.join(root, 'contract.json');
    const evidenceFile = path.join(root, 'gate-evidence.txt');
    fs.writeFileSync(artifact, '<!doctype html><title>test</title>');
    fs.writeFileSync(source, '%PDF-test-fixture');
    fs.writeFileSync(contract, '{"chapter":"test"}');
    fs.writeFileSync(evidenceFile, 'gate evidence fixture');
    const vm = new VersionManager(path.join(root, 'versions'));
    const candidate = await vm.registerVersion({ filePath: artifact, artifactId: 'chapter-test', sourcePath: source, contractPath: contract });
    assert.equal(candidate.status, 'CANDIDATE');

    const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519');
    const evidenceHash = crypto.createHash('sha256').update(fs.readFileSync(evidenceFile)).digest('hex');
    const now = new Date().toISOString();
    const unsigned = {
      schema_version: '1.0' as const,
      certification_id: 'cert-test-01',
      artifact_id: 'chapter-test',
      artifact_hash: candidate.artifact_hash,
      version: 1,
      source_hash: VersionManager.calculateFileHash(source),
      contract_hash: VersionManager.calculateFileHash(contract),
      compiler_version: 'test-compiler',
      schema_version_source: 'test-schema-1',
      test_environment: 'node:test fixture only',
      repair_attempts: 0,
      verdict: 'PASS' as const,
      gate_results: REQUIRED_CERTIFICATION_GATES.map(gate_id => ({
        gate_id, status: 'PASS' as const, method: 'unit fixture', environment: 'node:test', timestamp: now,
        artifact_hash: candidate.artifact_hash, evidence_refs: [{ path: 'gate-evidence.txt', sha256: evidenceHash }],
      })),
      certified_at: now,
      key_id: 'test-certifier',
    };
    const signature = crypto.sign(null, Buffer.from(JSON.stringify(unsigned)), privateKey).toString('base64url');
    const cert: SignedCertification = { ...unsigned, signature };
    const certificatePath = path.join(root, 'certificate.json');
    fs.writeFileSync(certificatePath, JSON.stringify(cert));
    process.env.AASHA_CERTIFICATION_TRUSTED_KEYS_JSON = JSON.stringify({ 'test-certifier': { role: 'CERTIFIER', reviewer_id: 'test-runner', public_key_pem: publicKey.export({ type: 'spki', format: 'pem' }) } });
    delete process.env.AASHA_HIL_TRUSTED_KEYS_JSON;

    const certified = await vm.certifyVersion('chapter-test', candidate.artifact_hash, certificatePath);
    assert.equal(certified.status, 'CERTIFIED');
    assert.equal(certified.certification_hash, VersionManager.calculateFileHash(certificatePath));
    await assert.rejects(vm.promoteToApproved('chapter-test', candidate.artifact_hash, {} as any), /HIL_TRUSTED_KEY_UNCONFIGURED/);
    assert.equal(vm.listLineage('chapter-test')[0].status, 'CERTIFIED');
  } finally {
    if (oldKeys === undefined) delete process.env.AASHA_CERTIFICATION_TRUSTED_KEYS_JSON; else process.env.AASHA_CERTIFICATION_TRUSTED_KEYS_JSON = oldKeys;
    if (oldHilKeys === undefined) delete process.env.AASHA_HIL_TRUSTED_KEYS_JSON; else process.env.AASHA_HIL_TRUSTED_KEYS_JSON = oldHilKeys;
    fs.rmSync(root, { recursive: true, force: true });
  }
});
