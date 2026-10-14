import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { ContextBus } from '../memory-engine/context_bus.ts';
import { type SignedApproval, verifyApproval, verifyTrustedSignature } from '../aios/trust_authority.ts';

export type GateStatus = 'PASS' | 'FAIL' | 'NOT_APPLICABLE' | 'UNKNOWN';

export interface MandatoryGateResults {
  FUNCTIONAL: GateStatus;
  CAPABILITY_CONTRACT: GateStatus;
  BROWSER_RUNTIME: GateStatus;
  OFFLINE: GateStatus;
  PROVENANCE: GateStatus;
  LICENSE: GateStatus;
  ACCESSIBILITY: GateStatus;
  PERFORMANCE: GateStatus;
  SECURITY_CHILD_SAFETY: GateStatus;
  MAINTAINABILITY: GateStatus;
  AASHA_INTEGRATION: GateStatus;
}

export interface ComponentMetadata {
  component_id: string;
  version: string;
  status: 'ABSENT' | 'CANDIDATE' | 'VERIFIED' | 'CERTIFIED' | 'DEPRECATED' | 'BLOCKED';
  capability_contract: {
    capability_id: string;
    mechanics: string[];
    inputs: string[];
    outputs: string[];
    state: string[];
    interaction_model: string;
  };
  mechanic_tags: string[];
  applicability: {
    subjects: string[];
    classes: number[];
    boards: string[];
  };
  dependencies: string[];
  runtime: {
    offline: boolean | 'UNKNOWN';
    external_urls: string[];
  };
  provenance: {
    source_type: string;
    origin_repo_or_pdf_hash: string;
    author_or_pipeline_version: string;
  };
  license: {
    spdx_identifier: string;
    isolation_strategy: 'MIT_NATIVE' | 'APACHE_2.0' | 'SHADOW_DOM_ENCAPSULATION' | 'GPL_3.0_ISOLATED' | 'CLEAN_ROOM_REIMPLEMENTATION' | 'UNKNOWN';
    license_status: 'APPROVED' | 'REVIEW_REQUIRED' | 'BLOCKED' | 'UNKNOWN';
  };
  verification: {
    gates_passed: string[];
    benchmark_evidence_hash: string;
    verified_at: string;
    approval_decision_id?: string;
    reviewer_id?: string;
  };
  artifact_hash: string;
  lineage: {
    previous_version?: string;
    previous_hash?: string;
    change_reason?: string;
  };
  component_code?: string;
}

export class RegistryIngestionEngine {
  private baseDir: string;
  private registryPath: string;
  private candidatesDir: string;
  private componentsDir: string;
  private evidenceDir: string;

  constructor(baseDir?: string) {
    this.baseDir = baseDir || (typeof __dirname !== 'undefined' ? path.resolve(__dirname, '../..') : process.cwd());
    this.registryPath = path.resolve(this.baseDir, 'experience_registry/registry.json');
    this.candidatesDir = path.resolve(this.baseDir, 'experience_registry/candidates');
    this.componentsDir = path.resolve(this.baseDir, 'experience_registry/components');
    this.evidenceDir = path.resolve(this.baseDir, 'experience_registry/evidence');

    [this.candidatesDir, this.componentsDir, this.evidenceDir].forEach((dir) => {
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    });
  }

  /**
   * Calculates SHA-256 hex digest of file or string content.
   */
  hashArtifact(contentOrPath: string): string {
    const data = fs.existsSync(contentOrPath) ? fs.readFileSync(contentOrPath) : Buffer.from(contentOrPath, 'utf-8');
    return crypto.createHash('sha256').update(data).digest('hex');
  }
  /**
   * Stages a component as CANDIDATE state in experience_registry/candidates/
   */
  stageCandidate(candidate: Partial<ComponentMetadata>): string {
    const id = candidate.component_id || `comp_${Date.now()}`;
    const version = candidate.version || '1.0.0';
    const code = candidate.component_code || '';
    const hash = this.hashArtifact(code || JSON.stringify(candidate));

    const fullCandidate: ComponentMetadata = {
      component_id: id,
      version: version,
      status: 'CANDIDATE',
      capability_contract: candidate.capability_contract || {
        capability_id: 'UNKNOWN',
        mechanics: candidate.mechanic_tags || [],
        inputs: [],
        outputs: [],
        state: [],
        interaction_model: 'UNKNOWN',
      },
      mechanic_tags: candidate.mechanic_tags || [],
      applicability: candidate.applicability || {
        subjects: [],
        classes: [],
        boards: [],
      },
      dependencies: candidate.dependencies || ['UNKNOWN'],
      runtime: candidate.runtime || {
        offline: 'UNKNOWN',
        external_urls: ['UNKNOWN'],
      },
      provenance: candidate.provenance || {
        source_type: 'UNKNOWN',
        origin_repo_or_pdf_hash: 'UNKNOWN',
        author_or_pipeline_version: 'UNKNOWN',
      },
      license: candidate.license || {
        spdx_identifier: 'UNKNOWN',
        isolation_strategy: 'UNKNOWN',
        license_status: 'UNKNOWN',
      },
      verification: {
        gates_passed: [],
        benchmark_evidence_hash: '',
        verified_at: new Date().toISOString(),
      },
      artifact_hash: hash,
      lineage: candidate.lineage || {},
      component_code: code,
    };

    const targetPath = path.resolve(this.candidatesDir, `${id}_v${version}.json`);
    fs.writeFileSync(targetPath, JSON.stringify(fullCandidate, null, 2), 'utf-8');
    return targetPath;
  }

  /**
   * Evaluates all 11 mandatory gates for promotion.
   * UNKNOWN is NOT PASS. If any gate is FAIL or UNKNOWN -> BLOCKED.
   */
  validateCandidate(candidateData: ComponentMetadata, signedGateResults?: any[]): { allowed: boolean; gates: MandatoryGateResults; reason: string } {
    const evidence = new Map((signedGateResults || []).map(g => [g.gate_id, g.status]));
    const code = candidateData.component_code || '';
    const actualHash = crypto.createHash('sha256').update(code).digest('hex');
    const hasExternalUrls = /https?:\/\//i.test(code);
    const provenance = candidateData.provenance;
    const provenanceValues = provenance ? Object.values(provenance) : [];
    const provenanceMissing = provenanceValues.length === 0 || provenanceValues.some(value => !value || /^(unknown|unspecified|n\/a)$/i.test(value));
    const provenanceHash = provenance?.origin_repo_or_pdf_hash || '';
    const validProvenance = /^[a-f0-9]{64}$/i.test(provenanceHash) && !/mock|synthetic|unspecified/i.test(provenanceHash);
    const license = candidateData.license;
    const licenseMissing = !license || !license.spdx_identifier || license.spdx_identifier === 'UNKNOWN' || license.isolation_strategy === 'UNKNOWN' || license.license_status === 'UNKNOWN';
    const runtime = candidateData.runtime;
    const runtimeMissing = !runtime || typeof runtime.offline !== 'boolean' || !Array.isArray(runtime.external_urls) || runtime.external_urls.includes('UNKNOWN');
    const capability = candidateData.capability_contract;
    const capabilityMissing = !capability || !capability.capability_id || capability.capability_id === 'UNKNOWN' || !capability.mechanics?.length;
    const gate = (id: string): GateStatus => evidence.get(id) === 'PASS' ? 'PASS' : evidence.get(id) === 'FAIL' ? 'FAIL' : 'UNKNOWN';
    const gates: MandatoryGateResults = {
      FUNCTIONAL: !candidateData.component_code ? 'UNKNOWN' : actualHash === candidateData.artifact_hash ? gate('FUNCTIONAL') : 'FAIL',
      CAPABILITY_CONTRACT: capabilityMissing ? 'UNKNOWN' : gate('CAPABILITY_CONTRACT'),
      BROWSER_RUNTIME: gate('BROWSER_RUNTIME'),
      OFFLINE: hasExternalUrls || runtime?.offline === false ? 'FAIL' : runtimeMissing ? 'UNKNOWN' : gate('OFFLINE'),
      PROVENANCE: provenanceMissing ? 'UNKNOWN' : validProvenance ? gate('PROVENANCE') : 'FAIL',
      LICENSE: license?.license_status === 'BLOCKED' ? 'FAIL' : licenseMissing || license?.license_status === 'REVIEW_REQUIRED' ? 'UNKNOWN' : license?.license_status === 'APPROVED' ? gate('LICENSE') : 'UNKNOWN',
      ACCESSIBILITY: gate('ACCESSIBILITY'),
      PERFORMANCE: gate('PERFORMANCE'),
      SECURITY_CHILD_SAFETY: gate('SECURITY_CHILD_SAFETY'),
      MAINTAINABILITY: gate('MAINTAINABILITY'),
      AASHA_INTEGRATION: gate('AASHA_INTEGRATION'),
    };
    const failures = Object.entries(gates).filter(([, status]) => status !== 'PASS');
    if (failures.length) return { allowed: false, gates, reason: `Promotion BLOCKED: ${failures.map(([id, status]) => `${id}=${status}`).join(', ')}` };
    return { allowed: true, gates, reason: 'Signed component evidence and mandatory gates verified.' };
  }
  /**
   * Promotes candidate to CERTIFIED status, atomically updating registry.json,
   * writing component code file, and indexing Knowledge Graph.
   */
  promoteCandidate(candidateId: string, certificationEvidencePath: string, approval: SignedApproval): { success: boolean; componentId: string; version: string; reason: string } {
    const block = (version: string, reason: string) => ({ success: false, componentId: candidateId, version, reason });
    const candidateFile = fs.readdirSync(this.candidatesDir).find(f => f.startsWith(`${candidateId}_v`));
    if (!candidateFile) return block('', `Candidate '${candidateId}' not found.`);
    const candidatePath = path.resolve(this.candidatesDir, candidateFile);
    const candidate: ComponentMetadata = JSON.parse(fs.readFileSync(candidatePath, 'utf-8'));
    if (candidate.status !== 'CANDIDATE') return block(candidate.version, 'Promotion BLOCKED: candidate status is not CANDIDATE.');
    if (!certificationEvidencePath || !fs.existsSync(certificationEvidencePath) || !fs.statSync(certificationEvidencePath).isFile()) return block(candidate.version, 'Promotion BLOCKED: signed component evidence file is missing.');
    let attestation: any;
    try { attestation = JSON.parse(fs.readFileSync(certificationEvidencePath, 'utf-8')); } catch { return block(candidate.version, 'Promotion BLOCKED: evidence file is invalid JSON.'); }
    if (attestation.schema_version !== '1.0' || attestation.verdict !== 'PASS' || attestation.component_id !== candidate.component_id || attestation.version !== candidate.version || attestation.artifact_hash !== candidate.artifact_hash) return block(candidate.version, 'Promotion BLOCKED: evidence is not bound to this component version and hash.');
    const signature = verifyTrustedSignature(attestation, 'CERTIFIER');
    if (!signature.valid) return block(candidate.version, `Promotion BLOCKED: ${signature.reason}`);
    const mandatory = ['FUNCTIONAL','CAPABILITY_CONTRACT','BROWSER_RUNTIME','OFFLINE','PROVENANCE','LICENSE','ACCESSIBILITY','PERFORMANCE','SECURITY_CHILD_SAFETY','MAINTAINABILITY','AASHA_INTEGRATION'];
    const seen = new Set<string>();
    const evidenceRoot = path.dirname(path.resolve(certificationEvidencePath));
    for (const result of attestation.gate_results || []) {
      if (seen.has(result.gate_id) || result.status !== 'PASS' || result.artifact_hash !== candidate.artifact_hash || !result.method || !result.environment || !Number.isFinite(Date.parse(result.timestamp)) || !Array.isArray(result.evidence_refs) || result.evidence_refs.length === 0) return block(candidate.version, 'Promotion BLOCKED: malformed or non-passing gate evidence.');
      seen.add(result.gate_id);
      for (const ref of result.evidence_refs) {
        if (!/^[a-f0-9]{64}$/.test(ref.sha256 || '')) return block(candidate.version, 'Promotion BLOCKED: invalid evidence digest.');
        const full = path.resolve(evidenceRoot, ref.path || '');
        const rel = path.relative(evidenceRoot, full);
        if (rel.startsWith('..') || path.isAbsolute(rel) || !fs.existsSync(full) || !fs.statSync(full).isFile() || this.hashArtifact(full) !== ref.sha256) return block(candidate.version, `Promotion BLOCKED: evidence missing, unsafe, or hash-mismatched: ${ref.path}`);
      }
    }
    if (mandatory.some(id => !seen.has(id)) || seen.size !== mandatory.length) return block(candidate.version, 'Promotion BLOCKED: mandatory gates are missing or unrecognized.');
    const hil = verifyApproval(approval, { action: 'CERTIFY', artifactId: candidate.component_id, artifactHash: candidate.artifact_hash, version: candidate.version });
    if (!hil.valid) return block(candidate.version, 'Promotion BLOCKED: authenticated HIL required (' + hil.reason + ').');
    const gateEval = this.validateCandidate(candidate, attestation.gate_results);
    if (!gateEval.allowed) return block(candidate.version, gateEval.reason);
    let registryData: any = { foundations: [], components: [] };
    if (fs.existsSync(this.registryPath)) registryData = JSON.parse(fs.readFileSync(this.registryPath, 'utf-8'));
    if ((registryData.components || []).some((c: any) => c.component_id === candidate.component_id && c.version === candidate.version)) return block(candidate.version, 'Conflict: component version already registered; immutable versions cannot be overwritten.');
    candidate.status = 'CERTIFIED';
    candidate.verification = { gates_passed: mandatory, benchmark_evidence_hash: this.hashArtifact(certificationEvidencePath), verified_at: attestation.issued_at, approval_decision_id: approval.decision_id, reviewer_id: approval.reviewer_id };
    const compCodePath = path.resolve(this.componentsDir, `${candidate.component_id}_v${candidate.version}.ts`);
    fs.writeFileSync(compCodePath, candidate.component_code || '', 'utf-8');
    const evidencePath = path.resolve(this.evidenceDir, `${candidate.component_id}_evidence.json`);
    fs.writeFileSync(evidencePath, JSON.stringify({ attestation, approval }, null, 2), 'utf-8');
    const { component_code, ...cleanEntry } = candidate;
    registryData.components ||= [];
    registryData.components.push(cleanEntry);
    fs.writeFileSync(this.registryPath, JSON.stringify(registryData, null, 2), 'utf-8');
    try { new ContextBus().getMemory().addMemory({ agentRole: 'QAAgent', category: 'experience', content: 'Certified AASHA component', metadata: cleanEntry }); }
    catch (graphError) { console.warn('[RegistryIngestionEngine] Knowledge graph indexing warning:', graphError); }
    return { success: true, componentId: candidate.component_id, version: candidate.version, reason: `Component '${candidate.component_id}@${candidate.version}' promoted from verified signed evidence.` };
  }
}










