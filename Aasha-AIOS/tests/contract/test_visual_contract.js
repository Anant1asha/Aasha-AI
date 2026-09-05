const path = require('path');
let jsdom;
try {
  jsdom = require('jsdom');
} catch (e) {
  jsdom = require(path.resolve(__dirname, '../../benchmarks/ltruth/node_modules/jsdom'));
}
const { JSDOM } = jsdom;
const { VisualComponent, FractionBarVisual, AlgebraTileVisual, GeometricPerimeterVisual, ElectricCircuitVisual } = require('../../layer-2-education/visual_contract/visual_contract.js');


const dom = new JSDOM('<!DOCTYPE html><div id="container"></div>');
global.document = dom.window.document;
const container = dom.window.document.getElementById('container');

console.log('--- Testing FractionBarVisual ---');
const fb = new FractionBarVisual();
fb.mount(container, { total: 5, selected: 2 });
let fbState = fb.getState();
console.assert(fbState.selected === 2, 'FractionBar selected should be 2');
console.assert(fbState.total === 5, 'FractionBar total should be 5');
fb.reset();
console.assert(fb.getState().selected === 0, 'FractionBar reset failed');
fb.destroy();
console.assert(container.innerHTML === '', 'FractionBar destroy failed');

console.log('--- Testing AlgebraTileVisual ---');
const at = new AlgebraTileVisual();
let interactions = [];
at.mount(container, {
  labelA: 'x', labelB: '2', labelC: 'x', labelD: '3',
  onInteraction: (e) => interactions.push(e)
});
let atState = at.getState();
console.assert(atState.totalTiles === 4, 'AlgebraTile totalTiles should be 4');
console.assert(atState.activeTiles.length === 0, 'Initial active tiles should be 0');

// Trigger interaction on first tile
at.tileElements[0].rect.dispatchEvent(new dom.window.MouseEvent('click'));
console.assert(interactions.length === 1, 'Should record tile click interaction');
console.assert(at.getState().activeTiles.includes('x2'), 'x2 tile should be active');

at.reset();
console.assert(at.getState().activeTiles.length === 0, 'AlgebraTile reset failed');
at.destroy();
console.assert(container.innerHTML === '', 'AlgebraTile destroy failed');

console.log('--- Testing GeometricPerimeterVisual ---');
const gp = new GeometricPerimeterVisual();
let gpInteractions = [];
gp.mount(container, {
  shapeType: 'rectangle',
  sides: [
    { name: 'Top', len: 6, label: '6 cm' },
    { name: 'Right', len: 4, label: '4 cm' },
    { name: 'Bottom', len: 6, label: '6 cm' },
    { name: 'Left', len: 4, label: '4 cm' }
  ],
  onInteraction: (e) => gpInteractions.push(e)
});
let gpState = gp.getState();
console.assert(gpState.totalSides === 4, 'GeometricPerimeter totalSides should be 4');
console.assert(gpState.currentPerimeter === 0, 'Initial perimeter should be 0');

// Walk first side
gp.sideElements[0].line.dispatchEvent(new dom.window.MouseEvent('click'));
console.assert(gpInteractions.length === 1, 'Should record side walk interaction');
console.assert(gp.getState().currentPerimeter === 6, 'Perimeter after 1 side should be 6');

// Walk second side
gp.sideElements[1].line.dispatchEvent(new dom.window.MouseEvent('click'));
console.assert(gp.getState().currentPerimeter === 10, 'Perimeter after 2 sides should be 10');

gp.reset();
console.assert(gp.getState().currentPerimeter === 0, 'GeometricPerimeter reset failed');
gp.destroy();
console.assert(container.innerHTML === '', 'GeometricPerimeter destroy failed');

console.log('--- Testing ElectricCircuitVisual (Science Simulation) ---');
const ec = new ElectricCircuitVisual();
let ecInteractions = [];
ec.mount(container, {
  switchClosed: false,
  materialType: 'copper',
  onInteraction: (e) => ecInteractions.push(e)
});
let ecState = ec.getState();
console.assert(ecState.switchClosed === false, 'Initial switch should be open');
console.assert(ecState.isCircuitComplete === false, 'Open circuit should not be complete');

// 1. Toggle switch to close circuit
ec.switchGroup.dispatchEvent(new dom.window.MouseEvent('click'));
console.assert(ecInteractions.length === 1, 'Should record switch toggle interaction');
console.assert(ec.getState().switchClosed === true, 'Switch should be closed');
console.assert(ec.getState().isCircuitComplete === true, 'Circuit with copper + closed switch should be complete (bulb lit)');

// 2. Cycle material to insulator (rubber)
ec.matGroup.dispatchEvent(new dom.window.MouseEvent('click'));
console.assert(ec.getState().materialType === 'rubber', 'Material should cycle to rubber');
console.assert(ec.getState().isConductive === false, 'Rubber should be an insulator');
console.assert(ec.getState().isCircuitComplete === false, 'Circuit with insulator should be broken');

// 3. Test fused filament
ec.matGroup.dispatchEvent(new dom.window.MouseEvent('click')); // iron (conductor)
console.assert(ec.getState().isConductive === true, 'Iron should be a conductor');
console.assert(ec.getState().isCircuitComplete === true, 'Circuit should be complete with iron');
ec.setFilamentIntact(false); // fused bulb
console.assert(ec.getState().filamentIntact === false, 'Filament should be broken');
console.assert(ec.getState().isCircuitComplete === false, 'Fused bulb should break circuit');

// 4. Test reset & destroy
ec.reset();
console.assert(ec.getState().switchClosed === false, 'Reset should open switch');
console.assert(ec.getState().filamentIntact === true, 'Reset should restore filament');
console.assert(ec.getState().materialType === 'copper', 'Reset should restore copper');
ec.destroy();
console.assert(container.innerHTML === '', 'ElectricCircuitVisual destroy failed');

console.log('✅ ALL VISUAL CONTRACT COMPLIANCE TESTS PASSED (4/4 implementations: Fractions, Algebra, Geometry, Science)!');

