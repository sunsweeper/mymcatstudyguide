'use strict';
// Sign-up by course: course picker first (preselected from the course page), then code, name, email, password,
// then that course's own questions. Problems are called out on the field itself.
const { chromium } = require('playwright'), assert = require('node:assert/strict'), create = require('../tools/preview-server');
let count = 0; const ok = (n, v) => { assert.ok(v, n); count++; console.log('PASS', n); };
const noSession = 'window.supabase={createClient:()=>({auth:{onAuthStateChange(){},async getSession(){return {data:{session:null}}},async getUser(){return {data:{user:null}}}},from(){return {select(){return this},eq(){return this},async maybeSingle(){return {data:null}},async upsert(){return {}}}},async rpc(){return {}}})};';
const asUser = courses => `(()=>{const user={id:'u1',email:'s@example.invalid',created_at:new Date().toISOString(),user_metadata:{first_name:'Ana',deck_offer:'x',courses:${JSON.stringify(courses)}}};const s={user,access_token:'t'};
window.supabase={createClient:()=>({auth:{onAuthStateChange(){},async getSession(){return {data:{session:s}}},async getUser(){return {data:{user}}},async updateUser(){return {data:{user},error:null}},async signOut(){return {}}},
from(){return {select(){return this},eq(){return this},order(){return this},update(){return this},async maybeSingle(){return {data:null,error:null}},async upsert(){return {error:null}},then(a){return Promise.resolve({data:[],error:null}).then(a)}}},async rpc(){return {data:null,error:null}}})};})();`;
(async () => {
  const server = create(); await new Promise(r => server.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${server.address().port}`, browser = await chromium.launch(), errors = [];
  try {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 1000 } });
    await ctx.route('**/supabase.js', r => r.fulfill({ contentType: 'text/javascript', body: noSession }));
    let sent = [], reply = { status: 200, body: { ok: true } };
    await ctx.route('**/api/signup', r => { sent.push(JSON.parse(r.request().postData())); r.fulfill({ status: reply.status, contentType: 'application/json', body: JSON.stringify(reply.body) }); });
    const p = await ctx.newPage(); p.on('pageerror', e => errors.push(e.message));
    await p.goto(base + '/signup?course=spanish'); await p.waitForSelector('#aCourse');
    ok('From the Spanish page: Spanish already picked', (await p.inputValue('#aCourse')) === 'spanish');
    ok('Course list shows every course', (await p.locator('#aCourse option').allTextContents()).join('|') === 'Choose a course|MCAT|Spanish (beta)');
    const order = await p.evaluate(() => ['aCourse', 'aCode', 'aName', 'aEmail', 'aPw', 'aAge'].map(id => document.getElementById(id).getBoundingClientRect().top));
    ok('Order: course, promo/beta code, name, email, password, then the rest', order.every((t, i) => i === 0 || t > order[i - 1]));
    ok('Spanish: no MCAT questions', await p.isHidden('#aMcat') && await p.isHidden('#aWhy'));
    await p.selectOption('#aCourse', 'mcat');
    ok('MCAT: its own questions appear below the account details', await p.isVisible('#aMcat') && await p.isVisible('#aWhy') && await p.evaluate(() => document.getElementById('aMcat').getBoundingClientRect().top > document.getElementById('aPw').getBoundingClientRect().top));
    await p.selectOption('#aCourse', 'spanish');
    await p.fill('#aCode', 'Sarah2028'); await p.fill('#aName', 'Ana'); await p.fill('#aLast', 'Ruiz'); await p.fill('#aEmail', 'ana@example'); await p.fill('#aPw', 'longenough1'); await p.check('#aAge'); await p.check('#aTerms');
    await p.click('#authForm button[type=submit]');
    ok('Bad email: red message box, red outline and a note on the email field', await p.evaluate(() => {
      const m = document.getElementById('aMsg'), box = document.getElementById('aEmail').closest('.field');
      return getComputedStyle(m).backgroundColor !== 'rgba(0, 0, 0, 0)' && box.classList.contains('bad') && box.querySelector('.field-err').textContent.includes('valid email') && document.activeElement.id === 'aEmail';
    }) && sent.length === 0);
    await p.fill('#aEmail', 'ana@example.invalid'); await p.fill('#aPw', 'short');
    await p.click('#authForm button[type=submit]');
    ok('Short password: says how many characters it has', (await p.textContent('#aMsg')).includes('you have 5') && await p.evaluate(() => document.getElementById('aPw').closest('.field').classList.contains('bad')));
    await p.fill('#aPw', 'longenough1');
    reply = { status: 403, body: { error: 'That promo or beta code isn’t valid. Check it and try again.', field: 'aCode' } };
    await p.click('#authForm button[type=submit]'); await p.waitForFunction(() => document.querySelector('#aCode')?.closest('.field').classList.contains('bad'));
    ok('Server says the code is wrong: the code field is called out', (await p.textContent('#aMsg')).includes('code isn’t valid'));
    ok('...and what was typed is still there', (await p.inputValue('#aName')) === 'Ana' && (await p.inputValue('#aPw')) === 'longenough1' && (await p.inputValue('#aCourse')) === 'spanish');
    reply = { status: 200, body: { ok: true } };
    await p.click('#authForm button[type=submit]'); await p.waitForTimeout(500);
    const s = sent.at(-1);
    ok('Spanish sign-up sends the course and no MCAT answers', s.course === 'spanish' && !('mcat_date' in s) && !('journey_why' in s));
    await p.goto(base + '/signup'); await p.waitForSelector('#aCourse');
    await p.click('#authForm button[type=submit]');
    ok('No course picked: asks for it first', (await p.textContent('#aMsg')).includes('choose the course') && await p.evaluate(() => document.getElementById('aCourse').closest('.field').classList.contains('bad')));
    // Course pages send people to their own sign-up
    const links = async path => { const q = await browser.newPage(); await q.goto(base + path); const h = await q.$$eval('a[href^="/signup"]', a => a.map(x => x.getAttribute('href'))); await q.close(); return h; };
    ok('Spanish page sign-up buttons pick Spanish', (await links('/spanish')).every(h => h === '/signup?course=spanish'));
    ok('MCAT page sign-up buttons pick MCAT', (await links('/mcat')).every(h => h === '/signup?course=mcat'));
    // An account signed up only for Spanish isn't dropped into the MCAT app
    const ctx2 = await browser.newContext(); await ctx2.route('**/supabase.js', r => r.fulfill({ contentType: 'text/javascript', body: asUser(['spanish']) }));
    const q = await ctx2.newPage(); await q.goto(base + '/dashboard'); await q.waitForURL('**/spanish', { timeout: 15000 });
    ok('Spanish-only account goes to the Spanish page', new URL(q.url()).pathname === '/spanish');
    await ctx2.close();
    const ctx3 = await browser.newContext(); await ctx3.route('**/supabase.js', r => r.fulfill({ contentType: 'text/javascript', body: asUser(['mcat']) }));
    const m = await ctx3.newPage(); await m.goto(base + '/dashboard'); await m.waitForTimeout(1500);
    ok('MCAT account stays in the MCAT app', new URL(m.url()).pathname === '/dashboard');
    await ctx3.close();
    ok('No JavaScript errors', errors.length === 0);
    console.log(`${count} sign-up by course checks passed.`);
  } catch (e) { console.error(e); if (errors.length) console.error(errors); process.exitCode = 1; }
  finally { await browser.close(); server.close(); }
})();
