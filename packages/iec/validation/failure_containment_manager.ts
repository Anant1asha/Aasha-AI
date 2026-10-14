/**
 * AASHA AIOS — IEC Failure Containment Manager (Phase 5)
 * Path: Aasha-AI/packages/iec/validation/failure_containment_manager.ts
 *
 * Implements governed autonomous failure containment and repair.
 * INVARIANT: Maximum 2 autonomous repair iterations.
 * If errors persist on the 3rd attempt, execution immediately halts, outputs
 * an audit report, and triggers BLOCK_AND_ESCALATE_TO_HIL.
 * Prohibits destructive or untargeted repairs.
 */

import * as crypto from 'crypto';
import { RawExperienceArtifact } from '../providers/provider_interface';
import { ExperienceRequirement } from '../contracts/experience_specification';
import { ValidationPipeline, ValidationReport, GateResult } from './validation_pipeline';

export interface TargetedRepairDescriptor {
  failedGate: string;
  repairAction: 'INJECT_ARIA_LABELS' | 'CLAMP_TOUCH_TARGETS' | 'STRIP_EXECUTABLE_CDN' | 'INSULATE_RAW_MATH';
  targetArtifactId: string;
  preconditions: string[];
  postconditions: string[];
  rationale: string;
}

export interface ContainmentExecutionResult {
  success: boolean;
  status: 'PASSED_VALIDATION' | 'REPAIRED_AND_PASSED' | 'BLOCK_AND_ESCALATE_TO_HIL';
  artifact: RawExperienceArtifact;
  report: ValidationReport;
  repairAttempts: number;
  repairDescriptors: TargetedRepairDescriptor[];
  escalationReason?: string;
  timestamp: string;
}

export class FailureContainmentManager {
  public static readonly MAX_REPAIR_ATTEMPTS = 2;

  /**
   * Executes validation with bounded autonomous repair containment.
   */
  public static validateAndContain(
    artifact: RawExperienceArtifact,
    req: ExperienceRequirement
  ): ContainmentExecutionResult {
    let currentArtifact: RawExperienceArtifact = { ...artifact };
    let report = ValidationPipeline.validate(currentArtifact, req);

    if (report.passed) {
      return {
        success: true,
        status: 'PASSED_VALIDATION',
        artifact: currentArtifact,
        report,
        repairAttempts: 0,
        repairDescriptors: [],
        timestamp: new Date().toISOString(),
      };
    }

    const repairDescriptors: TargetedRepairDescriptor[] = [];
    let repairAttempts = 0;

    // Autonomous repair loop: strictly bounded to <= 2 iterations
    while (!report.passed && repairAttempts < FailureContainmentManager.MAX_REPAIR_ATTEMPTS) {
      const failedGates = report.gates.filter(g => g.severity === 'BLOCKING' && g.status === 'FAIL');

      // Check if any failed gate is non-repairable (e.g. syntax, mastery mutation, missing Canonical IR)
      const hasUnrepairableFailure = failedGates.some(g => !g.repairable);
      if (hasUnrepairableFailure) {
        const unrepairableGate = failedGates.find(g => !g.repairable);
        return {
          success: false,
          status: 'BLOCK_AND_ESCALATE_TO_HIL',
          artifact: currentArtifact,
          report,
          repairAttempts,
          repairDescriptors,
          escalationReason: `Unrepairable critical failure in gate: ${unrepairableGate?.gateId} (${unrepairableGate?.message})`,
          timestamp: new Date().toISOString(),
        };
      }

      // Execute targeted repair attempt
      repairAttempts++;
      let modifiedHtml = currentArtifact.htmlFragment;
      let modifiedJs = currentArtifact.javascriptCode;
      let modifiedCss = currentArtifact.cssCode;

      for (const gate of failedGates) {
        if (gate.gateId === 'accessibility_validation') {
          // Repair: Inject accessible aria-label on unlabeled buttons and inputs
          modifiedHtml = modifiedHtml.replace(/<button(?![^>]*aria-label)([^>]*)>(.*?)<\/button>/gi, '<button aria-label="Interactive action"$1>$2</button>');
          modifiedHtml = modifiedHtml.replace(/<input(?![^>]*aria-label)([^>]*type=["']range["'][^>]*)>/gi, '<input aria-label="Parameter slider control"$1>');
          repairDescriptors.push({
            failedGate: gate.gateId,
            repairAction: 'INJECT_ARIA_LABELS',
            targetArtifactId: currentArtifact.experienceId,
            preconditions: ['Interactive controls lack accessible labels'],
            postconditions: ['aria-label attributes injected without modifying behavior'],
            rationale: 'Autonomous accessibility repair for compliance with WCAG/A11y standards',
          });
        } else if (gate.gateId === 'touch_target_validation') {
          // Repair: Inject minimum 44x44px touch target rules
          modifiedCss += '\n/* Auto-repaired touch target sizing */\nbutton, input[type="range"] { min-height: 44px; min-width: 44px; touch-action: manipulation; }';
          repairDescriptors.push({
            failedGate: gate.gateId,
            repairAction: 'CLAMP_TOUCH_TARGETS',
            targetArtifactId: currentArtifact.experienceId,
            preconditions: ['Interactive controls lack 44x44px touch targets'],
            postconditions: ['CSS clamped to min-height: 44px and min-width: 44px'],
            rationale: 'Autonomous touch target repair for mobile viewport compliance',
          });
        } else if (gate.gateId === 'offline_dependency_validation') {
          // Repair: Strip illegal executable remote script or stylesheet tags
          modifiedHtml = modifiedHtml.replace(/<script\s+[^>]*src=["']https?:\/\/[^"']+["'][^>]*><\/script>/gi, '<!-- stripped remote script -->');
          modifiedHtml = modifiedHtml.replace(/<link\s+[^>]*href=["']https?:\/\/[^"']+["'][^>]*>/gi, '<!-- stripped remote link -->');
          repairDescriptors.push({
            failedGate: gate.gateId,
            repairAction: 'STRIP_EXECUTABLE_CDN',
            targetArtifactId: currentArtifact.experienceId,
            preconditions: ['Executable remote CDN script/link tags present'],
            postconditions: ['Remote tags removed to enforce 100% offline isolation'],
            rationale: 'Autonomous offline dependency repair to satisfy zero-runtime-network policy',
          });
        } else if (gate.gateId === 'mobile_layout_validation') {
          // Repair: Inject responsive wrapper styling
          modifiedCss += '\n/* Auto-repaired responsive container */\n.aasha-composite-shell { width: 100%; max-width: 800px; display: flex; flex-direction: column; }';
          repairDescriptors.push({
            failedGate: gate.gateId,
            repairAction: 'CLAMP_TOUCH_TARGETS',
            targetArtifactId: currentArtifact.experienceId,
            preconditions: ['CSS lacks responsive container attributes'],
            postconditions: ['Responsive flex and max-width injected'],
            rationale: 'Autonomous mobile layout repair for viewport responsiveness',
          });
        } else if (gate.gateId === 'lle_alignment_validation') {
          // Repair: Wrap raw uninsulated LaTeX math
          modifiedHtml = modifiedHtml.replace(/\$([^\$]+)\$/g, '<span class="math-var" data-math="true">\\($1\\)</span>');
          repairDescriptors.push({
            failedGate: gate.gateId,
            repairAction: 'INSULATE_RAW_MATH',
            targetArtifactId: currentArtifact.experienceId,
            preconditions: ['Raw LaTeX math expressions detected'],
            postconditions: ['Math expressions wrapped in math-var containers'],
            rationale: 'Autonomous math insulation repair to prevent LLE dictionary tokenizer corruption',
          });
        }
      }

      // Recompute deterministic SHA-256 for repaired artifact
      const hash = crypto.createHash('sha256');
      hash.update(modifiedHtml);
      hash.update(modifiedJs);
      hash.update(modifiedCss);
      const newContentSha256 = hash.digest('hex');

      currentArtifact = {
        ...currentArtifact,
        htmlFragment: modifiedHtml,
        javascriptCode: modifiedJs,
        cssCode: modifiedCss,
        contentSha256: newContentSha256,
        provenance: {
          ...currentArtifact.provenance,
          repaired: true,
          repairAttempts,
          repairedSha256: newContentSha256,
        },
      };

      // Revalidate after repair
      report = ValidationPipeline.validate(currentArtifact, req);
    }

    if (report.passed) {
      return {
        success: true,
        status: 'REPAIRED_AND_PASSED',
        artifact: currentArtifact,
        report,
        repairAttempts,
        repairDescriptors,
        timestamp: new Date().toISOString(),
      };
    }

    // Failure persisted beyond max 2 repair attempts -> immediately BLOCK_AND_ESCALATE_TO_HIL
    return {
      success: false,
      status: 'BLOCK_AND_ESCALATE_TO_HIL',
      artifact: currentArtifact,
      report,
      repairAttempts,
      repairDescriptors,
      escalationReason: `Validation failed after ${repairAttempts} autonomous repair attempts. Persistent failures: ${report.gates.filter(g => g.status === 'FAIL').map(g => g.gateId).join(', ')}`,
      timestamp: new Date().toISOString(),
    };
  }
}
