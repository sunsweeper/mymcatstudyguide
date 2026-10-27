// Package 2, Phase 7 in a real browser.
const { chromium } = require('playwright');
const URL = 'file://' + require('path').join(__dirname, '..', 'index.html');
let pass = 0, fail = 0; const ok = (n, c, x = "") => { c ? pass++ : fail++; console.log(c ? "PASS" : "FAIL", n, x); };
const d = n => { const t = new Date(); t.setDate(t.getDate() + n); return `${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,'0')}-${String(t.getDate()).padStart(2,'0')}`; };
(async () => { const b = await chromium.launch(); const errs = [];
  for (const w of [360, 1280]) {
    const ctx = await b.newContext({ viewport:{ width:w, height:900 } }); await ctx.route(/supabase/, r => r.abort()); const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
    await p.addInitScript(x => { if(!localStorage.getItem('mcat-progress-v2')) localStorage.setItem('mcat-progress-v2', JSON.stringify({ cards:{}, newDay:{date:'',count:0}, open:{}, view:'q', tips:{off:true}, testDate:x })); }, d(16));
    await p.goto(URL); await p.waitForTimeout(150);
    ok(`FB1 ${w}px offer appears 16 days out`, await p.isVisible('.f21-offer') && await p.isVisible('#f21On'));
    await p.click('#f21On'); await p.waitForTimeout(100);
    ok(`FB2 ${w}px turned on: stage, Begin button, readiness readout`, (await p.textContent('.f21')).includes('16 days to go') && await p.isVisible('#f21Go') && await p.isVisible('.ready'));
    const sw = await p.evaluate(() => document.documentElement.scrollWidth);
    ok(`FB3 ${w}px fits (no sideways scroll)`, sw <= w, sw);
    await p.click('#f21Go'); await p.click('#toQuote'); await p.evaluate(()=>window.MCATStudyUI?.setRecall(false)); await p.waitForTimeout(200);
    ok(`FB4 ${w}px Begin Today's Final 21 Review starts the session`, await p.evaluate(() => filter) === 'f21' && await p.evaluate(() => mode) === 'cards' && await p.evaluate(() => deck.length) > 0);
    ok(`FB5 ${w}px the session header names it`, (await p.textContent('#topicname')).includes('Final 21'));
    await p.click('#logo'); await p.click('#f21Off'); await p.waitForTimeout(100);
    ok(`FB6 ${w}px it can be turned off`, await p.isHidden('#f21Go') && (await p.textContent('#screen')).includes('Final 21 is off'));
    await ctx.close(); }
  ok('FB7 no page errors', errs.length === 0, errs.join(' | '));
  await b.close(); console.log(`${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0); })();
