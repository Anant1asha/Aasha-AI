/**
 * AASHA AIOS — IEC AASHA Foundation Adapter Provider
 * Path: Aasha-AI/packages/iec/providers/aasha_foundations/foundation_adapter_provider.ts
 *
 * Encapsulates curated AASHA Foundations (F01–F20) from experience_registry/registry.json.
 * Provider Class: AASHA_FOUNDATION
 * INVARIANT: Foundations are part of AASHA's curated asset base, not external providers.
 */

import * as fs from 'fs';
import * as path from 'path';
import { ExperiencePlan, ExperienceRequirement } from '../../contracts/experience_specification';
import { ProvenanceTracker } from '../../provenance/provenance_tracker';
import { CapabilityFitnessReport, CapabilityProvider, RawExperienceArtifact } from '../provider_interface';

export class FoundationAdapterProvider implements CapabilityProvider {
  public readonly providerId: string = 'provider:aasha:foundations';
  public readonly providerClass = 'AASHA_FOUNDATION' as const;
  private baseDir: string;
  private registryPath: string;

  constructor(baseDir?: string) {
    this.baseDir = baseDir || path.resolve(__dirname, '../../../..');
    this.registryPath = path.resolve(this.baseDir, 'experience_registry/registry.json');
  }

  public async canSatisfy(req: ExperienceRequirement): Promise<CapabilityFitnessReport> {
    let matchedFoundation: any = null;

    if (fs.existsSync(this.registryPath)) {
      try {
        const raw = fs.readFileSync(this.registryPath, 'utf8');
        const reg = JSON.parse(raw);
        const foundations = reg.foundations || [];

        matchedFoundation = foundations.find((f: any) =>
          (f.mechanics || []).some((m: string) =>
            m.toLowerCase().includes(req.interaction_mechanism.toLowerCase()) ||
            req.interaction_mechanism.toLowerCase().includes(m.toLowerCase())
          )
        );
      } catch (err) {
        console.warn('[FoundationAdapterProvider] Registry read error:', err);
      }
    }

    if (matchedFoundation) {
      return {
        providerId: this.providerId,
        providerClass: this.providerClass,
        canSatisfy: true,
        fitnessScore: 92,
        adaptationCost: 'LOW',
        offlineCompliant: true,
        license: matchedFoundation.license || 'MIT',
        notes: [
          `Matched AASHA Foundation ${matchedFoundation.id}: ${matchedFoundation.name}`,
          `Reuse strategy: ${matchedFoundation.reuse_strategy || 'EXTRACT'}`,
          'Zero runtime network dependencies required',
        ],
      };
    }

    return {
      providerId: this.providerId,
      providerClass: this.providerClass,
      canSatisfy: false,
      fitnessScore: 0,
      adaptationCost: 'HIGH',
      offlineCompliant: true,
      license: 'UNKNOWN',
      notes: ['No matching foundation found for mechanism: ' + req.interaction_mechanism],
    };
  }

  public async synthesize(req: ExperienceRequirement, plan: ExperiencePlan): Promise<RawExperienceArtifact> {
    const candidate = plan.primary_candidate;
    const foundationId = candidate ? candidate.candidate_id : 'F02';
    const foundationName = candidate ? candidate.name : 'MicroSims';

    const htmlFragment = `
<div class="aasha-foundation-wrapper" id="foundation-${req.experience_id}" data-foundation-id="${foundationId}">
  <div class="foundation-badge">${foundationName} (${foundationId})</div>
  <div class="foundation-content" id="content-${req.experience_id}">
    <div class="foundation-visual" id="visual-${req.experience_id}"></div>
    <div class="foundation-controls">
      <button id="btn-action-${req.experience_id}" class="foundation-btn">Interact</button>
      <button id="btn-reset-${req.experience_id}" class="foundation-btn">Reset</button>
    </div>
  </div>
</div>`.trim();

    const javascriptCode = `
(function() {
  const container = document.getElementById("foundation-${req.experience_id}");
  if (!container) return;
  const btnAction = document.getElementById("btn-action-${req.experience_id}");
  const btnReset = document.getElementById("btn-reset-${req.experience_id}");
  let step = 0;

  if (btnAction) {
    btnAction.addEventListener("click", function() {
      step++;
      container.dispatchEvent(new CustomEvent("aasha:telemetry", {
        bubbles: true,
        detail: { eventType: "SIMULATION_INTERACTION", step: step, timestamp: Date.now() }
      }));
    });
  }

  if (btnReset) {
    btnReset.addEventListener("click", function() {
      step = 0;
      container.dispatchEvent(new CustomEvent("aasha:telemetry", {
        bubbles: true,
        detail: { eventType: "RESET", timestamp: Date.now() }
      }));
    });
  }
})();
`.trim();

    const cssCode = `
.aasha-foundation-wrapper {
  padding: 16px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  max-width: 500px;
}
.foundation-badge {
  font-size: 12px;
  font-weight: 600;
  color: #475569;
  margin-bottom: 8px;
}
.foundation-btn {
  min-width: 44px;
  min-height: 44px;
  padding: 8px 16px;
  background: #0284c7;
  color: #ffffff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}
`.trim();

    const fullContent = `${htmlFragment}\n${javascriptCode}\n${cssCode}`;
    const contentSha256 = ProvenanceTracker.computeContentHash(fullContent);

    const provenance = ProvenanceTracker.createRecord(
      foundationId,
      candidate?.source_ref || 'Aasha-AI/experience_registry',
      'AASHA_FOUNDATION_v1',
      candidate?.license || 'MIT',
      'ADAPTED',
      contentSha256
    );

    return {
      experienceId: req.experience_id,
      providerId: this.providerId,
      providerClass: this.providerClass,
      htmlFragment,
      javascriptCode,
      cssCode,
      stateSchema: { step: { type: 'number', default: 0 } },
      interactionSelectors: [
        `#btn-action-${req.experience_id}`,
        `#btn-reset-${req.experience_id}`,
      ],
      offlineAssets: [],
      contentSha256,
      provenance,
    };
  }
}
