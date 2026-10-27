// Package 2, Phase 3 in a real browser: confidence scale.
const { chromium } = require('playwright');
const URL = 'file://' + require('path').join(__dirname, '..', 'index.html');
let pass = 0, fail = 0; const ok = (n, c, x = "") => { c ? pass++ : fail++; console.log(c ? "PASS" : "FAIL", n, x); };
(async () => {
  const b = await chromium.launch(); const errs = [];
  const ctx = await b.newContext({ viewport:{ width:1280, height:1000 } }); await ctx.route(/supabase/, r => r.abort()); const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
  await p.addInitScript(() => { if(!sessionStorage.getItem('seeded')){ localStorage.setItem('mcat-progress-v2', JSON.stringify({ cards:{}, newDay:{date:'',count:0}, open:{}, view:'q', tips:{off:true} })); sessionStorage.setItem('seeded','1'); } });
  await p.goto(URL); await p.click('[data-k=bb]'); await p.click('#toQuote');
  const info = await p.evaluate(() => { const bs = [...document.querySelectorAll('#confRow [data-c]')];
    return { n:bs.length, labels:bs.map(x => x.textContent).join(','), checked:bs.filter(x => x.getAttribute('aria-checked') === 'true').length,
      c1:getComputedStyle(bs[0]).boxShadow, c10:getComputedStyle(bs[9]).boxShadow, q:document.getElementById('confQ').textContent, inCard:!!document.querySelector('#card #confRow'), role:document.querySelector('#confRow .conf-scale').getAttribute('role') }; });
  ok('CB1 ten numbered choices 1–10, none selected, labeled with the question', info.n === 10 && info.labels === '1,2,3,4,5,6,7,8,9,10' && info.checked === 0 && info.q.startsWith('How confident are you in your answer?'));
  const rgb = s => (s.match(/rgb\((\d+), (\d+), (\d+)\)/) || []).slice(1).map(Number);
  const [r1, g1] = rgb(info.c1), [r10, g10] = rgb(info.c10);
  ok('CB2 red at 1, green at 10', r1 > g1 && g10 > r10, `${info.c1} / ${info.c10}`);
  ok('CB3 outside the card (card design unchanged), exposed as a radio group', !info.inCard && info.role === 'radiogroup');
  await p.focus('#confRow [data-c="1"]'); await p.keyboard.press('ArrowRight'); await p.keyboard.press('ArrowRight'); await p.keyboard.press('ArrowRight');
  ok('CB4 keyboard: arrow keys move and select', await p.evaluate(() => conf) === 4 && await p.evaluate(() => document.activeElement.dataset.c) === '4');
  await p.keyboard.press('End'); ok('CB5 End jumps to 10', await p.evaluate(() => conf) === 10);
  await p.click('#reveal'); await p.waitForTimeout(450);
  ok('CB6 hidden once the answer is revealed', await p.isHidden('#confRow'));
  await p.click('[data-r=good]'); await p.waitForTimeout(150);
  ok('CB7 saved with the rating', await p.evaluate(() => { const s = Object.values(progress.cards)[0]; return s.history[s.history.length - 1].c; }) === 10);
  ok('CB8 next card: visible again, nothing selected', await p.isVisible('#confRow') && await p.evaluate(() => document.querySelectorAll('#confRow [aria-checked="true"]').length) === 0);
  ok('CB9 no page errors', errs.length === 0, errs.join(' | '));
  await b.close(); console.log(`${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
})();
