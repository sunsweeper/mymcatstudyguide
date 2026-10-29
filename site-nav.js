/* Phone and tablet navigation for the public pages: a Log in link and a menu button in the header.
   The menu is built from the page's own nav links, so it always matches the desktop nav. */
(() => {
  'use strict';
  const header = document.querySelector('header.nav'), nav = header && header.querySelector('.navlinks');
  if(!nav) return;
  const style = document.createElement('style');
  style.textContent = `
.nav-burger{display:none;flex-direction:column;justify-content:center;align-items:center;gap:5px;width:46px;height:46px;flex-shrink:0;border:1px solid #ffffff33;border-radius:10px;background:transparent;cursor:pointer;padding:0}
.nav-burger span{display:block;width:20px;height:2px;border-radius:2px;background:#f8f6ef;transition:transform .2s,opacity .2s}
.nav-burger[aria-expanded=true] span:nth-child(1){transform:translateY(7px) rotate(45deg)}.nav-burger[aria-expanded=true] span:nth-child(2){opacity:0}.nav-burger[aria-expanded=true] span:nth-child(3){transform:translateY(-7px) rotate(-45deg)}
.nav-burger:focus-visible{outline:2px solid #f0adbd;outline-offset:2px}
.mobile-menu{background:#0a1713;border-top:1px solid #ffffff14;padding:6px 22px 22px;max-height:calc(100dvh - 90px);overflow:auto}
.mobile-menu[hidden]{display:none}
.mobile-menu a{display:block;padding:14px 4px;font:600 17px/1.3 'DM Sans',sans-serif;color:#f8f6ef;text-decoration:none;border-bottom:1px solid #ffffff12}
.mobile-menu a.sub{padding-left:22px;font-weight:500;font-size:15px;color:#c7d5cb}
.mobile-menu a.login{color:#f0adbd}
.mobile-menu a.cta{margin-top:16px;border:0;border-radius:10px;background:#9bd7ac;color:#143123;text-align:center;font-weight:700}
@media(max-width:1000px){
  .nav-burger{display:flex}
  header.nav .navlinks>a:not(.btn):not(.nav-login),header.nav .navlinks .nav-drop{display:none!important}
  header.nav .navlinks .nav-login{display:inline-block!important;color:#f0adbd;font-weight:700;font-size:14px;padding:10px 4px}
  header.nav .wrap{gap:12px}
  header.nav .navlinks{margin-left:auto}
}
@media(max-width:600px){header.nav .navlinks>.btn{display:none!important}}`;
  document.head.append(style);

  const btn = document.createElement('button');
  btn.type = 'button'; btn.className = 'nav-burger'; btn.setAttribute('aria-expanded', 'false'); btn.setAttribute('aria-controls', 'mobileMenu'); btn.setAttribute('aria-label', 'Menu');
  btn.innerHTML = '<span></span><span></span><span></span>';
  const panel = document.createElement('nav');
  panel.className = 'mobile-menu'; panel.id = 'mobileMenu'; panel.hidden = true; panel.setAttribute('aria-label', 'Menu');
  const add = (a, cls) => { const x = document.createElement('a'); x.href = a.getAttribute('href'); x.textContent = a.textContent.replace('▾', '').trim(); if(cls) x.className = cls; panel.append(x); };
  let cta = null;
  for(const el of nav.children){
    if(el.classList.contains('nav-drop')){ add(el.querySelector('.nav-drop-top')); el.querySelectorAll('.nav-menu a').forEach(a => add(a, 'sub')); }
    else if(el.classList.contains('btn')) cta = el;
    else if(el.tagName === 'A') add(el, el.classList.contains('nav-login') ? 'login' : '');
  }
  if(cta) add(cta, 'cta');
  nav.after(btn); header.append(panel);
  const set = open => { panel.hidden = !open; btn.setAttribute('aria-expanded', String(open)); };
  btn.onclick = () => set(panel.hidden);
  panel.addEventListener('click', e => { if(e.target.closest('a')) set(false); });
  document.addEventListener('keydown', e => { if(e.key === 'Escape' && !panel.hidden){ set(false); btn.focus(); } });
  addEventListener('resize', () => { if(innerWidth > 1000 && !panel.hidden) set(false); });
})();
