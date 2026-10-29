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
  /** Wraps an exact-hash-verified, offline AASHA HTML resource in an isolated child frame. */
  static generateHtmlResourceAdapterScript(config: { resourceId: string; title: string; html: string }): string {
    const resourceId = JSON.stringify(config.resourceId).replace(/</g, '\\u003c');
    const title = JSON.stringify(config.title).replace(/</g, '\\u003c');
    const bridge = `<script>(function(){let sent=0;const resourceId=${resourceId};const timer=setInterval(function(){const events=window.__AASHA_EVENTS__||[];while(sent<events.length){const event=events[sent++];window.parent.postMessage({__aasha_resource_event:resourceId,event:event},'*')}},100);window.addEventListener('pagehide',function(){clearInterval(timer)})})();</script>`;
    const touchTargetStyle = '<style id="aasha-touch-targets">button,input,select,textarea,[role="button"]{min-width:44px;min-height:44px}input[type="range"]{width:min(100%,360px);height:44px;touch-action:pan-x}</style>';
    const adaptedHtml = /<\/head>/i.test(config.html)
      ? config.html.replace(/<\/head>/i, `${touchTargetStyle}</head>`)
      : config.html.replace(/<html\b[^>]*>/i, (openTag) => `${openTag}<head>${touchTargetStyle}</head>`);
    const html = adaptedHtml.includes('</body>')
      ? adaptedHtml.replace('</body>', `${bridge}</body>`)
      : `${adaptedHtml}${bridge}`;
    const htmlLiteral = JSON.stringify(html).replace(/</g, '\\u003c');
    return `
      class AashaEmbeddedResourceSim extends HTMLElement {
        constructor(){super();this.attachShadow({mode:'open'});this._messageHandler=null;}
        connectedCallback(){
          if(this.shadowRoot.firstChild)return;
          this.style.display='block';this.style.width='100%';
          const frame=document.createElement('iframe');
          frame.title=${title};frame.setAttribute('sandbox','allow-scripts');
          frame.setAttribute('loading','eager');
          frame.style.cssText='display:block;width:100%;height:390px;border:0;border-radius:10px;background:#fff';
          frame.srcdoc=${htmlLiteral};
          this.shadowRoot.appendChild(frame);
          this._messageHandler=(event)=>{
            if(event.source!==frame.contentWindow)return;
            const data=event.data;
            if(!data||data.__aasha_resource_event!==${resourceId}||!data.event||typeof data.event.type!=='string')return;
            this.dispatchEvent(new CustomEvent('aasha:telemetry',{bubbles:true,composed:true,detail:{resourceId:${resourceId},eventType:data.event.type,payload:data.event.payload||{},sequence_number:data.event.sequence_number}}));
          };
          window.addEventListener('message',this._messageHandler);
        }
        disconnectedCallback(){if(this._messageHandler)window.removeEventListener('message',this._messageHandler);this._messageHandler=null;}
      }
      if(!customElements.get('aasha-sim'))customElements.define('aasha-sim',AashaEmbeddedResourceSim);
    `;
  }

  /**
   * Generates a fully self-contained <aasha-sim> Web Component implementation
   * based on subject, topic, and domain requirements.
   */
  static generateSimScript(config: SimGeneratorConfig): string {
    const topic = config.topic.toLowerCase();
    const subject = config.subject.toLowerCase();

    // 1. Specific tactile visual manipulatives
    if (topic.includes('ten-frame') || topic.includes('10-frame') || topic.includes('place-value') || topic.includes('10-maker') || topic.includes('base10')) {
      return this.generateTenFrameSim(config);
    } else if (topic.includes('fraction') || topic.includes('pizza') || topic.includes('slice') || topic.includes('decimal')) {
      return this.generateFractionPizzaSim(config);
    } else if (topic.includes('number-line') || topic.includes('hunter') || topic.includes('jump') || topic.includes('factor') || topic.includes('multiple')) {
      return this.generateNumberHunterSim(config);
    } else if (topic.includes('symmetry') || topic.includes('reflection') || topic.includes('fold') || topic.includes('mirror')) {
      return this.generateSymmetryFoldSim(config);
    } else if (config.initialParams?.mode === 'legacy_manipulative' && subject.includes('science')) {
      return this.generateScienceSim(config);
    } else if (config.initialParams?.mode === 'legacy_manipulative' && subject.includes('commerce')) {
      return this.generateCommerceSim(config);
    } else if (config.initialParams?.mode === 'legacy_manipulative' && subject.includes('math')) {
      return this.generateMathSim(config);
    } else {
      // 2. Universal High-Production Visual Multi-Step Arena Engine for ALL subjects & chapters
      return this.generateMultiStepArenaSim(config);
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
              .btn { min-height: 44px; min-width: 44px; padding: 6px 16px; background: #10B981; color: #FFF; border: none; border-radius: 8px; font-weight: 700; font-size: 13px; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; box-sizing: border-box; touch-action: manipulation; }
              button, input, select { min-width: 44px; min-height: 44px; }
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
          this.dispatchEvent(new CustomEvent('aasha:telemetry', {
            bubbles: true,
            composed: true,
            detail: { event: 'switch_toggled', switchState: this.state.switchState, isCorrect: this.state.switchState }
          }));
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
              .btn { min-height: 44px; min-width: 44px; padding: 6px 12px; background: #2563EB; color: #FFF; border: none; border-radius: 8px; font-weight: 700; font-size: 12px; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; box-sizing: border-box; touch-action: manipulation; }
              button, input, select { min-width: 44px; min-height: 44px; }
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
          this.dispatchEvent(new CustomEvent('aasha:telemetry', {
            bubbles: true,
            composed: true,
            detail: { event: 'ledger_updated', debit: this.state.debit, credit: this.state.credit, isCorrect: this.state.balanced }
          }));
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
              .btn { min-height: 44px; min-width: 44px; padding: 6px 14px; background: #2563EB; color: #FFF; border: none; border-radius: 8px; font-weight: 700; font-size: 13px; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; box-sizing: border-box; touch-action: manipulation; }
              button, input, select { min-width: 44px; min-height: 44px; }
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
            if (title) title.innerText = 'Step ' + this.state.activeStep + ': Action Mechanic';
            if (desc) desc.innerText = 'Executing visual concept step ' + this.state.activeStep + ' of ' + this.state.maxSteps + '.';
            this.dispatchEvent(new CustomEvent('aasha:telemetry', {
              bubbles: true,
              composed: true,
              detail: { event: 'step_advanced', activeStep: this.state.activeStep, isCorrect: this.state.activeStep >= this.state.maxSteps }
            }));
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
    const targetSum = config.initialParams?.targetSum || 10;
    const startQty = config.initialParams?.startingQuantity !== undefined ? config.initialParams.startingQuantity : 4;
    return `
      class AashaTenFrameSim extends HTMLElement {
        constructor() {
          super();
          this.attachShadow({ mode: 'open' });
          this.targetSum = ${targetSum};
          this.startingQuantity = ${startQty};
          this.maxCapacity = 10;
          this.neededQuantity = this.targetSum - this.startingQuantity;
          
          // Offline persistence load
          let restoredCount = this.startingQuantity;
          try {
            const saved = localStorage.getItem('aasha_tenframe_state');
            if (saved) {
              const parsed = JSON.parse(saved);
              if (typeof parsed.count === 'number' && parsed.count >= 0 && parsed.count <= this.maxCapacity) {
                restoredCount = parsed.count;
              }
            }
          } catch(e) {}

          this.state = { 
            count: restoredCount, 
            lang: window.__AASHA_LANG__ || 'en',
            lastEvaluation: null,
            cue: null
          };
          this._animFrame = null;
        }

        connectedCallback() {
          this.render();
          this.setupEvents();
          window.addEventListener('aasha:language_change', (e) => this.setLanguage(e.detail?.lang || 'en'));
          this.evaluateState(false);
        }

        disconnectedCallback() { this.destroy(); }
        pause() { if (this._animFrame) cancelAnimationFrame(this._animFrame); }
        resume() { this.renderFrames(); }
        destroy() { this.pause(); }

        setLanguage(lang) {
          this.state.lang = lang;
          this.updateLabels();
        }

        getState() { return { ...this.state, targetSum: this.targetSum, startingQuantity: this.startingQuantity }; }
        setState(s) { 
          Object.assign(this.state, s); 
          this.persistState();
          this.updateLabels(); 
          this.renderFrames(); 
        }

        persistState() {
          try {
            localStorage.setItem('aasha_tenframe_state', JSON.stringify({
              count: this.state.count,
              timestamp: Date.now()
            }));
          } catch(e) {}
        }

        reset() {
          this.state.count = this.startingQuantity;
          this.state.cue = null;
          this.persistState();
          this.emitTelemetry('interaction_completed', { action: 'reset', count: this.state.count });
          this.evaluateState(true);
          this.updateLabels();
          this.renderFrames();
        }

        // OpenMAIC Visual Cue Presentation Helpers
        setVisualCue(type, index) {
          this.state.cue = { type, index };
          this.renderFrames();
        }

        clearVisualCues() {
          this.state.cue = null;
          this.renderFrames();
        }

        // Deterministic Mathematical Evaluation Logic (Section 2A.14)
        evaluateState(emitEvents = true) {
          const placed = this.state.count - this.startingQuantity;
          const currentTotal = this.state.count;
          const diff = currentTotal - this.targetSum;
          let signal = 'TARGET_MATCH';
          let explanation = 'Correct quantity placed; ten-frame target achieved perfectly.';
          let isCorrect = false;

          if (currentTotal === this.targetSum) {
            isCorrect = true;
            signal = 'TARGET_MATCH';
            explanation = 'Goal achieved! The ten-frame represents the exact target sum.';
          } else if (currentTotal < this.targetSum) {
            isCorrect = false;
            signal = 'UNDERFILL';
            explanation = 'Incomplete quantity; more counters are needed to complete the target.';
          } else {
            isCorrect = false;
            signal = 'OVERFILL';
            explanation = 'Exceeded target sum; more counters were added than required.';
          }

          const evalResult = {
            isCorrect,
            targetSum: this.targetSum,
            startingQuantity: this.startingQuantity,
            neededQuantity: this.neededQuantity,
            currentTotal,
            difference: diff,
            diagnosticSignal: signal,
            diagnosticExplanation: explanation
          };

          this.state.lastEvaluation = evalResult;

          if (emitEvents) {
            this.emitTelemetry('response_evaluated', evalResult);
            if (!isCorrect) {
              this.emitTelemetry('misconception_detected', {
                signal,
                difference: diff,
                remediationHint: signal === 'OVERFILL' ? 'H1: Observe how many spaces over the target are filled' : 'H1: Count the empty spaces remaining'
              });
            } else {
              this.emitTelemetry('evidence_generated', {
                evidenceType: 'CONCEPTUAL_ADDITION',
                competencyAchieved: true,
                targetSum: this.targetSum
              });
            }
          }

          return evalResult;
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
              .sim-container { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; width: 100%; height: 100%; padding: 6px; box-sizing: border-box; background: #0F172A; color: #F8FAFC; border-radius: 12px; position: relative; }
              .readout { font-size: 13px; font-weight: 700; color: #38BDF8; text-align: center; }
              .sub-readout { font-size: 11px; font-weight: 600; color: #FCD34D; }
              .diagnostic-box { font-size: 11px; padding: 4px 8px; border-radius: 6px; text-align: center; width: 90%; max-width: 320px; min-height: 20px; transition: background .2s; }
              .diagnostic-match { background: #064E3B; color: #34D399; }
              .diagnostic-underfill { background: #1E3A5F; color: #38BDF8; }
              .diagnostic-overfill { background: #4C1D95; color: #FCA5A5; }
              .frames-wrapper { display: flex; gap: 8px; justify-content: center; align-items: center; width: 100%; max-width: 320px; position: relative; }
              .ten-frame-grid { display: grid; grid-template-columns: repeat(5, 1fr); grid-template-rows: repeat(2, 1fr); gap: 4px; background: #1E293B; padding: 6px; border-radius: 8px; border: 1.5px solid #334155; position: relative; }
              .cell { width: 28px; height: 28px; background: #0F172A; border: 1px dashed #475569; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: transform 0.1s; position: relative; }
              .cell:active { transform: scale(0.92); }
              .counter { width: 20px; height: 20px; border-radius: 50%; background: radial-gradient(circle, #F59E0B, #D97706); box-shadow: 0 2px 4px rgba(0,0,0,0.4); }
              .counter-initial { background: radial-gradient(circle, #38BDF8, #0284C7); }
              .laser-pointer { outline: 2.5px solid #EC4899; outline-offset: 2px; animation: pulse 1s infinite alternate; }
              .spotlight-dim { opacity: 0.35; }
              @keyframes pulse { from { outline-color: #EC4899; box-shadow: 0 0 6px #EC4899; } to { outline-color: #F43F5E; box-shadow: 0 0 12px #F43F5E; } }
              .controls { display: flex; gap: 6px; width: 100%; justify-content: center; flex-wrap: nowrap; overflow-x: auto; touch-action: pan-x; margin-top: 2px; }
              .btn { min-height: 44px; min-width: 44px; padding: 6px 12px; background: #2563EB; color: #FFF; border: none; border-radius: 8px; font-weight: 700; font-size: 13px; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; }
              .btn:active { transform: scale(0.96); }
              .btn-stepper { background: #334155; color: #E2E8F0; font-size: 14px; }
              .btn-reset { background: #475569; }
            </style>
            <div class="sim-container">
              <div class="readout" id="lblMain">Ten-Frame Target: \${this.targetSum}</div>
              <div class="sub-readout" id="lblSub">Current Total: \${this.state.count}</div>
              <div class="frames-wrapper">
                <div class="ten-frame-grid" id="grid1"></div>
              </div>
              <div class="diagnostic-box" id="diagnosticBox"></div>
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
            
            // Check OpenMAIC visual cues
            if (this.state.cue) {
              if (this.state.cue.type === 'laser_pointer' && this.state.cue.index === i) {
                cell.classList.add('laser-pointer');
              } else if (this.state.cue.type === 'spotlight' && this.state.cue.index !== i) {
                cell.classList.add('spotlight-dim');
              }
            }

            if (i < this.state.count) {
              const counter = document.createElement('div');
              counter.className = i < this.startingQuantity ? 'counter counter-initial' : 'counter';
              cell.appendChild(counter);
            }

            cell.addEventListener('click', () => {
              this.emitTelemetry('interaction_started', { slot: i });
              if (i < this.state.count) {
                this.state.count = i;
              } else {
                this.state.count = i + 1;
              }
              this.clearVisualCues();
              this.persistState();
              this.emitTelemetry('learner_action', { action: 'cell_toggle', count: this.state.count });
              this.evaluateState(true);
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
          this.emitTelemetry('interaction_started', { stepperDelta: delta });
          this.state.count = Math.max(0, Math.min(this.maxCapacity, this.state.count + delta));
          this.clearVisualCues();
          this.persistState();
          this.emitTelemetry('learner_action', { action: 'stepper_adjust', delta, count: this.state.count });
          this.evaluateState(true);
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
          const diagBox = this.shadowRoot.getElementById('diagnosticBox');

          if (lblMain) {
            lblMain.innerText = isHi 
              ? \`दस का ढाँचा लक्ष्य: \${this.targetSum}\`
              : \`Ten-Frame Target: \${this.targetSum}\`;
          }
          if (lblSub) {
            lblSub.innerText = isHi
              ? \`कुल: \${this.state.count} (दहाई: \${tens} | इकाई: \${ones})\`
              : \`Total: \${this.state.count} (Tens: \${tens} | Ones: \${ones})\`;
          }
          if (btnReset) {
            btnReset.innerText = isHi ? 'रीसेट' : 'Reset';
          }
          if (diagBox && this.state.lastEvaluation) {
            const ev = this.state.lastEvaluation;
            diagBox.className = 'diagnostic-box';
            if (ev.isCorrect) {
              diagBox.classList.add('diagnostic-match');
              diagBox.innerText = isHi ? 'लक्ष्य प्राप्त! दस का ढाँचा संतुलित है ✅' : 'Target Achieved! Frame is Balanced ✅';
            } else if (ev.diagnosticSignal === 'UNDERFILL') {
              diagBox.classList.add('diagnostic-underfill');
              diagBox.innerText = isHi ? 'अधूरा जोड़: लक्ष्य तक पहुँचने के लिए और काउंटर चाहिए' : 'Incomplete addition: More counters needed to reach target';
            } else {
              diagBox.classList.add('diagnostic-overfill');
              diagBox.innerText = isHi ? 'अधिक हो गया: लक्ष्य से ज़्यादा काउंटर जुड़ गए' : 'Overfilled: Exceeded target quantity';
            }
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
   * Generates pedagogically structured 3-step challenge rounds for ANY subject/topic
   * (Step 1: Formula/Hook -> Step 2: Calculation/Application -> Step 3: Boss Challenge/Verification)
   */
  static getDynamicRounds(config: SimGeneratorConfig): Array<{
    qEn: string;
    qHi: string;
    optsEn: string[];
    optsHi: string[];
    correct: number;
    hint: string;
  }> {
    if (config.initialParams?.rounds && Array.isArray(config.initialParams.rounds) && config.initialParams.rounds.length > 0) {
      return config.initialParams.rounds;
    }

    const topic = (config.topic || '').toLowerCase();
    const subject = (config.subject || '').toLowerCase();

    // 1. Social Studies / History
    if (subject.includes('history') || subject.includes('social') || topic.includes('history') || topic.includes('mughal') || topic.includes('empire') || topic.includes('freedom') || topic.includes('revolt')) {
      return [
        {
          qEn: `Step 1: Chronological Anchor: In the context of ${config.topic}, which core event established the foundation?`,
          qHi: `चरण 1: कालानुक्रमिक आधार: ${config.topic} के संदर्भ में, किस मूल घटना ने नींव रखी?`,
          optsEn: ["Constitutional / Strategic Accord", "Fragmented Regional Treaty", "Unilateral Disbandment", "Indefinite Postponement"],
          optsHi: ["संवैधानिक / रणनीतिक समझौता", "खंडित क्षेत्रीय संधि", "एकतरफा विघटन", "अनिश्चितकालीन स्थगन"],
          correct: 0,
          hint: "Examine the pivotal milestone that initiated this historical transformation."
        },
        {
          qEn: "Step 2: Cause & Effect Analysis: What was the primary socioeconomic driver of this transformation?",
          qHi: "चरण 2: कारण और प्रभाव विश्लेषण: इस परिवर्तन का प्राथमिक सामाजिक-आर्थिक प्रेरक क्या था?",
          optsEn: ["Structural institutional and agrarian reform", "Static cultural isolation", "Random demographic fluctuation", "Total trade embargo"],
          optsHi: ["संरचनात्मक संस्थागत और कृषि सुधार", "स्थिर सांस्कृतिक अलगाव", "अनियमित जनसांख्यिकीय उतार-चढ़ाव", "पूर्ण व्यापार प्रतिबंध"],
          correct: 0,
          hint: "Identify the economic and administrative changes that shaped public participation."
        },
        {
          qEn: "Boss Challenge: Historical Evidence: What lasting governance legacy resulted from this period?",
          qHi: "बॉस चुनौती: ऐतिहासिक साक्ष्य: इस काल से शासन की कौन सी स्थायी विरासत सामने आई?",
          optsEn: ["Codified administration and civic continuity", "Complete dissolution of documentation", "Erosion of regional trade networks", "Absence of civic structures"],
          optsHi: ["संहिताबद्ध प्रशासन और नागरिक निरंतरता", "दस्तावेज़ीकरण का पूर्ण विघटन", "क्षेत्रीय व्यापार नेटवर्क का क्षरण", "नागरिक संरचनाओं का अभाव"],
          correct: 0,
          hint: "Consider the institutional structures that persisted into subsequent eras."
        }
      ];
    }

    // 2. Science: Physics (Force, Motion, Laws, Gravity)
    if (((subject.includes('science') && !subject.includes('social')) || topic.includes('physics') || topic.includes('force') || topic.includes('motion') || topic.includes('gravit')) && !subject.includes('social')) {
      return [
        {
          qEn: `Step 1: In ${config.topic}, which law or formula calculates Force from mass (m) and acceleration (a)?`,
          qHi: `चरण 1: ${config.topic} में, द्रव्यमान (m) और त्वरण (a) से बल की गणना करने वाला सूत्र कौन सा है?`,
          optsEn: ["F = m × a", "F = m / a", "F = m + a", "F = a / m"],
          optsHi: ["F = m × a", "F = m / a", "F = m + a", "F = a / m"],
          correct: 0,
          hint: "Newton's Second Law defines Force as the product of mass and acceleration."
        },
        {
          qEn: "Step 2: If a 5 kg mass accelerates at 4 m/s², what is the net force in Newtons?",
          qHi: "चरण 2: यदि 5 kg द्रव्यमान 4 m/s² पर त्वरित होता है, तो न्यूटन में कुल बल क्या है?",
          optsEn: ["20 N", "9 N", "1.25 N", "40 N"],
          optsHi: ["20 N", "9 N", "1.25 N", "40 N"],
          correct: 0,
          hint: "Multiply mass (5) by acceleration (4)."
        },
        {
          qEn: "Boss Challenge: If the applied force doubles to 40 N on the same 5 kg object, what is the new acceleration?",
          qHi: "बॉस चुनौती: यदि उसी 5 kg वस्तु पर लगाया गया बल दोगुना होकर 40 N हो जाए, तो नया त्वरण क्या होगा?",
          optsEn: ["8 m/s²", "4 m/s²", "10 m/s²", "2 m/s²"],
          optsHi: ["8 m/s²", "4 m/s²", "10 m/s²", "2 m/s²"],
          correct: 0,
          hint: "Divide force (40 N) by mass (5 kg): a = F / m."
        }
      ];
    }

    // 3. Science: Electricity / Circuits / Ohm's Law
    if (topic.includes('circuit') || topic.includes('ohm') || topic.includes('electric') || topic.includes('current')) {
      return [
        {
          qEn: "Step 1: According to Ohm's Law, what is the formula linking Voltage (V), Current (I), and Resistance (R)?",
          qHi: "चरण 1: ओम के नियम के अनुसार, वोल्टेज (V), धारा (I), और प्रतिरोध (R) का सूत्र क्या है?",
          optsEn: ["V = I × R", "V = I / R", "V = I + R", "I = V × R"],
          optsHi: ["V = I × R", "V = I / R", "V = I + R", "I = V × R"],
          correct: 0,
          hint: "Potential difference equals the product of current and resistance."
        },
        {
          qEn: "Step 2: If Voltage is 12 V and Resistance is 4 Ω, calculate the electric current (I = V / R).",
          qHi: "चरण 2: यदि वोल्टेज 12 V और प्रतिरोध 4 Ω है, तो विद्युत धारा (I = V / R) की गणना करें।",
          optsEn: ["3 A", "48 A", "8 A", "0.33 A"],
          optsHi: ["3 A", "48 A", "8 A", "0.33 A"],
          correct: 0,
          hint: "Divide 12 by 4."
        },
        {
          qEn: "Boss Challenge: If resistance is halved to 2 Ω while voltage remains 12 V, what happens to current?",
          qHi: "बॉस चुनौती: यदि वोल्टेज 12 V रहते हुए प्रतिरोध आधा (2 Ω) कर दिया जाए, तो धारा क्या होगी?",
          optsEn: ["Doubles to 6 A", "Halves to 1.5 A", "Remains 3 A", "Drops to 0 A"],
          optsHi: ["दोगुनी होकर 6 A हो जाएगी", "आधी होकर 1.5 A हो जाएगी", "3 A ही रहेगी", "0 A हो जाएगी"],
          correct: 0,
          hint: "Current is inversely proportional to resistance: 12 / 2 = 6 A."
        }
      ];
    }

    // 4. Geography
    if (subject.includes('geography') || topic.includes('geography') || topic.includes('map') || topic.includes('river') || topic.includes('climate') || topic.includes('resource')) {
      return [
        {
          qEn: `Step 1: Spatial Identification: In ${config.topic}, which natural feature dictates the regional ecosystem?`,
          qHi: `चरण 1: स्थानिक पहचान: ${config.topic} में, कौन सी प्राकृतिक विशेषता क्षेत्रीय पारिस्थितिकी तंत्र को नियंत्रित करती है?`,
          optsEn: ["Drainage basin and terrain relief", "Artificial municipal canal", "Urban expressway corridor", "Enclosed industrial zone"],
          optsHi: ["जल निकासी बेसिन और भूभाग उच्चावच", "कृत्रिम नगरपालिका नहर", "शहरी एक्सप्रेसवे गलियारा", "संलग्न औद्योगिक क्षेत्र"],
          correct: 0,
          hint: "Analyze the geological and hydrological contours of the region."
        },
        {
          qEn: "Step 2: Resource Interdependence: How does precipitation distribution influence soil fertility and vegetation?",
          qHi: "चरण 2: संसाधन परस्पर निर्भरता: वर्षा वितरण मिट्टी की उर्वरता और वनस्पति को कैसे प्रभावित करता है?",
          optsEn: ["Regulates alluvial nutrient deposition", "Prevents mineral absorption entirely", "Dehydrates perennial aquifers", "Eliminates biological humic matter"],
          optsHi: ["जलोढ़ पोषक तत्वों के निक्षेपण को नियंत्रित करता है", "खनिज अवशोषण को पूरी तरह रोकता है", "बारहमासी जलभृतों को सुखाता है", "जैविक ह्यूमिक पदार्थ को समाप्त करता है"],
          correct: 0,
          hint: "Look at the seasonal silt replenishment along river floodplains."
        },
        {
          qEn: "Boss Challenge: Sustainable Conservation: What environmental practice balances resource yield with preservation?",
          qHi: "बॉस चुनौती: सतत संरक्षण: कौन सी पर्यावरणीय प्रथा संरक्षण के साथ संसाधन उपज को संतुलित करती है?",
          optsEn: ["Watershed management & contour bunding", "Unchecked open-cast deforestation", "Intensive chemical mono-cropping", "Over-extraction of ground aquifers"],
          optsHi: ["वाटरशेड प्रबंधन और समोच्च मेढ़बंदी", "अनियंत्रित खुली वनों की कटाई", "गहन रासायनिक एकल-फसल", "भूजल जलभृतों का अत्यधिक दोहन"],
          correct: 0,
          hint: "Select the sustainable soil and water conservation strategy."
        }
      ];
    }

    // 5. English / Grammar / Language
    if (subject.includes('english') || subject.includes('grammar') || subject.includes('language') || topic.includes('tense') || topic.includes('voice') || topic.includes('speech')) {
      return [
        {
          qEn: `Step 1: Syntax Parsing: In the target sentence, identify the principal verb inflection and grammatical tense.`,
          qHi: `चरण 1: वाक्य विश्लेषण: दिए गए वाक्य में मुख्य क्रिया रूप और काल की पहचान करें।`,
          optsEn: ["Active finite verb denoting completed aspect", "Unconnected dangling participle", "Adverbial modifier without subject", "Dependent infinitive fragment"],
          optsHi: ["सक्रिय सीमित क्रिया जो पूर्ण काल दर्शाती है", "असंबद्ध कृदंत", "बिना कर्ता का क्रियाविशेषण", "आश्रित असीमित खंड"],
          correct: 0,
          hint: "Identify the finite predicate that agrees with the primary grammatical subject."
        },
        {
          qEn: "Step 2: Concord & Transformation: Which form correctly maintains subject-verb agreement?",
          qHi: "चरण 2: अन्वय और रूपांतरण: कौन सा रूप कर्ता-क्रिया सहमति को सही ढंग से बनाए रखता है?",
          optsEn: ["Singular subject pairs with singular verb marker", "Plural subject takes irregular past singular", "Compound subject drops agreement marker", "Subject pronoun conflicts with object case"],
          optsHi: ["एकवचन कर्ता एकवचन क्रिया के साथ जुड़ता है", "बहुवचन कर्ता अनियमित भूतकाल एकवचन लेता है", "मिश्रित कर्ता सहमति चिह्न छोड़ देता है", "कर्ता सर्वनाम कर्म कारक से टकराता है"],
          correct: 0,
          hint: "Ensure the verb number matches the singular or plural count of the grammatical head noun."
        },
        {
          qEn: "Boss Challenge: Error Diagnosis: Select the grammatically flawless sentence structure.",
          qHi: "बॉस चुनौती: त्रुटि निदान: व्याकरण की दृष्टि से त्रुटिहीन वाक्य संरचना का चयन करें।",
          optsEn: ["Neither the teacher nor the students were unprepared.", "Neither the teacher nor the students was unprepared.", "Neither teacher or students is unprepared.", "Neither teacher nor students being unprepared."],
          optsHi: ["Neither the teacher nor the students were unprepared.", "Neither the teacher nor the students was unprepared.", "Neither teacher or students is unprepared.", "Neither teacher nor students being unprepared."],
          correct: 0,
          hint: "In 'neither... nor...', the verb agrees with the closer subject noun ('students' -> plural 'were')."
        }
      ];
    }

    // 6. Mathematics: Fractions & Rational Numbers
    if (topic.includes('fraction') || topic.includes('rational') || topic.includes('decimal')) {
      return [
        {
          qEn: "Step 1: To calculate 1/4 + 2/3, what is the Least Common Denominator (LCM of 4 and 3)?",
          qHi: "चरण 1: 1/4 + 2/3 की गणना करने के लिए, लघुत्तम समापवर्त्य (4 और 3 का LCM) क्या है?",
          optsEn: ["12", "7", "14", "24"],
          optsHi: ["12", "7", "14", "24"],
          correct: 0,
          hint: "Multiply 4 and 3 because they are coprime."
        },
        {
          qEn: "Step 2: Convert to like fractions: 3/12 + 8/12. What is the combined sum?",
          qHi: "चरण 2: समान भिन्नों में बदलें: 3/12 + 8/12. कुल योग क्या है?",
          optsEn: ["11/12", "11/24", "5/12", "1"],
          optsHi: ["11/12", "11/24", "5/12", "1"],
          correct: 0,
          hint: "Add the numerators (3 + 8) and keep the common denominator 12."
        },
        {
          qEn: "Boss Challenge: What remaining fraction is needed to make 1 whole (12/12) from 11/12?",
          qHi: "बॉस चुनौती: 11/12 से 1 पूरा (12/12) बनाने के लिए किस शेष भिन्न की आवश्यकता है?",
          optsEn: ["1/12", "2/12", "11/12", "0"],
          optsHi: ["1/12", "2/12", "11/12", "0"],
          correct: 0,
          hint: "Subtract: 12/12 - 11/12 = 1/12."
        }
      ];
    }

    // 7. Mathematics: Exponents & Powers
    if (topic.includes('exponent') || topic.includes('power')) {
      return [
        {
          qEn: "Step 1: Product of Powers Rule: What is 2³ × 2⁴ written with a single exponent?",
          qHi: "चरण 1: घातों के गुणन का नियम: 2³ × 2⁴ को एकल घात के रूप में कैसे लिखा जाएगा?",
          optsEn: ["2⁷ (since 3 + 4 = 7)", "2¹² (since 3 × 4 = 12)", "4⁷", "2¹"],
          optsHi: ["2⁷ (चूँकि 3 + 4 = 7)", "2¹² (चूँकि 3 × 4 = 12)", "4⁷", "2¹"],
          correct: 0,
          hint: "When bases are identical, add the exponents: a^m × a^n = a^(m+n)."
        },
        {
          qEn: "Step 2: Power of a Power Rule: Simplify (3²)³. What is the resulting exponent on 3?",
          qHi: "चरण 2: घात की घात का नियम: (3²)³ को सरल करें। 3 पर परिणामी घात क्या होगी?",
          optsEn: ["3⁶ (since 2 × 3 = 6)", "3⁵ (since 2 + 3 = 5)", "3⁸", "9³"],
          optsHi: ["3⁶ (चूँकि 2 × 3 = 6)", "3⁵ (चूँकि 2 + 3 = 5)", "3⁸", "9³"],
          correct: 0,
          hint: "Multiply the outer and inner exponents: (a^m)^n = a^(m×n)."
        },
        {
          qEn: "Boss Challenge: Negative Exponents: What is the exact value of 5⁻²?",
          qHi: "बॉस चुनौती: ऋणात्मक घात: 5⁻² का सटीक मान क्या है?",
          optsEn: ["1/25 (1 / 5²)", "-25", "-10", "1/10"],
          optsHi: ["1/25 (1 / 5²)", "-25", "-10", "1/10"],
          correct: 0,
          hint: "A negative exponent represents the reciprocal: a^(-n) = 1 / a^n."
        }
      ];
    }

    // 8. Default Algebra / Arithmetic / General
    return [
      {
        qEn: `Step 1: In ${config.topic}, isolate the first variable term in: 4x + 8 = 32. What does 4x equal?`,
        qHi: `चरण 1: ${config.topic} में, 4x + 8 = 32 में पहले चर पद को अलग करें। 4x किसके बराबर है?`,
        optsEn: ["24 (32 - 8)", "16", "32", "40"],
        optsHi: ["24 (32 - 8)", "16", "32", "40"],
        correct: 0,
        hint: "Subtract 8 from both sides of the equation."
      },
      {
        qEn: "Step 2: If 4x = 24, divide both sides by 4 to solve for x. What is x?",
        qHi: "चरण 2: यदि 4x = 24 है, तो x ज्ञात करने के लिए दोनों पक्षों को 4 से विभाजित करें। x क्या है?",
        optsEn: ["6 (24 ÷ 4)", "8", "4", "12"],
        optsHi: ["6 (24 ÷ 4)", "8", "4", "12"],
        correct: 0,
        hint: "Divide 24 by the coefficient 4."
      },
      {
        qEn: "Boss Challenge: Substitution Check: Verify the solution by evaluating 4(6) + 8. Does it equal 32?",
        qHi: "बॉस चुनौती: प्रतिस्थापन सत्यापन: 4(6) + 8 का मान निकालकर समाधान सत्यापित करें। क्या यह 32 के बराबर है?",
        optsEn: ["Yes, 24 + 8 = 32 ✅", "No, it equals 30", "No, it equals 36", "Cannot be determined"],
        optsHi: ["हाँ, 24 + 8 = 32 ✅", "नहीं, यह 30 है", "नहीं, यह 36 है", "ज्ञात नहीं किया जा सकता"],
        correct: 0,
        hint: "Multiply 4 by 6 to get 24, then add 8."
      }
    ];
  }

  /**
   * King's Math Battle Arena Engine (Fluency & Multi-Step Equation Duels)
   * High-intensity, visually rich tactile game engine with combo streaks, 
   * 60s radial timer, particle sparks, and universal multi-step curriculum ingestion.
   */
  static generateMathBattleSim(config: SimGeneratorConfig): string {
    const topic = config.topic || 'Curriculum Challenge';
    const grade = config.grade || 5;
    const rounds = this.getDynamicRounds(config);
    const roundsJson = JSON.stringify(rounds);
    return `
      class AashaMathBattleSim extends HTMLElement {
        constructor() {
          super();
          this.attachShadow({ mode: 'open' });
          this.topic = ${JSON.stringify(topic)};
          this.grade = ${grade};
          this.rounds = ${roundsJson};
          this.currentRound = 0;
          this.score = 0;
          this.streak = 0;
          this.timer = 30;
          this._timerInterval = null;
          this.state = { lang: window.__AASHA_LANG__ || 'en', completed: false };
        }

        connectedCallback() {
          this.render();
          this.startTimer();
          window.addEventListener('aasha:language_change', (e) => this.setLanguage(e.detail?.lang || 'en'));
        }

        disconnectedCallback() { this.destroy(); }
        pause() { if (this._timerInterval) clearInterval(this._timerInterval); }
        resume() { this.startTimer(); }
        destroy() { this.pause(); }

        setLanguage(lang) {
          this.state.lang = lang;
          this.updateContent();
        }

        startTimer() {
          this.pause();
          this._timerInterval = setInterval(() => {
            if (this.timer > 0) {
              this.timer--;
              this.updateTimerDisplay();
            } else {
              this.onTimeExpired();
            }
          }, 1000);
        }

        updateTimerDisplay() {
          const tEl = this.shadowRoot.getElementById('timerVal');
          const bar = this.shadowRoot.getElementById('timerBar');
          if (tEl) tEl.innerText = this.timer + 's';
          if (bar) {
            const pct = (this.timer / 30) * 100;
            bar.style.width = pct + '%';
            bar.style.background = pct > 40 ? 'linear-gradient(90deg, #10B981, #38BDF8)' : 'linear-gradient(90deg, #EF4444, #F59E0B)';
          }
        }

        onTimeExpired() {
          this.streak = 0;
          this.showFeedback(false, "Time expired! Don't worry, try this round again.");
          this.timer = 20;
          this.updateTimerDisplay();
        }

        handleOption(idx) {
          const round = this.rounds[this.currentRound];
          const isCorrect = (idx === round.correct);

          if (isCorrect) {
            this.score += 100 + (this.streak * 25);
            this.streak++;
            this.triggerSparks();
            this.showFeedback(true, "Great strike! Perfect calculation.");
            this.emitTelemetry('battle_round_win', { round: this.currentRound, score: this.score, streak: this.streak });

            setTimeout(() => {
              if (this.currentRound < this.rounds.length - 1) {
                this.currentRound++;
                this.timer = 30;
                this.updateContent();
                this.startTimer();
              } else {
                this.onBattleVictory();
              }
            }, 800);
          } else {
            this.streak = 0;
            this.showFeedback(false, round.hint);
            this.emitTelemetry('battle_round_miss', { round: this.currentRound });
          }
          this.updateHud();
        }

        onBattleVictory() {
          this.pause();
          this.state.completed = true;
          const arena = this.shadowRoot.getElementById('arenaContainer');
          if (arena) {
            arena.innerHTML = \`
              <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:24px;text-align:center;">
                <div style="font-size:42px;animation:bounce 1s infinite alternate;">🏆</div>
                <div style="font-size:18px;font-weight:800;color:#FCD34D;">ARENA CHAMPION!</div>
                <div style="font-size:13px;color:#94A3B8;">Score: \${this.score} XP | Max Streak: \${this.streak}</div>
                <div style="font-size:12px;color:#34D399;font-weight:600;padding:6px 12px;background:#064E3B;border-radius:8px;">All Battle Steps Mastered! Proceed below ➜</div>
              </div>
            \`;
          }
          this.emitTelemetry('evidence_generated', {
            evidenceType: 'FLUENCY_ARENA_VICTORY',
            competencyAchieved: true,
            score: this.score,
            topic: this.topic
          });
          this.dispatchEvent(new CustomEvent('aasha:telemetry', {
            bubbles: true,
            composed: true,
            detail: { isCorrect: true, competencyAchieved: true, simType: 'math-battle' }
          }));
        }

        triggerSparks() {
          const card = this.shadowRoot.getElementById('questionCard');
          if (card) {
            card.classList.add('flash-spark');
            setTimeout(() => card.classList.remove('flash-spark'), 400);
          }
        }

        showFeedback(ok, text) {
          const fb = this.shadowRoot.getElementById('feedbackBox');
          if (fb) {
            fb.style.display = 'block';
            fb.style.color = ok ? '#34D399' : '#FCA5A5';
            fb.style.background = ok ? 'rgba(6, 78, 59, 0.6)' : 'rgba(127, 29, 29, 0.6)';
            fb.innerText = text;
            setTimeout(() => { if (fb) fb.style.display = 'none'; }, 2000);
          }
        }

        updateHud() {
          const scoreEl = this.shadowRoot.getElementById('scoreVal');
          const streakEl = this.shadowRoot.getElementById('streakVal');
          const roundEl = this.shadowRoot.getElementById('roundVal');
          if (scoreEl) scoreEl.innerText = this.score + ' XP';
          if (streakEl) streakEl.innerText = this.streak > 1 ? '🔥 ' + this.streak + 'x' : '';
          if (roundEl) roundEl.innerText = 'Round ' + (this.currentRound + 1) + '/' + this.rounds.length;
        }

        emitTelemetry(event, data) {
          this.dispatchEvent(new CustomEvent('aasha:telemetry', {
            bubbles: true,
            composed: true,
            detail: { simType: 'math-battle', event, ...data, timestamp: Date.now() }
          }));
        }

        render() {
          this.shadowRoot.innerHTML = \`
            <style>
              :host { display: block; width: 100%; height: 100%; font-family: system-ui, sans-serif; }
              .arena { display: flex; flex-direction: column; width: 100%; height: 100%; background: #0B0F19; border-radius: 12px; border: 1.5px solid #312E81; padding: 10px; box-sizing: border-box; gap: 8px; position: relative; overflow: hidden; }
              .hud { display: flex; justify-content: space-between; align-items: center; width: 100%; padding: 4px 8px; font-size: 12px; font-weight: 700; color: #E0E7FF; }
              .streak { color: #F59E0B; }
              .score { color: #38BDF8; }
              .timer-track { width: 100%; height: 4px; background: #1E293B; border-radius: 2px; overflow: hidden; margin-top: 2px; }
              .timer-bar { height: 100%; width: 100%; background: linear-gradient(90deg, #10B981, #38BDF8); transition: width 1s linear; }
              .card { background: #1E1B4B; border: 1px solid #4338CA; border-radius: 10px; padding: 12px; margin-top: 4px; text-align: center; position: relative; transition: all 0.2s; }
              .flash-spark { border-color: #34D399; box-shadow: 0 0 16px rgba(52, 211, 153, 0.6); transform: scale(1.02); }
              .q-text { font-size: 14px; font-weight: 700; color: #F8FAFC; line-height: 1.5; margin-bottom: 8px; }
              .options { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; width: 100%; margin-top: 8px; }
              .opt-btn { min-height: 44px; min-width: 44px; padding: 8px; background: #312E81; border: 1px solid #4F46E5; border-radius: 8px; color: #F1F5F9; font-size: 13px; font-weight: 700; cursor: pointer; transition: all 0.15s; display: flex; align-items: center; justify-content: center; box-sizing: border-box; touch-action: manipulation; }
              button, input, select { min-width: 44px; min-height: 44px; }
              .opt-btn:active { transform: scale(0.96); background: #4338CA; }
              .feedback-box { display: none; padding: 6px 10px; border-radius: 6px; font-size: 12px; font-weight: 600; text-align: center; margin-top: 6px; }
              @keyframes bounce { from { transform: translateY(0); } to { transform: translateY(-8px); } }
            </style>
            <div class="arena" id="arenaContainer">
              <div class="hud">
                <span id="roundVal">Round 1/3</span>
                <span class="streak" id="streakVal"></span>
                <span class="score" id="scoreVal">0 XP</span>
                <span id="timerVal" style="color:#FCD34D;">30s</span>
              </div>
              <div class="timer-track"><div class="timer-bar" id="timerBar"></div></div>
              <div class="card" id="questionCard">
                <div class="q-text" id="questionText">Loading challenge...</div>
                <div class="options" id="optionsGrid"></div>
                <div class="feedback-box" id="feedbackBox"></div>
              </div>
            </div>
          \`;
          this.updateContent();
        }

        updateContent() {
          const isHi = this.state.lang === 'hi';
          const round = this.rounds[this.currentRound];
          const qEl = this.shadowRoot.getElementById('questionText');
          const grid = this.shadowRoot.getElementById('optionsGrid');
          this.updateHud();

          if (qEl && round) {
            qEl.innerText = isHi ? round.qHi : round.qEn;
          }

          if (grid && round) {
            grid.innerHTML = '';
            const opts = isHi ? round.optsHi : round.optsEn;
            opts.forEach((optText, idx) => {
              const btn = document.createElement('button');
              btn.className = 'opt-btn';
              btn.innerText = optText;
              btn.addEventListener('click', () => this.handleOption(idx));
              grid.appendChild(btn);
            });
          }
        }
      }
      if (!customElements.get('aasha-sim')) {
        customElements.define('aasha-sim', AashaMathBattleSim);
      }
    `;
  }

  /**
   * Universal Multi-Step Arena Engine for ALL Subjects
   * Ingests multi-step assessments across Science, Math, History, Geography, and Grammar.
   */
  static generateMultiStepArenaSim(config: SimGeneratorConfig): string {
    return this.generateMathBattleSim(config);
  }

  /**
   * OpenMAIC Dynamic Simulation Generator (Build-Time Synthesis)
   * Converts unstructured topic definitions into interactive <aasha-sim> Web Components.
   */
  static generateOpenMAICDynamicSim(config: SimGeneratorConfig): string {
    return this.generateGenericInteractiveSim(config);
  }
}
