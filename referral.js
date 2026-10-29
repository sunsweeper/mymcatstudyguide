/* Referral sign-up: tabiprep.com/referral opens sign-up with a 23% banner and "who referred you" fields.
   No automatic discount: the new account's details and the referrer's go to the owner by email (same inbox as card reports),
   and the owner applies the discounts. A referrer's discount is capped at 23% off their next order however many people they refer. */
(() => {
  'use strict';
  const KEY = 'tabi-referral';
  let on = !!window.__referralEntry; try { on = on || sessionStorage.getItem(KEY) === '1'; } catch(e){}   // set at the top of the page, before the URL is tidied
  if(!on){ window.TabiReferral = null; return; }
  const v = { first:'', last:'', email:'' };
  let switched = !window.__referralEntry;   // open the sign-up form once, only when arriving on /referral
  const style = document.createElement('style');
  style.textContent = `.referral-banner{background:#f6d4dc;color:#3a1f29;border:1px solid #d98ea2;border-radius:12px;padding:14px 16px;font:700 1.05rem/1.4 "DM Sans",sans-serif;text-align:center;margin:0 0 6px}
.referral-banner small{display:block;font-weight:500;font-size:.85rem;margin-top:4px}
.referrer{border:1px solid var(--line);border-radius:var(--r);padding:12px 14px;display:flex;flex-direction:column;gap:10px}
.referrer legend{font-size:.95rem;font-weight:700;color:var(--forest);padding:0 4px}`;
  document.head.append(style);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]));
  function inject(){
    const form = document.getElementById('authForm');
    if(!form || form.dataset.referral) return;
    form.dataset.referral = '1';
    form.insertAdjacentHTML('afterbegin', `<p class="referral-banner" id="referralBanner">23% discount for you and whoever sent this to you if you sign up today.<small>MCAT prep is free; the discount applies to future TabiPrep test prep. Tell us who sent you below.</small></p>`);
    const age = document.getElementById('aAge'), before = (age && age.closest('label')) || form.lastElementChild;   // after the journey question, before the age box
    before.insertAdjacentHTML('beforebegin', `<fieldset class="referrer" id="referrerBox"><legend>Who referred you?</legend>
      <div class="name-pair"><label class="field">Their first name<input type="text" id="rFirst" maxlength="40" autocomplete="off" value="${esc(v.first)}"></label>
      <label class="field">Their last name<input type="text" id="rLast" maxlength="40" autocomplete="off" value="${esc(v.last)}"></label></div>
      <label class="field">Their email<input type="email" id="rEmail" maxlength="254" autocomplete="off" inputmode="email" value="${esc(v.email)}"></label></fieldset>`);
    [['rFirst', 'first'], ['rLast', 'last'], ['rEmail', 'email']].forEach(([id, k]) => { document.getElementById(id).oninput = e => { v[k] = e.target.value; }; });
  }
  const base = render;
  render = function(){
    if(!switched && mode === 'auth' && authView === 'login' && !sbUser){ switched = true; authView = 'signup'; }
    base();
    if(mode === 'auth' && authView === 'signup') inject();
  };
  // The referrer's details are required on this page; checked before the normal sign-up checks run.
  document.addEventListener('submit', e => {
    if(e.target.id !== 'authForm' || !document.getElementById('referrerBox')) return;
    const f = v.first.trim(), l = v.last.trim(), m = v.email.trim();
    const problem = !f ? "Please enter the first name of the person who referred you." : !l ? "Please enter their last name." : !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(m) ? "Please enter a valid email for the person who referred you." : '';
    if(problem){ e.preventDefault(); e.stopImmediatePropagation(); showAuthMsg(problem); }
  }, true);
  // The sign-in screen may already be drawn by the time this script runs.
  if(typeof mode !== 'undefined' && mode === 'auth') render();
  window.TabiReferral = {
    data: () => ({ referred_by:{ first_name:v.first.trim(), last_name:v.last.trim(), email:v.email.trim() } }),
    // After the account is created: tell the owner (FormSubmit, same inbox as card reports).
    sent(user){
      const body = { _subject:'New TabiPrep sign-up (referral)', _template:'table', _captcha:'false',
        'New user':`${user.first} ${user.last}`.trim(), 'New user email':user.email,
        'Referred by':`${v.first.trim()} ${v.last.trim()}`, 'Referrer email':v.email.trim(),
        'Discount':'23% off the next paid TabiPrep purchase (future test prep) for both people.',
        'Note':'A referrer may refer several new users, but their discount is capped at 23% off their next order.' };
      try { fetch(REPORT_ENDPOINT, { method:'POST', headers:{ 'Content-Type':'application/json', Accept:'application/json' }, body:JSON.stringify(body) }).catch(() => {}); } catch(e){}
      try { sessionStorage.removeItem(KEY); } catch(e){}
    }
  };
})();
