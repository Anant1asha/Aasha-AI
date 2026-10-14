import { test } from 'node:test';
import * as assert from 'node:assert';
import { EcosystemWorkerBridge } from '../packages/adapters/ecosystem_worker_bridge';
import { AiosPipelineBridge } from '../Aasha-AIOS/layer-3-product/pipeline/pipeline_bridge';

test('EcosystemWorkerBridge loads pipeline stages from content-pipeline', async () => {
  const bridge = new EcosystemWorkerBridge();
  const stages = await bridge.getPipelineStages();
  assert.ok(Array.isArray(stages), 'stages must be an array');
  assert.strictEqual(stages.length, 9, 'must contain exactly 9 stages');
  assert.strictEqual(stages[0], 'source_intake');
  assert.strictEqual(stages[7], 'human_validation');
  assert.strictEqual(stages[8], 'production_package');
});

test('EcosystemWorkerBridge enforces human approval before production', async () => {
  const bridge = new EcosystemWorkerBridge();
  const mockChapter = {
    id: 'test_ch_1',
    title: 'Exponents Intro',
    grade: 8,
    subject: 'math',
    nodes: [
      { id: 'node_1', title: 'Base and Power', objective: 'Understand exponents' }
    ],
    questions: [
      { id: 'q_1', nodeId: 'node_1', prompt: 'What is 2^2?', options: ['2', '4'], answerIndex: 1 }
    ]
  };

  await assert.rejects(
    async () => {
      await bridge.validateProductionPackage(mockChapter, false);
    },
    /content requires human validation before production/
  );

  const approved = await bridge.validateProductionPackage(mockChapter, true);
  assert.strictEqual(approved.publicationState, 'production');
});

test('AiosPipelineBridge instantiates and connects to V6 compiler', () => {
  const aiosBridge = new AiosPipelineBridge();
  assert.ok(aiosBridge, 'AiosPipelineBridge must instantiate');
  assert.strictEqual(typeof aiosBridge.assembleIR, 'function');
  assert.strictEqual(typeof aiosBridge.compileIR, 'function');
  assert.strictEqual(typeof aiosBridge.executePipeline, 'function');
});
