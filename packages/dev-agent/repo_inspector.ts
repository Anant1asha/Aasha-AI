/**
 * AASHA AIOS Development Agent — Repository Reconnaissance & Inspector
 * Authority: Canonical Governance AGENTS.md & SUPER_ADMIN_AIOS_V2.md
 * Phase: Phase 1 Safe Governed Prototype
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

export type FindingClassification = 'FACT' | 'INFERENCE' | 'ASSUMPTION' | 'UNKNOWN';

export interface RepositoryFinding {
  findingId: string;
  classification: FindingClassification;
  filePath: string;
  lineRange?: string;
  commitSha: string;
  evidenceExcerpt: string;
  confidence: number;
  limitations: string;
  recommendedAction: string;
}

export interface RepositoryMap {
  repositoryRoot: string;
  commitSha: string;
  branch: string;
  manifests: string[];
  canonicalContracts: string[];
  testSuites: string[];
  findings: RepositoryFinding[];
  secretsDetectedCount: number;
  auditTimestamp: string;
}

export class RepoInspector {
  private repoRoot: string;
  private currentCommitSha: string = 'UNKNOWN';
  private currentBranch: string = 'UNKNOWN';

  constructor(repoRoot: string) {
    this.repoRoot = path.resolve(repoRoot);
    this.resolveGitInfo();
  }

  private resolveGitInfo() {
    try {
      this.currentCommitSha = execSync('git rev-parse HEAD', { cwd: this.repoRoot, encoding: 'utf8' }).trim();
      this.currentBranch = execSync('git rev-parse --abbrev-ref HEAD', { cwd: this.repoRoot, encoding: 'utf8' }).trim();
    } catch {
      this.currentCommitSha = 'UNKNOWN_NO_GIT';
      this.currentBranch = 'UNKNOWN';
    }
  }

  public inspect(): RepositoryMap {
    const findings: RepositoryFinding[] = [];
    const manifests: string[] = [];
    const canonicalContracts: string[] = [];
    const testSuites: string[] = [];
    let secretsCount = 0;

    // 1. Inspect package manifests
    const potentialManifests = [
      'package.json',
      'package-lock.json',
      'Aasha-AI/package.json',
      'aasha-pipeline-with-master-json/pyproject.toml',
    ];

    for (const relPath of potentialManifests) {
      const fullPath = path.join(this.repoRoot, relPath);
      if (fs.existsSync(fullPath)) {
        manifests.push(relPath);
        findings.push({
          findingId: `FND-MAN-${manifests.length}`,
          classification: 'FACT',
          filePath: relPath,
          commitSha: this.currentCommitSha,
          evidenceExcerpt: `Manifest file present on disk (size: ${fs.statSync(fullPath).size} bytes)`,
          confidence: 1.0,
          limitations: 'Static existence verified; dependencies not installed in this step',
          recommendedAction: 'Audit dependencies against security advisories',
        });
      }
    }

    // 2. Inspect canonical contracts
    const potentialContracts = [
      'Aasha-AI/Aasha-AIOS/AGENTS.md',
      'Aasha-AI/Aasha-AIOS/SUPER_ADMIN_AIOS_V2.md',
      'docs/aios/13_LEARNING_CONTRACT.md',
      'docs/aios/14_ASSESSMENT_CONTRACT.md',
      'docs/aios/15_VISUAL_CONTRACT.md',
      'docs/aios/16_AGENT_CONTRACT.md',
      'GEMINI.md',
    ];

    for (const relPath of potentialContracts) {
      const fullPath = path.join(this.repoRoot, relPath);
      if (fs.existsSync(fullPath)) {
        canonicalContracts.push(relPath);
        findings.push({
          findingId: `FND-CON-${canonicalContracts.length}`,
          classification: 'FACT',
          filePath: relPath,
          commitSha: this.currentCommitSha,
          evidenceExcerpt: `Canonical contract found at ${relPath}`,
          confidence: 1.0,
          limitations: 'Contract text indexed; runtime enforcement evaluated by test harnesses',
          recommendedAction: 'Bind all pipeline agent outputs to this contract',
        });
      }
    }

    // 3. Inspect test suites
    const potentialTests = [
      'benchmarks/qa_ltruth_benchmark.js',
      'tests/e2e_all_chapters_suite.js',
      'tests/test_fault_injection_hardening.ts',
      'tests/test_registry_protocol_suite.ts',
      'tests/test_approval_authority.ts',
    ];

    for (const relPath of potentialTests) {
      const fullPath = path.join(this.repoRoot, relPath);
      const subPath = path.join(this.repoRoot, 'Aasha-AI', relPath);
      const resolvedPath = fs.existsSync(fullPath) ? relPath : (fs.existsSync(subPath) ? `Aasha-AI/${relPath}` : null);

      if (resolvedPath) {
        testSuites.push(resolvedPath);
        findings.push({
          findingId: `FND-TST-${testSuites.length}`,
          classification: 'FACT',
          filePath: resolvedPath,
          commitSha: this.currentCommitSha,
          evidenceExcerpt: `Verified test harness present on disk`,
          confidence: 1.0,
          limitations: 'Static harness verification; execution requires CommandAllowlistExecutor',
          recommendedAction: 'Execute in read-only test verification stage',
        });
      }
    }

    // 4. Secret scan check in tracked files
    const secretRegex = /(github_pat_[a-zA-Z0-9_]{30,}|sk-or-v1-[a-zA-Z0-9]{50,}|Bearer\s+pc_key_[a-zA-Z0-9_\-]{20,})/i;
    for (const contractPath of canonicalContracts) {
      const fullPath = path.join(this.repoRoot, contractPath);
      try {
        const content = fs.readFileSync(fullPath, 'utf8');
        const match = secretRegex.exec(content);
        if (match) {
          secretsCount++;
          findings.push({
            findingId: `FND-SEC-${secretsCount}`,
            classification: 'FACT',
            filePath: contractPath,
            commitSha: this.currentCommitSha,
            evidenceExcerpt: `Potential credential token matched pattern ${match[0].slice(0, 10)}...`,
            confidence: 0.95,
            limitations: 'Pattern matching; verify whether value is sample placeholder or active secret',
            recommendedAction: 'Quarantine file and rotate exposed credential immediately',
          });
        }
      } catch {
        // Safe read failure
      }
    }

    return {
      repositoryRoot: this.repoRoot,
      commitSha: this.currentCommitSha,
      branch: this.currentBranch,
      manifests,
      canonicalContracts,
      testSuites,
      findings,
      secretsDetectedCount: secretsCount,
      auditTimestamp: new Date().toISOString(),
    };
  }
}
