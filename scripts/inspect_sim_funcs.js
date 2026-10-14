const fs = require('fs');
const content = fs.readFileSync('Aasha-AI/chapters/ExponentsPowers_Class8_Gamified_v5_Enhanced_v6.html', 'utf8');

const funcs = ['drawInverterSim', 'drawLawsSim', 'drawMatrixSim', 'drawEquationSim', 'drawSpinnerSim'];
funcs.forEach(f => {
  const idx = content.indexOf('function ' + f);
  if (idx !== -1) {
    console.log(`=== ${f} ===`);
    console.log(content.slice(idx, idx + 800));
  }
});
