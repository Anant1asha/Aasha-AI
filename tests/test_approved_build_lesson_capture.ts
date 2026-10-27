import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { ContextBus, computeApprovedBuildLessonManifestHash } from '../packages/memory-engine/context_bus.ts';
import { Memo0DualProvider } from '../packages/memory-engine/memo0_dual_provider.ts';
import { REQUIRED_CERTIFICATION_GATES, SignedApproval, SignedCertification } from '../packages/aios/trust_authority.ts';
import { VersionManager } from '../packages/aios/version_manager.ts';
import { ApprovedBuildLesson } from '../packages/memory-engine/memory_interface.ts';

function signApproval(privateKey: crypto.KeyObject, fields: Omit<SignedApproval, 'signature'>): SignedApproval {
  return { ...fields, signature: crypto.sign(null, Buffer.from(JSON.stringify(fields)), privateKey).toString('base64url') };
}

function signLessonDecision(lesson: ApprovedBuildLesson, privateKey: crypto.KeyObject, issuedAt: string): void {
  const payload = {
    schema_version: '1.0' as const,
    decision_id: `lesson-decision-${crypto.randomBytes(8).toString('hex')}`,
    action: 'APPROVE' as const,
    artifact_id: `approved-build-lesson:${lesson.lesson_id}`,
    artifact_hash: computeApprovedBuildLessonManifestHash(lesson),
    version: lesson.schema_version,
    reviewer_id: 'test-reviewer',
    reviewer_role: 'SUPER_ADMIN' as const,
    decision: 'APPROVED' as const,
    issued_at: issuedAt,
    expires_at: new Date(Date.parse(issuedAt) + 5 * 60_000).toISOString(),
    nonce: crypto.randomBytes(16).toString('base64url'),
    key_id: 'test-reviewer-key',
  };
  lesson.reviewer_decision = signApproval(privateKey, payload);
}

test('approved build lessons can be captured only from the exact approved, certified version and its evidence', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'aasha-lesson-capture-'));
  const envKeys = ['AASHA_CERTIFICATION_TRUSTED_KEYS_JSON', 'AASHA_HIL_TRUSTED_KEYS_JSON', 'MEMO0_OFFLINE', 'NODE_ENV'] as const;
  const oldEnv = Object.fromEntries(envKeys.map(key => [key, process.env[key]]));
  try {
    process.env.MEMO0_OFFLINE = '1';
    process.env.NODE_ENV = 'test';
    const artifactPath = path.join(root, 'chapter.html');
    const sourcePath = path.join(root, 'source.pdf');
    const contractPath = path.join(root, 'contract.json');
    const evidenceDir = path.join(root, 'cert-evidence');
    fs.mkdirSync(evidenceDir);
    const evidencePath = path.join(evidenceDir, 'gate-evidence.txt');
    fs.writeFileSync(artifactPath, '<!doctype html><title>chapter</title>');
    fs.writeFileSync(sourcePath, '%PDF-source-fixture');
    fs.writeFileSync(contractPath, '{"chapter":"source grounded"}');
    fs.writeFileSync(evidencePath, 'verified gate evidence');

    const certKeys = crypto.generateKeyPairSync('ed25519');
    const hilKeys = crypto.generateKeyPairSync('ed25519');
    process.env.AASHA_CERTIFICATION_TRUSTED_KEYS_JSON = JSON.stringify({
      'test-certifier-key': { role: 'CERTIFIER', reviewer_id: 'test-certifier', public_key_pem: certKeys.publicKey.export({ type: 'spki', format: 'pem' }) },
    });
    const hilKeysJson = JSON.stringify({
      'test-reviewer-key': { role: 'SUPER_ADMIN', reviewer_id: 'test-reviewer', public_key_pem: hilKeys.publicKey.export({ type: 'spki', format: 'pem' }) },
    });
    process.env.AASHA_HIL_TRUSTED_KEYS_JSON = hilKeysJson;

    const vm = new VersionManager(path.join(root, 'versions'));
    const candidate = await vm.registerVersion({ filePath: artifactPath, artifactId: 'chapter-capture-test', sourcePath, contractPath });
    const now = new Date().toISOString();
    const gateEvidenceHash = VersionManager.calculateFileHash(evidencePath);
    const unsignedCert = {
      schema_version: '1.0' as const,
      certification_id: 'cert-capture-test',
      artifact_id: candidate.artifact_id,
      artifact_hash: candidate.artifact_hash,
      version: candidate.version,
      source_hash: candidate.source_hash,
      contract_hash: candidate.contract_hash,
      compiler_version: 'test-compiler',
      schema_version_source: 'test-schema-1',
      test_environment: 'node:test fixture',
      repair_attempts: 0,
      verdict: 'PASS' as const,
      gate_results: REQUIRED_CERTIFICATION_GATES.map(gate_id => ({
        gate_id, status: 'PASS' as const, method: 'node:test capture fixture', environment: 'node:test', timestamp: now,
        artifact_hash: candidate.artifact_hash, evidence_refs: [{ path: 'gate-evidence.txt', sha256: gateEvidenceHash }],
      })),
      certified_at: now,
      key_id: 'test-certifier-key',
    };
    const certificate: SignedCertification = {
      ...unsignedCert,
      signature: crypto.sign(null, Buffer.from(JSON.stringify(unsignedCert)), certKeys.privateKey).toString('base64url'),
    };
    const certificatePath = path.join(evidenceDir, 'certificate.json');
    fs.writeFileSync(certificatePath, JSON.stringify(certificate));
    await vm.certifyVersion(candidate.artifact_id, candidate.artifact_hash, certificatePath);

    const approvalPayload = {
      schema_version: '1.0' as const,
      decision_id: 'build-approval-capture-test',
      action: 'APPROVE' as const,
      artifact_id: candidate.artifact_id,
      artifact_hash: candidate.artifact_hash,
      version: candidate.version,
      reviewer_id: 'test-reviewer',
      reviewer_role: 'SUPER_ADMIN' as const,
      decision: 'APPROVED' as const,
      issued_at: now,
      expires_at: new Date(Date.parse(now) + 5 * 60_000).toISOString(),
      nonce: 'build-approval-nonce-capture-test',
      key_id: 'test-reviewer-key',
    };
    const buildApproval = signApproval(hilKeys.privateKey, approvalPayload);
    await vm.promoteToApproved(candidate.artifact_id, candidate.artifact_hash, buildApproval);

    const lesson = {
      schema_version: '1.0' as const,
      lesson_id: 'lesson-capture-test',
      task_profile: {
        task_type: 'chapter-learning-module', goal: 'Teach a source-grounded chapter using an offline visual simulation',
        capability_tags: ['offline-simulation', 'touch-interaction'], constraints: ['offline'],
      },
      artifact: { artifact_id: candidate.artifact_id, sha256: candidate.artifact_hash, version: candidate.version },
      lesson: {
        reusable_pattern: 'Use the certified offline simulation pattern and adapt only source-backed content.',
        adaptation_notes: ['Keep curriculum claims sourced from the canonical contract.'],
        known_limits: ['Only the listed capabilities were approved.'],
      },
      source_provenance: [
        { source_id: 'chapter-source', sha256: candidate.source_hash },
        { source_id: 'canonical-contract', sha256: candidate.contract_hash },
      ],
      test_evidence: [{
        test_id: 'BROWSER_SMOKE', status: 'PASS' as const, command: 'node:test capture fixture',
        sha256: gateEvidenceHash, run_at: now,
      }],
      build_approval: buildApproval,
    } as ApprovedBuildLesson;
    signLessonDecision(lesson, hilKeys.privateKey, now);

    const memoryPath = path.join(root, 'approved-lessons.json');
    const bus = new ContextBus(new Memo0DualProvider({ localDbFile: memoryPath }), undefined, hilKeysJson);
    const saved = await vm.captureApprovedBuildLesson(candidate.artifact_id, candidate.artifact_hash, certificatePath, 'DesignAgent', lesson, bus);
    assert.equal(saved.category, 'approved_build_lesson');
    assert.equal(saved.metadata?.approved_build_lesson?.artifact?.sha256, candidate.artifact_hash);

    const retried = await vm.captureApprovedBuildLesson(candidate.artifact_id, candidate.artifact_hash, certificatePath, 'DesignAgent', lesson, bus);
    assert.equal(retried.id, saved.id, 'capture retries should return the existing identical lesson');
    const memories = await bus.getMemory().getLocalMemoriesByRole('DesignAgent', 'approved_build_lesson');
    assert.equal(memories.length, 1);

    const tamperedLesson = structuredClone(lesson);
    tamperedLesson.test_evidence[0].sha256 = '0'.repeat(64);
    signLessonDecision(tamperedLesson, hilKeys.privateKey, now);
    await assert.rejects(
      vm.captureApprovedBuildLesson(candidate.artifact_id, candidate.artifact_hash, certificatePath, 'DesignAgent', tamperedLesson, bus),
      /certification evidence|test evidence/i,
    );
  } finally {
    for (const key of envKeys) {
      if (oldEnv[key] === undefined) delete process.env[key];
      else process.env[key] = oldEnv[key]!;
    }
    fs.rmSync(root, { recursive: true, force: true });
  }
});
