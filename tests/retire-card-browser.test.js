'use strict';
// Retire a card: offered after the second correct answer; retired cards leave every study pool, come back once
// for review two days before the MCAT, and are listed on the account page to put back one at a time, by selection, or all.
const { chromium } = require('playwright'), assert = require('node:assert/strict'), create = require('../tools/preview-server');
let count = 0; const ok = (n, v) => { assert.ok(v, n); count++; console.log('PASS', n); };
const mock = `(()=>{const user={id:'retire-fixture',email:'fixture@example.invalid',created_at:new Date().toISOString(),user_metadata:{first_name:'Ada'}};const s={user,access_token:'t'};window.supabase={createClient:()=>({auth:{onAuthStateChange(){},async getSession(){return {data:{session:s}}},async getUser(){return {data:{user}}},async updateUser(a){return {data:{user:{...user,user_metadata:{...user.user_metadata,...a.data}}},error:null}},async signOut(){return {}}},from(t){return {select(){return this},eq(){return this},update(){return this},async maybeSingle(){return {data:t==='profiles'?{first_name:'Ada',last_name:'Lee',is_admin:false}:null,error:null}},async upsert(){return {error:null}}}},async rpc(){return {data:null,error:null}}})};})();`;
(async () => {
  const server = create(); await new Promise(r => server.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${server.address().port}`, browser = await chromium.launch(), errors = [];
  try {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 1000 }, reducedMotion: 'reduce' });
    await ctx.route('**/supabase.js', r => r.fulfill({ contentType: 'text/javascript', body: mock }));
    await ctx.route('**/api/grade', r => r.fulfill({ contentType: 'application/json', body: '{"rating":"good","reasoning":"ok"}' }));
    const p = await ctx.newPage(); p.on('pageerror', e => errors.push(e.message));
    await p.goto(base + '/login'); await p.waitForURL('**/dashboard');
    await p.click('[data-k=bb]'); await p.click('#toQuote'); await p.waitForFunction(() => mode === 'cards');
    const show = id => p.evaluate(id => { deck[pos] = id; progress.open.bb.ids = deck.slice(); resetCard(); render(); }, id);
    const grade = async () => { await p.fill('#curAnswer', 'cystiene'); await p.click('#reveal'); await p.waitForFunction(() => revealed && !flipping); await p.click('#studyNext'); await p.waitForSelector('#studyRatingDialog[data-view=grade]'); };

    // First correct answer: no retire option yet.
    await show('1A-005'); await grade();
    ok('First correct answer: retire not offered', await p.isHidden('#gradeRetire'));
    await p.click('#gradeAccept'); await p.waitForFunction(() => st('1A-005'));
    // Second correct answer: offered.
    await show('1A-005'); await grade();
    ok('Second correct answer: "No longer show me this card" offered', await p.isVisible('#gradeRetire') && (await p.textContent('#gradeRetire')) === 'No longer show me this card');
    const before = await p.evaluate(() => st('1A-005').history.length);
    await p.click('#gradeRetire');
    ok('Retiring records the grade and retires the card', await p.evaluate(b => st('1A-005').history.length === b + 1 && st('1A-005').history.at(-1).r === 'good' && !!progress.retired['1A-005'], before));
    ok('Retired card leaves the study pool but still counts on the dashboard', await p.evaluate(() => !poolFor('bb').some(c => c[3] === '1A-005') && poolAll('bb').some(c => c[3] === '1A-005') && isRetired('1A-005')));

    // Two days before the MCAT: back once, then gone again after the review.
    const ret = await p.evaluate(() => {
      progress.testDate = addDays(2); progress.retiredPassFor = null;
      ['1A-005', '1A-005' + REV].forEach(k => { if(st(k)){ st(k).due = addDays(30); st(k).last = addDays(-5); } });
      const inPool = poolFor('bb').some(c => c[3] === '1A-005');
      prepareRetiredReturn();
      const due = st('1A-005').due === today();
      st('1A-005').last = today();
      const goneAfter = !poolFor('bb').some(c => c[3] === '1A-005');
      progress.testDate = addDays(10);
      const notYet = !poolFor('bb').some(c => c[3] === '1A-005');
      return { inPool, due, goneAfter, notYet, once: progress.retiredPassFor };
    });
    ok('Within 2 days of the MCAT the retired card returns to the pool', ret.inPool);
    ok('Its review is made due today, once per test date', ret.due && !!ret.once);
    ok('After that review it leaves the pool again', ret.goneAfter);
    ok('Earlier than 2 days out it stays retired', ret.notYet);
    ok('Retired list is kept when progress merges between devices', await p.evaluate(() => !!mergeProgress([{ cards:{} }, { cards:{}, retired:{ 'X':'2026-01-01' } }]).retired));

    // Account page list.
    await p.evaluate(() => { progress.retired = { '1A-005':'2026-10-20', '1A-006':'2026-10-21', '1A-007':'2026-10-22' }; save(); openAccount(); });
    ok('Account page shows the retired count', (await p.textContent('#acctRetH')) === 'Retired cards (3)');
    await p.click('#retToggle');
    ok('List opens with each card clickable', (await p.locator('.retired-row').count()) === 3 && await p.isVisible('.retired-row summary'));
    await p.click('.retired-row:nth-child(1) summary');
    ok('Clicking a card shows its answer', await p.isVisible('.retired-row:nth-child(1) .bm-a'));
    await p.click('.ret-one[data-id="1A-007"]');
    ok('Put back one card', await p.evaluate(() => !progress.retired['1A-007'] && Object.keys(progress.retired).length === 2) && (await p.textContent('#acctRetH')) === 'Retired cards (2)');
    ok('Put selected back starts disabled', await p.isDisabled('#retPutSel'));
    await p.check('.ret-pick[data-id="1A-006"]');
    await p.click('#retPutSel');
    ok('Put selected back', await p.evaluate(() => !progress.retired['1A-006'] && !!progress.retired['1A-005']));
    await p.click('#retPutAll');
    ok('Put all back', await p.evaluate(() => Object.keys(progress.retired).length === 0) && (await p.textContent('#acctRetH')) === 'Retired cards (0)');
    ok('No JavaScript errors', errors.length === 0);
    console.log(`${count} retire-card checks passed.`);
  } catch (e) { console.error(e); if (errors.length) console.error(errors); process.exitCode = 1; }
  finally { await browser.close(); server.close(); }
})();
