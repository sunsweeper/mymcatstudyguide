'use strict';
// The app uses the public pages' header: same links, same Courses list, same fonts and colors.
const { chromium } = require('playwright'), assert = require('node:assert/strict'), fs = require('fs'), path = require('path'), create = require('../tools/preview-server');
let count = 0; const ok = (n, v) => { assert.ok(v, n); count++; console.log('PASS', n); };
const courses = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8').match(/const COURSES = (\[.*?\]\]);/)[1];
(async () => {
  ok('App Courses list matches the public Courses list', courses('app-site-nav.js') === courses('site-nav.js'));
  const server = create(); await new Promise(r => server.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${server.address().port}`, browser = await chromium.launch(), errors = [];
  try {
    const p = await browser.newPage({ viewport: { width: 1440, height: 900 } }); p.on('pageerror', e => errors.push(e.message));
    await p.goto(base + '/login'); await p.waitForSelector('.sitelinks');
    ok('Header links match the public nav', (await p.locator('.sitelinks > a:visible, .sitelinks .sl-top:visible').allTextContents()).map(t => t.replace('▾', '').trim()).join('|') === 'Courses|How it Works|Community|About Us|Log in|Sign up free');
    await p.hover('[data-drop=courses]');
    ok('Courses dropdown lists MCAT and Spanish', (await p.textContent('#sl-courses')).includes('MCAT') && (await p.textContent('#sl-courses')).includes('Spanish'));
    const st = await p.evaluate(() => ({ body: getComputedStyle(document.body).fontFamily, h2: getComputedStyle([...document.querySelectorAll('.screen h1, .screen h2, .screen .title, .screen [class*=title]')].find(h => h.offsetParent) || document.body).fontFamily,
      bg: getComputedStyle(document.querySelector('.wrap')).borderTopWidth, head: getComputedStyle(document.querySelector('.topbar')).position, logo: document.querySelector('.logo-img').getBoundingClientRect().height }));
    ok('DM Sans text, Playfair headings', st.body.startsWith('"DM Sans"') && st.h2.includes('Playfair'));
    ok('No boxed frame; sticky full-width header; standard logo size', st.bg === '0px' && st.head === 'sticky' && Math.round(st.logo) === 123);
    await p.setViewportSize({ width: 390, height: 844 });
    ok('Phone: Courses and Log in stay in the bar, ☰ menu, no sideways scroll', await p.isVisible('.sl-top') && await p.isVisible('.sl-login') && await p.isVisible('#menuBtn') && await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    ok('No JavaScript errors', errors.length === 0);
    console.log(`${count} app header checks passed.`);
  } catch (e) { console.error(e); if (errors.length) console.error(errors); process.exitCode = 1; }
  finally { await browser.close(); server.close(); }
})();
