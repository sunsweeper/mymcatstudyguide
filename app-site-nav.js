/* Sign-up and log-in screens (signed out): the public site's navigation in the app header,
   so a visitor who came from the Free trial button can get back to the rest of the site.
   Wide screens: links in the header.  Phones: the same links at the top of the ☰ menu. Signed in: hidden. */
(() => {
  'use strict';
  const LINKS = [['How it works', '/mcat/how-it-works'], ['Try it', '/mcat#demo'], ['Community', '/mcat/community'], ['Free trial', '/mcat/free-trial'], ['About Us', '/about-us']];
  const MENU_EXTRA = [['About our AI', '/about-rosalind'], ['Contact Us', '/contact']];
  const nav = document.querySelector('.topbar .topnav'), menu = document.getElementById('menu');
  if(!nav || !menu) return;
  const bar = document.createElement('div');
  bar.className = 'sitelinks'; bar.setAttribute('aria-label', 'TabiPrep site');
  bar.innerHTML = LINKS.map(([t, h]) => `<a href="${h}">${t}</a>`).join('');
  nav.prepend(bar);
  const group = document.createElement('div');
  group.className = 'menu-site';
  group.innerHTML = LINKS.concat(MENU_EXTRA).map(([t, h]) => `<a class="menu-item" href="${h}">${t}</a>`).join('');
  menu.prepend(group);
  const style = document.createElement('style');
  style.textContent = `
.sitelinks{display:none;align-items:center;gap:24px;margin-right:8px;font:500 .95rem var(--f-ui)}
.sitelinks a{color:var(--on-page);text-decoration:none;white-space:nowrap}
.sitelinks a:hover{color:var(--accent);text-decoration:underline;text-underline-offset:4px}
html.signed-out .sitelinks{display:flex}
.menu-site{display:none}
.menu-site .menu-item{text-decoration:none}
.menu-site .menu-item::before{display:none}
@media (max-width:900px){html.signed-out .sitelinks{display:none} html.signed-out .menu-site{display:block;border-bottom:1px solid var(--line);margin-bottom:6px;padding-bottom:6px}}`;
  document.head.append(style);
  const sync = () => document.documentElement.classList.toggle('signed-out', typeof sbUser === 'undefined' || !sbUser);
  const base = render;
  render = function(){ base(); sync(); };
  sync();
})();
