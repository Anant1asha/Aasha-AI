import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import test from 'node:test';
import { verifyApproval, SignedApproval } from '../packages/aios/trust_authority.ts';

test('approval verifier binds signature to trusted reviewer, action, artifact, and version', () => {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519');
  const keyId = 'test-key-01';
  const now = Date.now();
  const unsigned = {
    schema_version: '1.0' as const,
    decision_id: 'decision-test-0001',
    action: 'APPROVE' as const,
    artifact_id: 'chapter-a',
    artifact_hash: 'a'.repeat(64),
    version: 2,
    reviewer_id: 'super-admin-test',
    reviewer_role: 'SUPER_ADMIN' as const,
    decision: 'APPROVED' as const,
    issued_at: new Date(now).toISOString(),
    expires_at: new Date(now + 60_000).toISOString(),
    nonce: 'nonce-test-00000001',
    key_id: keyId,
  };
  const signature = crypto.sign(null, Buffer.from(JSON.stringify(unsigned)), privateKey).toString('base64url');
  const record: SignedApproval = { ...unsigned, signature };
  const trusted = JSON.stringify({ [keyId]: { reviewer_id: unsigned.reviewer_id, role: 'SUPER_ADMIN', public_key_pem: publicKey.export({ type: 'spki', format: 'pem' }) } });
  const expected = { action: 'APPROVE' as const, artifactId: 'chapter-a', artifactHash: 'a'.repeat(64), version: 2 };

  assert.deepEqual(verifyApproval(record, expected, trusted, now), { valid: true });
  assert.equal(verifyApproval(record, { ...expected, artifactHash: 'b'.repeat(64) }, trusted, now).reason, 'HIL_APPROVAL_SCOPE_MISMATCH');
  assert.equal(verifyApproval({ ...record, artifact_hash: 'b'.repeat(64) }, expected, trusted, now).reason, 'HIL_APPROVAL_SCOPE_MISMATCH');
  assert.equal(verifyApproval(record, expected, undefined, now).reason, 'HIL_TRUSTED_KEY_UNCONFIGURED');
});

