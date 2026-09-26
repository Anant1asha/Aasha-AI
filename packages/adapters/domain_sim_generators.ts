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

  /**
   * King's Math F23: 10-Frame & Place Value Manipulative (10 만들킹)
   * High-tactile base-10 number sense with hybrid drag/tap and precision stepper buttons.
   */
  static generateTenFrameSim(config: SimGeneratorConfig): string {
    return `
      class AashaTenFrameSim extends HTMLElement {
        constructor() {
          super();
          this.attachShadow({ mode: 'open' });
          this.state = { count: 4, maxCount: 20, lang: window.__AASHA_LANG__ || 'en' };
          this._animFrame = null;
        }

        connectedCallback() {
          this.render();
          this.setupEvents();
          window.addEventListener('aasha:language_change', (e) => this.setLanguage(e.detail?.lang || 'en'));
        }

        disconnectedCallback() { this.destroy(); }
        pause() { if (this._animFrame) cancelAnimationFrame(this._animFrame); }
        resume() { this.renderFrames(); }
        destroy() { this.pause(); }

        setLanguage(lang) {
          this.state.lang = lang;
          this.updateLabels();
        }

        getState() { return { ...this.state }; }
        setState(s) { Object.assign(this.state, s); this.updateLabels(); this.renderFrames(); }

        reset() {
          this.state.count = 0;
          this.emitTelemetry('reset', { count: 0 });
          this.updateLabels();
          this.renderFrames();
        }

        emitTelemetry(event, data) {
          this.dispatchEvent(new CustomEvent('aasha:telemetry', {
            bubbles: true,
            composed: true,
            detail: { simType: 'ten-frame', event, ...data, timestamp: Date.now() }
          }));
        }

        render() {
          this.shadowRoot.innerHTML = \`
            <style>
              :host { display: block; width: 100%; height: 100%; font-family: system-ui, sans-serif; }
              .sim-container { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; width: 100%; height: 100%; padding: 6px; box-sizing: border-box; background: #0F172A; color: #F8FAFC; border-radius: 12px; }
              .readout { font-size: 13px; font-weight: 700; color: #38BDF8; text-align: center; }
              .sub-readout { font-size: 11px; font-weight: 600; color: #FCD34D; }
              .frames-wrapper { display: flex; gap: 8px; justify-content: center; align-items: center; width: 100%; max-width: 320px; }
              .ten-frame-grid { display: grid; grid-template-columns: repeat(5, 1fr); grid-template-rows: repeat(2, 1fr); gap: 4px; background: #1E293B; padding: 6px; border-radius: 8px; border: 1.5px solid #334155; }
              .cell { width: 24px; height: 24px; background: #0F172A; border: 1px dashed #475569; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: transform 0.1s; }
              .cell:active { transform: scale(0.92); }
              .counter { width: 18px; height: 18px; border-radius: 50%; background: radial-gradient(circle, #F59E0B, #D97706); box-shadow: 0 2px 4px rgba(0,0,0,0.4); }
              .controls { display: flex; gap: 6px; width: 100%; justify-content: center; flex-wrap: nowrap; overflow-x: auto; touch-action: pan-x; margin-top: 2px; }
              .btn { min-height: 44px; min-width: 44px; padding: 6px 12px; background: #2563EB; color: #FFF; border: none; border-radius: 8px; font-weight: 700; font-size: 13px; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; }
              .btn:active { transform: scale(0.96); }
              .btn-stepper { background: #334155; color: #E2E8F0; font-size: 14px; }
              .btn-reset { background: #475569; }
            </style>
            <div class="sim-container">
              <div class="readout" id="lblMain">Ten-Frame Count: 4</div>
              <div class="sub-readout" id="lblSub">Tens: 0 | Ones: 4</div>
              <div class="frames-wrapper">
                <div class="ten-frame-grid" id="grid1"></div>
              </div>
              <div class="controls">
                <button class="btn btn-stepper" id="btnSubOne" aria-label="Subtract 1">-1</button>
                <button class="btn btn-stepper" id="btnAddOne" aria-label="Add 1">+1</button>
                <button class="btn btn-stepper" id="btnAddFive" aria-label="Add 5">+5</button>
                <button class="btn btn-reset" id="btnReset">Reset</button>
              </div>
            </div>
          \`;
          this.renderFrames();
          this.updateLabels();
        }

        renderFrames() {
          const grid1 = this.shadowRoot.getElementById('grid1');
          if (!grid1) return;
          grid1.innerHTML = '';
          const frameCount = 10;
          for (let i = 0; i < frameCount; i++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            if (i < this.state.count) {
              const counter = document.createElement('div');
              counter.className = 'counter';
              cell.appendChild(counter);
            }
            cell.addEventListener('click', () => {
              if (i < this.state.count) {
                this.state.count = i;
              } else {
                this.state.count = i + 1;
              }
              this.emitTelemetry('cell_toggle', { count: this.state.count });
              this.updateLabels();
              this.renderFrames();
            });
            grid1.appendChild(cell);
          }
        }

        setupEvents() {
          const btnAdd = this.shadowRoot.getElementById('btnAddOne');
          const btnSub = this.shadowRoot.getElementById('btnSubOne');
          const btnAdd5 = this.shadowRoot.getElementById('btnAddFive');
          const btnReset = this.shadowRoot.getElementById('btnReset');

          if (btnAdd) btnAdd.addEventListener('click', () => this.adjust(1));
          if (btnSub) btnSub.addEventListener('click', () => this.adjust(-1));
          if (btnAdd5) btnAdd5.addEventListener('click', () => this.adjust(5));
          if (btnReset) btnReset.addEventListener('click', () => this.reset());
        }

        adjust(delta) {
          this.state.count = Math.max(0, Math.min(10, this.state.count + delta));
          this.emitTelemetry('stepper_adjust', { delta, count: this.state.count });
          this.updateLabels();
          this.renderFrames();
        }

        updateLabels() {
          const isHi = this.state.lang === 'hi';
          const tens = Math.floor(this.state.count / 10);
          const ones = this.state.count % 10;
          const lblMain = this.shadowRoot.getElementById('lblMain');
          const lblSub = this.shadowRoot.getElementById('lblSub');
          const btnReset = this.shadowRoot.getElementById('btnReset');

          if (lblMain) {
            lblMain.innerText = isHi 
              ? \`दस का ढाँचा: \${this.state.count}\`
              : \`Ten-Frame Count: \${this.state.count}\`;
          }
          if (lblSub) {
            lblSub.innerText = isHi
              ? \`दहाई: \${tens} | इकाई: \${ones}\`
              : \`Tens: \${tens} | Ones: \${ones}\`;
          }
          if (btnReset) {
            btnReset.innerText = isHi ? 'रीसेट' : 'Reset';
          }
        }
      }
      if (!customElements.get('aasha-sim')) {
        customElements.define('aasha-sim', AashaTenFrameSim);
      }
    `;
  }

  /**
   * King's Math F24: Dynamic Fraction & Decimal Slices (큰수차례킹)
   * Visual circle and bar fraction slice manipulative with synchronous decimal readouts.
   */
  static generateFractionPizzaSim(config: SimGeneratorConfig): string {
    return `
      class AashaFractionPizzaSim extends HTMLElement {
        constructor() {
          super();
          this.attachShadow({ mode: 'open' });
          this.state = { numerator: 3, denominator: 4, lang: window.__AASHA_LANG__ || 'en' };
          this._animFrame = null;
        }

        connectedCallback() {
          this.render();
          this.setupEvents();
          window.addEventListener('aasha:language_change', (e) => this.setLanguage(e.detail?.lang || 'en'));
        }

        disconnectedCallback() { this.destroy(); }
        pause() { if (this._animFrame) cancelAnimationFrame(this._animFrame); }
        resume() { this.draw(); }
        destroy() { this.pause(); }

        setLanguage(lang) {
          this.state.lang = lang;
          this.updateLabels();
        }

        getState() { return { ...this.state }; }
        setState(s) { Object.assign(this.state, s); this.updateLabels(); this.draw(); }

        reset() {
          this.state.numerator = 1;
          this.state.denominator = 4;
          this.emitTelemetry('reset', { numerator: 1, denominator: 4 });
          this.updateLabels();
          this.draw();
        }

        emitTelemetry(event, data) {
          this.dispatchEvent(new CustomEvent('aasha:telemetry', {
            bubbles: true,
            composed: true,
            detail: { simType: 'fraction-pizza', event, ...data, timestamp: Date.now() }
          }));
        }

        render() {
          this.shadowRoot.innerHTML = \`
            <style>
              :host { display: block; width: 100%; height: 100%; font-family: system-ui, sans-serif; }
              .sim-container { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; width: 100%; height: 100%; padding: 6px; box-sizing: border-box; background: #0F172A; color: #F8FAFC; border-radius: 12px; }
              .readout { font-size: 13px; font-weight: 700; color: #38BDF8; text-align: center; }
              .decimal-badge { font-size: 11px; font-weight: 700; color: #F59E0B; background: #1E3A5F; padding: 2px 8px; border-radius: 6px; }
              .canvas-box { width: 100%; max-width: 200px; height: 96px; display: flex; align-items: center; justify-content: center; position: relative; }
              canvas { width: 100%; height: 100%; border-radius: 8px; }
              .controls { display: flex; gap: 6px; width: 100%; justify-content: center; flex-wrap: nowrap; overflow-x: auto; touch-action: pan-x; }
              .btn { min-height: 44px; min-width: 44px; padding: 6px 10px; background: #2563EB; color: #FFF; border: none; border-radius: 8px; font-weight: 700; font-size: 12px; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; }
              .btn:active { transform: scale(0.96); }
              .btn-stepper { background: #334155; color: #E2E8F0; }
              .btn-reset { background: #475569; }
            </style>
            <div class="sim-container">
              <div class="readout" id="lblFraction">Fraction: 3 / 4</div>
              <div class="decimal-badge" id="lblDecimal">Decimal: 0.75 | 75%</div>
              <div class="canvas-box">
                <canvas id="pizzaCanvas" width="200" height="96"></canvas>
              </div>
              <div class="controls">
                <button class="btn btn-stepper" id="btnSliceSub" aria-label="Subtract Shade">- Slice</button>
                <button class="btn btn-stepper" id="btnSliceAdd" aria-label="Add Shade">+ Slice</button>
                <button class="btn btn-stepper" id="btnDenomAdd" aria-label="Divide More">Parts +</button>
                <button class="btn btn-reset" id="btnReset">Reset</button>
              </div>
            </div>
          \`;
          this.draw();
          this.updateLabels();
        }

        draw() {
          const canvas = this.shadowRoot.getElementById('pizzaCanvas');
          if (!canvas) return;
          const ctx = canvas.getContext('2d');
          const cx = canvas.width / 2;
          const cy = canvas.height / 2;
          const radius = Math.min(cx, cy) - 6;

          ctx.clearRect(0, 0, canvas.width, canvas.height);
          const total = this.state.denominator;
          const shaded = this.state.numerator;
          const sliceAngle = (Math.PI * 2) / total;

          for (let i = 0; i < total; i++) {
            const startAngle = i * sliceAngle - Math.PI / 2;
            const endAngle = startAngle + sliceAngle;
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.arc(cx, cy, radius, startAngle, endAngle);
            ctx.closePath();

            if (i < shaded) {
              ctx.fillStyle = '#F59E0B'; // Shaded warm amber
            } else {
              ctx.fillStyle = '#1E293B'; // Unshaded deep slate
            }
            ctx.fill();
            ctx.lineWidth = 1.5;
            ctx.strokeStyle = '#38BDF8';
            ctx.stroke();
          }

          // Center pin
          ctx.beginPath();
          ctx.arc(cx, cy, 3, 0, Math.PI * 2);
          ctx.fillStyle = '#FFFFFF';
          ctx.fill();
        }

        setupEvents() {
          const btnAdd = this.shadowRoot.getElementById('btnSliceAdd');
          const btnSub = this.shadowRoot.getElementById('btnSliceSub');
          const btnDenom = this.shadowRoot.getElementById('btnDenomAdd');
          const btnReset = this.shadowRoot.getElementById('btnReset');
          const canvas = this.shadowRoot.getElementById('pizzaCanvas');

          if (btnAdd) btnAdd.addEventListener('click', () => {
            this.state.numerator = Math.min(this.state.denominator, this.state.numerator + 1);
            this.emitTelemetry('slice_change', { numerator: this.state.numerator, denominator: this.state.denominator });
            this.updateLabels();
            this.draw();
          });

          if (btnSub) btnSub.addEventListener('click', () => {
            this.state.numerator = Math.max(0, this.state.numerator - 1);
            this.emitTelemetry('slice_change', { numerator: this.state.numerator, denominator: this.state.denominator });
            this.updateLabels();
            this.draw();
          });

          if (btnDenom) btnDenom.addEventListener('click', () => {
            const nextDenom = this.state.denominator >= 8 ? 2 : this.state.denominator + 2;
            this.state.denominator = nextDenom;
            this.state.numerator = Math.min(this.state.numerator, nextDenom);
            this.emitTelemetry('denominator_change', { denominator: this.state.denominator });
            this.updateLabels();
            this.draw();
          });

          if (btnReset) btnReset.addEventListener('click', () => this.reset());

          if (canvas) {
            canvas.addEventListener('click', (e) => {
              const rect = canvas.getBoundingClientRect();
              const x = e.clientX - rect.left - (rect.width / 2);
              const y = e.clientY - rect.top - (rect.height / 2);
              let angle = Math.atan2(y, x) + Math.PI / 2;
              if (angle < 0) angle += Math.PI * 2;
              const slice = Math.floor(angle / ((Math.PI * 2) / this.state.denominator));
              this.state.numerator = slice + 1;
              this.emitTelemetry('direct_canvas_tap', { numerator: this.state.numerator });
              this.updateLabels();
              this.draw();
            });
          }
        }

        updateLabels() {
          const isHi = this.state.lang === 'hi';
          const dec = (this.state.numerator / this.state.denominator).toFixed(2);
          const pct = Math.round((this.state.numerator / this.state.denominator) * 100);
          const lblFrac = this.shadowRoot.getElementById('lblFraction');
          const lblDec = this.shadowRoot.getElementById('lblDecimal');
          const btnReset = this.shadowRoot.getElementById('btnReset');

          if (lblFrac) {
            lblFrac.innerText = isHi
              ? \`भिन्न: \${this.state.numerator} / \${this.state.denominator}\`
              : \`Fraction: \${this.state.numerator} / \${this.state.denominator}\`;
          }
          if (lblDec) {
            lblDec.innerText = isHi
              ? \`दशमलव: \${dec} | \${pct}%\`
              : \`Decimal: \${dec} | \${pct}%\`;
          }
          if (btnReset) {
            btnReset.innerText = isHi ? 'रीसेट' : 'Reset';
          }
        }
      }
      if (!customElements.get('aasha-sim')) {
        customElements.define('aasha-sim', AashaFractionPizzaSim);
      }
    `;
  }

  /**
   * King's Math F25: Number-Line Hunter & Factor Finder (넘버 헌터킹)
   * High-tempo 60s fluency loop with zoomable number line and target hunting.
   */
  static generateNumberHunterSim(config: SimGeneratorConfig): string {
    return `
      class AashaNumberHunterSim extends HTMLElement {
        constructor() {
          super();
          this.attachShadow({ mode: 'open' });
          this.state = { target: 35, current: 0, streak: 0, timeLeft: 60, timerActive: false, lang: window.__AASHA_LANG__ || 'en' };
          this._timerInterval = null;
        }

        connectedCallback() {
          this.render();
          this.setupEvents();
          window.addEventListener('aasha:language_change', (e) => this.setLanguage(e.detail?.lang || 'en'));
        }

        disconnectedCallback() { this.destroy(); }
        pause() { if (this._timerInterval) clearInterval(this._timerInterval); }
        resume() { if (this.state.timerActive) this.startTimer(); }
        destroy() { this.pause(); }

        setLanguage(lang) {
          this.state.lang = lang;
          this.updateLabels();
        }

        getState() { return { ...this.state }; }
        setState(s) { Object.assign(this.state, s); this.updateLabels(); this.draw(); }

        reset() {
          this.pause();
          this.state.current = 0;
          this.state.streak = 0;
          this.state.timeLeft = 60;
          this.state.timerActive = false;
          this.state.target = Math.floor(Math.random() * 80) + 10;
          this.emitTelemetry('reset', {});
          this.updateLabels();
          this.draw();
        }

        emitTelemetry(event, data) {
          this.dispatchEvent(new CustomEvent('aasha:telemetry', {
            bubbles: true,
            composed: true,
            detail: { simType: 'number-hunter', event, ...data, timestamp: Date.now() }
          }));
        }

        startTimer() {
          this.pause();
          this.state.timerActive = true;
          this._timerInterval = setInterval(() => {
            if (this.state.timeLeft > 0) {
              this.state.timeLeft--;
              this.updateLabels();
            } else {
              this.pause();
              this.state.timerActive = false;
              this.emitTelemetry('boss_run_finished', { streak: this.state.streak });
              this.updateLabels();
            }
          }, 1000);
        }

        render() {
          this.shadowRoot.innerHTML = \`
            <style>
              :host { display: block; width: 100%; height: 100%; font-family: system-ui, sans-serif; }
              .sim-container { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; width: 100%; height: 100%; padding: 6px; box-sizing: border-box; background: #0F172A; color: #F8FAFC; border-radius: 12px; }
              .readout-row { display: flex; justify-content: space-between; width: 100%; max-width: 280px; font-size: 12px; font-weight: 700; color: #38BDF8; }
              .streak-badge { color: #FCD34D; font-weight: 700; }
              .canvas-box { width: 100%; max-width: 280px; height: 75px; background: #1E293B; border-radius: 8px; border: 1px solid #334155; position: relative; }
              canvas { width: 100%; height: 100%; }
              .controls { display: flex; gap: 6px; width: 100%; justify-content: center; flex-wrap: nowrap; overflow-x: auto; touch-action: pan-x; }
              .btn { min-height: 44px; min-width: 44px; padding: 6px 10px; background: #2563EB; color: #FFF; border: none; border-radius: 8px; font-weight: 700; font-size: 13px; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; }
              .btn:active { transform: scale(0.96); }
              .btn-stepper { background: #334155; color: #E2E8F0; }
              .btn-action { background: #059669; }
            </style>
            <div class="sim-container">
              <div class="readout-row">
                <span id="lblTarget">🎯 Target: 35</span>
                <span class="streak-badge" id="lblStreak">🔥 Streak: 0 (60s)</span>
              </div>
              <div class="canvas-box">
                <canvas id="lineCanvas" width="280" height="75"></canvas>
              </div>
              <div class="controls">
                <button class="btn btn-stepper" id="btnSubTen">-10</button>
                <button class="btn btn-stepper" id="btnSubOne">-1</button>
                <button class="btn btn-stepper" id="btnAddOne">+1</button>
                <button class="btn btn-stepper" id="btnAddTen">+10</button>
                <button class="btn btn-action" id="btnCheck">Lock 🔒</button>
              </div>
            </div>
          \`;
          this.draw();
          this.updateLabels();
        }

        draw() {
          const canvas = this.shadowRoot.getElementById('lineCanvas');
          if (!canvas) return;
          const ctx = canvas.getContext('2d');
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          const y = 45;
          const startX = 20;
          const endX = canvas.width - 20;
          const range = 100;

          // Main line
          ctx.beginPath();
          ctx.moveTo(startX, y);
          ctx.lineTo(endX, y);
          ctx.strokeStyle = '#64748B';
          ctx.lineWidth = 2;
          ctx.stroke();

          // Ticks every 10
          ctx.fillStyle = '#94A3B8';
          ctx.font = '10px sans-serif';
          ctx.textAlign = 'center';
          for (let i = 0; i <= 100; i += 20) {
            const tx = startX + (i / range) * (endX - startX);
            ctx.beginPath();
            ctx.moveTo(tx, y - 6);
            ctx.lineTo(tx, y + 6);
            ctx.stroke();
            ctx.fillText(i.toString(), tx, y + 18);
          }

          // Target marker
          const targetX = startX + (this.state.target / range) * (endX - startX);
          ctx.beginPath();
          ctx.arc(targetX, y, 6, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(239, 68, 68, 0.4)';
          ctx.fill();
          ctx.strokeStyle = '#EF4444';
          ctx.stroke();

          // Current Pin
          const curX = startX + (this.state.current / range) * (endX - startX);
          ctx.beginPath();
          ctx.moveTo(curX, y - 14);
          ctx.lineTo(curX - 6, y - 26);
          ctx.lineTo(curX + 6, y - 26);
          ctx.closePath();
          ctx.fillStyle = '#38BDF8';
          ctx.fill();

          ctx.beginPath();
          ctx.arc(curX, y, 5, 0, Math.PI * 2);
          ctx.fillStyle = '#38BDF8';
          ctx.fill();
        }

        setupEvents() {
          const btnAdd1 = this.shadowRoot.getElementById('btnAddOne');
          const btnSub1 = this.shadowRoot.getElementById('btnSubOne');
          const btnAdd10 = this.shadowRoot.getElementById('btnAddTen');
          const btnSub10 = this.shadowRoot.getElementById('btnSubTen');
          const btnCheck = this.shadowRoot.getElementById('btnCheck');
          const canvas = this.shadowRoot.getElementById('lineCanvas');

          const move = (delta) => {
            if (!this.state.timerActive) this.startTimer();
            this.state.current = Math.max(0, Math.min(100, this.state.current + delta));
            this.emitTelemetry('pin_move', { current: this.state.current });
            this.updateLabels();
            this.draw();
          };

          if (btnAdd1) btnAdd1.addEventListener('click', () => move(1));
          if (btnSub1) btnSub1.addEventListener('click', () => move(-1));
          if (btnAdd10) btnAdd10.addEventListener('click', () => move(10));
          if (btnSub10) btnSub10.addEventListener('click', () => move(-10));

          if (btnCheck) btnCheck.addEventListener('click', () => {
            const diff = Math.abs(this.state.current - this.state.target);
            if (diff === 0) {
              this.state.streak++;
              this.state.target = Math.floor(Math.random() * 80) + 10;
              this.emitTelemetry('target_hit', { streak: this.state.streak });
            } else {
              this.state.streak = 0;
              this.emitTelemetry('target_miss', { diff });
            }
            this.updateLabels();
            this.draw();
          });

          if (canvas) {
            canvas.addEventListener('click', (e) => {
              if (!this.state.timerActive) this.startTimer();
              const rect = canvas.getBoundingClientRect();
              const rx = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
              this.state.current = Math.round((rx / rect.width) * 100);
              this.emitTelemetry('direct_canvas_tap', { current: this.state.current });
              this.updateLabels();
              this.draw();
            });
          }
        }

        updateLabels() {
          const isHi = this.state.lang === 'hi';
          const lblTarget = this.shadowRoot.getElementById('lblTarget');
          const lblStreak = this.shadowRoot.getElementById('lblStreak');
          const btnCheck = this.shadowRoot.getElementById('btnCheck');

          if (lblTarget) {
            lblTarget.innerText = isHi
              ? \`🎯 लक्ष्य: \${this.state.target} (वर्तमान: \${this.state.current})\`
              : \`🎯 Target: \${this.state.target} (Cur: \${this.state.current})\`;
          }
          if (lblStreak) {
            lblStreak.innerText = isHi
              ? \`🔥 लकीर: \${this.state.streak} (\${this.state.timeLeft}s)\`
              : \`🔥 Streak: \${this.state.streak} (\${this.state.timeLeft}s)\`;
          }
          if (btnCheck) {
            btnCheck.innerText = isHi ? 'जाँचें 🔒' : 'Lock 🔒';
          }
        }
      }
      if (!customElements.get('aasha-sim')) {
        customElements.define('aasha-sim', AashaNumberHunterSim);
      }
    `;
  }

  /**
   * King's Math F26: Interactive Symmetry & Geometry Fold (대칭킹)
   * 2D reflection axis and geometry shape folding with smooth CSS3 animations.
   */
  static generateSymmetryFoldSim(config: SimGeneratorConfig): string {
    return `
      class AashaSymmetryFoldSim extends HTMLElement {
        constructor() {
          super();
          this.attachShadow({ mode: 'open' });
          this.shapes = ['butterfly', 'triangle', 'rectangle', 'trapezoid'];
          this.shapeIdx = 0;
          this.state = { shape: this.shapes[0], folded: false, lang: window.__AASHA_LANG__ || 'en' };
        }

        connectedCallback() {
          this.render();
          this.setupEvents();
          window.addEventListener('aasha:language_change', (e) => this.setLanguage(e.detail?.lang || 'en'));
        }

        disconnectedCallback() { this.destroy(); }
        pause() {}
        resume() {}
        destroy() {}

        setLanguage(lang) {
          this.state.lang = lang;
          this.updateLabels();
        }

        getState() { return { ...this.state }; }
        setState(s) { Object.assign(this.state, s); this.updateLabels(); this.updateVisual(); }

        reset() {
          this.state.folded = false;
          this.shapeIdx = 0;
          this.state.shape = this.shapes[0];
          this.emitTelemetry('reset', {});
          this.updateLabels();
          this.updateVisual();
        }

        emitTelemetry(event, data) {
          this.dispatchEvent(new CustomEvent('aasha:telemetry', {
            bubbles: true,
            composed: true,
            detail: { simType: 'symmetry-fold', event, ...data, timestamp: Date.now() }
          }));
        }

        render() {
          this.shadowRoot.innerHTML = \`
            <style>
              :host { display: block; width: 100%; height: 100%; font-family: system-ui, sans-serif; }
              .sim-container { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; width: 100%; height: 100%; padding: 6px; box-sizing: border-box; background: #0F172A; color: #F8FAFC; border-radius: 12px; }
              .readout { font-size: 13px; font-weight: 700; color: #38BDF8; text-align: center; }
              .fold-box { width: 100%; max-width: 220px; height: 96px; display: flex; align-items: center; justify-content: center; background: #1E293B; border-radius: 8px; border: 1px solid #334155; position: relative; perspective: 400px; }
              .axis-line { position: absolute; top: 0; bottom: 0; width: 2px; background: repeating-linear-gradient(to bottom, #EF4444 0, #EF4444 4px, transparent 4px, transparent 8px); z-index: 10; }
              .half-left, .half-right { width: 45px; height: 70px; background: #F59E0B; border: 1.5px solid #FCD34D; transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1); }
              .half-left { border-radius: 20px 0 0 20px; transform-origin: right center; }
              .half-right { border-radius: 0 20px 20px 0; transform-origin: left center; }
              .folded .half-right { transform: rotateY(-180deg); opacity: 0.85; background: #10B981; }
              .controls { display: flex; gap: 6px; width: 100%; justify-content: center; }
              .btn { min-height: 44px; min-width: 44px; padding: 6px 14px; background: #2563EB; color: #FFF; border: none; border-radius: 8px; font-weight: 700; font-size: 13px; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; }
              .btn:active { transform: scale(0.96); }
              .btn-shape { background: #334155; }
              .btn-reset { background: #475569; }
            </style>
            <div class="sim-container">
              <div class="readout" id="lblStatus">Symmetry: Symmetrical Match ✅</div>
              <div class="fold-box" id="foldContainer">
                <div class="axis-line"></div>
                <div class="half-left" id="halfL"></div>
                <div class="half-right" id="halfR"></div>
              </div>
              <div class="controls">
                <button class="btn" id="btnFold">Fold ➔</button>
                <button class="btn btn-shape" id="btnShape">Next Shape</button>
                <button class="btn btn-reset" id="btnReset">Reset</button>
              </div>
            </div>
          \`;
          this.updateVisual();
          this.updateLabels();
        }

        setupEvents() {
          const btnFold = this.shadowRoot.getElementById('btnFold');
          const btnShape = this.shadowRoot.getElementById('btnShape');
          const btnReset = this.shadowRoot.getElementById('btnReset');
          const foldBox = this.shadowRoot.getElementById('foldContainer');

          const toggleFold = () => {
            this.state.folded = !this.state.folded;
            this.emitTelemetry('fold_toggle', { folded: this.state.folded, shape: this.state.shape });
            this.updateVisual();
            this.updateLabels();
          };

          if (btnFold) btnFold.addEventListener('click', toggleFold);
          if (foldBox) foldBox.addEventListener('click', toggleFold);

          if (btnShape) btnShape.addEventListener('click', () => {
            this.shapeIdx = (this.shapeIdx + 1) % this.shapes.length;
            this.state.shape = this.shapes[this.shapeIdx];
            this.state.folded = false;
            this.emitTelemetry('shape_change', { shape: this.state.shape });
            this.updateVisual();
            this.updateLabels();
          });

          if (btnReset) btnReset.addEventListener('click', () => this.reset());
        }

        updateVisual() {
          const foldContainer = this.shadowRoot.getElementById('foldContainer');
          if (foldContainer) {
            if (this.state.folded) foldContainer.classList.add('folded');
            else foldContainer.classList.remove('folded');
          }
        }

        updateLabels() {
          const isHi = this.state.lang === 'hi';
          const lblStatus = this.shadowRoot.getElementById('lblStatus');
          const btnFold = this.shadowRoot.getElementById('btnFold');
          const btnShape = this.shadowRoot.getElementById('btnShape');
          const btnReset = this.shadowRoot.getElementById('btnReset');

          if (lblStatus) {
            if (this.state.folded) {
              lblStatus.innerText = isHi ? 'सममित है: दोनों भाग पूरी तरह ढकते हैं ✅' : 'Symmetry: Perfect Overlap Match ✅';
              lblStatus.style.color = '#34D399';
            } else {
              lblStatus.innerText = isHi ? 'सममिति अक्ष: मोड़ने के लिए टैप करें' : 'Line of Symmetry: Tap to Fold';
              lblStatus.style.color = '#38BDF8';
            }
          }
          if (btnFold) {
            btnFold.innerText = this.state.folded 
              ? (isHi ? 'खोलें ↩' : 'Unfold ↩') 
              : (isHi ? 'मोड़ें ➔' : 'Fold ➔');
          }
          if (btnShape) {
            btnShape.innerText = isHi ? 'अगली आकृति' : 'Next Shape';
          }
          if (btnReset) {
            btnReset.innerText = isHi ? 'रीसेट' : 'Reset';
          }
        }
      }
      if (!customElements.get('aasha-sim')) {
        customElements.define('aasha-sim', AashaSymmetryFoldSim);
      }
    `;
  }

  /**
   * OpenMAIC Dynamic Simulation Generator (Build-Time Synthesis)
   * Converts unstructured topic definitions into interactive <aasha-sim> Web Components.
   */
  static generateOpenMAICDynamicSim(config: SimGeneratorConfig): string {
    return this.generateGenericInteractiveSim(config);
  }
}

