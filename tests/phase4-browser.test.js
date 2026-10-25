const { chromium } = require('playwright');
const URL = 'file://' + require('path').join(__dirname, '..', 'index.html');
let pass = 0, fail = 0; const ok = (n, c, x = "") => { c ? pass++ : fail++; console.log(c ? "PASS" : "FAIL", n, x); };
(async () => { const b = await chromium.launch(); const errs = [];
  for (const w of [360, 390, 768, 1280]) {
    const ctx = await b.newContext({ viewport:{ width:w, height:900 } }); await ctx.route(/supabase/, r => r.abort()); const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
    await p.addInitScript(() => { if(!sessionStorage.getItem('seeded')){ localStorage.setItem('mcat-progress-v2', JSON.stringify({ cards:{}, newDay:{date:'',count:0}, open:{}, view:'q', tips:{off:true} })); sessionStorage.setItem('seeded','1'); } });
    await p.goto(URL);
    await p.evaluate(() => { const iso = n => { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().slice(0, 10); };
      CARDS.filter(c => /^4B-/.test(c[3])).forEach((c, i) => { progress.cards[c[3]] = { status:'review', writing:false, last:iso(2), due:iso(1), interval:1, reps:0, total:5, good:0, bad:5, history:[[30,'good'],[25,'again'],[20,'again'],[12,'again'],[6,'again'],[2,'again']].map(([d, r], j) => ({ d:iso(d), r, t:j + 1 })) }; }); save(); });
    await p.click('#weakBtn'); await p.waitForTimeout(200);
    const sw = await p.evaluate(() => document.documentElement.scrollWidth);
    ok(`BD1 ${w}px dashboard fits (no sideways scroll)`, sw <= w, sw);
    ok(`BD2 ${w}px thermometers announced to screen readers with their stage`, (await p.locator('.thermo[role=img]').count()) === 6 && /: (Just getting started|Early picture|Taking shape|Fairly clear|Clear picture)$/.test(await p.getAttribute('.thermo[role=img] >> nth=0', 'aria-label')));
    if (w === 1280) {
      ok('BD3 top priority is Fluids (4B) with action links', (await p.textContent('.prio-item >> nth=0')).includes('4B Fluids and gases'));
      await p.click('.prio-item >> nth=0 >> [data-act="0"]'); await p.waitForTimeout(150);
      ok('BD4 clicking an action goes to that focused session', await p.evaluate(() => filter) === 'focus' && /missed cards/.test(await p.evaluate(() => progress.open.focus.label)));
      await p.click('#toQuote'); await p.waitForTimeout(200);
      ok('BD5 ...and its cards are all from that subtopic', await p.evaluate(() => deck.every(k => progress.open.focus.list.includes(idOf(k)))) && await p.evaluate(() => deck.length) > 0);
      await p.click('#logo'); await p.click('#weakBtn'); await p.click('.wk-det >> nth=1 >> summary');
      ok('BD6 sections expand to categories and subtopics with status chips', await p.isVisible('.wk-det[open] .sub-list') && (await p.textContent('.wk-det[open]')).includes('Fluids'));
    }
    await p.screenshot({ path:require('os').tmpdir() + `/b-${w}.png`, fullPage:true });
    await ctx.close(); }
  ok('BD7 no page errors', errs.length === 0, errs.join(' | '));
  await b.close(); console.log(`${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0); })();
