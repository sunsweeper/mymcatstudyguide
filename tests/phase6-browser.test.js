// Package 2, Phase 6 in a real browser: countdown placement at every width; settings flow.
const { chromium } = require('playwright');
const URL = 'file://' + require('path').join(__dirname, '..', 'index.html');
let pass = 0, fail = 0; const ok = (n, c, x = "") => { c ? pass++ : fail++; console.log(c ? "PASS" : "FAIL", n, x); };
const d = n => { const t = new Date(); t.setDate(t.getDate() + n); return `${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,'0')}-${String(t.getDate()).padStart(2,'0')}`; };
(async () => { const b = await chromium.launch(); const errs = [];
  for (const w of [360, 390, 768, 1280]) for (const bg of ['dark', 'light']) {
    const ctx = await b.newContext({ viewport:{ width:w, height:900 } }); await ctx.route(/supabase/, r => r.abort()); const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
    await p.addInitScript(x => { if(!localStorage.getItem('mcat-progress-v2')) localStorage.setItem('mcat-progress-v2', JSON.stringify({ cards:{}, newDay:{date:'',count:0}, open:{}, view:'q', tips:{off:true}, bg:x[0], testDate:x[1] })); }, [bg, d(37)]);
    await p.goto(URL); await p.waitForTimeout(150);
    const g = await p.evaluate(() => { const r = s => { const e = document.querySelector(s); if(!e || e.hidden) return null; const b = e.getBoundingClientRect(); return { x:b.x, y:b.y, r:b.right, b:b.bottom, h:b.height }; };
      return { logoBox:(() => { const r2 = [...document.querySelectorAll('#logo svg, #logo .logo-word')].map(e => e.getBoundingClientRect()); return { right: Math.max(...r2.map(x => x.right)) }; })(), cd:r('#countdown'), mode:(document.getElementById('modeBtn').offsetParent ? r('#modeBtn') : null), logo:r('#logo'), bar:r('.topbar'), menu:r('#menuBtn'), txt:document.getElementById('countdown').textContent, sw:document.documentElement.scrollWidth,
        others:[...document.querySelectorAll('.topbar button, .topbar a')].filter(e => e.id !== 'countdown' && e.offsetParent && !e.closest('#menu')).map(e => e.getBoundingClientRect()) }; });
    const tag = `${w}-${bg}`;
    ok(`CD1 ${tag} countdown visible in the header, just left of the day/night switch`, g.cd && (g.mode ? g.cd.r <= g.mode.x + 0.5 && g.mode.x - g.cd.r < 40 : g.cd.r >= g.bar.r - 40) && g.cd.y >= g.bar.y && g.cd.b <= g.bar.b && /37\s*Days Until Your MCAT/.test(g.txt), JSON.stringify(g.cd));
    ok(`CD2 ${tag} doesn't overlap the logo or other header buttons; no sideways scroll`, g.others.every(o => o.right <= g.cd.x + 0.5 || o.left >= g.cd.r - 0.5 || o.bottom <= g.cd.y || o.top >= g.cd.b) && g.sw <= w && g.logoBox.right <= g.cd.x);
    ok(`CD3 ${tag} at least 44px tall to tap`, g.cd.h >= 40, g.cd.h);
    if (w === 390 && bg === 'dark') {
      await p.screenshot({ path:require('os').tmpdir() + '/cd-390.png', clip:{ x:0, y:0, width:390, height:120 } });
      await p.click('#countdown');
      ok('CD4 tapping it opens MCAT date settings', await p.isVisible('#dDate') && (await p.inputValue('#dDate')) === d(37));
      await p.fill('#dDate', d(10)); await p.click('#dateForm [type=submit]'); await p.waitForTimeout(100);
      ok('CD5 saving a new date updates the countdown right away and returns to the dashboard', /10\s*Days Until Your MCAT/.test(await p.textContent('#countdown')) && await p.evaluate(() => mode === 'welcome'));
      await p.click('#countdown');
      await p.check('#dNone'); await p.click('#dateForm [type=submit]'); await p.waitForTimeout(100);
      ok('CD6 "not scheduled yet" hides it', await p.isHidden('#countdown'));
    }
    if (w === 1280 && bg === 'dark') await p.screenshot({ path:require('os').tmpdir() + '/cd-1280.png', clip:{ x:0, y:0, width:1280, height:140 } });
    await ctx.close(); }
  { let bad = []; for(const w of [761, 820, 901, 1010, 1100, 1280]) for(const signed of [0, 1]){ const p = await b.newPage({ viewport:{ width:w, height:700 } });
      await p.addInitScript(x => { localStorage.setItem('mcat-progress-v2', JSON.stringify({ cards:{}, newDay:{date:'',count:0}, open:{}, view:'q', tips:{off:true}, testDate:x, bookmarks:Object.fromEntries(Array.from({length:12},(_,i)=>['1A-0'+String(i+10),'x'])), notes:Object.fromEntries(Array.from({length:120},(_,i)=>['2A-'+String(i+1).padStart(3,'0'),'n'])) })); }, d(37));
      await p.goto(URL); if(signed) await p.evaluate(() => { document.getElementById('avatarBtn').hidden = false; });
      const r = await p.evaluate(() => { const lr = Math.max(...[...document.querySelectorAll('#logo svg,#logo .logo-word')].map(e => e.getBoundingClientRect().right)); const items = [...document.querySelectorAll('.topnav > *')].filter(e => e.offsetParent).map(e => e.getBoundingClientRect()); const bar = document.querySelector('.topbar').getBoundingClientRect(); return lr <= Math.min(...items.map(i => i.left)) - 4 && Math.max(...items.map(i => i.right)) <= bar.right; });
      if(!r) bad.push(`${w}/${signed}`); await p.close(); }
    ok('CD8 header fits with the countdown, the account button and large Bookmark/Note counts at tablet and desktop widths', !bad.length, bad.join(' ')); }
  ok('CD7 no page errors', errs.length === 0, errs.join(' | '));
  await b.close(); console.log(`${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0); })();
