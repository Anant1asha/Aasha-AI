/**
 * AASHA AIOS — Foundation F25: Number-Line Hunter (Tactile Negative & Positive Integers)
 * Path: Aasha-AI/packages/adapters/number_line_hunter_sim.ts
 *
 * Implements King's Math Number-Line Hunter (Foundation F25)
 * as a high-fidelity, self-contained Web Component (<aasha-sim-number-line> / <aasha-sim>).
 *
 * Invariants:
 * - 100% Offline-first: zero external CDN scripts, zero external web fonts.
 * - Same-frame mobile ergonomics: touch targets >= 44x44px, responsive viewport clamping.
 * - 60 FPS HTML5 Canvas rendering with smooth marker interpolation and parabolic jump arcs.
 * - Interactive controls: horizontal number line (-10 to +10), jump selectors (+1, -1, +2, -2, +5, -5),
 *   dynamic equation readout, opposite numbers visualizer (mirroring around 0).
 * - Bilingual support: English and Hindi terminology.
 * - Isomorphic: safely importable in Node.js runtime and browser contexts.
 */

// ============================================================================
// 1. Types & State Contracts
// ============================================================================

export type ThemeMode = 'dark' | 'light' | 'auto';
export type LanguageMode = 'en' | 'hi';

export interface NumberLineJump {
  from: number;
  to: number;
  delta: number;
  timestamp: number;
}

export interface NumberLineState {
  currentPos: number;         // -10 to +10
  lastPos: number;            // Position before last jump
  lastDelta: number;          // Last jump delta (+1, -2, etc.)
  minBound: number;           // Default: -10
  maxBound: number;           // Default: +10
  showOppositeMirror: boolean;// Highlights x and -x mirrored around 0
  showVectorArc: boolean;     // Draws directional parabolic arrow
  theme: ThemeMode;
  lang: LanguageMode;
  soundEnabled: boolean;
  jumpHistory: NumberLineJump[];
}

export interface NumberLineMetrics {
  currentPos: number;
  oppositePos: number;
  absoluteValue: number;
  isOrigin: boolean;
  isPositive: boolean;
  isNegative: boolean;
  equationString: string;
  equationStringHi: string;
  distanceFromZero: number;
}

export interface NumberLineConfig {
  initialPos?: number;
  minBound?: number;
  maxBound?: number;
  showOppositeMirror?: boolean;
  theme?: ThemeMode;
  lang?: LanguageMode;
  soundEnabled?: boolean;
}

// ============================================================================
// 2. Deterministic Mathematical Evaluator (Pure Engine)
// ============================================================================

export class NumberLineMathEvaluator {
  public static readonly DEFAULT_MIN = -10;
  public static readonly DEFAULT_MAX = 10;

  /**
   * Clamps integer value to safe bounds [-10, 10]
   */
  public static clamp(val: number, min: number = this.DEFAULT_MIN, max: number = this.DEFAULT_MAX): number {
    const n = Math.round(Number.isFinite(val) ? val : 0);
    return Math.max(min, Math.min(max, n));
  }

  /**
   * Computes integer jump: returns { newPos, delta, clampedDelta }
   */
  public static executeJump(
    fromPos: number,
    delta: number,
    min: number = this.DEFAULT_MIN,
    max: number = this.DEFAULT_MAX
  ): { toPos: number; actualDelta: number; isClamped: boolean } {
    const rawTarget = fromPos + delta;
    const toPos = this.clamp(rawTarget, min, max);
    return {
      toPos,
      actualDelta: toPos - fromPos,
      isClamped: toPos !== rawTarget,
    };
  }

  /**
   * Computes comprehensive number line metrics & dynamic equations
   */
  public static computeMetrics(currentPosRaw: number, lastDelta: number = 0, lastPos?: number): NumberLineMetrics {
    const currentPos = this.clamp(currentPosRaw);
    const oppositePos = currentPos === 0 ? 0 : -currentPos;
    const absoluteValue = Math.abs(currentPos);
    const isOrigin = currentPos === 0;
    const isPositive = currentPos > 0;
    const isNegative = currentPos < 0;

    const fromPos = lastPos !== undefined ? this.clamp(lastPos) : currentPos - lastDelta;

    // Build standard integer equation string: e.g. "(-3) + (+5) = +2" or "(+4) + (-6) = -2"
    const formatSigned = (n: number) => {
      if (n === 0) return '0';
      return n > 0 ? `(+${n})` : `(${n})`;
    };

    let equationString: string;
    let equationStringHi: string;

    if (lastDelta !== 0) {
      const opSign = lastDelta >= 0 ? '+' : '−';
      const absDelta = Math.abs(lastDelta);
      equationString = `${formatSigned(fromPos)} + ${formatSigned(lastDelta)} = ${formatSigned(currentPos)}`;
      equationStringHi = `${formatSigned(fromPos)} + ${formatSigned(lastDelta)} = ${formatSigned(currentPos)}`;
    } else {
      equationString = `Position: ${formatSigned(currentPos)} | Distance from 0: ${absoluteValue}`;
      equationStringHi = `स्थिति: ${formatSigned(currentPos)} | शून्य से दूरी: ${absoluteValue}`;
    }

    return {
      currentPos,
      oppositePos,
      absoluteValue,
      isOrigin,
      isPositive,
      isNegative,
      equationString,
      equationStringHi,
      distanceFromZero: absoluteValue,
    };
  }

  /**
   * Bilingual terminology dictionary
   */
  public static getLabels(lang: LanguageMode = 'en') {
    if (lang === 'hi') {
      return {
        title: 'संख्या रेखा हंटर — पूर्णांक अन्वेषक (F25)',
        currentPos: 'वर्तमान स्थिति',
        origin: 'शून्य (मूल बिंदु)',
        positive: 'धनात्मक पूर्णांक (+)',
        negative: 'ऋणात्मक पूर्णांक (−)',
        opposite: 'विपरीत संख्या (Mirror)',
        distance: 'शून्य से दूरी |x|',
        equation: 'सक्रिय समीकरण',
        jump: 'छलांग लगाएं',
        reset: 'पुनर्स्थापित (Reset)',
        toggleMirror: 'प्रतिबिम्ब दर्पण',
        stepLeft: 'बाईं ओर (−)',
        stepRight: 'दाईं ओर (+)',
        jumpInstruction: 'छलांग बटन दबाएं या संख्या रेखा पर टैप करें',
      };
    }
    return {
      title: 'Number-Line Hunter — Integer Explorer (F25)',
      currentPos: 'Current Position',
      origin: 'Zero (Origin)',
      positive: 'Positive Integer (+)',
      negative: 'Negative Integer (−)',
      opposite: 'Opposite Number (Mirror)',
      distance: 'Distance from Zero |x|',
      equation: 'Active Equation',
      jump: 'Take Jump',
      reset: 'Reset',
      toggleMirror: 'Opposite Mirror',
      stepLeft: 'Step Left (−)',
      stepRight: 'Step Right (+)',
      jumpInstruction: 'Click jump buttons or tap directly on the number line',
    };
  }
}

// ============================================================================
// 3. Procedural Audio Synthesizer (Zero External Dependencies)
// ============================================================================

export class NumberLineAudioSynthesizer {
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

  public playJumpChime(pos: number): void {
    if (!this.initCtx() || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      // Pitch mapped monotonically to position (-10 -> 160Hz, 0 -> 330Hz, +10 -> 660Hz)
      const normalized = (pos + 10) / 20; // 0.0 to 1.0
      const freq = 160 + normalized * 500;

      osc.type = pos === 0 ? 'sine' : pos > 0 ? 'triangle' : 'sawtooth';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.1, now + 0.07);

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

  public playMirrorChime(): void {
    if (!this.initCtx() || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'sine';
      osc1.frequency.setValueAtTime(440, now);
      osc2.frequency.setValueAtTime(880, now);

      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.14);
      osc2.stop(now + 0.14);
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
// 5. High-Fidelity Custom Element: <aasha-sim-number-line>
// ============================================================================

export class AashaSimNumberLine extends HTMLElementBase {
  public static readonly TAG_NAME = 'aasha-sim-number-line';
  public static readonly ALIAS_TAG_NAME = 'aasha-sim';

  private state: NumberLineState;
  private animFrameId: number | null = null;
  private isPaused: boolean = false;
  private audioSynth: NumberLineAudioSynthesizer;
  private currentMarkerLerp: number = 0;
  private targetMarkerLerp: number = 0;
  private arcProgress: number = 1.0;

  constructor(config?: NumberLineConfig) {
    super();
    this.attachShadow({ mode: 'open' });
    this.audioSynth = new NumberLineAudioSynthesizer();

    const min = config?.minBound ?? NumberLineMathEvaluator.DEFAULT_MIN;
    const max = config?.maxBound ?? NumberLineMathEvaluator.DEFAULT_MAX;
    const start = NumberLineMathEvaluator.clamp(config?.initialPos ?? 0, min, max);

    this.state = {
      currentPos: start,
      lastPos: start,
      lastDelta: 0,
      minBound: min,
      maxBound: max,
      showOppositeMirror: config?.showOppositeMirror ?? false,
      showVectorArc: true,
      theme: config?.theme ?? 'dark',
      lang: config?.lang ?? 'en',
      soundEnabled: config?.soundEnabled ?? false,
      jumpHistory: [],
    };

    this.currentMarkerLerp = start;
    this.targetMarkerLerp = start;
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

  public getState(): Readonly<NumberLineState> {
    return { ...this.state };
  }

  public getMetrics(): NumberLineMetrics {
    return NumberLineMathEvaluator.computeMetrics(
      this.state.currentPos,
      this.state.lastDelta,
      this.state.lastPos
    );
  }

  public setState(partial: Partial<NumberLineState>): void {
    const prevPos = this.state.currentPos;

    if (partial.currentPos !== undefined) {
      const nextPos = NumberLineMathEvaluator.clamp(partial.currentPos, this.state.minBound, this.state.maxBound);
      this.state.lastPos = prevPos;
      this.state.lastDelta = nextPos - prevPos;
      this.state.currentPos = nextPos;
      this.targetMarkerLerp = nextPos;
      this.arcProgress = 0.0; // Reset arc jump animation

      if (this.state.lastDelta !== 0) {
        this.state.jumpHistory.push({
          from: prevPos,
          to: nextPos,
          delta: this.state.lastDelta,
          timestamp: Date.now(),
        });
      }
    }

    if (partial.showOppositeMirror !== undefined) {
      this.state.showOppositeMirror = partial.showOppositeMirror;
      if (this.state.soundEnabled && this.state.showOppositeMirror) {
        this.audioSynth.playMirrorChime();
      }
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

    if (this.state.soundEnabled && prevPos !== this.state.currentPos) {
      this.audioSynth.playJumpChime(this.state.currentPos);
    }

    this.updateReadouts();
    this.emitStateChange();
  }

  public jump(delta: number): void {
    const res = NumberLineMathEvaluator.executeJump(
      this.state.currentPos,
      delta,
      this.state.minBound,
      this.state.maxBound
    );
    this.setState({ currentPos: res.toPos });
  }

  public setPosition(pos: number): void {
    this.setState({ currentPos: pos });
  }

  public toggleMirror(): void {
    this.setState({ showOppositeMirror: !this.state.showOppositeMirror });
    this.updateControls();
  }

  public setLanguage(lang: LanguageMode): void {
    this.setState({ lang });
    this.render();
    this.bindEvents();
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
      currentPos: 0,
      lastPos: 0,
      lastDelta: 0,
      showOppositeMirror: false,
    });
    this.state.jumpHistory = [];
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
        foundationId: 'F25',
        foundationName: "King's Math Number-Line Hunter & Factor Finder",
        experienceId: 'number_line_hunter_sim',
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
    const labels = NumberLineMathEvaluator.getLabels(this.state.lang);
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
          --nl-bg: #0F172A;
          --nl-card: #1E293B;
          --nl-border: #334155;
          --nl-text: #F8FAFC;
          --nl-text-muted: #94A3B8;
          --nl-positive: #38BDF8;
          --nl-negative: #F43F5E;
          --nl-origin: #F59E0B;
          --nl-mirror: #A855F7;
          --nl-touch-min: 44px;
        }

        :host([data-theme="light"]), :host(.theme-light) {
          --nl-bg: #F8FAFC;
          --nl-card: #FFFFFF;
          --nl-border: #CBD5E1;
          --nl-text: #0F172A;
          --nl-text-muted: #64748B;
          --nl-positive: #0284C7;
          --nl-negative: #E11D48;
          --nl-origin: #D97706;
          --nl-mirror: #7C3AED;
        }

        .nl-wrapper {
          background: var(--nl-bg);
          color: var(--nl-text);
          border: 1px solid var(--nl-border);
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
          color: var(--nl-positive);
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        /* Touch Targets Invariant (>= 44x44px) */
        button, .touch-btn {
          min-width: var(--nl-touch-min);
          min-height: var(--nl-touch-min);
          padding: 8px 12px;
          border-radius: 10px;
          border: 1px solid var(--nl-border);
          background: var(--nl-card);
          color: var(--nl-text);
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

        button.active-toggle {
          background: var(--nl-mirror);
          color: #FFFFFF;
          border-color: var(--nl-mirror);
        }

        /* Canvas Stage */
        .stage-box {
          position: relative;
          width: 100%;
          height: 190px;
          background: var(--nl-card);
          border: 1px solid var(--nl-border);
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
        }

        /* Readout Dashboard */
        .readout-card {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
          gap: 8px;
          background: var(--nl-card);
          border: 1px solid var(--nl-border);
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
          color: var(--nl-text-muted);
          font-weight: 600;
          text-transform: uppercase;
        }

        .metric-val {
          font-size: 1.25rem;
          font-weight: 800;
          color: var(--nl-positive);
        }

        .metric-val.neg {
          color: var(--nl-negative);
        }

        .metric-val.zero {
          color: var(--nl-origin);
        }

        .metric-val.mirror {
          color: var(--nl-mirror);
        }

        /* Equation Banner */
        .equation-banner {
          background: rgba(56, 189, 248, 0.1);
          border: 1px solid rgba(56, 189, 248, 0.3);
          border-radius: 10px;
          padding: 8px 12px;
          text-align: center;
          font-size: 1rem;
          font-weight: 800;
          letter-spacing: 0.5px;
          color: var(--nl-positive);
        }

        /* Controls Panel */
        .controls-panel {
          display: flex;
          flex-direction: column;
          gap: 10px;
          background: var(--nl-card);
          border: 1px solid var(--nl-border);
          border-radius: 12px;
          padding: 12px;
          box-sizing: border-box;
        }

        .button-grid {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 6px;
        }

        .btn-jump-neg {
          background: rgba(244, 63, 94, 0.15);
          color: var(--nl-negative);
          border-color: rgba(244, 63, 94, 0.3);
        }

        .btn-jump-pos {
          background: rgba(56, 189, 248, 0.15);
          color: var(--nl-positive);
          border-color: rgba(56, 189, 248, 0.3);
        }

        .bottom-actions {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 8px;
        }

        @media (max-width: 480px) {
          .button-grid {
            grid-template-columns: repeat(3, 1fr);
          }
          .stage-box {
            height: 160px;
          }
        }
      </style>

      <div class="nl-wrapper" id="nlWrapper">
        <!-- Header -->
        <div class="header-bar">
          <div class="title-badge">
            <span>🐸</span>
            <span>${labels.title}</span>
          </div>
          <div class="header-actions">
            <button class="touch-btn" id="btnLang" title="Toggle Language" aria-label="Toggle Language">
              ${this.state.lang === 'hi' ? 'EN' : 'हिं'}
            </button>
            <button class="touch-btn" id="btnAudio" title="Toggle Audio" aria-label="Toggle Audio">
              ${this.state.soundEnabled ? '🔊' : '🔇'}
            </button>
            <button class="touch-btn" id="btnReset" title="${labels.reset}" aria-label="Reset Number Line">
              ↺
            </button>
          </div>
        </div>

        <!-- 60 FPS Number Line Stage -->
        <div class="stage-box" id="stageBox" title="${labels.jumpInstruction}">
          <canvas id="simCanvas" width="600" height="190" role="img" aria-label="Interactive Number Line"></canvas>
        </div>

        <!-- Dynamic Equation Banner -->
        <div class="equation-banner" id="eqBanner">
          ${this.state.lang === 'hi' ? metrics.equationStringHi : metrics.equationString}
        </div>

        <!-- Readout Dashboard -->
        <div class="readout-card">
          <div class="metric-cell">
            <span class="metric-label">${labels.currentPos}</span>
            <span class="metric-val ${metrics.isNegative ? 'neg' : metrics.isOrigin ? 'zero' : ''}" id="valPos">
              ${metrics.currentPos > 0 ? `+${metrics.currentPos}` : metrics.currentPos}
            </span>
          </div>

          <div class="metric-cell">
            <span class="metric-label">${labels.distance}</span>
            <span class="metric-val zero" id="valDist">${metrics.distanceFromZero}</span>
          </div>

          <div class="metric-cell">
            <span class="metric-label">${labels.opposite}</span>
            <span class="metric-val mirror" id="valOpp">
              ${metrics.oppositePos > 0 ? `+${metrics.oppositePos}` : metrics.oppositePos}
            </span>
          </div>
        </div>

        <!-- Controls Panel -->
        <div class="controls-panel">
          <span style="font-size: 0.78rem; font-weight: 700; color: var(--nl-text-muted);">
            ${labels.jump} (${labels.jumpInstruction})
          </span>
          <div class="button-grid">
            <button class="touch-btn btn-jump-neg" id="jNeg5" aria-label="Jump minus 5">−5</button>
            <button class="touch-btn btn-jump-neg" id="jNeg2" aria-label="Jump minus 2">−2</button>
            <button class="touch-btn btn-jump-neg" id="jNeg1" aria-label="Jump minus 1">−1</button>
            <button class="touch-btn btn-jump-pos" id="jPos1" aria-label="Jump plus 1">+1</button>
            <button class="touch-btn btn-jump-pos" id="jPos2" aria-label="Jump plus 2">+2</button>
            <button class="touch-btn btn-jump-pos" id="jPos5" aria-label="Jump plus 5">+5</button>
          </div>

          <div class="bottom-actions">
            <button class="touch-btn ${this.state.showOppositeMirror ? 'active-toggle' : ''}" id="btnMirror" aria-label="Toggle Mirror">
              🪞 ${labels.toggleMirror}
            </button>
            <span style="font-size: 0.75rem; color: var(--nl-text-muted);" id="statusSub">
              ${this.state.currentPos === 0 ? labels.origin : this.state.currentPos > 0 ? labels.positive : labels.negative}
            </span>
          </div>
        </div>
      </div>
    `;

    this.applyTheme();
  }

  private applyTheme(): void {
    if (!this.shadowRoot) return;
    const wrapper = this.shadowRoot.getElementById('nlWrapper');
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

    // Jump Buttons
    const bindJump = (id: string, delta: number) => {
      this.shadowRoot?.getElementById(id)?.addEventListener('click', () => this.jump(delta));
    };

    bindJump('jNeg5', -5);
    bindJump('jNeg2', -2);
    bindJump('jNeg1', -1);
    bindJump('jPos1', 1);
    bindJump('jPos2', 2);
    bindJump('jPos5', 5);

    // Actions
    this.shadowRoot.getElementById('btnReset')?.addEventListener('click', () => this.reset());
    this.shadowRoot.getElementById('btnMirror')?.addEventListener('click', () => this.toggleMirror());
    this.shadowRoot.getElementById('btnLang')?.addEventListener('click', () => {
      this.setLanguage(this.state.lang === 'en' ? 'hi' : 'en');
    });
    this.shadowRoot.getElementById('btnAudio')?.addEventListener('click', () => {
      this.setState({ soundEnabled: !this.state.soundEnabled });
      const b = this.shadowRoot?.getElementById('btnAudio');
      if (b) b.textContent = this.state.soundEnabled ? '🔊' : '🔇';
    });

    // Tap/Click directly on Canvas Stage
    const canvas = this.shadowRoot.getElementById('simCanvas') as HTMLCanvasElement | null;
    if (canvas) {
      canvas.addEventListener('click', (e) => this.handleCanvasClick(e, canvas));
    }
  }

  private handleCanvasClick(e: MouseEvent, canvas: HTMLCanvasElement): void {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const margin = 28;
    const lineWidth = rect.width - margin * 2;
    const min = this.state.minBound;
    const max = this.state.maxBound;
    const range = max - min;

    const clampedX = Math.max(margin, Math.min(rect.width - margin, x));
    const normalized = (clampedX - margin) / lineWidth;
    const targetInteger = Math.round(min + normalized * range);

    this.setPosition(targetInteger);
  }

  private updateControls(): void {
    if (!this.shadowRoot) return;
    const btnMirror = this.shadowRoot.getElementById('btnMirror');
    if (btnMirror) {
      if (this.state.showOppositeMirror) btnMirror.classList.add('active-toggle');
      else btnMirror.classList.remove('active-toggle');
    }
  }

  private updateReadouts(): void {
    if (!this.shadowRoot) return;
    const metrics = this.getMetrics();
    const labels = NumberLineMathEvaluator.getLabels(this.state.lang);

    const valPos = this.shadowRoot.getElementById('valPos');
    const valDist = this.shadowRoot.getElementById('valDist');
    const valOpp = this.shadowRoot.getElementById('valOpp');
    const eqBanner = this.shadowRoot.getElementById('eqBanner');
    const statusSub = this.shadowRoot.getElementById('statusSub');

    if (valPos) {
      valPos.textContent = metrics.currentPos > 0 ? `+${metrics.currentPos}` : metrics.currentPos.toString();
      valPos.className = `metric-val ${metrics.isNegative ? 'neg' : metrics.isOrigin ? 'zero' : ''}`;
    }

    if (valDist) valDist.textContent = metrics.distanceFromZero.toString();
    if (valOpp) {
      valOpp.textContent = metrics.oppositePos > 0 ? `+${metrics.oppositePos}` : metrics.oppositePos.toString();
    }

    if (eqBanner) {
      eqBanner.textContent = this.state.lang === 'hi' ? metrics.equationStringHi : metrics.equationString;
    }

    if (statusSub) {
      statusSub.textContent = metrics.isOrigin ? labels.origin : metrics.isPositive ? labels.positive : labels.negative;
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
    // 60 FPS smooth marker lerping
    const lerpSpeed = 0.22;
    this.currentMarkerLerp += (this.targetMarkerLerp - this.currentMarkerLerp) * lerpSpeed;

    // Arc jump animation progress
    if (this.arcProgress < 1.0) {
      this.arcProgress = Math.min(1.0, this.arcProgress + 0.08);
    }
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
    const height = rect.height || 190;

    if (canvas.width !== Math.round(width * dpr) || canvas.height !== Math.round(height * dpr)) {
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
    }

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    const isLight = this.state.theme === 'light';
    const min = this.state.minBound;
    const max = this.state.maxBound;
    const range = max - min;
    const margin = 32;
    const lineWidth = width - margin * 2;
    const lineY = height * 0.62;

    const getX = (val: number) => margin + ((val - min) / range) * lineWidth;

    // 1. Draw Jump Vector Arc (if jump occurred)
    if (this.state.lastDelta !== 0 && this.state.showVectorArc) {
      const startX = getX(this.state.lastPos);
      const endX = getX(this.state.currentPos);
      const midX = (startX + endX) / 2;
      const jumpDistance = Math.abs(endX - startX);
      const arcHeight = Math.min(65, Math.max(25, jumpDistance * 0.35));
      const isPositiveJump = this.state.lastDelta > 0;

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(startX, lineY - 14);
      ctx.quadraticCurveTo(midX, lineY - 14 - arcHeight, endX, lineY - 14);
      ctx.strokeStyle = isPositiveJump ? '#38BDF8' : '#F43F5E';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Arrowhead at destination
      const arrowDir = isPositiveJump ? 1 : -1;
      ctx.beginPath();
      ctx.moveTo(endX, lineY - 14);
      ctx.lineTo(endX - arrowDir * 8, lineY - 20);
      ctx.lineTo(endX - arrowDir * 8, lineY - 8);
      ctx.closePath();
      ctx.fillStyle = isPositiveJump ? '#38BDF8' : '#F43F5E';
      ctx.fill();

      // Delta text over apex
      ctx.font = 'bold 11px system-ui, sans-serif';
      ctx.fillStyle = isPositiveJump ? '#38BDF8' : '#F43F5E';
      ctx.textAlign = 'center';
      ctx.fillText(
        isPositiveJump ? `+${this.state.lastDelta}` : `${this.state.lastDelta}`,
        midX,
        lineY - 18 - arcHeight
      );
      ctx.restore();
    }

    // 2. Opposite Mirror Highlights (if active)
    if (this.state.showOppositeMirror && this.state.currentPos !== 0) {
      const curX = getX(this.state.currentPos);
      const oppX = getX(-this.state.currentPos);
      const zeroX = getX(0);

      ctx.save();
      // Mirror arc connecting currentPos to -currentPos through 0
      ctx.beginPath();
      ctx.moveTo(curX, lineY - 8);
      ctx.quadraticCurveTo(zeroX, lineY - 55, oppX, lineY - 8);
      ctx.strokeStyle = '#A855F7';
      ctx.lineWidth = 2.0;
      ctx.stroke();

      // Mirrored ghost marker
      ctx.beginPath();
      ctx.arc(oppX, lineY, 8, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(168, 85, 247, 0.4)';
      ctx.fill();
      ctx.strokeStyle = '#A855F7';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.font = 'bold 10px system-ui, sans-serif';
      ctx.fillStyle = '#A855F7';
      ctx.textAlign = 'center';
      ctx.fillText('🪞', oppX, lineY - 18);
      ctx.restore();
    }

    // 3. Main Number Line Bar
    ctx.beginPath();
    ctx.moveTo(margin - 12, lineY);
    ctx.lineTo(width - margin + 12, lineY);
    ctx.lineWidth = 3.0;
    ctx.strokeStyle = isLight ? '#94A3B8' : '#475569';
    ctx.stroke();

    // Arrows at endpoints of line
    const drawLineArrow = (x: number, dir: number) => {
      ctx.beginPath();
      ctx.moveTo(x + dir * 8, lineY);
      ctx.lineTo(x, lineY - 5);
      ctx.lineTo(x, lineY + 5);
      ctx.closePath();
      ctx.fillStyle = isLight ? '#94A3B8' : '#475569';
      ctx.fill();
    };
    drawLineArrow(margin - 12, -1);
    drawLineArrow(width - margin + 12, 1);

    // 4. Tick Marks & Numbers (-10 to +10)
    for (let i = min; i <= max; i++) {
      const tx = getX(i);
      const isZero = i === 0;
      const isMajor = i % 5 === 0;
      const tickHeight = isZero ? 14 : isMajor ? 10 : 6;

      ctx.beginPath();
      ctx.moveTo(tx, lineY - tickHeight);
      ctx.lineTo(tx, lineY + tickHeight);
      ctx.lineWidth = isZero ? 3.0 : isMajor ? 2.0 : 1.0;
      ctx.strokeStyle = isZero ? '#F59E0B' : isLight ? '#64748B' : '#94A3B8';
      ctx.stroke();

      // Number labels
      if (isMajor || Math.abs(i) <= 3 || range <= 12) {
        ctx.font = isZero ? 'bold 13px system-ui, sans-serif' : '10px system-ui, sans-serif';
        ctx.fillStyle = isZero
          ? '#F59E0B'
          : i > 0
          ? isLight ? '#0284C7' : '#38BDF8'
          : isLight ? '#E11D48' : '#F43F5E';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(i === 0 ? '0' : i > 0 ? `+${i}` : `${i}`, tx, lineY + tickHeight + 4);
      }
    }

    // 5. Animated Frog / Hunter Marker
    const markerX = getX(this.currentMarkerLerp);

    // Marker drop shadow & beacon
    ctx.save();
    ctx.beginPath();
    ctx.arc(markerX, lineY, 11, 0, Math.PI * 2);
    ctx.fillStyle = this.state.currentPos === 0
      ? '#F59E0B'
      : this.state.currentPos > 0
      ? '#38BDF8'
      : '#F43F5E';
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#FFFFFF';
    ctx.stroke();

    // Marker Icon / Pointer
    ctx.beginPath();
    ctx.moveTo(markerX, lineY - 14);
    ctx.lineTo(markerX - 6, lineY - 24);
    ctx.lineTo(markerX + 6, lineY - 24);
    ctx.closePath();
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();

    ctx.font = '12px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🐸', markerX, lineY - 32);

    ctx.restore();
  }
}

// ============================================================================
// 6. Custom Element Registration
// ============================================================================

if (typeof customElements !== 'undefined') {
  if (!customElements.get(AashaSimNumberLine.TAG_NAME)) {
    customElements.define(AashaSimNumberLine.TAG_NAME, AashaSimNumberLine);
  }
  if (!customElements.get(AashaSimNumberLine.ALIAS_TAG_NAME)) {
    customElements.define(AashaSimNumberLine.ALIAS_TAG_NAME, AashaSimNumberLine);
  }
}

// ============================================================================
// 7. Standalone Inlined Simulation Script Generator (Zero-Cost Embedding)
// ============================================================================

export function generateNumberLineHunterSimScript(config?: NumberLineConfig): string {
  const defaultPos = config?.initialPos ?? 0;
  const min = config?.minBound ?? -10;
  const max = config?.maxBound ?? 10;

  return `
(function() {
  if (customElements.get('aasha-sim-number-line')) return;

  const clamp = (v, min = -10, max = 10) => Math.max(min, Math.min(max, Math.round(Number(v) || 0)));

  class AashaSimNumberLineElement extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this.state = {
        currentPos: ${defaultPos},
        lastPos: ${defaultPos},
        lastDelta: 0,
        minBound: ${min},
        maxBound: ${max},
        showMirror: false,
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

    jump(delta) {
      const prev = this.state.currentPos;
      const next = clamp(prev + delta, this.state.minBound, this.state.maxBound);
      this.setState({ currentPos: next, lastPos: prev, lastDelta: next - prev });
      this.emitTelemetry('jump', { from: prev, to: next, delta });
    }

    reset() { this.setState({ currentPos: 0, lastPos: 0, lastDelta: 0, showMirror: false }); }
    pause() { if (this._animId) { cancelAnimationFrame(this._animId); this._animId = null; } }
    resume() { if (!this._animId) this.startLoop(); }
    destroy() { this.pause(); }

    emitTelemetry(eventType, payload) {
      this.dispatchEvent(new CustomEvent('aasha:telemetry', {
        bubbles: true, composed: true,
        detail: { foundationId: 'F25', experienceId: 'number_line_hunter_sim', eventType, payload, timestamp: Date.now() }
      }));
    }

    render() {
      this.shadowRoot.innerHTML = \`
        <style>
          :host { display: block; width: 100%; max-width: 600px; margin: 0 auto; font-family: system-ui, sans-serif; box-sizing: border-box; }
          .sim-box { background: #0F172A; color: #F8FAFC; border: 1px solid #334155; border-radius: 14px; padding: 12px; display: flex; flex-direction: column; gap: 10px; }
          .header { display: flex; justify-content: space-between; align-items: center; }
          .title { font-weight: 700; color: #38BDF8; font-size: 0.95rem; }
          .stage { width: 100%; height: 160px; background: #1E293B; border-radius: 10px; border: 1px solid #334155; }
          canvas { width: 100%; height: 100%; }
          .eq-banner { background: rgba(56, 189, 248, 0.15); border: 1px solid rgba(56, 189, 248, 0.3); border-radius: 8px; padding: 6px; text-align: center; font-weight: 800; font-size: 0.95rem; color: #38BDF8; }
          .grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 6px; }
          button, .btn { min-width: 44px; min-height: 44px; padding: 6px 10px; background: #334155; color: #FFF; border: none; border-radius: 8px; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; touch-action: manipulation; }
          .btn-neg { background: rgba(244, 63, 94, 0.2); color: #F43F5E; }
          .btn-pos { background: rgba(56, 189, 248, 0.2); color: #38BDF8; }
          button.active { background: #A855F7; }
        </style>
        <div class="sim-box">
          <div class="header">
            <span class="title">🐸 Number-Line Hunter (F25)</span>
            <button id="btnReset" title="Reset">↺</button>
          </div>
          <div class="stage"><canvas id="cv" width="560" height="160"></canvas></div>
          <div class="eq-banner" id="dispEq">Position: 0 | Distance: 0</div>
          <div class="grid">
            <button class="btn btn-neg" id="jM5">−5</button>
            <button class="btn btn-neg" id="jM2">−2</button>
            <button class="btn btn-neg" id="jM1">−1</button>
            <button class="btn btn-pos" id="jP1">+1</button>
            <button class="btn btn-pos" id="jP2">+2</button>
            <button class="btn btn-pos" id="jP5">+5</button>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <button id="btnMir">🪞 Mirror Opposite</button>
            <span id="dispPos" style="font-weight: 800; font-size: 1rem; color: #38BDF8;">0</span>
          </div>
        </div>
      \`;
    }

    bindEvents() {
      const q = (id) => this.shadowRoot.getElementById(id);
      q('jM5').addEventListener('click', () => this.jump(-5));
      q('jM2').addEventListener('click', () => this.jump(-2));
      q('jM1').addEventListener('click', () => this.jump(-1));
      q('jP1').addEventListener('click', () => this.jump(1));
      q('jP2').addEventListener('click', () => this.jump(2));
      q('jP5').addEventListener('click', () => this.jump(5));
      q('btnReset').addEventListener('click', () => this.reset());
      q('btnMir').addEventListener('click', () => {
        this.setState({ showMirror: !this.state.showMirror });
        if (this.state.showMirror) q('btnMir').classList.add('active');
        else q('btnMir').classList.remove('active');
      });
    }

    syncUI() {
      const q = (id) => this.shadowRoot.getElementById(id);
      if (!q('dispPos')) return;
      const p = this.state.currentPos;
      q('dispPos').textContent = p > 0 ? '+' + p : p.toString();
      q('dispPos').style.color = p === 0 ? '#F59E0B' : p > 0 ? '#38BDF8' : '#F43F5E';
      if (this.state.lastDelta !== 0) {
        const signFrom = this.state.lastPos >= 0 ? '(+' + this.state.lastPos + ')' : '(' + this.state.lastPos + ')';
        const signDelta = this.state.lastDelta >= 0 ? '(+' + this.state.lastDelta + ')' : '(' + this.state.lastDelta + ')';
        const signTo = p >= 0 ? '(+' + p + ')' : '(' + p + ')';
        q('dispEq').textContent = signFrom + ' + ' + signDelta + ' = ' + signTo;
      } else {
        q('dispEq').textContent = 'Position: ' + (p > 0 ? '+' + p : p) + ' | Distance: ' + Math.abs(p);
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
      const m = 24, sw = w - m * 2, y = h * 0.65;
      const getX = (val) => m + ((val + 10) / 20) * sw;

      // Axis
      ctx.beginPath();
      ctx.moveTo(m - 10, y);
      ctx.lineTo(w - m + 10, y);
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = '#64748B';
      ctx.stroke();

      for (let i = -10; i <= 10; i++) {
        const tx = getX(i);
        const isMaj = i % 5 === 0;
        ctx.beginPath();
        ctx.moveTo(tx, y - (isMaj ? 8 : 4));
        ctx.lineTo(tx, y + (isMaj ? 8 : 4));
        ctx.strokeStyle = i === 0 ? '#F59E0B' : '#94A3B8';
        ctx.lineWidth = i === 0 ? 2.5 : 1;
        ctx.stroke();

        if (isMaj) {
          ctx.font = '10px sans-serif';
          ctx.fillStyle = i === 0 ? '#F59E0B' : i > 0 ? '#38BDF8' : '#F43F5E';
          ctx.textAlign = 'center';
          ctx.fillText(i.toString(), tx, y + 18);
        }
      }

      // Marker
      const mx = getX(this.state.currentPos);
      ctx.beginPath();
      ctx.arc(mx, y, 9, 0, Math.PI * 2);
      ctx.fillStyle = this.state.currentPos === 0 ? '#F59E0B' : this.state.currentPos > 0 ? '#38BDF8' : '#F43F5E';
      ctx.fill();
      ctx.strokeStyle = '#FFFFFF';
      ctx.stroke();
    }
  }

  customElements.define('aasha-sim-number-line', AashaSimNumberLineElement);
  if (!customElements.get('aasha-sim')) {
    customElements.define('aasha-sim', AashaSimNumberLineElement);
  }
})();
  `.trim();
}
