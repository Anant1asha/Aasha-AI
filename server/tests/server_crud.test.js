const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

// Require fastify app from server.js
const { fastify } = require('../server.js');

test('POST /api/sync saves student session progress', async () => {
  const payload = {
    student_id: 'test_student_01',
    chapter_id: 'ch_math_integers',
    payload: {
      score: 100,
      xp: 250,
      completed_at: new Date().toISOString()
    }
  };

  const response = await fastify.inject({
    method: 'POST',
    url: '/api/sync',
    headers: { 'content-type': 'application/json' },
    payload
  });

  assert.equal(response.statusCode, 200);
  const data = JSON.parse(response.body);
  assert.equal(data.success, true);
  assert.ok(data.recordId, 'Expected recordId from lastID');
});

test('POST /api/evidence records task in evidence ledger', async () => {
  const taskId = `task_test_${Date.now()}`;
  const payload = {
    task_id: taskId,
    objective: 'Unit test execution and ledger verification',
    plan: 'Test fastify CRUD endpoints',
    final_status: 'VERIFIED',
    harness_used: 'node:test'
  };

  const response = await fastify.inject({
    method: 'POST',
    url: '/api/evidence',
    headers: { 'content-type': 'application/json' },
    payload
  });

  assert.equal(response.statusCode, 200);
  const data = JSON.parse(response.body);
  assert.equal(data.success, true);
  assert.equal(data.task_id, taskId);

  // Verify retrieval of the specific evidence record
  const getResponse = await fastify.inject({
    method: 'GET',
    url: `/api/evidence/${taskId}`
  });
  assert.equal(getResponse.statusCode, 200);
  const getData = JSON.parse(getResponse.body);
  assert.equal(getData.success, true);
  assert.equal(getData.entry.task_id, taskId);
  assert.equal(getData.entry.final_status, 'VERIFIED');
});

test('GET /api/evidence retrieves saved evidence records', async () => {
  const response = await fastify.inject({
    method: 'GET',
    url: '/api/evidence'
  });

  assert.equal(response.statusCode, 200);
  const data = JSON.parse(response.body);
  assert.equal(data.success, true);
  assert.ok(Array.isArray(data.entries), 'Expected entries array');
  assert.ok(data.count >= 1, 'Expected at least one recorded evidence entry');
});
