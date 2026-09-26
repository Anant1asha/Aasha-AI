import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { SignedApproval, verifyApproval, verifyTrustedSignature } from '../aios/trust_authority.ts';

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
  component_id?: string;
  version?: string;
  foundation_id?: string;
  capability_match?: Record<string, any>;
  provenance?: Record<string, any>;
  license?: Record<string, any>;
  reason: string;
}

export class ThreeTierMatcher {
  private baseDir: string;
  private registryPath: string;

  constructor(baseDir?: string) {
    this.baseDir = baseDir || path.resolve(__dirname, '../..');
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
  /**
   * Evaluates Capability Request against Tier 1 (Certified Components), Tier 2 (Foundations), Tier 3 (Synthesis).
   */
  resolveExperience(request: CapabilityRequest): MatchResult {
    const offlineRequired = request.offline_required !== false;

    let registryData: any = { foundations: [], components: [] };
    if (fs.existsSync(this.registryPath)) {
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
    // TIER 2: Approved Foundation Match (F01–F20 Catalog)
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
      const matchMech = request.mechanics.some((m) => fMechanics.includes(m)) || fMechanics.length > 0;

      if (matchSub && matchCls && matchMech) {
        return {
          tier: 2,
          status: 'MATCH_FOUND',
          foundation_id: f.id,
          capability_match: { mechanics: f.mechanics, reuse_strategy: f.reuse_strategy },
          provenance: { repo: f.repo, license: f.license },
          license: { spdx_identifier: f.license, license_status: 'APPROVED' },
          reason: `Tier 2 Match: Approved open-source foundation '${f.name}' (${f.id}: ${f.reuse_strategy || 'EXTRACT'})`,
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

