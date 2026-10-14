const fs = require('fs');
const content = fs.readFileSync('Aasha-AI/chapters/ExponentsPowers_Class8_Gamified_v5_Enhanced_v6.html', 'utf8');

const nodesMatch = content.match(/var NODES = (\[[\s\S]*?\]);\s*(?:var|function|App)/);
const nodes = JSON.parse(nodesMatch[1]);
nodes.forEach((n, i) => {
  const textStep = n.steps.find(s => s.t === 'text');
  console.log(`Node ${i+1} text step:`, {
    title: textStep ? textStep.title : 'none',
    simType: textStep ? textStep.simType : 'none',
    caption: textStep ? textStep.caption : 'none'
  });
});
