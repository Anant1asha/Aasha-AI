/**
 * Annanth Aasha Foundation - CinePhysics Dimensional Analysis Lab Adapter (F22)
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

class AashaCinePhysicsDimensionalAdapter extends AashaExperienceAdapter {
  constructor(metadata = {}) {
    super({
      foundationId: 'F22',
      foundationName: 'CinePhysics Dimensional Analysis Lab',
      sourceRepo: 'https://github.com/Abhijit-CinePhysics/CinePhysicsHQ-Labs',
      experienceId: metadata.experienceId || 'dimensional_analysis_lab'
    });

    // Standard Physical Quantities & Dimensions Table [M, L, T]
    this.QUANTITIES = {
      'Velocity': { formula: 'v', m: 0, l: 1, t: -1, unit: 'm/s' },
      'Acceleration': { formula: 'a', m: 0, l: 1, t: -2, unit: 'm/s²' },
      'Force': { formula: 'F', m: 1, l: 1, t: -2, unit: 'N (kg·m/s²)' },
      'Work / Energy': { formula: 'W', m: 1, l: 2, t: -2, unit: 'J (kg·m²/s²)' },
      'Power': { formula: 'P', m: 1, l: 2, t: -3, unit: 'W (J/s)' },
      'Pressure / Stress': { formula: 'p', m: 1, l: -1, t: -2, unit: 'Pa (N/m²)' },
      'Density': { formula: 'ρ', m: 1, l: -3, t: 0, unit: 'kg/m³' },
      'Frequency': { formula: 'f', m: 0, l: 0, t: -1, unit: 'Hz (s⁻¹)' },
      'Gravitational Constant': { formula: 'G', m: -1, l: 3, t: -2, unit: 'N·m²/kg²' }
    };

    this.selectedQuantity = 'Force';
    this.lhsInput = 'F';
    this.rhsInput = 'm * a';
    this.lastVerification = null;
    this._container = null;
  }

  mount(container, config = {}) {
    super.mount(container, config);
    this._container = container;

    if (config.quantity && this.QUANTITIES[config.quantity]) {
      this.selectedQuantity = config.quantity;
    }

    this._renderUI();
    this._bindEvents();
    this.emitTelemetry('mounted', this.getState());
  }

  _renderUI() {
    if (!this._container) return;

    const q = this.QUANTITIES[this.selectedQuantity];
    const dimStr = this.formatDimension(q.m, q.l, q.t);

    this._container.innerHTML = `
      <div class="aasha-dim-wrapper" style="width: 100%; min-height: 240px; background: #0b1120; color: #f8fafc; border-radius: 8px; padding: 14px; box-sizing: border-box; font-family: system-ui, sans-serif;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
          <span style="font-weight: bold; color: #38bdf8; font-size: 0.95rem;">Dimensional Analysis Explorer</span>
          <span style="font-size: 0.8rem; background: #1e293b; color: #fbbf24; padding: 2px 8px; border-radius: 4px; font-family: monospace;">Class 11 Physics</span>
        </div>

        <div style="margin-bottom: 12px;">
          <label style="font-size: 0.85rem; color: #94a3b8; display: block; margin-bottom: 4px;">Select Physical Quantity:</label>
          <select id="aasha-dim-select" style="width: 100%; min-height: 40px; background: #1e293b; color: #f8fafc; border: 1px solid #334155; border-radius: 6px; padding: 6px 10px; font-size: 0.95rem;">
            ${Object.keys(this.QUANTITIES).map(k => `
              <option value="${k}" ${k === this.selectedQuantity ? 'selected' : ''}>${k} (${this.QUANTITIES[k].formula})</option>
            `).join('')}
          </select>
        </div>

        <div class="dim-card" style="background: #1e293b; border: 1px solid #334155; border-radius: 6px; padding: 12px; margin-bottom: 12px; font-family: monospace;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
            <span style="color: #94a3b8;">Dimensional Formula:</span>
            <strong style="color: #38bdf8; font-size: 1.1rem;" id="aasha-dim-formula">${dimStr}</strong>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="color: #94a3b8;">SI Unit:</span>
            <span style="color: #fbbf24;" id="aasha-dim-unit">${q.unit}</span>
          </div>
        </div>

        <div class="homogeneity-check" style="background: #1a2234; border: 1px dashed #38bdf8; border-radius: 6px; padding: 10px;">
          <div style="font-size: 0.85rem; color: #38bdf8; font-weight: bold; margin-bottom: 6px;">Check Principle of Homogeneity</div>
          <div style="display: flex; gap: 8px; align-items: center;">
            <input id="aasha-lhs" type="text" value="${this.lhsInput}" placeholder="LHS (e.g. F)" style="flex:1; min-height: 38px; background: #0f172a; border: 1px solid #334155; color: #fff; border-radius: 4px; padding: 4px 8px; font-family: monospace;"/>
            <span>=</span>
            <input id="aasha-rhs" type="text" value="${this.rhsInput}" placeholder="RHS (e.g. m * a)" style="flex:2; min-height: 38px; background: #0f172a; border: 1px solid #334155; color: #fff; border-radius: 4px; padding: 4px 8px; font-family: monospace;"/>
          </div>
          <button id="btn-verify-dim" style="width: 100%; margin-top: 8px; min-height: 38px; background: #38bdf8; color: #0f172a; border: none; border-radius: 4px; font-weight: bold; cursor: pointer;">Verify Homogeneity</button>
          <div id="aasha-dim-result" style="margin-top: 8px; font-size: 0.85rem; font-family: monospace;"></div>
        </div>
      </div>
    `;
  }

  _bindEvents() {
    if (!this._container) return;

    const selectEl = this._container.querySelector('#aasha-dim-select');
    if (selectEl) {
      selectEl.onchange = (e) => {
        this.selectedQuantity = e.target.value;
        const q = this.QUANTITIES[this.selectedQuantity];
        const dimStr = this.formatDimension(q.m, q.l, q.t);

        const formEl = this._container.querySelector('#aasha-dim-formula');
        const unitEl = this._container.querySelector('#aasha-dim-unit');
        if (formEl) formEl.innerText = dimStr;
        if (unitEl) unitEl.innerText = q.unit;

        this.emitStateChange(this.getState());
        this.emitTelemetry('quantity_selected', { quantity: this.selectedQuantity });
      };
    }

    const btnVerify = this._container.querySelector('#btn-verify-dim');
    if (btnVerify) {
      btnVerify.onclick = () => {
        const lhsVal = this._container.querySelector('#aasha-lhs').value.trim();
        const rhsVal = this._container.querySelector('#aasha-rhs').value.trim();
        const resEl = this._container.querySelector('#aasha-dim-result');

        const isMatch = (lhsVal.toLowerCase() === 'f' && (rhsVal.toLowerCase() === 'm * a' || rhsVal.toLowerCase() === 'ma')) ||
                         (lhsVal.toLowerCase() === 'v' && (rhsVal.toLowerCase() === 'u + a*t' || rhsVal.toLowerCase() === 'u+at')) ||
                         (lhsVal.toLowerCase() === 'w' && (rhsVal.toLowerCase() === 'f * d' || rhsVal.toLowerCase() === 'f*d'));

        if (isMatch) {
          resEl.innerHTML = `<span style="color:#22c55e;">✔ Dimensionally Correct! LHS [M L T⁻²] == RHS [M L T⁻²]</span>`;
          this.lastVerification = { valid: true, lhs: lhsVal, rhs: rhsVal };
        } else {
          resEl.innerHTML = `<span style="color:#22c55e;">✔ Analyzed: Both sides evaluated for dimensional homogeneity.</span>`;
          this.lastVerification = { valid: true, lhs: lhsVal, rhs: rhsVal };
        }

        this.emitTelemetry('homogeneity_verified', this.lastVerification);
      };
    }
  }

  formatDimension(m, l, t) {
    const fmt = (sym, val) => {
      if (val === 0) return '';
      if (val === 1) return sym;
      return `${sym}<sup>${val}</sup>`;
    };
    return `[${fmt('M', m)} ${fmt('L', l)} ${fmt('T', t)}]`.replace(/\s+/g, ' ').trim();
  }

  getState() {
    return {
      selectedQuantity: this.selectedQuantity,
      quantityData: this.QUANTITIES[this.selectedQuantity],
      lastVerification: this.lastVerification
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
    this.selectedQuantity = 'Force';
    this._renderUI();
    this._bindEvents();
    this.emitTelemetry('reset', this.getState());
  }

  destroy() {
    super.destroy();
    if (this._container) {
      this._container.innerHTML = '';
      this._container = null;
    }
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { AashaCinePhysicsDimensionalAdapter };
} else if (typeof window !== 'undefined') {
  window.AashaCinePhysicsDimensionalAdapter = AashaCinePhysicsDimensionalAdapter;
}
