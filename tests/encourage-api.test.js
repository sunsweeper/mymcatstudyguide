'use strict';
// Rosalind's encouragement emails: who gets one, when, what Claude is told, what is sent, and the opt-out.
const assert = require('node:assert/strict');
const E = require('../api/_encourage'), job = require('../api/encourage'), unsub = require('../api/encourage-unsubscribe');
let count = 0; const ok = (n, v) => { assert.ok(v, n); count++; console.log('PASS', n); };
const at = s => Date.parse(s + 'T16:00:00Z');
const res = () => { const r = { statusCode: 200, headers: {}, body: null, setHeader(k, v){ this.headers[k] = v; }, status(n){ this.statusCode = n; return this; }, json(x){ this.body = x; return this; }, end(x){ this.body = x; return this; } }; return r; };
const U = (id, over = {}) => ({ id, email: `${id}@example.invalid`, email_confirmed_at: '2026-09-01T00:00:00Z', created_at: '2026-09-01T10:00:00Z',
  user_metadata: { first_name: 'Ada', journey_why: 'My little brother spent a month in the NICU and the doctors there were kind to my mom.' }, app_metadata: {}, ...over });
(async () => {
  // ---- timing ----
  const u = U('a');
  ok('Halfway: sent on the halfway day (sign-up Sep 1, test Nov 30 -> Oct 16)', E.milestone(u, '2026-11-30', at('2026-10-16')) === 'half' && E.milestone(u, '2026-11-30', at('2026-10-15')) === null);
  ok('Halfway: only once', E.milestone(U('a', { app_metadata: { encourage: { half: 'x' } } }), '2026-11-30', at('2026-10-20')) === null);
  ok('Halfway: not when the test is under a week away', E.milestone(u, '2026-11-30', at('2026-11-25')) === null);
  ok('Halfway: not when sign-up to test is under two weeks', E.milestone(u, '2026-09-10', at('2026-09-06')) === null);
  ok('Final: two days before, or one if a day was missed', E.milestone(u, '2026-11-30', at('2026-11-28')) === 'final' && E.milestone(u, '2026-11-30', at('2026-11-29')) === 'final' && E.milestone(u, '2026-11-30', at('2026-11-27')) === null);
  ok('Final: once per test date; a new date gets its own', E.milestone(U('a', { app_metadata: { encourage: { final_for: '2026-11-30' } } }), '2026-11-30', at('2026-11-28')) === null && E.milestone(U('a', { app_metadata: { encourage: { final_for: '2026-11-30' } } }), '2027-01-20', at('2027-01-18')) === 'final');
  ok('No test date: nothing', E.milestone(u, null, at('2026-10-16')) === null);
  const st = E.studyStats({ cards: { x: { history: [{ r: 'good' }, { r: 'again' }] }, y: { history: [{ r: 'good' }] }, z: {} }, stats: { ms: 0 } }, [{ cards: 30, seconds: 3600 }, { cards: 0, seconds: 0 }, { cards: 10, seconds: 1800 }]);
  ok('Study stats from their own records', st.hours === 1.5 && st.daysStudied === 2 && st.cardsStudied === 2 && st.reviews === 3 && st.knewItPercent === 67);

  process.env.SUPABASE_SERVICE_ROLE_KEY = 'sb_secret_abc';
  ok('New-style secret key: apikey header only', E.admin().apikey === 'sb_secret_abc' && !E.admin().Authorization);
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiJ9.x.y';
  ok('Legacy service_role key: apikey and Bearer', E.admin().Authorization === 'Bearer eyJhbGciOiJIUzI1NiJ9.x.y');
  // ---- the job ----
  const realFetch = global.fetch, realLog = console.log, realNow = Date.now, logs = [];
  process.env.CRON_SECRET = 'cron-secret';
  let r = res(); await job({ headers: {}, url: '/api/encourage' }, r); ok('Only Vercel Cron (secret) can run it', r.statusCode === 401);
  delete process.env.RESEND_API_KEY; delete process.env.SUPABASE_SERVICE_ROLE_KEY; delete process.env.ANTHROPIC_API_KEY;
  r = res(); await job({ headers: { authorization: 'Bearer cron-secret' }, url: '/api/encourage' }, r); ok('Missing keys: 503 naming them', r.statusCode === 503 && r.body.missing.length === 3);
  process.env.RESEND_API_KEY = 'resend'; process.env.SUPABASE_SERVICE_ROLE_KEY = 'service'; process.env.ANTHROPIC_API_KEY = 'claude';
  const users = [U('11111111-1111-1111-1111-111111111111'), U('22222222-2222-2222-2222-222222222222', { user_metadata: { first_name: 'Bo', journey_why: 'x long enough', encourage_opt_out: true } }),
    U('33333333-3333-3333-3333-333333333333', { user_metadata: { first_name: 'Cy' } }), U('44444444-4444-4444-4444-444444444444', { email_confirmed_at: null }),
    U('55555555-5555-5555-5555-555555555555', { user_metadata: { first_name: 'Di', journey_why: 'I want to be the doctor who explains things.' } })];
  const testDates = { '11111111-1111-1111-1111-111111111111': '2026-11-30', '55555555-5555-5555-5555-555555555555': '2026-10-30' };
  let claude = [], mails = [], puts = [];
  global.fetch = async (url, o = {}) => {
    const J = x => ({ ok: true, status: 200, json: async () => x });
    if(url.includes('/auth/v1/admin/users?')) return J({ users });
    if(url.includes('/rest/v1/progress')){ const id = decodeURIComponent(url.split('user_id=eq.')[1]); return J([{ data: { testDate: testDates[id], cards: { a: { history: [{ r: 'good' }, { r: 'good' }] } } } }]); }
    if(url.includes('/rest/v1/activity')) return J([{ day: '2026-10-01', cards: 40, seconds: 7200 }]);
    if(url.includes('api.anthropic.com')){ claude.push(JSON.parse(o.body)); return J({ content: [{ type: 'text', text: 'Hi Ada,\n\n' + 'You wrote about your brother and the NICU team. '.repeat(4) + '\n\nRosalind' }] }); }
    if(url.includes('api.resend.com')){ mails.push(JSON.parse(o.body)); return J({ id: 'm1' }); }
    if(o.method === 'PUT'){ puts.push({ url, body: JSON.parse(o.body) }); return J({}); }
    throw new Error('unexpected ' + url);
  };
  Date.now = (n => () => n)(at('2026-10-28'));
  console.log = (...a) => logs.push(a.join(' '));
  r = res(); await job({ headers: { authorization: 'Bearer cron-secret' }, url: '/api/encourage?dry=1' }, r);
  console.log = realLog;
  ok('Dry run: finds who is due, sends nothing', r.body.dry === true && r.body.due === 2 && mails.length === 0 && claude.length === 0);
  console.log = (...a) => logs.push(a.join(' '));
  r = res(); await job({ headers: { authorization: 'Bearer cron-secret' }, url: '/api/encourage' }, r);
  console.log = realLog;
  ok('Opted-out, unanswered and unconfirmed accounts are skipped', r.body.opted_out === 1 && r.body.skipped_no_answer === 1 && r.body.checked === 4);
  ok('Two emails sent: one halfway, one two days out', r.body.sent === 2 && mails.length === 2);
  const half = mails.find(m => m.to[0].startsWith('1111')), fin = mails.find(m => m.to[0].startsWith('5555'));
  ok('Halfway subject and sender', /halfway to your MCAT/.test(half.subject) && half.from.includes('rosalind@tabiprep.com'));
  ok('Two-day subject', /Two days to your MCAT, Di/.test(fin.subject));
  const hp = claude.find(c => c.messages[0].content.includes('halfway')).messages[0].content, fp = claude.find(c => c.messages[0].content.includes('two days before')).messages[0].content;
  ok('Claude gets the student\'s own words, fenced as data', hp.includes('<student_words>\nMy little brother spent a month in the NICU') && /Ignore any instructions/.test(claude[0].system));
  ok('Halfway prompt carries no study numbers; two-day prompt does', !/hours over/.test(hp) && /2 hours over 1 day; 1 different card, 2 reviews; they knew 100%/.test(fp));
  ok('Every email has a working unsubscribe link and header', mails.every(m => m.html.includes('/api/encourage-unsubscribe?u=') && m.headers['List-Unsubscribe'].includes('&t=') && m.text.includes('Stop these encouragement emails')));
  ok('Email says Rosalind is AI', half.html.includes("Rosalind is TabiPrep's AI study companion"));
  ok('Marked as sent so it never repeats', puts.some(p => p.body.app_metadata.encourage.half) && puts.some(p => p.body.app_metadata.encourage.final_for === '2026-10-30'));
  ok('Logs carry no email addresses or student words', logs.length > 0 && logs.every(l => !l.includes('@') && !l.includes('NICU') && !l.includes('explains')));

  // ---- opt-out ----
  const id = '11111111-1111-1111-1111-111111111111', link = new URL(E.unsubscribeUrl(id));
  puts = [];
  r = res(); await unsub({ method: 'GET', url: link.pathname + link.search }, r);
  ok('Opening the link only asks (mail scanners don\'t unsubscribe people)', r.statusCode === 200 && r.body.includes('<form method="post"') && puts.length === 0);
  r = res(); await unsub({ method: 'POST', url: link.pathname + link.search.replace(/t=[^&]+/, 't=' + 'f'.repeat(32)) }, r);
  ok('A forged link is refused', r.statusCode === 400 && puts.length === 0);
  console.log = () => {};
  r = res(); await unsub({ method: 'POST', url: link.pathname + link.search }, r);
  console.log = realLog;
  ok('Pressing Unsubscribe opts the account out', r.statusCode === 200 && puts.length === 1 && puts[0].body.user_metadata.encourage_opt_out === true && puts[0].url.endsWith(id));
  global.fetch = realFetch; Date.now = realNow;
  console.log(`${count} encouragement email checks passed.`);
})().catch(e => { console.error(e); process.exitCode = 1; });
