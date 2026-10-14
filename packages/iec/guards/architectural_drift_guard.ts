/**
 * AASHA AIOS — Architectural Drift Guard (Phase 1)
 * Path: Aasha-AI/packages/iec/guards/architectural_drift_guard.ts
 *
 * Enforces hard architectural invariants during IEC compilation.
 * Blocks any execution if parallel structures or unapproved activations are detected.
 */

import * as fs from 'fs';
import * as path from 'path';

export interface DriftGuardReport {
  passed: boolean;
  violations: string[];
  reusedComponents: string[];
  timestamp: string;
}

export class ArchitecturalDriftGuard {
  private baseDir: string;

  constructor(baseDir?: string) {
    this.baseDir = baseDir || path.resolve(__dirname, '../../..');
  }

  /**
   * Evaluates the repository state to ensure:
   * 1. Existing canonical systems are reused.
   * 2. No parallel or duplicate systems have been constructed.
   * 3. No premature providers or production activations have occurred before authorized phase.
   */
  public verify(currentPhase: number = 6): DriftGuardReport {
    const violations: string[] = [];
    const reusedComponents: string[] = [];

    // 1. MUST REUSE EXISTING
    const canonicalIrPath = path.resolve(this.baseDir, 'packages/canonical-ir/canonical_ir_schema.ts');
    if (fs.existsSync(canonicalIrPath)) {
      reusedComponents.push('Canonical_IR (packages/canonical-ir)');
    } else {
      violations.push('MISSING_CANONICAL_IR: packages/canonical-ir/canonical_ir_schema.ts not found.');
    }

    const telemetryClientPath = path.resolve(this.baseDir, 'packages/v6-engine/aasha_telemetry_client.ts');
    if (fs.existsSync(telemetryClientPath)) {
      reusedComponents.push('AASHA_telemetry_client (packages/v6-engine)');
    } else {
      violations.push('MISSING_TELEMETRY_CLIENT: packages/v6-engine/aasha_telemetry_client.ts not found.');
    }

    const v6BusPath = path.resolve(this.baseDir, 'packages/v6-engine/v6_runtime_bus.ts');
    if (fs.existsSync(v6BusPath)) {
      reusedComponents.push('v6_runtime_bus (packages/v6-engine)');
    } else {
      violations.push('MISSING_V6_BUS: packages/v6-engine/v6_runtime_bus.ts not found.');
    }

    const registryPath = path.resolve(this.baseDir, 'experience_registry/registry.json');
    if (fs.existsSync(registryPath)) {
      reusedComponents.push('Experience_Registry (experience_registry/registry.json)');
    } else {
      violations.push('MISSING_REGISTRY: experience_registry/registry.json not found.');
    }

    // 2. MUST NOT CREATE PARALLEL
    // Verify no parallel Canonical IR exists inside packages/iec/
    const parallelIrPath = path.resolve(this.baseDir, 'packages/iec/canonical_ir.ts');
    if (fs.existsSync(parallelIrPath)) {
      violations.push('PARALLEL_CANONICAL_IR_DETECTED: packages/iec/canonical_ir.ts must not exist.');
    }

    // Verify no parallel TEAS engine exists inside packages/iec/
    const parallelTeasPath = path.resolve(this.baseDir, 'packages/iec/teas_engine.ts');
    if (fs.existsSync(parallelTeasPath)) {
      violations.push('PARALLEL_TEAS_DETECTED: packages/iec/teas_engine.ts must not exist.');
    }

    // Verify no parallel telemetry pipeline exists inside packages/iec/
    const parallelTelemPath = path.resolve(this.baseDir, 'packages/iec/telemetry_pipeline.ts');
    if (fs.existsSync(parallelTelemPath)) {
      violations.push('PARALLEL_TELEMETRY_PIPELINE_DETECTED: packages/iec/telemetry_pipeline.ts must not exist.');
    }

    // Verify no parallel registry exists inside packages/iec/
    const parallelRegPath = path.resolve(this.baseDir, 'packages/iec/experience_registry.json');
    if (fs.existsSync(parallelRegPath)) {
      violations.push('PARALLEL_REGISTRY_DETECTED: packages/iec/experience_registry.json must not exist.');
    }

    // 3. PHASE-AWARE ACTIVATION CHECKS
    // OpenMAIC provider must not be activated in Phase 1
    const openmaicActivePath = path.resolve(this.baseDir, 'packages/iec/providers/openmaic/active.flag');
    if (currentPhase < 3 && fs.existsSync(openmaicActivePath)) {
      violations.push('PREMATURE_OPENMAIC_ACTIVATION: OpenMAIC provider must not be activated before Phase 3.');
    }

    // Production AIOS invocation must not be triggered until Phase 6
    const prodActiveFlag = path.resolve(this.baseDir, 'packages/iec/aios_active.flag');
    if (currentPhase < 6 && fs.existsSync(prodActiveFlag)) {
      violations.push('PREMATURE_AIOS_ACTIVATION: IEC must not be activated in production AIOS before Phase 6.');
    }

    // Registry promotion must not be triggered until Phase 6
    const registryPromotedFlag = path.resolve(this.baseDir, 'packages/iec/registry_promoted.flag');
    if (currentPhase < 6 && fs.existsSync(registryPromotedFlag)) {
      violations.push('PREMATURE_REGISTRY_PROMOTION: Experiences must not be promoted to registry before Phase 6.');
    }

    return {
      passed: violations.length === 0,
      violations,
      reusedComponents,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Hard assertion. Throws error if any drift is detected.
   */
  public assertNoDrift(currentPhase: number = 6): void {
    const report = this.verify(currentPhase);
    if (!report.passed) {
      throw new Error(
        `ARCHITECTURAL_DRIFT_GATE_FAILED:\n${report.violations.map(v => `  - ${v}`).join('\n')}`
      );
    }
  }
}
