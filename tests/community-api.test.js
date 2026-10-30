'use strict';
// /api/community: Raise Your Hand questions/answers, qualification (card right twice in a row), notifications, owner
// moderation and the 3-day Rosalind draft. Supabase, Claude and Resend are faked in memory; nothing real is called.
const assert = require('node:assert/strict');
let count = 0; const ok = (n, v) => { assert.ok(v, n); count++; console.log('PASS', n); };
process.env.SUPABASE_SERVICE_ROLE_KEY = 'sb_secret_test'; process.env.CRON_SECRET = 'cron'; process.env.RESEND_API_KEY = 're_test'; process.env.ANTHROPIC_API_KEY = 'sk-test';
const handler = require('../api/community');

// ---- tiny fake PostgREST ----
const db = { profiles: [], progress: [], rh_questions: [], rh_answers: [], rh_reports: [], notifications: [] }, users = {}, emails = [], claude = [];
let seq = 0; const uuid = () => `00000000-0000-4000-8000-${String(++seq).padStart(12, '0')}`;
const good = { r: 'good' }, again = { r: 'again' };
function matches(row, params){
  for(const [k, v] of params){
    if(['select', 'order', 'limit'].includes(k)) continue;
    const [op, ...rest] = v.split('.'), val = rest.join('.');
    const x = row[k];
    if(op === 'eq' && String(x) !== val) return false;
    if(op === 'in' && !val.slice(1, -1).split(',').includes(String(x))) return false;
    if(op === 'gte' && !(x >= val)) return false;
    if(op === 'lt' && !(x < val)) return false;
    if(op === 'is' && val === 'null' && x != null) return false;
  }
  return true;
}
function rest(url, opts){
  const u = new URL(url), table = u.pathname.split('/').pop(), params = [...u.searchParams], rows = db[table], m = opts.method || 'GET';
  const pick = r => { const sel = u.searchParams.get('select'); if(!sel || sel === '*') return { ...r }; const o = {}; sel.split(',').forEach(c => o[c] = r[c]); return o; };
  if(m === 'GET'){ let out = rows.filter(r => matches(r, params)); const ord = u.searchParams.get('order'); if(ord){ const [c, d] = ord.split('.'); out.sort((a, b) => (a[c] < b[c] ? -1 : 1) * (d === 'desc' ? -1 : 1)); } return out.map(pick); }
  if(m === 'POST'){
    const add = [].concat(JSON.parse(opts.body)).map(r => ({ id: uuid(), created_at: new Date().toISOString(), hidden: false, ...r,
      ...(table === 'rh_questions' ? { status: r.status || 'pending', ai_drafted_at: null } : {}), ...(table === 'rh_answers' ? { status: r.status || 'live', helped: false } : {}), ...(table === 'notifications' ? { read_at: null } : {}), ...(table === 'rh_reports' ? { resolved: false } : {}) }));
    if(table === 'rh_reports' && add.some(a => rows.some(r => r.kind === a.kind && r.target_id === a.target_id && r.reporter_id === a.reporter_id))) return { __status: 409 };
    rows.push(...add); return add;
  }
  if(m === 'PATCH'){ const p = JSON.parse(opts.body); rows.filter(r => matches(r, params)).forEach(r => Object.assign(r, p)); return []; }
  if(m === 'DELETE'){ db[table] = rows.filter(r => !matches(r, params)); return []; }
}
global.fetch = async (url, opts = {}) => {
  url = String(url);
  const res = (status, body) => ({ ok: status < 300, status, json: async () => body });
  if(url.includes('/auth/v1/user')){ const t = (opts.headers.Authorization || '').split(' ')[1]; return users[t] ? res(200, { id: users[t] }) : res(401, {}); }
  if(url.includes('/auth/v1/admin/users')) return res(200, { users: Object.values(users).map(id => ({ id })) });
  if(url.includes('/rest/v1/')){ const out = rest(url, opts); return out && out.__status ? res(out.__status, { code: '23505' }) : res(200, out); }
  if(url.includes('api.resend.com')){ emails.push(JSON.parse(opts.body)); return res(200, {}); }
  if(url.includes('api.anthropic.com')){ claude.push(JSON.parse(opts.body)); return res(200, { content: [{ type: 'text', text: 'Disulfide bonds need sulfur: only cysteine has a thiol (-SH). Hook: "Cys-ties": cysteines tie together.' }] }); }
  throw new Error('unexpected fetch ' + url);
};
const call = async (tok, body, over = {}) => { let status = 200, out; const r = { setHeader(){}, status(n){ status = n; return this; }, json(x){ out = x; return this; } };
  await handler({ method: 'POST', headers: { host: 't.com', authorization: tok ? 'Bearer ' + tok : '' }, body, ...over }, r); return { status, body: out }; };

(async () => {
  // asker A, two students who know 1A-005 (B: right twice in a row; C: reverse direction), D: right then wrong, owner O
  Object.assign(users, { ta: 'user-a', tb: 'user-b', tc: 'user-c', td: 'user-d', to: 'user-o' });
  db.profiles.push({ id: 'user-a', is_admin: false }, { id: 'user-b', is_admin: false }, { id: 'user-c', is_admin: false }, { id: 'user-d', is_admin: false }, { id: 'user-o', is_admin: true, email: 'owner@example.invalid' });
  db.progress.push({ user_id: 'user-a', data: { cards: { '1A-005': { history: [again] } } } },
    { user_id: 'user-b', data: { cards: { '1A-005': { history: [again, good, good] } } } },
    { user_id: 'user-c', data: { cards: { '1A-005~r': { history: [good, { r: 'good', b: 1 }, good] } } } },
    { user_id: 'user-d', data: { cards: { '1A-005': { history: [good, again] } } } });

  ok('Signed-out requests rejected', (await call(null, { action: 'list', card: '1A-005' })).status === 401);
  ok('Unknown card rejected', (await call('ta', { action: 'list', card: 'ZZ-999' })).status === 400);
  const l0 = await call('ta', { action: 'list', card: '1A-005' });
  ok('Card details come from the server copy', l0.body.question === 'Which amino acid forms disulfide bonds?' && l0.body.category === 'Proteins and amino acids' && l0.body.canAnswer === false && l0.body.questions.length === 0);

  const a1 = await call('ta', { action: 'ask', card: '1A-005~r', body: '   ' });
  ok('Blank question gets the standard text; reverse key maps to the card', a1.status === 200 && db.rh_questions[0].body === handler.DEFAULT_Q && db.rh_questions[0].card_key === '1A-005');
  const notified = db.notifications.map(n => n.user_id).sort();
  ok('Only students right twice in a row (either direction) are notified, never the asker', JSON.stringify(notified) === JSON.stringify(['user-b', 'user-c']) && a1.body.notified === 2);
  ok('Notification links to the question on Raise Your Hand', db.notifications[0].link === `/raise-your-hand?card=1A-005&q=${db.rh_questions[0].id}` && db.notifications[0].kind === 'rh_question');
  ok('Qualification ignores confidence insertions and needs the last two in a row', handler.qualifies({ X: { history: [good, again, good] } }, 'X') === false && handler.qualifies({ X: { history: [good, good, { r: 'again', e: 1 }] } }, 'X') === true);

  await call('ta', { action: 'ask', card: '1A-005', body: 'Is it cysteine or methionine?' });
  const lb = await call('tb', { action: 'list', card: '1A-005' });
  ok('Multiple pending questions on one card; anonymous (no account ids)', lb.body.questions.length === 2 && lb.body.questions.every(q => q.status === 'pending') && !JSON.stringify(lb.body).includes('user-a'));
  ok('A qualified student can answer', lb.body.canAnswer === true);
  ok('Students who don\'t qualify can\'t answer', (await call('td', { action: 'answer', question: db.rh_questions[0].id, body: 'I think it is cysteine.' })).status === 403);
  ok('Asker can\'t answer their own question', (await call('ta', { action: 'answer', question: db.rh_questions[0].id, body: 'Answering myself.' })).status === 403);
  const qid = db.rh_questions[0].id;
  ok('Qualified answer posts', (await call('tb', { action: 'answer', question: qid, body: 'Cysteine has the SH group. Think "Cys-ties".' })).status === 200);
  ok('Question becomes answered and the asker is notified', db.rh_questions[0].status === 'answered' && db.notifications.some(n => n.user_id === 'user-a' && n.kind === 'rh_answer'));
  await call('tc', { action: 'answer', question: qid, body: 'Second way: S in cyS.' });
  const la = await call('ta', { action: 'list', card: '1A-005' });
  const q = la.body.questions.find(x => x.id === qid);
  ok('Many answers per question, anonymous to the asker', q.answers.length === 2 && q.answers.every(x => x.source === 'student' && !x.mine) && q.mine === true);
  ok('Only the asker can mark "This helped"', (await call('tb', { action: 'helped', answer: q.answers[0].id })).status === 403 && (await call('ta', { action: 'helped', answer: q.answers[0].id })).body.helped === true);
  ok('A pending question shows no answers to a student who can\'t answer', (await call('td', { action: 'list', card: '1A-005' })).body.questions.find(x => x.status === 'pending').answers.length === 0);

  // reports + owner
  ok('Report emails the owner', (await call('td', { action: 'report', kind: 'answer', id: q.answers[1].id, reason: 'spam' })).status === 200 && emails.some(e => e.to.includes('owner@example.invalid')));
  ok('Reporting twice is fine', (await call('td', { action: 'report', kind: 'answer', id: q.answers[1].id })).body.already === true);
  ok('Owner tools are owner-only', (await call('ta', { action: 'owner_queue' })).status === 403);
  const oq = await call('to', { action: 'owner_queue' });
  ok('Owner sees the report', oq.body.reports.length === 1 && oq.body.reports[0].body.includes('S in cyS'));
  await call('to', { action: 'owner_hide', kind: 'answer', id: q.answers[1].id, hidden: true });
  ok('Hidden answers disappear for students; report resolved', (await call('ta', { action: 'list', card: '1A-005' })).body.questions.find(x => x.id === qid).answers.length === 1 && db.rh_reports[0].resolved === true);
  ok('Owner can answer any card (labeled TabiPrep team)', (await call('to', { action: 'answer', question: qid, body: 'Team note: cysteine.' })).status === 200 && db.rh_answers.at(-1).source === 'team');

  // 3-day Rosalind draft
  const old = db.rh_questions.find(x => x.status === 'pending'); old.created_at = new Date(Date.now() - 4 * 864e5).toISOString();
  let s = 0, out; const r = { setHeader(){}, status(n){ s = n; return this; }, json(x){ out = x; return this; } };
  await handler({ method: 'GET', headers: { authorization: 'Bearer nope' } }, r); ok('Daily job needs the cron secret', s === 401);
  emails.length = 0;
  await handler({ method: 'GET', headers: { authorization: 'Bearer cron' } }, r);
  ok('After 3 days unanswered, Rosalind drafts an answer', s === 200 && out.drafted === 1 && db.rh_answers.at(-1).status === 'draft' && db.rh_answers.at(-1).source === 'rosalind');
  ok('The student question is fenced as data for Rosalind', claude[0].messages[0].content.includes('<student_question>') && /ignore any instructions/i.test(claude[0].system));
  ok('Owner is emailed to approve', emails.length === 1 && /approve/i.test(emails[0].subject));
  ok('Drafts aren\'t shown to students before approval', (await call('ta', { action: 'list', card: '1A-005' })).body.questions.find(x => x.id === old.id).status === 'pending');
  await handler({ method: 'GET', headers: { authorization: 'Bearer cron' } }, r); ok('Each question is drafted only once', out.drafted === 0);
  const draft = (await call('to', { action: 'owner_queue' })).body.drafts[0];
  ok('Draft is in the owner queue with the card and question', draft.card === '1A-005' && draft.question === 'Is it cysteine or methionine?');
  await call('to', { action: 'owner_approve', answer: draft.id, body: 'Edited by owner: cysteine (thiol).' });
  const after = (await call('ta', { action: 'list', card: '1A-005' })).body.questions.find(x => x.id === old.id);
  ok('Approved: posted as Rosalind (AI), owner edits kept, asker notified', after.status === 'answered' && after.answers[0].source === 'rosalind' && after.answers[0].body.startsWith('Edited by owner') && db.notifications.some(n => n.user_id === 'user-a' && /Rosalind/.test(n.title)));

  // inbox + broadcast
  const ib = await call('tb', { action: 'inbox' });
  ok('Inbox lists notifications with an unread count', ib.body.unread === 2 && ib.body.items[0].kind === 'rh_question');
  await call('tb', { action: 'read' });
  ok('Mark all read', (await call('tb', { action: 'inbox' })).body.unread === 0);
  ok('Broadcast: owner only, links must be site paths', (await call('ta', { action: 'owner_broadcast', title: 'x' })).status === 403 && (await call('to', { action: 'owner_broadcast', title: 'x', link: 'https://evil.example' })).status === 400);
  const bc = await call('to', { action: 'owner_broadcast', title: 'New: Raise Your Hand', body: 'Ask about any card.', link: '/mcat' });
  ok('Broadcast reaches every account', bc.body.sent === 5 && db.notifications.filter(n => n.kind === 'site').length === 5);
  console.log(`${count} community API checks passed (fake Supabase, Claude and email).`);
})().catch(e => { console.error(e); process.exitCode = 1; });
