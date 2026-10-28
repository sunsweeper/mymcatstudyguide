const {rate:rateThroughPopup}=require('./study-ui-helpers');
// The 1–10 confidence scale was removed from the study screen: it must not appear, and rating still works without it.
const { chromium } = require('playwright');
const URL = 'file://' + require('path').join(__dirname, '..', 'index.html');
let pass = 0, fail = 0; const ok = (n, c, x = "") => { c ? pass++ : fail++; console.log(c ? "PASS" : "FAIL", n, x); };
(async () => {
  const b = await chromium.launch(); const errs = [];
  const ctx = await b.newContext({ viewport:{ width:1280, height:1000 } }); await ctx.route(/supabase/, r => r.abort()); const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
  await p.addInitScript(() => { if(!sessionStorage.getItem('seeded')){ localStorage.setItem('mcat-progress-v2', JSON.stringify({ cards:{}, newDay:{date:'',count:0}, open:{}, view:'q', tips:{off:true} })); sessionStorage.setItem('seeded','1'); } });
  await p.goto(URL); await p.click('[data-k=bb]'); await p.click('#toQuote'); await p.evaluate(()=>window.MCATStudyUI?.setRecall(false));
  ok('CB1 no confidence scale on the study screen', await p.locator('#confRow, .conf-scale').count() === 0 && !(await p.textContent('#study')).includes('How confident'));
  await p.click('#reveal'); await p.waitForTimeout(450);
  await rateThroughPopup(p,'[data-r=good]'); await p.waitForTimeout(150);
  ok('CB2 rating still saves, with no confidence recorded', await p.evaluate(() => { const s = Object.values(progress.cards)[0]; const h = s.history[s.history.length - 1]; return h.r === 'good' && h.c === undefined; }));
  ok('CB3 no page errors', errs.length === 0, errs.join(' | '));
  await b.close(); console.log(`${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
})();
