const fs = require('fs');
const content = fs.readFileSync('Aasha-AI/scripts/build_exponents_master_chapter.js', 'utf8');

const regex = /ctrl\.innerHTML\s*=\s*([\s\S]*?);/g;
let m;
while ((m = regex.exec(content)) !== null) {
  console.log('--- ctrl.innerHTML block ---');
  console.log(m[1].trim());
}
