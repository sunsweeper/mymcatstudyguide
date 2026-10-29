'use strict';
// Sign-up asks why the student began this journey; students without an MCAT date are asked on a timed schedule.
const { chromium } = require('playwright'), assert = require('node:assert/strict'), create = require('../tools/preview-server');
let count = 0; const ok = (n, v) => { assert.ok(v, n); count++; console.log('PASS', n); };
const DAY = 864e5;
const mock = createdAgo => `(()=>{const user={id:'ask-fixture',email:'fixture@example.invalid',created_at:new Date(Date.now()-${createdAgo}).toISOString(),user_metadata:{first_name:'Fixture'}};window.__signUps=[];window.supabase={createClient:()=>({auth:{onAuthStateChange(){},async getSession(){return {data:{session:${createdAgo === null ? 'null' : '{user}'}}}},async getUser(){return {data:{user}}},async updateUser(a){window.__updates=(window.__updates||[]).concat([a]);return {data:{user},error:null}},async signUp(a){window.__signUps.push(a);return {data:{user:null,session:null},error:null}}},from(t){return {select(){return this},eq(){return this},async maybeSingle(){return {data:t==='profiles'?{first_name:'Fixture',is_admin:false}:null,error:null}},async upsert(){return {error:null}}}},async rpc(){return {data:null,error:null}}})};})();`;
(async () => {
  const server = create(); await new Promise(r => server.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${server.address().port}`, browser = await chromium.launch(), errors = [];
  const open = async (createdAgo, path = '/login') => {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 900 } });
    await ctx.route('**/supabase.js', r => r.fulfill({ contentType: 'text/javascript', body: mock(createdAgo) }));
    const p = await ctx.newPage(); p.on('pageerror', e => errors.push(e.message)); await p.goto(base + path); return { ctx, p };
  };
  try {
    // ---- sign-up question ----
    let { ctx, p } = await open(null, '/signup');
    await p.waitForSelector('#aWhy');
    ok('Sign-up shows the journey question and the reminder line', (await p.textContent('#aWhyQ')).includes('what motivated you to become a doctor') && (await p.textContent('#aWhyHint')).includes("we'll remind you of your answer"));
    await p.fill('#aName', 'Ada'); await p.fill('#aLast', 'Lee'); await p.fill('#aEmail', 'ada@example.invalid'); await p.fill('#aPw', 'longenough1');
    await p.check('#aNoDate'); await p.check('#aAge'); await p.check('#aTerms');
    await p.click('#authForm button[type=submit]');
    ok('An answer is required', (await p.textContent('#aMsg')).includes('what brought you to this journey') && await p.evaluate(() => window.__signUps.length) === 0);
    ok('Fixing a field hides the message without moving the button', await p.evaluate(() => { const b = document.querySelector('#authForm button[type=submit]').getBoundingClientRect().top; document.getElementById('aWhy').value = 'x'; document.getElementById('authForm').dispatchEvent(new Event('change')); return Math.abs(document.querySelector('#authForm button[type=submit]').getBoundingClientRect().top - b) < 1 && getComputedStyle(document.getElementById('aMsg')).visibility === 'hidden'; }));
    await p.fill('#aWhy', 'My grandmother’s nurse made the scariest week of our lives feel survivable.');
    await p.click('#authForm button[type=submit]'); await p.waitForFunction(() => window.__signUps.length === 1);
    const sent = await p.evaluate(() => window.__signUps[0].options.data);
    ok('The answer is saved with the account', sent.journey_why.startsWith('My grandmother') && sent.mcat_unscheduled === true);
    await ctx.close();

    // ---- too early: no pop-up ----
    ({ ctx, p } = await open(1 * DAY)); await p.waitForURL('**/dashboard'); await p.waitForTimeout(300);
    ok('No pop-up in the first 72 hours', await p.isHidden('#mcatAskModal'));
    ok('First ask scheduled 72 hours after the account was created', await p.evaluate(() => Math.abs(MCATAsk.state().next - (Date.parse(sbUser.created_at) + 72 * 3600e3)) < 1000));
    await ctx.close();

    // ---- schedule ----
    ({ ctx, p } = await open(4 * DAY)); await p.waitForURL('**/dashboard'); await p.waitForSelector('#mcatAskModal:not([hidden])');
    ok('1st ask after 72 hours, no checkbox', await p.isHidden('#mcatAskMonthRow'));
    const near = (got, ms) => Math.abs(got - Date.now() - ms) < 5000;
    await p.click('#mcatAskNo');
    ok('Not Yet on the 1st ask: next ask in 72 hours', await p.isHidden('#mcatAskModal') && near(await p.evaluate(() => MCATAsk.state().next), 72 * 3600e3));
    await p.evaluate(() => { MCATAsk.state().next = Date.now() - 1; render(); });
    ok('2nd ask shows "Don\'t ask me again for 1 month"', await p.isVisible('#mcatAskMonthRow') && (await p.textContent('#mcatAskMonthRow')).includes("Don't ask me again for 1 month"));
    await p.click('#mcatAskNo');
    ok('2nd ask, box not ticked: one week', near(await p.evaluate(() => MCATAsk.state().next), 7 * DAY));
    await p.evaluate(() => { MCATAsk.state().next = Date.now() - 1; render(); });
    ok('Later asks: no checkbox', await p.isVisible('#mcatAskModal') && await p.isHidden('#mcatAskMonthRow'));
    await p.click('#mcatAskNo');
    ok('Later asks, Not Yet: one month', near(await p.evaluate(() => MCATAsk.state().next), 30 * DAY));
    await p.evaluate(() => { Object.assign(MCATAsk.state(), { n: 1, next: Date.now() - 1 }); render(); });
    await p.check('#mcatAskMonth'); await p.click('#mcatAskNo');
    ok('2nd ask, box ticked: one month', near(await p.evaluate(() => MCATAsk.state().next), 30 * DAY));
    await p.evaluate(() => { MCATAsk.state().next = Date.now() - 1; render(); });
    await p.click('#mcatAskYes');
    ok('Each answer is saved on the account', await p.evaluate(() => window.__updates.length >= 4 && typeof window.__updates.at(-1).data.mcat_ask.next === 'number'));
    ok('Yes opens the MCAT date screen', await p.evaluate(() => mode === 'mcatdate') && await p.isVisible('#dDate'));
    await p.fill('#dDate', await p.evaluate(() => addDays(60))); await p.click('#dateForm button[type=submit]');
    await p.evaluate(() => { MCATAsk.state().next = Date.now() - 1; mode = 'welcome'; render(); });
    ok('With a date saved, never asked again', await p.isHidden('#mcatAskModal'));
    await ctx.close();
    ok('No JavaScript errors', errors.length === 0);
    console.log(`${count} journey and test-date checks passed.`);
  } catch (e) { console.error(e); if (errors.length) console.error(errors); process.exitCode = 1; }
  finally { await browser.close(); server.close(); }
})();
