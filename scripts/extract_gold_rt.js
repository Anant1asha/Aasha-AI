const fs = require('fs');
const path = require('path');

const baseRef = fs.readFileSync(path.join(__dirname, '../chapters/RationalNumbers_Class8_AD_Gamified_v5_Enhanced_v6.html'), 'utf8');

const insStart = baseRef.indexOf('function insulateMathContent(');
const swEnd = baseRef.indexOf('// ═══ WEB AUDIO', insStart);
const mathAndRtSnippet = baseRef.slice(insStart, swEnd);

console.log('mathAndRtSnippet length:', mathAndRtSnippet.length);

module.exports = { mathAndRtSnippet };
