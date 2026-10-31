'use strict';
// Decks load from the server only after sign-in: nothing public carries the cards, and /api/deck checks the account.
const assert = require('node:assert/strict'), fs = require('fs'), path = require('path'), os = require('os'), { execFileSync } = require('child_process');
const create = require('../tools/preview-server');
let count = 0; const ok = (n, v) => { assert.ok(v, n); count++; console.log('PASS', n); };
const root = path.join(__dirname, '..');
const call = async (handler, req) => { let status = 200, out; const res = { setHeader(){}, status(n){ status = n; return this; }, json(x){ out = x; return this; } }; await handler(req, res); return { status, out }; };
(async () => {
  const exported = require('../tools/export-deck').build(fs.readFileSync(path.join(root, 'index.html'), 'utf8'));
  ok('private/decks/mcat.json matches the cards in index.html (run node tools/export-deck.js after editing cards)', JSON.stringify(exported) === fs.readFileSync(path.join(root, 'private/decks/mcat.json'), 'utf8'));
  // The deploy step strips the published page
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'strip-')), copy = path.join(tmp, 'index.html');
  fs.copyFileSync(path.join(root, 'index.html'), copy);
  execFileSync('node', [path.join(root, 'tools/strip-deck.js'), path.relative(root, copy)], { cwd: root });
  const stripped = fs.readFileSync(copy, 'utf8');
  const sample = exported.cards.filter((c, i) => i % 50 === 0).map(c => c[2].slice(0, 40));
  ok('Published page has no card answers, reverse sides or explanations', sample.every(a => !stripped.includes(a)) && !stripped.includes('Primary structure of a protein') && !stripped.includes('competitive inhibitor competes'));
  ok('...and is much smaller', stripped.length < fs.statSync(path.join(root, 'index.html')).size * 0.8);
  const build = JSON.parse(fs.readFileSync(path.join(root, 'vercel.json'))).buildCommand;
  ok('Deploys run the strip step', /node tools\/strip-deck\.js/.test(build));
  // Public paths
  const server = create(); await new Promise(r => server.listen(0, '127.0.0.1', r)); const base = `http://127.0.0.1:${server.address().port}`;
  try {
    const st = async u => (await fetch(base + u)).status;
    for(const u of ['/private/decks/mcat.json', '/private/spanish-cards.json', '/answer-keys/cards.json', '/answer-keys/keys.json', '/answer-keys/demo.json', '/answer-keys/src/keys00.txt', '/docs/flashcards.csv', '/protected/visual/reference-index.html', '/metadata/cards.json', '/tests/harness.js', '/tools/card-data.js'])
      ok(`Not public: ${u}`, await st(u) === 404);
    ok('Still public: the answer matcher the demos use', await st('/answer-keys/match.js') === 200);
    ok('/api/deck without signing in: refused', await st('/api/deck?course=mcat') === 401);
  } finally { server.close(); }
  // The API itself
  const deck = require('../api/deck'), realFetch = global.fetch;
  let who = null; global.fetch = async () => ({ ok: !!who, json: async () => who });
  const get = (course, tok = 'tok') => call(deck, { method: 'GET', url: '/api/deck?course=' + course, query: { course }, headers: tok ? { authorization: 'Bearer ' + tok } : {} });
  try {
    who = null; ok('Bad or expired token: 401', (await get('mcat')).status === 401);
    who = { id: 'u1', user_metadata: {} }; let r = await get('mcat');
    ok('Signed in (account from before courses): the MCAT deck, with its answer keys', r.status === 200 && r.out.cards.length === exported.cards.length && r.out.keys && Object.keys(r.out.keys.keys).length > 1000);
    who = { id: 'u2', user_metadata: { courses: ['spanish'] } }; ok('Not enrolled in MCAT: 403', (await get('mcat')).status === 403);
    ok('Unknown course: 400', (await get('french')).status === 400);
    who = { id: 'u3', user_metadata: { courses: ['mcat'] } }; let n = 0, last; for(let i = 0; i < 32; i++){ last = await get('mcat'); if(last.status === 200) n++; }
    ok('Limited downloads per account per hour', n === 30 && last.status === 429);
  } finally { global.fetch = realFetch; }
  console.log(`${count} deck protection checks passed.`);
})().catch(e => { console.error(e); process.exitCode = 1; });
