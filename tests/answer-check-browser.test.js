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
    let p;
    for(const width of [390, 1280]){
      const ctx = await browser.newContext({ viewport: { width, height: 1000 }, reducedMotion: 'reduce' });
      await ctx.route('**/supabase.js', r => r.fulfill({ contentType: 'text/javascript', body: session(true) }));
      const aiCalls = [], flags = [];
      await ctx.route('**/api/grade', async r => { const b = r.request().postDataJSON(); aiCalls.push({ ...b, auth: r.request().headers().authorization });
        r.fulfill({ contentType: 'application/json', body: JSON.stringify({ rating: 'hard', label: 'struggled', reasoning: 'You named Km increasing but said Vmax drops; with a competitive inhibitor Vmax is unchanged.', model: 'test-model' }) }); });
      await ctx.route('https://formsubmit.co/**', r => { flags.push(r.request().postDataJSON()); p && p.evaluate(() => window.__flags = (window.__flags || 0) + 1).catch(() => {}); r.fulfill({ contentType: 'application/json', body: '{"success":true}' }); });
      p = await ctx.newPage(); p.on('pageerror', e => errors.push(e.message));
      await p.goto(base + '/login'); await p.waitForURL('**/dashboard'); await p.click('[data-k=bb]'); await p.click('#toQuote'); await p.waitForFunction(() => mode === 'cards');
      const show = id => p.evaluate(id => { deck[pos] = id; progress.open.bb.ids = deck.slice(); resetCard(); render(); }, id);
      const flip = async text => { await p.fill('#curAnswer', text); await p.click('#reveal'); await p.waitForFunction(() => revealed && !flipping); };

      // 1. Full key-concept match: graded Got it without calling the AI; accepting records it.
      await show('1A-005'); await flip('cystiene'); await p.click('#studyNext');
      await p.waitForSelector('#studyRatingDialog[data-view=grade]');
      check(`${width}: matched answer shows the Got it verdict`, (await p.textContent('#studyRatingTitle')) === 'Good job, you knew that one.' && (await p.textContent('#studyRatingEyebrow')) === 'GRADED');
      check('Matched answer does not call the AI', aiCalls.length === 0);
      check('Verdict view: Save and Next Card and Dispute Grading shown, rating buttons hidden', await p.isVisible('#gradeAccept') && await p.isVisible('#gradeDispute') && await p.isHidden('#rateRow'));
      check('Next Card has focus', await p.evaluate(() => document.activeElement.id === 'gradeAccept'));
      await p.click('#gradeAccept'); await p.waitForFunction(() => st('1A-005'));
      check('Accepting records the system grade through the engine', await p.evaluate(() => st('1A-005').history.at(-1).r === 'good'));

      // 2. Not a clear match: the AI grades it; reasoning in the popup; Dispute sends it for review but the grade stands.
      await show('1A-018'); await flip('Km goes up and Vmax goes down'); await p.click('#studyNext');
      await p.waitForSelector('#studyRatingDialog[data-view=grade]');
      check('Unmatched answer went to the AI with the session token', aiCalls.length === 1 && aiCalls[0].key === '1A-018' && aiCalls[0].answer === 'Km goes up and Vmax goes down' && aiCalls[0].auth === 'Bearer fixture-token');
      check('AI verdict and reasoning in the popup', (await p.textContent('#studyRatingEyebrow')) === 'GRADED BY ROSALIND' && (await p.textContent('#studyRatingTitle')) === 'Close. You were partly there.' && (await p.textContent('#studyRatingDescription')).includes('Vmax is unchanged'));
      await p.click('#gradeDispute');
      check('Dispute view: note box and Send, no rating buttons', await p.isHidden('#rateRow') && await p.isVisible('#disputeText') && await p.isVisible('#disputeSend'));
      await p.fill('#disputeText', 'Vmax drop was a typo, I meant unchanged.'); await p.click('#disputeSend');
      check('After a dispute: back to the grade with the adaptive learning box', await p.isVisible('#popupReinforce') && (await p.textContent('#studyRatingDescription')).startsWith('Dispute sent'));
      await p.fill('#popupReinforce', 'Competitive inhibition raises Km and leaves Vmax unchanged.'); await p.click('#gradeAccept'); await p.waitForFunction(() => st('1A-018'));
      check('The system grade is what the engine records, with the writing, and a new card is up', await p.evaluate(() => st('1A-018').history.at(-1).r === 'hard' && /Vmax unchanged/.test(st('1A-018').history.at(-1).w) && curKey !== '1A-018' && !pendingR));
      await p.waitForFunction(n => window.__flags >= n, 1).catch(() => {});
      const f = flags.at(-1);
      check('Dispute delivers card, answer, grade, reasoning and note', f && f['Card ID'] === '1A-018' && f['Student answer'] === 'Km goes up and Vmax goes down' && f['Graded as'] === 'Struggled' && !('Student says' in f) && /unchanged/.test(f['Grade reasoning']) && /typo/.test(f['Student note']) && f['Disputed by'] === 'Fixture' && /^AI/.test(f['Graded by']));

      // 3. Same card and answer again (e.g. after refresh): saved grade reused, no second AI charge.
      await p.reload(); await p.waitForFunction(() => mode === 'cards');
      await show('1A-018'); await flip('Km goes up and Vmax goes down'); await p.click('#studyNext'); await p.waitForSelector('#studyRatingDialog[data-view=grade]');
      check('Repeat answer reuses the saved grade', aiCalls.length === 1);
      await p.click('#closeStudyRating');

      // 4. Comparison cards confirm even a full match with the AI.
      await show('1A-010'); await flip('cofactor inorganic metal ion, coenzyme organic from a vitamin'); await p.click('#studyNext');
      await p.waitForSelector('#studyRatingDialog[data-view=grade]');
      check('Comparison card sends a full match to the AI', aiCalls.at(-1).key === '1A-010');
      await p.click('#closeStudyRating');

      // 5. Active Recall off and no answer: plain three-button popup.
      await show('1B-005'); await p.uncheck('#activeRecallSwitch'); await p.click('#reveal'); await p.waitForFunction(() => revealed && !flipping); await p.click('#studyNext');
      check('No answer: manual rating popup', (await p.getAttribute('#studyRatingDialog', 'data-view')) === 'manual' && await p.isVisible('#rateRow [data-r=good]') && await p.isHidden('#gradeActions'));
      await p.click('#closeStudyRating');
      await ctx.close();
    }
    // 6. Signed out: clear message, never calls the API.
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 1000 }, reducedMotion: 'reduce' });
    let calls = 0; await ctx.route('**/supabase.js', r => r.fulfill({ contentType: 'text/javascript', body: session(false) }));
    await ctx.route('**/api/grade', r => { calls++; r.fulfill({ status: 500, body: '{}' }); });
    p = await ctx.newPage(); p.on('pageerror', e => errors.push(e.message));
    await p.goto(base + '/index.html'); await p.evaluate(() => { pick('bb'); start(true); deck[pos] = '1A-018'; resetCard(); render(); });
    await p.fill('#curAnswer', 'no idea'); await p.click('#reveal'); await p.waitForFunction(() => revealed && !flipping); await p.waitForTimeout(300); await p.click('#studyNext');
    await p.waitForSelector('#studyRatingDialog[data-view=manual]');
    check('Signed out: manual popup explains sign-in, no API call', (await p.textContent('#studyRatingDescription')).includes('Sign in') && calls === 0);
    await ctx.close();
    // 7. /mcat demo: five server-picked MCAT cards, same graded popup, no sign-in.
    {
      const ctx = await browser.newContext({ viewport: { width: 1280, height: 1000 }, reducedMotion: 'reduce' });
      const demoCalls = []; await ctx.route('**/api/grade', r => { demoCalls.push(r.request().postDataJSON()); r.fulfill({ contentType: 'application/json', body: JSON.stringify({ rating: 'again', reasoning: 'Classical pairs two stimuli; you described consequences for both.' }) }); });
      const h = await ctx.newPage(); h.on('pageerror', e => errors.push(e.message)); await h.goto(base + '/mcat'); await h.waitForFunction(() => cards.length === 5);
      const first = await h.evaluate(() => cards.find(c => !c.ai) ? (() => { const i = cards.findIndex(c => !c.ai); [cards[0], cards[i]] = [cards[i], cards[0]]; render(); return cards[0].a; })() : cards[0].a);
      await h.fill('#recallDraft', first); await h.click('#demoReveal'); await h.waitForTimeout(250); await h.click('#demoNext');
      await h.waitForSelector('#tour-ratings[data-view=grade]');
      check('Demo: matched answer graded Got it without the AI', (await h.textContent('#ratingModalTitle')) === 'Good job, you knew that one.' && demoCalls.length === 0);
      await h.click('#demoGradeAccept'); await h.waitForFunction(() => pos === 1);
      check('Demo: accepting moves to the next card', true);
      await h.evaluate(() => { pos = 3; flipped = false; render(); });
      await h.fill('#recallDraft', 'both use rewards'); await h.click('#demoReveal'); await h.waitForTimeout(250); await h.click('#demoNext');
      await h.waitForSelector('#tour-ratings[data-view=grade]');
      check('Demo: unmatched answer graded by the AI, no sign-in needed', demoCalls.length === 1 && demoCalls[0].key === await h.evaluate(() => cards[3].id) && (await h.textContent('#ratingModalEyebrow')) === 'GRADED BY ROSALIND' && (await h.textContent('#ratingModalTitle')) === 'Not this time.');
      check('Demo: graded view hides the three rating buttons', await h.isHidden('#tour-ratings .rating-modal-options'))
      await h.click('#demoGradeDispute');
      check('Demo: Dispute shows a note box, not ratings', await h.isVisible('#demoDisputeText') && await h.isHidden('#tour-ratings .rating-modal-options'));
      await h.fill('#demoDisputeText', 'Operant is about consequences.'); await h.click('#demoDisputeSend');
      check('Demo: the system grade stands (Didn\'t know -> reinforcement)', await h.evaluate(() => pendingRating === 'didnt'));
      await h.click('#startTour'); for(let i = 0; i < 8; i++) await h.click('#tourForward');
      check('Demo: tour still completes', await h.locator('.tour-popover').count() === 0);
      await ctx.close();
    }
    check('No JavaScript errors', errors.length === 0);
    console.log(`${count} answer-check checks passed (mocked AI, sign-in and report delivery).`);
  } catch(e){ console.error(e); if(errors.length) console.error(errors); process.exitCode = 1; }
  finally { await browser.close(); server.close(); }
})();
