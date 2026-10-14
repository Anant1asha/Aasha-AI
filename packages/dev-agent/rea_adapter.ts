/**
 * AASHA AIOS Development Agent — Optional REA Adapter
 * Authority: Canonical Governance AGENTS.md & SUPER_ADMIN_AIOS_V2.md
 * Target Tool: Reverse Engineer Anything (REA) — https://github.com/rea-tools/rea
 * Phase: Phase 1 Safe Governed Prototype
 */

import { execSync } from 'child_process';

export interface ReaAnalysisRequest {
  targetPath: string;
  operation: 'symbols' | 'decompile' | 'strings' | 'cfg';
  timeoutMs?: number;
}

export interface ReaAnalysisResult {
  status: 'SUCCESS' | 'REA_UNAVAILABLE' | 'TIMEOUT' | 'ERROR';
  isUntrustedData: true;
  payloadExcerpt: string;
  payloadSizeBytes: number;
  error?: string;
  durationMs: number;
}

export class ReaAdapter {
  private static readonly MAX_PAYLOAD_BYTES = 2097152; // 2 MB Ceiling
  private static readonly DEFAULT_TIMEOUT_MS = 30000;   // 30 Seconds

  /**
   * Probes whether REA CLI or MCP is available on the host environment.
   */
  public static isAvailable(): boolean {
    try {
      execSync('Get-Command rea -ErrorAction SilentlyContinue', { shell: 'powershell.exe', stdio: 'ignore' });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Executes an analysis query against the REA tool.
   * If REA is uninstalled, gracefully returns REA_UNAVAILABLE without crashing.
   */
  public static analyze(req: ReaAnalysisRequest): ReaAnalysisResult {
    const startTime = Date.now();
    const timeout = Math.min(req.timeoutMs || this.DEFAULT_TIMEOUT_MS, 30000);

    if (!this.isAvailable()) {
      return {
        status: 'REA_UNAVAILABLE',
        isUntrustedData: true,
        payloadExcerpt: '',
        payloadSizeBytes: 0,
        error: 'REA reverse engineering toolkit is not installed on this host. Optional capability disabled.',
        durationMs: Date.now() - startTime,
      };
    }

    try {
      // Bounded execution with strict timeout
      const rawOutput = execSync(`rea ${req.operation} "${req.targetPath}"`, {
        timeout,
        encoding: 'utf8',
        maxBuffer: this.MAX_PAYLOAD_BYTES,
      });

      const bufferSize = Buffer.byteLength(rawOutput, 'utf8');
      const truncated = bufferSize > this.MAX_PAYLOAD_BYTES ? rawOutput.slice(0, 100000) : rawOutput;

      return {
        status: 'SUCCESS',
        isUntrustedData: true,
        payloadExcerpt: truncated.slice(0, 500),
        payloadSizeBytes: bufferSize,
        durationMs: Date.now() - startTime,
      };
    } catch (err: any) {
      const isTimeout = err.code === 'ETIMEDOUT' || err.signal === 'SIGTERM';
      return {
        status: isTimeout ? 'TIMEOUT' : 'ERROR',
        isUntrustedData: true,
        payloadExcerpt: '',
        payloadSizeBytes: 0,
        error: err.message || 'Unknown REA execution error',
        durationMs: Date.now() - startTime,
      };
    }
  }
}
