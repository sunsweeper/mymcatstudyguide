/* Spanish Foundations practice: flip cards in the browser. Read the English, write the Spanish, flip to check.
   Checking forgives capitals, punctuation (¿¡.,!?), a leading article (el/la/los/las/un/una), and missing accents (full credit; the accented spelling is shown).
   After a typed answer a popup says Congratulations, or Almost got it plus the reason (article, spelling, word order, missing/extra word, another card's word).
   Position, category and score are kept in this browser only. No account, nothing sent anywhere. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const KEY = 'tabi-spanish';
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]));
  let all = [], deck = [], pos = 0, flipped = false, checked = null, score = { right: 0, seen: 0 }, cat = '', order = null;
  const saved = (() => { try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch(e){ return {}; } })();
  const persist = () => { try { localStorage.setItem(KEY, JSON.stringify({ cat, pos, order })); } catch(e){} };
  const ARTS = ['el','la','los','las','un','una','unos','unas'], MASC = ['el','los','un','unos'];
  const clean = s => String(s || '').toLowerCase().replace(/[¿¡.,!?;:"“”'’()]/g, ' ').replace(/\s+/g, ' ').trim();
  const artOf = s => { const w = clean(s).split(' ')[0]; return ARTS.includes(w) && clean(s).includes(' ') ? w : ''; };
  const base = s => clean(s).replace(/^(el|la|los|las|un|una|unos|unas)\s+/, '');
  const plain = s => base(s).normalize('NFD').replace(/[̀-ͯ]/g, '');
  function dist(a, b){ const d = Array.from({ length: a.length + 1 }, (_, i) => [i]); for(let j = 1; j <= b.length; j++) d[0][j] = j;
    for(let i = 1; i <= a.length; i++) for(let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i-1][j] + 1, d[i][j-1] + 1, d[i-1][j-1] + (a[i-1] === b[j-1] ? 0 : 1)
      , i > 1 && j > 1 && a[i-1] === b[j-2] && a[i-2] === b[j-1] ? d[i-2][j-2] + 1 : 99);
    return d[a.length][b.length]; }
  const q = s => `“${s}”`;
  // Why an answer is wrong, from the most specific reason to the least. Missing accents never cost credit (most keyboards can't type them).
  function grade(input, card){
    const answers = [card.a, ...card.alt], pi = plain(input), res = (ok, reason) => ({ kind: ok ? 'ok' : 'no', title: ok ? 'Congratulations!' : 'Almost got it.', reason, answer: card.a });
    if(!pi) return null;
    const hit = answers.find(a => plain(a) === pi);
    if(hit){
      const ia = artOf(input), ha = artOf(hit);
      if(ia && ha && ia !== ha && MASC.includes(ia) !== MASC.includes(ha)) return res(false, `Right word, wrong article. ${q(base(hit))} is ${MASC.includes(ha) ? 'masculine' : 'feminine'}, so it takes ${q(ha)}, not ${q(ia)}.`);
      if(ia && ha && ia !== ha) return res(false, `Right word, wrong article: it's ${q(ha)}, not ${q(ia)}.`);
      return res(true, base(hit) === base(input) ? 'You got it exactly.' : `You got it. With accents it's written ${q(hit)}.`);
    }
    const iw = pi.split(' ');
    let best = null;
    for(const a of answers){ const pa = plain(a), d = dist(pi, pa); if(!best || d < best.d) best = { a, pa, d }; }
    const aw = best.pa.split(' '), realW = base(best.a).split(' ');
    if(iw.length === aw.length && [...iw].sort().join(' ') === [...aw].sort().join(' ')) return res(false, `Right words, wrong order. It's ${q(best.a)}.`);
    if(best.d <= Math.max(1, Math.floor(best.pa.length / 5))){
      if(iw.length === aw.length){ const bad = aw.map((w, i) => w !== iw[i] ? i : -1).filter(i => i >= 0);
        if(bad.length === 1) return res(false, `Spelling: you wrote ${q(iw[bad[0]])}, it's spelled ${q(realW[bad[0]])}.`); }
      return res(false, `Spelling slip. It's spelled ${q(best.a)}.`);
    }
    const other = all.find(c => c !== card && [c.a, ...c.alt].some(a => plain(a) === pi));
    if(other) return res(false, `${q(other.a)} means ${q(other.q)}. For ${q(card.q)} it's ${q(card.a)}.`);
    const missing = realW.filter((w, i) => !iw.includes(aw[i])), extra = iw.filter(w => !aw.includes(w));
    if(missing.length && missing.length < aw.length && !extra.length) return res(false, `You're missing ${missing.map(q).join(' and ')}. It's ${q(best.a)}.`);
    if(extra.length && extra.length < iw.length && !missing.length) return res(false, `Drop ${extra.map(q).join(' and ')}. It's just ${q(best.a)}.`);
    if(missing.length && missing.length < aw.length) return res(false, `Part of it is right. It's ${q(best.a)}.`);
    return res(false, `Not this one. ${q(card.q)} is ${q(card.a)}.`);
  }
  function popup(g){
    const m = $('spPop');
    m.className = 'sp-pop ' + g.kind;
    $('spPopTitle').textContent = g.title; $('spPopReason').textContent = g.reason;
    $('spPopAns').textContent = g.answer; m.hidden = false; $('spPopNext').focus();
  }
  const closePop = () => { $('spPop').hidden = true; };
  function build(){
    deck = all.filter(c => !cat || c.cat === cat);
    if(order && order.length === deck.length){ const byId = Object.fromEntries(deck.map(c => [c.id, c])); const d = order.map(id => byId[id]).filter(Boolean); if(d.length === deck.length) deck = d; }
    if(pos >= deck.length) pos = 0;
  }
  function draw(){
    const c = deck[pos]; if(!c) return;
    $('spPos').textContent = `${pos + 1} / ${deck.length}`;
    $('spScore').textContent = `${score.right} of ${score.seen} correct`;
    $('spFlip').textContent = flipped ? 'Show English' : 'Flip card';
    $('spCard').setAttribute('aria-label', flipped ? 'Answer side. Activate to show the English' : 'Question side. Activate to flip');
    $('spCard').innerHTML = `<div class="sp-top"><span class="sp-side">${flipped ? 'Spanish' : 'English'}</span><span class="sp-cat">${esc(c.cat)} · ${esc(c.lvl)}</span></div>` +
      (flipped ? `<p class="sp-hint">${esc(c.q)}</p><p class="sp-answer" lang="es">${esc(c.a)}</p>${c.alt.length ? `<p class="sp-alt">Also: <span lang="es">${c.alt.map(esc).join(' · ')}</span></p>` : ''}${c.ex ? `<p class="sp-ex"><span lang="es">${esc(c.ex)}</span><i>${esc(c.exEn)}</i></p>` : ''}`
        : `<p class="sp-prompt">${esc(c.q)}</p><p class="sp-hint">Write it in Spanish, then flip.</p>`) + `<span class="sp-id">${esc(c.id)}</span>`;
    const r = $('spResult'); r.hidden = !checked; if(checked){ r.className = 'sp-result ' + checked.kind; r.textContent = checked.title + ' ' + checked.reason; }
  }
  function flip(){
    if(!flipped && !checked){ const g = grade($('spInput').value, deck[pos]); if(g){ checked = g; score.seen++; if(g.kind === 'ok') score.right++; flipped = true; draw(); popup(g); return; } }
    flipped = !flipped; draw();
  }
  function move(d){ closePop(); pos = (pos + d + deck.length) % deck.length; flipped = false; checked = null; $('spInput').value = ''; persist(); draw(); $('spInput').focus(); }
  function shuffle(){ order = deck.map(c => c.id).sort(() => Math.random() - .5); build(); pos = 0; flipped = false; checked = null; $('spInput').value = ''; persist(); draw(); }
  $('spCard').onclick = flip;
  $('spCard').onkeydown = e => { if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); flip(); } };
  $('spFlip').onclick = flip; $('spNext').onclick = () => move(1); $('spPrev').onclick = () => move(-1); $('spShuffle').onclick = shuffle;
  $('spPopNext').onclick = () => move(1); $('spPopClose').onclick = () => { closePop(); $('spInput').focus(); };
  $('spPop').onclick = e => { if(e.target.id === 'spPop') closePop(); };
  $('spPop').onkeydown = e => { if(e.key === 'Escape') closePop(); };
  $('spForm').onsubmit = e => { e.preventDefault(); if(flipped) move(1); else flip(); };
  document.addEventListener('keydown', e => { if(e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || !$('spPop').hidden) return; if(e.key === 'ArrowRight') move(1); if(e.key === 'ArrowLeft') move(-1); });
  $('spCat').onchange = e => { cat = e.target.value; order = null; pos = 0; build(); flipped = false; checked = null; $('spInput').value = ''; persist(); draw(); };
  fetch('/courses/spanish/cards.json').then(r => r.json()).then(d => {
    all = d.cards;
    const cats = [...new Set(all.map(c => c.cat))];
    $('spCat').insertAdjacentHTML('beforeend', cats.map(c => `<option value="${esc(c)}">${esc(c)} (${all.filter(x => x.cat === c).length})</option>`).join(''));
    if(saved.cat && cats.includes(saved.cat)){ cat = saved.cat; $('spCat').value = cat; }
    order = Array.isArray(saved.order) ? saved.order : null; pos = Number(saved.pos) || 0;
    build(); draw();
  }).catch(() => { $('spCard').innerHTML = '<p class="sp-hint">The cards couldn’t load. Check your connection and refresh.</p>'; });
  window.TabiSpanish = { grade, base, plain };
})();
