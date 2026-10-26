/**
 * ChapterPipelineOrchestrator — TypeScript bridge to the Python AASHA pipeline.
 *
 * Replaces the former NON_CERTIFIABLE_DEMO stub with a real subprocess call
 * that invokes the Python CLI via the isolated .venv created by bootstrap.ps1.
 *
 * Anti-bleed: ALLOW_PAID_GEMINI_FALLBACK is always forced to "false".
 * Provider defaults to openrouter (Tier-1 free cascade).
 */

import { execSync, spawnSync } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

export interface PipelineOptions {
  subject: string;
  grade: number;
  topic: string;
  pdfPath?: string;
  outputPath?: string;
  provider?: string;
  mode?: string;
}

export interface PipelineResult {
  success: boolean;
  mode: string;
  certificationEligibility: 'NOT_ELIGIBLE' | 'ELIGIBLE_FOR_REVIEW';
  htmlPath: string;
  errors: string[];
  jobId?: string;
}

/**
 * Locate the Python pipeline directory relative to this file.
 * Supports both compiled __dirname and ESM import.meta.url contexts.
 */
function resolvePipelineDir(): string {
  const base =
    typeof __dirname !== 'undefined'
      ? path.resolve(__dirname, '..', '..', 'aasha-pipeline-with-master-json')
      : path.resolve(process.cwd(), 'Aasha-AI', 'aasha-pipeline-with-master-json');
  return base;
}

export class ChapterPipelineOrchestrator {
  private pipelineDir: string;
  private venvPython: string;
  private srcPath: string;

  constructor(_baseDir?: string) {
    this.pipelineDir = resolvePipelineDir();
    this.venvPython = path.join(this.pipelineDir, '.venv', 'Scripts', 'python.exe');
    this.srcPath = path.join(this.pipelineDir, 'src');
  }

  /** Check if the Python venv is bootstrapped and ready. */
  isReady(): boolean {
    return fs.existsSync(this.venvPython);
  }

  /** Compute SHA-256 of a PDF file via Python (zero JS deps). */
  calculatePdfHash(pdfPath?: string): { hash: string; error: string } {
    if (!pdfPath || !fs.existsSync(pdfPath)) {
      return { hash: '', error: `PDF not found: ${pdfPath}` };
    }
    if (!this.isReady()) {
      return { hash: '', error: 'Pipeline venv not ready. Run bootstrap.ps1 first.' };
    }
    try {
      const result = spawnSync(
        this.venvPython,
        ['-c', `import hashlib,sys; h=hashlib.sha256(open(sys.argv[1],'rb').read()).hexdigest(); print(h)`, pdfPath],
        { encoding: 'utf-8', timeout: 15000, env: { ...process.env, PYTHONPATH: this.srcPath } }
      );
      if (result.status === 0) {
        return { hash: result.stdout.trim(), error: '' };
      }
      return { hash: '', error: result.stderr?.trim() || 'hash failed' };
    } catch (e: any) {
      return { hash: '', error: String(e) };
    }
  }

  /** Run the full 8-stage PDF → HTML pipeline. */
  async runPipeline(options: PipelineOptions): Promise<PipelineResult> {
    const { subject, grade, pdfPath, provider = 'openrouter', mode = 'v5-engine' } = options;

    // Gate: bootstrap must have run
    if (!this.isReady()) {
      return {
        success: false,
        mode,
        certificationEligibility: 'NOT_ELIGIBLE',
        htmlPath: '',
        errors: [
          'Pipeline venv not bootstrapped. Run: powershell -File Aasha-AI/aasha-pipeline-with-master-json/bootstrap.ps1',
        ],
      };
    }

    // Gate: PDF must exist
    if (!pdfPath || !fs.existsSync(pdfPath)) {
      return {
        success: false,
        mode,
        certificationEligibility: 'NOT_ELIGIBLE',
        htmlPath: '',
        errors: [`PDF not found: ${pdfPath}`],
      };
    }

    const cliArgs = [
      '-m', 'aasha.cli',
      '--pdf', pdfPath,
      '--subject', subject,
      '--grade', String(grade),
      '--provider', provider,
      '--mode', mode,
      '--json-events',
    ];

    const env: NodeJS.ProcessEnv = {
      ...process.env,
      PYTHONPATH: this.srcPath,
      ALLOW_PAID_GEMINI_FALLBACK: 'false', // Anti-bleed lock
    };

    try {
      const result = spawnSync(this.venvPython, cliArgs, {
        encoding: 'utf-8',
        timeout: 600_000, // 10 minutes max
        cwd: this.pipelineDir,
        env,
      });

      // Parse JSON event stream from stdout
      const lines = (result.stdout || '').split('\n').filter((l: string) => l.trim().startsWith('{'));
      const events: any[] = [];
      for (const line of lines) {
        try { events.push(JSON.parse(line)); } catch { /* skip non-JSON lines */ }
      }

      const lastEvent = events[events.length - 1] || {};
      const succeeded = lastEvent.status === 'completed' || lastEvent.event === 'pipeline_complete';
      const htmlPath = lastEvent.html_path || lastEvent.output_path || '';

      if (result.status === 0 && succeeded) {
        return {
          success: true,
          mode,
          certificationEligibility: 'ELIGIBLE_FOR_REVIEW',
          htmlPath,
          errors: [],
          jobId: lastEvent.job_id,
        };
      }

      const errLines = (result.stderr || '').split('\n').filter(Boolean);
      return {
        success: false,
        mode,
        certificationEligibility: 'NOT_ELIGIBLE',
        htmlPath,
        errors: errLines.length ? errLines : [`Pipeline exited with code ${result.status}`],
        jobId: lastEvent.job_id,
      };
    } catch (e: any) {
      return {
        success: false,
        mode,
        certificationEligibility: 'NOT_ELIGIBLE',
        htmlPath: '',
        errors: [String(e)],
      };
    }
  }
}

// CLI guard — prevent accidental direct execution
if (require.main === module) {
  console.error(
    'ChapterPipelineOrchestrator: use programmatically or run_pipeline.ps1 for CLI usage.'
  );
  process.exitCode = 1;
}
