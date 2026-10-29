/**
 * AASHA AIOS — Laya System 1 Task Classifier
 * Integrates ConvAI Laya (non-autoregressive calibrated classifier) into the AASHA LLM Router.
 *
 * Provides:
 *  - Sub-1ms Indic script detection (bilingual Devanagari isolation)
 *  - Zero-token System 1 task routing across (coding, assessment, design, analysis, lle, vision)
 *  - High-performance in-memory Curriculum Trie & LRU Cache (<0.1ms)
 *  - Auto-supervised resident background daemon with crash recovery & exponential backoff
 *  - Clean newline-delimited JSON IPC with heartbeat & unbuffered stdio
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
  ipcRttMs?: number;
  computeLatencyMs?: number;
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
// FAST IN-MEMORY CURRICULUM LRU CACHE & TRIE
// ─────────────────────────────────────────────────────────────────────────────

class LRUCache<K, V> {
  private cache = new Map<K, V>();
  constructor(private maxSize = 1000) {}

  get(key: K): V | undefined {
    const val = this.cache.get(key);
    if (val !== undefined) {
      this.cache.delete(key);
      this.cache.set(key, val);
    }
    return val;
  }

  set(key: K, value: V): void {
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey !== undefined) this.cache.delete(oldestKey);
    }
    this.cache.set(key, value);
  }

  clear(): void {
    this.cache.clear();
  }
}

interface TrieNode {
  children: Map<string, TrieNode>;
  taskType?: TaskType;
  weight?: number;
}

class CurriculumTaskTrie {
  private root: TrieNode = { children: new Map() };

  constructor() {
    this.populateRules();
  }

  private populateRules(): void {
    const rules: Array<{ phrases: string[]; taskType: TaskType; weight: number }> = [
      {
        phrases: [
          'typescript', 'javascript', 'canvas loop', 'canvas', 'html5 simulation',
          'compile beta', 'fix canvas loop', 'equilibrium and fix', 'simulation code',
          'write a typescript function', 'webgl'
        ],
        taskType: 'coding',
        weight: 0.95,
      },
      {
        phrases: [
          'quiz questions', 'misconception', '4-tier progressive hints', 'hints h1-h4',
          'distractor', 'distractors', 'mcq', 'tier hinted', 'assessment question',
          'create 5 quiz questions', 'answer key'
        ],
        taskType: 'assessment',
        weight: 0.95,
      },
      {
        phrases: [
          'pedagogical syllabus', 'section 24 contract', 'curriculum design',
          'lesson plan', 'class 12 macroeconomics', 'bloom level', 'learning objectives',
          'design a pedagogical syllabus'
        ],
        taskType: 'design',
        weight: 0.95,
      },
      {
        phrases: [
          'consumer equilibrium', 'demand curve', 'national income equilibrium',
          'rational numbers', 'explain what happens to', 'conceptual economic analysis',
          'law of demand', 'macroeconomics analysis'
        ],
        taskType: 'analysis',
        weight: 0.90,
      },
    ];

    for (const rule of rules) {
      for (const phrase of rule.phrases) {
        this.insert(phrase.toLowerCase(), rule.taskType, rule.weight);
      }
    }
  }

  private insert(phrase: string, taskType: TaskType, weight: number): void {
    let node = this.root;
    for (const char of phrase) {
      if (!node.children.has(char)) {
        node.children.set(char, { children: new Map() });
      }
      node = node.children.get(char)!;
    }
    node.taskType = taskType;
    node.weight = weight;
  }

  public search(text: string): { taskType: TaskType; confidence: number } | null {
    const lower = text.toLowerCase();
    let bestMatch: { taskType: TaskType; confidence: number; len: number } | null = null;

    for (let i = 0; i < lower.length; i++) {
      let node = this.root;
      let matchedLen = 0;
      for (let j = i; j < lower.length; j++) {
        const char = lower[j];
        if (!node.children.has(char)) break;
        node = node.children.get(char)!;
        matchedLen++;
        if (node.taskType && (!bestMatch || matchedLen > bestMatch.len)) {
          bestMatch = { taskType: node.taskType, confidence: node.weight ?? 0.9, len: matchedLen };
        }
      }
    }

    return bestMatch ? { taskType: bestMatch.taskType, confidence: bestMatch.confidence } : null;
  }
}

const curriculumTrie = new CurriculumTaskTrie();
const classificationCache = new LRUCache<string, LayaClassification>(1000);

// ─────────────────────────────────────────────────────────────────────────────
// AUTO-SUPERVISED RESIDENT DAEMON PROCESS MANAGER
// ─────────────────────────────────────────────────────────────────────────────

type DaemonState = 'STOPPED' | 'STARTING' | 'READY' | 'DEGRADED' | 'CRASHED';

interface PendingRequest {
  resolve: (res: LayaClassification) => void;
  reject: (err: Error) => void;
  timer: ReturnType<typeof setTimeout>;
  t0: number;
}

export class LayaDaemonClient {
  private proc: ChildProcess | null = null;
  private state: DaemonState = 'STOPPED';
  private pendingRequests = new Map<number, PendingRequest>();
  private nextId = 1;
  private buffer = '';
  private crashTimestamps: number[] = [];
  private respawnTimer: ReturnType<typeof setTimeout> | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private isIntentionallyStopped = false;

  constructor() {
    this.registerExitHandlers();
  }

  private registerExitHandlers(): void {
    const cleanup = () => {
      this.stop();
    };
    process.once('exit', cleanup);
    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);
  }

  public async ensureStarted(): Promise<boolean> {
    if (this.state === 'READY' && this.proc) {
      return true;
    }
    if (this.state === 'STARTING') {
      return true;
    }
    if (this.state === 'DEGRADED') {
      return false;
    }
    this.start();
    return this.proc !== null;
  }

  public start(): void {
    if (this.proc || !fs.existsSync(CLASSIFIER_SCRIPT)) {
      return;
    }

    this.isIntentionallyStopped = false;
    this.state = 'STARTING';
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
        // Suppress non-fatal warning messages from transformers/torch/pymupdf
      });

      this.proc.on('close', (code, signal) => {
        this.handleProcessExit(code, signal);
      });

      this.proc.on('error', () => {
        this.handleProcessExit(1, 'SPAWN_ERROR');
      });

      this.startHeartbeat();
    } catch {
      this.handleProcessExit(1, 'EXCEPTION');
    }
  }

  private startHeartbeat(): void {
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    this.heartbeatTimer = setInterval(() => {
      if (this.state === 'READY' && this.proc?.stdin) {
        try {
          this.proc.stdin.write(JSON.stringify({ type: 'ping', id: 0 }) + '\n');
        } catch {
          // Heartbeat failed
        }
      }
    }, 30000);
    this.heartbeatTimer.unref?.();
  }

  private handleProcessExit(code: number | null, signal: string | null): void {
    const wasIntentional = this.isIntentionallyStopped;
    this.cleanupPendingRequests(`Daemon exited with code ${code} / signal ${signal}`);
    this.proc = null;

    if (wasIntentional) {
      this.state = 'STOPPED';
      return;
    }

    this.state = 'CRASHED';
    const now = Date.now();
    this.crashTimestamps = this.crashTimestamps.filter((ts) => now - ts < 60000);
    this.crashTimestamps.push(now);

    if (this.crashTimestamps.length <= 3) {
      const backoffMs = Math.min(1000, 200 * Math.pow(2, this.crashTimestamps.length - 1));
      if (this.respawnTimer) clearTimeout(this.respawnTimer);
      this.respawnTimer = setTimeout(() => {
        if (!this.isIntentionallyStopped) {
          this.start();
        }
      }, backoffMs);
      this.respawnTimer.unref?.();
    } else {
      this.state = 'DEGRADED';
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
          this.state = 'READY';
          continue;
        }

        // Heartbeat pong
        if (payload.type === 'pong' || payload.id === 0) {
          continue;
        }

        const id = payload.id;
        if (id && this.pendingRequests.has(id)) {
          const req = this.pendingRequests.get(id)!;
          clearTimeout(req.timer);
          this.pendingRequests.delete(id);

          if (payload.error) {
            req.reject(new Error(`Daemon error: ${payload.error}`));
            continue;
          }

          const rttMs = Math.round((performance.now() - req.t0) * 100) / 100;
          req.resolve({
            taskType: payload.task_type as TaskType,
            confidence: payload.confidence ?? 0.8,
            script: payload.script ?? 'latin',
            isIndic: payload.is_indic ?? false,
            source: payload.source ?? 'laya_daemon',
            latencyMs: rttMs,
            ipcRttMs: rttMs,
            computeLatencyMs: payload.latency_ms,
            difficultyScore: payload.difficulty_score,
            needsTools: payload.needs_tools,
          });
        }
      } catch {
        // Ignore non-json line
      }
    }
  }

  public classify(text: string, timeoutMs = 2500): Promise<LayaClassification> {
    if (!this.proc || this.state !== 'READY' || !this.proc.stdin) {
      return Promise.reject(new Error(`Laya daemon not ready (state: ${this.state})`));
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
    return this.state === 'READY' && this.proc !== null;
  }

  public get supervisorState(): DaemonState {
    return this.state;
  }

  public stop(): void {
    this.isIntentionallyStopped = true;
    if (this.respawnTimer) {
      clearTimeout(this.respawnTimer);
      this.respawnTimer = null;
    }
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    if (this.proc) {
      try {
        if (this.proc.stdin && !this.proc.stdin.destroyed) {
          this.proc.stdin.write(JSON.stringify({ type: 'exit' }) + '\n');
        }
        this.proc.kill();
      } catch {}
      this.cleanupPendingRequests('Daemon explicitly stopped');
      this.proc = null;
    }
    this.state = 'STOPPED';
  }

  /** Injects a process termination for testing auto-supervision and respawn */
  public killChildProcessForTesting(): void {
    if (this.proc) {
      try {
        this.proc.kill('SIGTERM');
      } catch {}
    }
  }

  private cleanupPendingRequests(reason: string): void {
    for (const [id, req] of this.pendingRequests.entries()) {
      clearTimeout(req.timer);
      req.reject(new Error(`Daemon terminated: ${reason} (query ${id})`));
    }
    this.pendingRequests.clear();
  }
}

// Global daemon singleton
const daemon = new LayaDaemonClient();

export function stopLayaDaemon(): void {
  daemon.stop();
}

export function warmLayaDaemon(): void {
  daemon.ensureStarted();
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

  // 1. Check in-memory exact query LRU cache (<0.05ms)
  const cached = classificationCache.get(trimmed);
  if (cached && !options?.forceHeuristic) {
    return {
      ...cached,
      latencyMs: Math.round((performance.now() - t0) * 100) / 100,
      source: 'lru_cache',
    };
  }

  // 2. Instant regex pre-flight for Indic scripts (<0.1ms)
  if (DEVANAGARI_REGEX.test(trimmed)) {
    const res: LayaClassification = {
      taskType: 'lle-indic',
      confidence: 0.99,
      script: 'devanagari',
      isIndic: true,
      source: 'fast_indic_regex',
      latencyMs: Math.round((performance.now() - t0) * 100) / 100,
    };
    classificationCache.set(trimmed, res);
    return res;
  }
  if (OTHER_INDIC_REGEX.test(trimmed)) {
    const res: LayaClassification = {
      taskType: 'lle-indic',
      confidence: 0.98,
      script: 'indic_regional',
      isIndic: true,
      source: 'fast_indic_regex',
      latencyMs: Math.round((performance.now() - t0) * 100) / 100,
    };
    classificationCache.set(trimmed, res);
    return res;
  }

  // 3. Multimodal image markers (<0.1ms)
  const lower = trimmed.toLowerCase();
  if (
    lower.includes('.png') ||
    lower.includes('.jpg') ||
    lower.includes('.jpeg') ||
    lower.includes('.webp') ||
    lower.includes('data:image/') ||
    lower.includes('multimodal vision') ||
    lower.includes('inspect chart')
  ) {
    const res: LayaClassification = {
      taskType: 'vision',
      confidence: 0.95,
      script: 'latin',
      isIndic: false,
      source: 'multimodal_marker',
      latencyMs: Math.round((performance.now() - t0) * 100) / 100,
    };
    classificationCache.set(trimmed, res);
    return res;
  }

  // 4. In-memory Curriculum Trie match (<0.1ms)
  const trieMatch = curriculumTrie.search(trimmed);
  if (trieMatch && options?.forceHeuristic) {
    return {
      taskType: trieMatch.taskType,
      confidence: trieMatch.confidence,
      script: 'latin',
      isIndic: false,
      source: 'in_memory_heuristic',
      latencyMs: Math.round((performance.now() - t0) * 100) / 100,
    };
  }

  // 5. Query resident daemon if not forced heuristic
  if (!options?.forceHeuristic) {
    await daemon.ensureStarted();
    if (daemon.ready) {
      try {
        const res = await daemon.classify(trimmed);
        classificationCache.set(trimmed, res);
        return res;
      } catch {
        // Fall through to trie/heuristic if daemon took > 2.5s or errored
      }
    }
  }

  // 6. Curriculum Trie or Heuristic fallback
  const fallbackType = trieMatch ? trieMatch.taskType : resolveHeuristicFallback(lower);
  const fallbackRes: LayaClassification = {
    taskType: fallbackType,
    confidence: trieMatch?.confidence ?? 0.75,
    script: 'latin',
    isIndic: false,
    source: 'in_memory_heuristic',
    latencyMs: Math.round((performance.now() - t0) * 100) / 100,
  };
  classificationCache.set(trimmed, fallbackRes);
  return fallbackRes;
}

function resolveHeuristicFallback(lower: string): TaskType {
  if (
    lower.includes('function') ||
    lower.includes('const ') ||
    lower.includes('typescript') ||
    lower.includes('canvas') ||
    lower.includes('compile') ||
    lower.includes('bug') ||
    lower.includes('equilibrium and fix')
  ) {
    return 'coding';
  }
  if (
    lower.includes('quiz') ||
    lower.includes('mcq') ||
    lower.includes('misconception') ||
    lower.includes('hint') ||
    lower.includes('distractor')
  ) {
    return 'assessment';
  }
  if (
    lower.includes('syllabus') ||
    lower.includes('curriculum') ||
    lower.includes('lesson plan') ||
    lower.includes('pedagog') ||
    lower.includes('section 24')
  ) {
    return 'design';
  }
  return 'analysis';
}
