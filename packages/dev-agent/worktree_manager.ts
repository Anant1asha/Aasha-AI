/**
 * AASHA AIOS Development Agent — Isolated Git Worktree Manager
 * Authority: Canonical Governance AGENTS.md & SUPER_ADMIN_AIOS_V2.md
 * Phase: Phase 2 Bounded Implementation and Verification
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

export interface WorktreeSession {
  taskId: string;
  branchName: string;
  worktreePath: string;
  baseCommitSha: string;
  createdAt: string;
  isClean: boolean;
  status: 'ACTIVE' | 'QUARANTINED' | 'REMOVED';
}

export class IsolatedWorktreeManager {
  private repoRoot: string;
  private worktreesBaseDir: string;

  constructor(repoRoot: string) {
    this.repoRoot = path.resolve(repoRoot);
    this.worktreesBaseDir = path.join(this.repoRoot, '.worktrees');
    if (!fs.existsSync(this.worktreesBaseDir)) {
      fs.mkdirSync(this.worktreesBaseDir, { recursive: true });
    }
  }

  /**
   * Verifies whether the primary repository checkout has uncommitted modifications.
   */
  public isPrimaryTreeClean(): boolean {
    try {
      const status = execSync('git status --porcelain', { cwd: this.repoRoot, encoding: 'utf8' }).trim();
      return status.length === 0;
    } catch {
      return false;
    }
  }

  /**
   * Initializes a dedicated, isolated Git worktree for an authorized implementation task.
   * Safety invariant: Never creates a worktree if primary working tree has conflicts or uncommitted changes,
   * unless explicitly permitted by human supervisor.
   */
  public createWorktree(taskId: string, targetCommitSha?: string, allowDirtyPrimary: boolean = false): WorktreeSession {
    if (!allowDirtyPrimary && !this.isPrimaryTreeClean()) {
      throw new Error(`SECURITY_BLOCK: Primary working tree is dirty. Refusing to initialize worktree for task ${taskId} to prevent overwriting user changes.`);
    }

    const safeTaskId = taskId.replace(/[^a-zA-Z0-9_\-]/g, '_');
    const branchName = `dev-agent/${safeTaskId}-${Date.now()}`;
    const worktreePath = path.join(this.worktreesBaseDir, safeTaskId);

    // If worktree already exists, clean up or abort
    if (fs.existsSync(worktreePath)) {
      try {
        execSync(`git worktree remove --force "${worktreePath}"`, { cwd: this.repoRoot, stdio: 'ignore' });
      } catch {
        fs.rmSync(worktreePath, { recursive: true, force: true });
      }
    }

    const baseSha = targetCommitSha || execSync('git rev-parse HEAD', { cwd: this.repoRoot, encoding: 'utf8' }).trim();

    try {
      execSync(`git worktree add -b "${branchName}" "${worktreePath}" ${baseSha}`, {
        cwd: this.repoRoot,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      return {
        taskId,
        branchName,
        worktreePath,
        baseCommitSha: baseSha,
        createdAt: new Date().toISOString(),
        isClean: true,
        status: 'ACTIVE',
      };
    } catch (err: any) {
      throw new Error(`Failed to create isolated worktree at ${worktreePath}: ${err.message}`);
    }
  }

  /**
   * Quarantines a failed worktree for evidence preservation.
   */
  public quarantineWorktree(session: WorktreeSession, reason: string): WorktreeSession {
    const quarantineDir = path.join(this.worktreesBaseDir, 'quarantine');
    if (!fs.existsSync(quarantineDir)) {
      fs.mkdirSync(quarantineDir, { recursive: true });
    }

    const quarantineRecord = path.join(session.worktreePath, 'QUARANTINE_REASON.txt');
    fs.writeFileSync(quarantineRecord, `Quarantined at: ${new Date().toISOString()}\nReason: ${reason}\nBase SHA: ${session.baseCommitSha}\n`, 'utf8');

    session.status = 'QUARANTINED';
    return session;
  }

  /**
   * Safely cleans up an approved or completed worktree.
   */
  public removeWorktree(session: WorktreeSession, force: boolean = false) {
    if (session.status === 'QUARANTINED' && !force) {
      throw new Error(`Cannot remove quarantined worktree for task ${session.taskId} without explicit human force override.`);
    }

    try {
      execSync(`git worktree remove --force "${session.worktreePath}"`, { cwd: this.repoRoot, stdio: 'ignore' });
      // Delete branch
      execSync(`git branch -D "${session.branchName}"`, { cwd: this.repoRoot, stdio: 'ignore' });
      session.status = 'REMOVED';
    } catch (err: any) {
      // Fallback direct cleanup
      if (fs.existsSync(session.worktreePath)) {
        fs.rmSync(session.worktreePath, { recursive: true, force: true });
      }
      session.status = 'REMOVED';
    }
  }
}
