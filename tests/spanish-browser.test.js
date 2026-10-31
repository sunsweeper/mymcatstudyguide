'use strict';
// /spanish: the /mcat page mirrored, with the same study workspace driven by the 1,000-card Spanish deck.
const { chromium } = require('playwright'), assert = require('node:assert/strict'), create = require('../tools/preview-server');
let count = 0; const ok = (n, v) => { assert.ok(v, n); count++; console.log('PASS', n); };
(async () => {
  const server = create(); await new Promise(r => server.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${server.address().port}`, browser = await chromium.launch(), errors = [];
  try {
    const p = await browser.newPage({ viewport: { width: 1440, height: 900 } }); p.on('pageerror', e => errors.push(e.message));
    await p.goto(base + '/spanish'); await p.waitForFunction(() => document.querySelectorAll('#spCat option').length > 20);
    ok('/spanish serves the page', (await p.title()).includes('Spanish'));
    ok('Same sections as /mcat: hero, memory, workspace, next step', await p.isVisible('.hero-art') && await p.isVisible('#features') && await p.isVisible('#studyWorkspace') && await p.isVisible('.trial-invite'));
    const x = sel => p.evaluate(s => document.querySelector(s).getBoundingClientRect().left, sel);
    ok('Mirrored: display on the left, words on the right', await x('.hero-art') < await x('.hero-copy'));
    ok('Mirrored: sign-up form on the left, words on the right', await x('.trial-form') < await x('.trial-copy'));
    ok('Beta note shown', (await p.textContent('.sp-beta')).includes('being reviewed by native speakers'));
    ok('All 1000 cards in the workspace', (await p.textContent('#demoCount')) === '1 / 1000');
    ok('No MCAT words in the page body except the standard footer', !(await p.evaluate(() => [...document.querySelectorAll('main')].map(m => m.innerText).join(' '))).includes('MCAT prep'));
    const g = (i, c) => p.evaluate(([i, c]) => TabiSpanish.grade(i, c), [i, c]);
    const card = { a: 'el árbol', alt: ['arbolito'], q: 'tree' };
    ok('Exact answer correct', (await g('el árbol', card)).kind === 'ok');
    ok('Missing accent: full credit, accented spelling shown', (await g('arbol', card)).kind === 'ok' && (await g('arbol', card)).reason.includes('el árbol'));
    ok('Alternative accepted', (await g('arbolito', card)).kind === 'ok');
    ok('Wrong article: Struggled, with the reason', (await g('la árbol', card)).rating === 'struggled' && (await g('la árbol', card)).reason.includes('masculine'));
    ok('Spelling: names the word', (await g('buenos diaz', { a: 'Buenos días', alt: [], q: 'Good morning' })).reason.includes('you wrote “diaz”'));
    ok('Plain miss: Didn\'t know', (await g('perro', card)).rating === 'didnt');
    ok('English answers checked in Answers First', await p.evaluate(() => TabiSpanish.englishRight('the tree', { q: 'Tree' }) && !TabiSpanish.englishRight('house', { q: 'Tree' })));
    // Card 1 is "Hello" → Hola. Type it without the accent issue, Enter flips, Enter grades.
    await p.fill('#recallDraft', 'hola');
    ok('Typed: the button says Grade My Answer', (await p.textContent('#demoNext')).includes('Grade My Answer'));
    await p.press('#recallDraft', 'Enter'); await p.waitForFunction(() => !document.getElementById('demoAnswer').hidden);
    ok('Enter flips the card; answer shows', (await p.textContent('#demoAnswer')).includes('Hola'));
    await p.click('#demoNext'); await p.waitForSelector('#ratingModal:not([hidden])');
    ok('Same grade pop-up as /mcat: Congratulations!', (await p.textContent('#ratingModalTitle')) === 'Congratulations!');
    await p.click('#demoGradeAccept');
    ok('Save and Next Card moves on and scores it', (await p.textContent('#demoCount')) === '2 / 1000' && (await p.textContent('#spScore')) === '1 of 1 correct');
    // Card 2 is "Goodbye" → Adiós. Wrong answer → Almost got it → lock it in.
    await p.fill('#recallDraft', 'hola'); await p.press('#recallDraft', 'Enter'); await p.waitForFunction(() => !document.getElementById('demoAnswer').hidden);
    await p.press('#recallDraft', 'Enter').catch(() => {}); await p.click('#demoNext').catch(() => {}); await p.waitForSelector('#ratingModal:not([hidden])');
    ok('Wrong answer: Almost got it, with the reason and the right answer', (await p.textContent('#ratingModalTitle')) === 'Almost got it.' && (await p.textContent('#ratingModalDescription')).includes('Adiós'));
    await p.click('#demoGradeAccept');
    ok('Missed card: type the answer once to lock it in', await p.isDisabled('#demoNext') && (await p.textContent('#recallMessage')).includes('lock it in'));
    await p.fill('#recallDraft', 'adios');
    ok('...accents not needed to lock it in', !(await p.isDisabled('#demoNext')));
    await p.click('#demoNext');
    ok('Then the next card; score 1 of 2', (await p.textContent('#demoCount')) === '3 / 1000' && (await p.textContent('#spScore')) === '1 of 2 correct');
    await p.click('#demoPrevious');
    ok('Previous goes back without changing the score', (await p.textContent('#demoCount')) === '2 / 1000' && (await p.textContent('#spScore')) === '1 of 2 correct');
    await p.selectOption('#spCat', 'Greetings');
    ok('Category filter narrows the deck', (await p.textContent('#demoCount')) === '1 / 15');
    await p.reload(); await p.waitForFunction(() => document.querySelectorAll('#spCat option').length > 20);
    ok('Category and place kept in this browser', (await p.inputValue('#spCat')) === 'Greetings');
    await p.click('[data-mode=answer]');
    ok('Answers First shows the Spanish', (await p.textContent('#demoQuestion')) === 'Hola');
    ok('No Raise Your Hand on the Spanish workspace (no Spanish community yet)', (await p.locator('#demoHelp').count()) === 0);
    await p.click('#startTour');
    ok('Guided tour runs', await p.isVisible('.tour-popover'));
    await p.setViewportSize({ width: 375, height: 800 });
    ok('Fits a phone (no sideways scroll)', await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    ok('Courses menu lists Spanish', (await (await p.request.get(base + '/site-nav.js')).text()).includes("'/spanish'"));
    ok('/Spanish redirects to /spanish', await p.request.get(base + '/Spanish', { maxRedirects: 0 }).then(r => r.status() === 301 && r.headers().location === '/spanish'));
    ok('No JavaScript errors', errors.length === 0);
    console.log(`${count} Spanish checks passed.`);
  } catch (e) { console.error(e); if (errors.length) console.error(errors); process.exitCode = 1; }
  finally { await browser.close(); server.close(); }
})();
