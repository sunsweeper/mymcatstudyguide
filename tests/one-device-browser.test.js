'use strict';
// One device at a time: two browser profiles (and two tabs) on one account, sharing one fake Supabase account record and progress row.
const { chromium } = require('playwright'), assert = require('node:assert/strict'), create = require('../tools/preview-server');
let count = 0; const ok = (n, v, x = '') => { assert.ok(v, n + ' ' + x); count++; console.log('PASS', n); };
const shared = { offline: false, meta: { first_name: 'Sync', journey_why: 'x'.repeat(20) }, row: null, writes: [], reports: [] };
const mock = `(()=>{const base={id:'one-user',email:'s@example.invalid',created_at:new Date(Date.now()-864e5*10).toISOString()};
const user=async()=>({...base,user_metadata:await window.__meta()});
window.supabase={createClient:()=>({auth:{onAuthStateChange(){},async getSession(){return {data:{session:{user:await user()}}}},async getUser(){return {data:{user:await user()}}},
 async updateUser(a){await window.__setMeta(a.data);return {data:{user:await user()},error:null}},async signOut(){window.__signedOut=(window.__signedOut||0)+1;return {error:null}},async signUp(a){window.__signUp=a;return {data:{user:null,session:null},error:null}}},
from(t){const q={select(){return q},eq(){return q},update(){return q},
 async maybeSingle(){ if(t==='profiles') return {data:{first_name:'Sync',is_admin:false},error:null}; if(t==='progress'){ const r=await window.__row(); return {data:r?{data:r.data}:null,error:null}; } return {data:null,error:null}; },
 async upsert(row){ if(t==='progress'){ const r=await window.__write(window.__name||'?', JSON.parse(JSON.stringify(row))); if(r==='offline') return {error:{message:'Failed to fetch'}}; } return {error:null}; }};return q;},
async rpc(){return {data:null,error:null}}})};})();`;
(async () => {
  const server = create(); await new Promise(r => server.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${server.address().port}`, browser = await chromium.launch(), errors = [];
  const profile = async (name, ua) => {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, userAgent: ua });
    await ctx.route('**/supabase.js', r => r.fulfill({ contentType: 'text/javascript', body: mock }));
    await ctx.route('**/formsubmit.co/**', r => { shared.reports.push(JSON.parse(r.request().postData())); r.fulfill({ status: 200, contentType: 'application/json', body: '{"success":"true"}' }); });
    await ctx.exposeFunction('__meta', () => shared.meta);
    await ctx.exposeFunction('__setMeta', d => { shared.meta = { ...shared.meta, ...d }; });
    await ctx.exposeFunction('__row', () => shared.row);
    await ctx.exposeFunction('__write', (who, row) => { if(shared.offline) return 'offline'; shared.row = row; shared.writes.push(who); return 'ok'; });
    await ctx.addInitScript(n => { window.__name = n; }, name);
    return ctx;
  };
  const open = async (ctx, path = '/login') => { const p = await ctx.newPage(); p.on('pageerror', e => errors.push(e.message)); await p.goto(base + path); return p; };
  const WIN = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36';
  const IPH = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';
  try {
    // Device A signs in first: it becomes the active session without asking.
    const ctxA = await profile('A', WIN), A = await open(ctxA); await A.waitForURL('**/dashboard'); await A.waitForTimeout(800);
    ok('First device signs in without a prompt and becomes the active session', await A.isHidden('#sessionModal') && shared.meta.active_session && shared.meta.active_session.label === 'Chrome on Windows');
    await A.evaluate(() => { rate('1A-001', 'good', undefined, false, {}); save(); }); await A.waitForTimeout(2500);
    ok('The active device saves', !!(shared.row && shared.row.data.cards['1A-001']));

    // Losing the connection: kept on the device, the student is told, and it saves on its own when the connection returns.
    shared.offline = true;
    await A.evaluate(() => { rate('1A-010', 'good', undefined, false, {}); save(); }); await A.waitForTimeout(2500);
    ok('Offline: progress stays on the device and a notice says so', await A.isVisible('#syncErr') && await A.evaluate(() => !!JSON.parse(localStorage.getItem(STORE)).cards['1A-010']) && !shared.row.data.cards['1A-010']);
    shared.offline = false; await A.evaluate(() => window.dispatchEvent(new Event('online'))); await A.waitForTimeout(1500);
    ok('Back online: saves on its own and the notice clears', !!shared.row.data.cards['1A-010'] && await A.isHidden('#syncErr'));
    ok('Each card\'s FSRS schedule reaches the server exactly as on the device', await A.evaluate(() => JSON.stringify(progress.cards['1A-010'])) === JSON.stringify(shared.row.data.cards['1A-010']));
    // Device B signs in: asked to take over; nothing saved from B until it answers.
    const ctxB = await profile('B', IPH), B = await open(ctxB); await B.waitForSelector('#sessionModal:not([hidden])');
    ok('Second device is asked to take over, naming the other device', (await B.textContent('#takeoverText')).includes('stop the session on Chrome on Windows and take over on this device'));
    const writesBefore = shared.writes.filter(w => w === 'B').length;
    await B.evaluate(() => { rate('1A-002', 'good', undefined, false, {}); save(); }); await B.waitForTimeout(2000);
    ok('Nothing is saved from the new device until it takes over', shared.writes.filter(w => w === 'B').length === writesBefore);
    await B.click('#takeoverYes'); await B.waitForTimeout(3500);
    ok('Switching devices: the new device has everything studied on the old one', await B.evaluate(() => ['1A-001', '1A-010'].every(id => !!progress.cards[id])));
    ok('Yes: the new device is the active session and saves', shared.meta.active_session.label === 'Safari on iPhone' && shared.writes.includes('B') && !!shared.row.data.cards['1A-002'] && !!shared.row.data.cards['1A-001']);

    // Old device A: its next click signs it out and shows the referral note. It never saves again.
    const aWrites = shared.writes.filter(w => w === 'A').length;
    await A.evaluate(() => { rate('1A-003', 'good', undefined, false, {}); save(); }); await A.waitForTimeout(2000);
    ok('The taken-over device can no longer save (even before anyone clicks)', shared.writes.filter(w => w === 'A').length === aWrites && !shared.row.data.cards['1A-003']);
    await A.click('body'); await A.waitForSelector('#referView:not([hidden])');
    ok('Old device: signed out, with the referral note', await A.evaluate(() => mode === 'auth' && !sbUser) && (await A.textContent('#referView')).includes('Know anyone who could benefit from TabiPrep.com?') && (await A.textContent('#referView')).includes("you'll both get a discount"));
    ok('Referral link goes to the referral sign-up page', (await A.inputValue('#referUrl')).endsWith('/referral'));
    ok('Referral note says referrers are capped at 23%', (await A.textContent('#referView')).includes('up to 23%'));
    ok('Signed out only on that device (local sign-out), the other device stays signed in', await A.evaluate(() => window.__signedOut === 1) && await B.evaluate(() => !!sbUser));

    // Signing in again on the old device later (its tab still named in the record): asked, not sent back to the login screen.
    await A.evaluate(() => { document.getElementById('sessionModal').hidden = true; }); await A.reload(); await A.waitForSelector('#sessionModal:not([hidden])');
    ok('Signing back in on the taken-over device asks to take over instead of signing out again', await A.isVisible('#takeoverView') && (await A.textContent('#takeoverText')).includes('Safari on iPhone') && await A.evaluate(() => !!sbUser));
    await A.click('#takeoverNo'); await A.waitForTimeout(500);
    ok('...and No leaves the phone as the active session', shared.meta.active_session.label === 'Safari on iPhone');

    // A second tab in B's browser counts as another session.
    const B2 = await open(ctxB); await B2.waitForSelector('#sessionModal:not([hidden])');
    ok('A second tab is treated as another session', (await B2.textContent('#takeoverText')).includes('another tab in this browser'));
    await B2.click('#takeoverNo'); await B2.waitForTimeout(500);
    ok('No: that tab signs out and the other stays active', await B2.evaluate(() => mode === 'auth' && !sbUser) && shared.meta.active_session.label === 'Safari on iPhone');
    await B2.close();

    // An idle session (30+ minutes) is taken over without asking.
    shared.meta.active_session.at = Date.now() - 31 * 60e3;
    const ctxC = await profile('C', WIN), C = await open(ctxC); await C.waitForURL('**/dashboard'); await C.waitForTimeout(1200);
    ok('An idle session is taken over without a prompt', await C.isHidden('#sessionModal') && shared.meta.active_session.label === 'Chrome on Windows');

    // A normal log out clears the active session.
    await C.evaluate(() => logOut()); await C.waitForTimeout(500);
    ok('Logging out clears the active session', shared.meta.active_session === null);

    // Referral sign-up page.
    const ctxR = await profile('R', WIN); await ctxR.route('**/supabase.js', r => r.fulfill({ contentType: 'text/javascript', body: 'window.supabase={createClient:()=>({auth:{onAuthStateChange(){},async getSession(){return {data:{session:null}}},async signUp(a){window.__signUp=a;return {data:{user:null,session:null},error:null}}}})};' }));
    let signupBody = null; await ctxR.route('**/api/signup', r => { signupBody = JSON.parse(r.request().postData()); r.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' }); });
    const R = await open(ctxR, '/referral'); await R.waitForSelector('#referralBanner');
    ok('Referral page: sign-up with the 23% banner', (await R.textContent('#referralBanner')).includes('23% discount for you and whoever sent this to you if you sign up today.'));
    await R.fill('#aCode', 'Sarah2028'); await R.fill('#aName', 'Nia'); await R.fill('#aLast', 'Park'); await R.fill('#aEmail', 'nia@example.invalid'); await R.fill('#aPw', 'longenough1');
    await R.check('#aNoDate'); await R.fill('#aWhy', 'I want to be the doctor who listens first.'); await R.check('#aAge'); await R.check('#aTerms');
    await R.click('#authForm [type=submit]');
    ok('Referrer details are required', (await R.textContent('#aMsg')).includes('who referred you') && !signupBody);
    await R.fill('#rFirst', 'Aaron'); await R.fill('#rLast', 'Walch'); await R.fill('#rEmail', 'friend@example.invalid');
    await R.click('#authForm [type=submit]'); await R.waitForTimeout(1000);
    const d = signupBody;
    ok('The referrer is saved with the new account', d.referred_by.first_name === 'Aaron' && d.referred_by.email === 'friend@example.invalid');
    const rep = shared.reports.find(x => x._subject === 'New TabiPrep sign-up (referral)');
    ok('The owner gets an email with both people and the 23% cap note', rep && rep['New user email'] === 'nia@example.invalid' && rep['Referrer email'] === 'friend@example.invalid' && /capped at 23%/.test(rep.Note));
    ok('No JavaScript errors', errors.length === 0, errors.join(' | '));
    console.log(`${count} one-device and referral checks passed.`);
  } catch (e) { console.error(e); if (errors.length) console.error(errors); process.exitCode = 1; }
  finally { await browser.close(); server.close(); }
})();
