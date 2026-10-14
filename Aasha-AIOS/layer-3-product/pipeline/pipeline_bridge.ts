/**
 * AASHA AIOS Layer-3 Product Pipeline Bridge.
 * 
 * Exposes direct programmatic hooks into the canonical TypeScript V6 compiler
 * and Canonical IR Assembler from the AIOS Layer-3 product plane.
 */

import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';

// Use type imports for interfaces to prevent Node.js v24 ESM errors
import { IRAssembler, type AgentProposalsInput } from '../../../packages/canonical-ir/ir_assembler';
import { validateCanonicalIR, type CanonicalIR } from '../../../packages/canonical-ir/canonical_ir_schema';
import { V6Compiler } from '../../../packages/v6-engine/v6_compiler';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = (typeof __dirname !== 'undefined' ? path.resolve(__dirname, '../../../') : process.cwd());

export interface CompileResult {
  success: boolean;
  chapterId: string;
  outputPath?: string;
  byteSize?: number;
  error?: string;
}

export class AiosPipelineBridge {
  private compiler: V6Compiler;

  constructor() {
    this.compiler = new V6Compiler();
  }

  /**
   * Assembles a verified Canonical IR model from agent proposals
   */
  public assembleIR(proposals: AgentProposalsInput): CanonicalIR {
    const ir = IRAssembler.assemble(proposals);
    const validation = validateCanonicalIR(ir);
    if (!validation.valid) {
      throw new Error(`Canonical IR validation failed: ${validation.errors.join('; ')}`);
    }
    return ir;
  }

  /**
   * Compiles a Canonical IR into an offline-first single-file HTML5 chapter bundle
   */
  public compileIR(ir: CanonicalIR): string {
    return this.compiler.compile(ir);
  }

  /**
   * End-to-end pipeline execution from proposals to written HTML bundle
   */
  public async executePipeline(proposals: AgentProposalsInput, outputDir?: string): Promise<CompileResult> {
    try {
      const ir = this.assembleIR(proposals);
      const html = this.compileIR(ir);

      const targetDir = outputDir || path.join(REPO_ROOT, 'chapters');
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      const outFile = path.join(targetDir, `${proposals.title.replace(/\s+/g, '_')}_${proposals.grade}_v6.html`);
      fs.writeFileSync(outFile, html, 'utf-8');
      const stats = fs.statSync(outFile);

      return {
        success: true,
        chapterId: proposals.chapter_id,
        outputPath: outFile,
        byteSize: stats.size,
      };
    } catch (err: any) {
      return {
        success: false,
        chapterId: proposals.chapter_id,
        error: err.message,
      };
    }
  }
}

// Runtime stub export for dual-role symbols
export const AiosPipelineBridgeSymbol = {};
