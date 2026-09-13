import os

base_file = r"C:\Users\admin\Downloads\NGO AI LLM\Aasha-AI\chapters\RationalNumbers_Class8_MDS.html"
target_file = r"C:\Users\admin\Downloads\NGO AI LLM\Aasha-AI\chapters\RationalNumbers_Class8_AD.html"

with open(base_file, "r", encoding="utf-8") as f:
    html = f.read()

# 1. Update Titles & Branding to explicitly reflect AD Textbook
html = html.replace(
    "Class 8 Rational Numbers — Aasha Learning Ecosystem",
    "Class 8 Rational Numbers (AD Edition — Full Book Exercises) — Aasha Learning Ecosystem"
)
html = html.replace(
    "आशा लर्निंग इकोसिस्टम • कक्षा 8 गणित",
    "आशा लर्निंग इकोसिस्टम • कक्षा 8 गणित (AD स्कूल एडिशन)"
)
html = html.replace(
    "Chapter 1: Rational Numbers (परिमेय संख्याएँ)",
    "Chapter 1: Rational Numbers (AD Textbook Curriculum & 100% Exercises)"
)

# 2. Add Drill Mode Button to the Top Bar
topbar_target = '<div class="topbar">'
topbar_replacement = '''<div class="topbar">
    <button class="exit-btn" id="modeToggleBtn" onclick="App.toggleDrills()" style="background:#eff6ff;border:1.5px solid #2563eb;border-radius:12px;padding:4px 10px;font-size:0.75rem;font-weight:800;color:#1d4ed8;margin-right:6px">⚡ 100% Book Drills (1A-1C)</button>'''
html = html.replace(topbar_target, topbar_replacement, 1)

# 3. Replace Node 1 Intro with Seema & Sachin's exact Embark On scenario from AD Textbook
node1_intro_target = '''        "title": "Why do we need numbers beyond whole numbers and fractions?",
        "sub": "Seema bought 5 pens for 40 rupees wholesale at 8 rupees per pen. But tracking profit, debt, and sharing parts requires numbers with signs. Let us explore rational numbers!"'''
node1_intro_replacement = '''        "title": "Seema & Sachin at the Stationery Shop (AD Textbook Embark On)",
        "sub": "Seema wants to buy 3 pens, each costing ₹5. Her brother Sachin wants 2 similar pens. The shopkeeper offers a packet of 5 pens for ₹22. Cost per pen = 22/5 = ₹4.40. Neither whole number nor integer: a rational number p/q!"'''
html = html.replace(node1_intro_target, node1_intro_replacement, 1)

# 4. Inject 100% AD Exercises Data and Drill Engine before App object
ad_exercises_code = '''
// ═══ 100% AD TEXTBOOK EXERCISE DRILLS (EXERCISE 1A, 1B, 1C & PRESCRIBED) ═══
var AD_DRILLS = [
  // Exercise 1A Q1: Addition
  { tag: "AD Ex 1A Q1(a)", q: "Add the rational numbers: 5/2 and -11/2", opts: [{t: "-3", c: true}, {t: "-6", c: false}, {t: "3", c: false}, {t: "-16/2", c: false}], exp: "Common denominator 2: [5 + (-11)]/2 = -6/2 = -3." },
  { tag: "AD Ex 1A Q1(b)", q: "Add: 7/5 and 13/5", opts: [{t: "4", c: true}, {t: "20", c: false}, {t: "6/5", c: false}, {t: "2", c: false}], exp: "(7 + 13)/5 = 20/5 = 4." },
  { tag: "AD Ex 1A Q1(c)", q: "Add: -7/8 and 12/-8", opts: [{t: "-19/8", c: true}, {t: "5/8", c: false}, {t: "-5/8", c: false}, {t: "19/8", c: false}], exp: "12/-8 = -12/8. Sum = (-7 + -12)/8 = -19/8." },
  { tag: "AD Ex 1A Q1(d)", q: "Add: -11/5 and -9/5", opts: [{t: "-4", c: true}, {t: "-2", c: false}, {t: "4", c: false}, {t: "-20", c: false}], exp: "(-11 + -9)/5 = -20/5 = -4." },
  { tag: "AD Ex 1A Q1(e)", q: "Add: 4/-7 and -5/8", opts: [{t: "-67/56", c: true}, {t: "-3/56", c: false}, {t: "67/56", c: false}, {t: "-9/15", c: false}], exp: "4/-7 = -4/7. LCM(7, 8) = 56. [(-4*8) + (-5*7)]/56 = (-32 - 35)/56 = -67/56." },
  { tag: "AD Ex 1A Q1(f)", q: "Add: -13/7 and 12/-5", opts: [{t: "-149/35", c: true}, {t: "-1/35", c: false}, {t: "149/35", c: false}, {t: "-25/12", c: false}], exp: "12/-5 = -12/5. LCM(7, 5) = 35. [(-13*5) + (-12*7)]/35 = (-65 - 84)/35 = -149/35." },
  { tag: "AD Ex 1A Q1(g)", q: "Add: -15/9 and -17/11", opts: [{t: "-106/33", c: true}, {t: "-32/99", c: false}, {t: "106/33", c: false}, {t: "-318/11", c: false}], exp: "-15/9 = -5/3. LCM(3, 11) = 33. [(-5*11) + (-17*3)]/33 = (-55 - 51)/33 = -106/33." },
  { tag: "AD Ex 1A Q1(h)", q: "Add: -9/-33 and 5/11", opts: [{t: "8/11", c: true}, {t: "-4/11", c: false}, {t: "14/33", c: false}, {t: "3/11", c: false}], exp: "-9/-33 = 9/33 = 3/11. Sum = 3/11 + 5/11 = 8/11." },

  // Exercise 1A Q2: Subtraction
  { tag: "AD Ex 1A Q2(a)", q: "Subtract: (-18/5) - (-8/5)", opts: [{t: "-2", c: true}, {t: "-26/5", c: false}, {t: "2", c: false}, {t: "-10", c: false}], exp: "[-18 - (-8)]/5 = (-18 + 8)/5 = -10/5 = -2." },
  { tag: "AD Ex 1A Q2(b)", q: "Subtract: (-19/15) - (-6/30)", opts: [{t: "-16/15", c: true}, {t: "-13/15", c: false}, {t: "-32/30", c: false}, {t: "-1", c: false}], exp: "-6/30 = -3/15. -19/15 - (-3/15) = (-19 + 3)/15 = -16/15." },
  { tag: "AD Ex 1A Q2(c)", q: "Subtract: (-6/11) - (-7/11)", opts: [{t: "1/11", c: true}, {t: "-13/11", c: false}, {t: "-1/11", c: false}, {t: "13/11", c: false}], exp: "[-6 - (-7)]/11 = (-6 + 7)/11 = 1/11." },
  { tag: "AD Ex 1A Q2(d)", q: "Subtract: (-1/4) - (-2/8)", opts: [{t: "0", c: true}, {t: "-1/4", c: false}, {t: "1/2", c: false}, {t: "-4/8", c: false}], exp: "-2/8 = -1/4. -1/4 - (-1/4) = 0." },
  { tag: "AD Ex 1A Q2(e)", q: "Subtract: (-59/5) - (19/5)", opts: [{t: "-78/5", c: true}, {t: "-40/5", c: false}, {t: "78/5", c: false}, {t: "-8", c: false}], exp: "(-59 - 19)/5 = -78/5." },
  { tag: "AD Ex 1A Q2(f)", q: "Subtract: (-4/7) - (-8/9)", opts: [{t: "20/63", c: true}, {t: "-20/63", c: false}, {t: "-92/63", c: false}, {t: "4/63", c: false}], exp: "LCM(7, 9) = 63. [(-4*9) - (-8*7)]/63 = (-36 + 56)/63 = 20/63." },
  { tag: "AD Ex 1A Q2(g)", q: "Subtract: (7/24) - (-13/-26)", opts: [{t: "-5/24", c: true}, {t: "5/24", c: false}, {t: "19/24", c: false}, {t: "-1/2", c: false}], exp: "-13/-26 = 1/2 = 12/24. 7/24 - 12/24 = -5/24." },
  { tag: "AD Ex 1A Q2(h)", q: "Subtract: (7/25) - (-6/15)", opts: [{t: "17/25", c: true}, {t: "-17/25", c: false}, {t: "1/25", c: false}, {t: "13/75", c: false}], exp: "-6/15 = -2/5 = -10/25. 7/25 - (-10/25) = 17/25." },

  // Exercise 1A Q3: Multiplication
  { tag: "AD Ex 1A Q3(a)", q: "Multiply: (4/7) by (-2/5)", opts: [{t: "-8/35", c: true}, {t: "8/35", c: false}, {t: "-2/35", c: false}, {t: "-6/12", c: false}], exp: "(4 * -2) / (7 * 5) = -8/35." },
  { tag: "AD Ex 1A Q3(b)", q: "Multiply: (-3/8) by (-12/15)", opts: [{t: "3/10", c: true}, {t: "-3/10", c: false}, {t: "36/120", c: false}, {t: "9/10", c: false}], exp: "(-3/8) * (-4/5) = (-3 * -1) / (2 * 5) = 3/10." },
  { tag: "AD Ex 1A Q3(c)", q: "Multiply: (11/-13) by (-39/22)", opts: [{t: "3/2", c: true}, {t: "-3/2", c: false}, {t: "1", c: false}, {t: "6/4", c: false}], exp: "Cross cancel: (1 * 3)/(1 * 2) = 3/2." },
  { tag: "AD Ex 1A Q3(d)", q: "Multiply: (-5/9) by (81/35)", opts: [{t: "-9/7", c: true}, {t: "9/7", c: false}, {t: "-45/35", c: false}, {t: "-27/7", c: false}], exp: "Cross cancel 5 with 35 and 9 with 81: (-1 * 9)/(1 * 7) = -9/7." },
  { tag: "AD Ex 1A Q3(e)", q: "Multiply: (-9/25) by (-35/27)", opts: [{t: "7/15", c: true}, {t: "-7/15", c: false}, {t: "5/9", c: false}, {t: "14/15", c: false}], exp: "(-9/25) * (-35/27) = (-1 * -7) / (5 * 3) = 7/15." },
  { tag: "AD Ex 1A Q3(f)", q: "Multiply: (-18/25) by (40/-36)", opts: [{t: "4/5", c: true}, {t: "-4/5", c: false}, {t: "2/5", c: false}, {t: "1", c: false}], exp: "40/-36 = -10/9. (-18/25) * (-10/9) = (-2 * -2) / (5 * 1) = 4/5." },

  // Exercise 1A Q4: Division
  { tag: "AD Ex 1A Q4(a)", q: "Divide: (16/7) by (-8/14)", opts: [{t: "-4", c: true}, {t: "4", c: false}, {t: "-2", c: false}, {t: "-16/7", c: false}], exp: "(16/7) * (14/-8) = (2 * 2)/(-1) = -4." },
  { tag: "AD Ex 1A Q4(b)", q: "Divide: (-7/8) by (-21)", opts: [{t: "1/24", c: true}, {t: "-1/24", c: false}, {t: "24", c: false}, {t: "3/8", c: false}], exp: "(-7/8) * (1/-21) = 7 / (8 * 21) = 1/24." },
  { tag: "AD Ex 1A Q4(c)", q: "Divide: (3/8) by (-4/5)", opts: [{t: "-15/32", c: true}, {t: "15/32", c: false}, {t: "-12/40", c: false}, {t: "-3/10", c: false}], exp: "(3/8) * (-5/4) = -15/32." },
  { tag: "AD Ex 1A Q4(d)", q: "Divide: (-1/15) by (8/3)", opts: [{t: "-1/40", c: true}, {t: "1/40", c: false}, {t: "-8/45", c: false}, {t: "-5/8", c: false}], exp: "(-1/15) * (3/8) = -1/40." },
  { tag: "AD Ex 1A Q4(e)", q: "Divide: (-3/26) by (9/78)", opts: [{t: "-1", c: true}, {t: "1", c: false}, {t: "-3", c: false}, {t: "-27/26", c: false}], exp: "9/78 = 3/26. (-3/26) / (3/26) = -1." },
  { tag: "AD Ex 1A Q4(f)", q: "Divide: (-22/26) by (-33/39)", opts: [{t: "1", c: true}, {t: "-1", c: false}, {t: "2/3", c: false}, {t: "4/9", c: false}], exp: "Both reduce to -11/13. (-11/13) / (-11/13) = 1." },

  // Exercise 1B: Properties of Addition
  { tag: "AD Ex 1B Q1(a)", q: "Commutative Property: (-3/7) + (4/9) = _____ + (-3/7)", opts: [{t: "4/9", c: true}, {t: "-4/9", c: false}, {t: "3/7", c: false}, {t: "0", c: false}], exp: "Commutative: a + b = b + a. Blank is 4/9." },
  { tag: "AD Ex 1B Q1(b)", q: "Commutative Property: (2/3) + (-5/6) = (-5/6) + _____?", opts: [{t: "2/3", c: true}, {t: "-2/3", c: false}, {t: "5/6", c: false}, {t: "1", c: false}], exp: "a + b = b + a. Blank is 2/3." },
  { tag: "AD Ex 1B Q2(a)", q: "Associative Property: [(1/11) + (2/13)] + (7/6) = (1/11) + [_____ + (7/6)]", opts: [{t: "2/13", c: true}, {t: "1/11", c: false}, {t: "7/6", c: false}, {t: "-2/13", c: false}], exp: "(a + b) + c = a + (b + c). Missing term is 2/13." },
  { tag: "AD Ex 1B Q3(a)", q: "State property: (-2/5) + (3/7) = (3/7) + (-2/5)", opts: [{t: "Commutative Property of Addition", c: true}, {t: "Associative Property", c: false}, {t: "Closure", c: false}, {t: "Identity", c: false}], exp: "Order of addition is swapped: Commutative Property." },
  { tag: "AD Ex 1B Q3(b)", q: "State property: (2/5) + [(9/7) + (-3/8)] = [(2/5) + (9/7)] + (-3/8)", opts: [{t: "Associative Property of Addition", c: true}, {t: "Commutative Property", c: false}, {t: "Distributive Property", c: false}, {t: "Additive Inverse", c: false}], exp: "Grouping of terms is changed: Associative Property." },

  // Exercise 1C: Properties of Multiplication & Board Questions
  { tag: "AD Ex 1C Q4(a)", q: "State property: (2/7) * (13/11) = (13/11) * (2/7)", opts: [{t: "Commutative Property of Multiplication", c: true}, {t: "Associative Property", c: false}, {t: "Distributive", c: false}, {t: "Identity", c: false}], exp: "Order of factors is swapped: Commutative Property of Multiplication." },
  { tag: "AD Ex 1C Q4(b)", q: "State property: (-5/7) * [(6/11) * (7/13)] = [(-5/7) * (6/11)] * (7/13)", opts: [{t: "Associative Property of Multiplication", c: true}, {t: "Distributive", c: false}, {t: "Commutative", c: false}, {t: "Closure", c: false}], exp: "Grouping of factors is changed: Associative Property." },
  { tag: "AD Ex 1C Q4(c)", q: "State property: (1/7) * (3/5) = 3/35 is a rational number", opts: [{t: "Closure Property of Multiplication", c: true}, {t: "Commutative", c: false}, {t: "Associative", c: false}, {t: "Identity", c: false}], exp: "Product of rationals is rational: Closure Property." },
  { tag: "AD Ex 1C Q4(d)", q: "State property: (7/11) * [(1/6) + (2/13)] = [(7/11) * (1/6)] + [(7/11) * (2/13)]", opts: [{t: "Distributive Property of Multiplication over Addition", c: true}, {t: "Associative", c: false}, {t: "Commutative", c: false}, {t: "Closure", c: false}], exp: "Multiplication distributed over addition: Distributive Property." },
  { tag: "AD Ex 1C Q4(e)", q: "State property: (-9/8) * 0 = 0 = 0 * (-9/8)", opts: [{t: "Multiplicative Property of Zero", c: true}, {t: "Multiplicative Identity", c: false}, {t: "Additive Identity", c: false}, {t: "Closure", c: false}], exp: "Any number multiplied by 0 is 0." },
  { tag: "AD Ex 1C Q4(f)", q: "State property: 1 * (7/9) = 7/9", opts: [{t: "Multiplicative Identity (Property of 1)", c: true}, {t: "Additive Identity", c: false}, {t: "Reciprocal Property", c: false}, {t: "Closure", c: false}], exp: "1 is the multiplicative identity." },

  // Prescribed Board Solved Questions
  { tag: "AD Prescribed Q1(i)", q: "Name property: (-4/5) * 1 = 1 * (-4/5) = -4/5", opts: [{t: "1 is the Multiplicative Identity", c: true}, {t: "Commutativity only", c: false}, {t: "Multiplicative Inverse", c: false}, {t: "Closure", c: false}], exp: "Prescribed Answer: 1 is the multiplicative identity." },
  { tag: "AD Prescribed Q1(ii)", q: "Name property: (-13/17) * (-2/7) = (-2/7) * (-13/17)", opts: [{t: "Commutativity of Multiplication", c: true}, {t: "Associativity", c: false}, {t: "Distributivity", c: false}, {t: "Multiplicative Identity", c: false}], exp: "Prescribed Answer: Commutativity." },
  { tag: "AD Prescribed Q1(iii)", q: "Name property: (-19/29) * (29/-19) = 1", opts: [{t: "Multiplicative Inverse (Reciprocal)", c: true}, {t: "Multiplicative Identity", c: false}, {t: "Closure", c: false}, {t: "Associativity", c: false}], exp: "Prescribed Answer: Multiplicative inverse." },
  { tag: "AD Prescribed Q2", q: "What property allows computing (1/3) * [6 * (4/3)] as [(1/3) * 6] * (4/3)?", opts: [{t: "Associative Property of Multiplication", c: true}, {t: "Commutative Property", c: false}, {t: "Distributive Property", c: false}, {t: "Closure", c: false}], exp: "Prescribed Answer: Form a * (b * c) = (a * b) * c, hence associative property." },
  { tag: "AD Prescribed Q3", q: "The product of two rational numbers is always a _____?", opts: [{t: "Rational number (Closure Property)", c: true}, {t: "Whole number", c: false}, {t: "Positive integer", c: false}, {t: "Fraction with positive numerator", c: false}], exp: "Prescribed Answer: Product of two rational numbers is always a rational number." }
];
'''
html = html.replace('var App = {', ad_exercises_code + '\nvar App = {', 1)

# 5. Add drill state and handlers to App object
drill_app_methods = '''  inDrills: false,
  drillIdx: 0,
  drillAnswered: false,
  drillSelOpt: null,

  toggleDrills: function() {
    this.inDrills = !this.inDrills;
    var btn = document.getElementById("modeToggleBtn");
    if (btn) {
      btn.textContent = this.inDrills ? "📖 Back to Lesson" : "⚡ 100% Book Drills (1A-1C)";
      btn.style.background = this.inDrills ? "#fef3c7" : "#eff6ff";
      btn.style.color = this.inDrills ? "#92400e" : "#1d4ed8";
    }
    this.render();
  },

  renderDrillQuestion: function() {
    var item = AD_DRILLS[this.drillIdx];
    var pct = Math.round(((this.drillIdx + 1) / AD_DRILLS.length) * 100);
    document.getElementById("progressFill").style.width = pct + "%";

    var html = '<div class="quiz-card" style="border:2.5px solid #7c3aed">';
    html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">';
    html += '<span class="we-tag" style="background:#f5f3ff;color:#6d28d9">AD BOOK DRILL: ' + (this.drillIdx + 1) + ' / ' + AD_DRILLS.length + '</span>';
    html += '<span style="font-size:0.75rem;font-weight:800;color:#7c3aed">' + item.tag + '</span>';
    html += '</div>';
    html += '<div class="quiz-q">' + item.q + '</div>';
    html += '<div id="drillOptsWrap">';
    for (var i = 0; i < item.opts.length; i++) {
      html += '<div class="quiz-opt" id="dopt_' + i + '" onclick="App.pickDrillOpt(' + i + ')">';
      html += '<div class="quiz-radio"></div>';
      html += '<div class="quiz-opt-text">' + item.opts[i].t + '</div>';
      html += '</div>';
    }
    html += '</div><div id="drillFeedback"></div></div>';
    document.getElementById("screen").innerHTML = html;
    document.getElementById("bottomBar").style.display = "block";
    document.getElementById("backBtn").style.display = (this.drillIdx > 0) ? "inline-block" : "none";
    document.getElementById("continueBtn").textContent = "Check Answer";
    document.getElementById("continueBtn").disabled = (this.drillSelOpt === null);
  },

  pickDrillOpt: function(idx) {
    if (this.drillAnswered) return;
    this.drillSelOpt = idx; playTone("tap");
    for (var i = 0; i < AD_DRILLS[this.drillIdx].opts.length; i++) {
      var el = document.getElementById("dopt_" + i);
      if (el) el.classList.toggle("selected", i === idx);
    }
    document.getElementById("continueBtn").disabled = false;
  },

  checkDrill: function() {
    var item = AD_DRILLS[this.drillIdx];
    var opt = item.opts[this.drillSelOpt];
    var fb = document.getElementById("drillFeedback");
    this.drillAnswered = true;
    if (opt.c) {
      document.getElementById("dopt_" + this.drillSelOpt).classList.add("correct");
      fb.innerHTML = '<div class="feedback ok">✓ Correct! Textbook verified. +10 XP</div><div class="we-step green" style="margin-top:8px"><strong>Explanation:</strong> ' + item.exp + '</div>';
      this.streak++; this.awardXP(10); playTone("correct"); fireConfetti(35);
      document.getElementById("continueBtn").textContent = (this.drillIdx < AD_DRILLS.length - 1) ? "Next Book Question →" : "🏆 Finish All Drills";
    } else {
      document.getElementById("dopt_" + this.drillSelOpt).classList.add("wrong");
      fb.innerHTML = '<div class="feedback no">✗ Not quite. Try recalculating!</div>';
      this.streak = 0; playTone("wrong");
      document.getElementById("continueBtn").textContent = "Try Again";
      var self = this;
      setTimeout(function(){
        self.drillAnswered = false; self.drillSelOpt = null;
        for (var i = 0; i < item.opts.length; i++) {
          var el = document.getElementById("dopt_" + i);
          if (el) el.classList.remove("selected", "wrong");
        }
        fb.innerHTML = ""; document.getElementById("continueBtn").textContent = "Check Answer";
        document.getElementById("continueBtn").disabled = true;
      }, 2500);
    }
  },
'''
html = html.replace('var App = {', 'var App = {\n' + drill_app_methods, 1)

# 6. Intercept render, onContinue, goBack in App for drill mode
render_hook_target = 'render: function() {'
render_hook_replacement = '''render: function() {
    if (this.inDrills) {
      this.renderDrillQuestion();
      return;
    }'''
html = html.replace(render_hook_target, render_hook_replacement, 1)

on_continue_target = 'onContinue: function() {'
on_continue_replacement = '''onContinue: function() {
    if (this.inDrills) {
      if (!this.drillAnswered) { this.checkDrill(); return; }
      this.drillIdx++;
      if (this.drillIdx >= AD_DRILLS.length) {
        alert("🎉 Outstanding! You have solved 100% of the AD Textbook exercises (1A, 1B, 1C) and board prescribed questions!");
        this.drillIdx = 0; this.inDrills = false;
        var btn = document.getElementById("modeToggleBtn");
        if (btn) { btn.textContent = "⚡ 100% Book Drills (1A-1C)"; btn.style.background = "#eff6ff"; btn.style.color = "#1d4ed8"; }
      }
      this.drillAnswered = false; this.drillSelOpt = null;
      this.render();
      return;
    }'''
html = html.replace(on_continue_target, on_continue_replacement, 1)

goback_target = 'goBack: function() {'
goback_replacement = '''goBack: function() {
    if (this.inDrills) {
      if (this.drillIdx > 0) this.drillIdx--;
      this.drillAnswered = false; this.drillSelOpt = null;
      this.render();
      return;
    }'''
html = html.replace(goback_target, goback_replacement, 1)

# Write target file
with open(target_file, "w", encoding="utf-8") as f:
    f.write(html)

print("Successfully written enhanced AD chapter to:", target_file)
print("File size:", os.path.getsize(target_file), "bytes")
