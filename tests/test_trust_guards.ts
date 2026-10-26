import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { AiosOrchestrator } from '../packages/adapters/aios_orchestrator.ts';
import { ChapterPipelineOrchestrator } from '../packages/aios/chapter_pipeline_orchestrator.ts';

function tempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'aasha-trust-guard-'));
}

function envelope() {
  return {
    document_id: 'doc-test',
    school_name: 'test',
    grade: 8,
    subject: 'Mathematics',
    topic: 'Trust Gate Test',
    pdf_meta: {
      filename: 'source.pdf',
      file_size_bytes: 1,
      pdf_sha256: 'a'.repeat(64),
    },
    ingress_timestamp: new Date(0).toISOString(),
    ingress_source: 'cli' as const,
  };
}

test('sample PDF pipeline cannot emit a successful artifact or claim certification', async () => {
  const dir = tempDir();
  const outputPath = path.join(dir, 'must-not-exist.html');
  try {
    const result = await new ChapterPipelineOrchestrator(
      path.resolve(__dirname, '..'),
    ).runPipeline({
      subject: 'Mathematics',
      grade: 8,
      topic: 'Trust Gate Test',
      pdfPath: path.join(dir, 'source.pdf'),
      outputPath,
    });

    assert.equal(result.success, false);
    assert.equal(result.certificationEligibility, 'NOT_ELIGIBLE');
    assert.ok(result.errors.length > 0 && result.errors.some((error) => error.includes('NON_CERTIFIABLE_DEMO') || error.includes('PDF not found')));
    assert.equal(fs.existsSync(outputPath), false);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('synthetic AIOS adapter cannot issue certificates or reach review state', async () => {
  const dir = tempDir();
  try {
    const orchestrator = new AiosOrchestrator(dir);
    const job = orchestrator.createJob(envelope());
    const result = await orchestrator.executeJob(job);

    assert.equal(result.certificationEligibility, 'NOT_ELIGIBLE');
    assert.equal(result.job.artifact_hash, undefined);
    assert.equal(result.job.certification_hash, undefined);
    assert.equal(result.job.status, 'BLOCKED');
    assert.match(result.error ?? '', /NON_CERTIFIABLE_DEMO/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('caller-supplied reviewer text cannot approve or deploy a job', () => {
  const dir = tempDir();
  try {
    const orchestrator = new AiosOrchestrator(dir);
    const job = orchestrator.createJob(envelope());
    job.status = 'READY_FOR_REVIEW';
    orchestrator.persistJob(job);

    const result = orchestrator.approveAndDeploy(job.job_id, 'teacher-123');

    assert.equal(result.success, false);
    assert.equal(orchestrator.getJob(job.job_id)?.status, 'READY_FOR_REVIEW');
    assert.match(result.error ?? '', /HIL_AUTHENTICATION_UNAVAILABLE/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});


