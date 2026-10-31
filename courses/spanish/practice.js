/* Spanish Foundations practice: flip cards in the browser. Read the English, write the Spanish, flip to check.
   Checking forgives capitals, punctuation (¿¡.,!?), a leading article (el/la/los/las/un/una), and missing accents (full credit; the accented spelling is shown).
   Position, category and score are kept in this browser only. No account, nothing sent anywhere. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const KEY = 'tabi-spanish';
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]));
  let all = [], deck = [], pos = 0, flipped = false, checked = null, score = { right: 0, seen: 0 }, cat = '', order = null;
  const saved = (() => { try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch(e){ return {}; } })();
  const persist = () => { try { localStorage.setItem(KEY, JSON.stringify({ cat, pos, order })); } catch(e){} };
  const base = s => String(s || '').toLowerCase().replace(/[¿¡.,!?;:"“”'’()]/g, ' ').replace(/\s+/g, ' ').trim().replace(/^(el|la|los|las|un|una|unos|unas)\s+/, '');
  const plain = s => base(s).normalize('NFD').replace(/[̀-ͯ]/g, '');
  function grade(input, card){
    const answers = [card.a, ...card.alt];
    if(!base(input)) return null;
    if(answers.some(a => base(a) === base(input))) return { kind: 'ok', text: '¡Correcto! You got it.' };
    const hit = answers.find(a => plain(a) === plain(input));
    if(hit) return { kind: 'ok', text: `¡Correcto! With accents it's written “${hit}”.` };   // most keyboards can't type á/é/ñ easily, so accents never cost credit
    return { kind: 'no', text: `Not quite. It's “${card.a}”.` };
  }
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
    const r = $('spResult'); r.hidden = !checked; if(checked){ r.className = 'sp-result ' + checked.kind; r.textContent = checked.text; }
  }
  function flip(){
    if(!flipped && !checked){ const g = grade($('spInput').value, deck[pos]); if(g){ checked = g; score.seen++; if(g.kind === 'ok') score.right++; } }
    flipped = !flipped; draw();
  }
  function move(d){ pos = (pos + d + deck.length) % deck.length; flipped = false; checked = null; $('spInput').value = ''; persist(); draw(); $('spInput').focus(); }
  function shuffle(){ order = deck.map(c => c.id).sort(() => Math.random() - .5); build(); pos = 0; flipped = false; checked = null; $('spInput').value = ''; persist(); draw(); }
  $('spCard').onclick = flip;
  $('spCard').onkeydown = e => { if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); flip(); } };
  $('spFlip').onclick = flip; $('spNext').onclick = () => move(1); $('spPrev').onclick = () => move(-1); $('spShuffle').onclick = shuffle;
  $('spForm').onsubmit = e => { e.preventDefault(); if(flipped) move(1); else flip(); };
  document.addEventListener('keydown', e => { if(e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return; if(e.key === 'ArrowRight') move(1); if(e.key === 'ArrowLeft') move(-1); });
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
