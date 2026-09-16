const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, '..', 'chapters', 'RationalNumbers_Class8_AD_Gamified_v5_Enhanced_v6.html');
const content = fs.readFileSync(htmlPath, 'utf8');

const funcs = ['updateReciprocalDOM', 'updatePropsDOM'];
funcs.forEach(f => {
  const idx = content.indexOf(f + ': function');
  if (idx !== -1) {
    console.log(`=== FUNCTION ${f} ===`);
    console.log(content.slice(idx, idx + 800));
  } else {
    console.log(`Function ${f} NOT found!`);
  }
});
