const assert = require('assert');
const path = require('path');
let jsdom;
try {
  jsdom = require('jsdom');
} catch (e) {
  jsdom = require(path.resolve(__dirname, '../../benchmarks/ltruth/node_modules/jsdom'));
}
const { JSDOM } = jsdom;
const {
  GameLoopComponent,
  TactileMatchComponent,
  H5PSchemas,
  AnturaProgressionAdapter
} = require('../../layer-2-education/game_components.js');

console.log('--- 1. Testing GameLoopComponent (Escape Run paradigm) ---');
const loop = new GameLoopComponent({ initialSpeed: 4, acceleration: 0.1, maxSpeed: 10 });
assert.strictEqual(loop.speed, 4, 'Initial speed should be 4');
loop.tick(1.0); // 1 second elapsed
assert.ok(loop.distance > 0, 'Distance should advance on tick');
assert.ok(loop.speed > 4, 'Speed should accelerate');

console.log('--- 2. Testing TactileMatchComponent (Emma Plays paradigm) ---');
const dom = new JSDOM('<!DOCTYPE html><div id="gridContainer"></div>');
global.document = dom.window.document;
const container = dom.window.document.getElementById('gridContainer');

let completed = false;
const matchGame = new TactileMatchComponent(container, [
  { left: 'परिमाप', right: 'Perimeter' },
  { left: 'क्षेत्रफल', right: 'Area' }
], () => { completed = true; });

matchGame.render();
const keys = Object.keys(matchGame.cardElements);
assert.strictEqual(keys.length, 4, 'Should render 4 cards for 2 pairs');

// Select first pair
const card0 = matchGame.cardElements[keys[0]];
card0.dispatchEvent(new dom.window.MouseEvent('click'));
assert.strictEqual(matchGame.selected.length, 1, 'Should register 1 selected card');

console.log('--- 3. Testing AnturaProgressionAdapter (Antura paradigm) ---');
const firstAttempts = { q1: true, q2: true, q3: false, q4: true };
const retries = [{ qId: 'q3', attempt: 'foo' }];
const result = AnturaProgressionAdapter.calculateMastery(firstAttempts, retries);
assert.strictEqual(result.totalQuestions, 4, 'Total questions should be 4');
assert.strictEqual(result.firstAttemptCorrect, 3, '3 correct on first attempt');
assert.strictEqual(result.starsEarned, 2, 'Should earn 2 stars for 75% first attempt accuracy');
assert.strictEqual(result.advancementGranted, true, 'Advancement should be granted (>60%)');

console.log('--- 4. Testing H5P Schemas ---');
assert.ok(H5PSchemas.HotspotQuestion.properties.hotspots, 'Hotspot schema should define hotspots array');
assert.ok(H5PSchemas.DragSortBucket.properties.buckets, 'DragSortBucket schema should define buckets');

console.log('✅ ALL OPEN-SOURCE GAME MECHANICS COMPLIANCE TESTS PASSED (4/4)!');
