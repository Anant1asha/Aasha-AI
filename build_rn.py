import re

with open(r'c:\Users\admin\Downloads\NGO AI LLM\Aasha-AI\standalone_chapters\Fractions_Gamified_v5 (2).html', 'r', encoding='utf-8') as f:
    content = f.read()

start_to_levels_match = re.search(r'(.*?)(var LEVELS =)', content, re.DOTALL)
if start_to_levels_match:
    header_and_utils = start_to_levels_match.group(1)
    
    new_wm_terms = '''rational:"परिमेय (रैशनल)", integer:"पूर्णांक (इंटीजर)", integers:"पूर्णांक (इंटीजर्स)", negative:"ऋणात्मक (नेगेटिव)", positive:"धनात्मक (पॉजिटिव)", standard:"मानक (स्टैंडर्ड)", additive:"योगात्मक (ऐडिटिव)", multiplicative:"गुणनात्मक (मल्टिप्लिकेटिव)", identity:"अभेद्य (आइडेंटिटी)", closure:"संवृत्तता (क्लोजर)", commutative:"क्रमविनिमेय (कम्यूटेटिव)", associative:"साहचर्य (असोसिएटिव)", distributive:"वितरण (डिस्ट्रिब्यूटिव)", density:"घनता (डेंसिटी)", absolute:"निरपेक्ष (ऐब्सोल्यूट)", equivalent:"तुल्य (इक्विवलेंट)", zero:"शून्य (ज़ीरो)", origin:"उद्गम (ओरिजिन)", between:"बीच में (बिटवीन)", neither:"न तो (नाइदर)", properties:"गुण-धर्म (प्रॉपर्टीज़)", property:"गुण-धर्म (प्रॉपर्टी)", verify:"सत्यापन (वेरिफाई)", verified:"सत्यापित (वेरिफाइड)", temperature:"तापमान (टेंपरेचर)", drops:"गिरता है (ड्रॉप्स)"'''
    header_and_utils = re.sub(r'(var WM = \{)(.*?)(\};)', r'\1\2, ' + new_wm_terms + r'\3', header_and_utils, flags=re.DOTALL)
    
    app_engine_match = re.search(r'(var App = \{.*?\n\s*\};\n\s*App\.init\(\);\n.*?</script>\n</body>\n</html>)', content, re.DOTALL)
    if app_engine_match:
        app_engine = app_engine_match.group(1)
        
        new_canvas_functions = '''
function drawRatBar(canvas, p, q, progress) {
  var ctx = canvas.getContext('2d');
  var w = canvas.width, h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  var isNeg = p < 0;
  var absP = Math.abs(p);
  var color = isNeg ? '#ef4444' : '#3b82f6';
  var label = (isNeg ? '-' : '+') + absP + '/' + q;
  var prog = progress !== undefined ? progress : 1;
  var segW = w / q;
  for (var i = 0; i < q; i++) {
    var filled = i < absP;
    ctx.fillStyle = filled ? color : '#e2e8f0';
    if (filled) {
      ctx.globalAlpha = prog;
      ctx.fillRect(i * segW + 2, 2, segW - 4, h - 24);
      ctx.globalAlpha = 1;
    } else {
      ctx.fillRect(i * segW + 2, 2, segW - 4, h - 24);
    }
    ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 1.5;
    ctx.strokeRect(i * segW + 2, 2, segW - 4, h - 24);
  }
  ctx.fillStyle = color; ctx.font = 'bold 13px sans-serif';
  ctx.textAlign = 'center'; ctx.fillText(label, w / 2, h - 4);
}

function animateRatBar(canvas, p, q) {
  var start = performance.now(), dur = 700;
  function frame(t) {
    var e = Math.min((t - start) / dur, 1);
    var eased = 1 - Math.pow(1 - e, 3);
    drawRatBar(canvas, p, q, eased);
    if (e < 1) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

function drawExtNumLine(canvas, markers, min, max) {
  var ctx = canvas.getContext('2d');
  var w = canvas.width, h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  var pad = 36, lineY = h / 2;
  var range = max - min, lineW = w - pad * 2;
  function toX(v) { return pad + (v - min) / range * lineW; }
  ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(pad, lineY); ctx.lineTo(pad + lineW, lineY); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(pad - 8, lineY); ctx.lineTo(pad, lineY - 5); ctx.lineTo(pad, lineY + 5); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(pad + lineW + 8, lineY); ctx.lineTo(pad + lineW, lineY - 5); ctx.lineTo(pad + lineW, lineY + 5); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#0f172a'; ctx.font = '12px sans-serif'; ctx.textAlign = 'center';
  for (var i = Math.ceil(min); i <= Math.floor(max); i++) {
    var x = toX(i);
    ctx.strokeStyle = '#475569'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x, lineY - 10); ctx.lineTo(x, lineY + 10); ctx.stroke();
    ctx.fillText(i, x, lineY + 24);
  }
  var colors = ['#3b82f6','#22c55e','#f59e0b','#8b5cf6','#ef4444'];
  for (var j = 0; j < markers.length; j++) {
    var m = markers[j]; var mx = toX(m.val);
    ctx.fillStyle = colors[j % colors.length]; ctx.globalAlpha = 0.3;
    ctx.beginPath(); ctx.arc(mx, lineY, 14, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1; ctx.beginPath(); ctx.arc(mx, lineY, 7, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = colors[j % colors.length]; ctx.font = 'bold 11px sans-serif';
    ctx.fillText(m.label, mx, lineY - 18);
  }
}

function drawDensity(canvas, a_num, a_den, b_num, b_den, zoom) {
  var ctx = canvas.getContext('2d');
  var w = canvas.width, h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  var left = a_num / a_den, right = b_num / b_den;
  var mid = (left + right) / 2;
  var range = (right - left) / zoom;
  var viewLeft = mid - range / 2, viewRight = mid + range / 2;
  var lineY = h / 2, pad = 30, lineW = w - pad * 2;
  function toX(v) { return pad + (v - viewLeft) / (viewRight - viewLeft) * lineW; }
  ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(pad, lineY); ctx.lineTo(pad + lineW, lineY); ctx.stroke();
  var count = Math.floor(zoom * 3);
  ctx.fillStyle = '#3b82f6'; ctx.font = '10px sans-serif'; ctx.textAlign = 'center';
  for (var k = 1; k <= count; k++) {
    var v = left + k * (right - left) / (count + 1);
    var x = toX(v);
    if (x >= pad && x <= pad + lineW) {
      ctx.beginPath(); ctx.arc(x, lineY, 4, 0, Math.PI * 2); ctx.fill();
      if (count < 8) {
        var approxN = Math.round(v * (a_den * b_den));
        ctx.fillText(approxN + '/' + (a_den * b_den), x, lineY - 12);
      }
    }
  }
  ctx.fillStyle = '#ef4444'; ctx.font = 'bold 12px sans-serif';
  var lx = toX(left), rx = toX(right);
  if (lx >= pad && lx <= pad + lineW) { ctx.beginPath(); ctx.arc(lx, lineY, 6, 0, Math.PI * 2); ctx.fill(); ctx.fillText(a_num+'/'+a_den, lx, lineY + 20); }
  ctx.fillStyle = '#22c55e';
  if (rx >= pad && rx <= pad + lineW) { ctx.beginPath(); ctx.arc(rx, lineY, 6, 0, Math.PI * 2); ctx.fill(); ctx.fillText(b_num+'/'+b_den, rx, lineY + 20); }
  ctx.fillStyle = '#0f172a'; ctx.font = '11px sans-serif';
  ctx.fillText('Zoom: ' + zoom.toFixed(1) + 'x — ' + count + ' rational(s) visible between ' + a_num+'/'+a_den + ' and ' + b_num+'/'+b_den, w/2, h - 10);
}

var WE_RN = {
we_standardForm: {title:"Solved: Standard Form of -36/24",question:"Reduce -36/24 to standard form.",steps:[
  {text:"Step 1: The denominator (24) is positive. Good — standard form requires positive denominator.",c:"blue"},
  {text:"Step 2: Find HCF of |-36| = 36 and 24. Factors of 36: 1,2,3,4,6,9,12,18,36. Factors of 24: 1,2,3,4,6,8,12,24. HCF = 12.",c:"blue",check:{q:"What is the HCF of 36 and 24?",opts:[{t:"12",c:true,m:""},{t:"6",c:false,m:"6 divides both but 12 is larger. HCF is the greatest common factor."},{t:"24",c:false,m:"24 does not divide 36. Factors of 36 are 1,2,3,4,6,9,12,18,36."}]}},
  {text:"Step 3: Divide both by HCF (12): -36 ÷ 12 = -3, 24 ÷ 12 = 2.",c:"blue"},
  {text:"Answer: -36/24 = -3/2 (standard form)",c:"green",final:true}],check:{q:"What does standard form of a rational number require?",opts:[{t:"Positive denominator and HCF of |numerator| and denominator = 1",c:true,m:""},{t:"Numerator must be 1",c:false,m:"Numerator can be any integer. Standard form requires GCD=1 and positive denominator."},{t:"Numerator and denominator must both be positive",c:false,m:"Negative rational numbers have negative numerators in standard form. Denominator must be positive."}]}},
we_numLine: {title:"Solved: Place -5/7 on Number Line",question:"Where does -5/7 lie on the number line?",steps:[
  {text:"Step 1: -5/7 is negative, so it lies to the LEFT of 0.",c:"blue"},
  {text:"Step 2: |-5/7| = 5/7 < 1, so -5/7 lies between -1 and 0.",c:"blue",check:{q:"Since -5/7 is negative and |5/7| < 1, where does -5/7 lie?",opts:[{t:"Between -1 and 0",c:true,m:""},{t:"Between 0 and 1",c:false,m:"-5/7 is negative so it is left of 0, not right."},{t:"Between -2 and -1",c:false,m:"Since |5/7| < 1, it is between -1 and 0, not further left."}]}},
  {text:"Step 3: Divide segment [-1, 0] into 7 equal parts. -5/7 is the 5th mark from 0 towards -1.",c:"blue"},
  {text:"Answer: -5/7 is between -1 and 0, closer to -1.",c:"green",final:true}],check:{q:"To place -p/q on the number line (where 0 < p/q < 1), where do you look?",opts:[{t:"Between -1 and 0, p/q of the way from 0 to -1",c:true,m:""},{t:"Between 0 and 1",c:false,m:"Negative rationals are left of 0, not between 0 and 1."},{t:"At exactly -1",c:false,m:"-1 is an integer. -5/7 is a fraction, so it lies between two integers."}]}},
we_threeRationals: {title:"Solved: Find 3 Rationals between 1/4 and 1/2",question:"Find 3 rational numbers between 1/4 and 1/2.",steps:[
  {text:"Method: Use (a+b)/2 repeatedly, OR convert to equivalent fractions with larger denominator.",c:"blue"},
  {text:"Step 1: Multiply both by 8/8: 1/4 = 2/8 and 1/2 = 4/8. Now find numbers between 2/8 and 4/8.",c:"blue",check:{q:"Why do we multiply numerator and denominator by the same number?",opts:[{t:"To get equivalent fractions with a larger denominator, creating space for more fractions between them",c:true,m:""},{t:"To make fractions bigger",c:false,m:"Equivalent fractions have the same value. We do it to see fractions between them more clearly."},{t:"To add the fractions together",c:false,m:"We are finding fractions between them, not adding them."}]}},
  {text:"Step 2: Three fractions between 2/8 and 4/8 are: 3/8, 10/24, 11/24 (there are infinitely many!).",c:"blue"},
  {text:"Answer: 3/8, 5/16, 7/24 are three rational numbers between 1/4 and 1/2.",c:"green",final:true}],check:{q:"How many rational numbers exist between any two rational numbers?",opts:[{t:"Infinitely many (this is called the density property)",c:true,m:""},{t:"Exactly one (their average)",c:false,m:"There are infinitely many! Between any two rationals you can always find another."},{t:"None",c:false,m:"There are infinitely many rational numbers between any two rationals."}]}},
we_add: {title:"Solved: Add (-2/3) + (4/5)",question:"Calculate: (-2/3) + (4/5)",steps:[
  {text:"Step 1: Denominators are different (3 and 5). Find LCM of 3 and 5 = 15.",c:"blue"},
  {text:"Step 2: Convert -2/3 → multiply by 5/5 → -10/15.",c:"blue",check:{q:"To convert -2/3 to denominator 15, what do you multiply by?",opts:[{t:"5 (because 15 ÷ 3 = 5), giving -10/15",c:true,m:""},{t:"3 (the denominator), giving -6/9",c:false,m:"We need denominator 15, not 9. 15 ÷ 3 = 5, so multiply by 5."},{t:"15, giving -30/45",c:false,m:"15 ÷ 3 = 5, so multiply by 5 only, not 15."}]}},
  {text:"Step 3: Convert 4/5 → multiply by 3/3 → 12/15.",c:"blue"},
  {text:"Step 4: Add: (-10/15) + (12/15) = (-10+12)/15 = 2/15.",c:"blue"},
  {text:"Answer: (-2/3) + (4/5) = 2/15",c:"green",final:true}],check:{q:"When adding rationals with different denominators, what is the first step?",opts:[{t:"Find the LCM of the denominators",c:true,m:""},{t:"Add numerators directly",c:false,m:"Parts of different sizes cannot be added directly. Find a common denominator first."},{t:"Multiply the denominators",c:false,m:"While multiplying gives A common denominator, LCM gives the LEAST common denominator."}]}},
we_multiply: {title:"Solved: Multiply (-3/4) × (-7/8)",question:"Multiply: (-3/4) × (-7/8)",steps:[
  {text:"Step 1: Multiply numerators: (-3) × (-7) = +21. (Negative × Negative = Positive!)",c:"blue"},
  {text:"Step 2: Multiply denominators: 4 × 8 = 32.",c:"blue",check:{q:"What is the sign rule when multiplying two negative numbers?",opts:[{t:"Negative × Negative = Positive",c:true,m:""},{t:"Negative × Negative = Negative",c:false,m:"Two negatives give a positive! (-3) × (-7) = +21."},{t:"The sign depends on the larger number",c:false,m:"The rule is simple: same signs give positive, different signs give negative."}]}},
  {text:"Step 3: Result = 21/32. Check if it simplifies: GCD(21,32) = 1, already in standard form.",c:"blue"},
  {text:"Answer: (-3/4) × (-7/8) = 21/32",c:"green",final:true}],check:{q:"When multiplying two rational numbers, how do you find the product?",opts:[{t:"Multiply numerators together and denominators together, then apply sign rules",c:true,m:""},{t:"Find LCM of denominators first",c:false,m:"LCM is for addition. For multiplication: numerator×numerator and denominator×denominator."},{t:"Flip the second fraction and multiply",c:false,m:"Flipping is for division. For multiplication: multiply straight across."}]}},
we_commute: {title:"Solved: Verify Commutativity for (-1/2) + (2/3)",question:"Verify: (-1/2) + (2/3) = (2/3) + (-1/2)",steps:[
  {text:"Step 1: Calculate LHS: (-1/2) + (2/3). LCM(2,3) = 6.",c:"blue"},
  {text:"Step 2: LHS = -3/6 + 4/6 = 1/6.",c:"blue",check:{q:"For LCM(2,3)=6: what is -1/2 with denominator 6?",opts:[{t:"-3/6 (multiply by 3/3)",c:true,m:""},{t:"-2/6 (multiply by 2/2)",c:false,m:"6÷2=3, so multiply by 3: -1×3=−3, giving -3/6."},{t:"-1/6 (divide by 2)",c:false,m:"We multiply by 3/3 to get denominator 6: -1×3/2×3 = -3/6."}]}},
  {text:"Step 3: Calculate RHS: (2/3) + (-1/2). LCM = 6. = 4/6 + (-3/6) = 1/6.",c:"blue"},
  {text:"Step 4: LHS = RHS = 1/6. Commutativity VERIFIED!",c:"green",final:true}],check:{q:"Commutativity of addition means:",opts:[{t:"a + b = b + a for all rational numbers",c:true,m:""},{t:"a - b = b - a",c:false,m:"Subtraction is NOT commutative. 3-1=2 but 1-3=-2. Addition is commutative, subtraction is not."},{t:"a × b = b × a only for positive rationals",c:false,m:"Commutativity of multiplication holds for ALL rationals including negatives."}]}},
we_reduce: {title:"Solved: Reduce -48/84 to Standard Form",question:"Reduce -48/84 to its standard form.",steps:[
  {text:"Step 1: Denominator (84) is positive. Good — no sign change needed.",c:"blue"},
  {text:"Step 2: Find HCF of 48 and 84. 48 = 2³×3, 84 = 2²×3×7. HCF = 2²×3 = 12.",c:"blue",check:{q:"What is the HCF of 48 and 84?",opts:[{t:"12",c:true,m:""},{t:"4",c:false,m:"4 divides both but 12 is larger. HCF(48,84): 48=4×12, 84=7×12, so HCF=12."},{t:"6",c:false,m:"6 divides both but 12 is larger. 48÷12=4, 84÷12=7, so HCF=12."}]}},
  {text:"Step 3: Divide: -48 ÷ 12 = -4, 84 ÷ 12 = 7.",c:"blue"},
  {text:"Answer: -48/84 = -4/7 (standard form)",c:"green",final:true}],check:{q:"To put a rational number in standard form, you need:",opts:[{t:"Denominator positive AND HCF(|numerator|, denominator) = 1",c:true,m:""},{t:"Just make the denominator 1",c:false,m:"Denominator=1 means integers. Standard form allows any denominator as long as it's positive and GCD=1."},{t:"Make numerator negative",c:false,m:"Standard form requires denominator positive, not necessarily negative numerator."}]}},
we_compare: {title:"Solved: Compare -7/9 and -5/6",question:"Which is greater: -7/9 or -5/6?",steps:[
  {text:"Step 1: Find LCM of 9 and 6 = 18.",c:"blue"},
  {text:"Step 2: Convert -7/9 → multiply by 2/2 → -14/18.",c:"blue",check:{q:"To compare negative fractions, do we still need a common denominator?",opts:[{t:"Yes — convert to same denominator, then compare numerators",c:true,m:""},{t:"No — just compare the positive parts",c:false,m:"Comparing positive parts gives the wrong order for negatives! -1/10 > -1/2 even though 1/2 > 1/10."},{t:"Compare denominators directly",c:false,m:"Denominator size alone does not determine fraction size. Need common denominator."}]}},
  {text:"Step 3: Convert -5/6 → multiply by 3/3 → -15/18.",c:"blue"},
  {text:"Step 4: Compare -14/18 and -15/18. Since -14 > -15 (less negative), -14/18 > -15/18.",c:"amber"},
  {text:"Answer: -7/9 > -5/6 (because -14/18 > -15/18)",c:"green",final:true}],check:{q:"When comparing two negative fractions, which is greater?",opts:[{t:"The one closer to zero (less negative) is greater",c:true,m:""},{t:"The one with the larger absolute value",c:false,m:"For negatives, larger absolute value means further from zero, which means SMALLER. -5 < -3 even though |−5| > |−3|."},{t:"The one with the larger numerator (in absolute value)",c:false,m:"You must use a common denominator first. You cannot compare numerators with different denominators."}]}},
we_distributive: {title:"Solved: Distributivity (3/5)×(-7/8) + (3/5)×(-1/8)",question:"Simplify using distributivity: (3/5)×(-7/8) + (3/5)×(-1/8)",steps:[
  {text:"Step 1: Identify the common factor: 3/5 appears in BOTH terms.",c:"blue"},
  {text:"Step 2: Apply distributivity: a×b + a×c = a×(b+c). Here a=3/5, b=-7/8, c=-1/8.",c:"blue",check:{q:"Distributivity says a×b + a×c equals:",opts:[{t:"a×(b+c) — factor out the common a",c:true,m:""},{t:"(a+b)×(a+c)",c:false,m:"That is NOT distributivity. Distributivity is a×b + a×c = a×(b+c)."},{t:"a×b×c",c:false,m:"Multiplying all three together is not what distributivity says. It is a×(b+c)."}]}},
  {text:"Step 3: b+c = (-7/8)+(-1/8) = -8/8 = -1.",c:"blue"},
  {text:"Step 4: a×(b+c) = (3/5)×(-1) = -3/5.",c:"blue"},
  {text:"Answer: (3/5)×(-7/8) + (3/5)×(-1/8) = -3/5",c:"green",final:true}],check:{q:"Distributivity helps because:",opts:[{t:"We can factor out common terms to simplify complex calculations",c:true,m:""},{t:"It changes the value of the expression",c:false,m:"Distributivity does not change the value. It is a rewriting law that preserves value."},{t:"It only works for positive numbers",c:false,m:"Distributivity works for ALL rational numbers including negatives."}]}}
};
'''

        levels_badges_nodes = '''
var LEVELS = [
  {id:1, name:"Rational Numbers", req:0},
  {id:2, name:"Number Line Expert", req:400},
  {id:3, name:"Operations Master", req:800}
];

var BADGES = [
  {id:"first_blood", name:"First Step", icon:"🏆", desc:"Answer first quiz question"},
  {id:"perfect_streak", name:"Perfect Streak", icon:"🔥", desc:"Answer 5 correctly in a row"}
];

var NODES = [
  {id:1, t:"intro", title:"What ARE Rational Numbers? 🔢", steps:[
    {type:"text", text: rt("A rational number is any number that can be expressed in the form p/q, where p and q are integers and q is not equal to zero. This includes all integers, fractions, and terminating decimals. The word 'rational' comes from the word 'ratio'. Understanding these numbers helps us represent real-world quantities, such as temperature, debt, and precise measurements.", "rational")},
    {type:"quiz", q:"Which of the following is NOT a rational number?", opts:[{t:"3/0",c:true,m:""},{t:"-5/1",c:false,m:"-5/1 is -5, an integer."},{t:"0",c:false,m:"0 is 0/1."}]},
    {type:"quiz", q:"Is 0 a rational number?", opts:[{t:"Yes, because it can be written as 0/1",c:true,m:""},{t:"No",c:false,m:"0 can be written as 0/q."}]}
  ]},
  {id:2, t:"number_line", title:"Rational Numbers on the Number Line 📍", steps:[
    {type:"text", text: rt("Rational numbers can be plotted on the number line. Positive rationals lie to the right of zero, while negative rationals lie to the left. The spacing between integers can be divided into equal parts to represent fractions. For example, to plot 1/3, we divide the space between 0 and 1 into three equal parts.", "positive")},
    {type:"worked", we:WE_RN.we_numLine},
    {type:"quiz", q:"Where does -3/4 lie on the number line?", opts:[{t:"Between 0 and -1",c:true,m:""},{t:"Between 1 and 2",c:false,m:"It is negative."},{t:"Between -1 and -2",c:false,m:"|-3/4| < 1."}]}
  ]},
  {id:3, t:"types", title:"Positive, Negative and Zero Rational Numbers ±", steps:[
    {type:"text", text: rt("Rationals are positive if both numerator and denominator have the same sign. They are negative if the signs are different. Zero is a rational number that is neither positive nor negative. It acts as the origin on the number line. For instance, -2/3 and 2/-3 represent the same negative rational number.", "negative")},
    {type:"quiz", q:"Which of the following represents a positive rational number?", opts:[{t:"-5/-7",c:true,m:""},{t:"-3/4",c:false,m:"Different signs."},{t:"0",c:false,m:"0 is neither positive nor negative."}]},
    {type:"quiz", q:"The rational number -2/3 is equivalent to:", opts:[{t:"2/-3",c:true,m:""},{t:"2/3",c:false,m:"Sign change."},{t:"3/2",c:false,m:"Reciprocal."}]}
  ]},
  {id:4, t:"standard_form", title:"Equivalent Rationals and Standard Form 🔄", steps:[
    {type:"text", text: rt("A rational number is in standard form if its denominator is positive and the numerator and denominator have no common factor other than 1. Equivalent rationals are formed by multiplying or dividing the numerator and denominator by the same non-zero integer. Reducing a fraction to its standard form involves dividing by the highest common factor (HCF).", "standard")},
    {type:"worked", we:WE_RN.we_standardForm},
    {type:"worked", we:WE_RN.we_reduce},
    {type:"quiz", q:"What is the standard form of 45/-60?", opts:[{t:"-3/4",c:true,m:""},{t:"3/-4",c:false,m:"Denominator must be positive."},{t:"-15/20",c:false,m:"Not fully simplified."}]}
  ]},
  {id:5, t:"comparing", title:"Comparing Rational Numbers ⚖️", steps:[
    {type:"text", text: rt("To compare two rational numbers, we first ensure their denominators are positive. Then, we find a common denominator by taking the LCM of the denominators. Finally, we compare the numerators. Remember that for negative numbers, the number with the smaller absolute value is greater. For example, -2 is greater than -5.", "comparing")},
    {type:"worked", we:WE_RN.we_compare},
    {type:"worked", we:WE_RN.we_threeRationals},
    {type:"quiz", q:"Which rational number is greater: -4/5 or -3/4?", opts:[{t:"-3/4",c:true,m:""},{t:"-4/5",c:false,m:"-16/20 vs -15/20."},{t:"They are equal",c:false,m:"No they are not."}]}
  ]},
  {id:6, t:"addition", title:"Addition and Subtraction ➕", steps:[
    {type:"text", text: rt("Addition and subtraction of rational numbers follow the same rules as fractions. If the denominators are the same, we simply add or subtract the numerators. If the denominators are different, we first find a common denominator (LCM), convert each rational to an equivalent form with the common denominator, and then combine the numerators.", "additive")},
    {type:"worked", we:WE_RN.we_add},
    {type:"quiz", q:"What is the sum of -3/8 and 5/8?", opts:[{t:"2/8 (or 1/4)",c:true,m:""},{t:"-8/8",c:false,m:"Check signs."},{t:"8/8",c:false,m:"Check signs."}]},
    {type:"quiz", q:"Subtract 1/4 from -1/2:", opts:[{t:"-3/4",c:true,m:""},{t:"-1/4",c:false,m:"Incorrect calculation."},{t:"1/4",c:false,m:"Check signs."}]}
  ]},
  {id:7, t:"multiplication", title:"Multiplication and Division ✖️", steps:[
    {type:"text", text: rt("To multiply rational numbers, multiply the numerators together and the denominators together. Then, apply sign rules: same signs give a positive product, different signs give a negative product. To divide, multiply the first rational by the reciprocal of the second. Remember to check if the result can be simplified.", "multiplicative")},
    {type:"worked", we:WE_RN.we_multiply},
    {type:"quiz", q:"What is (-2/3) × (-4/5)?", opts:[{t:"8/15",c:true,m:""},{t:"-8/15",c:false,m:"Negative x Negative = Positive."},{t:"-6/8",c:false,m:"Incorrect."}]},
    {type:"quiz", q:"Divide 3/4 by -1/2:", opts:[{t:"-3/2",c:true,m:""},{t:"-3/8",c:false,m:"Multiply by reciprocal."},{t:"3/8",c:false,m:"Check signs."}]}
  ]},
  {id:8, t:"properties", title:"Properties and Boss Challenge 🏆", steps:[
    {type:"text", text: rt("Rational numbers exhibit several important properties: Closure (operations produce another rational), Commutativity (order doesn't matter for addition/multiplication), Associativity (grouping doesn't matter for addition/multiplication), and Distributivity of multiplication over addition. These properties help simplify complex calculations.", "properties")},
    {type:"worked", we:WE_RN.we_commute},
    {type:"worked", we:WE_RN.we_distributive},
    {type:"quiz", q:"Which property states that a + b = b + a?", opts:[{t:"Commutative Property",c:true,m:""},{t:"Associative Property",c:false,m:"That is (a+b)+c = a+(b+c)."},{t:"Distributive Property",c:false,m:"That involves both addition and multiplication."}]},
    {type:"progress", type:"complete"}
  ]}
];
'''
        final_script = header_and_utils + new_canvas_functions + levels_badges_nodes + app_engine
        
        with open(r'c:\Users\admin\Downloads\NGO AI LLM\Aasha-AI\chapters\RationalNumbers_Class8_v7.html', 'w', encoding='utf-8') as out_f:
            out_f.write(final_script)
        print('Successfully wrote RationalNumbers_Class8_v7.html')
    else:
        print('App engine not found')
else:
    print('Variables not found')
