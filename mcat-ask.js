/* "Have you scheduled your MCAT yet?" Only for signed-in students with no test date, and only on the dashboard.
   Timing (saved on the account itself, so it follows the student across devices):
   1st ask: 72 hours after the account was created, or the next time they're active after that.  Yes / Not Yet.
   2nd ask: 72 hours after the 1st.  Adds "Don't ask me again for 1 month": ticked waits a month, unticked waits a week.
   Later asks: Not Yet waits a month.  Yes opens the MCAT date screen. */
(() => {
  'use strict';
  const H = 3600e3, DAY = 24 * H, FIRST = 72 * H, SECOND = 72 * H, WEEK = 7 * DAY, MONTH = 30 * DAY, RETRY = DAY;
  const byId = id => document.getElementById(id);
  const wrap = document.createElement('div');
  wrap.id = 'mcatAskModal'; wrap.className = 'study-modal-bg'; wrap.hidden = true;
  wrap.innerHTML = `<div class="study-modal" role="dialog" aria-modal="true" aria-labelledby="mcatAskTitle" tabindex="-1">
    <button class="study-close" id="mcatAskClose" type="button" aria-label="Close">×</button>
    <span class="study-eyebrow">YOUR MCAT DATE</span>
    <h2 id="mcatAskTitle">Have you scheduled your MCAT yet?</h2>
    <p>Your test date sets the countdown and keeps reviews spaced so everything comes back before exam day.</p>
    <label class="check small" id="mcatAskMonthRow" hidden><input type="checkbox" id="mcatAskMonth"><span>Don't ask me again for 1 month.</span></label>
    <div class="mcat-ask-actions"><button class="btn" id="mcatAskNo" type="button">Not Yet</button><button class="btn primary" id="mcatAskYes" type="button">Yes</button></div>
  </div>`;
  document.body.append(wrap);
  const style = document.createElement('style');
  style.textContent = '.mcat-ask-actions{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:18px}.mcat-ask-actions .btn{min-height:50px;font:700 15px/1.3 "DM Sans",sans-serif}#mcatAskMonthRow{margin-top:6px}';
  document.head.append(style);

  // Kept in the account's metadata rather than study progress: progress merges between devices drop fields they don't know.
  let local = null;
  const state = () => { if(!local) local = Object.assign({}, (sbUser.user_metadata || {}).mcat_ask || {}); return local; };
  function save(){
    const s = Object.assign({}, local);
    sbUser = Object.assign({}, sbUser, { user_metadata: Object.assign({}, sbUser.user_metadata, { mcat_ask: s }) });
    try { if(sb) sb.auth.updateUser({ data: { mcat_ask: s } }).catch(() => {}); } catch(e){}
  }
  let who = null;
  function created(){ const t = Date.parse(sbUser && sbUser.created_at); return isNaN(t) ? Date.now() : t; }
  function due(){
    if(typeof sbUser === 'undefined' || !sbUser || !progress || progress.testDate || mode !== 'welcome') return false;
    if(window.TabiSession && !window.TabiSession.isMine()) return false;   // wait until this device is the active session
    if(who !== sbUser.id){ who = sbUser.id; local = null; }   // a different account signed in on this device
    const s = state();
    if(typeof s.next !== 'number'){ s.n = 0; s.next = created() + FIRST; save(); }
    return Date.now() >= s.next;
  }
  function close(){ wrap.hidden = true; }
  function show(){
    const s = state();
    byId('mcatAskMonthRow').hidden = s.n !== 1;   // the checkbox belongs to the 2nd ask
    byId('mcatAskMonth').checked = false;
    wrap.hidden = false; byId('mcatAskYes').focus();
  }
  function later(ms){ const s = state(); s.n = (s.n || 0) + 1; s.next = Date.now() + ms; save(); close(); }
  byId('mcatAskNo').onclick = () => {
    const s = state();
    later(s.n === 0 ? SECOND : s.n === 1 ? (byId('mcatAskMonth').checked ? MONTH : WEEK) : MONTH);
  };
  byId('mcatAskYes').onclick = () => { const s = state(); s.next = Date.now() + RETRY; save(); close(); openDate(); };   // asked again tomorrow only if no date gets saved
  byId('mcatAskClose').onclick = () => { const s = state(); s.next = Date.now() + RETRY; save(); close(); };
  wrap.addEventListener('click', e => { if(e.target === wrap) byId('mcatAskClose').click(); });
  document.addEventListener('keydown', e => { if(!wrap.hidden && e.key === 'Escape') byId('mcatAskClose').click(); });

  const base = render;
  render = function(){ base(); if(wrap.hidden && due()) show(); };
  // A student who leaves the dashboard open past the due time is asked when they come back to the tab.
  document.addEventListener('visibilitychange', () => { if(!document.hidden && wrap.hidden && due()) show(); });
  // The account may already be open by the time this script runs (a saved session loads fast).
  if(wrap.hidden && due()) show();
  window.MCATAsk = { due, show, close, state: () => sbUser ? state() : null, timing: { FIRST, SECOND, WEEK, MONTH, RETRY } };
})();
