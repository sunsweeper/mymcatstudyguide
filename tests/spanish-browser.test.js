'use strict';
// /spanish practice page: route, deck, flip and answer checking, phone fit.
const { chromium } = require('playwright'), assert = require('node:assert/strict'), create = require('../tools/preview-server');
let count = 0; const ok = (n, v) => { assert.ok(v, n); count++; console.log('PASS', n); };
(async () => {
  const server = create(); await new Promise(r => server.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${server.address().port}`, browser = await chromium.launch(), errors = [];
  try {
    const p = await browser.newPage({ viewport: { width: 1280, height: 900 } }); p.on('pageerror', e => errors.push(e.message));
    await p.goto(base + '/spanish'); await p.waitForSelector('.sp-prompt');
    ok('/spanish serves the practice page', (await p.title()).includes('Spanish'));
    ok('Beta note shown', (await p.textContent('.sp-beta')).includes('being reviewed by native speakers'));
    ok('All 1000 cards loaded', (await p.textContent('#spPos')) === '1 / 1000');
    ok('Categories listed', (await p.locator('#spCat option').count()) > 20);
    ok('Standard nav present', await p.isVisible('.site-header') || await p.locator('header').count() > 0);
    const g = (i, c) => p.evaluate(([i, c]) => TabiSpanish.grade(i, c), [i, c]);
    const card = { a: 'el árbol', alt: ['arbolito'] };
    ok('Exact answer correct', (await g('el árbol', card)).kind === 'ok');
    ok('Article and capitals forgiven', (await g('Árbol', card)).kind === 'ok');
    ok('Missing accent gets full credit and shows the accented spelling', (await g('arbol', card)).kind === 'ok' && (await g('arbol', card)).text.includes('el árbol'));
    ok('Missing accent on an alternative also counts', (await g('Adios', { a: 'Adiós', alt: ['Chao'] })).kind === 'ok');
    ok('Alternative accepted', (await g('arbolito', card)).kind === 'ok');
    ok('Punctuation forgiven', (await g('¿Cómo estás?', { a: 'cómo estás', alt: [] })).kind === 'ok');
    ok('Wrong answer marked', (await g('casa', card)).kind === 'no');
    const ans = await p.evaluate(() => fetch('/courses/spanish/cards.json').then(r => r.json()).then(d => d.cards[0].a));
    await p.fill('#spInput', ans); await p.press('#spInput', 'Enter');
    ok('Enter flips and checks', (await p.textContent('.sp-answer')) === ans && (await p.getAttribute('#spResult', 'class')).includes('ok') && (await p.textContent('#spScore')) === '1 of 1 correct');
    await p.press('#spInput', 'Enter');
    ok('Enter again goes to the next card', (await p.textContent('#spPos')) === '2 / 1000' && await p.isVisible('.sp-prompt'));
    await p.selectOption('#spCat', { index: 3 });
    ok('Category filter narrows the deck', !(await p.textContent('#spPos')).endsWith('/ 1000'));
    await p.setViewportSize({ width: 375, height: 800 });
    ok('Fits a phone (no sideways scroll)', await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    ok('Courses menu lists Spanish', (await (await p.request.get(base + '/site-nav.js')).text()).includes("'/spanish'"));
    ok('/Spanish redirects to /spanish', await p.request.get(base + '/Spanish', { maxRedirects: 0 }).then(r => r.status() === 301 && r.headers().location === '/spanish'));
    ok('No JavaScript errors', errors.length === 0);
    console.log(`${count} Spanish checks passed.`);
  } catch (e) { console.error(e); if (errors.length) console.error(errors); process.exitCode = 1; }
  finally { await browser.close(); server.close(); }
})();
