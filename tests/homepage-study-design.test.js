'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict'),path=require('path');
const create=require('../tools/preview-server');
let count=0;const check=(name,value)=>{assert.ok(value,name);count++;console.log('PASS',name);};
const styles=(page,selector)=>page.locator(selector).evaluate(e=>{
  const s=getComputedStyle(e),r=e.getBoundingClientRect();return {bg:s.backgroundColor,color:s.color,radius:s.borderRadius,border:s.borderTopWidth,shadow:s.boxShadow,padding:s.padding,font:s.fontFamily.split(',')[0],size:s.fontSize,weight:s.fontWeight,line:s.lineHeight,align:s.textAlign,w:r.width,h:r.height,x:r.x,y:r.y};
});
(async()=>{
 const server=create();await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}`,browser=await chromium.launch(),errors=[];
 try{for(const width of [360,390,768,1440]){
  const ctx=await browser.newContext({viewport:{width,height:1000},reducedMotion:'reduce'});
  await ctx.route('**/supabase.js',r=>r.fulfill({contentType:'text/javascript',body:''}));
  const home=await ctx.newPage(),study=await ctx.newPage();for(const p of [home,study])p.on('pageerror',e=>errors.push(e.message));
  await home.goto(base+'/');await study.goto(base+'/index.html');
  await study.evaluate(()=>{pick('all');start(true);deck[pos]='1A-001';resetCard();render();});
  for(const p of [home,study])await p.evaluate(()=>document.fonts.ready);
  // Compare the same content at the same available card width, independent of page chrome.
  const actual=await styles(study,'#card');
  await home.locator('#tour-card').evaluate((e,w)=>{e.style.width=w+'px';e.style.maxWidth='none';},actual.w);
  const question=await study.locator('#card .face').textContent();
  await home.locator('#tour-card h3').evaluate((e,t)=>e.textContent=t,question);
  const demo=await styles(home,'#tour-card'),q=await styles(study,'#card .face'),dq=await styles(home,'#tour-card h3'),label=await styles(study,'#card .side'),dl=await styles(home,'.workspace-card-face');
  for(const prop of ['bg','color','radius','border','shadow','padding','h'])check(`${width}: card ${prop} matches demo`,actual[prop]===demo[prop]);
  for(const prop of ['font','size','weight','line','color','align'])check(`${width}: question ${prop} matches demo`,q[prop]===dq[prop]);
  for(const prop of ['font','size','weight','line','color','align'])check(`${width}: face label ${prop} matches demo`,label[prop]===dl[prop]);
  check(`${width}: centered label`,Math.abs(label.x+label.w/2-(actual.x+actual.w/2))<1);
  check(`${width}: label within 16px of demo header position`,Math.abs((label.y-actual.y)-(dl.y-demo.y))<=16);
  // No selectors or events are replaced: exercise the real flip and retain extra context.
  await study.click('#reveal');await study.waitForFunction(()=>revealed&&!flipping);
  await home.fill('#recallDraft','A test retrieval');await home.click('#demoReveal');
  const answer=await styles(study,'#card .ans'),da=await styles(home,'.workspace-answer');
  for(const prop of ['font','size','weight','line','color','align'])check(`${width}: answer ${prop} matches demo`,answer[prop]===da[prop]);
  check(`${width}: real answer retains question and inline ratings`,await study.locator('#card .asked').isVisible()&&await study.locator('#rateRow').isVisible());
  check(`${width}: controls fit page`,await study.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  if(process.env.DESIGN_SCREENSHOTS){const fs=require('fs');fs.mkdirSync(process.env.DESIGN_SCREENSHOTS,{recursive:true});for(const [p,sel,name] of [[home,'#tour-card','demo'],[study,'#card','study']]){await p.locator(sel).evaluate(e=>e.scrollIntoView({block:'center'}));await p.locator(sel).screenshot({path:path.join(process.env.DESIGN_SCREENSHOTS,`${name}-answer-${width}.png`)});}}
  await ctx.close();
 }check('No JavaScript errors on homepage or actual study app',errors.length===0);console.log(`${count} homepage/study design checks passed`);
 }finally{await browser.close();server.closeAllConnections();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
