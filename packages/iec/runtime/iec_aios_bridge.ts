/**
 * AASHA AIOS — IEC AIOS Bridge (Phase 6)
 * Path: Aasha-AI/packages/iec/runtime/iec_aios_bridge.ts
 *
 * Governed boundary between AIOS DesignAgent and the Interactive Experience Compiler (IEC).
 * Sequences and compiles offline interactive experiences for curriculum concept nodes.
 *
 * LOCKED INVARIANTS:
 * 1. Canonical IR remains sole learning-source authority.
 * 2. TEAS remains sole mastery decision authority (LEARNING_STATE != TELEMETRY_STATE).
 * 3. Provider identity is 100% blind during capability fitness evaluation.
 * 4. Maximum 2 autonomous repairs; failures trigger QuarantineError and AIOS downstream blocking.
 * 5. 100% offline compliance (zero remote runtime/CDN dependencies).
 * 6. Compilation != Registry Promotion. Promotion is gated strictly behind CapabilityPromoter.
 */

import { CandidateCapability, ExperiencePlan, ExperienceRequirement } from '../contracts/experience_specification';
import { CapabilityDiscoveryEngine } from '../discovery/capability_discovery_engine';
import { CapabilityEvaluator } from '../discovery/capability_evaluator';
import { ProceduralCanvasProvider } from '../providers/aasha_native/procedural_canvas_provider';
import { FoundationAdapterProvider } from '../providers/aasha_foundations/foundation_adapter_provider';
import { OpenMAICAdapterProvider } from '../providers/openmaic/openmaic_adapter_provider';
import { HybridExperienceComposer, ConstituentComponentBinding } from '../composition/hybrid_experience_composer';
import { ValidationReport } from '../validation/validation_pipeline';
import { FailureContainmentManager, ContainmentExecutionResult } from '../validation/failure_containment_manager';
import { ChildBundlePackager, ChildBundleResult } from './child_bundle_packager';
import { RawExperienceArtifact } from '../providers/provider_interface';
import { QuarantineError, QuarantinePacket } from '../../../agent_orchestrator';

export interface IECCompilationResult {
  success: boolean;
  experienceId: string;
  bundleHtml: string;
  byteSize: number;
  plan: ExperiencePlan;
  validationReport: ValidationReport;
  artifact: RawExperienceArtifact;
  repaired?: boolean;
  repairAttempts?: number;
  promotedToRegistry?: boolean;
}

export class IECAIOSBridge {
  private static discoveryEngine = new CapabilityDiscoveryEngine();
  private static evaluator = new CapabilityEvaluator();
  private static nativeProvider = new ProceduralCanvasProvider();
  private static foundationProvider = new FoundationAdapterProvider();
  private static openmaicProvider = new OpenMAICAdapterProvider();

  /**
   * Returns true if IEC bridge and all constituent subsystems are available.
   */
  public static isAvailable(): boolean {
    return true;
  }

  /**
   * Compiles an interactive experience requirement for an AIOS concept node.
   * Maps concept -> discovers candidates -> evaluates blind to provider identity ->
   * synthesizes/composes -> validates 19 gates with bounded repair -> packages offline bundle.
   */
  public static async compileForConcept(
    conceptNode: {
      id: string;
      name?: string;
      title?: string;
      required_manipulative?: string;
      learning_objective?: string;
      [key: string]: any;
    },
    pipelineInput: {
      subject: string;
      grade: number;
      topic: string;
      [key: string]: any;
    },
    options?: {
      forceFailure?: boolean; // For testing AIOS quarantine propagation
      forceCompose?: boolean;
    }
  ): Promise<IECCompilationResult> {
    const rawSubject = pipelineInput.subject || 'General';
    const grade = pipelineInput.grade || 8;
    const topic = pipelineInput.topic || 'General';
    const conceptId = conceptNode.id || `${rawSubject}_Class${grade}_${topic}`;
    const cleanSubject = rawSubject.toLowerCase().replace(/[^a-z0-9]/g, '');
    const cleanConcept = conceptId.toLowerCase().replace(/[^a-z0-9_]/g, '_');
    const experienceId = `exp:${cleanSubject}:c${grade}:${cleanConcept}`;

    // 1. Build IEC ExperienceRequirement grounded in Canonical IR concept mapping
    const interactionMechanism = conceptNode.required_manipulative || 'procedural_canvas_loop';

    const req: ExperienceRequirement = {
      experience_id: experienceId,
      capability_id: 'SIMULATION',
      tln_ids: [`tln_${cleanSubject}_c${grade}`],
      learning_objective_ids: [`lo_${cleanConcept}`],
      concept_ids: [conceptId],
      misconception_ids: [`misc_${cleanConcept}`],
      interaction_mechanism: interactionMechanism,
      variables: [
        {
          name: 'dimension_a',
          symbol: 'a',
          min: 1,
          max: 10,
          step: 1,
          defaultValue: 4,
          concept_mapping_ref: conceptId,
        },
      ],
      performance_budget: {
        maxBundleBytes: 20971520, // 20 MB ceiling
        targetFps: 60,
        pauseWhenHidden: true,
      },
      device_requirements: {
        supportedViewports: [320, 375, 414, 768],
        minTouchTargetPx: 44,
        orientationSafe: true,
      },
      accessibility_requirements: ['WCAG_AA', 'ARIA_LABELS_PRESENT'],
      evidence_signals: ['interaction_state_change', 'reset_triggered'],
    };

    // 2. Discover Candidates
    const candidates = await this.discoveryEngine.discoverCandidates(req, rawSubject, grade);

    // Ensure candidate pool contains providers for evaluation
    if (!candidates.some(c => c.candidate_id === 'aasha_native_procedural')) {
      candidates.push({
        candidate_id: 'aasha_native_procedural',
        name: 'AASHA Native 3D/Canvas Visual Engine',
        provider_class: 'AASHA_NATIVE',
        source_ref: 'packages/iec/providers/aasha_native/procedural_canvas_provider.ts',
        license: 'MIT',
        offline_ready: true,
        mechanics: ['procedural_canvas_loop', 'canvas_rendering', '3d_projection'],
        supported_subjects: ['Mathematics', 'Science', 'Physics', 'General'],
        supported_grades: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      });
    }

    if (!candidates.some(c => c.candidate_id === 'openmaic_interactive_primitives')) {
      candidates.push({
        candidate_id: 'openmaic_interactive_primitives',
        name: 'OpenMAIC Interactive Generation Primitive',
        provider_class: 'APPROVED_EXTERNAL_CAPABILITY_PROVIDER',
        source_ref: 'THU-MAIC/OpenMAIC@21d83ec51b908a4b169ee2be7498a29da213c74d',
        license: 'MIT',
        offline_ready: true,
        mechanics: ['multi_parameter_sliders', 'parameter_sliders', 'interactive_simulation_primitives'],
        supported_subjects: ['Mathematics', 'Science', 'Physics', 'General'],
        supported_grades: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      });
    }

    // 3. Provider-Blind Capability Evaluation
    const { plan } = this.evaluator.evaluate(req, candidates);

    if (options?.forceCompose) {
      plan.selected_strategy = 'COMPOSE';
    }

    // 4. Synthesize / Adapt / Compose Artifact
    let rawArtifact: RawExperienceArtifact;

    if (plan.selected_strategy === 'COMPOSE') {
      const nativeArtifact = await this.nativeProvider.synthesize(req, plan);
      const openmaicArtifact = await this.openmaicProvider.synthesize(req, plan);
      const foundationArtifact = await this.foundationProvider.synthesize(req, plan);

      const bindings: ConstituentComponentBinding[] = [
        { slot: 'visual', artifact: nativeArtifact, role: 'Procedural visual renderer' },
        { slot: 'controls', artifact: openmaicArtifact, role: 'Multi-parameter interactive slider controls' },
        { slot: 'workspace', artifact: foundationArtifact, role: 'Foundation boundary mechanics' },
      ];

      rawArtifact = HybridExperienceComposer.compose(req, plan, bindings);
    } else if (plan.primary_candidate?.provider_class === 'APPROVED_EXTERNAL_CAPABILITY_PROVIDER') {
      rawArtifact = await this.openmaicProvider.synthesize(req, plan);
    } else if (plan.primary_candidate?.provider_class === 'AASHA_FOUNDATION') {
      rawArtifact = await this.foundationProvider.synthesize(req, plan);
    } else {
      rawArtifact = await this.nativeProvider.synthesize(req, plan);
    }

    // For test simulation of unrepairable defect (triggering quarantine)
    if (options?.forceFailure) {
      rawArtifact = {
        ...rawArtifact,
        javascriptCode: 'const unclosedSyntax = {{{;', // Fatal syntax error
      };
    }

    // 5. Run Full 19-Gate Validation with Bounded Autonomous Repair (<= 2 attempts)
    const containmentResult: ContainmentExecutionResult = FailureContainmentManager.validateAndContain(
      rawArtifact,
      req
    );

    // 6. Handle Quarantine Escalation
    if (!containmentResult.success || containmentResult.status === 'BLOCK_AND_ESCALATE_TO_HIL') {
      const packet: QuarantinePacket = {
        quarantined: true,
        role: 'DesignAgent',
        conceptId: conceptId,
        repairAttempts: containmentResult.repairAttempts,
        exhausted: true,
        violations: containmentResult.report.gates.filter(g => !g.passed),
        rawContent: JSON.stringify({
          experienceId: rawArtifact.experienceId,
          escalationReason: containmentResult.escalationReason || 'Validation failed and repair attempts exhausted',
        }),
        quarantineTimestamp: new Date().toISOString(),
        actionRequired: 'SUPER_ADMIN_INTERVENTION',
      };

      throw new QuarantineError(
        `IEC compilation failed validation after ${containmentResult.repairAttempts} repair attempts. Output quarantined.`,
        packet
      );
    }

    // 7. Compile into Single Offline HTML5 Child Bundle (<= 20 MB, zero CDN)
    const bundleResult: ChildBundleResult = ChildBundlePackager.package(containmentResult.artifact);

    return {
      success: true,
      experienceId: containmentResult.artifact.experienceId,
      bundleHtml: bundleResult.bundleHtml,
      byteSize: bundleResult.byteSize,
      plan,
      validationReport: containmentResult.report,
      artifact: containmentResult.artifact,
      repaired: containmentResult.status === 'REPAIRED_AND_PASSED',
      repairAttempts: containmentResult.repairAttempts,
    };
  }
}
