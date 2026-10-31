'use strict';
// Courses ▾ and About Us ▾ stay open while the mouse travels from the button to any item in the menu
// (any reasonable path), on the public pages and in the app header.
const { chromium } = require('playwright'), assert = require('node:assert/strict'), create = require('../tools/preview-server');
let count = 0; const ok = (n, v) => { assert.ok(v, n); count++; console.log('PASS', n); };
(async () => {
  const server = create(); await new Promise(r => server.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${server.address().port}`, browser = await chromium.launch();
  try {
    const p = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const pairs = { public: [['.nav-courses-top', '.nav-courses-menu'], ['.nav-drop-top', '.nav-menu']], app: [['[data-drop=courses] .sl-top', '#sl-courses'], ['[data-drop=about] .sl-top', '#sl-about']] };
    for(const [path, kind] of [['/mcat', 'public'], ['/spanish', 'public'], ['/about-us', 'public'], ['/login', 'app']]){
      await p.goto(base + path); await p.waitForTimeout(400);
      for(const [trig, menu] of pairs[kind]) for(const aim of [0.1, 0.9]){
        const t = await p.locator(trig).first().boundingBox(); await p.mouse.move(t.x + t.width / 2, t.y + t.height / 2); await p.waitForTimeout(150);
        const m = await p.locator(menu).first().boundingBox(), tx = m.x + m.width * aim, ty = m.y + m.height * 0.85;
        let closed = 0;
        for(let i = 1; i <= 60; i++){ await p.mouse.move(t.x + t.width / 2 + (tx - t.x - t.width / 2) * i / 60, t.y + t.height / 2 + (ty - t.y - t.height / 2) * i / 60); if(!(await p.locator(menu).first().isVisible())) closed++; }
        ok(`${path}: ${trig} stays open on the way to the ${aim < .5 ? 'left' : 'right'} side of the menu`, closed === 0 && await p.locator(menu).first().isVisible());
        await p.mouse.move(5, 700); await p.waitForTimeout(700);
        ok(`${path}: ${trig} closes once the mouse has left`, !(await p.locator(menu).first().isVisible()));
      }
    }
    console.log(`${count} dropdown hover checks passed.`);
  } catch (e) { console.error(e); process.exitCode = 1; }
  finally { await browser.close(); server.close(); }
})();
