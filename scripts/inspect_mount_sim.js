const fs = require('fs');
const content = fs.readFileSync('Aasha-AI/chapters/ExponentsPowers_Class8_Gamified_v5_Enhanced_v6.html', 'utf8');

const mountIdx = content.indexOf('mountSim:');
console.log('mountSim snippet:');
console.log(content.slice(mountIdx, mountIdx + 3000));
