// Package 2, Phase 2.2: the recall field asks browsers, keyboards and extensions not to help.
const { chromium } = require('playwright');
const URL = 'file://' + require('path').join(__dirname, '..', 'index.html');
let pass = 0, fail = 0; const ok = (n, c, x = "") => { c ? pass++ : fail++; console.log(c ? "PASS" : "FAIL", n, x); };
(async () => {
  const b = await chromium.launch(); const errs = [];
  for (const [w, mobile] of [[1280, false], [390, true]]) {
    const ctx = await b.newContext({ viewport:{ width:w, height:900 }, isMobile:mobile, hasTouch:mobile }); await ctx.route(/supabase/, r => r.abort()); const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
    await p.addInitScript(() => { if(!sessionStorage.getItem('seeded')){ localStorage.setItem('mcat-progress-v2', JSON.stringify({ cards:{}, newDay:{date:'',count:0}, open:{}, view:'q', tips:{off:true} })); sessionStorage.setItem('seeded','1'); } });
    await p.goto(URL); await p.click('[data-k=bb]'); await p.click('#toQuote'); await p.click('#recallBtn');
    const a = await p.evaluate(() => { const e = document.getElementById('curAnswer'), at = n => e.getAttribute(n);
      return { spell:e.spellcheck, ac:at('autocomplete'), acorr:at('autocorrect'), acap:at('autocapitalize'), capProp:e.autocapitalize, name:e.name, inForm:!!e.form, gramm:at('data-gramm'), lt:at('data-lt-active'), lp:at('data-lpignore'), op:e.hasAttribute('data-1p-ignore'), desc:document.getElementById(at('aria-describedby')).textContent,
        noteSpell:document.getElementById('noteText').spellcheck }; });
    const tag = mobile ? 'phone' : 'desktop';
    ok(`P22-1 ${tag} spellcheck off in Current Answer`, a.spell === false);
    ok(`P22-2 ${tag} autocomplete off, autocorrect off, auto-capitalization off`, a.ac === 'off' && a.acorr === 'off' && a.acap === 'off' && (a.capProp === 'off' || a.capProp === 'none' || a.capProp === ''), JSON.stringify([a.ac, a.acorr, a.acap, a.capProp]));
    ok(`P22-3 ${tag} no field name and not inside a form, so browsers have nothing to autofill from or save`, a.name === '' && a.inForm === false);
    ok(`P22-4 ${tag} grammar and password extensions asked to stay out (Grammarly, LanguageTool, LastPass, 1Password)`, a.gramm === 'false' && a.lt === 'false' && a.lp === 'true' && a.op);
    ok(`P22-5 ${tag} screen readers are told why suggestions are off (accessibility kept)`, /from memory/.test(a.desc));
    ok(`P22-6 ${tag} Notes (not a recall field) keeps spellcheck`, a.noteSpell === true);
    await p.keyboard.type('teh mitochondira makes ATP');
    ok(`P22-7 ${tag} what she types stays exactly as typed (no correction applied)`, (await p.inputValue('#curAnswer')) === 'teh mitochondira makes ATP');
    await p.keyboard.press('Control+Space'); await p.keyboard.press('ArrowDown');
    ok(`P22-8 ${tag} no suggestion list appears for previously typed answers`, await p.evaluate(() => !document.querySelector('datalist') && !document.getElementById('curAnswer').getAttribute('list')));
    await ctx.close();
  }
  ok('P22-9 no page errors', errs.length === 0, errs.join(' | '));
  await b.close(); console.log(`${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
})();
