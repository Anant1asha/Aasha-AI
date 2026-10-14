const fs = require('fs');
const content = fs.readFileSync('Aasha-AI/scripts/build_exponents_master_chapter.js', 'utf8');

const nodesIdx = content.indexOf('const NODES_JSON =');
const nodesEnd = content.indexOf('const WE_JSON =');
const nodesSnippet = content.slice(nodesIdx, nodesEnd);

const leakRegex = /\b(is|giving|becomes|instead of|to get|yielding|result is|should be|must be|equals|yields)\b/gi;
let m;
while ((m = leakRegex.exec(nodesSnippet)) !== null) {
  const lineStart = nodesSnippet.lastIndexOf('\n', m.index);
  const lineEnd = nodesSnippet.indexOf('\n', m.index);
  const line = nodesSnippet.slice(lineStart, lineEnd);
  if (line.includes(' m: "')) {
    console.log(`POTENTIAL LEAK IN NODES: "${m[0]}" at: ${line.trim()}`);
  }
}
