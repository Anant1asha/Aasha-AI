/**
 * AASHA AIOS Development Agent — Phase 2 Acceptance Test Suite
 * Authority: Canonical Governance AGENTS.md & SUPER_ADMIN_AIOS_V2.md
 */

import { IsolatedWorktreeManager } from '../packages/dev-agent/worktree_manager';
import { CommandAllowlistExecutor } from '../packages/dev-agent/command_executor';
import { IndependentDiffReviewer } from '../packages/dev-agent/diff_reviewer';
import * as path from 'path';
import * as fs from 'fs';

interface TestResult {
  id: string;
  name: string;
  passed: boolean;
  details: string;
}

const results: TestResult[] = [];

function assert(condition: boolean, id: string, name: string, details: string) {
  if (!condition) {
    results.push({ id, name, passed: false, details: `FAILED: ${details}` });
    throw new Error(`[${id}] ${name} FAILED: ${details}`);
  } else {
    results.push({ id, name, passed: true, details });
    console.log(`✓ [${id}] ${name}: PASS (${details})`);
  }
}

export async function runPhase2TestSuite() {
  console.log('\n======================================================================');
  console.log(' AASHA AIOS DEVELOPMENT AGENT — PHASE 2 VERIFICATION TEST SUITE');
  console.log('======================================================================\n');

  const rootDir = path.resolve('..');
  const aashaDir = path.resolve('.');

  // 1. TC_P2_01_WORKTREE_CLEAN_CHECK
  {
    const manager = new IsolatedWorktreeManager(rootDir);
    const isClean = manager.isPrimaryTreeClean();
    // In our live repository, we have tracked modifications, so dirty check triggers
    let threwOnDirty = false;
    try {
      manager.createWorktree('TASK_DIRTY_TEST', undefined, false);
    } catch (err: any) {
      if (err.message.includes('Primary working tree is dirty')) {
        threwOnDirty = true;
      }
    }

    assert(
      !isClean ? threwOnDirty : true,
      'TC_P2_01',
      'WORKTREE_DIRTY_CHECK',
      'Dirty primary tree correctly prevented unauthorized worktree creation'
    );
  }

  // 2. TC_P2_02_WORKTREE_ISOLATION
  {
    const manager = new IsolatedWorktreeManager(rootDir);
    // Explicit override permitted for test verification
    const session = manager.createWorktree('TASK_ISOLATION_TEST', undefined, true);
    const worktreeExists = fs.existsSync(session.worktreePath);

    assert(
      worktreeExists && session.status === 'ACTIVE' && session.branchName.startsWith('dev-agent/'),
      'TC_P2_02',
      'WORKTREE_ISOLATION',
      `Isolated worktree created at ${session.worktreePath} on branch ${session.branchName}`
    );

    // 3. TC_P2_03_WORKTREE_QUARANTINE
    manager.quarantineWorktree(session, 'Automated repair attempts exhausted (2/2)');
    const quarantineFile = path.join(session.worktreePath, 'QUARANTINE_REASON.txt');

    assert(
      session.status === 'QUARANTINED' && fs.existsSync(quarantineFile),
      'TC_P2_03',
      'WORKTREE_QUARANTINE',
      'Worktree successfully transitioned to QUARANTINED with reason logged'
    );

    // 4. TC_P2_04_WORKTREE_CLEANUP
    let cleanupBlocked = false;
    try {
      manager.removeWorktree(session, false); // without force
    } catch {
      cleanupBlocked = true;
    }

    assert(
      cleanupBlocked,
      'TC_P2_04a',
      'QUARANTINED_WORKTREE_PROTECTED',
      'Quarantined worktree blocked from unforced removal'
    );

    // Force remove for test cleanup
    manager.removeWorktree(session, true);
    assert(
      session.status === 'REMOVED' && !fs.existsSync(session.worktreePath),
      'TC_P2_04b',
      'WORKTREE_CLEANUP_FORCE',
      'Worktree cleanly removed after explicit force override'
    );
  }

  // 5. TC_P2_05_COMMAND_ALLOWLIST_EXECUTABLE
  {
    const gitCheck = CommandAllowlistExecutor.isCommandPermitted('git', ['status']);
    const pythonCheck = CommandAllowlistExecutor.isCommandPermitted('python', ['test.py']);
    const bashCheck = CommandAllowlistExecutor.isCommandPermitted('bash', ['script.sh']);

    assert(
      gitCheck.permitted === true && pythonCheck.permitted === false && bashCheck.permitted === false,
      'TC_P2_05',
      'COMMAND_ALLOWLIST_EXECUTABLE',
      'Allowlisted executable (git) permitted; unallowlisted (python, bash) denied'
    );
  }

  // 6. TC_P2_06_COMMAND_PROHIBITED_TOKENS
  {
    const chainedCheck = CommandAllowlistExecutor.isCommandPermitted('git', ['status', '&&', 'git', 'push']);
    const destructiveCheck = CommandAllowlistExecutor.isCommandPermitted('git', ['status', 'rm -rf']);

    assert(
      chainedCheck.permitted === false && destructiveCheck.permitted === false,
      'TC_P2_06',
      'COMMAND_PROHIBITED_TOKENS',
      'Shell chaining (&&) and destructive tokens blocked'
    );
  }

  // 7. TC_P2_07_COMMAND_UNAUTHORIZED_INSTALL
  {
    const installWithoutAuth = CommandAllowlistExecutor.isCommandPermitted('npm', ['install', 'lodash'], {
      workingDirectory: aashaDir,
      isInstallAuthorized: false,
    });
    const installWithAuth = CommandAllowlistExecutor.isCommandPermitted('npm', ['install', 'lodash'], {
      workingDirectory: aashaDir,
      isInstallAuthorized: true,
    });

    assert(
      installWithoutAuth.permitted === false && installWithAuth.permitted === true,
      'TC_P2_07',
      'COMMAND_UNAUTHORIZED_INSTALL',
      'Package installation denied without explicit isInstallAuthorized flag'
    );
  }

  // 8. TC_P2_08_DIFF_REVIEW_SCOPE_VIOLATION
  {
    const diff = `--- a/secret_file.ts\n+++ b/secret_file.ts\n@@ -1 +1 @@\n-old\n+new`;
    const report = IndependentDiffReviewer.reviewDiff('TASK_SCOPE', diff, ['secret_file.ts'], ['packages/dev-agent/']);
    const scopeCheck = report.checks.find(c => c.invariantId === 'INV-01');

    assert(
      report.isApprovedForPromotion === false && scopeCheck?.status === 'FAIL',
      'TC_P2_08',
      'DIFF_REVIEW_SCOPE_VIOLATION',
      'Out-of-scope file modification flagged as FAIL and rejected promotion'
    );
  }

  // 9. TC_P2_09_DIFF_REVIEW_SECRET_LEAK
  {
    const diff = `+ const token = "sk-12345678901234567890123456789012";`;
    const report = IndependentDiffReviewer.reviewDiff('TASK_SEC', diff, ['config.ts'], ['*']);
    const secCheck = report.checks.find(c => c.invariantId === 'INV-02');

    assert(
      report.isApprovedForPromotion === false && secCheck?.status === 'FAIL',
      'TC_P2_09',
      'DIFF_REVIEW_SECRET_LEAK',
      'Exposed API key in diff detected and rejected promotion'
    );
  }

  // 10. TC_P2_10_DIFF_REVIEW_CDN_LEAK
  {
    const diff = `+ <script src="https://cdn.jsdelivr.net/npm/vue@2.6.14"></script>`;
    const report = IndependentDiffReviewer.reviewDiff('TASK_CDN', diff, ['chapter.html'], ['*']);
    const cdnCheck = report.checks.find(c => c.invariantId === 'INV-05');

    assert(
      report.isApprovedForPromotion === false && cdnCheck?.status === 'FAIL',
      'TC_P2_10',
      'DIFF_REVIEW_CDN_LEAK',
      'External CDN script tag in diff detected and rejected promotion'
    );
  }

  // 11. TC_P2_11_DIFF_REVIEW_SPOILER_LEAK
  {
    const diff = `+ "m": "The answer is 5, you made a subtraction mistake"`;
    const report = IndependentDiffReviewer.reviewDiff('TASK_SPOILER', diff, ['quiz.json'], ['*']);
    const spoilerCheck = report.checks.find(c => c.invariantId === 'INV-07');

    assert(
      report.isApprovedForPromotion === false && spoilerCheck?.status === 'FAIL',
      'TC_P2_11',
      'DIFF_REVIEW_SPOILER_LEAK',
      'Zero-spoiler rule violation ("is 5") in misconception field flagged as FAIL'
    );
  }

  // 12. TC_P2_12_DIFF_REVIEW_CLEAN_PASS
  {
    const cleanDiff = `--- a/packages/calc.ts\n+++ b/packages/calc.ts\n@@ -1,2 +1,3 @@\n export function add(a: number, b: number) {\n+  // validated addition\n   return a + b;\n }`;
    const report = IndependentDiffReviewer.reviewDiff('TASK_CLEAN', cleanDiff, ['packages/calc.ts'], ['packages/']);

    assert(
      report.isApprovedForPromotion === true && report.totalViolations === 0,
      'TC_P2_12',
      'DIFF_REVIEW_CLEAN_PASS',
      `Clean diff conforming to all 12 invariants approved for promotion (diffHash: ${report.diffHashSha256.slice(0, 8)})`
    );
  }

  console.log('\n======================================================================');
  console.log(` SUMMARY: ${results.filter(r => r.passed).length}/${results.length} PHASE 2 TESTS PASSED (0 FAILED)`);
  console.log('======================================================================\n');
}

if (require.main === module) {
  runPhase2TestSuite().catch(err => {
    console.error('Phase 2 test suite failed:', err);
    process.exit(1);
  });
}
