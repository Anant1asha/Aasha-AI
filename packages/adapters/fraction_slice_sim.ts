/**
 * AASHA AIOS — Foundation F24: Dynamic Fraction & Decimal Slices Simulation Adapter
 * Path: Aasha-AI/packages/adapters/fraction_slice_sim.ts
 *
 * Implements King's Math Dynamic Fraction & Decimal Slices (Foundation F24)
 * as a high-fidelity, self-contained Web Component (<aasha-sim-fraction-slice> / <aasha-sim>).
 *
 * Invariants:
 * - 100% Offline-first: zero external CDN scripts, zero external web fonts.
 * - Same-frame mobile ergonomics: touch targets >= 44x44px, responsive viewport clamping.
 * - 60 FPS HTML5 Canvas rendering with smooth interpolation.
 * - Interactive controls: numerator slider (1-12), denominator slider (1-12),
 *   slice mode toggle (circular pie vs rectangular strip), decimal/percentage readout.
 * - Bilingual support: English and Hindi terminology.
 * - Pure mathematical evaluation decoupled from UI presentation.
 * - Isomorphic: safely importable in Node.js runtime and browser contexts.
 */

// ============================================================================
// 1. Types & State Contracts
// ============================================================================

export type SliceMode = 'pie' | 'strip';
export type ThemeMode = 'dark' | 'light' | 'auto';
export type LanguageMode = 'en' | 'hi';
export type FractionClassification = 'PROPER' | 'IMPROPER' | 'WHOLE' | 'UNIT';

export interface FractionSliceState {
  numerator: number;        // 1 to 12
  denominator: number;      // 1 to 12
  mode: SliceMode;          // 'pie' | 'strip'
  theme: ThemeMode;
  lang: LanguageMode;
  soundEnabled: boolean;
  lastInteractionTime: number;
}

export interface FractionMetrics {
  numerator: number;
  denominator: number;
  decimal: number;               // e.g. 0.75
  decimalFormatted: string;      // e.g. "0.75" or "0.333..."
  percentage: number;            // e.g. 75
  percentageFormatted: string;   // e.g. "75%"
  simplifiedNumerator: number;
  simplifiedDenominator: number;
  isSimplified: boolean;
  classification: FractionClassification;
  classificationLabelEn: string;
  classificationLabelHi: string;
  anglePerSliceDeg: number;
  anglePerSliceRad: number;
  wholeUnits: number;
  remainderNumerator: number;
}

export interface FractionSliceConfig {
  initialNumerator?: number;
  initialDenominator?: number;
  initialMode?: SliceMode;
  initialTheme?: ThemeMode;
  initialLang?: LanguageMode;
  soundEnabled?: boolean;
  minVal?: number;
  maxVal?: number;
}

// ============================================================================
// 2. Deterministic Mathematical Evaluator (Pure Engine)
// ============================================================================

export class FractionSliceMathEvaluator {
  public static readonly MIN_BOUND = 1;
  public static readonly MAX_BOUND = 12;

  /**
   * Euclidean greatest common divisor (GCD)
   */
  public static gcd(a: number, b: number): number {
    let x = Math.abs(Math.round(a));
    let y = Math.abs(Math.round(b));
    while (y !== 0) {
      const temp = y;
      y = x % y;
      x = temp;
    }
    return x || 1;
  }

  /**
   * Clamps integer value to safe slider domain [MIN_BOUND, MAX_BOUND]
   */
  public static clamp(val: number, min: number = this.MIN_BOUND, max: number = this.MAX_BOUND): number {
    const n = Math.round(Number.isFinite(val) ? val : min);
    return Math.max(min, Math.min(max, n));
  }

  /**
   * Computes comprehensive fractional metrics, decimal representations, and classifications
   */
  public static computeMetrics(numeratorRaw: number, denominatorRaw: number): FractionMetrics {
    const numerator = this.clamp(numeratorRaw);
    const denominator = this.clamp(denominatorRaw);

    const divisor = this.gcd(numerator, denominator);
    const simplifiedNumerator = numerator / divisor;
    const simplifiedDenominator = denominator / divisor;
    const isSimplified = divisor === 1;

    const decimal = numerator / denominator;
    const decimalFormatted = this.formatDecimal(decimal);

    const percentage = Number(((numerator / denominator) * 100).toFixed(1));
    const percentageFormatted = `${percentage}%`;

    let classification: FractionClassification;
    let classificationLabelEn: string;
    let classificationLabelHi: string;

    if (numerator === denominator) {
      classification = 'WHOLE';
      classificationLabelEn = 'Whole Unit (1)';
      classificationLabelHi = 'पूर्ण इकाई (1)';
    } else if (numerator === 1) {
      classification = 'UNIT';
      classificationLabelEn = 'Unit Fraction';
      classificationLabelHi = 'इकाई भिन्न';
    } else if (numerator < denominator) {
      classification = 'PROPER';
      classificationLabelEn = 'Proper Fraction (< 1)';
      classificationLabelHi = 'उचित भिन्न (< 1)';
    } else {
      classification = 'IMPROPER';
      classificationLabelEn = 'Improper Fraction (> 1)';
      classificationLabelHi = 'अनुचित भिन्न (> 1)';
    }

    const anglePerSliceRad = (2 * Math.PI) / denominator;
    const anglePerSliceDeg = 360 / denominator;

    const wholeUnits = Math.floor(numerator / denominator);
    const remainderNumerator = numerator % denominator;

    return {
      numerator,
      denominator,
      decimal,
      decimalFormatted,
      percentage,
      percentageFormatted,
      simplifiedNumerator,
      simplifiedDenominator,
      isSimplified,
      classification,
      classificationLabelEn,
      classificationLabelHi,
      anglePerSliceDeg,
      anglePerSliceRad,
      wholeUnits,
      remainderNumerator,
    };
  }

  /**
   * Formats decimal with sensible precision without floating-point artifacts
   */
  public static formatDecimal(num: number): string {
    if (!Number.isFinite(num)) return '0.00';
    // Check if integer
    if (Number.isInteger(num)) return num.toFixed(0);
    // Limit to 3 decimal places without trailing zeroes
    const fixed = num.toFixed(3);
    const stripped = parseFloat(fixed).toString();
    return stripped.includes('.') ? stripped : stripped + '.0';
  }

  /**
   * Bilingual terminology dictionary
   */
  public static getLabels(lang: LanguageMode = 'en') {
    if (lang === 'hi') {
      return {
        title: 'गतिशील भिन्न और दशमलव स्लाइस (F24)',
        fraction: 'भिन्न मान',
        numerator: 'अंश (Numerator)',
        denominator: 'हर (Denominator)',
        decimal: 'दशमलव (Decimal)',
        percentage: 'प्रतिशत (Percentage)',
        modePie: 'वृत्ताकार पाई',
        modeStrip: 'आयताकार पट्टी',
        simplified: 'सरलीकृत रूप',
        reset: 'पुनर्स्थापित (Reset)',
        theme: 'थीम',
        sound: 'ध्वनि',
        stepperDecrease: 'घटाएं',
        stepperIncrease: 'बढ़ाएं',
        equivalentHint: 'समतुल्य मान का निरीक्षण करें',
        sliceCount: 'कुल हिस्से',
        shadedCount: 'रंगीन हिस्से',
      };
    }
    return {
      title: 'Dynamic Fraction & Decimal Slices (F24)',
      fraction: 'Fraction Value',
      numerator: 'Numerator (N)',
      denominator: 'Denominator (D)',
      decimal: 'Decimal Value',
      percentage: 'Percentage',
      modePie: 'Circular Pie',
      modeStrip: 'Rectangular Strip',
      simplified: 'Simplified Form',
      reset: 'Reset',
      theme: 'Theme',
      sound: 'Audio',
      stepperDecrease: 'Decrease',
      stepperIncrease: 'Increase',
      equivalentHint: 'Observe synchronous decimal equivalency',
      sliceCount: 'Total Slices',
      shadedCount: 'Shaded Slices',
    };
  }
}

// ============================================================================
// 3. Procedural Audio Synthesizer (Zero External Dependencies)
// ============================================================================

export class FractionAudioSynthesizer {
  private ctx: any = null;

  constructor() {
    // Lazy AudioContext initialization on first user interaction
  }

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

  public playSliceChirp(numerator: number, denominator: number): void {
    if (!this.initCtx() || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      // Pitch dynamically scales with fraction value (range: 220Hz to 660Hz)
      const ratio = Math.max(0.1, Math.min(2.0, numerator / denominator));
      const baseFreq = 261.63; // Middle C
      const targetFreq = baseFreq * (0.8 + ratio * 0.8);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(targetFreq, now);
      osc.frequency.exponentialRampToValueAtTime(targetFreq * 1.15, now + 0.08);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.1);
    } catch {
      // Audio failure safe bypass
    }
  }

  public playModeSwitch(): void {
    if (!this.initCtx() || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.06);

      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.08);
    } catch {
      // Audio failure safe bypass
    }
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
// 5. High-Fidelity Custom Element: <aasha-sim-fraction-slice>
// ============================================================================

export class AashaSimFractionSlice extends HTMLElementBase {
  public static readonly TAG_NAME = 'aasha-sim-fraction-slice';
  public static readonly ALIAS_TAG_NAME = 'aasha-sim';

  private state: FractionSliceState;
  private animFrameId: number | null = null;
  private isPaused: boolean = false;
  private audioSynth: FractionAudioSynthesizer;
  private currentSweepLerp: number = 0;
  private targetSweepLerp: number = 0;
  private pulseEffect: number = 0;

  constructor(config?: FractionSliceConfig) {
    super();
    this.attachShadow({ mode: 'open' });
    this.audioSynth = new FractionAudioSynthesizer();

    const n = FractionSliceMathEvaluator.clamp(config?.initialNumerator ?? 3);
    const d = FractionSliceMathEvaluator.clamp(config?.initialDenominator ?? 4);

    this.state = {
      numerator: n,
      denominator: d,
      mode: config?.initialMode ?? 'pie',
      theme: config?.initialTheme ?? 'dark',
      lang: config?.initialLang ?? 'en',
      soundEnabled: config?.soundEnabled ?? false,
      lastInteractionTime: Date.now(),
    };

    this.currentSweepLerp = this.state.numerator / this.state.denominator;
    this.targetSweepLerp = this.currentSweepLerp;
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

  public getState(): Readonly<FractionSliceState> {
    return { ...this.state };
  }

  public getMetrics(): FractionMetrics {
    return FractionSliceMathEvaluator.computeMetrics(this.state.numerator, this.state.denominator);
  }

  public setState(partial: Partial<FractionSliceState>): void {
    const prevN = this.state.numerator;
    const prevD = this.state.denominator;
    const prevMode = this.state.mode;

    if (partial.numerator !== undefined) {
      this.state.numerator = FractionSliceMathEvaluator.clamp(partial.numerator);
    }
    if (partial.denominator !== undefined) {
      this.state.denominator = FractionSliceMathEvaluator.clamp(partial.denominator);
    }
    if (partial.mode !== undefined) {
      this.state.mode = partial.mode;
    }
    if (partial.theme !== undefined) {
      this.state.theme = partial.theme;
      this.applyTheme();
    }
    if (partial.lang !== undefined) {
      this.state.lang = partial.lang;
    }
    if (partial.soundEnabled !== undefined) {
      this.state.soundEnabled = partial.soundEnabled;
    }

    this.state.lastInteractionTime = Date.now();
    this.targetSweepLerp = this.state.numerator / this.state.denominator;
    this.pulseEffect = 1.0;

    if (this.state.soundEnabled && (prevN !== this.state.numerator || prevD !== this.state.denominator)) {
      this.audioSynth.playSliceChirp(this.state.numerator, this.state.denominator);
    } else if (this.state.soundEnabled && prevMode !== this.state.mode) {
      this.audioSynth.playModeSwitch();
    }

    this.syncControls();
    this.updateReadouts();
    this.emitStateChange();
  }

  public setNumerator(val: number): void {
    this.setState({ numerator: val });
  }

  public setDenominator(val: number): void {
    this.setState({ denominator: val });
  }

  public setMode(mode: SliceMode): void {
    this.setState({ mode });
  }

  public setLanguage(lang: LanguageMode): void {
    this.setState({ lang });
    this.render();
    this.bindEvents();
  }

  public setTheme(theme: ThemeMode): void {
    this.setState({ theme });
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

  public reset(): void {
    this.setState({
      numerator: 3,
      denominator: 4,
      mode: 'pie',
    });
    this.emitTelemetry('reset', { state: this.getState() });
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
        foundationId: 'F24',
        foundationName: "King's Math Dynamic Fraction & Decimal Slices",
        experienceId: 'fraction_slice_sim',
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

  // --- Rendering & Inlined Responsive Styles ---

  private render(): void {
    if (!this.shadowRoot) return;
    const labels = FractionSliceMathEvaluator.getLabels(this.state.lang);
    const metrics = this.getMetrics();

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          width: 100%;
          max-width: 600px;
          margin: 0 auto;
          box-sizing: border-box;
          font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          user-select: none;
          -webkit-user-select: none;

          /* Theme Tokens (Dark Mode Baseline) */
          --aasha-bg: #0F172A;
          --aasha-card: #1E293B;
          --aasha-border: #334155;
          --aasha-text-main: #F8FAFC;
          --aasha-text-muted: #94A3B8;
          --aasha-accent-sky: #38BDF8;
          --aasha-accent-amber: #F59E0B;
          --aasha-accent-emerald: #10B981;
          --aasha-accent-indigo: #6366F1;
          --aasha-button-hover: #2E3E58;
          --aasha-slice-shaded: #F59E0B;
          --aasha-slice-unshaded: #334155;
          --aasha-touch-min: 44px;
        }

        :host([data-theme="light"]), :host(.theme-light) {
          --aasha-bg: #F8FAFC;
          --aasha-card: #FFFFFF;
          --aasha-border: #CBD5E1;
          --aasha-text-main: #0F172A;
          --aasha-text-muted: #64748B;
          --aasha-accent-sky: #0284C7;
          --aasha-accent-amber: #D97706;
          --aasha-accent-emerald: #059669;
          --aasha-accent-indigo: #4F46E5;
          --aasha-button-hover: #E2E8F0;
          --aasha-slice-shaded: #D97706;
          --aasha-slice-unshaded: #E2E8F0;
        }

        .sim-wrapper {
          background: var(--aasha-bg);
          color: var(--aasha-text-main);
          border: 1px solid var(--aasha-border);
          border-radius: 16px;
          padding: 12px;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          gap: 12px;
          width: 100%;
        }

        /* Header bar */
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
          color: var(--aasha-accent-sky);
        }

        .pill-badge {
          background: var(--aasha-card);
          border: 1px solid var(--aasha-border);
          padding: 3px 8px;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--aasha-text-muted);
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        /* 44x44px Invariant Touch Targets */
        button, .touch-btn {
          min-width: var(--aasha-touch-min);
          min-height: var(--aasha-touch-min);
          padding: 8px 12px;
          border-radius: 10px;
          border: 1px solid var(--aasha-border);
          background: var(--aasha-card);
          color: var(--aasha-text-main);
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

        button.active-mode {
          background: var(--aasha-accent-indigo);
          color: #FFFFFF;
          border-color: var(--aasha-accent-indigo);
        }

        /* Viewport-Clamped Interactive Stage */
        .stage-box {
          position: relative;
          width: 100%;
          height: 220px;
          background: var(--aasha-card);
          border: 1px solid var(--aasha-border);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          box-sizing: border-box;
          cursor: pointer;
        }

        canvas {
          display: block;
          width: 100%;
          height: 100%;
          border-radius: 10px;
        }

        /* Readout Dashboard */
        .readout-card {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
          gap: 8px;
          background: var(--aasha-card);
          border: 1px solid var(--aasha-border);
          border-radius: 12px;
          padding: 10px;
          box-sizing: border-box;
        }

        .metric-cell {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 4px;
        }

        .metric-label {
          font-size: 0.72rem;
          color: var(--aasha-text-muted);
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .metric-val {
          font-size: 1.25rem;
          font-weight: 800;
          color: var(--aasha-accent-amber);
        }

        .metric-val.sky {
          color: var(--aasha-accent-sky);
        }

        .metric-val.emerald {
          color: var(--aasha-accent-emerald);
        }

        .fraction-display {
          display: inline-flex;
          flex-direction: column;
          align-items: center;
          line-height: 1;
          vertical-align: middle;
        }

        .fraction-num {
          border-bottom: 2px solid currentColor;
          padding: 0 4px 1px 4px;
        }

        .fraction-den {
          padding: 1px 4px 0 4px;
        }

        /* Controls Panel */
        .controls-panel {
          display: flex;
          flex-direction: column;
          gap: 10px;
          background: var(--aasha-card);
          border: 1px solid var(--aasha-border);
          border-radius: 12px;
          padding: 12px;
          box-sizing: border-box;
        }

        .control-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 8px;
        }

        .control-label-group {
          display: flex;
          align-items: center;
          gap: 8px;
          min-width: 140px;
        }

        .slider-stepper-group {
          display: flex;
          align-items: center;
          gap: 8px;
          flex: 1;
          min-width: 220px;
        }

        /* Accessible Sliders (min-height: 44px) */
        input[type="range"] {
          flex: 1;
          height: var(--aasha-touch-min);
          -webkit-appearance: none;
          appearance: none;
          background: transparent;
          cursor: pointer;
          touch-action: pan-x;
          margin: 0;
        }

        input[type="range"]::-webkit-slider-runnable-track {
          height: 10px;
          border-radius: 5px;
          background: var(--aasha-border);
        }

        input[type="range"]::-moz-range-track {
          height: 10px;
          border-radius: 5px;
          background: var(--aasha-border);
        }

        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          height: 28px;
          width: 28px;
          border-radius: 50%;
          background: var(--aasha-accent-sky);
          border: 3px solid #FFFFFF;
          margin-top: -9px;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          transition: transform 0.1s ease;
        }

        input[type="range"]::-moz-range-thumb {
          height: 28px;
          width: 28px;
          border-radius: 50%;
          background: var(--aasha-accent-sky);
          border: 3px solid #FFFFFF;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        }

        .stepper-btn {
          width: var(--aasha-touch-min);
          height: var(--aasha-touch-min);
          font-size: 1.1rem;
          font-weight: 800;
          padding: 0;
        }

        .value-badge {
          min-width: 32px;
          text-align: center;
          font-weight: 800;
          font-size: 1rem;
          color: var(--aasha-accent-sky);
        }

        /* Bottom Row Controls */
        .bottom-actions {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 8px;
        }

        .mode-toggle-group {
          display: flex;
          gap: 6px;
        }

        .status-chip {
          font-size: 0.75rem;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 20px;
          background: rgba(56, 189, 248, 0.15);
          color: var(--aasha-accent-sky);
          border: 1px solid rgba(56, 189, 248, 0.3);
        }

        @media (max-width: 480px) {
          .stage-box {
            height: 180px;
          }
          .slider-stepper-group {
            min-width: 100%;
          }
        }
      </style>

      <div class="sim-wrapper" id="simWrapper">
        <!-- Header -->
        <div class="header-bar">
          <div class="title-badge">
            <span>🍕</span>
            <span>${labels.title}</span>
            <span class="pill-badge" id="typeBadge">${this.state.lang === 'hi' ? metrics.classificationLabelHi : metrics.classificationLabelEn}</span>
          </div>
          <div class="header-actions">
            <button class="touch-btn" id="btnLang" title="Toggle Language (EN / HI)" aria-label="Toggle Language">
              ${this.state.lang === 'hi' ? 'EN' : 'हिं'}
            </button>
            <button class="touch-btn" id="btnAudio" title="Toggle Audio" aria-label="Toggle Audio">
              ${this.state.soundEnabled ? '🔊' : '🔇'}
            </button>
            <button class="touch-btn" id="btnReset" title="${labels.reset}" aria-label="Reset Simulation">
              ↺
            </button>
          </div>
        </div>

        <!-- 60 FPS Visual Canvas Stage -->
        <div class="stage-box" id="stageBox" title="Click or tap to slice">
          <canvas id="simCanvas" width="560" height="220" role="img" aria-label="Fraction visualization"></canvas>
        </div>

        <!-- Synchronous Readout Dashboard -->
        <div class="readout-card">
          <div class="metric-cell">
            <span class="metric-label">${labels.fraction}</span>
            <div class="metric-val sky">
              <span class="fraction-display">
                <span class="fraction-num" id="lblNum">${metrics.numerator}</span>
                <span class="fraction-den" id="lblDen">${metrics.denominator}</span>
              </span>
            </div>
          </div>

          <div class="metric-cell">
            <span class="metric-label">${labels.decimal}</span>
            <span class="metric-val" id="lblDecimal">${metrics.decimalFormatted}</span>
          </div>

          <div class="metric-cell">
            <span class="metric-label">${labels.percentage}</span>
            <span class="metric-val emerald" id="lblPercentage">${metrics.percentageFormatted}</span>
          </div>

          <div class="metric-cell">
            <span class="metric-label">${labels.simplified}</span>
            <span class="metric-val sky" id="lblSimplified" style="font-size: 1rem;">
              ${metrics.simplifiedNumerator}/${metrics.simplifiedDenominator}
            </span>
          </div>
        </div>

        <!-- Interactive Sliders & Steppers -->
        <div class="controls-panel">
          <!-- Numerator Row -->
          <div class="control-row">
            <div class="control-label-group">
              <span style="font-size: 1rem;">🟠</span>
              <strong style="font-size: 0.85rem;">${labels.numerator}</strong>
            </div>
            <div class="slider-stepper-group">
              <button class="stepper-btn touch-btn" id="btnNumSub" aria-label="${labels.stepperDecrease} Numerator">−</button>
              <input type="range" id="sliderNum" min="1" max="12" step="1" value="${this.state.numerator}" aria-label="Numerator range">
              <button class="stepper-btn touch-btn" id="btnNumAdd" aria-label="${labels.stepperIncrease} Numerator">+</button>
              <span class="value-badge" id="badgeNum">${this.state.numerator}</span>
            </div>
          </div>

          <!-- Denominator Row -->
          <div class="control-row">
            <div class="control-label-group">
              <span style="font-size: 1rem;">🔵</span>
              <strong style="font-size: 0.85rem;">${labels.denominator}</strong>
            </div>
            <div class="slider-stepper-group">
              <button class="stepper-btn touch-btn" id="btnDenSub" aria-label="${labels.stepperDecrease} Denominator">−</button>
              <input type="range" id="sliderDen" min="1" max="12" step="1" value="${this.state.denominator}" aria-label="Denominator range">
              <button class="stepper-btn touch-btn" id="btnDenAdd" aria-label="${labels.stepperIncrease} Denominator">+</button>
              <span class="value-badge" id="badgeDen">${this.state.denominator}</span>
            </div>
          </div>

          <!-- Bottom Mode & Feedback Row -->
          <div class="bottom-actions">
            <div class="mode-toggle-group">
              <button class="touch-btn ${this.state.mode === 'pie' ? 'active-mode' : ''}" id="btnModePie" aria-label="Circular Pie Mode">
                🥧 ${labels.modePie}
              </button>
              <button class="touch-btn ${this.state.mode === 'strip' ? 'active-mode' : ''}" id="btnModeStrip" aria-label="Rectangular Strip Mode">
                📏 ${labels.modeStrip}
              </button>
            </div>
            <div class="status-chip" id="lblHint">
              ${labels.equivalentHint}
            </div>
          </div>
        </div>
      </div>
    `;

    this.applyTheme();
  }

  private applyTheme(): void {
    if (!this.shadowRoot) return;
    const wrapper = this.shadowRoot.getElementById('simWrapper');
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

    // Sliders
    const sliderNum = this.shadowRoot.getElementById('sliderNum') as HTMLInputElement | null;
    const sliderDen = this.shadowRoot.getElementById('sliderDen') as HTMLInputElement | null;

    if (sliderNum) {
      sliderNum.addEventListener('input', (e) => {
        const val = parseInt((e.target as HTMLInputElement).value, 10);
        this.setState({ numerator: val });
      });
    }

    if (sliderDen) {
      sliderDen.addEventListener('input', (e) => {
        const val = parseInt((e.target as HTMLInputElement).value, 10);
        this.setState({ denominator: val });
      });
    }

    // Steppers
    const btnNumSub = this.shadowRoot.getElementById('btnNumSub');
    const btnNumAdd = this.shadowRoot.getElementById('btnNumAdd');
    const btnDenSub = this.shadowRoot.getElementById('btnDenSub');
    const btnDenAdd = this.shadowRoot.getElementById('btnDenAdd');

    btnNumSub?.addEventListener('click', () => {
      this.setState({ numerator: Math.max(1, this.state.numerator - 1) });
    });
    btnNumAdd?.addEventListener('click', () => {
      this.setState({ numerator: Math.min(12, this.state.numerator + 1) });
    });
    btnDenSub?.addEventListener('click', () => {
      this.setState({ denominator: Math.max(1, this.state.denominator - 1) });
    });
    btnDenAdd?.addEventListener('click', () => {
      this.setState({ denominator: Math.min(12, this.state.denominator + 1) });
    });

    // Mode Toggles
    const btnModePie = this.shadowRoot.getElementById('btnModePie');
    const btnModeStrip = this.shadowRoot.getElementById('btnModeStrip');

    btnModePie?.addEventListener('click', () => this.setState({ mode: 'pie' }));
    btnModeStrip?.addEventListener('click', () => this.setState({ mode: 'strip' }));

    // Actions
    const btnReset = this.shadowRoot.getElementById('btnReset');
    const btnLang = this.shadowRoot.getElementById('btnLang');
    const btnAudio = this.shadowRoot.getElementById('btnAudio');

    btnReset?.addEventListener('click', () => this.reset());
    btnLang?.addEventListener('click', () => {
      const nextLang: LanguageMode = this.state.lang === 'en' ? 'hi' : 'en';
      this.setLanguage(nextLang);
    });
    btnAudio?.addEventListener('click', () => {
      this.setState({ soundEnabled: !this.state.soundEnabled });
      if (btnAudio) btnAudio.textContent = this.state.soundEnabled ? '🔊' : '🔇';
    });

    // Direct Canvas Tap/Click Interaction
    const canvas = this.shadowRoot.getElementById('simCanvas') as HTMLCanvasElement | null;
    if (canvas) {
      canvas.addEventListener('click', (e) => this.handleCanvasClick(e, canvas));
    }
  }

  private handleCanvasClick(e: MouseEvent, canvas: HTMLCanvasElement): void {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (this.state.mode === 'pie') {
      const cx = rect.width / 2;
      const cy = rect.height / 2;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const radius = Math.min(cx, cy) - 16;

      if (dist <= radius) {
        // Compute angle from top (-PI/2) clockwise
        let angle = Math.atan2(dy, dx) + Math.PI / 2;
        if (angle < 0) angle += 2 * Math.PI;

        const sliceAngle = (2 * Math.PI) / this.state.denominator;
        const selectedSlice = Math.floor(angle / sliceAngle) + 1;
        const targetNum = Math.min(12, Math.max(1, selectedSlice));
        this.setState({ numerator: targetNum });
      }
    } else {
      // Strip mode: calculate horizontal block index
      const margin = 24;
      const stripWidth = rect.width - margin * 2;
      if (x >= margin && x <= rect.width - margin) {
        const blockWidth = stripWidth / this.state.denominator;
        const clickedBlock = Math.floor((x - margin) / blockWidth) + 1;
        const targetNum = Math.min(12, Math.max(1, clickedBlock));
        this.setState({ numerator: targetNum });
      }
    }
  }

  private syncControls(): void {
    if (!this.shadowRoot) return;
    const sliderNum = this.shadowRoot.getElementById('sliderNum') as HTMLInputElement | null;
    const sliderDen = this.shadowRoot.getElementById('sliderDen') as HTMLInputElement | null;
    const badgeNum = this.shadowRoot.getElementById('badgeNum');
    const badgeDen = this.shadowRoot.getElementById('badgeDen');

    if (sliderNum) sliderNum.value = this.state.numerator.toString();
    if (sliderDen) sliderDen.value = this.state.denominator.toString();
    if (badgeNum) badgeNum.textContent = this.state.numerator.toString();
    if (badgeDen) badgeDen.textContent = this.state.denominator.toString();

    const btnModePie = this.shadowRoot.getElementById('btnModePie');
    const btnModeStrip = this.shadowRoot.getElementById('btnModeStrip');
    if (btnModePie) {
      if (this.state.mode === 'pie') btnModePie.classList.add('active-mode');
      else btnModePie.classList.remove('active-mode');
    }
    if (btnModeStrip) {
      if (this.state.mode === 'strip') btnModeStrip.classList.add('active-mode');
      else btnModeStrip.classList.remove('active-mode');
    }
  }

  private updateReadouts(): void {
    if (!this.shadowRoot) return;
    const metrics = this.getMetrics();

    const lblNum = this.shadowRoot.getElementById('lblNum');
    const lblDen = this.shadowRoot.getElementById('lblDen');
    const lblDecimal = this.shadowRoot.getElementById('lblDecimal');
    const lblPercentage = this.shadowRoot.getElementById('lblPercentage');
    const lblSimplified = this.shadowRoot.getElementById('lblSimplified');
    const typeBadge = this.shadowRoot.getElementById('typeBadge');

    if (lblNum) lblNum.textContent = metrics.numerator.toString();
    if (lblDen) lblDen.textContent = metrics.denominator.toString();
    if (lblDecimal) lblDecimal.textContent = metrics.decimalFormatted;
    if (lblPercentage) lblPercentage.textContent = metrics.percentageFormatted;
    if (lblSimplified) {
      lblSimplified.textContent = `${metrics.simplifiedNumerator}/${metrics.simplifiedDenominator}`;
    }
    if (typeBadge) {
      typeBadge.textContent = this.state.lang === 'hi' ? metrics.classificationLabelHi : metrics.classificationLabelEn;
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
    // Smooth 60 FPS lerp transition for slice fill sweeps
    const lerpSpeed = 0.22;
    this.currentSweepLerp += (this.targetSweepLerp - this.currentSweepLerp) * lerpSpeed;
    if (this.pulseEffect > 0.01) {
      this.pulseEffect *= 0.90;
    } else {
      this.pulseEffect = 0;
    }
  }

  private drawCanvas(): void {
    if (!this.shadowRoot) return;
    const canvas = this.shadowRoot.getElementById('simCanvas') as HTMLCanvasElement | null;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Retina / High-DPI scaling
    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    const rect = canvas.getBoundingClientRect();
    const width = rect.width || 560;
    const height = rect.height || 220;

    if (canvas.width !== Math.round(width * dpr) || canvas.height !== Math.round(height * dpr)) {
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
    }

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    const isLight = this.state.theme === 'light';
    const num = this.state.numerator;
    const den = this.state.denominator;

    if (this.state.mode === 'pie') {
      this.drawCircularPie(ctx, width, height, num, den, isLight);
    } else {
      this.drawRectangularStrip(ctx, width, height, num, den, isLight);
    }

    ctx.restore();
  }

  /**
   * Renders Circular Pie Mode (60 FPS smooth arcs & divider geometry)
   */
  private drawCircularPie(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    numerator: number,
    denominator: number,
    isLight: boolean
  ): void {
    const cx = width / 2;
    const cy = height / 2;
    const radius = Math.min(cx, cy) - 18;
    const sliceAngle = (2 * Math.PI) / denominator;

    // Base background shadow
    ctx.save();
    ctx.shadowColor = isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(0, 0, 0, 0.4)';
    ctx.shadowBlur = 12;
    ctx.shadowOffsetY = 4;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fillStyle = isLight ? '#FFFFFF' : '#1E293B';
    ctx.fill();
    ctx.restore();

    // Slices rendering
    for (let i = 0; i < denominator; i++) {
      const startAngle = i * sliceAngle - Math.PI / 2;
      const endAngle = startAngle + sliceAngle;
      const isShaded = i < numerator;

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, radius, startAngle, endAngle);
      ctx.closePath();

      if (isShaded) {
        // Gradient for shaded slices
        const grad = ctx.createRadialGradient(cx, cy, 10, cx, cy, radius);
        if (isLight) {
          grad.addColorStop(0, '#FBBF24');
          grad.addColorStop(1, '#D97706');
        } else {
          grad.addColorStop(0, '#F59E0B');
          grad.addColorStop(1, '#B45309');
        }
        ctx.fillStyle = grad;
      } else {
        ctx.fillStyle = isLight ? '#F1F5F9' : '#334155';
      }
      ctx.fill();

      // Slice dividing stroke
      ctx.lineWidth = 2.0;
      ctx.strokeStyle = isLight ? '#CBD5E1' : '#0F172A';
      ctx.stroke();

      // Slice number or unit label
      const midAngle = startAngle + sliceAngle / 2;
      const labelDist = radius * 0.65;
      const lx = cx + Math.cos(midAngle) * labelDist;
      const ly = cy + Math.sin(midAngle) * labelDist;

      if (denominator <= 10) {
        ctx.fillStyle = isShaded ? '#FFFFFF' : (isLight ? '#64748B' : '#94A3B8');
        ctx.font = 'bold 11px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`1/${denominator}`, lx, ly);
      }
    }

    // Outer ring accent
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.lineWidth = 3.0;
    ctx.strokeStyle = isLight ? '#94A3B8' : '#38BDF8';
    ctx.stroke();

    // Improper fraction overflow indicator ring
    if (numerator > denominator) {
      ctx.beginPath();
      ctx.arc(cx, cy, radius + 8, 0, Math.PI * 2 * (numerator / denominator - 1));
      ctx.lineWidth = 4.0;
      ctx.strokeStyle = '#10B981';
      ctx.stroke();
    }

    // Center pivot hub
    ctx.beginPath();
    ctx.arc(cx, cy, 18, 0, Math.PI * 2);
    ctx.fillStyle = isLight ? '#FFFFFF' : '#0F172A';
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = isLight ? '#D97706' : '#F59E0B';
    ctx.stroke();

    ctx.fillStyle = isLight ? '#0F172A' : '#F8FAFC';
    ctx.font = 'bold 10px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${numerator}/${denominator}`, cx, cy);
  }

  /**
   * Renders Rectangular Strip Mode (60 FPS horizontal tape fractions)
   */
  private drawRectangularStrip(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    numerator: number,
    denominator: number,
    isLight: boolean
  ): void {
    const margin = 28;
    const stripWidth = width - margin * 2;
    const stripHeight = Math.min(70, height - 80);
    const stripY = (height - stripHeight) / 2;
    const blockWidth = stripWidth / denominator;

    // Background track shadow
    ctx.save();
    ctx.shadowColor = isLight ? 'rgba(0,0,0,0.06)' : 'rgba(0,0,0,0.3)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 3;
    ctx.beginPath();
    ctx.roundRect(margin, stripY, stripWidth, stripHeight, 10);
    ctx.fillStyle = isLight ? '#FFFFFF' : '#1E293B';
    ctx.fill();
    ctx.restore();

    // Render individual cells
    for (let i = 0; i < denominator; i++) {
      const bx = margin + i * blockWidth;
      const isShaded = i < numerator;

      ctx.beginPath();
      // Apply rounded corners to end caps
      if (i === 0 && denominator === 1) {
        ctx.roundRect(bx, stripY, blockWidth, stripHeight, 10);
      } else if (i === 0) {
        ctx.roundRect(bx, stripY, blockWidth, stripHeight, [10, 0, 0, 10]);
      } else if (i === denominator - 1) {
        ctx.roundRect(bx, stripY, blockWidth, stripHeight, [0, 10, 10, 0]);
      } else {
        ctx.rect(bx, stripY, blockWidth, stripHeight);
      }

      if (isShaded) {
        const grad = ctx.createLinearGradient(bx, stripY, bx, stripY + stripHeight);
        if (isLight) {
          grad.addColorStop(0, '#38BDF8');
          grad.addColorStop(1, '#0284C7');
        } else {
          grad.addColorStop(0, '#38BDF8');
          grad.addColorStop(1, '#0369A1');
        }
        ctx.fillStyle = grad;
      } else {
        ctx.fillStyle = isLight ? '#F1F5F9' : '#334155';
      }
      ctx.fill();

      // Block boundary
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = isLight ? '#CBD5E1' : '#0F172A';
      ctx.stroke();

      // Cell unit fraction label
      ctx.fillStyle = isShaded ? '#FFFFFF' : (isLight ? '#64748B' : '#94A3B8');
      ctx.font = 'bold 12px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`1/${denominator}`, bx + blockWidth / 2, stripY + stripHeight / 2);
    }

    // Outer bounding border
    ctx.beginPath();
    ctx.roundRect(margin, stripY, stripWidth, stripHeight, 10);
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = isLight ? '#94A3B8' : '#38BDF8';
    ctx.stroke();

    // Number line tick marks along bottom
    const tickY = stripY + stripHeight + 14;
    ctx.strokeStyle = isLight ? '#94A3B8' : '#64748B';
    ctx.lineWidth = 1.5;

    // Line from 0 to 1
    ctx.beginPath();
    ctx.moveTo(margin, tickY);
    ctx.lineTo(margin + stripWidth, tickY);
    ctx.stroke();

    for (let i = 0; i <= denominator; i++) {
      const tx = margin + i * blockWidth;
      ctx.beginPath();
      ctx.moveTo(tx, tickY - 4);
      ctx.lineTo(tx, tickY + 4);
      ctx.stroke();

      if (i === 0 || i === denominator || denominator <= 6) {
        ctx.fillStyle = isLight ? '#475569' : '#94A3B8';
        ctx.font = '10px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        const label = i === 0 ? '0' : i === denominator ? '1' : `${i}/${denominator}`;
        ctx.fillText(label, tx, tickY + 6);
      }
    }
  }
}

// ============================================================================
// 6. Custom Element Registration
// ============================================================================

if (typeof customElements !== 'undefined') {
  if (!customElements.get(AashaSimFractionSlice.TAG_NAME)) {
    customElements.define(AashaSimFractionSlice.TAG_NAME, AashaSimFractionSlice);
  }
  // Register generic <aasha-sim> fallback alias if unbound
  if (!customElements.get(AashaSimFractionSlice.ALIAS_TAG_NAME)) {
    customElements.define(AashaSimFractionSlice.ALIAS_TAG_NAME, AashaSimFractionSlice);
  }
}

// ============================================================================
// 7. Standalone Inlined Simulation Script Generator (Zero-Cost Embedding)
// ============================================================================

export function generateFractionSliceSimScript(config?: FractionSliceConfig): string {
  const defaultN = config?.initialNumerator ?? 3;
  const defaultD = config?.initialDenominator ?? 4;
  const defaultMode = config?.initialMode ?? 'pie';

  return `
(function() {
  if (customElements.get('aasha-sim-fraction-slice')) return;

  const clamp = (val, min = 1, max = 12) => Math.max(min, Math.min(max, Math.round(Number(val) || min)));
  const gcd = (a, b) => { let x = Math.abs(a), y = Math.abs(b); while (y) { let t = y; y = x % y; x = t; } return x || 1; };

  class AashaSimFractionSliceElement extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this.state = {
        numerator: ${defaultN},
        denominator: ${defaultD},
        mode: '${defaultMode}',
        theme: 'dark',
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

    reset() { this.setState({ numerator: 3, denominator: 4, mode: 'pie' }); }
    pause() { if (this._animId) { cancelAnimationFrame(this._animId); this._animId = null; } }
    resume() { if (!this._animId) this.startLoop(); }
    destroy() { this.pause(); }

    emitTelemetry(eventType, payload) {
      this.dispatchEvent(new CustomEvent('aasha:telemetry', {
        bubbles: true, composed: true,
        detail: { foundationId: 'F24', experienceId: 'fraction_slice_sim', eventType, payload, timestamp: Date.now() }
      }));
    }

    render() {
      this.shadowRoot.innerHTML = \`
        <style>
          :host { display: block; width: 100%; max-width: 600px; margin: 0 auto; font-family: system-ui, sans-serif; box-sizing: border-box; }
          .sim-box { background: #0F172A; color: #F8FAFC; border: 1px solid #334155; border-radius: 14px; padding: 12px; display: flex; flex-direction: column; gap: 10px; }
          .header { display: flex; justify-content: space-between; align-items: center; }
          .title { font-weight: 700; color: #38BDF8; font-size: 0.95rem; }
          .stage { width: 100%; height: 200px; background: #1E293B; border-radius: 10px; border: 1px solid #334155; display: flex; align-items: center; justify-content: center; }
          canvas { width: 100%; height: 100%; }
          .dashboard { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; background: #1E293B; padding: 8px; border-radius: 8px; text-align: center; }
          .d-label { font-size: 0.7rem; color: #94A3B8; }
          .d-val { font-size: 1.15rem; font-weight: 800; color: #F59E0B; }
          .controls { display: flex; flex-direction: column; gap: 8px; }
          .row { display: flex; align-items: center; gap: 8px; }
          button, .btn { min-width: 44px; min-height: 44px; padding: 6px 12px; background: #334155; color: #FFF; border: none; border-radius: 8px; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; touch-action: manipulation; }
          button.active { background: #6366F1; }
          input[type="range"] { flex: 1; height: 44px; touch-action: pan-x; }
        </style>
        <div class="sim-box">
          <div class="header">
            <span class="title">🍕 Dynamic Fraction & Decimal Slices (F24)</span>
            <button id="btnReset" title="Reset">↺</button>
          </div>
          <div class="stage"><canvas id="cv" width="560" height="200"></canvas></div>
          <div class="dashboard">
            <div><div class="d-label">FRACTION</div><div class="d-val" id="dispFrac">3/4</div></div>
            <div><div class="d-label">DECIMAL</div><div class="d-val" id="dispDec" style="color:#38BDF8;">0.75</div></div>
            <div><div class="d-label">PERCENTAGE</div><div class="d-val" id="dispPct" style="color:#10B981;">75%</div></div>
          </div>
          <div class="controls">
            <div class="row">
              <span style="min-width: 90px; font-size: 0.8rem; font-weight: 700;">Numerator: <span id="vNum">3</span></span>
              <button id="bNumSub">−</button>
              <input type="range" id="slNum" min="1" max="12" value="3">
              <button id="bNumAdd">+</button>
            </div>
            <div class="row">
              <span style="min-width: 90px; font-size: 0.8rem; font-weight: 700;">Denominator: <span id="vDen">4</span></span>
              <button id="bDenSub">−</button>
              <input type="range" id="slDen" min="1" max="12" value="4">
              <button id="bDenAdd">+</button>
            </div>
            <div class="row" style="justify-content: flex-start; gap: 8px;">
              <button id="bPie" class="active">🥧 Pie</button>
              <button id="bStrip">📏 Strip</button>
            </div>
          </div>
        </div>
      \`;
    }

    bindEvents() {
      const q = (id) => this.shadowRoot.getElementById(id);
      q('slNum').addEventListener('input', (e) => this.setState({ numerator: clamp(e.target.value) }));
      q('slDen').addEventListener('input', (e) => this.setState({ denominator: clamp(e.target.value) }));
      q('bNumSub').addEventListener('click', () => this.setState({ numerator: clamp(this.state.numerator - 1) }));
      q('bNumAdd').addEventListener('click', () => this.setState({ numerator: clamp(this.state.numerator + 1) }));
      q('bDenSub').addEventListener('click', () => this.setState({ denominator: clamp(this.state.denominator - 1) }));
      q('bDenAdd').addEventListener('click', () => this.setState({ denominator: clamp(this.state.denominator + 1) }));
      q('bPie').addEventListener('click', () => this.setState({ mode: 'pie' }));
      q('bStrip').addEventListener('click', () => this.setState({ mode: 'strip' }));
      q('btnReset').addEventListener('click', () => this.reset());
    }

    syncUI() {
      const q = (id) => this.shadowRoot.getElementById(id);
      if (!q('slNum')) return;
      q('slNum').value = this.state.numerator;
      q('slDen').value = this.state.denominator;
      q('vNum').textContent = this.state.numerator;
      q('vDen').textContent = this.state.denominator;
      q('dispFrac').textContent = this.state.numerator + '/' + this.state.denominator;
      const dec = (this.state.numerator / this.state.denominator).toFixed(3);
      q('dispDec').textContent = parseFloat(dec).toString();
      q('dispPct').textContent = ((this.state.numerator / this.state.denominator) * 100).toFixed(1) + '%';
      if (this.state.mode === 'pie') {
        q('bPie').classList.add('active');
        q('bStrip').classList.remove('active');
      } else {
        q('bStrip').classList.add('active');
        q('bPie').classList.remove('active');
      }
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
      const n = this.state.numerator;
      const d = this.state.denominator;

      if (this.state.mode === 'pie') {
        const cx = w / 2, cy = h / 2, r = Math.min(cx, cy) - 15;
        const angle = (2 * Math.PI) / d;
        for (let i = 0; i < d; i++) {
          const start = i * angle - Math.PI / 2;
          const end = start + angle;
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.arc(cx, cy, r, start, end);
          ctx.closePath();
          ctx.fillStyle = i < n ? '#F59E0B' : '#334155';
          ctx.fill();
          ctx.strokeStyle = '#0F172A';
          ctx.lineWidth = 2;
          ctx.stroke();
        }
        ctx.beginPath();
        ctx.arc(cx, cy, 14, 0, Math.PI * 2);
        ctx.fillStyle = '#0F172A';
        ctx.fill();
      } else {
        const m = 24, sw = w - m * 2, sh = 60, sy = (h - sh) / 2;
        const bw = sw / d;
        for (let i = 0; i < d; i++) {
          const bx = m + i * bw;
          ctx.beginPath();
          ctx.rect(bx, sy, bw, sh);
          ctx.fillStyle = i < n ? '#38BDF8' : '#334155';
          ctx.fill();
          ctx.strokeStyle = '#0F172A';
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      }
    }
  }

  customElements.define('aasha-sim-fraction-slice', AashaSimFractionSliceElement);
  if (!customElements.get('aasha-sim')) {
    customElements.define('aasha-sim', AashaSimFractionSliceElement);
  }
})();
  `.trim();
}
