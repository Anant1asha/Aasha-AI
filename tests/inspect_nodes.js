const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, '..', 'chapters', 'RationalNumbers_Class8_AD_Gamified_v5_Enhanced_v6.html');
const content = fs.readFileSync(htmlPath, 'utf8');

const nodesStart = content.indexOf('var NODES = [');
const nodesEnd = content.indexOf('var STORAGE_KEY');
console.log('Nodes slice length:', nodesEnd - nodesStart);

// Let's eval NODES in a VM to inspect all nodes and steps
const vm = require('vm');
const sandbox = {};
vm.createContext(sandbox);
vm.runInContext(content.slice(nodesStart, nodesEnd), sandbox);

console.log('NODES count:', sandbox.NODES.length);
sandbox.NODES.forEach((n, idx) => {
  console.log(`\nNode ${idx + 1}: ${n.id} - ${n.title}`);
  n.steps.forEach((s, sidx) => {
    console.log(`  Step ${sidx + 1}: type=${s.t}, simType=${s.simType || 'none'}, title=${s.title ? s.title.slice(0, 40) : 'none'}`);
  });
});
