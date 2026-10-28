'use strict';
const assert=require('node:assert/strict'),fs=require('fs'),path=require('path');
const {chromium}=require('playwright'),createServer=require('../tools/preview-server');
const output=process.env.SCREENSHOT_DIR||path.resolve(__dirname,'../../..','outputs/screenshots');fs.mkdirSync(output,{recursive:true});
(async()=>{
 const server=createServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=process.env.BASE_URL||`http://127.0.0.1:${server.address().port}`;
 const browser=await chromium.launch();let count=0;const ok=(name,value)=>{assert.ok(value,name);console.log('PASS',name);count++;};
 try{
 for(const width of [390,1440]){
 const page=await browser.newPage({viewport:{width,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/supabase.js',r=>r.fulfill({contentType:'text/javascript',body:'window.supabase={createClient:()=>({auth:{onAuthStateChange(){},async getSession(){return {data:{session:null}}}}})};'}));
 for(const route of ['/','/why-it-works','/community','/free-trial','/contact','/privacy-policy','/terms-of-use','/login','/signup']){
 const response=await page.goto(base+route);ok(`${width} ${route} loads`,response.status()===200);
 if(route==='/login')await page.locator('#toSignup').waitFor();
 if(route==='/signup')await page.locator('#toLogin').waitFor();
 ok(`${width} ${route} fits viewport`,await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await page.screenshot({path:path.join(output,`${route==='/'?'homepage':route.slice(1)}-${width}.png`),fullPage:true});
 const links=await page.locator('a[href]').evaluateAll(a=>a.map(x=>x.getAttribute('href')).filter(h=>h.startsWith('/')&&!h.startsWith('//')));
 for(const link of new Set(links)){const response=await page.request.get(base+link.split('#')[0]);ok(`${width} ${route} link ${link}`,response.status()===200);}
 }
 await page.goto(base+'/');await page.locator('#demoReveal').waitFor();
 ok('Active recall prevents reveal',await page.locator('#demoReveal').isDisabled());
 await page.click('#startTour');ok('Guided tour opens',await page.locator('.tour-popover').isVisible());
 for(let i=0;i<8;i++)await page.click('#tourForward');ok('Guided tour completes',await page.locator('.tour-popover').count()===0);
 for(let i=0;i<5;i++){
 await page.fill('#recallDraft','Sample recalled answer '+i);await page.click('#demoReveal');await page.click('#demoNext');
 ok(`Rating popup card ${i+1}`,await page.locator('#ratingModal').isVisible());await page.locator('[data-rating="got"]').click();
 }
 ok('Completion popup after five cards',await page.locator('#trialCompletionModal').isVisible());
 await page.screenshot({path:path.join(output,`demo-complete-${width}.png`),fullPage:true});
 await page.goto(base+'/#error=access_denied&error_description=Expired');await page.waitForURL(url=>url.pathname==='/login');ok('Old auth links reach login',new URL(page.url()).pathname==='/login');
 await page.goto(base+'/contact');await page.fill('[name=name]','Test User');await page.fill('[name=email]','test@example.com');await page.selectOption('[name=topic]',{label:'General question'});await page.fill('[name=message]','Testing contact submission');await page.click('button[type=submit]');await page.waitForFunction(()=>document.querySelector('#contactStatus').textContent.includes('not configured'));ok('Contact reports unavailable delivery honestly',true);
 ok('No JavaScript page errors',errors.length===0);await page.close();
 }
 console.log(`${count} checks passed`);
 }finally{await browser.close();server.closeAllConnections();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
