/**
 * AASHA AIOS Development Agent — Test Discovery & Verification Engine
 * Authority: Canonical Governance AGENTS.md & SUPER_ADMIN_AIOS_V2.md
 * Phase: Phase 1 Safe Governed Prototype
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { TestResultRecord } from './evidence_ledger';

export interface DiscoveredCandidateTest {
  id: string;
  name: string;
  command: string;
  workingDirectory: string;
  isAllowlisted: boolean;
  category: 'BENCHMARK' | 'E2E' | 'UNIT' | 'FAULT_INJECTION' | 'CUSTOM';
}

export class TestDiscoveryEngine {
  private repoRoot: string;
  private readonly ALLOWED_COMMAND_PREFIXES = [
    'node benchmarks/',
    'node tests/',
    'node ../tests/',
    'npx tsx tests/',
    'npm test',
  ];

  constructor(repoRoot: string) {
    this.repoRoot = path.resolve(repoRoot);
  }

  public discoverTests(): DiscoveredCandidateTest[] {
    const discovered: DiscoveredCandidateTest[] = [];

    // 1. Inspect Aasha-AI/package.json scripts
    const aashaPkgPath = path.join(this.repoRoot, 'Aasha-AI', 'package.json');
    if (fs.existsSync(aashaPkgPath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(aashaPkgPath, 'utf8'));
        if (pkg.scripts) {
          for (const [scriptName, cmd] of Object.entries(pkg.scripts)) {
            if (scriptName.startsWith('test:')) {
              discovered.push({
                id: `PKG-${scriptName}`,
                name: `NPM Script: ${scriptName}`,
                command: String(cmd),
                workingDirectory: path.join(this.repoRoot, 'Aasha-AI'),
                isAllowlisted: this.isCommandAllowlisted(String(cmd)),
                category: scriptName.includes('ltruth') ? 'BENCHMARK' : 'E2E',
              });
            }
          }
        }
      } catch {
        // Safe read failure
      }
    }

    // 2. Discover TypeScript / Node tests in tests/
    const aashaTestsDir = path.join(this.repoRoot, 'Aasha-AI', 'tests');
    if (fs.existsSync(aashaTestsDir)) {
      const files = fs.readdirSync(aashaTestsDir);
      for (const file of files) {
        if (file.endsWith('.ts') && (file.startsWith('test_') || file.startsWith('verify_'))) {
          const cmd = `npx tsx tests/${file}`;
          discovered.push({
            id: `TS-${file.replace('.ts', '')}`,
            name: `TypeScript Test: ${file}`,
            command: cmd,
            workingDirectory: path.join(this.repoRoot, 'Aasha-AI'),
            isAllowlisted: true,
            category: file.includes('fault_injection') ? 'FAULT_INJECTION' : 'UNIT',
          });
        }
      }
    }

    return discovered;
  }

  public isCommandAllowlisted(command: string): boolean {
    const trimmed = command.trim();
    return this.ALLOWED_COMMAND_PREFIXES.some(prefix => trimmed.startsWith(prefix));
  }

  /**
   * Safely executes an allowlisted test command and records verified outcome.
   * Unknown or non-allowlisted commands are recorded as BLOCKED or NOT_RUN.
   */
  public executeTest(test: DiscoveredCandidateTest): TestResultRecord {
    const timestamp = new Date().toISOString();

    if (!test.isAllowlisted || !this.isCommandAllowlisted(test.command)) {
      return {
        testId: test.id,
        testName: test.name,
        command: test.command,
        status: 'BLOCKED',
        details: 'Command not present in approved test execution allowlist',
        timestamp,
      };
    }

    try {
      const output = execSync(test.command, {
        cwd: test.workingDirectory,
        encoding: 'utf8',
        timeout: 45000, // 45s execution limit
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      return {
        testId: test.id,
        testName: test.name,
        command: test.command,
        status: 'PASS',
        details: output.slice(0, 300),
        timestamp,
      };
    } catch (err: any) {
      const stderr = err.stderr ? err.stderr.toString() : '';
      const stdout = err.stdout ? err.stdout.toString() : '';
      return {
        testId: test.id,
        testName: test.name,
        command: test.command,
        status: 'FAIL',
        details: (stderr || stdout || err.message).slice(0, 300),
        timestamp,
      };
    }
  }
}
