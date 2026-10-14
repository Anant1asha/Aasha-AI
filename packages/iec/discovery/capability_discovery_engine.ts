/**
 * AASHA AIOS — IEC Capability Discovery Engine
 * Path: Aasha-AI/packages/iec/discovery/capability_discovery_engine.ts
 *
 * Implements efficiency-optimized capability discovery without dictating provider preference.
 * Principle: Search order is NOT selection priority.
 */

import * as fs from 'fs';
import * as path from 'path';
import { CandidateCapability, ExperienceRequirement } from '../contracts/experience_specification';
import { SearchSource, ProviderClass } from '../contracts/strategy_types';

export class CapabilityDiscoveryEngine {
  private baseDir: string;
  private registryPath: string;

  constructor(baseDir?: string) {
    this.baseDir = baseDir || path.resolve(__dirname, '../../..');
    this.registryPath = path.resolve(this.baseDir, 'experience_registry/registry.json');
  }

  /**
   * Preferred search sequence optimizing search efficiency.
   */
  public getPreferredSearchSequence(): SearchSource[] {
    return [
      'EXISTING_AASHA_EXPERIENCE',
      'APPROVED_AASHA_REUSABLE_RESOURCE',
      'APPROVED_AASHA_FOUNDATION',
      'APPROVED_EXTERNAL_RESOURCE',
      'APPROVED_EXTERNAL_CAPABILITY_PROVIDER',
      'NEW_AASHA_NATIVE_CAPABILITY',
    ];
  }

  /**
   * Discovers candidate capabilities matching the experience requirement.
   */
  public async discoverCandidates(
    req: ExperienceRequirement,
    subject: string,
    grade: number
  ): Promise<CandidateCapability[]> {
    const candidates: CandidateCapability[] = [];

    // 1. Search existing registry foundations (AASHA Foundations F01-F20)
    if (fs.existsSync(this.registryPath)) {
      try {
        const raw = fs.readFileSync(this.registryPath, 'utf8');
        const reg = JSON.parse(raw);
        const foundations = reg.foundations || [];

        for (const f of foundations) {
          const matchSubject = (f.subjects || []).some(
            (s: string) => s.toLowerCase() === subject.toLowerCase() || s === 'General'
          );
          const matchClass = (f.classes || []).includes(grade);

          if (matchSubject && matchClass) {
            candidates.push({
              candidate_id: f.id,
              name: f.name,
              provider_class: 'AASHA_FOUNDATION',
              source_ref: f.repo || f.demo || 'experience_registry',
              license: f.license || 'UNKNOWN',
              offline_ready: true,
              mechanics: f.mechanics || [],
              supported_subjects: f.subjects || [],
              supported_grades: f.classes || [],
            });
          }
        }
      } catch (err) {
        console.warn('[CapabilityDiscoveryEngine] Error querying registry:', err);
      }
    }

    // 2. Add Native AASHA Generation capability as an available candidate
    candidates.push({
      candidate_id: `native:gen:${subject.toLowerCase()}:${grade}`,
      name: `AASHA Native Procedural ${req.capability_id}`,
      provider_class: 'AASHA_NATIVE',
      source_ref: 'packages/iec/providers/aasha_native',
      license: 'MIT',
      offline_ready: true,
      mechanics: [req.interaction_mechanism],
      supported_subjects: [subject],
      supported_grades: [grade],
    });

    return candidates;
  }
}
