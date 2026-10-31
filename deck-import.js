/* Deck import: a student brings their own cards from Anki (.apkg / .colpkg) or a CSV / TSV / text file.
   - Decks are private: stored in the student's own row-level-secured Supabase table (user_decks), never shown to anyone else.
   - Imported cards are studied from the "My imported cards" tile, or shuffled into "All topics" when the student turns that on.
   - No duplicate detection: overlap with TabiPrep cards is fine.
   - Offered on the Account page, and once after sign-up as an optional step.
   Card HTML is sanitized to a few formatting tags; images, audio and links are not imported. */
(() => {
  'use strict';
  const MAX_CARDS = 5000, MAX_DECKS = 20, MAX_FIELD = 3000, MAX_FILE = 200 * 1024 * 1024, CACHE = 'tabi-decks-cache';
  const byId = id => document.getElementById(id);
  const escH = s => String(s).replace(/[&<>"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]));

  // ---------- Sanitizing ----------
  const KEEP = new Set(['B','STRONG','I','EM','U','SUB','SUP','BR','P','DIV','SPAN','UL','OL','LI','CODE','PRE','TABLE','TBODY','THEAD','TR','TD','TH','HR','S','DEL','INS','SMALL','BLOCKQUOTE','H1','H2','H3','H4']);
  const DROP = new Set(['SCRIPT','STYLE','IFRAME','OBJECT','EMBED','AUDIO','VIDEO','SOURCE','TEMPLATE','SVG','MATH','FORM','INPUT','BUTTON','TEXTAREA','SELECT','LINK','META','HEAD','TITLE','NOSCRIPT','CANVAS']);
  function clean(html){
    const doc = new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html');   // parsed inertly: nothing runs, nothing loads
    const out = document.createElement('div');
    (function walk(from, to){
      from.childNodes.forEach(n => {
        if(n.nodeType === 3){ to.append(n.nodeValue); return; }
        if(n.nodeType !== 1) return;
        const t = n.tagName;
        if(t === 'IMG'){ to.append('[image]'); return; }
        if(DROP.has(t)) return;
        if(KEEP.has(t)){ const e = document.createElement(t.toLowerCase()); to.append(e); walk(n, e); }
        else walk(n, to);   // anything else (a, font, custom tags): keep its text, drop the tag and every attribute
      });
    })(doc.body, out);
    return out.innerHTML.replace(/\[sound:[^\]]*\]/g, '').replace(/(<br>\s*){3,}/g, '<br><br>').trim();
  }
  const textOf = h => { const d = document.createElement('div'); d.innerHTML = h; return (d.textContent || '').replace(/\s+/g, ' ').trim(); };
  const looksHtml = s => /<\/?[a-z][^>]*>|&[a-z]+;|&#\d+;/i.test(s);
  const field = (s, html) => { const h = clean(html || looksHtml(s) ? String(s) : escH(s).replace(/\r?\n/g, '<br>')); return h.length > MAX_FIELD ? null : h; };

  // Anki cloze notes ({{c1::answer::hint}}): one card per cloze number, like Anki makes them.
  const CLOZE = /\{\{c(\d+)::([\s\S]*?)(?:::([\s\S]*?))?\}\}/g;
  function clozeCards(text, extra){
    const nums = [...new Set([...text.matchAll(CLOZE)].map(m => m[1]))].sort((a, b) => a - b);
    return nums.map(n => [
      text.replace(CLOZE, (m, k, ans, hint) => k === n ? `<b>[${hint ? escH(textOf(hint)) : '…'}]</b>` : ans),
      text.replace(CLOZE, (m, k, ans) => k === n ? `<b>${ans}</b>` : ans) + (extra && textOf(extra) ? '<br><br>' + extra : '')
    ]);
  }
  // Raw [front, back] pairs -> clean cards; empty sides are skipped and counted.
  function finish(pairs, html){
    const cards = []; let skipped = 0;
    for(const [f, b] of pairs){
      const raw = [String(f == null ? '' : f), String(b == null ? '' : b)];
      const list = /\{\{c\d+::/.test(raw[0]) ? clozeCards(raw[0], raw[1]) : [raw];
      for(const [q0, a0] of list){
        const q = field(q0, html), a = field(a0, html);
        if(!q || !a || !textOf(q) || !textOf(a)){ skipped++; continue; }
        cards.push([q, a]);
      }
    }
    return { cards, skipped };
  }

  // ---------- CSV / TSV / Anki "Notes in Plain Text" ----------
  function rows(text, sep){
    const out = []; let row = [], cur = '', q = false;
    for(let i = 0; i < text.length; i++){
      const c = text[i];
      if(q){ if(c === '"'){ if(text[i + 1] === '"'){ cur += '"'; i++; } else q = false; } else cur += c; continue; }
      if(c === '"' && cur === ''){ q = true; continue; }
      if(c === sep){ row.push(cur); cur = ''; continue; }
      if(c === '\n' || c === '\r'){ if(c === '\r' && text[i + 1] === '\n') i++; row.push(cur); out.push(row); row = []; cur = ''; continue; }
      cur += c;
    }
    if(cur !== '' || row.length){ row.push(cur); out.push(row); }
    return out;
  }
  function parseText(text, name){
    text = text.replace(/^﻿/, '');
    const head = {}; const lines = text.split(/\r?\n/);
    let i = 0; for(; i < lines.length && lines[i].startsWith('#'); i++){ const m = /^#([^:]+):(.*)$/.exec(lines[i]); if(m) head[m[1].trim().toLowerCase()] = m[2].trim(); }
    const body = lines.slice(i).join('\n');
    const SEPS = { tab:'\t', comma:',', semicolon:';', pipe:'|', colon:':', space:' ' };
    let sep = SEPS[(head.separator || '').toLowerCase()] || (head.separator && head.separator.length === 1 ? head.separator : null);
    if(!sep){
      const first = (body.split(/\r?\n/).find(l => l.trim()) || '');
      const best = ['\t', ';', ','].map(c => [c, first.split(c).length - 1]).sort((a, b) => b[1] - a[1])[0];
      sep = /\.tsv$/i.test(name) ? '\t' : best[1] ? best[0] : '\t';
    }
    // Anki's own columns (note type, deck, tags, guid) aren't card text.
    const skip = new Set(['notetype column', 'deck column', 'tags column', 'guid column'].map(k => Number(head[k]) - 1).filter(n => n >= 0));
    let data = rows(body, sep).filter(r => r.some(x => x.trim())).map(r => r.filter((x, j) => !skip.has(j)));
    if(data.length && /^(front|question|term|q|prompt)$/i.test((data[0][0] || '').trim()) && /^(back|answer|definition|a|response)$/i.test((data[0][1] || '').trim())) data = data.slice(1);
    if(!data.length) throw new Error('No cards were found in that file.');
    if(data.every(r => r.length < 2)) throw new Error('Each line needs a front and a back, separated by a comma, tab or semicolon.');
    return finish(data.map(r => [r[0], r[1]]), (head.html || '').toLowerCase() === 'true');
  }

  // ---------- Anki packages ----------
  const loaded = {};
  const lib = src => loaded[src] || (loaded[src] = new Promise((ok, bad) => { const s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = () => { delete loaded[src]; bad(new Error('Couldn’t load the Anki reader. Check your connection and try again.')); }; document.head.append(s); }));
  async function parseAnki(buf){
    await lib('/vendor/jszip.min.js');
    let zip; try { zip = await JSZip.loadAsync(buf); } catch(e){ throw new Error('That file isn’t a readable Anki package.'); }
    let db = null, file = null;
    for(const n of ['collection.anki21b', 'collection.anki21', 'collection.anki2']) if(zip.file(n)){ file = n; break; }
    if(!file) throw new Error('No Anki collection was found in that package.');
    let bytes = await zip.file(file).async('uint8array');
    if(file === 'collection.anki21b'){ await lib('/vendor/fzstd.min.js'); bytes = fzstd.decompress(bytes); }
    await lib('/vendor/sql-wasm.js');
    const SQL = await initSqlJs({ locateFile: f => '/vendor/' + f });
    try {
      db = new SQL.Database(bytes);
      const res = db.exec('select flds from notes order by id');
      const notes = res.length ? res[0].values.map(v => String(v[0]).split('\x1f')) : [];
      if(notes.length === 1 && /update to the latest anki|please update/i.test(notes[0].join(' '))) throw new Error('This package was made for a newer Anki. In Anki, export again as "Anki Deck Package" and tick "Support older Anki versions", or export "Notes in Plain Text".');
      if(!notes.length) throw new Error('No cards were found in that file.');
      return finish(notes.map(f => [f[0], f.slice(1).find(x => textOf(clean(x))) || '']), true);
    } finally { if(db) db.close(); }
  }

  async function parseFile(file){
    if(file.size > MAX_FILE) throw new Error('That file is too large to import (200 MB maximum).');
    const name = file.name || 'deck';
    const out = /\.(apkg|colpkg)$/i.test(name) ? await parseAnki(await file.arrayBuffer()) : await parseText(await file.text(), name);
    if(!out.cards.length) throw new Error('No cards with both a front and a back were found in that file.');
    out.name = name.replace(/\.(apkg|colpkg|csv|tsv|txt)$/i, '').replace(/[_]+/g, ' ').trim().slice(0, 80) || 'My deck';
    out.total = out.cards.length;
    if(out.cards.length > MAX_CARDS){ out.cut = out.cards.length - MAX_CARDS; out.cards = out.cards.slice(0, MAX_CARDS); }
    return out;
  }

  // ---------- The student's decks ----------
  let decks = [], who = null, loading = null, loadedOk = false, notSetUp = false, msg = '', preview = null, busy = false, confirmDel = null;
  const toCards = list => list.flatMap(d => (d.cards || []).map((c, i) => ['mine', c[0], c[1], `U${d.code}-${i + 1}`, d.name]));
  function apply(){
    setUserCards(toCards(decks));
    try { if(who) localStorage.setItem(CACHE, JSON.stringify({ uid:who, cards:USER_CARDS })); else localStorage.removeItem(CACHE); } catch(e){}
  }
  async function load(){
    if(!sbUser) return;
    const uid = sbUser.id;
    try {
      const { data, error } = await sb.from('user_decks').select('code,name,cards,created_at').order('created_at', { ascending:true });
      if(sbUser && sbUser.id !== uid) return;
      if(error){ notSetUp = /PGRST205|42P01|does not exist|schema cache/i.test((error.code || '') + ' ' + (error.message || '')); return; }
      notSetUp = false; loadedOk = true; decks = data || []; apply(); render();
    } catch(e){}
  }
  // Called after every render: notice a sign-in (load that account's decks) or a sign-out (forget them on this device).
  function watch(){
    const uid = sbUser && sbUser.id;
    if(uid && uid !== who){
      let cached = null; try { cached = JSON.parse(localStorage.getItem(CACHE) || 'null'); } catch(e){}
      who = uid; decks = []; loadedOk = false; if(!(cached && cached.uid === uid)) setUserCards([]);
      loading = load();
    } else if(!uid && who){ who = null; decks = []; apply(); }
  }
  const code = () => { const a = 'abcdefghijklmnopqrstuvwxyz0123456789', r = crypto.getRandomValues(new Uint8Array(6)); return Array.from(r, x => a[x % 36]).join(''); };
  async function saveDeck(name, cards){
    const row = { code:code(), name:name.slice(0, 80) || 'My deck', cards };
    const { error } = await sb.from('user_decks').insert(row);
    if(error) throw new Error(/PGRST205|42P01|does not exist|schema cache/i.test((error.code || '') + ' ' + (error.message || '')) ? 'Deck import isn’t switched on yet. Please try again later.' : /limit/i.test(error.message || '') ? `You can keep up to ${MAX_DECKS} decks. Delete one to import another.` : 'Your deck couldn’t be saved right now. Please try again.');
    await load();
    return row;
  }
  async function remove(c){
    const { error } = await sb.from('user_decks').delete().eq('code', c);
    if(error) throw new Error('That deck couldn’t be deleted right now. Please try again.');
    // Sessions that still list its cards would point at nothing: close them.
    const gone = id => id.startsWith('U' + c + '-');
    Object.keys(progress.open || {}).forEach(k => { const o = progress.open[k]; if(o && (o.ids || []).some(key => gone(idOf(key)))) delete progress.open[k]; });
    Object.keys(progress.bookmarks || {}).forEach(id => { if(gone(id)) delete progress.bookmarks[id]; });
    if(progress.retired) Object.keys(progress.retired).forEach(id => { if(gone(id)) delete progress.retired[id]; });
    window.save();
    await load();
  }

  // ---------- Account page section ----------
  function section(){
    const list = decks.length ? `<ul class="deck-list">${decks.map(d => `<li class="bm-row deck-row"><span class="deck-meta"><b>${escH(d.name)}</b><span class="hint-sm">${(d.cards || []).length} cards · imported ${escH(String(d.created_at || '').slice(0, 10))}</span></span>
        <button class="btn small-btn${confirmDel === d.code ? ' danger-btn' : ''}" type="button" data-deldeck="${escH(d.code)}">${confirmDel === d.code ? 'Confirm delete' : 'Delete'}</button></li>`).join('')}</ul>` : `<p class="hint-sm" style="margin:0">No imported decks yet.</p>`;
    const pv = preview ? `<div class="deck-preview" id="deckPreview" role="status"><p style="margin:0"><b>${preview.cards.length} cards</b> found in ${escH(preview.file)}.${preview.skipped ? ` ${preview.skipped} skipped (no front or back).` : ''}${preview.cut ? ` Only the first ${MAX_CARDS} are imported; ${preview.cut} more were left out.` : ''}</p>
        <div class="deck-sample"><span class="hint-sm">First card</span><div class="bm-q">${preview.cards[0][0]}</div><div class="bm-a">${preview.cards[0][1]}</div></div>
        <label class="field">Deck name<input type="text" id="deckName" maxlength="80" value="${escH(preview.name)}"></label>
        <div class="controls"><button class="btn" type="button" id="deckCancel">Cancel</button><button class="btn primary" type="button" id="deckSave"${busy ? ' disabled' : ''}>${busy ? 'Saving…' : 'Import deck'}</button></div></div>` : '';
    return `<section class="acct-sec" id="deckSec" aria-labelledby="acctDeckH"><h3 class="acct-h" id="acctDeckH">Your imported decks</h3>
      <span class="hint-sm">Bring your own cards from Anki (.apkg or .colpkg) or a CSV, TSV or text file with the front and back in the first two columns. Imported decks are private to you. Images and audio aren’t imported, and imported cards don’t have Raise Your Hand.</span>
      ${notSetUp ? `<p class="auth-msg" role="status">Deck import isn’t switched on yet. Please check back soon.</p>` : `${list}
      <label class="check"><input type="checkbox" id="deckMix"${progress.mixImports ? ' checked' : ''}${decks.length ? '' : ' disabled'}><span><b>Shuffle my imported cards into All topics</b><br><span class="hint-sm">Off: study them from the “My imported cards” tile only.</span></span></label>
      <div class="acct-inline"><label class="btn" for="deckFile" id="deckPick">Import a deck</label><input type="file" id="deckFile" accept=".apkg,.colpkg,.csv,.tsv,.txt" hidden></div>
      ${msg ? `<p class="auth-msg${msg.ok ? ' ok' : ''}" role="${msg.ok ? 'status' : 'alert'}">${escH(msg.text)}</p>` : ''}${pv}`}
    </section>`;
  }
  async function choose(file){
    if(!file) return;
    msg = { ok:true, text:'Reading your deck…' }; preview = null; render();
    try { const p = await parseFile(file); preview = Object.assign(p, { file:file.name }); msg = ''; }
    catch(e){ msg = { ok:false, text:e.message || 'That file couldn’t be read.' }; }
    render(); const n = byId('deckName'); if(n) n.focus();
  }
  function wire(){
    const f = byId('deckFile'); if(!f) return;
    f.onchange = () => choose(f.files && f.files[0]);
    const mix = byId('deckMix'); if(mix) mix.onchange = e => { progress.mixImports = !!e.target.checked; window.save(); };
    document.querySelectorAll('[data-deldeck]').forEach(b => b.onclick = async () => {
      const c = b.dataset.deldeck;
      if(confirmDel !== c){ confirmDel = c; render(); return; }
      confirmDel = null;
      try { await remove(c); msg = { ok:true, text:'Deck deleted.' }; } catch(e){ msg = { ok:false, text:e.message }; }
      render();
    });
    const cancel = byId('deckCancel'); if(cancel) cancel.onclick = () => { preview = null; msg = ''; render(); };
    const go = byId('deckSave'); if(go) go.onclick = async () => {
      if(busy || !preview) return;
      if(decks.length >= MAX_DECKS){ msg = { ok:false, text:`You can keep up to ${MAX_DECKS} decks. Delete one to import another.` }; render(); return; }
      busy = true; const name = (byId('deckName').value || '').trim() || preview.name, n = preview.cards.length; render();
      try { await saveDeck(name, preview.cards); preview = null; msg = { ok:true, text:`Imported ${n} cards into “${name}”. Study them from “My imported cards” on your dashboard.` }; }
      catch(e){ msg = { ok:false, text:e.message }; }
      busy = false; render();
    };
  }
  function inject(){
    if(mode !== 'account' || !sbUser || byId('deckSec')) return;
    const anchor = byId('acctRetH') ? byId('acctRetH').closest('section') : byId('logoutBtn') && byId('logoutBtn').closest('.controls');
    if(!anchor) return;
    anchor.insertAdjacentHTML('beforebegin', section());
    wire();
    // /account#decks (the homepage's "Import from your Account page" link): go straight to this section.
    if(location.hash === '#decks'){ history.replaceState(null, '', location.pathname + location.search); setTimeout(() => { const s = byId('deckSec'); if(s) s.scrollIntoView({ block:'start' }); }, 50); }
  }

  // ---------- Optional step after sign-up (shown once per account) ----------
  const offer = document.createElement('div');
  offer.className = 'study-modal-bg'; offer.id = 'deckOffer'; offer.hidden = true;
  offer.innerHTML = `<div class="study-modal" role="dialog" aria-modal="true" aria-labelledby="deckOfferTitle" tabindex="-1">
    <span class="study-eyebrow">ONE MORE STEP · OPTIONAL</span>
    <h2 id="deckOfferTitle">Have your own flashcards?</h2>
    <p>Import a deck from Anki or a CSV file and study it alongside TabiPrep’s cards. Your deck stays private to you. You can always do this later from your Account page.</p>
    <div class="session-actions"><button class="btn" type="button" id="deckOfferNo">Not now</button><button class="btn primary" type="button" id="deckOfferYes">Import a deck</button></div></div>`;
  document.body.append(offer);
  const style = document.createElement('style');
  style.textContent = `.deck-list{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:10px}.deck-row{align-items:center}.deck-meta{display:flex;flex-direction:column;gap:2px;min-width:0;overflow-wrap:anywhere}
.deck-preview{border:1px solid var(--line);border-radius:var(--r);padding:12px 14px;display:flex;flex-direction:column;gap:10px}.deck-sample{display:flex;flex-direction:column;gap:4px;max-height:220px;overflow:auto}
#deckPick{cursor:pointer}.deck-preview input[type=text]{width:100%;box-sizing:border-box;font:500 16px "DM Sans",sans-serif;padding:10px 12px;border:1px solid #cdbfae;border-radius:10px;background:#fff;color:#24382d}#deckOffer .session-actions{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:18px}#deckOffer .session-actions .btn{min-height:50px;font:700 15px/1.3 "DM Sans",sans-serif}`;
  document.head.append(style);
  const offerDone = () => !!(((sbUser && sbUser.user_metadata) || {}).deck_offer);
  function markOffer(v){
    sbUser = Object.assign({}, sbUser, { user_metadata:Object.assign({}, sbUser.user_metadata, { deck_offer:v }) });
    try { sb.auth.updateUser({ data:{ deck_offer:v } }).catch(() => {}); } catch(e){}
  }
  function maybeOffer(){
    if(!offer.hidden || notSetUp || !sbUser || mode !== 'welcome' || offerDone() || decks.length || !loading) return;
    if(window.TabiSession && !window.TabiSession.isMine()) return;
    if(document.querySelector('.study-modal-bg:not([hidden]):not(#deckOffer)')) return;   // another pop-up is up
    loading.then(() => { if(loadedOk && !notSetUp && !decks.length && !offerDone() && mode === 'welcome' && offer.hidden){ offer.hidden = false; byId('deckOfferYes').focus(); } });
  }
  byId('deckOfferNo').onclick = () => { offer.hidden = true; markOffer('skipped'); };
  byId('deckOfferYes').onclick = () => { offer.hidden = true; markOffer('opened'); openAccount(); setTimeout(() => { const s = byId('deckSec'); if(s) s.scrollIntoView({ block:'start' }); const f = byId('deckFile'); if(f) f.click(); }, 50); };
  document.addEventListener('keydown', e => { if(!offer.hidden && e.key === 'Escape') byId('deckOfferNo').click(); });

  const base = render;
  render = function(){ base(); watch(); inject(); maybeOffer(); };
  if(typeof mode !== 'undefined') render();   // the account may already be open by the time this script runs
  window.TabiDecks = { parseFile, parseText, clean, list:() => decks, reload:load, notSetUp:() => notSetUp, limits:{ MAX_CARDS, MAX_DECKS, MAX_FIELD } };
})();
