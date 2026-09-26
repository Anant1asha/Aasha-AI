import { capabilityBroker } from '../packages/aios/capability_broker.js';
import * as assert from 'assert';

console.log('🧪 Running Capability Broker & Resource Matcher Test Suite...\n');

// Test 1: Task Routing
console.log('Test 1: Task routing logic...');
const dbDecision = capabilityBroker.route({
  taskType: 'write_event',
  capability: 'POSTGRESQL_DATABASE',
  complexity: 'LOW',
  risk: 'LOW'
});
assert.strictEqual(dbDecision.harness, 'hatchable');
assert.strictEqual(dbDecision.modelTier, 1);
console.log('  ✅ PostgreSQL routed to hatchable (Tier 1)');

const criticalDecision = capabilityBroker.route({
  taskType: 'production_deployment',
  capability: 'DEPLOYMENT',
  complexity: 'HIGH',
  risk: 'CRITICAL'
});
assert.strictEqual(criticalDecision.hilRequired, true);
console.log('  ✅ Critical deployment enforces HIL approval');

// Test 2: Resource Matcher — Rational Numbers (Class 8 Math)
console.log('\nTest 2: Resource Matcher (Class 8 Mathematics)...');
const mathMatches = capabilityBroker.matchResource({
  requiredCapability: 'concept_simulations',
  subject: 'Mathematics',
  grade: 8,
  interactionType: 'parameter_sliders',
  offlineRequirement: true
});

assert.ok(mathMatches.length > 0, 'Should find matching foundation candidates');
console.log(`  Found ${mathMatches.length} foundation candidates:`);
for (const match of mathMatches.slice(0, 3)) {
  console.log(`    - [${match.resource_id}] ${match.name} | Score: ${match.score} | Compatibility: ${match.compatibility}`);
}
assert.ok(mathMatches[0].score > 50, 'Top candidate should have strong compatibility score');
assert.ok(mathMatches[0].offline_support, 'Candidate should support offline execution');
console.log('  ✅ Resource matching verified against experience registry');

// Test 3: Local Vocabulary Lookup (Zero Cost)
console.log('\nTest 3: Local Vocabulary Lookup (Zero Cost Substrate)...');
const testTerms = ['rational', 'number', 'numerator', 'denominator', 'addition', 'nonexistent_test_term_xyz'];
const vocabResult = capabilityBroker.lookupVocabulary(testTerms);

console.log(`  Requested: ${vocabResult.totalRequested}, Found: ${Object.keys(vocabResult.found).length}, Missing: ${vocabResult.missing.length}`);
console.log(`  Coverage: ${vocabResult.coveragePercentage}%`);
for (const [word, def] of Object.entries(vocabResult.found)) {
  console.log(`    - "${word}": ${def}`);
}
assert.ok(vocabResult.found['rational'] || vocabResult.found['number'] || vocabResult.found['addition'], 'Should find common math terms');
assert.ok(vocabResult.missing.includes('nonexistent_test_term_xyz'), 'Should identify missing terms');
console.log('  ✅ Local dictionary lookup verified with zero API tokens consumed');

console.log('\n🎉 ALL CAPABILITY BROKER & LOCAL ASSET TESTS PASSED (100%)\n');
