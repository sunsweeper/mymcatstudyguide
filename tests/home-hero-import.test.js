'use strict';
// Homepage: Try A Flashcard / See our courses (pop-up), AI grading card, wording, and the import invitation.
const { chromium } = require('playwright'), assert = require('node:assert/strict'), fs = require('fs'), create = require('../tools/preview-server');
let count = 0; const ok = (n, v) => { assert.ok(v, n); count++; console.log('PASS', n); };
(async () => {
  const server = create(); await new Promise(r => server.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${server.address().port}`, browser = await chromium.launch(), errors = [];
  try {
    const p = await browser.newPage({ viewport: { width: 1440, height: 900 } }); p.on('pageerror', e => errors.push(e.message));
    await p.goto(base + '/'); await p.waitForTimeout(300);
    const btns = await p.locator('.home-hero .actions a').allTextContents();
    ok('Buttons: Try A Flashcard first, See our courses second', btns[0].trim() === 'Try A Flashcard' && btns[1].includes('See our courses'));
    ok('Try A Flashcard goes to the sample deck', (await p.getAttribute('.home-hero .actions a >> nth=0', 'href')) === '#try');
    await p.click('#coursesBtn');
    ok('See our courses opens a pop-up of every course', await p.isVisible('#coursesPop') && (await p.locator('#coursesPop .pop-course').evaluateAll(a => a.map(x => x.getAttribute('href')))).join() === '/mcat,/spanish');
    const navCourses = fs.readFileSync(__dirname + '/../site-nav.js', 'utf8').match(/const COURSES = (\[.*?\]\]);/)[1];
    ok('Pop-up lists the same courses as the Courses menu', ['/mcat', '/spanish'].every(h => navCourses.includes(`'${h}'`)) && (navCourses.match(/\['/g) || []).length === 2);
    await p.keyboard.press('Escape');
    ok('Escape closes it', await p.isHidden('#coursesPop'));
    ok('Hero card: a partial answer and the AI grading response (no Rosalind)', (await p.textContent('.dc-chip')).trim() === 'AI grading response' && (await p.textContent('.dc-grade')).includes('partly there') && !(await p.textContent('.home-hero')).includes('Rosalind'));
    const html = await p.content();
    ok('No "right before you would forget it"; scheduled around how well you remember', !html.includes('right before you would forget it') && html.includes('scheduled around how well you remember'));
    ok('Import invitation sits right below the sample deck', await p.evaluate(() => document.getElementById('try').nextElementSibling.id === 'import'));
    const imp = await p.textContent('#import');
    ok('Import copy as written, with the supported formats', imp.includes('Bring your flashcards.') && imp.includes('We’ll help you learn them more efficiently.') && imp.includes('adaptive review, active recall, and spaced repetition') && /\.apkg/.test(imp) && /CSV, TSV/.test(imp));
    ok('Import your deck button', (await p.textContent('#import .btn')).trim() === 'Import your deck');
    await p.setViewportSize({ width: 375, height: 800 });
    ok('Fits a phone', await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    ok('No JavaScript errors', errors.length === 0);
    console.log(`${count} homepage checks passed.`);
  } catch (e) { console.error(e); if (errors.length) console.error(errors); process.exitCode = 1; }
  finally { await browser.close(); server.close(); }
})();
