'use strict';
// Account page: MCAT date, "why you began this journey", and study settings, all editable in one place.
const { chromium } = require('playwright'), assert = require('node:assert/strict'), create = require('../tools/preview-server');
let count = 0; const ok = (n, v) => { assert.ok(v, n); count++; console.log('PASS', n); };
const mock = `(()=>{const user={id:'acct-fixture',email:'fixture@example.invalid',created_at:new Date(Date.now()-3600e3).toISOString(),user_metadata:{first_name:'Ada',journey_why:'My little brother spent a month in the NICU.'}};window.__u=[];window.supabase={createClient:()=>({auth:{onAuthStateChange(){},async getSession(){return {data:{session:{user}}}},async getUser(){return {data:{user}}},async updateUser(a){window.__u.push(a);return {data:{user:{...user,user_metadata:{...user.user_metadata,...a.data}}},error:null}}},from(t){return {select(){return this},eq(){return this},update(){return this},async maybeSingle(){return {data:t==='profiles'?{first_name:'Ada',last_name:'Lee',is_admin:false}:null,error:null}},async upsert(){return {error:null}}}},async rpc(){return {data:null,error:null}}})};})();`;
(async () => {
  const server = create(); await new Promise(r => server.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${server.address().port}`, browser = await chromium.launch(), errors = [];
  try {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 1000 } });
    await ctx.route('**/supabase.js', r => r.fulfill({ contentType: 'text/javascript', body: mock }));
    const p = await ctx.newPage(); p.on('pageerror', e => errors.push(e.message));
    await p.goto(base + '/login'); await p.waitForURL('**/dashboard');
    await p.evaluate(() => { progress.testDate = addDays(60); openAccount(); });
    ok('Account shows the MCAT date', (await p.inputValue('#acctDate')) === await p.evaluate(() => progress.testDate));
    ok('Account shows the sign-up answer', (await p.inputValue('#acctWhy')).startsWith('My little brother'));
    ok('Account shows the study settings', await p.isChecked('#setMand') && await p.isVisible('#setTips') && await p.isVisible('#setDark') && await p.isChecked('#setEncourage') && (await p.inputValue('#setView')) === 'q');
    const newDate = await p.evaluate(() => addDays(90));
    await p.fill('#acctDate', newDate); await p.click('#acctDateForm [type=submit]');
    ok('Saving the date stays on Account and updates the countdown', await p.evaluate(d => mode === 'account' && progress.testDate === d, newDate) && /90\s*Days Until Your MCAT/.test(await p.textContent('#countdown')) && (await p.textContent('#screen')).includes('MCAT date saved.'));
    await p.fill('#acctWhy', 'I want to be the doctor who explains things clearly.'); await p.click('#acctWhyForm [type=submit]');
    ok('Saving the answer updates the account', await p.evaluate(() => window.__u.some(x => x.data.journey_why === 'I want to be the doctor who explains things clearly.')) && (await p.textContent('#screen')).includes('Your answer is saved.'));
    await p.uncheck('#setMand'); ok('Mandatory Response off', await p.evaluate(() => mandatoryOn() === false));
    await p.check('#setMand'); ok('Mandatory Response back on', await p.evaluate(() => mandatoryOn() === true));
    await p.uncheck('#setDark'); ok('Night mode off: daylight background', await p.evaluate(() => document.documentElement.getAttribute('data-bg') === 'light'));
    await p.uncheck('#setEncourage'); await p.waitForFunction(() => window.__u.some(x => x.data.encourage_opt_out === true));
    ok('Encouragement emails can be turned off', true);
    await p.selectOption('#setView', 'mix'); ok('Card order saved', await p.evaluate(() => progress.view === 'mix'));
    ok('No JavaScript errors', errors.length === 0);
    console.log(`${count} account settings checks passed.`);
  } catch (e) { console.error(e); if (errors.length) console.error(errors); process.exitCode = 1; }
  finally { await browser.close(); server.close(); }
})();
