import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { computeApprovedBuildLessonManifestHash } from '../packages/memory-engine/context_bus.ts';
import { REQUIRED_CERTIFICATION_GATES, SignedApproval, SignedCertification } from '../packages/aios/trust_authority.ts';
import { VersionManager } from '../packages/aios/version_manager.ts';
import { ApprovedBuildLesson } from '../packages/memory-engine/memory_interface.ts';

const repoRoot = path.resolve(__dirname, '..');
const cliEntry = path.join(repoRoot, 'admin_memory_cli.ts');
const tsxEntry = path.join(repoRoot, 'node_modules', 'tsx', 'dist', 'cli.mjs');

function signApproval(privateKey: crypto.KeyObject, fields: Omit<SignedApproval, 'signature'>): SignedApproval {
  return { ...fields, signature: crypto.sign(null, Buffer.from(JSON.stringify(fields)), privateKey).toString('base64url') };
}

function runCli(env: NodeJS.ProcessEnv, ...args: string[]) {
  return spawnSync(process.execPath, [tsxEntry, cliEntry, ...args], { cwd: repoRoot, env, encoding: 'utf8' });
}

test('version-snapshot CLI creates a candidate by default', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'aasha-cli-snapshot-'));
  try {
    const artifactPath = path.join(root, 'candidate.html');
    const versionsDir = path.join(root, 'versions');
    fs.writeFileSync(artifactPath, '<!doctype html><title>candidate</title>');
    const env = { ...process.env, AASHA_VERSION_STORE_DIR: versionsDir, MEMO0_OFFLINE: '1', NODE_ENV: 'test' };
    const result = runCli(env, 'version-snapshot', artifactPath);
    assert.equal(result.status, 0, result.stderr || result.stdout);
    assert.match(result.stdout, /Status:\s+CANDIDATE/);
    assert.equal(new VersionManager(versionsDir).listLineage('candidate')[0]?.status, 'CANDIDATE');
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('Super Admin CLI certifies, approves, and captures a signed lesson offline', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'aasha-cli-lesson-'));
  try {
    const versionsDir = path.join(root, 'versions');
    const evidenceDir = path.join(root, 'evidence');
    const memoryPath = path.join(root, 'approved-lessons.json');
    fs.mkdirSync(evidenceDir);
    const artifactPath = path.join(root, 'chapter.html');
    const sourcePath = path.join(root, 'source.pdf');
    const contractPath = path.join(root, 'contract.json');
    const evidencePath = path.join(evidenceDir, 'gate.txt');
    fs.writeFileSync(artifactPath, '<!doctype html><title>chapter</title>');
    fs.writeFileSync(sourcePath, '%PDF-source');
    fs.writeFileSync(contractPath, '{"chapter":"source grounded"}');
    fs.writeFileSync(evidencePath, 'certification evidence');

    const certKeys = crypto.generateKeyPairSync('ed25519');
    const hilKeys = crypto.generateKeyPairSync('ed25519');
    const certKeysJson = JSON.stringify({ 'cert-key': { role: 'CERTIFIER', reviewer_id: 'certifier', public_key_pem: certKeys.publicKey.export({ type: 'spki', format: 'pem' }) } });
    const hilKeysJson = JSON.stringify({ 'hil-key': { role: 'SUPER_ADMIN', reviewer_id: 'reviewer', public_key_pem: hilKeys.publicKey.export({ type: 'spki', format: 'pem' }) } });
    const env = {
      ...process.env,
      AASHA_VERSION_STORE_DIR: versionsDir,
      AASHA_LOCAL_MEMORY_FILE: memoryPath,
      AASHA_CERTIFICATION_TRUSTED_KEYS_JSON: certKeysJson,
      AASHA_HIL_TRUSTED_KEYS_JSON: hilKeysJson,
      MEMO0_OFFLINE: '1',
      NODE_ENV: 'test',
    };

    const vm = new VersionManager(versionsDir);
    const candidate = await vm.registerVersion({ filePath: artifactPath, artifactId: 'cli-lesson-artifact', sourcePath, contractPath });
    const issuedAt = new Date().toISOString();
    const evidenceHash = VersionManager.calculateFileHash(evidencePath);
    const unsignedCert = {
      schema_version: '1.0' as const,
      certification_id: 'cli-certification',
      artifact_id: candidate.artifact_id,
      artifact_hash: candidate.artifact_hash,
      version: candidate.version,
      source_hash: candidate.source_hash,
      contract_hash: candidate.contract_hash,
      compiler_version: 'cli-test',
      schema_version_source: 'test-schema',
      test_environment: 'node:test',
      repair_attempts: 0,
      verdict: 'PASS' as const,
      gate_results: REQUIRED_CERTIFICATION_GATES.map(gate_id => ({
        gate_id, status: 'PASS' as const, method: 'node:test cli evidence', environment: 'node:test', timestamp: issuedAt,
        artifact_hash: candidate.artifact_hash, evidence_refs: [{ path: 'gate.txt', sha256: evidenceHash }],
      })),
      certified_at: issuedAt,
      key_id: 'cert-key',
    };
    const certificate: SignedCertification = {
      ...unsignedCert,
      signature: crypto.sign(null, Buffer.from(JSON.stringify(unsignedCert)), certKeys.privateKey).toString('base64url'),
    };
    const certificatePath = path.join(evidenceDir, 'certificate.json');
    fs.writeFileSync(certificatePath, JSON.stringify(certificate));

    const approvalPayload = {
      schema_version: '1.0' as const,
      decision_id: 'cli-artifact-approval',
      action: 'APPROVE' as const,
      artifact_id: candidate.artifact_id,
      artifact_hash: candidate.artifact_hash,
      version: candidate.version,
      reviewer_id: 'reviewer',
      reviewer_role: 'SUPER_ADMIN' as const,
      decision: 'APPROVED' as const,
      issued_at: issuedAt,
      expires_at: new Date(Date.parse(issuedAt) + 5 * 60_000).toISOString(),
      nonce: 'cli-approval-nonce-0000000001',
      key_id: 'hil-key',
    };
    const buildApproval = signApproval(hilKeys.privateKey, approvalPayload);
    const approvalPath = path.join(root, 'approval.json');
    fs.writeFileSync(approvalPath, JSON.stringify(buildApproval));

    const lesson: ApprovedBuildLesson = {
      schema_version: '1.0',
      lesson_id: 'cli-lesson-01',
      task_profile: { task_type: 'chapter-learning', goal: 'Create an offline visual learning chapter', capability_tags: ['offline-simulation'], constraints: ['offline'] },
      artifact: { artifact_id: candidate.artifact_id, sha256: candidate.artifact_hash, version: candidate.version },
      lesson: { reusable_pattern: 'Reuse the certified offline simulation and adapt source-backed content.', adaptation_notes: ['Keep content tied to the canonical contract.'], known_limits: ['Only the reviewed capability is approved.'] },
      source_provenance: [
        { source_id: 'textbook-source', sha256: candidate.source_hash },
        { source_id: 'canonical-contract', sha256: candidate.contract_hash },
      ],
      test_evidence: [{ test_id: 'BROWSER_SMOKE', status: 'PASS', command: 'node:test cli evidence', sha256: evidenceHash, run_at: issuedAt }],
      build_approval: buildApproval,
      reviewer_decision: {} as SignedApproval,
    };
    const manifestApproval = signApproval(hilKeys.privateKey, {
      schema_version: '1.0',
      decision_id: 'cli-lesson-review',
      action: 'APPROVE',
      artifact_id: 'approved-build-lesson:cli-lesson-01',
      artifact_hash: computeApprovedBuildLessonManifestHash(lesson),
      version: '1.0',
      reviewer_id: 'reviewer',
      reviewer_role: 'SUPER_ADMIN',
      decision: 'APPROVED',
      issued_at: issuedAt,
      expires_at: new Date(Date.parse(issuedAt) + 5 * 60_000).toISOString(),
      nonce: 'cli-lesson-nonce-0000000001',
      key_id: 'hil-key',
    });
    lesson.reviewer_decision = manifestApproval;
    const lessonPath = path.join(root, 'lesson.json');
    fs.writeFileSync(lessonPath, JSON.stringify(lesson));

    const certificationResult = runCli(env, 'version-certify', candidate.artifact_id, candidate.artifact_hash, certificatePath);
    assert.equal(certificationResult.status, 0, certificationResult.stderr || certificationResult.stdout);
    assert.match(certificationResult.stdout, /Version certified/i);

    const approvalResult = runCli(env, 'version-approve', candidate.artifact_id, candidate.artifact_hash, approvalPath);
    assert.equal(approvalResult.status, 0, approvalResult.stderr || approvalResult.stdout);
    assert.match(approvalResult.stdout, /Artifact approved/i);

    const captureResult = runCli(env, 'version-capture-lesson', candidate.artifact_id, candidate.artifact_hash, certificatePath, 'DesignAgent', lessonPath);
    assert.equal(captureResult.status, 0, captureResult.stderr || captureResult.stdout);
    assert.match(captureResult.stdout, /approved-build lesson stored locally/i);
    const memory = JSON.parse(fs.readFileSync(memoryPath, 'utf8'));
    assert.equal(memory.memories.length, 1);
    assert.equal(memory.memories[0].metadata.approved_build_lesson.artifact.sha256, candidate.artifact_hash);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
