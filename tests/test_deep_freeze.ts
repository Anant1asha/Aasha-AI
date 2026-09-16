import { deepFreeze } from '../agent_orchestrator';

const obj = { a: 1, nested: { b: 2, deeper: { c: 3 } } };
deepFreeze(obj);

let threw = false;
try {
  (obj.nested.deeper as any).c = 4;
} catch (e) {
  threw = true;
}

if (threw || Object.isFrozen(obj.nested.deeper)) {
  console.log('PASS: deepFreeze verified on nested structures');
  process.exit(0);
} else {
  console.error('FAIL: nested structure was not frozen');
  process.exit(1);
}
