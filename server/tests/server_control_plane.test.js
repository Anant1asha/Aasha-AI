const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');

const { fastify } = require('../server.js');

const WORK_ROOT = path.resolve(__dirname, '../../aasha-pipeline-with-master-json/work');

test('Control Plane: GET /api/jobs lists existing jobs', async () => {
  const response = await fastify.inject({
    method: 'GET',
    url: '/api/jobs'
  });

  assert.equal(response.statusCode, 200);
  const data = JSON.parse(response.body);
  assert.equal(data.success, true);
  assert.ok(Array.isArray(data.jobs));
  assert.ok(data.count >= 1, 'Expected at least one job from work/jobs directory');
});

test('Control Plane: POST /api/jobs/:id/control validates actions and writes signal', async () => {
  const testJobId = `test_job_ctrl_${Date.now()}`;
  const testWorkDir = path.join(WORK_ROOT, testJobId);
  fs.mkdirSync(testWorkDir, { recursive: true });

  // 1. Invalid action rejection
  const invalidRes = await fastify.inject({
    method: 'POST',
    url: `/api/jobs/${testJobId}/control`,
    headers: { 'content-type': 'application/json' },
    payload: { action: 'explode' }
  });
  assert.equal(invalidRes.statusCode, 400);

  // 2. Dispatch 'pause' action
  const pauseRes = await fastify.inject({
    method: 'POST',
    url: `/api/jobs/${testJobId}/control`,
    headers: { 'content-type': 'application/json' },
    payload: { action: 'pause', issuer: 'unit_test', reason: 'Testing pause' }
  });
  assert.equal(pauseRes.statusCode, 200);
  const pauseData = JSON.parse(pauseRes.body);
  assert.equal(pauseData.success, true);
  assert.equal(pauseData.action, 'pause');

  const controlFile = path.join(testWorkDir, 'control.json');
  assert.ok(fs.existsSync(controlFile));
  const writtenControl = JSON.parse(fs.readFileSync(controlFile, 'utf-8'));
  assert.equal(writtenControl.action, 'pause');
  assert.equal(writtenControl.status, 'pending');

  // 3. Dispatch 'approve_intervention'
  const approveRes = await fastify.inject({
    method: 'POST',
    url: `/api/jobs/${testJobId}/control`,
    headers: { 'content-type': 'application/json' },
    payload: { action: 'approve_intervention', issuer: 'super_admin', reason: 'Reviewed and certified' }
  });
  assert.equal(approveRes.statusCode, 200);

  const approvalFile = path.join(testWorkDir, 'intervention_approval.json');
  assert.ok(fs.existsSync(approvalFile));
  const writtenApproval = JSON.parse(fs.readFileSync(approvalFile, 'utf-8'));
  assert.equal(writtenApproval.approved, true);
  assert.equal(writtenApproval.approved_by, 'super_admin');

  // Verify evidence ledger updated
  const evidenceRes = await fastify.inject({
    method: 'GET',
    url: `/api/evidence/hil_override_${testJobId}`
  });
  assert.equal(evidenceRes.statusCode, 200);
  const evidenceData = JSON.parse(evidenceRes.body);
  assert.equal(evidenceData.entry.final_status, 'VERIFIED');

  // Cleanup test folder
  fs.rmSync(testWorkDir, { recursive: true, force: true });
});

test('Control Plane: GET /api/jobs/:id/quarantine returns packet if present', async () => {
  const testJobId = `test_job_quarantine_${Date.now()}`;
  const testWorkDir = path.join(WORK_ROOT, testJobId);
  fs.mkdirSync(testWorkDir, { recursive: true });

  // Not quarantined yet -> 404
  const res404 = await fastify.inject({
    method: 'GET',
    url: `/api/jobs/${testJobId}/quarantine`
  });
  assert.equal(res404.statusCode, 404);

  // Write quarantine packet
  const packet = {
    quarantined: true,
    role: 'QAAgent',
    violations: [{ check: 'no_spoilers', reason: 'Answer revealed in hint' }]
  };
  fs.writeFileSync(path.join(testWorkDir, 'quarantine_packet.json'), JSON.stringify(packet, null, 2), 'utf-8');

  // Now it returns 200
  const res200 = await fastify.inject({
    method: 'GET',
    url: `/api/jobs/${testJobId}/quarantine`
  });
  assert.equal(res200.statusCode, 200);
  const data = JSON.parse(res200.body);
  assert.equal(data.success, true);
  assert.equal(data.quarantine_packet.violations[0].check, 'no_spoilers');

  // Cleanup
  fs.rmSync(testWorkDir, { recursive: true, force: true });
});
