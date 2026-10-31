'use strict';
// Review events: one append-only row per rating (and per undo), with grade source, dispute, timings, interval/due and
// scheduler version, never the written answer. Rows wait on the device when they can't be sent, and go later.
const { chromium } = require('playwright'), assert = require('node:assert/strict'), create = require('../tools/preview-server');
let count = 0; const ok = (n, v) => { assert.ok(v, n); count++; console.log('PASS', n); };
const mock = `(()=>{const user={id:'log-fixture',email:'fixture@example.invalid',created_at:new Date().toISOString(),user_metadata:{first_name:'Ada',deck_offer:'skipped'}};const s={user,access_token:'tok'};
window.__events=[];window.__eventsDown=false;window.__opts=[];
window.supabase={createClient:()=>({auth:{onAuthStateChange(){},async getSession(){return {data:{session:s}}},async getUser(){return {data:{user}}},async updateUser(a){return {data:{user},error:null}},async signOut(){return {}}},
 from(t){if(t==='review_events')return {async upsert(rows,o){window.__opts.push(o);if(window.__eventsDown)return {error:{code:'PGRST205',message:'Could not find the table'}};rows.forEach(r=>{if(!window.__events.some(e=>e.event_id===r.event_id))window.__events.push(r)});return {error:null}}};
  return {select(){return this},eq(){return this},order(){return this},update(){return this},async maybeSingle(){return {data:t==='profiles'?{first_name:'Ada',last_name:'Lee',is_admin:false}:null,error:null}},async upsert(){return {error:null}},then(a){return Promise.resolve({data:[],error:null}).then(a)}}},async rpc(){return {data:null,error:null}}})};})();`;
(async () => {
  const server = create(); await new Promise(r => server.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${server.address().port}`, browser = await chromium.launch(), errors = [];
  try {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 1000 }, reducedMotion: 'reduce' });
    await ctx.route('**/supabase.js', r => r.fulfill({ contentType: 'text/javascript', body: mock }));
    let gradeDown = false;
    await ctx.route('**/api/grade', r => gradeDown ? r.fulfill({ status: 503, contentType: 'application/json', body: '{}' }) : r.fulfill({ contentType: 'application/json', body: JSON.stringify({ rating: 'hard', reasoning: 'Partly there.', model: 'm' }) }));
    await ctx.route('https://formsubmit.co/**', r => r.fulfill({ contentType: 'application/json', body: '{"success":true}' }));
    const p = await ctx.newPage(); p.on('pageerror', e => errors.push(e.message));
    await p.goto(base + '/login'); await p.waitForURL('**/dashboard');
    await p.click('[data-k=bb]'); await p.click('#toQuote'); await p.waitForFunction(() => mode === 'cards');
    const show = id => p.evaluate(id => { deck[pos] = id; progress.open.bb.ids = deck.slice(); resetCard(); render(); }, id);
    const flip = async text => { await p.waitForTimeout(120); await p.fill('#curAnswer', text); await p.click('#reveal'); await p.waitForFunction(() => revealed && !flipping); await p.waitForTimeout(120); };

    // 1. Key-concept match, Knew it.
    await show('1A-005'); await flip('cystiene'); await p.click('#studyNext'); await p.waitForSelector('#studyRatingDialog[data-view=grade]'); await p.waitForTimeout(120);
    await p.click('#gradeAccept'); await p.waitForFunction(() => window.__events.length === 1);
    const e1 = await p.evaluate(() => window.__events[0]);
    ok('A rating writes one event', e1.kind === 'review' && e1.card_key === '1A-005' && e1.grade === 'good' && e1.topic === 'bb');
    ok('Grade source recorded (key-concept match)', e1.source === 'match' && e1.disputed === false);
    ok('Timings: card -> flip -> Next Card -> Save', [e1.ms_to_flip, e1.ms_to_next, e1.ms_in_popup].every(n => Number.isInteger(n) && n >= 100 && n < 60000));
    const sched = await p.evaluate(() => ({ iv: st('1A-005').interval, due: st('1A-005').due, sid: progress.open.bb.sid }));
    ok('Scheduler output and version recorded', e1.interval_days === sched.iv && e1.due === sched.due && e1.scheduler === 'tabiprep-fsrs-2026.10');
    ok('Session id kept with the open session', /^[0-9a-f-]{36}$/.test(e1.session_id) && e1.session_id === sched.sid);
    ok('Written answers never in the log', !JSON.stringify(e1).includes('cystiene') && e1.wrote_before === true);
    ok('Browser-made event id, so a resend isn\'t counted twice', /^[0-9a-f-]{36}$/.test(e1.event_id) && (await p.evaluate(() => window.__opts[0].ignoreDuplicates)) === true && !('user_id' in e1));

    // 2. Rosalind grades Struggled; student disputes, writes in the box, continues.
    await show('1A-018'); await flip('Km goes up and Vmax goes down'); await p.click('#studyNext'); await p.waitForSelector('#studyRatingDialog[data-view=grade]');
    await p.click('#gradeDispute'); await p.fill('#disputeText', 'test'); await p.click('#disputeSend');
    await p.fill('#popupReinforce', 'Competitive inhibition raises Km and leaves Vmax unchanged.'); await p.click('#gradeAccept');
    await p.waitForFunction(() => window.__events.length === 2);
    const e2 = await p.evaluate(() => window.__events[1]);
    ok('Rosalind grade, dispute and adaptive-box writing recorded', e2.grade === 'hard' && e2.source === 'ai' && e2.disputed === true && e2.wrote_after === true && !JSON.stringify(e2).includes('Vmax unchanged'));

    // 3. Undo adds a row; nothing is changed or deleted.
    await p.click('#prev'); await p.waitForTimeout(300);
    ok('Previous (looking back) logs nothing', await p.evaluate(() => window.__events.length === 2));
    await p.click('#lbUndo'); await p.waitForFunction(() => window.__events.length === 3);
    const e3 = await p.evaluate(() => window.__events[2]);
    ok('Undo this grade adds an "undo" event; earlier rows stay', e3.kind === 'undo' && e3.card_key === '1A-018' && (await p.evaluate(() => window.__events[1].grade)) === 'hard');

    // 4. No grade available (grader down): the student rates it.
    gradeDown = true;
    await show('1A-019'); await flip('no clue at all here'); await p.click('#studyNext'); await p.waitForSelector('#studyRatingDialog[data-view=manual]');
    await p.click('#rateRow [data-r=good]'); await p.waitForFunction(() => window.__events.length === 4);
    ok('Self-rating recorded as source "self"', (await p.evaluate(() => window.__events[3])).source === 'self');
    gradeDown = false;

    // 5. Table not there yet: rows wait on the device, then go.
    await p.evaluate(() => { window.__eventsDown = true; });
    await show('1A-005'); await flip('cystiene'); await p.click('#studyNext'); await p.waitForSelector('#studyRatingDialog[data-view=grade]'); await p.click('#gradeAccept');
    await p.waitForFunction(() => TabiReviewLog.pending() === 1);
    ok('Unsent rows are kept on this device', (await p.evaluate(() => window.__events.length)) === 4);
    await p.evaluate(() => { window.__eventsDown = false; }); await p.reload(); await p.waitForFunction(() => typeof TabiReviewLog !== 'undefined');
    await p.waitForFunction(() => TabiReviewLog.pending() === 0 && window.__events.length === 1, null, { timeout: 8000 });
    ok('...and sent on the next visit', (await p.evaluate(() => window.__events[0].card_key)) === '1A-005');
    ok('No JavaScript errors', errors.length === 0);
    console.log(`${count} review log checks passed.`);
  } catch (e) { console.error(e); if (errors.length) console.error(errors); process.exitCode = 1; }
  finally { await browser.close(); server.close(); }
})();
