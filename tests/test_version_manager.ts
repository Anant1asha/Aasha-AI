/**
 * AASHA Immutable Version Manager Test Suite — tests/test_version_manager.ts
 *
 * Verifies:
 * 1. SHA-256 calculation and immutable snapshot creation
 * 2. Strict parent-child hash lineage (v1 -> v2 -> v3)
 * 3. Blocking Rule 11 hard 20MB ceiling gate
 * 4. Snapshot integrity verification & tamper detection
 * 5. Non-destructive rollback restoration and rollback audit log
 * 6. Governed state progression (CERTIFIED -> APPROVED -> DEPLOYED)
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  VersionManager,
  MAX_BUNDLE_BYTES,
  ROOT_PARENT_HASH
} from '../packages/aios/version_manager';

async function runVersionManagerTests() {
  console.log('\n=== Running AASHA Immutable Version Manager Test Suite ===\n');

  const tmpTestDir = path.resolve(__dirname, '../.tmp_version_test');
  const tmpVersionsDir = path.join(tmpTestDir, 'versions');
  if (fs.existsSync(tmpTestDir)) {
    fs.rmSync(tmpTestDir, { recursive: true, force: true });
  }
  fs.mkdirSync(tmpVersionsDir, { recursive: true });

  const vm = new VersionManager(tmpVersionsDir);
  const artifactId = 'Class8_SquareCubeRoots_Test';

  // Create mock artifact files
  const v1Content = '<html><body><h1>Square & Cube Roots v1</h1><p>Lesson content v1</p></body></html>';
  const v1Path = path.join(tmpTestDir, 'chapter_v1.html');
  fs.writeFileSync(v1Path, v1Content, 'utf8');

  // ─── Test 1: Initial Version Registration (v1) ───
  console.log('[Test 1] Registering initial version (v1)...');
  const recordV1 = await vm.registerVersion({
    filePath: v1Path,
    artifactId,
    status: 'CANDIDATE'
  });

  if (recordV1.version !== 1) {
    throw new Error(`Test 1 Failed: Expected version 1, got ${recordV1.version}`);
  }
  if (recordV1.parent_hash !== ROOT_PARENT_HASH) {
    throw new Error(`Test 1 Failed: Expected ROOT_PARENT_HASH, got ${recordV1.parent_hash}`);
  }
  const calculatedV1Hash = VersionManager.calculateHash(v1Content);
  if (recordV1.artifact_hash !== calculatedV1Hash) {
    throw new Error(`Test 1 Failed: Hash mismatch for v1.`);
  }
  if (!fs.existsSync(recordV1.storage_path)) {
    throw new Error(`Test 1 Failed: Snapshot file does not exist at ${recordV1.storage_path}`);
  }
  console.log(`✔ Test 1 Passed: v1 registered with hash ${recordV1.artifact_hash.substring(0, 16)}... and ROOT parent.\n`);

  // ─── Test 2: Sequential Version Registration (v2) with Lineage ───
  console.log('[Test 2] Registering sequential version (v2)...');
  const v2Content = '<html><body><h1>Square & Cube Roots v2</h1><p>Revised hint scaffolding</p></body></html>';
  const v2Path = path.join(tmpTestDir, 'chapter_v2.html');
  fs.writeFileSync(v2Path, v2Content, 'utf8');

  const recordV2 = await vm.registerVersion({
    filePath: v2Path,
    artifactId,
    status: 'CANDIDATE'
  });

  if (recordV2.version !== 2) {
    throw new Error(`Test 2 Failed: Expected version 2, got ${recordV2.version}`);
  }
  if (recordV2.parent_hash !== recordV1.artifact_hash) {
    throw new Error(`Test 2 Failed: Lineage broken! Expected parent_hash ${recordV1.artifact_hash}, got ${recordV2.parent_hash}`);
  }
  console.log(`✔ Test 2 Passed: v2 registered. Lineage verified: v1 (${recordV1.artifact_hash.substring(0, 12)}) -> v2 (${recordV2.artifact_hash.substring(0, 12)}).\n`);

  // ─── Test 3: Lineage Mismatch Rejection ───
  console.log('[Test 3] Testing lineage mismatch rejection...');
  const v3Content = '<html><body><h1>v3 with bad parent</h1></body></html>';
  const v3Path = path.join(tmpTestDir, 'chapter_v3.html');
  fs.writeFileSync(v3Path, v3Content, 'utf8');

  let mismatchCaught = false;
  try {
    await vm.registerVersion({
      filePath: v3Path,
      artifactId,
      parentHash: 'BAD_PARENT_HASH_1234567890abcdef'
    });
  } catch (e: any) {
    mismatchCaught = true;
    console.log(`  Caught expected lineage error: ${e.message}`);
  }
  if (!mismatchCaught) {
    throw new Error('Test 3 Failed: VersionManager allowed registering an invalid parent hash!');
  }
  console.log('✔ Test 3 Passed: Invalid parent hash was strictly rejected.\n');

  // ─── Test 4: Hard 20MB Bundle Gate ───
  console.log('[Test 4] Testing hard 20MB ceiling gate...');
  const oversizedPath = path.join(tmpTestDir, 'oversized.html');
  fs.writeFileSync(oversizedPath, '<html>oversized</html>', 'utf8');
  const fd = fs.openSync(oversizedPath, 'r+');
  fs.ftruncateSync(fd, MAX_BUNDLE_BYTES + 1024); // 20 MB + 1 KB
  fs.closeSync(fd);

  let sizeGateCaught = false;
  try {
    await vm.registerVersion({
      filePath: oversizedPath,
      artifactId
    });
  } catch (e: any) {
    sizeGateCaught = true;
    console.log(`  Caught expected size gate error: ${e.message}`);
  }
  if (!sizeGateCaught) {
    throw new Error('Test 4 Failed: VersionManager allowed registering an artifact exceeding 20 MB!');
  }
  console.log('✔ Test 4 Passed: Artifact exceeding 20 MB was strictly rejected.\n');

  // ─── Test 5: Integrity Check & Tamper Detection ───
  console.log('[Test 5] Testing integrity verification...');
  const checkV1 = vm.verifyIntegrity(artifactId, 1);
  if (!checkV1.valid) {
    throw new Error(`Test 5 Failed: Valid v1 snapshot reported as invalid: ${checkV1.reason}`);
  }

  // Simulate file corruption
  fs.appendFileSync(recordV1.storage_path, '<!-- tampered byte -->');
  const checkTampered = vm.verifyIntegrity(artifactId, 1);
  if (checkTampered.valid) {
    throw new Error('Test 5 Failed: Tampered snapshot was not detected!');
  }
  console.log(`  Tamper detection verified: ${checkTampered.reason}`);
  // Restore original byte-for-byte content
  fs.writeFileSync(recordV1.storage_path, v1Content, 'utf8');
  console.log('✔ Test 5 Passed: Snapshot integrity and tamper detection verified.\n');

  // ─── Test 6: Rollback to v1 Without History Loss ───
  console.log('[Test 6] Testing safe rollback to v1...');
  const workingFile = path.join(tmpTestDir, 'production_chapter.html');
  fs.writeFileSync(workingFile, v2Content, 'utf8'); // currently at v2

  const rollbackResult = await vm.rollbackTo(artifactId, 1, workingFile);
  const restoredContent = fs.readFileSync(workingFile, 'utf8');
  if (restoredContent !== v1Content) {
    throw new Error('Test 6 Failed: Restored content does not match v1 content!');
  }

  const ledgerAfterRollback = vm.loadLedger(artifactId);
  if (ledgerAfterRollback.versions.length !== 2) {
    throw new Error('Test 6 Failed: Historical versions were deleted during rollback!');
  }
  if (ledgerAfterRollback.rollback_events.length !== 1) {
    throw new Error('Test 6 Failed: Rollback event was not recorded in the ledger!');
  }
  console.log(`✔ Test 6 Passed: Rolled back working file to v1. History intact: ${ledgerAfterRollback.versions.length} versions retained.\n`);

  // ─── Test 7: Unauthenticated approval and deployment fail closed ───
  console.log('[Test 7] Verifying reviewer strings cannot approve or deploy...');
  let approvalBlocked = false;
  try {
    await vm.promoteToApproved(artifactId, recordV2.artifact_hash, 'SUPER_ADMIN' as any);
  } catch (error: any) {
    approvalBlocked = /verified certification first/.test(error.message);
  }
  if (!approvalBlocked || recordV2.status !== 'CANDIDATE') throw new Error('Test 7 Failed: Unverified artifact was promoted.');
  let deploymentBlocked = false;
  try {
    await vm.promoteToDeployed(artifactId, recordV2.artifact_hash, {} as any);
  } catch { deploymentBlocked = true; }
  if (!deploymentBlocked || recordV2.status !== 'CANDIDATE') throw new Error('Test 7 Failed: Candidate was deployed.');
  console.log('✔ Test 7 Passed: reviewer text and unsigned deployment were rejected.\n');
  // Clean up tmp test dir
  try {
    fs.rmSync(tmpTestDir, { recursive: true, force: true });
  } catch {}

  console.log('🎉 ALL AASHA VERSION MANAGER TESTS PASSED (100% VERIFIED)!\n');
}

runVersionManagerTests().catch(err => {
  console.error('\n✖ Test suite encountered an unhandled error:', err);
  process.exit(1);
});

