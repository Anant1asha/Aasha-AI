const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, '..', 'chapters', 'RationalNumbers_Class8_AD_Gamified_v5_Enhanced_v6.html');
const content = fs.readFileSync(htmlPath, 'utf8');

console.log('=== 6. SIMULATION DRAW FUNCTIONS AND RAF/TIMER USAGE ===');
const simHeaderIdx = content.indexOf('═══ SIMULATION PROCEDURAL DRAW ENGINES ═══');
const appHeaderIdx = content.indexOf('═══ APPLICATION LOGIC & STATE ═══');
if (simHeaderIdx !== -1) {
  const end = appHeaderIdx !== -1 ? appHeaderIdx : simHeaderIdx + 8000;
  console.log(content.slice(simHeaderIdx, end));
}
