const fs = require('fs');
const path = require('path');
const htmlPath = path.join(__dirname, '..', 'chapters', 'RationalNumbers_Class8_AD_Gamified_v5_Enhanced_v6.html');
const content = fs.readFileSync(htmlPath, 'utf8');

const idx = content.indexOf('id="viewConcept"');
if (idx !== -1) {
  console.log(content.slice(idx - 100, idx + 1500));
} else {
  console.log('viewConcept not found');
}
