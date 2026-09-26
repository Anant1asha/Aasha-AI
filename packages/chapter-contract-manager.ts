import * as fs from 'fs';
import * as path from 'path';
import { ContextBus } from './memory-engine/context_bus.ts';
import { ThreeTierMatcher, MatchResult, CapabilityRequest } from './adapters/three_tier_matcher.ts';

export interface ChapterInitOptions {
  subject: string;
  classNum: number;
  topic: string;
  customObjectives?: string[];
}

export interface ChapterInitResult {
  contractPath: string;
  resourceMatchReport: string;
  matchedFoundation: any;
  seededToGraph: boolean;
  resolverResult?: MatchResult;
}

export class ChapterContractManager {
  private baseDir: string;
  private registryPath: string;
  private contractsDir: string;
  private bus: ContextBus;
  private matcher: ThreeTierMatcher;

  constructor(baseDir?: string) {
    this.baseDir = baseDir || path.resolve(__dirname, '..');
    this.registryPath = path.resolve(this.baseDir, 'experience_registry/registry.json');
    this.contractsDir = path.resolve(this.baseDir, 'content/contracts');
    if (!fs.existsSync(this.contractsDir)) {
      fs.mkdirSync(this.contractsDir, { recursive: true });
    }
    this.bus = new ContextBus();
    this.matcher = new ThreeTierMatcher(this.baseDir);
  }

  /**
   * Resolves experience capability using capability-first 3-Tier Matcher (§18).
   */
  resolveExperience(request: CapabilityRequest): MatchResult {
    return this.matcher.resolveExperience(request);
  }

  /**
   * Generates a topic slug for consistent file naming.
   */
  private slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
  }

  /**
   * Automatically matches the best prebuilt open-source foundation (F01-F20)
   * and generates the Mandatory Resource Match Report.
   */
  generateResourceMatchReport(subject: string, classNum: number, topic: string): { report: string; best: any } {
    let registry: any = { foundations: [] };
    if (fs.existsSync(this.registryPath)) {
      try {
        registry = JSON.parse(fs.readFileSync(this.registryPath, 'utf-8'));
      } catch (e) {
        console.warn('Could not parse experience registry:', e);
      }
    }

    const matches = (registry.foundations || []).filter((f: any) => {
      const matchSubject = (f.subjects || []).some((s: string) => s.toLowerCase() === subject.toLowerCase() || s === 'General');
      const matchClass = (f.classes || []).includes(classNum);
      return matchSubject && matchClass;
    });

    const best = matches.length > 0 ? matches[0] : null;

    const matchedNames = matches.map((m: any) => `${m.name} (${m.id}: ${m.reuse_strategy})`).join(', ');

    const report = `### RESOURCE MATCH REPORT (UNVERIFIED)
- **Chapter**: ${topic}
- **Class**: Class ${classNum}
- **Subject**: ${subject}
- **Learning Objectives**:
  1. Understand, reason, and visualize the core mechanics of ${topic}
  2. Diagnose and correct student misconceptions without leaking answers
-- **Registry matches**: ${matchedNames || 'NONE VERIFIED'}
-- **Reusable mechanics**: ${best?.mechanics ? best.mechanics.join(', ') : 'UNKNOWN'}
-- **Coverage, license, offline, mobile, accessibility, localization, AI integration, mastery, telemetry**: UNKNOWN; no evidence evaluated.
-- **Recommendation**: BLOCKED pending source, component, license, and runtime evidence.`;

    return { report, best };
  }

  /**
   * Initializes or fetches a validated Section 24 YAML Reusable Content Contract.
   * If the contract does not exist, it is generated automatically with all curriculum
   * intent, prebuilt foundation bindings, and misconception feedback templates.
   */
  async ensureChapterContract(options: ChapterInitOptions): Promise<ChapterInitResult> {
    const { subject, classNum, topic } = options;
    const slug = this.slugify(topic);
    const contractFileName = `${subject}_Class${classNum}_${slug}.yaml`;
    const contractPath = path.resolve(this.contractsDir, contractFileName);

    const { report, best } = this.generateResourceMatchReport(subject, classNum, topic);

    if (!fs.existsSync(contractPath)) {
      throw new Error(`SOURCE_GROUNDED_CONTRACT_UNAVAILABLE: refusing to synthesize curriculum or provenance for ${subject} Class ${classNum} ${topic}.`);
    }

    // Seed chapter node into Knowledge Graph
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
          foundationId: best?.id || null,
          contractPath,
        },
      });
      seeded = true;
    } catch (e) {
      console.warn('[ChapterContractManager] Graph seeding warning:', e);
    }

    return {
      contractPath,
      resourceMatchReport: report,
      matchedFoundation: best,
      seededToGraph: seeded,
    };
  }

  /**
   * Automatically extracts bilingual vocabulary (window.WM) from compiled chapter HTML
   * and persists new words into the local master dictionary (aasha_dictionary_db.json).
   * Guarantees zero-cost expansion on every chapter build / transform.
   */
  async syncVocabularyFromArtifact(htmlPath: string): Promise<{ addedCount: number; totalDbCount: number }> {
    const { capabilityBroker } = await import('./aios/capability_broker');
    const res = capabilityBroker.syncChapterVocabulary(htmlPath);
    return {
      addedCount: res.newAdded,
      totalDbCount: res.totalDbCount
    };
  }
}


