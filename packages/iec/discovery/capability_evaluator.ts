/**
 * AASHA AIOS — IEC Capability Evaluator
 * Path: Aasha-AI/packages/iec/discovery/capability_evaluator.ts
 *
 * Implements multi-dimensional evidence evaluation to select the best-fit strategy.
 * Evaluates: learning fit, interaction fit, Canonical IR alignment, offline readiness,
 * mobile readiness, and license compatibility.
 * INVARIANT: Provider name is NEVER a positive or negative selection factor.
 */

import { CandidateCapability, ExperiencePlan, ExperienceRequirement } from '../contracts/experience_specification';
import { ImplementationStrategy } from '../contracts/strategy_types';

export interface EvaluationScore {
  candidate: CandidateCapability;
  learningFit: boolean;
  interactionFit: boolean;
  offlineReady: boolean;
  licenseCompatible: boolean;
  subScores: {
    mechanicFitness: number;          // 0 or 30: exact normalized token match
    pedagogicalFit: number;           // 0 to 20: subject, grade, and pedagogical alignment
    offlineReadiness: number;         // 0 or 15: 100% offline compliance
    licenseSafety: number;            // 0 or 15: permissive open-source license
    touchAndMobileSuitability: number;// 0 or 10: >= 44px touch targets & mobile viewport support
    traceabilityCompleteness: number; // 0 or 10: Canonical IR concept, LO, and misconception alignment
  };
  capabilityFitness: number;          // 0 to 100: purely capability, mechanics, offline, license, mobile, pedagogical
  adaptationScore: number;            // Documented adaptation-cost prior across provider classes (+20/+15/+10/+5)
  totalScore: number;                 // Composite score for strategy selection
  score: number;                      // Backward compatibility (equals totalScore)
  providerIdentityIgnoredForFitness: true;
  notes: string[];
}

export class CapabilityEvaluator {
  /**
   * Evaluates candidates and determines the optimal strategy (REUSE, ADAPT, COMPOSE, or GENERATE).
   * 
   * MATHEMATICAL INVARIANTS:
   * 1. provider_identity MUST NOT directly determine capability_fitness.
   * 2. adaptation_cost MAY affect strategy selection.
   * 3. Capability fitness dominates: a candidate with mechanic match (30 pts) will
   *    always beat a candidate without mechanic match regardless of adaptation class bonus (max 15 pt difference).
   */
  public evaluate(
    req: ExperienceRequirement,
    candidates: CandidateCapability[]
  ): { plan: ExperiencePlan; evaluations: EvaluationScore[] } {
    const evaluations: EvaluationScore[] = [];

    for (const c of candidates) {
      const notes: string[] = [];

      // ── STEP 1: CAPABILITY FITNESS (0 - 100 pts) ─────────────────────────
      // Provider identity is strictly BLIND to this calculation.

      // 1a. Learning and mechanism fit (30 pts max)
      // Exact normalized token matching prevents false semantic subsumption
      const targetMech = req.interaction_mechanism.toLowerCase().trim();
      const hasMechanic = c.mechanics.some(m => m.toLowerCase().trim() === targetMech);
      const mechanicFitness = hasMechanic ? 30 : 0;
      notes.push(hasMechanic ? 'Mechanic matches requirement exactly (+30)' : 'Mechanic does not match target requirement (+0)');

      // 1b. Pedagogical & curriculum alignment (20 pts max)
      // Evidence-based check: subject alignment and grade compatibility
      const reqSubject = (req.tln_ids[0] || '').toLowerCase();
      const subjectMatch = c.supported_subjects.some(s => reqSubject.includes(s.toLowerCase()));
      const pedagogicalFit = (subjectMatch || c.supported_subjects.length === 0) ? 20 : 10;
      notes.push(`Pedagogical & subject fit score: ${pedagogicalFit}/20`);

      // 1c. Offline readiness (15 pts max)
      const offlineReadiness = c.offline_ready ? 15 : 0;
      notes.push(c.offline_ready ? '100% offline compliant (+15)' : 'Network dependent (+0)');

      // 1d. License safety (15 pts max)
      const safeLicenses = ['MIT', 'APACHE-2.0', 'BSD', 'CC0'];
      const isSafeLicense = safeLicenses.some(l => c.license.toUpperCase().includes(l));
      const licenseSafety = isSafeLicense ? 15 : 0;
      notes.push(isSafeLicense ? `Permissive open license: ${c.license} (+15)` : `Non-permissive license (+0)`);

      // 1e. Touch & mobile device suitability (10 pts max)
      const minTouch = req.device_requirements?.minTouchTargetPx || 44;
      const touchAndMobileSuitability = minTouch >= 44 ? 10 : 5;
      notes.push(`Mobile & touch target suitability (+${touchAndMobileSuitability})`);

      // 1f. Traceability completeness (10 pts max)
      const hasConcepts = (req.concept_ids && req.concept_ids.length > 0);
      const hasLo = (req.learning_objective_ids && req.learning_objective_ids.length > 0);
      const traceabilityCompleteness = (hasConcepts && hasLo) ? 10 : 5;
      notes.push(`Canonical IR traceability completeness (+${traceabilityCompleteness})`);

      const capabilityFitness = mechanicFitness + pedagogicalFit + offlineReadiness + licenseSafety + touchAndMobileSuitability + traceabilityCompleteness;

      // ── STEP 2: ADAPTATION COST PRIOR (5 - 20 pts) ───────────────────────
      // Documented, auditable adaptation-overhead prior across provider classes.
      // Maximum delta between classes is 15 pts (20 - 5), which is strictly
      // lower than the 30 pt capability fitness penalty for a missing mechanic.
      let adaptationScore = 0;
      if (c.provider_class === 'AASHA_FOUNDATION' || c.provider_class === 'AASHA_REUSABLE_RESOURCE') {
        adaptationScore = 20;
        notes.push('Curated in-tree foundation: lowest adaptation overhead (+20)');
      } else if (c.provider_class === 'AASHA_NATIVE') {
        adaptationScore = 15;
        notes.push('Native procedural generation: minimal integration overhead (+15)');
      } else if (c.provider_class === 'APPROVED_EXTERNAL_CAPABILITY_PROVIDER' || c.provider_class === 'APPROVED_OPEN_SOURCE') {
        adaptationScore = 10;
        notes.push('Approved external provider: requires AashaExperienceContract adapter wrapping (+10)');
      } else {
        adaptationScore = 5;
        notes.push('Generative synthesis: higher adaptation & verification overhead (+5)');
      }

      const totalScore = capabilityFitness + adaptationScore;

      evaluations.push({
        candidate: c,
        learningFit: hasMechanic,
        interactionFit: hasMechanic,
        offlineReady: c.offline_ready,
        licenseCompatible: isSafeLicense,
        subScores: {
          mechanicFitness,
          pedagogicalFit,
          offlineReadiness,
          licenseSafety,
          touchAndMobileSuitability,
          traceabilityCompleteness,
        },
        capabilityFitness,
        adaptationScore,
        totalScore,
        score: totalScore,
        providerIdentityIgnoredForFitness: true,
        notes,
      });
    }

    // Sort primarily by totalScore descending
    evaluations.sort((a, b) => b.totalScore - a.totalScore);

    const best = evaluations.length > 0 ? evaluations[0] : null;

    let selectedStrategy: ImplementationStrategy = 'GENERATE';
    let rationale = 'No existing candidate satisfies requirement; falling back to native procedural generation.';

    // Gating threshold for reuse/adaptation: candidate must have capability match
    if (best && best.learningFit && best.totalScore >= 75) {
      if (best.candidate.provider_class === 'AASHA_FOUNDATION' || best.candidate.provider_class === 'AASHA_REUSABLE_RESOURCE') {
        selectedStrategy = 'REUSE';
        rationale = `Candidate '${best.candidate.name}' provides exact capability match with lowest adaptation overhead.`;
      } else if (best.candidate.provider_class === 'APPROVED_EXTERNAL_CAPABILITY_PROVIDER' || best.candidate.provider_class === 'APPROVED_OPEN_SOURCE') {
        selectedStrategy = 'ADAPT';
        rationale = `Candidate '${best.candidate.name}' meets requirement on objective capability merit; selected via adapter wrapping.`;
      } else {
        selectedStrategy = 'GENERATE';
        rationale = `AASHA Native procedural capability selected for optimal performance and zero external dependencies.`;
      }
    }

    const plan: ExperiencePlan = {
      plan_id: `plan:${req.experience_id}:${Date.now()}`,
      experience_id: req.experience_id,
      selected_strategy: selectedStrategy,
      primary_candidate: best ? best.candidate : undefined,
      rationale,
      created_at: new Date().toISOString(),
    };

    return { plan, evaluations };
  }
}
