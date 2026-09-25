import * as fs from 'fs';
import * as path from 'path';
import { ContextBus } from './memory-engine/context_bus';
import { RegistryIngestionEngine } from './adapters/registry_ingestion_engine';

export interface ChapterInitOptions {
  subject: string;
  classNum: number;
  topic: string;
  customObjectives?: string[];
  mechanics?: string[];
}

export interface ChapterInitResult {
  contractPath: string;
  resourceMatchReport: string;
  matchedExperience: any | null;
  matchedFoundation: any | null;
  resolverTier: 'TIER_1_REGISTERED' | 'TIER_2_APPROVED_FOUNDATION' | 'TIER_3_DOMAIN_SYNTHESIS';
  seededToGraph: boolean;
}

export class ChapterContractManager {
  private baseDir: string;
  private registryPath: string;
  private contractsDir: string;
  private bus: ContextBus;
  private registryEngine: RegistryIngestionEngine;

  constructor(baseDir?: string) {
    this.baseDir = baseDir || path.resolve(__dirname, '..');
    this.registryPath = path.resolve(this.baseDir, 'experience_registry/registry.json');
    this.contractsDir = path.resolve(this.baseDir, 'content/contracts');
    if (!fs.existsSync(this.contractsDir)) fs.mkdirSync(this.contractsDir, { recursive: true });
    this.bus = new ContextBus();
    this.registryEngine = new RegistryIngestionEngine(this.baseDir);
  }

  private slugify(text: string): string {
    return text.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  }

  private loadRegistry(): any {
    if (!fs.existsSync(this.registryPath)) throw new Error('REGISTRY_MISSING');
    const registry = JSON.parse(fs.readFileSync(this.registryPath, 'utf-8'));
    registry.foundations ??= [];
    registry.experiences ??= [];
    return registry;
  }

  /**
   * Deterministic resolver:
   * Tier 1 = certified AASHA experience capability.
   * Tier 2 = approved foundation catalog.
   * Tier 3 = domain synthesis.
   *
   * Subject/class are applicability filters only; mechanic compatibility is primary.
   */
  resolveExperience(subject: string, classNum: number, topic: string, mechanics: string[] = []) {
    const registry = this.loadRegistry();
    const tier1 = this.registryEngine.resolve({
      mechanics,
      subject,
      classNum
    });

    if (tier1.length > 0) {
      return {
        tier: 'TIER_1_REGISTERED' as const,
        experience: tier1[0],
        foundation: null
      };
    }

    const foundations = (registry.foundations || []).filter((f: any) => {
      const subjectHit = (f.subjects || []).some((s: string) =>
        s.toLowerCase() === subject.toLowerCase() || s === 'General' || s === 'Cross-Curricular'
      );
      const classHit = !f.classes?.length || f.classes.includes(classNum);
      const mechanicHit = mechanics.length === 0 ||
        mechanics.some(m => (f.mechanics || []).some((fm: string) => fm.toLowerCase().includes(m.toLowerCase())));
      return subjectHit && classHit && mechanicHit;
    });

    if (foundations.length > 0) {
      return {
        tier: 'TIER_2_APPROVED_FOUNDATION' as const,
        experience: null,
        foundation: foundations[0]
      };
    }

    return {
      tier: 'TIER_3_DOMAIN_SYNTHESIS' as const,
      experience: null,
      foundation: null
    };
  }

  generateResourceMatchReport(
    subject: string,
    classNum: number,
    topic: string,
    mechanics: string[] = []
  ): { report: string; bestExperience: any | null; bestFoundation: any | null; tier: ChapterInitResult['resolverTier'] } {
    const resolved = this.resolveExperience(subject, classNum, topic, mechanics);
    const target = resolved.experience || resolved.foundation;

    const report = `### RESOURCE MATCH REPORT
- Chapter: ${topic}
- Class: Class ${classNum}
- Subject: ${subject}
- Resolver Tier: ${resolved.tier}
- Required Mechanics: ${mechanics.join(', ') || 'NOT_SPECIFIED'}
- Registered Certified Experience: ${resolved.experience?.component_id || 'NONE'}
- Approved Foundation: ${resolved.foundation?.id || 'NONE'}
- License Classification: ${resolved.experience?.license?.classification || resolved.foundation?.license || 'UNKNOWN'}
- Offline Status: ${resolved.experience?.runtime?.offline_compatible === true ? 'PASS' : 'UNKNOWN'}
- Provenance Evidence: ${resolved.experience?.provenance?.length ? 'PRESENT' : 'UNKNOWN'}
- Component Certification: ${resolved.experience?.status === 'CERTIFIED' ? 'CERTIFIED' : 'NOT_CERTIFIED'}
- New Synthesis Required: ${resolved.tier === 'TIER_3_DOMAIN_SYNTHESIS' ? 'YES' : 'NO'}
- Reuse Rule: Capability/mechanic contract compatibility is required.
- Safety Rule: Unknown provenance, dependency closure, or license status blocks component promotion.
- Certification Rule: Chapter certification does not certify a reusable component.
${target ? `- Selected Reuse Target: ${target.name || target.component_id || target.id}` : '- Selected Reuse Target: NONE'}
`;

    return {
      report,
      bestExperience: resolved.experience,
      bestFoundation: resolved.foundation,
      tier: resolved.tier
    };
  }

  async ensureChapterContract(options: ChapterInitOptions): Promise<ChapterInitResult> {
    const { subject, classNum, topic, customObjectives = [], mechanics = [] } = options;
    const slug = this.slugify(topic);
    const contractFileName = `${subject}_Class${classNum}_${slug}.yaml`;
    const contractPath = path.resolve(this.contractsDir, contractFileName);

    const match = this.generateResourceMatchReport(subject, classNum, topic, mechanics);
    const target = match.bestExperience || match.bestFoundation;

    if (!fs.existsSync(contractPath)) {
      const yamlContent = `# AASHA Section 24 Reusable Content Contract
# Deterministic resolver output. Unknowns remain UNKNOWN.
chapter_meta:
  subject: "${subject}"
  class: ${classNum}
  topic: "${topic}"
  slug: "${slug}"
  version: "1.1.0"
  created_at: "${new Date().toISOString()}"

resource_match:
  resolver_tier: "${match.tier}"
  target_id: "${target?.component_id || target?.id || 'NONE'}"
  target_name: "${target?.name || 'NONE'}"
  mechanics: [${mechanics.map(m => JSON.stringify(m)).join(', ')}]
  certification_required: true

curriculum_intent:
  objectives:
${(customObjectives.length ? customObjectives : [
  `Understand the core mechanics of ${topic}`,
  `Diagnose misconceptions without leaking answers`
]).map(o => `    - ${JSON.stringify(o)}`).join('\n')}

pedagogy_structure:
  golden_rule_stages:
    - WHAT
    - WHY
    - HOW
    - SHOW
    - TRY
    - FEEDBACK
    - CONNECT
    - NAME

simulation_adapter:
  contract_interface: "AashaExperienceContract"
  methods_required:
    - mount
    - getState
    - reset
    - destroy
  telemetry_is_separate_from_learning_state: true

governance:
  teacher_validation_when_required: true
  chapter_certification_implies_component_certification: false
  unknown_license_blocks_promotion: true
  shadow_dom_is_not_license_isolation: true
  offline_requires_local_dependency_closure: true
`;
      fs.writeFileSync(contractPath, yamlContent, 'utf-8');
    }

    let seeded = false;
    try {
      const graph = this.bus.getGraph();
      const nodeId = `chapter_${slug}`;
      await graph.addNode({
        id: nodeId,
        label: 'ChapterContract',
        properties: {
          subject,
          classNum,
          topic,
          resolverTier: match.tier,
          experienceId: match.bestExperience?.component_id || null,
          foundationId: match.bestFoundation?.id || null,
          contractPath
        }
      });

      if (match.bestExperience?.component_id) {
        await graph.addEdge({
          id: `${nodeId}_USES_${match.bestExperience.component_id}`,
          source: nodeId,
          target: `experience_${match.bestExperience.component_id}`,
          relation: 'REUSES_CERTIFIED_EXPERIENCE',
          properties: { resolverTier: match.tier }
        });
      } else if (match.bestFoundation?.id) {
        await graph.addEdge({
          id: `${nodeId}_USES_${match.bestFoundation.id}`,
          source: nodeId,
          target: `foundation_${match.bestFoundation.id}`,
          relation: 'ADAPTS_APPROVED_FOUNDATION',
          properties: { resolverTier: match.tier }
        });
      }

      seeded = true;
    } catch (e) {
      console.warn('[ChapterContractManager] Graph seeding warning:', e);
    }

    return {
      contractPath,
      resourceMatchReport: match.report,
      matchedExperience: match.bestExperience,
      matchedFoundation: match.bestFoundation,
      resolverTier: match.tier,
      seededToGraph: seeded
    };
  }
}
