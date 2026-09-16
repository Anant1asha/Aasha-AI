const fs = require('fs');
const path = require('path');
const vm = require('vm');

const htmlPath = path.join(__dirname, '..', 'chapters', 'RationalNumbers_Class8_AD_Gamified_v5_Enhanced_v6.html');
const content = fs.readFileSync(htmlPath, 'utf8');

const startIdx = content.indexOf('class AashaExperienceContract');
const endIdx = content.indexOf('class AashaSimElement');
const contractCode = content.slice(startIdx, endIdx);

const sandbox = {
  console,
  CustomEvent: class CustomEvent {
    constructor(type, eventInitDict) {
      this.type = type;
      this.detail = eventInitDict ? eventInitDict.detail : null;
      this.bubbles = eventInitDict ? eventInitDict.bubbles : false;
      this.composed = eventInitDict ? eventInitDict.composed : false;
    }
  }
};

vm.createContext(sandbox);
vm.runInContext(contractCode, sandbox);

console.log('=== TEST 1: CONTRACT INSTANTIATION & INTERFACE CONFORMANCE ===');
const testScript = `
const adapter = new AashaExperienceAdapter({ foundationId: 'F04', experienceId: 'fraction-equiv' });

console.log('adapter instanceof AashaExperienceContract:', adapter instanceof AashaExperienceContract);
console.log('typeof mount:', typeof adapter.mount);
console.log('typeof getState:', typeof adapter.getState);
console.log('typeof pause:', typeof adapter.pause);
console.log('typeof resume:', typeof adapter.resume);
console.log('typeof reset:', typeof adapter.reset);
console.log('typeof destroy:', typeof adapter.destroy);
console.log('typeof emitTelemetry:', typeof adapter.emitTelemetry);
console.log('typeof telemetry:', typeof adapter.telemetry);

// Test mount and initial state
const containerMock = {
  events: [],
  dispatchEvent(e) { this.events.push(e); return true; }
};

adapter.mount(containerMock, { initialState: { p: 32, q: -48 } });
console.log('Initial getState():', JSON.stringify(adapter.getState()));
console.log('adapter.isPaused after mount:', adapter.isPaused);

adapter.pause();
console.log('adapter.isPaused after pause():', adapter.isPaused);

adapter.resume();
console.log('adapter.isPaused after resume():', adapter.isPaused);

// Test state change emission and internal state
adapter.emitStateChange({ p: 25, q: -42, std: '-25/42' });
console.log('State in container events:', containerMock.events.length, containerMock.events[0].type, containerMock.events[0].detail.state);
console.log('getState() after emitStateChange:', JSON.stringify(adapter.getState()));

adapter.reset();
console.log('getState() after reset():', JSON.stringify(adapter.getState()));

adapter.destroy();
console.log('adapter.isPaused after destroy():', adapter.isPaused);
console.log('adapter.container after destroy():', adapter.container);
`;

vm.runInContext(testScript, sandbox);
