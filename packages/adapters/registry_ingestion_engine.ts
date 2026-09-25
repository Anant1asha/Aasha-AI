import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { ContextBus } from '../memory-engine/context_bus';

export type ExperienceStatus = 'CANDIDATE' | 'VERIFIED' | 'CERTIFIED' | 'BLOCKED' | 'DEPRECATED';

export interface ExperienceCandidate {
  component_id: string;
  version: string;
  status: ExperienceStatus;
  capability_contract: Record<string, unknown>;
  mechanic_tags: string[];
  subjects?: string[];
  classes?: number[];
  dependencies: Array<Record<string, unknown>>;
  runtime: {
    offline_compatible: boolean;
    external_urls: string[];
    minimum_ram_gb?: number;
  };
  provenance: Array<Record<string, unknown>>;
  license: {
    classification: 'PERMISSIVE' | 'COPYLEFT' | 'PROPRIETARY' | 'LICENSE_REVIEW_REQUIRED' | 'UNKNOWN';
    isolation_mode: 'NATIVE' | 'ADAPTER' | 'SANDBOX' | 'IFRAME' | 'REFERENCE_ONLY' | 'BLOCKED';
    source_license?: string;
    review_reference?: string;
  };
  verification: {
    component_gates: Record<string, 'PASS' | 'FAIL' | 'UNKNOWN' | 'NOT_APPLICABLE'>;
    evidence_refs: string[];
    chapter_ltruth?: number | null;
    console_errors?: number | null;
  };
  artifact_hash: string;
  lineage: Record<string, unknown>;
}

export interface RegisterComponentInput {
  metadata: Omit<ExperienceCandidate, 'status' | 'artifact_hash'> & { status?: ExperienceStatus };
  componentCode: string;
  sourceKind?: 'AASHA_NATIVE' | 'OPEN_SOURCE' | 'DERIVED' | 'REFERENCE' | 'UNKNOWN';
}

export interface RegistryResolveRequest {
  mechanics?: string[];
  inputs?: string[];
  outputs?: string[];
  subject?: string;
  classNum?: number;
}

const stable = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === 'object') {
    return Object.keys(value as Record<string, unknown>).sort().reduce((o, k) => {
      o[k] = stable((value as Record<string, unknown>)[k]);
      return o;
    }, {} as Record<string, unknown>);
  }
  return value;
};

export class RegistryIngestionEngine {
  readonly root: string;
  readonly registryPath: string;
  readonly componentsDir: string;
  readonly candidatesDir: string;
  readonly evidenceDir: string;

  constructor(rootDir = path.resolve(__dirname, '../..')) {
    this.root = rootDir;
    this.registryPath = path.join(rootDir, 'experience_registry', 'registry.json');
    this.componentsDir = path.join(rootDir, 'experience_registry', 'components');
    this.candidatesDir = path.join(rootDir, 'experience_registry', 'candidates');
    this.evidenceDir = path.join(rootDir, 'experience_registry', 'evidence');
  }

  private ensureDirs() {
    for (const dir of [this.componentsDir, this.candidatesDir, this.evidenceDir]) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  static hashArtifact(componentCode: string): string {
    return 'sha256:' + crypto.createHash('sha256').update(componentCode, 'utf8').digest('hex');
  }

  private loadRegistry(): Record<string, unknown> {
    if (!fs.existsSync(this.registryPath)) throw new Error('REGISTRY_MISSING');
    const parsed = JSON.parse(fs.readFileSync(this.registryPath, 'utf8'));
    if (!Array.isArray(parsed.foundations)) parsed.foundations = [];
    if (!Array.isArray(parsed.experiences)) parsed.experiences = [];
    parsed.registry_policy ??= {
      schema_version: '2.0.0',
      chapter_certification_implies_component_certification: false,
      unknown_license_blocks_promotion: true,
      shadow_dom_is_not_license_isolation: true,
      resolver_order: ['TIER_1_REGISTERED', 'TIER_2_APPROVED_FOUNDATION', 'TIER_3_DOMAIN_SYNTHESIS']
    };
    return parsed;
  }

  /** Fallback only: derive candidate source from compiled HTML. Never treats HTML as canonical. */
  stageDerivedFromHtml(
    metadata: Omit<ExperienceCandidate, 'status' | 'artifact_hash' | 'provenance'>,
    html: string
  ): ExperienceCandidate {
    const scripts = [...html.matchAll(/<script(?:[^>]*)>([\\s\\S]*?)<\\/script>/gi)].map(m => m[1]);
    const customElementBlock = scripts.find(s => /customElements\.define\(['\"]aasha-sim/.test(s)) || scripts.join('\n');
    if (!customElementBlock.trim()) throw new Error('DERIVED_SOURCE_NOT_FOUND');
    return this.stageCandidate({
      metadata: {
        ...metadata,
        status: 'CANDIDATE',
        provenance: [{
          source_type: 'DERIVED',
          reference: 'compiled-html',
          evidence: ['fallback extraction only; source review required']
        }]
      },
      componentCode: customElementBlock,
      sourceKind: 'DERIVED'
    });
  }

  stageCandidate(input: RegisterComponentInput): ExperienceCandidate {
    this.ensureDirs();
    const metadata = { ...input.metadata, status: input.metadata.status ?? 'CANDIDATE' } as ExperienceCandidate;
    metadata.artifact_hash = RegistryIngestionEngine.hashArtifact(input.componentCode);

    const filename = metadata.component_id.replace(/^exp\./, '').replace(/[^a-zA-Z0-9._-]/g, '_');
    fs.writeFileSync(path.join(this.candidatesDir, filename + '.ts'), input.componentCode, 'utf8');
    fs.writeFileSync(
      path.join(this.evidenceDir, filename + '.candidate.json'),
      JSON.stringify(stable(metadata), null, 2) + '\n',
      'utf8'
    );
    return metadata;
  }

  validateCandidate(candidate: ExperienceCandidate): { valid: boolean; blockers: string[] } {
    const blockers: string[] = [];
    const gates = candidate.verification.component_gates || {};
    for (const required of ['functional','capability_contract','browser_runtime','offline','provenance','license','accessibility','performance','security_child_safety','maintainability','aasha_integration']) {
      if (gates[required] !== 'PASS' && gates[required] !== 'NOT_APPLICABLE') blockers.push(required);
    }
    if (!candidate.runtime.offline_compatible) blockers.push('offline_compatible');
    if (candidate.runtime.external_urls.length > 0) blockers.push('external_urls');
    if (candidate.license.classification === 'LICENSE_REVIEW_REQUIRED' || candidate.license.classification === 'UNKNOWN') blockers.push('license_review');
    if (candidate.license.isolation_mode === 'BLOCKED' || candidate.license.isolation_mode === 'REFERENCE_ONLY') blockers.push('license_isolation');
    if (!/^sha256:[a-f0-9]{64}$/.test(candidate.artifact_hash)) blockers.push('artifact_hash');
    return { valid: blockers.length === 0, blockers };
  }

  private async seedGraph(candidate: ExperienceCandidate): Promise<void> {
    const bus = new ContextBus();
    const graph = bus.getGraph();
    const nodeId = `experience_${candidate.component_id}`;
    await graph.addNode({
      id: nodeId,
      label: 'CertifiedExperience',
      properties: {
        componentId: candidate.component_id,
        version: candidate.version,
        mechanics: candidate.mechanic_tags,
        artifactHash: candidate.artifact_hash,
        status: candidate.status
      }
    });
    for (const tag of candidate.mechanic_tags) {
      const capId = `capability_${tag}`;
      await graph.addNode({
        id: capId,
        label: 'ExperienceMechanic',
        properties: { mechanic: tag }
      });
      await graph.addEdge({
        id: `${nodeId}_IMPLEMENTS_${capId}`,
        source: nodeId,
        target: capId,
        relation: 'IMPLEMENTS_MECHANIC',
        properties: {}
      });
    }
  }

  promoteCandidate(candidate: ExperienceCandidate): { promoted: boolean; blockers: string[] } {
    const check = this.validateCandidate(candidate);
    if (!check.valid) return { promoted: false, blockers: check.blockers };

    const registry = this.loadRegistry();
    const experiences = registry.experiences as ExperienceCandidate[];
    const idx = experiences.findIndex(x => x.component_id === candidate.component_id && x.version === candidate.version);
    const certified = { ...candidate, status: 'CERTIFIED' as const };
    if (idx >= 0) experiences[idx] = certified; else experiences.push(certified);
    registry.experiences = experiences;
    registry.last_updated = new Date().toISOString().slice(0, 10);
    fs.writeFileSync(this.registryPath, JSON.stringify(stable(registry), null, 2) + '\n', 'utf8');

    const filename = candidate.component_id.replace(/^exp\./, '').replace(/[^a-zA-Z0-9._-]/g, '_');
    fs.writeFileSync(path.join(this.componentsDir, filename + '.ts'), fs.readFileSync(path.join(this.candidatesDir, filename + '.ts'), 'utf8'), 'utf8');
    return { promoted: true, blockers: [] };
  }

  resolve(request: RegistryResolveRequest): ExperienceCandidate[] {
    const registry = this.loadRegistry();
    const experiences = (registry.experiences as ExperienceCandidate[]).filter(e => e.status === 'CERTIFIED');
    const requiredMechanics = new Set(request.mechanics || []);
    const requiredInputs = new Set(request.inputs || []);
    const requiredOutputs = new Set(request.outputs || []);

    const score = (e: ExperienceCandidate) => {
      const mechanics = new Set(e.mechanic_tags || []);
      const inputs = new Set((e.capability_contract.inputs as string[]) || []);
      const outputs = new Set((e.capability_contract.outputs as string[]) || []);
      const mechanicHits = [...requiredMechanics].filter(x => mechanics.has(x)).length;
      const inputHits = [...requiredInputs].filter(x => inputs.has(x)).length;
      const outputHits = [...requiredOutputs].filter(x => outputs.has(x)).length;
      const subjectHit = request.subject ? (e.subjects || []).some(s => s.toLowerCase() === request.subject!.toLowerCase() || s === 'General') : true;
      const classHit = request.classNum ? (e.classes || []).includes(request.classNum) : true;
      if (!subjectHit || !classHit) return -1;
      return mechanicHits * 10 + inputHits * 4 + outputHits * 4;
    };

    return experiences
      .map(e => ({ e, score: score(e) }))
      .filter(x => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(x => x.e);
  }
}
