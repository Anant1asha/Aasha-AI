/**
 * AASHA Evidence Client — packages/aios/evidence_client.ts
 *
 * Records per-task evidence ledger entries per AIOS V2 Section 24/26 governance.
 *
 * PRIMARY: hatchable MCP PostgreSQL (execute_sql -> evidence_ledger table)
 * FALLBACK: server/offline_sync.db SQLite (append-only, no hatchable needed)
 *
 * HuggingFace scaling path: export via hatchable upload_file as JSONL dataset.
 *
 * Evidence ledger schema (PostgreSQL + SQLite compatible):
 *   task_id TEXT PRIMARY KEY
 *   created_at TIMESTAMP
 *   objective TEXT
 *   repository_state TEXT (JSON)
 *   plan TEXT
 *   agents_used TEXT (JSON array)
 *   harness_used TEXT
 *   tools_used TEXT (JSON array)
 *   files_changed TEXT (JSON array)
 *   tests_run TEXT (JSON array)
 *   test_results TEXT (JSON)
 *   risks TEXT
 *   decisions TEXT
 *   rollback_plan TEXT
 *   final_status TEXT CHECK(IN PLANNED,RUNNING,BLOCKED,FAILED,VERIFIED,HIL_REQUIRED,COMPLETE)
 */

import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type EvidenceStatus =
  | 'PLANNED'
  | 'RUNNING'
  | 'BLOCKED'
  | 'FAILED'
  | 'VERIFIED'
  | 'HIL_REQUIRED'
  | 'COMPLETE';

export interface EvidenceLedgerEntry {
  task_id: string;
  created_at?: string;
  objective: string;
  repository_state?: Record<string, any>;
  plan?: string;
  agents_used?: string[];
  harness_used?: string;
  tools_used?: string[];
  files_changed?: string[];
  tests_run?: string[];
  test_results?: Record<string, any>;
  risks?: string;
  decisions?: string;
  rollback_plan?: string;
  final_status: EvidenceStatus;
}

// ---------------------------------------------------------------------------
// SQLite DDL (CREATE TABLE IF NOT EXISTS — additive, safe migration)
// ---------------------------------------------------------------------------

const EVIDENCE_TABLE_DDL = `
CREATE TABLE IF NOT EXISTS evidence_ledger (
  task_id        TEXT PRIMARY KEY,
  created_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
  objective      TEXT NOT NULL,
  repository_state TEXT,
  plan           TEXT,
  agents_used    TEXT,
  harness_used   TEXT,
  tools_used     TEXT,
  files_changed  TEXT,
  tests_run      TEXT,
  test_results   TEXT,
  risks          TEXT,
  decisions      TEXT,
  rollback_plan  TEXT,
  final_status   TEXT NOT NULL DEFAULT 'PLANNED'
    CHECK(final_status IN ('PLANNED','RUNNING','BLOCKED','FAILED','VERIFIED','HIL_REQUIRED','COMPLETE'))
);
`.trim();

// ---------------------------------------------------------------------------
// PostgreSQL DDL (for hatchable execute_sql)
// ---------------------------------------------------------------------------

const EVIDENCE_TABLE_DDL_POSTGRES = `
CREATE TABLE IF NOT EXISTS evidence_ledger (
  task_id        TEXT PRIMARY KEY,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  objective      TEXT NOT NULL,
  repository_state JSONB,
  plan           TEXT,
  agents_used    JSONB,
  harness_used   TEXT,
  tools_used     JSONB,
  files_changed  JSONB,
  tests_run      JSONB,
  test_results   JSONB,
  risks          TEXT,
  decisions      TEXT,
  rollback_plan  TEXT,
  final_status   TEXT NOT NULL DEFAULT 'PLANNED'
    CHECK(final_status IN ('PLANNED','RUNNING','BLOCKED','FAILED','VERIFIED','HIL_REQUIRED','COMPLETE'))
);
CREATE INDEX IF NOT EXISTS idx_evidence_status ON evidence_ledger(final_status);
CREATE INDEX IF NOT EXISTS idx_evidence_created ON evidence_ledger(created_at);
`.trim();

// ---------------------------------------------------------------------------
// SQLite Fallback Client
// ---------------------------------------------------------------------------

const SQLITE_DB_PATH = path.join(__dirname, '../../server/offline_sync.db');

let sqliteDb: any = null;

function getSQLite(): any {
  if (sqliteDb) return sqliteDb;
  try {
    // Dynamic import for SQLite — only required if hatchable unavailable
    const sqlite3 = require('sqlite3').verbose();
    sqliteDb = new sqlite3.Database(SQLITE_DB_PATH);
    sqliteDb.serialize(() => {
      sqliteDb.run(EVIDENCE_TABLE_DDL);
    });
    return sqliteDb;
  } catch (e) {
    console.warn('[EvidenceClient] SQLite not available. Install sqlite3 in server/. Evidence will be logged to console only.');
    return null;
  }
}

function insertSQLite(entry: EvidenceLedgerEntry): Promise<void> {
  return new Promise((resolve, reject) => {
    const db = getSQLite();
    if (!db) {
      console.warn('[EvidenceClient SQLite FALLBACK]', JSON.stringify(entry, null, 2));
      resolve();
      return;
    }
    db.run(
      `INSERT OR REPLACE INTO evidence_ledger
        (task_id, objective, repository_state, plan, agents_used, harness_used,
         tools_used, files_changed, tests_run, test_results, risks, decisions,
         rollback_plan, final_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        entry.task_id,
        entry.objective,
        JSON.stringify(entry.repository_state ?? {}),
        entry.plan ?? '',
        JSON.stringify(entry.agents_used ?? []),
        entry.harness_used ?? 'antigravity',
        JSON.stringify(entry.tools_used ?? []),
        JSON.stringify(entry.files_changed ?? []),
        JSON.stringify(entry.tests_run ?? []),
        JSON.stringify(entry.test_results ?? {}),
        entry.risks ?? '',
        entry.decisions ?? '',
        entry.rollback_plan ?? '',
        entry.final_status,
      ],
      (err: Error | null) => {
        if (err) {
          console.error('[EvidenceClient] SQLite insert error:', err.message);
          reject(err);
        } else {
          resolve();
        }
      }
    );
  });
}

// ---------------------------------------------------------------------------
// Main Evidence Client
// ---------------------------------------------------------------------------

export class EvidenceClient {
  private useHatchable: boolean;

  constructor() {
    // Use hatchable if HATCHABLE_PROJECT_ID is set in env
    this.useHatchable = !!(process.env.HATCHABLE_PROJECT_ID);
  }

  /**
   * Generate a deterministic task ID from objective + timestamp.
   */
  static generateTaskId(objective: string): string {
    const ts = Date.now().toString();
    const hash = crypto
      .createHash('sha256')
      .update(objective + ts)
      .digest('hex')
      .substring(0, 12);
    return `TASK_${ts}_${hash}`.toUpperCase();
  }

  /**
   * Record an evidence ledger entry.
   * Primary: hatchable PostgreSQL (if configured)
   * Fallback: SQLite in server/offline_sync.db
   */
  async record(entry: EvidenceLedgerEntry): Promise<string> {
    if (!entry.task_id) {
      entry.task_id = EvidenceClient.generateTaskId(entry.objective);
    }
    entry.created_at = new Date().toISOString();

    if (this.useHatchable) {
      try {
        await this.recordHatchable(entry);
        console.log(`[EvidenceClient] ✅ Recorded to hatchable PostgreSQL: ${entry.task_id}`);
        return entry.task_id;
      } catch (e: any) {
        console.warn(`[EvidenceClient] hatchable unavailable (${e.message}). Falling back to SQLite.`);
      }
    }

    await insertSQLite(entry);
    console.log(`[EvidenceClient] ✅ Recorded to SQLite: ${entry.task_id}`);
    return entry.task_id;
  }

  /**
   * Record to hatchable PostgreSQL via REST API (avoids MCP tool dependency).
   * Calls POST /api/evidence on the hatchable-deployed evidence service.
   */
  private async recordHatchable(entry: EvidenceLedgerEntry): Promise<void> {
    const baseUrl = process.env.HATCHABLE_EVIDENCE_ENDPOINT;
    if (!baseUrl) {
      throw new Error('HATCHABLE_EVIDENCE_ENDPOINT not set in .env');
    }
    const res = await fetch(`${baseUrl}/api/evidence`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Hatchable evidence API returned ${res.status}: ${text}`);
    }
  }

  /**
   * Update the status of an existing evidence record.
   */
  async updateStatus(taskId: string, status: EvidenceStatus): Promise<void> {
    const db = getSQLite();
    if (!db) return;
    return new Promise((resolve, reject) => {
      db.run(
        'UPDATE evidence_ledger SET final_status = ? WHERE task_id = ?',
        [status, taskId],
        (err: Error | null) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }

  /** Return the PostgreSQL DDL for hatchable schema migration */
  static getPostgresDDL(): string {
    return EVIDENCE_TABLE_DDL_POSTGRES;
  }
}

// Singleton export
export const evidenceClient = new EvidenceClient();

// ---------------------------------------------------------------------------
// CLI: Print PostgreSQL DDL for hatchable execute_sql migration
// ---------------------------------------------------------------------------

if (process.argv.includes('--init-postgres')) {
  console.log('\n-- AASHA Evidence Ledger — PostgreSQL DDL (run via hatchable execute_sql)\n');
  console.log(EvidenceClient.getPostgresDDL());
  console.log('\n-- End DDL\n');
}

if (process.argv.includes('--test')) {
  (async () => {
    console.log('\n📋 EvidenceClient — Self-Test\n');
    const taskId = EvidenceClient.generateTaskId('test objective');
    console.log('Generated task_id:', taskId);

    try {
      const recorded = await evidenceClient.record({
        task_id: taskId,
        objective: 'AIOS v2 bootstrap test record',
        plan: 'Phase 0: git safety; Phase 1: V2 governance doc',
        harness_used: 'antigravity',
        agents_used: ['AIOS'],
        files_changed: ['Aasha-AIOS/SUPER_ADMIN_AIOS_V2.md'],
        final_status: 'COMPLETE',
      });
      console.log('✅ Recorded evidence entry:', recorded);
    } catch (e: any) {
      console.error('❌ Evidence record failed:', e.message);
    }
  })();
}
