#!/usr/bin/env node
const { chromium } = require("playwright");
const path=require("path");
(async()=>{
 const target=process.argv[2]||path.resolve(__dirname,"../dist/chapters/fractions_chapter.html");
 const browser=await chromium.launch({headless:true});
 const page=await browser.newPage({viewport:{width:390,height:844}});
 const errors=[], requests=[];
 page.on("console",m=>{if(m.type()==="error")errors.push(m.text())});
 page.on("pageerror",e=>errors.push(e.message));
 page.on("request",r=>{if(/^https?:/i.test(r.url()))requests.push(r.url())});
 await page.goto("file://"+target,{waitUntil:"load"});
 const wordCount=await page.locator("[data-word]").count();
 if(wordCount) await page.locator("[data-word]").first().click();
 const popup=await page.locator("#modal.show").count();
 for(let i=0;i<5;i++){await page.locator("#next").click();await page.waitForTimeout(20);}
 const overflow=await page.evaluate(()=>({scrollH:document.documentElement.scrollHeight,innerH:window.innerHeight}));
 await page.screenshot({path:"artifacts/fractions_smoke.png",fullPage:true});
 const result={console_errors:errors.length,word_tap_popup:popup===1,network_requests:requests.length,scroll_overflow:overflow.scrollH<=overflow.innerH+5,scrollH:overflow.scrollH,innerH:overflow.innerH};
 console.log(JSON.stringify(result,null,2));
 await browser.close();
 process.exit(result.console_errors||!result.word_tap_popup||result.network_requests||!result.scroll_overflow?1:0);
})();