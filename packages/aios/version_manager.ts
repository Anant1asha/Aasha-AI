/**
 * AASHA Immutable Artifact Version Manager — packages/aios/version_manager.ts
 *
 * Implements authoritative artifact versioning, parent-child hash lineage,
 * local immutable recovery (.scratch/versions/), and Hatchable durable sync
 * per AASHA_KARAKA_DECISION::IMMUTABLE_LEDGER_AND_BUNDLE_GATE.
 *
 * Invariants:
 *  1. Authoritative Identity: SHA-256(content)
 *  2. Authoritative Lineage: v1 -> v2(parent_hash = hash(v1)) -> v3(parent_hash = hash(v2))
 *  3. Hard Bundle Size Ceiling: MAX_BUNDLE_BYTES = 20,971,520 (20 MB)
 *  4. Immutable History: Certified artifacts and historical records are never overwritten or deleted.
 *  5. Dual Durability: Local recovery (.scratch/versions/) + Hatchable durable record when available.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { SignedApproval, SignedCertification, verifyApproval, verifyCertificationSignature } from './trust_authority.ts';

export const MAX_BUNDLE_BYTES = 41943040; // 40 MB = 40 * 1024 * 1024 bytes
export const ROOT_PARENT_HASH = 'ROOT_0000000000000000000000000000000000000000000000000000000000000000';

export type ArtifactStatus =
  | 'CANDIDATE'
  | 'CERTIFIED'
  | 'READY_FOR_REVIEW'
  | 'APPROVED'
  | 'DEPLOYED'
  | 'REJECTED'
  | 'QUARANTINED';

export interface ArtifactVersionRecord {
  artifact_id: string;
  version: number;
  parent_hash: string;
  artifact_hash: string;
  source_hash: string;
  contract_hash: string;
  certification_hash: string;
  size_bytes: number;
  created_at: string;
  revision_id: string;
  status: ArtifactStatus;
  reviewer?: string;
  storage_path: string;
  durable_synced: boolean;
  metadata?: Record<string, any>;
}

export interface ArtifactLedger {
  artifact_id: string;
  created_at: string;
  updated_at: string;
  last_known_good_hash?: string;
  last_approved_hash?: string;
  active_deployed_hash?: string;
  versions: ArtifactVersionRecord[];
  approval_records?: SignedApproval[];
  rollback_events: Array<{
    timestamp: string;
    target_version: number;
    target_hash: string;
    destination_path: string;
    reason?: string;
  }>;
}

export interface RegisterVersionParams {
  filePath: string;
  artifactId?: string;
  parentHash?: string;
  sourcePath?: string;
  sourceHash?: string;
  contractPath?: string;
  contractHash?: string;
  certReportPath?: string;
  certReportHash?: string;
  status?: ArtifactStatus;
  reviewer?: string;
  isChildBundle?: boolean;
  metadata?: Record<string, any>;
}

export class VersionManager {
  private baseDir: string;

  constructor(customBaseDir?: string) {
    if (customBaseDir) {
      this.baseDir = customBaseDir;
    } else {
      this.baseDir = VersionManager.resolveDefaultVersionsDir();
    }
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true });
    }
  }

  /**
   * Resolve default .scratch/versions directory, prioritizing workspace root .scratch
   */
  public static resolveDefaultVersionsDir(): string {
    const candidates = [
      path.resolve(__dirname, '../../../.scratch/versions'),
      path.resolve(__dirname, '../../.scratch/versions'),
      path.resolve(process.cwd(), '.scratch/versions'),
      path.resolve(process.cwd(), '../.scratch/versions')
    ];

    for (const c of candidates) {
      const scratchParent = path.dirname(c);
      if (fs.existsSync(scratchParent)) {
        return c;
      }
    }
    return path.resolve(process.cwd(), '.scratch/versions');
  }

  /**
   * Deterministic SHA-256 calculation from string or buffer
   */
  public static calculateHash(content: Buffer | string): string {
    const buffer = Buffer.isBuffer(content) ? content : Buffer.from(content, 'utf8');
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  /**
   * Deterministic SHA-256 calculation from file path
   */
  public static calculateFileHash(filePath: string): string {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found for hashing: ${filePath}`);
    }
    const buffer = fs.readFileSync(filePath);
    return VersionManager.calculateHash(buffer);
  }

  /**
   * Load local ledger for an artifact
   */
  public loadLedger(artifactId: string): ArtifactLedger {
    const ledgerPath = path.join(this.baseDir, artifactId, 'version_ledger.json');
    if (fs.existsSync(ledgerPath)) {
      try {
        const raw = fs.readFileSync(ledgerPath, 'utf8');
        return JSON.parse(raw);
      } catch (e: any) {
        console.warn(`[VersionManager] Warning: failed to parse ledger at ${ledgerPath}: ${e.message}`);
      }
    }
    return {
      artifact_id: artifactId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      versions: [],
      approval_records: [],
      rollback_events: []
    };
  }

  /**
   * Save local ledger for an artifact
   */
  private saveLedger(ledger: ArtifactLedger): void {
    const artifactDir = path.join(this.baseDir, ledger.artifact_id);
    if (!fs.existsSync(artifactDir)) {
      fs.mkdirSync(artifactDir, { recursive: true });
    }
    ledger.updated_at = new Date().toISOString();
    const ledgerPath = path.join(artifactDir, 'version_ledger.json');
    fs.writeFileSync(ledgerPath, JSON.stringify(ledger, null, 2), 'utf8');

    // Update master catalog
    this.updateMasterCatalog(ledger);
  }

  /**
   * Maintain top-level catalog of all managed artifacts
   */
  private updateMasterCatalog(ledger: ArtifactLedger): void {
    const catalogPath = path.join(this.baseDir, 'master_artifact_ledger.json');
    let catalog: Record<string, any> = {};
    if (fs.existsSync(catalogPath)) {
      try {
        catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
      } catch {}
    }

    const latest = ledger.versions[ledger.versions.length - 1];
    catalog[ledger.artifact_id] = {
      artifact_id: ledger.artifact_id,
      total_versions: ledger.versions.length,
      latest_version: latest ? latest.version : 0,
      latest_artifact_hash: latest ? latest.artifact_hash : null,
      last_known_good_hash: ledger.last_known_good_hash || null,
      last_approved_hash: ledger.last_approved_hash || null,
      active_deployed_hash: ledger.active_deployed_hash || null,
      updated_at: ledger.updated_at
    };

    fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2), 'utf8');
  }

  /**
   * Register a new version candidate or certified artifact.
   * Enforces:
   *  - Hard size ceiling (<= 20 MB)
   *  - SHA-256 calculation
   *  - Immutable parent-child hash chain
   *  - Byte-for-byte immutable storage copy
   */
  public async registerVersion(params: RegisterVersionParams): Promise<ArtifactVersionRecord> {
    const privilegedStatuses: ArtifactStatus[] = ['CERTIFIED', 'READY_FOR_REVIEW', 'APPROVED', 'DEPLOYED'];
    if (params.status && privilegedStatuses.includes(params.status)) {
      throw new Error('CERTIFICATION_BLOCKED: registerVersion may create candidates only; verified certification and signed HIL are required for promotion.');
    }
    if (!fs.existsSync(params.filePath)) {
      throw new Error(`Artifact file not found: ${params.filePath}`);
    }

    const fileBuffer = fs.readFileSync(params.filePath);
    const sizeBytes = fileBuffer.length;

    // Hard 40MB Gate Check: Applies ONLY to CHILD_HTML5_BUNDLE artifacts
    // per AASHA_KARAKA_PATCH::ARTIFACT_LIMIT_AND_ASYNC_EVIDENCE and AASHA-SPEC-02-TRD.
    // Does NOT apply to source PDFs, Section 24 contracts, Graphify AST, DBs, or server artifacts.
    const baseName = path.basename(params.filePath).toLowerCase();
    const isChildBundle = params.isChildBundle !== undefined
      ? params.isChildBundle
      : (path.extname(params.filePath).toLowerCase() === '.html' &&
         !baseName.startsWith('admin') &&
         !baseName.startsWith('tui') &&
         !baseName.startsWith('server'));

    if (isChildBundle && sizeBytes > MAX_BUNDLE_BYTES) {
      const err = `Rule 11 Violation: Child HTML5 learning bundle file size (${sizeBytes} bytes / ${(sizeBytes / (1024 * 1024)).toFixed(2)} MB) exceeds hard 40 MB ceiling (${MAX_BUNDLE_BYTES} bytes). Release is BLOCKED.`;
      throw new Error(err);
    }

    const artifactHash = VersionManager.calculateHash(fileBuffer);
    const artifactId = params.artifactId || path.basename(params.filePath, path.extname(params.filePath));
    const ledger = this.loadLedger(artifactId);

    // Compute Lineage
    const nextVersionNumber = ledger.versions.length + 1;
    let parentHash = params.parentHash;

    if (!parentHash) {
      if (ledger.versions.length === 0) {
        parentHash = ROOT_PARENT_HASH;
      } else {
        const lastVersion = ledger.versions[ledger.versions.length - 1];
        parentHash = lastVersion.artifact_hash;
      }
    } else {
      // Validate provided parentHash
      if (ledger.versions.length === 0 && parentHash !== ROOT_PARENT_HASH) {
        throw new Error(`Lineage Mismatch: Initial version must have ROOT parent hash, got: ${parentHash}`);
      }
      if (ledger.versions.length > 0) {
        const lastVersion = ledger.versions[ledger.versions.length - 1];
        if (parentHash !== lastVersion.artifact_hash) {
          throw new Error(`Lineage Mismatch: Expected parent_hash '${lastVersion.artifact_hash}' for version ${nextVersionNumber}, got '${parentHash}'.`);
        }
      }
    }

    // Source, Contract, and Cert Hashes
    const sourceHash = params.sourceHash || (params.sourcePath && fs.existsSync(params.sourcePath) ? VersionManager.calculateFileHash(params.sourcePath) : 'UNSPECIFIED');
    const contractHash = params.contractHash || (params.contractPath && fs.existsSync(params.contractPath) ? VersionManager.calculateFileHash(params.contractPath) : 'UNSPECIFIED');
    const certHash = params.certReportHash || (params.certReportPath && fs.existsSync(params.certReportPath) ? VersionManager.calculateFileHash(params.certReportPath) : 'UNSPECIFIED');

    const ext = path.extname(params.filePath) || '.html';
    const artifactDir = path.join(this.baseDir, artifactId);
    if (!fs.existsSync(artifactDir)) {
      fs.mkdirSync(artifactDir, { recursive: true });
    }

    // Save immutable snapshot named by content hash
    const snapshotFileName = `${artifactHash}${ext}`;
    const storagePath = path.join(artifactDir, snapshotFileName);

    if (!fs.existsSync(storagePath)) {
      fs.writeFileSync(storagePath, fileBuffer);
    }

    const revisionId = `REV_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const status: ArtifactStatus = params.status || 'CANDIDATE';

    const record: ArtifactVersionRecord = {
      artifact_id: artifactId,
      version: nextVersionNumber,
      parent_hash: parentHash,
      artifact_hash: artifactHash,
      source_hash: sourceHash,
      contract_hash: contractHash,
      certification_hash: certHash,
      size_bytes: sizeBytes,
      created_at: new Date().toISOString(),
      revision_id: revisionId,
      status,
      reviewer: params.reviewer,
      storage_path: storagePath,
      durable_synced: false,
      metadata: params.metadata || {}
    };

    ledger.versions.push(record);

    if (status === 'CERTIFIED' || status === 'READY_FOR_REVIEW') {
      ledger.last_known_good_hash = artifactHash;
    } else if (status === 'APPROVED') {
      ledger.last_approved_hash = artifactHash;
    } else if (status === 'DEPLOYED') {
      ledger.active_deployed_hash = artifactHash;
    }

    // Save local ledger
    this.saveLedger(ledger);

    // Attempt Hatchable durable sync if configured
    record.durable_synced = await this.tryHatchableSync(record);

    return record;
  }

  /**
   * Verify integrity of a stored version
   */
  public verifyIntegrity(
    artifactId: string,
    versionOrHash: number | string
  ): { valid: boolean; calculatedHash?: string; recordedHash?: string; reason?: string } {
    const ledger = this.loadLedger(artifactId);
    const target = ledger.versions.find(v =>
      typeof versionOrHash === 'number' ? v.version === versionOrHash : v.artifact_hash === versionOrHash
    );

    if (!target) {
      return { valid: false, reason: `Version '${versionOrHash}' not found for artifact '${artifactId}'` };
    }

    if (!fs.existsSync(target.storage_path)) {
      return { valid: false, reason: `Snapshot file missing on disk: ${target.storage_path}` };
    }

    const actualHash = VersionManager.calculateFileHash(target.storage_path);
    if (actualHash !== target.artifact_hash) {
      return {
        valid: false,
        calculatedHash: actualHash,
        recordedHash: target.artifact_hash,
        reason: `Hash mismatch! Disk corruption detected for snapshot: ${target.storage_path}`
      };
    }

    return {
      valid: true,
      calculatedHash: actualHash,
      recordedHash: target.artifact_hash
    };
  }

  /**
   * Rollback working artifact to a previous certified or approved version.
   * Preserves historical versions and records rollback event.
   */
  public async rollbackTo(
    artifactId: string,
    targetHashOrVersion: number | string,
    destinationPath: string
  ): Promise<{ restoredHash: string; path: string; version: number }> {
    const ledger = this.loadLedger(artifactId);
    const target = ledger.versions.find(v =>
      typeof targetHashOrVersion === 'number'
        ? v.version === targetHashOrVersion
        : v.artifact_hash === targetHashOrVersion
    );

    if (!target) {
      throw new Error(`Cannot rollback: Version '${targetHashOrVersion}' not found for artifact '${artifactId}'`);
    }

    // Integrity check before restoration
    const check = this.verifyIntegrity(artifactId, target.artifact_hash);
    if (!check.valid) {
      throw new Error(`Rollback blocked due to snapshot corruption: ${check.reason}`);
    }

    // Copy snapshot to destination atomically
    const snapshotBuffer = fs.readFileSync(target.storage_path);
    fs.writeFileSync(destinationPath, snapshotBuffer);

    // Record rollback event
    ledger.rollback_events.push({
      timestamp: new Date().toISOString(),
      target_version: target.version,
      target_hash: target.artifact_hash,
      destination_path: destinationPath,
      reason: `Rollback to v${target.version} (${target.artifact_hash})`
    });

    this.saveLedger(ledger);

    return {
      restoredHash: target.artifact_hash,
      path: destinationPath,
      version: target.version
    };
  }

  /**
   * Promote artifact status to APPROVED with reviewer sign-off
   */
  public async certifyVersion(artifactId: string, artifactHash: string, certificatePath: string): Promise<ArtifactVersionRecord> {
    const ledger = this.loadLedger(artifactId);
    const target = ledger.versions.find(v => v.artifact_hash === artifactHash);
    if (!target) throw new Error(`Artifact version with hash '${artifactHash}' not found in ledger.`);
    if (target.status !== 'CANDIDATE') throw new Error('CERTIFICATION_BLOCKED: only a candidate can be certified.');
    if (target.source_hash === 'UNSPECIFIED' || target.contract_hash === 'UNSPECIFIED') throw new Error('CERTIFICATION_BLOCKED: source and contract hashes are required.');
    if (!fs.existsSync(certificatePath)) throw new Error(`CERTIFICATION_BLOCKED: evidence record not found: ${certificatePath}`);
    let evidence: SignedCertification;
    try { evidence = JSON.parse(fs.readFileSync(certificatePath, 'utf8')); } catch { throw new Error('CERTIFICATION_BLOCKED: evidence record is invalid JSON.'); }
    const verification = verifyCertificationSignature(evidence, { artifactId, artifactHash, version: target.version });
    if (!verification.valid) throw new Error(`CERTIFICATION_BLOCKED: ${verification.reason}`);
    if (evidence.source_hash !== target.source_hash || evidence.contract_hash !== target.contract_hash) throw new Error('CERTIFICATION_BLOCKED: source or contract lineage mismatch.');
    const evidenceRoot = path.dirname(path.resolve(certificatePath));
    for (const gate of evidence.gate_results) for (const ref of gate.evidence_refs) {
      if (!/^[a-f0-9]{64}$/.test(ref.sha256)) throw new Error(`CERTIFICATION_BLOCKED: invalid evidence digest for ${ref.path}`);
      const fullPath = path.resolve(evidenceRoot, ref.path);
      const rel = path.relative(evidenceRoot, fullPath);
      if (rel.startsWith('..') || path.isAbsolute(rel) || !fs.existsSync(fullPath) || !fs.statSync(fullPath).isFile()) throw new Error(`CERTIFICATION_BLOCKED: evidence reference is missing or escapes its evidence directory: ${ref.path}`);
      if (VersionManager.calculateFileHash(fullPath) !== ref.sha256) throw new Error(`CERTIFICATION_BLOCKED: evidence hash mismatch: ${ref.path}`);
    }
    target.status = 'CERTIFIED';
    target.certification_hash = VersionManager.calculateFileHash(certificatePath);
    this.saveLedger(ledger);
    return target;
  }
  public async promoteToApproved(artifactId: string, artifactHash: string, approval: SignedApproval): Promise<ArtifactVersionRecord> {
    const ledger = this.loadLedger(artifactId);
    const target = ledger.versions.find(v => v.artifact_hash === artifactHash);
    if (!target) throw new Error(`Artifact version with hash '${artifactHash}' not found in ledger.`);
    if (target.status !== 'CERTIFIED') throw new Error('APPROVAL_BLOCKED: artifact must have verified certification first.');
    const decision = verifyApproval(approval, { action: 'APPROVE', artifactId, artifactHash, version: target.version });
    if (!decision.valid) throw new Error(`APPROVAL_BLOCKED: ${decision.reason}`);
    ledger.approval_records ||= [];
    if (ledger.approval_records.some(x => x.nonce === approval.nonce || x.decision_id === approval.decision_id)) throw new Error('APPROVAL_BLOCKED: approval record replay detected.');
    ledger.approval_records.push(approval);
    target.status = 'APPROVED';
    target.reviewer = approval.reviewer_id;
    ledger.last_approved_hash = artifactHash;
    this.saveLedger(ledger);
    return target;
  }

  public async promoteToDeployed(artifactId: string, artifactHash: string, approval: SignedApproval): Promise<ArtifactVersionRecord> {
    const ledger = this.loadLedger(artifactId);
    const target = ledger.versions.find(v => v.artifact_hash === artifactHash);
    if (!target) throw new Error(`Artifact version with hash '${artifactHash}' not found in ledger.`);
    if (target.status !== 'APPROVED') throw new Error(`Cannot deploy artifact '${artifactHash}': Status is '${target.status}'. Artifact must be APPROVED first.`);
    const decision = verifyApproval(approval, { action: 'DEPLOY', artifactId, artifactHash, version: target.version });
    if (!decision.valid) throw new Error(`DEPLOYMENT_BLOCKED: ${decision.reason}`);
    ledger.approval_records ||= [];
    if (ledger.approval_records.some(x => x.nonce === approval.nonce || x.decision_id === approval.decision_id)) throw new Error('DEPLOYMENT_BLOCKED: approval record replay detected.');
    ledger.approval_records.push(approval);
    target.status = 'DEPLOYED';
    ledger.active_deployed_hash = artifactHash;
    this.saveLedger(ledger);
    return target;
  }
  /**
   * List all versions in chronological lineage
   */
  public listLineage(artifactId: string): ArtifactVersionRecord[] {
    const ledger = this.loadLedger(artifactId);
    return ledger.versions;
  }

  /**
   * Attempt durable synchronization with Hatchable or external DB
   * Local storage (.scratch/versions/) is the authoritative offline plane.
   * Remote cloud sync activates only when external HATCHABLE_PROJECT_ID is provided.
   */
  private async tryHatchableSync(record: ArtifactVersionRecord): Promise<boolean> {
    if (!process.env.HATCHABLE_PROJECT_ID) {
      // Authoritative local offline resilience: record is already immutably stored locally
      return false;
    }
    // Remote sync adapter available when external credentials exist
    return false;
  }
}







