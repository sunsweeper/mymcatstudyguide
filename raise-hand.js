/* Raise Your Hand + the notification bell.
   Raise Your Hand (screen "rhand", /raise-your-hand?card=ID): left, ask about the card you're on (category, card and date
   are filled in and locked; an empty question sends a standard one). Right, every question on that card: answered ones
   open to show the answers; pending ones can't be opened, except by students who can answer them.
   The bell (top right, signed in): notifications from /api/community, newest first, unread count on the bell.
   Owner Dashboard: Rosalind's drafts to approve, reported posts, and a site-wide notification sender.
   Everything goes through /api/community; posts are anonymous to other students. */
(() => {
  'use strict';
  const DEFAULT_Q = "I'm having a hard time with this one. Anyone want to share how they remember this?";
  const byId = id => document.getElementById(id);
  const escH = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]));
  const para = s => escH(s).replace(/\n/g, '<br>');
  const when = t => { const d = new Date(t); return isNaN(d) ? '' : d.toLocaleDateString(undefined, { month:'short', day:'numeric', year:'numeric' }); };
  async function token(){ try { return (await sb.auth.getSession()).data.session?.access_token || null; } catch(e){ return null; } }
  // Before someone's first question or answer: posts are anonymous and stay up to help other students, even if the
  // account is deleted later. Removing one takes an official request to TabiPrep. Agreed once (user_metadata.rh_ack).
  function ackPosting(){
    if(sbUser && sbUser.user_metadata && sbUser.user_metadata.rh_ack) return Promise.resolve(true);
    return new Promise(done => {
      const bg = document.createElement('div'); bg.className = 'study-modal-bg'; bg.id = 'rhAck';
      bg.innerHTML = `<div class="study-modal" role="dialog" aria-modal="true" aria-labelledby="rhAckTitle" tabindex="-1">
        <span class="study-eyebrow">BEFORE YOU POST</span><h2 id="rhAckTitle">Your post stays up to help others</h2>
        <p>Questions and answers on Raise Your Hand are anonymous. Once posted, they stay on TabiPrep for other students, <b>even if you later delete your account</b>.</p>
        <p>The only way to have a post removed is an official request to TabiPrep through <a href="/contact" target="_blank" rel="noopener">Contact Us</a>.</p>
        <div class="grade-actions"><button class="btn primary" type="button" id="rhAckYes">I understand, post it</button><button class="link" type="button" id="rhAckNo">Cancel</button></div></div>`;
      document.body.append(bg);
      const end = ok => { bg.remove(); if(ok){ sbUser = Object.assign({}, sbUser, { user_metadata:Object.assign({}, sbUser.user_metadata, { rh_ack:new Date().toISOString() }) }); try { sb.auth.updateUser({ data:{ rh_ack:new Date().toISOString() } }).catch(() => {}); } catch(e){} } done(ok); };
      bg.querySelector('#rhAckYes').onclick = () => end(true); bg.querySelector('#rhAckNo').onclick = () => end(false);
      bg.addEventListener('keydown', e => { if(e.key === 'Escape') end(false); });
      bg.querySelector('#rhAckYes').focus();
    });
  }
  async function api(action, body = {}){
    if((action === 'ask' || action === 'answer') && !(await ackPosting())) throw new Error('Not posted.');
    const t = await token(); if(!t) throw new Error('Please log in.');
    const r = await fetch('/api/community', { method:'POST', headers:{ 'Content-Type':'application/json', Authorization:'Bearer ' + t }, body:JSON.stringify({ action, ...body }) });
    const d = await r.json().catch(() => ({}));
    if(!r.ok) throw Object.assign(new Error(d.error || 'Something went wrong. Please try again.'), { notSetUp: !!d.notSetUp });
    return d;
  }

  // ---------- Raise Your Hand screen ----------
  let card = null, focusQ = null, data = null, loading = false, msg = null, openQ = new Set(), answering = null, busy = false, draft = '';
  try { const u = new URL(location.href); if(u.pathname.replace(/\/$/, '') === '/raise-your-hand' && u.searchParams.get('card')) sessionStorage.setItem('tabi-rh', u.search); } catch(e){}
  const keyId = k => String(k || '').replace(/~r$/, '');
  async function load(){
    if(!card) return;
    loading = true; render();
    try { data = await api('list', { card }); if(msg && !msg.ok) msg = null; }
    catch(e){ data = null; msg = { ok:false, text: e.notSetUp ? 'Raise Your Hand isn’t switched on yet. Please check back soon.' : e.message, off: e.notSetUp }; }
    loading = false;
    if(focusQ && data){ openQ.add(focusQ); const q = data.questions.find(x => x.id === focusQ); if(q && q.status === 'pending' && data.canAnswer) answering = q.id; }
    render();
    if(focusQ){ const el = byId('rhq-' + focusQ); if(el) el.scrollIntoView({ block:'center' }); focusQ = null; }
  }
  function open(key, q){
    const id = keyId(key);
    if(!id || (typeof isImported === 'function' && isImported(id))) return;
    card = id; focusQ = q || null; data = null; msg = null; openQ = new Set(); answering = null; draft = '';
    openSide('rhand'); load();
  }
  function openFromUrl(){
    let search = location.search;
    try { const saved = sessionStorage.getItem('tabi-rh'); if(!new URLSearchParams(search).get('card') && saved) search = saved; sessionStorage.removeItem('tabi-rh'); } catch(e){}
    const p = new URLSearchParams(search), c = p.get('card');
    if(c && /^[A-Z0-9]+-\d{3}$/.test(c)) open(c, p.get('q')); else show('welcome');
  }
  const path = () => card ? '/raise-your-hand?card=' + encodeURIComponent(card) : '/raise-your-hand';
  function local(){   // card details from the app's own library, shown while the server answers
    const c = typeof BY_ID !== 'undefined' && BY_ID[card];
    return c ? { category: (typeof CATEGORIES !== 'undefined' && CATEGORIES[card.split('-')[0]]) || '', question: typeof toPlain === 'function' ? toPlain(c[1]) : c[1] } : { category:'', question:'' };
  }
  function questionHTML(q){
    const open = openQ.has(q.id), answered = q.status === 'answered', canOpen = answered || q.mine || data.canAnswer;
    const n = q.answers.length;
    const head = `<span class="rh-qmeta"><span class="rh-chip ${answered ? 'ok' : 'wait'}">${answered ? `Answered${n ? ' · ' + n : ''}` : 'Pending'}</span><span>${when(q.created)}${q.mine ? ' · Your question' : ''}</span></span><span class="rh-qbody">${para(q.body)}</span>`;
    const answers = q.answers.map(a => `<li class="rh-ans${a.helped ? ' helped' : ''}"><span class="rh-who">${a.source === 'rosalind' ? 'Rosalind (AI)' : a.source === 'team' ? 'TabiPrep team' : a.mine ? 'You answered' : 'A student answered'} · ${when(a.created)}${a.helped ? ' · <b>Helped</b>' : ''}</span><p>${para(a.body)}</p>
      <span class="rh-acts">${q.mine && !a.mine ? `<button class="link" type="button" data-helped="${a.id}">${a.helped ? 'Undo “This helped”' : 'This helped'}</button>` : ''}${!a.mine ? `<button class="link rh-report" type="button" data-report="answer:${a.id}">Report</button>` : ''}</span></li>`).join('');
    const form = answering === q.id ? `<form class="rh-answer" data-answer-form="${q.id}"><label class="field">Your answer <span class="hint-sm">How do you remember it?</span><textarea id="rhAnswerText" rows="4" maxlength="2000">${escH(draft)}</textarea></label>
      <div class="controls"><button class="btn" type="button" data-cancel-answer>Cancel</button><button class="btn primary" type="submit"${busy ? ' disabled' : ''}>${busy ? 'Sending…' : 'Post answer'}</button></div></form>` : '';
    const body = open ? `<div class="rh-qdetail">${n ? `<ul class="rh-answers">${answers}</ul>` : `<p class="hint-sm" style="margin:0">No answers yet.</p>`}
      ${data.canAnswer && !q.mine && answering !== q.id ? `<button class="btn small-btn" type="button" data-start-answer="${q.id}">Answer this question</button>` : ''}${form}
      ${!q.mine ? `<button class="link rh-report" type="button" data-report="question:${q.id}">Report question</button>` : ''}</div>` : '';
    return `<li class="rh-q${canOpen ? '' : ' locked'}${open ? ' open' : ''}" id="rhq-${q.id}">${canOpen ? `<button class="rh-qhead" type="button" data-toggle="${q.id}" aria-expanded="${open}">${head}</button>` : `<div class="rh-qhead" aria-disabled="true" title="You can open this once someone answers it">${head}</div>`}${body}</li>`;
  }
  function renderRH(scr){
    const info = data ? { category:data.category, question:data.question } : local();
    const today = new Date().toLocaleDateString(undefined, { month:'long', day:'numeric', year:'numeric' });
    const list = !data ? `<p class="hint-sm">${loading ? 'Loading questions…' : ''}</p>` : data.questions.length
      ? `<ul class="rh-list">${data.questions.map(questionHTML).join('')}</ul>` : `<p class="rh-empty">No one has asked about this card yet. Be the first. Use the form to raise your hand.</p>`;
    scr.innerHTML = `<div class="rh">
      <div class="rh-top"><span class="rh-eyebrow">COMMUNITY</span><h2 class="sec-title rh-title">✋ Raise Your Hand</h2><p class="lede" style="margin:0">Stuck on a card? Ask how other students remember it. Questions and answers are anonymous.</p></div>
      ${msg ? `<p class="auth-msg${msg.ok ? ' ok' : ''}" role="${msg.ok ? 'status' : 'alert'}">${escH(msg.text)}</p>` : ''}
      <div class="rh-grid">
        <section class="rh-pane rh-ask" aria-labelledby="rhAskH"><h3 class="acct-h" id="rhAskH">Ask about this card</h3>
          <form class="auth-form" id="rhAskForm" novalidate>
            <div class="rh-fixed"><span class="lab">Category</span><span id="rhCat">${escH(info.category)}</span></div>
            <div class="rh-fixed"><span class="lab">Card ${escH(card)}</span><span id="rhCard">${escH(info.question)}</span></div>
            <div class="rh-fixed"><span class="lab">Date</span><span id="rhDate">${today}</span></div>
            <label class="field">Your question <span class="hint-sm">(optional)</span><textarea id="rhAskText" rows="4" maxlength="1000" placeholder="${escH(DEFAULT_Q)}"${msg && msg.off ? ' disabled' : ''}></textarea></label>
            <button class="btn primary" type="submit" id="rhAskBtn"${busy || (msg && msg.off) ? ' disabled' : ''}>${busy ? 'Sending…' : 'Raise my hand'}</button>
          </form>
          <p class="rh-how">Your question goes to students who have gotten this card right twice in a row, and you'll get a notification when someone answers. If no one has answered within a few days, Rosalind, our AI study companion, will step in. We really think an answer from your peers helps the most, so we give them the chance first.</p>
        </section>
        <section class="rh-pane rh-qs" aria-labelledby="rhQsH"><h3 class="acct-h" id="rhQsH">Questions on this card</h3>${list}</section>
      </div>
      <div class="controls one"><button class="btn" type="button" id="sideBack">Back to studying</button></div></div>`;
    byId('sideBack').onclick = goBack;
    byId('rhAskForm').onsubmit = async e => { e.preventDefault(); if(busy) return; busy = true; render();
      try { const r = await api('ask', { card, body: (byId('rhAskText') || {}).value || '' }); msg = { ok:true, text: r.notified ? `Your hand is up. ${r.notified} student${r.notified === 1 ? '' : 's'} who know this card were notified.` : 'Your hand is up. We’ll let you know when someone answers.' }; busy = false; await load(); }
      catch(x){ busy = false; msg = { ok:false, text:x.message, off:x.notSetUp }; render(); } };
    scr.querySelectorAll('[data-toggle]').forEach(b => b.onclick = () => { const id = b.dataset.toggle; openQ.has(id) ? openQ.delete(id) : openQ.add(id); render(); });
    scr.querySelectorAll('[data-start-answer]').forEach(b => b.onclick = () => { answering = b.dataset.startAnswer; draft = ''; render(); const t = byId('rhAnswerText'); if(t) t.focus(); });
    scr.querySelectorAll('[data-cancel-answer]').forEach(b => b.onclick = () => { answering = null; render(); });
    const t = byId('rhAnswerText'); if(t) t.oninput = () => { draft = t.value; };
    scr.querySelectorAll('[data-answer-form]').forEach(f => f.onsubmit = async e => { e.preventDefault(); if(busy) return; busy = true; render();
      try { await api('answer', { question: f.dataset.answerForm, body: draft }); answering = null; draft = ''; msg = { ok:true, text:'Thanks! Your answer is posted.' }; busy = false; await load(); }
      catch(x){ busy = false; msg = { ok:false, text:x.message }; render(); } });
    scr.querySelectorAll('[data-helped]').forEach(b => b.onclick = async () => { try { await api('helped', { answer:b.dataset.helped }); await load(); } catch(x){ msg = { ok:false, text:x.message }; render(); } });
    scr.querySelectorAll('[data-report]').forEach(b => b.onclick = async () => {
      if(b.dataset.confirm !== '1'){ b.dataset.confirm = '1'; b.textContent = 'Report it? Click again'; return; }
      const [kind, id] = b.dataset.report.split(':');
      try { await api('report', { kind, id }); b.replaceWith(Object.assign(document.createElement('span'), { className:'hint-sm', textContent:'Reported. Thanks.' })); } catch(x){ msg = { ok:false, text:x.message }; render(); } });
  }

  // ---------- Bell ----------
  const bell = document.createElement('button');
  bell.type = 'button'; bell.className = 'bell'; bell.id = 'bellBtn'; bell.hidden = true; bell.setAttribute('aria-haspopup', 'true'); bell.setAttribute('aria-expanded', 'false'); bell.setAttribute('aria-label', 'Notifications');
  bell.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M6 16V11a6 6 0 0 1 12 0v5l1.6 2H4.4L6 16zM10 20a2 2 0 0 0 4 0"/></svg><span class="bell-n" id="bellN" hidden></span>';
  const panel = document.createElement('div');
  panel.className = 'bell-panel'; panel.id = 'bellPanel'; panel.hidden = true; panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-label', 'Notifications');
  const avatar = byId('avatarBtn'); if(avatar){ avatar.before(bell); avatar.parentNode.parentNode.append(panel); }
  let inbox = { unread:0, items:[] }, inboxOff = false, lastPoll = 0;
  function drawBell(){
    const n = byId('bellN'); n.hidden = !inbox.unread; n.textContent = inbox.unread > 9 ? '9+' : String(inbox.unread);
    bell.setAttribute('aria-label', inbox.unread ? `Notifications, ${inbox.unread} unread` : 'Notifications');
    panel.innerHTML = `<div class="bell-head"><b>Notifications</b>${inbox.unread ? '<button class="link" type="button" id="bellAll">Mark all read</button>' : ''}</div>` +
      (inbox.items.length ? `<ul class="bell-list">${inbox.items.map(n => `<li><button type="button" class="bell-item${n.read ? '' : ' unread'}" data-n="${n.id}"><span class="bell-t">${escH(n.title)}</span>${n.body ? `<span class="bell-b">${escH(n.body)}</span>` : ''}<span class="bell-d">${when(n.created)}</span></button></li>`).join('')}</ul>`
        : `<p class="bell-empty">${inboxOff ? 'Notifications aren’t switched on yet.' : 'You’re all caught up.'}</p>`);
    const all = byId('bellAll'); if(all) all.onclick = async () => { try { await api('read'); inbox.items.forEach(n => n.read = true); inbox.unread = 0; drawBell(); } catch(e){} };
    panel.querySelectorAll('[data-n]').forEach(b => b.onclick = async () => {
      const n = inbox.items.find(x => x.id === b.dataset.n); if(!n) return;
      setPanel(false);
      if(!n.read){ n.read = true; inbox.unread = Math.max(0, inbox.unread - 1); drawBell(); api('read', { ids:[n.id] }).catch(() => {}); }
      if(n.link){ const u = new URL(n.link, location.origin); if(u.pathname === '/raise-your-hand') open(u.searchParams.get('card'), u.searchParams.get('q')); else location.href = u.pathname + u.search; }
    });
  }
  async function poll(force){
    if(typeof sbUser === 'undefined' || !sbUser || (!force && Date.now() - lastPoll < 110e3)) return;
    lastPoll = Date.now();
    try { inbox = await api('inbox'); inboxOff = false; } catch(e){ if(e.notSetUp) inboxOff = true; }
    drawBell();
  }
  function setPanel(open){ if(open){ const h = bell.closest('header'); if(h) panel.style.top = Math.max(8, h.getBoundingClientRect().bottom + 4) + 'px'; } panel.hidden = !open; bell.setAttribute('aria-expanded', String(open)); if(open){ drawBell(); poll(true); } }
  bell.onclick = e => { e.stopPropagation(); setPanel(panel.hidden); };
  document.addEventListener('click', e => { if(!panel.hidden && !panel.contains(e.target) && e.target !== bell) setPanel(false); });
  document.addEventListener('keydown', e => { if(e.key === 'Escape' && !panel.hidden){ setPanel(false); bell.focus(); } });
  setInterval(() => poll(false), 120e3);
  document.addEventListener('visibilitychange', () => { if(!document.hidden) poll(false); });

  // ---------- Owner Dashboard additions ----------
  let queue = null, qMsg = '';
  async function loadQueue(){ try { queue = await api('owner_queue'); } catch(e){ queue = { error: e.message }; } render(); }
  function ownerSection(){
    if(!queue) return `<section class="acct-sec" id="rhOwner"><h3 class="acct-h">Raise Your Hand</h3><p class="hint-sm">Loading…</p></section>`;
    if(queue.error) return `<section class="acct-sec" id="rhOwner"><h3 class="acct-h">Raise Your Hand</h3><p class="auth-msg">${escH(queue.error)}</p></section>`;
    const drafts = queue.drafts.map(d => `<li class="owner-row rh-draft"><span class="owner-email">${escH(d.card)} · ${escH(d.category)} · ${when(d.created)}</span><span><b>Card:</b> ${escH(d.cardQuestion)}</span><span><b>Student asked:</b> ${escH(d.question)}</span>
      <label class="field">Rosalind's draft (edit before approving)<textarea rows="4" data-draft-text="${d.id}">${escH(d.body)}</textarea></label>
      <div class="controls"><button class="btn" type="button" data-discard="${d.id}">Discard</button><button class="btn primary" type="button" data-approve="${d.id}">Approve and post</button></div></li>`).join('');
    const reports = queue.reports.map(r => `<li class="owner-row"><span class="owner-email">${r.kind} · ${r.card ? escH(r.card) + ' · ' : ''}reported ${when(r.created)}${r.reason ? ' · “' + escH(r.reason) + '”' : ''}</span><span>${para(r.body)}</span>
      <div class="controls"><button class="btn" type="button" data-hide="${r.kind}:${r.target}:${r.hidden ? 0 : 1}">${r.hidden ? 'Show it again' : 'Hide it'}</button><button class="btn" type="button" data-hide="${r.kind}:${r.target}:${r.hidden ? 1 : 0}">Keep as is (dismiss)</button></div></li>`).join('');
    return `<section class="acct-sec" id="rhOwner"><h3 class="acct-h">Raise Your Hand</h3>
      ${qMsg ? `<p class="auth-msg ok" role="status">${escH(qMsg)}</p>` : ''}
      <p class="owner-gtitle" style="margin:0">Rosalind's answers to approve <span class="owner-count">${queue.drafts.length}</span></p>
      ${drafts ? `<ul class="list">${drafts}</ul>` : `<p class="owner-empty">Nothing waiting.</p>`}
      <p class="owner-gtitle" style="margin:0">Reported posts <span class="owner-count">${queue.reports.length}</span></p>
      ${reports ? `<ul class="list">${reports}</ul>` : `<p class="owner-empty">No reports.</p>`}
      <form class="auth-form" id="broadcastForm" novalidate><p class="owner-gtitle" style="margin:0">Send a notification to everyone</p>
        <label class="field">Title<input type="text" id="bcTitle" maxlength="140"></label>
        <label class="field">Message <span class="hint-sm">(optional)</span><textarea id="bcBody" rows="3" maxlength="1000"></textarea></label>
        <label class="field">Link <span class="hint-sm">(optional, a page on the site like /mcat)</span><input type="text" id="bcLink" maxlength="300"></label>
        <button class="btn" type="submit">Send to all students</button></form></section>`;
  }
  function wireOwner(){
    document.querySelectorAll('[data-approve]').forEach(b => b.onclick = async () => { const id = b.dataset.approve, t = document.querySelector(`[data-draft-text="${id}"]`);
      try { await api('owner_approve', { answer:id, body:t ? t.value : '' }); qMsg = 'Posted. The student was notified.'; } catch(e){ qMsg = e.message; } loadQueue(); });
    document.querySelectorAll('[data-discard]').forEach(b => b.onclick = async () => { try { await api('owner_discard', { answer:b.dataset.discard }); qMsg = 'Draft discarded.'; } catch(e){ qMsg = e.message; } loadQueue(); });
    document.querySelectorAll('[data-hide]').forEach(b => b.onclick = async () => { const [kind, id, h] = b.dataset.hide.split(':');
      try { await api('owner_hide', { kind, id, hidden:h === '1' }); qMsg = 'Done.'; } catch(e){ qMsg = e.message; } loadQueue(); });
    const f = byId('broadcastForm'); if(f) f.onsubmit = async e => { e.preventDefault();
      try { const r = await api('owner_broadcast', { title:byId('bcTitle').value, body:byId('bcBody').value, link:byId('bcLink').value }); qMsg = `Sent to ${r.sent} students.`; } catch(x){ qMsg = x.message; } render(); };
  }

  const style = document.createElement('style');
  style.textContent = `
.rh{display:flex;flex-direction:column;gap:18px}.rh-eyebrow{font:800 11px var(--f-ui);letter-spacing:2px;color:var(--accent,#b75c73)}.rh-title{margin:0;text-align:left}
.rh-grid{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.2fr);gap:20px;align-items:start}
.rh-pane{border:1px solid var(--line);border-radius:var(--r);padding:18px;display:flex;flex-direction:column;gap:12px;background:var(--surface)}
.rh-fixed{display:flex;flex-direction:column;gap:2px;padding:10px 12px;border-radius:10px;background:var(--bg);border:1px dashed var(--line)}.rh-fixed .lab{font:700 11px var(--f-ui);letter-spacing:1px;text-transform:uppercase;color:var(--muted)}
.rh-how{font-size:.9rem;color:var(--muted);margin:0;line-height:1.55}
.rh-list,.rh-answers{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:10px}
.rh-q{border:1px solid var(--line);border-radius:12px;background:var(--bg)}.rh-q.locked{opacity:.7}
.rh-qhead{display:flex;flex-direction:column;gap:6px;width:100%;text-align:left;background:none;border:0;padding:12px 14px;color:inherit;font:inherit;cursor:pointer;border-radius:12px}div.rh-qhead{cursor:default}
.rh-qmeta{display:flex;gap:8px;align-items:center;flex-wrap:wrap;font-size:.85rem;color:var(--muted)}.rh-qbody{overflow-wrap:anywhere}
.rh-chip{font:800 10px var(--f-ui);letter-spacing:1px;text-transform:uppercase;border-radius:999px;padding:3px 9px}.rh-chip.ok{background:#9bd7ac;color:#14271e}.rh-chip.wait{background:#f6d4dc;color:#3a1f29}
.rh-qdetail{padding:0 14px 14px;display:flex;flex-direction:column;gap:10px}
.rh-ans{border-left:3px solid var(--line);padding:6px 0 6px 12px}.rh-ans.helped{border-left-color:#9bd7ac}.rh-ans p{margin:4px 0;overflow-wrap:anywhere}.rh-who{font-size:.82rem;color:var(--muted)}
.rh-acts{display:flex;gap:14px}.rh-report{font-size:.82rem;color:var(--muted);align-self:flex-start}.rh-empty{color:var(--muted);margin:0}
@media(max-width:760px){.rh-grid{grid-template-columns:1fr}}
.bell{position:relative;display:inline-flex;align-items:center;justify-content:center;width:40px;height:40px;border-radius:50%;background:none;border:1px solid transparent;cursor:pointer;color:var(--on-page)}
.bell:hover,.bell[aria-expanded=true]{border-color:var(--line)}.bell svg{width:22px;height:22px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
.bell-n{position:absolute;top:3px;right:2px;min-width:17px;height:17px;padding:0 4px;border-radius:9px;background:#d96e87;color:#fff;font:800 10px/17px var(--f-ui);text-align:center}
.bell-panel{position:fixed;right:12px;top:80px;z-index:300;width:min(360px,calc(100vw - 24px));max-height:70vh;overflow:auto;background:var(--surface);border:1px solid var(--line);border-radius:14px;box-shadow:0 18px 40px #0005;padding:8px}
.bell-head{display:flex;justify-content:space-between;align-items:center;padding:6px 8px 10px;border-bottom:1px solid var(--line)}
.bell-list{list-style:none;margin:0;padding:4px 0}.bell-item{display:flex;flex-direction:column;gap:3px;width:100%;text-align:left;background:none;border:0;border-radius:10px;padding:10px;cursor:pointer;color:var(--ink);font:inherit}
.bell-item:hover{background:var(--bg)}.bell-item.unread .bell-t{font-weight:700}.bell-item.unread::before{content:"";width:7px;height:7px;border-radius:50%;background:#d96e87;position:absolute;margin:6px 0 0 -6px}
.bell-t{font-size:.95rem}.bell-b{font-size:.85rem;color:var(--muted);overflow-wrap:anywhere}.bell-d{font-size:.75rem;color:var(--muted)}.bell-empty{padding:14px 8px;margin:0;color:var(--muted)}
.rh-draft textarea{width:100%;box-sizing:border-box}`;
  document.head.append(style);

  const base = render;
  render = function(){
    base();
    const signedIn = typeof sbUser !== 'undefined' && !!sbUser;
    bell.hidden = !signedIn; if(!signedIn){ panel.hidden = true; inbox = { unread:0, items:[] }; } else poll(false);
    if(mode === 'owner' && signedIn && profile && profile.is_admin){
      const scr = byId('screen'), back = byId('sideBack');
      if(scr && !byId('rhOwner')){ const at = back && back.closest('.controls'); (at || scr).insertAdjacentHTML(at ? 'afterend' : 'beforeend', ownerSection()); wireOwner(); if(!queue) loadQueue(); }
    } else if(mode !== 'owner') queue = null;
  };
  window.TabiRaiseHand = { open, openFromUrl, path, render: renderRH, poll, DEFAULT_Q };
  if(typeof mode !== 'undefined') render();
})();
