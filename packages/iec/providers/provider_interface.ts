/**
 * AASHA AIOS — IEC Provider Interface
 * Path: Aasha-AI/packages/iec/providers/provider_interface.ts
 *
 * Establishes a strictly neutral provider contract.
 * All capability providers (Native, Foundations, External, Generated) implement this interface.
 */

import { ExperiencePlan, ExperienceRequirement } from '../contracts/experience_specification';
import { ProviderClass } from '../contracts/strategy_types';

export interface CapabilityFitnessReport {
  readonly providerId: string;
  readonly providerClass: ProviderClass;
  readonly canSatisfy: boolean;
  readonly fitnessScore: number; // 0 to 100
  readonly adaptationCost: 'ZERO' | 'LOW' | 'MEDIUM' | 'HIGH';
  readonly offlineCompliant: boolean;
  readonly license: string;
  readonly notes: string[];
}

export interface RawExperienceArtifact {
  readonly experienceId: string;
  readonly providerId: string;
  readonly providerClass: ProviderClass;
  readonly htmlFragment: string;
  readonly javascriptCode: string;
  readonly cssCode: string;
  readonly stateSchema: Record<string, any>;
  readonly interactionSelectors: string[];
  readonly offlineAssets: Array<{ name: string; type: string; dataUri?: string }>;
  readonly contentSha256: string;
  readonly provenance: Record<string, any>;
  readonly canonicalIrRefs?: string[];
  readonly learningObjectiveRefs?: string[];
  readonly misconceptionRefs?: string[];
}

export interface CapabilityProvider {
  readonly providerId: string;
  readonly providerClass: ProviderClass;

  /**
   * Assesses whether this provider can satisfy the specified experience requirement.
   */
  canSatisfy(req: ExperienceRequirement): Promise<CapabilityFitnessReport>;

  /**
   * Synthesizes or adapts the raw experience code and assets.
   */
  synthesize(req: ExperienceRequirement, plan: ExperiencePlan): Promise<RawExperienceArtifact>;
}
