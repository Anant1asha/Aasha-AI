const fs = require('fs');
const content = fs.readFileSync('Aasha-AI/chapters/RationalNumbers_Class8_AD_Gamified_v5_Enhanced_v6.html', 'utf8');

const wmStart = content.indexOf('var WM = {');
const wmEnd = content.indexOf('};', wmStart);
if (wmStart !== -1 && wmEnd !== -1) {
  const code = content.slice(wmStart, wmEnd + 2) + '\nreturn WM;';
  const fn = new Function(code);
  const wm = fn();
  console.log('WM terms count:', Object.keys(wm).length);
  const testKeywords = ['express', 'rational', 'standard', 'form', 'positive', 'denominator', 'numerator', 'multiplying', 'entire', 'placed', 'fractions', 'understanding'];
  testKeywords.forEach(k => console.log(`- ${k}:`, wm[k] || 'MISSING'));
}
