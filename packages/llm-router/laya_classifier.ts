/**
 * AASHA AIOS — Laya System 1 Task Classifier
 * Integrates ConvAI Laya (non-autoregressive calibrated classifier) into the AASHA LLM Router.
 *
 * Provides:
 *  - Sub-1ms Indic script detection (bilingual Devanagari isolation)
 *  - Zero-token System 1 task routing across (coding, assessment, design, analysis, lle, vision)
 *  - Resident background daemon for sub-50ms repeat decision latency
 *  - Calibrated confidence gating to protect against paid token bleed
 */

import { spawn, type ChildProcess } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import { type TaskType } from '../../llm_router';

export interface LayaClassification {
  taskType: TaskType;
  confidence: number;
  script: string;
  isIndic: boolean;
  source: string;
  latencyMs: number;
  difficultyScore?: number;
  needsTools?: boolean;
}

// Canonical Python executable for Laya virtualenv
const LAYA_PYTHON_CANDIDATES = [
  'C:\\Users\\admin\\AppData\\Roaming\\uv\\tools\\laya\\Scripts\\python.exe',
  'laya-python',
  'python',
];

function resolveLayaPython(): string {
  for (const candidate of LAYA_PYTHON_CANDIDATES) {
    if (candidate.includes('\\') && fs.existsSync(candidate)) {
      return candidate;
    }
  }
  return 'laya-python';
}

const CLASSIFIER_SCRIPT =
  typeof __dirname !== 'undefined'
    ? path.resolve(__dirname, '../../scripts/laya_task_classifier.py')
    : path.resolve(process.cwd(), 'scripts/laya_task_classifier.py');

// Fast in-memory Indic Unicode range regex for sub-millisecond pre-flight check
const DEVANAGARI_REGEX = /[\u0900-\u097F]/;
const OTHER_INDIC_REGEX = /[\u0980-\u0D7F]/;

// ─────────────────────────────────────────────────────────────────────────────
// RESIDENT DAEMON PROCESS MANAGER
// ─────────────────────────────────────────────────────────────────────────────

interface PendingRequest {
  resolve: (res: LayaClassification) => void;
  reject: (err: Error) => void;
  timer: ReturnType<typeof setTimeout>;
  t0: number;
}

class LayaDaemonClient {
  private proc: ChildProcess | null = null;
  private isReady = false;
  private pendingRequests = new Map<number, PendingRequest>();
  private nextId = 1;
  private buffer = '';

  public start(): void {
    if (this.proc || !fs.existsSync(CLASSIFIER_SCRIPT)) return;

    const pythonBin = resolveLayaPython();
    try {
      this.proc = spawn(pythonBin, [CLASSIFIER_SCRIPT, '--daemon'], {
        windowsHide: true,
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      this.proc.unref();
      (this.proc.stdout as any)?.unref?.();
      (this.proc.stderr as any)?.unref?.();
      (this.proc.stdin as any)?.unref?.();

      this.proc.stdout?.on('data', (data: { toString: () => string }) => {
        this.buffer += data.toString();
        this.processBuffer();
      });

      this.proc.stderr?.on('data', () => {
        // Suppress non-fatal warning messages from transformers/torch
      });

      this.proc.on('close', () => {
        this.cleanup();
      });

      this.proc.on('error', () => {
        this.cleanup();
      });
    } catch {
      this.cleanup();
    }
  }

  private processBuffer(): void {
    const lines = this.buffer.split('\n');
    this.buffer = lines.pop() || '';

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) continue;

      try {
        const payload = JSON.parse(line);
        if (payload.status === 'ready') {
          this.isReady = true;
          continue;
        }

        const id = payload.id;
        if (id && this.pendingRequests.has(id)) {
          const req = this.pendingRequests.get(id)!;
          clearTimeout(req.timer);
          this.pendingRequests.delete(id);

          req.resolve({
            taskType: payload.task_type as TaskType,
            confidence: payload.confidence ?? 0.8,
            script: payload.script ?? 'latin',
            isIndic: payload.is_indic ?? false,
            source: payload.source ?? 'laya_daemon',
            latencyMs: payload.latency_ms ?? Math.round((performance.now() - req.t0) * 100) / 100,
            difficultyScore: payload.difficulty_score,
            needsTools: payload.needs_tools,
          });
        }
      } catch {
        // Ignore non-json lines
      }
    }
  }

  public classify(text: string, timeoutMs = 2500): Promise<LayaClassification> {
    if (!this.proc || !this.isReady || !this.proc.stdin) {
      return Promise.reject(new Error('Laya daemon not ready'));
    }

    const id = this.nextId++;
    const t0 = performance.now();

    return new Promise<LayaClassification>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pendingRequests.delete(id);
        reject(new Error(`Laya daemon query ${id} timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      this.pendingRequests.set(id, { resolve, reject, timer, t0 });

      const msg = JSON.stringify({ id, text }) + '\n';
      this.proc!.stdin!.write(msg);
    });
  }

  public get ready(): boolean {
    return this.isReady && this.proc !== null;
  }

  public stop(): void {
    if (this.proc) {
      try {
        this.proc.kill();
      } catch {}
      this.cleanup();
    }
  }

  private cleanup(): void {
    this.proc = null;
    this.isReady = false;
    for (const [id, req] of this.pendingRequests.entries()) {
      clearTimeout(req.timer);
      req.reject(new Error(`Daemon terminated before completing query ${id}`));
    }
    this.pendingRequests.clear();
  }
}

// Global daemon instance
const daemon = new LayaDaemonClient();
daemon.start();

export function stopLayaDaemon(): void {
  daemon.stop();
}

export { daemon as layaDaemonClient };

/**
 * Classifies an incoming educational or system prompt using Laya's System 1 non-autoregressive engine.
 * Never throws — on any system error or timeout, falls back to a clean local heuristic.
 */
export async function classifyTaskWithLaya(
  text: string,
  options?: { forceHeuristic?: boolean }
): Promise<LayaClassification> {
  const t0 = performance.now();
  const trimmed = (text || '').trim();

  if (!trimmed) {
    return {
      taskType: 'analysis',
      confidence: 1.0,
      script: 'unknown',
      isIndic: false,
      source: 'empty_fallback',
      latencyMs: 0,
    };
  }

  // 1. Instant regex pre-flight for Indic scripts (<0.1ms)
  if (DEVANAGARI_REGEX.test(trimmed)) {
    return {
      taskType: 'lle-indic',
      confidence: 0.99,
      script: 'devanagari',
      isIndic: true,
      source: 'fast_indic_regex',
      latencyMs: Math.round((performance.now() - t0) * 100) / 100,
    };
  }
  if (OTHER_INDIC_REGEX.test(trimmed)) {
    return {
      taskType: 'lle-indic',
      confidence: 0.98,
      script: 'indic_regional',
      isIndic: true,
      source: 'fast_indic_regex',
      latencyMs: Math.round((performance.now() - t0) * 100) / 100,
    };
  }

  // 2. Multimodal image markers (<0.1ms)
  const lower = trimmed.toLowerCase();
  if (
    lower.includes('.png') ||
    lower.includes('.jpg') ||
    lower.includes('.jpeg') ||
    lower.includes('.webp') ||
    lower.includes('data:image/') ||
    lower.includes('multimodal vision')
  ) {
    return {
      taskType: 'vision',
      confidence: 0.95,
      script: 'latin',
      isIndic: false,
      source: 'multimodal_marker',
      latencyMs: Math.round((performance.now() - t0) * 100) / 100,
    };
  }

  // 3. Query resident daemon if ready and not forced heuristic
  if (!options?.forceHeuristic && daemon.ready) {
    try {
      return await daemon.classify(trimmed);
    } catch {
      // Fall through to heuristic if daemon took > 2.5s
    }
  }

  // 4. In-memory heuristic fallback (instant safety net with 0 latency)
  let taskType: TaskType = 'analysis';
  if (
    lower.includes('function') ||
    lower.includes('const ') ||
    lower.includes('typescript') ||
    lower.includes('canvas') ||
    lower.includes('compile') ||
    lower.includes('bug') ||
    lower.includes('equilibrium and fix')
  ) {
    taskType = 'coding';
  } else if (
    lower.includes('quiz') ||
    lower.includes('mcq') ||
    lower.includes('misconception') ||
    lower.includes('hint') ||
    lower.includes('distractor')
  ) {
    taskType = 'assessment';
  } else if (
    lower.includes('syllabus') ||
    lower.includes('curriculum') ||
    lower.includes('lesson plan') ||
    lower.includes('pedagog') ||
    lower.includes('section 24')
  ) {
    taskType = 'design';
  }

  return {
    taskType,
    confidence: 0.75,
    script: 'latin',
    isIndic: false,
    source: 'in_memory_heuristic',
    latencyMs: Math.round((performance.now() - t0) * 100) / 100,
  };
}
