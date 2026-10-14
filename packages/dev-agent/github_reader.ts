/**
 * AASHA AIOS Development Agent — Read-Only GitHub & Git Inspection Adapter
 * Authority: Canonical Governance AGENTS.md & SUPER_ADMIN_AIOS_V2.md
 * Phase: Phase 1 Safe Governed Prototype
 */

import { execSync } from 'child_process';

export interface GitCommitInfo {
  sha: string;
  author: string;
  date: string;
  subject: string;
}

export interface GitDiffSummary {
  filesChanged: number;
  insertions: number;
  deletions: number;
  rawDiffSnippet: string;
  diffHashSha256: string;
}

export class GitHubReader {
  private repoRoot: string;

  constructor(repoRoot: string) {
    this.repoRoot = repoRoot;
  }

  public getHeadCommit(): GitCommitInfo {
    try {
      const output = execSync('git log -1 --format="%H|%an|%ad|%s"', { cwd: this.repoRoot, encoding: 'utf8' }).trim();
      const [sha, author, date, subject] = output.split('|');
      return { sha, author, date, subject };
    } catch (err: any) {
      throw new Error(`Failed to read git commit: ${err.message}`);
    }
  }

  public getRecentCommits(limit: number = 5): GitCommitInfo[] {
    try {
      const output = execSync(`git log -n ${limit} --format="%H|%an|%ad|%s"`, { cwd: this.repoRoot, encoding: 'utf8' }).trim();
      const lines = output.split('\n').filter(Boolean);
      return lines.map(line => {
        const [sha, author, date, subject] = line.split('|');
        return { sha, author, date, subject };
      });
    } catch {
      return [];
    }
  }

  public inspectDiff(targetBranchOrCommit: string = 'HEAD'): GitDiffSummary {
    try {
      const statOutput = execSync(`git diff --shortstat ${targetBranchOrCommit}`, { cwd: this.repoRoot, encoding: 'utf8' }).trim();
      const rawDiff = execSync(`git diff ${targetBranchOrCommit}`, { cwd: this.repoRoot, encoding: 'utf8', maxBuffer: 1024 * 1024 });

      // Compute cryptographic SHA-256 hash of the exact diff
      const crypto = require('crypto');
      const diffHashSha256 = crypto.createHash('sha256').update(rawDiff).digest('hex');

      let filesChanged = 0;
      let insertions = 0;
      let deletions = 0;

      const filesMatch = /(\d+)\s+files? changed/.exec(statOutput);
      const insMatch = /(\d+)\s+insertions?/.exec(statOutput);
      const delMatch = /(\d+)\s+deletions?/.exec(statOutput);

      if (filesMatch) filesChanged = parseInt(filesMatch[1], 10);
      if (insMatch) insertions = parseInt(insMatch[1], 10);
      if (delMatch) deletions = parseInt(delMatch[1], 10);

      return {
        filesChanged,
        insertions,
        deletions,
        rawDiffSnippet: rawDiff.slice(0, 500),
        diffHashSha256,
      };
    } catch {
      return {
        filesChanged: 0,
        insertions: 0,
        deletions: 0,
        rawDiffSnippet: '',
        diffHashSha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', // empty hash
      };
    }
  }
}
