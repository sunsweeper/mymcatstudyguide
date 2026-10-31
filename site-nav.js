/* Phone and tablet navigation for the public pages: a Log in link and a menu button in the header.
   The menu is built from the page's own nav links, so it always matches the desktop nav. */
(() => {
  'use strict';
  const header = document.querySelector('header.nav'), nav = header && header.querySelector('.navlinks');
  if(!nav) return;
  // Courses: first in the nav on every page, and kept in the header bar on phones (next to Log in).
  const COURSES = [['MCAT', '/mcat', 'Available now'], ['Spanish', '/spanish', 'Beta: practice deck']];
  const courses = document.createElement('div');
  courses.className = 'nav-courses';
  courses.innerHTML = `<button type="button" class="nav-courses-top" aria-expanded="false" aria-controls="coursesMenu">Courses <span aria-hidden="true">▾</span></button>
    <div class="nav-courses-menu" id="coursesMenu" hidden>${COURSES.map(([t, h, d]) => `<a href="${h}"><b>${t}</b><small>${d}</small></a>`).join('')}<span class="soon">More exams coming soon</span></div>`;
  nav.prepend(courses);
  const cBtn = courses.querySelector('button'), cMenu = courses.querySelector('.nav-courses-menu');
  const cSet = open => { cMenu.hidden = !open; cBtn.setAttribute('aria-expanded', String(open)); };
  let hoverAt = 0;   // a click right after the mouse opened it keeps it open
  cBtn.onclick = e => { e.stopPropagation(); cSet(Date.now() - hoverAt < 600 ? true : cMenu.hidden); };
  courses.addEventListener('mouseenter', () => { if(matchMedia('(hover:hover)').matches){ if(cMenu.hidden) hoverAt = Date.now(); cSet(true); } });
  courses.addEventListener('mouseleave', () => { if(matchMedia('(hover:hover)').matches) cSet(false); });
  document.addEventListener('click', e => { if(!courses.contains(e.target)) cSet(false); });
  document.addEventListener('keydown', e => { if(e.key === 'Escape' && !cMenu.hidden){ cSet(false); cBtn.focus(); } });
  const style = document.createElement('style');
  style.textContent = `
.nav-courses{position:relative;display:inline-flex}
.nav-courses-top{background:none;border:0;padding:6px 0;cursor:pointer;font:inherit;color:inherit;display:inline-flex;align-items:center;gap:4px}
.nav-courses-top span{font-size:9px}
.nav-courses-top:hover,.nav-courses-top[aria-expanded=true]{color:#f0adbd}
.nav-courses-top:focus-visible{outline:2px solid #f0adbd;outline-offset:3px;border-radius:4px}
.nav-courses-menu{position:absolute;left:-14px;top:100%;margin-top:10px;min-width:230px;background:#13241c;border:1px solid #2f4a3a;border-radius:12px;padding:6px;z-index:60;box-shadow:0 18px 40px #0007}
.nav-courses-menu[hidden]{display:none}
.nav-courses-menu a{display:flex!important;flex-direction:column;gap:2px;padding:10px 12px;border-radius:8px;color:#f8f6ef;text-decoration:none}
.nav-courses-menu a:hover{background:#1c3428;color:#f0adbd}
.nav-courses-menu b{font:700 15px 'DM Sans',sans-serif}.nav-courses-menu small{font:500 12px 'DM Sans',sans-serif;color:#9fb3a6}
.nav-courses-menu .soon{display:block;padding:8px 12px 10px;font:500 12px 'DM Sans',sans-serif;color:#7f958a;border-top:1px solid #2f4a3a;margin-top:4px}
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
  header.nav .navlinks .nav-courses{display:inline-flex!important;font-weight:700;font-size:14px;color:#f8f6ef;margin-right:6px}
  header.nav .navlinks .nav-courses-menu{left:50%;right:auto;transform:translateX(-50%)}
  header.nav .wrap{gap:12px}
  header.nav .navlinks{margin-left:auto}
}
@media(max-width:600px){header.nav .navlinks>.btn{display:none!important}header.nav .wrap{gap:8px}header.nav .navlinks{gap:10px}header.nav .navlinks .nav-courses{margin-right:0}}
@media(max-width:420px){header.nav .brand-logo{height:70px!important}.nav-burger{width:42px;height:42px}}`;
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
    else if(el.classList.contains('nav-courses')) el.querySelectorAll('a').forEach(a => { const x = document.createElement('a'); x.href = a.getAttribute('href'); x.textContent = a.querySelector('b').textContent + ' prep'; panel.append(x); });
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
