/**
 * AASHA AIOS — Governed OpenMAIC Adapter Provider
 * Path: Aasha-AI/packages/iec/providers/openmaic/openmaic_adapter_provider.ts
 *
 * Adapts interactive generation primitives extracted from OpenMAIC:
 * Repository: https://github.com/THU-MAIC/OpenMAIC
 * Pinned Commit SHA: 21d83ec51b908a4b169ee2be7498a29da213c74d
 * License: MIT
 *
 * Provider Class: APPROVED_EXTERNAL_CAPABILITY_PROVIDER
 * INVARIANT: OpenMAIC is one capability source among many; it holds no default or exclusive authority.
 */

import { ExperiencePlan, ExperienceRequirement } from '../../contracts/experience_specification';
import { ProvenanceTracker } from '../../provenance/provenance_tracker';
import { CapabilityFitnessReport, CapabilityProvider, RawExperienceArtifact } from '../provider_interface';

export class OpenMAICAdapterProvider implements CapabilityProvider {
  public readonly providerId: string = 'provider:openmaic:interactive_primitives';
  public readonly providerClass = 'APPROVED_EXTERNAL_CAPABILITY_PROVIDER' as const;
  public readonly pinnedCommit: string = '21d83ec51b908a4b169ee2be7498a29da213c74d';

  public async canSatisfy(req: ExperienceRequirement): Promise<CapabilityFitnessReport> {
    const supportedMechanisms = [
      'multi_parameter_sliders',
      'interactive_simulation_primitives',
      'step_state_toggle',
      'parameter_sliders',
    ];

    const canSatisfy = supportedMechanisms.some(m =>
      m.toLowerCase().includes(req.interaction_mechanism.toLowerCase()) ||
      req.interaction_mechanism.toLowerCase().includes(m.toLowerCase())
    );

    return {
      providerId: this.providerId,
      providerClass: this.providerClass,
      canSatisfy,
      fitnessScore: canSatisfy ? 90 : 15,
      adaptationCost: 'LOW',
      offlineCompliant: true,
      license: 'MIT',
      notes: [
        'Adapted from THU-MAIC/OpenMAIC (pinned commit 21d83ec)',
        'Extracts parameter slider loops and responsive canvas patterns',
        'Requires AashaExperienceContract wrapper; classroom UI rejected',
      ],
    };
  }

  public async synthesize(req: ExperienceRequirement, plan: ExperiencePlan): Promise<RawExperienceArtifact> {
    const htmlFragment = `
<div class="openmaic-adapted-sim-container" id="openmaic-${req.experience_id}" data-pinned-commit="${this.pinnedCommit}">
  <div class="openmaic-header">
    <span class="openmaic-badge">OpenMAIC Primitive [${this.pinnedCommit.substring(0, 7)}]</span>
    <div class="openmaic-controls">
      <label for="slider-a-${req.experience_id}">Dimension A:</label>
      <input type="range" id="slider-a-${req.experience_id}" min="1" max="10" value="4" class="openmaic-slider" />
      <span id="val-a-${req.experience_id}">4</span>

      <label for="slider-b-${req.experience_id}">Dimension B:</label>
      <input type="range" id="slider-b-${req.experience_id}" min="1" max="10" value="6" class="openmaic-slider" />
      <span id="val-b-${req.experience_id}">6</span>

      <button id="btn-reset-${req.experience_id}" class="openmaic-btn-reset">Reset</button>
    </div>
  </div>
  <div class="openmaic-canvas-wrapper">
    <canvas id="canvas-${req.experience_id}" width="420" height="280" class="openmaic-canvas"></canvas>
  </div>
</div>`.trim();

    const javascriptCode = `
(function() {
  const container = document.getElementById("openmaic-${req.experience_id}");
  if (!container) return;
  const canvas = document.getElementById("canvas-${req.experience_id}");
  const sliderA = document.getElementById("slider-a-${req.experience_id}");
  const sliderB = document.getElementById("slider-b-${req.experience_id}");
  const valA = document.getElementById("val-a-${req.experience_id}");
  const valB = document.getElementById("val-b-${req.experience_id}");
  const btnReset = document.getElementById("btn-reset-${req.experience_id}");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  let animId = null;
  let running = true;
  let a = parseInt(sliderA ? sliderA.value : "4", 10);
  let b = parseInt(sliderB ? sliderB.value : "6", 10);

  function renderLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw adapted dynamic grid visual
    ctx.fillStyle = "#0284c7";
    ctx.fillRect(40, 40, a * 20, b * 20);
    
    // Draw border
    ctx.strokeStyle = "#0369a1";
    ctx.lineWidth = 2;
    ctx.strokeRect(40, 40, a * 20, b * 20);

    // Text metrics
    ctx.fillStyle = "#ffffff";
    ctx.font = "14px sans-serif";
    ctx.fillText("Grid: " + a + " x " + b + " = " + (a * b), 50, 65);

    if (running) animId = requestAnimationFrame(renderLoop);
  }

  function emitChange() {
    const area = a * b;
    container.dispatchEvent(new CustomEvent("aasha:state_change", {
      bubbles: true,
      detail: { dimA: a, dimB: b, product: area }
    }));
    container.dispatchEvent(new CustomEvent("aasha:telemetry", {
      bubbles: true,
      detail: {
        eventType: "SIMULATION_INTERACTION",
        action: "dimension_slider_changed",
        dimA: a,
        dimB: b,
        product: area,
        timestamp: Date.now()
      }
    }));
  }

  // Deterministic Lifecycle States (G6)
  const LifecycleState = {
    UNMOUNTED: 'UNMOUNTED',
    MOUNTED: 'MOUNTED',
    ACTIVE: 'ACTIVE',
    PAUSED: 'PAUSED',
    RESUMED: 'RESUMED',
    RESET: 'RESET',
    DESTROYED: 'DESTROYED'
  };
  let currentState = LifecycleState.ACTIVE;

  // AashaExperienceContract Interface (G7, G15)
  window.__AASSHA_EXPERIENCE_CONTRACT__ = {
    mount: function(c) { currentState = LifecycleState.MOUNTED; renderLoop(); currentState = LifecycleState.ACTIVE; },
    getState: function() { return { dimA: a, dimB: b, product: a * b, state: currentState }; },
    pause: function() { running = false; if (animId) cancelAnimationFrame(animId); currentState = LifecycleState.PAUSED; },
    resume: function() { running = true; renderLoop(); currentState = LifecycleState.RESUMED; },
    reset: function() {
      a = 4;
      b = 6;
      if (sliderA) sliderA.value = "4";
      if (sliderB) sliderB.value = "6";
      if (valA) valA.textContent = "4";
      if (valB) valB.textContent = "6";
      currentState = LifecycleState.RESET;
      container.dispatchEvent(new CustomEvent("aasha:telemetry", { bubbles: true, detail: { eventType: "RESET", timestamp: Date.now() } }));
    },
    destroy: function() {
      running = false;
      if (animId) cancelAnimationFrame(animId);
      currentState = LifecycleState.DESTROYED;
    }
  };

  container.addEventListener("aasha:pause", function() {
    window.__AASSHA_EXPERIENCE_CONTRACT__.pause();
  });
  container.addEventListener("aasha:destroy", function() {
    window.__AASSHA_EXPERIENCE_CONTRACT__.destroy();
  });

  if (sliderA) {
    sliderA.addEventListener("input", function(e) {
      a = parseInt(e.target.value, 10);
      if (valA) valA.textContent = String(a);
      emitChange();
    });
  }

  if (sliderB) {
    sliderB.addEventListener("input", function(e) {
      b = parseInt(e.target.value, 10);
      if (valB) valB.textContent = String(b);
      emitChange();
    });
  }

  if (btnReset) {
    btnReset.addEventListener("click", function() {
      window.__AASSHA_EXPERIENCE_CONTRACT__.reset();
    });
  }

  renderLoop();
})();
`.trim();

    const cssCode = `
.openmaic-adapted-sim-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: 520px;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 12px;
  padding: 16px;
  box-sizing: border-box;
}
.openmaic-header {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
}
.openmaic-badge {
  font-size: 11px;
  font-weight: 700;
  color: #166534;
  background: #dcfce7;
  padding: 2px 8px;
  border-radius: 4px;
  align-self: flex-start;
}
.openmaic-controls {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}
.openmaic-slider {
  cursor: pointer;
}
.openmaic-btn-reset {
  min-width: 44px;
  min-height: 44px;
  padding: 6px 12px;
  background: #22c55e;
  color: #ffffff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
}
.openmaic-canvas {
  background: #ffffff;
  border: 1px solid #86efac;
  border-radius: 8px;
  touch-action: none;
}
`.trim();

    const fullContent = `${htmlFragment}\n${javascriptCode}\n${cssCode}`;
    const contentSha256 = ProvenanceTracker.computeContentHash(fullContent);

    const provenance = ProvenanceTracker.createRecord(
      this.providerId,
      'https://github.com/THU-MAIC/OpenMAIC',
      this.pinnedCommit,
      'MIT',
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
      stateSchema: {
        dimA: { type: 'number', default: 4 },
        dimB: { type: 'number', default: 6 },
        product: { type: 'number', default: 24 },
      },
      interactionSelectors: [
        `#slider-a-${req.experience_id}`,
        `#slider-b-${req.experience_id}`,
        `#btn-reset-${req.experience_id}`,
        `#canvas-${req.experience_id}`,
      ],
      offlineAssets: [],
      contentSha256,
      provenance,
      canonicalIrRefs: req.concept_ids,
      learningObjectiveRefs: req.learning_objective_ids,
      misconceptionRefs: req.misconception_ids,
    };
  }
}
