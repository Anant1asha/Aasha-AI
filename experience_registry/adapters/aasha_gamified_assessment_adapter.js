/**
 * Annanth Aasha Foundation - Universal Gamified Assessment Engine Adapter (F27)
 * Provenance: Cleanroom reverse-engineering & adaptation from KingsMath Web Games
 * License: CC BY-NC 4.0 Attribution (KingsMath.com mechanics) & MIT Component Isolation
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
    AashaExperienceAdapter = class {
      constructor(meta = {}) {
        this.foundationId = meta.foundationId || 'F27';
        this.experienceId = meta.experienceId || 'gamified_assessment';
        this.container = null;
        this.config = {};
        this.state = {};
      }
      mount(c, cfg) { this.container = c; this.config = cfg; }
      getState() { return { ...this.state }; }
      pause() {}
      resume() {}
      reset() {}
      destroy() { this.container = null; }
      emitTelemetry(t, p) {
        if (this.container && this.container.dispatchEvent) {
          this.container.dispatchEvent(new CustomEvent('aasha:telemetry', { detail: { type: t, payload: p } }));
        }
      }
      emitStateChange(s) {
        if (this.container && this.container.dispatchEvent) {
          this.container.dispatchEvent(new CustomEvent('aasha:state_change', { detail: { state: s } }));
        }
      }
    };
  }
} else if (typeof window !== 'undefined' && window.AashaExperienceAdapter) {
  AashaExperienceAdapter = window.AashaExperienceAdapter;
} else {
  AashaExperienceAdapter = class {
    constructor(meta = {}) {
      this.foundationId = meta.foundationId || 'F27';
      this.experienceId = meta.experienceId || 'gamified_assessment';
      this.container = null;
      this.config = {};
      this.state = {};
    }
    mount(c, cfg) { this.container = c; this.config = cfg; }
    getState() { return { ...this.state }; }
    pause() {}
    resume() {}
    reset() {}
    destroy() { this.container = null; }
    emitTelemetry(t, p) {
      if (this.container && this.container.dispatchEvent) {
        this.container.dispatchEvent(new CustomEvent('aasha:telemetry', { detail: { type: t, payload: p } }));
      }
    }
    emitStateChange(s) {
      if (this.container && this.container.dispatchEvent) {
        this.container.dispatchEvent(new CustomEvent('aasha:state_change', { detail: { state: s } }));
      }
    }
  };
}

class AashaGamifiedAssessmentAdapter extends AashaExperienceAdapter {
  constructor(metadata = {}) {
    super({
      foundationId: 'F27',
      foundationName: "King's Math Universal Gamified Assessment Engine",
      sourceRepo: 'https://github.com/kingsmath/web-games',
      experienceId: metadata.experienceId || 'universal_gamified_assessment'
    });

    // Supported modes: 'speed_racer', 'lilypad_hopper', 'category_sorter', 'memory_match'
    this.gameMode = metadata.gameMode || 'speed_racer';
    this.questions = [];
    this.currentIndex = 0;
    this.score = 0;
    this.streak = 0;
    this.maxStreak = 0;
    this.lives = 3;
    this.maxLives = 3;
    this.isPaused = false;
    this.isGameOver = false;

    // Procedural Audio Context
    this.audioCtx = null;
    this.soundEnabled = true;

    // Animation & Timers
    this.animFrameId = null;
    this.timerInterval = null;
    this.timeRemaining = 60;

    // Mode-specific state containers
    this.modeState = {};
    this._listeners = [];
  }

  /**
   * Initialize procedural Web Audio API with zero external asset files
   */
  _initAudio() {
    if (!this.soundEnabled) return;
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass && !this.audioCtx) {
        this.audioCtx = new AudioContextClass();
      }
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        const resumeAudio = () => {
          if (this.audioCtx && this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
          }
          window.removeEventListener('click', resumeAudio);
          window.removeEventListener('touchstart', resumeAudio);
          window.removeEventListener('keydown', resumeAudio);
        };
        window.addEventListener('click', resumeAudio, { once: true });
        window.addEventListener('touchstart', resumeAudio, { once: true });
        window.addEventListener('keydown', resumeAudio, { once: true });
      }
    } catch (e) {
      this.soundEnabled = false;
    }
  }

  /**
   * Synthesize procedural tone waveforms (sine, triangle, square)
   */
  playSound(type) {
    if (!this.soundEnabled || !this.audioCtx) return;
    try {
      if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
      const now = this.audioCtx.currentTime;

      if (type === 'move' || type === 'select') {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, now); // D5
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.08);
      } else if (type === 'correct') {
        // Multi-frequency arpeggio chord (C5 -> E5 -> G5 -> C6)
        const notes = [523.25, 659.25, 783.99, 1046.50];
        notes.forEach((freq, idx) => {
          const osc = this.audioCtx.createOscillator();
          const gain = this.audioCtx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + idx * 0.07);
          gain.gain.setValueAtTime(0.07, now + idx * 0.07);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.15);
          osc.connect(gain);
          gain.connect(this.audioCtx.destination);
          osc.start(now + idx * 0.07);
          osc.stop(now + idx * 0.07 + 0.16);
        });
      } else if (type === 'wrong') {
        // Low descending warning buzz
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.linearRampToValueAtTime(90, now + 0.22);
        gain.gain.setValueAtTime(0.09, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.23);
      } else if (type === 'hop') {
        // Water splash / hop sine pitch sweep
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(720, now + 0.12);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.13);
      } else if (type === 'win') {
        // Victory fanfare
        const chords = [
          { f: 523.25, t: 0.0 },
          { f: 659.25, t: 0.12 },
          { f: 783.99, t: 0.24 },
          { f: 1046.50, t: 0.36 },
          { f: 1318.51, t: 0.50 }
        ];
        chords.forEach(c => {
          const osc = this.audioCtx.createOscillator();
          const gain = this.audioCtx.createGain();
          osc.type = 'square';
          osc.frequency.setValueAtTime(c.f, now + c.t);
          gain.gain.setValueAtTime(0.07, now + c.t);
          gain.gain.exponentialRampToValueAtTime(0.001, now + c.t + 0.25);
          osc.connect(gain);
          gain.connect(this.audioCtx.destination);
          osc.start(now + c.t);
          osc.stop(now + c.t + 0.26);
        });
      }
    } catch (e) {
      // Audio playback fault isolation
    }
  }

  /**
   * Mount game engine into target container
   */
  mount(container, config = {}) {
    super.mount(container, config);
    this.container = container;
    this.config = config;

    this.gameMode = config.gameMode || this.gameMode || 'speed_racer';
    this.questions = this._normalizeQuestions(config.questions || []);
    this.soundEnabled = config.soundEnabled !== false;
    this.timeRemaining = config.durationSeconds || 60;
    this.maxLives = config.maxLives || 3;
    this.lives = this.maxLives;
    this.score = 0;
    this.streak = 0;
    this.maxStreak = 0;
    this.currentIndex = 0;
    this.isGameOver = false;
    this.isPaused = false;

    this._initAudio();
    this._renderBaseLayout();
    this._startMode();
    this.emitTelemetry('game_mounted', { mode: this.gameMode, questionCount: this.questions.length });
  }

  /**
   * Normalize incoming assessment questions from any schema
   */
  _normalizeQuestions(rawList) {
    if (!Array.isArray(rawList) || rawList.length === 0) {
      // Fallback foundational science / math assessment items
      return [
        {
          id: 'def_1',
          prompt: 'What force pulls objects toward the center of the Earth?',
          options: ['Gravity', 'Friction', 'Magnetism', 'Tension'],
          correctAnswer: 'Gravity',
          category: 'Physics',
          hints: ['Think of an apple falling from a tree.', 'Sir Isaac Newton formulated this law.'],
          misconceptions: {
            'Friction': 'Friction opposes relative motion between surfaces in contact, not gravitational pull.'
          }
        },
        {
          id: 'def_2',
          prompt: 'Which gas is released by green plants during photosynthesis?',
          options: ['Oxygen (O₂)', 'Carbon Dioxide (CO₂)', 'Nitrogen (N₂)', 'Hydrogen (H₂)'],
          correctAnswer: 'Oxygen (O₂)',
          category: 'Biology',
          hints: ['Humans and animals breathe this in.', 'It makes up about 21% of atmospheric air.'],
          misconceptions: {
            'Carbon Dioxide (CO₂)': 'Carbon dioxide is consumed by plants, while Oxygen is produced as a byproduct.'
          }
        },
        {
          id: 'def_3',
          prompt: 'Calculate the perimeter of a rectangle with length 6cm and width 4cm.',
          options: ['20 cm', '24 cm', '10 cm', '14 cm'],
          correctAnswer: '20 cm',
          category: 'Mathematics',
          hints: ['Perimeter = 2 × (length + width)', 'Add 6 + 4, then double the sum.'],
          misconceptions: {
            '24 cm': '24 cm² is the area (6 × 4), not the perimeter.'
          }
        }
      ];
    }

    return rawList.map((q, idx) => ({
      id: q.id || `q_${idx}`,
      prompt: q.prompt || q.question || 'Select the correct answer:',
      options: Array.isArray(q.options) ? [...q.options] : ['Option A', 'Option B'],
      correctAnswer: q.correctAnswer || q.answer || (q.options ? q.options[0] : ''),
      category: q.category || 'General',
      hints: Array.isArray(q.hints) ? q.hints : [],
      misconceptions: q.misconceptions || {}
    }));
  }

  /**
   * Render universal container wrapper and HUD
   */
  _renderBaseLayout() {
    this.container.innerHTML = `
      <div class="aasha-gamified-root" style="
        position: relative;
        width: 100%;
        max-width: 900px;
        min-height: 520px;
        margin: 0 auto;
        background: #0f172a;
        color: #f8fafc;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        border-radius: 16px;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        user-select: none;
        box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.4);
      ">
        <!-- HUD Header -->
        <div class="aasha-hud" style="
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 18px;
          background: rgba(30, 41, 59, 0.85);
          backdrop-filter: blur(8px);
          border-bottom: 2px solid #334155;
          z-index: 10;
        ">
          <div style="display: flex; align-items: center; gap: 12px;">
            <div style="font-weight: 700; color: #38bdf8; font-size: 15px; letter-spacing: 0.5px;">
              ${this._getModeTitle()}
            </div>
            <div class="aasha-lives" style="display: flex; gap: 4px; font-size: 16px;">
              ${'❤️'.repeat(this.lives)}
            </div>
          </div>

          <div style="display: flex; align-items: center; gap: 16px;">
            <div style="font-size: 14px; color: #94a3b8;">
              Time: <span class="aasha-time" style="font-weight: 700; color: #facc15;">${this.timeRemaining}s</span>
            </div>
            <div style="font-size: 15px; font-weight: 700; color: #4ade80;">
              Score: <span class="aasha-score">${this.score}</span>
            </div>
            <button class="aasha-btn-sound" title="Toggle Sound" style="
              background: #1e293b;
              border: 1px solid #475569;
              color: #cbd5e1;
              border-radius: 8px;
              width: 36px;
              height: 36px;
              cursor: pointer;
              font-size: 16px;
              display: flex;
              align-items: center;
              justify-content: center;
            ">${this.soundEnabled ? '🔊' : '🔇'}</button>
          </div>
        </div>

        <!-- Question Prompt Banner -->
        <div class="aasha-prompt-card" style="
          padding: 14px 20px;
          background: #1e293b;
          border-bottom: 1px solid #334155;
          text-align: center;
          z-index: 9;
        ">
          <div class="aasha-prompt-meta" style="font-size: 12px; color: #94a3b8; text-transform: uppercase; margin-bottom: 4px; letter-spacing: 1px;">
            Question ${this.currentIndex + 1} of ${this.questions.length}
          </div>
          <div class="aasha-prompt-text" style="font-size: 18px; font-weight: 600; color: #ffffff; line-height: 1.4;">
            ${this._getCurrentQuestion().prompt}
          </div>
          <div class="aasha-feedback-hint" style="
            display: none;
            margin-top: 8px;
            padding: 6px 12px;
            border-radius: 6px;
            font-size: 13px;
            background: rgba(239, 68, 68, 0.15);
            border: 1px solid #ef4444;
            color: #fca5a5;
          "></div>
        </div>

        <!-- Interactive Game Stage Viewport -->
        <div class="aasha-stage" style="
          position: relative;
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          background: #020617;
          min-height: 360px;
        "></div>

        <!-- Touch Controls Bar (Mobile / Responsive) -->
        <div class="aasha-touch-bar" style="
          display: flex;
          justify-content: center;
          gap: 16px;
          padding: 10px 16px;
          background: #0f172a;
          border-top: 1px solid #334155;
        "></div>
      </div>
    `;

    // Hook Sound Toggle
    const soundBtn = this.container.querySelector('.aasha-btn-sound');
    if (soundBtn) {
      soundBtn.addEventListener('click', () => {
        this.soundEnabled = !this.soundEnabled;
        soundBtn.textContent = this.soundEnabled ? '🔊' : '🔇';
        if (this.soundEnabled) this._initAudio();
      });
    }
  }

  _getModeTitle() {
    switch (this.gameMode) {
      case 'speed_racer': return '🏎️ SPEED RACER';
      case 'lilypad_hopper': return '🐸 LILYPAD HOPPER';
      case 'category_sorter': return '📦 CATEGORY CLASSIFIER';
      case 'memory_match': return '🃏 MEMORY MATCHER';
      default: return '🎮 AASHA GAMIFIED ASSESSMENT';
    }
  }

  _getCurrentQuestion() {
    return this.questions[this.currentIndex] || this.questions[0];
  }

  /**
   * Start selected game mode
   */
  _startMode() {
    this._startTimer();
    switch (this.gameMode) {
      case 'speed_racer':
        this._initSpeedRacerMode();
        break;
      case 'lilypad_hopper':
        this._initLilypadHopperMode();
        break;
      case 'category_sorter':
        this._initCategorySorterMode();
        break;
      case 'memory_match':
        this._initMemoryMatchMode();
        break;
      default:
        this._initSpeedRacerMode();
    }
  }

  _startTimer() {
    clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      if (this.isPaused || this.isGameOver) return;
      this.timeRemaining--;
      const timeEl = this.container.querySelector('.aasha-time');
      if (timeEl) timeEl.textContent = `${this.timeRemaining}s`;

      if (this.timeRemaining <= 0) {
        this._handleGameOver(false, 'Time expired!');
      }
    }, 1000);
  }

  // ==========================================================================
  // MODE 1: SPEED RACER (Lane Dodger & Answer Gate Collector)
  // ==========================================================================
  _initSpeedRacerMode() {
    const stage = this.container.querySelector('.aasha-stage');
    const touchBar = this.container.querySelector('.aasha-touch-bar');
    if (!stage) return;

    stage.innerHTML = `
      <canvas class="aasha-racer-canvas" width="600" height="400" style="
        width: 100%;
        height: 100%;
        object-fit: contain;
        display: block;
      "></canvas>
    `;

    // Touch controls: Left / Center / Right
    if (touchBar) {
      touchBar.innerHTML = `
        <button class="aasha-racer-btn-left" style="
          flex: 1; max-width: 120px; height: 48px; border-radius: 10px;
          background: #1e293b; border: 2px solid #38bdf8; color: #38bdf8;
          font-weight: 700; font-size: 16px; cursor: pointer;
        ">◀ LEFT</button>
        <button class="aasha-racer-btn-mid" style="
          flex: 1; max-width: 120px; height: 48px; border-radius: 10px;
          background: #1e293b; border: 2px solid #38bdf8; color: #38bdf8;
          font-weight: 700; font-size: 16px; cursor: pointer;
        ">▲ MID</button>
        <button class="aasha-racer-btn-right" style="
          flex: 1; max-width: 120px; height: 48px; border-radius: 10px;
          background: #1e293b; border: 2px solid #38bdf8; color: #38bdf8;
          font-weight: 700; font-size: 16px; cursor: pointer;
        ">RIGHT ▶</button>
      `;

      touchBar.querySelector?.('.aasha-racer-btn-left')?.addEventListener('click', () => this._setPlayerLane(0));
      touchBar.querySelector?.('.aasha-racer-btn-mid')?.addEventListener('click', () => this._setPlayerLane(1));
      touchBar.querySelector?.('.aasha-racer-btn-right')?.addEventListener('click', () => this._setPlayerLane(2));
    }

    const canvas = stage.querySelector?.('.aasha-racer-canvas');
    const ctx = canvas?.getContext ? canvas.getContext('2d') : null;

    this.modeState = {
      playerLane: 1, // 0: Left, 1: Center, 2: Right
      targetLane: 1,
      playerX: 300,
      gateZ: 0.1,    // 0.0 (horizon) to 1.0 (collision)
      speed: 0.007,
      options: this._prepareLaneOptions(),
      roadStripeY: 0
    };

    // Keyboard controls
    const keyHandler = (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        this._setPlayerLane(Math.max(0, this.modeState.playerLane - 1));
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        this._setPlayerLane(Math.min(2, this.modeState.playerLane + 1));
      } else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        this._setPlayerLane(1);
      }
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', keyHandler);
      this._listeners.push(() => window.removeEventListener('keydown', keyHandler));
    }

    // Racer Game Loop
    const loop = () => {
      if (this.isPaused || this.isGameOver) {
        if (typeof requestAnimationFrame === 'function') {
          this.animFrameId = requestAnimationFrame(loop);
        }
        return;
      }

      if (canvas && ctx) {
        this._updateRacer(canvas, ctx);
      }
      if (typeof requestAnimationFrame === 'function') {
        this.animFrameId = requestAnimationFrame(loop);
      }
    };
    if (typeof requestAnimationFrame === 'function') {
      this.animFrameId = requestAnimationFrame(loop);
    }
  }

  _prepareLaneOptions() {
    const q = this._getCurrentQuestion();
    const opts = [...q.options];
    // Ensure we have 3 options (or pad if fewer)
    while (opts.length < 3) opts.push('---');
    // Shuffle options across 3 lanes
    const shuffled = opts.slice(0, 3).sort(() => Math.random() - 0.5);
    // Guarantee correct answer is in one of the 3 lanes
    if (!shuffled.includes(q.correctAnswer)) {
      shuffled[Math.floor(Math.random() * 3)] = q.correctAnswer;
    }
    return shuffled;
  }

  _setPlayerLane(laneIdx) {
    if (this.modeState.playerLane !== laneIdx) {
      this.modeState.targetLane = laneIdx;
      this.playSound('move');
    }
  }

  _updateRacer(canvas, ctx) {
    const w = canvas.width;
    const h = canvas.height;
    const state = this.modeState;

    // Smooth lane interpolation
    const laneTargets = [w * 0.25, w * 0.5, w * 0.75];
    state.playerLane = state.targetLane;
    state.playerX += (laneTargets[state.playerLane] - state.playerX) * 0.2;

    // Advance gate
    state.gateZ += state.speed;
    state.roadStripeY = (state.roadStripeY + 8) % 40;

    // Draw Road & Perspective Horizon
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, w, h);

    // Horizon sky gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.45);
    skyGrad.addColorStop(0, '#0f172a');
    skyGrad.addColorStop(1, '#1e293b');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, h * 0.45);

    // Ground & Road
    ctx.fillStyle = '#047857'; // Grass side
    ctx.fillRect(0, h * 0.45, w, h * 0.55);

    // Asphalt trapezoid road
    ctx.beginPath();
    ctx.moveTo(w * 0.38, h * 0.45);
    ctx.lineTo(w * 0.62, h * 0.45);
    ctx.lineTo(w * 0.95, h);
    ctx.lineTo(w * 0.05, h);
    ctx.closePath();
    ctx.fillStyle = '#1e293b';
    ctx.fill();
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Road Lane Dividers
    const drawDivider = (tX) => {
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 2;
      ctx.setLineDash([16, 16]);
      ctx.lineDashOffset = -state.roadStripeY;
      ctx.beginPath();
      ctx.moveTo(w * 0.5 + (tX - w * 0.5) * 0.2, h * 0.45);
      ctx.lineTo(tX, h);
      ctx.stroke();
      ctx.setLineDash([]);
    };
    drawDivider(w * 0.35);
    drawDivider(w * 0.65);

    // Render Gate Barriers with Options
    const z = state.gateZ;
    if (z > 0.05 && z < 1.1) {
      const gateY = h * 0.45 + (h * 0.55) * (z * z);
      const gateScale = 0.2 + z * 0.8;
      const laneXs = [
        w * 0.5 + (w * 0.25 - w * 0.5) * gateScale,
        w * 0.5,
        w * 0.5 + (w * 0.75 - w * 0.5) * gateScale
      ];

      state.options.forEach((optText, i) => {
        const boxW = 150 * gateScale;
        const boxH = 46 * gateScale;
        const bX = laneXs[i] - boxW / 2;
        const bY = gateY - boxH;

        ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = Math.max(1, 3 * gateScale);
        ctx.beginPath();
        ctx.roundRect(bX, bY, boxW, boxH, 6 * gateScale);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#f8fafc';
        ctx.font = `bold ${Math.max(10, Math.floor(14 * gateScale))}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(optText, laneXs[i], bY + boxH / 2, boxW - 8);
      });
    }

    // Render Player Race Car
    const carW = 60;
    const carH = 34;
    const carY = h * 0.86;
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.roundRect(state.playerX - carW / 2, carY, carW, carH, 8);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Car windshield
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.roundRect(state.playerX - carW * 0.3, carY + 4, carW * 0.6, 10, 4);
    ctx.fill();

    // Car Wheels
    ctx.fillStyle = '#000000';
    ctx.fillRect(state.playerX - carW / 2 - 4, carY + 4, 4, 10);
    ctx.fillRect(state.playerX + carW / 2, carY + 4, 4, 10);
    ctx.fillRect(state.playerX - carW / 2 - 4, carY + 20, 4, 10);
    ctx.fillRect(state.playerX + carW / 2, carY + 20, 4, 10);

    // Collision Check when gate reaches player position
    if (state.gateZ >= 0.92) {
      const selectedAnswer = state.options[state.playerLane];
      const q = this._getCurrentQuestion();
      const isCorrect = selectedAnswer === q.correctAnswer;
      this._evaluateAnswer(isCorrect, selectedAnswer);

      // Reset gate for next question or continue
      state.gateZ = 0.05;
      state.options = this._prepareLaneOptions();
    }
  }

  // ==========================================================================
  // MODE 2: LILYPAD HOPPER (River Crossing Step Matrix)
  // ==========================================================================
  _initLilypadHopperMode() {
    const stage = this.container.querySelector('.aasha-stage');
    const touchBar = this.container.querySelector('.aasha-touch-bar');
    if (!stage) return;
    if (touchBar) touchBar.innerHTML = ''; // Lilypad buttons are in-stage

    const q = this._getCurrentQuestion();
    const options = [...q.options];

    stage.innerHTML = `
      <div class="aasha-lilypad-pond" style="
        position: relative;
        width: 100%;
        height: 100%;
        min-height: 380px;
        background: radial-gradient(circle at center, #0284c7 0%, #0369a1 60%, #075985 100%);
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        padding: 20px;
        box-sizing: border-box;
      ">
        <!-- Far River Bank (Goal) -->
        <div style="
          width: 100%; height: 36px; background: #15803d; border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          color: #dcfce7; font-weight: 700; font-size: 14px;
        ">🌿 TARGET GOAL BANK 🌿</div>

        <!-- Floating Lilypads Row -->
        <div class="aasha-pads-container" style="
          display: flex;
          justify-content: space-around;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
          padding: 10px 0;
        ">
          ${options.map((opt, i) => `
            <button class="aasha-lilypad-btn" data-answer="${encodeURIComponent(opt)}" style="
              width: 130px;
              height: 130px;
              border-radius: 50%;
              background: #16a34a;
              border: 4px solid #4ade80;
              box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.4), inset 0 2px 8px rgba(255, 255, 255, 0.3);
              color: #ffffff;
              font-weight: 700;
              font-size: 15px;
              padding: 12px;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              cursor: pointer;
              transition: transform 0.15s ease, background 0.2s ease;
              outline: none;
            ">
              <span style="font-size: 24px; margin-bottom: 4px;">🍀</span>
              <span style="text-align: center; word-break: break-word;">${opt}</span>
            </button>
          `).join('')}
        </div>

        <!-- Near River Bank with Frog Player -->
        <div style="
          position: relative;
          width: 100%; height: 54px; background: #166534; border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
        ">
          <div class="aasha-frog-avatar" style="
            font-size: 34px;
            position: absolute;
            bottom: 12px;
            transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          ">🐸</div>
        </div>
      </div>
    `;

    // Hook lilypad click handlers
    const pads = stage.querySelectorAll ? stage.querySelectorAll('.aasha-lilypad-btn') : [];
    pads.forEach(btn => {
      btn.addEventListener('mouseenter', () => {
        btn.style.transform = 'scale(1.06)';
      });
      btn.addEventListener('mouseleave', () => {
        btn.style.transform = 'scale(1.0)';
      });
      btn.addEventListener('click', (e) => {
        const chosen = decodeURIComponent(btn.getAttribute('data-answer'));
        const isCorrect = chosen === q.correctAnswer;

        // Animate Frog Hop
        const frog = stage.querySelector('.aasha-frog-avatar');
        this.playSound('hop');
        if (frog) {
          const rect = btn.getBoundingClientRect();
          const frogRect = frog.getBoundingClientRect();
          const deltaX = rect.left + rect.width / 2 - (frogRect.left + frogRect.width / 2);
          frog.style.transform = `translate(${deltaX}px, -140px) scale(1.2)`;
        }

        setTimeout(() => {
          this._evaluateAnswer(isCorrect, chosen);
          if (this.currentIndex < this.questions.length && !this.isGameOver) {
            this._initLilypadHopperMode();
          }
        }, 350);
      });
    });
  }

  // ==========================================================================
  // MODE 3: CATEGORY CLASSIFIER (Drag & Drop / Tap to Sort)
  // ==========================================================================
  _initCategorySorterMode() {
    const stage = this.container.querySelector('.aasha-stage');
    const touchBar = this.container.querySelector('.aasha-touch-bar');
    if (!stage) return;
    if (touchBar) touchBar.innerHTML = '';

    const q = this._getCurrentQuestion();
    const categories = Array.from(new Set(this.questions.map(item => item.category || 'General')));
    if (categories.length < 2) categories.push('Other');

    stage.innerHTML = `
      <div style="
        width: 100%; height: 100%; min-height: 380px;
        display: flex; flex-direction: column; justify-content: space-between;
        padding: 20px; box-sizing: border-box; background: #0f172a;
      ">
        <!-- Spawning Item Card -->
        <div style="display: flex; flex-direction: column; align-items: center; margin-top: 10px;">
          <div style="font-size: 13px; color: #94a3b8; margin-bottom: 8px;">Classify this item into the correct category:</div>
          <div class="aasha-sorter-card" style="
            background: #1e293b;
            border: 2px solid #38bdf8;
            border-radius: 12px;
            padding: 16px 28px;
            font-size: 20px;
            font-weight: 700;
            color: #ffffff;
            box-shadow: 0 10px 15px -3px rgba(0,0,0,0.3);
            cursor: grab;
          ">${q.prompt}</div>
        </div>

        <!-- Category Drop Bins -->
        <div style="
          display: flex; justify-content: center; gap: 16px; flex-wrap: wrap; margin-bottom: 10px;
        ">
          ${categories.slice(0, 4).map(cat => `
            <button class="aasha-category-bin" data-category="${encodeURIComponent(cat)}" style="
              flex: 1; min-width: 130px; max-width: 180px; height: 110px;
              background: #1e293b; border: 3px dashed #64748b; border-radius: 14px;
              display: flex; flex-direction: column; align-items: center; justify-content: center;
              gap: 6px; color: #f8fafc; font-weight: 700; font-size: 15px; cursor: pointer;
              transition: all 0.2s ease;
            ">
              <span style="font-size: 26px;">📦</span>
              <span>${cat}</span>
            </button>
          `).join('')}
        </div>
      </div>
    `;

    const bins = stage.querySelectorAll ? stage.querySelectorAll('.aasha-category-bin') : [];
    bins.forEach(bin => {
      bin.addEventListener('click', () => {
        const chosenCat = decodeURIComponent(bin.getAttribute('data-category'));
        const targetCat = q.category || categories[0];
        const isCorrect = chosenCat === targetCat;

        if (isCorrect) {
          bin.style.borderColor = '#4ade80';
          bin.style.background = 'rgba(74, 222, 128, 0.2)';
        } else {
          bin.style.borderColor = '#ef4444';
          bin.style.background = 'rgba(239, 68, 68, 0.2)';
        }

        setTimeout(() => {
          this._evaluateAnswer(isCorrect, chosenCat);
          if (this.currentIndex < this.questions.length && !this.isGameOver) {
            this._initCategorySorterMode();
          }
        }, 300);
      });
    });
  }

  // ==========================================================================
  // MODE 4: MEMORY MATCHER (Card Flip Pair Matcher)
  // ==========================================================================
  _initMemoryMatchMode() {
    const stage = this.container.querySelector('.aasha-stage');
    const touchBar = this.container.querySelector('.aasha-touch-bar');
    if (!stage) return;
    if (touchBar) touchBar.innerHTML = '';

    // Create 4 card pairs (8 cards total) from current and adjacent questions
    const pairs = this.questions.slice(0, 4).map((item, idx) => [
      { id: `p_${idx}`, text: item.prompt, pairId: idx, type: 'prompt' },
      { id: `a_${idx}`, text: item.correctAnswer, pairId: idx, type: 'answer' }
    ]).flat().sort(() => Math.random() - 0.5);

    this.modeState = {
      flippedCards: [],
      matchedPairs: 0,
      totalPairs: Math.min(4, this.questions.length)
    };

    stage.innerHTML = `
      <div style="
        width: 100%; height: 100%; min-height: 380px;
        display: flex; flex-direction: column; align-items: center; justify-content: center;
        padding: 16px; box-sizing: border-box; background: #0f172a;
      ">
        <div class="aasha-memory-grid" style="
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
          max-width: 680px;
          width: 100%;
        ">
          ${pairs.map(card => `
            <div class="aasha-card" data-id="${card.id}" data-pair="${card.pairId}" style="
              height: 110px;
              perspective: 600px;
              cursor: pointer;
            ">
              <div class="aasha-card-inner" style="
                position: relative; width: 100%; height: 100%;
                text-align: center; transition: transform 0.4s;
                transform-style: preserve-3d; border-radius: 10px;
              ">
                <!-- Front (Hidden) -->
                <div style="
                  position: absolute; width: 100%; height: 100%;
                  backface-visibility: hidden; background: #1e293b;
                  border: 2px solid #38bdf8; border-radius: 10px;
                  display: flex; align-items: center; justify-content: center;
                  font-size: 26px; color: #38bdf8; font-weight: 700;
                ">?</div>
                <!-- Back (Revealed) -->
                <div style="
                  position: absolute; width: 100%; height: 100%;
                  backface-visibility: hidden; transform: rotateY(180deg);
                  background: #334155; border: 2px solid #4ade80; border-radius: 10px;
                  display: flex; align-items: center; justify-content: center;
                  padding: 8px; box-sizing: border-box;
                  font-size: 13px; font-weight: 600; color: #ffffff;
                ">${card.text}</div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    const cards = stage.querySelectorAll ? stage.querySelectorAll('.aasha-card') : [];
    cards.forEach(c => {
      c.addEventListener('click', () => {
        const state = this.modeState;
        if (state.flippedCards.length >= 2 || c.classList.contains('is-flipped') || c.classList.contains('is-matched')) return;

        c.classList.add('is-flipped');
        c.querySelector('.aasha-card-inner').style.transform = 'rotateY(180deg)';
        this.playSound('select');
        state.flippedCards.push(c);

        if (state.flippedCards.length === 2) {
          const [c1, c2] = state.flippedCards;
          const p1 = c1.getAttribute('data-pair');
          const p2 = c2.getAttribute('data-pair');

          if (p1 === p2) {
            // Match found!
            this.playSound('correct');
            c1.classList.add('is-matched');
            c2.classList.add('is-matched');
            this.score += 150;
            this._updateHUD();
            state.matchedPairs++;
            state.flippedCards = [];

            if (state.matchedPairs >= state.totalPairs) {
              setTimeout(() => this._handleGameOver(true, 'Mastery Complete! All pairs matched!'), 600);
            }
          } else {
            // Mismatch
            this.playSound('wrong');
            setTimeout(() => {
              c1.classList.remove('is-flipped');
              c2.classList.remove('is-flipped');
              c1.querySelector('.aasha-card-inner').style.transform = 'rotateY(0deg)';
              c2.querySelector('.aasha-card-inner').style.transform = 'rotateY(0deg)';
              state.flippedCards = [];
            }, 800);
          }
        }
      });
    });
  }

  // ==========================================================================
  // SHARED EVALUATION & TELEMETRY DISPATCH
  // ==========================================================================
  _evaluateAnswer(isCorrect, selectedOption) {
    const q = this._getCurrentQuestion();
    const hintEl = this.container.querySelector('.aasha-feedback-hint');

    if (isCorrect) {
      this.playSound('correct');
      this.streak++;
      if (this.streak > this.maxStreak) this.maxStreak = this.streak;
      const comboMultiplier = Math.min(3, 1 + Math.floor(this.streak / 3) * 0.5);
      this.score += Math.round(100 * comboMultiplier);

      if (hintEl) hintEl.style.display = 'none';
      this.emitTelemetry('answer_submitted', {
        questionId: q.id,
        isCorrect: true,
        selectedOption,
        streak: this.streak,
        score: this.score
      });

      this.currentIndex++;
      if (this.currentIndex >= this.questions.length) {
        this._handleGameOver(true, 'Level Completed! Perfect Assessment Mastery!');
        return;
      }
    } else {
      this.playSound('wrong');
      this.streak = 0;
      this.lives--;

      // Diagnostic feedback clue
      if (hintEl) {
        const misconception = q.misconceptions && q.misconceptions[selectedOption];
        const hint = (q.hints && q.hints[0]) || 'Try looking at the question properties again!';
        hintEl.textContent = misconception ? `💡 Clue: ${misconception}` : `💡 Hint: ${hint}`;
        hintEl.style.display = 'block';
      }

      this.emitTelemetry('answer_submitted', {
        questionId: q.id,
        isCorrect: false,
        selectedOption,
        livesRemaining: this.lives,
        score: this.score
      });

      if (this.lives <= 0) {
        this._handleGameOver(false, 'Out of lives!');
        return;
      }
    }

    this._updateHUD();
  }

  _updateHUD() {
    const scoreEl = this.container.querySelector('.aasha-score');
    if (scoreEl) scoreEl.textContent = this.score;

    const livesEl = this.container.querySelector('.aasha-lives');
    if (livesEl) livesEl.innerHTML = '❤️'.repeat(Math.max(0, this.lives));

    const promptTextEl = this.container.querySelector('.aasha-prompt-text');
    if (promptTextEl && this.questions[this.currentIndex]) {
      promptTextEl.textContent = this.questions[this.currentIndex].prompt;
    }

    const promptMetaEl = this.container.querySelector('.aasha-prompt-meta');
    if (promptMetaEl) {
      promptMetaEl.textContent = `Question ${this.currentIndex + 1} of ${this.questions.length}`;
    }

    this.emitStateChange(this.getState());
  }

  _handleGameOver(isWin, message) {
    this.isGameOver = true;
    clearInterval(this.timerInterval);
    if (this.animFrameId) cancelAnimationFrame(this.animFrameId);

    if (isWin) this.playSound('win');
    else this.playSound('wrong');

    const stage = this.container.querySelector('.aasha-stage');
    if (!stage) return;

    stage.innerHTML = `
      <div style="
        display: flex; flex-direction: column; align-items: center; justify-content: center;
        width: 100%; height: 100%; text-align: center; padding: 24px;
        background: rgba(15, 23, 42, 0.95); z-index: 20;
      ">
        <div style="font-size: 56px; margin-bottom: 8px;">${isWin ? '🏆' : '💥'}</div>
        <div style="font-size: 26px; font-weight: 800; color: ${isWin ? '#4ade80' : '#ef4444'}; margin-bottom: 6px;">
          ${isWin ? 'MISSION ACCOMPLISHED!' : 'GAME OVER'}
        </div>
        <div style="font-size: 16px; color: #cbd5e1; margin-bottom: 20px;">${message}</div>

        <div style="
          display: flex; gap: 24px; margin-bottom: 24px;
          background: #1e293b; padding: 12px 28px; border-radius: 12px; border: 1px solid #334155;
        ">
          <div>
            <div style="font-size: 12px; color: #94a3b8;">FINAL SCORE</div>
            <div style="font-size: 22px; font-weight: 700; color: #4ade80;">${this.score}</div>
          </div>
          <div>
            <div style="font-size: 12px; color: #94a3b8;">MAX STREAK</div>
            <div style="font-size: 22px; font-weight: 700; color: #38bdf8;">${this.maxStreak} 🔥</div>
          </div>
        </div>

        <button class="aasha-btn-restart" style="
          padding: 12px 32px; border-radius: 10px; background: #38bdf8;
          color: #0f172a; font-size: 16px; font-weight: 700; border: none; cursor: pointer;
          box-shadow: 0 4px 14px rgba(56, 189, 248, 0.4);
        ">PLAY AGAIN 🔄</button>
      </div>
    `;

    const restartBtn = stage.querySelector('.aasha-btn-restart');
    if (restartBtn) {
      restartBtn.addEventListener('click', () => this.reset());
    }

    this.emitTelemetry('game_completed', {
      isWin,
      finalScore: this.score,
      maxStreak: this.maxStreak,
      timeRemaining: this.timeRemaining
    });
  }

  // ==========================================================================
  // CONTRACT LIFECYCLE HOOKS
  // ==========================================================================
  getState() {
    return {
      foundationId: this.foundationId,
      experienceId: this.experienceId,
      gameMode: this.gameMode,
      score: this.score,
      streak: this.streak,
      maxStreak: this.maxStreak,
      lives: this.lives,
      currentIndex: this.currentIndex,
      timeRemaining: this.timeRemaining,
      isGameOver: this.isGameOver,
      isPaused: this.isPaused
    };
  }

  pause() {
    this.isPaused = true;
    if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
    this.emitTelemetry('game_paused', this.getState());
  }

  resume() {
    this.isPaused = false;
    this._startMode();
    this.emitTelemetry('game_resumed', this.getState());
  }

  reset() {
    this.pause();
    this.mount(this.container, this.config);
    this.emitTelemetry('game_reset', this.getState());
  }

  destroy() {
    this.pause();
    clearInterval(this.timerInterval);
    if (this.audioCtx && this.audioCtx.state !== 'closed') {
      try { this.audioCtx.close(); } catch (e) {}
    }
    this._listeners.forEach(unsub => {
      try { unsub(); } catch (e) {}
    });
    this._listeners = [];
    if (this.container) {
      this.container.innerHTML = '';
      this.container = null;
    }
    this.emitTelemetry('game_destroyed', {});
  }
}

// Module export for Node.js / Jest / Bundler environments & global window binding
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { AashaGamifiedAssessmentAdapter };
} else if (typeof window !== 'undefined') {
  window.AashaGamifiedAssessmentAdapter = AashaGamifiedAssessmentAdapter;
}
