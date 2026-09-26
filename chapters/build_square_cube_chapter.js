/**
 * Assembly Script for SquareCubeRoots_Class8_Gamified_v5_Enhanced_v6.html
 * Aasha Learning Ecosystem — Class 8 Mathematics: Squares and Cubes
 */

const fs = require('fs');
const path = require('path');

// 1. Load authoritative questions from tests/e2e_square_cube_suite.js
const suitePath = path.resolve(__dirname, '../../tests/e2e_square_cube_suite.js');
const { AUTHORITATIVE_34_QUESTIONS } = require(suitePath);

// 2. Load dictionary from experience_registry/aasha_dictionary_db.json
const dictPath = path.resolve(__dirname, '../experience_registry/aasha_dictionary_db.json');
const baseDict = JSON.parse(fs.readFileSync(dictPath, 'utf8'));

// 3. Chapter-specific domain vocabulary
const domainVocab = {
  "square": "वर्ग (घात 2, जैसे a² या समचतुर्भुज)",
  "squares": "वर्ग (एक से अधिक)",
  "squared": "वर्ग किया हुआ (घात 2)",
  "cube": "घन (घात 3, जैसे a³)",
  "cubes": "घन (एक से अधिक)",
  "cubed": "घन किया हुआ (घात 3)",
  "root": "मूल / जड़ (रूट)",
  "roots": "मूल (रूट्स)",
  "gnomon": "ग्नोमोन (L-आकार की विषम संख्या पट्टी)",
  "pythagorean": "पाइथागोरस संबंधी (पाइथागोरियन)",
  "triplet": "त्रिक (तीन संख्याओं का समूह)",
  "triplets": "त्रिक (एक से अधिक)",
  "locker": "लॉकर (ताले वाली तिजोरी)",
  "lockers": "लॉकर (एक से अधिक)",
  "riddle": "पहेली (रिडल)",
  "vault": "तिजोरी (वॉल्ट)",
  "queen": "रानी (क्वीन)",
  "ratnamanjuri": "रत्नमंजरी (रानी का नाम)",
  "jewel": "रत्न / गहना (ज्वेल)",
  "jewels": "रत्न (ज्वेल्स)",
  "parity": "समता (सम या विषम होना)",
  "ending": "अंतिम / इकाई का (एंडिंग)",
  "digit": "अंक (डिजिट)",
  "digits": "अंक (डिजिट्स)",
  "trailing": "अंतिम शून्य (ट्रेलिंग)",
  "zeros": "शून्य (कई ज़ीरो)",
  "estimation": "अनुमान (एस्टिमेशन)",
  "estimate": "अनुमान लगाना (एस्टिमेट)",
  "estimating": "अनुमान लगाना (एस्टिमेटिंग)",
  "bracket": "कोष्ठक / सीमा (ब्रैकेट)",
  "brackets": "कोष्ठक (ब्रैकेट्स)",
  "bracketing": "सीमा बांधना (ब्रैकेटिंग)",
  "prime": "अभाज्य संख्या (जो सिर्फ 1 और स्वयं से कटे)",
  "factor": "गुणनखंड (फैक्टर)",
  "factors": "गुणनखंड (एक से अधिक)",
  "factored": "गुणनखंडित (फैक्टर्ड)",
  "factoring": "गुणनखंडन (फैक्टरिंग)",
  "factorization": "गुणनखंडन (फैक्टराइज़ेशन)",
  "factorisation": "गुणनखंडन (प्राइम फैक्टराइज़ेशन)",
  "multiplier": "गुणक (जिससे गुणा करना है)",
  "divisor": "भाजक (जिससे भाग देना है)",
  "dividend": "भाज्य (जिसमें भाग दिया जाए)",
  "quotient": "भागफल (भाग देने पर मिला उत्तर)",
  "remainder": "शेषफल (बचा हुआ भाग)",
  "odd": "विषम संख्या (जो 2 से न कटे)",
  "even": "सम संख्या (जो 2 से कटे)",
  "consecutive": "लगातार / क्रमागत (कन्ज़ेक्यूटिव)",
  "perfect": "पूर्ण (परफेक्ट)",
  "area": "क्षेत्रफल (स्थान का आकार)",
  "volume": "आयतन (त्रिविमीय स्थान)",
  "side": "भुजा / किनारा (साइड)",
  "edge": "किनारा (एज)",
  "length": "लंबाई (लेंथ)",
  "breadth": "चौड़ाई (ब्रेड्थ)",
  "height": "ऊंचाई (हाइट)",
  "dimension": "विमा / माप (डायमेंशन)",
  "dimensions": "विमाएँ (डायमेंशन्स)",
  "integer": "पूर्णांक (पूरा अंक)",
  "integers": "पूर्णांक (सभी पूर्ण संख्याएँ)",
  "natural": "प्राकृतिक संख्या (गिनती की संख्या)",
  "whole": "पूर्ण संख्या (0 से शुरू)",
  "express": "व्यक्त करना (एक्सप्रेस)",
  "standard": "मानक रूप (स्टैंडर्ड)",
  "form": "रूप (फॉर्म)",
  "positive": "धनात्मक (पॉज़िटिव)",
  "denominator": "हर (डिनॉमिनेटर)",
  "numerator": "अंश (न्यूमरेटर)",
  "multiplying": "गुणा करना (मल्टीप्लाइंग)",
  "entire": "संपूर्ण (एंटायर)",
  "placed": "रखा गया (प्लेस्ड)",
  "fractions": "भिन्न (फ्रैक्शन्स)",
  "understanding": "समझ (अंडरस्टैंडिंग)"
};

const fullDict = Object.assign({}, baseDict, domainVocab);

// Helper to escape HTML attributes
function escAttr(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escJsStr(str) {
  if (!str) return '';
  return String(str)
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '');
}

// 4. Partition 34 questions into Warm-up (12), Deep Dive (14), Boss (8)
const warmupQs = AUTHORITATIVE_34_QUESTIONS.filter(q => q.tier === 'warmup');
const deepDiveQs = AUTHORITATIVE_34_QUESTIONS.filter(q => q.tier === 'deep_dive');
const bossQs = AUTHORITATIVE_34_QUESTIONS.filter(q => q.tier === 'boss');

console.log(`Questions: Warm-up=${warmupQs.length}, Deep Dive=${deepDiveQs.length}, Boss=${bossQs.length}`);

// Generate HTML for a quiz card
function renderQuizCard(q, xpVal) {
  const qid = q.id;
  const tag = q.source || 'Textbook Exercise';
  let optsHtml = '';
  
  q.opts.forEach((opt, idx) => {
    const isCorr = opt.c === true;
    const mText = opt.m || '';
    optsHtml += `
          <div class="quiz-opt" data-m="${escAttr(mText)}" data-correct="${isCorr}" onclick="App.answerAssessment(this, '${qid}', ${isCorr}, '${escJsStr(mText)}', ${xpVal})">
            <div class="quiz-radio"></div>
            <span class="quiz-opt-text">${escAttr(opt.t)}</span>
          </div>`;
  });

  return `
      <div class="quiz-card" id="${qid}">
        <div class="quiz-tag">${escAttr(tag)}</div>
        <div class="quiz-question">${escAttr(q.q)}</div>
        <div class="quiz-opts-container">${optsHtml}
        </div>
        <div class="quiz-feedback" id="fb_${qid}"></div>
        <div class="hint-box" id="hb_${qid}"
             data-h1="${escAttr(q.hints.h1)}"
             data-h2="${escAttr(q.hints.h2)}"
             data-h3="${escAttr(q.hints.h3)}"
             data-h4="${escAttr(q.hints.h4)}">
          <button class="hint-btn" onclick="App.showNextHint('${qid}')">💡 Hint (संकेत) <span class="hint-tier-label" id="hl_${qid}">[Tier 1/4]</span></button>
          <div class="hint-text" id="ht_${qid}" style="display:none"></div>
        </div>
      </div>`;
}

// Build sections HTML
const warmupHtml = warmupQs.map(q => renderQuizCard(q, 5)).join('\n');
const deepDiveHtml = deepDiveQs.map(q => renderQuizCard(q, 10)).join('\n');
const bossHtml = bossQs.map(q => renderQuizCard(q, 25)).join('\n');

// 5. Pedagogical Golden Flow: NODES
const NODES_DATA = [
  {
    title: "Queen's Lockers & Factor Parity",
    emoji: "🔐",
    steps: [
      {
        t: "intro", icon: "🔐",
        title: "Which lockers in Queen Ratnamanjuri's vault remain open?",
        sub: "100 palace lockers start closed. Person 1 toggles every locker. Person 2 toggles every 2nd locker. Person k toggles every kth locker. After all 100 people pass, which lockers stay open? Only 10 lockers: 1, 4, 9, 16, 25, 36, 49, 64, 81, and 100!"
      },
      {
        t: "text",
        title: "Why do only square numbers have an odd number of factors?",
        text: "Every natural number N has factors that naturally arrive in pairs: a × b = N. For non-squares, each divisor has a distinct partner, creating an EVEN number of toggles (open then closed). But for a perfect square like 36, the factor pair 6 × 6 has both partners equal! The number 6 is counted only ONCE. This odd toggle leaves square lockers permanently open.",
        simType: "lockerriddle",
        caption: "100-Locker Mystery Explorer: Toggle doors and observe factor pair collapse"
      },
      { t: "worked", we: "we_factor_parity" },
      {
        t: "quiz",
        q: {
          q: "Why does the number 36 have an odd number of distinct factors?",
          opts: [
            { t: "Because the factor pair 6 × 6 has identical partners, contributing only one unique factor", c: true, m: "" },
            { t: "Because 36 is an even number", c: false, m: "Many even numbers like 10 or 12 have an even count of factors; parity of the integer does not dictate factor count." },
            { t: "Because 36 has more prime factors than other numbers", c: false, m: "The factor count depends on exponent combinations in prime factorisation, not just prime quantity." },
            { t: "Because all factors of 36 are odd numbers", c: false, m: "Divisors such as 2, 4, 6, 12, 18, and 36 are even integers." }
          ]
        }
      },
      { t: "progress", xp: 40, next: true }
    ]
  },
  {
    title: "Units Digits & Trailing Zeros",
    emoji: "🔍",
    steps: [
      {
        t: "intro", icon: "🔍",
        title: "Can 2,048 or 1,057 ever be a perfect square?",
        sub: "Observe the units digit of every square: 1²=1, 2²=4, 3²=9, 4²=16 (ends in 6), 5²=25, 6²=36, 7²=49, 8²=64, 9²=81, 10²=100. Every square MUST end in 0, 1, 4, 5, 6, or 9. Any number ending in 2, 3, 7, or 8 is NEVER a square!"
      },
      {
        t: "text",
        title: "Why do trailing zeros always come in pairs in square numbers?",
        text: "When a number ending in zeros is multiplied by itself, the trailing zeros double: (a × 10^k)² = a² × 10^(2k). Therefore, a square number can NEVER end in an odd count of zeros. Similarly, squaring preserves parity: (2k)² = 4k² (even), and (2k+1)² = 4k² + 4k + 1 (odd).",
        simType: "squaregrid",
        caption: "Units Digit & Zero Parity Explorer: Test base numbers and observe ending patterns"
      },
      { t: "worked", we: "we_units_digits" },
      {
        t: "quiz",
        q: {
          q: "Which of the following numbers can be definitively ruled out as a square solely by its units digit?",
          opts: [
            { t: "1,057", c: true, m: "" },
            { t: "1,024", c: false, m: "Numbers ending in 4 can be squares, for example 32² = 1024." },
            { t: "1,089", c: false, m: "Numbers ending in 9 can be squares, for example 33² = 1089." },
            { t: "2,025", c: false, m: "Numbers ending in 5 can be squares, for example 45² = 2025." }
          ]
        }
      },
      { t: "progress", xp: 40, next: true }
    ]
  },
  {
    title: "Square Roots & Gnomon Peeling",
    emoji: "📐",
    steps: [
      {
        t: "intro", icon: "📐",
        title: "How does adding odd numbers build geometric squares?",
        sub: "Notice the dot pattern: 1 = 1², 1 + 3 = 4 = 2², 1 + 3 + 5 = 9 = 3², 1 + 3 + 5 + 7 = 16 = 4². Each square is built by wrapping an inverted-L border (a gnomon) of consecutive odd dots around the previous square!"
      },
      {
        t: "text",
        title: "How do we extract square roots via repeated subtraction and prime pairing?",
        text: "Because the sum of the first n odd numbers is n², repeatedly subtracting consecutive odd numbers (1, 3, 5, 7...) until reaching 0 finds √N: the number of subtractions is the square root. In prime factorisation, every prime factor in a square appears an even number of times; taking one factor from each pair yields √N.",
        simType: "primefactor",
        caption: "Interactive 2D Square Grid & Gnomon Lab: Peel consecutive odd layers"
      },
      { t: "worked", we: "we_square_roots" },
      {
        t: "quiz",
        q: {
          q: "If 35² = 1225, what is 36² using the consecutive odd addition property?",
          opts: [
            { t: "1296", c: true, m: "" },
            { t: "1261", c: false, m: "Added 36 instead of adding the 36th odd number 2(36) - 1 = 71." },
            { t: "1295", c: false, m: "Added 70 instead of the exact odd gnomon border 71." },
            { t: "1300", c: false, m: "Rounded to nearest hundred rather than applying the exact odd step." }
          ]
        }
      },
      { t: "progress", xp: 40, next: true }
    ]
  },
  {
    title: "Cubic Numbers & 3D Stacking",
    emoji: "🧊",
    steps: [
      {
        t: "intro", icon: "🧊",
        title: "How many unit cubes build a solid cube of edge 4?",
        sub: "A square has 2 dimensions: 4 × 4 = 16 tiles. A solid cube adds depth: 4 layers of 16 cubes = 4 × 4 × 4 = 64 unit cubes! The volume of a cube with edge s is s³."
      },
      {
        t: "text",
        title: "How do consecutive cube differences grow compared to squares?",
        text: "The difference between consecutive squares grows linearly: (n+1)² - n² = 2n + 1. But the difference between consecutive cubes grows quadratically: (n+1)³ - n³ = 3n² + 3n + 1. Furthermore, consecutive odd numbers group into cubes: 1 = 1³, 3 + 5 = 8 = 2³, 7 + 9 + 11 = 27 = 3³!",
        simType: "isocube",
        caption: "3D Isometric Cube Stacker: Rotate, slice layers, and explore cubic sums"
      },
      { t: "worked", we: "we_cubic_numbers" },
      {
        t: "quiz",
        q: {
          q: "What is the sum of the 10 consecutive odd numbers: 91 + 93 + 95 + ... + 109?",
          opts: [
            { t: "1000", c: true, m: "" },
            { t: "900", c: false, m: "Used 9³ instead of the 10th block sum 10³." },
            { t: "100", c: false, m: "Computed 10² instead of 10³ for this cubic odd partition." },
            { t: "1100", c: false, m: "Added an arbitrary 100 to the cubic sum." }
          ]
        }
      },
      { t: "progress", xp: 40, next: true }
    ]
  },
  {
    title: "Cube Roots & Taxicab Mysteries",
    emoji: "🚖",
    steps: [
      {
        t: "intro", icon: "🚖",
        title: "Why is 1729 called the Hardy-Ramanujan Taxicab Number?",
        sub: "When mathematician G.H. Hardy visited Srinivasa Ramanujan in hospital, he remarked that his taxi cab number 1729 seemed dull. Ramanujan instantly replied: 'No, Hardy! It is the smallest number expressible as the sum of two cubes in two different ways: 1³ + 12³ = 9³ + 10³ = 1729!'"
      },
      {
        t: "text",
        title: "How do we find cube roots rapidly by 3-digit grouping?",
        text: "To find ∛12167: group into sets of 3 digits from right: 12 (thousands) and 167 (units). The units digit 7 tells us the root's units digit is 3 (since 3³ ends in 7). The thousands group 12 lies between 2³ (8) and 3³ (27), fixing the tens digit as 2. Thus ∛12167 = 23 instantly!",
        simType: "cubeestimator",
        caption: "Rapid Cube Estimator: Split digits into groups and extract roots visually"
      },
      { t: "worked", we: "we_cube_roots" },
      {
        t: "quiz",
        q: {
          q: "The taxicab number 4104 is 2³ + 16³. What is its other representation as a sum of two cubes?",
          opts: [
            { t: "9³ + 15³", c: true, m: "" },
            { t: "10³ + 14³", c: false, m: "Evaluates to 1000 + 2744 = 3744, which falls short of 4104." },
            { t: "8³ + 16³", c: false, m: "Used 8³ instead of 2³, exceeding 4104." },
            { t: "11³ + 13³", c: false, m: "Evaluates to 1331 + 2197 = 3528, which does not equal 4104." }
          ]
        }
      },
      { t: "progress", xp: 50, next: false }
    ]
  }
];

// 6. Worked Examples: WE (using certified non-spoiler distractors)
const WE_DATA = {
  "we_factor_parity": {
    title: "Step-by-Step: Factor Parity Analysis",
    question: "Analyze why locker 49 has an odd number of factors while locker 50 has an even number.",
    steps: [
      {
        text: "Find all factor pairs of 50: 1 × 50 = 50, 2 × 25 = 50, 5 × 10 = 50. Total factors: 1, 2, 5, 10, 25, 50 (6 factors, an EVEN number).",
        c: "blue",
        check: {
          q: "Why do non-square numbers always have an even number of factors?",
          opts: [
            { t: "Because their factors always pair up into distinct pairs (a × b = N where a ≠ b)", c: true, m: "" },
            { t: "Because non-square numbers are always divisible by 2", c: false, m: "Many non-squares like 15 or 21 are odd numbers with an even factor count." },
            { t: "Because prime numbers have only one factor", c: false, m: "Prime numbers have exactly two factors: 1 and the prime itself." },
            { t: "Because factors must always alternate between even and odd", c: false, m: "Factor values do not follow strict alternating parity sequences." }
          ]
        }
      },
      {
        text: "Find all factor pairs of 49: 1 × 49 = 49, and 7 × 7 = 49. The pair 7 × 7 has both numbers identical!",
        c: "blue"
      },
      {
        text: "List unique factors of 49: 1, 7, 49. Since 7 is counted once, 49 has exactly 3 factors (an ODD number). Therefore, locker 49 stays open!",
        c: "green",
        final: true
      }
    ],
    check: {
      q: "Which of the following numbers will have an odd number of divisors?",
      opts: [
        { t: "81", c: true, m: "" },
        { t: "80", c: false, m: "80 is not a perfect square, so its divisors pair up into an even count." },
        { t: "72", c: false, m: "72 is not a square; its prime exponents are not all even." },
        { t: "90", c: false, m: "90 has unpaired prime factor 5 (90 = 2 × 3² × 5), producing an even divisor count." }
      ]
    }
  },

  "we_units_digits": {
    title: "Step-by-Step: Testing Square Possibility by Units Digits",
    question: "Determine whether 2032, 2048, 1027, and 1089 can be perfect squares.",
    steps: [
      {
        text: "Recall the units digit table of squares: 0²=0, 1²=1, 2²=4, 3²=9, 4²=6, 5²=5, 6²=6, 7²=9, 8²=4, 9²=1. The possible units digits are {0, 1, 4, 5, 6, 9}.",
        c: "blue",
        check: {
          q: "Which digits can NEVER appear in the units place of a perfect square?",
          opts: [
            { t: "2, 3, 7, and 8", c: true, m: "" },
            { t: "1, 4, 5, and 6", c: false, m: "These digits frequently terminate squares: 9²=81, 2²=4, 5²=25, 4²=16." },
            { t: "Only odd digits", c: false, m: "Squares of odd numbers always terminate in odd digits: 1, 5, or 9." },
            { t: "Only even digits", c: false, m: "Squares of even numbers always terminate in even digits: 0, 4, or 6." }
          ]
        }
      },
      {
        text: "Inspect candidates: 2032 ends in 2 (impossible), 2048 ends in 8 (impossible), 1027 ends in 7 (impossible).",
        c: "blue"
      },
      {
        text: "Inspect 1089: ends in 9 (valid square ending). Indeed, 33 × 33 = 1089. Thus 2032, 2048, and 1027 are ruled out.",
        c: "green",
        final: true
      }
    ],
    check: {
      q: "Which of the following expressions will result in a square with last digit 4?",
      opts: [
        { t: "108² and 292²", c: true, m: "" },
        { t: "64² and 36²", c: false, m: "Bases ending in 4 or 6 produce squares ending in 6." },
        { t: "45² and 55²", c: false, m: "Bases ending in 5 produce squares ending in 5." },
        { t: "103² and 107²", c: false, m: "Bases ending in 3 or 7 produce squares ending in 9." }
      ]
    }
  },

  "we_square_roots": {
    title: "Step-by-Step: Prime Factor Pairing for Square Roots",
    question: "Find the smallest multiplier to make 9408 a perfect square, and find the square root.",
    steps: [
      {
        text: "Decompose 9408 into prime factors: 9408 ÷ 2 = 4704 ÷ 2 = 2352 ÷ 2 = 1176 ÷ 2 = 588 ÷ 2 = 294 ÷ 2 = 147 ÷ 3 = 49 ÷ 7 = 7 ÷ 7 = 1.",
        c: "blue",
        check: {
          q: "What is the prime factorisation of 9408?",
          opts: [
            { t: "2⁶ × 3¹ × 7²", c: true, m: "" },
            { t: "2⁴ × 3² × 7²", c: false, m: "Check the count of factor 2: dividing by 2 occurs six times." },
            { t: "2⁶ × 3² × 7¹", c: false, m: "Notice that 49 is a square factor composed of two sevens, so the prime factor seven must have an even exponent." },
            { t: "2⁵ × 3¹ × 7³", c: false, m: "Factors of two appear six times, not five." }
          ]
        }
      },
      {
        text: "Group prime factors into pairs: (2 × 2) × (2 × 2) × (2 × 2) × (7 × 7) × [3]. Notice that 3 is the only unpaired factor!",
        c: "blue"
      },
      {
        text: "Multiply by 3 to complete the pair: 9408 × 3 = 28224. Take one from each pair: 2 × 2 × 2 × 7 × 3 = 168. So multiplier = 3, square root = 168.",
        c: "green",
        final: true
      }
    ],
    check: {
      q: "What is the smallest number by which 180 must be multiplied to make it a perfect square?",
      opts: [
        { t: "5", c: true, m: "" },
        { t: "2", c: false, m: "180 = 2² × 3² × 5; prime factor 2 already has an even exponent." },
        { t: "3", c: false, m: "Prime factor 3 already forms a complete pair (3²)." },
        { t: "10", c: false, m: "Multiplying by 10 introduces an unnecessary extra factor of 2." }
      ]
    }
  },

  "we_cubic_numbers": {
    title: "Step-by-Step: Odd Number Summation for Cubes",
    question: "Express 4³ and 5³ as sums of consecutive odd numbers.",
    steps: [
      {
        text: "Observe the odd grouping pattern: Row 1 has 1 number (1 = 1³). Row 2 has 2 numbers (3 + 5 = 8 = 2³). Row 3 has 3 numbers (7 + 9 + 11 = 27 = 3³).",
        c: "blue",
        check: {
          q: "How many consecutive odd numbers are summed to form n³?",
          opts: [
            { t: "Exactly n consecutive odd numbers", c: true, m: "" },
            { t: "Always 3 odd numbers", c: false, m: "The count of odd numbers equals the base n itself." },
            { t: "2n odd numbers", c: false, m: "2n gives the non-square count between squares, not the cubic odd partition." },
            { t: "n² odd numbers", c: false, m: "Summing n² odd numbers starting from 1 yields (n²)² = n⁴." }
          ]
        }
      },
      {
        text: "Row 4 has 4 numbers starting after 11: 13 + 15 + 17 + 19 = 64 = 4³.",
        c: "blue"
      },
      {
        text: "Row 5 has 5 numbers starting after 19: 21 + 23 + 25 + 27 + 29 = 125 = 5³.",
        c: "green",
        final: true
      }
    ],
    check: {
      q: "What is the first odd number in the expansion of 6³ as a sum of 6 consecutive odd numbers?",
      opts: [
        { t: "31", c: true, m: "" },
        { t: "29", c: false, m: "29 was the last odd number in the expansion of 5³." },
        { t: "35", c: false, m: "Starting at 35 would overshoot the sum 216." },
        { t: "25", c: false, m: "25 is inside the 5³ grouping." }
      ]
    }
  },

  "we_cube_roots": {
    title: "Step-by-Step: Rapid 3-Digit Grouping for Cube Roots",
    question: "Estimate the cube root of 32,768 by 3-digit grouping.",
    steps: [
      {
        text: "Split 32,768 into two groups from right to left: Group 1 (units) = 768; Group 2 (thousands) = 32.",
        c: "blue",
        check: {
          q: "Why do we group in sets of THREE digits for cube roots instead of two?",
          opts: [
            { t: "Because (10)³ = 1000, so each digit in the cube root corresponds to 3 digit places in the cube", c: true, m: "" },
            { t: "Because 3 is a prime number", c: false, m: "Grouping derives from the cubic power of the base 10, not primality." },
            { t: "Because numbers have 3 dimensions", c: false, m: "Grouping reflects standard decimal place-value multiplication where cubing any tens power scales the exponent threefold." },
            { t: "Because cube roots are always 3-digit numbers", c: false, m: "Cube roots can have 1, 2, 3, or any count of digits." }
          ]
        }
      },
      {
        text: "Find units digit: Group 1 (768) ends in 8. The only single digit whose cube ends in 8 is 2 (since 2³ = 8). So units digit = 2.",
        c: "blue"
      },
      {
        text: "Find tens digit: Group 2 is 32. Since 3³ = 27 and 4³ = 64, 32 lies between 3³ and 4³. Take the smaller decade root: 3. Combining tens (3) and units (2) gives ∛32768 = 32.",
        c: "green",
        final: true
      }
    ],
    check: {
      q: "What is the cube root of 12,167 by 3-digit grouping?",
      opts: [
        { t: "23", c: true, m: "" },
        { t: "27", c: false, m: "Group 1 ends in 7; only 3³ ends in 7, so units digit must be 3, not 7." },
        { t: "33", c: false, m: "Thousands group 12 is less than 3³ = 27, so tens digit must be 2." },
        { t: "13", c: false, m: "Thousands group 12 is greater than 2³ = 8, so tens digit is 2, not 1." }
      ]
    }
  }
};

// 7. Full HTML template construction
const htmlContent = `<!DOCTYPE html><html lang="en"><head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0,user-scalable=no">
<title>Class 8 Square and Cube Roots (NCERT / RL Public School Edition — 100% Exercises) — Aasha Learning Ecosystem</title>
<!-- /* MathIsolation: true */ -->
<style>
/* ═══ CSS RESET & CSS VARIABLES ═══ */
*{margin:0;padding:0;box-sizing:border-box}
:root{
  --bg:#f0f4ff;--surface:#ffffff;--text:#0f172a;--muted:#475569;
  --blue:#2563eb;--blue-dk:#1d4ed8;--blue-lt:#eff6ff;
  --green:#16a34a;--green-dk:#15803d;--green-lt:#f0fdf4;
  --red:#dc2626;--red-lt:#fef2f2;
  --amber:#d97706;--amber-lt:#fffbeb;
  --purple:#7c3aed;--purple-lt:#f5f3ff;
  --border:#cbd5e1;--border-dk:#94a3b8;
  --shadow:0 4px 6px -1px rgba(15,23,42,.08),0 2px 4px -2px rgba(15,23,42,.05);
  --shadow-lg:0 10px 25px -3px rgba(15,23,42,.12),0 4px 6px -4px rgba(15,23,42,.07);
  --radius:16px;--radius-sm:12px;--radius-xs:8px;
  --brand:#1e3a5f;--brand-lt:#2d5a8e;
  --font:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;
}
body{font-family:var(--font);background:var(--bg);color:var(--text);min-height:100vh;overflow-x:hidden;-webkit-tap-highlight-color:transparent}
.app{max-width:520px;margin:0 auto;min-height:100vh;display:flex;flex-direction:column;background:var(--surface);box-shadow:0 0 40px rgba(0,0,0,.08)}

/* ═══ MATH TYPOGRAPHY & ISOLATION ═══ */
.math, .math-var{font-family:'Cambria Math','Times New Roman',serif;font-style:italic;font-weight:700;padding:0 3px;color:#1e3a8a}
.frac{display:inline-flex;flex-direction:column;vertical-align:middle;text-align:center;font-size:.88em;line-height:1;margin:0 3px}
.frac-top{border-bottom:1.5px solid currentColor;padding:0 3px}
.frac-bot{padding:0 3px}

/* ═══ BRAND HEADER & TOPBAR ═══ */
.brand-header{background:linear-gradient(135deg,var(--brand),var(--brand-lt));padding:10px 16px;display:flex;align-items:center;gap:12px;color:#fff}
.brand-logo{width:44px;height:44px;flex-shrink:0}
.brand-logo svg{width:100%;height:100%}
.brand-info{flex:1;min-width:0}
.brand-name{font-size:.82rem;font-weight:800;letter-spacing:.02em;line-height:1.2}
.brand-name-hi{font-size:.70rem;opacity:.9;line-height:1.2}
.brand-tagline{font-size:.64rem;opacity:.8;margin-top:2px}

.topbar{display:flex;align-items:center;gap:8px;padding:8px 12px;background:var(--surface);border-bottom:1px solid var(--border);position:sticky;top:0;z-index:50}
.exit-btn{background:none;border:none;font-size:20px;color:var(--muted);cursor:pointer;padding:4px;min-width:44px;min-height:44px;display:inline-flex;align-items:center;justify-content:center;border-radius:8px;touch-action:manipulation}
.exit-btn:hover{background:#f1f5f9;color:#0f172a}
.progress-track{flex:1;height:10px;background:var(--border);border-radius:10px;overflow:hidden}
.progress-fill{height:100%;background:linear-gradient(90deg,var(--blue),var(--purple));border-radius:10px;transition:width .4s ease;width:0}
.stat{display:inline-flex;align-items:center;gap:4px;font-size:.75rem;font-weight:800;padding:4px 9px;border-radius:16px;white-space:nowrap}
.stat.coins{color:var(--amber);background:var(--amber-lt);border:1px solid #fde68a}
.stat.xp{color:var(--purple);background:var(--purple-lt);border:1px solid #ddd6fe}
.stat.lvl{color:var(--blue);background:var(--blue-lt);border:1px solid #bfdbfe}
.stat.streak{color:var(--red);background:var(--red-lt);border:1px solid #fecaca}

/* ═══ MODE BAR (TABS) ═══ */
.mode-bar{display:none;align-items:center;justify-content:space-between;gap:4px;padding:6px 12px;background:#f8fafc;border-bottom:1px solid var(--border);overflow-x:auto;-webkit-overflow-scrolling:touch}
body.assessment-mode .mode-bar{display:flex}
@media (min-width:601px) and (min-height:900px){.mode-bar{display:flex}}
.mode-btn{flex:1;min-height:44px;min-width:44px;touch-action:manipulation;background:#ffffff;border:1.5px solid var(--border);border-radius:10px;font-size:0.75rem;font-weight:700;color:var(--muted);cursor:pointer;padding:4px 8px;display:inline-flex;align-items:center;justify-content:center;text-align:center;transition:all 0.15s;white-space:nowrap}
.mode-btn:hover{border-color:var(--blue);color:var(--blue-dk)}
.mode-btn.active{background:var(--blue-lt);border-color:var(--blue);color:var(--blue-dk);font-weight:800;box-shadow:0 1px 3px rgba(37,99,235,0.15)}

/* ═══ SCREEN CONTAINER & SAME-FRAME INVARIANTS ═══ */
.screen{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;padding:8px 12px calc(72px + env(safe-area-inset-bottom, 16px));min-height:0;box-sizing:border-box;width:100%}
.concept-frame{background:#ffffff;border:2px solid var(--border);border-radius:var(--radius);padding:16px 14px;width:100%;box-shadow:var(--shadow);margin-bottom:12px;box-sizing:border-box}
.concept-badge{display:inline-block;padding:3px 10px;border-radius:12px;font-size:.70rem;font-weight:800;letter-spacing:.04em;color:var(--blue-dk);background:var(--blue-lt);margin-bottom:8px}
.inquiry-title{font-size:1.10rem;font-weight:800;color:var(--brand);margin-bottom:8px;line-height:1.35}
.concept-def{font-size:.92rem;line-height:1.7;color:var(--text);margin-bottom:10px}
.hint{font-size:.72rem;color:var(--muted);text-align:center;margin:6px 0}

/* ═══ LLE BILINGUAL VOCABULARY STYLING ═══ */
.lle-text{font-size:1.02rem;line-height:2.0;color:var(--text);margin:6px 0;text-align:left}
.lle-text-sm{font-size:.90rem;line-height:1.7;color:var(--text);margin:4px 0;text-align:left}
.word{cursor:pointer;border-radius:4px;padding:1px 3px;transition:all .15s;border-bottom:1.5px dotted #94a3b8;font-weight:600}
.word:hover{background:#dbeafe;color:var(--blue-dk)}
.connective{color:var(--blue-dk);font-weight:700;cursor:pointer;border-bottom:2px dotted var(--blue);padding:1px 3px}
.connective-hi{color:var(--purple);font-size:.85em;font-weight:600}

/* ═══ SIMULATION CONTAINER & PRESET BAR ═══ */
.sim-container{background:#f8fafc;border:1.5px solid var(--border);border-radius:var(--radius-sm);padding:10px;margin:10px 0}
.sim-readout{padding:6px 10px;background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;font-size:0.82rem;font-weight:800;color:#1e40af;text-align:center;margin-bottom:8px;line-height:1.4}
.sim-canvas{display:block;margin:0 auto;max-width:100%;height:auto;border-radius:var(--radius-xs);touch-action:none;background:#ffffff;border:1px solid #e2e8f0}
.sim-controls{margin-top:8px;display:flex;flex-direction:column;gap:6px}
.sim-row{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:6px}
.sim-btn{min-height:44px;min-width:44px;touch-action:manipulation;background:var(--blue-lt);color:var(--blue-dk);border:1.5px solid var(--blue);border-radius:8px;padding:6px 12px;font-weight:700;font-size:.80rem;cursor:pointer;transition:all .15s;display:inline-flex;align-items:center;justify-content:center}
.sim-btn:hover{background:var(--blue);color:#fff}
.sim-btn.active{background:var(--blue);color:#fff}
.preset-bar{display:flex;flex-wrap:nowrap;overflow-x:auto;-webkit-overflow-scrolling:touch;gap:6px;justify-content:flex-start;padding:2px 4px;max-width:100%;scrollbar-width:none;touch-action:pan-x}
.preset-bar::-webkit-scrollbar{display:none}
.preset-btn{flex-shrink:0;min-height:44px;min-width:44px;touch-action:manipulation;background:#f1f5f9;border:1px solid var(--border-dk);border-radius:6px;padding:6px 12px;font-size:.78rem;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;justify-content:center}
.preset-btn:hover{border-color:var(--blue);color:var(--blue-dk);background:#eff6ff}
.sim-caption{font-size:.74rem;color:var(--muted);text-align:center;margin-top:6px;line-height:1.35}
.btn-skip{display:inline-flex;align-items:center;justify-content:center;background:none;border:none;color:var(--muted);font-size:.74rem;font-weight:700;text-decoration:underline;cursor:pointer;margin:4px auto 0;text-align:center;width:100%;min-height:44px;touch-action:manipulation}
.btn-skip:hover{color:var(--blue)}

/* ═══ HEIGHT-TIERED MEDIA QUERY CLAMPING ═══ */
@media (max-height: 700px) {
  /* 16:9 Aspect Ratio (Budget Android 360x640) */
  .brand-header { display: none; }
  .mode-bar { display: none; }
  body.assessment-mode .mode-bar { display: flex; }
  .topbar { padding: 4px 10px; gap: 6px; }
  .screen { padding: 4px 8px calc(56px + env(safe-area-inset-bottom, 16px)); min-height: 0; }
  .concept-frame { padding: 8px 10px; margin-bottom: 4px; box-sizing: border-box; }
  .concept-badge { padding: 2px 6px; font-size: 0.65rem; margin-bottom: 3px; }
  .inquiry-title { font-size: 0.88rem; margin-bottom: 3px; line-height: 1.22; }
  .concept-def { font-size: 0.80rem; line-height: 1.35; margin-bottom: 4px; max-height: 80px; overflow-y: auto; }
  .concept-def .lle-text, .concept-def .lle-text-sm { line-height: 1.35 !important; font-size: 0.80rem !important; margin: 2px 0 !important; }
  .connective-hi { font-size: 0.8em; opacity: 0.85; }
  .sim-container { padding: 6px; margin: 4px 0; border-radius: 8px; }
  .sim-readout { padding: 3px 6px; font-size: 0.74rem; margin-bottom: 4px; }
  .sim-canvas { max-height: 92px; }
  .sim-controls { margin-top: 4px; gap: 4px; }
  .preset-bar { display: flex; flex-wrap: nowrap; overflow-x: auto; -webkit-overflow-scrolling: touch; gap: 6px; justify-content: flex-start; padding: 2px 4px; touch-action: pan-x; }
  .preset-btn, .sim-btn { flex-shrink: 0; min-height: 44px; min-width: 44px; padding: 6px 10px; font-size: 0.76rem; touch-action: manipulation; }
  .sim-caption { font-size: 0.66rem; margin-top: 2px; line-height: 1.2; text-align: center; }
  .hint { font-size: 0.64rem; margin: 2px 0; text-align: center; }
  .btn-skip { margin: 2px auto 0; font-size: 0.70rem; min-height: 44px; line-height: 44px; display: inline-flex; align-items: center; justify-content: center; width: 100%; }
  .bottom-bar { padding: 6px 12px; }
  .btn-primary { padding: 10px 16px; min-height: 44px; font-size: 0.90rem; }
}

@media (min-height: 701px) and (max-height: 860px) {
  /* 19.5:9 Aspect Ratio (e.g. iPhone 390x844) & 20:9 (360x800) */
  .brand-header { padding: 4px 12px; }
  .brand-logo { width: 28px; height: 28px; }
  .brand-name { font-size: 0.75rem; }
  .brand-name-hi { display: none; }
  .brand-tagline { display: none; }
  .mode-bar { display: none; }
  body.assessment-mode .mode-bar { display: flex; }
  .topbar { padding: 6px 12px; gap: 8px; }
  .screen { padding: 6px 12px calc(60px + env(safe-area-inset-bottom, 16px)); min-height: 0; }
  .concept-frame { padding: 10px 12px; margin-bottom: 6px; }
  .inquiry-title { font-size: 0.98rem; margin-bottom: 4px; line-height: 1.3; }
  .concept-def { font-size: 0.84rem; line-height: 1.45; margin-bottom: 6px; max-height: 110px; overflow-y: auto; }
  .concept-def .lle-text, .concept-def .lle-text-sm { line-height: 1.45 !important; font-size: 0.84rem !important; margin: 2px 0 !important; }
  .sim-container { padding: 6px; margin: 6px 0; }
  .sim-readout { padding: 4px 8px; font-size: 0.78rem; margin-bottom: 6px; }
  .sim-canvas { max-height: 115px; }
  .preset-bar { display: flex; flex-wrap: nowrap; overflow-x: auto; -webkit-overflow-scrolling: touch; gap: 6px; justify-content: flex-start; padding: 2px 4px; touch-action: pan-x; }
  .preset-btn, .sim-btn { flex-shrink: 0; min-height: 44px; min-width: 44px; }
  .btn-skip { min-height: 44px; line-height: 44px; display: inline-flex; align-items: center; justify-content: center; }
  .bottom-bar { padding: 8px 14px; }
  .btn-primary { padding: 12px 16px; min-height: 44px; font-size: 0.95rem; }
}

@media (min-height: 861px) {
  /* 20:9 Aspect Ratio (e.g. Modern Pixel/Galaxy 412x915) */
  .brand-header { padding: 4px 14px; }
  .brand-logo { width: 30px; height: 30px; }
  .brand-name { font-size: 0.78rem; }
  .topbar { padding: 6px 12px; }
  .screen { padding: 6px 12px calc(60px + env(safe-area-inset-bottom, 16px)); min-height: 0; }
  .concept-frame { padding: 10px 12px; margin-bottom: 6px; box-sizing: border-box; }
  .inquiry-title { font-size: 0.98rem; margin-bottom: 4px; line-height: 1.25; }
  .concept-def { font-size: 0.86rem; line-height: 1.45; margin-bottom: 6px; max-height: 125px; overflow-y: auto; }
  .concept-def .lle-text, .concept-def .lle-text-sm { line-height: 1.45 !important; font-size: 0.86rem !important; margin: 2px 0 !important; }
  .sim-container { padding: 6px; margin: 4px 0; }
  .sim-readout { padding: 5px 8px; font-size: 0.80rem; margin-bottom: 6px; }
  .sim-canvas { max-height: 125px; }
  .preset-bar { display: flex; flex-wrap: nowrap; overflow-x: auto; -webkit-overflow-scrolling: touch; gap: 6px; justify-content: flex-start; padding: 2px 4px; touch-action: pan-x; }
  .preset-btn, .sim-btn { flex-shrink: 0; min-height: 44px; min-width: 44px; }
  .btn-skip { min-height: 44px; line-height: 44px; display: inline-flex; align-items: center; justify-content: center; }
  .bottom-bar { padding: 8px 14px; }
  .btn-primary { padding: 12px 16px; min-height: 44px; font-size: 0.95rem; }
}

/* ═══ FIXED OPAQUE BOTTOM BAR WITH BACKDROP BLUR ═══ */
.bottom-bar {
  position: fixed; bottom: 0; left: 0; right: 0;
  max-width: 520px; margin: 0 auto;
  padding: 12px 16px calc(12px + env(safe-area-inset-bottom, 16px));
  background: #ffffff;
  backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
  border-top: 1px solid var(--border);
  box-shadow: 0 -4px 16px rgba(0,0,0,.05);
  display: none; z-index: 60;
}
.btn-primary {
  width: 100%; padding: 14px; border-radius: 12px;
  font-size: 1rem; font-weight: 800;
  background: linear-gradient(135deg,var(--blue),var(--blue-dk));
  color: #fff; border: none; cursor: pointer;
  box-shadow: 0 4px 12px rgba(37,99,235,.25); transition: all .15s;
  min-height: 44px; min-width: 44px; touch-action: manipulation;
  display: inline-flex; align-items: center; justify-content: center;
}
.btn-back {
  width: auto; display: inline-block; padding: 10px 16px; margin-right: 8px;
  background: none; border: 1px solid var(--border); border-radius: 10px;
  color: var(--muted); font-size: .9rem; font-weight: 700; cursor: pointer;
  min-height: 44px; min-width: 44px; touch-action: manipulation;
}

/* ═══ WORKED EXAMPLES (WE) STYLING ═══ */
.we-card{background:#ffffff;border:2px solid var(--border);border-radius:var(--radius);padding:16px 14px;width:100%;box-shadow:var(--shadow);margin-bottom:12px;box-sizing:border-box}
.we-tag{font-size:.70rem;font-weight:800;color:var(--purple);background:var(--purple-lt);padding:2px 8px;border-radius:8px;display:inline-block;margin-bottom:6px}
.we-question{font-size:.95rem;font-weight:800;color:var(--text);margin-bottom:12px;line-height:1.4}
.we-step{background:#f8fafc;border-left:4px solid var(--blue);padding:10px 12px;border-radius:0 8px 8px 0;margin-bottom:8px;font-size:.88rem;line-height:1.6}
.we-step.green{border-left-color:var(--green);background:var(--green-lt)}
.we-step.final{border-left-color:var(--amber);background:var(--amber-lt);font-weight:700}

/* ═══ QUIZ CARDS & OPTIONS STYLING ═══ */
.quiz-card{background:#ffffff;border:2px solid var(--border);border-radius:var(--radius);padding:14px;width:100%;box-shadow:var(--shadow);margin-bottom:12px;box-sizing:border-box}
.quiz-tag{font-size:.68rem;font-weight:800;color:var(--blue-dk);background:var(--blue-lt);padding:2px 8px;border-radius:6px;display:inline-block;margin-bottom:6px}
.quiz-question, .quiz-q{font-size:.92rem;font-weight:800;color:var(--text);margin-bottom:10px;line-height:1.4}
.quiz-opts-container{display:flex;flex-direction:column;gap:6px}
.quiz-opt{display:flex;align-items:center;gap:10px;padding:10px 12px;border:1.5px solid var(--border);border-radius:10px;cursor:pointer;transition:all .15s;min-height:44px;touch-action:manipulation;background:#ffffff}
.quiz-opt:hover{border-color:var(--blue);background:#f8fafc}
.quiz-opt.selected{border-color:var(--blue);background:var(--blue-lt)}
.quiz-opt.correct{border-color:var(--green);background:var(--green-lt)}
.quiz-opt.wrong{border-color:var(--red);background:var(--red-lt)}
.quiz-radio{width:18px;height:18px;border:2px solid var(--border-dk);border-radius:50%;flex-shrink:0;transition:all .15s}
.quiz-opt.selected .quiz-radio{border-color:var(--blue);background:var(--blue)}
.quiz-opt.correct .quiz-radio{border-color:var(--green);background:var(--green)}
.quiz-opt.wrong .quiz-radio{border-color:var(--red);background:var(--red)}
.quiz-opt-text{font-size:.88rem;color:var(--text);flex:1;line-height:1.35}
.quiz-feedback{margin-top:8px}
.feedback{padding:8px 12px;border-radius:8px;font-size:.84rem;font-weight:700;line-height:1.4}
.feedback.ok{background:var(--green-lt);color:var(--green-dk);border:1px solid #bbf7d0}
.feedback.no{background:var(--red-lt);color:var(--red);border:1px solid #fecaca}
.misconception{margin-top:6px;padding:8px 10px;background:#fffbeb;border:1px solid #fde68a;border-radius:8px;font-size:.80rem;color:#92400e;line-height:1.45}

/* ═══ HINT BOX STYLING ═══ */
.hint-box{margin-top:8px}
.hint-btn{background:none;border:none;color:var(--blue);font-size:.78rem;font-weight:800;cursor:pointer;padding:4px 0;display:inline-flex;align-items:center;gap:4px;min-height:36px;touch-action:manipulation}
.hint-btn:hover{text-decoration:underline}
.hint-tier-label{font-size:.70rem;color:var(--muted);font-weight:600}
.hint-text{margin-top:6px;padding:8px 10px;background:#f1f5f9;border-left:3px solid var(--blue);border-radius:0 6px 6px 0;font-size:.82rem;line-height:1.45;color:var(--text)}

/* ═══ MILESTONE & HERO ═══ */
.intro-hero{font-size:3rem;margin-bottom:8px}
.milestone-box{text-align:center;padding:24px 16px;background:#ffffff;border:2px solid var(--border);border-radius:var(--radius);width:100%}
.milestone-icon{font-size:3.5rem;margin-bottom:8px}
.milestone-title{font-size:1.25rem;font-weight:900;color:var(--brand);margin-bottom:4px}
.milestone-sub{font-size:.9rem;color:var(--muted);margin-bottom:12px}
.milestone-reward{font-size:1rem;font-weight:800;color:var(--amber);background:var(--amber-lt);padding:6px 16px;border-radius:20px;display:inline-block}

/* ═══ LLE #wordDialog MODAL ═══ */
.lle-dialog{border:none;border-radius:18px;padding:0;box-shadow:0 12px 36px rgba(0,0,0,.25);background:var(--surface);max-width:380px;width:90%;margin:auto}
.lle-dialog::backdrop{background:rgba(15,23,42,.65);backdrop-filter:blur(3px)}
.dlg-content{padding:18px;display:flex;flex-direction:column;gap:10px}
.dlg-header{display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #e2e8f0;padding-bottom:8px}
.dlg-badge{font-size:.68rem;font-weight:800;letter-spacing:.05em;color:var(--blue-dk);background:var(--blue-lt);padding:2px 8px;border-radius:12px}
.dlg-close-x{background:none;border:none;font-size:1.2rem;color:#64748b;cursor:pointer;padding:2px 6px;min-width:44px;min-height:44px;display:inline-flex;align-items:center;justify-content:center;border-radius:8px;touch-action:manipulation}
.dlg-close-x:hover{background:#f1f5f9;color:#0f172a}
.dlg-word-row{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:4px}
.dlg-word{font-size:1.5rem;font-weight:900;color:#1e293b}
.dlg-audio-btn{display:inline-flex;align-items:center;justify-content:center;gap:4px;background:#f1f5f9;border:1px solid #cbd5e1;border-radius:20px;padding:4px 12px;font-size:.78rem;font-weight:800;color:#0f172a;cursor:pointer;min-height:44px;min-width:44px;touch-action:manipulation}
.dlg-phonics-row{display:flex;align-items:baseline;gap:6px;background:#f8fafc;padding:6px 10px;border-radius:8px;border-left:3px solid #8b5cf6}
.dlg-phonics-label{font-size:.75rem;font-weight:700;color:#64748b}
.dlg-phonics{font-size:.95rem;font-weight:800;color:#6d28d9}
.dlg-meaning-row{display:flex;flex-direction:column;gap:3px;background:#f0fdf4;padding:8px 10px;border-radius:8px;border-left:3px solid #22c55e}
.dlg-meaning-label{font-size:.75rem;font-weight:700;color:#15803d}
.dlg-hindi{font-size:1.05rem;font-weight:800;color:#166534}
.dlg-desc{font-size:.72rem;color:#64748b;line-height:1.4}
.dlg-btn{width:100%;margin-top:6px;padding:12px;background:linear-gradient(135deg,#3b82f6,#2563eb);color:#fff;border:none;border-radius:12px;font-size:.92rem;font-weight:800;cursor:pointer;min-height:44px;touch-action:manipulation}

/* ═══ CONFETTI CANVAS ═══ */
#confettiCanvas{position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:99}
</style>
</head>
<body>
<div class="app">
  <!-- Brand Header -->
  <div class="brand-header">
    <div class="brand-logo">
      <svg viewBox="0 0 44 44" fill="none">
        <rect width="44" height="44" rx="10" fill="#2563eb"/>
        <path d="M12 32L22 12L32 32H26L22 23L18 32H12Z" fill="#ffffff"/>
      </svg>
    </div>
    <div class="brand-info">
      <div class="brand-name">AASHA LEARNING ECOSYSTEM</div>
      <div class="brand-name-hi">आशा शिक्षण प्रणाली • कक्षा 8 गणित</div>
      <div class="brand-tagline">Squares &amp; Cubes (पूर्ण वर्ग और घन संख्याएँ) • 100% Textbook Exercises</div>
    </div>
  </div>

  <!-- Topbar -->
  <div class="topbar">
    <button class="exit-btn" onclick="App.exit()" title="Exit to Overview">✕</button>
    <div class="progress-track"><div class="progress-fill" id="progressFill"></div></div>
    <div class="stat coins">🪙 <span id="statCoins">0</span></div>
    <div class="stat xp">⭐ <span id="statXp">0</span></div>
    <div class="stat lvl" id="statLvl">Lv 1</div>
    <div class="stat streak" id="statStreakWrap" style="display:none">🔥 <span id="statStreak">0</span></div>
  </div>

  <!-- Mode Bar (Tabs) -->
  <div class="mode-bar" id="modeBar">
    <button class="mode-btn active" id="tabBtnConcept" onclick="App.switchTab('concept')">📖 Concept</button>
    <button class="mode-btn" id="tabBtnWarmup" onclick="App.switchTab('warmup')">⚡ Warm-Up (12)</button>
    <button class="mode-btn" id="tabBtnDeepDive" onclick="App.switchTab('deep_dive')">🏊 Deep Dive (14)</button>
    <button class="mode-btn" id="tabBtnBoss" onclick="App.switchTab('boss')">👑 Boss (8)</button>
  </div>

  <!-- Screen Content: Concept Journey Views -->
  <div class="screen" id="stepContainer">
    <!-- View 1: Intro -->
    <div id="viewIntro" style="width:100%"></div>

    <!-- View 2: Concept with <aasha-sim> -->
    <div id="viewConcept" style="width:100%;display:none">
      <div class="concept-frame">
        <span class="concept-badge" id="conceptBadge">Concept Node</span>
        <h2 class="inquiry-title" id="conceptTitle"></h2>
        <div class="concept-def" id="conceptDef"></div>
        <aasha-sim id="conceptSim">
          <div class="sim-container">
            <div class="sim-readout" id="simReadout">Loading simulation...</div>
            <canvas id="conceptCanvas" class="sim-canvas"></canvas>
            <div class="sim-controls" id="conceptControls"></div>
            <div class="sim-caption" id="simCaption"></div>
          </div>
        </aasha-sim>
        <button class="btn-skip" onclick="App.next()">Skip this activity →</button>
      </div>
    </div>

    <!-- View 3: Worked Examples -->
    <div id="viewWorked" style="width:100%;display:none"></div>

    <!-- View 4: Inline Quiz Check -->
    <div id="viewQuiz" style="width:100%;display:none"></div>

    <!-- View 5: Node Progress Milestone -->
    <div id="viewProgress" style="width:100%;display:none"></div>
  </div>

  <!-- 3-Tier Gamified Assessment Container -->
  <div class="screen" id="assessmentContainer" style="display:none">
    <div id="section-warmup" style="width:100%;display:none">
      <div class="concept-badge" style="background:#fef3c7;color:#92400e;margin-bottom:10px">Tier 1: Warm-Up (12 Questions • Foundation Recall)</div>
      ${warmupHtml}
    </div>
    <div id="section-deep_dive" style="width:100%;display:none">
      <div class="concept-badge" style="background:#e0e7ff;color:#3730a3;margin-bottom:10px">Tier 2: Deep Dive (14 Questions • Multi-Step Reasoning)</div>
      ${deepDiveHtml}
    </div>
    <div id="section-boss" style="width:100%;display:none">
      <div class="concept-badge" style="background:#fce7f3;color:#9d174d;margin-bottom:10px">Tier 3: Boss Challenge (8 Questions • Mastery &amp; Puzzles)</div>
      ${bossHtml}
    </div>
  </div>

  <!-- Bottom Navigation Bar -->
  <div class="bottom-bar" id="bottomBar">
    <div style="display:flex;align-items:center;justify-content:center;max-width:520px;margin:0 auto;width:100%">
      <button class="btn-back" id="backBtn" onclick="App.goBack()" style="display:none">← Back</button>
      <button class="btn-primary" id="continueBtn" onclick="App.next()">Continue →</button>
    </div>
  </div>
</div>

<!-- LLE Indic Vocabulary Dialog -->
<dialog id="wordDialog" class="lle-dialog">
  <div class="dlg-content">
    <div class="dlg-header">
      <span class="dlg-badge">AASHA LLE BILINGUAL BRIDGE</span>
      <button class="dlg-close-x" onclick="document.getElementById('wordDialog').close();document.getElementById('wordDialog').style.display='none'">✕</button>
    </div>
    <div class="dlg-word-row">
      <span class="dlg-word" id="dlgWord">Word</span>
      <button class="dlg-audio-btn" id="dlgAudioBtn" onclick="speakCurrentWord()" title="Listen to pronunciation">🔊 बोलें</button>
    </div>
    <div class="dlg-phonics-row">
      <span class="dlg-phonics-label">उच्चारण (Phonics):</span>
      <span class="dlg-phonics" id="dlgPhonics">—</span>
    </div>
    <div class="dlg-meaning-row">
      <span class="dlg-meaning-label">सरल अर्थ (Meaning):</span>
      <span class="dlg-hindi" id="dlgHindi">—</span>
    </div>
    <div class="dlg-desc" id="dlgDesc">Aasha Universal Teaching Vocabulary (आशा शिक्षण शब्दावली)</div>
    <button class="dlg-btn" onclick="document.getElementById('wordDialog').close();document.getElementById('wordDialog').style.display='none'">ठीक है (Got It)</button>
  </div>
</dialog>

<!-- Confetti FX Canvas -->
<canvas id="confettiCanvas"></canvas>

<script>
// ═══ LLE BILINGUAL VOCABULARY & CONNECTIVES ═══
var CONN = {
  "if": "यदि / अगर", "because": "क्योंकि", "therefore": "इसलिए", "however": "हालांकि / लेकिन",
  "so that": "ताकि", "in order to": "के लिए", "which means": "जिसका अर्थ है", "although": "यद्यपि / भले ही",
  "unless": "जब तक कि नहीं", "due to": "के कारण", "for example": "उदाहरण के लिए", "since": "चूँकि",
  "then": "तब / तो", "when": "जब", "while": "जबकि", "instead of": "के बजाय", "that is why": "इसीलिए",
  "in other words": "दूसरे शब्दों में", "similarly": "इसी प्रकार / वैसे ही", "thus": "इस प्रकार",
  "hence": "अतः", "also": "भी", "but": "परंतु / लेकिन", "or": "या", "and": "और", "finally": "अंत में"
};

var WM = ${JSON.stringify(fullDict, null, 2)};
window.WM = WM;

// ═══ PRE-LLE MATHEMATICAL FORMULA & VARIABLE INSULATION ═══
function insulateMathContent(raw) {
  if (!raw) return { text: '', tokens: {} };
  var tokens = {};
  var c = 0;

  // 1. LaTeX display & inline delimiters
  raw = raw.replace(/\\[\\[\s\\S]*?\\]\\]/g, function(m){
    var k = '__AASHA_MATH_' + (c++) + '__';
    tokens[k] = '<span class="math-var" data-math="true">' + m + '</span>';
    return k;
  });
  raw = raw.replace(/\\\\\\([\\s\\S]*?\\\\\\)/g, function(m){
    var k = '__AASHA_MATH_' + (c++) + '__';
    tokens[k] = '<span class="math-var" data-math="true">' + m + '</span>';
    return k;
  });
  raw = raw.replace(/\\$\\$[\\s\\S]*?\\$\\$/g, function(m){
    var k = '__AASHA_MATH_' + (c++) + '__';
    tokens[k] = '<span class="math-var" data-math="true">' + m + '</span>';
    return k;
  });

  // 2. Pre-existing math tags
  raw = raw.replace(/<span[^>]*class=["'][^"']*(?:math-var|math)[^"']*["'][^>]*>[\\s\\S]*?<\\/span>/gi, function(m){
    var k = '__AASHA_MATH_' + (c++) + '__';
    tokens[k] = m;
    return k;
  });

  // 3. Algebraic powers and variables
  raw = raw.replace(/\\b([a-zA-Z])\\^([23])\\b/g, function(m, v, p){
    var k = '__AASHA_MATH_' + (c++) + '__';
    tokens[k] = '<span class="math-var" data-math="true">' + v + '<sup>' + p + '</sup></span>';
    return k;
  });
  raw = raw.replace(/\\b2([a-zA-Z])\\b/g, function(m, v){
    var k = '__AASHA_MATH_' + (c++) + '__';
    tokens[k] = '<span class="math-var" data-math="true">2' + v + '</span>';
    return k;
  });

  return { text: raw, tokens: tokens };
}

function rt(text, sm) {
  var cls = sm ? 'lle-text-sm' : 'lle-text';
  var raw = text || '';

  var ins = insulateMathContent(raw);
  var html = ins.text;
  var tokens = ins.tokens;

  html = html.replace(/(-?\\d+)\\/(\\d+)/g, '<span class="frac"><span class="frac-top">$1</span><span class="frac-bot">$2</span></span>');

  var keys = Object.keys(CONN).sort(function(a,b){ return b.length - a.length; });
  var connCount = 0, result = '', i = 0;

  while (i < html.length) {
    var ch = html[i];

    if (html.substring(i, i + 13) === '__AASHA_MATH_') {
      var endTok = html.indexOf('__', i + 13);
      if (endTok !== -1) {
        var tokKey = html.substring(i, endTok + 2);
        result += tokens[tokKey] || tokKey;
        i = endTok + 2;
        continue;
      }
    }

    if (ch === '.' || ch === '!' || ch === '?') { connCount = 0; result += ch; i++; continue; }
    if (ch === '<') {
      var ci = html.indexOf('>', i);
      if (ci >= 0) { result += html.substring(i, ci + 1); i = ci + 1; continue; }
    }

    var matched = false;
    if (i === 0 || !/[a-zA-Z]/.test(html[i-1])) {
      for (var k = 0; k < keys.length; k++) {
        var c = keys[k];
        var sub = html.substring(i, i + c.length);
        if (sub.toLowerCase() === c.toLowerCase()) {
          var ai = i + c.length;
          if (ai < html.length && /[a-zA-Z]/.test(html[ai])) continue;
          var hi = CONN[c];
          connCount++;
          if (connCount <= 2) {
            result += '<span class="connective" data-w="' + sub + '" data-h="' + hi + '">' + sub + ' <span class="connective-hi">(' + hi + ')</span></span>';
          } else {
            result += '<span class="word" data-w="' + sub.toLowerCase() + '" data-h="' + hi + '">' + sub + '</span>';
          }
          i += c.length; matched = true; break;
        }
      }
    }
    if (matched) continue;

    if (/[a-zA-Z]/.test(ch)) {
      var ws = i;
      while (i < html.length && /[a-zA-Z]/.test(html[i])) i++;
      var word = html.substring(ws, i);
      var cw = word.toLowerCase();

      var isSingleVar = /^[snmpqbcxyzk]$/.test(cw);
      if (isSingleVar) {
        result += '<span class="math-var" data-math="true">' + word + '</span>';
      } else {
        var hiVal = WM[cw] || '';
        result += '<span class="word" data-w="' + cw + '" data-h="' + (hiVal ? hiVal.replace(/"/g, '&quot;') : '') + '">' + word + '</span>';
      }
    } else {
      result += ch; i++;
    }
  }

  for (var tk in tokens) {
    if (result.indexOf(tk) !== -1) {
      result = result.replace(new RegExp(tk, 'g'), tokens[tk]);
    }
  }

  return '<div class="' + cls + '">' + result + '</div>';
}

document.addEventListener('click', function(e) {
  var el = e.target.closest('.connective');
  if (el) { showWord(el.getAttribute('data-w'), el.getAttribute('data-h'), 'Connecting word (जोड़ने वाला शब्द)'); return; }
  el = e.target.closest('.word');
  if (el) { showWord(el.getAttribute('data-w'), el.getAttribute('data-h'), 'Aasha Universal Teaching Vocabulary (आशा शिक्षण शब्दावली)'); return; }
});

function speakCurrentWord() {
  var w = document.getElementById('dlgWord').textContent;
  if (!w) return;
  if ('speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
      var u = new SpeechSynthesisUtterance(w);
      var voices = window.speechSynthesis.getVoices() || [];
      var v = voices.find(function(voice) { return voice.lang === 'en-IN'; }) ||
              voices.find(function(voice) { return voice.lang.startsWith('en'); }) ||
              voices[0];
      if (v) { u.voice = v; u.lang = v.lang; }
      else { u.lang = 'en-IN'; }
      u.rate = 0.85;
      window.speechSynthesis.speak(u);
    } catch(e){}
  }
}

function showWord(w, h, d) {
  var dlg = document.getElementById('wordDialog');
  var cw = (w || '').toLowerCase().trim();
  document.getElementById('dlgWord').textContent = w;

  var fullVal = (h && h !== '—' && h !== '') ? h : (WM[cw] || '');
  if (!fullVal) {
    var stems = [
      cw.replace(/s$/, ''), cw.replace(/es$/, ''), cw.replace(/ed$/, ''),
      cw.replace(/d$/, ''), cw.replace(/ing$/, ''), cw.replace(/ly$/, ''),
      cw.replace(/tion$/, ''), cw.replace(/ment$/, '')
    ];
    for (var i = 0; i < stems.length; i++) {
      var st = stems[i];
      if (st && WM[st]) { fullVal = WM[st]; break; }
    }
  }

  var meaning = fullVal;
  var phonics = cw;

  if (fullVal) {
    var mMatch = fullVal.match(/^(.*?)\\s*\\((.*?)\\)$/);
    if (mMatch) {
      meaning = mMatch[1].trim();
      phonics = mMatch[2].trim();
    }
  } else {
    meaning = cw;
    phonics = cw;
  }

  document.getElementById('dlgPhonics').textContent = phonics;
  document.getElementById('dlgHindi').textContent = meaning;
  document.getElementById('dlgDesc').textContent = d || 'Aasha Universal Teaching Vocabulary (आशा शिक्षण शब्दावली)';

  dlg.style.display = 'block';
  if (typeof dlg.showModal === 'function' && !dlg.open) dlg.showModal();
  setTimeout(speakCurrentWord, 200);
}

// ═══ PROCEDURAL WEB AUDIO SYNTHESIZER ═══
var _audioCtx = null;
function playTone(type) {
  try {
    if (!_audioCtx) _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (_audioCtx.state === 'suspended') _audioCtx.resume();
    var osc = _audioCtx.createOscillator(), gain = _audioCtx.createGain();
    osc.connect(gain); gain.connect(_audioCtx.destination);
    var now = _audioCtx.currentTime;
    if (type === 'tap') {
      osc.frequency.setValueAtTime(440, now);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.start(now); osc.stop(now + 0.08);
    } else if (type === 'correct') {
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.setValueAtTime(659.25, now + 0.1);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
      osc.start(now); osc.stop(now + 0.28);
    } else if (type === 'wrong') {
      osc.frequency.setValueAtTime(260, now);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.start(now); osc.stop(now + 0.25);
    } else if (type === 'levelup') {
      [523.25, 659.25, 783.99, 1046.5].forEach(function(freq, idx) {
        var o = _audioCtx.createOscillator(), g = _audioCtx.createGain();
        o.connect(g); g.connect(_audioCtx.destination);
        o.frequency.setValueAtTime(freq, now + idx * 0.09);
        g.gain.setValueAtTime(0.1, now + idx * 0.09);
        g.gain.exponentialRampToValueAtTime(0.001, now + (idx + 1) * 0.09 + 0.15);
        o.start(now + idx * 0.09); o.stop(now + (idx + 1) * 0.09 + 0.15);
      });
    }
  } catch(e){}
}

// ═══ HTML5 CANVAS CONFETTI PARTICLE ENGINE ═══
function fireConfetti(count) {
  var canvas = document.getElementById('confettiCanvas');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth; canvas.height = window.innerHeight;
  var particles = [];
  for (var i = 0; i < (count || 50); i++) {
    particles.push({
      x: canvas.width / 2, y: canvas.height / 2,
      vx: (Math.random() - 0.5) * 12, vy: (Math.random() - 0.7) * 14,
      size: Math.random() * 8 + 4,
      color: ['#2563eb', '#16a34a', '#d97706', '#7c3aed', '#dc2626'][Math.floor(Math.random() * 5)],
      life: 60
    });
  }
  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    var active = false;
    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      if (p.life > 0) {
        active = true; p.x += p.vx; p.y += p.vy; p.vy += 0.3; p.life--;
        ctx.fillStyle = p.color; ctx.fillRect(p.x, p.y, p.size, p.size);
      }
    }
    if (active) requestAnimationFrame(animate);
    else ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
  requestAnimationFrame(animate);
}

// ═══ AASHA EXPERIENCE CONTRACT & SIMULATION ADAPTERS ═══
class AashaExperienceContract {
  mount(container, config) { throw new Error('mount() must be implemented'); }
  getState() { throw new Error('getState() must be implemented'); }
  pause() { /* Non-destructive pause */ }
  resume() { /* Non-destructive resume */ }
  reset() { throw new Error('reset() must be implemented'); }
  destroy() { throw new Error('destroy() must be implemented'); }

  emitTelemetry(eventType, payload) {
    var event = new CustomEvent('aasha:telemetry', {
      bubbles: true, composed: true,
      detail: { timestamp: Date.now(), foundationId: this.foundationId || 'F00', experienceId: this.experienceId || 'generic', eventType: eventType, payload: payload }
    });
    if (this.container && typeof this.container.dispatchEvent === 'function') {
      this.container.dispatchEvent(event);
    }
  }

  emitStateChange(newState) {
    var event = new CustomEvent('aasha:state_change', {
      bubbles: true, composed: true,
      detail: { timestamp: Date.now(), foundationId: this.foundationId || 'F00', experienceId: this.experienceId || 'generic', state: newState }
    });
    if (this.container && typeof this.container.dispatchEvent === 'function') {
      this.container.dispatchEvent(event);
    }
  }
}

class AashaExperienceAdapter extends AashaExperienceContract {
  constructor(metadata) {
    super();
    metadata = metadata || {};
    this.foundationId = metadata.foundationId || 'F00';
    this.foundationName = metadata.foundationName || 'Unknown';
    this.experienceId = metadata.experienceId || 'adapter';
    this.container = null;
    this.config = {};
    this.state = {};
    this.isPaused = false;
  }
  mount(container, config) { this.container = container; this.config = config || {}; this.state = Object.assign({}, config && config.initialState); this.isPaused = false; }
  getState() { return Object.assign({}, this.state); }
  pause() { this.isPaused = true; }
  resume() { this.isPaused = false; }
  reset() { this.state = Object.assign({}, this.config && this.config.initialState); }
  destroy() { this.pause(); this.container = null; }
}

class AashaSimElement extends HTMLElement {
  constructor() { super(); this._adapter = null; }
  connectedCallback() { this.style.display = 'block'; this.style.width = '100%'; this.style.position = 'relative'; }
  disconnectedCallback() { if (this._adapter && typeof this._adapter.destroy === 'function') { this._adapter.destroy(); } }
  bindAdapter(adapter, config) {
    if (this._adapter && typeof this._adapter.destroy === 'function') this._adapter.destroy();
    this._adapter = adapter;
    if (this._adapter && typeof this._adapter.mount === 'function') this._adapter.mount(this, config);
  }
  get adapter() { return this._adapter; }
}
if (!customElements.get('aasha-sim')) {
  customElements.define('aasha-sim', AashaSimElement);
}

// ═══ 5 PROCEDURAL SIMULATION DRAW ENGINES ═══

// 1. 2D Square Grid & Gnomon Visualizer Sim
function drawSquareGridSim(canvas, s, peeledCount, highlightGnomon) {
  if (!canvas) return;
  var ctx = canvas.getContext('2d'); var w = canvas.width, h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  s = Math.max(1, Math.min(10, s || 5));
  peeledCount = Math.max(0, Math.min(s - 1, peeledCount || 0));

  var pad = 10;
  var maxGridH = h - pad * 2;
  var maxGridW = Math.min(maxGridH, Math.floor(w * 0.44));
  var cellSize = Math.floor(maxGridW / s);
  cellSize = Math.max(8, Math.min(22, cellSize));
  var gridW = cellSize * s, gridH = cellSize * s;
  var gridX = pad + 4, gridY = Math.floor((h - gridH) / 2);

  var layerColors = ['#f59e0b', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316', '#6366f1', '#14b8a6', '#84cc16'];

  for (var r = 0; r < s; r++) {
    for (var c = 0; c < s; c++) {
      var layer = Math.max(r, c) + 1;
      var isPeeled = (s - layer) < peeledCount;
      var isOutermost = (layer === s);
      var cx = gridX + c * cellSize;
      var cy = gridY + (s - 1 - r) * cellSize;
      var baseCol = layerColors[(layer - 1) % layerColors.length];

      if (isPeeled) {
        ctx.fillStyle = 'rgba(241, 245, 249, 0.4)';
        ctx.fillRect(cx + 1, cy + 1, cellSize - 2, cellSize - 2);
        ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 1;
        ctx.setLineDash([2, 2]); ctx.strokeRect(cx + 1, cy + 1, cellSize - 2, cellSize - 2);
        ctx.setLineDash([]);
      } else {
        ctx.fillStyle = baseCol; ctx.fillRect(cx + 1, cy + 1, cellSize - 2, cellSize - 2);
        ctx.strokeStyle = (isOutermost && highlightGnomon) ? '#dc2626' : '#ffffff';
        ctx.lineWidth = (isOutermost && highlightGnomon) ? 2 : 1;
        ctx.strokeRect(cx + 1, cy + 1, cellSize - 2, cellSize - 2);
      }
    }
  }

  ctx.fillStyle = '#1e3a5f'; ctx.font = 'bold 10px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('s = ' + s, gridX + gridW / 2, gridY + gridH + 11);

  var rx = gridX + gridW + 16;
  var area = s * s, activeS = s - peeledCount, activeArea = activeS * activeS;
  var gnomonUnits = 2 * s - 1;

  ctx.textAlign = 'left';
  ctx.fillStyle = '#0f172a'; ctx.font = 'bold 12px sans-serif';
  ctx.fillText('Area = ' + s + ' × ' + s + ' = ' + area + ' unit squares', rx, gridY + 14);

  ctx.fillStyle = '#2563eb'; ctx.font = 'bold 11px sans-serif';
  var oddTerms = [];
  for (var k = 1; k <= s; k++) oddTerms.push(2 * k - 1);
  var oddStr = oddTerms.slice(0, 4).join(' + ') + (s > 4 ? ' + ... + ' + (2 * s - 1) : '');
  ctx.fillText('Sum of ' + s + ' Odds: ' + oddStr + ' = ' + area, rx, gridY + 34);

  ctx.fillStyle = '#d97706'; ctx.font = 'bold 11px sans-serif';
  ctx.fillText('Outer Gnomon (Layer ' + s + '): 2(' + s + ') - 1 = ' + gnomonUnits, rx, gridY + 54);

  ctx.fillStyle = peeledCount > 0 ? '#16a34a' : '#64748b'; ctx.font = '10px sans-serif';
  if (peeledCount > 0) {
    ctx.fillText('Peeled ' + peeledCount + ' layer(s) ➔ Remaining: ' + activeS + '² = ' + activeArea, rx, gridY + 74);
  } else {
    ctx.fillText('Repeated Subtractions: ' + area + ' - 1 - 3 - 5... (' + s + ' steps ➔ √' + area + ' = ' + s + ')', rx, gridY + 74);
  }
}

// 2. 3D Isometric Cube Stacker Sim
function drawIsoCubeSim(canvas, n, sliced, showOddSum) {
  if (!canvas) return;
  var ctx = canvas.getContext('2d'); var w = canvas.width, h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  n = Math.max(1, Math.min(5, n || 3));
  var totalCubes = n * n * n;
  var cos30 = 0.8660254, sin30 = 0.5;
  var layerGap = sliced ? 12 : 0;
  var blockSize = Math.min(17, Math.floor((h - 28) / (n + n * sin30 + (sliced ? (n - 1) * 0.7 : 0))));
  blockSize = Math.max(8, blockSize);

  var cx = Math.floor(w * 0.28);
  var cy = Math.floor(h * 0.54) + (sliced ? Math.floor((n * layerGap) / 3) : 0);

  var layerPalettes = [
    { top: '#93c5fd', left: '#3b82f6', right: '#1d4ed8' },
    { top: '#86efac', left: '#22c55e', right: '#15803d' },
    { top: '#fde047', left: '#eab308', right: '#a16207' },
    { top: '#f472b6', left: '#ec4899', right: '#be185d' },
    { top: '#c084fc', left: '#a855f7', right: '#7e22ce' }
  ];

  for (var z = 0; z < n; z++) {
    var zOffset = z * blockSize + (sliced ? z * layerGap : 0);
    var palette = layerPalettes[z % layerPalettes.length];

    for (var y = 0; y < n; y++) {
      for (var x = 0; x < n; x++) {
        var u = cx + (x - y) * blockSize * cos30;
        var v = cy + (x + y) * blockSize * sin30 - zOffset;

        ctx.fillStyle = palette.top;
        ctx.beginPath();
        ctx.moveTo(u, v);
        ctx.lineTo(u + blockSize * cos30, v + blockSize * sin30);
        ctx.lineTo(u, v + 2 * blockSize * sin30);
        ctx.lineTo(u - blockSize * cos30, v + blockSize * sin30);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = 'rgba(15, 23, 42, 0.3)'; ctx.lineWidth = 0.8; ctx.stroke();

        ctx.fillStyle = palette.left;
        ctx.beginPath();
        ctx.moveTo(u - blockSize * cos30, v + blockSize * sin30);
        ctx.lineTo(u, v + 2 * blockSize * sin30);
        ctx.lineTo(u, v + 2 * blockSize * sin30 + blockSize);
        ctx.lineTo(u - blockSize * cos30, v + blockSize * sin30 + blockSize);
        ctx.closePath(); ctx.fill(); ctx.stroke();

        ctx.fillStyle = palette.right;
        ctx.beginPath();
        ctx.moveTo(u, v + 2 * blockSize * sin30);
        ctx.lineTo(u + blockSize * cos30, v + blockSize * sin30);
        ctx.lineTo(u + blockSize * cos30, v + blockSize * sin30 + blockSize);
        ctx.lineTo(u, v + 2 * blockSize * sin30 + blockSize);
        ctx.closePath(); ctx.fill(); ctx.stroke();
      }
    }
  }

  var rx = Math.floor(w * 0.52);
  ctx.textAlign = 'left';
  ctx.fillStyle = '#0f172a'; ctx.font = 'bold 12px sans-serif';
  ctx.fillText('Volume = ' + n + '³ = ' + totalCubes + ' unit cubes', rx, 18);

  ctx.fillStyle = '#2563eb'; ctx.font = 'bold 11px sans-serif';
  var layerCount = n * n;
  ctx.fillText(n + ' layers of ' + layerCount + ' cubes = ' + totalCubes, rx, 36);

  var firstOdd = n * (n - 1) + 1;
  var oddList = [];
  for (var ok = 0; ok < n; ok++) oddList.push(firstOdd + 2 * ok);

  ctx.fillStyle = '#d97706'; ctx.font = 'bold 11px sans-serif';
  ctx.fillText('Odd Sum Property (Group ' + n + '):', rx, 54);

  ctx.fillStyle = '#1e3a8a'; ctx.font = '10px sans-serif';
  ctx.fillText(oddList.join(' + ') + ' = ' + totalCubes, rx, 70);

  ctx.fillStyle = '#64748b'; ctx.font = '10px sans-serif';
  if (sliced) {
    ctx.fillText('✓ Sliced: ' + n + ' slabs of ' + layerCount + ' unit cubes each', rx, 88);
  } else {
    ctx.fillText('Trailing zeros: multiples of 3 (e.g. 10³=1000, 20³=8000)', rx, 88);
  }
}

// 3. Prime Factor Grouping Tree Sim
function drawPrimeFactorSim(canvas, N, mode) {
  if (!canvas) return;
  var ctx = canvas.getContext('2d'); var w = canvas.width, h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  N = N || 144;
  mode = mode || 'square';

  var factors = [];
  var temp = N;
  var d = 2;
  while (d * d <= temp) {
    while (temp % d === 0) {
      factors.push(d);
      temp = Math.floor(temp / d);
    }
    d = (d === 2) ? 3 : d + 2;
  }
  if (temp > 1) factors.push(temp);

  var counts = {};
  for (var i = 0; i < factors.length; i++) counts[factors[i]] = (counts[factors[i]] || 0) + 1;

  var isPerfect = true, rootVal = 1, multiplier = 1, divisor = 1;

  if (mode === 'square') {
    for (var p in counts) {
      var prime = parseInt(p, 10);
      var c = counts[p];
      rootVal *= Math.pow(prime, Math.floor(c / 2));
      if (c % 2 !== 0) {
        isPerfect = false; multiplier *= prime; divisor *= prime;
      }
    }
  } else {
    for (var p2 in counts) {
      var prime2 = parseInt(p2, 10);
      var c2 = counts[p2];
      rootVal *= Math.pow(prime2, Math.floor(c2 / 3));
      var rem = c2 % 3;
      if (rem !== 0) {
        isPerfect = false;
        if (rem === 1) { multiplier *= prime2 * prime2; divisor *= prime2; }
        if (rem === 2) { multiplier *= prime2; divisor *= prime2 * prime2; }
      }
    }
  }

  var lx = 14, ly = 16;
  ctx.fillStyle = '#1e3a5f'; ctx.font = 'bold 11px monospace'; ctx.textAlign = 'left';
  ctx.fillText('Ladder:', lx, ly);

  var curr = N;
  var ladderY = ly + 14;
  for (var k = 0; k < Math.min(factors.length, 5); k++) {
    var f = factors[k];
    ctx.fillStyle = '#2563eb';
    ctx.fillText(f + ' | ' + curr, lx, ladderY);
    curr = Math.floor(curr / f);
    ladderY += 13;
  }
  if (factors.length > 5) ctx.fillText('  | ... = 1', lx, ladderY);
  else ctx.fillText('  | 1', lx, ladderY);

  var rx = 105;
  ctx.textAlign = 'left';
  ctx.fillStyle = '#0f172a'; ctx.font = 'bold 12px sans-serif';
  ctx.fillText(N + ' = ' + factors.join(' × '), rx, 18);

  var tokenX = rx, tokenY = 28;
  var groupSize = (mode === 'square') ? 2 : 3;
  var tokenR = 9;

  var primeKeys = Object.keys(counts).map(Number);
  for (var pk = 0; pk < primeKeys.length; pk++) {
    var pVal = primeKeys[pk];
    var pCount = counts[pVal];
    var fullGroups = Math.floor(pCount / groupSize);
    var orphans = pCount % groupSize;

    for (var g = 0; g < fullGroups; g++) {
      var groupStartX = tokenX;
      for (var gi = 0; gi < groupSize; gi++) {
        ctx.fillStyle = '#dcfce7'; ctx.strokeStyle = '#16a34a';
        ctx.beginPath(); ctx.arc(tokenX + tokenR, tokenY + tokenR, tokenR, 0, Math.PI * 2);
        ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#14532d'; ctx.font = 'bold 10px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(pVal, tokenX + tokenR, tokenY + tokenR + 3);
        tokenX += tokenR * 2 + 3;
      }
      ctx.strokeStyle = '#16a34a'; ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(groupStartX + 2, tokenY + tokenR * 2 + 2);
      ctx.lineTo(tokenX - 5, tokenY + tokenR * 2 + 2);
      ctx.stroke();
      tokenX += 6;
    }

    for (var oi = 0; oi < orphans; oi++) {
      ctx.fillStyle = '#fee2e2'; ctx.strokeStyle = '#dc2626';
      ctx.beginPath(); ctx.arc(tokenX + tokenR, tokenY + tokenR, tokenR, 0, Math.PI * 2);
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#991b1b'; ctx.font = 'bold 10px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(pVal, tokenX + tokenR, tokenY + tokenR + 3);
      tokenX += tokenR * 2 + 4;
    }
  }

  ctx.textAlign = 'left';
  var vy = tokenY + tokenR * 2 + 18;
  if (isPerfect) {
    ctx.fillStyle = '#16a34a'; ctx.font = 'bold 11px sans-serif';
    if (mode === 'square') {
      ctx.fillText('✓ Perfect Square: √' + N + ' = ' + rootVal, rx, vy);
    } else {
      ctx.fillText('✓ Perfect Cube: ∛' + N + ' = ' + rootVal, rx, vy);
    }
  } else {
    ctx.fillStyle = '#dc2626'; ctx.font = 'bold 11px sans-serif';
    ctx.fillText('✗ Not a ' + (mode === 'square' ? 'Square' : 'Cube') + '! Has orphan factors.', rx, vy);

    ctx.fillStyle = '#1e3a8a'; ctx.font = '10px sans-serif';
    ctx.fillText('Multiply by ' + multiplier + ' (➔ ' + (N * multiplier) + ') or divide by ' + divisor + ' (➔ ' + Math.floor(N / divisor) + ')', rx, vy + 15);
  }
}

// 4. 100-Locker Riddle & Ending Digit Explorer Sim
function drawLockerRiddleSim(canvas, selectedLocker, filterMode) {
  if (!canvas) return;
  var ctx = canvas.getContext('2d'); var w = canvas.width, h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  selectedLocker = Math.max(1, Math.min(100, selectedLocker || 16));
  filterMode = filterMode || 'all';

  var pad = 8;
  var cellSize = Math.floor((h - pad * 2) / 10);
  cellSize = Math.max(7, Math.min(11, cellSize));
  var startX = pad + 4;
  var startY = Math.floor((h - cellSize * 10) / 2);

  var squareSet = { 1:1, 4:1, 9:1, 16:1, 25:1, 36:1, 49:1, 64:1, 81:1, 100:1 };
  var forbiddenEndings = { 2:1, 3:1, 7:1, 8:1 };

  for (var r = 0; r < 10; r++) {
    for (var c = 0; c < 10; c++) {
      var id = r * 10 + c + 1;
      var isSq = !!squareSet[id];
      var endsIn = id % 10;
      var isForbidden = !!forbiddenEndings[endsIn];
      var isSel = (id === selectedLocker);
      var lx = startX + c * cellSize, ly = startY + r * cellSize;

      if (filterMode === 'squares') {
        ctx.fillStyle = isSq ? '#22c55e' : 'rgba(148, 163, 184, 0.2)';
      } else if (filterMode === 'forbidden') {
        ctx.fillStyle = isForbidden ? '#ef4444' : (isSq ? '#22c55e' : '#cbd5e1');
      } else if (filterMode === 'ending_digits') {
        ctx.fillStyle = isForbidden ? '#f87171' : '#60a5fa';
      } else {
        ctx.fillStyle = isSq ? '#22c55e' : '#334155';
      }

      ctx.fillRect(lx + 1, ly + 1, cellSize - 2, cellSize - 2);

      if (isSel) {
        ctx.strokeStyle = '#facc15'; ctx.lineWidth = 2;
        ctx.strokeRect(lx, ly, cellSize, cellSize);
      }
    }
  }

  var rx = startX + cellSize * 10 + 16;
  ctx.textAlign = 'left';

  var factors = [];
  for (var f = 1; f <= selectedLocker; f++) {
    if (selectedLocker % f === 0) factors.push(f);
  }
  var factorCount = factors.length;
  var isOdd = (factorCount % 2 === 1);

  ctx.fillStyle = '#0f172a'; ctx.font = 'bold 12px sans-serif';
  ctx.fillText('Locker #' + selectedLocker + ' State: ' + (isOdd ? '🔓 OPEN' : '🔒 CLOSED'), rx, 18);

  ctx.fillStyle = '#2563eb'; ctx.font = 'bold 11px sans-serif';
  var fStr = factors.length > 8 ? factors.slice(0, 6).join(',') + '...' + factors[factors.length - 1] : factors.join(', ');
  ctx.fillText('Factors (' + factorCount + ' total): ' + fStr, rx, 36);

  ctx.fillStyle = isOdd ? '#16a34a' : '#d97706'; ctx.font = 'bold 11px sans-serif';
  ctx.fillText('Parity: ' + factorCount + ' is ' + (isOdd ? 'ODD (Square! a·a=N)' : 'EVEN (Factors in pairs)'), rx, 54);

  var endsDigit = selectedLocker % 10;
  var isForb = !!forbiddenEndings[endsDigit];
  ctx.fillStyle = isForb ? '#dc2626' : '#1e3a8a'; ctx.font = '10px sans-serif';
  ctx.fillText('Ends in ' + endsDigit + ': ' + (isForb ? 'Forbidden ending (2,3,7,8) ➔ Never Square' : 'Valid square ending (0,1,4,5,6,9)'), rx, 72);

  ctx.fillStyle = '#64748b'; ctx.font = '10px sans-serif';
  ctx.fillText('Rule: Exactly 10/100 lockers stay open: 1, 4, 9, 16, 25, 36, 49, 64, 81, 100', rx, 90);
}

// 5. Rapid 3-Digit Grouping Cube Estimator Sim
function drawCubeEstimatorSim(canvas, num, stage) {
  if (!canvas) return;
  var ctx = canvas.getContext('2d'); var w = canvas.width, h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  num = num || 110592;

  if (num === 1729) {
    ctx.textAlign = 'center';
    ctx.fillStyle = '#7c3aed'; ctx.font = 'bold 13px sans-serif';
    ctx.fillText('Hardy-Ramanujan Taxicab Number: 1729', w / 2, 22);

    ctx.fillStyle = '#0f172a'; ctx.font = 'bold 12px sans-serif';
    ctx.fillText('Smallest number expressible as sum of two cubes in two ways:', w / 2, 44);

    ctx.fillStyle = '#2563eb'; ctx.font = 'bold 12px sans-serif';
    ctx.fillText('1³ + 12³ = 1 + 1728 = 1729', w / 2, 66);

    ctx.fillStyle = '#16a34a'; ctx.font = 'bold 12px sans-serif';
    ctx.fillText('9³ + 10³ = 729 + 1000 = 1729', w / 2, 88);
    return;
  }

  var s = num.toString();
  var g1Str = s.length > 3 ? s.slice(-3) : s;
  var g2Str = s.length > 3 ? s.slice(0, -3) : '0';
  var g1 = parseInt(g1Str, 10);
  var g2 = parseInt(g2Str, 10);

  var unitMap = { 0:0, 1:1, 2:8, 3:7, 4:4, 5:5, 6:6, 7:3, 8:2, 9:9 };
  var lastDigit = g1 % 10;
  var unitsDigit = unitMap[lastDigit];

  var tensDigit = 0;
  if (g2 > 0) {
    while ((tensDigit + 1) * (tensDigit + 1) * (tensDigit + 1) <= g2) {
      tensDigit++;
    }
  }
  var estimatedRoot = tensDigit * 10 + unitsDigit;

  ctx.textAlign = 'center';
  var midX = w / 2;

  ctx.fillStyle = '#dbeafe'; ctx.strokeStyle = '#2563eb'; ctx.lineWidth = 1.5;
  ctx.fillRect(midX - 110, 8, 95, 24); ctx.strokeRect(midX - 110, 8, 95, 24);
  ctx.fillStyle = '#1e40af'; ctx.font = 'bold 12px sans-serif';
  ctx.fillText('Group 2: ' + g2Str, midX - 62, 24);

  ctx.fillStyle = '#f3e8ff'; ctx.strokeStyle = '#9333ea';
  ctx.fillRect(midX + 15, 8, 95, 24); ctx.strokeRect(midX + 15, 8, 95, 24);
  ctx.fillStyle = '#6b21a8';
  ctx.fillText('Group 1: ' + g1Str, midX + 62, 24);

  ctx.textAlign = 'left';
  var col1X = 14;
  ctx.fillStyle = '#1e3a8a'; ctx.font = 'bold 11px sans-serif';
  var lowerCube = tensDigit * tensDigit * tensDigit;
  var upperCube = (tensDigit + 1) * (tensDigit + 1) * (tensDigit + 1);
  ctx.fillText('Tens: ' + tensDigit + '³ = ' + lowerCube + ' ≤ ' + g2 + ' < ' + upperCube, col1X, 52);
  ctx.fillStyle = '#2563eb';
  ctx.fillText('➔ Tens Digit = ' + tensDigit, col1X, 68);

  var col2X = midX + 15;
  ctx.fillStyle = '#581c87'; ctx.font = 'bold 11px sans-serif';
  var mapRule = (lastDigit === 2 || lastDigit === 8 || lastDigit === 3 || lastDigit === 7) ?
    lastDigit + ' ↔ ' + unitsDigit + ' (10-complement)' : lastDigit + ' ➔ ' + unitsDigit + ' (Self)';
  ctx.fillText('Units: Ends in ' + lastDigit + ' ➔ ' + mapRule, col2X, 52);
  ctx.fillStyle = '#9333ea';
  ctx.fillText('➔ Units Digit = ' + unitsDigit, col2X, 68);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#16a34a'; ctx.font = 'bold 13px sans-serif';
  ctx.fillText('✓ ∛' + num.toLocaleString() + ' = ' + estimatedRoot + '  (' + estimatedRoot + '³ = ' + num.toLocaleString() + ')', midX, 94);
}

// ═══ APP DATA: NODES & WORKED EXAMPLES ═══
var NODES = ${JSON.stringify(NODES_DATA, null, 2)};
var WE = ${JSON.stringify(WE_DATA, null, 2)};

// ═══ APP STATE CONTROLLER ═══
var STORAGE_KEY = "aasha_square_cube_class8_v6";
var LEVELS = [
  { xp: 0, title: "Novice" },
  { xp: 100, title: "Locker Detective" },
  { xp: 250, title: "Gnomon Architect" },
  { xp: 450, title: "Root Explorer" },
  { xp: 600, title: "Taxicab Master" }
];

var App = {
  activeTab: 'concept',
  nIdx: 0, sIdx: 0, coins: 0, xp: 0, level: 1, streak: 0,
  selOpt: null, answered: false,
  weStepIdx: 0, weChecked: false, weCheckAnswered: false, _weCheckRendered: false,
  weStepCheckPassed: false, weStepCheckAnswered: false, selStepOpt: null,
  _weCheckOpts: null, _weStepCheckOpts: null, _qOpts: null, retryTimer: null,

  // Sim states & adapters
  _simAdapter: null,
  _sqSide: 5, _sqPeeled: 0, _sqGnomon: true,
  _cubeN: 3, _cubeSliced: false, _cubeOddSum: false,
  _pfN: 144, _pfMode: 'square',
  _lockId: 16, _lockFilter: 'all',
  _estNum: 110592,

  _hintState: {},

  init: function() {
    this.load();
    this.render();
    this.updateStats();
  },

  load: function() {
    try {
      var s = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      if (s.nIdx !== undefined && s.nIdx >= 0 && s.nIdx < NODES.length) {
        this.nIdx = s.nIdx;
        this.sIdx = (s.sIdx >= 0 && s.sIdx < NODES[this.nIdx].steps.length) ? s.sIdx : 0;
        this.coins = s.coins || 0; this.xp = s.xp || 0;
        this.level = s.level || 1; this.streak = s.streak || 0;
      }
    } catch(e){}
  },

  save: function() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        nIdx: this.nIdx, sIdx: this.sIdx,
        coins: this.coins, xp: this.xp,
        level: this.level, streak: this.streak
      }));
    } catch(e){}
  },

  updateStats: function() {
    document.getElementById('statCoins').textContent = this.coins;
    document.getElementById('statXp').textContent = this.xp;
    document.getElementById('statLvl').textContent = 'Lv ' + this.level;
    var sw = document.getElementById('statStreakWrap');
    if (this.streak >= 2) {
      sw.style.display = 'inline-flex';
      document.getElementById('statStreak').textContent = this.streak;
    } else {
      sw.style.display = 'none';
    }
    var total = 0, done = 0;
    for (var i = 0; i < NODES.length; i++) {
      total += NODES[i].steps.length;
      if (i < this.nIdx) done += NODES[i].steps.length;
      else if (i === this.nIdx) done += this.sIdx + 1;
    }
    document.getElementById('progressFill').style.width = Math.round((done / Math.max(1, total)) * 100) + '%';
  },

  awardXP: function(amt) {
    this.xp += amt; this.coins += Math.floor(amt / 2);
    for (var i = LEVELS.length - 1; i >= 0; i--) {
      if (this.xp >= LEVELS[i].xp && this.level <= i) {
        this.level = i + 1;
        playTone('levelup'); fireConfetti(50);
        break;
      }
    }
    this.updateStats();
  },

  switchTab: function(tab) {
    this.activeTab = tab;
    var tabs = ['concept', 'warmup', 'deep_dive', 'boss'];
    tabs.forEach(function(t) {
      var btn = document.getElementById('tabBtn' + (t === 'concept' ? 'Concept' : (t === 'warmup' ? 'Warmup' : (t === 'deep_dive' ? 'DeepDive' : 'Boss'))));
      if (btn) {
        if (t === tab) btn.classList.add('active');
        else btn.classList.remove('active');
      }
    });

    var stepContainer = document.getElementById('stepContainer');
    var assessmentContainer = document.getElementById('assessmentContainer');
    var bottomBar = document.getElementById('bottomBar');

    if (tab === 'concept') {
      document.body.classList.remove('assessment-mode');
      stepContainer.style.display = 'block';
      assessmentContainer.style.display = 'none';
      bottomBar.style.display = 'block';
      this.render();
    } else {
      document.body.classList.add('assessment-mode');
      stepContainer.style.display = 'none';
      assessmentContainer.style.display = 'block';
      bottomBar.style.display = 'none';

      if (this._simAdapter && typeof this._simAdapter.pause === 'function') {
        this._simAdapter.pause();
      }

      ['warmup', 'deep_dive', 'boss'].forEach(function(t) {
        var sec = document.getElementById('section-' + t);
        if (sec) {
          sec.style.display = (t === tab) ? 'block' : 'none';
        }
      });
      window.scrollTo(0, 0);
    }
  },

  exit: function() {
    document.body.classList.remove('assessment-mode');
    this.save();
    this.nIdx = 0; this.sIdx = 0;
    this.weStepIdx = 0; this.weChecked = false; this.weCheckAnswered = false;
    this._weCheckRendered = false; this.answered = false; this.selOpt = null;
    this.activeTab = 'concept';
    var tabs = ['concept', 'warmup', 'deep_dive', 'boss'];
    tabs.forEach(function(t) {
      var btn = document.getElementById('tabBtn' + (t === 'concept' ? 'Concept' : (t === 'warmup' ? 'Warmup' : (t === 'deep_dive' ? 'DeepDive' : 'Boss'))));
      if (btn) {
        if (t === 'concept') btn.classList.add('active');
        else btn.classList.remove('active');
      }
    });
    document.getElementById('stepContainer').style.display = 'block';
    document.getElementById('assessmentContainer').style.display = 'none';
    this.render();
  },

  fitCanvas: function(canvas) {
    if (!canvas) return;
    var container = canvas.parentElement;
    var rect = container ? container.getBoundingClientRect() : canvas.getBoundingClientRect();
    var dpr = window.devicePixelRatio || 1;
    var w = Math.floor(rect.width ? (rect.width - 24) : (window.innerWidth - 64));
    w = Math.max(260, Math.min(480, w));
    var isShort = window.innerHeight <= 700;
    var isMedium = window.innerHeight > 700 && window.innerHeight <= 860;
    var h = isShort ? 92 : (isMedium ? 115 : 125);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    var ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      if (dpr !== 1) ctx.scale(dpr, dpr);
    }
  },

  mountSim: function(type) {
    var canvas = document.getElementById('conceptCanvas');
    var ctrl = document.getElementById('conceptControls');
    var readout = document.getElementById('simReadout');
    var simEl = document.getElementById('conceptSim');
    if (!canvas || !ctrl || !readout || !simEl) return;
    this.fitCanvas(canvas);

    if (type === 'lockerriddle') {
      this._simAdapter = new AashaExperienceAdapter({ foundationId: 'F01', experienceId: '100-locker-riddle' });
      simEl.bindAdapter(this._simAdapter);
      this.updateLockerDOM();
      ctrl.innerHTML = '<div class="preset-bar">' +
        '<button class="preset-btn" onclick="App.setLocker(16,\\'all\\')">Locker 16 (Square)</button>' +
        '<button class="preset-btn" onclick="App.setLocker(24,\\'all\\')">Locker 24 (Even)</button>' +
        '<button class="preset-btn" onclick="App.setLocker(64,\\'squares\\')">10 Open Squares</button>' +
        '<button class="preset-btn" onclick="App.setLocker(73,\\'forbidden\\')">Forbidden (2,3,7,8)</button>' +
        '</div>';
    } else if (type === 'squaregrid') {
      this._simAdapter = new AashaExperienceAdapter({ foundationId: 'F02', experienceId: 'square-grid-gnomon' });
      simEl.bindAdapter(this._simAdapter);
      this.updateSquareGridDOM();
      ctrl.innerHTML = '<div class="preset-bar">' +
        '<button class="preset-btn" onclick="App.setSquareGrid(3,0)">3² (9)</button>' +
        '<button class="preset-btn" onclick="App.setSquareGrid(4,0)">4² (16)</button>' +
        '<button class="preset-btn" onclick="App.setSquareGrid(5,0)">5² (25)</button>' +
        '<button class="preset-btn" onclick="App.setSquareGrid(6,0)">6² (36)</button>' +
        '<button class="preset-btn" onclick="App.togglePeel()">Peel Gnomon (2n-1)</button>' +
        '</div>';
    } else if (type === 'primefactor') {
      this._simAdapter = new AashaExperienceAdapter({ foundationId: 'F02', experienceId: 'prime-factor-grouping' });
      simEl.bindAdapter(this._simAdapter);
      this.updatePrimeFactorDOM();
      ctrl.innerHTML = '<div class="preset-bar">' +
        '<button class="preset-btn" onclick="App.setFactorNum(144,\\'square\\')">144 (Sq Root)</button>' +
        '<button class="preset-btn" onclick="App.setFactorNum(252,\\'square\\')">252 (Orphan 7)</button>' +
        '<button class="preset-btn" onclick="App.setFactorNum(500,\\'cube\\')">500 (Cube Mult)</button>' +
        '<button class="preset-btn" onclick="App.setFactorNum(1728,\\'cube\\')">1728 (Cube 12³)</button>' +
        '</div>';
    } else if (type === 'isocube') {
      this._simAdapter = new AashaExperienceAdapter({ foundationId: 'F08', experienceId: 'isometric-cube-stack' });
      simEl.bindAdapter(this._simAdapter);
      this.updateIsoCubeDOM();
      ctrl.innerHTML = '<div class="preset-bar">' +
        '<button class="preset-btn" onclick="App.setIsoCube(2)">2³ (8)</button>' +
        '<button class="preset-btn" onclick="App.setIsoCube(3)">3³ (27)</button>' +
        '<button class="preset-btn" onclick="App.setIsoCube(4)">4³ (64)</button>' +
        '<button class="preset-btn" onclick="App.toggleSlice()">' + (this._cubeSliced ? 'Compact Cube' : 'Slice Layers') + '</button>' +
        '</div>';
    } else if (type === 'cubeestimator') {
      this._simAdapter = new AashaExperienceAdapter({ foundationId: 'F02', experienceId: 'cube-estimator-3digit' });
      simEl.bindAdapter(this._simAdapter);
      this.updateEstimatorDOM();
      ctrl.innerHTML = '<div class="preset-bar">' +
        '<button class="preset-btn" onclick="App.setEstimator(17576)">17,576 (26³)</button>' +
        '<button class="preset-btn" onclick="App.setEstimator(32768)">32,768 (32³)</button>' +
        '<button class="preset-btn" onclick="App.setEstimator(91125)">91,125 (45³)</button>' +
        '<button class="preset-btn" onclick="App.setEstimator(110592)">110,592 (48³)</button>' +
        '<button class="preset-btn" onclick="App.setEstimator(1729)">1,729 (Taxicab)</button>' +
        '</div>';
    }
  },

  updateSquareGridDOM: function() {
    var readout = document.getElementById('simReadout');
    var area = this._sqSide * this._sqSide;
    if (readout) {
      readout.textContent = 'Side s = ' + this._sqSide + ' ➔ Area = ' + area + ' ➔ Outermost Gnomon: 2(' + this._sqSide + ') - 1 = ' + (2 * this._sqSide - 1) + ' units';
    }
    drawSquareGridSim(document.getElementById('conceptCanvas'), this._sqSide, this._sqPeeled, this._sqGnomon);
    if (this._simAdapter) this._simAdapter.emitStateChange({ s: this._sqSide, area: area, peeled: this._sqPeeled });
  },

  updateIsoCubeDOM: function() {
    var readout = document.getElementById('simReadout');
    var vol = this._cubeN * this._cubeN * this._cubeN;
    if (readout) {
      readout.textContent = 'Edge n = ' + this._cubeN + ' ➔ Volume = ' + vol + ' cubes ➔ ' + (this._cubeSliced ? 'Sliced into ' + this._cubeN + ' slabs of ' + (this._cubeN * this._cubeN) : 'Compact Solid Stack');
    }
    drawIsoCubeSim(document.getElementById('conceptCanvas'), this._cubeN, this._cubeSliced, this._cubeOddSum);
    if (this._simAdapter) this._simAdapter.emitStateChange({ n: this._cubeN, volume: vol, sliced: this._cubeSliced });
  },

  updatePrimeFactorDOM: function() {
    var readout = document.getElementById('simReadout');
    if (readout) {
      readout.textContent = 'Factorizing N = ' + this._pfN + ' in ' + this._pfMode.toUpperCase() + ' mode ➔ Analyzing factor exponents & orphans';
    }
    drawPrimeFactorSim(document.getElementById('conceptCanvas'), this._pfN, this._pfMode);
    if (this._simAdapter) this._simAdapter.emitStateChange({ n: this._pfN, mode: this._pfMode });
  },

  updateLockerDOM: function() {
    var readout = document.getElementById('simReadout');
    var squareSet = { 1:1, 4:1, 9:1, 16:1, 25:1, 36:1, 49:1, 64:1, 81:1, 100:1 };
    var isSq = !!squareSet[this._lockId];
    if (readout) {
      readout.textContent = 'Locker #' + this._lockId + ' ➔ ' + (isSq ? 'OPEN (Odd factors ➔ Perfect Square)' : 'CLOSED (Even factors ➔ Paired divisors)') + ' ➔ Ends in ' + (this._lockId % 10);
    }
    drawLockerRiddleSim(document.getElementById('conceptCanvas'), this._lockId, this._lockFilter);
    if (this._simAdapter) this._simAdapter.emitStateChange({ locker: this._lockId, filter: this._lockFilter, open: isSq });
  },

  updateEstimatorDOM: function() {
    var readout = document.getElementById('simReadout');
    if (readout) {
      readout.textContent = (this._estNum === 1729) ?
        'Taxicab Number 1729 = 1³ + 12³ = 9³ + 10³' :
        'Rapid 3-Digit Isolation for ' + this._estNum.toLocaleString() + ' ➔ Units & Tens bracket matching';
    }
    drawCubeEstimatorSim(document.getElementById('conceptCanvas'), this._estNum, 'full');
    if (this._simAdapter) this._simAdapter.emitStateChange({ num: this._estNum });
  },

  setSquareGrid: function(s, p) { this._sqSide = s; this._sqPeeled = p || 0; this.updateSquareGridDOM(); playTone('tap'); },
  togglePeel: function() { this._sqPeeled = (this._sqPeeled + 1) % this._sqSide; this.updateSquareGridDOM(); playTone('tap'); },
  setIsoCube: function(n) { this._cubeN = n; this.updateIsoCubeDOM(); playTone('tap'); },
  toggleSlice: function() { this._cubeSliced = !this._cubeSliced; this.updateIsoCubeDOM(); this.mountSim('isocube'); playTone('tap'); },
  setFactorNum: function(n, m) { this._pfN = n; this._pfMode = m; this.updatePrimeFactorDOM(); playTone('tap'); },
  setLocker: function(id, f) { this._lockId = id; this._lockFilter = f || 'all'; this.updateLockerDOM(); playTone('tap'); },
  setEstimator: function(n) { this._estNum = n; this.updateEstimatorDOM(); playTone('tap'); },

  render: function() {
    if (this.retryTimer) { clearTimeout(this.retryTimer); this.retryTimer = null; }
    var node = NODES[this.nIdx];
    var step = node.steps[this.sIdx];
    var cb = document.getElementById('continueBtn');
    var backBtn = document.getElementById('backBtn');

    if (backBtn) {
      backBtn.style.display = (this.nIdx > 0 || this.sIdx > 0) ? 'inline-block' : 'none';
    }

    var views = ['viewIntro', 'viewConcept', 'viewWorked', 'viewQuiz', 'viewProgress'];
    views.forEach(function(vid) {
      var el = document.getElementById(vid);
      if (el) el.style.display = 'none';
    });

    if (step.t === 'intro') {
      if (this._simAdapter && typeof this._simAdapter.pause === 'function') this._simAdapter.pause();
      this.renderIntro(step, cb);
    } else if (step.t === 'text') {
      this.renderConceptFrame(step, cb);
    } else if (step.t === 'worked') {
      if (this._simAdapter && typeof this._simAdapter.pause === 'function') this._simAdapter.pause();
      this.renderWorked(step, cb);
    } else if (step.t === 'quiz') {
      if (this._simAdapter && typeof this._simAdapter.pause === 'function') this._simAdapter.pause();
      this.renderQuiz(step, cb);
    } else if (step.t === 'progress') {
      if (this._simAdapter && typeof this._simAdapter.pause === 'function') this._simAdapter.pause();
      this.renderProgress(step, node, cb);
    }
    this.updateStats();
  },

  renderIntro: function(step, cb) {
    var el = document.getElementById('viewIntro');
    var html = '<div class="concept-frame" style="text-align:center;padding:26px 16px">';
    html += '<div class="intro-hero">' + (step.icon || '📖') + '</div>';
    html += '<h2 class="inquiry-title">' + rt(step.title, true) + '</h2>';
    html += '<div style="font-size:.95rem;color:var(--muted);line-height:1.6;max-width:420px;margin:0 auto 16px">' + rt(step.sub, true) + '</div>';
    html += '<div style="display:inline-block;padding:6px 14px;background:var(--blue-lt);color:var(--blue-dk);border-radius:20px;font-weight:800;font-size:.8rem">100% Textbook Derived • Class 8 Math (Squares and Cubes)</div>';
    html += '</div>';
    el.innerHTML = html;
    el.style.display = 'block';
    document.getElementById('bottomBar').style.display = 'block';
    cb.textContent = 'Start Exploring →'; cb.disabled = false;
  },

  renderConceptFrame: function(step, cb) {
    var el = document.getElementById('viewConcept');
    document.getElementById('conceptBadge').textContent = 'Node ' + (this.nIdx + 1) + ' · Concept & Manipulative Lab';
    document.getElementById('conceptTitle').innerHTML = rt(step.title, true);
    document.getElementById('conceptDef').innerHTML = rt(step.text, true);
    document.getElementById('simCaption').textContent = step.caption || '';
    el.style.display = 'block';
    document.getElementById('bottomBar').style.display = 'block';
    cb.textContent = 'Continue →'; cb.disabled = false;
    this.mountSim(step.simType);
  },

  renderWorked: function(step, cb) {
    this.weStepIdx = 0; this.weChecked = false; this.weCheckAnswered = false;
    this._weCheckRendered = false; this.weStepCheckPassed = false;
    this.weStepCheckAnswered = false; this.selStepOpt = null; this.selOpt = null;
    if (typeof step.we === 'string') step.we = WE[step.we];
    var we = step.we;
    var el = document.getElementById('viewWorked');
    el.innerHTML = '<div class="we-card"><div class="we-tag">' + we.title + '</div><div class="we-question">' + rt(we.question, true) + '</div><div id="weSteps"></div></div>';
    el.style.display = 'block';
    this.showNextWE(we, cb);
  },

  showNextWE: function(we, cb) {
    if (this.weStepIdx >= we.steps.length) {
      if (we.check && !this.weChecked) {
        this._weCheckOpts = we.check.opts.slice().sort(function(){ return Math.random() - 0.5; });
        this.selOpt = null; this.weCheckAnswered = false;
        var cq = '<div class="we-step" style="margin-top:10px;border-top:2px dashed var(--blue);background:transparent;padding-top:10px"><b>Quick Check:</b> ' + rt(we.check.q, true).replace(/^<div class="lle-text-sm">/, '').replace(/<\\/div>$/, '') + '</div>';
        var optsHtml = '<div style="margin-top:8px" id="weCheckArea">';
        for (var i = 0; i < this._weCheckOpts.length; i++) {
          optsHtml += '<div class="quiz-opt" onclick="App.selWECheck(' + i + ')" id="wco' + i + '"><div class="quiz-radio"></div><div class="quiz-opt-text">' + rt(this._weCheckOpts[i].t, true).replace(/^<div class="lle-text-sm">/, '').replace(/<\\/div>$/, '') + '</div></div>';
        }
        optsHtml += '</div><div id="weCheckFb"></div>';
        var c = document.getElementById('weSteps');
        var div = document.createElement('div'); div.innerHTML = cq + optsHtml;
        c.appendChild(div);
        this.weChecked = false; this.weCheckAnswered = false; this._weCheckRendered = true;
        cb.textContent = 'Check Answer'; cb.disabled = true; return;
      }
      cb.textContent = 'Continue →'; cb.disabled = false; return;
    }

    var s = we.steps[this.weStepIdx];
    var c = document.getElementById('weSteps');
    var div = document.createElement('div');
    div.className = 'we-step ' + (s.c || '');
    var inner = rt(s.text, true).replace(/^<div class="lle-text-sm">/, '').replace(/<\\/div>$/, '');
    if (s.final) {
      div.classList.add('final'); div.innerHTML = inner; playTone('correct');
    } else {
      div.innerHTML = '<b>Step ' + (this.weStepIdx + 1) + ':</b> ' + inner; playTone('tap');
    }
    c.appendChild(div); this.weStepIdx++;

    if (s.check) {
      this._weStepCheckOpts = s.check.opts.slice().sort(function(){ return Math.random() - 0.5; });
      this.weStepCheckAnswered = false; this.weStepCheckPassed = false; this.selStepOpt = null;
      var scq = '<div style="margin-top:8px;border-left:3px solid var(--blue);padding:8px 12px;background:var(--blue-lt);border-radius:0 8px 8px 0"><div style="font-size:.85rem;font-weight:800;color:var(--blue-dk)">Check understanding:</div><div style="margin-top:4px">' + rt(s.check.q, true).replace(/^<div class="lle-text-sm">/, '').replace(/<\\/div>$/, '') + '</div><div style="margin-top:6px" id="weStepCheckArea">';
      for (var j = 0; j < this._weStepCheckOpts.length; j++) {
        scq += '<div class="quiz-opt" onclick="App.selWEStepCheck(' + j + ')" id="wsco' + j + '"><div class="quiz-radio"></div><div class="quiz-opt-text">' + rt(this._weStepCheckOpts[j].t, true).replace(/^<div class="lle-text-sm">/, '').replace(/<\\/div>$/, '') + '</div></div>';
      }
      scq += '</div><div id="weStepCheckFb"></div></div>';
      var scdiv = document.createElement('div'); scdiv.innerHTML = scq; c.appendChild(scdiv);
      cb.textContent = 'Check'; cb.disabled = true;
    } else {
      cb.textContent = (this.weStepIdx >= we.steps.length && !we.check) ? 'Continue →' : 'Next Step →';
      cb.disabled = false;
    }
  },

  selWECheck: function(i) {
    if (this.weCheckAnswered) return;
    this.selOpt = i;
    var opts = document.querySelectorAll('#weCheckArea .quiz-opt');
    for (var j = 0; j < opts.length; j++) opts[j].classList.remove('selected');
    document.getElementById('wco' + i).classList.add('selected');
    document.getElementById('continueBtn').disabled = false;
  },

  checkWECheck: function() {
    var we = NODES[this.nIdx].steps[this.sIdx].we;
    if (typeof we === 'string') we = WE[we];
    var opts = this._weCheckOpts || (we && we.check ? we.check.opts : []);
    if (this.selOpt == null || !opts || !opts[this.selOpt]) return;
    var opt = opts[this.selOpt];
    this.weCheckAnswered = true;
    var fb = document.getElementById('weCheckFb');
    var qopts = document.querySelectorAll('#weCheckArea .quiz-opt');
    for (var i = 0; i < qopts.length; i++) qopts[i].style.pointerEvents = 'none';
    if (opt.c) {
      fb.innerHTML = '<div class="feedback ok">✓ Great job! Concept understood. +5 XP</div>';
      this.weChecked = true; this.awardXP(5); playTone('correct');
      document.getElementById('continueBtn').textContent = 'Continue →';
      document.getElementById('continueBtn').disabled = false;
    } else {
      fb.innerHTML = '<div class="feedback no">✗ Not quite.</div>' + (opt.m ? '<div class="misconception">' + rt('⚠ ' + opt.m, true).replace(/^<div class="lle-text-sm">/, '').replace(/<\\/div>$/, '') + '</div>' : '');
      playTone('wrong');
      document.getElementById('continueBtn').textContent = 'Try again';
      var self = this;
      this.retryTimer = setTimeout(function(){
        self.weCheckAnswered = false; self.selOpt = null;
        for (var k = 0; k < qopts.length; k++) {
          qopts[k].classList.remove('selected', 'wrong'); qopts[k].style.pointerEvents = '';
        }
        fb.innerHTML = ''; document.getElementById('continueBtn').textContent = 'Check';
        document.getElementById('continueBtn').disabled = true;
      }, 3500);
    }
  },

  selWEStepCheck: function(i) {
    if (this.weStepCheckAnswered) return;
    this.selStepOpt = i;
    var opts = document.querySelectorAll('#weStepCheckArea .quiz-opt');
    for (var j = 0; j < opts.length; j++) opts[j].classList.remove('selected');
    document.getElementById('wsco' + i).classList.add('selected');
    document.getElementById('continueBtn').disabled = false;
  },

  checkWEStepCheck: function() {
    var we = NODES[this.nIdx].steps[this.sIdx].we;
    if (typeof we === 'string') we = WE[we];
    var s = we && we.steps ? we.steps[this.weStepIdx - 1] : null;
    var opts = this._weStepCheckOpts || (s && s.check ? s.check.opts : []);
    if (this.selStepOpt == null || !opts || !opts[this.selStepOpt]) return;
    var opt = opts[this.selStepOpt];
    this.weStepCheckAnswered = true;
    var fb = document.getElementById('weStepCheckFb');
    var qopts = document.querySelectorAll('#weStepCheckArea .quiz-opt');
    for (var i = 0; i < qopts.length; i++) qopts[i].style.pointerEvents = 'none';
    if (opt.c) {
      fb.innerHTML = '<div class="feedback ok">✓ Correct reasoning! +5 XP</div>';
      this.weStepCheckPassed = true; this.awardXP(5); playTone('correct');
      document.getElementById('continueBtn').textContent = (this.weStepIdx >= NODES[this.nIdx].steps[this.sIdx].we.steps.length) ? 'Check' : 'Next Step →';
      document.getElementById('continueBtn').disabled = false;
    } else {
      fb.innerHTML = '<div class="feedback no">✗ Re-examine the rule.</div>' + (opt.m ? '<div class="misconception">' + rt('⚠ ' + opt.m, true).replace(/^<div class="lle-text-sm">/, '').replace(/<\\/div>$/, '') + '</div>' : '');
      playTone('wrong');
      document.getElementById('continueBtn').textContent = 'Try again';
      var self = this;
      this.retryTimer = setTimeout(function(){
        self.weStepCheckAnswered = false; self.selStepOpt = null;
        for (var k = 0; k < qopts.length; k++) {
          qopts[k].classList.remove('selected', 'wrong'); qopts[k].style.pointerEvents = '';
        }
        fb.innerHTML = ''; document.getElementById('continueBtn').textContent = 'Check';
        document.getElementById('continueBtn').disabled = true;
      }, 3500);
    }
  },

  renderQuiz: function(step, cb) {
    this.answered = false; this.selOpt = null;
    this._qOpts = step.q.opts.slice().sort(function(){ return Math.random() - 0.5; });
    var el = document.getElementById('viewQuiz');
    var html = '<div class="quiz-card">';
    html += '<span class="concept-badge">Concept Mastery Check</span>';
    html += '<div class="quiz-q">' + rt(step.q.q, true) + '</div>';
    html += '<div id="quizOpts">';
    for (var i = 0; i < this._qOpts.length; i++) {
      html += '<div class="quiz-opt" onclick="App.selQuiz(' + i + ')" id="qo' + i + '">';
      html += '<div class="quiz-radio"></div>';
      html += '<div class="quiz-opt-text">' + rt(this._qOpts[i].t, true).replace(/^<div class="lle-text-sm">/, '').replace(/<\\/div>$/, '') + '</div>';
      html += '</div>';
    }
    html += '</div><div id="quizFb"></div></div>';
    el.innerHTML = html;
    el.style.display = 'block';
    document.getElementById('bottomBar').style.display = 'block';
    cb.textContent = 'Check Answer'; cb.disabled = true;
  },

  selQuiz: function(i) {
    if (this.answered) return;
    this.selOpt = i;
    var opts = document.querySelectorAll('#quizOpts .quiz-opt');
    for (var j = 0; j < opts.length; j++) opts[j].classList.remove('selected');
    document.getElementById('qo' + i).classList.add('selected');
    document.getElementById('continueBtn').disabled = false;
  },

  checkQuiz: function() {
    var opt = this._qOpts[this.selOpt];
    this.answered = true;
    var fb = document.getElementById('quizFb');
    var qopts = document.querySelectorAll('#quizOpts .quiz-opt');
    for (var i = 0; i < qopts.length; i++) qopts[i].style.pointerEvents = 'none';

    if (opt.c) {
      document.getElementById('qo' + this.selOpt).classList.add('correct');
      fb.innerHTML = '<div class="feedback ok">✓ Outstanding! Correct answer. +15 XP</div>';
      this.streak++; this.awardXP(15); playTone('correct'); fireConfetti(40);
      document.getElementById('continueBtn').textContent = 'Continue →';
      document.getElementById('continueBtn').disabled = false;
    } else {
      document.getElementById('qo' + this.selOpt).classList.add('wrong');
      fb.innerHTML = '<div class="feedback no">✗ Not quite.</div>' + (opt.m ? '<div class="misconception">' + rt('⚠ ' + opt.m, true).replace(/^<div class="lle-text-sm">/, '').replace(/<\\/div>$/, '') + '</div>' : '');
      this.streak = 0; playTone('wrong');
      document.getElementById('continueBtn').textContent = 'Try again';
      var self = this;
      this.retryTimer = setTimeout(function(){
        self.answered = false; self.selOpt = null;
        for (var k = 0; k < qopts.length; k++) {
          qopts[k].classList.remove('selected', 'wrong'); qopts[k].style.pointerEvents = '';
        }
        fb.innerHTML = ''; document.getElementById('continueBtn').textContent = 'Check Answer';
        document.getElementById('continueBtn').disabled = true;
      }, 3500);
    }
  },

  renderProgress: function(step, node, cb) {
    var el = document.getElementById('viewProgress');
    var html = '<div class="milestone-box">';
    html += '<div class="milestone-icon">🎉</div>';
    html += '<div class="milestone-title">Node ' + (this.nIdx + 1) + ' Complete!</div>';
    html += '<div class="milestone-sub">' + node.title + '</div>';
    html += '<div class="milestone-reward">⭐ +' + step.xp + ' XP Earned!</div>';
    html += '</div>';
    el.innerHTML = html;
    el.style.display = 'block';
    document.getElementById('bottomBar').style.display = 'block';
    this.awardXP(step.xp); playTone('levelup'); fireConfetti(60);
    cb.textContent = step.next ? 'Next Concept →' : 'Start 3-Tier Challenge 🎯';
    cb.disabled = false;
  },

  goBack: function() {
    if (this.sIdx > 0) {
      this.sIdx--;
    } else if (this.nIdx > 0) {
      this.nIdx--;
      this.sIdx = NODES[this.nIdx].steps.length - 1;
    }
    this.save(); this.render();
  },

  next: function() {
    this.onContinue();
  },

  onContinue: function() {
    var step = NODES[this.nIdx].steps[this.sIdx];
    if (step.t === 'worked') {
      if (typeof step.we === 'string') step.we = WE[step.we];
      if (this.weStepIdx < step.we.steps.length) {
        var prevStep = step.we.steps[this.weStepIdx - 1];
        if (prevStep && prevStep.check && !this.weStepCheckPassed) {
          if (!this.weStepCheckAnswered && this.selStepOpt != null) { this.checkWEStepCheck(); return; }
          if (this.weStepCheckAnswered && !this.weStepCheckPassed) { return; }
          if (!this.weStepCheckAnswered && this.selStepOpt == null) { return; }
        }
        this.weStepCheckPassed = false; this.weStepCheckAnswered = false; this.selStepOpt = null;
        this.showNextWE(step.we, document.getElementById('continueBtn')); return;
      }
      if (this.weStepIdx >= step.we.steps.length && step.we.check && !this.weChecked) {
        if (!this._weCheckRendered) { this.showNextWE(step.we, document.getElementById('continueBtn')); return; }
        if (this._weCheckRendered && !this.weCheckAnswered) {
          if (this.selOpt == null) return;
          this.checkWECheck();
          return;
        }
        if (this.weCheckAnswered && !this.weChecked) { return; }
      }
    }
    if (step.t === 'quiz' && !this.answered) { this.checkQuiz(); return; }
    if (step.t === 'quiz' && this.answered) {
      var opt = this._qOpts[this.selOpt];
      if (!opt || !opt.c) return;
    }
    if (step.t === 'progress' && !step.next) {
      this.switchTab('warmup'); return;
    }
    this.advance();
  },

  advance: function() {
    this.sIdx++; this.answered = false; this.selOpt = null;
    this.weStepIdx = 0; this.weChecked = false; this.weCheckAnswered = false;
    this._weCheckRendered = false; this.weStepCheckPassed = false;
    this.weStepCheckAnswered = false; this.selStepOpt = null; this._qOpts = null;
    if (this.sIdx >= NODES[this.nIdx].steps.length) {
      this.nIdx++; this.sIdx = 0;
      if (this.nIdx >= NODES.length) {
        this.nIdx = NODES.length - 1;
        this.sIdx = NODES[this.nIdx].steps.length - 1;
        this.switchTab('warmup');
        return;
      }
    }
    this.save(); this.render();
  },

  answerAssessment: function(optEl, qId, isCorrect, misconception, xpVal) {
    var card = document.getElementById(qId);
    if (!card) return;
    var allOpts = card.querySelectorAll('.quiz-opt');
    var fb = document.getElementById('fb_' + qId);

    for (var i = 0; i < allOpts.length; i++) {
      allOpts[i].classList.remove('selected', 'correct', 'wrong');
      allOpts[i].style.pointerEvents = 'none';
    }

    if (isCorrect) {
      optEl.classList.add('correct');
      if (fb) {
        fb.innerHTML = '<div class="feedback ok">✓ Correct! +' + xpVal + ' XP Earned.</div>';
      }
      playTone('correct');
      fireConfetti(35);
      this.streak++;
      this.awardXP(xpVal);
    } else {
      optEl.classList.add('wrong');
      if (fb) {
        var mHtml = misconception ? '<div class="misconception">' + rt('⚠ ' + misconception, true).replace(/^<div class="lle-text-sm">/, '').replace(/<\\/div>$/, '') + '</div>' : '';
        fb.innerHTML = '<div class="feedback no">✗ Incorrect answer.</div>' + mHtml;
      }
      playTone('wrong');
      this.streak = 0;
      this.updateStats();

      setTimeout(function() {
        for (var j = 0; j < allOpts.length; j++) {
          allOpts[j].classList.remove('selected', 'wrong');
          allOpts[j].style.pointerEvents = '';
        }
      }, 3500);
    }
  },

  showNextHint: function(qId) {
    var hb = document.getElementById('hb_' + qId);
    var ht = document.getElementById('ht_' + qId);
    var hl = document.getElementById('hl_' + qId);
    if (!hb || !ht) return;

    var curTier = this._hintState[qId] || 0;
    curTier = (curTier % 4) + 1;
    this._hintState[qId] = curTier;

    var hintKey = 'h' + curTier;
    var hintContent = hb.getAttribute('data-' + hintKey) || '';
    if (hl) hl.textContent = '[Tier ' + curTier + '/4]';
    ht.innerHTML = '<b>Tier ' + curTier + ' Hint:</b> ' + rt(hintContent, true).replace(/^<div class="lle-text-sm">/, '').replace(/<\\/div>$/, '');
    ht.style.display = 'block';
    playTone('tap');
  }
};

window.addEventListener('resize', function(){
  var canvas = document.getElementById('conceptCanvas');
  if (canvas && window.App && typeof App.mountSim === 'function' && App.activeTab === 'concept') {
    var node = NODES[App.nIdx];
    var step = node && node.steps ? node.steps[App.sIdx] : null;
    if (step && step.simType) {
      App.mountSim(step.simType);
    }
  }
});

window.addEventListener('DOMContentLoaded', function(){ App.init(); });
if (document.readyState === 'complete' || document.readyState === 'interactive') { App.init(); }
</script>
</body></html>`;

// 8. Output target file path
const outputPath = path.resolve(__dirname, 'SquareCubeRoots_Class8_Gamified_v5_Enhanced_v6.html');
fs.writeFileSync(outputPath, htmlContent, 'utf8');
console.log(`[SUCCESS] Chapter monolithic HTML successfully generated!`);
console.log(`Output: ${outputPath}`);
console.log(`Size: ${(fs.statSync(outputPath).size / 1024).toFixed(2)} KB`);
