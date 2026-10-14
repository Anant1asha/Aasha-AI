import * as crypto from 'node:crypto';

export type ApprovalAction = 'CERTIFY' | 'APPROVE' | 'DEPLOY';
export interface SignedApproval {
  schema_version: '1.0';
  decision_id: string;
  action: ApprovalAction;
  artifact_id: string;
  artifact_hash: string;
  version: number | string;
  reviewer_id: string;
  reviewer_role: 'SUPER_ADMIN';
  decision: 'APPROVED';
  issued_at: string;
  expires_at: string;
  nonce: string;
  key_id: string;
  signature: string;
}
export const SignedApproval = {};

type TrustedKey = { reviewer_id: string; role: string; public_key_pem: string };

function payloadFor(record: SignedApproval): string {
  const { signature: _signature, ...payload } = record;
  return JSON.stringify(payload);
}

export function verifyApproval(record: SignedApproval, expected: {
  action: ApprovalAction; artifactId: string; artifactHash: string; version: number | string;
}, trustedKeysJson = process.env.AASHA_HIL_TRUSTED_KEYS_JSON, nowMs = Date.now()): { valid: boolean; reason?: string } {
  if (!trustedKeysJson) return { valid: false, reason: 'HIL_TRUSTED_KEY_UNCONFIGURED' };
  let keys: Record<string, TrustedKey>;
  try { keys = JSON.parse(trustedKeysJson); } catch { return { valid: false, reason: 'HIL_TRUSTED_KEY_CONFIG_INVALID' }; }
  const key = keys[record.key_id];
  if (!key || key.role !== 'SUPER_ADMIN' || key.reviewer_id !== record.reviewer_id) return { valid: false, reason: 'HIL_SIGNER_NOT_AUTHORIZED' };
  if (record.schema_version !== '1.0' || record.reviewer_role !== 'SUPER_ADMIN' || record.decision !== 'APPROVED') return { valid: false, reason: 'HIL_APPROVAL_SCHEMA_INVALID' };
  if (record.action !== expected.action || record.artifact_id !== expected.artifactId || record.artifact_hash !== expected.artifactHash || record.version !== expected.version) return { valid: false, reason: 'HIL_APPROVAL_SCOPE_MISMATCH' };
  const issued = Date.parse(record.issued_at), expires = Date.parse(record.expires_at);
  if (!Number.isFinite(issued) || !Number.isFinite(expires) || issued > nowMs || expires <= nowMs || expires <= issued || nowMs - issued > 10 * 60_000) return { valid: false, reason: 'HIL_APPROVAL_EXPIRED_OR_INVALID_TIME' };
  if (!/^[A-Za-z0-9_-]{16,128}$/.test(record.nonce) || !record.decision_id || !/^[A-Za-z0-9_-]{16,128}$/.test(record.signature)) return { valid: false, reason: 'HIL_APPROVAL_FIELDS_INVALID' };
  try {
    const valid = crypto.verify(null, Buffer.from(payloadFor(record), 'utf8'), key.public_key_pem, Buffer.from(record.signature, 'base64url'));
    return valid ? { valid: true } : { valid: false, reason: 'HIL_SIGNATURE_INVALID' };
  } catch { return { valid: false, reason: 'HIL_TRUST_KEY_INVALID' }; }
}

export const REQUIRED_CERTIFICATION_GATES = [
  'SOURCE_TRACEABILITY', 'TLN_SCHEMA', 'OBJECTIVE_COVERAGE', 'ASSESSMENT_COVERAGE',
  'CONTENT_CORRECTNESS', 'MATH_CORRECTNESS', 'NAVIGATION', 'INTERACTION', 'OFFLINE',
  'STATE_TELEMETRY_SEPARATION', 'BUNDLE_SIZE', 'BROWSER_SMOKE', 'ACCESSIBILITY_BASIC',
  'SECURITY', 'PROVENANCE', 'HIL',
] as const;

export interface SignedCertification {
  schema_version: '1.0';
  certification_id: string;
  artifact_id: string;
  artifact_hash: string;
  version: number | string;
  source_hash: string;
  contract_hash: string;
  compiler_version: string;
  schema_version_source: string;
  test_environment: string;
  repair_attempts: number;
  verdict: 'PASS';
  gate_results: Array<{
    gate_id: string;
    status: 'PASS';
    method: string;
    environment: string;
    timestamp: string;
    artifact_hash: string;
    evidence_refs: Array<{ path: string; sha256: string }>;
  }>;
  certified_at: string;
  key_id: string;
  signature: string;
}

export function verifyCertificationSignature(record: SignedCertification, expected: { artifactId: string; artifactHash: string; version: number }, trustedKeysJson = process.env.AASHA_CERTIFICATION_TRUSTED_KEYS_JSON): { valid: boolean; reason?: string } {
  if (!trustedKeysJson) return { valid: false, reason: 'CERTIFICATION_TRUSTED_KEY_UNCONFIGURED' };
  let keys: Record<string, TrustedKey>;
  try { keys = JSON.parse(trustedKeysJson); } catch { return { valid: false, reason: 'CERTIFICATION_TRUSTED_KEY_CONFIG_INVALID' }; }
  const key = keys[record.key_id];
  if (!key || key.role !== 'CERTIFIER') return { valid: false, reason: 'CERTIFIER_NOT_AUTHORIZED' };
  if (record.schema_version !== '1.0' || record.verdict !== 'PASS' || record.artifact_id !== expected.artifactId || record.artifact_hash !== expected.artifactHash || record.version !== expected.version) return { valid: false, reason: 'CERTIFICATION_SCOPE_INVALID' };
  const seen = new Set<string>();
  for (const gate of record.gate_results || []) {
    if (seen.has(gate.gate_id) || gate.status !== 'PASS' || gate.artifact_hash !== expected.artifactHash || !gate.method || !gate.environment || !Number.isFinite(Date.parse(gate.timestamp)) || !Array.isArray(gate.evidence_refs) || gate.evidence_refs.length === 0) return { valid: false, reason: 'CERTIFICATION_GATE_EVIDENCE_INVALID' };
    seen.add(gate.gate_id);
  }
  if (REQUIRED_CERTIFICATION_GATES.some(g => !seen.has(g))) return { valid: false, reason: 'CERTIFICATION_GATE_MISSING' };
  const issued = Date.parse(record.certified_at);
  if (!Number.isFinite(issued) || issued > Date.now() || Date.now() - issued > 24 * 60 * 60_000) return { valid: false, reason: 'CERTIFICATION_TIME_INVALID' };
  try {
    const { signature: _signature, ...payload } = record;
    const ok = crypto.verify(null, Buffer.from(JSON.stringify(payload), 'utf8'), key.public_key_pem, Buffer.from(record.signature, 'base64url'));
    return ok ? { valid: true } : { valid: false, reason: 'CERTIFICATION_SIGNATURE_INVALID' };
  } catch { return { valid: false, reason: 'CERTIFICATION_TRUST_KEY_INVALID' }; }
}

export function verifyTrustedSignature(record: Record<string, any>, role: string, trustedKeysJson = process.env.AASHA_CERTIFICATION_TRUSTED_KEYS_JSON): { valid: boolean; reason?: string } {
  if (!trustedKeysJson) return { valid: false, reason: 'CERTIFICATION_TRUSTED_KEY_UNCONFIGURED' };
  let keys: Record<string, TrustedKey>;
  try { keys = JSON.parse(trustedKeysJson); } catch { return { valid: false, reason: 'CERTIFICATION_TRUSTED_KEY_CONFIG_INVALID' }; }
  const key = keys[record.key_id];
  if (!key || key.role !== role) return { valid: false, reason: 'ATTESTATION_SIGNER_NOT_AUTHORIZED' };
  try {
    const { signature: _signature, ...payload } = record;
    const ok = crypto.verify(null, Buffer.from(JSON.stringify(payload), 'utf8'), key.public_key_pem, Buffer.from(record.signature, 'base64url'));
    return ok ? { valid: true } : { valid: false, reason: 'ATTESTATION_SIGNATURE_INVALID' };
  } catch { return { valid: false, reason: 'ATTESTATION_TRUST_KEY_INVALID' }; }
}


