const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, '..', 'chapters', 'RationalNumbers_Class8_AD_Gamified_v5_Enhanced_v6.html');
const content = fs.readFileSync(htmlPath, 'utf8');

console.log('=== 8. INSPECTING render() AND renderConceptCard() ===');
const renderIdx = content.indexOf('render: function()');
if (renderIdx !== -1) {
  console.log(content.slice(renderIdx, renderIdx + 4000));
}
