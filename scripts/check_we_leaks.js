const fs = require('fs');
const content = fs.readFileSync('Aasha-AI/scripts/build_exponents_master_chapter.js', 'utf8');

const weIdx = content.indexOf('const WE_JSON =');
const weEnd = content.indexOf('const fullHtml =');
const weSnippet = content.slice(weIdx, weEnd);

const leakRegex = /\b(is|giving|becomes|instead of|to get|yielding|result is|should be|must be|equals|yields)\b/gi;
let m;
while ((m = leakRegex.exec(weSnippet)) !== null) {
  const lineStart = weSnippet.lastIndexOf('\n', m.index);
  const lineEnd = weSnippet.indexOf('\n', m.index);
  const line = weSnippet.slice(lineStart, lineEnd);
  if (line.includes(' m: "')) {
    console.log(`POTENTIAL LEAK: "${m[0]}" at: ${line.trim()}`);
  }
}
