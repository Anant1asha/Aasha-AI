import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import {
  HandoffEnvelope,
  JobContract,
  JobLifecycleState,
  RevisionRequest,
  StateTransitionLog,
} from './contracts';

export interface OrchestrationResult {
  job: JobContract;
  certificationEligibility: 'NOT_ELIGIBLE';
  error: string;
}

const JOB_ID_PATTERN = /^job_[0-9]+_[a-f0-9]{8}$/;
const BLOCK_REASON =
  'NON_CERTIFIABLE_DEMO: This adapter contains synthetic proposals and has no executed source extraction or verification gates. Use the governed Python source pipeline; no artifact or certificate was produced.';

/**
 * Fail-closed compatibility adapter.
 *
 * Earlier revisions generated placeholder learning content and fabricated
 * benchmark certificates. This adapter now records an explicit BLOCKED state
 * and cannot produce, approve, or deploy an artifact. It remains DEMO-only
 * until a real source-backed pipeline and authenticated HIL integration exist.
 */
export class AiosOrchestrator {
  readonly executionMode = 'DEMO' as const;
  private readonly jobsDir: string;

  constructor(baseDir?: string) {
    const root = baseDir || path.resolve(__dirname, '../..');
    this.jobsDir = path.resolve(root, '.jobs');
  }

  private validateJobId(jobId: string): void {
    if (!JOB_ID_PATTERN.test(jobId)) {
      throw new Error('INVALID_JOB_ID');
    }
  }

  private transitionState(
    job: JobContract,
    toState: JobLifecycleState,
    phase: string,
    progress: number,
    reason?: string,
  ): void {
    const log: StateTransitionLog = {
      from_state: job.status,
      to_state: toState,
      timestamp_utc: new Date().toISOString(),
      triggered_by: 'AiosOrchestrator',
      reason,
    };
    job.status = toState;
    job.current_phase = phase;
    job.progress_percentage = progress;
    job.updated_at = log.timestamp_utc;
    job.state_history.push(log);
    this.persistJob(job);
  }

  public persistJob(job: JobContract): void {
    this.validateJobId(job.job_id);
    fs.mkdirSync(this.jobsDir, { recursive: true });
    fs.writeFileSync(
      path.resolve(this.jobsDir, `${job.job_id}.json`),
      JSON.stringify(job, null, 2),
      'utf-8',
    );
  }

  public getJob(jobId: string): JobContract | null {
    this.validateJobId(jobId);
    const jobFile = path.resolve(this.jobsDir, `${jobId}.json`);
    if (!fs.existsSync(jobFile)) return null;
    try {
      return JSON.parse(fs.readFileSync(jobFile, 'utf-8')) as JobContract;
    } catch {
      return null;
    }
  }

  public createJob(envelope: HandoffEnvelope, version = 1): JobContract {
    const now = new Date().toISOString();
    const job: JobContract = {
      job_id: `job_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
      version,
      status: 'CREATED',
      execution_mode: 'DEMO',
      created_at: now,
      updated_at: now,
      handoff_envelope: envelope,
      progress_percentage: 0,
      current_phase: 'Non-certifiable demo adapter; awaiting governed source pipeline',
      state_history: [{
        from_state: null,
        to_state: 'CREATED',
        timestamp_utc: now,
        triggered_by: envelope.ingress_source,
        reason: 'Job created; adapter is marked DEMO and cannot certify',
      }],
      repair_attempt_count: 0,
      max_repair_attempts: 2,
    };
    this.persistJob(job);
    return job;
  }

  public async executeJob(job: JobContract): Promise<OrchestrationResult> {
    this.transitionState(job, 'BLOCKED', 'DEMO adapter blocked before generation', 0, BLOCK_REASON);
    return {
      job,
      certificationEligibility: 'NOT_ELIGIBLE',
      error: BLOCK_REASON,
    };
  }

  /** Caller-provided reviewer text is not authentication; fail closed. */
  public approveAndDeploy(
    jobId: string,
    _reviewerId: string,
  ): { success: false; job?: JobContract; error: string } {
    const job = this.getJob(jobId);
    if (!job) return { success: false, error: 'Job not found' };
    return {
      success: false,
      job,
      error: 'HIL_AUTHENTICATION_UNAVAILABLE: no authenticated reviewer or independent approval record is configured.',
    };
  }

  public requestRevision(
    revision: RevisionRequest,
  ): { success: boolean; newJob?: JobContract; error?: string } {
    const parentJob = this.getJob(revision.original_job_id);
    if (!parentJob) return { success: false, error: 'Original job not found' };
    const newEnvelope: HandoffEnvelope = {
      ...parentJob.handoff_envelope,
      topic: `${parentJob.handoff_envelope.topic} (Rev ${parentJob.version + 1})`,
      ingress_source: 'studio_direct',
    };
    const newJob = this.createJob(newEnvelope, parentJob.version + 1);
    newJob.current_phase = `DEMO revision recorded; not executable or certifiable: ${revision.category}`;
    this.persistJob(newJob);
    return { success: true, newJob };
  }
}
