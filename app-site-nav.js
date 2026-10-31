/* The public site's navigation in the app header, so every page has the same top nav:
   Courses ▾ · How it Works · Community · About Us ▾ (and Log in · Sign up free when signed out).
   Styles are in app-site-shell.css. Wide screens: links in the header. Narrower screens: the same links in the
   ☰ / account menu, at the top when signed out and just above Log out when signed in. */
(() => {
  'use strict';
  // Keep in step with COURSES in site-nav.js (tests/app-site-nav.test.js checks they match).
  const COURSES = [['MCAT', '/mcat', 'Available now'], ['Spanish', '/spanish', 'Beta: practice deck']];
  const ABOUT = [['About our AI', '/about-rosalind'], ['Contact Us', '/contact']];
  const LINKS = [['Courses', '/#courses'], ['How it Works', '/how-it-works'], ['Community', '/community'], ['About Us', '/about-us']];
  const MENU_EXTRA = [['MCAT prep', '/mcat'], ['Spanish (beta)', '/spanish'], ['About our AI', '/about-rosalind'], ['Contact Us', '/contact']];
  const nav = document.querySelector('.topbar .topnav'), menu = document.getElementById('menu');
  if(!nav || !menu) return;
  const drop = (id, label, href, items) => `<div class="sl-drop" data-drop="${id}"><button type="button" class="sl-top" aria-expanded="false" aria-controls="sl-${id}" data-href="${href}">${label} <span aria-hidden="true">▾</span></button>
    <div class="sl-menu" id="sl-${id}" hidden>${items}</div></div>`;
  const bar = document.createElement('nav');
  bar.className = 'sitelinks'; bar.setAttribute('aria-label', 'TabiPrep site');
  bar.innerHTML = drop('courses', 'Courses', '/#courses', COURSES.map(([t, h, d]) => `<a href="${h}"><b>${t}</b><small>${d}</small></a>`).join('') + '<span class="soon">More exams coming soon</span>')
    + '<a href="/how-it-works">How it Works</a><a href="/community">Community</a>'
    + drop('about', 'About Us', '/about-us', '<a href="/about-us">About Us</a>' + ABOUT.map(([t, h]) => `<a href="${h}">${t}</a>`).join(''))
    + '<a class="sl-login" href="/login">Log in</a><a class="sl-signup" href="/signup">Sign up free</a>';
  nav.prepend(bar);
  // Dropdowns: open on hover (mouse) or click/tap; Escape or a click elsewhere closes.
  const drops = [...bar.querySelectorAll('.sl-drop')];
  const set = (d, open) => { d.querySelector('.sl-menu').hidden = !open; d.querySelector('.sl-top').setAttribute('aria-expanded', String(open)); };
  drops.forEach(d => {
    let hoverAt = 0;
    d.querySelector('.sl-top').onclick = e => { e.stopPropagation(); const m = d.querySelector('.sl-menu'); drops.forEach(o => o !== d && set(o, false)); set(d, Date.now() - hoverAt < 600 ? true : m.hidden); };
    d.addEventListener('mouseenter', () => { if(matchMedia('(hover:hover)').matches){ if(d.querySelector('.sl-menu').hidden) hoverAt = Date.now(); set(d, true); } });
    d.addEventListener('mouseleave', () => { if(matchMedia('(hover:hover)').matches) set(d, false); });
  });
  document.addEventListener('click', e => { drops.forEach(d => { if(!d.contains(e.target)) set(d, false); }); });
  document.addEventListener('keydown', e => { if(e.key === 'Escape') drops.forEach(d => { if(!d.querySelector('.sl-menu').hidden){ set(d, false); d.querySelector('.sl-top').focus(); } }); });

  const group = document.createElement('div');
  group.className = 'menu-site';
  group.innerHTML = LINKS.concat(MENU_EXTRA).map(([t, h]) => `<a class="menu-item" href="${h}">${t}</a>`).join('');
  menu.prepend(group);
  const style = document.createElement('style');
  style.textContent = `
.menu-site{display:none}
.menu-site .menu-item{text-decoration:none;box-sizing:border-box}
.menu-site .menu-item::before{display:none}
@media (max-width:1240px){html:not(.signed-out) .menu-site{display:block;border-top:1px solid var(--line);margin-top:6px;padding-top:6px}}
@media (max-width:1000px){.menu-site{display:block;border-bottom:1px solid var(--line);margin-bottom:6px;padding-bottom:6px}}`;
  document.head.append(style);
  const sync = () => {
    const out = typeof sbUser === 'undefined' || !sbUser, logout = document.getElementById('mOut');
    document.documentElement.classList.toggle('signed-out', out);
    if(out){ if(menu.firstElementChild !== group) menu.prepend(group); }
    else if(logout && group.nextElementSibling !== logout) logout.before(group);
  };
  const base = render;
  render = function(){ base(); sync(); };
  sync();
})();
