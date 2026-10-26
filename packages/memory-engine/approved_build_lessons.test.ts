import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { computeApprovedBuildLessonManifestHash, ContextBus, validateApprovedBuildLesson } from './context_bus';
import { Memo0DualProvider } from './memo0_dual_provider';

const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519');
const artifactHash = 'a'.repeat(64);
const sourceHash = 'b'.repeat(64);
const testHash = 'c'.repeat(64);
const now = Date.now();

function signedApproval(artifactId = 'chapter-build-01', hash = artifactHash, version: string | number = '1', approvalAgeMs = 1000) {
  const issuedAt = new Date(now - approvalAgeMs);
  const payload = {
    schema_version: '1.0' as const,
    decision_id: 'decision-01',
    action: 'APPROVE' as const,
    artifact_id: artifactId,
    artifact_hash: hash,
    version,
    reviewer_id: 'reviewer-01',
    reviewer_role: 'SUPER_ADMIN' as const,
    decision: 'APPROVED' as const,
    issued_at: issuedAt.toISOString(),
    expires_at: new Date(issuedAt.getTime() + 5 * 60_000).toISOString(),
    nonce: 'nonce_0123456789abcdef',
    key_id: 'key-01',
  };
  return {
    ...payload,
    signature: crypto.sign(null, Buffer.from(JSON.stringify(payload)), privateKey).toString('base64url'),
  };
}

function lesson(overrides: Record<string, unknown> = {}, approvalAgeMs = 1000) {
  const base = {
    schema_version: '1.0',
    lesson_id: 'lesson-01',
    task_profile: {
      task_type: 'interactive-learning-module',
      goal: 'Teach exponent laws with an offline manipulative',
      capability_tags: ['exponent-laws', 'offline-simulation', 'touch-input'],
      constraints: ['offline', '44px-touch-targets'],
    },
    artifact: { artifact_id: 'chapter-build-01', sha256: artifactHash, version: '1' },
    lesson: {
      reusable_pattern: 'Reuse the tested exponent-law manipulative and adapt labels to the current source.',
      adaptation_notes: ['Keep task-specific source wording in Canonical IR.'],
      known_limits: ['Only the listed capability tags were verified.'],
    },
    source_provenance: [{ source_id: 'textbook-source-01', sha256: sourceHash }],
    test_evidence: [{ test_id: 'offline-runtime', status: 'PASS', command: 'npm run verify:offline', sha256: testHash, run_at: new Date(now - 500).toISOString() }],
    ...overrides,
  };
  const buildApproval = signedApproval('chapter-build-01', artifactHash, '1', approvalAgeMs);
  const manifest = { ...base, build_approval: buildApproval } as any;
  manifest.reviewer_decision = signedApproval(
    `approved-build-lesson:${manifest.lesson_id}`,
    computeApprovedBuildLessonManifestHash(manifest),
    manifest.schema_version,
    approvalAgeMs,
  );
  return manifest;
}

const trustedKeys = JSON.stringify({
  'key-01': { reviewer_id: 'reviewer-01', role: 'SUPER_ADMIN', public_key_pem: publicKey.export({ type: 'spki', format: 'pem' }) },
});

async function run() {
  process.env.MEMO0_OFFLINE = '1';
  process.env.NODE_ENV = 'test';
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'aasha-approved-lessons-'));
  const localDbFile = path.join(directory, 'memory.json');
  try {
    const memoryProvider = new Memo0DualProvider({ localDbFile });
    (memoryProvider as any).runBridge = () => { throw new Error('approved lesson path must remain local-only'); };
    const bus = new ContextBus(memoryProvider, undefined, trustedKeys);

    await assert.rejects(
      bus.recordApprovedBuildLesson('DesignAgent', lesson({ test_evidence: [] }) as any),
      /test evidence/i,
      'a lesson without passing test evidence must be rejected',
    );
    assert.equal(fs.existsSync(localDbFile), false, 'rejected lessons must not be persisted');

    const saved = await bus.recordApprovedBuildLesson('DesignAgent', lesson() as any);
    assert.equal(saved.category, 'approved_build_lesson');
    assert.equal(saved.metadata?.approved_build_lesson?.reviewer_decision?.decision, 'APPROVED');
    assert.equal(saved.metadata?.approved_build_lesson?.artifact?.sha256, artifactHash);
    assert.equal(saved.metadata?.approved_build_lesson?.source_provenance[0].sha256, sourceHash);

    const agedLesson = lesson({ lesson_id: 'lesson-aged' }, 20 * 60_000);
    assert.ok(validateApprovedBuildLesson(agedLesson as any, trustedKeys).length > 0, 'an expired approval cannot add a new lesson');
    assert.deepEqual(validateApprovedBuildLesson(agedLesson as any, trustedKeys, { verifyApprovalsAtIssuance: true }), [], 'an unchanged historical signed approval remains verifiable for retrieval');
    await memoryProvider.addLocalMemory({
      agentRole: 'DesignAgent',
      category: 'approved_build_lesson',
      content: agedLesson.lesson.reusable_pattern,
      metadata: { approved_build_lesson: agedLesson },
    });
    const agedSelection = await bus.selectApprovedBuildLessons('DesignAgent', {
      task_type: 'interactive-learning-module',
      goal: 'Use the verified exponent manipulative',
      capability_tags: ['exponent-laws'],
      constraints: ['offline'],
    });
    assert.ok(agedSelection.lessons.some((match) => match.lesson.metadata?.approved_build_lesson?.lesson_id === 'lesson-aged'));

    const exact = await bus.selectApprovedBuildLessons('DesignAgent', {
      task_type: 'interactive-learning-module',
      goal: 'Make an offline exponent practice module',
      capability_tags: ['exponent-laws', 'offline-simulation'],
      constraints: ['offline'],
    });
    assert.equal(exact.strategy, 'REUSE');
    assert.equal(exact.lessons.length, 2, 'both fresh and historically verified approved lessons remain available');

    const crossTaskType = await bus.selectApprovedBuildLessons('DesignAgent', {
      task_type: 'assessment-module',
      goal: 'Assess exponent laws offline',
      capability_tags: ['exponent-laws', 'offline-simulation', 'touch-input'],
      constraints: ['offline'],
    });
    assert.equal(crossTaskType.strategy, 'ADAPT', 'a different task type cannot be presented as direct reuse');

    const partial = await bus.selectApprovedBuildLessons('DesignAgent', {
      task_type: 'interactive-learning-module',
      goal: 'Make an offline geometry practice module',
      capability_tags: ['geometry-manipulative', 'offline-simulation'],
      constraints: ['offline'],
    });
    assert.equal(partial.strategy, 'ADAPT');
    assert.equal(partial.lessons.length, 2);

    const unrelated = await bus.selectApprovedBuildLessons('DesignAgent', {
      task_type: 'database-migration',
      goal: 'Migrate a database safely',
      capability_tags: ['database-migration'],
      constraints: ['zero-downtime'],
    });
    assert.equal(unrelated.strategy, 'NO_APPROVED_LESSON', 'a missing memory match must not overrule the capability registry');
    assert.equal(unrelated.lessons.length, 0, 'lessons without a shared capability must not be retrieved');

    const unverified = lesson();
    unverified.lesson.reusable_pattern = 'Tampered content must fail the signed lesson manifest.';
    await bus.getMemory().addLocalMemory({
      agentRole: 'DesignAgent',
      category: 'approved_build_lesson',
      content: 'Tampered lesson must remain unknown.',
      metadata: { approved_build_lesson: unverified },
    });
    const unknownEvidence = await bus.selectApprovedBuildLessons('DesignAgent', {
      task_type: 'database-migration',
      goal: 'Migrate a database safely',
      capability_tags: ['database-migration'],
      constraints: [],
    });
    assert.equal(unknownEvidence.strategy, 'NO_APPROVED_LESSON');
    assert.equal(unknownEvidence.evidence_status, 'UNKNOWN_EVIDENCE');
    assert.equal(unknownEvidence.lessons.length, 0, 'tampered evidence must stay unknown, never become a recalled fact');

    await bus.getMemory().addMemory({
      agentRole: 'DesignAgent',
      category: 'experience',
      content: 'Unreviewed experience that must not be presented as an approved build lesson.',
      metadata: { capability_tags: ['exponent-laws'] },
    });
    const context = await bus.buildAgentContext('DesignAgent', 'concept-1', 'exponent laws', {
      task_type: 'interactive-learning-module',
      goal: 'Teach exponent laws',
      capability_tags: ['exponent-laws'],
      constraints: ['offline'],
    });
    assert.equal(context.experienceFewShots.length, 2);
    assert.equal(context.experienceFewShots[0].category, 'approved_build_lesson');
    assert.ok(context.systemContextInjection.includes('[APPROVED REUSE;'));
    assert.ok(context.systemContextInjection.includes('Known limits:'));
    assert.ok(!context.systemContextInjection.includes('Unreviewed experience'));

    const unclassifiedContext = await bus.buildAgentContext('DesignAgent', 'concept-1', 'exponent laws');
    assert.equal(unclassifiedContext.experienceSelection.evidence_status, 'UNKNOWN_EVIDENCE');
    assert.equal(unclassifiedContext.experienceFewShots.length, 0);
    assert.ok(unclassifiedContext.systemContextInjection.includes('UNKNOWN_EVIDENCE'));
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
}

run().then(() => console.log('PASS: Approved build lessons require verified evidence, local storage, and task-relevant retrieval.'));
