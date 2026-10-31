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
    const card = { a: 'el árbol', alt: ['arbolito'], q: 'tree' };
    ok('Exact answer correct', (await g('el árbol', card)).kind === 'ok');
    ok('Capitals and no article forgiven', (await g('Árbol', card)).kind === 'ok');
    ok('Missing accent gets full credit and shows the accented spelling', (await g('arbol', card)).kind === 'ok' && (await g('arbol', card)).reason.includes('el árbol'));
    ok('Missing accent on an alternative also counts', (await g('Adios', { a: 'Adiós', alt: ['Chao'], q: 'Goodbye' })).kind === 'ok');
    ok('Alternative accepted', (await g('arbolito', card)).kind === 'ok');
    ok('Punctuation forgiven', (await g('¿Cómo estás?', { a: 'cómo estás', alt: [], q: 'How are you?' })).kind === 'ok');
    const why = async (i, c, k) => { const r = await g(i, c); return r.kind === 'no' && r.title === 'Almost got it.' && r.reason.includes(k); };
    ok('Reason: wrong gender article', await why('la árbol', card, 'masculine'));
    ok('Reason: spelling names the word', await why('buenos diaz', { a: 'Buenos días', alt: [], q: 'Good morning' }, 'you wrote “diaz”, it\'s spelled “días”'));
    ok('Reason: word order', await why('días buenos', { a: 'Buenos días', alt: [], q: 'Good morning' }, 'wrong order'));
    ok('Reason: missing word', await why('buenos', { a: 'Buenos días', alt: [], q: 'Good morning' }, 'missing “días”'));
    ok('Reason: another card\'s word', await why('gracias', { a: 'Adiós', alt: [], q: 'Goodbye' }, 'means'));
    ok('Reason: plain miss still shows the answer', await why('perro', card, 'el árbol'));
    const ans = await p.evaluate(() => fetch('/courses/spanish/cards.json').then(r => r.json()).then(d => d.cards[0].a));
    await p.fill('#spInput', ans); await p.press('#spInput', 'Enter');
    ok('Enter flips, checks and shows the Congratulations popup', (await p.textContent('.sp-answer')) === ans && await p.isVisible('#spPop') && (await p.textContent('#spPopTitle')).includes('Congratulations') && (await p.textContent('#spScore')) === '1 of 1 correct');
    await p.keyboard.press('Enter');
    ok('Popup Next Card goes on', !(await p.isVisible('#spPop')));
    await p.fill('#spInput', 'zzzz'); await p.press('#spInput', 'Enter');
    ok('Wrong answer popup: Almost got it, with the answer', (await p.textContent('#spPopTitle')) === 'Almost got it.' && (await p.textContent('#spPopAns')).length > 0 && (await p.textContent('#spScore')) === '1 of 2 correct');
    await p.click('#spPopClose');
    ok('See the card closes the popup on the answer side', !(await p.isVisible('#spPop')) && await p.isVisible('.sp-answer'));
    await p.click('#spNext'); await p.click('#spPrev'); await p.click('#spPrev');
    ok('Previous/Next move between cards', (await p.textContent('#spPos')) === '1 / 1000' && await p.isVisible('.sp-prompt'));
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
