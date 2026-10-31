'use strict';
// Demo decks: the homepage's 100-card general knowledge deck, and five server-picked sample cards per course page.
const assert = require('node:assert/strict'), M = require('../answer-keys/match.js');
let count = 0; const ok = (n, v) => { assert.ok(v, n); count++; console.log('PASS', n); };
const call = async (handler, req) => { let status = 200, out; const res = { setHeader(){}, status(n){ status = n; return this; }, json(x){ out = x; return this; } }; await handler(req, res); return { status, out }; };
(async () => {
  const gk = require('../courses/demo/general-knowledge.json').cards;
  ok('General knowledge deck: 100 cards, unique ids', gk.length === 100 && new Set(gk.map(c => c.id)).size === 100 && gk.every(c => /^gk-\d{3}$/.test(c.id)));
  ok('Every card has a topic, question, answer and key', gk.every(c => c.topic && c.sub && c.q.endsWith('?') && c.a && c.keys.length));
  ok('Every card\'s own answer passes its own key', gk.every(c => M.grade(c.a, c.keys).verdict === 'right'));
  ok('No MCAT content in the general deck', !gk.some(c => /MCAT|amino acid|enzyme/i.test(c.q)));
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'sb_secret_test';
  const demo = require('../api/demo-cards'), D = require('../api/_demo');
  const req = (course, ip = '1.2.3.4') => ({ method: 'GET', url: '/api/demo-cards?course=' + course, query: { course }, headers: { 'x-forwarded-for': ip } });
  let a = await call(demo, req('mcat')), b = await call(demo, req('mcat')), c = await call(demo, req('mcat', '5.6.7.8'));
  ok('MCAT: five cards', a.status === 200 && a.out.cards.length === 5 && new Set(a.out.cards.map(x => x.key)).size === 5);
  ok('Same visitor, same day: the same five', JSON.stringify(a.out.cards.map(x => x.key)) === JSON.stringify(b.out.cards.map(x => x.key)));
  ok('Another visitor gets a different five', JSON.stringify(a.out.cards.map(x => x.key)) !== JSON.stringify(c.out.cards.map(x => x.key)));
  ok('MCAT sample cards carry their keys and a grading token', a.out.cards.every(x => Array.isArray(x.keys) && D.tokenOk(x.key, x.t)));
  ok('A token only works for its own card', !D.tokenOk(a.out.cards[1].key, a.out.cards[0].t) && !D.tokenOk(a.out.cards[0].key, 'x.y'));
  ok('An expired token is refused', !D.tokenOk('1A-001', D.token('1A-001', Date.now() - 13 * 3600e3)));
  const s = await call(demo, req('spanish'));
  ok('Spanish: five cards with answers and alternatives', s.out.cards.length === 5 && s.out.cards.every(x => x.q && x.a && Array.isArray(x.alt)));
  ok('Unknown course refused', (await call(demo, req('french'))).status === 400);
  let n = 0, last; for(let i = 0; i < 45; i++){ last = await call(demo, req('mcat', '9.9.9.9')); if(last.status === 200) n++; }
  ok('Rate-limited per visitor', n === 40 && last.status === 429);
  // Grading without signing in: general knowledge cards, and MCAT sample cards with a valid token only
  process.env.ANTHROPIC_API_KEY = 'sk-test';
  const realFetch = global.fetch; let sent = [];
  global.fetch = async (url, o) => { sent.push(JSON.parse(o.body)); return { ok: true, json: async () => ({ content: [{ type: 'text', text: '{"rating":"struggled","reasoning":"Close."}' }] }) }; };
  const grade = require('../api/grade');
  const g = body => call(grade, { method: 'POST', headers: { host: 'x', 'x-forwarded-for': '7.7.7.7' }, body, socket: {} });
  try {
    let r = await g({ key: 'gk-001', answer: 'oxygen' });
    ok('General knowledge card graded by the AI without signing in', r.status === 200 && sent.at(-1).messages[0].content.includes('photosynthesis'));
    const k = a.out.cards[0];
    r = await g({ key: k.key, answer: 'something', demo: k.t }); ok('MCAT sample card with its token: graded without signing in', r.status === 200);
    r = await g({ key: '1A-001', answer: 'something' }); ok('Any other MCAT card still needs sign-in', r.status === 401);
    r = await g({ key: k.key, answer: 'something', demo: 'forged.token' }); ok('Forged token: needs sign-in', r.status === 401);
  } finally { global.fetch = realFetch; }
  console.log(`${count} demo deck checks passed.`);
})().catch(e => { console.error(e); process.exitCode = 1; });
