/* Previous: look back at cards already graded this session, without changing anything.
   Grades and stats stay exactly as saved. Each card shows the question, the answer, what was written and the grade.
   Undoing a grade is a separate, explicitly labelled action, offered only for the most recent card
   (it uses the app's existing undo, previousCard, which puts that card back to be graded again). */
(() => {
  'use strict';
  if(typeof previousCard !== 'function' || typeof undo === 'undefined') return;
  const $ = id => document.getElementById(id);
  const LABEL = { good: 'Known', hard: 'Struggled', again: "Didn't know" };
  const bg = document.createElement('div');
  bg.className = 'study-modal-bg'; bg.id = 'lookBack'; bg.hidden = true;
  bg.innerHTML = `<div class="study-modal lb" role="dialog" aria-modal="true" aria-labelledby="lbTitle" tabindex="-1">
    <button class="study-close" id="lbClose" type="button" aria-label="Close">×</button>
    <span class="study-eyebrow" id="lbEyebrow">LOOKING BACK</span>
    <h2 id="lbTitle"></h2>
    <div class="lb-q" id="lbQ"></div>
    <div class="lb-a"><span class="lb-lab">Answer</span><div id="lbA"></div></div>
    <div class="lb-you" id="lbYouWrap"><span class="lb-lab">What you wrote</span><div id="lbYou"></div></div>
    <p class="lb-grade" id="lbGrade"></p>
    <div class="lb-nav"><button class="btn" id="lbEarlier" type="button">← Earlier card</button><button class="btn" id="lbLater" type="button">Later card →</button></div>
    <button class="btn primary lb-back" id="lbBack" type="button">Back to my current card</button>
    <div class="lb-undo" id="lbUndoWrap"><button class="link" id="lbUndo" type="button">Undo this grade</button>
      <span>Takes this grade back out of your stats and shows the card again so you can grade it again.</span></div>
  </div>`;
  document.body.append(bg);
  const css = document.createElement('style');
  css.textContent = `
.lb .lb-q{font:600 22px/1.3 'Playfair Display',serif;margin:0 0 16px}
.lb .lb-lab{display:block;font:700 11px 'DM Sans',sans-serif;letter-spacing:1.3px;text-transform:uppercase;color:#9d6276;margin-bottom:4px}
.lb .lb-a,.lb .lb-you{border-top:1px solid #dcd2c4;padding:12px 0}
.lb .lb-w{margin:0 0 8px;white-space:pre-wrap}.lb .lb-w small{display:block;font-size:12px;color:#6b7d71}
.lb .lb-grade{margin:8px 0 16px;font-weight:700}
.lb .lb-grade b{display:inline-block;border-radius:999px;padding:2px 10px;margin-left:6px}
.lb .lb-grade b.good{background:#8dc5a1}.lb .lb-grade b.hard{background:#d3b69c}.lb .lb-grade b.again{background:#d5768d}
.lb .lb-nav{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px}
#lookBack .lb .btn{font:700 14px 'DM Sans',sans-serif;min-height:46px;border-radius:12px;color:#17251d;background:transparent;border:1px solid #6a8a79;cursor:pointer}
#lookBack .lb .btn:hover{background:#efe6d8;border-color:#a34f69}
.lb .btn:disabled{opacity:.4;cursor:default}
#lookBack .lb .btn.primary{width:100%;background:#a7dcb4;border-color:#a7dcb4}#lookBack .lb .btn.primary:hover{background:#c4eacb}
.lb .lb-undo{margin-top:16px;font-size:13px;color:#5f7565;text-align:center}
.lb .lb-undo .link{display:block;margin:0 auto 4px;background:none;border:0;padding:0;color:#a34f69;font:700 14px 'DM Sans',sans-serif;text-decoration:underline;cursor:pointer}`;
  document.head.append(css);

  let at = 0, returnTo = null;   // at: 0 = most recent graded card, 1 = the one before, ...
  const textOf = key => {
    const id = idOf(key), c = BY_ID[id], rev = isRevKey(key), rv = rev ? REVERSE[id] : null;
    if(!c) return { q: '<i>This card is no longer available.</i>', a: '' };
    return { q: rev ? (rv[0] || c[2]) : c[1], a: rev ? rv[1] : c[2] };
  };
  // The rating this undo entry stands for: the first history entry added after the snapshot taken before it was graded.
  function entryFor(u){
    const h = (st(u.key) && st(u.key).history) || [];
    const before = u.card && u.card.history ? u.card.history.length : 0;
    return h[Math.min(before, h.length - 1)] || h[h.length - 1] || null;
  }
  function draw(){
    const u = undo[undo.length - 1 - at]; if(!u){ close(); return; }
    const t = textOf(u.key), e = entryFor(u), wrote = e && (e.p || e.w);
    $('lbTitle').textContent = at === 0 ? 'The card you just graded' : `${at + 1} cards back`;
    $('lbQ').innerHTML = t.q; $('lbA').innerHTML = t.a;
    $('lbYouWrap').hidden = !wrote;
    $('lbYou').innerHTML = e ? [[e.p, 'Before the flip'], [e.w, 'After grading, in the adaptive learning box']].filter(x => x[0])
      .map(([t, l]) => `<p class="lb-w"><small>${l}</small>${esc(t)}</p>`).join('') : '';
    $('lbGrade').innerHTML = e ? `Your grade:<b class="${e.r}">${LABEL[e.r] || e.r}</b>` : '';
    $('lbEarlier').disabled = at >= undo.length - 1; $('lbLater').disabled = at === 0;
    $('lbUndoWrap').hidden = at !== 0;
  }
  function open(){
    if(!undo.length || (typeof flipping !== 'undefined' && flipping)) return;
    at = 0; returnTo = document.activeElement; bg.hidden = false; draw(); $('lbBack').focus();
  }
  function close(){ bg.hidden = true; if(returnTo && returnTo.isConnected) returnTo.focus(); }
  $('lbClose').onclick = close; $('lbBack').onclick = close;
  $('lbEarlier').onclick = () => { at++; draw(); };
  $('lbLater').onclick = () => { at--; draw(); };
  $('lbUndo').onclick = () => { bg.hidden = true; previousCard(); };
  bg.addEventListener('click', e => { if(e.target === bg) close(); });
  bg.addEventListener('keydown', e => { if(e.key === 'Escape'){ e.preventDefault(); close(); } });
  const wire = () => {
    const p = $('prev'); if(p){ p.onclick = open; p.disabled = !undo.length; }
    const d = $('prevDone'); if(d) d.onclick = open;
  };
  const base = render;
  render = function(){ base(); wire(); if(!bg.hidden && !undo.length) close(); };
  wire();
  window.TabiLookBack = { open, close };
})();
