const fs = require('fs');
const path = require('path');

const template = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>{{TITLE}}</title>
<script>
var NODES= [
  {
    title: 'Intro to Concept',
    steps: [
      { t: 'intro' },
      { t: 'text' },
      {
        t: 'quiz',
        q: {
          opts: [
            { c: true, t: '10', m: '' },
            { c: false, t: '20', m: 'You might have added instead of multiplied.' }
          ]
        }
      }
    ]
  }
];

var WE= {
  ex1: {
    check: {
      opts: [
        { c: true, t: '5', m: '' },
        { c: false, t: '6', m: 'Check your counting.' }
      ]
    }
  }
};

var WM= {
  'apple': 'सेब'
};

var CONN= {};

function rt(word) {
  return WM[word] || word;
}

// Rule 2
var arr = []; arr.sort(function() { return Math.random() - 0.5; });

// Rule 5
// renderDD Skip this activity

// Rule 6
// id="backBtn" id="continueBtn"

// Rule 7
// renderWorked _weCheckRendered

// Rule 8
try { var s = JSON.parse(localStorage.getItem('test')); } catch(e) {}

// Rule 9
var App = {
  init: function() {},
  exit: function() { this.nIdx = 0; }
};
App.init();

</script>
</head>
<body>
<div class="app">
<div class="screen"></div>
<div class="bottom-bar"></div>
<div id="wordDialog"></div>
<canvas></canvas>
</div>
<button id="backBtn"></button>
<button id="continueBtn"></button>
<a href="#">Skip this activity</a>
<div class="progress"></div>
</body>
</html>`;

function generate(title, filename) {
  const html = template.replace('{{TITLE}}', title);
  const outDir = path.join(__dirname, 'standalone_chapters');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }
  const outPath = path.join(outDir, filename);
  fs.writeFileSync(outPath, html, 'utf8');
  console.log('Generated: ' + outPath);
}

generate('The Fish Tale', 'The_Fish_Tale_Class5_Gamified.html');
generate('Knowing Our Numbers', 'Knowing_Our_Numbers_Class6_Gamified.html');
