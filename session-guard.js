/* One device at a time.
   The account records which browser tab is the active study session (user metadata: active_session).
   - Signing in, or clicking on a page that isn't the active one, asks: stop the session on <device> and continue here?
     Yes takes over. No signs this tab out.  (If the other session has been idle 30+ minutes, it takes over without asking.)
   - The tab that was taken over signs out on its next click (or within a minute), shows a referral note, and never saves again,
     so two devices can't overwrite each other's progress and one license can't be shared.
   - Before every save, the tab checks it's still the active one.
   Each browser tab is its own session (two tabs on one computer count as two). */
(() => {
  'use strict';
  const STALE = 30 * 60e3, BEAT = 5 * 60e3, RECHECK = 10e3;
  const byId = id => document.getElementById(id);
  const rid = () => (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2));
  const store = (s, k) => { try { let v = s.getItem(k); if(!v){ v = rid(); s.setItem(k, v); } return v; } catch(e){ return rid(); } };
  const TAB = store(sessionStorage, 'tabi-tab'), DEVICE = store(localStorage, 'tabi-device');
  function label(){
    const u = navigator.userAgent || '';
    const b = /Edg\//.test(u) ? 'Edge' : /SamsungBrowser/.test(u) ? 'Samsung Internet' : /Firefox\//.test(u) ? 'Firefox' : /Chrome\//.test(u) ? 'Chrome' : /Safari\//.test(u) ? 'Safari' : 'a browser';
    const o = /iPhone/.test(u) ? 'iPhone' : /iPad/.test(u) ? 'iPad' : /Android/.test(u) ? 'Android' : /Windows/.test(u) ? 'Windows' : /CrOS/.test(u) ? 'Chromebook' : /Mac OS X/.test(u) ? 'Mac' : /Linux/.test(u) ? 'Linux' : '';
    return o ? `${b} on ${o}` : b;
  }
  const where = s => !s ? 'another device' : s.device === DEVICE ? `another tab in this browser (${s.label})` : (s.label || 'another device');

  // ---- pop-ups ----
  const wrap = document.createElement('div');
  wrap.className = 'study-modal-bg'; wrap.id = 'sessionModal'; wrap.hidden = true;
  wrap.innerHTML = `<div class="study-modal" role="dialog" aria-modal="true" aria-labelledby="sessionTitle" tabindex="-1">
    <div id="takeoverView"><span class="study-eyebrow">ONE DEVICE AT A TIME</span>
      <h2 id="sessionTitle">You're studying on another device</h2>
      <p id="takeoverText"></p>
      <div class="session-actions"><button class="btn" id="takeoverNo" type="button">No, sign out here</button><button class="btn primary" id="takeoverYes" type="button">Yes, continue here</button></div></div>
    <div id="referView" hidden><span class="study-eyebrow">SIGNED OUT</span>
      <h2>Know anyone who could benefit from TabiPrep.com?</h2>
      <p id="referWhy"></p>
      <p>Send them this link and you'll both get a discount on your next order of TabiPrep test prep. (MCAT prep is free.)</p>
      <div class="refer-link"><input id="referUrl" readonly aria-label="Referral link"><button class="btn" id="referCopy" type="button">Copy link</button></div>
      <p class="refer-fine">Referrers can save up to 23% on their next order of TabiPrep test prep, however many friends sign up. Discounts are applied by our team.</p>
      <div class="session-actions one"><button class="btn primary" id="referClose" type="button">Close</button></div></div>
  </div>`;
  document.body.append(wrap);
  const style = document.createElement('style');
  style.textContent = `#sessionModal{z-index:400}.session-actions{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:18px}.session-actions.one{grid-template-columns:1fr}
.session-actions .btn{min-height:50px;font:700 15px/1.3 "DM Sans",sans-serif}
.refer-link{display:flex;gap:8px;margin:8px 0}.refer-link input{flex:1;min-width:0;font:500 15px "DM Sans",sans-serif;padding:10px 12px;border:1px solid #cdbfae;border-radius:10px;background:#fff;color:#24382d}
.refer-fine{font-size:13px;color:#6b7d71;margin:6px 0 0}`;
  document.head.append(style);
  const REFER_URL = location.origin + '/referral';

  let mine = false, lost = false, asking = false, checkedAt = 0, lastBeat = 0, me = null, deciding = null;
  const meta = () => ((sbUser && sbUser.user_metadata) || {}).active_session || null;
  async function fresh(){   // the account's current record of the active session (null if it can't be reached: offline keeps studying)
    try { const r = await sb.auth.getUser(); if(r && r.data && r.data.user){ sbUser = Object.assign({}, sbUser, { user_metadata:r.data.user.user_metadata || {} }); return { ok:true, s:meta() }; } } catch(e){}
    return { ok:false };
  }
  async function claim(prev){
    const s = { id:TAB, device:DEVICE, label:label(), at:Date.now(), taken_from:prev && prev.id !== TAB ? prev.id : null };
    try { await sb.auth.updateUser({ data:{ active_session:s } }); } catch(e){}
    sbUser = Object.assign({}, sbUser, { user_metadata:Object.assign({}, sbUser.user_metadata, { active_session:s }) });
    mine = true; lastBeat = Date.now(); checkedAt = Date.now();
    // Pick up anything the other device saved just before it stopped, then save once from here.
    setTimeout(async () => {
      if(!mine || !sbUser) return;
      try { const { data } = await sb.from('progress').select('data').eq('user_id', sbUser.id).maybeSingle(); if(data && data.data){ progress = normalizeProgress(mergeProgress([progress, data.data])); save(); render(); } } catch(e){}
      pushProgress();
    }, 2500);
  }
  function ask(s){
    asking = true;
    byId('takeoverText').textContent = `You're signed in on ${where(s)}. Do you want to stop the session on ${where(s)} and take over on this device?`;
    byId('takeoverView').hidden = false; byId('referView').hidden = true; wrap.hidden = false; byId('takeoverYes').focus();
    return new Promise(done => { deciding = done; });
  }
  byId('takeoverYes').onclick = async () => { const d = deciding; deciding = null; wrap.hidden = true; asking = false; await claim(meta()); d && d(true); };
  byId('takeoverNo').onclick = async () => { const d = deciding; deciding = null; wrap.hidden = true; asking = false; await signOutHere(''); d && d(false); };

  async function signOutHere(msg){
    lost = true; mine = false; clearTimeout(pushTimer);
    try { await sb.auth.signOut({ scope:'local' }); } catch(e){}   // this tab only; the active device stays signed in
    // The local copy of progress stays on this device; it's combined with the account the next time this device signs in.
    sbUser = null; profile = null; STORE = null; progress = normalizeProgress(blank()); undo = [];
    authView = 'login'; authMsg = msg || "You're signed out on this device."; authOk = true; mode = 'auth'; applyBg(); render();
    lost = false; me = null;
  }
  function referral(s){
    byId('referWhy').textContent = `You were signed out here because your account was opened on ${where(s)}. One TabiPrep account works on one device at a time.`;
    byId('referUrl').value = REFER_URL;
    byId('takeoverView').hidden = true; byId('referView').hidden = false; wrap.hidden = false; byId('referCopy').focus();
  }
  byId('referCopy').onclick = () => { const i = byId('referUrl'); i.select(); (navigator.clipboard ? navigator.clipboard.writeText(i.value) : Promise.reject()).then(() => { byId('referCopy').textContent = 'Copied'; }, () => { document.execCommand && document.execCommand('copy'); byId('referCopy').textContent = 'Copied'; }); };
  byId('referClose').onclick = () => { wrap.hidden = true; byId('referCopy').textContent = 'Copy link'; };

  // Is this tab still the active session? If not: taken over -> sign out + referral; just left open -> ask to take over.
  async function check(force){
    if(!sbUser || lost || asking) return mine;
    if(!force && Date.now() - checkedAt < RECHECK) return mine;
    checkedAt = Date.now();
    const r = await fresh(); if(!r.ok || !sbUser) return mine;
    const s = r.s;
    if(!s || s.id === TAB){ if(!s) await claim(null); else mine = true; return true; }
    if(s.taken_from === TAB){ mine = false; await signOutHere(`You're signed out here because your account was opened on ${where(s)}.`); referral(s); return false; }
    if(Date.now() - (s.at || 0) > STALE){ await claim(s); return true; }
    mine = false; return ask(s);
  }
  // Signing in on this tab (a new account load): decide before anything is saved from here.
  function watch(){
    wrapSignOut();
    const id = sbUser && sbUser.id;
    if(id && id !== me){ me = id; mine = false; checkedAt = 0; check(true); }
    if(!id) me = null;
  }

  // Saves only from the active tab: pushProgress (index.html) asks this before every save.
  async function allowSave(){
    if(!sbUser || lost) return false;
    if(mine && Date.now() - checkedAt < RECHECK) return true;
    const ok = await check(true);
    return !!ok && mine;
  }
  let wrapped = false;
  function wrapSignOut(){
    if(wrapped || typeof sb === 'undefined' || !sb || !sb.auth || typeof sb.auth.signOut !== 'function') return;
    wrapped = true;
    const so = sb.auth.signOut.bind(sb.auth);
    sb.auth.signOut = async o => { if(!(o && o.scope === 'local') && mine && sbUser){ try { await sb.auth.updateUser({ data:{ active_session:null } }); } catch(e){} } mine = false; return so(o); };
  }
  const base = render;
  render = function(){ base(); watch(); };
  document.addEventListener('click', e => { if(sbUser && !e.target.closest('#sessionModal')) check(false); }, true);
  document.addEventListener('keydown', () => { if(sbUser) check(false); }, true);
  document.addEventListener('visibilitychange', () => { if(!document.hidden && sbUser) check(true); });
  addEventListener('online', () => { if(sbUser && mine) pushProgress(); });   // back online: send what was saved on this device
  setInterval(async () => {
    if(!sbUser || document.hidden || lost || asking) return;
    await check(true);
    if(mine && Date.now() - lastBeat > BEAT){ lastBeat = Date.now(); const s = Object.assign({}, meta(), { at:Date.now() }); try { await sb.auth.updateUser({ data:{ active_session:s } }); } catch(e){} }
    if(mine && !byId('syncErr').hidden) pushProgress();   // retry a failed save while the "couldn't reach your account" notice is up
  }, 60e3);
  watch();
  window.TabiSession = { tab:TAB, device:DEVICE, label, check, allowSave, isMine:() => mine, referralUrl:REFER_URL };
})();
