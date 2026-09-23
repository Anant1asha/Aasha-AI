#!/usr/bin/env node
const fs=require("fs"),path=require("path"),vm=require("vm"),os=require("os"),cp=require("child_process");
const file=process.argv[2]||path.join(__dirname,"../dist/chapters/fractions_chapter.html");
if(!fs.existsSync(file)){console.error("MISSING "+file);process.exit(2)}
const s=fs.readFileSync(file,"utf8"),checks=[];
function check(name,ok,detail=""){checks.push({name,ok,detail})}
check("doctype",/^<!doctype html>/i.test(s));
check("offline-no-http-runtime",!/<(?:script|link|img|iframe)[^>]+(?:src|href)=["']https?:/i.test(s));
check("no-network-code",!/\b(?:fetch|XMLHttpRequest|WebSocket)\s*\(/.test(s));
check("wm-dictionary",/window\.WM\s*=/.test(s));
check("math-insulation",/__AASHA_MATH_X__/.test(s)&&/insulateMath/.test(s));
check("word-tap",/data-word=/.test(s));
check("aasha-sim",/customElements\.define\(["']aasha-sim/.test(s)&&/<aasha-sim/.test(s));
check("lifecycle",/mount\(\)[\s\S]*getState\(\)[\s\S]*reset\(\)[\s\S]*destroy\(\)[\s\S]*telemetry\(/.test(s));
check("four-hints",/H₁ Visual[\s\S]*H₂ Concept[\s\S]*H₃ Relation[\s\S]*H₄ Step/.test(s));
check("no-alert-confirm",!/\b(?:alert|confirm)\s*\(/.test(s));
check("touch-44",/min-height:44px/.test(s));
check("assessment-sections",/section-warmup/.test(s)&&/section-deep_dive/.test(s)&&/section-boss/.test(s));
check("misconception-fields",/m:\[/.test(s));
const script=(s.match(/<script>([\s\S]*?)<\/script>/i)||[])[1]||"";
const tmp=path.join(os.tmpdir(),"aasha_fraction_"+process.pid+".js");fs.writeFileSync(tmp,script);
try{cp.execFileSync(process.execPath,["--check",tmp],{stdio:"pipe"});check("node-syntax",true)}catch(e){check("node-syntax",false,String(e.stderr||e.message))}
try{
 const start=script.indexOf("const qs=["); const end=script.indexOf("];\nlet state",start);
 const src=script.slice(start+"const qs=".length,end+1);
 const qs=vm.runInNewContext(src,{});
 check("12-assessments",Array.isArray(qs)&&qs.length===12,String(qs&&qs.length));
 let bad=0;
 for(const q of qs){
   if(!Array.isArray(q.a)||q.a.length!==4||q.c<0||q.c>=q.a.length||q.a.filter((_,i)=>i===q.c).length!==1) bad++;
   q.m.forEach((m,i)=>{if(i!==q.c&&(!m||m.toLowerCase().includes(q.a[q.c].toLowerCase())))bad++});
   q.h.forEach(h=>{if(!h||h.toLowerCase().includes(q.a[q.c].toLowerCase()))bad++});
 }
 check("zero-spoiler-assessments",bad===0,"violations="+bad);
}catch(e){check("assessment-parse",false,e.message)}
try{fs.unlinkSync(tmp)}catch{}
const bytes=Buffer.byteLength(s);check("20mb-child-ceiling",bytes<=20971520,"bytes="+bytes);
for(const x of checks)console.log((x.ok?"PASS ":"FAIL ")+x.name+(x.detail?" :: "+x.detail:""));
const passed=checks.filter(x=>x.ok).length;console.log("RESULT "+(passed===checks.length?"PASS":"FAIL")+" "+passed+"/"+checks.length);
process.exit(passed===checks.length?0:1);
