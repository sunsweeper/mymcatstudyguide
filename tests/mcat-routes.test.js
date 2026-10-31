'use strict';
// MCAT pages live under /mcat; the bare domain is the TabiPrep brand homepage (no MCAT content beyond the course listing).
const http=require('http'),assert=require('node:assert/strict'),{chromium}=require('playwright'),create=require('../tools/preview-server');
let count=0;const ok=(n,v)=>{assert.ok(v,n);count++;console.log('PASS',n);};
const get=(base,p)=>new Promise((res,rej)=>http.get(base+p,r=>{let b='';r.on('data',c=>b+=c);r.on('end',()=>res({status:r.statusCode,location:r.headers.location,body:b}));}).on('error',rej));
(async()=>{
  const server=create();await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}`;const browser=await chromium.launch();
  try{
    let r=await get(base,'/');ok('/ is the TabiPrep homepage',r.status===200&&r.body.includes('Flashcards that make you think.'));
    const main=r.body.slice(r.body.indexOf('<main'),r.body.indexOf('</main>'));
    ok('Homepage names MCAT only in the course listing',(main.match(/MCAT/g)||[]).length===2&&!/Rosalind/.test(main));
    r=await get(base,'/community');ok('/community is served directly',r.status===200);
    r=await get(base,'/sample-cards');ok('/sample-cards (embeddable demo) is served',r.status===200&&r.body.includes('id="demo"'));
    r=await get(base,'/?code=abc');ok('/?code= (old sign-in links) still serves the page that forwards to /login',r.status===200&&r.body.includes('legacy-auth-redirect.js'));
    for(const [from,to] of [['/MCAT','/mcat'],['/Mcat/how-it-works','/mcat/how-it-works'],['/mcat/how-it-works','/how-it-works'],['/why-it-works','/how-it-works'],['/mcat/community','/community'],['/free-trial','/mcat/free']]){
      r=await get(base,from);ok(`${from} → ${to} (301)`,r.status===301&&r.location===to);
    }
    r=await get(base,'/mcat');ok('/mcat says MCAT prep up front',r.status===200&&r.body.includes('MCAT prep that sticks'));
    for(const id of ['learning-methods','insights','devices','community','trial'])ok(`landing no longer carries #${id}`,!r.body.includes(`id="${id}"`));
    ok('landing keeps the demo and one trial invite',r.body.includes('id="demo"')&&(r.body.match(/class="trial-invite/g)||[]).length===1);
    r=await get(base,'/how-it-works');ok('/how-it-works is course-neutral',r.status===200&&!/for the MCAT|Rosalind|AAMC Content Outline/.test(r.body));ok('How it works carries the science, dashboard and device sections',r.status===200&&['learning-methods','insights','devices'].every(id=>r.body.includes(`id="${id}"`)));
    const p=await browser.newPage({viewport:{width:390,height:844}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
    await p.route('**/supabase.js',x=>x.fulfill({contentType:'text/javascript',body:'window.supabase={createClient:()=>({auth:{onAuthStateChange(){},async getSession(){return {data:{session:null}}}}})};'}));
    await p.goto(base+'/');ok('Courses is in the phone header, next to Log in',await p.isVisible('.nav-courses-top')&&await p.isVisible('.nav-login'));
    await p.click('.nav-courses-top');ok('Courses opens the course list (MCAT, more coming)',await p.isVisible('.nav-courses-menu a[href="/mcat"]')&&(await p.textContent('.nav-courses-menu')).includes('More exams coming soon'));
    ok('Homepage fits the phone',await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    await p.goto(base+'/mcat');
    const screens=await p.evaluate(()=>document.documentElement.scrollHeight/innerHeight);
    ok(`landing is at most 8 phone screens (now ${screens.toFixed(1)})`,screens<=8);
    await p.goto(base+'/how-it-works');ok('How it works fits the phone',await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    ok('no page errors',errs.length===0);
    console.log(`${count} MCAT route checks passed.`);
  }catch(e){console.error(e);process.exitCode=1;}
  finally{await browser.close();server.close();}
})();
