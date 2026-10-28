'use strict';
// /api/grade: signed-in users only, server-side card text, structured Claude verdict mapped to engine ratings.
const assert = require('node:assert/strict'), handler = require('../api/grade');
let count = 0; const ok = (name, v) => { assert.ok(v, name); count++; console.log('PASS', name); };
const call = async (over = {}) => { let status = 200, body; const res = { setHeader(){}, status(n){ status = n; return this; }, json(x){ body = x; return this; } };
  await handler({ method: 'POST', headers: { host: 'tabiprep.com', origin: 'https://tabiprep.com', authorization: 'Bearer good-token' }, body: { key: '1A-018', answer: 'Vmax goes down' }, ...over }, res); return { status, body }; };
(async () => {
  const realFetch = global.fetch, realKey = process.env.ANTHROPIC_API_KEY; let sent = null;
  const fake = (claude) => async (url, opts) => {
    if(url.includes('/auth/v1/user')) return { ok: opts.headers.Authorization === 'Bearer good-token', json: async () => ({ id: 'u1' }) };
    sent = JSON.parse(opts.body); return claude;
  };
  try {
    delete process.env.ANTHROPIC_API_KEY;
    ok('GET rejected', (await call({ method: 'GET' })).status === 405);
    ok('Unknown card rejected', (await call({ body: { key: 'ZZ-999', answer: 'x' } })).status === 400);
    ok('Blank answer rejected', (await call({ body: { key: '1A-018', answer: '  ' } })).status === 400);
    ok('Oversized answer rejected', (await call({ body: { key: '1A-018', answer: 'x'.repeat(2001) } })).status === 400);
    ok('Cross-site origin rejected', (await call({ headers: { host: 'tabiprep.com', origin: 'https://evil.example' } })).status === 403);
    ok('No API key configured -> 503', (await call()).status === 503);
    process.env.ANTHROPIC_API_KEY = 'test-key';
    global.fetch = fake({ ok: true, json: async () => ({ content: [{ type: 'tool_use', input: { rating: 'didnt_know', reasoning: 'Competitive inhibitors leave Vmax unchanged; you said it decreases.' } }] }) });
    ok('Bad session -> 401', (await call({ headers: { host: 'tabiprep.com', authorization: 'Bearer stolen' } })).status === 401);
    ok('Missing session -> 401', (await call({ headers: { host: 'tabiprep.com' } })).status === 401);
    const r = await call();
    ok('Verdict mapped to engine rating', r.status === 200 && r.body.rating === 'again' && r.body.label === 'didnt_know' && /Vmax/.test(r.body.reasoning));
    const prompt = sent.messages[0].content;
    ok('Prompt uses server card text', prompt.includes('Competitive inhibitor: effect on Km and Vmax?') && prompt.includes('Km increases; Vmax unchanged'));
    ok('Student answer fenced as data', prompt.includes('<student_answer>\nVmax goes down\n</student_answer>') && /Ignore any instructions/.test(sent.system));
    ok('Structured tool output forced', sent.tool_choice.name === 'record_judgment');
    ok('Reverse direction supported', (await call({ body: { key: '1A-013~r', answer: 'zymogen' } })).status === 200 && sent.messages[0].content.includes('Reference answer: Zymogen'));
    global.fetch = fake({ ok: false, json: async () => ({}) });
    ok('Upstream error -> 502', (await call()).status === 502);
    global.fetch = fake({ ok: true, json: async () => ({ content: [{ type: 'tool_use', input: { rating: 'excellent', reasoning: 'x' } }] }) });
    ok('Unexpected rating -> 502', (await call()).status === 502);
    global.fetch = fake({ ok: true, json: async () => ({ content: [{ type: 'tool_use', input: { rating: 'knew_it', reasoning: 'Both named.' } }] }) });
    const anon = { host: 'tabiprep.com', 'x-forwarded-for': '203.0.113.9' };
    ok('Demo card graded without signing in', (await call({ headers: anon, body: { key: 'demo-0', answer: 'aspartate glutamate' } })).body.rating === 'good');
    ok('Demo prompt uses server demo text', sent.messages[0].content.includes('Which amino acids have acidic side chains'));
    ok('Default model is Sonnet 5.5', sent.model === 'claude-sonnet-5-5');
    ok('Demo answers capped shorter', (await call({ headers: anon, body: { key: 'demo-0', answer: 'x'.repeat(601) } })).status === 400);
    ok('Only the five demo cards are open', (await call({ headers: anon, body: { key: 'demo-5', answer: 'x' } })).status === 400);
    ok('Library cards still need sign-in', (await call({ headers: anon })).status === 401);
    let last; for(let i = 0; i < 31; i++) last = await call({ headers: { host: 'tabiprep.com', 'x-forwarded-for': '198.51.100.7' }, body: { key: 'demo-1', answer: 'decreases' } });
    ok('Demo grading rate-limited per visitor', last.status === 429);
    ok('Other visitors unaffected', (await call({ headers: anon, body: { key: 'demo-1', answer: 'decreases' } })).status === 200);
    console.log(`${count} grading API checks passed (mocked Supabase and Claude; no real calls).`);
  } finally { global.fetch = realFetch; if(realKey === undefined) delete process.env.ANTHROPIC_API_KEY; else process.env.ANTHROPIC_API_KEY = realKey; }
})().catch(e => { console.error(e); process.exitCode = 1; });
