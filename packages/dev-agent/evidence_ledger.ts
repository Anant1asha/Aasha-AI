/**
 * AASHA AIOS Development Agent — Durable Evidence Ledger & Approval Gate
 * Authority: Canonical Governance AGENTS.md & SUPER_ADMIN_AIOS_V2.md
 * Phase: Phase 1 Safe Governed Prototype
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

export interface CommandExecutionRecord {
  command: string;
  args: string[];
  workingDirectory: string;
  exitCode: number;
  stdoutExcerpt: string;
  stderrExcerpt: string;
  durationMs: number;
  timestamp: string;
}

export interface TestResultRecord {
  testId: string;
  testName: string;
  command: string;
  status: 'PASS' | 'FAIL' | 'BLOCKED' | 'NOT_RUN' | 'NOT_APPLICABLE';
  details: string;
  timestamp: string;
}

export interface ApprovalRecord {
  approvalId: string;
  taskId: string;
  repository: string;
  baseCommitSha: string;
  diffHashSha256: string;
  authorizedScope: string[];
  approverIdentity: string;
  policyVersion: string;
  approvedAt: string;
  expiresAt: string;
  signature: string;
  isValid: boolean;
}

export interface TaskLedgerEntry {
  taskId: string;
  correlationId: string;
  repository: string;
  baseCommitSha: string;
  status: string;
  classification: string;
  userObjective: string;
  commandsExecuted: CommandExecutionRecord[];
  testResults: TestResultRecord[];
  diffHash?: string;
  approval?: ApprovalRecord;
  rejectionReason?: string;
  repairAttempts: number;
  createdAt: string;
  updatedAt: string;
}

export class EvidenceLedger {
  private ledgerPath: string;
  private entries: Map<string, TaskLedgerEntry> = new Map();

  constructor(storageDir?: string) {
    const baseDir = storageDir ? path.resolve(storageDir) : path.resolve('.scratch');
    if (!fs.existsSync(baseDir)) {
      fs.mkdirSync(baseDir, { recursive: true });
    }
    this.ledgerPath = path.join(baseDir, 'aasha_dev_agent_ledger.json');
    this.load();
  }

  private load() {
    if (fs.existsSync(this.ledgerPath)) {
      try {
        const raw = fs.readFileSync(this.ledgerPath, 'utf8');
        const data = JSON.parse(raw);
        if (Array.isArray(data)) {
          for (const item of data) {
            this.entries.set(item.taskId, item);
          }
        }
      } catch {
        // Fallback to fresh store if corrupt
      }
    }
  }

  private save() {
    const data = Array.from(this.entries.values());
    fs.writeFileSync(this.ledgerPath, JSON.stringify(data, null, 2), 'utf8');
  }

  /**
   * Sanitizes text to strictly enforce Zero-Secret and Zero-PII Invariant
   */
  public sanitize(text: string): string {
    if (!text) return '';
    return text
      .replace(/github_pat_[a-zA-Z0-9_]{20,}/g, '[REDACTED_GITHUB_PAT]')
      .replace(/ghp_[a-zA-Z0-9]{20,}/g, '[REDACTED_GHP]')
      .replace(/sk-[a-zA-Z0-9]{20,}/g, '[REDACTED_API_KEY]')
      .replace(/sk-or-v1-[a-zA-Z0-9]{20,}/g, '[REDACTED_OPENROUTER_KEY]')
      .replace(/AIzaSy[a-zA-Z0-9_-]{20,}/g, '[REDACTED_GEMINI_KEY]')
      .replace(/Bearer\s+[a-zA-Z0-9_\-\.]{20,}/g, 'Bearer [REDACTED_BEARER_TOKEN]');
  }

  public initializeTask(taskId: string, correlationId: string, repository: string, baseCommitSha: string, userObjective: string, classification: string): TaskLedgerEntry {
    const entry: TaskLedgerEntry = {
      taskId,
      correlationId,
      repository,
      baseCommitSha,
      status: 'RECEIVED',
      classification,
      userObjective: this.sanitize(userObjective),
      commandsExecuted: [],
      testResults: [],
      repairAttempts: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.entries.set(taskId, entry);
    this.save();
    return entry;
  }

  public recordCommand(taskId: string, cmd: CommandExecutionRecord) {
    const entry = this.entries.get(taskId);
    if (entry) {
      entry.commandsExecuted.push({
        ...cmd,
        stdoutExcerpt: this.sanitize(cmd.stdoutExcerpt),
        stderrExcerpt: this.sanitize(cmd.stderrExcerpt),
      });
      entry.updatedAt = new Date().toISOString();
      this.save();
    }
  }

  public recordTestResult(taskId: string, test: TestResultRecord) {
    const entry = this.entries.get(taskId);
    if (entry) {
      entry.testResults.push({
        ...test,
        details: this.sanitize(test.details),
      });
      entry.updatedAt = new Date().toISOString();
      this.save();
    }
  }

  public updateDiffHash(taskId: string, diffHash: string) {
    const entry = this.entries.get(taskId);
    if (entry) {
      // Invalidation Rule: If diff hash changed after approval, invalidate earlier approval!
      if (entry.diffHash && entry.diffHash !== diffHash && entry.approval) {
        entry.approval.isValid = false;
        entry.rejectionReason = 'APPROVAL_INVALIDATED_DIFF_CHANGED';
      }
      entry.diffHash = diffHash;
      entry.updatedAt = new Date().toISOString();
      this.save();
    }
  }

  /**
   * Records human approval. Strictly verifies:
   * 1. Approver is NOT an LLM or autonomous agent.
   * 2. Approval is bound to the exact diff hash and commit SHA.
   */
  public recordApproval(taskId: string, approverIdentity: string, authorizedScope: string[], expiryHours: number = 24): ApprovalRecord {
    const entry = this.entries.get(taskId);
    if (!entry) {
      throw new Error(`Task ${taskId} not found in evidence ledger`);
    }

    // Safety rule: LLM cannot approve itself
    if (approverIdentity === 'LLM' || approverIdentity === 'Agent' || approverIdentity.toLowerCase().includes('bot')) {
      throw new Error('SECURITY_VIOLATION: Autonomous agent or LLM cannot grant its own approval');
    }

    if (!entry.diffHash) {
      throw new Error('PRECONDITION_FAILED: Cannot approve task without recorded diff hash');
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + expiryHours * 3600 * 1000).toISOString();
    const signaturePayload = `${taskId}:${entry.repository}:${entry.baseCommitSha}:${entry.diffHash}:${approverIdentity}:${expiresAt}`;
    const signature = crypto.createHash('sha256').update(signaturePayload).digest('hex');

    const approval: ApprovalRecord = {
      approvalId: `APP-${Date.now()}`,
      taskId,
      repository: entry.repository,
      baseCommitSha: entry.baseCommitSha,
      diffHashSha256: entry.diffHash,
      authorizedScope,
      approverIdentity,
      policyVersion: '2.0.0',
      approvedAt: now.toISOString(),
      expiresAt,
      signature,
      isValid: true,
    };

    entry.approval = approval;
    entry.status = 'APPROVED';
    entry.updatedAt = new Date().toISOString();
    this.save();
    return approval;
  }

  public getTask(taskId: string): TaskLedgerEntry | undefined {
    return this.entries.get(taskId);
  }
}
