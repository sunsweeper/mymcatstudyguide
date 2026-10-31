'use strict';
// Raise Your Hand screen and the notification bell, against a mocked /api/community.
const { chromium } = require('playwright'), assert = require('node:assert/strict'), create = require('../tools/preview-server');
let count = 0; const ok = (n, v) => { assert.ok(v, n); count++; console.log('PASS', n); };
const mock = admin => `(()=>{const user={id:'rh-fixture',email:'f@example.invalid',created_at:new Date().toISOString(),user_metadata:{first_name:'Ada',deck_offer:'x'}};const s={user,access_token:'tok'};
window.supabase={createClient:()=>({auth:{onAuthStateChange(){},async getSession(){return {data:{session:s}}},async getUser(){return {data:{user}}},async updateUser(){return {data:{user},error:null}},async signOut(){return {}}},
 from(t){return {select(){return this},eq(){return this},order(){return this},update(){return this},async maybeSingle(){return {data:t==='profiles'?{first_name:'Ada',is_admin:${admin}}:null,error:null}},async upsert(){return {error:null}},then(a){return Promise.resolve({data:[],error:null}).then(a)}}},async rpc(){return {data:null,error:null}}})};})();`;
(async () => {
  const server = create(); await new Promise(r => server.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${server.address().port}`, browser = await chromium.launch(), errors = [];
  try {
    const state = { questions: [{ id: 'q-old', body: 'How do you remember the S?', status: 'answered', created: '2026-10-01T10:00:00Z', mine: false, answers: [{ id: 'a1', body: 'Cys-ties: cysteines tie together.', source: 'student', helped: false, created: '2026-10-02T10:00:00Z', mine: false }] },
      { id: 'q-pend', body: 'Pending one from someone else', status: 'pending', created: '2026-10-20T10:00:00Z', mine: false, answers: [] }],
      inbox: { unread: 1, items: [{ id: 'n1', kind: 'rh_answer', title: 'Someone answered your question on 1A-005', body: 'Open it', link: '/raise-your-hand?card=1A-005&q=q-old', read: false, created: '2026-10-29T10:00:00Z' }] }, calls: [] };
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 1000 }, reducedMotion: 'reduce' });
    await ctx.route('**/supabase.js', r => r.fulfill({ contentType: 'text/javascript', body: mock(true) }));
    await ctx.route('**/api/grade', r => r.fulfill({ status: 503, body: '{}' }));
    await ctx.route('**/api/community', async r => {
      const b = r.request().postDataJSON(); state.calls.push(b);
      const send = (x, s = 200) => r.fulfill({ status: s, contentType: 'application/json', body: JSON.stringify(x) });
      if(b.action === 'list') return send({ card: '1A-005', category: 'Proteins and amino acids', question: 'Which amino acid forms disulfide bonds?', canAnswer: false, questions: state.questions });
      if(b.action === 'ask'){ state.questions.unshift({ id: 'q-new', body: b.body.trim() || "I'm having a hard time with this one. Anyone want to share how they remember this?", status: 'pending', created: new Date().toISOString(), mine: true, answers: [] }); return send({ ok: true, id: 'q-new', notified: 3 }); }
      if(b.action === 'inbox') return send(state.inbox);
      if(b.action === 'read'){ state.inbox.items.forEach(n => n.read = true); state.inbox.unread = 0; return send({ ok: true }); }
      if(b.action === 'owner_queue') return send({ drafts: [{ id: 'd1', body: 'Rosalind draft text', card: '1A-005', category: 'Proteins and amino acids', cardQuestion: 'Which amino acid forms disulfide bonds?', question: 'Help?', created: '2026-10-29T10:00:00Z' }], reports: [] });
      if(b.action === 'owner_approve'){ state.approved = b; return send({ ok: true }); }
      if(b.action === 'report'){ state.reported = b; return send({ ok: true }); }
      send({ error: 'unknown' }, 400);
    });
    const p = await ctx.newPage(); p.on('pageerror', e => errors.push(e.message));
    await p.goto(base + '/login'); await p.waitForURL('**/dashboard');

    // Bell
    await p.waitForFunction(() => !document.getElementById('bellN').hidden);
    ok('Bell in the header with the unread count', await p.isVisible('#bellBtn') && (await p.textContent('#bellN')) === '1');

    // From a card: Raise Your Hand
    await p.click('[data-k=bb]'); await p.click('#toQuote'); await p.waitForFunction(() => mode === 'cards');
    await p.evaluate(() => { deck[pos] = '1A-005'; progress.open.bb.ids = deck.slice(); resetCard(); render(); });
    ok('Raise Your Hand button is live (no "planned")', (await p.textContent('#raiseHand')).trim() === '✋ Raise Your Hand');
    await p.click('#raiseHand'); await p.waitForSelector('.rh-list');
    ok('Opens the Raise Your Hand screen for that card', await p.evaluate(() => mode === 'rhand') && new URL(p.url()).pathname === '/raise-your-hand' && new URL(p.url()).searchParams.get('card') === '1A-005');
    ok('Category, card and today\'s date are filled in and not editable', (await p.textContent('#rhCat')) === 'Proteins and amino acids' && (await p.textContent('#rhCard')) === 'Which amino acid forms disulfide bonds?'
      && (await p.textContent('#rhDate')) === await p.evaluate(() => new Date().toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })) && (await p.locator('#rhAskForm input').count()) === 0);
    ok('Process explained, including Rosalind stepping in', (await p.textContent('.rh-how')).includes('Rosalind') && (await p.textContent('.rh-how')).includes('right twice in a row'));
    ok('Pending questions can\'t be opened by students who can\'t answer', (await p.locator('#rhq-q-pend button.rh-qhead').count()) === 0 && (await p.textContent('#rhq-q-pend')).includes('Pending'));
    await p.click('#rhq-q-old .rh-qhead');
    ok('Answered questions open to show answers (anonymous)', (await p.textContent('#rhq-q-old')).includes('Cys-ties') && (await p.textContent('#rhq-q-old')).includes('A student answered'));
    await p.click('#rhAskBtn'); await p.waitForSelector('#rhAck');
    ok('First post: notice that posts stay up after account deletion and removal takes a request', (await p.textContent('#rhAck')).includes('even if you later delete your account') && (await p.textContent('#rhAck')).includes('official request') && !state.calls.some(c => c.action === 'ask'));
    await p.click('#rhAckYes'); await p.waitForSelector('#rhq-q-new');
    ok('Submitting with no text sends the standard question', state.calls.find(c => c.action === 'ask').body === '' && (await p.textContent('#rhq-q-new')).includes("I'm having a hard time with this one"));
    ok('It shows as Pending, marked as yours, with a confirmation', (await p.textContent('#rhq-q-new')).includes('Pending') && (await p.textContent('#rhq-q-new')).includes('Your question') && (await p.textContent('.rh .auth-msg')).includes('3 students'));
    await p.click('#sideBack'); await p.waitForFunction(() => mode === 'cards');
    ok('Back returns to the same card', await p.evaluate(() => curKey === '1A-005'));

    // Notification opens the question
    await p.click('#bellBtn'); await p.waitForSelector('#bellPanel:not([hidden]) .bell-item');
    await p.click('.bell-item'); await p.waitForFunction(() => mode === 'rhand'); await p.waitForSelector('#rhq-q-old.open');
    ok('Clicking a notification opens that question on Raise Your Hand and marks it read', state.calls.some(c => c.action === 'read') && (await p.textContent('#bellN').catch(() => '')) !== '1');

    // Owner dashboard: Rosalind drafts
    await p.evaluate(() => { openSide('owner'); loadOwner(); }); await p.waitForSelector('#rhOwner [data-approve]');
    await p.fill('[data-draft-text="d1"]', 'Owner-edited answer'); await p.click('[data-approve="d1"]');
    await p.waitForFunction(() => document.querySelector('#rhOwner .auth-msg'));
    ok('Owner approves (with edits) Rosalind\'s draft from the dashboard', state.approved && state.approved.body === 'Owner-edited answer');
    ok('Owner can send a site-wide notification', await p.isVisible('#broadcastForm'));

    // Imported cards: no Raise Your Hand
    ok('Imported cards never open Raise Your Hand', await p.evaluate(() => { const before = mode; TabiRaiseHand.open('Uab12cd-1'); return mode === before; }));
    ok('No JavaScript errors', errors.length === 0);
    console.log(`${count} Raise Your Hand checks passed.`);
  } catch (e) { console.error(e); if (errors.length) console.error(errors); process.exitCode = 1; }
  finally { await browser.close(); server.close(); }
})();
