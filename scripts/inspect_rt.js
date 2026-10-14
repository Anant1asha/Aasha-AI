const fs = require('fs');
const content = fs.readFileSync('Aasha-AI/chapters/RationalNumbers_Class8_AD_Gamified_v5_Enhanced_v6.html', 'utf8');

const rtIdx = content.indexOf('function rt(');
console.log('rt function snippet:');
console.log(content.slice(rtIdx, rtIdx + 1200));
