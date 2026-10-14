/**
 * AASHA Ecosystem Worker Bridge.
 * 
 * Programmatically integrates the 5 microservices from
 * `Aasha-Learning-Impact-Ecosystem-v0.3-full-repo/services/`:
 *   1. assessment-worker: Dynamic node assessment
 *   2. content-pipeline: 9-stage pipeline and mandatory HIL production validation
 *   3. reporting-worker: Donor-safe impact aggregation
 *   4. sync-worker: Outbox synchronization
 *   5. api: Local event intake & impact metrics HTTP service
 */

import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ECOSYSTEM_ROOT = (typeof __dirname !== 'undefined'
  ? path.resolve(__dirname, '../../Aasha-Learning-Impact-Ecosystem-v0.3-full-repo')
  : process.cwd());

export interface ImpactReport {
  studentsReached: number;
  eventsCount: number;
  donorSafeSummary: Record<string, any>;
}

export class EcosystemWorkerBridge {
  private servicesPath: string;

  constructor() {
    this.servicesPath = path.join(ECOSYSTEM_ROOT, 'services');
  }

  /**
   * Retrieves the canonical 9 pipeline stages
   */
  public async getPipelineStages(): Promise<string[]> {
    const { pipelineStages } = await import(
      `file://${path.join(this.servicesPath, 'content-pipeline/src/stages.js').replace(/\\/g, '/')}`
    );
    return pipelineStages();
  }

  /**
   * Validates a chapter package against the canonical schema and enforces HIL approval
   */
  public async validateProductionPackage(chapter: Record<string, any>, humanApproved: boolean = false): Promise<any> {
    const { validateProductionPackage } = await import(
      `file://${path.join(this.servicesPath, 'content-pipeline/src/stages.js').replace(/\\/g, '/')}`
    );
    return validateProductionPackage(chapter, { humanApproved });
  }

  /**
   * Evaluates student interaction telemetry using assessment-worker
   */
  public async processAssessment(payload: Record<string, any>): Promise<any> {
    const { processAssessment } = await import(
      `file://${path.join(this.servicesPath, 'assessment-worker/src/index.js').replace(/\\/g, '/')}`
    );
    return processAssessment(payload);
  }

  /**
   * Aggregates telemetry events into a donor-safe impact report
   */
  public async buildReport(events: any[]): Promise<any> {
    const { buildReport } = await import(
      `file://${path.join(this.servicesPath, 'reporting-worker/src/index.js').replace(/\\/g, '/')}`
    );
    return buildReport(events);
  }

  /**
   * Replays an outbox queue using the sync-worker
   */
  public async replayOutbox(outbox: { sync: (send: any) => Promise<any> }, sendFn: (event: any) => Promise<any>): Promise<any> {
    const { replayOutbox } = await import(
      `file://${path.join(this.servicesPath, 'sync-worker/src/index.js').replace(/\\/g, '/')}`
    );
    return replayOutbox(outbox, sendFn);
  }
}

// Runtime stub export for dual-role symbols
export const EcosystemWorkerBridgeSymbol = {};
