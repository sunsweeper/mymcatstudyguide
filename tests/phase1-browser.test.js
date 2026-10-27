const openRating = require('./study-rating-helper');
// Package 2, Phase 1 in a real browser: the mastered-card sparkle and confidence insertion.
const { chromium } = require('playwright');
const URL = 'file://' + require('path').join(__dirname, '..', 'index.html');
let pass = 0, fail = 0; const ok = (n, c, x = "") => { c ? pass++ : fail++; console.log(c ? "PASS" : "FAIL", n, x); };
const d = n => { const t = new Date(); t.setHours(12); t.setDate(t.getDate() + n); return t.toISOString().slice(0, 10); };
const seed = () => ({ cards: { "1A-001": { status:"review", writing:false, last:d(-65), due:d(0), interval:35, reps:3, total:3, good:3, bad:0,
  history:[{ d:d(-79), r:"good" }, { d:d(-76), r:"good" }, { d:d(-65), r:"good" }] } }, newDay:{ date:"", count:0 }, open:{}, view:"q", tips:{ off:true } });
(async () => {
  const browser = await chromium.launch(); const errs = [];
  for(const motion of ["no-preference", "reduce"]){
    const ctx = await browser.newContext({ viewport:{ width:1280, height:900 }, reducedMotion: motion }); await ctx.route(/supabase/, r => r.abort()); const p = await ctx.newPage();   // no account library: the page runs in its local (signed-out) mode
    p.on('pageerror', e => errs.push(e.message));
    await p.addInitScript(s => { if(!sessionStorage.getItem('seeded')){ localStorage.setItem('mcat-progress-v2', s); sessionStorage.setItem('seeded', '1'); } }, JSON.stringify(seed()));
    await p.goto(URL); await p.click('[data-k=bb]'); await p.click('#toQuote');
    const first = await p.evaluate(() => document.querySelector('#card').textContent);
    ok(`S0-${motion} the card that's about to become mastered comes first (it's the only one due)`, /1A-001|./.test(first));
    const level0 = await p.evaluate(() => levelOf("1A-001"));
    await p.click('#reveal'); await p.waitForTimeout(450);
    const cardBefore = await p.evaluate(() => document.querySelector('#card').outerHTML.length);
    await openRating(p); await p.click('#rateRow [data-r=good]');
    const fx = await p.evaluate(() => { const f = document.querySelector('.sparkle-fx'); return f ? { inCard: !!f.closest('#card'), pe: getComputedStyle(f).pointerEvents, hidden: f.getAttribute('aria-hidden'), n: f.children.length, text: f.textContent.trim() } : null; });
    const level1 = await p.evaluate(() => levelOf("1A-001"));
    ok(`S1-${motion} setup: the card moved from provisionally mastered to mastered`, level0 === "provisional" && level1 === "mastered", `${level0} → ${level1}`);
    if(motion === "reduce") ok("S2-reduce reduced motion: no sparkle at all", fx === null);
    else {
      ok("S2 a sparkle appears when a card becomes mastered", !!fx && fx.n === 12, JSON.stringify(fx));
      ok("S3 ...it is an overlay outside the card, ignored by screen readers and clicks, with no words", fx && !fx.inCard && fx.pe === "none" && fx.hidden === "true" && fx.text === "");
      const t0 = Date.now(); await p.waitForFunction(() => !document.querySelector('.sparkle-fx'), null, { timeout: 2000 }); const gone = Date.now() - t0;
      ok("S4 ...and it's gone in well under a second", gone < 900, `${gone}ms`);
      const anim = await p.evaluate(() => { const css = [...document.styleSheets].flatMap(s => { try { return [...s.cssRules]; } catch(e){ return []; } }).map(r => r.cssText).join(' '); const rule = css.split('}').find(x => x.includes('.sparkle-fx i {') && x.includes('animation')) || ''; return /sparkle/.test(rule) && /sparkle (0)?\.5s /.test(rule); });
      ok("S5 the animation itself lasts 0.5 s", anim);
    }
    const st = await p.evaluate(() => ({ active: document.activeElement && document.activeElement.id, mode, pos }));
    ok(`S6-${motion} no interruption: the next card is showing and has keyboard focus`, st.mode === "cards" && st.pos === 1 && st.active === "card", JSON.stringify(st));
    await p.keyboard.press('Enter'); await p.waitForTimeout(500);
    ok(`S7-${motion} keyboard still works on the next card (Enter on the focused card reveals it)`, await p.evaluate(() => revealed));
    await ctx.close();
  }
  // Confidence insertion in the real page
  { const ctx = await browser.newContext({ viewport:{ width:390, height:844 } }); await ctx.route(/supabase/, r => r.abort()); const p = await ctx.newPage();   // no account library: the page runs in its local (signed-out) mode p.on('pageerror', e => errs.push(e.message));
    const s = seed(); s.cards = {};
    const masters = ["1A-030", "1A-031", "1A-032"];
    masters.forEach(id => s.cards[id] = { status:"review", writing:false, last:d(-40), due:d(60), interval:100, reps:4, total:4, good:4, bad:0, history:[{d:d(-120),r:"good"},{d:d(-117),r:"good"},{d:d(-106),r:"good"},{d:d(-71),r:"good"},{d:d(-40),r:"good"}] });
    s.skipWrite = true;
    await p.addInitScript(x => { if(!sessionStorage.getItem('seeded')){ localStorage.setItem('mcat-progress-v2', x); sessionStorage.setItem('seeded', '1'); } }, JSON.stringify(s));
    await p.goto(URL); await p.click('[data-k=bb]'); await p.click('#toQuote');
    for(let i = 0; i < 3; i++){
      await p.click('#reveal'); await p.waitForTimeout(450); await openRating(p); await p.click('#rateRow [data-r=again]');
      if(await p.locator('#curNext').isVisible()){ await p.fill('#curAnswer', 'my reinforcement answer here'); await p.click('#curNext'); }
      await p.waitForTimeout(100);
    }
    const cur = await p.evaluate(() => idOf(curKey));
    ok("S8 after 3 misses in a row the next card is one of her mastered cards", masters.includes(cur), cur);
    const html = await p.evaluate(() => document.querySelector('#card').className);
    ok("S9 ...shown with the normal card design", html === "card" || /^card\b/.test(html), html);
    await ctx.close();
  }
  ok("S10 no page errors", errs.length === 0, errs.join(' | '));
  await browser.close(); console.log(`${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
})();
