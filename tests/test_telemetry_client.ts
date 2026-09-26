/**
 * Test Suite for AashaTelemetryClient — tests/test_telemetry_client.ts
 */

import { AashaTelemetryClient, SemanticEventClass } from '../packages/v6-engine/aasha_telemetry_client';

async function runTelemetryTests() {
  console.log('\n=== Running AASHA Asynchronous Telemetry Client Test Suite ===\n');

  const artifactHash = '6e1152d8ddec91d4f6b9f7c1c23dfbd672e832a6acd525a829b9320ad3c274fe';
  const version = 1;

  const client = new AashaTelemetryClient({
    artifactHash,
    version,
    learnerPseudonymousId: 'anon_student_42'
  });

  // Test 1: Emit learning events synchronously and check immediate return
  console.log('[Test 1] Emitting semantic learning events...');
  const t0 = Date.now();
  const evt1 = client.recordEvent('SESSION_STARTED', { mode: 'offline_practice' });
  const evt2 = client.recordEvent('CONCEPT_STARTED', {}, { conceptId: 'cpt:square_roots' });
  const evt3 = client.recordEvent('ANSWER_SUBMITTED', { selectedOption: 2, isCorrect: true }, {
    conceptId: 'cpt:square_roots',
    exerciseId: 'ex:1.1.q4'
  });
  const elapsed = Date.now() - t0;

  if (elapsed > 50) {
    throw new Error(`Test 1 Failed: recordEvent took ${elapsed}ms; must be immediate (<50ms)!`);
  }
  if (evt1.artifact_hash !== artifactHash || evt1.version !== version) {
    throw new Error('Test 1 Failed: Event did not bind exact artifact_hash and version!');
  }
  if (evt3.concept_id !== 'cpt:square_roots' || evt3.exercise_id !== 'ex:1.1.q4') {
    throw new Error('Test 1 Failed: Context conceptId / exerciseId not preserved.');
  }
  console.log(`✔ Test 1 Passed: 3 semantic events emitted in ${elapsed}ms with full hash & version binding.\n`);

  // Test 2: Verify queue retention in offline mode
  console.log('[Test 2] Verifying offline queue retention...');
  const queueLen = client.getQueueLength();
  if (queueLen !== 3) {
    throw new Error(`Test 2 Failed: Expected 3 queued events, got ${queueLen}`);
  }
  console.log(`✔ Test 2 Passed: Offline queue retained ${queueLen} events without blocking runtime.\n`);

  // Test 3: Verify flush handles offline cleanly without throwing
  console.log('[Test 3] Verifying offline flush resilience...');
  const synced = await client.flushBatchAsync();
  if (synced !== 0) {
    throw new Error('Test 3 Failed: Should report 0 synced in mock offline environment.');
  }
  console.log('✔ Test 3 Passed: flushBatchAsync executed safely without throwing or blocking.\n');

  console.log('🎉 ALL AASHA TELEMETRY CLIENT TESTS PASSED (100% VERIFIED)!\n');
}

runTelemetryTests().catch(err => {
  console.error('Telemetry test failed:', err);
  process.exit(1);
});
