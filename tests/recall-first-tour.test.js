'use strict';
// Active Recall resets to on for every new session, Flip Card stays locked until an answer is written,
// and both guided tours run: Study Mode, Card, Recall answer, Flip Card (+ card), then the remaining controls.
const {chromium}=require('playwright'),assert=require('node:assert/strict');
const create=require('../tools/preview-server');
const mock=`(()=>{const user={id:'recall-fixture',email:'fixture@example.invalid',user_metadata:{first_name:'Fixture'}};window.supabase={createClient:()=>({auth:{onAuthStateChange(){},async getSession(){return {data:{session:{user}}}},async getUser(){return {data:{user}}}},from(table){return {select(){return this},eq(){return this},async maybeSingle(){return {data:table==='profiles'?{first_name:'Fixture',is_admin:false}:null,error:null}},async upsert(){return {error:null}}}},async rpc(){return {data:null,error:null}}})};})();`;
let count=0;const check=(name,value)=>{assert.ok(value,name);count++;console.log('PASS',name);};
(async()=>{const server=create();await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}`,browser=await chromium.launch(),errors=[];
try{for(const width of [390,1440]){
  const ctx=await browser.newContext({viewport:{width,height:1000},reducedMotion:'reduce'});
  await ctx.route('**/supabase.js',r=>r.fulfill({contentType:'text/javascript',body:mock}));
  // Homepage demo
  const h=await ctx.newPage();h.on('pageerror',e=>errors.push(e.message));await h.goto(base+'/');
  check(`${width}: demo starts with Active Recall on`,await h.isChecked('#activeRecallSwitch'));
  check('Demo Flip Card locked with an empty answer',await h.isDisabled('#demoReveal'));
  await h.fill('#recallDraft','   ');check('Whitespace does not unlock Flip Card',await h.isDisabled('#demoReveal'));
  await h.fill('#recallDraft','Aspartate and glutamate');check('Typing an answer unlocks Flip Card',!(await h.isDisabled('#demoReveal')));
  await h.click('#startTour');
  const demoOrder=[];for(let i=0;i<9;i++){demoOrder.push(await h.evaluate(()=>document.querySelector('.tour-focus')?.id));if(i===1)check('Demo card step does not mention flipping',!/flip|reveal/i.test(await h.textContent('.tour-popover p')));if(i===3)check('Demo step 4 also highlights the card',await h.evaluate(()=>document.getElementById('tour-card').classList.contains('tour-secondary-focus')));await h.click('#tourForward');}
  check('Demo tour order: modes, card, recall answer, Flip Card, then the rest',JSON.stringify(demoOrder.slice(0,5))===JSON.stringify(['tour-study-modes','tour-card','tour-recall-entry','demoReveal','tour-recall-toggle']));
  await h.uncheck('#activeRecallSwitch');check('Demo recall can be switched off',!(await h.isChecked('#activeRecallSwitch')));
  await h.evaluate(()=>document.getElementById('restartSample').click());
  check('Restarting the sample turns Active Recall back on',await h.isChecked('#activeRecallSwitch')&&await h.isDisabled('#demoReveal'));
  // Real study app
  const p=await ctx.newPage();p.on('pageerror',e=>errors.push(e.message));await p.goto(base+'/login');await p.waitForURL('**/dashboard');await p.click('[data-k=bb]');await p.click('#toQuote');
  await p.evaluate(()=>{deck[pos]='1A-001';resetCard();render();});
  check('Real app starts with Active Recall on and Flip Card locked',await p.isChecked('#activeRecallSwitch')&&await p.isDisabled('#reveal'));
  await p.click('#card');check('Clicking the locked card does not flip it',await p.evaluate(()=>!revealed));
  await p.fill('#curAnswer','Amino acid sequence');check('Typing unlocks Flip Card',!(await p.isDisabled('#reveal')));
  await p.fill('#curAnswer','');
  await p.click('#studyTourStart');
  const realOrder=[];for(let i=0;i<9;i++){realOrder.push(await p.evaluate(()=>document.querySelector('.study-tour-target')?.id));check(`Real tour step ${i+1} has one primary target`,await p.locator('.study-tour-target').count()===1);if(i===3)check('Real step 4 also highlights the card',await p.evaluate(()=>document.getElementById('card').classList.contains('study-tour-also')));await p.click('#studyTourNext');}
  check('Real tour order: modes, card, recall answer, Flip Card, then the rest',JSON.stringify(realOrder.slice(0,5))===JSON.stringify(['view','card','recallEntry','reveal','studyToolbar']));
  check('Tour cleans up highlights',await p.locator('.study-tour-also,.study-tour-target').count()===0);
  await p.uncheck('#activeRecallSwitch');check('Recall off unlocks Flip Card for optional cards',!(await p.isDisabled('#reveal')));
  await p.evaluate(()=>{goHome();pick('cp');});await p.click('#toQuote');await p.waitForFunction(()=>mode==='cards');
  check('A new session turns Active Recall back on',await p.isChecked('#activeRecallSwitch'));
  await p.evaluate(()=>{resetCard();render();});check('New session locks Flip Card until an answer is written',await p.isDisabled('#reveal'));
  await ctx.close();
}
check('No JavaScript errors',errors.length===0);
console.log(`${count} Active Recall and tour checks passed.`);
}catch(e){console.error(e);if(errors.length)console.error(errors);process.exitCode=1;}finally{await browser.close();server.close();}})();
