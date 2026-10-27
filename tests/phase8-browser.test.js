// Package 2, Phase 8 in a real browser: draft preview, and how a published graphical card behaves in study.
const { chromium } = require('playwright');
const fs = require('fs'), os = require('os'), path = require('path');
const FILE = process.env.FILE || path.join(__dirname, '..', 'index.html');
let pass = 0, fail = 0; const ok = (n, c, x = "") => { c ? pass++ : fail++; console.log(c ? "PASS" : "FAIL", n, x); };
(async () => { const b = await chromium.launch(); const errs = [];
  // 1) Drafts aren't studied
  { const p = await b.newPage(); p.on('pageerror', e => errs.push(e.message)); await p.route(/supabase/, r => r.abort());
    await p.goto('file://' + FILE); await p.waitForTimeout(150);
    ok('GX1 drafts are not in the study deck (1,000 cards) and never in a session pool', await p.evaluate(() => CARDS.length === 1000 && !CARDS.some(c => /-G\d\d$/.test(c[3])) && !poolFor('all').some(c => /-G\d\d$/.test(c[3]))));
    ok('GX2 the home page still says 1000 flashcards', (await p.textContent('#screen')).includes('Total number of flashcards: 1000')); await p.close(); }
  // 2) Preview page
  for (const w of [360, 1280]) { const p = await b.newPage({ viewport:{ width:w, height:900 } }); p.on('pageerror', e => errs.push(e.message)); await p.route(/supabase/, r => r.abort());
    await p.goto('file://' + FILE + '?preview=graphics'); await p.waitForTimeout(300);
    const r = await p.evaluate(() => { const svgs = [...document.querySelectorAll('.gprev svg.fig')];
      const parseOk = svgs.every(s => !new DOMParser().parseFromString(s.outerHTML, 'image/svg+xml').querySelector('parsererror'));
      const fit = svgs.every(s => { const b = s.getBoundingClientRect(), c = s.closest('.card').getBoundingClientRect(); return b.width > 150 && b.left >= c.left - 0.5 && b.right <= c.right + 0.5; });
      const alt = svgs.every(s => s.querySelector('title') && s.querySelector('desc') && s.querySelector('desc').textContent.length > 20);
      return { n:document.querySelectorAll('.gprev').length, svgs:svgs.length, parseOk, fit, alt, sw:document.documentElement.scrollWidth, saved: localStorage.getItem('mcat-progress-v2') }; });
    ok(`GX3 ${w}px preview shows all 13 drafts, question and answer side`, r.n === 13 && r.svgs === 26, JSON.stringify([r.n, r.svgs]));
    ok(`GX4 ${w}px every figure is valid SVG, scales inside the card, no sideways scroll`, r.parseOk && r.fit && r.sw <= w);
    ok(`GX5 ${w}px every figure has a text alternative (title + description)`, r.alt);
    ok(`GX6 ${w}px the preview saves nothing`, r.saved === null);
    await p.screenshot({ path: path.join(os.tmpdir(), `gfx-preview-${w}.png`) }); await p.close(); }
  // 3) Simulated publication of one card: it studies like any other card
  { const src = fs.readFileSync(FILE, 'utf8').replace('const GRAPHICS_PUBLISHED = [];', 'const GRAPHICS_PUBLISHED = ["1C-G01"];');
    const tmp = path.join(os.tmpdir(), 'gfx-published.html'); fs.writeFileSync(tmp, src);
    for (const w of [360, 1280]) { const p = await b.newPage({ viewport:{ width:w, height:900 } }); p.on('pageerror', e => errs.push(e.message)); await p.route(/supabase/, r => r.abort());
      await p.addInitScript(() => { if(!localStorage.getItem('mcat-progress-v2')) localStorage.setItem('mcat-progress-v2', JSON.stringify({ cards:{}, newDay:{date:'',count:0}, open:{}, view:'q', tips:{off:true} })); });
      await p.goto('file://' + tmp); await p.click('[data-k=bb]'); await p.click('#toQuote');
      await p.evaluate(() => { deck.unshift('1C-G01'); progress.open.bb.ids = deck.slice(); resetCard(); render(); });
      const q = await p.evaluate(() => { const s = document.querySelector('#card svg.fig'), c = document.getElementById('card').getBoundingClientRect(), b = s && s.getBoundingClientRect();
        return { has: !!s, fit: !!b && b.left >= c.left && b.right <= c.right, side: document.querySelector('#card .side').textContent, id: document.querySelector('#card .cid').textContent }; });
      ok(`GX7 ${w}px a published graphical card appears in the normal card component with its figure`, q.has && q.fit && q.side === 'Question' && q.id === '1C-G01');
      await p.click('#reveal'); await p.waitForTimeout(450); await p.click('[data-r=good]'); await p.waitForTimeout(100);
      ok(`GX8 ${w}px it's rated and scheduled like any other card`, await p.evaluate(() => !!(progress.cards['1C-G01'] && progress.cards['1C-G01'].history.length === 1)));
      if (w === 1280) {
        ok('GX9 its mastery is tracked per card, and it shares its concept with the text cards (counted once as concept evidence)', await p.evaluate(() => { const m = META.c['1C-G01']; return !!m && cardLevel('1C-G01') !== 'unseen' && CARDS.some(c => c[3] !== '1C-G01' && META.c[c[3]] && META.c[c[3]][1] === m[1]); }));
        await p.screenshot({ path: path.join(os.tmpdir(), 'gfx-in-study.png') });
      }
      await p.close(); } }
  ok('GX10 no page errors', errs.length === 0, errs.join(' | '));
  await b.close(); console.log(`${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0); })();
