/**
 * Compatibility entrypoint for the former synthetic chapter pipeline.
 * No source-grounded generation, executed benchmark, authenticated HIL, or
 * certification authority is wired here. Fail closed without writing artifacts.
 */
export interface PipelineOptions {
  subject: string;
  grade: number;
  topic: string;
  pdfPath?: string;
  outputPath?: string;
}

export interface PipelineResult {
  success: false;
  mode: 'DEMO';
  certificationEligibility: 'NOT_ELIGIBLE';
  htmlPath: '';
  errors: string[];
}

export class ChapterPipelineOrchestrator {
  constructor(_baseDir?: string) {}

  calculatePdfHash(_pdfPath?: string): { hash: ''; error: string } {
    return { hash: '', error: 'NON_CERTIFIABLE_DEMO: legacy pipeline is disabled.' };
  }

  async runPipeline(_options: PipelineOptions): Promise<PipelineResult> {
    return {
      success: false,
      mode: 'DEMO',
      certificationEligibility: 'NOT_ELIGIBLE',
      htmlPath: '',
      errors: ['NON_CERTIFIABLE_DEMO: source-grounded generation, benchmark evidence, and authenticated HIL are not implemented.'],
    };
  }
}

if (require.main === module) {
  console.error('NON_CERTIFIABLE_DEMO: legacy chapter pipeline is disabled.');
  process.exitCode = 1;
}
