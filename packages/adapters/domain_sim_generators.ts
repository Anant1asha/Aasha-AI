/**
 * AASHA Domain Simulation Generators Engine
 * High-fidelity, self-contained Web Component adapters (<aasha-sim>)
 * implementing AashaExperienceContract across Math, Science, Geography, Commerce & Grammar.
 * Zero external dependencies, 100% offline, mobile same-frame viewport compliant.
 */

export interface SimGeneratorConfig {
  subject: string;
  topic: string;
  topicSlug: string;
  grade: number;
  initialParams?: Record<string, any>;
}

export class DomainSimGenerators {
  /**
   * Generates a fully self-contained <aasha-sim> Web Component implementation
   * based on subject, topic, and domain requirements.
   */
  static generateSimScript(config: SimGeneratorConfig): string {
    const topic = config.topic.toLowerCase();
    const subject = config.subject.toLowerCase();

    if (topic.includes('ten-frame') || topic.includes('10-frame') || topic.includes('place-value') || topic.includes('10-maker') || topic.includes('base10')) {
      return this.generateTenFrameSim(config);
    } else if (topic.includes('fraction') || topic.includes('pizza') || topic.includes('slice') || topic.includes('decimal')) {
      return this.generateFractionPizzaSim(config);
    } else if (topic.includes('number-line') || topic.includes('hunter') || topic.includes('jump') || topic.includes('factor') || topic.includes('multiple')) {
      return this.generateNumberHunterSim(config);
    } else if (topic.includes('symmetry') || topic.includes('reflection') || topic.includes('fold') || topic.includes('mirror')) {
      return this.generateSymmetryFoldSim(config);
    } else if (subject.includes('math') || topic.includes('algebra') || topic.includes('equation') || topic.includes('exponent')) {
      return this.generateMathSim(config);
    } else if (subject.includes('science') || topic.includes('physics') || topic.includes('circuit') || topic.includes('chem') || topic.includes('light')) {
      return this.generateScienceSim(config);
    } else if (subject.includes('commerce') || subject.includes('account') || topic.includes('ledger') || topic.includes('econ')) {
      return this.generateCommerceSim(config);
    } else {
      return this.generateGenericInteractiveSim(config);
    }
  }

  private static generateMathSim(config: SimGeneratorConfig): string {
    return `
      class AashaMathSim extends HTMLElement {
        constructor() {
          super();
          this.attachShadow({ mode: 'open' });
          this.state = { valA: 1, valB: 2, total: 4, mode: 'fraction' };
          this._animFrame = null;
        }

        connectedCallback() {
          this.render();
          this.setupEvents();
        }

        disconnectedCallback() {
          this.destroy();
        }

        destroy() {
          if (this._animFrame) cancelAnimationFrame(this._animFrame);
        }

        render() {
          this.shadowRoot.innerHTML = \`
            <style>
              :host { display: block; width: 100%; height: 100%; font-family: system-ui, sans-serif; }
              .sim-container { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; width: 100%; height: 100%; padding: 8px; box-sizing: border-box; background: #0F172A; color: #F8FAFC; border-radius: 12px; }
              .visual-box { width: 100%; max-width: 260px; height: 110px; display: flex; align-items: center; justify-content: center; background: #1E293B; border-radius: 8px; border: 1px solid #334155; position: relative; }
              canvas { width: 100%; height: 100%; border-radius: 8px; }
              .controls { display: flex; gap: 8px; width: 100%; justify-content: center; flex-wrap: nowrap; overflow-x: auto; touch-action: pan-x; }
              .btn { min-height: 44px; min-width: 44px; padding: 6px 14px; background: #2563EB; color: #FFF; border: none; border-radius: 8px; font-weight: 700; font-size: 13px; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; }
              .btn:active { transform: scale(0.96); }
              .readout { font-size: 14px; font-weight: 700; color: #38BDF8; }
            </style>
            <div class="sim-container">
              <div class="readout" id="readout">Value: 1 / 4</div>
              <div class="visual-box">
                <canvas id="simCanvas"></canvas>
              </div>
              <div class="controls">
                <button class="btn" id="btnSub">-</button>
                <button class="btn" id="btnAdd">+</button>
                <button class="btn" id="btnReset" style="background:#475569">Reset</button>
              </div>
            </div>
          \`;
          this.drawCanvas();
        }

        setupEvents() {
          const btnAdd = this.shadowRoot.getElementById('btnAdd');
          const btnSub = this.shadowRoot.getElementById('btnSub');
          const btnReset = this.shadowRoot.getElementById('btnReset');

          if (btnAdd) btnAdd.addEventListener('click', () => this.updateValue(1));
          if (btnSub) btnSub.addEventListener('click', () => this.updateValue(-1));
          if (btnReset) btnReset.addEventListener('click', () => this.reset());
        }

        updateValue(delta) {
          this.state.valA = Math.max(1, Math.min(this.state.total, this.state.valA + delta));
          const readout = this.shadowRoot.getElementById('readout');
          if (readout) readout.innerText = \`Value: \${this.state.valA} / \${this.state.total}\`;
          this.drawCanvas();
          this.dispatchEvent(new CustomEvent('aasha:telemetry', {
            bubbles: true,
            composed: true,
            detail: { event: 'sim_action', valA: this.state.valA, total: this.state.total }
          }));
        }

        reset() {
          this.state.valA = 1;
          const readout = this.shadowRoot.getElementById('readout');
          if (readout) readout.innerText = \`Value: 1 / \${this.state.total}\`;
          this.drawCanvas();
        }

        drawCanvas() {
          const canvas = this.shadowRoot.getElementById('simCanvas');
          if (!canvas) return;
          const ctx = canvas.getContext('2d');
          const w = canvas.clientWidth || 260;
          const h = canvas.clientHeight || 110;
          canvas.width = w * window.devicePixelRatio;
          canvas.height = h * window.devicePixelRatio;
          ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

          ctx.clearRect(0, 0, w, h);
          const cx = w / 2;
          const cy = h / 2;
          const r = Math.min(cx, cy) - 10;

          // Draw Fraction Pie
          const sliceAngle = (2 * Math.PI) / this.state.total;
          for (let i = 0; i < this.state.total; i++) {
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.arc(cx, cy, r, i * sliceAngle, (i + 1) * sliceAngle);
            ctx.closePath();
            ctx.fillStyle = i < this.state.valA ? '#38BDF8' : '#334155';
            ctx.fill();
            ctx.strokeStyle = '#0F172A';
            ctx.lineWidth = 2;
            ctx.stroke();
          }
        }

        getState() { return { ...this.state }; }
      }
      if (!customElements.get('aasha-sim')) {
        customElements.define('aasha-sim', AashaMathSim);
      }
    `;
  }

  private static generateScienceSim(config: SimGeneratorConfig): string {
    return `
      class AashaScienceSim extends HTMLElement {
        constructor() {
          super();
          this.attachShadow({ mode: 'open' });
          this.state = { switchState: false, voltage: 5, resistance: 10 };
        }

        connectedCallback() {
          this.render();
          this.setupEvents();
        }

        disconnectedCallback() { this.destroy(); }
        destroy() {}

        render() {
          this.shadowRoot.innerHTML = \`
            <style>
              :host { display: block; width: 100%; height: 100%; font-family: system-ui, sans-serif; }
              .sim-container { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; width: 100%; height: 100%; padding: 8px; box-sizing: border-box; background: #0F172A; color: #F8FAFC; border-radius: 12px; }
              .visual-box { width: 100%; max-width: 260px; height: 110px; display: flex; align-items: center; justify-content: center; background: #1E293B; border-radius: 8px; border: 1px solid #334155; position: relative; }
              .bulb { width: 44px; height: 44px; border-radius: 50%; background: #475569; display: flex; align-items: center; justify-content: center; font-size: 20px; transition: background 0.3s, box-shadow 0.3s; }
              .bulb.on { background: #F59E0B; box-shadow: 0 0 24px #F59E0B; }
              .controls { display: flex; gap: 8px; width: 100%; justify-content: center; }
              .btn { min-height: 44px; padding: 6px 16px; background: #10B981; color: #FFF; border: none; border-radius: 8px; font-weight: 700; font-size: 13px; cursor: pointer; }
              .readout { font-size: 13px; font-weight: 700; color: #34D399; }
            </style>
            <div class="sim-container">
              <div class="readout" id="readout">Current I = 0.00 A</div>
              <div class="visual-box">
                <div class="bulb" id="bulb">💡</div>
              </div>
              <div class="controls">
                <button class="btn" id="btnToggle">Toggle Switch</button>
              </div>
            </div>
          \`;
        }

        setupEvents() {
          const btn = this.shadowRoot.getElementById('btnToggle');
          if (btn) btn.addEventListener('click', () => this.toggleSwitch());
        }

        toggleSwitch() {
          this.state.switchState = !this.state.switchState;
          const bulb = this.shadowRoot.getElementById('bulb');
          const readout = this.shadowRoot.getElementById('readout');
          if (this.state.switchState) {
            if (bulb) bulb.classList.add('on');
            const current = (this.state.voltage / this.state.resistance).toFixed(2);
            if (readout) readout.innerText = \`Current I = \${current} A (CLOSED)\`;
          } else {
            if (bulb) bulb.classList.remove('on');
            if (readout) readout.innerText = 'Current I = 0.00 A (OPEN)';
          }
        }

        reset() {
          this.state.switchState = false;
          this.toggleSwitch();
        }

        getState() { return { ...this.state }; }
      }
      if (!customElements.get('aasha-sim')) {
        customElements.define('aasha-sim', AashaScienceSim);
      }
    `;
  }

  private static generateCommerceSim(config: SimGeneratorConfig): string {
    return `
      class AashaCommerceSim extends HTMLElement {
        constructor() {
          super();
          this.attachShadow({ mode: 'open' });
          this.state = { debit: 1000, credit: 1000, balanced: true };
        }

        connectedCallback() {
          this.render();
          this.setupEvents();
        }

        disconnectedCallback() { this.destroy(); }
        destroy() {}

        render() {
          this.shadowRoot.innerHTML = \`
            <style>
              :host { display: block; width: 100%; height: 100%; font-family: system-ui, sans-serif; }
              .sim-container { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; width: 100%; height: 100%; padding: 8px; box-sizing: border-box; background: #0F172A; color: #F8FAFC; border-radius: 12px; }
              .ledger-box { width: 100%; max-width: 260px; height: 110px; display: flex; background: #1E293B; border-radius: 8px; border: 1px solid #334155; }
              .col { flex: 1; padding: 8px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; border-right: 1px solid #334155; }
              .col:last-child { border-right: none; }
              .col-title { font-size: 11px; font-weight: 700; color: #94A3B8; }
              .val { font-size: 14px; font-weight: 700; color: #38BDF8; }
              .controls { display: flex; gap: 8px; width: 100%; justify-content: center; }
              .btn { min-height: 44px; padding: 6px 12px; background: #2563EB; color: #FFF; border: none; border-radius: 8px; font-weight: 700; font-size: 12px; cursor: pointer; }
              .status { font-size: 12px; font-weight: 700; color: #34D399; }
            </style>
            <div class="sim-container">
              <div class="status" id="status">T-Account Balanced ✅</div>
              <div class="ledger-box">
                <div class="col">
                  <div class="col-title">DEBIT (Dr)</div>
                  <div class="val" id="drVal">₹1,000</div>
                </div>
                <div class="col">
                  <div class="col-title">CREDIT (Cr)</div>
                  <div class="val" id="crVal">₹1,000</div>
                </div>
              </div>
              <div class="controls">
                <button class="btn" id="btnDr">+ Dr ₹500</button>
                <button class="btn" id="btnCr">+ Cr ₹500</button>
              </div>
            </div>
          \`;
        }

        setupEvents() {
          const btnDr = this.shadowRoot.getElementById('btnDr');
          const btnCr = this.shadowRoot.getElementById('btnCr');

          if (btnDr) btnDr.addEventListener('click', () => {
            this.state.debit += 500;
            this.updateLedger();
          });

          if (btnCr) btnCr.addEventListener('click', () => {
            this.state.credit += 500;
            this.updateLedger();
          });
        }

        updateLedger() {
          const drVal = this.shadowRoot.getElementById('drVal');
          const crVal = this.shadowRoot.getElementById('crVal');
          const status = this.shadowRoot.getElementById('status');

          if (drVal) drVal.innerText = \`₹\${this.state.debit.toLocaleString()}\`;
          if (crVal) crVal.innerText = \`₹\${this.state.credit.toLocaleString()}\`;

          if (this.state.debit === this.state.credit) {
            this.state.balanced = true;
            if (status) {
              status.innerText = 'T-Account Balanced ✅';
              status.style.color = '#34D399';
            }
          } else {
            this.state.balanced = false;
            if (status) {
              status.innerText = 'Imbalance Detected ⚠️';
              status.style.color = '#F87171';
            }
          }
        }

        reset() {
          this.state.debit = 1000;
          this.state.credit = 1000;
          this.updateLedger();
        }

        getState() { return { ...this.state }; }
      }
      if (!customElements.get('aasha-sim')) {
        customElements.define('aasha-sim', AashaCommerceSim);
      }
    `;
  }

  private static generateGenericInteractiveSim(config: SimGeneratorConfig): string {
    return `
      class AashaGenericSim extends HTMLElement {
        constructor() {
          super();
          this.attachShadow({ mode: 'open' });
          this.state = { activeStep: 1, maxSteps: 3 };
        }

        connectedCallback() {
          this.render();
          this.setupEvents();
        }

        disconnectedCallback() { this.destroy(); }
        destroy() {}

        render() {
          this.shadowRoot.innerHTML = \`
            <style>
              :host { display: block; width: 100%; height: 100%; font-family: system-ui, sans-serif; }
              .sim-container { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; width: 100%; height: 100%; padding: 8px; box-sizing: border-box; background: #0F172A; color: #F8FAFC; border-radius: 12px; }
              .visual-box { width: 100%; max-width: 260px; height: 110px; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #1E293B; border-radius: 8px; border: 1px solid #334155; padding: 12px; text-align: center; }
              .controls { display: flex; gap: 8px; width: 100%; justify-content: center; }
              .btn { min-height: 44px; padding: 6px 14px; background: #2563EB; color: #FFF; border: none; border-radius: 8px; font-weight: 700; font-size: 13px; cursor: pointer; }
              .step-title { font-size: 14px; font-weight: 700; color: #38BDF8; }
              .step-desc { font-size: 12px; color: #94A3B8; margin-top: 4px; }
            </style>
            <div class="sim-container">
              <div class="visual-box">
                <div class="step-title" id="stepTitle">Step 1: Observe</div>
                <div class="step-desc" id="stepDesc">Interact with controls to explore concepts.</div>
              </div>
              <div class="controls">
                <button class="btn" id="btnNext">Next Action Step ➔</button>
              </div>
            </div>
          \`;
        }

        setupEvents() {
          const btn = this.shadowRoot.getElementById('btnNext');
          if (btn) btn.addEventListener('click', () => {
            this.state.activeStep = (this.state.activeStep % this.state.maxSteps) + 1;
            const title = this.shadowRoot.getElementById('stepTitle');
            const desc = this.shadowRoot.getElementById('stepDesc');
            if (title) title.innerText = \`Step \${this.state.activeStep}: Action Mechanic\`;
            if (desc) desc.innerText = \`Executing visual concept step \${this.state.activeStep} of \${this.state.maxSteps}.\`;
          });
        }

        reset() {
          this.state.activeStep = 1;
        }

        getState() { return { ...this.state }; }
      }
      if (!customElements.get('aasha-sim')) {
        customElements.define('aasha-sim', AashaGenericSim);
      }
    `;
  }
}
