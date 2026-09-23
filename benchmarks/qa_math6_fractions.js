#!/usr/bin/env node
const fs=require("fs"), path=require("path");
const file=process.argv[2]||path.join(__dirname,"../dist/chapters/fractions_chapter.html");
if(!fs.existsSync(file)){console.error("MISSING "+file);process.exit(2)}
const s=fs.readFileSync(file,"utf8");
const checks=[
 ["doctype",/^<!doctype html>/i.test(s)],
 ["offline-no-http-runtime",!/<(script|link|img|iframe)[^>]+(?:src|href)=["']https?:/i.test(s)],
 ["wm-dictionary",/window\.WM\s*=/.test(s)],
 ["math-insulation",/__AASHA_MATH_X__/.test(s)],
 ["word-tap",/data-word=/.test(s)],
 ["aasha-sim",/customElements\.define\("aasha-sim"/.test(s)],
 ["lifecycle",/mount\(\).*getState\(\).*reset\(\).*destroy\(\).*telemetry\(/s.test(s)],
 ["h1-h4",/H₁ Visual.*H₂ Concept.*H₃ Relation.*H₄ Step/s.test(s)],
 ["no-alert-confirm",!/\b(?:alert|confirm)\s*\(/.test(s)],
 ["touch-44",/min-height:44px/.test(s)],
 ["sections",/section-warmup|Warm-up/.test(s)&&/section-deep_dive|Deep Dive/.test(s)&&/section-boss|Boss/.test(s)],
 ["misconception-fields",/m:\[/.test(s)],
 ["network-fetch",!/\bfetch\s*\(/.test(s)]
];
let bad=checks.filter(x=>!x[1]);
for(const [n,ok] of checks) console.log((ok?"PASS ":"FAIL ")+n);
const bytes=Buffer.byteLength(s);
console.log("BYTES "+bytes);
if(bytes>20971520) bad.push(["bundle-ceiling",false]);
console.log("RESULT "+(bad.length?"FAIL":"PASS")+" "+(checks.length-bad.length)+"/"+checks.length);
process.exit(bad.length?1:0);
