/**
 * Annanth Aasha Foundation - CinePhysics Vernier Caliper Lab Adapter (F21)
 * Provenance: CinePhysicsHQ-Labs (MIT License, Copyright 2026 Abhijit-CinePhysics)
 *
 * Implements Aasha Experience Contract:
 * - mount(container, config)
 * - getState()
 * - pause()
 * - resume()
 * - reset()
 * - destroy()
 * - emitTelemetry(eventType, payload)
 */

let AashaExperienceAdapter;
if (typeof require !== 'undefined') {
  try {
    const contract = require('../aasha_experience_contract.js');
    AashaExperienceAdapter = contract.AashaExperienceAdapter;
  } catch (e) {
    AashaExperienceAdapter = class {};
  }
} else if (typeof window !== 'undefined' && window.AashaExperienceAdapter) {
  AashaExperienceAdapter = window.AashaExperienceAdapter;
} else {
  AashaExperienceAdapter = class {};
}

class AashaCinePhysicsCaliperAdapter extends AashaExperienceAdapter {
  constructor(metadata = {}) {
    super({
      foundationId: 'F21',
      foundationName: 'CinePhysics Vernier Caliper Virtual Lab',
      sourceRepo: 'https://github.com/Abhijit-CinePhysics/CinePhysicsHQ-Labs',
      experienceId: metadata.experienceId || 'vernier_caliper_lab'
    });

    // Core Physical Constants (1 MSD = 1.0 mm, 1 VSD = 0.9 mm => LC = 0.1 mm)
    this.MSD_MM = 1.0;
    this.VSD_MM = 0.9;
    this.LEAST_COUNT_MM = 0.1;

    // Simulation State
    this.currentJawPosMm = 0;
    this.zeroErrorMm = 0;
    this.activeObjectSizeMm = 0;
    this.activeObjectName = "None";
    this.observations = [];

    // DOM references & listeners
    this._container = null;
    this._movablePart = null;
    this._isDragging = false;
    this._startClientX = 0;
    this._startJawPosMm = 0;
    this._boundMouseDown = null;
    this._boundMouseMove = null;
    this._boundMouseUp = null;
  }

  mount(container, config = {}) {
    super.mount(container, config);
    this._container = container;

    if (config.zeroErrorMm !== undefined) {
      this.zeroErrorMm = config.zeroErrorMm;
    }
    if (config.objectSizeMm !== undefined) {
      this.activeObjectSizeMm = config.objectSizeMm;
      this.activeObjectName = config.objectName || "Target Object";
    }

    this._renderUI();
    this._bindEvents();
    this.emitTelemetry('mounted', this.getState());
  }

  _renderUI() {
    if (!this._container) return;

    this._container.innerHTML = `
      <div class="aasha-caliper-wrapper" style="width: 100%; min-height: 240px; background: #121212; color: #e0e0e0; border-radius: 8px; padding: 12px; box-sizing: border-box; font-family: system-ui, sans-serif; position: relative;">
        <div class="caliper-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <span style="font-weight: bold; color: #00d2ff; font-size: 0.9rem;">Vernier Caliper Virtual Lab</span>
          <span style="font-family: monospace; font-size: 0.85rem; background: #1e1e1e; padding: 2px 8px; border-radius: 4px;">
            Zero Error: <strong id="aasha-ze-val">${(this.zeroErrorMm / 10).toFixed(2)}</strong> cm
          </span>
        </div>

        <div class="caliper-controls" style="display: flex; gap: 8px; margin-bottom: 12px; flex-wrap: wrap;">
          <button id="btn-zero-perfect" style="flex:1; min-height: 44px; background: #1e1e1e; color: #00d2ff; border: 1px solid #00d2ff; border-radius: 6px; font-weight: bold; cursor: pointer;">Perfect (0.00)</button>
          <button id="btn-zero-pos" style="flex:1; min-height: 44px; background: #1e1e1e; color: #00d2ff; border: 1px solid #00d2ff; border-radius: 6px; font-weight: bold; cursor: pointer;">+0.02 cm</button>
          <button id="btn-zero-neg" style="flex:1; min-height: 44px; background: #1e1e1e; color: #00d2ff; border: 1px solid #00d2ff; border-radius: 6px; font-weight: bold; cursor: pointer;">-0.03 cm</button>
        </div>

        <div class="caliper-workbench" style="width: 100%; background: #1a1a1a; border-radius: 6px; padding: 10px; display: flex; justify-content: center; align-items: center; overflow: hidden; position: relative;">
          <svg id="aasha-caliper-svg" viewBox="-10 -20 180 80" style="width: 100%; max-width: 600px; height: auto;">
            <!-- Fixed Main Scale -->
            <g id="fixed-part">
              <rect x="0" y="0" width="160" height="15" fill="#a0aab5" stroke="#555" stroke-width="0.5"/>
              <path d="M 0,15 L 0,40 L -4,40 L -8,15 Z" fill="#a0aab5"/>
              <g id="main-ticks">
                ${Array.from({length: 151}, (_, i) => {
                  let h = (i % 10 === 0) ? 7 : (i % 5 === 0 ? 5 : 3);
                  let txt = (i % 10 === 0) ? `<text x="${i}" y="12" font-size="3" font-family="monospace" text-anchor="middle">${i/10}</text>` : '';
                  return `<line x1="${i}" y1="0" x2="${i}" y2="${h}" stroke="#000" stroke-width="0.3"/>${txt}`;
                }).join('')}
              </g>
            </g>

            <!-- Movable Jaw Group -->
            <g id="aasha-movable-part" transform="translate(0, 0)" style="cursor: grab;">
              <rect x="0" y="-2" width="35" height="18" fill="#b0bac5" stroke="#444" stroke-width="0.5"/>
              <path d="M 0,15 L 0,40 L 4,40 L 8,15 Z" fill="#b0bac5"/>
              <g id="vernier-ticks" transform="translate(0, 15)">
                ${Array.from({length: 11}, (_, i) => {
                  let x = i * 0.9;
                  let h = (i === 0 || i === 5 || i === 10) ? -5 : -3;
                  return `<line id="aasha-vsd-${i}" x1="${x}" y1="0" x2="${x}" y2="${h}" stroke="#000" stroke-width="0.3"/>`;
                }).join('')}
              </g>
            </g>
          </svg>
        </div>

        <div class="caliper-readout" style="margin-top: 10px; background: #1e1e1e; padding: 10px; border-radius: 6px; display: flex; justify-content: space-around; font-family: monospace; font-size: 0.9rem;">
          <div>MSR: <strong id="aasha-msr-val" style="color:#00d2ff">0.0</strong> cm</div>
          <div>VSD: <strong id="aasha-vsd-val" style="color:#00d2ff">0</strong></div>
          <div>Reading: <strong id="aasha-total-val" style="color:#00d2ff">0.00</strong> cm</div>
        </div>
      </div>
    `;

    this._movablePart = this._container.querySelector('#aasha-movable-part');
    this.updateVisuals();
  }

  _bindEvents() {
    if (!this._container || !this._movablePart) return;

    this._boundMouseDown = (e) => {
      if (this.isPaused) return;
      this._isDragging = true;
      this._startClientX = e.clientX || (e.touches && e.touches[0].clientX) || 0;
      this._startJawPosMm = this.currentJawPosMm;
    };

    this._boundMouseMove = (e) => {
      if (!this._isDragging || this.isPaused) return;
      const clientX = e.clientX || (e.touches && e.touches[0].clientX) || 0;
      const deltaPx = clientX - this._startClientX;
      // Convert screen px to mm (approx 2px per mm in SVG viewbox)
      const deltaMm = deltaPx / 2.5;

      let newPos = this._startJawPosMm + deltaMm;
      if (newPos < this.activeObjectSizeMm) newPos = this.activeObjectSizeMm;
      if (newPos > 110) newPos = 110;
      if (newPos < 0) newPos = 0;

      this.currentJawPosMm = newPos;
      this.updateVisuals();
      this.emitStateChange(this.getState());
    };

    this._boundMouseUp = () => {
      if (this._isDragging) {
        this._isDragging = false;
        this.emitTelemetry('jaw_release', this.getState());
      }
    };

    this._movablePart.addEventListener('mousedown', this._boundMouseDown);
    this._movablePart.addEventListener('touchstart', this._boundMouseDown, { passive: true });

    window.addEventListener('mousemove', this._boundMouseMove);
    window.addEventListener('touchmove', this._boundMouseMove, { passive: true });
    window.addEventListener('mouseup', this._boundMouseUp);
    window.addEventListener('touchend', this._boundMouseUp);

    // Zero error controls
    const btnPerfect = this._container.querySelector('#btn-zero-perfect');
    const btnPos = this._container.querySelector('#btn-zero-pos');
    const btnNeg = this._container.querySelector('#btn-zero-neg');

    if (btnPerfect) btnPerfect.onclick = () => this.setZeroError(0);
    if (btnPos) btnPos.onclick = () => this.setZeroError(0.2);
    if (btnNeg) btnNeg.onclick = () => this.setZeroError(-0.3);
  }

  setZeroError(zeMm) {
    this.zeroErrorMm = zeMm;
    const zeDisplay = this._container.querySelector('#aasha-ze-val');
    if (zeDisplay) zeDisplay.innerText = (zeMm / 10).toFixed(2);
    this.updateVisuals();
    this.emitTelemetry('zero_error_change', { zeroErrorMm: zeMm });
  }

  calculateReading() {
    const displayPosMm = this.currentJawPosMm + this.zeroErrorMm;
    const msrMm = Math.floor(displayPosMm);

    let bestCoinciding = 0;
    let minDiff = 999;

    for (let i = 0; i <= 10; i++) {
      const vernierMarkAbs = displayPosMm + (i * this.VSD_MM);
      const closestMainMark = Math.round(vernierMarkAbs);
      const diff = Math.abs(vernierMarkAbs - closestMainMark);

      if (diff < minDiff) {
        minDiff = diff;
        bestCoinciding = i;
      }
    }

    const vsrMm = bestCoinciding * this.LEAST_COUNT_MM;
    const observedMm = msrMm + vsrMm;
    const correctedMm = observedMm - this.zeroErrorMm;

    return {
      msrCm: (msrMm / 10).toFixed(1),
      coincidingVSD: bestCoinciding,
      vsrCm: (vsrMm / 10).toFixed(3),
      observedCm: (observedMm / 10).toFixed(2),
      correctedCm: (correctedMm / 10).toFixed(2)
    };
  }

  updateVisuals() {
    if (!this._movablePart) return;

    const displayPosMm = this.currentJawPosMm + this.zeroErrorMm;
    this._movablePart.setAttribute('transform', `translate(${displayPosMm}, 0)`);

    const reading = this.calculateReading();

    const msrEl = this._container.querySelector('#aasha-msr-val');
    const vsdEl = this._container.querySelector('#aasha-vsd-val');
    const totalEl = this._container.querySelector('#aasha-total-val');

    if (msrEl) msrEl.innerText = reading.msrCm;
    if (vsdEl) vsdEl.innerText = reading.coincidingVSD;
    if (totalEl) totalEl.innerText = reading.observedCm;
  }

  getState() {
    return {
      jawPositionMm: this.currentJawPosMm,
      zeroErrorMm: this.zeroErrorMm,
      activeObjectName: this.activeObjectName,
      reading: this.calculateReading()
    };
  }

  pause() {
    super.pause();
    this.isPaused = true;
  }

  resume() {
    super.resume();
    this.isPaused = false;
  }

  reset() {
    this.currentJawPosMm = 0;
    this.zeroErrorMm = 0;
    this.updateVisuals();
    this.emitTelemetry('reset', this.getState());
  }

  destroy() {
    super.destroy();
    if (this._boundMouseMove) {
      window.removeEventListener('mousemove', this._boundMouseMove);
      window.removeEventListener('touchmove', this._boundMouseMove);
    }
    if (this._boundMouseUp) {
      window.removeEventListener('mouseup', this._boundMouseUp);
      window.removeEventListener('touchend', this._boundMouseUp);
    }
    if (this._container) {
      this._container.innerHTML = '';
      this._container = null;
    }
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { AashaCinePhysicsCaliperAdapter };
} else if (typeof window !== 'undefined') {
  window.AashaCinePhysicsCaliperAdapter = AashaCinePhysicsCaliperAdapter;
}
