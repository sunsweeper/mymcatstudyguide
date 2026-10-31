'use strict';
// /api/signup: private beta. Invite code checked on the server; only the first 25 redeem it; confirmation email sent here.
const assert = require('node:assert/strict'), handler = require('../api/signup');
let count = 0; const ok = (n, v) => { assert.ok(v, n); count++; console.log('PASS', n); };
const call = async body => { let status = 200, out; const res = { setHeader(){}, status(n){ status = n; return this; }, json(x){ out = x; return this; } };
  await handler({ method: 'POST', headers: { host: 'www.tabiprep.com', origin: 'https://www.tabiprep.com' }, body }, res); return { status, out }; };
const good = (over = {}) => ({ code: 'Sarah2028', email: 'new@example.invalid', password: 'longenough1', first_name: 'Nia', last_name: 'Park', mcat_unscheduled: true, journey_why: 'I want to be the doctor who listens first.', accepted_terms: true, age_confirmed: true, ...over });
(async () => {
  const realFetch = global.fetch, realLog = console.log, logs = [];
  let users = [], created = [], links = 0, mails = [];
  global.fetch = async (url, o = {}) => {
    const J = (x, status = 200) => ({ ok: status < 300, status, json: async () => x });
    if(url.includes('/auth/v1/admin/users?')) return J({ users });
    if(url.endsWith('/auth/v1/admin/users') && o.method === 'POST'){ const b = JSON.parse(o.body); created.push(b); users.push({ email: b.email, user_metadata: b.user_metadata, email_confirmed_at: null }); return J({ id: 'u' + users.length }); }
    if(url.includes('/auth/v1/admin/generate_link')){ links++; return J({ action_link: 'https://kwvcflbzocmalhlekxjv.supabase.co/auth/v1/verify?token=abc&type=magiclink&redirect_to=https://www.tabiprep.com/login' }); }
    if(url.includes('api.resend.com')){ mails.push(JSON.parse(o.body)); return J({ id: 'm' }); }
    throw new Error('unexpected ' + url);
  };
  console.log = (...a) => logs.push(a.join(' '));
  try {
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    let r = await call(good()); ok('Not configured -> 503', r.status === 503);
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'sb_secret_x'; process.env.RESEND_API_KEY = 're_x';
    r = await call(good({ code: 'wrong' })); ok('Wrong code refused, nothing created', r.status === 403 && /private beta/.test(r.out.error) && created.length === 0);
    r = await call(good({ code: '  sarah2028 ' })); ok('Right code (any case, extra spaces) creates the account', r.status === 200 && created.length === 1 && created[0].email_confirm === false);
    ok('Account carries the sign-up answers and beta number', created[0].user_metadata.journey_why.startsWith('I want') && created[0].user_metadata.beta_code === true && created[0].user_metadata.beta_number === 1);
    ok('Confirmation email sent in TabiPrep design, link back to /login', mails.length === 1 && mails[0].subject === 'Confirm your TabiPrep account' && mails[0].html.includes('Confirm my email') && mails[0].html.includes('redirect_to=https://www.tabiprep.com/login'));
    r = await call(good()); ok('Same email again -> already exists', r.status === 409 && created.length === 1);
    for(let i = 2; i <= 25; i++) users.push({ email: `b${i}@example.invalid`, user_metadata: { beta_code: true } });
    r = await call(good({ email: 'late@example.invalid' })); ok('After 25 redemptions the code stops working', r.status === 403 && /beta is full/.test(r.out.error) && created.length === 1);
    users.push({ email: 'old@example.invalid', user_metadata: {} });
    ok('Accounts made before the beta code don\'t count toward 25', users.filter(u => u.user_metadata.beta_code).length === 25);
    process.env.BETA_LIMIT = '30'; r = await call(good({ email: 'more@example.invalid' })); ok('Limit can be raised without code changes (BETA_LIMIT)', r.status === 200 && created.at(-1).user_metadata.beta_number === 26); delete process.env.BETA_LIMIT;
    r = await call(good({ email: 'x@example.invalid', journey_why: 'short' })); ok('Journey answer still required on the server', r.status === 400);
    r = await call(good({ email: 'y@example.invalid', mcat_unscheduled: false, mcat_date: 'nope' })); ok('MCAT date checked on the server', r.status === 400);
    const before = mails.length; r = await call({ resend: true, email: 'new@example.invalid' }); ok('Resend works for an unconfirmed beta account', r.status === 200 && mails.length === before + 1);
    r = await call({ resend: true, email: 'new@example.invalid' }); ok('Resends are throttled', r.status === 429);
    r = await call({ resend: true, email: 'nobody@example.invalid' }); ok('Resend gives the same answer for unknown emails', r.status === 200);
    process.env.BETA_LIMIT = '40';
    r = await call(good({ email: 'old-page@example.invalid' })); ok('No course sent (older page): MCAT, recorded on the account', r.status === 200 && JSON.stringify(created.at(-1).user_metadata.courses) === '["mcat"]');
    r = await call({ code: 'Sarah2028', email: 'es@example.invalid', password: 'longenough1', first_name: 'Ana', last_name: 'Ruiz', accepted_terms: true, age_confirmed: true, course: 'spanish' });
    ok('Spanish sign-up: no MCAT date or journey needed; course recorded; no MCAT fields stored', r.status === 200 && JSON.stringify(created.at(-1).user_metadata.courses) === '["spanish"]' && !('mcat_date' in created.at(-1).user_metadata) && !('journey_why' in created.at(-1).user_metadata));
    r = await call(good({ email: 'z@example.invalid', course: 'french' })); ok('Unknown course refused, pointing at the course field', r.status === 400 && r.out.field === 'aCourse');
    r = await call(good({ email: 'w@example.invalid', code: 'nope' })); ok('Bad code points at the code field', r.status === 403 && r.out.field === 'aCode');
    r = await call(good({ email: 'new@example.invalid' })); ok('Existing email points at the email field', r.status === 409 && r.out.field === 'aEmail');
    delete process.env.BETA_LIMIT;
    ok('Logs carry no emails or answers', logs.every(l => !l.includes('@') && !l.includes('listens')));
  } finally { global.fetch = realFetch; console.log = realLog; }
  console.log(`${count} sign-up API checks passed.`);
})().catch(e => { console.error(e); process.exitCode = 1; });
