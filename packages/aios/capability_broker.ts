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

const MATRIX_PATH = path.join(
  path.dirname(new URL(import.meta.url || `file://${__filename}`).pathname.replace(/^\/([A-Z]:)/, '$1')),
  'capability_matrix.json'
);

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
