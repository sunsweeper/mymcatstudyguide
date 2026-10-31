'use strict';
// Oct 31 audit: Previous must not reverse saved grades; Previous Answers never blank; copy matches the mode;
// Grade My Answer label; demo Raise Your Hand matches the live feature; Active Recall vs Mandatory Response explained.
const { chromium } = require('playwright'), assert = require('node:assert/strict'), create = require('../tools/preview-server');
let count = 0; const ok = (n, v) => { assert.ok(v, n); count++; console.log('PASS', n); };
const mock = `(()=>{const user={id:'audit-fixture',email:'a@example.invalid',created_at:new Date().toISOString(),user_metadata:{first_name:'Ada',deck_offer:'x'}};const s={user,access_token:'tok'};
window.supabase={createClient:()=>({auth:{onAuthStateChange(){},async getSession(){return {data:{session:s}}},async getUser(){return {data:{user}}},async updateUser(){return {data:{user},error:null}},async signOut(){return {}}},
 from(t){return {select(){return this},eq(){return this},order(){return this},update(){return this},async maybeSingle(){return {data:null,error:null}},async upsert(){return {error:null}},then(a){return Promise.resolve({data:[],error:null}).then(a)}}},async rpc(){return {data:null,error:null}}})};})();`;
(async () => {
  const server = create(); await new Promise(r => server.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${server.address().port}`, browser = await chromium.launch(), errors = [];
  try {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 1000 }, reducedMotion: 'reduce' });
    await ctx.route('**/supabase.js', r => r.fulfill({ contentType: 'text/javascript', body: mock }));
    await ctx.route('**/api/grade', r => r.fulfill({ status: 503, body: '{}' }));   // no AI grade: the student rates
    const p = await ctx.newPage(); p.on('pageerror', e => errors.push(e.message));
    await p.goto(base + '/login'); await p.waitForURL('**/dashboard');
    await p.click('[data-k=bb]'); await p.click('#toQuote'); await p.waitForFunction(() => mode === 'cards');
    // Grade three cards through the real buttons: Known, Struggled (with writing), Didn't know (with writing).
    const grade = async (r, wrote) => {
      await p.fill('#curAnswer', 'My answer from memory ' + r);
      ok(`Typed answer: the button says Grade My Answer (${r})`, (await p.textContent('#studyNext')).includes('Grade My Answer'));
      await p.click('#reveal'); await p.waitForFunction(() => revealed && !flipping);
      ok(`After the flip the copy doesn't say "rate yourself" (${r})`, !(await p.textContent('#recallMessage')).includes('rate yourself') && (await p.textContent('#recallMessage')).includes('Grade My Answer'));
      await p.click('#studyNext'); await p.waitForSelector('#rateRow:not([hidden]) [data-r]');
      await p.click(`#rateRow [data-r=${r}]`);
      if(r !== 'good'){ await p.fill('#popupReinforce', wrote); await p.click('#gradeAccept'); }
      await p.waitForFunction(() => document.getElementById('studyRatingModal').hidden);
    };
    await grade('good'); await grade('hard', 'Writing out the answer in full sentences.'); await grade('again', 'Writing out the whole answer again here.');
    const snap = () => p.evaluate(() => { const c = Object.values(progress.cards); return { n: c.length, rs: c.map(s => s.history.at(-1).r).sort().join(','), sessions: progress.stats.sessions }; });
    const before = await snap();
    ok('Three cards graded: Known, Struggled, Didn\'t know', before.n === 3 && before.rs === 'again,good,hard');
    await p.click('#prev'); await p.waitForSelector('#lookBack:not([hidden])');
    ok('Previous opens a look-back of the last graded card, with its grade and what was written', (await p.textContent('#lbGrade')).includes("Didn't know") && (await p.textContent('#lbYou')).includes('Writing out the whole answer'));
    await p.click('#lbEarlier');
    ok('Earlier card: the Struggled one', (await p.textContent('#lbGrade')).includes('Struggled') && await p.isHidden('#lbUndoWrap'));
    await p.click('#lbBack');
    await p.click('#prev'); await p.click('#lbBack');   // press Previous twice, as in the audit
    ok('Previous twice changes nothing', JSON.stringify(await snap()) === JSON.stringify(before));
    await p.reload(); await p.waitForFunction(() => typeof progress !== 'undefined' && Object.keys(progress.cards).length > 0);
    ok('...and still nothing after a reload', JSON.stringify(await snap()) === JSON.stringify(before));
    ok('Undo is explicit and explained', (await p.textContent('#lbUndoWrap')).includes('Takes this grade back out of your stats'));
    // Previous Answers: never blank
    await p.evaluate(() => { goHome(); pick('bb'); start(true); deck[pos] = '1A-030'; progress.open.bb.ids = deck.slice(); resetCard(); render(); });
    await p.click('#studyAnswers');
    ok('Previous Answers on a new card says there are none yet', (await p.textContent('#prevList')).includes('No saved answers for this card yet'));
    await p.click('#closeStudyDrawer');
    await p.fill('#curAnswer', 'Just written'); await p.click('#reveal'); await p.waitForFunction(() => revealed && !flipping);
    await p.click('#studyAnswers');
    ok('After flipping, Previous Answers shows what was just written', (await p.textContent('#prevList')).includes('Just written'));
    await p.click('#closeStudyDrawer');
    // No typed answer: Rate My Recall
    await p.evaluate(() => { resetCard(); deck[pos] = '1A-031'; progress.open.bb.ids = deck.slice(); resetCard(); render(); });
    await p.uncheck('#activeRecallSwitch'); await p.click('#reveal'); await p.waitForFunction(() => revealed && !flipping);
    ok('Nothing typed: the button says Rate My Recall', (await p.textContent('#studyNext')).includes('Rate My Recall'));
    ok('Active Recall vs Mandatory Response explained in one sentence', (await p.textContent('#recallRelation')).includes('Mandatory Response keeps writing required on cards you\'ve missed'));
    await p.evaluate(() => { goHome(); show('stats'); }).catch(() => {});
    // Demo (homepage / sample cards)
    for(const path of ['/mcat', '/sample-cards']){
      const d = await browser.newPage(); d.on('pageerror', e => errors.push(path + ': ' + e.message));
      await d.goto(base + path); await d.waitForSelector('#demoHelp');
      ok(`${path}: Raise Your Hand is not labelled "planned"`, (await d.textContent('#demoHelp')).trim() === '✋ Raise Your Hand' && !(await d.content()).includes('Raise Your Hand (planned)'));
      await d.click('#demoHelp');
      ok(`${path}: demo explains the live feature`, (await d.textContent('body')).includes('right twice in a row'));
      ok(`${path}: demo Next button uses the app's label`, /Rate My Recall|Grade My Answer/.test(await d.textContent('#demoNext')));
      await d.close();
    }
    ok('No JavaScript errors', errors.length === 0);
    console.log(`${count} audit checks passed.`);
  } catch (e) { console.error(e); if (errors.length) console.error(errors); process.exitCode = 1; }
  finally { await browser.close(); server.close(); }
})();
