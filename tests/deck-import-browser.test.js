'use strict';
// Deck import: Anki packages and CSV/text files become private imported cards, studied from "My imported cards"
// (or mixed into All topics), marked "Import" bottom left, without Raise Your Hand, Report or Dispute.
const { chromium } = require('playwright'), assert = require('node:assert/strict'), path = require('path'), create = require('../tools/preview-server');
let count = 0; const ok = (n, v) => { assert.ok(v, n); count++; console.log('PASS', n); };
const F = n => path.join(__dirname, 'fixtures', 'decks', n);
const mock = `(()=>{const user={id:'deck-fixture',email:'fixture@example.invalid',created_at:new Date().toISOString(),user_metadata:{first_name:'Ada'}};const s={user,access_token:'tok'};window.__decks=[];window.__u=[];window.__deckErr=null;
const decks=()=>{const q={del:false,select(){return q},order(){return q},insert(r){window.__decks.push({...r,created_at:new Date().toISOString()});return Promise.resolve({error:null})},delete(){q.del=true;return q},
 eq(k,v){if(q.del){window.__decks=window.__decks.filter(d=>d[k]!==v);return Promise.resolve({error:null})}return q},then(a,b){return Promise.resolve({data:window.__deckErr?null:JSON.parse(JSON.stringify(window.__decks)),error:window.__deckErr}).then(a,b)}};return q};
window.supabase={createClient:()=>({auth:{onAuthStateChange(){},async getSession(){return {data:{session:s}}},async getUser(){return {data:{user}}},async updateUser(a){window.__u.push(a);Object.assign(user.user_metadata,a.data);return {data:{user},error:null}},async signOut(){return {}}},
 from(t){if(t==='user_decks')return decks();return {select(){return this},eq(){return this},update(){return this},async maybeSingle(){return {data:t==='profiles'?{first_name:'Ada',last_name:'Lee',is_admin:false}:null,error:null}},async upsert(){return {error:null}}}},async rpc(){return {data:null,error:null}}})};})();`;
(async () => {
  const server = create(); await new Promise(r => server.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${server.address().port}`, browser = await chromium.launch(), errors = [];
  try {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 1000 }, reducedMotion: 'reduce' });
    await ctx.route('**/supabase.js', r => r.fulfill({ contentType: 'text/javascript', body: mock }));
    const grades = [];
    await ctx.route('**/api/grade', r => { grades.push(r.request().postDataJSON()); r.fulfill({ contentType: 'application/json', body: '{"rating":"good","reasoning":"Yes."}' }); });
    const p = await ctx.newPage(); p.on('pageerror', e => errors.push(e.message));
    await p.goto(base + '/login'); await p.waitForURL('**/dashboard');

    // Optional sign-up step
    await p.waitForSelector('#deckOffer:not([hidden])');
    ok('After sign-up: optional "Have your own flashcards?" step', (await p.textContent('#deckOfferTitle')) === 'Have your own flashcards?' && (await p.textContent('#deckOffer .study-eyebrow')).includes('OPTIONAL'));
    await p.click('#deckOfferNo');
    ok('"Not now" closes it and remembers, on the account', await p.isHidden('#deckOffer') && await p.evaluate(() => window.__u.some(x => x.data.deck_offer === 'skipped')));
    await p.evaluate(() => { render(); render(); });
    ok('It isn\'t asked again', await p.isHidden('#deckOffer'));
    ok('No imported tile before importing', (await p.locator('.topic[data-k=mine]').count()) === 0);

    // Account: import an Anki package
    await p.evaluate(() => openAccount());
    ok('Account page has the imported decks section', await p.isVisible('#deckSec') && (await p.textContent('#acctDeckH')) === 'Your imported decks');
    await p.setInputFiles('#deckFile', F('basic.apkg'));
    await p.waitForSelector('#deckPreview');
    const pv = await p.textContent('#deckPreview');
    ok('Anki package read: cloze notes split per cloze, empty backs skipped', /4 cards/.test(pv) && /1 skipped/.test(pv));
    ok('Deck name defaults to the file name', (await p.inputValue('#deckName')) === 'basic');
    await p.fill('#deckName', 'Bio extras');
    await p.click('#deckSave');
    await p.waitForFunction(() => window.__decks.length === 1 && USER_CARDS.length === 4);
    const stored = await p.evaluate(() => window.__decks[0]);
    ok('Saved to the student\'s own decks table', stored.name === 'Bio extras' && /^[a-z0-9]{6}$/.test(stored.code) && stored.cards.length === 4);
    const all = JSON.stringify(stored.cards);
    ok('Card HTML sanitized: no scripts, links, handlers or images', !/<script|onclick|href|<img|<a\b/i.test(all) && all.includes('<b>mitochondrion</b>') && all.includes('[image]') && all.includes('Krebs'));
    ok('Cloze cards: one per blank, hint shown', stored.cards[2][0].includes('[…]') && stored.cards[2][0].includes('cytoplasm') && stored.cards[3][0].includes('[where?]') && stored.cards[3][1].includes('<b>cytoplasm</b>') && stored.cards[3][1].includes('Extra: no oxygen needed'));
    ok('Success message', (await p.textContent('#deckSec')).includes('Imported 4 cards into “Bio extras”'));
    ok('Deck listed with its card count', (await p.textContent('.deck-row')).includes('Bio extras') && (await p.textContent('.deck-row')).includes('4 cards'));

    // Other formats
    const parse = async f => { await p.setInputFiles('#deckFile', F(f)); await p.waitForFunction(() => document.querySelector('#deckPreview') || /couldn|isn’t|No cards|newer Anki/.test((document.querySelector('#deckSec .auth-msg') || {}).textContent || '')); const t = await p.textContent('#deckSec'); if(await p.isVisible('#deckCancel')) await p.click('#deckCancel'); return t; };
    ok('Modern Anki package (.anki21b, zstd) read', /2 cards/.test(await parse('modern.apkg')));
    ok('Old-format stub explains how to re-export', /newer Anki/.test(await parse('stub-only.apkg')));
    ok('Anki "Notes in Plain Text" read (note type and tags columns skipped)', /2 cards/.test(await parse('plain.txt')));
    const csv = await p.evaluate(async () => { const r = await TabiDecks.parseText('front,back\n"Hello, world","A ""quoted"" answer\nwith a new line"\nSecond,Two\n', 'simple.csv'); return r.cards; });
    ok('CSV: header row skipped, quotes, commas and new lines handled', csv.length === 2 && csv[0][0] === 'Hello, world' && csv[0][1] === 'A "quoted" answer<br>with a new line');
    ok('Plain text is escaped, not run as HTML', (await p.evaluate(() => TabiDecks.parseText('<img src=x onerror=alert(1)>,<b onclick=x()>bold</b>', 'x.csv'))).cards[0].join('') === '[image]<b>bold</b>');

    // Dashboard tile and study
    await p.evaluate(() => goHome());
    ok('Dashboard: "My imported cards" tile', await p.isVisible('.topic[data-k=mine]') && (await p.textContent('.topic[data-k=mine]')).includes('4 cards from your own decks'));
    ok('Imported cards don\'t change the TabiPrep totals', await p.evaluate(() => CARDS.every(c => !isImported(c[3])) && !poolFor('all').some(c => isImported(c[3]))));
    await p.click('.topic[data-k=mine]'); await p.click('#toQuote'); await p.waitForFunction(() => mode === 'cards');
    ok('Imported session only has imported cards', await p.evaluate(() => deck.every(k => isImported(idOf(k))) && deck.length === 4) && new URL(p.url()).pathname === '/study/my-cards');
    ok('"Import" bottom left; deck name where the classification goes', (await p.textContent('#card .import-tag')) === 'Import' && (await p.textContent('#card .foot .cat')) === 'Bio extras');
    const tag = await p.evaluate(() => { const t = getComputedStyle(document.querySelector('#card .import-tag')), c = getComputedStyle(document.querySelector('#card .foot .cat')), r = document.querySelector('#card .import-tag').getBoundingClientRect(), k = document.querySelector('#card').getBoundingClientRect();
      return { same: t.fontSize === c.fontSize && t.fontWeight === c.fontWeight && t.fontFamily === c.fontFamily && t.textTransform === c.textTransform, left: r.left - k.left < 60, bottom: k.bottom - r.bottom < 60 }; });
    ok('"Import" uses the classification\'s size and font, in the bottom-left corner', tag.same && tag.left && tag.bottom);
    ok('No Raise Your Hand or Report on imported cards', await p.isHidden('#raiseHand') && await p.isHidden('#studyReport'));
    await p.fill('#curAnswer', 'something'); await p.click('#reveal'); await p.waitForFunction(() => revealed && !flipping); await p.click('#studyNext');
    await p.waitForSelector('#studyRatingDialog[data-view=grade]');
    ok('Rosalind grades imported cards (by card id only)', grades.length === 1 && /^U[a-z0-9]{6}-\d+$/.test(grades[0].key) && Object.keys(grades[0]).sort().join() === 'answer,key');
    ok('No Dispute on imported cards (it would email the card)', await p.isHidden('#gradeDispute'));
    await p.click('#gradeAccept');
    await p.waitForFunction(() => Object.keys(progress.cards).some(k => isImported(idOf(k))));
    ok('Rating recorded by the normal engine', true);

    // House cards unchanged
    await p.evaluate(() => goHome()); await p.click('[data-k=bb]'); await p.click('#toQuote'); await p.waitForFunction(() => mode === 'cards');
    ok('TabiPrep cards look unchanged: no Import tag, Raise Your Hand shown', (await p.locator('#card .import-tag').count()) === 0 && await p.isVisible('#raiseHand'));

    // Shuffle into All topics
    ok('Not mixed into All topics by default', await p.evaluate(() => !poolFor('all').some(c => isImported(c[3]))));
    await p.evaluate(() => openAccount()); await p.check('#deckMix');
    ok('Turned on: imported cards shuffle into All topics', await p.evaluate(() => progress.mixImports === true && poolFor('all').filter(c => isImported(c[3])).length === 4 && poolFor('bb').every(c => !isImported(c[3]))));
    ok('Setting carried between devices', await p.evaluate(() => mergeProgress([{ cards:{} }, { cards:{}, mixImports:true }]).mixImports === true));

    // Delete
    await p.click('[data-deldeck]');
    ok('Delete asks to confirm', (await p.textContent('[data-deldeck]')) === 'Confirm delete' && (await p.evaluate(() => window.__decks.length)) === 1);
    await p.click('[data-deldeck]'); await p.waitForFunction(() => window.__decks.length === 0 && USER_CARDS.length === 0);
    ok('Deck deleted; its open session closed', await p.evaluate(() => !progress.open.mine));
    await p.evaluate(() => goHome());
    ok('Tile gone with no decks', (await p.locator('.topic[data-k=mine]').count()) === 0);

    // Before the table exists in Supabase
    await p.evaluate(async () => { window.__deckErr = { code:'PGRST205', message:'Could not find the table' }; await TabiDecks.reload(); openAccount(); });
    ok('Not set up yet: a clear message, no import button', (await p.textContent('#deckSec')).includes('isn’t switched on yet') && (await p.locator('#deckFile').count()) === 0);
    ok('No JavaScript errors', errors.length === 0);
    console.log(`${count} deck import checks passed.`);
  } catch (e) { console.error(e); if (errors.length) console.error(errors); process.exitCode = 1; }
  finally { await browser.close(); server.close(); }
})();
