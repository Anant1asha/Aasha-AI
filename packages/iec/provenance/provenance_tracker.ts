/**
 * AASHA AIOS — IEC Provenance Tracker
 * Path: Aasha-AI/packages/iec/provenance/provenance_tracker.ts
 *
 * Tracks provenance, licenses, and SHA-256 hashes for all external and internal capabilities.
 * Enforces cryptographic reproducibility.
 */

import * as crypto from 'crypto';
import * as fs from 'fs';

export interface ProvenanceRecord {
  resource_id: string;
  source_repository: string;
  exact_commit: string;
  license: string;
  content_sha256?: string;
  adaptation_status: 'NONE' | 'ADAPTED' | 'COMPOSED' | 'NATIVE';
  created_at: string;
}

export class ProvenanceTracker {
  /**
   * Calculates SHA-256 of file contents.
   */
  public static computeFileHash(filePath: string): string {
    if (!fs.existsSync(filePath)) {
      throw new Error(`FILE_NOT_FOUND: ${filePath}`);
    }
    const buffer = fs.readFileSync(filePath);
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  /**
   * Calculates SHA-256 of arbitrary string content.
   */
  public static computeContentHash(content: string): string {
    return crypto.createHash('sha256').update(content, 'utf8').digest('hex');
  }

  /**
   * Creates an immutable provenance record.
   */
  public static createRecord(
    resourceId: string,
    repo: string,
    commit: string,
    license: string,
    adaptationStatus: 'NONE' | 'ADAPTED' | 'COMPOSED' | 'NATIVE',
    contentSha256?: string
  ): ProvenanceRecord {
    return {
      resource_id: resourceId,
      source_repository: repo,
      exact_commit: commit,
      license,
      content_sha256: contentSha256,
      adaptation_status: adaptationStatus,
      created_at: new Date().toISOString(),
    };
  }
}
