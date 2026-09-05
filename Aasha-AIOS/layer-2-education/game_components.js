/**
 * Aasha Modular Game Mechanics & Interaction Component Library
 * 
 * Synthesized from verified open-source educational paradigms:
 * 1. Escape Run Game Loop: Continuous action + arithmetic/concept obstacle challenge
 * 2. Emma Plays Touch Matching: Lightweight, dependency-free tactile matching grid
 * 3. H5P Interaction Schemas: Declarative JSON schemas for branch, card-sort, and hotspot
 * 4. Antura Progression Model: Tiered mastery, bite-sized mini-game milestones & adaptive difficulty
 * 
 * Fully offline-first, dependency-free, zero-tracking.
 */

class GameLoopComponent {
  /**
   * Inspired by abhas9/escape-run
   * Lightweight requestAnimationFrame loop managing runner velocity, obstacle collision,
   * and mental arithmetic / concept gates.
   */
  constructor(config = {}) {
    this.speed = config.initialSpeed || 3;
    this.acceleration = config.acceleration || 0.001;
    this.maxSpeed = config.maxSpeed || 8;
    this.distance = 0;
    this.isRunning = false;
    this.obstacles = [];
    this.onGateEncounter = config.onGateEncounter || null;
    this.onScoreUpdate = config.onScoreUpdate || null;
    this.rafId = null;
  }

  start() {
    this.isRunning = true;
    this.lastTime = performance.now();
    this._loop = (now) => {
      if (!this.isRunning) return;
      const dt = (now - this.lastTime) / 1000;
      this.lastTime = now;
      this.tick(dt);
      this.rafId = requestAnimationFrame(this._loop);
    };
    this.rafId = requestAnimationFrame(this._loop);
  }

  tick(dt) {
    this.distance += this.speed * dt * 60;
    this.speed = Math.min(this.maxSpeed, this.speed + this.acceleration);
    if (this.onScoreUpdate) {
      this.onScoreUpdate({ distance: Math.floor(this.distance), speed: this.speed.toFixed(1) });
    }
  }

  triggerGate(gateData) {
    this.pause();
    if (this.onGateEncounter) {
      this.onGateEncounter(gateData, (isCorrect) => {
        if (isCorrect) {
          this.speed = Math.min(this.maxSpeed, this.speed + 0.5);
          this.resume();
        } else {
          this.speed = Math.max(2, this.speed - 1.0);
          this.resume();
        }
      });
    }
  }

  pause() {
    this.isRunning = false;
    if (this.rafId) cancelAnimationFrame(this.rafId);
  }

  resume() {
    if (!this.isRunning) this.start();
  }

  reset() {
    this.pause();
    this.distance = 0;
    this.speed = 3;
    this.obstacles = [];
  }
}

class TactileMatchComponent {
  /**
   * Inspired by hajnalmt/emma-plays
   * Ultra-lightweight card/concept pairing component (e.g. Hindi <-> English, Term <-> Definition, Shape <-> Formula)
   */
  constructor(container, pairs = [], onComplete = null) {
    this.container = container;
    this.pairs = pairs;
    this.onComplete = onComplete;
    this.selected = [];
    this.matched = new Set();
  }

  render() {
    this.container.innerHTML = '';
    const grid = document.createElement('div');
    grid.style.cssText = 'display:grid;grid-template-columns:repeat(2,1fr);gap:10px;max-width:360px;margin:0 auto;';

    // Flatten and shuffle items
    const items = [];
    this.pairs.forEach((p, idx) => {
      items.push({ id: `p${idx}_a`, pairId: idx, text: p.left });
      items.push({ id: `p${idx}_b`, pairId: idx, text: p.right });
    });
    items.sort(() => Math.random() - 0.5);

    this.cardElements = {};
    items.forEach((item) => {
      const card = document.createElement('div');
      card.style.cssText = 'padding:14px 10px;border:2px solid #cbd5e1;border-radius:10px;background:#ffffff;text-align:center;font-weight:700;font-size:0.95rem;cursor:pointer;user-select:none;transition:all .15s;color:#1e293b;';
      card.textContent = item.text;
      card.addEventListener('click', () => this._handleSelect(item, card));
      grid.appendChild(card);
      this.cardElements[item.id] = card;
    });

    this.container.appendChild(grid);
  }

  _handleSelect(item, card) {
    if (this.matched.has(item.pairId) || this.selected.some(s => s.item.id === item.id)) return;
    
    card.style.borderColor = '#38bdf8';
    card.style.background = '#e0f2fe';
    this.selected.push({ item, card });

    if (this.selected.length === 2) {
      const [first, second] = this.selected;
      if (first.item.pairId === second.item.pairId) {
        // Matched!
        this.matched.add(first.item.pairId);
        first.card.style.borderColor = '#22c55e';
        first.card.style.background = '#dcfce7';
        second.card.style.borderColor = '#22c55e';
        second.card.style.background = '#dcfce7';
        this.selected = [];

        if (this.matched.size === this.pairs.length && this.onComplete) {
          this.onComplete({ totalPairs: this.pairs.length, success: true });
        }
      } else {
        // Mismatch
        first.card.style.borderColor = '#ef4444';
        first.card.style.background = '#fee2e2';
        second.card.style.borderColor = '#ef4444';
        second.card.style.background = '#fee2e2';
        setTimeout(() => {
          first.card.style.borderColor = '#cbd5e1';
          first.card.style.background = '#ffffff';
          second.card.style.borderColor = '#cbd5e1';
          second.card.style.background = '#ffffff';
          this.selected = [];
        }, 700);
      }
    }
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
 * Inspired by Antura and the Letters
 * Progression and bite-sized mini-game reward model
 */
class AnturaProgressionAdapter {
  static calculateMastery(firstAttempts, retries) {
    const total = Object.keys(firstAttempts).length;
    if (total === 0) return { score: 0, level: 1, stars: 0 };
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
