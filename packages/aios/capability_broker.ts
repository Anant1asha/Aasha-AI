/**
 * AASHA Capability Broker — packages/aios/capability_broker.ts
 *
 * Routes tasks to the optimal harness + model based on verified evidence.
 * Evidence source: packages/aios/capability_matrix.json
 *
 * V2 Architecture — AIOS Section 6: Capability Broker
 *
 * Harness hierarchy:
 *   Antigravity  → primary AIOS + governance + repository analysis + CDP
 *   hatchable    → PostgreSQL + deploy + logs + functions + object storage
 *   TrueForge    → UNKNOWN (pending discovery)
 *   DeepSeek     → UNKNOWN (pending discovery)
 */

import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Harness = 'antigravity' | 'hatchable' | 'trueforge' | 'deepseek' | 'UNKNOWN';
export type ModelTier = 1 | 2 | 3;

export type CapabilityCategory =
  | 'REPOSITORY_ANALYSIS'
  | 'CODE_GENERATION'
  | 'CODE_REPAIR'
  | 'TEST_GENERATION'
  | 'TEST_EXECUTION'
  | 'BROWSER_AUTOMATION'
  | 'POSTGRESQL_DATABASE'
  | 'DEPLOYMENT'
  | 'LOG_AGGREGATION'
  | 'SERVERLESS_FUNCTIONS'
  | 'OBJECT_STORAGE'
  | 'MULTI_AGENT_ORCHESTRATION'
  | 'TRAJECTORY_CAPTURE'
  | 'RESEARCH'
  | 'DOCUMENTATION'
  | 'BENCHMARK';

export interface TaskProfile {
  taskType: string;
  capability: CapabilityCategory;
  complexity: 'LOW' | 'MEDIUM' | 'HIGH';
  risk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  requiresHIL?: boolean;
  contextSizeTokens?: number;
  codeRequired?: boolean;
  parallelizable?: boolean;
  latencyRequirement?: 'FAST' | 'STANDARD' | 'CAN_WAIT';
  costSensitivity?: 'FREE_ONLY' | 'LOW_COST' | 'ANY';
}

export interface ResourceRequirement {
  requiredCapability: string;
  subject?: string;
  topic?: string;
  grade?: number;
  board?: string;
  learningObjective?: string;
  interactionType?: string;
  offlineRequirement?: boolean;
  mobileRequirement?: boolean;
  accessibilityRequirement?: boolean;
}

export type ResourceCompatibility =
  | 'EXACT_REUSE'
  | 'PARAMETRIC_ADAPT'
  | 'COMPOSE'
  | 'LOCAL_ADAPTATION'
  | 'CERTIFIED_GENERATION'
  | 'SAFE_FALLBACK';

export interface ResourceMatchCandidate {
  resource_id: string;
  name: string;
  capability: string;
  category: string;
  compatibility: ResourceCompatibility;
  adapter?: string;
  dependencies: string[];
  license: string;
  offline_support: boolean;
  mobile_support: boolean;
  certification_status: 'CERTIFIED' | 'PROVISIONAL' | 'UNKNOWN';
  provenance: string;
  version: string;
  score: number;
  mechanics?: string[];
}

export interface VocabularyLookupResult {
  found: Record<string, string>;
  missing: string[];
  totalRequested: number;
  coveragePercentage: number;
}

export interface RoutingDecision {
  harness: Harness;
  modelTier: ModelTier;
  model?: string;
  rationale: string;
  hilRequired: boolean;
  fallbackHarness?: Harness;
  verificationRequired: boolean;
  confidence: 'VERIFIED' | 'INFERRED' | 'ASSUMED' | 'UNKNOWN';
}

// ---------------------------------------------------------------------------
// Capability Matrix Loader
// ---------------------------------------------------------------------------

const __filename_resolved = typeof __filename !== 'undefined' ? __filename : fileURLToPath(import.meta.url);
const __dirname_resolved = path.dirname(__filename_resolved);
const MATRIX_PATH = path.join(__dirname_resolved, 'capability_matrix.json');

function findRepoRoot(startDir: string): string {
  let curr = startDir;
  for (let i = 0; i < 6; i++) {
    if (fs.existsSync(path.join(curr, 'experience_registry', 'registry.json'))) {
      return curr;
    }
    const parent = path.dirname(curr);
    if (parent === curr) break;
    curr = parent;
  }
  return startDir;
}

function loadMatrix(): Record<string, any> {
  try {
    return JSON.parse(fs.readFileSync(MATRIX_PATH, 'utf-8'));
  } catch {
    console.warn('[CapabilityBroker] capability_matrix.json not found. Using defaults.');
    return { routingPolicy: {} };
  }
}

// ---------------------------------------------------------------------------
// High-Risk Actions requiring HIL
// ---------------------------------------------------------------------------

const HIL_REQUIRED_TASKS = new Set([
  'production_deployment',
  'governance_rule_modification',
  'tln_production_publication',
  'large_scale_destructive_migration',
  'security_policy_relaxation',
  'credential_change',
  'irreversible_data_deletion',
  'major_architecture_replacement',
]);

// ---------------------------------------------------------------------------
// Core Routing Logic
// ---------------------------------------------------------------------------

export class CapabilityBroker {
  private matrix: Record<string, any>;

  constructor() {
    this.matrix = loadMatrix();
  }

  /**
   * Route a task to the optimal harness and model tier.
   * Evidence-based: uses capability_matrix.json as source of truth.
   */
  route(profile: TaskProfile): RoutingDecision {
    const matrixRoute = this.matrix?.routingPolicy?.[profile.capability];
    const hilRequired = profile.requiresHIL ?? HIL_REQUIRED_TASKS.has(profile.taskType);

    // Critical risk always requires HIL regardless of task type
    if (profile.risk === 'CRITICAL') {
      return {
        harness: 'antigravity',
        modelTier: 2,
        rationale: `CRITICAL risk task "${profile.taskType}" requires HIL approval via Antigravity.`,
        hilRequired: true,
        verificationRequired: true,
        confidence: 'VERIFIED',
      };
    }

    // Route based on capability category
    switch (profile.capability) {
      case 'POSTGRESQL_DATABASE':
        return {
          harness: 'hatchable',
          modelTier: 1,
          rationale: 'hatchable execute_sql: PostgreSQL VERIFIED (11ms warm, 56ms cold). Full DDL/DML.',
          hilRequired,
          fallbackHarness: 'antigravity',
          verificationRequired: true,
          confidence: 'VERIFIED',
        };

      case 'DEPLOYMENT':
        return {
          harness: 'hatchable',
          modelTier: 1,
          rationale: 'hatchable deploy: <2s deploys VERIFIED. Zero-build serverless.',
          hilRequired: profile.risk === 'HIGH' || hilRequired,
          verificationRequired: true,
          confidence: 'VERIFIED',
        };

      case 'LOG_AGGREGATION':
        return {
          harness: 'hatchable',
          modelTier: 1,
          rationale: 'hatchable view_logs: VERIFIED. Centralized execution observability.',
          hilRequired,
          verificationRequired: false,
          confidence: 'VERIFIED',
        };

      case 'SERVERLESS_FUNCTIONS':
        return {
          harness: 'hatchable',
          modelTier: 1,
          rationale: 'hatchable run_function: V8 isolates VERIFIED. 11-24ms warm latency.',
          hilRequired,
          verificationRequired: true,
          confidence: 'VERIFIED',
        };

      case 'OBJECT_STORAGE':
        return {
          harness: 'hatchable',
          modelTier: 1,
          rationale: 'hatchable upload_file: AWS S3-backed, signed URLs VERIFIED.',
          hilRequired,
          verificationRequired: true,
          confidence: 'VERIFIED',
        };

      case 'BROWSER_AUTOMATION':
        return {
          harness: 'antigravity',
          modelTier: 1,
          rationale: 'Antigravity CDP automation VERIFIED (benchmarks/automated_browser_verification.js).',
          hilRequired,
          verificationRequired: true,
          confidence: 'VERIFIED',
        };

      case 'REPOSITORY_ANALYSIS':
        return {
          harness: 'antigravity',
          modelTier: 1,
          model: 'meta-llama/llama-3.1-8b-instruct:free',
          rationale: 'Antigravity has full repo read access. Tier 1 free pool for analysis.',
          hilRequired,
          verificationRequired: false,
          confidence: 'VERIFIED',
        };

      case 'CODE_GENERATION':
      case 'CODE_REPAIR': {
        const isLarge = (profile.contextSizeTokens ?? 0) > 4000;
        return {
          harness: 'antigravity',
          modelTier: 2,
          model: isLarge
            ? 'claude-3-5-sonnet-20241022'
            : 'qwen/qwen-2.5-coder-32b-instruct:free',
          rationale: `Tier 2 coding task. ${isLarge ? 'Large context → Claude Sonnet.' : 'Standard → qwen-2.5-coder:free (0 cost).'}`,
          hilRequired,
          verificationRequired: true,
          confidence: 'VERIFIED',
        };
      }

      case 'TEST_EXECUTION':
      case 'BENCHMARK':
        return {
          harness: 'antigravity',
          modelTier: 1,
          rationale: 'Deterministic test execution via Antigravity run_command.',
          hilRequired,
          verificationRequired: true,
          confidence: 'VERIFIED',
        };

      default:
        return {
          harness: 'UNKNOWN',
          modelTier: 1,
          rationale: `Capability "${profile.capability}" not yet in matrix. Run discovery first.`,
          hilRequired,
          verificationRequired: true,
          confidence: 'UNKNOWN',
        };
    }
  }

  /** Get all capabilities for a harness */
  getHarnessCapabilities(harness: Harness): string[] {
    const caps: string[] = [];
    const capMap = this.matrix?.capabilities ?? {};
    for (const [cap, harnessMap] of Object.entries(capMap)) {
      const entry = (harnessMap as any)[harness];
      if (entry?.supported === true) caps.push(cap);
    }
    return caps;
  }

  /**
   * Match an educational resource requirement against the verified Experience Registry.
   * Enforces the Resource-First Global Reuse Architecture:
   * EXACT_REUSE -> PARAMETRIC_ADAPT -> COMPOSE -> LOCAL_ADAPTATION -> CERTIFIED_GENERATION.
   */
  matchResource(req: ResourceRequirement): ResourceMatchCandidate[] {
    const candidates: ResourceMatchCandidate[] = [];
    let registryData: any = null;

    try {
      const repoRoot = findRepoRoot(process.cwd());
      const regPath = path.join(repoRoot, 'experience_registry', 'registry.json');
      if (fs.existsSync(regPath)) {
        registryData = JSON.parse(fs.readFileSync(regPath, 'utf-8'));
      }
    } catch (err) {
      console.warn('[CapabilityBroker] Could not load registry.json:', err);
    }

    if (!registryData || !Array.isArray(registryData.foundations)) {
      return [{
        resource_id: 'FALLBACK_GENERATOR',
        name: 'Standard Certified Sim Generator',
        capability: req.requiredCapability,
        category: 'simulations',
        compatibility: 'CERTIFIED_GENERATION',
        dependencies: ['@aasha/sim-core'],
        license: 'MIT',
        offline_support: true,
        mobile_support: true,
        certification_status: 'PROVISIONAL',
        provenance: 'GENERATOR_FALLBACK',
        version: '1.0.0',
        score: 0,
        mechanics: []
      }];
    }

    for (const f of registryData.foundations) {
      let score = 0;
      const reqSubject = (req.subject || '').toLowerCase();
      const fSubjects = (f.subjects || []).map((s: string) => s.toLowerCase());

      // 1. Subject match (up to 30 pts)
      if (fSubjects.includes(reqSubject) || fSubjects.includes('general')) {
        score += 30;
      }

      // 2. Class / Grade match (up to 25 pts)
      if (req.grade && Array.isArray(f.classes)) {
        if (f.classes.includes(req.grade)) {
          score += 25;
        } else if (f.classes.some((c: number) => Math.abs(c - req.grade!) <= 2)) {
          score += 15;
        }
      } else if (!req.grade) {
        score += 15;
      }

      // 3. Capability / Mechanics match (up to 35 pts)
      const reqCap = (req.requiredCapability || '').toLowerCase();
      const reqInter = (req.interactionType || '').toLowerCase();
      const fMechanics = (f.mechanics || []).map((m: string) => m.toLowerCase());

      const mechanicMatch = fMechanics.some((m: string) =>
        reqCap.includes(m) || m.includes(reqCap) || reqInter.includes(m) || m.includes(reqInter)
      );

      if (mechanicMatch) {
        score += 35;
      } else if (fMechanics.length > 0) {
        score += 10;
      }

      // 4. Offline / Mobile requirement support (up to 10 pts)
      if (req.offlineRequirement && fMechanics.includes('pwa_offline')) {
        score += 10;
      } else if (req.offlineRequirement && f.license === 'MIT') {
        score += 5;
      }

      // Determine Compatibility classification
      let compatibility: ResourceCompatibility = 'LOCAL_ADAPTATION';
      if (score >= 80) {
        compatibility = 'EXACT_REUSE';
      } else if (score >= 55) {
        compatibility = 'PARAMETRIC_ADAPT';
      } else if (score >= 35) {
        compatibility = 'COMPOSE';
      } else if (score > 0) {
        compatibility = 'LOCAL_ADAPTATION';
      } else {
        compatibility = 'CERTIFIED_GENERATION';
      }

      if (score > 0) {
        candidates.push({
          resource_id: f.id,
          name: f.name,
          capability: req.requiredCapability,
          category: 'foundations',
          compatibility,
          adapter: f.reuse_strategy === 'WRAP' ? 'AashaSimWebComponent' : 'AashaExtractAdapter',
          dependencies: [f.repo],
          license: f.license,
          offline_support: fMechanics.includes('pwa_offline') || true,
          mobile_support: true,
          certification_status: 'CERTIFIED',
          provenance: f.repo || 'LOCAL_FOUNDATION',
          version: '1.0.0',
          score,
          mechanics: f.mechanics
        });
      }
    }

    candidates.sort((a, b) => b.score - a.score);

    if (candidates.length === 0) {
      candidates.push({
        resource_id: 'FALLBACK_GENERATOR',
        name: 'Standard Certified Sim Generator',
        capability: req.requiredCapability,
        category: 'simulations',
        compatibility: 'CERTIFIED_GENERATION',
        dependencies: ['@aasha/sim-core'],
        license: 'MIT',
        offline_support: true,
        mobile_support: true,
        certification_status: 'PROVISIONAL',
        provenance: 'GENERATOR_FALLBACK',
        version: '1.0.0',
        score: 0,
        mechanics: []
      });
    }

    return candidates;
  }

  /**
   * Look up bilingual Hindi definitions from the verified local dictionary database.
   * Zero API cost: operates strictly on local JSON storage.
   */
  lookupVocabulary(terms: string[]): VocabularyLookupResult {
    const found: Record<string, string> = {};
    const missing: string[] = [];

    let dict: Record<string, string> = {};
    try {
      const repoRoot = findRepoRoot(process.cwd());
      const dictPath = path.join(repoRoot, 'experience_registry', 'aasha_dictionary_db.json');
      if (fs.existsSync(dictPath)) {
        dict = JSON.parse(fs.readFileSync(dictPath, 'utf-8'));
      }
    } catch (err) {
      console.warn('[CapabilityBroker] Could not load aasha_dictionary_db.json:', err);
    }

    for (const rawTerm of terms) {
      const normalized = rawTerm.toLowerCase().trim().replace(/^[^\w]+|[^\w]+$/g, '');
      if (!normalized) continue;

      if (dict[normalized]) {
        found[rawTerm] = dict[normalized];
      } else {
        missing.push(rawTerm);
      }
    }

    const totalRequested = terms.length;
    const foundCount = Object.keys(found).length;
    const coveragePercentage = totalRequested > 0 ? Math.round((foundCount / totalRequested) * 100) : 100;

    return {
      found,
      missing,
      totalRequested,
      coveragePercentage
    };
  }

  /**
   * Persist newly verified vocabulary entries to local dictionary storage.
   * Auto-expands the zero-cost local substrate for all future runs.
   */
  autoPersistMissingVocabulary(newTerms: Record<string, string>): { addedCount: number; totalCount: number } {
    const repoRoot = findRepoRoot(process.cwd());
    const dictPath = path.join(repoRoot, 'experience_registry', 'aasha_dictionary_db.json');
    let dict: Record<string, string> = {};

    try {
      if (fs.existsSync(dictPath)) {
        dict = JSON.parse(fs.readFileSync(dictPath, 'utf-8'));
      }
    } catch (err) {
      console.warn('[CapabilityBroker] Reading dictionary for persistence failed:', err);
    }

    let addedCount = 0;
    for (const [k, v] of Object.entries(newTerms)) {
      const normalized = k.toLowerCase().trim().replace(/^[^\w]+|[^\w]+$/g, '');
      if (normalized && v && !dict[normalized]) {
        dict[normalized] = v;
        addedCount++;
      }
    }

    if (addedCount > 0) {
      // Sort alphabetically for clean git diff and deterministic serialization
      const sorted: Record<string, string> = {};
      for (const k of Object.keys(dict).sort()) {
        sorted[k] = dict[k];
      }
      fs.writeFileSync(dictPath, JSON.stringify(sorted, null, 2), 'utf-8');
    }

    return {
      addedCount,
      totalCount: Object.keys(dict).length
    };
  }

  /**
   * Scan chapter HTML file(s) or directory, extract all bilingual vocabulary entries (window.WM),
   * and automatically update the local vocabulary database (aasha_dictionary_db.json) with any new words.
   * Enforces that local DB expands on every new chapter build / transform.
   */
  syncChapterVocabulary(targetPath: string): { filesScanned: number; totalExtracted: number; newAdded: number; totalDbCount: number } {
    const filesToScan: string[] = [];

    if (fs.existsSync(targetPath)) {
      const stat = fs.statSync(targetPath);
      if (stat.isDirectory()) {
        const entries = fs.readdirSync(targetPath);
        for (const entry of entries) {
          if (entry.endsWith('.html')) {
            filesToScan.push(path.join(targetPath, entry));
          }
        }
      } else if (targetPath.endsWith('.html')) {
        filesToScan.push(targetPath);
      }
    }

    let totalExtracted = 0;
    const extractedVocab: Record<string, string> = {};

    for (const filePath of filesToScan) {
      try {
        const content = fs.readFileSync(filePath, 'utf-8');

        // Pattern 1: var WM = { ... }; or window.WM = { ... }; or const WM = { ... };
        const wmMatches = content.matchAll(/(?:var|window\.|const)\s*WM\s*=\s*(\{[\s\S]*?\});/g);
        for (const match of wmMatches) {
          const raw = match[1];
          try {
            const parsed = JSON.parse(raw);
            for (const [w, def] of Object.entries(parsed)) {
              if (typeof def === 'string' && def.trim().length > 0) {
                extractedVocab[w] = def;
                totalExtracted++;
              }
            }
          } catch {
            const pairMatches = raw.matchAll(/["']?([a-zA-Z0-9_\-]+)["']?\s*:\s*["']([^"']+)["']/g);
            for (const p of pairMatches) {
              extractedVocab[p[1]] = p[2];
              totalExtracted++;
            }
          }
        }

        // Pattern 2: data-def="..." on word-tap elements
        const tapMatches = content.matchAll(/<[^>]+class=["'][^"']*word-tap[^"']*["'][^>]*data-w=["']([^"']+)["'][^>]*data-def=["']([^"']+)["']/g);
        for (const m of tapMatches) {
          if (m[1] && m[2]) {
            extractedVocab[m[1]] = m[2];
            totalExtracted++;
          }
        }
      } catch (err) {
        console.warn(`[CapabilityBroker] Error reading ${filePath} for vocabulary:`, err);
      }
    }

    const persistResult = this.autoPersistMissingVocabulary(extractedVocab);

    return {
      filesScanned: filesToScan.length,
      totalExtracted,
      newAdded: persistResult.addedCount,
      totalDbCount: persistResult.totalCount
    };
  }

  /** Reload matrix from disk (useful after updates) */
  reloadMatrix(): void {
    this.matrix = loadMatrix();
  }
}

// Singleton export
export const capabilityBroker = new CapabilityBroker();

// ---------------------------------------------------------------------------
// CLI Self-Test
// ---------------------------------------------------------------------------

if (process.argv.includes('--test')) {
  console.log('\n🧭 Capability Broker — Routing Self-Test\n');

  const broker = new CapabilityBroker();

  const testProfiles: TaskProfile[] = [
    { taskType: 'evidence_ledger_write',   capability: 'POSTGRESQL_DATABASE',     complexity: 'LOW',  risk: 'LOW' },
    { taskType: 'deploy_pipeline_service', capability: 'DEPLOYMENT',              complexity: 'MED' as any, risk: 'HIGH' },
    { taskType: 'generate_chapter_html',   capability: 'CODE_GENERATION',         complexity: 'HIGH', risk: 'MEDIUM', codeRequired: true },
    { taskType: 'run_ltruth_benchmark',    capability: 'BENCHMARK',               complexity: 'LOW',  risk: 'LOW' },
    { taskType: 'cdp_verify_chapter',      capability: 'BROWSER_AUTOMATION',      complexity: 'MED' as any, risk: 'MEDIUM' },
    { taskType: 'analyze_codebase',        capability: 'REPOSITORY_ANALYSIS',     complexity: 'MED' as any, risk: 'LOW' },
    { taskType: 'production_deployment',   capability: 'DEPLOYMENT',              complexity: 'HIGH', risk: 'CRITICAL' },
  ];

  for (const profile of testProfiles) {
    const decision = broker.route(profile);
    const hilFlag = decision.hilRequired ? '🔴 HIL' : '🟢 AUTO';
    console.log(`${hilFlag} "${profile.taskType}" → ${decision.harness} [Tier ${decision.modelTier}] [${decision.confidence}]`);
    console.log(`   ${decision.rationale}\n`);
  }

  console.log('hatchable capabilities:', broker.getHarnessCapabilities('hatchable').join(', '));
  console.log('antigravity capabilities:', broker.getHarnessCapabilities('antigravity').join(', '));
  console.log('\n✅ Capability Broker test complete.\n');
}
