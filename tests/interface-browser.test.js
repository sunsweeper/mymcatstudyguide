// Interface update (Oct 25 2026) in a real browser: card header/footer positions, workspace, hidden entries, Mandatory Response popup.
const { chromium } = require('playwright');
const URL = 'file://' + require('path').join(__dirname, '..', 'index.html');
let pass = 0, fail = 0; const ok = (n, c, x = "") => { c ? pass++ : fail++; console.log(c ? "PASS" : "FAIL", n, x); };
const d = n => { const t = new Date(); t.setHours(12); t.setDate(t.getDate() + n); return t.toISOString().slice(0, 10); };
(async () => {
  const b = await chromium.launch(); const errs = [];
  for (const w of [360, 390, 440, 768, 1280]) for (const bg of ['dark', 'light']) {
    const ctx = await b.newContext({ viewport:{ width:w, height:900 } }); await ctx.route(/supabase/, r => r.abort()); const p = await ctx.newPage();   // no account library: the page runs in its local (signed-out) mode p.on('pageerror', e => errs.push(e.message));
    await p.addInitScript(s => { if(!sessionStorage.getItem('seeded')){ localStorage.setItem('mcat-progress-v2', s); sessionStorage.setItem('seeded','1'); } }, JSON.stringify({ cards:{}, newDay:{date:'',count:0}, open:{}, view:'q', tips:{off:true}, bg }));
    await p.goto(URL); await p.click('[data-k=ps]'); await p.click('#toQuote'); await p.waitForTimeout(200);
    for (const side of ['Question', 'Answer']) {
      if (side === 'Answer') { await p.click('#reveal'); await p.waitForTimeout(500); }
      const g = await p.evaluate(() => { const r = s => { const e = document.querySelector(s); if(!e) return null; const b = e.getBoundingClientRect(); return { x:b.x, y:b.y, w:b.width, h:b.height, r:b.right, b:b.bottom }; };
        return { card:r('#card'), side:r('#card .side'), bm:r('#card .bm'), cat:r('#card .foot .cat'), cid:r('#card .foot .cid'), face:r('#card .face'), asked:r('#card .asked'), ans:r('#card .ans'), meta:r('#card .meta'),
          sideText:document.querySelector('#card .side').textContent, sw:document.documentElement.scrollWidth, pad:parseFloat(getComputedStyle(document.querySelector('#card')).paddingLeft) }; });
      const tag = `${w}-${bg}-${side}`, cx = g.card.x + g.card.w / 2;
      const sf = await p.evaluate(() => { const c = getComputedStyle(document.querySelector('#card .side')); return { ff:c.fontFamily, bw:c.borderTopWidth, fs:parseFloat(c.fontSize) }; });
      ok(`C1 ${tag} label in the upper-left corner, in the cursive script, no pill border`, Math.abs(g.side.x - (g.card.x + g.pad)) <= 2 && g.sideText === side && /Dancing Script/.test(sf.ff) && sf.bw === '0px' && sf.fs >= 26 && sf.fs <= 36, `${sf.fs}px`);
      ok(`C2 ${tag} bookmark at the right of the header, not touching the label`, g.bm.r <= g.card.r - g.pad + 1 && g.bm.r >= g.card.r - g.pad - 2 && g.bm.x >= g.side.r + 4 && Math.abs((g.bm.y + g.bm.h/2) - (g.side.y + g.side.h/2)) < 3);
      ok(`C3 ${tag} category lower-left, ID lower-right, inside the card, no overlap`, g.cat.x <= g.card.x + g.pad + 4 && g.cid.r >= g.card.r - g.pad - 4 && g.cid.r <= g.card.r && g.cat.b <= g.card.b && g.cid.b <= g.card.b && g.cat.y > g.face.y && (g.cat.r <= g.cid.x || g.cat.b <= g.cid.y + 1));
      if (side === 'Answer') {
        ok(`C4 ${tag} question sits about 0.25 in below the header`, g.asked.y - g.meta.b >= 14 && g.asked.y - g.meta.b <= 40, `${Math.round(g.asked.y - g.meta.b)}px`);
        ok(`C5 ${tag} answer centered horizontally, below the question`, Math.abs((g.ans.x + g.ans.w / 2) - cx) <= 2 && g.ans.y >= g.asked.b);
      }
      ok(`C6 ${tag} no sideways scroll`, g.sw <= w, g.sw);
    }
    await ctx.close();
  }
  // Longest category name on the smallest phone
  { const ctx = await b.newContext({ viewport:{ width:360, height:800 } }); await ctx.route(/supabase/, r => r.abort()); const p = await ctx.newPage();   // no account library: the page runs in its local (signed-out) mode p.on('pageerror', e => errs.push(e.message));
    await p.addInitScript(() => { if(!sessionStorage.getItem('seeded')){ localStorage.setItem('mcat-progress-v2', JSON.stringify({ cards:{}, newDay:{date:'',count:0}, open:{}, view:'q', tips:{off:true} })); sessionStorage.setItem('seeded','1'); } });
    await p.goto(URL); await p.click('[data-k=ps]'); await p.click('#toQuote');
    await p.evaluate(() => { deck.unshift('7A-001'); progress.open.ps.ids = deck.slice(); resetCard(); render(); });
    const g = await p.evaluate(() => { const r = s => document.querySelector(s).getBoundingClientRect(); const c = r('#card'), a = r('#card .cat'), i = r('#card .cid'); return { txt: document.querySelector('#card .cat').textContent, ok: a.left >= c.left && i.right <= c.right && (a.right <= i.left || a.bottom <= i.top + 1) && a.bottom <= c.bottom, sw: document.documentElement.scrollWidth }; });
    ok('C7 longest category ("Biology, personality, motivation, and disorders") wraps at 360px without hitting the card ID', g.txt.startsWith('Biology, personality') && g.ok && g.sw <= 360, JSON.stringify(g));
    await p.screenshot({ path:require('os').tmpdir() + '/long-category-360.png' });
    await ctx.close();
  }
  // Hidden entries and the popup in a real page
  { const ctx = await b.newContext({ viewport:{ width:1280, height:1000 } }); await ctx.route(/supabase/, r => r.abort()); const p = await ctx.newPage();   // no account library: the page runs in its local (signed-out) mode p.on('pageerror', e => errs.push(e.message));
    const id = '1A-001';
    await p.addInitScript(s => { if(!sessionStorage.getItem('seeded')){ localStorage.setItem('mcat-progress-v2', s); sessionStorage.setItem('seeded','1'); } }, JSON.stringify({ view:'q', tips:{off:true}, newDay:{date:'',count:0}, open:{}, notes:{ [id]:'ZZ-NOTE-TEXT' },
      cards:{ [id]:{ status:'learning', writing:true, last:d(-1), due:d(0), interval:0, reps:0, total:1, good:0, bad:1, history:[{ d:d(-1), r:'again', t:1, w:'ZZ-OLD-ANSWER' }] } } }));
    await p.goto(URL); await p.click('[data-k=bb]'); await p.click('#toQuote'); await p.waitForTimeout(200);
    ok('H0 the missed card is up with My Written Answers open', await p.evaluate(() => idOf(curKey)) === id && await p.getAttribute('#tabAns', 'aria-selected') === 'true');
    const html = await p.content();
    ok('H1 before the flip, the saved note and previous answer are nowhere in the page (screen readers can\'t reach them)', !html.includes('ZZ-NOTE-TEXT') && !html.includes('ZZ-OLD-ANSWER'));
    ok('H2 ...and the panels say they appear after the reveal', (await p.textContent('#prevList')).includes('appear after you reveal') && (await p.click('#tabNotes'), await p.isVisible('#noteLock')));
    ok('H3 Reveal stays disabled until she writes', await p.isDisabled('#reveal'));
    const aria = await p.locator('#study').ariaSnapshot();
    ok('SR1 screen-reader tree: tabs announced as a tab list with the selected tab, fields labeled, hidden note/answers not readable', /tablist "Notes and written answers"/.test(aria) && /tab "(Notes|My Written Answers)" \[selected\]/.test(aria) && /tabpanel "(Notes|My Written Answers)"/.test(aria) && !/ZZ-/.test(aria));
    await p.click('#tabAns'); await p.fill('#curAnswer', 'my try'); await p.click('#reveal'); await p.waitForTimeout(500);
    ok('H4 after the flip, previous answers and the note appear', (await p.textContent('#prevList')).includes('ZZ-OLD-ANSWER') && (await p.click('#tabNotes'), (await p.inputValue('#noteText')) === 'ZZ-NOTE-TEXT'));
    await p.click('#mandToggle'); await p.click('[data-r=again]');
    ok('H5 switch off: Didn\'t know opens Current Answer with Next card enabled', await p.evaluate(() => document.activeElement.id) === 'curAnswer' && !(await p.isDisabled('#curNext')));
    await p.click('#curNext'); await p.waitForTimeout(150);
    ok('H6 leaving without the response shows the Yes/No popup', await p.isVisible('#askModal') && (await p.textContent('#askText')).startsWith("You didn't type the mandatory response"));
    await p.click('#askNo'); ok('H7 No keeps her on the card', await p.evaluate(() => idOf(curKey)) === id && !(await p.isVisible('#askModal')));
    await p.click('#curNext'); await p.click('#askYes'); await p.waitForTimeout(200);
    ok('H8 Yes moves on', await p.evaluate(() => idOf(curKey)) !== id);
    await ctx.close();
  }
  // Real refresh in the middle of a written answer
  { const ctx = await b.newContext({ viewport:{ width:390, height:844 } }); await ctx.route(/supabase/, r => r.abort()); const p = await ctx.newPage();   // no account library: the page runs in its local (signed-out) mode p.on('pageerror', e => errs.push(e.message));
    await p.addInitScript(() => { if(!sessionStorage.getItem('seeded')){ localStorage.setItem('mcat-progress-v2', JSON.stringify({ cards:{}, newDay:{date:'',count:0}, open:{}, view:'q', tips:{off:true} })); sessionStorage.setItem('seeded','1'); } });
    await p.goto(URL); await p.click('[data-k=cp]'); await p.click('#toQuote'); await p.click('#reveal'); await p.waitForTimeout(450);
    const k = await p.evaluate(() => curKey);
    await p.click('[data-r=again]'); await p.keyboard.type('Typed before the page reloaded');
    await p.reload(); await p.click('[data-k=cp]'); await p.click('#toQuote'); await p.waitForTimeout(300);
    ok('RF1 browser refresh mid-answer: same card, answer side, text restored', await p.evaluate(() => curKey) === k && await p.evaluate(() => revealed) && (await p.inputValue('#curAnswer')) === 'Typed before the page reloaded');
    await ctx.close();
  }
  ok('H9 no page errors', errs.length === 0, errs.join(' | '));
  await b.close(); console.log(`${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
})();
