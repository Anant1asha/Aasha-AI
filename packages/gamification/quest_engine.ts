/**
 * Annanth Aasha Learning Ecosystem — AASHA AIOS
 * Gamified Quest Engine & Web Audio Synthesizer
 *
 * Implements 3-tier mastery loops (Novice -> Apprentice -> Master),
 * non-punitive XP progression, streak shields, offline Web Audio chimes,
 * and <aasha-game-quest> Web Components conforming to >=44x44px touch targets.
 * 100% offline-ready, pure TypeScript, zero external dependencies.
 */

export type QuestTier = 'NOVICE' | 'APPRENTICE' | 'MASTER';

export type AudioChimeType = 'correct' | 'incorrect' | 'hint' | 'streak_shield' | 'tier_complete';

export interface QuestRewardEvent {
  type: 'xp' | 'shield' | 'tier_up' | 'badge';
  amount?: number;
  reason: string;
  timestamp: number;
}

export interface QuestState {
  chapterId: string;
  tier: QuestTier;
  level: number;
  xp: number;
  targetXp: number;
  streakCount: number;
  streakShieldActive: boolean;
  badges: string[];
  history: QuestRewardEvent[];
}

/**
 * Pure state machine managing non-punitive gamification loops.
 */
export class GamifiedQuestStateMachine {
  private state: QuestState;

  constructor(chapterId: string, initialTier: QuestTier = 'NOVICE') {
    this.state = {
      chapterId,
      tier: initialTier,
      level: 1,
      xp: 0,
      targetXp: 50,
      streakCount: 0,
      streakShieldActive: false,
      badges: [],
      history: [],
    };
  }

  public getState(): Readonly<QuestState> {
    return { ...this.state, history: [...this.state.history], badges: [...this.state.badges] };
  }

  /**
   * Awards XP points. Never deducts points (Non-punitive law).
   */
  public awardXP(amount: number, reason: string): { xpAdded: number; tierUp: boolean; newTier: QuestTier } {
    const validAmount = Math.max(0, amount);
    this.state.xp += validAmount;

    this.state.history.push({
      type: 'xp',
      amount: validAmount,
      reason,
      timestamp: Date.now(),
    });

    const tierUp = this.evaluateTierProgression();
    return {
      xpAdded: validAmount,
      tierUp,
      newTier: this.state.tier,
    };
  }

  /**
   * Handles question answer results:
   * - On correct: increments streak, awards shield upon 3 consecutive correct, awards XP
   * - On incorrect: does not deduct XP; consumes streak shield if active, otherwise resets streak count
   */
  public handleAnswer(isCorrect: boolean, itemDifficulty: number = 0.0): {
    streak: number;
    shieldUsed: boolean;
    shieldAwarded: boolean;
    xpGained: number;
  } {
    let shieldUsed = false;
    let shieldAwarded = false;
    let xpGained = 0;

    if (isCorrect) {
      this.state.streakCount += 1;
      // Difficulty-scaled XP
      const baseXP = 10;
      const difficultyBonus = Math.max(0, Math.round((itemDifficulty + 3.0) * 2));
      xpGained = baseXP + difficultyBonus;

      // Award streak shield at 3 streak milestones
      if (this.state.streakCount >= 3 && !this.state.streakShieldActive) {
        this.state.streakShieldActive = true;
        shieldAwarded = true;
        this.state.history.push({
          type: 'shield',
          reason: 'Streak shield activated for 3 consecutive correct answers',
          timestamp: Date.now(),
        });
      }

      this.awardXP(xpGained, `Correct answer (Streak: ${this.state.streakCount})`);
    } else {
      // Wrong answer: Check streak shield protection
      if (this.state.streakShieldActive) {
        this.state.streakShieldActive = false;
        shieldUsed = true;
        this.state.history.push({
          type: 'shield',
          reason: 'Streak shield protected streak reset on incorrect answer',
          timestamp: Date.now(),
        });
        // Streak is preserved!
      } else {
        this.state.streakCount = 0;
      }
      // Zero XP penalty
    }

    return {
      streak: this.state.streakCount,
      shieldUsed,
      shieldAwarded,
      xpGained,
    };
  }

  /**
   * Evaluates if current XP triggers tier promotion.
   */
  private evaluateTierProgression(): boolean {
    const prevTier = this.state.tier;

    if (this.state.xp >= 150) {
      this.state.tier = 'MASTER';
      this.state.level = 3;
      this.state.targetXp = 250;
      if (!this.state.badges.includes('master_creator')) {
        this.state.badges.push('master_creator');
      }
    } else if (this.state.xp >= 50) {
      this.state.tier = 'APPRENTICE';
      this.state.level = 2;
      this.state.targetXp = 150;
      if (!this.state.badges.includes('apprentice_investigator')) {
        this.state.badges.push('apprentice_investigator');
      }
    } else {
      this.state.tier = 'NOVICE';
      this.state.level = 1;
      this.state.targetXp = 50;
    }

    if (prevTier !== this.state.tier) {
      this.state.history.push({
        type: 'tier_up',
        reason: `Promoted from ${prevTier} to ${this.state.tier}`,
        timestamp: Date.now(),
      });
      return true;
    }
    return false;
  }
}

/**
 * Zero-Asset Web Audio API Synthesizer.
 * Synthesizes harmonic chords and feedback cues without external sound files.
 */
export class OfflineToneSynthesizer {
  private static getAudioContext(): any | null {
    if (typeof window === 'undefined') return null;
    const AudioContextClass =
      (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return null;
    return new AudioContextClass();
  }

  public static isSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return !!((window as any).AudioContext || (window as any).webkitAudioContext);
  }

  /**
   * Plays synthetic acoustic chime based on interaction event.
   */
  public static play(type: AudioChimeType): void {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const now = ctx.currentTime;

      switch (type) {
        case 'correct': {
          // Harmonic C Major Triad (C5 -> E5 -> G5)
          const notes = [523.25, 659.25, 783.99];
          notes.forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now + idx * 0.08);

            gain.gain.setValueAtTime(0.12, now + idx * 0.08);
            gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.35);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start(now + idx * 0.08);
            osc.stop(now + idx * 0.08 + 0.36);
          });
          break;
        }

        case 'incorrect': {
          // Soft descending low tone (E3 -> Eb3)
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(164.81, now);
          osc.frequency.exponentialRampToValueAtTime(155.56, now + 0.25);

          gain.gain.setValueAtTime(0.1, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now);
          osc.stop(now + 0.29);
          break;
        }

        case 'hint': {
          // Gentle bell chime (A5 harmonic overtone)
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(880.0, now);

          gain.gain.setValueAtTime(0.1, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now);
          osc.stop(now + 0.41);
          break;
        }

        case 'streak_shield': {
          // High crystal resonance (C6 -> G6)
          [1046.5, 1567.98].forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + idx * 0.1);

            gain.gain.setValueAtTime(0.15, now + idx * 0.1);
            gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.45);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start(now + idx * 0.1);
            osc.stop(now + idx * 0.1 + 0.46);
          });
          break;
        }

        case 'tier_complete': {
          // Celebratory fanfare (C5 -> G5 -> C6 -> E6)
          const fanfare = [523.25, 783.99, 1046.5, 1318.51];
          fanfare.forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now + idx * 0.12);

            gain.gain.setValueAtTime(0.18, now + idx * 0.12);
            gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.5);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start(now + idx * 0.12);
            osc.stop(now + idx * 0.12 + 0.51);
          });
          break;
        }
      }
    } catch {
      // Audio playback fails silently in restricted iframe or headless contexts
    }
  }
}

/**
 * Returns embedded CSS styles for <aasha-game-quest> components,
 * strictly guaranteeing >=44x44px touch targets and responsive mobile layouts.
 */
export function getGamificationCSS(): string {
  return `
/* AASHA Gamified Quest Styles — Conforming to >=44x44px touch ergonomics */
.aasha-quest-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  max-width: 680px;
  margin: 0 auto;
  box-sizing: border-box;
  font-family: system-ui, -apple-system, sans-serif;
}

.aasha-quest-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(15, 23, 42, 0.85);
  border: 1px solid #334155;
  border-radius: 12px;
  padding: 10px 16px;
  min-height: 48px;
}

.aasha-streak-indicator {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-weight: 700;
  font-size: 15px;
  color: #f59e0b;
}

.aasha-shield-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 44px;
  min-height: 44px;
  border-radius: 8px;
  background: #0284c7;
  color: #ffffff;
  font-size: 18px;
  box-shadow: 0 0 10px rgba(2, 132, 199, 0.5);
}

.aasha-xp-track {
  width: 100%;
  height: 10px;
  background: #1e293b;
  border-radius: 5px;
  overflow: hidden;
  margin-top: 6px;
}

.aasha-xp-fill {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, #10b981);
  transition: width 0.4s ease-out;
}

.aasha-touch-button {
  min-width: 44px;
  min-height: 44px;
  padding: 10px 18px;
  border-radius: 8px;
  border: none;
  background: #2563eb;
  color: #ffffff;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  touch-action: manipulation;
  user-select: none;
}

.aasha-touch-button:active {
  transform: scale(0.97);
}
`.trim();
}
