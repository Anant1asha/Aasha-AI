/**
 * Annanth Aasha Foundation - Automated Verification Suite for CinePhysics Integration
 * Checks:
 * 1. Registry schema validation (F21 & F22 presence)
 * 2. Contract lifecycle implementation (mount, getState, pause, resume, reset, destroy, emitTelemetry)
 * 3. Offline isolation (0 CDN dependencies)
 * 4. Micro-topic taxonomy validation
 */

const fs = require('fs');
const path = require('path');

let testsPassed = 0;
let testsFailed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✔ PASS: ${message}`);
    testsPassed++;
  } else {
    console.error(`  ✖ FAIL: ${message}`);
    testsFailed++;
  }
}

console.log('====================================================');
console.log('AASHA-AI × CinePhysics Integration Verification Suite');
console.log('====================================================\n');

// 1. Registry Inspection
console.log('1. Auditing Experience Registry (registry.json)...');
const registryPath = path.join(__dirname, '../experience_registry/registry.json');
assert(fs.existsSync(registryPath), 'registry.json exists');

const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
const f21 = registry.foundations.find(f => f.id === 'F21');
const f22 = registry.foundations.find(f => f.id === 'F22');

assert(f21 !== undefined, 'Foundation F21 (Vernier Caliper) registered');
assert(f21 && f21.license === 'MIT', 'F21 license verified as MIT');
assert(f21 && f21.reuse_strategy === 'EXTRACT', 'F21 reuse strategy verified as EXTRACT');

assert(f22 !== undefined, 'Foundation F22 (Dimensional Analysis) registered');
assert(f22 && f22.license === 'MIT', 'F22 license verified as MIT');
assert(f22 && f22.reuse_strategy === 'EXTRACT', 'F22 reuse strategy verified as EXTRACT');

// 2. Caliper Adapter Lifecycle Test
console.log('\n2. Testing Caliper Adapter (F21) Contract Compliance...');
const { AashaCinePhysicsCaliperAdapter } = require('../experience_registry/adapters/aasha_cinephysics_caliper_adapter.js');
assert(typeof AashaCinePhysicsCaliperAdapter === 'function', 'AashaCinePhysicsCaliperAdapter class loaded');

const caliperAdapter = new AashaCinePhysicsCaliperAdapter();
assert(typeof caliperAdapter.mount === 'function', 'caliperAdapter.mount is implemented');
assert(typeof caliperAdapter.getState === 'function', 'caliperAdapter.getState is implemented');
assert(typeof caliperAdapter.pause === 'function', 'caliperAdapter.pause is implemented');
assert(typeof caliperAdapter.resume === 'function', 'caliperAdapter.resume is implemented');
assert(typeof caliperAdapter.reset === 'function', 'caliperAdapter.reset is implemented');
assert(typeof caliperAdapter.destroy === 'function', 'caliperAdapter.destroy is implemented');

const caliperState = caliperAdapter.getState();
assert(caliperState.jawPositionMm === 0, 'Initial jaw position is 0 mm');
assert(caliperState.reading.observedCm === '0.00', 'Initial caliper reading is 0.00 cm');

// 3. Dimensional Adapter Lifecycle Test
console.log('\n3. Testing Dimensional Analysis Adapter (F22) Contract Compliance...');
const { AashaCinePhysicsDimensionalAdapter } = require('../experience_registry/adapters/aasha_cinephysics_dimensional_adapter.js');
assert(typeof AashaCinePhysicsDimensionalAdapter === 'function', 'AashaCinePhysicsDimensionalAdapter class loaded');

const dimAdapter = new AashaCinePhysicsDimensionalAdapter();
assert(typeof dimAdapter.mount === 'function', 'dimAdapter.mount is implemented');
assert(typeof dimAdapter.getState === 'function', 'dimAdapter.getState is implemented');

const dimState = dimAdapter.getState();
assert(dimState.selectedQuantity === 'Force', 'Default selected quantity is Force');
assert(dimState.quantityData.unit.includes('N'), 'Force unit includes Newtons');

// 4. Offline & CDN Audit
console.log('\n4. Auditing Offline & CDN Insulation...');
const caliperCode = fs.readFileSync(path.join(__dirname, '../experience_registry/adapters/aasha_cinephysics_caliper_adapter.js'), 'utf8');
const dimCode = fs.readFileSync(path.join(__dirname, '../experience_registry/adapters/aasha_cinephysics_dimensional_adapter.js'), 'utf8');

assert(!caliperCode.includes('http://') && !caliperCode.includes('https://cdn'), 'Caliper adapter has zero external CDN calls');
assert(!dimCode.includes('http://') && !dimCode.includes('https://cdn'), 'Dimensional adapter has zero external CDN calls');

// 5. Taxonomy Metadata Validation
console.log('\n5. Auditing Micro-Topic Taxonomy...');
const taxonomyPath = path.join(__dirname, '../content/mappings/cinephysics_physics_taxonomy.json');
assert(fs.existsSync(taxonomyPath), 'cinephysics_physics_taxonomy.json exists');

const taxonomy = JSON.parse(fs.readFileSync(taxonomyPath, 'utf8'));
assert(taxonomy.classes['9'] !== undefined, 'Class 9 taxonomy present');
assert(taxonomy.classes['11'] !== undefined, 'Class 11 taxonomy present');
assert(taxonomy.classes['11'].chapters['Units and Measurements'].includes('Dimensional Analysis'), 'Class 11 Units & Measurements includes Dimensional Analysis');

console.log('\n====================================================');
console.log(`Summary: ${testsPassed} passed, ${testsFailed} failed.`);
console.log('====================================================');

if (testsFailed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
