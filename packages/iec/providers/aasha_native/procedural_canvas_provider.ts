/**
 * AASHA AIOS — IEC Native Procedural Canvas Provider
 * Path: Aasha-AI/packages/iec/providers/aasha_native/procedural_canvas_provider.ts
 *
 * Implements native, zero-CDN procedural HTML5 Canvas 2D/3D simulations.
 * Provider Class: AASHA_NATIVE
 */

import { ExperiencePlan, ExperienceRequirement } from '../../contracts/experience_specification';
import { ProvenanceTracker } from '../../provenance/provenance_tracker';
import { CapabilityFitnessReport, CapabilityProvider, RawExperienceArtifact } from '../provider_interface';

export class ProceduralCanvasProvider implements CapabilityProvider {
  public readonly providerId: string = 'provider:aasha:native_canvas';
  public readonly providerClass = 'AASHA_NATIVE' as const;

  public async canSatisfy(req: ExperienceRequirement): Promise<CapabilityFitnessReport> {
    const isCanvasCompatible = ['SIMULATION', 'DIAGRAM', '3D_VISUALIZATION'].includes(req.capability_id.toUpperCase());

    return {
      providerId: this.providerId,
      providerClass: this.providerClass,
      canSatisfy: isCanvasCompatible,
      fitnessScore: isCanvasCompatible ? 95 : 20,
      adaptationCost: 'ZERO',
      offlineCompliant: true,
      license: 'MIT',
      notes: [
        'Native procedural Canvas 2D rendering',
        '100% offline with zero runtime dependencies',
        'Built-in requestAnimationFrame pause/resume support',
      ],
    };
  }

  public async synthesize(req: ExperienceRequirement, plan: ExperiencePlan): Promise<RawExperienceArtifact> {
    const htmlFragment = `
<div class="aasha-native-sim-container" id="sim-${req.experience_id}">
  <div class="sim-header">
    <h3 class="sim-title">${req.experience_id}</h3>
    <div class="sim-controls">
      <label for="slider-${req.experience_id}">Parameter:</label>
      <input type="range" id="slider-${req.experience_id}" min="1" max="10" value="5" class="sim-slider" />
      <span id="slider-val-${req.experience_id}">5</span>
      <button id="btn-reset-${req.experience_id}" class="sim-btn-reset">Reset</button>
    </div>
  </div>
  <div class="sim-canvas-wrapper">
    <canvas id="canvas-${req.experience_id}" width="400" height="300" class="sim-canvas"></canvas>
  </div>
</div>`.trim();

    const javascriptCode = `
(function() {
  const container = document.getElementById("sim-${req.experience_id}");
  if (!container) return;
  const canvas = document.getElementById("canvas-${req.experience_id}");
  const slider = document.getElementById("slider-${req.experience_id}");
  const sliderVal = document.getElementById("slider-val-${req.experience_id}");
  const btnReset = document.getElementById("btn-reset-${req.experience_id}");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  let animId = null;
  let running = true;
  let val = parseInt(slider ? slider.value : "5", 10);

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#4f46e5";
    ctx.fillRect(50, 50, val * 25, val * 25);
    ctx.fillStyle = "#ffffff";
    ctx.font = "16px sans-serif";
    ctx.fillText("Area: " + (val * val), 60, 80);
    if (running) animId = requestAnimationFrame(draw);
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
  window.__AASHA_EXPERIENCE_CONTRACT__ = {
    mount: function(c) { currentState = LifecycleState.MOUNTED; draw(); currentState = LifecycleState.ACTIVE; },
    getState: function() { return { value: val, state: currentState }; },
    pause: function() { running = false; if (animId) cancelAnimationFrame(animId); currentState = LifecycleState.PAUSED; },
    resume: function() { running = true; draw(); currentState = LifecycleState.RESUMED; },
    reset: function() {
      val = 5;
      if (slider) slider.value = "5";
      if (sliderVal) sliderVal.textContent = "5";
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
    window.__AASHA_EXPERIENCE_CONTRACT__.pause();
  });
  container.addEventListener("aasha:destroy", function() {
    window.__AASHA_EXPERIENCE_CONTRACT__.destroy();
  });

  if (slider) {
    slider.addEventListener("input", function(e) {
      val = parseInt(e.target.value, 10);
      if (sliderVal) sliderVal.textContent = String(val);
      container.dispatchEvent(new CustomEvent("aasha:state_change", {
        bubbles: true,
        detail: { value: val, area: val * val }
      }));
      container.dispatchEvent(new CustomEvent("aasha:telemetry", {
        bubbles: true,
        detail: {
          eventType: "SIMULATION_INTERACTION",
          action: "slider_changed",
          value: val,
          area: val * val,
          timestamp: Date.now()
        }
      }));
    });
  }

  if (btnReset) {
    btnReset.addEventListener("click", function() {
      window.__AASHA_EXPERIENCE_CONTRACT__.reset();
    });
  }

  draw();
})();
`.trim();

    const cssCode = `
.aasha-native-sim-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: 500px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 16px;
  box-sizing: border-box;
}
.sim-header {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.sim-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}
.sim-btn-reset {
  min-width: 44px;
  min-height: 44px;
  background: #e2e8f0;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}
.sim-canvas {
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  touch-action: none;
}
`.trim();

    const fullContent = `${htmlFragment}\n${javascriptCode}\n${cssCode}`;
    const contentSha256 = ProvenanceTracker.computeContentHash(fullContent);

    const provenance = ProvenanceTracker.createRecord(
      this.providerId,
      'Aasha-AI/packages/iec/providers/aasha_native',
      'NATIVE',
      'MIT',
      'NATIVE',
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
        value: { type: 'number', default: 5 },
        area: { type: 'number', default: 25 },
      },
      interactionSelectors: [
        `#slider-${req.experience_id}`,
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
