/**
 * AASHA AIOS — Foundation F26: Balance Scale Linear Equation Solver
 * Path: Aasha-AI/packages/adapters/balance_equation_sim.ts
 *
 * Implements Balance Scale Linear Equation Solver (Foundation F26)
 * as a high-fidelity, self-contained Web Component (<aasha-sim-balance-equation> / <aasha-sim>).
 *
 * Invariants:
 * - 100% Offline-first: zero external CDN scripts, zero external web fonts.
 * - Same-frame mobile ergonomics: touch targets >= 44x44px, responsive viewport clamping.
 * - 60 FPS HTML5 Canvas rendering with physics spring tilt animation and mechanical fulcrum.
 * - Interactive controls: operations toolbar (add/subtract both sides, divide both sides),
 *   equation presets ($2x+3=11$, $3x+2=14$, $4x+4=20$, etc.), step history log.
 * - Bilingual support: English and Hindi terminology.
 * - Isomorphic: safely importable in Node.js runtime and browser contexts.
 */

// ============================================================================
// 1. Types & State Contracts
// ============================================================================

export type ThemeMode = 'dark' | 'light' | 'auto';
export type LanguageMode = 'en' | 'hi';

export interface EquationStep {
  descriptionEn: string;
  descriptionHi: string;
  leftX: number;
  leftC: number;
  rightC: number;
  timestamp: number;
}

export interface BalanceEquationState {
  presetId: number;           // Index of current preset
  initialXCoeff: number;      // Original coefficient a
  initialConstant: number;    // Original constant b
  initialRightConst: number;  // Original right side c
  currentXCoeff: number;      // Current left x count
  currentLeftConst: number;   // Current left unit weights
  currentRightConst: number;  // Current right unit weights
  targetXValue: number;       // Root of equation (e.g. 4)
  isSolved: boolean;          // true when x = root is isolated
  isBalanced: boolean;        // true when LHS == RHS
  theme: ThemeMode;
  lang: LanguageMode;
  soundEnabled: boolean;
  stepHistory: EquationStep[];
}

export interface BalanceEquationMetrics {
  equationString: string;
  equationStringHi: string;
  lhsWeight: number;
  rhsWeight: number;
  weightDifference: number;   // LHS - RHS
  tiltAngleDeg: number;       // Angle of beam
  isBalanced: boolean;
  isSolved: boolean;
  solution: number;
  stepCount: number;
}

export interface BalancePreset {
  id: number;
  label: string;
  a: number; // a*x + b = c
  b: number;
  c: number;
}

export interface BalanceEquationConfig {
  presetId?: number;
  theme?: ThemeMode;
  lang?: LanguageMode;
  soundEnabled?: boolean;
}

// ============================================================================
// 2. Deterministic Mathematical Evaluator (Pure Engine)
// ============================================================================

export class BalanceEquationMathEvaluator {
  public static readonly PRESETS: BalancePreset[] = [
    { id: 0, label: '2x + 3 = 11', a: 2, b: 3, c: 11 },
    { id: 1, label: '3x + 2 = 14', a: 3, b: 2, c: 14 },
    { id: 2, label: '2x + 6 = 12', a: 2, b: 6, c: 12 },
    { id: 3, label: '4x + 4 = 20', a: 4, b: 4, c: 20 },
  ];

  /**
   * Solves linear equation: a*x + b = c -> x = (c - b) / a
   */
  public static solveRoot(a: number, b: number, c: number): number {
    if (a === 0) return 0;
    return (c - b) / a;
  }

  /**
   * Formats linear expression string (e.g. "2x + 3 = 11" or "x = 4")
   */
  public static formatEquation(xCoeff: number, leftConst: number, rightConst: number): string {
    let lhs = '';
    if (xCoeff > 0) {
      lhs = xCoeff === 1 ? 'x' : `${xCoeff}x`;
      if (leftConst > 0) {
        lhs += ` + ${leftConst}`;
      } else if (leftConst < 0) {
        lhs += ` − ${Math.abs(leftConst)}`;
      }
    } else {
      lhs = leftConst.toString();
    }
    return `${lhs || '0'} = ${rightConst}`;
  }

  /**
   * Computes dynamic scale physics tilt angle (-15 deg to +15 deg)
   */
  public static computeTiltAngle(lhsWeight: number, rhsWeight: number): number {
    const diff = lhsWeight - rhsWeight;
    // Positive diff = Left pan is heavier -> Left tilts DOWN (positive angle)
    // Negative diff = Right pan is heavier -> Right tilts DOWN (negative angle)
    const rawAngle = diff * 2.8;
    return Math.max(-15, Math.min(15, rawAngle));
  }

  /**
   * Computes comprehensive balance metrics
   */
  public static computeMetrics(
    currentXCoeff: number,
    currentLeftConst: number,
    currentRightConst: number,
    targetXValue: number,
    stepCount: number = 0
  ): BalanceEquationMetrics {
    const lhsWeight = currentXCoeff * targetXValue + currentLeftConst;
    const rhsWeight = currentRightConst;
    const weightDifference = lhsWeight - rhsWeight;
    const tiltAngleDeg = this.computeTiltAngle(lhsWeight, rhsWeight);
    const isBalanced = weightDifference === 0;
    const isSolved = currentXCoeff === 1 && currentLeftConst === 0 && currentRightConst === targetXValue;

    const eqStr = this.formatEquation(currentXCoeff, currentLeftConst, currentRightConst);

    return {
      equationString: eqStr,
      equationStringHi: eqStr,
      lhsWeight,
      rhsWeight,
      weightDifference,
      tiltAngleDeg,
      isBalanced,
      isSolved,
      solution: targetXValue,
      stepCount,
    };
  }

  /**
   * Bilingual terminology dictionary
   */
  public static getLabels(lang: LanguageMode = 'en') {
    if (lang === 'hi') {
      return {
        title: 'समीकरण संतुलन तराजू (F26)',
        equation: 'समीकरण',
        lhs: 'बायां पक्ष (LHS)',
        rhs: 'दायां पक्ष (RHS)',
        variable: 'चर भार (x)',
        unitWeight: 'इकाई भार (1)',
        balanced: 'संतुलित ✅',
        unbalanced: 'असंतुलित ⚖️',
        solved: 'समीकरण हल हो गया! 🎉',
        operations: 'दोनों पक्षों पर संक्रियाएं',
        subConst: 'दोनों पक्षों से स्थिरांक घटाएं',
        sub1: '−1 दोनों पक्षों से',
        add1: '+1 दोनों पक्षों में',
        divCoeff: 'गुणांक से दोनों पक्षों को भाग दें',
        reset: 'समीकरण रीसेट करें',
        nextPreset: 'अगला समीकरण',
        stepLog: 'चरणबद्ध समाधान',
      };
    }
    return {
      title: 'Balance Scale Equation Solver (F26)',
      equation: 'Equation',
      lhs: 'Left Hand Side (LHS)',
      rhs: 'Right Hand Side (RHS)',
      variable: 'Variable Weight (x)',
      unitWeight: 'Unit Weight (1)',
      balanced: 'Balanced ✅',
      unbalanced: 'Unbalanced ⚖️',
      solved: 'Equation Solved! 🎉',
      operations: 'Operations on Both Sides',
      subConst: 'Subtract Constant from Both Sides',
      sub1: '−1 Both Sides',
      add1: '+1 Both Sides',
      divCoeff: 'Divide Both Sides by Coefficient',
      reset: 'Reset Equation',
      nextPreset: 'Next Equation',
      stepLog: 'Step-by-step Solution',
    };
  }
}

// ============================================================================
// 3. Procedural Audio Synthesizer (Zero External Dependencies)
// ============================================================================

export class BalanceEquationAudioSynthesizer {
  private ctx: any = null;

  constructor() {}

  private initCtx(): boolean {
    if (typeof window === 'undefined') return false;
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return false;
    if (!this.ctx) {
      try {
        this.ctx = new AudioCtx();
      } catch {
        return false;
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return true;
  }

  public playClink(): void {
    if (!this.initCtx() || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.08);

      gain.gain.setValueAtTime(0.07, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.1);
    } catch {}
  }

  public playVictoryChord(): void {
    if (!this.initCtx() || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const freqs = [523.25, 659.25, 783.99]; // C5, E5, G5 major triad
      for (let i = 0; i < freqs.length; i++) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freqs[i], now + i * 0.05);

        gain.gain.setValueAtTime(0.05, now + i * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + i * 0.05);
        osc.stop(now + 0.4);
      }
    } catch {}
  }
}

// ============================================================================
// 4. Safe Isomorphic DOM Base Class
// ============================================================================

const HTMLElementBase: typeof HTMLElement =
  typeof globalThis.HTMLElement !== 'undefined'
    ? globalThis.HTMLElement
    : (class MockHTMLElement {
        public shadowRoot: any = null;
        public attachShadow() {
          this.shadowRoot = {
            innerHTML: '',
            appendChild: () => {},
            getElementById: () => null,
            querySelector: () => null,
            querySelectorAll: () => [],
            addEventListener: () => {},
          };
          return this.shadowRoot;
        }
        public dispatchEvent() {
          return true;
        }
        public addEventListener() {}
        public removeEventListener() {}
        public getAttribute() { return null; }
        public setAttribute() {}
      } as unknown as typeof HTMLElement);

// ============================================================================
// 5. High-Fidelity Custom Element: <aasha-sim-balance-equation>
// ============================================================================

export class AashaSimBalanceEquation extends HTMLElementBase {
  public static readonly TAG_NAME = 'aasha-sim-balance-equation';
  public static readonly ALIAS_TAG_NAME = 'aasha-sim';

  private state: BalanceEquationState;
  private animFrameId: number | null = null;
  private isPaused: boolean = false;
  private audioSynth: BalanceEquationAudioSynthesizer;
  private currentTiltAngle: number = 0;
  private targetTiltAngle: number = 0;

  constructor(config?: BalanceEquationConfig) {
    super();
    this.attachShadow({ mode: 'open' });
    this.audioSynth = new BalanceEquationAudioSynthesizer();

    const pIdx = config?.presetId ?? 0;
    const preset = BalanceEquationMathEvaluator.PRESETS[pIdx] || BalanceEquationMathEvaluator.PRESETS[0];
    const root = BalanceEquationMathEvaluator.solveRoot(preset.a, preset.b, preset.c);

    this.state = {
      presetId: pIdx,
      initialXCoeff: preset.a,
      initialConstant: preset.b,
      initialRightConst: preset.c,
      currentXCoeff: preset.a,
      currentLeftConst: preset.b,
      currentRightConst: preset.c,
      targetXValue: root,
      isSolved: false,
      isBalanced: true,
      theme: config?.theme ?? 'dark',
      lang: config?.lang ?? 'en',
      soundEnabled: config?.soundEnabled ?? false,
      stepHistory: [],
    };
  }

  // --- Web Component Lifecycle ---

  public connectedCallback(): void {
    if (!this.shadowRoot) return;
    this.render();
    this.bindEvents();
    this.startAnimationLoop();
    this.emitTelemetry('mount', { state: this.getState() });
  }

  public disconnectedCallback(): void {
    this.stopAnimationLoop();
    this.emitTelemetry('unmount', { state: this.getState() });
  }

  // --- Aasha Experience Contract Methods ---

  public getState(): Readonly<BalanceEquationState> {
    return { ...this.state };
  }

  public getMetrics(): BalanceEquationMetrics {
    return BalanceEquationMathEvaluator.computeMetrics(
      this.state.currentXCoeff,
      this.state.currentLeftConst,
      this.state.currentRightConst,
      this.state.targetXValue,
      this.state.stepHistory.length
    );
  }

  public setState(partial: Partial<BalanceEquationState>): void {
    if (partial.currentXCoeff !== undefined) this.state.currentXCoeff = Math.max(0, partial.currentXCoeff);
    if (partial.currentLeftConst !== undefined) this.state.currentLeftConst = partial.currentLeftConst;
    if (partial.currentRightConst !== undefined) this.state.currentRightConst = partial.currentRightConst;
    if (partial.presetId !== undefined) this.loadPreset(partial.presetId);
    if (partial.theme !== undefined) {
      this.state.theme = partial.theme;
      this.applyTheme();
    }
    if (partial.lang !== undefined) this.state.lang = partial.lang;
    if (partial.soundEnabled !== undefined) this.state.soundEnabled = partial.soundEnabled;

    const metrics = this.getMetrics();
    this.state.isBalanced = metrics.isBalanced;
    this.state.isSolved = metrics.isSolved;
    this.targetTiltAngle = metrics.tiltAngleDeg;

    if (this.state.soundEnabled) {
      if (this.state.isSolved) this.audioSynth.playVictoryChord();
      else this.audioSynth.playClink();
    }

    this.updateReadouts();
    this.emitStateChange();
  }

  public loadPreset(idx: number): void {
    const validIdx = (idx >= 0 && idx < BalanceEquationMathEvaluator.PRESETS.length) ? idx : 0;
    const preset = BalanceEquationMathEvaluator.PRESETS[validIdx];
    const root = BalanceEquationMathEvaluator.solveRoot(preset.a, preset.b, preset.c);

    this.state.presetId = validIdx;
    this.state.initialXCoeff = preset.a;
    this.state.initialConstant = preset.b;
    this.state.initialRightConst = preset.c;
    this.state.currentXCoeff = preset.a;
    this.state.currentLeftConst = preset.b;
    this.state.currentRightConst = preset.c;
    this.state.targetXValue = root;
    this.state.isSolved = false;
    this.state.isBalanced = true;
    this.state.stepHistory = [];
    this.targetTiltAngle = 0;
    this.currentTiltAngle = 0;

    this.updateReadouts();
  }

  /**
   * Algebraic Operation: Subtract val from both sides
   */
  public subtractBothSides(val: number): void {
    if (val === 0) return;
    const nextLeft = this.state.currentLeftConst - val;
    const nextRight = this.state.currentRightConst - val;

    this.state.stepHistory.push({
      descriptionEn: `Subtract ${val} from both sides`,
      descriptionHi: `दोनों पक्षों से ${val} घटाया`,
      leftX: this.state.currentXCoeff,
      leftC: nextLeft,
      rightC: nextRight,
      timestamp: Date.now(),
    });

    this.setState({
      currentLeftConst: nextLeft,
      currentRightConst: nextRight,
    });
  }

  /**
   * Algebraic Operation: Add val to both sides
   */
  public addBothSides(val: number): void {
    if (val === 0) return;
    const nextLeft = this.state.currentLeftConst + val;
    const nextRight = this.state.currentRightConst + val;

    this.state.stepHistory.push({
      descriptionEn: `Add ${val} to both sides`,
      descriptionHi: `दोनों पक्षों में ${val} जोड़ा`,
      leftX: this.state.currentXCoeff,
      leftC: nextLeft,
      rightC: nextRight,
      timestamp: Date.now(),
    });

    this.setState({
      currentLeftConst: nextLeft,
      currentRightConst: nextRight,
    });
  }

  /**
   * Algebraic Operation: Divide both sides by coefficient
   */
  public divideBothSides(): void {
    const coeff = this.state.currentXCoeff;
    if (coeff <= 1) return;

    const nextX = 1;
    const nextRight = this.state.currentRightConst / coeff;
    const nextLeft = this.state.currentLeftConst / coeff;

    this.state.stepHistory.push({
      descriptionEn: `Divide both sides by ${coeff}`,
      descriptionHi: `दोनों पक्षों को ${coeff} से भाग दिया`,
      leftX: nextX,
      leftC: nextLeft,
      rightC: nextRight,
      timestamp: Date.now(),
    });

    this.setState({
      currentXCoeff: nextX,
      currentLeftConst: nextLeft,
      currentRightConst: nextRight,
    });
  }

  public reset(): void {
    this.loadPreset(this.state.presetId);
    this.emitTelemetry('reset', { state: this.getState() });
  }

  public nextPreset(): void {
    const nextIdx = (this.state.presetId + 1) % BalanceEquationMathEvaluator.PRESETS.length;
    this.loadPreset(nextIdx);
    this.emitTelemetry('next_preset', { presetId: nextIdx });
  }

  public pause(): void {
    this.isPaused = true;
    this.stopAnimationLoop();
    this.emitTelemetry('pause', { state: this.getState() });
  }

  public resume(): void {
    if (!this.isPaused) return;
    this.isPaused = false;
    this.startAnimationLoop();
    this.emitTelemetry('resume', { state: this.getState() });
  }

  public destroy(): void {
    this.pause();
    if (this.shadowRoot) {
      this.shadowRoot.innerHTML = '';
    }
    this.emitTelemetry('destroy', {});
  }

  public emitTelemetry(eventType: string, payload: Record<string, unknown>): void {
    const event = new CustomEvent('aasha:telemetry', {
      bubbles: true,
      composed: true,
      detail: {
        foundationId: 'F26',
        foundationName: 'Balance Scale Linear Equation Solver',
        experienceId: 'balance_equation_sim',
        eventType,
        payload,
        timestamp: Date.now(),
      },
    });
    this.dispatchEvent(event);
  }

  private emitStateChange(): void {
    const event = new CustomEvent('aasha:state_change', {
      bubbles: true,
      composed: true,
      detail: {
        state: this.getState(),
        metrics: this.getMetrics(),
        timestamp: Date.now(),
      },
    });
    this.dispatchEvent(event);
  }

  // --- Rendering & Inlined Styles ---

  private render(): void {
    if (!this.shadowRoot) return;
    const labels = BalanceEquationMathEvaluator.getLabels(this.state.lang);
    const metrics = this.getMetrics();

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          width: 100%;
          max-width: 620px;
          margin: 0 auto;
          box-sizing: border-box;
          font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          user-select: none;
          -webkit-user-select: none;

          /* Dark Theme Tokens Baseline */
          --bs-bg: #0F172A;
          --bs-card: #1E293B;
          --bs-border: #334155;
          --bs-text: #F8FAFC;
          --bs-text-muted: #94A3B8;
          --bs-gold: #F59E0B;
          --bs-sky: #38BDF8;
          --bs-emerald: #10B981;
          --bs-danger: #EF4444;
          --bs-touch-min: 44px;
        }

        :host([data-theme="light"]), :host(.theme-light) {
          --bs-bg: #F8FAFC;
          --bs-card: #FFFFFF;
          --bs-border: #CBD5E1;
          --bs-text: #0F172A;
          --bs-text-muted: #64748B;
          --bs-gold: #D97706;
          --bs-sky: #0284C7;
          --bs-emerald: #059669;
          --bs-danger: #DC2626;
        }

        .bs-wrapper {
          background: var(--bs-bg);
          color: var(--bs-text);
          border: 1px solid var(--bs-border);
          border-radius: 16px;
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          box-sizing: border-box;
          width: 100%;
        }

        /* Header */
        .header-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 8px;
        }

        .title-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          font-weight: 700;
          font-size: 0.95rem;
          color: var(--bs-gold);
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        /* Touch Targets Invariant (>= 44x44px) */
        button, .touch-btn {
          min-width: var(--bs-touch-min);
          min-height: var(--bs-touch-min);
          padding: 8px 12px;
          border-radius: 10px;
          border: 1px solid var(--bs-border);
          background: var(--bs-card);
          color: var(--bs-text);
          font-weight: 700;
          font-size: 0.85rem;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          touch-action: manipulation;
          transition: background 0.15s ease, transform 0.1s ease;
          box-sizing: border-box;
        }

        button:active, .touch-btn:active {
          transform: scale(0.97);
        }

        /* Stage Canvas */
        .stage-box {
          position: relative;
          width: 100%;
          height: 220px;
          background: var(--bs-card);
          border: 1px solid var(--bs-border);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          box-sizing: border-box;
        }

        canvas {
          display: block;
          width: 100%;
          height: 100%;
        }

        /* Equation Status Banner */
        .eq-banner {
          background: rgba(245, 158, 11, 0.15);
          border: 1px solid rgba(245, 158, 11, 0.35);
          border-radius: 10px;
          padding: 10px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 8px;
        }

        .eq-display {
          font-size: 1.25rem;
          font-weight: 800;
          color: var(--bs-gold);
          letter-spacing: 0.5px;
        }

        .status-pill {
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 0.8rem;
          font-weight: 700;
          background: rgba(16, 185, 129, 0.2);
          color: var(--bs-emerald);
          border: 1px solid rgba(16, 185, 129, 0.4);
        }

        .status-pill.unbalanced {
          background: rgba(239, 68, 68, 0.2);
          color: var(--bs-danger);
          border-color: rgba(239, 68, 68, 0.4);
        }

        /* Operations Toolbar */
        .controls-panel {
          display: flex;
          flex-direction: column;
          gap: 10px;
          background: var(--bs-card);
          border: 1px solid var(--bs-border);
          border-radius: 12px;
          padding: 12px;
          box-sizing: border-box;
        }

        .op-buttons-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
          gap: 8px;
        }

        .op-btn {
          background: rgba(56, 189, 248, 0.12);
          color: var(--bs-sky);
          border-color: rgba(56, 189, 248, 0.3);
        }

        .op-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        /* Step Log */
        .step-log-panel {
          background: var(--bs-card);
          border: 1px solid var(--bs-border);
          border-radius: 12px;
          padding: 8px 12px;
          display: flex;
          flex-direction: column;
          gap: 4px;
          max-height: 85px;
          overflow-y: auto;
          font-size: 0.78rem;
        }

        .step-item {
          color: var(--bs-text-muted);
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .step-item strong {
          color: var(--bs-sky);
        }

        @media (max-width: 480px) {
          .stage-box {
            height: 180px;
          }
          .op-buttons-grid {
            grid-template-columns: 1fr 1fr;
          }
        }
      </style>

      <div class="bs-wrapper" id="bsWrapper">
        <!-- Header -->
        <div class="header-bar">
          <div class="title-badge">
            <span>⚖️</span>
            <span>${labels.title}</span>
          </div>
          <div class="header-actions">
            <button class="touch-btn" id="btnPreset" title="${labels.nextPreset}" aria-label="Next Equation Preset">
              📋 ${labels.nextPreset}
            </button>
            <button class="touch-btn" id="btnLang" title="Toggle Language" aria-label="Toggle Language">
              ${this.state.lang === 'hi' ? 'EN' : 'हिं'}
            </button>
            <button class="touch-btn" id="btnAudio" title="Toggle Audio" aria-label="Toggle Audio">
              ${this.state.soundEnabled ? '🔊' : '🔇'}
            </button>
            <button class="touch-btn" id="btnReset" title="${labels.reset}" aria-label="Reset Balance Scale">
              ↺
            </button>
          </div>
        </div>

        <!-- 60 FPS Balance Scale Stage -->
        <div class="stage-box" id="stageBox">
          <canvas id="simCanvas" width="600" height="220" role="img" aria-label="Interactive Balance Scale"></canvas>
        </div>

        <!-- Active Equation Banner -->
        <div class="eq-banner">
          <span class="eq-display" id="dispEq">${metrics.equationString}</span>
          <span class="status-pill ${metrics.isBalanced ? '' : 'unbalanced'}" id="dispStatus">
            ${metrics.isSolved ? labels.solved : metrics.isBalanced ? labels.balanced : labels.unbalanced}
          </span>
        </div>

        <!-- Operations Toolbar -->
        <div class="controls-panel">
          <span style="font-size: 0.78rem; font-weight: 700; color: var(--bs-text-muted);">
            🛠️ ${labels.operations}
          </span>
          <div class="op-buttons-grid">
            <button class="touch-btn op-btn" id="btnSubConst" ${this.state.currentLeftConst === 0 ? 'disabled' : ''}>
              −${this.state.currentLeftConst > 0 ? this.state.currentLeftConst : 1} Both Sides
            </button>
            <button class="touch-btn op-btn" id="btnSub1">
              −1 Both Sides
            </button>
            <button class="touch-btn op-btn" id="btnAdd1">
              +1 Both Sides
            </button>
            <button class="touch-btn op-btn" id="btnDivCoeff" ${this.state.currentXCoeff <= 1 || this.state.currentLeftConst !== 0 ? 'disabled' : ''}>
              ÷ ${this.state.currentXCoeff} Both Sides
            </button>
          </div>
        </div>

        <!-- Step History Log -->
        <div class="step-log-panel" id="stepLog">
          <div class="step-item">
            <strong>Initial:</strong> ${BalanceEquationMathEvaluator.formatEquation(this.state.initialXCoeff, this.state.initialConstant, this.state.initialRightConst)}
          </div>
        </div>
      </div>
    `;

    this.applyTheme();
  }

  private applyTheme(): void {
    if (!this.shadowRoot) return;
    const wrapper = this.shadowRoot.getElementById('bsWrapper');
    if (!wrapper) return;
    if (this.state.theme === 'light') {
      this.classList.add('theme-light');
      this.setAttribute('data-theme', 'light');
    } else {
      this.classList.remove('theme-light');
      this.removeAttribute('data-theme');
    }
  }

  // --- Event Handling ---

  private bindEvents(): void {
    if (!this.shadowRoot) return;

    this.shadowRoot.getElementById('btnSubConst')?.addEventListener('click', () => {
      if (this.state.currentLeftConst !== 0) {
        this.subtractBothSides(this.state.currentLeftConst);
      }
    });

    this.shadowRoot.getElementById('btnSub1')?.addEventListener('click', () => {
      this.subtractBothSides(1);
    });

    this.shadowRoot.getElementById('btnAdd1')?.addEventListener('click', () => {
      this.addBothSides(1);
    });

    this.shadowRoot.getElementById('btnDivCoeff')?.addEventListener('click', () => {
      this.divideBothSides();
    });

    this.shadowRoot.getElementById('btnReset')?.addEventListener('click', () => this.reset());
    this.shadowRoot.getElementById('btnPreset')?.addEventListener('click', () => this.nextPreset());

    this.shadowRoot.getElementById('btnLang')?.addEventListener('click', () => {
      this.state.lang = this.state.lang === 'en' ? 'hi' : 'en';
      this.render();
      this.bindEvents();
    });

    this.shadowRoot.getElementById('btnAudio')?.addEventListener('click', () => {
      this.setState({ soundEnabled: !this.state.soundEnabled });
      const b = this.shadowRoot?.getElementById('btnAudio');
      if (b) b.textContent = this.state.soundEnabled ? '🔊' : '🔇';
    });
  }

  private updateReadouts(): void {
    if (!this.shadowRoot) return;
    const metrics = this.getMetrics();
    const labels = BalanceEquationMathEvaluator.getLabels(this.state.lang);

    const dispEq = this.shadowRoot.getElementById('dispEq');
    const dispStatus = this.shadowRoot.getElementById('dispStatus');
    const btnSubConst = this.shadowRoot.getElementById('btnSubConst') as HTMLButtonElement | null;
    const btnDivCoeff = this.shadowRoot.getElementById('btnDivCoeff') as HTMLButtonElement | null;
    const stepLog = this.shadowRoot.getElementById('stepLog');

    if (dispEq) dispEq.textContent = metrics.equationString;
    if (dispStatus) {
      dispStatus.textContent = metrics.isSolved ? labels.solved : metrics.isBalanced ? labels.balanced : labels.unbalanced;
      dispStatus.className = `status-pill ${metrics.isBalanced ? '' : 'unbalanced'}`;
    }

    if (btnSubConst) {
      btnSubConst.disabled = this.state.currentLeftConst === 0;
      btnSubConst.textContent = `−${this.state.currentLeftConst > 0 ? this.state.currentLeftConst : 1} Both Sides`;
    }

    if (btnDivCoeff) {
      btnDivCoeff.disabled = this.state.currentXCoeff <= 1 || this.state.currentLeftConst !== 0;
      btnDivCoeff.textContent = `÷ ${this.state.currentXCoeff} Both Sides`;
    }

    if (stepLog) {
      const isHi = this.state.lang === 'hi';
      let html = `<div class="step-item"><strong>Start:</strong> ${BalanceEquationMathEvaluator.formatEquation(this.state.initialXCoeff, this.state.initialConstant, this.state.initialRightConst)}</div>`;
      for (let i = 0; i < this.state.stepHistory.length; i++) {
        const s = this.state.stepHistory[i];
        const desc = isHi ? s.descriptionHi : s.descriptionEn;
        const res = BalanceEquationMathEvaluator.formatEquation(s.leftX, s.leftC, s.rightC);
        html += `<div class="step-item"><strong>Step ${i + 1}:</strong> ${desc} ➔ ${res}</div>`;
      }
      stepLog.innerHTML = html;
      stepLog.scrollTop = stepLog.scrollHeight;
    }
  }

  // --- 60 FPS Canvas Rendering Engine ---

  private startAnimationLoop(): void {
    if (typeof window === 'undefined') return;
    const loop = () => {
      if (!this.isPaused) {
        this.updateAnimationState();
        this.drawCanvas();
      }
      this.animFrameId = window.requestAnimationFrame(loop);
    };
    this.animFrameId = window.requestAnimationFrame(loop);
  }

  private stopAnimationLoop(): void {
    if (typeof window !== 'undefined' && this.animFrameId !== null) {
      window.cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  private updateAnimationState(): void {
    // Spring tilt physics interpolation (60 FPS)
    const springSpeed = 0.16;
    this.currentTiltAngle += (this.targetTiltAngle - this.currentTiltAngle) * springSpeed;
  }

  private drawCanvas(): void {
    if (!this.shadowRoot) return;
    const canvas = this.shadowRoot.getElementById('simCanvas') as HTMLCanvasElement | null;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    const rect = canvas.getBoundingClientRect();
    const width = rect.width || 600;
    const height = rect.height || 220;

    if (canvas.width !== Math.round(width * dpr) || canvas.height !== Math.round(height * dpr)) {
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
    }

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    const isLight = this.state.theme === 'light';
    const cx = width / 2;
    const fulcrumY = height * 0.48;
    const beamHalfLen = Math.min(220, width * 0.38);

    // 1. Fulcrum Base & Stand
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(cx - 30, height - 16);
    ctx.lineTo(cx + 30, height - 16);
    ctx.lineTo(cx + 10, fulcrumY);
    ctx.lineTo(cx - 10, fulcrumY);
    ctx.closePath();
    ctx.fillStyle = isLight ? '#94A3B8' : '#334155';
    ctx.fill();
    ctx.strokeStyle = isLight ? '#64748B' : '#475569';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Fulcrum Pivot Pin
    ctx.beginPath();
    ctx.arc(cx, fulcrumY, 8, 0, Math.PI * 2);
    ctx.fillStyle = '#F59E0B';
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();

    // 2. Rotating Beam
    const rad = (this.currentTiltAngle * Math.PI) / 180;
    const cosA = Math.cos(rad);
    const sinA = Math.sin(rad);

    const leftPivotX = cx - beamHalfLen * cosA;
    const leftPivotY = fulcrumY - beamHalfLen * sinA;
    const rightPivotX = cx + beamHalfLen * cosA;
    const rightPivotY = fulcrumY + beamHalfLen * sinA;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(leftPivotX, leftPivotY);
    ctx.lineTo(rightPivotX, rightPivotY);
    ctx.lineWidth = 5.0;
    ctx.strokeStyle = this.state.isBalanced ? '#10B981' : '#F59E0B';
    ctx.stroke();
    ctx.restore();

    // 3. Hanging Pans
    const panStringLen = 50;
    const panWidth = 100;
    const panHeight = 14;

    const drawPan = (
      px: number,
      py: number,
      xCount: number,
      unitCount: number,
      isLeft: boolean
    ) => {
      const panCenterX = px;
      const panBottomY = py + panStringLen;

      // Hanging strings
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(panCenterX - panWidth / 2 + 8, panBottomY);
      ctx.moveTo(px, py);
      ctx.lineTo(panCenterX + panWidth / 2 - 8, panBottomY);
      ctx.strokeStyle = isLight ? '#94A3B8' : '#64748B';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Pan Tray
      ctx.beginPath();
      ctx.roundRect(panCenterX - panWidth / 2, panBottomY, panWidth, panHeight, [0, 0, 10, 10]);
      ctx.fillStyle = isLight ? '#CBD5E1' : '#1E293B';
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = this.state.isBalanced ? '#10B981' : isLight ? '#94A3B8' : '#475569';
      ctx.stroke();

      // Render Weights in Pan
      let currentDrawX = panCenterX - panWidth / 2 + 10;
      const weightBottomY = panBottomY;

      // Variable x boxes (indigo rectangles)
      for (let i = 0; i < xCount; i++) {
        const boxW = 22;
        const boxH = 26;
        ctx.beginPath();
        ctx.roundRect(currentDrawX, weightBottomY - boxH, boxW, boxH, 4);
        ctx.fillStyle = '#6366F1';
        ctx.fill();
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 12px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('x', currentDrawX + boxW / 2, weightBottomY - boxH / 2);

        currentDrawX += boxW + 4;
      }

      // Unit weights (gold coins / blocks)
      const maxUnitsToRender = Math.min(10, Math.max(0, unitCount));
      const coinRadius = 6;
      for (let i = 0; i < maxUnitsToRender; i++) {
        const col = i % 4;
        const row = Math.floor(i / 4);
        const cxCoin = currentDrawX + col * 13 + 6;
        const cyCoin = weightBottomY - 8 - row * 13;

        ctx.beginPath();
        ctx.arc(cxCoin, cyCoin, coinRadius, 0, Math.PI * 2);
        ctx.fillStyle = '#F59E0B';
        ctx.fill();
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 8px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('1', cxCoin, cyCoin);
      }

      // Label below pan
      ctx.font = 'bold 11px system-ui, sans-serif';
      ctx.fillStyle = isLeft ? (isLight ? '#0284C7' : '#38BDF8') : (isLight ? '#D97706' : '#F59E0B');
      ctx.textAlign = 'center';
      ctx.fillText(
        isLeft ? `LHS: ${BalanceEquationMathEvaluator.formatEquation(xCount, unitCount, 0).split('=')[0]}` : `RHS: ${unitCount}`,
        panCenterX,
        panBottomY + panHeight + 14
      );
    };

    // Draw Left Pan
    drawPan(
      leftPivotX,
      leftPivotY,
      this.state.currentXCoeff,
      this.state.currentLeftConst,
      true
    );

    // Draw Right Pan
    drawPan(
      rightPivotX,
      rightPivotY,
      0,
      this.state.currentRightConst,
      false
    );

    ctx.restore();
  }
}

// ============================================================================
// 6. Custom Element Registration
// ============================================================================

if (typeof customElements !== 'undefined') {
  if (!customElements.get(AashaSimBalanceEquation.TAG_NAME)) {
    customElements.define(AashaSimBalanceEquation.TAG_NAME, AashaSimBalanceEquation);
  }
  if (!customElements.get(AashaSimBalanceEquation.ALIAS_TAG_NAME)) {
    customElements.define(AashaSimBalanceEquation.ALIAS_TAG_NAME, AashaSimBalanceEquation);
  }
}

// ============================================================================
// 7. Standalone Inlined Simulation Script Generator (Zero-Cost Embedding)
// ============================================================================

export function generateBalanceEquationSimScript(config?: BalanceEquationConfig): string {
  const defaultPreset = config?.presetId ?? 0;

  return `
(function() {
  if (customElements.get('aasha-sim-balance-equation')) return;

  const PRESETS = [
    { a: 2, b: 3, c: 11 },
    { a: 3, b: 2, c: 14 },
    { a: 2, b: 6, c: 12 },
    { a: 4, b: 4, c: 20 },
  ];

  class AashaSimBalanceEquationElement extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      const p = PRESETS[${defaultPreset}] || PRESETS[0];
      this.state = {
        a: p.a, b: p.b, c: p.c,
        root: (p.c - p.b) / p.a,
        presetIdx: ${defaultPreset},
        lang: window.__AASHA_LANG__ || 'en'
      };
      this._animId = null;
    }

    connectedCallback() {
      this.render();
      this.bindEvents();
      this.startLoop();
      this.emitTelemetry('mount', { state: this.state });
    }

    disconnectedCallback() {
      if (this._animId) cancelAnimationFrame(this._animId);
      this._animId = null;
    }

    getState() { return { ...this.state }; }
    setState(s) {
      Object.assign(this.state, s);
      this.syncUI();
      this.dispatchEvent(new CustomEvent('aasha:state_change', { bubbles: true, composed: true, detail: { state: this.getState() } }));
    }

    subtractBoth(val) {
      this.setState({ b: this.state.b - val, c: this.state.c - val });
      this.emitTelemetry('op_subtract', { val });
    }

    addBoth(val) {
      this.setState({ b: this.state.b + val, c: this.state.c + val });
      this.emitTelemetry('op_add', { val });
    }

    divideBoth() {
      const coeff = this.state.a;
      if (coeff <= 1) return;
      this.setState({ a: 1, b: this.state.b / coeff, c: this.state.c / coeff });
      this.emitTelemetry('op_divide', { coeff });
    }

    reset() {
      const p = PRESETS[this.state.presetIdx];
      this.setState({ a: p.a, b: p.b, c: p.c });
      this.emitTelemetry('reset', {});
    }

    nextPreset() {
      const nextIdx = (this.state.presetIdx + 1) % PRESETS.length;
      const p = PRESETS[nextIdx];
      this.setState({ a: p.a, b: p.b, c: p.c, root: (p.c - p.b) / p.a, presetIdx: nextIdx });
      this.emitTelemetry('next_preset', { presetIdx: nextIdx });
    }

    emitTelemetry(eventType, payload) {
      this.dispatchEvent(new CustomEvent('aasha:telemetry', {
        bubbles: true, composed: true,
        detail: { foundationId: 'F26', experienceId: 'balance_equation_sim', eventType, payload, timestamp: Date.now() }
      }));
    }

    render() {
      this.shadowRoot.innerHTML = \`
        <style>
          :host { display: block; width: 100%; max-width: 600px; margin: 0 auto; font-family: system-ui, sans-serif; box-sizing: border-box; }
          .sim-box { background: #0F172A; color: #F8FAFC; border: 1px solid #334155; border-radius: 14px; padding: 12px; display: flex; flex-direction: column; gap: 10px; }
          .header { display: flex; justify-content: space-between; align-items: center; }
          .title { font-weight: 700; color: #F59E0B; font-size: 0.95rem; }
          .stage { width: 100%; height: 180px; background: #1E293B; border-radius: 10px; border: 1px solid #334155; }
          canvas { width: 100%; height: 100%; }
          .eq-banner { background: rgba(245, 158, 11, 0.15); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 8px; padding: 8px; text-align: center; font-weight: 800; font-size: 1.1rem; color: #F59E0B; }
          .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; }
          button, .btn { min-width: 44px; min-height: 44px; padding: 6px 10px; background: #334155; color: #FFF; border: none; border-radius: 8px; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; touch-action: manipulation; }
          .btn-op { background: rgba(56, 189, 248, 0.2); color: #38BDF8; }
          button:disabled { opacity: 0.4; cursor: not-allowed; }
        </style>
        <div class="sim-box">
          <div class="header">
            <span class="title">⚖️ Balance Equation Solver (F26)</span>
            <div style="display: flex; gap: 6px;">
              <button id="btnNext" title="Next Preset">📋 Next</button>
              <button id="btnReset" title="Reset">↺</button>
            </div>
          </div>
          <div class="stage"><canvas id="cv" width="560" height="180"></canvas></div>
          <div class="eq-banner" id="dispEq">2x + 3 = 11</div>
          <div class="grid">
            <button class="btn btn-op" id="bSubConst">−b Both</button>
            <button class="btn btn-op" id="bSub1">−1 Both</button>
            <button class="btn btn-op" id="bAdd1">+1 Both</button>
            <button class="btn btn-op" id="bDiv">÷ Coeff</button>
          </div>
        </div>
      \`;
    }

    bindEvents() {
      const q = (id) => this.shadowRoot.getElementById(id);
      q('bSubConst').addEventListener('click', () => { if (this.state.b !== 0) this.subtractBoth(this.state.b); });
      q('bSub1').addEventListener('click', () => this.subtractBoth(1));
      q('bAdd1').addEventListener('click', () => this.addBoth(1));
      q('bDiv').addEventListener('click', () => this.divideBoth());
      q('btnReset').addEventListener('click', () => this.reset());
      q('btnNext').addEventListener('click', () => this.nextPreset());
    }

    syncUI() {
      const q = (id) => this.shadowRoot.getElementById(id);
      if (!q('dispEq')) return;
      const { a, b, c } = this.state;
      let lhs = a > 0 ? (a === 1 ? 'x' : a + 'x') : '';
      if (b > 0) lhs += ' + ' + b;
      else if (b < 0) lhs += ' − ' + Math.abs(b);
      q('dispEq').textContent = (lhs || '0') + ' = ' + c;
      q('bSubConst').disabled = b === 0;
      q('bDiv').disabled = a <= 1 || b !== 0;
    }

    startLoop() {
      const cv = this.shadowRoot.getElementById('cv');
      if (!cv) return;
      const ctx = cv.getContext('2d');
      const loop = () => {
        this.draw(ctx, cv.width, cv.height);
        this._animId = requestAnimationFrame(loop);
      };
      this._animId = requestAnimationFrame(loop);
    }

    draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h);
      const cx = w / 2, cy = h * 0.48, beamLen = 180;
      const { a, b, c, root } = this.state;
      const diff = (a * root + b) - c;
      const angle = Math.max(-0.25, Math.min(0.25, diff * 0.04));

      // Stand
      ctx.beginPath();
      ctx.moveTo(cx - 20, h - 10);
      ctx.lineTo(cx + 20, h - 10);
      ctx.lineTo(cx, cy);
      ctx.closePath();
      ctx.fillStyle = '#475569';
      ctx.fill();

      // Beam
      const cos = Math.cos(angle), sin = Math.sin(angle);
      const lx = cx - beamLen * cos, ly = cy - beamLen * sin;
      const rx = cx + beamLen * cos, ry = cy + beamLen * sin;

      ctx.beginPath();
      ctx.moveTo(lx, ly);
      ctx.lineTo(rx, ry);
      ctx.lineWidth = 4;
      ctx.strokeStyle = diff === 0 ? '#10B981' : '#F59E0B';
      ctx.stroke();

      // Pans
      const panDrop = 40;
      const drawP = (px, py, text) => {
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(px - 35, py + panDrop);
        ctx.moveTo(px, py);
        ctx.lineTo(px + 35, py + panDrop);
        ctx.strokeStyle = '#64748B';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.beginPath();
        ctx.rect(px - 40, py + panDrop, 80, 10);
        ctx.fillStyle = '#334155';
        ctx.fill();

        ctx.font = 'bold 11px sans-serif';
        ctx.fillStyle = '#F8FAFC';
        ctx.textAlign = 'center';
        ctx.fillText(text, px, py + panDrop + 22);
      };

      drawP(lx, ly, 'LHS: ' + (a > 0 ? a + 'x+' + b : b));
      drawP(rx, ry, 'RHS: ' + c);
    }
  }

  customElements.define('aasha-sim-balance-equation', AashaSimBalanceEquationElement);
  if (!customElements.get('aasha-sim')) {
    customElements.define('aasha-sim', AashaSimBalanceEquationElement);
  }
})();
  `.trim();
}
