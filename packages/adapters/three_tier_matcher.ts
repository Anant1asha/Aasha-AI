import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { type SignedApproval, verifyApproval, verifyTrustedSignature } from '../aios/trust_authority.ts';

export interface CapabilityRequest {
  capability_id: string;
  subject: string;
  grade: number;
  board?: string;
  mechanics: string[];
  inputs?: string[];
  outputs?: string[];
  interaction_model?: string;
  offline_required?: boolean;
}

export type MatchStatus = 'MATCH_FOUND' | 'NO_MATCH' | 'BLOCKED' | 'UNKNOWN';

export interface MatchResult {
  tier: 1 | 2 | 3;
  status: MatchStatus;
  reuse_class?: 'CERTIFIED_COMPONENT' | 'ADAPTATION_CANDIDATE';
  runtime_verified?: boolean;
  component_id?: string;
  version?: string;
  foundation_id?: string;
  capability_match?: Record<string, any>;
  provenance?: Record<string, any>;
  license?: Record<string, any>;
  /** A locally hash-verified artifact may be adapted; this never implies browser certification. */
  runtime_artifact?: {
    resource_id: string;
    source_path: string;
    source_sha256: string;
    media_type: 'text/html';
    local_verified: true;
    browser_verified: false;
    language?: string;
  };
  reason: string;
}

export class ThreeTierMatcher {
  private baseDir: string;
  private registryPath: string;

  constructor(baseDir?: string) {
    this.baseDir = baseDir || (typeof __dirname !== 'undefined' ? path.resolve(__dirname, '../..') : process.cwd());
    this.registryPath = path.resolve(this.baseDir, 'experience_registry/registry.json');
  }

  private hasVerifiableCertification(component: any): boolean {
    const required = ['FUNCTIONAL','CAPABILITY_CONTRACT','BROWSER_RUNTIME','OFFLINE','PROVENANCE','LICENSE','ACCESSIBILITY','PERFORMANCE','SECURITY_CHILD_SAFETY','MAINTAINABILITY','AASHA_INTEGRATION'];
    if (component.status !== 'CERTIFIED' || !required.every(g => component.verification?.gates_passed?.includes(g)) || !component.verification?.approval_decision_id || !component.verification?.reviewer_id) return false;
    const evidencePath = path.resolve(this.baseDir, 'experience_registry/evidence', `${component.component_id}_evidence.json`);
    const codePath = path.resolve(this.baseDir, 'experience_registry/components', `${component.component_id}_v${component.version}.ts`);
    if (!fs.existsSync(evidencePath) || !fs.existsSync(codePath)) return false;
    try {
      const packageEvidence = JSON.parse(fs.readFileSync(evidencePath, 'utf8'));
      const attestation = packageEvidence.attestation;
      const approval: SignedApproval = packageEvidence.approval;
      if (attestation?.component_id !== component.component_id || attestation?.version !== component.version || attestation?.artifact_hash !== component.artifact_hash || this.hashFile(codePath) !== component.artifact_hash) return false;
      if (!verifyTrustedSignature(attestation, 'CERTIFIER').valid) return false;
      const hil = verifyApproval(approval, { action: 'CERTIFY', artifactId: component.component_id, artifactHash: component.artifact_hash, version: component.version }, undefined, Date.parse(approval.issued_at) + 1);
      if (!hil.valid || approval.decision_id !== component.verification.approval_decision_id || approval.reviewer_id !== component.verification.reviewer_id) return false;
      const ids = new Set<string>();
      const root = path.dirname(evidencePath);
      for (const gate of attestation.gate_results || []) {
        if (ids.has(gate.gate_id) || gate.status !== 'PASS' || gate.artifact_hash !== component.artifact_hash || !Array.isArray(gate.evidence_refs) || gate.evidence_refs.length === 0) return false;
        ids.add(gate.gate_id);
        for (const ref of gate.evidence_refs) {
          const full = path.resolve(root, ref.path || '');
          const rel = path.relative(root, full);
          if (rel.startsWith('..') || path.isAbsolute(rel) || !fs.existsSync(full) || this.hashFile(full) !== ref.sha256) return false;
        }
      }
      return required.length === ids.size && required.every(g => ids.has(g));
    } catch { return false; }
  }

  private hashFile(filePath: string): string {
    return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
  }

  private resolveLocalResource(sourcePath: string, expectedHash: string): { filePath: string; html: string } | null {
    const resourceRoot = path.resolve(this.baseDir, '..');
    const filePath = path.resolve(resourceRoot, sourcePath);
    const rel = path.relative(resourceRoot, filePath);
    if (rel.startsWith('..') || path.isAbsolute(rel) || !fs.existsSync(filePath)) return null;
    try {
      const realRoot = fs.realpathSync(resourceRoot);
      const realFile = fs.realpathSync(filePath);
      const realRel = path.relative(realRoot, realFile);
      if (realRel.startsWith('..') || path.isAbsolute(realRel)) return null;
      if (this.hashFile(realFile) !== expectedHash.toLowerCase()) return null;
      const html = fs.readFileSync(realFile, 'utf8');
      if (!/<html\b/i.test(html) || !/<script\b/i.test(html)) return null;
      if (/<base\b|\b(?:src|href|poster|srcset)\s*=\s*["']?\s*(?:https?:)?\/\/|url\(\s*["']?\s*(?:https?:)?\/\/|@import\s+url|\b(?:fetch|XMLHttpRequest|WebSocket|EventSource|sendBeacon)\s*\(|\bimport\s*\(/i.test(html)) return null;
      return { filePath: realFile, html };
    } catch {
      return null;
    }
  }

  /** Reload the exact matched file and re-check its recorded digest immediately before bundling. */
  loadRuntimeArtifact(result: MatchResult): string | null {
    const artifact = result.runtime_artifact;
    if (!artifact?.local_verified || artifact.media_type !== 'text/html') return null;
    return this.resolveLocalResource(artifact.source_path, artifact.source_sha256)?.html || null;
  }
  /**
   * Evaluates Capability Request against Tier 1 (Certified Components), Tier 2 (Foundations), Tier 3 (Synthesis).
   */
  resolveExperience(request: CapabilityRequest): MatchResult {
    const offlineRequired = request.offline_required !== false;

    let registryData: any = { foundations: [], components: [] };
    if (!fs.existsSync(this.registryPath)) {
      return {
        tier: 3,
        status: 'UNKNOWN',
        reason: 'Authoritative experience registry is missing; reusable capability evidence cannot be evaluated',
      };
    }
    {
      try {
        registryData = JSON.parse(fs.readFileSync(this.registryPath, 'utf-8'));
      } catch (e) {
        return {
          tier: 3,
          status: 'UNKNOWN',
          reason: 'Could not read authoritative experience registry JSON',
        };
      }
    }

    // =========================================================================
    // TIER 1: Certified Component Match (status == "CERTIFIED")
    // =========================================================================
    const certifiedComponents = (registryData.components || []).filter((c: any) => this.hasVerifiableCertification(c));

    for (const comp of certifiedComponents) {
      // Check offline requirement
      if (offlineRequired && comp.runtime?.offline === false) continue;
      // Check license block
      if (comp.license?.license_status === 'BLOCKED') continue;
      // Check mechanics overlap
      const compMechanics: string[] = comp.capability_contract?.mechanics || comp.mechanic_tags || [];
      const hasMechanicOverlap = request.mechanics.some((m) => compMechanics.includes(m));

      // Check subject/grade applicability
      const compSubjects: string[] = comp.applicability?.subjects || [];
      const compClasses: number[] = comp.applicability?.classes || [];
      const matchSubject = compSubjects.length === 0 || compSubjects.some((s) => s.toLowerCase() === request.subject.toLowerCase() || s === 'General');
      const matchClass = compClasses.length === 0 || compClasses.includes(request.grade);

      if (hasMechanicOverlap && matchSubject && matchClass) {
        return {
          tier: 1,
          status: 'MATCH_FOUND',
          reuse_class: 'CERTIFIED_COMPONENT',
          runtime_verified: true,
          component_id: comp.component_id,
          version: comp.version,
          capability_match: comp.capability_contract,
          provenance: comp.provenance,
          license: comp.license,
          reason: `Tier 1 Match: Certified component '${comp.component_id}@${comp.version}' matches capabilities [${request.mechanics.join(', ')}]`,
        };
      }
    }

    // =========================================================================
    // TIER 2: Locally verifiable approved artifacts remain adaptation candidates.
    // Registry status, source hash, license metadata, and offline shape are checked;
    // browser certification is deliberately not inferred here.
    // =========================================================================
    for (const component of registryData.components || []) {
      if (component.status !== 'APPROVED') continue;
      if (offlineRequired && component.runtime?.offline !== true) continue;
      if (offlineRequired && (!Array.isArray(component.runtime?.external_urls) || component.runtime.external_urls.length > 0)) continue;
      if (component.license?.license_status !== 'APPROVED') continue;
      const componentMechanics: string[] = component.capability_contract?.mechanics || component.mechanic_tags || [];
      const hasMechanicOverlap = request.mechanics.length > 0 && request.mechanics.some((m) => componentMechanics.includes(m));
      const componentSubjects: string[] = component.applicability?.subjects || [];
      const componentClasses: number[] = component.applicability?.classes || [];
      const matchSubject = componentSubjects.length === 0 || componentSubjects.some((s) => s.toLowerCase() === request.subject.toLowerCase() || s === 'General');
      const matchClass = componentClasses.length === 0 || componentClasses.includes(request.grade);
      const sourcePath = component.adapter?.source_path;
      const sourceHash = component.provenance?.source_hash;
      if (!hasMechanicOverlap || !matchSubject || !matchClass || typeof sourcePath !== 'string' || typeof sourceHash !== 'string') continue;
      const localResource = this.resolveLocalResource(sourcePath, sourceHash);
      if (!localResource) continue;
      return {
        tier: 2,
        status: 'MATCH_FOUND',
        reuse_class: 'ADAPTATION_CANDIDATE',
        runtime_verified: false,
        component_id: component.component_id,
        version: component.version,
        capability_match: component.capability_contract,
        provenance: component.provenance,
        license: component.license,
        runtime_artifact: {
          resource_id: component.component_id,
          source_path: sourcePath,
          source_sha256: sourceHash,
          media_type: 'text/html',
          local_verified: true,
          browser_verified: false,
          language: component.language || 'en',
        },
        reason: `Tier 2 adaptation candidate: '${component.component_id}@${component.version}' has a local source hash and offline/license metadata match; browser certification is still required`,
      };
    }

    // =========================================================================
    // TIER 2: Foundation adaptation candidate (catalog metadata is not certification)
    // =========================================================================
    const foundations = registryData.foundations || [];
    for (const f of foundations) {
      // Check license safety
      const licenseStr = (f.license || '').toLowerCase();
      if (licenseStr.includes('unknown') || f.license_status === 'BLOCKED') {
        // License unknown -> BLOCKED
        continue;
      }

      const fSubjects: string[] = f.subjects || [];
      const fClasses: number[] = f.classes || [];
      const fMechanics: string[] = f.mechanics || [];

      const matchSub = fSubjects.some((s) => s.toLowerCase() === request.subject.toLowerCase() || s === 'General');
      const matchCls = fClasses.includes(request.grade);
      const matchMech = request.mechanics.length > 0 && request.mechanics.some((m) => fMechanics.includes(m));

      if (matchSub && matchCls && matchMech) {
        const isCopyleftGpl = licenseStr.includes('gpl');
        const reuseStrategy = isCopyleftGpl ? 'EXTRACT' : (f.reuse_strategy || 'EXTRACT');

        return {
          tier: 2,
          status: 'MATCH_FOUND',
          reuse_class: 'ADAPTATION_CANDIDATE',
          runtime_verified: false,
          foundation_id: f.id,
          capability_match: {
            mechanics: f.mechanics,
            reuse_strategy: reuseStrategy,
            cleanroom_enforced: isCopyleftGpl,
          },
          provenance: { repo: f.repo, license: f.license, source_revision: f.source_revision || null },
          license: {
            spdx_identifier: f.license,
            license_status: f.license_status || (isCopyleftGpl ? 'GPL_3.0_ISOLATED' : 'REVIEW_REQUIRED'),
            isolation_strategy: isCopyleftGpl ? 'CLEANROOM_EXTRACT_ONLY' : 'PERMISSIVE_WRAP'
          },
          reason: isCopyleftGpl
            ? `Tier 2 candidate: '${f.name}' has copyleft license (${f.license}). Strict EXTRACT cleanroom strategy enforced: adapting mathematical models and parameters into <aasha-sim> adapters; direct source code embedding is prohibited to prevent copyleft contagion.`
            : `Tier 2 candidate: '${f.name}' advertises a relevant mechanic; artifact, license, offline, and compatibility evidence must be reviewed before adaptation or bundling`,
        };
      }
    }

    // =========================================================================
    // TIER 3: Fresh AASHA-Native Synthesis Fallback
    // =========================================================================
    return {
      tier: 3,
      status: 'NO_MATCH',
      reason: `No Tier 1 or Tier 2 match found. Falling back to Tier 3 fresh AASHA-native synthesis. Component will start as CANDIDATE.`,
    };
  }
}

