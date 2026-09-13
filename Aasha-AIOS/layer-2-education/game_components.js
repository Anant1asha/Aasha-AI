/**
 * Aasha Modular Game Mechanics & Interaction Component Library
 * Version: 2.0.0
 * 
 * Synthesized from verified open-source educational paradigms:
 * 1. Escape Run Game Loop: Continuous action + arithmetic/concept obstacle challenge
 * 2. Emma Plays Touch Matching: Lightweight, dependency-free tactile matching grid
 * 3. H5P Interaction Schemas: Declarative JSON schemas for branch, card-sort, and hotspot
 * 4. Antura Progression Model: Tiered mastery, bite-sized mini-game milestones & adaptive difficulty
 * 
 * Performance invariant: Sub-16.6ms frame budgets (60 FPS), touch targets >=44x44px, offline-first.
 */

class GameLoopComponent {
  /**
   * Inspired by abhas9/escape-run (Foundation F01)
   * High-performance requestAnimationFrame loop with frame-budget tracking,
   * obstacle collisions, and mental arithmetic/concept gates.
   */
  constructor(config = {}) {
    this.speed = config.initialSpeed || 3;
    this.baseSpeed = this.speed;
    this.acceleration = config.acceleration || 0.001;
    this.maxSpeed = config.maxSpeed || 8;
    this.distance = 0;
    this.isRunning = false;
    this.obstacles = [];
    this.onGateEncounter = config.onGateEncounter || null;
    this.onScoreUpdate = config.onScoreUpdate || null;
    this.onTelemetry = config.onTelemetry || null;
    this.rafId = null;
    this.container = config.container || null;

    // Performance & Frame Budget Profiler
    this.frameBudgetExceededCount = 0;
    this.totalFramesRendered = 0;
    this.lastFrameDurationMs = 0;
    this.lastTime = 0;
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
    
    this._loop = (now) => {
      if (!this.isRunning) return;
      const frameStart = typeof performance !== 'undefined' ? performance.now() : Date.now();
      const dt = Math.min((now - this.lastTime) / 1000, 0.1); // Clamp to prevent spiral of death
      this.lastTime = now;
      
      this.tick(dt);
      
      const frameEnd = typeof performance !== 'undefined' ? performance.now() : Date.now();
      this.lastFrameDurationMs = frameEnd - frameStart;
      this.totalFramesRendered++;
      if (this.lastFrameDurationMs > 16.67) {
        this.frameBudgetExceededCount++;
      }

      if (typeof requestAnimationFrame !== 'undefined') {
        this.rafId = requestAnimationFrame(this._loop);
      }
    };

    if (typeof requestAnimationFrame !== 'undefined') {
      this.rafId = requestAnimationFrame(this._loop);
    }
  }

  tick(dt) {
    this.distance += this.speed * dt * 60;
    this.speed = Math.min(this.maxSpeed, this.speed + this.acceleration);
    if (this.onScoreUpdate) {
      this.onScoreUpdate({
        distance: Math.floor(this.distance),
        speed: Number(this.speed.toFixed(1)),
        frameMs: Number(this.lastFrameDurationMs.toFixed(2))
      });
    }
  }

  triggerGate(gateData) {
    this.pause();
    if (this.onTelemetry) {
      this.onTelemetry({ event: 'gate_encountered', distance: Math.floor(this.distance), gateData });
    }
    if (this.onGateEncounter) {
      this.onGateEncounter(gateData, (isCorrect) => {
        if (isCorrect) {
          this.speed = Math.min(this.maxSpeed, this.speed + 0.5);
          if (this.onTelemetry) {
            this.onTelemetry({ event: 'gate_cleared', speed: this.speed });
          }
          this.resume();
        } else {
          this.speed = Math.max(2, this.speed - 1.0);
          if (this.onTelemetry) {
            this.onTelemetry({ event: 'gate_failed', speed: this.speed });
          }
          this.resume();
        }
      });
    }
  }

  pause() {
    this.isRunning = false;
    if (this.rafId && typeof cancelAnimationFrame !== 'undefined') {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  resume() {
    if (!this.isRunning) {
      this.start();
    }
  }

  reset() {
    this.pause();
    this.distance = 0;
    this.speed = this.baseSpeed;
    this.obstacles = [];
    this.frameBudgetExceededCount = 0;
    this.totalFramesRendered = 0;
  }

  destroy() {
    this.pause();
    this.obstacles = [];
    this.container = null;
  }

  getMetrics() {
    return {
      totalFrames: this.totalFramesRendered,
      frameBudgetExceeded: this.frameBudgetExceededCount,
      frameBudgetCompliancePct: this.totalFramesRendered > 0
        ? Math.round(((this.totalFramesRendered - this.frameBudgetExceededCount) / this.totalFramesRendered) * 100)
        : 100,
      lastFrameDurationMs: this.lastFrameDurationMs
    };
  }
}

class TactileMatchComponent {
  /**
   * Inspired by hajnalmt/emma-plays (Foundation F20)
   * High-responsiveness concept pairing component with mobile touch targets (>=44x44px),
   * tactile state styling, and telemetry event reporting.
   */
  constructor(container, pairs = [], onComplete = null, onTelemetry = null) {
    this.container = container;
    this.pairs = pairs;
    this.onComplete = onComplete;
    this.onTelemetry = onTelemetry;
    this.selected = [];
    this.matched = new Set();
    this.mismatches = 0;
    this.startTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
  }

  render() {
    if (!this.container) return;
    this.container.innerHTML = '';
    const grid = document.createElement('div');
    grid.style.cssText = 'display:grid;grid-template-columns:repeat(2,1fr);gap:10px;max-width:380px;margin:0 auto;width:100%;';

    // Flatten and shuffle items
    const items = [];
    this.pairs.forEach((p, idx) => {
      items.push({ id: `p${idx}_a`, pairId: idx, text: p.left });
      items.push({ id: `p${idx}_b`, pairId: idx, text: p.right });
    });
    items.sort(() => Math.random() - 0.5);

    this.cardElements = {};
    items.forEach((item) => {
      const card = document.createElement('button');
      card.type = 'button';
      card.style.cssText = 'min-height:54px;min-width:44px;padding:12px 10px;border:2px solid #cbd5e1;border-radius:12px;background:#ffffff;text-align:center;font-weight:700;font-size:0.95rem;cursor:pointer;user-select:none;touch-action:manipulation;transition:all .15s ease;color:#1e293b;';
      card.textContent = item.text;
      card.setAttribute('aria-label', `Pair option: ${item.text}`);
      
      const selectHandler = (e) => {
        if (e) e.preventDefault();
        this._handleSelect(item, card);
      };

      card.addEventListener('click', selectHandler);
      grid.appendChild(card);
      this.cardElements[item.id] = card;
    });

    this.container.appendChild(grid);
  }

  _handleSelect(item, card) {
    if (this.matched.has(item.pairId) || this.selected.some(s => s.item.id === item.id)) return;
    
    card.style.borderColor = '#38bdf8';
    card.style.background = '#e0f2fe';
    card.style.transform = 'scale(0.98)';
    this.selected.push({ item, card });

    if (this.selected.length === 2) {
      const [first, second] = this.selected;
      if (first.item.pairId === second.item.pairId) {
        // Matched!
        this.matched.add(first.item.pairId);
        first.card.style.borderColor = '#22c55e';
        first.card.style.background = '#dcfce7';
        first.card.style.transform = 'none';
        second.card.style.borderColor = '#22c55e';
        second.card.style.background = '#dcfce7';
        second.card.style.transform = 'none';
        this.selected = [];

        if (this.onTelemetry) {
          this.onTelemetry({
            event: 'pair_matched',
            pairId: first.item.pairId,
            matchedCount: this.matched.size,
            totalPairs: this.pairs.length
          });
        }

        if (this.matched.size === this.pairs.length && this.onComplete) {
          const totalTimeMs = Math.round((typeof performance !== 'undefined' ? performance.now() : Date.now()) - this.startTime);
          this.onComplete({
            totalPairs: this.pairs.length,
            mismatches: this.mismatches,
            timeElapsedMs: totalTimeMs,
            success: true
          });
        }
      } else {
        // Mismatch
        this.mismatches++;
        first.card.style.borderColor = '#ef4444';
        first.card.style.background = '#fee2e2';
        first.card.style.transform = 'none';
        second.card.style.borderColor = '#ef4444';
        second.card.style.background = '#fee2e2';
        second.card.style.transform = 'none';

        if (this.onTelemetry) {
          this.onTelemetry({
            event: 'pair_mismatch',
            firstPairId: first.item.pairId,
            secondPairId: second.item.pairId,
            mismatches: this.mismatches
          });
        }

        setTimeout(() => {
          if (!this.matched.has(first.item.pairId)) {
            first.card.style.borderColor = '#cbd5e1';
            first.card.style.background = '#ffffff';
          }
          if (!this.matched.has(second.item.pairId)) {
            second.card.style.borderColor = '#cbd5e1';
            second.card.style.background = '#ffffff';
          }
          this.selected = [];
        }, 500);
      }
    }
  }

  destroy() {
    if (this.container) this.container.innerHTML = '';
    this.selected = [];
    this.matched.clear();
  }
}

/**
 * Inspired by H5P Interaction Schemas
 * Standard declarative schemas for Aasha interactive learning blocks
 */
const H5PSchemas = {
  HotspotQuestion: {
    type: "object",
    properties: {
      imageUri: { type: "string" },
      prompt: { type: "string" },
      hotspots: {
        type: "array",
        items: {
          properties: {
            x: { type: "number" },
            y: { type: "number" },
            radius: { type: "number" },
            isCorrect: { type: "boolean" },
            feedback: { type: "string" },
            misconceptionId: { type: "string" }
          }
        }
      }
    }
  },
  DragSortBucket: {
    type: "object",
    properties: {
      prompt: { type: "string" },
      buckets: {
        type: "array",
        items: { properties: { id: { type: "string" }, title: { type: "string" } } }
      },
      items: {
        type: "array",
        items: { properties: { text: { type: "string" }, correctBucketId: { type: "string" } } }
      }
    }
  }
};

/**
 * Inspired by Antura and the Letters (Foundation F01/F20)
 * Progression and bite-sized mini-game reward model
 */
class AnturaProgressionAdapter {
  static calculateMastery(firstAttempts = {}, retries = []) {
    const total = Object.keys(firstAttempts).length;
    if (total === 0) return { score: 0, level: 1, stars: 0, accuracyPct: 0 };
    const correctCount = Object.values(firstAttempts).filter(Boolean).length;
    const accuracy = correctCount / total;

    let stars = 1;
    if (accuracy >= 0.9 && retries.length <= 1) stars = 3;
    else if (accuracy >= 0.7) stars = 2;

    return {
      totalQuestions: total,
      firstAttemptCorrect: correctCount,
      accuracyPct: Math.round(accuracy * 100),
      starsEarned: stars,
      retriesLogged: retries.length,
      advancementGranted: accuracy >= 0.6
    };
  }
}

if (typeof module !== 'undefined') {
  module.exports = {
    GameLoopComponent,
    TactileMatchComponent,
    H5PSchemas,
    AnturaProgressionAdapter
  };
}
