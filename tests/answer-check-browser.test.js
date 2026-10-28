'use strict';
// After flipping: a full key-concept match suggests "Got it" without calling the AI; anything else is sent to /api/grade.
// The AI's reasoning is shown, the student can flag it, and the rating popup marks the suggestion but the student's tap decides.
const { chromium } = require('playwright'), assert = require('node:assert/strict');
const create = require('../tools/preview-server');
const session = signedIn => `(()=>{const user={id:'check-fixture',email:'fixture@example.invalid',user_metadata:{first_name:'Fixture'}};const s=${signedIn}?{user,access_token:'fixture-token'}:null;
 window.supabase={createClient:()=>({auth:{onAuthStateChange(){},async getSession(){return {data:{session:s}}},async getUser(){return {data:{user:s?user:null}}}},from(t){return {select(){return this},eq(){return this},async maybeSingle(){return {data:t==='profiles'?{first_name:'Fixture',is_admin:false}:null,error:null}},async upsert(){return {error:null}}}},async rpc(){return {data:null,error:null}}})};})();`;
let count = 0; const check = (name, v) => { assert.ok(v, name); count++; console.log('PASS', name); };
(async () => {
  const server = create(); await new Promise(r => server.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${server.address().port}`, browser = await chromium.launch(), errors = [];
  try {
    for(const width of [390, 1280]){
      const ctx = await browser.newContext({ viewport: { width, height: 1000 }, reducedMotion: 'reduce' });
      await ctx.route('**/supabase.js', r => r.fulfill({ contentType: 'text/javascript', body: session(true) }));
      const aiCalls = [], flags = [];
      await ctx.route('**/api/grade', async r => { const b = r.request().postDataJSON(); aiCalls.push({ ...b, auth: r.request().headers().authorization });
        r.fulfill({ contentType: 'application/json', body: JSON.stringify({ rating: 'hard', label: 'struggled', reasoning: 'You named Km increasing but said Vmax drops; with a competitive inhibitor Vmax is unchanged.', model: 'test-model' }) }); });
      await ctx.route('https://formsubmit.co/**', r => { flags.push(r.request().postDataJSON()); r.fulfill({ contentType: 'application/json', body: '{"success":true}' }); });
      const p = await ctx.newPage(); p.on('pageerror', e => errors.push(e.message));
      await p.goto(base + '/login'); await p.waitForURL('**/dashboard'); await p.click('[data-k=bb]'); await p.click('#toQuote'); await p.waitForFunction(() => mode === 'cards');
      const show = id => p.evaluate(id => { deck[pos] = id; progress.open.bb.ids = deck.slice(); resetCard(); render(); }, id);
      const flip = async text => { await p.fill('#curAnswer', text); await p.click('#reveal'); await p.waitForFunction(() => revealed && !flipping); };

      // 1. Full key-concept match: suggested Got it, no AI call.
      await show('1A-005'); await flip('cystiene');
      await p.waitForSelector('#answerCheck.rated-good');
      check(`${width}: matched answer suggests Got it`, (await p.textContent('#answerCheck')).includes('Suggested: Got it'));
      check('Matched answer does not call the AI', aiCalls.length === 0);
      check('No flag button on a key-concept match', await p.locator('#answerCheck .check-flag').count() === 0);
      await p.click('#studyNext');
      check('Rating popup marks the suggestion', await p.getAttribute('#rateRow [data-r=good]', 'class').then(c => c.includes('suggested')) && (await p.textContent('#studyRatingDescription')).includes('Suggested: Got it'));
      check('Suggested rating has focus', await p.evaluate(() => document.activeElement.dataset.r === 'good'));
      await p.click('#rateRow [data-r=good]'); await p.waitForFunction(() => st('1A-005'));
      check('Tapping the suggestion records it through the engine', await p.evaluate(() => st('1A-005').history.at(-1).r === 'good'));

      // 2. Not a clear match: AI judges, reasoning shown, flag available.
      await show('1A-018'); await flip('Km goes up and Vmax goes down');
      await p.waitForSelector('#answerCheck.rated-hard');
      check('Unmatched answer goes to the AI with the session token', aiCalls.length === 1 && aiCalls[0].key === '1A-018' && aiCalls[0].answer === 'Km goes up and Vmax goes down' && aiCalls[0].auth === 'Bearer fixture-token');
      const panel = await p.textContent('#answerCheck');
      check('AI panel shows source, suggestion and reasoning', panel.includes('AI CHECK') && panel.includes('Suggested: Struggled') && panel.includes('Vmax is unchanged'));
      await p.click('#answerCheck .check-flag'); await p.fill('#checkFlagNote', 'Vmax drop was a typo, I meant unchanged.');
      await p.click('#answerCheck [data-flag=send]'); await p.waitForSelector('#answerCheck .check-flagged');
      const f = flags.at(-1);
      check('Flag delivers card, answer, AI verdict, reasoning and note', f['Card ID'] === '1A-018' && f['Student answer'] === 'Km goes up and Vmax goes down' && f['AI rating'] === 'Struggled' && /unchanged/.test(f['AI reasoning']) && /typo/.test(f['Student note']) && f['Flagged by'] === 'Fixture');
      check('Flag button replaced by confirmation', await p.locator('#answerCheck .check-flag').count() === 0);
      await p.click('#studyNext');
      check('Popup suggests Struggled', await p.getAttribute('#rateRow [data-r=hard]', 'class').then(c => c.includes('suggested')));
      await p.click('#rateRow [data-r=good]'); await p.waitForFunction(() => st('1A-018'));
      check('Student override wins: their tap is what the engine records', await p.evaluate(() => st('1A-018').history.at(-1).r === 'good'));

      // 3. Same card and answer again (e.g. after refresh): cached, no second AI charge.
      await p.reload(); await p.waitForFunction(() => mode === 'cards');
      await show('1A-018'); await flip('Km goes up and Vmax goes down'); await p.waitForSelector('#answerCheck.rated-hard');
      check('Repeat answer reuses the saved verdict', aiCalls.length === 1);

      // 4. Comparison cards confirm even a full match with the AI.
      await show('1A-010'); await flip('cofactor inorganic metal ion, coenzyme organic from a vitamin');
      await p.waitForSelector('#answerCheck.rated-hard');
      check('Comparison card sends a full match to the AI', aiCalls.at(-1).key === '1A-010');

      // 5. Active Recall off and no answer: no check.
      await show('1B-005'); await p.uncheck('#activeRecallSwitch'); await p.click('#reveal'); await p.waitForFunction(() => revealed && !flipping);
      check('No answer, no check panel', await p.isHidden('#answerCheck'));
      await ctx.close();
    }
    // 6. Signed out: clear message, never calls the API.
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 1000 }, reducedMotion: 'reduce' });
    let calls = 0; await ctx.route('**/supabase.js', r => r.fulfill({ contentType: 'text/javascript', body: session(false) }));
    await ctx.route('**/api/grade', r => { calls++; r.fulfill({ status: 500, body: '{}' }); });
    const p = await ctx.newPage(); p.on('pageerror', e => errors.push(e.message));
    await p.goto(base + '/index.html'); await p.evaluate(() => { pick('bb'); start(true); deck[pos] = '1A-018'; resetCard(); render(); });
    await p.fill('#curAnswer', 'no idea'); await p.click('#reveal'); await p.waitForSelector('#answerCheck.unavailable');
    check('Signed out: asks to sign in, no API call', (await p.textContent('#answerCheck')).includes('Sign in') && calls === 0);
    await p.click('#studyNext'); check('Signed out: popup has no suggestion', await p.locator('#rateRow .suggested').count() === 0);
    await ctx.close();
    check('No JavaScript errors', errors.length === 0);
    console.log(`${count} answer-check checks passed (mocked AI, sign-in and report delivery).`);
  } catch(e){ console.error(e); if(errors.length) console.error(errors); process.exitCode = 1; }
  finally { await browser.close(); server.close(); }
})();
